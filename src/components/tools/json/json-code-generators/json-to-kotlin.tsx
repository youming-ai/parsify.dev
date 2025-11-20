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

// Enhanced type system for Kotlin code generation
interface KotlinTypeOptions {
  useDataClasses: boolean;
  useValueClasses: boolean;
  useNullableTypes: boolean;
  useSealedClasses: boolean;
  useInlineClasses: boolean;
  useTypeAliases: boolean;
  generateParcelable: boolean;
  generateSerializable: boolean;
  generateJacksonAnnotations: boolean;
  generateGsonAnnotations: boolean;
  generateKotlinxSerialization: boolean;
  generateGettersSetters: boolean;
  generateToString: boolean;
  generateEqualsHashCode: boolean;
  generateCopyMethod: boolean;
  generateCompanionObject: boolean;
  kotlinVersion: "1.7" | "1.8" | "1.9" | "2.0";
  packageName: string;
  className: string;
  visibility: "public" | "internal" | "private";
  imports: string[];
  fileHeader: string;
}

interface KotlinGenerationConfig {
  rootClassName: string;
  packageName: string;
  visibility: "public" | "internal" | "private";
  imports: string[];
  options: KotlinTypeOptions;
}

interface KotlinClassInfo {
  name: string;
  properties: KotlinPropertyInfo[];
  sealedSubclasses: string[];
  companionObject: KotlinCompanionObjectInfo[];
  typeAliases: KotlinTypeAliasInfo[];
  packageName: string;
  imports: string[];
  annotations: string[];
  sealed: boolean;
  value: boolean;
  data: boolean;
  inline: boolean;
  description?: string;
}

interface KotlinPropertyInfo {
  name: string;
  type: string;
  kotlinType: string;
  isNullable: boolean;
  isVal: boolean;
  defaultValue?: string;
  annotations: string[];
  description?: string;
  visibility: string;
}

interface KotlinCompanionObjectInfo {
  name: string;
  properties: KotlinPropertyInfo[];
  functions: KotlinFunctionInfo[];
}

interface KotlinTypeAliasInfo {
  name: string;
  type: string;
  visibility: string;
  description?: string;
}

interface KotlinFunctionInfo {
  name: string;
  parameters: KotlinParameterInfo[];
  returnType: string;
  isInline: boolean;
  isSuspend: boolean;
  visibility: string;
  description?: string;
}

interface KotlinParameterInfo {
  name: string;
  type: string;
  defaultValue?: string;
  isNullable: boolean;
  isVararg: boolean;
}

// Enhanced type inference for Kotlin
interface TypeInferenceResult {
  kotlinType: string;
  isNullable: boolean;
  defaultValue?: string;
  annotations: string[];
  imports: string[];
}

const DEFAULT_KOTLIN_OPTIONS: KotlinTypeOptions = {
  useDataClasses: true,
  useValueClasses: false,
  useNullableTypes: true,
  useSealedClasses: false,
  useInlineClasses: false,
  useTypeAliases: false,
  generateParcelable: false,
  generateSerializable: false,
  generateJacksonAnnotations: true,
  generateGsonAnnotations: false,
  generateKotlinxSerialization: false,
  generateGettersSetters: false,
  generateToString: true,
  generateEqualsHashCode: true,
  generateCopyMethod: true,
  generateCompanionObject: false,
  kotlinVersion: "1.9",
  packageName: "generated.models",
  className: "RootObject",
  visibility: "public",
  imports: [],
  fileHeader: "",
};

const KOTLIN_TYPE_MAPPINGS: Record<string, string> = {
  string: "String",
  number: "Double",
  integer: "Int",
  boolean: "Boolean",
  null: "Any?",
  array: "List",
  object: "Any",
  datetime: "java.time.LocalDateTime",
  date: "java.time.LocalDate",
  time: "java.time.LocalTime",
  uuid: "java.util.UUID",
  decimal: "java.math.BigDecimal",
  float: "Float",
  long: "Long",
  short: "Short",
  byte: "Byte",
  uri: "java.net.URI",
};

