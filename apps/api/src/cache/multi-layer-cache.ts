/**
 * 多层缓存系统
 * L1: 内存缓存 (最快访问，容量最小)
 * L2: KV 缓存 (较快访问，中等容量)
 * L3: D1 缓存 (较慢访问，容量最大)
 */

import { logger } from '@shared/utils'

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  version: string
  metadata?: Record<string, unknown>
  accessCount: number
  lastAccessed: number
}

export interface CacheOptions {
  ttl?: number
  version?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  priority?: 'low' | 'normal' | 'high'
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  size: number
  memoryUsage: number
  layers: {
    l1: { hits: number; misses: number; size: number }
    l2: { hits: number; misses: number; size: number }
    l3: { hits: number; misses: number; size: number }
  }
}

export class MultiLayerCache {
  private l1Cache: Map<string, CacheEntry> = new Map()
  private l1MaxSize = 100
  private l1MaxMemory = 10 * 1024 * 1024 // 10MB
  private currentMemoryUsage = 0

  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0,
    layers: {
      l1: { hits: 0, misses: 0, size: 0 },
      l2: { hits: 0, misses: 0, size: 0 },
      l3: { hits: 0, misses: 0, size: 0 },
    },
  }

  constructor(
    private kvCache: KVNamespace,
    private d1Database: D1Database,
    options: {
      l1MaxSize?: number
      l1MaxMemory?: number
      enableMetrics?: boolean
      cleanupInterval?: number
    } = {}
  ) {
    this.l1MaxSize = options.l1MaxSize || 100
    this.l1MaxMemory = options.l1MaxMemory || 10 * 1024 * 1024

    // Start cleanup interval
    if (options.cleanupInterval) {
      setInterval(() => this.cleanup(), options.cleanupInterval)
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const startTime = performance.now()

    try {
      // L1: Memory cache
      let entry = this.l1Cache.get(key)
      if (entry && !this.isExpired(entry)) {
        this.updateAccess(entry)
        this.stats.hits++
        this.stats.layers.l1.hits++

        logger.debug('Cache hit (L1)', {
          key,
          layer: 'L1',
          duration: performance.now() - startTime,
        })
        return entry.data as T
      }

      if (entry) {
        this.evictFromL1(key)
        this.stats.layers.l1.misses++
      } else {
        this.stats.layers.l1.misses++
      }

      // L2: KV cache
      try {
        const kvData = await this.kvCache.get(this.formatKey(key), 'json')
        if (kvData && !this.isExpired(kvData as CacheEntry)) {
          entry = kvData as CacheEntry
          this.promoteToL1(key, entry)
          this.updateAccess(entry)
          this.stats.hits++
          this.stats.layers.l2.hits++

          logger.debug('Cache hit (L2)', {
            key,
            layer: 'L2',
            duration: performance.now() - startTime,
          })
          return entry.data as T
        }
      } catch (error) {
        logger.warn('KV cache access failed', { key, error: (error as Error).message })
      }

      this.stats.layers.l2.misses++

      // L3: D1 database cache
      try {
        const result = await this.d1Database
          .prepare('SELECT data FROM cache_entries WHERE key = ? AND expires_at > ?')
          .bind(key, Date.now())
          .first()

        if (result) {
          const data = JSON.parse(result.data as string) as CacheEntry
          if (!this.isExpired(data)) {
            entry = data
            this.promoteToL1(key, entry)
            this.promoteToL2(key, entry)
            this.updateAccess(entry)
            this.stats.hits++
            this.stats.layers.l3.hits++

            logger.debug('Cache hit (L3)', {
              key,
              layer: 'L3',
              duration: performance.now() - startTime,
            })
            return entry.data as T
          }
        }
      } catch (error) {
        logger.warn('D1 cache access failed', { key, error: (error as Error).message })
      }

      this.stats.layers.l3.misses++
      this.stats.misses++

      logger.debug('Cache miss', { key, duration: performance.now() - startTime })
      return null
    } catch (error) {
      logger.error('Cache get operation failed', { key, error: (error as Error).message })
      return null
    }
  }

  async set<T = unknown>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const startTime = performance.now()

    try {
      const ttl = options.ttl || 3600000 // 1 hour default
      const expiresAt = Date.now() + ttl

      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
        version: options.version || '1.0.0',
        metadata: options.metadata,
        accessCount: 0,
        lastAccessed: Date.now(),
      }

      // L1: Memory cache
      this.promoteToL1(key, entry)

      // L2: KV cache (async, don't wait)
      this.setL2Async(key, entry, expiresAt).catch(error => {
        logger.warn('L2 cache set failed', { key, error: (error as Error).message })
      })

      // L3: D1 database cache (async, don't wait)
      this.setL3Async(key, entry, expiresAt).catch(error => {
        logger.warn('L3 cache set failed', { key, error: (error as Error).message })
      })

      this.stats.sets++

      logger.debug('Cache set', { key, ttl, duration: performance.now() - startTime })
    } catch (error) {
      logger.error('Cache set operation failed', { key, error: (error as Error).message })
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      // L1
      const l1Deleted = this.l1Cache.delete(key)
      if (l1Deleted) {
        this.updateMemoryUsage()
      }

      // L2
      const l2Promise = this.kvCache.delete(this.formatKey(key))

      // L3
      const l3Promise = this.d1Database
        .prepare('DELETE FROM cache_entries WHERE key = ?')
        .bind(key)
        .run()

      await Promise.allSettled([l2Promise, l3Promise])

      this.stats.deletes++

      logger.debug('Cache delete', { key })
      return l1Deleted
    } catch (error) {
      logger.error('Cache delete operation failed', { key, error: (error as Error).message })
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear L1
      this.l1Cache.clear()
      this.currentMemoryUsage = 0

      // Clear L2 (limited batch)
      const l2Promise = this.clearL2Batch()

      // Clear L3
      const l3Promise = this.d1Database.prepare('DELETE FROM cache_entries').run()

      await Promise.allSettled([l2Promise, l3Promise])

      logger.info('Cache cleared')
    } catch (error) {
      logger.error('Cache clear operation failed', { error: (error as Error).message })
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      // This would require tag indexing in the database
      // For now, we'll clear memory cache entries with matching tags
      const keysToDelete: string[] = []

      for (const [key, entry] of this.l1Cache.entries()) {
        if (entry.metadata?.tags?.includes(tag)) {
          keysToDelete.push(key)
        }
      }

      for (const key of keysToDelete) {
        this.l1Cache.delete(key)
      }

      this.updateMemoryUsage()

      logger.info('Cache invalidated by tag', { tag, keysDeleted: keysToDelete.length })
    } catch (error) {
      logger.error('Cache invalidation by tag failed', { tag, error: (error as Error).message })
    }
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.l1Cache.size,
      memoryUsage: this.currentMemoryUsage,
    }
  }

  // Private methods
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private updateAccess(entry: CacheEntry): void {
    entry.accessCount++
    entry.lastAccessed = Date.now()
  }

  private estimateSize(entry: CacheEntry): number {
    return JSON.stringify(entry).length * 2 // Rough estimation
  }

  private updateMemoryUsage(): void {
    this.currentMemoryUsage = 0
    for (const entry of this.l1Cache.values()) {
      this.currentMemoryUsage += this.estimateSize(entry)
    }
  }

  private promoteToL1(key: string, entry: CacheEntry): void {
    // Check if we need to evict
    if (this.l1Cache.size >= this.l1MaxSize || this.currentMemoryUsage >= this.l1MaxMemory) {
      this.evictLRU()
    }

    this.l1Cache.set(key, entry)
    this.currentMemoryUsage += this.estimateSize(entry)
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      const evicted = this.l1Cache.get(oldestKey)
      if (evicted) {
        this.currentMemoryUsage -= this.estimateSize(evicted)
      }
      this.l1Cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  private evictFromL1(key: string): void {
    const entry = this.l1Cache.get(key)
    if (entry) {
      this.currentMemoryUsage -= this.estimateSize(entry)
      this.l1Cache.delete(key)
    }
  }

  private async setL2Async(key: string, entry: CacheEntry, expiresAt: number): Promise<void> {
    const kvKey = this.formatKey(key)
    const value = JSON.stringify(entry)

    await this.kvCache.put(kvKey, value, {
      expirationTtl: Math.floor((expiresAt - Date.now()) / 1000),
      metadata: {
        version: entry.version,
        accessCount: entry.accessCount,
      },
    })
  }

  private async setL3Async(key: string, entry: CacheEntry, expiresAt: number): Promise<void> {
    await this.d1Database
      .prepare(
        'INSERT OR REPLACE INTO cache_entries (key, data, expires_at, created_at) VALUES (?, ?, ?, ?)'
      )
      .bind(key, JSON.stringify(entry), expiresAt, Date.now())
      .run()
  }

  private formatKey(key: string): string {
    return `cache:${key}`
  }

  private async clearL2Batch(): Promise<void> {
    // KV doesn't support deleting by prefix, so we'd need to maintain a list
    // For now, this is a placeholder
    logger.info('L2 cache clear (limited)')
  }

  private cleanup(): void {
    const _now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.l1Cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.evictFromL1(key)
    }

    if (keysToDelete.length > 0) {
      logger.debug('Cache cleanup completed', { evicted: keysToDelete.length })
    }
  }
}

// Factory function
export function createMultiLayerCache(
  kvCache: KVNamespace,
  d1Database: D1Database,
  options?: ConstructorParameters<typeof MultiLayerCache>[2]
): MultiLayerCache {
  return new MultiLayerCache(kvCache, d1Database, options)
}
