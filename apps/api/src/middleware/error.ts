import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { getSentryClient, type UserContext } from '../monitoring/sentry'
import type { CloudflareService } from '../services/cloudflare'
import { WasmError, WasmErrorHandler } from '../wasm/modules/core/wasm-error-handler'

// Extended environment interface
interface Env {
  DB: D1Database
  CACHE: KVNamespace
  SESSIONS: KVNamespace
  UPLOADS: KVNamespace
  ANALYTICS: KVNamespace
  FILES: R2Bucket
  SESSION_MANAGER: DurableObjectNamespace
  COLLABORATION_ROOM: DurableObjectNamespace
  REALTIME_SYNC: DurableObjectNamespace
  ENVIRONMENT: string
  API_VERSION: string
  ENABLE_METRICS: string
  LOG_LEVEL: string
  ENABLE_HEALTH_CHECKS: string
  ENABLE_CORS: string
  MAX_REQUEST_SIZE: string
  REQUEST_TIMEOUT: string
  JWT_SECRET: string
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error categories
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'database'
  | 'network'
  | 'wasm'
  | 'rate_limit'
  | 'timeout'
  | 'configuration'
  | 'external_service'
  | 'internal'
  | 'unknown'

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly category: ErrorCategory = 'internal',
    public readonly severity: ErrorSeverity = 'medium',
    public readonly context: Record<string, any> = {},
    public readonly recoverable: boolean = true,
    public readonly suggestions: string[] = []
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly field?: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400, 'validation', 'low', context, true, [
      'Check the request parameters',
      'Verify the input data format',
      'Review the API documentation',
    ])
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', context: Record<string, any> = {}) {
    super(message, 'AUTHENTICATION_ERROR', 401, 'authentication', 'medium', context, false, [
      'Check your authentication credentials',
      'Verify the token is valid and not expired',
      'Ensure you have the required permissions',
    ])
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions', context: Record<string, any> = {}) {
    super(message, 'AUTHORIZATION_ERROR', 403, 'authorization', 'medium', context, false, [
      'Check your user permissions',
      'Verify your subscription tier',
      'Contact support for access',
    ])
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'DATABASE_ERROR', 500, 'database', 'high', context, false, [
      'Try again later',
      'Check if the service is available',
      'Contact support if the issue persists',
    ])
    this.name = 'DatabaseError'
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'NETWORK_ERROR', 503, 'network', 'medium', context, true, [
      'Check your network connection',
      'Try again later',
      'Verify the service is available',
    ])
    this.name = 'NetworkError'
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    context: Record<string, any> = {}
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, 'rate_limit', 'medium', context, true, [
      'Wait before making another request',
      'Reduce request frequency',
      'Consider upgrading your plan',
    ])
    this.name = 'RateLimitError'
  }
}

export class TimeoutError extends ApiError {
  constructor(
    message: string,
    public readonly timeout: number,
    context: Record<string, any> = {}
  ) {
    super(message, 'TIMEOUT_ERROR', 408, 'timeout', 'medium', context, true, [
      'Try again with a smaller payload',
      'Check if the service is under heavy load',
      'Increase timeout if applicable',
    ])
    this.name = 'TimeoutError'
  }
}

export class ConfigurationError extends ApiError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'CONFIGURATION_ERROR', 500, 'configuration', 'critical', context, false, [
      'Check the service configuration',
      'Verify environment variables',
      'Contact support',
    ])
    this.name = 'ConfigurationError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(
    message: string,
    public readonly service: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, 'external_service', 'medium', context, true, [
      'Try again later',
      'Check if the external service is available',
      'Use fallback options if available',
    ])
    this.name = 'ExternalServiceError'
  }
}

// Error context interface
export interface ErrorContext {
  requestId?: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  method?: string
  timestamp: Date
  environment: string
  severity: ErrorSeverity
  category: ErrorCategory
  recoverable: boolean
  metadata?: Record<string, any>
}

// Error response interface
export interface ErrorResponse {
  error: string
  message: string
  code: string
  requestId?: string
  timestamp: string
  category: ErrorCategory
  severity: ErrorSeverity
  recoverable: boolean
  suggestions?: string[]
  context?: Record<string, any>
  stack?: string // Only in development
}

// Error metrics interface
export interface ErrorMetrics {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorsByCode: Record<string, number>
  recentErrors: Array<{
    code: string
    message: string
    timestamp: Date
    requestId?: string
  }>
}

