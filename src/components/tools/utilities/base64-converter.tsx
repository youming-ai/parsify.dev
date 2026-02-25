'use client';

import { FileUpload } from '@/components/file-upload/file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Code, Copy, FileText, Image, Lightning, UploadSimple } from '@phosphor-icons/react';
import * as React from 'react';
import { toast } from 'sonner';

export interface Base64Result {
  operation: 'encode' | 'decode';
  inputType: 'text' | 'file';
  input: string;
  output: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  timestamp: Date;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

interface Base64ConverterProps {
  onConversionComplete?: (result: Base64Result) => void;
  className?: string;
}

// Base64 examples
const base64Examples = [
  {
    name: 'Simple Text',
    input: 'Hello World!',
    description: 'Basic text encoding example',
    encoded: 'SGVsbG8gV29ybGQh',
  },
  {
    name: 'JSON Data',
    input: '{"name": "John", "age": 30, "city": "New York"}',
    description: 'JSON object encoding',
    encoded: 'eyJuYW1lIjogIkpvaG4iLCAiYWdlIjogMzAsICJjaXR5IjogIk5ldyBZb3JrIn0=',
  },
  {
    name: 'Special Characters',
    input: 'Special chars: äöü ñ @#$%^&*()',
    description: 'Unicode and special characters',
    encoded: 'U3BlY2lhbCBjaGFyczogw6TDtsO8IMOxIEAjJCVeJiooKQ==',
  },
];

export function Base64Converter({ onConversionComplete, className }: Base64ConverterProps) {
  const [inputText, setInputText] = React.useState('');
  const [outputText, setOutputText] = React.useState('');
  const [inputFiles, setInputFiles] = React.useState<File[]>([]);
  const [results, setResults] = React.useState<Base64Result[]>([]);
  const [activeTab, setActiveTab] = React.useState<'encode' | 'decode'>('encode');
  const [activeInputTab, setActiveInputTab] = React.useState<'text' | 'file'>('text');

  // Base64 encode text
  const encodeText = React.useCallback((text: string): string => {
    try {
      const bytes = new TextEncoder().encode(text);
      return bytesToBase64(bytes);
    } catch (_error) {
      throw new Error('Failed to encode text to Base64');
    }
  }, []);

  // Base64 decode text
  const decodeText = React.useCallback((base64: string): string => {
    try {
      const bytes = base64ToBytes(base64);
      return new TextDecoder().decode(bytes);
    } catch (_error) {
      throw new Error('Invalid Base64 format or corrupted data');
    }
  }, []);

  // Convert file to Base64
  const fileToBase64 = React.useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const parts = result.split(',');
        const base64 = parts[1] ?? ''; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  // Convert Base64 to blob
  const _base64ToBlob = (base64: string, mimeType = 'application/octet-stream'): Blob => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (_error) {
      throw new Error('Failed to decode Base64');
    }
  };

  // Process text encoding/decoding
  const processText = React.useCallback(async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to process');
      return;
    }

