/**
 * Fallback Processing System Index
 * Main entry point for the comprehensive fallback processing system
 *
 * This file exports all the components and utilities needed for fallback processing,
 * providing a unified interface for T142 implementation.
 */

// Core fallback processing system
export {
	FallbackProcessor,
	FallbackStrategyRegistry,
	FallbackAnalyticsManager,
	FallbackPreferencesManager,
	BaseFallbackStrategy,
	fallbackProcessor,
	fallbackRegistry,
} from './fallback-processing-system';

export type {
	FallbackContext,
	FallbackStrategy,
	FallbackResult,
	FallbackMetrics,
	DataIntegrityReport,
	FallbackUserPreferences,
	FallbackAnalytics,
	FallbackQuality,
	DataLossRisk,
	DegradationLevel,
} from './fallback-processing-system';

// Tool-specific fallback strategies
export {
	// JSON Processing
	JSONSimplifiedFallback,
	JSONValidationFallback,
	JSONFormattingFallback,

	// Code Processing
	CodeValidationFallback,
	CodeHighlightingFallback,
	CodeFormattingFallback,

	// File Processing
	TextFileFallback,
	BinaryFileFallback,
	ImageMetadataFallback,

	// Network Utilities
	LocalValidationFallback,
	CachedResultFallback,
	ManualInputFallback,

	// Text Processing
	BasicTextFallback,
	RegexFallback,
	EncodingFallback,

	// Security & Encryption
	ClientSideHashingFallback,
	BasicValidationFallback,
	FormatPreservingFallback,
} from './fallback-strategies';

// Quality assessment and user feedback
export {
	FallbackQualityAssessmentEngine,
	qualityAssessmentEngine,
} from './fallback-quality-system';

export type {
	QualityAssessment,
	QualityComponent,
	QualityRecommendation,
	UserFeedback,
	UserRating,
	FeedbackType,
	QualityMetrics,
	UserImpactAssessment,
	ComparativeAnalysis,
	QualityTrend,
} from './fallback-quality-system';

// Analytics and monitoring
export {
	FallbackAnalyticsEngine,
	fallbackAnalyticsEngine,
} from './fallback-analytics-system';

export type {
	FallbackMonitoringConfig,
	FallbackEvent,
	FallbackMetrics,
	PerformanceMetrics,
	QualityMetrics,
	UserMetrics,
	SystemMetrics,
	FallbackTrends,
	FallbackAnomaly,
	FallbackAlert,
	FallbackReport,
	SystemHealthStatus,
} from './fallback-analytics-system';

// Integration with error handling
export {
	IntegratedFallbackHandler,
	FallbackIntegrationHooks,
	integratedFallbackHandler,
	fallbackIntegrationHooks,
} from './fallback-integration';

export type {
	IntegratedErrorHandlingConfig,
	ProcessingRequest,
	ProcessingResult,
	ProcessingMetrics,
	ErrorRecoveryStrategy,
	RecoveryImplementation,
	ProcessingContext,
	ProcessingStats,
} from './fallback-integration';

// React components
export {
	FallbackModeIndicator,
	FallbackStatusBadge,
	FallbackProgressIndicator,
} from '../components/fallback/FallbackModeIndicator';

export {
	FallbackControls,
	FallbackQuickSettings,
} from '../components/fallback/FallbackControls';

export {
	FallbackFeedbackCollector,
	FallbackQualityDashboard,
} from '../components/fallback/FallbackFeedback';

export {
	FallbackSettings,
	FallbackAdvancedSettings,
} from '../components/fallback/FallbackSettings';

// Utility functions and hooks
export function initializeFallbackSystem(config?: {
	enableMonitoring?: boolean;
	enableAnalytics?: boolean;
	qualityThreshold?: FallbackQuality;
	fallbackTimeout?: number;
}): void {
	// Initialize the fallback processing system
	const processor = FallbackProcessor.getInstance();
	const analytics = config?.enableAnalytics !== false ? FallbackAnalyticsEngine.getInstance() : null;
	const qualityAssessment = FallbackQualityAssessmentEngine.getInstance();
	const integration = IntegratedFallbackHandler.getInstance();

	// Start monitoring if enabled
	if (analytics && config?.enableMonitoring !== false) {
		analytics.startMonitoring();
	}

	// Configure integration
	if (config) {
		integration.updateConfig({
			enableFallbackOnError: true,
			fallbackTimeout: config.fallbackTimeout || 10000,
			qualityThreshold: getQualityScore(config.qualityThreshold || 'medium'),
		});
	}

	console.info('Fallback processing system initialized');
}

