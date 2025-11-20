/**
 * JSON Tools Registry
 * Central registry for all JSON tools with lazy loading configuration
 */

import { ToolRegistry, type ToolMetadata, type ToolConfig } from "@/lib/registry/tool-registry";

// JSON Tool Imports (lazy-loaded)
const importJSONFormatter = () =>
  import("@/components/tools/json/json-formatter").then((mod) => mod.JSONFormatter);
const importJSONValidator = () =>
  import("@/components/tools/json/json-validator").then((mod) => mod.JSONValidator);
const importJSONConverter = () =>
  import("@/components/tools/json/json-converter").then((mod) => mod.JSONConverter);
const importJSONViewer = () =>
  import("@/components/tools/json/json-viewer").then((mod) => mod.JSONViewer);
const importJSONCleanup = () =>
  import("@/components/tools/json/json-cleanup").then((mod) => mod.JSONCleanup);
const importJSON5Parser = () =>
  import("@/components/tools/json/json5-parser").then((mod) => mod.JSON5Parser);
const importJSONAdvancedEditor = () =>
  import("@/components/tools/json/json-advanced-editor").then((mod) => mod.JSONAdvancedEditor);
const importJSONHeroViewer = () =>
  import("@/components/tools/json/json-hero-viewer").then((mod) => mod.JSONHeroViewer);
const importJSONSchemaGenerator = () =>
  import("@/components/tools/json/json-schema-generator").then((mod) => mod.JSONSchemaGenerator);
const importJSONSQLConverter = () =>
  import("@/components/tools/json/json-sql-converter").then((mod) => mod.JSONSQLConverter);

// JSON Tool Library Imports
const importJSONValidationService = () =>
  import("@/lib/json/json-validator").then((mod) => mod.JSONValidator);
const importJSONCodeGenerator = () =>
  import("@/lib/json/codegen-utils").then((mod) => mod.CodeGenerator);

/**
 * JSON Tools Metadata Configuration
 * Comprehensive metadata for all JSON tools following constitutional constraints
 */
