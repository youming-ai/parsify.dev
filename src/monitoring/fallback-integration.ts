/**
 * Fallback System Integration
 * Integrates fallback processing with existing error handling and retry mechanisms
 */

import {
	AnalyticsErrorHandler,
	AnalyticsError,
	RetryMechanism,
	CircuitBreaker,
	errorHandler,
	retryMechanism
} from './error-handling';
import {
	fallbackProcessor,
	FallbackResult,
	FallbackContext
} from './fallback-processing-system';
import {
	qualityAssessmentEngine
} from './fallback-quality-system';
import {
	fallbackAnalyticsEngine
} from './fallback-analytics-system';
import { Tool, ToolCategory } from '../types/tools';

// ============================================================================
// Integration Types
// ============================================================================

export interface IntegratedErrorHandlingConfig {
	enableFallbackOnError: boolean;
	fallbackTriggerConditions: FallbackTriggerCondition[];
	maxRetryAttempts: number;
	fallbackTimeout: number;
	qualityThreshold: number;
	autoRetryAfterFallback: boolean;
	enableCircuitBreaker: boolean;
	circuitBreakerThreshold: number;
	circuitBreakerTimeout: number;
}

export interface FallbackTriggerCondition {
	errorType: string;
	errorCode?: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	category?: ToolCategory;
	operation?: string;
	requiresFallback: boolean;
}

export interface ProcessingRequest {
	tool: Tool;
	operation: string;
	inputData: any;
	options?: any;
	sessionId: string;
	userId?: string;
	timeout?: number;
}

export interface ProcessingResult {
	success: boolean;
	result?: any;
	error?: AnalyticsError;
	fallbackUsed?: boolean;
	fallbackResult?: FallbackResult;
	metrics: ProcessingMetrics;
	duration: number;
	timestamp: Date;
}

export interface ProcessingMetrics {
	primaryAttempts: number;
	fallbackAttempts: number;
	totalDuration: number;
	memoryUsage: number;
	qualityScore?: number;
	userSatisfaction?: number;
	errorRecoveryTime: number;
}

export interface ErrorRecoveryStrategy {
	id: string;
	name: string;
	description: string;
	priority: number;
	applicableErrors: string[];
	implementation: RecoveryImplementation;
	successRate: number;
	averageRecoveryTime: number;
}

export interface RecoveryImplementation {
	type: 'retry' | 'fallback' | 'circuit_breaker' | 'manual';
	config: Record<string, any>;
	execute: (error: AnalyticsError, context: ProcessingContext) => Promise<RecoveryResult>;
}

export interface RecoveryResult {
	success: boolean;
	result?: any;
	error?: AnalyticsError;
	strategyUsed: string;
	duration: number;
	metadata: Record<string, any>;
}

export interface ProcessingContext {
	tool: Tool;
	operation: string;
	inputData: any;
	options?: any;
	sessionId: string;
	userId?: string;
	attemptNumber: number;
	originalError?: AnalyticsError;
	startTime: Date;
	previousAttempts: Array<{ attempt: number; error: AnalyticsError; duration: number }>;
}

// ============================================================================
// Integrated Error Handler
// ============================================================================

export class IntegratedFallbackHandler {
	private static instance: IntegratedFallbackHandler;
	private config: IntegratedErrorHandlingConfig;
	private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
	private circuitBreakers: Map<string, CircuitBreaker> = new Map();
	private processingStats: Map<string, ProcessingStats> = new Map();

	private constructor() {
		this.config = this.initializeConfig();
		this.setupRecoveryStrategies();
		this.setupEventHandlers();
	}

	public static getInstance(): IntegratedFallbackHandler {
		if (!IntegratedFallbackHandler.instance) {
			IntegratedFallbackHandler.instance = new IntegratedFallbackHandler();
		}
		return IntegratedFallbackHandler.instance;
	}

