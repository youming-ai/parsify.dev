import { createClient } from 'curl.md';
import { Hono } from 'hono';
import { estimateTokens, savingsRatio } from '~/lib/parser/token-estimate';
import { type ParseError, parseRequestSchema } from '~/schemas/parse';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 5 * 1024 * 1024;

// The real curl.md SDK client.fetch() returns a Response-like object (outputFormat: "text")
// where the markdown content is retrieved via .text(). The mock in tests returns { markdown, html }
// directly. The extraction logic below handles both shapes:
//   - Object with .markdown property (mock / future JSON format)
//   - Response-like object with .text() method (real SDK)
//   - Plain string (defensive fallback)
//
// Note: curl.md SDK accepts signal nested under options.init.signal, not as a top-level arg.
// We use AbortController for timeout, but pass the signal via the options shape the SDK expects.
const client = createClient();

export const parse = new Hono().basePath('/api/parse');

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Pass signal nested under options.init as required by the curl.md SDK type signature.
    // If the signal is not respected by the SDK, the AbortController still fires but won't
    // interrupt the in-flight request — the timeout will resolve after the request completes.
    const result = await (
      client.fetch as (u: string, opts?: Record<string, unknown>) => Promise<unknown>
    )(url, { options: { init: { signal: controller.signal } } });
    clearTimeout(timeout);

    let markdown: string;
    let html: string;

    if (typeof result === 'string') {
      // Plain string — markdown only, no HTML available
      markdown = result;
      html = '';
    } else if (
      result !== null &&
      typeof result === 'object' &&
      'markdown' in result &&
      typeof (result as Record<string, unknown>)['markdown'] === 'string'
    ) {
      // Mock shape or future JSON format: { markdown, html }
      markdown = (result as Record<string, unknown>)['markdown'] as string;
      html =
        'html' in result && typeof (result as Record<string, unknown>)['html'] === 'string'
          ? ((result as Record<string, unknown>)['html'] as string)
          : '';
    } else if (
      result !== null &&
      typeof result === 'object' &&
      'text' in result &&
      typeof (result as Record<string, unknown>)['text'] === 'function'
    ) {
      // Real SDK Response shape: call .text() to get the markdown string
      markdown = await (result as { text: () => Promise<string> }).text();
      html = '';
    } else {
      markdown = String(result);
      html = '';
    }

    const htmlBytes = new TextEncoder().encode(html).byteLength;
    const mdBytes = new TextEncoder().encode(markdown).byteLength;

    if (htmlBytes > MAX_HTML_BYTES) {
      return c.json<ParseError>({ error: 'TOO_LARGE', message: 'Page exceeds 5 MB' }, 413);
    }

    return c.json({
      url,
      markdown,
      htmlBytes,
      mdBytes,
      htmlTokens: estimateTokens(html),
      mdTokens: estimateTokens(markdown),
      savingsRatio: savingsRatio(htmlBytes, mdBytes),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === 'AbortError') {
      return c.json<ParseError>({ error: 'TIMEOUT', message: 'Upstream took too long' }, 504);
    }
    return c.json<ParseError>({ error: 'FETCH_FAILED', message: (err as Error).message }, 502);
  }
});
