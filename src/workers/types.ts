/**
 * Web Worker Types and Interfaces
 * Defines types for worker management, communication, and operations
 */

// Worker task categories matching tool categories
export type WorkerTaskCategory =
  | 'json-processing'
  | 'code-execution'
  | 'file-processing'
  | 'network-utilities'
  | 'text-processing'
  | 'security-encryption';

// Worker task status
export type WorkerTaskStatus =
  | 'pending'
  | 'running'
  | 'progress'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled';

// Worker types
export type WorkerType =
  | 'dedicated'  // Single task worker
  | 'shared';    // Shared pool worker

// Worker priority levels
export type WorkerPriority = 'low' | 'normal' | 'high' | 'critical';

// Worker task interface
export interface WorkerTask {
  id: string;
  type: string;
  category: WorkerTaskCategory;
  priority: WorkerPriority;
  data: any;
  options?: WorkerTaskOptions;
  timeout?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: WorkerTaskStatus;
  progress?: number;
  result?: any;
  error?: WorkerError;
  retries: number;
  maxRetries: number;
  workerId?: string;
  metadata?: Record<string, any>;
}

// Worker task options
export interface WorkerTaskOptions {
  timeout?: number;
  maxRetries?: number;
  priority?: WorkerPriority;
  progressCallback?: (progress: number, message?: string) => void;
  cancelToken?: string;
  metadata?: Record<string, any>;
}

// Worker error interface
export interface WorkerError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
}

// Worker pool configuration
export interface WorkerPoolConfig {
  maxWorkers: number;
  minWorkers: number;
  maxIdleTime: number; // milliseconds
  maxTaskTime: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  enableProfiling: boolean;
  enableLogging: boolean;
}

// Worker instance information
export interface WorkerInstance {
  id: string;
  type: WorkerType;
  category: WorkerTaskCategory;
  status: 'idle' | 'busy' | 'terminating' | 'error';
  currentTask?: WorkerTask;
  taskCount: number;
  totalExecutionTime: number;
  memoryUsage?: number;
  createdAt: Date;
  lastUsedAt: Date;
  errorCount: number;
  worker: Worker;
  scripts: string[];
}

// Worker message types
export interface WorkerMessage {
  id: string;
  type: WorkerMessageType;
  payload: any;
  timestamp: Date;
  workerId?: string;
  taskId?: string;
}

export type WorkerMessageType =
  | 'task-init'
  | 'task-execute'
  | 'task-progress'
  | 'task-complete'
  | 'task-error'
  | 'task-cancel'
  | 'worker-ready'
  | 'worker-error'
  | 'worker-terminate'
  | 'pool-stats'
  | 'ping'
  | 'pong';

// Worker response interface
export interface WorkerResponse<T = any> {
  taskId: string;
  success: boolean;
  result?: T;
  error?: WorkerError;
  progress?: number;
  message?: string;
  executionTime: number;
  timestamp: Date;
}

// Worker pool statistics
export interface WorkerPoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  averageExecutionTime: number;
  poolUtilization: number;
  memoryUsage: number;
  lastUpdated: Date;
}

// Worker performance metrics
export interface WorkerPerformanceMetrics {
  taskId: string;
  workerId: string;
  category: WorkerTaskCategory;
  executionTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  inputSize: number;
  outputSize: number;
  timestamp: Date;
}

// Worker event interfaces
export interface WorkerTaskEvent {
  type: 'task-started' | 'task-progress' | 'task-completed' | 'task-failed' | 'task-cancelled';
  task: WorkerTask;
  worker: WorkerInstance;
  timestamp: Date;
}

export interface WorkerPoolEvent {
  type: 'worker-created' | 'worker-destroyed' | 'pool-resized' | 'pool-error';
  data: any;
  timestamp: Date;
}

// Worker manager configuration
export interface WorkerManagerConfig {
  pools: Record<WorkerTaskCategory, WorkerPoolConfig>;
  globalTimeout: number;
  enableProgressTracking: boolean;
  enableErrorRecovery: boolean;
  enableProfiling: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Task result interface with metadata
export interface TaskResult<T = any> {
  success: boolean;
  data?: T;
  error?: WorkerError;
  metadata: {
    taskId: string;
    workerId: string;
    executionTime: number;
    memoryUsage: number;
    completedAt: Date;
    retries: number;
  };
}

// Worker script interface
export interface WorkerScript {
  name: string;
  category: WorkerTaskCategory;
  version: string;
  url: string;
  dependencies?: string[];
  functions: WorkerFunction[];
  memoryRequirement: number;
  initializationTimeout: number;
}

// Worker function definition
export interface WorkerFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  returnType: string;
  estimatedTime: number;
  memoryIntensity: 'low' | 'medium' | 'high';
  pure: boolean;
}

