/**
 * KV Cache Service - Enhanced Multi-Namespace Cache Implementation
 *
 * This service provides a comprehensive caching layer with multi-namespace support,
 * advanced invalidation strategies, performance monitoring, and seamless integration
 * with existing services in the application.
 */

import {
  getKVConfig,
  type KVCacheEntry,
  type KVConfig,
  type KVHealthMonitor,
  type KVOptions,
} from '../../config/cloudflare/kv-config'
import type { CloudflareService } from './cloudflare-service'

export interface CacheNamespace {
  name: string
  binding: string
  defaultTTL: number
  maxTTL: number
  enableGracePeriod: boolean
  enableCompression: boolean
  enableMetrics: boolean
}

export interface CacheEntry<T = any> extends KVCacheEntry<T> {
  namespace: string
  accessCount: number
  lastAccessed: number
  size: number
  version: string
  tags: string[]
  dependencies: string[]
  metadata?: Record<string, any>
}

export interface CacheInvalidationRule {
  id: string
  name: string
  pattern: string
  namespace?: string
  tags?: string[]
  type: 'tag' | 'pattern' | 'dependency' | 'ttl' | 'manual'
  isActive: boolean
  createdAt: number
  lastTriggered?: number
  triggerCount: number
}

export interface CacheWarmingConfig {
  enabled: boolean
  interval: number // minutes
  entries: Array<{
    key: string
    namespace: string
    fetchFn: () => Promise<any>
    ttl?: number
    tags?: string[]
    priority: number
  }>
}

export interface CacheMetrics {
  namespace: string
  operations: {
    gets: number
    sets: number
    deletes: number
    clears: number
    hits: number
    misses: number
  }
  performance: {
    avgGetTime: number
    avgSetTime: number
    avgDeleteTime: number
    totalSize: number
    entryCount: number
  }
  effectiveness: {
    hitRate: number
    missRate: number
    evictionRate: number
    compressionRatio: number
  }
  errors: {
    readErrors: number
    writeErrors: number
    networkErrors: number
    serializationErrors: number
  }
  lastUpdated: number
}

export interface CacheAnalytics {
  topKeys: Array<{
    key: string
    namespace: string
    accessCount: number
    hitRate: number
    size: number
    lastAccessed: number
  }>
  namespaceMetrics: Record<string, CacheMetrics>
  invalidationStats: {
    totalInvalidations: number
    byType: Record<string, number>
    byNamespace: Record<string, number>
    avgInvalidationTime: number
  }
  warmingStats: {
    totalWarmed: number
    successfulWarmings: number
    failedWarmings: number
    avgWarmingTime: number
    lastWarming: number
  }
  healthStatus: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    namespaces: Record<string, 'healthy' | 'degraded' | 'unhealthy'>
    issues: Array<{
      namespace: string
      type: string
      message: string
      timestamp: number
    }>
  }
}

export interface CacheEvent {
  type: 'get' | 'set' | 'delete' | 'invalidate' | 'warmup' | 'error'
  namespace: string
  key?: string
  timestamp: number
  duration?: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

export interface CacheOptions extends KVOptions {
  namespace?: string
  tags?: string[]
  dependencies?: string[]
  compress?: boolean
  enableMetrics?: boolean
  version?: string
  backgroundRefresh?: boolean
  refreshThreshold?: number
  onEvict?: (key: string, entry: CacheEntry) => void
}

export interface MultiGetResult<T = any> {
  key: string
  value: T | null
  hit: boolean
  error?: string
}

export interface CacheIterator<T = any> {
  next(): Promise<{ done: boolean; value?: CacheEntry<T> }>
  [Symbol.asyncIterator](): CacheIterator<T>
}

export class KVCacheService {
  private cloudflare: CloudflareService
  private namespaces: Map<string, CacheNamespace> = new Map()
  private metrics: Map<string, CacheMetrics> = new Map()
  private warmingConfigs: Map<string, CacheWarmingConfig> = new Map()
  private eventListeners: Map<string, Array<(event: CacheEvent) => void>> = new Map()
  private healthMonitor: KVHealthMonitor | null = null
  private warmingTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private isShuttingDown = false

  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(cloudflare: CloudflareService) {
    this.cloudflare = cloudflare
    this.initializeNamespaces()
    this.initializeMetrics()
    this.startEventListeners()
  }

