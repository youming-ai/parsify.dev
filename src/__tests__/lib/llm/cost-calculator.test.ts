import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';
import { describe, expect, it } from 'bun:test';

describe('calculateMonthlyCost', () => {
  it('calculates standard input and output cost', () => {
    const result = calculateMonthlyCost({
      monthlyRequests: 1000,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheHitRate: 0,
      useBatch: false,
    });

    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(7.5);
    expect(result.totalCost).toBe(10.5);
  });

  it('applies batch pricing when useBatch is true', () => {
    const result = calculateMonthlyCost({
      monthlyRequests: 1000,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheHitRate: 0,
      useBatch: true,
      batchInputPricePerMillion: 1.5,
      batchOutputPricePerMillion: 7.5,
    });

    expect(result.inputCost).toBe(1.5);
    expect(result.outputCost).toBe(3.75);
    expect(result.totalCost).toBe(5.25);
  });

  it('falls back to regular pricing when batch prices are missing', () => {
    const result = calculateMonthlyCost({
      monthlyRequests: 1000,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheHitRate: 0,
      useBatch: true,
    });

    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(7.5);
  });

  it('applies cache pricing with hit rate', () => {
    const result = calculateMonthlyCost({
      monthlyRequests: 1000,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheHitRate: 0.5,
      cacheReadPricePerMillion: 0.5,
      useBatch: false,
    });

    // 500 cached @ 0.5/M + 500 uncached @ 3/M = 0.25 + 1.5 = 1.75
    expect(result.inputCost).toBe(1.75);
    expect(result.outputCost).toBe(7.5);
  });

  it('caps cache hit rate between 0 and 1', () => {
    const shared = {
      monthlyRequests: 1000,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheReadPricePerMillion: 0.5,
      useBatch: false,
    } as const;

    const low = calculateMonthlyCost({ ...shared, cacheHitRate: -0.5 });
    const high = calculateMonthlyCost({ ...shared, cacheHitRate: 1.5 });
    const zero = calculateMonthlyCost({ ...shared, cacheHitRate: 0 });
    const full = calculateMonthlyCost({ ...shared, cacheHitRate: 1 });

    expect(low.inputCost).toBe(zero.inputCost);
    expect(high.inputCost).toBe(full.inputCost);
  });

  it('handles zero requests', () => {
    const result = calculateMonthlyCost({
      monthlyRequests: 0,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheHitRate: 0,
      useBatch: false,
    });

    expect(result.inputCost).toBe(0);
    expect(result.outputCost).toBe(0);
    expect(result.totalCost).toBe(0);
  });
});
