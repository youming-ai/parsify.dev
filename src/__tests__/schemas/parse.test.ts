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

  test('rejects a private/loopback URL', () => {
    for (const url of [
      'http://localhost/foo',
      'http://127.0.0.1/',
      'http://192.168.1.1/',
      'http://10.0.0.1/',
      'http://169.254.169.254/latest/meta-data',
    ]) {
      const r = parseRequestSchema.safeParse({ url });
      expect(r.success).toBe(false);
    }
  });
});
