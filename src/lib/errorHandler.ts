import type { ValidationError } from './types'

export class ErrorHandler {
  private static instance: ErrorHandler
  private errors: ValidationError[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private constructor() {}

  logError(error: ValidationError | Error | string, context?: string): void {
    let validationError: ValidationError

    if (typeof error === 'string') {
      validationError = {
        code: 'UNKNOWN_ERROR',
        message: error,
        severity: 'error'
      }
    } else if (error instanceof Error) {
      validationError = {
        code: 'RUNTIME_ERROR',
        message: error.message,
        severity: 'error'
      }
    } else {
      validationError = error
    }

    if (context) {
      validationError.message = `${context}: ${validationError.message}`
    }

    this.errors.push(validationError)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', validationError)
    }
  }

  logWarning(message: string, context?: string): void {
    const warning: ValidationError = {
      code: 'WARNING',
      message: context ? `${context}: ${message}` : message,
      severity: 'warning'
    }

    this.errors.push(warning)

    if (process.env.NODE_ENV === 'development') {
      console.warn('[ErrorHandler]', warning)
    }
  }

  logInfo(message: string, context?: string): void {
    const info: ValidationError = {
      code: 'INFO',
      message: context ? `${context}: ${message}` : message,
      severity: 'info'
    }

    this.errors.push(info)

    if (process.env.NODE_ENV === 'development') {
      console.info('[ErrorHandler]', info)
    }
  }

  getErrors(severity?: 'error' | 'warning' | 'info'): ValidationError[] {
    if (severity) {
      return this.errors.filter(error => error.severity === severity)
    }
    return [...this.errors]
  }

  clearErrors(severity?: 'error' | 'warning' | 'info'): void {
    if (severity) {
      this.errors = this.errors.filter(error => error.severity !== severity)
    } else {
      this.errors = []
    }
  }

  hasErrors(severity?: 'error' | 'warning' | 'info'): boolean {
    if (severity) {
      return this.errors.some(error => error.severity === severity)
    }
    return this.errors.length > 0
  }

  getLastError(): ValidationError | null {
    if (this.errors.length === 0) {
      return null
    }
    return this.errors[this.errors.length - 1]
  }

  getErrorSummary(): {
    total: number
    errors: number
    warnings: number
    info: number
    byCode: Record<string, number>
  } {
    const summary = {
      total: this.errors.length,
      errors: 0,
      warnings: 0,
      info: 0,
      byCode: {} as Record<string, number>
    }

    this.errors.forEach(error => {
      switch (error.severity) {
        case 'error':
          summary.errors++
          break
        case 'warning':
          summary.warnings++
          break
        case 'info':
          summary.info++
          break
      }

      summary.byCode[error.code] = (summary.byCode[error.code] || 0) + 1
    })

    return summary
  }

  // User-friendly error message conversion
  getUserFriendlyMessage(error: ValidationError): string {
    const messageMap: Record<string, string> = {
      'FILE_TOO_LARGE': 'The file is too big. Please choose a file smaller than 1MB.',
      'UNSUPPORTED_FORMAT': 'This file type is not supported. Please use .md or .txt files.',
      'EMPTY_FILE': 'The file is empty. Please choose a file with content.',
      'INVALID_JSON_SYNTAX': 'The JSON format is invalid. Please check for syntax errors.',
      'NO_JSON_FOUND': 'No JSON content was found in the file.',
      'PARSING_ERROR': 'Failed to process the file. Please check the file format.',
      'MAX_DEPTH_EXCEEDED': 'The JSON structure is too complex. Please simplify nested objects.',
      'ARRAY_TOO_LARGE': 'The JSON array is too large. Please reduce the number of items.',
      'STRING_TOO_LARGE': 'The JSON contains very long text. Please shorten it.',
      'EMPTY_CONTENT': 'The file has no content.',
      'CONTENT_TOO_LARGE': 'The file content is too large to process.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
      'RUNTIME_ERROR': 'A technical error occurred. Please refresh the page.',
      'WARNING': 'Please note: ',
      'INFO': 'Information: '
    }

    const baseMessage = messageMap[error.code] || error.message
    return baseMessage
  }

  // Error recovery suggestions
  getRecoverySuggestions(error: ValidationError): string[] {
    const suggestions: Record<string, string[]> = {
      'FILE_TOO_LARGE': [
        'Remove unnecessary content from the file',
        'Split the file into smaller parts',
        'Compress large string values'
      ],
      'UNSUPPORTED_FORMAT': [
        'Convert the file to .md or .txt format',
        'Copy the JSON content into a markdown file',
        'Use a text editor to save the file with the correct extension'
      ],
      'EMPTY_FILE': [
        'Add content to the file',
        'Choose a different file with content',
        'Check if the file was saved correctly'
      ],
      'INVALID_JSON_SYNTAX': [
        'Use a JSON validator to check syntax',
        'Check for missing commas, quotes, or brackets',
        'Remove trailing commas in objects and arrays'
      ],
      'NO_JSON_FOUND': [
        'Add JSON content in code blocks (```json ... ```)',
        'Ensure JSON is properly formatted with braces',
        'Check if JSON is hidden in other markdown elements'
      ],
      'MAX_DEPTH_EXCEEDED': [
        'Flatten nested JSON structures',
        'Use references instead of deep nesting',
        'Split into multiple JSON documents'
      ],
      'ARRAY_TOO_LARGE': [
        'Divide large arrays into smaller chunks',
        'Use pagination for array data',
        'Remove unnecessary array items'
      ]
    }

    return suggestions[error.code] || [
      'Try refreshing the page',
      'Check the file format and content',
      'Contact support if the problem persists'
    ]
  }

  // Error categorization for UI display
  categorizeErrors(errors: ValidationError[]): {
    critical: ValidationError[]
    warnings: ValidationError[]
    info: ValidationError[]
  } {
    return {
      critical: errors.filter(error => error.severity === 'error'),
      warnings: errors.filter(error => error.severity === 'warning'),
      info: errors.filter(error => error.severity === 'info')
    }
  }

  // Export errors for debugging
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2)
  }

  // Import errors (useful for testing)
  importErrors(errorJson: string): void {
    try {
      const errors = JSON.parse(errorJson) as ValidationError[]
      if (Array.isArray(errors)) {
        this.errors = errors
      }
    } catch (error) {
      this.logError('Failed to import errors', 'ErrorHandler.importErrors')
    }
  }
}

// Convenience functions for global error handling
export const logError = (error: ValidationError | Error | string, context?: string): void => {
  ErrorHandler.getInstance().logError(error, context)
}

export const logWarning = (message: string, context?: string): void => {
  ErrorHandler.getInstance().logWarning(message, context)
}

export const logInfo = (message: string, context?: string): void => {
  ErrorHandler.getInstance().logInfo(message, context)
}

export const getErrors = (severity?: 'error' | 'warning' | 'info'): ValidationError[] => {
  return ErrorHandler.getInstance().getErrors(severity)
}

export const clearErrors = (severity?: 'error' | 'warning' | 'info'): void => {
  ErrorHandler.getInstance().clearErrors(severity)
}

export const hasErrors = (severity?: 'error' | 'warning' | 'info'): boolean => {
  return ErrorHandler.getInstance().hasErrors(severity)
}