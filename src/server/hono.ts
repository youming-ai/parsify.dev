import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from '~/lib/logger';
import { enhance } from '~/server/routers/enhance';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

function rateLimiter(endpoint: string, limit: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const kv = (c.env as Record<string, unknown>)?.['RATE_LIMIT_KV'] as KVNamespace | undefined;
    if (!kv) {
      await next();
      return;
    }

    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    const key = `rl:${endpoint}:${ip}`;
    const now = Date.now();

    const raw = await kv.get<RateLimitEntry>(key, 'json');
    let entry: RateLimitEntry;

    if (!raw || now > raw.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
    } else {
      entry = raw;
    }

    entry.count++;

    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: Math.ceil(windowMs / 1000) + 60,
    });

    if (entry.count > limit) {
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

  const content = `# Parsify — Browser-Local OCR Tool

## About
Parsify is a browser-local OCR recognition tool powered by PaddleOCR PP-OCRv6 Tiny. Images never leave the user's device — all OCR processing happens locally in the browser using ONNX Runtime Web.

## How It Works
1. User uploads an image (drag & drop, paste, or file picker)
2. PP-OCRv6 Tiny runs in the browser via ONNX Runtime Web (WASM)
3. Three-stage pipeline: text detection → direction classification → text recognition
4. Optional: OCR results sent to /api/enhance for LLM post-processing

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
- 100% client-side OCR — images never leave the browser
- 50+ language support (Chinese, English, Japanese, 46 Latin-script languages)
- PP-OCRv6 Tiny: only 1.5MB, runs on any device
- LLM-enhanced text correction via /api/enhance

## Rate Limits
- /api/enhance: 20 requests / 15 min per IP

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

// Rate limit on /enhance (20 req / 15 min per IP)
app.use('/enhance', rateLimiter('enhance', 20, 15 * 60 * 1000));

app.route('/enhance', enhance);

app.onError((err, c) => {
  logger.error(`unhandled: ${err.message}`);
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
