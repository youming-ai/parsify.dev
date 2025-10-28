/**
 * Examples of using the error handling middleware
 */

import { Hono } from 'hono'
import { z } from 'zod'
import {
  ApiError,
  createAuthenticationError,
  createDatabaseError,
  createRateLimitError,
  createTimeoutError,
  createValidationError,
  errorMiddleware,
  handleAsyncError,
  ValidationError,
} from './error'

// Example 1: Basic setup with error middleware
const app = new Hono()

// Add error middleware (should be added early)
app.use('*', errorMiddleware())

// Example 2: Route with manual error handling
app.post('/users', async c => {
  const body = await c.req.json()

  // Manual validation error
  if (!body.email || !body.email.includes('@')) {
    throw createValidationError('Invalid email format', 'email', {
      provided: body.email,
      expected: 'valid email address',
    })
  }

  // Manual authentication error
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    throw createAuthenticationError('Authorization header required')
  }

  // Simulate database operation that might fail
  try {
    const user = await createUser(body)
    return c.json({ user }, 201)
  } catch (_error) {
    throw createDatabaseError('Failed to create user', {
      operation: 'create_user',
      email: body.email,
    })
  }
})

// Example 3: Using handleAsyncError for automatic error handling
app.get(
  '/posts/:id',
  handleAsyncError(async c => {
    const id = c.req.param('id')

    // This will automatically handle any errors thrown
    const post = await getPostById(id)
    if (!post) {
      throw new ValidationError('Post not found', 'id', { provided: id })
    }

    return c.json({ post })
  })
)

// Example 4: Zod validation integration
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be at least 18 years old'),
})

app.post('/users/validated', async c => {
  const body = await c.req.json()
  const validatedData = createUserSchema.parse(body)

  // Process validated data
  const user = await createUser(validatedData)
  return c.json({ user }, 201)
})

// Example 5: Custom error classes
class InsufficientQuotaError extends ApiError {
  constructor(current: number, limit: number) {
    super(
      `API quota exceeded. Current: ${current}, Limit: ${limit}`,
      'QUOTA_EXCEEDED',
      429,
      'rate_limit',
      'medium',
      { current, limit },
      true,
      ['Wait for quota to reset', 'Upgrade your plan', 'Reduce API usage']
    )
    this.name = 'InsufficientQuotaError'
  }
}

app.post('/process-data', async c => {
  const user = getCurrentUser(c)

  if (user.apiUsage >= user.apiLimit) {
    throw new InsufficientQuotaError(user.apiUsage, user.apiLimit)
  }

  // Process data
  const result = await processData(await c.req.json())

  // Update usage
  user.apiUsage += 1
  await updateUserUsage(user.id, user.apiUsage)

  return c.json({ result })
})

// Example 6: Error context enrichment
app.use('*', async (c, next) => {
  // Add user context to all requests
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    try {
      const user = await authenticateUser(authHeader)
      c.set('user', user)
      c.set('userId', user.id)
      c.set('sessionId', user.sessionId)
    } catch {
      // User not authenticated, continue without context
    }
  }

  await next()
})

// Example 7: Error handling in services
class UserService {
  async createUser(userData: any): Promise<User> {
    // Validate input
    if (!userData.email) {
      throw createValidationError('Email is required', 'email')
    }

    // Check if user exists
    const existingUser = await this.findByEmail(userData.email)
    if (existingUser) {
      throw new ValidationError('User already exists', 'email', {
        email: userData.email,
      })
    }

    // Database operation
    try {
      const user = await this.save(userData)
      return user
    } catch (_dbError) {
      throw createDatabaseError('Failed to save user', {
        operation: 'create_user',
        userData: userData.email,
      })
    }
  }

  async getUserWithQuota(userId: string): Promise<User> {
    const user = await this.findById(userId)
    if (!user) {
      throw new ValidationError('User not found', 'id', { userId })
    }

    // Check quota
    if (user.apiUsage >= user.apiLimit) {
      throw new InsufficientQuotaError(user.apiUsage, user.apiLimit)
    }

    return user
  }
}

