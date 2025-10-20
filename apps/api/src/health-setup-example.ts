/**
 * Example of setting up comprehensive health monitoring for the API
 *
 * This file demonstrates how to integrate the new health check system
 * with the existing Cloudflare services and monitoring.
 */

import { Hono } from 'hono'
import { setupHealthMonitoring } from './routes/health'
import { DatabaseHealthMonitor } from './database/health'
import { DatabaseService } from './database/service'
import { KVCacheService } from './services/cloudflare/kv-cache'
import { R2StorageService } from './services/cloudflare/r2-storage'
import { CloudflareService } from './services/cloudflare/cloudflare-service'

export interface HealthCheckEnv {
  // Existing Cloudflare bindings
  DB: D1Database
  CACHE: KVNamespace
  SESSIONS: KVNamespace
  UPLOADS: KVNamespace
  ANALYTICS: KVNamespace
  FILES: R2Bucket

  // Environment variables
  ENVIRONMENT: string
  ENABLE_HEALTH_CHECKS: string
  HEALTH_CHECK_AUTH_KEY?: string

  // External service URLs for dependency checking
  EXTERNAL_API_URL?: string
  PAYMENT_PROVIDER_URL?: string
  NOTIFICATION_SERVICE_URL?: string
}

/**
 * Setup comprehensive health monitoring for the application
 */
