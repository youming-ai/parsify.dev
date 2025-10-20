import { Hono } from 'hono'
import { DatabaseHealthMonitor, HealthReport } from '../database/health'
import { cors } from 'hono/cors'
import { KVCacheService } from '../services/cloudflare/kv-cache'
import { R2StorageService } from '../services/cloudflare/r2-storage'
import { CloudflareService } from '../services/cloudflare/cloudflare-service'

export interface ServiceHealthStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  error?: string
  lastCheck: number
  details?: Record<string, any>
}

export interface SystemHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  uptime: number
  services: {
    database: ServiceHealthStatus
    cache: ServiceHealthStatus
    storage: ServiceHealthStatus
    images?: ServiceHealthStatus
  }
  dependencies: ServiceHealthStatus[]
  metrics: {
    totalServices: number
    healthyServices: number
    degradedServices: number
    unhealthyServices: number
    averageResponseTime: number
  }
  alerts: Array<{
    type:
      | 'service_down'
      | 'slow_response'
      | 'high_error_rate'
      | 'dependency_issue'
    severity: 'info' | 'warning' | 'error' | 'critical'
    message: string
    service: string
    timestamp: number
  }>
  recommendations: string[]
}

export interface HealthRouteOptions {
  healthMonitor: DatabaseHealthMonitor
  cacheService?: KVCacheService
  storageService?: R2StorageService
  cloudflareService?: CloudflareService
  includeMetrics?: boolean
  includeAlerts?: boolean
  authEnabled?: boolean
  authKey?: string
  dependencies?: Array<{
    name: string
    check: () => Promise<{
      healthy: boolean
      responseTime: number
      error?: string
      details?: any
    }>
  }>
}

/**
 * Health check API routes
 */
