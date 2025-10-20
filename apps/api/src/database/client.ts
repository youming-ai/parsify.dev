import { D1Database } from '@cloudflare/workers-types'
import {
  DatabaseConnection,
  createDatabaseConnection,
  DEFAULT_DATABASE_CONFIG,
} from './connection'
import {
  EnhancedTransaction,
  TransactionManager,
  globalTransactionManager,
  TransactionUtils,
  TransactionConfig,
  IsolationLevel,
  TransactionOptions,
  TransactionResult,
} from './transaction'
import { TransactionHelper, TransactionTemplates } from './transaction-utils'
import { globalTransactionMonitor } from './transaction-monitoring'

export interface DatabaseClientConfig {
  maxConnections?: number
  connectionTimeoutMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  enableMetrics?: boolean
  enableTransactions?: boolean
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE'
}

export interface TransactionOptions {
  timeout?: number
  retries?: number
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE'
}

export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rollback?: boolean
  executionTime?: number
}

/**
 * Database client with transaction support and connection pooling
 */
export class DatabaseClient {
  private connection: DatabaseConnection
  private config: Required<DatabaseClientConfig>
  private transactionCounter: number = 0

  constructor(db: D1Database, config: DatabaseClientConfig = {}) {
    this.config = {
      maxConnections: config.maxConnections ?? 10,
      connectionTimeoutMs: config.connectionTimeoutMs ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      enableMetrics: config.enableMetrics ?? true,
      enableTransactions: config.enableTransactions ?? true,
      isolationLevel: config.isolationLevel ?? 'READ_COMMITTED',
    }

    this.connection = createDatabaseConnection(db, {
      maxConnections: this.config.maxConnections,
      connectionTimeoutMs: this.config.connectionTimeoutMs,
      retryAttempts: this.config.retryAttempts,
      retryDelayMs: this.config.retryDelayMs,
      enableMetrics: this.config.enableMetrics,
    })
  }

  /**
   * Execute a query and return all results
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T[]> {
    const result = await this.connection.execute<T[]>(sql, params, options)

    if (!result.success) {
      throw new Error(`Database query failed: ${result.error}`)
    }

    return result.data || []
  }

  /**
   * Execute a query and return the first result
   */
  async queryFirst<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T | null> {
    const result = await this.connection.first<T>(sql, params, options)

    if (!result.success) {
      throw new Error(`Database query failed: ${result.error}`)
    }

    return result.data || null
  }

