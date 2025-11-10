/**
 * Comprehensive Error Handling System for Analytics and Monitoring
 * Provides centralized error handling, recovery mechanisms, and logging for SC-012 compliance
 */

import {
  AnalyticsError,
  ErrorCode,
  AnalyticsSystem,
  ErrorContext,
  RetryConfig,
  ApiResponse
} from './types';

// ============================================================================
// Error Classes
// ============================================================================

export class AnalyticsInitializationError extends AnalyticsError {
  constructor(system: AnalyticsSystem, message: string, originalError?: Error) {
    super(message);
    this.name = 'AnalyticsInitializationError';
    this.code = 'INITIALIZATION_FAILED';
    this.system = system;
    this.context = this.createErrorContext(system, 'initialize');
    this.retryable = false;
    this.originalError = originalError;
  }
}

export class AnalyticsTrackingError extends AnalyticsError {
  constructor(system: AnalyticsSystem, operation: string, message: string, retryable = true) {
    super(message);
    this.name = 'AnalyticsTrackingError';
    this.code = 'OPERATION_FAILED';
    this.system = system;
    this.context = this.createErrorContext(system, operation);
    this.retryable = retryable;
    this.retryConfig = this.getDefaultRetryConfig();
  }

  private getDefaultRetryConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableErrors: [
        'NETWORK_ERROR',
        'TIMEOUT',
        'STORAGE_ERROR',
        'QUOTA_EXCEEDED'
      ]
    };
  }
}

export class AnalyticsValidationError extends AnalyticsError {
  constructor(system: AnalyticsSystem, field: string, value: any, expectedType: string) {
    const message = `Invalid ${field}: expected ${expectedType}, got ${typeof value}`;
    super(message);
    this.name = 'AnalyticsValidationError';
    this.code = 'DATA_VALIDATION_FAILED';
    this.system = system;
    this.context = this.createErrorContext(system, 'validate');
    this.retryable = false;
  }
}

export class AnalyticsNetworkError extends AnalyticsError {
  constructor(system: AnalyticsSystem, operation: string, url: string, statusCode?: number) {
    const message = `Network error during ${operation} to ${url}${statusCode ? ` (${statusCode})` : ''}`;
    super(message);
    this.name = 'AnalyticsNetworkError';
    this.code = 'NETWORK_ERROR';
    this.system = system;
    this.context = this.createErrorContext(system, operation, { url, statusCode });
    this.retryable = true;
    this.retryConfig = {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT']
    };
  }
}

export class AnalyticsStorageError extends AnalyticsError {
  constructor(system: AnalyticsSystem, operation: string, storageType: 'localStorage' | 'sessionStorage' | 'indexedDB', originalError?: Error) {
    const message = `Storage error during ${operation} on ${storageType}`;
    super(message);
    this.name = 'AnalyticsStorageError';
    this.code = 'STORAGE_ERROR';
    this.system = system;
    this.context = this.createErrorContext(system, operation, { storageType });
    this.retryable = storageType !== 'localStorage'; // localStorage errors are usually not retryable
    this.originalError = originalError;
  }
}

export class AnalyticsQuotaExceededError extends AnalyticsError {
  constructor(system: AnalyticsSystem, storageType: string, currentUsage: number, limit: number) {
    const message = `Storage quota exceeded for ${storageType}: ${currentUsage}/${limit}`;
    super(message);
    this.name = 'AnalyticsQuotaExceededError';
    this.code = 'QUOTA_EXCEEDED';
    this.system = system;
    this.context = this.createErrorContext(system, 'quota_check', { storageType, currentUsage, limit });
    this.retryable = false;
  }
}

