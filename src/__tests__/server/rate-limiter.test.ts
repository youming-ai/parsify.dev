import { describe, expect, it } from 'bun:test';
import { app } from '~/server/hono';

/**
 * In-memory stand-in for Cloudflare's native Rate Limiting binding. Counts per
 * key and reports `success: false` once the limit is exceeded, so the
 * middleware wiring (key derivation, 429 + Retry-After) can be exercised
 * without the Workers runtime.
 */
function fakeRateLimitBinding(limit: number) {
  const counts = new Map<string, number>();
  return {
    async limit({ key }: { key: string }): Promise<{ success: boolean }> {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return { success: count <= limit };
    },
  };
}

function post(env: Record<string, unknown>, ip = '203.0.113.7') {
  return app.request(
    '/api/enhance',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
      body: '{}',
    },
    env
  );
}

describe('rate limiter middleware', () => {
  it('passes through when no RATE_LIMITER binding is present', async () => {
    const res = await post({});
    expect(res.status).not.toBe(429);
  });

  it('allows requests up to the limit, then returns 429 with Retry-After', async () => {
    const env = { RATE_LIMITER: fakeRateLimitBinding(20) };

    for (let i = 0; i < 20; i++) {
      const res = await post(env);
      expect(res.status).not.toBe(429);
    }

    const blocked = await post(env);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).not.toBeNull();
    const body = await blocked.json();
    expect(body.error).toBe('RATE_LIMITED');
  });

  it('scopes the limit per client IP', async () => {
    const env = { RATE_LIMITER: fakeRateLimitBinding(20) };

    // Exhaust the limit for one IP.
    for (let i = 0; i < 21; i++) await post(env);

    // A different IP is unaffected.
    const other = await post(env, '198.51.100.2');
    expect(other.status).not.toBe(429);
  });
});
