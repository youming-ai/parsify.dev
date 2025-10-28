import type { D1Database } from '@cloudflare/workers-types'
import { DatabaseClient } from '../client'
import {
  DEFAULT_DATABASE_CLIENT_CONFIG,
  type Migration,
  type MigrationLogger,
  type MigrationRecord,
  MigrationStatus,
  type MigrationStorage,
} from './types'

/**
 * Migration storage implementation for tracking migration history in D1
 */
export class D1MigrationStorage implements MigrationStorage {
  private db: DatabaseClient
  private tableName: string
  private logger: MigrationLogger

  constructor(
    db: D1Database,
    options: {
      tableName?: string
      logger?: MigrationLogger
    } = {}
  ) {
    this.db = new DatabaseClient(db, DEFAULT_DATABASE_CLIENT_CONFIG)
    this.tableName = options.tableName || '__schema_migrations'
    this.logger = options.logger || this.createDefaultLogger()
  }

  /**
   * Initialize the migrations table
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing migration storage table', {
      tableName: this.tableName,
    })

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL,
        execution_time INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        error_message TEXT,
        dependencies TEXT -- JSON array string
      )
    `

    const createIndexesSQL = [
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_version ON ${this.tableName}(version)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_applied_at ON ${this.tableName}(applied_at)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status ON ${this.tableName}(status)`,
    ]

    try {
      // Create the main table
      await this.db.execute(createTableSQL)

      // Create indexes
      for (const indexSQL of createIndexesSQL) {
        await this.db.execute(indexSQL)
      }

      this.logger.info('Migration storage initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize migration storage', error)
      throw new Error(`Migration storage initialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get all applied migrations from the database
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      this.logger.debug('Fetching applied migrations')

      const rows = await this.db.query<MigrationRecord>(`
        SELECT
          id,
          version,
          name,
          description,
          checksum,
          applied_at,
          execution_time,
          status,
          error_message,
          dependencies
        FROM ${this.tableName}
        ORDER BY applied_at ASC
      `)

      this.logger.debug(`Found ${rows.length} applied migrations`)
      return rows
    } catch (error) {
      this.logger.error('Failed to fetch applied migrations', error)
      throw new Error(`Failed to fetch applied migrations: ${(error as Error).message}`)
    }
  }

  /**
   * Record a successful migration
   */
  async recordMigration(migration: Migration, executionTime: number): Promise<void> {
    try {
      this.logger.info('Recording migration', {
        id: migration.id,
        version: migration.version,
        name: migration.name,
        executionTime,
      })

      const dependenciesJSON = migration.dependencies
        ? JSON.stringify(migration.dependencies)
        : null

      await this.db.execute(
        `
        INSERT OR REPLACE INTO ${this.tableName} (
          id, version, name, description, checksum, applied_at,
          execution_time, status, error_message, dependencies
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          migration.id,
          migration.version,
          migration.name,
          migration.description || null,
          migration.checksum,
          Date.now(),
          executionTime,
          MigrationStatus.COMPLETED,
          null,
          dependenciesJSON,
        ]
      )

      this.logger.info('Migration recorded successfully')
    } catch (error) {
      this.logger.error('Failed to record migration', error)
      throw new Error(`Failed to record migration: ${(error as Error).message}`)
    }
  }

  /**
   * Record a rollback
   */
  async recordRollback(migration: Migration, executionTime: number): Promise<void> {
    try {
      this.logger.info('Recording migration rollback', {
        id: migration.id,
        version: migration.version,
        name: migration.name,
        executionTime,
      })

      await this.db.execute(
        `
        UPDATE ${this.tableName}
        SET status = ?, error_message = ?
        WHERE id = ?
      `,
        [
          MigrationStatus.ROLLED_BACK,
          `Rolled back successfully in ${executionTime}ms`,
          migration.id,
        ]
      )

      this.logger.info('Migration rollback recorded successfully')
    } catch (error) {
      this.logger.error('Failed to record migration rollback', error)
      throw new Error(`Failed to record migration rollback: ${(error as Error).message}`)
    }
  }

  /**
   * Update migration status
   */
  async updateMigrationStatus(id: string, status: MigrationStatus, error?: string): Promise<void> {
    try {
      this.logger.debug('Updating migration status', {
        id,
        status,
        hasError: !!error,
      })

      if (status === MigrationStatus.RUNNING) {
        // Insert as running first
        await this.db.execute(
          `
          INSERT OR IGNORE INTO ${this.tableName} (
            id, version, name, checksum, applied_at, execution_time, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [id, id, id, 'temp', Date.now(), 0, status]
        )
      } else {
        // Update existing record
        await this.db.execute(
          `
          UPDATE ${this.tableName}
          SET status = ?, error_message = ?
          WHERE id = ?
        `,
          [status, error || null, id]
        )
      }

      this.logger.debug('Migration status updated successfully')
    } catch (error) {
      this.logger.error('Failed to update migration status', error)
      throw new Error(`Failed to update migration status: ${(error as Error).message}`)
    }
  }

