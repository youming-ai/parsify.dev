/**
 * JSON Code Generation Utilities
 *
 * Template system and utilities for generating code from JSON data structures.
 * Supports multiple programming languages with extensible template engine.
 */

// Template system interfaces
export interface CodeTemplate {
  name: string;
  description: string;
  language: string;
  version: string;
  author: string;
  templates: TemplateCollection;
  settings: CodeGenerationSettings;
  dependencies: string[];
}

export interface TemplateDefinition {
  template: string;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  loops: TemplateLoop[];
  placeholders: TemplatePlaceholder[];
}

export type TemplateCollection = Record<string, TemplateDefinition> & {
  class: TemplateDefinition;
  interface: TemplateDefinition;
  enum: TemplateDefinition;
  typeAlias: TemplateDefinition;
  function: TemplateDefinition;
  property: TemplateDefinition;
  method: TemplateDefinition;
  constructor: TemplateDefinition;
  getter: TemplateDefinition;
  setter: TemplateDefinition;
};

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  description: string;
  required: boolean;
}

export interface TemplateCondition {
  variable: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
  value?: any;
  template: string;
}

export interface TemplateLoop {
  variable: string;
  template: string;
  separator?: string;
  emptyTemplate?: string;
}

export interface TemplatePlaceholder {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: RegExpMatchArray, context: CodeGenerationContext) => string);
}

const createEmptyTemplate = (): TemplateDefinition => ({
  template: '',
  variables: [],
  conditions: [],
  loops: [],
  placeholders: [],
});

const createTemplateBase = (): TemplateCollection => ({
  class: createEmptyTemplate(),
  interface: createEmptyTemplate(),
  enum: createEmptyTemplate(),
  typeAlias: createEmptyTemplate(),
  function: createEmptyTemplate(),
  property: createEmptyTemplate(),
  method: createEmptyTemplate(),
  constructor: createEmptyTemplate(),
  getter: createEmptyTemplate(),
  setter: createEmptyTemplate(),
});

const withBaseTemplates = (
  templates: Partial<Record<string, TemplateDefinition>>
): TemplateCollection =>
  ({
    ...createTemplateBase(),
    ...templates,
  }) as TemplateCollection;

export interface CodeGenerationSettings {
  namingConvention: NamingConventionOptions;
  indentStyle: IndentStyle;
  lineWidth: number;
  generateComments: boolean;
  generateConstructors: boolean;
  generateGettersSetters: boolean;
  generateValidation: boolean;
  includeTypeImports: boolean;
  useStrictTyping: boolean;
  privateProperties: boolean;
  generateDocumentation: boolean;
  fileHeader: string;
  lineEnding: 'crlf' | 'lf' | 'cr';
  encoding: 'utf8' | 'utf16' | 'ascii';
}

export interface NamingConventionOptions {
  caseStyle: 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'UPPER_CASE' | 'lowercase';
  prefix?: string;
  suffix?: string;
  abbreviations: Record<string, string>;
  reservedWords: string[];
}

export interface IndentStyle {
  type: 'spaces' | 'tabs';
  size: number;
}

// Code generation context
export interface CodeGenerationContext {
  data: any;
  className: string;
  namespace?: string;
  packageName?: string;
  parentClass?: string;
  implements?: string | string[];
  imports: string[];
  generatedClasses: GeneratedClass[];
  currentDepth: number;
  options: CodeGenerationSettings;
  templateData: Record<string, any>;
  metadata: GenerationMetadata;
}

export interface GeneratedClass {
  name: string;
  className: string;
  properties: GeneratedProperty[];
  methods: GeneratedMethod[];
  imports: string[];
  annotations: string[];
  extends?: string;
  implements?: string[];
  description?: string;
  isInterface: boolean;
  isEnum: boolean;
  isAbstract: boolean;
}

export interface GeneratedProperty {
  name: string;
  type: string;
  isOptional: boolean;
  isReadOnly: boolean;
  isStatic: boolean;
  defaultValue?: string;
  annotations: string[];
  description?: string;
  customGetter?: string;
  customSetter?: string;
}

export interface GeneratedMethod {
  name: string;
  returnType: string;
  parameters: GeneratedParameter[];
  isStatic: boolean;
  isAsync: boolean;
  isAbstract: boolean;
  visibility: 'public' | 'private' | 'protected' | 'internal';
  body: string;
  annotations: string[];
  description?: string;
}

export interface GeneratedParameter {
  name: string;
  type: string;
  isOptional: boolean;
  defaultValue?: string;
  description?: string;
}

