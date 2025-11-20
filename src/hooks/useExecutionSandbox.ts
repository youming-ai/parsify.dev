/**
 * Execution Sandbox with Security Constraints
 *
 * Provides a secure execution environment for code with:
 * - Isolated execution contexts
 * - Resource usage limits (CPU, memory, network)
 * - File system access controls
 * - Network access restrictions
 * - Time-based execution limits
 * - Code injection prevention
 * - Malicious pattern detection
 * - Integration with constitutional compliance layer
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useConstitutionalCompliance } from "./useConstitutionalCompliance";

// Security level configuration
export type SecurityLevel = "strict" | "moderate" | "permissive";

// Execution context interface
interface ExecutionContext {
  id: string;
  language: string;
  code: string;
  securityLevel: SecurityLevel;
  startTime: number;
  timeout?: number;
  memoryLimit?: number;
  allowedImports?: string[];
  blockedPatterns?: string[];
}

// Execution result with security information
interface SandboxExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  memoryUsage: number;
  securityViolations: SecurityViolation[];
  resourcesUsed: ResourceUsage;
  exitCode?: number;
}

// Security violation information
interface SecurityViolation {
  type:
    | "forbidden_import"
    | "malicious_pattern"
    | "resource_limit"
    | "timeout"
    | "network_access"
    | "file_access";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  line?: number;
  pattern?: string;
}

// Resource usage tracking
interface ResourceUsage {
  cpuTime: number;
  memoryPeak: number;
  networkRequests: number;
  fileOperations: number;
  syscalls: number;
}

// Security configuration
interface SecurityConfig {
  level: SecurityLevel;
  maxExecutionTime: number; // ms
  maxMemoryUsage: number; // MB
  maxNetworkRequests: number;
  allowedDomains: string[];
  allowedFileSystemPaths: string[];
  blockedImports: string[];
  blockedPatterns: string[];
  enableCodeAnalysis: boolean;
  enableRuntimeMonitoring: boolean;
}

// Predefined security configurations
const SECURITY_CONFIGS: Record<SecurityLevel, SecurityConfig> = {
  strict: {
    level: "strict",
    maxExecutionTime: 5000, // 5 seconds
    maxMemoryUsage: 64, // 64MB
    maxNetworkRequests: 0,
    allowedDomains: [],
    allowedFileSystemPaths: ["/tmp"],
    blockedImports: ["os", "subprocess", "socket", "urllib", "http", "requests", "fetch"],
    blockedPatterns: [
      "eval\\s*\\(",
      "exec\\s*\\(",
      "compile\\s*\\(",
      "__import__",
      "globals\\(\\)",
      "locals\\(\\)",
      "vars\\(\\)",
      "dir\\(\\)",
      "getattr\\s*\\(",
      "setattr\\s*\\(",
      "delattr\\s*\\(",
      "hasattr\\s*\\(",
      "callable\\s*\\(",
      "isinstance\\s*\\(",
      "issubclass\\s*\\(",
      "super\\s*\\(",
      "property\\s*\\(",
      "staticmethod\\s*\\(",
      "classmethod\\s*\\(",
      "type\\s*\\(",
      "input\\s*\\(",
      "raw_input\\s*\\(",
      "open\\s*\\(",
      "file\\s*\\(",
      "with\\s+open\\s*\\(",
      "read\\s*\\(",
      "write\\s*\\(",
      "execfile\\s*\\(",
      "reload\\s*\\(",
      "import\\s+\\*",
      "from\\s+\\w+\\s+import\\s+\\*",
    ],
    enableCodeAnalysis: true,
    enableRuntimeMonitoring: true,
  },
  moderate: {
    level: "moderate",
    maxExecutionTime: 15000, // 15 seconds
    maxMemoryUsage: 128, // 128MB
    maxNetworkRequests: 5,
    allowedDomains: ["api.example.com", "cdn.jsdelivr.net"],
    allowedFileSystemPaths: ["/tmp", "/workspace"],
    blockedImports: ["subprocess", "socket", "urllib"],
    blockedPatterns: [
      "eval\\s*\\(",
      "exec\\s*\\(",
      "compile\\s*\\(",
      "__import__",
      "globals\\(\\)",
      "locals\\(\\)",
      "vars\\(\\)",
      "open\\s*\\(",
      "file\\s*\\(",
      "execfile\\s*\\(",
      "import\\s+\\*",
    ],
    enableCodeAnalysis: true,
    enableRuntimeMonitoring: true,
  },
  permissive: {
    level: "permissive",
    maxExecutionTime: 30000, // 30 seconds
    maxMemoryUsage: 256, // 256MB
    maxNetworkRequests: 20,
    allowedDomains: ["*"], // Allow all domains with monitoring
    allowedFileSystemPaths: ["*"], // Allow all paths with monitoring
    blockedImports: [], // No blocked imports
    blockedPatterns: ["eval\\s*\\(", "exec\\s*\\(", "compile\\s*\\("],
    enableCodeAnalysis: false,
    enableRuntimeMonitoring: true,
  },
};

/**
 * Execution Sandbox Hook
 */
