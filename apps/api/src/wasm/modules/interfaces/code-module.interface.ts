import { IWasmModule, WasmModuleResult, WasmModuleConfig } from './wasm-module.interface'

/**
 * Interface for code execution WASM modules
 */
export interface ICodeWasmModule extends IWasmModule {
  /**
   * Execute code in a sandboxed environment
   */
  executeCode(code: string, options?: CodeExecutionOptions): Promise<WasmModuleResult>

  /**
   * Format code according to language-specific rules
   */
  formatCode(code: string, language: SupportedLanguage, options?: CodeFormatOptions): Promise<WasmModuleResult>

  /**
   * Lint code to find potential issues
   */
  lintCode(code: string, language: SupportedLanguage, options?: CodeLintOptions): Promise<WasmModuleResult>

  /**
   * Transpile code from one language to another
   */
  transpileCode(code: string, from: SupportedLanguage, to: SupportedLanguage, options?: CodeTranspileOptions): Promise<WasmModuleResult>

  /**
   * Minify code to reduce size
   */
  minifyCode(code: string, language: SupportedLanguage, options?: CodeMinifyOptions): Promise<WasmModuleResult>

  /**
   * Validate code syntax
   */
  validateSyntax(code: string, language: SupportedLanguage): Promise<WasmModuleResult>

  /**
   * Extract code metadata and structure
   */
  analyzeCode(code: string, language: SupportedLanguage): Promise<WasmModuleResult>

  /**
   * Generate code from templates or specifications
   */
  generateCode(template: CodeTemplate, parameters: Record<string, any>): Promise<WasmModuleResult>

  /**
   * Refactor code according to specified patterns
   */
  refactorCode(code: string, language: SupportedLanguage, refactoring: CodeRefactoring): Promise<WasmModuleResult>

  /**
   * Obfuscate code to protect intellectual property
   */
  obfuscateCode(code: string, language: SupportedLanguage, options?: CodeObfuscateOptions): Promise<WasmModuleResult>

  /**
   * Deobfuscate previously obfuscated code
   */
  deobfuscateCode(code: string, language: SupportedLanguage): Promise<WasmModuleResult>
}

/**
 * Supported programming languages
 */
export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'swift'
  | 'kotlin'
  | 'scala'
  | 'haskell'
  | 'lua'
  | 'sql'
  | 'html'
  | 'css'
  | 'scss'
  | 'less'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'markdown'
  | 'bash'
  | 'powershell'
  | 'dockerfile'

/**
 * Code execution options
 */
export interface CodeExecutionOptions {
  /**
   * Execution timeout in milliseconds
   */
  timeout?: number

  /**
   * Maximum memory allocation in bytes
   */
  maxMemory?: number

  /**
   * Command line arguments
   */
  args?: string[]

  /**
   * Environment variables
   */
  env?: Record<string, string>

  /**
   * Working directory
   */
  workingDirectory?: string

  /**
   * Standard input
   */
  stdin?: string

  /**
   * Whether to capture stdout
   */
  captureStdout?: boolean

  /**
   * Whether to capture stderr
   */
  captureStderr?: boolean

  /**
   * Whether to allow network access
   */
  allowNetwork?: boolean

  /**
   * Whether to allow file system access
   */
  allowFileSystem?: boolean

  /**
   * Security sandbox level
   */
  sandboxLevel?: 'none' | 'basic' | 'strict' | 'maximum'

  /**
   * Whether to run in debug mode
   */
  debug?: boolean

  /**
   * Profiling options
   */
  profiling?: {
    enabled: boolean
    sampleRate?: number
    includeMemory?: boolean
    includeCpu?: boolean
  }
}

/**
 * Code formatting options
 */
export interface CodeFormatOptions {
  /**
   * Indentation style
   */
  indentStyle?: 'spaces' | 'tabs'

  /**
   * Number of spaces for indentation
   */
  indentSize?: number

  /**
   * Maximum line length
   */
  maxLineLength?: number

  /**
   * Quote style for strings
   */
  quoteStyle?: 'single' | 'double' | 'auto'

  /**
   * Semicolon style
   */
  semicolonStyle?: 'always' | 'never' | 'as-needed'

  /**
   * Trailing comma style
   */
  trailingComma?: 'none' | 'es5' | 'all'

  /**
   * Bracket spacing
   */
  bracketSpacing?: boolean

  /**
   * Arrow function parentheses
   */
  arrowParens?: 'always' | 'as-needed'

