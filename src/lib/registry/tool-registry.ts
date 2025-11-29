/**
 * Tool Registry
 * Central registry for managing tool discovery, registration, and lazy loading
 */

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: 'json' | 'crypto' | 'image' | 'network' | 'security' | 'text' | 'code' | 'utility';
  version: string;
  bundleSize: number;
  loadTime: number;
  dependencies: string[];
  tags: string[];
  enabled: boolean;
  priority: number;
  requiresWasm?: boolean;
  requiresWorker?: boolean;
  icon?: string;
  author?: string;
  license?: string;
  executionTimeout?: number;
  memoryLimit?: number;
  maxFileSize?: number;
  maxProcessingTime?: number;
  requiresBrowserAPI?: string | boolean | string[];
  requiresNetworkAccess?: boolean;
  supportedMethods?: string[];
  corsRestrictions?: boolean;
  externalServices?: string[];
  storageType?: string;
  browserAPIs?: string[];
  [key: string]: any;
}

export interface ToolConfig {
  component: React.ComponentType<any>;
  metadata: ToolMetadata;
  importer: () => Promise<any>;
}

export interface ToolRegistryConfig {
  enableLazyLoading: boolean;
  preloadPriority: number;
  maxConcurrentLoads: number;
  retryAttempts: number;
  cacheStrategy: 'memory' | 'localStorage' | 'none';
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolConfig>;
  private config: ToolRegistryConfig;
  private lazyLoader: any;
  private eventListeners: Map<string, Function[]>;

  private constructor(config: Partial<ToolRegistryConfig> = {}) {
    this.tools = new Map();
    this.config = {
      enableLazyLoading: true,
      preloadPriority: 1,
      maxConcurrentLoads: 3,
      retryAttempts: 3,
      cacheStrategy: 'memory',
      ...config,
    };
    this.eventListeners = new Map();

    // Initialize lazy loader
    this.initializeLazyLoader();
  }

  private initializeLazyLoader(): void {
    this.lazyLoader = this.lazyLoader || null;
  }

