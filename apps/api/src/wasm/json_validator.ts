import { z } from 'zod'

// TODO: Replace with WASM ajv-wasm implementation when available
// import { Ajv } from 'ajv-wasm'

// Configuration schema for JSON validation options
export const JsonValidationOptionsSchema = z.object({
  strictMode: z.boolean().default(true),
  allowComments: z.boolean().default(false),
  allowTrailingCommas: z.boolean().default(false),
  maxDepth: z.number().int().min(1).max(1000).default(100),
  maxErrors: z.number().int().min(1).max(1000).default(100),
  removeAdditional: z.boolean().default(false),
  useDefaults: z.boolean().default(false),
  coerceTypes: z.boolean().default(false),
  allErrors: z.boolean().default(true),
  verbose: z.boolean().default(true),
  format: z.enum(['fast', 'full']).default('fast'),
  schemas: z
    .array(
      z.object({
        $id: z.string(),
        $schema: z.string().optional(),
        type: z.string().optional(),
        properties: z.record(z.any()).optional(),
        required: z.array(z.string()).optional(),
        additionalProperties: z.union([z.boolean(), z.record(z.any())]).optional(),
        definitions: z.record(z.any()).optional(),
        $ref: z.string().optional(),
      })
    )
    .optional(),
})

export type JsonValidationOptions = z.infer<typeof JsonValidationOptionsSchema>

// Schema for custom validation rules
export const CustomValidationRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.number().int().min(1).max(10).default(5),
  async: z.boolean().default(false),
  validator: z.union([
    z.function(),
    z.string(), // For WASM-based validators
  ]),
  errorMessage: z.string().optional(),
})

export type CustomValidationRule = z.infer<typeof CustomValidationRuleSchema>

// Result schema for JSON validation
export const JsonValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z
    .array(
      z.object({
        keyword: z.string(),
        instancePath: z.string(),
        schemaPath: z.string(),
        message: z.string(),
        params: z.record(z.any()),
        data: z.any(),
        dataPath: z.string(),
        propertyName: z.string().optional(),
        line: z.number().optional(),
        column: z.number().optional(),
        position: z.number().optional(),
      })
    )
    .optional(),
  warnings: z
    .array(
      z.object({
        message: z.string(),
        path: z.string(),
        line: z.number().optional(),
        column: z.number().optional(),
        position: z.number().optional(),
      })
    )
    .optional(),
  schema: z
    .object({
      $id: z.string(),
      $schema: z.string().optional(),
      valid: z.boolean(),
    })
    .optional(),
  metadata: z.object({
    validationTime: z.number(),
    parsingTime: z.number(),
    totalTime: z.number(),
    dataSize: z.number(),
    schemaSize: z.number(),
    errorCount: z.number(),
    warningCount: z.number(),
    depth: z.number(),
    customRulesApplied: z.number(),
    wasWasmUsed: z.boolean(),
  }),
})

export type JsonValidationResult = z.infer<typeof JsonValidationResultSchema>

// Error types
export class JsonValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public line?: number,
    public column?: number,
    public position?: number,
    public path?: string,
    public schemaPath?: string
  ) {
    super(message)
    this.name = 'JsonValidationError'
  }
}

export class JsonSchemaError extends JsonValidationError {
  constructor(
    message: string,
    public schemaErrors: any[],
    line?: number,
    column?: number,
    position?: number
  ) {
    super(message, 'SCHEMA_ERROR', line, column, position)
    this.name = 'JsonSchemaError'
  }
}

export class JsonSizeError extends JsonValidationError {
  constructor(message: string) {
    super(message, 'SIZE_ERROR')
    this.name = 'JsonSizeError'
  }
}

export class JsonDepthError extends JsonValidationError {
  constructor(message: string, _depth: number) {
    super(message, 'DEPTH_ERROR')
    this.name = 'JsonDepthError'
  }
}

// Performance metrics
export interface ValidationMetrics {
  validationTime: number
  parsingTime: number
  totalTime: number
  memoryUsage: number
}

// Custom rule result
export interface CustomRuleResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
  metadata?: Record<string, any>
}

/**
 * High-performance JSON validator with WASM-ready architecture
 *
 * Uses ajv-wasm for JSON Schema validation when available,
 * falls back to native ajv implementation.
 * Supports custom validation rules and detailed error reporting.
 */
