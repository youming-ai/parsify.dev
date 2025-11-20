import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Label } from "../../../ui/label";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  Copy,
  Download,
  Settings,
  RefreshCw,
  Zap,
  Minimize2,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced type system for JSON cleanup and minification
interface JSONCleanupOptions {
  formatting: "pretty" | "compact" | "minified" | "custom";
  indentation: "2-space" | "4-space" | "tab" | "none";
  quoteStyle: "double" | "single";
  trailingCommas: boolean;
  finalNewline: boolean;
  sortKeys: boolean;
  sortKeysOrder: "asc" | "desc" | "custom";
  escapeUnicode: boolean;
  removeComments: boolean;
  removeWhitespace: boolean;
  removeEmptyLines: boolean;
  compressNumbers: boolean;
  precision: number;
  customFormatting: JSONCustomFormatting;
  validation: ValidationOptions;
}

interface JSONCustomFormatting {
  maxLineLength: number;
  objectBreak: "always" | "never" | "if-needed";
  arrayBreak: "always" | "never" | "if-needed";
  propertySpacing: "space" | "newline" | "compact";
  bracketSpacing: "space" | "newline" | "compact";
  colonSpacing: "space" | "none";
}

interface ValidationOptions {
  enabled: boolean;
  strictMode: boolean;
  allowComments: boolean;
  allowTrailingCommas: boolean;
  allowSingleQuotes: boolean;
  repairMode: boolean;
}

interface JSONCleanupResult {
  success: boolean;
  input?: string;
  output?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  formattingStats?: FormattingStats;
  validation?: ValidationResult;
  error?: string;
  warnings: string[];
}

interface FormattingStats {
  linesRemoved: number;
  whitespaceRemoved: number;
  charactersRemoved: number;
  compressionTime: number;
  formattingTime: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  repaired: boolean;
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
  code: string;
}

interface ValidationWarning {
  message: string;
  suggestion: string;
}

const DEFAULT_CLEANUP_OPTIONS: JSONCleanupOptions = {
  formatting: "pretty",
  indentation: "2-space",
  quoteStyle: "double",
  trailingCommas: false,
  finalNewline: true,
  sortKeys: false,
  sortKeysOrder: "asc",
  escapeUnicode: false,
  removeComments: true,
  removeWhitespace: false,
  removeEmptyLines: true,
  compressNumbers: false,
  precision: 6,
  customFormatting: {
    maxLineLength: 120,
    objectBreak: "if-needed",
    arrayBreak: "if-needed",
    propertySpacing: "space",
    bracketSpacing: "newline",
    colonSpacing: "space",
  },
  validation: {
    enabled: true,
    strictMode: false,
    allowComments: false,
    allowTrailingCommas: false,
    allowSingleQuotes: false,
    repairMode: true,
  },
};

// Enhanced JSON5-like lexer for processing various JSON formats
class JSONProcessor {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private options: JSONCleanupOptions;

  constructor(input: string, options: JSONCleanupOptions) {
    this.input = input;
    this.options = options;
  }

  private peek(offset: number = 0): string | undefined {
    return this.input[this.position + offset];
  }

