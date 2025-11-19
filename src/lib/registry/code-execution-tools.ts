/**
 * Code Execution Tools Registration
 *
 * Registers all code execution environment tools with the tool registry
 * including timeout configurations, security settings, and resource limits
 */

import React, { lazy } from 'react';
import { ToolRegistry } from './tool-registry';
import type { ToolMetadata } from './tool-registry';

// Get the tool registry instance
const toolRegistry = ToolRegistry.getInstance();

/**
 * Register all Code Execution Environment tools
 */
export function registerCodeExecutionTools(): void {
  // Python Executor Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'python-executor',
      name: 'Python Executor',
      description: 'Execute Python code in a WebAssembly sandbox with Pyodide runtime and package management',
      category: 'code',
      version: '1.0.0',
      bundleSize: 1024 * 1024, // 1MB (Pyodide is large but lazy-loaded)
      loadTime: 3000, // 3 seconds initial load time
      dependencies: ['pyodide', 'numpy', 'pandas'],
      tags: ['python', 'pyodide', 'wasm', 'execute', 'code', 'programming', 'data-science', 'ml'],
      enabled: true,
      priority: 3, // High priority - popular language
      requiresWasm: true,
      requiresWorker: true,
      icon: '🐍',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/python-executor').then(m => ({
      default: m.PythonExecutor
    }))),
    importer: () => import('../../components/tools/code-execution/python-executor')
  });

  // Java Executor Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'java-executor',
      name: 'Java Executor',
      description: 'Compile and execute Java code using TeaVM WebAssembly compiler',
      category: 'code',
      version: '1.0.0',
      bundleSize: 512 * 1024, // 512KB
      loadTime: 2000, // 2 seconds
      dependencies: ['teavm'],
      tags: ['java', 'teavm', 'wasm', 'compile', 'execute', 'object-oriented', 'jvm', 'enterprise'],
      enabled: true,
      priority: 2, // Medium priority
      requiresWasm: true,
      requiresWorker: true,
      icon: '☕',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/java-executor').then(m => ({
      default: m.JavaExecutor
    }))),
    importer: () => import('../../components/tools/code-execution/java-executor')
  });

  // Go Executor Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'go-executor',
      name: 'Go Executor',
      description: 'Compile and execute Go code using TinyGo WebAssembly compiler',
      category: 'code',
      version: '1.0.0',
      bundleSize: 384 * 1024, // 384KB
      loadTime: 1500, // 1.5 seconds
      dependencies: ['tinygo'],
      tags: ['go', 'tinygo', 'wasm', 'compile', 'execute', 'golang', 'concurrent', 'systems'],
      enabled: true,
      priority: 2, // Medium priority
      requiresWasm: true,
      requiresWorker: true,
      icon: '🔷',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/go-executor').then(m => ({
      default: m.GoExecutor
    }))),
    importer: () => import('../../components/tools/code-execution/go-executor')
  });

  // Rust Executor Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'rust-executor',
      name: 'Rust Executor',
      description: 'Compile and execute Rust code with native WebAssembly compilation and Cargo-like features',
      category: 'code',
      version: '1.0.0',
      bundleSize: 640 * 1024, // 640KB
      loadTime: 2500, // 2.5 seconds (Rust compilation can be slower)
      dependencies: ['rustc-wasm'],
      tags: ['rust', 'cargo', 'wasm', 'compile', 'execute', 'systems', 'memory-safety', 'performance'],
      enabled: true,
      priority: 2, // Medium priority
      requiresWasm: true,
      requiresWorker: true,
      icon: '🦀',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/rust-executor').then(m => ({
      default: m.RustExecutor
    }))),
    importer: () => import('../../components/tools/code-execution/rust-executor')
  });

  // TypeScript Transpiler Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'typescript-transpiler',
      name: 'TypeScript Transpiler',
      description: 'Edit, compile, and execute TypeScript code with real-time type checking and Deno runtime integration',
      category: 'code',
      version: '1.0.0',
      bundleSize: 256 * 1024, // 256KB
      loadTime: 1000, // 1 second (transpilation is fast)
      dependencies: ['typescript', 'deno'],
      tags: ['typescript', 'deno', 'transpiler', 'compiler', 'javascript', 'types', 'intellisense', 'web'],
      enabled: true,
      priority: 3, // High priority - very popular
      requiresWasm: false, // JavaScript runtime, no WASM needed
      requiresWorker: true,
      icon: '📘',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/typescript-transpiler').then(m => ({
      default: m.TypeScriptTranspiler
    }))),
    importer: () => import('../../components/tools/code-execution/typescript-transpiler')
  });

  // Code Execution Sandbox Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'execution-sandbox',
      name: 'Code Execution Sandbox',
      description: 'Secure sandbox environment for executing code with configurable security constraints and resource limits',
      category: 'code',
      version: '1.0.0',
      bundleSize: 128 * 1024, // 128KB - lightweight sandbox
      loadTime: 500, // 0.5 seconds - fast initialization
      dependencies: [],
      tags: ['sandbox', 'security', 'execution', 'isolation', 'resource-limits', 'monitoring', 'safe'],
      enabled: true,
      priority: 4, // Highest priority - security critical
      requiresWasm: false,
      requiresWorker: true,
      icon: '🛡️',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/execution-sandbox').then(m => ({
      default: m.ExecutionSandbox
    }))),
    importer: () => import('../../components/tools/code-execution/execution-sandbox')
  });

  // Console Output Manager Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'console-manager',
      name: 'Console Output Manager',
      description: 'Comprehensive console output capture and management system with filtering and export capabilities',
      category: 'code',
      version: '1.0.0',
      bundleSize: 96 * 1024, // 96KB - very lightweight
      loadTime: 300, // 0.3 seconds - instant
      dependencies: [],
      tags: ['console', 'logging', 'output', 'monitoring', 'filtering', 'export', 'debugging'],
      enabled: true,
      priority: 4, // Highest priority - essential for all code execution
      requiresWasm: false,
      requiresWorker: false, // Runs in main thread
      icon: '📊',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/console-manager').then(m => ({
      default: m.ConsoleManager
    }))),
    importer: () => import('../../components/tools/code-execution/console-manager')
  });

  // WebAssembly Runtime Manager Tool Registration
  toolRegistry.registerTool({
    metadata: {
      id: 'wasm-runtime-manager',
      name: 'WASM Runtime Manager',
      description: 'Centralized management for multiple language WebAssembly runtimes with lazy loading and lifecycle management',
      category: 'code',
      version: '1.0.0',
      bundleSize: 192 * 1024, // 192KB
      loadTime: 800, // 0.8 seconds
      dependencies: [],
      tags: ['wasm', 'runtime', 'manager', 'lifecycle', 'lazy-loading', 'performance', 'memory'],
      enabled: true,
      priority: 4, // Highest priority - core infrastructure
      requiresWasm: true,
      requiresWorker: true,
      icon: '⚙️',
      author: 'Parsify Development Team',
      license: 'MIT'
    },
    component: lazy(() => import('../../components/tools/code-execution/wasm-runtime-manager').then(m => ({
      default: m.WasmRuntimeManager
    }))),
    importer: () => import('../../components/tools/code-execution/wasm-runtime-manager')
  });
}

