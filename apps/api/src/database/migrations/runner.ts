import type { D1Database } from '@cloudflare/workers-types'
import { DatabaseClient } from '../client'
import { createMigrationStorage, type MigrationStorage } from './storage'
import {
  DEFAULT_DATABASE_CLIENT_CONFIG,
  type Migration,
  type MigrationContext,
  type MigrationHook,
  type MigrationLogger,
  type MigrationOptions,
  type MigrationPlan,
  type MigrationResult,
  MigrationStatus,
  type MigrationValidationError,
  type RollbackResult,
} from './types'

/**
 * Main migration runner for D1 database
 */
export class MigrationRunner {
  private db: DatabaseClient
  private storage: MigrationStorage
  private config: Required<MigrationOptions>
  private logger: MigrationLogger
  private hooks: {
    beforeMigration?: MigrationHook
    afterMigration?: MigrationHook
    beforeRollback?: MigrationHook
    afterRollback?: MigrationHook
    onValidationError?: MigrationHook
  } = {}

  constructor(
    db: D1Database,
    options: {
      storage?: MigrationStorage
      logger?: MigrationLogger
      hooks?: Partial<typeof MigrationRunner.prototype.hooks>
    } & MigrationOptions = {}
  ) {
    this.db = new DatabaseClient(db, DEFAULT_DATABASE_CLIENT_CONFIG)
    this.storage = options.storage || createMigrationStorage(db)
    this.logger = options.logger || this.createDefaultLogger()
    this.hooks = options.hooks || {}

    this.config = {
      dryRun: options.dryRun ?? false,
      force: options.force ?? false,
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      validateChecksums: options.validateChecksums ?? true,
      stopOnFirstError: options.stopOnFirstError ?? true,
      batch: options.batch ?? false,
    }
  }

