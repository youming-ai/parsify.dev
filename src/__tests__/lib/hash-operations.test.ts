import { describe, expect, it } from 'vitest';
import {
  generateSalt,
  hashData,
  hmacData,
  hmacSha256,
  pbkdf2,
  sha1,
  sha256,
  sha384,
  sha512,
} from '../../lib/crypto/hash-operations';

describe('hashData', () => {
  it('hashes string with default SHA-256', async () => {
    const result = await hashData({ data: 'test' });
    expect(result.success).toBe(true);
    expect(result.hash).toBeDefined();
    expect(result.hash).toHaveLength(64);
  });

  it('produces consistent hashes for same input', async () => {
    const result1 = await hashData({ data: 'hello world' });
    const result2 = await hashData({ data: 'hello world' });
    expect(result1.hash).toBe(result2.hash);
  });

  it('produces different hashes for different inputs', async () => {
    const result1 = await hashData({ data: 'hello' });
    const result2 = await hashData({ data: 'world' });
    expect(result1.hash).not.toBe(result2.hash);
  });

  it('supports different algorithms', async () => {
    const sha1Result = await hashData({ data: 'test', algorithm: 'SHA-1' });
    const sha256Result = await hashData({ data: 'test', algorithm: 'SHA-256' });
    const sha384Result = await hashData({ data: 'test', algorithm: 'SHA-384' });
    const sha512Result = await hashData({ data: 'test', algorithm: 'SHA-512' });

    expect(sha1Result.hash).toHaveLength(40);
    expect(sha256Result.hash).toHaveLength(64);
    expect(sha384Result.hash).toHaveLength(96);
    expect(sha512Result.hash).toHaveLength(128);
  });
});

describe('sha helper functions', () => {
  it('sha1 produces 40 character hash', async () => {
    const result = await sha1('test');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(40);
  });

  it('sha256 produces 64 character hash', async () => {
    const result = await sha256('test');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(64);
  });

  it('sha384 produces 96 character hash', async () => {
    const result = await sha384('test');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(96);
  });

  it('sha512 produces 128 character hash', async () => {
    const result = await sha512('test');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(128);
  });
});

describe('hmacData', () => {
  it('generates HMAC with string key', async () => {
    const result = await hmacData({
      data: 'message',
      key: 'secret-key',
      algorithm: 'SHA-256',
    });
    expect(result.success).toBe(true);
    expect(result.hmac).toBeDefined();
    expect(result.hmac).toHaveLength(64);
  });

  it('produces consistent HMACs for same inputs', async () => {
    const result1 = await hmacData({ data: 'message', key: 'key' });
    const result2 = await hmacData({ data: 'message', key: 'key' });
    expect(result1.hmac).toBe(result2.hmac);
  });

  it('produces different HMACs for different keys', async () => {
    const result1 = await hmacData({ data: 'message', key: 'key1' });
    const result2 = await hmacData({ data: 'message', key: 'key2' });
    expect(result1.hmac).not.toBe(result2.hmac);
  });
});

describe('hmacSha256', () => {
  it('generates HMAC-SHA256', async () => {
    const result = await hmacSha256('data', 'key');
    expect(result.success).toBe(true);
    expect(result.hmac).toHaveLength(64);
  });
});

describe('generateSalt', () => {
  it('generates salt of default length', () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(64);
  });

  it('generates salt of specified length', () => {
    const salt = generateSalt(16);
    expect(salt).toHaveLength(32);
  });

  it('generates different salts each time', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toBe(salt2);
  });

  it('generates hexadecimal string', () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]+$/);
  });
});

describe('pbkdf2', () => {
  it('derives key from password and salt', async () => {
    const result = await pbkdf2('password', 'salt');
    expect(result.success).toBe(true);
    expect(result.hash).toBeDefined();
    expect(result.hash).toHaveLength(64);
  });

  it('produces consistent results for same inputs', async () => {
    const result1 = await pbkdf2('password', 'salt', 1000);
    const result2 = await pbkdf2('password', 'salt', 1000);
    expect(result1.hash).toBe(result2.hash);
  });

  it('produces different results for different passwords', async () => {
    const result1 = await pbkdf2('password1', 'salt', 1000);
    const result2 = await pbkdf2('password2', 'salt', 1000);
    expect(result1.hash).not.toBe(result2.hash);
  });

  it('produces different results for different salts', async () => {
    const result1 = await pbkdf2('password', 'salt1', 1000);
    const result2 = await pbkdf2('password', 'salt2', 1000);
    expect(result1.hash).not.toBe(result2.hash);
  });

  it('produces different results for different iteration counts', async () => {
    const result1 = await pbkdf2('password', 'salt', 1000);
    const result2 = await pbkdf2('password', 'salt', 2000);
    expect(result1.hash).not.toBe(result2.hash);
  });

  it('respects custom key length', async () => {
    const result = await pbkdf2('password', 'salt', 1000, 16);
    expect(result.hash).toHaveLength(32);
  });
});
