/**
 * Comprehensive error handling for WASM module operations
 */

/**
 * WASM-specific error types
 */
export class WasmError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly module?: string,
    public readonly recoverable = false,
    public readonly suggestions: string[] = [],
    public readonly details?: any
  ) {
    super(message)
    this.name = 'WasmError'
  }
}

export class WasmCompilationError extends WasmError {
  constructor(message: string, module?: string, details?: any) {
    super(message, 'COMPILATION_ERROR', module, false, [
      'Check if the WASM file is valid',
      'Verify the WASM format is correct',
      'Ensure the module was compiled for the target platform',
      'Check for missing dependencies or imports'
    ], details)
    this.name = 'WasmCompilationError'
  }
}

export class WasmInstantiationError extends WasmError {
  constructor(message: string, module?: string, details?: any) {
    super(message, 'INSTANTIATION_ERROR', module, false, [
      'Verify all required imports are provided',
      'Check memory limits and configuration',
      'Ensure compatibility with the current environment',
      'Validate module imports match the provided import object'
    ], details)
    this.name = 'WasmInstantiationError'
  }
}

export class WasmRuntimeError extends WasmError {
  constructor(message: string, module?: string, recoverable = true, details?: any) {
    super(message, 'RUNTIME_ERROR', module, recoverable, [
      'Check input data format and values',
      'Verify module configuration',
      'Review execution logs for details',
      'Ensure sufficient memory is available'
    ], details)
    this.name = 'WasmRuntimeError'
  }
}

export class WasmMemoryError extends WasmError {
  constructor(message: string, module?: string, details?: any) {
    super(message, 'MEMORY_ERROR', module, true, [
      'Increase memory limits in module configuration',
      'Check for memory leaks in the module',
      'Optimize input data size',
      'Consider processing data in chunks'
    ], details)
    this.name = 'WasmMemoryError'
  }
}

export class WasmTimeoutError extends WasmError {
  constructor(message: string, module?: string, timeout?: number, details?: any) {
    super(message, 'TIMEOUT_ERROR', module, true, [
      'Increase timeout configuration',
      'Optimize module performance',
      'Process smaller data chunks',
      'Check for infinite loops or blocking operations'
    ], { timeout, ...details })
    this.name = 'WasmTimeoutError'
  }
}

export class WasmCompatibilityError extends WasmError {
  constructor(message: string, module?: string, details?: any) {
    super(message, 'COMPATIBILITY_ERROR', module, false, [
      'Check API version compatibility',
      'Verify module requirements',
      'Update runtime environment if needed',
      'Use a different module version'
    ], details)
    this.name = 'WasmCompatibilityError'
  }
}

export class WasmNetworkError extends WasmError {
  constructor(message: string, module?: string, url?: string, details?: any) {
    super(message, 'NETWORK_ERROR', module, true, [
      'Check network connectivity',
      'Verify module URL is correct',
      'Check for firewall or CORS issues',
      'Try again later or use cached version'
    ], { url, ...details })
    this.name = 'WasmNetworkError'
  }
}

export class WasmSecurityError extends WasmError {
  constructor(message: string, module?: string, details?: any) {
    super(message, 'SECURITY_ERROR', module, false, [
      'Verify module source and integrity',
      'Check security policies',
      'Ensure module is from trusted source',
      'Review module permissions'
    ], details)
    this.name = 'WasmSecurityError'
  }
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error classification
 */
export interface ErrorClassification {
  severity: ErrorSeverity
  category: 'compilation' | 'instantiation' | 'runtime' | 'memory' | 'network' | 'security' | 'compatibility'
  recoverable: boolean
  impact: 'module' | 'system' | 'user'
  frequency: 'once' | 'occasional' | 'frequent' | 'persistent'
}

/**
 * Error context information
 */
export interface ErrorContext {
  moduleId?: string
  operation: string
  input?: any
  configuration?: any
  environment: {
    userAgent?: string
    platform: string
    memoryUsage: number
    timestamp: Date
  }
  stack?: string
  previousError?: Error
}

/**
 * Enhanced error information
 */
export interface ErrorInfo {
  error: WasmError
  classification: ErrorClassification
  context: ErrorContext
  resolution?: string
  prevention?: string[]
  relatedErrors?: string[]
}

/**
 * WASM error handler class
 */
export class WasmErrorHandler {
  private errorHistory: Map<string, ErrorInfo[]> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private maxHistorySize = 1000
  private maxHistoryPerModule = 100

