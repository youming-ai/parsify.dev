"use client";

import { Hash } from "lucide-react";
import Link from "next/link";
import { HashGenerator } from "@/components/tools/data/hash-generator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HashGeneratorPage() {
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
        <span className="font-medium text-gray-900">Hash Generator</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Hash className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">Hash Generator</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Beginner</Badge>
              <Badge variant="default">Stable</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Generate various hash types for data integrity and security
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <HashGenerator />

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
                  Multiple hash algorithms (MD5, SHA-1, SHA-256, SHA-384, SHA-512)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Support for both text and file input
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Batch processing - hash multiple files at once
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  One-click hash copying to clipboard
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Uppercase/lowercase output options
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Password Security</h4>
              <p className="text-gray-600 text-sm">
                Generate secure hash values for password storage and verification.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">File Integrity</h4>
              <p className="text-gray-600 text-sm">
                Verify file integrity by comparing hash values before and after transmission.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Verification</h4>
              <p className="text-gray-600 text-sm">
                Generate checksums to ensure data hasn't been corrupted or tampered with.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Digital Signatures</h4>
              <p className="text-gray-600 text-sm">
                Create hash values as part of digital signature processes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Algorithm Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Algorithm</th>
                    <th className="text-left p-2">Output Length</th>
                    <th className="text-left p-2">Security</th>
                    <th className="text-left p-2">Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">MD5</td>
                    <td className="p-2">128 bits</td>
                    <td className="p-2">
                      <span className="text-red-600">❌ Insecure</span>
                    </td>
                    <td className="p-2">Legacy systems, non-security</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">SHA-1</td>
                    <td className="p-2">160 bits</td>
                    <td className="p-2">
                      <span className="text-red-600">❌ Deprecated</span>
                    </td>
                    <td className="p-2">Legacy compatibility</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">SHA-256</td>
                    <td className="p-2">256 bits</td>
                    <td className="p-2">
                      <span className="text-green-600">✅ Secure</span>
                    </td>
                    <td className="p-2">General purpose, blockchain</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">SHA-384</td>
                    <td className="p-2">384 bits</td>
                    <td className="p-2">
                      <span className="text-green-600">✅ Secure</span>
                    </td>
                    <td className="p-2">High-security applications</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">SHA-512</td>
                    <td className="p-2">512 bits</td>
                    <td className="p-2">
                      <span className="text-green-600">✅ Most Secure</span>
                    </td>
                    <td className="p-2">Maximum security requirements</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
