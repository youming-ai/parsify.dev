/**
 * Cloudflare D1 Database Configuration
 *
 * This module provides configuration and utilities for interacting with
 * Cloudflare D1 database, including connection management, health checks,
 * and environment-specific settings.
 */

export interface D1Config {
  binding: string
  databaseName: string
  databaseId: string
  maxConnections?: number
  connectionTimeout?: number
  queryTimeout?: number
  enableHealthCheck?: boolean
  healthCheckInterval?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface D1EnvironmentConfig {
  development: D1Config
  production: D1Config
  staging?: D1Config
}

export const DEFAULT_D1_CONFIG: Partial<D1Config> = {
  maxConnections: 10,
  connectionTimeout: 30000, // 30 seconds
  queryTimeout: 10000, // 10 seconds
  enableHealthCheck: true,
  healthCheckInterval: 60000, // 1 minute
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

export const D1_ENVIRONMENT_CONFIG: D1EnvironmentConfig = {
  development: {
    binding: 'DB',
    databaseName: 'parsify-dev',
    databaseId: 'local',
    ...DEFAULT_D1_CONFIG,
  },
  production: {
    binding: 'DB',
    databaseName: 'parsify-prod',
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || '',
    maxConnections: 20,
    queryTimeout: 15000,
    healthCheckInterval: 30000,
    ...DEFAULT_D1_CONFIG,
  },
}

export function getD1Config(environment?: string): D1Config {
  const env = environment || process.env.ENVIRONMENT || 'development'

  if (env === 'production' && !D1_ENVIRONMENT_CONFIG.production.databaseId) {
    throw new Error('Cloudflare D1 database ID is required for production environment')
  }

  return (
    D1_ENVIRONMENT_CONFIG[env as keyof D1EnvironmentConfig] || D1_ENVIRONMENT_CONFIG.development
  )
}

export interface D1HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  responseTime: number
  error?: string
  details?: {
    connectionCount: number
    activeQueries: number
    totalQueries: number
    avgResponseTime: number
  }
}

export class D1HealthMonitor {
  private config: D1Config
  private lastHealthCheck: D1HealthCheck | null = null
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private isMonitoring = false

  constructor(config: D1Config) {
    this.config = config
  }

  async startMonitoring(db: D1Database): Promise<void> {
    if (!this.config.enableHealthCheck || this.isMonitoring) {
      return
    }

    this.isMonitoring = true

    // Initial health check
    await this.performHealthCheck(db)

    // Set up periodic health checks
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(db),
      this.config.healthCheckInterval || 60000
    )
  }

  async stopMonitoring(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
    this.isMonitoring = false
  }

  async performHealthCheck(db: D1Database): Promise<D1HealthCheck> {
    const startTime = Date.now()

    try {
      // Simple health check query
      const _result = await db.prepare('SELECT 1 as health_check').first()
      const responseTime = Date.now() - startTime

      const healthCheck: D1HealthCheck = {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime,
        details: {
          connectionCount: 1, // Simplified - D1 doesn't expose connection metrics
          activeQueries: 0,
          totalQueries: 1,
          avgResponseTime: responseTime,
        },
      }

      this.lastHealthCheck = healthCheck
      return healthCheck
    } catch (error) {
      const healthCheck: D1HealthCheck = {
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.lastHealthCheck = healthCheck
      return healthCheck
    }
  }

  getLastHealthCheck(): D1HealthCheck | null {
    return this.lastHealthCheck
  }

  isHealthy(): boolean {
    const lastCheck = this.getLastHealthCheck()
    if (!lastCheck) return false

    // Consider unhealthy if last check was more than 2 intervals ago
    const maxAge = (this.config.healthCheckInterval || 60000) * 2
    const isRecent = Date.now() - lastCheck.timestamp < maxAge

    return isRecent && lastCheck.status !== 'unhealthy'
  }
}

export interface D1ConnectionPool {
  acquire(): Promise<D1Database>
  release(connection: D1Database): Promise<void>
  close(): Promise<void>
  getStats(): {
    totalConnections: number
    activeConnections: number
    idleConnections: number
  }
}

export class SimpleD1Pool implements D1ConnectionPool {
  private connections: D1Database[] = []
  private activeConnections = new Set<D1Database>()

  constructor(
    config: D1Config,
    private db: D1Database
  ) {
    this.config = config
  }

