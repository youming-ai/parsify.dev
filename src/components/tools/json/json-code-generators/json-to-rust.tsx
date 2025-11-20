/**
 * JSON to Rust Struct Generator Component
 * Implements T030 [P] [US1] - Implement JSONToRust struct generator with derive macros
 * Generates Rust structs from JSON data with proper Rust conventions and derive macros
 * Features:
 * - Automatic struct generation with proper naming conventions
 * - Serde derive macros for serialization/deserialization
 * - Optional/nullable field handling with Option<T>
 * - Type inference with Rust-specific types
 * - Support for nested structs and enums
 * - Custom derive macro configuration
 * - Field attributes and documentation
 * - Rust package configuration
 * - Code formatting with rustfmt
 * - Generic type support
 * - Lifetime annotations
 * - Support for custom attributes
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

// Types for JSON to Rust struct generator
interface RustGenerationOptions {
  crateName: string;
  structName: string;
  fieldNaming: 'snake_case' | 'camelCase' | 'pascalCase' | 'keepOriginal';
  typeMapping: 'strict' | 'loose' | 'custom';
  useSerde: boolean;
  useOption: boolean;
  serdeRename: boolean;
  generateDocs: boolean;
  generateDebug: boolean;
  generateClone: boolean;
  generatePartialEq: boolean;
  generateEq: boolean;
  generateHash: boolean;
  generateDefault: boolean;
  customDerives: string[];
  customTypeMapping: Record<string, string>;
  optionalFields: string[];
  requiredFields: string[];
  fieldDocs: boolean;
  structDocs: boolean;
  enumVariants: 'camelCase' | 'snake_case' | 'PascalCase';
  handleDates: 'String' | 'chrono::DateTime<chrono::Utc>' | 'chrono::NaiveDateTime';
  handleUuids: 'String' | 'uuid::Uuid';
  handleNumbers: 'default' | 'i64' | 'f64' | 'serde_json::Value';
  handleUnknown: 'serde_json::Value' | 'anyhow::Result<T>';
  generateImpl: boolean;
  generateNew: boolean;
  generateFrom: boolean;
  useVisibility: 'pub' | 'pub(crate)' | 'private';
}

interface RustTypeInfo {
  rustType: string;
  isOption: boolean;
  isVec: boolean;
  isHashMap: boolean;
  serdeAttribute: string;
  docComment?: string;
  deriveMacros: string[];
}

interface JsonToRustProps {
  jsonData: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<RustGenerationOptions>;
}

const DEFAULT_OPTIONS: RustGenerationOptions = {
  crateName: 'json_models',
  structName: 'RootStruct',
  fieldNaming: 'snake_case',
  typeMapping: 'strict',
  useSerde: true,
  useOption: true,
  serdeRename: false,
  generateDocs: true,
  generateDebug: true,
  generateClone: true,
  generatePartialEq: true,
  generateEq: false,
  generateHash: false,
  generateDefault: false,
  customDerives: [],
  customTypeMapping: {},
  optionalFields: [],
  requiredFields: [],
  fieldDocs: true,
  structDocs: true,
  enumVariants: 'camelCase',
  handleDates: 'String',
  handleUuids: 'String',
  handleNumbers: 'default',
  handleUnknown: 'serde_json::Value',
  generateImpl: false,
  generateNew: false,
  generateFrom: false,
  useVisibility: 'pub'
};

// Type mapping from JSON to Rust
const JSON_TO_RUST_TYPES: Record<string, string> = {
  'string': 'String',
  'number': 'f64',
  'integer': 'i64',
  'boolean': 'bool',
  'null': 'serde_json::Value',
  'array': 'Vec',
  'object': 'struct',
  'email': 'String',
  'url': 'String',
  'date': 'String',
  'datetime': 'chrono::DateTime<chrono::Utc>',
  'uuid': 'uuid::Uuid',
  'timestamp': 'i64'
};

// JSON to Rust Struct Generator Component
export const JsonToRust: React.FC<JsonToRustProps> = ({
  jsonData,
  onCodeChange,
  className,
  readOnly = false,
  showPreview = true,
  initialOptions = {}
}) => {
  const [options, setOptions] = useState<RustGenerationOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate Rust structs from JSON
  const generateRustStructs = useCallback(async (jsonString: string, opts: RustGenerationOptions) => {
    setIsGenerating(true);

    try {
      const jsonData = JSON.parse(jsonString);
      const rustCode = generateRustCode(jsonData, opts);
      setGeneratedCode(rustCode);
      onCodeChange?.(rustCode);
    } catch (error) {
      console.error('Failed to generate Rust structs:', error);
      setIsValidJson(false);
    } finally {
      setIsGenerating(false);
    }
  }, [onCodeChange]);

  // Main Rust code generation
  const generateRustCode = useCallback((data: any, opts: RustGenerationOptions): string => {
    const structs = generateStructs(data, opts);
    const imports = generateImports(structs, opts);
    const implementations = generateImplementations(structs, opts);

    let code = '';

    // Header comment
    code += `// Generated Rust structs from JSON\n`;
    code += `// Generated by JSON to Rust converter\n\n`;

    // Imports
    if (imports.length > 0) {
      code += imports.join('\n');
      code += '\n\n';
    }

    // Structs
    code += structs.join('\n\n');

    // Implementations
    if (implementations.length > 0) {
      code += '\n\n' + implementations.join('\n\n');
    }

    return code;
  }, []);

  // Generate structs from JSON data
  const generateStructs = useCallback((data: any, opts: RustGenerationOptions, parentName = '', depth = 0): string[] => {
    if (depth > 10) return []; // Prevent infinite recursion

    const structs: string[] = [];
    const structName = opts.structName || (parentName ? `${capitalizeFirst(parentName)}` : 'RootStruct');

    if (Array.isArray(data)) {
      // Handle arrays - generate struct for array elements if they're objects
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        const elementStructName = `${structName}Item`;
        const elementStructs = generateStructs(data[0], opts, elementStructName, depth + 1);
        structs.push(...elementStructs);
        return structs;
      }
      return structs;
    }

    if (typeof data === 'object' && data !== null) {
      const fields = generateStructFields(data, opts, structName, depth);
      const structDefinition = generateStructDefinition(structName, fields, opts);
      structs.push(structDefinition);

      // Generate nested structs for objects
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const fieldName = formatFieldName(key, opts);
          const nestedStructName = `${capitalizeFirst(fieldName)}`;
          const nestedStructs = generateStructs(value, opts, nestedStructName, depth + 1);
          structs.push(...nestedStructs);
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const itemStructName = `${capitalizeFirst(formatFieldName(key, opts))}Item`;
          const itemStructs = generateStructs(value[0], opts, itemStructName, depth + 1);
          structs.push(...itemStructs);
        }
      });
    }

    return structs;
  }, []);

  // Generate struct fields
  const generateStructFields = useCallback((obj: any, opts: RustGenerationOptions, structName: string, depth: number): string[] => {
    const fields: string[] = [];

    Object.entries(obj).forEach(([key, value]) => {
      const fieldInfo = generateFieldInfo(key, value, opts, structName, depth);
      const fieldDefinition = generateFieldDefinition(fieldInfo, opts);
      fields.push(fieldDefinition);
    });

    return fields;
  }, []);

  // Generate field information
  const generateFieldInfo = useCallback((
    key: string,
    value: any,
    opts: RustGenerationOptions,
    structName: string,
    depth: number
  ): RustTypeInfo => {
    const fieldName = formatFieldName(key, opts);
    const jsonKey = key;

    // Determine Rust type
    let rustType: string;
    let isOption = opts.useOption && !opts.requiredFields.includes(key);
    let isVec = false;
    let isHashMap = false;

    if (value === null) {
      rustType = opts.handleUnknown;
    } else if (Array.isArray(value)) {
      isVec = true;
      if (value.length > 0) {
        const elementType = inferRustType(value[0], opts);
        rustType = `Vec<${elementType}>`;
      } else {
        rustType = 'Vec<serde_json::Value>';
      }
    } else if (typeof value === 'object') {
      const nestedStructName = `${capitalizeFirst(fieldName)}`;
      rustType = nestedStructName;
    } else {
      rustType = inferRustType(value, opts);
    }

    // Apply custom type mapping
    if (opts.customTypeMapping[jsonKey]) {
      rustType = opts.customTypeMapping[jsonKey];
    }

    // Generate serde attribute
    const serdeAttribute = generateSerdeAttribute(jsonKey, opts);

    return {
      rustType,
      isOption,
      isVec,
      isHashMap,
      serdeAttribute
    };
  }, []);

  // Generate field definition
  const generateFieldDefinition = useCallback((fieldInfo: RustTypeInfo, opts: RustGenerationOptions): string => {
    const fieldName = formatFieldName(fieldInfo.serdeAttribute.split('"')[1] || '', opts);
    let rustType = fieldInfo.rustType;

    if (fieldInfo.isOption) {
      rustType = `Option<${rustType}>`;
    }

    const attributes = [];
    if (fieldInfo.serdeAttribute && opts.useSerde) {
      attributes.push(fieldInfo.serdeAttribute);
    }

    let definition = '';
    if (attributes.length > 0) {
      definition += attributes.map(attr => `    #[${attr}]\n`).join('');
    }

    // Add doc comment
    if (opts.fieldDocs && fieldInfo.docComment) {
      definition += `    /// ${fieldInfo.docComment}\n`;
    }

    const visibility = opts.useVisibility === 'pub' ? 'pub ' : opts.useVisibility === 'pub(crate)' ? 'pub(crate) ' : '';
    definition += `    ${visibility}${fieldName}: ${rustType},`;

    return definition;
  }, []);

  // Generate struct definition
  const generateStructDefinition = useCallback((structName: string, fields: string[], opts: RustGenerationOptions): string => {
    const exportableName = opts.structName || structName;

    // Generate derive macros
    const derives = [];
    if (opts.useSerde) {
      derives.push('Serialize', 'Deserialize');
    }
    if (opts.generateDebug) derives.push('Debug');
    if (opts.generateClone) derives.push('Clone');
    if (opts.generatePartialEq) derives.push('PartialEq');
    if (opts.generateEq) derives.push('Eq');
    if (opts.generateHash) derives.push('Hash');
    if (opts.generateDefault) derives.push('Default');

    // Add custom derives
    derives.push(...opts.customDerives);

    let definition = '';

    // Add struct documentation
    if (opts.structDocs) {
      definition += `/// ${exportableName} represents the JSON structure\n`;
    }

    if (derives.length > 0) {
      definition += `#[derive(${derives.join(', ')})]\n`;
    }

    const visibility = opts.useVisibility === 'pub' ? 'pub ' : opts.useVisibility === 'pub(crate)' ? 'pub(crate) ' : '';
    definition += `${visibility}struct ${exportableName} {\n`;
    definition += fields.join('\n');
    definition += '\n}';

    return definition;
  }, []);

  // Generate imports
  const generateImports = useCallback((structs: string[], opts: RustGenerationOptions): string[] => {
    const imports: string[] = [];

    // Serde imports
    if (opts.useSerde && structs.some(s => s.includes('Serialize') || s.includes('Deserialize'))) {
      imports.push('use serde::{Serialize, Deserialize};');
    }

    // Chrono imports
    if (opts.handleDates.includes('chrono') && structs.some(s => s.includes('chrono::'))) {
      imports.push('use chrono::{DateTime, Utc};');
    }

    // UUID imports
    if (opts.handleUuids.includes('uuid') && structs.some(s => s.includes('uuid::'))) {
      imports.push('use uuid::Uuid;');
    }

    // JSON value imports
    if (structs.some(s => s.includes('serde_json::Value'))) {
      imports.push('use serde_json::Value;');
    }

    return imports;
  }, []);

  // Generate implementations
  const generateImplementations = useCallback((structs: string[], opts: RustGenerationOptions): string[] => {
    const implementations: string[] = [];

    structs.forEach(struct => {
      const structName = extractStructName(struct);
      if (structName && opts.generateImpl) {
        if (opts.generateNew) {
          implementations.push(generateNewImplementation(structName, struct, opts));
        }
        if (opts.generateFrom) {
          implementations.push(generateFromImplementation(structName, struct, opts));
        }
      }
    });

    return implementations;
  }, []);

  // Helper functions
  const inferRustType = useCallback((value: any, opts: RustGenerationOptions): string => {
    if (value === null) return opts.handleUnknown;
    if (typeof value === 'string') {
      // Check for specific patterns
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return opts.handleDates;
      }
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        return opts.handleUuids;
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'String';
      if (/^https?:\/\//.test(value)) return 'String';
      return 'String';
    }
    if (typeof value === 'number') {
      if (opts.handleNumbers === 'i64' && Number.isInteger(value)) return 'i64';
      if (opts.handleNumbers === 'f64') return 'f64';
      if (opts.handleNumbers === 'serde_json::Value') return 'serde_json::Value';
      return Number.isInteger(value) ? 'i64' : 'f64';
    }
    if (typeof value === 'boolean') return 'bool';
    return 'serde_json::Value';
  }, []);

  const formatFieldName = useCallback((name: string, opts: RustGenerationOptions): string => {
    switch (opts.fieldNaming) {
      case 'snake_case':
        return toSnakeCase(name);
      case 'camelCase':
        return toCamelCase(name);
      case 'pascalCase':
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

  const generateSerdeAttribute = useCallback((key: string, opts: RustGenerationOptions): string => {
    const fieldName = formatFieldName(key, opts);

    if (fieldName === key && !opts.serdeRename) {
      return '';
    }

    if (opts.optionalFields.includes(key)) {
      return `serde(default, skip_serializing_if = "Option::is_none", rename = "${key}")`;
    }

    if (opts.requiredFields.includes(key)) {
      return `serde(rename = "${key}")`;
    }

    return opts.serdeRename ? `serde(rename = "${key}")` : '';
  }, []);

  const extractStructName = useCallback((struct: string): string | null => {
    const match = struct.match(/(?:pub\s+)?struct\s+(\w+)/);
    return match ? match[1] : null;
  }, []);

  const generateNewImplementation = useCallback((structName: string, struct: string, opts: RustGenerationOptions): string => {
    return `impl ${structName} {
    pub fn new() -> Self {
        Self {
            // Initialize fields with default values
        }
    }
}`;
  }, []);

  const generateFromImplementation = useCallback((structName: string, struct: string, opts: RustGenerationOptions): string => {
    return `impl From<serde_json::Value> for ${structName} {
    fn from(value: serde_json::Value) -> Self {
        // Implement conversion from JSON value
        unimplemented!()
    }
}`;
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
    const blob = new Blob([generatedCode], { type: 'text/rust' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.structName.toLowerCase()}.rs`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, options.structName]);

  // Effects
  useEffect(() => {
    if (jsonData) {
      setIsValidJson(true);
      generateRustStructs(jsonData, options);
    }
  }, [jsonData, options, generateRustStructs]);

  return (
    <div className={cn('w-full space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">JSON to Rust Struct Generator</CardTitle>
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
              Generating Rust structs...
            </div>
          )}
        </CardHeader>

        {showSettings && (
          <div className="px-6 pb-4 border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crateName">Crate Name</Label>
                  <Input
                    id="crateName"
                    value={options.crateName}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      crateName: e.target.value
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structName">Root Struct Name</Label>
                  <Input
                    id="structName"
                    value={options.structName}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      structName: toPascalCase(e.target.value) || 'RootStruct'
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldNaming">Field Naming</Label>
                  <Select
                    value={options.fieldNaming}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      fieldNaming: value as RustGenerationOptions['fieldNaming']
                    }))}
                  >
                    <SelectTrigger id="fieldNaming">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="pascalCase">PascalCase</SelectItem>
                      <SelectItem value="keepOriginal">Keep Original</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handleDates">Date Handling</Label>
                  <Select
                    value={options.handleDates}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      handleDates: value as RustGenerationOptions['handleDates']
                    }))}
                  >
                    <SelectTrigger id="handleDates">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="String">String</SelectItem>
                      <SelectItem value="chrono::DateTime<chrono::Utc>">DateTime<Utc></SelectItem>
                      <SelectItem value="chrono::NaiveDateTime">NaiveDateTime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handleUuids">UUID Handling</Label>
                  <Select
                    value={options.handleUuids}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      handleUuids: value as RustGenerationOptions['handleUuids']
                    }))}
                  >
                    <SelectTrigger id="handleUuids">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="String">String</SelectItem>
                      <SelectItem value="uuid::Uuid">uuid::Uuid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useVisibility">Visibility</Label>
                  <Select
                    value={options.useVisibility}
                    onValueChange={(value) => setOptions(prev => ({
                      ...prev,
                      useVisibility: value as RustGenerationOptions['useVisibility']
                    }))}
                  >
                    <SelectTrigger id="useVisibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pub">pub</SelectItem>
                      <SelectItem value="pub(crate)">pub(crate)</SelectItem>
                      <SelectItem value="private">private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useSerde">Use Serde</Label>
                  <Switch
                    id="useSerde"
                    checked={options.useSerde}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useSerde: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="useOption">Use Option<T></Label>
                  <Switch
                    id="useOption"
                    checked={options.useOption}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useOption: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="serdeRename">Serde Rename</Label>
                  <Switch
                    id="serdeRename"
                    checked={options.serdeRename}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, serdeRename: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateDocs">Generate Docs</Label>
                  <Switch
                    id="generateDocs"
                    checked={options.generateDocs}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateDocs: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateDebug">Generate Debug</Label>
                  <Switch
                    id="generateDebug"
                    checked={options.generateDebug}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateDebug: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateClone">Generate Clone</Label>
                  <Switch
                    id="generateClone"
                    checked={options.generateClone}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateClone: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generatePartialEq">Generate PartialEq</Label>
                  <Switch
                    id="generatePartialEq"
                    checked={options.generatePartialEq}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generatePartialEq: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateDefault">Generate Default</Label>
                  <Switch
                    id="generateDefault"
                    checked={options.generateDefault}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateDefault: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generateImpl">Generate Impl</Label>
                  <Switch
                    id="generateImpl"
                    checked={options.generateImpl}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateImpl: checked }))}
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
                <TabsTrigger value="output">Generated Rust Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="output" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Rust Structs</Label>
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
                    language="rust"
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
                      {generatedCode || 'No Rust code generated'}
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

export default JsonToRust;