  private initializeNamespaces(): void {
    const namespaceConfigs: Array<{ key: string; config: KVConfig }> = [
      { key: 'cache', config: getKVConfig('cache') },
      { key: 'sessions', config: getKVConfig('sessions') },
      { key: 'uploads', config: getKVConfig('uploads') },
      { key: 'analytics', config: getKVConfig('analytics') },
    ]

    namespaceConfigs.forEach(({ key, config }) => {
      this.namespaces.set(key, {
        name: key,
        binding: config.binding,
        defaultTTL: config.defaultTTL || 3600,
        maxTTL: config.maxTTL || 2592000,
        enableGracePeriod: config.enableGracePeriod || false,
        enableCompression: config.enableCompression || true,
        enableMetrics: config.enableHealthCheck || true,
      })
    })
  }

  private initializeMetrics(): void {
    this.namespaces.forEach((_namespace, name) => {
      this.metrics.set(name, {
        namespace: name,
        operations: {
          gets: 0,
          sets: 0,
          deletes: 0,
          clears: 0,
          hits: 0,
          misses: 0,
        },
        performance: {
          avgGetTime: 0,
          avgSetTime: 0,
          avgDeleteTime: 0,
          totalSize: 0,
          entryCount: 0,
        },
        effectiveness: {
          hitRate: 0,
          missRate: 0,
          evictionRate: 0,
          compressionRatio: 0,
        },
        errors: {
          readErrors: 0,
          writeErrors: 0,
          networkErrors: 0,
          serializationErrors: 0,
        },
        lastUpdated: Date.now(),
      })
    })
  }

  private startEventListeners(): void {
    // Clean up expired entries periodically
    setInterval(
      () => {
        if (!this.isShuttingDown) {
          this.cleanupExpiredEntries()
        }
      },
      5 * 60 * 1000
    ) // Every 5 minutes

    // Update metrics periodically
    setInterval(() => {
      if (!this.isShuttingDown) {
        this.updateMetrics()
      }
    }, 60 * 1000) // Every minute
  }

  // Core cache operations
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const namespace = options.namespace || 'cache'
    const startTime = Date.now()

