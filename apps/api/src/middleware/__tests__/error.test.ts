import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { z } from 'zod'
import {
  errorMiddleware,
  ValidationError,
  AuthenticationError,
  DatabaseError,
  RateLimitError,
  TimeoutError,
  ConfigurationError,
  ExternalServiceError,
  createValidationError,
  createAuthenticationError,
  createDatabaseError,
  createRateLimitError,
  ApiError,
  getErrorHandler,
  getErrorMetrics
} from '../error'

// Mock environment
const mockEnv = {
  ENVIRONMENT: 'test',
  API_VERSION: 'v1',
  JWT_SECRET: 'test-secret',
  DB: {} as D1Database,
  CACHE: {} as KVNamespace,
  SESSIONS: {} as KVNamespace,
  UPLOADS: {} as KVNamespace,
  ANALYTICS: {} as KVNamespace,
  FILES: {} as R2Bucket,
  SESSION_MANAGER: {} as DurableObjectNamespace,
  COLLABORATION_ROOM: {} as DurableObjectNamespace,
  REALTIME_SYNC: {} as DurableObjectNamespace,
  ENABLE_METRICS: 'true',
  LOG_LEVEL: 'debug',
  ENABLE_HEALTH_CHECKS: 'true',
  ENABLE_CORS: 'true',
  MAX_REQUEST_SIZE: '1048576',
  REQUEST_TIMEOUT: '30000'
}

// Mock Cloudflare service
vi.mock('../../services/cloudflare', () => ({
  createCloudflareService: vi.fn(() => ({
    cacheGet: vi.fn(),
    cacheSet: vi.fn(),
    getHealthStatus: vi.fn(),
    getMetrics: vi.fn()
  }))
}))

