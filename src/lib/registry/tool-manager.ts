/**
 * Tool Manager
 * High-level interface for managing tools, registration, and lifecycle
 */

import { type DiscoveredTool, ToolDiscovery } from "./tool-discovery";
import { type ToolConfig, type ToolMetadata, ToolRegistry } from "./tool-registry";

export interface ToolManagerConfig {
  autoDiscover: boolean;
  autoRegister: boolean;
  preloadHighPriority: boolean;
  enablePerformanceMonitoring: boolean;
  constitutionalCompliance: boolean;
}

export interface ToolLifecycleEvent {
  type: "register" | "unregister" | "load" | "unload" | "enable" | "disable" | "error";
  toolId: string;
  timestamp: number;
  data?: any;
}

export class ToolManager {
  private toolRegistry: ToolRegistry;
  private toolDiscovery: ToolDiscovery;
  private config: ToolManagerConfig;
  private eventListeners: Map<string, Function[]>;
  private lifecycleEvents: ToolLifecycleEvent[];

  private constructor(config: Partial<ToolManagerConfig> = {}) {
    this.config = {
      autoDiscover: true,
      autoRegister: true,
      preloadHighPriority: true,
      enablePerformanceMonitoring: true,
      constitutionalCompliance: true,
      ...config,
    };

    this.toolRegistry = ToolRegistry.getInstance();
    this.toolDiscovery = ToolDiscovery.getInstance({
      autoRegister: this.config.autoRegister,
      validateConstitutionalCompliance: this.config.constitutionalCompliance,
    });

    this.eventListeners = new Map();
    this.lifecycleEvents = [];

    this.setupEventListeners();
  }

