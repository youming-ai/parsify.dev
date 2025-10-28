/**
 * Cloudflare Service Wrapper
 *
 * This module provides a unified interface for interacting with all Cloudflare services
 * including D1 database, KV storage, R2 object storage, and Durable Objects.
 * It handles connection management, health monitoring, and provides a consistent
 * API for all Cloudflare operations.
 */

import {
  createD1Pool,
  type D1Config,
  type D1ConnectionPool,
  D1HealthMonitor,
  executeQuery,
  getD1Config,
} from '../../config/cloudflare/d1-config'
import {
  type DurableObjectConfig,
  getDurableObjectConfig,
} from '../../config/cloudflare/durable-objects-config'
import {
  type KVCacheService as BaseKVCacheService,
  getKVConfig,
  type KVConfig,
  type KVHealthMonitor,
  KVSessionService,
} from '../../config/cloudflare/kv-config'

import {
  getR2Config,
  type R2Config,
  R2FileService,
  R2HealthMonitor,
} from '../../config/cloudflare/r2-config'
import { KVCacheService } from './kv-cache'

export interface CloudflareServiceOptions {
  environment?: string
  enableHealthMonitoring?: boolean
  enableCaching?: boolean
  enableMetrics?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface CloudflareServiceHealth {
  d1: {
    status: 'healthy' | 'unhealthy' | 'degraded'
    responseTime: number
    error?: string
  }
  kv: Record<
    string,
    {
      status: 'healthy' | 'unhealthy' | 'degraded'
      responseTime: number
      error?: string
    }
  >
  r2: {
    status: 'healthy' | 'unhealthy' | 'degraded'
    responseTime: number
    error?: string
  }
  durableObjects: Record<
    string,
    {
      status: 'healthy' | 'unhealthy' | 'degraded'
      responseTime: number
      error?: string
    }
  >
  overall: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
}

export interface CloudflareServiceMetrics {
  d1: {
    queryCount: number
    totalQueryTime: number
    errorCount: number
    avgQueryTime: number
  }
  kv: Record<
    string,
    {
      operationsCount: number
      totalOperationTime: number
      errorCount: number
      cacheHitRate: number
    }
  >
  r2: {
    uploadCount: number
    downloadCount: number
    deleteCount: number
    totalUploadTime: number
    totalDownloadTime: number
    errorCount: number
    bytesUploaded: number
    bytesDownloaded: number
  }
  timestamp: number
}

export class CloudflareService {
  private env: any
  private options: CloudflareServiceOptions
  private d1Config: D1Config
  private kvConfigs: Record<string, KVConfig>
  private r2Config: R2Config
  private durableObjectConfigs: Record<string, DurableObjectConfig>

  // Health monitors
  private d1HealthMonitor: D1HealthMonitor | null = null
  private kvHealthMonitor: KVHealthMonitor | null = null
  private r2HealthMonitor: R2HealthMonitor | null = null

  // Service instances
  private d1Pool: D1ConnectionPool | null = null
  private kvCacheServices: Record<string, BaseKVCacheService> = {}
  private kvSessionService: KVSessionService | null = null
  private r2FileService: R2FileService | null = null
  private enhancedKVCacheService: KVCacheService | null = null

  // Metrics
  private metrics: CloudflareServiceMetrics

  constructor(env: any, options: CloudflareServiceOptions = {}) {
    this.env = env
    this.options = {
      environment: env.ENVIRONMENT || 'development',
      enableHealthMonitoring: true,
      enableCaching: true,
      enableMetrics: true,
      logLevel: 'info',
      ...options,
    }

    // Initialize configurations
    this.d1Config = getD1Config(this.options.environment)
    this.kvConfigs = {
      cache: getKVConfig('cache', this.options.environment),
      sessions: getKVConfig('sessions', this.options.environment),
      uploads: getKVConfig('uploads', this.options.environment),
      analytics: getKVConfig('analytics', this.options.environment),
    }
    this.r2Config = getR2Config(this.options.environment)
    this.durableObjectConfigs = {
      sessionManager: getDurableObjectConfig('sessionManager', this.options.environment),
      collaborationRoom: getDurableObjectConfig('collaborationRoom', this.options.environment),
      realtimeSync: getDurableObjectConfig('realtimeSync', this.options.environment),
    }

    // Initialize metrics
    this.metrics = this.initializeMetrics()

    // Initialize services
    this.initializeServices()
  }

