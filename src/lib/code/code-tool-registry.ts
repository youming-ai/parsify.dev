/**
 * Code Execution Tools Registry
 * Central registry for all code execution and language tools with security constraints
 */

import { ToolRegistry, type ToolMetadata, type ToolConfig } from "@/lib/registry/tool-registry";

// Code Execution Tool Imports (lazy-loaded)
const importPythonExecutor = () =>
  import("@/components/tools/code-execution/python-executor").then((mod) => mod.PythonExecutor);
const importJavaExecutor = () =>
  import("@/components/tools/code-execution/java-executor").then((mod) => mod.JavaExecutor);
const importGoExecutor = () =>
  import("@/components/tools/code-execution/go-executor").then((mod) => mod.GoExecutor);
const importRustExecutor = () =>
  import("@/components/tools/code-execution/rust-executor").then((mod) => mod.RustExecutor);
const importTypeScriptTranspiler = () =>
  import("@/components/tools/code-execution/typescript-transpiler").then(
    (mod) => mod.TypeScriptTranspiler,
  );

// WASM Runtime Imports (lazy-loaded)
const importPythonWasm = () =>
  import("@/lib/runtimes/python-wasm").then((mod) => mod.PythonWasmRuntime);
const importJavaWasm = () => import("@/lib/runtimes/java-wasm").then((mod) => mod.JavaWasmRuntime);
const importGoWasm = () => import("@/lib/runtimes/go-wasm").then((mod) => mod.GoWasmRuntime);
const importRustWasm = () => import("@/lib/runtimes/rust-wasm").then((mod) => mod.RustWasmRuntime);
const importTypeScriptWasm = () =>
  import("@/lib/runtimes/typescript-wasm").then((mod) => mod.TypeScriptWasmRuntime);

/**
 * Code Execution Tools Metadata Configuration
 * Security-focused metadata for all execution tools with strict limits
 */
