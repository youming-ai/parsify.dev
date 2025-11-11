/**
 * Comprehensive Fallback Processing System for Developer Tools
 * T142 - Implement fallback processing methods for critical failures
 */

import { AnalyticsError, AnalyticsErrorHandler } from './error-handling';
import { Tool, ToolCategory, ToolMetrics } from '../types/tools';

// ============================================================================
// Core Fallback Types
// ============================================================================

export interface FallbackContext {
	toolId: string;
	toolName: string;
	category: ToolCategory;
	operation: string;
	inputData: any;
	originalError: AnalyticsError;
	sessionId: string;
	timestamp: Date;
	userPreferences: FallbackUserPreferences;
	qualityThreshold: number;
}

export interface FallbackStrategy {
	id: string;
	name: string;
	description: string;
	priority: number; // Higher = preferred
	qualityLevel: FallbackQuality;
	processingTime: number;
	dataLossRisk: DataLossRisk;
	compatibility: ToolCategory[];
	isAvailable: () => boolean;
	execute: (context: FallbackContext) => Promise<FallbackResult>;
}

export interface FallbackResult {
	success: boolean;
	result?: any;
	error?: AnalyticsError;
	quality: FallbackQuality;
	processingTime: number;
	dataIntegrity: DataIntegrityReport;
	userWarnings: string[];
	limitations: string[];
	metrics: FallbackMetrics;
	strategyUsed: string;
	degradationLevel: DegradationLevel;
}

export interface FallbackMetrics {
	memoryUsage: number;
	inputSize: number;
	outputSize: number;
	accuracy: number;
	coverage: number;
	userSatisfactionPrediction: number;
}

export interface DataIntegrityReport {
	inputPreserved: boolean;
	outputComplete: boolean;
	dataLoss: DataLossInfo[];
	transformations: DataTransformation[];
	qualityScore: number;
}

export interface DataLossInfo {
	type: 'structure' | 'content' | 'metadata' | 'formatting';
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	impact: string;
}

export interface DataTransformation {
	from: string;
	to: string;
	reason: string;
	potentialDataLoss: boolean;
}

export type FallbackQuality = 'full' | 'high' | 'medium' | 'low' | 'minimal';
export type DataLossRisk = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type DegradationLevel = 'none' | 'minor' | 'moderate' | 'significant' | 'severe';

export interface FallbackUserPreferences {
	enableFallbacks: boolean;
	qualityThreshold: FallbackQuality;
	allowDataLoss: boolean;
	preferredStrategies: string[];
	notifyOnFallback: boolean;
	autoRetryPrimary: boolean;
	analyticsOptOut: boolean;
}

export interface FallbackAnalytics {
	totalFallbacks: number;
	fallbacksByTool: Record<string, number>;
	fallbacksByCategory: Record<ToolCategory, number>;
	fallbacksByQuality: Record<FallbackQuality, number>;
	strategySuccessRates: Record<string, number>;
	averageFallbackTime: number;
	userSatisfactionScores: number[];
	fallbackCauses: Record<string, number>;
	degradationDistribution: Record<DegradationLevel, number>;
}

// ============================================================================
// Fallback Registry
// ============================================================================

export class FallbackStrategyRegistry {
	private static instance: FallbackStrategyRegistry;
	private strategies: Map<string, FallbackStrategy> = new Map();
	private categoryStrategies: Map<ToolCategory, FallbackStrategy[]> = new Map();

	private constructor() {
		this.initializeDefaultStrategies();
	}

	public static getInstance(): FallbackStrategyRegistry {
		if (!FallbackStrategyRegistry.instance) {
			FallbackStrategyRegistry.instance = new FallbackStrategyRegistry();
		}
		return FallbackStrategyRegistry.instance;
	}

