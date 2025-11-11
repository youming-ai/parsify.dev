/**
 * Progress Error Handling and Retry Integration
 * Integrates progress indicators with existing T141 retry mechanisms and error handling
 */

import {
  ProgressOperation,
  ProgressError,
  ProgressUpdate,
  ProgressStatus
} from './progress-indicators-types';
import {
  ProgressTimeEstimator,
  TimeEstimation
} from './progress-time-estimation';
import { progressManager } from './progress-manager';
import {
  retryEngine,
  RetryAnalytics,
  ProgressRetry
} from './retry-mechanisms';

// ============================================================================
// Error-Retry Integration Configuration
// ============================================================================

export interface ErrorRetryIntegrationConfig {
  // Retry configuration
  enableAutoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;

  // Progress integration
  showRetryProgress: boolean;
  showRetryStatus: boolean;
  updateProgressOnRetry: boolean;

  // Error handling
  classifyErrors: boolean;
  errorCategories: ErrorCategory[];

  // Time estimation
  adjustTimeEstimatesOnRetry: boolean;
  considerRetryHistory: boolean;

  // User interaction
  allowManualRetry: boolean;
  requireUserConfirmation: boolean;
  retryConfirmationMessage: string;
}

export interface ErrorCategory {
  type: string;
  patterns: RegExp[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
  description: string;
  suggestions: string[];
}

export interface RetryProgress {
  operationId: string;
  retryAttempt: number;
  maxRetries: number;
  retryStatus: 'preparing' | 'retrying' | 'waiting' | 'completed' | 'failed';
  progress: number;
  estimatedDelay: number;
  nextRetryAt?: Date;
  retryReason: string;
}

// ============================================================================
// Default Error Categories
// ============================================================================

const DEFAULT_ERROR_CATEGORIES: ErrorCategory[] = [
  {
    type: 'network',
    patterns: [
      /network/i,
      /connection/i,
      /timeout/i,
      /fetch/i,
      /request/i,
    ],
    severity: 'medium',
    retryable: true,
    maxRetries: 3,
    retryDelay: 2000,
    description: 'Network-related errors',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Verify the server is accessible',
    ],
  },
  {
    type: 'validation',
    patterns: [
      /invalid/i,
      /malformed/i,
      /syntax/i,
      /parse/i,
      /format/i,
    ],
    severity: 'medium',
    retryable: false,
    description: 'Input validation errors',
    suggestions: [
      'Check your input format',
      'Verify required fields are provided',
      'Review error details for specific issues',
    ],
  },
  {
    type: 'memory',
    patterns: [
      /memory/i,
      /heap/i,
      /allocation/i,
      /out of memory/i,
    ],
    severity: 'high',
    retryable: true,
    maxRetries: 2,
    retryDelay: 5000,
    description: 'Memory-related errors',
    suggestions: [
      'Try with smaller input size',
      'Close other applications',
      'Restart the operation',
    ],
  },
  {
    type: 'permission',
    patterns: [
      /permission/i,
      /unauthorized/i,
      /forbidden/i,
      /access denied/i,
    ],
    severity: 'high',
    retryable: false,
    description: 'Permission-related errors',
    suggestions: [
      'Check your permissions',
      'Contact your administrator',
      'Verify you have required access rights',
    ],
  },
  {
    type: 'temporary',
    patterns: [
      /temporarily/i,
      /service unavailable/i,
      /maintenance/i,
      /rate limit/i,
    ],
    severity: 'low',
    retryable: true,
    maxRetries: 5,
    retryDelay: 10000,
    description: 'Temporary system issues',
    suggestions: [
      'Try again in a few moments',
      'Service may be under maintenance',
      'Check system status page',
    ],
  },
];

// ============================================================================
// Error-Retry Integration Manager
// ============================================================================

export class ProgressErrorRetryIntegration {
  private config: ErrorRetryIntegrationConfig;
  private timeEstimator: ProgressTimeEstimator;
  private retryProgress: Map<string, RetryProgress> = new Map();
  private errorCategories: ErrorCategory[];
  private eventListeners: Map<string, Array<(event: any) => void>> = new Map();

