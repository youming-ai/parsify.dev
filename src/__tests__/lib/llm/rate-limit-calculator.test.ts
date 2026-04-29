import { calculateRateLimits } from '@/lib/llm/rate-limit-calculator';
import { describe, expect, it } from 'vitest';

describe('calculateRateLimits', () => {
  it('detects token bottlenecks', () => {
    const result = calculateRateLimits({
      tpm: 10000,
      rpm: 1000,
      tpd: 1000000,
      maxConcurrency: 50,
      averageInputTokens: 1000,
      averageOutputTokens: 1000,
      desiredRps: 10,
    });
    expect(result.bottleneck).toBe('TPD');
    expect(result.maxRpmByTokens).toBe(5);
  });

  it('clamps negative inputs', () => {
    const result = calculateRateLimits({
      tpm: -1,
      rpm: -1,
      tpd: -1,
      maxConcurrency: 10,
      averageInputTokens: 100,
      averageOutputTokens: 100,
      desiredRps: 0,
    });
    expect(result.maxRpmByTokens).toBe(0);
  });
});
