/**
 * JWT Decoder Component
 * Decode and validate JSON Web Tokens (JWT) with header and payload analysis
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Info,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface JWTPayload {
  [key: string]: any;
}

interface JWTHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  [key: string]: any;
}

interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  valid: boolean;
  error?: string;
}

export function JWTDecoder({ className }: { className?: string }) {
  const [jwtToken, setJwtToken] = useState('');
  const [decodedJWT, setDecodedJWT] = useState<DecodedJWT | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showFullPayload, setShowFullPayload] = useState(false);
  const [showFullHeader, setShowFullHeader] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('jwt-decoder', { initialToken: '' });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Validate JWT structure
  const isValidJWTStructure = (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  };

  // Decode Base64 URL safe
  const base64UrlDecode = (str: string): string => {
    try {
      // Add padding if needed
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) {
        str += '=';
      }
      return atob(str);
    } catch (error) {
      throw new Error('Invalid Base64 encoding');
    }
  };

  // Parse JWT token
  const parseJWT = useCallback((token: string): DecodedJWT => {
    try {
      if (!isValidJWTStructure(token)) {
        return {
          header: {},
          payload: {},
          signature: '',
          valid: false,
          error: 'Invalid JWT format. Expected 3 parts separated by dots.'
        };
      }

      const [headerB64, payloadB64, signature] = token.split('.');

      // Decode header
      let header: JWTHeader = {};
      try {
        const headerStr = base64UrlDecode(headerB64);
        header = JSON.parse(headerStr);
      } catch (error) {
        return {
          header: {},
          payload: {},
          signature,
          valid: false,
          error: 'Invalid JWT header encoding'
        };
      }

      // Decode payload
      let payload: JWTPayload = {};
      try {
        const payloadStr = base64UrlDecode(payloadB64);
        payload = JSON.parse(payloadStr);
      } catch (error) {
        return {
          header,
          payload: {},
          signature,
          valid: false,
          error: 'Invalid JWT payload encoding'
        };
      }

      // Validate standard claims
      const now = Math.floor(Date.now() / 1000);
      let valid = true;
      let warnings: string[] = [];

      // Check expiration
      if (payload.exp && typeof payload.exp === 'number') {
        if (payload.exp < now) {
          valid = false;
          warnings.push(`Token expired at ${new Date(payload.exp * 1000).toLocaleString()}`);
        } else {
          warnings.push(`Token expires at ${new Date(payload.exp * 1000).toLocaleString()}`);
        }
      }

      // Check not before
      if (payload.nbf && typeof payload.nbf === 'number') {
        if (payload.nbf > now) {
          valid = false;
          warnings.push(`Token not valid until ${new Date(payload.nbf * 1000).toLocaleString()}`);
        }
      }

      // Check issued at
      if (payload.iat && typeof payload.iat === 'number') {
        warnings.push(`Token issued at ${new Date(payload.iat * 1000).toLocaleString()}`);
      }

      // Validate algorithm
      if (!header.alg) {
        warnings.push('No algorithm specified in header');
      } else if (header.alg === 'none') {
        warnings.push('Unsecured token (algorithm: none)');
      }

      return {
        header,
        payload,
        signature,
        valid,
        error: warnings.length > 0 ? warnings.join('. ') : undefined
      };
    } catch (error) {
      return {
        header: {},
        payload: {},
        signature: '',
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to parse JWT token'
      };
    }
  }, []);

  // Handle token input
  const handleTokenChange = useCallback((token: string) => {
    setJwtToken(token);

    if (token.trim()) {
      const decoded = parseJWT(token);
      setDecodedJWT(decoded);
      setIsValid(decoded.valid);
    } else {
      setDecodedJWT(null);
      setIsValid(false);
    }

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { token },
        lastActivity: new Date()
      });
    }
  }, [parseJWT, sessionId]);

  // Format JSON for display
  const formatJSON = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return JSON.stringify(obj);
    }
  };

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  }, []);

  // Auto-detect JWT from clipboard
  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (isValidJWTStructure(text)) {
        handleTokenChange(text);
        toast.success('JWT token pasted from clipboard');
      } else {
        toast.error('Clipboard content does not appear to be a valid JWT token');
      }
    } catch (error) {
      toast.error('Failed to read clipboard');
    }
  }, [handleTokenChange]);

  // Get claim type badge
  const getClaimTypeBadge = (key: string, value: any): React.ReactNode => {
    const claimTypes: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      'iss': { label: 'Issuer', variant: 'default' },
      'sub': { label: 'Subject', variant: 'default' },
      'aud': { label: 'Audience', variant: 'default' },
      'exp': { label: 'Expiration', variant: 'destructive' },
      'nbf': { label: 'Not Before', variant: 'outline' },
      'iat': { label: 'Issued At', variant: 'outline' },
      'jti': { label: 'JWT ID', variant: 'secondary' },
      'scope': { label: 'Scope', variant: 'default' },
      'roles': { label: 'Roles', variant: 'default' },
      'email': { label: 'Email', variant: 'outline' },
      'name': { label: 'Name', variant: 'outline' }
    };

    const claimType = claimTypes[key];
    if (claimType) {
      return <Badge variant={claimType.variant}>{claimType.label}</Badge>;
    }
    return null;
  };

  // Format timestamp values
  const formatTimestamp = (value: any): string => {
    if (typeof value === 'number' && value > 1000000000) {
      return `${value} (${new Date(value * 1000).toLocaleString()})`;
    }
    return String(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Key className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">JWT Decoder</h1>
        </div>

        <Button
          variant=\"outline\"
          size=\"sm\"
          onClick={pasteFromClipboard}
        >
          Paste from Clipboard
        </Button>
      </div>

      {/* Token Input */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Shield className=\"h-5 w-5 mr-2\" />
            JWT Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={jwtToken}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder=\"Paste your JWT token here...\"
            className=\"min-h-[120px] font-mono text-sm\"
          />

          {jwtToken && (
            <div className=\"mt-4 flex items-center space-x-2\">
              {isValid ? (
                <CheckCircle2 className=\"h-5 w-5 text-green-500\" />
              ) : (
                <XCircle className=\"h-5 w-5 text-red-500\" />
              )}
              <span className=\"text-sm font-medium\">
                {isValid ? 'Valid JWT Structure' : 'Invalid JWT Structure'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decoded Results */}
      {decodedJWT && (
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                <div className=\"flex items-center\">
                  <Info className=\"h-5 w-5 mr-2\" />
                  Header
                </div>
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setShowFullHeader(!showFullHeader)}
                >
                  {showFullHeader ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {Object.entries(decodedJWT.header).map(([key, value]) => (
                  <div key={key} className=\"space-y-1\">
                    <div className=\"flex items-center justify-between\">
                      <span className=\"font-mono text-sm font-medium\">{key}</span>
                      {getClaimTypeBadge(key, value)}
                    </div>
                    <div className=\"text-sm text-muted-foreground break-all\">
                      {typeof value === 'object' ? formatJSON(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>

              {showFullHeader && (
                <div className=\"mt-4 pt-4 border-t\">
                  <div className=\"flex items-center justify-between mb-2\">
                    <span className=\"text-sm font-medium\">Full Header JSON</span>
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => copyToClipboard(formatJSON(decodedJWT.header), 'Header JSON')}
                    >
                      <Copy className=\"h-4 w-4 mr-2\" />
                      Copy
                    </Button>
                  </div>
                  <pre className=\"text-xs bg-muted p-3 rounded overflow-auto max-h-40\">
                    {formatJSON(decodedJWT.header)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payload */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                <div className=\"flex items-center\">
                  <Clock className=\"h-5 w-5 mr-2\" />
                  Payload
                </div>
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setShowFullPayload(!showFullPayload)}
                >
                  {showFullPayload ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {Object.entries(decodedJWT.payload).map(([key, value]) => (
                  <div key={key} className=\"space-y-1\">
                    <div className=\"flex items-center justify-between\">
                      <span className=\"font-mono text-sm font-medium\">{key}</span>
                      {getClaimTypeBadge(key, value)}
                    </div>
                    <div className=\"text-sm text-muted-foreground break-all\">
                      {['exp', 'nbf', 'iat'].includes(key)
                        ? formatTimestamp(value)
                        : (typeof value === 'object' ? formatJSON(value) : String(value))
                      }
                    </div>
                  </div>
                ))}
              </div>

              {showFullPayload && (
                <div className=\"mt-4 pt-4 border-t\">
                  <div className=\"flex items-center justify-between mb-2\">
                    <span className=\"text-sm font-medium\">Full Payload JSON</span>
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => copyToClipboard(formatJSON(decodedJWT.payload), 'Payload JSON')}
                    >
                      <Copy className=\"h-4 w-4 mr-2\" />
                      Copy
                    </Button>
                  </div>
                  <pre className=\"text-xs bg-muted p-3 rounded overflow-auto max-h-40\">
                    {formatJSON(decodedJWT.payload)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Signature and Validation */}
      {decodedJWT && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <Shield className=\"h-5 w-5 mr-2\" />
              Signature & Validation
            </CardTitle>
          </CardHeader>
          <CardContent className=\"space-y-4\">
            {/* Signature */}
            <div>
              <h4 className=\"text-sm font-medium mb-2\">Signature</h4>
              <div className=\"p-3 bg-muted rounded font-mono text-xs break-all max-h-20 overflow-auto\">
                {decodedJWT.signature}
              </div>
              <Button
                variant=\"outline\"
                size=\"sm\"
                className=\"mt-2\"
                onClick={() => copyToClipboard(decodedJWT.signature, 'Signature')}
              >
                <Copy className=\"h-4 w-4 mr-2\" />
                Copy Signature
              </Button>
            </div>

            <Separator />

            {/* Validation Status */}
            <div>
              <h4 className=\"text-sm font-medium mb-2\">Validation Status</h4>
              <Alert>
                <AlertCircle className=\"h-4 w-4\" />
                <AlertDescription>
                  {decodedJWT.valid
                    ? 'JWT token structure is valid. Note: This tool only decodes and validates the structure. It cannot verify cryptographic signatures.'
                    : decodedJWT.error || 'JWT token is invalid'
                  }
                </AlertDescription>
              </Alert>
            </div>

            {/* Security Information */}
            <Alert>
              <Shield className=\"h-4 w-4\" />
              <AlertDescription>
                <strong>Security Notice:</strong> This decoder only validates the JWT structure and timestamps.
                It cannot verify cryptographic signatures. Always verify JWT signatures server-side for security.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
