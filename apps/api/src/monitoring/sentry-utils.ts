/**
 * Sentry Utilities for Custom Error Handlers and Breadcrumbs
 *
 * This module provides utility functions for custom error handling,
 * breadcrumb management, and monitoring specific to the Parsify application.
 */

import { Context } from 'hono'
import { SeverityLevel } from '@sentry/cloudflare'
import { getSentryClient } from './sentry'
import { User } from '../models/user'

// Custom breadcrumb categories
export enum BreadcrumbCategory {
  AUTH = 'auth',
  DATABASE = 'database',
  CACHE = 'cache',
  API = 'api',
  FILE_UPLOAD = 'file_upload',
  COLLABORATION = 'collaboration',
  RATE_LIMIT = 'rate_limit',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  WASM = 'wasm',
}

// Custom error types for specific monitoring
export enum CustomErrorType {
  DATABASE_CONNECTION_FAILED = 'database_connection_failed',
  DATABASE_QUERY_TIMEOUT = 'database_query_timeout',
  CACHE_MISS = 'cache_miss',
  CACHE_ERROR = 'cache_error',
  FILE_UPLOAD_FAILED = 'file_upload_failed',
  FILE_PROCESSING_FAILED = 'file_processing_failed',
  COLLABORATION_SYNC_FAILED = 'collaboration_sync_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SUBSCRIPTION_LIMIT_EXCEEDED = 'subscription_limit_exceeded',
  EXTERNAL_API_FAILURE = 'external_api_failure',
  WASM_COMPILATION_FAILED = 'wasm_compilation_failed',
  WASM_RUNTIME_ERROR = 'wasm_runtime_error',
  SECURITY_VIOLATION = 'security_violation',
  VALIDATION_ERROR = 'validation_error',
}

// Performance metrics interface
export interface PerformanceMetrics {
  operation: string
  duration: number
  metadata?: Record<string, any>
  tags?: Record<string, string>
}

// Database operation tracking
export interface DatabaseOperation {
  operation: 'query' | 'insert' | 'update' | 'delete' | 'batch'
  table?: string
  duration: number
  success: boolean
  rowsAffected?: number
  errorMessage?: string
}

// File operation tracking
export interface FileOperation {
  operation: 'upload' | 'download' | 'process' | 'transform' | 'delete'
  fileType?: string
  fileSize?: number
  duration: number
  success: boolean
  errorMessage?: string
}

// External service call tracking
export interface ExternalServiceCall {
  service: string
  endpoint: string
  method: string
  duration: number
  success: boolean
  statusCode?: number
  errorMessage?: string
}

/**
 * Add custom breadcrumb for better debugging
 */
export const addCustomBreadcrumb = (
  category: BreadcrumbCategory,
  message: string,
  level: SeverityLevel = 'info',
  data?: Record<string, any>
): void => {
  const client = getSentryClient()
  if (!client) return

  client.addBreadcrumb({
    category,
    message,
    level,
    data: {
      timestamp: new Date().toISOString(),
      ...data,
    },
  })
}

/**
 * Add database operation breadcrumb
 */
export const addDatabaseBreadcrumb = (
  operation: DatabaseOperation
): void => {
  const level: SeverityLevel = operation.success ? 'info' : 'error'

  addCustomBreadcrumb(
    BreadcrumbCategory.DATABASE,
    `Database ${operation.operation}${operation.table ? ` on ${operation.table}` : ''}`,
    level,
    {
      operation: operation.operation,
      table: operation.table,
      duration: operation.duration,
      success: operation.success,
      rowsAffected: operation.rowsAffected,
      errorMessage: operation.errorMessage,
    }
  )
}

/**
 * Add file operation breadcrumb
 */
export const addFileBreadcrumb = (
  operation: FileOperation
): void => {
  const level: SeverityLevel = operation.success ? 'info' : 'error'

  addCustomBreadcrumb(
    BreadcrumbCategory.FILE_UPLOAD,
    `File ${operation.operation}${operation.fileType ? ` (${operation.fileType})` : ''}`,
    level,
    {
      operation: operation.operation,
      fileType: operation.fileType,
      fileSize: operation.fileSize,
      duration: operation.duration,
      success: operation.success,
      errorMessage: operation.errorMessage,
    }
  )
}

/**
 * Add external service call breadcrumb
 */
export const addExternalServiceBreadcrumb = (
  call: ExternalServiceCall
): void => {
  const level: SeverityLevel = call.success ? 'info' : 'error'

  addCustomBreadcrumb(
    BreadcrumbCategory.EXTERNAL_SERVICE,
    `${call.service} API ${call.method} ${call.endpoint}`,
    level,
    {
      service: call.service,
      endpoint: call.endpoint,
      method: call.method,
      duration: call.duration,
      success: call.success,
      statusCode: call.statusCode,
      errorMessage: call.errorMessage,
    }
  )
}

/**
 * Add authentication breadcrumb
 */
