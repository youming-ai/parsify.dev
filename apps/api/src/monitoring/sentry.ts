/**
 * Simplified Error Tracking and Performance Monitoring for Local Development
 *
 * This module provides basic error tracking functionality for local development.
 * In production, this would be replaced with full Sentry integration.
 */

import { Context, Next } from 'hono'

// Simplified environment interface
export interface SentryEnv {
  ENVIRONMENT: string
  API_VERSION: string
  LOG_LEVEL: string
  JWT_SECRET: string
  SENTRY_DSN: string
}

// Mock Sentry client for local development
class MockSentryClient {
  addBreadcrumb(breadcrumb: any) {
    console.log('Breadcrumb:', breadcrumb)
  }

  captureException(error: any) {
    console.error('Captured exception:', error)
  }

  captureMessage(message: string, level: string = 'info') {
    console.log(`[${level.toUpperCase()}] ${message}`)
  }

  setUser(user: any) {
    console.log('User set:', user?.id || 'anonymous')
  }

  setContext(context: string, data: any) {
    console.log(`Context [${context}]:`, data)
  }
}

let sentryClient: MockSentryClient | null = null

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry(
  env: SentryEnv,
  request?: Request
): MockSentryClient {
  if (env.ENVIRONMENT === 'development') {
    console.log('🔧 Running in development mode - using mock Sentry client')
    sentryClient = new MockSentryClient()
    return sentryClient
  }

  // For production, this would initialize real Sentry
  console.log('🚀 Production mode - Sentry would be initialized here')
  sentryClient = new MockSentryClient()
  return sentryClient
}

/**
 * Clear user context
 */
export function clearSentryUserContext(): void {
  if (sentryClient) {
    sentryClient.setUser(null)
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUserContext(user: {
  id: string
  email?: string
  username?: string
}): void {
  if (sentryClient) {
    sentryClient.setUser(user)
  }
}

/**
 * Sentry middleware options
 */
interface SentryMiddlewareOptions {
  performanceOptions?: {
    enableTracing?: boolean
    enableProfiling?: boolean
    enableMetrics?: boolean
    ignoredPaths?: string[]
    ignoredStatusCodes?: number[]
  }
  enableTracing?: boolean
  enableErrorCapture?: boolean
}

/**
 * Sentry middleware for Hono
 */
export function sentryMiddleware(options: SentryMiddlewareOptions = {}) {
  return async (c: Context, next: Next) => {
    const client = initializeSentry(c.env as SentryEnv, c.req.raw)

    // Add breadcrumb for request
    client.addBreadcrumb({
      category: 'http',
      message: `${c.req.method} ${c.req.path}`,
      level: 'info',
      data: {
        method: c.req.method,
        path: c.req.path,
        url: c.req.url,
        userAgent: c.req.header('User-Agent'),
      },
    })

    // Set request context
    client.setContext('request', {
      method: c.req.method,
      path: c.req.path,
      url: c.req.url,
      headers: Object.fromEntries(c.req.header()),
    })

    try {
      await next()
    } catch (error) {
      client.captureException(error)
      throw error
    }
  }
}

/**
 * Sentry error handler
 */
export function sentryErrorHandler() {
  return (c: Context, next: Next) => {
    try {
      return next()
    } catch (error) {
      const client = initializeSentry(c.env as SentryEnv, c.req.raw)
      client.captureException(error)
      throw error
    }
  }
}

/**
 * Helper function to capture manual exceptions
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
): void {
  if (sentryClient) {
    if (context) {
      sentryClient.setContext('additional', context)
    }
    sentryClient.captureException(error)
  }
}

/**
 * Helper function to capture messages
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (sentryClient) {
    sentryClient.captureMessage(message, level)
  }
}

/**
 * Add breadcrumb for custom events
 */
export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: string
  data?: Record<string, any>
}): void {
  if (sentryClient) {
    sentryClient.addBreadcrumb(breadcrumb)
  }
}

/**
 * Get the current Sentry client instance
 */
export function getSentryClient(): MockSentryClient | null {
  return sentryClient
}
