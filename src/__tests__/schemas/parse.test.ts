import { describe, expect, test } from 'bun:test';
import { parseRequestSchema } from '~/schemas/parse';

describe('parseRequestSchema', () => {
  test('accepts a valid https URL', () => {
    const result = parseRequestSchema.safeParse({ url: 'https://example.com/article' });
    expect(result.success).toBe(true);
  });

  test('accepts a valid http URL', () => {
    const result = parseRequestSchema.safeParse({ url: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  test('rejects an empty url', () => {
    const result = parseRequestSchema.safeParse({ url: '' });
    expect(result.success).toBe(false);
  });

  test('rejects a non-url string', () => {
    const result = parseRequestSchema.safeParse({ url: 'not a url' });
    expect(result.success).toBe(false);
  });

  test('rejects a missing url field', () => {
    const result = parseRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('rejects a non-http(s) scheme', () => {
    const result = parseRequestSchema.safeParse({ url: 'file:///etc/passwd' });
    expect(result.success).toBe(false);
  });
});