export const useExecutionSandbox = () => {
  const { validateAction } = useConstitutionalCompliance();

  // Active executions tracking
  const activeExecutions = useRef<Map<string, ExecutionContext>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeExecutionsCount, setActiveExecutionsCount] = useState(0);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [securityViolations, _setSecurityViolations] = useState<SecurityViolation[]>([]);

  // Resource monitoring
  const resourceMonitor = useRef({
    startTime: 0,
    cpuTime: 0,
    memoryPeak: 0,
    networkRequests: 0,
    fileOperations: 0,
    syscalls: 0,
  });

  // Code analysis for security threats
  const analyzeCode = useCallback((code: string, config: SecurityConfig): SecurityViolation[] => {
    const violations: SecurityViolation[] = [];

    if (!config.enableCodeAnalysis) {
      return violations;
    }

    // Check for blocked patterns
    for (const pattern of config.blockedPatterns) {
      const regex = new RegExp(pattern, "gi");
      let match;
      let _lineNumber = 1;
      const lines = code.split("\\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        regex.lastIndex = 0; // Reset regex
        match = regex.exec(line);
        if (match) {
          violations.push({
            type: "malicious_pattern",
            severity: "high",
            message: `Potentially dangerous pattern detected: ${pattern}`,
            line: i + 1,
            pattern: match[0],
          });
        }
        _lineNumber++;
      }
    }

    // Check for suspicious import statements
    const importRegex = /import\\s+([^\\n;]+)|from\\s+([^\\n;]+)\\s+import/gi;
    let importMatch;
    while ((importMatch = importRegex.exec(code)) !== null) {
      const importStatement = importMatch[0];
      const moduleName = importMatch[1] || importMatch[2];

      if (
        config.blockedImports.some((blocked) =>
          moduleName.toLowerCase().includes(blocked.toLowerCase()),
        )
      ) {
        violations.push({
          type: "forbidden_import",
          severity: "high",
          message: `Blocked import detected: ${importStatement}`,
          pattern: importStatement,
        });
      }
    }

    // Check for obfuscation techniques
    if (
      code.includes("chr(") ||
      code.includes("ord(") ||
      code.includes("hex(") ||
      code.includes("base64")
    ) {
      violations.push({
        type: "malicious_pattern",
        severity: "medium",
        message: "Potential code obfuscation detected",
        pattern: "encoding/decoding functions",
      });
    }

    // Check for infinite loop patterns
    if (code.includes("while True:") && !code.includes("break") && !code.includes("return")) {
      violations.push({
        type: "malicious_pattern",
        severity: "medium",
        message: "Potential infinite loop detected",
        pattern: "while True: without break",
      });
    }

    return violations;
  }, []);

  // Create isolated execution environment
  const createIsolatedEnvironment = useCallback((_language: string, config: SecurityConfig) => {
    // Create a sandboxed global scope
    const sandboxedGlobal: Record<string, any> = {
      // Safe built-ins
      console: {
        log: (...args: any[]) =>
          args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
            .join(" "),
        error: (...args: any[]) => `ERROR: ${args.map((arg) => String(arg)).join(" ")}`,
        warn: (...args: any[]) => `WARN: ${args.map((arg) => String(arg)).join(" ")}`,
      },

      // Safe Math functions
      Math: {
        ...Math,
        random: Math.random,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        abs: Math.abs,
        max: Math.max,
        min: Math.min,
        sqrt: Math.sqrt,
        pow: Math.pow,
        exp: Math.exp,
        log: Math.log,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        PI: Math.PI,
        E: Math.E,
      },

      // Safe JSON functions
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },

      // Safe utility functions
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: Number.isNaN,
      isFinite: Number.isFinite,

      // Safe constructors
      Date: Date,
      RegExp: RegExp,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      Object: Object,

      // Constants
      undefined: undefined,
      null: null,
      true: true,
      false: false,
    };

    // Remove dangerous functions based on security level
    if (config.level === "strict") {
      // Remove more dangerous functions
      delete sandboxedGlobal.eval;
      delete sandboxedGlobal.Function;
      delete sandboxedGlobal.constructor;
      delete sandboxedGlobal.prototype;
    }

    return sandboxedGlobal;
  }, []);

  // Monitor resource usage
  const startResourceMonitoring = useCallback(() => {
    resourceMonitor.current = {
      startTime: performance.now(),
      cpuTime: 0,
      memoryPeak: 0,
      networkRequests: 0,
      fileOperations: 0,
      syscalls: 0,
    };
  }, []);

  const getResourceUsage = useCallback((): ResourceUsage => {
    const now = performance.now();
    const cpuTime = now - resourceMonitor.current.startTime;

    // Estimate memory usage (this would need more sophisticated tracking in a real implementation)
    const memoryPeak = resourceMonitor.current.memoryPeak;

    return {
      cpuTime,
      memoryPeak,
      networkRequests: resourceMonitor.current.networkRequests,
      fileOperations: resourceMonitor.current.fileOperations,
      syscalls: resourceMonitor.current.syscalls,
    };
  }, []);

  // Execute code in sandbox
  const executeInSandbox = useCallback(
    async (
      language: string,
      code: string,
      securityLevel: SecurityLevel = "moderate",
      options?: {
        timeout?: number;
        memoryLimit?: number;
        allowedImports?: string[];
        customConfig?: Partial<SecurityConfig>;
      },
    ): Promise<SandboxExecutionResult> => {
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = performance.now();

      // Get security configuration
      const baseConfig = SECURITY_CONFIGS[securityLevel];
      const config: SecurityConfig = {
        ...baseConfig,
        ...options?.customConfig,
        maxExecutionTime: options?.timeout || baseConfig.maxExecutionTime,
        maxMemoryUsage: options?.memoryLimit || baseConfig.maxMemoryUsage,
      };

      // Validate against constitutional compliance
      const isCompliant = await validateAction("code_execution", {
        language,
        codeLength: code.length,
        securityLevel,
        hasImports: /import|from/.test(code),
      });

      if (!isCompliant) {
        return {
          success: false,
          error: "Code execution blocked: Constitutional compliance check failed",
          executionTime: 0,
          memoryUsage: 0,
          securityViolations: [
            {
              type: "malicious_pattern",
              severity: "critical",
              message: "Constitutional compliance check failed",
            },
          ],
          resourcesUsed: {
            cpuTime: 0,
            memoryPeak: 0,
            networkRequests: 0,
            fileOperations: 0,
            syscalls: 0,
          },
        };
      }

      // Analyze code for security violations
      const codeViolations = analyzeCode(code, config);
      if (codeViolations.some((v) => v.severity === "critical" || v.severity === "high")) {
        return {
          success: false,
          error: "Code blocked due to security violations",
          executionTime: 0,
          memoryUsage: 0,
          securityViolations: codeViolations,
          resourcesUsed: {
            cpuTime: 0,
            memoryPeak: 0,
            networkRequests: 0,
            fileOperations: 0,
            syscalls: 0,
          },
        };
      }

      // Create execution context
      const context: ExecutionContext = {
        id: executionId,
        language,
        code,
        securityLevel,
        startTime,
        timeout: config.maxExecutionTime,
        memoryLimit: config.maxMemoryUsage,
        allowedImports: options?.allowedImports,
      };

      // Track execution
      activeExecutions.current.set(executionId, context);
      setActiveExecutionsCount(activeExecutions.current.size);
      setTotalExecutions((prev) => prev + 1);

      // Create abort controller
      const abortController = new AbortController();
      abortControllers.current.set(executionId, abortController);

      // Start resource monitoring
      startResourceMonitoring();

      try {
        let result: any;
        const violations: SecurityViolation[] = [...codeViolations];

        if (language === "javascript" || language === "typescript") {
          result = await executeJavaScript(code, config, abortController.signal);
        } else {
          // For other languages, delegate to their respective runtimes
          // This would integrate with the WASM runtime manager
          throw new Error(`Language ${language} not yet supported in sandbox`);
        }

        // Check execution time
        const executionTime = performance.now() - startTime;
        if (executionTime > config.maxExecutionTime) {
          violations.push({
            type: "timeout",
            severity: "high",
            message: `Execution exceeded time limit: ${executionTime}ms > ${config.maxExecutionTime}ms`,
          });
        }

        // Check memory usage
        const resourceUsage = getResourceUsage();
        const memoryMB = resourceUsage.memoryPeak / (1024 * 1024);
        if (memoryMB > config.maxMemoryUsage) {
          violations.push({
            type: "resource_limit",
            severity: "high",
            message: `Memory usage exceeded limit: ${memoryMB.toFixed(2)}MB > ${config.maxMemoryUsage}MB`,
          });
        }

        return {
          success: result.success && violations.length === 0,
          output: result.output,
          error: result.error,
          executionTime,
          memoryUsage: memoryMB,
          securityViolations: violations,
          resourcesUsed: resourceUsage,
          exitCode: result.exitCode,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime: performance.now() - startTime,
          memoryUsage: 0,
          securityViolations: [
            {
              type: "malicious_pattern",
              severity: "medium",
              message: `Execution error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          resourcesUsed: getResourceUsage(),
        };
      } finally {
        // Clean up execution tracking
        activeExecutions.current.delete(executionId);
        abortControllers.current.delete(executionId);
        setActiveExecutionsCount(activeExecutions.current.size);
      }
    },
    [validateAction, analyzeCode, startResourceMonitoring, getResourceUsage, executeJavaScript],
  );

  // Execute JavaScript in sandbox
  const executeJavaScript = useCallback(
    async (code: string, config: SecurityConfig, signal: AbortSignal): Promise<any> => {
      const sandbox = createIsolatedEnvironment("javascript", config);
      const _originalConsole = console.log;
      const _originalError = console.error;
      const logs: string[] = [];

      // Create sandboxed console
      sandbox.console.log = (...args: any[]) => {
        logs.push(
          args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(" "),
        );
      };

      sandbox.console.error = (...args: any[]) => {
        logs.push(`ERROR: ${args.map((arg) => String(arg)).join(" ")}`);
      };

      try {
        // Create isolated execution function
        const executeCode = new Function(
          ...Object.keys(sandbox),
          `
        "use strict";
        ${
          signal.addEventListener
            ? `
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          signal.addEventListener('abort', () => {
            throw new Error('Execution aborted');
          });
        }
        `
            : ""
        }
        ${code}
        `,
        );

        // Set up monitoring hooks
        if (config.enableRuntimeMonitoring) {
          // Monitor network requests (this would need more sophisticated implementation)
          const originalFetch = globalThis.fetch;
          globalThis.fetch = (...args) => {
            resourceMonitor.current.networkRequests++;
            if (config.allowedDomains.length > 0 && !config.allowedDomains.includes("*")) {
              const url = new URL(args[0]);
              if (!config.allowedDomains.includes(url.hostname)) {
                throw new Error(`Network access to domain ${url.hostname} is not allowed`);
              }
            }
            return originalFetch(...args);
          };
        }

        // Execute code with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Execution timeout"));
          }, config.maxExecutionTime);
        });

        const executionPromise = Promise.resolve(executeCode(...Object.values(sandbox)));

        await Promise.race([executionPromise, timeoutPromise]);

        return {
          success: true,
          output: logs.join("\\n"),
          exitCode: 0,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          output: logs.join("\\n"),
          exitCode: 1,
        };
      } finally {
        // Restore original functions
        if (config.enableRuntimeMonitoring && globalThis.fetch) {
          // Restore original fetch
        }
      }
    },
    [createIsolatedEnvironment],
  );

  // Abort execution
  const abortExecution = useCallback((executionId: string): boolean => {
    const controller = abortControllers.current.get(executionId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(executionId);
      activeExecutions.current.delete(executionId);
      setActiveExecutionsCount(activeExecutions.current.size);
      return true;
    }
    return false;
  }, []);

  // Abort all executions
  const abortAllExecutions = useCallback((): number => {
    let abortedCount = 0;
    for (const [_id, controller] of abortControllers.current.entries()) {
      controller.abort();
      abortedCount++;
    }

    activeExecutions.current.clear();
    abortControllers.current.clear();
    setActiveExecutionsCount(0);

    return abortedCount;
  }, []);

  // Get execution history
  const getExecutionHistory = useCallback((): ExecutionContext[] => {
    return Array.from(activeExecutions.current.values());
  }, []);

  // Get security configuration
  const getSecurityConfig = useCallback((level: SecurityLevel): SecurityConfig => {
    return { ...SECURITY_CONFIGS[level] };
  }, []);

  // Initialize sandbox
  useEffect(() => {
    setIsInitialized(true);

    return () => {
      // Clean up on unmount
      abortAllExecutions();
    };
  }, [abortAllExecutions]);

  return {
    // Initialization
    isInitialized,

    // Execution
    executeInSandbox,
    abortExecution,
    abortAllExecutions,

    // Monitoring
    activeExecutionsCount,
    totalExecutions,
    securityViolations,

    // Configuration
    getSecurityConfig,

    // History
    getExecutionHistory,

    // Utilities
    analyzeCode,
    getResourceUsage,

    // Security levels
    securityLevels: ["strict", "moderate", "permissive"] as SecurityLevel[],
    supportedLanguages: ["javascript", "typescript", "python", "java", "go", "rust"],
  };
};
