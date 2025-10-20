import { DatabaseService, DatabaseServiceMetrics, HealthCheckResult } from './service'

export interface HealthCheckConfig {
  enabled: boolean
  intervalMs: number
  timeoutMs: number
  failureThreshold: number
  successThreshold: number
  alertThresholds: {
    queryTime: number
    errorRate: number
    connectionPoolUtilization: number
  }
}

export interface HealthStatus {
  healthy: boolean
  lastCheck: number
  consecutiveFailures: number
  consecutiveSuccesses: number
  uptime: number
  responseTime: number
  error?: string
}

export interface HealthAlert {
  type: 'slow_query' | 'high_error_rate' | 'connection_pool_exhausted' | 'database_unavailable'
  severity: 'warning' | 'error' | 'critical'
  message: string
  timestamp: number
  metrics?: Partial<DatabaseServiceMetrics>
}

export interface HealthReport {
  status: HealthStatus
  metrics: DatabaseServiceMetrics
  alerts: HealthAlert[]
  recommendations: string[]
}

/**
 * Database health monitoring system
 */
export class DatabaseHealthMonitor {
  private databaseService: DatabaseService
  private config: Required<HealthCheckConfig>
  private status: HealthStatus
  private alerts: HealthAlert[] = []
  private checkTimer?: ReturnType<typeof setInterval>
  private startTime: number

  constructor(databaseService: DatabaseService, config: Partial<HealthCheckConfig> = {}) {
    this.databaseService = databaseService
    this.config = {
      enabled: config.enabled ?? true,
      intervalMs: config.intervalMs ?? 30000, // 30 seconds
      timeoutMs: config.timeoutMs ?? 5000, // 5 seconds
      failureThreshold: config.failureThreshold ?? 3,
      successThreshold: config.successThreshold ?? 2,
      alertThresholds: {
        queryTime: config.alertThresholds?.queryTime ?? 1000, // 1 second
        errorRate: config.alertThresholds?.errorRate ?? 0.05, // 5%
        connectionPoolUtilization: config.alertThresholds?.connectionPoolUtilization ?? 0.9 // 90%
      }
    }

    this.startTime = Date.now()
    this.status = {
      healthy: true,
      lastCheck: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      uptime: 0,
      responseTime: 0
    }

    if (this.config.enabled) {
      this.startMonitoring()
    }
  }

  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    if (this.checkTimer) {
      this.stopMonitoring()
    }

    this.checkTimer = setInterval(async () => {
      await this.performHealthCheck()
    }, this.config.intervalMs)

