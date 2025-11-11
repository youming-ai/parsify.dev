/**
 * Fallback Quality Assessment and User Feedback System
 * T142 - Quality assessment and user feedback for fallback processing
 */

import {
	FallbackResult,
	FallbackContext,
	FallbackQuality,
	DegradationLevel,
	DataLossRisk
} from './fallback-processing-system';

// ============================================================================
// Quality Assessment Types
// ============================================================================

export interface QualityMetrics {
	accuracy: number; // 0-100
	completeness: number; // 0-100
	consistency: number; // 0-100
	usability: number; // 0-100
	performance: number; // 0-100
	reliability: number; // 0-100
	overallScore: number; // 0-100
}

export interface QualityAssessment {
	metrics: QualityMetrics;
	qualityLevel: FallbackQuality;
	degradationLevel: DegradationLevel;
	confidence: number; // 0-1
	issues: QualityIssue[];
	recommendations: QualityRecommendation[];
	benchmark: QualityBenchmark;
	userPredictedSatisfaction: number; // 0-100
}

export interface QualityIssue {
	id: string;
	type: QualityIssueType;
	severity: QualityIssueSeverity;
	description: string;
	impact: string;
	component: string;
	detectedAt: Date;
	autoFixable: boolean;
	suggestion?: string;
}

export type QualityIssueType =
	| 'data_loss'
	| 'functionality_missing'
	| 'performance_degradation'
	| 'user_experience_issue'
	| 'compatibility_problem'
	| 'security_concern'
	| 'accuracy_problem'
	| 'consistency_issue';

export type QualityIssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface QualityRecommendation {
	id: string;
	priority: 'low' | 'medium' | 'high';
	category: 'improvement' | 'fix' | 'alternative';
	description: string;
	expectedImpact: number; // 0-100
	effort: 'low' | 'medium' | 'high';
	actionable: boolean;
	steps: string[];
}

export interface QualityBenchmark {
	toolId: string;
	operation: string;
	primaryScore: number;
	fallbackScores: Record<string, number>;
	industryBaseline?: number;
	peerAverage?: number;
	historicalAverage: number;
}

export interface UserFeedback {
	id: string;
	sessionId: string;
	toolId: string;
	operation: string;
	fallbackResult: FallbackResult;
	timestamp: Date;
	rating: UserRating;
	feedbackType: FeedbackType;
	comments?: string;
	issues: UserReportedIssue[];
	suggestions: string[];
	context: FeedbackContext;
}

export interface UserRating {
	overall: number; // 1-5
	accuracy: number; // 1-5
	usability: number; // 1-5
	speed: number; // 1-5
	reliability: number; // 1-5
}

export type FeedbackType = 'automatic' | 'prompted' | 'voluntary' | 'complaint';

export interface UserReportedIssue {
	type: string;
	description: string;
	severity: 'low' | 'medium' | 'high';
	reproducible: boolean;
	steps?: string[];
}

export interface FeedbackContext {
	deviceType: string;
	browser: string;
	screenSize: string;
	sessionDuration: number;
	previousFallbacks: number;
	userExpertise: 'beginner' | 'intermediate' | 'advanced';
	taskComplexity: 'simple' | 'moderate' | 'complex';
}

// ============================================================================
// Quality Assessment Engine
// ============================================================================

export class FallbackQualityAssessment {
	private static instance: FallbackQualityAssessment;
	private assessmentHistory: Map<string, QualityAssessment[]> = new Map();
	private benchmarks: Map<string, QualityBenchmark> = new Map();
	private qualityWeights: Partial<QualityMetrics> = {
		accuracy: 0.25,
		completeness: 0.20,
		consistency: 0.15,
		usability: 0.15,
		performance: 0.15,
		reliability: 0.10,
	};

	private constructor() {
		this.initializeBenchmarks();
	}

	public static getInstance(): FallbackQualityAssessment {
		if (!FallbackQualityAssessment.instance) {
			FallbackQualityAssessment.instance = new FallbackQualityAssessment();
		}
		return FallbackQualityAssessment.instance;
	}

