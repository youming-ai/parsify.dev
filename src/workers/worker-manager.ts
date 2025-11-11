/**
 * Web Worker Manager
 * Core worker management system with pooling, task distribution, and monitoring
 */

import {
  WorkerTask,
  WorkerInstance,
  WorkerPoolConfig,
  WorkerTaskStatus,
  WorkerTaskCategory,
  WorkerTaskOptions,
  WorkerError,
  WorkerPoolStats,
  WorkerTaskEvent,
  WorkerPoolEvent,
  WorkerTaskExecutionOptions,
  WorkerTaskEventCallback,
  WorkerPoolEventCallback,
  WorkerProgressCallback,
  WorkerErrorCallback,
  TaskResult,
  WorkerMessage,
  WorkerMessageType,
  WorkerErrorCode,
  WorkerHealthStatus,
  WorkerType,
  WorkerPriority,
  WORKER_CATEGORY_CONFIGS
} from './types';

/**
 * Main Worker Manager class
 * Handles worker pools, task distribution, and monitoring
 */
export class WorkerManager {
  private static instance: WorkerManager;

  // Worker storage
  private pools: Map<WorkerTaskCategory, WorkerInstance[]> = new Map();
  private tasks: Map<string, WorkerTask> = new Map();
  private taskQueues: Map<WorkerTaskCategory, WorkerTask[]> = new Map();

  // Event listeners
  private taskEventListeners: Set<WorkerTaskEventCallback> = new Set();
  private poolEventListeners: Set<WorkerPoolEventCallback> = new Set();

  // Configuration
  private configs: Map<WorkerTaskCategory, WorkerPoolConfig> = new Map();
  private globalTimeout: number = 60000; // 1 minute default

  // Monitoring
  private stats: Map<WorkerTaskCategory, WorkerPoolStats> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();

  // State
  private isInitialized = false;
  private isShuttingDown = false;

  private constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  /**
   * Initialize the worker manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing Web Worker Manager...');

    try {
      // Initialize pools for each category
      for (const category of Object.keys(WORKER_CATEGORY_CONFIGS) as WorkerTaskCategory[]) {
        await this.initializePool(category);
      }

      // Setup health monitoring
      this.setupHealthMonitoring();

      this.isInitialized = true;
      console.log('✅ Web Worker Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Web Worker Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize a worker pool for a specific category
   */
  private async initializePool(category: WorkerTaskCategory): Promise<void> {
    const config = WORKER_CATEGORY_CONFIGS[category];
    this.configs.set(category, config);

    // Initialize pool array
    this.pools.set(category, []);
    this.taskQueues.set(category, []);

    // Initialize stats
    this.stats.set(category, {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      pendingTasks: 0,
      averageExecutionTime: 0,
      poolUtilization: 0,
      memoryUsage: 0,
      lastUpdated: new Date()
    });

    // Create minimum workers
    for (let i = 0; i < config.minWorkers; i++) {
      await this.createWorker(category);
    }

    console.log(`✅ Pool initialized for category: ${category}`);
  }

