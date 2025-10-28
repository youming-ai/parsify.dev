/**
 * Cache Service - Cloudflare KV Integration
 *
 * This service provides a high-level interface for caching operations
 * using Cloudflare KV, with built-in cache management, tags,
 * and intelligent cache invalidation.
 */

import type { CloudflareService } from './cloudflare-service'

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  namespace?: 'cache' | 'uploads' | 'analytics'
  compress?: boolean
  metadata?: Record<string, any>
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  metadata?: Record<string, any>
  version: string
  hits: number
}

export interface CacheStats {
  size: number
  hitRate: number
  totalHits: number
  totalMisses: number
  totalSets: number
  totalDeletes: number
  avgReadTime: number
  avgWriteTime: number
  memoryUsage: number
}

export interface CacheInvalidationOptions {
  tags?: string[]
  pattern?: string
  namespace?: 'cache' | 'uploads' | 'analytics'
  olderThan?: number
}

export class CacheService {
  private cloudflare: CloudflareService
  private stats: CacheStats
  private hitRateTracking: Map<string, { hits: number; misses: number }> = new Map()

  constructor(cloudflare: CloudflareService) {
    this.cloudflare = cloudflare
    this.stats = this.initializeStats()
  }

  private initializeStats(): CacheStats {
    return {
      size: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      totalSets: 0,
      totalDeletes: 0,
      avgReadTime: 0,
      avgWriteTime: 0,
      memoryUsage: 0,
    }
  }

  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now()
    const namespace = options.namespace || 'cache'

