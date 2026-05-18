import { describe, expect, test } from 'bun:test';
import { estimateTokens } from '~/lib/parser/token-estimate';

describe('estimateTokens', () => {
  test('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('returns ceil(length / 4)', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcdefghij')).toBe(3);
  });

  test('handles unicode characters', () => {
    const text = '你好世界';
    expect(estimateTokens(text)).toBe(Math.ceil(text.length / 4));
  });

  test('rounds up partial tokens', () => {
    expect(estimateTokens('abc')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });
});
