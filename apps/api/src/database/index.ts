// Database connection and client exports

// Re-export D1Database types for convenience
export type { D1Database } from '@cloudflare/workers-types'
export {
  AdaptivePoolSizer,
  type AdaptiveSizingConfig,
  type AdaptiveSizingMetrics,
  createAdaptivePoolSizer,
  type LoadPattern,
  type ScalingDecision,
} from './adaptive-pool-sizer'
export {
  type BatchOperation,
  createDatabaseClient,
  createDatabasePool,
  DatabaseClient,
  type DatabaseClientConfig,
  DatabasePool,
  DEFAULT_DATABASE_CLIENT_CONFIG,
  DistributedTransactionCoordinator,
  type DistributedTransactionCoordinator as DistributedTxCoordinator,
  // Enhanced transaction exports
  EnhancedTransaction,
  globalTransactionManager,
  globalTransactionMonitor,
  IsolationLevel,
  Transaction,
  type TransactionAlert,
  type TransactionConfig,
  type TransactionContext,
  TransactionError,
  TransactionHelper,
  TransactionManager,
  type TransactionMetrics,
  type TransactionMonitoringConfig,
  TransactionOptimizer,
  type TransactionOptions,
  type TransactionReport,
  type TransactionResult,
  type TransactionSnapshot,
  TransactionStatus,
  type TransactionTemplate,
  TransactionTemplates,
  TransactionUtils,
  type TransactionWorkflow,
} from './client'
export {
  createDatabaseConnection,
  type DatabaseConfig,
  DatabaseConnection,
  type DatabaseMetrics,
  DEFAULT_DATABASE_CONFIG,
  type QueryOptions,
  type QueryResult,
} from './connection'
export {
  type ConnectionHealthStatus,
  type ConnectionLifecycleConfig,
  type ConnectionLifecycleEvent,
  ConnectionLifecycleManager,
  createConnectionLifecycleManager,
  type LifecycleMetrics,
} from './connection-lifecycle'
export {
  createEnhancedDatabaseService,
  DEFAULT_ENHANCED_DATABASE_SERVICE_CONFIG,
  EnhancedDatabaseService,
  type EnhancedDatabaseServiceConfig,
  type EnhancedDatabaseServiceMetrics,
  type EnhancedHealthCheckResult,
  getEnhancedDatabaseService,
  resetEnhancedDatabaseService,
} from './enhanced-service'
// Health monitoring exports
export {
  createDatabaseHealthMonitor,
  DatabaseHealthMonitor,
  DEFAULT_HEALTH_CHECK_CONFIG,
  type HealthAlert,
  type HealthCheckConfig,
  type HealthReport,
  type HealthStatus,
} from './health'
// Migration system exports
export {
  BuiltInHooks,
  createMigrationHooks,
  createMigrationMonitor,
  createMigrationRunner,
  // Factory functions
  createMigrationService,
  createMigrationStorage,
  createMigrationSystem,
  createMigrationValidator,
  D1MigrationStorage,
  DatabaseSchemaInfo,
  DEFAULT_MIGRATION_CONFIG,
  DEFAULT_MIGRATION_OPTIONS,
  getMigrationHookRegistry,
  MIGRATION_SYSTEM_VERSION,
  // Core types and interfaces
  Migration,
  MigrationContext,
  MigrationFile,
  MigrationHealthCheck,
  MigrationHook,
  MigrationHookRegistry,
  MigrationHooks,
  MigrationLogEntry,
  MigrationLogger,
  MigrationMonitor,
  MigrationOptions,
  MigrationPlan,
  MigrationRecord,
  MigrationResult,
  MigrationRunner,
  MigrationRunnerConfig,
  // Main components
  MigrationService,
  MigrationStats,
  MigrationStatus,
  MigrationStorage,
  // Utilities
  MigrationUtils,
  MigrationValidationError,
  MigrationValidator,
  RollbackResult,
} from './migrations'
// Enhanced connection pool exports
export {
  type ConnectionMetrics,
  type ConnectionPoolConfig,
  createEnhancedConnectionPool,
  EnhancedConnectionPool,
  type PoolMetrics,
  type PoolStatistics,
} from './pool'
export {
  createPoolHealthChecker,
  type EmergencyModeStatus,
  type HealthCheckConfig,
  type HealthCheckResult,
  PoolHealthChecker,
  type RecoveryAction,
} from './pool-health-checker'
export {
  ConnectionPoolMonitor,
  createConnectionPoolMonitor,
  type DetailedPoolMetrics,
  type PoolAlert,
  type PoolHealthReport,
  type PoolMonitoringConfig,
} from './pool-monitoring'
export {
  createDatabaseService,
  DatabaseService,
  type DatabaseServiceConfig,
  type DatabaseServiceMetrics,
  DEFAULT_DATABASE_SERVICE_CONFIG,
  getDatabaseService,
  type HealthCheckResult,
  resetDatabaseService,
} from './service'
