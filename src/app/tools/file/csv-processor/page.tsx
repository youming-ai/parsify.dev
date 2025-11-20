"use client";

import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { CSVProcessor } from "@/components/tools/file/csv-processor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CSVProcessorPage() {
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
        <span className="font-medium text-gray-900">CSV Processor</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">CSV Processor</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Intermediate</Badge>
              <Badge variant="default">Stable</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Process, transform, and analyze CSV files with advanced filtering and sorting
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <CSVProcessor />

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
                  CSV validation and syntax checking
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Advanced filtering with multiple conditions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Data sorting by any column</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Export to multiple formats (CSV, JSON, HTML)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Support for different delimiters and encodings
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Supported Delimiters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Delimiters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded">
                <div className="font-mono text-lg mb-2">,</div>
                <div className="text-sm text-gray-600">Comma</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="font-mono text-lg mb-2">;</div>
                <div className="text-sm text-gray-600">Semicolon</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="font-mono text-lg mb-2">\t</div>
                <div className="text-sm text-gray-600">Tab</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="font-mono text-lg mb-2">|</div>
                <div className="text-sm text-gray-600">Pipe</div>
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
              <h4 className="font-medium mb-2">Data Cleaning</h4>
              <p className="text-gray-600 text-sm">
                Remove empty rows, trim whitespace, and standardize data formats.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Analysis</h4>
              <p className="text-gray-600 text-sm">
                Filter specific rows, sort data, and extract insights from large CSV files.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Format Conversion</h4>
              <p className="text-gray-600 text-sm">
                Convert CSV data to JSON, HTML tables, or other formats for easier integration.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Preparation</h4>
              <p className="text-gray-600 text-sm">
                Prepare data for import into databases, spreadsheets, or analysis tools.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
