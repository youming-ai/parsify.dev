/**
 * WASM Runtime Manager
 * Manages lazy loading and lifecycle of WASM runtimes with memory optimization
 */

import { type CppExecutionOptions, type CppExecutionResult, cppRuntime } from './cpp-wasm';
import {
  type CSharpExecutionOptions,
  type CSharpExecutionResult,
  csharpRuntime,
} from './csharp-wasm';
import { type GoExecutionOptions, type GoExecutionResult, goRuntime } from './go-wasm';
import { type JavaExecutionOptions, type JavaExecutionResult, javaRuntime } from './java-wasm';
import { type LuaExecutionOptions, type LuaExecutionResult, luaRuntime } from './lua-wasm';
import { type PhpExecutionOptions, type PhpExecutionResult, phpRuntime } from './php-wasm';
import {
  type PythonExecutionOptions,
  type PythonExecutionResult,
  pythonRuntime,
} from './python-wasm';
import { type RubyExecutionOptions, type RubyExecutionResult, rubyRuntime } from './ruby-wasm';
import { type RustExecutionOptions, type RustExecutionResult, rustRuntime } from './rust-wasm';
import {
  type TypeScriptExecutionOptions,
  type TypeScriptExecutionResult,
  typescriptRuntime,
} from './typescript-wasm';

export type SupportedLanguage =
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'typescript'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'lua';

export interface WASMRuntimeInfo {
  id: SupportedLanguage;
  name: string;
  version: string;
  bundleSize: number; // in bytes
  loadTime: number; // in milliseconds
  memoryUsage: number; // in bytes
  isLoaded: boolean;
  isInitialized: boolean;
  lastUsed: number;
  usageCount: number;
}

export interface WASMExecutionOptions {
  language: SupportedLanguage;
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput?: boolean;
  captureErrors?: boolean;
  // Language-specific options
  pythonOptions?: PythonExecutionOptions;
  javaOptions?: any; // JavaExecutionOptions
  goOptions?: GoExecutionOptions;
  rustOptions?: RustExecutionOptions;
  typescriptOptions?: TypeScriptExecutionOptions;
  cppOptions?: CppExecutionOptions;
  csharpOptions?: CSharpExecutionOptions;
  phpOptions?: PhpExecutionOptions;
  rubyOptions?: RubyExecutionOptions;
  luaOptions?: LuaExecutionOptions;
}

export interface WASMExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  language: SupportedLanguage;
  runtimeInfo: WASMRuntimeInfo;
  error?: Error;
  warnings?: string[];
}

export interface WASMManagerOptions {
  maxMemoryUsage: number; // Maximum total memory for all runtimes
  maxIdleTime: number; // Time before unloading idle runtimes (ms)
  preloadRuntimes: SupportedLanguage[]; // Runtimes to preload
  lazyLoading: boolean; // Enable lazy loading
  memoryCleanupInterval: number; // Memory cleanup interval (ms)
}

export class WASMRuntimeManager {
  private static instance: WASMRuntimeManager;
  private runtimes = new Map<SupportedLanguage, any>();
  private runtimeInfo = new Map<SupportedLanguage, WASMRuntimeInfo>();
  private loadingPromises = new Map<SupportedLanguage, Promise<void>>();
  private memoryCleanupTimer: NodeJS.Timeout | null = null;
  private options: Required<WASMManagerOptions>;

  private constructor(options: Partial<WASMManagerOptions> = {}) {
    this.options = {
      maxMemoryUsage: options.maxMemoryUsage || 100 * 1024 * 1024, // 100MB
      maxIdleTime: options.maxIdleTime || 5 * 60 * 1000, // 5 minutes
      preloadRuntimes: options.preloadRuntimes || [],
      lazyLoading: options.lazyLoading !== false,
      memoryCleanupInterval: options.memoryCleanupInterval || 30000, // 30 seconds
    };

    this.initializeRuntimeInfo();
    this.startMemoryCleanup();

    if (this.options.preloadRuntimes.length > 0) {
      this.preloadRuntimes();
    }
  }

