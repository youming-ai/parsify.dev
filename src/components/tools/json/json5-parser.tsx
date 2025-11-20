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
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced type system for JSON5 parsing
interface JSON5ParseOptions {
  allowComments: boolean;
  allowTrailingCommas: boolean;
  allowSingleQuotes: boolean;
  allowUnquotedKeys: boolean;
  allowMultilineStrings: boolean;
  allowHexadecimalNumbers: boolean;
  allowBinaryOctalNumbers: boolean;
  allowExtraCommas: boolean;
  preserveWhitespace: boolean;
  preserveComments: boolean;
  strictMode: boolean;
  reviver?: (key: string, value: any) => any;
}

interface JSON5ParseResult {
  success: boolean;
  data?: any;
  error?: string;
  line?: number;
  column?: number;
  warnings: string[];
  metadata: JSON5Metadata;
}

interface JSON5Metadata {
  originalText: string;
  hasComments: boolean;
  hasTrailingCommas: boolean;
  hasSingleQuotes: boolean;
  hasUnquotedKeys: boolean;
  hasMultilineStrings: boolean;
  hasHexNumbers: boolean;
  parseTime: number;
  size: number;
}

interface JSON5Token {
  type:
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "colon"
    | "comma"
    | "brace"
    | "bracket"
    | "comment"
    | "whitespace";
  value: string;
  position: { line: number; column: number; index: number };
}

const DEFAULT_JSON5_OPTIONS: JSON5ParseOptions = {
  allowComments: true,
  allowTrailingCommas: true,
  allowSingleQuotes: true,
  allowUnquotedKeys: true,
  allowMultilineStrings: true,
  allowHexadecimalNumbers: true,
  allowBinaryOctalNumbers: true,
  allowExtraCommas: false,
  preserveWhitespace: false,
  preserveComments: false,
  strictMode: false,
};

// Enhanced JSON5 lexer with full support
class JSON5Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: JSON5Token[] = [];
  private options: JSON5ParseOptions;

  constructor(input: string, options: JSON5ParseOptions = DEFAULT_JSON5_OPTIONS) {
    this.input = input;
    this.options = options;
  }

  private createToken(type: JSON5Token["type"], value: string): JSON5Token {
    return {
      type,
      value,
      position: { line: this.line, column: this.column, index: this.position },
    };
  }

  private advance(): string | undefined {
    if (this.position >= this.input.length) {
      return undefined;
    }

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

  private peek(offset: number = 0): string | undefined {
    const index = this.position + offset;
    return index < this.input.length ? this.input[index] : undefined;
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

  private parseString(quoteChar: string = '"'): string {
    let result = "";
    let escape = false;

    this.advance(); // Skip opening quote

    while (this.position < this.input.length) {
      const char = this.peek();

      if (char === undefined) {
        throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
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
            // Skip escaped newline for multiline strings
            break;
          default:
            result += char;
            break;
        }
        this.advance();
      } else if (char === "\\") {
        escape = true;
        this.advance();
      } else if (char === quoteChar) {
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

    // Handle hexadecimal numbers
    if (this.peek() === "0" && this.peek(1)?.toLowerCase() === "x") {
      result = this.advance() + this.advance(); // '0x'
      while (this.position < this.input.length) {
        const char = this.peek();
        if (char && /[0-9a-fA-F]/.test(char)) {
          result += this.advance();
        } else {
          break;
        }
      }
      return result;
    }

    // Handle binary numbers
    if (this.peek() === "0" && this.peek(1) === "b") {
      result = this.advance() + this.advance(); // '0b'
      while (this.position < this.input.length) {
        const char = this.peek();
        if (char && /[01]/.test(char)) {
          result += this.advance();
        } else {
          break;
        }
      }
      return result;
    }

    // Handle octal numbers
    if (this.peek() === "0" && this.peek(1)?.match(/[0-7]/)) {
      result = this.advance();
      while (this.position < this.input.length) {
        const char = this.peek();
        if (char && /[0-7]/.test(char)) {
          result += this.advance();
        } else {
          break;
        }
      }
      return result;
    }

    // Handle decimal numbers
    while (this.position < this.input.length) {
      const char = this.peek();
      if (char && /[0-9.eE+-]/.test(char)) {
        result += this.advance();
      } else {
        break;
      }
    }

    return result;
  }

  private parseIdentifier(): string {
    let result = "";

    while (this.position < this.input.length) {
      const char = this.peek();
      if (char && /[a-zA-Z_$][a-zA-Z0-9_$]*/.test(char)) {
        result += this.advance();
      } else {
        break;
      }
    }

    return result;
  }

  private parseComment(): string {
    let result = "";
    const char = this.peek();

    if (char === "/") {
      const next = this.peek(1);
      if (next === "/") {
        result += this.advance() + this.advance(); // '//'
        while (this.position < this.input.length && this.peek() !== "\n") {
          result += this.advance();
        }
      } else if (next === "*") {
        result += this.advance() + this.advance(); // '/*'
        while (this.position < this.input.length) {
          if (this.peek() === "*" && this.peek(1) === "/") {
            result += this.advance() + this.advance();
            break;
          }
          result += this.advance();
        }
      }
    }

    return result;
  }

  tokenize(): JSON5Token[] {
    this.tokens = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) break;

      const char = this.peek();
      if (!char) break;

      // Comments
      if (this.options.allowComments && char === "/") {
        const comment = this.parseComment();
        if (comment) {
          this.tokens.push(this.createToken("comment", comment));
          continue;
        }
      }

      // Strings
      if (char === '"' || (this.options.allowSingleQuotes && char === "'")) {
        const string = this.parseString(char);
        this.tokens.push(this.createToken("string", string));
        continue;
      }

      // Numbers
      if (/[0-9-]/.test(char)) {
        const number = this.parseNumber();
        this.tokens.push(this.createToken("number", number));
        continue;
      }

      // Identifiers (for unquoted keys and boolean/null values)
      if (/[a-zA-Z_$]/.test(char)) {
        const identifier = this.parseIdentifier();

        // Check for known keywords
        if (identifier === "true" || identifier === "false") {
          this.tokens.push(this.createToken("boolean", identifier));
        } else if (identifier === "null") {
          this.tokens.push(this.createToken("null", identifier));
        } else {
          this.tokens.push(this.createToken("string", identifier));
        }
        continue;
      }

      // Punctuation
      switch (char) {
        case ":":
          this.tokens.push(this.createToken("colon", this.advance()!));
          break;
        case ",":
          this.tokens.push(this.createToken("comma", this.advance()!));
          break;
        case "{":
        case "}":
        case "[":
        case "]":
          this.tokens.push(this.createToken("brace", this.advance()!));
          break;
        default:
          // Skip unknown characters in non-strict mode
          if (this.options.strictMode) {
            throw new Error(
              `Unexpected character '${char}' at line ${this.line}, column ${this.column}`,
            );
          }
          this.advance();
          break;
      }
    }

    return this.tokens;
  }
}

