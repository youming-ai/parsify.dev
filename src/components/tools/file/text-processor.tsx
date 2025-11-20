"use client";

import { Download, FileText, Replace, Search, Settings } from "lucide-react";
import * as React from "react";
import { FileUpload } from "@/components/file-upload/file-upload";
import { CodeEditor } from "@/components/tools/code/code-editor";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types locally
export type SearchType = "normal" | "regex" | "case-insensitive" | "whole-word";
export type TransformType = "encode" | "decode" | "normalize" | "format";

export interface TextProcessingOptions {
  // Search & Replace
  searchText: string;
  replaceText: string;
  searchType: SearchType;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;

  // Text Transformation
  transformType: TransformType;
  targetEncoding: string;
  lineEndings: "lf" | "crlf" | "cr";
  trimLines: boolean;

  // Case Conversion
  caseType: "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab";
}

export interface TextProcessingResult {
  originalText: string;
  processedText: string;
  options: TextProcessingOptions;
  stats: {
    originalLength: number;
    processedLength: number;
    linesChanged: number;
    matchesFound: number;
    replacements: number;
  };
  success: boolean;
  error?: string;
}

interface TextProcessorProps {
  value?: string;
  onChange?: (result: TextProcessingResult) => void;
  height?: number;
  className?: string;
}

const searchTypes: { value: SearchType; label: string; description: string }[] = [
  { value: "normal", label: "Normal", description: "Standard text search" },
  {
    value: "regex",
    label: "Regex",
    description: "Regular expression pattern",
  },
  {
    value: "case-insensitive",
    label: "Case Insensitive",
    description: "Ignore case differences",
  },
  {
    value: "whole-word",
    label: "Whole Word",
    description: "Match complete words only",
  },
];

const transformTypes: {
  value: TransformType;
  label: string;
  description: string;
}[] = [
  { value: "encode", label: "Encode", description: "Convert text encoding" },
  { value: "decode", label: "Decode", description: "Decode from encoding" },
  {
    value: "normalize",
    label: "Normalize",
    description: "Normalize text format",
  },
  { value: "format", label: "Format", description: "Format text structure" },
];

const encodingOptions = [
  { value: "utf-8", label: "UTF-8" },
  { value: "utf-16", label: "UTF-16" },
  { value: "ascii", label: "ASCII" },
  { value: "latin1", label: "Latin-1" },
  { value: "base64", label: "Base64" },
  { value: "url", label: "URL Encoding" },
];

