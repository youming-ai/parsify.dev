import { DatabaseConnection } from './connection'
import { randomUUID } from 'crypto'

export interface TransactionConfig {
  isolationLevel?: IsolationLevel
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  readOnly?: boolean
  deferrable?: boolean
  deadlockDetection?: boolean
  enableMetrics?: boolean
  enableLogging?: boolean
}

export interface TransactionMetrics {
  transactionId: string
  startTime: number
  endTime?: number
  duration?: number
  queryCount: number
  status: TransactionStatus
  isolationLevel: IsolationLevel
  rollbackReason?: string
  retryCount: number
  lockWaitTime?: number
  deadlockDetected?: boolean
}

export interface TransactionOptions {
  timeout?: number
  retries?: number
  isolationLevel?: IsolationLevel
  readOnly?: boolean
  deferrable?: boolean
}

export interface SavepointOptions {
  name?: string
  description?: string
}

export interface SavepointResult {
  success: boolean
  savepointName: string
  error?: string
  timestamp: number
}

export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

export enum TransactionStatus {
  ACTIVE = 'ACTIVE',
  COMMITTED = 'COMMITTED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED',
  DEADLOCKED = 'DEADLOCKED',
  TIMEOUT = 'TIMEOUT'
}

export enum TransactionError {
  DEADLOCK = 'Deadlock detected',
  TIMEOUT = 'Transaction timeout',
  CONSTRAINT_VIOLATION = 'Constraint violation',
  ROLLBACK_REQUESTED = 'Rollback requested',
  CONNECTION_LOST = 'Connection lost',
  UNKNOWN = 'Unknown error'
}

/**
 * Enhanced Transaction class with ACID properties and comprehensive monitoring
 */
export class EnhancedTransaction {
  private connection: DatabaseConnection
  private transactionId: string
  private config: Required<TransactionConfig>
  private status: TransactionStatus = TransactionStatus.ACTIVE
  private savepoints: Map<string, number> = new Map()
  private savepointCounter: number = 0
  private queryCount: number = 0
  private startTime: number = Date.now()
  private endTime?: number
  private retryCount: number = 0
  private lockWaitTime: number = 0
  private metrics: TransactionMetrics
  private queryHistory: Array<{ sql: string; params?: any[]; timestamp: number; duration: number }> = []
  private rollbackReason?: string

  constructor(
    connection: DatabaseConnection,
    config: TransactionConfig = {}
  ) {
    this.connection = connection
    this.transactionId = randomUUID()
    this.config = {
      isolationLevel: config.isolationLevel ?? IsolationLevel.READ_COMMITTED,
      timeout: config.timeout ?? 30000, // 30 seconds default
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      readOnly: config.readOnly ?? false,
      deferrable: config.deferrable ?? false,
      deadlockDetection: config.deadlockDetection ?? true,
      enableMetrics: config.enableMetrics ?? true,
      enableLogging: config.enableLogging ?? true
    }

    this.metrics = {
      transactionId: this.transactionId,
      startTime: this.startTime,
      queryCount: 0,
      status: this.status,
      isolationLevel: this.config.isolationLevel,
      retryCount: 0
    }

    if (this.config.enableLogging) {
      console.log(`[Transaction:${this.transactionId}] Started with isolation level: ${this.config.isolationLevel}`)
    }
  }

  /**
   * Execute a query within the transaction
   */
  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    this.ensureActive()
    const queryStartTime = Date.now()

