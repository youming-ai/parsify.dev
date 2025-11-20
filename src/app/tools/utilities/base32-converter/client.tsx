"use client";

import {
  AlertTriangle,
  ArrowRightLeft,
  Binary,
  CheckCircle,
  Code,
  Copy,
  FileText,
  Hash,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ConversionResult {
  output: string;
  success: boolean;
  error?: string;
  inputLength: number;
  outputLength: number;
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_ALPHABET_HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
const BASE32_ALPHABET_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export default function Base32Client() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [alphabet, setAlphabet] = useState<"rfc4648" | "hex" | "crockford">("rfc4648");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getAlphabet = (type: string): string => {
    switch (type) {
      case "hex":
        return BASE32_ALPHABET_HEX;
      case "crockford":
        return BASE32_ALPHABET_CROCKFORD;
      default:
        return BASE32_ALPHABET;
    }
  };

  const encodeBase32 = (input: string, alphabetType: string): ConversionResult => {
    try {
      // Convert string to UTF-8 bytes
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input);

      if (bytes.length === 0) {
        return {
          output: "",
          success: true,
          inputLength: 0,
          outputLength: 0,
        };
      }

      const alphabet = getAlphabet(alphabetType);
      let result = "";
      let bits = 0;
      let value = 0;

      for (let i = 0; i < bytes.length; i++) {
        value = (value << 8) | bytes[i];
        bits += 8;

        while (bits >= 5) {
          result += alphabet[(value >>> (bits - 5)) & 0x1f];
          bits -= 5;
        }
      }

      if (bits > 0) {
        result += alphabet[(value << (5 - bits)) & 0x1f];
      }

      // Add padding
      const paddingLength = (8 - (result.length % 8)) % 8;
      result += "=".repeat(paddingLength);

      return {
        output: result,
        success: true,
        inputLength: bytes.length,
        outputLength: result.length,
      };
    } catch (error) {
      return {
        output: "",
        success: false,
        error: `Encoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        inputLength: input.length,
        outputLength: 0,
      };
    }
  };

  const decodeBase32 = (input: string, alphabetType: string): ConversionResult => {
    try {
      if (!input.trim()) {
        return {
          output: "",
          success: true,
          inputLength: 0,
          outputLength: 0,
        };
      }

      // Clean input - remove whitespace and convert to uppercase
      let cleanInput = input.toUpperCase().replace(/\s/g, "");

      // Handle Crockford's Base32 special characters
      if (alphabetType === "crockford") {
        cleanInput = cleanInput.replace(/O/g, "0").replace(/I/g, "1").replace(/L/g, "1");
      }

      // Remove padding
      cleanInput = cleanInput.replace(/=/g, "");

      const alphabet = getAlphabet(alphabetType);

      // Validate characters
      for (const char of cleanInput) {
        if (!alphabet.includes(char)) {
          return {
            output: "",
            success: false,
            error: `Invalid character '${char}' found in input`,
            inputLength: input.length,
            outputLength: 0,
          };
        }
      }

      let bits = 0;
      let value = 0;
      const _index = 0;
      const bytes: number[] = [];

      for (let i = 0; i < cleanInput.length; i++) {
        const charIndex = alphabet.indexOf(cleanInput[i]);
        value = (value << 5) | charIndex;
        bits += 5;

        if (bits >= 8) {
          bytes.push((value >>> (bits - 8)) & 0xff);
          bits -= 8;
        }
      }

      // Convert bytes to UTF-8 string
      const decoder = new TextDecoder("utf-8", { fatal: true });
      const output = decoder.decode(new Uint8Array(bytes));

      return {
        output: output,
        success: true,
        inputLength: input.length,
        outputLength: output.length,
      };
    } catch (error) {
      return {
        output: "",
        success: false,
        error: `Decoding failed: ${error instanceof Error ? error.message : "Invalid Base32 data"}`,
        inputLength: input.length,
        outputLength: 0,
      };
    }
  };

  const convert = () => {
    if (!inputText.trim()) {
      setOutputText("");
      setResult(null);
      return;
    }

    setIsProcessing(true);

    try {
      const conversionResult =
        mode === "encode" ? encodeBase32(inputText, alphabet) : decodeBase32(inputText, alphabet);

      setResult(conversionResult);
      setOutputText(conversionResult.output);
    } catch (error) {
      setResult({
        output: "",
        success: false,
        error: `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        inputLength: inputText.length,
        outputLength: 0,
      });
      setOutputText("");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const swapInOut = () => {
    setInputText(outputText);
    setOutputText(inputText);
    setMode(mode === "encode" ? "decode" : "encode");
    setResult(null);
  };

  const getAlphabetInfo = (type: string) => {
    switch (type) {
      case "hex":
        return {
          name: "Base32 Hex",
          description: "Uses hexadecimal characters (0-9, A-V)",
          alphabet: BASE32_ALPHABET_HEX,
        };
      case "crockford":
        return {
          name: "Crockford's Base32",
          description: "Optimized for human use, avoids ambiguous characters",
          alphabet: BASE32_ALPHABET_CROCKFORD,
        };
      default:
        return {
          name: "RFC 4648 Base32",
          description: "Standard Base32 encoding (A-Z, 2-7)",
          alphabet: BASE32_ALPHABET,
        };
    }
  };

  const alphabetInfo = getAlphabetInfo(alphabet);

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Base32 Converter
          </CardTitle>
          <CardDescription>Encode or decode Base32 with {alphabetInfo.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Conversion Mode</label>
              <div className="flex gap-2">
                <Button
                  variant={mode === "encode" ? "default" : "outline"}
                  onClick={() => setMode("encode")}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Encode
                </Button>
                <Button
                  variant={mode === "decode" ? "default" : "outline"}
                  onClick={() => setMode("decode")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Decode
                </Button>
                <Button
                  variant="outline"
                  onClick={swapInOut}
                  className="flex items-center gap-2"
                  disabled={!inputText && !outputText}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Swap
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alphabet Type</label>
              <Select
                value={alphabet}
                onValueChange={(value: "rfc4648" | "hex" | "crockford") => setAlphabet(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rfc4648">RFC 4648 (Standard)</SelectItem>
                  <SelectItem value="hex">Base32 Hex</SelectItem>
                  <SelectItem value="crockford">Crockford's Base32</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{alphabetInfo.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {mode === "encode" ? (
                  <FileText className="h-5 w-5" />
                ) : (
                  <Hash className="h-5 w-5" />
                )}
                {mode === "encode" ? "Input Text" : "Base32 Input"}
              </span>
              <Badge variant="secondary">
                {inputText.length} {mode === "encode" ? "chars" : "chars"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={
                mode === "encode"
                  ? "Enter text to encode to Base32..."
                  : "Enter Base32 string to decode..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-48 font-mono text-sm"
              spellCheck={false}
            />
            <Button
              onClick={convert}
              disabled={!inputText.trim() || isProcessing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Processing..." : `${mode === "encode" ? "Encode" : "Decode"} Base32`}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {mode === "encode" ? (
                  <Hash className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                {mode === "encode" ? "Base32 Output" : "Decoded Text"}
              </span>
              <Badge variant="secondary">
                {outputText.length} {mode === "encode" ? "chars" : "chars"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={
                mode === "encode"
                  ? "Base32 encoded text will appear here..."
                  : "Decoded text will appear here..."
              }
              value={outputText}
              readOnly
              className="min-h-48 font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!outputText}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results and Status */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Conversion Result
              </span>
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Success" : "Error"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{result.inputLength}</div>
                    <div className="text-sm text-muted-foreground">
                      {mode === "encode" ? "Input Chars" : "Input Chars"}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{result.outputLength}</div>
                    <div className="text-sm text-muted-foreground">
                      {mode === "encode" ? "Encoded Chars" : "Decoded Chars"}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {result.inputLength > 0
                        ? ((result.outputLength / result.inputLength) * 100).toFixed(1)
                        : "0"}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">Size Ratio</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {result.outputLength > 0
                        ? (Math.log2(32) * result.outputLength).toFixed(0)
                        : "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">Bits Used</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Binary className="h-4 w-4" />
                  <span>
                    Conversion using {alphabetInfo.name} with alphabet:
                    <code className="ml-1 px-2 py-1 bg-muted rounded text-xs">
                      {alphabetInfo.alphabet}
                    </code>
                  </span>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conversion Error:</strong> {result.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alphabet Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Alphabet Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={alphabet} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rfc4648">RFC 4648</TabsTrigger>
              <TabsTrigger value="hex">Base32 Hex</TabsTrigger>
              <TabsTrigger value="crockford">Crockford's</TabsTrigger>
            </TabsList>

            <TabsContent value="rfc4648" className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">RFC 4648 Base32</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Standard Base32 encoding using A-Z and 2-7
                </p>
                <code className="text-xs p-2 bg-muted rounded block">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
                </code>
              </div>
            </TabsContent>

            <TabsContent value="hex" className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">Base32 Hex</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Uses hexadecimal-like characters (0-9, A-V)
                </p>
                <code className="text-xs p-2 bg-muted rounded block">
                  0123456789ABCDEFGHIJKLMNOPQRSTUV
                </code>
              </div>
            </TabsContent>

            <TabsContent value="crockford" className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">Crockford's Base32</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Optimized for human use, removes ambiguous characters (O, I, L)
                </p>
                <code className="text-xs p-2 bg-muted rounded block">
                  0123456789ABCDEFGHJKMNPQRSTVWXYZ
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: O→0, I→1, L→1 for compatibility
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
