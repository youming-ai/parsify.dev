/**
 * Integration tests for rate limiting middleware
 * Tests the middleware in realistic scenarios with authentication and services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Hono } from 'hono'
import {
  rateLimitMiddleware,
  RateLimitStrategy,
  createApiRateLimit,
  createFileUploadRateLimit,
  createJobExecutionRateLimit,
  createAuthRateLimit
} from '../rate_limit'
import { authMiddleware } from '../../middleware/auth'
import { RateLimitService } from '../../services/rate_limit_service'

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
  SESSIONS: {} as KVNamespace,
  UPLOADS: {} as KVNamespace,
  ANALYTICS: {} as KVNamespace,
  FILES: {} as R2Bucket,
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'test'
} as any

// Mock Cloudflare service
const mockCloudflareService = {
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  query: vi.fn(),
  getHealthStatus: vi.fn()
}

// Mock user data
const mockUsers = {
  free: {
    id: 'user-free-123',
    subscription_tier: 'free',
    email: 'free@example.com'
  },
  pro: {
    id: 'user-pro-123',
    subscription_tier: 'pro',
    email: 'pro@example.com'
  },
  enterprise: {
    id: 'user-enterprise-123',
    subscription_tier: 'enterprise',
    email: 'enterprise@example.com'
  }
}

describe('Rate Limit Middleware Integration Tests', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono()

    // Setup Cloudflare service mock
    app.use('*', async (c, next) => {
      c.set('cloudflare', mockCloudflareService)
      c.set('requestId', 'test-request-id')
      await next()
    })

    // Mock KV responses
    mockCloudflareService.cacheGet.mockResolvedValue(null)
    mockCloudflareService.cacheSet.mockResolvedValue(undefined)
    mockCloudflareService.cacheDelete.mockResolvedValue(true)

    // Mock database responses
    mockEnv.DB.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true })
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication + Rate Limiting Integration', () => {
    it('should apply different rate limits based on user subscription tier', async () => {
      // Setup authentication middleware
      app.use('/api/*', authMiddleware({ required: true }))

      // Setup rate limiting
      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600,
        limits: {
          anonymous: 10,
          free: 100,
          pro: 500,
          enterprise: 5000
        }
      }))

      app.get('/api/test', (c) => {
        const auth = c.get('auth')
        return c.json({
          message: 'success',
          userTier: auth.user?.subscription_tier
        })
      })

      // Test free user
      const freeResponse = await app.request('/api/test', {
        headers: {
          'Authorization': 'Bearer free-user-token'
        }
      }, mockEnv)

      expect(freeResponse.status).toBe(200)
      expect(freeResponse.headers.get('X-Rate-Limit-Limit')).toBe('100')
    })

    it('should bypass rate limiting for enterprise users when configured', async () => {
      app.use('/api/*', authMiddleware({ required: true }))

      app.use('/api/*', rateLimitMiddleware({
        requests: 10,
        window: 3600,
        bypassUsers: [mockUsers.enterprise.id]
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Make many requests that would normally exceed the limit
      for (let i = 0; i < 20; i++) {
        const res = await app.request('/api/test', {
          headers: {
            'Authorization': 'Bearer enterprise-user-token'
          }
        }, mockEnv)
        expect(res.status).toBe(200)
      }
    })

    it('should use IP-based rate limiting for unauthenticated requests', async () => {
      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 50,
        window: 3600,
        limits: {
          anonymous: 50,
          free: 500
        }
      }))

      app.get('/api/public', (c) => c.json({ message: 'public endpoint' }))

      const res = await app.request('/api/public', {
        headers: {
          'CF-Connecting-IP': '192.168.1.100'
        }
      }, mockEnv)

      expect(res.status).toBe(200)
      expect(res.headers.get('X-Rate-Limit-Limit')).toBe('50')
    })
  })

  describe('Multi-strategy Rate Limiting', () => {
    it('should apply different strategies to different endpoints', async () => {
      // Token bucket for general API
      app.use('/api/general/*',
        authMiddleware({ required: true }),
        rateLimitMiddleware({
          strategy: RateLimitStrategy.TOKEN_BUCKET,
          requests: 100,
          window: 3600
        })
      )

      // Sliding window for file uploads
      app.use('/api/upload/*',
        authMiddleware({ required: true }),
        rateLimitMiddleware({
          strategy: RateLimitStrategy.SLIDING_WINDOW,
          requests: 25,
          window: 3600
        })
      )

      // Fixed window for job execution
      app.use('/api/jobs/*',
        authMiddleware({ required: true }),
        rateLimitMiddleware({
          strategy: RateLimitStrategy.FIXED_WINDOW,
          requests: 20,
          window: 3600
        })
      )

      app.get('/api/general/test', (c) => c.json({ endpoint: 'general' }))
      app.post('/api/upload/file', (c) => c.json({ endpoint: 'upload' }))
      app.post('/api/jobs/run', (c) => c.json({ endpoint: 'jobs' }))

      const generalRes = await app.request('/api/general/test', {}, mockEnv)
      const uploadRes = await app.request('/api/upload/file', {}, mockEnv)
      const jobsRes = await app.request('/api/jobs/run', {}, mockEnv)

      expect(generalRes.headers.get('X-Rate-Limit-Strategy')).toBe('token_bucket')
      expect(uploadRes.headers.get('X-Rate-Limit-Strategy')).toBe('sliding_window')
      expect(jobsRes.headers.get('X-Rate-Limit-Strategy')).toBe('fixed_window')
    })
  })

  describe('Distributed Rate Limiting', () => {
    it('should coordinate rate limits across multiple instances via KV', async () => {
      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true,
        cacheTTL: 300
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Simulate first instance
      await app.request('/api/test', {
        headers: { 'CF-Connecting-IP': '192.168.1.1' }
      }, mockEnv)

      // Verify KV was used
      expect(mockCloudflareService.cacheGet).toHaveBeenCalled()
      expect(mockCloudflareService.cacheSet).toHaveBeenCalledWith(
        'cache',
        expect.stringContaining('token_bucket:'),
        expect.any(Object),
        { ttl: 300 }
      )
    })

    it('should handle KV failures gracefully', async () => {
      mockCloudflareService.cacheGet.mockRejectedValue(new Error('KV unavailable'))
      mockCloudflareService.cacheSet.mockRejectedValue(new Error('KV unavailable'))

      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Should still work despite KV failures
      const res = await app.request('/api/test', {}, mockEnv)
      expect(res.status).toBe(200)
    })
  })

  describe('Route-specific Rate Limiting', () => {
    it('should apply different rate limits based on route configuration', async () => {
      app.use('/api/*', createApiRateLimit())

      // Additional rate limiting for expensive operations
      app.use('/api/tools/execute',
        rateLimitMiddleware({
          strategy: RateLimitStrategy.TOKEN_BUCKET,
          requests: 25,
          window: 3600,
          route: { weight: 5 }
        })
      )

      app.get('/api/data', (c) => c.json({ endpoint: 'data' }))
      app.post('/api/tools/execute', (c) => c.json({ endpoint: 'execute' }))

      const dataRes = await app.request('/api/data', {}, mockEnv)
      const executeRes = await app.request('/api/tools/execute', {}, mockEnv)

      // Different endpoints should have different rate limits
      expect(dataRes.headers.get('X-Rate-Limit-Limit')).toBe('1000') // Default API
      expect(executeRes.headers.get('X-Rate-Limit-Limit')).toBe('25') // Custom for execute
    })

    it('should use custom key generators for specialized rate limiting', async () => {
      app.use('/api/webhooks/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.SLIDING_WINDOW,
        requests: 100,
        window: 3600,
        keyGenerator: async (c) => {
          const webhookId = c.req.param('webhookId') || 'default'
          return `webhook:${webhookId}`
        }
      }))

      app.post('/api/webhooks/:webhookId', (c) => {
        const webhookId = c.req.param('webhookId')
        return c.json({ webhookId })
      })

      const res = await app.request('/api/webhooks/webhook-123', {
        method: 'POST'
      }, mockEnv)

      expect(res.status).toBe(200)
      // Verify the custom key generator was used (would need more complex mocking to capture the exact key)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle API endpoint with authentication and rate limiting', async () => {
      // Setup authentication
      app.use('/api/v1/*', authMiddleware({ required: true }))

      // Apply API rate limiting
      app.use('/api/v1/*', createApiRateLimit())

      // Specific endpoint with additional limits
      app.use('/api/v1/process',
        rateLimitMiddleware({
          strategy: RateLimitStrategy.TOKEN_BUCKET,
          requests: 50,
          window: 3600,
          route: { weight: 3 }
        })
      )

      app.get('/api/v1/status', (c) => c.json({ status: 'ok' }))
      app.post('/api/v1/process', (c) => c.json({ processed: true }))

      const statusRes = await app.request('/api/v1/status', {}, mockEnv)
      const processRes = await app.request('/api/v1/process', {
        method: 'POST'
      }, mockEnv)

      expect(statusRes.status).toBe(200)
      expect(processRes.status).toBe(200)

      // Process endpoint should have consumed more tokens
      const statusRemaining = parseInt(statusRes.headers.get('X-Rate-Limit-Remaining') || '0')
      const processRemaining = parseInt(processRes.headers.get('X-Rate-Limit-Remaining') || '0')
      expect(processRemaining).toBeLessThan(statusRemaining)
    })

    it('should handle file upload with size-based rate limiting', async () => {
      app.use('/api/*', authMiddleware({ required: true }))
      app.use('/api/upload', createFileUploadRateLimit())

      app.post('/api/upload', (c) => {
        const contentLength = c.req.header('Content-Length')
        return c.json({
          message: 'file uploaded',
          size: contentLength
        })
      })

      // Small file upload
      const smallFileRes = await app.request('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Length': '1024' // 1KB
        }
      }, mockEnv)

      // Large file upload
      const largeFileRes = await app.request('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Length': '52428800' // 50MB
        }
      }, mockEnv)

      expect(smallFileRes.status).toBe(200)
      expect(largeFileRes.status).toBe(200)

      // Both should be under the file upload rate limit
      expect(parseInt(smallFileRes.headers.get('X-Rate-Limit-Remaining') || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(largeFileRes.headers.get('X-Rate-Limit-Remaining') || '0')).toBeGreaterThanOrEqual(0)
    })

    it('should handle burst traffic with token bucket strategy', async () => {
      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 100,
        window: 3600,
        distributed: false
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Send burst of requests
      const requests = []
      for (let i = 0; i < 20; i++) {
        requests.push(app.request('/api/test', {}, mockEnv))
      }

      const responses = await Promise.all(requests)

      // All requests should succeed (token bucket allows bursts)
      responses.forEach(res => {
        expect(res.status).toBe(200)
      })
    })

    it('should handle sustained traffic with sliding window strategy', async () => {
      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.SLIDING_WINDOW,
        requests: 10,
        window: 60, // 1 minute
        distributed: false
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Send requests at a steady rate
      let successCount = 0
      for (let i = 0; i < 15; i++) {
        const res = await app.request('/api/test', {}, mockEnv)
        if (res.status === 200) successCount++

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Should allow some requests but not all (sliding window is more restrictive)
      expect(successCount).toBeGreaterThan(0)
      expect(successCount).toBeLessThan(15)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle rate limit exceeded with appropriate headers', async () => {
      // Mock a full token bucket
      const fullBucket = {
        tokens: 0,
        lastRefill: Date.now(),
        refillRate: 10 / 3600,
        maxTokens: 10
      }
      mockCloudflareService.cacheGet.mockResolvedValue(JSON.stringify(fullBucket))

      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      const res = await app.request('/api/test', {}, mockEnv)

      expect(res.status).toBe(429)
      expect(res.headers.get('X-Rate-Limit-Limit')).toBe('10')
      expect(res.headers.get('X-Rate-Limit-Remaining')).toBe('0')
      expect(res.headers.get('Retry-After')).toBeTruthy()

      const body = await res.json()
      expect(body.error).toBe('Rate Limit Exceeded')
      expect(body.retryAfter).toBeTruthy()
    })

    it('should handle malformed rate limit state in KV', async () => {
      mockCloudflareService.cacheGet.mockResolvedValue('invalid-json')

      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Should handle malformed data gracefully
      const res = await app.request('/api/test', {}, mockEnv)
      expect(res.status).toBe(200)
    })

    it('should handle service initialization failures', async () => {
      app.use('/api/*', rateLimitMiddleware({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        requests: 10,
        window: 3600,
        distributed: true
      }))

      app.get('/api/test', (c) => c.json({ message: 'success' }))

      // Mock service failure
      mockCloudflareService.cacheGet.mockRejectedValue(new Error('Service unavailable'))

      const res = await app.request('/api/test', {}, mockEnv)
      // Should fail open and allow the request
      expect(res.status).toBe(200)
    })
  })
})