export const addAuthBreadcrumb = (
  action: string,
  success: boolean,
  userId?: string,
  data?: Record<string, any>
): void => {
  const level: SeverityLevel = success ? 'info' : 'warning'

  addCustomBreadcrumb(
    BreadcrumbCategory.AUTH,
    `Authentication: ${action}`,
    level,
    {
      action,
      success,
      userId,
      ...data,
    }
  )
}

/**
 * Add rate limit breadcrumb
 */
export const addRateLimitBreadcrumb = (
  limitType: string,
  current: number,
  max: number,
  window: string
): void => {
  addCustomBreadcrumb(
    BreadcrumbCategory.RATE_LIMIT,
    `Rate limit check: ${limitType}`,
    'info',
    {
      limitType,
      current,
      max,
      window,
      percentageUsed: Math.round((current / max) * 100),
    }
  )
}

/**
 * Add collaboration breadcrumb
 */
export const addCollaborationBreadcrumb = (
  action: string,
  roomId?: string,
  userId?: string,
  data?: Record<string, any>
): void => {
  addCustomBreadcrumb(
    BreadcrumbCategory.COLLABORATION,
    `Collaboration: ${action}`,
    'info',
    {
      action,
      roomId,
      userId,
      ...data,
    }
  )
}

/**
 * Add security breadcrumb for potential threats
 */
export const addSecurityBreadcrumb = (
  threat: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  data?: Record<string, any>
): void => {
  const level: SeverityLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warning'

  addCustomBreadcrumb(
    BreadcrumbCategory.SECURITY,
    `Security: ${threat}`,
    level,
    {
      threat,
      severity,
      ...data,
    }
  )
}

/**
 * Add performance breadcrumb
 */
export const addPerformanceBreadcrumb = (
  metrics: PerformanceMetrics
): void => {
  addCustomBreadcrumb(
    BreadcrumbCategory.PERFORMANCE,
    `Performance: ${metrics.operation}`,
    'info',
    {
      operation: metrics.operation,
      duration: metrics.duration,
      metadata: metrics.metadata,
      tags: metrics.tags,
    }
  )
}

/**
 * Report custom error with context
 */
export const reportCustomError = (
  errorType: CustomErrorType,
  message: string,
  context?: Record<string, any>,
  level: SeverityLevel = 'error'
): void => {
  const client = getSentryClient()
  if (!client) return

  const error = new Error(message)
  error.name = errorType

  client.setTags({
    custom_error_type: errorType,
    error_category: getErrorCategory(errorType),
  })

  client.setExtras({
    error_context: context,
    error_type: errorType,
  })

  client.captureException(error, {
    additional_data: {
      custom_error_type: errorType,
      ...context,
    },
  }, level)
}

/**
 * Get error category for custom error type
 */
const getErrorCategory = (errorType: CustomErrorType): string => {
  if (errorType.includes('database')) return 'database'
  if (errorType.includes('cache')) return 'cache'
  if (errorType.includes('file')) return 'file_upload'
  if (errorType.includes('collaboration')) return 'collaboration'
  if (errorType.includes('rate_limit') || errorType.includes('quota') || errorType.includes('subscription')) return 'rate_limit'
  if (errorType.includes('external_api')) return 'external_service'
  if (errorType.includes('wasm')) return 'wasm'
  if (errorType.includes('security')) return 'security'
  if (errorType.includes('validation')) return 'validation'
  return 'business_logic'
}

/**
 * Monitor database operations with automatic breadcrumb tracking
 */