const CODE_EXECUTION_TOOLS_METADATA: ToolMetadata[] = [
  // Language Executors
  {
    id: "python-executor",
    name: "Python Executor",
    description:
      "Execute Python code in browser using Pyodide WASM runtime with scientific computing support",
    category: "code",
    version: "1.0.0",
    bundleSize: 15600000, // 15.6MB for Pyodide core
    loadTime: 2500, // 2.5s initialization
    dependencies: ["pyodide"],
    tags: ["python", "execution", "wasm", "pyodide", "scientific-computing"],
    enabled: true,
    priority: 10, // Highest priority - core language
    requiresWasm: true,
    requiresWorker: true, // For performance isolation
    icon: "Terminal",
    author: "Parsify Team",
    license: "MIT",
    executionTimeout: 5000, // 5 seconds
    memoryLimit: 50 * 1024 * 1024, // 50MB
  },
  {
    id: "java-executor",
    name: "Java Executor",
    description: "Execute Java code using TeaVM-compiled WebAssembly with standard library support",
    category: "code",
    version: "1.0.0",
    bundleSize: 8200000, // 8.2MB for TeaVM Java
    loadTime: 1800, // 1.8s initialization
    dependencies: [],
    tags: ["java", "execution", "wasm", "teavm", "jvm"],
    enabled: true,
    priority: 9,
    requiresWasm: true,
    requiresWorker: true,
    icon: "Coffee",
    author: "Parsify Team",
    license: "MIT",
    executionTimeout: 5000,
    memoryLimit: 40 * 1024 * 1024, // 40MB
  },
  {
    id: "go-executor",
    name: "Go Executor",
    description: "Execute Go code using TinyGo-compiled WebAssembly with goroutine support",
    category: "code",
    version: "1.0.0",
    bundleSize: 5200000, // 5.2MB for TinyGo runtime
    loadTime: 1200, // 1.2s initialization
    dependencies: [],
    tags: ["go", "execution", "wasm", "tinygo", "goroutines"],
    enabled: true,
    priority: 8,
    requiresWasm: true,
    requiresWorker: true,
    icon: "Code2",
    author: "Parsify Team",
    license: "MIT",
    executionTimeout: 5000,
    memoryLimit: 35 * 1024 * 1024, // 35MB
  },
  {
    id: "rust-executor",
    name: "Rust Executor",
    description: "Execute Rust code with native WebAssembly compilation and Cargo-like features",
    category: "code",
    version: "1.0.0",
    bundleSize: 4800000, // 4.8MB for Rust runtime
    loadTime: 1000, // 1s initialization
    dependencies: [],
    tags: ["rust", "execution", "wasm", "native", "cargo"],
    enabled: true,
    priority: 8,
    requiresWasm: true,
    requiresWorker: true,
    icon: "Wrench",
    author: "Parsify Team",
    license: "MIT",
    executionTimeout: 5000,
    memoryLimit: 30 * 1024 * 1024, // 30MB
  },
  {
    id: "typescript-transpiler",
    name: "TypeScript Transpiler",
    description: "Transpile and execute TypeScript code using Deno runtime with JIT compilation",
    category: "code",
    version: "1.0.0",
    bundleSize: 3200000, // 3.2MB for Deno runtime
    loadTime: 800, // 0.8s initialization
    dependencies: [],
    tags: ["typescript", "transpiler", "execution", "wasm", "deno", "jit"],
    enabled: true,
    priority: 9,
    requiresWasm: true,
    requiresWorker: true,
    icon: "FileCode",
    author: "Parsify Team",
    license: "MIT",
    executionTimeout: 5000,
    memoryLimit: 25 * 1024 * 1024, // 25MB
  },

  // WASM Runtime Libraries (not user-facing tools)
  {
    id: "python-wasm-runtime",
    name: "Python WASM Runtime",
    description: "Pyodide WebAssembly runtime for Python code execution",
    category: "code",
    version: "1.0.0",
    bundleSize: 15000000, // Library size
    loadTime: 0, // Not directly loaded
    dependencies: ["pyodide"],
    tags: ["python", "wasm", "runtime", "library"],
    enabled: true,
    priority: 0, // Library only
    requiresWasm: true,
    icon: "Cpu",
    author: "Pyodide Team",
    license: "Apache-2.0",
  },
  {
    id: "java-wasm-runtime",
    name: "Java WASM Runtime",
    description: "TeaVM WebAssembly runtime for Java bytecode execution",
    category: "code",
    version: "1.0.0",
    bundleSize: 8000000,
    loadTime: 0,
    dependencies: [],
    tags: ["java", "wasm", "runtime", "teavm", "library"],
    enabled: true,
    priority: 0,
    requiresWasm: true,
    icon: "Cpu",
    author: "TeaVM Team",
    license: "Apache-2.0",
  },
  {
    id: "go-wasm-runtime",
    name: "Go WASM Runtime",
    description: "TinyGo WebAssembly runtime for Go code execution",
    category: "code",
    version: "1.0.0",
    bundleSize: 5000000,
    loadTime: 0,
    dependencies: [],
    tags: ["go", "wasm", "runtime", "tinygo", "library"],
    enabled: true,
    priority: 0,
    requiresWasm: true,
    icon: "Cpu",
    author: "TinyGo Team",
    license: "BSD-3-Clause",
  },
  {
    id: "rust-wasm-runtime",
    name: "Rust WASM Runtime",
    description: "Native Rust WebAssembly runtime for Rust code execution",
    category: "code",
    version: "1.0.0",
    bundleSize: 4500000,
    loadTime: 0,
    dependencies: [],
    tags: ["rust", "wasm", "runtime", "native", "library"],
    enabled: true,
    priority: 0,
    requiresWasm: true,
    icon: "Cpu",
    author: "Rust Team",
    license: "MIT/Apache-2.0",
  },
  {
    id: "typescript-wasm-runtime",
    name: "TypeScript WASM Runtime",
    description: "Deno WebAssembly runtime for TypeScript transpilation and execution",
    category: "code",
    version: "1.0.0",
    bundleSize: 3000000,
    loadTime: 0,
    dependencies: [],
    tags: ["typescript", "wasm", "runtime", "deno", "library"],
    enabled: true,
    priority: 0,
    requiresWasm: true,
    icon: "Cpu",
    author: "Deno Team",
    license: "MIT",
  },
];

/**
 * Code Execution Tool Registry Configuration
 * Security-focused lazy loading with strict enforcement of execution limits
 */
