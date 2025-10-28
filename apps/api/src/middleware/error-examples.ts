/**
 * Usage examples and integration guide for the error handling middleware
 */

import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import {
  AuthenticationError,
  createAuthenticationError,
  createDatabaseError,
  createExternalServiceError,
  createRateLimitError,
  createTimeoutError,
  createValidationError,
  DatabaseError,
  errorMiddleware,
  handleAsyncError,
  ValidationError,
} from './error'

// Example 1: Basic integration with Hono app
export function createAppWithErrorHandling() {
  const app = new Hono()

  // Add error middleware globally
  app.use('*', errorMiddleware())

  // Your existing middleware (auth, rate limiting, etc.)
  // app.use('*', authMiddleware())
  // app.use('*', rateLimitMiddleware())

  return app
}

// Example 2: Route handlers with error handling
export function setupRoutes(app: Hono) {
  // Route with automatic error handling
  app.get('/api/users/:id', async c => {
    const userId = c.req.param('id')

    // This will be caught by the error middleware
    if (!userId || Number.isNaN(Number(userId))) {
      throw createValidationError('Invalid user ID', 'id', { value: userId })
    }

    try {
      // Simulate database call that might fail
      const user = await fetchUserFromDatabase(userId)
      if (!user) {
        throw createValidationError('User not found', 'id', { value: userId })
      }

      return c.json({ user })
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error // Re-throw known errors
      }
      throw createDatabaseError('Failed to fetch user', { userId })
    }
  })

  // Route using handleAsyncError wrapper
  app.post(
    '/api/users',
    handleAsyncError(async c => {
      const userData = await c.req.json()

      // Validate input
      const validationError = validateUserData(userData)
      if (validationError) {
        throw validationError
      }

      // Create user
      const user = await createUserInDatabase(userData)
      return c.json({ user }, 201)
    })
  )

  // Route with Zod validation
  const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().min(18, 'Must be at least 18 years old'),
  })

  app.post(
    '/api/users/validated',
    zValidator('json', createUserSchema),
    handleAsyncError(async c => {
      const userData = c.req.valid('json')
      const user = await createUserInDatabase(userData)
      return c.json({ user }, 201)
    })
  )
}

// Example 3: Service layer with error handling
export class UserService {
  async getUserById(id: string) {
    try {
      // Database operation that might fail
      const user = await this.fetchFromDatabase(id)

      if (!user) {
        throw createValidationError('User not found', 'id', { value: id })
      }

      return user
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw createTimeoutError('Database query timeout', 30000, {
          operation: 'getUserById',
          id,
        })
      }

      throw createDatabaseError('Failed to fetch user', {
        id,
        originalError: error,
      })
    }
  }

  async createUser(userData: any) {
    // Business logic validation
    if (await this.emailExists(userData.email)) {
      throw createValidationError('Email already exists', 'email', {
        value: userData.email,
      })
    }

    try {
      const user = await this.saveToDatabase(userData)
      return user
    } catch (error) {
      throw createDatabaseError('Failed to create user', {
        userData,
        originalError: error,
      })
    }
  }

  private async fetchFromDatabase(_id: string): Promise<any> {
    // Simulate database operation
    return null
  }

  private async saveToDatabase(userData: any): Promise<any> {
    // Simulate database save
    return { id: '123', ...userData }
  }

  private async emailExists(_email: string): Promise<boolean> {
    // Simulate email check
    return false
  }
}

// Example 4: External service integration with error handling
export class PaymentService {
  async processPayment(userId: string, amount: number) {
    try {
      // Call external payment service
      const response = await this.callPaymentAPI(userId, amount)

      if (!response.success) {
        throw createExternalServiceError('Payment processing failed', 'payment-service', {
          userId,
          amount,
          errorCode: response.errorCode,
        })
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.message.includes('network')) {
        throw createExternalServiceError('Payment service unreachable', 'payment-service', {
          userId,
          amount,
          originalError: error,
        })
      }

      throw error
    }
  }

  private async callPaymentAPI(_userId: string, _amount: number): Promise<any> {
    // Simulate external API call
    return { success: false, errorCode: 'INSUFFICIENT_FUNDS' }
  }
}

// Example 5: WASM module error handling
export class JsonFormatterService {
  async formatJson(jsonString: string, options: any) {
    // This would call WASM module
    const result = await this.callWasmFormatter(jsonString, options)
    return result
  }

  private async callWasmFormatter(_jsonString: string, _options: any): Promise<any> {
    // Simulate WASM call that might fail
    throw new Error('WASM compilation failed')
  }
}

// Example 6: Rate limiting with custom error handling
export class RateLimitService {
  async checkRateLimit(userId: string, operation: string) {
    const limit = await this.getUserLimit(userId, operation)
    const current = await this.getCurrentUsage(userId, operation)

    if (current >= limit) {
      const resetTime = await this.getResetTime(userId, operation)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      throw createRateLimitError(`Rate limit exceeded for ${operation}`, retryAfter, {
        userId,
        operation,
        limit,
        current,
        resetTime,
      })
    }

    return true
  }

  private async getUserLimit(_userId: string, _operation: string): Promise<number> {
    // Simulate getting user-specific limits
    return 100
  }

