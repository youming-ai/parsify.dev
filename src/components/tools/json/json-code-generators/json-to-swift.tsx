import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Badge } from '../../../ui/badge';
import { Switch } from '../../../ui/switch';
import { Label } from '../../../ui/label';
import { ScrollArea } from '../../../ui/scroll-area';
import { Copy, Download, Settings, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced type system for Swift code generation
interface SwiftTypeOptions {
  useStructs: boolean;
  useClasses: boolean;
  useCodable: boolean;
  useCustomCoding: boolean;
  useEnumCases: boolean;
  useOptionals: boolean;
  useImplicitUnwrapping: boolean;
  useLazyProperties: boolean;
  useComputedProperties: boolean;
  usePropertyObservers: boolean;
  generateInitializers: boolean;
  generateCustomInit: boolean;
  generateCodableKeys: boolean;
  generateEquatable: boolean;
  generateHashable: boolean;
  generateCustomStringConvertible: boolean;
  useSwiftUI: boolean;
  useCombine: boolean;
  swiftVersion: '5.7' | '5.8' | '5.9' | '5.10' | '6.0';
  accessLevel: 'private' | 'fileprivate' | 'internal' | 'public' | 'open';
  moduleName: string;
  typeName: string;
  imports: string[];
  fileHeader: string;
}

interface SwiftGenerationConfig {
  rootTypeName: string;
  accessLevel: 'private' | 'fileprivate' | 'internal' | 'public' | 'open';
  moduleName: string;
  imports: string[];
  options: SwiftTypeOptions;
}

interface SwiftTypeInfo {
  name: string;
  properties: SwiftPropertyInfo[];
  enums: SwiftEnumInfo[];
  computedProperties: SwiftComputedPropertyInfo[];
  initializers: SwiftInitializerInfo[];
  accessLevel: string;
  isStruct: boolean;
  isClass: boolean;
  protocols: string[];
  imports: string[];
  description?: string;
}

interface SwiftPropertyInfo {
  name: string;
  type: string;
  swiftType: string;
  isOptional: boolean;
  isImplicitlyUnwrapped: boolean;
  isLazy: boolean;
  defaultValue?: string;
  codingKey: string;
  description?: string;
  accessLevel: string;
  willSet: string?;
  didSet: string?;
}

interface SwiftEnumInfo {
  name: string;
  cases: SwiftEnumCaseInfo[];
  rawValueType?: string;
  accessLevel: string;
  protocols: string[];
  description?: string;
}

interface SwiftEnumCaseInfo {
  name: string;
  rawValue?: string;
  associatedValues?: { name: string; type: string }[];
}

interface SwiftComputedPropertyInfo {
  name: string;
  returnType: string;
  body: string;
  accessLevel: string;
  description?: string;
}

interface SwiftInitializerInfo {
  parameters: SwiftParameterInfo[];
  body: string;
  accessLevel: string;
  throws: boolean;
  description?: string;
}

interface SwiftParameterInfo {
  name: string;
  type: string;
  defaultValue?: string;
  isOptional: boolean;
  isVariadic: boolean;
}

// Enhanced type inference for Swift
interface TypeInferenceResult {
  swiftType: string;
  isOptional: boolean;
  defaultValue?: string;
  requiresFoundation: boolean;
  requiresSwiftUI: boolean;
  requiresCombine: boolean;
}

const DEFAULT_SWIFT_OPTIONS: SwiftTypeOptions = {
  useStructs: true,
  useClasses: false,
  useCodable: true,
  useCustomCoding: false,
  useEnumCases: false,
  useOptionals: true,
  useImplicitUnwrapping: false,
  useLazyProperties: false,
  useComputedProperties: false,
  usePropertyObservers: false,
  generateInitializers: true,
  generateCustomInit: false,
  generateCodableKeys: true,
  generateEquatable: true,
  generateHashable: false,
  generateCustomStringConvertible: true,
  useSwiftUI: false,
  useCombine: false,
  swiftVersion: '5.9',
  accessLevel: 'internal',
  moduleName: 'GeneratedModels',
  typeName: 'RootObject',
  imports: ['Foundation'],
  fileHeader: ''
};

const SWIFT_TYPE_MAPPINGS: Record<string, string> = {
  'string': 'String',
  'number': 'Double',
  'integer': 'Int',
  'boolean': 'Bool',
  'null': 'Any',
  'array': 'Array',
  'object': 'Any',
  'datetime': 'Date',
  'date': 'Date',
  'time': 'Date',
  'uuid': 'UUID',
  'decimal': 'Decimal',
  'float': 'Float',
  'long': 'Int64',
  'short': 'Int16',
  'byte': 'Int8',
  'uri': 'URL'
};

const SWIFT_RESERVED_KEYWORDS = new Set([
  'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func', 'import', 'init',
  'inout', 'internal', 'let', 'open', 'operator', 'private', 'protocol', 'public', 'rethrows',
  'static', 'struct', 'subscript', 'typealias', 'var', 'break', 'case', 'continue', 'default',
  'defer', 'do', 'else', 'fallthrough', 'for', 'guard', 'if', 'in', 'repeat', 'return', 'switch',
  'where', 'while', 'as', 'catch', 'false', 'is', 'nil', 'rethrows', 'super', 'self', 'Self',
  'throw', 'throws', 'true', 'try', 'associativity', 'convenience', 'dynamic', 'didSet',
  'final', 'get', 'infix', 'indirect', 'lazy', 'left', 'mutating', 'none', 'nonmutating',
  'optional', 'override', 'postfix', 'precedence', 'prefix', 'Protocol', 'required', 'right',
  'set', 'Type', 'unowned', 'weak', 'willSet'
]);

// Enhanced type inference for Swift
const inferSwiftType = (
  value: any,
  key: string,
  options: SwiftTypeOptions
): TypeInferenceResult => {
  let swiftType = 'Any';
  let isOptional = options.useOptionals;
  let requiresFoundation = false;
  let requiresSwiftUI = false;
  let requiresCombine = false;

  if (value === null || value === undefined) {
    swiftType = 'Any';
    isOptional = true;
  } else if (Array.isArray(value)) {
    const elementType = value.length > 0
      ? inferSwiftType(value[0], '', options).swiftType
      : 'Any';
    swiftType = `[${elementType}]`;
    isOptional = true;
  } else if (typeof value === 'object') {
    if (value instanceof Date) {
      swiftType = 'Date';
      isOptional = true;
      requiresFoundation = true;
    } else {
      // For nested objects, we'll generate a struct later
      const typeName = toPascalCase(key) || 'DataObject';
      swiftType = typeName;
      isOptional = true;
    }
  } else if (typeof value === 'string') {
    // Check for special string formats
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      swiftType = 'Date';
      isOptional = true;
      requiresFoundation = true;
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      swiftType = 'Date';
      isOptional = true;
      requiresFoundation = true;
    } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      swiftType = 'UUID';
      isOptional = true;
      requiresFoundation = true;
    } else if (value.match(/^https?:\/\//)) {
      swiftType = 'URL';
      isOptional = true;
      requiresFoundation = true;
    } else if (value.match(/^\d+$/)) {
      swiftType = 'Int';
      isOptional = false;
    } else if (value.match(/^\d*\.\d+$/)) {
      swiftType = 'Double';
      isOptional = false;
    } else {
      swiftType = 'String';
      isOptional = false;
    }
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) {
        swiftType = 'Int64';
      } else {
        swiftType = 'Int';
      }
    } else {
      swiftType = 'Double';
    }
    isOptional = false;
  } else if (typeof value === 'boolean') {
    swiftType = 'Bool';
    isOptional = false;
  }

  return {
    swiftType,
    isOptional,
    requiresFoundation,
    requiresSwiftUI,
    requiresCombine
  };
};

