import { z } from 'zod'

// TODO: Replace with WASM implementations when available
// import { parseXml } from 'fast-xml-parser-wasm'
// import { parseYaml, stringifyYaml } from 'yaml-wasm'
// import { parseCsv, stringifyCsv } from 'csv-wasm'
// import { parseToml, stringifyToml } from 'toml-wasm'

// Configuration schema for JSON conversion options
export const JsonConversionOptionsSchema = z.object({
  // General options
  format: z.enum(['xml', 'yaml', 'csv', 'toml', 'json']),
  indent: z.number().int().min(0).max(10).default(2),
  sortKeys: z.boolean().default(false),
  prettyPrint: z.boolean().default(true),
  encoding: z.enum(['utf8', 'ascii', 'utf16']).default('utf8'),

  // XML-specific options
  xmlRoot: z.string().default('root'),
  xmlDeclaration: z.boolean().default(true),
  xmlAttributes: z.boolean().default(true),
  xmlAttributePrefix: z.string().default('@'),
  xmlContentKey: z.string().default('#text'),
  xmlCData: z.boolean().default(false),
  xmlComment: z.boolean().default(false),
  xmlProcessingInstruction: z.boolean().default(false),
  xmlSelfClosingTags: z.boolean().default(true),

  // YAML-specific options
  yamlIndent: z.number().int().min(1).max(10).default(2),
  yamlFlowStyle: z.boolean().default(false),
  yamlScalarStyle: z
    .enum(['plain', 'single-quoted', 'double-quoted', 'literal', 'folded'])
    .default('plain'),
  yamlExplicitTypes: z.boolean().default(false),
  yamlAnchorReferences: z.boolean().default(true),
  yamlMinimizeQuotes: z.boolean().default(true),

  // CSV-specific options
  csvDelimiter: z.string().default(','),
  csvQuote: z.string().default('"'),
  csvEscape: z.string().default('"'),
  csvHeader: z.boolean().default(true),
  csvColumns: z.array(z.string()).optional(),
  csvFlatOutput: z.boolean().default(true),
  csvIncludeNulls: z.boolean().default(false),
  csvArrayHandling: z.enum(['join', 'separate', 'object']).default('join'),
  csvArrayDelimiter: z.string().default(';'),

  // TOML-specific options
  tomlTables: z.boolean().default(true),
  tomlInlineTables: z.boolean().default(true),
  tomlArrays: z.boolean().default(true),
  tomlMultilineStrings: z.boolean().default(false),
  tomlComments: z.boolean().default(false),

  // Streaming options
  streaming: z.boolean().default(false),
  chunkSize: z.number().int().min(1024).max(1048576).default(65536),
  maxConcurrency: z.number().int().min(1).max(10).default(4),

  // Validation options
  validateInput: z.boolean().default(true),
  validateOutput: z.boolean().default(true),
  strictMode: z.boolean().default(false),
  maxDepth: z.number().int().min(1).max(1000).default(100),
  maxFileSize: z.number().int().min(1024).max(104857600).default(10485760), // 10MB

  // Performance options
  useWasm: z.boolean().default(true),
  memoryLimit: z.number().int().min(1048576).max(536870912).default(67108864), // 64MB
  timeout: z.number().int().min(1000).max(300000).default(30000), // 30 seconds
})

export type JsonConversionOptions = z.infer<typeof JsonConversionOptionsSchema>

// Result schema for JSON conversion
export const JsonConversionResultSchema = z.object({
  success: z.boolean(),
  data: z.string().nullable(),
  originalFormat: z.string(),
  targetFormat: z.string(),
  originalSize: z.number(),
  convertedSize: z.number(),
  compressionRatio: z.number(),
  errors: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        line: z.number().optional(),
        column: z.number().optional(),
        position: z.number().optional(),
        path: z.string().optional(),
      })
    )
    .nullable(),
  warnings: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        path: z.string().optional(),
      })
    )
    .nullable(),
  metadata: z.object({
    parsingTime: z.number(),
    conversionTime: z.number(),
    totalTime: z.number(),
    memoryUsage: z.number(),
    streamingUsed: z.boolean(),
    wasWasmUsed: z.boolean(),
    chunksProcessed: z.number().optional(),
    depth: z.number(),
    keyCount: z.number(),
    valueCount: z.number(),
    arrayCount: z.number(),
    objectCount: z.number(),
  }),
})

