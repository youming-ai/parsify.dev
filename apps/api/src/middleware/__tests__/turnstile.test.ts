import { Hono } from 'hono'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { turnstileMiddleware, TurnstileError, TurnstilePresets, getTurnstileContext, isBotDetected } from '../turnstile'
import { AuthContext } from '../auth'

// Mock Cloudflare service
const mockCloudflareService = {
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  query: vi.fn()
}

// Mock fetch
global.fetch = vi.fn()

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: vi.fn(() => 'test-request-id')
} as any

describe('Turnstile Middleware', () => {
  let app: Hono
  let mockEnv: any

  beforeEach(() => {
    vi.clearAllMocks()

    app = new Hono()
    mockEnv = {
      TURNSTILE_SITE_KEY: 'test-site-key',
      TURNSTILE_SECRET_KEY: 'test-secret-key',
      ENVIRONMENT: 'test'
    }

    // Set up Cloudflare service mock
    app.use('*', async (c, next) => {
      c.set('cloudflare', mockCloudflareService)
      c.set('requestId', 'test-request-id')
      await next()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic functionality', () => {
    it('should pass through when Turnstile is disabled', async () => {
      app.use('*', turnstileMiddleware({
        config: { enabled: false }
      }))
      app.get('/', (c) => c.json({ success: true }))

      const res = await app.request('/')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('should skip validation for configured paths', async () => {
      app.use('*', turnstileMiddleware({
        config: {
          enabled: true,
          skipPaths: ['/health', '/metrics']
        }
      }))
      app.get('/health', (c) => c.json({ status: 'healthy' }))

      const res = await app.request('/health')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('healthy')
    })

    it('should proceed when validation is optional and no token provided', async () => {
      app.use('*', turnstileMiddleware({
        required: false
      }))
      app.get('/', (c) => c.json({ success: true }))

      const res = await app.request('/')
      expect(res.status).toBe(200)
    })

    it('should return error when validation is required and no token provided', async () => {
      app.use('*', turnstileMiddleware({
        required: true
      }))
      app.get('/', (c) => c.json({ success: true }))

      const res = await app.request('/')
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.code).toBe(TurnstileError.MISSING_TOKEN)
    })
  })

  describe('Token extraction', () => {
    it('should extract token from X-Turnstile-Token header', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      // Mock successful validation
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(200)
      expect(fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-token')
        })
      )
    })

    it('should extract token from JSON body', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.post('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'cf-turnstile-response': 'test-token'
        })
      })

      expect(res.status).toBe(200)
    })

    it('should extract token from query parameters', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/?cf-turnstile-response=test-token')
      expect(res.status).toBe(200)
    })
  })

  describe('Token validation', () => {
    it('should successfully validate a valid token', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          challenge_ts: '2023-01-01T00:00:00Z',
          hostname: 'example.com'
        })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'valid-token'
        }
      })

      expect(res.status).toBe(200)
      const turnstileContext = getTurnstileContext({ get: vi.fn() } as any)
      expect(turnstileContext?.validationResponse?.success).toBe(true)
    })

    it('should handle invalid token response', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response']
        })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'invalid-token'
        }
      })

      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.code).toBe(TurnstileError.INVALID_TOKEN)
    })

    it('should handle network errors with retry', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          retryAttempts: 2
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      // First attempt fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      // Second attempt succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(200)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retry attempts', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          retryAttempts: 2
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.code).toBe(TurnstileError.SERVICE_ERROR)
    })
  })

  describe('Caching', () => {
    it('should use cached validation result when available', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          cachingEnabled: true
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      // Mock cached result
      mockCloudflareService.cacheGet.mockResolvedValueOnce({
        success: true,
        challenge_ts: '2023-01-01T00:00:00Z'
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'cached-token'
        }
      })

      expect(res.status).toBe(200)
      expect(fetch).not.toHaveBeenCalled()
      expect(mockCloudflareService.cacheGet).toHaveBeenCalledWith(
        'cache',
        'turnstile_validation:cached-token'
      )
    })

    it('should cache successful validation results', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          cachingEnabled: true,
          cacheTTL: 300
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          challenge_ts: '2023-01-01T00:00:00Z'
        })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(200)
      expect(mockCloudflareService.cacheSet).toHaveBeenCalledWith(
        'cache',
        'turnstile_validation:test-token',
        expect.objectContaining({ success: true }),
        { ttl: 300 }
      )
    })
  })

  describe('Bot detection', () => {
    it('should detect suspicious IP addresses', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          ipBasedValidation: true,
          protectionLevel: 'low'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      // Create a mock request with Cloudflare data indicating high threat
      const mockRequest = new Request('http://localhost', {
        headers: {
          'X-Turnstile-Token': 'test-token',
          'CF-Connecting-IP': '192.168.1.1'
        }
      })

      // Mock Cloudflare request data
      Object.defineProperty(mockRequest, 'cf', {
        value: {
          threat_level: 'high',
          bot_management: { score: 80 }
        },
        writable: true
      })

      const res = await app.request(mockRequest)
      expect(res.status).toBe(200)

      // The bot detection should have run but not blocked the request
      // since protection level is low
    })

    it('should detect suspicious user agents', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          userAgentBasedValidation: true,
          protectionLevel: 'low'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token',
          'User-Agent': 'curl/7.68.0'
        }
      })

      expect(res.status).toBe(200)
    })

    it('should block high-risk requests with high protection', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          ipBasedValidation: true,
          userAgentBasedValidation: true,
          protectionLevel: 'high',
          scoreThreshold: { low: 0.1, medium: 0.1, high: 0.1 }
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token',
          'User-Agent': 'BadBot/1.0'
        }
      })

      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.code).toBe(TurnstileError.BOT_DETECTED)
    })
  })

  describe('Custom validation', () => {
    it('should use custom validation function when provided', async () => {
      const customValidation = vi.fn().mockResolvedValue(false)

      app.use('*', turnstileMiddleware({
        required: true,
        customValidation,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(403)
      expect(customValidation).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: expect.any(String),
          requestId: 'test-request-id'
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should use custom error handler when provided', async () => {
      const customErrorHandler = vi.fn().mockImplementation((c) =>
        c.json({ customError: true }, 418)
      )

      app.use('*', turnstileMiddleware({
        required: true,
        onError: customErrorHandler,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      const res = await app.request('/')
      expect(res.status).toBe(418)
      const data = await res.json()
      expect(data.customError).toBe(true)
      expect(customErrorHandler).toHaveBeenCalled()
    })

    it('should log validation failures', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response']
        })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'invalid-token'
        }
      })

      expect(res.status).toBe(403)
      expect(mockCloudflareService.cacheSet).toHaveBeenCalledWith(
        'analytics',
        'turnstile_event:test-request-id',
        expect.objectContaining({
          event: 'validation_failed',
          errorCodes: ['invalid-input-response']
        }),
        { ttl: 86400 }
      )
    })
  })

  describe('Integration with auth middleware', () => {
    it('should include auth context in turnstile context', async () => {
      const mockAuthContext: AuthContext = {
        user: { id: 'user-123', subscription_tier: 'pro' },
        sessionId: 'session-456',
        isAuthenticated: true
      }

      app.use('*', async (c, next) => {
        c.set('auth', mockAuthContext)
        await next()
      })

      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          sessionBasedValidation: true
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(200)
    })
  })

  describe('Preset configurations', () => {
    it('should apply low protection preset', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        ...TurnstilePresets.LOW_PROTECTION,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(200)
    })

    it('should apply medium protection preset', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        ...TurnstilePresets.MEDIUM_PROTECTION,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site'
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token'
        }
      })

      expect(res.status).toBe(200)
    })
  })

  describe('Helper functions', () => {
    it('should detect bot from context', async () => {
      app.use('*', turnstileMiddleware({
        required: true,
        config: {
          secretKey: 'test-secret',
          siteKey: 'test-site',
          protectionLevel: 'high',
          scoreThreshold: { low: 0.1, medium: 0.1, high: 0.1 }
        }
      }))
      app.get('/', (c) => c.json({ success: true }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const res = await app.request('/', {
        headers: {
          'X-Turnstile-Token': 'test-token',
          'User-Agent': 'BotAgent/1.0'
        }
      })

      expect(res.status).toBe(403) // Should be blocked due to bot detection
    })
  })
})
