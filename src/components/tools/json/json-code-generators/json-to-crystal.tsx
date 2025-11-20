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

// Enhanced type system for Crystal code generation
interface CrystalTypeOptions {
  useStrictTyping: boolean;
  useJSONMapping: boolean;
  useYAMLMapping: boolean;
  useNamedTuple: boolean;
  useStructs: boolean;
  useClasses: boolean;
  useModules: boolean;
  useAnnotations: boolean;
  generateProperties: boolean;
  generateConstructors: boolean;
  generateToJSON: boolean;
  generateFromJSON: boolean;
  crystalVersion:
    | "1.0"
    | "1.1"
    | "1.2"
    | "1.3"
    | "1.4"
    | "1.5"
    | "1.6"
    | "1.7"
    | "1.8"
    | "1.9"
    | "1.10"
    | "1.11"
    | "1.12";
  moduleName: string;
  className: string;
  visibility: "private" | "protected" | "public";
  imports: string[];
  fileHeader: string;
}

interface CrystalGenerationConfig {
  rootClassName: string;
  moduleName: string;
  visibility: "private" | "protected" | "public";
  imports: string[];
  options: CrystalTypeOptions;
}

interface CrystalClassInfo {
  name: string;
  properties: CrystalPropertyInfo[];
  annotations: string[];
  moduleName: string;
  isStruct: boolean;
  isClass: boolean;
  includes: string[];
  extends: string;
  imports: string[];
  description?: string;
}

interface CrystalPropertyInfo {
  name: string;
  type: string;
  crystalType: string;
  isNilable: boolean;
  defaultValue?: string;
  annotations: string[];
  description?: string;
  visibility: string;
  getter: boolean;
  setter: boolean;
}

// Enhanced type inference for Crystal
interface TypeInferenceResult {
  crystalType: string;
  isNilable: boolean;
  defaultValue?: string;
  annotations: string[];
  imports: string[];
}

const DEFAULT_CRYSTAL_OPTIONS: CrystalTypeOptions = {
  useStrictTyping: true,
  useJSONMapping: true,
  useYAMLMapping: false,
  useNamedTuple: false,
  useStructs: true,
  useClasses: false,
  useModules: true,
  useAnnotations: true,
  generateProperties: true,
  generateConstructors: true,
  generateToJSON: true,
  generateFromJSON: true,
  crystalVersion: "1.12",
  moduleName: "GeneratedModels",
  className: "RootObject",
  visibility: "public",
  imports: ["JSON::Serializable"],
  fileHeader: "",
};

const CRYSTAL_TYPE_MAPPINGS: Record<string, string> = {
  string: "String",
  number: "Float64",
  integer: "Int32",
  boolean: "Bool",
  null: "Nil",
  array: "Array",
  object: "Hash",
  datetime: "Time",
  date: "Time",
  time: "Time",
  uuid: "UUID",
  decimal: "BigDecimal",
  float: "Float32",
  long: "Int64",
  short: "Int16",
  byte: "UInt8",
  uri: "URI",
};

const CRYSTAL_RESERVED_KEYWORDS = new Set([
  "abstract",
  "alias",
  "asm",
  "begin",
  "break",
  "case",
  "class",
  "def",
  "do",
  "else",
  "elsif",
  "end",
  "ensure",
  "enum",
  "extend",
  "false",
  "for",
  "fun",
  "if",
  "in",
  "include",
  "instance_sizeof",
  "lib",
  "macro",
  "module",
  "next",
  "nil",
  "of",
  "pointerof",
  "private",
  "protected",
  "rescue",
  "return",
  "select",
  "self",
  "sizeof",
  "struct",
  "super",
  "then",
  "true",
  "type",
  "typeof",
  "uninitialized",
  "unless",
  "until",
  "verbatim_when",
  "when",
  "while",
  "with",
  "yield",
]);

