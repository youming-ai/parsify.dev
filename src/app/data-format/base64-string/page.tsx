import { Base64Converter } from '@/components/tools/utilities/base64-converter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 String Encoder/Decoder - Encode & Decode Text Online',
  description:
    'Free online Base64 encoder and decoder. Convert text to Base64 and decode Base64 to text instantly. Secure, client-side processing with no data sent to servers.',
  keywords: [
    'base64',
    'encoder',
    'decoder',
    'text encoding',
    'base64 converter',
    'online tool',
    'data encoding',
  ],
  openGraph: {
    title: 'Base64 String Encoder/Decoder - Parsify.dev',
    description:
      'Encode and decode text to/from Base64 instantly. Free, secure, and runs entirely in your browser.',
  },
};

import { FileText } from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
// ... existing imports

export default function Base64ConverterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="BASE64 STRING OP"
        description="Encode and decode text to/from Base64 instantly. Secure, client-side processing."
        category="Data Format"
        icon={<FileText className="h-8 w-8" />}
      />

      <div className="space-y-8">
        <div className="border-2 border-foreground/20 p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] bg-card">
          <Base64Converter />
        </div>

        {/* How Base64 Works */}
        <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
          <CardHeader className="bg-muted/20 border-b-2 border-foreground/10 pb-2">
            <CardTitle className="text-lg font-bold tracking-tight uppercase">
              &gt; How Base64 Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <h4 className="mb-2 font-bold font-mono text-sm">[ Binary_to_Text ]</h4>
              <p className="text-muted-foreground text-sm font-mono">
                Base64 converts binary data into a text format using 64 different ASCII characters.
                This makes it safe to transmit binary data over text-based protocols like email.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-bold font-mono text-sm">[ Encoding_Process ]</h4>
              <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-sm font-mono">
                <li>Binary data is split into 6-bit groups</li>
                <li>Each 6-bit group maps to one of 64 characters</li>
                <li>Characters include A-Z, a-z, 0-9, + and /</li>
                <li>Padding with = characters if needed</li>
              </ol>
            </div>
            <div>
              <h4 className="mb-2 font-bold font-mono text-sm">[ Example_Dump ]</h4>
              <div className="border border-foreground/20 bg-muted/30 p-3 font-mono text-xs">
                <div>Text: "Hi"</div>
                <div>Binary: 01001000 01101001</div>
                <div>6-bit groups: 010010 000110 1001</div>
                <div>Padding: 010010 000110 1001 000000</div>
                <div>Base64: "SGk="</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Common Use Cases */}
          <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
            <CardHeader className="bg-muted/20 border-b-2 border-foreground/10 pb-2">
              <CardTitle className="text-lg font-bold tracking-tight uppercase">
                &gt; Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h4 className="mb-1 font-bold font-mono text-xs text-primary">Email Attachments</h4>
                <p className="text-muted-foreground text-xs font-mono">
                  Encode binary files for safe transmission in email messages.
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-bold font-mono text-xs text-primary">Data URLs</h4>
                <p className="text-muted-foreground text-xs font-mono">
                  Embed images and files directly in HTML/CSS using data: URLs.
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-bold font-mono text-xs text-primary">API Requests</h4>
                <p className="text-muted-foreground text-xs font-mono">
                  Transmit binary data in JSON API requests and responses.
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-bold font-mono text-xs text-primary">Config Files</h4>
                <p className="text-muted-foreground text-xs font-mono">
                  Store binary data in text-based configuration files.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Base64 Character Set */}
          <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
            <CardHeader className="bg-muted/20 border-b-2 border-foreground/10 pb-2">
              <CardTitle className="text-lg font-bold tracking-tight uppercase">
                &gt; Charset Table
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="border border-foreground/20 bg-muted/10 p-2">A-Z (26)</div>
                <div className="border border-foreground/20 bg-muted/10 p-2">a-z (26)</div>
                <div className="border border-foreground/20 bg-muted/10 p-2">0-9 (10)</div>
                <div className="border border-foreground/20 bg-muted/10 p-2">+ / (2)</div>
              </div>
              <div className="mt-4 border-2 border-blue-500/30 bg-blue-500/5 p-3">
                <p className="text-blue-600 dark:text-blue-400 text-xs font-mono">
                  <strong>TOTAL: 64 CHARS</strong>
                  <br />
                  (6 bits per char)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data URL Format */}
        <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
          <CardHeader className="bg-muted/20 border-b-2 border-foreground/10 pb-2">
            <CardTitle className="text-lg font-bold tracking-tight uppercase">
              &gt; Data URL Schema
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="border border-foreground/20 bg-muted/30 p-3 font-mono text-xs overflow-x-auto">
                data:[&lt;mediatype&gt;][;base64],&lt;data&gt;
              </div>
              <div className="grid gap-4 md:grid-cols-3 font-mono text-xs">
                <div>
                  <h4 className="mb-1 font-bold text-primary">Format</h4>
                  <p className="text-muted-foreground">
                    "Hello" encoded in Base64 with data URL prefix
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-bold text-primary">Example</h4>
                  <p className="break-all text-muted-foreground">data:text/plain;base64,SGVsbG8=</p>
                </div>
                <div>
                  <h4 className="mb-1 font-bold text-primary">Usage</h4>
                  <p className="text-muted-foreground">
                    Direct use in HTML img tags, CSS backgrounds
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
