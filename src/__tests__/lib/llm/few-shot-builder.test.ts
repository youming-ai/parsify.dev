import { renderFewShotPrompt } from '@/lib/llm/few-shot-builder';
import { describe, expect, it } from 'vitest';

describe('renderFewShotPrompt', () => {
  it('produces XML prompt', () => {
    const result = renderFewShotPrompt({
      task: 'Translate',
      examples: [{ input: 'Hello', output: 'Hola' }],
      style: 'xml',
    });
    expect(result.prompt).toContain('<task>Translate</task>');
    expect(result.exampleCount).toBe(1);
  });
});
