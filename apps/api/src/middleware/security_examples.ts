import { Hono } from 'hono'
import {
  securityMiddleware,
  createDevelopmentSecurity,
  createProductionSecurity,
  createPublicApiSecurity,
  createAdminSecurity,
  SecurityPresets,
  createOriginValidator,
  createCSPDirective,
  createPermissionsPolicy,
  isAPIRequest,
  getClientOrigin,
  isSecureConnection
} from './security'
import { authMiddleware, requireSubscriptionTier } from './auth'
import { rateLimitMiddleware, RateLimitPresets } from './rate_limit'

/**
 * This file demonstrates various usage patterns for the security middleware
 * showing how to configure it for different scenarios and requirements.
 */

// Example 1: Basic security middleware with custom configuration
export function createBasicSecureApp() {
  const app = new Hono()

  app.use('*', securityMiddleware({
    cors: {
      origin: ['https://example.com', 'https://app.example.com'],
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400
    },
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:']
    },
    security: {
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: false
      },
      frameOptions: 'SAMEORIGIN',
      contentTypeOptions: true,
      xssProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin'
    },
    enableLogging: true,
    logLevel: 'info'
  }))

  app.get('/', (c) => c.json({ message: 'Secure API' }))

  return app
}

// Example 2: Environment-specific security configuration
export function createEnvironmentAwareApp() {
  const app = new Hono()

  app.use('*', securityMiddleware({
    // Base configuration
    cors: {
      origin: ['https://parsify.dev'],
      credentials: true
    },

    // Environment-specific overrides
    environments: {
      development: {
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:5173'],
          allowHeaders: ['*']
        },
        csp: {
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          reportOnly: true
        },
        security: {
          hsts: { enabled: false }
        },
        enableLogging: true,
        logLevel: 'debug'
      },

      staging: {
        cors: {
          origin: ['https://staging.parsify.dev']
        },
        csp: {
          reportOnly: true
        },
        security: {
          hsts: { enabled: true, maxAge: 300 } // Short duration for staging
        },
        enableLogging: true,
        logLevel: 'warn'
      },

      production: {
        cors: {
          origin: ['https://parsify.dev', 'https://app.parsify.dev']
        },
        csp: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          upgradeInsecureRequests: true,
          blockAllMixedContent: true
        },
        security: {
          hsts: {
            enabled: true,
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          },
          frameOptions: 'DENY'
        },
        enableLogging: true,
        logLevel: 'error'
      }
    }
  }))

  app.get('/', (c) => c.json({ message: 'Environment-aware API' }))

  return app
}

// Example 3: Path-specific security configurations
export function createPathSpecificSecurityApp() {
  const app = new Hono()

  app.use('*', securityMiddleware({
    // Default security configuration
    cors: {
      origin: ['https://parsify.dev'],
      credentials: true
    },

    // Path-specific configurations
    paths: {
      // Public API endpoints with relaxed CORS
      '/api/v1/public': {
        cors: {
          origin: '*',
          credentials: false,
          allowMethods: ['GET', 'OPTIONS']
        },
        csp: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", 'https:']
        },
        security: {
          frameOptions: 'DENY',
          referrerPolicy: 'no-referrer'
        }
      },

      // Admin endpoints with strict security
      '/api/v1/admin': {
        cors: {
          origin: ['https://admin.parsify.dev'],
          credentials: true
        },
        csp: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: true
        },
        security: {
          hsts: {
            enabled: true,
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          },
          frameOptions: 'DENY',
          permissionsPolicy: {
            'geolocation': [],
            'microphone': [],
            'camera': [],
            'payment': [],
            'usb': []
          }
        },
        // Custom validation for admin endpoints
        customValidation: async (c) => {
          const auth = c.get('auth')
          return auth?.isAuthenticated && auth.user?.subscription_tier === 'enterprise'
        }
      },

      // Health check endpoints with minimal security
      '/health': {
        cors: {
          origin: '*',
          credentials: false
        },
        security: {
          frameOptions: 'SAMEORIGIN',
          contentTypeOptions: false
        },
        // Skip authentication and rate limiting for health checks
        skipPaths: ['/health', '/health/']
      }
    }
  }))

  // Add authentication middleware (but skip for health checks)
  app.use('/api/v1/admin/*', requireSubscriptionTier('enterprise'))

  app.get('/', (c) => c.json({ message: 'Path-specific security API' }))
  app.get('/api/v1/public/data', (c) => c.json({ public: true }))
  app.get('/api/v1/admin/users', (c) => c.json({ admin: true }))
  app.get('/health', (c) => c.json({ status: 'healthy' }))

  return app
}

