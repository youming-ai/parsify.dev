import { D1Database } from '@cloudflare/workers-types'
import { DatabaseConnection, createDatabaseConnection } from './connection'
import { EnhancedConnectionPool } from './pool'

export interface ConnectionLifecycleConfig {
  // Connection validation
  validationIntervalMs: number
  validationTimeoutMs: number
  validationQuery: string
  maxValidationFailures: number

  // Connection cleanup
  idleConnectionTimeoutMs: number
  maxConnectionLifetimeMs: number
  cleanupIntervalMs: number
  cleanupBatchSize: number

  // Connection recovery
  enableAutoRecovery: boolean
  recoveryAttempts: number
  recoveryDelayMs: number
  backoffMultiplier: number
  maxRecoveryDelayMs: number

  // Health monitoring
  healthCheckIntervalMs: number
  healthCheckTimeoutMs: number
  consecutiveFailureThreshold: number

  // Resource management
  memoryThresholdMB: number
  enableMemoryMonitoring: boolean
  resourceCheckIntervalMs: number

  // Graceful shutdown
  shutdownTimeoutMs: number
  gracefulShutdownEnabled: boolean
}

export interface ConnectionLifecycleEvent {
  type: 'connection_created' | 'connection_destroyed' | 'validation_failed' |
        'connection_recovered' | 'cleanup_completed' | 'health_check_failed' |
        'resource_threshold_exceeded' | 'shutdown_initiated'
  connectionId?: string
  timestamp: number
  details: any
}

export interface ConnectionHealthStatus {
  connectionId: string
  isHealthy: boolean
  lastValidation: number
  consecutiveFailures: number
  errorCount: number
  lastError?: string
  isValid: boolean
  isIdle: boolean
  isActive: boolean
  age: number
  usageCount: number
}

export interface LifecycleMetrics {
  lifecycle: {
    connectionsCreated: number
    connectionsDestroyed: number
    validationsPerformed: number
    validationFailures: number
    recoveriesAttempted: number
    recoveriesSuccessful: number
  }
  cleanup: {
    idleConnectionsRemoved: number
    expiredConnectionsRemoved: number
    unhealthyConnectionsRemoved: number
    lastCleanupTime: number
    totalCleanupTime: number
  }
  recovery: {
    activeRecoveries: number
    successfulRecoveries: number
    failedRecoveries: number
    averageRecoveryTime: number
  }
  health: {
    lastHealthCheck: number
    healthCheckDuration: number
    unhealthyConnections: number
    healthyConnections: number
  }
  resources: {
    currentMemoryUsage: number
    peakMemoryUsage: number
    memoryThresholdExceeded: number
    lastResourceCheck: number
  }
}

/**
 * Connection lifecycle manager for connection pool
 */
export class ConnectionLifecycleManager {
  private pool: EnhancedConnectionPool
  private db: D1Database
  private config: Required<ConnectionLifecycleConfig>
  private connectionHealth: Map<string, ConnectionHealthStatus> = new Map()
  private metrics: LifecycleMetrics
  private eventListeners: Map<string, Array<(event: ConnectionLifecycleEvent) => void>> = new Map()
  private activeRecoveries: Map<string, Promise<boolean>> = new Map()
  private timers: {
    validation?: ReturnType<typeof setInterval>
    cleanup?: ReturnType<typeof setInterval>
    healthCheck?: ReturnType<typeof setInterval>
    resourceCheck?: ReturnType<typeof setInterval>
  } = {}
  private isShuttingDown: boolean = false
  private startTime: number

  constructor(
    pool: EnhancedConnectionPool,
    db: D1Database,
    config: ConnectionLifecycleConfig = {}
  ) {
    this.pool = pool
    this.db = db
    this.config = this.mergeConfig(config)
    this.startTime = Date.now()

    this.metrics = {
      lifecycle: {
        connectionsCreated: 0,
        connectionsDestroyed: 0,
        validationsPerformed: 0,
        validationFailures: 0,
        recoveriesAttempted: 0,
        recoveriesSuccessful: 0
      },
      cleanup: {
        idleConnectionsRemoved: 0,
        expiredConnectionsRemoved: 0,
        unhealthyConnectionsRemoved: 0,
        lastCleanupTime: 0,
        totalCleanupTime: 0
      },
      recovery: {
        activeRecoveries: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        averageRecoveryTime: 0
      },
      health: {
        lastHealthCheck: 0,
        healthCheckDuration: 0,
        unhealthyConnections: 0,
        healthyConnections: 0
      },
      resources: {
        currentMemoryUsage: 0,
        peakMemoryUsage: 0,
        memoryThresholdExceeded: 0,
        lastResourceCheck: 0
      }
    }

    this.startLifecycleManagement()
  }

