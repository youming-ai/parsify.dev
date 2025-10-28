import type { D1Database } from '@cloudflare/workers-types'
import { DatabaseClient } from '../client'
import {
  type DatabaseSchemaInfo,
  DEFAULT_DATABASE_CLIENT_CONFIG,
  type MigrationHealthCheck,
  type MigrationLogEntry,
  type MigrationLogger,
  type MigrationStats,
} from './types'

/**
 * Migration monitoring and logging system
 */
export class MigrationMonitor {
  private db: DatabaseClient
  private logger: MigrationLogger
  private logEntries: MigrationLogEntry[] = []
  private maxLogEntries: number = 1000
  private enablePersistence: boolean
  private logTableName: string

  constructor(
    db: D1Database,
    options: {
      logger?: MigrationLogger
      maxLogEntries?: number
      enablePersistence?: boolean
      logTableName?: string
    } = {}
  ) {
    this.db = new DatabaseClient(db, DEFAULT_DATABASE_CLIENT_CONFIG)
    this.logger = options.logger || this.createDefaultLogger()
    this.maxLogEntries = options.maxLogEntries ?? 1000
    this.enablePersistence = options.enablePersistence ?? true
    this.logTableName = options.logTableName ?? '__migration_logs'
  }

  /**
   * Initialize monitoring system
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing migration monitoring')

    if (this.enablePersistence) {
      await this.createLogTable()
      await this.loadPersistedLogs()
    }

    this.logger.info('Migration monitoring initialized')
  }

  /**
   * Log migration event
   */
  async logEvent(
    migrationId: string,
    action: MigrationLogEntry['action'],
    message: string,
    details?: any,
    level: MigrationLogEntry['level'] = 'info'
  ): Promise<void> {
    const entry: MigrationLogEntry = {
      id: crypto.randomUUID(),
      migrationId,
      action,
      timestamp: Date.now(),
      message,
      details,
      level,
    }

    // Add to memory
    this.addLogEntry(entry)

    // Persist if enabled
    if (this.enablePersistence) {
      await this.persistLogEntry(entry)
    }

    // Log to console
    this.logToConsole(entry)
  }