    try {
      const result = await this.cloudflare.cacheGet<CacheEntry<T>>(namespace, key)

      if (result) {
        // Check if expired
        if (result.ttl && Date.now() - result.timestamp > result.ttl * 1000) {
          await this.delete(key, { namespace })
          this.updateStats('miss', Date.now() - startTime)
          return null
        }

        // Update hit tracking
        this.updateStats('hit', Date.now() - startTime)
        this.trackHit(key, 'hit')

        // Increment hit count in background
        this.incrementHitCount(key, namespace, result.hits + 1).catch(console.error)

        return result.data
      } else {
        this.updateStats('miss', Date.now() - startTime)
        this.trackHit(key, 'miss')
        return null
      }
    } catch (error) {
      console.error('Cache get error:', error)
      this.updateStats('miss', Date.now() - startTime)
      this.trackHit(key, 'miss')
      return null
    }
  }

  async set<T = any>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const startTime = Date.now()
    const namespace = options.namespace || 'cache'

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl || 3600, // 1 hour default
        tags: options.tags || [],
        metadata: options.metadata,
        version: '1.0',
        hits: 0,
      }

      await this.cloudflare.cacheSet(namespace, key, entry, { ttl: entry.ttl })

      // Update tag index if tags provided
      if (entry.tags.length > 0) {
        await this.updateTagIndex(namespace, key, entry.tags).catch(console.error)
      }

      this.updateStats('set', Date.now() - startTime)
    } catch (error) {
      console.error('Cache set error:', error)
      throw error
    }
  }

  async delete(
    key: string,
    options: { namespace?: 'cache' | 'uploads' | 'analytics' } = {}
  ): Promise<boolean> {
    const startTime = Date.now()
    const namespace = options.namespace || 'cache'

    try {
      const success = await this.cloudflare.cacheDelete(namespace, key)

      if (success) {
        // Remove from tag index
        await this.removeFromTagIndex(namespace, key).catch(console.error)
      }

      this.updateStats('delete', Date.now() - startTime)
      return success
    } catch (error) {
      console.error('Cache delete error:', error)
      this.updateStats('delete', Date.now() - startTime)
      return false
    }
  }

  async getOrSet<T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    let cached = await this.get<T>(key, options)

    if (cached !== null) {
      return cached
    }

    // Cache miss - fetch data
    try {
      const data = await fetchFn()

      // Set in cache
      await this.set(key, data, options)

      return data
    } catch (error) {
      // If fetch fails, try to return stale data if available
      cached = await this.get<T>(key, { ...options, ttl: 0 }) // Ignore TTL for stale data

      if (cached !== null) {
        console.warn('Using stale cache data due to fetch error:', error)
        return cached
      }

      throw error
    }
  }

  async getMultiple<T = any>(
    keys: string[],
    options: CacheOptions = {}
  ): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {}

    const promises = keys.map(async key => {
      const value = await this.get<T>(key, options)
      results[key] = value
    })

    await Promise.allSettled(promises)
    return results
  }

  async setMultiple<T = any>(
    entries: Array<{ key: string; data: T; options?: CacheOptions }>
  ): Promise<void> {
    const promises = entries.map(({ key, data, options }) => this.set(key, data, options))

    await Promise.allSettled(promises)
  }

  async invalidate(options: CacheInvalidationOptions): Promise<number> {
    const namespace = options.namespace || 'cache'
    let deletedCount = 0

    try {
      if (options.tags && options.tags.length > 0) {
        // Invalidate by tags
        for (const tag of options.tags) {
          const keys = await this.getKeysByTag(namespace, tag)
          for (const key of keys) {
            if (await this.delete(key, { namespace })) {
              deletedCount++
            }
          }
        }
      }

      if (options.pattern) {
        // Invalidate by pattern (simplified implementation)
        // In a real implementation, you'd use KV list with prefix
        const pattern = options.pattern.replace(/\*/g, '')
        const keys = await this.getKeysByPattern(namespace, pattern)

        for (const key of keys) {
          if (await this.delete(key, { namespace })) {
            deletedCount++
          }
        }
      }

      if (options.olderThan) {
        // Invalidate entries older than specified time
        const cutoffTime = Date.now() - options.olderThan
        const keys = await this.getKeysByAge(namespace, cutoffTime)

        for (const key of keys) {
          if (await this.delete(key, { namespace })) {
            deletedCount++
          }
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Cache invalidation error:', error)
      return deletedCount
    }
  }

  async warmup<T = any>(
    entries: Array<{
      key: string
      fetchFn: () => Promise<T>
      options?: CacheOptions
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    const promises = entries.map(async ({ key, fetchFn, options }) => {
      try {
        const data = await fetchFn()
        await this.set(key, data, options)
        success++
      } catch (error) {
        console.error(`Failed to warmup cache for key ${key}:`, error)
        failed++
      }
    })

    await Promise.allSettled(promises)
    return { success, failed }
  }

  // Advanced caching patterns
  async getWithRefresh<T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions & { refreshThreshold?: number } = {}
  ): Promise<T> {
    const refreshThreshold = options.refreshThreshold || 0.8 // Refresh at 80% of TTL
    const cached = await this.get<CacheEntry<T>>(key, {
      ...options,
      namespace: 'cache',
    })

    if (cached) {
      const entry = cached as any // We need the full entry data
      const age = Date.now() - entry.timestamp
      const refreshTime = entry.ttl * 1000 * refreshThreshold

      if (age > refreshTime) {
        // Refresh in background
        fetchFn()
          .then(data => {
            this.set(key, data, options).catch(console.error)
          })
          .catch(console.error)
      }

      return entry.data
    }

    // Cache miss - fetch and store
    const data = await fetchFn()
    await this.set(key, data, options)
    return data
  }

  async getWithFallback<T = any>(
    key: string,
    primaryFetchFn: () => Promise<T>,
    fallbackFetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
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
        await this.set(key, data, { ...options, ttl: 300 }) // 5 minutes
        return data
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback failed: ${fallbackError}`)
      }
    }
  }

  // Cache analytics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = this.initializeStats()
    this.hitRateTracking.clear()
  }

  getHitRateByKey(key: string): number {
    const tracking = this.hitRateTracking.get(key)
    if (!tracking || tracking.hits + tracking.misses === 0) {
      return 0
    }
    return tracking.hits / (tracking.hits + tracking.misses)
  }

  getTopKeys(limit: number = 10): Array<{ key: string; hitRate: number; totalRequests: number }> {
    const entries = Array.from(this.hitRateTracking.entries())
      .map(([key, tracking]) => ({
        key,
        hitRate: tracking.hits / (tracking.hits + tracking.misses),
        totalRequests: tracking.hits + tracking.misses,
      }))
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, limit)

    return entries
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    responseTime: number
    error?: string
    details?: {
      cacheSize: number
      hitRate: number
      avgResponseTime: number
    }
  }> {
    const startTime = Date.now()
    const testKey = `health-check-${Date.now()}`
    const testValue = { status: 'ok', timestamp: Date.now() }

    try {
      // Test write and read
      await this.set(testKey, testValue, { ttl: 60 })
      const result = await this.get(testKey)
      await this.delete(testKey)

      const responseTime = Date.now() - startTime
      const success = result && result.status === 'ok'

      return {
        status: success && responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          cacheSize: this.stats.size,
          hitRate: this.stats.hitRate,
          avgResponseTime: (this.stats.avgReadTime + this.stats.avgWriteTime) / 2,
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

  // Private helper methods
  private updateStats(operation: 'hit' | 'miss' | 'set' | 'delete', duration: number): void {
    switch (operation) {
      case 'hit':
        this.stats.totalHits++
        this.stats.avgReadTime =
          (this.stats.avgReadTime * (this.stats.totalHits - 1) + duration) / this.stats.totalHits
        break
      case 'miss':
        this.stats.totalMisses++
        this.stats.avgReadTime =
          (this.stats.avgReadTime * (this.stats.totalMisses - 1) + duration) /
          this.stats.totalMisses
        break
      case 'set':
        this.stats.totalSets++
        this.stats.avgWriteTime =
          (this.stats.avgWriteTime * (this.stats.totalSets - 1) + duration) / this.stats.totalSets
        break
      case 'delete':
        this.stats.totalDeletes++
        break
    }

    // Update hit rate
    const totalRequests = this.stats.totalHits + this.stats.totalMisses
    if (totalRequests > 0) {
      this.stats.hitRate = this.stats.totalHits / totalRequests
    }
  }

  private trackHit(key: string, type: 'hit' | 'miss'): void {
    const tracking = this.hitRateTracking.get(key) || { hits: 0, misses: 0 }

    if (type === 'hit') {
      tracking.hits++
    } else {
      tracking.misses++
    }

    this.hitRateTracking.set(key, tracking)
  }

  private async incrementHitCount(
    key: string,
    namespace: string,
    newHitCount: number
  ): Promise<void> {
    try {
      const entry = await this.cloudflare.cacheGet<CacheEntry<any>>(namespace, key)
      if (entry) {
        entry.hits = newHitCount
        await this.cloudflare.cacheSet(namespace, key, entry, {
          ttl: entry.ttl,
        })
      }
    } catch (_error) {
      // Ignore errors in background update
    }
  }

  private async updateTagIndex(namespace: string, key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        const taggedKeys = (await this.cloudflare.cacheGet<string[]>(namespace, tagKey)) || []

        if (!taggedKeys.includes(key)) {
          taggedKeys.push(key)
          await this.cloudflare.cacheSet(namespace, tagKey, taggedKeys, {
            ttl: 86400,
          }) // 24 hours
        }
      }
    } catch (error) {
      console.error('Failed to update tag index:', error)
    }
  }

  private async removeFromTagIndex(_namespace: string, _key: string): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real implementation, you'd maintain a proper tag index
    } catch (error) {
      console.error('Failed to remove from tag index:', error)
    }
  }

  private async getKeysByTag(namespace: string, tag: string): Promise<string[]> {
    try {
      const tagKey = `tag:${tag}`
      return (await this.cloudflare.cacheGet<string[]>(namespace, tagKey)) || []
    } catch (error) {
      console.error('Failed to get keys by tag:', error)
      return []
    }
  }

  private async getKeysByPattern(_namespace: string, _pattern: string): Promise<string[]> {
    // This is a simplified implementation
    // In a real implementation, you'd use KV list with prefix matching
    return []
  }

  private async getKeysByAge(_namespace: string, _cutoffTime: number): Promise<string[]> {
    // This is a simplified implementation
    // In a real implementation, you'd need to track ages or use metadata
    return []
  }
}

export function createCacheService(cloudflare: CloudflareService): CacheService {
  return new CacheService(cloudflare)
}
