"use client";

import {
  CheckCircle,
  Copy,
  Database,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings,
  Terminal,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FormattingOptions {
  sqlDialect: "standard" | "mysql" | "postgresql" | "sqlserver" | "oracle" | "sqlite";
  indentSize: number;
  indentType: "spaces" | "tabs";
  keywordCase: "upper" | "lower" | "capitalize";
  identifierCase: "preserve" | "upper" | "lower";
  maxLineLength: number;
  commaPlacement: "before" | "after";
  alignColumns: boolean;
  alignValues: boolean;
  alignWhere: boolean;
  preserveComments: boolean;
  compactMode: boolean;
  removeComments: boolean;
}

const defaultOptions: FormattingOptions = {
  sqlDialect: "standard",
  indentSize: 2,
  indentType: "spaces",
  keywordCase: "upper",
  identifierCase: "preserve",
  maxLineLength: 120,
  commaPlacement: "before",
  alignColumns: false,
  alignValues: false,
  alignWhere: false,
  preserveComments: true,
  compactMode: false,
  removeComments: false,
};

// SQL Keywords for formatting
const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "TABLE",
  "INDEX",
  "VIEW",
  "DATABASE",
  "SCHEMA",
  "TRIGGER",
  "PROCEDURE",
  "FUNCTION",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "JOIN",
  "ON",
  "USING",
  "GROUP",
  "BY",
  "HAVING",
  "ORDER",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "MINUS",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "AS",
  "DISTINCT",
  "ALL",
  "ANY",
  "SOME",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "TRANSACTION",
  "PRIMARY",
  "FOREIGN",
  "KEY",
  "REFERENCES",
  "UNIQUE",
  "CHECK",
  "DEFAULT",
  "INTO",
  "VALUES",
  "SET",
];