  /**
   * Create a new worker instance
   */
  private async createWorker(category: WorkerTaskCategory): Promise<WorkerInstance> {
    const workerId = this.generateWorkerId(category);
    const config = this.configs.get(category)!;

    // Create worker script URL based on category
    const scriptUrl = this.getWorkerScriptUrl(category);

    try {
      // Create Web Worker instance
      const worker = new Worker(scriptUrl, {
        type: 'module',
        name: `worker-${category}-${workerId}`
      });

      // Create worker instance record
      const workerInstance: WorkerInstance = {
        id: workerId,
        type: 'shared',
        category,
        status: 'idle',
        taskCount: 0,
        totalExecutionTime: 0,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        errorCount: 0,
        worker,
        scripts: [scriptUrl]
      };

      // Setup message handling
      this.setupWorkerMessageHandling(workerInstance);

      // Setup error handling
      this.setupWorkerErrorHandling(workerInstance);

      // Add to pool
      const pool = this.pools.get(category)!;
      pool.push(workerInstance);

      // Update stats
      this.updatePoolStats(category);

      // Emit pool event
      this.emitPoolEvent({
        type: 'worker-created',
        data: { workerId, category },
        timestamp: new Date()
      });

      console.log(`🔧 Created worker ${workerId} for category ${category}`);
      return workerInstance;
    } catch (error) {
      console.error(`❌ Failed to create worker for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Setup worker message handling
   */
  private setupWorkerMessageHandling(workerInstance: WorkerInstance): void {
    workerInstance.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleWorkerMessage(workerInstance, event.data);
    };
  }

  /**
   * Setup worker error handling
   */
  private setupWorkerErrorHandling(workerInstance: WorkerInstance): void {
    workerInstance.worker.onerror = (error: ErrorEvent) => {
      this.handleWorkerError(workerInstance, error);
    };

    workerInstance.worker.onmessageerror = (error: ErrorEvent) => {
      this.handleWorkerError(workerInstance, error);
    };
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(workerInstance: WorkerInstance, message: WorkerMessage): void {
    const { type, taskId, payload } = message;

    switch (type) {
      case 'worker-ready':
        console.log(`✅ Worker ${workerInstance.id} is ready`);
        break;

      case 'task-progress':
        if (taskId) {
          this.handleTaskProgress(taskId, payload.progress, payload.message);
        }
        break;

      case 'task-complete':
        if (taskId) {
          this.handleTaskComplete(workerInstance, taskId, payload);
        }
        break;

      case 'task-error':
        if (taskId) {
          this.handleTaskError(workerInstance, taskId, payload);
        }
        break;

      case 'ping':
        // Respond with pong
        this.sendMessageToWorker(workerInstance, {
          id: this.generateMessageId(),
          type: 'pong',
          payload: { timestamp: new Date() },
          timestamp: new Date()
        });
        break;

      default:
        console.warn(`Unknown message type from worker ${workerInstance.id}:`, type);
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerInstance: WorkerInstance, error: ErrorEvent): void {
    console.error(`❌ Worker ${workerInstance.id} error:`, error);

    workerInstance.errorCount++;

    // If current task exists, handle task error
    if (workerInstance.currentTask) {
      const workerError: WorkerError = {
        code: WorkerErrorCode.SCRIPT_ERROR,
        message: error.message || 'Unknown worker error',
        details: {
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno
        },
        recoverable: true,
        retryable: workerInstance.errorCount <= 3
      };

      this.handleTaskError(workerInstance, workerInstance.currentTask.id, workerError);
    }

    // If too many errors, mark worker as unhealthy
    if (workerInstance.errorCount > 5) {
      workerInstance.status = 'error';
      this.emitPoolEvent({
        type: 'pool-error',
        data: { workerId: workerInstance.id, error: error.message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Execute a task in a worker
   */
  public async executeTask<T = any>(
    type: string,
    category: WorkerTaskCategory,
    data: any,
    options?: WorkerTaskExecutionOptions
  ): Promise<TaskResult<T>> {
    if (!this.isInitialized) {
      throw new Error('Worker Manager not initialized');
    }

    const taskId = this.generateTaskId();
    const task: WorkerTask = {
      id: taskId,
      type,
      category,
      priority: options?.priority || 'normal',
      data,
      options: {
        timeout: options?.timeout || this.globalTimeout,
        maxRetries: options?.retries || 2,
        priority: options?.priority,
        progressCallback: options?.onProgress,
        metadata: options?.onProgress ? {} : undefined
      },
      createdAt: new Date(),
      status: 'pending',
      retries: 0,
      maxRetries: options?.retries || 2
    };

    // Store task
    this.tasks.set(taskId, task);

    // Add to queue
    this.addToQueue(task);

    // Process queue
    this.processQueue(category);

    // Wait for completion
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const currentTask = this.tasks.get(taskId);
        if (!currentTask) {
          reject(new Error('Task not found'));
          return;
        }

        switch (currentTask.status) {
          case 'completed':
            const result: TaskResult<T> = {
              success: true,
              data: currentTask.result,
              metadata: {
                taskId: currentTask.id,
                workerId: currentTask.workerId!,
                executionTime: currentTask.completedAt!.getTime() - currentTask.startedAt!.getTime(),
                memoryUsage: 0, // TODO: Implement memory tracking
                completedAt: currentTask.completedAt!,
                retries: currentTask.retries
              }
            };
            resolve(result);
            break;

          case 'failed':
          case 'timeout':
          case 'cancelled':
            const errorResult: TaskResult<T> = {
              success: false,
              error: currentTask.error,
              metadata: {
                taskId: currentTask.id,
                workerId: currentTask.workerId || 'unknown',
                executionTime: 0,
                memoryUsage: 0,
                completedAt: new Date(),
                retries: currentTask.retries
              }
            };
            resolve(errorResult);
            break;

          default:
            // Still processing, check again later
            setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }

  /**
   * Add task to queue
   */
  private addToQueue(task: WorkerTask): void {
    const queue = this.taskQueues.get(task.category)!;

    // Insert based on priority
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      if (this.getPriorityValue(task.priority) > this.getPriorityValue(queue[i].priority)) {
        insertIndex = i;
        break;
      }
    }

    queue.splice(insertIndex, 0, task);

    // Update stats
    this.updateQueueStats(task.category);
  }

  /**
   * Process task queue for a category
   */
  private processQueue(category: WorkerTaskCategory): void {
    const queue = this.taskQueues.get(category)!;
    const pool = this.pools.get(category)!;
    const config = this.configs.get(category)!;

    // Find available workers
    const availableWorkers = pool.filter(w => w.status === 'idle');

    // Process tasks while we have workers and tasks
    while (availableWorkers.length > 0 && queue.length > 0) {
      const task = queue.shift()!;
      const worker = availableWorkers.shift()!;

      this.executeTaskOnWorker(worker, task);
    }

    // Create more workers if needed
    if (queue.length > 0 && pool.length < config.maxWorkers) {
      const workersNeeded = Math.min(
        config.maxWorkers - pool.length,
        queue.length - availableWorkers.length
      );

      for (let i = 0; i < workersNeeded; i++) {
        this.createWorker(category).then(() => {
          // Process queue again after worker creation
          setTimeout(() => this.processQueue(category), 100);
        });
      }
    }
  }

  /**
   * Execute a task on a specific worker
   */
  private executeTaskOnWorker(worker: WorkerInstance, task: WorkerTask): void {
    // Update task and worker status
    task.status = 'running';
    task.startedAt = new Date();
    task.workerId = worker.id;
    worker.status = 'busy';
    worker.currentTask = task;
    worker.taskCount++;

    // Setup timeout
    const timeout = task.options?.timeout || this.globalTimeout;
    const timeoutHandle = setTimeout(() => {
      this.handleTaskTimeout(worker, task);
    }, timeout);

    // Send task to worker
    this.sendMessageToWorker(worker, {
      id: this.generateMessageId(),
      type: 'task-execute',
      payload: {
        taskId: task.id,
        type: task.type,
        data: task.data,
        options: task.options
      },
      timestamp: new Date(),
      taskId: task.id
    });

    // Store timeout handle for cleanup
    (task as any).timeoutHandle = timeoutHandle;

    // Emit task event
    this.emitTaskEvent({
      type: 'task-started',
      task,
      worker,
      timestamp: new Date()
    });

    // Update stats
    this.updatePoolStats(task.category);
  }

  /**
   * Handle task progress
   */
  private handleTaskProgress(taskId: string, progress: number, message?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = progress;

    // Call progress callback if provided
    if (task.options?.progressCallback) {
      task.options.progressCallback(progress, message);
    }

    // Emit progress event
    this.emitTaskEvent({
      type: 'task-progress',
      task,
      worker: this.pools.get(task.category)!.find(w => w.id === task.workerId)!,
      timestamp: new Date()
    });
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(worker: WorkerInstance, taskId: string, result: any): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Clear timeout
    if ((task as any).timeoutHandle) {
      clearTimeout((task as any).timeoutHandle);
    }

    // Update task
    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date();

    // Update worker
    worker.status = 'idle';
    worker.currentTask = undefined;
    worker.totalExecutionTime += task.completedAt.getTime() - task.startedAt!.getTime();
    worker.lastUsedAt = new Date();

    // Emit task event
    this.emitTaskEvent({
      type: 'task-completed',
      task,
      worker,
      timestamp: new Date()
    });

    // Update stats
    this.updatePoolStats(task.category);

    // Process next task in queue
    this.processQueue(task.category);
  }

  /**
   * Handle task error
   */
  private handleTaskError(worker: WorkerInstance, taskId: string, error: WorkerError): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Clear timeout
    if ((task as any).timeoutHandle) {
      clearTimeout((task as any).timeoutHandle);
    }

    // Check if we should retry
    if (error.retryable && task.retries < task.maxRetries) {
      task.retries++;
      task.status = 'pending';

      // Add retry delay
      setTimeout(() => {
        this.addToQueue(task);
        this.processQueue(task.category);
      }, 1000 * task.retries);

      return;
    }

    // Mark as failed
    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();

    // Update worker
    worker.status = 'idle';
    worker.currentTask = undefined;
    worker.lastUsedAt = new Date();

    // Emit task event
    this.emitTaskEvent({
      type: 'task-failed',
      task,
      worker,
      timestamp: new Date()
    });

    // Update stats
    this.updatePoolStats(task.category);

    // Process next task in queue
    this.processQueue(task.category);
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(worker: WorkerInstance, task: WorkerTask): void {
    const timeoutError: WorkerError = {
      code: WorkerErrorCode.TIMEOUT,
      message: `Task timed out after ${task.options?.timeout || this.globalTimeout}ms`,
      recoverable: true,
      retryable: task.retries < task.maxRetries
    };

    this.handleTaskError(worker, task.id, timeoutError);
  }

  /**
   * Cancel a task
   */
  public cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'pending') {
      // Remove from queue
      const queue = this.taskQueues.get(task.category)!;
      const index = queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    } else if (task.status === 'running' && task.workerId) {
      // Send cancel message to worker
      const worker = this.pools.get(task.category)!.find(w => w.id === task.workerId);
      if (worker) {
        this.sendMessageToWorker(worker, {
          id: this.generateMessageId(),
          type: 'task-cancel',
          payload: { taskId },
          timestamp: new Date(),
          taskId
        });
      }
    }

    // Update task status
    task.status = 'cancelled';
    task.completedAt = new Date();

    // Clear timeout
    if ((task as any).timeoutHandle) {
      clearTimeout((task as any).timeoutHandle);
    }

    // Update worker if it was running
    if (task.workerId) {
      const worker = this.pools.get(task.category)!.find(w => w.id === task.workerId);
      if (worker) {
        worker.status = 'idle';
        worker.currentTask = undefined;
        worker.lastUsedAt = new Date();
      }
    }

    // Emit task event
    this.emitTaskEvent({
      type: 'task-cancelled',
      task,
      worker: task.workerId ? this.pools.get(task.category)!.find(w => w.id === task.workerId)! : {} as WorkerInstance,
      timestamp: new Date()
    });

    // Update stats
    this.updatePoolStats(task.category);

    return true;
  }

  /**
   * Get worker pool statistics
   */
  public getPoolStats(category?: WorkerTaskCategory): Map<WorkerTaskCategory, WorkerPoolStats> | WorkerPoolStats {
    if (category) {
      return this.stats.get(category)!;
    }
    return this.stats;
  }

  /**
   * Get worker health status
   */
  public getWorkerHealth(workerId: string): WorkerHealthStatus | null {
    for (const pool of this.pools.values()) {
      const worker = pool.find(w => w.id === workerId);
      if (worker) {
        return {
          workerId,
          status: worker.errorCount > 3 ? 'unhealthy' : worker.errorCount > 1 ? 'degraded' : 'healthy',
          lastActivity: worker.lastUsedAt,
          consecutiveErrors: worker.errorCount,
          averageResponseTime: worker.taskCount > 0 ? worker.totalExecutionTime / worker.taskCount : 0,
          memoryUsage: worker.memoryUsage || 0,
          uptime: Date.now() - worker.createdAt.getTime()
        };
      }
    }
    return null;
  }

  /**
   * Setup health monitoring
   */
  private setupHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health check on all workers
   */
  private performHealthCheck(): void {
    for (const [category, pool] of this.pools) {
      const config = this.configs.get(category)!;

      pool.forEach(worker => {
        // Check if worker has been idle too long
        if (worker.status === 'idle' &&
            Date.now() - worker.lastUsedAt.getTime() > config.maxIdleTime &&
            pool.length > config.minWorkers) {
          this.terminateWorker(worker);
          return;
        }

        // Check worker health with ping
        this.sendMessageToWorker(worker, {
          id: this.generateMessageId(),
          type: 'ping',
          payload: { timestamp: new Date() },
          timestamp: new Date()
        });

        // Set timeout for pong response
        const pingTimeout = setTimeout(() => {
          if (worker.status !== 'terminating') {
            console.warn(`⚠️ Worker ${worker.id} not responding to ping`);
            worker.errorCount++;

            if (worker.errorCount > 3) {
              this.terminateWorker(worker);
            }
          }
        }, 5000);

        // Store timeout for cleanup
        this.healthChecks.set(worker.id, pingTimeout);
      });
    }
  }

  /**
   * Terminate a worker
   */
  private terminateWorker(worker: WorkerInstance): void {
    if (worker.status === 'terminating') return;

    worker.status = 'terminating';

    // Cancel current task if any
    if (worker.currentTask) {
      this.cancelTask(worker.currentTask.id);
    }

    // Clear health check timeout
    const healthCheck = this.healthChecks.get(worker.id);
    if (healthCheck) {
      clearTimeout(healthCheck);
      this.healthChecks.delete(worker.id);
    }

    // Terminate worker
    worker.worker.terminate();

    // Remove from pool
    const pool = this.pools.get(worker.category)!;
    const index = pool.indexOf(worker);
    if (index !== -1) {
      pool.splice(index, 1);
    }

    console.log(`🗑️ Terminated worker ${worker.id}`);

    // Emit pool event
    this.emitPoolEvent({
      type: 'worker-destroyed',
      data: { workerId: worker.id, category: worker.category },
      timestamp: new Date()
    });

    // Update stats
    this.updatePoolStats(worker.category);
  }

  /**
   * Shutdown the worker manager
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log('🛑 Shutting down Web Worker Manager...');

    // Cancel all pending tasks
    for (const task of this.tasks.values()) {
      if (task.status === 'pending' || task.status === 'running') {
        this.cancelTask(task.id);
      }
    }

    // Terminate all workers
    for (const pool of this.pools.values()) {
      for (const worker of [...pool]) {
        this.terminateWorker(worker);
      }
    }

    // Clear health checks
    for (const timeout of this.healthChecks.values()) {
      clearTimeout(timeout);
    }
    this.healthChecks.clear();

    // Clear data
    this.pools.clear();
    this.tasks.clear();
    this.taskQueues.clear();
    this.stats.clear();

    this.isInitialized = false;
    console.log('✅ Web Worker Manager shutdown completed');
  }

  // Event handling methods
  public onTaskEvent(callback: WorkerTaskEventCallback): void {
    this.taskEventListeners.add(callback);
  }

  public offTaskEvent(callback: WorkerTaskEventCallback): void {
    this.taskEventListeners.delete(callback);
  }

  public onPoolEvent(callback: WorkerPoolEventCallback): void {
    this.poolEventListeners.add(callback);
  }

  public offPoolEvent(callback: WorkerPoolEventCallback): void {
    this.poolEventListeners.delete(callback);
  }

  private emitTaskEvent(event: WorkerTaskEvent): void {
    this.taskEventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in task event callback:', error);
      }
    });
  }

  private emitPoolEvent(event: WorkerPoolEvent): void {
    this.poolEventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in pool event callback:', error);
      }
    });
  }

  // Utility methods
  private sendMessageToWorker(worker: WorkerInstance, message: WorkerMessage): void {
    try {
      worker.worker.postMessage(message);
    } catch (error) {
      console.error(`Failed to send message to worker ${worker.id}:`, error);
    }
  }

  private generateWorkerId(category: WorkerTaskCategory): string {
    return `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWorkerScriptUrl(category: WorkerTaskCategory): string {
    // In a real implementation, this would return the actual script URL
    return `/workers/${category}-worker.js`;
  }

  private getPriorityValue(priority: WorkerPriority): number {
    const values = { low: 1, normal: 2, high: 3, critical: 4 };
    return values[priority];
  }

  private initializeDefaultConfigs(): void {
    for (const [category, config] of Object.entries(WORKER_CATEGORY_CONFIGS)) {
      this.configs.set(category as WorkerTaskCategory, config);
    }
  }

  private updatePoolStats(category: WorkerTaskCategory): void {
    const pool = this.pools.get(category)!;
    const queue = this.taskQueues.get(category)!;
    const config = this.configs.get(category)!;

    const activeWorkers = pool.filter(w => w.status === 'busy').length;
    const idleWorkers = pool.filter(w => w.status === 'idle').length;

    // Calculate completed and failed tasks
    const completedTasks = Array.from(this.tasks.values())
      .filter(t => t.category === category && t.status === 'completed').length;
    const failedTasks = Array.from(this.tasks.values())
      .filter(t => t.category === category && t.status === 'failed').length;

    // Calculate average execution time
    const totalExecutionTime = pool.reduce((sum, w) => sum + w.totalExecutionTime, 0);
    const totalTasks = pool.reduce((sum, w) => sum + w.taskCount, 0);
    const averageExecutionTime = totalTasks > 0 ? totalExecutionTime / totalTasks : 0;

    const stats: WorkerPoolStats = {
      totalWorkers: pool.length,
      activeWorkers,
      idleWorkers,
      totalTasks: totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks: queue.length,
      averageExecutionTime,
      poolUtilization: pool.length > 0 ? activeWorkers / pool.length : 0,
      memoryUsage: pool.reduce((sum, w) => sum + (w.memoryUsage || 0), 0),
      lastUpdated: new Date()
    };

    this.stats.set(category, stats);
  }

  private updateQueueStats(category: WorkerTaskCategory): void {
    this.updatePoolStats(category);
  }
}

// Export singleton instance
export const workerManager = WorkerManager.getInstance();
