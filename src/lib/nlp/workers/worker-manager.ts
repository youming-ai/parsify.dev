/**
 * Worker Manager
 * Manages Web Worker pool for NLP operations with load balancing and fault tolerance
 */

import { NlpWorker, WorkerMessage, WorkerResponse } from "./nlp-worker";

export interface WorkerConfig {
  maxWorkers: number;
  workerUrl: string;
  timeoutMs: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  maxMemoryUsage: number;
  loadBalancing: "round-robin" | "least-loaded" | "random";
}

export interface WorkerInstance {
  id: string;
  worker: Worker;
  busy: boolean;
  createdAt: Date;
  lastUsed: Date;
  healthStatus: "healthy" | "unhealthy" | "checking";
  operations: number;
  memoryUsage: number;
  errorCount: number;
  currentTask?: {
    id: string;
    operation: string;
    startTime: number;
  };
}

export interface TaskRequest<T = any> {
  id: string;
  operation: string;
  data: T;
  priority?: number;
  timeoutMs?: number;
  retries?: number;
  onProgress?: (progress: any) => void;
}

export interface TaskResult<T = any> {
  id: string;
  result: T;
  workerId: string;
  processingTime: number;
  timestamp: Date;
}

export interface WorkerManagerStats {
  totalWorkers: number;
  activeWorkers: number;
  busyWorkers: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageProcessingTime: number;
  workerHealthStatus: Record<string, WorkerInstance["healthStatus"]>;
  memoryUsage: {
    total: number;
    average: number;
    peak: number;
  };
  queueLength: number;
}