export interface GenerationMetadata {
  timestamp: Date;
  source: string;
  language: string;
  version: string;
  template: string;
  generationTime: number;
  linesGenerated: number;
  charactersGenerated: number;
}

// Built-in templates for different languages
const BUILTIN_TEMPLATES: Record<string, CodeTemplate> = {
  typescript: {
    name: 'TypeScript',
    description: 'TypeScript code generation templates',
    language: 'typescript',
    version: '4.9+',
    author: 'JSON Tools Platform',
    templates: withBaseTemplates({
      class: {
        template: `export class {{className}} {{#if.extends}}extends {{extends}} {{/if}}{{#if.implements}}implements {{implements}} {{/if}}{
{{#if.properties}}{{properties}}{{/if}}}`,
        variables: [
          {
            name: 'className',
            type: 'string',
            required: true,
            description: 'Class name',
          },
          {
            name: 'extends',
            type: 'string',
            required: false,
            description: 'Parent class',
          },
          {
            name: 'implements',
            type: 'string',
            required: false,
            description: 'Implemented interfaces',
          },
          {
            name: 'properties',
            type: 'object',
            required: false,
            description: 'Class properties',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      interface: {
        template: `export interface {{className}} {{#if.extends}}extends {{extends}} {{/if}}{{#if.implements}}implements {{implements}} {{/if}}{
{{#if.properties}}{{properties}}{{/if}}}`,
        variables: [
          {
            name: 'className',
            type: 'string',
            required: true,
            description: 'Interface name',
          },
          {
            name: 'extends',
            type: 'string',
            required: false,
            description: 'Parent interface',
          },
          {
            name: 'implements',
            type: 'string',
            required: false,
            description: 'Implemented interfaces',
          },
          {
            name: 'properties',
            type: 'object',
            required: false,
            description: 'Interface properties',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      property: {
        template:
          '{{#if.annotations}}{{annotations}} {{/if}}{{name}}{{#if.isOptional}}?{{/if}}: {{type}};{{#if.description}} // {{description}}{{/if}}',
        variables: [
          {
            name: 'annotations',
            type: 'array',
            required: false,
            description: 'Property annotations',
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Property name',
          },
          {
            name: 'isOptional',
            type: 'boolean',
            required: true,
            description: 'Whether property is optional',
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Property type',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Property description',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
    }),
    settings: {
      namingConvention: {
        caseStyle: 'PascalCase',
        abbreviations: {
          id: 'ID',
          url: 'URL',
          uri: 'URI',
          json: 'JSON',
          xml: 'XML',
          html: 'HTML',
          http: 'HTTP',
          https: 'HTTPS',
        },
        reservedWords: ['class', 'interface', 'type', 'enum', 'import', 'export'],
      },
      indentStyle: { type: 'spaces', size: 2 },
      lineWidth: 120,
      generateComments: true,
      generateConstructors: true,
      generateGettersSetters: false,
      generateValidation: false,
      includeTypeImports: true,
      useStrictTyping: true,
      privateProperties: false,
      generateDocumentation: true,
      fileHeader: '',
      lineEnding: 'lf',
      encoding: 'utf8',
    },
    dependencies: [],
  },
  javascript: {
    name: 'JavaScript',
    description: 'JavaScript code generation templates',
    language: 'javascript',
    version: 'ES2022',
    author: 'JSON Tools Platform',
    templates: withBaseTemplates({
      class: {
        template: `class {{className}} {{#if.extends}}extends {{extends}} {{/if}}{
  constructor({{#if.constructorParams}}{{constructorParams}}{{/if}}) {
{{#if.constructorBody}}{{constructorBody}}{{/if}}
  }
{{#if.methods}}{{methods}}{{/if}}}`,
        variables: [
          {
            name: 'className',
            type: 'string',
            required: true,
            description: 'Class name',
          },
          {
            name: 'extends',
            type: 'string',
            required: false,
            description: 'Parent class',
          },
          {
            name: 'constructorParams',
            type: 'string',
            required: false,
            description: 'Constructor parameters',
          },
          {
            name: 'constructorBody',
            type: 'string',
            required: false,
            description: 'Constructor body',
          },
          {
            name: 'methods',
            type: 'string',
            required: false,
            description: 'Class methods',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      property: {
        template: '  {{name}} = {{defaultValue}};{{#if.description}} // {{description}}{{/if}}',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Property name',
          },
          {
            name: 'defaultValue',
            type: 'string',
            required: true,
            description: 'Default value',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Property description',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
    }),
    settings: {
      namingConvention: {
        caseStyle: 'camelCase',
        abbreviations: {
          id: 'id',
          url: 'url',
          uri: 'uri',
          json: 'json',
          xml: 'xml',
        },
        reservedWords: ['class', 'function', 'var', 'let', 'const', 'import', 'export'],
      },
      indentStyle: { type: 'spaces', size: 2 },
      lineWidth: 120,
      generateComments: true,
      generateConstructors: true,
      generateGettersSetters: false,
      generateValidation: false,
      includeTypeImports: false,
      useStrictTyping: false,
      privateProperties: false,
      generateDocumentation: true,
      fileHeader: '',
      lineEnding: 'lf',
      encoding: 'utf8',
    },
    dependencies: [],
  },
  python: {
    name: 'Python',
    description: 'Python code generation templates',
    language: 'python',
    version: '3.11',
    author: 'JSON Tools Platform',
    templates: withBaseTemplates({
      class: {
        template: `{{#if.fileHeader}}{{fileHeader}}
{{/if}}class {{className}}:
    \"\"\"{{description}}\"\"\"{{#if.parentClass}}:
        {{parentClass}}
    {{/if}}

    def __init__(self{{#if.constructorParams}}{{constructorParams}}{{/if}}):
{{#if.constructorBody}}{{constructorBody}}{{/if}}
{{#if.methods}}
{{methods}}
{{/if}}`,
        variables: [
          {
            name: 'fileHeader',
            type: 'string',
            required: false,
            description: 'File header comment',
          },
          {
            name: 'className',
            type: 'string',
            required: true,
            description: 'Class name',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Class docstring',
          },
          {
            name: 'parentClass',
            type: 'string',
            required: false,
            description: 'Parent class',
          },
          {
            name: 'constructorParams',
            type: 'string',
            required: false,
            description: 'Constructor parameters',
          },
          {
            name: 'constructorBody',
            type: 'string',
            required: false,
            description: 'Constructor body',
          },
          {
            name: 'methods',
            type: 'string',
            required: false,
            description: 'Class methods',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      property: {
        template: '    {{name}}: {{type}}{{#if.defaultValue}} = {{defaultValue}}{{/if}}',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Property name',
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Property type',
          },
          {
            name: 'defaultValue',
            type: 'string',
            required: false,
            description: 'Default value',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
    }),
    settings: {
      namingConvention: {
        caseStyle: 'PascalCase',
        abbreviations: {
          id: 'ID',
          url: 'URL',
          uri: 'URI',
        },
        reservedWords: ['class', 'def', 'if', 'else', 'for', 'while', 'import', 'from'],
      },
      indentStyle: { type: 'spaces', size: 4 },
      lineWidth: 88,
      generateComments: true,
      generateConstructors: true,
      generateGettersSetters: true,
      generateValidation: true,
      includeTypeImports: false,
      useStrictTyping: false,
      privateProperties: false,
      generateDocumentation: true,
      fileHeader: '# -*- coding: utf-8 -*-\n',
      lineEnding: 'lf',
      encoding: 'utf8',
    },
    dependencies: [],
  },
  go: {
    name: 'Go',
    description: 'Go code generation templates',
    language: 'go',
    version: '1.21+',
    author: 'JSON Tools Platform',
    templates: withBaseTemplates({
      class: {
        template: `// {{name}} represents {{description}}
type {{name}} struct {
{{#if.properties}}{{properties}}{{/if}}}`,
        variables: [
          {
            name: 'name',
            type: 'string',
            required: false,
            description: 'Struct name',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Struct description',
          },
          {
            name: 'properties',
            type: 'string',
            required: false,
            description: 'Struct properties',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      struct: {
        template: `// {{name}} represents {{description}}
type {{name}} struct {
{{#if.properties}}{{properties}}{{/if}}}`,
        variables: [
          {
            name: 'name',
            type: 'string',
            required: false,
            description: 'Struct name',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Struct description',
          },
          {
            name: 'properties',
            type: 'string',
            required: false,
            description: 'Struct properties',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      property: {
        template:
          '  {{name}} {{type}} `json:"{{jsonName}}"`{{#if.tag}} `{{tag}}`{{/if}}{{#if.comment}} // {{comment}}{{/if}}',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Property name',
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Property type',
          },
          {
            name: 'jsonName',
            type: 'string',
            required: true,
            description: 'JSON field name',
          },
          {
            name: 'tag',
            type: 'string',
            required: false,
            description: 'Struct tag',
          },
          {
            name: 'comment',
            type: 'string',
            required: false,
            description: 'Property comment',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
    }),
    settings: {
      namingConvention: {
        caseStyle: 'PascalCase',
        abbreviations: {
          id: 'ID',
          url: 'URL',
          uri: 'URI',
        },
        reservedWords: ['type', 'struct', 'interface', 'func', 'var', 'const', 'import', 'package'],
      },
      indentStyle: { type: 'tabs', size: 1 },
      lineWidth: 100,
      generateComments: true,
      generateConstructors: false,
      generateGettersSetters: false,
      generateValidation: false,
      includeTypeImports: false,
      useStrictTyping: false,
      privateProperties: false,
      generateDocumentation: true,
      fileHeader: '// Code generated by JSON Tools Platform\n',
      lineEnding: 'lf',
      encoding: 'utf8',
    },
    dependencies: [],
  },
  rust: {
    name: 'Rust',
    description: 'Rust code generation templates',
    language: 'rust',
    version: '1.70+',
    author: 'JSON Tools Platform',
    templates: withBaseTemplates({
      class: {
        template: `{{#if.annotations}}{{annotations}}
{{/if}}{{#if.derive}}#[derive({{derive}})]
{{/if}}pub struct {{name}} {
{{#if.fields}}{{fields}}{{/if}}}`,
        variables: [
          {
            name: 'annotations',
            type: 'array',
            required: false,
            description: 'Struct annotations',
          },
          {
            name: 'derive',
            type: 'string',
            required: false,
            description: 'Derive macros',
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Struct name',
          },
          {
            name: 'fields',
            type: 'string',
            required: false,
            description: 'Struct fields',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      struct: {
        template: `{{#if.annotations}}{{annotations}}
{{/if}}{{#if.derive}}#[derive({{derive}})]
{{/if}}pub struct {{name}} {
{{#if.fields}}{{fields}}{{/if}}}`,
        variables: [
          {
            name: 'annotations',
            type: 'array',
            required: false,
            description: 'Struct annotations',
          },
          {
            name: 'derive',
            type: 'string',
            required: false,
            description: 'Derive macros',
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Struct name',
          },
          {
            name: 'fields',
            type: 'string',
            required: false,
            description: 'Struct fields',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      property: {
        template: '    {{name}}: {{type}},{{#if.comment}} // {{comment}}{{/if}}',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Field name',
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Field type',
          },
          {
            name: 'comment',
            type: 'string',
            required: false,
            description: 'Field comment',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
      field: {
        template: '    {{name}}: {{type}},{{#if.comment}} // {{comment}}{{/if}}',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Field name',
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Field type',
          },
          {
            name: 'comment',
            type: 'string',
            required: false,
            description: 'Field comment',
          },
        ],
        conditions: [],
        loops: [],
        placeholders: [],
      },
    }),
    settings: {
      namingConvention: {
        caseStyle: 'PascalCase',
        abbreviations: {
          id: 'Id',
          url: 'Url',
          uri: 'Uri',
        },
        reservedWords: ['type', 'struct', 'impl', 'fn', 'let', 'mut', 'const', 'use'],
      },
      indentStyle: { type: 'spaces', size: 4 },
      lineWidth: 100,
      generateComments: true,
      generateConstructors: false,
      generateGettersSetters: false,
      generateValidation: false,
      includeTypeImports: false,
      useStrictTyping: false,
      privateProperties: false,
      generateDocumentation: true,
      fileHeader: '// Code generated by JSON Tools Platform\n',
      lineEnding: 'lf',
      encoding: 'utf8',
    },
    dependencies: [],
  },
};

// Template engine
export class TemplateEngine {
  private templates: Record<string, CodeTemplate>;

  constructor() {
    this.templates = { ...BUILTIN_TEMPLATES };
  }

  /**
   * Register a new template
   */
  registerTemplate(template: CodeTemplate): void {
    this.templates[template.language.toLowerCase()] = template;
  }

  /**
   * Get template by language
   */
  getTemplate(language: string): CodeTemplate | undefined {
    return this.templates[language.toLowerCase()];
  }

  /**
   * Process a template with context
   */
  processTemplate(template: TemplateDefinition | string, context: CodeGenerationContext): string {
    const templateDef: TemplateDefinition =
      typeof template === 'string'
        ? {
            template,
            variables: [],
            conditions: [],
            loops: [],
            placeholders: [],
          }
        : template;

    let result = templateDef.template;

    // Process conditions
    for (const condition of templateDef.conditions || []) {
      const shouldInclude = this.evaluateCondition(condition, context);
      if (shouldInclude) {
        result = result.replace(
          new RegExp(
            `{{#${condition.variable}}}}[^{{#${condition.variable}}}*{{#${condition.variable}}}`,
            'gs'
          ),
          condition.template
        );
      } else {
        result = result.replace(
          new RegExp(
            `{{#${condition.variable}}[^{{#${condition.variable}}}*{{#${condition.variable}}}`,
            'gs'
          ),
          ''
        );
      }
    }

    // Process loops
    for (const loop of templateDef.loops || []) {
      const array = this.getValue(loop.variable, context);
      if (Array.isArray(array) && array.length > 0) {
        const loopResult = array
          .map((item, index) => {
            return this.processTemplate(loop.template, {
              ...context,
              templateData: {
                ...context.templateData,
                item,
                index,
                first: index === 0,
                last: index === array.length - 1,
              },
            });
          })
          .join(loop.separator || '');

        const emptyTemplate = loop.emptyTemplate || '';
        result = result.replace(
          new RegExp(`{{@${loop.variable}}}}.*{{/@${loop.variable}}}`, 'gs'),
          array.length > 0 ? loopResult : emptyTemplate
        );
      }
    }

    // Process simple variables
    result = result.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
      const value = this.getValue(varName, context);
      return value !== undefined ? String(value) : '';
    });

    // Process placeholders
    for (const placeholder of templateDef.placeholders || []) {
      result = result.replace(placeholder.pattern, (match, ...args) => {
        if (typeof placeholder.replacement === 'function') {
          const matches = [match, ...args] as unknown as RegExpMatchArray;
          return placeholder.replacement(matches, context);
        }
        return placeholder.replacement;
      });
    }

    return result;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: TemplateCondition, context: CodeGenerationContext): boolean {
    const value = this.getValue(condition.variable, context);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return Array.isArray(value)
          ? value.includes(condition.value)
          : String(value).includes(String(condition.value));
      case 'not_contains':
        return Array.isArray(value)
          ? !value.includes(condition.value)
          : !String(value).includes(String(condition.value));
      case 'empty':
        return (
          !value || (Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0)
        );
      case 'not_empty':
        return (
          Boolean(value) &&
          (!Array.isArray(value) || value.length > 0) &&
          (typeof value !== 'object' || value === null || Object.keys(value).length > 0)
        );
      default:
        return false;
    }
  }

  /**
   * Get value from context
   */
  private getValue(path: string, context: CodeGenerationContext): any {
    const parts = path.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
      }
    }

    return value;
  }

  /**
   * Get all registered templates
   */
  getTemplates(): Record<string, CodeTemplate> {
    return { ...this.templates };
  }
}

// Type inference utilities
export class TypeInferrer {
  /**
   * Infer JSON type from value
   */
  inferType(value: any): string {
    if (value === null || value === undefined) {
      return 'any';
    }

    if (Array.isArray(value)) {
      const elementTypes = new Set(value.map((item) => this.inferType(item)));
      return `Array<${
        elementTypes.size === 1
          ? Array.from(elementTypes)[0]
          : `(${Array.from(elementTypes).join(' | ')})`
      }>`;
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return 'Date';
      }
      return 'object';
    }

    switch (typeof value) {
      case 'string':
        // Check for special string patterns
        if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          return 'DateTime';
        }
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return 'Date';
        }
        if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          return 'UUID';
        }
        return 'string';
      case 'number':
        if (Number.isInteger(value)) {
          return 'integer';
        }
        return 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'unknown';
    }
  }

  /**
   * Infer language-specific type
   */
  inferLanguageType(value: any, language: string): string {
    const baseType = this.inferType(value);

    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        return this.mapToTypeScriptType(baseType);
      case 'python':
        return this.mapToPythonType(baseType);
      case 'go':
        return this.mapToGoType(baseType);
      case 'rust':
        return this.mapToRustType(baseType);
      case 'java':
        return this.mapToJavaType(baseType);
      case 'c#':
      case 'csharp':
        return this.mapToCSharpType(baseType);
      case 'c++':
      case 'cpp':
        return this.mapToCppType(baseType);
      case 'swift':
        return this.mapToSwiftType(baseType);
      case 'kotlin':
        return this.mapToKotlinType(baseType);
      case 'php':
        return this.mapToPHPType(baseType);
      default:
        return baseType;
    }
  }

  private mapToTypeScriptType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      integer: 'number',
      boolean: 'boolean',
      Date: 'Date',
      DateTime: 'Date',
      object: 'object',
      any: 'any',
      unknown: 'any',
    };
    return typeMap[type] || 'any';
  }

  private mapToPythonType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'str',
      number: 'float',
      integer: 'int',
      boolean: 'bool',
      Date: 'datetime.datetime',
      DateTime: 'datetime.datetime',
      object: 'dict',
      any: 'Any',
    };
    return typeMap[type] || 'Any';
  }

  private mapToGoType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'float64',
      integer: 'int',
      boolean: 'bool',
      Date: 'time.Time',
      DateTime: 'time.Time',
      object: 'interface{}',
      any: 'interface{}',
    };
    return typeMap[type] || 'interface{}';
  }

  private mapToRustType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'String',
      number: 'f64',
      integer: 'i64',
      boolean: 'bool',
      Date: 'chrono::DateTime<chrono::Utc>',
      DateTime: 'chrono::DateTime<chrono::Utc>',
      object: 'serde_json::Value',
      any: 'serde_json::Value',
    };
    return typeMap[type] || 'serde_json::Value';
  }

  private mapToJavaType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'String',
      number: 'Double',
      integer: 'Integer',
      boolean: 'Boolean',
      Date: 'LocalDateTime',
      DateTime: 'LocalDateTime',
      object: 'Object',
      any: 'Object',
    };
    return typeMap[type] || 'Object';
  }

  private mapToCSharpType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'double',
      integer: 'int',
      boolean: 'bool',
      Date: 'DateTime',
      DateTime: 'DateTime',
      object: 'object',
      any: 'object',
    };
    return typeMap[type] || 'object';
  }

  private mapToCppType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'std::string',
      number: 'double',
      integer: 'int64_t',
      boolean: 'bool',
      Date: 'std::chrono::system_clock::time_point',
      DateTime: 'std::chrono::system_clock::time_point',
      object: 'nlohmann::json',
      any: 'nlohmann::json',
    };
    return typeMap[type] || 'nlohmann::json';
  }

  private mapToSwiftType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'String',
      number: 'Double',
      integer: 'Int',
      boolean: 'Bool',
      Date: 'Date',
      DateTime: 'Date',
      object: 'Any',
      any: 'Any',
    };
    return typeMap[type] || 'Any';
  }

  private mapToKotlinType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'String',
      number: 'Double',
      integer: 'Int',
      boolean: 'Boolean',
      Date: 'LocalDateTime',
      DateTime: 'LocalDateTime',
      object: 'Any',
      any: 'Any',
    };
    return typeMap[type] || 'Any';
  }

  private mapToPHPType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'float',
      integer: 'int',
      boolean: 'bool',
      Date: 'DateTime',
      DateTime: 'DateTime',
      object: 'array',
      any: 'mixed',
    };
    return typeMap[type] || 'mixed';
  }
}

