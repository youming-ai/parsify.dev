/**
 * 统一错误处理系统
 * 提供错误分类、处理和恢复机制
 */

import { logger } from './logger'

// 错误类型枚举
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  WASM_EXECUTION = 'WASM_EXECUTION',
  DATABASE = 'DATABASE',
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 自定义错误类
export class ParsifyError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly code?: string
  public readonly statusCode?: number
  public readonly retryable: boolean
  public readonly context?: Record<string, any>
  public readonly timestamp: string

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      code?: string
      statusCode?: number
      retryable?: boolean
      context?: Record<string, any>
      cause?: Error
    }
  ) {
    super(message, { cause: options?.cause })

    this.type = type
    this.severity = severity
    this.code = options?.code
    this.statusCode = options?.statusCode
    this.retryable = options?.retryable ?? false
    this.context = options?.context
    this.timestamp = new Date().toISOString()

    this.name = this.constructor.name
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

// 特定错误类型
export class ValidationError extends ParsifyError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorType.VALIDATION, message, ErrorSeverity.LOW, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      retryable: false,
      context,
    })
  }
}

export class AuthenticationError extends ParsifyError {
  constructor(message: string = 'Authentication required') {
    super(ErrorType.AUTHENTICATION, message, ErrorSeverity.MEDIUM, {
      code: 'AUTH_ERROR',
      statusCode: 401,
      retryable: false,
    })
  }
}

export class AuthorizationError extends ParsifyError {
  constructor(message: string = 'Access denied') {
    super(ErrorType.AUTHORIZATION, message, ErrorSeverity.MEDIUM, {
      code: 'AUTHZ_ERROR',
      statusCode: 403,
      retryable: false,
    })
  }
}

export class NetworkError extends ParsifyError {
  constructor(message: string, retryable: boolean = true) {
    super(ErrorType.NETWORK, message, ErrorSeverity.HIGH, {
      code: 'NETWORK_ERROR',
      statusCode: 503,
      retryable,
    })
  }
}

export class RateLimitError extends ParsifyError {
  constructor(retryAfter?: number) {
    super(ErrorType.RATE_LIMIT, 'Rate limit exceeded', ErrorSeverity.MEDIUM, {
      code: 'RATE_LIMIT',
      statusCode: 429,
      retryable: true,
      context: { retryAfter },
    })
  }
}

export class DatabaseError extends ParsifyError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorType.DATABASE, message, ErrorSeverity.HIGH, {
      code: 'DATABASE_ERROR',
      statusCode: 500,
      retryable: false,
      context,
    })
  }
}

export class WASMExecutionError extends ParsifyError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorType.WASM_EXECUTION, message, ErrorSeverity.MEDIUM, {
      code: 'WASM_EXECUTION_ERROR',
      statusCode: 500,
      retryable: true,
      context,
    })
  }
}

// 错误处理器类
export class ErrorHandler {
  private logger = logger

  constructor(private source?: string) {}

  // 处理并记录错误
  handle(error: Error | ParsifyError, context?: Record<string, any>): ParsifyError {
    const parsifyError = this.normalizeError(error, context)

    // 记录错误
    this.logError(parsifyError)

    // 发送到监控系统
    this.reportError(parsifyError)

    return parsifyError
  }

  // 标准化错误对象
  private normalizeError(error: Error | ParsifyError, context?: Record<string, any>): ParsifyError {
    if (error instanceof ParsifyError) {
      // 合并上下文
      if (context) {
        error.context = { ...error.context, ...context }
      }
      return error
    }

    // 根据错误类型进行分类
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, { ...context, originalError: error })
    }

    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return new NetworkError(error.message, true)
    }

    // 默认为内部错误
    return new ParsifyError(ErrorType.INTERNAL, error.message, ErrorSeverity.HIGH, {
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      retryable: false,
      context: { ...context, originalError: error, stack: error.stack },
      cause: error,
    })
  }

  // 记录错误日志
  private logError(error: ParsifyError): void {
    const logData = {
      type: error.type,
      code: error.code,
      severity: error.severity,
      statusCode: error.statusCode,
      retryable: error.retryable,
      context: error.context,
      source: this.source,
    }

    switch (error.severity) {
      case ErrorSeverity.LOW:
        this.logger.warn(error.message, logData)
        break
      case ErrorSeverity.MEDIUM:
        this.logger.warn(error.message, logData)
        break
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        this.logger.error(error.message, error, logData)
        break
    }
  }

  // 报告错误到监控系统
  private async reportError(error: ParsifyError): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // 客户端 Sentry
        const Sentry = await import('@sentry/react').catch(() => null)
        if (Sentry) {
          Sentry.captureException(error, {
            extra: {
              type: error.type,
              severity: error.severity,
              code: error.code,
              context: error.context,
              source: this.source,
            },
            tags: {
              errorType: error.type,
              severity: error.severity,
            },
          })
        }
      }
    } catch {
      // 静默处理监控系统错误
    }
  }

  // 创建用户友好的错误消息
  getUserMessage(error: ParsifyError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return '请检查您的输入并重试。'
      case ErrorType.AUTHENTICATION:
        return '请登录以继续。'
      case ErrorType.AUTHORIZATION:
        return '您没有权限执行此操作。'
      case ErrorType.RATE_LIMIT:
        return '请求过于频繁，请稍后再试。'
      case ErrorType.NETWORK:
        return '网络连接问题，请检查您的网络连接。'
      case ErrorType.FILE_UPLOAD:
        return '文件上传失败，请检查文件格式和大小。'
      case ErrorType.WASM_EXECUTION:
        return '代码执行失败，请检查您的代码。'
      default:
        return '发生了错误，请稍后重试。'
    }
  }
}

// 重试机制
export class RetryHandler {
  constructor(private logger = logger) {}

  async execute<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number
      baseDelay?: number
      maxDelay?: number
      backoffFactor?: number
      retryableErrors?: string[]
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryableErrors = ['NETWORK_ERROR', 'RATE_LIMIT', 'WASM_EXECUTION_ERROR'],
    } = options

    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        const parsifyError =
          lastError instanceof ParsifyError ? lastError : new NetworkError(lastError.message)

        // 检查是否可以重试
        if (attempt === maxAttempts || !this.isRetryable(parsifyError, retryableErrors)) {
          throw lastError
        }

        // 计算延迟时间
        const delay = Math.min(baseDelay * backoffFactor ** (attempt - 1), maxDelay)

        this.logger.warn(`操作失败，${delay}ms 后重试 (${attempt}/${maxAttempts})`, {
          error: lastError.message,
          attempt,
          nextRetryIn: delay,
        })

        // 等待后重试
        await this.delay(delay)
      }
    }

    throw lastError!
  }

  private isRetryable(error: ParsifyError, retryableErrors: string[]): boolean {
    return error.retryable || retryableErrors.includes(error.code || '')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 创建默认实例
export const errorHandler = new ErrorHandler()
export const retryHandler = new RetryHandler()

// 便捷函数
export const handleError = (error: Error | ParsifyError, context?: Record<string, any>) => {
  return errorHandler.handle(error, context)
}

export const withRetry = <T>(
  operation: () => Promise<T>,
  options?: Parameters<RetryHandler['execute']>[1]
) => {
  return retryHandler.execute(operation, options)
}