  private initializeMetrics(): CloudflareServiceMetrics {
    return {
      d1: {
        queryCount: 0,
        totalQueryTime: 0,
        errorCount: 0,
        avgQueryTime: 0,
      },
      kv: {
        cache: {
          operationsCount: 0,
          totalOperationTime: 0,
          errorCount: 0,
          cacheHitRate: 0,
        },
        sessions: {
          operationsCount: 0,
          totalOperationTime: 0,
          errorCount: 0,
          cacheHitRate: 0,
        },
        uploads: {
          operationsCount: 0,
          totalOperationTime: 0,
          errorCount: 0,
          cacheHitRate: 0,
        },
        analytics: {
          operationsCount: 0,
          totalOperationTime: 0,
          errorCount: 0,
          cacheHitRate: 0,
        },
      },
      r2: {
        uploadCount: 0,
        downloadCount: 0,
        deleteCount: 0,
        totalUploadTime: 0,
        totalDownloadTime: 0,
        errorCount: 0,
        bytesUploaded: 0,
        bytesDownloaded: 0,
      },
      timestamp: Date.now(),
    }
  }

  private initializeServices(): void {
    try {
      // Initialize D1
      if (this.env[this.d1Config.binding]) {
        this.d1Pool = createD1Pool(this.d1Config, this.env[this.d1Config.binding])
        this.d1HealthMonitor = new D1HealthMonitor(this.d1Config)
      }

      // Initialize KV services
      Object.entries(this.kvConfigs).forEach(([name, config]) => {
        if (this.env[config.binding]) {
          this.kvCacheServices[name] = new KVCacheService(this.env[config.binding], config, name)
        }
      })

      // Initialize session service
      if (this.env[this.kvConfigs.sessions.binding]) {
        this.kvSessionService = new KVSessionService(
          this.env[this.kvConfigs.sessions.binding],
          this.kvConfigs.sessions
        )
      }

      // Initialize R2
      if (this.env[this.r2Config.binding]) {
        this.r2FileService = new R2FileService(this.env[this.r2Config.binding], this.r2Config)
        this.r2HealthMonitor = new R2HealthMonitor(this.r2Config)
      }

      // Initialize enhanced KV cache service
      this.enhancedKVCacheService = new KVCacheService(this)
    } catch (error) {
      this.log('error', 'Failed to initialize Cloudflare services:', error)
      throw error
    }
  }

  async startHealthMonitoring(): Promise<void> {
    if (!this.options.enableHealthMonitoring) return

    try {
      // Start D1 health monitoring
      if (this.d1HealthMonitor && this.d1Pool) {
        const db = await this.d1Pool.acquire()
        await this.d1HealthMonitor.startMonitoring(db)
        await this.d1Pool.release(db)
      }

      // Start KV health monitoring
      if (this.kvHealthMonitor) {
        const kvNamespaces: Record<string, KVNamespace> = {}
        Object.entries(this.kvConfigs).forEach(([name, config]) => {
          if (this.env[config.binding]) {
            kvNamespaces[name] = this.env[config.binding]
          }
        })
        await this.kvHealthMonitor.startMonitoring(kvNamespaces)
      }

      // Start R2 health monitoring
      if (this.r2HealthMonitor && this.r2FileService) {
        await this.r2FileService.startHealthMonitoring()
      }
    } catch (error) {
      this.log('error', 'Failed to start health monitoring:', error)
    }
  }

