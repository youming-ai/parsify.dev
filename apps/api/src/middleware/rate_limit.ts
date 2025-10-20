import { Context, Next } from 'hono'
import { RateLimitService, RateLimitCheck, RateLimitOptions } from '../services/rate_limit_service'
import { AuthContext } from './auth'

// Rate limiting strategies
export enum RateLimitStrategy {
  TOKEN_BUCKET = 'token_bucket',
  SLIDING_WINDOW = 'sliding_window',
  FIXED_WINDOW = 'fixed_window'
}

// Rate limiting algorithm types
export interface TokenBucketState {
  tokens: number
  lastRefill: number
  refillRate: number // tokens per second
  maxTokens: number
}

export interface SlidingWindowState {
  requests: Array<{ timestamp: number; count: number }>
  windowSizeMs: number
  maxRequests: number
}

export interface FixedWindowState {
  count: number
  windowStart: number
  windowSizeMs: number
  maxRequests: number
}

// Middleware configuration
export interface RateLimitMiddlewareConfig {
  // Rate limiting strategy
  strategy?: RateLimitStrategy

  // Basic limits
  requests?: number
  window?: number // in seconds

  // User tier limits
  limits?: {
    anonymous?: number
    free?: number
    pro?: number
    enterprise?: number
  }

  // Route-specific configuration
  route?: {
    path?: string
    method?: string
    weight?: number // cost of this request in tokens/points
  }

  // Rate limit type for service integration
  quotaType?: string

  // Period for quota
  period?: 'minute' | 'hour' | 'day' | 'week' | 'month'

  // Custom key generator
  keyGenerator?: (c: Context) => string | Promise<string>

  // Skip rate limiting for certain conditions
  skip?: (c: Context) => boolean | Promise<boolean>

  // Custom error handler
  onError?: (c: Context, check: RateLimitCheck) => Response | Promise<Response>

  // Enable distributed rate limiting via Cloudflare KV
  distributed?: boolean

  // Cache TTL for distributed rate limiting (in seconds)
  cacheTTL?: number

  // Bypass rate limiting for certain users
  bypassUsers?: string[]

  // Enable headers in response
  headers?: boolean
}

// Rate limit error response
export interface RateLimitErrorResponse {
  error: string
  message: string
  retryAfter?: number
  limit: number
  remaining: number
  resetTime: number
  strategy: RateLimitStrategy
  requestId?: string
}

/**
 * Rate limiting middleware for Hono with support for multiple strategies
 * Integrates with RateLimitService and Cloudflare KV for distributed rate limiting
 */
export const rateLimitMiddleware = (config: RateLimitMiddlewareConfig = {}) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const {
      strategy = RateLimitStrategy.TOKEN_BUCKET,
      requests = 100,
      window = 3600, // 1 hour
      limits = {
        anonymous: 100,
        free: 1000,
        pro: 5000,
        enterprise: 50000
      },
      route = {},
      quotaType = 'api_requests',
      period = 'hour',
      keyGenerator,
      skip,
      onError,
      distributed = true,
      cacheTTL = 300, // 5 minutes
      bypassUsers = [],
      headers = true
    } = config

    // Skip rate limiting if condition is met
    if (skip && await skip(c)) {
      await next()
      return
    }

    const requestId = c.get('requestId')
    const cloudflare = c.get('cloudflare')
    const auth = c.get('auth') as AuthContext

    // Get client IP
    const clientIP = c.req.header('CF-Connecting-IP') ||
                    c.req.header('X-Forwarded-For') ||
                    c.req.header('X-Real-IP') ||
                    'unknown'

    try {
      // Generate rate limit key
      const key = keyGenerator
        ? await keyGenerator(c)
        : generateDefaultRateLimitKey(c, auth, clientIP, route)

      // Check if user should bypass rate limiting
      if (auth.user && bypassUsers.includes(auth.user.id)) {
        await next()
        return
      }

      // Initialize rate limit service
      const rateLimitService = new RateLimitService({
        db: c.env.DB,
        kv: c.env.CACHE,
        auditEnabled: true,
        enableDistributedLimiting: distributed
      })

      // Determine appropriate limit based on user tier
      let limit = requests
      if (auth.user) {
        limit = limits[auth.user.subscription_tier] || limits.free || requests
      } else {
        limit = limits.anonymous || requests
      }

      // Apply route weight if specified
      const weight = route.weight || 1

      // Check rate limit using the configured strategy
      let check: RateLimitCheck

      switch (strategy) {
        case RateLimitStrategy.TOKEN_BUCKET:
          check = await checkTokenBucketRateLimit(
            rateLimitService,
            key,
            limit,
            window,
            weight,
            distributed,
            cacheTTL
          )
          break

        case RateLimitStrategy.SLIDING_WINDOW:
          check = await checkSlidingWindowRateLimit(
            rateLimitService,
            key,
            limit,
            window,
            weight,
            distributed,
            cacheTTL
          )
          break

        case RateLimitStrategy.FIXED_WINDOW:
          check = await checkFixedWindowRateLimit(
            rateLimitService,
            key,
            limit,
            window,
            weight,
            distributed,
            cacheTTL
          )
          break

        default:
          // Fallback to service-based rate limiting
          check = await rateLimitService.checkRateLimit({
            identifier: key,
            quotaType,
            amount: weight,
            customLimit: limit,
            customPeriod: period
          })
      }

      // Add rate limit headers if enabled
      if (headers) {
        c.header('X-Rate-Limit-Limit', check.limit.toString())
        c.header('X-Rate-Limit-Remaining', check.remaining.toString())
        c.header('X-Rate-Limit-Reset', check.resetTime.toString())
        c.header('X-Rate-Limit-Strategy', strategy)

        if (check.retryAfter) {
          c.header('Retry-After', Math.ceil(check.retryAfter / 1000).toString())
        }
      }

      // Check if request is allowed
      if (!check.allowed) {
        if (onError) {
          return await onError(c, check)
        }

        return handleRateLimitError(c, check, strategy, requestId)
      }

      // Continue to next middleware
      await next()

    } catch (error) {
      console.error('Rate limiting middleware error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: c.req.path,
        method: c.req.method,
        requestId,
      })

      // Fail open - continue even if rate limiting fails
      await next()
    }
  }
}

