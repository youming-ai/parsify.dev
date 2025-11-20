import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Label } from "../../../ui/label";
import { ScrollArea } from "../../../ui/scroll-area";
import { Copy, Download, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced type system for C# code generation
interface CSharpTypeOptions {
  useNullable: boolean;
  useRecordTypes: boolean;
  useInitOnlySetters: boolean;
  useSystemTextJson: boolean;
  useNewtonsoftJson: boolean;
  generateProperties: boolean;
  generateConstructors: boolean;
  generateToString: boolean;
  generateEquals: boolean;
  useBackingField: boolean;
  useExpressionBodiedMembers: boolean;
  namespace: string;
  className: string;
  accessModifier: "public" | "internal" | "private";
  usingDirectives: string[];
  fileHeader: string;
}

interface CSharpGenerationConfig {
  rootClassName: string;
  namespace: string;
  accessModifier: "public" | "internal" | "private";
  options: CSharpTypeOptions;
}

interface CSharpClassInfo {
  name: string;
  properties: CSharpPropertyInfo[];
  namespace: string;
  usingDirectives: string[];
  inherits: string[];
  attributes: string[];
  description?: string;
}

interface CSharpPropertyInfo {
  name: string;
  type: string;
  csharpType: string;
  isNullable: boolean;
  defaultValue?: string;
  attributes: string[];
  description?: string;
  accessModifier: string;
  hasSetter: boolean;
  isInitOnly: boolean;
  isVirtual: boolean;
}

// Enhanced type inference for C#
interface TypeInferenceResult {
  csharpType: string;
  isNullable: boolean;
  attributes: string[];
  defaultValue?: string;
  requiresSystemTextJson: boolean;
  requiresNewtonsoftJson: boolean;
}

const DEFAULT_CSHARP_OPTIONS: CSharpTypeOptions = {
  useNullable: true,
  useRecordTypes: false,
  useInitOnlySetters: false,
  useSystemTextJson: true,
  useNewtonsoftJson: false,
  generateProperties: true,
  generateConstructors: true,
  generateToString: false,
  generateEquals: false,
  useBackingField: false,
  useExpressionBodiedMembers: true,
  namespace: "GeneratedModels",
  className: "RootObject",
  accessModifier: "public",
  usingDirectives: ["System", "System.Text.Json.Serialization"],
  fileHeader: "",
};

const CSHARP_TYPE_MAPPINGS: Record<string, string> = {
  string: "string",
  number: "double",
  integer: "int",
  boolean: "bool",
  null: "object",
  array: "List",
  object: "object",
  datetime: "DateTime",
  date: "DateOnly",
  time: "TimeOnly",
  guid: "Guid",
  decimal: "decimal",
  float: "float",
  long: "long",
  short: "short",
  byte: "byte",
  uri: "Uri",
};

const CSHARP_RESERVED_KEYWORDS = new Set([
  "abstract",
  "as",
  "base",
  "bool",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "checked",
  "class",
  "const",
  "continue",
  "decimal",
  "default",
  "delegate",
  "do",
  "double",
  "else",
  "enum",
  "event",
  "explicit",
  "extern",
  "false",
  "finally",
  "fixed",
  "float",
  "for",
  "foreach",
  "goto",
  "if",
  "implicit",
  "in",
  "int",
  "interface",
  "internal",
  "is",
  "lock",
  "long",
  "namespace",
  "new",
  "null",
  "object",
  "operator",
  "out",
  "override",
  "params",
  "private",
  "protected",
  "public",
  "readonly",
  "ref",
  "return",
  "sbyte",
  "sealed",
  "short",
  "sizeof",
  "stackalloc",
  "static",
  "string",
  "struct",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "uint",
  "ulong",
  "unchecked",
  "unsafe",
  "ushort",
  "using",
  "virtual",
  "void",
  "volatile",
  "while",
]);

// Enhanced type inference for C#
const inferCSharpType = (
  value: any,
  key: string,
  options: CSharpTypeOptions,
): TypeInferenceResult => {
  let csharpType = "object";
  let isNullable = options.useNullable;
  let attributes: string[] = [];
  let defaultValue: string | undefined;
  let requiresSystemTextJson = false;
  let requiresNewtonsoftJson = false;

  if (value === null || value === undefined) {
    csharpType = "object";
    isNullable = true;
  } else if (Array.isArray(value)) {
    const elementType =
      value.length > 0 ? inferCSharpType(value[0], "", options).csharpType : "object";
    csharpType = `List<${elementType}>`;
    attributes.push(options.useSystemTextJson ? '[JsonPropertyName("' + key + '")]' : "");
  } else if (typeof value === "object") {
    if (value instanceof Date) {
      csharpType = "DateTime";
      isNullable = true;
    } else {
      csharpType = "object";
      // For nested objects, we'll generate a class later
      const className = toPascalCase(key) || "DataObject";
      csharpType = className;
      isNullable = true;
    }
    attributes.push(options.useSystemTextJson ? '[JsonPropertyName("' + key + '")]' : "");
  } else if (typeof value === "string") {
    // Check for special string formats
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      csharpType = "DateTime";
      isNullable = true;
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      csharpType = "DateOnly";
      isNullable = true;
    } else if (value.match(/^\d{2}:\d{2}:\d{2}/)) {
      csharpType = "TimeOnly";
      isNullable = true;
    } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      csharpType = "Guid";
      isNullable = true;
    } else if (value.match(/^https?:\/\//)) {
      csharpType = "Uri";
      isNullable = true;
    } else if (value.match(/^\d+$/)) {
      csharpType = "long";
      isNullable = true;
    } else if (value.match(/^\d*\.\d+$/)) {
      csharpType = "decimal";
      isNullable = true;
    } else {
      csharpType = "string";
      isNullable = false;
    }
    attributes.push(options.useSystemTextJson ? '[JsonPropertyName("' + key + '")]' : "");
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) {
        csharpType = "long";
      } else {
        csharpType = "int";
      }
    } else {
      csharpType = value > 3.4e38 || value < -3.4e38 ? "double" : "float";
    }
    isNullable = options.useNullable;
    attributes.push(options.useSystemTextJson ? '[JsonPropertyName("' + key + '")]' : "");
  } else if (typeof value === "boolean") {
    csharpType = "bool";
    isNullable = options.useNullable;
    attributes.push(options.useSystemTextJson ? '[JsonPropertyName("' + key + '")]' : "");
  }

  return {
    csharpType,
    isNullable,
    attributes: attributes.filter(Boolean),
    defaultValue,
    requiresSystemTextJson,
    requiresNewtonsoftJson,
  };
};