	public async assessQuality(
		result: FallbackResult,
		context: FallbackContext
	): Promise<QualityAssessment> {
		const metrics = await this.calculateQualityMetrics(result, context);
		const qualityLevel = this.determineQualityLevel(metrics);
		const degradationLevel = this.determineDegradationLevel(metrics);
		const confidence = this.calculateConfidence(metrics, result);
		const issues = await this.identifyQualityIssues(result, context, metrics);
		const recommendations = this.generateRecommendations(issues, metrics);
		const benchmark = this.getBenchmark(context.toolId, context.operation);
		const userPredictedSatisfaction = this.predictUserSatisfaction(metrics, context);

		const assessment: QualityAssessment = {
			metrics,
			qualityLevel,
			degradationLevel,
			confidence,
			issues,
			recommendations,
			benchmark,
			userPredictedSatisfaction,
		};

		// Store assessment for learning
		this.storeAssessment(context.toolId, assessment);

		return assessment;
	}

	public updateQualityWeights(weights: Partial<QualityMetrics>): void {
		this.qualityWeights = { ...this.qualityWeights, ...weights };
	}

	public getAssessmentHistory(toolId: string): QualityAssessment[] {
		return this.assessmentHistory.get(toolId) || [];
	}

	public updateBenchmark(toolId: string, operation: string, primaryScore: number): void {
		const key = `${toolId}_${operation}`;
		const existing = this.benchmarks.get(key) || {
			toolId,
			operation,
			primaryScore: 0,
			fallbackScores: {},
			historicalAverage: 0,
		};

		existing.primaryScore = primaryScore;
		existing.historicalAverage = this.calculateHistoricalAverage(key, primaryScore);
		this.benchmarks.set(key, existing);
	}

	private async calculateQualityMetrics(
		result: FallbackResult,
		context: FallbackContext
	): Promise<QualityMetrics> {
		const accuracy = await this.assessAccuracy(result, context);
		const completeness = this.assessCompleteness(result, context);
		const consistency = this.assessConsistency(result, context);
		const usability = await this.assessUsability(result, context);
		const performance = this.assessPerformance(result);
		const reliability = this.assessReliability(result, context);

		const weights = this.qualityWeights as QualityMetrics;
		const overallScore =
			accuracy * (weights.accuracy || 0.25) +
			completeness * (weights.completeness || 0.20) +
			consistency * (weights.consistency || 0.15) +
			usability * (weights.usability || 0.15) +
			performance * (weights.performance || 0.15) +
			reliability * (weights.reliability || 0.10);

		return {
			accuracy,
			completeness,
			consistency,
			usability,
			performance,
			reliability,
			overallScore,
		};
	}

	private async assessAccuracy(result: FallbackResult, context: FallbackContext): Promise<number> {
		let score = 100;

		// Penalize for data integrity issues
		if (!result.dataIntegrity.inputPreserved) {
			score -= 40;
		}

		if (!result.dataIntegrity.outputComplete) {
			score -= 30;
		}

		// Penalize for data loss
		result.dataIntegrity.dataLoss.forEach(loss => {
			switch (loss.severity) {
				case 'critical':
					score -= 25;
					break;
				case 'high':
					score -= 15;
					break;
				case 'medium':
					score -= 10;
					break;
				case 'low':
					score -= 5;
					break;
			}
		});

		// Consider transformations that might affect accuracy
		result.dataIntegrity.transformations.forEach(transform => {
			if (transform.potentialDataLoss) {
				score -= 10;
			}
		});

		// Consider strategy quality
		const strategyScore = this.getStrategyAccuracyScore(result.strategyUsed);
		score = Math.min(score, strategyScore);

		return Math.max(0, score);
	}

	private assessCompleteness(result: FallbackResult, context: FallbackContext): number {
		let score = 100;

		// Check if all expected functionality is present
		if (result.limitations.length > 0) {
			score -= Math.min(30, result.limitations.length * 5);
		}

		// Check for warnings that indicate incomplete functionality
		if (result.userWarnings.length > 0) {
			score -= Math.min(20, result.userWarnings.length * 3);
		}

		// Consider coverage metric
		score *= (result.metrics.coverage / 100);

		return Math.max(0, score);
	}