// Enhanced JSON5 parser
class JSON5Parser {
  private tokens: JSON5Token[];
  private position: number = 0;
  private options: JSON5ParseOptions;
  private warnings: string[] = [];

  constructor(tokens: JSON5Token[], options: JSON5ParseOptions = DEFAULT_JSON5_OPTIONS) {
    this.tokens = tokens;
    this.options = options;
  }

  private currentToken(): JSON5Token | undefined {
    return this.tokens[this.position];
  }

  private nextToken(): JSON5Token | undefined {
    return this.tokens[++this.position];
  }

  private peekToken(offset: number = 1): JSON5Token | undefined {
    return this.tokens[this.position + offset];
  }

  private consume(expectedType?: JSON5Token["type"]): JSON5Token | undefined {
    const token = this.currentToken();
    if (token && (!expectedType || token.type === expectedType)) {
      this.position++;
      return token;
    }
    return undefined;
  }

  private parseValue(): any {
    const token = this.currentToken();
    if (!token) {
      throw new Error("Unexpected end of input");
    }

    switch (token.type) {
      case "string":
        return this.consume("string")?.value;
      case "number":
        return this.parseNumber();
      case "boolean":
        return this.consume("boolean")?.value === "true";
      case "null":
        this.consume("null");
        return null;
      case "brace":
        return this.parseObject();
      case "bracket":
        return this.parseArray();
      default:
        throw new Error(`Unexpected token type: ${token.type}`);
    }
  }

  private parseNumber(): number {
    const token = this.consume("number");
    if (!token) throw new Error("Expected number token");

    const value = token.value;

    // Handle hexadecimal
    if (value.startsWith("0x") || value.startsWith("0X")) {
      return parseInt(value.slice(2), 16);
    }

    // Handle binary
    if (value.startsWith("0b") || value.startsWith("0B")) {
      return parseInt(value.slice(2), 2);
    }

    // Handle octal
    if (
      value.startsWith("0") &&
      value.length > 1 &&
      !value.includes(".") &&
      !value.includes("e") &&
      !value.includes("E")
    ) {
      if (this.options.allowBinaryOctalNumbers) {
        return parseInt(value, 8);
      }
      this.warnings.push(`Octal literal ${value} is deprecated`);
    }

    return parseFloat(value);
  }