	public registerStrategy(strategy: FallbackStrategy): void {
		this.strategies.set(strategy.id, strategy);

		// Add to category mappings
		strategy.compatibility.forEach(category => {
			if (!this.categoryStrategies.has(category)) {
				this.categoryStrategies.set(category, []);
			}
			const categoryList = this.categoryStrategies.get(category)!;

			// Insert maintaining priority order (highest first)
			let insertIndex = categoryList.length;
			for (let i = 0; i < categoryList.length; i++) {
				if (categoryList[i].priority < strategy.priority) {
					insertIndex = i;
					break;
				}
			}
			categoryList.splice(insertIndex, 0, strategy);
		});
	}

	public getStrategiesForCategory(category: ToolCategory): FallbackStrategy[] {
		return this.categoryStrategies.get(category) || [];
	}

	public getStrategy(id: string): FallbackStrategy | undefined {
		return this.strategies.get(id);
	}

	public getAllStrategies(): FallbackStrategy[] {
		return Array.from(this.strategies.values());
	}

	public getAvailableStrategies(category: ToolCategory): FallbackStrategy[] {
		return this.getStrategiesForCategory(category)
			.filter(strategy => strategy.isAvailable());
	}

	private initializeDefaultStrategies(): void {
		// JSON Processing Fallbacks
		this.registerStrategy(new JSONSimplifiedFallback());
		this.registerStrategy(new JSONValidationFallback());
		this.registerStrategy(new JSONFormattingFallback());

		// Code Processing Fallbacks
		this.registerStrategy(new CodeValidationFallback());
		this.registerStrategy(new CodeHighlightingFallback());
		this.registerStrategy(new CodeFormattingFallback());

		// File Processing Fallbacks
		this.registerStrategy(new TextFileFallback());
		this.registerStrategy(new BinaryFileFallback());
		this.registerStrategy(new ImageMetadataFallback());

		// Network Utilities Fallbacks
		this.registerStrategy(new LocalValidationFallback());
		this.registerStrategy(new CachedResultFallback());
		this.registerStrategy(new ManualInputFallback());

		// Text Processing Fallbacks
		this.registerStrategy(new BasicTextFallback());
		this.registerStrategy(new RegexFallback());
		this.registerStrategy(new EncodingFallback());

		// Security & Encryption Fallbacks
		this.registerStrategy(new ClientSideHashingFallback());
		this.registerStrategy(new BasicValidationFallback());
		this.registerStrategy(new FormatPreservingFallback());
	}
}

// ============================================================================
// Core Fallback Processor
// ============================================================================

export class FallbackProcessor {
	private static instance: FallbackProcessor;
	private registry: FallbackStrategyRegistry;
	private analytics: FallbackAnalyticsManager;
	private errorHandler: AnalyticsErrorHandler;
	private preferencesManager: FallbackPreferencesManager;

	private constructor() {
		this.registry = FallbackStrategyRegistry.getInstance();
		this.analytics = FallbackAnalyticsManager.getInstance();
		this.errorHandler = AnalyticsErrorHandler.getInstance();
		this.preferencesManager = FallbackPreferencesManager.getInstance();
	}

	public static getInstance(): FallbackProcessor {
		if (!FallbackProcessor.instance) {
			FallbackProcessor.instance = new FallbackProcessor();
		}
		return FallbackProcessor.instance;
	}