  public static getInstance(options?: WASMManagerOptions): WASMRuntimeManager {
    if (!WASMRuntimeManager.instance) {
      WASMRuntimeManager.instance = new WASMRuntimeManager(options);
    }
    return WASMRuntimeManager.instance;
  }

  /**
   * Initialize runtime information
   */
  private initializeRuntimeInfo(): void {
    const runtimeConfigs: Record<
      SupportedLanguage,
      Omit<WASMRuntimeInfo, 'isLoaded' | 'isInitialized' | 'lastUsed' | 'usageCount'>
    > = {
      python: {
        id: 'python',
        name: 'Pyodide',
        version: '0.26.4',
        bundleSize: 15 * 1024 * 1024, // 15MB
        loadTime: 0,
        memoryUsage: 0,
      },
      java: {
        id: 'java',
        name: 'TeaVM',
        version: '0.8.0',
        bundleSize: 5 * 1024 * 1024, // 5MB
        loadTime: 0,
        memoryUsage: 0,
      },
      go: {
        id: 'go',
        name: 'TinyGo',
        version: '0.30.0',
        bundleSize: 3 * 1024 * 1024, // 3MB
        loadTime: 0,
        memoryUsage: 0,
      },
      rust: {
        id: 'rust',
        name: 'Rust WASM',
        version: '1.75.0',
        bundleSize: 2 * 1024 * 1024, // 2MB
        loadTime: 0,
        memoryUsage: 0,
      },
      typescript: {
        id: 'typescript',
        name: 'Deno Runtime',
        version: '2.0.0',
        bundleSize: 1 * 1024 * 1024, // 1MB
        loadTime: 0,
        memoryUsage: 0,
      },
      cpp: {
        id: 'cpp',
        name: 'Emscripten C++',
        version: '3.1.0',
        bundleSize: 5 * 1024 * 1024, // 5MB
        loadTime: 0,
        memoryUsage: 0,
      },
      csharp: {
        id: 'csharp',
        name: 'Blazor WebAssembly',
        version: '8.0.0',
        bundleSize: 8 * 1024 * 1024, // 8MB
        loadTime: 0,
        memoryUsage: 0,
      },
      php: {
        id: 'php',
        name: 'WebAssembly PHP',
        version: '8.2.0',
        bundleSize: 4 * 1024 * 1024, // 4MB
        loadTime: 0,
        memoryUsage: 0,
      },
      ruby: {
        id: 'ruby',
        name: 'ruby.wasm',
        version: '3.2.0',
        bundleSize: 6 * 1024 * 1024, // 6MB
        loadTime: 0,
        memoryUsage: 0,
      },
      lua: {
        id: 'lua',
        name: 'Fengari',
        version: '5.4.4',
        bundleSize: 1 * 1024 * 1024, // 1MB
        loadTime: 0,
        memoryUsage: 0,
      },
    };

    Object.entries(runtimeConfigs).forEach(([language, config]) => {
      this.runtimeInfo.set(language as SupportedLanguage, {
        ...config,
        isLoaded: false,
        isInitialized: false,
        lastUsed: Date.now(),
        usageCount: 0,
      });
    });
  }

  /**
   * Preload specified runtimes
   */
  private async preloadRuntimes(): Promise<void> {
    const preloadPromises = this.options.preloadRuntimes.map((language) =>
      this.loadRuntime(language)
    );

    try {
      await Promise.allSettled(preloadPromises);
      console.log(`Preloaded ${this.options.preloadRuntimes.join(', ')} runtimes`);
    } catch (error) {
      console.warn('Failed to preload some runtimes:', error);
    }
  }

  /**
   * Load a specific runtime
   */
  public async loadRuntime(language: SupportedLanguage): Promise<void> {
    if (this.runtimeInfo.get(language)?.isLoaded) {
      return;
    }

    if (this.loadingPromises.has(language)) {
      return this.loadingPromises.get(language)!;
    }

    const loadPromise = this.doLoadRuntime(language);
    this.loadingPromises.set(language, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(language);
    }
  }

