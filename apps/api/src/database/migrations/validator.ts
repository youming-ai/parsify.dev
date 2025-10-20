import { D1Database } from '@cloudflare/workers-types'
import { DatabaseClient } from '../client'
import {
  Migration,
  MigrationStatus,
  MigrationValidationError,
  MigrationContext,
  MigrationLogger,
  DEFAULT_DATABASE_CLIENT_CONFIG
} from './types'

/**
 * Migration validation system
 */
export class MigrationValidator {
  private db: DatabaseClient
  private logger: MigrationLogger
  private enableSafetyChecks: boolean

  constructor(
    db: D1Database,
    options: {
      logger?: MigrationLogger
      enableSafetyChecks?: boolean
    } = {}
  ) {
    this.db = new DatabaseClient(db, DEFAULT_DATABASE_CLIENT_CONFIG)
    this.logger = options.logger || this.createDefaultLogger()
    this.enableSafetyChecks = options.enableSafetyChecks ?? true
  }

  /**
   * Validate a single migration
   */
  async validateMigration(
    migration: Migration,
    context?: Partial<MigrationContext>
  ): Promise<MigrationValidationError[]> {
    const errors: MigrationValidationError[] = []

    this.logger.debug('Validating migration', {
      id: migration.id,
      version: migration.version,
      name: migration.name
    })

    // Basic validation
    errors.push(...this.validateBasicStructure(migration))

    // SQL syntax validation
    errors.push(...await this.validateSQLSyntax(migration))

    // Checksum validation
    errors.push(...this.validateChecksum(migration))

    // Safety checks
    if (this.enableSafetyChecks) {
      errors.push(...this.validateSafety(migration))
    }

    // Rollback validation
    errors.push(...this.validateRollback(migration))

    // Contextual validation
    if (context) {
      errors.push(...await this.validateContext(migration, context))
    }

    if (errors.length === 0) {
      this.logger.debug('Migration validation passed', {
        id: migration.id,
        version: migration.version
      })
    } else {
      this.logger.warn('Migration validation failed', {
        id: migration.id,
        version: migration.version,
        errorCount: errors.length,
        errors: errors.map(e => ({ type: e.type, message: e.message }))
      })
    }

    return errors
  }

  /**
   * Validate multiple migrations
   */
  async validateMigrations(
    migrations: Migration[],
    context?: Partial<MigrationContext>
  ): Promise<{
    errors: MigrationValidationError[]
    validMigrations: Migration[]
    invalidMigrations: Migration[]
  }> {
    const allErrors: MigrationValidationError[] = []
    const validMigrations: Migration[] = []
    const invalidMigrations: Migration[] = []

    this.logger.info('Validating migrations', {
      count: migrations.length
    })

    for (const migration of migrations) {
      const errors = await this.validateMigration(migration, context)

      if (errors.length === 0) {
        validMigrations.push(migration)
      } else {
        invalidMigrations.push(migration)
        allErrors.push(...errors)
      }
    }

    // Validate dependencies
    const dependencyErrors = this.validateDependencies(migrations)
    allErrors.push(...dependencyErrors)

    this.logger.info('Migration validation completed', {
      total: migrations.length,
      valid: validMigrations.length,
      invalid: invalidMigrations.length,
      totalErrors: allErrors.length
    })

    return {
      errors: allErrors,
      validMigrations,
      invalidMigrations
    }
  }