export function getFallbackSystemHealth(): SystemHealthStatus {
	const analytics = FallbackAnalyticsEngine.getInstance();
	return analytics.getSystemHealth();
}

export function createFallbackContext(
	toolId: string,
	toolName: string,
	category: string,
	operation: string,
	inputData: any,
	originalError: any,
	sessionId: string
): FallbackContext {
	return {
		toolId,
		toolName,
		category: category as any,
		operation,
		inputData,
		originalError,
		sessionId,
		timestamp: new Date(),
		userPreferences: {
			enableFallbacks: true,
			qualityThreshold: 'medium',
			allowDataLoss: false,
			preferredStrategies: [],
			notifyOnFallback: true,
			autoRetryPrimary: true,
			analyticsOptOut: false,
		},
		qualityThreshold: 70,
	};
}

export async function processWithFallback<T>(
	primaryOperation: () => Promise<T>,
	context: Partial<FallbackContext>,
	options?: {
		maxRetries?: number;
		enableFallback?: boolean;
		fallbackStrategy?: string;
	}
): Promise<{ success: boolean; result?: T; fallbackUsed?: boolean; error?: any }> {
	try {
		const result = await primaryOperation();
		return { success: true, result };
	} catch (error) {
		if (options?.enableFallback === false) {
			return { success: false, error };
		}

		// Attempt fallback processing
		try {
			const fallbackResult = await fallbackProcessor.processFallback(
				context.toolId || 'unknown',
				context.toolName || 'Unknown Tool',
				context.category || 'Unknown',
				context.operation || 'unknown',
				context.inputData,
				error,
				context.sessionId || 'default'
			);

			if (fallbackResult.success) {
				return {
					success: true,
					result: fallbackResult.result,
					fallbackUsed: true
				};
			} else {
				return { success: false, error: fallbackResult.error };
			}
		} catch (fallbackError) {
			return { success: false, error: fallbackError };
		}
	}
}

// Utility functions
function getQualityScore(quality: FallbackQuality): number {
	const scores = { full: 100, high: 85, medium: 70, low: 50, minimal: 25 };
	return scores[quality] || 70;
}

export function isFallbackCandidate(error: Error): boolean {
	// Check if error is suitable for fallback processing
	const fallbackCandidates = [
		'NetworkError',
		'TimeoutError',
		'StorageError',
		'OperationFailed',
		'InitializationFailed',
	];

	return fallbackCandidates.some(candidate =>
		error.name.includes(candidate) ||
		error.message.includes(candidate)
	);
}

export function shouldUseFallback(
	error: Error,
	toolCategory: string,
	userPreferences?: Partial<FallbackUserPreferences>
): boolean {
	// Always check if fallback is enabled
	if (userPreferences?.enableFallbacks === false) {
		return false;
	}

	// Check if error is a fallback candidate
	if (!isFallbackCandidate(error)) {
		return false;
	}

	// Check category-specific rules
	const criticalCategories = ['Security & Encryption Suite'];
	if (criticalCategories.includes(toolCategory)) {
		// Only use fallback for security tools if explicitly allowed
		return userPreferences?.allowDataLoss === true;
	}

	return true;
}

// React hooks for fallback processing
export function useFallbackState() {
	const [isFallbackActive, setIsFallbackActive] = useState(false);
	const [fallbackResult, setFallbackResult] = useState<FallbackResult | null>(null);
	const [fallbackQuality, setFallbackQuality] = useState<FallbackQuality>('medium');

	const triggerFallback = useCallback(async (
		context: FallbackContext
	) => {
		setIsFallbackActive(true);
		try {
			const result = await fallbackProcessor.processFallback(
				context.toolId,
				context.toolName,
				context.category,
				context.operation,
				context.inputData,
				context.originalError,
				context.sessionId
			);
			setFallbackResult(result);
			setFallbackQuality(result.quality);
			return result;
		} finally {
			setIsFallbackActive(false);
		}
	}, []);

	const resetFallback = useCallback(() => {
		setIsFallbackActive(false);
		setFallbackResult(null);
		setFallbackQuality('medium');
	}, []);

	return {
		isFallbackActive,
		fallbackResult,
		fallbackQuality,
		triggerFallback,
		resetFallback,
	};
}

