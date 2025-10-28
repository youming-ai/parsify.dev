import { JsonExtractor } from './jsonExtractor'
import { JsonFileModel } from './models/JsonFile'
import type { JsonDocument, JsonFile, ValidationError } from './types'

export class FileParser {
  private jsonExtractor: JsonExtractor

  constructor() {
    this.jsonExtractor = new JsonExtractor()
  }

  async parseFile(file: File): Promise<{
    jsonFile: JsonFile
    documents: JsonDocument[]
    errors: ValidationError[]
  }> {
    try {
      const jsonFile = await JsonFileModel.fromFile(file)
      const errors = jsonFile.validate()
      let documents: JsonDocument[] = []

      // Only extract JSON if file passes basic validation
      if (jsonFile.isValid()) {
        documents = this.jsonExtractor.extractJsonFromMarkdown(jsonFile.content, 'mixed')
      }

      return {
        jsonFile,
        documents,
        errors,
      }
    } catch (error) {
      return {
        jsonFile: {
          name: file.name,
          content: '',
          size: file.size,
          lastModified: new Date(file.lastModified),
          type: file.name.toLowerCase().endsWith('.md') ? 'markdown' : 'text',
        },
        documents: [],
        errors: [
          {
            code: 'FILE_READ_ERROR',
            message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ],
      }
    }
  }

  validateFile(file: File): {
    isValid: boolean
    errors: ValidationError[]
  } {
    const errors: ValidationError[] = []

    // Check file extension
    const extension = file.name.toLowerCase().split('.').pop()
    if (!['md', 'txt'].includes(extension || '')) {
      errors.push({
        code: 'UNSUPPORTED_FORMAT',
        message: `Unsupported file format: .${extension}. Only .md and .txt files are supported.`,
        severity: 'error',
      })
    }

    // Check file size (1MB limit)
    const maxSize = 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size (${Math.round(file.size / 1024)}KB) exceeds 1MB limit.`,
        severity: 'error',
      })
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      errors.push({
        code: 'INVALID_FILENAME',
        message: 'File name is empty or invalid.',
        severity: 'error',
      })
    }

    return {
      isValid: errors.filter(error => error.severity === 'error').length === 0,
      errors,
    }
  }

  async extractJsonFromContent(
    content: string,
    extractMode: 'codeblock' | 'inline' | 'mixed' = 'mixed'
  ): Promise<{
    documents: JsonDocument[]
    errors: ValidationError[]
  }> {
    try {
      const documents = this.jsonExtractor.extractJsonFromMarkdown(content, extractMode)
      const errors: ValidationError[] = []

      // Add validation errors for invalid JSON documents
      documents.forEach(doc => {
        if (!doc.isValid) {
          errors.push({
            code: 'INVALID_JSON_SYNTAX',
            message: doc.errorMessage || 'Invalid JSON syntax',
            line: doc.lineNumber,
            severity: 'error',
          })
        }
      })

      return { documents, errors }
    } catch (error) {
      return {
        documents: [],
        errors: [
          {
            code: 'EXTRACTION_ERROR',
            message: `Failed to extract JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ],
      }
    }
  }

  getFilePreview(file: File, lines: number = 10): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = event => {
        try {
          const content = event.target?.result as string
          const previewLines = content.split('\n').slice(0, lines)
          const preview = previewLines.join('\n')
          resolve(preview)
        } catch (error) {
          reject(
            new Error(
              `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          )
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file for preview'))
      }

      reader.readAsText(file)
    })
  }

  detectJsonExtractionMethod(content: string): 'codeblock' | 'inline' | 'mixed' {
    const hasCodeBlocks = /```json[\s\S]*?```/i.test(content)
    const hasInlineJson = /{[^{}]*}/.test(content) && !hasCodeBlocks

    if (hasCodeBlocks && hasInlineJson) {
      return 'mixed'
    } else if (hasCodeBlocks) {
      return 'codeblock'
    } else if (hasInlineJson) {
      return 'inline'
    }

    return 'mixed' // Default
  }

  async processFiles(files: File[]): Promise<{
    results: Array<{
      file: JsonFile
      documents: JsonDocument[]
      errors: ValidationError[]
    }>
    totalErrors: ValidationError[]
    summary: {
      totalFiles: number
      validFiles: number
      totalDocuments: number
      validDocuments: number
    }
  }> {
    const results = []
    const allErrors: ValidationError[] = []

    for (const file of files) {
      const result = await this.parseFile(file)
      results.push(result)
      allErrors.push(...result.errors)
    }

    const summary = {
      totalFiles: files.length,
      validFiles: results.filter(r => r.jsonFile.isValid()).length,
      totalDocuments: results.reduce((sum, r) => sum + r.documents.length, 0),
      validDocuments: results.reduce(
        (sum, r) => sum + r.documents.filter(d => d.isValid).length,
        0
      ),
    }

    return {
      results,
      totalErrors: allErrors,
      summary,
    }
  }

  sanitizeContent(content: string): string {
    // Remove potentially harmful content
    return content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '') // Remove iframes
      .replace(/javascript:/gi, '') // Remove javascript URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }

  async getFileMetadata(file: File): Promise<{
    name: string
    size: number
    type: string
    lastModified: Date
    encoding?: string
    lineCount?: number
    wordCount?: number
  }> {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type || 'text/plain',
      lastModified: new Date(file.lastModified),
    }

    try {
      const content = await this.readFileContent(file)
      const lines = content.split('\n')
      const words = content.split(/\s+/).filter(word => word.length > 0)

      return {
        ...metadata,
        encoding: 'utf-8',
        lineCount: lines.length,
        wordCount: words.length,
      }
    } catch {
      return metadata
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = event => {
        const content = event.target?.result as string
        resolve(content)
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file content'))
      }

      reader.readAsText(file)
    })
  }
}
