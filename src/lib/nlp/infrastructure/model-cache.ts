/**
 * ML Model Cache System
 * Provides IndexedDB-based caching for TensorFlow.js and transformers.js models
 */

export interface ModelCacheEntry {
  id: string;
  url: string;
  data: ArrayBuffer;
  size: number;
  version: string;
  lastAccessed: number;
  downloadDate: number;
  accessCount: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of cached models
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export class ModelCache {
  private dbName = 'nlp-model-cache';
  private storeName = 'models';
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB default
      maxEntries: 50,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days default
      cleanupInterval: 60 * 60 * 1000, // 1 hour default
      ...config,
    };

    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.db = await this.openDatabase();
      this.startCleanupTimer();
    } catch (error) {
      console.warn('Failed to initialize model cache:', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });

          // Create indexes for efficient querying
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('downloadDate', 'downloadDate', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * Store a model in cache
   */
  async set(id: string, url: string, data: ArrayBuffer, version = '1.0.0'): Promise<void> {
    if (!this.db) return;

    const entry: ModelCacheEntry = {
      id,
      url,
      data,
      size: data.byteLength,
      version,
      lastAccessed: Date.now(),
      downloadDate: Date.now(),
      accessCount: 1,
    };

    try {
      // Check if we need to make space
      await this.ensureSpace(entry.size);

      // Store the model
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.put(entry);

      console.log(`Model cached: ${id} (${this.formatBytes(entry.size)})`);
    } catch (error) {
      console.warn(`Failed to cache model ${id}:`, error);
    }
  }

  /**
   * Retrieve a model from cache
   */
  async get(id: string): Promise<ArrayBuffer | null> {
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      const entry = await new Promise<ModelCacheEntry | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!entry) return null;

      // Check TTL
      if (Date.now() - entry.downloadDate > this.config.ttl) {
        await this.delete(id);
        return null;
      }

      // Update access metadata
      entry.lastAccessed = Date.now();
      entry.accessCount += 1;
      await store.put(entry);

      console.log(`Model retrieved from cache: ${id}`);
      return entry.data;
    } catch (error) {
      console.warn(`Failed to retrieve model ${id}:`, error);
      return null;
    }
  }

  /**
   * Check if a model exists in cache
   */
  async has(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      const entry = await new Promise<ModelCacheEntry | undefined>((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(undefined);
      });

      if (!entry) return false;

      // Check TTL
      return Date.now() - entry.downloadDate <= this.config.ttl;
    } catch (error) {
      console.warn(`Failed to check model ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete a model from cache
   */
  async delete(id: string): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.delete(id);

      console.log(`Model deleted from cache: ${id}`);
    } catch (error) {
      console.warn(`Failed to delete model ${id}:`, error);
    }
  }

  /**
   * Clear all cached models
   */
  async clear(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.clear();

      console.log('Model cache cleared');
    } catch (error) {
      console.warn('Failed to clear model cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    if (!this.db) {
      return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const entries = await this.getAllEntries(store);

      const totalEntries = entries.length;
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

      const timestamps = entries.map((entry) => entry.downloadDate);
      const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : null;
      const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : null;

      return { totalEntries, totalSize, oldestEntry, newestEntry };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
    }
  }

  /**
   * Ensure enough space for a new model
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const stats = await this.getStats();

    // Check if we need to free up space
    if (
      stats.totalSize + requiredSize > this.config.maxSize ||
      stats.totalEntries >= this.config.maxEntries
    ) {
      await this.cleanup();
    }
  }

  /**
   * Clean up old and expired models
   */
  private async cleanup(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const entries = await this.getAllEntries(store);
      const now = Date.now();

      // Remove expired entries
      const expired = entries.filter((entry) => now - entry.downloadDate > this.config.ttl);

      for (const entry of expired) {
        await store.delete(entry.id);
      }

      // If we still need space, remove least recently used entries
      const remaining = entries.filter((entry) => now - entry.downloadDate <= this.config.ttl);

      if (remaining.length > this.config.maxEntries) {
        // Sort by last accessed time
        remaining.sort((a, b) => a.lastAccessed - b.lastAccessed);

        // Remove oldest entries
        const toRemove = remaining.slice(0, remaining.length - this.config.maxEntries);
        for (const entry of toRemove) {
          await store.delete(entry.id);
        }
      }

      console.log(
        `Model cache cleanup completed. Removed ${expired.length + (remaining.length > this.config.maxEntries ? remaining.length - this.config.maxEntries : 0)} entries.`
      );
    } catch (error) {
      console.warn('Failed to cleanup model cache:', error);
    }
  }

  /**
   * Get all entries from the store
   */
  private async getAllEntries(store: IDBObjectStore): Promise<ModelCacheEntry[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Destroy the cache and close database connection
   */
  async destroy(): Promise<void> {
    this.stopCleanupTimer();

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    try {
      await indexedDB.deleteDatabase(this.dbName);
      console.log('Model cache destroyed');
    } catch (error) {
      console.warn('Failed to destroy model cache:', error);
    }
  }
}

// Singleton instance
export const modelCache = new ModelCache();