// Enhanced PascalCase conversion with Swift naming conventions
const toPascalCase = (str: string): string => {
  if (!str) return str;

  // Convert snake_case, kebab-case, and spaces to PascalCase
  return str
    .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, char => char.toUpperCase())
    .replace(/[a-z]([A-Z])/g, (_, char) => char.toLowerCase());
};

// Convert to camelCase for property names
const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Sanitize Swift identifiers
const sanitizeSwiftIdentifier = (str: string): string => {
  let sanitized = str;

  // Replace invalid characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '_');

  // Ensure it starts with a letter or underscore
  if (sanitized.match(/^\d/)) {
    sanitized = '_' + sanitized;
  }

  // Handle Swift reserved keywords
  if (SWIFT_RESERVED_KEYWORDS.has(sanitized)) {
    sanitized = '`' + sanitized + '`';
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'property';
  }

  return sanitized;
};

// Generate Swift property with enhanced features
const generateSwiftProperty = (
  key: string,
  value: any,
  index: number,
  options: SwiftTypeOptions
): SwiftPropertyInfo => {
  const typeInfo = inferSwiftType(value, key, options);
  const propertyName = sanitizeSwiftIdentifier(toCamelCase(key));
  const propertyType = typeInfo.isOptional ? typeInfo.swiftType + '?' : typeInfo.swiftType;

  return {
    name: propertyName,
    type: typeof value,
    swiftType: propertyType,
    isOptional: typeInfo.isOptional,
    isImplicitlyUnwrapped: options.useImplicitUnwrapping && typeInfo.isOptional,
    isLazy: options.useLazyProperties && typeInfo.isOptional,
    defaultValue: typeInfo.defaultValue,
    codingKey: key,
    description: '',
    accessLevel: options.accessLevel,
    willSet: options.usePropertyObservers ? nil : undefined,
    didSet: options.usePropertyObservers ? nil : undefined
  };
};

