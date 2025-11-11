/**
 * Web Worker Integration with Existing Systems
 * Integrates worker management with monitoring, error handling, and analytics
 */

import { workerManager } from './worker-manager';
import { WorkerTaskCategory, WorkerTaskEvent, WorkerPoolEvent, TaskResult, WorkerError } from './types';
import {
  errorHandler,
  logger,
  AnalyticsError,
  ErrorCode,
  AnalyticsSystem
} from '../monitoring/error-handling';
import { bundleMonitoringSystem } from '../monitoring/index';

/**
 * Worker Integration Manager
 * Bridges Web Workers with existing monitoring and error handling systems
 */
export class WorkerIntegrationManager {
  private static instance: WorkerIntegrationManager;
  private analyticsSystem: AnalyticsSystem = 'worker-system';
  private integrationEnabled = false;
  private performanceMetrics = new Map<string, any>();
  private errorCounts = new Map<string, number>();

  private constructor() {
    this.setupIntegration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WorkerIntegrationManager {
    if (!WorkerIntegrationManager.instance) {
      WorkerIntegrationManager.instance = new WorkerIntegrationManager();
    }
    return WorkerIntegrationManager.instance;
  }

  /**
   * Setup integration with worker manager
   */
  private setupIntegration(): void {
    if (this.integrationEnabled) return;

    // Register task event listeners
    workerManager.onTaskEvent(this.handleTaskEvent.bind(this));
    workerManager.onPoolEvent(this.handlePoolEvent.bind(this));

    // Initialize error tracking
    this.initializeErrorTracking();

    this.integrationEnabled = true;
    logger.info('Web Worker Integration initialized');
  }

  /**
   * Execute a task with full integration
   */
  public async executeTaskWithIntegration<T = any>(
    type: string,
    category: WorkerTaskCategory,
    data: any,
    options?: any
  ): Promise<TaskResult<T>> {
    const operationId = this.generateOperationId();
    const startTime = performance.now();

    try {
      // Log task start
      logger.info(`Worker task started: ${type} (${category})`, {
        operationId,
        type,
        category,
        dataSize: JSON.stringify(data).length
      });

      // Track task start
      this.trackTaskStart(operationId, type, category);

      // Execute the task
      const result = await workerManager.executeTask<T>(type, category, data, {
        ...options,
        onProgress: (progress, message) => {
          this.trackTaskProgress(operationId, progress, message);
          if (options?.onProgress) {
            options.onProgress(progress, message);
          }
        },
        onError: (taskId, error) => {
          this.handleWorkerError(operationId, error, type, category);
          if (options?.onError) {
            options.onError(taskId, error);
          }
        }
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Track task completion
      this.trackTaskCompletion(operationId, result, executionTime);

      // Log successful completion
      if (result.success) {
        logger.info(`Worker task completed successfully: ${type}`, {
          operationId,
          executionTime,
          resultSize: result.data ? JSON.stringify(result.data).length : 0
        });
      } else {
        logger.warn(`Worker task completed with errors: ${type}`, {
          operationId,
          error: result.error,
          executionTime
        });
      }

      // Integrate with bundle monitoring if relevant
      if (result.metadata?.memoryUsage > 0) {
        this.reportBundleMetrics(category, executionTime, result.metadata.memoryUsage);
      }

      return result;

    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Create and handle analytics error
      const analyticsError = new AnalyticsError(
        `Worker task execution failed: ${type}`,
        ErrorCode.OPERATION_FAILED,
        this.analyticsSystem,
        {
          operation: 'executeTask',
          type,
          category,
          operationId,
          executionTime,
          originalError: error
        }
      );

      // Track task failure
      this.trackTaskFailure(operationId, analyticsError, executionTime);

      // Handle error through existing error handling system
      await errorHandler.handleError(analyticsError);

      // Log error
      logger.error(`Worker task failed: ${type}`, {
        operationId,
        error: error.message,
        executionTime
      });

      // Return failed result
      return {
        success: false,
        error: {
          code: 'WORKER_EXECUTION_ERROR',
          message: error.message,
          details: analyticsError,
          recoverable: true,
          retryable: true
        },
        metadata: {
          taskId: operationId,
          workerId: 'unknown',
          executionTime,
          memoryUsage: 0,
          completedAt: new Date(),
          retries: 0
        }
      };
    }
  }

  /**
   * Handle task events from worker manager
   */
  private handleTaskEvent(event: WorkerTaskEvent): void {
    const { type, task, worker } = event;

    try {
      switch (type) {
        case 'task-started':
          this.handleTaskStarted(task, worker);
          break;
        case 'task-progress':
          this.handleTaskProgress(task, worker);
          break;
        case 'task-completed':
          this.handleTaskCompleted(task, worker);
          break;
        case 'task-failed':
          this.handleTaskFailed(task, worker);
          break;
        case 'task-cancelled':
          this.handleTaskCancelled(task, worker);
          break;
      }
    } catch (error) {
      logger.error('Error in task event handling:', error);
    }
  }

  /**
   * Handle pool events from worker manager
   */
  private handlePoolEvent(event: WorkerPoolEvent): void {
    const { type, data } = event;

    try {
      switch (type) {
        case 'worker-created':
          this.handleWorkerCreated(data);
          break;
        case 'worker-destroyed':
          this.handleWorkerDestroyed(data);
          break;
        case 'pool-resized':
          this.handlePoolResized(data);
          break;
        case 'pool-error':
          this.handlePoolError(data);
          break;
      }
    } catch (error) {
      logger.error('Error in pool event handling:', error);
    }
  }

  /**
   * Handle worker-specific errors
   */
  private handleWorkerError(operationId: string, error: WorkerError, taskType: string, category: WorkerTaskCategory): void {
    // Create analytics error from worker error
    const analyticsError = new AnalyticsError(
      `Worker error: ${error.message}`,
      ErrorCode.OPERATION_FAILED,
      this.analyticsSystem,
      {
        operation: 'workerError',
        operationId,
        taskType,
        category,
        workerErrorCode: error.code,
        workerErrorDetails: error.details
      }
    );

    // Increment error count
    const errorKey = `${category}-${taskType}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Handle through error handler
    errorHandler.handleError(analyticsError);

    // Log error
    logger.error('Worker error occurred:', {
      operationId,
      taskType,
      category,
      errorCode: error.code,
      errorMessage: error.message,
      retryable: error.retryable
    });
  }

  /**
   * Track task start
   */
  private trackTaskStart(operationId: string, taskType: string, category: WorkerTaskCategory): void {
    this.performanceMetrics.set(operationId, {
      category,
      taskType,
      startTime: performance.now(),
      progressEvents: []
    });
  }

  /**
   * Track task progress
   */
  private trackTaskProgress(operationId: string, progress: number, message?: string): void {
    const metrics = this.performanceMetrics.get(operationId);
    if (metrics) {
      metrics.progressEvents.push({
        progress,
        message,
        timestamp: performance.now()
      });
    }
  }

  /**
   * Track task completion
   */
  private trackTaskCompletion(operationId: string, result: TaskResult, executionTime: number): void {
    const metrics = this.performanceMetrics.get(operationId);
    if (metrics) {
      this.performanceMetrics.delete(operationId);

      // Report to analytics system
      this.reportTaskMetrics({
        category: metrics.category,
        taskType: metrics.taskType,
        success: result.success,
        executionTime,
        memoryUsage: result.metadata.memoryUsage,
        progressEvents: metrics.progressEvents.length
      });
    }
  }

  /**
   * Track task failure
   */
  private trackTaskFailure(operationId: string, error: AnalyticsError, executionTime: number): void {
    const metrics = this.performanceMetrics.get(operationId);
    if (metrics) {
      this.performanceMetrics.delete(operationId);

      // Report failure to analytics
      this.reportTaskMetrics({
        category: metrics.category,
        taskType: metrics.taskType,
        success: false,
        executionTime,
        errorMessage: error.message,
        errorCode: error.code
      });
    }
  }

  /**
   * Report task metrics to analytics
   */
  private reportTaskMetrics(metrics: any): void {
    try {
      // This would integrate with your analytics system
      logger.debug('Task metrics reported:', metrics);

      // Example: Send to monitoring system
      if (bundleMonitoringSystem && bundleMonitoringSystem.getStatus().initialized) {
        // You could add worker-specific metrics to bundle monitoring
        // or send to a dedicated worker analytics system
      }
    } catch (error) {
      logger.error('Failed to report task metrics:', error);
    }
  }

  /**
   * Report bundle metrics (memory usage, performance)
   */
  private reportBundleMetrics(category: WorkerTaskCategory, executionTime: number, memoryUsage: number): void {
    try {
      // Report to bundle monitoring system if available
      if (bundleMonitoringSystem && bundleMonitoringSystem.getStatus().initialized) {
        // Add worker-specific metrics to bundle monitoring
        logger.debug('Bundle metrics reported:', {
          category,
          executionTime,
          memoryUsage
        });
      }
    } catch (error) {
      logger.error('Failed to report bundle metrics:', error);
    }
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    // Register worker-specific error handlers
    errorHandler.registerHandler('WORKER_ERROR', async (error) => {
      return {
        handled: true,
        shouldRetry: error.context?.additionalData?.retryable || false,
        retryDelay: 2000,
        fallbackAction: 'degrade_functionality'
      };
    });

    errorHandler.registerHandler('WORKER_TIMEOUT', async (error) => {
      return {
        handled: true,
        shouldRetry: true,
        retryDelay: 5000,
        fallbackAction: 'skip_operation'
      };
    });

    errorHandler.registerHandler('WORKER_CRASHED', async (error) => {
      return {
        handled: true,
        shouldRetry: false,
        retryDelay: 0,
        fallbackAction: 'disable_feature'
      };
    });
  }

  /**
   * Get worker integration statistics
   */
  public getIntegrationStats(): {
    activeOperations: number;
    errorCounts: Record<string, number>;
    performanceMetrics: any;
    integrationEnabled: boolean;
  } {
    const errorCountsObject: Record<string, number> = {};
    this.errorCounts.forEach((count, key) => {
      errorCountsObject[key] = count;
    });

    return {
      activeOperations: this.performanceMetrics.size,
      errorCounts: errorCountsObject,
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      integrationEnabled: this.integrationEnabled
    };
  }

  /**
   * Clear error counts and performance metrics
   */
  public clearMetrics(): void {
    this.errorCounts.clear();
    this.performanceMetrics.clear();
    logger.info('Worker integration metrics cleared');
  }

  // Event handlers
  private handleTaskStarted(task: any, worker: any): void {
    logger.debug('Task started in worker:', { taskId: task.id, workerId: worker.id });
  }

  private handleTaskProgress(task: any, worker: any): void {
    logger.debug('Task progress:', {
      taskId: task.id,
      progress: task.progress,
      workerId: worker.id
    });
  }

  private handleTaskCompleted(task: any, worker: any): void {
    logger.debug('Task completed in worker:', {
      taskId: task.id,
      workerId: worker.id,
      duration: task.completedAt?.getTime() - task.startedAt?.getTime()
    });
  }

  private handleTaskFailed(task: any, worker: any): void {
    logger.warn('Task failed in worker:', {
      taskId: task.id,
      workerId: worker.id,
      error: task.error?.message
    });
  }

  private handleTaskCancelled(task: any, worker: any): void {
    logger.debug('Task cancelled in worker:', { taskId: task.id, workerId: worker.id });
  }

  private handleWorkerCreated(data: any): void {
    logger.debug('Worker created:', data);
  }

  private handleWorkerDestroyed(data: any): void {
    logger.debug('Worker destroyed:', data);
  }

  private handlePoolResized(data: any): void {
    logger.debug('Worker pool resized:', data);
  }

  private handlePoolError(data: any): void {
    logger.error('Worker pool error:', data);
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `worker-op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const workerIntegration = WorkerIntegrationManager.getInstance();

/**
 * Convenience function to execute tasks with full integration
 */
export const executeWorkerTask = async <T = any>(
  type: string,
  category: WorkerTaskCategory,
  data: any,
  options?: any
): Promise<TaskResult<T>> => {
  return await workerIntegration.executeTaskWithIntegration<T>(type, category, data, options);
};

/**
 * Initialize worker integration
 */
export const initializeWorkerIntegration = async (): Promise<void> => {
  // Ensure worker manager is initialized
  await workerManager.initialize();

  logger.info('Web Worker integration initialized');
};

/**
 * Get worker integration health status
 */
export const getWorkerIntegrationHealth = (): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  stats: any;
  issues: string[];
} => {
  const stats = workerIntegration.getIntegrationStats();
  const issues: string[] = [];

  // Check for issues
  if (stats.activeOperations > 10) {
    issues.push('High number of active operations');
  }

  const totalErrors = Object.values(stats.errorCounts).reduce((sum: number, count: number) => sum + count, 0);
  if (totalErrors > 50) {
    issues.push('High error rate');
  }

  // Determine health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (issues.length > 2) {
    status = 'unhealthy';
  } else if (issues.length > 0) {
    status = 'degraded';
  }

  return {
    status,
    stats,
    issues
  };
};
