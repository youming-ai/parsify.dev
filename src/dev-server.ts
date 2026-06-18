import { logger } from '~/lib/logger';
import { app } from '~/server/hono';

const PORT = Number(process.env['API_PORT'] || '3001');

const env = {
  LLM_API_KEY: process.env['LLM_API_KEY'],
  DEEPSEEK_API_KEY: process.env['DEEPSEEK_API_KEY'],
  LLM_API_BASE_URL: process.env['LLM_API_BASE_URL'],
  LLM_MODEL: process.env['LLM_MODEL'],
  PUBLIC_ORIGIN: process.env['PUBLIC_ORIGIN'] || 'http://localhost:5173',
};

Bun.serve({
  fetch: (request: Request) => app.fetch(request, env),
  port: PORT,
});

logger.info(`API server running on http://localhost:${PORT}`);
logger.info(`Proxied by Vite at ${env.PUBLIC_ORIGIN}/api/*`);