export class JsonValidator {
  private wasmModule: any = null
  private ajvInstance: any = null
  private isInitialized = false
  private customRules: Map<string, CustomValidationRule> = new Map()
  private schemas: Map<string, any> = new Map()
  private maxInputSize = 50 * 1024 * 1024 // 50MB
  private maxSchemaSize = 10 * 1024 * 1024 // 10MB

  /**
   * Initialize the JSON validator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // TODO: Replace with WASM ajv-wasm initialization when available
      // this.wasmModule = await import('ajv-wasm')
      // this.ajvInstance = new this.wasmModule.Ajv({
      //   allErrors: true,
      //   verbose: true,
      //   strict: true,
      //   removeAdditional: false,
      //   useDefaults: false,
      //   coerceTypes: false,
      // })

      // For now, use native implementation
      const Ajv = await import('ajv').then(m => m.default)
      this.ajvInstance = new Ajv({
        allErrors: true,
        verbose: true,
        strict: true,
        removeAdditional: false,
        useDefaults: false,
        coerceTypes: false,
        // Add additional formats
        addFormats: await import('ajv-formats').then(m => m.default),
      })

      // Add formats
      const addFormats = await import('ajv-formats')
      addFormats.default(this.ajvInstance)

      // Add default custom rules
      await this.addDefaultCustomRules()

      this.isInitialized = true
    } catch (error) {
      throw new JsonValidationError(
        `Failed to initialize JSON validator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Validate JSON data against a schema
   */
  async validate(
    jsonData: any,
    schema: any,
    options: Partial<JsonValidationOptions> = {}
  ): Promise<JsonValidationResult> {
    const startTime = performance.now()

    // Validate and parse options
    const validatedOptions = JsonValidationOptionsSchema.parse(options)

    try {
      // Ensure validator is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Validate inputs
      this.validateInputs(jsonData, schema, validatedOptions)

      // Parse JSON if it's a string
      const parseStartTime = performance.now()
      const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const parseTime = performance.now() - parseStartTime

      // Validate against schema
      const validationStartTime = performance.now()
      const schemaValidationResult = await this.validateAgainstSchema(
        parsedData,
        schema,
        validatedOptions
      )
      const validationTime = performance.now() - validationStartTime

      // Apply custom validation rules
      const customRuleResults = await this.applyCustomRules(parsedData, schema, validatedOptions)

      // Combine results
      const result = this.combineResults(schemaValidationResult, customRuleResults, {
        validationTime,
        parsingTime: parseTime,
        totalTime: performance.now() - startTime,
        dataSize: JSON.stringify(parsedData).length,
        schemaSize: JSON.stringify(schema).length,
        wasWasmUsed: this.wasmModule !== null,
      })

      return result
    } catch (error) {
      const _totalTime = performance.now() - startTime

      if (error instanceof JsonValidationError) {
        throw error
      }

      // Handle parsing errors with detailed information
      if (error instanceof SyntaxError) {
        const parseError = this.parseSyntaxError(error.message)
        throw new JsonValidationError(
          parseError.message,
          'PARSE_ERROR',
          parseError.line,
          parseError.column,
          parseError.position
        )
      }

      throw new JsonValidationError(
        `Failed to validate JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_ERROR'
      )
    }
  }

  /**
   * Validate JSON syntax only (no schema)
   */
  async validateSyntax(
    jsonData: string,
    options: Partial<JsonValidationOptions> = {}
  ): Promise<JsonValidationResult> {
    const startTime = performance.now()
    const validatedOptions = JsonValidationOptionsSchema.parse(options)

    try {
      // Ensure validator is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Validate input
      this.validateInput(jsonData, validatedOptions)

      // Parse JSON
      const parseStartTime = performance.now()
      const parsedData = JSON.parse(jsonData)
      const parseTime = performance.now() - parseStartTime

      // Analyze JSON structure
      const depth = this.calculateDepth(parsedData)

      // Apply custom rules that don't require a schema
      const customRuleResults = await this.applyCustomRules(parsedData, null, validatedOptions)

      const totalTime = performance.now() - startTime

      return {
        valid: true,
        errors: undefined,
        warnings: customRuleResults.warnings,
        metadata: {
          validationTime: 0,
          parsingTime: parseTime,
          totalTime,
          dataSize: jsonData.length,
          schemaSize: 0,
          errorCount: 0,
          warningCount: customRuleResults.warnings?.length || 0,
          depth,
          customRulesApplied: customRuleResults.rulesApplied,
          wasWasmUsed: this.wasmModule !== null,
        },
      }
    } catch (error) {
      if (error instanceof JsonValidationError) {
        throw error
      }

      // Handle parsing errors with detailed information
      if (error instanceof SyntaxError) {
        const parseError = this.parseSyntaxError(error.message)
        throw new JsonValidationError(
          parseError.message,
          'PARSE_ERROR',
          parseError.line,
          parseError.column,
          parseError.position
        )
      }

      throw new JsonValidationError(
        `Failed to validate JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_ERROR'
      )
    }
  }

