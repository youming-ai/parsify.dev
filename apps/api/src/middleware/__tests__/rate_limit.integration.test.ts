/**
 * Integration tests for the rate limiting middleware
 * Tests real integration with RateLimitService and Cloudflare KV
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Hono } from 'hono'
import { RateLimitService } from '../../services/rate_limit_service'
import {
  rateLimitMiddleware,
  RateLimitStrategy,
  createApiRateLimit,
  createFileUploadRateLimit,
  createJobExecutionRateLimit,
  createAuthRateLimit
} from '../rate_limit'
import { authMiddleware } from '../auth'

// Mock environment
const mockEnv = {
  DB: {
    prepare: vi.fn(),
    batch: vi.fn(),
    exec: vi.fn()
  } as any,
  CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  SESSIONS: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'test'
} as any

describe('Rate Limit Integration Tests', () => {
  let app: Hono
  let rateLimitService: RateLimitService

  beforeEach(() => {
    vi.clearAllMocks()

    // Initialize rate limit service
    rateLimitService = new RateLimitService({
      db: mockEnv.DB,
      kv: mockEnv.CACHE,
      auditEnabled: true,
      enableDistributedLimiting: true
    })

    app = new Hono()

    // Mock Cloudflare service
    app.use('*', async (c, next) => {
      c.set('cloudflare', {
        cacheGet: (namespace: string, key: string) => mockEnv.CACHE.get(key),
        cacheSet: (namespace: string, key: string, value: any, options?: any) =>
          mockEnv.CACHE.put(key, JSON.stringify(value), options),
        cacheDelete: (namespace: string, key: string) => mockEnv.CACHE.delete(key)
      })
      c.set('requestId', 'test-request-id')
      await next()
    })

    // Mock database queries for RateLimitService
    mockEnv.DB.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn()
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Integration with Authentication', () => {
    it('should apply different rate limits for authenticated vs anonymous users', async () => {
      // Setup rate limiting with user tier limits
      app.use('/api/test', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600,
        limits: {
          anonymous: 10,
          free: 100,
          pro: 500,
          enterprise: 5000
        },
        distributed: true
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Test anonymous user (IP-based)
      const anonymousRes = await app.request('/api/test', {
        headers: {
          'CF-Connecting-IP': '192.168.1.100'
        }
      }, mockEnv)

      expect(anonymousRes.status).toBe(200)
      expect(anonymousRes.headers.get('X-Rate-Limit-Limit')).toBe('10')

      // Test authenticated free user
      app.use('/api/test/auth', async (c, next) => {
        c.set('auth', {
          user: {
            id: 'free-user-123',
            subscription_tier: 'free',
            email: 'free@example.com'
          },
          isAuthenticated: true
        })
        await next()
      })

      app.use('/api/test/auth', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600,
        limits: {
          anonymous: 10,
          free: 100,
          pro: 500,
          enterprise: 5000
        },
        distributed: true
      }))

      app.get('/api/test/auth', (c) => c.json({ message: 'success' }))

      const authRes = await app.request('/api/test/auth', {}, mockEnv)
      expect(authRes.status).toBe(200)
      expect(authRes.headers.get('X-Rate-Limit-Limit')).toBe('100')

      // Test authenticated pro user
      app.use('/api/test/pro', async (c, next) => {
        c.set('auth', {
          user: {
            id: 'pro-user-456',
            subscription_tier: 'pro',
            email: 'pro@example.com'
          },
          isAuthenticated: true
        })
        await next()
      })

      app.use('/api/test/pro', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600,
        limits: {
          anonymous: 10,
          free: 100,
          pro: 500,
          enterprise: 5000
        },
        distributed: true
      }))

      app.get('/api/test/pro', (c) => c.json({ message: 'success' }))

      const proRes = await app.request('/api/test/pro', {}, mockEnv)
      expect(proRes.status).toBe(200)
      expect(proRes.headers.get('X-Rate-Limit-Limit')).toBe('500')
    })

    it('should bypass rate limiting for enterprise users when configured', async () => {
      app.use('/api/premium', async (c, next) => {
        c.set('auth', {
          user: {
            id: 'enterprise-user-789',
            subscription_tier: 'enterprise',
            email: 'enterprise@example.com'
          },
          isAuthenticated: true
        })
        await next()
      })

      app.use('/api/premium', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        bypassUsers: ['enterprise-user-789']
      }))

      app.get('/api/premium', (c) => c.json({ message: 'success' }))

      // Make more requests than the limit
      for (let i = 0; i < 20; i++) {
        const res = await app.request('/api/premium', {}, mockEnv)
        expect(res.status).toBe(200)
        // Should not have rate limit headers when bypassed
        expect(res.headers.get('X-Rate-Limit-Limit')).toBeNull()
      }
    })
  })

  describe('Distributed Rate Limiting with KV', () => {
    it('should share rate limit state across multiple requests via KV', async () => {
      // Mock KV storage
      let kvStorage = new Map<string, string>()

      mockEnv.CACHE.get.mockImplementation(async (key: string) => {
        return kvStorage.get(key) || null
      })

      mockEnv.CACHE.put.mockImplementation(async (key: string, value: string, options?: any) => {
        kvStorage.set(key, value)
        return Promise.resolve()
      })

      app.use('/api/shared', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 5,
        window: 3600,
        distributed: true,
        keyGenerator: async (c) => 'shared-key'
      }))

      app.get('/api/shared', (c) => c.json({ message: 'success' }))

      // Make requests that should consume from shared bucket
      const responses = []
      for (let i = 0; i < 5; i++) {
        const res = await app.request('/api/shared', {}, mockEnv)
        responses.push(res)
      }

      // All first 5 requests should succeed
      responses.forEach((res, index) => {
        expect(res.status).toBe(200)
        const remaining = parseInt(res.headers.get('X-Rate-Limit-Remaining') || '0')
        expect(remaining).toBe(5 - (index + 1))
      })

      // 6th request should be rate limited
      const rateLimitedRes = await app.request('/api/shared', {}, mockEnv)
      expect(rateLimitedRes.status).toBe(429)
    })

    it('should handle KV failures gracefully with fallback', async () => {
      // Mock KV failure
      mockEnv.CACHE.get.mockRejectedValue(new Error('KV unavailable'))

      app.use('/api/fallback', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 5,
        window: 3600,
        distributed: true
      }))

      app.get('/api/fallback', (c) => c.json({ message: 'success' }))

      // Should still work despite KV failure (fail open)
      const res = await app.request('/api/fallback', {}, mockEnv)
      expect(res.status).toBe(200)
    })
  })

  describe('Multi-Strategy Rate Limiting', () => {
    it('should apply different strategies for different endpoints', async () => {
      // Token bucket for general API
      app.use('/api/token-bucket', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600
      }))

      app.get('/api/token-bucket', (c) => c.json({ strategy: 'token_bucket' }))

      // Sliding window for uploads
      app.use('/api/sliding-window', rateLimitMiddleware({
        strategy: RateLimitStrategy.SLIDING_WINDOW,
        requests: 10,
        window: 3600
      }))

      app.get('/api/sliding-window', (c) => c.json({ strategy: 'sliding_window' }))

      // Fixed window for jobs
      app.use('/api/fixed-window', rateLimitMiddleware({
        strategy: RateLimitStrategy.FIXED_WINDOW,
        requests: 10,
        window: 3600
      }))

      app.get('/api/fixed-window', (c) => c.json({ strategy: 'fixed_window' }))

      // Test each endpoint
      const tokenBucketRes = await app.request('/api/token-bucket', {}, mockEnv)
      expect(tokenBucketRes.status).toBe(200)
      expect(tokenBucketRes.headers.get('X-Rate-Limit-Strategy')).toBe('token_bucket')

      const slidingWindowRes = await app.request('/api/sliding-window', {}, mockEnv)
      expect(slidingWindowRes.status).toBe(200)
      expect(slidingWindowRes.headers.get('X-Rate-Limit-Strategy')).toBe('sliding_window')

      const fixedWindowRes = await app.request('/api/fixed-window', {}, mockEnv)
      expect(fixedWindowRes.status).toBe(200)
      expect(fixedWindowRes.headers.get('X-Rate-Limit-Strategy')).toBe('fixed_window')
    })
  })

  describe('Route-specific Configurations', () => {
    it('should apply different limits and weights for different routes', async () => {
      // Light endpoint with default weight
      app.use('/api/light', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600
      }))

      app.get('/api/light', (c) => c.json({ endpoint: 'light' }))

      // Heavy endpoint with higher weight
      app.use('/api/heavy', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600,
        route: { weight: 10 }
      }))

      app.get('/api/heavy', (c) => c.json({ endpoint: 'heavy' }))

      // Test light endpoint
      const lightRes = await app.request('/api/light', {}, mockEnv)
      expect(lightRes.status).toBe(200)
      expect(parseInt(lightRes.headers.get('X-Rate-Limit-Remaining') || '0')).toBe(99)

      // Test heavy endpoint
      const heavyRes = await app.request('/api/heavy', {}, mockEnv)
      expect(heavyRes.status).toBe(200)
      expect(parseInt(heavyRes.headers.get('X-Rate-Limit-Remaining') || '0')).toBe(90) // 100 - 10
    })
  })

  describe('Custom Key Generation', () => {
    it('should use custom key generator for advanced scenarios', async () => {
      app.use('/api/custom', async (c, next) => {
        c.set('auth', {
          user: {
            id: 'user-123',
            subscription_tier: 'pro',
            email: 'user@example.com'
          },
          isAuthenticated: true
        })
        await next()
      })

      app.use('/api/custom', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 50,
        window: 3600,
        keyGenerator: async (c) => {
          const auth = c.get('auth')
          const userId = auth.user?.id || 'anonymous'
          const userAgent = c.req.header('User-Agent') || 'unknown'
          const endpoint = c.req.path

          // Create a complex key based on multiple factors
          return `custom:${userId}:${endpoint}:${userAgent.substring(0, 50)}`
        }
      }))

      app.get('/api/custom', (c) => c.json({ message: 'success' }))

      const res = await app.request('/api/custom', {
        headers: {
          'User-Agent': 'Test-Agent/1.0'
        }
      }, mockEnv)

      expect(res.status).toBe(200)

      // Verify the custom key was used by checking KV calls
      expect(mockEnv.CACHE.get).toHaveBeenCalledWith(
        expect.stringMatching(/token_bucket:custom:user-123:\/api\/custom:Test-Agent\/1\.0/)
      )
    })
  })

  describe('Rate Limit Presets Integration', () => {
    it('should integrate API presets with real service', async () => {
      app.use('/api/v1/users', createApiRateLimit())
      app.get('/api/v1/users', (c) => c.json({ users: [] }))

      const res = await app.request('/api/v1/users', {}, mockEnv)
      expect(res.status).toBe(200)
      expect(res.headers.get('X-Rate-Limit-Limit')).toBe('1000') // API default
      expect(res.headers.get('X-Rate-Limit-Strategy')).toBe('token_bucket')
    })

    it('should integrate file upload presets with authentication', async () => {
      app.use('/api/v1/upload', async (c, next) => {
        c.set('auth', {
          user: {
            id: 'user-123',
            subscription_tier: 'pro',
            email: 'user@example.com'
          },
          isAuthenticated: true
        })
        await next()
      })

      app.use('/api/v1/upload', createFileUploadRateLimit())
      app.post('/api/v1/upload', (c) => c.json({ message: 'uploaded' }))

      const res = await app.request('/api/v1/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, mockEnv)

      expect(res.status).toBe(200)
      expect(res.headers.get('X-Rate-Limit-Limit')).toBe('250') // Pro tier file upload limit
      expect(res.headers.get('X-Rate-Limit-Strategy')).toBe('sliding_window')
    })

    it('should integrate job execution presets with heavy operations', async () => {
      app.use('/api/v1/jobs', async (c, next) => {
        c.set('auth', {
          user: {
            id: 'user-123',
            subscription_tier: 'enterprise',
            email: 'enterprise@example.com'
          },
          isAuthenticated: true
        })
        await next()
      })

      app.use('/api/v1/jobs', createJobExecutionRateLimit())
      app.post('/api/v1/jobs', (c) => c.json({ jobId: 'job-123' }))

      const res = await app.request('/api/v1/jobs', {
        method: 'POST'
      }, mockEnv)

      expect(res.status).toBe(200)
      expect(res.headers.get('X-Rate-Limit-Limit')).toBe('1000') // Enterprise tier job limit
      expect(res.headers.get('X-Rate-Limit-Strategy')).toBe('fixed_window')
    })
  })

  describe('Error Scenarios and Recovery', () => {
    it('should handle rate limit exceeded scenarios gracefully', async () => {
      // Mock full token bucket
      mockEnv.CACHE.get.mockResolvedValue(JSON.stringify({
        tokens: 0,
        lastRefill: Date.now(),
        refillRate: 10 / 3600,
        maxTokens: 10
      }))

      app.use('/api/rate-limited', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true
      }))

      app.get('/api/rate-limited', (c) => c.json({ message: 'success' }))

      const res = await app.request('/api/rate-limited', {}, mockEnv)
      expect(res.status).toBe(429)

      const body = await res.json()
      expect(body.error).toBe('Rate Limit Exceeded')
      expect(body.limit).toBe(10)
      expect(body.remaining).toBe(0)
      expect(body.strategy).toBe('token_bucket')
      expect(body.retryAfter).toBeGreaterThan(0)
      expect(body.requestId).toBe('test-request-id')
    })

    it('should recover from rate limiting after time passes', async () => {
      // Mock bucket that was empty 1 hour ago but should now have tokens
      const oneHourAgo = Date.now() - 3600000
      mockEnv.CACHE.get.mockResolvedValue(JSON.stringify({
        tokens: 0,
        lastRefill: oneHourAgo,
        refillRate: 10 / 3600, // 10 tokens per hour
        maxTokens: 10
      }))

      app.use('/api/recovery', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true
      }))

      app.get('/api/recovery', (c) => c.json({ message: 'success' }))

      const res = await app.request('/api/recovery', {}, mockEnv)
      expect(res.status).toBe(200) // Should be allowed due to token refill

      // Should save updated state to KV
      expect(mockEnv.CACHE.put).toHaveBeenCalled()
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle high request volume efficiently', async () => {
      app.use('/api/performance', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10000,
        window: 3600,
        distributed: false // Use in-memory for performance test
      }))

      app.get('/api/performance', (c) => c.json({ message: 'success' }))

      const startTime = Date.now()
      const promises = []

      // Make 100 concurrent requests
      for (let i = 0; i < 100; i++) {
        promises.push(app.request('/api/performance', {}, mockEnv))
      }

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // All requests should succeed
      results.forEach(res => {
        expect(res.status).toBe(200)
      })

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})
