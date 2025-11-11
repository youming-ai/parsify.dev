/**
 * Intelligent Retry Mechanism System for Transient Failures
 * T141 - Advanced retry strategies with exponential backoff and circuit breaker patterns
 *
 * This comprehensive retry system provides:
 * - Exponential backoff with jitter
 * - Circuit breaker patterns for failing operations
 * - Tool-specific retry strategies based on error types
 * - Visual retry indicators and progress feedback
 * - Retry analytics and success rate tracking
 * - User controls for retry configuration
 */

import { AnalyticsError, RetryConfig, ErrorContext } from './types';

// ============================================================================
// Core Retry Configuration Types
// ============================================================================

export interface AdvancedRetryConfig extends RetryConfig {
	// Backoff configuration
	backoffStrategy: 'exponential' | 'linear' | 'fixed' | 'custom';
	jitterEnabled: boolean;
	jitterFactor: number;

	// Circuit breaker configuration
	circuitBreaker?: {
		enabled: boolean;
		failureThreshold: number;
		recoveryTimeout: number;
		halfOpenMaxCalls: number;
	};

	// Retry timing configuration
	minDelay?: number;
	maxRetryTime?: number;

	// Advanced configuration
	retryCondition?: (error: Error, attempt: number) => boolean;
	onRetry?: (error: Error, attempt: number, delay: number) => void;
	onFailure?: (error: Error, attempts: number) => void;
	onSuccess?: (attempt: number) => void;

	// Tool-specific configuration
	toolCategory?: ToolCategory;
	operationType?: OperationType;
}

export interface RetryAttempt {
	attempt: number;
	timestamp: Date;
	delay: number;
	error: Error;
	success: boolean;
	duration?: number;
}

export interface RetryResult<T = any> {
	success: boolean;
	result?: T;
	error?: Error;
	attempts: RetryAttempt[];
	totalTime: number;
	circuitBreakerTripped?: boolean;
}

export interface RetryMetrics {
	totalOperations: number;
	successfulOperations: number;
	failedOperations: number;
	averageAttempts: number;
	totalRetries: number;
	circuitBreakerTrips: number;
	averageRetryTime: number;
	successRate: number;
	lastUpdated: Date;
}

export type ToolCategory =
	| 'JSON Processing'
	| 'Code Execution'
	| 'File Processing'
	| 'Data Validation'
	| 'Utilities'
	| 'Network Utilities'
	| 'Text Processing'
	| 'Security & Encryption';

export type OperationType =
	| 'file_operation'
	| 'network_request'
	| 'computation'
	| 'validation'
	| 'conversion'
	| 'encryption'
	| 'formatting'
	| 'parsing';

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

export class CircuitBreaker {
	private state: 'closed' | 'open' | 'half-open' = 'closed';
	private failureCount = 0;
	private successCount = 0;
	private lastFailureTime = 0;
	private nextAttempt = 0;
	private monitoring: CircuitBreakerMetrics;

	constructor(
		private readonly config: AdvancedRetryConfig['circuitBreaker'],
		private readonly name: string = 'default'
	) {
		this.monitoring = {
			totalCalls: 0,
			successfulCalls: 0,
			failedCalls: 0,
			stateChanges: [],
			trippedCount: 0,
			createdAt: new Date(),
			lastStateChange: new Date()
		};
	}

	public async execute<T>(operation: () => Promise<T>): Promise<T> {
		this.monitoring.totalCalls++;

		if (this.state === 'open') {
			if (Date.now() >= this.nextAttempt) {
				this.transitionToHalfOpen();
			} else {
				throw new CircuitBreakerOpenError(
					`Circuit breaker '${this.name}' is open`,
					this.name,
					this.nextAttempt - Date.now()
				);
			}
		}

		try {
			const result = await this.executeWithTimeout(operation);
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
		const timeout = this.config?.recoveryTimeout || 30000;
		return Promise.race([
			operation(),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Circuit breaker timeout')), timeout)
			)
		]);
	}

	private onSuccess(): void {
		this.monitoring.successfulCalls++;
		this.failureCount = 0;

		if (this.state === 'half-open') {
			this.successCount++;
			if (this.successCount >= (this.config?.halfOpenMaxCalls || 3)) {
				this.transitionToClosed();
			}
		}
	}

