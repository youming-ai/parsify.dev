import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from '~/lib/logger';
import { agent } from '~/server/routers/agent';
import { parse } from '~/server/routers/parse';

export const app = new Hono({ strict: false }).basePath('/api');

app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (_origin, c) =>
      (c.env as Record<string, string | undefined>)?.['PUBLIC_ORIGIN'] ?? 'http://localhost:3000',
    credentials: false,
  })
);
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
});

app.get('/health', (c) => c.json({ ok: true }));

app.route('/parse', parse);
app.route('/agent', agent);

app.onError((err, c) => {
  logger.error(`unhandled: ${err.message}`);
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
