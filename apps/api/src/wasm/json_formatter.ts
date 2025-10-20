import { z } from 'zod'

// TODO: Replace with WASM SIMDJSON implementation when available
// import { simdjson } from 'simdjson-wasm'

// Configuration schema for JSON formatting options
export const JsonFormattingOptionsSchema = z.object({
  indent: z.number().int().min(0).max(10).default(2),
  sortKeys: z.boolean().default(false),
  compact: z.boolean().default(false),
  ensureAscii: z.boolean().default(false),
  insertFinalNewline: z.boolean().default(false),
  maxDepth: z.number().int().min(1).max(100).default(100),
  truncateLongStrings: z.boolean().default(false),
  maxStringLength: z.number().int().min(100).max(1000000).default(10000),
  preserveOrder: z.boolean().default(false),
  removeNulls: z.boolean().default(false),
  removeUndefined: z.boolean().default(false),
})

export type JsonFormattingOptions = z.infer<typeof JsonFormattingOptionsSchema>

// Result schema for JSON formatting
export const JsonFormattingResultSchema = z.object({
  success: z.boolean(),
  formatted: z.string().nullable(),
  original: z.string(),
  originalSize: z.number(),
  formattedSize: z.number(),
  compressionRatio: z.number(),
  errors: z.array(z.string()).nullable(),
  metadata: z.object({
    parsingTime: z.number(),
    formattingTime: z.number(),
    totalTime: z.number(),
    depth: z.number(),
    keyCount: z.number(),
    valueCount: z.number(),
    arrayCount: z.number(),
    objectCount: z.number(),
    stringCount: z.number(),
    numberCount: z.number(),
    booleanCount: z.number(),
    nullCount: z.number(),
    maxStringLength: z.number(),
    truncated: z.boolean(),
  }),
})

export type JsonFormattingResult = z.infer<typeof JsonFormattingResultSchema>

// Error types
export class JsonFormattingError extends Error {
  constructor(
    message: string,
    public code: string,
    public line?: number,
    public column?: number,
    public position?: number
  ) {
    super(message)
    this.name = 'JsonFormattingError'
  }
}

export class JsonValidationError extends JsonFormattingError {
  constructor(
    message: string,
    line?: number,
    column?: number,
    position?: number
  ) {
    super(message, 'VALIDATION_ERROR', line, column, position)
    this.name = 'JsonValidationError'
  }
}

export class JsonSizeError extends JsonFormattingError {
  constructor(message: string) {
    super(message, 'SIZE_ERROR')
    this.name = 'JsonSizeError'
  }
}

export class JsonDepthError extends JsonFormattingError {
  constructor(message: string, depth: number) {
    super(message, 'DEPTH_ERROR')
    this.name = 'JsonDepthError'
  }
}

// Performance metrics
export interface FormattingMetrics {
  parsingTime: number
  formattingTime: number
  totalTime: number
  memoryUsage: number
}

// JSON statistics
export interface JsonStatistics {
  depth: number
  keyCount: number
  valueCount: number
  arrayCount: number
  objectCount: number
  stringCount: number
  numberCount: number
  booleanCount: number
  nullCount: number
  maxStringLength: number
  truncated: boolean
}

/**
 * High-performance JSON formatter with WASM-ready architecture
 *
 * Currently uses native JSON parsing with performance optimizations.
 * Designed to easily integrate with SIMDJSON WASM module when available.
 */
export class JsonFormatter {
  private wasmModule: any = null
  private isInitialized = false
  private maxInputSize = 10 * 1024 * 1024 // 10MB
  private maxOutputSize = 50 * 1024 * 1024 // 50MB