export function useFallbackPreferences(sessionId: string) {
	const [preferences, setPreferences] = useState<FallbackUserPreferences>({
		enableFallbacks: true,
		qualityThreshold: 'medium',
		allowDataLoss: false,
		preferredStrategies: [],
		notifyOnFallback: true,
		autoRetryPrimary: true,
		analyticsOptOut: false,
	});

	const updatePreferences = useCallback((newPreferences: Partial<FallbackUserPreferences>) => {
		const updated = { ...preferences, ...newPreferences };
		setPreferences(updated);
		// Save to localStorage
		localStorage.setItem(`fallback_preferences_${sessionId}`, JSON.stringify(updated));
	}, [preferences, sessionId]);

	const loadPreferences = useCallback(() => {
		try {
			const saved = localStorage.getItem(`fallback_preferences_${sessionId}`);
			if (saved) {
				setPreferences(JSON.parse(saved));
			}
		} catch (error) {
			console.error('Failed to load preferences:', error);
		}
	}, [sessionId]);

	useEffect(() => {
		loadPreferences();
	}, [loadPreferences]);

	return {
		preferences,
		updatePreferences,
		loadPreferences,
	};
}

// Performance monitoring utilities
export function createFallbackPerformanceMonitor() {
	const metrics = {
		totalOperations: 0,
		fallbackOperations: 0,
		averageFallbackTime: 0,
		fallbackSuccessRate: 0,
		qualityDistribution: {} as Record<FallbackQuality, number>,
	};

	return {
		recordOperation: (usedFallback: boolean, duration?: number, quality?: FallbackQuality) => {
			metrics.totalOperations++;
			if (usedFallback) {
				metrics.fallbackOperations++;
				if (duration) {
					metrics.averageFallbackTime =
						(metrics.averageFallbackTime + duration) / 2;
				}
				if (quality) {
					metrics.qualityDistribution[quality] =
						(metrics.qualityDistribution[quality] || 0) + 1;
				}
			}
			metrics.fallbackSuccessRate =
				metrics.fallbackOperations / metrics.totalOperations;
		},
		getMetrics: () => ({ ...metrics }),
		reset: () => {
			metrics.totalOperations = 0;
			metrics.fallbackOperations = 0;
			metrics.averageFallbackTime = 0;
			metrics.fallbackSuccessRate = 0;
			metrics.qualityDistribution = {};
		},
	};
}

// Testing utilities
export function createMockFallbackResult(
	quality: FallbackQuality = 'medium',
	success: boolean = true
): FallbackResult {
	return {
		success,
		quality,
		processingTime: Math.random() * 1000 + 500,
		dataIntegrity: {
			inputPreserved: true,
			outputComplete: success,
			dataLoss: [],
			transformations: [],
			qualityScore: getQualityScore(quality),
		},
		userWarnings: quality === 'low' || quality === 'minimal' ? ['Quality warning'] : [],
		limitations: quality !== 'full' ? ['Limited functionality'] : [],
		metrics: {
			memoryUsage: Math.random() * 10000,
			inputSize: Math.random() * 1000,
			outputSize: Math.random() * 1000,
			accuracy: getQualityScore(quality),
			coverage: quality === 'full' ? 100 : 50 + Math.random() * 40,
			userSatisfactionPrediction: getQualityScore(quality),
		},
		strategyUsed: 'mock-strategy',
		degradationLevel: quality === 'full' ? 'none' : 'moderate',
	};
}

// Default export for easy importing
export default {
	// Core system
	initializeFallbackSystem,
	getFallbackSystemHealth,
	processWithFallback,

	// Utilities
	isFallbackCandidate,
	shouldUseFallback,
	createFallbackContext,

	// React hooks
	useFallbackState,
	useFallbackPreferences,

	// Performance monitoring
	createFallbackPerformanceMonitor,

	// Testing
	createMockFallbackResult,

	// Main classes
	FallbackProcessor,
	FallbackStrategyRegistry,
	FallbackAnalyticsEngine,
	FallbackQualityAssessmentEngine,
	IntegratedFallbackHandler,
};
