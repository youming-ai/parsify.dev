/**
 * JSON to Go Struct Generator Component
 * Implements T029 [P] [US1] - Create JSONToGo struct generator with proper naming conventions
 * Generates Go structs from JSON data with proper Go conventions and types
 * Features:
 * - Automatic struct generation with proper naming
 * - JSON tags generation with omitempty options
 * - Type inference with Go-specific types
 * - Pointer types for optional fields
 * - Custom type mapping configuration
 * - Support for nested structs and slices
 * - Proper import statement generation
 * - Validation tags generation
 * - Go package configuration
 * - Code formatting with gofmt
 * - Exportable and unexportable field options
 * - Support for custom field tags
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
  Package,
} from "lucide-react";

import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Badge } from "../../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Alert, AlertDescription } from "../../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { JsonAdvancedEditor } from "../json-advanced-editor";
import { cn } from "../../../../lib/utils";

// Types for JSON to Go struct generator
interface GoGenerationOptions {
  packageName: string;
  structName: string;
  fieldNaming: "camelCase" | "snake_case" | "pascalCase" | "keepOriginal";
  typeMapping: "strict" | "loose" | "custom";
  usePointers: boolean;
  useOmitempty: boolean;
  generateJsonTags: boolean;
  generateValidationTags: boolean;
  generateImports: boolean;
  exportStructs: boolean;
  generateMethods: boolean;
  generateConstructors: boolean;
  generateStringer: boolean;
  generateInterfaces: boolean;
  customTypeMapping: Record<string, string>;
  omitEmptyFields: string[];
  requiredFields: string[];
  fieldComments: boolean;
  structComments: boolean;
  inlineAnonymousStructs: boolean;
  handleTimeFormat: "string" | "time.Time";
  handleNumbers: "default" | "int" | "float64" | "interface{}";
  handleUnknown: "interface{}" | "any";
  generateUnmarshalJSON: boolean;
  generateMarshalJSON: boolean;
}

interface GoTypeInfo {
  goType: string;
  isPointer: boolean;
  isSlice: boolean;
  isMap: boolean;
  jsonTag: string;
  validationTag: string;
  comment?: string;
}

interface JsonToGoProps {
  jsonData: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<GoGenerationOptions>;
}

const DEFAULT_OPTIONS: GoGenerationOptions = {
  packageName: "main",
  structName: "RootStruct",
  fieldNaming: "camelCase",
  typeMapping: "strict",
  usePointers: false,
  useOmitempty: true,
  generateJsonTags: true,
  generateValidationTags: false,
  generateImports: true,
  exportStructs: true,
  generateMethods: false,
  generateConstructors: false,
  generateStringer: false,
  generateInterfaces: false,
  customTypeMapping: {},
  omitEmptyFields: [],
  requiredFields: [],
  fieldComments: true,
  structComments: true,
  inlineAnonymousStructs: false,
  handleTimeFormat: "string",
  handleNumbers: "default",
  handleUnknown: "interface{}",
  generateUnmarshalJSON: false,
  generateMarshalJSON: false,
};

// Type mapping from JSON to Go
const JSON_TO_GO_TYPES: Record<string, string> = {
  string: "string",
  number: "float64",
  integer: "int",
  boolean: "bool",
  null: "interface{}",
  array: "[]",
  object: "struct",
  email: "string",
  url: "string",
  date: "string",
  datetime: "time.Time",
  uuid: "string",
  timestamp: "int64",
};

// JSON to Go Struct Generator Component
export const JsonToGo: React.FC<JsonToGoProps> = ({
  jsonData,
  onCodeChange,
  className,
  readOnly = false,
  showPreview = true,
  initialOptions = {},
}) => {
  const [options, setOptions] = useState<GoGenerationOptions>({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  });
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isValidJson, setIsValidJson] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typeMappingDialog, setTypeMappingDialog] = useState(false);
  const [customTypeMapping, setCustomTypeMapping] = useState<Record<string, string>>({});

  // Generate Go structs from JSON
  const generateGoStructs = useCallback(
    async (jsonString: string, opts: GoGenerationOptions) => {
      setIsGenerating(true);

      try {
        const jsonData = JSON.parse(jsonString);
        const goCode = generateGoCode(jsonData, opts);
        setGeneratedCode(goCode);
        onCodeChange?.(goCode);
      } catch (error) {
        console.error("Failed to generate Go structs:", error);
        setIsValidJson(false);
      } finally {
        setIsGenerating(false);
      }
    },
    [onCodeChange],
  );

  // Main Go code generation
  const generateGoCode = useCallback((data: any, opts: GoGenerationOptions): string => {
    const structs = generateStructs(data, opts);
    const imports = generateImports(structs, opts);
    const methods = generateMethods(structs, opts);

    let code = "";

    // Package declaration
    if (opts.packageName) {
      code += `package ${opts.packageName}\n\n`;
    }

    // Imports
    if (imports.length > 0 && opts.generateImports) {
      code += `import (\n`;
      code += imports.map((imp) => `    "${imp}"`).join("\n");
      code += `\n)\n\n`;
    }

    // Structs
    code += structs.join("\n\n");

    // Methods
    if (methods.length > 0 && opts.generateMethods) {
      code += "\n\n" + methods.join("\n\n");
    }

    return code;
  }, []);

  // Generate structs from JSON data
  const generateStructs = useCallback(
    (data: any, opts: GoGenerationOptions, parentName = "", depth = 0): string[] => {
      if (depth > 10) return []; // Prevent infinite recursion

      const structs: string[] = [];
      const structName =
        opts.structName || (parentName ? `${capitalizeFirst(parentName)}Struct` : "RootStruct");

      if (Array.isArray(data)) {
        // Handle arrays - generate struct for array elements if they're objects
        if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
          const elementStructName = `${structName}Item`;
          const elementStructs = generateStructs(data[0], opts, elementStructName, depth + 1);
          structs.push(...elementStructs);

          // Add slice type definition
          const sliceType = `${elementStructName}[]`;
          return structs;
        }
        return structs;
      }

      if (typeof data === "object" && data !== null) {
        const fields = generateStructFields(data, opts, structName, depth);
        const structDefinition = generateStructDefinition(structName, fields, opts);
        structs.push(structDefinition);

        // Generate nested structs for objects
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const fieldName = formatFieldName(key, opts);
            const nestedStructName = `${capitalizeFirst(fieldName)}`;
            const nestedStructs = generateStructs(value, opts, nestedStructName, depth + 1);
            structs.push(...nestedStructs);
          } else if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object" &&
            value[0] !== null
          ) {
            const itemStructName = `${capitalizeFirst(formatFieldName(key, opts))}Item`;
            const itemStructs = generateStructs(value[0], opts, itemStructName, depth + 1);
            structs.push(...itemStructs);
          }
        });
      }

      return structs;
    },
    [],
  );

  // Generate struct fields
  const generateStructFields = useCallback(
    (obj: any, opts: GoGenerationOptions, structName: string, depth: number): string[] => {
      const fields: string[] = [];

      Object.entries(obj).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts, structName, depth);
        const fieldDefinition = generateFieldDefinition(fieldInfo, opts);
        fields.push(fieldDefinition);
      });

      return fields;
    },
    [],
  );

  // Generate field information
  const generateFieldInfo = useCallback(
    (
      key: string,
      value: any,
      opts: GoGenerationOptions,
      structName: string,
      depth: number,
    ): GoTypeInfo => {
      const fieldName = formatFieldName(key, opts);
      const jsonKey = key;

      // Determine Go type
      let goType: string;
      let isPointer = opts.usePointers && !opts.requiredFields.includes(key);
      let isSlice = false;
      let isMap = false;

      if (value === null) {
        goType = opts.handleUnknown;
      } else if (Array.isArray(value)) {
        isSlice = true;
        if (value.length > 0) {
          const elementType = inferGoType(value[0], opts);
          goType = `[]${elementType}`;
        } else {
          goType = "[]interface{}";
        }
      } else if (typeof value === "object") {
        const nestedStructName = `${capitalizeFirst(fieldName)}`;
        goType = nestedStructName;
      } else {
        goType = inferGoType(value, opts);
      }

      // Apply custom type mapping
      if (opts.customTypeMapping[jsonKey]) {
        goType = opts.customTypeMapping[jsonKey];
      }

      // Generate JSON tag
      const jsonTag = generateJsonTag(jsonKey, opts, value);

      // Generate validation tag
      const validationTag = opts.generateValidationTags
        ? generateValidationTag(jsonKey, value, opts)
        : "";

      return {
        goType,
        isPointer,
        isSlice,
        isMap,
        jsonTag,
        validationTag,
      };
    },
    [],
  );

  // Generate field definition
  const generateFieldDefinition = useCallback(
    (fieldInfo: GoTypeInfo, opts: GoGenerationOptions): string => {
      const fieldName = formatFieldName(fieldInfo.jsonTag.split(",")[0], opts);
      let goType = fieldInfo.goType;

      if (fieldInfo.isPointer) {
        goType = `*${goType}`;
      }

      const tags = [];
      if (fieldInfo.jsonTag && opts.generateJsonTags) {
        tags.push(`json:"${fieldInfo.jsonTag}"`);
      }
      if (fieldInfo.validationTag) {
        tags.push(`validate:"${fieldInfo.validationTag}"`);
      }

      const tagString = tags.length > 0 ? ` \`${tags.join(" ")}\`` : "";

      // Generate field comment if enabled
      let comment = "";
      if (opts.fieldComments && fieldInfo.comment) {
        comment = `// ${fieldInfo.comment}\n    `;
      }

      return `${comment}${fieldName} ${goType}${tagString}`;
    },
    [],
  );

  // Generate struct definition
  const generateStructDefinition = useCallback(
    (structName: string, fields: string[], opts: GoGenerationOptions): string => {
      const exportableName = opts.exportStructs ? capitalizeFirst(structName) : structName;

      let definition = "";

      // Generate struct comment
      if (opts.structComments) {
        definition += `// ${exportableName} represents the structure\n`;
      }

      definition += `type ${exportableName} struct {\n`;
      definition += fields.map((field) => `    ${field}`).join("\n");
      definition += "\n}";

      return definition;
    },
    [],
  );

  // Generate imports
  const generateImports = useCallback((structs: string[], opts: GoGenerationOptions): string[] => {
    const imports = new Set<string>();

    // Check if time.Time is used
    if (opts.handleTimeFormat === "time.Time" && structs.some((s) => s.includes("time.Time"))) {
      imports.add("time");
    }

    // Check if validation tags are used
    if (opts.generateValidationTags && structs.some((s) => s.includes("validate:"))) {
      imports.add("github.com/go-playground/validator/v10");
    }

    return Array.from(imports);
  }, []);

  // Generate methods
  const generateMethods = useCallback((structs: string[], opts: GoGenerationOptions): string[] => {
    const methods: string[] = [];

    if (opts.generateStringer) {
      structs.forEach((struct) => {
        const structName = extractStructName(struct);
        if (structName) {
          methods.push(generateStringerMethod(structName, opts));
        }
      });
    }

    if (opts.generateMarshalJSON || opts.generateUnmarshalJSON) {
      structs.forEach((struct) => {
        const structName = extractStructName(struct);
        if (structName) {
          if (opts.generateMarshalJSON) {
            methods.push(generateMarshalJSONMethod(structName, opts));
          }
          if (opts.generateUnmarshalJSON) {
            methods.push(generateUnmarshalJSONMethod(structName, opts));
          }
        }
      });
    }

    return methods;
  }, []);

  // Helper functions
  const inferGoType = useCallback((value: any, opts: GoGenerationOptions): string => {
    if (value === null) return opts.handleUnknown;
    if (typeof value === "string") {
      // Check for specific patterns
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return opts.handleTimeFormat === "time.Time" ? "time.Time" : "string";
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "string";
      if (/^https?:\/\//.test(value)) return "string";
      return "string";
    }
    if (typeof value === "number") {
      if (opts.handleNumbers === "int" && Number.isInteger(value)) return "int";
      if (opts.handleNumbers === "float64") return "float64";
      if (opts.handleNumbers === "interface{}") return "interface{}";
      return Number.isInteger(value) ? "int" : "float64";
    }
    if (typeof value === "boolean") return "bool";
    return "interface{}";
  }, []);

  const formatFieldName = useCallback((name: string, opts: GoGenerationOptions): string => {
    switch (opts.fieldNaming) {
      case "camelCase":
        return toCamelCase(name);
      case "snake_case":
        return toSnakeCase(name);
      case "pascalCase":
        return capitalizeFirst(toCamelCase(name));
      case "keepOriginal":
      default:
        return name;
    }
  }, []);

  const toCamelCase = (str: string): string => {
    return str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace(/[-_]/g, ""));
  };

  const toSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  };

  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const generateJsonTag = useCallback(
    (key: string, opts: GoGenerationOptions, value: any): string => {
      let tag = key;

      if (opts.useOmitempty && !opts.requiredFields.includes(key)) {
        tag += ",omitempty";
      }

      return tag;
    },
    [],
  );

  const generateValidationTag = useCallback(
    (key: string, value: any, opts: GoGenerationOptions): string => {
      const validations: string[] = [];

      if (opts.requiredFields.includes(key)) {
        validations.push("required");
      }

      if (typeof value === "string" && value.length > 0) {
        validations.push(`max=${value.length}`);
      }

      return validations.join(",");
    },
    [],
  );

  const extractStructName = useCallback((struct: string): string | null => {
    const match = struct.match(/type\s+(\w+)\s+struct/);
    return match ? match[1] : null;
  }, []);

  const generateStringerMethod = useCallback(
    (structName: string, opts: GoGenerationOptions): string => {
      const exportableName = opts.exportStructs ? structName : structName;
      return `func (s *${exportableName}) String() string {
    return fmt.Sprintf("${exportableName}{%+v}", *s)
  }`;
    },
    [],
  );

  const generateMarshalJSONMethod = useCallback(
    (structName: string, opts: GoGenerationOptions): string => {
      const exportableName = opts.exportStructs ? structName : structName;
      return `func (s *${exportableName}) MarshalJSON() ([]byte, error) {
    type Alias ${exportableName}
    return json.Marshal(&struct {
        *Alias
    }{
        Alias: (*Alias)(s),
    })
}`;
    },
    [],
  );

  const generateUnmarshalJSONMethod = useCallback(
    (structName: string, opts: GoGenerationOptions): string => {
      const exportableName = opts.exportStructs ? structName : structName;
      return `func (s *${exportableName}) UnmarshalJSON(data []byte) error {
    type Alias ${exportableName}
    aux := &struct {
        *Alias
    }{
        Alias: (*Alias)(s),
    }
    if err := json.Unmarshal(data, &aux); err != nil {
        return err
    }
    *s = ${exportableName}(*aux.Alias)
    return nil
}`;
    },
    [],
  );

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [generatedCode]);

  // Download code
  const downloadCode = useCallback(() => {
    const blob = new Blob([generatedCode], { type: "text/go" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${options.structName.toLowerCase()}.go`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, options.structName]);

  // Effects
  useEffect(() => {
    if (jsonData) {
      setIsValidJson(true);
      generateGoStructs(jsonData, options);
    }
  }, [jsonData, options, generateGoStructs]);

  return (
    <div className={cn("w-full space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">JSON to Go Struct Generator</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isValidJson ? "default" : "destructive"}>
                {isValidJson ? "Valid JSON" : "Invalid JSON"}
              </Badge>

              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="w-4 h-4" />
              </Button>

              {generatedCode && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? (
                      <CopyCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCode}>
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
              Generating Go structs...
            </div>
          )}
        </CardHeader>

        {showSettings && (
          <div className="px-6 pb-4 border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    value={options.packageName}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        packageName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structName">Root Struct Name</Label>
                  <Input
                    id="structName"
                    value={options.structName}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        structName: toPascalCase(e.target.value) || "RootStruct",
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldNaming">Field Naming</Label>
                  <Select
                    value={options.fieldNaming}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        fieldNaming: value as GoGenerationOptions["fieldNaming"],
                      }))
                    }
                  >
                    <SelectTrigger id="fieldNaming">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                      <SelectItem value="pascalCase">PascalCase</SelectItem>
                      <SelectItem value="keepOriginal">Keep Original</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handleTimeFormat">Time Format</Label>
                  <Select
                    value={options.handleTimeFormat}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        handleTimeFormat: value as GoGenerationOptions["handleTimeFormat"],
                      }))
                    }
                  >
                    <SelectTrigger id="handleTimeFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="time.Time">time.Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handleNumbers">Number Handling</Label>
                  <Select
                    value={options.handleNumbers}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        handleNumbers: value as GoGenerationOptions["handleNumbers"],
                      }))
                    }
                  >
                    <SelectTrigger id="handleNumbers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Auto (int/float64)</SelectItem>
                      <SelectItem value="int">Always int</SelectItem>
                      <SelectItem value="float64">Always float64</SelectItem>
                      <SelectItem value="interface{}">interface{}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="usePointers">Use Pointers</Label>
                  <Switch
                    id="usePointers"
                    checked={options.usePointers}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, usePointers: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useOmitempty">Use omitempty</Label>
                  <Switch
                    id="useOmitempty"
                    checked={options.useOmitempty}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, useOmitempty: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateJsonTags">Generate JSON Tags</Label>
                  <Switch
                    id="generateJsonTags"
                    checked={options.generateJsonTags}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateJsonTags: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateValidationTags">Generate Validation Tags</Label>
                  <Switch
                    id="generateValidationTags"
                    checked={options.generateValidationTags}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateValidationTags: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateImports">Generate Imports</Label>
                  <Switch
                    id="generateImports"
                    checked={options.generateImports}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateImports: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="exportStructs">Export Structs</Label>
                  <Switch
                    id="exportStructs"
                    checked={options.exportStructs}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, exportStructs: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="fieldComments">Field Comments</Label>
                  <Switch
                    id="fieldComments"
                    checked={options.fieldComments}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, fieldComments: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="structComments">Struct Comments</Label>
                  <Switch
                    id="structComments"
                    checked={options.structComments}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, structComments: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateMethods">Generate Methods</Label>
                  <Switch
                    id="generateMethods"
                    checked={options.generateMethods}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, generateMethods: checked }))
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="output">Generated Go Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="output" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Go Structs</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        {copied ? (
                          <CopyCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadCode}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <JsonAdvancedEditor
                    value={generatedCode}
                    onChange={() => {}}
                    height={500}
                    language="go"
                    readOnly={readOnly}
                    showToolbar={!readOnly}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="p-6">
                <div className="space-y-4">
                  <Label>Code Preview</Label>
                  <div className="border rounded-md p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {generatedCode || "No Go code generated"}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function for PascalCase conversion
const toPascalCase = (str: string): string => {
  return str.replace(/(?:^|[-_])([a-zA-Z])/g, (_, char) => char.toUpperCase());
};

export default JsonToGo;
