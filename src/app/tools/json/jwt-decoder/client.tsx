"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
} from "lucide-react";

interface JWTPayload {
  [key: string]: any;
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
  [key: string]: any;
}

interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  valid: boolean;
  error?: string;
}

export default function JWTDecoderClient() {
  const [jwtInput, setJwtInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [copied, setCopied] = useState("");

  const decodeJWT = (token: string): DecodedJWT => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return {
          header: {} as JWTHeader,
          payload: {} as JWTPayload,
          signature: "",
          valid: false,
          error: "Invalid JWT format. Expected 3 parts separated by dots.",
        };
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      return {
        header,
        payload,
        signature: parts[2],
        valid: !isExpired,
        error: isExpired ? "Token has expired" : undefined,
      };
    } catch (error) {
      return {
        header: {} as JWTHeader,
        payload: {} as JWTPayload,
        signature: "",
        valid: false,
        error: `Failed to decode JWT: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  };

  const handleDecode = () => {
    if (!jwtInput.trim()) {
      setDecoded(null);
      return;
    }
    const result = decodeJWT(jwtInput.trim());
    setDecoded(result);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeRemaining = (exp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = exp - now;

    if (remaining <= 0) return "Expired";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const highlightJWT = (token: string) => {
    const parts = token.split(".");
    if (parts.length !== 3) return token;

    return (
      <div className="font-mono text-sm break-all">
        <span className="text-blue-600 dark:text-blue-400">{parts[0]}</span>.
        <span className="text-green-600 dark:text-green-400">{parts[1]}</span>.
        <span className="text-purple-600 dark:text-purple-400">
          {showSignature ? parts[2] : "•".repeat(Math.min(parts[2].length, 20))}
        </span>
      </div>
    );
  };

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
            className="min-h-32 font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleDecode} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Decode JWT
            </Button>
            {jwtInput && (
              <Button
                variant="outline"
                onClick={() => copyToClipboard(jwtInput, "jwt")}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied === "jwt" ? "Copied!" : "Copy JWT"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {decoded && (
        <div className="space-y-6">
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
                  <Badge variant={decoded.valid ? "default" : "destructive"}>
                    {decoded.valid ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </>
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSignature(!showSignature)}
                  >
                    {showSignature ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Token Structure:</h4>
                  {highlightJWT(jwtInput)}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• Blue: Header (algorithm & token type)</p>
                  <p>• Green: Payload (claims & data)</p>
                  <p>• Purple: Signature (verification)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="payload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="header">Header</TabsTrigger>
            </TabsList>

            <TabsContent value="payload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    JWT Payload
                  </CardTitle>
                  <CardDescription>Claims and data contained in the token</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Time-based claims */}
                    {decoded.payload.exp && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Expiration
                          </span>
                          <Badge
                            variant={
                              decoded.payload.exp < Date.now() / 1000 ? "destructive" : "default"
                            }
                          >
                            {getTimeRemaining(decoded.payload.exp)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatTimestamp(decoded.payload.exp)}
                        </div>
                      </div>
                    )}

                    {/* Standard claims */}
                    <div className="grid gap-3">
                      {Object.entries(decoded.payload).map(
                        ([key, value]) =>
                          !["exp", "iat", "nbf"].includes(key) && (
                            <div
                              key={key}
                              className="flex items-start justify-between p-2 border rounded"
                            >
                              <div>
                                <span className="font-mono text-sm font-semibold">{key}</span>
                                <div className="text-sm text-muted-foreground break-all">
                                  {typeof value === "object"
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
                          ),
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(decoded.payload, null, 2), "payload-full")
                        }
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copied === "payload-full" ? "Copied!" : "Copy Full Payload"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="header" className="space-y-4">
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
                        className="flex items-start justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-mono text-sm font-semibold">{key}</span>
                          <div className="text-sm text-muted-foreground break-all">
                            {typeof value === "object"
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
                          copyToClipboard(JSON.stringify(decoded.header, null, 2), "header-full")
                        }
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copied === "header-full" ? "Copied!" : "Copy Full Header"}
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
