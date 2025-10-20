import { D1Database } from '@cloudflare/workers-types'
import {
  DatabaseClient,
  DatabasePool,
  createDatabaseClient,
  createDatabasePool,
  DEFAULT_DATABASE_CLIENT_CONFIG
} from './client'
import { EnhancedConnectionPool, createEnhancedConnectionPool, ConnectionPoolConfig } from './pool'
import { ConnectionPoolMonitor, createConnectionPoolMonitor, PoolMonitoringConfig } from './pool-monitoring'
import { ConnectionLifecycleManager, createConnectionLifecycleManager, ConnectionLifecycleConfig } from './connection-lifecycle'
import { PoolHealthChecker, createPoolHealthChecker, HealthCheckConfig } from './pool-health-checker'
import { AdaptivePoolSizer, createAdaptivePoolSizer, AdaptiveSizingConfig } from './adaptive-pool-sizer'

export interface EnhancedDatabaseServiceConfig {
  // Legacy compatibility
  poolSize?: number
  maxConnections?: number
  connectionTimeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  enableMetrics?: boolean
  enableTransactions?: boolean
  enableHealthCheck?: boolean
  healthCheckIntervalMs?: number
  enableQueryCache?: boolean
  queryCacheTtlMs?: number
  slowQueryThresholdMs?: number
  logSlowQueries?: boolean
  logFailedQueries?: boolean

  // Enhanced pool configuration
  enableEnhancedPool?: boolean
  poolConfig?: ConnectionPoolConfig
  monitoringConfig?: PoolMonitoringConfig
  lifecycleConfig?: ConnectionLifecycleConfig
  healthCheckConfig?: HealthCheckConfig
  adaptiveSizingConfig?: AdaptiveSizingConfig
}

export interface EnhancedDatabaseServiceMetrics {
  service: {
    uptime: number
    startTime: number
    lastHealthCheck: number
    healthCheckCount: number
    healthyConnections: number
    totalConnections: number
    enhancedPoolEnabled: boolean
  }
  queries: {
    totalQueries: number
    successfulQueries: number
    failedQueries: number
    averageQueryTime: number
    slowQueries: number
    cachedQueries: number
  }
  connections: {
    activeConnections: number
    idleConnections: number
    poolUtilization: number
  }
  enhanced?: {
    pool: any
    monitoring: any
    lifecycle: any
    health: any
    adaptive: any
  }
}

export interface EnhancedHealthCheckResult {
  healthy: boolean
  responseTime: number
  error?: string
  timestamp: number
  enhanced?: {
    healthScore: number
    status: string
    issues: string[]
    recommendations: string[]
  }
}

/**
 * Enhanced database service with advanced connection pooling, monitoring, and auto-scaling
 */
export class EnhancedDatabaseService {
  private pool: DatabasePool
  private config: Required<EnhancedDatabaseServiceConfig>
  private startTime: number
  private lastHealthCheck: number = 0
  private healthCheckCount: number = 0
  private healthCheckTimer?: ReturnType<typeof setInterval>
  private slowQueries: Array<{
    sql: string
    params?: any[]
    executionTime: number
    timestamp: number
  }> = []
  private failedQueries: Array<{
    sql: string
    params?: any[]
    error: string
    timestamp: number
    attempts: number
  }> = []

  // Enhanced pool components
  private enhancedPool?: EnhancedConnectionPool
  private poolMonitor?: ConnectionPoolMonitor
  private lifecycleManager?: ConnectionLifecycleManager
  private healthChecker?: PoolHealthChecker
  private adaptiveSizer?: AdaptivePoolSizer

