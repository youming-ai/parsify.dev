/**
 * Crypto Operations Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { aesEncrypt, aesDecrypt, generateAESKey, arrayBufferToHex, hexToArrayBuffer } from '../aes-operations';
import { generateRSAKeyPair, rsaEncrypt, rsaDecrypt } from '../rsa-operations';
import { hashData, hmacData, sha256, hmacSha256, generateSalt, pbkdf2 } from '../hash-operations';

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    digest: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    exportKey: vi.fn(),
    deriveBits: vi.fn(),
  },
  getRandomValues: vi.fn(),
} as any;

// Replace global crypto with mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('AES Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate AES key', () => {
    const mockArray = new Uint8Array(32);
    mockCrypto.getRandomValues.mockReturnValue(mockArray);

    const key = generateAESKey();

    expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(32));
    expect(key).toBe(mockArray.buffer);
  });

  it('should convert array buffer to hex', () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view[0] = 0x0a;
    view[1] = 0xf0;
    view[2] = 0x00;
    view[3] = 0xff;

    const hex = arrayBufferToHex(buffer);

    expect(hex).toBe('0af000ff');
  });

  it('should convert hex to array buffer', () => {
    const hex = '0af000ff';
    const buffer = hexToArrayBuffer(hex);

    const view = new Uint8Array(buffer);
    expect(view[0]).toBe(0x0a);
    expect(view[1]).toBe(0xf0);
    expect(view[2]).toBe(0x00);
    expect(view[3]).toBe(0xff);
  });
});

describe('RSA Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate RSA key pair', async () => {
    const mockKeyPair = {
      publicKey: 'mock-public-key',
      privateKey: 'mock-private-key',
    };

    mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair);

    const result = await generateRSAKeyPair();

    expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: 'SHA-256' },
      },
      true,
      ['encrypt', 'decrypt']
    );

    expect(result.success).toBe(true);
    expect(result.keyPair).toEqual(mockKeyPair);
  });
});

describe('Hash Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hash data with SHA-256', async () => {
    const mockHash = new ArrayBuffer(32);
    mockCrypto.subtle.digest.mockResolvedValue(mockHash);

    const result = await hashData({ data: 'test data', algorithm: 'SHA-256' });

    expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer));
    expect(result.success).toBe(true);
  });

  it('should generate HMAC', async () => {
    const mockHmac = new ArrayBuffer(32);
    const mockKey = { name: 'HMAC', hash: 'SHA-256' };

    mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
    mockCrypto.subtle.sign.mockResolvedValue(mockHmac);

    const result = await hmacData({ data: 'test data', key: 'secret key' });

    expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
    expect(mockCrypto.subtle.sign).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should generate random salt', () => {
    const mockSalt = 'abcdef1234567890';
    mockCrypto.getRandomValues.mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      return arr;
    });

    const salt = generateSalt(16);

    expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(16));
    expect(salt).toHaveLength(32); // 16 bytes * 2 hex chars each
  });
});
