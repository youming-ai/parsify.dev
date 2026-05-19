import { app } from '~/server/hono';

interface Env {
  DEEPSEEK_API_KEY?: string;
  JINA_API_KEY?: string;
  PUBLIC_ORIGIN?: string;
  LOG_LEVEL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env);
    }
    return new Response('Not Found', { status: 404 });
  },
};