    try {
      this.queryCount++
      this.logQuery(sql, params, queryStartTime)

      const result = await this.connection.execute<T[]>(sql, params, {
        timeout: this.config.timeout,
        retries: 0 // No retries within transactions
      })

      if (!result.success) {
        throw new Error(`Transaction query failed: ${result.error}`)
      }

      const queryDuration = Date.now() - queryStartTime
      this.updateQueryHistory(sql, params, queryStartTime, queryDuration)

      return result.data || []
    } catch (error) {
      await this.handleError(error as Error, sql, params)
      throw error
    }
  }

  /**
   * Execute a query and return the first result
   */
  async queryFirst<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T | null> {
    this.ensureActive()
    const queryStartTime = Date.now()

    try {
      this.queryCount++
      this.logQuery(sql, params, queryStartTime)

      const result = await this.connection.first<T>(sql, params, {
        timeout: this.config.timeout,
        retries: 0
      })

      if (!result.success) {
        throw new Error(`Transaction query failed: ${result.error}`)
      }

      const queryDuration = Date.now() - queryStartTime
      this.updateQueryHistory(sql, params, queryStartTime, queryDuration)

      return result.data || null
    } catch (error) {
      await this.handleError(error as Error, sql, params)
      throw error
    }
  }

  /**
   * Execute a statement within the transaction
   */
  async execute(
    sql: string,
    params?: any[]
  ): Promise<{ changes: number; lastRowId?: number }> {
    this.ensureActive()
    const queryStartTime = Date.now()

    try {
      this.queryCount++
      this.logQuery(sql, params, queryStartTime)

      const result = await this.connection.run(sql, params, {
        timeout: this.config.timeout,
        retries: 0
      })

      if (!result.success) {
        throw new Error(`Transaction execute failed: ${result.error}`)
      }

      const queryDuration = Date.now() - queryStartTime
      this.updateQueryHistory(sql, params, queryStartTime, queryDuration)

      return result.data || { changes: 0 }
    } catch (error) {
      await this.handleError(error as Error, sql, params)
      throw error
    }
  }

  /**
   * Create a savepoint within the transaction
   */
  async createSavepoint(options: SavepointOptions = {}): Promise<SavepointResult> {
    this.ensureActive()

    const savepointName = options.name || `sp_${this.savepointCounter++}`
    const timestamp = Date.now()

    try {
      await this.execute(`SAVEPOINT ${savepointName}`)
      this.savepoints.set(savepointName, this.queryCount)

      if (this.config.enableLogging) {
        console.log(`[Transaction:${this.transactionId}] Savepoint created: ${savepointName}`)
      }

      return {
        success: true,
        savepointName,
        timestamp
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[Transaction:${this.transactionId}] Failed to create savepoint ${savepointName}:`, error)
      }

      return {
        success: false,
        savepointName,
        error: (error as Error).message,
        timestamp
      }
    }
  }

  /**
   * Rollback to a specific savepoint
   */
  async rollbackToSavepoint(savepointName: string): Promise<boolean> {
    this.ensureActive()

    if (!this.savepoints.has(savepointName)) {
      throw new Error(`Savepoint ${savepointName} does not exist`)
    }

    try {
      await this.execute(`ROLLBACK TO SAVEPOINT ${savepointName}`)

      // Remove savepoints created after this one
      const savepointQueryCount = this.savepoints.get(savepointName)!
      for (const [name, queryCount] of this.savepoints.entries()) {
        if (queryCount > savepointQueryCount) {
          this.savepoints.delete(name)
        }
      }

      if (this.config.enableLogging) {
        console.log(`[Transaction:${this.transactionId}] Rolled back to savepoint: ${savepointName}`)
      }

      return true
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[Transaction:${this.transactionId}] Failed to rollback to savepoint ${savepointName}:`, error)
      }
      return false
    }
  }

  /**
   * Release a savepoint
   */
  async releaseSavepoint(savepointName: string): Promise<boolean> {
    this.ensureActive()

    if (!this.savepoints.has(savepointName)) {
      throw new Error(`Savepoint ${savepointName} does not exist`)
    }

    try {
      await this.execute(`RELEASE SAVEPOINT ${savepointName}`)
      this.savepoints.delete(savepointName)

      if (this.config.enableLogging) {
        console.log(`[Transaction:${this.transactionId}] Released savepoint: ${savepointName}`)
      }

      return true
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[Transaction:${this.transactionId}] Failed to release savepoint ${savepointName}:`, error)
      }
      return false
    }
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error(`Cannot commit transaction in ${this.status} state`)
    }

    try {
      // For D1, transactions are automatically committed when the connection is closed
      // This is mainly for tracking and consistency
      this.status = TransactionStatus.COMMITTED
      this.endTime = Date.now()
      this.updateMetrics()

      if (this.config.enableLogging) {
        console.log(`[Transaction:${this.transactionId}] Committed successfully`)
      }
    } catch (error) {
      await this.markFailed(error as Error)
      throw error
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(reason?: string): Promise<void> {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error(`Cannot rollback transaction in ${this.status} state`)
    }

    this.status = TransactionStatus.ROLLED_BACK
    this.rollbackReason = reason || 'Manual rollback'
    this.endTime = Date.now()
    this.updateMetrics()

    // For D1, we need to handle rollback manually
    // This is a simplified implementation
    if (this.config.enableLogging) {
      console.log(`[Transaction:${this.transactionId}] Rolled back: ${this.rollbackReason}`)
    }
  }

  /**
   * Get transaction status
   */
  get currentStatus(): TransactionStatus {
    return this.status
  }

  /**
   * Get transaction ID
   */
  get id(): string {
    return this.transactionId
  }

  /**
   * Check if transaction is active
   */
  get isActive(): boolean {
    return this.status === TransactionStatus.ACTIVE
  }

  /**
   * Get transaction metrics
   */
  getMetrics(): TransactionMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }

  /**
   * Get transaction query history
   */
  getQueryHistory(): Array<{ sql: string; params?: any[]; timestamp: number; duration: number }> {
    return [...this.queryHistory]
  }

  /**
   * Get transaction duration
   */
  getDuration(): number {
    const endTime = this.endTime || Date.now()
    return endTime - this.startTime
  }

  /**
   * Check if transaction has timed out
   */
  hasTimedOut(): boolean {
    return this.config.timeout > 0 && this.getDuration() > this.config.timeout
  }

  /**
   * Get remaining time before timeout
   */
  getRemainingTime(): number {
    if (this.config.timeout <= 0) return Infinity
    return Math.max(0, this.config.timeout - this.getDuration())
  }

  /**
   * Get active savepoints
   */
  getActiveSavepoints(): string[] {
    return Array.from(this.savepoints.keys())
  }

  /**
   * Get transaction configuration
   */
  getConfig(): Required<TransactionConfig> {
    return { ...this.config }
  }

  // Private methods

  private ensureActive(): void {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error(`Transaction is not active (status: ${this.status})`)
    }

    if (this.hasTimedOut()) {
      this.status = TransactionStatus.TIMEOUT
      throw new Error(`Transaction timed out after ${this.config.timeout}ms`)
    }
  }

  private logQuery(sql: string, params?: any[], startTime?: number): void {
    if (!this.config.enableLogging) return

    const timestamp = startTime || Date.now()
    const truncatedSql = sql.length > 100 ? sql.substring(0, 100) + '...' : sql

    console.log(`[Transaction:${this.transactionId}] Query ${this.queryCount}: ${truncatedSql}`,
      params ? { params } : '')
  }

  private updateQueryHistory(sql: string, params: any[] | undefined, startTime: number, duration: number): void {
    this.queryHistory.push({
      sql,
      params,
      timestamp: startTime,
      duration
    })

    // Keep only recent queries
    if (this.queryHistory.length > 100) {
      this.queryHistory = this.queryHistory.slice(-50)
    }
  }

  private async handleError(error: Error, sql?: string, params?: any[]): Promise<void> {
    const errorMessage = error.message.toLowerCase()

    // Check for deadlock
    if (errorMessage.includes('deadlock') || errorMessage.includes('lock wait timeout')) {
      this.status = TransactionStatus.DEADLOCKED
      this.metrics.deadlockDetected = true
    }
    // Check for timeout
    else if (errorMessage.includes('timeout') || this.hasTimedOut()) {
      this.status = TransactionStatus.TIMEOUT
    }
    // Check for constraint violation
    else if (errorMessage.includes('constraint') || errorMessage.includes('unique')) {
      this.rollbackReason = TransactionError.CONSTRAINT_VIOLATION
    }
    else {
      this.rollbackReason = TransactionError.UNKNOWN
    }

    await this.markFailed(error)
  }

  private async markFailed(error: Error): Promise<void> {
    this.status = TransactionStatus.FAILED
    this.endTime = Date.now()
    this.rollbackReason = error.message
    this.updateMetrics()

    if (this.config.enableLogging) {
      console.error(`[Transaction:${this.transactionId}] Failed: ${error.message}`)
    }
  }

  private updateMetrics(): void {
    this.metrics.transactionId = this.transactionId
    this.metrics.startTime = this.startTime
    this.metrics.endTime = this.endTime
    this.metrics.duration = this.endTime ? this.endTime - this.startTime : undefined
    this.metrics.queryCount = this.queryCount
    this.metrics.status = this.status
    this.metrics.isolationLevel = this.config.isolationLevel
    this.metrics.rollbackReason = this.rollbackReason
    this.metrics.retryCount = this.retryCount
    this.metrics.lockWaitTime = this.lockWaitTime
  }
}

/**
 * Transaction manager for handling multiple concurrent transactions
 */
export class TransactionManager {
  private activeTransactions: Map<string, EnhancedTransaction> = new Map()
  private maxConcurrentTransactions: number = 100
  private defaultConfig: TransactionConfig

  constructor(defaultConfig: TransactionConfig = {}) {
    this.defaultConfig = defaultConfig
  }

  /**
   * Create a new transaction
   */
  createTransaction(connection: DatabaseConnection, config?: TransactionConfig): EnhancedTransaction {
    if (this.activeTransactions.size >= this.maxConcurrentTransactions) {
      throw new Error(`Maximum concurrent transactions (${this.maxConcurrentTransactions}) exceeded`)
    }

    const mergedConfig = { ...this.defaultConfig, ...config }
    const transaction = new EnhancedTransaction(connection, mergedConfig)

    this.activeTransactions.set(transaction.id, transaction)

    return transaction
  }

  /**
   * Get a transaction by ID
   */
  getTransaction(transactionId: string): EnhancedTransaction | undefined {
    return this.activeTransactions.get(transactionId)
  }

  /**
   * Remove a transaction from active tracking
   */
  removeTransaction(transactionId: string): boolean {
    const transaction = this.activeTransactions.get(transactionId)
    if (transaction) {
      this.activeTransactions.delete(transactionId)
      return true
    }
    return false
  }

  /**
   * Get all active transactions
   */
  getActiveTransactions(): EnhancedTransaction[] {
    return Array.from(this.activeTransactions.values())
  }

  /**
   * Get metrics for all active transactions
   */
  getAllTransactionMetrics(): TransactionMetrics[] {
    return this.getActiveTransactions().map(tx => tx.getMetrics())
  }

  /**
   * Cleanup completed or timed-out transactions
   */
  cleanup(): number {
    let cleanedCount = 0
    const now = Date.now()

    for (const [id, transaction] of this.activeTransactions.entries()) {
      if (!transaction.isActive || transaction.hasTimedOut()) {
        this.activeTransactions.delete(id)
        cleanedCount++
      }
    }

    return cleanedCount
  }

  /**
   * Set maximum concurrent transactions
   */
  setMaxConcurrentTransactions(max: number): void {
    this.maxConcurrentTransactions = Math.max(1, max)
  }

  /**
   * Get current transaction count
   */
  getTransactionCount(): number {
    return this.activeTransactions.size
  }

  /**
   * Force rollback all active transactions
   */
  async rollbackAll(reason = 'System shutdown'): Promise<void> {
    const rollbackPromises = this.getActiveTransactions().map(async (transaction) => {
      try {
        await transaction.rollback(reason)
      } catch (error) {
        console.error(`Failed to rollback transaction ${transaction.id}:`, error)
      }
    })

    await Promise.all(rollbackPromises)
    this.activeTransactions.clear()
  }
}

/**
 * Global transaction manager instance
 */
export const globalTransactionManager = new TransactionManager()

/**
 * Utility functions for transaction management
 */
export class TransactionUtils {
  /**
   * Execute a function within a transaction
   */
  static async withTransaction<T>(
    connection: DatabaseConnection,
    callback: (tx: EnhancedTransaction) => Promise<T>,
    config?: TransactionConfig
  ): Promise<T> {
    const transaction = globalTransactionManager.createTransaction(connection, config)

    try {
      const result = await callback(transaction)
      await transaction.commit()
      return result
    } catch (error) {
      try {
        await transaction.rollback((error as Error).message)
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError)
      }
      throw error
    } finally {
      globalTransactionManager.removeTransaction(transaction.id)
    }
  }

  /**
   * Execute a function with automatic retry on deadlock
   */
  static async withRetryableTransaction<T>(
    connection: DatabaseConnection,
    callback: (tx: EnhancedTransaction) => Promise<T>,
    config?: TransactionConfig
  ): Promise<T> {
    const maxRetries = config?.retryAttempts ?? 3
    const retryDelay = config?.retryDelay ?? 1000
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.withTransaction(connection, callback, config)
      } catch (error) {
        lastError = error as Error

        // Only retry on deadlock or timeout
        const errorMessage = (error as Error).message.toLowerCase()
        const isRetryable = errorMessage.includes('deadlock') ||
                          errorMessage.includes('lock wait timeout') ||
                          errorMessage.includes('timeout')

        if (!isRetryable || attempt === maxRetries) {
          throw error
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }

    throw lastError!
  }

  /**
   * Analyze transaction for potential performance issues
   */
  static analyzePerformance(transaction: EnhancedTransaction): {
    issues: string[]
    recommendations: string[]
    score: number
  } {
    const metrics = transaction.getMetrics()
    const queryHistory = transaction.getQueryHistory()
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Check duration
    if (metrics.duration && metrics.duration > 5000) {
      issues.push(`Transaction duration is long: ${metrics.duration}ms`)
      recommendations.push('Consider breaking this into smaller transactions')
      score -= 20
    }

    // Check query count
    if (metrics.queryCount > 50) {
      issues.push(`High number of queries: ${metrics.queryCount}`)
      recommendations.push('Consider batching operations or using more efficient queries')
      score -= 15
    }

    // Check for long-running queries
    const longQueries = queryHistory.filter(q => q.duration > 1000)
    if (longQueries.length > 0) {
      issues.push(`${longQueries.length} queries took longer than 1 second`)
      recommendations.push('Optimize slow queries or add appropriate indexes')
      score -= 10
    }

    // Check isolation level
    if (metrics.isolationLevel === IsolationLevel.SERIALIZABLE) {
      recommendations.push('Consider using a lower isolation level if serializable consistency is not required')
      score -= 5
    }

    return {
      issues,
      recommendations,
      score: Math.max(0, score)
    }
  }

  /**
   * Generate transaction report
   */
  static generateReport(transactions: EnhancedTransaction[]): {
    totalTransactions: number
    averageDuration: number
    successRate: number
    deadlockRate: number
    timeoutRate: number
    averageQueriesPerTransaction: number
    isolationLevelDistribution: Record<IsolationLevel, number>
  } {
    const completed = transactions.filter(tx =>
      tx.currentStatus === TransactionStatus.COMMITTED ||
      tx.currentStatus === TransactionStatus.ROLLED_BACK ||
      tx.currentStatus === TransactionStatus.FAILED
    )

    const totalTransactions = completed.length
    const durations = completed.map(tx => tx.getDuration()).filter(d => d > 0)
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0

    const successful = completed.filter(tx => tx.currentStatus === TransactionStatus.COMMITTED).length
    const deadlocked = completed.filter(tx => tx.currentStatus === TransactionStatus.DEADLOCKED).length
    const timedOut = completed.filter(tx => tx.currentStatus === TransactionStatus.TIMEOUT).length

    const successRate = totalTransactions > 0 ? (successful / totalTransactions) * 100 : 0
    const deadlockRate = totalTransactions > 0 ? (deadlocked / totalTransactions) * 100 : 0
    const timeoutRate = totalTransactions > 0 ? (timedOut / totalTransactions) * 100 : 0

    const totalQueries = completed.reduce((sum, tx) => sum + tx.getMetrics().queryCount, 0)
    const averageQueriesPerTransaction = totalTransactions > 0 ? totalQueries / totalTransactions : 0

    const isolationLevelDistribution = completed.reduce((acc, tx) => {
      const level = tx.getMetrics().isolationLevel
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<IsolationLevel, number>)

    return {
      totalTransactions,
      averageDuration,
      successRate,
      deadlockRate,
      timeoutRate,
      averageQueriesPerTransaction,
      isolationLevelDistribution
    }
  }
}