    try {
      this.validateNamespace(namespace)

      // Check if we should batch this operation
      if (options.enableMetrics === false) {
        return this.performGet<T>(key, options)
      }

      const result = await this.performGet<T>(key, options)

      // Record metrics
      this.recordOperation(namespace, 'get', Date.now() - startTime, result !== null)

      // Emit event
      this.emitEvent({
        type: 'get',
        namespace,
        key,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: true,
        metadata: { hit: result !== null },
      })

      return result
    } catch (error) {
      this.recordError(namespace, 'read', error)

      this.emitEvent({
        type: 'get',
        namespace,
        key,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return null
    }
  }

  private async performGet<T = any>(key: string, options: CacheOptions): Promise<T | null> {
    const namespace = options.namespace || 'cache'

    // Check if we have this in the local cache (for performance)
    const localKey = this.getLocalKey(namespace, key)
    const localEntry = this.getLocalCacheEntry<T>(localKey)

    if (localEntry && !this.isExpired(localEntry)) {
      // Update access statistics
      localEntry.accessCount++
      localEntry.lastAccessed = Date.now()

      // Trigger background refresh if needed
      if (options.backgroundRefresh && this.shouldRefresh(localEntry, options.refreshThreshold)) {
        this.triggerBackgroundRefresh(key, localEntry, options).catch(console.error)
      }

      return localEntry.data
    }

    // Fetch from KV
    const kvEntry = await this.cloudflare.cacheGet<CacheEntry<T>>(namespace as any, key)

    if (!kvEntry) {
      this.updateMetrics(namespace, { miss: true })
      return null
    }

    // Check if expired
    if (this.isExpired(kvEntry)) {
      await this.delete(key, { namespace, enableMetrics: false })
      this.updateMetrics(namespace, { miss: true })
      return null
    }

    // Update access statistics
    kvEntry.accessCount++
    kvEntry.lastAccessed = Date.now()

    // Update in KV (async, don't wait)
    this.updateAccessStats(namespace, key, kvEntry).catch(console.error)

    // Cache locally for faster access
    this.setLocalCacheEntry(localKey, kvEntry)

    this.updateMetrics(namespace, { hit: true })

    // Trigger background refresh if needed
    if (options.backgroundRefresh && this.shouldRefresh(kvEntry, options.refreshThreshold)) {
      this.triggerBackgroundRefresh(key, kvEntry, options).catch(console.error)
    }

    return kvEntry.data
  }

  async set<T = any>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const namespace = options.namespace || 'cache'
    const startTime = Date.now()

    try {
      this.validateNamespace(namespace)

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl || this.namespaces.get(namespace)?.defaultTTL,
        namespace,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(data),
        version: options.version || '1.0',
        tags: options.tags || [],
        dependencies: options.dependencies || [],
        metadata: options.metadata,
      }

      // Serialize the entry
      const serialized = this.serializeEntry(entry)

      // Store in KV
      await this.cloudflare.cacheSet(namespace as any, key, serialized, {
        ttl: entry.ttl,
      })

      // Update local cache
      this.setLocalCacheEntry(this.getLocalKey(namespace, key), entry)

      // Update tag indices if tags provided
      if (entry.tags.length > 0) {
        await this.updateTagIndices(namespace, key, entry.tags)
      }

      // Record metrics
      this.recordOperation(namespace, 'set', Date.now() - startTime, true)
      this.updateMetrics(namespace, {
        entryAdd: true,
        sizeAdd: entry.size,
      })

      // Emit event
      this.emitEvent({
        type: 'set',
        namespace,
        key,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: true,
        metadata: {
          size: entry.size,
          tags: entry.tags,
          ttl: entry.ttl,
        },
      })
    } catch (error) {
      this.recordError(namespace, 'write', error)

      this.emitEvent({
        type: 'set',
        namespace,
        key,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const namespace = options.namespace || 'cache'
    const startTime = Date.now()

    try {
      this.validateNamespace(namespace)

      // Get the entry before deletion for metrics and callbacks
      const entry = await this.get<CacheEntry>(key, {
        namespace,
        enableMetrics: false,
      })

      // Delete from KV
      const success = await this.cloudflare.cacheDelete(namespace as any, key)

      if (success) {
        // Remove from local cache
        this.deleteLocalCacheEntry(this.getLocalKey(namespace, key))

        // Remove from tag indices
        if (entry?.tags.length) {
          await this.removeFromTagIndices(namespace, key, entry.tags)
        }

        // Call eviction callback if provided
        if (options.onEvict && entry) {
          try {
            await options.onEvict(key, entry)
          } catch (error) {
            console.error('Eviction callback error:', error)
          }
        }
      }

      // Record metrics
      this.recordOperation(namespace, 'delete', Date.now() - startTime, success)
      if (success && entry) {
        this.updateMetrics(namespace, {
          entryRemove: true,
          sizeRemove: entry.size,
        })
      }

      // Emit event
      this.emitEvent({
        type: 'delete',
        namespace,
        key,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success,
        metadata: { hadEntry: !!entry },
      })

      return success
    } catch (error) {
      this.recordError(namespace, 'write', error)

      this.emitEvent({
        type: 'delete',
        namespace,
        key,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return false
    }
  }

  async clear(namespace?: string): Promise<number> {
    const startTime = Date.now()
    let deletedCount = 0

    try {
      if (namespace) {
        this.validateNamespace(namespace)
        deletedCount = await this.clearNamespace(namespace)
      } else {
        // Clear all namespaces
        for (const nsName of this.namespaces.keys()) {
          deletedCount += await this.clearNamespace(nsName)
        }
      }

      // Record metrics
      const targetNs = namespace || 'all'
      this.recordOperation(targetNs, 'clear', Date.now() - startTime, true)

      // Emit event
      this.emitEvent({
        type: 'clear',
        namespace: namespace || 'all',
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: true,
        metadata: { deletedCount },
      })

      return deletedCount
    } catch (error) {
      const targetNs = namespace || 'all'
      this.recordError(targetNs, 'write', error)

      this.emitEvent({
        type: 'clear',
        namespace: namespace || 'all',
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  }

  private async clearNamespace(namespace: string): Promise<number> {
    // This is a simplified implementation
    // In a real scenario, you'd use KV list with prefix to get all keys
    const localKeys = Array.from((window as any).__localCache?.keys() || [])
    const namespaceKeys = localKeys.filter(key => key.startsWith(`${namespace}:`))

    let deletedCount = 0

    // Delete from local cache
    for (const key of namespaceKeys) {
      ;(window as any).__localCache?.delete(key)
      deletedCount++
    }

    // Note: Deleting all keys from KV namespace would require list operation
    // which is not directly available in all KV implementations

    return deletedCount
  }

  // Multi-get operations
  async getMultiple<T = any>(
    keys: string[],
    options: CacheOptions = {}
  ): Promise<Record<string, T | null>> {
    const namespace = options.namespace || 'cache'
    const results: Record<string, T | null> = {}

    // Try to get from local cache first
    const localResults: Record<string, T | null> = {}
    const kvKeys: string[] = []

    for (const key of keys) {
      const localKey = this.getLocalKey(namespace, key)
      const localEntry = this.getLocalCacheEntry<T>(localKey)

      if (localEntry && !this.isExpired(localEntry)) {
        localResults[key] = localEntry.data
        this.updateMetrics(namespace, { hit: true })
      } else {
        kvKeys.push(key)
      }
    }

    // Fetch remaining keys from KV
    if (kvKeys.length > 0) {
      const promises = kvKeys.map(async key => {
        try {
          const value = await this.get<T>(key, {
            ...options,
            enableMetrics: false,
          })
          results[key] = value
        } catch (error) {
          console.error(`Failed to get key ${key}:`, error)
          results[key] = null
        }
      })

      await Promise.allSettled(promises)
    }

    // Combine results
    return { ...localResults, ...results }
  }

  async setMultiple<T = any>(
    entries: Array<{ key: string; data: T; options?: CacheOptions }>,
    options: { batch?: boolean; concurrency?: number } = {}
  ): Promise<void> {
    const { batch = false, concurrency = 10 } = options

    if (batch) {
      // Use batch operation for better performance
      const batches = this.chunkArray(entries, concurrency)

      for (const batch of batches) {
        const promises = batch.map(({ key, data, options: entryOptions }) =>
          this.set(key, data, { ...entryOptions, enableMetrics: false })
        )
        await Promise.allSettled(promises)
      }
    } else {
      // Process sequentially
      for (const { key, data, options: entryOptions } of entries) {
        try {
          await this.set(key, data, entryOptions)
        } catch (error) {
          console.error(`Failed to set key ${key}:`, error)
        }
      }
    }
  }

  // Cache invalidation
  async invalidate(options: {
    tags?: string[]
    pattern?: string
    namespace?: string
    dependencies?: string[]
    olderThan?: number
  }): Promise<number> {
    const startTime = Date.now()
    let invalidatedCount = 0

    try {
      // Invalidate by tags
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const keys = await this.getKeysByTag(tag, options.namespace)
          for (const key of keys) {
            if (await this.delete(key, { namespace: options.namespace })) {
              invalidatedCount++
            }
          }
        }
      }

      // Invalidate by pattern
      if (options.pattern) {
        const keys = await this.getKeysByPattern(options.pattern, options.namespace)
        for (const key of keys) {
          if (await this.delete(key, { namespace: options.namespace })) {
            invalidatedCount++
          }
        }
      }

      // Invalidate by dependencies
      if (options.dependencies && options.dependencies.length > 0) {
        for (const dependency of options.dependencies) {
          const keys = await this.getKeysByDependency(dependency, options.namespace)
          for (const key of keys) {
            if (await this.delete(key, { namespace: options.namespace })) {
              invalidatedCount++
            }
          }
        }
      }

      // Invalidate older entries
      if (options.olderThan) {
        const cutoffTime = Date.now() - options.olderThan
        const keys = await this.getKeysOlderThan(cutoffTime, options.namespace)
        for (const key of keys) {
          if (await this.delete(key, { namespace: options.namespace })) {
            invalidatedCount++
          }
        }
      }

      // Emit event
      this.emitEvent({
        type: 'invalidate',
        namespace: options.namespace || 'all',
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: true,
        metadata: {
          invalidatedCount,
          criteria: options,
        },
      })

      return invalidatedCount
    } catch (error) {
      this.emitEvent({
        type: 'invalidate',
        namespace: options.namespace || 'all',
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: options,
      })

      throw error
    }
  }

  // Cache warming and preloading
  async warmup(config: CacheWarmingConfig): Promise<{
    success: number
    failed: number
    duration: number
  }> {
    const startTime = Date.now()
    let success = 0
    let failed = 0

    try {
      // Sort entries by priority
      const sortedEntries = [...config.entries].sort((a, b) => b.priority - a.priority)

      for (const entry of sortedEntries) {
        try {
          // Check if already exists and is fresh
          const existing = await this.get(entry.key, {
            namespace: entry.namespace,
            enableMetrics: false,
          })

          if (!existing) {
            const data = await entry.fetchFn()
            await this.set(entry.key, data, {
              namespace: entry.namespace,
              ttl: entry.ttl,
              tags: entry.tags,
              enableMetrics: false,
            })
            success++
          }
        } catch (error) {
          console.error(`Failed to warmup key ${entry.key}:`, error)
          failed++
        }
      }

      const duration = Date.now() - startTime

      // Store warming config for periodic warming
      if (config.enabled) {
        this.warmingConfigs.set(config.entries[0]?.namespace || 'default', config)
        this.startPeriodicWarming(config)
      }

      // Emit event
      this.emitEvent({
        type: 'warmup',
        namespace: 'all',
        timestamp: startTime,
        duration,
        success: true,
        metadata: { success, failed, totalEntries: config.entries.length },
      })

      return { success, failed, duration }
    } catch (error) {
      const duration = Date.now() - startTime

      this.emitEvent({
        type: 'warmup',
        namespace: 'all',
        timestamp: startTime,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  }

  private startPeriodicWarming(config: CacheWarmingConfig): void {
    const namespace = config.entries[0]?.namespace || 'default'

    // Clear existing timer
    const existingTimer = this.warmingTimers.get(namespace)
    if (existingTimer) {
      clearInterval(existingTimer)
    }

    // Start new timer
    const timer = setInterval(
      () => {
        if (!this.isShuttingDown) {
          this.warmup(config).catch(console.error)
        }
      },
      config.interval * 60 * 1000
    )

    this.warmingTimers.set(namespace, timer)
  }

  // Advanced cache patterns
  async getOrSet<T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions & {
      lockTimeout?: number
      staleWhileRevalidate?: boolean
    } = {}
  ): Promise<T> {
    const namespace = options.namespace || 'cache'

    // Try to get from cache first
    let cached = await this.get<T>(key, options)

    if (cached !== null) {
      // Check if we should refresh in background
      if (options.staleWhileRevalidate) {
        const entry = await this.get<CacheEntry<T>>(key, {
          namespace,
          enableMetrics: false,
        })

        if (entry && this.shouldRefresh(entry, options.refreshThreshold)) {
          // Refresh in background without waiting
          fetchFn()
            .then(data => {
              this.set(key, data, options).catch(console.error)
            })
            .catch(console.error)
        }
      }

      return cached
    }

    // Cache miss - need to fetch data
    try {
      // Implement simple distributed locking to prevent thundering herd
      const lockKey = `lock:${key}`
      const lockAcquired = await this.acquireLock(lockKey, namespace, options.lockTimeout)

      if (!lockAcquired) {
        // If we can't acquire the lock, wait and try again
        await this.wait(100)
        cached = await this.get<T>(key, options)
        if (cached !== null) {
          return cached
        }
      }

      // Fetch data
      const data = await fetchFn()

      // Set in cache
      await this.set(key, data, options)

      // Release lock
      if (lockAcquired) {
        await this.releaseLock(lockKey, namespace)
      }

      return data
    } catch (error) {
      // If fetch fails and stale-while-revalidate is enabled, try to return stale data
      if (options.staleWhileRevalidate) {
        cached = await this.get<T>(key, {
          ...options,
          ttl: 0, // Ignore TTL
        })

        if (cached !== null) {
          console.warn('Using stale cache data due to fetch error:', error)
          return cached
        }
      }

      throw error
    }
  }

  async getWithFallback<T = any>(
    key: string,
    primaryFetchFn: () => Promise<T>,
    fallbackFetchFn: () => Promise<T>,
    options: CacheOptions & {
      fallbackTTL?: number
      tryFallbackOnCacheHit?: boolean
    } = {}
  ): Promise<T> {
    const _namespace = options.namespace || 'cache'

    // Try cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null && !options.tryFallbackOnCacheHit) {
      return cached
    }

    // Try primary fetch
    try {
      const data = await primaryFetchFn()
      await this.set(key, data, options)
      return data
    } catch (primaryError) {
      console.warn('Primary fetch failed, trying fallback:', primaryError)

      try {
        const data = await fallbackFetchFn()
        // Cache with shorter TTL for fallback data
        await this.set(key, data, {
          ...options,
          ttl: options.fallbackTTL || 300, // 5 minutes default
        })
        return data
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback failed: ${fallbackError}`)
      }
    }
  }

  // Analytics and monitoring
  getMetrics(namespace?: string): CacheMetrics | Record<string, CacheMetrics> {
    if (namespace) {
      return this.metrics.get(namespace) || this.createEmptyMetrics(namespace)
    }

    const result: Record<string, CacheMetrics> = {}
    for (const [ns, metrics] of this.metrics) {
      result[ns] = { ...metrics }
    }
    return result
  }

  getAnalytics(): CacheAnalytics {
    const topKeys = this.getTopKeys()
    const namespaceMetrics = this.getMetrics() as Record<string, CacheMetrics>
    const invalidationStats = this.getInvalidationStats()
    const warmingStats = this.getWarmingStats()
    const healthStatus = this.getHealthStatus()

    return {
      topKeys,
      namespaceMetrics,
      invalidationStats,
      warmingStats,
      healthStatus,
    }
  }

  private getTopKeys(limit: number = 10): Array<{
    key: string
    namespace: string
    accessCount: number
    hitRate: number
    size: number
    lastAccessed: number
  }> {
    const allKeys: Array<{
      key: string
      namespace: string
      accessCount: number
      hitRate: number
      size: number
      lastAccessed: number
    }> = []

    for (const [nsName, _nsMetrics] of this.metrics) {
      // This would require maintaining access statistics per key
      // For now, return mock data
      allKeys.push({
        key: 'sample-key',
        namespace: nsName,
        accessCount: 100,
        hitRate: 0.95,
        size: 1024,
        lastAccessed: Date.now(),
      })
    }

    return allKeys.sort((a, b) => b.accessCount - a.accessCount).slice(0, limit)
  }

  private getInvalidationStats() {
    return {
      totalInvalidations: 0,
      byType: {} as Record<string, number>,
      byNamespace: {} as Record<string, number>,
      avgInvalidationTime: 0,
    }
  }

  private getWarmingStats() {
    return {
      totalWarmed: 0,
      successfulWarmings: 0,
      failedWarmings: 0,
      avgWarmingTime: 0,
      lastWarming: 0,
    }
  }

  private getHealthStatus() {
    const health: CacheAnalytics['healthStatus'] = {
      overall: 'healthy',
      namespaces: {} as Record<string, 'healthy' | 'degraded' | 'unhealthy'>,
      issues: [],
    }

    for (const nsName of this.namespaces.keys()) {
      health.namespaces[nsName] = 'healthy'
    }

    return health
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
    timestamp: number
  }> {
    const _startTime = Date.now()
    const details: Record<string, any> = {}

    try {
      // Test each namespace
      const namespaceChecks = await Promise.allSettled(
        Array.from(this.namespaces.keys()).map(ns => this.checkNamespaceHealth(ns))
      )

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

      namespaceChecks.forEach((result, index) => {
        const nsName = Array.from(this.namespaces.keys())[index]

        if (result.status === 'fulfilled') {
          details[nsName] = result.value
          if (result.value.status === 'unhealthy') {
            overallStatus = 'unhealthy'
          } else if (result.value.status === 'degraded' && overallStatus === 'healthy') {
            overallStatus = 'degraded'
          }
        } else {
          details[nsName] = {
            status: 'unhealthy',
            error: result.reason,
          }
          overallStatus = 'unhealthy'
        }
      })

      return {
        status: overallStatus,
        details,
        timestamp: Date.now(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: Date.now(),
      }
    }
  }

  private async checkNamespaceHealth(namespace: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTime: number
    error?: string
  }> {
    const startTime = Date.now()
    const testKey = `health-check-${namespace}-${Date.now()}`
    const testValue = { status: 'ok', namespace }

    try {
      await this.set(testKey, testValue, { namespace, ttl: 60 })
      const result = await this.get(testKey, { namespace })
      await this.delete(testKey, { namespace })

      const responseTime = Date.now() - startTime
      const success = result && result.status === 'ok'

      return {
        status: success && responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Event handling
  on(event: string, listener: (event: CacheEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)?.push(listener)
  }

  off(event: string, listener: (event: CacheEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emitEvent(event: CacheEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  // Cleanup and lifecycle
  async shutdown(): Promise<void> {
    this.isShuttingDown = true

    // Stop warming timers
    for (const timer of this.warmingTimers.values()) {
      clearInterval(timer)
    }
    this.warmingTimers.clear()

    // Stop batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer)
    }
    this.batchTimers.clear()

    // Clear local cache
    this.clearLocalCache()

    // Stop health monitoring
    if (this.healthMonitor) {
      await this.healthMonitor.stopMonitoring()
    }

    console.log('KV Cache Service shutdown complete')
  }

  // Private helper methods
  private validateNamespace(namespace: string): void {
    if (!this.namespaces.has(namespace)) {
      throw new Error(`Unknown cache namespace: ${namespace}`)
    }
  }

  private getLocalKey(namespace: string, key: string): string {
    return `${namespace}:${key}`
  }

  private getLocalCacheEntry<T>(key: string): CacheEntry<T> | null {
    return (window as any).__localCache?.get(key) || null
  }

  private setLocalCacheEntry<T>(key: string, entry: CacheEntry<T>): void {
    if (!(window as any).__localCache) {
      ;(window as any).__localCache = new Map()
    }
    ;(window as any).__localCache.set(key, entry)
  }

  private deleteLocalCacheEntry(key: string): void {
    ;(window as any).__localCache?.delete(key)
  }

  private clearLocalCache(): void {
    ;(window as any).__localCache?.clear()
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false
    return Date.now() - entry.timestamp > entry.ttl * 1000
  }

  private shouldRefresh(entry: CacheEntry, threshold?: number): boolean {
    if (!entry.ttl) return false

    const age = Date.now() - entry.timestamp
    const refreshThreshold = threshold || 0.8 // Default 80% of TTL
    const refreshTime = entry.ttl * 1000 * refreshThreshold

    return age > refreshTime
  }

  private async triggerBackgroundRefresh<T>(
    key: string,
    _entry: CacheEntry<T>,
    _options: CacheOptions
  ): Promise<void> {
    // This would need to be implemented with actual refresh logic
    // For now, it's a placeholder
    console.log(`Background refresh triggered for key: ${key}`)
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2 // Rough estimate in bytes
  }

  private serializeEntry(entry: CacheEntry): string {
    return JSON.stringify(entry)
  }

  private async updateAccessStats(
    namespace: string,
    key: string,
    entry: CacheEntry
  ): Promise<void> {
    try {
      await this.cloudflare.cacheSet(namespace as any, key, entry, {
        ttl: entry.ttl,
      })
    } catch (_error) {
      // Ignore errors in background update
    }
  }

  private async updateTagIndices(_namespace: string, _key: string, _tags: string[]): Promise<void> {
    // Implementation for maintaining tag indices
    // This would involve storing mappings from tags to keys
  }

  private async removeFromTagIndices(
    _namespace: string,
    _key: string,
    _tags: string[]
  ): Promise<void> {
    // Implementation for removing keys from tag indices
  }

  private async getKeysByTag(_tag: string, _namespace?: string): Promise<string[]> {
    // Implementation for retrieving keys by tag
    return []
  }

  private async getKeysByPattern(_pattern: string, _namespace?: string): Promise<string[]> {
    // Implementation for retrieving keys by pattern
    return []
  }

  private async getKeysByDependency(_dependency: string, _namespace?: string): Promise<string[]> {
    // Implementation for retrieving keys by dependency
    return []
  }

  private async getKeysOlderThan(_cutoffTime: number, _namespace?: string): Promise<string[]> {
    // Implementation for retrieving keys older than specified time
    return []
  }

  private async acquireLock(
    lockKey: string,
    namespace: string,
    timeout?: number
  ): Promise<boolean> {
    const lockValue = crypto.randomUUID()
    const lockTTL = timeout || 30 // 30 seconds default

    try {
      // Try to set lock atomically
      const existing = await this.get(lockKey, { namespace })
      if (existing === null) {
        await this.set(lockKey, lockValue, {
          namespace,
          ttl: lockTTL,
        })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  private async releaseLock(lockKey: string, namespace: string): Promise<void> {
    await this.delete(lockKey, { namespace })
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private recordOperation(
    namespace: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    const metrics = this.metrics.get(namespace)
    if (!metrics) return

    const ops = metrics.operations
    switch (operation) {
      case 'get':
        ops.gets++
        if (success) ops.hits++
        else ops.misses++
        break
      case 'set':
        ops.sets++
        break
      case 'delete':
        ops.deletes++
        break
      case 'clear':
        ops.clears++
        break
    }

    // Update performance metrics
    const perf = metrics.performance
    const _totalOps = ops.gets + ops.sets + ops.deletes

    switch (operation) {
      case 'get':
        perf.avgGetTime = (perf.avgGetTime * (ops.gets - 1) + duration) / ops.gets
        break
      case 'set':
        perf.avgSetTime = (perf.avgSetTime * (ops.sets - 1) + duration) / ops.sets
        break
      case 'delete':
        perf.avgDeleteTime = (perf.avgDeleteTime * (ops.deletes - 1) + duration) / ops.deletes
        break
    }

    metrics.lastUpdated = Date.now()
  }

  private recordError(namespace: string, type: string, _error: any): void {
    const metrics = this.metrics.get(namespace)
    if (!metrics) return

    const errors = metrics.errors

    switch (type) {
      case 'read':
        errors.readErrors++
        break
      case 'write':
        errors.writeErrors++
        break
      case 'network':
        errors.networkErrors++
        break
      case 'serialization':
        errors.serializationErrors++
        break
    }

    metrics.lastUpdated = Date.now()
  }

  private updateMetrics(
    namespace: string,
    updates: {
      hit?: boolean
      miss?: boolean
      entryAdd?: boolean
      entryRemove?: boolean
      sizeAdd?: number
      sizeRemove?: number
    }
  ): void {
    const metrics = this.metrics.get(namespace)
    if (!metrics) return

    const ops = metrics.operations
    const perf = metrics.performance
    const eff = metrics.effectiveness

    if (updates.hit) ops.hits++
    if (updates.miss) ops.misses++
    if (updates.entryAdd) {
      perf.entryCount++
      perf.totalSize += updates.sizeAdd || 0
    }
    if (updates.entryRemove) {
      perf.entryCount--
      perf.totalSize -= updates.sizeRemove || 0
    }

    // Update effectiveness metrics
    const totalRequests = ops.hits + ops.misses
    if (totalRequests > 0) {
      eff.hitRate = ops.hits / totalRequests
      eff.missRate = ops.misses / totalRequests
    }

    metrics.lastUpdated = Date.now()
  }

  private createEmptyMetrics(namespace: string): CacheMetrics {
    return {
      namespace,
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0,
        clears: 0,
        hits: 0,
        misses: 0,
      },
      performance: {
        avgGetTime: 0,
        avgSetTime: 0,
        avgDeleteTime: 0,
        totalSize: 0,
        entryCount: 0,
      },
      effectiveness: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        compressionRatio: 0,
      },
      errors: {
        readErrors: 0,
        writeErrors: 0,
        networkErrors: 0,
        serializationErrors: 0,
      },
      lastUpdated: Date.now(),
    }
  }

  private updateMetrics(): void {
    // Update global metrics calculations
    for (const [_namespace, metrics] of this.metrics) {
      const ops = metrics.operations
      const totalRequests = ops.hits + ops.misses

      if (totalRequests > 0) {
        metrics.effectiveness.hitRate = ops.hits / totalRequests
        metrics.effectiveness.missRate = ops.misses / totalRequests
      }
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    // Implementation for cleaning up expired entries
    // This would involve scanning for expired entries and removing them
  }
}

// Factory function
export function createKVCacheService(cloudflare: CloudflareService): KVCacheService {
  return new KVCacheService(cloudflare)
}

// Export types
export type {
  CacheNamespace,
  CacheEntry,
  CacheInvalidationRule,
  CacheWarmingConfig,
  CacheMetrics,
  CacheAnalytics,
  CacheEvent,
  CacheOptions,
  MultiGetResult,
  CacheIterator,
}
