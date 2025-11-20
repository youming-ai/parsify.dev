/**
 * JSON to Python Class Generator Component
 * Implements T033 [P] [US1] - Create JSONToPython class generator with type hints
 * Generates Python classes from JSON data with proper Python conventions and type hints
 * Features:
 * - Automatic class generation with proper naming conventions
 * - PEP 8 compliant code formatting
 * - Type hints support (Python 3.6+)
 * - Dataclass and Pydantic model support
 * - Type inference with Python-specific types
 * - Support for nested classes and collections
 * - Custom type mapping configuration
 * - Property getter/setter generation
 * - Constructor and __init__ generation
 * - __str__ and __repr__ generation
 * - Data validation with Pydantic
 * - JSON serialization/deserialization methods
 * - Import management
 * - Docstring generation
 * - Property and method decorators
 * - Support for typing module (List, Dict, Optional, Union)
 * - Abstract base classes support
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

// Types for JSON to Python class generator
interface PythonGenerationOptions {
  className: string;
  fieldNaming: 'snake_case' | 'camelCase' | 'PascalCase' | 'keepOriginal';
  typeMapping: 'strict' | 'loose' | 'custom';
  useTypeHints: boolean;
  useDataclasses: boolean;
  usePydantic: boolean;
  useProperties: boolean;
  generateInit: boolean;
  generateRepr: boolean;
  generateStr: boolean;
  generateEq: boolean;
  generateHash: boolean;
  generateJsonMethods: boolean;
  generateSlots: boolean;
  useTyping: boolean;
  useAbstractBase: boolean;
  baseClassName: string;
  customTypeMapping: Record<string, string>;
  optionalFields: string[];
  requiredFields: string[];
  generateDocstrings: boolean;
  generateImports: boolean;
  jsonLibrary: 'json' | 'ujson' | 'orjson' | 'pydantic';
  pythonVersion: '3.6' | '3.7' | '3.8' | '3.9' | '3.10' | '3.11';
  indentation: '2 spaces' | '4 spaces';
  lineEnding: 'LF' | 'CRLF';
}

interface PythonTypeInfo {
  pythonType: string;
  import: string;
  isOptional: boolean;
  isCollection: bool;
  defaultValue: string;
  docstring?: string;
}

interface JsonToPythonProps {
  jsonData: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<PythonGenerationOptions>;
}

const DEFAULT_OPTIONS: PythonGenerationOptions = {
  className: 'RootClass',
  fieldNaming: 'snake_case',
  typeMapping: 'strict',
  useTypeHints: true,
  useDataclasses: false,
  usePydantic: false,
  useProperties: false,
  generateInit: true,
  generateRepr: true,
  generateStr: true,
  generateEq: false,
  generateHash: false,
  generateJsonMethods: true,
  generateSlots: false,
  useTyping: true,
  useAbstractBase: false,
  baseClassName: '',
  customTypeMapping: {},
  optionalFields: [],
  requiredFields: [],
  generateDocstrings: true,
  generateImports: true,
  jsonLibrary: 'json',
  pythonVersion: '3.9',
  indentation: '4 spaces',
  lineEnding: 'LF'
};

// Type mapping from JSON to Python
const JSON_TO_PYTHON_TYPES: Record<string, { type: string; import?: string }> = {
  'string': { type: 'str' },
  'number': { type: 'float' },
  'integer': { type: 'int' },
  'boolean': { type: 'bool' },
  'null': { type: 'None' },
  'array': { type: 'List', import: 'from typing import List' },
  'object': { type: 'class' },
  'email': { type: 'str' },
  'url': { type: 'str' },
  'date': { type: 'date', import: 'from datetime import date' },
  'datetime': { type: 'datetime', import: 'from datetime import datetime' },
  'uuid': { type: 'UUID', import: 'from uuid import UUID' },
  'timestamp': { type: 'datetime', import: 'from datetime import datetime' }
};

// JSON to Python Class Generator Component
export const JsonToPython: React.FC<JsonToPythonProps> = ({
  jsonData,
  onCodeChange,
  className: propsClassName,
  readOnly = false,
  showPreview = true,
  initialOptions = {}
}) => {
  const [options, setOptions] = useState<PythonGenerationOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate Python classes from JSON
  const generatePythonClasses = useCallback(async (jsonString: string, opts: PythonGenerationOptions) => {
    setIsGenerating(true);

    try {
      const jsonData = JSON.parse(jsonString);
      const pythonCode = generatePythonCode(jsonData, opts);
      setGeneratedCode(pythonCode);
      onCodeChange?.(pythonCode);
    } catch (error) {
      console.error('Failed to generate Python classes:', error);
      setIsValidJson(false);
    } finally {
      setIsGenerating(false);
    }
  }, [onCodeChange]);

  // Main Python code generation
  const generatePythonCode = useCallback((data: any, opts: PythonGenerationOptions): string => {
    const classes = generateClassDefinitions(data, opts);
    const imports = generateImports(data, opts);

    let code = '';

    // Header comment
    code += `# Generated Python classes from JSON\n`;
    code += `# Generated by JSON to Python converter\n`;
    code += `# Python ${opts.pythonVersion} compatible\n\n`;

    // Imports
    if (imports.length > 0 && opts.generateImports) {
      code += imports.join('\n');
      code += '\n\n';
    }

    // Classes
    code += classes.join('\n\n');

    return code;
  }, []);

  // Generate class definitions
  const generateClassDefinitions = useCallback((data: any, opts: PythonGenerationOptions, parentName = '', depth = 0): string[] => {
    if (depth > 10) return []; // Prevent infinite recursion

    const classes: string[] = [];
    const className = opts.className || (parentName ? `${toPascalCase(parentName)}` : 'RootClass');

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
          const nestedClassName = `${toPascalCase(fieldName)}`;
          const nestedClasses = generateClassDefinitions(value, opts, nestedClassName, depth + 1);
          classes.push(...nestedClasses);
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const itemClassName = `${toPascalCase(formatFieldName(key, opts))}Item`;
          const itemClasses = generateClassDefinitions(value[0], opts, itemClassName, depth + 1);
          classes.push(...itemClasses);
        }
      });
    }

    return classes;
  }, []);

  // Generate class definition
  const generateClassDefinition = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    let code = '';

    // Class docstring
    if (opts.generateDocstrings) {
      code += generateClassDocstring(className, data, opts);
    }

    // Class declaration
    if (opts.useDataclasses) {
      code += generateDataclass(className, data, opts);
    } else if (opts.usePydantic) {
      code += generatePydanticModel(className, data, opts);
    } else {
      code += generateRegularClass(className, data, opts);
    }

    return code;
  }, []);

  // Generate regular Python class
  const generateRegularClass = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    const fields = generateClassFields(data, opts);
    const methods = generateClassMethods(className, data, opts);
    const indent = opts.indentation === '2 spaces' ? '  ' : '    ';

    let code = `class ${className}`;

    // Inheritance
    if (opts.baseClassName) {
      code += `(${opts.baseClassName})`;
    }

    code += `:\n`;

    // Slots
    if (opts.generateSlots && fields.length > 0) {
      const slotNames = fields.map(f => f.split(':')[0].trim()).join(', ');
      code += `${indent}__slots__ = (${slotNames})\n\n`;
    }

    // Constructor
    if (opts.generateInit) {
      code += generateInitMethod(className, data, opts, indent);
    }

    // Properties
    if (opts.useProperties) {
      code += generateProperties(className, data, opts, indent);
    }

    // Methods
    if (methods.length > 0) {
      code += '\n' + methods.map(method => `${indent}${method}`).join('\n\n');
    }

    return code;
  }, []);

  // Generate dataclass
  const generateDataclass = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    const fields = generateDataclassFields(data, opts);
    const methods = generateClassMethods(className, data, opts);
    const indent = opts.indentation === '2 spaces' ? '  ' : '    ';

    let code = '';

    // Dataclass decorators
    code += '@dataclass\n';
    if (opts.useSlots && fields.length > 0) {
      code += '@dataclass_slots\n';
    }

    code += `class ${className}`;

    // Inheritance
    if (opts.baseClassName) {
      code += `(${opts.baseClassName})`;
    }

    code += `:\n`;

    // Fields
    if (fields.length > 0) {
      code += fields.map(field => `${indent}${field}`).join('\n');
    }

    // Methods
    if (methods.length > 0) {
      code += '\n' + methods.map(method => `${indent}${method}`).join('\n\n');
    }

    return code;
  }, []);

  // Generate Pydantic model
  const generatePydanticModel = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    const fields = generatePydanticFields(data, opts);
    const methods = generateClassMethods(className, data, opts);
    const indent = opts.indentation === '2 spaces' ? '  ' : '    ';

    let code = '';

    // Pydantic model decorators
    code += 'from pydantic import BaseModel\n\n';

    code += `class ${className}(BaseModel):\n`;

    // Fields
    if (fields.length > 0) {
      code += fields.map(field => `${indent}${field}`).join('\n');
    }

    // Methods
    if (methods.length > 0) {
      code += '\n' + methods.map(method => `${indent}${method}`).join('\n\n');
    }

    return code;
  }, []);

  // Generate class fields
  const generateClassFields = useCallback((data: any, opts: PythonGenerationOptions): string[] => {
    const fields: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts);
        let fieldDeclaration = `${fieldInfo.pythonType} ${fieldInfo.fieldName}`;

        if (fieldInfo.defaultValue) {
          fieldDeclaration += ` = ${fieldInfo.defaultValue}`;
        }

        fields.push(fieldDeclaration + ':');
      });
    }

    return fields;
  }, []);

  // Generate dataclass fields
  const generateDataclassFields = useCallback((data: any, opts: PythonGenerationOptions): string[] => {
    const fields: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts);
        let fieldDeclaration = `${fieldInfo.pythonType} ${fieldInfo.fieldName}`;

        if (fieldInfo.defaultValue) {
          fieldDeclaration += ` = ${fieldInfo.defaultValue}`;
        }

        fields.push(fieldDeclaration);
      });
    }

    return fields;
  }, []);

  // Generate Pydantic fields
  const generatePydanticFields = useCallback((data: any, opts: PythonGenerationOptions): string[] => {
    const fields: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldInfo = generateFieldInfo(key, value, opts);
        let fieldDeclaration = `${fieldInfo.pythonType} ${fieldInfo.fieldName}`;

        // Add Pydantic Field for optional types
        if (fieldInfo.isOptional) {
          if (opts.useTypeHints) {
            fieldDeclaration = `Optional[${fieldInfo.pythonType}] ${fieldInfo.fieldName}`;
          } else {
            fieldDeclaration = `${fieldInfo.pythonType} ${fieldInfo.fieldName} = None`;
          }
        }

        fields.push(fieldDeclaration + ':');
      });
    }

    return fields;
  }, []);

  // Generate field information
  const generateFieldInfo = useCallback((key: string, value: any, opts: PythonGenerationOptions): PythonTypeInfo => {
    const fieldName = formatFieldName(key, opts);
    let pythonType: string;
    let importStatement: string = '';
    let isOptional = opts.optionalFields.includes(key);
    let isCollection = false;
    let defaultValue = '';

    if (value === null) {
      pythonType = 'Any' if opts.useTypeHints else 'object';
      if (opts.useTypeHints) importStatement = 'from typing import Any';
      isOptional = true;
    } else if (Array.isArray(value)) {
      isCollection = true;
      if (value.length > 0) {
        const elementInfo = generateFieldInfo('item', value[0], opts);
        pythonType = `List[${elementInfo.pythonType}]`;
        if (opts.useTypeHints) importStatement = 'from typing import List';
        if (elementInfo.import) importStatement += `, ${elementInfo.import}`;
      } else {
        pythonType = 'List[Any]' if opts.useTypeHints else 'list';
        if (opts.useTypeHints) importStatement = 'from typing import List, Any';
      }
    } else if (typeof value === 'object' && value !== null) {
      const structName = `${toPascalCase(fieldName)}`;
      pythonType = structName;
    } else {
      const typeInfo = inferPythonType(value, opts);
      pythonType = typeInfo.type;
      importStatement = typeInfo.import || '';
    }

    // Apply custom type mapping
    if (opts.customTypeMapping[key]) {
      pythonType = opts.customTypeMapping[key];
    }

    return {
      pythonType,
      import: importStatement,
      isOptional,
      isCollection,
      defaultValue
    };
  }, []);

  // Generate class methods
  const generateClassMethods = useCallback((className: string, data: any, opts: PythonGenerationOptions): string[] => {
    const methods: string[] = [];

    // __init__ method
    if (!opts.useDataclasses && opts.generateInit) {
      methods.push(generateInitMethod(className, data, opts, ''));
    }

    // __str__ method
    if (opts.generateStr) {
      methods.push(generateStrMethod(className, data, opts));
    }

    // __repr__ method
    if (opts.generateRepr) {
      methods.push(generateReprMethod(className, data, opts));
    }

    // __eq__ method
    if (opts.generateEq) {
      methods.push(generateEqMethod(className, data, opts));
    }

    // __hash__ method
    if (opts.generateHash) {
      methods.push(generateHashMethod(className, data, opts));
    }

    // JSON methods
    if (opts.generateJsonMethods) {
      methods.push(generateToDictMethod(className, data, opts));
      methods.push(generateFromDictMethod(className, data, opts));
    }

    return methods;
  }, []);

  // Helper functions
  const inferPythonType = useCallback((value: any, opts: PythonGenerationOptions): { type: string; import?: string } => {
    if (value === null) return { type: 'Any', import: 'from typing import Any' };
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return { type: 'datetime', import: 'from datetime import datetime' };
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { type: 'date', import: 'from datetime import date' };
      }
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        return { type: 'UUID', import: 'from uuid import UUID' };
      }
      return { type: 'str' };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? { type: 'int' } : { type: 'float' };
    }
    if (typeof value === 'boolean') return { type: 'bool' };
    return { type: 'Any', import: 'from typing import Any' };
  }, []);

  const formatFieldName = useCallback((name: string, opts: PythonGenerationOptions): string => {
    switch (opts.fieldNaming) {
      case 'snake_case':
        return toSnakeCase(name);
      case 'camelCase':
        return toCamelCase(name);
      case 'PascalCase':
        return toPascalCase(name);
      case 'keepOriginal':
      default:
        return name;
    }
  }, []);

  const toSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  };

  const toCamelCase = (str: string): string => {
    return str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace(/[-_]/g, ''));
  };

  const toPascalCase = (str: string): string => {
    return capitalizeFirst(toCamelCase(str));
  };

  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Method generators
  const generateInitMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions, indent = '    ') => {
    const fields = generateClassFields(data, opts);
    const fieldAssignments = fields.map(f => {
      const fieldName = f.split(':')[0].trim();
      return `${indent}self.${fieldName} = ${fieldName}`;
    });

    let code = `def __init__(self`;

    // Parameters in signature
    if (fields.length > 0) {
      const params = fields.map(f => f.split(':')[0].trim()).join(', ');
      code += `, ${params}`;
    }

    code += `):\n${fieldAssignments.join('\n')}\n`;

    return code;
  }, []);

  const generateStrMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    return `def __str__(self) -> str:
        return f"${className}({${Object.keys(data).map(key => `${key}={self.${key}}`).join(', ')})"
`;
  }, []);

  const generateReprMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    return `def __repr__(self) -> str:
        return f"{className}({${Object.keys(data).map(key => `${key}={self.${key}!r}`).join(', ')})"
`;
  }, []);

  const generateEqMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    const comparisons = Object.keys(data).map(key => `self.${key} == other.${key}`).join(' and ');
    return `def __eq__(self, other) -> bool:
        if not isinstance(other, ${className}):
            return False
        return ${comparisons}`;
  }, []);

  const generateHashMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    return `def __hash__(self) -> int:
        return hash((${Object.values(data).map(key => `self.${key}`).join(', ')},))`;
  }, []);

  const generateProperties = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    const properties: string[] = [];

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fieldName = formatFieldName(key, opts);
        const methodName = capitalizeFirst(fieldName);
        const fieldInfo = generateFieldInfo(key, value, opts);

        // Getter
        properties.push(`@property
def ${methodName}(self) -> ${fieldInfo.pythonType}:
    return self._${fieldName}`);

        // Setter
        if (!opts.useDataclasses) {
          properties.push(`@${methodName}.setter
def ${methodName}(self, value: ${fieldInfo.pythonType}) -> None:
    self._${fieldName} = value`);
        }
      });
    }

    return properties.join('\n\n');
  }, []);

  const generateToDictMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    if (typeof data === 'object' && data !== null) {
      const keyValues = Object.keys(data).map(key => `    '${key}': self.${key}`).join(',\n');
      return `def to_dict(self) -> dict:
        return {
${keyValues}
        }`;
    }
    return `def to_dict(self) -> dict:
        return {}`;
  }, []);

  const generateFromDictMethod = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    return `@classmethod
def from_dict(cls, data: dict) -> '${className}':
    return cls(**data)`;
  }, []);

  const generateClassDocstring = useCallback((className: string, data: any, opts: PythonGenerationOptions): string => {
    let docstring = `"""\n`;
    docstring += `${className} class representing the JSON structure\n`;

    if (typeof data === 'object' && data !== null) {
      const attributes = Object.entries(data).map(([key, value]) => {
        const typeDesc = Array.isArray(value) ? 'list' : typeof value === 'object' ? 'dict' : typeof value;
        return `        ${key}: ${typeDesc}`;
      }).join('\n');

      docstring += `\nAttributes:\n${attributes}`;
    }

    docstring += '\n"""\n';

    return docstring;
  }, []);

  const generateImports = useCallback((data: any, opts: PythonGenerationOptions): string[] => {
    const imports = new Set<string>();

    if (opts.useTyping) {
      imports.add('from typing import List, Dict, Optional, Any, Union');
    }

    if (opts.useDataclasses) {
      imports.add('from dataclasses import dataclass');
      if (opts.generateSlots) {
        imports.add('from dataclasses import dataclass_slots');
      }
    }

    if (opts.usePydantic) {
      imports.add('from pydantic import BaseModel');
    }

    // Collect imports from data types
    const collectFromData = (obj: any, depth = 0) => {
      if (depth > 10) return;

      if (Array.isArray(obj)) {
        if (obj.length > 0) collectFromData(obj[0], depth + 1);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(value => collectFromData(value, depth + 1));
      } else {
        const typeInfo = inferPythonType(obj, opts);
        if (typeInfo.import) imports.add(typeInfo.import);
      }
    };

    collectFromData(data);

    return Array.from(imports);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [generatedCode]);

  // Download code
  const downloadCode = useCallback(() => {
    const blob = new Blob([generatedCode], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.className.toLowerCase()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, options.className]);

  // Effects
  useEffect(() => {
    if (jsonData) {
      setIsValidJson(true);
      generatePythonClasses(jsonData, options);
    }
  }, [jsonData, options, generatePythonClasses]);

  return (
    <div className={cn('w-full space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">JSON to Python Class Generator</CardTitle>
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

              {generatedCode && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CopyCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCode}
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
              Generating Python classes...
            </div>
          )}
        </CardHeader>

        {showSettings && (
          <div className="px-6 pb-4 border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      fieldNaming: value as PythonGenerationOptions['fieldNaming']
                    }))}
                  >
                    <SelectTrigger id="fieldNaming">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="PascalCase">PascalCase</SelectItem>
                      <SelectItem value="keepOriginal">Keep Original</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pythonVersion">Python Version</Label>
                  <Select
                    value={options.pythonVersion}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      pythonVersion: value as PythonGenerationOptions['pythonVersion']
                    }))}
                  >
                    <SelectTrigger id="pythonVersion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3.6">3.6</SelectItem>
                      <SelectItem value="3.7">3.7</SelectItem>
                      <SelectItem value="3.8">3.8</SelectItem>
                      <SelectItem value="3.9">3.9</SelectItem>
                      <SelectItem value="3.10">3.10</SelectItem>
                      <SelectItem value="3.11">3.11</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useTypeHints">Type Hints</Label>
                  <Switch
                    id="useTypeHints"
                    checked={options.useTypeHints}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useTypeHints: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useDataclasses">Dataclasses</Label>
                  <Switch
                    id="useDataclasses"
                    checked={options.useDataclasses}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useDataclasses: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="usePydantic">Pydantic Models</Label>
                  <Switch
                    id="usePydantic"
                    checked={options.usePydantic}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, usePydantic: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useProperties">Properties</Label>
                  <Switch
                    id="useProperties"
                    checked={options.useProperties}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useProperties: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateInit">Generate __init__</Label>
                  <Switch
                    id="generateInit"
                    checked={options.generateInit}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateInit: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateRepr">Generate __repr__</Label>
                  <Switch
                    id="generateRepr"
                    checked={options.generateRepr}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateRepr: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateStr">Generate __str__</Label>
                  <Switch
                    id="generateStr"
                    checked={options.generateStr}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateStr: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateJsonMethods">JSON Methods</Label>
                  <Switch
                    id="generateJsonMethods"
                    checked={options.generateJsonMethods}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateJsonMethods: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateDocstrings">Docstrings</Label>
                  <Switch
                    id="generateDocstrings"
                    checked={options.generateDocstrings}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateDocstrings: checked }))}
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
                <TabsTrigger value="output">Generated Python Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="output" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Python Classes</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <CopyCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCode}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <JsonAdvancedEditor
                    value={generatedCode}
                    onChange={() => {}}
                    height={500}
                    language="python"
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
                      {generatedCode || 'No Python code generated'}
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

export default JsonToPython;
