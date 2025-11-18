"use client";

import { DataValidator } from "@/components/tools/data/data-validator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function DataValidatorPage() {
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
        <span className="font-medium text-gray-900">Data Validator</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">Data Validator</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Advanced</Badge>
              <Badge variant="default">Experimental</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Validate data against custom rules and schemas
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <DataValidator />

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
                  Custom validation rules with multiple field types
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Schema validation for JSON, XML, CSV, YAML
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Batch validation with detailed error reporting
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Predefined templates for common validations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Regex pattern matching and custom logic
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Supported Data Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Data Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">JSON</div>
                <p className="text-sm text-gray-600">
                  JavaScript Object Notation with nested object validation
                </p>
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">CSV</div>
                <p className="text-sm text-gray-600">
                  Comma-separated values with header and row validation
                </p>
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">XML</div>
                <p className="text-sm text-gray-600">
                  XML document structure and content validation
                </p>
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">YAML</div>
                <p className="text-sm text-gray-600">
                  YAML configuration file validation (basic parsing)
                </p>
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Form Data</div>
                <p className="text-sm text-gray-600">Key-value pair form data validation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Validation Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Built-in Validators</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Required:</strong> Field must not be empty
                  </li>
                  <li>
                    <strong>Email:</strong> Valid email address format
                  </li>
                  <li>
                    <strong>URL:</strong> Valid URL format checking
                  </li>
                  <li>
                    <strong>Number:</strong> Numeric value validation
                  </li>
                  <li>
                    <strong>Length:</strong> String length constraints
                  </li>
                  <li>
                    <strong>Range:</strong> Numeric range validation
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Pattern Matching</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Regex:</strong> Regular expression patterns
                  </li>
                  <li>
                    <strong>Contains:</strong> Substring matching
                  </li>
                  <li>
                    <strong>Starts With:</strong> Prefix validation
                  </li>
                  <li>
                    <strong>Ends With:</strong> Suffix validation
                  </li>
                  <li>
                    <strong>Equals:</strong> Exact value matching
                  </li>
                  <li>
                    <strong>Custom:</strong> Custom validation logic
                  </li>
                </ul>
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
              <h4 className="font-medium mb-2">API Request Validation</h4>
              <p className="text-gray-600 text-sm">
                Validate incoming API requests against expected schemas and data types.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Form Submission Validation</h4>
              <p className="text-gray-600 text-sm">
                Ensure user input meets required criteria before processing.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Import Validation</h4>
              <p className="text-gray-600 text-sm">
                Validate CSV/JSON imports before database insertion.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configuration Validation</h4>
              <p className="text-gray-600 text-sm">
                Check configuration files for required fields and valid values.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Batch Processing</h4>
              <p className="text-gray-600 text-sm">
                Validate multiple records or objects simultaneously with detailed reporting for each
                item.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Error Reporting</h4>
              <p className="text-gray-600 text-sm">
                Comprehensive error messages with field-level validation details and suggestions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Rule Templates</h4>
              <p className="text-gray-600 text-sm">
                Pre-built templates for common validation scenarios that can be customized.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Nested Object Support</h4>
              <p className="text-gray-600 text-sm">
                Deep validation of nested JSON objects and arrays with path-based rules.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Experimental Status</div>
                    <div className="text-sm text-yellow-700">
                      This tool is currently experimental and may have limitations in complex
                      validation scenarios.
                    </div>
                  </div>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • YAML parsing is basic (full implementation would require additional libraries)
                </li>
                <li>• Complex XML schema validation is limited</li>
                <li>• Cross-field validation rules are not yet supported</li>
                <li>• Custom JavaScript validation functions are not implemented</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
