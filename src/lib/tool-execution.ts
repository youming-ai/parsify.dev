/**
 * Tool Execution Service
 * Provides standardized execution interface for all tools
 */

export interface ExecutionContext {
  toolId: string;
  sessionId?: string;
  userId?: string;
  timestamp: number;
  timeout?: number;
  memoryLimit?: number;
  environment?: Record<string, string>;
  permissions?: {
    network?: boolean;
    fileSystem?: boolean;
    crypto?: boolean;
    wasm?: boolean;
  };
}

export interface ExecutionRequest {
  id: string;
  toolId: string;
  input: any;
  config?: Record<string, any>;
  context: ExecutionContext;
  priority?: "low" | "normal" | "high" | "critical";
}

export interface ExecutionResult {
  id: string;
  success: boolean;
  output?: any;
  error?: string;
  metadata: {
    executionTime: number;
    memoryUsed: number;
    cpuTime: number;
    operationsCount?: number;
    bytesProcessed?: number;
  };
  logs: Array<{
    level: "debug" | "info" | "warn" | "error";
    message: string;
    timestamp: number;
  }>;
  context: ExecutionContext;
}

export interface ExecutionProgress {
  id: string;
  progress: number; // 0-100
  stage: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface ToolExecutor {
  toolId: string;
  name: string;
  description: string;
  version: string;

  // Core execution methods
  execute(request: ExecutionRequest): Promise<ExecutionResult>;

  // Optional methods for enhanced functionality
  validate?(
    input: any,
    config?: Record<string, any>,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  getSchema?(): {
    input: any;
    config?: any;
    output: any;
  };

  getDefaultConfig?(): Record<string, any>;

  // Resource requirements
  getResourceRequirements?(): {
    maxMemory?: number;
    maxExecutionTime?: number;
    requiresNetwork?: boolean;
    requiresWasm?: boolean;
  };

  // Lifecycle hooks
  onBeforeExecute?(request: ExecutionRequest): Promise<void>;
  onAfterExecute?(request: ExecutionRequest, result: ExecutionResult): Promise<void>;
  onError?(request: ExecutionRequest, error: Error): Promise<void>;
}

export class ToolExecutionService {
  private executors: Map<string, ToolExecutor>;
  private activeExecutions: Map<string, AbortController>;
  private executionQueue: ExecutionRequest[];
  private maxConcurrentExecutions: number;
  private eventListeners: Map<string, Function[]>;

  private constructor(
    config: {
      maxConcurrentExecutions?: number;
      defaultTimeout?: number;
      defaultMemoryLimit?: number;
    } = {},
  ) {
    this.executors = new Map();
    this.activeExecutions = new Map();
    this.executionQueue = [];
    this.maxConcurrentExecutions = config.maxConcurrentExecutions || 5;
    this.defaultTimeout = config.defaultTimeout || 5000; // 5 seconds
    this.defaultMemoryLimit = config.defaultMemoryLimit || 100 * 1024 * 1024; // 100MB
    this.eventListeners = new Map();

    this.startExecutionLoop();
  }

  public static getInstance(config?: {
    maxConcurrentExecutions?: number;
    defaultTimeout?: number;
    defaultMemoryLimit?: number;
  }): ToolExecutionService {
    if (!ToolExecutionService.instance) {
      ToolExecutionService.instance = new ToolExecutionService(config);
    }
    return ToolExecutionService.instance;
  }

  /**
   * Register a tool executor
   */
  public registerExecutor(executor: ToolExecutor): void {
    this.executors.set(executor.toolId, executor);
    this.emit("executor:registered", { toolId: executor.toolId, executor });
  }

  /**
   * Unregister a tool executor
   */
  public unregisterExecutor(toolId: string): void {
    this.executors.delete(toolId);
    this.emit("executor:unregistered", { toolId });
  }

  /**
   * Get registered executor
   */
  public getExecutor(toolId: string): ToolExecutor | null {
    return this.executors.get(toolId) || null;
  }

  /**
   * Get all registered executors
   */
  public getAllExecutors(): ToolExecutor[] {
    return Array.from(this.executors.values());
  }

  /**
   * Execute a tool
   */
  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // Validate request
    this.validateExecutionRequest(request);

    // Get executor
    const executor = this.executors.get(request.toolId);
    if (!executor) {
      throw new Error(`No executor registered for tool: ${request.toolId}`);
    }

    // Set defaults
    const context: ExecutionContext = {
      timeout: this.defaultTimeout,
      memoryLimit: this.defaultMemoryLimit,
      permissions: {
        network: false,
        fileSystem: false,
        crypto: true,
        wasm: false,
      },
      ...request.context,
    };

    const enhancedRequest: ExecutionRequest = {
      ...request,
      context,
    };

    // Check if executor is available
    if (this.activeExecutions.size >= this.maxConcurrentExecutions) {
      // Add to queue
      this.executionQueue.push(enhancedRequest);
      this.emit("execution:queued", { request: enhancedRequest });

      // Wait for execution
      return new Promise((resolve, reject) => {
        const _originalExecute = executor.execute.bind(executor);
        const executeWithCleanup = async (req: ExecutionRequest) => {
          try {
            const result = await this.executeWithMonitoring(req, executor);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        // Store in queue for later execution
        (enhancedRequest as any)._resolve = executeWithCleanup;
      });
    }

    // Execute immediately
    return this.executeWithMonitoring(enhancedRequest, executor);
  }

  /**
   * Execute with monitoring and resource management
   */
  private async executeWithMonitoring(
    request: ExecutionRequest,
    executor: ToolExecutor,
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    const abortController = new AbortController();

    // Register as active execution
    this.activeExecutions.set(request.id, abortController);
    this.emit("execution:started", { request });

    try {
      // Check resource requirements
      if (executor.getResourceRequirements) {
        const requirements = executor.getResourceRequirements();

        if (requirements.maxMemory && requirements.maxMemory > request.context.memoryLimit!) {
          throw new Error(
            `Tool requires ${requirements.maxMemory} bytes, but limit is ${request.context.memoryLimit} bytes`,
          );
        }

        if (
          requirements.maxExecutionTime &&
          requirements.maxExecutionTime > request.context.timeout!
        ) {
          throw new Error(
            `Tool requires ${requirements.maxExecutionTime}ms, but timeout is ${request.context.timeout}ms`,
          );
        }
      }

      // Validate input if validator exists
      if (executor.validate) {
        const validation = await executor.validate(request.input, request.config);
        if (!validation.valid) {
          throw new Error(`Input validation failed: ${validation.errors.join(", ")}`);
        }
      }

      // Call before execute hook
      if (executor.onBeforeExecute) {
        await executor.onBeforeExecute(request);
      }

      // Setup timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new Error(`Execution timeout after ${request.context.timeout}ms`));
        }, request.context.timeout);
      });

      // Execute with abort support
      const executionPromise = executor.execute(request);

      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Calculate metrics
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      const executionTime = endTime - startTime;
      const memoryUsed = Math.max(0, endMemory - startMemory);

      // Enhance result with metrics
      const enhancedResult: ExecutionResult = {
        ...result,
        metadata: {
          executionTime,
          memoryUsed,
          cpuTime: executionTime, // Simplified - real CPU time would require more complex monitoring
          ...result.metadata,
        },
      };

      // Call after execute hook
      if (executor.onAfterExecute) {
        await executor.onAfterExecute(request, enhancedResult);
      }

      this.emit("execution:completed", { request, result: enhancedResult });
      return enhancedResult;
    } catch (error) {
      // Call error hook
      if (executor.onError) {
        await executor.onError(request, error as Error);
      }

      const errorResult: ExecutionResult = {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          executionTime: performance.now() - startTime,
          memoryUsed: Math.max(0, this.getMemoryUsage() - startMemory),
          cpuTime: 0,
        },
        logs: [
          {
            level: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: Date.now(),
          },
        ],
        context: request.context,
      };

