export interface PromptFinding {
  rule: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface PromptLintResult {
  score: number;
  findings: PromptFinding[];
}

function hasWord(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w.toLowerCase()));
}

const severityWeight: Record<PromptFinding['severity'], number> = {
  low: 2,
  medium: 5,
  high: 10,
};

export function lintSystemPrompt(prompt: string): PromptLintResult {
  const findings: PromptFinding[] = [];
  const trimmed = prompt.trim();

  // 1. Empty prompt (high)
  if (trimmed.length === 0) {
    findings.push({
      rule: 'empty-prompt',
      severity: 'high',
      message: 'System prompt is empty.',
    });
  }

  // 2. Missing role instruction (medium)
  if (
    trimmed.length > 0 &&
    !hasWord(trimmed, ['you are', 'act as', 'your role', 'behave', 'assistant', 'system'])
  ) {
    findings.push({
      rule: 'missing-role',
      severity: 'medium',
      message: 'No role or behavior instruction found.',
    });
  }

  // 3. Excessive length (medium)
  if (trimmed.length > 5000) {
    findings.push({
      rule: 'excessive-length',
      severity: 'medium',
      message: 'Prompt exceeds 5000 characters; consider trimming.',
    });
  }

  // 4. Ambiguous wording (low)
  if (hasWord(trimmed, ['maybe', 'perhaps', 'try to', 'sometimes', 'a bit', 'somewhat'])) {
    findings.push({
      rule: 'ambiguous-wording',
      severity: 'low',
      message: 'Contains ambiguous words that may reduce instruction clarity.',
    });
  }

  // 5. No examples / few-shot (low)
  if (trimmed.length > 0 && !hasWord(trimmed, ['example', 'input:', 'output:', '```'])) {
    findings.push({
      rule: 'missing-examples',
      severity: 'low',
      message: 'No examples or code blocks found. Consider adding few-shot examples.',
    });
  }

  // 6. Excessive repetition (medium)
  const words = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...Array.from(wordCounts.values()));
  if (maxCount > 20) {
    findings.push({
      rule: 'excessive-repetition',
      severity: 'medium',
      message: `High repetition detected: a word appears ${maxCount} times.`,
    });
  }

  // 7. Missing output format (low)
  if (
    trimmed.length > 0 &&
    !hasWord(trimmed, ['json', 'format', 'output', 'return', 'respond with'])
  ) {
    findings.push({
      rule: 'missing-output-format',
      severity: 'low',
      message: 'No output format specification found.',
    });
  }

  // 8. Safety / jailbreak red flags (high)
  if (hasWord(trimmed, ['ignore previous', 'disregard', 'developer mode', 'dan mode'])) {
    findings.push({
      rule: 'safety-red-flag',
      severity: 'high',
      message: 'Potential safety red flag detected.',
    });
  }

  // 9. Missing constraints (low)
  if (
    trimmed.length > 0 &&
    !hasWord(trimmed, ['must', 'should', 'do not', 'never', 'always', 'must not'])
  ) {
    findings.push({
      rule: 'missing-constraints',
      severity: 'low',
      message: 'No constraint language (must, should, never, etc.) found.',
    });
  }

  // 10. Excessive whitespace (low)
  if (/\n\n+/.test(prompt) || prompt.startsWith(' ') || prompt.endsWith(' ')) {
    findings.push({
      rule: 'excessive-whitespace',
      severity: 'low',
      message: 'Excessive leading/trailing whitespace or blank lines.',
    });
  }

  const deduction = findings.reduce((sum, f) => sum + severityWeight[f.severity], 0);
  const score = Math.max(0, 100 - deduction);

  return { score, findings };
}