export type JsonConversionResult = z.infer<typeof JsonConversionResultSchema>

// Streaming result schema
export const StreamingConversionResultSchema = z.object({
  done: z.boolean(),
  data: z.string().nullable(),
  progress: z.number().min(0).max(1),
  chunkIndex: z.number(),
  totalChunks: z.number(),
  errors: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        chunkIndex: z.number(),
      })
    )
    .nullable(),
})

export type StreamingConversionResult = z.infer<typeof StreamingConversionResultSchema>

// Error types
export class JsonConversionError extends Error {
  constructor(
    message: string,
    public code: string,
    public line?: number,
    public column?: number,
    public position?: number,
    public path?: string
  ) {
    super(message)
    this.name = 'JsonConversionError'
  }
}

export class UnsupportedFormatError extends JsonConversionError {
  constructor(format: string) {
    super(`Unsupported format: ${format}`, 'UNSUPPORTED_FORMAT')
    this.name = 'UnsupportedFormatError'
  }
}

export class ConversionTimeoutError extends JsonConversionError {
  constructor(timeout: number) {
    super(`Conversion timed out after ${timeout}ms`, 'TIMEOUT_ERROR')
    this.name = 'ConversionTimeoutError'
  }
}

export class ConversionSizeError extends JsonConversionError {
  constructor(size: number, maxSize: number) {
    super(`Data size ${size} exceeds maximum limit of ${maxSize}`, 'SIZE_ERROR')
    this.name = 'ConversionSizeError'
  }
}

export class ConversionDepthError extends JsonConversionError {
  constructor(depth: number, maxDepth: number) {
    super(`Data depth ${depth} exceeds maximum limit of ${maxDepth}`, 'DEPTH_ERROR')
    this.name = 'ConversionDepthError'
  }
}

export class MalformedDataError extends JsonConversionError {
  constructor(message: string) {
    super(`Malformed input data: ${message}`, 'MALFORMED_DATA')
    this.name = 'MalformedDataError'
  }
}

// Performance metrics
export interface ConversionMetrics {
  parsingTime: number
  conversionTime: number
  totalTime: number
  memoryUsage: number
  streamingUsed: boolean
  wasWasmUsed: boolean
  chunksProcessed?: number
}

// Format detection result
export interface FormatDetectionResult {
  format: string
  confidence: number
  metadata?: Record<string, any>
}

/**
 * High-performance JSON conversion service with WASM-ready architecture
 *
 * Supports bidirectional conversion between JSON, XML, YAML, CSV, and TOML.
 * Uses WASM modules for high-performance parsing when available,
 * with fallback to native implementations.
 */
export class JsonConverter {
  private wasmModules: Map<string, any> = new Map()
  private isInitialized = false
  private maxOutputSize = 50 * 1024 * 1024 // 50MB
  private timeout = 30000 // 30 seconds