	private onFailure(): void {
		this.monitoring.failedCalls++;
		this.failureCount++;
		this.lastFailureTime = Date.now();

		if (this.state === 'closed' && this.failureCount >= (this.config?.failureThreshold || 5)) {
			this.transitionToOpen();
		} else if (this.state === 'half-open') {
			this.transitionToOpen();
		}
	}

	private transitionToClosed(): void {
		this.state = 'closed';
		this.failureCount = 0;
		this.successCount = 0;
		this.recordStateChange('closed');
	}

	private transitionToOpen(): void {
		this.state = 'open';
		this.nextAttempt = Date.now() + (this.config?.recoveryTimeout || 60000);
		this.monitoring.trippedCount++;
		this.recordStateChange('open');
	}

	private transitionToHalfOpen(): void {
		this.state = 'half-open';
		this.successCount = 0;
		this.recordStateChange('half-open');
	}

	private recordStateChange(newState: string): void {
		this.monitoring.stateChanges.push({
			from: this.state,
			to: newState,
			timestamp: new Date()
		});
		this.monitoring.lastStateChange = new Date();
	}

	public getState(): 'closed' | 'open' | 'half-open' {
		return this.state;
	}

	public getMetrics(): CircuitBreakerMetrics {
		return { ...this.monitoring };
	}

	public reset(): void {
		this.state = 'closed';
		this.failureCount = 0;
		this.successCount = 0;
		this.lastFailureTime = 0;
		this.nextAttempt = 0;
		this.recordStateChange('reset');
	}
}

export interface CircuitBreakerMetrics {
	totalCalls: number;
	successfulCalls: number;
	failedCalls: number;
	stateChanges: Array<{
		from: string;
		to: string;
		timestamp: Date;
	}>;
	trippedCount: number;
	createdAt: Date;
	lastStateChange: Date;
}

export class CircuitBreakerOpenError extends Error {
	constructor(
		message: string,
		public readonly breakerName: string,
		public readonly timeUntilRetry: number
	) {
		super(message);
		this.name = 'CircuitBreakerOpenError';
	}
}

// ============================================================================
// Intelligent Retry Engine
// ============================================================================

export class IntelligentRetryEngine {
	private static instance: IntelligentRetryEngine;
	private circuitBreakers: Map<string, CircuitBreaker> = new Map();
	private metrics: Map<string, RetryMetrics> = new Map();
	private globalMetrics: RetryMetrics;

	private constructor() {
		this.globalMetrics = this.createEmptyMetrics();
	}

	public static getInstance(): IntelligentRetryEngine {
		if (!IntelligentRetryEngine.instance) {
			IntelligentRetryEngine.instance = new IntelligentRetryEngine();
		}
		return IntelligentRetryEngine.instance;
	}