  /**
   * Execute a statement and return metadata
   */
  async execute(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<{ changes: number; lastRowId?: number }> {
    const result = await this.connection.run(sql, params, options)

    if (!result.success) {
      throw new Error(`Database execute failed: ${result.error}`)
    }

    return result.data || { changes: 0 }
  }

  /**
   * Execute multiple statements in a transaction (legacy method)
   */
  async transaction<T = any>(
    callback: (tx: Transaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<LegacyTransactionResult<T>> {
    if (!this.config.enableTransactions) {
      throw new Error('Transactions are disabled in configuration')
    }

    const startTime = Date.now()
    const transactionId = ++this.transactionCounter

    try {
      const tx = new Transaction(this.connection, transactionId, options)
      const result = await callback(tx)

      if (tx.isRolledBack) {
        return {
          success: false,
          error: 'Transaction was rolled back',
          rollback: true,
          executionTime: Date.now() - startTime,
        }
      }

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        rollback: true,
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Execute an enhanced transaction with full ACID support
   */
  async enhancedTransaction<T = any>(
    callback: (tx: EnhancedTransaction) => Promise<T>,
    config?: TransactionConfig
  ): Promise<T> {
    if (!this.config.enableTransactions) {
      throw new Error('Transactions are disabled in configuration')
    }

    const enhancedConfig = {
      isolationLevel: this.config.isolationLevel
        ? this.mapIsolationLevel(this.config.isolationLevel)
        : IsolationLevel.READ_COMMITTED,
      timeout: 30000,
      retryAttempts: 3,
      enableMetrics: this.config.enableMetrics,
      enableLogging: true,
      ...config,
    }

    return TransactionUtils.withRetryableTransaction(
      this.connection,
      callback,
      enhancedConfig
    )
  }

  /**
   * Execute a pre-defined transaction template
   */
  async executeTemplate<T = any>(
    template: string | { operations: any[]; config?: TransactionConfig },
    context?: Record<string, any>
  ): Promise<T[]> {
    let templateObj

    if (typeof template === 'string') {
      // Use pre-defined template
      switch (template) {
        case 'create_user':
          templateObj = TransactionTemplates.createUser(
            context?.userId || crypto.randomUUID(),
            context?.email || '',
            context?.name
          )
          break
        case 'update_preferences':
          templateObj = TransactionTemplates.updateUserPreferences(
            context?.userId || '',
            context?.preferences || {}
          )
          break
        case 'upload_file':
          templateObj = TransactionTemplates.uploadFile(
            context?.fileId || crypto.randomUUID(),
            context?.userId || '',
            context?.filename || '',
            context?.size || 0
          )
          break
        default:
          throw new Error(`Unknown template: ${template}`)
      }
    } else {
      templateObj = template
    }

    return TransactionHelper.executeTemplate<T>(
      this.connection,
      templateObj,
      context
    )
  }

  /**
   * Execute batch operations with optimization
   */
  async executeBatch<T = any>(
    operations: Array<{ sql: string; params?: any[]; expectedResult?: string }>,
    config?: TransactionConfig
  ): Promise<T[]> {
    const batchOperations = operations.map(op => ({
      sql: op.sql,
      params: op.params,
      expectedResult: op.expectedResult as any,
    }))

    return TransactionHelper.executeBatch<T>(
      this.connection,
      batchOperations,
      config
    )
  }

  /**
   * Execute conditional transaction based on a condition
   */
  async executeConditional<T = any>(
    condition: (tx: EnhancedTransaction) => Promise<boolean>,
    trueOperations: Array<{ sql: string; params?: any[] }>,
    falseOperations?: Array<{ sql: string; params?: any[] }>,
    config?: TransactionConfig
  ): Promise<T[]> {
    const trueBatch = trueOperations.map(op => ({
      sql: op.sql,
      params: op.params,
    }))
    const falseBatch = falseOperations?.map(op => ({
      sql: op.sql,
      params: op.params,
    }))

    return TransactionHelper.executeConditional<T>(
      this.connection,
      condition,
      trueBatch,
      falseBatch,
      config
    )
  }

  /**
   * Execute a prepared statement batch
   */
  async batch(
    queries: Array<{ sql: string; params?: any[] }>,
    options?: { timeout?: number; retries?: number }
  ): Promise<any[]> {
    const formattedQueries = queries.map(q => ({
      query: q.sql,
      params: q.params,
    }))

    const result = await this.connection.batch(formattedQueries, options)

    if (!result.success) {
      throw new Error(`Database batch failed: ${result.error}`)
    }

    return result.data || []
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    return this.connection.healthCheck()
  }

  /**
   * Get database metrics
   */
  getMetrics() {
    return this.connection.getMetrics()
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.connection.clearCache()
  }

  /**
   * Close database connection
   */
  close(): void {
    this.connection.close()
  }

  /**
   * Get raw database connection (for advanced usage)
   */
  getRawConnection(): D1Database {
    // Note: This exposes the raw D1Database connection
    // Use with caution as it bypasses connection pooling and metrics
    return (this.connection as any).db
  }

  /**
   * Get transaction manager for advanced usage
   */
  getTransactionManager(): TransactionManager {
    return globalTransactionManager
  }

  /**
   * Get transaction monitor for monitoring
   */
  getTransactionMonitor() {
    return globalTransactionMonitor
  }

  // Private helper methods

  private mapIsolationLevel(level: string): IsolationLevel {
    switch (level.toUpperCase()) {
      case 'READ_UNCOMMITTED':
        return IsolationLevel.READ_UNCOMMITTED
      case 'READ_COMMITTED':
        return IsolationLevel.READ_COMMITTED
      case 'REPEATABLE_READ':
        return IsolationLevel.REPEATABLE_READ
      case 'SERIALIZABLE':
        return IsolationLevel.SERIALIZABLE
      default:
        return IsolationLevel.READ_COMMITTED
    }
  }
}

/**
 * Transaction class for managing database transactions
 */
export class Transaction {
  private connection: DatabaseConnection
  private transactionId: number
  private options: TransactionOptions
  private isCommitted: boolean = false
  private isRolledBack: boolean = false
  private queries: Array<{ sql: string; params?: any[] }> = []

  constructor(
    connection: DatabaseConnection,
    transactionId: number,
    options: TransactionOptions
  ) {
    this.connection = connection
    this.transactionId = transactionId
    this.options = options
  }

  /**
   * Execute a query within the transaction
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction has already been completed')
    }

    this.queries.push({ sql, params })

    const result = await this.connection.execute<T[]>(sql, params, {
      timeout: this.options.timeout,
      retries: 0, // No retries within transactions
    })

    if (!result.success) {
      throw new Error(`Transaction query failed: ${result.error}`)
    }

    return result.data || []
  }

  /**
   * Execute a query and return the first result
   */
  async queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction has already been completed')
    }

    this.queries.push({ sql, params })

    const result = await this.connection.first<T>(sql, params, {
      timeout: this.options.timeout,
      retries: 0,
    })

    if (!result.success) {
      throw new Error(`Transaction query failed: ${result.error}`)
    }

    return result.data || null
  }

  /**
   * Execute a statement within the transaction
   */
  async execute(
    sql: string,
    params?: any[]
  ): Promise<{ changes: number; lastRowId?: number }> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction has already been completed')
    }

    this.queries.push({ sql, params })

    const result = await this.connection.run(sql, params, {
      timeout: this.options.timeout,
      retries: 0,
    })

    if (!result.success) {
      throw new Error(`Transaction execute failed: ${result.error}`)
    }

    return result.data || { changes: 0 }
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction has already been completed')
    }

    // For D1, transactions are automatically committed
    // This is mainly for tracking and consistency
    this.isCommitted = true
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction has already been completed')
    }

