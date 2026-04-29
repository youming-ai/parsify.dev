import { analyzeContextInput } from '@/lib/llm/context-visualizer';
import { describe, expect, it } from 'vitest';

describe('analyzeContextInput', () => {
  it('parses OpenAI-style messages', () => {
    const result = analyzeContextInput(
      '[{"role":"system","content":"Be concise"},{"role":"user","content":"Hello"}]',
      10000
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]?.role).toBe('system');
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  it('falls back to one user segment for plain text', () => {
    const result = analyzeContextInput('plain prompt', 1000);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]?.role).toBe('user');
  });

  it('calculates context usage percent', () => {
    const result = analyzeContextInput('hello world', 100);
    expect(result.contextUsagePercent).toBeGreaterThan(0);
    expect(result.contextUsagePercent).toBeLessThanOrEqual(100);
  });

  it('calculates remaining tokens correctly', () => {
    const result = analyzeContextInput('short', 1000);
    expect(result.remainingTokens).toBeGreaterThan(0);
    expect(result.remainingTokens).toBeLessThan(1000);
  });

  it('provides trim suggestion for non-system messages', () => {
    const result = analyzeContextInput(
      '[{"role":"system","content":"system prompt"},{"role":"user","content":"user prompt"}]',
      1000
    );
    expect(result.trimSuggestion).toContain('Trim user 2');
  });

  it('caps context usage at 100 percent', () => {
    const longText = 'a'.repeat(4000);
    const result = analyzeContextInput(longText, 100);
    expect(result.contextUsagePercent).toBe(100);
  });
});