const JSON_TOOLS_METADATA: ToolMetadata[] = [
  // Core JSON Tools
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description:
      "Format, beautify, and validate JSON data with customizable indentation and sorting options",
    category: "json",
    version: "1.0.0",
    bundleSize: 15600, // bytes
    loadTime: 45, // ms
    dependencies: [],
    tags: ["json", "formatter", "validator", "beautifier", "syntax"],
    enabled: true,
    priority: 10, // High priority - core functionality
    icon: "FileJson",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-validator",
    name: "JSON Validator",
    description: "Comprehensive JSON validation with detailed error messages and schema support",
    category: "json",
    version: "1.0.0",
    bundleSize: 18400,
    loadTime: 52,
    dependencies: [],
    tags: ["json", "validator", "schema", "error-detection", "validation"],
    enabled: true,
    priority: 10, // High priority - core functionality
    icon: "CheckCircle",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-converter",
    name: "JSON Converter",
    description: "Convert JSON to various formats like XML, CSV, YAML, and vice versa",
    category: "json",
    version: "1.0.0",
    bundleSize: 22100,
    loadTime: 67,
    dependencies: [],
    tags: ["json", "converter", "xml", "csv", "yaml", "format"],
    enabled: true,
    priority: 9,
    icon: "RefreshCw",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-viewer",
    name: "JSON Viewer",
    description: "Interactive JSON viewer with collapsible nodes and syntax highlighting",
    category: "json",
    version: "1.0.0",
    bundleSize: 19800,
    loadTime: 58,
    dependencies: [],
    tags: ["json", "viewer", "interactive", "syntax-highlighting", "collapsible"],
    enabled: true,
    priority: 8,
    icon: "Eye",
    author: "Parsify Team",
    license: "MIT",
  },

  // Advanced JSON Tools
  {
    id: "json-cleanup",
    name: "JSON Cleanup & Minifier",
    description: "Advanced JSON cleanup, minification, and optimization with statistics tracking",
    category: "json",
    version: "1.0.0",
    bundleSize: 24300,
    loadTime: 71,
    dependencies: [],
    tags: ["json", "cleanup", "minifier", "optimization", "compression"],
    enabled: true,
    priority: 7,
    icon: "Wrench",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json5-parser",
    name: "JSON5 Parser",
    description: "Parse JSON5 with comments, trailing commas, and other extended features",
    category: "json",
    version: "1.0.0",
    bundleSize: 16700,
    loadTime: 49,
    dependencies: [],
    tags: ["json5", "parser", "comments", "extended-json", "relaxed"],
    enabled: true,
    priority: 6,
    icon: "Code2",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-advanced-editor",
    name: "Advanced JSON Editor",
    description:
      "Full-featured JSON editor with real-time validation, IntelliSense, and error correction",
    category: "json",
    version: "1.0.0",
    bundleSize: 28900,
    loadTime: 83,
    dependencies: [],
    tags: ["json", "editor", "intellisense", "real-time", "autocomplete"],
    enabled: true,
    priority: 8,
    icon: "Edit3",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-hero-viewer",
    name: "JSON Hero Viewer",
    description: "Advanced JSON visualization with path-based navigation and data analysis",
    category: "json",
    version: "1.0.0",
    bundleSize: 31200,
    loadTime: 89,
    dependencies: [],
    tags: ["json", "visualization", "path-navigation", "data-analysis", "hero-patterns"],
    enabled: true,
    priority: 6,
    icon: "Zap",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-schema-generator",
    name: "JSON Schema Generator",
    description: "Generate JSON Schema from sample data with advanced type inference",
    category: "json",
    version: "1.0.0",
    bundleSize: 26700,
    loadTime: 76,
    dependencies: [],
    tags: ["json", "schema", "generator", "type-inference", "validation"],
    enabled: true,
    priority: 7,
    icon: "FileText",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-sql-converter",
    name: "JSON to SQL Converter",
    description: "Convert JSON data to SQL INSERT statements and schema definitions",
    category: "json",
    version: "1.0.0",
    bundleSize: 23400,
    loadTime: 68,
    dependencies: [],
    tags: ["json", "sql", "converter", "database", "insert-statements"],
    enabled: true,
    priority: 5,
    icon: "Database",
    author: "Parsify Team",
    license: "MIT",
  },

  // JSON Language Converters
  {
    id: "json-java-converter",
    name: "JSON to Java Converter",
    description: "Convert JSON to Java POJO classes with proper type mapping",
    category: "json",
    version: "1.0.0",
    bundleSize: 19200,
    loadTime: 56,
    dependencies: [],
    tags: ["json", "java", "converter", "pojo", "type-mapping"],
    enabled: true,
    priority: 6,
    icon: "Coffee",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-python-converter",
    name: "JSON to Python Converter",
    description: "Convert JSON to Python dataclasses and type hints",
    category: "json",
    version: "1.0.0",
    bundleSize: 17800,
    loadTime: 53,
    dependencies: [],
    tags: ["json", "python", "converter", "dataclasses", "type-hints"],
    enabled: true,
    priority: 6,
    icon: "Terminal",
    author: "Parsify Team",
    license: "MIT",
  },

  // JSON Utility Libraries
  {
    id: "json-validation-service",
    name: "JSON Validation Service",
    description: "Advanced validation service with schema support and custom rules",
    category: "json",
    version: "1.0.0",
    bundleSize: 0, // Library, not a component
    loadTime: 0,
    dependencies: [],
    tags: ["json", "validation", "schema", "rules", "service"],
    enabled: true,
    priority: 0, // Library only
    icon: "Shield",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "json-code-generator",
    name: "JSON Code Generator",
    description: "Generate code from JSON data in multiple programming languages",
    category: "json",
    version: "1.0.0",
    bundleSize: 0, // Library, not a component
    loadTime: 0,
    dependencies: [],
    tags: ["json", "code-generation", "multi-language", "templates"],
    enabled: true,
    priority: 0, // Library only
    icon: "Code",
    author: "Parsify Team",
    license: "MIT",
  },
];

/**
 * JSON Tool Registry Configuration
 * Lazy loading configuration for optimal performance
 */
