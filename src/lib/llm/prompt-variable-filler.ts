import { estimateTokens } from '@/lib/llm/text-chunker';

export interface VariableInfo {
  name: string;
  syntax: string;
}

export interface FillResult {
  filled: string;
  estimatedTokens: number;
  missingVariables: string[];
}

export function extractVariables(template: string): VariableInfo[] {
  const seen = new Set<string>();
  const results: VariableInfo[] = [];
  const regex = /\{\{([^}]+)\}\}|\$\{([^}]+)\}|\{([a-zA-Z_]\w*)\}/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    const name = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!seen.has(name)) {
      seen.add(name);
      results.push({ name, syntax: match[0] });
    }
  }
  return results;
}

export function fillTemplate(template: string, values: Record<string, string>): FillResult {
  const vars = extractVariables(template);
  const missing: string[] = [];
  let filled = template;
  for (const v of vars) {
    const value = values[v.name];
    if (value === undefined || value === '') {
      missing.push(v.name);
    } else {
      filled = filled.replaceAll(v.syntax, value);
    }
  }
  return {
    filled,
    estimatedTokens: estimateTokens(filled),
    missingVariables: missing,
  };
}

export function exportFilledJsonl(template: string, rows: Array<Record<string, string>>): string {
  return rows
    .map((row) => {
      const { filled } = fillTemplate(template, row);
      return JSON.stringify({ prompt: filled, variables: row });
    })
    .join('\n');
}
