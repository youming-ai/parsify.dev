'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Check, ClipboardCopy, Key, RefreshCw, Shield } from 'lucide-react';
import { useCallback, useState } from 'react';

type KeySize = '1024' | '2048' | '4096';

interface KeyPair {
  publicKey: string;
  privateKey: string;
  keySize: number;
  generatedAt: Date;
}

export default function KeyPairGeneratorPage() {
  const [keySize, setKeySize] = useState<KeySize>('2048');
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const generateKeyPair = useCallback(async () => {
    setIsGenerating(true);

    try {
      // Use Web Crypto API to generate RSA key pair
      const keyPairResult = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: Number.parseInt(keySize),
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Export public key
      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPairResult.publicKey);
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
      const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;

      // Export private key
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        'pkcs8',
        keyPairResult.privateKey
      );
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
      const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

      setKeyPair({
        publicKey: publicKeyPEM,
        privateKey: privateKeyPEM,
        keySize: Number.parseInt(keySize),
        generatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [keySize]);

  const getSecurityInfo = (size: number) => {
    switch (size) {
      case 1024:
        return {
          level: 'Low',
          color: 'text-orange-600 dark:text-orange-400',
          badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
          description: 'Not recommended for production use. Suitable for testing only.',
        };
      case 2048:
        return {
          level: 'Standard',
          color: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          description: 'Recommended for most applications. Provides good security.',
        };
      case 4096:
        return {
          level: 'High',
          color: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          description: 'Maximum security. Recommended for sensitive applications.',
        };
      default:
        return {
          level: 'Unknown',
          color: 'text-slate-600',
          badge: 'bg-slate-100 text-slate-700',
          description: '',
        };
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Key Pair Generator</CardTitle>
                <CardDescription>
                  Generate secure RSA key pairs for encryption and digital signatures
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">RSA</Badge>
              <Badge variant="outline">Offline</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label>Key Size (bits)</Label>
              <Select value={keySize} onValueChange={(v) => setKeySize(v as KeySize)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024 bits</SelectItem>
                  <SelectItem value="2048">2048 bits</SelectItem>
                  <SelectItem value="4096">4096 bits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${getSecurityInfo(Number.parseInt(keySize)).color}`}
              >
                Security: {getSecurityInfo(Number.parseInt(keySize)).level}
              </span>
            </div>

            <div className="flex-1" />

            <Button onClick={generateKeyPair} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Generate Key Pair
                </>
              )}
            </Button>
          </div>

          {/* Security Info */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <Shield className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {getSecurityInfo(Number.parseInt(keySize)).description}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                All key generation happens locally in your browser. Keys are never sent to any
                server.
              </p>
            </div>
          </div>

          {/* Key Display */}
          {keyPair && (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Public Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    Public Key
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(keyPair.publicKey, 'public')}
                  >
                    {copiedField === 'public' ? (
                      <Check className="mr-1 h-4 w-4" />
                    ) : (
                      <ClipboardCopy className="mr-1 h-4 w-4" />
                    )}
                    {copiedField === 'public' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <Textarea
                  value={keyPair.publicKey}
                  readOnly
                  className="min-h-[250px] font-mono text-xs resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Share this key publicly. Used for encryption and signature verification.
                </p>
              </div>

              {/* Private Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    Private Key
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(keyPair.privateKey, 'private')}
                  >
                    {copiedField === 'private' ? (
                      <Check className="mr-1 h-4 w-4" />
                    ) : (
                      <ClipboardCopy className="mr-1 h-4 w-4" />
                    )}
                    {copiedField === 'private' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <Textarea
                  value={keyPair.privateKey}
                  readOnly
                  className="min-h-[250px] font-mono text-xs resize-none"
                />
                <p className="text-xs text-red-500 dark:text-red-400">
                  ⚠️ Keep this key secret! Used for decryption and signing.
                </p>
              </div>
            </div>
          )}

          {/* Key Statistics */}
          {keyPair && (
            <div className="rounded-lg border bg-muted/10 p-4">
              <h3 className="mb-3 text-sm font-medium">Key Statistics</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Algorithm</p>
                  <p className="font-medium">RSA-OAEP</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Key Size</p>
                  <p className="font-medium">{keyPair.keySize} bits</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hash Algorithm</p>
                  <p className="font-medium">SHA-256</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Generated At</p>
                  <p className="font-medium">{keyPair.generatedAt.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Usage Tips */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">Usage Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span>Never share your private key with anyone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span>Store private keys securely with encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span>Use 2048-bit keys minimum for production applications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span>Consider 4096-bit keys for highly sensitive data</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
