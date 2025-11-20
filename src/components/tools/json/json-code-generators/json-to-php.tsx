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

// Enhanced type system for PHP code generation
interface PHPTypeOptions {
  useStrictTypes: boolean;
  useTypedProperties: boolean;
  useEnumTypes: boolean;
  useArrayShorthand: boolean;
  useNamespace: boolean;
  generateGetters: boolean;
  generateSetters: boolean;
  generateConstructor: boolean;
  generateToArray: boolean;
  generateJsonSerialize: boolean;
  usePhpDoc: boolean;
  phpVersion: "7.4" | "8.0" | "8.1" | "8.2" | "8.3";
  namespace: string;
  className: string;
  visibility: "public" | "protected" | "private";
  extends: string;
  implements: string[];
  useTraits: string[];
  fileHeader: string;
}

interface PHPGenerationConfig {
  rootClassName: string;
  namespace: string;
  visibility: "public" | "protected" | "private";
  extends: string;
  implements: string[];
  useTraits: string[];
  options: PHPTypeOptions;
}

interface PHPClassInfo {
  name: string;
  properties: PHPPropertyInfo[];
  methods: PHPMethodInfo[];
  namespace: string;
  extends: string;
  implements: string[];
  useTraits: string[];
  traits: string[];
  constants: PHPConstantInfo[];
  description?: string;
}

interface PHPPropertyInfo {
  name: string;
  type: string;
  phpType: string;
  isNullable: boolean;
  defaultValue?: string;
  visibility: "public" | "protected" | "private";
  isStatic: boolean;
  isReadonly: boolean;
  description?: string;
  phpDoc: string[];
}

interface PHPMethodInfo {
  name: string;
  parameters: PHPParameterInfo[];
  returnType: string;
  visibility: "public" | "protected" | "private";
  isStatic: boolean;
  isFinal: boolean;
  description?: string;
  phpDoc: string[];
  body: string;
}

interface PHPParameterInfo {
  name: string;
  type: string;
  defaultValue?: string;
  isNullable: boolean;
  isVariadic: boolean;
}

interface PHPConstantInfo {
  name: string;
  value: string;
  visibility: "public" | "protected" | "private";
  description?: string;
  phpDoc: string[];
}

// Enhanced type inference for PHP
interface TypeInferenceResult {
  phpType: string;
  isNullable: boolean;
  defaultValue?: string;
  requiresArray: boolean;
  requiresDateTime: boolean;
  phpDoc: string[];
}

const DEFAULT_PHP_OPTIONS: PHPTypeOptions = {
  useStrictTypes: true,
  useTypedProperties: true,
  useEnumTypes: true,
  useArrayShorthand: true,
  useNamespace: true,
  generateGetters: true,
  generateSetters: true,
  generateConstructor: true,
  generateToArray: true,
  generateJsonSerialize: true,
  usePhpDoc: true,
  phpVersion: "8.2",
  namespace: "GeneratedModels",
  className: "RootObject",
  visibility: "public",
  extends: "",
  implements: ["JsonSerializable"],
  useTraits: [],
  fileHeader: "",
};

const PHP_TYPE_MAPPINGS: Record<string, string> = {
  string: "string",
  number: "float",
  integer: "int",
  boolean: "bool",
  null: "mixed",
  array: "array",
  object: "object",
  datetime: "DateTime",
  date: "DateTime",
  time: "DateTime",
  uuid: "string",
  decimal: "float",
  double: "float",
  long: "int",
  short: "int",
};

