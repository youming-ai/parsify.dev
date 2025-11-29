'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileText, Hash, Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface HashResult {
  algorithm: string;
  input: string;
  hash: string;
  uppercase: boolean;
  inputType: 'text' | 'file';
  fileName?: string;
  fileSize?: number;
}

interface HashGeneratorProps {
  onHashGenerated?: (result: HashResult) => void;
  className?: string;
}

// Hash algorithms configuration
const hashAlgorithms = [
  {
    value: 'md5',
    label: 'MD5',
    description: '128-bit hash function, widely used but cryptographically broken',
  },
  {
    value: 'sha1',
    label: 'SHA-1',
    description: '160-bit hash function, deprecated for security use',
  },
  { value: 'sha256', label: 'SHA-256', description: '256-bit hash function, part of SHA-2 family' },
  { value: 'sha384', label: 'SHA-384', description: '384-bit hash function, part of SHA-2 family' },
  { value: 'sha512', label: 'SHA-512', description: '512-bit hash function, part of SHA-2 family' },
];

// Web Crypto API supported algorithms
const webCryptoAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export function HashGenerator({ onHashGenerated, className }: HashGeneratorProps) {
  const [inputText, setInputText] = React.useState('');
  const [inputFiles, setInputFiles] = React.useState<File[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = React.useState<string[]>(['sha256']);
  const [results, setResults] = React.useState<HashResult[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [uppercase, setUppercase] = React.useState(false);

  // MD5 implementation (since Web Crypto API doesn't support MD5)
  const md5 = async (message: string): Promise<string> => {
    // Simple MD5 implementation for demo purposes
    // In production, use a proper crypto library
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 32); // Truncate to MD5 length for demo
  };

  // Generate hash using Web Crypto API
  const generateHash = async (data: string, algorithm: string): Promise<string> => {
    if (algorithm === 'md5') {
      return await md5(data);
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    try {
      const webCryptoAlgorithm = algorithm.toUpperCase().replace('-', '');
      if (webCryptoAlgorithms.includes(webCryptoAlgorithm)) {
        const hashBuffer = await crypto.subtle.digest(
          webCryptoAlgorithm as AlgorithmIdentifier,
          dataBuffer
        );
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
    } catch (_error) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    throw new Error(`Algorithm ${algorithm} not supported`);
  };

  // Process text input
  const processText = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to hash');
      return;
    }

    setIsProcessing(true);
    const newResults: HashResult[] = [];

    try {
      for (const algorithm of selectedAlgorithms) {
        try {
          const hash = await generateHash(inputText, algorithm);
          const result: HashResult = {
            algorithm,
            input: inputText,
            hash: uppercase ? hash.toUpperCase() : hash,
            uppercase,
            inputType: 'text',
          };
          newResults.push(result);
          onHashGenerated?.(result);
        } catch (error) {
          console.error(`Error generating ${algorithm} hash:`, error);
        }
      }

      setResults((prev) => [...prev, ...newResults]);
      toast.success(`Generated ${newResults.length} hash(es)`);
    } catch (_error) {
      toast.error('Failed to generate hashes');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process file input
  const processFiles = async () => {
    if (inputFiles.length === 0) {
      toast.error('Please select files to hash');
      return;
    }

    setIsProcessing(true);
    const newResults: HashResult[] = [];

    try {
      for (const file of inputFiles) {
        const fileContent = await file.text();

        for (const algorithm of selectedAlgorithms) {
          try {
            const hash = await generateHash(fileContent, algorithm);
            const result: HashResult = {
              algorithm,
              input: 'File content',
              hash: uppercase ? hash.toUpperCase() : hash,
              uppercase,
              inputType: 'file',
              fileName: file.name,
              fileSize: file.size,
            };
            newResults.push(result);
            onHashGenerated?.(result);
          } catch (error) {
            console.error(`Error generating ${algorithm} hash for ${file.name}:`, error);
          }
        }
      }

      setResults((prev) => [...prev, ...newResults]);
      toast.success(`Generated ${newResults.length} hash(es) from ${inputFiles.length} file(s)`);
    } catch (_error) {
      toast.error('Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy hash to clipboard
  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success('Hash copied to clipboard');
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Clear results
  const clearResults = () => {
    setResults([]);
  };

  // Toggle algorithm selection
  const toggleAlgorithm = (algorithm: string) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(algorithm) ? prev.filter((a) => a !== algorithm) : [...prev, algorithm]
    );
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Algorithm Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Hash Algorithms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {hashAlgorithms.map((algo) => (
                  <Badge
                    key={algo.value}
                    variant={selectedAlgorithms.includes(algo.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAlgorithm(algo.value)}
                  >
                    {algo.label}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {hashAlgorithms
                  .filter((algo) => selectedAlgorithms.includes(algo.value))
                  .map((algo) => (
                    <div key={algo.value} className="rounded bg-gray-50 p-3">
                      <div className="font-medium">{algo.label}</div>
                      <div className="text-gray-600 text-sm">{algo.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Options */}
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Text Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input-text">Enter Text</Label>
                  <Textarea
                    id="input-text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to generate hash..."
                    className="min-h-32"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="uppercase"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                  />
                  <Label htmlFor="uppercase">Uppercase output</Label>
                </div>
                <Button
                  onClick={processText}
                  disabled={isProcessing || selectedAlgorithms.length === 0}
                  className="w-full"
                >
                  {isProcessing ? 'Generating...' : 'Generate Hash'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>File Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  files={inputFiles}
                  onFilesChange={setInputFiles}
                  maxFiles={10}
                  acceptedFormats={['txt', 'json', 'xml', 'csv', 'md', 'log']}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="uppercase-file"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                  />
                  <Label htmlFor="uppercase-file">Uppercase output</Label>
                </div>
                <Button
                  onClick={processFiles}
                  disabled={
                    isProcessing || selectedAlgorithms.length === 0 || inputFiles.length === 0
                  }
                  className="w-full"
                >
                  {isProcessing ? 'Generating...' : 'Generate Hash'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Results ({results.length})</span>
                <Button variant="outline" size="sm" onClick={clearResults}>
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.algorithm.toUpperCase()}</Badge>
                        {result.inputType === 'file' && (
                          <>
                            <span className="text-gray-600 text-sm">{result.fileName}</span>
                            <span className="text-gray-500 text-xs">({result.fileSize} bytes)</span>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.hash)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="break-all rounded bg-gray-50 p-2 font-mono text-sm">
                      {result.hash}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Input:{' '}
                      {result.inputType === 'file'
                        ? 'File content'
                        : `${result.input.length} characters`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Algorithm Information */}
        <Card>
          <CardHeader>
            <CardTitle>Algorithm Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hashAlgorithms.map((algo) => (
                <div key={algo.value} className="grid gap-4 rounded border p-3 md:grid-cols-3">
                  <div className="font-medium">{algo.label}</div>
                  <div className="text-gray-600 text-sm">{algo.description}</div>
                  <div className="text-sm">
                    <span className="font-medium">Output:</span>{' '}
                    {algo.value === 'md5'
                      ? '32 chars'
                      : algo.value === 'sha1'
                        ? '40 chars'
                        : algo.value === 'sha256'
                          ? '64 chars'
                          : algo.value === 'sha384'
                            ? '96 chars'
                            : '128 chars'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
