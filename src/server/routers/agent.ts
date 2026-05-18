import { streamText } from 'ai';
import { Hono } from 'hono';
import type { Env as PinoEnv } from 'hono-pino';
import { createZhipu } from 'zhipu-ai-provider';
import { type AgentError, agentRequestSchema } from '~/schemas/agent';

const ZHIPU_BASE_URL = 'https://api.z.ai/api/paas/v4';

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

  const { markdown, apiKey, prompt, model } = parsed.data;

  // SECURITY: do NOT log the body. The Zhipu API key lives in this request only.
  // pino redaction already strips *.apiKey, but never inline-log `body` or `parsed.data`.
  const zhipu = createZhipu({ baseURL: ZHIPU_BASE_URL, apiKey });

  try {
    const result = streamText({
      model: zhipu(model),
      messages: [
        { role: 'system', content: 'You are a precise web-content analyst.' },
        {
          role: 'user',
          content: `${prompt}\n\n--- 网页 markdown 内容如下 ---\n\n${markdown}`,
        },
      ],
    });
    return result.toTextStreamResponse();
  } catch (err) {
    c.var.logger?.warn({ err: { message: (err as Error).message } }, 'agent stream failed');
    return c.json<AgentError>({ error: 'AGENT_FAILED', message: (err as Error).message }, 502);
  }
});
