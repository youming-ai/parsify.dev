'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { md5 as md5Hash } from '@/lib/crypto/hash-operations';
import { Copy, FileText, Hash, UploadSimple } from '@phosphor-icons/react';
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
  const [hashProgress, setHashProgress] = React.useState<number>(0);
  const [currentFileName, setCurrentFileName] = React.useState<string>('');

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Generate hash using Web Crypto API
  const generateHash = async (data: string, algorithm: string): Promise<string> => {
    if (algorithm === 'md5') {
      const result = await md5Hash(data);
      if (!result.success || !result.hash) {
        throw new Error(result.error || 'MD5 hash generation failed');
      }
      return result.hash;
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

  // Hash file with chunked reading for large files
  const hashFileChunked = async (
    file: File,
    algorithm: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

    if (algorithm === 'md5') {
      // spark-md5 supports incremental hashing
      const { default: SparkMD5 } = await import('spark-md5');
      const spark = new SparkMD5.ArrayBuffer();
      let offset = 0;

      while (offset < file.size) {
        const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
        spark.append(chunk);
        offset += CHUNK_SIZE;
        onProgress(Math.min((offset / file.size) * 100, 100));
      }

      return spark.end();
    }

    // For SHA-* algorithms, read entire file as ArrayBuffer
    // (crypto.subtle.digest doesn't support streaming)
    // But we still show progress during the read phase
    const buffer = await file.arrayBuffer();
    onProgress(50); // Reading done

    const webCryptoAlg = algorithm.toUpperCase().replace('-', '');
    // Map: sha1→SHA-1, sha256→SHA-256, etc.
    const algMap: Record<string, string> = {
      SHA1: 'SHA-1',
      SHA256: 'SHA-256',
      SHA384: 'SHA-384',
      SHA512: 'SHA-512',
    };
    const digestAlg = algMap[webCryptoAlg];
    if (!digestAlg) throw new Error(`Unsupported algorithm: ${algorithm}`);

    const hashBuffer = await crypto.subtle.digest(digestAlg as AlgorithmIdentifier, buffer);
    onProgress(100);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
        } catch (_error) {
          // Individual algorithm failure — skip and continue with remaining
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
        setCurrentFileName(file.name);

        for (const algorithm of selectedAlgorithms) {
          try {
            setHashProgress(0);
            const hash = await hashFileChunked(file, algorithm, setHashProgress);
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
          } catch (_error) {
            // Individual file hash failure — skip and continue
          }
        }
      }

      setResults((prev) => [...prev, ...newResults]);
      toast.success(`Generated ${newResults.length} hash(es) from ${inputFiles.length} file(s)`);
    } catch (_error) {
      toast.error('Failed to process files');
    } finally {
      setIsProcessing(false);
      setHashProgress(0);
      setCurrentFileName('');
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
                    <div key={algo.value} className="rounded bg-muted p-3">
                      <div className="font-medium">{algo.label}</div>
                      <div className="text-muted-foreground text-sm">{algo.description}</div>
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
              <UploadSimple className="h-4 w-4" />
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
                    className="min-h-[300px]"
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
                <FileUpload files={inputFiles} onFilesChange={setInputFiles} maxFiles={10} />
                {isProcessing && currentFileName && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Hashing: {currentFileName}</span>
                      <span className="font-mono text-muted-foreground">
                        {Math.round(hashProgress)}%
                      </span>
                    </div>
                    <Progress value={hashProgress} className="h-2" />
                  </div>
                )}
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
                            <span className="text-muted-foreground text-sm">{result.fileName}</span>
                            <span className="text-muted-foreground text-xs">
                              (
                              {result.fileSize !== undefined
                                ? formatFileSize(result.fileSize)
                                : 'unknown'}
                              )
                            </span>
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
                    <div className="break-all rounded bg-muted p-2 font-mono text-sm">
                      {result.hash}
                    </div>
                    <div className="text-muted-foreground text-xs">
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
                  <div className="text-muted-foreground text-sm">{algo.description}</div>
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
