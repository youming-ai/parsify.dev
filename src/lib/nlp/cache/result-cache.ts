/**
 * Result Cache
 * IndexedDB-based caching system for NLP results with TTL and storage management
 */

export interface CacheEntry<T = any> {
  id: string
  key: string
  result: T
  metadata: {
    operation: string
    model?: string
    inputHash: string
    inputSize: number
    processingTime: number
    timestamp: Date
    expiresAt?: Date
    accessCount: number
    lastAccessed: Date
    tags?: string[]
    version?: string
  }
  size: number // Size in bytes
}

export interface CacheConfig {
  maxSize: number // Maximum cache size in bytes
  maxEntries: number // Maximum number of entries
  defaultTTL: number // Default time-to-live in milliseconds
  compressionEnabled: boolean
  encryptionEnabled: boolean
  autoCleanup: boolean
  cleanupInterval: number
  priorityThreshold: number // Minimum priority to keep during cleanup
  databaseName: string
  databaseVersion: number
}

export interface CacheStatistics {
  totalEntries: number
  totalSize: number
  hitCount: number
  missCount: number
  hitRate: number
  averageAccessTime: number
  oldestEntry?: Date
  newestEntry?: Date
  entriesByOperation: Record<string, number>
  sizeByOperation: Record<string, number>
}