// Error handler class
export class ErrorHandler {
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    errorsByCode: {},
    recentErrors: [],
  }
  private maxRecentErrors = 100

  constructor() {
    this.wasmErrorHandler = new WasmErrorHandler()
    this.sentryClient = getSentryClient()
  }

  /**
   * Handle errors and return appropriate response
   */
  async handleError(
    error: Error,
    c: Context<{ Bindings: Env }>,
    context?: Partial<ErrorContext>
  ): Promise<Response> {
    // Generate correlation ID if not provided
    const requestId = context?.requestId || c.get('requestId') || this.generateRequestId()

    // Build error context
    const errorContext: ErrorContext = {
      requestId,
      userId: context?.userId,
      sessionId: context?.sessionId,
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown',
      endpoint: c.req.path,
      method: c.req.method,
      timestamp: new Date(),
      environment: c.env.ENVIRONMENT || 'unknown',
      severity: 'medium',
      category: 'unknown',
      recoverable: true,
      metadata: context?.metadata,
    }

    // Classify and wrap the error
    const apiError = this.classifyError(error, errorContext)

    // Update error context with classified information
    errorContext.severity = apiError.severity
    errorContext.category = apiError.category
    errorContext.recoverable = apiError.recoverable

    // Log the error
    await this.logError(apiError, errorContext, c)

    // Update metrics
    this.updateMetrics(apiError, errorContext)

    // Store error for monitoring
    await this.storeErrorForMonitoring(apiError, errorContext, c)

    // Build error response
    const errorResponse = this.buildErrorResponse(apiError, errorContext, c)

    // Return appropriate HTTP response
    return c.json(errorResponse, apiError.statusCode)
  }

  /**
   * Classify and wrap errors into appropriate ApiError instances
   */
  private classifyError(error: Error, _context: ErrorContext): ApiError {
    // If it's already an ApiError, return it
    if (error instanceof ApiError) {
      return error
    }

    // Handle Hono HTTP exceptions
    if (error instanceof HTTPException) {
      return new ApiError(
        error.message,
        'HTTP_EXCEPTION',
        error.status,
        this.mapStatusCodeToCategory(error.status),
        this.mapStatusCodeToSeverity(error.status),
        { httpStatus: error.status },
        error.status < 500
      )
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const fieldErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return new ValidationError(
        `Validation failed: ${fieldErrors.join(', ')}`,
        fieldErrors[0]?.split(':')[0],
        { zodErrors: error.errors }
      )
    }

    // Handle WASM errors
    if (error instanceof WasmError) {
      return new ApiError(
        error.message,
        error.code,
        500,
        'wasm',
        this.mapWasmErrorToSeverity(error),
        {
          module: error.module,
          suggestions: error.suggestions,
          details: error.details,
        },
        error.recoverable,
        error.suggestions
      )
    }

    // Handle common error patterns
    const message = error.message.toLowerCase()

    if (message.includes('timeout') || message.includes('timed out')) {
      return new TimeoutError(error.message, 30000, { originalError: error })
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return new RateLimitError(error.message, undefined, {
        originalError: error,
      })
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return new AuthenticationError(error.message, { originalError: error })
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return new AuthorizationError(error.message, { originalError: error })
    }

    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return new DatabaseError(error.message, { originalError: error })
    }

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return new NetworkError(error.message, { originalError: error })
    }

    if (message.includes('configuration') || message.includes('environment')) {
      return new ConfigurationError(error.message, { originalError: error })
    }

    // Default to internal server error
    return new ApiError(
      error.message,
      'INTERNAL_ERROR',
      500,
      'internal',
      'high',
      { originalError: error },
      false
    )
  }

  /**
   * Map HTTP status codes to error categories
   */
  private mapStatusCodeToCategory(statusCode: number): ErrorCategory {
    if (statusCode >= 400 && statusCode < 500) {
      switch (statusCode) {
        case 400:
          return 'validation'
        case 401:
          return 'authentication'
        case 403:
          return 'authorization'
        case 404:
          return 'validation'
        case 429:
          return 'rate_limit'
        default:
          return 'validation'
      }
    }

    if (statusCode >= 500) {
      switch (statusCode) {
        case 502:
          return 'external_service'
        case 503:
          return 'network'
        case 504:
          return 'timeout'
        default:
          return 'internal'
      }
    }

    return 'unknown'
  }

  /**
   * Map HTTP status codes to error severity
   */
  private mapStatusCodeToSeverity(statusCode: number): ErrorSeverity {
    if (statusCode < 400) return 'low'
    if (statusCode < 500) return 'medium'
    if (statusCode < 502) return 'high'
    return 'critical'
  }

  /**
   * Map WASM errors to severity
   */
  private mapWasmErrorToSeverity(error: WasmError): ErrorSeverity {
    const message = error.message.toLowerCase()

    if (message.includes('security') || message.includes('compilation')) {
      return 'critical'
    }

    if (message.includes('memory') || message.includes('instantiation')) {
      return 'high'
    }

    if (message.includes('timeout') || message.includes('runtime')) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Log error with appropriate level
   */
  private async logError(
    error: ApiError,
    context: ErrorContext,
    c: Context<{ Bindings: Env }>
  ): Promise<void> {
    const logData = {
      requestId: context.requestId,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        category: error.category,
        severity: error.severity,
        recoverable: error.recoverable,
        stack: error.stack,
      },
      context: {
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp.toISOString(),
      },
      metadata: error.context,
    }

    // Log based on severity
    switch (error.severity) {
      case 'critical':
        console.error('[CRITICAL]', logData)
        break
      case 'high':
        console.error('[ERROR]', logData)
        break
      case 'medium':
        console.warn('[WARNING]', logData)
        break
      case 'low':
        console.info('[INFO]', logData)
        break
    }

    // Send to Sentry if available
    if (this.sentryClient) {
      const sentryLevel = this.mapSeverityToSentryLevel(error.severity)

      // Set user context if available
      if (context.userId) {
        this.sentryClient.setUserContext({
          id: context.userId,
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
        } as UserContext)
      }

      // Set tags for better filtering
      this.sentryClient.setTags({
        error_category: error.category,
        error_code: error.code,
        error_severity: error.severity,
        endpoint: context.endpoint,
        method: context.method,
        environment: context.environment,
      })

      // Set extra context data
      this.sentryClient.setExtras({
        error_context: context,
        error_suggestions: error.suggestions,
        error_recoverable: error.recoverable,
        request_id: context.requestId,
        session_id: context.sessionId,
      })

      // Add breadcrumb for error occurrence
      this.sentryClient.addBreadcrumb({
        category: 'error',
        message: `${error.category}: ${error.message}`,
        level: sentryLevel,
        data: {
          code: error.code,
          endpoint: context.endpoint,
          method: context.method,
        },
      })

      // Capture the exception in Sentry
      this.sentryClient.captureException(
        error,
        {
          request_id: context.requestId,
          user_id: context.userId,
          session_id: context.sessionId,
          endpoint: context.endpoint,
          method: context.method,
          status_code: error.statusCode,
          additional_data: {
            error_category: error.category,
            error_severity: error.severity,
            error_recoverable: error.recoverable,
            suggestions: error.suggestions,
          },
        },
        sentryLevel
      )
    }

    // Log to Cloudflare analytics if available
    try {
      const cloudflare = c.get('cloudflare') as CloudflareService
      if (cloudflare) {
        await cloudflare.cacheSet('analytics', `error:${context.requestId}`, logData, {
          ttl: 86400 * 7, // Keep for 7 days
        })
      }
    } catch (logError) {
      console.error('Failed to log error to analytics:', logError)
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: ApiError, context: ErrorContext): void {
    this.errorMetrics.totalErrors++

    // Update category counts
    this.errorMetrics.errorsByCategory[error.category] =
      (this.errorMetrics.errorsByCategory[error.category] || 0) + 1

    // Update severity counts
    this.errorMetrics.errorsBySeverity[error.severity] =
      (this.errorMetrics.errorsBySeverity[error.severity] || 0) + 1

    // Update code counts
    this.errorMetrics.errorsByCode[error.code] =
      (this.errorMetrics.errorsByCode[error.code] || 0) + 1

    // Add to recent errors
    this.errorMetrics.recentErrors.push({
      code: error.code,
      message: error.message,
      timestamp: context.timestamp,
      requestId: context.requestId,
    })

    // Limit recent errors
    if (this.errorMetrics.recentErrors.length > this.maxRecentErrors) {
      this.errorMetrics.recentErrors = this.errorMetrics.recentErrors.slice(-this.maxRecentErrors)
    }
  }

  /**
   * Store error for monitoring and analysis
   */
  private async storeErrorForMonitoring(
    error: ApiError,
    context: ErrorContext,
    c: Context<{ Bindings: Env }>
  ): Promise<void> {
    try {
      const cloudflare = c.get('cloudflare') as CloudflareService
      if (!cloudflare) return

      // Store detailed error information
      const errorData = {
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          category: error.category,
          severity: error.severity,
          recoverable: error.recoverable,
          suggestions: error.suggestions,
          statusCode: error.statusCode,
          context: error.context,
        },
        context: {
          requestId: context.requestId,
          userId: context.userId,
          sessionId: context.sessionId,
          endpoint: context.endpoint,
          method: context.method,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: context.timestamp.toISOString(),
          environment: context.environment,
        },
        metadata: context.metadata,
      }

      // Store in analytics with different TTLs based on severity
      const ttl =
        error.severity === 'critical'
          ? 86400 * 30 // 30 days for critical
          : error.severity === 'high'
            ? 86400 * 7 // 7 days for high
            : 86400 * 3 // 3 days for medium/low

      await cloudflare.cacheSet('analytics', `error_detail:${context.requestId}`, errorData, {
        ttl,
      })

      // Update error counts for monitoring
      const countKey = `error_count:${error.category}:${error.code}`
      const currentCount = (await cloudflare.cacheGet<number>('analytics', countKey)) || 0
      await cloudflare.cacheSet('analytics', countKey, currentCount + 1, {
        ttl: 86400, // Reset daily
      })
    } catch (storeError) {
      console.error('Failed to store error for monitoring:', storeError)
    }
  }

  /**
   * Build error response object
   */
  private buildErrorResponse(
    error: ApiError,
    context: ErrorContext,
    c: Context<{ Bindings: Env }>
  ): ErrorResponse {
    const isDevelopment = c.env.ENVIRONMENT === 'development'

    const response: ErrorResponse = {
      error: error.name,
      message: error.message,
      code: error.code,
      requestId: context.requestId,
      timestamp: context.timestamp.toISOString(),
      category: error.category,
      severity: error.severity,
      recoverable: error.recoverable,
      suggestions: error.suggestions.length > 0 ? error.suggestions : undefined,
      context: isDevelopment
        ? {
            endpoint: context.endpoint,
            method: context.method,
            userId: context.userId,
            ...error.context,
          }
        : undefined,
    }

    // Include stack trace in development
    if (isDevelopment && error.stack) {
      response.stack = error.stack
    }

    // Include retry information for rate limit errors
    if (error instanceof RateLimitError && error.retryAfter) {
      response.context = {
        ...response.context,
        retryAfter: error.retryAfter,
      }
    }

    // Include timeout information
    if (error instanceof TimeoutError) {
      response.context = {
        ...response.context,
        timeout: error.timeout,
      }
    }

    return response
  }

  /**
   * Map error severity to Sentry level
   */
  private mapSeverityToSentryLevel(
    severity: ErrorSeverity
  ): 'fatal' | 'error' | 'warning' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
        return 'fatal'
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'error'
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return crypto.randomUUID()
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.errorMetrics }
  }

  /**
   * Clear error metrics
   */
  clearMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCode: {},
      recentErrors: [],
    }
  }
}

