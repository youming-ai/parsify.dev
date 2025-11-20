"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { TextProcessor } from "@/components/tools/file/text-processor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TextProcessorPage() {
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
        <span className="font-medium text-gray-900">Text Processor</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">Text Processor</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Beginner</Badge>
              <Badge variant="default">Stable</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced text processing with search, replace, and transformation capabilities
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <TextProcessor />

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
                  Search and replace with regex support
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Multiple text encoding support (UTF-8, Base64, URL)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Case conversion tools (camelCase, snake_case, etc.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Line ending normalization (LF, CRLF, CR)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Real-time preview and statistics
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
              <h4 className="font-medium mb-2">Data Cleaning</h4>
              <p className="text-gray-600 text-sm">
                Remove extra whitespace, normalize line endings, and standardize text formatting.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Batch Text Replacement</h4>
              <p className="text-gray-600 text-sm">
                Replace multiple occurrences of text patterns using normal search or regular
                expressions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Encoding Conversion</h4>
              <p className="text-gray-600 text-sm">
                Convert between different text encodings like UTF-8, Base64, and URL encoding.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Code Formatting</h4>
              <p className="text-gray-600 text-sm">
                Convert variable naming conventions between camelCase, snake_case, PascalCase, and
                kebab-case.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supported File Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported File Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Text Files:</span>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• .txt</li>
                  <li>• .md (Markdown)</li>
                  <li>• .rtf</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Data Files:</span>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• .csv</li>
                  <li>• .json</li>
                  <li>• .xml</li>
                  <li>• .yaml</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Code Files:</span>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• .html</li>
                  <li>• .css</li>
                  <li>• .js</li>
                  <li>• .ts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
