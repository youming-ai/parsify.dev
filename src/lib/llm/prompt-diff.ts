import { estimateTokens } from '@/lib/llm/text-chunker';

export interface PromptDiffResult {
  added: number;
  removed: number;
  unchanged: number;
  tokenDelta: number;
  originalVariables: string[];
  revisedVariables: string[];
}

export function extractPromptVariables(prompt: string): string[] {
  const matches = prompt.match(/\{\{([^}]+)\}\}/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2).trim())));
}

function wordSet(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter((w) => w.length > 0));
}

function tokenDelta(original: string, revised: string): number {
  return estimateTokens(revised) - estimateTokens(original);
}

export function comparePrompts(original: string, revised: string): PromptDiffResult {
  const originalWords = wordSet(original);
  const revisedWords = wordSet(revised);

  const added = Array.from(revisedWords).filter((w) => !originalWords.has(w)).length;
  const removed = Array.from(originalWords).filter((w) => !revisedWords.has(w)).length;
  const unchanged = Array.from(originalWords).filter((w) => revisedWords.has(w)).length;

  return {
    added,
    removed,
    unchanged,
    tokenDelta: tokenDelta(original, revised),
    originalVariables: extractPromptVariables(original),
    revisedVariables: extractPromptVariables(revised),
  };
}