	public async processFallback(
		toolId: string,
		toolName: string,
		category: ToolCategory,
		operation: string,
		inputData: any,
		originalError: AnalyticsError,
		sessionId: string
	): Promise<FallbackResult> {
		const context: FallbackContext = {
			toolId,
			toolName,
			category,
			operation,
			inputData,
			originalError,
			sessionId,
			timestamp: new Date(),
			userPreferences: await this.preferencesManager.getUserPreferences(sessionId),
			qualityThreshold: this.getQualityThreshold(category),
		};

		// Check if fallbacks are enabled for this user
		if (!context.userPreferences.enableFallbacks) {
			return this.createNoFallbackResult(context);
		}

		try {
			// Log fallback attempt
			this.analytics.recordFallbackAttempt(context);

			// Get available strategies for this category
			const strategies = this.registry.getAvailableStrategies(category);

			if (strategies.length === 0) {
				return this.createNoAvailableStrategiesResult(context);
			}

			// Filter strategies based on user preferences and quality threshold
			const eligibleStrategies = this.filterEligibleStrategies(strategies, context);

			if (eligibleStrategies.length === 0) {
				return this.createNoEligibleStrategiesResult(context);
			}

			// Try strategies in order of priority
			for (const strategy of eligibleStrategies) {
				try {
					const startTime = Date.now();
					const result = await strategy.execute(context);
					const processingTime = Date.now() - startTime;

					// Update result with timing
					result.processingTime = processingTime;
					result.strategyUsed = strategy.id;

					// Validate result quality
					if (this.validateResultQuality(result, context)) {
						// Record successful fallback
						this.analytics.recordFallbackSuccess(context, strategy, result);
						return result;
					} else {
						// Quality too low, try next strategy
						continue;
					}
				} catch (strategyError) {
					// Strategy failed, try next one
					console.warn(`Fallback strategy ${strategy.id} failed:`, strategyError);
					continue;
				}
			}

			// All strategies failed
			return this.createAllStrategiesFailedResult(context, eligibleStrategies);

		} catch (error) {
			return this.createFallbackSystemErrorResult(context, error as AnalyticsError);
		}
	}

	public getAvailableFallbackStrategies(category: ToolCategory): FallbackStrategy[] {
		return this.registry.getAvailableStrategies(category);
	}

	public getFallbackAnalytics(): FallbackAnalytics {
		return this.analytics.getAnalytics();
	}

	private filterEligibleStrategies(
		strategies: FallbackStrategy[],
		context: FallbackContext
	): FallbackStrategy[] {
		return strategies.filter(strategy => {
			// Check user preferences
			if (context.userPreferences.preferredStrategies.length > 0) {
				if (!context.userPreferences.preferredStrategies.includes(strategy.id)) {
					return false;
				}
			}

			// Check quality threshold
			if (!this.meetsQualityThreshold(strategy.qualityLevel, context.qualityThreshold)) {
				return false;
			}

			// Check data loss risk
			if (!context.userPreferences.allowDataLoss &&
				strategy.dataLossRisk !== 'none' && strategy.dataLossRisk !== 'low') {
				return false;
			}

			return true;
		});
	}

	private meetsQualityThreshold(strategyQuality: FallbackQuality, threshold: FallbackQuality): boolean {
		const qualityLevels = ['minimal', 'low', 'medium', 'high', 'full'];
		const strategyIndex = qualityLevels.indexOf(strategyQuality);
		const thresholdIndex = qualityLevels.indexOf(threshold);

		return strategyIndex >= thresholdIndex;
	}

	private getQualityThreshold(category: ToolCategory): FallbackQuality {
		// Different categories may have different quality requirements
		const categoryThresholds: Record<ToolCategory, FallbackQuality> = {
			'JSON Processing Suite': 'high',
			'Code Processing Suite': 'medium',
			'File Processing Suite': 'medium',
			'Network Utilities': 'low',
			'Text Processing Suite': 'high',
			'Security & Encryption Suite': 'full',
		};

		return categoryThresholds[category] || 'medium';
	}

	private validateResultQuality(result: FallbackResult, context: FallbackContext): boolean {
		// Check if result meets minimum quality requirements
		return result.success &&
			   this.meetsQualityThreshold(result.quality, context.qualityThreshold);
	}

	private createNoFallbackResult(context: FallbackContext): FallbackResult {
		return {
			success: false,
			error: new AnalyticsError('Fallback processing is disabled by user preferences'),
			quality: 'minimal',
			processingTime: 0,
			dataIntegrity: {
				inputPreserved: false,
				outputComplete: false,
				dataLoss: [],
				transformations: [],
				qualityScore: 0,
			},
			userWarnings: ['Fallback processing is disabled'],
			limitations: ['No processing possible'],
			metrics: {
				memoryUsage: 0,
				inputSize: 0,
				outputSize: 0,
				accuracy: 0,
				coverage: 0,
				userSatisfactionPrediction: 0,
			},
			strategyUsed: 'none',
			degradationLevel: 'severe',
		};
	}