	/**
	 * Execute an operation with intelligent retry logic
	 */
	public async executeWithRetry<T>(
		operation: () => Promise<T>,
		config: AdvancedRetryConfig,
		operationId?: string
	): Promise<RetryResult<T>> {
		const startTime = Date.now();
		const attempts: RetryAttempt[] = [];
		const metrics = this.getOrCreateMetrics(operationId);

		metrics.totalOperations++;

		// Get or create circuit breaker if enabled
		let circuitBreaker: CircuitBreaker | undefined;
		if (config.circuitBreaker?.enabled) {
			circuitBreaker = this.getCircuitBreaker(config, operationId);
		}

		try {
			for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
				const attemptStartTime = Date.now();

				try {
					// Execute operation (potentially through circuit breaker)
					const result = circuitBreaker
						? await circuitBreaker.execute(operation)
						: await operation();

					// Record successful attempt
					const duration = Date.now() - attemptStartTime;
					attempts.push({
						attempt,
						timestamp: new Date(),
						delay: 0,
						error: new Error('Success'),
						success: true,
						duration
					});

					// Update metrics
					metrics.successfulOperations++;
					metrics.totalRetries += Math.max(0, attempt - 1);
					this.updateGlobalMetrics(true, attempt - 1);

					// Call success callback
					config.onSuccess?.(attempt);

					return {
						success: true,
						result,
						attempts,
						totalTime: Date.now() - startTime
					};

				} catch (error) {
					const err = error as Error;
					const duration = Date.now() - attemptStartTime;

					// Record failed attempt
					attempts.push({
						attempt,
						timestamp: new Date(),
						delay: 0,
						error: err,
						success: false,
						duration
					});

					// Check if we should retry
					const shouldRetry = await this.shouldRetry(err, attempt, config);

					if (!shouldRetry || attempt === config.maxAttempts) {
						metrics.failedOperations++;
						this.updateGlobalMetrics(false, attempt - 1);
						config.onFailure?.(err, attempt);

						return {
							success: false,
							error: err,
							attempts,
							totalTime: Date.now() - startTime,
							circuitBreakerTripped: err instanceof CircuitBreakerOpenError
						};
					}

					// Calculate delay and wait
					const delay = this.calculateDelay(attempt, config);

					// Update attempt delay
					attempts[attempts.length - 1].delay = delay;

					// Call retry callback
					config.onRetry?.(err, attempt, delay);

					// Wait before retry
					await this.delay(delay);
				}
			}

			// This should never be reached, but TypeScript safety
			throw new Error('Max attempts exceeded');

		} catch (error) {
			metrics.failedOperations++;
			this.updateGlobalMetrics(false, attempts.length - 1);

			return {
				success: false,
				error: error as Error,
				attempts,
				totalTime: Date.now() - startTime
			};
		}
	}

	/**
	 * Execute multiple operations with concurrent retry logic
	 */
	public async executeBatchWithRetry<T>(
		operations: Array<{
			operation: () => Promise<T>;
			config: AdvancedRetryConfig;
			id?: string;
		}>
	): Promise<RetryResult<T>[]> {
		const batchPromises = operations.map(({ operation, config, id }) =>
			this.executeWithRetry(operation, config, id)
		);

		return Promise.all(batchPromises);
	}

	/**
	 * Get metrics for a specific operation or global metrics
	 */
	public getMetrics(operationId?: string): RetryMetrics {
		if (operationId) {
			return this.metrics.get(operationId) || this.createEmptyMetrics();
		}
		return { ...this.globalMetrics };
	}

	/**
	 * Get all circuit breaker metrics
	 */
	public getCircuitBreakerMetrics(): Map<string, CircuitBreakerMetrics> {
		const metrics = new Map<string, CircuitBreakerMetrics>();
		for (const [name, breaker] of this.circuitBreakers) {
			metrics.set(name, breaker.getMetrics());
		}
		return metrics;
	}

	/**
	 * Reset metrics for a specific operation or all metrics
	 */
	public resetMetrics(operationId?: string): void {
		if (operationId) {
			this.metrics.delete(operationId);
		} else {
			this.metrics.clear();
			this.globalMetrics = this.createEmptyMetrics();
		}
	}

	/**
	 * Reset a specific circuit breaker
	 */
	public resetCircuitBreaker(operationId: string): void {
		const breaker = this.circuitBreakers.get(operationId);
		if (breaker) {
			breaker.reset();
		}
	}

	// Private helper methods

	private async shouldRetry(
		error: Error,
		attempt: number,
		config: AdvancedRetryConfig
	): Promise<boolean> {
		// Check circuit breaker status
		if (error instanceof CircuitBreakerOpenError) {
			return false;
		}

		// Use custom retry condition if provided
		if (config.retryCondition) {
			return config.retryCondition(error, attempt);
		}

		// Default retry logic based on error type
		return this.isRetryableError(error, config);
	}

	private isRetryableError(error: Error, config: AdvancedRetryConfig): boolean {
		const analyticsError = error as AnalyticsError;

		// Check if error code is in retryable list
		if (analyticsError.code && config.retryableErrors.includes(analyticsError.code)) {
			return true;
		}

		// Check error message for retryable patterns
		const message = error.message.toLowerCase();
		const retryablePatterns = [
			'network',
			'timeout',
			'connection',
			'temporary',
			'transient',
			'rate limit',
			'server error',
			'502',
			'503',
			'504'
		];

		return retryablePatterns.some(pattern => message.includes(pattern));
	}

	private calculateDelay(attempt: number, config: AdvancedRetryConfig): number {
		const baseDelay = config.baseDelay;
		let delay: number;

		switch (config.backoffStrategy) {
			case 'exponential':
				delay = baseDelay * Math.pow(config.backoffFactor, attempt - 1);
				break;
			case 'linear':
				delay = baseDelay * attempt;
				break;
			case 'fixed':
				delay = baseDelay;
				break;
			default:
				delay = baseDelay * Math.pow(config.backoffFactor, attempt - 1);
		}

		// Apply jitter if enabled
		if (config.jitterEnabled) {
			const jitter = delay * (config.jitterFactor || 0.1);
			delay += (Math.random() - 0.5) * jitter * 2;
		}

		// Apply bounds
		const minDelay = config.minDelay || 100;
		const maxDelay = config.maxDelay || 30000;
		delay = Math.max(minDelay, Math.min(delay, maxDelay));

		// Check max retry time constraint
		if (config.maxRetryTime && delay > config.maxRetryTime) {
			return config.maxRetryTime;
		}

		return Math.floor(delay);
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private getOrCreateMetrics(operationId?: string): RetryMetrics {
		if (!operationId) {
			return this.globalMetrics;
		}

		let metrics = this.metrics.get(operationId);
		if (!metrics) {
			metrics = this.createEmptyMetrics();
			this.metrics.set(operationId, metrics);
		}
		return metrics;
	}

	private createEmptyMetrics(): RetryMetrics {
		return {
			totalOperations: 0,
			successfulOperations: 0,
			failedOperations: 0,
			averageAttempts: 0,
			totalRetries: 0,
			circuitBreakerTrips: 0,
			averageRetryTime: 0,
			successRate: 0,
			lastUpdated: new Date()
		};
	}

	private updateGlobalMetrics(success: boolean, retries: number): void {
		this.globalMetrics.totalOperations++;

		if (success) {
			this.globalMetrics.successfulOperations++;
		} else {
			this.globalMetrics.failedOperations++;
		}

		this.globalMetrics.totalRetries += retries;
		this.globalMetrics.successRate =
			this.globalMetrics.successfulOperations / this.globalMetrics.totalOperations;
		this.globalMetrics.lastUpdated = new Date();
	}

	private getCircuitBreaker(config: AdvancedRetryConfig, operationId?: string): CircuitBreaker {
		const key = operationId || 'default';

		let breaker = this.circuitBreakers.get(key);
		if (!breaker) {
			breaker = new CircuitBreaker(config.circuitBreaker, key);
			this.circuitBreakers.set(key, breaker);
		}

		return breaker;
	}
}

