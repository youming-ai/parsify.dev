import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDevelopmentSecurity,
  createProductionSecurity,
  securityMiddleware,
} from '../security'

// Mock environment interface
interface TestEnv {
  ENVIRONMENT: string
  ENABLE_CORS: string
  LOG_LEVEL: string
}

describe('Security Middleware', () => {
  let app: Hono<{ Bindings: TestEnv }>

  beforeEach(() => {
    app = new Hono<{ Bindings: TestEnv }>()
    app.use(
      '*',
      securityMiddleware({
        cors: {
          origin: ['https://example.com'],
          credentials: true,
        },
        csp: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
        },
        security: {
          hsts: {
            enabled: true,
            maxAge: 31536000,
            includeSubDomains: false,
            preload: false,
          },
          frameOptions: 'DENY',
          contentTypeOptions: true,
          xssProtection: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
        },
        enableLogging: true,
        logLevel: 'debug',
      })
    )

    app.get('/test', c => c.json({ message: 'success' }))
    app.post('/test', c => c.json({ message: 'success' }))
    app.options('/test', c => c.text('', 204))
  })

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const res = await app.request('/test', {
        method: 'GET',
        headers: {
          Origin: 'https://example.com',
        },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
      expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should reject requests from non-allowed origins', async () => {
      const res = await app.request('/test', {
        method: 'GET',
        headers: {
          Origin: 'https://malicious.com',
        },
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('CORS Error')
      expect(body.message).toBe('Origin not allowed')
    })

    it('should handle preflight OPTIONS requests', async () => {
      const res = await app.request('/test', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      })

      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
    })

    it('should allow non-CORS requests (no Origin header)', async () => {
      const res = await app.request('/test', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
    })
  })

  describe('Security Headers', () => {
    it('should set security headers correctly', async () => {
      const res = await app.request('/test', {
        method: 'GET',
        headers: {
          'CF-Visitor': '{"scheme":"https"}',
        },
      })

      expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000')
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should not set HSTS header on non-HTTPS requests', async () => {
      const res = await app.request('/test', {
        method: 'GET',
        headers: {
          'CF-Visitor': '{"scheme":"http"}',
        },
      })

      expect(res.headers.get('Strict-Transport-Security')).toBeNull()
    })

    it('should set custom headers when configured', async () => {
      const customApp = new Hono<{ Bindings: TestEnv }>()
      customApp.use(
        '*',
        securityMiddleware({
          security: {
            customHeaders: {
              'X-Custom-Header': 'custom-value',
              'X-Another-Header': 'another-value',
            },
          },
        })
      )
      customApp.get('/test', c => c.json({ message: 'success' }))

      const res = await customApp.request('/test')
      expect(res.headers.get('X-Custom-Header')).toBe('custom-value')
      expect(res.headers.get('X-Another-Header')).toBe('another-value')
    })
  })

  describe('Content Security Policy', () => {
    it('should set CSP headers correctly', async () => {
      const res = await app.request('/test')

      expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
      expect(res.headers.get('Content-Security-Policy')).toContain("script-src 'self'")
      expect(res.headers.get('Content-Security-Policy')).toContain("style-src 'self'")
    })

    it('should set CSP-Report-Only header when configured', async () => {
      const reportOnlyApp = new Hono<{ Bindings: TestEnv }>()
      reportOnlyApp.use(
        '*',
        securityMiddleware({
          csp: {
            defaultSrc: ["'self'"],
            reportOnly: true,
          },
        })
      )
      reportOnlyApp.get('/test', c => c.json({ message: 'success' }))

      const res = await reportOnlyApp.request('/test')
      expect(res.headers.get('Content-Security-Policy-Report-Only')).toContain("default-src 'self'")
      expect(res.headers.get('Content-Security-Policy')).toBeNull()
    })

    it('should include upgrade-insecure-requests when configured', async () => {
      const upgradeApp = new Hono<{ Bindings: TestEnv }>()
      upgradeApp.use(
        '*',
        securityMiddleware({
          csp: {
            defaultSrc: ["'self'"],
            upgradeInsecureRequests: true,
          },
        })
      )
      upgradeApp.get('/test', c => c.json({ message: 'success' }))

      const res = await upgradeApp.request('/test')
      expect(res.headers.get('Content-Security-Policy')).toContain('upgrade-insecure-requests')
    })
  })

  describe('Rate Limit Headers', () => {
    it('should expose rate limit headers when rate limit info is available', async () => {
      const rateLimitApp = new Hono<{ Bindings: TestEnv }>()
      rateLimitApp.use(
        '*',
        securityMiddleware({
          rateLimitHeaders: {
            enabled: true,
            hideLimit: false,
            hideRemaining: false,
            hideReset: false,
          },
        })
      )

      rateLimitApp.use('*', async (c, next) => {
        // Mock rate limit information
        c.set('rateLimit', {
          limit: 1000,
          remaining: 500,
          resetTime: Date.now() + 3600000,
          retryAfter: null,
        })
        await next()
      })

      rateLimitApp.get('/test', c => c.json({ message: 'success' }))

      const res = await rateLimitApp.request('/test')
      expect(res.headers.get('X-Rate-Limit-Limit')).toBe('1000')
      expect(res.headers.get('X-Rate-Limit-Remaining')).toBe('500')
      expect(res.headers.get('X-Rate-Limit-Reset')).toBeTruthy()
    })

    it('should hide rate limit headers when configured', async () => {
      const hiddenRateLimitApp = new Hono<{ Bindings: TestEnv }>()
      hiddenRateLimitApp.use(
        '*',
        securityMiddleware({
          rateLimitHeaders: {
            enabled: true,
            hideLimit: true,
            hideRemaining: true,
            hideReset: true,
          },
        })
      )

      hiddenRateLimitApp.use('*', async (c, next) => {
        c.set('rateLimit', {
          limit: 1000,
          remaining: 500,
          resetTime: Date.now() + 3600000,
          retryAfter: null,
        })
        await next()
      })

      hiddenRateLimitApp.get('/test', c => c.json({ message: 'success' }))

      const res = await hiddenRateLimitApp.request('/test')
      expect(res.headers.get('X-Rate-Limit-Limit')).toBeNull()
      expect(res.headers.get('X-Rate-Limit-Remaining')).toBeNull()
      expect(res.headers.get('X-Rate-Limit-Reset')).toBeNull()
    })
  })

  describe('Custom Validation', () => {
    it('should block requests when custom validation fails', async () => {
      const validationApp = new Hono<{ Bindings: TestEnv }>()
      validationApp.use(
        '*',
        securityMiddleware({
          customValidation: async c => {
            // Reject all requests with specific header
            return !c.req.header('X-Block-Me')
          },
        })
      )
      validationApp.get('/test', c => c.json({ message: 'success' }))

      const res = await validationApp.request('/test', {
        headers: {
          'X-Block-Me': 'true',
        },
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('Security Violation')
      expect(body.message).toBe('Request blocked by security policy')
    })

    it('should allow requests when custom validation passes', async () => {
      const validationApp = new Hono<{ Bindings: TestEnv }>()
      validationApp.use(
        '*',
        securityMiddleware({
          customValidation: async _c => {
            // Allow all requests
            return true
          },
        })
      )
      validationApp.get('/test', c => c.json({ message: 'success' }))

      const res = await validationApp.request('/test')
      expect(res.status).toBe(200)
    })
  })

  describe('Path-Specific Configuration', () => {
    it('should apply different security configurations based on path', async () => {
      const pathApp = new Hono<{ Bindings: TestEnv }>()
      pathApp.use(
        '*',
        securityMiddleware({
          paths: {
            '/api/v1/public': {
              cors: { origin: '*' },
            },
            '/api/v1/admin': {
              cors: { origin: ['https://admin.example.com'] },
            },
          },
        })
      )
      pathApp.get('/api/v1/public/test', c => c.json({ message: 'public' }))
      pathApp.get('/api/v1/admin/test', c => c.json({ message: 'admin' }))

      // Public endpoint should allow any origin
      const publicRes = await pathApp.request('/api/v1/public/test', {
        headers: { Origin: 'https://any-origin.com' },
      })
      expect(publicRes.status).toBe(200)
      expect(publicRes.headers.get('Access-Control-Allow-Origin')).toBe('*')

      // Admin endpoint should restrict origins
      const adminRes = await pathApp.request('/api/v1/admin/test', {
        headers: { Origin: 'https://unauthorized.com' },
      })
      expect(adminRes.status).toBe(403)
    })
  })

  describe('Security Presets', () => {
    it('should apply development preset correctly', async () => {
      const devApp = new Hono<{ Bindings: TestEnv }>()
      devApp.use('*', createDevelopmentSecurity())
      devApp.get('/test', c => c.json({ message: 'success' }))

      const res = await devApp.request('/test', {
        headers: {
          Origin: 'http://localhost:3000',
        },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(res.headers.get('Content-Security-Policy-Report-Only')).toBeTruthy()
    })

    it('should apply production preset correctly', async () => {
      const prodApp = new Hono<{ Bindings: TestEnv }>()
      prodApp.use('*', createProductionSecurity())
      prodApp.get('/test', c => c.json({ message: 'success' }))

      const res = await prodApp.request('/test', {
        headers: {
          Origin: 'https://parsify.dev',
          'CF-Visitor': '{"scheme":"https"}',
        },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://parsify.dev')
      expect(res.headers.get('Content-Security-Policy')).toBeTruthy()
      expect(res.headers.get('Content-Security-Policy')).toContain('upgrade-insecure-requests')
      expect(res.headers.get('Strict-Transport-Security')).toBeTruthy()
    })
  })

  describe('Skip Paths Configuration', () => {
    it('should skip security middleware for configured paths', async () => {
      const skipApp = new Hono<{ Bindings: TestEnv }>()
      skipApp.use(
        '*',
        securityMiddleware({
          cors: { origin: ['https://example.com'] },
          skipPaths: ['/skip'],
        })
      )
      skipApp.get('/test', c => c.json({ message: 'protected' }))
      skipApp.get('/skip', c => c.json({ message: 'skipped' }))

      // Protected path should enforce CORS
      const protectedRes = await skipApp.request('/test', {
        headers: { Origin: 'https://malicious.com' },
      })
      expect(protectedRes.status).toBe(403)

      // Skipped path should allow any origin
      const skippedRes = await skipApp.request('/skip', {
        headers: { Origin: 'https://malicious.com' },
      })
      expect(skippedRes.status).toBe(200)
    })
  })

  describe('Wildcard Origin Patterns', () => {
    it('should support wildcard patterns in CORS origins', async () => {
      const wildcardApp = new Hono<{ Bindings: TestEnv }>()
      wildcardApp.use(
        '*',
        securityMiddleware({
          cors: {
            origin: ['https://*.example.com', 'https://example.*'],
          },
        })
      )
      wildcardApp.get('/test', c => c.json({ message: 'success' }))

      // Should allow subdomain pattern
      const res1 = await wildcardApp.request('/test', {
        headers: { Origin: 'https://api.example.com' },
      })
      expect(res1.status).toBe(200)

      // Should allow TLD pattern
      const res2 = await wildcardApp.request('/test', {
        headers: { Origin: 'https://example.org' },
      })
      expect(res2.status).toBe(200)

      // Should reject non-matching patterns
      const res3 = await wildcardApp.request('/test', {
        headers: { Origin: 'https://malicious.com' },
      })
      expect(res3.status).toBe(403)
    })
  })
})

describe('Security Middleware Helper Functions', () => {
  describe('createOriginValidator', () => {
    it('should create a validator function', async () => {
      const { createOriginValidator } = await import('../security')
      const validator = createOriginValidator(['https://example.com', 'https://*.test.com'])

      expect(validator('https://example.com')).toBe(true)
      expect(validator('https://api.test.com')).toBe(true)
      expect(validator('https://malicious.com')).toBe(false)
    })
  })

  describe('createCSPDirective', () => {
    it('should create CSP directive string', async () => {
      const { createCSPDirective } = await import('../security')
      const directive = createCSPDirective(["'self'", 'https://example.com'])
      expect(directive).toBe("'self' https://example.com")
    })
  })

  describe('createPermissionsPolicy', () => {
    it('should create permissions policy string', async () => {
      const { createPermissionsPolicy } = await import('../security')
      const policy = createPermissionsPolicy({
        geolocation: ['self'],
        camera: [],
      })
      expect(policy).toBe('geolocation=(self), camera=()')
    })
  })

  describe('isSecureConnection', () => {
    it('should detect secure connections', async () => {
      const { isSecureConnection } = await import('../security')

      // Mock Hono context
      const mockSecureContext = {
        req: {
          header: (name: string) => (name === 'CF-Visitor' ? '{"scheme":"https"}' : null),
        },
      } as any

      const mockInsecureContext = {
        req: {
          header: (name: string) => (name === 'CF-Visitor' ? '{"scheme":"http"}' : null),
        },
      } as any

      expect(isSecureConnection(mockSecureContext)).toBe(true)
      expect(isSecureConnection(mockInsecureContext)).toBe(false)
    })
  })

  describe('getClientOrigin', () => {
    it('should extract client origin from request', async () => {
      const { getClientOrigin } = await import('../security')

      const mockContextWithOrigin = {
        req: {
          header: (name: string) => (name === 'Origin' ? 'https://example.com' : null),
        },
      } as any

      const mockContextWithReferer = {
        req: {
          header: (name: string) => (name === 'Referer' ? 'https://example.com/page' : null),
        },
      } as any

      const mockContextNoOrigin = {
        req: {
          header: () => null,
        },
      } as any

      expect(getClientOrigin(mockContextWithOrigin)).toBe('https://example.com')
      expect(getClientOrigin(mockContextWithReferer)).toBe('https://example.com/page')
      expect(getClientOrigin(mockContextNoOrigin)).toBeNull()
    })
  })

  describe('isAPIRequest', () => {
    it('should identify API requests', async () => {
      const { isAPIRequest } = await import('../security')

      const apiPathContext = {
        req: {
          path: '/api/v1/users',
          header: () => null,
        },
      } as any

      const apiHeaderContext = {
        req: {
          path: '/users',
          header: (name: string) => (name === 'Accept' ? 'application/json' : null),
        },
      } as any

      const nonApiContext = {
        req: {
          path: '/index.html',
          header: () => null,
        },
      } as any

      expect(isAPIRequest(apiPathContext)).toBe(true)
      expect(isAPIRequest(apiHeaderContext)).toBe(true)
      expect(isAPIRequest(nonApiContext)).toBe(false)
    })
  })
})
