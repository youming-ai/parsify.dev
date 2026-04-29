export interface PromptCacheInput {
  staticTokens: number;
  dynamicTokens: number;
  outputTokens: number;
  monthlyCalls: number;
  inputPrice: number;
  outputPrice: number;
  cacheWritePrice?: number;
  cacheReadPrice?: number;
  hitRate: number;
}

export interface PromptCacheResult {
  uncachedCost: number;
  cachedCost: number;
  savings: number;
  breakEvenCalls: number;
  recommendation: 'recommended' | 'neutral' | 'not-worth-it' | 'unavailable';
}

export function calculatePromptCache(input: PromptCacheInput): PromptCacheResult {
  if (input.cacheWritePrice === undefined || input.cacheReadPrice === undefined) {
    const uncachedCost =
      (((input.staticTokens + input.dynamicTokens) * input.monthlyCalls) / 1_000_000) *
        input.inputPrice +
      ((input.outputTokens * input.monthlyCalls) / 1_000_000) * input.outputPrice;
    return {
      uncachedCost,
      cachedCost: uncachedCost,
      savings: 0,
      breakEvenCalls: 0,
      recommendation: 'unavailable',
    };
  }

  const hitRate = Math.min(Math.max(input.hitRate, 0), 1);
  const staticMonthly = input.staticTokens * input.monthlyCalls;
  const dynamicMonthly = input.dynamicTokens * input.monthlyCalls;
  const outputMonthly = input.outputTokens * input.monthlyCalls;
  const uncachedCost =
    ((staticMonthly + dynamicMonthly) / 1_000_000) * input.inputPrice +
    (outputMonthly / 1_000_000) * input.outputPrice;
  const cacheWriteCost = (input.staticTokens / 1_000_000) * input.cacheWritePrice;
  const cacheReadCost = ((staticMonthly * hitRate) / 1_000_000) * input.cacheReadPrice;
  const staticMissCost = ((staticMonthly * (1 - hitRate)) / 1_000_000) * input.inputPrice;
  const dynamicCost = (dynamicMonthly / 1_000_000) * input.inputPrice;
  const outputCost = (outputMonthly / 1_000_000) * input.outputPrice;
  const cachedCost = cacheWriteCost + cacheReadCost + staticMissCost + dynamicCost + outputCost;
  const savings = uncachedCost - cachedCost;
  const perCallSavings =
    (input.staticTokens / 1_000_000) *
    Math.max(0, input.inputPrice - input.cacheReadPrice) *
    hitRate;
  const breakEvenCalls = perCallSavings === 0 ? 0 : Math.ceil(cacheWriteCost / perCallSavings);
  const recommendation =
    savings > 1 && input.staticTokens >= 1024
      ? 'recommended'
      : savings > 0
        ? 'neutral'
        : 'not-worth-it';

  return {
    uncachedCost,
    cachedCost,
    savings,
    breakEvenCalls,
    recommendation,
  };
}
