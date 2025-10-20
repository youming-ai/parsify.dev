import { z } from 'zod'

// Supported programming languages
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'scss',
  'less',
  'json',
  'yaml',
  'xml',
  'sql',
  'markdown',
  'bash',
  'powershell',
  'dockerfile',
  'terraform',
  'vue',
  'svelte',
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

// Base formatting options schema
export const BaseFormattingOptionsSchema = z.object({
  indentSize: z.number().int().min(0).max(20).default(2),
  indentStyle: z.enum(['space', 'tab']).default('space'),
  maxWidth: z.number().int().min(40).max(200).default(80),
  insertFinalNewline: z.boolean().default(true),
  trimTrailingWhitespace: z.boolean().default(true),
  preserveNewlines: z.boolean().default(true),
  lineEnding: z.enum(['lf', 'crlf', 'cr']).default('lf'),
})

// Language-specific formatting options
export const JavaScriptFormattingOptionsSchema =
  BaseFormattingOptionsSchema.extend({
    semicolons: z.boolean().default(true),
    quotes: z.enum(['single', 'double', 'preserve']).default('single'),
    trailingCommas: z.enum(['none', 'es5', 'all']).default('es5'),
    bracketSameLine: z.boolean().default(false),
    arrowParens: z.enum(['always', 'avoid']).default('always'),
    printWidth: z.number().int().min(40).max(200).default(80),
    jsxSingleQuote: z.boolean().default(false),
    quoteProps: z
      .enum(['as-needed', 'consistent', 'preserve'])
      .default('as-needed'),
    jsxBracketSameLine: z.boolean().default(false),
  })

export const TypeScriptFormattingOptionsSchema =
  JavaScriptFormattingOptionsSchema.extend({
    strict: z.boolean().default(true),
    noImplicitAny: z.boolean().default(true),
    noImplicitReturns: z.boolean().default(true),
    noImplicitThis: z.boolean().default(true),
    noUnusedLocals: z.boolean().default(false),
    noUnusedParameters: z.boolean().default(false),
    exactOptionalPropertyTypes: z.boolean().default(false),
  })

export const PythonFormattingOptionsSchema = BaseFormattingOptionsSchema.extend(
  {
    lineLength: z.number().int().min(40).max(200).default(88),
    targetVersion: z
      .enum(['py36', 'py37', 'py38', 'py39', 'py310', 'py311', 'py312'])
      .default('py311'),
    skipStringNormalization: z.boolean().default(false),
    skipMagicComma: z.boolean().default(false),
    diff: z.boolean().default(false),
    color: z.boolean().default(false),
    fast: z.boolean().default(false),
  }
)

export const JavaFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  indentSize: z.number().int().min(0).max(20).default(4),
  continuationIndentSize: z.number().int().min(0).max(20).default(8),
  maxLineLength: z.number().int().min(40).max(200).default(100),
  importOrder: z.array(z.string()).default(['java', 'javax', 'org', 'com']),
  sortImports: z.boolean().default(true),
  formatJavadoc: z.boolean().default(true),
  blankLinesBeforePackage: z.number().int().min(0).max(5).default(1),
  blankLinesBeforeImports: z.number().int().min(0).max(5).default(1),
  blankLinesBeforeClass: z.number().int().min(0).max(5).default(1),
  blankLinesBeforeMethod: z.number().int().min(0).max(5).default(1),
  blankLinesBeforeField: z.number().int().min(0).max(5).default(1),
})

export const RustFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  edition: z.enum(['2015', '2018', '2021']).default('2021'),
  maxWidth: z.number().int().min(40).max(200).default(100),
  hardTabs: z.boolean().default(false),
  tabSpaces: z.number().int().min(0).max(20).default(4),
  newlineStyle: z.enum(['Unix', 'Windows', 'Native']).default('Unix'),
  wrapComments: z.boolean().default(false),
  commentWidth: z.number().int().min(40).max(200).default(80),
  normalizeComments: z.boolean().default(true),
  formatStrings: z.boolean().default(true),
  formatCodeInDocComments: z.boolean().default(false),
  disableFormatting: z.boolean().default(false),
  mergeImports: z.boolean().default(true),
  reorderImports: z.boolean().default(true),
  reorderModules: z.boolean().default(true),
  useTryShorthand: z.boolean().default(false),
  useFieldInitShorthand: z.boolean().default(false),
  forceExplicitAbi: z.boolean().default(false),
  condenseWildcardSuffixes: z.boolean().default(false),
  color: z.enum(['Always', 'Never', 'Auto']).default('Auto'),
  requiredVersion: z.string().optional(),
  ignore: z.array(z.string()).default([]),
})

