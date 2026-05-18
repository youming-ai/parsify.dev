import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { type Env as PinoEnv, pinoLogger } from 'hono-pino';
import { rateLimiter } from 'hono-rate-limiter';
import { logger } from '~/lib/logger';

const PUBLIC_ORIGIN = process.env['PUBLIC_ORIGIN'] ?? 'http://localhost:3000';

export const app = new Hono<PinoEnv>({ strict: false }).basePath('/api');

app.use('*', secureHeaders());
app.use('*', cors({ origin: PUBLIC_ORIGIN, credentials: false }));
app.use('*', pinoLogger({ pino: logger }));

app.use(
  '/agent',
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    keyGenerator: (c) => c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon',
  })
);

app.get('/health', (c) => c.json({ ok: true }));

app.onError((err, c) => {
  c.var.logger?.error({ err: { message: err.message, stack: err.stack } }, 'unhandled');
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