  constructor(db: D1Database, config: EnhancedDatabaseServiceConfig = {}) {
    this.config = {
      // Legacy compatibility
      poolSize: config.poolSize ?? 5,
      maxConnections: config.maxConnections ?? 10,
      connectionTimeoutMs: config.connectionTimeoutMs ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      enableMetrics: config.enableMetrics ?? true,
      enableTransactions: config.enableTransactions ?? true,
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckIntervalMs: config.healthCheckIntervalMs ?? 60000,
      enableQueryCache: config.enableQueryCache ?? true,
      queryCacheTtlMs: config.queryCacheTtlMs ?? 300000,
      slowQueryThresholdMs: config.slowQueryThresholdMs ?? 1000,
      logSlowQueries: config.logSlowQueries ?? true,
      logFailedQueries: config.logFailedQueries ?? true,

      // Enhanced pool configuration
      enableEnhancedPool: config.enableEnhancedPool ?? true,
      poolConfig: config.poolConfig ?? {},
      monitoringConfig: config.monitoringConfig ?? {},
      lifecycleConfig: config.lifecycleConfig ?? {},
      healthCheckConfig: config.healthCheckConfig ?? {},
      adaptiveSizingConfig: config.adaptiveSizingConfig ?? {}
    }

    this.startTime = Date.now()

    // Initialize enhanced pool if enabled
    if (this.config.enableEnhancedPool) {
      this.initializeEnhancedPool(db)
    } else {
      // Use legacy pool for backward compatibility
      this.pool = createDatabasePool(db, this.config.poolSize, {
        maxConnections: this.config.maxConnections,
        connectionTimeoutMs: this.config.connectionTimeoutMs,
        retryAttempts: this.config.retryAttempts,
        retryDelayMs: this.config.retryDelayMs,
        enableMetrics: this.config.enableMetrics,
        enableTransactions: this.config.enableTransactions
      })
    }

    // Start health check if enabled
    if (this.config.enableHealthCheck && !this.config.enableEnhancedPool) {
      this.startHealthCheck()
    }
  }

  private initializeEnhancedPool(db: D1Database): void {
    try {
      // Create enhanced connection pool
      this.enhancedPool = createEnhancedConnectionPool(db, {
        // Use legacy config values as defaults
        maxConnections: this.config.maxConnections,
        connectionTimeoutMs: this.config.connectionTimeoutMs,
        retryAttempts: this.config.retryAttempts,
        retryDelayMs: this.config.retryDelayMs,
        enableMetrics: this.config.enableMetrics,
        ...this.config.poolConfig
      })

      // Create connection lifecycle manager
      this.lifecycleManager = createConnectionLifecycleManager(
        this.enhancedPool,
        db,
        this.config.lifecycleConfig
      )

      // Create pool monitor
      this.poolMonitor = createConnectionPoolMonitor(
        this.enhancedPool,
        this.config.monitoringConfig
      )

      // Create health checker
      this.healthChecker = createPoolHealthChecker(
        this.enhancedPool,
        this.lifecycleManager,
        this.poolMonitor,
        this.config.healthCheckConfig
      )

      // Create adaptive sizer
      this.adaptiveSizer = createAdaptivePoolSizer(
        this.enhancedPool,
        this.poolMonitor,
        this.healthChecker,
        this.config.adaptiveSizingConfig
      )

      // Create a wrapper pool for compatibility
      this.pool = this.createPoolWrapper()

      console.info('Enhanced connection pool initialized successfully')
    } catch (error) {
      console.error('Failed to initialize enhanced pool, falling back to legacy pool:', error)

      // Fallback to legacy pool
      this.pool = createDatabasePool(db, this.config.poolSize, {
        maxConnections: this.config.maxConnections,
        connectionTimeoutMs: this.config.connectionTimeoutMs,
        retryAttempts: this.config.retryAttempts,
        retryDelayMs: this.config.retryDelayMs,
        enableMetrics: this.config.enableMetrics,
        enableTransactions: this.config.enableTransactions
      })
    }
  }