export class AnalyticsTimeoutError extends AnalyticsError {
  constructor(system: AnalyticsSystem, operation: string, timeout: number) {
    const message = `Operation ${operation} timed out after ${timeout}ms`;
    super(message);
    this.name = 'AnalyticsTimeoutError';
    this.code = 'TIMEOUT';
    this.system = system;
    this.context = this.createErrorContext(system, operation, { timeout });
    this.retryable = true;
    this.retryConfig = {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 2000,
      backoffFactor: 1.5,
      retryableErrors: ['TIMEOUT']
    };
  }
}

export class AnalyticsPermissionError extends AnalyticsError {
  constructor(system: AnalyticsSystem, permission: string, reason: string) {
    const message = `Permission denied for ${permission}: ${reason}`;
    super(message);
    this.name = 'AnalyticsPermissionError';
    this.code = 'PERMISSION_DENIED';
    this.system = system;
    this.context = this.createErrorContext(system, 'permission_check', { permission, reason });
    this.retryable = false;
  }
}

export class AnalyticsConfigurationError extends AnalyticsError {
  constructor(system: AnalyticsSystem, configPath: string, issue: string) {
    const message = `Configuration error at ${configPath}: ${issue}`;
    super(message);
    this.name = 'AnalyticsConfigurationError';
    this.code = 'CONFIGURATION_ERROR';
    this.system = system;
    this.context = this.createErrorContext(system, 'config_validation', { configPath, issue });
    this.retryable = false;
  }
}

// ============================================================================
// Error Handler Class
// ============================================================================

export class AnalyticsErrorHandler {
  private static instance: AnalyticsErrorHandler;
  private errorHandlers: Map<ErrorCode, ErrorHandlerFunction> = new Map();
  private globalHandlers: ErrorHandlerFunction[] = [];
  private errorBuffer: AnalyticsError[] = [];
  private maxBufferSize = 1000;
  private retryQueue: RetryQueueItem[] = [];
  private isProcessingQueue = false;
  private logger: AnalyticsLogger;

  private constructor() {
    this.logger = AnalyticsLogger.getInstance();
    this.setupDefaultHandlers();
  }

  public static getInstance(): AnalyticsErrorHandler {
    if (!AnalyticsErrorHandler.instance) {
      AnalyticsErrorHandler.instance = new AnalyticsErrorHandler();
    }
    return AnalyticsErrorHandler.instance;
  }

  // Handle an error
  public async handleError(error: AnalyticsError): Promise<ErrorHandlingResult> {
    try {
      // Log the error
      this.logger.error(error);

      // Add to buffer for analysis
      this.addToBuffer(error);

      // Get specific handler for this error type
      const handler = this.errorHandlers.get(error.code);
      if (handler) {
        return await handler(error);
      }

      // Try global handlers
      for (const globalHandler of this.globalHandlers) {
        try {
          const result = await globalHandler(error);
          if (result.handled) {
            return result;
          }
        } catch (handlerError) {
          this.logger.error('Error in global handler:', handlerError);
        }
      }

      // Default handling
      return await this.defaultErrorHandler(error);

    } catch (handlingError) {
      this.logger.error('Error in error handling:', handlingError);
      return {
        handled: false,
        shouldRetry: false,
        retryDelay: 0,
        fallbackAction: 'none'
      };
    }
  }

  // Register a handler for a specific error type
  public registerHandler(errorCode: ErrorCode, handler: ErrorHandlerFunction): void {
    this.errorHandlers.set(errorCode, handler);
  }

  // Register a global error handler
  public registerGlobalHandler(handler: ErrorHandlerFunction): void {
    this.globalHandlers.push(handler);
  }

  // Add error to retry queue
  public addToRetryQueue(error: AnalyticsError, retryFunction: () => Promise<any>): void {
    if (!error.retryable || !error.retryConfig) {
      return;
    }

    const retryItem: RetryQueueItem = {
      id: this.generateRetryId(),
      error,
      retryFunction,
      attempts: 0,
      nextRetryTime: Date.now(),
      maxAttempts: error.retryConfig.maxAttempts
    };

    this.retryQueue.push(retryItem);
    this.processRetryQueue();
  }