// Generate Swift struct/class from object with enhanced features
const generateSwiftType = (
  obj: any,
  typeName: string,
  options: SwiftTypeOptions,
  imports: string[] = []
): SwiftTypeInfo => {
  const properties: SwiftPropertyInfo[] = [];
  const enums: SwiftEnumInfo[] = [];
  const computedProperties: SwiftComputedPropertyInfo[] = [];
  const initializers: SwiftInitializerInfo[] = [];
  const requiredImports = new Set(imports);

  // Always add Foundation for Codable
  if (options.useCodable) {
    requiredImports.add('Foundation');
  }

  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    let index = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (key === '__comment__') continue;

      const property = generateSwiftProperty(key, value, index, options);
      properties.push(property);

      // Add required imports from type inference
      const typeInfo = inferSwiftType(value, key, options);
      if (typeInfo.requiresFoundation) {
        requiredImports.add('Foundation');
      }

      index++;
    }
  }

  // Generate custom initializer if needed
  if (options.generateCustomInit && properties.length > 0) {
    const nonOptionalProps = properties.filter(p => !p.isOptional);
    if (nonOptionalProps.length > 0) {
      const parameters = nonOptionalProps.map(prop => ({
        name: prop.name,
        type: prop.swiftType,
        isOptional: prop.isOptional,
        isVariadic: false
      }));

      const body = nonOptionalProps.map(prop =>
        `self.${prop.name} = ${prop.name}`
      ).join('\n        ');

      initializers.push({
        parameters,
        body,
        accessLevel: options.accessLevel,
        throws: false,
        description: 'Initialize with required properties'
      });
    }
  }

  // Generate protocols
  const protocols: string[] = [];
  if (options.useCodable) {
    protocols.push('Codable');
  }
  if (options.generateEquatable) {
    protocols.push('Equatable');
  }
  if (options.generateHashable) {
    protocols.push('Hashable');
  }
  if (options.generateCustomStringConvertible) {
    protocols.push('CustomStringConvertible');
  }

  return {
    name: sanitizeSwiftIdentifier(typeName),
    properties,
    enums,
    computedProperties,
    initializers,
    accessLevel: options.accessLevel,
    isStruct: options.useStructs,
    isClass: options.useClasses,
    protocols,
    imports: Array.from(requiredImports),
    description: ''
  };
};

