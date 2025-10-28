/**
 * 连接池健康检查器
 * 监控连接池状态，提供详细的健康报告和预警
 */

import { logger } from '@shared/utils'

interface ConnectionHealth {
  connectionId: string
  createdAt: number
  lastUsedAt: number
  queryCount: number
  errorCount: number
  averageResponseTime: number
  status: 'healthy' | 'degraded' | 'unhealthy' | 'idle'
  lastError?: Error
  age: number
}

interface PoolHealthMetrics {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  unhealthyConnections: number
  averageAge: number
  averageResponseTime: number
  totalQueries: number
  totalErrors: number
  errorRate: number
  throughput: number // queries per second
}

interface HealthCheckOptions {
  intervalMs: number
  maxIdleTime: number
  maxAge: number
  maxErrorRate: number
  maxResponseTime: number
  unhealthyThreshold: number
}

export class PoolHealthChecker {
  private connectionHealth: Map<string, ConnectionHealth> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private lastHealthCheck = 0
  private isRunning = false

  constructor(
    _pool: any, // Database connection pool
    private options: HealthCheckOptions = {
      intervalMs: 30000, // 30 seconds
      maxIdleTime: 300000, // 5 minutes
      maxAge: 1800000, // 30 minutes
      maxErrorRate: 0.1, // 10%
      maxResponseTime: 5000, // 5 seconds
      unhealthyThreshold: 3, // consecutive failures
    }
  ) {}

  start(): void {
    if (this.isRunning) {
      logger.warn('Health checker already running')
      return
    }

    this.isRunning = true
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.options.intervalMs)

