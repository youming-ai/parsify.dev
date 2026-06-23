import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from '~/lib/logger';
import { enhance } from '~/server/routers/enhance';

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

// Window length (seconds) configured on the [[ratelimits]] binding in
// wrangler.toml. Used only to set a Retry-After hint on 429 responses.
const RATE_LIMIT_PERIOD_SECONDS = 60;

/**
 * Per-IP limiter backed by Cloudflare's native Rate Limiting binding, which is
 * atomic and managed by the edge — no read-modify-write race like the previous
 * KV counter. When the binding is absent (local dev, Docker/bun runtime, tests)
 * the middleware degrades to a no-op. The limit/period live on the binding
 * config; this middleware only supplies the per-client key.
 */
function rateLimiter(endpoint: string) {
  return async (c: Context, next: Next) => {
    const limiter = (c.env as Record<string, unknown>)?.['RATE_LIMITER'] as
      | RateLimitBinding
      | undefined;
    if (!limiter?.limit) {
      await next();
      return;
    }

    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';

    let success: boolean;
    try {
      ({ success } = await limiter.limit({ key: `${endpoint}:${ip}` }));
    } catch (err) {
      logger.error(`rate limiter error: ${(err as Error).message}`);
      return c.json({ error: 'RATE_LIMIT_UNAVAILABLE', message: 'Rate limiter unavailable' }, 503);
    }

    if (!success) {
      c.header('Retry-After', String(RATE_LIMIT_PERIOD_SECONDS));
      return c.json({ error: 'RATE_LIMITED', message: 'Too many requests' }, 429);
    }

    await next();
  };
}

export const app = new Hono({ strict: false }).basePath('/api');

app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (_origin, c) =>
      (c.env as Record<string, string | undefined>)?.['PUBLIC_ORIGIN'] ?? 'https://parsify.dev',
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

// LLM.txt endpoint
app.get('/llm.txt', (c) => {
  const origin =
    (c.env as Record<string, string | undefined>)?.['PUBLIC_ORIGIN'] ?? 'https://parsify.dev';

  const content = `# Parsify — Your Files Never Leave Your Device

## About
Parsify is a privacy-first on-device OCR tool powered by PaddleOCR PP-OCRv6. Extract text from images and PDFs — files stay in your browser. OCR processing runs locally via ONNX Runtime Web (WASM). Optional AI cleanup sends only extracted text when you request it.

## How It Works
1. User uploads an image or PDF (drag & drop, paste, or file picker)
2. PP-OCRv6 runs in the browser via ONNX Runtime Web (WASM) — no server upload
3. Three-stage pipeline: text detection → direction classification → text recognition
4. Optional: user-triggered OCR text is sent to /api/enhance for LLM post-processing

## API Endpoints

### POST /api/enhance
LLM post-processing of OCR text (text correction, formatting, structuring).

**Request:**
\`\`\`json
{
  "text": "OCR extracted text",
  "boxes": [{"points": [[0,0],[100,0],[100,30],[0,30]], "text": "Hello", "confidence": 0.95}],
  "prompt": "optional custom prompt"
}
\`\`\`

**Response:** SSE stream with enhanced text

## Features
- On-device OCR — files never leave your browser
- Chinese & English language support (optimized for Chinese, English, numbers, and symbols)
- PP-OCRv6: accurate text recognition, runs on any device via WASM
- Image and PDF support
- Optional AI cleanup via /api/enhance (sends only extracted text, never source files)

## Privacy
- OCR runs entirely in-browser — no file uploads to any server
- AI cleanup is opt-in and sends only the extracted text, not your source files

## Rate Limits
- /api/enhance: 20 requests / 60s per IP

## Contact
Website: ${origin}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

// Robots.txt endpoint
app.get('/robots.txt', (c) => {
  const origin =
    (c.env as Record<string, string | undefined>)?.['PUBLIC_ORIGIN'] ?? 'https://parsify.dev';

  const content = `# Parsify — robots.txt

User-agent: *
Allow: /
Disallow: /api/
Disallow: /_build/
Disallow: /_assets/

# LLM Crawlers
User-agent: GPTBot
Allow: /llm.txt

User-agent: ChatGPT-User
Allow: /llm.txt

User-agent: Claude-Web
Allow: /llm.txt

User-agent: Anthropic-ai
Allow: /llm.txt

User-agent: Google-Extended
Allow: /llm.txt

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

# Sitemaps
Sitemap: ${origin}/sitemap.xml

# Crawl-delay
User-agent: *
Crawl-delay: 1
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

// Sitemap.xml endpoint
app.get('/sitemap.xml', (c) => {
  const origin =
    (c.env as Record<string, string | undefined>)?.['PUBLIC_ORIGIN'] ?? 'https://parsify.dev';
  const today = new Date().toISOString().split('T')[0];

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/docs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/llm.txt</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

  return new Response(content, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

// Rate limit on /enhance (per-IP; limit/period configured on the
// [[ratelimits]] binding in wrangler.toml — currently 20 req / 60s)
app.use('/enhance', rateLimiter('enhance'));

app.route('/enhance', enhance);

app.onError((err, c) => {
  logger.error(`unhandled: ${err.message}`);
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