describe('Error Middleware', () => {
  let app: Hono
  let errorHandler: any

  beforeEach(() => {
    // Reset error handler metrics
    const handler = getErrorHandler()
    handler.clearMetrics()

    // Create new Hono app with error middleware
    app = new Hono()
    app.use('*', errorMiddleware())

    // Add test routes
    app.get('/success', (c) => c.json({ success: true }))
    app.get('/validation-error', () => {
      throw new ValidationError('Invalid input', 'email', { value: 'invalid-email' })
    })
    app.get('/auth-error', () => {
      throw new AuthenticationError('Invalid token')
    })
    app.get('/database-error', () => {
      throw new DatabaseError('Connection failed')
    })
    app.get('/rate-limit-error', () => {
      throw new RateLimitError('Too many requests', 60)
    })
    app.get('/timeout-error', () => {
      throw new TimeoutError('Request timed out', 30000)
    })
    app.get('/config-error', () => {
      throw new ConfigurationError('Missing env var')
    })
    app.get('/external-error', () => {
      throw new ExternalServiceError('Service down', 'payment-service')
    })
    app.get('/http-exception', () => {
      throw new HTTPException(404, { message: 'Not found' })
    })
    app.get('/zod-error', () => {
      const schema = z.object({ email: z.string().email() })
      throw new ZodError([
        {
          code: z.ZodIssueCode.invalid_string,
          validation: 'email',
          path: ['email'],
          message: 'Invalid email'
        }
      ])
    })
    app.get('/generic-error', () => {
      throw new Error('Something went wrong')
    })
    app.get('/wasm-error', () => {
      const { WasmError } = require('../../wasm/modules/core/wasm-error-handler')
      throw new WasmError('WASM compilation failed', 'COMPILATION_ERROR', 'json-formatter')
    })
  })

  describe('Success cases', () => {
    it('should allow successful requests to pass through', async () => {
      const res = await app.request('/success', {}, mockEnv)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true })
    })
  })

  describe('Validation errors', () => {
    it('should handle validation errors correctly', async () => {
      const res = await app.request('/validation-error', {}, mockEnv)
      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data.error).toBe('ValidationError')
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.category).toBe('validation')
      expect(data.severity).toBe('low')
      expect(data.recoverable).toBe(true)
      expect(data.suggestions).toContain('Check the request parameters')
      expect(data.requestId).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    it('should handle Zod validation errors', async () => {
      const res = await app.request('/zod-error', {}, mockEnv)
      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data.error).toBe('ValidationError')
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.message).toContain('Validation failed')
      expect(data.context?.zodErrors).toBeDefined()
    })
  })

  describe('Authentication errors', () => {
    it('should handle authentication errors correctly', async () => {
      const res = await app.request('/auth-error', {}, mockEnv)
      expect(res.status).toBe(401)

      const data = await res.json()
      expect(data.error).toBe('AuthenticationError')
      expect(data.code).toBe('AUTHENTICATION_ERROR')
      expect(data.category).toBe('authentication')
      expect(data.severity).toBe('medium')
      expect(data.recoverable).toBe(false)
      expect(data.suggestions).toContain('Check your authentication credentials')
    })
  })

  describe('Database errors', () => {
    it('should handle database errors correctly', async () => {
      const res = await app.request('/database-error', {}, mockEnv)
      expect(res.status).toBe(500)

      const data = await res.json()
      expect(data.error).toBe('DatabaseError')
      expect(data.code).toBe('DATABASE_ERROR')
      expect(data.category).toBe('database')
      expect(data.severity).toBe('high')
      expect(data.recoverable).toBe(false)
    })
  })

  describe('Rate limit errors', () => {
    it('should handle rate limit errors correctly', async () => {
      const res = await app.request('/rate-limit-error', {}, mockEnv)
      expect(res.status).toBe(429)

      const data = await res.json()
      expect(data.error).toBe('RateLimitError')
      expect(data.code).toBe('RATE_LIMIT_ERROR')
      expect(data.category).toBe('rate_limit')
      expect(data.severity).toBe('medium')
      expect(data.recoverable).toBe(true)
      expect(data.context?.retryAfter).toBe(60)
    })
  })

  describe('Timeout errors', () => {
    it('should handle timeout errors correctly', async () => {
      const res = await app.request('/timeout-error', {}, mockEnv)
      expect(res.status).toBe(408)

      const data = await res.json()
      expect(data.error).toBe('TimeoutError')
      expect(data.code).toBe('TIMEOUT_ERROR')
      expect(data.category).toBe('timeout')
      expect(data.severity).toBe('medium')
      expect(data.recoverable).toBe(true)
      expect(data.context?.timeout).toBe(30000)
    })
  })

  describe('Configuration errors', () => {
    it('should handle configuration errors correctly', async () => {
      const res = await app.request('/config-error', {}, mockEnv)
      expect(res.status).toBe(500)

      const data = await res.json()
      expect(data.error).toBe('ConfigurationError')
      expect(data.code).toBe('CONFIGURATION_ERROR')
      expect(data.category).toBe('configuration')
      expect(data.severity).toBe('critical')
      expect(data.recoverable).toBe(false)
    })
  })

  describe('External service errors', () => {
    it('should handle external service errors correctly', async () => {
      const res = await app.request('/external-error', {}, mockEnv)
      expect(res.status).toBe(502)

      const data = await res.json()
      expect(data.error).toBe('ExternalServiceError')
      expect(data.code).toBe('EXTERNAL_SERVICE_ERROR')
      expect(data.category).toBe('external_service')
      expect(data.severity).toBe('medium')
      expect(data.recoverable).toBe(true)
    })
  })

  describe('HTTP exceptions', () => {
    it('should handle Hono HTTP exceptions', async () => {
      const res = await app.request('/http-exception', {}, mockEnv)
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error).toBe('ApiError')
      expect(data.code).toBe('HTTP_EXCEPTION')
      expect(data.category).toBe('validation')
      expect(data.severity).toBe('medium')
      expect(data.message).toBe('Not found')
    })
  })

  describe('Generic errors', () => {
    it('should handle generic errors as internal server errors', async () => {
      const res = await app.request('/generic-error', {}, mockEnv)
      expect(res.status).toBe(500)

      const data = await res.json()
      expect(data.error).toBe('ApiError')
      expect(data.code).toBe('INTERNAL_ERROR')
      expect(data.category).toBe('internal')
      expect(data.severity).toBe('high')
      expect(data.recoverable).toBe(false)
    })
  })

  describe('WASM errors', () => {
    it('should handle WASM errors correctly', async () => {
      const res = await app.request('/wasm-error', {}, mockEnv)
      expect(res.status).toBe(500)

      const data = await res.json()
      expect(data.error).toBe('ApiError')
      expect(data.code).toBe('COMPILATION_ERROR')
      expect(data.category).toBe('wasm')
      expect(data.severity).toBe('critical')
    })
  })

  describe('Error context', () => {
    it('should include request ID in error responses', async () => {
      const res = await app.request('/validation-error', {}, mockEnv)
      const data = await res.json()
      expect(data.requestId).toBeDefined()
      expect(typeof data.requestId).toBe('string')
    })

    it('should include timestamp in error responses', async () => {
      const res = await app.request('/validation-error', {}, mockEnv)
      const data = await res.json()
      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should sanitize errors in production', async () => {
      const prodEnv = { ...mockEnv, ENVIRONMENT: 'production' }
      const prodApp = new Hono()
      prodApp.use('*', errorMiddleware())
      prodApp.get('/error', () => {
        throw new Error('Sensitive internal details')
      })

      const res = await prodApp.request('/error', {}, prodEnv)
      const data = await res.json()

      expect(data.stack).toBeUndefined()
      expect(data.context).toBeUndefined()
    })

    it('should include debug info in development', async () => {
      const devEnv = { ...mockEnv, ENVIRONMENT: 'development' }
      const devApp = new Hono()
      devApp.use('*', errorMiddleware())
      devApp.get('/error', () => {
        const error = new Error('Debug info')
        error.stack = 'Error: Debug info\n    at test'
        throw error
      })

      const res = await devApp.request('/error', {}, devEnv)
      const data = await res.json()

      expect(data.stack).toBeDefined()
      expect(data.context).toBeDefined()
    })
  })

  describe('Error metrics', () => {
    it('should track error metrics', async () => {
      // Trigger several errors
      await app.request('/validation-error', {}, mockEnv)
      await app.request('/auth-error', {}, mockEnv)
      await app.request('/database-error', {}, mockEnv)

      const metrics = getErrorMetrics()
      expect(metrics.totalErrors).toBe(3)
      expect(metrics.errorsByCategory.validation).toBe(1)
      expect(metrics.errorsByCategory.authentication).toBe(1)
      expect(metrics.errorsByCategory.database).toBe(1)
      expect(metrics.errorsBySeverity.low).toBe(1)
      expect(metrics.errorsBySeverity.medium).toBe(1)
      expect(metrics.errorsBySeverity.high).toBe(1)
      expect(metrics.recentErrors).toHaveLength(3)
    })

    it('should clear metrics', () => {
      getErrorHandler().clearMetrics()
      const metrics = getErrorMetrics()
      expect(metrics.totalErrors).toBe(0)
      expect(Object.keys(metrics.errorsByCategory)).toHaveLength(0)
      expect(Object.keys(metrics.errorsBySeverity)).toHaveLength(0)
      expect(Object.keys(metrics.errorsByCode)).toHaveLength(0)
      expect(metrics.recentErrors).toHaveLength(0)
    })
  })

  describe('Utility functions', () => {
    it('should create validation errors with utility function', () => {
      const error = createValidationError('Invalid email', 'email', { value: 'test' })
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Invalid email')
      expect(error.field).toBe('email')
    })

    it('should create authentication errors with utility function', () => {
      const error = createAuthenticationError('Token expired')
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Token expired')
    })

    it('should create database errors with utility function', () => {
      const error = createDatabaseError('Connection failed', { timeout: 5000 })
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.message).toBe('Connection failed')
      expect(error.context.timeout).toBe(5000)
    })

    it('should create rate limit errors with utility function', () => {
      const error = createRateLimitError('Too many requests', 120)
      expect(error).toBeInstanceOf(RateLimitError)
      expect(error.message).toBe('Too many requests')
      expect(error.retryAfter).toBe(120)
    })
  })

  describe('Error classification', () => {
    it('should classify timeout errors correctly', () => {
      const error = new Error('Request timed out after 30 seconds')
      const classified = getErrorHandler().classifyError(error, {} as any)
      expect(classified).toBeInstanceOf(TimeoutError)
    })

    it('should classify rate limit errors correctly', () => {
      const error = new Error('Rate limit exceeded')
      const classified = getErrorHandler().classifyError(error, {} as any)
      expect(classified).toBeInstanceOf(RateLimitError)
    })

    it('should classify authentication errors correctly', () => {
      const error = new Error('Unauthorized access')
      const classified = getErrorHandler().classifyError(error, {} as any)
      expect(classified).toBeInstanceOf(AuthenticationError)
    })

    it('should classify database errors correctly', () => {
      const error = new Error('Database connection failed')
      const classified = getErrorHandler().classifyError(error, {} as any)
      expect(classified).toBeInstanceOf(DatabaseError)
    })

    it('should classify network errors correctly', () => {
      const error = new Error('Network connection failed')
      const classified = getErrorHandler().classifyError(error, {} as any)
      expect(classified).toBeInstanceOf(NetworkError)
    })

    it('should classify configuration errors correctly', () => {
      const error = new Error('Missing environment variable')
      const classified = getErrorHandler().classifyError(error, {} as any)
      expect(classified).toBeInstanceOf(ConfigurationError)
    })
  })
})