const caseConversionOptions = [
  { value: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
  { value: "lower", label: "lowercase", example: "hello world" },
  { value: "title", label: "Title Case", example: "Hello World" },
  { value: "sentence", label: "Sentence case", example: "Hello world" },
  { value: "camel", label: "camelCase", example: "helloWorld" },
  { value: "pascal", label: "PascalCase", example: "HelloWorld" },
  { value: "snake", label: "snake_case", example: "hello_world" },
  { value: "kebab", label: "kebab-case", example: "hello-world" },
];

export function TextProcessor({ value, onChange, height = 400, className }: TextProcessorProps) {
  const [text, setText] = React.useState(value || "");
  const [processedText, setProcessedText] = React.useState("");
  const [options, setOptions] = React.useState<TextProcessingOptions>({
    searchText: "",
    replaceText: "",
    searchType: "normal",
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    transformType: "normalize",
    targetEncoding: "utf-8",
    lineEndings: "lf",
    trimLines: false,
    caseType: "lower",
  });
  const [result, setResult] = React.useState<TextProcessingResult | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);

  const processText = React.useCallback(() => {
    try {
      let processed = text;
      let matchesFound = 0;
      let replacements = 0;
      let linesChanged = 0;

      // Search and Replace
      if (options.searchText) {
        const searchRegex = buildSearchRegex();
        const matches = processed.match(searchRegex);
        matchesFound = matches ? matches.length : 0;

        if (options.replaceText !== undefined) {
          const replacement = options.replaceText;
          processed = processed.replace(searchRegex, replacement);
          replacements = matchesFound;
          linesChanged = processed
            .split("\n")
            .filter((line, index) => line !== text.split("\n")[index]).length;
        }
      }

      // Text Transformation
      switch (options.transformType) {
        case "encode":
          processed = encodeText(processed, options.targetEncoding);
          break;
        case "decode":
          processed = decodeText(processed, options.targetEncoding);
          break;
        case "normalize":
          processed = normalizeText(processed);
          break;
        case "format":
          processed = formatText(processed);
          break;
      }

      // Line ending normalization
      processed = normalizeLineEndings(processed, options.lineEndings);

      // Trim lines if enabled
      if (options.trimLines) {
        processed = processed
          .split("\n")
          .map((line) => line.trim())
          .join("\n");
      }

      // Case conversion
      processed = convertCase(processed, options.caseType);

      const processingResult: TextProcessingResult = {
        originalText: text,
        processedText: processed,
        options,
        stats: {
          originalLength: text.length,
          processedLength: processed.length,
          linesChanged,
          matchesFound,
          replacements,
        },
        success: true,
      };

      setResult(processingResult);
      setProcessedText(processed);
      onChange?.(processingResult);
    } catch (error) {
      const errorResult: TextProcessingResult = {
        originalText: text,
        processedText: "",
        options,
        stats: {
          originalLength: text.length,
          processedLength: 0,
          linesChanged: 0,
          matchesFound: 0,
          replacements: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
      };
      setResult(errorResult);
      onChange?.(errorResult);
    }
  }, [
    text,
    options,
    onChange,
    buildSearchRegex,
    convertCase,
    decodeText,
    encodeText,
    formatText,
    normalizeLineEndings,
    normalizeText,
  ]);

  const buildSearchRegex = (): RegExp => {
    let pattern = options.searchText;
    let flags = "";

    if (options.useRegex) {
      // Pattern is already a regex
    } else {
      // Escape special regex characters for normal search
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    if (!options.caseSensitive) {
      flags += "i";
    }

    if (options.wholeWord && !options.useRegex) {
      pattern = `\\b${pattern}\\b`;
    }

    flags += "g"; // Global for find/replace

    return new RegExp(pattern, flags);
  };

  const encodeText = (text: string, encoding: string): string => {
    switch (encoding) {
      case "base64":
        return btoa(unescape(encodeURIComponent(text)));
      case "url":
        return encodeURIComponent(text);
      default:
        // For character encodings, we'd typically use TextEncoder/TextDecoder
        // but for browser compatibility, we'll return the original text
        return text;
    }
  };

  const decodeText = (text: string, encoding: string): string => {
    try {
      switch (encoding) {
        case "base64":
          return decodeURIComponent(escape(atob(text)));
        case "url":
          return decodeURIComponent(text);
        default:
          return text;
      }
    } catch {
      return text;
    }
  };

  const normalizeText = (text: string): string => {
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\t/g, "    ") // Tabs to spaces
      .replace(/\s+/g, " ") // Multiple spaces to single
      .trim();
  };

  const formatText = (text: string): string => {
    // Basic text formatting
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n\n");
  };

  const normalizeLineEndings = (text: string, lineEndings: "lf" | "crlf" | "cr"): string => {
    switch (lineEndings) {
      case "lf":
        return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      case "crlf":
        return text
          .replace(/\r\n/g, "\n")
          .replace(/\n/g, "\r\n")
          .replace(/\r(?!\n)/g, "\r\n");
      case "cr":
        return text.replace(/\r\n/g, "\n").replace(/\n/g, "\r");
      default:
        return text;
    }
  };

  const convertCase = (text: string, caseType: string): string => {
    switch (caseType) {
      case "upper":
        return text.toUpperCase();
      case "lower":
        return text.toLowerCase();
      case "title":
        return text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
        );
      case "sentence":
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case "camel":
        return text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase(),
          )
          .replace(/\s+/g, "");
      case "pascal":
        return text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
          .replace(/\s+/g, "");
      case "snake":
        return text
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
      case "kebab":
        return text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      default:
        return text;
    }
  };

  const _handleFilesDrop = (newFiles: File[]) => {
    const textFiles = newFiles.filter(
      (file) =>
        file.type.startsWith("text/") ||
        file.name.match(/\.(txt|md|csv|json|xml|html|css|js|ts)$/i),
    );

    textFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText((prev) => (prev ? `${prev}\n\n${content}` : content));
      };
      reader.readAsText(file);
    });

    setFiles((prev) => [...prev, ...textFiles]);
  };

  // Auto-process when text or options change
  React.useEffect(() => {
    const timer = setTimeout(processText, 500);
    return () => clearTimeout(timer);
  }, [processText]);

  const updateOption = (key: keyof TextProcessingOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
              acceptedFormats={["txt", "md", "csv", "json", "xml", "html", "css", "js", "ts"]}
            />
            <CodeEditor
              language="javascript"
              value={text}
              onChange={setText}
              onLanguageChange={() => {}}
              height={height}
            />
          </CardContent>
        </Card>

        {/* Processing Options */}
        <Tabs defaultValue="search-replace" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search-replace" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search & Replace
            </TabsTrigger>
            <TabsTrigger value="transform" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Transform
            </TabsTrigger>
            <TabsTrigger value="case" className="flex items-center gap-2">
              <Replace className="h-4 w-4" />
              Case
            </TabsTrigger>
            <TabsTrigger value="format" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Format
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search-replace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search & Replace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-text">Search Text</Label>
                    <Input
                      id="search-text"
                      value={options.searchText}
                      onChange={(e) => updateOption("searchText", e.target.value)}
                      placeholder="Text to search for..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replace-text">Replace With</Label>
                    <Input
                      id="replace-text"
                      value={options.replaceText}
                      onChange={(e) => updateOption("replaceText", e.target.value)}
                      placeholder="Replacement text..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Search Type</Label>
                    <Select
                      onValueChange={(value: SearchType) => updateOption("searchType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select search type" />
                      </SelectTrigger>
                      <SelectContent>
                        {searchTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.caseSensitive}
                      onCheckedChange={(checked) => updateOption("caseSensitive", checked)}
                    />
                    <Label>Case Sensitive</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.wholeWord}
                      onCheckedChange={(checked) => updateOption("wholeWord", checked)}
                    />
                    <Label>Whole Word</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.useRegex}
                      onCheckedChange={(checked) => updateOption("useRegex", checked)}
                    />
                    <Label>Use Regex</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transform" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Text Transformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transform Type</Label>
                    <Select
                      onValueChange={(value: TransformType) => updateOption("transformType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transform type" />
                      </SelectTrigger>
                      <SelectContent>
                        {transformTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Encoding</Label>
                    <Select onValueChange={(value) => updateOption("targetEncoding", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select encoding" />
                      </SelectTrigger>
                      <SelectContent>
                        {encodingOptions.map((encoding) => (
                          <SelectItem key={encoding.value} value={encoding.value}>
                            {encoding.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Line Endings</Label>
                    <Select
                      onValueChange={(value: "lf" | "crlf" | "cr") =>
                        updateOption("lineEndings", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select line ending type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lf">LF (Unix/Linux)</SelectItem>
                        <SelectItem value="crlf">CRLF (Windows)</SelectItem>
                        <SelectItem value="cr">CR (Classic Mac)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.trimLines}
                    onCheckedChange={(checked) => updateOption("trimLines", checked)}
                  />
                  <Label>Trim Lines</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="case" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Case Conversion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Case Type</Label>
                    <Select onValueChange={(value) => updateOption("caseType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select case conversion" />
                      </SelectTrigger>
                      <SelectContent>
                        {caseConversionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.example}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="format" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Formatting Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Additional formatting options will be available here, such as indentation,
                  wrapping, and more advanced text structure modifications.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Process Button */}
        <Button onClick={processText} className="w-full">
          Process Text
        </Button>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Processed Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.success ? (
                <>
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Original Length:</span>{" "}
                      {result.stats.originalLength}
                    </div>
                    <div>
                      <span className="font-medium">Processed Length:</span>{" "}
                      {result.stats.processedLength}
                    </div>
                    <div>
                      <span className="font-medium">Matches Found:</span>{" "}
                      {result.stats.matchesFound}
                    </div>
                    <div>
                      <span className="font-medium">Replacements:</span> {result.stats.replacements}
                    </div>
                  </div>

                  <CodeEditor
                    language="javascript"
                    value={processedText}
                    onChange={setProcessedText}
                    onLanguageChange={() => {}}
                    height={height}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const blob = new Blob([processedText], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "processed.txt";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Result
                    </Button>
                    <Button variant="outline" onClick={() => setText(processedText)}>
                      Use as Input
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-red-600 text-center py-4">{result.error}</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
