import type { DatabaseConnection } from './connection'
import {
  type EnhancedTransaction,
  globalTransactionManager,
  IsolationLevel,
  type TransactionConfig,
  TransactionUtils,
} from './transaction'
import { globalTransactionMonitor } from './transaction-monitoring'

export interface BatchOperation<T = any> {
  sql: string
  params?: any[]
  expectedResult?: 'any' | 'result' | 'first' | 'changes'
  transform?: (result: any) => T
}

export interface TransactionTemplate {
  name: string
  description?: string
  operations: BatchOperation[]
  config?: TransactionConfig
  validate?: (results: any[]) => boolean
  onSuccess?: (results: any[]) => void
  onError?: (error: Error, results?: any[]) => void
}

export interface TransactionWorkflow {
  steps: Array<{
    name: string
    execute: (tx: EnhancedTransaction, context: any) => Promise<any>
    rollback?: (tx: EnhancedTransaction, context: any, result: any) => Promise<void>
    retries?: number
    timeout?: number
  }>
  config?: TransactionConfig
  onStepComplete?: (stepName: string, result: any) => void
  onStepError?: (stepName: string, error: Error) => void
  onComplete?: (results: any[]) => void
  onError?: (error: Error) => void
}

export interface TransactionContext {
  transactionId: string
  startTime: number
  stepIndex: number
  data: Record<string, any>
  metadata: Record<string, any>
}

/**
 * Enhanced transaction utility functions for common patterns
 */
export class TransactionHelper {
  /**
   * Execute multiple operations in a batch within a transaction
   */
  static async executeBatch<T = any>(
    connection: DatabaseConnection,
    operations: BatchOperation<T>[],
    config?: TransactionConfig
  ): Promise<T[]> {
    return TransactionUtils.withTransaction(
      connection,
      async tx => {
        const results: T[] = []

        for (const operation of operations) {
          let result: any

          switch (operation.expectedResult) {
            case 'first':
              result = await tx.queryFirst(operation.sql, operation.params)
              break
            case 'changes':
              result = await tx.execute(operation.sql, operation.params)
              break
            default:
              result = await tx.query(operation.sql, operation.params)
              break
          }

          if (operation.transform) {
            result = operation.transform(result)
          }

          results.push(result)
        }

        return results
      },
      config
    )
  }

  /**
   * Execute a pre-defined transaction template
   */
  static async executeTemplate<T = any>(
    connection: DatabaseConnection,
    template: TransactionTemplate,
    _context?: Record<string, any>
  ): Promise<T[]> {
    const enhancedConfig = {
      ...template.config,
      enableLogging: true,
      enableMetrics: true,
    }

    return TransactionUtils.withTransaction(
      connection,
      async tx => {
        try {
          const results = await TransactionHelper.executeBatch<T>(
            tx.connection,
            template.operations,
            enhancedConfig
          )

          // Validate results if validator is provided
          if (template.validate && !template.validate(results)) {
            throw new Error(`Transaction template '${template.name}' validation failed`)
          }

          // Call success callback
          if (template.onSuccess) {
            template.onSuccess(results)
          }

          return results
        } catch (error) {
          // Call error callback
          if (template.onError) {
            template.onError(error as Error)
          }
          throw error
        }
      },
      enhancedConfig
    )
  }

  /**
   * Execute a complex workflow with multiple steps and rollback support
   */
  static async executeWorkflow<T = any>(
    connection: DatabaseConnection,
    workflow: TransactionWorkflow,
    initialContext?: Record<string, any>
  ): Promise<T[]> {
    const transaction = globalTransactionManager.createTransaction(connection, workflow.config)
    const context: TransactionContext = {
      transactionId: transaction.id,
      startTime: Date.now(),
      stepIndex: 0,
      data: initialContext || {},
      metadata: {},
    }

    const results: T[] = []
    const completedSteps: Array<{ step: any; result: any }> = []

    try {
      for (const step of workflow.steps) {
        context.stepIndex++

        try {
          // Execute step with timeout if specified
          const result = await TransactionHelper.executeStepWithTimeout(
            transaction,
            step,
            context,
            step.timeout || 30000
          )

          results.push(result)
          completedSteps.push({ step, result })
          context.data[step.name] = result

          // Call step completion callback
          if (workflow.onStepComplete) {
            workflow.onStepComplete(step.name, result)
          }
        } catch (error) {
          // Call step error callback
          if (workflow.onStepError) {
            workflow.onStepError(step.name, error as Error)
          }

          // Attempt rollback of completed steps
          await TransactionHelper.rollbackCompletedSteps(transaction, completedSteps, context)

          throw error
        }
      }

      await transaction.commit()

      // Call workflow completion callback
      if (workflow.onComplete) {
        workflow.onComplete(results)
      }

      return results
    } catch (error) {
      try {
        await transaction.rollback((error as Error).message)
      } catch (rollbackError) {
        console.error('Failed to rollback workflow transaction:', rollbackError)
      }

      // Call workflow error callback
      if (workflow.onError) {
        workflow.onError(error as Error)
      }

      throw error
    } finally {
      globalTransactionManager.removeTransaction(transaction.id)
      globalTransactionMonitor.recordTransaction(transaction)
    }
  }