  /**
   * Initialize the JSON converter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // TODO: Initialize WASM modules when available
      // this.wasmModules.set('xml', await import('fast-xml-parser-wasm'))
      // this.wasmModules.set('yaml', await import('yaml-wasm'))
      // this.wasmModules.set('csv', await import('csv-wasm'))
      // this.wasmModules.set('toml', await import('toml-wasm'))

      // For now, use native implementations
      this.wasmModules.set('xml', {
        parse: this.parseXmlNative.bind(this),
        stringify: this.stringifyXmlNative.bind(this),
      })

      this.wasmModules.set('yaml', {
        parse: this.parseYamlNative.bind(this),
        stringify: this.stringifyYamlNative.bind(this),
      })

      this.wasmModules.set('csv', {
        parse: this.parseCsvNative.bind(this),
        stringify: this.stringifyCsvNative.bind(this),
      })

      this.wasmModules.set('toml', {
        parse: this.parseTomlNative.bind(this),
        stringify: this.stringifyTomlNative.bind(this),
      })

      this.isInitialized = true
    } catch (error) {
      throw new JsonConversionError(
        `Failed to initialize JSON converter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Convert data from one format to another
   */
  async convert(
    inputData: string,
    sourceFormat: string,
    targetFormat: string,
    options: Partial<JsonConversionOptions> = {}
  ): Promise<JsonConversionResult> {
    const startTime = performance.now()

    // Validate and parse options
    const validatedOptions = JsonConversionOptionsSchema.parse({
      ...options,
      format: targetFormat,
    })

    try {
      // Ensure converter is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Validate inputs
      this.validateInputs(inputData, sourceFormat, targetFormat, validatedOptions)

      // Parse input data
      const parseStartTime = performance.now()
      const parsedData = await this.parseData(inputData, sourceFormat, validatedOptions)
      const parseTime = performance.now() - parseStartTime

      // Analyze data structure
      const analysis = this.analyzeData(parsedData)

      // Convert to target format
      const conversionStartTime = performance.now()
      const convertedData = await this.convertData(
        parsedData,
        sourceFormat,
        targetFormat,
        validatedOptions
      )
      const conversionTime = performance.now() - conversionStartTime

      const totalTime = performance.now() - startTime

      // Validate output size
      if (convertedData.length > this.maxOutputSize) {
        throw new ConversionSizeError(convertedData.length, this.maxOutputSize)
      }

      return {
        success: true,
        data: convertedData,
        originalFormat: sourceFormat,
        targetFormat,
        originalSize: inputData.length,
        convertedSize: convertedData.length,
        compressionRatio: inputData.length > 0 ? convertedData.length / inputData.length : 1,
        errors: null,
        warnings: null,
        metadata: {
          parsingTime: parseTime,
          conversionTime,
          totalTime,
          memoryUsage: 0, // Would be measured in actual implementation
          streamingUsed: validatedOptions.streaming,
          wasWasmUsed: validatedOptions.useWasm && this.hasWasmSupport(targetFormat),
          ...analysis,
        },
      }
    } catch (error) {
      const _totalTime = performance.now() - startTime

      if (error instanceof JsonConversionError) {
        throw error
      }

      throw new JsonConversionError(
        `Failed to convert data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONVERSION_ERROR'
      )
    }
  }

  /**
   * Convert data with streaming support for large datasets
   */
  async convertStream(
    inputData: AsyncIterable<string>,
    sourceFormat: string,
    targetFormat: string,
    options: Partial<JsonConversionOptions> = {}
  ): Promise<AsyncIterable<StreamingConversionResult>> {
    const validatedOptions = JsonConversionOptionsSchema.parse({
      ...options,
      format: targetFormat,
      streaming: true,
    })

    // Ensure converter is initialized
    if (!this.isInitialized) {
      await this.initialize()
    }

    // TODO: Implement streaming conversion
    // This would involve:
    // 1. Reading input data in chunks
    // 2. Parsing chunks incrementally
    // 3. Converting chunks to target format
    // 4. Emitting streaming results

    // For now, return a simple implementation
    const chunks: string[] = []
    for await (const chunk of inputData) {
      chunks.push(chunk)
    }

    const fullData = chunks.join('')
    const result = await this.convert(fullData, sourceFormat, targetFormat, validatedOptions)

    return this.createStreamingResult(result.data || '', validatedOptions)
  }

  /**
   * Detect the format of input data
   */
  async detectFormat(inputData: string): Promise<FormatDetectionResult> {
    // Simple format detection based on content patterns
    const trimmed = inputData.trim()

    // JSON detection
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        JSON.parse(trimmed)
        return { format: 'json', confidence: 0.95 }
      } catch {
        // Not valid JSON
      }
    }

    // XML detection
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      return { format: 'xml', confidence: 0.9 }
    }

    // YAML detection
    if (trimmed.includes(':') && !trimmed.startsWith('{')) {
      return { format: 'yaml', confidence: 0.7 }
    }

    // CSV detection
    if (trimmed.includes(',') && (trimmed.includes('\n') || trimmed.includes('\r'))) {
      return { format: 'csv', confidence: 0.6 }
    }

    // TOML detection
    if (trimmed.includes('=') && !trimmed.startsWith('{')) {
      return { format: 'toml', confidence: 0.5 }
    }

    return { format: 'unknown', confidence: 0.0 }
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return ['json', 'xml', 'yaml', 'csv', 'toml']
  }

  /**
   * Check if WASM support is available for a format
   */
  hasWasmSupport(format: string): boolean {
    return (
      this.wasmModules.has(format) &&
      this.wasmModules.get(format) !== null &&
      this.wasmModules.get(format) !== undefined
    )
  }

  /**
   * Validate conversion inputs
   */
  private validateInputs(
    inputData: string,
    sourceFormat: string,
    targetFormat: string,
    options: JsonConversionOptions
  ): void {
    // Validate formats
    if (!this.getSupportedFormats().includes(sourceFormat)) {
      throw new UnsupportedFormatError(sourceFormat)
    }

    if (!this.getSupportedFormats().includes(targetFormat)) {
      throw new UnsupportedFormatError(targetFormat)
    }

    // Validate input data
    if (typeof inputData !== 'string') {
      throw new JsonConversionError('Input data must be a string', 'INVALID_INPUT')
    }

    if (inputData.length === 0) {
      throw new JsonConversionError('Input data cannot be empty', 'EMPTY_INPUT')
    }

    if (inputData.length > options.maxFileSize) {
      throw new ConversionSizeError(inputData.length, options.maxFileSize)
    }

    // Check for suspicious content
    if (this.containsSuspiciousContent(inputData)) {
      throw new JsonConversionError(
        'Input contains potentially malicious content',
        'SUSPICIOUS_CONTENT'
      )
    }
  }

  /**
   * Parse input data based on source format
   */
  private async parseData(
    inputData: string,
    sourceFormat: string,
    options: JsonConversionOptions
  ): Promise<any> {
    const startTime = performance.now()

    try {
      let parsedData: any

      switch (sourceFormat) {
        case 'json':
          parsedData = JSON.parse(inputData)
          break
        case 'xml':
          parsedData = await this.parseXml(inputData, options)
          break
        case 'yaml':
          parsedData = await this.parseYaml(inputData, options)
          break
        case 'csv':
          parsedData = await this.parseCsv(inputData, options)
          break
        case 'toml':
          parsedData = await this.parseToml(inputData, options)
          break
        default:
          throw new UnsupportedFormatError(sourceFormat)
      }

      // Check timeout
      if (performance.now() - startTime > options.timeout) {
        throw new ConversionTimeoutError(options.timeout)
      }

      return parsedData
    } catch (error) {
      if (error instanceof JsonConversionError) {
        throw error
      }

      // Handle parsing errors with detailed information
      if (error instanceof SyntaxError) {
        const parseError = this.parseSyntaxError(error.message)
        throw new MalformedDataError(parseError.message)
      }

      throw new JsonConversionError(
        `Failed to parse ${sourceFormat} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSING_ERROR'
      )
    }
  }