	private createNoAvailableStrategiesResult(context: FallbackContext): FallbackResult {
		return {
			success: false,
			error: new AnalyticsError(`No fallback strategies available for category: ${context.category}`),
			quality: 'minimal',
			processingTime: 0,
			dataIntegrity: {
				inputPreserved: true,
				outputComplete: false,
				dataLoss: [],
				transformations: [],
				qualityScore: 0,
			},
			userWarnings: [`No fallback strategies available for ${context.category}`],
			limitations: ['No processing available for this category'],
			metrics: {
				memoryUsage: 0,
				inputSize: 0,
				outputSize: 0,
				accuracy: 0,
				coverage: 0,
				userSatisfactionPrediction: 0,
			},
			strategyUsed: 'none',
			degradationLevel: 'severe',
		};
	}

	private createNoEligibleStrategiesResult(context: FallbackContext): FallbackResult {
		return {
			success: false,
			error: new AnalyticsError('No fallback strategies meet user preferences and quality requirements'),
			quality: 'minimal',
			processingTime: 0,
			dataIntegrity: {
				inputPreserved: true,
				outputComplete: false,
				dataLoss: [],
				transformations: [],
				qualityScore: 0,
			},
			userWarnings: ['No strategies meet your quality preferences'],
			limitations: ['Adjust preferences to enable fallback processing'],
			metrics: {
				memoryUsage: 0,
				inputSize: 0,
				outputSize: 0,
				accuracy: 0,
				coverage: 0,
				userSatisfactionPrediction: 0,
			},
			strategyUsed: 'none',
			degradationLevel: 'severe',
		};
	}

	private createAllStrategiesFailedResult(
		context: FallbackContext,
		strategies: FallbackStrategy[]
	): FallbackResult {
		return {
			success: false,
			error: new AnalyticsError(`All fallback strategies failed: ${strategies.map(s => s.id).join(', ')}`),
			quality: 'minimal',
			processingTime: 0,
			dataIntegrity: {
				inputPreserved: true,
				outputComplete: false,
				dataLoss: [],
				transformations: [],
				qualityScore: 0,
			},
			userWarnings: ['All fallback strategies failed'],
			limitations: ['No processing available'],
			metrics: {
				memoryUsage: 0,
				inputSize: 0,
				outputSize: 0,
				accuracy: 0,
				coverage: 0,
				userSatisfactionPrediction: 0,
			},
			strategyUsed: 'none',
			degradationLevel: 'severe',
		};
	}

	private createFallbackSystemErrorResult(
		context: FallbackContext,
		error: AnalyticsError
	): FallbackResult {
		return {
			success: false,
			error,
			quality: 'minimal',
			processingTime: 0,
			dataIntegrity: {
				inputPreserved: false,
				outputComplete: false,
				dataLoss: [{
					type: 'content',
					description: 'Fallback system error',
					severity: 'critical',
					impact: 'Unable to process data',
				}],
				transformations: [],
				qualityScore: 0,
			},
			userWarnings: ['Fallback system error occurred'],
			limitations: ['System error prevents fallback processing'],
			metrics: {
				memoryUsage: 0,
				inputSize: 0,
				outputSize: 0,
				accuracy: 0,
				coverage: 0,
				userSatisfactionPrediction: 0,
			},
			strategyUsed: 'none',
			degradationLevel: 'severe',
		};
	}
}

// ============================================================================
// Fallback Analytics Manager
// ============================================================================

class FallbackAnalyticsManager {
	private static instance: FallbackAnalyticsManager;
	private analytics: FallbackAnalytics;

	private constructor() {
		this.analytics = this.initializeAnalytics();
	}

	public static getInstance(): FallbackAnalyticsManager {
		if (!FallbackAnalyticsManager.instance) {
			FallbackAnalyticsManager.instance = new FallbackAnalyticsManager();
		}
		return FallbackAnalyticsManager.instance;
	}

	public recordFallbackAttempt(context: FallbackContext): void {
		this.analytics.totalFallbacks++;
		this.analytics.fallbacksByTool[context.toolId] =
			(this.analytics.fallbacksByTool[context.toolId] || 0) + 1;
		this.analytics.fallbacksByCategory[context.category] =
			(this.analytics.fallbacksByCategory[context.category] || 0) + 1;
		this.analytics.fallbacksByCauses[context.originalError.code] =
			(this.analytics.fallbacksByCauses[context.originalError.code] || 0) + 1;
	}

