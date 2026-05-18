import { beforeEach, describe, expect, mock, test } from 'bun:test';

const fetchMock = mock(async (_url: string) => ({
  markdown: '# Title\n\nbody',
  html: '<html><body>Title body</body></html>',
}));

mock.module('curl.md', () => ({
  createClient: () => ({ fetch: fetchMock }),
}));

const { parse } = await import('~/server/routers/parse');

beforeEach(() => fetchMock.mockClear());

describe('POST /api/parse', () => {
  test('returns markdown + sizes for a valid URL', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['markdown']).toBe('# Title\n\nbody');
    expect(typeof body['htmlBytes']).toBe('number');
    expect(typeof body['mdBytes']).toBe('number');
    expect(typeof body['savingsRatio']).toBe('number');
    expect(typeof body['htmlTokens']).toBe('number');
    expect(typeof body['mdTokens']).toBe('number');
    expect(typeof body['fetchedAt']).toBe('string');
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  test('maps curl.md failure to FETCH_FAILED', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
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

  test('returns TOO_LARGE when parsed content exceeds 5 MB', async () => {
    const bigMarkdown = 'x'.repeat(5 * 1024 * 1024 + 1);
    fetchMock.mockImplementationOnce(async () => ({
      markdown: bigMarkdown,
      html: '',
    }));
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
