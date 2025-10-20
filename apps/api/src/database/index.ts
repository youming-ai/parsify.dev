// Database connection and client exports
export {
  DatabaseConnection,
  createDatabaseConnection,
  DEFAULT_DATABASE_CONFIG,
  type DatabaseConfig,
  type DatabaseMetrics,
  type QueryOptions,
  type QueryResult,
} from './connection'

export {
  DatabaseClient,
  DatabasePool,
  Transaction,
  createDatabaseClient,
  createDatabasePool,
  DEFAULT_DATABASE_CLIENT_CONFIG,
  type DatabaseClientConfig,
  type TransactionOptions,
  type TransactionResult,
  // Enhanced transaction exports
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
  globalTransactionMonitor,
  type TransactionMonitoringConfig,
  type TransactionAlert,
  type TransactionSnapshot,
  type TransactionReport,
  DistributedTransactionCoordinator,
  TransactionOptimizer,
  type DistributedTransactionCoordinator as DistributedTxCoordinator,
} from './client'

export {
  DatabaseService,
  createDatabaseService,
  getDatabaseService,
  resetDatabaseService,
  DEFAULT_DATABASE_SERVICE_CONFIG,
  type DatabaseServiceConfig,
  type DatabaseServiceMetrics,
  type HealthCheckResult,
} from './service'

// Health monitoring exports
export {
  DatabaseHealthMonitor,
  createDatabaseHealthMonitor,
  DEFAULT_HEALTH_CHECK_CONFIG,
  type HealthCheckConfig,
  type HealthStatus,
  type HealthAlert,
  type HealthReport,
} from './health'

// Enhanced connection pool exports
export {
  EnhancedConnectionPool,
  createEnhancedConnectionPool,
  type ConnectionPoolConfig,
  type ConnectionMetrics,
  type PoolMetrics,
  type PoolStatistics,
} from './pool'

export {
  ConnectionPoolMonitor,
  createConnectionPoolMonitor,
  type PoolMonitoringConfig,
  type DetailedPoolMetrics,
  type PoolAlert,
  type PoolHealthReport,
} from './pool-monitoring'

export {
  ConnectionLifecycleManager,
  createConnectionLifecycleManager,
  type ConnectionLifecycleConfig,
  type ConnectionLifecycleEvent,
  type ConnectionHealthStatus,
  type LifecycleMetrics,
} from './connection-lifecycle'

export {
  PoolHealthChecker,
  createPoolHealthChecker,
  type HealthCheckConfig,
  type HealthCheckResult,
  type RecoveryAction,
  type EmergencyModeStatus,
} from './pool-health-checker'

export {
  AdaptivePoolSizer,
  createAdaptivePoolSizer,
  type AdaptiveSizingConfig,
  type LoadPattern,
  type ScalingDecision,
  type AdaptiveSizingMetrics,
} from './adaptive-pool-sizer'

export {
  EnhancedDatabaseService,
  createEnhancedDatabaseService,
  getEnhancedDatabaseService,
  resetEnhancedDatabaseService,
  DEFAULT_ENHANCED_DATABASE_SERVICE_CONFIG,
  type EnhancedDatabaseServiceConfig,
  type EnhancedDatabaseServiceMetrics,
  type EnhancedHealthCheckResult,
} from './enhanced-service'

// Migration system exports
export {
  // Core types and interfaces
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
  MigrationStorage,

  // Main components
  MigrationService,
  MigrationRunner,
  MigrationValidator,
  MigrationMonitor,
  D1MigrationStorage,
  MigrationHooks,
  BuiltInHooks,
  MigrationHookRegistry,

  // Factory functions
  createMigrationService,
  createMigrationRunner,
  createMigrationValidator,
  createMigrationMonitor,
  createMigrationStorage,
  createMigrationHooks,
  getMigrationHookRegistry,
  createMigrationSystem,

  // Utilities
  MigrationUtils,
  DEFAULT_MIGRATION_CONFIG,
  DEFAULT_MIGRATION_OPTIONS,
  MIGRATION_SYSTEM_VERSION,
} from './migrations'

// Re-export D1Database types for convenience
export type { D1Database } from '@cloudflare/workers-types'