  private advance(): string | undefined {
    const char = this.input[this.position];
    this.position++;

    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.peek();
      if (char && /\s/.test(char)) {
        this.advance();
      } else {
        break;
      }
    }
  }

  private skipComments(): string[] {
    const comments: string[] = [];

    while (this.position < this.input.length) {
      const char = this.peek();

      if (char === "/" && this.peek(1) === "/") {
        this.advance(); // '/'
        this.advance(); // '/'
        let comment = "//";
        while (this.peek() && this.peek() !== "\n") {
          comment += this.advance();
        }
        comments.push(comment);
      } else if (char === "/" && this.peek(1) === "*") {
        this.advance(); // '/'
        this.advance(); // '*'
        let comment = "/*";
        while (this.position < this.input.length) {
          const current = this.advance();
          comment += current;
          if (current === "*" && this.peek() === "/") {
            comment += this.advance();
            break;
          }
        }
        comments.push(comment);
      } else {
        break;
      }
    }

    return comments;
  }

  private parseString(): string {
    const quote = this.peek();
    if (!quote || (quote !== '"' && quote !== "'")) {
      throw new Error("Expected string");
    }

    this.advance(); // Skip opening quote
    let result = "";
    let escape = false;

    while (this.position < this.input.length) {
      const char = this.peek();

      if (char === undefined) {
        throw new Error("Unterminated string");
      }

      if (escape) {
        escape = false;
        switch (char) {
          case "n":
            result += "\n";
            break;
          case "t":
            result += "\t";
            break;
          case "r":
            result += "\r";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "v":
            result += "\v";
            break;
          case "0":
            result += "\0";
            break;
          case "\n":
            // Skip escaped newline
            break;
          case "u":
            // Unicode escape sequence
            const hex = this.input.slice(this.position + 1, this.position + 5);
            if (hex.match(/^[0-9a-fA-F]{4}$/)) {
              result += String.fromCharCode(parseInt(hex, 16));
              this.position += 4;
            } else {
              result += char;
            }
            break;
          default:
            result += char;
            break;
        }
        this.advance();
      } else if (char === "\\") {
        escape = true;
        this.advance();
      } else if (char === quote) {
        this.advance();
        break;
      } else {
        result += char;
        this.advance();
      }
    }

    return result;
  }

  private parseNumber(): string {
    let result = "";

    // Handle sign
    if (this.peek() === "-") {
      result += this.advance();
    }

    // Handle integer part
    while (this.peek() && /[0-9]/.test(this.peek()!)) {
      result += this.advance();
    }

    // Handle decimal part
    if (this.peek() === ".") {
      result += this.advance();
      while (this.peek() && /[0-9]/.test(this.peek()!)) {
        result += this.advance();
      }
    }

    // Handle exponent
    if (this.peek() && /[eE]/.test(this.peek()!)) {
      result += this.advance();
      if (this.peek() === "+" || this.peek() === "-") {
        result += this.advance();
      }
      while (this.peek() && /[0-9]/.test(this.peek()!)) {
        result += this.advance();
      }
    }

    return result;
  }

  private parseValue(): any {
    this.skipWhitespace();

    const char = this.peek();

    if (char === undefined) {
      throw new Error("Unexpected end of input");
    }

    // Handle different quote styles
    if (char === '"' || (this.options.validation.allowSingleQuotes && char === "'")) {
      return this.parseString();
    }

    // Handle numbers
    if (char === "-" || /[0-9]/.test(char)) {
      return this.parseNumber();
    }

    // Handle booleans and null
    if (char === "t" && this.input.slice(this.position, this.position + 4) === "true") {
      this.position += 4;
      return true;
    }

    if (char === "f" && this.input.slice(this.position, this.position + 5) === "false") {
      this.position += 5;
      return false;
    }

    if (char === "n" && this.input.slice(this.position, this.position + 4) === "null") {
      this.position += 4;
      return null;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  private parseObject(): Record<string, any> {
    this.advance(); // Skip opening brace

    const obj: Record<string, any> = {};
    this.skipWhitespace();

    if (this.peek() === "}") {
      this.advance();
      return obj;
    }

    while (this.position < this.input.length) {
      this.skipWhitespace();

      // Skip comments if enabled
      if (this.options.validation.allowComments) {
        const comments = this.skipComments();
        // Comments are stored but not included in parsed result
      }

      this.skipWhitespace();

      // Parse key
      let key: string;
      if (
        this.peek() === '"' ||
        (this.options.validation.allowSingleQuotes && this.peek() === "'")
      ) {
        key = this.parseString();
      } else if (
        this.options.validation.allowComments &&
        this.peek() &&
        /[a-zA-Z_$]/.test(this.peek()!)
      ) {
        // Unquoted key
        key = "";
        while (this.peek() && /[a-zA-Z0-9_$]/.test(this.peek()!)) {
          key += this.advance();
        }
      } else {
        throw new Error("Expected object key");
      }

      this.skipWhitespace();

      // Parse colon
      if (this.peek() !== ":") {
        throw new Error("Expected colon after object key");
      }
      this.advance();

      // Parse value
      this.skipWhitespace();
      obj[key] = this.parseValue();

      this.skipWhitespace();

      // Handle comma or end
      const nextChar = this.peek();
      if (nextChar === ",") {
        this.advance();
        this.skipWhitespace();

        // Check for trailing comma
        if (this.peek() === "}") {
          if (!this.options.validation.allowTrailingCommas) {
            throw new Error("Trailing comma not allowed");
          }
          break;
        }
      } else if (nextChar === "}") {
        break;
      } else {
        throw new Error("Expected comma or closing brace");
      }
    }

    this.advance(); // Skip closing brace
    return obj;
  }

  private parseArray(): any[] {
    this.advance(); // Skip opening bracket

    const arr: any[] = [];
    this.skipWhitespace();

    if (this.peek() === "]") {
      this.advance();
      return arr;
    }

    while (this.position < this.input.length) {
      this.skipWhitespace();

      // Skip comments if enabled
      if (this.options.validation.allowComments) {
        this.skipComments();
      }

      // Parse value
      arr.push(this.parseValue());

      this.skipWhitespace();

      // Handle comma or end
      const nextChar = this.peek();
      if (nextChar === ",") {
        this.advance();
        this.skipWhitespace();

        // Check for trailing comma
        if (this.peek() === "]") {
          if (!this.options.validation.allowTrailingCommas) {
            throw new Error("Trailing comma not allowed");
          }
          break;
        }
      } else if (nextChar === "]") {
        break;
      } else {
        throw new Error("Expected comma or closing bracket");
      }
    }

    this.advance(); // Skip closing bracket
    return arr;
  }

  public parse(): any {
    this.skipWhitespace();

    const char = this.peek();
    if (char === "{") {
      return this.parseObject();
    } else if (char === "[") {
      return this.parseArray();
    } else {
      return this.parseValue();
    }
  }
}

// Enhanced JSON formatting engine
class JSONFormatter {
  private options: JSONCleanupOptions;
  private indentLevel: number = 0;

  constructor(options: JSONCleanupOptions) {
    this.options = options;
  }

  private getIndent(): string {
    switch (this.options.indentation) {
      case "2-space":
        return "  ".repeat(this.indentLevel);
      case "4-space":
        return "    ".repeat(this.indentLevel);
      case "tab":
        return "\t".repeat(this.indentLevel);
      case "none":
        return "";
      default:
        return "  ".repeat(this.indentLevel);
    }
  }

  private getStringValue(value: string): string {
    const quote = this.options.quoteStyle === "single" ? "'" : '"';
    let result = quote;

    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      const code = value.charCodeAt(i);

      switch (char) {
        case '"':
          result += this.options.quoteStyle === "double" ? '\\"' : char;
          break;
        case "'":
          result += this.options.quoteStyle === "single" ? "\\'" : char;
          break;
        case "\\":
          result += "\\\\";
          break;
        case "\b":
          result += "\\b";
          break;
        case "\f":
          result += "\\f";
          break;
        case "\n":
          result += "\\n";
          break;
        case "\r":
          result += "\\r";
          break;
        case "\t":
          result += "\\t";
          break;
        default:
          if (code < 0x20 || code > 0x7e) {
            if (this.options.escapeUnicode) {
              const hex = code.toString(16).padStart(4, "0");
              result += `\\u${hex}`;
            } else {
              result += char;
            }
          } else {
            result += char;
          }
          break;
      }
    }

    result += quote;
    return result;
  }

  private getNumberValue(value: number): string {
    if (this.options.compressNumbers && Number.isInteger(value)) {
      return value.toString();
    }

    if (this.options.precision > 0) {
      return parseFloat(value.toFixed(this.options.precision)).toString();
    }

    return value.toString();
  }

  private sortKeys(obj: Record<string, any>): Record<string, any> {
    if (!this.options.sortKeys) {
      return obj;
    }

    const keys = Object.keys(obj);
    const sortedKeys = keys.sort((a, b) => {
      if (this.options.sortKeysOrder === "desc") {
        return b.localeCompare(a);
      }
      return a.localeCompare(b);
    });

    const sorted: Record<string, any> = {};
    for (const key of sortedKeys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }

  private formatValue(value: any, compact: boolean = false): string {
    if (value === null) {
      return "null";
    }

    if (value === undefined) {
      return "undefined";
    }

    if (typeof value === "string") {
      return this.getStringValue(value);
    }

    if (typeof value === "number") {
      return this.getNumberValue(value);
    }

    if (typeof value === "boolean") {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return this.formatArray(value, compact);
    }

    if (typeof value === "object") {
      return this.formatObject(this.sortKeys(value), compact);
    }

    return String(value);
  }

  private formatArray(arr: any[], compact: boolean = false): string {
    if (arr.length === 0) {
      return "[]";
    }

    if (this.options.formatting === "minified" || compact) {
      return "[" + arr.map((item) => this.formatValue(item, true)).join(",") + "]";
    }

    const indent = this.getIndent();
    this.indentLevel++;

    const items = arr.map((item) => {
      const formatted = this.formatValue(item);
      return `${this.options.customFormatting.bracketSpacing === "newline" ? "\n" : ""}${indent}${formatted}`;
    });

    this.indentLevel--;

    const closingIndent = this.getIndent();
    const separator = this.options.customFormatting.bracketSpacing === "newline" ? ",\n" : ", ";
    const openingBracket = this.options.customFormatting.bracketSpacing === "space" ? "[ " : "[";
    const closingBracket = this.options.customFormatting.bracketSpacing === "space" ? " ]" : "]";

    return `${openingBracket}${items.join(separator)}${this.options.customFormatting.bracketSpacing === "newline" ? "\n" : ""}${closingIndent}${closingBracket}`;
  }

  private formatObject(obj: Record<string, any>, compact: boolean = false): string {
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return "{}";
    }

    if (this.options.formatting === "minified" || compact) {
      const items = keys.map((key) => {
        const formattedKey = this.getStringValue(key);
        const formattedValue = this.formatValue(obj[key], true);
        return `${formattedKey}:${this.options.customFormatting.colonSpacing === "space" ? " " : ""}${formattedValue}`;
      });

      return "{" + items.join(",") + "}";
    }

    const indent = this.getIndent();
    this.indentLevel++;

    const items = keys.map((key) => {
      const formattedKey = this.getStringValue(key);
      const formattedValue = this.formatValue(obj[key]);
      const separator = this.options.customFormatting.propertySpacing === "space" ? ": " : ":";
      const spacing = this.options.customFormatting.propertySpacing === "newline" ? "\n" : "";

      return `${spacing}${indent}${formattedKey}${separator}${formattedValue}`;
    });

    this.indentLevel--;

    const closingIndent = this.getIndent();
    const separator = items.length > 1 ? ",\n" : ",";
    const openingBracket = this.options.customFormatting.objectBreak === "always" ? "{\n" : "{";
    const closingBracket = this.options.customFormatting.objectBreak === "always" ? "\n}" : "}";

    return `${openingBracket}${items.join(separator)}\n${closingIndent}${closingBracket}`;
  }

  public format(data: any): string {
    const result = this.formatValue(data);

    if (this.options.finalNewline && !result.endsWith("\n")) {
      return result + "\n";
    }

    return result;
  }
}

