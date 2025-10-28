import { Hono } from 'hono'
import { createDatabaseHealthMonitor, type DatabaseHealthMonitor } from './health'
import type { DatabaseService } from './service'

export interface HealthApiOptions {
  databaseService: DatabaseService
  healthMonitor?: DatabaseHealthMonitor
  enableDetailedEndpoint?: boolean
  enableMetricsEndpoint?: boolean
  enableAlertsEndpoint?: boolean
}

/**
 * Health check API routes
 */
export class HealthApi {
  private app: Hono
  private databaseService: DatabaseService
  private healthMonitor: DatabaseHealthMonitor
  private options: Required<Omit<HealthApiOptions, 'databaseService' | 'healthMonitor'>>

  constructor(options: HealthApiOptions) {
    this.databaseService = options.databaseService
    this.healthMonitor = options.healthMonitor || createDatabaseHealthMonitor(this.databaseService)
    this.options = {
      enableDetailedEndpoint: options.enableDetailedEndpoint ?? true,
      enableMetricsEndpoint: options.enableMetricsEndpoint ?? true,
      enableAlertsEndpoint: options.enableAlertsEndpoint ?? true,
    }

    this.app = new Hono()
    this.setupRoutes()
  }

  /**
   * Get the Hono app instance
   */
  getApp(): Hono {
    return this.app
  }

