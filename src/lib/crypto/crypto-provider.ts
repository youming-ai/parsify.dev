/**
 * Web Crypto API Abstraction Layer
 * Provides unified interface for cryptographic operations
 */

export interface CryptoProvider {
  // Hash operations
  hash(data: string | ArrayBuffer, algorithm?: string): Promise<string>;
  hmac(data: string | ArrayBuffer, key: string | ArrayBuffer, algorithm?: string): Promise<string>;
  pbkdf2(password: string, salt: string, iterations?: number, keyLength?: number): Promise<string>;

  // Encryption operations
  generateAESKey(length?: number): Promise<ArrayBuffer>;
  aesEncrypt(data: string | ArrayBuffer, key: ArrayBuffer, iv?: ArrayBuffer): Promise<ArrayBuffer>;
  aesDecrypt(encryptedData: ArrayBuffer, key: ArrayBuffer, iv: ArrayBuffer): Promise<ArrayBuffer>;

  // RSA operations
  generateRSAKeyPair(modulusLength?: number): Promise<CryptoKeyPair>;
  rsaEncrypt(data: ArrayBuffer, publicKey: CryptoKey): Promise<ArrayBuffer>;
  rsaDecrypt(encryptedData: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer>;
  rsaSign(data: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer>;
  rsaVerify(data: ArrayBuffer, signature: ArrayBuffer, publicKey: CryptoKey): Promise<boolean>;

  // Utility operations
  generateRandomBytes(length: number): Promise<ArrayBuffer>;
  generateSalt(length?: number): Promise<string>;
  encodeBase64(data: ArrayBuffer): string;
  decodeBase64(base64: string): ArrayBuffer;

  // Format operations
  formatBytes(bytes: number): string;
  formatHash(hash: string, format?: 'hex' | 'base64' | 'binary'): string;

  // Metadata
  isAvailable(): boolean;
  getSupportedAlgorithms(): string[];
}

export interface EncryptionResult {
  success: boolean;
  data?: ArrayBuffer;
  iv?: ArrayBuffer;
  key?: ArrayBuffer;
  salt?: string;
  error?: string;
}

export interface DecryptionResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

export interface KeyPairResult {
  success: boolean;
  publicKey?: CryptoKey;
  privateKey?: CryptoKey;
  publicKeyPem?: string;
  privateKeyPem?: string;
  error?: string;
}

export interface HashResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export class WebCryptoProvider implements CryptoProvider {
  private static instance: WebCryptoProvider;
  private subtle: SubtleCrypto;
  private randomValues: <T extends ArrayBufferView>(array: T) => T;

  private constructor() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      this.subtle = window.crypto.subtle;
      this.randomValues = window.crypto.getRandomValues.bind(window.crypto);
    } else if (typeof global !== 'undefined' && global.crypto && global.crypto.subtle) {
      this.subtle = global.crypto.subtle;
      this.randomValues = global.crypto.getRandomValues.bind(global.crypto);
    } else {
      throw new Error('Web Crypto API is not available in this environment');
    }
  }

  public static getInstance(): WebCryptoProvider {
    if (!WebCryptoProvider.instance) {
      WebCryptoProvider.instance = new WebCryptoProvider();
    }
    return WebCryptoProvider.instance;
  }