const CODE_EXECUTION_CONFIGS: Omit<ToolConfig, "metadata">[] = [
  // Language Executors Configurations
  {
    component: undefined as any,
    importer: importPythonExecutor,
  },
  {
    component: undefined as any,
    importer: importJavaExecutor,
  },
  {
    component: undefined as any,
    importer: importGoExecutor,
  },
  {
    component: undefined as any,
    importer: importRustExecutor,
  },
  {
    component: undefined as any,
    importer: importTypeScriptTranspiler,
  },

  // WASM Runtime Configurations
  {
    component: undefined as any,
    importer: importPythonWasm,
  },
  {
    component: undefined as any,
    importer: importJavaWasm,
  },
  {
    component: undefined as any,
    importer: importGoWasm,
  },
  {
    component: undefined as any,
    importer: importRustWasm,
  },
  {
    component: undefined as any,
    importer: importTypeScriptWasm,
  },
];

/**
 * Code Execution Security Constraints
 * Strict security policies for sandboxed code execution
 */
export interface CodeExecutionSecurity {
  maxExecutionTime: number; // 5 seconds timeout
  maxMemoryUsage: number; // 100MB total limit
  allowNetworking: boolean; // Always false for security
  allowFileSystem: boolean; // Always false for security
  allowedImports: string[]; // Whitelist of allowed modules
  blockedDomains: string[]; // Blocked network domains
  requireExplicitImport: boolean; // All imports must be explicit
}

/**
 * Code Execution Tools Registry Class
 * Security-focused registry for managing code execution tools
 */
export class CodeExecutionToolsRegistry {
  private toolRegistry: ToolRegistry;
  private static instance: CodeExecutionToolsRegistry | null = null;
  private securityConstraints: CodeExecutionSecurity;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance({
      enableLazyLoading: true,
      preloadPriority: 9, // Preload high-priority executors
      maxConcurrentLoads: 1, // Only one WASM runtime at a time for security
      retryAttempts: 2,
      cacheStrategy: "memory",
    });

    this.securityConstraints = {
      maxExecutionTime: 5000,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB total
      allowNetworking: false,
      allowFileSystem: false,
      allowedImports: [
        // Python standard library safe modules
        "json",
        "math",
        "datetime",
        "collections",
        "itertools",
        "functools",
        "re",
        "string",
        "random",
        "statistics",
        "decimal",
        "fractions",
        // Scientific packages (when installed)
        "numpy",
        "pandas",
        "scipy",
        "matplotlib",
        // Java standard library safe packages
        "java.lang",
        "java.util",
        "java.math",
        "java.time",
        // Go standard library safe packages
        "fmt",
        "math",
        "strings",
        "time",
        "sort",
        "strconv",
        // Rust standard library safe crates
        "std::collections",
        "std::vec",
        "std::string",
        "std::time",
      ],
      blockedDomains: ["localhost", "127.0.0.1", "0.0.0.0", "*.internal", "*.local", "*.lan"],
      requireExplicitImport: true,
    };