  public static getInstance(config?: Partial<ToolRegistryConfig>): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry(config);
    }
    return ToolRegistry.instance;
  }

  /**
   * Register a new tool
   */
  public registerTool(config: ToolConfig): void {
    const { metadata } = config;

    // Validate metadata
    this.validateToolMetadata(metadata);

    // Store tool configuration
    this.tools.set(metadata.id, config);

    // Register with lazy loader if enabled
    if (this.lazyLoader && this.config.enableLazyLoading) {
      this.lazyLoader.registerTool(metadata.id, config.importer, {
        priority: metadata.priority,
        onSuccess: (module: any, result: any) => {
          this.emit('tool:loaded', { toolId: metadata.id, module, result });
        },
        onError: (error: Error) => {
          this.emit('tool:error', { toolId: metadata.id, error });
        },
      });
    }

    // Emit registration event
    this.emit('tool:registered', { toolId: metadata.id, metadata });
  }

  /**
   * Validate tool metadata
   */
  private validateToolMetadata(metadata: ToolMetadata): void {
    const requiredFields = ['id', 'name', 'description', 'category', 'version'];

    for (const field of requiredFields) {
      if (!metadata[field as keyof ToolMetadata]) {
        throw new Error(`Tool metadata missing required field: ${field}`);
      }
    }

    // Validate bundle size constraints
    if (metadata.bundleSize > 200 * 1024) {
      // 200KB limit
      throw new Error(
        `Tool ${metadata.id} bundle size ${metadata.bundleSize} bytes exceeds 200KB limit`
      );
    }

    // Validate category
    const validCategories = [
      'json',
      'crypto',
      'image',
      'network',
      'security',
      'text',
      'code',
      'utility',
    ];
    if (!validCategories.includes(metadata.category)) {
      throw new Error(`Invalid category ${metadata.category} for tool ${metadata.id}`);
    }
  }

  /**
   * Get tool metadata
   */
  public getToolMetadata(toolId: string): ToolMetadata | null {
    const tool = this.tools.get(toolId);
    return tool ? tool.metadata : null;
  }

  /**
   * Get all tools metadata
   */
  public getAllToolsMetadata(): ToolMetadata[] {
    return Array.from(this.tools.values()).map((tool) => tool.metadata);
  }

  /**
   * Get tools by category
   */
  public getToolsByCategory(category: string): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter((tool) => tool.metadata.category === category)
      .map((tool) => tool.metadata);
  }

  /**
   * Search tools by name, description, or tags
   */
  public searchTools(query: string): ToolMetadata[] {
    const lowercaseQuery = query.toLowerCase();

    return Array.from(this.tools.values())
      .filter((tool) => {
        const { name, description, tags, id } = tool.metadata;
        return (
          name.toLowerCase().includes(lowercaseQuery) ||
          description.toLowerCase().includes(lowercaseQuery) ||
          id.toLowerCase().includes(lowercaseQuery) ||
          tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
        );
      })
      .map((tool) => tool.metadata);
  }

  /**
   * Load a tool
   */
  public async loadTool(toolId: string): Promise<any> {
    const tool = this.tools.get(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Use lazy loader if available and enabled
    if (this.lazyLoader && this.config.enableLazyLoading) {
      return this.lazyLoader.loadTool(toolId);
    }

    // Direct import
    const startTime = performance.now();
    const module = await tool.importer();
    const loadTime = performance.now() - startTime;

    this.emit('tool:loaded', { toolId, module, loadTime });
    return module;
  }

  /**
   * Preload tools based on priority
   */
  public async preloadTools(): Promise<void> {
    if (!this.lazyLoader) return;

    // Sort tools by priority (high to low)
    const tools = Array.from(this.tools.values())
      .filter((tool) => tool.metadata.enabled)
      .sort((a, b) => b.metadata.priority - a.metadata.priority);

    // Preload high priority tools
    for (const tool of tools) {
      if (tool.metadata.priority >= this.config.preloadPriority) {
        try {
          await this.lazyLoader.loadTool(tool.metadata.id);
        } catch (error) {
          console.warn(`Failed to preload tool ${tool.metadata.id}:`, error);
        }
      }
    }
  }

  /**
   * Enable or disable a tool
   */
  public setToolEnabled(toolId: string, enabled: boolean): void {
    const tool = this.tools.get(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    tool.metadata.enabled = enabled;
    this.emit('tool:updated', { toolId, enabled });
  }

  /**
   * Update tool metadata
   */
  public updateToolMetadata(toolId: string, updates: Partial<ToolMetadata>): void {
    const tool = this.tools.get(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Merge updates
    tool.metadata = { ...tool.metadata, ...updates };

    // Validate updated metadata
    this.validateToolMetadata(tool.metadata);

    this.emit('tool:updated', { toolId, metadata: tool.metadata });
  }

  /**
   * Unregister a tool
   */
  public unregisterTool(toolId: string): void {
    const tool = this.tools.get(toolId);

    if (tool) {
      // Unload from lazy loader if applicable
      if (this.lazyLoader) {
        this.lazyLoader.unloadTool(toolId);
      }

      // Remove from registry
      this.tools.delete(toolId);

      this.emit('tool:unregistered', { toolId });
    }
  }

  /**
   * Get registry statistics
   */
  public getStatistics(): {
    totalTools: number;
    enabledTools: number;
    toolsByCategory: Record<string, number>;
    totalBundleSize: number;
    averageBundleSize: number;
  } {
    const tools = Array.from(this.tools.values());
    const enabledTools = tools.filter((tool) => tool.metadata.enabled);

    const toolsByCategory = tools.reduce(
      (acc, tool) => {
        acc[tool.metadata.category] = (acc[tool.metadata.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalBundleSize = tools.reduce((sum, tool) => sum + tool.metadata.bundleSize, 0);
    const averageBundleSize = tools.length > 0 ? totalBundleSize / tools.length : 0;

    return {
      totalTools: tools.length,
      enabledTools: enabledTools.length,
      toolsByCategory,
      totalBundleSize,
      averageBundleSize,
    };
  }

  /**
   * Export tool registry configuration
   */
  public exportRegistry(): {
    tools: ToolMetadata[];
    config: ToolRegistryConfig;
    statistics: ReturnType<ToolRegistry['getStatistics']>;
  } {
    return {
      tools: this.getAllToolsMetadata(),
      config: this.config,
      statistics: this.getStatistics(),
    };
  }

  /**
   * Import tool registry configuration
   */
  public importRegistry(data: {
    tools: ToolMetadata[];
    config?: Partial<ToolRegistryConfig>;
  }): void {
    // Update config if provided
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }

    // Register tools (importers need to be provided separately)
    data.tools.forEach((metadata) => {
      // Note: This would require the actual importer functions
      // In a real implementation, you'd need a way to map tool IDs to importers
      console.warn(`Tool ${metadata.id} metadata imported, but importer not provided`);
    });
  }

  /**
   * Event handling
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.lazyLoader) {
      this.lazyLoader.dispose();
    }

    this.tools.clear();
    this.eventListeners.clear();
  }
}