// Generate Swift code string with enhanced formatting
const generateSwiftCode = (
  types: SwiftTypeInfo[],
  config: SwiftGenerationConfig
): string => {
  const parts: string[] = [];
  const options = config.options;

  // File header
  if (options.fileHeader) {
    parts.push(options.fileHeader);
    parts.push('');
  }

  // Imports
  const allImports = new Set<string>();
  types.forEach(type => {
    type.imports.forEach(imp => allImports.add(imp));
    config.imports.forEach(imp => allImports.add(imp));
  });

  // Add framework imports based on options
  if (options.useSwiftUI) {
    allImports.add('SwiftUI');
  }
  if (options.useCombine) {
    allImports.add('Combine');
  }

  Array.from(allImports).sort().forEach(imp => {
    parts.push(`import ${imp}`);
  });

  parts.push('');

  // Generate each type
  types.forEach((type, index) => {
    parts.push('');

    // Type documentation
    if (type.description) {
      parts.push(`/// ${type.description}`);
    }

    // Type declaration
    const typeKeyword = type.isStruct ? 'struct' : type.isClass ? 'class' : 'struct';
    const protocolsClause = type.protocols.length > 0 ? ': ' + type.protocols.join(', ') : '';

    parts.push(`${type.accessLevel} ${typeKeyword} ${type.name}${protocolsClause} {`);

    // CodingKeys enum if needed
    if (options.useCodable && options.generateCodableKeys) {
      const needsCustomKeys = type.properties.some(prop => prop.name !== prop.codingKey);
      if (needsCustomKeys) {
        parts.push('    private enum CodingKeys: String, CodingKey {');
        type.properties.forEach(prop => {
          if (prop.name !== prop.codingKey) {
            parts.push(`        case ${prop.name} = "${prop.codingKey}"`);
          }
        });
        parts.push('    }');
        parts.push('');
      }
    }

    // Properties
    type.properties.forEach(prop => {
      if (prop.description) {
        parts.push(`    /// ${prop.description}`);
      }

      let propDeclaration = `    ${prop.accessLevel} `;
      if (prop.isLazy) {
        propDeclaration += 'lazy ';
      }

      const optionalMark = prop.isImplicitlyUnwrapped ? '!' : '';
      propDeclaration += `var ${prop.name}: ${prop.swiftType}${optionalMark}`;

      if (prop.defaultValue) {
        propDeclaration += ` = ${prop.defaultValue}`;
      }

      // Property observers
      if (prop.willSet || prop.didSet) {
        propDeclaration += ' {';
        if (prop.willSet) {
          propDeclaration += `\n        ${prop.willSet}`;
        }
        if (prop.didSet) {
          propDeclaration += `\n        ${prop.didSet}`;
        }
        propDeclaration += '\n    }';
      }

      parts.push(propDeclaration);
    });

    // Custom initializers
    if (initializers.length > 0) {
      parts.push('');
      initializers.forEach(init => {
        if (init.description) {
          parts.push(`    /// ${init.description}`);
        }

        const params = init.parameters.map(param => {
          const label = param.name === '_' ? '' : `${param.name} `;
          const optional = param.isOptional ? '?' : '';
          return `${label}${param.name}: ${param.type}${optional}`;
        }).join(', ');

        const throwsKeyword = init.throws ? ' throws' : '';
        parts.push(`    ${init.accessLevel} init(${params})${throwsKeyword} {`);
        parts.push(`        ${init.body}`);
        parts.push('    }');
      });
    }

    // Computed properties
    if (type.computedProperties.length > 0) {
      parts.push('');
      type.computedProperties.forEach(comp => {
        if (comp.description) {
          parts.push(`    /// ${comp.description}`);
        }
        parts.push(`    ${comp.accessLevel} var ${comp.name}: ${comp.returnType} {`);
        parts.push(`        ${comp.body}`);
        parts.push('    }');
      });
    }

    // CustomStringConvertible
    if (type.protocols.includes('CustomStringConvertible')) {
      parts.push('');
      parts.push('    public var description: String {');
      if (type.properties.length === 0) {
        parts.push(`        return "\(type.name)()"`);
      } else {
        const propsString = type.properties
          .slice(0, 3)
          .map(prop => `${prop.name}: \\(${prop.name})`)
          .join(', ');
        const moreText = type.properties.length > 3 ? ` +${type.properties.length - 3} more` : '';
        parts.push(`        return "\(type.name)(\(propsString)\(moreText))"`);
      }
      parts.push('    }');
    }

    parts.push('}');
  });

  return parts.join('\n');
};