// Enhanced type inference for Crystal
const inferCrystalType = (
  value: any,
  key: string,
  options: CrystalTypeOptions,
): TypeInferenceResult => {
  let crystalType = "JSON::Any";
  let isNilable = false;
  const annotations: string[] = [];
  const imports: string[] = [];

  if (value === null || value === undefined) {
    crystalType = "Nil";
    isNilable = true;
  } else if (Array.isArray(value)) {
    const elementType =
      value.length > 0 ? inferCrystalType(value[0], "", options).crystalType : "JSON::Any";
    crystalType = `Array(${elementType})`;
    isNilable = true;
  } else if (typeof value === "object") {
    if (value instanceof Date) {
      crystalType = "Time";
      isNilable = true;
    } else {
      // For nested objects, we'll generate a struct later
      const className = toPascalCase(key) || "DataObject";
      crystalType = className;
      isNilable = true;
    }
  } else if (typeof value === "string") {
    // Check for special string formats
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      crystalType = "Time";
      isNilable = true;
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      crystalType = "Time";
      isNilable = true;
    } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      crystalType = "UUID";
      isNilable = true;
      imports.push("UUID");
    } else if (value.match(/^https?:\/\//)) {
      crystalType = "URI";
      isNilable = true;
    } else if (value.match(/^\d+$/)) {
      crystalType = "Int64";
      isNilable = false;
    } else if (value.match(/^\d*\.\d+$/)) {
      crystalType = "BigDecimal";
      isNilable = false;
      imports.push("big");
    } else {
      crystalType = "String";
      isNilable = false;
    }
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) {
        crystalType = "Int64";
      } else {
        crystalType = "Int32";
      }
    } else {
      crystalType = "Float64";
    }
    isNilable = false;
  } else if (typeof value === "boolean") {
    crystalType = "Bool";
    isNilable = false;
  }

  return {
    crystalType,
    isNilable,
    annotations,
    imports,
  };
};

// Enhanced PascalCase conversion with Crystal naming conventions
const toPascalCase = (str: string): string => {
  if (!str) return str;

  // Convert snake_case, kebab-case, and spaces to PascalCase
  return str
    .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase())
    .replace(/[a-z]([A-Z])/g, (_, char) => char.toLowerCase());
};

// Convert to snake_case for variable names
const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/^_/, "")
    .toLowerCase();
};

// Sanitize Crystal identifiers
const sanitizeCrystalIdentifier = (str: string): string => {
  let sanitized = str;

  // Replace invalid characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "_");

  // Ensure it starts with a letter or underscore
  if (sanitized.match(/^\d/)) {
    sanitized = "_" + sanitized;
  }

  // Handle Crystal reserved keywords
  if (CRYSTAL_RESERVED_KEYWORDS.has(sanitized)) {
    sanitized = "_" + sanitized;
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = "property";
  }

  return sanitized;
};

// Generate Crystal property with enhanced features
const generateCrystalProperty = (
  key: string,
  value: any,
  index: number,
  options: CrystalTypeOptions,
): CrystalPropertyInfo => {
  const typeInfo = inferCrystalType(value, key, options);
  const propertyName = sanitizeCrystalIdentifier(toSnakeCase(key));
  const propertyType = typeInfo.isNilable ? `${typeInfo.crystalType}?` : typeInfo.crystalType;

  const annotations: string[] = [];
  if (options.useJSONMapping) {
    annotations.push(`@[JSON::Field(key: "${key}")]`);
  }
  if (options.useYAMLMapping) {
    annotations.push(`@[YAML::Field(key: "${key}")]`);
  }

  return {
    name: propertyName,
    type: typeof value,
    crystalType: propertyType,
    isNilable: typeInfo.isNilable,
    defaultValue: typeInfo.defaultValue,
    annotations,
    description: "",
    visibility: options.visibility,
    getter: true,
    setter: true,
  };
};