	public recordFallbackSuccess(
		context: FallbackContext,
		strategy: FallbackStrategy,
		result: FallbackResult
	): void {
		// Update quality metrics
		this.analytics.fallbacksByQuality[result.quality] =
			(this.analytics.fallbacksByQuality[result.quality] || 0) + 1;

		// Update strategy success rates
		const strategyStats = this.analytics.strategySuccessRates[strategy.id] || { success: 0, total: 0 };
		strategyStats.success++;
		strategyStats.total++;
		this.analytics.strategySuccessRates[strategy.id] = strategyStats.success / strategyStats.total;

		// Update timing metrics
		this.analytics.averageFallbackTime =
			(this.analytics.averageFallbackTime + result.processingTime) / 2;

		// Update degradation metrics
		this.analytics.degradationDistribution[result.degradationLevel] =
			(this.analytics.degradationDistribution[result.degradationLevel] || 0) + 1;

		// Update satisfaction prediction
		this.analytics.userSatisfactionScores.push(result.metrics.userSatisfactionPrediction);
		if (this.analytics.userSatisfactionScores.length > 100) {
			this.analytics.userSatisfactionScores.shift(); // Keep last 100 scores
		}
	}

	public getAnalytics(): FallbackAnalytics {
		return { ...this.analytics };
	}

	private initializeAnalytics(): FallbackAnalytics {
		return {
			totalFallbacks: 0,
			fallbacksByTool: {},
			fallbacksByCategory: {
				'JSON Processing Suite': 0,
				'Code Processing Suite': 0,
				'File Processing Suite': 0,
				'Network Utilities': 0,
				'Text Processing Suite': 0,
				'Security & Encryption Suite': 0,
			},
			fallbacksByQuality: {
				full: 0,
				high: 0,
				medium: 0,
				low: 0,
				minimal: 0,
			},
			strategySuccessRates: {},
			averageFallbackTime: 0,
			userSatisfactionScores: [],
			fallbacksByCauses: {},
			degradationDistribution: {
				none: 0,
				minor: 0,
				moderate: 0,
				significant: 0,
				severe: 0,
			},
		};
	}
}

// ============================================================================
// Fallback Preferences Manager
// ============================================================================

class FallbackPreferencesManager {
	private static instance: FallbackPreferencesManager;
	private preferences: Map<string, FallbackUserPreferences> = new Map();

	private constructor() {
		// Load saved preferences from localStorage
		this.loadPreferences();
	}

	public static getInstance(): FallbackPreferencesManager {
		if (!FallbackPreferencesManager.instance) {
			FallbackPreferencesManager.instance = new FallbackPreferencesManager();
		}
		return FallbackPreferencesManager.instance;
	}

	public async getUserPreferences(sessionId: string): Promise<FallbackUserPreferences> {
		return this.preferences.get(sessionId) || this.getDefaultPreferences();
	}

	public setUserPreferences(sessionId: string, preferences: Partial<FallbackUserPreferences>): void {
		const existing = this.preferences.get(sessionId) || this.getDefaultPreferences();
		const updated = { ...existing, ...preferences, lastUpdated: new Date() };
		this.preferences.set(sessionId, updated);
		this.savePreferences();
	}

	private getDefaultPreferences(): FallbackUserPreferences {
		return {
			enableFallbacks: true,
			qualityThreshold: 'medium',
			allowDataLoss: false,
			preferredStrategies: [],
			notifyOnFallback: true,
			autoRetryPrimary: true,
			analyticsOptOut: false,
		};
	}

	private loadPreferences(): void {
		try {
			const saved = localStorage.getItem('fallback_preferences');
			if (saved) {
				const data = JSON.parse(saved);
				Object.entries(data).forEach(([sessionId, prefs]: [string, any]) => {
					this.preferences.set(sessionId, prefs as FallbackUserPreferences);
				});
			}
		} catch (error) {
			console.warn('Failed to load fallback preferences:', error);
		}
	}

