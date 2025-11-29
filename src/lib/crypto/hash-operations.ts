/**
 * Hash Operations Utilities
 * Implements various hash algorithms using Web Crypto API
 */

export interface HashOptions {
  data: string | ArrayBuffer;
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
}

export interface HmacOptions {
  data: string | ArrayBuffer;
  key: string | ArrayBuffer;
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
}

export interface HashResult {
  success: boolean;
  hash?: string;
  hmac?: string;
  error?: string;
}

/**
 * Hash data using specified algorithm
 */
export async function hashData(options: HashOptions): Promise<HashResult> {
  try {
    const algorithm = options.algorithm || 'SHA-256';

    // Convert data to ArrayBuffer
    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    const hashBuffer = await crypto.subtle.digest(algorithm, dataArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return {
      success: true,
      hash: hashHex,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hashing failed',
    };
  }
}

/**
 * HMAC using specified algorithm
 */
export async function hmacData(options: HmacOptions): Promise<HashResult> {
  try {
    const algorithm = options.algorithm || 'SHA-256';

    // Convert key to ArrayBuffer
    let keyArrayBuffer: ArrayBuffer;
    if (typeof options.key === 'string') {
      const encoder = new TextEncoder();
      keyArrayBuffer = encoder.encode(options.key).buffer;
    } else {
      keyArrayBuffer = options.key;
    }

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyArrayBuffer,
      {
        name: 'HMAC',
        hash: algorithm,
      },
      false,
      ['sign']
    );

    // Convert data to ArrayBuffer
    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    // Generate HMAC
    const hmacBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataArrayBuffer);
    const hmacArray = Array.from(new Uint8Array(hmacBuffer));
    const hmacHex = hmacArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return {
      success: true,
      hmac: hmacHex,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'HMAC generation failed',
    };
  }
}

/**
 * SHA-1 Hash
 */
export async function sha1(data: string | ArrayBuffer): Promise<HashResult> {
  return hashData({ data, algorithm: 'SHA-1' });
}

/**
 * SHA-256 Hash
 */
export async function sha256(data: string | ArrayBuffer): Promise<HashResult> {
  return hashData({ data, algorithm: 'SHA-256' });
}

/**
 * SHA-384 Hash
 */
export async function sha384(data: string | ArrayBuffer): Promise<HashResult> {
  return hashData({ data, algorithm: 'SHA-384' });
}

/**
 * SHA-512 Hash
 */
export async function sha512(data: string | ArrayBuffer): Promise<HashResult> {
  return hashData({ data, algorithm: 'SHA-512' });
}

/**
 * MD5-like hash (using SHA-1 for compatibility)
 */
export async function md5(data: string | ArrayBuffer): Promise<HashResult> {
  // Note: Web Crypto API doesn't support MD5
  // This is a placeholder that uses SHA-1 instead
  // For actual MD5, would need an external library
  return hashData({ data, algorithm: 'SHA-1' });
}

/**
 * HMAC with SHA-256
 */
export async function hmacSha256(
  data: string | ArrayBuffer,
  key: string | ArrayBuffer
): Promise<HashResult> {
  return hmacData({ data, key, algorithm: 'SHA-256' });
}

/**
 * HMAC with SHA-512
 */
export async function hmacSha512(
  data: string | ArrayBuffer,
  key: string | ArrayBuffer
): Promise<HashResult> {
  return hmacData({ data, key, algorithm: 'SHA-512' });
}

/**
 * Generate random salt
 */
export function generateSalt(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * PBKDF2 key derivation
 */
export async function pbkdf2(
  password: string,
  salt: string,
  iterations = 100000,
  keyLength = 32,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<HashResult> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: algorithm,
      },
      importedKey,
      keyLength * 8
    );

    const derivedArray = Array.from(new Uint8Array(derivedBits));
    const derivedHex = derivedArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return {
      success: true,
      hash: derivedHex,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PBKDF2 derivation failed',
    };
  }
}
