import { describe, expect, test } from 'bun:test';
import { agentRequestSchema } from '~/schemas/agent';

describe('agentRequestSchema', () => {
  test('accepts a minimal valid body', () => {
    const result = agentRequestSchema.safeParse({ markdown: '# Hello' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.prompt).toBe('string');
    }
  });

  test('accepts a custom prompt', () => {
    const result = agentRequestSchema.safeParse({
      markdown: '# Hello',
      prompt: 'summarise this',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prompt).toBe('summarise this');
    }
  });

  test('rejects an empty markdown', () => {
    const r = agentRequestSchema.safeParse({ markdown: '' });
    expect(r.success).toBe(false);
  });

  test('rejects a markdown over 1 MB', () => {
    const big = 'x'.repeat(1024 * 1024 + 1);
    const r = agentRequestSchema.safeParse({ markdown: big });
    expect(r.success).toBe(false);
  });

  test('rejects an empty prompt override', () => {
    const r = agentRequestSchema.safeParse({ markdown: '# Hello', prompt: '' });
    expect(r.success).toBe(false);
  });
});
