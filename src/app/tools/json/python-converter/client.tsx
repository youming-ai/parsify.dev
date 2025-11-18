"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Copy,
  Download,
  RefreshCw,
  Settings,
  FileCode,
  Zap,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";

interface ConversionOptions {
  className: string;
  classType: "dataclass" | "pydantic" | "standard";
  moduleName: string;
  includeConstructors: boolean;
  includeGettersSetters: boolean;
  includeToString: boolean;
  includeFromDict: boolean;
  includeToDict: boolean;
  useTypeHints: boolean;
  importsStyle: "individual" | "grouped";
  snakeCaseFields: boolean;
  optionalTypes: boolean;
}

interface PythonClass {
  className: string;
  imports: string[];
  fields: PythonField[];
  nestedClasses: PythonClass[];
}

interface PythonField {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
  defaultValue: string;
}

const defaultOptions: ConversionOptions = {
  className: "MyClass",
  classType: "dataclass",
  moduleName: "models",
  includeConstructors: true,
  includeGettersSetters: false,
  includeToString: true,
  includeFromDict: true,
  includeToDict: true,
  useTypeHints: true,
  importsStyle: "grouped",
  snakeCaseFields: true,
  optionalTypes: true,
};

export default function PythonConverterClient() {
  const [jsonInput, setJsonInput] = useState("");
  const [pythonOutput, setPythonOutput] = useState("");
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions);
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedClasses, setGeneratedClasses] = useState<string[]>([]);

  const toSnakeCase = (str: string): string => {
    return str
      .replace(/([A-Z])/g, "_$1")
      .replace(/^_/, "")
      .toLowerCase();
  };

  const toPascalCase = (str: string): string => {
    return str
      .replace(/(?:^|_)([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "");
  };

  const sanitizeFieldName = (str: string): string => {
    let fieldName = str.replace(/[^a-zA-Z0-9_]/g, "_");

    // Ensure it doesn't start with a number
    if (/^\d/.test(fieldName)) {
      fieldName = "field_" + fieldName;
    }

    // Handle Python keywords
    const pythonKeywords = [
      "and",
      "as",
      "assert",
      "break",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "nonlocal",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield",
      "False",
      "None",
      "True",
    ];

    if (pythonKeywords.includes(fieldName)) {
      fieldName = fieldName + "_value";
    }

    return fieldName;
  };

  const detectPythonType = (value: any, fieldName: string): string => {
    if (value === null) {
      return options.optionalTypes ? "Optional[str]" : "str";
    }

    const type = typeof value;

    switch (type) {
      case "string":
        // Check for date patterns
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          return "str"; // Could be datetime with proper parsing
        }
        return "str";
      case "number":
        if (Number.isInteger(value)) {
          return "int";
        }
        return "float";
      case "boolean":
        return "bool";
      case "object":
        if (Array.isArray(value)) {
          if (value.length > 0) {
            const elementType = detectPythonType(value[0], fieldName + "_item");
            return `List[${elementType}]`;
          }
          return "List[str]";
        }
        return "str"; // Will be replaced with custom class name
      default:
        return "str";
    }
  };

  const parseJSONToPythonClass = (json: any, className: string, depth: number = 0): PythonClass => {
    const pythonClass: PythonClass = {
      className: toPascalCase(className),
      imports: [],
      fields: [],
      nestedClasses: [],
    };

    // Add required imports
    if (Array.isArray(json) || JSON.stringify(json).includes("[")) {
      pythonClass.imports.push("from typing import List");
    }

    if (options.optionalTypes && JSON.stringify(json).includes("null")) {
      pythonClass.imports.push("from typing import Optional");
    }

    // Add class type specific imports
    if (options.classType === "dataclass") {
      pythonClass.imports.push("from dataclasses import dataclass");
    } else if (options.classType === "pydantic") {
      pythonClass.imports.push("from pydantic import BaseModel");
    }

    if (Array.isArray(json)) {
      // Handle arrays - create a class for the array elements
      if (json.length > 0) {
        const elementClass = parseJSONToPythonClass(json[0], className + "Item", depth + 1);
        pythonClass.nestedClasses.push(elementClass);

        pythonClass.fields.push({
          name: "items",
          type: `List[${elementClass.className}]`,
          optional: false,
          hasDefault: false,
          defaultValue: "",
        });
      }
    } else if (typeof json === "object" && json !== null) {
      // Handle objects
      Object.entries(json).forEach(([key, value]) => {
        const fieldName = options.snakeCaseFields
          ? toSnakeCase(sanitizeFieldName(key))
          : sanitizeFieldName(key);
        let fieldType = detectPythonType(value, fieldName);

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Create nested class
          const nestedClassName = toPascalCase(key);
          const nestedClass = parseJSONToPythonClass(value, nestedClassName, depth + 1);
          pythonClass.nestedClasses.push(nestedClass);

          pythonClass.fields.push({
            name: fieldName,
            type: nestedClass.className,
            optional: value === null,
            hasDefault: false,
            defaultValue: "",
          });
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          // Array of objects
          const nestedClassName = toPascalCase(key) + "Item";
          const nestedClass = parseJSONToPythonClass(value[0], nestedClassName, depth + 1);
          pythonClass.nestedClasses.push(nestedClass);

          pythonClass.fields.push({
            name: fieldName,
            type: `List[${nestedClass.className}]`,
            optional: false,
            hasDefault: false,
            defaultValue: "",
          });
        } else {
          // Handle optional types
          if (options.optionalTypes && value === null) {
            const baseType = detectPythonType(value !== null ? value : "", fieldName);
            fieldType = `Optional[${baseType}]`;
          }

          pythonClass.fields.push({
            name: fieldName,
            type: fieldType,
            optional: value === null,
            hasDefault: value === null,
            defaultValue: value === null ? " = None" : "",
          });
        }
      });
    }

    return pythonClass;
  };

  const generatePythonClass = (pythonClass: PythonClass, indent: string = ""): string => {
    let result = "";

    // Add imports
    if (options.importsStyle === "grouped") {
      const uniqueImports = [...new Set(pythonClass.imports)];
      result += uniqueImports.join("\n") + "\n\n";
    }

    // Generate nested classes first
    pythonClass.nestedClasses.forEach((nested) => {
      result += generatePythonClass(nested, indent) + "\n\n";
    });

    // Class declaration
    if (options.classType === "dataclass") {
      result += `@dataclass\n`;
    } else if (options.classType === "pydantic") {
      result += `class ${pythonClass.className}(BaseModel):\n`;
    } else {
      result += `class ${pythonClass.className}:\n`;
    }

    if (options.classType === "standard") {
      result += indent + '    """\n';
      result += indent + `    ${pythonClass.className} data structure\n`;
      result += indent + '    """\n\n';

      // Constructor for standard class
      if (options.includeConstructors) {
        result += indent + "    def __init__(self";
        pythonClass.fields.forEach((field, index) => {
          const comma = index < pythonClass.fields.length - 1 ? ", " : "";
          const typeHint = options.useTypeHints ? `: ${field.type}` : "";
          result += `, ${field.name}${typeHint}${comma}`;
        });
        result += "):\n";

        pythonClass.fields.forEach((field) => {
          result += indent + `        self.${field.name} = ${field.name}\n`;
        });
        result += "\n";
      }
    }

    // Fields
    if (options.classType === "pydantic") {
      pythonClass.fields.forEach((field) => {
        const typeHint = options.useTypeHints ? `: ${field.type}` : "";
        result += indent + `    ${field.name}${typeHint}${field.defaultValue}\n`;
      });
    } else if (options.classType === "dataclass") {
      pythonClass.fields.forEach((field) => {
        const typeHint = options.useTypeHints ? `: ${field.type}` : "";
        result += indent + `    ${field.name}${typeHint}${field.defaultValue}\n`;
      });
    } else if (options.classType === "standard" && !options.includeConstructors) {
      pythonClass.fields.forEach((field) => {
        const typeHint = options.useTypeHints ? `: ${field.type}` : "";
        result += indent + `    ${field.name}${typeHint}${field.defaultValue}\n`;
      });
      result += "\n";
    }

    // Methods for standard class
    if (options.classType === "standard") {
      // Getters and setters
      if (options.includeGettersSetters) {
        pythonClass.fields.forEach((field) => {
          const capitalizedName = toPascalCase(field.name);

          // Getter
          result += indent + `    def get_${field.name}(self):\n`;
          result += indent + `        return self.${field.name}\n\n`;

          // Setter
          result += indent + `    def set_${field.name}(self, value):\n`;
          result += indent + `        self.${field.name} = value\n\n`;
        });
      }

      // to_dict method
      if (options.includeToDict) {
        result += indent + "    def to_dict(self):\n";
        result += indent + "        return {\n";
        pythonClass.fields.forEach((field, index) => {
          const comma = index < pythonClass.fields.length - 1 ? "," : "";
          result += indent + `            '${field.name}': self.${field.name}${comma}\n`;
        });
        result += indent + "        }\n\n";
      }

      // from_dict class method
      if (options.includeFromDict) {
        result += indent + "    @classmethod\n";
        result += indent + `    def from_dict(cls, data):\n`;
        result += indent + `        return cls(\n`;
        pythonClass.fields.forEach((field, index) => {
          const comma = index < pythonClass.fields.length - 1 ? "," : "";
          result += indent + `            ${field.name} = data.get('${field.name}')${comma}\n`;
        });
        result += indent + "        )\n\n";
      }

      // __str__ method
      if (options.includeToString) {
        result += indent + "    def __str__(self):\n";
        result += indent + `        return f"${pythonClass.className}({`;
        pythonClass.fields.forEach((field, index) => {
          const comma = index < pythonClass.fields.length - 1 ? ", " : "";
          result += `${field.name}={self.${field.name}}${comma}`;
        });
        result += indent + '})"\n\n';
      }
    }

    return result.trim();
  };

  const convertToPython = () => {
    if (!jsonInput.trim()) {
      setPythonOutput("");
      setIsValidJson(null);
      setGeneratedClasses([]);
      return;
    }

    setIsProcessing(true);

    try {
      const parsedJSON = JSON.parse(jsonInput);
      setIsValidJson(true);

      const pythonClass = parseJSONToPythonClass(parsedJSON, options.className);
      const generatedCode = generatePythonClass(pythonClass);

      setPythonOutput(generatedCode);

      // Extract class names for display
      const classNames = [
        pythonClass.className,
        ...pythonClass.nestedClasses.map((c) => c.className),
      ];
      setGeneratedClasses(classNames);
    } catch (error) {
      setIsValidJson(false);
      setPythonOutput("");
      setGeneratedClasses([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pythonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadPythonCode = () => {
    const blob = new Blob([pythonOutput], { type: "text/python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${options.className.toLowerCase()}.py`;
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
          <CardDescription>Configure how your Python classes should be generated</CardDescription>
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
              <Label>Class Type</Label>
              <Select
                value={options.classType}
                onValueChange={(value: "dataclass" | "pydantic" | "standard") =>
                  setOptions({ ...options, classType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dataclass">Dataclass</SelectItem>
                  <SelectItem value="pydantic">Pydantic Model</SelectItem>
                  <SelectItem value="standard">Standard Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Module Name</Label>
              <Input
                placeholder="models"
                value={options.moduleName}
                onChange={(e) => setOptions({ ...options, moduleName: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-type-hints"
                  checked={options.useTypeHints}
                  onCheckedChange={(checked) => setOptions({ ...options, useTypeHints: checked })}
                />
                <Label htmlFor="use-type-hints">Type Hints</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="snake-case-fields"
                  checked={options.snakeCaseFields}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, snakeCaseFields: checked })
                  }
                />
                <Label htmlFor="snake-case-fields">Snake Case Fields</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="optional-types"
                  checked={options.optionalTypes}
                  onCheckedChange={(checked) => setOptions({ ...options, optionalTypes: checked })}
                />
                <Label htmlFor="optional-types">Optional Types</Label>
              </div>

              {options.classType === "standard" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="constructors"
                      checked={options.includeConstructors}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, includeConstructors: checked })
                      }
                    />
                    <Label htmlFor="constructors">Constructor</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="getters-setters"
                      checked={options.includeGettersSetters}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, includeGettersSetters: checked })
                      }
                    />
                    <Label htmlFor="getters-setters">Getters & Setters</Label>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="to-string"
                  checked={options.includeToString}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeToString: checked })
                  }
                />
                <Label htmlFor="to-string">__str__() Method</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="from-dict"
                  checked={options.includeFromDict}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeFromDict: checked })
                  }
                />
                <Label htmlFor="from-dict">from_dict() Method</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="to-dict"
                  checked={options.includeToDict}
                  onCheckedChange={(checked) => setOptions({ ...options, includeToDict: checked })}
                />
                <Label htmlFor="to-dict">to_dict() Method</Label>
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
              onClick={convertToPython}
              disabled={!jsonInput.trim() || isProcessing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Converting..." : "Convert to Python"}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Python Code</span>
              {generatedClasses.length > 0 && (
                <Badge variant="secondary">
                  {generatedClasses.length} class{generatedClasses.length > 1 ? "es" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Generated Python code will appear here..."
              value={pythonOutput}
              readOnly
              className="min-h-64 font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!pythonOutput}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                onClick={downloadPythonCode}
                disabled={!pythonOutput}
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
            <CardDescription>Overview of all generated Python classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {generatedClasses.map((className, index) => (
                <Badge key={index} variant="outline" className="font-mono">
                  {className}.py
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              All classes have been generated with proper type hints and import statements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
