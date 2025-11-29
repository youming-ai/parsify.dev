/**
 * Tool Discovery System
 * Automatically discovers and registers tools from the codebase
 */

import type { ToolConfig, ToolMetadata } from './tool-registry';

export interface DiscoveryOptions {
  paths: string[];
  excludePatterns: string[];
  autoRegister: boolean;
  validateConstitutionalCompliance: boolean;
}

export interface DiscoveredTool {
  id: string;
  path: string;
  metadata: ToolMetadata;
  importer: () => Promise<any>;
  validationErrors: string[];
}

export class ToolDiscovery {
  private static instance: ToolDiscovery;
  private options: DiscoveryOptions;
  private toolRegistry: any;
  private discoveredTools: Map<string, DiscoveredTool>;

  private constructor(options: Partial<DiscoveryOptions> = {}) {
    this.options = {
      paths: ['/src/components/tools'],
      excludePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/node_modules/**'],
      autoRegister: true,
      validateConstitutionalCompliance: true,
      ...options,
    };
    this.discoveredTools = new Map();

    // Get tool registry instance
    import('./tool-registry').then((module) => {
      this.toolRegistry = module.ToolRegistry.getInstance();
    });
  }

  public static getInstance(options?: Partial<DiscoveryOptions>): ToolDiscovery {
    if (!ToolDiscovery.instance) {
      ToolDiscovery.instance = new ToolDiscovery(options);
    }
    return ToolDiscovery.instance;
  }

  /**
   * Discover tools from the specified paths
   */
  public async discoverTools(): Promise<DiscoveredTool[]> {
    const discoveredTools: DiscoveredTool[] = [];

    for (const path of this.options.paths) {
      const tools = await this.discoverToolsInPath(path);
      discoveredTools.push(...tools);
    }

    // Store discovered tools
    discoveredTools.forEach((tool) => {
      this.discoveredTools.set(tool.id, tool);
    });

    // Auto-register if enabled
    if (this.options.autoRegister && this.toolRegistry) {
      await this.registerDiscoveredTools(discoveredTools);
    }

    return discoveredTools;
  }

  /**
   * Discover tools in a specific path
   */
  private async discoverToolsInPath(_path: string): Promise<DiscoveredTool[]> {
    return [];
  }

  /**
   * Create discovered tool object
   */
  private async createDiscoveredTool(toolDef: {
    id: string;
    path: string;
    metadata: Partial<ToolMetadata>;
    importer: () => Promise<any>;
  }): Promise<DiscoveredTool | null> {
    try {
      // Complete metadata with defaults
      const metadata: ToolMetadata = {
        id: toolDef.id,
        name: toolDef.metadata.name || toolDef.id,
        description: toolDef.metadata.description || '',
        category: toolDef.metadata.category || 'utility',
        version: toolDef.metadata.version || '1.0.0',
        bundleSize: toolDef.metadata.bundleSize || 0,
        loadTime: toolDef.metadata.loadTime || 0,
        dependencies: toolDef.metadata.dependencies || [],
        tags: toolDef.metadata.tags || [],
        enabled: toolDef.metadata.enabled ?? true,
        priority: toolDef.metadata.priority || 1,
        requiresWasm: toolDef.metadata.requiresWasm || false,
        requiresWorker: toolDef.metadata.requiresWorker || false,
        icon: toolDef.metadata.icon,
        author: toolDef.metadata.author,
        license: toolDef.metadata.license,
      };

      // Validate tool
      const validationErrors = await this.validateTool(metadata, toolDef.importer);

      return {
        id: toolDef.id,
        path: toolDef.path,
        metadata,
        importer: toolDef.importer,
        validationErrors,
      };
    } catch (error) {
      console.error(`Error creating discovered tool ${toolDef.id}:`, error);
      return null;
    }
  }

  /**
   * Validate tool metadata and importer
   */
  private async validateTool(
    metadata: ToolMetadata,
    importer: () => Promise<any>
  ): Promise<string[]> {
    const errors: string[] = [];

    // Validate required fields
    const requiredFields = ['id', 'name', 'description', 'category', 'version'];
    for (const field of requiredFields) {
      if (!metadata[field as keyof ToolMetadata]) {
        errors.push(`Missing required field: ${field}`);
      }
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
      errors.push(`Invalid category: ${metadata.category}`);
    }

    // Validate bundle size
    if (metadata.bundleSize > 200 * 1024) {
      errors.push(`Bundle size exceeds 200KB limit: ${metadata.bundleSize} bytes`);
    }

    // Test importer (optional, in production you might skip this)
    try {
      await importer();
    } catch (error) {
      errors.push(`Importer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Constitutional compliance validation
    if (this.options.validateConstitutionalCompliance) {
      const complianceErrors = await this.validateConstitutionalCompliance(metadata);
      errors.push(...complianceErrors);
    }

    return errors;
  }

  /**
   * Validate constitutional compliance
   */
  private async validateConstitutionalCompliance(metadata: ToolMetadata): Promise<string[]> {
    const errors: string[] = [];

    // Check bundle size compliance
    if (metadata.bundleSize > 200 * 1024) {
      errors.push('Tool bundle size exceeds constitutional 200KB limit');
    }

    // Check for client-side processing (tools should not require server)
    if (metadata.dependencies.some((dep) => dep.includes('express') || dep.includes('http'))) {
      errors.push('Tool appears to require server-side processing');
    }

    // Check WASM requirements (allowed but must be validated)
    if (
      metadata.requiresWasm &&
      !metadata.dependencies.some((dep) => dep.includes('pyodide') || dep.includes('wasm'))
    ) {
      errors.push('Tool requires WASM but no WASM dependencies found');
    }

    return errors;
  }

  /**
   * Register discovered tools with the registry
   */
  private async registerDiscoveredTools(tools: DiscoveredTool[]): Promise<void> {
    for (const tool of tools) {
      if (tool.validationErrors.length > 0) {
        console.warn(`Skipping tool ${tool.id} due to validation errors:`, tool.validationErrors);
        continue;
      }

      try {
        const toolConfig: ToolConfig = {
          component: tool.importer,
          metadata: tool.metadata,
          importer: tool.importer,
        };

        this.toolRegistry.registerTool(toolConfig);
      } catch (error) {
        console.error(`Failed to register tool ${tool.id}:`, error);
      }
    }
  }

  /**
   * Get discovered tools
   */
  public getDiscoveredTools(): DiscoveredTool[] {
    return Array.from(this.discoveredTools.values());
  }

  /**
   * Get discovered tool by ID
   */
  public getDiscoveredTool(toolId: string): DiscoveredTool | null {
    return this.discoveredTools.get(toolId) || null;
  }

  /**
   * Refresh tool discovery
   */
  public async refresh(): Promise<DiscoveredTool[]> {
    this.discoveredTools.clear();
    return this.discoverTools();
  }

  /**
   * Export discovery results
   */
  public exportDiscovery(): {
    tools: DiscoveredTool[];
    options: DiscoveryOptions;
    timestamp: string;
  } {
    return {
      tools: this.getDiscoveredTools(),
      options: this.options,
      timestamp: new Date().toISOString(),
    };
  }
}