  // Get error statistics
  public getErrorStatistics(): ErrorStatistics {
    const errorCounts = new Map<ErrorCode, number>();
    const systemCounts = new Map<AnalyticsSystem, number>();
    const recentErrors = this.errorBuffer.filter(e =>
      Date.now() - e.context.timestamp.getTime() < 3600000 // Last hour
    );

    this.errorBuffer.forEach(error => {
      errorCounts.set(error.code, (errorCounts.get(error.code) || 0) + 1);
      systemCounts.set(error.system, (systemCounts.get(error.system) || 0) + 1);
    });

    return {
      totalErrors: this.errorBuffer.length,
      recentErrors: recentErrors.length,
      errorsByCode: Object.fromEntries(errorCounts),
      errorsBySystem: Object.fromEntries(systemCounts),
      retryQueueSize: this.retryQueue.length,
      lastHourErrorRate: recentErrors.length / 60, // errors per minute
      topErrors: this.getTopErrors(5)
    };
  }

  // Clear error buffer
  public clearBuffer(): void {
    this.errorBuffer = [];
  }

  // Get error buffer
  public getErrorBuffer(limit?: number): AnalyticsError[] {
    return limit ? this.errorBuffer.slice(-limit) : [...this.errorBuffer];
  }

  // Private methods

  private setupDefaultHandlers(): void {
    // Network error handler
    this.registerHandler('NETWORK_ERROR', async (error) => {
      if (error.retryable) {
        return {
          handled: true,
          shouldRetry: true,
          retryDelay: this.calculateRetryDelay(error),
          fallbackAction: 'use_cached_data'
        };
      }
      return {
        handled: true,
        shouldRetry: false,
        retryDelay: 0,
        fallbackAction: 'degrade_functionality'
      };
    });

    // Storage error handler
    this.registerHandler('STORAGE_ERROR', async (error) => {
      if (error.context.additionalData?.storageType === 'localStorage') {
        // Try to free up space
        await this.freeUpStorageSpace();
        return {
          handled: true,
          shouldRetry: true,
          retryDelay: 1000,
          fallbackAction: 'use_memory_storage'
        };
      }
      return {
        handled: true,
        shouldRetry: false,
        retryDelay: 0,
        fallbackAction: 'skip_storage'
      };
    });

    // Quota exceeded error handler
    this.registerHandler('QUOTA_EXCEEDED', async (error) => {
      await this.performStorageCleanup();
      return {
        handled: true,
        shouldRetry: true,
        retryDelay: 2000,
        fallbackAction: 'reduce_data_collection'
      };
    });

    // Timeout error handler
    this.registerHandler('TIMEOUT', async (error) => {
      return {
        handled: true,
        shouldRetry: true,
        retryDelay: this.calculateRetryDelay(error),
        fallbackAction: 'skip_operation'
      };
    });

    // Validation error handler
    this.registerHandler('DATA_VALIDATION_FAILED', async (error) => {
      this.logger.warn('Data validation failed, skipping invalid data');
      return {
        handled: true,
        shouldRetry: false,
        retryDelay: 0,
        fallbackAction: 'skip_invalid_data'
      };
    });

    // Permission error handler
    this.registerHandler('PERMISSION_DENIED', async (error) => {
      return {
        handled: true,
        shouldRetry: false,
        retryDelay: 0,
        fallbackAction: 'disable_feature'
      };
    });
  }

  private async defaultErrorHandler(error: AnalyticsError): Promise<ErrorHandlingResult> {
    return {
      handled: false,
      shouldRetry: error.retryable,
      retryDelay: error.retryable ? this.calculateRetryDelay(error) : 0,
      fallbackAction: 'log_and_continue'
    };
  }

  private createErrorContext(system: AnalyticsSystem, operation: string, additionalData?: any): ErrorContext {
    return {
      system,
      component: system,
      operation,
      sessionId: this.getSessionId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData
    };
  }

