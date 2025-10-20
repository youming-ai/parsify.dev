import { D1Database } from '@cloudflare/workers-types'
import { DatabaseConnection, createDatabaseConnection } from './connection'

export interface ConnectionPoolConfig {
  // Pool sizing
  minConnections?: number
  maxConnections?: number
  connectionIncrement?: number
  decrementThreshold?: number
  decrementDelay?: number

  // Connection lifecycle
  connectionTimeoutMs?: number
  idleTimeoutMs?: number
  maxLifetimeMs?: number
  healthCheckIntervalMs?: number
  healthCheckTimeoutMs?: number

  // Auto-scaling
  enableAutoScaling?: boolean
  scaleUpThreshold?: number
  scaleDownThreshold?: number
  scaleUpCooldown?: number
  scaleDownCooldown?: number

  // Performance tuning
  acquireTimeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  backoffMultiplier?: number

  // Monitoring
  enableMetrics?: boolean
  enableDetailedMetrics?: boolean
  metricsRetentionPeriod?: number

  // Pool management
  validationQuery?: string
  testOnBorrow?: boolean
  testOnReturn?: boolean
  testWhileIdle?: boolean

  // Environment-specific optimization
  environment?: 'development' | 'staging' | 'production'
  optimizeForCloudflareWorkers?: boolean
}

export interface ConnectionMetrics {
  created: number
  lastUsed: number
  lastValidated: number
  totalUsage: number
  errorCount: number
  isHealthy: boolean
  isValid: boolean
  isActive: boolean
  isIdle: boolean
  lifetimeMs: number
}

export interface PoolMetrics {
  pool: {
    totalConnections: number
    activeConnections: number
    idleConnections: number
    creatingConnections: number
    destroyingConnections: number
  }
  performance: {
    acquisitionWaitTime: number
    averageQueryTime: number
    totalQueries: number
    successfulQueries: number
    failedQueries: number
    connectionErrors: number
  }
  lifecycle: {
    connectionsCreated: number
    connectionsDestroyed: number
    validationsPerformed: number
    validationFailures: number
    timeouts: number
  }
  scaling: {
    lastScaleUp: number
    lastScaleDown: number
    totalScaleUps: number
    totalScaleDowns: number
    currentScale: number
  }
  health: {
    lastHealthCheck: number
    consecutiveHealthChecks: number
    healthCheckFailures: number
    overallHealth: 'healthy' | 'degraded' | 'unhealthy'
  }
}

export interface PoolStatistics {
  createdAt: number
  uptime: number
  totalAcquisitions: number
  totalReleases: number
  peakConnections: number
  averageConnections: number
  minIdleTime: number
  maxIdleTime: number
  averageIdleTime: number
}

/**
 * Enhanced connection pool with auto-scaling and lifecycle management
 */
export class EnhancedConnectionPool {
  private db: D1Database
  private config: Required<ConnectionPoolConfig>
  private connections: Map<string, DatabaseConnection> = new Map()
  private connectionMetrics: Map<string, ConnectionMetrics> = new Map()
  private poolMetrics: PoolMetrics
  private statistics: PoolStatistics
  private createdAt: number
  private lastScaleUp: number = 0
  private lastScaleDown: number = 0
  private lastHealthCheck: number = 0
  private healthCheckTimer?: ReturnType<typeof setInterval>
  private maintenanceTimer?: ReturnType<typeof setInterval>
  private metricsHistory: Array<{ timestamp: number; metrics: PoolMetrics }> = []
  private isShuttingDown: boolean = false

  constructor(db: D1Database, config: ConnectionPoolConfig = {}) {
    this.db = db
    this.config = this.mergeConfig(config)
    this.createdAt = Date.now()

    this.poolMetrics = {
      pool: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        creatingConnections: 0,
        destroyingConnections: 0
      },
      performance: {
        acquisitionWaitTime: 0,
        averageQueryTime: 0,
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        connectionErrors: 0
      },
      lifecycle: {
        connectionsCreated: 0,
        connectionsDestroyed: 0,
        validationsPerformed: 0,
        validationFailures: 0,
        timeouts: 0
      },
      scaling: {
        lastScaleUp: 0,
        lastScaleDown: 0,
        totalScaleUps: 0,
        totalScaleDowns: 0,
        currentScale: 0
      },
      health: {
        lastHealthCheck: 0,
        consecutiveHealthChecks: 0,
        healthCheckFailures: 0,
        overallHealth: 'healthy'
      }
    }

