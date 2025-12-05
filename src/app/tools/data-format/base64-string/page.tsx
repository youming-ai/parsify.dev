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

export default function Base64ConverterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Component */}
      <div className="space-y-6">
        <Base64Converter />

        {/* How Base64 Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Base64 Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Binary to Text Conversion</h4>
              <p className="text-gray-600 text-sm">
                Base64 converts binary data into a text format using 64 different ASCII characters.
                This makes it safe to transmit binary data over text-based protocols like email.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Encoding Process</h4>
              <ol className="list-inside list-decimal space-y-1 text-gray-600 text-sm">
                <li>Binary data is split into 6-bit groups</li>
                <li>Each 6-bit group maps to one of 64 characters</li>
                <li>Characters include A-Z, a-z, 0-9, + and /</li>
                <li>Padding with = characters if needed</li>
              </ol>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Example</h4>
              <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                <div>Text: "Hi"</div>
                <div>Binary: 01001000 01101001</div>
                <div>6-bit groups: 010010 000110 1001</div>
                <div>Padding: 010010 000110 1001 000000</div>
                <div>Base64: "SGk="</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Email Attachments</h4>
              <p className="text-gray-600 text-sm">
                Encode binary files for safe transmission in email messages.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Data URLs</h4>
              <p className="text-gray-600 text-sm">
                Embed images and files directly in HTML/CSS using data: URLs.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">API Requests</h4>
              <p className="text-gray-600 text-sm">
                Transmit binary data in JSON API requests and responses.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Configuration Files</h4>
              <p className="text-gray-600 text-sm">
                Store binary data in text-based configuration files.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Base64 Character Set */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Base64 Character Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="rounded bg-gray-50 p-2 font-mono text-lg">A-Z (26 chars)</div>
              <div className="rounded bg-gray-50 p-2 font-mono text-lg">a-z (26 chars)</div>
              <div className="rounded bg-gray-50 p-2 font-mono text-lg">0-9 (10 chars)</div>
              <div className="rounded bg-gray-50 p-2 font-mono text-lg">+ / (2 chars)</div>
            </div>
            <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3">
              <p className="text-blue-800 text-sm">
                <strong>Total: 64 characters</strong> (6 bits of information per character)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data URL Format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data URL Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                data:[&lt;mediatype&gt;][;base64],&lt;data&gt;
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="mb-1 font-medium">Format</h4>
                  <p className="text-gray-600 text-sm">
                    "Hello" encoded in Base64 with data URL prefix
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-medium">Example</h4>
                  <p className="break-all font-mono text-xs">data:text/plain;base64,SGVsbG8=</p>
                </div>
                <div>
                  <h4 className="mb-1 font-medium">Use</h4>
                  <p className="text-gray-600 text-sm">
                    Can be used directly in HTML img tags, CSS backgrounds
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