  private parseObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    const startToken = this.consume("brace");
    if (!startToken) throw new Error("Expected opening brace");

    if (this.currentToken()?.value === "}") {
      this.consume("brace");
      return obj;
    }

    while (true) {
      // Parse key
      let keyToken = this.currentToken();
      if (!keyToken) throw new Error("Unexpected end of object");

      let key: string;

      if (keyToken.type === "string") {
        key = this.consume("string")?.value || "";
      } else if (
        this.options.allowUnquotedKeys &&
        keyToken.type === "string" &&
        !keyToken.value.startsWith('"')
      ) {
        key = keyToken.value;
        this.position++;
      } else {
        throw new Error("Expected object key");
      }

      // Parse colon
      if (!this.consume("colon")) {
        throw new Error("Expected colon after object key");
      }

      // Parse value
      obj[key] = this.parseValue();

      // Check for comma
      const commaToken = this.currentToken();
      if (commaToken?.type === "comma") {
        this.consume("comma");

        // Check for trailing comma
        const nextToken = this.currentToken();
        if (nextToken?.value === "}" || nextToken?.value === "]") {
          if (!this.options.allowTrailingCommas) {
            throw new Error("Trailing commas are not allowed");
          }
          break;
        }
      } else {
        break;
      }
    }

    if (!this.consume("brace")?.value.includes("}")) {
      throw new Error("Expected closing brace");
    }

    return obj;
  }

  private parseArray(): any[] {
    const arr: any[] = [];
    const startToken = this.consume("bracket");
    if (!startToken || !startToken.value.includes("[")) throw new Error("Expected opening bracket");

    if (this.currentToken()?.value === "]") {
      this.consume("bracket");
      return arr;
    }

    while (true) {
      arr.push(this.parseValue());

      // Check for comma
      const commaToken = this.currentToken();
      if (commaToken?.type === "comma") {
        this.consume("comma");

        // Check for trailing comma
        const nextToken = this.currentToken();
        if (nextToken?.value === "]" || nextToken?.value === "}") {
          if (!this.options.allowTrailingCommas) {
            throw new Error("Trailing commas are not allowed");
          }
          break;
        }
      } else {
        break;
      }
    }

    if (!this.consume("bracket")?.value.includes("]")) {
      throw new Error("Expected closing bracket");
    }

    return arr;
  }

  parse(): { data: any; warnings: string[] } {
    this.warnings = [];
    const data = this.parseValue();

    // Check for remaining tokens
    const remainingTokens = this.tokens.slice(this.position).filter((t) => t.type !== "comment");
    if (remainingTokens.length > 0 && this.options.strictMode) {
      throw new Error(
        `Unexpected tokens after JSON5: ${remainingTokens.map((t) => t.value).join(", ")}`,
      );
    }

    return { data, warnings: this.warnings };
  }
}

// Main JSON5 parsing function
function parseJSON5(
  input: string,
  options: JSON5ParseOptions = DEFAULT_JSON5_OPTIONS,
): JSON5ParseResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  const metadata: JSON5Metadata = {
    originalText: input,
    hasComments: false,
    hasTrailingCommas: false,
    hasSingleQuotes: false,
    hasUnquotedKeys: false,
    hasMultilineStrings: false,
    hasHexNumbers: false,
    parseTime: 0,
    size: input.length,
  };

  try {
    // Check for JSON5 features
    metadata.hasComments = options.allowComments && (input.includes("//") || input.includes("/*"));
    metadata.hasSingleQuotes = options.allowSingleQuotes && input.includes("'");
    metadata.hasHexNumbers = options.allowHexadecimalNumbers && /0x[0-9a-fA-F]+/.test(input);

    // Tokenize
    const lexer = new JSON5Lexer(input, options);
    const tokens = lexer.tokenize();

    // Parse
    const parser = new JSON5Parser(tokens, options);
    const result = parser.parse();

    // Apply reviver if provided
    let data = result.data;
    if (options.reviver) {
      data = reviver("", data, options.reviver);
    }

    metadata.parseTime = performance.now() - startTime;
    warnings.push(...result.warnings);

    return {
      success: true,
      data,
      warnings,
      metadata,
    };
  } catch (error) {
    metadata.parseTime = performance.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      warnings,
      metadata,
    };
  }
}

// Helper function for reviver
function reviver(key: string, value: any, reviverFn: (key: string, value: any) => any): any {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, reviver(k, v, reviverFn)]));
  } else if (Array.isArray(value)) {
    return value.map((v, i) => reviver(i.toString(), v, reviverFn));
  }
  return reviverFn(key, value);
}

