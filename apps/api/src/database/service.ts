import { D1Database } from '@cloudflare/workers-types'
import {
  DatabaseClient,
  DatabasePool,
  createDatabaseClient,
  createDatabasePool,
  DEFAULT_DATABASE_CLIENT_CONFIG,
} from './client'
import {
  EnhancedConnectionPool,
  createEnhancedConnectionPool,
  ConnectionPoolConfig,
} from './pool'
import {
  ConnectionPoolMonitor,
  createConnectionPoolMonitor,
  PoolMonitoringConfig,
} from './pool-monitoring'
import {
  ConnectionLifecycleManager,
  createConnectionLifecycleManager,
  ConnectionLifecycleConfig,
} from './connection-lifecycle'
import {
  PoolHealthChecker,
  createPoolHealthChecker,
  HealthCheckConfig,
} from './pool-health-checker'
import {
  AdaptivePoolSizer,
  createAdaptivePoolSizer,
  AdaptiveSizingConfig,
} from './adaptive-pool-sizer'

export interface DatabaseServiceConfig {
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

export interface DatabaseServiceMetrics {
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

export interface HealthCheckResult {
  healthy: boolean
  responseTime: number
  error?: string
  timestamp: number
}

/**
 * Database service with connection pooling, health monitoring, and metrics
 */
export class DatabaseService {
  private pool: DatabasePool
  private config: Required<DatabaseServiceConfig>
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

  constructor(db: D1Database, config: DatabaseServiceConfig = {}) {
    this.config = {
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
    }

    this.startTime = Date.now()
    this.pool = createDatabasePool(db, this.config.poolSize, {
      maxConnections: this.config.maxConnections,
      connectionTimeoutMs: this.config.connectionTimeoutMs,
      retryAttempts: this.config.retryAttempts,
      retryDelayMs: this.config.retryDelayMs,
      enableMetrics: this.config.enableMetrics,
      enableTransactions: this.config.enableTransactions,
    })

    // Start health check if enabled
    if (this.config.enableHealthCheck) {
      this.startHealthCheck()
    }
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
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const healthy = await this.pool.healthCheck()
      const responseTime = Date.now() - startTime

      this.lastHealthCheck = Date.now()
      this.healthCheckCount++

      return {
        healthy,
        responseTime,
        timestamp: this.lastHealthCheck,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        healthy: false,
        responseTime,
        error: (error as Error).message,
        timestamp: Date.now(),
      }
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): DatabaseServiceMetrics {
    const poolMetrics = this.pool.getMetrics()

    return {
      service: {
        uptime: Date.now() - this.startTime,
        startTime: this.startTime,
        lastHealthCheck: this.lastHealthCheck,
        healthCheckCount: this.healthCheckCount,
        healthyConnections: poolMetrics.healthyConnections,
        totalConnections: poolMetrics.totalConnections,
      },
      queries: {
        totalQueries: poolMetrics.totalQueries,
        successfulQueries: poolMetrics.successfulQueries,
        failedQueries: poolMetrics.failedQueries,
        averageQueryTime: poolMetrics.averageQueryTime,
        slowQueries: this.slowQueries.length,
        cachedQueries: 0, // TODO: Implement cache metrics
      },
      connections: {
        activeConnections: poolMetrics.connectionPoolSize,
        idleConnections:
          poolMetrics.totalConnections - poolMetrics.connectionPoolSize,
        poolUtilization:
          poolMetrics.totalConnections > 0
            ? poolMetrics.connectionPoolSize / poolMetrics.totalConnections
            : 0,
      },
    }
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
  close(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

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
      timestamp: Date.now(),
    }

    this.slowQueries.push(slowQuery)

    // Keep only recent slow queries
    if (this.slowQueries.length > 1000) {
      this.slowQueries = this.slowQueries.slice(-500)
    }

    console.warn(`Slow query detected (${executionTime}ms):`, {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params,
      executionTime,
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
      attempts,
    }

    this.failedQueries.push(failedQuery)

    // Keep only recent failed queries
    if (this.failedQueries.length > 1000) {
      this.failedQueries = this.failedQueries.slice(-500)
    }

    console.error(`Query failed (${attempts} attempts):`, {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params,
      error: error.message,
    })
  }
}

/**
 * Factory function to create a database service
 */
export function createDatabaseService(
  db: D1Database,
  config?: DatabaseServiceConfig
): DatabaseService {
  return new DatabaseService(db, config)
}

/**
 * Default database service configuration
 */
export const DEFAULT_DATABASE_SERVICE_CONFIG: DatabaseServiceConfig = {
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
}

/**
 * Database service instance for singleton pattern
 */
let databaseServiceInstance: DatabaseService | null = null

/**
 * Get or create database service instance
 */
export function getDatabaseService(
  db: D1Database,
  config?: DatabaseServiceConfig
): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = createDatabaseService(db, config)
  }
  return databaseServiceInstance
}

/**
 * Reset database service instance (for testing)
 */
export function resetDatabaseService(): void {
  if (databaseServiceInstance) {
    databaseServiceInstance.close()
    databaseServiceInstance = null
  }
}