  /**
   * Handle a WASM error
   */
  handleError(error: Error, context: ErrorContext): ErrorInfo {
    const wasmError = this.wrapError(error, context.moduleId)
    const classification = this.classifyError(wasmError, context)
    const errorInfo: ErrorInfo = {
      error: wasmError,
      classification,
      context,
      resolution: this.generateResolution(wasmError, classification),
      prevention: this.generatePrevention(wasmError, classification),
      relatedErrors: this.findRelatedErrors(wasmError, context.moduleId)
    }

    // Record error
    this.recordError(errorInfo)

    // Log error
    this.logError(errorInfo)

    return errorInfo
  }

  /**
   * Wrap any error as a WasmError
   */
  private wrapError(error: Error, moduleId?: string): WasmError {
    if (error instanceof WasmError) {
      return error
    }

    // Determine error type based on message content
    const message = error.message.toLowerCase()

    if (message.includes('compile') || message.includes('WebAssembly.compile')) {
      return new WasmCompilationError(error.message, moduleId, { originalError: error })
    }

    if (message.includes('instantiate') || message.includes('WebAssembly.instantiate')) {
      return new WasmInstantiationError(error.message, moduleId, { originalError: error })
    }

    if (message.includes('memory') || message.includes('out of memory')) {
      return new WasmMemoryError(error.message, moduleId, { originalError: error })
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new WasmTimeoutError(error.message, moduleId, undefined, { originalError: error })
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
      return new WasmNetworkError(error.message, moduleId, undefined, { originalError: error })
    }

    if (message.includes('security') || message.includes('cors') || message.includes('policy')) {
      return new WasmSecurityError(error.message, moduleId, { originalError: error })
    }

    if (message.includes('compatible') || message.includes('version')) {
      return new WasmCompatibilityError(error.message, moduleId, { originalError: error })
    }

    // Default to runtime error
    return new WasmRuntimeError(error.message, moduleId, true, { originalError: error })
  }

  /**
   * Classify error severity and type
   */
  private classifyError(error: WasmError, context: ErrorContext): ErrorClassification {
    let severity: ErrorSeverity = 'medium'
    let category: ErrorClassification['category'] = 'runtime'
    let recoverable = error.recoverable
    let impact: ErrorClassification['impact'] = 'module'
    let frequency: ErrorClassification['frequency'] = 'once'

    // Determine severity based on error type and context
    if (error instanceof WasmCompilationError || error instanceof WasmInstantiationError) {
      severity = 'high'
      recoverable = false
      impact = 'module'
    } else if (error instanceof WasmSecurityError) {
      severity = 'critical'
      recoverable = false
      impact = 'system'
    } else if (error instanceof WasmMemoryError) {
      severity = 'medium'
      recoverable = true
      impact = 'module'
    } else if (error instanceof WasmTimeoutError) {
      severity = 'medium'
      recoverable = true
      impact = 'user'
    } else if (error instanceof WasmNetworkError) {
      severity = 'low'
      recoverable = true
      impact = 'user'
    }

    // Determine category
    if (error instanceof WasmCompilationError) {
      category = 'compilation'
    } else if (error instanceof WasmInstantiationError) {
      category = 'instantiation'
    } else if (error instanceof WasmMemoryError) {
      category = 'memory'
    } else if (error instanceof WasmNetworkError) {
      category = 'network'
    } else if (error instanceof WasmSecurityError) {
      category = 'security'
    } else if (error instanceof WasmCompatibilityError) {
      category = 'compatibility'
    }

    // Check frequency
    const errorKey = this.getErrorKey(error, context.moduleId)
    const count = this.errorCounts.get(errorKey) || 0
    if (count > 10) {
      frequency = 'persistent'
    } else if (count > 3) {
      frequency = 'frequent'
    } else if (count > 1) {
      frequency = 'occasional'
    }

    return {
      severity,
      category,
      recoverable,
      impact,
      frequency
    }
  }

