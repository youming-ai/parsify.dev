import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import JWTDecoderClient from './client';

export const metadata: Metadata = {
  title: 'JWT Decoder - Parse & Decode JSON Web Tokens',
  description:
    'Decode and verify JSON Web Tokens (JWT) instantly. View header, payload, and signature information.',
  keywords: ['JWT', 'JSON Web Token', 'decoder', 'parser', 'authentication', 'token'],
};

export default function JWTDecoderPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> JWT decoding is performed entirely in your browser. Your
          tokens never leave your device and are not sent to any server.
        </AlertDescription>
      </Alert>

      <JWTDecoderClient />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              What is JWT?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground text-sm">
              JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and
              self-contained way for securely transmitting information between parties as a JSON
              object.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">JWT Structure:</h4>
              <div className="rounded bg-muted p-2 font-mono text-xs">header.payload.signature</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>• Authentication in web applications</li>
              <li>• Information exchange between services</li>
              <li>• API access tokens</li>
              <li>• Session management</li>
              <li>• Authorization claims</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