  /**
   * Add a custom validation rule
   */
  async addCustomRule(rule: CustomValidationRule): Promise<void> {
    // Validate rule schema
    const validatedRule = CustomValidationRuleSchema.parse(rule)

    // Store the rule
    this.customRules.set(validatedRule.name, validatedRule)

    // Add to AJV if it's a function
    if (typeof validatedRule.validator === 'function' && this.ajvInstance) {
      this.ajvInstance.addKeyword({
        keyword: validatedRule.name,
        type: 'object',
        schemaType: 'boolean',
        compile: (_schemaVal: boolean) => {
          return function validate(data: any) {
            return validatedRule.validator(data)
          }
        },
        error: {
          message:
            validatedRule.errorMessage || `Custom validation failed for ${validatedRule.name}`,
        },
      })
    }
  }

  /**
   * Remove a custom validation rule
   */
  removeCustomRule(name: string): void {
    this.customRules.delete(name)
  }

  /**
   * Add a schema for validation
   */
  addSchema(schema: any): void {
    if (!schema.$id) {
      throw new JsonValidationError('Schema must have an $id property', 'INVALID_SCHEMA')
    }

    this.schemas.set(schema.$id, schema)

    if (this.ajvInstance) {
      this.ajvInstance.addSchema(schema)
    }
  }

  /**
   * Remove a schema
   */
  removeSchema(schemaId: string): void {
    this.schemas.delete(schemaId)

    if (this.ajvInstance) {
      this.ajvInstance.removeSchema(schemaId)
    }
  }

  /**
   * Validate inputs before processing
   */
  private validateInputs(jsonData: any, schema: any, options: JsonValidationOptions): void {
    // Validate JSON data
    if (typeof jsonData === 'string') {
      this.validateInput(jsonData, options)
    }

    // Validate schema
    if (typeof schema === 'string') {
      if (schema.length > this.maxSchemaSize) {
        throw new JsonSizeError(`Schema exceeds maximum size limit of ${this.maxSchemaSize} bytes`)
      }
    } else if (typeof schema === 'object') {
      const schemaString = JSON.stringify(schema)
      if (schemaString.length > this.maxSchemaSize) {
        throw new JsonSizeError(`Schema exceeds maximum size limit of ${this.maxSchemaSize} bytes`)
      }
    }

    // Validate schema structure
    this.validateSchemaStructure(schema)
  }

  /**
   * Validate JSON input
   */
  private validateInput(jsonString: string, options: JsonValidationOptions): void {
    if (typeof jsonString !== 'string') {
      throw new JsonValidationError('Input must be a string')
    }

    if (jsonString.length === 0) {
      throw new JsonValidationError('Input cannot be empty')
    }

    if (jsonString.length > this.maxInputSize) {
      throw new JsonSizeError(`Input exceeds maximum size limit of ${this.maxInputSize} bytes`)
    }

    // Check for depth
    const depth = this.getMaxBracketDepth(jsonString)
    if (depth > options.maxDepth) {
      throw new JsonDepthError(`Input exceeds maximum depth limit of ${options.maxDepth}`, depth)
    }

    // Check for potentially malicious content
    if (this.containsSuspiciousContent(jsonString)) {
      throw new JsonValidationError('Input contains potentially malicious content')
    }
  }

  /**
   * Validate schema structure
   */
  private validateSchemaStructure(schema: any): void {
    if (!schema || typeof schema !== 'object') {
      throw new JsonValidationError('Schema must be an object', 'INVALID_SCHEMA')
    }

    if (!schema.$id) {
      throw new JsonValidationError('Schema must have an $id property', 'INVALID_SCHEMA')
    }

    // Basic JSON Schema validation
    if (
      schema.type &&
      !['object', 'array', 'string', 'number', 'boolean', 'null'].includes(schema.type)
    ) {
      throw new JsonValidationError(`Invalid schema type: ${schema.type}`, 'INVALID_SCHEMA')
    }
  }

