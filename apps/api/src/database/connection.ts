import { D1Database } from '@cloudflare/workers-types'

export interface DatabaseConfig {
  maxConnections?: number
  connectionTimeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  enableMetrics?: boolean
}

export interface DatabaseMetrics {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  averageQueryTime: number
  connectionPoolSize: number
  lastHealthCheck: number
  isHealthy: boolean
}

export interface QueryOptions {
  timeout?: number
  retries?: number
  metrics?: boolean
}

export interface QueryResult<T = any> {
  success: boolean
  data?: T
  error?: string
  executionTime?: number
  cached?: boolean
}

/**
 * Database connection wrapper with connection pooling, retry logic, and metrics
 */
export class DatabaseConnection {
  private db: D1Database
  private config: Required<DatabaseConfig>
  private metrics: DatabaseMetrics
  private queryCache: Map<string, { data: any; expiry: number }>
  private connectionPool: Set<string>
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 60000 // 1 minute

  constructor(db: D1Database, config: DatabaseConfig = {}) {
    this.db = db
    this.config = {
      maxConnections: config.maxConnections ?? 10,
      connectionTimeoutMs: config.connectionTimeoutMs ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      enableMetrics: config.enableMetrics ?? true
    }

    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      connectionPoolSize: 0,
      lastHealthCheck: 0,
      isHealthy: true
    }

    this.queryCache = new Map()
    this.connectionPool = new Set()
  }

  /**
   * Execute a prepared statement with retry logic and metrics
   */
  async execute<T = any>(
    query: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now()
    const timeout = options.timeout ?? this.config.connectionTimeoutMs
    const maxRetries = options.retries ?? this.config.retryAttempts

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.totalQueries++
    }

    // Check cache for SELECT queries
    const cacheKey = this.getCacheKey(query, params)
    if (query.trim().toUpperCase().startsWith('SELECT') && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!
      if (Date.now() < cached.expiry) {
        return {
          success: true,
          data: cached.data,
          executionTime: Date.now() - startTime,
          cached: true
        }
      } else {
        this.queryCache.delete(cacheKey)
      }
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add connection to pool
        const connectionId = this.addToPool()

        // Execute query with timeout
        const result = await this.executeQueryWithTimeout(query, params, timeout)

        // Remove connection from pool
        this.removeFromPool(connectionId)

        const executionTime = Date.now() - startTime

        // Update metrics
        if (this.config.enableMetrics) {
          this.metrics.successfulQueries++
          this.updateAverageQueryTime(executionTime)
        }

        // Cache SELECT queries
        if (query.trim().toUpperCase().startsWith('SELECT') && result.results) {
          this.queryCache.set(cacheKey, {
            data: result.results,
            expiry: Date.now() + 300000 // 5 minutes
          })
        }

        return {
          success: true,
          data: result.results,
          executionTime
        }

      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          // Wait before retry
          await this.delay(this.config.retryDelayMs * Math.pow(2, attempt))
        }
      }
    }

    // All attempts failed
    if (this.config.enableMetrics) {
      this.metrics.failedQueries++
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown database error',
      executionTime: Date.now() - startTime
    }
  }

  /**
   * Execute a prepared statement and return the first result
   */
  async first<T = any>(
    query: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const result = await this.execute<T[]>(query, params, options)

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: true,
        data: undefined,
        executionTime: result.executionTime
      }
    }

    return {
      success: true,
      data: result.data[0],
      executionTime: result.executionTime
    }
  }

  /**
   * Execute a prepared statement and return the count of affected rows
   */
  async run(
    query: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<QueryResult<{ changes: number; lastRowId?: number }>> {
    const startTime = Date.now()
    const timeout = options.timeout ?? this.config.connectionTimeoutMs
    const maxRetries = options.retries ?? this.config.retryAttempts

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.totalQueries++
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const connectionId = this.addToPool()

        const stmt = this.db.prepare(query)
        const preparedStmt = params ? stmt.bind(...params) : stmt
        const result = await this.executeWithTimeout(preparedStmt.run(), timeout)

        this.removeFromPool(connectionId)

        const executionTime = Date.now() - startTime

        if (this.config.enableMetrics) {
          this.metrics.successfulQueries++
          this.updateAverageQueryTime(executionTime)
        }

        return {
          success: true,
          data: {
            changes: result.changes || 0,
            lastRowId: result.meta?.last_row_id
          },
          executionTime
        }

      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelayMs * Math.pow(2, attempt))
        }
      }
    }

    if (this.config.enableMetrics) {
      this.metrics.failedQueries++
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown database error',
      executionTime: Date.now() - startTime
    }
  }

  /**
   * Execute multiple statements in a batch
   */
  async batch(
    queries: Array<{ query: string; params?: any[] }>,
    options: QueryOptions = {}
  ): Promise<QueryResult<any[]>> {
    const startTime = Date.now()
    const results: any[] = []

    try {
      for (const { query, params } of queries) {
        const result = await this.execute(query, params, options)
        if (!result.success) {
          return {
            success: false,
            error: result.error,
            executionTime: Date.now() - startTime
          }
        }
        results.push(result.data)
      }

      return {
        success: true,
        data: results,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    const now = Date.now()

    // Don't check too frequently
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.metrics.isHealthy
    }

    try {
      const result = await this.first('SELECT 1 as health_check')
      this.metrics.isHealthy = result.success
      this.metrics.lastHealthCheck = now
      this.lastHealthCheck = now

      return result.success
    } catch (error) {
      this.metrics.isHealthy = false
      this.metrics.lastHealthCheck = now
      this.lastHealthCheck = now

      return false
    }
  }

  /**
   * Get database metrics
   */
  getMetrics(): DatabaseMetrics {
    return {
      ...this.metrics,
      connectionPoolSize: this.connectionPool.size,
      lastHealthCheck: this.lastHealthCheck
    }
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * Close database connection (cleanup)
   */
  close(): void {
    this.connectionPool.clear()
    this.queryCache.clear()
  }

  // Private helper methods
  private async executeQueryWithTimeout(
    query: string,
    params: any[] | undefined,
    timeout: number
  ): Promise<any> {
    const stmt = this.db.prepare(query)
    const preparedStmt = params ? stmt.bind(...params) : stmt
    return this.executeWithTimeout(preparedStmt.all(), timeout)
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), timeout)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private addToPool(): string {
    if (this.connectionPool.size >= this.config.maxConnections) {
      throw new Error('Connection pool exhausted')
    }

    const connectionId = crypto.randomUUID()
    this.connectionPool.add(connectionId)

    return connectionId
  }

  private removeFromPool(connectionId: string): void {
    this.connectionPool.delete(connectionId)
  }

  private getCacheKey(query: string, params?: any[]): string {
    return `${query}:${JSON.stringify(params || [])}`
  }

  private updateAverageQueryTime(executionTime: number): void {
    const totalQueries = this.metrics.successfulQueries + this.metrics.failedQueries
    this.metrics.averageQueryTime =
      (this.metrics.averageQueryTime * (totalQueries - 1) + executionTime) / totalQueries
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Factory function to create a database connection
 */
export function createDatabaseConnection(
  db: D1Database,
  config?: DatabaseConfig
): DatabaseConnection {
  return new DatabaseConnection(db, config)
}

/**
 * Default database configuration
 */
export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  maxConnections: 10,
  connectionTimeoutMs: 30000,
  retryAttempts: 3,
  retryDelayMs: 1000,
  enableMetrics: true
}