// Naming convention utilities
export class NamingConvention {
  private options: NamingConventionOptions;

  constructor(options: Partial<NamingConventionOptions> = {}) {
    this.options = {
      caseStyle: 'PascalCase',
      abbreviations: {},
      reservedWords: [],
      ...options,
    };
  }

  /**
   * Convert string according to naming convention
   */
  convert(str: string, options: Partial<NamingConventionOptions> = {}): string {
    if (!str) return str;

    const resolvedOptions = {
      ...this.options,
      ...options,
    };

    let result = this.handleAbbreviations(str, resolvedOptions.abbreviations);

    switch (resolvedOptions.caseStyle) {
      case 'camelCase':
        result = result
          .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
          .replace(/^./, (char) => char.toLowerCase());
        break;
      case 'PascalCase':
        result = result
          .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
          .replace(/^./, (char) => char.toUpperCase());
        break;
      case 'snake_case':
        result = result
          .replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
          .replace(/^[_\s-]+/, '');
        break;
      case 'kebab-case':
        result = result
          .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
          .replace(/^[_\s-]+/, '');
        break;
      case 'UPPER_CASE':
        result = result.replace(/[a-z]/g, (char) => char.toUpperCase()).replace(/[_\s-]+/, '_');
        break;
      case 'lowercase':
        result = result.toLowerCase();
        break;
    }

    if (resolvedOptions.reservedWords.includes(result)) {
      result = resolvedOptions.prefix ? `${resolvedOptions.prefix}${result}` : `_${result}`;
    }

    if (resolvedOptions.suffix) {
      result = `${result}${resolvedOptions.suffix}`;
    }

    return result;
  }

