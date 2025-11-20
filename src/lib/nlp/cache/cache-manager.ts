/**
 * Cache Manager
 * High-level cache management with multiple cache strategies and policies
 */

import { ResultCache, CacheEntry, CacheConfig, CacheStatistics } from './result-cache'

export interface CacheStrategy {
  name: string
  shouldCache: (key: string, result: any, metadata: any) => boolean
  generateKey: (input: any, operation: string) => string
  getTTL: (result: any, metadata: any) => number
  getPriority: (entry: CacheEntry) => number
}

export interface CachePolicy {
  operation: string
  enabled: boolean
  ttl: number
  maxSize?: number
  strategy?: string
  compressionEnabled?: boolean
  encryptionEnabled?: boolean
}

export interface CacheManagerConfig {
  defaultStrategy: string
  strategies: CacheStrategy[]
  policies: Record<string, CachePolicy>
  globalLimits: {
    maxSize: number
    maxEntries: number
    maxMemoryUsage: number
  }
  monitoring: {
    enableMetrics: boolean
    metricsInterval: number
    enableProfiling: boolean
  }
}

export interface CacheMetrics {
  totalHits: number
  totalMisses: number
  hitRate: number
  averageLatency: number
  totalOperations: number
  operationsByType: Record<string, number>
  memoryUsage: number
  diskUsage: number
  evictionCount: number
  compressionRatio: number
}

export class CacheManager {
  private caches: Map<string, ResultCache> = new Map()
  private strategies: Map<string, CacheStrategy> = new Map()
  private policies: Map<string, CachePolicy> = new Map()
  private config: CacheManagerConfig
  private metrics: CacheMetrics
  private metricsTimer?: NodeJS.Timeout

  constructor(config: Partial<CacheManagerConfig> = {}) {
    this.config = {
      defaultStrategy: 'lru',
      strategies: this.getDefaultStrategies(),
      policies: {},
      globalLimits: {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxEntries: 5000,
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      },
      monitoring: {
        enableMetrics: true,
        metricsInterval: 30000, // 30 seconds
        enableProfiling: false,
      },
      ...config,
    }

    this.metrics = this.initializeMetrics()
    this.initializeStrategies()
    this.initializePolicies()
    this.startMetricsCollection()
  }

  /**
   * Get a cached result
   */
  public async get<T = any>(
    key: string,
    operation: string,
    options: {
      strategy?: string
      fallbackCache?: string
    } = {}
  ): Promise<T | null> {
    const startTime = performance.now()
    const strategyName = options.strategy || this.config.defaultStrategy
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
      throw new Error(`Unknown cache strategy: ${strategyName}`)
    }

