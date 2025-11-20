/**
 * Lazy Loading Infrastructure for NLP Toolkit
 * Provides dynamic loading and unloading of ML models and tool bundles
 */

import { ModelStatus, NLPResult, TaskStatus, NLPEvent } from "../types";

export interface LoadableItem {
  id: string;
  type: "model" | "tool" | "bundle";
  name: string;
  description: string;
  version: string;
  size: number;
  dependencies: string[];
  loadPriority: LoadPriority;
  lazy: boolean;
  persistent: boolean;
  timeout: number;
  retryAttempts: number;
  status: LoadingStatus;
  loadedAt?: Date;
  lastAccessed?: Date;
  accessCount: number;
  loadTime?: number;
  error?: Error;
}

export type LoadingStatus = "unloaded" | "loading" | "loaded" | "error" | "unloading";

export type LoadPriority = "critical" | "high" | "medium" | "low" | "background";

export interface LoadOptions {
  timeout?: number;
  priority?: LoadPriority;
  force?: boolean;
  dependencies?: boolean;
  progress?: (progress: number) => void;
}

export interface LoadResult {
  success: boolean;
  item: LoadableItem;
  loadTime: number;
  error?: Error;
  dependencies?: LoadResult[];
}

export interface LoadingQueue {
  pending: LoadableItem[];
  loading: Map<string, LoadableItem>;
  completed: LoadableItem[];
  failed: LoadableItem[];
}

export interface LoadingStats {
  totalItems: number;
  loadedItems: number;
  loadingItems: number;
  failedItems: number;
  totalSize: number;
  loadedSize: number;
  averageLoadTime: number;
  successRate: number;
  memoryUsage: number;
}

export interface PreloadStrategy {
  type: "eager" | "predictive" | "usage_based" | "priority_based";
  conditions: PreloadCondition[];
  maxConcurrent: number;
  memoryThreshold: number;
}

export interface PreloadCondition {
  type: "time" | "usage" | "priority" | "dependency" | "custom";
  value: any;
  comparator: "equals" | "greater_than" | "less_than" | "contains" | "custom";
  action: "load" | "unload" | "priority";
}

export class LazyLoader {
  private items: Map<string, LoadableItem> = new Map();
  private loadingQueue: LoadingQueue;
  private loadingPromises: Map<string, Promise<LoadResult>> = new Map();
  private preloadStrategies: PreloadStrategy[] = [];
  private config: LazyLoaderConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private isLoading: boolean = false;
  private loadingTimer?: NodeJS.Timeout;

  constructor(config: Partial<LazyLoaderConfig> = {}) {
    this.config = {
      maxConcurrentLoads: 3,
      defaultTimeout: 30000,
      maxRetries: 3,
      memoryThreshold: 0.8,
      enablePreloading: true,
      enableUnloading: true,
      cacheStrategy: "lru",
      maxCacheSize: 100,
      ...config,
    };

    this.loadingQueue = {
      pending: [],
      loading: new Map(),
      completed: [],
      failed: [],
    };

    this.setupDefaultPreloadStrategies();
  }

  /**
   * Register a loadable item
   */
  registerItem(item: Omit<LoadableItem, "status" | "accessCount">): void {
    const loadableItem: LoadableItem = {
      ...item,
      status: "unloaded",
      accessCount: 0,
    };

    this.items.set(item.id, loadableItem);

    this.emitEvent("item_registered", { item: loadableItem });
  }