// Example 4: Integration with authentication and rate limiting
export function createIntegratedSecurityApp() {
  const app = new Hono()

  // Base security middleware
  app.use('*', securityMiddleware(SecurityPresets.PRODUCTION))

  // Rate limiting middleware
  app.use('*', rateLimitMiddleware(RateLimitPresets.API_DEFAULT))

  // Authentication middleware (optional)
  app.use('/api/v1/protected/*', authMiddleware({ required: true }))
  app.use('/api/v1/public/*', authMiddleware({ required: false }))

  // Public endpoints
  app.get('/api/v1/public/info', (c) => {
    return c.json({
      message: 'Public information',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })
  })

  // Protected endpoints
  app.get('/api/v1/protected/profile', (c) => {
    const auth = c.get('auth')
    return c.json({
      user: auth.user,
      message: 'Protected profile data',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })
  })

  // Premium endpoints with additional security
  app.use('/api/v1/premium/*', [
    authMiddleware({ required: true, roles: ['pro', 'enterprise'] }),
    securityMiddleware({
      cors: {
        origin: ['https://app.parsify.dev'],
        credentials: true
      },
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'wss://api.parsify.dev']
      },
      security: {
        hsts: { enabled: true, maxAge: 31536000, includeSubDomains: true },
        permissionsPolicy: {
          'geolocation': ['self'],
          'notifications': ['self']
        }
      },
      customValidation: async (c) => {
        const auth = c.get('auth')
        // Additional validation logic here
        return auth?.isAuthenticated && auth.user?.subscription_tier !== 'free'
      }
    })
  ])

  app.get('/api/v1/premium/analytics', (c) => {
    return c.json({ analytics: 'Premium data' })
  })

  return app
}

// Example 5: Custom origin validation with dynamic configuration
export function createDynamicOriginApp() {
  const app = new Hono()

  app.use('*', securityMiddleware({
    cors: {
      // Function-based origin validation
      origin: async (origin, c) => {
        // Database or configuration lookup for allowed origins
        const allowedOrigins = await getAllowedOriginsFromDatabase()

        // Support for wildcard patterns
        const isAllowed = allowedOrigins.some(allowed => {
          if (allowed === '*') return true
          if (allowed === origin) return true

          // Wildcard pattern matching
          const pattern = allowed.replace(/\*/g, '.*')
          const regex = new RegExp(`^${pattern}$`)
          return regex.test(origin)
        })

        // Log origin validation attempts
        console.log(`Origin validation: ${origin} -> ${isAllowed}`)

        return isAllowed
      },
      credentials: true
    },

    customValidation: async (c) => {
      // Additional custom security checks
      const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')
      const userAgent = c.req.header('User-Agent')

      // Block suspicious user agents
      if (userAgent && isSuspiciousUserAgent(userAgent)) {
        console.warn(`Suspicious user agent blocked: ${userAgent} from ${clientIP}`)
        return false
      }

      // Rate limiting based on IP
      const isRateLimited = await checkIPRateLimit(clientIP)
      return !isRateLimited
    },

    enableLogging: true,
    logLevel: 'warn'
  }))

  app.get('/', (c) => c.json({ message: 'Dynamic origin validation API' }))

  return app
}

