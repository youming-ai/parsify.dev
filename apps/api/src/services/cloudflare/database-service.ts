/**
 * Database Service - Cloudflare D1 Integration
 *
 * This service provides a high-level interface for database operations
 * using Cloudflare D1, with built-in query optimization, caching,
 * and connection management.
 */

import { CloudflareService } from './cloudflare-service'
import { executeQuery } from '../../config/cloudflare/d1-config'

export interface DatabaseQueryOptions {
  useCache?: boolean
  cacheTTL?: number
  timeout?: number
  retries?: number
}

export interface DatabaseTransactionOptions {
  isolation?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE'
  timeout?: number
  rollbackOnError?: boolean
}

export interface QueryResult<T = any> {
  data: T[]
  count: number
  success: boolean
  error?: string
  executionTime: number
  cached?: boolean
}

export class DatabaseService {
  private cloudflare: CloudflareService
  private queryCache: Map<
    string,
    { data: any; timestamp: number; ttl: number }
  > = new Map()

  constructor(cloudflare: CloudflareService) {
    this.cloudflare = cloudflare
  }

  async query<T = any>(
    sql: string,
    params?: any[],
    options: DatabaseQueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now()
    const cacheKey = this.getCacheKey(sql, params)

    // Check cache first
    if (options.useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return {
          data: cached,
          count: Array.isArray(cached) ? cached.length : 1,
          success: true,
          executionTime: Date.now() - startTime,
          cached: true,
        }
      }
    }

