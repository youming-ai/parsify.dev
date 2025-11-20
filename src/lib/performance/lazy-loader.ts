/**
 * Lazy Loading Infrastructure
 * Implements dynamic import management and progressive loading strategies
 */

export interface LazyLoadOptions {
  threshold?: number; // Intersection observer threshold
  rootMargin?: string; // Margin for intersection observer
  preloadDistance?: number; // Distance to preload tools
  maxConcurrentLoads?: number; // Maximum concurrent tool loads
  retryAttempts?: number; // Number of retry attempts on failure
  retryDelay?: number; // Delay between retries in ms
}

export interface LazyLoadResult<T = any> {
  module: T;
  loadTime: number;
  bundleSize: number;
  fromCache: boolean;
}

export interface LoadQueueItem {
  id: string;
  importer: () => Promise<any>;
  priority: number;
  retries: number;
  onSuccess?: (module: any, result: LazyLoadResult) => void;
  onError?: (error: Error) => void;
}

export class LazyLoader {
  private options: Required<LazyLoadOptions>;
  private loadQueue: LoadQueueItem[];
  private activeLoads: Map<string, Promise<any>>;
  private loadedModules: Map<string, any>;
  private intersectionObserver: IntersectionObserver | null;
  private loadingPromises: Map<string, Promise<LazyLoadResult>>;
  private performanceTracker: any;

  private constructor(options: LazyLoadOptions = {}) {
    this.options = {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || "50px",
      preloadDistance: options.preloadDistance || 200,
      maxConcurrentLoads: options.maxConcurrentLoads || 3,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
    };

    this.loadQueue = [];
    this.activeLoads = new Map();
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.setupIntersectionObserver();

    // Import performance tracker
    import("./bundle-analyzer").then((module) => {
      this.performanceTracker = module.BundleAnalyzer.getInstance();
    });
  }

  public static getInstance(options?: LazyLoadOptions): LazyLoader {
    if (!LazyLoader.instance) {
      LazyLoader.instance = new LazyLoader(options);
    }
    return LazyLoader.instance;
  }

  /**
   * Register a component for lazy loading
   */
  public registerTool(
    toolId: string,
    importer: () => Promise<any>,
    options: {
      priority?: number;
      onSuccess?: (module: any, result: LazyLoadResult) => void;
      onError?: (error: Error) => void;
    } = {},
  ): void {
    const queueItem: LoadQueueItem = {
      id: toolId,
      importer,
      priority: options.priority || 0,
      retries: 0,
      onSuccess: options.onSuccess,
      onError: options.onError,
    };

    this.loadQueue.push(queueItem);
    this.loadQueue.sort((a, b) => b.priority - a.priority); // Sort by priority (high to low)
  }

  /**
   * Load a tool immediately
   */
  public async loadTool<T = any>(toolId: string): Promise<LazyLoadResult<T>> {
    // Check if already loaded
    if (this.loadedModules.has(toolId)) {
      return {
        module: this.loadedModules.get(toolId),
        loadTime: 0,
        bundleSize: 0,
        fromCache: true,
      };
    }

    // Check if currently loading
    if (this.loadingPromises.has(toolId)) {
      return this.loadingPromises.get(toolId) as Promise<LazyLoadResult<T>>;
    }

    const queueItem = this.loadQueue.find((item) => item.id === toolId);
    if (!queueItem) {
      throw new Error(`Tool ${toolId} not registered for lazy loading`);
    }

    // Check concurrent load limit
    if (this.activeLoads.size >= this.options.maxConcurrentLoads) {
      // Wait for an active load to complete
      await Promise.race(Array.from(this.activeLoads.values()));
    }

    // Start loading
    const loadPromise = this.executeLoad<T>(queueItem);
    this.loadingPromises.set(toolId, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } catch (error) {
      this.loadingPromises.delete(toolId);
      throw error;
    }
  }

  /**
   * Execute the actual module loading
   */
  private async executeLoad<T = any>(queueItem: LoadQueueItem): Promise<LazyLoadResult<T>> {
    const startTime = performance.now();
    let bundleSize = 0;

    try {
      // Track bundle size if possible
      const importerWithTracking = async () => {
        const response = await fetch(`/api/tools/${queueItem.id}/bundle-size`);
        if (response.ok) {
          bundleSize = await response.json();
        }
        return queueItem.importer();
      };

      // Execute the import
      const activeLoad = importerWithTracking();
      this.activeLoads.set(queueItem.id, activeLoad);

      const module = await activeLoad;
      const loadTime = performance.now() - startTime;

      // Cache the module
      this.loadedModules.set(queueItem.id, module);

      // Track performance
      if (this.performanceTracker) {
        this.performanceTracker.trackToolBundleSize(queueItem.id, bundleSize);
        this.performanceTracker.trackToolLoadTime(queueItem.id, loadTime);
      }

      const result: LazyLoadResult<T> = {
        module,
        loadTime,
        bundleSize,
        fromCache: false,
      };

      // Remove from active loads
      this.activeLoads.delete(queueItem.id);

      // Call success callback
      if (queueItem.onSuccess) {
        queueItem.onSuccess(module, result);
      }

      return result;
    } catch (error) {
      // Remove from active loads
      this.activeLoads.delete(queueItem.id);

      // Handle retry logic
      if (queueItem.retries < this.options.retryAttempts) {
        queueItem.retries++;

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, this.options.retryDelay));

        // Retry the load
        return this.executeLoad<T>(queueItem);
      }

      // Call error callback
      if (queueItem.onError) {
        queueItem.onError(error as Error);
      }

      throw error;
    }
  }

  /**
   * Preload tools within specified distance of viewport
   */
  public preloadNearbyTools(): void {
    if (!this.intersectionObserver) return;

    const elements = document.querySelectorAll("[data-tool-id]");
    elements.forEach((element) => {
      const toolId = element.getAttribute("data-tool-id");
      if (toolId && this.loadQueue.find((item) => item.id === toolId)) {
        // Add to observation with larger root margin for preloading
        this.intersectionObserver.observe(element);
      }
    });
  }

  /**
   * Setup viewport intersection for an element
   */
  public observeElement(element: HTMLElement, toolId: string): void {
    element.setAttribute("data-tool-id", toolId);

    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Stop observing an element
   */
  public unobserveElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserveElement(element);
    }
  }

  /**
   * Get loading status
   */
  public getLoadStatus(): {
    queued: number;
    loading: number;
    loaded: number;
    total: number;
  } {
    return {
      queued: this.loadQueue.length,
      loading: this.activeLoads.size,
      loaded: this.loadedModules.size,
      total: this.loadQueue.length + this.loadedModules.size,
    };
  }

  /**
   * Get cached modules
   */
  public getCachedModules(): Map<string, any> {
    return new Map(this.loadedModules);
  }

  /**
   * Clear cache for a specific tool or all tools
   */
  public clearCache(toolId?: string): void {
    if (toolId) {
      this.loadedModules.delete(toolId);
      this.loadingPromises.delete(toolId);
    } else {
      this.loadedModules.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * Unload and cleanup a tool
   */
  public unloadTool(toolId: string): void {
    this.loadedModules.delete(toolId);
    this.loadingPromises.delete(toolId);

    // Remove from queue
    const queueIndex = this.loadQueue.findIndex((item) => item.id === toolId);
    if (queueIndex !== -1) {
      this.loadQueue.splice(queueIndex, 1);
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.loadQueue = [];
    this.activeLoads.clear();
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }
}
