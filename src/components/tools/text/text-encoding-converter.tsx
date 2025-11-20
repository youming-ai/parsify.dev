"use client";

import { Copy, Download, FileText, RefreshCw, Upload } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export type EncodingType =
  | "utf-8"
  | "utf-16"
  | "utf-32"
  | "ascii"
  | "latin1"
  | "base64"
  | "base64url"
  | "hex"
  | "binary"
  | "url"
  | "url-strict"
  | "html-entities"
  | "html-numeric"
  | "html-hex"
  | "punycode"
  | "quoted-printable";

export interface EncodingResult {
  original: string;
  encoded: string;
  decoded: string;
  encodingType: EncodingType;
  originalEncoding: string;
  isValid: boolean;
  error?: string;
  stats: {
    originalLength: number;
    encodedLength: number;
    compressionRatio: number;
  };
}

interface TextEncodingConverterProps {
  className?: string;
}

const encodingOptions: {
  type: EncodingType;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    type: "utf-8",
    label: "UTF-8",
    description: "Unicode Transformation Format 8-bit",
    example: "Hello 世界",
  },
  {
    type: "utf-16",
    label: "UTF-16",
    description: "Unicode Transformation Format 16-bit",
    example: "Byte order mark included",
  },
  {
    type: "utf-32",
    label: "UTF-32",
    description: "Unicode Transformation Format 32-bit",
    example: "Fixed 4-byte encoding",
  },
  {
    type: "ascii",
    label: "ASCII",
    description: "American Standard Code for Information Interchange",
    example: "Hello World!",
  },
  {
    type: "latin1",
    label: "Latin-1 (ISO-8859-1)",
    description: "Western European character encoding",
    example: "Café résumé",
  },
  {
    type: "base64",
    label: "Base64",
    description: "Base64 binary-to-text encoding",
    example: "SGVsbG8gV29ybGQh",
  },
  {
    type: "base64url",
    label: "Base64 URL",
    description: "URL-safe Base64 variant",
    example: "SGVsbG8gV29ybGQh",
  },
  {
    type: "hex",
    label: "Hexadecimal",
    description: "Hexadecimal byte representation",
    example: "48656c6c6f20576f726c6421",
  },
  {
    type: "binary",
    label: "Binary",
    description: "Binary bit representation",
    example: "01001000 01100101 01101100 01101100 01101111",
  },
  {
    type: "url",
    label: "URL Encoding",
    description: "Percent encoding for URLs",
    example: "Hello%20World%21",
  },
  {
    type: "url-strict",
    label: "URL Strict Encoding",
    description: "Strict URL encoding with all special characters",
    example: "%48%65%6C%6C%6F%20%57%6F%72%6C%64%21",
  },
  {
    type: "html-entities",
    label: "HTML Entities",
    description: "HTML named character entities",
    example: "&lt;div&gt;Hello&lt;/div&gt;",
  },
  {
    type: "html-numeric",
    label: "HTML Numeric",
    description: "HTML numeric character references",
    example:
      "&#60;&#100;&#105;&#118;&#62;&#72;&#101;&#108;&#108;&#111;&#60;&#47;&#100;&#105;&#118;&#62;",
  },
  {
    type: "html-hex",
    label: "HTML Hexadecimal",
    description: "HTML hexadecimal character references",
    example:
      "&#x3C;&#x64;&#x69;&#x76;&#x3E;&#x48;&#x65;&#x6C;&#x6C;&#x6F;&#x3C;&#x2F;&#x64;&#x69;&#x76;&#x3E;",
  },
  {
    type: "punycode",
    label: "Punycode",
    description: "IDN encoding for internationalized domain names",
    example: "xn--exmple-cua.com",
  },
  {
    type: "quoted-printable",
    label: "Quoted Printable",
    description: "MIME encoding for 7-bit transport",
    example: "Hello=20World=21",
  },
];

