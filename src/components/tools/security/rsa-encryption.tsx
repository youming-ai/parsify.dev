/**
 * RSA Encryption Tool
 * RSA asymmetric encryption with key generation, digital signatures, and PKCS#1 padding
 */

import React, { useState, useEffect } from "react";
import { Key, Lock, Unlock, Copy, Download, Shield, AlertCircle, FileKey } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
  keySize: number;
}

interface EncryptionResult {
  encrypted: string;
  algorithm: string;
  keyId?: string;
}

interface DecryptionResult {
  decrypted: string;
  success: boolean;
  error?: string;
}

interface SignatureResult {
  signature: string;
  algorithm: string;
  success: boolean;
  error?: string;
}

const RSA_KEY_SIZES = [2048, 3072, 4096] as const;
type RSAKeySize = (typeof RSA_KEY_SIZES)[number];

const RSA_ALGORITHMS = [
  { value: "RSA-OAEP", label: "RSA-OAEP", description: "Optimal Asymmetric Encryption Padding" },
  { value: "RSAES-PKCS1-v1_5", label: "RSA-PKCS1-v1_5", description: "PKCS#1 v1.5 padding" },
] as const;

const SIGNATURE_ALGORITHMS = [
  { value: "RSA-PSS", label: "RSA-PSS", description: "Probabilistic Signature Scheme" },
  { value: "RSASSA-PKCS1-v1_5", label: "RSA-PKCS1-v1_5", description: "PKCS#1 v1.5 signatures" },
] as const;

