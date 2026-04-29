import { comparePrompts, extractPromptVariables } from '@/lib/llm/prompt-diff';
import { describe, expect, it } from 'vitest';

describe('extractPromptVariables', () => {
  it('extracts double-braced variables', () => {
    const vars = extractPromptVariables('Hello {{name}}, your order {{orderId}} is ready.');
    expect(vars).toEqual(['name', 'orderId']);
  });

  it('deduplicates repeated variables', () => {
    const vars = extractPromptVariables('{{x}} {{x}} {{x}}');
    expect(vars).toEqual(['x']);
  });

  it('returns empty array for plain text', () => {
    expect(extractPromptVariables('no variables')).toEqual([]);
  });
});

describe('comparePrompts', () => {
  it('computes added, removed, unchanged counts', () => {
    const result = comparePrompts('hello world', 'hello new world');
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(2);
  });

  it('computes token delta', () => {
    const result = comparePrompts('hello world', 'hello new world extra words here');
    expect(result.tokenDelta).toBeGreaterThan(0);
  });

  it('extracts variables from both prompts', () => {
    const result = comparePrompts('{{a}}', '{{b}}');
    expect(result.originalVariables).toEqual(['a']);
    expect(result.revisedVariables).toEqual(['b']);
  });

  it('handles identical prompts', () => {
    const result = comparePrompts('same prompt', 'same prompt');
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(2);
    expect(result.tokenDelta).toBe(0);
  });
});
