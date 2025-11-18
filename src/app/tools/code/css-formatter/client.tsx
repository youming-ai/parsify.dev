"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Code2,
  Copy,
  Download,
  RefreshCw,
  Minimize2,
  Maximize2,
  Settings,
  Zap,
  FileText,
  Hash,
  CheckCircle,
} from "lucide-react";

interface FormattingOptions {
  indentSize: number;
  indentType: "spaces" | "tabs";
  braceStyle: "allman" | "1tbs" | "k&r";
  maxLineLength: number;
  sortProperties: boolean;
  optimizeShorthand: boolean;
  convertColors: boolean;
  removeComments: boolean;
  preserveComments: boolean;
  insertNewlines: boolean;
  quoteType: "single" | "double";
  endOfLine: "lf" | "crlf";
}

const defaultOptions: FormattingOptions = {
  indentSize: 2,
  indentType: "spaces",
  braceStyle: "1tbs",
  maxLineLength: 120,
  sortProperties: false,
  optimizeShorthand: false,
  convertColors: false,
  removeComments: false,
  preserveComments: true,
  insertNewlines: true,
  quoteType: "single",
  endOfLine: "lf",
};

export default function CSSFormatterClient() {
  const [cssInput, setCssInput] = useState("");
  const [cssOutput, setCssOutput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [options, setOptions] = useState<FormattingOptions>(defaultOptions);
  const [stats, setStats] = useState({ original: 0, formatted: 0, compression: 0 });
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const cssColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const rgbRegex = /rgba?\([^)]+\)/g;
  const hslRegex = /hsla?\([^)]+\)/g;

  const formatCSS = (css: string, opts: FormattingOptions): string => {
    try {
      let formatted = css;

      // Remove excessive whitespace and normalize line breaks
      formatted = formatted.replace(/\r\n/g, "\n");
      formatted = formatted.replace(/\s+/g, " ");
      formatted = formatted.replace(/\n\s+/g, "\n");

      // Handle comments based on options
      if (opts.removeComments) {
        formatted = formatted.replace(/\/\*[\s\S]*?\*\//g, "");
      }

      // Basic CSS parsing and formatting
      const rules = formatted.match(/[^{}]+\{[^{}]*\}/g) || [];
      let result = "";

      rules.forEach((rule, index) => {
        const match = rule.match(/([^{}]+)\{([^{}]*)\}/);
        if (!match) return;

        let [, selector, properties] = match;

        // Clean up selector
        selector = selector.trim();

        // Clean up properties
        properties = properties.trim();

        if (mode === "format") {
          // Format mode
          const indentChar = opts.indentType === "spaces" ? " ".repeat(opts.indentSize) : "\t";

          // Process properties
          const propList = properties.split(";").filter((prop) => prop.trim());

          if (opts.sortProperties) {
            propList.sort();
          }

          let formattedProps = "";
          propList.forEach((prop, propIndex) => {
            if (!prop.trim()) return;

            const [property, ...values] = prop.split(":").map((part) => part.trim());
            const value = values.join(":");

            formattedProps += indentChar + property + ": " + value;

            if (opts.optimizeShorthand) {
              // Simple shorthand optimization (could be enhanced)
              if (property === "margin" || property === "padding") {
                formattedProps += " /* shorthand */";
              }
            }

            if (propIndex < propList.length - 1) {
              formattedProps += ";\n";
            } else {
              formattedProps += ";";
            }
          });

          // Apply brace style
          if (opts.braceStyle === "allman") {
            result += selector + "\n{\n" + formattedProps + "\n}\n";
          } else if (opts.braceStyle === "1tbs") {
            result += selector + " {\n" + formattedProps + "\n}\n";
          } else {
            // k&r
            result += selector + " {\n" + formattedProps + "\n}\n";
          }

          // Add spacing between rules
          if (index < rules.length - 1 && opts.insertNewlines) {
            result += "\n";
          }
        } else {
          // Minify mode
          selector = selector.replace(/\s+/g, " ");
          properties = properties.replace(/\s+/g, " ");
          result += selector + "{" + properties + "}";
        }
      });

      // Handle imports, media queries, etc.
      if (mode === "format") {
        result = result.replace(/@([a-z-]+)\s+/gi, (match, atRule) => "@" + atRule + " ");
      }

      return result.trim();
    } catch (error) {
      console.error("CSS formatting error:", error);
      return css;
    }
  };

  const minifyCSS = (css: string): string => {
    try {
      let minified = css;

      // Remove comments
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, "");

      // Remove whitespace
      minified = minified.replace(/\s+/g, " ");
      minified = minified.replace(/\s*([{}:;,>+~])\s*/g, "$1");

      // Remove unnecessary semicolons
      minified = minified.replace(/;}/g, "}");

      // Optimize colors
      minified = minified.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, "#$1$2$3");

      // Optimize zero values
      minified = minified.replace(/(^|[^0-9])0px/g, "$10");
      minified = minified.replace(/(^|[^0-9])0em/g, "$10");
      minified = minified.replace(/(^|[^0-9])0rem/g, "$10");

      return minified.trim();
    } catch (error) {
      console.error("CSS minification error:", error);
      return css;
    }
  };

  const processCSS = () => {
    if (!cssInput.trim()) {
      setCssOutput("");
      setStats({ original: 0, formatted: 0, compression: 0 });
      return;
    }

    setIsProcessing(true);

    try {
      const originalSize = cssInput.length;
      let processed = cssInput;

      if (mode === "format") {
        processed = formatCSS(cssInput, options);
      } else {
        processed = minifyCSS(cssInput);
      }

      const formattedSize = processed.length;
      const compression =
        originalSize > 0 ? Math.round(((originalSize - formattedSize) / originalSize) * 100) : 0;

      setCssOutput(processed);
      setStats({
        original: originalSize,
        formatted: formattedSize,
        compression: compression,
      });
    } catch (error) {
      console.error("Processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cssOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadCSS = () => {
    const blob = new Blob([cssOutput], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.css" : "minified.css";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const beautifyCSS = () => {
    if (!cssInput.trim()) return;

    let beautified = cssInput
      .replace(/}/g, "}\n")
      .replace(/\{/g, " {\n")
      .replace(/;/g, ";\n")
      .replace(/\n\s*\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => (line.startsWith("{") || line.startsWith("}") ? line : "  " + line))
      .join("\n");

    setCssInput(beautified);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            CSS Formatter
          </CardTitle>
          <CardDescription>Format or minify your CSS code with advanced options</CardDescription>
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
            <Button variant="outline" onClick={beautifyCSS} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Beautify
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Input CSS</span>
              <Badge variant="secondary">{stats.original} chars</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your CSS code here..."
              value={cssInput}
              onChange={(e) => setCssInput(e.target.value)}
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <Button
              onClick={processCSS}
              disabled={!cssInput.trim() || isProcessing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Processing..." : `${mode === "format" ? "Format" : "Minify"} CSS`}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{mode === "format" ? "Formatted" : "Minified"} CSS</span>
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
              placeholder="Formatted CSS will appear here..."
              value={cssOutput}
              readOnly
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!cssOutput}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                onClick={downloadCSS}
                disabled={!cssOutput}
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
            <CardDescription>Customize how your CSS should be formatted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <Label>Indent Type</Label>
                <Select
                  value={options.indentType}
                  onValueChange={(value: "spaces" | "tabs") =>
                    setOptions({ ...options, indentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spaces">Spaces</SelectItem>
                    <SelectItem value="tabs">Tabs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brace Style</Label>
                <Select
                  value={options.braceStyle}
                  onValueChange={(value: "allman" | "1tbs" | "k&r") =>
                    setOptions({ ...options, braceStyle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allman">Allman</SelectItem>
                    <SelectItem value="1tbs">1TBS</SelectItem>
                    <SelectItem value="k&r">K&R</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quote Type</Label>
                <Select
                  value={options.quoteType}
                  onValueChange={(value: "single" | "double") =>
                    setOptions({ ...options, quoteType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single ('')</SelectItem>
                    <SelectItem value="double">Double ("")</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Line Length</Label>
                <Select
                  value={options.maxLineLength.toString()}
                  onValueChange={(value) =>
                    setOptions({ ...options, maxLineLength: parseInt(value) })
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

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sort-props"
                    checked={options.sortProperties}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, sortProperties: checked })
                    }
                  />
                  <Label htmlFor="sort-props">Sort Properties</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="optimize-shorthand"
                    checked={options.optimizeShorthand}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, optimizeShorthand: checked })
                    }
                  />
                  <Label htmlFor="optimize-shorthand">Optimize Shorthand</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="convert-colors"
                    checked={options.convertColors}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, convertColors: checked })
                    }
                  />
                  <Label htmlFor="convert-colors">Convert Colors</Label>
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
                    id="insert-newlines"
                    checked={options.insertNewlines}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, insertNewlines: checked })
                    }
                  />
                  <Label htmlFor="insert-newlines">Insert Newlines</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {cssOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
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