export const monitorDatabaseOperation = async <T>(
  operation: DatabaseOperation['operation'],
  table: string | undefined,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    addDatabaseBreadcrumb({
      operation,
      table,
      duration,
      success: true,
      rowsAffected: Array.isArray(result) ? result.length : 1,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    addDatabaseBreadcrumb({
      operation,
      table,
      duration,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}

/**
 * Monitor file operations with automatic breadcrumb tracking
 */
export const monitorFileOperation = async <T>(
  operation: FileOperation['operation'],
  fileType: string | undefined,
  fn: () => Promise<T>,
  fileSize?: number
): Promise<T> => {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    addFileBreadcrumb({
      operation,
      fileType,
      fileSize,
      duration,
      success: true,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    addFileBreadcrumb({
      operation,
      fileType,
      fileSize,
      duration,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}

/**
 * Monitor external service calls with automatic breadcrumb tracking
 */
export const monitorExternalServiceCall = async <T>(
  service: string,
  endpoint: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    addExternalServiceBreadcrumb({
      service,
      endpoint,
      method,
      duration,
      success: true,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    addExternalServiceBreadcrumb({
      service,
      endpoint,
      method,
      duration,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}

/**
 * Set user context from auth middleware
 */
export const setSentryUserFromContext = (c: Context): void => {
  const client = getSentryClient()
  if (!client) return

  const auth = c.get('auth')
  if (auth?.user) {
    const user = auth.user as User

    client.setUserContext({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription_tier: user.subscription_tier,
      ip_address: c.req.header('CF-Connecting-IP'),
      user_agent: c.req.header('User-Agent'),
    })

    // Set user-specific tags
    client.setTags({
      user_authenticated: 'true',
      user_subscription_tier: user.subscription_tier || 'unknown',
      user_id: user.id,
      user_created_at: user.created_at,
    })

    // Add user context breadcrumb
    addCustomBreadcrumb(
      BreadcrumbCategory.AUTH,
      'User context set from auth middleware',
      'info',
      {
        user_id: user.id,
        subscription_tier: user.subscription_tier,
        endpoint: c.req.path,
        method: c.req.method,
      }
    )
  } else {
    // Clear user context for unauthenticated requests
    client.clearUserContext()
    client.setTags({
      user_authenticated: 'false',
    })
  }
}

/**
 * Monitor business logic events
 */
export const monitorBusinessEvent = (
  event: string,
  data?: Record<string, any>,
  level: SeverityLevel = 'info'
): void => {
  addCustomBreadcrumb(
    BreadcrumbCategory.BUSINESS_LOGIC,
    `Business Event: ${event}`,
    level,
    {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }
  )
}

/**
 * Monitor WASM operations
 */
export const monitorWasmOperation = (
  operation: string,
  success: boolean,
  duration?: number,
  errorMessage?: string
): void => {
  const level: SeverityLevel = success ? 'info' : 'error'

  addCustomBreadcrumb(
    BreadcrumbCategory.WASM,
    `WASM: ${operation}`,
    level,
    {
      operation,
      success,
      duration,
      errorMessage,
    }
  )

  if (!success) {
    reportCustomError(
      CustomErrorType.WASM_RUNTIME_ERROR,
      `WASM operation failed: ${operation}`,
      {
        operation,
        duration,
        errorMessage,
      },
      'error'
    )
  }
}

/**
 * Add release information to Sentry context
 */
export const setReleaseContext = (
  version: string,
  commitSha?: string,
  buildTime?: string
): void => {
  const client = getSentryClient()
  if (!client) return

  client.setTags({
    release_version: version,
    commit_sha: commitSha || 'unknown',
    build_time: buildTime || 'unknown',
  })

  client.setExtras({
    release_info: {
      version,
      commitSha,
      buildTime,
    },
  })

  addCustomBreadcrumb(
    BreadcrumbCategory.API,
    'Release context updated',
    'info',
    {
      version,
      commitSha,
      buildTime,
    }
  )
}

/**
 * Monitor API quota usage
 */
export const monitorQuotaUsage = (
  userId: string,
  quotaType: string,
  used: number,
  limit: number,
  period: string
): void => {
  const percentageUsed = Math.round((used / limit) * 100)
  const isNearLimit = percentageUsed >= 90

  addCustomBreadcrumb(
    BreadcrumbCategory.BUSINESS_LOGIC,
    `Quota Usage: ${quotaType}`,
    isNearLimit ? 'warning' : 'info',
    {
      userId,
      quotaType,
      used,
      limit,
      period,
      percentageUsed,
      isNearLimit,
    }
  )

  if (percentageUsed >= 100) {
    reportCustomError(
      CustomErrorType.QUOTA_EXCEEDED,
      `Quota exceeded for ${quotaType}`,
      {
        userId,
        quotaType,
        used,
        limit,
        period,
      },
      'warning'
    )
  }
}

/**
 * Monitor subscription tier limits
 */
export const monitorSubscriptionLimits = (
  userId: string,
  tier: string,
  feature: string,
  usage: number,
  limit: number
): void => {
  const percentageUsed = Math.round((usage / limit) * 100)
  const isNearLimit = percentageUsed >= 90

  addCustomBreadcrumb(
    BreadcrumbCategory.BUSINESS_LOGIC,
    `Subscription Limit: ${feature}`,
    isNearLimit ? 'warning' : 'info',
    {
      userId,
      tier,
      feature,
      usage,
      limit,
      percentageUsed,
      isNearLimit,
    }
  )

  if (usage > limit) {
    reportCustomError(
      CustomErrorType.SUBSCRIPTION_LIMIT_EXCEEDED,
      `Subscription limit exceeded for ${feature}`,
      {
        userId,
        tier,
        feature,
        usage,
        limit,
      },
      'warning'
    )
  }
}

export default {
  addCustomBreadcrumb,
  addDatabaseBreadcrumb,
  addFileBreadcrumb,
  addExternalServiceBreadcrumb,
  addAuthBreadcrumb,
  addRateLimitBreadcrumb,
  addCollaborationBreadcrumb,
  addSecurityBreadcrumb,
  addPerformanceBreadcrumb,
  reportCustomError,
  monitorDatabaseOperation,
  monitorFileOperation,
  monitorExternalServiceCall,
  setSentryUserFromContext,
  monitorBusinessEvent,
  monitorWasmOperation,
  setReleaseContext,
  monitorQuotaUsage,
  monitorSubscriptionLimits,
  BreadcrumbCategory,
  CustomErrorType,
}