	public async processWithIntegratedHandling(
		request: ProcessingRequest
	): Promise<ProcessingResult> {
		const context: ProcessingContext = {
			tool: request.tool,
			operation: request.operation,
			inputData: request.inputData,
			options: request.options,
			sessionId: request.sessionId,
			userId: request.userId,
			attemptNumber: 1,
			startTime: new Date(),
			previousAttempts: [],
		};

		const metrics: ProcessingMetrics = {
			primaryAttempts: 0,
			fallbackAttempts: 0,
			totalDuration: 0,
			memoryUsage: 0,
			errorRecoveryTime: 0,
		};

		try {
			return await this.executePrimaryProcessing(context, metrics);
		} catch (error) {
			const analyticsError = this.convertToAnalyticsError(error as Error, context);
			context.originalError = analyticsError;

			// Record the error for analytics
			await errorHandler.handleError(analyticsError);

			// Attempt recovery
			return await this.attemptRecovery(context, analyticsError, metrics);
		}
	}

	public async executeWithRetryAndFallback<T>(
		operation: () => Promise<T>,
		context: ProcessingContext,
		options?: {
			maxRetries?: number;
			enableFallback?: boolean;
			fallbackStrategy?: string;
		}
	): Promise<ProcessingResult> {
		const maxRetries = options?.maxRetries ?? this.config.maxRetryAttempts;
		const enableFallback = options?.enableFallback ?? this.config.enableFallbackOnError;
		const fallbackStrategy = options?.fallbackStrategy;

		try {
			// Primary execution with retry
			const result = await retryMechanism.executeWithRetry(
				operation,
				{
					maxAttempts: maxRetries,
					baseDelay: 1000,
					maxDelay: 10000,
					backoffFactor: 2,
					retryableErrors: ['OPERATION_FAILED', 'NETWORK_ERROR', 'TIMEOUT', 'STORAGE_ERROR'],
				},
				`${context.tool.id}_${context.operation}`
			);

			return {
				success: true,
				result,
				metrics: {
					primaryAttempts: 1,
					fallbackAttempts: 0,
					totalDuration: Date.now() - context.startTime.getTime(),
					memoryUsage: 0,
					errorRecoveryTime: 0,
				},
				duration: Date.now() - context.startTime.getTime(),
				timestamp: new Date(),
			};

		} catch (error) {
			const analyticsError = this.convertToAnalyticsError(error as Error, context);

			if (!enableFallback || !this.shouldTriggerFallback(analyticsError, context)) {
				return {
					success: false,
					error: analyticsError,
					metrics: {
						primaryAttempts: maxRetries,
						fallbackAttempts: 0,
						totalDuration: Date.now() - context.startTime.getTime(),
						memoryUsage: 0,
						errorRecoveryTime: 0,
					},
					duration: Date.now() - context.startTime.getTime(),
					timestamp: new Date(),
				};
			}

			// Attempt fallback processing
			return await this.executeFallbackProcessing(context, analyticsError, fallbackStrategy);
		}
	}