// Validate and format JSON
const formatJson = (jsonString: string): { isValid: boolean; data?: any; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    return { isValid: true, data };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
};

// Main component props
interface JsonToSwiftProps {
  jsonData?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<SwiftTypeOptions>;
}

export const JsonToSwift: React.FC<JsonToSwiftProps> = ({
  jsonData,
  onCodeChange,
  className: propsClassName,
  readOnly = false,
  showPreview = true,
  initialOptions = {}
}) => {
  const [jsonInput, setJsonInput] = useState(jsonData || '');
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [options, setOptions] = useState<SwiftTypeOptions>({
    ...DEFAULT_SWIFT_OPTIONS,
    ...initialOptions
  });
  const [config, setConfig] = useState<SwiftGenerationConfig>({
    rootTypeName: options.typeName,
    accessLevel: options.accessLevel,
    moduleName: options.moduleName,
    imports: options.imports,
    options
  });

  // Memoized Swift type generation
  const generatedTypes = useMemo(() => {
    if (!validation.isValid || !jsonInput.trim()) return [];

    try {
      const parsedData = JSON.parse(jsonInput);
      const rootType = generateSwiftType(
        parsedData,
        config.rootTypeName,
        config.options,
        config.imports
      );

      return [rootType]; // In a full implementation, we'd handle nested objects recursively
    } catch (error) {
      return [];
    }
  }, [jsonInput, validation.isValid, config]);

  // Memoized Swift code generation
  const generatedCode = useMemo(() => {
    if (!validation.isValid || generatedTypes.length === 0) return '';

    const code = generateSwiftCode(generatedTypes, config);
    return code;
  }, [validation.isValid, generatedTypes, config]);

  // Handle JSON input change
  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    const result = formatJson(value);
    setValidation(result);
  };

  // Update config when options change
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      options: { ...options },
      rootTypeName: options.typeName,
      accessLevel: options.accessLevel,
      moduleName: options.moduleName,
      imports: options.imports
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
      console.error('Failed to copy:', error);
    }
  };

  // Download as .swift file
  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.rootTypeName}.swift`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset to defaults
  const handleReset = () => {
    setOptions(DEFAULT_SWIFT_OPTIONS);
    setJsonInput('');
    setValidation({ isValid: true });
  };

  const className = cn(
    'w-full max-w-6xl mx-auto p-6 space-y-6',
    propsClassName
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                JSON to Swift Converter
                <Badge variant="outline">Swift {options.swiftVersion}</Badge>
              </CardTitle>
              <CardDescription>
                Generate Swift structs and classes from JSON with Codable support
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={readOnly}
              >
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
                  'w-full h-64 p-3 font-mono text-sm border rounded-md resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  !validation.isValid && 'border-red-500'
                )}
                placeholder="Paste your JSON here..."
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                disabled={readOnly}
              />
              {!validation.isValid && (
                <p className="text-sm text-red-600">
                  {validation.error}
                </p>
              )}
            </div>

            {/* Configuration Options */}
            <Tabs defaultValue="basic" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="type">Type Options</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="swift-version">Swift Version</Label>
                    <select
                      id="swift-version"
                      className="w-full p-2 border rounded-md"
                      value={options.swiftVersion}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        swiftVersion: e.target.value as SwiftTypeOptions['swiftVersion']
                      }))}
                      disabled={readOnly}
                    >
                      <option value="6.0">Swift 6.0</option>
                      <option value="5.10">Swift 5.10</option>
                      <option value="5.9">Swift 5.9</option>
                      <option value="5.8">Swift 5.8</option>
                      <option value="5.7">Swift 5.7</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type-name">Type Name</Label>
                    <input
                      id="type-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.typeName}
                      onChange={(e) => setOptions(prev => ({ ...prev, typeName: e.target.value }))}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="access-level">Access Level</Label>
                    <select
                      id="access-level"
                      className="w-full p-2 border rounded-md"
                      value={options.accessLevel}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        accessLevel: e.target.value as SwiftTypeOptions['accessLevel']
                      }))}
                      disabled={readOnly}
                    >
                      <option value="open">open</option>
                      <option value="public">public</option>
                      <option value="internal">internal</option>
                      <option value="fileprivate">fileprivate</option>
                      <option value="private">private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-name">Module Name</Label>
                    <input
                      id="module-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.moduleName}
                      onChange={(e) => setOptions(prev => ({ ...prev, moduleName: e.target.value }))}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="codable"
                      checked={options.useCodable}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useCodable: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="codable">Codable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="optionals"
                      checked={options.useOptionals}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useOptionals: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="optionals">Use Optionals</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom-coding"
                      checked={options.useCustomCoding}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useCustomCoding: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="custom-coding">Custom Coding</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="type" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="structs"
                      checked={options.useStructs}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useStructs: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="structs">Generate Structs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="classes"
                      checked={options.useClasses}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useClasses: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="classes">Generate Classes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enum-cases"
                      checked={options.useEnumCases}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useEnumCases: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="enum-cases">Generate Enums</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="computed-properties"
                      checked={options.useComputedProperties}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useComputedProperties: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="computed-properties">Computed Properties</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="implicit-unwrapping"
                      checked={options.useImplicitUnwrapping}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useImplicitUnwrapping: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="implicit-unwrapping">Implicit Unwrapping</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lazy-properties"
                      checked={options.useLazyProperties}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useLazyProperties: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="lazy-properties">Lazy Properties</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="property-observers"
                      checked={options.usePropertyObservers}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, usePropertyObservers: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="property-observers">Property Observers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom-init"
                      checked={options.generateCustomInit}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateCustomInit: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="custom-init">Custom Initializer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="coding-keys"
                      checked={options.generateCodableKeys}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateCodableKeys: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="coding-keys">CodingKeys</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="equatable"
                      checked={options.generateEquatable}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateEquatable: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="equatable">Equatable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hashable"
                      checked={options.generateHashable}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateHashable: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="hashable">Hashable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom-string"
                      checked={options.generateCustomStringConvertible}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, generateCustomStringConvertible: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="custom-string">CustomStringConvertible</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="frameworks" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="swiftui"
                      checked={options.useSwiftUI}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useSwiftUI: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="swiftui">SwiftUI Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="combine"
                      checked={options.useCombine}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useCombine: checked }))}
                      disabled={readOnly}
                    />
                    <Label htmlFor="combine">Combine Support</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-imports">Additional Imports (one per line)</Label>
                  <textarea
                    id="additional-imports"
                    className="w-full h-20 p-2 border rounded-md font-mono text-sm"
                    placeholder="UIKit&#10;CoreData&#10;..."
                    value={options.imports.join('\n')}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      imports: e.target.value.split('\n').filter(line => line.trim())
                    }))}
                    disabled={readOnly}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            {showPreview && generatedCode && (
              <div className="space-y-2">
                <Label>Generated Swift Code</Label>
                <ScrollArea className="h-96 w-full border rounded-md">
                  <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                    <code>{generatedCode}</code>
                  </pre>
                </ScrollArea>
              </div>
            )}

            {/* Type Information */}
            {generatedTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Generated Types</Label>
                <div className="grid gap-2">
                  {generatedTypes.map((type, index) => (
                    <div key={index} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {type.isStruct ? 'struct' : type.isClass ? 'class' : 'struct'} {type.name}
                        </span>
                        <Badge variant="outline">
                          {type.properties.length} properties
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {type.protocols.join(', ') || 'No protocols'}
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

export default JsonToSwift;