  /**
   * Get migration statistics
   */
  async getStats(): Promise<MigrationStats> {
    this.logger.debug('Fetching migration statistics')

    try {
      // Get basic counts from logs
      const recentLogs = this.getRecentLogs(7 * 24 * 60 * 60 * 1000) // Last 7 days

      const total = recentLogs.filter(l => l.action === 'complete').length
      const applied = recentLogs.filter(l => l.action === 'complete' && l.level !== 'error').length
      const failed = recentLogs.filter(l => l.action === 'fail').length
      const rolledBack = recentLogs.filter(
        l => l.action === 'rollback' && l.level !== 'error'
      ).length

      // Calculate average execution time from logs
      const executionTimes = recentLogs
        .filter(l => l.action === 'complete' && l.details?.executionTime)
        .map(l => l.details.executionTime as number)

      const averageExecutionTime =
        executionTimes.length > 0
          ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
          : 0

      // Get last migration time
      const lastMigration = recentLogs
        .filter(l => l.action === 'complete')
        .sort((a, b) => b.timestamp - a.timestamp)[0]

      // Get oldest pending migration
      const oldestPendingLog = recentLogs
        .filter(l => l.action === 'start' && l.level === 'info')
        .sort((a, b) => a.timestamp - b.timestamp)[0]

      const stats: MigrationStats = {
        total,
        applied,
        pending: recentLogs.filter(l => l.action === 'start' && l.level === 'info').length,
        failed,
        rolledBack,
        averageExecutionTime,
        lastMigrationTime: lastMigration?.timestamp,
        oldestPendingMigration: oldestPendingLog?.timestamp,
      }

      this.logger.debug('Migration statistics retrieved', stats)
      return stats
    } catch (error) {
      this.logger.error('Failed to fetch migration statistics', error)

      // Return default stats
      return {
        total: 0,
        applied: 0,
        pending: 0,
        failed: 0,
        rolledBack: 0,
        averageExecutionTime: 0,
      }
    }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<MigrationHealthCheck> {
    this.logger.debug('Performing migration health check')

    const stats = await this.getStats()
    const recentLogs = this.getRecentLogs(24 * 60 * 60 * 1000) // Last 24 hours
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for failed migrations
    if (stats.failed > 0) {
      issues.push(`${stats.failed} migrations failed in the last 7 days`)
      recommendations.push('Review and resolve failed migrations')
    }

    // Check for long-running migrations
    const longRunningMigrations = recentLogs.filter(
      l =>
        l.action === 'start' &&
        l.level === 'info' &&
        !recentLogs.some(
          r =>
            r.migrationId === l.migrationId && r.action === 'complete' && r.timestamp > l.timestamp
        )
    )

    if (longRunningMigrations.length > 0) {
      issues.push(`${longRunningMigrations.length} migrations appear to be stuck`)
      recommendations.push('Check for stuck migrations and restart if necessary')
    }

    // Check for high failure rate
    const totalRecent = recentLogs.filter(
      l => l.action === 'complete' || l.action === 'fail'
    ).length
    const failureRate = totalRecent > 0 ? stats.failed / totalRecent : 0

    if (failureRate > 0.1) {
      // More than 10% failure rate
      issues.push(`High migration failure rate: ${(failureRate * 100).toFixed(1)}%`)
      recommendations.push('Investigate root causes of migration failures')
    }

    // Check for performance issues
    if (stats.averageExecutionTime > 30000) {
      // More than 30 seconds average
      issues.push(`Slow migrations detected: average ${stats.averageExecutionTime}ms`)
      recommendations.push('Optimize migration SQL or break into smaller migrations')
    }

    // Check database connectivity
    let isHealthy = true
    try {
      await this.db.query('SELECT 1 as health_check')
    } catch (_error) {
      isHealthy = false
      issues.push('Database connectivity issues detected')
      recommendations.push('Check database connection and credentials')
    }

    const healthCheck: MigrationHealthCheck = {
      isHealthy: issues.length === 0 && isHealthy,
      lastMigrationTime: stats.lastMigrationTime,
      pendingMigrations: stats.pending,
      failedMigrations: stats.failed,
      totalMigrations: stats.total,
      issues,
      recommendations,
    }

    this.logger.debug('Migration health check completed', {
      healthy: healthCheck.isHealthy,
      issues: issues.length,
      recommendations: recommendations.length,
    })

    return healthCheck
  }

  /**
   * Get database schema information
   */
  async getSchemaInfo(): Promise<DatabaseSchemaInfo> {
    this.logger.debug('Fetching database schema information')

    try {
      // Get table information
      const tables = await this.db.query<Array<{ name: string; sql: string }>>(`
        SELECT name, sql FROM sqlite_master
        WHERE type='table' AND name NOT LIKE '__%'
        ORDER BY name
      `)

      // Get view information
      const views = await this.db.query<Array<{ name: string; sql: string }>>(`
        SELECT name, sql FROM sqlite_master
        WHERE type='view' ORDER BY name
      `)

      // Get index information
      const indexes = await this.db.query<Array<{ name: string; tbl_name: string }>>(`
        SELECT name, tbl_name FROM sqlite_master
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `)

      // Get trigger information
      const triggers = await this.db.query<Array<{ name: string; tbl_name: string }>>(`
        SELECT name, tbl_name FROM sqlite_master
        WHERE type='trigger' ORDER BY name
      `)

      // Get migration information
      const migrationInfo = await this.db.queryFirst<{
        version: string
        count: number
      }>(`
        SELECT version, COUNT(*) as count FROM __schema_migrations
        WHERE status = 'completed'
        ORDER BY applied_at DESC LIMIT 1
      `)

      const schemaInfo: DatabaseSchemaInfo = {
        version: migrationInfo?.version || 'unknown',
        tables: tables.map(t => t.name),
        views: views.map(v => v.name),
        indexes: indexes.map(i => i.name),
        triggers: triggers.map(t => t.name),
        lastMigration: migrationInfo?.version,
        migrationCount: migrationInfo?.count || 0,
      }

      this.logger.debug('Database schema information retrieved', {
        tables: schemaInfo.tables.length,
        views: schemaInfo.views.length,
        indexes: schemaInfo.indexes.length,
        triggers: schemaInfo.triggers.length,
      })

      return schemaInfo
    } catch (error) {
      this.logger.error('Failed to fetch database schema information', error)

      // Return minimal schema info
      return {
        version: 'unknown',
        tables: [],
        views: [],
        indexes: [],
        triggers: [],
        migrationCount: 0,
      }
    }
  }

  /**
   * Get migration logs
   */
  getLogs(
    options: {
      migrationId?: string
      action?: MigrationLogEntry['action']
      level?: MigrationLogEntry['level']
      limit?: number
      offset?: number
      startTime?: number
      endTime?: number
    } = {}
  ): MigrationLogEntry[] {
    let filteredLogs = [...this.logEntries]

    // Apply filters
    if (options.migrationId) {
      filteredLogs = filteredLogs.filter(log => log.migrationId === options.migrationId)
    }

    if (options.action) {
      filteredLogs = filteredLogs.filter(log => log.action === options.action)
    }

    if (options.level) {
      filteredLogs = filteredLogs.filter(log => log.level === options.level)
    }

    if (options.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startTime!)
    }

    if (options.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endTime!)
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp)