const KOTLIN_RESERVED_KEYWORDS = new Set([
  "abstract",
  "actual",
  "annotation",
  "as",
  "break",
  "by",
  "catch",
  "class",
  "companion",
  "const",
  "constructor",
  "continue",
  "crossinline",
  "data",
  "delegate",
  "do",
  "else",
  "enum",
  "expect",
  "external",
  "false",
  "final",
  "finally",
  "for",
  "fun",
  "get",
  "if",
  "import",
  "in",
  "infix",
  "init",
  "inline",
  "inner",
  "interface",
  "internal",
  "is",
  "it",
  "lateinit",
  "noinline",
  "null",
  "object",
  "open",
  "operator",
  "out",
  "override",
  "package",
  "param",
  "private",
  "protected",
  "public",
  "reified",
  "return",
  "sealed",
  "set",
  "super",
  "suspend",
  "this",
  "throw",
  "true",
  "try",
  "typealias",
  "val",
  "var",
  "vararg",
  "when",
  "where",
  "while",
]);

// Enhanced type inference for Kotlin
const inferKotlinType = (
  value: any,
  key: string,
  options: KotlinTypeOptions,
): TypeInferenceResult => {
  let kotlinType = "Any";
  let isNullable = options.useNullableTypes;
  const annotations: string[] = [];
  const imports: string[] = [];

  if (value === null || value === undefined) {
    kotlinType = "Any?";
    isNullable = true;
  } else if (Array.isArray(value)) {
    const elementType =
      value.length > 0 ? inferKotlinType(value[0], "", options).kotlinType.replace("?", "") : "Any";
    kotlinType = `List<${elementType}>`;
    isNullable = true;
    annotations.push('@SerializedName("' + key + '")');
  } else if (typeof value === "object") {
    if (value instanceof Date) {
      kotlinType = "java.time.LocalDateTime";
      isNullable = true;
      imports.push("java.time.LocalDateTime");
    } else {
      // For nested objects, we'll generate a class later
      const className = toPascalCase(key) || "DataObject";
      kotlinType = className;
      isNullable = true;
    }
    annotations.push('@SerializedName("' + key + '")');
  } else if (typeof value === "string") {
    // Check for special string formats
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      kotlinType = "java.time.LocalDateTime";
      isNullable = true;
      imports.push("java.time.LocalDateTime");
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      kotlinType = "java.time.LocalDate";
      isNullable = true;
      imports.push("java.time.LocalDate");
    } else if (value.match(/^\d{2}:\d{2}:\d{2}/)) {
      kotlinType = "java.time.LocalTime";
      isNullable = true;
      imports.push("java.time.LocalTime");
    } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      kotlinType = "java.util.UUID";
      isNullable = true;
      imports.push("java.util.UUID");
    } else if (value.match(/^https?:\/\//)) {
      kotlinType = "java.net.URI";
      isNullable = true;
      imports.push("java.net.URI");
    } else if (value.match(/^\d+$/)) {
      kotlinType = "Long";
      isNullable = true;
    } else if (value.match(/^\d*\.\d+$/)) {
      kotlinType = "java.math.BigDecimal";
      isNullable = true;
      imports.push("java.math.BigDecimal");
    } else {
      kotlinType = "String";
      isNullable = false;
    }
    annotations.push('@SerializedName("' + key + '")');
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) {
        kotlinType = "Long";
      } else {
        kotlinType = "Int";
      }
    } else {
      kotlinType = "Double";
    }
    isNullable = isNullable;
    annotations.push('@SerializedName("' + key + '")');
  } else if (typeof value === "boolean") {
    kotlinType = "Boolean";
    isNullable = options.useNullableTypes;
    annotations.push('@SerializedName("' + key + '")');
  }

  return {
    kotlinType,
    isNullable,
    annotations,
    imports,
  };
};

// Enhanced PascalCase conversion with Kotlin naming conventions
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

// Sanitize Kotlin identifiers
const sanitizeKotlinIdentifier = (str: string): string => {
  let sanitized = str;

  // Replace invalid characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "_");

  // Ensure it starts with a letter or underscore
  if (sanitized.match(/^\d/)) {
    sanitized = "_" + sanitized;
  }

  // Handle Kotlin reserved keywords
  if (KOTLIN_RESERVED_KEYWORDS.has(sanitized)) {
    sanitized = "`" + sanitized + "`";
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = "property";
  }

  return sanitized;
};

// Generate Kotlin property with enhanced features
const generateKotlinProperty = (
  key: string,
  value: any,
  index: number,
  options: KotlinTypeOptions,
): KotlinPropertyInfo => {
  const typeInfo = inferKotlinType(value, key, options);
  const propertyName = sanitizeKotlinIdentifier(toCamelCase(key));
  const propertyType = typeInfo.isNullable ? typeInfo.kotlinType + "?" : typeInfo.kotlinType;

  const annotations: string[] = [];
  if (options.generateJacksonAnnotations) {
    annotations.push('@SerializedName("' + key + '")');
  }
  if (options.generateGsonAnnotations) {
    annotations.push('@SerializedName("' + key + '")');
  }

  return {
    name: propertyName,
    type: typeof value,
    kotlinType: propertyType,
    isNullable: typeInfo.isNullable,
    isVal: options.useDataClasses || !options.generateGettersSetters,
    defaultValue: typeInfo.defaultValue,
    annotations,
    description: "",
    visibility: options.visibility,
  };
};