// Generate Crystal struct/class from object with enhanced features
const generateCrystalClass = (
  obj: any,
  className: string,
  moduleName: string,
  options: CrystalTypeOptions,
  imports: string[] = [],
): CrystalClassInfo => {
  const properties: CrystalPropertyInfo[] = [];
  const requiredImports = new Set(imports);

  // Always add JSON::Serializable for JSON mapping
  if (options.useJSONMapping) {
    requiredImports.add("JSON::Serializable");
  }

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    let index = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__comment__") continue;

      const property = generateCrystalProperty(key, value, index, options);
      properties.push(property);

      // Add required imports from type inference
      const typeInfo = inferCrystalType(value, key, options);
      typeInfo.imports.forEach((imp) => requiredImports.add(imp));

      index++;
    }
  }

  const includes: string[] = [];
  if (options.useJSONMapping) {
    includes.push("JSON::Serializable");
  }
  if (options.useYAMLMapping) {
    includes.push("YAML::Serializable");
  }

  return {
    name: sanitizeCrystalIdentifier(className),
    properties,
    annotations: [],
    moduleName,
    isStruct: options.useStructs,
    isClass: options.useClasses,
    includes,
    extends: "",
    imports: Array.from(requiredImports),
    description: "",
  };
};

// Generate Crystal code string with enhanced formatting
const generateCrystalCode = (
  classes: CrystalClassInfo[],
  config: CrystalGenerationConfig,
): string => {
  const parts: string[] = [];
  const options = config.options;

  // File header
  if (options.fileHeader) {
    parts.push(options.fileHeader);
    parts.push("");
  }

  // Requires
  const allImports = new Set<string>();
  classes.forEach((cls) => {
    cls.imports.forEach((imp) => allImports.add(imp));
    config.imports.forEach((imp) => allImports.add(imp));
  });

  Array.from(allImports)
    .sort()
    .forEach((imp) => {
      parts.push(`require "${imp}"`);
    });

  parts.push("");

  // Module wrapper
  if (options.useModules && config.moduleName) {
    parts.push(`module ${config.moduleName}`);
    parts.push("");
  }

  // Generate each class
  classes.forEach((cls, index) => {
    parts.push("");

    // Class/Struct annotations
    cls.annotations.forEach((annotation) => {
      parts.push(`${annotation}`);
    });

    // Class/Struct declaration
    const typeKeyword = cls.isStruct ? "struct" : "class";
    parts.push(`${typeKeyword} ${cls.name}`);

    // Includes
    if (cls.includes.length > 0) {
      cls.includes.forEach((include) => {
        parts.push(`  include ${include}`);
      });
    }

    parts.push("  # Properties");

    // Properties
    cls.properties.forEach((prop) => {
      // Property annotations
      if (prop.annotations.length > 0) {
        prop.annotations.forEach((annotation) => {
          parts.push(`  ${annotation}`);
        });
      }

      parts.push(`  ${prop.visibility} property ${prop.name} : ${prop.crystalType}`);
    });

    parts.push("");

    // Constructor if needed
    if (options.generateConstructors) {
      const nonNilableProps = cls.properties.filter((p) => !p.isNilable);
      if (nonNilableProps.length > 0) {
        parts.push("  def initialize(");
        nonNilableProps.slice(0, -1).forEach((prop) => {
          parts.push(`    @${prop.name} : ${prop.crystalType},`);
        });
        if (nonNilableProps.length > 0) {
          const lastProp = nonNilableProps[nonNilableProps.length - 1];
          parts.push(`    @${lastProp.name} : ${lastProp.crystalType}`);
        }
        parts.push("  )");
        parts.push("  end");
        parts.push("");
      }
    }

    // Custom methods if needed
    if (options.generateFromJSON || options.generateToJSON) {
      parts.push("  # Custom methods can be added here");
      parts.push("");
    }

    parts.push("end");
  });

  // Close module
  if (options.useModules && config.moduleName) {
    parts.push("end");
  }

  return parts.join("\n");
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
interface JsonToCrystalProps {
  jsonData?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<CrystalTypeOptions>;
}

export const JsonToCrystal: React.FC<JsonToCrystalProps> = ({
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
  const [options, setOptions] = useState<CrystalTypeOptions>({
    ...DEFAULT_CRYSTAL_OPTIONS,
    ...initialOptions,
  });
  const [config, setConfig] = useState<CrystalGenerationConfig>({
    rootClassName: options.className,
    moduleName: options.moduleName,
    visibility: options.visibility,
    imports: options.imports,
    options,
  });

  // Memoized Crystal class generation
  const generatedClasses = useMemo(() => {
    if (!validation.isValid || !jsonInput.trim()) return [];

    try {
      const parsedData = JSON.parse(jsonInput);
      const rootClass = generateCrystalClass(
        parsedData,
        config.rootClassName,
        config.moduleName,
        config.options,
        config.imports,
      );

      return [rootClass]; // In a full implementation, we'd handle nested objects recursively
    } catch (error) {
      return [];
    }
  }, [jsonInput, validation.isValid, config]);

  // Memoized Crystal code generation
  const generatedCode = useMemo(() => {
    if (!validation.isValid || generatedClasses.length === 0) return "";

    const code = generateCrystalCode(generatedClasses, config);
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
      moduleName: options.moduleName,
      visibility: options.visibility,
      imports: options.imports,
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

  // Download as .cr file
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.rootClassName}.cr`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset to defaults
  const handleReset = () => {
    setOptions(DEFAULT_CRYSTAL_OPTIONS);
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
                JSON to Crystal Converter
                <Badge variant="outline">Crystal {options.crystalVersion}</Badge>
              </CardTitle>
              <CardDescription>
                Generate Crystal structs and classes from JSON with JSON mapping support
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
                  <TabsTrigger value="type">Type Options</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crystal-version">Crystal Version</Label>
                    <select
                      id="crystal-version"
                      className="w-full p-2 border rounded-md"
                      value={options.crystalVersion}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          crystalVersion: e.target.value as CrystalTypeOptions["crystalVersion"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="1.12">Crystal 1.12</option>
                      <option value="1.11">Crystal 1.11</option>
                      <option value="1.10">Crystal 1.10</option>
                      <option value="1.9">Crystal 1.9</option>
                      <option value="1.8">Crystal 1.8</option>
                      <option value="1.7">Crystal 1.7</option>
                      <option value="1.6">Crystal 1.6</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-name">Class/Struct Name</Label>
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
                    <Label htmlFor="module-name">Module Name</Label>
                    <input
                      id="module-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.moduleName}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, moduleName: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      className="w-full p-2 border rounded-md"
                      value={options.visibility}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          visibility: e.target.value as CrystalTypeOptions["visibility"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="public">public</option>
                      <option value="protected">protected</option>
                      <option value="private">private</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="strict-typing"
                      checked={options.useStrictTyping}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useStrictTyping: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="strict-typing">Strict Typing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="modules"
                      checked={options.useModules}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useModules: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="modules">Use Modules</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="annotations"
                      checked={options.useAnnotations}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useAnnotations: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="annotations">Use Annotations</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="type" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="structs"
                      checked={options.useStructs}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useStructs: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="structs">Generate Structs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="classes"
                      checked={options.useClasses}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useClasses: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="classes">Generate Classes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="named-tuple"
                      checked={options.useNamedTuple}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useNamedTuple: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="named-tuple">Named Tuples</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="properties"
                      checked={options.generateProperties}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateProperties: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="properties">Generate Properties</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="json-mapping"
                      checked={options.useJSONMapping}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useJSONMapping: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="json-mapping">JSON Mapping</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="yaml-mapping"
                      checked={options.useYAMLMapping}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useYAMLMapping: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="yaml-mapping">YAML Mapping</Label>
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
                      id="to-json"
                      checked={options.generateToJSON}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateToJSON: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="to-json">Generate to_json</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="from-json"
                      checked={options.generateFromJSON}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateFromJSON: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="from-json">Generate from_json</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            {showPreview && generatedCode && (
              <div className="space-y-2">
                <Label>Generated Crystal Code</Label>
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
                        <span className="font-medium">
                          {cls.isStruct ? "struct" : cls.isClass ? "class" : "struct"} {cls.name}
                        </span>
                        <Badge variant="outline">{cls.properties.length} properties</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {cls.includes.length > 0 && `includes: ${cls.includes.join(", ")}`}
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

export default JsonToCrystal;
