/**
 * Integration Layer for Retry Mechanisms with Existing Error Handling
 * Bridges the new retry system with the existing analytics error handling
 */

import {
	AnalyticsErrorHandler,
	AnalyticsError,
	AnalyticsLogger,
	AnalyticsSystem,
	ErrorHandlingResult
} from './error-handling';

import {
	AdvancedRetryConfig,
	RetryResult,
	ToolCategory,
	OperationType,
	ToolRetryStrategies,
	retryEngine,
	retryAnalytics,
	ToolRetryStrategies as RetryStrategies
} from './retry-mechanisms';

import {
	RetryProgress,
	RetryStatusBadge,
	ManualRetryDialog,
	RetryControls,
	RetryAnalyticsDashboard
} from '../components/monitoring/retry-ui';

// ============================================================================
// Enhanced Error Handler with Retry Integration
// ============================================================================

export class EnhancedAnalyticsErrorHandler extends AnalyticsErrorHandler {
	private retryIntegration: RetryIntegration;

	private constructor() {
		super();
		this.retryIntegration = new RetryIntegration();
	}

	public static getInstance(): EnhancedAnalyticsErrorHandler {
		if (!EnhancedAnalyticsErrorHandler.instance) {
			EnhancedAnalyticsErrorHandler.instance = new EnhancedAnalyticsErrorHandler();
		}
		return EnhancedAnalyticsErrorHandler.instance;
	}

	/**
	 * Enhanced error handling with automatic retry integration
	 */
	public async handleErrorWithRetry(error: AnalyticsError): Promise<ErrorHandlingResult> {
		// First, try standard error handling
		const standardResult = await this.handleError(error);

		// If error is retryable and standard handling suggests retry
		if (error.retryable && standardResult.shouldRetry && standardResult.retryDelay > 0) {
			// Create retry operation based on error context
			const retryOperation = this.createRetryOperation(error);

			if (retryOperation) {
				const config = this.getRetryConfigForError(error);
				const retryResult = await this.retryIntegration.executeWithRetry(
					retryOperation,
					config,
					`error-${error.code}-${Date.now()}`
				);

				// Update error handling result based on retry outcome
				return this.updateHandlingResult(standardResult, retryResult);
			}
		}

		return standardResult;
	}

	/**
	 * Execute a specific operation with integrated error handling and retry
	 */
	public async executeWithIntegratedRetry<T>(
		operation: () => Promise<T>,
		toolCategory: ToolCategory,
		operationType?: OperationType,
		context?: {
			system: AnalyticsSystem;
			component: string;
			operation: string;
		}
	): Promise<T> {
		try {
			// Get appropriate retry configuration
			const config = operationType
				? ToolRetryStrategies.getStrategyByOperationType(operationType)
				: ToolRetryStrategies.getStrategyByCategory(toolCategory);

			// Create enhanced retry config with error handling integration
			const enhancedConfig: AdvancedRetryConfig = {
				...config,
				onRetry: (error, attempt, delay) => {
					// Log retry attempts
					AnalyticsLogger.getInstance().warn(
						`Retry attempt ${attempt} for ${context?.operation || 'operation'}`,
						{
							error: error.message,
							delay,
							system: context?.system,
							component: context?.component
						}
					);

					// Call original retry callback
					config.onRetry?.(error, attempt, delay);
				},
				onFailure: (error, attempts) => {
					// Create and handle analytics error for final failure
					const analyticsError = this.createAnalyticsError(
						context?.system || 'unknown' as AnalyticsSystem,
						'RETRY_EXHAUSTED',
						`Operation failed after ${attempts} attempts: ${error.message}`,
						context,
						error
					);

					this.handleError(analyticsError);
					config.onFailure?.(error, attempts);
				},
				onSuccess: (attempt) => {
					// Log successful retry
					if (attempt > 1) {
						AnalyticsLogger.getInstance().info(
							`Operation succeeded after ${attempt} attempts`,
							{
								system: context?.system,
								component: context?.component,
								operation: context?.operation
							}
						);
					}
					config.onSuccess?.(attempt);
				}
			};

			// Execute with retry
			const result = await retryEngine.executeWithRetry(
				operation,
				enhancedConfig,
				`${context?.system}-${context?.operation}`
			);

			if (result.success) {
				return result.result!;
			} else {
				// Final error after all retries
				throw this.createAnalyticsError(
					context?.system || 'unknown' as AnalyticsSystem,
					'OPERATION_FAILED',
					`Operation failed: ${result.error?.message || 'Unknown error'}`,
					context,
					result.error
				);
			}
		} catch (error) {
			// Handle any unexpected errors
			if (error instanceof AnalyticsError) {
				await this.handleError(error);
				throw error;
			}

			const analyticsError = this.createAnalyticsError(
				context?.system || 'unknown' as AnalyticsSystem,
				'OPERATION_FAILED',
				`Unexpected error: ${(error as Error).message}`,
				context,
				error as Error
			);

			await this.handleError(analyticsError);
			throw analyticsError;
		}
	}

