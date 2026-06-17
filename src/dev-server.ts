import { app } from '~/server/hono';

const PORT = Number(process.env['API_PORT'] || '3001');

const env = {
  LLM_API_KEY: process.env['LLM_API_KEY'],
  PUBLIC_ORIGIN: process.env['PUBLIC_ORIGIN'] || 'http://localhost:5173',
};

Bun.serve({
  fetch: (request: Request) => app.fetch(request, env),
  port: PORT,
});

console.log(`✦ API server running on http://localhost:${PORT}`);
console.log(`  Proxied by Vite at ${env.PUBLIC_ORIGIN}/api/*`);
