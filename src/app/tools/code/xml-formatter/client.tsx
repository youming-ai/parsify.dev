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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCode,
  Copy,
  Download,
  RefreshCw,
  Minimize2,
  Maximize2,
  Settings,
  Zap,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
} from "lucide-react";

interface FormattingOptions {
  indentSize: number;
  indentType: "spaces" | "tabs";
  maxLineLength: number;
  attributeIndent: number;
  attributeAlignment: "none" | "align" | "compact";
  preserveComments: boolean;
  preserveCDATA: boolean;
  selfClosingTags: "xml" | "html" | "preserve";
  sortAttributes: boolean;
  removeEmptyLines: boolean;
  collapseEmptyElements: boolean;
  quoteStyle: "double" | "single";
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

const defaultOptions: FormattingOptions = {
  indentSize: 2,
  indentType: "spaces",
  maxLineLength: 120,
  attributeIndent: 4,
  attributeAlignment: "align",
  preserveComments: true,
  preserveCDATA: true,
  selfClosingTags: "xml",
  sortAttributes: false,
  removeEmptyLines: true,
  collapseEmptyElements: false,
  quoteStyle: "double",
};

export default function XMLFormatterClient() {
  const [xmlInput, setXmlInput] = useState("");
  const [xmlOutput, setXmlOutput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [options, setOptions] = useState<FormattingOptions>(defaultOptions);
  const [stats, setStats] = useState({ original: 0, formatted: 0, compression: 0 });
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateXML = (xml: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const lines = xml.split("\n");

    // Simple XML validation
    const tagStack: string[] = [];
    let currentLine = 1;
    let currentColumn = 1;
    let inTag = false;
    let inString = false;
    let stringChar = "";
    let currentTag = "";

    for (let i = 0; i < xml.length; i++) {
      const char = xml[i];
      currentColumn++;

      if (char === "\n") {
        currentLine++;
        currentColumn = 1;
      }

      // Handle strings
      if ((char === '"' || char === "'") && !inString && inTag) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = "";
      }

      // Handle tags
      if (!inString) {
        if (char === "<") {
          inTag = true;
          currentTag = "";
        } else if (char === ">") {
          inTag = false;

          if (currentTag.startsWith("!")) {
            // Comment or DOCTYPE
            continue;
          } else if (currentTag.startsWith("?")) {
            // Processing instruction
            continue;
          } else if (currentTag.startsWith("/")) {
            // Closing tag
            const tagName = currentTag.slice(1);
            if (tagStack.length === 0) {
              errors.push({
                line: currentLine,
                column: currentColumn,
                message: `Unexpected closing tag: </${tagName}>`,
                severity: "error",
              });
            } else {
              const lastTag = tagStack.pop();
              if (lastTag !== tagName) {
                errors.push({
                  line: currentLine,
                  column: currentColumn,
                  message: `Mismatched closing tag: expected </${lastTag}>, found </${tagName}>`,
                  severity: "error",
                });
              }
            }
          } else if (currentTag.endsWith("/")) {
            // Self-closing tag
            const tagName = currentTag.slice(0, -1).split(" ")[0];
          } else {
            // Opening tag
            const tagName = currentTag.split(" ")[0];
            tagStack.push(tagName);
          }
        } else if (inTag) {
          currentTag += char;
        }
      }
    }

    // Check for unclosed tags
    while (tagStack.length > 0) {
      const unclosedTag = tagStack.pop();
      errors.push({
        line: lines.length,
        column: 1,
        message: `Unclosed tag: <${unclosedTag}>`,
        severity: "error",
      });
    }

    return errors;
  };

  const formatXML = (xml: string, opts: FormattingOptions): string => {
    try {
      if (mode === "minify") {
        // Minify mode
        return xml
          .replace(/>\s+</g, "><")
          .replace(/\s+/g, " ")
          .replace(/<!--[\s\S]*?-->/g, "") // Remove comments
          .trim();
      }

      // Format mode
      let formatted = xml;
      const indentChar = opts.indentType === "spaces" ? " ".repeat(opts.indentSize) : "\t";
      const attributeIndentChar =
        opts.indentType === "spaces" ? " ".repeat(opts.attributeIndent) : "\t";

      // Preserve XML declaration
      const xmlDeclarationMatch = formatted.match(/^<\?xml[^>]*\?>/);
      const xmlDeclaration = xmlDeclarationMatch ? xmlDeclarationMatch[0] : "";

      // Remove XML declaration for processing
      formatted = formatted.replace(/^<\?xml[^>]*\?>\s*/, "");

      // Format the XML structure
      const lines = formatted.split("\n").filter((line) => line.trim());
      let result = xmlDeclaration ? xmlDeclaration + "\n" : "";
      let indentLevel = 0;
      let inTag = false;
      let currentIndent = "";

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines if option is set
        if (!line && opts.removeEmptyLines) continue;

        // Handle comments
        if (line.startsWith("<!--") && line.endsWith("-->")) {
          result += currentIndent + line + "\n";
          continue;
        }

        // Handle CDATA
        if (line.startsWith("<![CDATA[") && line.endsWith("]]>")) {
          result += currentIndent + line + "\n";
          continue;
        }

        // Handle self-closing tags
        if (line.includes("/>")) {
          result += currentIndent + line + "\n";
          continue;
        }

        // Handle closing tags
        if (line.startsWith("</")) {
          indentLevel = Math.max(0, indentLevel - 1);
          currentIndent = indentChar.repeat(indentLevel);
          result += currentIndent + line + "\n";
          continue;
        }

        // Handle opening tags
        const tagMatch = line.match(/^<([^>]+)>/);
        if (tagMatch && !line.includes("/>")) {
          // Format attributes
          if (opts.attributeAlignment !== "none" && tagMatch[1].includes(" ")) {
            const tagName = tagMatch[1].split(" ")[0];
            const attributes = line.slice(tagName.length + 2, -1).trim();

            if (attributes) {
              // Split attributes
              const attrArray = attributes.split(/\s+/).filter((attr) => attr);
              let formattedAttrs = "";

              if (opts.attributeAlignment === "align") {
                formattedAttrs = "\n" + currentIndent + attributeIndentChar;
                formattedAttrs += attrArray.join("\n" + currentIndent + attributeIndentChar);
              } else {
                formattedAttrs = " " + attrArray.join(" ");
              }

              // Sort attributes if requested
              if (opts.sortAttributes) {
                const attrPairs = formattedAttrs.match(/(\w+)=(["'])(.*?)\2/g) || [];
                attrPairs.sort();
                formattedAttrs = " " + attrPairs.join(" ");
              }

              result += currentIndent + "<" + tagName + formattedAttrs + ">\n";
            } else {
              result += currentIndent + line + "\n";
            }

            indentLevel++;
            currentIndent = indentChar.repeat(indentLevel);
          } else {
            result += currentIndent + line + "\n";
            indentLevel++;
            currentIndent = indentChar.repeat(indentLevel);
          }

          continue;
        }

        // Handle text content
        if (!line.startsWith("<")) {
          result += currentIndent + line + "\n";
          continue;
        }

        // Default case
        result += currentIndent + line + "\n";
      }

      return result.trim();
    } catch (error) {
      console.error("XML formatting error:", error);
      return xml;
    }
  };

  const processXML = () => {
    if (!xmlInput.trim()) {
      setXmlOutput("");
      setStats({ original: 0, formatted: 0, compression: 0 });
      setValidationErrors([]);
      setIsValid(null);
      return;
    }

    setIsProcessing(true);

    try {
      const originalSize = xmlInput.length;
      const processed = formatXML(xmlInput, options);
      const formattedSize = processed.length;
      const compression =
        originalSize > 0 ? Math.round(((originalSize - formattedSize) / originalSize) * 100) : 0;

      setXmlOutput(processed);
      setStats({
        original: originalSize,
        formatted: formattedSize,
        compression: compression,
      });

      // Validate the input XML
      const errors = validateXML(xmlInput);
      setValidationErrors(errors);
      setIsValid(errors.length === 0);
    } catch (error) {
      console.error("Processing error:", error);
      setIsValid(false);
      setValidationErrors([
        {
          line: 1,
          column: 1,
          message: `Processing error: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "error",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadXML = () => {
    const blob = new Blob([xmlOutput], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.xml" : "minified.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatQuick = () => {
    if (!xmlInput.trim()) return;

    const quickOptions = { ...options, indentSize: 2, attributeAlignment: "align" as const };
    const formatted = formatXML(xmlInput, quickOptions);
    setXmlInput(formatted);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            XML Formatter
          </CardTitle>
          <CardDescription>
            Format or minify your XML code with intelligent formatting
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
              <span>XML Input</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.original} chars</Badge>
                {isValid !== null && (
                  <Badge variant={isValid ? "default" : "destructive"}>
                    {isValid ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your XML code here..."
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <Button
              onClick={processXML}
              disabled={!xmlInput.trim() || isProcessing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Processing..." : `${mode === "format" ? "Format" : "Minify"} XML`}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{mode === "format" ? "Formatted" : "Minified"} XML</span>
              <Badge variant="secondary">{stats.formatted} chars</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Formatted XML will appear here..."
              value={xmlOutput}
              readOnly
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!xmlOutput}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                onClick={downloadXML}
                disabled={!xmlOutput}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <Alert key={index} variant={error.severity === "error" ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>
                      Line {error.line}, Column {error.column}:
                    </strong>{" "}
                    {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formatting Options */}
      {mode === "format" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Formatting Options
            </CardTitle>
            <CardDescription>Customize how your XML should be formatted</CardDescription>
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
                <Label>Attribute Indent: {options.attributeIndent}</Label>
                <Slider
                  value={[options.attributeIndent]}
                  onValueChange={([value]) => setOptions({ ...options, attributeIndent: value })}
                  min={0}
                  max={8}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Attribute Alignment</Label>
                <Select
                  value={options.attributeAlignment}
                  onValueChange={(value: any) =>
                    setOptions({ ...options, attributeAlignment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="align">Align</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Self-Closing Tags</Label>
                <Select
                  value={options.selfClosingTags}
                  onValueChange={(value: any) => setOptions({ ...options, selfClosingTags: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xml">XML Style (&lt;/&gt;)</SelectItem>
                    <SelectItem value="html">HTML Style (&lt;tag&gt;)</SelectItem>
                    <SelectItem value="preserve">Preserve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quote Style</Label>
                <Select
                  value={options.quoteStyle}
                  onValueChange={(value: any) => setOptions({ ...options, quoteStyle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="double">Double Quotes ("")</SelectItem>
                    <SelectItem value="single">Single Quotes ('')</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 md:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap gap-4">
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
                      id="preserve-cdata"
                      checked={options.preserveCDATA}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, preserveCDATA: checked })
                      }
                    />
                    <Label htmlFor="preserve-cdata">Preserve CDATA</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sort-attributes"
                      checked={options.sortAttributes}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, sortAttributes: checked })
                      }
                    />
                    <Label htmlFor="sort-attributes">Sort Attributes</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-empty-lines"
                      checked={options.removeEmptyLines}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, removeEmptyLines: checked })
                      }
                    />
                    <Label htmlFor="remove-empty-lines">Remove Empty Lines</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="collapse-empty-elements"
                      checked={options.collapseEmptyElements}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, collapseEmptyElements: checked })
                      }
                    />
                    <Label htmlFor="collapse-empty-elements">Collapse Empty Elements</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {xmlOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
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