  /**
   * Initialize the JSON parser
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // TODO: Replace with WASM SIMDJSON initialization when available
      // this.wasmModule = await simdjson()

      // For now, use native JSON parsing
      this.wasmModule = { parse: JSON.parse }
      this.isInitialized = true
    } catch (error) {
      throw new JsonFormattingError(
        `Failed to initialize JSON parser: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Format JSON string with configurable options
   */
  async format(
    jsonString: string,
    options: Partial<JsonFormattingOptions> = {}
  ): Promise<JsonFormattingResult> {
    const startTime = performance.now()

    // Validate and parse options
    const validatedOptions = JsonFormattingOptionsSchema.parse(options)

    // Input validation
    this.validateInput(jsonString)

    try {
      // Ensure WASM module is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Parse JSON using SIMDJSON
      const parseStartTime = performance.now()
      const parsed = await this.parseJson(jsonString)
      const parseTime = performance.now() - parseStartTime

      // Analyze JSON structure
      const statistics = this.analyzeJson(parsed)

      // Apply transformations based on options
      const transformed = await this.applyTransformations(
        parsed,
        validatedOptions
      )

      // Format JSON
      const formatStartTime = performance.now()
      const formatted = await this.formatJson(transformed, validatedOptions)
      const formatTime = performance.now() - formatStartTime

      const totalTime = performance.now() - startTime

      // Validate output size
      if (formatted.length > this.maxOutputSize) {
        throw new JsonSizeError(
          `Formatted JSON exceeds maximum size limit of ${this.maxOutputSize} bytes`
        )
      }

      return {
        success: true,
        formatted,
        original: jsonString,
        originalSize: jsonString.length,
        formattedSize: formatted.length,
        compressionRatio:
          jsonString.length > 0 ? formatted.length / jsonString.length : 1,
        errors: null,
        metadata: {
          parsingTime: parseTime,
          formattingTime: formatTime,
          totalTime,
          ...statistics,
        },
      }
    } catch (error) {
      const totalTime = performance.now() - startTime

      if (error instanceof JsonFormattingError) {
        throw error
      }

      // Handle parsing errors with detailed information
      if (error instanceof SyntaxError) {
        const parseError = this.parseSyntaxError(error.message)
        throw new JsonValidationError(
          parseError.message,
          parseError.line,
          parseError.column,
          parseError.position
        )
      }

      throw new JsonFormattingError(
        `Failed to format JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FORMATTING_ERROR'
      )
    }
  }

  /**
   * Validate and sanitize JSON input
   */
  private validateInput(jsonString: string): void {
    if (typeof jsonString !== 'string') {
      throw new JsonValidationError('Input must be a string')
    }

    if (jsonString.length === 0) {
      throw new JsonValidationError('Input cannot be empty')
    }

    if (jsonString.length > this.maxInputSize) {
      throw new JsonSizeError(
        `Input exceeds maximum size limit of ${this.maxInputSize} bytes`
      )
    }

    // Check for potentially malicious content
    if (this.containsSuspiciousContent(jsonString)) {
      throw new JsonValidationError(
        'Input contains potentially malicious content'
      )
    }
  }

  /**
   * Parse JSON using high-performance parser
   */
  private async parseJson(jsonString: string): Promise<any> {
    try {
      // TODO: Replace with SIMDJSON WASM parsing when available
      // Use SIMDJSON for high-performance parsing
      const parsed = this.wasmModule.parse(jsonString)
      return parsed
    } catch (error) {
      // Fallback to native JSON parsing if custom parser fails
      try {
        return JSON.parse(jsonString)
      } catch (fallbackError) {
        throw fallbackError
      }
    }
  }

  /**
   * Analyze JSON structure and gather statistics
   */
  private analyzeJson(data: any, currentDepth = 0): JsonStatistics {
    const stats: JsonStatistics = {
      depth: currentDepth,
      keyCount: 0,
      valueCount: 0,
      arrayCount: 0,
      objectCount: 0,
      stringCount: 0,
      numberCount: 0,
      booleanCount: 0,
      nullCount: 0,
      maxStringLength: 0,
      truncated: false,
    }

    if (data === null) {
      stats.nullCount++
      stats.valueCount++
    } else if (typeof data === 'boolean') {
      stats.booleanCount++
      stats.valueCount++
    } else if (typeof data === 'number') {
      stats.numberCount++
      stats.valueCount++
    } else if (typeof data === 'string') {
      stats.stringCount++
      stats.valueCount++
      stats.maxStringLength = data.length
    } else if (Array.isArray(data)) {
      stats.arrayCount++
      stats.valueCount++

      for (const item of data) {
        const itemStats = this.analyzeJson(item, currentDepth + 1)
        stats.depth = Math.max(stats.depth, itemStats.depth)
        stats.keyCount += itemStats.keyCount
        stats.valueCount += itemStats.valueCount
        stats.arrayCount += itemStats.arrayCount
        stats.objectCount += itemStats.objectCount
        stats.stringCount += itemStats.stringCount
        stats.numberCount += itemStats.numberCount
        stats.booleanCount += itemStats.booleanCount
        stats.nullCount += itemStats.nullCount
        stats.maxStringLength = Math.max(
          stats.maxStringLength,
          itemStats.maxStringLength
        )
        stats.truncated = stats.truncated || itemStats.truncated
      }
    } else if (typeof data === 'object' && data !== null) {
      stats.objectCount++
      stats.valueCount++

      for (const [key, value] of Object.entries(data)) {
        stats.keyCount++
        const valueStats = this.analyzeJson(value, currentDepth + 1)
        stats.depth = Math.max(stats.depth, valueStats.depth)
        stats.keyCount += valueStats.keyCount
        stats.valueCount += valueStats.valueCount
        stats.arrayCount += valueStats.arrayCount
        stats.objectCount += valueStats.objectCount
        stats.stringCount += valueStats.stringCount
        stats.numberCount += valueStats.numberCount
        stats.booleanCount += valueStats.booleanCount
        stats.nullCount += valueStats.nullCount
        stats.maxStringLength = Math.max(
          stats.maxStringLength,
          valueStats.maxStringLength
        )
        stats.truncated = stats.truncated || valueStats.truncated
      }
    }

    return stats
  }

  /**
   * Apply transformations based on formatting options
   */
  private async applyTransformations(
    data: any,
    options: JsonFormattingOptions
  ): Promise<any> {
    if (options.removeNulls || options.removeUndefined) {
      data = this.removeNullishValues(data, options)
    }

    if (options.truncateLongStrings && options.maxStringLength) {
      data = this.truncateLongStrings(data, options.maxStringLength)
    }

    return data
  }

  /**
   * Remove null or undefined values recursively
   */
  private removeNullishValues(data: any, options: JsonFormattingOptions): any {
    if (data === null && options.removeNulls) {
      return undefined
    }

    if (data === undefined && options.removeUndefined) {
      return undefined
    }

    if (Array.isArray(data)) {
      return data
        .map(item => this.removeNullishValues(item, options))
        .filter(item => item !== undefined)
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        const transformed = this.removeNullishValues(value, options)
        if (transformed !== undefined) {
          result[key] = transformed
        }
      }
      return result
    }

    return data
  }

  /**
   * Truncate long strings to prevent memory issues
   */
  private truncateLongStrings(
    data: any,
    maxLength: number,
    truncated = false
  ): any {
    if (typeof data === 'string' && data.length > maxLength) {
      return data.substring(0, maxLength) + '... [truncated]'
    }

    if (Array.isArray(data)) {
      return data.map(item => this.truncateLongStrings(item, maxLength, true))
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.truncateLongStrings(value, maxLength, true)
      }
      return result
    }

    return data
  }

  /**
   * Format JSON object with specified options
   */
  private async formatJson(
    data: any,
    options: JsonFormattingOptions
  ): Promise<string> {
    if (options.compact) {
      return JSON.stringify(data)
    }

    const indent = options.indent > 0 ? options.indent : 0

    // Custom replacer function for sorting keys if needed
    const replacer =
      options.sortKeys && !options.preserveOrder
        ? (key: string, value: any) => {
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

    let formatted = JSON.stringify(data, replacer, indent)

    // Apply additional formatting options
    if (options.insertFinalNewline && !formatted.endsWith('\n')) {
      formatted += '\n'
    }

    if (options.ensureAscii) {
      // Ensure all characters are ASCII by escaping non-ASCII characters
      formatted = this.escapeNonAscii(formatted)
    }

    return formatted
  }

  /**
   * Escape non-ASCII characters
   */
  private escapeNonAscii(str: string): string {
    return str.replace(/[^\x20-\x7E\n\r\t]/g, char => {
      const code = char.charCodeAt(0)
      if (code <= 0xffff) {
        return `\\u${code.toString(16).padStart(4, '0')}`
      }
      // Handle surrogate pairs
      const high = Math.floor((code - 0x10000) / 0x400) + 0xd800
      const low = ((code - 0x10000) % 0x400) + 0xdc00
      return `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`
    })
  }

  /**
   * Parse syntax error message to extract line and column information
   */
  private parseSyntaxError(message: string): {
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
   * Check for potentially malicious content in JSON input
   */
  private containsSuspiciousContent(jsonString: string): boolean {
    // Check for extremely deep nesting indicators
    const bracketDepth = this.getMaxBracketDepth(jsonString)
    if (bracketDepth > 1000) {
      return true
    }

    // Check for excessive repetition that might indicate DoS attempts
    const repeatedPatterns = jsonString.match(/(.)\1{1000,}/g)
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

    return suspiciousPatterns.some(pattern => pattern.test(jsonString))
  }

  /**
   * Calculate maximum bracket depth in JSON string
   */
  private getMaxBracketDepth(jsonString: string): number {
    let maxDepth = 0
    let currentDepth = 0

    for (const char of jsonString) {
      if (char === '[' || char === '{') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === ']' || char === '}') {
        currentDepth--
      }
    }

    return maxDepth
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
   * Cleanup resources
   */
  dispose(): void {
    // TODO: Add WASM module cleanup when available
    this.wasmModule = null
    this.isInitialized = false
  }
}

// Export singleton instance
export const jsonFormatter = new JsonFormatter()

// Export utility functions
export async function formatJson(
  jsonString: string,
  options?: Partial<JsonFormattingOptions>
): Promise<JsonFormattingResult> {
  return jsonFormatter.format(jsonString, options)
}

export async function validateJson(
  jsonString: string
): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    await formatJson(jsonString, { compact: true })
    return { valid: true }
  } catch (error) {
    if (error instanceof JsonFormattingError) {
      return { valid: false, errors: [error.message] }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}

export async function minifyJson(jsonString: string): Promise<string> {
  const result = await formatJson(jsonString, { compact: true })
  if (!result.success || !result.formatted) {
    throw new JsonFormattingError('Failed to minify JSON', 'MINIFICATION_ERROR')
  }
  return result.formatted
}

export async function prettifyJson(
  jsonString: string,
  indent = 2,
  sortKeys = false
): Promise<string> {
  const result = await formatJson(jsonString, { indent, sortKeys })
  if (!result.success || !result.formatted) {
    throw new JsonFormattingError(
      'Failed to prettify JSON',
      'PRETTIFICATION_ERROR'
    )
  }
  return result.formatted
}
