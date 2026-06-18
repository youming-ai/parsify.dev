import { describe, expect, it } from 'bun:test';
import { app } from '~/server/hono';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * In-memory stand-in for the RateLimiterDO that mirrors its fixed-window
 * counting logic, so the middleware wiring (key derivation, 429 + Retry-After)
 * can be exercised without the Workers runtime.
 */
function fakeRateLimiterNamespace() {
  const counts = new Map<string, number>();
  return {
    getByName(name: string) {
      return {
        async limit(maxRequests: number, windowMs: number): Promise<RateLimitResult> {
          const count = (counts.get(name) ?? 0) + 1;
          counts.set(name, count);
          return {
            allowed: count <= maxRequests,
            remaining: Math.max(0, maxRequests - count),
            resetTime: Date.now() + windowMs,
          };
        },
      };
    },
  };
}

function post(env: Record<string, unknown>) {
  return app.request(
    '/api/enhance',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
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
    const env = { RATE_LIMITER: fakeRateLimiterNamespace() };

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
    const env = { RATE_LIMITER: fakeRateLimiterNamespace() };

    // Exhaust the limit for one IP.
    for (let i = 0; i < 21; i++) await post(env);

    // A different IP is unaffected.
    const other = await app.request(
      '/api/enhance',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '198.51.100.2' },
        body: '{}',
      },
      env
    );
    expect(other.status).not.toBe(429);
  });
});
