import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '~/lib/logger';
import { type EnhanceError, enhanceRequestSchema } from '~/schemas/enhance';

const DEFAULT_LLM_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_LLM_MODEL = 'deepseek-v4-flash';

// Reject oversized bodies before spending CPU/memory parsing them. The valid
// payload (≤100KB text + bounded boxes) fits comfortably under this; anything
// larger is rejected at the door instead of being JSON-parsed and Zod-walked.
const MAX_BODY_BYTES = 2 * 1024 * 1024;

export const enhance = new Hono();

enhance.post('/', async (c) => {
  const contentLength = Number(c.req.header('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return c.json<EnhanceError>(
      { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' },
      413
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<EnhanceError>({ code: 'INVALID_REQUEST', message: 'Body is not JSON' }, 400);
  }

  const parsed = enhanceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<EnhanceError>(
      { code: 'INVALID_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid request' },
      400
    );
  }

  const { text, boxes, prompt } = parsed.data;

  const env = (c.env ?? {}) as Record<string, string | undefined>;
  const apiKey = env['LLM_API_KEY'] ?? env['DEEPSEEK_API_KEY'];
  if (!apiKey) {
    return c.json<EnhanceError>(
      { code: 'CONFIG_ERROR', message: 'LLM API key not configured' },
      500
    );
  }

  const upstream = await fetch(env['LLM_API_BASE_URL'] ?? DEFAULT_LLM_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: env['LLM_MODEL'] ?? DEFAULT_LLM_MODEL,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You clean OCR text. Preserve the source language, correct obvious OCR errors, restore line breaks and simple structure, and do not invent missing content.',
        },
        {
          role: 'user',
          content: buildDefaultPrompt(text, boxes, prompt),
        },
      ],
    }),
  }).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`LLM fetch failed: ${message}`);
    return null;
  });

  if (!upstream) {
    return c.json<EnhanceError>({ code: 'UPSTREAM_ERROR', message: 'LLM request failed' }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    logger.warn(`LLM upstream error: ${upstream.status} ${errText.slice(0, 500)}`);
    return c.json<EnhanceError>(
      { code: 'UPSTREAM_ERROR', message: `LLM upstream ${upstream.status}` },
      502
    );
  }

  const upstreamBody = upstream.body;
  return streamSSE(c, async (stream) => {
    try {
      logger.info('Enhance request received', {
        textLength: text.length,
        boxCount: boxes.length,
        hasCustomPrompt: !!prompt,
      });

      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush any remaining bytes in the decoder
          buffer += decoder.decode();
          // Process any remaining complete lines in the buffer
          if (buffer.trim()) {
            const data = buffer.trim();
            if (data.startsWith('data:')) {
              const payload = data.slice(5).trim();
              if (payload && payload !== '[DONE]') {
                const delta = parseDelta(payload);
                if (delta) {
                  await stream.writeSSE({
                    event: 'message',
                    data: delta,
                    id: String(Date.now()),
                  });
                }
              }
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const raw of lines) {
          const data = raw.trim();
          if (!data.startsWith('data:')) continue;

          const payload = data.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          const delta = parseDelta(payload);
          if (!delta) continue;

          await stream.writeSSE({
            event: 'message',
            data: delta,
            id: String(Date.now()),
          });
        }
      }

      await stream.writeSSE({
        event: 'done',
        data: '',
        id: String(Date.now()),
      });
    } catch (err) {
      logger.error('Enhance error', err);
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ code: 'UPSTREAM_ERROR', message: 'LLM request failed' }),
        id: String(Date.now()),
      });
    }
  });
});

function buildDefaultPrompt(
  text: string,
  boxes: Array<{ text: string; confidence: number }>,
  customPrompt?: string
): string {
  const lowConfBoxes = boxes.filter((b) => b.confidence < 0.7);
  const confNote =
    lowConfBoxes.length > 0
      ? `\n\nNote: ${lowConfBoxes.length} text region(s) have low confidence (<0.7). Please verify these carefully.`
      : '';

  return [
    'You are an OCR post-processing assistant.',
    'The following text was extracted from an image using OCR.',
    'Please correct any errors, fix formatting, and present the text cleanly.',
    customPrompt ? `Additional instruction: ${customPrompt}` : '',
    confNote,
    '\n\n--- OCR Text ---\n',
    text,
  ]
    .filter(Boolean)
    .join('\n');
}

function parseDelta(payload: string): string | null {
  try {
    const json = JSON.parse(payload);
    const delta = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content;
    return typeof delta === 'string' && delta.length > 0 ? delta : null;
  } catch (err) {
    logger.warn(`LLM SSE parse failed: ${(err as Error).message}`);
    return null;
  }
}
