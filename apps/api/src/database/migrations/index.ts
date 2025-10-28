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

import type { D1Database } from '@cloudflare/workers-types'

// Migration hooks - automated execution
export {
  BuiltInHooks,
  createMigrationHooks,
  getMigrationHookRegistry,
  MigrationHookRegistry,
  MigrationHooks,
} from './hooks'
// Migration monitoring - logging and health checks
export {
  createMigrationMonitor,
  MigrationMonitor,
} from './monitoring'
// Migration runner - core execution engine
export {
  createMigrationRunner,
  MigrationRunner,
} from './runner'
// Migration service - main orchestrator
export {
  createMigrationService,
  MigrationService,
} from './service'
// Migration storage - version tracking
export {
  createMigrationStorage,
  D1MigrationStorage,
} from './storage'
// Core types and interfaces
export {
  DatabaseSchemaInfo,
  Migration,
  MigrationContext,
  MigrationFile,
  MigrationHealthCheck,
  MigrationHook,
  MigrationLogEntry,
  MigrationLogger,
  MigrationOptions,
  MigrationPlan,
  MigrationRecord,
  MigrationResult,
  MigrationRunnerConfig,
  MigrationStats,
  MigrationStatus,
  MigrationStorage,
  MigrationValidationError,
  RollbackResult,
} from './types'
// Migration validator - validation and dry-run
export {
  createMigrationValidator,
  MigrationValidator,
} from './validator'

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
  healthCheckInterval: 60000,
}

export const DEFAULT_MIGRATION_OPTIONS = {
  dryRun: false,
  force: false,
  timeout: 30000,
  retries: 3,
  validateChecksums: true,
  stopOnFirstError: true,
  batch: false,
}

/**
 * Create a complete migration system with all components
 */
export function createMigrationSystem(
  db: D1Database,
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
      beforeMigration?: Array<(migration: Migration) => Promise<void>>
      afterMigration?: Array<(migration: Migration) => Promise<void>>
      beforeRollback?: Array<(migration: Migration) => Promise<void>>
      afterRollback?: Array<(migration: Migration) => Promise<void>>
      onValidationError?: Array<(error: Error) => Promise<void>>
      onMigrationStart?: Array<(migration: Migration) => Promise<void>>
      onMigrationComplete?: Array<(migration: Migration) => Promise<void>>
      onMigrationFail?: Array<(error: Error, migration: Migration) => Promise<void>>
    }

    // Logger override
    logger?: {
      info: (message: string, meta?: unknown) => void
      warn: (message: string, meta?: unknown) => void
      error: (message: string, error?: Error, meta?: unknown) => void
      debug: (message: string, meta?: unknown) => void
    }
  } = {}
) {
  const migrationService = createMigrationService(db, config)

  return {
    // Main service
    service: migrationService,

    // Individual components (for advanced usage)
    runner: migrationService.runner,
    validator: migrationService.validator,
    monitor: migrationService.monitor,
    storage: migrationService.storage,

    // Convenience methods
    async initialize() {
      await migrationService.initialize()
    },

    async runMigrations(options?: { dryRun?: boolean; force?: boolean; targetVersion?: string }) {
      return migrationService.runMigrations(options)
    },

    async rollbackMigrations(options?: { dryRun?: boolean; force?: boolean; targetVersion?: string }) {
      return migrationService.rollbackMigrations(options)
    },

    async validateMigrations(options?: { strict?: boolean; targetVersion?: string }) {
      return migrationService.validateMigrations(options)
    },

    async healthCheck() {
      return migrationService.healthCheck()
    },

    async getStats() {
      return migrationService.getStats()
    },

    getLogs(options?: { limit?: number; level?: 'debug' | 'info' | 'warn' | 'error' }) {
      return migrationService.getLogs(options)
    },

    async getHistory(limit?: number) {
      return migrationService.getHistory(limit)
    },

    setHooks(hooks: {
      beforeMigration?: Array<(migration: Migration) => Promise<void>>
      afterMigration?: Array<(migration: Migration) => Promise<void>>
      beforeRollback?: Array<(migration: Migration) => Promise<void>>
      afterRollback?: Array<(migration: Migration) => Promise<void>>
      onValidationError?: Array<(error: Error) => Promise<void>>
      onMigrationStart?: Array<(migration: Migration) => Promise<void>>
      onMigrationComplete?: Array<(migration: Migration) => Promise<void>>
      onMigrationFail?: Array<(error: Error, migration: Migration) => Promise<void>>
    }) {
      migrationService.setHooks(hooks)
    },

    async cleanup() {
      await migrationService.cleanup()
    },
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
    const crypto = globalThis.crypto || (globalThis as { webcrypto?: Crypto }).webcrypto

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
      hash = (hash << 5) - hash + char
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
      status: 'pending' as const,
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
      /DROP\s+DATABASE/i,
    ]

    return !unsafePatterns.some(pattern => pattern.test(migration.up))
  },

  /**
   * Estimate migration execution time
   */
  estimateExecutionTime: (migration: any): number => {
    // Base time: 1000ms
    const baseTime = 1000

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
      const aVersion = parseInt(a.version, 10)
      const bVersion = parseInt(b.version, 10)
      return aVersion - bVersion
    })
  },
}

// Export version information
export const MIGRATION_SYSTEM_VERSION = '1.0.0'
