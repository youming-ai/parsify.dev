import { describe, expect, test } from 'bun:test';
import { agentRequestSchema } from '~/schemas/agent';

describe('agentRequestSchema', () => {
  test('accepts a valid markdown body', () => {
    const result = agentRequestSchema.safeParse({ markdown: '# Hello' });
    expect(result.success).toBe(true);
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
});