// Example 6: API Gateway with microservice routing
export function createAPIGatewayApp() {
  const app = new Hono()

  // Gateway-level security
  app.use('*', securityMiddleware({
    cors: {
      origin: ['https://app.parsify.dev'],
      credentials: true
    },
    security: {
      hsts: { enabled: true, maxAge: 31536000, includeSubDomains: true },
      frameOptions: 'DENY',
      customHeaders: {
        'X-API-Gateway': 'parsify-gateway',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  }))

  // Service-specific security configurations
  app.use('/services/auth/*', securityMiddleware({
    cors: {
      origin: ['https://app.parsify.dev', 'https://admin.parsify.dev'],
      credentials: true
    },
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'wss://auth.parsify.dev']
    },
    security: {
      permissionsPolicy: {
        'credentials': ['self']
      }
    }
  }))

  app.use('/services/storage/*', securityMiddleware({
    cors: {
      origin: ['https://app.parsify.dev'],
      credentials: true
    },
    csp: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://storage.parsify.dev']
    },
    security: {
      permissionsPolicy: {
        'storage-access': ['self']
      }
    }
  }))

  // Service routes
  app.get('/services/auth/status', (c) => c.json({ service: 'auth', status: 'healthy' }))
  app.get('/services/storage/status', (c) => c.json({ service: 'storage', status: 'healthy' }))

  return app
}

// Example 7: Content Security Policy with nonce support
export function createCSPNonceApp() {
  const app = new Hono()

  app.use('*', async (c, next) => {
    // Generate nonce for each request
    const nonce = crypto.randomUUID()
    c.set('cspNonce', nonce)

    await next()
  })

  app.use('*', securityMiddleware({
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (c) => `'nonce-${c.get('cspNonce')}'`],
      styleSrc: ["'self'", "'unsafe-inline'", (c) => `'nonce-${c.get('cspNonce')}'`],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      reportUri: '/api/v1/security/csp-report'
    },
    security: {
      hsts: { enabled: true, maxAge: 31536000 },
      frameOptions: 'SAMEORIGIN'
    }
  }))

  app.get('/', (c) => {
    const nonce = c.get('cspNonce')
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Secure App</title>
          <script nonce="${nonce}">
            console.log('Secure script execution');
          </script>
        </head>
        <body>
          <h1>Secure Content</h1>
        </body>
      </html>
    `)
  })

  // CSP violation report endpoint
  app.post('/api/v1/security/csp-report', async (c) => {
    const report = await c.req.json()
    console.warn('CSP Violation:', report)
    return c.json({ received: true })
  })

  return app
}

// Helper functions for examples
async function getAllowedOriginsFromDatabase(): Promise<string[]> {
  // In a real implementation, this would query your database
  // or configuration service for allowed origins
  return [
    'https://parsify.dev',
    'https://app.parsify.dev',
    'https://admin.parsify.dev',
    'https://*.parsify.dev'
  ]
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ]

  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

async function checkIPRateLimit(ip: string): Promise<boolean> {
  // In a real implementation, this would check IP-specific rate limits
  // from your rate limiting service or database
  return false
}

// Export all example functions
export {
  createBasicSecureApp,
  createEnvironmentAwareApp,
  createPathSpecificSecurityApp,
  createIntegratedSecurityApp,
  createDynamicOriginApp,
  createAPIGatewayApp,
  createCSPNonceApp
}

// Usage example for development
if (import.meta.env?.DEV) {
  const devApp = createDevelopmentSecurity()
  devApp.get('/', (c) => c.json({ message: 'Development API' }))

  console.log('Development security examples are ready for testing')
}

// Usage example for production
if (import.meta.env?.PROD) {
  const prodApp = createProductionSecurity()
  prodApp.get('/', (c) => c.json({ message: 'Production API' }))

  console.log('Production security examples are ready')
}