    // Apply pagination
    const offset = options.offset || 0
    const limit = options.limit || 100

    return filteredLogs.slice(offset, offset + limit)
  }

  /**
   * Get logs for a specific migration
   */
  getMigrationLogs(migrationId: string): MigrationLogEntry[] {
    return this.getLogs({ migrationId })
  }

  /**
   * Get recent logs within time window
   */
  getRecentLogs(timeWindowMs: number = 24 * 60 * 60 * 1000): MigrationLogEntry[] {
    const startTime = Date.now() - timeWindowMs
    return this.getLogs({ startTime })
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit: number = 50): MigrationLogEntry[] {
    return this.getLogs({ level: 'error', limit })
  }

  /**
   * Clear logs
   */
  async clearLogs(
    options: { olderThan?: number; migrationId?: string; level?: MigrationLogEntry['level'] } = {}
  ): Promise<void> {
    const { olderThan, migrationId, level } = options

    this.logger.info('Clearing migration logs', {
      olderThan,
      migrationId,
      level,
    })

    // Clear from memory
    this.logEntries = this.logEntries.filter(log => {
      if (olderThan && log.timestamp < olderThan) return false
      if (migrationId && log.migrationId !== migrationId) return false
      if (level && log.level !== level) return false
      return true
    })

    // Clear from persistence if enabled
    if (this.enablePersistence) {
      try {
        let whereClause = '1=0' // Default to no rows
        const params: any[] = []

        const conditions: string[] = []

        if (olderThan) {
          conditions.push('timestamp < ?')
          params.push(olderThan)
        }

        if (migrationId) {
          conditions.push('migration_id = ?')
          params.push(migrationId)
        }

        if (level) {
          conditions.push('level = ?')
          params.push(level)
        }

        if (conditions.length > 0) {
          whereClause = conditions.join(' AND ')
          await this.db.execute(
            `
            DELETE FROM ${this.logTableName}
            WHERE ${whereClause}
          `,
            params
          )
        }

        this.logger.info('Migration logs cleared from persistence')
      } catch (error) {
        this.logger.error('Failed to clear migration logs from persistence', error)
      }
    }

    this.logger.info('Migration logs cleared', {
      remainingLogs: this.logEntries.length,
    })
  }

  /**
   * Export logs to JSON
   */
  exportLogs(
    options: {
      format?: 'json' | 'csv'
      migrationId?: string
      startTime?: number
      endTime?: number
    } = {}
  ): string {
    const logs = this.getLogs(options)
    const { format = 'json' } = options

    if (format === 'csv') {
      const headers = ['id', 'migrationId', 'action', 'timestamp', 'message', 'level']
      const rows = logs.map(log => [
        log.id,
        log.migrationId,
        log.action,
        log.timestamp,
        `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
        log.level,
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(logs, null, 2)
  }

  /**
   * Add log entry to memory
   */
  private addLogEntry(entry: MigrationLogEntry): void {
    this.logEntries.push(entry)

    // Maintain maximum log entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries)
    }
  }

  /**
   * Persist log entry to database
   */
  private async persistLogEntry(entry: MigrationLogEntry): Promise<void> {
    try {
      await this.db.execute(
        `
        INSERT INTO ${this.logTableName} (
          id, migration_id, action, timestamp, message, details, level
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          entry.id,
          entry.migrationId,
          entry.action,
          entry.timestamp,
          entry.message,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.level,
        ]
      )
    } catch (error) {
      this.logger.error('Failed to persist log entry', error)
    }
  }

  /**
   * Create log table if it doesn't exist
   */
  private async createLogTable(): Promise<void> {
    try {
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS ${this.logTableName} (
          id TEXT PRIMARY KEY,
          migration_id TEXT NOT NULL,
          action TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          message TEXT NOT NULL,
          details TEXT, -- JSON string
          level TEXT NOT NULL DEFAULT 'info'
        )
      `)

      // Create indexes for better performance
      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_${this.logTableName}_migration_id
        ON ${this.logTableName}(migration_id)
      `)

      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_${this.logTableName}_timestamp
        ON ${this.logTableName}(timestamp)
      `)

      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_${this.logTableName}_action
        ON ${this.logTableName}(action)
      `)

      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_${this.logTableName}_level
        ON ${this.logTableName}(level)
      `)
    } catch (error) {
      this.logger.error('Failed to create log table', error)
      throw error
    }
  }

  /**
   * Load persisted logs from database
   */
  private async loadPersistedLogs(): Promise<void> {
    try {
      const rows = await this.db.query<MigrationLogEntry>(
        `
        SELECT
          id, migration_id as migrationId, action, timestamp,
          message, details, level
        FROM ${this.logTableName}
        ORDER BY timestamp DESC
        LIMIT ?
      `,
        [this.maxLogEntries]
      )

      for (const row of rows) {
        if (row.details) {
          try {
            row.details = JSON.parse(row.details as string)
          } catch {
            // Keep as string if JSON parsing fails
          }
        }
        this.logEntries.push(row)
      }

      this.logger.debug(`Loaded ${rows.length} persisted log entries`)
    } catch (error) {
      this.logger.error('Failed to load persisted logs', error)
    }
  }

  /**
   * Log entry to console
   */
  private logToConsole(entry: MigrationLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const message = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.action}] ${entry.message}`

    if (entry.details) {
      this.logger.log(entry.level, message, entry.details)
    } else {
      this.logger.log(entry.level, message)
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): MigrationLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[MigrationMonitor] ${message}`, ...args)
        }
      },
      info: (message: string, ...args: any[]) => {
        console.info(`[MigrationMonitor] ${message}`, ...args)
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[MigrationMonitor] ${message}`, ...args)
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[MigrationMonitor] ${message}`, ...args)
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
        console[level](`[MigrationMonitor] ${message}`, ...args)
      },
    }
  }
}

/**
 * Factory function to create migration monitor
 */
export function createMigrationMonitor(
  db: D1Database,
  options?: {
    logger?: MigrationLogger
    maxLogEntries?: number
    enablePersistence?: boolean
    logTableName?: string
  }
): MigrationMonitor {
  return new MigrationMonitor(db, options)
}
