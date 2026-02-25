'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  EyeSlash,
  Lock,
  Shield,
  ShieldCheck,
  User,
  XCircle,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface JWTPayload {
  [key: string]: unknown;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

interface JWTHeader {
  alg: string;
  typ: string;
  [key: string]: unknown;
}

interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  valid: boolean;
  error?: string;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getHashAlgorithm(algorithm: string): 'SHA-256' | 'SHA-384' | 'SHA-512' {
  const hashMap: Record<string, 'SHA-256' | 'SHA-384' | 'SHA-512'> = {
    HS256: 'SHA-256',
    HS384: 'SHA-384',
    HS512: 'SHA-512',
    RS256: 'SHA-256',
    RS384: 'SHA-384',
    RS512: 'SHA-512',
  };

  const hashAlgorithm = hashMap[algorithm];
  if (!hashAlgorithm) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  return hashAlgorithm;
}

async function verifyHMAC(token: string, secret: string, algorithm: string): Promise<boolean> {
  const parts = token.split('.');
  const headerPart = parts[0] ?? '';
  const payloadPart = parts[1] ?? '';
  const signaturePart = parts[2] ?? '';
  const headerPayload = `${headerPart}.${payloadPart}`;
  const signature = base64UrlDecode(signaturePart);

  const hashAlg = getHashAlgorithm(algorithm);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: hashAlg },
    false,
    ['sign']
  );

  const signatureCheck = new Uint8Array(
    await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(headerPayload))
  );

  if (signature.length !== signatureCheck.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < signature.length; index++) {
    result |= (signature[index] ?? 0) ^ (signatureCheck[index] ?? 0);
  }

  return result === 0;
}

async function verifyRSA(token: string, publicKeyPem: string, algorithm: string): Promise<boolean> {
  const parts = token.split('.');
  const headerPart = parts[0] ?? '';
  const payloadPart = parts[1] ?? '';
  const signaturePart = parts[2] ?? '';
  const headerPayload = `${headerPart}.${payloadPart}`;
  const signature = base64UrlDecode(signaturePart);
  const normalizedSignature = new Uint8Array(signature.length);
  normalizedSignature.set(signature);

  const hashAlg = getHashAlgorithm(algorithm);

  const pemBody = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binaryDer = atob(pemBody);
  const derBuffer = new Uint8Array(binaryDer.length);

  for (let index = 0; index < binaryDer.length; index++) {
    derBuffer[index] = binaryDer.charCodeAt(index);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    derBuffer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: hashAlg },
    false,
    ['verify']
  );

  const encoder = new TextEncoder();
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    normalizedSignature,
    encoder.encode(headerPayload)
  );
}

