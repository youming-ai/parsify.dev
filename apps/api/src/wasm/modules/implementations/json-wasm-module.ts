import { handleWasmError } from '../core/wasm-error-handler'
import type {
  IJsonWasmModule,
  JsonConversionOptions,
  JsonFilter,
  JsonFormatOptions,
  JsonTargetFormat,
  JsonTransformation,
} from '../interfaces/json-module.interface'
import type {
  WasmModuleHealth,
  WasmModuleMetadata,
  WasmModuleResult,
} from '../interfaces/wasm-module.interface'

/**
 * JSON processing WASM module implementation
 *
 * This module provides high-performance JSON operations using WebAssembly.
 * Currently uses native JavaScript as a fallback until WASM implementation is ready.
 */
export class JsonWasmModule implements IJsonWasmModule {
  private _initialized = false
  private _metadata: WasmModuleMetadata
  private wasmModule: any = null
  private executionCount = 0
  private lastUsedAt?: Date
  private createdAt: Date
  private totalExecutionTime = 0

  constructor() {
    this.createdAt = new Date()
    this._metadata = this.createMetadata()
  }

  // Base module interface implementation
  get id(): string {
    return 'json-processor'
  }

  get name(): string {
    return 'JSON Processor'
  }

  get version(): string {
    return '1.0.0'
  }

  get description(): string {
    return 'High-performance JSON processing module with validation, formatting, and transformation capabilities'
  }

  get category(): string {
    return 'json'
  }

  get authors(): string[] {
    return ['Parsify Team']
  }

  get dependencies(): string[] {
    return [] // No dependencies for base JSON processing
  }

  get apiVersion(): string {
    return '1.0.0'
  }

  async isCompatible(): Promise<boolean> {
    // Check for required WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      return false
    }

    // Check for required APIs
    const requiredApis = ['TextEncoder', 'TextDecoder', 'JSON']
    for (const api of requiredApis) {
      if (!(api in globalThis)) {
        return false
      }
    }

