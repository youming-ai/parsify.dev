"use client";

import { CheckCircle, Copy, Download, Package, RefreshCw, Settings, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ConversionOptions {
  className: string;
  packageName: string;
  includeConstructors: boolean;
  includeGettersSetters: boolean;
  includeToString: boolean;
  includeEqualsHashCode: boolean;
  useJacksonAnnotations: boolean;
  accessModifier: "public" | "private" | "protected";
  useLombok: boolean;
  finalFields: boolean;
  usePrimitiveTypes: boolean;
  dateFormat: string;
}

interface JavaClass {
  className: string;
  packageName: string;
  imports: string[];
  fields: JavaField[];
  nestedClasses: JavaClass[];
}

interface JavaField {
  name: string;
  type: string;
  isArray: boolean;
  isGeneric: boolean;
  genericType?: string;
  nullable: boolean;
}

const defaultOptions: ConversionOptions = {
  className: "MyClass",
  packageName: "com.example",
  includeConstructors: true,
  includeGettersSetters: true,
  includeToString: true,
  includeEqualsHashCode: false,
  useJacksonAnnotations: true,
  accessModifier: "public",
  useLombok: false,
  finalFields: false,
  usePrimitiveTypes: false,
  dateFormat: "yyyy-MM-dd",
};

export default function JavaConverterClient() {
  const [jsonInput, setJsonInput] = useState("");
  const [javaOutput, setJavaOutput] = useState("");
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions);
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedClasses, setGeneratedClasses] = useState<string[]>([]);

  const detectJavaType = (value: any, fieldName: string): string => {
    if (value === null) return options.usePrimitiveTypes ? "Object" : "Object";

    const type = typeof value;

    switch (type) {
      case "string":
        // Check for date patterns
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          return "String"; // Could be LocalDate with proper parsing
        }
        return "String";
      case "number":
        if (Number.isInteger(value)) {
          return options.usePrimitiveTypes ? "int" : "Integer";
        }
        return options.usePrimitiveTypes ? "double" : "Double";
      case "boolean":
        return options.usePrimitiveTypes ? "boolean" : "Boolean";
      case "object":
        if (Array.isArray(value)) {
          if (value.length > 0) {
            const elementType = detectJavaType(value[0], `${fieldName}Item`);
            return `List<${elementType}>`;
          }
          return "List<Object>";
        }
        return "Object"; // Will be replaced with custom class name
      default:
        return "Object";
    }
  };

  const toCamelCase = (str: string): string => {
    return str
      .replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase())
      .replace(/(?:^|[A-Z])\w/g, (match, index) => (index === 0 ? match.toUpperCase() : match))
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const toPascalCase = (str: string): string => {
    return toCamelCase(str);
  };

  const sanitizeFieldName = (str: string): string => {
    let fieldName = str.replace(/[^a-zA-Z0-9_]/g, "");

    // Ensure it doesn't start with a number
    if (/^\d/.test(fieldName)) {
      fieldName = `field${fieldName}`;
    }

    // Handle Java keywords
    const javaKeywords = [
      "abstract",
      "assert",
      "boolean",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "class",
      "const",
      "continue",
      "default",
      "do",
      "double",
      "else",
      "enum",
      "extends",
      "final",
      "finally",
      "float",
      "for",
      "goto",
      "if",
      "implements",
      "import",
      "instanceof",
      "int",
      "interface",
      "long",
      "native",
      "new",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "short",
      "static",
      "strictfp",
      "super",
      "switch",
      "synchronized",
      "this",
      "throw",
      "throws",
      "transient",
      "try",
      "void",
      "volatile",
      "while",
    ];

    if (javaKeywords.includes(fieldName.toLowerCase())) {
      fieldName = `${fieldName}Value`;
    }

    return fieldName;
  };

  const parseJSONToJavaClass = (json: any, className: string, depth: number = 0): JavaClass => {
    const javaClass: JavaClass = {
      className: className,
      packageName: options.packageName,
      imports: [],
      fields: [],
      nestedClasses: [],
    };

    // Add List import if we detect arrays
    if (JSON.stringify(json).includes("[")) {
      javaClass.imports.push("java.util.List");
    }

    // Add Jackson annotations if enabled
    if (options.useJacksonAnnotations) {
      javaClass.imports.push("com.fasterxml.jackson.annotation.JsonIgnoreProperties");
      javaClass.imports.push("com.fasterxml.jackson.annotation.JsonProperty");
    }

    if (Array.isArray(json)) {
      // Handle arrays - create a class for the array elements
      if (json.length > 0) {
        const elementType = parseJSONToJavaClass(json[0], `${className}Item`, depth + 1);
        javaClass.nestedClasses.push(elementType);
        javaClass.fields.push({
          name: "items",
          type: `List<${elementType.className}>`,
          isArray: true,
          isGeneric: true,
          genericType: elementType.className,
          nullable: false,
        });
      }
    } else if (typeof json === "object" && json !== null) {
      // Handle objects
      Object.entries(json).forEach(([key, value]) => {
        const fieldName = sanitizeFieldName(key);
        const fieldType = detectJavaType(value, fieldName);

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Create nested class
          const nestedClassName = toPascalCase(key);
          const nestedClass = parseJSONToJavaClass(value, nestedClassName, depth + 1);
          javaClass.nestedClasses.push(nestedClass);

          javaClass.fields.push({
            name: fieldName,
            type: nestedClass.className,
            isArray: false,
            isGeneric: false,
            nullable: value === null,
          });
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          // Array of objects
          const nestedClassName = `${toPascalCase(key)}Item`;
          const nestedClass = parseJSONToJavaClass(value[0], nestedClassName, depth + 1);
          javaClass.nestedClasses.push(nestedClass);

          javaClass.fields.push({
            name: fieldName,
            type: `List<${nestedClass.className}>`,
            isArray: true,
            isGeneric: true,
            genericType: nestedClass.className,
            nullable: false,
          });
        } else {
          javaClass.fields.push({
            name: fieldName,
            type: fieldType,
            isArray: Array.isArray(value),
            isGeneric: Array.isArray(value) && value.length > 0 && typeof value[0] !== "object",
            genericType:
              Array.isArray(value) && value.length > 0
                ? detectJavaType(value[0], fieldName)
                : undefined,
            nullable: value === null,
          });
        }
      });
    }

    return javaClass;
  };

  const generateJavaClass = (javaClass: JavaClass, indent: string = ""): string => {
    let result = "";

    // Package declaration
    if (javaClass.packageName) {
      result += `package ${javaClass.packageName};\n\n`;
    }

    // Imports
    const imports = [
      ...new Set([...javaClass.imports, ...javaClass.nestedClasses.map((c) => c.className)]),
    ];
    if (imports.length > 0) {
      javaClass.nestedClasses.forEach((nested) => {
        result += `import ${javaClass.packageName}.${nested.className};\n`;
      });
      javaClass.imports.forEach((imp) => {
        result += `import ${imp};\n`;
      });
      result += "\n";
    }

    // Class annotations
    if (options.useJacksonAnnotations) {
      result += "@JsonIgnoreProperties(ignoreUnknown = true)\n";
    }

    // Class declaration
    const classKeyword = options.useLombok ? "@Data" : "";
    if (classKeyword) {
      result += `import lombok.Data;\n\n`;
      result += `${classKeyword}\n`;
    }

    result += `${options.accessModifier} class ${javaClass.className} {\n\n`;

    // Fields
    javaClass.fields.forEach((field) => {
      if (options.useJacksonAnnotations) {
        result += `    @JsonProperty("${field.name}")\n`;
      }

      const accessMod = options.useLombok ? "private" : "private";
      const finalMod = options.finalFields ? " final" : "";
      result += `    ${accessMod}${finalMod} ${field.type} ${field.name};\n\n`;
    });

    // Methods (if not using Lombok)
    if (!options.useLombok) {
      // Constructors
      if (options.includeConstructors) {
        result += `    public ${javaClass.className}() {\n    }\n\n`;

        if (javaClass.fields.length > 0) {
          const params = javaClass.fields.map((f) => `${f.type} ${f.name}`).join(", ");
          result += `    public ${javaClass.className}(${params}) {\n`;
          javaClass.fields.forEach((field) => {
            result += `        this.${field.name} = ${field.name};\n`;
          });
          result += `    }\n\n`;
        }
      }

      // Getters and Setters
      if (options.includeGettersSetters) {
        javaClass.fields.forEach((field) => {
          const capitalizedName = toPascalCase(field.name);

          // Getter
          result += `    public ${field.type} get${capitalizedName}() {\n`;
          result += `        return this.${field.name};\n`;
          result += `    }\n\n`;

          // Setter
          result += `    public void set${capitalizedName}(${field.type} ${field.name}) {\n`;
          result += `        this.${field.name} = ${field.name};\n`;
          result += `    }\n\n`;
        });
      }

      // toString method
      if (options.includeToString) {
        result += `    @Override\n`;
        result += `    public String toString() {\n`;
        result += `        return "${javaClass.className}{" +\n`;
        javaClass.fields.forEach((field, index) => {
          const comma = index < javaClass.fields.length - 1 ? ' +",' : "";
          result += `                "${field.name}='" + ${field.name} + '\\'' +\n${comma}`;
        });
        result += `                '}';\n`;
        result += `    }\n\n`;
      }

      // equals and hashCode
      if (options.includeEqualsHashCode) {
        result += `    @Override\n`;
        result += `    public boolean equals(Object o) {\n`;
        result += `        if (this == o) return true;\n`;
        result += `        if (o == null || getClass() != o.getClass()) return false;\n`;
        result += `        ${javaClass.className} that = (${javaClass.className}) o;\n`;

        javaClass.fields.forEach((field) => {
          if (field.type === "String" || field.type.includes("List")) {
            result += `        return java.util.Objects.equals(${field.name}, that.${field.name});\n`;
          } else {
            result += `        return ${field.name} == that.${field.name};\n`;
          }
        });

        result += `    }\n\n`;

        result += `    @Override\n`;
        result += `    public int hashCode() {\n`;
        if (javaClass.fields.length === 1) {
          result += `        return java.util.Objects.hash(${javaClass.fields[0].name});\n`;
        } else {
          const fieldNames = javaClass.fields.map((f) => f.name).join(", ");
          result += `        return java.util.Objects.hash(${fieldNames});\n`;
        }
        result += `    }\n\n`;
      }
    }

    result += "}\n\n";

    // Nested classes
    javaClass.nestedClasses.forEach((nested) => {
      result += generateJavaClass(nested, `${indent}    `);
    });

    return result;
  };

  const convertToJava = () => {
    if (!jsonInput.trim()) {
      setJavaOutput("");
      setIsValidJson(null);
      setGeneratedClasses([]);
      return;
    }

    setIsProcessing(true);

    try {
      const parsedJSON = JSON.parse(jsonInput);
      setIsValidJson(true);

      const javaClass = parseJSONToJavaClass(parsedJSON, toPascalCase(options.className));
      const generatedCode = generateJavaClass(javaClass);

      setJavaOutput(generatedCode);

      // Extract class names for display
      const classNames = [javaClass.className, ...javaClass.nestedClasses.map((c) => c.className)];
      setGeneratedClasses(classNames);
    } catch (_error) {
      setIsValidJson(false);
      setJavaOutput("");
      setGeneratedClasses([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(javaOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadJavaCode = () => {
    const blob = new Blob([javaOutput], { type: "text/java" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${options.className}.java`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Conversion Options
          </CardTitle>
          <CardDescription>Configure how your Java classes should be generated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                placeholder="MyClass"
                value={options.className}
                onChange={(e) => setOptions({ ...options, className: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Package Name</Label>
              <Input
                placeholder="com.example"
                value={options.packageName}
                onChange={(e) => setOptions({ ...options, packageName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Access Modifier</Label>
              <Select
                value={options.accessModifier}
                onValueChange={(value: "public" | "private" | "protected") =>
                  setOptions({ ...options, accessModifier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="protected">Protected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="jackson-annotations"
                  checked={options.useJacksonAnnotations}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, useJacksonAnnotations: checked })
                  }
                />
                <Label htmlFor="jackson-annotations">Jackson Annotations</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="use-lombok"
                  checked={options.useLombok}
                  onCheckedChange={(checked) => setOptions({ ...options, useLombok: checked })}
                />
                <Label htmlFor="use-lombok">Use Lombok @Data</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="constructors"
                  checked={options.includeConstructors}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeConstructors: checked })
                  }
                  disabled={options.useLombok}
                />
                <Label htmlFor="constructors">Constructors</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="getters-setters"
                  checked={options.includeGettersSetters}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeGettersSetters: checked })
                  }
                  disabled={options.useLombok}
                />
                <Label htmlFor="getters-setters">Getters & Setters</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="to-string"
                  checked={options.includeToString}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeToString: checked })
                  }
                  disabled={options.useLombok}
                />
                <Label htmlFor="to-string">toString()</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="equals-hashcode"
                  checked={options.includeEqualsHashCode}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeEqualsHashCode: checked })
                  }
                  disabled={options.useLombok}
                />
                <Label htmlFor="equals-hashcode">equals() & hashCode()</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="primitive-types"
                  checked={options.usePrimitiveTypes}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, usePrimitiveTypes: checked })
                  }
                />
                <Label htmlFor="primitive-types">Use Primitive Types</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="final-fields"
                  checked={options.finalFields}
                  onCheckedChange={(checked) => setOptions({ ...options, finalFields: checked })}
                />
                <Label htmlFor="final-fields">Final Fields</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>JSON Input</span>
              {isValidJson !== null && (
                <Badge variant={isValidJson ? "default" : "destructive"}>
                  {isValidJson ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid JSON
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Invalid JSON
                    </>
                  )}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <Button
              onClick={convertToJava}
              disabled={!jsonInput.trim() || isProcessing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Converting..." : "Convert to Java"}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Java Code</span>
              {generatedClasses.length > 0 && (
                <Badge variant="secondary">
                  {generatedClasses.length} class{generatedClasses.length > 1 ? "es" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Generated Java code will appear here..."
              value={javaOutput}
              readOnly
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!javaOutput}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                onClick={downloadJavaCode}
                disabled={!javaOutput}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Classes Overview */}
      {generatedClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Generated Classes
            </CardTitle>
            <CardDescription>Overview of all generated Java classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {generatedClasses.map((className, index) => (
                <Badge key={index} variant="outline" className="font-mono">
                  {className}.java
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              All classes have been generated with proper package structure and import statements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
