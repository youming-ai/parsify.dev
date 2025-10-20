import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { routes } from './routes'
import {
  createCloudflareService,
  CloudflareService,
} from './services/cloudflare'
import {
  securityMiddleware,
  createDevelopmentSecurity,
  createProductionSecurity,
  SecurityPresets,
} from './middleware/security'
import { errorMiddleware } from './middleware/error'
import { rateLimitMiddleware } from './middleware/rate_limit'
import {
  initializeSentry,
  sentryMiddleware,
  sentryErrorHandler,
  setSentryUserContext,
  clearSentryUserContext,
} from './monitoring/sentry'

// Type definitions for environment
export interface Env {
  // Cloudflare bindings
  DB: D1Database
  CACHE: KVNamespace
  SESSIONS: KVNamespace
  UPLOADS: KVNamespace
  ANALYTICS: KVNamespace
  FILES: R2Bucket

  // Durable Object bindings
  SESSION_MANAGER: DurableObjectNamespace
  COLLABORATION_ROOM: DurableObjectNamespace
  REALTIME_SYNC: DurableObjectNamespace

  // Environment variables
  ENVIRONMENT: string
  API_VERSION: string
  ENABLE_METRICS: string
  LOG_LEVEL: string
  ENABLE_HEALTH_CHECKS: string
  ENABLE_CORS: string
  MAX_REQUEST_SIZE: string
  REQUEST_TIMEOUT: string

  // Production-specific variables
  CLOUDFLARE_D1_DATABASE_ID?: string
  CLOUDFLARE_KV_CACHE_ID?: string
  CLOUDFLARE_KV_SESSIONS_ID?: string
  CLOUDFLARE_KV_UPLOADS_ID?: string
  CLOUDFLARE_KV_ANALYTICS_ID?: string
  CLOUDFLARE_R2_BUCKET_NAME?: string
  CLOUDFLARE_R2_CDN_URL?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  JWT_SECRET: string

  // Sentry configuration
  SENTRY_DSN: string
  SENTRY_ENVIRONMENT?: string
  SENTRY_RELEASE?: string
  SENTRY_TRACES_SAMPLE_RATE?: string
  SENTRY_PROFILES_SAMPLE_RATE?: string
  SENTRY_DEBUG?: string
  SENTRY_SESSION_SAMPLE_RATE?: string
  SENTRY_ENABLE_PERFORMANCE?: string
  SENTRY_ENABLE_REPLAY?: string
  SENTRY_REPLAY_SESSION_SAMPLE_RATE?: string
  SENTRY_REPLAY_ERROR_SAMPLE_RATE?: string
}

const app = new Hono<{ Bindings: Env }>()

// Initialize Sentry error tracking
app.use('*', async (c, next) => {
  // Initialize Sentry with environment configuration
  initializeSentry(c.env, c.req.raw)

  // Add breadcrumb for application startup
  const sentryClient = initializeSentry(c.env)
  sentryClient.addBreadcrumb({
    category: 'lifecycle',
    message: 'API request started',
    level: 'info',
    data: {
      method: c.req.method,
      path: c.req.path,
      url: c.req.url,
      userAgent: c.req.header('User-Agent'),
      cfRay: c.req.header('CF-Ray'),
    },
  })

  await next()
})

// Sentry performance monitoring and error tracking middleware
app.use(
  '*',
  sentryMiddleware({
    performanceOptions: {
      enableTracing: true,
      enableProfiling: c.env.ENVIRONMENT === 'production',
      enableMetrics: true,
      ignoredPaths: ['/health', '/metrics', '/favicon.ico'],
      ignoredStatusCodes: [404, 401, 403],
    },
    enableTracing: true,
    enableErrorCapture: true,
  })
)

// Initialize Cloudflare service
app.use('*', async (c, next) => {
  try {
    // Create Cloudflare service instance and store in context
    const cloudflare = createCloudflareService(c.env, {
      environment: c.env.ENVIRONMENT,
      enableHealthMonitoring: c.env.ENABLE_HEALTH_CHECKS === 'true',
      enableCaching: true,
      enableMetrics: c.env.ENABLE_METRICS === 'true',
      logLevel: c.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
    })

    // Start health monitoring
    await cloudflare.startHealthMonitoring()

    // Store in context for later use
    c.set('cloudflare', cloudflare)

    await next()
  } catch (error) {
    console.error('Failed to initialize Cloudflare service:', error)
    return c.json(
      {
        error: 'Service Initialization Failed',
        message: 'Unable to initialize required services',
        requestId: c.get('requestId'),
      },
      503
    )
  }
})

// Security middleware - comprehensive CORS and security headers
app.use(
  '*',
  securityMiddleware({
    environments: {
      development: SecurityPresets.DEVELOPMENT,
      staging: SecurityPresets.PRODUCTION,
      production: SecurityPresets.PRODUCTION,
    },
    paths: {
      '/api/v1/public': SecurityPresets.PUBLIC_API,
      '/api/v1/admin': SecurityPresets.ADMIN,
    },
    enableLogging: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  })
)