	// Private helper methods

	private createRetryOperation(error: AnalyticsError): (() => Promise<any>) | null {
		// Create a retry operation based on the error context
		// This would typically involve recreating the original operation
		// For now, return a placeholder operation that would be context-specific

		switch (error.code) {
			case 'NETWORK_ERROR':
				return () => this.retryNetworkOperation(error);
			case 'STORAGE_ERROR':
				return () => this.retryStorageOperation(error);
			case 'TIMEOUT':
				return () => this.retryTimeoutOperation(error);
			default:
				return null;
		}
	}

	private getRetryConfigForError(error: AnalyticsError): AdvancedRetryConfig {
		// Get retry configuration based on error type and context
		if (error.retryConfig) {
			// Use existing retry config from the error
			return {
				...error.retryConfig,
				backoffStrategy: 'exponential',
				jitterEnabled: true,
				circuitBreaker: {
					enabled: true,
					failureThreshold: 3,
					recoveryTimeout: 30000,
					halfOpenMaxCalls: 2
				}
			};
		}

		// Default retry configuration based on error type
		switch (error.code) {
			case 'NETWORK_ERROR':
				return ToolRetryStrategies.getNetworkUtilityStrategy();
			case 'STORAGE_ERROR':
				return ToolRetryStrategies.getFileProcessingStrategy();
			case 'TIMEOUT':
				return ToolRetryStrategies.getCodeExecutionStrategy();
			default:
				return ToolRetryStrategies.getUtilityStrategy();
		}
	}

	private updateHandlingResult(
		standardResult: ErrorHandlingResult,
		retryResult: RetryResult
	): ErrorHandlingResult {
		if (retryResult.success) {
			return {
				handled: true,
				shouldRetry: false,
				retryDelay: 0,
				fallbackAction: 'none'
			};
		}

		return {
			...standardResult,
			shouldRetry: false, // Don't retry anymore if retry system failed
			fallbackAction: retryResult.circuitBreakerTripped
				? 'degrade_functionality'
				: standardResult.fallbackAction
		};
	}

	private createAnalyticsError(
		system: AnalyticsSystem,
		code: any,
		message: string,
		context?: { system?: string; component?: string; operation?: string },
		originalError?: Error
	): AnalyticsError {
		const error = new AnalyticsError(message);
		error.code = code;
		error.system = system;
		error.originalError = originalError;

		// Set retryable status based on error code
		error.retryable = this.isRetryableErrorCode(code);

		if (error.retryable) {
			error.retryConfig = ToolRetryStrategies.getUtilityStrategy();
		}

		return error;
	}

	private isRetryableErrorCode(code: any): boolean {
		const retryableCodes = [
			'NETWORK_ERROR',
			'TIMEOUT',
			'STORAGE_ERROR',
			'QUOTA_EXCEEDED',
			'OPERATION_FAILED',
			'RETRY_EXHAUSTED'
		];
		return retryableCodes.includes(code);
	}

