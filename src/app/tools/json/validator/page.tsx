'use client';

import { JsonErrorDisplay } from '@/components/tools/json/json-error-display';
import { JsonInputEditor } from '@/components/tools/json/json-input-editor';
import type { JsonValidationResult } from '@/components/tools/json/json-types';
import { JsonValidator } from '@/components/tools/json/json-validator';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileJson } from 'lucide-react';
import * as React from 'react';

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
  const [jsonInput, setJsonInput] = React.useState('');
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

      {/* Tool Header */}

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
                      className={`h-3 w-3 rounded-full ${validationResult.isValid ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="font-medium">
                      {validationResult.isValid ? 'Valid JSON' : 'Invalid JSON'}
                    </span>
                  </div>

                  {/* Validation Summary */}
                  <div className="text-gray-600 text-sm">
                    {validationResult.errors.length} error
                    {validationResult.errors.length !== 1 ? 's' : ''} found
                  </div>

                  {/* Error Details */}
                  {validationResult.errors.length > 0 && (
                    <JsonErrorDisplay errors={validationResult.errors} content={jsonInput} />
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>Enter JSON data to validate</p>
                  <p className="mt-1 text-sm">
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

        {/* Tool Info Section */}
        <ToolInfoSection
          features={[
            'Real-time syntax validation as you type',
            'JSON Schema validation support',
            'Detailed error messages with line numbers',
            'Visual error highlighting in editor',
            'Support for comments detection',
          ]}
          info={{
            category: 'JSON Processing',
            processing: 'Client Side',
            security: 'Local Only',
            difficulty: 'Beginner',
          }}
          related={[
            {
              name: 'JSON Formatter',
              description: 'Format and beautify JSON data with customizable options',
              href: '/tools/json/formatter',
              icon: <FileJson className="h-5 w-5" />,
            },
            {
              name: 'JSON Converter',
              description: 'Convert JSON to various formats like XML, CSV, YAML',
              href: '/tools/json/converter',
              icon: <FileJson className="h-5 w-5" />,
            },
            {
              name: 'JSON Path Evaluator',
              description: 'Extract data from JSON using JSONPath expressions',
              href: '/tools/json/path-queries',
              icon: <FileJson className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </div>
  );
}