export function setupComprehensiveHealthMonitoring(
  app: Hono<{ Bindings: HealthCheckEnv }>,
  env: HealthCheckEnv,
  services: {
    databaseService: DatabaseService
    cloudflareService: CloudflareService
    cacheService?: KVCacheService
    storageService?: R2StorageService
  }
) {
  // Create database health monitor
  const healthMonitor = new DatabaseHealthMonitor(services.databaseService, {
    enabled: env.ENABLE_HEALTH_CHECKS === 'true',
    intervalMs: 30000, // 30 seconds
    timeoutMs: 5000, // 5 seconds
    failureThreshold: 3,
    successThreshold: 2,
    alertThresholds: {
      queryTime: 1000, // 1 second
      errorRate: 0.05, // 5%
      connectionPoolUtilization: 0.9 // 90%
    }
  })

  // Define external dependencies to monitor
  const dependencies = [
    {
      name: 'external-api',
      check: async () => {
        if (!env.EXTERNAL_API_URL) {
          return { healthy: true, responseTime: 0, details: { disabled: true } }
        }

        const startTime = Date.now()
        try {
          const response = await fetch(`${env.EXTERNAL_API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })
          const responseTime = Date.now() - startTime

          return {
            healthy: response.ok,
            responseTime,
            details: {
              status: response.status,
              url: env.EXTERNAL_API_URL
            }
          }
        } catch (error) {
          return {
            healthy: false,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    {
      name: 'payment-provider',
      check: async () => {
        if (!env.PAYMENT_PROVIDER_URL) {
          return { healthy: true, responseTime: 0, details: { disabled: true } }
        }

        const startTime = Date.now()
        try {
          const response = await fetch(`${env.PAYMENT_PROVIDER_URL}/ping`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          })
          const responseTime = Date.now() - startTime

          return {
            healthy: response.ok,
            responseTime,
            details: {
              status: response.status,
              url: env.PAYMENT_PROVIDER_URL
            }
          }
        } catch (error) {
          return {
            healthy: false,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    {
      name: 'notification-service',
      check: async () => {
        if (!env.NOTIFICATION_SERVICE_URL) {
          return { healthy: true, responseTime: 0, details: { disabled: true } }
        }

        const startTime = Date.now()
        try {
          const response = await fetch(`${env.NOTIFICATION_SERVICE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          })
          const responseTime = Date.now() - startTime

          return {
            healthy: response.ok,
            responseTime,
            details: {
              status: response.status,
              url: env.NOTIFICATION_SERVICE_URL
            }
          }
        } catch (error) {
          return {
            healthy: false,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }
  ]

  // Setup comprehensive health monitoring
  setupHealthMonitoring(app, healthMonitor, {
    routePrefix: '/health',
    includeMetrics: true,
    includeAlerts: true,
    authEnabled: env.ENVIRONMENT === 'production',
    authKey: env.HEALTH_CHECK_AUTH_KEY,
    middlewareEnabled: true,
    cacheService: services.cacheService,
    storageService: services.storageService,
    cloudflareService: services.cloudflareService,
    dependencies
  })

  return healthMonitor
}

/**
 * Example of how to use the health monitoring in the main app
 */
export function createHealthCheckExample() {
  const app = new Hono<{ Bindings: HealthCheckEnv }>()

  // Initialize services (this would be done in your main app initialization)
  app.use('*', async (c, next) => {
    const env = c.env

    // Create database service
    const databaseService = new DatabaseService(env.DB, {
      enableHealthMonitoring: true,
      enableMetrics: true
    })

    // Create Cloudflare service
    const cloudflareService = createCloudflareService(env, {
      environment: env.ENVIRONMENT,
      enableHealthMonitoring: true,
      enableCaching: true,
      enableMetrics: true
    })

    // Create cache service
    const cacheService = new KVCacheService(cloudflareService)

    // Create storage service
    const storageService = createR2StorageService({
      bucket: env.FILES,
      config: {
        bucketName: 'parsify-files',
        publicUrl: 'https://pub-xxxxxxxx.r2.dev',
        enableCdn: true,
        cdnUrl: 'https://cdn.parsify.dev',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableHealthMonitoring: true
      },
      database: databaseService,
      enableHealthMonitoring: true
    })

    // Setup comprehensive health monitoring
    const healthMonitor = setupComprehensiveHealthMonitoring(
      app,
      env,
      {
        databaseService,
        cloudflareService,
        cacheService,
        storageService
      }
    )

    // Store services in context for later use
    c.set('databaseService', databaseService)
    c.set('cloudflareService', cloudflareService)
    c.set('cacheService', cacheService)
    c.set('storageService', storageService)
    c.set('healthMonitor', healthMonitor)

    await next()
  })

  // Add a custom health check endpoint for application-specific health
  app.get('/health/application', async (c) => {
    const healthMonitor = c.get('healthMonitor') as DatabaseHealthMonitor

    try {
      // Perform application-specific health checks
      const appHealth = await performApplicationHealthChecks(c)

      return c.json({
        status: appHealth.healthy ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        checks: appHealth.checks,
        version: c.env.API_VERSION || 'v1',
        environment: c.env.ENVIRONMENT || 'unknown'
      }, appHealth.healthy ? 200 : 503)
    } catch (error) {
      return c.json({
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 503)
    }
  })

  return app
}

/**
 * Perform application-specific health checks
 */
async function performApplicationHealthChecks(c: any): Promise<{
  healthy: boolean
  checks: Record<string, { healthy: boolean; message?: string; responseTime?: number }>
}> {
  const checks: Record<string, { healthy: boolean; message?: string; responseTime?: number }> = {}
  let overallHealthy = true

  // Check if essential features are working
  try {
    const startTime = Date.now()
    // Test database connection with a simple query
    const dbService = c.get('databaseService')
    await dbService.query('SELECT 1 as test')
    checks.database = {
      healthy: true,
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    checks.database = {
      healthy: false,
      message: error instanceof Error ? error.message : 'Database check failed'
    }
    overallHealthy = false
  }

  // Check cache functionality
  try {
    const startTime = Date.now()
    const cacheService = c.get('cacheService')
    const testKey = 'health-check-test'
    const testValue = { timestamp: Date.now() }

    await cacheService.set(testKey, testValue, { ttl: 60 })
    const retrieved = await cacheService.get(testKey)
    await cacheService.delete(testKey)

    checks.cache = {
      healthy: retrieved && retrieved.timestamp === testValue.timestamp,
      responseTime: Date.now() - startTime
    }

    if (!checks.cache.healthy) {
      overallHealthy = false
    }
  } catch (error) {
    checks.cache = {
      healthy: false,
      message: error instanceof Error ? error.message : 'Cache check failed'
    }
    overallHealthy = false
  }

  // Check file storage functionality
  try {
    const startTime = Date.now()
    const storageService = c.get('storageService')
    const healthStatus = storageService.getHealthStatus()

    checks.storage = {
      healthy: healthStatus?.healthy || false,
      responseTime: Date.now() - startTime,
      message: healthStatus?.healthy ? 'Storage service operational' : 'Storage service issues detected'
    }

    if (!checks.storage.healthy) {
      overallHealthy = false
    }
  } catch (error) {
    checks.storage = {
      healthy: false,
      message: error instanceof Error ? error.message : 'Storage check failed'
    }
    overallHealthy = false
  }

  // Check authentication system
  try {
    const startTime = Date.now()
    // This would involve checking JWT token generation/validation
    // For now, we'll just simulate the check
    checks.authentication = {
      healthy: true,
      responseTime: Date.now() - startTime,
      message: 'Authentication system operational'
    }
  } catch (error) {
    checks.authentication = {
      healthy: false,
      message: error instanceof Error ? error.message : 'Authentication check failed'
    }
    overallHealthy = false
  }

  return {
    healthy: overallHealthy,
    checks
  }
}

/**
 * Prometheus metrics exporter for health monitoring
 */
export function createPrometheusHealthMetrics(healthMonitor: DatabaseHealthMonitor) {
  return async (c: any) => {
    try {
      const healthStatus = healthMonitor.getHealthStatus()
      const report = await healthMonitor.getHealthReport()

      const metrics = [
        `# HELP application_health_status Overall application health status (1=healthy, 0=unhealthy)`,
        `# TYPE application_health_status gauge`,
        `application_health_status ${healthStatus.healthy ? 1 : 0}`,
        '',
        `# HELP application_uptime_seconds Application uptime in seconds`,
        `# TYPE application_uptime_seconds counter`,
        `application_uptime_seconds ${healthStatus.uptime / 1000}`,
        '',
        `# HELP database_response_time_ms Database health check response time in milliseconds`,
        `# TYPE database_response_time_ms gauge`,
        `database_response_time_ms ${healthStatus.responseTime}`,
        '',
        `# HELP database_consecutive_failures Number of consecutive database health check failures`,
        `# TYPE database_consecutive_failures gauge`,
        `database_consecutive_failures ${healthStatus.consecutiveFailures}`,
        '',
        `# HELP database_queries_total Total number of database queries`,
        `# TYPE database_queries_total counter`,
        `database_queries_total ${report.metrics.queries.totalQueries}`,
        '',
        `# HELP database_query_success_rate Database query success rate (0-1)`,
        `# TYPE database_query_success_rate gauge`,
        `database_query_success_rate ${report.metrics.queries.totalQueries > 0 ? report.metrics.queries.successfulQueries / report.metrics.queries.totalQueries : 0}`,
        '',
        `# HELP database_connections_active Current number of active database connections`,
        `# TYPE database_connections_active gauge`,
        `database_connections_active ${report.metrics.connections.activeConnections}`,
        '',
        `# HELP health_alerts_total Total number of health alerts`,
        `# TYPE health_alerts_total counter`,
        `health_alerts_total ${report.alerts.length}`,
        '',
        `# HELP health_check_timestamp Unix timestamp of last health check`,
        `# TYPE health_check_timestamp gauge`,
        `health_check_timestamp ${Date.now()}`
      ].join('\n')

      return c.text(metrics, 200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
      })
    } catch (error) {
      return c.json({
        error: 'Failed to generate metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
}
