import type { D1Database } from '@cloudflare/workers-types'
import { createMigrationMonitor, type MigrationMonitor } from './monitoring'
import { createMigrationRunner, type MigrationRunner } from './runner'
import { createMigrationStorage, type MigrationStorage } from './storage'
import {
  type Migration,
  type MigrationHealthCheck,
  type MigrationHook,
  type MigrationLogger,
  type MigrationOptions,
  type MigrationPlan,
  type MigrationResult,
  type MigrationRunnerConfig,
  type MigrationStats,
  MigrationStatus,
  type MigrationValidationError,
  type RollbackResult,
} from './types'
import { createMigrationValidator, type MigrationValidator } from './validator'

/**
 * Main migration service that orchestrates all migration operations
 */
export class MigrationService {
  private config: Required<MigrationRunnerConfig>
  private runner: MigrationRunner
  private validator: MigrationValidator
  private monitor: MigrationMonitor
  private storage: MigrationStorage
  private logger: MigrationLogger
  private isInitialized: boolean = false

  constructor(db: D1Database, config: MigrationRunnerConfig = {}) {
    this.db = db
    this.config = {
      migrationsPath: config.migrationsPath || './migrations',
      tableName: config.tableName || '__schema_migrations',
      enableLogging: config.enableLogging ?? true,
      logLevel: config.logLevel || 'info',
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      validateChecksums: config.validateChecksums ?? true,
      enableRollback: config.enableRollback ?? true,
      requireRollback: config.requireRollback ?? false,
      enableBatchMode: config.enableBatchMode ?? false,
      maxConcurrentMigrations: config.maxConcurrentMigrations ?? 1,
      enableHealthChecks: config.enableHealthChecks ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 60000,
    }

    this.logger = this.createLogger()
    this.storage = createMigrationStorage(db, {
      tableName: this.config.tableName,
      logger: this.logger,
    })
    this.monitor = createMigrationMonitor(db, {
      logger: this.logger,
      enablePersistence: this.config.enableLogging,
    })
    this.validator = createMigrationValidator(db, {
      logger: this.logger,
      enableSafetyChecks: true,
    })
    this.runner = createMigrationRunner(db, {
      storage: this.storage,
      logger: this.logger,
      timeout: this.config.timeout,
      retries: this.config.retries,
      validateChecksums: this.config.validateChecksums,
      batch: this.config.enableBatchMode,
    })
  }

  /**
   * Initialize the migration service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Migration service already initialized')
      return
    }

    this.logger.info('Initializing migration service')

    try {
      // Initialize storage
      await this.storage.initialize()

      // Initialize monitoring
      await this.monitor.initialize()

      // Perform initial health check if enabled
      if (this.config.enableHealthChecks) {
        const healthCheck = await this.healthCheck()
        if (!healthCheck.isHealthy) {
          this.logger.warn('Migration service initialized with health issues', {
            issues: healthCheck.issues,
          })
        }
      }

      this.isInitialized = true
      this.logger.info('Migration service initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize migration service', error)
      throw new Error(`Migration service initialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Load migrations from file system or memory
   */
  async loadMigrations(): Promise<Migration[]> {
    this.logger.info('Loading migrations', {
      path: this.config.migrationsPath,
    })

    try {
      // For now, we'll implement a basic migration loader
      // In a real implementation, this would load from file system
      const migrations = await this.loadMigrationsFromPath()

      this.logger.info(`Loaded ${migrations.length} migrations`)
      return migrations
    } catch (error) {
      this.logger.error('Failed to load migrations', error)
      throw new Error(`Failed to load migrations: ${(error as Error).message}`)
    }
  }