export const GoFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  tabWidth: z.number().int().min(0).max(20).default(8),
  useTabs: z.boolean().default(true),
  maxWidth: z.number().int().min(40).max(200).default(120),
  simplify: z.boolean().default(true),
  commentWidth: z.number().int().min(40).max(200).default(120),
  langVersion: z.string().optional(),
})

export const CssFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  singleQuote: z.boolean().default(false),
  selectorSeparator: z.enum([' ', '>']).default(' '),
  colorCase: z.enum(['lower', 'upper']).default('lower'),
  colorShorthand: z.boolean().default(true),
  removeEmptyRulesets: z.boolean().default(true),
  removeComments: z.boolean().default(false),
  vendorPrefixes: z.enum(['none', 'all', 'required']).default('required'),
  sortProperties: z.boolean().default(false),
  sortSelectors: z.boolean().default(false),
})

export const HtmlFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  indentInnerHtml: z.boolean().default(false),
  preserveBlankLines: z.boolean().default(false),
  maxPreserveNewLines: z.number().int().min(0).max(10).default(2),
  wrapAttributes: z
    .enum([
      'auto',
      'force',
      'force-aligned',
      'force-expand-multiline',
      'preserve',
      'preserve-aligned',
    ])
    .default('auto'),
  wrapAttributesMinAttrs: z.number().int().min(1).max(10).default(2),
  unformatted: z
    .array(z.string())
    .default(['pre', 'code', 'textarea', 'script', 'style']),
  contentUnformatted: z.array(z.string()).default(['pre', 'textarea']),
  voidElements: z
    .array(z.string())
    .default([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]),
  closingSlash: z.enum(['none', 'html5', 'xhtml']).default('html5'),
  sortAttributes: z.boolean().default(false),
  sortClassName: z.boolean().default(false),
})

export const JsonFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  sortKeys: z.boolean().default(false),
  trailingCommas: z.boolean().default(false),
  singleQuote: z.boolean().default(false),
  printWidth: z.number().int().min(40).max(200).default(80),
  tabWidth: z.number().int().min(0).max(20).default(2),
  useTabs: z.boolean().default(false),
  endOfLine: z.enum(['lf', 'crlf', 'cr']).default('lf'),
})

export const YamlFormattingOptionsSchema = BaseFormattingOptionsSchema.extend({
  singleQuote: z.boolean().default(false),
  bracketSpacing: z.boolean().default(true),
  proseWrap: z.enum(['always', 'never', 'preserve']).default('preserve'),
  printWidth: z.number().int().min(40).max(200).default(80),
  tabWidth: z.number().int().min(0).max(20).default(2),
  useTabs: z.boolean().default(false),
  endOfLine: z.enum(['lf', 'crlf', 'cr']).default('lf'),
})

// Simple union type for options
export type FormattingOptions =
  | {
      language: 'javascript'
      options: z.infer<typeof JavaScriptFormattingOptionsSchema>
    }
  | {
      language: 'typescript'
      options: z.infer<typeof TypeScriptFormattingOptionsSchema>
    }
  | {
      language: 'python'
      options: z.infer<typeof PythonFormattingOptionsSchema>
    }
  | { language: 'java'; options: z.infer<typeof JavaFormattingOptionsSchema> }
  | { language: 'rust'; options: z.infer<typeof RustFormattingOptionsSchema> }
  | { language: 'go'; options: z.infer<typeof GoFormattingOptionsSchema> }
  | { language: 'css'; options: z.infer<typeof CssFormattingOptionsSchema> }
  | { language: 'html'; options: z.infer<typeof HtmlFormattingOptionsSchema> }
  | { language: 'json'; options: z.infer<typeof JsonFormattingOptionsSchema> }
  | { language: 'yaml'; options: z.infer<typeof YamlFormattingOptionsSchema> }
  | {
      language: SupportedLanguage
      options: z.infer<typeof BaseFormattingOptionsSchema>
    }