  public static getInstance(config?: Partial<ToolManagerConfig>): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager(config);
    }
    return ToolManager.instance;
  }

  /**
   * Initialize the tool manager
   */
  public async initialize(): Promise<void> {
    try {
      // Discover tools if enabled
      if (this.config.autoDiscover) {
        await this.toolDiscovery.discoverTools();
      }

      // Preload high priority tools if enabled
      if (this.config.preloadHighPriority) {
        await this.toolRegistry.preloadTools();
      }

      console.log("Tool Manager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Tool Manager:", error);
      throw error;
    }
  }

  /**
   * Register a new tool manually
   */
  public registerTool(config: ToolConfig): void {
    try {
      this.toolRegistry.registerTool(config);
    } catch (error) {
      console.error(`Failed to register tool ${config.metadata.id}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a tool
   */
  public unregisterTool(toolId: string): void {
    try {
      this.toolRegistry.unregisterTool(toolId);
    } catch (error) {
      console.error(`Failed to unregister tool ${toolId}:`, error);
      throw error;
    }
  }

  /**
   * Load a tool
   */
  public async loadTool(toolId: string): Promise<any> {
    try {
      return await this.toolRegistry.loadTool(toolId);
    } catch (error) {
      console.error(`Failed to load tool ${toolId}:`, error);
      throw error;
    }
  }

  /**
   * Get tool metadata
   */
  public getTool(toolId: string): ToolMetadata | null {
    return this.toolRegistry.getToolMetadata(toolId);
  }

  /**
   * Get all tools
   */
  public getAllTools(): ToolMetadata[] {
    return this.toolRegistry.getAllToolsMetadata();
  }

  /**
   * Get tools by category
   */
  public getToolsByCategory(category: string): ToolMetadata[] {
    return this.toolRegistry.getToolsByCategory(category);
  }

  /**
   * Search tools
   */
  public searchTools(query: string): ToolMetadata[] {
    return this.toolRegistry.searchTools(query);
  }

  /**
   * Enable or disable a tool
   */
  public setToolEnabled(toolId: string, enabled: boolean): void {
    this.toolRegistry.setToolEnabled(toolId, enabled);
  }

  /**
   * Update tool metadata
   */
  public updateTool(toolId: string, updates: Partial<ToolMetadata>): void {
    this.toolRegistry.updateToolMetadata(toolId, updates);
  }

  /**
   * Get discovered tools (including those not registered)
   */
  public getDiscoveredTools(): DiscoveredTool[] {
    return this.toolDiscovery.getDiscoveredTools();
  }

  /**
   * Refresh tool discovery
   */
  public async refreshDiscovery(): Promise<DiscoveredTool[]> {
    return await this.toolDiscovery.refresh();
  }

  /**
   * Get tool categories
   */
  public getCategories(): string[] {
    const tools = this.getAllTools();
    const categories = new Set(tools.map((tool) => tool.category));
    return Array.from(categories).sort();
  }

  /**
   * Get tool tags
   */
  public getTags(): string[] {
    const tools = this.getAllTools();
    const tags = new Set(tools.flatMap((tool) => tool.tags));
    return Array.from(tags).sort();
  }

  /**
   * Get tools that require WASM
   */
  public getWasmTools(): ToolMetadata[] {
    return this.getAllTools().filter((tool) => tool.requiresWasm);
  }

  /**
   * Get tools by priority
   */
  public getToolsByPriority(minPriority: number = 0): ToolMetadata[] {
    return this.getAllTools()
      .filter((tool) => tool.priority >= minPriority)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get system statistics
   */
  public getStatistics(): {
    tools: ReturnType<typeof this.toolRegistry.getStatistics>;
    categories: { name: string; count: number }[];
    bundleSize: {
      total: number;
      average: number;
      largest: ToolMetadata | null;
    };
    performance: {
      averageLoadTime: number;
      slowestLoad: ToolMetadata | null;
    };
    compliance: {
      constitutionalCompliant: number;
      totalSizeCompliant: number;
      issues: string[];
    };
  } {
    const tools = this.getAllTools();
    const _enabledTools = tools.filter((tool) => tool.enabled);

    // Category statistics
    const categoryMap = new Map<string, number>();
    tools.forEach((tool) => {
      categoryMap.set(tool.category, (categoryMap.get(tool.category) || 0) + 1);
    });
    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Bundle size statistics
    const totalBundleSize = tools.reduce((sum, tool) => sum + tool.bundleSize, 0);
    const averageBundleSize = tools.length > 0 ? totalBundleSize / tools.length : 0;
    const largest = tools.reduce(
      (prev, current) => (current.bundleSize > (prev?.bundleSize || 0) ? current : prev),
      null,
    );

    // Performance statistics
    const averageLoadTime = tools.reduce((sum, tool) => sum + tool.loadTime, 0) / tools.length;
    const slowestLoad = tools.reduce(
      (prev, current) => (current.loadTime > (prev?.loadTime || 0) ? current : prev),
      null,
    );

    // Compliance statistics
    const constitutionalCompliant = tools.filter(
      (tool) => tool.bundleSize <= 200 * 1024 && tool.enabled,
    ).length;
    const totalSizeCompliant = totalBundleSize <= 2 * 1024 * 1024 ? 1 : 0;

    const issues: string[] = [];
    if (totalBundleSize > 2 * 1024 * 1024) {
      issues.push(`Total bundle size exceeds 2MB: ${this.formatBytes(totalBundleSize)}`);
    }
    tools.forEach((tool) => {
      if (tool.bundleSize > 200 * 1024) {
        issues.push(`Tool ${tool.id} exceeds 200KB: ${this.formatBytes(tool.bundleSize)}`);
      }
    });

    return {
      tools: this.toolRegistry.getStatistics(),
      categories,
      bundleSize: {
        total: totalBundleSize,
        average: averageBundleSize,
        largest,
      },
      performance: {
        averageLoadTime,
        slowestLoad,
      },
      compliance: {
        constitutionalCompliant,
        totalSizeCompliant,
        issues,
      },
    };
  }

  /**
   * Export tool registry
   */
  public exportRegistry(): {
    tools: ToolMetadata[];
    discoveredTools: DiscoveredTool[];
    config: ToolManagerConfig;
    statistics: ReturnType<typeof this.getStatistics>;
    lifecycleEvents: ToolLifecycleEvent[];
  } {
    return {
      tools: this.getAllTools(),
      discoveredTools: this.getDiscoveredTools(),
      config: this.config,
      statistics: this.getStatistics(),
      lifecycleEvents: this.lifecycleEvents,
    };
  }

  /**
   * Generate system report
   */
  public generateReport(): string {
    const stats = this.getStatistics();
    const lifecycleEvents = this.lifecycleEvents.slice(-10); // Last 10 events

    const report = [
      "# Tool Manager System Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## System Overview",
      `- **Total Tools**: ${stats.tools.totalTools}`,
      `- **Enabled Tools**: ${stats.tools.enabledTools}`,
      `- **Categories**: ${stats.categories.length}`,
      `- **Total Bundle Size**: ${this.formatBytes(stats.bundleSize.total)}`,
      "",
      "## Categories",
      ...stats.categories.map((cat) => `- **${cat.name}**: ${cat.count} tools`),
      "",
      "## Bundle Size Analysis",
      `- **Total**: ${this.formatBytes(stats.bundleSize.total)}`,
      `- **Average**: ${this.formatBytes(stats.bundleSize.average)}`,
      `- **Largest**: ${stats.bundleSize.largest ? `${stats.bundleSize.largest.name} (${this.formatBytes(stats.bundleSize.largest.bundleSize)})` : "N/A"}`,
      "",
      "## Performance",
      `- **Average Load Time**: ${Math.round(stats.performance.averageLoadTime)}ms`,
      `- **Slowest Loading**: ${stats.performance.slowestLoad ? `${stats.performance.slowestLoad.name} (${stats.performance.slowestLoad.loadTime}ms)` : "N/A"}`,
      "",
      "## Constitutional Compliance",
      `- **Compliant Tools**: ${stats.compliance.constitutionalCompliant}/${stats.tools.totalTools}`,
      `- **Total Size Compliant**: ${stats.compliance.totalSizeCompliant ? "✅" : "❌"}`,
      "",
      "### Compliance Issues",
      stats.compliance.issues.length > 0
        ? stats.compliance.issues.map((issue) => `- ${issue}`).join("\n")
        : "No compliance issues detected",
      "",
      "## Recent Activity",
      ...lifecycleEvents.map(
        (event) =>
          `- ${new Date(event.timestamp).toLocaleTimeString()}: ${event.type} - ${event.toolId}`,
      ),
      "",
      "## Configuration",
      `- **Auto Discover**: ${this.config.autoDiscover ? "✅" : "❌"}`,
      `- **Auto Register**: ${this.config.autoRegister ? "✅" : "❌"}`,
      `- **Preload High Priority**: ${this.config.preloadHighPriority ? "✅" : "❌"}`,
      `- **Performance Monitoring**: ${this.config.enablePerformanceMonitoring ? "✅" : "❌"}`,
      `- **Constitutional Compliance**: ${this.config.constitutionalCompliance ? "✅" : "❌"}`,
    ];

    return report.join("\n");
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

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.toolRegistry.dispose();
    this.eventListeners.clear();
    this.lifecycleEvents = [];
  }
}