  /**
   * Register a new connection with the lifecycle manager
   */
  registerConnection(connectionId: string): void {
    if (this.isShuttingDown) return

    this.connectionHealth.set(connectionId, {
      connectionId,
      isHealthy: true,
      lastValidation: Date.now(),
      consecutiveFailures: 0,
      errorCount: 0,
      isValid: true,
      isIdle: true,
      isActive: false,
      age: 0,
      usageCount: 0
    })

    this.metrics.lifecycle.connectionsCreated++
    this.emitEvent({
      type: 'connection_created',
      connectionId,
      timestamp: Date.now(),
      details: { totalConnections: this.connectionHealth.size }
    })
  }

  /**
   * Unregister a connection from lifecycle management
   */
  unregisterConnection(connectionId: string): void {
    const health = this.connectionHealth.get(connectionId)
    if (health) {
      this.connectionHealth.delete(connectionId)
      this.metrics.lifecycle.connectionsDestroyed++

      this.emitEvent({
        type: 'connection_destroyed',
        connectionId,
        timestamp: Date.now(),
        details: {
          age: health.age,
          usageCount: health.usageCount,
          errorCount: health.errorCount
        }
      })
    }
  }

  /**
   * Update connection usage statistics
   */
  updateConnectionUsage(connectionId: string, isActive: boolean): void {
    const health = this.connectionHealth.get(connectionId)
    if (health) {
      health.isActive = isActive
      health.isIdle = !isActive
      health.usageCount++
      health.lastValidation = Date.now()
    }
  }

  /**
   * Get connection health status
   */
  getConnectionHealth(connectionId: string): ConnectionHealthStatus | undefined {
    return this.connectionHealth.get(connectionId)
  }

  /**
   * Get all connection health statuses
   */
  getAllConnectionHealth(): ConnectionHealthStatus[] {
    return Array.from(this.connectionHealth.values())
  }

  /**
   * Get lifecycle metrics
   */
  getMetrics(): LifecycleMetrics {
    return { ...this.metrics }
  }

  /**
   * Perform manual validation of all connections
   */
  async validateAllConnections(): Promise<{
    healthy: number
    unhealthy: number
    total: number
    details: ConnectionHealthStatus[]
  }> {
    const startTime = Date.now()
    let healthy = 0
    let unhealthy = 0
    const details: ConnectionHealthStatus[] = []

    const validationPromises = Array.from(this.connectionHealth.entries()).map(
      async ([connectionId, health]) => {
        try {
          const isValid = await this.validateConnection(connectionId)
          if (isValid) {
            healthy++
          } else {
            unhealthy++
          }
          details.push(this.connectionHealth.get(connectionId)!)
        } catch (error) {
          unhealthy++
          details.push(this.connectionHealth.get(connectionId)!)
        }
      }
    )

    await Promise.all(validationPromises)

    const duration = Date.now() - startTime
    this.metrics.health.lastHealthCheck = Date.now()
    this.metrics.health.healthCheckDuration = duration
    this.metrics.health.healthyConnections = healthy
    this.metrics.health.unhealthyConnections = unhealthy

    return { healthy, unhealthy, total: this.connectionHealth.size, details }
  }