	public registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
		this.recoveryStrategies.set(strategy.id, strategy);
	}

	public getProcessingStats(toolId: string): ProcessingStats | undefined {
		return this.processingStats.get(toolId);
	}

	public updateConfig(newConfig: Partial<IntegratedErrorHandlingConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	public resetStats(): void {
		this.processingStats.clear();
	}

	// Private methods

	private initializeConfig(): IntegratedErrorHandlingConfig {
		return {
			enableFallbackOnError: true,
			fallbackTriggerConditions: [
				{ errorType: 'AnalyticsError', severity: 'high', requiresFallback: true },
				{ errorType: 'AnalyticsError', errorCode: 'OPERATION_FAILED', severity: 'medium', requiresFallback: true },
				{ errorType: 'NetworkError', severity: 'medium', requiresFallback: true },
				{ errorType: 'TimeoutError', severity: 'medium', requiresFallback: true },
				{ errorType: 'StorageError', severity: 'low', requiresFallback: false },
			],
			maxRetryAttempts: 3,
			fallbackTimeout: 10000,
			qualityThreshold: 70,
			autoRetryAfterFallback: true,
			enableCircuitBreaker: true,
			circuitBreakerThreshold: 5,
			circuitBreakerTimeout: 60000,
		};
	}

	private setupRecoveryStrategies(): void {
		// Retry strategy
		this.registerRecoveryStrategy({
			id: 'retry',
			name: 'Retry with Backoff',
			description: 'Retry the operation with exponential backoff',
			priority: 90,
			applicableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'STORAGE_ERROR'],
			implementation: {
				type: 'retry',
				config: { maxAttempts: 3, baseDelay: 1000 },
				execute: this.executeRetryStrategy.bind(this),
			},
			successRate: 85,
			averageRecoveryTime: 3000,
		});

		// Fallback strategy
		this.registerRecoveryStrategy({
			id: 'fallback',
			name: 'Fallback Processing',
			description: 'Use fallback processing strategies',
			priority: 80,
			applicableErrors: ['OPERATION_FAILED', 'NETWORK_ERROR', 'TIMEOUT'],
			implementation: {
				type: 'fallback',
				config: { timeout: 10000 },
				execute: this.executeFallbackStrategy.bind(this),
			},
			successRate: 75,
			averageRecoveryTime: 5000,
		});

		// Circuit breaker strategy
		this.registerRecoveryStrategy({
			id: 'circuit_breaker',
			name: 'Circuit Breaker',
			description: 'Temporarily disable failing operations',
			priority: 60,
			applicableErrors: ['OPERATION_FAILED', 'NETWORK_ERROR'],
			implementation: {
				type: 'circuit_breaker',
				config: { threshold: 5, timeout: 60000 },
				execute: this.executeCircuitBreakerStrategy.bind(this),
			},
			successRate: 50,
			averageRecoveryTime: 0,
		});
	}

	private setupEventHandlers(): void {
		// Set up event handlers for fallback analytics
		fallbackAnalyticsEngine.startMonitoring();
	}

	private async executePrimaryProcessing(
		context: ProcessingContext,
		metrics: ProcessingMetrics
	): Promise<ProcessingResult> {
		const startTime = Date.now();
		metrics.primaryAttempts = 1;

		// Check circuit breaker
		if (this.config.enableCircuitBreaker) {
			const circuitBreaker = this.getCircuitBreaker(context.tool.id);

			try {
				const result = await circuitBreaker.execute(async () => {
					// Execute primary tool processing
					return await this.executeToolProcessing(context);
				});

				const duration = Date.now() - startTime;
				metrics.totalDuration = duration;

				this.updateProcessingStats(context.tool.id, true, duration, false);

				return {
					success: true,
					result,
					metrics,
					duration,
					timestamp: new Date(),
				};

			} catch (error) {
				const analyticsError = this.convertToAnalyticsError(error as Error, context);
				throw analyticsError;
			}
		} else {
			// Execute without circuit breaker
			const result = await this.executeToolProcessing(context);
			const duration = Date.now() - startTime;
			metrics.totalDuration = duration;

			this.updateProcessingStats(context.tool.id, true, duration, false);

			return {
				success: true,
				result,
				metrics,
				duration,
				timestamp: new Date(),
			};
		}
	}

	private async attemptRecovery(
		context: ProcessingContext,
		error: AnalyticsError,
		metrics: ProcessingMetrics
	): Promise<ProcessingResult> {
		const recoveryStartTime = Date.now();

		try {
			// Find applicable recovery strategies
			const applicableStrategies = this.findApplicableStrategies(error, context);

			if (applicableStrategies.length === 0) {
				throw error;
			}

			// Try strategies in order of priority
			for (const strategy of applicableStrategies) {
				try {
					context.attemptNumber++;
					const recoveryResult = await strategy.implementation.execute(error, context);

					if (recoveryResult.success) {
						metrics.errorRecoveryTime = Date.now() - recoveryStartTime;

						this.updateProcessingStats(context.tool.id, true, metrics.totalDuration, true);

						return {
							success: true,
							result: recoveryResult.result,
							fallbackUsed: strategy.implementation.type === 'fallback',
							metrics,
							duration: metrics.totalDuration,
							timestamp: new Date(),
						};
					}
				} catch (recoveryError) {
					console.warn(`Recovery strategy ${strategy.id} failed:`, recoveryError);
					context.previousAttempts.push({
						attempt: context.attemptNumber,
						error: recoveryError as AnalyticsError,
						duration: Date.now() - recoveryStartTime,
					});
				}
			}

			// All recovery strategies failed
			throw error;

		} catch (recoveryError) {
			metrics.errorRecoveryTime = Date.now() - recoveryStartTime;

			this.updateProcessingStats(context.tool.id, false, metrics.totalDuration, true);

			return {
				success: false,
				error: recoveryError as AnalyticsError,
				metrics,
				duration: metrics.totalDuration,
				timestamp: new Date(),
			};
		}
	}

	private async executeFallbackProcessing(
		context: ProcessingContext,
		error: AnalyticsError,
		preferredStrategy?: string
	): Promise<ProcessingResult> {
		const fallbackStartTime = Date.now();

		try {
			const fallbackResult = await fallbackProcessor.processFallback(
				context.tool.id,
				context.tool.name,
				context.tool.category,
				context.operation,
				context.inputData,
				error,
				context.sessionId
			);

			const duration = Date.now() - context.startTime.getTime();

			// Assess quality
			const assessment = await qualityAssessmentEngine.assessQuality(
				{
					toolId: context.tool.id,
					toolName: context.tool.name,
					category: context.tool.category,
					operation: context.operation,
					inputData: context.inputData,
					originalError: error,
					sessionId: context.sessionId,
					timestamp: new Date(),
					userPreferences: {
						enableFallbacks: true,
						qualityThreshold: 'medium',
						allowDataLoss: false,
						preferredStrategies: preferredStrategy ? [preferredStrategy] : [],
						notifyOnFallback: true,
						autoRetryPrimary: this.config.autoRetryAfterFallback,
						analyticsOptOut: false,
					},
					qualityThreshold: this.config.qualityThreshold,
				},
				fallbackResult
			);

			const metrics: ProcessingMetrics = {
				primaryAttempts: 1,
				fallbackAttempts: 1,
				totalDuration: duration,
				memoryUsage: fallbackResult.metrics.memoryUsage,
				qualityScore: assessment.overallScore,
				userSatisfaction: assessment.userImpact.userSatisfactionPrediction,
				errorRecoveryTime: Date.now() - fallbackStartTime,
			};

			this.updateProcessingStats(context.tool.id, fallbackResult.success, duration, true);

			return {
				success: fallbackResult.success,
				result: fallbackResult.result,
				fallbackUsed: true,
				fallbackResult,
				metrics,
				duration,
				timestamp: new Date(),
			};

		} catch (fallbackError) {
			return {
				success: false,
				error: fallbackError as AnalyticsError,
				metrics: {
					primaryAttempts: 1,
					fallbackAttempts: 1,
					totalDuration: Date.now() - context.startTime.getTime(),
					memoryUsage: 0,
					errorRecoveryTime: Date.now() - fallbackStartTime,
				},
				duration: Date.now() - context.startTime.getTime(),
				timestamp: new Date(),
			};
		}
	}

	private async executeToolProcessing(context: ProcessingContext): Promise<any> {
		// This would integrate with the actual tool processing system
		// For now, we'll simulate tool processing

		// Simulate processing delay
		await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

		// Simulate potential errors (10% chance)
		if (Math.random() < 0.1) {
			throw new AnalyticsError('Simulated processing error');
		}

		// Return simulated result
		return {
			status: 'success',
			data: `Processed ${context.operation} for ${context.tool.name}`,
			timestamp: new Date().toISOString(),
		};
	}

	private shouldTriggerFallback(error: AnalyticsError, context: ProcessingContext): boolean {
		return this.config.fallbackTriggerConditions.some(condition =>
			this.matchesCondition(error, context, condition)
		);
	}

	private matchesCondition(
		error: AnalyticsError,
		context: ProcessingContext,
		condition: FallbackTriggerCondition
	): boolean {
		// Check error type
		if (error.name !== condition.errorType && !(error instanceof AnalyticsError)) {
			return false;
		}

		// Check error code if specified
		if (condition.errorCode && error.code !== condition.errorCode) {
			return false;
		}

		// Check severity
		if (condition.severity) {
			const errorSeverity = this.getErrorSeverity(error);
			if (this.compareSeverity(errorSeverity, condition.severity) < 0) {
				return false;
			}
		}

		// Check category if specified
		if (condition.category && context.tool.category !== condition.category) {
			return false;
		}

		// Check operation if specified
		if (condition.operation && context.operation !== condition.operation) {
			return false;
		}

		return condition.requiresFallback;
	}

	private getErrorSeverity(error: AnalyticsError): 'low' | 'medium' | 'high' | 'critical' {
		if (error.code === 'CRITICAL_ERROR') return 'critical';
		if (error.code === 'OPERATION_FAILED') return 'high';
		if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') return 'medium';
		return 'low';
	}

	private compareSeverity(
		severity1: 'low' | 'medium' | 'high' | 'critical',
		severity2: 'low' | 'medium' | 'high' | 'critical'
	): number {
		const levels = { low: 1, medium: 2, high: 3, critical: 4 };
		return levels[severity1] - levels[severity2];
	}

	private findApplicableStrategies(
		error: AnalyticsError,
		context: ProcessingContext
	): ErrorRecoveryStrategy[] {
		return Array.from(this.recoveryStrategies.values())
			.filter(strategy =>
				strategy.applicableErrors.includes(error.code) ||
				strategy.applicableErrors.includes(error.name) ||
				strategy.applicableErrors.includes('*')
			)
			.sort((a, b) => b.priority - a.priority);
	}

	private getCircuitBreaker(toolId: string): CircuitBreaker {
		if (!this.circuitBreakers.has(toolId)) {
			this.circuitBreakers.set(toolId, new CircuitBreaker(
				this.config.circuitBreakerThreshold,
				this.config.circuitBreakerTimeout
			));
		}
		return this.circuitBreakers.get(toolId)!;
	}

	private updateProcessingStats(
		toolId: string,
		success: boolean,
		duration: number,
		fallbackUsed: boolean
	): void {
		if (!this.processingStats.has(toolId)) {
			this.processingStats.set(toolId, {
				totalRequests: 0,
				successfulRequests: 0,
				failedRequests: 0,
				fallbackUsages: 0,
				averageDuration: 0,
				totalDuration: 0,
				lastUpdated: new Date(),
			});
		}

		const stats = this.processingStats.get(toolId)!;
		stats.totalRequests++;

		if (success) {
			stats.successfulRequests++;
		} else {
			stats.failedRequests++;
		}

		if (fallbackUsed) {
			stats.fallbackUsages++;
		}

		stats.totalDuration += duration;
		stats.averageDuration = stats.totalDuration / stats.totalRequests;
		stats.lastUpdated = new Date();
	}

	private convertToAnalyticsError(error: Error, context: ProcessingContext): AnalyticsError {
		if (error instanceof AnalyticsError) {
			return error;
		}

		const analyticsError = new AnalyticsError(error.message);
		analyticsError.code = 'OPERATION_FAILED';
		analyticsError.system = 'fallback_integration';
		analyticsError.context = {
			system: 'fallback_integration',
			component: context.tool.id,
			operation: context.operation,
			sessionId: context.sessionId,
			timestamp: new Date(),
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
			url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
		};
		analyticsError.originalError = error;

		return analyticsError;
	}

	// Recovery strategy implementations

	private async executeRetryStrategy(
		error: AnalyticsError,
		context: ProcessingContext
	): Promise<RecoveryResult> {
		const config = context.previousAttempts.length === 0
			? { maxAttempts: 2, baseDelay: 1000 }
			: { maxAttempts: 1, baseDelay: 2000 };

		try {
			const result = await retryMechanism.executeWithRetry(
				async () => this.executeToolProcessing(context),
				{
					...config,
					maxDelay: 5000,
					backoffFactor: 2,
					retryableErrors: [error.code],
				},
				`retry_${context.tool.id}_${context.operation}_${Date.now()}`
			);

			return {
				success: true,
				result,
				strategyUsed: 'retry',
				duration: 0,
				metadata: { attempts: context.previousAttempts.length + 1 },
			};

		} catch (retryError) {
			return {
				success: false,
				error: retryError as AnalyticsError,
				strategyUsed: 'retry',
				duration: 0,
				metadata: { attempts: context.previousAttempts.length + 1 },
			};
		}
	}

	private async executeFallbackStrategy(
		error: AnalyticsError,
		context: ProcessingContext
	): Promise<RecoveryResult> {
		try {
			const fallbackResult = await fallbackProcessor.processFallback(
				context.tool.id,
				context.tool.name,
				context.tool.category,
				context.operation,
				context.inputData,
				error,
				context.sessionId
			);

			return {
				success: fallbackResult.success,
				result: fallbackResult.result,
				strategyUsed: 'fallback',
				duration: fallbackResult.processingTime,
				metadata: {
					quality: fallbackResult.quality,
					strategyUsed: fallbackResult.strategyUsed,
					degradationLevel: fallbackResult.degradationLevel,
				},
			};

		} catch (fallbackError) {
			return {
				success: false,
				error: fallbackError as AnalyticsError,
				strategyUsed: 'fallback',
				duration: 0,
				metadata: {},
			};
		}
	}

	private async executeCircuitBreakerStrategy(
		error: AnalyticsError,
		context: ProcessingContext
	): Promise<RecoveryResult> {
		const circuitBreaker = this.getCircuitBreaker(context.tool.id);

		if (circuitBreaker.getState() === 'open') {
			return {
				success: false,
				error: new AnalyticsError('Circuit breaker is open'),
				strategyUsed: 'circuit_breaker',
				duration: 0,
				metadata: { state: 'open' },
			};
		}

		// Circuit breaker is closed or half-open, proceed with fallback
		return await this.executeFallbackStrategy(error, context);
	}
}