const JSON_TOOL_CONFIGS: Omit<ToolConfig, "metadata">[] = [
  // Core Tools Configurations
  {
    component: undefined as any, // Will be resolved by lazy loading
    importer: importJSONFormatter,
  },
  {
    component: undefined as any,
    importer: importJSONValidator,
  },
  {
    component: undefined as any,
    importer: importJSONConverter,
  },
  {
    component: undefined as any,
    importer: importJSONViewer,
  },

  // Advanced Tools Configurations
  {
    component: undefined as any,
    importer: importJSONCleanup,
  },
  {
    component: undefined as any,
    importer: importJSON5Parser,
  },
  {
    component: undefined as any,
    importer: importJSONAdvancedEditor,
  },
  {
    component: undefined as any,
    importer: importJSONHeroViewer,
  },
  {
    component: undefined as any,
    importer: importJSONSchemaGenerator,
  },
  {
    component: undefined as any,
    importer: importJSONSQLConverter,
  },

  // Language Converters Configurations
  {
    component: undefined as any,
    importer: () =>
      import("@/components/tools/json/java-converter/client").then(
        (mod) => mod.JavaConverterClient,
      ),
  },
  {
    component: undefined as any,
    importer: () =>
      import("@/components/tools/json/python-converter/client").then(
        (mod) => mod.PythonConverterClient,
      ),
  },

  // Library Services Configurations
  {
    component: undefined as any,
    importer: importJSONValidationService,
  },
  {
    component: undefined as any,
    importer: importJSONCodeGenerator,
  },
];

/**
 * JSON Tools Registry Class
 * Specialized registry for managing JSON tools with constitutional compliance
 */
export class JSONToolsRegistry {
  private toolRegistry: ToolRegistry;
  private static instance: JSONToolsRegistry | null = null;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance({
      enableLazyLoading: true,
      preloadPriority: 8, // Preload high-priority JSON tools
      maxConcurrentLoads: 2, // Conservative loading for performance
      retryAttempts: 3,
      cacheStrategy: "memory",
    });