// Generate Kotlin class from object with enhanced features
const generateKotlinClass = (
  obj: any,
  className: string,
  packageName: string,
  options: KotlinTypeOptions,
  imports: string[] = [],
): KotlinClassInfo => {
  const properties: KotlinPropertyInfo[] = [];
  const requiredImports = new Set(imports);

  if (options.generateJacksonAnnotations) {
    requiredImports.add("com.fasterxml.jackson.annotation.SerializedName");
  }
  if (options.generateGsonAnnotations) {
    requiredImports.add("com.google.gson.annotations.SerializedName");
  }
  if (options.generateParcelable) {
    requiredImports.add("android.os.Parcelable");
    requiredImports.add("android.os.Parcel");
  }
  if (options.generateSerializable) {
    requiredImports.add("java.io.Serializable");
  }

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    let index = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__comment__") continue;

      const property = generateKotlinProperty(key, value, index, options);
      properties.push(property);

      // Add required imports from type inference
      const typeInfo = inferKotlinType(value, key, options);
      typeInfo.imports.forEach((imp) => requiredImports.add(imp));

      index++;
    }
  }

  return {
    name: sanitizeKotlinIdentifier(className),
    properties,
    sealedSubclasses: [],
    companionObject: [],
    typeAliases: [],
    packageName,
    imports: Array.from(requiredImports),
    annotations: [],
    sealed: options.useSealedClasses,
    value: options.useValueClasses,
    data: options.useDataClasses,
    inline: options.useInlineClasses,
    description: "",
  };
};

