"use client";

import { Base64Converter } from "@/components/tools/utilities/base64-converter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function Base64ConverterPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center space-x-2 text-gray-600 text-sm">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-gray-900">
          Tools
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">Base64 Converter</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">Base64 Converter</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Beginner</Badge>
              <Badge variant="default">Stable</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Convert between text and Base64 encoding with file support
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <Base64Converter />

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Text to Base64 encoding and decoding
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  File to Base64 conversion for images and documents
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Batch processing for multiple files
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Preview mode with download options
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Unicode and special character support
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How Base64 Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Base64 Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Binary to Text Conversion</h4>
              <p className="text-gray-600 text-sm">
                Base64 converts binary data into a text format using 64 different ASCII characters.
                This makes it safe to transmit binary data over text-based protocols like email.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Encoding Process</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Binary data is split into 6-bit groups</li>
                <li>Each 6-bit group maps to one of 64 characters</li>
                <li>Characters include A-Z, a-z, 0-9, + and /</li>
                <li>Padding with = characters if needed</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Example</h4>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm">
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
              <h4 className="font-medium mb-2">Email Attachments</h4>
              <p className="text-gray-600 text-sm">
                Encode binary files for safe transmission in email messages.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data URLs</h4>
              <p className="text-gray-600 text-sm">
                Embed images and files directly in HTML/CSS using data: URLs.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">API Requests</h4>
              <p className="text-gray-600 text-sm">
                Transmit binary data in JSON API requests and responses.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configuration Files</h4>
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
              <div className="font-mono text-lg bg-gray-50 p-2 rounded">A-Z (26 chars)</div>
              <div className="font-mono text-lg bg-gray-50 p-2 rounded">a-z (26 chars)</div>
              <div className="font-mono text-lg bg-gray-50 p-2 rounded">0-9 (10 chars)</div>
              <div className="font-mono text-lg bg-gray-50 p-2 rounded">+ / (2 chars)</div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
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
              <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                data:[&lt;mediatype&gt;][;base64],&lt;data&gt;
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Format</h4>
                  <p className="text-sm text-gray-600">
                    "Hello" encoded in Base64 with data URL prefix
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Example</h4>
                  <p className="font-mono text-xs break-all">data:text/plain;base64,SGVsbG8=</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Use</h4>
                  <p className="text-sm text-gray-600">
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