// Main cleanup and formatting function
const cleanupJSON = (input: string, options: JSONCleanupOptions): JSONCleanupResult => {
  const startTime = performance.now();
  const warnings: string[] = [];

  try {
    // Pre-process input
    let processedInput = input;
    if (options.removeEmptyLines) {
      processedInput = processedInput.replace(/^\s*\n/gm, "");
    }

    // Parse with error handling and repair
    let data: any;
    let repaired = false;

    try {
      const processor = new JSONProcessor(processedInput, options);
      data = processor.parse();
    } catch (error) {
      if (options.validation.repairMode) {
        warnings.push(
          `Attempting to repair invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
        );

        // Simple repair attempts
        try {
          // Remove trailing commas
          let repairedInput = processedInput.replace(/,\s*([}\]])/g, "$1");

          // Fix quote consistency
          if (options.quoteStyle === "double") {
            repairedInput = repairedInput.replace(/'/g, '"');
          }

          data = JSON.parse(repairedInput);
          repaired = true;
          warnings.push("JSON was successfully repaired");
        } catch (repairError) {
          throw new Error(
            `Invalid JSON and repair failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      } else {
        throw error;
      }
    }

    // Format the output
    const formatter = new JSONFormatter(options);
    const formattedOutput = formatter.format(data);

    const endTime = performance.now();
    const originalSize = new Blob([input]).size;
    const compressedSize = new Blob([formattedOutput]).size;

    return {
      success: true,
      input,
      output: formattedOutput,
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0,
      formattingStats: {
        linesRemoved: input.split("\n").length - formattedOutput.split("\n").length,
        whitespaceRemoved: input.length - formattedOutput.length,
        charactersRemoved: input.length - formattedOutput.length,
        compressionTime: endTime - startTime,
        formattingTime: endTime - startTime,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        repaired,
      },
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      warnings,
    };
  }
};

// Main component props
interface JSONCleanupProps {
  jsonData?: string;
  onCleanupChange?: (result: JSONCleanupResult) => void;
  className?: string;
  readOnly?: boolean;
  showStats?: boolean;
  initialOptions?: Partial<JSONCleanupOptions>;
}

export const JSONCleanup: React.FC<JSONCleanupProps> = ({
  jsonData = "",
  onCleanupChange,
  className: propsClassName,
  readOnly = false,
  showStats = true,
  initialOptions = {},
}) => {
  const [jsonInput, setJsonInput] = useState(jsonData);
  const [options, setOptions] = useState<JSONCleanupOptions>({
    ...DEFAULT_CLEANUP_OPTIONS,
    ...initialOptions,
  });
  const [cleanupResult, setCleanupResult] = useState<JSONCleanupResult | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(true);

  // Memoized cleanup processing
  const result = useMemo(() => {
    if (!jsonInput.trim()) return null;
    return cleanupJSON(jsonInput, options);
  }, [jsonInput, options]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setJsonInput(value);
  };

  // Handle manual cleanup
  const handleCleanup = () => {
    const result = cleanupJSON(jsonInput, options);
    setCleanupResult(result);
    onCleanupChange?.(result);
  };

  // Update result when dependencies change
  useEffect(() => {
    if (isAutoProcessing) {
      setCleanupResult(result);
      onCleanupChange?.(result);
    }
  }, [result, isAutoProcessing, onCleanupChange]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      if (cleanupResult?.success && cleanupResult.output) {
        await navigator.clipboard.writeText(cleanupResult.output);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Download as .json file
  const handleDownload = () => {
    if (cleanupResult?.success && cleanupResult.output) {
      const blob = new Blob([cleanupResult.output], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cleaned.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Reset
  const handleReset = () => {
    setJsonInput("");
    setCleanupResult(null);
    setOptions(DEFAULT_CLEANUP_OPTIONS);
  };

  // Load sample JSON
  const loadSample = () => {
    const sampleJSON = `{
  /* This is a sample JSON file with various issues */
  "name" : 'John Doe', /* Single quotes */
  "age" : 30.000000,
  "email" : "john@example.com",
  "active" : true,

  /* Unsorted keys */
  "z-key" : "last",
  "a-key" : "first",

  "tags" : [
    "developer",
    "javascript", /* Trailing comma */
    "react",
  ],

  "profile" : {
    "bio" : "Software developer with\\nexperience in web applications",
    "location" : "New York",
    "website" : "https://johndoe.com",
  },

  "skills" : [
    {
      "name" : "JavaScript",
      "level" : "expert",
      "years" : 8,
    },
    {
      "name" : "React",
      "level" : "advanced",
      "years" : 5,
    },
    {
      "name" : "TypeScript",
      "level" : "intermediate",
      "years" : 3,
    },
  ],
}`;
    setJsonInput(sampleJSON);
  };

  const className = cn("w-full max-w-6xl mx-auto p-6 space-y-6", propsClassName);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                JSON Cleanup & Minification
                <Badge variant="outline">Advanced</Badge>
              </CardTitle>
              <CardDescription>
                Clean, format, and minify JSON with customizable options and validation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanup}
                disabled={!jsonInput.trim() || readOnly}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Cleanup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!cleanupResult?.success || readOnly}
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!cleanupResult?.success || readOnly}
              >
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={readOnly}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {/* Input Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json-input">JSON Input</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-process"
                    checked={isAutoProcessing}
                    onCheckedChange={setIsAutoProcessing}
                    disabled={readOnly}
                  />
                  <Label htmlFor="auto-process">Auto Process</Label>
                  <Button variant="outline" size="sm" onClick={loadSample} disabled={readOnly}>
                    Load Sample
                  </Button>
                </div>
              </div>
              <textarea
                id="json-input"
                className={cn(
                  "w-full h-64 p-3 font-mono text-sm border rounded-md resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  !cleanupResult?.success && cleanupResult && "border-red-500",
                )}
                placeholder="Paste your JSON here..."
                value={jsonInput}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={readOnly}
              />
            </div>

            {/* Cleanup Options */}
            <Tabs defaultValue="formatting" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="formatting">Formatting</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="formatting" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format-style">Format Style</Label>
                    <select
                      id="format-style"
                      className="w-full p-2 border rounded-md"
                      value={options.formatting}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          formatting: e.target.value as JSONCleanupOptions["formatting"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="pretty">Pretty</option>
                      <option value="compact">Compact</option>
                      <option value="minified">Minified</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="indentation">Indentation</Label>
                    <select
                      id="indentation"
                      className="w-full p-2 border rounded-md"
                      value={options.indentation}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          indentation: e.target.value as JSONCleanupOptions["indentation"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="2-space">2 Spaces</option>
                      <option value="4-space">4 Spaces</option>
                      <option value="tab">Tab</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quote-style">Quote Style</Label>
                    <select
                      id="quote-style"
                      className="w-full p-2 border rounded-md"
                      value={options.quoteStyle}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          quoteStyle: e.target.value as JSONCleanupOptions["quoteStyle"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="double">Double Quotes (")</option>
                      <option value="single">Single Quotes (')</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precision">Number Precision</Label>
                    <input
                      id="precision"
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={options.precision}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          precision: parseInt(e.target.value) || 6,
                        }))
                      }
                      disabled={readOnly}
                      min="0"
                      max="20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sort-keys"
                      checked={options.sortKeys}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, sortKeys: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="sort-keys">Sort Keys</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trailing-commas"
                      checked={options.trailingCommas}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, trailingCommas: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="trailing-commas">Trailing Commas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="final-newline"
                      checked={options.finalNewline}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, finalNewline: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="final-newline">Final Newline</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-comments"
                      checked={options.removeComments}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, removeComments: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="remove-comments">Remove Comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-whitespace"
                      checked={options.removeWhitespace}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, removeWhitespace: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="remove-whitespace">Remove Extra Whitespace</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-empty-lines"
                      checked={options.removeEmptyLines}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, removeEmptyLines: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="remove-empty-lines">Remove Empty Lines</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="escape-unicode"
                      checked={options.escapeUnicode}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, escapeUnicode: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="escape-unicode">Escape Unicode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="compress-numbers"
                      checked={options.compressNumbers}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, compressNumbers: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="compress-numbers">Compress Numbers</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sort-order">Sort Order</Label>
                    <select
                      id="sort-order"
                      className="w-full p-2 border rounded-md"
                      value={options.sortKeysOrder}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          sortKeysOrder: e.target.value as JSONCleanupOptions["sortKeysOrder"],
                        }))
                      }
                      disabled={readOnly || !options.sortKeys}
                    >
                      <option value="asc">Ascending (A-Z)</option>
                      <option value="desc">Descending (Z-A)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="validation-enabled"
                      checked={options.validation.enabled}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          validation: { ...prev.validation, enabled: checked },
                        }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="validation-enabled">Enable Validation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="strict-mode"
                      checked={options.validation.strictMode}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          validation: { ...prev.validation, strictMode: checked },
                        }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="strict-mode">Strict Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="repair-mode"
                      checked={options.validation.repairMode}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          validation: { ...prev.validation, repairMode: checked },
                        }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="repair-mode">Auto Repair</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-comments"
                      checked={options.validation.allowComments}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          validation: { ...prev.validation, allowComments: checked },
                        }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-comments">Allow Comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-trailing-commas"
                      checked={options.validation.allowTrailingCommas}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          validation: { ...prev.validation, allowTrailingCommas: checked },
                        }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-trailing-commas">Allow Trailing Commas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-single-quotes"
                      checked={options.validation.allowSingleQuotes}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          validation: { ...prev.validation, allowSingleQuotes: checked },
                        }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-single-quotes">Allow Single Quotes</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-line-length">Max Line Length</Label>
                    <input
                      id="max-line-length"
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={options.customFormatting.maxLineLength}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customFormatting: {
                            ...prev.customFormatting,
                            maxLineLength: parseInt(e.target.value) || 120,
                          },
                        }))
                      }
                      disabled={readOnly}
                      min="40"
                      max="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="object-break">Object Break</Label>
                    <select
                      id="object-break"
                      className="w-full p-2 border rounded-md"
                      value={options.customFormatting.objectBreak}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customFormatting: {
                            ...prev.customFormatting,
                            objectBreak: e.target.value as JSONCustomFormatting["objectBreak"],
                          },
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="always">Always</option>
                      <option value="never">Never</option>
                      <option value="if-needed">If Needed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="array-break">Array Break</Label>
                    <select
                      id="array-break"
                      className="w-full p-2 border rounded-md"
                      value={options.customFormatting.arrayBreak}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customFormatting: {
                            ...prev.customFormatting,
                            arrayBreak: e.target.value as JSONCustomFormatting["arrayBreak"],
                          },
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="always">Always</option>
                      <option value="never">Never</option>
                      <option value="if-needed">If Needed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property-spacing">Property Spacing</Label>
                    <select
                      id="property-spacing"
                      className="w-full p-2 border rounded-md"
                      value={options.customFormatting.propertySpacing}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customFormatting: {
                            ...prev.customFormatting,
                            propertySpacing: e.target
                              .value as JSONCustomFormatting["propertySpacing"],
                          },
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="space">Space</option>
                      <option value="newline">Newline</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bracket-spacing">Bracket Spacing</Label>
                    <select
                      id="bracket-spacing"
                      className="w-full p-2 border rounded-md"
                      value={options.customFormatting.bracketSpacing}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customFormatting: {
                            ...prev.customFormatting,
                            bracketSpacing: e.target
                              .value as JSONCustomFormatting["bracketSpacing"],
                          },
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="space">Space</option>
                      <option value="newline">Newline</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colon-spacing">Colon Spacing</Label>
                    <select
                      id="colon-spacing"
                      className="w-full p-2 border rounded-md"
                      value={options.customFormatting.colonSpacing}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customFormatting: {
                            ...prev.customFormatting,
                            colonSpacing: e.target.value as JSONCustomFormatting["colonSpacing"],
                          },
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="space">Space</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Results */}
            {cleanupResult && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cleanupResult.success ? (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-green-600 font-medium">Cleanup Successful</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-red-600 font-medium">Cleanup Failed</span>
                      </>
                    )}
                    {cleanupResult.warnings.length > 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        {cleanupResult.warnings.length} warning(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    {options.formatting.toUpperCase()}
                    {cleanupResult.formattingStats &&
                      `${cleanupResult.formattingStats.compressionTime.toFixed(2)}ms`}
                  </div>
                </div>

                {/* Error */}
                {!cleanupResult.success && cleanupResult.error && (
                  <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-300">{cleanupResult.error}</p>
                  </div>
                )}

                {/* Warnings */}
                {cleanupResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-yellow-600">Warnings</Label>
                    <div className="space-y-1">
                      {cleanupResult.warnings.map((warning, index) => (
                        <div
                          key={index}
                          className="text-sm text-yellow-600 p-2 border border-yellow-200 rounded-md"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                {cleanupResult.success && showStats && cleanupResult.formattingStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                    <div className="text-sm">
                      <span className="font-medium">Original:</span>{" "}
                      {cleanupResult.originalSize?.toLocaleString()} bytes
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Compressed:</span>{" "}
                      {cleanupResult.compressedSize?.toLocaleString()} bytes
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Lines:</span>{" "}
                      {cleanupResult.formattingStats.linesRemoved} removed
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Ratio:</span>{" "}
                      {((cleanupResult.compressionRatio || 0) * 100).toFixed(1)}% change
                    </div>
                  </div>
                )}

                {/* Output */}
                {cleanupResult.success && cleanupResult.output && (
                  <div className="space-y-2">
                    <Label>Cleaned JSON Output</Label>
                    <ScrollArea className="h-96 w-full border rounded-md">
                      <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                        <code>{cleanupResult.output}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JSONCleanup;