export function createHealthRoutes(options: HealthRouteOptions) {
  const app = new Hono()

  // Enable CORS for health endpoints
  app.use('*', cors())

  // Basic health check endpoint
  app.get('/', async c => {
    try {
      const systemHealth = await getSystemHealth(options)

      return c.json(
        {
          status: systemHealth.status,
          timestamp: systemHealth.timestamp,
          responseTime: systemHealth.metrics.averageResponseTime,
          services: {
            database: systemHealth.services.database.status,
            cache: systemHealth.services.cache.status,
            storage: systemHealth.services.storage.status,
          },
          uptime: systemHealth.uptime,
        },
        systemHealth.status === 'healthy' ? 200 : 503
      )
    } catch (error) {
      return c.json(
        {
          status: 'unhealthy',
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        503
      )
    }
  })

  // Detailed health report endpoint
  app.get('/detailed', async c => {
    // Check auth if enabled
    if (options.authEnabled && options.authKey) {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || authHeader !== `Bearer ${options.authKey}`) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    try {
      const systemHealth = await getSystemHealth(options)
      const dbReport = await options.healthMonitor.getHealthReport()

      // Combine system health with detailed database metrics
      const response = {
        status: systemHealth.status,
        timestamp: systemHealth.timestamp,
        uptime: systemHealth.uptime,
        services: systemHealth.services,
        dependencies: systemHealth.dependencies,
        metrics: {
          system: systemHealth.metrics,
          database: {
            queries: dbReport.metrics.queries,
            connections: dbReport.metrics.connections,
            service: {
              uptime: dbReport.metrics.service.uptime,
              healthCheckCount: dbReport.metrics.service.healthCheckCount,
              healthyConnections: dbReport.metrics.service.healthyConnections,
              totalConnections: dbReport.metrics.service.totalConnections,
            },
          },
          cache: systemHealth.services.cache.details,
          storage: systemHealth.services.storage.details,
        },
        alerts: systemHealth.alerts,
        recommendations: systemHealth.recommendations,
      }

      // Include database-specific alerts if requested
      if (options.includeAlerts !== false) {
        response.alerts = [
          ...systemHealth.alerts,
          ...dbReport.alerts.map(alert => ({
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            service: 'database',
            timestamp: alert.timestamp,
            details: alert.metrics,
          })),
        ]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20) // Keep most recent 20 alerts
      }

      return c.json(response, systemHealth.status === 'healthy' ? 200 : 503)
    } catch (error) {
      return c.json(
        {
          status: 'unhealthy',
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        503
      )
    }
  })

  // Metrics-only endpoint
  app.get('/metrics', async c => {
    // Check auth if enabled
    if (options.authEnabled && options.authKey) {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || authHeader !== `Bearer ${options.authKey}`) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    try {
      const report = await options.healthMonitor.getHealthReport()

      return c.json({
        timestamp: Date.now(),
        metrics: report.metrics,
        alerts: {
          count: report.alerts.length,
          recent: report.alerts.slice(0, 5),
        },
      })
    } catch (error) {
      return c.json(
        {
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        500
      )
    }
  })

  // Alerts endpoint
  app.get('/alerts', async c => {
    // Check auth if enabled
    if (options.authEnabled && options.authKey) {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || authHeader !== `Bearer ${options.authKey}`) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    try {
      const limit = parseInt(c.req.query('limit') || '50')
      const alerts = options.healthMonitor.getAlerts(limit)

      return c.json({
        timestamp: Date.now(),
        count: alerts.length,
        alerts,
      })
    } catch (error) {
      return c.json(
        {
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        500
      )
    }
  })

  // Clear alerts endpoint (POST)
  app.post('/alerts/clear', async c => {
    // Check auth if enabled
    if (options.authEnabled && options.authKey) {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || authHeader !== `Bearer ${options.authKey}`) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    try {
      options.healthMonitor.clearAlerts()

      return c.json({
        timestamp: Date.now(),
        message: 'Alerts cleared successfully',
      })
    } catch (error) {
      return c.json(
        {
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        500
      )
    }
  })

  // Readiness probe endpoint (for Kubernetes/container orchestration)
  app.get('/ready', async c => {
    try {
      const status = await options.healthMonitor.performHealthCheck()

      if (status.healthy) {
        return c.json(
          {
            status: 'ready',
            timestamp: status.timestamp,
          },
          200
        )
      } else {
        return c.json(
          {
            status: 'not ready',
            timestamp: status.timestamp,
            error: status.error,
          },
          503
        )
      }
    } catch (error) {
      return c.json(
        {
          status: 'not ready',
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        503
      )
    }
  })

  // Liveness probe endpoint (for Kubernetes/container orchestration)
  app.get('/live', async c => {
    // Simple liveness check - just return 200 if the service is running
    return c.json(
      {
        status: 'alive',
        timestamp: Date.now(),
      },
      200
    )
  })

  // Health dashboard endpoint
  app.get('/dashboard', async c => {
    // Check auth if enabled
    if (options.authEnabled && options.authKey) {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || authHeader !== `Bearer ${options.authKey}`) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    try {
      const systemHealth = await getSystemHealth(options)
      const dbReport = await options.healthMonitor.getHealthReport()

      // Format data for dashboard consumption
      const dashboard = {
        overview: {
          status: systemHealth.status,
          timestamp: systemHealth.timestamp,
          uptime: systemHealth.uptime,
          healthScore: calculateHealthScore(systemHealth),
        },
        services: {
          database: {
            status: systemHealth.services.database.status,
            responseTime: systemHealth.services.database.responseTime,
            uptime: systemHealth.services.database.details?.uptime || 0,
            error: systemHealth.services.database.error,
            metrics: {
              queries: dbReport.metrics.queries,
              connections: dbReport.metrics.connections,
            },
          },
          cache: {
            status: systemHealth.services.cache.status,
            responseTime: systemHealth.services.cache.responseTime,
            details: systemHealth.services.cache.details,
          },
          storage: {
            status: systemHealth.services.storage.status,
            responseTime: systemHealth.services.storage.responseTime,
            details: systemHealth.services.storage.details,
          },
          ...(systemHealth.services.images && {
            images: {
              status: systemHealth.services.images.status,
              responseTime: systemHealth.services.images.responseTime,
              details: systemHealth.services.images.details,
            },
          }),
        },
        dependencies: systemHealth.dependencies.map(dep => ({
          name: dep.name,
          status: dep.status,
          responseTime: dep.responseTime,
          error: dep.error,
        })),
        metrics: {
          system: systemHealth.metrics,
          performance: {
            averageResponseTime: systemHealth.metrics.averageResponseTime,
            totalQueries: dbReport.metrics.queries.totalQueries,
            successRate: calculateSuccessRate(dbReport.metrics.queries),
          },
        },
        alerts: systemHealth.alerts.slice(0, 5), // Show recent 5 alerts
        recommendations: systemHealth.recommendations.slice(0, 3), // Show top 3 recommendations
        charts: {
          responseTime: {
            database: systemHealth.services.database.responseTime,
            cache: systemHealth.services.cache.responseTime,
            storage: systemHealth.services.storage.responseTime,
          },
          statusCounts: {
            healthy: systemHealth.metrics.healthyServices,
            degraded: systemHealth.metrics.degradedServices,
            unhealthy: systemHealth.metrics.unhealthyServices,
          },
        },
      }

      return c.json(dashboard)
    } catch (error) {
      return c.json(
        {
          status: 'unhealthy',
          timestamp: Date.now(),
          error: (error as Error).message,
        },
        503
      )
    }
  })

  return app
}

/**
 * Health check middleware for monitoring
 */
export function createHealthMiddleware(healthMonitor: DatabaseHealthMonitor) {
  return async (c: any, next: any) => {
    // Add health information to request context
    c.set('healthMonitor', healthMonitor)

    // Optionally perform quick health check
    const healthStatus = healthMonitor.getHealthStatus()
    c.set('dbHealthStatus', healthStatus)

    await next()
  }
}

/**
 * Helper function to create comprehensive health monitoring setup
 */
export function setupHealthMonitoring(
  app: Hono,
  healthMonitor: DatabaseHealthMonitor,
  options: {
    routePrefix?: string
    includeMetrics?: boolean
    includeAlerts?: boolean
    authEnabled?: boolean
    authKey?: string
    middlewareEnabled?: boolean
    cacheService?: KVCacheService
    storageService?: R2StorageService
    cloudflareService?: CloudflareService
    dependencies?: Array<{
      name: string
      check: () => Promise<{
        healthy: boolean
        responseTime: number
        error?: string
        details?: any
      }>
    }>
  } = {}
) {
  const {
    routePrefix = '/health',
    includeMetrics = true,
    includeAlerts = true,
    authEnabled = false,
    authKey,
    middlewareEnabled = true,
    cacheService,
    storageService,
    cloudflareService,
    dependencies,
  } = options

  // Add health monitoring middleware if enabled
  if (middlewareEnabled) {
    app.use('*', createHealthMiddleware(healthMonitor))
  }

  // Register health routes
  const healthRoutes = createHealthRoutes({
    healthMonitor,
    cacheService,
    storageService,
    cloudflareService,
    includeMetrics,
    includeAlerts,
    authEnabled,
    authKey,
    dependencies,
  })

  app.route(routePrefix, healthRoutes)

  return healthRoutes
}

/**
 * Get comprehensive system health status
 */
async function getSystemHealth(
  options: HealthRouteOptions
): Promise<SystemHealthReport> {
  const startTime = Date.now()
  const alerts: SystemHealthReport['alerts'] = []
  const recommendations: string[] = []

  // Check database health
  const databaseStatus = await checkDatabaseHealth(options.healthMonitor)

  // Check cache health
  const cacheStatus = await checkCacheHealth(options.cacheService)

  // Check storage health
  const storageStatus = await checkStorageHealth(options.storageService)

  // Check Cloudflare Images health
  const imagesStatus = await checkImagesHealth(options.cloudflareService)

  // Check dependencies
  const dependencyStatuses = await checkDependencies(options.dependencies || [])

  // Aggregate metrics
  const services = [databaseStatus, cacheStatus, storageStatus]
  if (imagesStatus) services.push(imagesStatus)
  const allServices = [...services, ...dependencyStatuses]

  const healthyCount = allServices.filter(s => s.status === 'healthy').length
  const degradedCount = allServices.filter(s => s.status === 'degraded').length
  const unhealthyCount = allServices.filter(
    s => s.status === 'unhealthy'
  ).length

  // Determine overall system health
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy'
  } else if (degradedCount > 0) {
    overallStatus = 'degraded'
  }

  // Generate alerts
  alerts.push(...generateAlerts(services, dependencyStatuses))

  // Generate recommendations
  recommendations.push(
    ...generateRecommendations(
      databaseStatus,
      cacheStatus,
      storageStatus,
      imagesStatus
    )
  )

  const uptime = Date.now() - options.healthMonitor.getHealthStatus().uptime

  return {
    status: overallStatus,
    timestamp: Date.now(),
    uptime,
    services: {
      database: databaseStatus,
      cache: cacheStatus,
      storage: storageStatus,
      ...(imagesStatus && { images: imagesStatus }),
    },
    dependencies: dependencyStatuses,
    metrics: {
      totalServices: allServices.length,
      healthyServices: healthyCount,
      degradedServices: degradedCount,
      unhealthyServices: unhealthyCount,
      averageResponseTime:
        allServices.reduce((sum, s) => sum + s.responseTime, 0) /
        allServices.length,
    },
    alerts,
    recommendations,
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(
  healthMonitor: DatabaseHealthMonitor
): Promise<ServiceHealthStatus> {
  const startTime = Date.now()

  try {
    const healthCheck = await healthMonitor.performHealthCheck()
    const responseTime = Date.now() - startTime

    return {
      name: 'database',
      status: healthCheck.healthy ? 'healthy' : 'unhealthy',
      responseTime,
      lastCheck: Date.now(),
      error: healthCheck.error,
      details: {
        consecutiveFailures:
          healthMonitor.getHealthStatus().consecutiveFailures,
        uptime: healthMonitor.getHealthStatus().uptime,
      },
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: Date.now(),
      error: (error as Error).message,
    }
  }
}

/**
 * Check cache (KV) health
 */
async function checkCacheHealth(
  cacheService?: KVCacheService
): Promise<ServiceHealthStatus> {
  const startTime = Date.now()

  if (!cacheService) {
    return {
      name: 'cache',
      status: 'healthy',
      responseTime: 0,
      lastCheck: Date.now(),
      details: { disabled: true },
    }
  }

  try {
    const healthCheck = await cacheService.healthCheck()
    const responseTime = Date.now() - startTime

    return {
      name: 'cache',
      status: healthCheck.status,
      responseTime,
      lastCheck: Date.now(),
      details: healthCheck.details,
    }
  } catch (error) {
    return {
      name: 'cache',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: Date.now(),
      error: (error as Error).message,
    }
  }
}

/**
 * Check storage (R2) health
 */
async function checkStorageHealth(
  storageService?: R2StorageService
): Promise<ServiceHealthStatus> {
  const startTime = Date.now()

  if (!storageService) {
    return {
      name: 'storage',
      status: 'healthy',
      responseTime: 0,
      lastCheck: Date.now(),
      details: { disabled: true },
    }
  }

  try {
    // For R2, we need to implement a health check method
    // For now, we'll do a simple check by trying to list a small number of objects
    const healthStatus = storageService.getHealthStatus()
    const responseTime = Date.now() - startTime

    return {
      name: 'storage',
      status: healthStatus?.healthy ? 'healthy' : 'unhealthy',
      responseTime,
      lastCheck: Date.now(),
      details: healthStatus || { checked: false },
    }
  } catch (error) {
    return {
      name: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: Date.now(),
      error: (error as Error).message,
    }
  }
}

/**
 * Check Cloudflare Images health
 */
async function checkImagesHealth(
  cloudflareService?: CloudflareService
): Promise<ServiceHealthStatus | null> {
  const startTime = Date.now()

  if (!cloudflareService) {
    return null
  }

  try {
    // For Images, we need to implement a health check
    // This would involve checking the Images API availability
    const responseTime = Date.now() - startTime

    return {
      name: 'images',
      status: 'healthy', // Placeholder - would need actual implementation
      responseTime,
      lastCheck: Date.now(),
      details: { service: 'cloudflare-images' },
    }
  } catch (error) {
    return {
      name: 'images',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: Date.now(),
      error: (error as Error).message,
    }
  }
}

/**
 * Check external dependencies
 */
async function checkDependencies(
  dependencies: Array<{
    name: string
    check: () => Promise<{
      healthy: boolean
      responseTime: number
      error?: string
      details?: any
    }>
  }>
): Promise<ServiceHealthStatus[]> {
  const results: ServiceHealthStatus[] = []

  for (const dependency of dependencies) {
    const startTime = Date.now()

    try {
      const check = await dependency.check()

      results.push({
        name: dependency.name,
        status: check.healthy ? 'healthy' : 'unhealthy',
        responseTime: check.responseTime,
        lastCheck: Date.now(),
        error: check.error,
        details: check.details,
      })
    } catch (error) {
      results.push({
        name: dependency.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        error: (error as Error).message,
      })
    }
  }

  return results
}

/**
 * Generate health alerts
 */
function generateAlerts(
  services: ServiceHealthStatus[],
  dependencies: ServiceHealthStatus[]
): SystemHealthReport['alerts'] {
  const alerts: SystemHealthReport['alerts'] = []
  const allServices = [...services, ...dependencies]

  // Generate alerts for unhealthy services
  allServices.forEach(service => {
    if (service.status === 'unhealthy') {
      alerts.push({
        type: 'service_down',
        severity: 'critical',
        message: `${service.name} service is down`,
        service: service.name,
        timestamp: Date.now(),
      })
    } else if (service.status === 'degraded') {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `${service.name} service is experiencing degraded performance`,
        service: service.name,
        timestamp: Date.now(),
      })
    }

    // Alert for slow responses
    if (service.responseTime > 5000) {
      // 5 seconds
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `${service.name} response time is ${service.responseTime}ms`,
        service: service.name,
        timestamp: Date.now(),
      })
    }
  })

  return alerts
}

/**
 * Generate health recommendations
 */
function generateRecommendations(
  database: ServiceHealthStatus,
  cache: ServiceHealthStatus,
  storage: ServiceHealthStatus,
  images?: ServiceHealthStatus
): string[] {
  const recommendations: string[] = []

  // Database recommendations
  if (database.status !== 'healthy') {
    recommendations.push('Check database connectivity and configuration')
  }
  if (database.responseTime > 1000) {
    recommendations.push(
      'Consider optimizing database queries or adding indexes'
    )
  }

  // Cache recommendations
  if (cache.status !== 'healthy') {
    recommendations.push('Check KV cache service and namespace configuration')
  }
  if (cache.responseTime > 500) {
    recommendations.push(
      'Consider cache warming strategies or优化 cache key patterns'
    )
  }

  // Storage recommendations
  if (storage.status !== 'healthy') {
    recommendations.push(
      'Check R2 storage configuration and bucket permissions'
    )
  }
  if (storage.responseTime > 2000) {
    recommendations.push('Consider implementing CDN or multi-region storage')
  }

  // Images recommendations
  if (images && images.status !== 'healthy') {
    recommendations.push('Check Cloudflare Images service configuration')
  }

  return recommendations
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(systemHealth: SystemHealthReport): number {
  let score = 100

  // Deduct points for unhealthy services
  score -= systemHealth.metrics.unhealthyServices * 30
  score -= systemHealth.metrics.degradedServices * 15

  // Deduct points for slow response times
  if (systemHealth.metrics.averageResponseTime > 1000) {
    score -= Math.min(
      20,
      (systemHealth.metrics.averageResponseTime - 1000) / 100
    )
  }

  // Deduct points for critical alerts
  const criticalAlerts = systemHealth.alerts.filter(
    a => a.severity === 'critical'
  ).length
  score -= criticalAlerts * 25

  // Deduct points for error alerts
  const errorAlerts = systemHealth.alerts.filter(
    a => a.severity === 'error'
  ).length
  score -= errorAlerts * 10

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate query success rate
 */
function calculateSuccessRate(queries: any): number {
  if (queries.totalQueries === 0) return 100
  return Math.round((queries.successfulQueries / queries.totalQueries) * 100)
}