  /**
   * Convert parsed data to target format
   */
  private async convertData(
    parsedData: any,
    _sourceFormat: string,
    targetFormat: string,
    options: JsonConversionOptions
  ): Promise<string> {
    const startTime = performance.now()

    try {
      let convertedData: string

      switch (targetFormat) {
        case 'json':
          convertedData = this.stringifyJson(parsedData, options)
          break
        case 'xml':
          convertedData = await this.stringifyXml(parsedData, options)
          break
        case 'yaml':
          convertedData = await this.stringifyYaml(parsedData, options)
          break
        case 'csv':
          convertedData = await this.stringifyCsv(parsedData, options)
          break
        case 'toml':
          convertedData = await this.stringifyToml(parsedData, options)
          break
        default:
          throw new UnsupportedFormatError(targetFormat)
      }

      // Check timeout
      if (performance.now() - startTime > options.timeout) {
        throw new ConversionTimeoutError(options.timeout)
      }

      return convertedData
    } catch (error) {
      if (error instanceof JsonConversionError) {
        throw error
      }

      throw new JsonConversionError(
        `Failed to convert to ${targetFormat}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONVERSION_ERROR'
      )
    }
  }

  /**
   * Parse XML data
   */
  private async parseXml(inputData: string, options: JsonConversionOptions): Promise<any> {
    if (options.useWasm && this.hasWasmSupport('xml')) {
      return this.wasmModules.get('xml').parse(inputData, {
        attributeNamePrefix: options.xmlAttributePrefix,
        textNodeName: options.xmlContentKey,
        ignoreAttributes: !options.xmlAttributes,
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: true,
        parseTrueNumberOnly: false,
      })
    }

    return this.parseXmlNative(inputData, options)
  }

  /**
   * Native XML parsing implementation
   */
  private parseXmlNative(inputData: string, options: JsonConversionOptions): any {
    // Simplified XML parsing - in a real implementation, use a proper XML parser
    const result: any = {}
    const rootMatch = inputData.match(/<([^\s>]+)([^>]*)>([\s\S]*)<\/\1>/)

    if (!rootMatch) {
      throw new MalformedDataError('Invalid XML structure')
    }

    const [, _tagName, attributes, content] = rootMatch
    result[options.xmlRoot || 'root'] = {}

    // Parse attributes
    if (options.xmlAttributes && attributes) {
      const attrRegex = /(\w+)="([^"]*)"/g
      let attrMatch
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        result[options.xmlRoot || 'root'][`${options.xmlAttributePrefix}${attrMatch[1]}`] =
          attrMatch[2]
      }
    }

    // Parse content (simplified)
    if (content.trim()) {
      if (content.startsWith('<') && content.endsWith('>')) {
        // Nested XML
        result[options.xmlRoot || 'root'][options.xmlContentKey || '#text'] = this.parseXmlNative(
          content,
          options
        )
      } else {
        result[options.xmlRoot || 'root'][options.xmlContentKey || '#text'] = content.trim()
      }
    }

    return result
  }

  /**
   * Parse YAML data
   */
  private async parseYaml(inputData: string, options: JsonConversionOptions): Promise<any> {
    if (options.useWasm && this.hasWasmSupport('yaml')) {
      return this.wasmModules.get('yaml').parse(inputData)
    }

    return this.parseYamlNative(inputData, options)
  }

  /**
   * Native YAML parsing implementation
   */
  private parseYamlNative(inputData: string, _options: JsonConversionOptions): any {
    // Simplified YAML parsing - in a real implementation, use a proper YAML parser
    try {
      // Try to parse as JSON first (YAML is a superset)
      return JSON.parse(inputData)
    } catch {
      // Basic YAML parsing for simple key-value pairs
      const result: any = {}
      const lines = inputData.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const colonIndex = trimmed.indexOf(':')
          if (colonIndex > 0) {
            const key = trimmed.substring(0, colonIndex).trim()
            const value = trimmed.substring(colonIndex + 1).trim()

            // Try to parse the value
            try {
              result[key] = JSON.parse(value)
            } catch {
              result[key] = value
            }
          }
        }
      }

      return result
    }
  }

  /**
   * Parse CSV data
   */
  private async parseCsv(inputData: string, options: JsonConversionOptions): Promise<any> {
    if (options.useWasm && this.hasWasmSupport('csv')) {
      return this.wasmModules.get('csv').parse(inputData, {
        delimiter: options.csvDelimiter,
        quote: options.csvQuote,
        escape: options.csvEscape,
        header: options.csvHeader,
        columns: options.csvColumns,
        skip_empty_lines: true,
        trim: true,
      })
    }

    return this.parseCsvNative(inputData, options)
  }

  /**
   * Native CSV parsing implementation
   */
  private parseCsvNative(inputData: string, options: JsonConversionOptions): any[] {
    const lines = inputData.split(/\r?\n/)
    const result: any[] = []
    const delimiter = options.csvDelimiter
    const quote = options.csvQuote

    if (lines.length === 0) {
      return result
    }

    // Parse header
    const headerLine = lines[0]
    const headers = this.parseCsvLine(headerLine, delimiter, quote)

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const values = this.parseCsvLine(line, delimiter, quote)
        const row: any = {}

        for (let j = 0; j < headers.length; j++) {
          const header = options.csvHeader ? headers[j] : `column_${j}`
          const value = values[j] || ''

          // Try to parse the value
          try {
            row[header] = JSON.parse(value)
          } catch {
            row[header] = value
          }
        }

        result.push(row)
      }
    }

    return result
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCsvLine(line: string, delimiter: string, quote: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === quote) {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  /**
   * Parse TOML data
   */
  private async parseToml(inputData: string, options: JsonConversionOptions): Promise<any> {
    if (options.useWasm && this.hasWasmSupport('toml')) {
      return this.wasmModules.get('toml').parse(inputData)
    }

    return this.parseTomlNative(inputData, options)
  }

  /**
   * Native TOML parsing implementation
   */
  private parseTomlNative(inputData: string, _options: JsonConversionOptions): any {
    // Simplified TOML parsing - in a real implementation, use a proper TOML parser
    const result: any = {}
    const lines = inputData.split('\n')
    let currentSection = result

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      // Handle sections
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const sectionName = trimmed.slice(1, -1).trim()
        result[sectionName] = {}
        currentSection = result[sectionName]
        continue
      }

      // Handle key-value pairs
      const equalIndex = trimmed.indexOf('=')
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim()
        const value = trimmed.substring(equalIndex + 1).trim()

        try {
          currentSection[key] = JSON.parse(value)
        } catch {
          currentSection[key] = value
        }
      }
    }

    return result
  }

  /**
   * Stringify data as JSON
   */
  private stringifyJson(data: any, options: JsonConversionOptions): string {
    const indent = options.prettyPrint ? options.indent : 0

    const replacer = options.sortKeys
      ? (_key: string, value: any) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const sortedKeys = Object.keys(value).sort()
            const sortedObj: any = {}
            for (const k of sortedKeys) {
              sortedObj[k] = value[k]
            }
            return sortedObj
          }
          return value
        }
      : undefined

    return JSON.stringify(data, replacer, indent)
  }

  /**
   * Stringify data as XML
   */
  private async stringifyXml(data: any, options: JsonConversionOptions): Promise<string> {
    if (options.useWasm && this.hasWasmSupport('xml')) {
      return this.wasmModules.get('xml').stringify(data, {
        attributeNamePrefix: options.xmlAttributePrefix,
        textNodeName: options.xmlContentKey,
        ignoreAttributes: !options.xmlAttributes,
        format: true,
        indent: ' '.repeat(options.indent),
      })
    }

    return this.stringifyXmlNative(data, options)
  }

  /**
   * Native XML stringification implementation
   */
  private stringifyXmlNative(data: any, options: JsonConversionOptions): string {
    const indent = ' '.repeat(options.indent)

    let xml = ''

    if (options.xmlDeclaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n'
    }

    const convertValue = (value: any, name: string, depth: number): string => {
      const currentIndent = indent.repeat(depth)
      let result = ''

      if (value === null || value === undefined) {
        return `${currentIndent}<${name}${options.xmlSelfClosingTags ? ' />' : `></${name}>`}\n`
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        result += `${currentIndent}<${name}>\n`

        for (const [key, val] of Object.entries(value)) {
          if (key.startsWith(options.xmlAttributePrefix)) {
          } else if (key === options.xmlContentKey) {
            // Handle text content
            result += `${currentIndent}${indent}${val}\n`
          } else {
            result += convertValue(val, key, depth + 1)
          }
        }

        result += `${currentIndent}</${name}>\n`
      } else if (Array.isArray(value)) {
        for (const item of value) {
          result += convertValue(item, name, depth)
        }
      } else {
        result += `${currentIndent}<${name}>${value}</${name}>\n`
      }

      return result
    }

    // Convert root object
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        xml += convertValue(value, key, 0)
      }
    } else {
      xml += convertValue(data, 'root', 0)
    }

    return xml.trim()
  }

  /**
   * Stringify data as YAML
   */
  private async stringifyYaml(data: any, options: JsonConversionOptions): Promise<string> {
    if (options.useWasm && this.hasWasmSupport('yaml')) {
      return this.wasmModules.get('yaml').stringify(data, {
        indent: options.yamlIndent,
        flowLevel: options.yamlFlowStyle ? 0 : -1,
        styles: {
          '!!null': 'canonical',
          '!!bool': 'lowercase',
          '!!int': 'decimal',
          '!!float': 'lowercase',
        },
      })
    }

    return this.stringifyYamlNative(data, options)
  }

  /**
   * Native YAML stringification implementation
   */
  private stringifyYamlNative(data: any, options: JsonConversionOptions): string {
    const indent = ' '.repeat(options.yamlIndent)

    const convertValue = (value: any, depth: number): string => {
      let result = ''

      if (value === null || value === undefined) {
        return 'null'
      }

      if (typeof value === 'string') {
        return value
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
      }

      if (Array.isArray(value)) {
        if (options.yamlFlowStyle) {
          return `[${value.map(v => convertValue(v, depth)).join(', ')}]`
        } else {
          for (const item of value) {
            result += `${indent.repeat(depth)}- ${convertValue(item, depth + 1)}\n`
          }
          return result.trim()
        }
      }

      if (typeof value === 'object') {
        for (const [key, val] of Object.entries(value)) {
          if (typeof val === 'object') {
            result += `${indent.repeat(depth)}${key}:\n`
            result += convertValue(val, depth + 1)
          } else {
            result += `${indent.repeat(depth)}${key}: ${convertValue(val, depth + 1)}\n`
          }
        }
        return result.trim()
      }

      return String(value)
    }

    return convertValue(data, 0)
  }

  /**
   * Stringify data as CSV
   */
  private async stringifyCsv(data: any, options: JsonConversionOptions): Promise<string> {
    if (options.useWasm && this.hasWasmSupport('csv')) {
      return this.wasmModules.get('csv').stringify(data, {
        delimiter: options.csvDelimiter,
        quote: options.csvQuote,
        escape: options.csvEscape,
        header: options.csvHeader,
        columns: options.csvColumns,
      })
    }

    return this.stringifyCsvNative(data, options)
  }

  /**
   * Native CSV stringification implementation
   */
  private stringifyCsvNative(data: any, options: JsonConversionOptions): string {
    if (!Array.isArray(data)) {
      throw new JsonConversionError('CSV output requires array data', 'INVALID_CSV_DATA')
    }

    const delimiter = options.csvDelimiter
    const quote = options.csvQuote
    let csv = ''

    // Add header
    if (options.csvHeader && data.length > 0) {
      const headers = options.csvColumns || Object.keys(data[0])
      csv += `${headers.map(header => this.escapeCsvField(header, quote)).join(delimiter)}\n`
    }

    // Add data rows
    for (const row of data) {
      if (typeof row === 'object' && row !== null) {
        const headers = options.csvColumns || Object.keys(row)
        const values = headers.map(header => {
          const value = row[header]
          return value !== undefined ? String(value) : ''
        })
        csv += `${values.map(v => this.escapeCsvField(v, quote)).join(delimiter)}\n`
      } else {
        csv += `${this.escapeCsvField(String(row), quote)}\n`
      }
    }

    return csv.trim()
  }

  /**
   * Escape a CSV field
   */
  private escapeCsvField(field: string, quote: string): string {
    if (
      field.includes(',') ||
      field.includes('\n') ||
      field.includes('\r') ||
      field.includes(quote)
    ) {
      return `${quote}${field.replace(new RegExp(quote, 'g'), quote + quote)}${quote}`
    }
    return field
  }

  /**
   * Stringify data as TOML
   */
  private async stringifyToml(data: any, options: JsonConversionOptions): Promise<string> {
    if (options.useWasm && this.hasWasmSupport('toml')) {
      return this.wasmModules.get('toml').stringify(data)
    }

    return this.stringifyTomlNative(data, options)
  }

  /**
   * Native TOML stringification implementation
   */
  private stringifyTomlNative(data: any, _options: JsonConversionOptions): string {
    let toml = ''

    const convertValue = (value: any): string => {
      if (value === null || value === undefined) {
        return 'null'
      }

      if (typeof value === 'string') {
        return `"${value}"`
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
      }

      if (Array.isArray(value)) {
        return `[${value.map(v => convertValue(v)).join(', ')}]`
      }

      return JSON.stringify(value)
    }

    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          toml += `\n[${key}]\n`
          for (const [subKey, subValue] of Object.entries(value)) {
            toml += `${subKey} = ${convertValue(subValue)}\n`
          }
        } else {
          toml += `${key} = ${convertValue(value)}\n`
        }
      }
    }

    return toml.trim()
  }

  /**
   * Analyze data structure
   */
  private analyzeData(data: any, currentDepth = 0): any {
    const analysis = {
      depth: currentDepth,
      keyCount: 0,
      valueCount: 0,
      arrayCount: 0,
      objectCount: 0,
    }

    if (data === null || data === undefined) {
      analysis.valueCount++
    } else if (Array.isArray(data)) {
      analysis.arrayCount++
      analysis.valueCount++

      for (const item of data) {
        const itemAnalysis = this.analyzeData(item, currentDepth + 1)
        analysis.depth = Math.max(analysis.depth, itemAnalysis.depth)
        analysis.keyCount += itemAnalysis.keyCount
        analysis.valueCount += itemAnalysis.valueCount
        analysis.arrayCount += itemAnalysis.arrayCount
        analysis.objectCount += itemAnalysis.objectCount
      }
    } else if (typeof data === 'object') {
      analysis.objectCount++
      analysis.valueCount++

      for (const [_key, value] of Object.entries(data)) {
        analysis.keyCount++
        const valueAnalysis = this.analyzeData(value, currentDepth + 1)
        analysis.depth = Math.max(analysis.depth, valueAnalysis.depth)
        analysis.keyCount += valueAnalysis.keyCount
        analysis.valueCount += valueAnalysis.valueCount
        analysis.arrayCount += valueAnalysis.arrayCount
        analysis.objectCount += valueAnalysis.objectCount
      }
    } else {
      analysis.valueCount++
    }

    return analysis
  }

  /**
   * Parse syntax error message
   */
  private parseSyntaxError(message: string): { message: string } {
    return {
      message: message
        .replace(/position\s+\d+/i, '')
        .replace(/line\s+\d+/i, '')
        .replace(/column\s+\d+/i, '')
        .trim(),
    }
  }

  /**
   * Check for suspicious content
   */
  private containsSuspiciousContent(inputData: string): boolean {
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

    return suspiciousPatterns.some(pattern => pattern.test(inputData))
  }

  /**
   * Create streaming result from converted data
   */
  private async *createStreamingResult(
    data: string,
    options: JsonConversionOptions
  ): AsyncIterable<StreamingConversionResult> {
    const chunkSize = options.chunkSize
    const totalChunks = Math.ceil(data.length / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, data.length)
      const chunk = data.substring(start, end)

      yield {
        done: i === totalChunks - 1,
        data: chunk,
        progress: (i + 1) / totalChunks,
        chunkIndex: i,
        totalChunks,
        errors: null,
      }
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ConversionMetrics {
    return {
      parsingTime: 0,
      conversionTime: 0,
      totalTime: 0,
      memoryUsage: 0,
      streamingUsed: false,
      wasWasmUsed: false,
    }
  }

  /**
   * Configure limits
   */
  setLimits(
    maxInputSize: number,
    maxOutputSize: number,
    memoryLimit: number,
    timeout: number
  ): void {
    this.maxInputSize = maxInputSize
    this.maxOutputSize = maxOutputSize
    this.memoryLimit = memoryLimit
    this.timeout = timeout
  }

  /**
   * Check if the converter is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.wasmModules.clear()
    this.isInitialized = false
  }
}

// Export singleton instance
export const jsonConverter = new JsonConverter()

// Export utility functions
export async function convertJson(
  inputData: string,
  sourceFormat: string,
  targetFormat: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(inputData, sourceFormat, targetFormat, options)
}

export async function convertJsonToXml(
  jsonData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(jsonData, 'json', 'xml', options)
}

export async function convertJsonToYaml(
  jsonData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(jsonData, 'json', 'yaml', options)
}

export async function convertJsonToCsv(
  jsonData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(jsonData, 'json', 'csv', options)
}

export async function convertJsonToToml(
  jsonData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(jsonData, 'json', 'toml', options)
}

export async function convertXmlToJson(
  xmlData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(xmlData, 'xml', 'json', options)
}

export async function convertYamlToJson(
  yamlData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(yamlData, 'yaml', 'json', options)
}

export async function convertCsvToJson(
  csvData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(csvData, 'csv', 'json', options)
}

export async function convertTomlToJson(
  tomlData: string,
  options?: Partial<JsonConversionOptions>
): Promise<JsonConversionResult> {
  return jsonConverter.convert(tomlData, 'toml', 'json', options)
}

export async function detectDataFormat(inputData: string): Promise<FormatDetectionResult> {
  return jsonConverter.detectFormat(inputData)
}

export function getSupportedFormats(): string[] {
  return jsonConverter.getSupportedFormats()
}