/**
 * Token bucket rate limiting implementation
 */
async function checkTokenBucketRateLimit(
  service: RateLimitService,
  key: string,
  limit: number,
  window: number,
  weight: number,
  distributed: boolean,
  cacheTTL: number
): Promise<RateLimitCheck> {
  const bucketKey = `token_bucket:${key}`
  const now = Date.now()
  const refillRate = limit / window // tokens per second
  const maxTokens = limit

  try {
    // Try to get existing bucket state from cache
    let bucket: TokenBucketState

    if (distributed && service['kv']) {
      const cached = await service['kv'].get(bucketKey)
      if (cached) {
        bucket = JSON.parse(cached) as TokenBucketState
      } else {
        bucket = {
          tokens: maxTokens,
          lastRefill: now,
          refillRate,
          maxTokens
        }
      }
    } else {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
        refillRate,
        maxTokens
      }
    }

    // Refill tokens based on time elapsed
    const timeElapsed = (now - bucket.lastRefill) / 1000 // in seconds
    const tokensToAdd = timeElapsed * refillRate
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now

    // Check if enough tokens are available
    if (bucket.tokens >= weight) {
      bucket.tokens -= weight

      // Save updated bucket state
      if (distributed && service['kv']) {
        await service['kv'].put(bucketKey, JSON.stringify(bucket), {
          expirationTtl: cacheTTL
        })
      }

      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        limit: maxTokens,
        resetTime: now + (window * 1000)
      }
    } else {
      // Not enough tokens - calculate when tokens will be available
      const tokensNeeded = weight - bucket.tokens
      const waitTime = (tokensNeeded / refillRate) * 1000 // in milliseconds

      // Save current bucket state
      if (distributed && service['kv']) {
        await service['kv'].put(bucketKey, JSON.stringify(bucket), {
          expirationTtl: cacheTTL
        })
      }

      return {
        allowed: false,
        remaining: 0,
        limit: maxTokens,
        resetTime: now + waitTime,
        retryAfter: waitTime
      }
    }
  } catch (error) {
    console.error('Token bucket rate limiting error:', error)

    // Fallback to service-based rate limiting
    return await service.checkRateLimit({
      identifier: key,
      quotaType: 'api_requests',
      amount: weight,
      customLimit: limit
    })
  }
}

/**
 * Sliding window rate limiting implementation
 */