  async acquire(): Promise<D1Database> {
    // For D1, we don't actually need connection pooling
    // as it's managed by Cloudflare Workers runtime
    // This is a placeholder interface for compatibility
    this.activeConnections.add(this.db)
    return this.db
  }

  async release(connection: D1Database): Promise<void> {
    this.activeConnections.delete(connection)
  }

  async close(): Promise<void> {
    this.activeConnections.clear()
    this.connections.length = 0
  }

  getStats() {
    return {
      totalConnections: 1,
      activeConnections: this.activeConnections.size,
      idleConnections: 1 - this.activeConnections.size,
    }
  }
}

export function createD1Pool(config: D1Config, db: D1Database): D1ConnectionPool {
  return new SimpleD1Pool(config, db)
}

// Query utilities
export interface QueryOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export async function executeQuery<T = unknown>(
  db: D1Database,
  query: string,
  params?: unknown[],
  options: QueryOptions = {}
): Promise<D1Result<T>> {
  const { retries = 3, retryDelay = 1000 } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const stmt = db.prepare(query)
      const result = params ? stmt.bind(...params) : stmt

      if (query.trim().toLowerCase().startsWith('select')) {
        return (await result.first()) as D1Result<T>
      } else if (
        query.trim().toLowerCase().includes('insert') ||
        query.trim().toLowerCase().includes('update') ||
        query.trim().toLowerCase().includes('delete')
      ) {
        return (await result.run()) as D1Result<T>
      } else {
        return (await result.all()) as D1Result<T>
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on certain errors
      if (
        lastError.message.includes('syntax error') ||
        lastError.message.includes('no such table') ||
        lastError.message.includes('constraint')
      ) {
        throw lastError
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Query failed after retries')
}

// Migration utilities
export interface Migration {
  version: string
  description: string
  up: (db: D1Database) => Promise<void>
  down?: (db: D1Database) => Promise<void>
}

export class D1Migrator {
  private migrations: Migration[] = []

  addMigration(migration: Migration): void {
    this.migrations.push(migration)
  }

  async migrate(db: D1Database): Promise<void> {
    // Create migrations table if it doesn't exist
    await executeQuery(
      db,
      `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        description TEXT,
        executed_at INTEGER NOT NULL
      )
    `
    )

    // Get executed migrations
    const executedResult = await executeQuery<{ version: string }>(
      db,
      `
      SELECT version FROM schema_migrations ORDER BY version
    `
    )
    const executedVersions = new Set(
      Array.isArray(executedResult.results)
        ? executedResult.results.map(r => r.version)
        : (executedResult as { version?: string }).version
          ? [(executedResult as { version: string }).version]
          : []
    )

    // Run pending migrations
    for (const migration of this.migrations) {
      if (!executedVersions.has(migration.version)) {
        console.log(`Running migration ${migration.version}: ${migration.description}`)

        try {
          await migration.up(db)

          await executeQuery(
            db,
            `
            INSERT INTO schema_migrations (version, description, executed_at)
            VALUES (?, ?, ?)
          `,
            [migration.version, migration.description, Math.floor(Date.now() / 1000)]
          )

          console.log(`Migration ${migration.version} completed successfully`)
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error)
          throw error
        }
      }
    }
  }

  async rollback(db: D1Database, targetVersion?: string): Promise<void> {
    // Get executed migrations
    const executedResult = await executeQuery<{ version: string }>(
      db,
      `
      SELECT version FROM schema_migrations ORDER BY version DESC
    `
    )
    const executedVersions = Array.isArray(executedResult.results)
      ? executedResult.results.map(r => r.version)
      : (executedResult as { version?: string }).version
        ? [(executedResult as { version: string }).version]
        : []

    // Find migrations to rollback
    const migrationsToRollback = this.migrations
      .filter(m => executedVersions.includes(m.version))
      .filter(m => !targetVersion || m.version > targetVersion)
      .reverse()

    // Rollback migrations
    for (const migration of migrationsToRollback) {
      if (migration.down) {
        console.log(`Rolling back migration ${migration.version}: ${migration.description}`)

        try {
          await migration.down(db)

          await executeQuery(
            db,
            `
            DELETE FROM schema_migrations WHERE version = ?
          `,
            [migration.version]
          )

          console.log(`Migration ${migration.version} rolled back successfully`)
        } catch (error) {
          console.error(`Rollback of migration ${migration.version} failed:`, error)
          throw error
        }
      }
    }
  }
}