    logger.info('Pool health checker started', {
      interval: this.options.intervalMs,
      options: this.options,
    })
  }

  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }

    logger.info('Pool health checker stopped')
  }

  // Register a new connection
  registerConnection(connectionId: string): void {
    const health: ConnectionHealth = {
      connectionId,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      queryCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      status: 'healthy',
      age: 0,
    }

    this.connectionHealth.set(connectionId, health)

    logger.debug('Connection registered for health monitoring', {
      connectionId,
    })
  }

  // Record connection usage
  recordUsage(connectionId: string, responseTime: number, error?: Error): void {
    const health = this.connectionHealth.get(connectionId)
    if (!health) {
      // Connection not tracked, create new entry
      this.registerConnection(connectionId)
      return this.recordUsage(connectionId, responseTime, error)
    }

    health.lastUsedAt = Date.now()
    health.queryCount++

    if (error) {
      health.errorCount++
      health.lastError = error
    }

    // Update average response time
    health.averageResponseTime =
      (health.averageResponseTime * (health.queryCount - 1) + responseTime) / health.queryCount

    health.age = Date.now() - health.createdAt

    // Update connection status
    this.updateConnectionStatus(health)
  }

  // Remove connection from monitoring
  removeConnection(connectionId: string): void {
    this.connectionHealth.delete(connectionId)

    logger.debug('Connection removed from health monitoring', {
      connectionId,
    })
  }

  private updateConnectionStatus(health: ConnectionHealth): void {
    const now = Date.now()
    const idleTime = now - health.lastUsedAt

    // Check for various health conditions
    if (health.errorCount > 0) {
      const errorRate = health.errorCount / health.queryCount
      if (errorRate > this.options.maxErrorRate) {
        health.status = 'unhealthy'
        return
      }
    }

    if (health.averageResponseTime > this.options.maxResponseTime) {
      health.status = 'degraded'
      return
    }

    if (idleTime > this.options.maxIdleTime) {
      health.status = 'idle'
      return
    }

    if (health.age > this.options.maxAge) {
      health.status = 'degraded'
      return
    }

    health.status = 'healthy'
  }

  private async performHealthCheck(): Promise<void> {
    try {
      this.lastHealthCheck = Date.now()

      // Update status for all connections
      for (const health of this.connectionHealth.values()) {
        this.updateConnectionStatus(health)
      }

      const metrics = this.calculateMetrics()

      // Log health status
      this.logHealthStatus(metrics)

      // Perform cleanup actions
      await this.performCleanupActions(metrics)

      // Check for alerts
      this.checkForAlerts(metrics)
    } catch (error) {
      logger.error('Health check failed', error as Error)
    }
  }

  private calculateMetrics(): PoolHealthMetrics {
    const connections = Array.from(this.connectionHealth.values())

    const totalConnections = connections.length
    const activeConnections = connections.filter(c => c.status === 'healthy').length
    const idleConnections = connections.filter(c => c.status === 'idle').length
    const unhealthyConnections = connections.filter(c => c.status === 'unhealthy').length

    const totalQueries = connections.reduce((sum, c) => sum + c.queryCount, 0)
    const totalErrors = connections.reduce((sum, c) => sum + c.errorCount, 0)
    const errorRate = totalQueries > 0 ? totalErrors / totalQueries : 0

    const averageAge =
      connections.length > 0
        ? connections.reduce((sum, c) => sum + c.age, 0) / connections.length
        : 0

    const averageResponseTime =
      connections.length > 0
        ? connections.reduce((sum, c) => sum + c.averageResponseTime, 0) / connections.length
        : 0

    // Calculate throughput (queries per second over the last minute)
    const oneMinuteAgo = Date.now() - 60000
    const recentQueries = connections
      .filter(c => c.lastUsedAt > oneMinuteAgo)
      .reduce((sum, c) => sum + c.queryCount, 0)

    const throughput = recentQueries / 60 // queries per second

    return {
      totalConnections,
      activeConnections,
      idleConnections,
      unhealthyConnections,
      averageAge,
      averageResponseTime,
      totalQueries,
      totalErrors,
      errorRate,
      throughput,
    }
  }

  private logHealthStatus(metrics: PoolHealthMetrics): void {
    const healthLevel = this.determineHealthLevel(metrics)

    logger.info('Pool health status', {
      level: healthLevel,
      ...metrics,
      unhealthyConnections: metrics.unhealthyConnections,
      timestamp: new Date().toISOString(),
    })
  }

  private determineHealthLevel(metrics: PoolHealthMetrics): 'healthy' | 'degraded' | 'unhealthy' {
    if (metrics.unhealthyConnections > 0 || metrics.errorRate > 0.1) {
      return 'unhealthy'
    }

    if (
      metrics.averageResponseTime > 2000 ||
      metrics.idleConnections > metrics.totalConnections * 0.7
    ) {
      return 'degraded'
    }

    return 'healthy'
  }

  private async performCleanupActions(_metrics: PoolHealthMetrics): Promise<void> {
    const cleanupTasks: Promise<void>[] = []

    // Close unhealthy connections
    const unhealthyConnections = Array.from(this.connectionHealth.entries())
      .filter(([_, health]) => health.status === 'unhealthy')
      .map(([connectionId]) => connectionId)

    if (unhealthyConnections.length > 0) {
      logger.warn('Closing unhealthy connections', {
        count: unhealthyConnections.length,
        connections: unhealthyConnections,
      })

      cleanupTasks.push(this.closeConnections(unhealthyConnections))
    }

    // Close idle connections
    const idleConnections = Array.from(this.connectionHealth.entries())
      .filter(([_, health]) => health.status === 'idle')
      .map(([connectionId]) => connectionId)

    if (idleConnections.length > this.options.maxIdleTime) {
      logger.info('Closing idle connections', {
        count: idleConnections.length,
        connections: idleConnections,
      })

      cleanupTasks.push(this.closeConnections(idleConnections))
    }

    await Promise.allSettled(cleanupTasks)
  }

  private async closeConnections(connectionIds: string[]): Promise<void> {
    // This would integrate with the actual connection pool
    // For now, we'll just remove them from health monitoring
    connectionIds.forEach(id => this.removeConnection(id))
  }

  private checkForAlerts(metrics: PoolHealthMetrics): void {
    const alerts: string[] = []

    // High error rate alert
    if (metrics.errorRate > 0.05) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`)
    }

    // Low throughput alert
    if (metrics.throughput < 1 && metrics.totalConnections > 0) {
      alerts.push(`Low throughput: ${metrics.throughput.toFixed(2)} queries/sec`)
    }

    // Many unhealthy connections alert
    if (metrics.unhealthyConnections > metrics.totalConnections * 0.2) {
      alerts.push(
        `Many unhealthy connections: ${metrics.unhealthyConnections}/${metrics.totalConnections}`
      )
    }

    // High response time alert
    if (metrics.averageResponseTime > 3000) {
      alerts.push(`High response time: ${metrics.averageResponseTime.toFixed(0)}ms`)
    }

    if (alerts.length > 0) {
      logger.warn('Pool health alerts', {
        alerts,
        metrics,
      })
    }
  }

  // Get current health status
  getHealthStatus(): {
    isRunning: boolean
    lastHealthCheck: number
    metrics?: PoolHealthMetrics
    connections: ConnectionHealth[]
    alerts: string[]
  } {
    const metrics = this.connectionHealth.size > 0 ? this.calculateMetrics() : undefined
    const connections = Array.from(this.connectionHealth.values())

    const alerts: string[] = []
    if (metrics) {
      if (metrics.errorRate > 0.05) alerts.push('High error rate')
      if (metrics.unhealthyConnections > 0) alerts.push('Unhealthy connections')
      if (metrics.averageResponseTime > 3000) alerts.push('High response time')
    }

    return {
      isRunning: this.isRunning,
      lastHealthCheck: this.lastHealthCheck,
      metrics,
      connections,
      alerts,
    }
  }

  // Get detailed connection information
  getConnectionDetails(connectionId?: string): ConnectionHealth | ConnectionHealth[] {
    if (connectionId) {
      const health = this.connectionHealth.get(connectionId)
      if (!health) {
        throw new Error(`Connection ${connectionId} not found`)
      }
      return health
    }

    return Array.from(this.connectionHealth.values())
  }

  // Update health check options
  updateOptions(options: Partial<HealthCheckOptions>): void {
    this.options = { ...this.options, ...options }

    logger.info('Health checker options updated', {
      options: this.options,
    })

    // Restart health checker if running
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }
}

// Factory function
export function createPoolHealthChecker(
  pool: any,
  options?: Partial<HealthCheckOptions>
): PoolHealthChecker {
  const defaultOptions: HealthCheckOptions = {
    intervalMs: 30000,
    maxIdleTime: 300000,
    maxAge: 1800000,
    maxErrorRate: 0.1,
    maxResponseTime: 5000,
    unhealthyThreshold: 3,
  }

  return new PoolHealthChecker(pool, { ...defaultOptions, ...options })
}
