import { extractVariables, fillTemplate } from '@/lib/llm/prompt-variable-filler';
import { describe, expect, it } from 'vitest';

describe('prompt variable filler', () => {
  it('extracts double brace variables', () => {
    expect(extractVariables('Hello {{name}}')).toEqual([{ name: 'name', syntax: '{{name}}' }]);
  });

  it('fills template values', () => {
    const result = fillTemplate('Hi {{name}}', { name: 'Ada' });
    expect(result.filled).toBe('Hi Ada');
    expect(result.missingVariables).toHaveLength(0);
  });
});
