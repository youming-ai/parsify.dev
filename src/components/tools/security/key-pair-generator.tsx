'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  ArrowsClockwise,
  CheckCircle,
  Copy,
  Download,
  Key,
  Lock,
  LockOpen,
  Shield,
  Warning,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';

interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
}

type AlgorithmType = 'RSA-OAEP' | 'RSASSA-PKCS1-v1_5' | 'ECDSA' | 'Ed25519';
type KeySizeType = 2048 | 3072 | 4096;
type ECCurve = 'P-256' | 'P-384' | 'P-521';

const KeyPairGenerator = () => {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('RSA-OAEP');
  const [keySize, setKeySize] = useState<KeySizeType>(2048);
  const [ecCurve, setEcCurve] = useState<ECCurve>('P-256');
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateKeyPair = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      let cryptoKeyPair: CryptoKeyPair;
      let algName: string;

      if (algorithm === 'RSA-OAEP') {
        cryptoKeyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: keySize,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['encrypt', 'decrypt']
        );
        algName = `RSA-OAEP-${keySize}`;
      } else if (algorithm === 'RSASSA-PKCS1-v1_5') {
        cryptoKeyPair = await crypto.subtle.generateKey(
          {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: keySize,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['sign', 'verify']
        );
        algName = `RSA-PSS-${keySize}`;
      } else if (algorithm === 'ECDSA') {
        cryptoKeyPair = await crypto.subtle.generateKey(
          {
            name: 'ECDSA',
            namedCurve: ecCurve,
          },
          true,
          ['sign', 'verify']
        );
        algName = `ECDSA-${ecCurve}`;
      } else {
        // Ed25519 - Note: Not all browsers support this
        try {
          cryptoKeyPair = await crypto.subtle.generateKey(
            {
              name: 'Ed25519',
            } as EcKeyGenParams,
            true,
            ['sign', 'verify']
          );
          algName = 'Ed25519';
        } catch {
          throw new Error('Ed25519 is not supported in this browser. Try RSA or ECDSA.');
        }
      }

      // Export keys to PEM format
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', cryptoKeyPair.publicKey);
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', cryptoKeyPair.privateKey);

      const publicKeyPem = arrayBufferToPem(publicKeyBuffer, 'PUBLIC KEY');
      const privateKeyPem = arrayBufferToPem(privateKeyBuffer, 'PRIVATE KEY');

      setKeyPair({
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
        algorithm: algName,
        keySize: algorithm.startsWith('RSA') ? keySize : 0,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key pair');
    } finally {
      setIsGenerating(false);
    }
  }, [algorithm, keySize, ecCurve]);

  const arrayBufferToPem = (buffer: ArrayBuffer, type: string): string => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
  };

  const copyToClipboard = async (text: string, type: 'public' | 'private') => {
    await navigator.clipboard.writeText(text);
    if (type === 'public') {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
  };

  const downloadKey = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Key Pair Generator
          </CardTitle>
          <CardDescription>
            Generate RSA, ECDSA, or Ed25519 key pairs for encryption, authentication, and digital
            signatures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Algorithm</Label>
              <Select
                value={algorithm}
                onValueChange={(value) => setAlgorithm(value as AlgorithmType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RSA-OAEP">RSA-OAEP (Encryption)</SelectItem>
                  <SelectItem value="RSASSA-PKCS1-v1_5">RSA-PSS (Signing)</SelectItem>
                  <SelectItem value="ECDSA">ECDSA (Signing)</SelectItem>
                  <SelectItem value="Ed25519">Ed25519 (Signing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {algorithm.startsWith('RSA') && (
              <div className="space-y-2">
                <Label>Key Size</Label>
                <Select
                  value={keySize.toString()}
                  onValueChange={(value) => setKeySize(Number(value) as KeySizeType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select key size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2048">2048 bits</SelectItem>
                    <SelectItem value="3072">3072 bits</SelectItem>
                    <SelectItem value="4096">4096 bits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {algorithm === 'ECDSA' && (
              <div className="space-y-2">
                <Label>Curve</Label>
                <Select value={ecCurve} onValueChange={(value) => setEcCurve(value as ECCurve)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select curve" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P-256">P-256 (secp256r1)</SelectItem>
                    <SelectItem value="P-384">P-384 (secp384r1)</SelectItem>
                    <SelectItem value="P-521">P-521 (secp521r1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={generateKeyPair} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Key Pair'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Key Display */}
          {keyPair && (
            <Tabs defaultValue="public" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="public" className="flex items-center gap-2">
                  <LockOpen className="h-4 w-4" />
                  Public Key
                </TabsTrigger>
                <TabsTrigger value="private" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private Key
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{keyPair.algorithm}</Badge>
                    <span className="text-muted-foreground text-sm">Safe to share publicly</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(keyPair.publicKey, 'public')}
                    >
                      {copiedPublic ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadKey(keyPair.publicKey, 'public_key.pem')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea readOnly value={keyPair.publicKey} className="h-64 font-mono text-xs" />
              </TabsContent>

              <TabsContent value="private" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="border-0">
                      <Shield className="mr-1 h-3 w-3" />
                      Private
                    </Badge>
                    <span className="text-destructive text-sm">Keep this secret!</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(keyPair.privateKey, 'private')}
                    >
                      {copiedPrivate ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadKey(keyPair.privateKey, 'private_key.pem')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea readOnly value={keyPair.privateKey} className="h-64 font-mono text-xs" />
              </TabsContent>
            </Tabs>
          )}

          {/* Info Section */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Security Information</p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>Keys are generated entirely in your browser using Web Crypto API</li>
                  <li>No data is sent to any server - keys never leave your device</li>
                  <li>Private keys should be stored securely and never shared</li>
                  <li>RSA-4096 or ECDSA P-384+ recommended for high-security applications</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyPairGenerator;
