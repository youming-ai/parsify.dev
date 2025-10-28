import type { JsonFile, ValidationError } from '../types'

export class JsonFileModel implements JsonFile {
  name: string
  content: string
  size: number
  lastModified: Date
  type: 'markdown' | 'text'

  constructor(file: File) {
    this.name = file.name
    this.size = file.size
    this.lastModified = new Date(file.lastModified)
    this.type = this.getFileType(file.name)
    this.content = ''
  }

  private getFileType(filename: string): 'markdown' | 'text' {
    const extension = filename.toLowerCase().split('.').pop()
    return extension === 'md' ? 'markdown' : 'text'
  }

  setContent(content: string): void {
    this.content = content
    this.size = content.length
  }

  validate(): ValidationError[] {
    const errors: ValidationError[] = []

    // Check filename
    if (!this.name.match(/\.(md|txt)$/i)) {
      errors.push({
        code: 'UNSUPPORTED_FORMAT',
        message: 'Unsupported file format. Only .md and .txt files are supported.',
        severity: 'error',
      })
    }

    // Check file size (1MB limit)
    const maxSize = 1024 * 1024 // 1MB
    if (this.size > maxSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds 1MB limit. Current size: ${Math.round(this.size / 1024)}KB`,
        severity: 'error',
      })
    }

    // Check if content is empty
    if (this.content.trim().length === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'File is empty or contains only whitespace.',
        severity: 'warning',
      })
    }

    // Check content encoding (basic validation)
    try {
      // Ensure content is valid UTF-8
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const encoded = encoder.encode(this.content)
      const decoded = decoder.decode(encoded)
      if (decoded !== this.content) {
        errors.push({
          code: 'INVALID_ENCODING',
          message: 'File contains invalid UTF-8 characters.',
          severity: 'error',
        })
      }
    } catch {
      errors.push({
        code: 'INVALID_ENCODING',
        message: 'File encoding validation failed.',
        severity: 'error',
      })
    }

    return errors
  }

  isValid(): boolean {
    const errors = this.validate()
    return errors.filter(error => error.severity === 'error').length === 0
  }

  static fromFile(file: File): Promise<JsonFileModel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const jsonFile = new JsonFileModel(file)

      reader.onload = event => {
        try {
          const content = event.target?.result as string
          jsonFile.setContent(content)
          resolve(jsonFile)
        } catch (error) {
          reject(
            new Error(
              `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          )
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file: File reading error'))
      }

      reader.readAsText(file)
    })
  }
}