    // Perform initial check
    this.performHealthCheck()
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = undefined
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.status }
  }

  /**
   * Get health report with metrics and alerts
   */
  async getHealthReport(): Promise<HealthReport> {
    const metrics = this.databaseService.getMetrics()
    const recommendations = this.generateRecommendations(metrics)

    return {
      status: this.getHealthStatus(),
      metrics,
      alerts: [...this.alerts],
      recommendations
    }
  }

  /**
   * Perform manual health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const result = await Promise.race([
        this.databaseService.healthCheck(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeoutMs)
        )
      ]) as HealthCheckResult

      const responseTime = Date.now() - startTime
      this.updateStatus(true, responseTime)

      // Check for performance issues
      await this.checkPerformanceMetrics(responseTime)

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.updateStatus(false, responseTime, (error as Error).message)

      return {
        healthy: false,
        responseTime,
        error: (error as Error).message,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = []
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 50): HealthAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Add custom alert
   */
  addAlert(alert: Omit<HealthAlert, 'timestamp'>): void {
    const fullAlert: HealthAlert = {
      ...alert,
      timestamp: Date.now()
    }

    this.alerts.push(fullAlert)

    // Keep only recent alerts (last 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500)
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('CRITICAL DATABASE ALERT:', alert.message)
    } else if (alert.severity === 'error') {
      console.error('DATABASE ERROR:', alert.message)
    } else {
      console.warn('DATABASE WARNING:', alert.message)
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config }

    if (this.config.enabled && !this.checkTimer) {
      this.startMonitoring()
    } else if (!this.config.enabled && this.checkTimer) {
      this.stopMonitoring()
    }
  }

  // Private methods
  private updateStatus(healthy: boolean, responseTime: number, error?: string): void {
    const now = Date.now()
    const uptime = now - this.startTime

    if (healthy) {
      this.status = {
        healthy: true,
        lastCheck: now,
        consecutiveFailures: 0,
        consecutiveSuccesses: this.status.consecutiveSuccesses + 1,
        uptime,
        responseTime
      }
    } else {
      this.status = {
        healthy: this.status.consecutiveFailures < this.config.failureThreshold,
        lastCheck: now,
        consecutiveFailures: this.status.consecutiveFailures + 1,
        consecutiveSuccesses: 0,
        uptime,
        responseTime,
        error
      }

      // Add alert if threshold exceeded
      if (this.status.consecutiveFailures >= this.config.failureThreshold) {
        this.addAlert({
          type: 'database_unavailable',
          severity: 'critical',
          message: `Database health check failed ${this.status.consecutiveFailures} times consecutively`,
          metrics: this.databaseService.getMetrics()
        })
      }
    }
  }

  private async checkPerformanceMetrics(responseTime: number): Promise<void> {
    const metrics = this.databaseService.getMetrics()

    // Check slow queries
    if (responseTime > this.config.alertThresholds.queryTime) {
      this.addAlert({
        type: 'slow_query',
        severity: 'warning',
        message: `Health check took ${responseTime}ms (threshold: ${this.config.alertThresholds.queryTime}ms)`
      })
    }

    // Check average query time
    if (metrics.queries.averageQueryTime > this.config.alertThresholds.queryTime) {
      this.addAlert({
        type: 'slow_query',
        severity: 'warning',
        message: `Average query time is ${metrics.queries.averageQueryTime}ms (threshold: ${this.config.alertThresholds.queryTime}ms)`,
        metrics
      })
    }

    // Check error rate
    const totalQueries = metrics.queries.totalQueries
    if (totalQueries > 0) {
      const errorRate = metrics.queries.failedQueries / totalQueries
      if (errorRate > this.config.alertThresholds.errorRate) {
        this.addAlert({
          type: 'high_error_rate',
          severity: 'error',
          message: `Database error rate is ${(errorRate * 100).toFixed(2)}% (threshold: ${(this.config.alertThresholds.errorRate * 100).toFixed(2)}%)`,
          metrics
        })
      }
    }

    // Check connection pool utilization
    const poolUtilization = metrics.connections.activeConnections / metrics.connections.totalConnections
    if (poolUtilization > this.config.alertThresholds.connectionPoolUtilization) {
      this.addAlert({
        type: 'connection_pool_exhausted',
        severity: 'warning',
        message: `Connection pool utilization is ${(poolUtilization * 100).toFixed(2)}% (threshold: ${(this.config.alertThresholds.connectionPoolUtilization * 100).toFixed(2)}%)`,
        metrics
      })
    }
  }

  private generateRecommendations(metrics: DatabaseServiceMetrics): string[] {
    const recommendations: string[] = []

    // Query performance recommendations
    if (metrics.queries.averageQueryTime > 500) {
      recommendations.push('Consider optimizing slow queries or adding database indexes')
    }

    // Error rate recommendations
    if (metrics.queries.totalQueries > 0) {
      const errorRate = metrics.queries.failedQueries / metrics.queries.totalQueries
      if (errorRate > 0.01) {
        recommendations.push('High error rate detected - check application logs for database errors')
      }
    }

    // Connection pool recommendations
    if (metrics.connections.totalConnections > 0) {
      const poolUtilization = metrics.connections.activeConnections / metrics.connections.totalConnections
      if (poolUtilization > 0.8) {
        recommendations.push('Consider increasing database connection pool size')
      }
    }

    // Cache efficiency recommendations
    if (metrics.queries.totalQueries > 100 && metrics.queries.cachedQueries === 0) {
      recommendations.push('Consider enabling query cache to improve performance')
    }

    // Health status recommendations
    if (!this.status.healthy) {
      recommendations.push('Database health checks are failing - investigate database connectivity and performance')
    }

    return recommendations
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring()
    this.clearAlerts()
  }
}

/**
 * Factory function to create database health monitor
 */
export function createDatabaseHealthMonitor(
  databaseService: DatabaseService,
  config?: Partial<HealthCheckConfig>
): DatabaseHealthMonitor {
  return new DatabaseHealthMonitor(databaseService, config)
}

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  enabled: true,
  intervalMs: 30000,
  timeoutMs: 5000,
  failureThreshold: 3,
  successThreshold: 2,
  alertThresholds: {
    queryTime: 1000,
    errorRate: 0.05,
    connectionPoolUtilization: 0.9
  }
}