    this.initializeTools();
  }

  /**
   * Get singleton instance of JSON Tools Registry
   */
  public static getInstance(): JSONToolsRegistry {
    if (!JSONToolsRegistry.instance) {
      JSONToolsRegistry.instance = new JSONToolsRegistry();
    }
    return JSONToolsRegistry.instance;
  }

  /**
   * Initialize all JSON tools with proper configuration
   */
  private initializeTools(): void {
    JSON_TOOLS_METADATA.forEach((metadata, index) => {
      const config = JSON_TOOL_CONFIGS[index];

      if (config) {
        this.toolRegistry.registerTool({
          metadata,
          ...config,
        });
      }
    });

    // Preload high-priority core tools
    this.preloadCoreTools();
  }

  /**
   * Preload essential JSON tools for immediate availability
   */
  private async preloadCoreTools(): Promise<void> {
    const coreToolIds = ["json-formatter", "json-validator", "json-converter"];

    try {
      await Promise.allSettled(coreToolIds.map((toolId) => this.toolRegistry.loadTool(toolId)));
    } catch (error) {
      console.warn("Failed to preload some core JSON tools:", error);
    }
  }

  /**
   * Get all JSON tools metadata
   */
  public getAllJSONTools(): ToolMetadata[] {
    return this.toolRegistry.getToolsByCategory("json");
  }

  /**
   * Get JSON tool by ID
   */
  public getJSONTool(toolId: string): ToolMetadata | null {
    return this.toolRegistry.getToolMetadata(toolId);
  }

  /**
   * Search JSON tools
   */
  public searchJSONTools(query: string): ToolMetadata[] {
    return this.toolRegistry.searchTools(query).filter((tool) => tool.category === "json");
  }

  /**
   * Get popular JSON tools
   */
  public getPopularJSONTools(): ToolMetadata[] {
    return this.getAllJSONTools()
      .filter((tool) => tool.priority >= 8)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get JSON tools by feature
   */
  public getJSONToolsByFeature(feature: string): ToolMetadata[] {
    return this.getAllJSONTools().filter((tool) =>
      tool.tags.some((tag) => tag.includes(feature.toLowerCase())),
    );
  }

  /**
   * Load a specific JSON tool
   */
  public async loadJSONTool(toolId: string): Promise<any> {
    return this.toolRegistry.loadTool(toolId);
  }

  /**
   * Enable/disable a JSON tool
   */
  public setJSONToolEnabled(toolId: string, enabled: boolean): void {
    this.toolRegistry.setToolEnabled(toolId, enabled);
  }

  /**
   * Get JSON tools statistics
   */
  public getJSONToolsStatistics(): {
    totalTools: number;
    enabledTools: number;
    coreTools: number;
    advancedTools: number;
    libraryTools: number;
    totalBundleSize: number;
    averageLoadTime: number;
    features: Record<string, number>;
  } {
    const allTools = this.getAllJSONTools();
    const enabledTools = allTools.filter((tool) => tool.enabled);
    const coreTools = allTools.filter((tool) => tool.priority >= 9);
    const advancedTools = allTools.filter((tool) => tool.priority > 0 && tool.priority < 9);
    const libraryTools = allTools.filter((tool) => tool.priority === 0);

    const totalBundleSize = allTools.reduce((sum, tool) => sum + tool.bundleSize, 0);
    const averageLoadTime =
      allTools.length > 0
        ? allTools.reduce((sum, tool) => sum + tool.loadTime, 0) / allTools.length
        : 0;

    // Count features across all tools
    const features: Record<string, number> = {};
    allTools.forEach((tool) => {
      tool.tags.forEach((tag) => {
        features[tag] = (features[tag] || 0) + 1;
      });
    });

    return {
      totalTools: allTools.length,
      enabledTools: enabledTools.length,
      coreTools: coreTools.length,
      advancedTools: advancedTools.length,
      libraryTools: libraryTools.length,
      totalBundleSize,
      averageLoadTime: Math.round(averageLoadTime),
      features,
    };
  }

  /**
   * Export JSON tools registry configuration
   */
  public exportJSONRegistry(): {
    tools: ToolMetadata[];
    statistics: ReturnType<typeof this.getJSONToolsStatistics>;
    config: {
      lazyLoadingEnabled: boolean;
      preloadPriority: number;
      cacheStrategy: string;
    };
  } {
    return {
      tools: this.getAllJSONTools(),
      statistics: this.getJSONToolsStatistics(),
      config: {
        lazyLoadingEnabled: true,
        preloadPriority: 8,
        cacheStrategy: "memory",
      },
    };
  }

  /**
   * Validate JSON tools registry health
   */
  public validateRegistryHealth(): {
    status: "healthy" | "warning" | "error";
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const statistics = this.getJSONToolsStatistics();

    // Check bundle sizes
    const oversizedTools = this.getAllJSONTools().filter((tool) => tool.bundleSize > 200000);
    if (oversizedTools.length > 0) {
      issues.push(`Found ${oversizedTools.length} tools exceeding 200KB bundle size limit`);
      recommendations.push("Consider code splitting or lazy loading for oversized tools");
    }

    // Check load times
    const slowTools = this.getAllJSONTools().filter((tool) => tool.loadTime > 2000);
    if (slowTools.length > 0) {
      issues.push(`Found ${slowTools.length} tools with load times > 2s`);
      recommendations.push("Optimize slow-loading tools with better code organization");
    }

    // Check enabled tools ratio
    const enabledRatio = statistics.enabledTools / statistics.totalTools;
    if (enabledRatio < 0.8) {
      recommendations.push("Consider enabling more JSON tools for better user experience");
    }

    // Determine overall health
    let status: "healthy" | "warning" | "error" = "healthy";
    if (issues.length > 0) {
      status = issues.length > 3 ? "error" : "warning";
    }

    return {
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Dispose of JSON tools registry resources
   */
  public dispose(): void {
    this.toolRegistry.dispose();
    JSONToolsRegistry.instance = null;
  }
}

/**
 * Export singleton instance for immediate use
 */
export const jsonToolsRegistry = JSONToolsRegistry.getInstance();

/**
 * Export utility functions for common operations
 */
export const getAllJSONTools = () => jsonToolsRegistry.getAllJSONTools();
export const getPopularJSONTools = () => jsonToolsRegistry.getPopularJSONTools();
export const searchJSONTools = (query: string) => jsonToolsRegistry.searchJSONTools(query);
export const loadJSONTool = (toolId: string) => jsonToolsRegistry.loadJSONTool(toolId);
export const getJSONToolsStatistics = () => jsonToolsRegistry.getJSONToolsStatistics();
