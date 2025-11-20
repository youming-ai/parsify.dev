"use client";

import { Code, Copy, FileText, Image, Upload, Zap } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/file-upload/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export interface Base64Result {
  operation: "encode" | "decode";
  inputType: "text" | "file";
  input: string;
  output: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  timestamp: Date;
}

interface Base64ConverterProps {
  onConversionComplete?: (result: Base64Result) => void;
  className?: string;
}

// Base64 examples
const base64Examples = [
  {
    name: "Simple Text",
    input: "Hello World!",
    description: "Basic text encoding example",
    encoded: "SGVsbG8gV29ybGQh",
  },
  {
    name: "JSON Data",
    input: '{"name": "John", "age": 30, "city": "New York"}',
    description: "JSON object encoding",
    encoded: "eyJuYW1lIjogIkpvaG4iLCAiYWdlIjogMzAsICJjaXR5IjogIk5ldyBZb3JrIn0=",
  },
  {
    name: "Special Characters",
    input: "Special chars: äöü ñ @#$%^&*()",
    description: "Unicode and special characters",
    encoded: "U3BlY2lhbCBjaGFyczogw6TDtsO8IMw4ICBAIyQlXiYqKCk=",
  },
];

export function Base64Converter({ onConversionComplete, className }: Base64ConverterProps) {
  const [inputText, setInputText] = React.useState("");
  const [outputText, setOutputText] = React.useState("");
  const [inputFiles, setInputFiles] = React.useState<File[]>([]);
  const [results, setResults] = React.useState<Base64Result[]>([]);
  const [activeTab, setActiveTab] = React.useState<"encode" | "decode">("encode");
  const [activeInputTab, setActiveInputTab] = React.useState<"text" | "file">("text");

  // Base64 encode text
  const encodeText = (text: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (_error) {
      throw new Error("Failed to encode text to Base64");
    }
  };

  // Base64 decode text
  const decodeText = (base64: string): string => {
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch (_error) {
      throw new Error("Invalid Base64 format or corrupted data");
    }
  };

  // Convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Convert Base64 to blob
  const _base64ToBlob = (base64: string, mimeType: string = "application/octet-stream"): Blob => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (_error) {
      throw new Error("Failed to decode Base64");
    }
  };

  // Process text encoding/decoding
  const processText = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to process");
      return;
    }

    try {
      let output: string;
      if (activeTab === "encode") {
        output = encodeText(inputText);
      } else {
        output = decodeText(inputText);
      }

      setOutputText(output);

      const result: Base64Result = {
        operation: activeTab,
        inputType: "text",
        input: inputText,
        output,
        timestamp: new Date(),
      };

      setResults((prev) => [result, ...prev].slice(0, 10));
      onConversionComplete?.(result);

      toast.success(`${activeTab === "encode" ? "Encoded" : "Decoded"} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Processing failed";
      toast.error(errorMessage);
      setOutputText("");
    }
  };

  // Process file encoding/decoding
  const processFiles = async () => {
    if (inputFiles.length === 0) {
      toast.error("Please select files to process");
      return;
    }

    for (const file of inputFiles) {
      try {
        let output: string;
        if (activeTab === "encode") {
          output = await fileToBase64(file);
        } else {
          // For decoding, we assume the file contains Base64 text
          const text = await file.text();
          output = decodeText(text.trim());
        }

        const result: Base64Result = {
          operation: activeTab,
          inputType: "file",
          input: file.name,
          output,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: new Date(),
        };

        setResults((prev) => [result, ...prev].slice(0, 10));
        onConversionComplete?.(result);

        toast.success(`${activeTab === "encode" ? "Encoded" : "Decoded"} ${file.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to process file";
        toast.error(`${file.name}: ${errorMessage}`);
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Download Base64 as file
  const downloadAsFile = (base64: string, fileName: string) => {
    try {
      const blob = new Blob([base64], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded");
    } catch (_error) {
      toast.error("Failed to download file");
    }
  };

  // Load example
  const loadExample = (example: (typeof base64Examples)[0]) => {
    setInputText(example.input);
    setActiveTab("encode");
    setActiveInputTab("text");
  };

  // Clear all
  const clearAll = () => {
    setInputText("");
    setOutputText("");
    setInputFiles([]);
  };

  // Swap input and output
  const swapInputOutput = () => {
    if (outputText) {
      setInputText(outputText);
      setOutputText("");
      setActiveTab(activeTab === "encode" ? "decode" : "encode");
    }
  };

  // Validate Base64 input
  const isValidBase64 = (str: string): boolean => {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    // Auto-process when input changes (for text)
    if (activeInputTab === "text" && inputText.trim()) {
      const timer = setTimeout(() => {
        try {
          let output: string;
          if (activeTab === "encode") {
            output = encodeText(inputText);
          } else {
            if (isValidBase64(inputText)) {
              output = decodeText(inputText);
            } else {
              setOutputText("");
              return;
            }
          }
          setOutputText(output);
        } catch {
          setOutputText("");
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setOutputText("");
    }
  }, [inputText, activeTab, activeInputTab, decodeText, encodeText, isValidBase64]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Operation Selection */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "encode" | "decode")}
        >
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Base64 Encoding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Base64 Encoding:</strong> Converts binary data into ASCII string format.
                    Commonly used for transmitting data over media designed to handle text.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decode">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Base64 Decoding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Base64 Decoding:</strong> Converts Base64 encoded strings back to
                    original data. Automatically detects and decodes valid Base64 strings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Input Selection */}
        <Tabs
          value={activeInputTab}
          onValueChange={(value) => setActiveInputTab(value as "text" | "file")}
        >
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
                <CardTitle className="flex items-center justify-between">
                  <span>{activeTab === "encode" ? "Text to Encode" : "Base64 to Decode"}</span>
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
                      activeTab === "encode"
                        ? "Enter text to encode to Base64..."
                        : "Enter Base64 string to decode..."
                    }
                    className="min-h-32 font-mono"
                  />
                  <div className="text-sm text-gray-500 mt-1">{inputText.length} characters</div>
                </div>

                {outputText && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        {activeTab === "encode" ? "Base64 Output" : "Decoded Output"}
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(outputText)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        {activeTab === "decode" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadAsFile(outputText, "decoded.txt")}
                          >
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 border rounded">
                      <div className="font-mono text-sm break-all max-h-40 overflow-y-auto">
                        {outputText}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{outputText.length} characters</div>
                  </div>
                )}

                <Button onClick={processText} className="w-full">
                  {activeTab === "encode" ? "Encode to Base64" : "Decode from Base64"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "encode" ? "Files to Encode" : "Files to Decode"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  files={inputFiles}
                  onFilesChange={setInputFiles}
                  maxFiles={10}
                  acceptedFormats={activeTab === "encode" ? ["*"] : ["txt", "base64"]}
                />
                <Button
                  onClick={processFiles}
                  disabled={inputFiles.length === 0}
                  className="w-full"
                >
                  Process {inputFiles.length} File{inputFiles.length !== 1 ? "s" : ""}
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
            <div className="grid md:grid-cols-3 gap-4">
              {base64Examples.map((example, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="font-medium mb-1">{example.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{example.description}</div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500 mb-1">Input:</div>
                    <div className="font-mono text-xs truncate">{example.input}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded mt-2">
                    <div className="text-xs text-gray-500 mb-1">Output:</div>
                    <div className="font-mono text-xs truncate">{example.encoded}</div>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {result.operation === "encode" ? "Encoded" : "Decoded"}
                        </Badge>
                        {result.inputType === "file" && (
                          <Badge variant="secondary">
                            <Image className="h-3 w-3 mr-1" />
                            File
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium truncate">{result.input}</div>
                      {result.fileSize && (
                        <div className="text-xs text-gray-500">{result.fileSize} bytes</div>
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