	private assessConsistency(result: FallbackResult, context: FallbackContext): number {
		let score = 100;

		// Check for consistent behavior across different inputs
		const historicalAssessments = this.getAssessmentHistory(context.toolId);
		if (historicalAssessments.length > 0) {
			const recentScores = historicalAssessments.slice(-5).map(a => a.metrics.accuracy);
			const averageRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
			const currentScore = result.metrics.accuracy;

			// Penalize if current result deviates significantly from recent performance
			const deviation = Math.abs(currentScore - averageRecentScore);
			if (deviation > 20) {
				score -= 25;
			} else if (deviation > 10) {
				score -= 10;
			}
		}

		// Check for internal consistency in the result
		if (result.metrics.accuracy < 50 && result.metrics.coverage > 80) {
			score -= 20; // Inconsistent signals
		}

		return Math.max(0, score);
	}

	private async assessUsability(result: FallbackResult, context: FallbackContext): Promise<number> {
		let score = 100;

		// Penalize for complex limitations that affect user experience
		result.limitations.forEach(limitation => {
			if (limitation.toLowerCase().includes('no') || limitation.toLowerCase().includes('unable')) {
				score -= 10;
			}
		});

		// Penalize for user warnings that indicate usability issues
		result.userWarnings.forEach(warning => {
			if (warning.toLowerCase().includes('manual') || warning.toLowerCase().includes('limited')) {
				score -= 8;
			}
		});

		// Consider degradation level impact on usability
		switch (result.degradationLevel) {
			case 'severe':
				score -= 40;
				break;
			case 'significant':
				score -= 25;
				break;
			case 'moderate':
				score -= 15;
				break;
			case 'minor':
				score -= 5;
				break;
		}

		// Consider processing time impact on usability
		if (result.processingTime > 5000) {
			score -= 20;
		} else if (result.processingTime > 2000) {
			score -= 10;
		}

		return Math.max(0, score);
	}

	private assessPerformance(result: FallbackResult): number {
		let score = 100;

		// Base performance on processing time
		if (result.processingTime <= 100) {
			score = 100;
		} else if (result.processingTime <= 500) {
			score = 90;
		} else if (result.processingTime <= 1000) {
			score = 80;
		} else if (result.processingTime <= 2000) {
			score = 70;
		} else if (result.processingTime <= 5000) {
			score = 50;
		} else {
			score = 30;
		}

		// Adjust for memory usage
		const memoryUsageMB = result.metrics.memoryUsage / (1024 * 1024);
		if (memoryUsageMB > 100) {
			score -= 20;
		} else if (memoryUsageMB > 50) {
			score -= 10;
		}

		return Math.max(0, score);
	}

	private assessReliability(result: FallbackResult, context: FallbackContext): number {
		let score = 100;

		// Base score on success status
		if (!result.success) {
			score = 0;
		}

		// Consider historical reliability of this strategy
		const historicalSuccess = this.getStrategyReliabilityScore(result.strategyUsed);
		score = Math.min(score, historicalSuccess);

		// Consider error indicators
		if (result.dataIntegrity.dataLoss.some(loss => loss.severity === 'critical')) {
			score -= 30;
		}

		// Consider consistency with expected behavior
		if (result.quality === 'minimal') {
			score -= 25;
		}

		return Math.max(0, score);
	}

	private determineQualityLevel(metrics: QualityMetrics): FallbackQuality {
		if (metrics.overallScore >= 95) return 'full';
		if (metrics.overallScore >= 85) return 'high';
		if (metrics.overallScore >= 70) return 'medium';
		if (metrics.overallScore >= 50) return 'low';
		return 'minimal';
	}