  /**
   * Hash data using specified algorithm
   */
  public async hash(data: string | ArrayBuffer, algorithm = 'SHA-256'): Promise<string> {
    try {
      const dataArrayBuffer = this.toArrayBuffer(data);
      const hashBuffer = await this.subtle.digest(algorithm, dataArrayBuffer);
      return this.bufferToHex(hashBuffer);
    } catch (error) {
      throw new Error(
        `Hash operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * HMAC using specified algorithm
   */
  public async hmac(
    data: string | ArrayBuffer,
    key: string | ArrayBuffer,
    algorithm = 'SHA-256'
  ): Promise<string> {
    try {
      const dataArrayBuffer = this.toArrayBuffer(data);
      const keyArrayBuffer = this.toArrayBuffer(key);

      const cryptoKey = await this.subtle.importKey(
        'raw',
        keyArrayBuffer,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );

      const signatureBuffer = await this.subtle.sign('HMAC', cryptoKey, dataArrayBuffer);
      return this.bufferToHex(signatureBuffer);
    } catch (error) {
      throw new Error(
        `HMAC operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * PBKDF2 key derivation
   */
  public async pbkdf2(
    password: string,
    salt: string,
    iterations = 100000,
    keyLength = 32
  ): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      const saltBuffer = encoder.encode(salt);

      const importedKey = await this.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await this.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: 'SHA-256',
        },
        importedKey,
        keyLength * 8
      );

      return this.bufferToHex(derivedBits as ArrayBuffer);
    } catch (error) {
      throw new Error(
        `PBKDF2 operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate AES key
   */
  public async generateAESKey(length = 256): Promise<ArrayBuffer> {
    try {
      const key = await this.subtle.generateKey({ name: 'AES-GCM', length }, true, [
        'encrypt',
        'decrypt',
      ]);

      return await this.subtle.exportKey('raw', key);
    } catch (error) {
      throw new Error(
        `AES key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * AES encryption
   */
  public async aesEncrypt(
    data: string | ArrayBuffer,
    key: ArrayBuffer,
    iv?: ArrayBuffer
  ): Promise<ArrayBuffer> {
    try {
      const dataArrayBuffer = this.toArrayBuffer(data);
      const ivBuffer = iv || this.randomValues(new Uint8Array(12)).buffer;

      const cryptoKey = await this.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
        'encrypt',
      ]);

      const encryptedData = await this.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        cryptoKey,
        dataArrayBuffer
      );

      // Prepend IV to encrypted data
      const combined = new Uint8Array(ivBuffer.byteLength + encryptedData.byteLength);
      combined.set(new Uint8Array(ivBuffer), 0);
      combined.set(new Uint8Array(encryptedData), ivBuffer.byteLength);

      return combined.buffer;
    } catch (error) {
      throw new Error(
        `AES encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * AES decryption
   */
  public async aesDecrypt(
    encryptedData: ArrayBuffer,
    key: ArrayBuffer,
    iv: ArrayBuffer
  ): Promise<ArrayBuffer> {
    try {
      const cryptoKey = await this.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
        'decrypt',
      ]);

      const decryptedData = await this.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        encryptedData
      );

      return decryptedData;
    } catch (error) {
      throw new Error(
        `AES decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate RSA key pair
   */
  public async generateRSAKeyPair(modulusLength = 2048): Promise<CryptoKeyPair> {
    try {
      const keyPair = await this.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: modulusLength,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: 'SHA-256' },
        },
        true,
        ['encrypt', 'decrypt']
      );

      return keyPair;
    } catch (error) {
      throw new Error(
        `RSA key pair generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * RSA encryption
   */
  public async rsaEncrypt(data: ArrayBuffer, publicKey: CryptoKey): Promise<ArrayBuffer> {
    try {
      return await this.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);
    } catch (error) {
      throw new Error(
        `RSA encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * RSA decryption
   */
  public async rsaDecrypt(encryptedData: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
    try {
      return await this.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedData);
    } catch (error) {
      throw new Error(
        `RSA decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * RSA signing
   */
  public async rsaSign(data: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
    try {
      return await this.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, privateKey, data);
    } catch (error) {
      throw new Error(
        `RSA signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * RSA verification
   */
  public async rsaVerify(
    data: ArrayBuffer,
    signature: ArrayBuffer,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      return await this.subtle.verify(
        { name: 'RSA-PSS', saltLength: 32 },
        publicKey,
        signature,
        data
      );
    } catch (error) {
      throw new Error(
        `RSA verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate random bytes
   */
  public async generateRandomBytes(length: number): Promise<ArrayBuffer> {
    try {
      const array = new Uint8Array(length);
      return this.randomValues(array).buffer;
    } catch (error) {
      throw new Error(
        `Random bytes generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate random salt
   */
  public async generateSalt(length = 32): Promise<string> {
    const salt = await this.generateRandomBytes(length);
    return this.bufferToHex(salt);
  }

  /**
   * Base64 encoding
   */
  public encodeBase64(data: ArrayBuffer): string {
    try {
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      throw new Error(
        `Base64 encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Base64 decoding
   */
  public decodeBase64(base64: string): ArrayBuffer {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      throw new Error(
        `Base64 decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Format bytes to human readable format
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format hash string
   */
  public formatHash(hash: string, format: 'hex' | 'base64' | 'binary' = 'hex'): string {
    switch (format) {
      case 'base64':
        return this.encodeBase64(this.hexToArrayBuffer(hash));
      case 'binary':
        return String.fromCharCode(...this.hexToBytes(hash));
      default:
        return hash;
    }
  }

  /**
   * Check if Web Crypto API is available
   */
  public isAvailable(): boolean {
    return !!(typeof window !== 'undefined' ? window.crypto?.subtle : global.crypto?.subtle);
  }

  /**
   * Get supported algorithms
   */
  public getSupportedAlgorithms(): string[] {
    return [
      'SHA-1',
      'SHA-256',
      'SHA-384',
      'SHA-512',
      'AES-GCM',
      'AES-CBC',
      'AES-CTR',
      'RSA-OAEP',
      'RSA-PSS',
      'HMAC',
      'PBKDF2',
      'ECDSA',
      'ECDH',
    ];
  }

  /**
   * Convenience methods for common operations
   */
  public async sha256(data: string | ArrayBuffer): Promise<string> {
    return this.hash(data, 'SHA-256');
  }

  public async sha512(data: string | ArrayBuffer): Promise<string> {
    return this.hash(data, 'SHA-512');
  }

  public async sha1(data: string | ArrayBuffer): Promise<string> {
    return this.hash(data, 'SHA-1');
  }

  public async sha384(data: string | ArrayBuffer): Promise<string> {
    return this.hash(data, 'SHA-384');
  }

  public async hmacSha256(data: string | ArrayBuffer, key: string | ArrayBuffer): Promise<string> {
    return this.hmac(data, key, 'SHA-256');
  }

  public async hmacSha512(data: string | ArrayBuffer, key: string | ArrayBuffer): Promise<string> {
    return this.hmac(data, key, 'SHA-512');
  }

  /**
   * Export RSA key to PEM format
   */
  public async exportRSAPublicKeyToPem(publicKey: CryptoKey): Promise<string> {
    try {
      const exported = await this.subtle.exportKey('spki', publicKey);
      const exportedAsString = String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(exported))
      );
      const exportedAsBase64 = btoa(exportedAsString);
      const pemHeader = '-----BEGIN PUBLIC KEY-----';
      const pemFooter = '-----END PUBLIC KEY-----';
      const pemContents = exportedAsBase64.match(/.{1,64}/g)?.join('\n') || exportedAsBase64;
      return `${pemHeader}\n${pemContents}\n${pemFooter}`;
    } catch (error) {
      throw new Error(
        `RSA key export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import RSA key from PEM format
   */
  public async importRSAPublicKeyFromPem(pem: string): Promise<CryptoKey> {
    try {
      const pemHeader = '-----BEGIN PUBLIC KEY-----';
      const pemFooter = '-----END PUBLIC KEY-----';
      const pemContents = pem
        .substring(pemHeader.length, pem.length - pemFooter.length)
        .replace(/\s/g, '');
      const binaryDer = atob(pemContents);
      const der = new Uint8Array(binaryDer.length);
      for (let i = 0; i < binaryDer.length; i++) {
        der[i] = binaryDer.charCodeAt(i);
      }

      return await this.subtle.importKey(
        'spki',
        der.buffer,
        {
          name: 'RSA-OAEP',
          hash: { name: 'SHA-256' },
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      throw new Error(
        `RSA key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Private utility methods
   */
  private toArrayBuffer(data: string | ArrayBuffer): ArrayBuffer {
    if (data instanceof ArrayBuffer) {
      return data;
    }

    const encoder = new TextEncoder();
    return encoder.encode(data).buffer;
  }

  private bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  private hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(Number.parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  /**
   * Create result objects with consistent structure
   */
  public createEncryptionResult(
    success: boolean,
    data?: ArrayBuffer,
    iv?: ArrayBuffer,
    error?: string
  ): EncryptionResult {
    return { success, data, iv, error };
  }

  public createDecryptionResult(
    success: boolean,
    data?: ArrayBuffer,
    error?: string
  ): DecryptionResult {
    return { success, data, error };
  }

  public createKeyPairResult(
    success: boolean,
    publicKey?: CryptoKey,
    privateKey?: CryptoKey,
    error?: string
  ): KeyPairResult {
    return { success, publicKey, privateKey, error };
  }

  public createHashResult(success: boolean, hash?: string, error?: string): HashResult {
    return { success, hash, error };
  }
}

/**
 * Fallback provider for environments without Web Crypto API
 */
export class FallbackCryptoProvider implements CryptoProvider {
  private available: boolean;

  constructor() {
    this.available = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    return false;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public getSupportedAlgorithms(): string[] {
    return [];
  }

  public async hash(_data: string | ArrayBuffer, _algorithm?: string): Promise<string> {
    throw new Error('Crypto provider not available');
  }

  public async hmac(
    _data: string | ArrayBuffer,
    _key: string | ArrayBuffer,
    _algorithm?: string
  ): Promise<string> {
    throw new Error('Crypto provider not available');
  }

  public async pbkdf2(
    _password: string,
    _salt: string,
    _iterations?: number,
    _keyLength?: number
  ): Promise<string> {
    throw new Error('Crypto provider not available');
  }

  public async generateAESKey(_length?: number): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async aesEncrypt(
    _data: string | ArrayBuffer,
    _key: ArrayBuffer,
    _iv?: ArrayBuffer
  ): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async aesDecrypt(
    _encryptedData: ArrayBuffer,
    _key: ArrayBuffer,
    _iv: ArrayBuffer
  ): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async generateRSAKeyPair(_modulusLength?: number): Promise<CryptoKeyPair> {
    throw new Error('Crypto provider not available');
  }

  public async rsaEncrypt(_data: ArrayBuffer, _publicKey: CryptoKey): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async rsaDecrypt(
    _encryptedData: ArrayBuffer,
    _privateKey: CryptoKey
  ): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async rsaSign(_data: ArrayBuffer, _privateKey: CryptoKey): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async rsaVerify(
    _data: ArrayBuffer,
    _signature: ArrayBuffer,
    _publicKey: CryptoKey
  ): Promise<boolean> {
    throw new Error('Crypto provider not available');
  }

  public async generateRandomBytes(_length: number): Promise<ArrayBuffer> {
    throw new Error('Crypto provider not available');
  }

  public async generateSalt(_length?: number): Promise<string> {
    throw new Error('Crypto provider not available');
  }

  public encodeBase64(_data: ArrayBuffer): string {
    throw new Error('Crypto provider not available');
  }

  public decodeBase64(_base64: string): ArrayBuffer {
    throw new Error('Crypto provider not available');
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  public formatHash(hash: string, _format?: 'hex' | 'base64' | 'binary'): string {
    return hash;
  }
}

/**
 * Factory function to get the appropriate crypto provider
 */
export function getCryptoProvider(): CryptoProvider {
  try {
    return WebCryptoProvider.getInstance();
  } catch {
    return new FallbackCryptoProvider();
  }
}

// Default export
export default WebCryptoProvider;