  async stopHealthMonitoring(): Promise<void> {
    try {
      if (this.d1HealthMonitor) {
        await this.d1HealthMonitor.stopMonitoring()
      }
      if (this.kvHealthMonitor) {
        await this.kvHealthMonitor.stopMonitoring()
      }
      if (this.r2HealthMonitor) {
        await this.r2FileService?.stopHealthMonitoring()
      }
    } catch (error) {
      this.log('error', 'Failed to stop health monitoring:', error)
    }
  }

  // D1 Database Operations
  async query<T = any>(sql: string, params?: any[]): Promise<D1Result<T>> {
    if (!this.d1Pool) {
      throw new Error('D1 database not available')
    }

    const startTime = Date.now()

    try {
      const db = await this.d1Pool.acquire()
      const result = await executeQuery<T>(db, sql, params)
      await this.d1Pool.release(db)

      // Update metrics
      const duration = Date.now() - startTime
      this.updateD1Metrics(duration, true)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.updateD1Metrics(duration, false)
      throw error
    }
  }

  async batchQuery(queries: Array<{ sql: string; params?: any[] }>): Promise<D1Result[]> {
    const results: D1Result[] = []

    for (const query of queries) {
      try {
        const result = await this.query(query.sql, query.params)
        results.push(result)
      } catch (error) {
        this.log('error', `Batch query failed: ${query.sql}`, error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        } as any)
      }
    }

    return results
  }

  // KV Cache Operations
  async cacheGet<T = any>(
    namespace: 'cache' | 'uploads' | 'analytics',
    key: string
  ): Promise<T | null> {
    const service = this.kvCacheServices[namespace]
    if (!service) {
      throw new Error(`KV cache service '${namespace}' not available`)
    }

    const startTime = Date.now()

    try {
      const result = await service.get<T>(key)
      this.updateKVMetrics(namespace, Date.now() - startTime, true)
      return result
    } catch (error) {
      this.updateKVMetrics(namespace, Date.now() - startTime, false)
      throw error
    }
  }

  async cacheSet<T = any>(
    namespace: 'cache' | 'uploads' | 'analytics',
    key: string,
    data: T,
    options?: { ttl?: number }
  ): Promise<void> {
    const service = this.kvCacheServices[namespace]
    if (!service) {
      throw new Error(`KV cache service '${namespace}' not available`)
    }

    const startTime = Date.now()

    try {
      await service.set(key, data, { ttl: options?.ttl })
      this.updateKVMetrics(namespace, Date.now() - startTime, true)
    } catch (error) {
      this.updateKVMetrics(namespace, Date.now() - startTime, false)
      throw error
    }
  }

  async cacheDelete(namespace: 'cache' | 'uploads' | 'analytics', key: string): Promise<boolean> {
    const service = this.kvCacheServices[namespace]
    if (!service) {
      throw new Error(`KV cache service '${namespace}' not available`)
    }

    const startTime = Date.now()

    try {
      const result = await service.delete(key)
      this.updateKVMetrics(namespace, Date.now() - startTime, true)
      return result
    } catch (error) {
      this.updateKVMetrics(namespace, Date.now() - startTime, false)
      throw error
    }
  }

