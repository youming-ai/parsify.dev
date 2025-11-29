/**
 * NLP Result Cache
 * Intelligent caching system for NLP results using IndexedDB with LRU eviction
 */

import type { NLPResult, ProcessingRequest, ProcessingResult } from '@/lib/nlp/core/engine';

// Types
export interface CacheEntry {
  id: string;
  key: string;
  result: ProcessingResult;
  request: ProcessingRequest;
  metadata: CacheMetadata;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  tags: string[];
}

export interface CacheMetadata {
  processingTime: number;
  confidence?: number;
  model?: {
    name: string;
    version: string;
  };
  inputHash: string;
  outputHash?: string;
  language?: string;
  quality?: {
    accuracy?: number;
    completeness?: number;
    consistency?: number;
  };
  performance?: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
  };
}

export interface CacheStatistics {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageAccessTime: number;
  oldestEntry?: number;
  newestEntry?: number;
  sizeDistribution: Record<string, number>;
  tagDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  ttl: number; // Time to live in milliseconds
  enableCompression: boolean;
  enableEncryption: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'size' | 'time';
  enableMetrics: boolean;
  enablePersistence: boolean;
  persistenceInterval: number;
  enableSmartCaching: boolean;
  similarityThreshold: number;
  enableDeduplication: boolean;
}

export interface CacheQuery {
  text?: string;
  operations?: string[];
  model?: string;
  language?: string;
  minConfidence?: number;
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  similarityThreshold?: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  enableCompression: true,
  enableEncryption: false,
  evictionPolicy: 'lru',
  enableMetrics: true,
  enablePersistence: true,
  persistenceInterval: 60000, // 1 minute
  enableSmartCaching: true,
  similarityThreshold: 0.85,
  enableDeduplication: true,
};

export class ResultCache {
  private config: CacheConfig;
  private db: IDBDatabase | null = null;
  private dbName = 'nlp_result_cache';
  private dbVersion = 1;

  private memoryCache: Map<string, CacheEntry> = new Map();
  private indexCache: Map<string, Set<string>> = new Map(); // For quick lookups

