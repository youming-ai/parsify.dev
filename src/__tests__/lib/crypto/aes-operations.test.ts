import {
  aesDecrypt,
  aesEncrypt,
  arrayBufferToHex,
  generateAESKey,
  hexToArrayBuffer,
} from '@/lib/crypto/aes-operations';
import { describe, expect, it } from 'vitest';

describe('aesEncrypt and aesDecrypt', () => {
  it('encrypts and decrypts string data round-trip', async () => {
    const encryptResult = await aesEncrypt({
      key: 'strong-password',
      data: 'Top secret payload',
    });

    expect(encryptResult.success).toBe(true);
    expect(encryptResult.data).toBeInstanceOf(ArrayBuffer);
    expect(encryptResult.iv).toBeInstanceOf(ArrayBuffer);
    expect(encryptResult.salt).toBeDefined();

    const decryptResult = await aesDecrypt({
      key: 'strong-password',
      iv: encryptResult.iv!,
      encryptedData: encryptResult.data!,
      salt: encryptResult.salt,
    });

    expect(decryptResult.success).toBe(true);
    expect(decryptResult.data).toBeInstanceOf(ArrayBuffer);

    const decoded = new TextDecoder().decode(decryptResult.data!);
    expect(decoded).toBe('Top secret payload');
  });

  it('fails gracefully when decrypting with wrong key', async () => {
    const encryptResult = await aesEncrypt({
      key: 'correct-password',
      data: 'Sensitive text',
    });

    expect(encryptResult.success).toBe(true);

    const decryptResult = await aesDecrypt({
      key: 'wrong-password',
      iv: encryptResult.iv!,
      encryptedData: encryptResult.data!,
      salt: encryptResult.salt,
    });

    expect(decryptResult.success).toBe(false);
    expect(decryptResult.error).toBeDefined();
  });

  it('handles empty input data', async () => {
    const encryptResult = await aesEncrypt({
      key: 'empty-test-password',
      data: '',
    });

    expect(encryptResult.success).toBe(true);
    expect(encryptResult.data).toBeInstanceOf(ArrayBuffer);

    const decryptResult = await aesDecrypt({
      key: 'empty-test-password',
      iv: encryptResult.iv!,
      encryptedData: encryptResult.data!,
      salt: encryptResult.salt,
    });

    expect(decryptResult.success).toBe(true);

    const decoded = new TextDecoder().decode(decryptResult.data!);
    expect(decoded).toBe('');
  });
});

describe('generateAESKey', () => {
  it('returns a valid 256-bit key buffer', () => {
    const key = generateAESKey();
    expect(key).toBeInstanceOf(ArrayBuffer);
    expect(key.byteLength).toBe(32);

    const keyBytes = new Uint8Array(key);
    const nonZeroBytes = keyBytes.some((byte) => byte !== 0);
    expect(nonZeroBytes).toBe(true);
  });
});

describe('arrayBufferToHex and hexToArrayBuffer', () => {
  it('converts ArrayBuffer to hex and back round-trip', () => {
    const original = generateAESKey();

    const hex = arrayBufferToHex(original);
    expect(hex).toHaveLength(64);
    expect(hex).toMatch(/^[0-9a-f]+$/);

    const restored = hexToArrayBuffer(hex);
    expect(restored).toBeInstanceOf(ArrayBuffer);
    expect(restored.byteLength).toBe(original.byteLength);

    const originalBytes = new Uint8Array(original);
    const restoredBytes = new Uint8Array(restored);
    expect(Array.from(restoredBytes)).toEqual(Array.from(originalBytes));
  });
});