  /**
   * Internal runtime loading implementation
   */
  private async doLoadRuntime(language: SupportedLanguage): Promise<void> {
    const startTime = performance.now();
    const _info = this.runtimeInfo.get(language)!;

    try {
      let runtime: any;

      switch (language) {
        case 'python':
          runtime = pythonRuntime;
          break;
        case 'java':
          runtime = javaRuntime;
          break;
        case 'go':
          runtime = goRuntime;
          break;
        case 'rust':
          runtime = rustRuntime;
          break;
        case 'typescript':
          runtime = typescriptRuntime;
          break;
        case 'cpp':
          runtime = cppRuntime;
          break;
        case 'csharp':
          runtime = csharpRuntime;
          break;
        case 'php':
          runtime = phpRuntime;
          break;
        case 'ruby':
          runtime = rubyRuntime;
          break;
        case 'lua':
          runtime = luaRuntime;
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      // Initialize the runtime
      await runtime.initialize();

      const loadTime = performance.now() - startTime;

      this.runtimes.set(language, runtime);
      this.updateRuntimeInfo(language, {
        isLoaded: true,
        isInitialized: true,
        loadTime,
        lastUsed: Date.now(),
      });

      console.log(`Loaded ${language} runtime in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error(`Failed to load ${language} runtime:`, error);
      throw error;
    }
  }

  /**
   * Execute code with specified language
   */
  public async executeCode(options: WASMExecutionOptions): Promise<WASMExecutionResult> {
    const { language, timeoutMs = 5000, memoryLimitMB = 100 } = options;

    // Load runtime if not already loaded (lazy loading)
    if (this.options.lazyLoading && !this.runtimeInfo.get(language)?.isLoaded) {
      await this.loadRuntime(language);
    }

    const runtime = this.runtimes.get(language);
    if (!runtime) {
      throw new Error(`${language} runtime is not loaded`);
    }

    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    try {
      let result: any;

      switch (language) {
        case 'python':
          result = await runtime.executeCode(options.pythonOptions || options);
          break;
        case 'java':
          result = await runtime.compileAndExecute(options.javaOptions || options);
          break;
        case 'go':
          result = await runtime.buildAndExecute(options.goOptions || options);
          break;
        case 'rust':
          result = await runtime.executeCode(options.rustOptions || options);
          break;
        case 'typescript':
          result = await runtime.executeCode(options.typescriptOptions || options);
          break;
        case 'cpp':
          result = await runtime.executeCode(options.cppOptions || options);
          break;
        case 'csharp':
          result = await runtime.executeCode(options.csharpOptions || options);
          break;
        case 'php':
          result = await runtime.executeCode(options.phpOptions || options);
          break;
        case 'ruby':
          result = await runtime.executeCode(options.rubyOptions || options);
          break;
        case 'lua':
          result = await runtime.executeCode(options.luaOptions || options);
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const executionTime = performance.now() - startTime;
      const memoryAfter = this.getMemoryUsage();
      const memoryUsed = memoryAfter - memoryBefore;

      this.updateRuntimeInfo(language, {
        lastUsed: Date.now(),
        usageCount: (this.runtimeInfo.get(language)?.usageCount ?? 0) + 1,
        memoryUsage: this.estimateRuntimeMemoryUsage(language),
      });

      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode || 0,
        executionTime,
        memoryUsed,
        language,
        runtimeInfo: this.getRuntimeInfo(language) as WASMRuntimeInfo,
        error: result.error,
        warnings: result.warnings,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime,
        memoryUsed: 0,
        language,
        runtimeInfo: this.getRuntimeInfo(language) as WASMRuntimeInfo,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Get runtime information
   */
  public getRuntimeInfo(
    language?: SupportedLanguage
  ): WASMRuntimeInfo | Map<SupportedLanguage, WASMRuntimeInfo> {
    if (language) {
      return { ...this.runtimeInfo.get(language)! };
    }
    return new Map(this.runtimeInfo);
  }

  /**
   * Update runtime information
   */
  private updateRuntimeInfo(language: SupportedLanguage, updates: Partial<WASMRuntimeInfo>): void {
    const current = this.runtimeInfo.get(language)!;
    this.runtimeInfo.set(language, { ...current, ...updates });
  }

  /**
   * Get total memory usage
   */
  public getMemoryUsage(): number {
    let total = 0;
    this.runtimeInfo.forEach((info) => {
      total += info.memoryUsage;
    });
    return total;
  }

  /**
   * Estimate runtime memory usage
   */
  private estimateRuntimeMemoryUsage(language: SupportedLanguage): number {
    const baseSizes: Partial<Record<SupportedLanguage, number>> = {
      python: 30 * 1024 * 1024, // 30MB
      java: 15 * 1024 * 1024, // 15MB
      go: 10 * 1024 * 1024, // 10MB
      rust: 8 * 1024 * 1024, // 8MB
      typescript: 5 * 1024 * 1024, // 5MB
    };
    return baseSizes[language] ?? 5 * 1024 * 1024;
  }

  /**
   * Unload idle runtimes to free memory
   */
  public unloadIdleRuntimes(): void {
    const now = Date.now();
    const idleThreshold = this.options.maxIdleTime;

    this.runtimeInfo.forEach((info, language) => {
      if (info.isLoaded && now - info.lastUsed > idleThreshold) {
        this.unloadRuntime(language);
      }
    });
  }

  /**
   * Unload a specific runtime
   */
  public unloadRuntime(language: SupportedLanguage): void {
    const runtime = this.runtimes.get(language);
    if (runtime && typeof runtime.cleanup === 'function') {
      runtime.cleanup();
    }

    this.runtimes.delete(language);
    this.updateRuntimeInfo(language, {
      isLoaded: false,
      isInitialized: false,
      memoryUsage: 0,
    });

    console.log(`Unloaded ${language} runtime`);
  }

  /**
   * Start memory cleanup timer
   */
  private startMemoryCleanup(): void {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
    }

    this.memoryCleanupTimer = setInterval(() => {
      this.unloadIdleRuntimes();

      // Check memory usage and unload least recently used if needed
      if (this.getMemoryUsage() > this.options.maxMemoryUsage) {
        this.unloadLeastRecentlyUsed();
      }
    }, this.options.memoryCleanupInterval);
  }

  /**
   * Unload least recently used runtime
   */
  private unloadLeastRecentlyUsed(): void {
    let oldestTime = Date.now();
    let oldestLanguage: SupportedLanguage | null = null;

    this.runtimeInfo.forEach((info, language) => {
      if (info.isLoaded && info.lastUsed < oldestTime) {
        oldestTime = info.lastUsed;
        oldestLanguage = language;
      }
    });

    if (oldestLanguage) {
      this.unloadRuntime(oldestLanguage);
    }
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    totalMemoryUsage: number;
    loadedRuntimes: number;
    averageLoadTime: number;
    usageStats: Record<SupportedLanguage, { usageCount: number; lastUsed: number }>;
  } {
    const stats = {
      totalMemoryUsage: this.getMemoryUsage(),
      loadedRuntimes: Array.from(this.runtimeInfo.values()).filter((info) => info.isLoaded).length,
      averageLoadTime: 0,
      usageStats: {} as Record<SupportedLanguage, { usageCount: number; lastUsed: number }>,
    };

    let totalLoadTime = 0;
    let loadedCount = 0;

    this.runtimeInfo.forEach((info, language) => {
      if (info.loadTime > 0) {
        totalLoadTime += info.loadTime;
        loadedCount++;
      }

      stats.usageStats[language] = {
        usageCount: info.usageCount,
        lastUsed: info.lastUsed,
      };
    });

    stats.averageLoadTime = loadedCount > 0 ? totalLoadTime / loadedCount : 0;

    return stats;
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
      this.memoryCleanupTimer = null;
    }

    // Unload all runtimes
    Array.from(this.runtimes.keys()).forEach((language) => {
      this.unloadRuntime(language);
    });

    this.runtimes.clear();
    this.runtimeInfo.clear();
    this.loadingPromises.clear();
  }

  /**
   * Check if a language is supported
   */
  public isSupported(language: string): language is SupportedLanguage {
    return ['python', 'java', 'go', 'rust', 'typescript'].includes(language);
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): SupportedLanguage[] {
    return ['python', 'java', 'go', 'rust', 'typescript'];
  }
}

// Singleton instance
export const wasmRuntimeManager = WASMRuntimeManager.getInstance();