export class ResultCache {
  private db: IDBDatabase | null = null
  private config: CacheConfig
  private isInitialized = false
  private cleanupTimer?: NodeJS.Timeout
  private hitCount = 0
  private missCount = 0
  private totalAccessTime = 0

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      compressionEnabled: true,
      encryptionEnabled: false,
      autoCleanup: true,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      priorityThreshold: 0.5,
      databaseName: 'nlp-result-cache',
      databaseVersion: 1,
      ...config,
    }
  }

  /**
   * Initialize the cache database
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.databaseVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        this.startAutoCleanup()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create entries store
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' })
          entriesStore.createIndex('key', 'key', { unique: true })
          entriesStore.createIndex('operation', 'metadata.operation', { unique: false })
          entriesStore.createIndex('timestamp', 'metadata.timestamp', { unique: false })
          entriesStore.createIndex('expiresAt', 'metadata.expiresAt', { unique: false })
          entriesStore.createIndex('accessCount', 'metadata.accessCount', { unique: false })
          entriesStore.createIndex('lastAccessed', 'metadata.lastAccessed', { unique: false })
          entriesStore.createIndex('size', 'size', { unique: false })
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' })
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Get a cached result
   */
  public async get<T = any>(key: string): Promise<T | null> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    const startTime = performance.now()

    try {
      const entry = await this.getEntry(key)

      if (!entry) {
        this.missCount++
        this.totalAccessTime += performance.now() - startTime
        return null
      }

      // Check if expired
      if (entry.metadata.expiresAt && entry.metadata.expiresAt < new Date()) {
        await this.delete(key)
        this.missCount++
        this.totalAccessTime += performance.now() - startTime
        return null
      }

      // Update access statistics
      entry.metadata.accessCount++
      entry.metadata.lastAccessed = new Date()
      await this.updateEntry(entry)

      this.hitCount++
      this.totalAccessTime += performance.now() - startTime

      return entry.result as T

    } catch (error) {
      this.missCount++
      this.totalAccessTime += performance.now() - startTime
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
    options: {
      operation?: string
      model?: string
      inputHash?: string
      inputSize?: number
      processingTime?: number
      ttl?: number
      tags?: string[]
      version?: string
    } = {}
  ): Promise<void> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    // Calculate size
    const serializedResult = JSON.stringify(result)
    const size = new Blob([serializedResult]).size

    // Check if we need to make space
    await this.ensureCapacity(size)

    const entry: CacheEntry<T> = {
      id: this.generateId(),
      key,
      result,
      metadata: {
        operation: options.operation || 'unknown',
        model: options.model,
        inputHash: options.inputHash || await this.hashInput(key),
        inputSize: options.inputSize || key.length,
        processingTime: options.processingTime || 0,
        timestamp: new Date(),
        expiresAt: options.ttl ? new Date(Date.now() + options.ttl) : new Date(Date.now() + this.config.defaultTTL),
        accessCount: 0,
        lastAccessed: new Date(),
        tags: options.tags,
        version: options.version,
      },
      size,
    }

    await this.setEntry(entry)
  }

  /**
   * Check if a key exists in cache
   */
  public async has(key: string): Promise<boolean> {
    const entry = await this.getEntry(key)
    if (!entry) return false

    // Check if expired
    if (entry.metadata.expiresAt && entry.metadata.expiresAt < new Date()) {
      await this.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a cached result
   */
  public async delete(key: string): Promise<boolean> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    try {
      const transaction = this.db.transaction(['entries'], 'readwrite')
      const store = transaction.objectStore('entries')
      await store.delete(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Clear all cached results
   */
  public async clear(): Promise<void> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    const transaction = this.db.transaction(['entries'], 'readwrite')
    await transaction.objectStore('entries').clear()
  }

  /**
   * Get cache statistics
   */
  public async getStatistics(): Promise<CacheStatistics> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    const entries = await this.getAllEntries()
    const now = new Date()
    const validEntries = entries.filter(entry =>
      !entry.metadata.expiresAt || entry.metadata.expiresAt > now
    )

    const totalSize = validEntries.reduce((sum, entry) => sum + entry.size, 0)
    const hitRate = this.hitCount + this.missCount > 0
      ? this.hitCount / (this.hitCount + this.missCount)
      : 0
    const averageAccessTime = this.hitCount + this.missCount > 0
      ? this.totalAccessTime / (this.hitCount + this.missCount)
      : 0

    const entriesByOperation: Record<string, number> = {}
    const sizeByOperation: Record<string, number> = {}

    for (const entry of validEntries) {
      const operation = entry.metadata.operation
      entriesByOperation[operation] = (entriesByOperation[operation] || 0) + 1
      sizeByOperation[operation] = (sizeByOperation[operation] || 0) + entry.size
    }

    const timestamps = validEntries.map(entry => entry.metadata.timestamp)
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined

    return {
      totalEntries: validEntries.length,
      totalSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      averageAccessTime,
      oldestEntry,
      newestEntry,
      entriesByOperation,
      sizeByOperation,
    }
  }

  /**
   * Get entries by operation
   */
  public async getByOperation(operation: string): Promise<CacheEntry[]> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly')
      const store = transaction.objectStore('entries')
      const index = store.index('operation')
      const request = index.getAll(operation)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Get expired entries
   */
  public async getExpiredEntries(): Promise<CacheEntry[]> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    const now = new Date()
    const entries = await this.getAllEntries()
    return entries.filter(entry =>
      entry.metadata.expiresAt && entry.metadata.expiresAt < now
    )
  }

  /**
   * Clean up expired and low-priority entries
   */
  public async cleanup(): Promise<number> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    let deletedCount = 0

    // Remove expired entries
    const expiredEntries = await this.getExpiredEntries()
    for (const entry of expiredEntries) {
      await this.delete(entry.key)
      deletedCount++
    }

    // Remove entries if we're over limits
    const stats = await this.getStatistics()
    if (stats.totalEntries > this.config.maxEntries || stats.totalSize > this.config.maxSize) {
      deletedCount += await this.evictEntries()
    }

    return deletedCount
  }

  /**
   * Export cache data
   */
  public async export(): Promise<{ entries: CacheEntry[]; statistics: CacheStatistics }> {
    const entries = await this.getAllEntries()
    const statistics = await this.getStatistics()
    return { entries, statistics }
  }

  /**
   * Import cache data
   */
  public async import(data: { entries: CacheEntry[] }): Promise<void> {
    await this.initialize()
    if (!this.db) throw new Error('Cache database not initialized')

    for (const entry of data.entries) {
      await this.setEntry(entry)
    }
  }

  // Private helper methods

  private async getEntry(key: string): Promise<CacheEntry | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly')
      const store = transaction.objectStore('entries')
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  private async setEntry(entry: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite')
      const store = transaction.objectStore('entries')
      const request = store.put(entry)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async updateEntry(entry: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite')
      const store = transaction.objectStore('entries')
      const request = store.put(entry)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async getAllEntries(): Promise<CacheEntry[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly')
      const store = transaction.objectStore('entries')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  private async ensureCapacity(requiredSize: number): Promise<void> {
    const stats = await this.getStatistics()

    // Check if we need to make space
    const needsEviction =
      stats.totalEntries >= this.config.maxEntries ||
      stats.totalSize + requiredSize > this.config.maxSize

    if (needsEviction) {
      await this.evictEntries(requiredSize)
    }
  }

  private async evictEntries(requiredSize: number = 0): Promise<number> {
    const entries = await this.getAllEntries()
    const now = new Date()

    // Filter valid entries
    const validEntries = entries.filter(entry =>
      !entry.metadata.expiresAt || entry.metadata.expiresAt > now
    )

    // Sort by priority (least important first)
    const sortedEntries = validEntries.sort((a, b) => {
      const priorityA = this.calculatePriority(a)
      const priorityB = this.calculatePriority(b)
      return priorityA - priorityB
    })

    let deletedCount = 0
    let freedSize = 0
    const targetSize = this.config.maxSize * 0.8 // Leave 20% headroom
    const targetEntries = Math.floor(this.config.maxEntries * 0.8)

    for (const entry of sortedEntries) {
      if (freedSize >= requiredSize &&
          validEntries.length - deletedCount <= targetEntries &&
          validEntries.reduce((sum, e) => sum + e.size, 0) - freedSize <= targetSize) {
        break
      }

      await this.delete(entry.key)
      deletedCount++
      freedSize += entry.size
    }

    return deletedCount
  }

  private calculatePriority(entry: CacheEntry): number {
    const now = new Date()
    const age = now.getTime() - entry.metadata.timestamp.getTime()
    const timeSinceAccess = now.getTime() - entry.metadata.lastAccessed.getTime()

    // Factors: recency, frequency, size, operation priority
    const recencyScore = 1 / (1 + age / (24 * 60 * 60 * 1000)) // Decay over days
    const frequencyScore = Math.log(1 + entry.metadata.accessCount)
    const sizePenalty = entry.size / (1024 * 1024) // Penalty for larger entries
    const operationPriority = this.getOperationPriority(entry.metadata.operation)

    return recencyScore + frequencyScore - sizePenalty + operationPriority
  }

  private getOperationPriority(operation: string): number {
    const priorities: Record<string, number> = {
      'classification': 2,
      'sentiment': 2,
      'extraction': 1.5,
      'translation': 1.8,
      'summarization': 1.6,
      'embedding': 1.2,
      'preprocessing': 0.8,
      'analysis': 1.4,
      'default': 1,
    }

    return priorities[operation] || priorities.default
  }

  private async hashInput(input: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startAutoCleanup(): void {
    if (!this.config.autoCleanup) return

    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error)
    }, this.config.cleanupInterval)
  }

  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stopAutoCleanup()

    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.isInitialized = false
  }
}