/**
 * Get timeout configurations for code execution tools
 */
export function getCodeExecutionTimeouts(): Record<string, {
  default: number;
  maximum: number;
  compilation?: number;
}> {
  return {
    'python-executor': {
      default: 10000, // 10 seconds
      maximum: 30000  // 30 seconds
    },
    'java-executor': {
      default: 15000, // 15 seconds (includes compilation time)
      maximum: 45000, // 45 seconds
      compilation: 10000 // 10 seconds for compilation only
    },
    'go-executor': {
      default: 12000, // 12 seconds
      maximum: 36000, // 36 seconds
      compilation: 8000 // 8 seconds for compilation
    },
    'rust-executor': {
      default: 18000, // 18 seconds (Rust compilation can be slower)
      maximum: 60000, // 60 seconds
      compilation: 15000 // 15 seconds for compilation
    },
    'typescript-transpiler': {
      default: 8000, // 8 seconds (transpilation is fast)
      maximum: 20000  // 20 seconds
    },
    'execution-sandbox': {
      default: 5000, // 5 seconds (stricter for sandbox)
      maximum: 15000  // 15 seconds
    },
    'console-manager': {
      default: 0, // No timeout - this is a monitoring tool
      maximum: 0
    },
    'wasm-runtime-manager': {
      default: 30000, // 30 seconds for runtime operations
      maximum: 120000 // 2 minutes
    }
  };
}

