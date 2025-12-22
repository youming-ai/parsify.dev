import { JsonLd } from '@/components/seo/json-ld';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';
import JWTDecoderClient from './client';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'jwt-decoder',
  customTitle: 'JWT Decoder - Parse & Decode JSON Web Tokens',
  customDescription:
    'Decode and verify JSON Web Tokens (JWT) instantly. View header, payload, and signature information.',
  extraKeywords: ['JSON Web Token', 'parser', 'authentication', 'token'],
});

export default function JWTDecoderPage() {
  const structuredData = generateToolStructuredData('jwt-decoder');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <strong className="uppercase">[ Privacy Notice ]</strong>
          <br />
          JWT decoding is performed entirely in your browser. Your tokens never leave your device.
        </div>

        <JWTDecoderClient />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="border-b bg-muted/40 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <AlertCircle className="h-5 w-5" />
                What is JWT?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and
                self-contained way for securely transmitting information between parties as a JSON
                object.
              </p>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase">JWT Structure:</h4>
                <div className="border border-border/50 bg-muted/50 p-2 font-mono text-xs text-center rounded">
                  <span className="text-blue-600 dark:text-blue-400">header</span>.
                  <span className="text-green-600 dark:text-green-400">payload</span>.
                  <span className="text-purple-600 dark:text-purple-400">signature</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="border-b bg-muted/40 pb-2">
              <CardTitle className="text-lg font-bold">Common Use Cases</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Authentication in web applications
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Information exchange between services
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  API access tokens
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Session management
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