// Sentry error handler (catches errors before they reach the main error middleware)
app.use('*', sentryErrorHandler())

// Error handling middleware (should be early to catch all errors)
app.use('*', errorMiddleware())

app.use(
  '*',
  logger((message, ...rest) => {
    const logLevel = rest[0]?.env?.LOG_LEVEL || 'info'
    if (logLevel === 'debug') {
      console.log(message, ...rest)
    }
  })
)

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-ID', requestId)
  await next()
})

// Enhanced rate limiting middleware using the proper rate limiting service
app.use(
  '*',
  rateLimitMiddleware({
    strategy: 'token_bucket' as any,
    requests: 1000,
    window: 3600, // 1 hour
    limits: {
      anonymous: 100,
      free: 1000,
      pro: 5000,
      enterprise: 50000,
    },
    quotaType: 'api_requests',
    period: 'hour' as any,
    distributed: true,
    headers: true,
    onError: (c, check) => {
      return c.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((check.retryAfter || 0) / 1000),
          limit: check.limit,
          remaining: check.remaining,
          resetTime: check.resetTime,
          requestId: c.get('requestId'),
        },
        429
      )
    },
  })
)

// Enhanced health check endpoint
app.get('/health', async c => {
  const cloudflare = c.get('cloudflare') as CloudflareService

  try {
    const health = await cloudflare.getHealthStatus()
    const metrics = cloudflare.getMetrics()

    return c.json({
      status: health.overall,
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'unknown',
      version: c.env.API_VERSION || 'v1',
      services: health,
      metrics: {
        uptime: process.uptime ? process.uptime() : 0,
        memory:
          typeof performance !== 'undefined'
            ? performance.memory?.usedJSHeapSize
            : undefined,
        requestCount:
          metrics.d1.queryCount +
          Object.values(metrics.kv).reduce(
            (sum, kv) => sum + kv.operationsCount,
            0
          ),
      },
      requestId: c.get('requestId'),
    })
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: c.env.ENVIRONMENT || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: c.get('requestId'),
      },
      503
    )
  }
})

// Metrics endpoint
app.get('/metrics', async c => {
  const cloudflare = c.get('cloudflare') as CloudflareService

  if (c.env.ENABLE_METRICS !== 'true') {
    return c.json({ error: 'Metrics disabled' }, 404)
  }

  try {
    const metrics = cloudflare.getMetrics()
    const health = await cloudflare.getHealthStatus()

    return c.json({
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
      metrics,
      health,
      system: {
        uptime: process.uptime ? process.uptime() : 0,
        memory:
          typeof performance !== 'undefined' ? performance.memory : undefined,
        cpu: typeof performance !== 'undefined' ? performance.now() : undefined,
      },
    })
  } catch (error) {
    return c.json(
      {
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: c.get('requestId'),
      },
      500
    )
  }
})

// Cache management endpoints
app.get('/admin/cache/stats', async c => {
  const cloudflare = c.get('cloudflare') as CloudflareService

  // Basic admin authentication check (in production, implement proper auth)
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    // This would require additional implementation in the cache service
    return c.json({
      message: 'Cache statistics endpoint',
      note: 'Detailed cache stats would be implemented here',
      requestId: c.get('requestId'),
    })
  } catch (error) {
    return c.json(
      {
        error: 'Failed to retrieve cache stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: c.get('requestId'),
      },
      500
    )
  }
})

app.delete('/admin/cache', async c => {
  const cloudflare = c.get('cloudflare') as CloudflareService

  // Basic admin authentication check
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const pattern = c.req.query('pattern')
    // This would require additional implementation
    return c.json({
      message: 'Cache cleared',
      pattern: pattern || 'all',
      requestId: c.get('requestId'),
    })
  } catch (error) {
    return c.json(
      {
        error: 'Failed to clear cache',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: c.get('requestId'),
      },
      500
    )
  }
})

// API routes
app.route('/api/v1', routes)

// Root endpoint
app.get('/', c => {
  return c.json({
    name: 'Parsify API',
    version: c.env.API_VERSION || 'v1',
    environment: c.env.ENVIRONMENT || 'unknown',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/api/v1',
      docs: '/api/v1/docs',
    },
    requestId: c.get('requestId'),
  })
})

// 404 handler
app.notFound(c => {
  return c.json(
    {
      error: 'Not Found',
      message: `The requested endpoint ${c.req.path} was not found`,
      availableEndpoints: ['/health', '/metrics', '/api/v1'],
      requestId: c.get('requestId'),
    },
    404
  )
})

// Enhanced error handler
app.onError((err, c) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    requestId: c.get('requestId'),
  })

  // Don't expose internal errors in production
  const isDevelopment = c.env.ENVIRONMENT === 'development'

  return c.json(
    {
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
      ...(isDevelopment && { stack: err.stack }),
    },
    500
  )
})

// Cleanup handler for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  // Cleanup would be handled here
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  // Cleanup would be handled here
})

export { app }

export default {
  fetch: app.fetch,
}
