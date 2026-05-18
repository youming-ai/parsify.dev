import { MODEL_PRICING, type ModelId } from '~/lib/parser/models';

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function savingsRatio(htmlBytes: number, mdBytes: number): number {
  if (htmlBytes <= 0) return 0;
  if (mdBytes >= htmlBytes) return 0;
  return 1 - mdBytes / htmlBytes;
}

export function priceFor(model: ModelId, inputTokens: number, outputTokens: number): number | null {
  const price = MODEL_PRICING[model];
  if (price === null) return null;
  const cost =
    (inputTokens / 1_000_000) * price.inputPerMTok +
    (outputTokens / 1_000_000) * price.outputPerMTok;
  return Number(cost.toFixed(6));
}
