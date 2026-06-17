import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '~/lib/logger';
import { type EnhanceError, enhanceRequestSchema } from '~/schemas/enhance';

export const enhance = new Hono();

enhance.post('/', async (c) => {
  // Parse and validate request body
  const body = await c.req.json();
  const parsed = enhanceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<EnhanceError>(
      { code: 'INVALID_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid request' },
      400
    );
  }

  const { text, boxes, prompt } = parsed.data;

  // Check for LLM API key
  const apiKey = (c.env as Record<string, string | undefined>)?.['LLM_API_KEY'];
  if (!apiKey) {
    return c.json<EnhanceError>(
      { code: 'CONFIG_ERROR', message: 'LLM API key not configured' },
      500
    );
  }

  // Build the enhancement prompt (used when implementing LLM call)
  const _systemPrompt = prompt ?? buildDefaultPrompt(text, boxes);

  // Stream LLM response via SSE
  return streamSSE(c, async (stream) => {
    try {
      // PLACEHOLDER: Replace with actual LLM API call.
      // The user will provide the specific LLM integration.
      logger.info('Enhance request received', {
        textLength: text.length,
        boxCount: boxes.length,
        hasCustomPrompt: !!prompt,
      });

      // Simulate streaming response
      const response = `## OCR Result\n\n${text}\n\n---\n\n_LLM enhancement pending — configure LLM_API_KEY and implement LLM call._`;
      const chunks = response.match(/.{1,50}/gs) ?? [response];

      for (const chunk of chunks) {
        await stream.writeSSE({
          event: 'message',
          data: chunk,
          id: String(Date.now()),
        });
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
  boxes: Array<{ text: string; confidence: number }>
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
    confNote,
    '\n\n--- OCR Text ---\n',
    text,
  ].join('\n');
}