const PHP_RESERVED_KEYWORDS = new Set([
  "__halt_compiler",
  "abstract",
  "and",
  "array",
  "as",
  "break",
  "callable",
  "case",
  "catch",
  "class",
  "clone",
  "const",
  "continue",
  "declare",
  "default",
  "die",
  "do",
  "echo",
  "else",
  "elseif",
  "empty",
  "enddeclare",
  "endfor",
  "endforeach",
  "endif",
  "endswitch",
  "endwhile",
  "eval",
  "exit",
  "extends",
  "final",
  "finally",
  "for",
  "foreach",
  "function",
  "global",
  "goto",
  "if",
  "implements",
  "include",
  "include_once",
  "instanceof",
  "insteadof",
  "interface",
  "isset",
  "list",
  "namespace",
  "new",
  "or",
  "print",
  "private",
  "protected",
  "public",
  "require",
  "require_once",
  "return",
  "static",
  "switch",
  "throw",
  "trait",
  "try",
  "unset",
  "use",
  "var",
  "while",
  "xor",
  "yield",
  "yield from",
]);

// Enhanced type inference for PHP
const inferPHPType = (value: any, key: string, options: PHPTypeOptions): TypeInferenceResult => {
  let phpType = "mixed";
  let isNullable = false;
  let defaultValue: string | undefined;
  let requiresArray = false;
  let requiresDateTime = false;
  const phpDoc: string[] = [];

  if (value === null || value === undefined) {
    phpType = options.phpVersion >= "8.0" ? "mixed" : "null";
    isNullable = true;
    phpDoc.push("@var mixed|null");
  } else if (Array.isArray(value)) {
    phpType = "array";
    requiresArray = true;
    if (value.length > 0) {
      const elementType = inferPHPType(value[0], "", options);
      if (elementType.phpType !== "mixed") {
        phpDoc.push(`@var ${elementType.phpType}[]`);
      } else {
        phpDoc.push("@var array");
      }
    } else {
      phpDoc.push("@var array");
    }
  } else if (typeof value === "object") {
    if (value instanceof Date) {
      phpType = "DateTime";
      requiresDateTime = true;
      isNullable = true;
      phpDoc.push("@var DateTime|null");
    } else {
      phpType = "object";
      isNullable = true;
      phpDoc.push("@var object|array");
    }
  } else if (typeof value === "string") {
    // Check for special string formats
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      phpType = "DateTime";
      requiresDateTime = true;
      isNullable = true;
      phpDoc.push("@var DateTime|null");
      defaultValue = "new DateTime()";
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      phpType = "DateTime";
      requiresDateTime = true;
      isNullable = true;
      phpDoc.push("@var DateTime|null");
      defaultValue = "new DateTime()";
    } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      phpType = "string";
      phpDoc.push("@var string UUID");
    } else if (value.match(/^https?:\/\//)) {
      phpType = "string";
      phpDoc.push("@var string URL");
    } else if (value.match(/^\d+$/)) {
      phpType = "int";
      phpDoc.push("@var int");
      defaultValue = value;
    } else if (value.match(/^\d*\.\d+$/)) {
      phpType = "float";
      phpDoc.push("@var float");
      defaultValue = value;
    } else {
      phpType = "string";
      phpDoc.push("@var string");
    }
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) {
      phpType = "int";
      phpDoc.push("@var int");
    } else {
      phpType = "float";
      phpDoc.push("@var float");
    }
    defaultValue = value.toString();
  } else if (typeof value === "boolean") {
    phpType = "bool";
    phpDoc.push("@var bool");
    defaultValue = value ? "true" : "false";
  }

  return {
    phpType,
    isNullable,
    defaultValue,
    requiresArray,
    requiresDateTime,
    phpDoc,
  };
};

// Enhanced PascalCase conversion with PHP naming conventions
const toPascalCase = (str: string): string => {
  if (!str) return str;

  // Convert snake_case, kebab-case, and spaces to PascalCase
  return str
    .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase())
    .replace(/[a-z]([A-Z])/g, (_, char) => char.toLowerCase());
};

// Convert to camelCase for method names
const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Convert to snake_case for property names (PHP convention)
const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/^_/, "")
    .toLowerCase();
};