    this.initializeTools();
  }

  /**
   * Get singleton instance of Code Execution Tools Registry
   */
  public static getInstance(): CodeExecutionToolsRegistry {
    if (!CodeExecutionToolsRegistry.instance) {
      CodeExecutionToolsRegistry.instance = new CodeExecutionToolsRegistry();
    }
    return CodeExecutionToolsRegistry.instance;
  }

  /**
   * Initialize all code execution tools with security validation
   */
  private initializeTools(): void {
    CODE_EXECUTION_TOOLS_METADATA.forEach((metadata, index) => {
      const config = CODE_EXECUTION_CONFIGS[index];

      if (config) {
        // Validate security constraints
        this.validateToolSecurity(metadata);

        this.toolRegistry.registerTool({
          metadata,
          ...config,
        });
      }
    });

    // Preload essential executors
    this.preloadEssentialExecutors();
  }

  /**
   * Validate tool security constraints
   */
  private validateToolSecurity(metadata: ToolMetadata): void {
    // Check execution timeout
    const executionTimeout = (metadata as any).executionTimeout;
    if (executionTimeout && executionTimeout > this.securityConstraints.maxExecutionTime) {
      console.warn(
        `Tool ${metadata.id} execution timeout ${executionTimeout}ms exceeds maximum ${this.securityConstraints.maxExecutionTime}ms`,
      );
    }

    // Check memory limit
    const memoryLimit = (metadata as any).memoryLimit;
    if (memoryLimit && memoryLimit > this.securityConstraints.maxMemoryUsage) {
      console.warn(
        `Tool ${metadata.id} memory limit ${memoryLimit} bytes exceeds maximum ${this.securityConstraints.maxMemoryUsage} bytes`,
      );
    }

    // Ensure WASM requirement for execution tools
    if (metadata.priority > 0 && !metadata.requiresWasm) {
      console.warn(`Execution tool ${metadata.id} should require WebAssembly`);
    }
  }

  /**
   * Preload essential language executors for immediate availability
   */
  private async preloadEssentialExecutors(): Promise<void> {
    const essentialExecutorIds = ["python-executor", "typescript-transpiler"];

    try {
      await Promise.allSettled(
        essentialExecutorIds.map((executorId) => this.toolRegistry.loadTool(executorId)),
      );
    } catch (error) {
      console.warn("Failed to preload some essential executors:", error);
    }
  }

  /**
   * Get all code execution tools (excluding libraries)
   */
  public getCodeExecutionTools(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "code" && tool.priority > 0);
  }

  /**
   * Get WASM runtime libraries
   */
  public getWasmRuntimes(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "code" && tool.priority === 0 && tool.requiresWasm);
  }

  /**
   * Get security constraints
   */
  public getSecurityConstraints(): CodeExecutionSecurity {
    return { ...this.securityConstraints };
  }

  /**
   * Validate execution request against security constraints
   */
  public validateExecutionRequest(
    toolId: string,
    code: string,
  ): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check for blocked imports
    const importRegex = /(?:import|require|from)\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];

      // Check if import is allowed
      const isAllowed = this.securityConstraints.allowedImports.some(
        (allowed) => importPath.startsWith(allowed) || importPath === allowed,
      );

      if (!isAllowed) {
        violations.push(`Blocked import: ${importPath}`);
      }
    }

    // Check for network access patterns
    const networkPatterns = [
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /HttpClient/,
      /urllib/,
      /requests\./,
      /http\.client/,
      /java\.net/,
    ];

    for (const pattern of networkPatterns) {
      if (pattern.test(code)) {
        violations.push("Network access is not allowed");
        break;
      }
    }

    // Check for file system access
    const fileSystemPatterns = [
      /fs\./,
      /File\(/,
      /open\s*\(/,
      /os\.path/,
      /java\.io\.File/,
      /std::fs/,
    ];

    for (const pattern of fileSystemPatterns) {
      if (pattern.test(code)) {
        violations.push("File system access is not allowed");
        break;
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Get execution statistics
   */
  public getExecutionStatistics(): {
    totalExecutors: number;
    enabledExecutors: number;
    wasmLobraries: number;
    totalBundleSize: number;
    estimatedMemoryUsage: number;
    securityLevel: "high" | "medium" | "low";
  } {
    const executors = this.getCodeExecutionTools();
    const wasmLibraries = this.getWasmRuntimes();
    const enabledExecutors = executors.filter((tool) => tool.enabled);

    const totalBundleSize = executors.reduce((sum, tool) => sum + tool.bundleSize, 0);
    const estimatedMemoryUsage = executors.reduce((sum, tool) => {
      return sum + ((tool as any).memoryLimit || 30 * 1024 * 1024); // Default 30MB
    }, 0);

    // Determine security level
    const securityLevel =
      this.securityConstraints.allowNetworking === false &&
      this.securityConstraints.allowFileSystem === false &&
      this.securityConstraints.maxExecutionTime <= 5000
        ? "high"
        : "medium";

    return {
      totalExecutors: executors.length,
      enabledExecutors: enabledExecutors.length,
      wasmLobraries: wasmLibraries.length,
      totalBundleSize,
      estimatedMemoryUsage,
      securityLevel,
    };
  }

  /**
   * Dispose of registry resources
   */
  public dispose(): void {
    this.toolRegistry.dispose();
    CodeExecutionToolsRegistry.instance = null;
  }
}

/**
 * Export singleton instance for immediate use
 */
export const codeExecutionRegistry = CodeExecutionToolsRegistry.getInstance();

/**
 * Export utility functions for common operations
 */
export const getCodeExecutionTools = () => codeExecutionRegistry.getCodeExecutionTools();
export const getWasmRuntimes = () => codeExecutionRegistry.getWasmRuntimes();
export const validateExecutionCode = (toolId: string, code: string) =>
  codeExecutionRegistry.validateExecutionRequest(toolId, code);
export const getExecutionStatistics = () => codeExecutionRegistry.getExecutionStatistics();
