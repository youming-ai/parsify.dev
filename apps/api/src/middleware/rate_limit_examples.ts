/**
 * Examples demonstrating how to use the rate limiting middleware
 *
 * This file contains practical examples of how to configure and use
 * the rate limiting middleware in different scenarios.
 */

import { Hono } from 'hono'
import { authMiddleware, requirePremium } from './auth'
import {
  createApiRateLimit,
  createAuthRateLimit,
  createFileUploadRateLimit,
  RateLimitStrategy,
  rateLimitMiddleware,
} from './rate_limit'

const app = new Hono()

// Example 1: Basic API rate limiting with default settings
app.use('/api/v1/*', createApiRateLimit())

// Example 2: Custom rate limiting for specific routes
app.use(
  '/api/v1/tools/execute',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 50,
    window: 3600, // 1 hour
    limits: {
      anonymous: 5,
      free: 50,
      pro: 250,
      enterprise: 2500,
    },
    quotaType: 'execution_time',
    period: 'hour',
    route: {
      path: '/api/v1/tools/execute',
      method: 'POST',
      weight: 5, // Each execution costs 5 tokens
    },
  })
)

// Example 3: File upload rate limiting
app.use(
  '/api/v1/upload',
  authMiddleware({ required: true }),
  createFileUploadRateLimit({
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    requests: 25,
    window: 3600, // 1 hour
    limits: {
      anonymous: 3,
      free: 25,
      pro: 125,
      enterprise: 1250,
    },
  })
)

// Example 4: Heavy API operations with different limits
app.use(
  '/api/v1/analytics/*',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 20,
    window: 3600, // 1 hour
    limits: {
      free: 20,
      pro: 100,
      enterprise: 1000,
    },
    route: {
      weight: 10, // Analytics queries are expensive
    },
    // Skip rate limiting for enterprise users
    skip: async c => {
      const auth = c.get('auth')
      return auth.user?.subscription_tier === 'enterprise'
    },
  })
)

// Example 5: Authentication endpoints with strict limits
app.post(
  '/api/v1/auth/login',
  createAuthRateLimit({
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    requests: 5,
    window: 900, // 15 minutes
    // Use IP-based rate limiting for auth attempts
    keyGenerator: async c => {
      const clientIP =
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
      return `auth:${clientIP}`
    },
    // Custom error handler for auth endpoints
    onError: async (c, check) => {
      return c.json(
        {
          error: 'Too Many Authentication Attempts',
          message: 'Too many login attempts. Please try again later.',
          retryAfter: check.retryAfter ? Math.ceil(check.retryAfter / 1000) : undefined,
          resetTime: check.resetTime,
          requestId: c.get('requestId'),
        },
        429
      )
    },
  })
)

// Example 6: Premium features with higher limits
app.use(
  '/api/v1/premium/*',
  authMiddleware({ required: true }),
  requirePremium(),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 1000,
    window: 3600, // 1 hour
    limits: {
      pro: 1000,
      enterprise: 10000,
    },
    // Bypass rate limiting for enterprise users
    bypassUsers: ['enterprise-user-1', 'enterprise-user-2'],
  })
)

// Example 7: Custom rate limiting based on user activity
app.use(
  '/api/v1/webhooks/*',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    requests: 100,
    window: 3600, // 1 hour
    keyGenerator: async c => {
      const auth = c.get('auth')
      const userId = auth.user?.id || 'anonymous'
      const webhookId = c.req.param('webhookId') || 'default'
      return `webhook:${userId}:${webhookId}`
    },
  })
)