// Sanitize PHP identifiers
const sanitizePHPIdentifier = (str: string): string => {
  let sanitized = str;

  // Replace invalid characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "_");

  // Ensure it starts with a letter or underscore
  if (sanitized.match(/^\d/)) {
    sanitized = "_" + sanitized;
  }

  // Handle PHP reserved keywords
  if (PHP_RESERVED_KEYWORDS.has(sanitized)) {
    sanitized = "_" + sanitized;
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = "property";
  }

  return sanitized;
};

// Generate PHP property with enhanced features
const generatePHPProperty = (
  key: string,
  value: any,
  index: number,
  options: PHPTypeOptions,
): PHPPropertyInfo => {
  const typeInfo = inferPHPType(value, key, options);
  const propertyName = sanitizePHPIdentifier(toSnakeCase(key));
  const propertyType =
    typeInfo.isNullable && options.phpVersion >= "8.0" ? `?${typeInfo.phpType}` : typeInfo.phpType;

  const phpDoc: string[] = [];
  if (options.usePhpDoc) {
    phpDoc.push(...typeInfo.phpDoc);
    if (key !== propertyName) {
      phpDoc.push(`@property ${typeInfo.phpType} $${key} Original JSON property`);
    }
  }

  return {
    name: propertyName,
    type: typeof value,
    phpType: propertyType,
    isNullable: typeInfo.isNullable,
    defaultValue: typeInfo.defaultValue,
    visibility: options.visibility,
    isStatic: false,
    isReadonly: options.phpVersion >= "8.1" && !typeInfo.isNullable,
    description: "",
    phpDoc,
  };
};

// Generate PHP getter method
const generateGetter = (property: PHPPropertyInfo, options: PHPTypeOptions): PHPMethodInfo => {
  const methodName = "get" + toPascalCase(property.name);
  const returnType =
    property.phpType === "mixed" && options.phpVersion >= "8.0" ? "mixed" : property.phpType;

  const phpDoc: string[] = [];
  if (options.usePhpDoc) {
    phpDoc.push(`@return ${property.phpType}`);
  }

  return {
    name: methodName,
    parameters: [],
    returnType,
    visibility: property.visibility,
    isStatic: false,
    isFinal: false,
    description: `Get ${property.name}`,
    phpDoc,
    body: `return $this->${property.name};`,
  };
};

// Generate PHP setter method
const generateSetter = (property: PHPPropertyInfo, options: PHPTypeOptions): PHPMethodInfo => {
  const methodName = "set" + toPascalCase(property.name);

  const phpDoc: string[] = [];
  if (options.usePhpDoc) {
    phpDoc.push(`@param ${property.phpType} $${property.name}`);
    phpDoc.push("@return self");
  }

  return {
    name: methodName,
    parameters: [
      {
        name: property.name,
        type: property.phpType,
        isNullable: property.isNullable,
      },
    ],
    returnType: "self",
    visibility: property.visibility,
    isStatic: false,
    isFinal: false,
    description: `Set ${property.name}`,
    phpDoc,
    body: `$this->${property.name} = $${property.name};\n        return $this;`,
  };
};

