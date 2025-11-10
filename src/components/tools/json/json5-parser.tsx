/**
 * JSON5 Parser Component
 * Parse and convert JSON5 files with extended JSON syntax support
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileJson,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';
import { processJSON } from '@/lib/processing';

interface JSON5ParseResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  stats?: {
    commentsRemoved: number;
    trailingCommasRemoved: number;
    properties: number;
  };
}

export function JSON5Parser({ className }: { className?: string }) {
  const [json5Input, setJson5Input] = useState('');
  const [parseResult, setParseResult] = useState<JSON5ParseResult | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [preserveWhitespace, setPreserveWhitespace] = useState(false);
  const [removeComments, setRemoveComments] = useState(true);
  const [removeTrailingCommas, setRemoveTrailingCommas] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('json5-parser', {
      initialInput: '',
      options: { preserveWhitespace, removeComments, removeTrailingCommas }
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Parse JSON5 input
  const parseJSON5 = useCallback(async (input: string): Promise<JSON5ParseResult> => {
    try {
      // Import JSON5 library dynamically
      const { default: JSON5 } = await import('json5');

      let processedInput = input;
      let warnings: string[] = [];
      let stats = {
        commentsRemoved: 0,
        trailingCommasRemoved: 0,
        properties: 0
      };

      // Pre-process input for extended features
      if (removeComments) {
        const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
        const commentMatches = input.match(commentRegex) || [];
        stats.commentsRemoved = commentMatches.length;
        processedInput = processedInput.replace(commentRegex, '');
      }

      if (removeTrailingCommas) {
        const trailingCommaRegex = /,\s*([}\]])/g;
        const commaMatches = input.match(trailingCommaRegex) || [];
        stats.trailingCommasRemoved = commaMatches.length;
        processedInput = processedInput.replace(trailingCommaRegex, '$1');
      }

      // Parse with JSON5
      const data = JSON5.parse(processedInput);

      // Count properties
      const countProperties = (obj: any): number => {
        if (obj === null || typeof obj !== 'object') return 0;
        if (Array.isArray(obj)) {
          return obj.reduce((sum, item) => sum + countProperties(item), 0);
        }
        const props = Object.keys(obj).length;
        const nested = Object.values(obj).reduce((sum, value) => sum + countProperties(value), 0);
        return props + nested;
      };
      stats.properties = countProperties(data);

      // Check for JSON5-specific features that were used
      if (input.includes('//') || input.includes('/*')) {
        warnings.push('Comments were removed during parsing');
      }

      if (input.match(/,\s*[}\]]/)) {
        warnings.push('Trailing commas were removed during parsing');
      }

      if (input.match(/'/)) {
        warnings.push('Single quotes were converted to double quotes');
      }

      if (input.match(/[\w-]+:\s*[^"'\s[{]/)) {
        warnings.push('Unquoted property keys were detected');
      }

      return {
        success: true,
        data,
        warnings: warnings.length > 0 ? warnings : undefined,
        stats
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse JSON5',
        warnings: undefined,
        stats: undefined
      };
    }
  }, [removeComments, removeTrailingCommas]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setJson5Input(value);

    if (value.trim()) {
      parseJSON5(value).then(result => {
        setParseResult(result);
        setIsValid(result.success);
        setValidationError(result.error || '');
      });
    } else {
      setParseResult(null);
      setIsValid(true);
      setValidationError('');
    }

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { text: value, options: { preserveWhitespace, removeComments, removeTrailingCommas } },
        lastActivity: new Date()
      });
    }
  }, [parseJSON5, sessionId, preserveWhitespace, removeComments, removeTrailingCommas]);

  // Convert to standard JSON
  const convertToJSON = useCallback(async () => {
    if (!parseResult?.success) return;

    setIsProcessing(true);
    try {
      const result = await processJSON(
        JSON.stringify(parseResult.data, null, preserveWhitespace ? 2 : 0),
        'format',
        { indentation: 2 }
      );

      if (result.success) {
        const formatted = result.result;

        // Copy to clipboard
        navigator.clipboard.writeText(formatted).then(() => {
          toast.success('JSON copied to clipboard');
        }).catch(() => {
          toast.error('Failed to copy to clipboard');
        });

        if (sessionId) {
          updateSession(sessionId, {
            results: { converted: formatted },
            lastActivity: new Date()
          });
          addToHistory(sessionId, 'convert-to-json', true);
        }
      } else {
        toast.error('Failed to convert to JSON');
        if (sessionId) addToHistory(sessionId, 'convert-to-json', false);
      }
    } catch (error) {
      toast.error('Failed to convert to JSON');
      if (sessionId) addToHistory(sessionId, 'convert-to-json', false);
    } finally {
      setIsProcessing(false);
    }
  }, [parseResult, preserveWhitespace, sessionId]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  }, []);

  // Download JSON file
  const downloadJSON = useCallback(() => {
    if (!parseResult?.success) return;

    const json = JSON.stringify(parseResult.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('JSON file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [parseResult, sessionId]);

  // Upload JSON5 file
  const uploadJSON5 = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJson5Input(content);
      handleInputChange(content);
      toast.success('File uploaded successfully');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { text: content, fileName: file.name },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'upload', true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      if (sessionId) addToHistory(sessionId, 'upload', false);
    };
    reader.readAsText(file);
  }, [handleInputChange, sessionId]);

  // Format JSON for display
  const formatJSON = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return JSON.stringify(obj);
    }
  };

  // Sample JSON5 content
  const loadSample = useCallback(() => {
    const sample = `{
  // This is a JSON5 file with extended syntax
  name: 'John Doe',           // Unquoted key and single quotes
  age: 30,
  active: true,

  // Trailing comma is allowed
  hobbies: [
    'reading',
    'coding',
    'gaming',
  ],

  /* Multi-line comment
     with extended content */
  address: {
    street: "123 Main St",
    city: "New York",
    zip: 10001,
  },

  // Hexadecimal and octal numbers
  id: 0x1A2B3C,
  permissions: 0755,

  // Infinity and NaN
  special: {
    infinity: Infinity,
    notANumber: NaN,
    negativeInfinity: -Infinity,
  },
}`;

    setJson5Input(sample);
    handleInputChange(sample);
    toast.success('Sample JSON5 loaded');
  }, [handleInputChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <FileJson className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">JSON5 Parser</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className=\"h-4 w-4 mr-2\" />
            Upload
          </Button>
          <input
            id=\"file-upload\"
            type=\"file\"
            accept=\".json5,.json\"
            onChange={uploadJSON5}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* JSON5 Features Info */}
      <Alert>
        <Info className=\"h-4 w-4\" />
        <AlertDescription>
          <strong>JSON5 Support:</strong> Single quotes, trailing commas, unquoted keys,
          comments (// and /* */), hexadecimal numbers, octal numbers, Infinity, NaN, and more.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* JSON5 Input */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <Code className=\"h-5 w-5 mr-2\" />
                JSON5 Input
              </div>
              <div className=\"flex items-center space-x-2\">
                {isValid ? (
                  <CheckCircle2 className=\"h-5 w-5 text-green-500\" />
                ) : (
                  <XCircle className=\"h-5 w-5 text-red-500\" />
                )}
                <Badge variant={isValid ? \"default\" : \"destructive\"}>
                  {isValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={json5Input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder=\"Paste your JSON5 content here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
            {validationError && (
              <div className=\"mt-2 text-sm text-red-600 dark:text-red-400\">
                {validationError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parsed Result */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <FileJson className=\"h-5 w-5 mr-2\" />
                Parsed JSON
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parseResult ? (
              <div className=\"space-y-3\">
                {showPreview && parseResult.success ? (
                  <pre className=\"text-sm bg-muted p-3 rounded overflow-auto max-h-80 font-mono\">
                    {formatJSON(parseResult.data)}
                  </pre>
                ) : (
                  <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                    {parseResult.success ? 'Preview hidden' : 'Parse failed'}
                  </div>
                )}

                {/* Warnings */}
                {parseResult.warnings && parseResult.warnings.length > 0 && (
                  <div className=\"space-y-2\">
                    <Label className=\"text-sm font-medium\">Warnings</Label>
                    {parseResult.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <Info className=\"h-4 w-4\" />
                        <AlertDescription className=\"text-xs\">
                          {warning}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                Parsed JSON will appear here...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"parsing\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-2\">
              <TabsTrigger value=\"parsing\">Parsing</TabsTrigger>
              <TabsTrigger value=\"output\">Output</TabsTrigger>
            </TabsList>

            <TabsContent value=\"parsing\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"remove-comments\"
                    checked={removeComments}
                    onCheckedChange={setRemoveComments}
                  />
                  <Label htmlFor=\"remove-comments\">Remove comments</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"remove-trailing-commas\"
                    checked={removeTrailingCommas}
                    onCheckedChange={setRemoveTrailingCommas}
                  />
                  <Label htmlFor=\"remove-trailing-commas\">Remove trailing commas</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"preserve-whitespace\"
                    checked={preserveWhitespace}
                    onCheckedChange={setPreserveWhitespace}
                  />
                  <Label htmlFor=\"preserve-whitespace\">Preserve whitespace</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value=\"output\" className=\"space-y-4 mt-4\">
              <div className=\"flex items-center space-x-4\">
                <Button
                  onClick={convertToJSON}
                  disabled={isProcessing || !parseResult?.success}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? 'Converting...' : 'Convert to JSON'}
                </Button>

                <Button
                  variant=\"outline\"
                  onClick={downloadJSON}
                  disabled={!parseResult?.success}
                >
                  <Download className=\"h-4 w-4 mr-2\" />
                  Download JSON
                </Button>

                {parseResult?.success && (
                  <Button
                    variant=\"outline\"
                    onClick={() => copyToClipboard(formatJSON(parseResult.data), 'JSON')}
                  >
                    <Copy className=\"h-4 w-4 mr-2\" />
                    Copy JSON
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistics */}
      {parseResult?.success && parseResult.stats && (
        <Card>
          <CardHeader>
            <CardTitle>Parse Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-center\">
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-blue-600\">{parseResult.stats.properties}</div>
                <div className=\"text-sm text-muted-foreground\">Properties</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-green-600\">{parseResult.stats.commentsRemoved}</div>
                <div className=\"text-sm text-muted-foreground\">Comments Removed</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-orange-600\">{parseResult.stats.trailingCommasRemoved}</div>
                <div className=\"text-sm text-muted-foreground\">Trailing Commas</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-purple-600\">{json5Input.length}</div>
                <div className=\"text-sm text-muted-foreground\">Input Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
