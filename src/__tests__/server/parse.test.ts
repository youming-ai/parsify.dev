import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { parse } from '~/server/routers/parse';

const originalFetch = globalThis.fetch;

function makeUpstream(body: string, init?: { status?: number }) {
  return new Response(body, {
    status: init?.status ?? 200,
    headers: { 'content-type': 'text/markdown' },
  });
}

let fetchMock: ReturnType<typeof mock>;

beforeEach(() => {
  fetchMock = mock(async () => makeUpstream('# Title\n\nbody'));
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('POST /api/parse', () => {
  test('returns markdown + tokens', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['markdown']).toBe('# Title\n\nbody');
    expect(typeof body['mdTokens']).toBe('number');
    expect(typeof body['mdBytes']).toBe('number');
    expect(typeof body['fetchedAt']).toBe('string');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('proxies to r.jina.ai with target URL appended', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/article' }),
    });
    await parse.fetch(req);
    const called = String(fetchMock.mock.calls[0]?.[0]);
    expect(called).toContain('r.jina.ai');
    expect(called).toContain('https://example.com/article');
  });

  test('forwards objective as X-Instruction header', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', objective: 'summarise core idea' }),
    });
    await parse.fetch(req);
    const headers = (fetchMock.mock.calls[0]?.[1] as { headers: Record<string, string> }).headers;
    expect(headers['x-instruction']).toBe('summarise core idea');
  });

  test('attaches Authorization when JINA_API_KEY is set', async () => {
    process.env['JINA_API_KEY'] = 'jina_test_xxx';
    try {
      const req = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      });
      await parse.fetch(req);
      const headers = (fetchMock.mock.calls[0]?.[1] as { headers: Record<string, string> }).headers;
      expect(headers['authorization']).toBe('Bearer jina_test_xxx');
    } finally {
      delete process.env['JINA_API_KEY'];
    }
  });

  test('rejects an invalid URL with INVALID_URL', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'not a url' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('INVALID_URL');
  });

  test('maps upstream non-2xx to FETCH_FAILED', async () => {
    fetchMock = mock(async () => makeUpstream('upstream error', { status: 500 }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('FETCH_FAILED');
  });

  test('returns TOO_LARGE when content exceeds 5 MB', async () => {
    const bigMarkdown = 'x'.repeat(5 * 1024 * 1024 + 1);
    fetchMock = mock(async () => makeUpstream(bigMarkdown));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(413);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('TOO_LARGE');
  });
});