  /**
   * Check if a migration exists
   */
  async migrationExists(version: string): Promise<boolean> {
    try {
      const result = await this.db.queryFirst<{ count: number }>(
        `
        SELECT COUNT(*) as count
        FROM ${this.tableName}
        WHERE version = ?
      `,
        [version]
      )

      return result?.count > 0 || false
    } catch (error) {
      this.logger.error('Failed to check if migration exists', {
        version,
        error,
      })
      return false
    }
  }

  /**
   * Get migration by version
   */
  async getMigrationByVersion(version: string): Promise<MigrationRecord | null> {
    try {
      const migration = await this.db.queryFirst<MigrationRecord>(
        `
        SELECT
          id, version, name, description, checksum, applied_at,
          execution_time, status, error_message, dependencies
        FROM ${this.tableName}
        WHERE version = ?
        LIMIT 1
      `,
        [version]
      )

      return migration || null
    } catch (error) {
      this.logger.error('Failed to get migration by version', {
        version,
        error,
      })
      return null
    }
  }

  /**
   * Get migration by ID
   */
  async getMigrationById(id: string): Promise<MigrationRecord | null> {
    try {
      const migration = await this.db.queryFirst<MigrationRecord>(
        `
        SELECT
          id, version, name, description, checksum, applied_at,
          execution_time, status, error_message, dependencies
        FROM ${this.tableName}
        WHERE id = ?
        LIMIT 1
      `,
        [id]
      )

      return migration || null
    } catch (error) {
      this.logger.error('Failed to get migration by ID', { id, error })
      return null
    }
  }

  /**
   * Get the latest applied migration
   */
  async getLatestMigration(): Promise<MigrationRecord | null> {
    try {
      const migration = await this.db.queryFirst<MigrationRecord>(
        `
        SELECT
          id, version, name, description, checksum, applied_at,
          execution_time, status, error_message, dependencies
        FROM ${this.tableName}
        WHERE status = ?
        ORDER BY applied_at DESC
        LIMIT 1
      `,
        [MigrationStatus.COMPLETED]
      )

      return migration || null
    } catch (error) {
      this.logger.error('Failed to get latest migration', error)
      return null
    }
  }

  /**
   * Clean up old migration records (optional maintenance)
   */
  async cleanup(options: { keepDays?: number; keepRecords?: number } = {}): Promise<void> {
    const { keepDays = 90, keepRecords = 100 } = options

    try {
      this.logger.info('Starting migration cleanup', { keepDays, keepRecords })

      // Delete records older than keepDays, but keep at least keepRecords
      const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000

      await this.db.execute(
        `
        DELETE FROM ${this.tableName}
        WHERE id NOT IN (
          SELECT id FROM ${this.tableName}
          ORDER BY applied_at DESC
          LIMIT ?
        )
        AND applied_at < ?
      `,
        [keepRecords, cutoffTime]
      )

      this.logger.info('Migration cleanup completed')
    } catch (error) {
      this.logger.error('Failed to cleanup migration records', error)
      throw new Error(`Migration cleanup failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get migration statistics
   */
  async getStats(): Promise<{
    total: number
    completed: number
    failed: number
    rolledBack: number
    averageExecutionTime: number
    lastMigrationTime?: number
  }> {
    try {
      const stats = await this.db.queryFirst<{
        total: number
        completed: number
        failed: number
        rolled_back: number
        avg_execution_time: number
        last_migration: number
      }>(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'rolled_back' THEN 1 END) as rolled_back,
          AVG(execution_time) as avg_execution_time,
          MAX(applied_at) as last_migration
        FROM ${this.tableName}
      `)

      return {
        total: stats?.total || 0,
        completed: stats?.completed || 0,
        failed: stats?.failed || 0,
        rolledBack: stats?.rolled_back || 0,
        averageExecutionTime: stats?.avg_execution_time || 0,
        lastMigrationTime: stats?.last_migration,
      }
    } catch (error) {
      this.logger.error('Failed to get migration stats', error)
      return {
        total: 0,
        completed: 0,
        failed: 0,
        rolledBack: 0,
        averageExecutionTime: 0,
      }
    }
  }

  /**
   * Create a default logger if none provided
   */
  private createDefaultLogger(): MigrationLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[MigrationStorage] ${message}`, ...args)
        }
      },
      info: (message: string, ...args: any[]) => {
        console.info(`[MigrationStorage] ${message}`, ...args)
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[MigrationStorage] ${message}`, ...args)
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[MigrationStorage] ${message}`, ...args)
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
        console[level](`[MigrationStorage] ${message}`, ...args)
      },
    }
  }
}

/**
 * Factory function to create migration storage
 */
export function createMigrationStorage(
  db: D1Database,
  options?: {
    tableName?: string
    logger?: MigrationLogger
  }
): MigrationStorage {
  return new D1MigrationStorage(db, options)
}
