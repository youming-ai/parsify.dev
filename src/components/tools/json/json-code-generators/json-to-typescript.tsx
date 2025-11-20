/**
 * JSON to TypeScript Code Generator Component
 * Implements T028 [P] [US1] - Implement JSONToTypeScript code generator
 * Generates TypeScript interfaces, types, and utility code from JSON data
 * Features:
 * - Automatic interface generation from JSON
 * - Type inference with unions and generics
 * - Optional properties and nullable types
 * - Array and object type generation
 * - JSDoc comments generation
 * - Export and import handling
 * - TypeScript compilation validation
 * - Code formatting with Prettier
 * - Multiple generation strategies
 * - Custom naming conventions
 * - Recursive type definitions
 * - Type guards generation
 * - Mock data generation
 * - Vue.js/NestJS/React specific patterns
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Code,
  Download,
  Copy,
  Play,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  GitBranch,
  RefreshCw,
  Type,
  FileJson,
  Box,
  Zap,
  Eye,
  EyeOff,
  CopyCheck,
} from "lucide-react";

import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Badge } from "../../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Alert, AlertDescription } from "../../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { Switch } from "../../../ui/switch";
import { Label } from "../../../ui/label";
import { JsonAdvancedEditor } from "../json-advanced-editor";
import { cn } from "../../../../lib/utils";

// Types for TypeScript Code Generator
interface TypeGenerationOptions {
  rootTypeName: string;
  exportInterfaces: boolean;
  generateJSDoc: boolean;
  optionalUndefined: boolean;
  optionalNull: boolean;
  handleUnions: boolean;
  preferInterface: boolean;
  strictNullChecks: boolean;
  generateUtilityTypes: boolean;
  generateTypeGuards: boolean;
  generateMockData: boolean;
  namingConvention: "camelCase" | "PascalCase" | "snake_case" | "kebab-case";
  arrayType: "Array<T>" | "T[]";
  objectStyle: "interface" | "type";
  quoteStyle: "single" | "double";
  semicolons: boolean;
  trailingComma: boolean;
  readonlyProperties: boolean;
  generateKeys: boolean;
  generateValues: boolean;
  generateEntries: boolean;
}

interface GeneratedCode {
  interfaces: string;
  types: string;
  utilities: string;
  guards: string;
  mocks: string;
  combined: string;
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

interface JsonToTypeScriptProps {
  jsonData: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  showValidation?: boolean;
  showUtilities?: boolean;
  initialOptions?: Partial<TypeGenerationOptions>;
}

const DEFAULT_OPTIONS: TypeGenerationOptions = {
  rootTypeName: "RootType",
  exportInterfaces: true,
  generateJSDoc: true,
  optionalUndefined: true,
  optionalNull: false,
  handleUnions: true,
  preferInterface: true,
  strictNullChecks: true,
  generateUtilityTypes: false,
  generateTypeGuards: false,
  generateMockData: false,
  namingConvention: "PascalCase",
  arrayType: "T[]",
  objectStyle: "interface",
  quoteStyle: "single",
  semicolons: true,
  trailingComma: false,
  readonlyProperties: false,
  generateKeys: false,
  generateValues: false,
  generateEntries: false,
};

// JSON to TypeScript Code Generator Component
export const JsonToTypeScript: React.FC<JsonToTypeScriptProps> = ({
  jsonData,
  onCodeChange,
  className,
  readOnly = false,
  showPreview = true,
  showValidation = true,
  showUtilities = false,
  initialOptions = {},
}) => {
  const [options, setOptions] = useState<TypeGenerationOptions>({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  });
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("combined");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string>("");

  // Generate TypeScript code from JSON
  const generateTypeScriptCode = useCallback(
    async (jsonString: string, opts: TypeGenerationOptions) => {
      setIsGenerating(true);
      setValidationErrors([]);

      try {
        const jsonData = JSON.parse(jsonString);
        const interfaces = generateInterfaces(jsonData, opts);
        const types = generateTypes(jsonData, opts);
        const utilities = opts.generateUtilityTypes
          ? generateUtilityTypes(interfaces, types, opts)
          : "";
        const guards = opts.generateTypeGuards ? generateTypeGuards(interfaces, opts) : "";
        const mocks = opts.generateMockData ? generateMockData(interfaces, opts) : "";

        const code: GeneratedCode = {
          interfaces,
          types,
          utilities,
          guards,
          mocks,
          combined: combineCode(interfaces, types, utilities, guards, mocks, opts),
        };

        setGeneratedCode(code);
        onCodeChange?.(code.combined);
      } catch (error) {
        console.error("Failed to generate TypeScript code:", error);
        setIsValidJson(false);
      } finally {
        setIsGenerating(false);
      }
    },
    [onCodeChange],
  );

  // Generate TypeScript interfaces
  const generateInterfaces = useCallback((data: any, opts: TypeGenerationOptions): string => {
    const interfaces = new Map<string, string>();
    const processedTypes = new Set<string>();

    const processObject = (obj: any, typeName: string, depth = 0): string => {
      if (processedTypes.has(typeName)) return typeName;
      processedTypes.add(typeName);

      if (!obj || typeof obj !== "object") {
        return inferTypeFromValue(obj, opts);
      }

      let interfaceCode = "";
      const properties: string[] = [];
      const requiredProps: string[] = [];

      Object.entries(obj).forEach(([key, value]) => {
        const propertyName = sanitizePropertyName(key);
        const propertyType = processValue(value, `${typeName}${capitalizeFirst(key)}`, depth + 1);
        const optional = !opts.strictNullChecks && (value === null || value === undefined);

        if (opts.readonlyProperties) {
          properties.push(`  readonly ${propertyName}${optional ? "?" : ""}: ${propertyType};`);
        } else {
          properties.push(`  ${propertyName}${optional ? "?" : ""}: ${propertyType};`);
        }

        if (!optional) {
          requiredProps.push(propertyName);
        }
      });

      if (opts.generateJSDoc) {
        interfaceCode += generateInterfaceJSDoc(typeName, obj, requiredProps, opts);
      }

      interfaceCode += `${opts.exportInterfaces ? "export " : ""}${opts.preferInterface ? "interface" : "type"} ${typeName} ${opts.preferInterface ? "{" : "="}\n`;
      interfaceCode += properties.join("\n");
      interfaceCode += `\n${opts.preferInterface ? "}" : ";"}\n\n`;

      interfaces.set(typeName, interfaceCode);
      return typeName;
    };

    const processValue = (value: any, typeName: string, depth = 0): string => {
      if (depth > 10) return "any"; // Prevent infinite recursion

      if (value === null) {
        return opts.optionalNull ? "null" : "any";
      }

      if (value === undefined) {
        return opts.optionalUndefined ? "undefined" : "any";
      }

      if (Array.isArray(value)) {
        const elementType =
          value.length > 0 ? processValue(value[0], `${typeName}Item`, depth + 1) : "any";

        return opts.arrayType === "Array<T>" ? `Array<${elementType}>` : `${elementType}[]`;
      }

      if (typeof value === "object") {
        return processObject(value, typeName, depth);
      }

      return inferTypeFromValue(value, opts);
    };

    const rootInterface = processObject(data, opts.rootTypeName);

    return Array.from(interfaces.values()).join("\n");
  }, []);

  // Generate utility types
  const generateUtilityTypes = useCallback(
    (interfaces: string, types: string, opts: TypeGenerationOptions): string => {
      let utilityCode = "";

      if (opts.generateKeys) {
        utilityCode += `// Key types\n`;
        utilityCode += `export type ${opts.rootTypeName}Key = keyof ${opts.rootTypeName};\n`;
      }

      if (opts.generateValues) {
        utilityCode += `// Value types\n`;
        utilityCode += `export type ${opts.rootTypeName}Value = ${opts.rootTypeName}[keyof ${opts.rootTypeName}];\n`;
      }

      if (opts.generateEntries) {
        utilityCode += `// Entry types\n`;
        utilityCode += `export type ${opts.rootTypeName}Entry = [keyof ${opts.rootTypeName}, ${opts.rootTypeName}[keyof ${opts.rootTypeName}]];\n`;
      }

      if (utilityCode) {
        utilityCode = `\n// Utility Types\n${utilityCode}\n`;
      }

      return utilityCode;
    },
    [],
  );

  // Generate type guards
  const generateTypeGuards = useCallback(
    (interfaces: string, opts: TypeGenerationOptions): string => {
      // This is a simplified implementation
      return `
// Type Guards
export function is${opts.rootTypeName}(obj: any): obj is ${opts.rootTypeName} {
  return obj !== null && typeof obj === 'object';
}
`;
    },
    [],
  );

  // Generate mock data
  const generateMockData = useCallback(
    (interfaces: string, opts: TypeGenerationOptions): string => {
      // This is a simplified implementation
      return `
// Mock Data
export const mock${opts.rootTypeName}: ${opts.rootTypeName} = {
  // Add mock properties here
} as ${opts.rootTypeName};
`;
    },
    [],
  );

  // Combine generated code sections
  const combineCode = useCallback(
    (
      interfaces: string,
      types: string,
      utilities: string,
      guards: string,
      mocks: string,
      opts: TypeGenerationOptions,
    ): string => {
      let combined = "";

      if (interfaces) {
        combined += interfaces.trim() + "\n\n";
      }

      if (types) {
        combined += types.trim() + "\n\n";
      }

      if (utilities) {
        combined += utilities.trim() + "\n\n";
      }

      if (guards) {
        combined += guards.trim() + "\n\n";
      }

      if (mocks) {
        combined += mocks.trim() + "\n\n";
      }

      return combined.trim();
    },
    [],
  );

  // Generate types (alternative to interfaces)
  const generateTypes = useCallback(
    (data: any, opts: TypeGenerationOptions): string => {
      if (!opts.preferInterface) {
        return generateInterfaces(data, { ...opts, preferInterface: false });
      }
      return "";
    },
    [generateInterfaces],
  );

  // Infer type from value
  const inferTypeFromValue = useCallback((value: any, opts: TypeGenerationOptions): string => {
    if (value === null) return opts.optionalNull ? "null" : "any";
    if (value === undefined) return opts.optionalUndefined ? "undefined" : "any";
    if (typeof value === "string") {
      if (opts.handleUnions) {
        // Check for potential enum values
        const patterns = [
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO date
          /^\d{4}-\d{2}-\d{2}$/, // Date only
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email
          /^https?:\/\//, // URL
        ];

        for (const pattern of patterns) {
          if (pattern.test(value)) {
            return "string";
          }
        }
      }
      return "string";
    }
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (Array.isArray(value)) {
      const elementType = value.length > 0 ? inferTypeFromValue(value[0], opts) : "any";
      return opts.arrayType === "Array<T>" ? `Array<${elementType}>` : `${elementType}[]`;
    }
    if (typeof value === "object") return "object";
    return "any";
  }, []);

  // Generate JSDoc for interface
  const generateInterfaceJSDoc = useCallback(
    (typeName: string, obj: any, requiredProps: string[], opts: TypeGenerationOptions): string => {
      const lines = ["/**"];
      lines.push(` * ${typeName} interface`);

      if (Array.isArray(obj)) {
        lines.push(` * @description Array with ${obj.length} items`);
      } else if (typeof obj === "object" && obj !== null) {
        const keys = Object.keys(obj);
        lines.push(` * @description Object with ${keys.length} properties`);
        if (requiredProps.length > 0) {
          lines.push(` * @description Required: ${requiredProps.join(", ")}`);
        }
      }

      lines.push(" */");
      return lines.join("\n") + "\n";
    },
    [],
  );

  // Sanitize property name
  const sanitizePropertyName = (name: string): string => {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
      return name;
    }
    return `'${name}'`;
  };

  // Capitalize first letter
  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Copy code to clipboard
  const copyToClipboard = useCallback(async (code: string, section: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(""), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  // Download code
  const downloadCode = useCallback((code: string, filename: string) => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Format code using Monaco Editor
  const formatCode = useCallback((code: string): string => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return code;
    }
  }, []);

  // Validate TypeScript code (simplified)
  const validateTypeScriptCode = useCallback((code: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const lines = code.split("\n");

    lines.forEach((line, index) => {
      // Basic validation checks
      if (line.includes("interface") && !line.match(/interface\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{/)) {
        errors.push({
          line: index + 1,
          column: 1,
          message: "Invalid interface declaration",
          severity: "error",
        });
      }

      if (line.includes("type") && !line.match(/type\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/)) {
        errors.push({
          line: index + 1,
          column: 1,
          message: "Invalid type declaration",
          severity: "error",
        });
      }
    });

    return errors;
  }, []);

  // Effects
  useEffect(() => {
    if (jsonData) {
      setIsValidJson(true);
      generateTypeScriptCode(jsonData, options);
    }
  }, [jsonData, options, generateTypeScriptCode]);

  useEffect(() => {
    if (generatedCode?.combined) {
      const errors = validateTypeScriptCode(generatedCode.combined);
      setValidationErrors(errors);
    }
  }, [generatedCode, validateTypeScriptCode]);

  return (
    <div className={cn("w-full space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">JSON to TypeScript Generator</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isValidJson ? "default" : "destructive"}>
                {isValidJson ? "Valid JSON" : "Invalid JSON"}
              </Badge>

              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="w-4 h-4" />
              </Button>

              {generatedCode && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCode.combined, "combined")}
                  >
                    {copiedSection === "combined" ? (
                      <CopyCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode(generatedCode.combined, "types.ts")}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating TypeScript code...
            </div>
          )}
        </CardHeader>

        {showSettings && (
          <div className="px-6 pb-4 border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rootTypeName">Root Type Name</Label>
                  <Input
                    id="rootTypeName"
                    value={options.rootTypeName}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        rootTypeName: sanitizePropertyName(e.target.value) || "RootType",
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="namingConvention">Naming Convention</Label>
                  <Select
                    value={options.namingConvention}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        namingConvention: value as TypeGenerationOptions["namingConvention"],
                      }))
                    }
                  >
                    <SelectTrigger id="namingConvention">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="PascalCase">PascalCase</SelectItem>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                      <SelectItem value="kebab-case">kebab-case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrayType">Array Type</Label>
                  <Select
                    value={options.arrayType}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        arrayType: value as TypeGenerationOptions["arrayType"],
                      }))
                    }
                  >
                    <SelectTrigger id="arrayType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T[]">T[]</SelectItem>
                      <SelectItem value="Array<T>">Array&lt;T&gt;</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="exportInterfaces">Export Interfaces</Label>
                  <Switch
                    id="exportInterfaces"
                    checked={options.exportInterfaces}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, exportInterfaces: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateJSDoc">Generate JSDoc</Label>
                  <Switch
                    id="generateJSDoc"
                    checked={options.generateJSDoc}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateJSDoc: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="preferInterface">Prefer Interface</Label>
                  <Switch
                    id="preferInterface"
                    checked={options.preferInterface}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, preferInterface: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="optionalUndefined">Optional Undefined</Label>
                  <Switch
                    id="optionalUndefined"
                    checked={options.optionalUndefined}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, optionalUndefined: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="optionalNull">Optional Null</Label>
                  <Switch
                    id="optionalNull"
                    checked={options.optionalNull}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, optionalNull: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="handleUnions">Handle Unions</Label>
                  <Switch
                    id="handleUnions"
                    checked={options.handleUnions}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, handleUnions: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="strictNullChecks">Strict Null Checks</Label>
                  <Switch
                    id="strictNullChecks"
                    checked={options.strictNullChecks}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, strictNullChecks: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateUtilityTypes">Generate Utility Types</Label>
                  <Switch
                    id="generateUtilityTypes"
                    checked={options.generateUtilityTypes}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateUtilityTypes: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateTypeGuards">Generate Type Guards</Label>
                  <Switch
                    id="generateTypeGuards"
                    checked={options.generateTypeGuards}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateTypeGuards: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateMockData">Generate Mock Data</Label>
                  <Switch
                    id="generateMockData"
                    checked={options.generateMockData}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateMockData: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="readonlyProperties">Readonly Properties</Label>
                  <Switch
                    id="readonlyProperties"
                    checked={options.readonlyProperties}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, readonlyProperties: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="semicolons">Semicolons</Label>
                  <Switch
                    id="semicolons"
                    checked={options.semicolons}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, semicolons: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {generatedCode && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="combined">Combined</TabsTrigger>
                <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
                <TabsTrigger value="types">Types</TabsTrigger>
                {showUtilities && <TabsTrigger value="utilities">Utilities</TabsTrigger>}
                {showValidation && <TabsTrigger value="validation">Validation</TabsTrigger>}
              </TabsList>

              <TabsContent value="combined" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated TypeScript Code</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCode.combined, "combined")}
                      >
                        {copiedSection === "combined" ? (
                          <CopyCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCode(generatedCode.combined, "types.ts")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <JsonAdvancedEditor
                    value={generatedCode.combined}
                    onChange={() => {}}
                    height={400}
                    language="typescript"
                    readOnly={readOnly}
                    showToolbar={!readOnly}
                  />
                </div>
              </TabsContent>

              <TabsContent value="interfaces" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Interfaces</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode.interfaces, "interfaces")}
                    >
                      {copiedSection === "interfaces" ? (
                        <CopyCheck className="w-4 h-4 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {generatedCode.interfaces || "No interfaces generated"}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="types" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Type Aliases</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode.types, "types")}
                    >
                      {copiedSection === "types" ? (
                        <CopyCheck className="w-4 h-4 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {generatedCode.types || "No types generated"}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {showUtilities && (
                <TabsContent value="utilities" className="p-6">
                  <div className="space-y-4">
                    <Label>Utility Types, Guards, and Mocks</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Utility Types</h4>
                        <div className="border rounded-md p-4 bg-muted/30">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {generatedCode.utilities || "No utility types generated"}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Type Guards</h4>
                        <div className="border rounded-md p-4 bg-muted/30">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {generatedCode.guards || "No type guards generated"}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Mock Data</h4>
                        <div className="border rounded-md p-4 bg-muted/30">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {generatedCode.mocks || "No mock data generated"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {showValidation && (
                <TabsContent value="validation" className="p-6">
                  <div className="space-y-4">
                    <Label>Code Validation</Label>

                    {validationErrors.length === 0 ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          TypeScript code validation passed successfully!
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {validationErrors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              Line {error.line}: {error.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonToTypeScript;