    try {
      const cache = this.getCacheForOperation(operation)
      const result = await cache.get<T>(key)

      this.recordMetrics('get', operation, performance.now() - startTime, result !== null)

      if (result !== null) {
        this.metrics.totalHits++
      } else {
        this.metrics.totalMisses++

        // Try fallback cache if specified
        if (options.fallbackCache) {
          const fallbackCacheInstance = this.caches.get(options.fallbackCache)
          if (fallbackCacheInstance) {
            const fallbackResult = await fallbackCacheInstance.get<T>(key)
            if (fallbackResult !== null) {
              // Repopulate primary cache
              await this.set(key, fallbackResult, operation)
              return fallbackResult
            }
          }
        }
      }

      return result

    } catch (error) {
      this.metrics.totalMisses++
      this.recordMetrics('get', operation, performance.now() - startTime, false)
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set a cached result
   */
  public async set<T = any>(
    key: string,
    result: T,
    operation: string,
    options: {
      strategy?: string
      ttl?: number
      tags?: string[]
      metadata?: any
      force?: boolean
    } = {}
  ): Promise<boolean> {
    const startTime = performance.now()
    const strategyName = options.strategy || this.config.defaultStrategy
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
      throw new Error(`Unknown cache strategy: ${strategyName}`)
    }

    const policy = this.policies.get(operation)
    if (!policy?.enabled && !options.force) {
      return false
    }

    // Check if we should cache this result
    if (!options.force && !strategy.shouldCache(key, result, options.metadata || {})) {
      return false
    }

    try {
      const cache = this.getCacheForOperation(operation)
      const ttl = options.ttl || strategy.getTTL(result, options.metadata || {})

      await cache.set(key, result, {
        operation,
        ttl,
        tags: options.tags,
        ...options.metadata,
      })

      this.recordMetrics('set', operation, performance.now() - startTime, true)
      return true

    } catch (error) {
      this.recordMetrics('set', operation, performance.now() - startTime, false)
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete a cached result
   */
  public async delete(key: string, operation?: string): Promise<boolean> {
    if (operation) {
      const cache = this.getCacheForOperation(operation)
      return await cache.delete(key)
    } else {
      // Delete from all caches
      const results = await Promise.all(
        Array.from(this.caches.values()).map(cache => cache.delete(key))
      )
      return results.some(success => success)
    }
  }

  /**
   * Clear cache
   */
  public async clear(operation?: string): Promise<void> {
    if (operation) {
      const cache = this.getCacheForOperation(operation)
      await cache.clear()
    } else {
      // Clear all caches
      await Promise.all(
        Array.from(this.caches.values()).map(cache => cache.clear())
      )
    }
  }

  /**
   * Get cache statistics
   */
  public async getStatistics(operation?: string): Promise<{
    [cacheName: string]: CacheStatistics
  }> {
    if (operation) {
      const cache = this.getCacheForOperation(operation)
      const stats = await cache.getStatistics()
      return { [operation]: stats }
    } else {
      const stats: { [cacheName: string]: CacheStatistics } = {}
      for (const [name, cache] of this.caches.entries()) {
        stats[name] = await cache.getStatistics()
      }
      return stats
    }
  }

  /**
   * Get cache metrics
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Warm up cache with common operations
   */
  public async warmup(operations: Array<{
    key: string
    operation: string
    data: any
    metadata?: any
  }>): Promise<number> {
    let warmedCount = 0

    for (const op of operations) {
      const success = await this.set(
        op.key,
        op.data,
        op.operation,
        { ...op.metadata, force: true }
      )
      if (success) warmedCount++
    }

    return warmedCount
  }

  /**
   * Preload cache with predicted data
   */
  public async preload(operation: string, data: any[]): Promise<number> {
    let preloadedCount = 0

    for (const item of data) {
      const key = this.generateKey(item, operation)
      const success = await this.set(key, item, operation)
      if (success) preloadedCount++
    }

    return preloadedCount
  }

  /**
   * Export cache data
   */
  public async export(operation?: string): Promise<any> {
    if (operation) {
      const cache = this.getCacheForOperation(operation)
      return await cache.export()
    } else {
      const exports: any = {}
      for (const [name, cache] of this.caches.entries()) {
        exports[name] = await cache.export()
      }
      return exports
    }
  }

  /**
   * Import cache data
   */
  public async import(data: any, operation?: string): Promise<void> {
    if (operation) {
      const cache = this.getCacheForOperation(operation)
      await cache.import(data)
    } else {
      for (const [name, cacheData] of Object.entries(data)) {
        const cache = this.caches.get(name)
        if (cache) {
          await cache.import(cacheData)
        }
      }
    }
  }

  /**
   * Optimize cache performance
   */
  public async optimize(): Promise<{
    cleanedEntries: number
    freedSpace: number
    compressionRatio: number
  }> {
    let totalCleaned = 0
    let totalFreed = 0

    for (const cache of this.caches.values()) {
      const cleaned = await cache.cleanup()
      totalCleaned += cleaned
    }

    const stats = await this.getStatistics()
    const totalSize = Object.values(stats).reduce((sum, s) => sum + s.totalSize, 0)
    const compressionRatio = this.calculateCompressionRatio()

    return {
      cleanedEntries: totalCleaned,
      freedSpace: totalSize,
      compressionRatio,
    }
  }

  // Private helper methods

  private getCacheForOperation(operation: string): ResultCache {
    let cache = this.caches.get(operation)

    if (!cache) {
      const policy = this.policies.get(operation)
      const cacheConfig: Partial<CacheConfig> = {
        maxSize: policy?.maxSize || this.config.globalLimits.maxSize / 10,
        maxEntries: Math.floor(this.config.globalLimits.maxEntries / 10),
        compressionEnabled: policy?.compressionEnabled ?? true,
        encryptionEnabled: policy?.encryptionEnabled ?? false,
      }

      cache = new ResultCache(cacheConfig)
      this.caches.set(operation, cache)
    }

    return cache
  }

  private generateKey(input: any, operation: string): string {
    const strategy = this.strategies.get(this.config.defaultStrategy)
    return strategy ? strategy.generateKey(input, operation) : `${operation}_${JSON.stringify(input)}`
  }

  private initializeMetrics(): CacheMetrics {
    return {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      averageLatency: 0,
      totalOperations: 0,
      operationsByType: {},
      memoryUsage: 0,
      diskUsage: 0,
      evictionCount: 0,
      compressionRatio: 1,
    }
  }

  private recordMetrics(operation: string, type: string, latency: number, success: boolean): void {
    if (!this.config.monitoring.enableMetrics) return

    this.metrics.totalOperations++
    this.metrics.averageLatency = (this.metrics.averageLatency * (this.metrics.totalOperations - 1) + latency) / this.metrics.totalOperations

    if (operation === 'get' && type !== undefined) {
      this.metrics.hitRate = this.metrics.totalHits / (this.metrics.totalHits + this.metrics.totalMisses)
    }

    const operationKey = `${type}_${operation}`
    this.metrics.operationsByType[operationKey] = (this.metrics.operationsByType[operationKey] || 0) + 1
  }

  private startMetricsCollection(): void {
    if (!this.config.monitoring.enableMetrics) return

    this.metricsTimer = setInterval(async () => {
      try {
        await this.collectPerformanceMetrics()
      } catch (error) {
        console.error('Metrics collection error:', error)
      }
    }, this.config.monitoring.metricsInterval)
  }

  private async collectPerformanceMetrics(): Promise<void> {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize
    }

    const stats = await this.getStatistics()
    this.metrics.diskUsage = Object.values(stats).reduce((sum, s) => sum + s.totalSize, 0)
    this.metrics.compressionRatio = this.calculateCompressionRatio()
  }

  private calculateCompressionRatio(): number {
    // This would be calculated based on actual compression data
    // For now, return a placeholder value
    return 0.7
  }

  private getDefaultStrategies(): CacheStrategy[] {
    return [
      {
        name: 'lru',
        shouldCache: (key, result, metadata) => true,
        generateKey: (input, operation) => {
          const hash = this.simpleHash(JSON.stringify(input))
          return `${operation}_${hash}`
        },
        getTTL: (result, metadata) => 24 * 60 * 60 * 1000, // 24 hours
        getPriority: (entry) => entry.metadata.accessCount,
      },
      {
        name: 'lfu',
        shouldCache: (key, result, metadata) => true,
        generateKey: (input, operation) => `${operation}_${this.simpleHash(JSON.stringify(input))}`,
        getTTL: (result, metadata) => 12 * 60 * 60 * 1000, // 12 hours
        getPriority: (entry) => entry.metadata.accessCount / (Date.now() - entry.metadata.timestamp.getTime()),
      },
      {
        name: 'size-based',
        shouldCache: (key, result, metadata) => {
          const size = JSON.stringify(result).length
          return size < 1024 * 1024 // 1MB limit
        },
        generateKey: (input, operation) => `${operation}_${this.simpleHash(JSON.stringify(input))}`,
        getTTL: (result, metadata) => 6 * 60 * 60 * 1000, // 6 hours
        getPriority: (entry) => -entry.size, // Negative for smaller priority
      },
    ]
  }

  private initializeStrategies(): void {
    for (const strategy of this.config.strategies) {
      this.strategies.set(strategy.name, strategy)
    }
  }

  private initializePolicies(): void {
    // Set default policies for common operations
    const defaultPolicies: CachePolicy[] = [
      {
        operation: 'classification',
        enabled: true,
        ttl: 60 * 60 * 1000, // 1 hour
        strategy: 'lru',
      },
      {
        operation: 'sentiment',
        enabled: true,
        ttl: 30 * 60 * 1000, // 30 minutes
        strategy: 'lfu',
      },
      {
        operation: 'embedding',
        enabled: true,
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        strategy: 'lru',
      },
      {
        operation: 'translation',
        enabled: true,
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        strategy: 'lru',
      },
      {
        operation: 'summarization',
        enabled: true,
        ttl: 12 * 60 * 60 * 1000, // 12 hours
        strategy: 'size-based',
      },
    ]

    for (const policy of defaultPolicies) {
      this.policies.set(policy.operation, policy)
    }

    // Add user-defined policies
    for (const [operation, policy] of Object.entries(this.config.policies)) {
      this.policies.set(operation, policy)
    }
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = undefined
    }

    for (const cache of this.caches.values()) {
      cache.dispose()
    }

    this.caches.clear()
    this.strategies.clear()
    this.policies.clear()
  }
}
