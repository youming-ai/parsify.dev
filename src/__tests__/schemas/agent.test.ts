import { describe, expect, test } from 'bun:test';
import { agentRequestSchema } from '~/schemas/agent';

describe('agentRequestSchema', () => {
  test('accepts a minimal valid body', () => {
    const result = agentRequestSchema.safeParse({
      markdown: '# Hello',
      apiKey: 'sk-test-1234',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('glm-5.1');
      expect(typeof result.data.prompt).toBe('string');
    }
  });

  test('accepts an overridden prompt and model', () => {
    const result = agentRequestSchema.safeParse({
      markdown: '# Hello',
      apiKey: 'sk-test-1234',
      prompt: 'summarise this',
      model: 'glm-4-plus',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('glm-4-plus');
      expect(result.data.prompt).toBe('summarise this');
    }
  });

  test('rejects an empty markdown', () => {
    const r = agentRequestSchema.safeParse({ markdown: '', apiKey: 'sk-test' });
    expect(r.success).toBe(false);
  });

  test('rejects a missing apiKey', () => {
    const r = agentRequestSchema.safeParse({ markdown: '# Hello' });
    expect(r.success).toBe(false);
  });

  test('rejects a markdown over 1 MB', () => {
    const big = 'x'.repeat(1024 * 1024 + 1);
    const r = agentRequestSchema.safeParse({ markdown: big, apiKey: 'sk-test' });
    expect(r.success).toBe(false);
  });

  test('rejects a model not in the whitelist', () => {
    const r = agentRequestSchema.safeParse({
      markdown: '# Hello',
      apiKey: 'sk-test',
      model: 'gpt-4',
    });
    expect(r.success).toBe(false);
  });
});
