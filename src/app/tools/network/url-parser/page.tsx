'use client';

import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { URLEncoder } from '@/components/tools/utilities/url-encoder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Hash, Link2 } from 'lucide-react';

export default function URLEncoderPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Component */}
      <div className="space-y-6">
        <URLEncoder />

        {/* Tool Info Section */}
        <ToolInfoSection
          features={[
            'Full URL encoding for complete URLs',
            'Component encoding for URL parameters',
            'Path encoding that preserves slashes',
            'Batch processing for multiple URLs',
            'Unicode and special character support',
          ]}
          info={{
            category: 'Encoding Tools',
            processing: 'Client Side',
            security: 'Local Only',
            difficulty: 'Beginner',
          }}
          related={[
            {
              name: 'Base64 Converter',
              description: 'Encode and decode Base64 strings and files',
              href: '/tools/utilities/base64-converter',
              icon: <FileText className="h-5 w-5" />,
            },
            {
              name: 'Hash Generator',
              description: 'Generate cryptographic hashes for data verification',
              href: '/tools/data/hash-generator',
              icon: <Hash className="h-5 w-5" />,
            },
            {
              name: 'URL Shortener',
              description: 'Create short URLs and manage link redirects',
              href: '/tools/network/url-shortener',
              icon: <Link2 className="h-5 w-5" />,
            },
          ]}
        />

        {/* Encoding Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Encoding Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Full URL Encoding</h4>
              <p className="text-gray-600 text-sm mb-2">
                Encodes all characters that need escaping in a complete URL, including reserved
                characters.
              </p>
              <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                {
                  'https://example.com/search?q=hello world → https%3A//example.com/search%3Fq%3Dhello%20world'
                }
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Component Encoding</h4>
              <p className="text-gray-600 text-sm mb-2">
                Encodes URL components separately, useful for query parameters and form data.
              </p>
              <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                query=hello world → query%3Dhello%20world
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Path Encoding</h4>
              <p className="text-gray-600 text-sm mb-2">
                Encodes path segments while preserving slashes between directories.
              </p>
              <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                /path/to/file with spaces → /path/to/file%20with%20spaces
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Web Development</h4>
              <p className="text-gray-600 text-sm">
                Prepare URLs for API requests, form submissions, and navigation.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">API Integration</h4>
              <p className="text-gray-600 text-sm">
                Encode query parameters and URL components for REST API calls.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Processing</h4>
              <p className="text-gray-600 text-sm">
                Handle URLs from user input safely and format them correctly.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">SEO & Marketing</h4>
              <p className="text-gray-600 text-sm">
                Create clean, properly encoded URLs for web pages and campaigns.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* URL Standards Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">URL Encoding Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">RFC 3986 - Uniform Resource Identifier</h4>
                <p className="text-gray-600 text-sm">
                  Defines the syntax and semantics of URIs, including URL encoding rules using
                  percent-encoding.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Percent-Encoding</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Characters are encoded as % followed by two hexadecimal digits representing the
                  UTF-8 bytes.
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-mono">
                    <div>Space → %20</div>
                    <div>! → %21</div>
                    <div>A → A (unchanged)</div>
                    <div>你 → %E4%BD%A0</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Unreserved Characters</h4>
                <p className="text-gray-600 text-sm">
                  These characters don't need encoding: A-Z a-z 0-9 - . _ ~
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
