/**
 * Tool Discovery System
 * Automatically discovers and registers tools from the codebase
 */

import type { ToolConfig, ToolMetadata } from "./tool-registry";

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
  private options: DiscoveryOptions;
  private toolRegistry: any;
  private discoveredTools: Map<string, DiscoveredTool>;

  private constructor(options: Partial<DiscoveryOptions> = {}) {
    this.options = {
      paths: ["/src/components/tools"],
      excludePatterns: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**", "**/node_modules/**"],
      autoRegister: true,
      validateConstitutionalCompliance: true,
      ...options,
    };
    this.discoveredTools = new Map();

    // Get tool registry instance
    import("./tool-registry").then((module) => {
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
    const tools: DiscoveredTool[] = [];

    // In a real implementation, this would scan the filesystem
    // For now, we'll simulate discovery with known tool patterns

    const knownTools = await this.getKnownToolDefinitions();

    for (const toolDef of knownTools) {
      const tool = await this.createDiscoveredTool(toolDef);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Get known tool definitions
   * This would be replaced by actual filesystem scanning in a real implementation
   */
  private async getKnownToolDefinitions(): Promise<
    Array<{
      id: string;
      path: string;
      metadata: Partial<ToolMetadata>;
      importer: () => Promise<any>;
    }>
  > {
    return [
      // JSON Tools
      {
        id: "json-formatter",
        path: "/src/components/tools/json/json-formatter",
        metadata: {
          name: "JSON Formatter",
          description: "Format and validate JSON data with syntax highlighting",
          category: "json",
          version: "1.0.0",
          bundleSize: 15000, // ~15KB
          loadTime: 500,
          dependencies: ["@monaco-editor/react"],
          tags: ["json", "format", "validate", "syntax"],
          enabled: true,
          priority: 10,
          requiresWasm: false,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-json-formatter" */ "@/components/tools/json/json-formatter"
          ),
      },
      {
        id: "json-minifier",
        path: "/src/components/tools/json/json-minifier",
        metadata: {
          name: "JSON Minifier",
          description: "Minify JSON data to reduce file size",
          category: "json",
          version: "1.0.0",
          bundleSize: 12000,
          loadTime: 400,
          dependencies: [],
          tags: ["json", "minify", "compress"],
          enabled: true,
          priority: 8,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-json-minifier" */ "@/components/tools/json/json-minifier"
          ),
      },
      {
        id: "json-validator",
        path: "/src/components/tools/json/json-validator",
        metadata: {
          name: "JSON Validator",
          description: "Validate JSON data against schemas with detailed error reporting",
          category: "json",
          version: "1.0.0",
          bundleSize: 18000,
          loadTime: 600,
          dependencies: ["@monaco-editor/react"],
          tags: ["json", "validate", "schema", "ajv"],
          enabled: true,
          priority: 9,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-json-validator" */ "@/components/tools/json/json-validator"
          ),
      },

      // Crypto Tools
      {
        id: "aes-encryptor",
        path: "/src/components/tools/crypto/aes-encryptor",
        metadata: {
          name: "AES Encryptor",
          description: "AES-256 encryption and decryption with Web Crypto API",
          category: "crypto",
          version: "1.0.0",
          bundleSize: 8000,
          loadTime: 300,
          dependencies: [],
          tags: ["aes", "encryption", "decryption", "security"],
          enabled: true,
          priority: 7,
          requiresWasm: false,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-aes-encryptor" */ "@/components/tools/crypto/aes-encryptor"
          ),
      },
      {
        id: "hash-generator",
        path: "/src/components/tools/crypto/hash-generator",
        metadata: {
          name: "Hash Generator",
          description: "Generate SHA-1, SHA-256, SHA-512 hashes and HMAC",
          category: "crypto",
          version: "1.0.0",
          bundleSize: 6000,
          loadTime: 200,
          dependencies: [],
          tags: ["hash", "sha256", "sha512", "hmac", "checksum"],
          enabled: true,
          priority: 6,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-hash-generator" */ "@/components/tools/crypto/hash-generator"
          ),
      },
      {
        id: "base64-encoder",
        path: "/src/components/tools/crypto/base64-encoder",
        metadata: {
          name: "Base64 Encoder/Decoder",
          description: "Encode and decode Base64 strings and files",
          category: "crypto",
          version: "1.0.0",
          bundleSize: 5000,
          loadTime: 200,
          dependencies: [],
          tags: ["base64", "encode", "decode"],
          enabled: true,
          priority: 5,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-base64-encoder" */ "@/components/tools/crypto/base64-encoder"
          ),
      },

      // Code Execution Tools
      {
        id: "python-runner",
        path: "/src/components/tools/code/python-runner",
        metadata: {
          name: "Python Runner",
          description: "Run Python code in browser using Pyodide",
          category: "code",
          version: "1.0.0",
          bundleSize: 180000, // Pyodide is large
          loadTime: 5000,
          dependencies: ["pyodide"],
          tags: ["python", "execute", "pyodide", "wasm"],
          enabled: true,
          priority: 3,
          requiresWasm: true,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-python-runner" */ "@/components/tools/code/python-runner"
          ),
      },
      {
        id: "javascript-runner",
        path: "/src/components/tools/code/javascript-runner",
        metadata: {
          name: "JavaScript Runner",
          description: "Execute JavaScript with console output and error handling",
          category: "code",
          version: "1.0.0",
          bundleSize: 10000,
          loadTime: 400,
          dependencies: ["@monaco-editor/react"],
          tags: ["javascript", "execute", "browser"],
          enabled: true,
          priority: 4,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-javascript-runner" */ "@/components/tools/code/javascript-runner"
          ),
      },
      {
        id: "typescript-runner",
        path: "/src/components/tools/code/typescript-runner",
        metadata: {
          name: "TypeScript Runner",
          description: "Run TypeScript with Deno runtime and transpilation",
          category: "code",
          version: "1.0.0",
          bundleSize: 15000,
          loadTime: 600,
          dependencies: ["@monaco-editor/react", "deno"],
          tags: ["typescript", "execute", "deno", "wasm"],
          enabled: true,
          priority: 3,
          requiresWasm: true,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-typescript-runner" */ "@/components/tools/code/typescript-runner"
          ),
      },

      // Image Processing Tools
      {
        id: "image-converter",
        path: "/src/components/tools/image/image-converter",
        metadata: {
          name: "Image Converter",
          description: "Convert images between PNG, JPEG, WebP, and other formats",
          category: "image",
          version: "1.0.0",
          bundleSize: 12000,
          loadTime: 500,
          dependencies: [],
          tags: ["image", "convert", "png", "jpeg", "webp"],
          enabled: true,
          priority: 7,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-image-converter" */ "@/components/tools/image/image-converter"
          ),
      },
      {
        id: "image-resizer",
        path: "/src/components/tools/image/image-resizer",
        metadata: {
          name: "Image Resizer",
          description: "Resize images with multiple algorithms and aspect ratio options",
          category: "image",
          version: "1.0.0",
          bundleSize: 10000,
          loadTime: 400,
          dependencies: [],
          tags: ["image", "resize", "scale", "crop"],
          enabled: true,
          priority: 7,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-image-resizer" */ "@/components/tools/image/image-resizer"
          ),
      },
      {
        id: "qr-code-generator",
        path: "/src/components/tools/image/qr-code-generator",
        metadata: {
          name: "QR Code Generator",
          description: "Generate QR codes from text, URLs, and other data",
          category: "image",
          version: "1.0.0",
          bundleSize: 8000,
          loadTime: 300,
          dependencies: ["qrcode"],
          tags: ["qr", "code", "generate", "barcode"],
          enabled: true,
          priority: 6,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-qr-code-generator" */ "@/components/tools/image/qr-code-generator"
          ),
      },

      // Network Tools
      {
        id: "url-encoder",
        path: "/src/components/tools/network/url-encoder",
        metadata: {
          name: "URL Encoder/Decoder",
          description: "Encode and decode URLs with proper handling of special characters",
          category: "network",
          version: "1.0.0",
          bundleSize: 4000,
          loadTime: 200,
          dependencies: [],
          tags: ["url", "encode", "decode", "percent-encoding"],
          enabled: true,
          priority: 5,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-url-encoder" */ "@/components/tools/network/url-encoder"
          ),
      },
      {
        id: "http-client",
        path: "/src/components/tools/network/http-client",
        metadata: {
          name: "HTTP Client",
          description: "Make HTTP requests with custom headers and methods",
          category: "network",
          version: "1.0.0",
          bundleSize: 6000,
          loadTime: 300,
          dependencies: [],
          tags: ["http", "request", "api", "rest"],
          enabled: true,
          priority: 8,
        },
        importer: () =>
          import(
            /* webpackChunkName: "tool-http-client" */ "@/components/tools/network/http-client"
          ),
      },
    ];
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
        description: toolDef.metadata.description || "",
        category: toolDef.metadata.category || "utility",
        version: toolDef.metadata.version || "1.0.0",
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
    importer: () => Promise<any>,
  ): Promise<string[]> {
    const errors: string[] = [];

    // Validate required fields
    const requiredFields = ["id", "name", "description", "category", "version"];
    for (const field of requiredFields) {
      if (!metadata[field as keyof ToolMetadata]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate category
    const validCategories = [
      "json",
      "crypto",
      "image",
      "network",
      "security",
      "text",
      "code",
      "utility",
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
      errors.push(`Importer failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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
      errors.push("Tool bundle size exceeds constitutional 200KB limit");
    }

    // Check for client-side processing (tools should not require server)
    if (metadata.dependencies.some((dep) => dep.includes("express") || dep.includes("http"))) {
      errors.push("Tool appears to require server-side processing");
    }

    // Check WASM requirements (allowed but must be validated)
    if (
      metadata.requiresWasm &&
      !metadata.dependencies.some((dep) => dep.includes("pyodide") || dep.includes("wasm"))
    ) {
      errors.push("Tool requires WASM but no WASM dependencies found");
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