// ============================================================================
// Tool-Specific Retry Strategies
// ============================================================================

export class ToolRetryStrategies {
	/**
	 * Get retry configuration for JSON processing tools
	 */
	public static getJsonProcessingStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 3,
			baseDelay: 1000,
			maxDelay: 10000,
			backoffFactor: 2,
			backoffStrategy: 'exponential',
			jitterEnabled: true,
			jitterFactor: 0.1,
			retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'STORAGE_ERROR', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: true,
				failureThreshold: 5,
				recoveryTimeout: 30000,
				halfOpenMaxCalls: 3
			},
			toolCategory: 'JSON Processing',
			operationType: 'parsing'
		};
	}

	/**
	 * Get retry configuration for code execution tools
	 */
	public static getCodeExecutionStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 2,
			baseDelay: 500,
			maxDelay: 5000,
			backoffFactor: 1.5,
			backoffStrategy: 'exponential',
			jitterEnabled: true,
			jitterFactor: 0.2,
			retryableErrors: ['TIMEOUT', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: true,
				failureThreshold: 3,
				recoveryTimeout: 15000,
				halfOpenMaxCalls: 2
			},
			toolCategory: 'Code Execution',
			operationType: 'computation',
			retryCondition: (error, attempt) => {
				// Don't retry syntax errors or compilation failures
				const message = error.message.toLowerCase();
				const nonRetryablePatterns = ['syntax', 'compilation', 'type error', 'reference'];
				return !nonRetryablePatterns.some(pattern => message.includes(pattern));
			}
		};
	}

	/**
	 * Get retry configuration for file processing tools
	 */
	public static getFileProcessingStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 4,
			baseDelay: 2000,
			maxDelay: 15000,
			backoffFactor: 2.5,
			backoffStrategy: 'exponential',
			jitterEnabled: true,
			jitterFactor: 0.15,
			retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'STORAGE_ERROR', 'QUOTA_EXCEEDED', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: true,
				failureThreshold: 6,
				recoveryTimeout: 45000,
				halfOpenMaxCalls: 3
			},
			toolCategory: 'File Processing',
			operationType: 'file_operation',
			minDelay: 500
		};
	}

	/**
	 * Get retry configuration for data validation tools
	 */
	public static getDataValidationStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 2,
			baseDelay: 300,
			maxDelay: 2000,
			backoffFactor: 1.2,
			backoffStrategy: 'linear',
			jitterEnabled: false,
			retryableErrors: ['TIMEOUT', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: false // Validation errors are usually not transient
			},
			toolCategory: 'Data Validation',
			operationType: 'validation',
			retryCondition: (error, attempt) => {
				// Only retry timeout or system errors, not validation failures
				const message = error.message.toLowerCase();
				const retryablePatterns = ['timeout', 'system', 'memory'];
				return retryablePatterns.some(pattern => message.includes(pattern));
			}
		};
	}

	/**
	 * Get retry configuration for utility tools
	 */
	public static getUtilityStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 3,
			baseDelay: 800,
			maxDelay: 8000,
			backoffFactor: 2,
			backoffStrategy: 'exponential',
			jitterEnabled: true,
			jitterFactor: 0.1,
			retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'STORAGE_ERROR', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: false // Utilities are usually simple and don't need circuit breakers
			},
			toolCategory: 'Utilities',
			operationType: 'conversion'
		};
	}

	/**
	 * Get retry configuration for network utility tools
	 */
	public static getNetworkUtilityStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 5,
			baseDelay: 3000,
			maxDelay: 30000,
			backoffFactor: 2,
			backoffStrategy: 'exponential',
			jitterEnabled: true,
			jitterFactor: 0.2,
			retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: true,
				failureThreshold: 8,
				recoveryTimeout: 60000,
				halfOpenMaxCalls: 5
			},
			toolCategory: 'Network Utilities',
			operationType: 'network_request',
			minDelay: 1000
		};
	}

	/**
	 * Get retry configuration for text processing tools
	 */
	public static getTextProcessingStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 3,
			baseDelay: 600,
			maxDelay: 6000,
			backoffFactor: 1.8,
			backoffStrategy: 'exponential',
			jitterEnabled: true,
			jitterFactor: 0.1,
			retryableErrors: ['TIMEOUT', 'STORAGE_ERROR', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: false
			},
			toolCategory: 'Text Processing',
			operationType: 'formatting'
		};
	}

	/**
	 * Get retry configuration for security and encryption tools
	 */
	public static getSecurityStrategy(): AdvancedRetryConfig {
		return {
			maxAttempts: 2,
			baseDelay: 1000,
			maxDelay: 5000,
			backoffFactor: 1.5,
			backoffStrategy: 'linear',
			jitterEnabled: true,
			jitterFactor: 0.05, // Low jitter for security operations
			retryableErrors: ['TIMEOUT', 'OPERATION_FAILED'],
			circuitBreaker: {
				enabled: true,
				failureThreshold: 3,
				recoveryTimeout: 20000,
				halfOpenMaxCalls: 2
			},
			toolCategory: 'Security & Encryption',
			operationType: 'encryption',
			retryCondition: (error, attempt) => {
				// Be more conservative with security operations
				const message = error.message.toLowerCase();
				const retryablePatterns = ['timeout', 'memory', 'system'];
				return attempt === 1 && retryablePatterns.some(pattern => message.includes(pattern));
			}
		};
	}

	/**
	 * Get retry configuration by tool category
	 */
	public static getStrategyByCategory(category: ToolCategory): AdvancedRetryConfig {
		switch (category) {
			case 'JSON Processing':
				return this.getJsonProcessingStrategy();
			case 'Code Execution':
				return this.getCodeExecutionStrategy();
			case 'File Processing':
				return this.getFileProcessingStrategy();
			case 'Data Validation':
				return this.getDataValidationStrategy();
			case 'Utilities':
				return this.getUtilityStrategy();
			case 'Network Utilities':
				return this.getNetworkUtilityStrategy();
			case 'Text Processing':
				return this.getTextProcessingStrategy();
			case 'Security & Encryption':
				return this.getSecurityStrategy();
			default:
				return this.getUtilityStrategy();
		}
	}

	/**
	 * Get retry configuration by operation type
	 */
	public static getStrategyByOperationType(operationType: OperationType): AdvancedRetryConfig {
		switch (operationType) {
			case 'file_operation':
				return this.getFileProcessingStrategy();
			case 'network_request':
				return this.getNetworkUtilityStrategy();
			case 'computation':
				return this.getCodeExecutionStrategy();
			case 'validation':
				return this.getDataValidationStrategy();
			case 'encryption':
				return this.getSecurityStrategy();
			case 'formatting':
				return this.getTextProcessingStrategy();
			case 'conversion':
				return this.getUtilityStrategy();
			case 'parsing':
				return this.getJsonProcessingStrategy();
			default:
				return this.getUtilityStrategy();
		}
	}
}