  /**
   * Execute operations with conditional logic
   */
  static async executeConditional<T = any>(
    connection: DatabaseConnection,
    condition: (tx: EnhancedTransaction) => Promise<boolean>,
    trueOperations: BatchOperation<T>[],
    falseOperations?: BatchOperation<T>[],
    config?: TransactionConfig
  ): Promise<T[]> {
    return TransactionUtils.withTransaction(
      connection,
      async tx => {
        const conditionResult = await condition(tx)
        const operations = conditionResult ? trueOperations : falseOperations || []

        if (operations.length === 0) {
          return [] as T[]
        }

        return TransactionHelper.executeBatch<T>(tx.connection, operations, config)
      },
      config
    )
  }

  /**
   * Execute operations with retry and circuit breaker pattern
   */
  static async executeWithCircuitBreaker<T = any>(
    connection: DatabaseConnection,
    operations: BatchOperation<T>[],
    config?: TransactionConfig & {
      maxRetries?: number
      retryDelay?: number
      failureThreshold?: number
      recoveryTimeout?: number
    }
  ): Promise<T[]> {
    const maxRetries = config?.maxRetries ?? 3
    const retryDelay = config?.retryDelay ?? 1000
    const failureThreshold = config?.failureThreshold ?? 5
    const recoveryTimeout = config?.recoveryTimeout ?? 60000

    let consecutiveFailures = 0
    let lastFailureTime = 0

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Check circuit breaker
      if (consecutiveFailures >= failureThreshold) {
        const timeSinceLastFailure = Date.now() - lastFailureTime
        if (timeSinceLastFailure < recoveryTimeout) {
          throw new Error(
            `Circuit breaker is open. ${Math.ceil((recoveryTimeout - timeSinceLastFailure) / 1000)}s remaining until retry.`
          )
        } else {
          // Reset circuit breaker
          consecutiveFailures = 0
        }
      }

      try {
        const result = await TransactionHelper.executeBatch<T>(connection, operations, config)

        // Reset failure count on success
        consecutiveFailures = 0
        return result
      } catch (error) {
        consecutiveFailures++
        lastFailureTime = Date.now()

        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * 2 ** attempt))
      }
    }

    throw new Error('Circuit breaker: All retry attempts exhausted')
  }

  /**
   * Create a distributed transaction coordinator for multi-database operations
   */
  static createDistributedCoordinator(): DistributedTransactionCoordinator {
    return new DistributedTransactionCoordinator()
  }

  /**
   * Generate transaction ID with prefix
   */
  static generateTransactionId(prefix = 'tx'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate transaction configuration
   */
  static validateConfig(config: TransactionConfig): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (config.timeout && config.timeout < 1000) {
      errors.push('Transaction timeout must be at least 1000ms')
    }

    if (config.retryAttempts && config.retryAttempts > 10) {
      errors.push('Retry attempts should not exceed 10')
    }

    if (config.retryDelay && config.retryDelay > 30000) {
      errors.push('Retry delay should not exceed 30 seconds')
    }

    if (
      config.isolationLevel === IsolationLevel.SERIALIZABLE &&
      config.timeout &&
      config.timeout > 60000
    ) {
      errors.push('Serializable transactions should have shorter timeouts to prevent deadlocks')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Private helper methods

  private static async executeStepWithTimeout<T>(
    tx: EnhancedTransaction,
    step: any,
    context: TransactionContext,
    timeout: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Step '${step.name}' timed out after ${timeout}ms`))
      }, timeout)

      try {
        const result = await step.execute(tx, context)
        clearTimeout(timeoutId)
        resolve(result)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  private static async rollbackCompletedSteps(
    tx: EnhancedTransaction,
    completedSteps: Array<{ step: any; result: any }>,
    context: TransactionContext
  ): Promise<void> {
    // Rollback in reverse order
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const { step, result } = completedSteps[i]

      if (step.rollback) {
        try {
          await step.rollback(tx, context, result)
        } catch (rollbackError) {
          console.error(`Failed to rollback step '${step.name}':`, rollbackError)
        }
      }
    }
  }
}

/**
 * Pre-defined transaction templates for common operations
 */
export class TransactionTemplates {
  /**
   * Template for user creation with audit logging
   */
  static createUser(userId: string, email: string, name?: string): TransactionTemplate {
    return {
      name: 'create_user',
      description: 'Create a new user with audit logging',
      operations: [
        {
          sql: 'INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          params: [userId, email, name || null, Date.now(), Date.now()],
          expectedResult: 'changes',
        },
        {
          sql: 'INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          params: [
            TransactionHelper.generateTransactionId('audit'),
            userId,
            'user_created',
            'user',
            userId,
            Date.now(),
          ],
          expectedResult: 'changes',
        },
      ],
      config: {
        isolationLevel: IsolationLevel.READ_COMMITTED,
        timeout: 10000,
      },
      validate: results => {
        return results.every(result => result && result.changes > 0)
      },
    }
  }

  /**
   * Template for updating user with preference update
   */
  static updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): TransactionTemplate {
    return {
      name: 'update_user_preferences',
      description: 'Update user preferences with timestamp',
      operations: [
        {
          sql: 'UPDATE users SET preferences = ?, updated_at = ? WHERE id = ?',
          params: [JSON.stringify(preferences), Date.now(), userId],
          expectedResult: 'changes',
        },
        {
          sql: 'SELECT * FROM users WHERE id = ?',
          params: [userId],
          expectedResult: 'first',
        },
      ],
      config: {
        isolationLevel: IsolationLevel.READ_COMMITTED,
        timeout: 5000,
      },
    }
  }

  /**
   * Template for file upload with quota check
   */
  static uploadFile(
    fileId: string,
    userId: string,
    filename: string,
    size: number
  ): TransactionTemplate {
    return {
      name: 'upload_file',
      description: 'Upload file and update user quota',
      operations: [
        {
          sql: 'SELECT COALESCE(SUM(size), 0) as total_size FROM file_uploads WHERE user_id = ?',
          params: [userId],
          expectedResult: 'first',
          transform: result => result?.total_size || 0,
        },
        {
          sql: 'SELECT storage_limit FROM user_quotas WHERE user_id = ?',
          params: [userId],
          expectedResult: 'first',
          transform: result => result?.storage_limit || 1000000000, // 1GB default
        },
        {
          sql: 'INSERT INTO file_uploads (id, user_id, filename, size, created_at) VALUES (?, ?, ?, ?, ?)',
          params: [fileId, userId, filename, size, Date.now()],
          expectedResult: 'changes',
        },
      ],
      config: {
        isolationLevel: IsolationLevel.SERIALIZABLE,
        timeout: 15000,
      },
      validate: results => {
        const currentUsage = results[0] as number
        const storageLimit = results[1] as number
        const uploadResult = results[2] as any

        return currentUsage + size <= storageLimit && uploadResult?.changes > 0
      },
      onError: error => {
        if (error.message.includes('constraint') || error.message.includes('quota')) {
          throw new Error('Storage quota exceeded')
        }
        throw error
      },
    }
  }

  /**
   * Template for batch operations with savepoints
   */
  static batchUpdate(
    updates: Array<{ table: string; id: string; data: Record<string, any> }>
  ): TransactionTemplate {
    const operations: BatchOperation[] = []

    for (const update of updates) {
      const setClause = Object.keys(update.data)
        .map(key => `${key} = ?`)
        .join(', ')
      const values = [...Object.values(update.data), update.id]

      operations.push({
        sql: `UPDATE ${update.table} SET ${setClause} WHERE id = ?`,
        params: values,
        expectedResult: 'changes',
      })
    }

    return {
      name: 'batch_update',
      description: `Batch update ${updates.length} records`,
      operations,
      config: {
        isolationLevel: IsolationLevel.READ_COMMITTED,
        timeout: 30000,
      },
      validate: results => {
        return results.every(result => result && result.changes > 0)
      },
    }
  }
}

/**
 * Distributed transaction coordinator for multi-database operations
 */
export class DistributedTransactionCoordinator {
  private participants: Map<string, DatabaseConnection> = new Map()
  private transactionId: string
  private status: 'preparing' | 'prepared' | 'committing' | 'committed' | 'aborting' | 'aborted' =
    'preparing'

  constructor() {
    this.transactionId = TransactionHelper.generateTransactionId('dtx')
  }

  /**
   * Add a participant database
   */
  addParticipant(name: string, connection: DatabaseConnection): void {
    this.participants.set(name, connection)
  }

  /**
   * Execute distributed transaction using two-phase commit
   */
  async execute(operations: Record<string, BatchOperation[]>): Promise<any[]> {
    const results: Record<string, any[]> = {}

    try {
      // Phase 1: Prepare all participants
      await this.preparePhase()

      // Phase 2: Execute operations on all participants
      for (const [participantName, participantOperations] of Object.entries(operations)) {
        const connection = this.participants.get(participantName)
        if (!connection) {
          throw new Error(`Participant '${participantName}' not found`)
        }

        results[participantName] = await TransactionHelper.executeBatch(
          connection,
          participantOperations,
          {
            enableLogging: true,
            enableMetrics: true,
            timeout: 30000,
          }
        )
      }

      // Phase 3: Commit all participants
      await this.commitPhase()

      return Object.values(results).flat()
    } catch (error) {
      // Abort all participants
      await this.abortPhase()
      throw error
    }
  }

  private async preparePhase(): Promise<void> {
    this.status = 'preparing'

    // In a real implementation, this would prepare all participants
    // For D1, we simulate this by checking connectivity
    for (const [name, connection] of this.participants.entries()) {
      try {
        await connection.first('SELECT 1')
      } catch (error) {
        throw new Error(`Failed to prepare participant '${name}': ${error}`)
      }
    }

    this.status = 'prepared'
  }

  private async commitPhase(): Promise<void> {
    this.status = 'committing'

    // In a real implementation, this would commit all participants
    // For D1, transactions are auto-committed, so we just update status
    this.status = 'committed'
  }

  private async abortPhase(): Promise<void> {
    this.status = 'aborting'

    // In a real implementation, this would rollback all participants
    // For D1, we just update status
    this.status = 'aborted'
  }

  getTransactionId(): string {
    return this.transactionId
  }

  getStatus(): string {
    return this.status
  }
}

/**
 * Performance optimization utilities
 */
export class TransactionOptimizer {
  /**
   * Analyze and optimize transaction batch
   */
  static optimizeBatch(operations: BatchOperation[]): BatchOperation[] {
    const optimized: BatchOperation[] = []
    const selectGroups: Record<string, BatchOperation[]> = {}

    // Group SELECT operations by table
    for (const op of operations) {
      if (op.sql.trim().toUpperCase().startsWith('SELECT')) {
        const tableMatch = op.sql.match(/FROM\s+(\w+)/i)
        const table = tableMatch ? tableMatch[1] : 'unknown'

        if (!selectGroups[table]) {
          selectGroups[table] = []
        }
        selectGroups[table].push(op)
      } else {
        optimized.push(op)
      }
    }

    // Optimize SELECT groups by combining similar queries
    for (const [_table, selectOps] of Object.entries(selectGroups)) {
      if (selectOps.length === 1) {
        optimized.push(selectOps[0])
      } else {
        // Try to combine SELECT operations
        const combined = TransactionOptimizer.tryCombineSelects(selectOps)
        if (combined) {
          optimized.push(combined)
        } else {
          optimized.push(...selectOps)
        }
      }
    }

    return optimized
  }

  /**
   * Suggest optimal isolation level based on operations
   */
  static suggestIsolationLevel(operations: BatchOperation[]): IsolationLevel {
    const hasWrites = operations.some(op => !op.sql.trim().toUpperCase().startsWith('SELECT'))
    const hasJoins = operations.some(op => op.sql.toUpperCase().includes(' JOIN '))
    const hasAggregates = operations.some(
      op =>
        op.sql.toUpperCase().includes('GROUP BY') ||
        op.sql.toUpperCase().includes('COUNT(') ||
        op.sql.toUpperCase().includes('SUM(')
    )

    if (hasWrites && (hasJoins || hasAggregates)) {
      return IsolationLevel.REPEATABLE_READ
    } else if (hasWrites) {
      return IsolationLevel.READ_COMMITTED
    } else {
      return IsolationLevel.READ_UNCOMMITTED
    }
  }

  /**
   * Estimate transaction execution time
   */
  static estimateExecutionTime(operations: BatchOperation[]): number {
    let totalTime = 0

    for (const op of operations) {
      const sql = op.sql.toUpperCase()

      if (sql.includes('SELECT')) {
        totalTime += 50 // SELECT: ~50ms
      } else if (sql.includes('INSERT')) {
        totalTime += 100 // INSERT: ~100ms
      } else if (sql.includes('UPDATE')) {
        totalTime += 150 // UPDATE: ~150ms
      } else if (sql.includes('DELETE')) {
        totalTime += 200 // DELETE: ~200ms
      } else {
        totalTime += 100 // Default: ~100ms
      }
    }

    return totalTime
  }

  private static tryCombineSelects(operations: BatchOperation[]): BatchOperation | null {
    // Simple implementation - would need more sophisticated query analysis
    if (operations.length !== 2) return null

    const [op1, op2] = operations

    // Check if they're selecting from the same table with similar conditions
    const table1 = op1.sql.match(/FROM\s+(\w+)/i)?.[1]
    const table2 = op2.sql.match(/FROM\s+(\w+)/i)?.[1]

    if (table1 !== table2) return null

    // For now, don't combine - would need more complex SQL parsing
    return null
  }
}