async function checkSlidingWindowRateLimit(
  service: RateLimitService,
  key: string,
  limit: number,
  window: number,
  weight: number,
  distributed: boolean,
  cacheTTL: number
): Promise<RateLimitCheck> {
  const windowKey = `sliding_window:${key}`
  const now = Date.now()
  const windowSizeMs = window * 1000

  try {
    // Try to get existing window state from cache
    let state: SlidingWindowState

    if (distributed && service['kv']) {
      const cached = await service['kv'].get(windowKey)
      if (cached) {
        state = JSON.parse(cached) as SlidingWindowState
      } else {
        state = {
          requests: [],
          windowSizeMs,
          maxRequests: limit
        }
      }
    } else {
      state = {
        requests: [],
        windowSizeMs,
        maxRequests: limit
      }
    }

    // Remove old requests outside the window
    const windowStart = now - state.windowSizeMs
    state.requests = state.requests.filter(req => req.timestamp > windowStart)

    // Calculate current usage
    const currentUsage = state.requests.reduce((sum, req) => sum + req.count, 0)

    // Check if adding this request would exceed the limit
    if (currentUsage + weight <= state.maxRequests) {
      // Add current request
      state.requests.push({
        timestamp: now,
        count: weight
      })

      // Save updated state
      if (distributed && service['kv']) {
        await service['kv'].put(windowKey, JSON.stringify(state), {
          expirationTtl: cacheTTL
        })
      }

      return {
        allowed: true,
        remaining: state.maxRequests - currentUsage - weight,
        limit: state.maxRequests,
        resetTime: now + state.windowSizeMs
      }
    } else {
      // Rate limit exceeded - calculate when the oldest request will expire
      const oldestRequest = state.requests[0]
      const resetTime = oldestRequest ? oldestRequest.timestamp + state.windowSizeMs : now + state.windowSizeMs
      const retryAfter = Math.max(0, resetTime - now)

      // Save current state
      if (distributed && service['kv']) {
        await service['kv'].put(windowKey, JSON.stringify(state), {
          expirationTtl: cacheTTL
        })
      }

      return {
        allowed: false,
        remaining: 0,
        limit: state.maxRequests,
        resetTime,
        retryAfter
      }
    }
  } catch (error) {
    console.error('Sliding window rate limiting error:', error)

    // Fallback to service-based rate limiting
    return await service.checkRateLimit({
      identifier: key,
      quotaType: 'api_requests',
      amount: weight,
      customLimit: limit
    })
  }
}

/**
 * Fixed window rate limiting implementation
 */
async function checkFixedWindowRateLimit(
  service: RateLimitService,
  key: string,
  limit: number,
  window: number,
  weight: number,
  distributed: boolean,
  cacheTTL: number
): Promise<RateLimitCheck> {
  const windowKey = `fixed_window:${key}`
  const now = Date.now()
  const windowSizeMs = window * 1000
  const currentWindowStart = Math.floor(now / windowSizeMs) * windowSizeMs
  const windowEnd = currentWindowStart + windowSizeMs

  try {
    // Try to get existing window state from cache
    let state: FixedWindowState

    if (distributed && service['kv']) {
      const cached = await service['kv'].get(windowKey)
      if (cached) {
        state = JSON.parse(cached) as FixedWindowState
      } else {
        state = {
          count: 0,
          windowStart: currentWindowStart,
          windowSizeMs,
          maxRequests: limit
        }
      }
    } else {
      state = {
        count: 0,
        windowStart: currentWindowStart,
        windowSizeMs,
        maxRequests: limit
      }
    }

    // Check if we need to reset the window
    if (now > state.windowStart + state.windowSizeMs) {
      state.count = 0
      state.windowStart = currentWindowStart
    }

    // Check if adding this request would exceed the limit
    if (state.count + weight <= state.maxRequests) {
      state.count += weight

      // Save updated state
      if (distributed && service['kv']) {
        await service['kv'].put(windowKey, JSON.stringify(state), {
          expirationTtl: cacheTTL
        })
      }

      return {
        allowed: true,
        remaining: state.maxRequests - state.count,
        limit: state.maxRequests,
        resetTime: windowEnd
      }
    } else {
      // Rate limit exceeded
      const retryAfter = windowEnd - now

      // Save current state
      if (distributed && service['kv']) {
        await service['kv'].put(windowKey, JSON.stringify(state), {
          expirationTtl: cacheTTL
        })
      }

      return {
        allowed: false,
        remaining: 0,
        limit: state.maxRequests,
        resetTime: windowEnd,
        retryAfter
      }
    }
  } catch (error) {
    console.error('Fixed window rate limiting error:', error)

    // Fallback to service-based rate limiting
    return await service.checkRateLimit({
      identifier: key,
      quotaType: 'api_requests',
      amount: weight,
      customLimit: limit
    })
  }
}

/**
 * Generate default rate limit key based on request context
 */
