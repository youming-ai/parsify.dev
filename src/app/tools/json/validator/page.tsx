"use client";

import { JsonErrorDisplay } from "@/components/tools/json/json-error-display";
import { JsonInputEditor } from "@/components/tools/json/json-input-editor";
import type { JsonValidationResult } from "@/components/tools/json/json-types";
import { JsonValidator } from "@/components/tools/json/json-validator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileJson } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const sampleValidJson = `{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "active": true,
  "roles": ["admin", "user"],
  "profile": {
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}`;

const sampleInvalidJson = `{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "active": true,
  "roles": ["admin", "user"],
  "profile": {
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  // This is a comment - invalid in JSON
  "invalid": true,
  "trailing_comma": "test",
}`;

export default function JsonValidatorPage() {
  const [jsonInput, setJsonInput] = React.useState("");
  const [validationResult, setValidationResult] = React.useState<JsonValidationResult>({
    isValid: false,
    errors: [],
  });

  const handleValidationChange = (result: JsonValidationResult) => {
    setValidationResult(result);
  };

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
        <span className="font-medium text-gray-900">JSON Validator</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <FileJson className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">JSON Validator</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Beginner</Badge>
              <Badge variant="default">Stable</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive JSON validation with detailed error messages and schema support
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileJson className="h-5 w-5" />
                  JSON Input
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJsonInput(sampleValidJson)}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    Load Valid Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput(sampleInvalidJson)}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Load Invalid Sample
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <JsonInputEditor
                value={jsonInput}
                onChange={setJsonInput}
                onValidate={handleValidationChange}
                height={400}
              />
            </CardContent>
          </Card>

          {/* Validation Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileJson className="h-5 w-5" />
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jsonInput.trim() ? (
                <div className="space-y-4">
                  {/* Validation Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${validationResult.isValid ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="font-medium">
                      {validationResult.isValid ? "Valid JSON" : "Invalid JSON"}
                    </span>
                  </div>

                  {/* Validation Summary */}
                  <div className="text-gray-600 text-sm">
                    {validationResult.errors.length} error
                    {validationResult.errors.length !== 1 ? "s" : ""} found
                  </div>

                  {/* Error Details */}
                  {validationResult.errors.length > 0 && (
                    <JsonErrorDisplay errors={validationResult.errors} content={jsonInput} />
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Enter JSON data to validate</p>
                  <p className="text-sm mt-1">
                    The validator will check for syntax errors in real-time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Validator Component */}
        <JsonValidator
          input={jsonInput}
          onValidationChange={handleValidationChange}
          showLineNumbers={true}
        />

        {/* Tool Features */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Syntax Validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Schema Validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Detailed Errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">Real-time Validation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Category:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">JSON Processing</span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Processing:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">Client Side</span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Security:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">Local Only</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href="/tools/json/formatter"
                  className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">JSON Formatter</h4>
                      <p className="text-gray-600 text-sm dark:text-gray-400">
                        Format and beautify JSON data with customizable options
                      </p>
                    </div>
                  </div>
                </Link>
                <Link
                  href="/tools/json/converter"
                  className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">JSON Converter</h4>
                      <p className="text-gray-600 text-sm dark:text-gray-400">
                        Convert JSON to various formats like XML, CSV, YAML
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