  /**
   * Perform manual cleanup of idle and expired connections
   */
  async performCleanup(): Promise<{
    idleRemoved: number
    expiredRemoved: number
    unhealthyRemoved: number
    totalRemoved: number
  }> {
    const startTime = Date.now()
    let idleRemoved = 0
    let expiredRemoved = 0
    let unhealthyRemoved = 0
    const toRemove: string[] = []

    const now = Date.now()

    for (const [connectionId, health] of this.connectionHealth) {
      let shouldRemove = false
      let reason = ''

      // Check for idle timeout
      if (health.isIdle && (now - health.lastValidation) > this.config.idleConnectionTimeoutMs) {
        shouldRemove = true
        reason = 'idle_timeout'
        idleRemoved++
      }

      // Check for expired connections
      if ((now - (this.startTime + health.age)) > this.config.maxConnectionLifetimeMs) {
        shouldRemove = true
        reason = 'expired'
        expiredRemoved++
      }

      // Check for unhealthy connections
      if (!health.isHealthy && health.consecutiveFailures >= this.config.maxValidationFailures) {
        shouldRemove = true
        reason = 'unhealthy'
        unhealthyRemoved++
      }

      if (shouldRemove) {
        toRemove.push({ connectionId, reason })
      }
    }

    // Remove connections in batches
    const batches = this.chunkArray(toRemove, this.config.cleanupBatchSize)
    for (const batch of batches) {
      const removalPromises = batch.map(({ connectionId, reason }) =>
        this.removeConnection(connectionId, reason)
      )
      await Promise.all(removalPromises)
    }

    const duration = Date.now() - startTime
    this.metrics.cleanup.lastCleanupTime = now
    this.metrics.cleanup.totalCleanupTime += duration
    this.metrics.cleanup.idleConnectionsRemoved += idleRemoved
    this.metrics.cleanup.expiredConnectionsRemoved += expiredRemoved
    this.metrics.cleanup.unhealthyConnectionsRemoved += unhealthyRemoved

    this.emitEvent({
      type: 'cleanup_completed',
      timestamp: now,
      details: {
        idleRemoved,
        expiredRemoved,
        unhealthyRemoved,
        totalRemoved: idleRemoved + expiredRemoved + unhealthyRemoved,
        duration
      }
    })

    return {
      idleRemoved,
      expiredRemoved,
      unhealthyRemoved,
      totalRemoved: idleRemoved + expiredRemoved + unhealthyRemoved
    }
  }

  /**
   * Attempt to recover a failed connection
   */
  async recoverConnection(connectionId: string): Promise<boolean> {
    if (this.activeRecoveries.has(connectionId)) {
      return this.activeRecoveries.get(connectionId)!
    }

    const recoveryPromise = this.performConnectionRecovery(connectionId)
    this.activeRecoveries.set(connectionId, recoveryPromise)

    try {
      const result = await recoveryPromise
      this.activeRecoveries.delete(connectionId)
      return result
    } catch (error) {
      this.activeRecoveries.delete(connectionId)
      throw error
    }
  }

