# Database Migration System for D1

A comprehensive migration system for Cloudflare D1 with version tracking, rollback capabilities, validation, monitoring, and automated execution hooks.

## Features

- ✅ **Version Tracking**: Complete migration history and status tracking
- ✅ **Rollback Support**: Safe rollback functionality with validation
- ✅ **Validation**: SQL syntax validation and dry-run mode
- ✅ **Monitoring**: Comprehensive logging and health checks
- ✅ **Safety Checks**: Protection against destructive operations
- ✅ **Hooks**: Automated execution hooks for custom logic
- ✅ **Batch Mode**: Transaction-based migration execution
- ✅ **TypeScript**: Full TypeScript support with proper types

## Quick Start

```typescript
import { createMigrationSystem } from './database/migrations'

// Create migration system
const migrationSystem = createMigrationSystem(db, {
  enableLogging: true,
  enableRollback: true,
  validateChecksums: true
})

// Initialize
await migrationSystem.initialize()

// Run pending migrations
const result = await migrationSystem.runMigrations({
  dryRun: false // Set to true for dry run
})

console.log(`Migrations completed: ${result.results.filter(r => r.success).length}`)
```

## Core Concepts

### Migration

A migration represents a single schema change with version tracking:

```typescript
const migration = {
  id: 'migration-id',
  version: '001',
  name: 'Create users table',
  description: 'Initial user table setup',
  up: `
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    )
  `,
  down: `
    DROP TABLE users
  `,
  checksum: 'abc123',
  dependencies: [], // Optional dependencies
  createdAt: Date.now(),
  status: 'pending'
}
```

### Migration Service

The main orchestrator that manages all migration operations:

```typescript
import { createMigrationService } from './database/migrations'

const service = createMigrationService(db, {
  migrationsPath: './migrations',
  enableLogging: true,
  enableRollback: true
})

await service.initialize()

// Get migration plan
const plan = await service.getMigrationPlan()
console.log(`Pending migrations: ${plan.migrations.length}`)

// Run migrations
const result = await service.runMigrations()

// Check health
const health = await service.healthCheck()
console.log(`System healthy: ${health.isHealthy}`)
```

## Advanced Usage

### Custom Hooks

Add custom logic for migration events:

```typescript
import { BuiltInHooks } from './database/migrations'

// Create custom hook
const loggingHook = BuiltInHooks.createLoggingHook(console)

// Register hook
migrationSystem.service.setHooks({
  beforeMigration: [loggingHook],
  afterMigration: [loggingHook]
})

// Or create custom hook
const backupHook = async (migration, context) => {
  if (!context.dryRun) {
    // Create backup before migration
    await createBackup(migration)
  }
}

migrationSystem.service.setHooks({
  beforeMigration: [backupHook]
})
```

### Validation

Validate migrations before execution:

```typescript
// Validate all migrations
const validation = await service.validateMigrations()

if (validation.errors.length > 0) {
  console.error('Validation errors:', validation.errors)
  throw new Error('Migration validation failed')
}

// Dry run
const dryRun = await service.runMigrations({ dryRun: true })
console.log('Dry run completed:', dryRun.summary)
```

### Rollback

Rollback migrations safely:

```typescript
// Rollback last migration
const rollbackResult = await service.rollbackMigrations({
  steps: 1
})

// Rollback specific versions
const rollbackResult = await service.rollbackMigrations({
  versions: ['001', '002']
})

// Dry run rollback
const dryRollback = await service.rollbackMigrations({
  steps: 1,
  dryRun: true
})
```

### Monitoring

Monitor migration execution and health:

```typescript
// Get statistics
const stats = await service.getStats()
console.log(`Total migrations: ${stats.total}`)
console.log(`Applied: ${stats.applied}`)
console.log(`Failed: ${stats.failed}`)

// Get logs
const logs = service.getLogs({
  level: 'error',
  limit: 10
})

// Get history
const history = await service.getHistory(50)
```

## Configuration

### Migration Service Configuration

```typescript
const service = createMigrationService(db, {
  // Basic settings
  migrationsPath: './migrations',
  tableName: '__schema_migrations',
  
  // Logging
  enableLogging: true,
  logLevel: 'info',
  
  // Execution
  timeout: 30000,
  retries: 3,
  validateChecksums: true,
  
  // Rollback
  enableRollback: true,
  requireRollback: false,
  
  // Batch mode
  enableBatchMode: false,
  
  // Health checks
  enableHealthChecks: true,
  healthCheckInterval: 60000
})
```

