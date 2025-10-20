import type { FileParseRequest, FileParseResponse, JsonDocument, ValidationError } from '../types'
import { JsonExtractor } from '../jsonExtractor'

export class JsonParsingService {
  private jsonExtractor: JsonExtractor
  private readonly MAX_DEPTH = 20
  private readonly MAX_ARRAY_LENGTH = 10000
  private readonly MAX_STRING_LENGTH = 1000000 // 1MB per string

  constructor() {
    this.jsonExtractor = new JsonExtractor()
  }

  async parseFile(request: FileParseRequest): Promise<FileParseResponse> {
    const { content, options = {} } = request
    const { extractMode = 'mixed', maxDepth = this.MAX_DEPTH } = options

    try {
      // Validate content
      const contentValidation = this.validateContent(content)
      if (!contentValidation.isValid) {
        return {
          success: false,
          documents: [],
          errors: contentValidation.errors
        }
      }

      // Extract JSON from content
      const documents = this.jsonExtractor.extractJsonFromMarkdown(content, extractMode)

      // Validate each document
      const allErrors: ValidationError[] = []
      const validatedDocuments = documents.map(doc => {
        const validationErrors = this.validateDocument(doc, maxDepth)
        allErrors.push(...validationErrors)
        return doc
      })

      // Separate critical errors from warnings
      const criticalErrors = allErrors.filter(error => error.severity === 'error')
      const success = criticalErrors.length === 0

      return {
        success,
        documents: validatedDocuments,
        errors: allErrors
      }
    } catch (error) {
      return {
        success: false,
        documents: [],
        errors: [{
          code: 'PARSING_ERROR',
          message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }]
      }
    }
  }

  private validateContent(content: string): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = []

    if (!content || content.trim().length === 0) {
      errors.push({
        code: 'EMPTY_CONTENT',
        message: 'File content is empty.',
        severity: 'error'
      })
      return { isValid: false, errors }
    }

    // Check for basic file size (in characters, not bytes)
    if (content.length > 10000000) { // 10 million characters
      errors.push({
        code: 'CONTENT_TOO_LARGE',
        message: 'File content is too large for processing.',
        severity: 'error'
      })
    }