// Enhanced Pascal Case conversion with C# naming conventions
const toPascalCase = (str: string): string => {
  if (!str) return str;

  // Handle special cases and abbreviations
  const abbreviations = ["ID", "URL", "URI", "XML", "JSON", "HTML", "HTTP", "HTTPS", "API"];
  const lowerStr = str.toLowerCase();

  for (const abbr of abbreviations) {
    if (lowerStr === abbr.toLowerCase() || lowerStr.endsWith(abbr.toLowerCase())) {
      const parts = str.toLowerCase().split(abbr.toLowerCase());
      if (parts.length > 1) {
        return parts
          .map((part, index) => (index === parts.length - 1 ? abbr : part))
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("");
      }
    }
  }

  // Convert snake_case, kebab-case, and spaces to PascalCase
  return str
    .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase())
    .replace(/[a-z]([A-Z])/g, (_, char) => char.toLowerCase());
};

// Sanitize C# identifiers
const sanitizeCSharpIdentifier = (str: string): string => {
  let sanitized = toPascalCase(str);

  // Replace invalid characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "_");

  // Ensure it starts with a letter or underscore
  if (sanitized.match(/^\d/)) {
    sanitized = "_" + sanitized;
  }

  // Handle C# reserved keywords
  if (CSHARP_RESERVED_KEYWORDS.has(sanitized)) {
    sanitized = "@" + sanitized;
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = "Property";
  }

  return sanitized;
};

// Generate C# property with enhanced features
const generateCSharpProperty = (
  key: string,
  value: any,
  index: number,
  options: CSharpTypeOptions,
): CSharpPropertyInfo => {
  const typeInfo = inferCSharpType(value, key, options);
  const propertyName = sanitizeCSharpIdentifier(key);
  const propertyType = typeInfo.csharpType + (typeInfo.isNullable ? "?" : "");

  const attributes: string[] = [];
  if (options.useSystemTextJson) {
    attributes.push(`[JsonPropertyName("${key}")]`);
  }
  if (options.useNewtonsoftJson) {
    attributes.push(`[JsonProperty("${key}")]`);
  }

  return {
    name: propertyName,
    type: typeof value,
    csharpType: propertyType,
    isNullable: typeInfo.isNullable,
    defaultValue: typeInfo.defaultValue,
    attributes,
    description: "",
    accessModifier: "public",
    hasSetter: true,
    isInitOnly: options.useInitOnlySetters,
    isVirtual: false,
  };
};