  private createPoolWrapper(): DatabasePool {
    return {
      getClient: () => {
        if (this.enhancedPool) {
          // Return a client that uses the enhanced pool
          return this.createEnhancedClient()
        }
        throw new Error('Enhanced pool not available')
      },
      query: async <T>(sql: string, params?: any[], options?: any) => {
        if (this.enhancedPool) {
          const result = await this.enhancedPool.execute(sql, params, options)
          return Array.isArray(result) ? result : []
        }
        throw new Error('Enhanced pool not available')
      },
      queryFirst: async <T>(sql: string, params?: any[], options?: any) => {
        if (this.enhancedPool) {
          const result = await this.enhancedPool.execute(sql, params, options)
          return Array.isArray(result) && result.length > 0 ? result[0] : null
        }
        throw new Error('Enhanced pool not available')
      },
      execute: async (sql: string, params?: any[], options?: any) => {
        if (this.enhancedPool) {
          const result = await this.enhancedPool.execute(sql, params, options)
          return { changes: 1, lastRowId: undefined } // Simplified
        }
        throw new Error('Enhanced pool not available')
      },
      healthCheck: async () => {
        if (this.healthChecker) {
          const result = await this.healthChecker.performHealthCheck()
          return result.status !== 'critical'
        }
        if (this.enhancedPool) {
          return this.enhancedPool.performHealthCheck()
        }
        return true
      },
      getMetrics: () => {
        if (this.enhancedPool) {
          return this.enhancedPool.getMetrics()
        }
        return {
          totalConnections: 0,
          healthyConnections: 0,
          totalQueries: 0,
          successfulQueries: 0,
          failedQueries: 0,
          averageQueryTime: 0,
          connectionPoolSize: 0
        }
      },
      clearCache: () => {
        // Enhanced pool doesn't have a simple clear cache method
        console.info('Cache clear requested on enhanced pool')
      },
      close: () => {
        if (this.enhancedPool) {
          this.enhancedPool.close()
        }
      }
    } as DatabasePool
  }

  private createEnhancedClient(): DatabaseClient {
    return {
      query: async <T>(sql: string, params?: any[], options?: any) => {
        if (this.enhancedPool) {
          const result = await this.enhancedPool.execute(sql, params, options)
          return Array.isArray(result) ? result : []
        }
        throw new Error('Enhanced pool not available')
      },
      queryFirst: async <T>(sql: string, params?: any[], options?: any) => {
        if (this.enhancedPool) {
          const result = await this.enhancedPool.execute(sql, params, options)
          return Array.isArray(result) && result.length > 0 ? result[0] : null
        }
        throw new Error('Enhanced pool not available')
      },
      execute: async (sql: string, params?: any[], options?: any) => {
        if (this.enhancedPool) {
          const result = await this.enhancedPool.execute(sql, params, options)
          return { changes: 1, lastRowId: undefined } // Simplified
        }
        throw new Error('Enhanced pool not available')
      },
      transaction: async <T>(callback: any, options?: any) => {
        // Transaction support would need to be implemented
        throw new Error('Transactions not yet supported in enhanced pool')
      },
      batch: async (queries: any[], options?: any) => {
        if (this.enhancedPool) {
          const results = []
          for (const query of queries) {
            const result = await this.enhancedPool.execute(query.sql, query.params, options)
            results.push(result)
          }
          return results
        }
        throw new Error('Enhanced pool not available')
      },
      healthCheck: async () => {
        if (this.healthChecker) {
          const result = await this.healthChecker.performHealthCheck()
          return result.status !== 'critical'
        }
        if (this.enhancedPool) {
          return this.enhancedPool.performHealthCheck()
        }
        return true
      },
      getMetrics: () => {
        if (this.enhancedPool) {
          return this.enhancedPool.getMetrics()
        }
        return {
          totalQueries: 0,
          successfulQueries: 0,
          failedQueries: 0,
          averageQueryTime: 0,
          connectionPoolSize: 0,
          lastHealthCheck: 0,
          isHealthy: true
        }
      },
      clearCache: () => {
        console.info('Cache clear requested on enhanced client')
      },
      close: () => {
        // Enhanced client doesn't need to be closed individually
      },
      getRawConnection: () => {
        throw new Error('Raw connection access not supported in enhanced pool')
      }
    } as DatabaseClient
  }

