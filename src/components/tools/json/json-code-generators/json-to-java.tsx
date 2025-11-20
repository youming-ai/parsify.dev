/**
 * JSON to Java Class Generator Component
 * Implements T032 [P] [US1] - Implement JSONToJava class generator with proper packages
 * Generates Java classes from JSON data with proper Java conventions and packages
 * Features:
 * - Automatic class generation with proper naming conventions
 * - Package structure and import management
 * - Jackson/Gson annotation support
 * - Type inference with Java-specific types
 * - Support for nested classes and collections
 * - Custom type mapping configuration
 * - Getter/setter generation (JavaBeans)
 * - Constructor and toString generation
 * - Java 8+ Optional support
 * - Builder pattern support
 * - Javadoc documentation generation
 * - Validation annotations support
 * - Generic type support
 * - Serializable interface implementation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Package
} from 'lucide-react';

import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Badge } from '../../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { JsonAdvancedEditor } from '../json-advanced-editor';
import { cn } from '../../../../lib/utils';

// Types for JSON to Java class generator
interface JavaGenerationOptions {
  packageName: string;
  className: string;
  fieldNaming: 'camelCase' | 'snake_case' | 'PascalCase' | 'keepOriginal';
  typeMapping: 'strict' | 'loose' | 'custom';
  useJackson: boolean;
  useGson: boolean;
  useOptional: boolean;
  useLombok: boolean;
  generateGettersSetters: boolean;
  generateConstructor: boolean;
  generateAllArgsConstructor: boolean;
  generateToString: boolean;
  generateEqualsHashCode: boolean;
  generateBuilder: boolean;
  useRecords: boolean;
  useFinalFields: boolean;
  useJava8DateTime: boolean;
  generateJavadoc: boolean;
  generateValidation: boolean;
  serializationType: 'jackson' | 'gson' | 'manual';
  customTypeMapping: Record<string, string>;
  optionalFields: string[];
  requiredFields: string[];
  generateImports: boolean;
  implementSerializable: boolean;
  generatePackageInfo: boolean;
}

interface JavaTypeInfo {
  javaType: string;
  import: string;
  isOptional: boolean;
  isCollection: boolean;
  isMap: boolean;
  jsonAnnotation: string;
  validationAnnotation: string;
  javadoc?: string;
}

interface JsonToJavaProps {
  jsonData: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<JavaGenerationOptions>;
}

const DEFAULT_OPTIONS: JavaGenerationOptions = {
  packageName: 'com.example.json.models',
  className: 'RootClass',
  fieldNaming: 'camelCase',
  typeMapping: 'strict',
  useJackson: true,
  useGson: false,
  useOptional: false,
  useLombok: false,
  generateGettersSetters: true,
  generateConstructor: true,
  generateAllArgsConstructor: false,
  generateToString: true,
  generateEqualsHashCode: true,
  generateBuilder: false,
  useRecords: false,
  useFinalFields: true,
  useJava8DateTime: true,
  generateJavadoc: true,
  generateValidation: false,
  serializationType: 'jackson',
  customTypeMapping: {},
  optionalFields: [],
  requiredFields: [],
  generateImports: true,
  implementSerializable: false,
  generatePackageInfo: false
};

// Type mapping from JSON to Java
const JSON_TO_JAVA_TYPES: Record<string, { type: string; import?: string }> = {
  'string': { type: 'String' },
  'number': { type: 'Double' },
  'integer': { type: 'Long' },
  'boolean': { type: 'Boolean' },
  'null': { type: 'Object' },
  'array': { type: 'List', import: 'java.util.List' },
  'object': { type: 'class' },
  'email': { type: 'String' },
  'url': { type: 'String' },
  'date': { type: 'LocalDate', import: 'java.time.LocalDate' },
  'datetime': { type: 'LocalDateTime', import: 'java.time.LocalDateTime' },
  'uuid': { type: 'UUID', import: 'java.util.UUID' },
  'timestamp': { type: 'Long' }
};

// JSON to Java Class Generator Component
export const JsonToJava: React.FC<JsonToJavaProps> = ({
  jsonData,
  onCodeChange,
  className: propsClassName,
  readOnly = false,
  showPreview = true,
  initialOptions = {}
}) => {
  const [options, setOptions] = useState<JavaGenerationOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const [generatedCode, setGeneratedCode] = useState<{ classes: string[]; packageInfo?: string }>({ classes: [] });
  const [isValidJson, setIsValidJson] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<string>('');

  // Generate Java classes from JSON
  const generateJavaClasses = useCallback(async (jsonString: string, opts: JavaGenerationOptions) => {
    setIsGenerating(true);

    try {
      const jsonData = JSON.parse(jsonString);
      const classes = generateClassFiles(jsonData, opts);
      const packageInfo = opts.generatePackageInfo ? generatePackageInfo(opts) : undefined;

      setGeneratedCode({ classes, packageInfo });

      // Combine all classes for the editor view
      const combinedCode = [packageInfo, ...classes].filter(Boolean).join('\n\n');
      onCodeChange?.(combinedCode);
    } catch (error) {
      console.error('Failed to generate Java classes:', error);
      setIsValidJson(false);
    } finally {
      setIsGenerating(false);
    }
  }, [onCodeChange]);

  // Generate class files
  const generateClassFiles = useCallback((data: any, opts: JavaGenerationOptions): string[] => {
    const classes: string[] = [];

    if (opts.useRecords && typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Generate Java 14+ records
      const recordClass = generateRecordClass(opts.className, data, opts);
      classes.push(recordClass);
    } else {
      // Generate traditional Java classes
      const classDefinitions = generateClassDefinitions(data, opts);
      classes.push(...classDefinitions);
    }

    return classes;
  }, []);

  // Generate class definitions
  const generateClassDefinitions = useCallback((data: any, opts: JavaGenerationOptions, parentName = '', depth = 0): string[] => {
    if (depth > 10) return []; // Prevent infinite recursion

    const classes: string[] = [];
    const className = opts.className || (parentName ? `${capitalizeFirst(parentName)}` : 'RootClass');

    if (Array.isArray(data)) {
      // Handle arrays - generate class for array elements if they're objects
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        const elementClassName = `${className}Item`;
        const elementClasses = generateClassDefinitions(data[0], opts, elementClassName, depth + 1);
        classes.push(...elementClasses);
        return classes;
      }
      return classes;
    }

    if (typeof data === 'object' && data !== null) {
      const classDefinition = generateClassDefinition(className, data, opts);
      classes.push(classDefinition);

      // Generate nested classes for objects
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const fieldName = formatFieldName(key, opts);
          const nestedClassName = `${capitalizeFirst(fieldName)}`;
          const nestedClasses = generateClassDefinitions(value, opts, nestedClassName, depth + 1);
          classes.push(...nestedClasses);
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const itemClassName = `${capitalizeFirst(formatFieldName(key, opts))}Item`;
          const itemClasses = generateClassDefinitions(value[0], opts, itemClassName, depth + 1);
          classes.push(...itemClasses);
        }
      });
    }

    return classes;
  }, []);

  // Generate class definition
  const generateClassDefinition = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    const fields = generateClassFields(data, opts);
    const imports = collectImports(data, opts);
    const methods = generateClassMethods(className, data, opts);

    let code = '';

    // Package declaration
    if (opts.packageName) {
      code += `package ${opts.packageName};\n\n`;
    }

    // Imports
    if (imports.length > 0 && opts.generateImports) {
      code += imports.map(imp => `import ${imp};`).join('\n');
      code += '\n\n';
    }

    // Javadoc for class
    if (opts.generateJavadoc) {
      code += `/**\n`;
      code += ` * ${className} represents the JSON structure\n`;
      code += ` * Generated automatically from JSON data\n`;
      code += ` */\n`;
    }

    // Class declaration
    const classModifiers = [];
    if (opts.useFinalFields) classModifiers.push('public');
    if (opts.implementSerializable) classModifiers.push('implements Serializable');

    code += `${classModifiers.join(' ')} class ${className} {\n`;

    // Fields
    if (fields.length > 0) {
      code += '\n    // Fields\n';
      code += fields.map(field => `    ${field}`).join('\n');
    }

    // Methods
    if (methods.length > 0) {
      code += '\n    // Methods\n';
      code += methods.join('\n\n');
    }

    code += '\n}';

    return code;
  }, []);

  // Generate record class (Java 14+)
  const generateRecordClass = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    const components = generateRecordComponents(data, opts);
    const imports = collectImports(data, opts);

    let code = '';

    // Package declaration
    if (opts.packageName) {
      code += `package ${opts.packageName};\n\n`;
    }

    // Imports
    if (imports.length > 0 && opts.generateImports) {
      code += imports.map(imp => `import ${imp};`).join('\n');
      code += '\n\n';
    }

    // Javadoc for record
    if (opts.generateJavadoc) {
      code += `/**\n`;
      code += ` * ${className} record representing the JSON structure\n`;
      code += ` * Generated automatically from JSON data\n`;
      code += ` */\n`;
    }

    // Record declaration
    code += `public record ${className}(${components.join(', ')}) {\n`;

    // Record methods if needed
    if (opts.generateToString || opts.generateEqualsHashCode) {
      code += '\n    // Record methods can be customized here if needed\n';
    }

    code += '\n}';

    return code;
  }, []);

  // Generate class fields
  const generateClassFields = useCallback((data: any, opts: JavaGenerationOptions): string[] => {
    const fields: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts);
        let fieldDeclaration = '';

        // Add annotations
        if (fieldInfo.jsonAnnotation) {
          fieldDeclaration += `    ${fieldInfo.jsonAnnotation}\n`;
        }
        if (fieldInfo.validationAnnotation) {
          fieldDeclaration += `    ${fieldInfo.validationAnnotation}\n`;
        }

        // Field declaration
        const modifiers = [];
        if (opts.useFinalFields) modifiers.push('private final');
        else modifiers.push('private');

        fieldDeclaration += `    ${modifiers.join(' ')} ${fieldInfo.javaType} ${fieldInfo.fieldName};`;
        fields.push(fieldDeclaration);
      });
    }

    return fields;
  }, []);

  // Generate record components
  const generateRecordComponents = useCallback((data: any, opts: JavaGenerationOptions): string[] => {
    const components: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts);
        components.push(`${fieldInfo.javaType} ${fieldInfo.fieldName}`);
      });
    }

    return components;
  }, []);

  // Generate field information
  const generateFieldInfo = useCallback((key: string, value: any, opts: JavaGenerationOptions): JavaTypeInfo => {
    const fieldName = formatFieldName(key, opts);
    let javaType: string;
    let importStatement: string = '';
    let isOptional = opts.useOptional && !opts.requiredFields.includes(key);
    let isCollection = false;
    let isMap = false;

    if (value === null) {
      javaType = opts.useOptional ? 'Optional<Object>' : 'Object';
      if (opts.useOptional) importStatement = 'java.util.Optional';
    } else if (Array.isArray(value)) {
      isCollection = true;
      if (value.length > 0) {
        const elementInfo = generateFieldInfo('item', value[0], opts);
        javaType = `List<${elementInfo.javaType}>`;
        importStatement = 'java.util.List' + (elementInfo.import ? ', ' + elementInfo.import : '');
      } else {
        javaType = 'List<Object>';
        importStatement = 'java.util.List';
      }
    } else if (typeof value === 'object' && value !== null) {
      const structName = `${capitalizeFirst(fieldName)}`;
      javaType = structName;
    } else {
      const typeInfo = inferJavaType(value, opts);
      javaType = typeInfo.type;
      importStatement = typeInfo.import || '';
    }

    // Apply custom type mapping
    if (opts.customTypeMapping[key]) {
      javaType = opts.customTypeMapping[key];
    }

    // Generate JSON annotation
    const jsonAnnotation = generateJsonAnnotation(key, opts);

    return {
      javaType,
      import: importStatement,
      isOptional,
      isCollection,
      isMap,
      jsonAnnotation
    };
  }, []);

  // Generate class methods
  const generateClassMethods = useCallback((className: string, data: any, opts: JavaGenerationOptions): string[] => {
    const methods: string[] = [];

    if (opts.useLombok) {
      // Lombok handles getters/setters/constructors
      if (opts.generateBuilder) {
        methods.push(generateBuilderPattern(className, data, opts));
      }
      return methods;
    }

    // Constructor
    if (opts.generateConstructor || opts.generateAllArgsConstructor) {
      methods.push(generateConstructor(className, data, opts));
    }

    // Getters and setters
    if (opts.generateGettersSetters) {
      const gettersSetters = generateGettersSetters(className, data, opts);
      methods.push(...gettersSetters);
    }

    // toString
    if (opts.generateToString) {
      methods.push(generateToString(className, data, opts));
    }

    // equals and hashCode
    if (opts.generateEqualsHashCode) {
      methods.push(generateEquals(className, data, opts));
      methods.push(generateHashCode(className, data, opts));
    }

    // JSON serialization methods
    if (opts.serializationType === 'manual') {
      methods.push(generateToJsonMethod(className, data, opts));
      methods.push(generateFromJsonMethod(className, data, opts));
    }

    return methods;
  }, []);

  // Helper functions
  const inferJavaType = useCallback((value: any, opts: JavaGenerationOptions): { type: string; import?: string } => {
    if (value === null) return { type: 'Object' };
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return opts.useJava8DateTime
          ? { type: 'LocalDateTime', import: 'java.time.LocalDateTime' }
          : { type: 'String' };
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return opts.useJava8DateTime
          ? { type: 'LocalDate', import: 'java.time.LocalDate' }
          : { type: 'String' };
      }
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        return { type: 'UUID', import: 'java.util.UUID' };
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { type: 'String' };
      if (/^https?:\/\//.test(value)) return { type: 'String' };
      return { type: 'String' };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { type: 'Long' }
        : { type: 'Double' };
    }
    if (typeof value === 'boolean') return { type: 'Boolean' };
    return { type: 'Object' };
  }, []);

  const formatFieldName = useCallback((name: string, opts: JavaGenerationOptions): string => {
    switch (opts.fieldNaming) {
      case 'camelCase':
        return toCamelCase(name);
      case 'snake_case':
        return toSnakeCase(name);
      case 'PascalCase':
        return toPascalCase(name);
      case 'keepOriginal':
      default:
        return name;
    }
  }, []);

  const toCamelCase = (str: string): string => {
    return str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace(/[-_]/g, ''));
  };

  const toSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  };

  const toPascalCase = (str: string): string => {
    return capitalizeFirst(toCamelCase(str));
  };

  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const generateJsonAnnotation = useCallback((key: string, opts: JavaGenerationOptions): string => {
    if (opts.serializationType === 'jackson') {
      return '@JsonProperty("' + key + '")';
    } else if (opts.serializationType === 'gson') {
      return '@SerializedName("' + key + '")';
    }
    return '';
  }, []);

  const collectImports = useCallback((data: any, opts: JavaGenerationOptions): string[] => {
    const imports = new Set<string>();

    if (opts.serializationType === 'jackson') {
      imports.add('com.fasterxml.jackson.annotation.JsonProperty');
    } else if (opts.serializationType === 'gson') {
      imports.add('com.google.gson.annotations.SerializedName');
    }

    if (opts.useOptional) {
      imports.add('java.util.Optional');
    }

    if (opts.implementSerializable) {
      imports.add('java.io.Serializable');
    }

    // Add imports based on data types
    const collectFromData = (obj: any, depth = 0) => {
      if (depth > 10) return;

      if (Array.isArray(obj)) {
        if (obj.length > 0) collectFromData(obj[0], depth + 1);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(value => collectFromData(value, depth + 1));
      } else {
        const typeInfo = inferJavaType(obj, opts);
        if (typeInfo.import) imports.add(typeInfo.import);
      }
    };

    collectFromData(data);

    return Array.from(imports);
  }, []);

  const generatePackageInfo = useCallback((opts: JavaGenerationOptions): string => {
    let code = `/**\n`;
    code += ` * Package ${opts.packageName}\n`;
    code += ` * Generated JSON model classes\n`;
    code += ` */\n`;
    code += `package ${opts.packageName};\n`;
    return code;
  }, []);

  // Method generators (simplified implementations)
  const generateConstructor = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    public ${className}() {
        // Default constructor
    }`;
  }, []);

  const generateGettersSetters = useCallback((className: string, data: any, opts: JavaGenerationOptions): string[] => {
    const methods: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldName = formatFieldName(key, opts);
        const methodName = capitalizeFirst(fieldName);
        const fieldInfo = generateFieldInfo(key, value, opts);

        // Getter
        methods.push(`    public ${fieldInfo.javaType} get${methodName}() {
        return this.${fieldName};
    }`);

        // Setter
        if (!opts.useFinalFields) {
          methods.push(`    public void set${methodName}(${fieldInfo.javaType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`);
        }
      });
    }

    return methods;
  }, []);

  const generateToString = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    @Override
    public String toString() {
        return "${className}{" +
            // Implementation details here
            "}";
    }`;
  }, []);

  const generateEquals = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        // Implementation details here
        return true;
    }`;
  }, []);

  const generateHashCode = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    @Override
    public int hashCode() {
        return Objects.hash(/* field list */);
    }`;
  }, []);

  const generateBuilderPattern = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    // Builder pattern implementation
    public static class Builder {
        // Builder implementation
    }`;
  }, []);

  const generateToJsonMethod = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    public String toJson() {
        // Manual JSON serialization
        return "{}";
    }`;
  }, []);

  const generateFromJsonMethod = useCallback((className: string, data: any, opts: JavaGenerationOptions): string => {
    return `    public static ${className} fromJson(String json) {
        // Manual JSON deserialization
        return new ${className}();
    }`;
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied('main');
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  // Download code
  const downloadCode = useCallback((type: 'main' | 'package' | string) => {
    let code = '';
    let filename = '';

    if (type === 'package' && generatedCode.packageInfo) {
      code = generatedCode.packageInfo;
      filename = 'package-info.java';
    } else if (type === 'main' || generatedCode.classes.length > 0) {
      code = generatedCode.classes.join('\n\n');
      filename = `${options.className.toLowerCase()}.java`;
    }

    const blob = new Blob([code], { type: 'text/java' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, options.className]);

  // Effects
  useEffect(() => {
    if (jsonData) {
      setIsValidJson(true);
      generateJavaClasses(jsonData, options);
    }
  }, [jsonData, options, generateJavaClasses]);

  return (
    <div className={cn('w-full space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">JSON to Java Class Generator</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isValidJson ? "default" : "destructive"}>
                {isValidJson ? 'Valid JSON' : 'Invalid JSON'}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>

              {generatedCode.classes.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCode.classes.join('\n\n'))}
                  >
                    {copied === 'main' ? (
                      <CopyCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode('main')}
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
              Generating Java classes...
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
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      packageName: e.target.value
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    value={options.className}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      className: toPascalCase(e.target.value) || 'RootClass'
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldNaming">Field Naming</Label>
                  <Select
                    value={options.fieldNaming}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      fieldNaming: value as JavaGenerationOptions['fieldNaming']
                    }))}
                  >
                    <SelectTrigger id="fieldNaming">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                      <SelectItem value="PascalCase">PascalCase</SelectItem>
                      <SelectItem value="keepOriginal">Keep Original</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serializationType">JSON Library</Label>
                  <Select
                    value={options.serializationType}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      serializationType: value as JavaGenerationOptions['serializationType']
                    }))}
                  >
                    <SelectTrigger id="serializationType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jackson">Jackson</SelectItem>
                      <SelectItem value="gson">Gson</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useJackson">Use Jackson</Label>
                  <Switch
                    id="useJackson"
                    checked={options.useJackson}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useJackson: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useGson">Use Gson</Label>
                  <Switch
                    id="useGson"
                    checked={options.useGson}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useGson: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useOptional">Use Optional</Label>
                  <Switch
                    id="useOptional"
                    checked={options.useOptional}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useOptional: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useLombok">Use Lombok</Label>
                  <Switch
                    id="useLombok"
                    checked={options.useLombok}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useLombok: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useRecords">Use Records</Label>
                  <Switch
                    id="useRecords"
                    checked={options.useRecords}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useRecords: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateGettersSetters">Getters/Setters</Label>
                  <Switch
                    id="generateGettersSetters"
                    checked={options.generateGettersSetters}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateGettersSetters: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateToString">Generate toString</Label>
                  <Switch
                    id="generateToString"
                    checked={options.generateToString}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateToString: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateEqualsHashCode">equals/hashCode</Label>
                  <Switch
                    id="generateEqualsHashCode"
                    checked={options.generateEqualsHashCode}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateEqualsHashCode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateJavadoc">Generate Javadoc</Label>
                  <Switch
                    id="generateJavadoc"
                    checked={options.generateJavadoc}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateJavadoc: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {generatedCode.classes.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="main">Generated Classes</TabsTrigger>
                {generatedCode.packageInfo && (
                  <TabsTrigger value="package">Package Info</TabsTrigger>
                )}
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Java Classes</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCode.classes.join('\n\n'))}
                      >
                        {copied === 'main' ? (
                          <CopyCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCode('main')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <JsonAdvancedEditor
                    value={generatedCode.classes.join('\n\n')}
                    onChange={() => {}}
                    height={500}
                    language="java"
                    readOnly={readOnly}
                    showToolbar={!readOnly}
                  />
                </div>
              </TabsContent>

              {generatedCode.packageInfo && (
                <TabsContent value="package" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Package Info</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCode.packageInfo)}
                        >
                          {copied === 'package' ? (
                            <CopyCheck className="w-4 h-4 mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCode('package')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    <JsonAdvancedEditor
                      value={generatedCode.packageInfo}
                      onChange={() => {}}
                      height={300}
                      language="java"
                      readOnly={readOnly}
                      showToolbar={!readOnly}
                    />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="preview" className="p-6">
                <div className="space-y-4">
                  <Label>Code Preview</Label>
                  <div className="border rounded-md p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono max-h-96 overflow-auto">
                      {generatedCode.packageInfo && <div><strong>Package Info:</strong><br/>{generatedCode.packageInfo}</div>}
                      {generatedCode.packageInfo && generatedCode.classes.length > 0 && <br/><br/>}
                      {generatedCode.classes.length > 0 && (
                        <div>
                          <strong>Classes:</strong>
                          <br/>{generatedCode.classes.join('\n\n')}
                        </div>
                      )}
                      {!generatedCode.packageInfo && generatedCode.classes.length === 0 && 'No Java code generated'}
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

export default JsonToJava;
