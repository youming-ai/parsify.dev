'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Globe, Link, Link2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface URLResult {
  operation: 'encode' | 'decode';
  input: string;
  output: string;
  encodingType: 'full' | 'component' | 'path';
  timestamp: Date;
}

interface URLEncoderProps {
  onProcessingComplete?: (result: URLResult) => void;
  className?: string;
}

// URL encoding examples
const urlExamples = [
  {
    name: 'Special Characters',
    input: 'Hello World! How are you? @#$%^&*()',
    description: 'Contains spaces and special characters',
  },
  {
    name: 'Query Parameters',
    input: 'https://example.com/search?q=nodejs tutorials&lang=en&page=1',
    description: 'URL with query parameters',
  },
  {
    name: 'Unicode Characters',
    input: 'https://example.com/search?q=你好世界&emoji=🚀🔥',
    description: 'URL with Unicode characters',
  },
  {
    name: 'File Path',
    input: '/path/to/file with spaces/document.pdf',
    description: 'File path with spaces',
  },
];

export function URLEncoder({ onProcessingComplete, className }: URLEncoderProps) {
  const [inputText, setInputText] = React.useState('');
  const [outputText, setOutputText] = React.useState('');
  const [encodingType, setEncodingType] = React.useState<'full' | 'component' | 'path'>('full');
  const [results, setResults] = React.useState<URLResult[]>([]);
  const [activeTab, setActiveTab] = React.useState<'encode' | 'decode'>('encode');

  // URL Encode function
  const encodeURL = (text: string, type: 'full' | 'component' | 'path'): string => {
    try {
      switch (type) {
        case 'full':
          return encodeURIComponent(text);
        case 'component':
          // For component encoding, encode individual parts
          return text
            .split('/')
            .map((part) => encodeURIComponent(part))
            .join('/');
        case 'path':
          // For path encoding, preserve slashes but encode other characters
          return text
            .split('/')
            .map((part) => (part === '' ? '' : encodeURIComponent(part)))
            .join('/');
        default:
          return encodeURIComponent(text);
      }
    } catch (_error) {
      throw new Error('Failed to encode URL');
    }
  };

  // URL Decode function
  const decodeURL = (text: string): string => {
    try {
      return decodeURIComponent(text);
    } catch (_error) {
      // Try fallback decoding
      try {
        return unescape(text);
      } catch {
        throw new Error('Failed to decode URL. The input may be malformed.');
      }
    }
  };

  // Process encoding/decoding
  const processText = () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to process');
      return;
    }

    try {
      let output: string;
      if (activeTab === 'encode') {
        output = encodeURL(inputText, encodingType);
      } else {
        output = decodeURL(inputText);
      }

      setOutputText(output);

      const result: URLResult = {
        operation: activeTab,
        input: inputText,
        output,
        encodingType: activeTab === 'encode' ? encodingType : 'full',
        timestamp: new Date(),
      };

      setResults((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 results
      onProcessingComplete?.(result);

      toast.success(`${activeTab === 'encode' ? 'Encoded' : 'Decoded'} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      toast.error(errorMessage);
      setOutputText('');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Load example
  const loadExample = (example: (typeof urlExamples)[0]) => {
    setInputText(example.input);
    setActiveTab('encode');
  };

  // Clear all
  const clearAll = () => {
    setInputText('');
    setOutputText('');
  };

  // Swap input and output
  const swapInputOutput = () => {
    if (outputText) {
      setInputText(outputText);
      setOutputText('');
      setActiveTab(activeTab === 'encode' ? 'decode' : 'encode');
    }
  };

  React.useEffect(() => {
    // Auto-process when input changes
    if (inputText.trim()) {
      const timer = setTimeout(() => {
        try {
          let output: string;
          if (activeTab === 'encode') {
            output = encodeURL(inputText, encodingType);
          } else {
            output = decodeURL(inputText);
          }
          setOutputText(output);
        } catch {
          setOutputText('');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    setOutputText('');
  }, [inputText, encodingType, activeTab, decodeURL, encodeURL]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Operation Selection */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'encode' | 'decode')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Encode
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Decode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  URL Encoding Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Encoding Type</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div
                        className={`cursor-pointer rounded border p-3 ${
                          encodingType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setEncodingType('full')}
                      >
                        <div className="font-medium">Full URL Encoding</div>
                        <div className="text-gray-600 text-sm">
                          Encodes all special characters including /, :, ?, #
                        </div>
                      </div>
                      <div
                        className={`cursor-pointer rounded border p-3 ${
                          encodingType === 'component'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                        onClick={() => setEncodingType('component')}
                      >
                        <div className="font-medium">Component Encoding</div>
                        <div className="text-gray-600 text-sm">
                          Encodes URL components separately
                        </div>
                      </div>
                      <div
                        className={`cursor-pointer rounded border p-3 ${
                          encodingType === 'path' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setEncodingType('path')}
                      >
                        <div className="font-medium">Path Encoding</div>
                        <div className="text-gray-600 text-sm">
                          Preserves slashes, encodes other characters
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decode">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  URL Decoding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded border border-blue-200 bg-blue-50 p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Decoding will automatically detect and decode URL-encoded
                    characters including spaces (%20), special characters, and Unicode characters.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Input/Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{activeTab === 'encode' ? 'Input Text' : 'URL to Decode'}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={swapInputOutput}>
                  Swap ↔
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeTab === 'encode'
                    ? 'Enter text to encode or a URL to process...'
                    : 'Enter URL-encoded text to decode...'
                }
                className="min-h-32 font-mono"
              />
              <div className="mt-1 text-gray-500 text-sm">{inputText.length} characters</div>
            </div>

            {outputText && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-medium text-sm">
                    {activeTab === 'encode' ? 'Encoded Output' : 'Decoded Output'}
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(outputText)}>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="rounded border bg-gray-50 p-3">
                  <div className="break-all font-mono text-sm">{outputText}</div>
                </div>
                <div className="mt-1 text-gray-500 text-sm">{outputText.length} characters</div>
              </div>
            )}

            <Button onClick={processText} className="w-full">
              {activeTab === 'encode' ? 'Encode URL' : 'Decode URL'}
            </Button>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {urlExamples.map((example, index) => (
                <div key={index} className="rounded border p-3">
                  <div className="mb-1 font-medium">{example.name}</div>
                  <div className="mb-2 text-gray-600 text-sm">{example.description}</div>
                  <Button variant="outline" size="sm" onClick={() => loadExample(example)}>
                    Load Example
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Character Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Common URL Encoded Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <div className="font-medium">Spaces & Special</div>
                <div>
                  <code className="bg-gray-100 px-1">Space:</code> <code>%20</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">!:</code> <code>%21</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">?:</code> <code>%3F</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">=:</code> <code>%3D</code>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Symbols</div>
                <div>
                  <code className="bg-gray-100 px-1">:</code> <code>%3A</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">/:</code> <code>%2F</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">#:</code> <code>%23</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">[</code> <code>%5B</code>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Unicode</div>
                <div>
                  <code className="bg-gray-100 px-1">©:</code> <code>%C2%A9</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">®:</code> <code>%C2%AE</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">€:</code> <code>%E2%82%AC</code>
                </div>
                <div>
                  <code className="bg-gray-100 px-1">你:</code> <code>%E4%BD%A0</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="rounded border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="outline">
                        {result.operation === 'encode' ? 'Encoded' : 'Decoded'}
                      </Badge>
                      <span className="text-gray-500 text-xs">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="truncate font-mono">{result.input}</div>
                      <div className="text-gray-500">↓</div>
                      <div className="truncate font-mono">{result.output}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