// Example 8: Rate limiting with custom headers and monitoring
app.use(
  '/api/v1/batch/*',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 10,
    window: 3600, // 1 hour
    limits: {
      free: 10,
      pro: 50,
      enterprise: 500,
    },
    route: {
      weight: 20, // Batch operations are expensive
    },
    headers: true,
    // Custom error handler with detailed information
    onError: async (c, check) => {
      // Log rate limit violation for monitoring
      console.warn('Rate limit exceeded:', {
        path: c.req.path,
        method: c.req.method,
        userId: c.get('auth')?.user?.id,
        limit: check.limit,
        used: check.limit - check.remaining,
        retryAfter: check.retryAfter,
        requestId: c.get('requestId'),
      })

      return c.json(
        {
          error: 'Batch Rate Limit Exceeded',
          message: 'You have exceeded the batch processing rate limit.',
          limit: check.limit,
          used: check.limit - check.remaining,
          resetTime: new Date(check.resetTime).toISOString(),
          retryAfter: check.retryAfter ? Math.ceil(check.retryAfter / 1000) : undefined,
          strategy: RateLimitStrategy.TOKEN_BUCKET,
          requestId: c.get('requestId'),
        },
        429
      )
    },
  })
)

// Example 9: Conditional rate limiting based on request size
app.use(
  '/api/v1/upload/large',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.FIXED_WINDOW,
    requests: 5,
    window: 3600, // 1 hour
    keyGenerator: async c => {
      const auth = c.get('auth')
      const userId = auth.user?.id || 'anonymous'
      const contentLength = parseInt(c.req.header('Content-Length') || '0', 10)

      // Different rate limits for different file sizes
      if (contentLength > 50 * 1024 * 1024) {
        // > 50MB
        return `upload:large:${userId}`
      } else if (contentLength > 10 * 1024 * 1024) {
        // > 10MB
        return `upload:medium:${userId}`
      } else {
        return `upload:small:${userId}`
      }
    },
  })
)

// Example 10: Global rate limiting with user-based scaling
app.use(
  '/api/v1/*',
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 1000,
    window: 3600, // 1 hour
    distributed: true,
    cacheTTL: 600, // 10 minutes
    keyGenerator: async c => {
      const auth = c.get('auth')

      if (auth.user) {
        // User-based rate limiting
        const tier = auth.user.subscription_tier || 'free'
        return `global:user:${auth.user.id}:${tier}`
      } else {
        // IP-based rate limiting for anonymous users
        const clientIP =
          c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
        return `global:ip:${clientIP}`
      }
    },
  })
)

// Example 11: Route-specific rate limiting in route definitions
const toolsRouter = new Hono()

// Apply base rate limiting to all tool routes
toolsRouter.use('*', createApiRateLimit())

// Additional rate limiting for expensive operations
toolsRouter.post(
  '/execute',
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 25,
    window: 3600,
    route: { weight: 5 },
    quotaType: 'execution_time',
  })
)

toolsRouter.post(
  '/batch',
  authMiddleware({ required: true }),
  requirePremium(),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    requests: 5,
    window: 3600,
    route: { weight: 50 },
    quotaType: 'batch_operations',
  })
)

// Example 12: Dynamic rate limiting based on system load
app.use(
  '/api/v1/process/*',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 100,
    window: 3600,
    // Adjust limits based on current system load
    keyGenerator: async c => {
      const auth = c.get('auth')
      const userId = auth.user?.id || 'anonymous'

      // Check system load (this would be implemented in your monitoring system)
      const systemLoad = await getSystemLoad()

      if (systemLoad > 0.8) {
        // High load - more restrictive rate limiting
        return `process:high_load:${userId}`
      } else if (systemLoad > 0.5) {
        // Medium load - normal rate limiting
        return `process:medium_load:${userId}`
      } else {
        // Low load - more permissive rate limiting
        return `process:low_load:${userId}`
      }
    },
  })
)

// Example 13: Rate limiting with circuit breaker pattern
app.use(
  '/api/v1/external/*',
  authMiddleware({ required: true }),
  rateLimitMiddleware({
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    requests: 50,
    window: 3600,
    // Skip rate limiting if external service is down
    skip: async _c => {
      const isExternalServiceHealthy = await checkExternalServiceHealth()
      return !isExternalServiceHealthy
    },
  })
)

// Helper function for system load (would be implemented in your monitoring system)
async function getSystemLoad(): Promise<number> {
  // This would typically query your monitoring system
  // For now, return a mock value
  return 0.3
}

// Helper function for external service health check
async function checkExternalServiceHealth(): Promise<boolean> {
  // This would typically check the health of external services
  // For now, return a mock value
  return true
}

export default app