  /**
   * End of line character
   */
  endOfLine?: 'lf' | 'crlf' | 'cr'

  /**
   * Whether to format JSX/HTML
   */
  formatJsx?: boolean

  /**
   * Custom formatting rules
   */
  rules?: Record<string, any>

  /**
   * Preset configuration
   */
  preset?: string
}

/**
 * Code linting options
 */
export interface CodeLintOptions {
  /**
   * Linting rules to apply
   */
  rules?: Record<string, 'off' | 'warn' | 'error'>

  /**
   * Configuration file to use
   */
  configFile?: string

  /**
   * Environment settings
   */
  env?: {
    browser?: boolean
    node?: boolean
    es6?: boolean
    jest?: boolean
    mocha?: boolean
  }

  /**
   * Global variables
   */
  globals?: Record<string, boolean>

  /**
   * Whether to fix auto-fixable issues
   */
  fix?: boolean

  /**
   * Maximum number of warnings
   */
  maxWarnings?: number

  /**
   * Files to ignore
   */
  ignorePatterns?: string[]

  /**
   * Custom parser options
   */
  parserOptions?: Record<string, any>
}

/**
 * Code transpilation options
 */
export interface CodeTranspileOptions {
  /**
   * Target version/standard
   */
  target?: string

  /**
   * Source map generation
   */
  sourceMap?: boolean

  /**
   * Whether to include comments
   */
  comments?: boolean

  /**
   * Module system
   */
  module?: 'none' | 'commonjs' | 'amd' | 'umd' | 'es6' | 'es2015' | 'es2020' | 'es2022'

  /**
   * Loose mode for compatibility
   */
  loose?: boolean

  /**
   * Whether to use external helpers
   */
  externalHelpers?: boolean

  /**
   * Custom plugins
   */
  plugins?: string[]

  /**
   * Custom presets
   */
  presets?: string[]

  /**
   * Minify output
   */
  minify?: boolean
}

/**
 * Code minification options
 */
export interface CodeMinifyOptions {
  /**
   * Compression level
   */
  level?: number

  /**
   * Whether to remove comments
   */
  removeComments?: boolean

  /**
   * Whether to remove whitespace
   */
  removeWhitespace?: boolean

  /**
   * Whether to mangle variable names
   */
  mangle?: boolean

  /**
   * Whether to compress code
   */
  compress?: boolean

  /**
   * Reserved names to not mangle
   */
  reserved?: string[]

  /**
   * Whether to preserve function names
   */
  keepFunctionNames?: boolean

  /**
   * Whether to preserve line numbers
   */
  keepLineNumbers?: boolean

  /**
   * Source map generation
   */
  sourceMap?: boolean
}

/**
 * Code template interface
 */
export interface CodeTemplate {
  /**
   * Template identifier
   */
  id: string

  /**
   * Template name
   */
  name: string

  /**
   * Template description
   */
  description: string

  /**
   * Target language
   */
  language: SupportedLanguage

  /**
   * Template content with placeholders
   */
  template: string

  /**
   * Parameter definitions
   */
  parameters: TemplateParameter[]

  /**
   * Template category
   */
  category: string

  /**
   * Template tags
   */
  tags: string[]
}

/**
 * Template parameter definition
 */
export interface TemplateParameter {
  /**
   * Parameter name
   */
  name: string

  /**
   * Parameter description
   */
  description: string

  /**
   * Parameter type
   */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'

  /**
   * Default value
   */
  defaultValue?: any

  /**
   * Whether parameter is required
   */
  required: boolean

  /**
   * Validation rules
   */
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: string[]
  }

  /**
   * Example values
   */
  examples?: any[]
}

/**
 * Code refactoring specification
 */
export interface CodeRefactoring {
  /**
   * Type of refactoring
   */
  type: RefactoringType

  /**
   * Target scope (function, class, file, project)
   */
  scope: RefactoringScope

  /**
   * Refactoring parameters
   */
  parameters: Record<string, any>

  /**
   * Whether to create backup
   */
  backup?: boolean

  /**
   * Dry run mode (don't actually change code)
   */
  dryRun?: boolean
}

/**
 * Refactoring types
 */
