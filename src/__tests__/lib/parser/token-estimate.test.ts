import { describe, expect, test } from 'bun:test';
import { estimateTokens, savingsRatio } from '~/lib/parser/token-estimate';

describe('estimateTokens', () => {
  test('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('rounds up to whole tokens (4 chars per token)', () => {
    expect(estimateTokens('abc')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });
});

describe('savingsRatio', () => {
  test('returns 0 when nothing saved', () => {
    expect(savingsRatio(100, 100)).toBe(0);
  });

  test('returns 0.5 when half is saved', () => {
    expect(savingsRatio(100, 50)).toBe(0.5);
  });

  test('returns 1 when md is empty', () => {
    expect(savingsRatio(100, 0)).toBe(1);
  });

  test('returns 0 when html is 0 (avoids divide-by-zero)', () => {
    expect(savingsRatio(0, 0)).toBe(0);
  });

  test('returns 0 when md exceeds html (clamp)', () => {
    expect(savingsRatio(100, 150)).toBe(0);
  });
});