    // For D1, we need to handle rollback manually
    // This is a simplified implementation
    this.isRolledBack = true
  }

  /**
   * Get transaction status
   */
  get status(): 'active' | 'committed' | 'rolled_back' {
    if (this.isCommitted) return 'committed'
    if (this.isRolledBack) return 'rolled_back'
    return 'active'
  }

  /**
   * Get transaction queries (for debugging)
   */
  getQueryHistory(): Array<{ sql: string; params?: any[] }> {
    return [...this.queries]
  }

  /**
   * Check if transaction is active
   */
  get isActive(): boolean {
    return !this.isCommitted && !this.isRolledBack
  }

  /**
   * Check if transaction was rolled back
   */
  get isRolledBack(): boolean {
    return this.isRolledBack
  }
}

/**
 * Database pool for managing multiple connections
 */
export class DatabasePool {
  private connections: DatabaseClient[] = []
  private currentIndex: number = 0
  private config: DatabaseClientConfig

  constructor(
    db: D1Database,
    poolSize: number = 5,
    config: DatabaseClientConfig = {}
  ) {
    this.config = config
    this.initializePool(db, poolSize)
  }

  private initializePool(db: D1Database, poolSize: number): void {
    for (let i = 0; i < poolSize; i++) {
      this.connections.push(new DatabaseClient(db, this.config))
    }
  }

  /**
   * Get a database client from the pool
   */
  getClient(): DatabaseClient {
    const client = this.connections[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.connections.length
    return client
  }

  /**
   * Execute a query using any available connection
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T[]> {
    const client = this.getClient()
    return client.query<T>(sql, params, options)
  }

  /**
   * Execute a query and return the first result
   */
  async queryFirst<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<T | null> {
    const client = this.getClient()
    return client.queryFirst<T>(sql, params, options)
  }

  /**
   * Execute a statement
   */
  async execute(
    sql: string,
    params?: any[],
    options?: { timeout?: number; retries?: number }
  ): Promise<{ changes: number; lastRowId?: number }> {
    const client = this.getClient()
    return client.execute(sql, params, options)
  }

  /**
   * Check health of all connections
   */
  async healthCheck(): Promise<boolean> {
    const results = await Promise.all(
      this.connections.map(client => client.healthCheck())
    )
    return results.every(healthy => healthy)
  }

  /**
   * Get aggregate metrics from all connections
   */
  getMetrics() {
    const metrics = this.connections.map(client => client.getMetrics())

    return {
      totalConnections: this.connections.length,
      healthyConnections: metrics.filter(m => m.isHealthy).length,
      totalQueries: metrics.reduce((sum, m) => sum + m.totalQueries, 0),
      successfulQueries: metrics.reduce(
        (sum, m) => sum + m.successfulQueries,
        0
      ),
      failedQueries: metrics.reduce((sum, m) => sum + m.failedQueries, 0),
      averageQueryTime:
        metrics.reduce((sum, m) => sum + m.averageQueryTime, 0) /
        metrics.length,
      connectionPoolSize: metrics.reduce(
        (sum, m) => sum + m.connectionPoolSize,
        0
      ),
    }
  }

  /**
   * Clear cache for all connections
   */
  clearCache(): void {
    this.connections.forEach(client => client.clearCache())
  }

  /**
   * Close all connections
   */
  close(): void {
    this.connections.forEach(client => client.close())
    this.connections = []
  }
}

/**
 * Factory function to create a database client
 */
export function createDatabaseClient(
  db: D1Database,
  config?: DatabaseClientConfig
): DatabaseClient {
  return new DatabaseClient(db, config)
}

/**
 * Factory function to create a database pool
 */
export function createDatabasePool(
  db: D1Database,
  poolSize?: number,
  config?: DatabaseClientConfig
): DatabasePool {
  return new DatabasePool(db, poolSize, config)
}

/**
 * Default database client configuration
 */
export const DEFAULT_DATABASE_CLIENT_CONFIG: DatabaseClientConfig = {
  maxConnections: 10,
  connectionTimeoutMs: 30000,
  retryAttempts: 3,
  retryDelayMs: 1000,
  enableMetrics: true,
  enableTransactions: true,
  isolationLevel: 'READ_COMMITTED',
}

// Enhanced transaction exports
export {
  EnhancedTransaction,
  TransactionManager,
  TransactionUtils,
  TransactionHelper,
  TransactionTemplates,
  globalTransactionManager,
  IsolationLevel,
  TransactionStatus,
  TransactionError,
  type TransactionConfig,
  type TransactionMetrics,
  type BatchOperation,
  type TransactionTemplate,
  type TransactionWorkflow,
  type TransactionContext,
} from './transaction'

export {
  globalTransactionMonitor,
  type TransactionMonitoringConfig,
  type TransactionAlert,
  type TransactionSnapshot,
  type TransactionReport,
} from './transaction-monitoring'

export {
  DistributedTransactionCoordinator,
  TransactionOptimizer,
  type DistributedTransactionCoordinator as DistributedTxCoordinator,
} from './transaction-utils'