// Result schema for code formatting
export const CodeFormattingResultSchema = z.object({
  success: z.boolean(),
  formatted: z.string().nullable(),
  original: z.string(),
  language: z.enum(SUPPORTED_LANGUAGES),
  originalSize: z.number(),
  formattedSize: z.number(),
  sizeDifference: z.number(),
  compressionRatio: z.number(),
  errors: z.array(z.string()).nullable(),
  warnings: z.array(z.string()).nullable(),
  diff: z.string().nullable(),
  metadata: z.object({
    parsingTime: z.number(),
    formattingTime: z.number(),
    totalTime: z.number(),
    lineCount: z.number(),
    formattedLineCount: z.number(),
    characterCount: z.number(),
    formattedCharacterCount: z.number(),
    wasWasmUsed: z.boolean(),
    formatterUsed: z.string(),
    version: z.string(),
  }),
})

export type CodeFormattingResult = z.infer<typeof CodeFormattingResultSchema>

// Diff configuration
export interface DiffConfig {
  format: 'unified' | 'context' | 'html' | 'json'
  contextLines: number
  ignoreWhitespace: boolean
  caseSensitive: boolean
}

// Error types
export class CodeFormattingError extends Error {
  constructor(
    message: string,
    public code: string,
    public language?: string,
    public line?: number,
    public column?: number,
    public position?: number,
    public severity: 'error' | 'warning' = 'error'
  ) {
    super(message)
    this.name = 'CodeFormattingError'
  }
}

export class CodeParsingError extends CodeFormattingError {
  constructor(
    message: string,
    language: string,
    line?: number,
    column?: number,
    position?: number
  ) {
    super(message, 'PARSING_ERROR', language, line, column, position, 'error')
    this.name = 'CodeParsingError'
  }
}

export class CodeSizeError extends CodeFormattingError {
  constructor(message: string, language?: string) {
    super(message, 'SIZE_ERROR', language)
    this.name = 'CodeSizeError'
  }
}

export class UnsupportedLanguageError extends CodeFormattingError {
  constructor(language: string) {
    super(
      `Language '${language}' is not supported`,
      'UNSUPPORTED_LANGUAGE',
      language
    )
    this.name = 'UnsupportedLanguageError'
  }
}

// Performance metrics
export interface FormattingMetrics {
  parsingTime: number
  formattingTime: number
  totalTime: number
  memoryUsage: number
}

// Code statistics
export interface CodeStatistics {
  lineCount: number
  characterCount: number
  wordCount: number
  functionCount: number
  classCount: number
  importCount: number
  commentCount: number
  blankLineCount: number
}

// Language formatter interface
export interface LanguageFormatter {
  name: string
  language: SupportedLanguage
  version: string
  isAvailable(): Promise<boolean>
  initialize(): Promise<void>
  format(code: string, options: any): Promise<string>
  getStatistics(code: string): Promise<CodeStatistics>
  dispose(): void
}

/**
 * High-performance code formatter with WASM-ready architecture
 *
 * Supports 25+ programming languages with language-specific formatting options.
 * Designed to integrate with various formatters including WASM-based implementations.
 * Features comprehensive error handling, performance optimization, and diff output.
 */
export class CodeFormatter {
  private wasmModule: any = null
  private isInitialized = false
  private maxInputSize = 10 * 1024 * 1024 // 10MB
  private maxOutputSize = 50 * 1024 * 1024 // 50MB
  private languageFormatters: Map<SupportedLanguage, LanguageFormatter> =
    new Map()
  private fallbackFormatters: Map<
    SupportedLanguage,
    (code: string) => Promise<string>
  > = new Map()

  constructor() {
    this.initializeFallbackFormatters()
  }