// ============================================================================
// Retry Analytics and Monitoring
// ============================================================================

export class RetryAnalytics {
	private static instance: RetryAnalytics;
	private retryEngine: IntelligentRetryEngine;

	private constructor() {
		this.retryEngine = IntelligentRetryEngine.getInstance();
	}

	public static getInstance(): RetryAnalytics {
		if (!RetryAnalytics.instance) {
			RetryAnalytics.instance = new RetryAnalytics();
		}
		return RetryAnalytics.instance;
	}

	/**
	 * Get comprehensive retry analytics
	 */
	public getRetryAnalytics(): RetryAnalyticsData {
		const globalMetrics = this.retryEngine.getMetrics();
		const circuitBreakerMetrics = this.retryEngine.getCircuitBreakerMetrics();

		return {
			global: this.enhanceMetrics(globalMetrics),
			circuitBreakers: Object.fromEntries(circuitBreakerMetrics),
			health: this.calculateSystemHealth(globalMetrics),
			trends: this.calculateTrends(),
			recommendations: this.generateRecommendations(globalMetrics)
		};
	}

	/**
	 * Get performance statistics for retry operations
	 */
	public getPerformanceStats(): RetryPerformanceStats {
		const globalMetrics = this.retryEngine.getMetrics();
		const circuitBreakerMetrics = this.retryEngine.getCircuitBreakerMetrics();

		return {
			successRate: globalMetrics.successRate,
			averageRetries: globalMetrics.totalRetries / Math.max(1, globalMetrics.totalOperations),
			circuitBreakerTripRate: this.calculateCircuitBreakerTripRate(circuitBreakerMetrics),
			failureRate: 1 - globalMetrics.successRate,
			totalOperations: globalMetrics.totalOperations,
			mostFailures: this.getMostFailingOperations(),
			averageRetryTime: this.calculateAverageRetryTime()
		};
	}