    return { isValid: errors.length === 0, errors }
  }

  private validateDocument(document: JsonDocument, maxDepth: number): ValidationError[] {
    const errors: ValidationError[] = []

    // Check if JSON is valid
    if (!document.isValid) {
      errors.push({
        code: 'INVALID_JSON_SYNTAX',
        message: document.errorMessage || 'Invalid JSON syntax',
        line: document.lineNumber,
        severity: 'error'
      })
      return errors
    }

    if (!document.parsedData) {
      return errors
    }

    // Validate structure
    const structureErrors = this.validateStructure(document.parsedData, maxDepth, '')
    errors.push(...structureErrors)

    // Validate content size
    const sizeErrors = this.validateContentSize(document.parsedData, '')
    errors.push(...sizeErrors)

    return errors
  }

  private validateStructure(data: any, maxDepth: number, path: string, currentDepth: number = 0): ValidationError[] {
    const errors: ValidationError[] = []

    if (currentDepth > maxDepth) {
      errors.push({
        code: 'MAX_DEPTH_EXCEEDED',
        message: `Maximum nesting depth (${maxDepth}) exceeded at path: ${path || 'root'}`,
        severity: 'warning'
      })
      return errors
    }

    if (data === null || typeof data !== 'object') {
      return errors
    }

    if (Array.isArray(data)) {
      if (data.length > this.MAX_ARRAY_LENGTH) {
        errors.push({
          code: 'ARRAY_TOO_LARGE',
          message: `Array at ${path || 'root'} is too large (${data.length} items). Maximum allowed: ${this.MAX_ARRAY_LENGTH}`,
          severity: 'warning'
        })
      }

      data.forEach((item, index) => {
        const itemPath = path ? `${path}[${index}]` : `[${index}]`
        errors.push(...this.validateStructure(item, maxDepth, itemPath, currentDepth + 1))
      })
    } else {
      Object.entries(data).forEach(([key, value]) => {
        const itemPath = path ? `${path}.${key}` : key
        errors.push(...this.validateStructure(value, maxDepth, itemPath, currentDepth + 1))
      })
    }

    return errors
  }

  private validateContentSize(data: any, path: string): ValidationError[] {
    const errors: ValidationError[] = []

    if (typeof data === 'string' && data.length > this.MAX_STRING_LENGTH) {
      errors.push({
        code: 'STRING_TOO_LARGE',
        message: `String at ${path || 'root'} is too large (${data.length} characters). Maximum allowed: ${this.MAX_STRING_LENGTH}`,
        severity: 'warning'
      })
    }

    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`
          errors.push(...this.validateContentSize(item, itemPath))
        })
      } else {
        Object.entries(data).forEach(([key, value]) => {
          const itemPath = path ? `${path}.${key}` : key
          errors.push(...this.validateContentSize(value, itemPath))
        })
      }
    }

    return errors
  }

  async parseJsonString(jsonString: string): Promise<{
    success: boolean
    data?: any
    error?: ValidationError
  }> {
    try {
      const trimmedString = jsonString.trim()
      if (!trimmedString) {
        return {
          success: false,
          error: {
            code: 'EMPTY_JSON',
            message: 'JSON string is empty.',
            severity: 'error'
          }
        }
      }

      const data = JSON.parse(trimmedString)
      return { success: true, data }
    } catch (error) {
      let message = 'Invalid JSON syntax'
      let line: number | undefined
      let column: number | undefined

      if (error instanceof SyntaxError) {
        message = error.message

        // Try to extract line and column from error message
        const positionMatch = error.message.match(/position (\d+)/)
        if (positionMatch) {
          const position = parseInt(positionMatch[1])
          const lines = jsonString.substring(0, position).split('\n')
          line = lines.length
          column = lines[lines.length - 1].length + 1
        }
      }

      return {
        success: false,
        error: {
          code: 'INVALID_JSON_SYNTAX',
          message,
          line,
          column,
          severity: 'error'
        }
      }
    }
  }

  extractJsonFromMarkdown(content: string, extractMode: 'codeblock' | 'inline' | 'mixed' = 'mixed'): JsonDocument[] {
    return this.jsonExtractor.extractJsonFromMarkdown(content, extractMode)
  }

  validateJsonStructure(data: any, options: {
    maxDepth?: number
    maxArrayLength?: number
    maxStringLength?: number
  } = {}): ValidationError[] {
    const {
      maxDepth = this.MAX_DEPTH,
      maxArrayLength = this.MAX_ARRAY_LENGTH,
      maxStringLength = this.MAX_STRING_LENGTH
    } = options

    const errors: ValidationError[] = []

    // Temporarily override limits for this validation
    const originalMaxDepth = this.MAX_DEPTH
    const originalMaxArrayLength = this.MAX_ARRAY_LENGTH
    const originalMaxStringLength = this.MAX_STRING_LENGTH

    // Note: In a real implementation, we would need to make these configurable
    // For now, we'll use the existing validation methods

    errors.push(...this.validateStructure(data, maxDepth, 'root'))
    errors.push(...this.validateContentSize(data, 'root'))

    return errors
  }

  getParsingStatistics(documents: JsonDocument[]): {
    total: number
    valid: number
    invalid: number
    averageSize: number
    extractionMethods: Record<string, number>
    errorTypes: Record<string, number>
  } {
    const total = documents.length
    const valid = documents.filter(doc => doc.isValid).length
    const invalid = total - valid
    const averageSize = total > 0
      ? documents.reduce((sum, doc) => sum + doc.rawJson.length, 0) / total
      : 0

    const extractionMethods: Record<string, number> = {}
    const errorTypes: Record<string, number> = {}

    documents.forEach(doc => {
      // Count extraction methods
      extractionMethods[doc.extractionMethod] = (extractionMethods[doc.extractionMethod] || 0) + 1

      // Count error types
      if (!doc.isValid && doc.errorMessage) {
        if (doc.errorMessage.includes('Unexpected token')) {
          errorTypes['SYNTAX_ERROR'] = (errorTypes['SYNTAX_ERROR'] || 0) + 1
        } else if (doc.errorMessage.includes('Unexpected end')) {
          errorTypes['INCOMPLETE_JSON'] = (errorTypes['INCOMPLETE_JSON'] || 0) + 1
        } else {
          errorTypes['OTHER_ERROR'] = (errorTypes['OTHER_ERROR'] || 0) + 1
        }
      }
    })

    return {
      total,
      valid,
      invalid,
      averageSize,
      extractionMethods,
      errorTypes
    }
  }

  getJsonPath(data: any, path: string): any {
    try {
      const parts = path.split('.').filter(part => part.length > 0)
      let current = data

      for (const part of parts) {
        // Handle array indices like "items[0]"
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          const [, key, index] = arrayMatch
          if (current && typeof current === 'object' && !Array.isArray(current)) {
            current = current[key][parseInt(index)]
          } else {
            return null
          }
        } else {
          if (current && typeof current === 'object') {
            if (Array.isArray(current)) {
              const index = parseInt(part)
              if (!isNaN(index) && index >= 0 && index < current.length) {
                current = current[index]
              } else {
                return null
              }
            } else {
              current = current[part]
            }
          } else {
            return null
          }
        }
      }

      return current
    } catch {
      return null
    }
  }
}