import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';
import JWTDecoderClient from './client';

export const metadata: Metadata = {
  title: 'JWT Decoder - Parse & Decode JSON Web Tokens',
  description:
    'Decode and verify JSON Web Tokens (JWT) instantly. View header, payload, and signature information.',
  keywords: ['JWT', 'JSON Web Token', 'decoder', 'parser', 'authentication', 'token'],
};

import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
import { KeyRound } from 'lucide-react';

export default function JWTDecoderPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="JWT DECODER"
        description="Decode and verify JSON Web Tokens (JWT) instantly. View header, payload, and signature information."
        category="Security & Authentication"
        icon={<KeyRound className="h-8 w-8" />}
      />

      <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
        <strong className="uppercase">[ Privacy Notice ]</strong>
        <br />
        JWT decoding is performed entirely in your browser. Your tokens never leave your device.
      </div>

      <JWTDecoderClient />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
          <CardHeader className="border-b-2 border-foreground/10 bg-muted/20 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
              <AlertCircle className="h-5 w-5" />
              What is JWT?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm font-mono text-muted-foreground leading-relaxed">
              JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and
              self-contained way for securely transmitting information between parties as a JSON
              object.
            </p>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase">JWT Structure:</h4>
              <div className="border border-foreground/20 bg-muted p-2 font-mono text-xs text-center">
                <span className="text-blue-600 dark:text-blue-400">header</span>.
                <span className="text-green-600 dark:text-green-400">payload</span>.
                <span className="text-purple-600 dark:text-purple-400">signature</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
          <CardHeader className="border-b-2 border-foreground/10 bg-muted/20 pb-2">
            <CardTitle className="text-lg font-bold uppercase tracking-tight">
              Common Use Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3 font-mono text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary"></span>
                Authentication in web applications
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary"></span>
                Information exchange between services
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary"></span>
                API access tokens
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary"></span>
                Session management
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