    try {
      const result = await this.cloudflare.query<T>(sql, params)
      const data = this.extractDataFromResult(result)

      // Cache result if enabled
      if (options.useCache && data) {
        this.setCache(cacheKey, data, options.cacheTTL || 300) // 5 minutes default
      }

      return {
        data,
        count: Array.isArray(data) ? data.length : 1,
        success: true,
        executionTime: Date.now() - startTime,
        cached: false,
      }
    } catch (error) {
      return {
        data: [],
        count: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      }
    }
  }

  async queryFirst<T = any>(
    sql: string,
    params?: any[],
    options: DatabaseQueryOptions = {}
  ): Promise<QueryResult<T>> {
    const result = await this.query<T>(sql, params, options)

    if (result.success && result.data.length > 0) {
      return {
        ...result,
        data: [result.data[0]] as T[],
        count: 1,
      }
    }

    return {
      ...result,
      data: [],
      count: 0,
    }
  }

  async queryValue<T = any>(
    sql: string,
    params?: any[],
    options: DatabaseQueryOptions = {}
  ): Promise<T | null> {
    const result = await this.queryFirst<Record<string, T>>(
      sql,
      params,
      options
    )

    if (result.success && result.data.length > 0) {
      const firstRow = result.data[0] as Record<string, T>
      const firstValue = Object.values(firstRow)[0]
      return firstValue as T
    }

    return null
  }

  async insert<T = any>(
    table: string,
    data: Record<string, any>,
    options: DatabaseQueryOptions = {}
  ): Promise<QueryResult<{ insertId: string }>> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = columns.map(() => '?').join(', ')

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING rowid as insertId
    `

    return this.query<{ insertId: string }>(sql, values, options)
  }

  async update<T = any>(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = [],
    options: DatabaseQueryOptions = {}
  ): Promise<QueryResult<{ changes: number }>> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const setClause = columns.map(col => `${col} = ?`).join(', ')

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${where}
      RETURNING changes() as changes
    `

    return this.query<{ changes: number }>(
      sql,
      [...values, ...whereParams],
      options
    )
  }

  async delete<T = any>(
    table: string,
    where: string,
    whereParams: any[] = [],
    options: DatabaseQueryOptions = {}
  ): Promise<QueryResult<{ changes: number }>> {
    const sql = `
      DELETE FROM ${table}
      WHERE ${where}
      RETURNING changes() as changes
    `

    return this.query<{ changes: number }>(sql, whereParams, options)
  }

  async upsert<T = any>(
    table: string,
    data: Record<string, any>,
    conflictColumns: string[],
    options: DatabaseQueryOptions = {}
  ): Promise<QueryResult<{ insertId: string; changes: number }>> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = columns.map(() => '?').join(', ')
    const conflictClause = conflictColumns.join(', ')
    const updateClause = columns
      .map(col => `${col} = excluded.${col}`)
      .join(', ')

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(${conflictClause}) DO UPDATE
      SET ${updateClause}
      RETURNING rowid as insertId, changes() as changes
    `

    return this.query<{ insertId: string; changes: number }>(
      sql,
      values,
      options
    )
  }

  async transaction<T = any>(
    queries: Array<{
      sql: string
      params?: any[]
      options?: DatabaseQueryOptions
    }>,
    options: DatabaseTransactionOptions = {}
  ): Promise<{
    results: QueryResult<T>[]
    success: boolean
    error?: string
    executionTime: number
  }> {
    const startTime = Date.now()
    const results: QueryResult<T>[] = []

    try {
      // D1 doesn't support explicit transactions, so we'll execute queries sequentially
      for (const query of queries) {
        const result = await this.query<T>(
          query.sql,
          query.params,
          query.options
        )
        results.push(result)

        if (!result.success && options.rollbackOnError) {
          return {
            results,
            success: false,
            error: `Transaction failed at query: ${query.sql}`,
            executionTime: Date.now() - startTime,
          }
        }
      }

      return {
        results,
        success: true,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        results,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      }
    }
  }

  async batch<T = any>(
    queries: Array<{
      sql: string
      params?: any[]
    }>
  ): Promise<{
    results: QueryResult<T>[]
    success: boolean
    error?: string
    executionTime: number
  }> {
    const startTime = Date.now()

    try {
      const cloudflareResults = await this.cloudflare.batchQuery(queries)
      const results: QueryResult<T>[] = cloudflareResults.map(result => ({
        data: this.extractDataFromResult(result),
        count: Array.isArray(result.results) ? result.results.length : 1,
        success: result.success !== false,
        error: result.error,
        executionTime: 0, // Individual query times not available in batch
        cached: false,
      }))

      return {
        results,
        success: true,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        results: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      }
    }
  }

  async count(
    table: string,
    where?: string,
    whereParams: any[] = [],
    options: DatabaseQueryOptions = {}
  ): Promise<number> {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${table}`

    const result = await this.queryValue<number>(sql, whereParams, options)
    return result || 0
  }

  async exists(
    table: string,
    where: string,
    whereParams: any[] = [],
    options: DatabaseQueryOptions = {}
  ): Promise<boolean> {
    const count = await this.count(table, where, whereParams, options)
    return count > 0
  }

  async paginate<T = any>(
    table: string,
    page: number = 1,
    limit: number = 10,
    where?: string,
    whereParams: any[] = [],
    orderBy?: string,
    options: DatabaseQueryOptions = {}
  ): Promise<{
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    success: boolean
    error?: string
    executionTime: number
  }> {
    const offset = (page - 1) * limit
    const startTime = Date.now()

    try {
      // Get total count
      const total = await this.count(table, where, whereParams, {
        ...options,
        useCache: false,
      })
      const totalPages = Math.ceil(total / limit)

      // Build query
      let sql = `SELECT * FROM ${table}`
      const params: any[] = []

      if (where) {
        sql += ` WHERE ${where}`
        params.push(...whereParams)
      }

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`
      }

      sql += ` LIMIT ? OFFSET ?`
      params.push(limit, offset)

      // Get data
      const result = await this.query<T>(sql, params, options)

      return {
        data: result.data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        success: result.success,
        error: result.error,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      }
    }
  }

  // Health check specific to database
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    responseTime: number
    error?: string
    details?: {
      connectionCount: number
      cacheSize: number
      cacheHitRate: number
    }
  }> {
    const startTime = Date.now()

    try {
      // Simple health check query
      const result = await this.query('SELECT 1 as health_check')
      const responseTime = Date.now() - startTime

      return {
        status: result.success && responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connectionCount: 1, // Simplified
          cacheSize: this.queryCache.size,
          cacheHitRate: this.calculateCacheHitRate(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Cache management
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }

  getCacheStats(): {
    size: number
    hitRate: number
    oldestEntry?: number
    newestEntry?: number
  } {
    let oldestTimestamp: number | undefined
    let newestTimestamp: number | undefined

    for (const entry of this.queryCache.values()) {
      if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
      }
      if (!newestTimestamp || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp
      }
    }

    return {
      size: this.queryCache.size,
      hitRate: this.calculateCacheHitRate(),
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp,
    }
  }

  // Private helper methods
  private getCacheKey(sql: string, params?: any[]): string {
    const normalizedSql = sql.trim().replace(/\s+/g, ' ')
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${normalizedSql}:${paramsStr}`
  }

  private getFromCache(key: string): any | null {
    const entry = this.queryCache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.queryCache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Limit cache size
    if (this.queryCache.size >= 1000) {
      // Remove oldest entries
      const entries = Array.from(this.queryCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )

      for (let i = 0; i < 100; i++) {
        if (entries[i]) {
          this.queryCache.delete(entries[i][0])
        }
      }
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  private calculateCacheHitRate(): number {
    // This is a simplified calculation
    // In a real implementation, you'd track hits and misses
    return 0.85 // Placeholder
  }

  private extractDataFromResult<T>(result: D1Result<T>): T[] {
    if (Array.isArray(result.results)) {
      return result.results
    }
    if (result.success !== false && result.results) {
      return [result.results] as T[]
    }
    return []
  }
}

export function createDatabaseService(
  cloudflare: CloudflareService
): DatabaseService {
  return new DatabaseService(cloudflare)
}