export type RefactoringType =
  | 'extract-function'
  | 'extract-variable'
  | 'extract-constant'
  | 'inline-function'
  | 'inline-variable'
  | 'rename-symbol'
  | 'move-symbol'
  | 'change-signature'
  | 'introduce-parameter'
  | 'remove-parameter'
  | 'encapsulate-field'
  | 'introduce-field'
  | 'pull-up-method'
  | 'push-down-method'
  | 'extract-interface'
  | 'extract-superclass'
  | 'remove-conditional'
  | 'introduce-polymorphism'
  | 'split-conditional'
  | 'replace-conditional-with-polymorphism'
  | 'introduce-null-object'
  | 'replace-magic-number'
  | 'replace-type-code'
  | 'replace-conditional-with-guard-clauses'
  | 'replace-nested-conditional-with-guard-clauses'
  | 'replace-conditional-expression'
  | 'decompose-conditional'

/**
 * Refactoring scope
 */
export type RefactoringScope =
  | 'selection'
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'file'
  | 'module'
  | 'package'
  | 'project'

/**
 * Code obfuscation options
 */
export interface CodeObfuscateOptions {
  /**
   * Obfuscation level
   */
  level?: number

  /**
   * Whether to rename variables
   */
  renameVariables?: boolean

  /**
   * Whether to rename functions
   */
  renameFunctions?: boolean

  /**
   * Whether to rename classes
   */
  renameClasses?: boolean

  /**
   * Whether to insert dead code
   */
  insertDeadCode?: boolean

  /**
   * Whether to encode strings
   */
  encodeStrings?: boolean

  /**
   * Whether to flatten control flow
   */
  flattenControlFlow?: boolean

  /**
   * Whether to use self-defending code
   */
  selfDefending?: boolean

  /**
   * Reserved names to not obfuscate
   */
  reservedNames?: string[]

  /**
   * Seed for randomization
   */
  seed?: number

  /**
   * Whether to generate source map
   */
  sourceMap?: boolean
}

/**
 * Code analysis result
 */
export interface CodeAnalysisResult {
  /**
   * Language detected
   */
  language: SupportedLanguage

  /**
   * File size in bytes
   */
  size: number

  /**
   * Line count
   */
  lineCount: number

  /**
   * Character count
   */
  charCount: number

  /**
   * Token count
   */
  tokenCount: number

  /**
   * Complexity metrics
   */
  complexity: {
    cyclomaticComplexity: number
    cognitiveComplexity: number
    halsteadVolume: number
    maintainabilityIndex: number
  }

  /**
   * Structure analysis
   */
  structure: {
    functions: FunctionInfo[]
    classes: ClassInfo[]
    imports: ImportInfo[]
    exports: ExportInfo[]
    variables: VariableInfo[]
  }

  /**
   * Dependencies
   */
  dependencies: DependencyInfo[]

  /**
   * Security issues found
   */
  securityIssues: SecurityIssue[]

  /**
   * Performance issues found
   */
  performanceIssues: PerformanceIssue[]

  /**
   * Code quality metrics
   */
  quality: {
    duplicatedLines: number
    duplicationPercentage: number
    testCoverage?: number
    technicalDebt: string
  }

  /**
   * Metrics collection info
   */
  metrics: {
    analysisTime: number
    memoryUsage: number
  }
}

/**
 * Function information
 */
export interface FunctionInfo {
  name: string
  line: number
  parameters: string[]
  returnType?: string
  complexity: number
  isAsync: boolean
  isGenerator: boolean
}

/**
 * Class information
 */
export interface ClassInfo {
  name: string
  line: number
  methods: FunctionInfo[]
  properties: VariableInfo[]
  extends?: string
  implements?: string[]
  isAbstract: boolean
}

/**
 * Import information
 */
export interface ImportInfo {
  module: string
  name: string
  line: number
  type: 'default' | 'named' | 'namespace'
  isUsed: boolean
}

/**
 * Export information
 */
export interface ExportInfo {
  name: string
  line: number
  type: 'default' | 'named'
  isReExport: boolean
}

/**
 * Variable information
 */
export interface VariableInfo {
  name: string
  line: number
  type?: string
  isConst: boolean
  isUsed: boolean
  scope: string
}

/**
 * Dependency information
 */
export interface DependencyInfo {
  name: string
  version?: string
  type: 'production' | 'development' | 'peer' | 'optional'
  used: boolean
}

/**
 * Security issue information
 */
export interface SecurityIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  line: number
  description: string
  recommendation: string
  cve?: string
}

/**
 * Performance issue information
 */
export interface PerformanceIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  line: number
  description: string
  impact: string
  recommendation: string
}