// Create singleton error handler
const errorHandler = new ErrorHandler()

/**
 * Error handling middleware for Hono
 */
export const errorMiddleware = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      await next()
    } catch (error) {
      // Handle the error using our error handler
      const response = await errorHandler.handleError(error as Error, c, {
        requestId: c.get('requestId'),
        userId: c.get('auth')?.user?.id,
        sessionId: c.get('auth')?.sessionId,
      })

      return response
    }
  }
}

/**
 * Handle async errors in route handlers
 */
export const handleAsyncError = async (
  fn: (c: Context<{ Bindings: Env }>) => Promise<Response>,
  c: Context<{ Bindings: Env }>
): Promise<Response> => {
  try {
    return await fn(c)
  } catch (error) {
    return errorHandler.handleError(error as Error, c, {
      requestId: c.get('requestId'),
      userId: c.get('auth')?.user?.id,
      sessionId: c.get('auth')?.sessionId,
    })
  }
}

/**
 * Utility functions for creating specific errors
 */
export const createValidationError = (
  message: string,
  field?: string,
  context?: Record<string, any>
) => new ValidationError(message, field, context)

export const createAuthenticationError = (message?: string, context?: Record<string, any>) =>
  new AuthenticationError(message, context)

export const createAuthorizationError = (message?: string, context?: Record<string, any>) =>
  new AuthorizationError(message, context)

export const createDatabaseError = (message: string, context?: Record<string, any>) =>
  new DatabaseError(message, context)

export const createNetworkError = (message: string, context?: Record<string, any>) =>
  new NetworkError(message, context)

export const createRateLimitError = (
  message?: string,
  retryAfter?: number,
  context?: Record<string, any>
) => new RateLimitError(message, retryAfter, context)

export const createTimeoutError = (
  message: string,
  timeout: number,
  context?: Record<string, any>
) => new TimeoutError(message, timeout, context)

export const createConfigurationError = (message: string, context?: Record<string, any>) =>
  new ConfigurationError(message, context)

export const createExternalServiceError = (
  message: string,
  service: string,
  context?: Record<string, any>
) => new ExternalServiceError(message, service, context)

/**
 * Get error handler instance
 */
export const getErrorHandler = () => errorHandler

/**
 * Get error metrics
 */
export const getErrorMetrics = () => errorHandler.getMetrics()

export default errorHandler