// Worker event callbacks
export type WorkerTaskEventCallback = (event: WorkerTaskEvent) => void;
export type WorkerPoolEventCallback = (event: WorkerPoolEvent) => void;
export type WorkerProgressCallback = (taskId: string, progress: number, message?: string) => void;
export type WorkerErrorCallback = (taskId: string, error: WorkerError) => void;

// Worker task execution options
export interface WorkerTaskExecutionOptions {
  priority?: WorkerPriority;
  timeout?: number;
  retries?: number;
  onProgress?: WorkerProgressCallback;
  onError?: WorkerErrorCallback;
  onComplete?: (result: TaskResult) => void;
  onCancel?: () => void;
}

// Worker category configurations
export const WORKER_CATEGORY_CONFIGS: Record<WorkerTaskCategory, WorkerPoolConfig> = {
  'json-processing': {
    maxWorkers: 4,
    minWorkers: 1,
    maxIdleTime: 30000,
    maxTaskTime: 10000,
    retryAttempts: 2,
    retryDelay: 1000,
    enableProfiling: true,
    enableLogging: true
  },
  'code-execution': {
    maxWorkers: 2,
    minWorkers: 1,
    maxIdleTime: 60000,
    maxTaskTime: 30000,
    retryAttempts: 1,
    retryDelay: 2000,
    enableProfiling: true,
    enableLogging: true
  },
  'file-processing': {
    maxWorkers: 3,
    minWorkers: 1,
    maxIdleTime: 45000,
    maxTaskTime: 60000,
    retryAttempts: 2,
    retryDelay: 1500,
    enableProfiling: true,
    enableLogging: true
  },
  'network-utilities': {
    maxWorkers: 4,
    minWorkers: 1,
    maxIdleTime: 30000,
    maxTaskTime: 15000,
    retryAttempts: 3,
    retryDelay: 500,
    enableProfiling: false,
    enableLogging: true
  },
  'text-processing': {
    maxWorkers: 5,
    minWorkers: 2,
    maxIdleTime: 20000,
    maxTaskTime: 8000,
    retryAttempts: 2,
    retryDelay: 750,
    enableProfiling: true,
    enableLogging: true
  },
  'security-encryption': {
    maxWorkers: 2,
    minWorkers: 1,
    maxIdleTime: 60000,
    maxTaskTime: 20000,
    retryAttempts: 1,
    retryDelay: 1000,
    enableProfiling: true,
    enableLogging: true
  }
};

// Worker task factory
export interface WorkerTaskFactory {
  createTask<T = any>(
    type: string,
    category: WorkerTaskCategory,
    data: T,
    options?: WorkerTaskOptions
  ): WorkerTask;
}

// Utility type for worker task data
export type WorkerTaskData<T = any> = T & {
  operation: string;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
};

// Error codes for worker operations
export enum WorkerErrorCode {
  TIMEOUT = 'WORKER_TIMEOUT',
  MEMORY_LIMIT = 'WORKER_MEMORY_LIMIT',
  SCRIPT_ERROR = 'WORKER_SCRIPT_ERROR',
  COMMUNICATION_ERROR = 'WORKER_COMMUNICATION_ERROR',
  INITIALIZATION_ERROR = 'WORKER_INITIALIZATION_ERROR',
  TASK_CANCELLED = 'WORKER_TASK_CANCELLED',
  POOL_EXHAUSTED = 'WORKER_POOL_EXHAUSTED',
  INVALID_TASK = 'WORKER_INVALID_TASK',
  WORKER_CRASHED = 'WORKER_CRASHED',
  RESOURCE_EXHAUSTED = 'WORKER_RESOURCE_EXHAUSTED'
}

// Worker health status
export interface WorkerHealthStatus {
  workerId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastActivity: Date;
  consecutiveErrors: number;
  averageResponseTime: number;
  memoryUsage: number;
  uptime: number;
}

// Global worker registry
export interface WorkerRegistry {
  scripts: Map<string, WorkerScript>;
  pools: Map<WorkerTaskCategory, string[]>;
  workers: Map<string, WorkerInstance>;
  tasks: Map<string, WorkerTask>;
}