  /**
   * Initiate graceful shutdown of the lifecycle manager
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return

    this.isShuttingDown = true
    this.emitEvent({
      type: 'shutdown_initiated',
      timestamp: Date.now(),
      details: { connectionCount: this.connectionHealth.size }
    })

    // Stop all timers
    this.stopAllTimers()

    if (this.config.gracefulShutdownEnabled) {
      // Wait for active recoveries to complete
      const recoveryPromises = Array.from(this.activeRecoveries.values())
      if (recoveryPromises.length > 0) {
        await Promise.allSettled(recoveryPromises)
      }

      // Perform final cleanup
      await this.performCleanup()

      // Wait for remaining connections to be released
      const timeout = this.config.shutdownTimeoutMs
      const startTime = Date.now()

      while (this.connectionHealth.size > 0 && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Cleanup remaining resources
    this.connectionHealth.clear()
    this.activeRecoveries.clear()
    this.eventListeners.clear()
  }

  /**
   * Add event listener for lifecycle events
   */
  addEventListener(
    eventType: ConnectionLifecycleEvent['type'],
    listener: (event: ConnectionLifecycleEvent) => void
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventType: ConnectionLifecycleEvent['type'],
    listener: (event: ConnectionLifecycleEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Private methods
  private mergeConfig(config: ConnectionLifecycleConfig): Required<ConnectionLifecycleConfig> {
    return {
      // Connection validation
      validationIntervalMs: config.validationIntervalMs ?? 30000,
      validationTimeoutMs: config.validationTimeoutMs ?? 5000,
      validationQuery: config.validationQuery ?? 'SELECT 1',
      maxValidationFailures: config.maxValidationFailures ?? 3,

      // Connection cleanup
      idleConnectionTimeoutMs: config.idleConnectionTimeoutMs ?? 600000, // 10 minutes
      maxConnectionLifetimeMs: config.maxConnectionLifetimeMs ?? 3600000, // 1 hour
      cleanupIntervalMs: config.cleanupIntervalMs ?? 60000, // 1 minute
      cleanupBatchSize: config.cleanupBatchSize ?? 5,

      // Connection recovery
      enableAutoRecovery: config.enableAutoRecovery ?? true,
      recoveryAttempts: config.recoveryAttempts ?? 3,
      recoveryDelayMs: config.recoveryDelayMs ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxRecoveryDelayMs: config.maxRecoveryDelayMs ?? 30000,

      // Health monitoring
      healthCheckIntervalMs: config.healthCheckIntervalMs ?? 60000,
      healthCheckTimeoutMs: config.healthCheckTimeoutMs ?? 10000,
      consecutiveFailureThreshold: config.consecutiveFailureThreshold ?? 5,

      // Resource management
      memoryThresholdMB: config.memoryThresholdMB ?? 100,
      enableMemoryMonitoring: config.enableMemoryMonitoring ?? true,
      resourceCheckIntervalMs: config.resourceCheckIntervalMs ?? 30000,

      // Graceful shutdown
      shutdownTimeoutMs: config.shutdownTimeoutMs ?? 30000,
      gracefulShutdownEnabled: config.gracefulShutdownEnabled ?? true
    }
  }

  private startLifecycleManagement(): void {
    // Start validation timer
    if (this.config.validationIntervalMs > 0) {
      this.timers.validation = setInterval(async () => {
        if (!this.isShuttingDown) {
          await this.validateAllConnections()
        }
      }, this.config.validationIntervalMs)
    }

    // Start cleanup timer
    if (this.config.cleanupIntervalMs > 0) {
      this.timers.cleanup = setInterval(async () => {
        if (!this.isShuttingDown) {
          await this.performCleanup()
        }
      }, this.config.cleanupIntervalMs)
    }

    // Start health check timer
    if (this.config.healthCheckIntervalMs > 0) {
      this.timers.healthCheck = setInterval(async () => {
        if (!this.isShuttingDown) {
          await this.performHealthCheck()
        }
      }, this.config.healthCheckIntervalMs)
    }

    // Start resource monitoring timer
    if (this.config.enableMemoryMonitoring && this.config.resourceCheckIntervalMs > 0) {
      this.timers.resourceCheck = setInterval(async () => {
        if (!this.isShuttingDown) {
          await this.checkResourceUsage()
        }
      }, this.config.resourceCheckIntervalMs)
    }
  }

  private stopAllTimers(): void {
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer)
    })
    this.timers = {}
  }

  private async validateConnection(connectionId: string): Promise<boolean> {
    const health = this.connectionHealth.get(connectionId)
    if (!health) return false

    this.metrics.lifecycle.validationsPerformed++

    try {
      const connection = createDatabaseConnection(this.db, {
        connectionTimeoutMs: this.config.validationTimeoutMs,
        retryAttempts: 1,
        enableMetrics: false
      })

      const result = await Promise.race([
        connection.execute(this.config.validationQuery),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), this.config.validationTimeoutMs)
        )
      ])

      const isValid = result.success
      health.lastValidation = Date.now()
      health.isValid = isValid

      if (isValid) {
        health.isHealthy = true
        health.consecutiveFailures = 0
      } else {
        health.consecutiveFailures++
        health.errorCount++
        health.isHealthy = health.consecutiveFailures < this.config.maxValidationFailures

        if (!health.isHealthy) {
          this.metrics.lifecycle.validationFailures++
          this.emitEvent({
            type: 'validation_failed',
            connectionId,
            timestamp: Date.now(),
            details: {
              consecutiveFailures: health.consecutiveFailures,
              lastError: result.error
            }
          })

          // Attempt recovery if enabled
          if (this.config.enableAutoRecovery && health.consecutiveFailures >= this.config.maxValidationFailures) {
            await this.recoverConnection(connectionId)
          }
        }
      }

      return isValid

    } catch (error) {
      health.consecutiveFailures++
      health.errorCount++
      health.isHealthy = health.consecutiveFailures < this.config.maxValidationFailures
      health.lastError = (error as Error).message

      this.metrics.lifecycle.validationFailures++

      if (this.config.enableAutoRecovery && health.consecutiveFailures >= this.config.maxValidationFailures) {
        await this.recoverConnection(connectionId)
      }

      return false
    }
  }

  private async performConnectionRecovery(connectionId: string): Promise<boolean> {
    const health = this.connectionHealth.get(connectionId)
    if (!health || !this.config.enableAutoRecovery) return false

    this.metrics.lifecycle.recoveriesAttempted++
    this.metrics.recovery.activeRecoveries++

    const startTime = Date.now()
    let delay = this.config.recoveryDelayMs

    for (let attempt = 1; attempt <= this.config.recoveryAttempts; attempt++) {
      try {
        // Wait before attempting recovery
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
          delay = Math.min(delay * this.config.backoffMultiplier, this.config.maxRecoveryDelayMs)
        }

        // Attempt to validate the connection
        const isValid = await this.validateConnection(connectionId)
        if (isValid) {
          this.metrics.lifecycle.recoveriesSuccessful++
          this.metrics.recovery.successfulRecoveries++

          this.emitEvent({
            type: 'connection_recovered',
            connectionId,
            timestamp: Date.now(),
            details: {
              attempt,
              duration: Date.now() - startTime
            }
          })

          return true
        }

      } catch (error) {
        health.lastError = (error as Error).message
      }
    }

    // Recovery failed - mark connection for removal
    this.metrics.recovery.failedRecoveries++
    await this.removeConnection(connectionId, 'recovery_failed')

    return false
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now()
    let unhealthyConnections = 0

    for (const [connectionId, health] of this.connectionHealth) {
      if (!health.isHealthy) {
        unhealthyConnections++
      }

      // Update connection age
      health.age = Date.now() - this.startTime

      // Check for consecutive failures
      if (health.consecutiveFailures >= this.config.consecutiveFailureThreshold) {
        this.emitEvent({
          type: 'health_check_failed',
          connectionId,
          timestamp: Date.now(),
          details: {
            consecutiveFailures: health.consecutiveFailures,
            lastError: health.lastError
          }
        })
      }
    }

    const duration = Date.now() - startTime
    this.metrics.health.lastHealthCheck = Date.now()
    this.metrics.health.healthCheckDuration = duration
    this.metrics.health.unhealthyConnections = unhealthyConnections
    this.metrics.health.healthyConnections = this.connectionHealth.size - unhealthyConnections
  }

  private async checkResourceUsage(): Promise<void> {
    if (!this.config.enableMemoryMonitoring) return

    // Note: In Cloudflare Workers, memory monitoring is limited
    // This is a placeholder for resource monitoring
    const estimatedMemoryUsage = this.estimateMemoryUsage()
    this.metrics.resources.currentMemoryUsage = estimatedMemoryUsage
    this.metrics.resources.peakMemoryUsage = Math.max(
      this.metrics.resources.peakMemoryUsage,
      estimatedMemoryUsage
    )
    this.metrics.resources.lastResourceCheck = Date.now()

    if (estimatedMemoryUsage > this.config.memoryThresholdMB) {
      this.metrics.resources.memoryThresholdExceeded++

      this.emitEvent({
        type: 'resource_threshold_exceeded',
        timestamp: Date.now(),
        details: {
          currentUsage: estimatedMemoryUsage,
          threshold: this.config.memoryThresholdMB,
          connectionCount: this.connectionHealth.size
        }
      })

      // Trigger cleanup to free resources
      await this.performCleanup()
    }
  }

  private estimateMemoryUsage(): number {
    // Simple estimation based on connection count and metrics
    const baseMemory = 10 // Base overhead in MB
    const connectionMemory = this.connectionHealth.size * 2 // 2MB per connection
    const metricsMemory = JSON.stringify(this.metrics).length / (1024 * 1024) // Metrics size in MB

    return Math.round(baseMemory + connectionMemory + metricsMemory)
  }

  private async removeConnection(connectionId: string, reason: string): Promise<void> {
    this.unregisterConnection(connectionId)

    // Note: Actual connection removal would need to be handled by the pool
    // This is a simplified implementation
    console.log(`Connection ${connectionId} removed due to: ${reason}`)
  }

  private emitEvent(event: ConnectionLifecycleEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in lifecycle event listener:', error)
        }
      })
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

/**
 * Factory function to create connection lifecycle manager
 */
export function createConnectionLifecycleManager(
  pool: EnhancedConnectionPool,
  db: D1Database,
  config?: ConnectionLifecycleConfig
): ConnectionLifecycleManager {
  return new ConnectionLifecycleManager(pool, db, config)
}
