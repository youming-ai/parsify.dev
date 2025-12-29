/**
 * JSON Tool Complete Component
 * Integrated JSON tools component that combines all JSON functionality
 * This is the main component that users interact with for JSON processing
 */

'use client';

import { Eye, FileCode, PencilSimple } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { JsonHeroViewer } from './json-hero-viewer';

const JsonSimpleEditor = dynamic(
  () => import('./json-simple-editor').then((mod) => mod.JsonSimpleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="gap 2 flex flex-col items-center justify-center py-10 text-muted-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        <span>Loading editor...</span>
      </div>
    ),
  }
);

interface JsonToolCompleteProps {
  initialData?: string;
  className?: string;
  showHeader?: boolean;
}

export const JsonToolComplete: React.FC<JsonToolCompleteProps> = ({
  initialData = '{\n  "name": "Parsify.dev",\n  "version": "1.0.0",\n  "description": "Essential Tools for Developers",\n  "features": [\n    "JSON Formatter",\n    "Base64 Encoder",\n    "JWT Decoder"\n  ],\n  "settings": {\n    "theme": "dark",\n    "autoFormat": true\n  }\n}',
  className,
  showHeader = true,
}) => {
  const [jsonData, setJsonData] = useState(initialData);
  const [isValidJson, setIsValidJson] = useState(true);
  const [parsedData, setParsedData] = useState<any>(() => {
    try {
      return JSON.parse(initialData);
    } catch {
      return {};
    }
  });

  const handleJsonChange = (newJsonData: string) => {
    setJsonData(newJsonData);
    try {
      const parsed = JSON.parse(newJsonData || '{}');
      setParsedData(parsed);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  return (
    <div className={`mx-auto w-full ${className}`}>
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-2xl">JSON Tools</h1>
              <p className="text-muted-foreground text-sm">
                Format, validate, and explore JSON data
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            Live Preview
          </Badge>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PencilSimple className="h-4 w-4" />
              Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JsonSimpleEditor
              value={jsonData}
              onChange={handleJsonChange}
              height={500}
              showToolbar={true}
            />
          </CardContent>
        </Card>

        {/* Right: Tree View */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-4 w-4" />
              Tree View
              {!isValidJson && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Invalid JSON
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isValidJson ? (
              <div className="h-[500px] overflow-auto">
                <JsonHeroViewer
                  data={parsedData}
                  showSearch={true}
                  showTypes={true}
                  showCopyButton={true}
                  expandLevel={2}
                />
              </div>
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-4 text-4xl">⚠️</div>
                <h3 className="mb-2 text-lg font-semibold">Invalid JSON</h3>
                <p className="text-muted-foreground mb-4 max-w-xs">
                  Please fix the syntax errors in the editor to see the tree view.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JsonToolComplete;
