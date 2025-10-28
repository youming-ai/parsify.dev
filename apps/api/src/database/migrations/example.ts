/**
 * Example usage of the migration system
 *
 * This file demonstrates how to use the migration system
 * for database schema management in a D1 environment.
 */

import { createMigrationSystem, MigrationUtils } from './index'

// Example: Basic migration system setup
async function basicMigrationExample() {
  console.log('=== Basic Migration Example ===')

  // Create migration system with default configuration
  const migrationSystem = createMigrationSystem(db, {
    enableLogging: true,
    enableRollback: true,
    validateChecksums: true,
  })

  try {
    // Initialize the system
    await migrationSystem.initialize()
    console.log('Migration system initialized')

    // Get migration plan
    const plan = await migrationSystem.service.getMigrationPlan()
    console.log(`Found ${plan.migrations.length} pending migrations`)

    if (plan.migrations.length > 0) {
      // Run dry run first
      console.log('Running dry run...')
      const dryRunResult = await migrationSystem.runMigrations({ dryRun: true })

      console.log(
        `Dry run: ${dryRunResult.summary.successful} successful, ${dryRunResult.summary.failed} failed`
      )

      if (dryRunResult.summary.failed === 0) {
        // Run actual migrations
        console.log('Running migrations...')
        const result = await migrationSystem.runMigrations()

        console.log(
          `Completed: ${result.summary.successful} successful, ${result.summary.failed} failed`
        )

        // Get updated statistics
        const stats = await migrationSystem.getStats()
        console.log('Migration stats:', stats)
      }
    }

    // Check system health
    const health = await migrationSystem.healthCheck()
    console.log('System health:', health.isHealthy ? 'Healthy' : 'Unhealthy')

    if (!health.isHealthy) {
      console.log('Issues:', health.issues)
      console.log('Recommendations:', health.recommendations)
    }
  } catch (error) {
    console.error('Migration example failed:', error)
  }
}

// Example: Creating and using custom migrations
async function customMigrationExample() {
  console.log('=== Custom Migration Example ===')

  // Create a migration using the utility
  const migration = MigrationUtils.createMigration(
    '002',
    'Add user profiles',
    `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
    `,
    `
      DROP TABLE IF EXISTS user_profiles;
    `,
    {
      description: 'Add user profile functionality',
      dependencies: ['001'], // Depends on migration 001
    }
  )

  console.log('Created migration:', {
    id: migration.id,
    version: migration.version,
    name: migration.name,
    hasRollback: !!migration.down,
    checksum: migration.checksum,
  })

  // Validate the migration
  const migrationSystem = createMigrationSystem(db)
  await migrationSystem.initialize()

  const validation = await migrationSystem.service.validateMigrations({
    versions: [migration.version],
  })

  console.log('Validation result:', validation.summary)

  if (validation.errors.length > 0) {
    console.log('Validation errors:', validation.errors)
  }
}

// Example: Using hooks for custom logic
async function hooksExample() {
  console.log('=== Migration Hooks Example ===')

  const migrationSystem = createMigrationSystem(db, {
    enableLogging: true,
  })

  // Create custom hook for logging
  const customLoggingHook = async (migration, context) => {
    console.log(`[${context.action.toUpperCase()}] ${migration.version}: ${migration.name}`)

    if (context.dryRun) {
      console.log('  Mode: DRY RUN')
    }
  }

  // Create backup hook for destructive operations
  const backupHook = async (migration, context) => {
    if (!context.dryRun && MigrationUtils.isProductionSafe(migration) === false) {
      console.log(`Creating backup before destructive migration: ${migration.version}`)
      // In a real implementation, you would create a backup here
      await createDatabaseBackup(migration.version)
    }
  }

  // Create performance monitoring hook
  const performanceMetrics = []

  const performanceHook = async (migration, context) => {
    const executionTime = Date.now() - context.startTime
    performanceMetrics.push({
      migrationId: migration.id,
      version: migration.version,
      executionTime,
      timestamp: Date.now(),
    })

    if (executionTime > 5000) {
      console.warn(`Slow migration detected: ${migration.version} took ${executionTime}ms`)
    }
  }

  // Register hooks
  migrationSystem.service.setHooks({
    beforeMigration: [customLoggingHook, backupHook],
    afterMigration: [performanceHook],
  })

  await migrationSystem.initialize()

  // Run migrations with hooks
  const _result = await migrationSystem.runMigrations()
  console.log(`Completed with ${performanceMetrics.length} performance metrics collected`)
}