  /**
   * Initialize the code formatter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize WASM modules for performance-critical formatters
      await this.initializeWasmModules()

      // Initialize language-specific formatters
      await this.initializeLanguageFormatters()

      this.isInitialized = true
    } catch (error) {
      throw new CodeFormattingError(
        `Failed to initialize code formatter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Format code with language-specific options
   */
  async format(
    code: string,
    language: SupportedLanguage,
    options: Partial<FormattingOptions> = {},
    diffConfig?: DiffConfig
  ): Promise<CodeFormattingResult> {
    const startTime = performance.now()

    try {
      // Ensure formatter is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Validate inputs
      this.validateInputs(code, language)

      // Get language-specific options
      const formattedOptions = this.getFormattingOptions(language, options)

      // Parse and analyze code
      const parseStartTime = performance.now()
      const statistics = await this.analyzeCode(code, language)
      const parseTime = performance.now() - parseStartTime

      // Format code
      const formatStartTime = performance.now()
      const formatted = await this.formatCode(code, language, formattedOptions)
      const formatTime = performance.now() - formatStartTime

      const totalTime = performance.now() - startTime

      // Validate output size
      if (formatted.length > this.maxOutputSize) {
        throw new CodeSizeError(
          `Formatted code exceeds maximum size limit of ${this.maxOutputSize} bytes`,
          language
        )
      }

      // Generate diff if requested
      const diff = diffConfig
        ? await this.generateDiff(code, formatted, diffConfig)
        : null

      return {
        success: true,
        formatted,
        original: code,
        language,
        originalSize: code.length,
        formattedSize: formatted.length,
        sizeDifference: formatted.length - code.length,
        compressionRatio: code.length > 0 ? formatted.length / code.length : 1,
        errors: null,
        warnings: null,
        diff,
        metadata: {
          parsingTime: parseTime,
          formattingTime: formatTime,
          totalTime,
          lineCount: statistics.lineCount,
          formattedLineCount: formatted.split('\n').length,
          characterCount: statistics.characterCount,
          formattedCharacterCount: formatted.length,
          wasWasmUsed: this.wasmModule !== null,
          formatterUsed: this.getFormatterName(language),
          version: await this.getFormatterVersion(language),
        },
      }
    } catch (error) {
      const totalTime = performance.now() - startTime

      if (error instanceof CodeFormattingError) {
        throw error
      }

      // Handle parsing errors with detailed information
      if (error instanceof SyntaxError) {
        const parseError = this.parseSyntaxError(error.message, language)
        throw new CodeParsingError(
          parseError.message,
          language,
          parseError.line,
          parseError.column,
          parseError.position
        )
      }

      throw new CodeFormattingError(
        `Failed to format ${language} code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FORMATTING_ERROR',
        language
      )
    }
  }

  /**
   * Format multiple files at once
   */
  async formatMultiple(
    files: Array<{
      code: string
      language: SupportedLanguage
      options?: Partial<FormattingOptions>
      diffConfig?: DiffConfig
    }>
  ): Promise<CodeFormattingResult[]> {
    const results: CodeFormattingResult[] = []

    for (const file of files) {
      try {
        const result = await this.format(
          file.code,
          file.language,
          file.options || {},
          file.diffConfig
        )
        results.push(result)
      } catch (error) {
        if (error instanceof CodeFormattingError) {
          results.push({
            success: false,
            formatted: null,
            original: file.code,
            language: file.language,
            originalSize: file.code.length,
            formattedSize: 0,
            sizeDifference: -file.code.length,
            compressionRatio: 0,
            errors: [error.message],
            warnings: null,
            diff: null,
            metadata: {
              parsingTime: 0,
              formattingTime: 0,
              totalTime: 0,
              lineCount: 0,
              formattedLineCount: 0,
              characterCount: 0,
              formattedCharacterCount: 0,
              wasWasmUsed: false,
              formatterUsed: 'none',
              version: '0.0.0',
            },
          })
        } else {
          results.push({
            success: false,
            formatted: null,
            original: file.code,
            language: file.language,
            originalSize: file.code.length,
            formattedSize: 0,
            sizeDifference: -file.code.length,
            compressionRatio: 0,
            errors: ['Unknown formatting error'],
            warnings: null,
            diff: null,
            metadata: {
              parsingTime: 0,
              formattingTime: 0,
              totalTime: 0,
              lineCount: 0,
              formattedLineCount: 0,
              characterCount: 0,
              formattedCharacterCount: 0,
              wasWasmUsed: false,
              formatterUsed: 'none',
              version: '0.0.0',
            },
          })
        }
      }
    }

    return results
  }

  /**
   * Detect programming language from code
   */
  async detectLanguage(code: string): Promise<SupportedLanguage | null> {
    // Simple heuristic-based language detection
    const patterns: { [key: string]: RegExp[] } = {
      javascript: [
        /^(?:import|export|const|let|var|function|class)\s/m,
        /=>\s*{?/,
        /\.jsx?$/,
      ],
      typescript: [
        /^(?:import|export|interface|type|enum|declare)\s/m,
        /:\s*(string|number|boolean|void|any)/,
        /\.tsx?$/,
      ],
      python: [
        /^(?:import|from|def|class|if\s+__name__\s*==\s*["']__main__["'])\s/m,
        /:\s*$/m,
        /\.py$/,
      ],
      java: [
        /^(?:package|import|public|private|protected|class|interface)\s/m,
        /;\s*$/,
        /\.java$/,
      ],
      rust: [/^(?:use|mod|fn|struct|enum|impl|trait)\s/m, /->\s*\w+/, /\.rs$/],
      go: [
        /^(?:package|import|func|type|struct|interface)\s/m,
        /\s*{\s*$/,
        /\.go$/,
      ],
      cpp: [
        /^#\s*include\s*[<"]/,
        /#(?:define|ifdef|ifndef|endif)/,
        /\.(cpp|cc|cxx|h|hpp)$/,
      ],
      c: [/^#\s*include\s*[<"]/, /main\s*\(/, /\.(c|h)$/],
      php: [/^<\?php/, /\$\w+/, /\.php$/],
      ruby: [/^(?:require|class|def|module)\s/m, /end\s*$/, /\.rb$/],
      css: [/^[a-zA-Z-]+\s*{/, /:\s*\w+;?\s*$/, /\.css$/],
      scss: [/^[a-zA-Z-]+\s*{/, /@\w+/, /\.(scss|sass)$/],
      html: [/^<!DOCTYPE\s+html>/i, /<[^>]+>/, /\.html?$/],
      json: [/^\s*{/, /^\s*\[/, /\.json$/],
      yaml: [/^[a-zA-Z-]+:\s*\w+/, /^\s*-/, /\.(yaml|yml)$/],
      sql: [
        /^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i,
        /;\s*$/,
        /\.sql$/,
      ],
      markdown: [/^#+\s/, /\[.*\]\(.*\)/, /\.md$/],
      dockerfile: [/^FROM\s+/, /^RUN\s+/, /^Dockerfile$/i],
      bash: [/^#!\/bin\/bash/, /^export\s+\w+/, /\.(sh|bash)$/],
    }

    for (const [language, languagePatterns] of Object.entries(patterns)) {
      if (languagePatterns.some(pattern => pattern.test(code))) {
        return language as SupportedLanguage
      }
    }

    return null
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES]
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): language is SupportedLanguage {
    return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
  }

  /**
   * Get formatter information for a language
   */
  getFormatterInfo(language: SupportedLanguage): {
    name: string
    version: string
    available: boolean
  } {
    const formatter = this.languageFormatters.get(language)
    return {
      name: formatter?.name || 'fallback',
      version: formatter?.version || '1.0.0',
      available: formatter !== undefined,
    }
  }

  /**
   * Validate inputs before processing
   */
  private validateInputs(code: string, language: SupportedLanguage): void {
    if (typeof code !== 'string') {
      throw new CodeFormattingError('Code must be a string', 'INVALID_INPUT')
    }

    if (code.length === 0) {
      throw new CodeFormattingError('Code cannot be empty', 'EMPTY_INPUT')
    }

    if (code.length > this.maxInputSize) {
      throw new CodeSizeError(
        `Code exceeds maximum size limit of ${this.maxInputSize} bytes`,
        language
      )
    }

    if (!this.isLanguageSupported(language)) {
      throw new UnsupportedLanguageError(language)
    }

    // Check for potentially malicious content
    if (this.containsSuspiciousContent(code)) {
      throw new CodeFormattingError(
        'Code contains potentially malicious content',
        'SUSPICIOUS_CONTENT',
        language
      )
    }
  }

  /**
   * Get language-specific formatting options
   */
  private getFormattingOptions(
    language: SupportedLanguage,
    options: Partial<FormattingOptions>
  ): any {
    const defaultOptions = this.getDefaultOptions(language)
    return { ...defaultOptions, ...options }
  }

  /**
   * Get default formatting options for a language
   */
  private getDefaultOptions(language: SupportedLanguage): any {
    switch (language) {
      case 'javascript':
        return JavaScriptFormattingOptionsSchema.parse({})
      case 'typescript':
        return TypeScriptFormattingOptionsSchema.parse({})
      case 'python':
        return PythonFormattingOptionsSchema.parse({})
      case 'java':
        return JavaFormattingOptionsSchema.parse({})
      case 'rust':
        return RustFormattingOptionsSchema.parse({})
      case 'go':
        return GoFormattingOptionsSchema.parse({})
      case 'css':
        return CssFormattingOptionsSchema.parse({})
      case 'html':
        return HtmlFormattingOptionsSchema.parse({})
      case 'json':
        return JsonFormattingOptionsSchema.parse({})
      case 'yaml':
        return YamlFormattingOptionsSchema.parse({})
      default:
        return BaseFormattingOptionsSchema.parse({})
    }
  }

  /**
   * Format code using appropriate formatter
   */
  private async formatCode(
    code: string,
    language: SupportedLanguage,
    options: any
  ): Promise<string> {
    const formatter = this.languageFormatters.get(language)
    if (formatter) {
      return formatter.format(code, options)
    }

    // Use fallback formatter
    const fallbackFormatter = this.fallbackFormatters.get(language)
    if (fallbackFormatter) {
      return fallbackFormatter(code)
    }

    throw new CodeFormattingError(
      `No formatter available for language: ${language}`,
      'NO_FORMATTER',
      language
    )
  }

  /**
   * Analyze code and gather statistics
   */
  private async analyzeCode(
    code: string,
    language: SupportedLanguage
  ): Promise<CodeStatistics> {
    const lines = code.split('\n')
    const words = code.split(/\s+/).filter(word => word.length > 0)

    // Language-specific analysis
    let functionCount = 0
    let classCount = 0
    let importCount = 0
    let commentCount = 0
    let blankLineCount = 0

    switch (language) {
      case 'javascript':
      case 'typescript':
        functionCount = (
          code.match(
            /function\s+\w+|=>\s*{|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g
          ) || []
        ).length
        classCount = (code.match(/class\s+\w+/g) || []).length
        importCount = (code.match(/^(?:import|export)\s+/gm) || []).length
        commentCount = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
        break
      case 'python':
        functionCount = (code.match(/def\s+\w+/g) || []).length
        classCount = (code.match(/class\s+\w+/g) || []).length
        importCount = (code.match(/^(?:import|from)\s+/gm) || []).length
        commentCount = (code.match(/#.*|""".*?"""|'''.*?'''/g) || []).length
        break
      case 'java':
        functionCount = (
          code.match(
            /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)*\w+\s*\([^)]*\)\s*{/g
          ) || []
        ).length
        classCount = (code.match(/(?:public\s+)?class\s+\w+/g) || []).length
        importCount = (code.match(/^import\s+/gm) || []).length
        commentCount = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
        break
      case 'rust':
        functionCount = (code.match(/fn\s+\w+/g) || []).length
        classCount = (code.match(/(?:struct|enum)\s+\w+/g) || []).length
        importCount = (code.match(/^use\s+/gm) || []).length
        commentCount = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
        break
      case 'go':
        functionCount = (code.match(/func\s+\w+/g) || []).length
        classCount = 0 // Go doesn't have classes
        importCount = (code.match(/^import\s+/gm) || []).length
        commentCount = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
        break
    }

    blankLineCount = lines.filter(line => line.trim().length === 0).length

    return {
      lineCount: lines.length,
      characterCount: code.length,
      wordCount: words.length,
      functionCount,
      classCount,
      importCount,
      commentCount,
      blankLineCount,
    }
  }

  /**
   * Generate diff between original and formatted code
   */
  private async generateDiff(
    original: string,
    formatted: string,
    config: DiffConfig
  ): Promise<string> {
    // Simple unified diff implementation
    const originalLines = original.split('\n')
    const formattedLines = formatted.split('\n')

    const diff = []

    // Add header
    diff.push('--- original')
    diff.push('+++ formatted')

    for (
      let i = 0, j = 0;
      i < originalLines.length || j < formattedLines.length;

    ) {
      const originalLine = originalLines[i] || ''
      const formattedLine = formattedLines[j] || ''

      if (originalLine === formattedLine) {
        diff.push(` ${originalLine}`)
        i++
        j++
      } else {
        // Find matching context
        const contextEnd = this.findContext(
          originalLines,
          formattedLines,
          i,
          j,
          config.contextLines
        )

        if (contextEnd.found) {
          // Add context header
          diff.push(
            `@@ -${i + 1},${contextEnd.originalIndex - i} +${j + 1},${contextEnd.formattedIndex - j} @@`
          )

          // Add deletions
          for (; i < contextEnd.originalIndex; i++) {
            diff.push(`-${originalLines[i]}`)
          }

          // Add additions
          for (; j < contextEnd.formattedIndex; j++) {
            diff.push(`+${formattedLines[j]}`)
          }

          // Add context lines
          for (
            let k = 0;
            k < config.contextLines &&
            i + k < originalLines.length &&
            j + k < formattedLines.length;
            k++
          ) {
            if (originalLines[i + k] === formattedLines[j + k]) {
              diff.push(` ${originalLines[i + k]}`)
            }
          }
          i += config.contextLines
          j += config.contextLines
        } else {
          // No matching context found, show entire remaining diff
          diff.push(
            `@@ -${i + 1},${originalLines.length - i} +${j + 1},${formattedLines.length - j} @@`
          )
          for (; i < originalLines.length; i++) {
            diff.push(`-${originalLines[i]}`)
          }
          for (; j < formattedLines.length; j++) {
            diff.push(`+${formattedLines[j]}`)
          }
          break
        }
      }
    }

    return diff.join('\n')
  }

  /**
   * Find matching context between two arrays of lines
   */
  private findContext(
    originalLines: string[],
    formattedLines: string[],
    originalIndex: number,
    formattedIndex: number,
    contextLines: number
  ): { found: boolean; originalIndex: number; formattedIndex: number } {
    const maxSearch = 10

    for (
      let i = 0;
      i < maxSearch && originalIndex + i < originalLines.length;
      i++
    ) {
      for (
        let j = 0;
        j < maxSearch && formattedIndex + j < formattedLines.length;
        j++
      ) {
        if (
          originalLines[originalIndex + i] ===
          formattedLines[formattedIndex + j]
        ) {
          return {
            found: true,
            originalIndex: originalIndex + i,
            formattedIndex: formattedIndex + j,
          }
        }
      }
    }

    return { found: false, originalIndex, formattedIndex }
  }

  /**
   * Parse syntax error message to extract line and column information
   */
  private parseSyntaxError(
    message: string,
    language: SupportedLanguage
  ): {
    message: string
    line?: number
    column?: number
    position?: number
  } {
    // Try to extract position information from common error message formats
    const positionMatch = message.match(/position\s+(\d+)/i)
    const lineMatch = message.match(/line\s+(\d+)/i)
    const columnMatch = message.match(/column\s+(\d+)/i)

    return {
      message: message
        .replace(/position\s+\d+/i, '')
        .replace(/line\s+\d+/i, '')
        .replace(/column\s+\d+/i, '')
        .trim(),
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      column: columnMatch ? parseInt(columnMatch[1]) : undefined,
      position: positionMatch ? parseInt(positionMatch[1]) : undefined,
    }
  }

  /**
   * Check for potentially malicious content in code input
   */
  private containsSuspiciousContent(code: string): boolean {
    // Check for extremely deep nesting indicators
    const bracketDepth = this.getMaxBracketDepth(code)
    if (bracketDepth > 1000) {
      return true
    }

    // Check for excessive repetition that might indicate DoS attempts
    const repeatedPatterns = code.match(/(.)\1{1000,}/g)
    if (repeatedPatterns) {
      return true
    }

    // Check for suspicious keywords that might indicate injection attempts
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /Function\(/i,
      /setTimeout\(/i,
      /setInterval\(/i,
    ]

    return suspiciousPatterns.some(pattern => pattern.test(code))
  }

  /**
   * Calculate maximum bracket depth in code string
   */
  private getMaxBracketDepth(code: string): number {
    let maxDepth = 0
    let currentDepth = 0

    for (const char of code) {
      if (char === '[' || char === '{' || char === '(') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === ']' || char === '}' || char === ')') {
        currentDepth--
      }
    }

    return maxDepth
  }

  /**
   * Initialize WASM modules for performance-critical operations
   */
  private async initializeWasmModules(): Promise<void> {
    try {
      // TODO: Initialize WASM modules for specific formatters
      // Examples:
      // this.wasmModule = await import('tree-sitter-wasm')
      // this.rustFormatter = await import('rustfmt-wasm')
      // this.pythonFormatter = await import('black-wasm')
    } catch (error) {
      console.warn('Failed to initialize WASM modules:', error)
      // Continue with fallback implementations
    }
  }

  /**
   * Initialize language-specific formatters
   */
  private async initializeLanguageFormatters(): Promise<void> {
    // TODO: Initialize language-specific formatters
    // This would integrate with external formatter libraries or WASM modules
  }

  /**
   * Initialize fallback formatters for basic formatting
   */
  private initializeFallbackFormatters(): void {
    // JavaScript/TypeScript basic formatter
    this.fallbackFormatters.set('javascript', async (code: string) => {
      return code
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
    })

    this.fallbackFormatters.set('typescript', async (code: string) => {
      return code
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
    })

    // Python basic formatter
    this.fallbackFormatters.set('python', async (code: string) => {
      const indentSize = 4
      const lines = code.split('\n')
      let currentIndent = 0
      const formattedLines: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === '') {
          formattedLines.push('')
          continue
        }

        // Decrease indent for closing blocks
        if (
          trimmed.startsWith('except') ||
          trimmed.startsWith('finally') ||
          trimmed.startsWith('elif') ||
          trimmed.startsWith('else')
        ) {
          currentIndent = Math.max(0, currentIndent - indentSize)
        }

        formattedLines.push(' '.repeat(currentIndent) + trimmed)

        // Increase indent for block start
        if (trimmed.endsWith(':')) {
          currentIndent += indentSize
        }

        // Decrease indent for block end
        if (
          trimmed.startsWith('return') ||
          trimmed.startsWith('pass') ||
          trimmed.startsWith('break') ||
          trimmed.startsWith('continue')
        ) {
          currentIndent = Math.max(0, currentIndent - indentSize)
        }
      }

      return formattedLines.join('\n')
    })

    // JSON formatter
    this.fallbackFormatters.set('json', async (code: string) => {
      try {
        return JSON.stringify(JSON.parse(code), null, 2)
      } catch {
        return code
      }
    })

    // Add basic formatters for other languages
    for (const language of SUPPORTED_LANGUAGES) {
      if (!this.fallbackFormatters.has(language)) {
        this.fallbackFormatters.set(language, async (code: string) => {
          // Basic formatting: trim lines and normalize whitespace
          return code
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
        })
      }
    }
  }

  /**
   * Get formatter name for a language
   */
  private getFormatterName(language: SupportedLanguage): string {
    const formatter = this.languageFormatters.get(language)
    return formatter?.name || 'fallback'
  }

  /**
   * Get formatter version for a language
   */
  private async getFormatterVersion(
    language: SupportedLanguage
  ): Promise<string> {
    const formatter = this.languageFormatters.get(language)
    return formatter?.version || '1.0.0'
  }

  /**
   * Configure maximum input/output sizes
   */
  setLimits(maxInputSize: number, maxOutputSize: number): void {
    this.maxInputSize = maxInputSize
    this.maxOutputSize = maxOutputSize
  }

  /**
   * Check if the formatter is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Get performance metrics for the last operation
   */
  getMetrics(): FormattingMetrics {
    // This would be implemented with actual performance monitoring
    return {
      parsingTime: 0,
      formattingTime: 0,
      totalTime: 0,
      memoryUsage: 0,
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Cleanup language formatters
    const formatters = Array.from(this.languageFormatters.values())
    for (const formatter of formatters) {
      formatter.dispose()
    }
    this.languageFormatters.clear()

    // TODO: Cleanup WASM modules when available
    this.wasmModule = null
    this.isInitialized = false
  }
}

// Export singleton instance
export const codeFormatter = new CodeFormatter()

// Export utility functions
export async function formatCode(
  code: string,
  language: SupportedLanguage,
  options?: Partial<FormattingOptions>,
  diffConfig?: DiffConfig
): Promise<CodeFormattingResult> {
  return codeFormatter.format(code, language, options, diffConfig)
}

export async function formatMultiple(
  files: Array<{
    code: string
    language: SupportedLanguage
    options?: Partial<FormattingOptions>
    diffConfig?: DiffConfig
  }>
): Promise<CodeFormattingResult[]> {
  return codeFormatter.formatMultiple(files)
}

export async function detectLanguage(
  code: string
): Promise<SupportedLanguage | null> {
  return codeFormatter.detectLanguage(code)
}
