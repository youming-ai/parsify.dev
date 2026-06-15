import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from '~/lib/logger';
import { agent } from '~/server/routers/agent';
import { parse } from '~/server/routers/parse';

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

  const content = `# Parsify — AI-Powered SEO Analyzer

## About
Parsify is an AI-powered SEO analysis tool. Paste any URL and get comprehensive SEO analysis including SEO.md document, robots.txt, and llm.txt.

## How It Works
1. User submits a URL
2. Jina Reader fetches and converts the page to clean markdown
3. DeepSeek LLM performs comprehensive SEO analysis
4. Results include SEO.md, robots.txt, and llm.txt generation

## API Endpoints

### POST /api/parse
Converts a URL to clean markdown.

**Request:**
\`\`\`json
{"url": "https://example.com/article"}
\`\`\`

**Response:**
\`\`\`json
{"url": "...", "markdown": "...", "mdBytes": 12345, "mdTokens": 3200}
\`\`\`

### POST /api/agent
Generates SEO analysis from markdown content.

**Request:**
\`\`\`json
{
  "markdown": "...",
  "prompt": "请对这个网页进行全面的SEO分析",
  "outputFormat": "json"
}
\`\`\`

**Response (JSON):** SEO analysis with seoMd, robotsTxt, llmTxt
**Response (text):** Streaming plain text

## Rate Limits
- /api/parse: 20 requests / 15 min per IP
- /api/agent: 20 requests / 15 min per IP

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

// Rate limit on /parse (20 req / 15 min per IP)
app.use('/parse', rateLimiter('parse', 20, 15 * 60 * 1000));

// Rate limit on /agent (20 req / 15 min per IP)
app.use('/agent', rateLimiter('agent', 20, 15 * 60 * 1000));

app.route('/parse', parse);
app.route('/agent', agent);

app.onError((err, c) => {
  logger.error(`unhandled: ${err.message}`);
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