// Example: Advanced configuration and monitoring
async function advancedExample() {
  console.log('=== Advanced Configuration Example ===')

  // Create migration system with advanced configuration
  const migrationSystem = createMigrationSystem(db, {
    // Basic configuration
    migrationsPath: './migrations',
    tableName: '__schema_migrations',

    // Logging configuration
    enableLogging: true,
    logLevel: 'info',

    // Execution configuration
    timeout: 60000, // 1 minute timeout
    retries: 5, // 5 retry attempts
    validateChecksums: true,

    // Rollback configuration
    enableRollback: true,
    requireRollback: false, // Don't require rollback SQL

    // Batch configuration
    enableBatchMode: true, // Run all migrations in a single transaction

    // Health monitoring
    enableHealthChecks: true,
    healthCheckInterval: 30000, // 30 seconds
  })

  await migrationSystem.initialize()

  // Get comprehensive monitoring data
  const [stats, health, history] = await Promise.all([
    migrationSystem.getStats(),
    migrationSystem.healthCheck(),
    migrationSystem.getHistory(10),
  ])

  console.log('=== Migration System Status ===')
  console.log('Statistics:', {
    total: stats.total,
    applied: stats.applied,
    pending: stats.pending,
    failed: stats.failed,
    averageTime: stats.averageExecutionTime,
  })

  console.log('Health Status:', {
    healthy: health.isHealthy,
    pendingMigrations: health.pendingMigrations,
    failedMigrations: health.failedMigrations,
    issues: health.issues.length,
    recommendations: health.recommendations.length,
  })

  console.log('Recent History:', {
    migrations: history.migrations.length,
    logs: history.logs.length,
  })

  // Get detailed logs for troubleshooting
  if (!health.isHealthy) {
    const errorLogs = migrationSystem.getLogs({
      level: 'error',
      limit: 10,
    })

    console.log('Recent errors:', errorLogs.length)
    errorLogs.forEach(log => {
      console.log(`- ${log.message} (${new Date(log.timestamp).toISOString()})`)
    })
  }

  // Cleanup old logs
  await migrationSystem.cleanup()
  console.log('Cleanup completed')
}

// Example: Rollback operations
async function rollbackExample() {
  console.log('=== Rollback Example ===')

  const migrationSystem = createMigrationSystem(db, {
    enableRollback: true,
    enableLogging: true,
  })

  await migrationSystem.initialize()

  try {
    // Get current migration status
    const stats = await migrationSystem.getStats()
    console.log(`Current status: ${stats.applied} applied, ${stats.failed} failed`)

    // Perform dry run rollback of last migration
    console.log('Running rollback dry run...')
    const dryRollback = await migrationSystem.rollbackMigrations({
      steps: 1,
      dryRun: true,
    })

    console.log(`Dry rollback: ${dryRollback.results.length} migrations would be rolled back`)

    // If dry run successful, perform actual rollback
    if (dryRollback.results.every(r => r.success || r.dryRun)) {
      console.log('Performing actual rollback...')
      const rollbackResult = await migrationSystem.rollbackMigrations({
        steps: 1,
        dryRun: false,
      })

      const successful = rollbackResult.results.filter(r => r.success).length
      const failed = rollbackResult.results.filter(r => !r.success).length

      console.log(`Rollback completed: ${successful} successful, ${failed} failed`)

      // Get updated stats
      const newStats = await migrationSystem.getStats()
      console.log(`Updated status: ${newStats.applied} applied, ${newStats.rolledBack} rolled back`)
    }
  } catch (error) {
    console.error('Rollback example failed:', error)
  }
}

// Example: Migration utilities
async function utilitiesExample() {
  console.log('=== Migration Utilities Example ===')

  // Create migrations with different characteristics
  const safeMigration = MigrationUtils.createMigration(
    '001',
    'Create users table',
    `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL
      );
    `,
    `DROP TABLE IF EXISTS users;`,
    { description: 'Safe table creation' }
  )

  const destructiveMigration = MigrationUtils.createMigration(
    '002',
    'Clean old data',
    `
      DELETE FROM users WHERE created_at < ?;
    `,
    `
      -- Cannot rollback delete operation without backup
      INSERT INTO users (id, email, created_at)
      SELECT id, email, created_at FROM users_backup;
    `,
    { description: 'Destructive data cleanup' }
  )

  console.log('Migration safety analysis:')
  console.log(`- Safe migration: ${MigrationUtils.isProductionSafe(safeMigration)}`)
  console.log(`- Destructive migration: ${MigrationUtils.isProductionSafe(destructiveMigration)}`)

  console.log('Execution time estimates:')
  console.log(`- Safe migration: ${MigrationUtils.estimateExecutionTime(safeMigration)}ms`)
  console.log(
    `- Destructive migration: ${MigrationUtils.estimateExecutionTime(destructiveMigration)}ms`
  )

  // Generate filenames
  const filename1 = MigrationUtils.generateFilename('001', 'Create users table')
  const filename2 = MigrationUtils.generateFilename('002', 'Add user profiles')

  console.log('Generated filenames:')
  console.log(`- ${filename1}`)
  console.log(`- ${filename2}`)
}

// Mock database backup function (for demonstration)
async function createDatabaseBackup(version: string): Promise<void> {
  console.log(`Creating backup for migration ${version}...`)
  // In a real implementation, this would create an actual backup
  await new Promise(resolve => setTimeout(resolve, 100))
  console.log(`Backup created for migration ${version}`)
}

// Mock D1 database instance (for demonstration)
const db = {} as any // This would be your actual D1 database instance

// Run all examples
async function runAllExamples() {
  try {
    await basicMigrationExample()
    console.log('\n')

    await customMigrationExample()
    console.log('\n')

    await hooksExample()
    console.log('\n')

    await advancedExample()
    console.log('\n')

    await rollbackExample()
    console.log('\n')

    await utilitiesExample()
    console.log('\n')

    console.log('All examples completed successfully!')
  } catch (error) {
    console.error('Example execution failed:', error)
  }
}

// Export examples for external use
export {
  basicMigrationExample,
  customMigrationExample,
  hooksExample,
  advancedExample,
  rollbackExample,
  utilitiesExample,
  runAllExamples,
}

// Run examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error)
}
