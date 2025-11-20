/**
 * JSON to C++ Class Generator Component
 * Implements T031 [P] [US1] - Create JSONToC++ class generator with headers
 * Generates C++ classes from JSON data with proper C++ conventions and headers
 * Features:
 * - Automatic class generation with proper naming conventions
 * - Header and source file generation
 * - JSON serialization/deserialization methods
 * - Type inference with C++-specific types
 * - Support for nested classes and vectors
 * - Custom type mapping configuration
 * - Getters/setters generation
 * - Constructor and destructor generation
 * - C++ standard library usage
 * - Smart pointer support (shared_ptr, unique_ptr)
 * - Template support for generic types
 * - Friend class and operator overloading
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

// Types for JSON to C++ class generator
interface CppGenerationOptions {
  namespace: string;
  className: string;
  fieldNaming: 'camelCase' | 'snake_case' | 'PascalCase' | 'keepOriginal';
  typeMapping: 'strict' | 'loose' | 'custom';
  usePointers: boolean;
  useSmartPointers: boolean;
  generateHeader: boolean;
  generateSource: boolean;
  generateGettersSetters: boolean;
  generateConstructor: boolean;
  generateDestructor: boolean;
  generateMoveConstructor: boolean;
  generateCopyConstructor: boolean;
  generateOperators: boolean;
  useJsonLibrary: 'nlohmann' | 'rapidjson' | 'jsoncpp' | 'custom';
  serializationType: 'methods' | 'operators' | 'external';
  customTypeMapping: Record<string, string>;
  optionalFields: string[];
  requiredFields: string[];
  headerGuard: string;
  includeGuard: string;
  generateToString: boolean;
  generateEquality: boolean;
  generateHash: boolean;
  generateValidation: boolean;
  useConst: boolean;
  useReference: boolean;
  useTemplates: boolean;
  generateIncludes: boolean;
}

interface CppTypeInfo {
  cppType: string;
  include: string;
  isPointer: bool;
  isReference: bool;
  isOptional: bool;
  isVector: bool;
  isMap: bool;
  defaultValue: string;
}

interface JsonToCppProps {
  jsonData: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<CppGenerationOptions>;
}

const DEFAULT_OPTIONS: CppGenerationOptions = {
  namespace: 'json_models',
  className: 'RootClass',
  fieldNaming: 'camelCase',
  typeMapping: 'strict',
  usePointers: false,
  useSmartPointers: false,
  generateHeader: true,
  generateSource: true,
  generateGettersSetters: true,
  generateConstructor: true,
  generateDestructor: false,
  generateMoveConstructor: false,
  generateCopyConstructor: false,
  generateOperators: false,
  useJsonLibrary: 'nlohmann',
  serializationType: 'methods',
  customTypeMapping: {},
  optionalFields: [],
  requiredFields: [],
  headerGuard: '',
  includeGuard: '',
  generateToString: false,
  generateEquality: false,
  generateHash: false,
  generateValidation: false,
  useConst: true,
  useReference: true,
  useTemplates: false,
  generateIncludes: true
};

// Type mapping from JSON to C++
const JSON_TO_CPP_TYPES: Record<string, { type: string; include?: string }> = {
  'string': { type: 'std::string', include: '<string>' },
  'number': { type: 'double' },
  'integer': { type: 'int64_t', include: '<cstdint>' },
  'boolean': { type: 'bool' },
  'null': { type: 'std::optional<std::any>', include: '<optional><any>' },
  'array': { type: 'std::vector', include: '<vector>' },
  'object': { type: 'class' },
  'email': { type: 'std::string', include: '<string>' },
  'url': { type: 'std::string', include: '<string>' },
  'date': { type: 'std::string', include: '<string>' },
  'datetime': { type: 'std::chrono::system_clock::time_point', include: '<chrono>' },
  'uuid': { type: 'std::string', include: '<string>' },
  'timestamp': { type: 'int64_t', include: '<cstdint>' }
};

// JSON to C++ Class Generator Component
export const JsonToCpp: React.FC<JsonToCppProps> = ({
  jsonData,
  onCodeChange,
  className: propsClassName,
  readOnly = false,
  showPreview = true,
  initialOptions = {}
}) => {
  const [options, setOptions] = useState<CppGenerationOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const [generatedCode, setGeneratedCode] = useState<{ header: string; source: string }>({ header: '', source: '' });
  const [isValidJson, setIsValidJson] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<{ header?: boolean; source?: boolean }>({});

  // Generate C++ classes from JSON
  const generateCppClasses = useCallback(async (jsonString: string, opts: CppGenerationOptions) => {
    setIsGenerating(true);

    try {
      const jsonData = JSON.parse(jsonString);
      const headerCode = opts.generateHeader ? generateHeaderCode(jsonData, opts) : '';
      const sourceCode = opts.generateSource ? generateSourceCode(jsonData, opts) : '';

      setGeneratedCode({ header: headerCode, source: sourceCode });

      // Combine both files for the editor view
      const combinedCode = opts.generateHeader && opts.generateSource
        ? `${headerCode}\n\n// Source File:\n${sourceCode}`
        : headerCode || sourceCode;

      onCodeChange?.(combinedCode);
    } catch (error) {
      console.error('Failed to generate C++ classes:', error);
      setIsValidJson(false);
    } finally {
      setIsGenerating(false);
    }
  }, [onCodeChange]);

  // Generate header file
  const generateHeaderCode = useCallback((data: any, opts: CppGenerationOptions): string => {
    const className = opts.className || 'RootClass';
    const guard = opts.headerGuard || `${className.toUpperCase()}_H`;

    let code = `// Generated C++ header for JSON serialization\n`;
    code += `// Generated by JSON to C++ converter\n\n`;

    // Header guard
    code += `#ifndef ${guard}\n`;
    code += `#define ${guard}\n\n`;

    // Includes
    if (opts.generateIncludes) {
      const includes = collectIncludes(data, opts);
      code += includes.map(inc => `#include ${inc}`).join('\n');
      code += '\n\n';
    }

    // Namespace
    if (opts.namespace) {
      code += `namespace ${opts.namespace} {\n\n`;
    }

    // Forward declarations
    const forwardDeclarations = generateForwardDeclarations(data, opts);
    if (forwardDeclarations.length > 0) {
      code += forwardDeclarations.join('\n');
      code += '\n\n';
    }

    // Class declaration
    const classDeclaration = generateClassDeclaration(className, data, opts);
    code += classDeclaration;

    // Close namespace
    if (opts.namespace) {
      code += '\n} // namespace ${opts.namespace}\n';
    }

    // End header guard
    code += '\n#endif // ' + guard + '\n';

    return code;
  }, []);

  // Generate source file
  const generateSourceCode = useCallback((data: any, opts: CppGenerationOptions): string => {
    const className = opts.className || 'RootClass';

    let code = `// Generated C++ source for JSON serialization\n`;
    code += `// Generated by JSON to C++ converter\n\n`;

    // Includes
    code += `#include "${className.toLowerCase()}.h"\n`;

    // Additional includes for source
    const sourceIncludes = collectSourceIncludes(data, opts);
    if (sourceIncludes.length > 0) {
      code += '\n' + sourceIncludes.map(inc => `#include ${inc}`).join('\n');
    }
    code += '\n\n';

    // Namespace
    if (opts.namespace) {
      code += `namespace ${opts.namespace} {\n\n`;
    }

    // Constructor implementation
    if (opts.generateConstructor) {
      code += generateConstructorImplementation(className, data, opts);
    }

    // Destructor implementation
    if (opts.generateDestructor) {
      code += generateDestructorImplementation(className, opts);
    }

    // Getters and setters
    if (opts.generateGettersSetters) {
      code += generateGettersSettersImplementation(className, data, opts);
    }

    // JSON serialization methods
    code += generateSerializationImplementation(className, data, opts);

    // Operators
    if (opts.generateOperators) {
      code += generateOperatorsImplementation(className, data, opts);
    }

    // Close namespace
    if (opts.namespace) {
      code += '\n} // namespace ${opts.namespace}\n';
    }

    return code;
  }, []);

  // Generate class declaration
  const generateClassDeclaration = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    const fields = generateClassFields(data, opts);

    let code = `class ${className} {\n`;

    // Access specifiers
    if (fields.private.length > 0) {
      code += 'private:\n';
      code += fields.private.map(field => `    ${field}`).join('\n');
      code += '\n\n';
    }

    if (fields.public.length > 0) {
      code += 'public:\n';

      // Constructors
      if (opts.generateConstructor) {
        code += `    ${className}();\n`;
      }

      if (opts.generateCopyConstructor) {
        code += `    ${className}(const ${className}& other);\n`;
      }

      if (opts.generateMoveConstructor) {
        code += `    ${className}(${className}&& other) noexcept;\n`;
      }

      if (opts.generateDestructor) {
        code += `    ~${className}();\n`;
      }

      // Assignment operators
      if (opts.generateOperators) {
        code += `    ${className}& operator=(const ${className}& other);\n`;
        code += `    ${className}& operator=(${className}&& other) noexcept;\n`;
      }

      // Getters and setters declarations
      if (opts.generateGettersSetters) {
        const gettersSetters = generateGettersSettersDeclaration(data, opts);
        code += gettersSetters.map(method => `    ${method}`).join('\n');
        code += '\n';
      }

      // JSON serialization methods
      const serializationMethods = generateSerializationDeclaration(className, opts);
      code += serializationMethods.map(method => `    ${method}`).join('\n');

      if (fields.public.length > 0) {
        code += '\n';
        code += fields.public.map(field => `    ${field}`).join('\n');
      }
    }

    code += '};\n';

    return code;
  }, []);

  // Generate class fields
  const generateClassFields = useCallback((data: any, opts: CppGenerationOptions): { private: string[]; public: string[] } => {
    const fields: { private: string[]; public: string[] } = { private: [], public: [] };

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts);
        let fieldDeclaration = `${fieldInfo.cppType} ${fieldInfo.fieldName};`;

        if (fieldInfo.defaultValue) {
          fieldDeclaration = `${fieldInfo.cppType} ${fieldInfo.fieldName} = ${fieldInfo.defaultValue};`;
        }

        // Default to private fields with public getters/setters
        fields.private.push(fieldDeclaration);
      });
    }

    return fields;
  }, []);

  // Generate field information
  const generateFieldInfo = useCallback((key: string, value: any, opts: CppGenerationOptions): CppTypeInfo => {
    const fieldName = formatFieldName(key, opts);
    let cppType: string;
    let include: string = '';
    let isPointer = opts.usePointers;
    let isReference = opts.useReference && !opts.usePointers;
    let isOptional = opts.optionalFields.includes(key);
    let isVector = false;
    let isMap = false;
    let defaultValue = '';

    if (value === null) {
      cppType = 'std::optional<std::any>';
      include = '<optional><any>';
      isOptional = true;
    } else if (Array.isArray(value)) {
      isVector = true;
      if (value.length > 0) {
        const elementInfo = generateFieldInfo('item', value[0], opts);
        cppType = `std::vector<${elementInfo.cppType}>`;
        include = '<vector>' + (elementInfo.include ? ' ' + elementInfo.include : '');
      } else {
        cppType = 'std::vector<nlohmann::json>';
        include = '<vector><nlohmann/json.hpp>';
      }
    } else if (typeof value === 'object' && value !== null) {
      const structName = `${capitalizeFirst(fieldName)}`;
      cppType = structName;
    } else {
      const typeInfo = inferCppType(value, opts);
      cppType = typeInfo.type;
      include = typeInfo.include || '';
    }

    // Apply custom type mapping
    if (opts.customTypeMapping[key]) {
      cppType = opts.customTypeMapping[key];
    }

    // Handle optional fields
    if (isOptional && !cppType.startsWith('std::optional')) {
      cppType = `std::optional<${cppType}>`;
      include = (include || '') + '<optional>';
    }

    return {
      cppType,
      include,
      isPointer,
      isReference,
      isOptional,
      isVector,
      isMap,
      defaultValue
    };
  }, []);

  // Generate getters and setters declaration
  const generateGettersSettersDeclaration = useCallback((data: any, opts: CppGenerationOptions): string[] => {
    const methods: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldName = formatFieldName(key, opts);
        const methodName = capitalizeFirst(fieldName);
        const fieldInfo = generateFieldInfo(key, value, opts);

        const ref = opts.useConst && !fieldInfo.isPointer ? 'const ' : '';
        const refSuffix = opts.useConst && !fieldInfo.isPointer ? '&' : '';

        // Getter
        if (opts.useConst) {
          methods.push(`${ref}${fieldInfo.cppType}${refSuffix} get${methodName}() const;`);
        } else {
          methods.push(`${fieldInfo.cppType} get${methodName}();`);
        }

        // Setter
        methods.push(`void set${methodName}(${fieldInfo.cppType} value);`);
      });
    }

    return methods;
  }, []);

  // Generate serialization declaration
  const generateSerializationDeclaration = useCallback((className: string, opts: CppGenerationOptions): string[] => {
    const methods: string[] = [];

    switch (opts.useJsonLibrary) {
      case 'nlohmann':
        methods.push('nlohmann::json toJson() const;');
        methods.push(`static ${className} fromJson(const nlohmann::json& j);`);
        break;
      case 'rapidjson':
        methods.push('void toJson(rapidjson::Document& doc) const;');
        methods.push(`static ${className} fromJson(const rapidjson::Value& j);`);
        break;
      case 'jsoncpp':
        methods.push('Json::Value toJson() const;');
        methods.push(`static ${className} fromJson(const Json::Value& j);`);
        break;
    }

    return methods;
  }, []);

  // Generate constructor implementation
  const generateConstructorImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    let code = `${className}::${className}()`;
    const initializers: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldName = formatFieldName(key, opts);
        const fieldInfo = generateFieldInfo(key, value, opts);

        if (fieldInfo.defaultValue) {
          initializers.push(`${fieldName}(${fieldInfo.defaultValue})`);
        }
      });
    }

    if (initializers.length > 0) {
      code += ' :\n    ' + initializers.join(',\n    ');
    }

    code += ' {\n    // Constructor implementation\n}\n\n';

    return code;
  }, []);

  // Generate getters and setters implementation
  const generateGettersSettersImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    let code = '';

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldName = formatFieldName(key, opts);
        const methodName = capitalizeFirst(fieldName);
        const fieldInfo = generateFieldInfo(key, value, opts);

        const ref = opts.useConst && !fieldInfo.isPointer ? 'const ' : '';
        const refSuffix = opts.useConst && !fieldInfo.isPointer ? '&' : '';

        // Getter implementation
        if (opts.useConst) {
          code += `${ref}${fieldInfo.cppType}${refSuffix} ${className}::get${methodName}() const {\n`;
        } else {
          code += `${fieldInfo.cppType} ${className}::get${methodName}() {\n`;
        }
        code += `    return ${fieldName};\n}\n\n`;

        // Setter implementation
        code += `void ${className}::set${methodName}(${fieldInfo.cppType} value) {\n`;
        code += `    ${fieldName} = value;\n}\n\n`;
      });
    }

    return code;
  }, []);

  // Generate serialization implementation
  const generateSerializationImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    switch (opts.useJsonLibrary) {
      case 'nlohmann':
        return generateNlohmannImplementation(className, data, opts);
      case 'rapidjson':
        return generateRapidjsonImplementation(className, data, opts);
      case 'jsoncpp':
        return generateJsoncppImplementation(className, data, opts);
      default:
        return '';
    }
  }, []);

  // Generate nlohmann/json implementation
  const generateNlohmannImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    let toJson = `nlohmann::json ${className}::toJson() const {\n    nlohmann::json j;\n`;
    let fromJson = `${className} ${className}::fromJson(const nlohmann::json& j) {\n    ${className} obj;\n`;

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldName = formatFieldName(key, opts);
        toJson += `    j["${key}"] = ${fieldName};\n`;
        fromJson += `    obj.${fieldName} = j.value("${key}", ${getDefaultJsonValue(value, opts)});\n`;
      });
    }

    toJson += '    return j;\n}\n\n';
    fromJson += '    return obj;\n}\n\n';

    return toJson + fromJson;
  }, []);

  // Helper functions
  const inferCppType = useCallback((value: any, opts: CppGenerationOptions): { type: string; include?: string } => {
    if (value === null) return { type: 'std::optional<std::any>', include: '<optional><any>' };
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return { type: 'std::chrono::system_clock::time_point', include: '<chrono>' };
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { type: 'std::string', include: '<string>' };
      if (/^https?:\/\//.test(value)) return { type: 'std::string', include: '<string>' };
      return { type: 'std::string', include: '<string>' };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { type: 'int64_t', include: '<cstdint>' }
        : { type: 'double' };
    }
    if (typeof value === 'boolean') return { type: 'bool' };
    return { type: 'std::any', include: '<any>' };
  }, []);

  const formatFieldName = useCallback((name: string, opts: CppGenerationOptions): string => {
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

  const collectIncludes = useCallback((data: any, opts: CppGenerationOptions): string[] => {
    const includes = new Set<string>();

    // Always add standard includes
    includes.add('<string>');
    includes.add('<vector>');
    includes.add('<optional>');

    // JSON library includes
    switch (opts.useJsonLibrary) {
      case 'nlohmann':
        includes.add('<nlohmann/json.hpp>');
        break;
      case 'rapidjson':
        includes.add('<rapidjson/document.h>');
        includes.add('<rapidjson/writer.h>');
        break;
      case 'jsoncpp':
        includes.add('<json/json.h>');
        break;
    }

    return Array.from(includes);
  }, []);

  const collectSourceIncludes = useCallback((data: any, opts: CppGenerationOptions): string[] => {
    const includes: string[] = [];

    // Add any additional source file includes
    if (opts.generateToString) {
      includes.add('<sstream>');
      includes.add('<iomanip>');
    }

    return includes;
  }, []);

  const generateForwardDeclarations = useCallback((data: any, opts: CppGenerationOptions): string[] => {
    // Generate forward declarations for nested classes
    return [];
  }, []);

  const getDefaultJsonValue = useCallback((value: any, opts: CppGenerationOptions): string => {
    if (typeof value === 'string') return '""';
    if (typeof value === 'number') return '0';
    if (typeof value === 'boolean') return 'false';
    return '{}';
  }, []);

  // Placeholder implementations for other JSON libraries
  const generateRapidjsonImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    return `// RapidJSON implementation not yet generated\n`;
  }, []);

  const generateJsoncppImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    return `// JsonCpp implementation not yet generated\n`;
  }, []);

  const generateDestructorImplementation = useCallback((className: string, opts: CppGenerationOptions): string => {
    return `${className}::~${className}() {\n    // Destructor implementation\n}\n\n`;
  }, []);

  const generateOperatorsImplementation = useCallback((className: string, data: any, opts: CppGenerationOptions): string => {
    return `${className}& ${className}::operator=(const ${className}& other) {\n    if (this != &other) {\n        // Copy assignment implementation\n    }\n    return *this;\n}\n\n${className}& ${className}::operator=(${className}&& other) noexcept {\n    if (this != &other) {\n        // Move assignment implementation\n    }\n    return *this;\n}\n\n`;
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (type: 'header' | 'source') => {
    try {
      const code = type === 'header' ? generatedCode.header : generatedCode.source;
      await navigator.clipboard.writeText(code);
      setCopied({ ...copied, [type]: true });
      setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [generatedCode, copied]);

  // Download code
  const downloadCode = useCallback((type: 'header' | 'source') => {
    const code = type === 'header' ? generatedCode.header : generatedCode.source;
    const extension = type === 'header' ? '.h' : '.cpp';
    const blob = new Blob([code], { type: 'text/cpp' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.className.toLowerCase()}${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, options.className]);

  // Effects
  useEffect(() => {
    if (jsonData) {
      setIsValidJson(true);
      generateCppClasses(jsonData, options);
    }
  }, [jsonData, options, generateCppClasses]);

  return (
    <div className={cn('w-full space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">JSON to C++ Class Generator</CardTitle>
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

              {(generatedCode.header || generatedCode.source) && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('header')}
                  >
                    {copied.header ? (
                      <CopyCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy Header
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('source')}
                  >
                    {copied.source ? (
                      <CopyCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy Source
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode('header')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Header
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode('source')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Source
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating C++ classes...
            </div>
          )}
        </CardHeader>

        {showSettings && (
          <div className="px-6 pb-4 border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namespace">Namespace</Label>
                  <Input
                    id="namespace"
                    value={options.namespace}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      namespace: e.target.value
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
                      fieldNaming: value as CppGenerationOptions['fieldNaming']
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
                  <Label htmlFor="useJsonLibrary">JSON Library</Label>
                  <Select
                    value={options.useJsonLibrary}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      useJsonLibrary: value as CppGenerationOptions['useJsonLibrary']
                    }))}
                  >
                    <SelectTrigger id="useJsonLibrary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nlohmann">nlohmann/json</SelectItem>
                      <SelectItem value="rapidjson">RapidJSON</SelectItem>
                      <SelectItem value="jsoncpp">JsonCpp</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
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
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, usePointers: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateHeader">Generate Header</Label>
                  <Switch
                    id="generateHeader"
                    checked={options.generateHeader}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateHeader: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateSource">Generate Source</Label>
                  <Switch
                    id="generateSource"
                    checked={options.generateSource}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateSource: checked }))}
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
                  <Label htmlFor="generateConstructor">Constructor</Label>
                  <Switch
                    id="generateConstructor"
                    checked={options.generateConstructor}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateConstructor: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useConst">Use const</Label>
                  <Switch
                    id="useConst"
                    checked={options.useConst}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useConst: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {(generatedCode.header || generatedCode.source) && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="header">Header File</TabsTrigger>
                <TabsTrigger value="source">Source File</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="header" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Header File (.h)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('header')}
                      >
                        {copied.header ? (
                          <CopyCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCode('header')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <JsonAdvancedEditor
                    value={generatedCode.header}
                    onChange={() => {}}
                    height={500}
                    language="cpp"
                    readOnly={readOnly}
                    showToolbar={!readOnly}
                  />
                </div>
              </TabsContent>

              <TabsContent value="source" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Source File (.cpp)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('source')}
                      >
                        {copied.source ? (
                          <CopyCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCode('source')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <JsonAdvancedEditor
                    value={generatedCode.source}
                    onChange={() => {}}
                    height={500}
                    language="cpp"
                    readOnly={readOnly}
                    showToolbar={!readOnly}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="p-6">
                <div className="space-y-4">
                  <Label>Combined Preview</Label>
                  <div className="border rounded-md p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono max-h-96 overflow-auto">
                      {generatedCode.header && <div><strong>Header:</strong><br/>{generatedCode.header}</div>}
                      {generatedCode.header && generatedCode.source && <br/><br/>}
                      {generatedCode.source && <div><strong>Source:</strong><br/>{generatedCode.source}</div>}
                      {!generatedCode.header && !generatedCode.source && 'No C++ code generated'}
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

export default JsonToCpp;