// Generate PHP class from object with enhanced features
const generatePHPClass = (
  obj: any,
  className: string,
  namespace: string,
  options: PHPTypeOptions,
  extendsClass: string = "",
  implementsInterfaces: string[] = [],
): PHPClassInfo => {
  const properties: PHPPropertyInfo[] = [];
  const methods: PHPMethodInfo[] = [];
  const traits: string[] = [];
  const constants: PHPConstantInfo[] = [];

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    let index = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__comment__") continue;

      const property = generatePHPProperty(key, value, index, options);
      properties.push(property);

      // Generate getters and setters if enabled
      if (options.generateGetters) {
        methods.push(generateGetter(property, options));
      }
      if (options.generateSetters) {
        methods.push(generateSetter(property, options));
      }

      index++;
    }
  }

  // Add toArray method if enabled
  if (options.generateToArray) {
    const phpDoc = ["@return array"];
    methods.push({
      name: "toArray",
      parameters: [],
      returnType: "array",
      visibility: "public",
      isStatic: false,
      isFinal: false,
      description: "Convert object to array",
      phpDoc,
      body:
        properties.map((prop) => `            '${prop.name}' => $this->${prop.name}`).join(",\n") +
        "\n        ]",
    });
  }

  // Add jsonSerialize method if JsonSerializable is implemented
  if (options.generateJsonSerialize && implementsInterfaces.includes("JsonSerializable")) {
    const phpDoc = ["@return array"];
    methods.push({
      name: "jsonSerialize",
      parameters: [],
      returnType: "array",
      visibility: "public",
      isStatic: false,
      isFinal: false,
      description: "JSON serialization",
      phpDoc,
      body: "return $this->toArray();",
    });
  }

  return {
    name: sanitizePHPIdentifier(className),
    properties,
    methods,
    namespace,
    extends: extendsClass,
    implements: implementsInterfaces,
    useTraits: [],
    traits,
    constants,
    description: "",
  };
};