### Migration Options

```typescript
const options = {
  dryRun: false,           // Dry run mode
  force: false,            // Skip validation
  timeout: 30000,          // Query timeout
  retries: 3,              // Retry attempts
  validateChecksums: true, // Validate checksums
  stopOnFirstError: true,  // Stop on first error
  batch: false             // Run in transaction
}
```

## Migration File Format

Migrations should be stored as separate SQL files:

```
migrations/
├── 001_create_users.sql
├── 002_add_user_profile.sql
└── 003_create_posts.sql
```

### Example Migration File

```sql
-- 001_create_users.sql
-- Version: 001
-- Description: Create users table with basic fields

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Rollback
-- DROP TABLE IF EXISTS users;
```

## Best Practices

### 1. Migration Design

- Keep migrations small and focused
- Always provide rollback SQL
- Use `IF NOT EXISTS` and `IF EXISTS` clauses
- Avoid destructive operations in production
- Test migrations thoroughly

### 2. Version Management

- Use semantic versioning (001, 002, etc.)
- Never modify existing migration files
- Create new migrations for schema changes
- Document dependencies between migrations

### 3. Safety

- Always run dry-runs first
- Validate migrations in staging
- Use backups before major migrations
- Monitor migration execution
- Test rollback procedures

### 4. Performance

- Batch multiple small changes
- Use transactions when appropriate
- Monitor execution times
- Optimize large migrations
- Consider maintenance windows

## Error Handling

The migration system provides comprehensive error handling:

```typescript
try {
  const result = await service.runMigrations()
  
  // Check for failures
  const failures = result.results.filter(r => !r.success)
  if (failures.length > 0) {
    console.error('Some migrations failed:', failures)
  }
  
} catch (error) {
  console.error('Migration run failed:', error.message)
  
  // Check health status
  const health = await service.healthCheck()
  if (!health.isHealthy) {
    console.error('System health issues:', health.issues)
  }
}
```

## Monitoring and Health

### Health Checks

```typescript
const health = await service.healthCheck()

if (!health.isHealthy) {
  console.log('Health issues:', health.issues)
  console.log('Recommendations:', health.recommendations)
  
  // Common issues:
  // - Failed migrations
  // - Stuck migrations
  // - High failure rate
  // - Performance issues
  // - Database connectivity
}
```

### Statistics

```typescript
const stats = await service.getStats()

console.log(`
Migration Statistics:
- Total: ${stats.total}
- Applied: ${stats.applied}
- Pending: ${stats.pending}
- Failed: ${stats.failed}
- Rolled Back: ${stats.rolledBack}
- Average Time: ${stats.averageExecutionTime}ms
- Last Migration: ${new Date(stats.lastMigrationTime || 0).toISOString()}
`)
```

## Troubleshooting

### Common Issues

1. **Migration Stuck**
   - Check health status
   - Review logs for errors
   - Consider rollback if safe

2. **Validation Errors**
   - Review SQL syntax
   - Check dependencies
   - Verify rollback SQL

3. **Performance Issues**
   - Check execution times
   - Optimize large migrations
   - Consider batch mode

4. **Rollback Failures**
   - Verify rollback SQL
   - Check data integrity
   - Manual intervention may be needed

### Debug Logging

Enable debug logging for troubleshooting:

```typescript
const service = createMigrationService(db, {
  enableLogging: true,
  logLevel: 'debug'
})
```

## API Reference

### Classes

- `MigrationService` - Main migration orchestrator
- `MigrationRunner` - Migration execution engine
- `MigrationValidator` - Validation and dry-run
- `MigrationMonitor` - Logging and monitoring
- `MigrationStorage` - Version tracking
- `MigrationHooks` - Hook management

### Functions

- `createMigrationService()` - Create migration service
- `createMigrationSystem()` - Create complete system
- `createMigrationRunner()` - Create runner
- `createMigrationValidator()` - Create validator

### Types

- `Migration` - Migration definition
- `MigrationOptions` - Execution options
- `MigrationResult` - Execution result
- `MigrationHealthCheck` - Health status
- `MigrationStats` - Statistics

## Migration System Version

Current version: **1.0.0**

The migration system is designed to be backward compatible and follows semantic versioning.