const HASH_ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512"] as const;
type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export const RSAEncryption: React.FC = () => {
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [keySize, setKeySize] = useState<RSAKeySize>(2048);
  const [encryptionAlgorithm, setEncryptionAlgorithm] = useState(RSA_ALGORITHMS[0].value);
  const [signatureAlgorithm, setSignatureAlgorithm] = useState(SIGNATURE_ALGORITHMS[0].value);
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>("SHA-256");

  const [currentKeyPair, setCurrentKeyPair] = useState<RSAKeyPair | null>(null);
  const [encryptionResult, setEncryptionResult] = useState<EncryptionResult | null>(null);
  const [decryptionResult, setDecryptionResult] = useState<DecryptionResult | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  };

  // Convert Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Convert string to ArrayBuffer
  const stringToArrayBuffer = (str: string): ArrayBuffer => {
    return new TextEncoder().encode(str);
  };

  // Convert ArrayBuffer to string
  const arrayBufferToString = (buffer: ArrayBuffer): string => {
    return new TextDecoder().decode(buffer);
  };

  // Generate RSA key pair
  const generateKeyPair = async (): Promise<RSAKeyPair> => {
    setIsProcessing(true);
    setError(null);

    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: hashAlgorithm },
        },
        true,
        ["encrypt", "decrypt"],
      );

      // Export keys
      const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
      const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

      const newKeyPair: RSAKeyPair = {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
        algorithm: "RSA-OAEP",
        keySize,
      };

      setCurrentKeyPair(newKeyPair);
      setPublicKey(publicKeyBase64);
      setPrivateKey(privateKeyBase64);

      return newKeyPair;
    } catch (err) {
      setError(`Key generation failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Import public key
  const importPublicKey = async (keyData: string): Promise<CryptoKey> => {
    try {
      const keyBuffer = base64ToArrayBuffer(keyData);
      return await crypto.subtle.importKey(
        "spki",
        keyBuffer,
        {
          name: encryptionAlgorithm,
          hash: { name: hashAlgorithm },
        },
        false,
        ["encrypt"],
      );
    } catch (err) {
      throw new Error(
        `Failed to import public key: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // Import private key
  const importPrivateKey = async (keyData: string): Promise<CryptoKey> => {
    try {
      const keyBuffer = base64ToArrayBuffer(keyData);
      return await crypto.subtle.importKey(
        "pkcs8",
        keyBuffer,
        {
          name: encryptionAlgorithm,
          hash: { name: hashAlgorithm },
        },
        false,
        ["decrypt"],
      );
    } catch (err) {
      throw new Error(
        `Failed to import private key: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // Import private key for signing
  const importSigningKey = async (keyData: string): Promise<CryptoKey> => {
    try {
      const keyBuffer = base64ToArrayBuffer(keyData);
      return await crypto.subtle.importKey(
        "pkcs8",
        keyBuffer,
        {
          name: signatureAlgorithm,
          hash: { name: hashAlgorithm },
        },
        false,
        ["sign"],
      );
    } catch (err) {
      throw new Error(
        `Failed to import signing key: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // Import public key for verification
  const importVerificationKey = async (keyData: string): Promise<CryptoKey> => {
    try {
      const keyBuffer = base64ToArrayBuffer(keyData);
      return await crypto.subtle.importKey(
        "spki",
        keyBuffer,
        {
          name: signatureAlgorithm,
          hash: { name: hashAlgorithm },
        },
        false,
        ["verify"],
      );
    } catch (err) {
      throw new Error(
        `Failed to import verification key: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // Encrypt data
  const encrypt = async () => {
    if (!plaintext.trim()) {
      setError("Please enter plaintext to encrypt");
      return;
    }

    if (!publicKey.trim()) {
      setError("Please enter a public key");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cryptoPublicKey = await importPublicKey(publicKey);
      const data = stringToArrayBuffer(plaintext);

      let encrypted: ArrayBuffer;

      if (encryptionAlgorithm === "RSA-OAEP") {
        encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cryptoPublicKey, data);
      } else {
        encrypted = await crypto.subtle.encrypt(
          { name: "RSAES-PKCS1-v1_5" },
          cryptoPublicKey,
          data,
        );
      }

      const encryptedBase64 = arrayBufferToBase64(encrypted);

      setEncryptionResult({
        encrypted: encryptedBase64,
        algorithm: encryptionAlgorithm,
      });

      setCiphertext(encryptedBase64);
    } catch (err) {
      setError(`Encryption failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Decrypt data
  const decrypt = async () => {
    if (!ciphertext.trim()) {
      setError("Please enter ciphertext to decrypt");
      return;
    }

    if (!privateKey.trim()) {
      setError("Please enter a private key");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cryptoPrivateKey = await importPrivateKey(privateKey);
      const encryptedData = base64ToArrayBuffer(ciphertext);

      let decrypted: ArrayBuffer;

      if (encryptionAlgorithm === "RSA-OAEP") {
        decrypted = await crypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          cryptoPrivateKey,
          encryptedData,
        );
      } else {
        decrypted = await crypto.subtle.decrypt(
          { name: "RSAES-PKCS1-v1_5" },
          cryptoPrivateKey,
          encryptedData,
        );
      }

      const plaintext = arrayBufferToString(decrypted);

      setDecryptionResult({
        decrypted: plaintext,
        success: true,
      });

      setPlaintext(plaintext);
    } catch (err) {
      setError(`Decryption failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setDecryptionResult({
        decrypted: "",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sign data
  const sign = async () => {
    if (!plaintext.trim()) {
      setError("Please enter data to sign");
      return;
    }

    if (!privateKey.trim()) {
      setError("Please enter a private key for signing");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const signingKey = await importSigningKey(privateKey);
      const data = stringToArrayBuffer(plaintext);

      let signature: ArrayBuffer;

      if (signatureAlgorithm === "RSA-PSS") {
        signature = await crypto.subtle.sign(
          {
            name: "RSA-PSS",
            saltLength: 32,
          },
          signingKey,
          data,
        );
      } else {
        signature = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, signingKey, data);
      }

      const signatureBase64 = arrayBufferToBase64(signature);

      setSignatureResult({
        signature: signatureBase64,
        algorithm: signatureAlgorithm,
        success: true,
      });
    } catch (err) {
      setError(`Signing failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setSignatureResult({
        signature: "",
        algorithm: signatureAlgorithm,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify signature
  const verify = async () => {
    if (!plaintext.trim() || !signatureResult?.signature || !publicKey.trim()) {
      setError("Please provide data, signature, and public key for verification");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const verificationKey = await importVerificationKey(publicKey);
      const data = stringToArrayBuffer(plaintext);
      const signatureData = base64ToArrayBuffer(signatureResult.signature);

      let isValid: boolean;

      if (signatureAlgorithm === "RSA-PSS") {
        isValid = await crypto.subtle.verify(
          {
            name: "RSA-PSS",
            saltLength: 32,
          },
          verificationKey,
          signatureData,
          data,
        );
      } else {
        isValid = await crypto.subtle.verify(
          { name: "RSASSA-PKCS1-v1_5" },
          verificationKey,
          signatureData,
          data,
        );
      }

      setVerificationResult({
        valid: isValid,
      });
    } catch (err) {
      setError(`Verification failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setVerificationResult({
        valid: false,
        error: err instanceof Error ? err.message : "Unknown error",
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
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Download keys
  const downloadKey = (keyData: string, filename: string) => {
    const blob = new Blob([keyData], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format key for display
  const formatKeyForDisplay = (key: string): string => {
    // Add PEM headers if not present
    if (key.includes("-----BEGIN") || key.includes("-----END")) {
      return key;
    }

    // Try to detect key type and add appropriate headers
    const isPrivate = key.length > 1000; // Rough heuristic

    if (isPrivate) {
      return `-----BEGIN PRIVATE KEY-----
${key.match(/.{1,64}/g)?.join("\n") || key}
-----END PRIVATE KEY-----`;
    } else {
      return `-----BEGIN PUBLIC KEY-----
${key.match(/.{1,64}/g)?.join("\n") || key}
-----END PUBLIC KEY-----`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileKey className="w-5 h-5" />
            RSA Key Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="keySize">Key Size</Label>
              <Select
                value={keySize.toString()}
                onValueChange={(value) => setKeySize(Number(value) as RSAKeySize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RSA_KEY_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} bits
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hashAlgorithm">Hash Algorithm</Label>
              <Select
                value={hashAlgorithm}
                onValueChange={(value) => setHashAlgorithm(value as HashAlgorithm)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HASH_ALGORITHMS.map((algo) => (
                    <SelectItem key={algo} value={algo}>
                      {algo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Key Operations</Label>
              <Button onClick={generateKeyPair} disabled={isProcessing} className="w-full">
                <Key className="w-4 h-4 mr-2" />
                Generate Key Pair
              </Button>
            </div>
          </div>

          {currentKeyPair && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Key Generated:</strong> {currentKeyPair.keySize}-bit{" "}
                {currentKeyPair.algorithm} key pair
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="encrypt" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encrypt">Encrypt/Decrypt</TabsTrigger>
          <TabsTrigger value="sign">Sign/Verify</TabsTrigger>
          <TabsTrigger value="keys">Key Management</TabsTrigger>
        </TabsList>

        {/* Encrypt/Decrypt Tab */}
        <TabsContent value="encrypt">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
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
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="encrypt-algorithm">Encryption Algorithm</Label>
                  <Select value={encryptionAlgorithm} onValueChange={setEncryptionAlgorithm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RSA_ALGORITHMS.map((algo) => (
                        <SelectItem key={algo.value} value={algo.value}>
                          {algo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={encrypt}
                  disabled={isProcessing || !plaintext.trim() || !publicKey.trim()}
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isProcessing ? "Encrypting..." : "Encrypt"}
                </Button>

                {encryptionResult && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="encrypted">Encrypted (Base64)</Label>
                      <Textarea
                        id="encrypted"
                        value={encryptionResult.encrypted}
                        readOnly
                        className="min-h-[100px] font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(encryptionResult.encrypted)}
                        className="mt-2"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Encrypted
                      </Button>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Algorithm:</strong> {encryptionResult.algorithm}
                        <br />
                        <strong>Original Size:</strong> {plaintext.length} characters
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Unlock className="w-5 h-5" />
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
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={decrypt}
                  disabled={isProcessing || !ciphertext.trim() || !privateKey.trim()}
                  className="w-full"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  {isProcessing ? "Decrypting..." : "Decrypt"}
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
                            className="min-h-[120px] font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(decryptionResult.decrypted)}
                            className="mt-2"
                          >
                            <Copy className="w-4 h-4 mr-1" />
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
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Decryption failed: {decryptionResult.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sign/Verify Tab */}
        <TabsContent value="sign">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="signature-algorithm">Signature Algorithm</Label>
                  <Select value={signatureAlgorithm} onValueChange={setSignatureAlgorithm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNATURE_ALGORITHMS.map((algo) => (
                        <SelectItem key={algo.value} value={algo.value}>
                          {algo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sign-data">Data to Sign</Label>
                  <Textarea
                    id="sign-data"
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    placeholder="Enter data to sign..."
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={sign}
                  disabled={isProcessing || !plaintext.trim() || !privateKey.trim()}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {isProcessing ? "Signing..." : "Sign Data"}
                </Button>

                {signatureResult && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signature">Signature (Base64)</Label>
                      <Textarea
                        id="signature"
                        value={signatureResult.signature}
                        readOnly
                        className="min-h-[100px] font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(signatureResult.signature)}
                        className="mt-2"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Signature
                      </Button>
                    </div>

                    <div>
                      <Label>Verification</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={verify}
                          disabled={isProcessing || !signatureResult.success || !publicKey.trim()}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Verify Signature
                        </Button>
                        {verificationResult && (
                          <Badge variant={verificationResult.valid ? "default" : "destructive"}>
                            {verificationResult.valid ? "Valid" : "Invalid"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {verificationResult && verificationResult.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Verification failed: {verificationResult.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {verificationResult && verificationResult.valid && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          Signature verification successful! The data is authentic and unmodified.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Key Management Tab */}
        <TabsContent value="keys">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileKey className="w-5 h-5" />
                  Key Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="public-key">Public Key (PEM)</Label>
                  <Textarea
                    id="public-key"
                    value={formatKeyForDisplay(publicKey)}
                    onChange={(e) =>
                      setPublicKey(
                        e.target.value
                          .replace(/-----BEGIN[^-]+-----|-----END[^-]+-----/g, "")
                          .replace(/\s/g, ""),
                      )
                    }
                    placeholder="Paste or generate a public key..."
                    className="min-h-[150px] font-mono text-xs"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formatKeyForDisplay(publicKey))}
                      disabled={!publicKey.trim()}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Public
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadKey(formatKeyForDisplay(publicKey), "public.pem")}
                      disabled={!publicKey.trim()}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Public
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="private-key">Private Key (PEM)</Label>
                  <Textarea
                    id="private-key"
                    value={formatKeyForDisplay(privateKey)}
                    onChange={(e) =>
                      setPrivateKey(
                        e.target.value
                          .replace(/-----BEGIN[^-]+-----|-----END[^-]+-----/g, "")
                          .replace(/\s/g, ""),
                      )
                    }
                    placeholder="Paste or generate a private key..."
                    className="min-h-[150px] font-mono text-xs"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formatKeyForDisplay(privateKey))}
                      disabled={!privateKey.trim()}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Private
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadKey(formatKeyForDisplay(privateKey), "private.pem")}
                      disabled={!privateKey.trim()}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Private
                    </Button>
                  </div>
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Notice:</strong> Keep your private keys secure and never
                      share them publicly.
                    </AlertDescription>
                  </Alert>
                </div>

                {currentKeyPair && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Current Key Pair:</strong>
                      <br />
                      Algorithm: {currentKeyPair.algorithm}
                      <br />
                      Key Size: {currentKeyPair.keySize} bits
                      <br />
                      Public Key Length: {currentKeyPair.publicKey.length} characters
                      <br />
                      Private Key Length: {currentKeyPair.privateKey.length} characters
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