/**
 * Get memory limit configurations for code execution tools
 */
export function getCodeExecutionMemoryLimits(): Record<string, {
  default: number; // MB
  maximum: number; // MB
}> {
  return {
    'python-executor': {
      default: 128, // 128MB
      maximum: 256  // 256MB
    },
    'java-executor': {
      default: 192, // 192MB (JVM overhead)
      maximum: 512  // 512MB
    },
    'go-executor': {
      default: 160, // 160MB
      maximum: 384  // 384MB
    },
    'rust-executor': {
      default: 256, // 256MB
      maximum: 512  // 512MB
    },
    'typescript-transpiler': {
      default: 96,  // 96MB
      maximum: 192  // 192MB
    },
    'execution-sandbox': {
      default: 64,  // 64MB (conservative for security)
      maximum: 128  // 128MB
    },
    'console-manager': {
      default: 32,  // 32MB for log storage
      maximum: 64   // 64MB
    },
    'wasm-runtime-manager': {
      default: 384, // 384MB for managing multiple runtimes
      maximum: 768  // 768MB
    }
  };
}

/**
 * Get security level configurations for code execution tools
 */
export function getCodeExecutionSecurityLevels(): Record<string, {
  default: 'strict' | 'moderate' | 'permissive';
  allowedLevels: ('strict' | 'moderate' | 'permissive')[];
}> {
  return {
    'python-executor': {
      default: 'moderate',
      allowedLevels: ['strict', 'moderate']
    },
    'java-executor': {
      default: 'moderate',
      allowedLevels: ['strict', 'moderate']
    },
    'go-executor': {
      default: 'moderate',
      allowedLevels: ['strict', 'moderate']
    },
    'rust-executor': {
      default: 'moderate',
      allowedLevels: ['strict', 'moderate']
    },
    'typescript-transpiler': {
      default: 'moderate',
      allowedLevels: ['strict', 'moderate', 'permissive']
    },
    'execution-sandbox': {
      default: 'strict',
      allowedLevels: ['strict', 'moderate']
    },
    'console-manager': {
      default: 'permissive',
      allowedLevels: ['permissive']
    },
    'wasm-runtime-manager': {
      default: 'strict',
      allowedLevels: ['strict']
    }
  };
}

/**
 * Initialize all code execution tools
 * Call this function during application startup
 */
export async function initializeCodeExecutionTools(): Promise<void> {
  try {
    // Register all tools
    registerCodeExecutionTools();

    // Preload essential tools (highest priority)
    const essentialTools = [
      'console-manager',
      'execution-sandbox',
      'wasm-runtime-manager'
    ];

    const registry = ToolRegistry.getInstance();

    for (const toolId of essentialTools) {
      try {
        await registry.loadTool(toolId);
        console.log(`✅ Preloaded essential tool: ${toolId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to preload tool ${toolId}:`, error);
      }
    }

    console.log('🚀 Code execution tools initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize code execution tools:', error);
    throw error;
  }
}