  /**
   * Load an item
   */
  async load(id: string, options: LoadOptions = {}): Promise<LoadResult> {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Item ${id} not found`);
    }

    // Return cached result if already loaded
    if (item.status === "loaded" && !options.force) {
      item.lastAccessed = new Date();
      item.accessCount++;
      return {
        success: true,
        item,
        loadTime: 0,
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    // Create loading promise
    const promise = this.loadItem(item, options);
    this.loadingPromises.set(id, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.loadingPromises.delete(id);
    }
  }

  /**
   * Load multiple items
   */
  async loadMultiple(ids: string[], options: LoadOptions = {}): Promise<LoadResult[]> {
    const results: LoadResult[] = [];

    // Sort by priority if specified
    const sortedIds = options.priority ? this.sortByPriority(ids, options.priority) : ids;

    // Load concurrently with limit
    for (let i = 0; i < sortedIds.length; i += this.config.maxConcurrentLoads) {
      const batch = sortedIds.slice(i, i + this.config.maxConcurrentLoads);
      const batchPromises = batch.map((id) => this.load(id, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Preload items based on strategies
   */
  async preload(strategies?: PreloadStrategy[]): Promise<void> {
    const strategiesToUse = strategies || this.preloadStrategies;

    for (const strategy of strategiesToUse) {
      await this.executePreloadStrategy(strategy);
    }
  }

  /**
   * Unload an item
   */
  async unload(id: string, force: boolean = false): Promise<boolean> {
    const item = this.items.get(id);
    if (!item) {
      return false;
    }

    // Don't unload persistent items unless forced
    if (item.persistent && !force) {
      return false;
    }

    // Don't unload if currently in use
    if (item.status === "loading") {
      return false;
    }

    try {
      this.emitEvent("item_unloading", { item });

      item.status = "unloading";

      // Perform actual unloading (implementation-specific)
      await this.performUnload(item);

      item.status = "unloaded";
      item.loadedAt = undefined;

      this.emitEvent("item_unloaded", { item });

      return true;
    } catch (error) {
      console.warn(`Failed to unload item ${id}:`, error);
      item.status = "loaded";
      return false;
    }
  }

  /**
   * Get item status
   */
  getItemStatus(id: string): LoadingStatus | null {
    const item = this.items.get(id);
    return item ? item.status : null;
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): LoadingStats {
    const items = Array.from(this.items.values());

    return {
      totalItems: items.length,
      loadedItems: items.filter((item) => item.status === "loaded").length,
      loadingItems: items.filter((item) => item.status === "loading").length,
      failedItems: items.filter((item) => item.status === "error").length,
      totalSize: items.reduce((sum, item) => sum + item.size, 0),
      loadedSize: items
        .filter((item) => item.status === "loaded")
        .reduce((sum, item) => sum + item.size, 0),
      averageLoadTime: this.calculateAverageLoadTime(),
      successRate: this.calculateSuccessRate(),
      memoryUsage: this.calculateMemoryUsage(),
    };
  }

  /**
   * Get items by type and status
   */
  getItems(type?: "model" | "tool" | "bundle", status?: LoadingStatus): LoadableItem[] {
    return Array.from(this.items.values()).filter((item) => {
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    });
  }

  /**
   * Set item priority
   */
  setPriority(id: string, priority: LoadPriority): void {
    const item = this.items.get(id);
    if (item) {
      item.loadPriority = priority;
      this.emitEvent("item_priority_changed", { item, priority });
    }
  }

  /**
   * Enable/disable lazy loading for an item
   */
  setLazy(id: string, lazy: boolean): void {
    const item = this.items.get(id);
    if (item) {
      item.lazy = lazy;
      this.emitEvent("item_lazy_changed", { item, lazy });
    }
  }

  /**
   * Check if item is loaded
   */
  isLoaded(id: string): boolean {
    const item = this.items.get(id);
    return item ? item.status === "loaded" : false;
  }

  /**
   * Access an item (updates access statistics)
   */
  access(id: string): any {
    const item = this.items.get(id);
    if (item && item.status === "loaded") {
      item.lastAccessed = new Date();
      item.accessCount++;
      return this.getItemData(item);
    }
    return null;
  }

  /**
   * Cleanup unused items
   */
  async cleanup(maxAge?: number): Promise<number> {
    const now = Date.now();
    const maxAgeMs = maxAge || 5 * 60 * 1000; // 5 minutes default
    let cleaned = 0;

    for (const [id, item] of this.items.entries()) {
      if (
        item.status === "loaded" &&
        !item.persistent &&
        (!item.lastAccessed || now - item.lastAccessed.getTime() > maxAgeMs)
      ) {
        if (await this.unload(id)) {
          cleaned++;
        }
      }
    }

    this.emitEvent("cleanup_completed", { itemsCleaned: cleaned });
    return cleaned;
  }

  /**
   * Export configuration
   */
  exportConfig(): LazyLoaderConfig {
    return { ...this.config };
  }

  /**
   * Event handling
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Private helper methods
   */
  private async loadItem(item: LoadableItem, options: LoadOptions): Promise<LoadResult> {
    const startTime = performance.now();
    const timeout = options.timeout || item.timeout || this.config.defaultTimeout;

    try {
      this.emitEvent("item_loading", { item });

      item.status = "loading";
      item.error = undefined;

      // Load dependencies first if required
      let dependencies: LoadResult[] = [];
      if (options.dependencies !== false && item.dependencies.length > 0) {
        dependencies = await this.loadMultiple(item.dependencies, options);
      }

      // Perform the actual loading
      await this.performLoad(item, options);

      const loadTime = performance.now() - startTime;

      item.status = "loaded";
      item.loadedAt = new Date();
      item.lastAccessed = new Date();
      item.accessCount = 1;
      item.loadTime = loadTime;

      this.emitEvent("item_loaded", { item, loadTime });

      return {
        success: true,
        item,
        loadTime,
        dependencies,
      };
    } catch (error) {
      const loadTime = performance.now() - startTime;

      item.status = "error";
      item.error = error as Error;

      this.emitEvent("item_load_failed", { item, error, loadTime });

      return {
        success: false,
        item,
        loadTime,
        error: error as Error,
      };
    }
  }

  private async performLoad(item: LoadableItem, options: LoadOptions): Promise<void> {
    switch (item.type) {
      case "model":
        return this.loadModel(item, options);
      case "tool":
        return this.loadTool(item, options);
      case "bundle":
        return this.loadBundle(item, options);
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }
  }

  private async performUnload(item: LoadableItem): Promise<void> {
    switch (item.type) {
      case "model":
        return this.unloadModel(item);
      case "tool":
        return this.unloadTool(item);
      case "bundle":
        return this.unloadBundle(item);
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }
  }

  private async loadModel(item: LoadableItem, options: LoadOptions): Promise<void> {
    // Implementation for loading ML models
    // This would integrate with TensorFlow.js or other ML frameworks
  }

  private async loadTool(item: LoadableItem, options: LoadOptions): Promise<void> {
    // Implementation for loading NLP tools
    // This would dynamically import and initialize tool components
  }

  private async loadBundle(item: LoadableItem, options: LoadOptions): Promise<void> {
    // Implementation for loading code bundles
    // This would use dynamic imports for JavaScript modules
  }

  private async unloadModel(item: LoadableItem): Promise<void> {
    // Implementation for unloading ML models
  }

  private async unloadTool(item: LoadableItem): Promise<void> {
    // Implementation for unloading tools
  }

  private async unloadBundle(item: LoadableItem): Promise<void> {
    // Implementation for unloading bundles
  }

  private getItemData(item: LoadableItem): any {
    // Return the actual loaded data for the item
    // This depends on the specific implementation
    return null;
  }

  private sortByPriority(ids: string[], priority: LoadPriority): string[] {
    return ids.sort((a, b) => {
      const itemA = this.items.get(a);
      const itemB = this.items.get(b);

      if (!itemA || !itemB) return 0;

      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, background: 4 };
      return priorityOrder[itemA.loadPriority] - priorityOrder[itemB.loadPriority];
    });
  }

  private setupDefaultPreloadStrategies(): void {
    // Predictive preloading based on usage patterns
    this.preloadStrategies.push({
      type: "usage_based",
      conditions: [
        {
          type: "usage",
          value: 5,
          comparator: "greater_than",
          action: "load",
        },
      ],
      maxConcurrent: 2,
      memoryThreshold: 0.7,
    });

    // Priority-based preloading
    this.preloadStrategies.push({
      type: "priority_based",
      conditions: [
        {
          type: "priority",
          value: "critical",
          comparator: "equals",
          action: "load",
        },
      ],
      maxConcurrent: 3,
      memoryThreshold: 0.8,
    });
  }

  private async executePreloadStrategy(strategy: PreloadStrategy): Promise<void> {
    // Check memory threshold
    if (this.calculateMemoryUsage() > strategy.memoryThreshold) {
      return;
    }

    // Find items matching strategy conditions
    const matchingItems = this.findMatchingItems(strategy.conditions);

    // Sort by priority and limit concurrent loads
    const sortedItems = matchingItems
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, background: 4 };
        return priorityOrder[a.loadPriority] - priorityOrder[b.loadPriority];
      })
      .slice(0, strategy.maxConcurrent);

    // Load items
    await this.loadMultiple(
      sortedItems.map((item) => item.id),
      { priority: "medium" },
    );
  }

  private findMatchingItems(conditions: PreloadCondition[]): LoadableItem[] {
    return Array.from(this.items.values()).filter((item) => {
      return conditions.every((condition) => {
        switch (condition.type) {
          case "priority":
            return this.evaluateCondition(item.loadPriority, condition.value, condition.comparator);
          case "usage":
            return this.evaluateCondition(item.accessCount, condition.value, condition.comparator);
          default:
            return true;
        }
      });
    });
  }

  private evaluateCondition(actual: any, expected: any, comparator: string): boolean {
    switch (comparator) {
      case "equals":
        return actual === expected;
      case "greater_than":
        return actual > expected;
      case "less_than":
        return actual < expected;
      case "contains":
        return Array.isArray(actual)
          ? actual.includes(expected)
          : String(actual).includes(expected);
      default:
        return false;
    }
  }

  private calculateAverageLoadTime(): number {
    const loadedItems = Array.from(this.items.values()).filter(
      (item) => item.loadTime !== undefined,
    );
    if (loadedItems.length === 0) return 0;

    const totalTime = loadedItems.reduce((sum, item) => sum + (item.loadTime || 0), 0);
    return totalTime / loadedItems.length;
  }

  private calculateSuccessRate(): number {
    const items = Array.from(this.items.values());
    if (items.length === 0) return 1;

    const successful = items.filter((item) => item.status === "loaded").length;
    return successful / items.length;
  }

  private calculateMemoryUsage(): number {
    const loadedItems = this.items.values().filter((item) => item.status === "loaded");
    return Array.from(loadedItems).reduce((sum, item) => sum + item.size, 0);
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener({
          type: event as any,
          timestamp: new Date(),
          data,
        });
      } catch (error) {
        console.error(`Error in lazy loader event listener for ${event}:`, error);
      }
    });
  }
}

// Configuration interface
export interface LazyLoaderConfig {
  maxConcurrentLoads: number;
  defaultTimeout: number;
  maxRetries: number;
  memoryThreshold: number;
  enablePreloading: boolean;
  enableUnloading: boolean;
  cacheStrategy: string;
  maxCacheSize: number;
}

// Singleton instance
export const lazyLoader = new LazyLoader();
