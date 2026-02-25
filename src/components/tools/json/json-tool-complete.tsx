/**
 * JSON Tool Complete Component
 * Integrated JSON tools component that combines all JSON functionality
 */

'use client';

import { useJsonWorker } from '@/hooks/use-json-worker';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { CheckCircle, Copy, FileText, Lightning, Quotes, XCircle } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

import { JsonHeroViewer } from './json-hero-viewer';
import { isSerializedJsonString, parseSerializedJson } from './json-utils';

const SIZE_THRESHOLD = 100 * 1024;

const CodeEditor = dynamic(
  () => import('../code/codemirror-editor').then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[650px] items-center justify-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
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
  showHeader = false,
}) => {
  const {
    isWorkerReady,
    parseJson: workerParseJson,
    formatJson: workerFormatJson,
    minifyJson: workerMinifyJson,
  } = useJsonWorker();
  const [jsonData, setJsonData] = useState(initialData);
  const [isValidJson, setIsValidJson] = useState(true);
  const [isSerialized, setIsSerialized] = useState(false);
  const [parsedData, setParsedData] = useState(() => {
    try {
      return JSON.parse(initialData);
    } catch {
      return {};
    }
  });

  // Check if content looks like serialized JSON
  useEffect(() => {
    try {
      setIsSerialized(isSerializedJsonString(jsonData));
    } catch {
      setIsSerialized(false);
    }
  }, [jsonData]);

  const parseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleJsonChange = useCallback(
    (newJsonData: string) => {
      setJsonData(newJsonData);

      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }

      parseTimeoutRef.current = setTimeout(async () => {
        try {
          let parsed: unknown;

          if (newJsonData.length > SIZE_THRESHOLD && isWorkerReady) {
            const workerResult = await workerParseJson(newJsonData || '{}');
            parsed = workerResult.parsedData;
          } else {
            parsed = JSON.parse(newJsonData || '{}');
          }

          setParsedData(parsed);
          setIsValidJson(true);
        } catch {
          setIsValidJson(false);
        }
      }, 250);
    },
    [isWorkerReady, workerParseJson]
  );

  useEffect(() => {
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, []);

  // Format JSON
  const formatJson = useCallback(async () => {
    try {
      const formatted =
        jsonData.length > SIZE_THRESHOLD && isWorkerReady
          ? await workerFormatJson(jsonData)
          : JSON.stringify(JSON.parse(jsonData), null, 2);

      setJsonData(formatted);
      toast.success('JSON formatted');
    } catch {
      toast.error('Cannot format invalid JSON');
    }
  }, [isWorkerReady, jsonData, workerFormatJson]);

  // Minify JSON
  const minifyJson = useCallback(async () => {
    try {
      const minified =
        jsonData.length > SIZE_THRESHOLD && isWorkerReady
          ? await workerMinifyJson(jsonData)
          : JSON.stringify(JSON.parse(jsonData));

      setJsonData(minified);
      toast.success('JSON minified');
    } catch {
      toast.error('Cannot minify invalid JSON');
    }
  }, [isWorkerReady, jsonData, workerMinifyJson]);

  // Copy JSON
  const copyJson = useCallback(() => {
    navigator.clipboard.writeText(jsonData);
    toast.success('Copied to clipboard');
  }, [jsonData]);

  // Unescape serialized JSON
  const unescapeJson = useCallback(() => {
    try {
      const parsed = parseSerializedJson(jsonData);
      setJsonData(parsed);
      toast.success('JSON unescaped');
    } catch {
      toast.error('Cannot unescape JSON');
    }
  }, [jsonData]);

  const shortcuts = useMemo(
    () => [
      {
        key: 'f',
        ctrl: true,
        shift: true,
        handler: () => {
          void formatJson();
        },
        description: 'Format JSON',
      },
      {
        key: 'm',
        ctrl: true,
        shift: true,
        handler: () => {
          void minifyJson();
        },
        description: 'Minify JSON',
      },
      {
        key: 'c',
        ctrl: true,
        shift: true,
        handler: copyJson,
        description: 'Copy JSON',
      },
    ],
    [copyJson, formatJson, minifyJson]
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className={`mx-auto w-full ${className}`}>
      {showHeader && (
        <div className="mb-4">
          <h1 className="font-bold text-2xl">JSON Tools</h1>
          <p className="text-muted-foreground text-sm">Format, validate, and explore JSON data</p>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Left: Editor */}
        <div className="rounded-lg border bg-card">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={formatJson} disabled={!isValidJson}>
                <FileText className="mr-1.5 h-4 w-4" />
                Format
                <kbd className="ml-1.5 hidden rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                  ⌘⇧F
                </kbd>
              </Button>
              <Button variant="ghost" size="sm" onClick={minifyJson} disabled={!isValidJson}>
                <Lightning className="mr-1.5 h-4 w-4" />
                Minify
                <kbd className="ml-1.5 hidden rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                  ⌘⇧M
                </kbd>
              </Button>
              {isSerialized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={unescapeJson}
                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  <Quotes className="mr-1.5 h-4 w-4" />
                  Unescape
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={copyJson}>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy
                <kbd className="ml-1.5 hidden rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                  ⌘⇧C
                </kbd>
              </Button>
            </div>
            <Badge
              variant={isValidJson ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              {isValidJson ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Valid
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Invalid
                </>
              )}
            </Badge>
          </div>
          {/* Code Editor */}
          <CodeEditor
            value={jsonData}
            onChange={handleJsonChange}
            language="json"
            height={650}
            placeholder="Enter JSON here..."
          />
        </div>

        {/* Right: Tree View */}
        <div className="rounded-lg border bg-card">
          {isValidJson ? (
            <JsonHeroViewer
              data={parsedData}
              showSearch={true}
              showTypes={true}
              showCopyButton={true}
              expandLevel={2}
              compact={true}
              scrollHeight={600}
            />
          ) : (
            <div className="flex h-[650px] flex-col items-center justify-center text-center px-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="mb-1 font-medium">Invalid JSON</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Fix the syntax errors in the editor to see the tree view
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonToolComplete;