	private async retryNetworkOperation(error: AnalyticsError): Promise<any> {
		// Placeholder for network operation retry
		// In a real implementation, this would recreate the original network request
		throw new Error('Network retry operation not implemented');
	}

	private async retryStorageOperation(error: AnalyticsError): Promise<any> {
		// Placeholder for storage operation retry
		// In a real implementation, this would recreate the original storage operation
		throw new Error('Storage retry operation not implemented');
	}

	private async retryTimeoutOperation(error: AnalyticsError): Promise<any> {
		// Placeholder for timeout operation retry
		// In a real implementation, this would recreate the original operation
		throw new Error('Timeout retry operation not implemented');
	}
}

// ============================================================================
// Retry Integration Service
// ============================================================================

export class RetryIntegration {
	private errorHandler: EnhancedAnalyticsErrorHandler;
	private logger: AnalyticsLogger;

	constructor() {
		this.errorHandler = EnhancedAnalyticsErrorHandler.getInstance();
		this.logger = AnalyticsLogger.getInstance();
	}

	/**
	 * Execute operation with integrated retry and error handling
	 */
	public async executeWithRetry<T>(
		operation: () => Promise<T>,
		config: AdvancedRetryConfig,
		operationId?: string
	): Promise<RetryResult<T>> {
		const startTime = Date.now();

		try {
			// Execute through the retry engine
			const result = await retryEngine.executeWithRetry(operation, config, operationId);

			// Log the operation completion
			this.logger.info(`Operation ${operationId || 'unknown'} completed`, {
				success: result.success,
				attempts: result.attempts.length,
				duration: result.totalTime,
				circuitBreakerTripped: result.circuitBreakerTripped
			});

			return result;
		} catch (error) {
			// Log any unexpected errors
			this.logger.error(`Unexpected error in retry operation ${operationId || 'unknown'}`, error);

			return {
				success: false,
				error: error as Error,
				attempts: [],
				totalTime: Date.now() - startTime
			};
		}
	}

	/**
	 * Get enhanced analytics including retry data
	 */
	public getEnhancedAnalytics() {
		const retryData = retryAnalytics.getRetryAnalytics();
		const errorStats = this.errorHandler.getErrorStatistics();

		return {
			...retryData,
			errorHandling: errorStats,
			systemHealth: {
				...retryData.health,
				errorHandlingHealth: this.calculateErrorHandlingHealth(errorStats)
			}
		};
	}

	private calculateErrorHandlingHealth(errorStats: any): any {
		// Calculate health score based on error statistics
		const errorRate = errorStats.recentErrors / Math.max(1, errorStats.totalErrors);
		const retryQueueSize = errorStats.retryQueueSize;

		let score = 100;
		let issues: string[] = [];

		if (errorRate > 0.1) {
			score -= 30;
			issues.push('High error rate detected');
		}

		if (retryQueueSize > 50) {
			score -= 20;
			issues.push('Large retry queue');
		}

		return {
			score: Math.max(0, score),
			issues,
			errorRate,
			retryQueueSize
		};
	}
}

// ============================================================================
// Tool Wrapper with Integrated Retry
// ============================================================================

export abstract class ToolWithRetry {
	protected errorHandler: EnhancedAnalyticsErrorHandler;
	protected retryIntegration: RetryIntegration;
	protected toolCategory: ToolCategory;
	protected operationType: OperationType;

	constructor(
		toolCategory: ToolCategory,
		operationType: OperationType,
		protected system: AnalyticsSystem,
		protected component: string
	) {
		this.errorHandler = EnhancedAnalyticsErrorHandler.getInstance();
		this.retryIntegration = new RetryIntegration();
		this.toolCategory = toolCategory;
		this.operationType = operationType;
	}