  /**
   * Generate resolution suggestions
   */
  private generateResolution(error: WasmError, classification: ErrorClassification): string {
    if (error.suggestions.length > 0) {
      return error.suggestions.join('. ')
    }

    // Default resolutions based on error type
    switch (classification.category) {
      case 'compilation':
        return 'Verify the WASM module is correctly compiled and compatible with the target platform.'
      case 'instantiation':
        return 'Check that all required imports are provided and memory limits are sufficient.'
      case 'runtime':
        return 'Review input data and module configuration. Check logs for specific details.'
      case 'memory':
        return 'Increase memory limits or optimize data processing to use less memory.'
      case 'network':
        return 'Check network connectivity and try again. Consider using cached modules.'
      case 'security':
        return 'Verify module source and security policies. Use modules from trusted sources.'
      case 'compatibility':
        return 'Check API version compatibility and update the runtime or module as needed.'
      default:
        return 'Review the error details and try the suggested actions.'
    }
  }

  /**
   * Generate prevention measures
   */
  private generatePrevention(error: WasmError, classification: ErrorClassification): string[] {
    const prevention: string[] = []

    // General prevention measures
    prevention.push('Validate input data before processing')
    prevention.push('Monitor memory usage and set appropriate limits')
    prevention.push('Implement proper error handling and fallbacks')

    // Specific prevention based on error type
    switch (classification.category) {
      case 'compilation':
        prevention.push('Use validated WASM modules from trusted sources')
        prevention.push('Test modules in development before deployment')
        prevention.push('Keep WASM runtime updated')
        break
      case 'instantiation':
        prevention.push('Verify module dependencies and requirements')
        prevention.push('Test import object configuration')
        prevention.push('Validate memory limits before instantiation')
        break
      case 'runtime':
        prevention.push('Implement input validation and sanitization')
        prevention.push('Add comprehensive logging for debugging')
        prevention.push('Use timeouts for long-running operations')
        break
      case 'memory':
        prevention.push('Monitor memory usage patterns')
        prevention.push('Process data in chunks for large inputs')
        prevention.push('Implement memory cleanup procedures')
        break
      case 'network':
        prevention.push('Cache modules locally when possible')
        prevention.push('Implement retry logic for network operations')
        prevention.push('Use fallback modules when network is unavailable')
        break
      case 'security':
        prevention.push('Verify module integrity with checksums')
        prevention.push('Use secure transport protocols')
        prevention.push('Implement strict security policies')
        break
      case 'compatibility':
        prevention.push('Check API version compatibility before loading')
        prevention.push('Test modules across different environments')
        prevention.push('Maintain compatibility matrices')
        break
    }

    return prevention
  }

  /**
   * Find related errors from history
   */
  private findRelatedErrors(error: WasmError, moduleId?: string): string[] {
    if (!moduleId) {
      return []
    }

    const history = this.errorHistory.get(moduleId) || []
    const related: string[] = []

    // Find similar errors from history
    for (const errorInfo of history.slice(-10)) { // Last 10 errors
      if (errorInfo.error.code === error.code) {
        related.push(`Similar error occurred ${this.formatTimeAgo(errorInfo.context.environment.timestamp)}`)
      }
    }

    return related
  }

  /**
   * Record error for analytics and debugging
   */
  private recordError(errorInfo: ErrorInfo): void {
    const moduleId = errorInfo.context.moduleId || 'global'

    // Add to history
    if (!this.errorHistory.has(moduleId)) {
      this.errorHistory.set(moduleId, [])
    }

    const history = this.errorHistory.get(moduleId)!
    history.push(errorInfo)

    // Limit history size
    if (history.length > this.maxHistoryPerModule) {
      history.splice(0, history.length - this.maxHistoryPerModule)
    }

    // Update error counts
    const errorKey = this.getErrorKey(errorInfo.error, moduleId)
    const count = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, count + 1)

    // Limit total history size
    if (this.errorHistory.size > this.maxHistorySize) {
      const oldestModule = this.errorHistory.keys().next().value
      this.errorHistory.delete(oldestModule)
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorInfo: ErrorInfo): void {
    const { error, classification, context } = errorInfo
    const logMessage = `[WASM ${error.code}] ${error.message}`
    const logDetails = {
      module: context.moduleId,
      operation: context.operation,
      severity: classification.severity,
      recoverable: classification.recoverable,
      suggestions: error.suggestions
    }

    switch (classification.severity) {
      case 'critical':
        console.error(logMessage, logDetails)
        break
      case 'high':
        console.error(logMessage, logDetails)
        break
      case 'medium':
        console.warn(logMessage, logDetails)
        break
      case 'low':
        console.info(logMessage, logDetails)
        break
    }

    // Debug logging for development
    if (context.configuration?.debug) {
      console.debug('WASM Error Details:', {
        error: errorInfo.error,
        classification: errorInfo.classification,
        context: errorInfo.context,
        resolution: errorInfo.resolution,
        prevention: errorInfo.prevention
      })
    }
  }