// Validate JSON5 against standard JSON
function validateJSON5(json5Text: string): {
  validJSON5: boolean;
  validJSON: boolean;
  jsonError?: string;
} {
  try {
    const json5Result = parseJSON5(json5Text);
    if (!json5Result.success) {
      return { validJSON5: false, validJSON: false };
    }

    // Try to parse as standard JSON
    const jsonString = JSON.stringify(json5Result.data);
    JSON.parse(jsonString);

    return { validJSON5: true, validJSON: true };
  } catch (error) {
    const jsonError = error instanceof Error ? error.message : "Unknown error";
    return { validJSON5: false, validJSON: false, jsonError };
  }
}

// Main component props
interface JSON5ParserProps {
  jsonData?: string;
  onParsedDataChange?: (data: any) => void;
  onParseResultChange?: (result: JSON5ParseResult) => void;
  className?: string;
  readOnly?: boolean;
  showMetadata?: boolean;
  initialOptions?: Partial<JSON5ParseOptions>;
}

export const JSON5Parser: React.FC<JSON5ParserProps> = ({
  jsonData = "",
  onParsedDataChange,
  onParseResultChange,
  className: propsClassName,
  readOnly = false,
  showMetadata = true,
  initialOptions = {},
}) => {
  const [json5Input, setJson5Input] = useState(jsonData);
  const [options, setOptions] = useState<JSON5ParseOptions>({
    ...DEFAULT_JSON5_OPTIONS,
    ...initialOptions,
  });
  const [parseResult, setParseResult] = useState<JSON5ParseResult | null>(null);
  const [isAutoParsing, setIsAutoParsing] = useState(true);

  // Memoized parsing
  const result = useMemo(() => {
    if (!json5Input.trim()) return null;

    try {
      return parseJSON5(json5Input, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        warnings: [],
        metadata: {
          originalText: json5Input,
          hasComments: false,
          hasTrailingCommas: false,
          hasSingleQuotes: false,
          hasUnquotedKeys: false,
          hasMultilineStrings: false,
          hasHexNumbers: false,
          parseTime: 0,
          size: json5Input.length,
        },
      };
    }
  }, [json5Input, options]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setJson5Input(value);
  };

  // Handle manual parse
  const handleParse = () => {
    const result = parseJSON5(json5Input, options);
    setParseResult(result);
    onParseResultChange?.(result);
    if (result.success && result.data) {
      onParsedDataChange?.(result.data);
    }
  };

  // Update result when dependencies change
  useEffect(() => {
    if (isAutoParsing) {
      setParseResult(result);
      onParseResultChange?.(result);
      if (result?.success && result.data) {
        onParsedDataChange?.(result.data);
      }
    }
  }, [result, isAutoParsing, onParseResultChange, onParsedDataChange]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      if (parseResult?.success && parseResult.data) {
        await navigator.clipboard.writeText(JSON.stringify(parseResult.data, null, 2));
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Download as JSON
  const handleDownload = () => {
    if (parseResult?.success && parseResult.data) {
      const blob = new Blob([JSON.stringify(parseResult.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "parsed.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Format as JSON
  const formatAsJSON = () => {
    if (parseResult?.success && parseResult.data) {
      setJson5Input(JSON.stringify(parseResult.data, null, 2));
    }
  };

  // Format as JSON5
  const formatAsJSON5 = () => {
    if (parseResult?.success && parseResult.data) {
      // Simple JSON5 formatting (could be enhanced)
      setJson5Input(JSON.stringify(parseResult.data, null, 2));
    }
  };

  // Reset
  const handleReset = () => {
    setJson5Input("");
    setParseResult(null);
    setOptions(DEFAULT_JSON5_OPTIONS);
  };

  // Sample JSON5 content
  const loadSample = () => {
    const sampleJSON5 = `{
  // This is a comment
  unquoted_key: 'you can use single quotes',
  "quoted_key": "standard JSON",
  trailing_comma: 'works!',

  hex_number: 0xDEADBEEF,
  binary_number: 0b101010,
  octal_number: 0755,

  multiline_string: 'This is a
multiline string in JSON5',

  nested: {
    array: [1, 2, 3,],
    null_value: null,
  },

  /*
   * Block comment
   */
  special_values: [Infinity, -Infinity, NaN]
}`;
    setJson5Input(sampleJSON5);
  };

  const className = cn("w-full max-w-6xl mx-auto p-6 space-y-6", propsClassName);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                JSON5 Parser
                <Badge variant="outline">v1.0.0</Badge>
              </CardTitle>
              <CardDescription>
                Parse JSON5 with comments, trailing commas, and relaxed syntax
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleParse}
                disabled={!json5Input.trim() || readOnly}
              >
                Parse
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={formatAsJSON}
                disabled={!parseResult?.success || readOnly}
              >
                Format JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!parseResult?.success || readOnly}
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!parseResult?.success || readOnly}
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
                <Label htmlFor="json5-input">JSON5 Input</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-parse"
                    checked={isAutoParsing}
                    onCheckedChange={setIsAutoParsing}
                    disabled={readOnly}
                  />
                  <Label htmlFor="auto-parse">Auto Parse</Label>
                  <Button variant="outline" size="sm" onClick={loadSample} disabled={readOnly}>
                    Load Sample
                  </Button>
                </div>
              </div>
              <textarea
                id="json5-input"
                className={cn(
                  "w-full h-64 p-3 font-mono text-sm border rounded-md resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  !parseResult?.success && parseResult && "border-red-500",
                )}
                placeholder="Paste your JSON5 here..."
                value={json5Input}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={readOnly}
              />
            </div>

            {/* Parse Options */}
            <Tabs defaultValue="basic" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="strict">Strict Mode</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-comments"
                      checked={options.allowComments}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowComments: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-comments">Allow Comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-trailing-commas"
                      checked={options.allowTrailingCommas}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowTrailingCommas: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-trailing-commas">Allow Trailing Commas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-single-quotes"
                      checked={options.allowSingleQuotes}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowSingleQuotes: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-single-quotes">Allow Single Quotes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-unquoted-keys"
                      checked={options.allowUnquotedKeys}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowUnquotedKeys: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-unquoted-keys">Allow Unquoted Keys</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-multiline-strings"
                      checked={options.allowMultilineStrings}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowMultilineStrings: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-multiline-strings">Allow Multiline Strings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-hexadecimal-numbers"
                      checked={options.allowHexadecimalNumbers}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowHexadecimalNumbers: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-hexadecimal-numbers">Allow Hexadecimal Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-binary-octal-numbers"
                      checked={options.allowBinaryOctalNumbers}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, allowBinaryOctalNumbers: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="allow-binary-octal-numbers">Allow Binary/Octal Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="preserve-whitespace"
                      checked={options.preserveWhitespace}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, preserveWhitespace: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="preserve-whitespace">Preserve Whitespace</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="strict" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="strict-mode"
                    checked={options.strictMode}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, strictMode: checked }))
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="strict-mode">Strict Mode</Label>
                  <span className="text-sm text-muted-foreground ml-2">
                    Enforce strict JSON5 parsing rules
                  </span>
                </div>
              </TabsContent>
            </Tabs>

            {/* Results */}
            {parseResult && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {parseResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">Parse Successful</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600 font-medium">Parse Failed</span>
                    </>
                  )}
                  {parseResult.warnings.length > 0 && (
                    <Badge variant="outline" className="text-yellow-600">
                      {parseResult.warnings.length} warning(s)
                    </Badge>
                  )}
                </div>

                {/* Error */}
                {!parseResult.success && parseResult.error && (
                  <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-300">{parseResult.error}</p>
                  </div>
                )}

                {/* Warnings */}
                {parseResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-yellow-600">Warnings</Label>
                    <div className="space-y-1">
                      {parseResult.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-yellow-600">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parsed Data */}
                {parseResult.success && parseResult.data && (
                  <div className="space-y-2">
                    <Label>Parsed Data (JSON)</Label>
                    <ScrollArea className="h-64 w-full border rounded-md">
                      <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                        <code>{JSON.stringify(parseResult.data, null, 2)}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {/* Metadata */}
                {showMetadata && parseResult.metadata && (
                  <div className="space-y-2">
                    <Label>Metadata</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                      <div className="text-sm">
                        <span className="font-medium">Size:</span> {parseResult.metadata.size} chars
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Parse time:</span>{" "}
                        {parseResult.metadata.parseTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Comments:</span>{" "}
                        {parseResult.metadata.hasComments ? "Yes" : "No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Single quotes:</span>{" "}
                        {parseResult.metadata.hasSingleQuotes ? "Yes" : "No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Hex numbers:</span>{" "}
                        {parseResult.metadata.hasHexNumbers ? "Yes" : "No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Trailing commas:</span>{" "}
                        {parseResult.metadata.hasTrailingCommas ? "Yes" : "No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Unquoted keys:</span>{" "}
                        {parseResult.metadata.hasUnquotedKeys ? "Yes" : "No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Multiline strings:</span>{" "}
                        {parseResult.metadata.hasMultilineStrings ? "Yes" : "No"}
                      </div>
                    </div>
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

export default JSON5Parser;
