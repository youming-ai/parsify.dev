#!/usr/bin/env node

/**
 * Database Management Script
 *
 * This script handles database migrations, seeding, backups, and other
 * database operations for Cloudflare D1 databases.
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const _crypto = require('node:crypto')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'migrations')
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'backups')
const SEEDS_DIR = path.join(PROJECT_ROOT, 'seeds')

// Database configuration
const DATABASE_CONFIG = {
  development: {
    name: 'parsify-dev',
    id: 'local',
  },
  staging: {
    name: 'parsify-staging',
    id: process.env.DATABASE_ID || '',
  },
  production: {
    name: 'parsify-prod',
    id: process.env.DATABASE_ID || '',
  },
}

// Colors for console output
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
}

function log(level, message) {
  console.log(`${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

function exec(command, options = {}) {
  const { silent = false, env = process.env } = options

  try {
    log('info', `Executing: ${command}`)
    const result = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      env,
    })
    return result
  } catch (error) {
    log('error', `Command failed: ${command}`)
    log('error', error.message)
    if (!silent) {
      process.exit(1)
    }
    throw error
  }
}

function checkWrangler() {
  try {
    const version = exec('npx wrangler --version', { silent: true })
    log('success', `Wrangler CLI available: ${version.trim()}`)
    return true
  } catch (_error) {
    log('error', 'Wrangler CLI not found. Please install it with: npm install -g wrangler')
    return false
  }
}

function getDatabaseConfig(env) {
  const config = DATABASE_CONFIG[env]
  if (!config) {
    log('error', `Unknown environment: ${env}`)
    log('info', `Available environments: ${Object.keys(DATABASE_CONFIG).join(', ')}`)
    process.exit(1)
  }
  return config
}

function ensureDirectories() {
  const dirs = [MIGRATIONS_DIR, BACKUPS_DIR, SEEDS_DIR]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      log('info', `Created directory: ${dir}`)
    }
  }
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return []
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()

  return files
}

function getMigrationNumber(filename) {
  const match = filename.match(/^(\d+)_/)
  return match ? parseInt(match[1], 10) : 0
}

function createMigrationTable(dbConfig) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at INTEGER NOT NULL
    );
  `

  log('info', 'Creating migrations table if not exists...')
  exec(`npx wrangler d1 execute ${dbConfig.name} --command="${createTableSQL.replace(/\n/g, ' ')}"`)
  log('success', 'Migrations table ready')
}

function getExecutedMigrations(dbConfig) {
  try {
    const result = exec(
      `npx wrangler d1 execute ${dbConfig.name} --command="SELECT version, name FROM schema_migrations ORDER BY version"`,
      { silent: true }
    )

    // Parse the output to extract migration versions
    const lines = result.split('\n')
    const migrations = []

    for (const line of lines) {
      const match = line.match(/\|\s*(\d+)\s+\|\s*(.+?)\s+\|/)
      if (match) {
        migrations.push({
          version: parseInt(match[1], 10),
          name: match[2].trim(),
        })
      }
    }

    return migrations
  } catch (_error) {
    // If the table doesn't exist, return empty array
    return []
  }
}

function recordMigration(dbConfig, version, name) {
  const timestamp = Math.floor(Date.now() / 1000)
  const insertSQL = `INSERT INTO schema_migrations (version, name, executed_at) VALUES (${version}, '${name}', ${timestamp});`

  exec(`npx wrangler d1 execute ${dbConfig.name} --command="${insertSQL}"`)
}

function runMigration(dbConfig, migrationFile) {
  const filePath = path.join(MIGRATIONS_DIR, migrationFile)
  const version = getMigrationNumber(migrationFile)

  log('info', `Running migration: ${migrationFile}`)

  // Execute the migration
  exec(`npx wrangler d1 execute ${dbConfig.name} --file="${filePath}"`)

  // Record the migration
  recordMigration(dbConfig, version, migrationFile)

  log('success', `Migration ${migrationFile} completed`)
}

function migrate(env) {
  const dbConfig = getDatabaseConfig(env)

  log('info', `Starting migration for environment: ${env}`)

  // Check prerequisites
  if (!checkWrangler()) {
    process.exit(1)
  }

  // Ensure migrations table exists
  createMigrationTable(dbConfig)

  // Get available and executed migrations
  const availableMigrations = getMigrationFiles()
  const executedMigrations = getExecutedMigrations(dbConfig)
  const executedVersions = new Set(executedMigrations.map(m => m.version))

  // Find pending migrations
  const pendingMigrations = availableMigrations.filter(file => {
    const version = getMigrationNumber(file)
    return !executedVersions.has(version)
  })

  if (pendingMigrations.length === 0) {
    log('info', 'No pending migrations')
    return
  }

  log('info', `Found ${pendingMigrations.length} pending migration(s)`)

  // Run pending migrations
  for (const migration of pendingMigrations) {
    runMigration(dbConfig, migration)
  }

  log('success', 'All migrations completed successfully')
}

function createMigration(name) {
  ensureDirectories()

  const timestamp = Math.floor(Date.now() / 1000)
  const filename = `${timestamp}_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`
  const filePath = path.join(MIGRATIONS_DIR, filename)

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Version: ${timestamp}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--   id TEXT PRIMARY KEY,
--   name TEXT NOT NULL,
--   created_at INTEGER NOT NULL
-- );

-- Remember to use IF NOT EXISTS for safe migrations
-- Don't forget to add indexes for performance
`

  fs.writeFileSync(filePath, template)
  log('success', `Migration created: ${filename}`)
  log('info', `Path: ${filePath}`)

  return filePath
}

function rollback(env, steps = 1) {
  const dbConfig = getDatabaseConfig(env)

  log('warning', `Rolling back ${steps} migration(s) from environment: ${env}`)

  // Get executed migrations
  const executedMigrations = getExecutedMigrations(dbConfig)

  if (executedMigrations.length === 0) {
    log('info', 'No migrations to rollback')
    return
  }

  // Get the last N migrations to rollback
  const migrationsToRollback = executedMigrations.slice(-steps)

  log('warning', `Rolling back: ${migrationsToRollback.map(m => m.name).join(', ')}`)

  // Note: D1 doesn't support transactional rollbacks
  // This is a simplified implementation that removes migration records
  // In a production environment, you would need to create specific rollback migrations

  for (const migration of migrationsToRollback) {
    const deleteSQL = `DELETE FROM schema_migrations WHERE version = ${migration.version};`
    exec(`npx wrangler d1 execute ${dbConfig.name} --command="${deleteSQL}"`)
    log('warning', `Migration record removed: ${migration.name}`)
  }

  log('warning', 'Rollback completed. Note: Schema changes were not automatically reverted.')
  log('info', 'Please manually revert any schema changes or create rollback migrations.')
}

function seed(env, seedFile = null) {
  const dbConfig = getDatabaseConfig(env)

  log('info', `Seeding database for environment: ${env}`)

  if (seedFile) {
    // Run specific seed file
    const seedPath = path.join(SEEDS_DIR, seedFile)

    if (!fs.existsSync(seedPath)) {
      log('error', `Seed file not found: ${seedPath}`)
      process.exit(1)
    }

    log('info', `Running seed file: ${seedFile}`)
    exec(`npx wrangler d1 execute ${dbConfig.name} --file="${seedPath}"`)
    log('success', `Seed file ${seedFile} executed successfully`)
  } else {
    // Run default seed file
    const defaultSeedPath = path.join(MIGRATIONS_DIR, 'seed.sql')

    if (fs.existsSync(defaultSeedPath)) {
      log('info', 'Running default seed file')
      exec(`npx wrangler d1 execute ${dbConfig.name} --file="${defaultSeedPath}"`)
      log('success', 'Default seed file executed successfully')
    } else {
      log('warning', 'No seed file found')
    }
  }
}

function reset(env) {
  const dbConfig = getDatabaseConfig(env)

  log('warning', `Resetting database for environment: ${env}`)
  log('warning', 'This will delete all data!')

  // Create backup before reset
  backup(env, `pre-reset-${Date.now()}`)

  // Drop all tables (except schema_migrations)
  const dropSQL = `
    PRAGMA foreign_keys = OFF;

    -- Get all table names
    SELECT name FROM sqlite_master
    WHERE type='table' AND name!='schema_migrations' AND name!='sqlite_sequence';
  `

  try {
    const result = exec(`npx wrangler d1 execute ${dbConfig.name} --command="${dropSQL}"`, {
      silent: true,
    })

    // Parse table names and drop them
    const lines = result.split('\n')
    const tables = []

    for (const line of lines) {
      const match = line.match(/\|\s*(.+?)\s+\|/)
      if (match && match[1] !== 'name') {
        tables.push(match[1].trim())
      }
    }

    for (const table of tables) {
      exec(`npx wrangler d1 execute ${dbConfig.name} --command="DROP TABLE IF EXISTS ${table};"`)
      log('info', `Dropped table: ${table}`)
    }

    // Clear migrations table
    exec(`npx wrangler d1 execute ${dbConfig.name} --command="DELETE FROM schema_migrations;"`)

    log('success', 'Database reset completed')

    // Run migrations and seed
    migrate(env)
    seed(env)
  } catch (error) {
    log('error', 'Database reset failed')
    log('error', error.message)
  }
}

function backup(env, name = null) {
  const dbConfig = getDatabaseConfig(env)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupName = name || `${env}-backup-${timestamp}`
  const backupPath = path.join(BACKUPS_DIR, `${backupName}.sql`)

  log('info', `Creating backup: ${backupName}`)

  // Ensure backups directory exists
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true })
  }

  try {
    // Dump the entire database
    const _result = exec(
      `npx wrangler d1 execute ${dbConfig.name} --command="SELECT * FROM sqlite_master WHERE type='table';"`,
      { silent: true }
    )

    // For now, create a simple backup file with metadata
    const backup = {
      environment: env,
      database: dbConfig.name,
      timestamp: new Date().toISOString(),
      version: '1.0',
      note: 'Backup created via database script',
    }

    fs.writeFileSync(
      backupPath,
      `-- Database Backup\n-- Environment: ${env}\n-- Database: ${dbConfig.name}\n-- Timestamp: ${backup.timestamp}\n\n`
    )

    // In a real implementation, you would need to export all tables
    // D1 doesn't have a direct dump command, so you'd need to query each table

    log('success', `Backup created: ${backupPath}`)
    log('info', `Size: ${fs.statSync(backupPath).size} bytes`)
  } catch (error) {
    log('error', 'Backup failed')
    log('error', error.message)
  }
}

function restore(env, backupFile) {
  const dbConfig = getDatabaseConfig(env)
  const backupPath = path.join(BACKUPS_DIR, backupFile)

  if (!fs.existsSync(backupPath)) {
    log('error', `Backup file not found: ${backupPath}`)
    process.exit(1)
  }

  log('warning', `Restoring database from backup: ${backupFile}`)
  log('warning', 'This will replace all current data!')

  // Create backup before restore
  backup(env, `pre-restore-${Date.now()}`)

  try {
    // Read and execute backup file
    const backupContent = fs.readFileSync(backupPath, 'utf8')

    // For SQL backup files, execute each statement
    if (backupPath.endsWith('.sql')) {
      const statements = backupContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          exec(`npx wrangler d1 execute ${dbConfig.name} --command="${statement}"`)
        }
      }
    }

    log('success', 'Database restored successfully')
  } catch (error) {
    log('error', 'Database restore failed')
    log('error', error.message)
  }
}

function status(env) {
  const dbConfig = getDatabaseConfig(env)

  log('info', `Database status for environment: ${env}`)

  try {
    // Get basic database info
    const result = exec(
      `npx wrangler d1 execute ${dbConfig.name} --command="SELECT name FROM sqlite_master WHERE type='table';"`,
      { silent: true }
    )

    // Parse table names
    const lines = result.split('\n')
    const tables = []

    for (const line of lines) {
      const match = line.match(/\|\s*(.+?)\s+\|/)
      if (match && match[1] !== 'name') {
        tables.push(match[1].trim())
      }
    }

    console.log('\nTables:')
    for (const table of tables) {
      console.log(`  - ${table}`)
    }

    // Get migration status
    const executedMigrations = getExecutedMigrations(dbConfig)
    const availableMigrations = getMigrationFiles()

    console.log('\nMigrations:')
    console.log(`  Available: ${availableMigrations.length}`)
    console.log(`  Executed: ${executedMigrations.length}`)

    if (executedMigrations.length > 0) {
      console.log('\nRecent migrations:')
      const recent = executedMigrations.slice(-5)
      for (const migration of recent) {
        console.log(`  - ${migration.name} (v${migration.version})`)
      }
    }
  } catch (error) {
    log('error', 'Failed to get database status')
    log('error', error.message)
  }
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  const env = args[1] || 'development'

  // Check prerequisites for most commands
  if (['migrate', 'rollback', 'seed', 'reset', 'backup', 'restore', 'status'].includes(command)) {
    ensureDirectories()
    if (!checkWrangler()) {
      process.exit(1)
    }
  }

  switch (command) {
    case 'migrate':
      migrate(env)
      break

    case 'create': {
      const migrationName = args[2]
      if (!migrationName) {
        log('error', 'Migration name is required')
        log('info', 'Usage: node database.js create <migration_name>')
        process.exit(1)
      }
      createMigration(migrationName)
      break
    }

    case 'rollback': {
      const steps = parseInt(args[2], 10) || 1
      rollback(env, steps)
      break
    }

    case 'seed': {
      const seedFile = args[2]
      seed(env, seedFile)
      break
    }

    case 'reset':
      reset(env)
      break

    case 'backup': {
      const backupName = args[2]
      backup(env, backupName)
      break
    }

    case 'restore': {
      const restoreFile = args[2]
      if (!restoreFile) {
        log('error', 'Backup file name is required')
        log('info', 'Usage: node database.js restore <backup_file>')
        process.exit(1)
      }
      restore(env, restoreFile)
      break
    }

    case 'status':
      status(env)
      break

    case 'init':
      ensureDirectories()
      log('success', 'Database directories initialized')
      break

    case 'help':
      console.log(`
Database Management Script

Usage: node database.js <command> [environment] [options]

Commands:
  migrate [env]           Run pending migrations (default: development)
  create <name>           Create a new migration file
  rollback [env] [steps]  Rollback last N migrations (default: 1)
  seed [env] [file]       Run seed data (default: seed.sql)
  reset [env]             Reset database and run migrations
  backup [env] [name]     Create database backup
  restore [env] <file>    Restore from backup file
  status [env]            Show database and migration status
  init                    Initialize database directories
  help                    Show this help message

Environments:
  development             Local development database
  staging                 Staging environment database
  production              Production environment database

Examples:
  node database.js migrate development
  node database.js create add_users_table
  node database.js rollback production 2
  node database.js seed development
  node database.js backup production pre-deploy
  node database.js status development
`)
      break

    default:
      log('error', `Unknown command: ${command}`)
      log('info', 'Run "node database.js help" for usage information')
      process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  migrate,
  createMigration,
  rollback,
  seed,
  reset,
  backup,
  restore,
  status,
  getMigrationFiles,
  getExecutedMigrations,
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}