  /**
   * Handle abbreviation conversion
   */
  private handleAbbreviations(
    str: string,
    abbreviations: Record<string, string> = this.options.abbreviations
  ): string {
    let result = str;

    for (const [abbr, full] of Object.entries(abbreviations || {})) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      result = result.replace(regex, full);
    }

    return result;
  }
}

// Code generation utilities
export class CodeGenerator {
  private templateEngine: TemplateEngine;
  private typeInferrer: TypeInferrer;
  private namingConvention: NamingConvention;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.typeInferrer = new TypeInferrer();
    this.namingConvention = new NamingConvention();
  }

  /**
   * Generate code from JSON data
   */
  generateCode(data: any, language: string, options: Partial<CodeGenerationSettings> = {}): string {
    const template = this.templateEngine.getTemplate(language);
    if (!template) {
      throw new Error(`Template not found for language: ${language}`);
    }

    const settings: CodeGenerationSettings = {
      ...template.settings,
      ...options,
    };

    const className =
      settings.namingConvention.caseStyle === 'PascalCase'
        ? this.namingConvention.convert('rootObject')
        : this.namingConvention.convert('rootObject');

    const context: CodeGenerationContext = {
      data,
      className,
      imports: [],
      generatedClasses: [],
      currentDepth: 0,
      options: settings,
      templateData: {},
      metadata: {
        timestamp: new Date(),
        source: 'JSON',
        language,
        version: template.version,
        template: template.name,
        generationTime: 0,
        linesGenerated: 0,
        charactersGenerated: 0,
      },
    };

    // Generate class definition
    const classDefinition = this.generateClassDefinition(data, className, template, context);

    // Process the template
    let code = this.templateEngine.processTemplate(classDefinition, context);

    // Add line endings
    code = this.addLineEndings(code, settings.lineEnding);

    // Add file header if specified
    if (settings.fileHeader) {
      code = `${settings.fileHeader}\n${code}`;
    }

    // Update metadata
    context.metadata.generationTime = performance.now() - context.metadata.timestamp.getTime();
    context.metadata.linesGenerated = code.split('\n').length;
    context.metadata.charactersGenerated = code.length;

    return code;
  }

  /**
   * Generate class definition
   */
  private generateClassDefinition(
    data: any,
    className: string,
    template: CodeTemplate,
    context: CodeGenerationContext
  ): string {
    const properties = this.extractProperties(data);
    const methods = this.generateMethods(data, context);

    // Generate property definitions
    const propertyDefinitions = properties
      .map((prop) => {
        const typeInfo = this.typeInferrer.inferLanguageType(prop.value, template.language);
        const { type: originalType, ...propertyData } = prop;
        const templateVar = {
          ...propertyData,
          name: this.namingConvention.convert(prop.key),
          type: typeInfo || originalType,
          defaultValue: prop.defaultValue,
          description: prop.description,
          annotations: prop.annotations || [],
          isOptional: prop.optional,
        };

        return this.templateEngine.processTemplate(template.templates.property, {
          ...context,
          templateData: templateVar,
        });
      })
      .join('\n');

    // Generate method definitions
    const methodDefinitions = methods
      .map((method) => {
        return this.templateEngine.processTemplate(template.templates.method?.template || '', {
          ...context,
          templateData: method,
        });
      })
      .join('\n\n');

    // Build the class template
    const classTemplate = template.templates.class.template;

    return this.templateEngine.processTemplate(classTemplate, {
      ...context,
      templateData: {
        className,
        properties: propertyDefinitions,
        methods: methodDefinitions,
        extends: context.parentClass,
        implements: context.implements,
      },
    });
  }

  /**
   * Extract properties from JSON data
   */
  private extractProperties(data: any): Array<{
    key: string;
    value: any;
    type: string;
    optional: boolean;
    defaultValue?: string;
    description?: string;
    annotations: string[];
  }> {
    const properties: Array<{
      key: string;
      value: any;
      type: string;
      optional: boolean;
      defaultValue?: string;
      description?: string;
      annotations: string[];
    }> = [];

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        properties.push({
          key,
          value,
          type: this.typeInferrer.inferType(value),
          optional: value === null || value === undefined,
          defaultValue: value === null ? 'null' : value === undefined ? 'undefined' : undefined,
          annotations: [],
          description: '',
        });
      }
    }

    return properties;
  }

  /**
   * Generate methods for the class
   */
  private generateMethods(
    data: any,
    context: CodeGenerationContext
  ): Array<{
    name: string;
    returnType: string;
    parameters: Array<{
      name: string;
      type: string;
      optional: boolean;
      defaultValue?: string;
      description?: string;
    }>;
    body: string;
    annotations: string[];
    visibility: string;
    isStatic: boolean;
    description?: string;
  }> {
    const methods: Array<{
      name: string;
      returnType: string;
      parameters: Array<{
        name: string;
        type: string;
        optional: boolean;
        defaultValue?: string;
        description?: string;
      }>;
      body: string;
      annotations: string[];
      visibility: string;
      isStatic: boolean;
      description?: string;
    }> = [];

    // Generate constructor if needed
    if (context.options.generateConstructors) {
      const constructorMethod = this.generateConstructor(data, context);
      methods.push(constructorMethod);
    }

    // Generate getters and setters if needed
    if (context.options.generateGettersSetters) {
      const getterSetterMethods = this.generateGettersSetters(data, context);
      methods.push(...getterSetterMethods);
    }

    return methods;
  }

  /**
   * Generate constructor method
   */
  private generateConstructor(
    data: any,
    context: CodeGenerationContext
  ): {
    name: string;
    returnType: string;
    parameters: Array<{
      name: string;
      type: string;
      optional: boolean;
      defaultValue?: string;
      description?: string;
    }>;
    body: string;
    annotations: string[];
    visibility: string;
    isStatic: boolean;
    description?: string;
  } {
    const properties = this.extractProperties(data);
    const requiredProps = properties.filter((prop) => !prop.optional);

    const parameters = requiredProps.map((prop) => ({
      name: this.namingConvention.convert(prop.key),
      type: this.typeInferrer.inferLanguageType(prop.value, context.metadata.language),
      optional: false,
      description: prop.description,
    }));

    const body = requiredProps
      .map(
        (prop) =>
          `    this.${this.namingConvention.convert(prop.key)} = ${this.namingConvention.convert(prop.key)};`
      )
      .join('\n');

    return {
      name: 'constructor',
      returnType: 'void',
      parameters,
      body,
      annotations: [],
      visibility: 'public',
      isStatic: false,
      description: 'Constructor',
    };
  }

  /**
   * Generate getters and setters
   */
  private generateGettersSetters(
    data: any,
    context: CodeGenerationContext
  ): Array<{
    name: string;
    returnType: string;
    parameters: Array<{
      name: string;
      type: string;
      optional: boolean;
      defaultValue?: string;
      description?: string;
    }>;
    body: string;
    annotations: string[];
    visibility: string;
    isStatic: boolean;
    description?: string;
  }> {
    const methods: Array<{
      name: string;
      returnType: string;
      parameters: Array<{
        name: string;
        type: string;
        optional: boolean;
        defaultValue?: string;
        description?: string;
      }>;
      body: string;
      annotations: string[];
      visibility: string;
      isStatic: boolean;
      description?: string;
    }> = [];

    const properties = this.extractProperties(data);

    for (const prop of properties) {
      const propName = this.namingConvention.convert(prop.key);
      const propType = this.typeInferrer.inferLanguageType(prop.value, context.metadata.language);

      // Generate getter
      methods.push({
        name: `get${this.namingConvention.convert(prop.key, { caseStyle: 'PascalCase' })}`,
        returnType: propType,
        parameters: [],
        body: `    return this.${propName};`,
        annotations: [],
        visibility: 'public',
        isStatic: false,
        description: `Get ${prop.key}`,
      });

      // Generate setter if not read-only
      if (!prop.annotations?.includes('@readonly')) {
        methods.push({
          name: `set${this.namingConvention.convert(prop.key, { caseStyle: 'PascalCase' })}`,
          returnType: 'void',
          parameters: [
            {
              name: 'value',
              type: propType,
              optional: false,
              description: `Value to set for ${prop.key}`,
            },
          ],
          body: `    this.${propName} = value;`,
          annotations: [],
          visibility: 'public',
          isStatic: false,
          description: `Set ${prop.key}`,
        });
      }
    }

    return methods;
  }

  /**
   * Add line endings to code
   */
  private addLineEndings(code: string, lineEnding: string): string {
    switch (lineEnding) {
      case 'crlf':
        return code.replace(/\n/g, '\r\n');
      case 'cr':
        return code.replace(/\n/g, '\r');
      default:
        return code;
    }
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): string[] {
    return Object.keys(this.templateEngine.getTemplates());
  }

  /**
   * Register custom template
   */
  registerTemplate(template: CodeTemplate): void {
    this.templateEngine.registerTemplate(template);
  }

  /**
   * Update template engine settings
   */
  updateTemplateEngine(templateEngine: TemplateEngine): void {
    this.templateEngine = templateEngine;
  }
}

// Convenience functions for common operations
export function generateCodeFromJSON(
  jsonData: string,
  language: string,
  options?: Partial<CodeGenerationSettings>
): string {
  const generator = new CodeGenerator();
  const data = JSON.parse(jsonData);
  return generator.generateCode(data, language, options);
}

export function generateMultipleLanguages(
  jsonData: string,
  languages: string[],
  options?: Partial<CodeGenerationSettings>
): Record<string, string> {
  const generator = new CodeGenerator();
  const data = JSON.parse(jsonData);

  const results: Record<string, string> = {};

  for (const language of languages) {
    try {
      results[language] = generator.generateCode(data, language, options);
    } catch (error) {
      results[language] =
        `// Error generating ${language}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  return results;
}

// Export default generator instance
export const defaultGenerator = new CodeGenerator();
