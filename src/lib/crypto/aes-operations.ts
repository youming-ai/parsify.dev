/**
 * AES Encryption/Decryption Utilities
 * Implements AES-256-GCM encryption using Web Crypto API with PBKDF2 key derivation
 */

import { pbkdf2 } from './hash-operations';

export interface AESEncryptionOptions {
  key: string | ArrayBuffer;
  iv?: ArrayBuffer;
  data: string | ArrayBuffer;
  salt?: string;
  iterations?: number;
}

export interface AESDecryptionOptions {
  key: string | ArrayBuffer;
  iv: ArrayBuffer;
  encryptedData: ArrayBuffer;
  salt?: string;
  iterations?: number;
}

export interface AESResult {
  success: boolean;
  data?: ArrayBuffer;
  iv?: ArrayBuffer;
  salt?: string;
  error?: string;
}

/**
 * AES Encryption
 */
export async function aesEncrypt(options: AESEncryptionOptions): Promise<AESResult> {
  try {
    let cryptoKey: CryptoKey;
    let salt: string | undefined;
    const iterations = options.iterations ?? 100000;

    if (typeof options.key === 'string') {
      salt =
        options.salt ||
        Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

      const derivedKey = await pbkdf2(options.key, salt, iterations, 32, 'SHA-256');

      if (!derivedKey.success || !derivedKey.hash) {
        throw new Error(derivedKey.error || 'Key derivation failed');
      }

      const keyArray = new Uint8Array(32);
      const hashBytes = derivedKey.hash!.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16));
      for (let i = 0; i < 32; i++) {
        keyArray[i] = hashBytes[i]!;
      }

      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyArray.buffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
    } else {
      cryptoKey = await crypto.subtle.importKey('raw', options.key, { name: 'AES-GCM' }, false, [
        'encrypt',
      ]);
    }

    const ivArray = options.iv
      ? new Uint8Array(options.iv)
      : crypto.getRandomValues(new Uint8Array(12));
    const ivBuffer = ivArray.buffer;

    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      dataArrayBuffer
    );

    return {
      success: true,
      data: encryptedData,
      iv: ivBuffer,
      salt: salt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Encryption failed',
    };
  }
}

/**
 * AES Decryption
 */
export async function aesDecrypt(options: AESDecryptionOptions): Promise<AESResult> {
  try {
    let cryptoKey: CryptoKey;
    const iterations = options.iterations ?? 100000;

    if (typeof options.key === 'string') {
      const salt = options.salt;

      if (!salt) {
        throw new Error('Salt is required for password-based decryption');
      }

      const derivedKey = await pbkdf2(options.key, salt, iterations, 32, 'SHA-256');

      if (!derivedKey.success || !derivedKey.hash) {
        throw new Error(derivedKey.error || 'Key derivation failed');
      }

      const keyArray = new Uint8Array(32);
      const hashBytes = derivedKey.hash!.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16));
      for (let i = 0; i < 32; i++) {
        keyArray[i] = hashBytes[i]!;
      }

      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyArray.buffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
    } else {
      cryptoKey = await crypto.subtle.importKey('raw', options.key, { name: 'AES-GCM' }, false, [
        'decrypt',
      ]);
    }

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: options.iv },
      cryptoKey,
      options.encryptedData
    );

    return {
      success: true,
      data: decryptedData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Decryption failed',
    };
  }
}

/**
 * Generate AES key
 */
export function generateAESKey(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(32)).buffer;
}

/**
 * Convert array buffer to hex string
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to array buffer
 */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}