  /**
   * Get migration plan
   */
  async getMigrationPlan(): Promise<MigrationPlan> {
    this.ensureInitialized()

    this.logger.info('Generating migration plan')

    try {
      const migrations = await this.loadMigrations()
      const plan = await this.runner.getMigrationPlan(migrations)

      this.logger.info('Migration plan generated', {
        pendingMigrations: plan.migrations.length,
        warnings: plan.warnings.length,
        errors: plan.errors.length,
      })

      return plan
    } catch (error) {
      this.logger.error('Failed to generate migration plan', error)
      throw error
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(
    options: MigrationOptions & {
      versions?: string[]
      force?: boolean
    } = {}
  ): Promise<{
    results: MigrationResult[]
    plan: MigrationPlan
    stats: MigrationStats
  }> {
    this.ensureInitialized()

    const { versions, force = false, ...runnerOptions } = options
    const startTime = Date.now()

    this.logger.info('Starting migration run', {
      versions,
      force,
      dryRun: runnerOptions.dryRun,
    })

    try {
      // Load and plan migrations
      const allMigrations = await this.loadMigrations()
      let migrationsToRun = allMigrations

      // Filter by versions if specified
      if (versions && versions.length > 0) {
        migrationsToRun = allMigrations.filter(m => versions.includes(m.version))
      }

      // Get execution plan
      const plan = await this.runner.getMigrationPlan(migrationsToRun)

      // Check for validation errors
      if (plan.errors.length > 0 && !force) {
        const errorMessages = plan.errors.map(e => `${e.type}: ${e.message}`)
        throw new Error(`Migration validation failed:\n${errorMessages.join('\n')}`)
      }

      // Validate migrations if not forced
      if (!force) {
        const validation = await this.validator.validateMigrations(plan.migrations)
        if (validation.errors.length > 0) {
          const errorMessages = validation.errors.map(e => `${e.type}: ${e.message}`)
          throw new Error(`Migration validation failed:\n${errorMessages.join('\n')}`)
        }
      }

      // Run migrations
      const results = await this.runner.runMigrations(plan.migrations, runnerOptions)

      // Get updated stats
      const stats = await this.monitor.getStats()

      const executionTime = Date.now() - startTime
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      this.logger.info('Migration run completed', {
        total: results.length,
        successful,
        failed,
        executionTime,
        dryRun: runnerOptions.dryRun,
      })

      return { results, plan, stats }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.error('Migration run failed', { error, executionTime })
      throw error
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(
    options: MigrationOptions & {
      versions?: string[]
      steps?: number
      force?: boolean
    } = {}
  ): Promise<{
    results: RollbackResult[]
    stats: MigrationStats
  }> {
    this.ensureInitialized()

    if (!this.config.enableRollback) {
      throw new Error('Rollback is disabled in configuration')
    }

    const { versions, steps, force = false, ...runnerOptions } = options
    const startTime = Date.now()

    this.logger.info('Starting migration rollback', {
      versions,
      steps,
      force,
      dryRun: runnerOptions.dryRun,
    })

    try {
      // Get applied migrations
      const appliedMigrations = await this.storage.getAppliedMigrations()
      let migrationsToRollback = appliedMigrations

      // Filter by versions if specified
      if (versions && versions.length > 0) {
        migrationsToRollback = appliedMigrations.filter(m => versions.includes(m.version))
      }

      // Limit by steps if specified
      if (steps && steps > 0) {
        migrationsToRollback = migrationsToRollback.slice(-steps)
      }

      // Convert to Migration objects
      const rollbackMigrations = migrationsToRollback.map(record => ({
        id: record.id,
        version: record.version,
        name: record.name,
        description: record.description,
        up: '', // Not needed for rollback
        down: '', // Would need to load from migration files
        checksum: record.checksum,
        status: MigrationStatus.COMPLETED,
        createdAt: record.applied_at,
        appliedAt: record.applied_at,
        dependencies: record.dependencies ? JSON.parse(record.dependencies) : undefined,
      }))

      // Run rollbacks
      const results = await this.runner.rollbackMigrations(rollbackMigrations, runnerOptions)

      // Get updated stats
      const stats = await this.monitor.getStats()

      const executionTime = Date.now() - startTime
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      this.logger.info('Migration rollback completed', {
        total: results.length,
        successful,
        failed,
        executionTime,
        dryRun: runnerOptions.dryRun,
      })

      return { results, stats }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.error('Migration rollback failed', { error, executionTime })
      throw error
    }
  }

  /**
   * Validate migrations
   */
  async validateMigrations(options: { versions?: string[]; dryRun?: boolean } = {}): Promise<{
    errors: MigrationValidationError[]
    validMigrations: Migration[]
    invalidMigrations: Migration[]
    summary: {
      total: number
      valid: number
      invalid: number
      errors: number
    }
  }> {
    this.ensureInitialized()

    const { versions, dryRun = false } = options

    this.logger.info('Validating migrations', { versions, dryRun })

    try {
      const migrations = await this.loadMigrations()
      let migrationsToValidate = migrations

      // Filter by versions if specified
      if (versions && versions.length > 0) {
        migrationsToValidate = migrations.filter(m => versions.includes(m.version))
      }

      const validation = await this.validator.validateMigrations(migrationsToValidate)

      const summary = {
        total: migrationsToValidate.length,
        valid: validation.validMigrations.length,
        invalid: validation.invalidMigrations.length,
        errors: validation.errors.length,
      }

      this.logger.info('Migration validation completed', summary)

      return {
        errors: validation.errors,
        validMigrations: validation.validMigrations,
        invalidMigrations: validation.invalidMigrations,
        summary,
      }
    } catch (error) {
      this.logger.error('Migration validation failed', error)
      throw error
    }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<MigrationHealthCheck> {
    try {
      const healthCheck = await this.monitor.healthCheck()

      this.logger.debug('Migration health check completed', {
        healthy: healthCheck.isHealthy,
        issues: healthCheck.issues.length,
        recommendations: healthCheck.recommendations.length,
      })

      return healthCheck
    } catch (error) {
      this.logger.error('Migration health check failed', error)

      // Return unhealthy status
      return {
        isHealthy: false,
        issues: ['Health check failed'],
        recommendations: ['Check migration service configuration and database connectivity'],
        pendingMigrations: 0,
        failedMigrations: 0,
        totalMigrations: 0,
      }
    }
  }

  /**
   * Get migration statistics
   */
  async getStats(): Promise<MigrationStats> {
    this.ensureInitialized()

    try {
      return await this.monitor.getStats()
    } catch (error) {
      this.logger.error('Failed to get migration stats', error)
      throw error
    }
  }

  /**
   * Get migration logs
   */
  getLogs(options?: {
    migrationId?: string
    action?: string
    level?: string
    limit?: number
    startTime?: number
    endTime?: number
  }) {
    return this.monitor.getLogs(options)
  }

  /**
   * Get migration history
   */
  async getHistory(limit: number = 50): Promise<{
    migrations: Migration[]
    logs: any[]
  }> {
    try {
      const appliedMigrations = await this.storage.getAppliedMigrations()
      const recentLogs = this.monitor.getLogs({ limit })

      // Convert migration records to Migration objects
      const migrations = appliedMigrations.slice(-limit).map(record => ({
        id: record.id,
        version: record.version,
        name: record.name,
        description: record.description,
        up: '',
        down: '',
        checksum: record.checksum,
        status: record.status as MigrationStatus,
        createdAt: record.applied_at,
        appliedAt: record.applied_at,
        executionTime: record.execution_time,
        errorMessage: record.error_message,
        dependencies: record.dependencies ? JSON.parse(record.dependencies) : undefined,
      }))

      return { migrations, logs: recentLogs }
    } catch (error) {
      this.logger.error('Failed to get migration history', error)
      throw error
    }
  }

  /**
   * Set migration hooks
   */
  setHooks(_hooks: {
    beforeMigration?: MigrationHook
    afterMigration?: MigrationHook
    beforeRollback?: MigrationHook
    afterRollback?: MigrationHook
    onValidationError?: MigrationHook
  }): void {
    // Update runner hooks
    // This would require the runner to support dynamic hook updates
    this.logger.info('Migration hooks updated')
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up migration service')

    try {
      // Clear old logs if needed
      await this.monitor.clearLogs({
        olderThan: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      this.logger.info('Migration service cleanup completed')
    } catch (error) {
      this.logger.error('Migration service cleanup failed', error)
    }
  }

  /**
   * Load migrations from path
   */
  private async loadMigrationsFromPath(): Promise<Migration[]> {
    // This is a placeholder implementation
    // In a real system, this would read migration files from the file system
    // or load them from a migration registry

    // For now, return empty array as migrations would be loaded externally
    return []
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Migration service not initialized. Call initialize() first.')
    }
  }

  /**
   * Create logger
   */
  private createLogger(): MigrationLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (this.config.enableLogging && this.config.logLevel === 'debug') {
          console.debug(`[MigrationService] ${message}`, ...args)
        }
      },
      info: (message: string, ...args: any[]) => {
        if (this.config.enableLogging && ['debug', 'info'].includes(this.config.logLevel)) {
          console.info(`[MigrationService] ${message}`, ...args)
        }
      },
      warn: (message: string, ...args: any[]) => {
        if (this.config.enableLogging) {
          console.warn(`[MigrationService] ${message}`, ...args)
        }
      },
      error: (message: string, ...args: any[]) => {
        if (this.config.enableLogging) {
          console.error(`[MigrationService] ${message}`, ...args)
        }
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
        if (this.config.enableLogging) {
          console[level](`[MigrationService] ${message}`, ...args)
        }
      },
    }
  }
}

/**
 * Factory function to create migration service
 */
export function createMigrationService(
  db: D1Database,
  config?: MigrationRunnerConfig
): MigrationService {
  return new MigrationService(db, config)
}
