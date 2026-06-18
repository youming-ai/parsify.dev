import { DurableObject } from 'cloudflare:workers';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Atomic fixed-window rate limiter backed by a Durable Object.
 *
 * Each `endpoint:ip` maps to a single DO instance (via `getByName`), so all
 * requests for that key are serialized onto one isolate. The read-modify-write
 * on the in-memory counter happens synchronously with no `await` before the
 * increment, which makes it race-free even under concurrent bursts — unlike the
 * previous KV get/increment/put, where concurrent requests could read the same
 * count and clobber each other.
 */
export class RateLimiterDO extends DurableObject {
  private count = 0;
  private resetTime = 0;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as never);
    ctx.blockConcurrencyWhile(async () => {
      this.count = (await ctx.storage.get<number>('count')) ?? 0;
      this.resetTime = (await ctx.storage.get<number>('resetTime')) ?? 0;
    });
  }

  async limit(maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();

    // Synchronous window roll-over + increment — no `await` in between, so two
    // concurrent calls cannot observe the same pre-increment count.
    if (now > this.resetTime) {
      this.count = 0;
      this.resetTime = now + windowMs;
    }
    this.count += 1;

    const count = this.count;
    const resetTime = this.resetTime;

    // Persist after the in-memory mutation so a later eviction reloads the
    // correct count, and schedule cleanup once the window has elapsed.
    await this.ctx.storage.put({ count, resetTime });
    await this.ctx.storage.setAlarm(resetTime + 60_000);

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime,
    };
  }

  override async alarm(): Promise<void> {
    // Window expired — drop persisted state so the DO can be evicted cleanly.
    await this.ctx.storage.deleteAll();
    this.count = 0;
    this.resetTime = 0;
  }
}
