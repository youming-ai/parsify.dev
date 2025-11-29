/**
 * RSA Encryption/Decryption Utilities
 * Implements RSA-OAEP encryption and signing using Web Crypto API
 */

export interface RSAKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface RSAEncryptionOptions {
  publicKey: CryptoKey;
  data: string | ArrayBuffer;
}

export interface RSADecryptionOptions {
  privateKey: CryptoKey;
  encryptedData: ArrayBuffer;
}

export interface RSASignOptions {
  privateKey: CryptoKey;
  data: string | ArrayBuffer;
}

export interface RSAVerifyOptions {
  publicKey: CryptoKey;
  signature: ArrayBuffer;
  data: string | ArrayBuffer;
}

export interface RSAResult {
  success: boolean;
  data?: ArrayBuffer;
  signature?: ArrayBuffer;
  keyPair?: RSAKeyPair;
  error?: string;
}

/**
 * Generate RSA key pair
 */
export async function generateRSAKeyPair(modulusLength = 2048): Promise<RSAResult> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: { name: 'SHA-256' },
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      success: true,
      keyPair: keyPair as RSAKeyPair,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Key generation failed',
    };
  }
}

/**
 * Generate RSA key pair for signing
 */
export async function generateRSASigningKeyPair(modulusLength = 2048): Promise<RSAResult> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: { name: 'SHA-256' },
      },
      true,
      ['sign', 'verify']
    );

    return {
      success: true,
      keyPair: keyPair as RSAKeyPair,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signing key generation failed',
    };
  }
}

/**
 * RSA Encryption
 */
export async function rsaEncrypt(options: RSAEncryptionOptions): Promise<RSAResult> {
  try {
    // Convert data to ArrayBuffer
    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      options.publicKey,
      dataArrayBuffer
    );

    return {
      success: true,
      data: encryptedData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Encryption failed',
    };
  }
}

/**
 * RSA Decryption
 */
export async function rsaDecrypt(options: RSADecryptionOptions): Promise<RSAResult> {
  try {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      options.privateKey,
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
 * RSA Sign
 */
export async function rsaSign(options: RSASignOptions): Promise<RSAResult> {
  try {
    // Convert data to ArrayBuffer
    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    const signature = await crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      options.privateKey,
      dataArrayBuffer
    );

    return {
      success: true,
      signature: signature,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signing failed',
    };
  }
}

/**
 * RSA Verify
 */
export async function rsaVerify(options: RSAVerifyOptions): Promise<RSAResult> {
  try {
    // Convert data to ArrayBuffer
    let dataArrayBuffer: ArrayBuffer;
    if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArrayBuffer = encoder.encode(options.data).buffer;
    } else {
      dataArrayBuffer = options.data;
    }

    const isValid = await crypto.subtle.verify(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      options.publicKey,
      options.signature,
      dataArrayBuffer
    );

    return {
      success: true,
      data: new ArrayBuffer(isValid ? 1 : 0), // Use as boolean indicator
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Export RSA key to PEM format
 */
export async function exportRSAPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  const exportedAsBase64 = btoa(exportedAsString);
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = exportedAsBase64.match(/.{1,64}/g)?.join('\n') || exportedAsBase64;
  return `${pemHeader}\n${pemContents}\n${pemFooter}`;
}

/**
 * Import RSA key from PEM format
 */
export async function importRSAPublicKey(pem: string): Promise<CryptoKey> {
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = pem
    .substring(pemHeader.length, pem.length - pemFooter.length)
    .replace(/\s/g, '');
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    },
    true,
    ['encrypt']
  );
}