	private savePreferences(): void {
		try {
			const data = Object.fromEntries(this.preferences);
			localStorage.setItem('fallback_preferences', JSON.stringify(data));
		} catch (error) {
			console.warn('Failed to save fallback preferences:', error);
		}
	}
}

// ============================================================================
// Base Fallback Strategy Class
// ============================================================================

export abstract class BaseFallbackStrategy implements FallbackStrategy {
	public abstract id: string;
	public abstract name: string;
	public abstract description: string;
	public abstract priority: number;
	public abstract qualityLevel: FallbackQuality;
	public abstract processingTime: number;
	public abstract dataLossRisk: DataLossRisk;
	public abstract compatibility: ToolCategory[];

	public abstract isAvailable(): boolean;
	public abstract execute(context: FallbackContext): Promise<FallbackResult>;

	protected createBaseResult(
		success: boolean,
		quality: FallbackQuality,
		userWarnings: string[] = [],
		limitations: string[] = [],
		dataIntegrity?: Partial<DataIntegrityReport>
	): FallbackResult {
		return {
			success,
			quality,
			processingTime: 0,
			dataIntegrity: {
				inputPreserved: true,
				outputComplete: success,
				dataLoss: [],
				transformations: [],
				qualityScore: this.getQualityScore(quality),
				...dataIntegrity,
			},
			userWarnings,
			limitations,
			metrics: {
				memoryUsage: 0,
				inputSize: 0,
				outputSize: 0,
				accuracy: this.getAccuracyScore(quality),
				coverage: this.getCoverageScore(quality),
				userSatisfactionPrediction: this.getSatisfactionPrediction(quality),
			},
			strategyUsed: this.id,
			degradationLevel: this.getDegradationLevel(quality),
		};
	}

	private getQualityScore(quality: FallbackQuality): number {
		const scores = { full: 100, high: 85, medium: 70, low: 50, minimal: 25 };
		return scores[quality] || 0;
	}

	private getAccuracyScore(quality: FallbackQuality): number {
		const scores = { full: 100, high: 90, medium: 75, low: 60, minimal: 40 };
		return scores[quality] || 0;
	}

	private getCoverageScore(quality: FallbackQuality): number {
		const scores = { full: 100, high: 85, medium: 65, low: 45, minimal: 20 };
		return scores[quality] || 0;
	}

	private getSatisfactionPrediction(quality: FallbackQuality): number {
		const scores = { full: 95, high: 80, medium: 60, low: 35, minimal: 15 };
		return scores[quality] || 0;
	}

	private getDegradationLevel(quality: FallbackQuality): DegradationLevel {
		const mapping = {
			full: 'none',
			high: 'minor',
			medium: 'moderate',
			low: 'significant',
			minimal: 'severe'
		};
		return mapping[quality] || 'severe';
	}

	protected async measurePerformance<T>(
		operation: () => Promise<T>
	): Promise<{ result: T; processingTime: number; memoryUsage: number }> {
		const startTime = Date.now();
		const startMemory = this.getMemoryUsage();

		try {
			const result = await operation();
			const processingTime = Date.now() - startTime;
			const endMemory = this.getMemoryUsage();

			return {
				result,
				processingTime,
				memoryUsage: Math.max(0, endMemory - startMemory),
			};
		} catch (error) {
			throw error;
		}
	}

	private getMemoryUsage(): number {
		// Basic memory usage estimation
		if (performance.memory) {
			return performance.memory.usedJSHeapSize;
		}
		return 0;
	}

	protected validateInput(context: FallbackContext): boolean {
		return context.inputData !== null && context.inputData !== undefined;
	}

	protected createError(message: string, original?: AnalyticsError): AnalyticsError {
		const error = new AnalyticsError(message);
		if (original) {
			error.originalError = original;
		}
		return error;
	}
}

export const fallbackProcessor = FallbackProcessor.getInstance();
export const fallbackRegistry = FallbackStrategyRegistry.getInstance();
