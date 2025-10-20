import type { JsonDocument, JsonNode, ValidationError } from '../types'

// Simple ID generator
const generateId = (): string => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export class JsonDocumentModel implements JsonDocument {
  id: string
  rawJson: string
  parsedData: JsonNode | null
  isValid: boolean
  extractionMethod: 'codeblock' | 'inline' | 'mixed'
  errorMessage?: string
  lineNumber?: number

  constructor(
    rawJson: string,
    extractionMethod: 'codeblock' | 'inline' | 'mixed',
    lineNumber?: number
  ) {
    this.id = generateId()
    this.rawJson = rawJson.trim()
    this.extractionMethod = extractionMethod
    this.lineNumber = lineNumber
    this.parsedData = null
    this.isValid = false
    this.errorMessage = undefined

    this.parseJson()
  }

  private parseJson(): void {
    if (this.rawJson.length === 0) {
      this.errorMessage = 'JSON string is empty'
      return
    }

    try {
      this.parsedData = JSON.parse(this.rawJson)
      this.isValid = true
      this.errorMessage = undefined
    } catch (error) {
      this.isValid = false
      this.parsedData = null

      if (error instanceof SyntaxError) {
        // Extract line and column information from error message
        const match = error.message.match(/position (\d+)/)
        const position = match ? parseInt(match[1]) : 0

        // Calculate approximate line and column
        const lines = this.rawJson.substring(0, position).split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1

        this.errorMessage = `Invalid JSON syntax: ${error.message}`
      } else {
        this.errorMessage = `JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  getErrors(): ValidationError[] {
    const errors: ValidationError[] = []

    if (!this.isValid && this.errorMessage) {
      errors.push({
        code: 'INVALID_JSON_SYNTAX',
        message: this.errorMessage,
        line: this.lineNumber,
        severity: 'error'
      })
    }

    return errors
  }

  validateStructure(maxDepth: number = 10): ValidationError[] {
    const errors: ValidationError[] = []

    if (!this.isValid || !this.parsedData) {
      return errors
    }

    const checkDepth = (node: JsonNode, currentDepth: number, path: string): void => {
      if (currentDepth > maxDepth) {
        errors.push({
          code: 'MAX_DEPTH_EXCEEDED',
          message: `Maximum nesting depth (${maxDepth}) exceeded at path: ${path}`,
          severity: 'warning'
        })
        return
      }

      if (node && typeof node === 'object') {
        if (Array.isArray(node)) {
          node.forEach((item, index) => {
            checkDepth(item, currentDepth + 1, `${path}[${index}]`)
          })
        } else {
          Object.entries(node).forEach(([key, value]) => {
            checkDepth(value, currentDepth + 1, `${path}.${key}`)
          })
        }
      }
    }

    checkDepth(this.parsedData, 0, 'root')

    // Check array length
    const checkArrayLength = (node: JsonNode, path: string): void => {
      if (Array.isArray(node)) {
        if (node.length > 10000) {
          errors.push({
            code: 'ARRAY_TOO_LARGE',
            message: `Array at ${path} is too large (${node.length} items). Maximum allowed: 10,000`,
            severity: 'warning'
          })
        }

        node.forEach((item, index) => {
          checkArrayLength(item, `${path}[${index}]`)
        })
      } else if (node && typeof node === 'object') {
        Object.entries(node).forEach(([key, value]) => {
          checkArrayLength(value, `${path}.${key}`)
        })
      }
    }

    checkArrayLength(this.parsedData, 'root')

    return errors
  }

  getPath(jsonPath: string): JsonNode | null {
    if (!this.isValid || !this.parsedData) {
      return null
    }

    try {
      const pathParts = jsonPath.split('.').map(part => {
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          return { key: arrayMatch[1], index: parseInt(arrayMatch[2]) }
        }
        return { key: part, index: null }
      })

      let current: JsonNode = this.parsedData

      for (const part of pathParts) {
        if (current && typeof current === 'object') {
          if (Array.isArray(current)) {
            if (part.index !== null && part.index < current.length) {
              current = current[part.index]
            } else {
              return null
            }
          } else {
            if (part.key in current) {
              current = current[part.key]
            } else {
              return null
            }
          }
        } else {
          return null
        }
      }

      return current
    } catch {
      return null
    }
  }

  static createFromExtraction(
    content: string,
    extractionMethod: 'codeblock' | 'inline' | 'mixed',
    lineNumber?: number
  ): JsonDocumentModel {
    return new JsonDocumentModel(content, extractionMethod, lineNumber)
  }
}