  // Session Operations
  async createSession(
    sessionId: string,
    data: Record<string, any>,
    options?: {
      ttl?: number
      userId?: string
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    if (!this.kvSessionService) {
      throw new Error('Session service not available')
    }

    const startTime = Date.now()

    try {
      await this.kvSessionService.createSession(sessionId, data, options)
      this.updateKVMetrics('sessions', Date.now() - startTime, true)
    } catch (error) {
      this.updateKVMetrics('sessions', Date.now() - startTime, false)
      throw error
    }
  }

  async getSession(sessionId: string): Promise<any> {
    if (!this.kvSessionService) {
      throw new Error('Session service not available')
    }

    const startTime = Date.now()

    try {
      const result = await this.kvSessionService.getSession(sessionId)
      this.updateKVMetrics('sessions', Date.now() - startTime, true)
      return result
    } catch (error) {
      this.updateKVMetrics('sessions', Date.now() - startTime, false)
      throw error
    }
  }

  async updateSession(sessionId: string, data: any): Promise<void> {
    if (!this.kvSessionService) {
      throw new Error('Session service not available')
    }

    const startTime = Date.now()

    try {
      await this.kvSessionService.updateSession(sessionId, data)
      this.updateKVMetrics('sessions', Date.now() - startTime, true)
    } catch (error) {
      this.updateKVMetrics('sessions', Date.now() - startTime, false)
      throw error
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.kvSessionService) {
      throw new Error('Session service not available')
    }

    const startTime = Date.now()

    try {
      await this.kvSessionService.deleteSession(sessionId)
      this.updateKVMetrics('sessions', Date.now() - startTime, true)
    } catch (error) {
      this.updateKVMetrics('sessions', Date.now() - startTime, false)
      throw error
    }
  }

  // R2 File Operations
  async uploadFile(
    userId: string,
    file: ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options?: {
      contentType?: string
      metadata?: Record<string, any>
    }
  ): Promise<any> {
    if (!this.r2FileService) {
      throw new Error('R2 file service not available')
    }

    const startTime = Date.now()

    try {
      const result = await this.r2FileService.uploadFile(userId, file, filename, options)
      this.updateR2Metrics('upload', Date.now() - startTime, true, result.size)
      return result
    } catch (error) {
      this.updateR2Metrics('upload', Date.now() - startTime, false)
      throw error
    }
  }

  async getFile(key: string): Promise<{ file: R2ObjectBody; metadata: any } | null> {
    if (!this.r2FileService) {
      throw new Error('R2 file service not available')
    }

    const startTime = Date.now()

    try {
      const result = await this.r2FileService.getFile(key)
      if (result) {
        this.updateR2Metrics('download', Date.now() - startTime, true, result.metadata.size)
      }
      return result
    } catch (error) {
      this.updateR2Metrics('download', Date.now() - startTime, false)
      throw error
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (!this.r2FileService) {
      throw new Error('R2 file service not available')
    }

    const startTime = Date.now()

    try {
      const result = await this.r2FileService.deleteFile(key)
      this.updateR2Metrics('delete', Date.now() - startTime, true)
      return result
    } catch (error) {
      this.updateR2Metrics('delete', Date.now() - startTime, false)
      throw error
    }
  }

  async listUserFiles(userId: string, options?: { limit?: number; cursor?: string }): Promise<any> {
    if (!this.r2FileService) {
      throw new Error('R2 file service not available')
    }
    return await this.r2FileService.getUserFiles(userId, options)
  }

  // Durable Object Operations
  async getDurableObject(objectName: string, id?: string): Promise<DurableObject> {
    const config = this.durableObjectConfigs[objectName]
    if (!config) {
      throw new Error(`Durable Object '${objectName}' not configured`)
    }

    const binding = this.env[config.binding]
    if (!binding) {
      throw new Error(`Durable Object binding '${config.binding}' not found`)
    }

    const objectId = id || crypto.randomUUID()
    return binding.idFromString(objectId)
  }

  async callDurableObject<T = any>(
    objectName: string,
    method: string,
    data?: any,
    id?: string
  ): Promise<T> {
    try {
      const obj = await this.getDurableObject(objectName, id)
      const response = await obj.fetch(
        new Request('https://dummy.url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, data }),
        })
      )

      return await response.json()
    } catch (error) {
      this.log('error', `Durable Object call failed: ${objectName}.${method}`, error)
      throw error
    }
  }

  // Health Check
  async getHealthStatus(): Promise<CloudflareServiceHealth> {
    const health: CloudflareServiceHealth = {
      d1: { status: 'unhealthy', responseTime: 0 },
      kv: {},
      r2: { status: 'unhealthy', responseTime: 0 },
      durableObjects: {},
      overall: 'healthy',
      timestamp: Date.now(),
    }

    try {
      // Check D1
      if (this.d1HealthMonitor) {
        const d1Health = this.d1HealthMonitor.getLastHealthCheck()
        if (d1Health) {
          health.d1 = {
            status: d1Health.status,
            responseTime: d1Health.responseTime,
            error: d1Health.error,
          }
        } else {
          health.d1.status = this.d1HealthMonitor.isHealthy() ? 'healthy' : 'unhealthy'
        }
      }

      // Check KV
      if (this.kvHealthMonitor) {
        Object.keys(this.kvConfigs).forEach(namespace => {
          const kvHealth = this.kvHealthMonitor?.getLastHealthCheck(namespace)
          if (kvHealth) {
            health.kv[namespace] = {
              status: kvHealth.status,
              responseTime: kvHealth.responseTime,
              error: kvHealth.error,
            }
          } else {
            health.kv[namespace] = {
              status: this.kvHealthMonitor?.isHealthy(namespace) ? 'healthy' : 'unhealthy',
              responseTime: 0,
            }
          }
        })
      }

      // Check R2
      if (this.r2HealthMonitor) {
        const r2Health = this.r2HealthMonitor.getLastHealthCheck()
        if (r2Health) {
          health.r2 = {
            status: r2Health.status,
            responseTime: r2Health.responseTime,
            error: r2Health.error,
          }
        } else {
          health.r2.status = this.r2HealthMonitor.isHealthy() ? 'healthy' : 'unhealthy'
        }
      }

      // Check Durable Objects (simplified)
      Object.keys(this.durableObjectConfigs).forEach(objectName => {
        health.durableObjects[objectName] = {
          status: 'healthy', // Would need actual health check
          responseTime: 0,
        }
      })

      // Determine overall health
      const allHealthy = [
        health.d1.status === 'healthy',
        ...Object.values(health.kv).map(kv => kv.status === 'healthy'),
        health.r2.status === 'healthy',
        ...Object.values(health.durableObjects).map(dobj => dobj.status === 'healthy'),
      ].every(Boolean)

      const hasUnhealthy = [
        health.d1.status === 'unhealthy',
        ...Object.values(health.kv).map(kv => kv.status === 'unhealthy'),
        health.r2.status === 'unhealthy',
        ...Object.values(health.durableObjects).map(dobj => dobj.status === 'unhealthy'),
      ].some(Boolean)

      health.overall = hasUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded'
    } catch (error) {
      health.overall = 'unhealthy'
      this.log('error', 'Health check failed:', error)
    }

    return health
  }

  // Metrics
  getMetrics(): CloudflareServiceMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = this.initializeMetrics()
  }