  private getSessionId(): string {
    // Get session ID from session manager or generate one
    return 'session_' + Date.now();
  }

  private addToBuffer(error: AnalyticsError): void {
    this.errorBuffer.push(error);

    // Keep buffer size manageable
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer = this.errorBuffer.slice(-Math.floor(this.maxBufferSize * 0.8));
    }
  }

  private calculateRetryDelay(error: AnalyticsError): number {
    if (!error.retryConfig) {
      return 1000;
    }

    const attempt = error.context.additionalData?.retryAttempt || 0;
    const delay = error.retryConfig.baseDelay * Math.pow(error.retryConfig.backoffFactor, attempt);
    return Math.min(delay, error.retryConfig.maxDelay);
  }

  private async processRetryQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const now = Date.now();
      const readyToRetry = this.retryQueue.filter(item => item.nextRetryTime <= now);

      for (const item of readyToRetry) {
        if (item.attempts >= item.maxAttempts) {
          // Max attempts reached, remove from queue
          this.retryQueue = this.retryQueue.filter(i => i.id !== item.id);
          this.logger.error(`Max retry attempts reached for ${item.error.code}`);
          continue;
        }

        try {
          await item.retryFunction();
          // Success, remove from queue
          this.retryQueue = this.retryQueue.filter(i => i.id !== item.id);
        } catch (retryError) {
          // Retry failed, update item
          item.attempts++;
          item.nextRetryTime = now + this.calculateRetryDelay(item.error);

          // Update error context with retry attempt
          if (!item.error.context.additionalData) {
            item.error.context.additionalData = {};
          }
          item.error.context.additionalData.retryAttempt = item.attempts;
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }

    // Schedule next processing if there are items in queue
    if (this.retryQueue.length > 0) {
      setTimeout(() => this.processRetryQueue(), 5000);
    }
  }

  private async freeUpStorageSpace(): Promise<void> {
    try {
      // Clear old analytics data
      const keys = Object.keys(localStorage);
      const analyticsKeys = keys.filter(key => key.startsWith('analytics_'));

      // Remove oldest 25% of analytics data
      const toRemove = Math.floor(analyticsKeys.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(analyticsKeys[i]);
      }
    } catch (error) {
      this.logger.error('Failed to free up storage space:', error);
    }
  }

  private async performStorageCleanup(): Promise<void> {
    try {
      // Comprehensive cleanup of analytics storage
      await this.freeUpStorageSpace();

      // Clear error buffer if it's getting large
      if (this.errorBuffer.length > this.maxBufferSize * 0.8) {
        this.errorBuffer = this.errorBuffer.slice(-Math.floor(this.maxBufferSize * 0.5));
      }

      // Clear old retry items
      const oldRetryItems = this.retryQueue.filter(item =>
        Date.now() - item.nextRetryTime > 300000 // 5 minutes old
      );
      this.retryQueue = this.retryQueue.filter(item =>
        !oldRetryItems.some(old => old.id === item.id)
      );
    } catch (error) {
      this.logger.error('Failed to perform storage cleanup:', error);
    }
  }

  private getTopErrors(count: number): Array<{ code: ErrorCode; count: number; lastOccurrence: Date }> {
    const errorCounts = new Map<ErrorCode, { count: number; lastOccurrence: Date }>();

    this.errorBuffer.forEach(error => {
      const existing = errorCounts.get(error.code);
      if (existing) {
        existing.count++;
        if (error.context.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = error.context.timestamp;
        }
      } else {
        errorCounts.set(error.code, {
          count: 1,
          lastOccurrence: error.context.timestamp
        });
      }
    });

    return Array.from(errorCounts.entries())
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }

  private generateRetryId(): string {
    return 'retry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// ============================================================================
// Logger Class
// ============================================================================

export class AnalyticsLogger {
  private static instance: AnalyticsLogger;
  private logLevel: LogLevel = 'info';
  private enableConsoleLogging = true;
  private remoteEndpoint?: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  private constructor() {}

  public static getInstance(): AnalyticsLogger {
    if (!AnalyticsLogger.instance) {
      AnalyticsLogger.instance = new AnalyticsLogger();
    }
    return AnalyticsLogger.instance;
  }

  public configure(config: {
    logLevel?: LogLevel;
    enableConsoleLogging?: boolean;
    remoteEndpoint?: string;
    maxBufferSize?: number;
  }): void {
    if (config.logLevel) this.logLevel = config.logLevel;
    if (config.enableConsoleLogging !== undefined) this.enableConsoleLogging = config.enableConsoleLogging;
    if (config.remoteEndpoint) this.remoteEndpoint = config.remoteEndpoint;
    if (config.maxBufferSize) this.maxBufferSize = config.maxBufferSize;
  }

  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  public error(error: Error | AnalyticsError, data?: any): void {
    const message = error instanceof AnalyticsError ?
      `[${error.system}] ${error.message}` :
      error.message;

    this.log('error', message, {
      ...data,
      errorName: error.name,
      errorCode: (error as AnalyticsError).code,
      stack: error.stack
    });
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-Math.floor(this.maxBufferSize * 0.8));
    }

    // Console logging
    if (this.enableConsoleLogging && this.shouldLog(level)) {
      this.logToConsole(level, message, data);
    }

    // Remote logging
    if (this.remoteEndpoint && (level === 'error' || level === 'warn')) {
      this.sendToRemote(logEntry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private logToConsole(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  private async sendToRemote(logEntry: LogEntry): Promise<void> {
    if (!this.remoteEndpoint) return;

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Failed to send log, but don't let this break the application
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  public getLogBuffer(limit?: number): LogEntry[] {
    return limit ? this.logBuffer.slice(-limit) : [...this.logBuffer];
  }

  public clearLogBuffer(): void {
    this.logBuffer = [];
  }
}

// ============================================================================
// Retry Mechanism
// ============================================================================

export class RetryMechanism {
  private static instance: RetryMechanism;

  private constructor() {}

  public static getInstance(): RetryMechanism {
    if (!RetryMechanism.instance) {
      RetryMechanism.instance = new RetryMechanism();
    }
    return RetryMechanism.instance;
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const isRetryable = this.isErrorRetryable(error, config.retryableErrors);

        if (!isRetryable || attempt === config.maxAttempts) {
          throw this.enhanceError(error, context, attempt);
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt - 1, config);
        await this.delay(delay);

        // Log retry attempt
        AnalyticsLogger.getInstance().warn(
          `Retrying operation after error (attempt ${attempt}/${config.maxAttempts})`,
          { error: lastError.message, delay, context }
        );
      }
    }

    throw lastError!;
  }

  private isErrorRetryable(error: Error, retryableErrors: string[]): boolean {
    const analyticsError = error as AnalyticsError;
    if (analyticsError.code) {
      return retryableErrors.includes(analyticsError.code);
    }

    // Check error message for common retryable errors
    const message = error.message.toLowerCase();
    return retryableErrors.some(code =>
      message.includes(code.toLowerCase().replace('_', ' '))
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    return Math.min(delay, config.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private enhanceError(error: Error, context?: string, attempt?: number): Error {
    if (error instanceof AnalyticsError) {
      if (context && !error.context.additionalData?.retryContext) {
        error.context.additionalData = {
          ...error.context.additionalData,
          retryContext: context,
          retryAttempt: attempt
        };
      }
      return error;
    }

    // Wrap regular errors in AnalyticsError
    const enhancedError = new AnalyticsTrackingError(
      'unknown' as AnalyticsSystem,
      context || 'unknown_operation',
      error.message,
      false
    );
    enhancedError.originalError = error;
    return enhancedError;
  }
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,
    private readonly resetTimeout: number = 30000
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new AnalyticsError('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) { // Need 3 consecutive successes to close
        this.state = 'closed';
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  public getState(): string {
    return this.state;
  }

  public reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

export type ErrorHandlerFunction = (error: AnalyticsError) => Promise<ErrorHandlingResult>;

export interface ErrorHandlingResult {
  handled: boolean;
  shouldRetry: boolean;
  retryDelay: number;
  fallbackAction: FallbackAction;
}

export type FallbackAction =
  | 'none'
  | 'retry'
  | 'use_cached_data'
  | 'degrade_functionality'
  | 'use_memory_storage'
  | 'skip_storage'
  | 'reduce_data_collection'
  | 'skip_operation'
  | 'skip_invalid_data'
  | 'disable_feature'
  | 'log_and_continue';

export interface RetryQueueItem {
  id: string;
  error: AnalyticsError;
  retryFunction: () => Promise<any>;
  attempts: number;
  nextRetryTime: number;
  maxAttempts: number;
}

export interface ErrorStatistics {
  totalErrors: number;
  recentErrors: number;
  errorsByCode: Record<ErrorCode, number>;
  errorsBySystem: Record<AnalyticsSystem, number>;
  retryQueueSize: number;
  lastHourErrorRate: number;
  topErrors: Array<{ code: ErrorCode; count: number; lastOccurrence: Date }>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  url: string;
  userAgent: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createAnalyticsError(
  system: AnalyticsSystem,
  code: ErrorCode,
  message: string,
  context?: Partial<ErrorContext>,
  originalError?: Error
): AnalyticsError {
  const error = new AnalyticsError(message);
  error.code = code;
  error.system = system;
  error.context = {
    system,
    component: system,
    operation: 'unknown',
    sessionId: 'unknown',
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context
  } as ErrorContext;
  error.originalError = originalError;

  // Set retryable status based on error code
  error.retryable = isRetryableErrorCode(code);

  if (error.retryable) {
    error.retryConfig = getDefaultRetryConfig();
  }

  return error;
}

export function isRetryableErrorCode(code: ErrorCode): boolean {
  const retryableCodes: ErrorCode[] = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'STORAGE_ERROR',
    'QUOTA_EXCEEDED',
    'OPERATION_FAILED'
  ];

  return retryableCodes.includes(code);
}

export function getDefaultRetryConfig(): RetryConfig {
  return {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'STORAGE_ERROR',
      'QUOTA_EXCEEDED',
      'OPERATION_FAILED'
    ]
  };
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  errorHandler: (error: AnalyticsError) => void
): Promise<T> {
  return promise.catch(error => {
    const analyticsError = error instanceof AnalyticsError ?
      error :
      createAnalyticsError(
        'unknown' as AnalyticsSystem,
        'OPERATION_FAILED',
        error.message,
        undefined,
        error
      );

    errorHandler(analyticsError);
    throw analyticsError;
  });
}

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => R,
  system: AnalyticsSystem,
  operation: string
): (...args: T) => R {
  return (...args: T) => {
    try {
      return fn(...args);
    } catch (error) {
      const analyticsError = createAnalyticsError(
        system,
        'OPERATION_FAILED',
        (error as Error).message,
        { operation },
        error as Error
      );

      AnalyticsErrorHandler.getInstance().handleError(analyticsError);
      throw analyticsError;
    }
  };
}

export async function withAsyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  system: AnalyticsSystem,
  operation: string
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      const analyticsError = createAnalyticsError(
        system,
        'OPERATION_FAILED',
        (error as Error).message,
        { operation },
        error as Error
      );

      await AnalyticsErrorHandler.getInstance().handleError(analyticsError);
      throw analyticsError;
    }
  };
}

// ============================================================================
// Exports
// ============================================================================

export const errorHandler = AnalyticsErrorHandler.getInstance();
export const logger = AnalyticsLogger.getInstance();
export const retryMechanism = RetryMechanism.getInstance();