  private async getCurrentUsage(_userId: string, _operation: string): Promise<number> {
    // Simulate getting current usage
    return 95
  }

  private async getResetTime(_userId: string, _operation: string): Promise<number> {
    // Simulate getting reset time
    return Date.now() + 300000 // 5 minutes from now
  }
}

// Example 7: Authentication with custom errors
export class AuthService {
  async authenticateUser(token: string) {
    try {
      const payload = await this.verifyToken(token)

      if (!payload) {
        throw createAuthenticationError('Invalid authentication token', {
          token: '***',
        })
      }

      if (payload.exp < Date.now() / 1000) {
        throw createAuthenticationError('Token has expired', { token: '***' })
      }

      return payload
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }

      throw createAuthenticationError('Authentication failed', {
        originalError: error,
      })
    }
  }

  async authorizeUser(userId: string, resource: string, action: string) {
    const permissions = await this.getUserPermissions(userId)

    if (!this.hasPermission(permissions, resource, action)) {
      throw new AuthenticationError(`Insufficient permissions for ${action} on ${resource}`, {
        userId,
        resource,
        action,
        permissions,
      })
    }

    return true
  }

  private async verifyToken(_token: string): Promise<any> {
    // Simulate token verification
    return null
  }

  private async getUserPermissions(_userId: string): Promise<string[]> {
    // Simulate getting user permissions
    return ['read:own']
  }

  private hasPermission(permissions: string[], resource: string, action: string): boolean {
    return permissions.includes(`${action}:${resource}`)
  }
}

// Example 8: Configuration validation with errors
export class ConfigService {
  validateConfiguration(config: any) {
    const requiredFields = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL']
    const missing = requiredFields.filter(field => !config[field])

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`)
    }

    if (config.DATABASE_URL && !config.DATABASE_URL.startsWith('postgres://')) {
      throw new Error('Invalid database URL format')
    }

    return true
  }

  loadConfiguration() {
    try {
      const config = {
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        REDIS_URL: process.env.REDIS_URL,
      }

      this.validateConfiguration(config)
      return config
    } catch (error) {
      throw new Error(`Configuration error: ${error.message}`)
    }
  }
}

// Example 9: Complete route implementation
export function setupCompleteRoutes(app: Hono) {
  const userService = new UserService()
  const paymentService = new PaymentService()
  const authService = new AuthService()
  const rateLimitService = new RateLimitService()

  // User management routes
  app.get(
    '/api/users/:id',
    handleAsyncError(async c => {
      const userId = c.req.param('id')
      const user = await userService.getUserById(userId)
      return c.json({ user })
    })
  )

  app.post(
    '/api/users',
    handleAsyncError(async c => {
      const userData = await c.req.json()

      // Check rate limit
      await rateLimitService.checkRateLimit(c.get('auth')?.user?.id, 'create_user')

      const user = await userService.createUser(userData)
      return c.json({ user }, 201)
    })
  )

  // Payment routes
  app.post(
    '/api/payments',
    handleAsyncError(async c => {
      const { userId, amount } = await c.req.json()

      // Authenticate and authorize
      await authService.authenticateUser(c.req.header('Authorization')?.replace('Bearer ', '')!)
      await authService.authorizeUser(userId, 'payment', 'create')

      // Check rate limit
      await rateLimitService.checkRateLimit(userId, 'payment')

      // Process payment
      const result = await paymentService.processPayment(userId, amount)
      return c.json(result)
    })
  )

  // Health check with error handling
  app.get(
    '/api/health',
    handleAsyncError(async c => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.checkDatabaseHealth(),
          redis: await this.checkRedisHealth(),
          external: await this.checkExternalServiceHealth(),
        },
      }

      return c.json(health)
    })
  )
}

// Helper functions
async function fetchUserFromDatabase(_id: string): Promise<any> {
  return null
}

async function createUserInDatabase(userData: any): Promise<any> {
  return { id: '123', ...userData }
}

function validateUserData(userData: any): ValidationError | null {
  if (!userData.email) {
    return createValidationError('Email is required', 'email')
  }
  return null
}

// Example 10: Error monitoring and metrics
export class ErrorMonitoringService {
  getErrorSummary() {
    const metrics = getErrorMetrics()

    return {
      total: metrics.totalErrors,
      byCategory: metrics.errorsByCategory,
      bySeverity: metrics.errorsBySeverity,
      recentErrors: metrics.recentErrors.slice(0, 10),
      topErrors: Object.entries(metrics.errorsByCode)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([code, count]) => ({ code, count })),
    }
  }

  getHealthStatus() {
    const metrics = getErrorMetrics()
    const recentCriticalErrors = metrics.recentErrors.filter(
      error => error.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
    ).length

    if (recentCriticalErrors > 5) {
      return { status: 'critical', errors: recentCriticalErrors }
    } else if (recentCriticalErrors > 0) {
      return { status: 'degraded', errors: recentCriticalErrors }
    } else {
      return { status: 'healthy', errors: 0 }
    }
  }
}

// Export all examples
export {
  createAppWithErrorHandling,
  setupRoutes,
  UserService,
  PaymentService,
  JsonFormatterService,
  RateLimitService,
  AuthService,
  ConfigService,
  setupCompleteRoutes,
  ErrorMonitoringService,
}
