import { app } from '~/server/hono';

interface Env {
  DEEPSEEK_API_KEY?: string;
  JINA_API_KEY?: string;
  PUBLIC_ORIGIN?: string;
  LOG_LEVEL?: string;
  RATE_LIMIT_KV: KVNamespace;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API routes → Hono app
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env);
    }

    // SPA fallback: serve index.html for non-file routes
    // (actual static files like robots.txt, sitemap.xml are served
    //  automatically by Cloudflare's assets system before reaching the worker)
    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
  },
};