function generateDefaultRateLimitKey(
  c: Context,
  auth: AuthContext,
  clientIP: string,
  route: { path?: string; method?: string }
): string {
  const parts = ['rate_limit']

  // Add user identification
  if (auth.user) {
    parts.push('user', auth.user.id)
  } else {
    parts.push('ip', clientIP)
  }

  // Add route information if specified
  if (route.path) {
    parts.push('path', route.path)
  }
  if (route.method) {
    parts.push('method', route.method)
  }

  return parts.join(':')
}

/**
 * Handle rate limit errors with appropriate response
 */
function handleRateLimitError(
  c: Context,
  check: RateLimitCheck,
  strategy: RateLimitStrategy,
  requestId?: string
): Response {
  const errorResponse: RateLimitErrorResponse = {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests. Please try again later.',
    limit: check.limit,
    remaining: check.remaining,
    resetTime: check.resetTime,
    strategy,
    requestId
  }

  if (check.retryAfter) {
    errorResponse.retryAfter = Math.ceil(check.retryAfter / 1000)
    c.header('Retry-After', Math.ceil(check.retryAfter / 1000).toString())
  }

  return c.json(errorResponse, 429)
}

// Predefined rate limit configurations
export const RateLimitPresets = {
  // API endpoints
  API_DEFAULT: {
    requests: 1000,
    window: 3600, // 1 hour
    limits: {
      anonymous: 100,
      free: 1000,
      pro: 5000,
      enterprise: 50000
    },
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    quotaType: 'api_requests',
    period: 'hour' as const
  },

  API_HEAVY: {
    requests: 100,
    window: 3600, // 1 hour
    limits: {
      anonymous: 10,
      free: 100,
      pro: 500,
      enterprise: 5000
    },
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    quotaType: 'api_requests',
    period: 'hour' as const,
    route: { weight: 10 }
  },

  // File upload endpoints
  FILE_UPLOAD: {
    requests: 50,
    window: 3600, // 1 hour
    limits: {
      anonymous: 5,
      free: 50,
      pro: 250,
      enterprise: 2500
    },
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    quotaType: 'file_uploads',
    period: 'hour' as const
  },

  // Job execution endpoints
  JOB_EXECUTION: {
    requests: 20,
    window: 3600, // 1 hour
    limits: {
      anonymous: 2,
      free: 20,
      pro: 100,
      enterprise: 1000
    },
    strategy: RateLimitStrategy.FIXED_WINDOW,
    quotaType: 'jobs_per_hour',
    period: 'hour' as const
  },

  // Authentication endpoints
  AUTH: {
    requests: 10,
    window: 900, // 15 minutes
    limits: {
      anonymous: 5,
      free: 10,
      pro: 20,
      enterprise: 50
    },
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    quotaType: 'auth_attempts',
    period: 'minute' as const
  }
}

// Middleware factory functions
export const createApiRateLimit = (customConfig?: Partial<RateLimitMiddlewareConfig>) => {
  return rateLimitMiddleware({
    ...RateLimitPresets.API_DEFAULT,
    ...customConfig
  })
}

export const createHeavyApiRateLimit = (customConfig?: Partial<RateLimitMiddlewareConfig>) => {
  return rateLimitMiddleware({
    ...RateLimitPresets.API_HEAVY,
    ...customConfig
  })
}

export const createFileUploadRateLimit = (customConfig?: Partial<RateLimitMiddlewareConfig>) => {
  return rateLimitMiddleware({
    ...RateLimitPresets.FILE_UPLOAD,
    ...customConfig
  })
}

export const createJobExecutionRateLimit = (customConfig?: Partial<RateLimitMiddlewareConfig>) => {
  return rateLimitMiddleware({
    ...RateLimitPresets.JOB_EXECUTION,
    ...customConfig
  })
}

export const createAuthRateLimit = (customConfig?: Partial<RateLimitMiddlewareConfig>) => {
  return rateLimitMiddleware({
    ...RateLimitPresets.AUTH,
    ...customConfig
  })
}

// Helper functions
export const getClientIP = (c: Context): string => {
  return c.req.header('CF-Connecting-IP') ||
         c.req.header('X-Forwarded-For') ||
         c.req.header('X-Real-IP') ||
         'unknown'
}

export const getUserTierMultiplier = (tier: string): number => {
  const multipliers: Record<string, number> = {
    free: 1,
    pro: 5,
    enterprise: 20
  }
  return multipliers[tier] || 1
}

export const generateRateLimitKey = (
  type: string,
  identifier: string,
  route?: string,
  method?: string
): string => {
  const parts = ['rate_limit', type, identifier]
  if (route) parts.push('route', route)
  if (method) parts.push('method', method)
  return parts.join(':')
}
