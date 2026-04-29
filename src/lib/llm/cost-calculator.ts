export interface CostCalculationInput {
  monthlyRequests: number;
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  cacheReadPricePerMillion?: number;
  cacheHitRate: number;
  useBatch: boolean;
  batchInputPricePerMillion?: number;
  batchOutputPricePerMillion?: number;
}

export interface CostCalculationResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
}

export function calculateMonthlyCost(input: CostCalculationInput): CostCalculationResult {
  const monthlyInputTokens = input.monthlyRequests * input.inputTokensPerRequest;
  const monthlyOutputTokens = input.monthlyRequests * input.outputTokensPerRequest;
  const inputPrice = input.useBatch
    ? (input.batchInputPricePerMillion ?? input.inputPricePerMillion)
    : input.inputPricePerMillion;
  const outputPrice = input.useBatch
    ? (input.batchOutputPricePerMillion ?? input.outputPricePerMillion)
    : input.outputPricePerMillion;
  const cacheHitRate = Math.min(Math.max(input.cacheHitRate, 0), 1);
  const cacheReadPrice = input.cacheReadPricePerMillion ?? inputPrice;
  const cachedTokens = monthlyInputTokens * cacheHitRate;
  const uncachedTokens = monthlyInputTokens - cachedTokens;
  const inputCost =
    (uncachedTokens / 1_000_000) * inputPrice + (cachedTokens / 1_000_000) * cacheReadPrice;
  const outputCost = (monthlyOutputTokens / 1_000_000) * outputPrice;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    monthlyInputTokens,
    monthlyOutputTokens,
  };
}