    return true
  }

  async initialize(config?: any): Promise<void> {
    if (this._initialized) {
      return
    }

    try {
      // Initialize WASM module if available
      await this.initializeWasmModule(config)
      this._initialized = true
      console.log('JSON WASM module initialized successfully')
    } catch (error) {
      console.warn(
        'Failed to initialize WASM module, falling back to native implementation:',
        error
      )
      this._initialized = true
    }
  }

  private async initializeWasmModule(_config?: any): Promise<void> {
    // TODO: Initialize actual WASM module when available
    // For now, use native implementation as fallback
    this.wasmModule = {
      // Mock WASM module interface
      formatJson: this.formatJsonNative.bind(this),
      validateJson: this.validateJsonNative.bind(this),
      analyzeJson: this.analyzeJsonNative.bind(this),
    }
  }

  isInitialized(): boolean {
    return this._initialized
  }

  getMetadata(): WasmModuleMetadata {
    return {
      ...this._metadata,
      initializedAt: this._initialized ? this.createdAt : undefined,
      lastUsedAt: this.lastUsedAt,
      executionCount: this.executionCount,
      memoryUsage: 0, // This would be measured from WASM
      loadTime: 0, // This would be measured during loading
      size: 0, // This would be the WASM file size
      checksum: '', // This would be calculated from WASM file
      supportedFormats: ['json', 'json5', 'jsonc'],
      capabilities: [
        'formatting',
        'validation',
        'analysis',
        'conversion',
        'transformation',
        'filtering',
        'sorting',
      ],
      limitations: [
        'Maximum input size: 100MB',
        'Maximum depth: 1000 levels',
        'Limited by available memory',
      ],
    }
  }

  async execute(input: any, options?: any): Promise<WasmModuleResult> {
    if (!this._initialized) {
      throw new Error('Module is not initialized')
    }

    const startTime = performance.now()
    this.executionCount++
    this.lastUsedAt = new Date()

    try {
      // Determine operation based on input
      const operation = options?.operation || 'format'

      let result: any
      switch (operation) {
        case 'format':
          result = await this.formatJson(input.json, input.options)
          break
        case 'validate':
          result = await this.validateJson(input.json, input.schema)
          break
        case 'analyze':
          result = await this.analyzeJson(input.json)
          break
        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }

      const executionTime = performance.now() - startTime
      this.totalExecutionTime += executionTime

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
          memoryUsage: 0, // This would be measured from WASM
          outputSize: JSON.stringify(result).length,
          processedItems: 1,
        },
      }
    } catch (error) {
      const errorInfo = handleWasmError(error as Error, {
        moduleId: this.id,
        operation: 'execute',
        input,
        configuration: options,
      })

      return {
        success: false,
        error: {
          code: errorInfo.error.code,
          message: errorInfo.error.message,
          details: errorInfo.error.details,
          recoverable: errorInfo.classification.recoverable,
          suggestions: errorInfo.error.suggestions,
        },
      }
    }
  }

  async dispose(): Promise<void> {
    if (!this._initialized) {
      return
    }

    try {
      // Dispose WASM module if loaded
      if (this.wasmModule?.dispose) {
        this.wasmModule.dispose()
      }

      this.wasmModule = null
      this._initialized = false
      console.log('JSON WASM module disposed')
    } catch (error) {
      console.warn('Error during module disposal:', error)
    }
  }

  async getHealth(): Promise<WasmModuleHealth> {
    const now = new Date()
    const uptime = this._initialized ? now.getTime() - this.createdAt.getTime() : 0

    return {
      status: this._initialized ? 'healthy' : 'unhealthy',
      lastCheck: now,
      responseTime: this.executionCount > 0 ? this.totalExecutionTime / this.executionCount : 0,
      memoryUsage: 0, // This would be measured from WASM
      errorRate: 0, // This would be calculated from error history
      uptime,
      details: {
        executionCount: this.executionCount,
        averageExecutionTime:
          this.executionCount > 0 ? this.totalExecutionTime / this.executionCount : 0,
        lastUsedAt: this.lastUsedAt,
        wasmLoaded: this.wasmModule !== null,
      },
    }
  }

  // JSON-specific interface implementation
  async formatJson(json: string, options: JsonFormatOptions = {}): Promise<WasmModuleResult> {
    if (!this._initialized) {
      throw new Error('Module is not initialized')
    }

    const _startTime = performance.now()

    try {
      if (this.wasmModule?.formatJson) {
        // Use WASM implementation if available
        return await this.wasmModule.formatJson(json, options)
      } else {
        // Use native implementation
        return await this.formatJsonNative(json, options)
      }
    } catch (error) {
      const errorInfo = handleWasmError(error as Error, {
        moduleId: this.id,
        operation: 'formatJson',
        input: { json, options },
      })

      return {
        success: false,
        error: {
          code: errorInfo.error.code,
          message: errorInfo.error.message,
          details: errorInfo.error.details,
          recoverable: errorInfo.classification.recoverable,
          suggestions: errorInfo.error.suggestions,
        },
      }
    }
  }

  private async formatJsonNative(
    json: string,
    options: JsonFormatOptions = {}
  ): Promise<WasmModuleResult> {
    const startTime = performance.now()

    try {
      // Input validation
      if (typeof json !== 'string') {
        throw new Error('Input must be a string')
      }

      // Parse JSON
      let parsed: any
      try {
        parsed = JSON.parse(json)
      } catch (parseError) {
        throw new Error(
          `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        )
      }

      // Apply transformations
      const transformed = this.applyJsonTransformations(parsed, options)

      // Format JSON
      const indent = options.compact ? 0 : options.indent || 2
      const _sortKeys = options.sortKeys || false
      const replacer = options.replacer

      let formatted = JSON.stringify(transformed, replacer, indent)

      // Apply additional formatting options
      if (options.insertFinalNewline && !formatted.endsWith('\n')) {
        formatted += '\n'
      }

      if (options.ensureAscii) {
        formatted = this.escapeNonAscii(formatted)
      }

      const executionTime = performance.now() - startTime

      return {
        success: true,
        data: {
          formatted,
          original: json,
          originalSize: json.length,
          formattedSize: formatted.length,
          compressionRatio: json.length > 0 ? formatted.length / json.length : 1,
          valid: true,
          errors: null,
        },
        metadata: {
          executionTime,
          memoryUsage: 0,
          outputSize: formatted.length,
          processedItems: 1,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FORMAT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check JSON syntax', 'Verify input format'],
        },
      }
    }
  }

  async validateJson(json: string, schema?: any): Promise<WasmModuleResult> {
    if (!this._initialized) {
      throw new Error('Module is not initialized')
    }

    try {
      if (this.wasmModule?.validateJson) {
        return await this.wasmModule.validateJson(json, schema)
      } else {
        return await this.validateJsonNative(json, schema)
      }
    } catch (error) {
      const errorInfo = handleWasmError(error as Error, {
        moduleId: this.id,
        operation: 'validateJson',
        input: { json, schema },
      })

      return {
        success: false,
        error: {
          code: errorInfo.error.code,
          message: errorInfo.error.message,
          details: errorInfo.error.details,
          recoverable: errorInfo.classification.recoverable,
          suggestions: errorInfo.error.suggestions,
        },
      }
    }
  }

  private async validateJsonNative(json: string, schema?: any): Promise<WasmModuleResult> {
    try {
      let parsed: any
      let valid = true
      let errors: string[] = []

      // Parse JSON
      try {
        parsed = JSON.parse(json)
      } catch (parseError) {
        valid = false
        errors.push(parseError instanceof Error ? parseError.message : 'Invalid JSON syntax')
      }

      // Validate against schema if provided
      if (valid && schema) {
        const validationResult = this.validateAgainstSchema(parsed, schema)
        valid = validationResult.valid
        errors = errors.concat(validationResult.errors || [])
      }

      return {
        success: true,
        data: {
          valid,
          errors: errors.length > 0 ? errors : null,
          data: valid ? parsed : null,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check JSON syntax', 'Verify schema format'],
        },
      }
    }
  }

  async minifyJson(json: string): Promise<WasmModuleResult> {
    return this.formatJson(json, { compact: true })
  }

  async prettifyJson(json: string, options: JsonFormatOptions = {}): Promise<WasmModuleResult> {
    return this.formatJson(json, {
      indent: 2,
      sortKeys: false,
      ...options,
      compact: false,
    })
  }

  async convertJson(
    json: string,
    targetFormat: JsonTargetFormat,
    options: JsonConversionOptions = {}
  ): Promise<WasmModuleResult> {
    try {
      const parsed = JSON.parse(json)

      let converted: string
      switch (targetFormat) {
        case 'yaml':
          converted = this.convertToYaml(parsed, options)
          break
        case 'xml':
          converted = this.convertToXml(parsed, options)
          break
        case 'csv':
          converted = this.convertToCsv(parsed, options)
          break
        case 'properties':
          converted = this.convertToProperties(parsed, options)
          break
        default:
          throw new Error(`Unsupported target format: ${targetFormat}`)
      }

      return {
        success: true,
        data: {
          converted,
          format: targetFormat,
          original: json,
          options,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONVERSION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check input format', 'Verify target format support'],
        },
      }
    }
  }

  async extractJsonData(json: string, path: string): Promise<WasmModuleResult> {
    try {
      const parsed = JSON.parse(json)
      const extracted = this.extractByPath(parsed, path)

      return {
        success: true,
        data: {
          extracted,
          path,
          found: extracted !== undefined,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check JSONPath syntax', 'Verify path exists'],
        },
      }
    }
  }

  async mergeJsonObjects(objects: any[], strategy = 'merge'): Promise<WasmModuleResult> {
    try {
      let merged: any = {}

      for (const obj of objects) {
        switch (strategy) {
          case 'overwrite':
            merged = { ...merged, ...obj }
            break
          case 'merge':
            merged = this.deepMerge(merged, obj)
            break
          case 'append':
            merged = this.appendMerge(merged, obj)
            break
          default:
            throw new Error(`Unsupported merge strategy: ${strategy}`)
        }
      }

      return {
        success: true,
        data: {
          merged,
          strategy,
          objectCount: objects.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MERGE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check object types', 'Verify merge strategy'],
        },
      }
    }
  }

  async compareJson(json1: string, json2: string, options: any = {}): Promise<WasmModuleResult> {
    try {
      const parsed1 = JSON.parse(json1)
      const parsed2 = JSON.parse(json2)

      const differences = this.compareObjects(parsed1, parsed2, options)

      return {
        success: true,
        data: {
          identical: differences.length === 0,
          differences,
          options,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPARISON_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check JSON syntax', 'Verify comparison options'],
        },
      }
    }
  }

  async sortJsonKeys(json: string, options: any = {}): Promise<WasmModuleResult> {
    try {
      const parsed = JSON.parse(json)
      const sorted = this.sortKeys(parsed, options)

      return {
        success: true,
        data: {
          sorted,
          original: json,
          options,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check JSON syntax', 'Verify sort options'],
        },
      }
    }
  }

  async filterJson(json: string, filter: JsonFilter): Promise<WasmModuleResult> {
    try {
      const parsed = JSON.parse(json)
      const filtered = this.applyFilter(parsed, filter)

      return {
        success: true,
        data: {
          filtered,
          originalCount: this.countItems(parsed),
          filteredCount: this.countItems(filtered),
          filter,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILTER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check filter criteria', 'Verify JSON structure'],
        },
      }
    }
  }

  async transformJson(json: string, transformation: JsonTransformation): Promise<WasmModuleResult> {
    try {
      const parsed = JSON.parse(json)
      const transformed = this.applyTransformation(parsed, transformation)

      return {
        success: true,
        data: {
          transformed,
          original: json,
          transformation,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSFORMATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check transformation rules', 'Verify JSON structure'],
        },
      }
    }
  }

  async analyzeJson(json: string): Promise<WasmModuleResult> {
    if (this.wasmModule?.analyzeJson) {
      return await this.wasmModule.analyzeJson(json)
    } else {
      return await this.analyzeJsonNative(json)
    }
  }

  private async analyzeJsonNative(json: string): Promise<WasmModuleResult> {
    try {
      const parsed = JSON.parse(json)
      const analysis = this.analyzeStructure(parsed)

      return {
        success: true,
        data: {
          valid: true,
          size: json.length,
          maxDepth: analysis.maxDepth,
          keyCount: analysis.keyCount,
          valueCount: analysis.valueCount,
          typeStats: analysis.typeStats,
          uniqueKeys: analysis.uniqueKeys,
          largestStructure: analysis.largestStructure,
          errors: null,
          metrics: {
            parseTime: 0, // This would be measured
            analysisTime: 0, // This would be measured
            memoryUsage: 0, // This would be measured
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          suggestions: ['Check JSON syntax', 'Verify input format'],
        },
      }
    }
  }

  // Helper methods
  private createMetadata(): WasmModuleMetadata {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      category: this.category,
      authors: this.authors,
      dependencies: this.dependencies,
      apiVersion: this.apiVersion,
      executionCount: 0,
      memoryUsage: 0,
      loadTime: 0,
      size: 0,
      checksum: '',
      supportedFormats: ['json', 'json5', 'jsonc'],
      capabilities: [
        'formatting',
        'validation',
        'analysis',
        'conversion',
        'transformation',
        'filtering',
        'sorting',
      ],
      limitations: [
        'Maximum input size: 100MB',
        'Maximum depth: 1000 levels',
        'Limited by available memory',
      ],
    }
  }

  private applyJsonTransformations(data: any, options: JsonFormatOptions): any {
    let transformed = data

    if (options.removeNulls || options.removeUndefined) {
      transformed = this.removeNullishValues(transformed, options)
    }

    if (options.truncateLongStrings && options.maxStringLength) {
      transformed = this.truncateLongStrings(transformed, options.maxStringLength)
    }

    return transformed
  }

  private removeNullishValues(data: any, options: JsonFormatOptions): any {
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

  private truncateLongStrings(data: any, maxLength: number): any {
    if (typeof data === 'string' && data.length > maxLength) {
      return `${data.substring(0, maxLength)}... [truncated]`
    }

    if (Array.isArray(data)) {
      return data.map(item => this.truncateLongStrings(item, maxLength))
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.truncateLongStrings(value, maxLength)
      }
      return result
    }

    return data
  }

  private escapeNonAscii(str: string): string {
    return str.replace(/[^\x20-\x7E\n\r\t]/g, char => {
      const code = char.charCodeAt(0)
      return `\\u${code.toString(16).padStart(4, '0')}`
    })
  }

  private validateAgainstSchema(data: any, schema: any): { valid: boolean; errors?: string[] } {
    // This is a simplified schema validation
    // In a real implementation, use a proper schema validator like ajv
    const errors: string[] = []

    if (schema.type && typeof data !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof data}`)
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push(`Missing required property: ${requiredProp}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  private convertToYaml(data: any, options: JsonConversionOptions): string {
    // Simplified YAML conversion
    // In a real implementation, use a proper YAML library
    return JSON.stringify(data, null, options.yamlIndent || 2)
  }

  private convertToXml(data: any, options: JsonConversionOptions): string {
    // Simplified XML conversion
    // In a real implementation, use a proper XML library
    const rootElement = options.rootElement || 'root'
    return this.objectToXml(data, rootElement)
  }

  private objectToXml(obj: any, tagName: string): string {
    if (typeof obj !== 'object' || obj === null) {
      return `<${tagName}>${obj}</${tagName}>`
    }

    let xml = `<${tagName}>`
    for (const [key, value] of Object.entries(obj)) {
      xml += this.objectToXml(value, key)
    }
    xml += `</${tagName}>`
    return xml
  }

  private convertToCsv(data: any, options: JsonConversionOptions): string {
    // Simplified CSV conversion for arrays of objects
    if (!Array.isArray(data)) {
      throw new Error('CSV conversion requires an array of objects')
    }

    if (data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0])
    const delimiter = options.delimiter || ','

    let csv = `${headers.join(delimiter)}\n`

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(delimiter) ? `"${value}"` : value
      })
      csv += `${values.join(delimiter)}\n`
    }

    return csv
  }

  private convertToProperties(data: any, _options: JsonConversionOptions): string {
    // Simplified Java Properties conversion
    let properties = ''

    const flatten = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, fullKey)
        } else {
          properties += `${fullKey}=${value}\n`
        }
      }
    }

    flatten(data)
    return properties
  }

  private extractByPath(data: any, path: string): any {
    // Simplified JSONPath implementation
    const parts = path.split('.')
    let current = data

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[part]
    }

    return current
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target }

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  private appendMerge(target: any, source: any): any {
    const result = { ...target }

    for (const key in source) {
      if (Array.isArray(result[key]) && Array.isArray(source[key])) {
        result[key] = [...result[key], ...source[key]]
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  private compareObjects(obj1: any, obj2: any, _options: any): any[] {
    // Simplified comparison implementation
    const differences: any[] = []

    const compare = (a: any, b: any, path: string): void => {
      if (typeof a !== typeof b) {
        differences.push({
          path,
          type: 'type_mismatch',
          value1: a,
          value2: b,
        })
        return
      }

      if (typeof a === 'object' && a !== null && b !== null) {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)])
        for (const key of keys) {
          compare(a[key], b[key], path ? `${path}.${key}` : key)
        }
      } else if (a !== b) {
        differences.push({
          path,
          type: 'value_mismatch',
          value1: a,
          value2: b,
        })
      }
    }

    compare(obj1, obj2, '')
    return differences
  }

  private sortKeys(data: any, options: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sortKeys(item, options))
    }

    if (typeof data === 'object' && data !== null) {
      const sorted: any = {}
      const keys = Object.keys(data)

      if (options.sortFunction) {
        keys.sort(options.sortFunction)
      } else if (options.naturalSort) {
        keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      } else {
        keys.sort()
      }

      for (const key of keys) {
        if (!options.excludeKeys || !options.excludeKeys.includes(key)) {
          sorted[key] = this.sortKeys(data[key], options)
        }
      }

      return sorted
    }

    return data
  }

  private applyFilter(data: any, filter: JsonFilter): any {
    // Simplified filter implementation
    if (filter.path) {
      return this.extractByPath(data, filter.path)
    }

    if (filter.includeKeys || filter.excludeKeys) {
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const result: any = {}
        for (const [key, value] of Object.entries(data)) {
          const include = !filter.includeKeys || filter.includeKeys.includes(key)
          const exclude = filter.excludeKeys?.includes(key)

          if (include && !exclude) {
            result[key] = this.applyFilter(value, filter)
          }
        }
        return result
      }
    }

    return data
  }

  private applyTransformation(data: any, transformation: JsonTransformation): any {
    let result = data

    for (const operation of transformation.operations) {
      result = this.applyOperation(result, operation)
    }

    return result
  }

  private applyOperation(data: any, operation: any): any {
    // Simplified operation implementation
    switch (operation.type) {
      case 'rename':
        if (typeof data === 'object' && data !== null) {
          const result: any = {}
          for (const [key, value] of Object.entries(data)) {
            const newKey = key === operation.target ? operation.value || operation.source : key
            result[newKey] = value
          }
          return result
        }
        break

      case 'delete':
        if (typeof data === 'object' && data !== null) {
          const result = { ...data }
          delete result[operation.target]
          return result
        }
        break

      case 'modify':
        if (typeof data === 'object' && data !== null && operation.target in data) {
          const result = { ...data }
          result[operation.target] = operation.value
          return result
        }
        break
    }

    return data
  }

  private analyzeStructure(data: any, depth = 0): any {
    const stats = {
      maxDepth: depth,
      keyCount: 0,
      valueCount: 0,
      typeStats: {
        objects: 0,
        arrays: 0,
        strings: 0,
        numbers: 0,
        booleans: 0,
        nulls: 0,
      },
      uniqueKeys: new Set<string>(),
      largestStructure: { type: 'object' as const, path: '', size: 0 },
    }

    if (data === null) {
      stats.typeStats.nulls++
      stats.valueCount++
    } else if (typeof data === 'boolean') {
      stats.typeStats.booleans++
      stats.valueCount++
    } else if (typeof data === 'number') {
      stats.typeStats.numbers++
      stats.valueCount++
    } else if (typeof data === 'string') {
      stats.typeStats.strings++
      stats.valueCount++
    } else if (Array.isArray(data)) {
      stats.typeStats.arrays++
      stats.valueCount++

      if (data.length > stats.largestStructure.size) {
        stats.largestStructure = { type: 'array', path: '', size: data.length }
      }

      for (const item of data) {
        const itemStats = this.analyzeStructure(item, depth + 1)
        stats.maxDepth = Math.max(stats.maxDepth, itemStats.maxDepth)
        stats.keyCount += itemStats.keyCount
        stats.valueCount += itemStats.valueCount
        stats.typeStats.objects += itemStats.typeStats.objects
        stats.typeStats.arrays += itemStats.typeStats.arrays
        stats.typeStats.strings += itemStats.typeStats.strings
        stats.typeStats.numbers += itemStats.typeStats.numbers
        stats.typeStats.booleans += itemStats.typeStats.booleans
        stats.typeStats.nulls += itemStats.typeStats.nulls

        itemStats.uniqueKeys.forEach(key => stats.uniqueKeys.add(key))
      }
    } else if (typeof data === 'object' && data !== null) {
      stats.typeStats.objects++
      stats.valueCount++

      const size = Object.keys(data).length
      if (size > stats.largestStructure.size) {
        stats.largestStructure = { type: 'object', path: '', size }
      }

      for (const [key, value] of Object.entries(data)) {
        stats.keyCount++
        stats.uniqueKeys.add(key)

        const valueStats = this.analyzeStructure(value, depth + 1)
        stats.maxDepth = Math.max(stats.maxDepth, valueStats.maxDepth)
        stats.keyCount += valueStats.keyCount
        stats.valueCount += valueStats.valueCount
        stats.typeStats.objects += valueStats.typeStats.objects
        stats.typeStats.arrays += valueStats.typeStats.arrays
        stats.typeStats.strings += valueStats.typeStats.strings
        stats.typeStats.numbers += valueStats.typeStats.numbers
        stats.typeStats.booleans += valueStats.typeStats.booleans
        stats.typeStats.nulls += valueStats.typeStats.nulls

        valueStats.uniqueKeys.forEach(key => stats.uniqueKeys.add(key))
      }
    }

    return {
      ...stats,
      uniqueKeys: Array.from(stats.uniqueKeys),
    }
  }

  private countItems(data: any): number {
    if (Array.isArray(data)) {
      return data.length
    } else if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length
    }
    return 1
  }
}

// Export singleton instance
export const jsonWasmModule = new JsonWasmModule()
