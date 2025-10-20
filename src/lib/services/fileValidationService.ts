import type { FileValidationRequest, FileValidationResponse, ValidationError } from '../types'

export class FileValidationService {
  private readonly MAX_FILE_SIZE = 1024 * 1024 // 1MB
  private readonly SUPPORTED_EXTENSIONS = ['md', 'txt']
  private readonly MAX_FILENAME_LENGTH = 255

  validateFile(request: FileValidationRequest): FileValidationResponse {
    const errors: ValidationError[] = []

    // Validate filename
    this.validateFilename(request.name, errors)

    // Validate file size
    this.validateFileSize(request.size, errors)

    // Validate file type
    this.validateFileType(request.type, errors)

    const isValid = errors.filter(error => error.severity === 'error').length === 0

    return {
      isValid,
      errors
    }
  }

  private validateFilename(name: string, errors: ValidationError[]): void {
    if (!name || name.trim().length === 0) {
      errors.push({
        code: 'EMPTY_FILENAME',
        message: 'Filename cannot be empty.',
        severity: 'error'
      })
      return
    }

    if (name.length > this.MAX_FILENAME_LENGTH) {
      errors.push({
        code: 'FILENAME_TOO_LONG',
        message: `Filename exceeds maximum length of ${this.MAX_FILENAME_LENGTH} characters.`,
        severity: 'error'
      })
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      errors.push({
        code: 'INVALID_FILENAME_CHARACTERS',
        message: 'Filename contains invalid characters: < > : " / \\ | ? *',
        severity: 'error'
      })
    }

    // Check for reserved names (Windows)
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]

    const nameWithoutExt = name.split('.')[0].toUpperCase()
    if (reservedNames.includes(nameWithoutExt)) {
      errors.push({
        code: 'RESERVED_FILENAME',
        message: `Filename "${nameWithoutExt}" is reserved and cannot be used.`,
        severity: 'error'
      })
    }

    // Validate extension
    const extension = name.split('.').pop()?.toLowerCase()
    if (!extension || !this.SUPPORTED_EXTENSIONS.includes(extension)) {
      errors.push({
        code: 'UNSUPPORTED_EXTENSION',
        message: `Unsupported file extension ".${extension}". Supported extensions: ${this.SUPPORTED_EXTENSIONS.map(ext => '.' + ext).join(', ')}`,
        severity: 'error'
      })
    }
  }

  private validateFileSize(size: number, errors: ValidationError[]): void {
    if (size <= 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'File is empty.',
        severity: 'warning'
      })
      return
    }

    if (size > this.MAX_FILE_SIZE) {
      const sizeMB = (size / (1024 * 1024)).toFixed(2)
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size (${sizeMB}MB) exceeds maximum allowed size of 1MB.`,
        severity: 'error'
      })
    }

    // Warn about large files
    const largeFileThreshold = 512 * 1024 // 512KB
    if (size > largeFileThreshold && size <= this.MAX_FILE_SIZE) {
      const sizeKB = Math.round(size / 1024)
      errors.push({
        code: 'LARGE_FILE',
        message: `File is large (${sizeKB}KB). Consider reducing file size for better performance.`,
        severity: 'warning'
      })
    }
  }

  private validateFileType(type: string, errors: ValidationError[]): void {
    if (!type) {
      errors.push({
        code: 'UNKNOWN_FILE_TYPE',
        message: 'File type could not be determined.',
        severity: 'warning'
      })
      return
    }

    const validTypes = ['markdown', 'text']
    if (!validTypes.includes(type)) {
      errors.push({
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `File type "${type}" is not supported.`,
        severity: 'error'
      })
    }
  }

  async validateFileContent(content: string): Promise<{
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationError[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check if content is empty
    if (!content || content.trim().length === 0) {
      errors.push({
        code: 'EMPTY_CONTENT',
        message: 'File content is empty.',
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }

    // Check for JSON content
    const hasJsonContent = this.containsJson(content)
    if (!hasJsonContent) {
      warnings.push({
        code: 'NO_JSON_FOUND',
        message: 'No JSON content found in the file.',
        severity: 'warning'
      })
    }

    // Check for very long lines
    const lines = content.split('\n')
    const maxLineLength = 1000
    const longLines = lines.filter((line, index) => {
      return line.length > maxLineLength
    })

    if (longLines.length > 0) {
      warnings.push({
        code: 'LONG_LINES',
        message: `Found ${longLines.length} line(s) longer than ${maxLineLength} characters. This may affect JSON parsing.`,
        severity: 'warning'
      })
    }

    // Check for potential encoding issues
    const hasHighUnicode = content.split('').some(char => char.charCodeAt(0) > 127)
    if (hasHighUnicode) {
      warnings.push({
        code: 'UNICODE_CHARACTERS',
        message: 'File contains Unicode characters. Ensure proper encoding.',
        severity: 'info'
      })
    }

    // Check for binary content indicators
    const binaryPatterns = [
      /\x00/, // null bytes
      /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/ // control characters
    ]

    const hasBinaryContent = binaryPatterns.some(pattern => pattern.test(content))
    if (hasBinaryContent) {
      errors.push({
        code: 'BINARY_CONTENT',
        message: 'File appears to contain binary content. Only text files are supported.',
        severity: 'error'
      })
    }

    const allErrors = [...errors, ...warnings]
    const isValid = errors.length === 0

    return { isValid, errors, warnings }
  }

  private containsJson(content: string): boolean {
    // Check for JSON code blocks
    const hasCodeBlocks = /```json[\s\S]*?```/i.test(content)

    // Check for inline JSON objects
    const hasInlineJson = /{[^{}]*"[^"]+"\s*:\s*[^{}]*}/.test(content)

    // Check for JSON arrays
    const hasJsonArray = /\[[\s\S]*?\]/.test(content)

    return hasCodeBlocks || hasInlineJson || hasJsonArray
  }

  getValidationSummary(): {
    maxFileSize: number
    supportedExtensions: string[]
    maxFilenameLength: number
  } {
    return {
      maxFileSize: this.MAX_FILE_SIZE,
      supportedExtensions: [...this.SUPPORTED_EXTENSIONS],
      maxFilenameLength: this.MAX_FILENAME_LENGTH
    }
  }

  isFileSizeValid(size: number): boolean {
    return size > 0 && size <= this.MAX_FILE_SIZE
  }

  isExtensionValid(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension ? this.SUPPORTED_EXTENSIONS.includes(extension) : false
  }

  sanitizeFilename(filename: string): string {
    // Remove invalid characters
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_')

    // Remove leading/trailing spaces and dots
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '')

    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'untitled'
    }

    // Ensure it has a valid extension
    const extension = sanitized.split('.').pop()?.toLowerCase()
    if (!extension || !this.SUPPORTED_EXTENSIONS.includes(extension)) {
      sanitized += '.md'
    }

    // Truncate if too long
    if (sanitized.length > this.MAX_FILENAME_LENGTH) {
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
      const ext = sanitized.substring(sanitized.lastIndexOf('.'))
      const maxNameLength = this.MAX_FILENAME_LENGTH - ext.length
      sanitized = nameWithoutExt.substring(0, maxNameLength) + ext
    }

    return sanitized
  }
}