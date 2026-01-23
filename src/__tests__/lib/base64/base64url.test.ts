import { describe, expect, it } from 'vitest';

import {
  decodeBase64UrlToBytes,
  decodeBase64UrlToString,
  encodeBase64Url,
} from '../../../lib/base64/base64url';

describe('base64url', () => {
  it('encodes "hello" without padding', () => {
    expect(encodeBase64Url('hello')).toBe('aGVsbG8');
  });

  it('decodes "aGVsbG8" to "hello"', () => {
    const result = decodeBase64UrlToString('aGVsbG8');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('accepts padding when decoding', () => {
    const withPadding = decodeBase64UrlToString('aGVsbG8=');
    const withoutPadding = decodeBase64UrlToString('aGVsbG8');
    expect(withPadding.success).toBe(true);
    expect(withPadding.data).toBe('hello');
    expect(withoutPadding.success).toBe(true);
    expect(withoutPadding.data).toBe('hello');
  });

  it('maps +/ to -_ (url-safe alphabet)', () => {
    const bytes = new Uint8Array([0xfb, 0xef, 0xff]); // base64: ++//
    const encoded = encodeBase64Url(bytes);
    expect(encoded).toBe('--__');

    const decoded = decodeBase64UrlToBytes(encoded);
    expect(decoded.success).toBe(true);
    expect(Array.from(decoded.data ?? [])).toEqual(Array.from(bytes));
  });

  it('rejects invalid characters and whitespace', () => {
    const cases = ['aGVs bG8', 'aGVsbG8*', 'aGVsbG8~', '你好', 'a'];

    for (const value of cases) {
      const result = decodeBase64UrlToBytes(value);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('rejects invalid padding placement', () => {
    const cases = ['ab=c', 'aGVsbG8==a', 'abc==='];

    for (const value of cases) {
      const result = decodeBase64UrlToBytes(value);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('round-trips arbitrary bytes, including null byte', () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0x10, 0x20, 0x7f]);
    const encoded = encodeBase64Url(bytes);
    const decoded = decodeBase64UrlToBytes(encoded);
    expect(decoded.success).toBe(true);
    expect(Array.from(decoded.data ?? [])).toEqual(Array.from(bytes));
  });
});