	/**
	 * Execute a tool operation with integrated retry and error handling
	 */
	protected async executeToolOperation<T>(
		operation: () => Promise<T>,
		operationName: string,
		config?: Partial<AdvancedRetryConfig>
	): Promise<T> {
		// Get base retry configuration
		const baseConfig = ToolRetryStrategies.getStrategyByCategory(this.toolCategory);
		const finalConfig = { ...baseConfig, ...config };

		return this.errorHandler.executeWithIntegratedRetry(
			operation,
			this.toolCategory,
			this.operationType,
			{
				system: this.system,
				component: this.component,
				operation: operationName
			}
		);
	}

	/**
	 * Execute a batch of operations with individual retry handling
	 */
	protected async executeBatchOperations<T>(
		operations: Array<{
			operation: () => Promise<T>;
			name: string;
			config?: Partial<AdvancedRetryConfig>;
		}>
	): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
		const results = [];

		for (const { operation, name, config } of operations) {
			try {
				const result = await this.executeToolOperation(operation, name, config);
				results.push({ success: true, result });
			} catch (error) {
				results.push({
					success: false,
					error: error as Error
				});
			}
		}

		return results;
	}
}

// ============================================================================
// React Hook for Retry Integration
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export interface UseRetryIntegrationOptions {
	toolCategory: ToolCategory;
	operationType?: OperationType;
	toolName: string;
	autoRetry?: boolean;
	showProgress?: boolean;
}

export interface RetryState {
	isRetrying: boolean;
	retryResult: RetryResult | undefined;
	error: Error | undefined;
	analytics: any;
}

export function useRetryIntegration(options: UseRetryIntegrationOptions) {
	const [state, setState] = useState<RetryState>({
		isRetrying: false,
		retryResult: undefined,
		error: undefined,
		analytics: undefined
	});

	const retryIntegration = new RetryIntegration();

	const executeWithRetry = useCallback(async <T>(
		operation: () => Promise<T>,
		config?: Partial<AdvancedRetryConfig>
	): Promise<T | undefined> => {
		setState(prev => ({ ...prev, isRetrying: true, error: undefined }));

		try {
			// Get retry configuration
			const baseConfig = ToolRetryStrategies.getStrategyByCategory(options.toolCategory);
			const finalConfig = { ...baseConfig, ...config };

			// Execute with retry
			const result = await retryIntegration.executeWithRetry(
				operation,
				finalConfig,
				`${options.toolName}-${Date.now()}`
			);

			setState(prev => ({
				...prev,
				retryResult: result,
				isRetrying: false
			}));

			if (result.success && result.result) {
				return result.result;
			} else {
				throw result.error || new Error('Operation failed');
			}
		} catch (error) {
			setState(prev => ({
				...prev,
				error: error as Error,
				isRetrying: false
			}));

			if (options.autoRetry !== false) {
				// Optionally trigger automatic retry
				// This would depend on the specific use case
			}

			return undefined;
		}
	}, [options.toolCategory, options.toolName, options.autoRetry, retryIntegration]);

	const refreshAnalytics = useCallback(() => {
		const analytics = retryIntegration.getEnhancedAnalytics();
		setState(prev => ({ ...prev, analytics }));
	}, [retryIntegration]);

	// Auto-refresh analytics
	useEffect(() => {
		refreshAnalytics();
		const interval = setInterval(refreshAnalytics, 30000);
		return () => clearInterval(interval);
	}, [refreshAnalytics]);

	return {
		...state,
		executeWithRetry,
		refreshAnalytics
	};
}

// ============================================================================
// Component Exports
// ============================================================================

export {
	RetryProgress,
	RetryStatusBadge,
	ManualRetryDialog,
	RetryControls,
	RetryAnalyticsDashboard
};

// ============================================================================
// Static Instance Exports
// ============================================================================

export const enhancedErrorHandler = EnhancedAnalyticsErrorHandler.getInstance();
export const retryIntegration = new RetryIntegration();