// Example 8: External service integration
class PaymentService {
  async processPayment(paymentData: any): Promise<PaymentResult> {
    try {
      const result = await this.callPaymentGateway(paymentData)
      return result
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw createTimeoutError('Payment gateway timeout', 30000, {
          gateway: 'stripe',
          amount: paymentData.amount,
        })
      }

      if (error.name === 'NetworkError') {
        throw new ApiError(
          'Payment gateway unavailable',
          'PAYMENT_GATEWAY_ERROR',
          503,
          'external_service',
          'medium',
          { gateway: 'stripe', error: error.message },
          true,
          ['Try again later', 'Use alternative payment method']
        )
      }

      throw error
    }
  }
}

// Example 9: Rate limiting with custom errors
app.use('/api/premium/*', async (c, next) => {
  const user = c.get('user')

  if (!user || user.subscriptionTier !== 'premium') {
    throw createAuthenticationError('Premium subscription required')
  }

  // Check custom rate limits
  const key = `premium:${user.id}`
  const count = await redis.get(key)

  if (count && parseInt(count, 10) > 1000) {
    throw createRateLimitError(
      'Premium rate limit exceeded',
      3600, // 1 hour
      {
        limit: 1000,
        current: count,
        userId: user.id,
      }
    )
  }

  await next()
})

// Example 10: Global error logging and monitoring
app.use('*', errorMiddleware())

// Custom error handler for specific logging
app.onError((err, c) => {
  // Log to external monitoring service
  const errorData = {
    error: err.message,
    stack: err.stack,
    requestId: c.get('requestId'),
    userId: c.get('userId'),
    endpoint: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  }

  // Send to monitoring service (non-blocking)
  fetch('https://monitoring.example.com/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData),
  }).catch(() => {
    // Ignore monitoring failures
  })

  // Let the middleware handle the response
  throw err
})

// Example 11: Error recovery strategies
app.get(
  '/data-with-fallback',
  handleAsyncError(async c => {
    try {
      // Try primary data source
      const data = await getFromPrimarySource()
      return c.json({ source: 'primary', data })
    } catch (primaryError) {
      console.warn('Primary source failed, trying fallback:', primaryError)

      try {
        // Try fallback source
        const data = await getFromFallbackSource()
        return c.json({
          source: 'fallback',
          data,
          warning: 'Using fallback data source',
        })
      } catch (fallbackError) {
        // Both sources failed
        throw new ApiError(
          'All data sources unavailable',
          'DATA_SOURCES_FAILED',
          503,
          'external_service',
          'high',
          {
            primaryError: primaryError.message,
            fallbackError: fallbackError.message,
          },
          false,
          ['Try again later', 'Contact support']
        )
      }
    }
  })
)

// Example 12: Error handling middleware with custom options
const _customErrorMiddleware = (
  _options: {
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    includeStackTrace?: boolean
    customLogger?: (error: Error, context: any) => void
  } = {}
) => {
  return errorMiddleware()
}

// Helper functions (would be implemented elsewhere)
async function createUser(userData: any): Promise<any> {
  // Implementation
  return { id: '1', ...userData }
}

async function getPostById(_id: string): Promise<any> {
  // Implementation
  return null
}

function getCurrentUser(c: any): any {
  return c.get('user')
}

async function processData(_data: any): Promise<any> {
  // Implementation
  return { processed: true }
}

async function updateUserUsage(_userId: string, _usage: number): Promise<void> {
  // Implementation
}

async function authenticateUser(_authHeader: string): Promise<any> {
  // Implementation
  return { id: '1', email: 'user@example.com' }
}

async function getFromPrimarySource(): Promise<any> {
  // Implementation
  throw new Error('Primary source unavailable')
}

async function getFromFallbackSource(): Promise<any> {
  // Implementation
  return { fallback: true }
}

// Export the configured app
export default app