  private statistics: CacheStatistics = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionRate: 0,
    averageAccessTime: 0,
    sizeDistribution: {},
    tagDistribution: {},
    modelDistribution: {},
  };

  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccessTime: 0,
    accessCount: 0,
  };

  private persistenceTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Initialize the cache
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.openDatabase();
      await this.loadPersistedData();
      await this.startPersistenceTimer();

      this.isInitialized = true;
      console.log('NLP Result Cache initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NLP Result Cache:', error);
      throw error;
    }
  }

  /**
   * Open IndexedDB database
   */
  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create main cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
          cacheStore.createIndex('key', 'key', { unique: true });
          cacheStore.createIndex('createdAt', 'createdAt');
          cacheStore.createIndex('lastAccessed', 'lastAccessed');
          cacheStore.createIndex('accessCount', 'accessCount');
          cacheStore.createIndex('tags', 'tags', { multiEntry: true });
          cacheStore.createIndex('metadata.model.name', 'metadata.model.name', {
            unique: false,
          });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', {
            keyPath: 'key',
          });
          metadataStore.createIndex('timestamp', 'timestamp');
        }

        // Create index store for fast lookups
        if (!db.objectStoreNames.contains('indexes')) {
          db.createObjectStore('indexes', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Load persisted data from IndexedDB
   */
  private async loadPersistedData(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');

      const request = store.getAll();
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const entries = request.result as CacheEntry[];
      const now = Date.now();

      // Filter expired entries
      const validEntries = entries.filter((entry) => now - entry.createdAt < this.config.ttl);

      // Load into memory cache
      for (const entry of validEntries) {
        this.memoryCache.set(entry.key, entry);
        this.updateIndexes(entry);
      }

      // Update statistics
      this.updateStatistics();
    } catch (error) {
      console.warn('Failed to load persisted cache data:', error);
    }
  }

  /**
   * Generate cache key for a request
   */
  private generateCacheKey(request: ProcessingRequest): string {
    const keyData = {
      text: request.text,
      operations: request.operations.map((op) => op.type).sort(),
      config: request.config,
    };

    // Create hash of the request data
    const keyString = JSON.stringify(keyData);
    return this.hashString(keyString);
  }

  /**
   * Hash string to create cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached result
   */
  public async get(request: ProcessingRequest): Promise<ProcessingResult | null> {
    const startTime = performance.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    const key = this.generateCacheKey(request);
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.metrics.accessCount++;
      this.metrics.totalAccessTime += performance.now() - startTime;
      this.updateStatistics();
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      await this.delete(key);
      this.metrics.misses++;
      this.metrics.accessCount++;
      this.metrics.totalAccessTime += performance.now() - startTime;
      this.updateStatistics();
      return null;
    }

    // Update access metadata
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    this.metrics.hits++;
    this.metrics.accessCount++;
    this.metrics.totalAccessTime += performance.now() - startTime;
    this.updateStatistics();

    return entry.result;
  }

  /**
   * Store result in cache
   */
  public async set(
    request: ProcessingRequest,
    result: ProcessingResult,
    metadata: Partial<CacheMetadata> & { tags?: string[] } = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const key = this.generateCacheKey(request);
    const now = Date.now();

    // Check if similar entry exists (smart caching)
    if (this.config.enableSmartCaching && this.config.enableDeduplication) {
      const similarKey = await this.findSimilarEntry(request);
      if (similarKey) {
        return; // Don't cache if similar result exists
      }
    }

    // Calculate entry size
    const size = this.calculateSize(request, result);

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    // Create cache entry
    const entry: CacheEntry = {
      id: this.generateId(),
      key,
      result,
      request,
      metadata: {
        processingTime: metadata.processingTime || 0,
        confidence: metadata.confidence,
        model: metadata.model,
        inputHash: this.hashString(request.text),
        outputHash: metadata.outputHash,
        language: metadata.language,
        quality: metadata.quality,
        performance: metadata.performance,
      },
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      size,
      tags: metadata.tags || [],
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);
    this.updateIndexes(entry);

    // Persist to IndexedDB
    if (this.config.enablePersistence) {
      await this.persistEntry(entry);
    }

    this.updateStatistics();
  }

  /**
   * Delete entry from cache
   */
  public async delete(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return false;
    }

    // Remove from memory cache
    this.memoryCache.delete(key);
    this.removeFromIndexes(entry);

    // Remove from IndexedDB
    if (this.config.enablePersistence && this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.delete(entry.id);
      } catch (error) {
        console.warn('Failed to delete entry from IndexedDB:', error);
      }
    }

    this.updateStatistics();
    return true;
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    this.indexCache.clear();

    // Clear IndexedDB
    if (this.config.enablePersistence && this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        await transaction.objectStore('cache').clear();
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }

    // Reset metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0,
    };

    this.updateStatistics();
  }

  /**
   * Search cache entries
   */
  public async search(query: CacheQuery): Promise<CacheEntry[]> {
    const results: CacheEntry[] = [];

    for (const entry of this.memoryCache.values()) {
      if (this.matchesQuery(entry, query)) {
        results.push(entry);
      }
    }

    // Sort by relevance (last accessed, then confidence)
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });

    return results;
  }

  /**
   * Check if entry matches query
   */
  private matchesQuery(entry: CacheEntry, query: CacheQuery): boolean {
    // Text similarity
    if (query.text) {
      const similarity = this.calculateTextSimilarity(query.text, entry.request.text);
      const threshold = query.similarityThreshold || this.config.similarityThreshold;
      if (similarity < threshold) {
        return false;
      }
    }

    // Operations
    if (query.operations && query.operations.length > 0) {
      const entryOperations = entry.request.operations.map((op) => op.type);
      const hasAllOperations = query.operations.every((op) => entryOperations.includes(op));
      if (!hasAllOperations) {
        return false;
      }
    }

    // Model
    if (query.model) {
      if (entry.metadata.model?.name !== query.model) {
        return false;
      }
    }

    // Language
    if (query.language) {
      if (entry.metadata.language !== query.language) {
        return false;
      }
    }

    // Minimum confidence
    if (query.minConfidence) {
      if (!entry.metadata.confidence || entry.metadata.confidence < query.minConfidence) {
        return false;
      }
    }

    // Tags
    if (query.tags && query.tags.length > 0) {
      const hasAllTags = query.tags.every((tag) => entry.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    // Date range
    if (query.dateRange) {
      if (entry.createdAt < query.dateRange.start || entry.createdAt > query.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate text similarity (simplified Jaccard similarity)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((word) => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(entry: CacheEntry, _query: CacheQuery): number {
    let score = 0;

    // Recent access bonus
    const hoursSinceAccess = (Date.now() - entry.lastAccessed) / (1000 * 60 * 60);
    score += Math.max(0, 10 - hoursSinceAccess);

    // Confidence bonus
    if (entry.metadata.confidence) {
      score += entry.metadata.confidence * 10;
    }

    // Access frequency bonus
    score += Math.min(entry.accessCount, 10);

    return score;
  }

  /**
   * Find similar entry (for deduplication)
   */
  private async findSimilarEntry(request: ProcessingRequest): Promise<string | null> {
    const threshold = this.config.similarityThreshold;

    for (const [key, entry] of this.memoryCache.entries()) {
      // Check operation similarity
      const operationsMatch = this.compareOperations(request.operations, entry.request.operations);

      if (!operationsMatch) continue;

      // Check text similarity
      const similarity = this.calculateTextSimilarity(request.text, entry.request.text);

      if (similarity >= threshold) {
        return key;
      }
    }

    return null;
  }

  /**
   * Compare operation lists
   */
  private compareOperations(ops1: any[], ops2: any[]): boolean {
    if (ops1.length !== ops2.length) return false;

    const types1 = ops1.map((op) => op.type).sort();
    const types2 = ops2.map((op) => op.type).sort();

    return JSON.stringify(types1) === JSON.stringify(types2);
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > this.config.ttl;
  }

  /**
   * Calculate entry size
   */
  private calculateSize(request: ProcessingRequest, result: ProcessingResult): number {
    const requestSize = JSON.stringify(request).length;
    const resultSize = JSON.stringify(result).length;
    return requestSize + resultSize;
  }

  /**
   * Ensure cache capacity
   */
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.memoryCache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    const entryCount = this.memoryCache.size;

    // Check if we need to evict
    if (currentSize + newEntrySize > this.config.maxSize || entryCount >= this.config.maxEntries) {
      await this.evictEntries(newEntrySize);
    }
  }

  /**
   * Evict entries based on policy
   */
  private async evictEntries(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.memoryCache.values());

    // Sort based on eviction policy
    entries.sort((a, b) => {
      switch (this.config.evictionPolicy) {
        case 'lru':
          return a.lastAccessed - b.lastAccessed;
        case 'lfu':
          return a.accessCount - b.accessCount;
        case 'size':
          return b.size - a.size;
        case 'time':
          return a.createdAt - b.createdAt;
        default:
          return a.lastAccessed - b.lastAccessed;
      }
    });

    let freedSpace = 0;
    const evictedEntries: string[] = [];

    for (const entry of entries) {
      if (freedSpace >= requiredSpace) break;

      evictedEntries.push(entry.key);
      freedSpace += entry.size;
    }

    // Delete evicted entries
    for (const key of evictedEntries) {
      await this.delete(key);
      this.metrics.evictions++;
    }
  }

  /**
   * Update indexes for fast lookups
   */
  private updateIndexes(entry: CacheEntry): void {
    // Tag index
    for (const tag of entry.tags) {
      if (!this.indexCache.has(`tag:${tag}`)) {
        this.indexCache.set(`tag:${tag}`, new Set());
      }
      this.indexCache.get(`tag:${tag}`)?.add(entry.key);
    }

    // Model index
    if (entry.metadata.model?.name) {
      const modelKey = `model:${entry.metadata.model.name}`;
      if (!this.indexCache.has(modelKey)) {
        this.indexCache.set(modelKey, new Set());
      }
      this.indexCache.get(modelKey)?.add(entry.key);
    }

    // Language index
    if (entry.metadata.language) {
      const langKey = `lang:${entry.metadata.language}`;
      if (!this.indexCache.has(langKey)) {
        this.indexCache.set(langKey, new Set());
      }
      this.indexCache.get(langKey)?.add(entry.key);
    }
  }

  /**
   * Remove entry from indexes
   */
  private removeFromIndexes(entry: CacheEntry): void {
    // Tag index
    for (const tag of entry.tags) {
      const tagKey = `tag:${tag}`;
      const tagSet = this.indexCache.get(tagKey);
      if (tagSet) {
        tagSet.delete(entry.key);
        if (tagSet.size === 0) {
          this.indexCache.delete(tagKey);
        }
      }
    }

    // Model index
    if (entry.metadata.model?.name) {
      const modelKey = `model:${entry.metadata.model.name}`;
      const modelSet = this.indexCache.get(modelKey);
      if (modelSet) {
        modelSet.delete(entry.key);
        if (modelSet.size === 0) {
          this.indexCache.delete(modelKey);
        }
      }
    }

    // Language index
    if (entry.metadata.language) {
      const langKey = `lang:${entry.metadata.language}`;
      const langSet = this.indexCache.get(langKey);
      if (langSet) {
        langSet.delete(entry.key);
        if (langSet.size === 0) {
          this.indexCache.delete(langKey);
        }
      }
    }
  }

  /**
   * Persist entry to IndexedDB
   */
  private async persistEntry(entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put(entry);
    } catch (error) {
      console.warn('Failed to persist entry to IndexedDB:', error);
    }
  }

  /**
   * Start persistence timer for periodic saves
   */
  private startPersistenceTimer(): void {
    if (!this.config.enablePersistence || this.config.persistenceInterval <= 0) {
      return;
    }

    this.persistenceTimer = setInterval(async () => {
      await this.persistToDatabase();
    }, this.config.persistenceInterval);
  }

  /**
   * Persist all memory cache entries to database
   */
  private async persistToDatabase(): Promise<void> {
    if (!this.db || this.memoryCache.size === 0) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      for (const entry of this.memoryCache.values()) {
        await store.put(entry);
      }
    } catch (error) {
      console.warn('Failed to persist cache to database:', error);
    }
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    const entries = Array.from(this.memoryCache.values());

    this.statistics.totalEntries = entries.length;
    this.statistics.totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

    const totalAccess = this.metrics.hits + this.metrics.misses;
    this.statistics.hitRate = totalAccess > 0 ? this.metrics.hits / totalAccess : 0;
    this.statistics.missRate = totalAccess > 0 ? this.metrics.misses / totalAccess : 0;
    this.statistics.evictionRate = totalAccess > 0 ? this.metrics.evictions / totalAccess : 0;
    this.statistics.averageAccessTime =
      this.metrics.accessCount > 0 ? this.metrics.totalAccessTime / this.metrics.accessCount : 0;

    if (entries.length > 0) {
      this.statistics.oldestEntry = Math.min(...entries.map((e) => e.createdAt));
      this.statistics.newestEntry = Math.max(...entries.map((e) => e.createdAt));
    }

    // Calculate distributions
    this.statistics.sizeDistribution = this.calculateSizeDistribution(entries);
    this.statistics.tagDistribution = this.calculateTagDistribution(entries);
    this.statistics.modelDistribution = this.calculateModelDistribution(entries);
  }

  /**
   * Calculate size distribution
   */
  private calculateSizeDistribution(entries: CacheEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {
      small: 0, // < 1KB
      medium: 0, // 1KB - 10KB
      large: 0, // 10KB - 100KB
      huge: 0, // > 100KB
    };

    for (const entry of entries) {
      if (entry.size < 1024) {
        distribution.small++;
      } else if (entry.size < 10240) {
        distribution.medium++;
      } else if (entry.size < 102400) {
        distribution.large++;
      } else {
        distribution.huge++;
      }
    }

    return distribution;
  }

  /**
   * Calculate tag distribution
   */
  private calculateTagDistribution(entries: CacheEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const entry of entries) {
      for (const tag of entry.tags) {
        distribution[tag] = (distribution[tag] || 0) + 1;
      }
    }

    return distribution;
  }

  /**
   * Calculate model distribution
   */
  private calculateModelDistribution(entries: CacheEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.metadata.model?.name) {
        const modelName = entry.metadata.model.name;
        distribution[modelName] = (distribution[modelName] || 0) + 1;
      }
    }

    return distribution;
  }

  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    return { ...this.statistics };
  }

  /**
   * Get cache configuration
   */
  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and dispose
   */
  public async dispose(): Promise<void> {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }

    // Persist final state
    if (this.config.enablePersistence) {
      await this.persistToDatabase();
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.memoryCache.clear();
    this.indexCache.clear();
    this.isInitialized = false;
  }
}