export class NlpWorkerManager {
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: TaskRequest[] = [];
  private pendingTasks: Map<
    string,
    {
      resolve: (result: any) => void;
      reject: (error: Error) => void;
      onProgress?: (progress: any) => void;
    }
  > = new Map();
  private config: WorkerConfig;
  private isInitialized = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private nextWorkerIndex = 0;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      maxWorkers: Math.min(navigator.hardwareConcurrency || 4, 8),
      workerUrl: "/workers/nlp-worker.js",
      timeoutMs: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
      healthCheckInterval: 30000, // 30 seconds
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB per worker
      loadBalancing: "least-loaded",
      ...config,
    };
  }

  /**
   * Initialize worker pool
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create initial worker
      await this.createWorker();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      console.log(
        `NLP Worker Manager initialized with ${this.config.maxWorkers} max workers`,
      );
    } catch (error) {
      throw new Error(`Failed to initialize worker manager: ${error}`);
    }
  }

  /**
   * Execute a task using worker pool
   */
  public async executeTask<T = any, R = any>(
    task: TaskRequest<T>,
  ): Promise<TaskResult<R>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise<TaskResult<R>>((resolve, reject) => {
      const enhancedTask = {
        ...task,
        timeoutMs: task.timeoutMs || this.config.timeoutMs,
        retries: task.retries || this.config.retryAttempts,
      };

      // Store promise handlers
      this.pendingTasks.set(task.id, {
        resolve: resolve as any,
        reject,
        onProgress: task.onProgress,
      });

      // Add to queue
      this.taskQueue.push(enhancedTask as TaskRequest);
      this.processQueue();
    });
  }

  /**
   * Load model in a worker
   */
  public async loadModel(
    modelId: string,
    modelUrl?: string,
    modelConfig?: any,
  ): Promise<void> {
    const worker = await this.getAvailableWorker();

    return new Promise<void>((resolve, reject) => {
      const taskId = this.generateId();
      const message: WorkerMessage = {
        id: taskId,
        type: "load_model",
        operation: "load_model",
        data: {
          modelId,
          modelUrl,
          modelConfig,
        },
        timestamp: Date.now(),
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Model load timeout for ${modelId}`));
      }, this.config.timeoutMs);

      this.pendingTasks.set(taskId, {
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      this.setupWorkerMessageHandler(worker.worker, taskId);
      worker.worker.postMessage(message);
    });
  }

  /**
   * Initialize all workers
   */
  public async initializeWorkers(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 1; i < this.config.maxWorkers; i++) {
      promises.push(this.createWorker());
    }

    await Promise.all(promises);
  }

  /**
   * Get worker statistics
   */
  public getStats(): WorkerManagerStats {
    const workers = Array.from(this.workers.values());
    const activeWorkers = workers.filter((w) => w.healthStatus === "healthy");
    const busyWorkers = workers.filter((w) => w.busy);

    const totalOperations = workers.reduce((sum, w) => sum + w.operations, 0);
    const memoryUsages = workers.map((w) => w.memoryUsage);
    const totalMemory = memoryUsages.reduce((sum, mem) => sum + mem, 0);
    const averageMemory =
      memoryUsages.length > 0 ? totalMemory / memoryUsages.length : 0;
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;

    return {
      totalWorkers: workers.length,
      activeWorkers: activeWorkers.length,
      busyWorkers: busyWorkers.length,
      totalOperations,
      successfulOperations: 0, // Would need to track this
      failedOperations: 0, // Would need to track this
      averageProcessingTime: 0, // Would need to track this
      workerHealthStatus: workers.reduce(
        (status, worker) => {
          status[worker.id] = worker.healthStatus;
          return status;
        },
        {} as Record<string, WorkerInstance["healthStatus"]>,
      ),
      memoryUsage: {
        total: totalMemory,
        average: averageMemory,
        peak: peakMemory,
      },
      queueLength: this.taskQueue.length,
    };
  }

  /**
   * Get detailed worker information
   */
  public getWorkerInfo(): Array<{
    id: string;
    busy: boolean;
    healthStatus: string;
    operations: number;
    memoryUsage: number;
    errorCount: number;
    uptime: number;
    currentTask?: string;
  }> {
    return Array.from(this.workers.values()).map((worker) => ({
      id: worker.id,
      busy: worker.busy,
      healthStatus: worker.healthStatus,
      operations: worker.operations,
      memoryUsage: worker.memoryUsage,
      errorCount: worker.errorCount,
      uptime: Date.now() - worker.createdAt.getTime(),
      currentTask: worker.currentTask?.operation,
    }));
  }

  /**
   * Dispose all workers
   */
  public async dispose(): Promise<void> {
    this.stopHealthMonitoring();

    // Dispose all workers
    const disposePromises = Array.from(this.workers.values()).map((worker) =>
      this.disposeWorker(worker),
    );

    await Promise.allSettled(disposePromises);

    this.workers.clear();
    this.taskQueue.length = 0;
    this.pendingTasks.clear();
    this.isInitialized = false;
  }

  // Private methods

  private async createWorker(): Promise<WorkerInstance> {
    if (this.workers.size >= this.config.maxWorkers) {
      throw new Error("Maximum worker limit reached");
    }

    const workerId = this.generateId();
    let worker: Worker;

    try {
      // Create worker from blob for inline worker
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);

      worker = new Worker(workerUrl);

      // Clean up blob URL after worker is created
      setTimeout(() => URL.revokeObjectURL(workerUrl), 1000);
    } catch (error) {
      // Fallback to external worker file
      worker = new Worker(this.config.workerUrl);
    }

    const workerInstance: WorkerInstance = {
      id: workerId,
      worker,
      busy: false,
      createdAt: new Date(),
      lastUsed: new Date(),
      healthStatus: "checking",
      operations: 0,
      memoryUsage: 0,
      errorCount: 0,
    };

    // Set up message handler
    worker.addEventListener("message", (event) => {
      this.handleWorkerMessage(workerInstance, event.data);
    });

    worker.addEventListener("error", (error) => {
      console.error(`Worker ${workerId} error:`, error);
      workerInstance.errorCount++;
      workerInstance.healthStatus = "unhealthy";
    });

    this.workers.set(workerId, workerInstance);

    // Initialize worker
    await this.initializeWorker(workerInstance);

    return workerInstance;
  }

  private async initializeWorker(worker: WorkerInstance): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const initId = this.generateId();
      const message: WorkerMessage = {
        id: initId,
        type: "init",
        operation: "init",
        data: {},
        timestamp: Date.now(),
      };

      const timeout = setTimeout(() => {
        reject(new Error("Worker initialization timeout"));
      }, this.config.timeoutMs);

      const handleInitMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id === initId) {
          clearTimeout(timeout);
          worker.worker.removeEventListener("message", handleInitMessage);

          if (event.data.type === "initialized") {
            worker.healthStatus = "healthy";
            resolve();
          } else {
            worker.healthStatus = "unhealthy";
            reject(new Error("Worker initialization failed"));
          }
        }
      };

      worker.worker.addEventListener("message", handleInitMessage);
      worker.worker.postMessage(message);
    });
  }

  private async getAvailableWorker(): Promise<WorkerInstance> {
    // Create new worker if needed
    if (this.workers.size < this.config.maxWorkers) {
      try {
        return await this.createWorker();
      } catch (error) {
        console.warn("Failed to create new worker:", error);
      }
    }

    // Find available worker based on load balancing strategy
    const availableWorkers = Array.from(this.workers.values()).filter(
      (w) => w.healthStatus === "healthy" && !w.busy,
    );

    if (availableWorkers.length === 0) {
      throw new Error("No available workers");
    }

    let selectedWorker: WorkerInstance;

    switch (this.config.loadBalancing) {
      case "round-robin":
        selectedWorker =
          availableWorkers[this.nextWorkerIndex % availableWorkers.length];
        this.nextWorkerIndex++;
        break;

      case "least-loaded":
        selectedWorker = availableWorkers.reduce((least, current) =>
          current.operations < least.operations ? current : least,
        );
        break;

      case "random":
        const randomIndex = Math.floor(Math.random() * availableWorkers.length);
        selectedWorker = availableWorkers[randomIndex];
        break;

      default:
        selectedWorker = availableWorkers[0];
    }

    return selectedWorker;
  }

  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      try {
        const worker = await this.getAvailableWorker();
        if (!worker) break;

        const task = this.taskQueue.shift();
        if (!task) break;

        await this.executeTaskOnWorker(worker, task);
      } catch (error) {
        console.warn("Error processing queue:", error);
        break;
      }
    }
  }

  private async executeTaskOnWorker(
    worker: WorkerInstance,
    task: TaskRequest,
  ): Promise<void> {
    worker.busy = true;
    worker.lastUsed = new Date();
    worker.currentTask = {
      id: task.id,
      operation: task.operation,
      startTime: Date.now(),
    };

    const message: WorkerMessage = {
      id: task.id,
      type: "process",
      operation: task.operation,
      data: task.data,
      timestamp: Date.now(),
    };

    // Set up timeout
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(task.id);
    }, task.timeoutMs);

    this.setupWorkerMessageHandler(worker.worker, task.id);
    worker.worker.postMessage(message);
  }

  private setupWorkerMessageHandler(worker: Worker, taskId: string): void {
    const handler = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id === taskId) {
        worker.removeEventListener("message", handler);
        this.handleWorkerResponse(event.data);
      }
    };
    worker.addEventListener("message", handler);
  }

  private handleWorkerMessage(
    worker: WorkerInstance,
    response: WorkerResponse,
  ): void {
    switch (response.type) {
      case "progress":
        const pending = this.pendingTasks.get(response.id);
        if (pending?.onProgress) {
          pending.onProgress(response.data);
        }
        break;

      case "success":
      case "error":
        this.handleWorkerResponse(response);
        break;
    }
  }

  private handleWorkerResponse(response: WorkerResponse): void {
    const pending = this.pendingTasks.get(response.id);
    if (!pending) return;

    this.pendingTasks.delete(response.id);

    // Update worker state
    const worker = Array.from(this.workers.values()).find(
      (w) => w.currentTask?.id === response.id,
    );
    if (worker) {
      worker.busy = false;
      worker.operations++;
      worker.currentTask = undefined;
      worker.lastUsed = new Date();

      if (response.type === "success") {
        worker.errorCount = Math.max(0, worker.errorCount - 1); // Decrement errors on success
      } else {
        worker.errorCount++;
      }
    }

    // Process queue for next task
    this.processQueue();

    // Resolve or reject promise
    if (response.type === "success") {
      const taskResult: TaskResult = {
        id: response.id,
        result: response.data,
        workerId: worker?.id || "unknown",
        processingTime: response.processingTime || 0,
        timestamp: new Date(response.timestamp),
      };
      pending.resolve(taskResult);
    } else {
      const error = new Error(response.error?.message || "Task failed");
      (error as any).code = response.error?.code;
      (error as any).stack = response.error?.stack;
      pending.reject(error);
    }
  }

  private handleTaskTimeout(taskId: string): void {
    const pending = this.pendingTasks.get(taskId);
    if (!pending) return;

    this.pendingTasks.delete(taskId);

    // Update worker state
    const worker = Array.from(this.workers.values()).find(
      (w) => w.currentTask?.id === taskId,
    );
    if (worker) {
      worker.busy = false;
      worker.currentTask = undefined;
      worker.errorCount++;
    }

    pending.reject(new Error("Task timeout"));

    // Process queue for next task
    this.processQueue();
  }

  private async disposeWorker(worker: WorkerInstance): Promise<void> {
    try {
      worker.worker.postMessage({
        id: this.generateId(),
        type: "dispose",
        operation: "dispose",
        data: {},
        timestamp: Date.now(),
      });

      // Wait a bit for disposal
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn("Error disposing worker:", error);
    }

    try {
      worker.worker.terminate();
    } catch (error) {
      console.warn("Error terminating worker:", error);
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  private async performHealthCheck(): Promise<void> {
    for (const worker of this.workers.values()) {
      if (worker.busy) continue; // Don't check busy workers

      try {
        const healthCheckId = this.generateId();
        worker.healthStatus = "checking";

        worker.worker.postMessage({
          id: healthCheckId,
          type: "health_check",
          operation: "health_check",
          data: {},
          timestamp: Date.now(),
        });

        // Set timeout for health check
        setTimeout(() => {
          if (worker.healthStatus === "checking") {
            worker.healthStatus = "unhealthy";
          }
        }, 5000);
      } catch (error) {
        worker.healthStatus = "unhealthy";
        worker.errorCount++;
      }
    }

    // Replace unhealthy workers
    await this.replaceUnhealthyWorkers();
  }

  private async replaceUnhealthyWorkers(): Promise<void> {
    const unhealthyWorkers = Array.from(this.workers.values()).filter(
      (w) => w.healthStatus === "unhealthy" && w.errorCount > 3,
    );

    for (const worker of unhealthyWorkers) {
      try {
        await this.disposeWorker(worker);
        this.workers.delete(worker.id);
        await this.createWorker();
      } catch (error) {
        console.warn("Failed to replace unhealthy worker:", error);
      }
    }
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWorkerCode(): string {
    // This would contain the worker code from nlp-worker.ts
    // For now, return a placeholder that would be replaced by actual worker code
    return `
      // NLP Worker code would be injected here
      // This is a placeholder - actual implementation would include the full worker code
      console.log('NLP Worker initialized');

      self.addEventListener('message', (event) => {
        const { id, type, operation, data } = event.data;

        switch (type) {
          case 'init':
            postMessage({ id, type: 'initialized', operation, timestamp: Date.now() });
            break;
          case 'health_check':
            postMessage({
              id,
              type: 'success',
              operation,
              data: { status: 'healthy' },
              timestamp: Date.now()
            });
            break;
          default:
            postMessage({
              id,
              type: 'error',
              operation,
              error: { message: 'Not implemented' },
              timestamp: Date.now()
            });
        }
      });
    `;
  }
}