  /**
   * Setup health check routes
   */
  private setupRoutes(): void {
    // Basic health check endpoint
    this.app.get('/health', async c => {
      try {
        const healthResult = await this.databaseService.healthCheck()

        return c.json(
          {
            status: healthResult.healthy ? 'healthy' : 'unhealthy',
            timestamp: healthResult.timestamp,
            responseTime: healthResult.responseTime,
            error: healthResult.error,
          },
          healthResult.healthy ? 200 : 503
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
    if (this.options.enableDetailedEndpoint) {
      this.app.get('/health/detailed', async c => {
        try {
          const report = await this.healthMonitor.getHealthReport()

          return c.json(
            {
              status: report.status.healthy ? 'healthy' : 'unhealthy',
              uptime: report.status.uptime,
              lastCheck: report.status.lastCheck,
              responseTime: report.status.responseTime,
              metrics: {
                queries: {
                  total: report.metrics.queries.totalQueries,
                  successful: report.metrics.queries.successfulQueries,
                  failed: report.metrics.queries.failedQueries,
                  averageTime: Math.round(report.metrics.queries.averageQueryTime),
                  slowQueries: report.metrics.queries.slowQueries,
                  cachedQueries: report.metrics.queries.cachedQueries,
                },
                connections: {
                  total: report.metrics.connections.totalConnections,
                  healthy: report.metrics.connections.healthyConnections,
                  active: report.metrics.connections.activeConnections,
                  idle: report.metrics.connections.idleConnections,
                  utilization: Math.round(report.metrics.connections.poolUtilization * 100),
                },
                service: {
                  uptime: report.metrics.service.uptime,
                  startTime: report.metrics.service.startTime,
                  healthChecks: report.metrics.service.healthCheckCount,
                },
              },
              alerts: report.alerts.slice(0, 10), // Last 10 alerts
              recommendations: report.recommendations,
              error: report.status.error,
            },
            report.status.healthy ? 200 : 503
          )
        } catch (error) {
          return c.json(
            {
              status: 'unhealthy',
              error: (error as Error).message,
              timestamp: Date.now(),
            },
            503
          )
        }
      })
    }

    // Metrics endpoint
    if (this.options.enableMetricsEndpoint) {
      this.app.get('/health/metrics', async c => {
        try {
          const metrics = this.databaseService.getMetrics()

          return c.json({
            timestamp: Date.now(),
            queries: {
              total: metrics.queries.totalQueries,
              successful: metrics.queries.successfulQueries,
              failed: metrics.queries.failedQueries,
              successRate:
                metrics.queries.totalQueries > 0
                  ? Math.round(
                      (metrics.queries.successfulQueries / metrics.queries.totalQueries) * 100
                    )
                  : 0,
              averageTime: Math.round(metrics.queries.averageQueryTime),
              slowQueries: metrics.queries.slowQueries,
              cachedQueries: metrics.queries.cachedQueries,
            },
            connections: {
              total: metrics.connections.totalConnections,
              healthy: metrics.connections.healthyConnections,
              active: metrics.connections.activeConnections,
              idle: metrics.connections.idleConnections,
              utilization: Math.round(metrics.connections.poolUtilization * 100),
            },
            service: {
              uptime: metrics.service.uptime,
              startTime: metrics.service.startTime,
              healthChecks: metrics.service.healthCheckCount,
              lastHealthCheck: metrics.service.lastHealthCheck,
            },
          })
        } catch (error) {
          return c.json(
            {
              error: (error as Error).message,
              timestamp: Date.now(),
            },
            500
          )
        }
      })
    }

    // Alerts endpoint
    if (this.options.enableAlertsEndpoint) {
      this.app.get('/health/alerts', async c => {
        try {
          const limit = parseInt(c.req.query('limit') || '50', 10)
          const alerts = this.healthMonitor.getAlerts(limit)

          return c.json({
            timestamp: Date.now(),
            total: alerts.length,
            alerts: alerts.map(alert => ({
              type: alert.type,
              severity: alert.severity,
              message: alert.message,
              timestamp: alert.timestamp,
            })),
          })
        } catch (error) {
          return c.json(
            {
              error: (error as Error).message,
              timestamp: Date.now(),
            },
            500
          )
        }
      })

      // Clear alerts endpoint
      this.app.delete('/health/alerts', async c => {
        try {
          this.healthMonitor.clearAlerts()

          return c.json({
            message: 'Alerts cleared successfully',
            timestamp: Date.now(),
          })
        } catch (error) {
          return c.json(
            {
              error: (error as Error).message,
              timestamp: Date.now(),
            },
            500
          )
        }
      })
    }

    // Readiness probe endpoint
    this.app.get('/health/ready', async c => {
      try {
        const healthResult = await this.databaseService.healthCheck()
        const metrics = this.databaseService.getMetrics()

        // Check if database is ready to accept connections
        const isReady =
          healthResult.healthy &&
          metrics.connections.healthyConnections > 0 &&
          metrics.connections.poolUtilization < 0.95

        return c.json(
          {
            ready: isReady,
            timestamp: Date.now(),
            checks: {
              database: healthResult.healthy,
              connections: metrics.connections.healthyConnections > 0,
              poolUtilization: metrics.connections.poolUtilization < 0.95,
            },
          },
          isReady ? 200 : 503
        )
      } catch (error) {
        return c.json(
          {
            ready: false,
            timestamp: Date.now(),
            error: (error as Error).message,
          },
          503
        )
      }
    })

    // Liveness probe endpoint
    this.app.get('/health/live', async c => {
      try {
        const status = this.healthMonitor.getHealthStatus()

        return c.json(
          {
            alive: status.healthy,
            timestamp: Date.now(),
            uptime: status.uptime,
            lastCheck: status.lastCheck,
          },
          status.healthy ? 200 : 503
        )
      } catch (error) {
        return c.json(
          {
            alive: false,
            timestamp: Date.now(),
            error: (error as Error).message,
          },
          503
        )
      }
    })
  }

  /**
   * Get health monitor instance
   */
  getHealthMonitor(): DatabaseHealthMonitor {
    return this.healthMonitor
  }

  /**
   * Get database service instance
   */
  getDatabaseService(): DatabaseService {
    return this.databaseService
  }
}

/**
 * Factory function to create health API
 */
export function createHealthApi(options: HealthApiOptions): HealthApi {
  return new HealthApi(options)
}

/**
 * Middleware to add health check routes to existing Hono app
 */
export function addHealthRoutes(app: Hono, options: HealthApiOptions): void {
  const healthApi = createHealthApi(options)
  const healthApp = healthApi.getApp()

  // Mount health routes
  app.route('/api', healthApp)
}

/**
 * Ready-to-use health check middleware for common load balancers and orchestration systems
 */
export class HealthCheckMiddleware {
  private healthApi: HealthApi

  constructor(options: HealthApiOptions) {
    this.healthApi = new HealthApi(options)
  }

  /**
   * Get middleware for Kubernetes/Container health checks
   */
  getKubernetesHealthMiddleware() {
    return async (c: any, next: any) => {
      if (c.req.path === '/healthz' || c.req.path === '/health/live') {
        const healthResult = await this.healthApi.getDatabaseService().healthCheck()
        return c.json(
          {
            status: healthResult.healthy ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
          },
          healthResult.healthy ? 200 : 503
        )
      }

      if (c.req.path === '/healthz/ready' || c.req.path === '/health/ready') {
        const healthResult = await this.healthApi.getDatabaseService().healthCheck()
        const metrics = this.healthApi.getDatabaseService().getMetrics()

        const isReady = healthResult.healthy && metrics.connections.healthyConnections > 0

        return c.json(
          {
            status: isReady ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
          },
          isReady ? 200 : 503
        )
      }

      await next()
    }
  }

  /**
   * Get middleware for AWS ELB health checks
   */
  getAWSHealthMiddleware() {
    return async (c: any, next: any) => {
      if (c.req.path === '/health') {
        const healthResult = await this.healthApi.getDatabaseService().healthCheck()

        if (healthResult.healthy) {
          return c.text('OK', 200)
        } else {
          return c.text('Service Unavailable', 503)
        }
      }

      await next()
    }
  }

  /**
   * Get middleware for Prometheus metrics export
   */
  getPrometheusMetricsMiddleware() {
    return async (c: any, next: any) => {
      if (c.req.path === '/metrics') {
        const metrics = this.healthApi.getDatabaseService().getMetrics()

        const prometheusMetrics = [
          `# HELP database_queries_total Total number of database queries`,
          `# TYPE database_queries_total counter`,
          `database_queries_total ${metrics.queries.totalQueries}`,
          '',
          `# HELP database_queries_successful_total Total number of successful database queries`,
          `# TYPE database_queries_successful_total counter`,
          `database_queries_successful_total ${metrics.queries.successfulQueries}`,
          '',
          `# HELP database_queries_failed_total Total number of failed database queries`,
          `# TYPE database_queries_failed_total counter`,
          `database_queries_failed_total ${metrics.queries.failedQueries}`,
          '',
          `# HELP database_query_duration_seconds Average query duration in seconds`,
          `# TYPE database_query_duration_seconds gauge`,
          `database_query_duration_seconds ${metrics.queries.averageQueryTime / 1000}`,
          '',
          `# HELP database_connections_active Current number of active database connections`,
          `# TYPE database_connections_active gauge`,
          `database_connections_active ${metrics.connections.activeConnections}`,
          '',
          `# HELP database_connections_total Total number of database connections`,
          `# TYPE database_connections_total gauge`,
          `database_connections_total ${metrics.connections.totalConnections}`,
          '',
          `# HELP database_uptime_seconds Service uptime in seconds`,
          `# TYPE database_uptime_seconds counter`,
          `database_uptime_seconds ${metrics.service.uptime / 1000}`,
          '',
          `# HELP database_health Healthy status of the database (1 for healthy, 0 for unhealthy)`,
          `# TYPE database_health gauge`,
          `database_health ${metrics.service.healthyConnections > 0 ? 1 : 0}`,
        ].join('\n')

        return c.text(prometheusMetrics, 200, {
          'Content-Type': 'text/plain; version=0.0.4',
        })
      }

      await next()
    }
  }
}