export function JWTDecoder() {
  const [jwtInput, setJwtInput] = useState('');
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [copied, setCopied] = useState('');
  const [verificationSecret, setVerificationSecret] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verified' | 'invalid' | 'error'
  >('idle');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const decodeJWT = (token: string): DecodedJWT => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          header: {} as JWTHeader,
          payload: {} as JWTPayload,
          signature: '',
          valid: false,
          error: 'Invalid JWT format. Expected 3 parts separated by dots.',
        };
      }

      const headerPart = parts[0] ?? '';
      const payloadPart = parts[1] ?? '';
      const signaturePart = parts[2] ?? '';

      const header = JSON.parse(atob(headerPart.replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));

      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      return {
        header,
        payload,
        signature: signaturePart,
        valid: !isExpired,
        error: isExpired ? 'Token has expired' : undefined,
      };
    } catch (error) {
      return {
        header: {} as JWTHeader,
        payload: {} as JWTPayload,
        signature: '',
        valid: false,
        error: `Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const handleDecode = () => {
    if (!jwtInput.trim()) {
      setDecoded(null);
      setVerificationStatus('idle');
      setVerificationError(null);
      return;
    }

    const result = decodeJWT(jwtInput.trim());
    setDecoded(result);
    setVerificationStatus('idle');
    setVerificationError(null);
  };

  const handleVerify = useCallback(async () => {
    if (!decoded || !verificationSecret.trim()) {
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const alg = decoded.header.alg;
      let isValid = false;

      if (alg.startsWith('HS')) {
        isValid = await verifyHMAC(jwtInput.trim(), verificationSecret, alg);
      } else if (alg.startsWith('RS')) {
        isValid = await verifyRSA(jwtInput.trim(), verificationSecret, alg);
      } else {
        setVerificationError(`Algorithm ${alg} is not yet supported for verification`);
        setVerificationStatus('error');
        return;
      }

      setVerificationStatus(isValid ? 'verified' : 'invalid');
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'Verification failed');
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  }, [decoded, verificationSecret, jwtInput]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeRemaining = (exp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = exp - now;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const highlightJWT = (token: string) => {
    const parts = token.split('.');
    if (parts.length !== 3) return token;

    const headerPart = parts[0] ?? '';
    const payloadPart = parts[1] ?? '';
    const signaturePart = parts[2] ?? '';

    return (
      <div className="break-all rounded-lg border bg-muted/50 p-4 font-mono text-sm">
        <span className="text-blue-600 dark:text-blue-400">{headerPart}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-green-600 dark:text-green-400">{payloadPart}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-purple-600 dark:text-purple-400">
          {showSignature ? signaturePart : '•'.repeat(Math.min(signaturePart.length, 20))}
        </span>
      </div>
    );
  };

  const verificationAlgorithm = decoded?.header.alg ?? 'Unknown';
  const isHmacAlgorithm = /^HS(256|384|512)$/.test(verificationAlgorithm);
  const isRsaAlgorithm = /^RS(256|384|512)$/.test(verificationAlgorithm);
  const isEcdsaAlgorithm = /^ES(256|384|512)$/.test(verificationAlgorithm);
  const supportsVerification = isHmacAlgorithm || isRsaAlgorithm;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">JWT Token Input</CardTitle>
          <CardDescription>Paste your JWT token below to decode and verify it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm rounded-md"
          />
          <div className="flex gap-2">
            <Button onClick={handleDecode} className="flex items-center gap-2">
              <ArrowsClockwise className="h-4 w-4" />
              Decode JWT
            </Button>
            {jwtInput && (
              <Button
                variant="outline"
                onClick={() => copyToClipboard(jwtInput, 'jwt')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied === 'jwt' ? 'Copied!' : 'Copy JWT'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {decoded && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Signature Verification
                </span>
                <Badge variant="secondary" className="font-mono">
                  {verificationAlgorithm}
                </Badge>
              </CardTitle>
              <CardDescription>
                Verify JWT signature using HMAC secret or RSA public key (PEM)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isHmacAlgorithm ? (
                <div className="space-y-2">
                  <label htmlFor="jwt-verification-secret" className="font-medium text-sm">
                    Secret Key
                  </label>
                  <Input
                    id="jwt-verification-secret"
                    type="password"
                    placeholder="Enter HMAC secret key"
                    value={verificationSecret}
                    onChange={(event) => {
                      setVerificationSecret(event.target.value);
                      setVerificationStatus('idle');
                      setVerificationError(null);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="jwt-verification-public-key" className="font-medium text-sm">
                    Public Key (PEM format)
                  </label>
                  <Textarea
                    id="jwt-verification-public-key"
                    placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
                    value={verificationSecret}
                    onChange={(event) => {
                      setVerificationSecret(event.target.value);
                      setVerificationStatus('idle');
                      setVerificationError(null);
                    }}
                    className="min-h-[140px] font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleVerify}
                  disabled={!supportsVerification || isVerifying || !verificationSecret.trim()}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {isVerifying ? 'Verifying...' : 'Verify Signature'}
                </Button>

                {verificationStatus === 'verified' && (
                  <Badge variant="outline" className="text-green-600 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Signature Verified
                  </Badge>
                )}

                {verificationStatus === 'invalid' && (
                  <Badge variant="outline" className="text-red-600 dark:text-red-400">
                    <XCircle className="mr-1 h-3 w-3" />
                    Signature Invalid
                  </Badge>
                )}
              </div>

              {isEcdsaAlgorithm && verificationStatus === 'idle' && (
                <Alert>
                  <AlertDescription>
                    ECDSA verification ({verificationAlgorithm}) is not implemented yet.
                  </AlertDescription>
                </Alert>
              )}

              {verificationStatus === 'error' && verificationError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {decoded.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{decoded.error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Decoded JWT Structure</span>
                <div className="flex items-center gap-2">
                  <Badge variant={decoded.valid ? 'default' : 'destructive'}>
                    {decoded.valid ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Valid
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Invalid
                      </>
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSignature(!showSignature)}
                  >
                    {showSignature ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 font-semibold">Token Structure:</h4>
                  {highlightJWT(jwtInput)}
                </div>

                <div className="rounded-lg bg-muted/50 p-4 text-muted-foreground text-sm space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span>Header (algorithm & token type)</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span>Payload (claims & data)</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500" />
                    <span>Signature (verification)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="payload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="header">Header</TabsTrigger>
            </TabsList>

            <TabsContent value="payload" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    JWT Payload
                  </CardTitle>
                  <CardDescription>Claims and data contained in token</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {decoded.payload.exp && (
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-semibold">
                            <Clock className="h-4 w-4" />
                            Expiration
                          </span>
                          <Badge
                            variant={
                              decoded.payload.exp < Date.now() / 1000 ? 'destructive' : 'default'
                            }
                          >
                            {getTimeRemaining(decoded.payload.exp)}
                          </Badge>
                        </div>
                        <div className="mt-1 text-muted-foreground text-sm">
                          {formatTimestamp(decoded.payload.exp)}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3">
                      {Object.entries(decoded.payload).map(
                        ([key, value]) =>
                          !['exp', 'iat', 'nbf'].includes(key) && (
                            <div
                              key={key}
                              className="flex items-start justify-between rounded-lg border p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-semibold text-sm">{key}</span>
                                <div className="break-all text-muted-foreground text-sm">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(String(value), `payload-${key}`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'payload-full')
                        }
                        className="w-full"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copied === 'payload-full' ? 'Copied!' : 'Copy Full Payload'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="header" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    JWT Header
                  </CardTitle>
                  <CardDescription>Token metadata and algorithm information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(decoded.header).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-mono font-semibold text-sm">{key}</span>
                          <div className="break-all text-muted-foreground text-sm">
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(String(value), `header-${key}`)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(decoded.header, null, 2), 'header-full')
                        }
                        className="w-full"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copied === 'header-full' ? 'Copied!' : 'Copy Full Header'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
