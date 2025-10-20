/**
 * Database migration system for D1
 *
 * A comprehensive migration system with:
 * - Version tracking and history
 * - Rollback functionality with safety checks
 * - Validation and dry-run mode
 * - Monitoring and logging
 * - Health checks and status reporting
 * - Automated execution hooks
 */

// Core types and interfaces
export {
  Migration,
  MigrationStatus,
  MigrationRecord,
  MigrationFile,
  MigrationResult,
  RollbackResult,
  MigrationOptions,
  MigrationRunnerConfig,
  MigrationLogEntry,
  MigrationValidationError,
  MigrationPlan,
  MigrationHealthCheck,
  MigrationStats,
  DatabaseSchemaInfo,
  MigrationHook,
  MigrationContext,
  MigrationLogger,
  MigrationStorage
} from './types'

// Migration runner - core execution engine
export {
  MigrationRunner,
  createMigrationRunner
} from './runner'

// Migration validator - validation and dry-run
export {
  MigrationValidator,
  createMigrationValidator
} from './validator'

// Migration storage - version tracking
export {
  D1MigrationStorage,
  createMigrationStorage
} from './storage'

// Migration monitoring - logging and health checks
export {
  MigrationMonitor,
  createMigrationMonitor
} from './monitoring'

// Migration service - main orchestrator
export {
  MigrationService,
  createMigrationService
} from './service'

// Migration hooks - automated execution
export {
  MigrationHooks,
  BuiltInHooks,
  MigrationHookRegistry,
  createMigrationHooks,
  getMigrationHookRegistry
} from './hooks'

// Default configurations
export const DEFAULT_MIGRATION_CONFIG = {
  migrationsPath: './migrations',
  tableName: '__schema_migrations',
  enableLogging: true,
  logLevel: 'info' as const,
  timeout: 30000,
  retries: 3,
  validateChecksums: true,
  enableRollback: true,
  requireRollback: false,
  enableBatchMode: false,
  maxConcurrentMigrations: 1,
  enableHealthChecks: true,
  healthCheckInterval: 60000
}

export const DEFAULT_MIGRATION_OPTIONS = {
  dryRun: false,
  force: false,
  timeout: 30000,
  retries: 3,
  validateChecksums: true,
  stopOnFirstError: true,
  batch: false
}

/**
 * Create a complete migration system with all components
 */
export function createMigrationSystem(
  db: any, // D1Database type from @cloudflare/workers-types
  config: {
    // Service configuration
    migrationsPath?: string
    tableName?: string
    enableLogging?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    timeout?: number
    retries?: number
    validateChecksums?: boolean
    enableRollback?: boolean
    requireRollback?: boolean
    enableBatchMode?: boolean
    maxConcurrentMigrations?: number
    enableHealthChecks?: boolean
    healthCheckInterval?: number

    // Hook configuration
    hooks?: {
      beforeMigration?: any[]
      afterMigration?: any[]
      beforeRollback?: any[]
      afterRollback?: any[]
      onValidationError?: any[]
      onMigrationStart?: any[]
      onMigrationComplete?: any[]
      onMigrationFail?: any[]
    }

    // Logger override
    logger?: any
  } = {}
) {
  const migrationService = createMigrationService(db, config)

  return {
    // Main service
    service: migrationService,

    // Individual components (for advanced usage)
    runner: migrationService['runner'],
    validator: migrationService['validator'],
    monitor: migrationService['monitor'],
    storage: migrationService['storage'],

    // Convenience methods
    async initialize() {
      await migrationService.initialize()
    },

    async runMigrations(options?: any) {
      return migrationService.runMigrations(options)
    },

    async rollbackMigrations(options?: any) {
      return migrationService.rollbackMigrations(options)
    },

    async validateMigrations(options?: any) {
      return migrationService.validateMigrations(options)
    },

    async healthCheck() {
      return migrationService.healthCheck()
    },

    async getStats() {
      return migrationService.getStats()
    },

    getLogs(options?: any) {
      return migrationService.getLogs(options)
    },

    async getHistory(limit?: number) {
      return migrationService.getHistory(limit)
    },

    setHooks(hooks: any) {
      migrationService.setHooks(hooks)
    },

    async cleanup() {
      await migrationService.cleanup()
    }
  }
}

/**
 * Utility functions for common migration tasks
 */
export const MigrationUtils = {
  /**
   * Create a migration from SQL strings
   */
  createMigration: (
    version: string,
    name: string,
    upSQL: string,
    downSQL?: string,
    options: {
      description?: string
      dependencies?: string[]
    } = {}
  ) => {
    const crypto = globalThis.crypto || (globalThis as any).webcrypto

    // Generate ID
    const id = crypto.randomUUID()

    // Generate checksum
    const encoder = new TextEncoder()
    const data = upSQL + (downSQL || '')
    const bytes = encoder.encode(data)

    // Simple hash function
    let hash = 0
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i]
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    const checksum = Math.abs(hash).toString(16)

    return {
      id,
      version,
      name,
      description: options.description,
      up: upSQL,
      down: downSQL,
      checksum,
      dependencies: options.dependencies,
      createdAt: Date.now(),
      status: 'pending' as const
    }
  },

  /**
   * Parse migration version from filename
   */
  parseVersionFromFilename: (filename: string): string | null => {
    const match = filename.match(/^(\d{3})_(.+)\.sql$/)
    return match ? match[1] : null
  },

  /**
   * Generate migration filename
   */
  generateFilename: (version: string, name: string): string => {
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    return `${version}_${sanitizedName}.sql`
  },

  /**
   * Check if migration is safe to run in production
   */
  isProductionSafe: (migration: any): boolean => {
    const unsafePatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM\s+\w+\s*$/i,
      /TRUNCATE/i,
      /DROP\s+DATABASE/i
    ]

    return !unsafePatterns.some(pattern => pattern.test(migration.up))
  },

  /**
   * Estimate migration execution time
   */
  estimateExecutionTime: (migration: any): number => {
    // Base time: 1000ms
    let baseTime = 1000

    // Add time based on SQL complexity
    const sqlLength = migration.up.length
    const complexityTime = Math.ceil(sqlLength / 1000) * 500

    // Add time for specific operations
    const operationTime = migration.up.includes('CREATE TABLE') ? 2000 : 0
    const indexTime = migration.up.includes('CREATE INDEX') ? 1000 : 0
    const dataTime = migration.up.includes('INSERT') ? 1500 : 0

    return baseTime + complexityTime + operationTime + indexTime + dataTime
  },

  /**
   * Validate migration version format
   */
  validateVersion: (version: string): boolean => {
    return /^\d{3}$/.test(version)
  },

  /**
   * Sort migrations by version
   */
  sortMigrationsByVersion: (migrations: any[]): any[] => {
    return migrations.sort((a, b) => {
      const aVersion = parseInt(a.version)
      const bVersion = parseInt(b.version)
      return aVersion - bVersion
    })
  }
}

// Export version information
export const MIGRATION_SYSTEM_VERSION = '1.0.0'