export function TextEncodingConverter({ className }: TextEncodingConverterProps) {
  const [inputText, setInputText] = React.useState("");
  const [selectedEncoding, setSelectedEncoding] = React.useState<EncodingType>("base64");
  const [result, setResult] = React.useState<EncodingResult | null>(null);
  const [batchResults, setBatchResults] = React.useState<EncodingResult[]>([]);
  const [batchMode, setBatchMode] = React.useState(false);
  const [autoDetect, setAutoDetect] = React.useState(false);
  const [detectedEncoding, setDetectedEncoding] = React.useState<string>("");

  const detectEncoding = React.useCallback((text: string): string => {
    // Simple heuristics for encoding detection
    if (!text) return "utf-8";

    // Check for Base64
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(text) && text.length % 4 === 0) {
      return "base64";
    }

    // Check for hex
    if (/^[0-9A-Fa-f\s]*$/.test(text) && text.replace(/\s/g, "").length % 2 === 0) {
      return "hex";
    }

    // Check for binary
    if (/^[01\s]*$/.test(text)) {
      return "binary";
    }

    // Check for URL encoding
    if (/%[0-9A-Fa-f]{2}/.test(text)) {
      return "url";
    }

    // Check for HTML entities
    if (/&[a-zA-Z]+;|&#[0-9]+;|&#x[0-9A-Fa-f]+;/.test(text)) {
      return "html-entities";
    }

    // Check for quoted printable
    if (/=[0-9A-Fa-f]{2}/.test(text)) {
      return "quoted-printable";
    }

    // Default to UTF-8
    return "utf-8";
  }, []);

  const encodeText = React.useCallback((text: string, encoding: EncodingType): string => {
    try {
      switch (encoding) {
        case "base64":
          return btoa(unescape(encodeURIComponent(text)));

        case "base64url":
          return btoa(unescape(encodeURIComponent(text)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");

        case "hex":
          return Array.from(new TextEncoder().encode(text))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        case "binary":
          return Array.from(new TextEncoder().encode(text))
            .map((b) => b.toString(2).padStart(8, "0"))
            .join(" ");

        case "url":
          return encodeURIComponent(text);

        case "url-strict":
          return Array.from(text)
            .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
            .join("");

        case "html-entities":
          return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");

        case "html-numeric":
          return Array.from(text)
            .map((char) => "&#" + char.charCodeAt(0) + ";")
            .join("");

        case "html-hex":
          return Array.from(text)
            .map((char) => "&#x" + char.charCodeAt(0).toString(16).toUpperCase() + ";")
            .join("");

        case "quoted-printable":
          return Array.from(text)
            .map((char) => {
              const code = char.charCodeAt(0);
              return (code >= 33 && code <= 60) ||
                (code >= 62 && code <= 126) ||
                code === 32 ||
                code === 9
                ? char
                : "=" + code.toString(16).padStart(2, "0").toUpperCase();
            })
            .join("");

        case "punycode":
          // Simple punycode implementation for ASCII only
          return text.startsWith("xn--")
            ? text
            : "xn--" +
                btoa(text.toLowerCase())
                  .replace(/[^a-z0-9]/g, "")
                  .toLowerCase();

        default:
          // For UTF encodings, return as-is since JavaScript strings are UTF-16
          return text;
      }
    } catch (error) {
      throw new Error(
        `Encoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  const decodeText = React.useCallback((text: string, encoding: EncodingType): string => {
    try {
      switch (encoding) {
        case "base64":
          return decodeURIComponent(escape(atob(text)));

        case "base64url":
          // Add padding back
          const paddedBase64 = text + "=".repeat((4 - (text.length % 4)) % 4);
          const base64 = paddedBase64.replace(/-/g, "+").replace(/_/g, "/");
          return decodeURIComponent(escape(atob(base64)));

        case "hex":
          const cleanHex = text.replace(/\s/g, "");
          const bytes = new Uint8Array(cleanHex.length / 2);
          for (let i = 0; i < cleanHex.length; i += 2) {
            bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
          }
          return new TextDecoder().decode(bytes);

        case "binary":
          const binaryGroups = text.trim().split(/\s+/);
          const binaryBytes = new Uint8Array(binaryGroups.length);
          binaryGroups.forEach((group, index) => {
            binaryBytes[index] = parseInt(group, 2);
          });
          return new TextDecoder().decode(binaryBytes);

        case "url":
        case "url-strict":
          return decodeURIComponent(text);

        case "html-entities":
          const div = document.createElement("div");
          div.innerHTML = text;
          return div.textContent || div.innerText || "";

        case "html-numeric":
          return text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));

        case "html-hex":
          return text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) =>
            String.fromCharCode(parseInt(hex, 16)),
          );

        case "quoted-printable":
          return text.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) =>
            String.fromCharCode(parseInt(hex, 16)),
          );

        default:
          return text;
      }
    } catch (error) {
      throw new Error(
        `Decoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  const processConversion = React.useCallback(
    (text: string, encoding: EncodingType) => {
      if (!text.trim()) return null;

      try {
        const encoded = encodeText(text, encoding);
        let decoded = "";
        let isValid = true;

        try {
          decoded = decodeText(encoded, encoding);
          isValid = decoded === text;
        } catch (decodeError) {
          decoded = `Decode error: ${decodeError instanceof Error ? decodeError.message : "Unknown error"}`;
          isValid = false;
        }

        const stats = {
          originalLength: text.length,
          encodedLength: encoded.length,
          compressionRatio: encoded.length / text.length,
        };

        return {
          original: text,
          encoded,
          decoded,
          encodingType: encoding,
          originalEncoding: "utf-8",
          isValid,
          stats,
        } as EncodingResult;
      } catch (error) {
        return {
          original: text,
          encoded: "",
          decoded: "",
          encodingType: encoding,
          originalEncoding: "utf-8",
          isValid: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stats: {
            originalLength: text.length,
            encodedLength: 0,
            compressionRatio: 0,
          },
        } as EncodingResult;
      }
    },
    [encodeText, decodeText],
  );

  const handleConvert = React.useCallback(() => {
    const conversionResult = processConversion(inputText, selectedEncoding);
    setResult(conversionResult);
  }, [inputText, selectedEncoding, processConversion]);

  const handleBatchConvert = React.useCallback(() => {
    if (!inputText.trim()) return;

    const commonEncodings: EncodingType[] = [
      "base64",
      "hex",
      "url",
      "html-entities",
      "quoted-printable",
    ];

    const results = commonEncodings
      .map((encoding) => processConversion(inputText, encoding))
      .filter(Boolean) as EncodingResult[];

    setBatchResults(results);
    setBatchMode(true);
  }, [inputText, processConversion]);

  const handleAutoDetect = React.useCallback(() => {
    if (!inputText.trim()) return;

    const detected = detectEncoding(inputText);
    setDetectedEncoding(detected);
    setSelectedEncoding(detected as EncodingType);

    const conversionResult = processConversion(inputText, detected as EncodingType);
    setResult(conversionResult);
  }, [inputText, detectEncoding, processConversion]);

  const handleFileUpload = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputText(content);

        if (autoDetect) {
          const detected = detectEncoding(content);
          setDetectedEncoding(detected);
          setSelectedEncoding(detected as EncodingType);
        }
      };
      reader.readAsText(file);
    },
    [autoDetect, detectEncoding],
  );

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (error) {
        console.error("Failed to copy text: ", error);
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const downloadText = React.useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const swapInputOutput = React.useCallback(() => {
    if (result?.encoded) {
      setInputText(result.encoded);
    }
  }, [result]);

  React.useEffect(() => {
    if (autoDetect && inputText) {
      const detected = detectEncoding(inputText);
      setDetectedEncoding(detected);
    }
  }, [inputText, autoDetect, detectEncoding]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Text Encoding Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="input-text">Input Text</Label>
                <div className="flex gap-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={autoDetect}
                      onChange={(e) => setAutoDetect(e.target.checked)}
                    />
                    Auto-detect encoding
                  </label>
                  <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                    <input
                      type="file"
                      accept=".txt,.json,.xml,.html,.css,.js,.ts"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="h-4 w-4" />
                    Upload file
                  </label>
                </div>
              </div>
              <Textarea
                id="input-text"
                placeholder="Enter text to encode or decode..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[150px] font-mono"
              />
            </div>

            {autoDetect && detectedEncoding && (
              <div className="text-sm text-gray-600">
                Detected encoding: <span className="font-medium">{detectedEncoding}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConvert} disabled={!inputText.trim()}>
                Convert
              </Button>
              {autoDetect && (
                <Button onClick={handleAutoDetect} variant="outline" disabled={!inputText.trim()}>
                  Auto-detect & Convert
                </Button>
              )}
              <Button onClick={handleBatchConvert} variant="outline" disabled={!inputText.trim()}>
                Batch Convert
              </Button>
              {result && (
                <Button onClick={swapInputOutput} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Use Encoded as Input
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Encoding Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Encoding Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="common" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="common">Common</TabsTrigger>
                <TabsTrigger value="unicode">Unicode</TabsTrigger>
                <TabsTrigger value="web">Web</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <TabsContent value="common" className="space-y-4">
                <Select
                  value={selectedEncoding}
                  onValueChange={(value) => setSelectedEncoding(value as EncodingType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select encoding type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["base64", "base64url", "hex", "binary", "url"].map((type) => {
                      const option = encodingOptions.find((o) => o.type === type);
                      return (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">{option?.label}</div>
                            <div className="text-xs text-gray-500">{option?.description}</div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="unicode" className="space-y-4">
                <Select
                  value={selectedEncoding}
                  onValueChange={(value) => setSelectedEncoding(value as EncodingType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Unicode encoding" />
                  </SelectTrigger>
                  <SelectContent>
                    {["utf-8", "utf-16", "utf-32", "ascii", "latin1"].map((type) => {
                      const option = encodingOptions.find((o) => o.type === type);
                      return (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">{option?.label}</div>
                            <div className="text-xs text-gray-500">{option?.description}</div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="web" className="space-y-4">
                <Select
                  value={selectedEncoding}
                  onValueChange={(value) => setSelectedEncoding(value as EncodingType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select web encoding" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "url",
                      "url-strict",
                      "html-entities",
                      "html-numeric",
                      "html-hex",
                      "punycode",
                    ].map((type) => {
                      const option = encodingOptions.find((o) => o.type === type);
                      return (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">{option?.label}</div>
                            <div className="text-xs text-gray-500">{option?.description}</div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="other" className="space-y-4">
                <Select
                  value={selectedEncoding}
                  onValueChange={(value) => setSelectedEncoding(value as EncodingType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select other encoding" />
                  </SelectTrigger>
                  <SelectContent>
                    {["quoted-printable"].map((type) => {
                      const option = encodingOptions.find((o) => o.type === type);
                      return (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">{option?.label}</div>
                            <div className="text-xs text-gray-500">{option?.description}</div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Single Result */}
        {!batchMode && result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Encoding Result</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.encoded)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Encoded
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadText(result.encoded, `encoded.${result.encodingType}`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Encoding:</span>{" "}
                  <span className="capitalize">{result.encodingType}</span>
                </div>
                <div>
                  <span className="font-medium">Original:</span> {result.stats.originalLength} chars
                </div>
                <div>
                  <span className="font-medium">Encoded:</span> {result.stats.encodedLength} chars
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={result.isValid ? "text-green-600" : "text-red-600"}>
                    {result.isValid ? "Valid" : "Invalid"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Encoded Text</Label>
                <Textarea
                  value={result.encoded}
                  readOnly
                  className="min-h-[120px] font-mono text-sm"
                  placeholder={result.error || "Encoded output will appear here..."}
                />
              </div>

              {result.decoded && (
                <div className="space-y-2">
                  <Label>Decoded (Verification)</Label>
                  <Textarea
                    value={result.decoded}
                    readOnly
                    className="min-h-[80px] font-mono text-sm"
                  />
                  <div className="text-xs text-gray-600">
                    {result.isValid
                      ? "✓ Round-trip conversion successful"
                      : "✗ Round-trip conversion failed"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Batch Results */}
        {batchMode && batchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Conversion Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchResults.map((batchResult, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{batchResult.encodingType}</h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(batchResult.encoded)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadText(batchResult.encoded, `encoded.${batchResult.encodingType}`)
                          }
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Length:</span>{" "}
                        {batchResult.stats.encodedLength} chars
                      </div>
                      <div>
                        <span className="font-medium">Ratio:</span>{" "}
                        {batchResult.stats.compressionRatio.toFixed(2)}x
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <span className={batchResult.isValid ? "text-green-600" : "text-red-600"}>
                          {batchResult.isValid ? "Valid" : "Invalid"}
                        </span>
                      </div>
                    </div>

                    <div className="font-mono text-xs bg-gray-50 p-2 rounded max-h-20 overflow-auto">
                      {batchResult.encoded || batchResult.error}
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