	private determineDegradationLevel(metrics: QualityMetrics): DegradationLevel {
		if (metrics.overallScore >= 95) return 'none';
		if (metrics.overallScore >= 85) return 'minor';
		if (metrics.overallScore >= 70) return 'moderate';
		if (metrics.overallScore >= 50) return 'significant';
		return 'severe';
	}

	private calculateConfidence(metrics: QualityMetrics, result: FallbackResult): number {
		let confidence = 0.5; // Base confidence

		// Increase confidence based on consistency
		if (metrics.consistency > 80) {
			confidence += 0.2;
		}

		// Increase confidence based on reliability
		if (metrics.reliability > 80) {
			confidence += 0.2;
		}

		// Decrease confidence for low accuracy
		if (metrics.accuracy < 60) {
			confidence -= 0.2;
		}

		// Consider data integrity
		if (result.dataIntegrity.inputPreserved && result.dataIntegrity.outputComplete) {
			confidence += 0.1;
		}

		return Math.max(0, Math.min(1, confidence));
	}

	private async identifyQualityIssues(
		result: FallbackResult,
		context: FallbackContext,
		metrics: QualityMetrics
	): Promise<QualityIssue[]> {
		const issues: QualityIssue[] = [];

		// Data loss issues
		result.dataIntegrity.dataLoss.forEach((loss, index) => {
			issues.push({
				id: `data_loss_${index}`,
				type: 'data_loss',
				severity: loss.severity as QualityIssueSeverity,
				description: loss.description,
				impact: loss.impact,
				component: 'data_processing',
				detectedAt: new Date(),
				autoFixable: false,
			});
		});

		// Performance issues
		if (result.processingTime > 3000) {
			issues.push({
				id: 'performance_slow',
				type: 'performance_degradation',
				severity: result.processingTime > 10000 ? 'high' : 'medium',
				description: `Slow processing time: ${result.processingTime}ms`,
				impact: 'Poor user experience',
				component: 'processing_engine',
				detectedAt: new Date(),
				autoFixable: false,
				suggestion: 'Consider optimizing the algorithm or using a more efficient strategy',
			});
		}

		// Accuracy issues
		if (metrics.accuracy < 70) {
			issues.push({
				id: 'accuracy_low',
				type: 'accuracy_problem',
				severity: metrics.accuracy < 50 ? 'high' : 'medium',
				description: `Low accuracy score: ${metrics.accuracy}%`,
				impact: 'Results may be incorrect or incomplete',
				component: 'accuracy_engine',
				detectedAt: new Date(),
				autoFixable: false,
				suggestion: 'Review the fallback strategy implementation',
			});
		}

		// Functionality issues
		if (result.limitations.length > 3) {
			issues.push({
				id: 'functionality_missing',
				type: 'functionality_missing',
				severity: 'medium',
				description: `Multiple limitations detected: ${result.limitations.length}`,
				impact: 'Limited tool functionality',
				component: 'feature_set',
				detectedAt: new Date(),
				autoFixable: false,
			});
		}

		// Usability issues
		if (metrics.usability < 60) {
			issues.push({
				id: 'usability_poor',
				type: 'user_experience_issue',
				severity: 'medium',
				description: `Poor usability score: ${metrics.usability}%`,
				impact: 'Difficult to use or understand results',
				component: 'user_interface',
				detectedAt: new Date(),
				autoFixable: true,
				suggestion: 'Improve error messages and user guidance',
			});
		}

		return issues;
	}