  /**
   * Validate data against schema using AJV
   */
  private async validateAgainstSchema(
    data: any,
    schema: any,
    options: JsonValidationOptions
  ): Promise<{ valid: boolean; errors?: any[] }> {
    if (!this.ajvInstance) {
      throw new JsonValidationError('Validator not initialized', 'NOT_INITIALIZED')
    }

    try {
      // Create AJV instance with options
      const ajv = this.ajvInstance.compile({
        ...schema,
        allErrors: options.allErrors,
        verbose: options.verbose,
        removeAdditional: options.removeAdditional,
        useDefaults: options.useDefaults,
        coerceTypes: options.coerceTypes,
      })

      const valid = ajv(data)

      if (!valid) {
        // Enhance errors with line/column information
        const enhancedErrors = ajv.errors?.map(error => ({
          ...error,
          line: this.getLineForPath(JSON.stringify(data), error.instancePath),
          column: this.getColumnForPath(JSON.stringify(data), error.instancePath),
        }))

        return {
          valid: false,
          errors: enhancedErrors,
        }
      }

      return { valid: true }
    } catch (error) {
      throw new JsonSchemaError(
        `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        []
      )
    }
  }

  /**
   * Apply custom validation rules
   */
  private async applyCustomRules(
    data: any,
    _schema: any | null,
    _options: JsonValidationOptions
  ): Promise<{
    errors?: any[]
    warnings?: any[]
    rulesApplied: number
  }> {
    const errors: any[] = []
    const warnings: any[] = []
    let rulesApplied = 0

    // Get rules sorted by priority
    const sortedRules = Array.from(this.customRules.values()).sort(
      (a, b) => b.priority - a.priority
    )

    for (const rule of sortedRules) {
      try {
        if (typeof rule.validator === 'function') {
          const result = rule.validator(data)
          if (typeof result === 'boolean') {
            if (!result) {
              errors.push({
                keyword: rule.name,
                instancePath: '',
                schemaPath: '',
                message: rule.errorMessage || `Custom validation failed for ${rule.name}`,
                params: {},
                data,
              })
            }
          } else if (result && typeof result === 'object') {
            if (result.errors) {
              errors.push(...result.errors)
            }
            if (result.warnings) {
              warnings.push(...result.warnings)
            }
          }
          rulesApplied++
        }
      } catch (error) {
        errors.push({
          keyword: rule.name,
          instancePath: '',
          schemaPath: '',
          message: `Custom rule ${rule.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          params: {},
          data,
        })
      }
    }

