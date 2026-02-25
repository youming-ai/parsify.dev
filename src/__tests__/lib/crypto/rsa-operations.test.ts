import {
  exportRSAPublicKey,
  generateRSAKeyPair,
  generateRSASigningKeyPair,
  importRSAPublicKey,
  rsaDecrypt,
  rsaEncrypt,
  rsaSign,
  rsaVerify,
} from '@/lib/crypto/rsa-operations';
import { describe, expect, it } from 'vitest';

describe('generateRSAKeyPair', () => {
  it('returns public and private keys', async () => {
    const result = await generateRSAKeyPair();

    expect(result.success).toBe(true);
    expect(result.keyPair).toBeDefined();
    expect(result.keyPair?.publicKey).toBeDefined();
    expect(result.keyPair?.privateKey).toBeDefined();
  });
});

describe('rsaEncrypt and rsaDecrypt', () => {
  it('encrypts and decrypts data round-trip', async () => {
    const keyResult = await generateRSAKeyPair();
    expect(keyResult.success).toBe(true);

    const encryptResult = await rsaEncrypt({
      publicKey: keyResult.keyPair!.publicKey,
      data: 'RSA secret message',
    });

    expect(encryptResult.success).toBe(true);
    expect(encryptResult.data).toBeInstanceOf(ArrayBuffer);

    const decryptResult = await rsaDecrypt({
      privateKey: keyResult.keyPair!.privateKey,
      encryptedData: encryptResult.data!,
    });

    expect(decryptResult.success).toBe(true);
    const decoded = new TextDecoder().decode(decryptResult.data!);
    expect(decoded).toBe('RSA secret message');
  });
});

describe('rsaSign and rsaVerify', () => {
  it('signs and verifies data round-trip', async () => {
    const keyResult = await generateRSASigningKeyPair();
    expect(keyResult.success).toBe(true);

    const signResult = await rsaSign({
      privateKey: keyResult.keyPair!.privateKey,
      data: 'verify me',
    });

    expect(signResult.success).toBe(true);
    expect(signResult.signature).toBeInstanceOf(ArrayBuffer);

    const verifyResult = await rsaVerify({
      publicKey: keyResult.keyPair!.publicKey,
      signature: signResult.signature!,
      data: 'verify me',
    });

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.data).toBeInstanceOf(ArrayBuffer);
    expect(verifyResult.data?.byteLength).toBe(1);
  });

  it('returns invalid when signature does not match', async () => {
    const keyResult = await generateRSASigningKeyPair();
    expect(keyResult.success).toBe(true);

    const signResult = await rsaSign({
      privateKey: keyResult.keyPair!.privateKey,
      data: 'original text',
    });

    expect(signResult.success).toBe(true);

    const verifyResult = await rsaVerify({
      publicKey: keyResult.keyPair!.publicKey,
      signature: signResult.signature!,
      data: 'tampered text',
    });

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.data).toBeInstanceOf(ArrayBuffer);
    expect(verifyResult.data?.byteLength).toBe(0);
  });
});

describe('exportRSAPublicKey and importRSAPublicKey', () => {
  it('exports and imports public key round-trip', async () => {
    const keyResult = await generateRSAKeyPair();
    expect(keyResult.success).toBe(true);

    const pem = await exportRSAPublicKey(keyResult.keyPair!.publicKey);
    expect(pem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(pem).toContain('-----END PUBLIC KEY-----');

    const importedPublicKey = await importRSAPublicKey(pem);

    const encryptResult = await rsaEncrypt({
      publicKey: importedPublicKey,
      data: 'public key import works',
    });

    expect(encryptResult.success).toBe(true);

    const decryptResult = await rsaDecrypt({
      privateKey: keyResult.keyPair!.privateKey,
      encryptedData: encryptResult.data!,
    });

    expect(decryptResult.success).toBe(true);
    const decoded = new TextDecoder().decode(decryptResult.data!);
    expect(decoded).toBe('public key import works');
  });
});
