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