// Generate PHP code string with enhanced formatting
const generatePHPCode = (classes: PHPClassInfo[], config: PHPGenerationConfig): string => {
  const parts: string[] = [];
  const options = config.options;

  // File header
  if (options.fileHeader) {
    parts.push("<?php");
    parts.push("");
    parts.push(options.fileHeader);
    parts.push("");
  } else {
    parts.push("<?php");
    parts.push("");
  }

  // Strict types declaration
  if (options.useStrictTypes) {
    parts.push("declare(strict_types=1);");
    parts.push("");
  }

  // Namespace
  if (options.useNamespace && config.namespace) {
    parts.push(`namespace ${config.namespace};`);
    parts.push("");
  }

  // Use statements
  const useStatements = new Set<string>();
  classes.forEach((cls) => {
    if (cls.implements.includes("JsonSerializable")) {
      useStatements.add("JsonSerializable");
    }
    cls.properties.forEach((prop) => {
      if (prop.phpType === "DateTime") {
        useStatements.add("DateTime");
      }
    });
  });

  Array.from(useStatements)
    .sort()
    .forEach((use) => {
      parts.push(`use ${use};`);
    });

  parts.push("");

  // Generate each class
  classes.forEach((cls, index) => {
    parts.push("");

    // Class PHPDoc
    if (options.usePhpDoc && cls.description) {
      parts.push("/**");
      parts.push(` * ${cls.description}`);
      parts.push(" */");
    }

    // Class declaration
    const extendsClause = cls.extends ? ` extends ${cls.extends}` : "";
    const implementsClause =
      cls.implements.length > 0 ? ` implements ${cls.implements.join(", ")}` : "";

    parts.push(`${options.visibility} class ${cls.name}${extendsClause}${implementsClause}`);
    parts.push("{");

    // Constants
    cls.constants.forEach((constant) => {
      if (options.usePhpDoc && constant.phpDoc.length > 0) {
        parts.push("    /**");
        constant.phpDoc.forEach((doc) => {
          parts.push(`     * ${doc}`);
        });
        parts.push("     */");
      }
      parts.push(`    ${constant.visibility} const ${constant.name} = ${constant.value};`);
      parts.push("");
    });

    // Traits
    cls.useTraits.forEach((trait) => {
      parts.push(`    use ${trait};`);
      parts.push("");
    });

    // Properties
    cls.properties.forEach((prop) => {
      if (options.usePhpDoc && prop.phpDoc.length > 0) {
        parts.push("    /**");
        prop.phpDoc.forEach((doc) => {
          parts.push(`     * ${doc}`);
        });
        parts.push("     */");
      }

      const typeDecl = options.useTypedProperties ? `${prop.phpType} ` : "";
      const readonly = prop.isReadonly ? "readonly " : "";
      const staticDecl = prop.isStatic ? "static " : "";

      parts.push(
        `    ${prop.visibility} ${staticDecl}${readonly}${typeDecl}$${prop.name}${prop.defaultValue ? " = " + prop.defaultValue : ""};`,
      );
    });

    if (cls.properties.length > 0) {
      parts.push("");
    }

    // Constructor
    if (options.generateConstructor && cls.properties.length > 0) {
      const constructorParams = cls.properties
        .map((prop) => {
          const nullable = prop.isNullable && options.phpVersion >= "8.0" ? "?" : "";
          const typeDecl = options.useTypedProperties
            ? `${nullable}${prop.phpType.replace("?", "")} `
            : "";
          const defaultVal = prop.defaultValue ? " = " + prop.defaultValue : "";
          return `$${prop.name}${typeDecl}${defaultVal}`;
        })
        .join(", ");

      parts.push("    /**");
      parts.push("     * Constructor");
      parts.push("     */");
      parts.push(`    public function __construct(${constructorParams})`);
      parts.push("    {");
      cls.properties.forEach((prop) => {
        parts.push(`        $this->${prop.name} = $${prop.name};`);
      });
      parts.push("    }");
      parts.push("");
    }

    // Methods
    cls.methods.forEach((method) => {
      if (options.usePhpDoc && method.phpDoc.length > 0) {
        parts.push("    /**");
        method.phpDoc.forEach((doc) => {
          parts.push(`     * ${doc}`);
        });
        parts.push("     */");
      }

      const params = method.parameters
        .map((param) => {
          const nullable = param.isNullable && options.phpVersion >= "8.0" ? "?" : "";
          const typeDecl = options.useTypedProperties
            ? `${nullable}${param.type.replace("?", "")} `
            : "";
          const defaultVal = param.defaultValue ? " = " + param.defaultValue : "";
          const variadic = param.isVariadic ? "..." : "";
          return `${typeDecl}${variadic}$${param.name}${defaultVal}`;
        })
        .join(", ");

      const returnType = method.returnType ? `: ${method.returnType}` : "";
      const staticDecl = method.isStatic ? "static " : "";
      const finalDecl = method.isFinal ? "final " : "";

      parts.push(
        `    ${finalDecl}${method.visibility} ${staticDecl}function ${method.name}(${params})${returnType}`,
      );
      parts.push("    {");
      if (method.name === "toArray") {
        parts.push("        return [");
        parts.push(method.body);
        parts.push("        ];");
      } else {
        parts.push(
          method.body
            .split("\n")
            .map((line) => "        " + line)
            .join("\n"),
        );
      }
      parts.push("    }");
      parts.push("");
    });

    parts.push("}");
  });

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
interface JsonToPHPProps {
  jsonData?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<PHPTypeOptions>;
}

export const JsonToPHP: React.FC<JsonToPHPProps> = ({
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
  const [options, setOptions] = useState<PHPTypeOptions>({
    ...DEFAULT_PHP_OPTIONS,
    ...initialOptions,
  });
  const [config, setConfig] = useState<PHPGenerationConfig>({
    rootClassName: options.className,
    namespace: options.namespace,
    visibility: options.visibility,
    extends: options.extends,
    implements: options.implements,
    useTraits: options.useTraits,
    options,
  });

  // Memoized PHP class generation
  const generatedClasses = useMemo(() => {
    if (!validation.isValid || !jsonInput.trim()) return [];

    try {
      const parsedData = JSON.parse(jsonInput);
      const rootClass = generatePHPClass(
        parsedData,
        config.rootClassName,
        config.namespace,
        config.options,
        config.extends,
        config.implements,
      );

      return [rootClass]; // In a full implementation, we'd handle nested objects recursively
    } catch (error) {
      return [];
    }
  }, [jsonInput, validation.isValid, config]);

  // Memoized PHP code generation
  const generatedCode = useMemo(() => {
    if (!validation.isValid || generatedClasses.length === 0) return "";

    const code = generatePHPCode(generatedClasses, config);
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
      visibility: options.visibility,
      extends: options.extends,
      implements: options.implements,
      useTraits: options.useTraits,
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

  // Download as .php file
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.rootClassName}.php`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset to defaults
  const handleReset = () => {
    setOptions(DEFAULT_PHP_OPTIONS);
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
                JSON to PHP Converter
                <Badge variant="outline">PHP {options.phpVersion}</Badge>
              </CardTitle>
              <CardDescription>
                Generate strongly-typed PHP classes from JSON with modern PHP features
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
                  <TabsTrigger value="generation">Code Generation</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="php-version">PHP Version</Label>
                    <select
                      id="php-version"
                      className="w-full p-2 border rounded-md"
                      value={options.phpVersion}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          phpVersion: e.target.value as PHPTypeOptions["phpVersion"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="8.3">PHP 8.3</option>
                      <option value="8.2">PHP 8.2</option>
                      <option value="8.1">PHP 8.1</option>
                      <option value="8.0">PHP 8.0</option>
                      <option value="7.4">PHP 7.4</option>
                    </select>
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
                    <Label htmlFor="extends">Extends</Label>
                    <input
                      id="extends"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.extends}
                      onChange={(e) => setOptions((prev) => ({ ...prev, extends: e.target.value }))}
                      disabled={readOnly}
                      placeholder="Optional parent class"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Property Visibility</Label>
                    <select
                      id="visibility"
                      className="w-full p-2 border rounded-md"
                      value={options.visibility}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          visibility: e.target.value as PHPTypeOptions["visibility"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="public">public</option>
                      <option value="protected">protected</option>
                      <option value="private">private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="implements">Implements (comma-separated)</Label>
                    <input
                      id="implements"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.implements.join(", ")}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          implements: e.target.value
                            .split(",")
                            .map((i) => i.trim())
                            .filter(Boolean),
                        }))
                      }
                      disabled={readOnly}
                      placeholder="JsonSerializable, ArrayAccess"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="strict-types"
                      checked={options.useStrictTypes}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useStrictTypes: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="strict-types">Strict Types</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="typed-properties"
                      checked={options.useTypedProperties}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useTypedProperties: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="typed-properties">Typed Properties</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="namespace-toggle"
                      checked={options.useNamespace}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useNamespace: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="namespace-toggle">Use Namespace</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enum-types"
                      checked={options.useEnumTypes}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useEnumTypes: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="enum-types">Use Enum Types</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="array-shorthand"
                      checked={options.useArrayShorthand}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useArrayShorthand: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="array-shorthand">Array Shorthand</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="phpdoc"
                      checked={options.usePhpDoc}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, usePhpDoc: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="phpdoc">Generate PHPDoc</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="generation" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="getters"
                      checked={options.generateGetters}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateGetters: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="getters">Generate Getters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="setters"
                      checked={options.generateSetters}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateSetters: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="setters">Generate Setters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="constructor"
                      checked={options.generateConstructor}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateConstructor: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="constructor">Generate Constructor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="to-array"
                      checked={options.generateToArray}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateToArray: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="to-array">Generate toArray()</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="json-serialize"
                      checked={options.generateJsonSerialize}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateJsonSerialize: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="json-serialize">Generate jsonSerialize()</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            {showPreview && generatedCode && (
              <div className="space-y-2">
                <Label>Generated PHP Code</Label>
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
                        <Badge variant="outline">
                          {cls.properties.length} properties, {cls.methods.length} methods
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {cls.namespace && `namespace ${cls.namespace}`}
                        {cls.extends && ` extends ${cls.extends}`}
                        {cls.implements.length > 0 && ` implements ${cls.implements.join(", ")}`}
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

export default JsonToPHP;
