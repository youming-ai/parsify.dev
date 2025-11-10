/**
 * JSON Minifier Component
 * Minify JSON files by removing whitespace and unnecessary characters
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
import { Progress } from '@/components/ui/progress';
import {
  Compress,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Zap,
  BarChart3,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';
import { validateInput } from '@/lib/validation';
import { processJSON } from '@/lib/processing';

interface MinifyResult {
  original: string;
  minified: string;
  stats: {
    originalSize: number;
    minifiedSize: number;
    compressionRatio: number;
    spaceSavings: number;
    timeSavings: number;
  };
}

export function JSONMinifier({ className }: { className?: string }) {
  const [jsonInput, setJsonInput] = useState('');
  const [minifyResult, setMinifyResult] = useState<MinifyResult | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [removeWhitespace, setRemoveWhitespace] = useState(true);
  const [removeComments, setRemoveComments] = useState(true);
  const [shortenKeys, setShortenKeys] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('json-minifier', {
      initialInput: '',
      options: { removeWhitespace, removeComments, shortenKeys }
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Validate JSON input
  const validateJSON = useCallback((text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      setValidationError('');
      return true;
    }

    const validation = validateInput('json-formatter', text);
    if (validation.isValid) {
      try {
        JSON.parse(text);
        setIsValid(true);
        setValidationError('');
        return true;
      } catch (error) {
        setIsValid(false);
        setValidationError(error instanceof Error ? error.message : 'Invalid JSON');
        return false;
      }
    } else {
      setIsValid(false);
      setValidationError(validation.errors[0]?.message || 'Invalid JSON');
      return false;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setJsonInput(value);
    validateJSON(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { text: value, options: { removeWhitespace, removeComments, shortenKeys } },
        lastActivity: new Date()
      });
    }
  }, [validateJSON, sessionId, removeWhitespace, removeComments, shortenKeys]);

  // Minify JSON
  const minifyJSON = useCallback(async () => {
    if (!jsonInput.trim() || !isValid) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      let processedInput = jsonInput;

      // Remove comments if enabled
      if (removeComments) {
        processedInput = processedInput
          .replace(/\/\/.*$/gm, '') // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
      }

      // Parse and minify
      const result = await processJSON(processedInput, 'minify', {
        shortenKeys,
        preserveWhitespace: !removeWhitespace
      });

      if (result.success) {
        const minified = result.result;
        const originalSize = jsonInput.length;
        const minifiedSize = minified.length;
        const compressionRatio = originalSize > 0 ? (minifiedSize / originalSize) : 1;
        const spaceSavings = originalSize > 0 ? ((originalSize - minifiedSize) / originalSize * 100) : 0;
        const timeSavings = Date.now() - startTime;

        const stats = {
          originalSize,
          minifiedSize,
          compressionRatio,
          spaceSavings,
          timeSavings
        };

        setMinifyResult({
          original: jsonInput,
          minified,
          stats
        });

        toast.success(`JSON minified successfully! Saved ${spaceSavings.toFixed(1)}% space`);

        if (sessionId) {
          updateSession(sessionId, {
            results: { minified, stats },
            lastActivity: new Date()
          });
          addToHistory(sessionId, 'minify', true);
        }
      } else {
        toast.error(result.error?.message || 'Failed to minify JSON');
        if (sessionId) addToHistory(sessionId, 'minify', false);
      }
    } catch (error) {
      toast.error('Failed to minify JSON');
      if (sessionId) addToHistory(sessionId, 'minify', false);
    } finally {
      setIsProcessing(false);
    }
  }, [jsonInput, isValid, removeComments, removeWhitespace, shortenKeys, sessionId]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  }, []);

  // Download minified JSON
  const downloadMinified = useCallback(() => {
    if (!minifyResult) return;

    const blob = new Blob([minifyResult.minified], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minified.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Minified JSON file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [minifyResult, sessionId]);

  // Upload JSON file
  const uploadJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      validateJSON(content);
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
  }, [validateJSON, sessionId]);

  // Load sample JSON
  const loadSample = useCallback(() => {
    const sample = `{
  "user": {
    "id": 12345,
    "name": "John Doe",
    "email": "john@example.com",
    "active": true,
    "roles": [
      "user",
      "admin"
    ],
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    },
    "stats": {
      "loginCount": 42,
      "lastLogin": "2024-01-15T10:30:00Z",
      "sessionDuration": 3600
    }
  },
  "permissions": {
    "read": true,
    "write": true,
    "delete": false
  },
  "metadata": {
    "version": "1.0.0",
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-15T10:30:00Z"
  }
}`;

    setJsonInput(sample);
    validateJSON(sample);
    toast.success('Sample JSON loaded');
  }, [validateJSON]);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Compress className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">JSON Minifier</h1>
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
            accept=\".json\"
            onChange={uploadJSON}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Original JSON */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <BarChart3 className=\"h-5 w-5 mr-2\" />
                Original JSON
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
                {minifyResult && (
                  <Badge variant=\"outline\">
                    {formatBytes(minifyResult.stats.originalSize)}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder=\"Paste your JSON here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
            {validationError && (
              <div className=\"mt-2 text-sm text-red-600 dark:text-red-400\">
                {validationError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minified JSON */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <Zap className=\"h-5 w-5 mr-2\" />
                Minified JSON
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
                {minifyResult && (
                  <Badge variant=\"outline\">
                    {formatBytes(minifyResult.stats.minifiedSize)}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {minifyResult ? (
              <div className=\"space-y-3\">
                {showPreview ? (
                  <Textarea
                    value={minifyResult.minified}
                    readOnly
                    className=\"min-h-[400px] font-mono text-sm bg-muted/50\"
                  />
                ) : (
                  <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                    Minified JSON hidden
                  </div>
                )}
              </div>
            ) : (
              <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                Minified JSON will appear here...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Minification Options */}
      <Card>
        <CardHeader>
          <CardTitle>Minification Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"basic\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-2\">
              <TabsTrigger value=\"basic\">Basic</TabsTrigger>
              <TabsTrigger value=\"advanced\">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value=\"basic\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"remove-whitespace\"
                    checked={removeWhitespace}
                    onCheckedChange={setRemoveWhitespace}
                  />
                  <Label htmlFor=\"remove-whitespace\">Remove whitespace</Label>
                </div>

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
                    id=\"shorten-keys\"
                    checked={shortenKeys}
                    onCheckedChange={setShortenKeys}
                  />
                  <Label htmlFor=\"shorten-keys\">Shorten keys (experimental)</Label>
                </div>
              </div>

              <div className=\"flex items-center space-x-4\">
                <Button
                  onClick={minifyJSON}
                  disabled={isProcessing || !isValid || !jsonInput.trim()}
                  className=\"flex items-center space-x-2\"
                >
                  <Compress className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                  <span>{isProcessing ? 'Minifying...' : 'Minify JSON'}</span>
                </Button>

                {minifyResult && (
                  <>
                    <Button
                      variant=\"outline\"
                      onClick={() => copyToClipboard(minifyResult.minified, 'Minified JSON')}
                    >
                      <Copy className=\"h-4 w-4 mr-2\" />
                      Copy
                    </Button>

                    <Button
                      variant=\"outline\"
                      onClick={downloadMinified}
                    >
                      <Download className=\"h-4 w-4 mr-2\" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value=\"advanced\" className=\"space-y-4 mt-4\">
              <div className=\"text-sm text-muted-foreground\">
                Advanced minification options coming soon:
                <ul className=\"list-disc list-inside mt-2 space-y-1\">
                  <li>Property name shortening with mapping</li>
                  <li>Value compression for repeated strings</li>
                  <li>Numeric optimization</li>
                  <li>Array compression</li>
                  <li>Custom minification rules</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Compression Statistics */}
      {minifyResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <TrendingDown className=\"h-5 w-5 mr-2\" />
              Compression Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4 mb-6\">
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {formatBytes(minifyResult.stats.originalSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Original Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {formatBytes(minifyResult.stats.minifiedSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Minified Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {minifyResult.stats.spaceSavings.toFixed(1)}%
                </div>
                <div className=\"text-sm text-muted-foreground\">Space Saved</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-orange-600\">
                  {minifyResult.stats.compressionRatio.toFixed(2)}x
                </div>
                <div className=\"text-sm text-muted-foreground\">Compression Ratio</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className=\"space-y-2\">
              <div className=\"flex justify-between text-sm\">
                <span>Compression Progress</span>
                <span>{minifyResult.stats.spaceSavings.toFixed(1)}% saved</span>
              </div>
              <Progress value={minifyResult.stats.spaceSavings} className=\"h-2\" />
            </div>

            {/* Size comparison bar */}
            <div className=\"mt-6 pt-6 border-t\">
              <div className=\"text-sm font-medium mb-3\">Size Comparison</div>
              <div className=\"relative h-8 bg-muted rounded overflow-hidden\">
                <div
                  className=\"absolute left-0 top-0 h-full bg-green-500 flex items-center justify-center text-white text-xs font-medium\"
                  style={{ width: `${minifyResult.stats.compressionRatio * 100}%` }}
                >
                  Minified
                </div>
                <div className=\"absolute right-0 top-0 h-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium pr-2\">
                  Original
                </div>
              </div>
            </div>

            {/* Additional stats */}
            <div className=\"mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-center\">
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.timeSavings}ms
                </div>
                <div className=\"text-xs text-muted-foreground\">Processing Time</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.originalSize - minifyResult.stats.minifiedSize}
                </div>
                <div className=\"text-xs text-muted-foreground\">Bytes Saved</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {(minifyResult.stats.originalSize / minifyResult.stats.minifiedSize).toFixed(1)}x
                </div>
                <div className=\"text-xs text-muted-foreground\">Smaller</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.spaceSavings > 50 ? 'Excellent' :
                   minifyResult.stats.spaceSavings > 30 ? 'Good' :
                   minifyResult.stats.spaceSavings > 10 ? 'Fair' : 'Poor'}
                </div>
                <div className=\"text-xs text-muted-foreground\">Compression Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