// ============================================================================
// Processing Stats
// ============================================================================

interface ProcessingStats {
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	fallbackUsages: number;
	averageDuration: number;
	totalDuration: number;
	lastUpdated: Date;
}

// ============================================================================
// Integration Hooks and Utilities
// ============================================================================

export class FallbackIntegrationHooks {
	private static instance: FallbackIntegrationHooks;
	private beforeFallbackHooks: Array<(context: ProcessingContext, error: AnalyticsError) => Promise<void>> = [];
	private afterFallbackHooks: Array<(context: ProcessingContext, result: ProcessingResult) => Promise<void>> = [];
	private onErrorHooks: Array<(context: ProcessingContext, error: AnalyticsError) => Promise<void>> = [];

	private constructor() {}

	public static getInstance(): FallbackIntegrationHooks {
		if (!FallbackIntegrationHooks.instance) {
			FallbackIntegrationHooks.instance = new FallbackIntegrationHooks();
		}
		return FallbackIntegrationHooks.instance;
	}

	public registerBeforeFallbackHook(hook: (context: ProcessingContext, error: AnalyticsError) => Promise<void>): void {
		this.beforeFallbackHooks.push(hook);
	}

	public registerAfterFallbackHook(hook: (context: ProcessingContext, result: ProcessingResult) => Promise<void>): void {
		this.afterFallbackHooks.push(hook);
	}