  /**
   * Perform dry run of migrations
   */
  async dryRun(
    migrations: Migration[],
    options: {
      stopOnFirstError?: boolean
      includeRollback?: boolean
    } = {}
  ): Promise<{
    results: Array<{
      migration: Migration
      success: boolean
      errors: MigrationValidationError[]
      executionPlan?: string[]
    }>
    summary: {
      total: number
      successful: number
      failed: number
      totalErrors: number
    }
  }> {
    const { stopOnFirstError = false, includeRollback = false } = options
    const results: any[] = []

    this.logger.info('Starting migration dry run', {
      count: migrations.length,
      stopOnFirstError,
      includeRollback
    })

    for (const migration of migrations) {
      const errors = await this.validateMigration(migration, {
        action: 'up',
        dryRun: true,
        options: { dryRun: true },
        startTime: Date.now(),
        logger: this.logger
      })

      const success = errors.length === 0
      results.push({
        migration,
        success,
        errors
      })

      if (!success && stopOnFirstError) {
        this.logger.warn('Dry run stopped due to validation errors', {
          migration: migration.version,
          errors: errors.length
        })
        break
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
    }

    this.logger.info('Migration dry run completed', summary)

    return { results, summary }
  }

  /**
   * Validate basic migration structure
   */
  private validateBasicStructure(migration: Migration): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    // Check required fields
    if (!migration.id) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Migration ID is required'
      })
    }

    if (!migration.version) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Migration version is required'
      })
    }

    if (!migration.name) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Migration name is required'
      })
    }

    if (!migration.up) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Migration UP SQL is required'
      })
    }

    // Validate version format (semantic versioning)
    const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/
    if (migration.version && !versionPattern.test(migration.version)) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Version should follow semantic versioning (e.g., 1.0.0)'
      })
    }

    return errors
  }

  /**
   * Validate SQL syntax
   */
  private async validateSQLSyntax(migration: Migration): Promise<MigrationValidationError[]> {
    const errors: MigrationValidationError[] = []

    if (!migration.up) return errors

    try {
      // Parse SQL statements
      const statements = this.parseSQLStatements(migration.up)

      // Validate each statement
      for (const statement of statements) {
        if (!statement.trim()) continue

        // Check for common syntax errors
        errors.push(...this.validateSQLStatement(migration, statement))
      }

      // Validate rollback SQL if present
      if (migration.down) {
        const rollbackStatements = this.parseSQLStatements(migration.down)
        for (const statement of rollbackStatements) {
          if (!statement.trim()) continue
          errors.push(...this.validateSQLStatement(migration, statement, true))
        }
      }

    } catch (error) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: `SQL parsing error: ${(error as Error).message}`
      })
    }

    return errors
  }

  /**
   * Validate individual SQL statement
   */
  private validateSQLStatement(
    migration: Migration,
    statement: string,
    isRollback: boolean = false
  ): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    // Check for unbalanced quotes
    const singleQuotes = (statement.match(/'/g) || []).length
    const doubleQuotes = (statement.match(/"/g) || []).length

    if (singleQuotes % 2 !== 0) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Unbalanced single quotes in SQL statement',
        details: { statement: statement.substring(0, 100) }
      })
    }

    if (doubleQuotes % 2 !== 0) {
      errors.push({
        migration,
        type: 'sql_syntax_error',
        message: 'Unbalanced double quotes in SQL statement',
        details: { statement: statement.substring(0, 100) }
      })
    }

    // Check for common SQLite keywords
    const sqliteKeywords = [
      'PRAGMA', 'VACUUM', 'ANALYZE', 'REINDEX'
    ]

    for (const keyword of sqliteKeywords) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(statement)) {
        errors.push({
          migration,
          type: 'sql_syntax_error',
          message: `SQLite keyword "${keyword}" may cause issues in D1`,
          details: { statement: statement.substring(0, 100) }
        })
      }
    }

    // Check for unsupported features
    const unsupportedPatterns = [
      /CREATE\s+TRIGGER/i,
      /CREATE\s+VIEW\s+WITH/i,  // Recursive views
      /ATTACH\s+DATABASE/i,
      /DETACH\s+DATABASE/i
    ]

    for (const pattern of unsupportedPatterns) {
      if (pattern.test(statement)) {
        errors.push({
          migration,
          type: 'sql_syntax_error',
          message: 'Unsupported SQLite feature for D1',
          details: { statement: statement.substring(0, 100) }
        })
      }
    }

    return errors
  }

  /**
   * Validate migration checksum
   */
  private validateChecksum(migration: Migration): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    if (!migration.checksum) {
      errors.push({
        migration,
        type: 'checksum_mismatch',
        message: 'Migration checksum is missing'
      })
    } else {
      // Verify checksum consistency
      const expectedChecksum = this.calculateChecksum(migration.up, migration.down)
      if (migration.checksum !== expectedChecksum) {
        errors.push({
          migration,
          type: 'checksum_mismatch',
          message: 'Migration checksum does not match calculated checksum',
          details: {
            provided: migration.checksum,
            calculated: expectedChecksum
          }
        })
      }
    }

    return errors
  }

  /**
   * Validate migration safety
   */
  private validateSafety(migration: Migration): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    if (!migration.up) return errors

    const statements = this.parseSQLStatements(migration.up)

    for (const statement of statements) {
      if (!statement.trim()) continue

      // Check for destructive operations without safeguards
      const destructivePatterns = [
        {
          pattern: /DROP\s+TABLE\s+(?!IF\s+EXISTS|__schema_migrations)/i,
          message: 'DROP TABLE without IF EXISTS may cause errors'
        },
        {
          pattern: /DELETE\s+FROM\s+\w+\s*(?!WHERE)/i,
          message: 'DELETE without WHERE clause will delete all rows'
        },
        {
          pattern: /UPDATE\s+\w+\s*SET/i,
          message: 'UPDATE without WHERE clause will update all rows',
          shouldHaveWhere: true
        }
      ]

      for (const { pattern, message, shouldHaveWhere } of destructivePatterns) {
        if (pattern.test(statement)) {
          if (shouldHaveWhere && !/\bWHERE\b/i.test(statement)) {
            errors.push({
              migration,
              type: 'unsafe_operation',
              message,
              details: { statement: statement.substring(0, 100) }
            })
          } else if (!shouldHaveWhere) {
            errors.push({
              migration,
              type: 'unsafe_operation',
              message,
              details: { statement: statement.substring(0, 100) }
            })
          }
        }
      }

      // Check for large operations
      if (statement.length > 10000) {
        errors.push({
          migration,
          type: 'unsafe_operation',
          message: 'Large SQL statement detected, consider breaking into smaller statements',
          details: {
            statement: statement.substring(0, 100),
            length: statement.length
          }
        })
      }
    }

    return errors
  }

  /**
   * Validate rollback capabilities
   */
  private validateRollback(migration: Migration): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    if (!migration.down) {
      errors.push({
        migration,
        type: 'rollback_missing',
        message: 'Migration does not have rollback SQL'
      })
      return errors
    }

    // Check if rollback SQL is different from up SQL
    if (migration.up.trim() === migration.down.trim()) {
      errors.push({
        migration,
        type: 'rollback_missing',
        message: 'Rollback SQL is identical to up SQL'
      })
    }

    // Validate rollback SQL can reverse the up SQL
    errors.push(...this.validateRollbackLogic(migration))

    return errors
  }

  /**
   * Validate rollback logic
   */
  private validateRollbackLogic(migration: Migration): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []

    if (!migration.up || !migration.down) return errors

    const upStatements = this.parseSQLStatements(migration.up)
    const downStatements = this.parseSQLStatements(migration.down)

    // Check for CREATE TABLE without corresponding DROP
    const createTablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i
    const dropTablePattern = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i

    const createdTables: string[] = []
    const droppedTables: string[] = []

    for (const statement of upStatements) {
      const match = statement.match(createTablePattern)
      if (match) {
        createdTables.push(match[1].toLowerCase())
      }
    }

    for (const statement of downStatements) {
      const match = statement.match(dropTablePattern)
      if (match) {
        droppedTables.push(match[1].toLowerCase())
      }
    }

    // Check if all created tables are dropped in rollback
    for (const table of createdTables) {
      if (!droppedTables.includes(table)) {
        errors.push({
          migration,
          type: 'rollback_missing',
          message: `Table "${table}" is created but not dropped in rollback`,
          details: { table }
        })
      }
    }

    return errors
  }

  /**
   * Validate dependencies
   */
  private validateDependencies(migrations: Migration[]): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []
    const migrationVersions = new Set(migrations.map(m => m.version))

    for (const migration of migrations) {
      if (!migration.dependencies) continue

      for (const dependency of migration.dependencies) {
        // Check if dependency exists
        if (!migrationVersions.has(dependency)) {
          errors.push({
            migration,
            type: 'dependency_missing',
            message: `Dependency "${dependency}" not found in available migrations`,
            details: { dependency }
          })
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(migrations)
    errors.push(...circularDeps)

    return errors
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(migrations: Migration[]): MigrationValidationError[] {
    const errors: MigrationValidationError[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (migration: Migration, path: string[] = []): boolean => {
      if (visiting.has(migration.version)) {
        const cycle = [...path, migration.version].join(' -> ')
        errors.push({
          migration,
          type: 'dependency_missing',
          message: `Circular dependency detected: ${cycle}`,
          details: { cycle }
        })
        return true
      }

      if (visited.has(migration.version)) {
        return false
      }

      visiting.add(migration.version)
      visited.add(migration.version)

      if (migration.dependencies) {
        for (const depVersion of migration.dependencies) {
          const depMigration = migrations.find(m => m.version === depVersion)
          if (depMigration && visit(depMigration, [...path, migration.version])) {
            return true
          }
        }
      }

      visiting.delete(migration.version)
      return false
    }

    for (const migration of migrations) {
      if (!visited.has(migration.version)) {
        visit(migration)
      }
    }

    return errors
  }

  /**
   * Validate contextual information
   */
  private async validateContext(
    migration: Migration,
    context: Partial<MigrationContext>
  ): Promise<MigrationValidationError[]> {
    const errors: MigrationValidationError[] = []

    // Validate based on action
    if (context.action === 'down' && !migration.down) {
      errors.push({
        migration,
        type: 'rollback_missing',
        message: 'Cannot rollback migration without rollback SQL'
      })
    }

    // Validate database state if needed
    if (context.action === 'up') {
      errors.push(...await this.validateDatabaseState(migration))
    }

    return errors
  }

  /**
   * Validate current database state
   */
  private async validateDatabaseState(migration: Migration): Promise<MigrationValidationError[]> {
    const errors: MigrationValidationError[] = []

    if (!migration.up) return errors

    try {
      const statements = this.parseSQLStatements(migration.up)

      for (const statement of statements) {
        if (!statement.trim()) continue

        // Check if table already exists for CREATE TABLE statements
        const createTableMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)
        if (createTableMatch && !statement.includes('IF NOT EXISTS')) {
          const tableName = createTableMatch[1]

          try {
            const tableInfo = await this.db.queryFirst(`
              SELECT name FROM sqlite_master
              WHERE type='table' AND name=?
            `, [tableName])

            if (tableInfo) {
              errors.push({
                migration,
                type: 'unsafe_operation',
                message: `Table "${tableName}" already exists but migration doesn't use IF NOT EXISTS`,
                details: { tableName }
              })
            }
          } catch (error) {
            // Ignore errors during validation
          }
        }
      }
    } catch (error) {
      // Ignore validation errors
    }

    return errors
  }

  /**
   * Parse SQL statements
   */
  private parseSQLStatements(sql: string): string[] {
    const statements: string[] = []
    let current = ''
    let inString = false
    let stringChar = ''
    let escapeNext = false

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i]

      if (escapeNext) {
        current += char
        escapeNext = false
        continue
      }

      if (char === '\\') {
        current += char
        escapeNext = true
        continue
      }

      if ((char === '"' || char === "'") && !escapeNext) {
        if (inString && stringChar === char) {
          inString = false
          stringChar = ''
        } else if (!inString) {
          inString = true
          stringChar = char
        }
      }

      if (!inString && char === ';') {
        statements.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    if (current.trim()) {
      statements.push(current.trim())
    }

    return statements.filter(s => s && !s.startsWith('--'))
  }

  /**
   * Calculate migration checksum
   */
  private calculateChecksum(upSQL: string, downSQL?: string): string {
    const crypto = globalThis.crypto || (globalThis as any).webcrypto
    const data = upSQL + (downSQL || '')
    const encoder = new TextEncoder()
    const bytes = encoder.encode(data)

    // Simple hash function for demonstration
    // In production, use a proper hashing library
    let hash = 0
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i]
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16)
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): MigrationLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[MigrationValidator] ${message}`, ...args)
        }
      },
      info: (message: string, ...args: any[]) => {
        console.info(`[MigrationValidator] ${message}`, ...args)
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[MigrationValidator] ${message}`, ...args)
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[MigrationValidator] ${message}`, ...args)
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
        console[level](`[MigrationValidator] ${message}`, ...args)
      }
    }
  }
}

/**
 * Factory function to create migration validator
 */
export function createMigrationValidator(
  db: D1Database,
  options?: {
    logger?: MigrationLogger
    enableSafetyChecks?: boolean
  }
): MigrationValidator {
  return new MigrationValidator(db, options)
}