// Generate Kotlin code string with enhanced formatting
const generateKotlinCode = (classes: KotlinClassInfo[], config: KotlinGenerationConfig): string => {
  const parts: string[] = [];
  const options = config.options;

  // File header
  if (options.fileHeader) {
    parts.push(options.fileHeader);
    parts.push("");
  }

  // Package declaration
  if (config.packageName) {
    parts.push(`package ${config.packageName}`);
    parts.push("");
  }

  // Imports
  const allImports = new Set<string>();
  classes.forEach((cls) => {
    cls.imports.forEach((imp) => allImports.add(imp));
    config.imports.forEach((imp) => allImports.add(imp));
  });

  // Add common imports based on options
  if (options.generateParcelable) {
    allImports.add("android.os.Parcelable");
    allImports.add("android.os.Parcel");
  }
  if (options.generateSerializable) {
    allImports.add("java.io.Serializable");
  }
  if (options.generateJacksonAnnotations) {
    allImports.add("com.fasterxml.jackson.annotation.SerializedName");
  }
  if (options.generateGsonAnnotations) {
    allImports.add("com.google.gson.annotations.SerializedName");
  }

  Array.from(allImports)
    .sort()
    .forEach((imp) => {
      parts.push(`import ${imp}`);
    });

  parts.push("");

  // Generate each class
  classes.forEach((cls, index) => {
    parts.push("");

    // Class annotations
    cls.annotations.forEach((annotation) => {
      parts.push(annotation);
    });

    // Class declaration
    const classKeyword = cls.data
      ? "data class"
      : cls.value
        ? "value class"
        : cls.inline
          ? "inline class"
          : "class";
    const sealedKeyword = cls.sealed ? "sealed " : "";
    parts.push(`${cls.visibility} ${sealedKeyword}${classKeyword} ${cls.name}(`);

    // Properties
    cls.properties.forEach((prop, propIndex) => {
      const valKeyword = prop.isVal ? "val" : "var";
      const annotations = prop.annotations.length > 0 ? prop.annotations.join(" ") + " " : "";
      const nullable = prop.isNullable ? "?" : "";
      const nullableMark = prop.isNullable && prop.defaultValue ? " = null" : "";
      const defaultValue = prop.defaultValue ? " = " + prop.defaultValue : nullableMark;
      const comma = propIndex < cls.properties.length - 1 ? "," : "";

      parts.push(
        `    ${annotations}${valKeyword} ${prop.name}: ${prop.kotlinType}${defaultValue}${comma}`,
      );
    });

    parts.push(")");

    // Inheritance
    const implementsList: string[] = [];
    if (options.generateParcelable) {
      implementsList.push("Parcelable");
    }
    if (options.generateSerializable) {
      implementsList.push("Serializable");
    }

    if (implementsList.length > 0) {
      parts.push(`    : ${implementsList.join(", ")}`);
    }

    parts.push(" {");

    // Parcelable implementation
    if (options.generateParcelable) {
      parts.push("");
      parts.push("    override fun writeToParcel(parcel: Parcel, flags: Int) {");
      cls.properties.forEach((prop) => {
        if (prop.kotlinType === "String") {
          parts.push(`        parcel.writeString(${prop.name})`);
        } else if (prop.kotlinType.includes("Int")) {
          parts.push(`        parcel.writeInt(${prop.name} ?: 0)`);
        } else if (prop.kotlinType.includes("Long")) {
          parts.push(`        parcel.writeLong(${prop.name} ?: 0L)`);
        } else if (prop.kotlinType.includes("Double")) {
          parts.push(`        parcel.writeDouble(${prop.name} ?: 0.0)`);
        } else if (prop.kotlinType.includes("Boolean")) {
          parts.push(`        parcel.writeByte(if (${prop.name} == true) 1 else 0)`);
        } else {
          parts.push(`        // TODO: Handle ${prop.name} of type ${prop.kotlinType}`);
        }
      });
      parts.push("    }");
      parts.push("");
      parts.push("    override fun describeContents(): Int {");
      parts.push("        return 0");
      parts.push("    }");
      parts.push("");
      parts.push("    companion object CREATOR : Parcelable.Creator<${cls.name}> {");
      parts.push("        override fun createFromParcel(parcel: Parcel): ${cls.name} {");
      parts.push(`            return ${cls.name}(`);
      cls.properties.forEach((prop, propIndex) => {
        const read = prop.kotlinType.includes("String")
          ? "parcel.readString()"
          : prop.kotlinType.includes("Int")
            ? "parcel.readInt()"
            : prop.kotlinType.includes("Long")
              ? "parcel.readLong()"
              : prop.kotlinType.includes("Double")
                ? "parcel.readDouble()"
                : prop.kotlinType.includes("Boolean")
                  ? "parcel.readByte() == 1.toByte()"
                  : "null /* TODO */";
        const comma = propIndex < cls.properties.length - 1 ? "," : "";
        parts.push(`                ${prop.name} = ${read}${comma}`);
      });
      parts.push("            )");
      parts.push("        }");
      parts.push("        override fun newArray(size: Int): Array<${cls.name}?> {");
      parts.push("            return arrayOfNulls(size)");
      parts.push("        }");
      parts.push("    }");
    }

    // Companion object
    if (options.generateCompanionObject) {
      parts.push("");
      parts.push("    companion object {");
      parts.push("        @JvmStatic");
      parts.push(`        fun empty(): ${cls.name} {`);
      parts.push(`            return ${cls.name}(`);
      cls.properties.forEach((prop, propIndex) => {
        const defaultValue = prop.kotlinType.includes("String")
          ? '""'
          : prop.kotlinType.includes("Int") || prop.kotlinType.includes("Long")
            ? "0"
            : prop.kotlinType.includes("Double") || prop.kotlinType.includes("Float")
              ? "0.0"
              : prop.kotlinType.includes("Boolean")
                ? "false"
                : "null";
        const comma = propIndex < cls.properties.length - 1 ? "," : "";
        parts.push(`                ${prop.name} = ${defaultValue}${comma}`);
      });
      parts.push("            )");
      parts.push("        }");
      parts.push("    }");
    }

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
interface JsonToKotlinProps {
  jsonData?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<KotlinTypeOptions>;
}

export const JsonToKotlin: React.FC<JsonToKotlinProps> = ({
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
  const [options, setOptions] = useState<KotlinTypeOptions>({
    ...DEFAULT_KOTLIN_OPTIONS,
    ...initialOptions,
  });
  const [config, setConfig] = useState<KotlinGenerationConfig>({
    rootClassName: options.className,
    packageName: options.packageName,
    visibility: options.visibility,
    imports: options.imports,
    options,
  });

  // Memoized Kotlin class generation
  const generatedClasses = useMemo(() => {
    if (!validation.isValid || !jsonInput.trim()) return [];

    try {
      const parsedData = JSON.parse(jsonInput);
      const rootClass = generateKotlinClass(
        parsedData,
        config.rootClassName,
        config.packageName,
        config.options,
        config.imports,
      );

      return [rootClass]; // In a full implementation, we'd handle nested objects recursively
    } catch (error) {
      return [];
    }
  }, [jsonInput, validation.isValid, config]);

  // Memoized Kotlin code generation
  const generatedCode = useMemo(() => {
    if (!validation.isValid || generatedClasses.length === 0) return "";

    const code = generateKotlinCode(generatedClasses, config);
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
      packageName: options.packageName,
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

  // Download as .kt file
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.rootClassName}.kt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset to defaults
  const handleReset = () => {
    setOptions(DEFAULT_KOTLIN_OPTIONS);
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
                JSON to Kotlin Converter
                <Badge variant="outline">Kotlin {options.kotlinVersion}</Badge>
              </CardTitle>
              <CardDescription>
                Generate modern Kotlin data classes from JSON with serialization support
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
                  <TabsTrigger value="class-type">Class Type</TabsTrigger>
                  <TabsTrigger value="serialization">Serialization</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kotlin-version">Kotlin Version</Label>
                    <select
                      id="kotlin-version"
                      className="w-full p-2 border rounded-md"
                      value={options.kotlinVersion}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          kotlinVersion: e.target.value as KotlinTypeOptions["kotlinVersion"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="2.0">Kotlin 2.0</option>
                      <option value="1.9">Kotlin 1.9</option>
                      <option value="1.8">Kotlin 1.8</option>
                      <option value="1.7">Kotlin 1.7</option>
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
                    <Label htmlFor="package-name">Package Name</Label>
                    <input
                      id="package-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.packageName}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, packageName: e.target.value }))
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
                          visibility: e.target.value as KotlinTypeOptions["visibility"],
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
                      id="nullable-types"
                      checked={options.useNullableTypes}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useNullableTypes: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="nullable-types">Nullable Types</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="getters-setters"
                      checked={options.generateGettersSetters}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateGettersSetters: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="getters-setters">Generate Getters/Setters</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="class-type" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="data-classes"
                      checked={options.useDataClasses}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useDataClasses: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="data-classes">Data Classes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="value-classes"
                      checked={options.useValueClasses}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useValueClasses: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="value-classes">Value Classes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sealed-classes"
                      checked={options.useSealedClasses}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useSealedClasses: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="sealed-classes">Sealed Classes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="inline-classes"
                      checked={options.useInlineClasses}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useInlineClasses: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="inline-classes">Inline Classes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="type-aliases"
                      checked={options.useTypeAliases}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, useTypeAliases: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="type-aliases">Type Aliases</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="companion-object"
                      checked={options.generateCompanionObject}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateCompanionObject: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="companion-object">Companion Object</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="to-string"
                      checked={options.generateToString}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateToString: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="to-string">Generate toString()</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="equals-hashcode"
                      checked={options.generateEqualsHashCode}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateEqualsHashCode: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="equals-hashcode">Generate equals()/hashCode()</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="copy-method"
                      checked={options.generateCopyMethod}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateCopyMethod: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="copy-method">Generate copy()</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="serialization" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="jackson-annotations"
                      checked={options.generateJacksonAnnotations}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateJacksonAnnotations: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="jackson-annotations">Jackson Annotations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="gson-annotations"
                      checked={options.generateGsonAnnotations}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateGsonAnnotations: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="gson-annotations">Gson Annotations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="kotlinx-serialization"
                      checked={options.generateKotlinxSerialization}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateKotlinxSerialization: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="kotlinx-serialization">Kotlinx Serialization</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="parcelable"
                      checked={options.generateParcelable}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateParcelable: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="parcelable">Android Parcelable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="serializable"
                      checked={options.generateSerializable}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, generateSerializable: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="serializable">Java Serializable</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="additional-imports">Additional Imports (one per line)</Label>
                  <textarea
                    id="additional-imports"
                    className="w-full h-20 p-2 border rounded-md font-mono text-sm"
                    placeholder="android.os.Parcelable&#10;java.util.Date&#10;..."
                    value={options.imports.join("\n")}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        imports: e.target.value.split("\n").filter((line) => line.trim()),
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
                <Label>Generated Kotlin Code</Label>
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
                        {cls.data && "data class"}
                        {cls.value && "value class"}
                        {cls.sealed && "sealed class"}
                        {cls.inline && "inline class"}
                        {` • ${cls.packageName}`}
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

export default JsonToKotlin;
