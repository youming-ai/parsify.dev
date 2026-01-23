/**
 * AES Encryption Tool
 * Advanced Encryption Standard (AES) encryption and decryption using Web Crypto API
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Key, Lock, LockOpen, Shield, WarningCircle } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  key: string;
  algorithm: string;
}

interface DecryptionResult {
  decrypted: string;
  success: boolean;
  error?: string;
}

const AES_KEY_SIZES = [128, 192, 256] as const;
type AESKeySize = (typeof AES_KEY_SIZES)[number];

const AES_MODES = [
  { value: 'AES-GCM', label: 'GCM (Galois/Counter Mode)', description: 'Authenticated encryption' },
  {
    value: 'AES-CBC',
    label: 'CBC (Cipher Block Chaining)',
    description: 'Traditional block cipher',
  },
  { value: 'AES-CTR', label: 'CTR (Counter Mode)', description: 'Stream cipher' },
] as const;

type AESMode = (typeof AES_MODES)[number]['value'];

export const AESEncryption: React.FC = () => {
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [iv, setIv] = useState('');
  const [key, setKey] = useState('');
  const [keySize, setKeySize] = useState<AESKeySize>(256);
  const [mode, setMode] = useState<AESMode>(AES_MODES[0].value);
  const [encryptionResult, setEncryptionResult] = useState<EncryptionResult | null>(null);
  const [decryptionResult, setDecryptionResult] = useState<DecryptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoKey, setAutoKey] = useState(true);

  // Generate random key and IV
  const generateRandomData = (length: number): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  // Generate random IV for GCM and CBC modes
  const generateIV = (): Uint8Array => {
    const ivLength = mode === 'AES-GCM' ? 12 : 16; // GCM uses 96-bit IV, CBC uses 128-bit
    const iv = new Uint8Array(ivLength);
    crypto.getRandomValues(iv);
    return iv;
  };

  // Convert hex string to Uint8Array
  const hexToArray = (hex: string): Uint8Array => {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) return new Uint8Array();

    const bytes = new Uint8Array(matches.length);
    matches.forEach((byte, index) => {
      bytes[index] = Number.parseInt(byte, 16);
    });

    return bytes;
  };

  // Convert Uint8Array to hex string
  const arrayToHex = (array: Uint8Array): string => {
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  // Convert base64 to hex
  const base64ToHex = (base64: string): string => {
    try {
      const binary = atob(base64);
      return Array.from(binary, (char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join(
        ''
      );
    } catch (_err) {
      throw new Error('Invalid base64 input');
    }
  };

  // Convert hex to base64
  const hexToBase64 = (hex: string): string => {
    try {
      const array = hexToArray(hex);
      return btoa(String.fromCharCode(...array));
    } catch (_err) {
      throw new Error('Invalid hex input');
    }
  };

  const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  };

  // Generate encryption key
  const generateKey = async (): Promise<CryptoKey> => {
    const keyData = hexToArray(key);
    const keyBuffer = toArrayBuffer(keyData);

    return await crypto.subtle.importKey('raw', keyBuffer, { name: mode }, false, [
      'encrypt',
      'decrypt',
    ]);
  };

  // Generate new key
  const generateNewKey = () => {
    const keyLength = keySize / 8;
    const newKey = generateRandomData(keyLength);
    setKey(newKey);
  };

  // Generate new IV
  const generateNewIV = () => {
    const ivArray = generateIV();
    setIv(arrayToHex(ivArray));
  };

  // Initialize with random key
  useEffect(() => {
    if (autoKey && !key) {
      generateNewKey();
    }
  }, [autoKey, keySize]);

  // Encrypt data
  const encrypt = async () => {
    if (!plaintext.trim()) {
      setError('Please enter plaintext to encrypt');
      return;
    }

    if (!key) {
      setError('Please enter or generate an encryption key');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cryptoKey = await generateKey();
      const ivArray = generateIV();
      const ivHex = arrayToHex(ivArray);

      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const ivBuffer = toArrayBuffer(ivArray);
      const dataBuffer = toArrayBuffer(data);

      let encrypted: ArrayBuffer;

      if (mode === 'AES-GCM') {
        encrypted = await crypto.subtle.encrypt(
          { name: mode, iv: ivBuffer },
          cryptoKey,
          dataBuffer
        );
      } else {
        encrypted = await crypto.subtle.encrypt(
          { name: mode, iv: ivBuffer },
          cryptoKey,
          dataBuffer
        );
      }

      const encryptedHex = arrayToHex(new Uint8Array(encrypted));
      const encryptedBase64 = hexToBase64(encryptedHex);

      setEncryptionResult({
        encrypted: encryptedBase64,
        iv: ivHex,
        key: key,
        algorithm: mode,
      });

      setCiphertext(encryptedBase64);
      setIv(ivHex);
    } catch (err) {
      setError(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Decrypt data
  const decrypt = async () => {
    if (!ciphertext.trim()) {
      setError('Please enter ciphertext to decrypt');
      return;
    }

    if (!key) {
      setError('Please enter the decryption key');
      return;
    }

    if (!iv.trim()) {
      setError('Please enter the initialization vector (IV)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cryptoKey = await generateKey();
      const ivArray = hexToArray(iv);
      const encryptedArray = hexToArray(base64ToHex(ciphertext));
      const ivBuffer = toArrayBuffer(ivArray);
      const encryptedBuffer = toArrayBuffer(encryptedArray);

      let decrypted: ArrayBuffer;

      if (mode === 'AES-GCM') {
        decrypted = await crypto.subtle.decrypt(
          { name: mode, iv: ivBuffer },
          cryptoKey,
          encryptedBuffer
        );
      } else {
        decrypted = await crypto.subtle.decrypt(
          { name: mode, iv: ivBuffer },
          cryptoKey,
          encryptedBuffer
        );
      }

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decrypted);

      setDecryptionResult({
        decrypted: plaintext,
        success: true,
      });

      setPlaintext(plaintext);
    } catch (err) {
      setError(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDecryptionResult({
        decrypted: '',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getModeDescription = () => {
    const modeInfo = AES_MODES.find((m) => m.value === mode);
    return modeInfo?.description || '';
  };

  return (
    <div className="space-y-6">
      {/* Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Encryption Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="keySize">Key Size</Label>
              <Select
                value={keySize.toString()}
                onValueChange={(value) => setKeySize(Number(value) as AESKeySize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AES_KEY_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} bits
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mode">Encryption Mode</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as AESMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AES_MODES.map((modeInfo) => (
                    <SelectItem key={modeInfo.value} value={modeInfo.value}>
                      {modeInfo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-muted-foreground text-xs">{getModeDescription()}</p>
            </div>

            <div>
              <Label htmlFor="key">Encryption Key (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setAutoKey(false);
                  }}
                  placeholder={`Enter ${keySize}-bit key in hex`}
                  className="font-mono text-xs"
                  disabled={autoKey}
                />
                <Button variant="outline" size="sm" onClick={generateNewKey} disabled={autoKey}>
                  Generate
                </Button>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {key.length} characters ({key.length * 4} bits)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoKey"
              checked={autoKey}
              onChange={(e) => setAutoKey(e.target.checked)}
            />
            <Label htmlFor="autoKey">Auto-generate key on size change</Label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="encrypt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
          <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
        </TabsList>

        {/* Encryption Tab */}
        <TabsContent value="encrypt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Encrypt Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plaintext">Plaintext</Label>
                <Textarea
                  id="plaintext"
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  placeholder="Enter text to encrypt..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button
                onClick={encrypt}
                disabled={isProcessing || !plaintext.trim() || !key}
                className="w-full"
              >
                <Lock className="mr-2 h-4 w-4" />
                {isProcessing ? 'Encrypting...' : 'Encrypt'}
              </Button>

              {encryptionResult && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="encrypted">Encrypted (Base64)</Label>
                    <Textarea
                      id="encrypted"
                      value={encryptionResult.encrypted}
                      readOnly
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(encryptionResult.encrypted)}
                      className="mt-2"
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copy Encrypted
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="iv">Initialization Vector (IV)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="iv"
                        value={encryptionResult.iv}
                        onChange={(e) => setIv(e.target.value)}
                        placeholder="IV in hex format"
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="sm" onClick={generateNewIV}>
                        New IV
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(encryptionResult.iv)}
                      className="mt-2"
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copy IV
                    </Button>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Algorithm:</strong> {encryptionResult.algorithm}
                      <br />
                      <strong>Key Size:</strong> {keySize} bits
                      <br />
                      <strong>IV Length:</strong> {encryptionResult.iv.length * 4} bits
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decryption Tab */}
        <TabsContent value="decrypt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockOpen className="h-5 w-5" />
                Decrypt Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ciphertext">Ciphertext (Base64)</Label>
                <Textarea
                  id="ciphertext"
                  value={ciphertext}
                  onChange={(e) => setCiphertext(e.target.value)}
                  placeholder="Enter Base64 encrypted text..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="decrypt-iv">Initialization Vector (IV)</Label>
                <Input
                  id="decrypt-iv"
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  placeholder="Enter IV in hex format"
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={decrypt}
                disabled={isProcessing || !ciphertext.trim() || !key || !iv.trim()}
                className="w-full"
              >
                <LockOpen className="mr-2 h-4 w-4" />
                {isProcessing ? 'Decrypting...' : 'Decrypt'}
              </Button>

              {decryptionResult && (
                <div className="space-y-4">
                  {decryptionResult.success ? (
                    <>
                      <div>
                        <Label htmlFor="decrypted">Decrypted Text</Label>
                        <Textarea
                          id="decrypted"
                          value={decryptionResult.decrypted}
                          readOnly
                          className="min-h-[200px] font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(decryptionResult.decrypted)}
                          className="mt-2"
                        >
                          <Copy className="mr-1 h-4 w-4" />
                          Copy Decrypted
                        </Button>
                      </div>

                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          Decryption successful! Text has been recovered from the encrypted data.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <WarningCircle className="h-4 w-4" />
                      <AlertDescription>
                        Decryption failed: {decryptionResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