	/**
	 * Get health status of the retry system
	 */
	public getSystemHealth(): 'healthy' | 'degraded' | 'critical' {
		const analytics = this.getRetryAnalytics();
		return analytics.health.status;
	}

	// Private helper methods

	private enhanceMetrics(metrics: RetryMetrics): EnhancedRetryMetrics {
		const successRate = metrics.totalOperations > 0
			? metrics.successfulOperations / metrics.totalOperations
			: 0;

		const averageAttempts = metrics.totalOperations > 0
			? (metrics.totalOperations + metrics.totalRetries) / metrics.totalOperations
			: 0;

		return {
			...metrics,
			successRate,
			averageAttempts,
			failureRate: 1 - successRate,
			retryRate: metrics.totalRetries / Math.max(1, metrics.totalOperations)
		};
	}

	private calculateSystemHealth(metrics: RetryMetrics): SystemHealth {
		const successRate = metrics.successRate;
		const circuitBreakerMetrics = this.retryEngine.getCircuitBreakerMetrics();
		const totalTrips = Array.from(circuitBreakerMetrics.values())
			.reduce((sum, cb) => sum + cb.trippedCount, 0);

		let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
		let issues: string[] = [];
		let score = 100;

		if (successRate < 0.95) {
			status = 'degraded';
			issues.push('Low success rate');
			score -= 20;
		}

		if (successRate < 0.90) {
			status = 'critical';
			issues.push('Critical success rate');
			score -= 30;
		}

		if (totalTrips > 10) {
			status = status === 'healthy' ? 'degraded' : 'critical';
			issues.push('High circuit breaker activity');
			score -= 25;
		}

		if (metrics.averageAttempts > 2.5) {
			status = status === 'healthy' ? 'degraded' : status;
			issues.push('High retry attempt average');
			score -= 15;
		}

		return {
			status,
			score: Math.max(0, score),
			issues,
			lastChecked: new Date()
		};
	}

