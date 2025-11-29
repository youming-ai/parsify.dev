/**
 * AES Encryption/Decryption Utilities
 * Implements AES-256-CBC encryption using Web Crypto API
 */

export interface AESEncryptionOptions {
  key: string | ArrayBuffer;
  iv?: ArrayBuffer;
  data: string | ArrayBuffer;
}

export interface AESDecryptionOptions {
  key: string | ArrayBuffer;
  iv: ArrayBuffer;
  encryptedData: ArrayBuffer;
}

export interface AESResult {
  success: boolean;
  data?: ArrayBuffer;
  iv?: ArrayBuffer;
  error?: string;
}

/**
 * AES Encryption
 */
export async function aesEncrypt(options: AESEncryptionOptions): Promise<AESResult> {
  try {
    // Import or generate key
    let cryptoKey: CryptoKey;

    if (typeof options.key === 'string') {
      // Derive key from password
      const encoder = new TextEncoder();
      const keyData = encoder.encode(options.key);
      cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC' }, false, [
        'encrypt',
      ]);
    } else {
      cryptoKey = await crypto.subtle.importKey('raw', options.key, { name: 'AES-CBC' }, false, [
        'encrypt',
      ]);
    }

    // Generate or use provided IV
    const ivArray = options.iv
      ? new Uint8Array(options.iv)
      : crypto.getRandomValues(new Uint8Array(16));
    const ivBuffer = ivArray.buffer;

    // Convert data to ArrayBuffer
    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: ivBuffer,
      },
      cryptoKey,
      dataArrayBuffer
    );

    return {
      success: true,
      data: encryptedData,
      iv: ivBuffer,
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
    // Import key
    let cryptoKey: CryptoKey;

    if (typeof options.key === 'string') {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(options.key);
      cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC' }, false, [
        'decrypt',
      ]);
    } else {
      cryptoKey = await crypto.subtle.importKey('raw', options.key, { name: 'AES-CBC' }, false, [
        'decrypt',
      ]);
    }

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: options.iv,
      },
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
  return crypto.getRandomValues(new Uint8Array(32)).buffer; // 256-bit key
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
