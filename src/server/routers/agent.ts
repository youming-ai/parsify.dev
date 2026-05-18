import { Hono } from 'hono';
import type { Env as PinoEnv } from 'hono-pino';
import { type AgentError, agentRequestSchema } from '~/schemas/agent';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export const agent = new Hono<PinoEnv>();

agent.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<AgentError>({ error: 'INVALID_BODY', message: 'Body is not JSON' }, 400);
  }

  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json<AgentError>(
      { error: 'INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
      400
    );
  }

  const apiKey = process.env['DEEPSEEK_API_KEY'];
  if (!apiKey) {
    c.var.logger?.error('DEEPSEEK_API_KEY not configured');
    return c.json<AgentError>(
      { error: 'CONFIG_ERROR', message: 'Server missing DEEPSEEK_API_KEY' },
      500
    );
  }

  const { markdown } = parsed.data;
  const prompt = DEFAULT_PROMPT;

  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        stream: true,
        messages: [
          { role: 'system', content: 'You are a precise web-content analyst.' },
          {
            role: 'user',
            content: `${prompt}\n\n--- 网页 markdown 内容如下 ---\n\n${markdown}`,
          },
        ],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    c.var.logger?.warn({ err: { message } }, 'deepseek fetch failed');
    return c.json<AgentError>({ error: 'AGENT_FAILED', message }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    c.var.logger?.warn(
      { status: upstream.status, body: errText.slice(0, 500) },
      'deepseek upstream error'
    );
    return c.json<AgentError>(
      { error: 'AGENT_FAILED', message: `Upstream ${upstream.status}` },
      502
    );
  }

  const logger = c.var.logger;
  const upstreamBody = upstream.body;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch (err) {
              logger?.warn({ err: { message: (err as Error).message } }, 'sse parse failed');
            }
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger?.warn({ err: { message } }, 'stream interrupted');
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
});