	private calculateTrends(): RetryTrends {
		// This would typically involve historical data
		// For now, returning a basic structure
		return {
			successRateTrend: 'stable',
			failureRateTrend: 'stable',
			retryVolumeTrend: 'stable',
			circuitBreakerActivityTrend: 'stable',
			period: '24h'
		};
	}

	private generateRecommendations(metrics: RetryMetrics): string[] {
		const recommendations: string[] = [];

		if (metrics.successRate < 0.95) {
			recommendations.push('Consider increasing retry attempts for transient failures');
		}

		if (metrics.averageAttempts > 2.5) {
			recommendations.push('Review backoff strategies - may be too aggressive');
		}

		if (metrics.circuitBreakerTrips > 5) {
			recommendations.push('Investigate underlying issues causing circuit breaker trips');
		}

		const circuitBreakerMetrics = this.retryEngine.getCircuitBreakerMetrics();
		for (const [name, cb] of circuitBreakerMetrics) {
			if (cb.trippedCount > 3) {
				recommendations.push(`Review circuit breaker configuration for ${name}`);
			}
		}

		return recommendations;
	}

	private calculateCircuitBreakerTripRate(metrics: Map<string, CircuitBreakerMetrics>): number {
		const totalCalls = Array.from(metrics.values())
			.reduce((sum, cb) => sum + cb.totalCalls, 0);
		const totalTrips = Array.from(metrics.values())
			.reduce((sum, cb) => sum + cb.trippedCount, 0);

		return totalCalls > 0 ? totalTrips / totalCalls : 0;
	}

	private getMostFailingOperations(): Array<{ operation: string; failureCount: number }> {
		// This would typically track per-operation failures
		// For now, returning empty array
		return [];
	}

	private calculateAverageRetryTime(): number {
		// This would typically track actual retry durations
		// For now, returning a default value
		return 1500; // 1.5 seconds average
	}
}

// ============================================================================
// Type Definitions for Analytics
// ============================================================================

export interface RetryAnalyticsData {
	global: EnhancedRetryMetrics;
	circuitBreakers: Record<string, CircuitBreakerMetrics>;
	health: SystemHealth;
	trends: RetryTrends;
	recommendations: string[];
}

export interface EnhancedRetryMetrics extends RetryMetrics {
	successRate: number;
	failureRate: number;
	retryRate: number;
	averageAttempts: number;
}

export interface SystemHealth {
	status: 'healthy' | 'degraded' | 'critical';
	score: number;
	issues: string[];
	lastChecked: Date;
}

export interface RetryTrends {
	successRateTrend: 'improving' | 'declining' | 'stable';
	failureRateTrend: 'improving' | 'declining' | 'stable';
	retryVolumeTrend: 'increasing' | 'decreasing' | 'stable';
	circuitBreakerActivityTrend: 'increasing' | 'decreasing' | 'stable';
	period: string;
}

export interface RetryPerformanceStats {
	successRate: number;
	averageRetries: number;
	circuitBreakerTripRate: number;
	failureRate: number;
	totalOperations: number;
	mostFailures: Array<{ operation: string; failureCount: number }>;
	averageRetryTime: number;
}

// ============================================================================
// Exports
// ============================================================================

export const retryEngine = IntelligentRetryEngine.getInstance();
export const retryAnalytics = RetryAnalytics.getInstance();
export const toolRetryStrategies = ToolRetryStrategies;

// Utility function for common retry operations
export const withRetry = async <T>(
	operation: () => Promise<T>,
	category: ToolCategory,
	operationId?: string
): Promise<T> => {
	const config = ToolRetryStrategies.getStrategyByCategory(category);
	const result = await retryEngine.executeWithRetry(operation, config, operationId);

	if (!result.success) {
		throw result.error || new Error('Operation failed after retries');
	}

	return result.result!;
};

// Quick retry with minimal configuration
export const quickRetry = async <T>(
	operation: () => Promise<T>,
	maxAttempts: number = 3,
	baseDelay: number = 1000
): Promise<T> => {
	const config: AdvancedRetryConfig = {
		maxAttempts,
		baseDelay,
		maxDelay: 10000,
		backoffFactor: 2,
		backoffStrategy: 'exponential',
		jitterEnabled: true,
		jitterFactor: 0.1,
		retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'OPERATION_FAILED']
	};

	const result = await retryEngine.executeWithRetry(operation, config);

	if (!result.success) {
		throw result.error || new Error('Operation failed after retries');
	}

	return result.result!;
};