// Generate C# class from object with enhanced features
const generateCSharpClass = (
  obj: any,
  className: string,
  namespace: string,
  options: CSharpTypeOptions,
  usingDirectives: string[] = [],
): CSharpClassInfo => {
  const properties: CSharpPropertyInfo[] = [];
  const requiredUsing = new Set(usingDirectives);

  if (options.useSystemTextJson) {
    requiredUsing.add("System.Text.Json.Serialization");
  }
  if (options.useNewtonsoftJson) {
    requiredUsing.add("Newtonsoft.Json");
  }

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    let index = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__comment__") continue;

      const property = generateCSharpProperty(key, value, index, options);
      properties.push(property);

      // Handle nested objects - they'll need separate classes
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const nestedClassName = toPascalCase(key);
        // This would be handled recursively in a real implementation
        if (options.useSystemTextJson) {
          requiredUsing.add("System.Text.Json.Serialization");
        }
      }

      index++;
    }
  }

  return {
    name: sanitizeCSharpIdentifier(className),
    properties,
    namespace,
    usingDirectives: Array.from(requiredUsing),
    inherits: [],
    attributes: [],
    description: "",
  };
};

// Generate C# code string with enhanced formatting
const generateCSharpCode = (classes: CSharpClassInfo[], config: CSharpGenerationConfig): string => {
  const parts: string[] = [];

  // File header
  if (config.options.fileHeader) {
    parts.push(config.options.fileHeader);
    parts.push("");
  }

  // Using directives
  const allUsing = new Set<string>();
  classes.forEach((cls) => {
    cls.usingDirectives.forEach((u) => allUsing.add(u));
  });
  config.options.usingDirectives.forEach((u) => allUsing.add(u));

  parts.push("// Using directives");
  Array.from(allUsing)
    .sort()
    .forEach((using) => {
      parts.push(`using ${using};`);
    });

  parts.push("");
  parts.push(`namespace ${config.namespace}`);
  parts.push("{");

  // Generate each class
  classes.forEach((cls, index) => {
    parts.push("");

    // Class attributes
    cls.attributes.forEach((attr) => {
      parts.push(`    ${attr}`);
    });

    const recordType = config.options.useRecordTypes ? "record" : "class";
    parts.push(`    ${config.accessModifier} ${recordType} ${cls.name}`);

    // Base classes and interfaces
    if (cls.inherits.length > 0) {
      parts.push(`        : ${cls.inherits.join(", ")}`);
    }

    parts.push("    {");

    // Generate properties
    if (config.options.generateProperties) {
      cls.properties.forEach((prop) => {
        // Property attributes
        prop.attributes.forEach((attr) => {
          parts.push(`        ${attr}`);
        });

        if (config.options.useBackingField) {
          // Backing field with auto-property
          parts.push(`        private ${prop.csharpType} _${prop.name.toLowerCase()};`);
          parts.push("");
          parts.push(`        ${prop.accessModifier} ${prop.csharpType} ${prop.name}`);
          parts.push("        {");
          parts.push(
            `            ${config.options.useExpressionBodiedMembers ? "get => " : "get { return "}_${prop.name.toLowerCase()};${config.options.useExpressionBodiedMembers ? "" : " }"}`,
          );

          if (prop.isInitOnly) {
            parts.push(
              `            ${config.options.useExpressionBodiedMembers ? "init => " : "init { "}_${prop.name.toLowerCase()} = value;${config.options.useExpressionBodiedMembers ? "" : " }"}`,
            );
          } else if (prop.hasSetter) {
            parts.push(
              `            ${config.options.useExpressionBodiedMembers ? "set => " : "set { "}_${prop.name.toLowerCase()} = value;${config.options.useExpressionBodiedMembers ? "" : " }"}`,
            );
          }
          parts.push("        }");
        } else {
          // Auto-property
          const accessors = [];
          accessors.push("get");
          if (prop.isInitOnly) {
            accessors.push("init");
          } else if (prop.hasSetter) {
            accessors.push("set");
          }

          parts.push(
            `        ${prop.accessModifier} ${prop.csharpType} ${prop.name} { ${accessors.join("; ")}; }`,
          );
        }

        if (prop.defaultValue) {
          parts.push(`        = ${prop.defaultValue};`);
        }

        parts.push("");
      });
    }

    // Constructor
    if (config.options.generateConstructors && !config.options.useRecordTypes) {
      const nonNullableProps = cls.properties.filter((p) => !p.isNullable && !p.defaultValue);
      if (nonNullableProps.length > 0) {
        parts.push(
          `        public ${cls.name}(${nonNullableProps.map((p) => `${p.csharpType} ${toCamelCase(p.name)}`).join(", ")})`,
        );
        parts.push("        {");
        nonNullableProps.forEach((prop) => {
          parts.push(`            ${prop.name} = ${toCamelCase(prop.name)};`);
        });
        parts.push("        }");
        parts.push("");
      }
    }

    // ToString override
    if (config.options.generateToString) {
      parts.push("        public override string ToString()");
      parts.push("        {");
      if (cls.properties.length === 0) {
        parts.push('            return $"{typeof(' + cls.name + ').Name} {{}}";');
      } else {
        const propString = cls.properties.map((p) => `${p.name} = {${p.name}}`).join(", ");
        parts.push(`            return $"{typeof(${cls.name}).Name} {{ ${propString} }}";`);
      }
      parts.push("        }");
      parts.push("");
    }

    // Equals and GetHashCode
    if (config.options.generateEquals) {
      parts.push("        public override bool Equals(object? obj)");
      parts.push("        {");
      parts.push(
        "            return obj is " +
          cls.name +
          " other && EqualityComparer<" +
          cls.name +
          ">.Default.Equals(this, other);",
      );
      parts.push("        }");
      parts.push("");

      parts.push("        public override int GetHashCode()");
      parts.push("        {");
      parts.push(
        "            return HashCode.Combine(" +
          cls.properties.map((p) => p.name).join(", ") +
          ");",
      );
      parts.push("        }");
      parts.push("");
    }

    parts.push("    }");
  });

  parts.push("}");

  return parts.join("\n");
};