      this.emit("execution:failed", { request, error: errorResult });
      return errorResult;
    } finally {
      // Cleanup
      this.activeExecutions.delete(request.id);
      this.processQueue();
    }
  }

  /**
   * Process execution queue
   */
  private processQueue(): void {
    if (this.executionQueue.length === 0) return;
    if (this.activeExecutions.size >= this.maxConcurrentExecutions) return;

    const request = this.executionQueue.shift();
    if (request && (request as any)._resolve) {
      (request as any)._resolve(request);
    }
  }

  /**
   * Cancel execution
   */
  public cancelExecution(executionId: string): boolean {
    const abortController = this.activeExecutions.get(executionId);
    if (abortController) {
      abortController.abort();
      this.activeExecutions.delete(executionId);
      this.emit("execution:cancelled", { executionId });
      return true;
    }

    // Also remove from queue if pending
    const queueIndex = this.executionQueue.findIndex((req) => req.id === executionId);
    if (queueIndex !== -1) {
      this.executionQueue.splice(queueIndex, 1);
      this.emit("execution:cancelled", { executionId });
      return true;
    }

    return false;
  }

  /**
   * Get execution status
   */
  public getExecutionStatus(
    executionId: string,
  ): "pending" | "running" | "completed" | "cancelled" | "not-found" {
    if (this.activeExecutions.has(executionId)) {
      return "running";
    }

    if (this.executionQueue.some((req) => req.id === executionId)) {
      return "pending";
    }

    return "not-found"; // Would need persistence for completed status
  }

  /**
   * Get active executions
   */
  public getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  /**
   * Get queued executions
   */
  public getQueuedExecutions(): string[] {
    return this.executionQueue.map((req) => req.id);
  }

  /**
   * Clear queue
   */
  public clearQueue(): void {
    this.executionQueue.length = 0;
    this.emit("queue:cleared");
  }

  /**
   * Get memory usage (simplified)
   */
  private getMemoryUsage(): number {
    if (typeof performance !== "undefined" && "memory" in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Validate execution request
   */
  private validateExecutionRequest(request: ExecutionRequest): void {
    if (!request.id) {
      throw new Error("Execution request must have an ID");
    }

    if (!request.toolId) {
      throw new Error("Execution request must have a tool ID");
    }

    if (!request.context) {
      throw new Error("Execution request must have context");
    }

    if (request.context.timeout && request.context.timeout <= 0) {
      throw new Error("Timeout must be greater than 0");
    }

    if (request.context.memoryLimit && request.context.memoryLimit <= 0) {
      throw new Error("Memory limit must be greater than 0");
    }
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
        console.error(`Error in execution service event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Get execution statistics
   */
  public getStatistics(): {
    registeredExecutors: number;
    activeExecutions: number;
    queuedExecutions: number;
    maxConcurrentExecutions: number;
  } {
    return {
      registeredExecutors: this.executors.size,
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.length,
      maxConcurrentExecutions: this.maxConcurrentExecutions,
    };
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Cancel all active executions
    this.activeExecutions.forEach((controller, _id) => {
      controller.abort();
    });
    this.activeExecutions.clear();

    // Clear queue
    this.executionQueue.length = 0;

    // Clear listeners
    this.eventListeners.clear();

    this.emit("service:disposed", {});
  }
}

export default ToolExecutionService;