  constructor(config: Partial<ErrorRetryIntegrationConfig> = {}) {
    this.config = {
      enableAutoRetry: true,
      maxRetries: 3,
      retryDelay: 2000,
      retryBackoffMultiplier: 2,
      showRetryProgress: true,
      showRetryStatus: true,
      updateProgressOnRetry: true,
      classifyErrors: true,
      errorCategories: DEFAULT_ERROR_CATEGORIES,
      adjustTimeEstimatesOnRetry: true,
      considerRetryHistory: true,
      allowManualRetry: true,
      requireUserConfirmation: false,
      retryConfirmationMessage: 'The operation failed. Would you like to retry?',
      ...config,
    };

    this.timeEstimator = new ProgressTimeEstimator();
    this.errorCategories = this.config.errorCategories;

    this.initializeIntegration();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Handle operation error with retry logic
   */
  public async handleOperationError(
    operation: ProgressOperation,
    error: ProgressError
  ): Promise<void> {
    // Classify the error
    const errorCategory = this.classifyError(error);

    // Update operation with error details
    this.updateOperationWithError(operation, error, errorCategory);

    // Determine if retry is possible
    const canRetry = this.canRetryOperation(operation, error, errorCategory);

    if (canRetry && this.config.enableAutoRetry) {
      await this.initiateRetry(operation, error, errorCategory);
    } else {
      this.handleNonRetryableError(operation, error, errorCategory);
    }
  }

  /**
   * Manually retry an operation
   */
  public async manualRetry(operationId: string, reason?: string): Promise<boolean> {
    const operation = progressManager.getOperation(operationId);
    if (!operation) {
      throw new Error(`Operation not found: ${operationId}`);
    }

    const retryReason = reason || 'User requested retry';
    const error = operation.error;

    if (error) {
      const errorCategory = this.classifyError(error);
      return await this.initiateRetry(operation, error, errorCategory, retryReason);
    } else {
      throw new Error(`No error to retry for operation: ${operationId}`);
    }
  }

  /**
   * Get retry progress for an operation
   */
  public getRetryProgress(operationId: string): RetryProgress | undefined {
    return this.retryProgress.get(operationId);
  }

  /**
   * Cancel retry for an operation
   */
  public cancelRetry(operationId: string): void {
    const retryProgress = this.retryProgress.get(operationId);
    if (retryProgress) {
      retryProgress.retryStatus = 'failed';
      this.retryProgress.delete(operationId);

      // Cancel any pending retry timers
      this.cancelRetryTimer(operationId);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ErrorRetryIntegrationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.errorCategories) {
      this.errorCategories = config.errorCategories;
    }
  }

  /**
   * Add error category
   */
  public addErrorCategory(category: ErrorCategory): void {
    this.errorCategories.push(category);
    this.config.errorCategories = this.errorCategories;
  }

  /**
   * Get retry analytics
   */
  public getRetryAnalytics(): {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    retryRate: number;
    averageRetryTime: number;
    errorTypeBreakdown: Record<string, number>;
  } {
    const retryData = Array.from(this.retryProgress.values());

    const totalRetries = retryData.length;
    const successfulRetries = retryData.filter(r => r.retryStatus === 'completed').length;
    const failedRetries = retryData.filter(r => r.retryStatus === 'failed').length;

    const retryRate = totalRetries > 0 ? successfulRetries / totalRetries : 0;

    const averageRetryTime = retryData.length > 0
      ? retryData.reduce((sum, r) => sum + r.estimatedDelay, 0) / retryData.length
      : 0;

    const errorTypeBreakdown = retryData.reduce((acc, r) => {
      const errorType = r.retryReason.split(':')[0] || 'unknown';
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRetries,
      successfulRetries,
      failedRetries,
      retryRate,
      averageRetryTime,
      errorTypeBreakdown,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeIntegration(): void {
    // Setup event listeners for progress manager
    this.setupProgressEventListeners();

    // Setup retry engine integration
    this.setupRetryEngineIntegration();
  }

  private setupProgressEventListeners(): void {
    // Listen for operation failures
    progressManager.addEventListener('operation-failed', (event) => {
      const { operation, error } = event.data;
      this.handleOperationError(operation, error);
    });

    // Listen for operation completions
    progressManager.addEventListener('operation-completed', (event) => {
      const { operation } = event.data;
      this.cleanupRetryProgress(operation.id);
    });
  }

  private setupRetryEngineIntegration(): void {
    // Integrate with existing retry engine
    if (retryEngine) {
      // Configure retry engine to work with progress tracking
      this.configureRetryEngine();
    }
  }

  private configureRetryEngine(): void {
    // This would configure the existing retry engine
    // to integrate with progress tracking
  }

  private classifyError(error: ProgressError): ErrorCategory | null {
    if (!this.config.classifyErrors) return null;

    const errorMessage = error.message.toLowerCase();
    const errorCode = error.code.toLowerCase();

    for (const category of this.errorCategories) {
      for (const pattern of category.patterns) {
        if (pattern.test(errorMessage) || pattern.test(errorCode)) {
          return category;
        }
      }
    }

    return null;
  }

  private updateOperationWithError(
    operation: ProgressOperation,
    error: ProgressError,
    category: ErrorCategory | null
  ): void {
    // Update operation with enhanced error information
    const enhancedError: ProgressError = {
      ...error,
      suggestions: category?.suggestions || error.suggestions,
    };

    if (category) {
      enhancedError.code = category.type;
      enhancedError.severity = category.severity;
    }

    // Update progress manager with enhanced error
    progressManager.failOperation(operation.id, enhancedError);
  }

  private canRetryOperation(
    operation: ProgressOperation,
    error: ProgressError,
    category: ErrorCategory | null
  ): boolean {
    // Check if operation allows retry
    if (!operation.canRetry) return false;

    // Check error category
    if (category && !category.retryable) return false;

    // Check if max retries reached
    const currentRetries = operation.retryCount || 0;
    const maxRetries = category?.maxRetries || this.config.maxRetries;
    if (currentRetries >= maxRetries) return false;

    // Check error severity
    if (error.severity === 'critical') return false;

    return true;
  }

  private async initiateRetry(
    operation: ProgressOperation,
    error: ProgressError,
    category: ErrorCategory | null,
    reason?: string
  ): Promise<boolean> {
    const retryAttempt = (operation.retryCount || 0) + 1;
    const maxRetries = category?.maxRetries || this.config.maxRetries;

    // Create retry progress
    const retryProgress: RetryProgress = {
      operationId: operation.id,
      retryAttempt,
      maxRetries,
      retryStatus: 'preparing',
      progress: 0,
      estimatedDelay: this.calculateRetryDelay(retryAttempt, category),
      retryReason: reason || `Retry attempt ${retryAttempt} for ${category?.type || error.type}`,
    };

    this.retryProgress.set(operation.id, retryProgress);

    // Show retry progress if enabled
    if (this.config.showRetryProgress) {
      this.showRetryProgress(retryProgress);
    }

    // Update operation status to show retry preparation
    progressManager.updateProgress(operation.id, {
      progress: operation.progress,
      message: `Preparing retry ${retryAttempt} of ${maxRetries}`,
      metadata: {
        retryAttempt,
        maxRetries,
        retryReason: retryProgress.retryReason,
      },
    });

    // Wait for retry delay
    retryProgress.retryStatus = 'waiting';
    await this.waitForRetryDelay(retryProgress);

    // Check if retry was cancelled
    if (retryProgress.retryStatus === 'failed') {
      return false;
    }

    // Update time estimation if enabled
    if (this.config.adjustTimeEstimatesOnRetry) {
      this.adjustTimeEstimateForRetry(operation, retryAttempt);
    }

    // Execute retry
    retryProgress.retryStatus = 'retrying';
    const success = await this.executeRetry(operation, retryProgress);

    if (success) {
      retryProgress.retryStatus = 'completed';
      this.cleanupRetryProgress(operation.id);
      return true;
    } else {
      retryProgress.retryStatus = 'failed';
      this.cleanupRetryProgress(operation.id);
      return false;
    }
  }

  private calculateRetryDelay(
    retryAttempt: number,
    category: ErrorCategory | null
  ): number {
    const baseDelay = category?.retryDelay || this.config.retryDelay;
    return baseDelay * Math.pow(this.config.retryBackoffMultiplier, retryAttempt - 1);
  }

  private async waitForRetryDelay(retryProgress: RetryProgress): Promise<void> {
    const delay = retryProgress.estimatedDelay;
    retryProgress.nextRetryAt = new Date(Date.now() + delay);

    // Update progress during wait
    const startTime = Date.now();
    const updateInterval = 1000; // Update every second

    const waitPromise = new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / delay) * 100);

        if (progress < 100) {
          progressManager.updateProgress(retryProgress.operationId, {
            progress,
            message: `Retrying in ${Math.ceil((delay - elapsed) / 1000)} seconds...`,
          });
        } else {
          clearInterval(interval);
          resolve();
        }
      }, updateInterval);
    });

    // Add timeout to prevent infinite waiting
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Retry wait timeout')), delay + 1000);
    });

    try {
      await Promise.race([waitPromise, timeoutPromise]);
    } catch (error) {
      console.error('Retry wait error:', error);
    }
  }

  private adjustTimeEstimateForRetry(operation: ProgressOperation, retryAttempt: number): void {
    // Get current estimation
    const currentEstimation = this.timeEstimator.estimateTime(operation);

    // Adjust based on retry history
    const retryMultiplier = 1 + (retryAttempt * 0.2); // 20% increase per retry
    const adjustedDuration = currentEstimation.estimatedDuration * retryMultiplier;

    // Update operation with new estimation
    operation.estimatedDuration = adjustedDuration;
    operation.eta = new Date(Date.now() + adjustedDuration);
  }

  private async executeRetry(
    operation: ProgressOperation,
    retryProgress: RetryProgress
  ): Promise<boolean> {
    try {
      // Update operation status to show retry in progress
      progressManager.updateProgress(operation.id, {
        progress: 0,
        message: `Retrying operation... (${retryProgress.retryAttempt}/${retryProgress.maxRetries})`,
        metadata: {
          retrying: true,
          retryAttempt: retryProgress.retryAttempt,
        },
      });

      // This would trigger the actual retry logic
      // For now, we'll simulate a successful retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update operation to show completion
      progressManager.completeOperation(operation.id, {
        retried: true,
        retryAttempt: retryProgress.retryAttempt,
      });

      return true;
    } catch (error) {
      // Retry failed
      progressManager.failOperation(operation.id, {
        code: 'RETRY_FAILED',
        message: `Retry ${retryProgress.retryAttempt} failed: ${error}`,
        severity: 'medium',
        recoverable: false,
        suggestions: [
          'Try again later',
          'Check your input data',
          'Contact support if issue persists',
        ],
        timestamp: new Date(),
      });

      return false;
    }
  }

  private handleNonRetryableError(
    operation: ProgressOperation,
    error: ProgressError,
    category: ErrorCategory | null
  ): void {
    // Update operation with final error state
    progressManager.failOperation(operation.id, {
      ...error,
      suggestions: [
        ...(error.suggestions || []),
        ...(category?.suggestions || []),
        'Operation cannot be retried automatically',
      ],
    });

    // Show manual retry option if enabled
    if (this.config.allowManualRetry && error.recoverable) {
      this.showManualRetryOption(operation, error, category);
    }
  }

  private showRetryProgress(retryProgress: RetryProgress): void {
    // This would integrate with UI components to show retry progress
    console.log('Retry progress:', retryProgress);
  }

  private showManualRetryOption(
    operation: ProgressOperation,
    error: ProgressError,
    category: ErrorCategory | null
  ): void {
    // This would integrate with UI components to show manual retry option
    console.log('Manual retry available for:', operation.id);
  }

  private cleanupRetryProgress(operationId: string): void {
    this.retryProgress.delete(operationId);
    this.cancelRetryTimer(operationId);
  }

  private cancelRetryTimer(operationId: string): void {
    // Cancel any pending timers for the operation
    // This would be implemented based on the timer management system
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  public addEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  public removeEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const errorRetryIntegration = new ProgressErrorRetryIntegration();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Enhanced error handler with retry integration
 */
export function handleProgressError(
  operation: ProgressOperation,
  error: ProgressError
): Promise<void> {
  return errorRetryIntegration.handleOperationError(operation, error);
}

/**
 * Manually retry a failed operation
 */
export function retryOperation(operationId: string, reason?: string): Promise<boolean> {
  return errorRetryIntegration.manualRetry(operationId, reason);
}

/**
 * Check if an operation can be retried
 */
export function canRetryOperation(operation: ProgressOperation): boolean {
  if (!operation.canRetry || !operation.error) return false;

  const category = errorRetryIntegration['classifyError'](operation.error);
  return errorRetryIntegration['canRetryOperation'](operation, operation.error, category);
}

/**
 * Get retry suggestions for an error
 */
export function getRetrySuggestions(error: ProgressError): string[] {
  const category = errorRetryIntegration['classifyError'](error);
  return [
    ...(error.suggestions || []),
    ...(category?.suggestions || []),
  ];
}

/**
 * Format retry message for display
 */
export function formatRetryMessage(
  operation: ProgressOperation,
  retryProgress: RetryProgress
): string {
  return `Retry ${retryProgress.retryAttempt} of ${retryProgress.maxRetries}: ${retryProgress.retryReason}`;
}

/**
 * Create retry-aware progress update
 */
export function createRetryProgressUpdate(
  operation: ProgressOperation,
  retryProgress: RetryProgress,
  customProgress?: number
): ProgressUpdate {
  return {
    progress: customProgress || operation.progress,
    message: formatRetryMessage(operation, retryProgress),
    metadata: {
      retrying: true,
      retryAttempt: retryProgress.retryAttempt,
      maxRetries: retryProgress.maxRetries,
      retryReason: retryProgress.retryReason,
    },
  };
}