	public registerOnErrorHook(hook: (context: ProcessingContext, error: AnalyticsError) => Promise<void>): void {
		this.onErrorHooks.push(hook);
	}

	public async executeBeforeFallbackHooks(context: ProcessingContext, error: AnalyticsError): Promise<void> {
		for (const hook of this.beforeFallbackHooks) {
			try {
				await hook(context, error);
			} catch (hookError) {
				console.warn('Before fallback hook failed:', hookError);
			}
		}
	}

	public async executeAfterFallbackHooks(context: ProcessingContext, result: ProcessingResult): Promise<void> {
		for (const hook of this.afterFallbackHooks) {
			try {
				await hook(context, result);
			} catch (hookError) {
				console.warn('After fallback hook failed:', hookError);
			}
		}
	}

	public async executeOnErrorHooks(context: ProcessingContext, error: AnalyticsError): Promise<void> {
		for (const hook of this.onErrorHooks) {
			try {
				await hook(context, error);
			} catch (hookError) {
				console.warn('On error hook failed:', hookError);
			}
		}
	}
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createProcessingRequest(
	tool: Tool,
	operation: string,
	inputData: any,
	sessionId: string,
	options?: any
): ProcessingRequest {
	return {
		tool,
		operation,
		inputData,
		options,
		sessionId,
	};
}

export function isFallbackCandidate(error: Error | AnalyticsError): boolean {
	if (error instanceof AnalyticsError) {
		return error.retryable !== false;
	}

	// For regular errors, assume they are fallback candidates
	return true;
}

export function shouldRetryAfterFallback(result: ProcessingResult, config: IntegratedErrorHandlingConfig): boolean {
	if (!config.autoRetryAfterFallback) {
		return false;
	}

	if (!result.fallbackUsed) {
		return false;
	}

	if (result.fallbackResult?.quality === 'minimal') {
		return true;
	}

	return result.fallbackResult?.degradationLevel === 'severe' ?? false;
}

// Export the main integration handler
export const integratedFallbackHandler = IntegratedFallbackHandler.getInstance();
export const fallbackIntegrationHooks = FallbackIntegrationHooks.getInstance();