    return {
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      rulesApplied,
    }
  }

  /**
   * Combine schema validation and custom rule results
   */
  private combineResults(
    schemaResult: { valid: boolean; errors?: any[] },
    customRuleResult: {
      errors?: any[]
      warnings?: any[]
      rulesApplied: number
    },
    metrics: any
  ): JsonValidationResult {
    const allErrors = [...(schemaResult.errors || []), ...(customRuleResult.errors || [])]

    const errorCount = allErrors.length
    const warningCount = customRuleResult.warnings?.length || 0

    return {
      valid: schemaResult.valid && errorCount === 0,
      errors: errorCount > 0 ? allErrors : undefined,
      warnings: warningCount > 0 ? customRuleResult.warnings : undefined,
      metadata: {
        ...metrics,
        errorCount,
        warningCount,
        depth: 0, // Would be calculated from data
        customRulesApplied: customRuleResult.rulesApplied,
      },
    }
  }

  /**
   * Calculate maximum depth of JSON data
   */
  private calculateDepth(data: any, currentDepth = 0): number {
    if (data === null || typeof data !== 'object') {
      return currentDepth
    }

    if (Array.isArray(data)) {
      return Math.max(...data.map(item => this.calculateDepth(item, currentDepth + 1)))
    }

    return Math.max(
      ...Object.values(data).map(value => this.calculateDepth(value, currentDepth + 1))
    )
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
      line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
      column: columnMatch ? parseInt(columnMatch[1], 10) : undefined,
      position: positionMatch ? parseInt(positionMatch[1], 10) : undefined,
    }
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
   * Get line number for a JSON path
   */
  private getLineForPath(jsonString: string, _path: string): number | undefined {
    try {
      const _lines = jsonString.split('\n')
      // This is a simplified implementation
      // A more robust implementation would parse the JSON and track positions
      return 1
    } catch {
      return undefined
    }
  }

  /**
   * Get column number for a JSON path
   */
  private getColumnForPath(_jsonString: string, _path: string): number | undefined {
    try {
      // This is a simplified implementation
      // A more robust implementation would parse the JSON and track positions
      return 1
    } catch {
      return undefined
    }
  }

  /**
   * Add default custom validation rules
   */
  private async addDefaultCustomRules(): Promise<void> {
    // Add common validation rules
    await this.addCustomRule({
      name: 'noXss',
      description: 'Prevent XSS attacks by checking for dangerous patterns',
      priority: 10,
      validator: (data: any) => {
        const jsonString = JSON.stringify(data)
        const xssPatterns = [/<script/i, /javascript:/i, /vbscript:/i, /onload=/i, /onerror=/i]
        return !xssPatterns.some(pattern => pattern.test(jsonString))
      },
      errorMessage: 'Data contains potentially dangerous content',
    })

    await this.addCustomRule({
      name: 'reasonableDepth',
      description: 'Ensure JSON depth is reasonable',
      priority: 8,
      validator: (data: any) => {
        return this.calculateDepth(data) <= 50
      },
      errorMessage: 'JSON structure is too deeply nested',
    })

    await this.addCustomRule({
      name: 'noCircularReferences',
      description: 'Check for circular references',
      priority: 9,
      validator: (data: any) => {
        const seen = new WeakSet()
        return this.checkCircularReferences(data, seen)
      },
      errorMessage: 'Circular reference detected',
    })
  }

  /**
   * Check for circular references
   */
  private checkCircularReferences(obj: any, seen: WeakSet<object>): boolean {
    if (obj === null || typeof obj !== 'object') {
      return true
    }

    if (seen.has(obj)) {
      return false
    }

    seen.add(obj)

    if (Array.isArray(obj)) {
      return obj.every(item => this.checkCircularReferences(item, seen))
    }

    return Object.values(obj).every(value => this.checkCircularReferences(value, seen))
  }

  /**
   * Get performance metrics for the last operation
   */
  getMetrics(): ValidationMetrics {
    // This would be implemented with actual performance monitoring
    return {
      validationTime: 0,
      parsingTime: 0,
      totalTime: 0,
      memoryUsage: 0,
    }
  }

  /**
   * Configure maximum input/schema sizes
   */
  setLimits(maxInputSize: number, maxSchemaSize: number): void {
    this.maxInputSize = maxInputSize
    this.maxSchemaSize = maxSchemaSize
  }

  /**
   * Check if the validator is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Get list of registered custom rules
   */
  getCustomRules(): CustomValidationRule[] {
    return Array.from(this.customRules.values())
  }

  /**
   * Get list of registered schemas
   */
  getSchemas(): any[] {
    return Array.from(this.schemas.values())
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // TODO: Add WASM module cleanup when available
    this.wasmModule = null
    this.ajvInstance = null
    this.customRules.clear()
    this.schemas.clear()
    this.isInitialized = false
  }
}

// Export singleton instance
export const jsonValidator = new JsonValidator()

// Export utility functions
export async function validateJson(
  jsonData: any,
  schema: any,
  options?: Partial<JsonValidationOptions>
): Promise<JsonValidationResult> {
  return jsonValidator.validate(jsonData, schema, options)
}

export async function validateJsonSyntax(
  jsonData: string,
  options?: Partial<JsonValidationOptions>
): Promise<JsonValidationResult> {
  return jsonValidator.validateSyntax(jsonData, options)
}

export async function validateWithSchema(
  jsonData: any,
  schemaId: string,
  options?: Partial<JsonValidationOptions>
): Promise<JsonValidationResult> {
  // This would use a pre-registered schema
  const schema = jsonValidator.getSchemas().find(s => s.$id === schemaId)
  if (!schema) {
    throw new JsonValidationError(`Schema with ID ${schemaId} not found`, 'SCHEMA_NOT_FOUND')
  }
  return jsonValidator.validate(jsonData, schema, options)
}

export async function addSchema(schema: any): Promise<void> {
  jsonValidator.addSchema(schema)
}

export async function addCustomRule(rule: CustomValidationRule): Promise<void> {
  return jsonValidator.addCustomRule(rule)
}