    this.statistics = {
      createdAt: this.createdAt,
      uptime: 0,
      totalAcquisitions: 0,
      totalReleases: 0,
      peakConnections: 0,
      averageConnections: 0,
      minIdleTime: 0,
      maxIdleTime: 0,
      averageIdleTime: 0
    }

    // Initialize minimum connections
    this.initializePool()
    this.startMaintenanceTasks()
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<DatabaseConnection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down')
    }

    const startTime = Date.now()
    this.statistics.totalAcquisitions++

    try {
      // Try to get an existing idle connection
      const connection = await this.getIdleConnection()

      if (connection) {
        const waitTime = Date.now() - startTime
        this.updateAcquisitionMetrics(waitTime, true)
        return connection
      }

      // Try to create a new connection if under max limit
      if (this.connections.size < this.config.maxConnections) {
        const newConnection = await this.createConnection()
        const waitTime = Date.now() - startTime
        this.updateAcquisitionMetrics(waitTime, true)
        return newConnection
      }

      // Wait for a connection to become available
      const waitedConnection = await this.waitForConnection()
      const waitTime = Date.now() - startTime
      this.updateAcquisitionMetrics(waitTime, false)
      return waitedConnection

    } catch (error) {
      const waitTime = Date.now() - startTime
      this.poolMetrics.performance.connectionErrors++
      throw new Error(`Failed to acquire connection: ${(error as Error).message}`)
    }
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: DatabaseConnection): Promise<void> {
    if (this.isShuttingDown) {
      await this.destroyConnection(connection)
      return
    }

    const connectionId = this.getConnectionId(connection)
    const metrics = this.connectionMetrics.get(connectionId)

    if (!metrics) {
      // Unknown connection, destroy it
      await this.destroyConnection(connection)
      return
    }

    this.statistics.totalReleases++
    metrics.lastUsed = Date.now()
    metrics.isActive = false
    metrics.isIdle = true

    this.poolMetrics.pool.activeConnections--
    this.poolMetrics.pool.idleConnections++

    // Perform post-release validation if configured
    if (this.config.testOnReturn) {
      await this.validateConnection(connection)
    }
  }

  /**
   * Execute a query using the pool
   */
  async execute<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T> {
    const startTime = Date.now()
    let connection: DatabaseConnection | null = null

    try {
      connection = await this.acquire()

      const result = await connection.execute(sql, params, options)

      if (!result.success) {
        throw new Error(result.error || 'Query failed')
      }

      const executionTime = Date.now() - startTime
      this.updatePerformanceMetrics(executionTime, true)

      return result.data as T

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.updatePerformanceMetrics(executionTime, false)
      throw error

    } finally {
      if (connection) {
        await this.release(connection)
      }
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    return { ...this.poolMetrics }
  }

  /**
   * Get pool statistics
   */
  getStatistics(): PoolStatistics {
    return {
      ...this.statistics,
      uptime: Date.now() - this.statistics.createdAt,
      averageConnections: this.calculateAverageConnections()
    }
  }

  /**
   * Perform health check on all connections
   */
  async performHealthCheck(): Promise<boolean> {
    const startTime = Date.now()
    let healthyConnections = 0

    for (const [connectionId, connection] of this.connections) {
      try {
        const isHealthy = await this.checkConnectionHealth(connection)
        const metrics = this.connectionMetrics.get(connectionId)!

        metrics.lastValidated = Date.now()
        metrics.isHealthy = isHealthy
        metrics.isValid = true

        if (isHealthy) {
          healthyConnections++
        } else {
          // Mark for removal
          await this.destroyConnection(connection)
        }

      } catch (error) {
        const metrics = this.connectionMetrics.get(connectionId)!
        metrics.isHealthy = false
        metrics.isValid = false
        metrics.errorCount++
      }
    }

    const healthRatio = healthyConnections / this.connections.size
    this.updateHealthMetrics(healthRatio, Date.now() - startTime)

    return healthRatio >= 0.8 // 80% of connections should be healthy
  }

  /**
   * Scale the pool based on current load
   */
  async scalePool(): Promise<void> {
    if (!this.config.enableAutoScaling || this.isShuttingDown) {
      return
    }

    const utilization = this.poolMetrics.pool.activeConnections / this.poolMetrics.pool.totalConnections
    const now = Date.now()

    // Scale up if needed
    if (utilization > this.config.scaleUpThreshold &&
        this.connections.size < this.config.maxConnections &&
        now - this.lastScaleUp > this.config.scaleUpCooldown) {

      await this.scaleUp()
      return
    }

    // Scale down if needed
    if (utilization < this.config.scaleDownThreshold &&
        this.connections.size > this.config.minConnections &&
        now - this.lastScaleDown > this.config.scaleDownCooldown) {

      await this.scaleDown()
    }
  }

  /**
   * Close the pool and all connections
   */
  async close(): Promise<void> {
    this.isShuttingDown = true

    // Stop timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
    if (this.maintenanceTimer) {
      clearInterval(this.maintenanceTimer)
    }

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(
      connection => this.destroyConnection(connection)
    )

    await Promise.all(closePromises)
    this.connections.clear()
    this.connectionMetrics.clear()
  }

  // Private methods
  private mergeConfig(config: ConnectionPoolConfig): Required<ConnectionPoolConfig> {
    const defaultConfig: Required<ConnectionPoolConfig> = {
      // Pool sizing
      minConnections: 2,
      maxConnections: 10,
      connectionIncrement: 2,
      decrementThreshold: 0.3,
      decrementDelay: 300000, // 5 minutes

      // Connection lifecycle
      connectionTimeoutMs: 30000,
      idleTimeoutMs: 600000, // 10 minutes
      maxLifetimeMs: 3600000, // 1 hour
      healthCheckIntervalMs: 60000, // 1 minute
      healthCheckTimeoutMs: 5000,

      // Auto-scaling
      enableAutoScaling: true,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.2,
      scaleUpCooldown: 60000, // 1 minute
      scaleDownCooldown: 300000, // 5 minutes

      // Performance tuning
      acquireTimeoutMs: 10000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,

      // Monitoring
      enableMetrics: true,
      enableDetailedMetrics: true,
      metricsRetentionPeriod: 3600000, // 1 hour

      // Pool management
      validationQuery: 'SELECT 1',
      testOnBorrow: true,
      testOnReturn: false,
      testWhileIdle: true,

      // Environment-specific optimization
      environment: 'production',
      optimizeForCloudflareWorkers: true
    }

    // Apply environment-specific optimizations
    if (config.optimizeForCloudflareWorkers || config.environment === 'production') {
      // Cloudflare Workers have specific limitations
      defaultConfig.maxConnections = Math.min(defaultConfig.maxConnections, 10)
      defaultConfig.connectionTimeoutMs = Math.min(defaultConfig.connectionTimeoutMs, 25000)
      defaultConfig.enableAutoScaling = true
    }

    return { ...defaultConfig, ...config }
  }

  private async initializePool(): Promise<void> {
    const promises = []
    for (let i = 0; i < this.config.minConnections; i++) {
      promises.push(this.createConnection())
    }
    await Promise.all(promises)
  }

  private async createConnection(): Promise<DatabaseConnection> {
    const connectionId = crypto.randomUUID()
    const connection = createDatabaseConnection(this.db, {
      maxConnections: 1, // Each connection is independent in the pool
      connectionTimeoutMs: this.config.connectionTimeoutMs,
      retryAttempts: this.config.retryAttempts,
      retryDelayMs: this.config.retryDelayMs,
      enableMetrics: this.config.enableDetailedMetrics
    })

    this.connections.set(connectionId, connection)
    this.connectionMetrics.set(connectionId, {
      created: Date.now(),
      lastUsed: Date.now(),
      lastValidated: Date.now(),
      totalUsage: 0,
      errorCount: 0,
      isHealthy: true,
      isValid: true,
      isActive: false,
      isIdle: true,
      lifetimeMs: 0
    })

    this.poolMetrics.pool.totalConnections++
    this.poolMetrics.pool.idleConnections++
    this.poolMetrics.lifecycle.connectionsCreated++

    return connection
  }

  private async destroyConnection(connection: DatabaseConnection): Promise<void> {
    const connectionId = this.getConnectionId(connection)
    const metrics = this.connectionMetrics.get(connectionId)

    if (metrics) {
      metrics.lifetimeMs = Date.now() - metrics.created
      metrics.isActive = false
      metrics.isIdle = false
    }

    connection.close()
    this.connections.delete(connectionId)
    this.connectionMetrics.delete(connectionId)

    this.poolMetrics.pool.totalConnections--
    if (metrics?.isActive) {
      this.poolMetrics.pool.activeConnections--
    } else if (metrics?.isIdle) {
      this.poolMetrics.pool.idleConnections--
    }
    this.poolMetrics.lifecycle.connectionsDestroyed++
  }

  private async getIdleConnection(): Promise<DatabaseConnection | null> {
    for (const [connectionId, connection] of this.connections) {
      const metrics = this.connectionMetrics.get(connectionId)!

      if (metrics.isIdle && metrics.isHealthy && metrics.isValid) {
        // Check if connection has expired
        if (this.isConnectionExpired(metrics)) {
          await this.destroyConnection(connection)
          continue
        }

        // Validate connection if configured
        if (this.config.testOnBorrow) {
          const isValid = await this.validateConnection(connection)
          if (!isValid) {
            await this.destroyConnection(connection)
            continue
          }
        }

        // Mark as active
        metrics.isActive = true
        metrics.isIdle = false
        metrics.totalUsage++

        this.poolMetrics.pool.idleConnections--
        this.poolMetrics.pool.activeConnections++

        return connection
      }
    }

    return null
  }

  private async waitForConnection(): Promise<DatabaseConnection> {
    const startTime = Date.now()
    const timeout = this.config.acquireTimeoutMs

    while (Date.now() - startTime < timeout) {
      const connection = await this.getIdleConnection()
      if (connection) {
        return connection
      }

      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error('Connection acquire timeout')
  }

  private async validateConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      const metrics = this.connectionMetrics.get(this.getConnectionId(connection))!
      metrics.lastValidated = Date.now()
      this.poolMetrics.lifecycle.validationsPerformed++

      const result = await connection.execute(this.config.validationQuery)

      if (!result.success) {
        this.poolMetrics.lifecycle.validationFailures++
        metrics.isHealthy = false
        metrics.isValid = false
        return false
      }

      return true

    } catch (error) {
      this.poolMetrics.lifecycle.validationFailures++
      return false
    }
  }

  private async checkConnectionHealth(connection: DatabaseConnection): Promise<boolean> {
    try {
      const result = await connection.execute(this.config.validationQuery)
      return result.success
    } catch (error) {
      return false
    }
  }

  private isConnectionExpired(metrics: ConnectionMetrics): boolean {
    const now = Date.now()
    const age = now - metrics.created
    const idleTime = now - metrics.lastUsed

    return age > this.config.maxLifetimeMs || idleTime > this.config.idleTimeoutMs
  }

  private getConnectionId(connection: DatabaseConnection): string {
    // This is a simplified approach - in practice, you'd need a way to track connection IDs
    for (const [id, conn] of this.connections) {
      if (conn === connection) {
        return id
      }
    }
    throw new Error('Connection not found in pool')
  }

  private async scaleUp(): Promise<void> {
    const increment = Math.min(
      this.config.connectionIncrement,
      this.config.maxConnections - this.connections.size
    )

    if (increment <= 0) return

    const promises = []
    for (let i = 0; i < increment; i++) {
      promises.push(this.createConnection())
    }
    await Promise.all(promises)

    this.lastScaleUp = Date.now()
    this.poolMetrics.scaling.lastScaleUp = this.lastScaleUp
    this.poolMetrics.scaling.totalScaleUps++
    this.poolMetrics.scaling.currentScale = this.connections.size

    console.log(`Connection pool scaled up to ${this.connections.size} connections`)
  }

  private async scaleDown(): Promise<void> {
    const idleConnections = Array.from(this.connections.entries())
      .filter(([_, __]) => {
        const metrics = this.connectionMetrics.get(_)
        return metrics?.isIdle && !metrics?.isActive
      })
      .sort((a, b) => {
        const metricsA = this.connectionMetrics.get(a[0])!
        const metricsB = this.connectionMetrics.get(b[0])!
        return metricsA.lastUsed - metricsB.lastUsed // Remove oldest first
      })

    const toRemove = Math.min(
      this.config.connectionIncrement,
      idleConnections.length,
      this.connections.size - this.config.minConnections
    )

    if (toRemove <= 0) return

    const promises = []
    for (let i = 0; i < toRemove; i++) {
      const [connectionId, connection] = idleConnections[i]
      promises.push(this.destroyConnection(connection))
    }
    await Promise.all(promises)

    this.lastScaleDown = Date.now()
    this.poolMetrics.scaling.lastScaleDown = this.lastScaleDown
    this.poolMetrics.scaling.totalScaleDowns++
    this.poolMetrics.scaling.currentScale = this.connections.size

    console.log(`Connection pool scaled down to ${this.connections.size} connections`)
  }

  private updateAcquisitionMetrics(waitTime: number, success: boolean): void {
    this.poolMetrics.performance.acquisitionWaitTime =
      (this.poolMetrics.performance.acquisitionWaitTime + waitTime) / 2

    if (!success) {
      this.poolMetrics.lifecycle.timeouts++
    }
  }

  private updatePerformanceMetrics(executionTime: number, success: boolean): void {
    this.poolMetrics.performance.totalQueries++

    if (success) {
      this.poolMetrics.performance.successfulQueries++
    } else {
      this.poolMetrics.performance.failedQueries++
    }

    this.poolMetrics.performance.averageQueryTime =
      (this.poolMetrics.performance.averageQueryTime + executionTime) / 2
  }

  private updateHealthMetrics(healthRatio: number, checkTime: number): void {
    this.lastHealthCheck = Date.now()
    this.poolMetrics.health.lastHealthCheck = this.lastHealthCheck

    if (healthRatio >= 0.9) {
      this.poolMetrics.health.overallHealth = 'healthy'
      this.poolMetrics.health.consecutiveHealthChecks++
      this.poolMetrics.health.healthCheckFailures = 0
    } else if (healthRatio >= 0.7) {
      this.poolMetrics.health.overallHealth = 'degraded'
      this.poolMetrics.health.healthCheckFailures++
    } else {
      this.poolMetrics.health.overallHealth = 'unhealthy'
      this.poolMetrics.health.healthCheckFailures++
      this.poolMetrics.health.consecutiveHealthChecks = 0
    }
  }

  private calculateAverageConnections(): number {
    if (this.metricsHistory.length === 0) return this.connections.size

    const total = this.metricsHistory.reduce(
      (sum, entry) => sum + entry.metrics.pool.totalConnections,
      0
    )
    return total / this.metricsHistory.length
  }

  private startMaintenanceTasks(): void {
    // Start health check timer
    if (this.config.healthCheckIntervalMs > 0) {
      this.healthCheckTimer = setInterval(async () => {
        try {
          await this.performHealthCheck()
        } catch (error) {
          console.error('Health check failed:', error)
        }
      }, this.config.healthCheckIntervalMs)
    }

    // Start maintenance timer for cleanup and scaling
    this.maintenanceTimer = setInterval(async () => {
      try {
        await this.performMaintenance()
      } catch (error) {
        console.error('Maintenance failed:', error)
      }
    }, 60000) // Every minute
  }

  private async performMaintenance(): Promise<void> {
    // Remove expired connections
    for (const [connectionId, connection] of this.connections) {
      const metrics = this.connectionMetrics.get(connectionId)!
      if (this.isConnectionExpired(metrics) && metrics.isIdle) {
        await this.destroyConnection(connection)
      }
    }

    // Scale pool if needed
    await this.scalePool()

    // Update statistics
    this.statistics.peakConnections = Math.max(
      this.statistics.peakConnections,
      this.connections.size
    )

    // Store metrics history
    if (this.config.enableDetailedMetrics) {
      this.metricsHistory.push({
        timestamp: Date.now(),
        metrics: { ...this.poolMetrics }
      })

      // Keep only recent history
      const cutoff = Date.now() - this.config.metricsRetentionPeriod
      this.metricsHistory = this.metricsHistory.filter(
        entry => entry.timestamp > cutoff
      )
    }
  }
}

/**
 * Factory function to create enhanced connection pool
 */
export function createEnhancedConnectionPool(
  db: D1Database,
  config?: ConnectionPoolConfig
): EnhancedConnectionPool {
  return new EnhancedConnectionPool(db, config)
}