// Convert to camelCase for constructor parameters
const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Validate and format JSON
const formatJson = (jsonString: string): { isValid: boolean; data?: any; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    return { isValid: true, data };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
};

// Main component props
interface JsonToCSharpProps {
  jsonData?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<CSharpTypeOptions>;
}

export const JsonToCSharp: React.FC<JsonToCSharpProps> = ({
  jsonData,
  onCodeChange,
  className: propsClassName,
  readOnly = false,
  showPreview = true,
  initialOptions = {},
}) => {
  const [jsonInput, setJsonInput] = useState(jsonData || "");
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({
    isValid: true,
  });
  const [options, setOptions] = useState<CSharpTypeOptions>({
    ...DEFAULT_CSHARP_OPTIONS,
    ...initialOptions,
  });
  const [config, setConfig] = useState<CSharpGenerationConfig>({
    rootClassName: options.className,
    namespace: options.namespace,
    accessModifier: options.accessModifier,
    options,
  });

  // Memoized C# class generation
  const generatedClasses = useMemo(() => {
    if (!validation.isValid || !jsonInput.trim()) return [];

    try {
      const parsedData = JSON.parse(jsonInput);
      const rootClass = generateCSharpClass(
        parsedData,
        config.rootClassName,
        config.namespace,
        config.options,
        config.options.usingDirectives,
      );

      return [rootClass]; // In a full implementation, we'd handle nested objects recursively
    } catch (error) {
      return [];
    }
  }, [jsonInput, validation.isValid, config]);

  // Memoized C# code generation
  const generatedCode = useMemo(() => {
    if (!validation.isValid || generatedClasses.length === 0) return "";

    const code = generateCSharpCode(generatedClasses, config);
    return code;
  }, [validation.isValid, generatedClasses, config]);

  // Handle JSON input change
  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    const result = formatJson(value);
    setValidation(result);
  };

  // Update config when options change
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      options: { ...options },
      rootClassName: options.className,
      namespace: options.namespace,
      accessModifier: options.accessModifier,
    }));
  }, [options]);

  // Notify parent of code changes
  useEffect(() => {
    onCodeChange?.(generatedCode);
  }, [generatedCode, onCodeChange]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Download as .cs file
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.rootClassName}.cs`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset to defaults
  const handleReset = () => {
    setOptions(DEFAULT_CSHARP_OPTIONS);
    setJsonInput("");
    setValidation({ isValid: true });
  };

  const className = cn("w-full max-w-6xl mx-auto p-6 space-y-6", propsClassName);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                JSON to C# Converter
                <Badge variant="outline">C# 11</Badge>
              </CardTitle>
              <CardDescription>
                Generate strongly-typed C# classes from JSON with modern .NET features
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!generatedCode || readOnly}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!generatedCode || readOnly}
              >
                <Download className="h-4 w-4 mr-2" />
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
            {/* JSON Input */}
            <div className="space-y-2">
              <Label htmlFor="json-input">JSON Input</Label>
              <textarea
                id="json-input"
                className={cn(
                  "w-full h-64 p-3 font-mono text-sm border rounded-md resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  !validation.isValid && "border-red-500",
                )}
                placeholder="Paste your JSON here..."
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                disabled={readOnly}
              />
              {!validation.isValid && <p className="text-sm text-red-600">{validation.error}</p>}
            </div>

            {/* Configuration Options */}
            <Tabs defaultValue="basic" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="serialization">Serialization</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namespace">Namespace</Label>
                    <input
                      id="namespace"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.namespace}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, namespace: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-name">Class Name</Label>
                    <input
                      id="class-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.className}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, className: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="access-modifier">Access Modifier</Label>
                    <select
                      id="access-modifier"
                      className="w-full p-2 border rounded-md"
                      value={options.accessModifier}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          accessModifier: e.target.value as "public" | "internal" | "private",
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="public">public</option>
                      <option value="internal">internal</option>
                      <option value="private">private</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="nullable"
                      checked={options.useNullable}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useNullable: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="nullable">Enable Nullable Reference Types</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="record-types"
                      checked={options.useRecordTypes}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useRecordTypes: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="record-types">Use Record Types</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="init-only"
                      checked={options.useInitOnlySetters}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useInitOnlySetters: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="init-only">Init-Only Setters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="backing-field"
                      checked={options.useBackingField}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useBackingField: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="backing-field">Use Backing Fields</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="expression-bodied"
                      checked={options.useExpressionBodiedMembers}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useExpressionBodiedMembers: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="expression-bodied">Expression-Bodied Members</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="constructors"
                      checked={options.generateConstructors}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateConstructors: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="constructors">Generate Constructors</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="to-string"
                      checked={options.generateToString}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateToString: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="to-string">Generate ToString()</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="equals"
                      checked={options.generateEquals}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateEquals: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="equals">Generate Equals/GetHashCode</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="serialization" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="system-text-json"
                      checked={options.useSystemTextJson}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useSystemTextJson: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="system-text-json">System.Text.Json</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="newtonsoft"
                      checked={options.useNewtonsoftJson}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useNewtonsoftJson: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="newtonsoft">Newtonsoft.Json</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="using-directives">
                    Additional Using Directives (one per line)
                  </Label>
                  <textarea
                    id="using-directives"
                    className="w-full h-20 p-2 border rounded-md font-mono text-sm"
                    placeholder="System.Collections.Generic&#10;System.Linq&#10;..."
                    value={options.usingDirectives.join("\n")}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        usingDirectives: e.target.value.split("\n").filter((line) => line.trim()),
                      }))
                    }
                    disabled={readOnly}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            {showPreview && generatedCode && (
              <div className="space-y-2">
                <Label>Generated C# Code</Label>
                <ScrollArea className="h-96 w-full border rounded-md">
                  <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                    <code>{generatedCode}</code>
                  </pre>
                </ScrollArea>
              </div>
            )}

            {/* Class Information */}
            {generatedClasses.length > 0 && (
              <div className="space-y-2">
                <Label>Generated Classes</Label>
                <div className="grid gap-2">
                  {generatedClasses.map((cls, index) => (
                    <div key={index} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cls.name}</span>
                        <Badge variant="outline">{cls.properties.length} properties</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {cls.properties
                          .slice(0, 3)
                          .map((p) => p.csharpType)
                          .join(", ")}
                        {cls.properties.length > 3 && ` +${cls.properties.length - 3} more`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonToCSharp;