  // Private helper methods
  private updateD1Metrics(duration: number, success: boolean): void {
    if (!this.options.enableMetrics) return

    this.metrics.d1.queryCount++
    this.metrics.d1.totalQueryTime += duration
    if (!success) this.metrics.d1.errorCount++
    this.metrics.d1.avgQueryTime = this.metrics.d1.totalQueryTime / this.metrics.d1.queryCount
  }

  private updateKVMetrics(namespace: string, duration: number, success: boolean): void {
    if (!this.options.enableMetrics) return

    const metrics = this.metrics.kv[namespace]
    metrics.operationsCount++
    metrics.totalOperationTime += duration
    if (!success) metrics.errorCount++
  }

  private updateR2Metrics(
    operation: 'upload' | 'download' | 'delete',
    duration: number,
    success: boolean,
    bytes?: number
  ): void {
    if (!this.options.enableMetrics) return

    switch (operation) {
      case 'upload':
        this.metrics.r2.uploadCount++
        this.metrics.r2.totalUploadTime += duration
        if (bytes) this.metrics.r2.bytesUploaded += bytes
        break
      case 'download':
        this.metrics.r2.downloadCount++
        this.metrics.r2.totalDownloadTime += duration
        if (bytes) this.metrics.r2.bytesDownloaded += bytes
        break
      case 'delete':
        this.metrics.r2.deleteCount++
        break
    }

    if (!success) this.metrics.r2.errorCount++
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (this.options.logLevel && this.shouldLog(level)) {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] [CloudflareService] [${level.toUpperCase()}] ${message}`

      switch (level) {
        case 'debug':
          console.debug(logMessage, ...args)
          break
        case 'info':
          console.info(logMessage, ...args)
          break
        case 'warn':
          console.warn(logMessage, ...args)
          break
        case 'error':
          console.error(logMessage, ...args)
          break
      }
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.options.logLevel || 'info')
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  // Enhanced KV Cache Service accessors
  getKVCacheService(): KVCacheService | null {
    return this.enhancedKVCacheService
  }

  async getFromCache<T = any>(
    namespace: string,
    key: string,
    options?: { tags?: string[]; ttl?: number }
  ): Promise<T | null> {
    if (!this.enhancedKVCacheService) {
      return null
    }
    return this.enhancedKVCacheService.get<T>(key, {
      namespace: namespace as any,
      ...options,
    })
  }

  async setInCache<T = any>(
    namespace: string,
    key: string,
    data: T,
    options?: { tags?: string[]; ttl?: number; dependencies?: string[] }
  ): Promise<void> {
    if (!this.enhancedKVCacheService) {
      throw new Error('Enhanced KV cache service not available')
    }
    return this.enhancedKVCacheService.set<T>(key, data, {
      namespace: namespace as any,
      ...options,
    })
  }

  async invalidateCache(options: {
    namespace?: string
    tags?: string[]
    pattern?: string
    dependencies?: string[]
    olderThan?: number
  }): Promise<number> {
    if (!this.enhancedKVCacheService) {
      throw new Error('Enhanced KV cache service not available')
    }
    return this.enhancedKVCacheService.invalidate(options)
  }

  async getOrSetFromCache<T = any>(
    namespace: string,
    key: string,
    fetchFn: () => Promise<T>,
    options?: {
      tags?: string[]
      ttl?: number
      dependencies?: string[]
      staleWhileRevalidate?: boolean
      lockTimeout?: number
    }
  ): Promise<T> {
    if (!this.enhancedKVCacheService) {
      return fetchFn()
    }
    return this.enhancedKVCacheService.getOrSet<T>(key, fetchFn, {
      namespace: namespace as any,
      ...options,
    })
  }

  // Cache warming
  async warmupCache(
    namespace: string,
    entries: Array<{
      key: string
      fetchFn: () => Promise<any>
      ttl?: number
      tags?: string[]
      priority?: number
    }>
  ): Promise<{ success: number; failed: number; duration: number }> {
    if (!this.enhancedKVCacheService) {
      throw new Error('Enhanced KV cache service not available')
    }

    return this.enhancedKVCacheService.warmup({
      enabled: true,
      interval: 60, // 1 hour
      entries: entries.map(entry => ({
        key: entry.key,
        namespace,
        fetchFn: entry.fetchFn,
        ttl: entry.ttl,
        tags: entry.tags,
        priority: entry.priority || 1,
      })),
    })
  }

  // Cache analytics
  getCacheMetrics(namespace?: string) {
    if (!this.enhancedKVCacheService) {
      return null
    }
    return this.enhancedKVCacheService.getMetrics(namespace)
  }

  getCacheAnalytics() {
    if (!this.enhancedKVCacheService) {
      return null
    }
    return this.enhancedKVCacheService.getAnalytics()
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await this.stopHealthMonitoring()

      if (this.d1Pool) {
        await this.d1Pool.close()
      }

      if (this.r2FileService) {
        await this.r2FileService.stopHealthMonitoring()
      }

      if (this.enhancedKVCacheService) {
        await this.enhancedKVCacheService.shutdown()
      }

      this.log('info', 'CloudflareService cleaned up successfully')
    } catch (error) {
      this.log('error', 'Error during cleanup:', error)
    }
  }
}

// Factory function
export function createCloudflareService(
  env: any,
  options?: CloudflareServiceOptions
): CloudflareService {
  return new CloudflareService(env, options)
}

// Export types
export type { CloudflareServiceOptions, CloudflareServiceHealth, CloudflareServiceMetrics }
