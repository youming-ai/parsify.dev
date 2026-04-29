import { calculatePromptCache } from '@/lib/llm/prompt-cache';
import { describe, expect, it } from 'vitest';

describe('calculatePromptCache', () => {
  it('returns unavailable when cache prices are missing', () => {
    const result = calculatePromptCache({
      staticTokens: 1000,
      dynamicTokens: 500,
      outputTokens: 200,
      monthlyCalls: 1000,
      inputPrice: 2.0,
      outputPrice: 6.0,
      hitRate: 0.8,
    });
    expect(result.recommendation).toBe('unavailable');
    expect(result.savings).toBe(0);
    expect(result.breakEvenCalls).toBe(0);
  });

  it('cached cost is lower with high hit rate', () => {
    const result = calculatePromptCache({
      staticTokens: 2000,
      dynamicTokens: 500,
      outputTokens: 200,
      monthlyCalls: 1000,
      inputPrice: 2.0,
      outputPrice: 6.0,
      cacheWritePrice: 2.0,
      cacheReadPrice: 0.5,
      hitRate: 0.9,
    });
    expect(result.cachedCost).toBeLessThan(result.uncachedCost);
    expect(result.savings).toBeGreaterThan(0);
  });

  it('break-even exists when savings are positive', () => {
    const result = calculatePromptCache({
      staticTokens: 2000,
      dynamicTokens: 500,
      outputTokens: 200,
      monthlyCalls: 1000,
      inputPrice: 2.0,
      outputPrice: 6.0,
      cacheWritePrice: 2.0,
      cacheReadPrice: 0.5,
      hitRate: 0.9,
    });
    expect(result.breakEvenCalls).toBeGreaterThan(0);
  });

  it('recommends caching for large static prompts with positive savings', () => {
    const result = calculatePromptCache({
      staticTokens: 2000,
      dynamicTokens: 500,
      outputTokens: 200,
      monthlyCalls: 1000,
      inputPrice: 2.0,
      outputPrice: 6.0,
      cacheWritePrice: 2.0,
      cacheReadPrice: 0.5,
      hitRate: 0.9,
    });
    expect(result.recommendation).toBe('recommended');
  });

  it('not-worth-it when savings is negative', () => {
    const result = calculatePromptCache({
      staticTokens: 200,
      dynamicTokens: 500,
      outputTokens: 200,
      monthlyCalls: 10,
      inputPrice: 0.1,
      outputPrice: 0.1,
      cacheWritePrice: 5.0,
      cacheReadPrice: 5.0,
      hitRate: 0.1,
    });
    expect(result.recommendation).toBe('not-worth-it');
  });

  it('caps hit rate between 0 and 1', () => {
    const shared = {
      staticTokens: 2000,
      dynamicTokens: 500,
      outputTokens: 200,
      monthlyCalls: 1000,
      inputPrice: 2.0,
      outputPrice: 6.0,
      cacheWritePrice: 2.0,
      cacheReadPrice: 0.5,
    } as const;
    const low = calculatePromptCache({ ...shared, hitRate: -1 });
    const high = calculatePromptCache({ ...shared, hitRate: 2 });
    const zeroHit = calculatePromptCache({ ...shared, hitRate: 0 });
    const oneHit = calculatePromptCache({ ...shared, hitRate: 1 });
    expect(low.savings).toBe(zeroHit.savings);
    expect(high.savings).toBe(oneHit.savings);
  });
});
