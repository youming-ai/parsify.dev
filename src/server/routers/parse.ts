import { Hono } from 'hono';
import { estimateTokens } from '~/lib/parser/token-estimate';
import { type ParseError, parseRequestSchema } from '~/schemas/parse';

const JINA_READER_HOST = 'https://r.jina.ai';
const FETCH_TIMEOUT_MS = 30_000;
const MAX_MD_BYTES = 5 * 1024 * 1024;

export const parse = new Hono();

parse.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<ParseError>({ error: 'INVALID_URL', message: 'Body is not JSON' }, 400);
  }

  const parsed = parseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json<ParseError>(
      { error: 'INVALID_URL', message: parsed.error.issues[0]?.message ?? 'Invalid URL' },
      400
    );
  }

  const { url } = parsed.data;

  const apiKey = process.env['JINA_API_KEY'];
  const headers: Record<string, string> = { accept: 'text/markdown' };
  if (apiKey) headers['authorization'] = `Bearer ${apiKey}`;

  const target = `${JINA_READER_HOST}/${url}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target, { headers, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === 'AbortError') {
      return c.json<ParseError>({ error: 'TIMEOUT', message: 'Upstream took too long' }, 504);
    }
    return c.json<ParseError>({ error: 'FETCH_FAILED', message: (err as Error).message }, 502);
  }
  clearTimeout(timeout);

  if (!upstream.ok) {
    return c.json<ParseError>(
      { error: 'FETCH_FAILED', message: `Upstream ${upstream.status}` },
      502
    );
  }

  const markdown = await upstream.text();
  const mdBytes = new TextEncoder().encode(markdown).byteLength;

  if (mdBytes > MAX_MD_BYTES) {
    return c.json<ParseError>({ error: 'TOO_LARGE', message: 'Parsed content exceeds 5 MB' }, 413);
  }

  return c.json({
    url,
    markdown,
    mdBytes,
    mdTokens: estimateTokens(markdown),
    fetchedAt: new Date().toISOString(),
  });
});
