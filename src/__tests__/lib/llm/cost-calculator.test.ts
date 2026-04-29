import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';
import { describe, expect, it } from 'vitest';

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
});