	private generateRecommendations(
		issues: QualityIssue[],
		metrics: QualityMetrics
	): QualityRecommendation[] {
		const recommendations: QualityRecommendation[] = [];

		// Performance recommendations
		if (metrics.performance < 70) {
			recommendations.push({
				id: 'optimize_performance',
				priority: 'high',
				category: 'improvement',
				description: 'Optimize processing performance for better user experience',
				expectedImpact: 25,
				effort: 'medium',
				actionable: true,
				steps: [
					'Profile the fallback strategy',
					'Identify performance bottlenecks',
					'Implement optimizations',
					'Consider alternative algorithms',
				],
			});
		}

		// Accuracy recommendations
		if (metrics.accuracy < 80) {
			recommendations.push({
				id: 'improve_accuracy',
				priority: 'high',
				category: 'fix',
				description: 'Improve accuracy of the fallback processing',
				expectedImpact: 30,
				effort: 'high',
				actionable: true,
				steps: [
					'Review error handling logic',
					'Add validation checks',
					'Implement better data transformation',
					'Add comprehensive testing',
				],
			});
		}

		// Functionality recommendations
		const functionalityIssues = issues.filter(i => i.type === 'functionality_missing');
		if (functionalityIssues.length > 0) {
			recommendations.push({
				id: 'expand_functionality',
				priority: 'medium',
				category: 'improvement',
				description: 'Expand fallback functionality to cover more use cases',
				expectedImpact: 20,
				effort: 'high',
				actionable: true,
				steps: [
					'Analyze missing functionality',
					'Implement additional features',
					'Add support for edge cases',
					'Improve compatibility',
				],
			});
		}

		// Data loss recommendations
		const dataLossIssues = issues.filter(i => i.type === 'data_loss');
		if (dataLossIssues.length > 0) {
			recommendations.push({
				id: 'reduce_data_loss',
				priority: 'high',
				category: 'fix',
				description: 'Implement strategies to minimize data loss during fallback processing',
				expectedImpact: 35,
				effort: 'medium',
				actionable: true,
				steps: [
					'Improve data preservation logic',
					'Add data integrity checks',
					'Implement backup strategies',
					'Better error recovery mechanisms',
				],
			});
		}

		return recommendations.sort((a, b) => {
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	}

	private getBenchmark(toolId: string, operation: string): QualityBenchmark {
		const key = `${toolId}_${operation}`;
		return this.benchmarks.get(key) || {
			toolId,
			operation,
			primaryScore: 100,
			fallbackScores: {},
			historicalAverage: 0,
		};
	}

	private predictUserSatisfaction(metrics: QualityMetrics, context: FallbackContext): number {
		// Base prediction on overall metrics
		let satisfaction = metrics.overallScore;

		// Adjust for specific factors that affect user satisfaction
		if (metrics.performance < 60) {
			satisfaction -= 10; // Users dislike slow performance
		}

		if (metrics.usability < 70) {
			satisfaction -= 15; // Poor usability significantly impacts satisfaction
		}

		if (metrics.accuracy < 80) {
			satisfaction -= 20; // Accuracy is critical for user satisfaction
		}

		// Consider context factors
		if (context.userPreferences.qualityThreshold === 'full') {
			satisfaction -= 5; // High-expectation users are less satisfied
		}

		return Math.max(0, Math.min(100, satisfaction));
	}

	private getStrategyAccuracyScore(strategyId: string): number {
		// Return known accuracy scores for different strategies
		const strategyScores: Record<string, number> = {
			'client-side-hashing': 100,
			'basic-text': 90,
			'json-formatting': 95,
			'json-simplified': 85,
			'local-validation': 80,
			'code-validation': 75,
			'text-file': 85,
			'regex-processing': 70,
			'encoding-processing': 95,
			'json-validation': 60,
			'cached-result': 70,
			'manual-input': 40,
		};

		return strategyScores[strategyId] || 50;
	}

	private getStrategyReliabilityScore(strategyId: string): number {
		// Return known reliability scores for different strategies
		const reliabilityScores: Record<string, number> = {
			'client-side-hashing': 95,
			'basic-text': 90,
			'json-formatting': 95,
			'local-validation': 100,
			'text-file': 85,
			'encoding-processing': 90,
			'cached-result': 80,
		};

		return reliabilityScores[strategyId] || 70;
	}

	private storeAssessment(toolId: string, assessment: QualityAssessment): void {
		if (!this.assessmentHistory.has(toolId)) {
			this.assessmentHistory.set(toolId, []);
		}

		const history = this.assessmentHistory.get(toolId)!;
		history.push(assessment);

		// Keep only last 50 assessments to prevent memory issues
		if (history.length > 50) {
			this.assessmentHistory.set(toolId, history.slice(-50));
		}
	}

	private calculateHistoricalAverage(key: string, newScore: number): number {
		const existing = this.assessmentHistory.get(key);
		if (!existing || existing.length === 0) {
			return newScore;
		}

		const scores = existing.map(a => a.metrics.overallScore);
		scores.push(newScore);
		return scores.reduce((a, b) => a + b, 0) / scores.length;
	}

	private initializeBenchmarks(): void {
		// Initialize with some common tool benchmarks
		const commonBenchmarks = [
			{ toolId: 'json-formatter', operation: 'format', primaryScore: 100 },
			{ toolId: 'code-runner', operation: 'execute', primaryScore: 100 },
			{ toolId: 'text-encoder', operation: 'encode', primaryScore: 100 },
			{ toolId: 'file-converter', operation: 'convert', primaryScore: 100 },
		];

		commonBenchmarks.forEach(benchmark => {
			const key = `${benchmark.toolId}_${benchmark.operation}`;
			this.benchmarks.set(key, {
				...benchmark,
				fallbackScores: {},
				historicalAverage: benchmark.primaryScore,
			});
		});
	}
}

// ============================================================================
// User Feedback Manager
// ============================================================================

export class FallbackUserFeedbackManager {
	private static instance: FallbackUserFeedbackManager;
	private feedback: Map<string, UserFeedback[]> = new Map();
	private feedbackPrompts: Map<string, number> = new Map(); // Track last prompt time

	private constructor() {}

	public static getInstance(): FallbackUserFeedbackManager {
		if (!FallbackUserFeedbackManager.instance) {
			FallbackUserFeedbackManager.instance = new FallbackUserFeedbackManager();
		}
		return FallbackUserFeedbackManager.instance;
	}

	public async collectFeedback(
		sessionId: string,
		toolId: string,
		operation: string,
		result: FallbackResult,
		feedbackType: FeedbackType = 'automatic'
	): Promise<UserFeedback | null> {
		// Check if we should prompt for feedback
		if (feedbackType === 'prompted' && !this.shouldPromptForFeedback(sessionId, toolId)) {
			return null;
		}

		const feedback: UserFeedback = {
			id: this.generateFeedbackId(),
			sessionId,
			toolId,
			operation,
			fallbackResult: result,
			timestamp: new Date(),
			rating: await this.collectRating(result),
			feedbackType,
			context: await this.gatherFeedbackContext(sessionId),
		};

		this.storeFeedback(feedback);
		return feedback;
	}

	public async collectDetailedFeedback(
		sessionId: string,
		toolId: string,
		operation: string,
		result: FallbackResult,
		rating: UserRating,
		comments?: string,
		issues?: UserReportedIssue[],
		suggestions?: string[]
	): Promise<UserFeedback> {
		const feedback: UserFeedback = {
			id: this.generateFeedbackId(),
			sessionId,
			toolId,
			operation,
			fallbackResult: result,
			timestamp: new Date(),
			rating,
			feedbackType: 'voluntary',
			comments,
			issues: issues || [],
			suggestions: suggestions || [],
			context: await this.gatherFeedbackContext(sessionId),
		};

		this.storeFeedback(feedback);
		return feedback;
	}

	public getFeedback(toolId?: string): UserFeedback[] {
		if (toolId) {
			return Array.from(this.feedback.values())
				.flat()
				.filter(f => f.toolId === toolId);
		}

		return Array.from(this.feedback.values()).flat();
	}

	public getFeedbackAnalytics(toolId?: string): {
		totalFeedback: number;
		averageRating: number;
		satisfactionRate: number;
		commonIssues: Array<{ issue: string; count: number }>;
		recommendations: string[];
	} {
		const feedback = this.getFeedback(toolId);

		if (feedback.length === 0) {
			return {
				totalFeedback: 0,
				averageRating: 0,
				satisfactionRate: 0,
				commonIssues: [],
				recommendations: [],
			};
		}

		const totalFeedback = feedback.length;
		const averageRating = feedback.reduce((sum, f) => sum + f.rating.overall, 0) / totalFeedback;
		const satisfactionRate = feedback.filter(f => f.rating.overall >= 4).length / totalFeedback;

		// Extract common issues
		const issueCounts = new Map<string, number>();
		feedback.forEach(f => {
			f.issues.forEach(issue => {
				issueCounts.set(issue.type, (issueCounts.get(issue.type) || 0) + 1);
			});
		});

		const commonIssues = Array.from(issueCounts.entries())
			.map(([issue, count]) => ({ issue, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Extract recommendations
		const recommendations: string[] = [];
		feedback.forEach(f => {
			f.suggestions.forEach(suggestion => {
				if (!recommendations.includes(suggestion)) {
					recommendations.push(suggestion);
				}
			});
		});

		return {
			totalFeedback,
			averageRating,
			satisfactionRate,
			commonIssues,
			recommendations,
		};
	}

	private shouldPromptForFeedback(sessionId: string, toolId: string): boolean {
		const lastPrompt = this.feedbackPrompts.get(`${sessionId}_${toolId}`) || 0;
		const now = Date.now();
		const timeSinceLastPrompt = now - lastPrompt;

		// Don't prompt if less than 30 minutes have passed
		if (timeSinceLastPrompt < 30 * 60 * 1000) {
			return false;
		}

		// Don't prompt if user has given feedback recently for this tool
		const recentFeedback = this.getFeedback(toolId)
			.filter(f => f.sessionId === sessionId)
			.filter(f => now - f.timestamp.getTime() < 24 * 60 * 60 * 1000);

		if (recentFeedback.length >= 2) {
			return false;
		}

		return true;
	}

	private async collectRating(result: FallbackResult): Promise<UserRating> {
		// For automatic feedback, base rating on result quality
		const baseScore = result.metrics.userSatisfactionPrediction / 100 * 5;

		return {
			overall: Math.round(baseScore * 10) / 10,
			accuracy: Math.round((result.metrics.accuracy / 100) * 5 * 10) / 10,
			usability: Math.round((result.quality === 'full' ? 5 : result.quality === 'high' ? 4 : result.quality === 'medium' ? 3 : 2) * 10) / 10,
			speed: result.processingTime < 1000 ? 5 : result.processingTime < 3000 ? 4 : result.processingTime < 5000 ? 3 : 2,
			reliability: result.success ? (result.quality === 'full' ? 5 : result.quality === 'high' ? 4 : 3) : 1,
		};
	}

	private async gatherFeedbackContext(sessionId: string): Promise<FeedbackContext> {
		// This would be enhanced with actual session data in a real implementation
		return {
			deviceType: navigator.platform.includes('Mobile') ? 'mobile' : 'desktop',
			browser: navigator.userAgent.split(' ').slice(-2)[0],
			screenSize: `${window.screen.width}x${window.screen.height}`,
			sessionDuration: 0, // Would be calculated from actual session start
			previousFallbacks: 0, // Would be tracked per session
			userExpertise: 'intermediate', // Would be determined from user behavior
			taskComplexity: 'moderate', // Would be inferred from the tool operation
		};
	}

	private storeFeedback(feedback: UserFeedback): void {
		if (!this.feedback.has(feedback.toolId)) {
			this.feedback.set(feedback.toolId, []);
		}

		const toolFeedback = this.feedback.get(feedback.toolId)!;
		toolFeedback.push(feedback);

		// Update last prompt time if this was prompted feedback
		if (feedback.feedbackType === 'prompted') {
			this.feedbackPrompts.set(
				`${feedback.sessionId}_${feedback.toolId}`,
				Date.now()
			);
		}

		// Keep only last 100 feedback entries per tool
		if (toolFeedback.length > 100) {
			this.feedback.set(feedback.toolId, toolFeedback.slice(-100));
		}
	}

	private generateFeedbackId(): string {
		return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

export const qualityAssessment = FallbackQualityAssessment.getInstance();
export const userFeedbackManager = FallbackUserFeedbackManager.getInstance();