  /**
   * Get a database client from the pool
   */
  getClient(): DatabaseClient {
    return this.pool.getClient()
  }

  /**
   * Execute a query using the pool
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T[]> {
    const startTime = Date.now()

    try {
      const result = await this.pool.query<T>(sql, params, options)
      const executionTime = Date.now() - startTime

      // Track slow queries
      if (executionTime > this.config.slowQueryThresholdMs) {
        this.trackSlowQuery(sql, params, executionTime)
      }

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.trackFailedQuery(sql, params, error as Error, 1)
      throw error
    }
  }

  /**
   * Execute a query and return the first result
   */
  async queryFirst<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T | null> {
    const startTime = Date.now()

    try {
      const result = await this.pool.queryFirst<T>(sql, params, options)
      const executionTime = Date.now() - startTime

      if (executionTime > this.config.slowQueryThresholdMs) {
        this.trackSlowQuery(sql, params, executionTime)
      }

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.trackFailedQuery(sql, params, error as Error, 1)
      throw error
    }
  }

  /**
   * Execute a statement
   */
  async execute(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<{ changes: number; lastRowId?: number }> {
    const startTime = Date.now()

    try {
      const result = await this.pool.execute(sql, params, options)
      const executionTime = Date.now() - startTime

      if (executionTime > this.config.slowQueryThresholdMs) {
        this.trackSlowQuery(sql, params, executionTime)
      }

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.trackFailedQuery(sql, params, error as Error, 1)
      throw error
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T = any>(
    callback: (tx: any) => Promise<T>,
    options?: { timeout?: number; retries?: number }
  ): Promise<T> {
    const client = this.getClient()
    return client.transaction(callback, options)
  }

  /**
   * Execute multiple statements in a batch
   */
  async batch(
    queries: Array<{ sql: string; params?: any[] }>,
    options?: { timeout?: number; retries?: number }
  ): Promise<any[]> {
    const startTime = Date.now()

    try {
      const result = await this.pool.getClient().batch(queries, options)
      const executionTime = Date.now() - startTime

      if (executionTime > this.config.slowQueryThresholdMs) {
        this.trackSlowQuery(
          `BATCH: ${queries.map(q => q.sql).join('; ')}`,
          queries.flatMap(q => q.params || []),
          executionTime
        )
      }

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.trackFailedQuery(
        `BATCH: ${queries.map(q => q.sql).join('; ')}`,
        queries.flatMap(q => q.params || []),
        error as Error,
        1
      )
      throw error
    }
  }

  /**
   * Perform a health check
   */
  async healthCheck(): Promise<EnhancedHealthCheckResult> {
    const startTime = Date.now()

    try {
      let healthy = false
      let enhancedData: EnhancedHealthCheckResult['enhanced'] = undefined

      if (this.healthChecker) {
        const healthResult = await this.healthChecker.performHealthCheck()
        healthy = healthResult.status !== 'critical'
        enhancedData = {
          healthScore: healthResult.healthScore,
          status: healthResult.status,
          issues: healthResult.issues,
          recommendations: healthResult.recommendations
        }
      } else {
        healthy = await this.pool.healthCheck()
      }

      const responseTime = Date.now() - startTime

      this.lastHealthCheck = Date.now()
      this.healthCheckCount++

      return {
        healthy,
        responseTime,
        timestamp: this.lastHealthCheck,
        enhanced: enhancedData
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        healthy: false,
        responseTime,
        error: (error as Error).message,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): EnhancedDatabaseServiceMetrics {
    const poolMetrics = this.pool.getMetrics()
    const baseMetrics: EnhancedDatabaseServiceMetrics = {
      service: {
        uptime: Date.now() - this.startTime,
        startTime: this.startTime,
        lastHealthCheck: this.lastHealthCheck,
        healthCheckCount: this.healthCheckCount,
        healthyConnections: poolMetrics.healthyConnections,
        totalConnections: poolMetrics.totalConnections,
        enhancedPoolEnabled: !!this.enhancedPool
      },
      queries: {
        totalQueries: poolMetrics.totalQueries,
        successfulQueries: poolMetrics.successfulQueries,
        failedQueries: poolMetrics.failedQueries,
        averageQueryTime: poolMetrics.averageQueryTime,
        slowQueries: this.slowQueries.length,
        cachedQueries: 0 // TODO: Implement cache metrics
      },
      connections: {
        activeConnections: poolMetrics.activeConnections,
        idleConnections: poolMetrics.totalConnections - poolMetrics.activeConnections,
        poolUtilization: poolMetrics.totalConnections > 0
          ? poolMetrics.activeConnections / poolMetrics.totalConnections
          : 0
      }
    }

    // Add enhanced metrics if available
    if (this.enhancedPool && this.poolMonitor && this.lifecycleManager && this.healthChecker && this.adaptiveSizer) {
      baseMetrics.enhanced = {
        pool: this.enhancedPool.getMetrics(),
        monitoring: this.poolMonitor.getRealTimeMetrics(),
        lifecycle: this.lifecycleManager.getMetrics(),
        health: this.healthChecker.getHealthStatus(),
        adaptive: this.adaptiveSizer.getMetrics()
      }
    }

    return baseMetrics
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 50): Array<{
    sql: string
    params?: any[]
    executionTime: number
    timestamp: number
  }> {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit)
  }

  /**
   * Get failed queries
   */
  getFailedQueries(limit = 50): Array<{
    sql: string
    params?: any[]
    error: string
    timestamp: number
    attempts: number
  }> {
    return this.failedQueries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get enhanced pool monitoring dashboard data
   */
  async getDashboardData() {
    if (!this.poolMonitor || !this.healthChecker) {
      return null
    }

    const [dashboardData, healthReport] = await Promise.all([
      this.poolMonitor.getDashboardData(),
      this.healthChecker.getHealthStatus()
    ])

    return {
      ...dashboardData,
      healthReport
    }
  }

  /**
   * Manually trigger pool scaling
   */
  async manualScaling(targetSize: number, reason?: string): Promise<boolean> {
    if (!this.adaptiveSizer) {
      throw new Error('Adaptive sizer not available')
    }

    try {
      const decision = await this.adaptiveSizer.manualScaling(targetSize, reason || 'Manual scaling')
      return decision.action !== 'no_action'
    } catch (error) {
      console.error('Manual scaling failed:', error)
      return false
    }
  }

  /**
   * Activate burst mode for handling traffic spikes
   */
  async activateBurstMode(durationMs = 300000): Promise<boolean> {
    if (!this.adaptiveSizer) {
      throw new Error('Adaptive sizer not available')
    }

    try {
      await this.adaptiveSizer.activateBurstMode(durationMs)
      return true
    } catch (error) {
      console.error('Burst mode activation failed:', error)
      return false
    }
  }

  /**
   * Deactivate burst mode
   */
  async deactivateBurstMode(): Promise<boolean> {
    if (!this.adaptiveSizer) {
      throw new Error('Adaptive sizer not available')
    }

    try {
      await this.adaptiveSizer.deactivateBurstMode()
      return true
    } catch (error) {
      console.error('Burst mode deactivation failed:', error)
      return false
    }
  }

  /**
   * Get pool performance insights
   */
  async getPerformanceInsights() {
    if (!this.poolMonitor) {
      return null
    }

    return this.poolMonitor.getPerformanceInsights()
  }

  /**
   * Export monitoring data
   */
  exportData(format: 'json' | 'csv' | 'prometheus', timeRange = 3600000): string {
    if (!this.poolMonitor) {
      throw new Error('Pool monitor not available')
    }

    return this.poolMonitor.exportData(format, timeRange)
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.pool.clearCache()
  }

  /**
   * Clear slow and failed query logs
   */
  clearLogs(): void {
    this.slowQueries = []
    this.failedQueries = []
  }

  /**
   * Close database service and cleanup resources
   */
  async close(): Promise<void> {
    // Stop health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // Close enhanced pool components
    if (this.adaptiveSizer) {
      await this.adaptiveSizer.shutdown()
    }
    if (this.healthChecker) {
      await this.healthChecker.shutdown()
    }
    if (this.lifecycleManager) {
      await this.lifecycleManager.shutdown()
    }
    if (this.poolMonitor) {
      this.poolMonitor.destroy()
    }
    if (this.enhancedPool) {
      await this.enhancedPool.close()
    }

    // Close legacy pool
    this.pool.close()
    this.clearLogs()
  }

  // Private methods
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.healthCheck()
      } catch (error) {
        console.error('Health check failed:', error)
      }
    }, this.config.healthCheckIntervalMs)
  }

  private trackSlowQuery(
    sql: string,
    params: any[] | undefined,
    executionTime: number
  ): void {
    if (!this.config.logSlowQueries) return

    const slowQuery = {
      sql,
      params,
      executionTime,
      timestamp: Date.now()
    }

    this.slowQueries.push(slowQuery)

    // Keep only recent slow queries
    if (this.slowQueries.length > 1000) {
      this.slowQueries = this.slowQueries.slice(-500)
    }

    console.warn(`Slow query detected (${executionTime}ms):`, {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params,
      executionTime
    })
  }

  private trackFailedQuery(
    sql: string,
    params: any[] | undefined,
    error: Error,
    attempts: number
  ): void {
    if (!this.config.logFailedQueries) return

    const failedQuery = {
      sql,
      params,
      error: error.message,
      timestamp: Date.now(),
      attempts
    }

    this.failedQueries.push(failedQuery)

    // Keep only recent failed queries
    if (this.failedQueries.length > 1000) {
      this.failedQueries = this.failedQueries.slice(-500)
    }

    console.error(`Query failed (${attempts} attempts):`, {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params,
      error: error.message
    })
  }
}

/**
 * Factory function to create enhanced database service
 */
export function createEnhancedDatabaseService(
  db: D1Database,
  config?: EnhancedDatabaseServiceConfig
): EnhancedDatabaseService {
  return new EnhancedDatabaseService(db, config)
}

/**
 * Default enhanced database service configuration
 */
export const DEFAULT_ENHANCED_DATABASE_SERVICE_CONFIG: EnhancedDatabaseServiceConfig = {
  // Legacy compatibility
  poolSize: 5,
  maxConnections: 10,
  connectionTimeoutMs: 30000,
  retryAttempts: 3,
  retryDelayMs: 1000,
  enableMetrics: true,
  enableTransactions: true,
  enableHealthCheck: true,
  healthCheckIntervalMs: 60000,
  enableQueryCache: true,
  queryCacheTtlMs: 300000,
  slowQueryThresholdMs: 1000,
  logSlowQueries: true,
  logFailedQueries: true,

  // Enhanced pool configuration
  enableEnhancedPool: true,
  poolConfig: {},
  monitoringConfig: {},
  lifecycleConfig: {},
  healthCheckConfig: {},
  adaptiveSizingConfig: {}
}

/**
 * Enhanced database service instance for singleton pattern
 */
let enhancedDatabaseServiceInstance: EnhancedDatabaseService | null = null

/**
 * Get or create enhanced database service instance
 */
export function getEnhancedDatabaseService(
  db: D1Database,
  config?: EnhancedDatabaseServiceConfig
): EnhancedDatabaseService {
  if (!enhancedDatabaseServiceInstance) {
    enhancedDatabaseServiceInstance = createEnhancedDatabaseService(db, config)
  }
  return enhancedDatabaseServiceInstance
}

/**
 * Reset enhanced database service instance (for testing)
 */
export function resetEnhancedDatabaseService(): void {
  if (enhancedDatabaseServiceInstance) {
    enhancedDatabaseServiceInstance.close()
    enhancedDatabaseServiceInstance = null
  }
}