export default function SQLFormatterClient() {
  const [sqlInput, setSqlInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [options, setOptions] = useState<FormattingOptions>(defaultOptions);
  const [stats, setStats] = useState({ original: 0, formatted: 0, compression: 0 });
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidSql, setIsValidSql] = useState<boolean | null>(null);

  const isSQLKeyword = (word: string): boolean => {
    return SQL_KEYWORDS.includes(word.toUpperCase());
  };

  const formatIdentifier = (identifier: string): string => {
    switch (options.identifierCase) {
      case "upper":
        return identifier.toUpperCase();
      case "lower":
        return identifier.toLowerCase();
      default:
        return identifier;
    }
  };

  const formatKeyword = (keyword: string): string => {
    switch (options.keywordCase) {
      case "upper":
        return keyword.toUpperCase();
      case "lower":
        return keyword.toLowerCase();
      case "capitalize":
        return keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
      default:
        return keyword.toUpperCase();
    }
  };

  const formatSQL = (sql: string, opts: FormattingOptions): string => {
    try {
      let formatted = sql;

      // Remove excessive whitespace
      formatted = formatted.replace(/\s+/g, " ");
      formatted = formatted.trim();

      // Handle comments
      if (opts.removeComments) {
        formatted = formatted.replace(/--.*$/gm, "");
        formatted = formatted.replace(/\/\*[\s\S]*?\*\//g, "");
      }

      if (mode === "minify") {
        // Minify mode
        formatted = formatted.replace(/\s+/g, " ");
        formatted = formatted.replace(/\s*([(),;])\s*/g, "$1");
        formatted = formatted.replace(
          /\s*(=|!=|<>|<=|>=|<|>|LIKE|IN|IS|AND|OR|NOT)\s*/gi,
          (match) => match.toUpperCase(),
        );
        return formatted.trim();
      }

      // Format mode
      const indentChar = opts.indentType === "spaces" ? " ".repeat(opts.indentSize) : "\t";

      // Tokenize SQL
      const tokens = formatted.match(/\w+|\S/g) || [];
      let result = "";
      let indentLevel = 0;
      let isStringLiteral = false;
      let stringDelimiter = "";

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const prevToken = i > 0 ? tokens[i - 1] : "";
        const nextToken = i < tokens.length - 1 ? tokens[i + 1] : "";

        // Handle string literals
        if ((token === "'" || token === '"' || token === "`") && !isStringLiteral) {
          isStringLiteral = true;
          stringDelimiter = token;
          result += token;
          continue;
        } else if (token === stringDelimiter && isStringLiteral && prevToken !== "\\") {
          isStringLiteral = false;
          result += token;
          continue;
        } else if (isStringLiteral) {
          result += token;
          continue;
        }

        // Handle comments
        if (token === "-" && nextToken === "-") {
          // Line comment
          result += token + nextToken;
          i++;
          continue;
        }

        if (token === "/" && nextToken === "*") {
          // Block comment
          result += token + nextToken;
          i++;
          continue;
        }

        const upperToken = token.toUpperCase();

        // Handle keywords
        if (isSQLKeyword(token)) {
          if (["SELECT", "FROM", "WHERE", "GROUP", "ORDER", "HAVING"].includes(upperToken)) {
            result += `\n${indentChar.repeat(indentLevel)}${formatKeyword(token)} `;
          } else if (["AND", "OR", "WHEN", "THEN", "ELSE"].includes(upperToken)) {
            result += `\n${indentChar.repeat(indentLevel + 1)}${formatKeyword(token)} `;
          } else if (
            ["INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"].includes(upperToken)
          ) {
            result += `\n${indentChar.repeat(indentLevel)}${formatKeyword(token)} `;
          } else if (["INNER", "LEFT", "RIGHT", "FULL", "OUTER", "JOIN"].includes(upperToken)) {
            result += `\n${indentChar.repeat(indentLevel + 1)}${formatKeyword(token)} `;
          } else if (
            upperToken === "ON" &&
            ["INNER", "LEFT", "RIGHT", "FULL", "OUTER", "JOIN"].includes(prevToken.toUpperCase())
          ) {
            result += `${formatKeyword(token)} `;
          } else if (upperToken === "CASE") {
            result += `\n${indentChar.repeat(indentLevel)}${formatKeyword(token)} `;
          } else if (upperToken === "END") {
            result += `\n${indentChar.repeat(indentLevel)}${formatKeyword(token)}`;
          } else if (
            upperToken === "BEGIN" ||
            upperToken === "COMMIT" ||
            upperToken === "ROLLBACK"
          ) {
            result += `\n${indentChar.repeat(indentLevel)}${formatKeyword(token)} `;
          } else {
            result += `${formatKeyword(token)} `;
          }
        } else if (token === "(") {
          if (prevToken.toUpperCase() === "SELECT" || prevToken.toUpperCase() === "FROM") {
            result += token;
            indentLevel++;
          } else {
            result += token;
          }
        } else if (token === ")") {
          if (indentLevel > 0) indentLevel--;
          result += token;
        } else if (token === ",") {
          if (opts.commaPlacement === "before") {
            result += `\n${indentChar.repeat(indentLevel)}${token} `;
          } else {
            result += `${token}\n${indentChar.repeat(indentLevel + 1)}`;
          }
        } else if (token === ";") {
          result += `${token}\n\n`;
          indentLevel = 0;
        } else if (
          token === "=" ||
          token === "!=" ||
          token === "<>" ||
          token === "<=" ||
          token === ">=" ||
          token === "<" ||
          token === ">"
        ) {
          result += ` ${token} `;
        } else {
          // Identifiers and values
          if (token.match(/^\w+$/)) {
            result += `${formatIdentifier(token)} `;
          } else {
            result += token;
          }
        }
      }

      // Clean up extra whitespace
      result = result.replace(/\n\s*\n\s*\n/g, "\n\n");
      result = result.trim();

      return result;
    } catch (error) {
      console.error("SQL formatting error:", error);
      return sql;
    }
  };

  const validateSQL = (sql: string): boolean => {
    // Basic SQL validation
    const trimmedSql = sql.trim().toLowerCase();

    // Check for basic SQL structure
    const hasSelect = trimmedSql.includes("select");
    const _hasFrom = trimmedSql.includes("from");
    const hasInsert = trimmedSql.includes("insert");
    const hasUpdate = trimmedSql.includes("update");
    const hasDelete = trimmedSql.includes("delete");
    const hasCreate = trimmedSql.includes("create");
    const hasAlter = trimmedSql.includes("alter");
    const hasDrop = trimmedSql.includes("drop");

    return hasSelect || hasInsert || hasUpdate || hasDelete || hasCreate || hasAlter || hasDrop;
  };

  const processSQL = () => {
    if (!sqlInput.trim()) {
      setSqlOutput("");
      setStats({ original: 0, formatted: 0, compression: 0 });
      setIsValidSql(null);
      return;
    }

    setIsProcessing(true);

    try {
      const originalSize = sqlInput.length;
      const processed = formatSQL(sqlInput, options);
      const formattedSize = processed.length;
      const compression =
        originalSize > 0 ? Math.round(((originalSize - formattedSize) / originalSize) * 100) : 0;

      setSqlOutput(processed);
      setStats({
        original: originalSize,
        formatted: formattedSize,
        compression: compression,
      });

      setIsValidSql(validateSQL(sqlInput));
    } catch (error) {
      console.error("Processing error:", error);
      setIsValidSql(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadSQL = () => {
    const blob = new Blob([sqlOutput], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.sql" : "minified.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatQuick = () => {
    if (!sqlInput.trim()) return;

    const quickOptions = { ...options, keywordCase: "upper" as const, indentSize: 2 };
    const formatted = formatSQL(sqlInput, quickOptions);
    setSqlInput(formatted);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL Formatter
          </CardTitle>
          <CardDescription>
            Format or minify your SQL code with intelligent formatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "format" ? "default" : "outline"}
              onClick={() => setMode("format")}
              className="flex items-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Format
            </Button>
            <Button
              variant={mode === "minify" ? "default" : "outline"}
              onClick={() => setMode("minify")}
              className="flex items-center gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              Minify
            </Button>
            <Button variant="outline" onClick={formatQuick} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Format
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>SQL Input</span>
              <Badge variant="secondary">{stats.original} chars</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your SQL code here..."
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <Button
              onClick={processSQL}
              disabled={!sqlInput.trim() || isProcessing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Processing..." : `${mode === "format" ? "Format" : "Minify"} SQL`}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{mode === "format" ? "Formatted" : "Minified"} SQL</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.formatted} chars</Badge>
                {stats.compression !== 0 && (
                  <Badge variant={stats.compression > 0 ? "default" : "destructive"}>
                    {stats.compression > 0 ? "-" : "+"}
                    {Math.abs(stats.compression)}%
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Formatted SQL will appear here..."
              value={sqlOutput}
              readOnly
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!sqlOutput}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                onClick={downloadSQL}
                disabled={!sqlOutput}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formatting Options */}
      {mode === "format" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Formatting Options
            </CardTitle>
            <CardDescription>Customize how your SQL should be formatted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>SQL Dialect</Label>
                <Select
                  value={options.sqlDialect}
                  onValueChange={(value: any) => setOptions({ ...options, sqlDialect: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard SQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                    <SelectItem value="oracle">Oracle</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Indent Size: {options.indentSize}</Label>
                <Slider
                  value={[options.indentSize]}
                  onValueChange={([value]) => setOptions({ ...options, indentSize: value })}
                  min={1}
                  max={8}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Keyword Case</Label>
                <Select
                  value={options.keywordCase}
                  onValueChange={(value: any) => setOptions({ ...options, keywordCase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upper">UPPERCASE</SelectItem>
                    <SelectItem value="lower">lowercase</SelectItem>
                    <SelectItem value="capitalize">Capitalize</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Identifier Case</Label>
                <Select
                  value={options.identifierCase}
                  onValueChange={(value: any) => setOptions({ ...options, identifierCase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preserve">Preserve</SelectItem>
                    <SelectItem value="upper">UPPERCASE</SelectItem>
                    <SelectItem value="lower">lowercase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comma Placement</Label>
                <Select
                  value={options.commaPlacement}
                  onValueChange={(value: any) => setOptions({ ...options, commaPlacement: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before</SelectItem>
                    <SelectItem value="after">After</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Line Length</Label>
                <Select
                  value={options.maxLineLength.toString()}
                  onValueChange={(value) =>
                    setOptions({ ...options, maxLineLength: parseInt(value, 10) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">80 chars</SelectItem>
                    <SelectItem value="120">120 chars</SelectItem>
                    <SelectItem value="160">160 chars</SelectItem>
                    <SelectItem value="0">No limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 md:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="align-columns"
                      checked={options.alignColumns}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, alignColumns: checked })
                      }
                    />
                    <Label htmlFor="align-columns">Align Columns</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="align-values"
                      checked={options.alignValues}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, alignValues: checked })
                      }
                    />
                    <Label htmlFor="align-values">Align Values</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="align-where"
                      checked={options.alignWhere}
                      onCheckedChange={(checked) => setOptions({ ...options, alignWhere: checked })}
                    />
                    <Label htmlFor="align-where">Align WHERE Conditions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="preserve-comments"
                      checked={options.preserveComments}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, preserveComments: checked })
                      }
                    />
                    <Label htmlFor="preserve-comments">Preserve Comments</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-comments"
                      checked={options.removeComments}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, removeComments: checked })
                      }
                    />
                    <Label htmlFor="remove-comments">Remove Comments</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {isValidSql !== null && (
        <Alert>
          {isValidSql ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>SQL appears to be valid and properly formatted.</AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                SQL may have syntax issues. Please check your query structure.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Stats */}
      {sqlOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Processing Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Original Size</h4>
                <p className="text-2xl font-bold">{stats.original}</p>
                <p className="text-sm text-muted-foreground">characters</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Processed Size</h4>
                <p className="text-2xl font-bold">{stats.formatted}</p>
                <p className="text-sm text-muted-foreground">characters</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Size Change</h4>
                <p
                  className={`text-2xl font-bold ${stats.compression > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {stats.compression > 0 ? "-" : "+"}
                  {Math.abs(stats.compression)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "format" ? "size increase" : "compression"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