  /**
   * Initialize the migration system
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing migration runner')

    await this.storage.initialize()

    this.logger.info('Migration runner initialized successfully')
  }

  /**
   * Run a single migration
   */
  async runMigration(
    migration: Migration,
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now()
    const mergedOptions = { ...this.config, ...options }
    const context: MigrationContext = {
      action: 'up',
      dryRun: mergedOptions.dryRun!,
      options: mergedOptions,
      startTime,
      logger: this.logger,
    }

    this.logger.info('Starting migration', {
      id: migration.id,
      version: migration.version,
      name: migration.name,
      dryRun: mergedOptions.dryRun,
    })

    try {
      // Run before migration hook
      if (this.hooks.beforeMigration) {
        await this.hooks.beforeMigration(migration, context)
      }

      // Update status to running
      if (!mergedOptions.dryRun) {
        await this.storage.updateMigrationStatus(migration.id, MigrationStatus.RUNNING)
      }

      // Execute the migration
      if (mergedOptions.dryRun) {
        this.logger.info('[DRY RUN] Would execute migration SQL', {
          sql: migration.up.substring(0, 200) + (migration.up.length > 200 ? '...' : ''),
        })
      } else {
        await this.executeMigrationSQL(migration.up, mergedOptions)
      }

      const executionTime = Date.now() - startTime

      // Record successful migration
      if (!mergedOptions.dryRun) {
        await this.storage.recordMigration(migration, executionTime)
      }

      // Run after migration hook
      if (this.hooks.afterMigration) {
        await this.hooks.afterMigration(migration, context)
      }

      this.logger.info('Migration completed successfully', {
        id: migration.id,
        version: migration.version,
        executionTime,
      })

      return {
        migration: {
          ...migration,
          status: MigrationStatus.COMPLETED,
          appliedAt: Date.now(),
          executionTime,
        },
        success: true,
        executionTime,
        dryRun: mergedOptions.dryRun,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = (error as Error).message

      this.logger.error('Migration failed', {
        id: migration.id,
        version: migration.version,
        error: errorMessage,
        executionTime,
      })

      // Update status to failed
      if (!mergedOptions.dryRun) {
        await this.storage.updateMigrationStatus(migration.id, MigrationStatus.FAILED, errorMessage)
      }

      return {
        migration: {
          ...migration,
          status: MigrationStatus.FAILED,
          errorMessage,
        },
        success: false,
        executionTime,
        error: errorMessage,
        dryRun: mergedOptions.dryRun,
      }
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(
    migration: Migration,
    options: Partial<MigrationOptions> = {}
  ): Promise<RollbackResult> {
    const startTime = Date.now()
    const mergedOptions = { ...this.config, ...options }
    const context: MigrationContext = {
      action: 'down',
      dryRun: mergedOptions.dryRun!,
      options: mergedOptions,
      startTime,
      logger: this.logger,
    }

    if (!migration.down) {
      throw new Error(`Migration ${migration.version} does not have rollback SQL`)
    }

    this.logger.info('Starting migration rollback', {
      id: migration.id,
      version: migration.version,
      name: migration.name,
      dryRun: mergedOptions.dryRun,
    })

    try {
      // Run before rollback hook
      if (this.hooks.beforeRollback) {
        await this.hooks.beforeRollback(migration, context)
      }

      // Execute the rollback
      if (mergedOptions.dryRun) {
        this.logger.info('[DRY RUN] Would execute rollback SQL', {
          sql: migration.down.substring(0, 200) + (migration.down.length > 200 ? '...' : ''),
        })
      } else {
        await this.executeMigrationSQL(migration.down, mergedOptions)
      }

      const executionTime = Date.now() - startTime

      // Record rollback
      if (!mergedOptions.dryRun) {
        await this.storage.recordRollback(migration, executionTime)
      }

      // Run after rollback hook
      if (this.hooks.afterRollback) {
        await this.hooks.afterRollback(migration, context)
      }

      this.logger.info('Migration rollback completed successfully', {
        id: migration.id,
        version: migration.version,
        executionTime,
      })

      return {
        migration: {
          ...migration,
          status: MigrationStatus.ROLLED_BACK,
        },
        success: true,
        executionTime,
        dryRun: mergedOptions.dryRun,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = (error as Error).message

      this.logger.error('Migration rollback failed', {
        id: migration.id,
        version: migration.version,
        error: errorMessage,
        executionTime,
      })

      return {
        migration: {
          ...migration,
          status: MigrationStatus.FAILED,
          errorMessage,
        },
        success: false,
        executionTime,
        error: errorMessage,
        dryRun: mergedOptions.dryRun,
      }
    }
  }

  /**
   * Run multiple migrations
   */
  async runMigrations(
    migrations: Migration[],
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = []
    const mergedOptions = { ...this.config, ...options }

    this.logger.info('Starting batch migration', {
      count: migrations.length,
      dryRun: mergedOptions.dryRun,
      stopOnFirstError: mergedOptions.stopOnFirstError,
    })

    if (mergedOptions.batch && !mergedOptions.dryRun) {
      // Run all migrations in a single transaction
      return this.runMigrationsInBatch(migrations, mergedOptions)
    }

    // Run migrations one by one
    for (const migration of migrations) {
      const result = await this.runMigration(migration, mergedOptions)
      results.push(result)

      if (!result.success && mergedOptions.stopOnFirstError) {
        this.logger.error('Stopping migration batch due to error', {
          failedMigration: migration.version,
          error: result.error,
        })
        break
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    this.logger.info('Batch migration completed', {
      total: results.length,
      successful,
      failed,
      dryRun: mergedOptions.dryRun,
    })

    return results
  }

  /**
   * Rollback multiple migrations (in reverse order)
   */
  async rollbackMigrations(
    migrations: Migration[],
    options: Partial<MigrationOptions> = {}
  ): Promise<RollbackResult[]> {
    const results: RollbackResult[] = []
    const mergedOptions = { ...this.config, ...options }

    // Reverse order for rollback
    const reversedMigrations = [...migrations].reverse()

    this.logger.info('Starting batch rollback', {
      count: reversedMigrations.length,
      dryRun: mergedOptions.dryRun,
      stopOnFirstError: mergedOptions.stopOnFirstError,
    })

    for (const migration of reversedMigrations) {
      const result = await this.rollbackMigration(migration, mergedOptions)
      results.push(result)

      if (!result.success && mergedOptions.stopOnFirstError) {
        this.logger.error('Stopping rollback batch due to error', {
          failedMigration: migration.version,
          error: result.error,
        })
        break
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    this.logger.info('Batch rollback completed', {
      total: results.length,
      successful,
      failed,
      dryRun: mergedOptions.dryRun,
    })

    return results
  }

  /**
   * Get migration plan (pending migrations with dependencies)
   */
  async getMigrationPlan(allMigrations: Migration[]): Promise<MigrationPlan> {
    const appliedMigrations = await this.storage.getAppliedMigrations()
    const appliedVersions = new Set(appliedMigrations.map(m => m.version))

    const pendingMigrations = allMigrations.filter(m => !appliedVersions.has(m.version))

    // Validate dependencies
    const errors = this.validateDependencies(pendingMigrations, appliedVersions)

    // Calculate execution order
    const executionOrder = this.calculateExecutionOrder(pendingMigrations)

    // Estimate execution time
    const estimatedTime = this.estimateExecutionTime(pendingMigrations)

    // Check for warnings
    const warnings = this.generateWarnings(pendingMigrations)

    return {
      migrations: pendingMigrations,
      executionOrder,
      dependencies: this.buildDependencyMap(pendingMigrations),
      estimatedTime,
      warnings,
      errors,
    }
  }

  /**
   * Validate migration dependencies
   */
  private validateDependencies(
    migrations: Migration[],
    appliedVersions: Set<string>
  ): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    for (const migration of migrations) {
      if (!migration.dependencies) continue

      for (const dependency of migration.dependencies) {
        // Check if dependency exists in all migrations
        const dependencyMigration = migrations.find(m => m.version === dependency)
        if (!dependencyMigration && !appliedVersions.has(dependency)) {
          errors.push({
            migration,
            type: 'dependency_missing',
            message: `Missing dependency: ${dependency}`,
            details: { dependency },
          })
        }
      }
    }

    return errors
  }

  /**
   * Calculate migration execution order based on dependencies
   */
  private calculateExecutionOrder(migrations: Migration[]): string[] {
    const order: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (migration: Migration) => {
      if (visiting.has(migration.version)) {
        throw new Error(`Circular dependency detected involving ${migration.version}`)
      }

      if (visited.has(migration.version)) {
        return
      }

      visiting.add(migration.version)

      // Visit dependencies first
      if (migration.dependencies) {
        for (const depVersion of migration.dependencies) {
          const depMigration = migrations.find(m => m.version === depVersion)
          if (depMigration) {
            visit(depMigration)
          }
        }
      }

      visiting.delete(migration.version)
      visited.add(migration.version)
      order.push(migration.version)
    }

    for (const migration of migrations) {
      visit(migration)
    }

    return order
  }

  /**
   * Build dependency map
   */
  private buildDependencyMap(migrations: Migration[]): Record<string, string[]> {
    const map: Record<string, string[]> = {}

    for (const migration of migrations) {
      map[migration.version] = migration.dependencies || []
    }

    return map
  }

  /**
   * Estimate execution time for migrations
   */
  private estimateExecutionTime(migrations: Migration[]): number {
    // Base estimation: 1000ms per migration + 10ms per 100 characters of SQL
    return migrations.reduce((total, migration) => {
      const baseTime = 1000
      const sqlComplexity = Math.ceil(migration.up.length / 100) * 10
      return total + baseTime + sqlComplexity
    }, 0)
  }

  /**
   * Generate warnings for migrations
   */
  private generateWarnings(migrations: Migration[]): string[] {
    const warnings: string[] = []

    for (const migration of migrations) {
      // Check for missing rollback SQL
      if (!migration.down) {
        warnings.push(`Migration ${migration.version} does not have rollback SQL`)
      }

      // Check for large migrations
      if (migration.up.length > 50000) {
        warnings.push(`Migration ${migration.version} is large (${migration.up.length} characters)`)
      }

      // Check for potentially unsafe operations
      const unsafePatterns = [/DROP\s+TABLE/i, /DELETE\s+FROM\s+\w+\s*$/i, /TRUNCATE/i]

      for (const pattern of unsafePatterns) {
        if (pattern.test(migration.up)) {
          warnings.push(`Migration ${migration.version} contains potentially unsafe operation`)
          break
        }
      }
    }

    return warnings
  }

  /**
   * Run migrations in a single transaction
   */
  private async runMigrationsInBatch(
    migrations: Migration[],
    _options: MigrationOptions
  ): Promise<MigrationResult[]> {
    this.logger.info('Running migrations in batch transaction', {
      count: migrations.length,
    })

    const results: MigrationResult[] = []

    try {
      await this.db.transaction(async tx => {
        for (const migration of migrations) {
          const startTime = Date.now()

          try {
            await tx.execute(migration.up)
            const executionTime = Date.now() - startTime

            results.push({
              migration: {
                ...migration,
                status: MigrationStatus.COMPLETED,
                appliedAt: Date.now(),
                executionTime,
              },
              success: true,
              executionTime,
            })
          } catch (error) {
            const executionTime = Date.now() - startTime
            const errorMessage = (error as Error).message

            results.push({
              migration: {
                ...migration,
                status: MigrationStatus.FAILED,
                errorMessage,
              },
              success: false,
              executionTime,
              error: errorMessage,
            })

            throw error // This will rollback the entire transaction
          }
        }
      })

      // Record all successful migrations
      for (const result of results) {
        if (result.success) {
          await this.storage.recordMigration(result.migration, result.executionTime)
        }
      }
    } catch (error) {
      this.logger.error('Batch transaction failed, all migrations rolled back', error)

      // Record failed migrations
      for (const result of results) {
        if (!result.success) {
          await this.storage.updateMigrationStatus(
            result.migration.id,
            MigrationStatus.FAILED,
            result.error
          )
        }
      }
    }

    return results
  }

  /**
   * Execute migration SQL with safety checks
   */
  private async executeMigrationSQL(sql: string, options: MigrationOptions): Promise<void> {
    const statements = this.splitSQLStatements(sql)

    for (const statement of statements) {
      if (!statement.trim()) continue

      // Safety check for destructive operations
      if (!options.force && this.hasDestructiveOperation(statement)) {
        throw new Error(
          `Destructive operation detected in migration: ${statement.substring(0, 100)}...`
        )
      }

      await this.db.execute(statement, undefined, {
        timeout: options.timeout,
        retries: options.retries,
      })
    }
  }

  /**
   * Split SQL string into individual statements
   */
  private splitSQLStatements(sql: string): string[] {
    // Simple SQL splitter - handles basic cases
    const statements: string[] = []
    let current = ''
    let inString = false
    let stringChar = ''
    let escapeNext = false

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i]

      if (escapeNext) {
        current += char
        escapeNext = false
        continue
      }

      if (char === '\\') {
        current += char
        escapeNext = true
        continue
      }

      if ((char === '"' || char === "'") && !escapeNext) {
        if (inString && stringChar === char) {
          inString = false
          stringChar = ''
        } else if (!inString) {
          inString = true
          stringChar = char
        }
      }

      if (!inString && char === ';') {
        statements.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    if (current.trim()) {
      statements.push(current.trim())
    }

    return statements.filter(s => s && !s.startsWith('--'))
  }

  /**
   * Check for destructive SQL operations
   */
  private hasDestructiveOperation(sql: string): boolean {
    const destructivePatterns = [
      /DROP\s+TABLE\s+IF\s+EXISTS\s+(?!__schema_migrations)/i,
      /DELETE\s+FROM\s+\w+\s*$/i,
      /TRUNCATE\s+TABLE/i,
    ]

    return destructivePatterns.some(pattern => pattern.test(sql))
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): MigrationLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[MigrationRunner] ${message}`, ...args)
        }
      },
      info: (message: string, ...args: any[]) => {
        console.info(`[MigrationRunner] ${message}`, ...args)
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[MigrationRunner] ${message}`, ...args)
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[MigrationRunner] ${message}`, ...args)
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
        console[level](`[MigrationRunner] ${message}`, ...args)
      },
    }
  }
}

/**
 * Factory function to create migration runner
 */
export function createMigrationRunner(
  db: D1Database,
  options?: {
    storage?: MigrationStorage
    logger?: MigrationLogger
    hooks?: Partial<typeof MigrationRunner.prototype.hooks>
  } & MigrationOptions
): MigrationRunner {
  return new MigrationRunner(db, options)
}