  /**
   * Get error key for counting and grouping
   */
  private getErrorKey(error: WasmError, moduleId?: string): string {
    return `${moduleId || 'unknown'}:${error.code}:${error.name}`
  }

  /**
   * Format time ago for human readable timestamps
   */
  private formatTimeAgo(timestamp: Date): string {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
      return 'just now'
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number
    errorsByModule: Record<string, number>
    errorsByType: Record<string, number>
    errorsBySeverity: Record<string, number>
    frequentErrors: Array<{ error: string; count: number; lastOccurrence: Date }>
  } {
    const errorsByModule: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    const frequentErrors: Array<{ error: string; count: number; lastOccurrence: Date }> = []

    let totalErrors = 0

    // Count errors by module, type, and severity
    for (const [moduleId, history] of this.errorHistory) {
      errorsByModule[moduleId] = history.length
      totalErrors += history.length

      for (const errorInfo of history) {
        const { error, classification } = errorInfo

        // Count by type
        errorsByType[error.code] = (errorsByType[error.code] || 0) + 1

        // Count by severity
        errorsBySeverity[classification.severity] = (errorsBySeverity[classification.severity] || 0) + 1
      }
    }

    // Get frequent errors
    for (const [errorKey, count] of this.errorCounts) {
      if (count > 2) {
        // Find last occurrence
        let lastOccurrence = new Date(0)
        for (const history of this.errorHistory.values()) {
          for (const errorInfo of history) {
            if (this.getErrorKey(errorInfo.error, errorInfo.context.moduleId) === errorKey) {
              if (errorInfo.context.environment.timestamp > lastOccurrence) {
                lastOccurrence = errorInfo.context.environment.timestamp
              }
            }
          }
        }

        frequentErrors.push({
          error: errorKey,
          count,
          lastOccurrence
        })
      }
    }

    // Sort frequent errors by count
    frequentErrors.sort((a, b) => b.count - a.count)

    return {
      totalErrors,
      errorsByModule,
      errorsByType,
      errorsBySeverity,
      frequentErrors
    }
  }

  /**
   * Clear error history
   */
  clearHistory(moduleId?: string): void {
    if (moduleId) {
      this.errorHistory.delete(moduleId)
    } else {
      this.errorHistory.clear()
      this.errorCounts.clear()
    }
  }

  /**
   * Export error data for analysis
   */
  exportErrorData(): {
    exportedAt: string
    statistics: any
    errors: Array<{ module: string; error: ErrorInfo }>
  } {
    const errors: Array<{ module: string; error: ErrorInfo }> = []

    for (const [moduleId, history] of this.errorHistory) {
      for (const errorInfo of history) {
        errors.push({ module: moduleId, error: errorInfo })
      }
    }

    return {
      exportedAt: new Date().toISOString(),
      statistics: this.getErrorStatistics(),
      errors
    }
  }
}

// Create singleton error handler
export const wasmErrorHandler = new WasmErrorHandler()

/**
 * Utility function to handle WASM errors
 */
export function handleWasmError(error: Error, context: Partial<ErrorContext> = {}): ErrorInfo {
  const fullContext: ErrorContext = {
    operation: 'unknown',
    environment: {
      platform: typeof window !== 'undefined' ? 'browser' : 'node',
      memoryUsage: 0, // This would be calculated
      timestamp: new Date()
    },
    ...context
  }

  return wasmErrorHandler.handleError(error, fullContext)
}

/**
 * Utility function to create a fallback result when WASM fails
 */
export function createFallbackResult(
  error: ErrorInfo,
  fallbackData?: any
): {
  success: false
  fallback: boolean
  error: string
  code: string
  recoverable: boolean
  suggestions: string[]
  data?: any
} {
  return {
    success: false,
    fallback: true,
    error: error.error.message,
    code: error.error.code,
    recoverable: error.classification.recoverable,
    suggestions: error.error.suggestions,
    data: fallbackData
  }
}
