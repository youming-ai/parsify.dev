/**
 * Migration system types and interfaces for D1 database
 */

export interface Migration {
  id: string
  version: string
  name: string
  description?: string
  up: string // SQL to run for migration
  down?: string // SQL to run for rollback (optional)
  checksum: string
  dependencies?: string[] // List of migration IDs this migration depends on
  createdAt: number
  appliedAt?: number
  status: MigrationStatus
  executionTime?: number
  errorMessage?: string
}

export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

export interface MigrationRecord {
  id: string
  version: string
  name: string
  description?: string
  checksum: string
  applied_at: number
  execution_time: number
  status: string
  error_message?: string
  dependencies?: string[]
}

export interface MigrationFile {
  version: string
  name: string
  description?: string
  upSQL: string
  downSQL?: string
  dependencies?: string[]
}

export interface MigrationResult {
  migration: Migration
  success: boolean
  executionTime: number
  error?: string
  dryRun?: boolean
}

export interface RollbackResult {
  migration: Migration
  success: boolean
  executionTime: number
  error?: string
  dryRun?: boolean
}

export interface MigrationOptions {
  dryRun?: boolean
  force?: boolean // Skip safety checks
  timeout?: number
  retries?: number
  validateChecksums?: boolean
  stopOnFirstError?: boolean
  batch?: boolean // Run migrations in a single transaction
}

export interface MigrationRunnerConfig {
  migrationsPath?: string
  tableName?: string
  enableLogging?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  timeout?: number
  retries?: number
  validateChecksums?: boolean
  enableRollback?: boolean
  requireRollback?: boolean // Require rollback SQL for all migrations
  enableBatchMode?: boolean
  maxConcurrentMigrations?: number
  enableHealthChecks?: boolean
  healthCheckInterval?: number
}

export interface MigrationLogEntry {
  id: string
  migrationId: string
  action: 'start' | 'complete' | 'fail' | 'rollback' | 'validate'
  timestamp: number
  message: string
  details?: any
  level: 'debug' | 'info' | 'warn' | 'error'
}

export interface MigrationValidationError {
  migration: Migration
  type:
    | 'checksum_mismatch'
    | 'dependency_missing'
    | 'sql_syntax_error'
    | 'rollback_missing'
    | 'unsafe_operation'
  message: string
  details?: any
}

export interface MigrationPlan {
  migrations: Migration[]
  executionOrder: string[]
  dependencies: Record<string, string[]>
  estimatedTime: number
  warnings: string[]
  errors: MigrationValidationError[]
}

export interface MigrationHealthCheck {
  isHealthy: boolean
  lastMigrationTime?: number
  pendingMigrations: number
  failedMigrations: number
  totalMigrations: number
  issues: string[]
  recommendations: string[]
}

export interface MigrationStats {
  total: number
  applied: number
  pending: number
  failed: number
  rolledBack: number
  averageExecutionTime: number
  lastMigrationTime?: number
  oldestPendingMigration?: number
}

export interface DatabaseSchemaInfo {
  version: string
  tables: string[]
  views: string[]
  indexes: string[]
  triggers: string[]
  lastMigration?: string
  migrationCount: number
}

export type MigrationHook = (
  migration: Migration,
  context: MigrationContext
) => Promise<void> | void

export interface MigrationContext {
  action: 'up' | 'down' | 'validate'
  dryRun: boolean
  options: MigrationOptions
  startTime: number
  logger: MigrationLogger
}

export interface MigrationLogger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    ...args: any[]
  ): void
}

export interface MigrationStorage {
  initialize(): Promise<void>
  getAppliedMigrations(): Promise<MigrationRecord[]>
  recordMigration(migration: Migration, executionTime: number): Promise<void>
  recordRollback(migration: Migration, executionTime: number): Promise<void>
  updateMigrationStatus(
    id: string,
    status: MigrationStatus,
    error?: string
  ): Promise<void>
  cleanup(): Promise<void>
}

// Default database configuration
export const DEFAULT_DATABASE_CLIENT_CONFIG = {
  maxConnections: 10,
  connectionTimeout: 30000,
  idleTimeout: 600000,
  retryAttempts: 3,
  retryDelay: 1000,
}