    try {
      let output: string;
      if (activeTab === 'encode') {
        output = encodeText(inputText);
      } else {
        output = decodeText(inputText);
      }

      setOutputText(output);

      const result: Base64Result = {
        operation: activeTab,
        inputType: 'text',
        input: inputText,
        output,
        timestamp: new Date(),
      };

      setResults((prev) => [result, ...prev].slice(0, 10));
      onConversionComplete?.(result);

      toast.success(`${activeTab === 'encode' ? 'Encoded' : 'Decoded'} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      toast.error(errorMessage);
      setOutputText('');
    }
  }, [activeTab, decodeText, encodeText, inputText, onConversionComplete]);

  // Process file encoding/decoding
  const processFiles = React.useCallback(async () => {
    if (inputFiles.length === 0) {
      toast.error('Please select files to process');
      return;
    }

    for (const file of inputFiles) {
      try {
        let output: string;
        if (activeTab === 'encode') {
          output = await fileToBase64(file);
        } else {
          // For decoding, we assume the file contains Base64 text
          const text = await file.text();
          output = decodeText(text.trim());
        }

        const result: Base64Result = {
          operation: activeTab,
          inputType: 'file',
          input: file.name,
          output,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: new Date(),
        };

        setResults((prev) => [result, ...prev].slice(0, 10));
        onConversionComplete?.(result);

        toast.success(`${activeTab === 'encode' ? 'Encoded' : 'Decoded'} ${file.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
        toast.error(`${file.name}: ${errorMessage}`);
      }
    }
  }, [activeTab, decodeText, fileToBase64, inputFiles, onConversionComplete]);

  // Copy to clipboard
  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  // Download Base64 as file
  const downloadAsFile = React.useCallback((base64: string, fileName: string) => {
    try {
      const blob = new Blob([base64], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded');
    } catch (_error) {
      toast.error('Failed to download file');
    }
  }, []);

  // Load example
  const loadExample = React.useCallback((example: (typeof base64Examples)[0]) => {
    setInputText(example.input);
    setActiveTab('encode');
    setActiveInputTab('text');
  }, []);

  // Clear all
  const clearAll = React.useCallback(() => {
    setInputText('');
    setOutputText('');
    setInputFiles([]);
  }, []);

  // Swap input and output
  const swapInputOutput = React.useCallback(() => {
    if (outputText) {
      setInputText(outputText);
      setOutputText('');
      setActiveTab(activeTab === 'encode' ? 'decode' : 'encode');
    }
  }, [activeTab, outputText]);

  // Validate Base64 input
  const isValidBase64 = React.useCallback((str: string): boolean => {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }, []);

  const handleActiveTabChange = React.useCallback((value: string) => {
    setActiveTab(value as 'encode' | 'decode');
  }, []);

  const handleActiveInputTabChange = React.useCallback((value: string) => {
    setActiveInputTab(value as 'text' | 'file');
  }, []);

  const handleInputTextChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleCopyOutput = React.useCallback(() => {
    copyToClipboard(outputText);
  }, [copyToClipboard, outputText]);

  const handleDownloadDecodedOutput = React.useCallback(() => {
    downloadAsFile(outputText, 'decoded.txt');
  }, [downloadAsFile, outputText]);

  const textPlaceholder = React.useMemo(
    () =>
      activeTab === 'encode'
        ? 'Enter text to encode to Base64...'
        : 'Enter Base64 string to decode...',
    [activeTab]
  );

  const outputLabel = React.useMemo(
    () => (activeTab === 'encode' ? 'Base64 Output' : 'Decoded Output'),
    [activeTab]
  );

  React.useEffect(() => {
    // Auto-process when input changes (for text)
    if (activeInputTab === 'text' && inputText.trim()) {
      const timer = setTimeout(() => {
        try {
          let output: string;
          if (activeTab === 'encode') {
            output = encodeText(inputText);
          } else {
            if (isValidBase64(inputText)) {
              output = decodeText(inputText);
            } else {
              setOutputText('');
              return;
            }
          }
          setOutputText(output);
        } catch {
          setOutputText('');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    setOutputText('');
  }, [inputText, activeTab, activeInputTab, decodeText, encodeText, isValidBase64]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Operation Selection */}
        <Tabs value={activeTab} onValueChange={handleActiveTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Encode to Base64
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Decode from Base64
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encode" className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 mb-2">
                <Lightning className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Base64 Encoding</h3>
              </div>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Converts binary data into ASCII string format. Commonly used for transmitting data
                over media designed to handle text.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="decode">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Base64 Decoding
                </h3>
              </div>
              <p className="text-green-800 dark:text-green-200 text-sm">
                Converts Base64 encoded strings back to original data. Automatically detects and
                decodes valid Base64 strings.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Input Selection */}
        <Tabs value={activeInputTab} onValueChange={handleActiveInputTabChange}>
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
                <CardTitle className="flex items-center justify-between">
                  <span>{activeTab === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}</span>
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
                    onChange={handleInputTextChange}
                    placeholder={textPlaceholder}
                    className="min-h-[300px] font-mono"
                  />
                  <div className="mt-1 text-muted-foreground text-sm">
                    {inputText.length} characters
                  </div>
                </div>

                {outputText && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-medium text-sm">{outputLabel}</label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCopyOutput}>
                          <Copy className="mr-1 h-4 w-4" />
                          Copy
                        </Button>
                        {activeTab === 'decode' && (
                          <Button variant="ghost" size="sm" onClick={handleDownloadDecodedOutput}>
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="rounded border bg-muted p-3">
                      <div className="max-h-40 overflow-y-auto break-all font-mono text-sm">
                        {outputText}
                      </div>
                    </div>
                    <div className="mt-1 text-muted-foreground text-sm">
                      {outputText.length} characters
                    </div>
                  </div>
                )}

                <Button onClick={processText} className="w-full">
                  {activeTab === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'encode' ? 'Files to Encode' : 'Files to Decode'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  files={inputFiles}
                  onFilesChange={setInputFiles}
                  maxFiles={10}
                  acceptedFormats={activeTab === 'encode' ? ['*'] : ['txt', 'base64']}
                  uploadAriaLabel="Upload file for encoding"
                />
                <Button
                  onClick={processFiles}
                  disabled={inputFiles.length === 0}
                  className="w-full"
                >
                  Process {inputFiles.length} File{inputFiles.length !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {base64Examples.map((example, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="mb-1.5 font-medium">{example.name}</div>
                  <div className="mb-3 text-muted-foreground text-sm">{example.description}</div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="mb-1.5 text-muted-foreground text-xs font-medium">Input:</div>
                    <div className="truncate font-mono text-xs">{example.input}</div>
                  </div>
                  <div className="mt-2 rounded-md bg-muted p-3">
                    <div className="mb-1.5 text-muted-foreground text-xs font-medium">Output:</div>
                    <div className="truncate font-mono text-xs">{example.encoded}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(example)}
                    className="mt-2 w-full"
                  >
                    Load Example
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* MIME Types Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Common MIME Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="font-medium">Documents</div>
                <div>
                  <code>text/plain</code> - Plain text
                </div>
                <div>
                  <code>text/html</code> - HTML
                </div>
                <div>
                  <code>application/json</code> - JSON
                </div>
                <div>
                  <code>application/xml</code> - XML
                </div>
              </div>
              <div>
                <div className="font-medium">Images</div>
                <div>
                  <code>image/jpeg</code> - JPEG images
                </div>
                <div>
                  <code>image/png</code> - PNG images
                </div>
                <div>
                  <code>image/gif</code> - GIF images
                </div>
                <div>
                  <code>image/webp</code> - WebP images
                </div>
              </div>
              <div>
                <div className="font-medium">Other</div>
                <div>
                  <code>application/pdf</code> - PDF files
                </div>
                <div>
                  <code>application/zip</code> - ZIP archives
                </div>
                <div>
                  <code>audio/mpeg</code> - MP3 audio
                </div>
                <div>
                  <code>video/mp4</code> - MP4 video
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {result.operation === 'encode' ? 'Encoded' : 'Decoded'}
                        </Badge>
                        {result.inputType === 'file' && (
                          <Badge variant="secondary">
                            <Image className="mr-1 h-3 w-3" />
                            File
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="truncate font-medium">{result.input}</div>
                      {result.fileSize && (
                        <div className="text-muted-foreground text-xs">{result.fileSize} bytes</div>
                      )}
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
