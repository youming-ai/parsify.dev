/**
 * Historical Performance Analyzer - T167 Implementation
 * Advanced historical data analysis with trend detection, pattern recognition, and forecasting
 * Provides insights into performance evolution and predictive analytics
 */

import { performanceObserver } from './performance-observer';
import { performanceBenchmarkingFramework } from './performance-benchmarking-framework';
import { realtimePerformanceMonitor } from './realtime-performance-monitor';
import type { PerformanceMetrics, TaskPerformance } from './performance-observer';
import type { BenchmarkResult, PerformanceBenchmark } from './performance-benchmarking-framework';
import type { RealtimeMetrics } from './realtime-performance-monitor';

// Historical analysis interfaces
export interface HistoricalAnalysisConfig {
	// Data retention
	retentionPeriod: number; // days
	maxDataPoints: number;

	// Analysis settings
	trendAnalysisWindow: number; // data points
	seasonalityDetection: boolean;
	anomalyDetection: boolean;

	// Forecasting
	enableForecasting: boolean;
	forecastHorizon: number; // days
	confidenceLevel: number; // 0-1

	// Pattern recognition
	enablePatternRecognition: boolean;
	minPatternLength: number;
	patternSimilarityThreshold: number;

	// Comparison baselines
	comparisonPeriods: ComparisonPeriod[];
}

export interface ComparisonPeriod {
	id: string;
	name: string;
	startDate: Date;
	endDate: Date;
	description: string;
	type: 'release' | 'campaign' | 'seasonal' | 'custom';
}

export interface HistoricalDataPoint {
	timestamp: Date;
	sessionId: string;
	metrics: PerformanceMetrics;
	benchmarks: Record<string, BenchmarkResult>;
	realtimeMetrics: RealtimeMetrics;
	events: HistoricalEvent[];
}

export interface HistoricalEvent {
	id: string;
	timestamp: Date;
	type: 'deployment' | 'configuration_change' | 'traffic_spike' | 'outage' | 'feature_release';
	description: string;
	impact: {
		duration: number; // minutes
		affectedMetrics: string[];
		severity: 'low' | 'medium' | 'high' | 'critical';
	};
	metadata: Record<string, any>;
}

export interface TrendAnalysis {
	metric: string;
	trend: 'strongly_improving' | 'improving' | 'stable' | 'declining' | 'strongly_declining';
	direction: number; // -1 to 1
	confidence: number; // 0-1
	changeRate: number; // units per time period
	significance: 'significant' | 'moderate' | 'minimal';
	seasonality: SeasonalityPattern | null;
	prediction: TrendPrediction;
}

export interface SeasonalityPattern {
	type: 'daily' | 'weekly' | 'monthly' | 'yearly';
	strength: number; // 0-1
	peakTimes: Date[];
	valleyTimes: Date[];
	amplitude: number;
}

export interface TrendPrediction {
	predictedValue: number;
	confidenceInterval: {
		lower: number;
		upper: number;
	};
	accuracy: number; // 0-1
	timeframe: string;
	method: 'linear' | 'exponential' | 'seasonal' | 'machine_learning';
}

export interface PatternRecognition {
	pattern: PerformancePattern;
	frequency: number;
	lastSeen: Date;
	duration: number;
	impact: PatternImpact;
}

export interface PerformancePattern {
	id: string;
	name: string;
	description: string;
	conditions: PatternCondition[];
	expectedBehavior: string;
	severity: 'info' | 'warning' | 'critical';
}

export interface PatternCondition {
	metric: string;
	operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
	value: number;
	duration: number; // minutes
}

export interface PatternImpact {
	metricsAffected: string[];
	performanceImpact: number; // -1 to 1
	userExperienceImpact: number; // -1 to 1
	businessImpact: number; // -1 to 1
}

export interface PerformanceForecast {
	metric: string;
	timeframe: string;
	predictions: ForecastPoint[];
	confidence: number;
	accuracy: number;
	methodology: string;
	assumptions: string[];
}

export interface ForecastPoint {
	timestamp: Date;
	predictedValue: number;
	confidenceInterval: {
		lower: number;
		upper: number;
	};
	probability: number;
}

export interface HistoricalInsights {
	summary: AnalysisSummary;
	trends: TrendAnalysis[];
	patterns: PatternRecognition[];
	forecasts: PerformanceForecast[];
	anomalies: HistoricalAnomaly[];
	comparisons: ComparisonAnalysis[];
	recommendations: HistoricalRecommendation[];
}

export interface AnalysisSummary {
	timeframe: {
		start: Date;
		end: Date;
		duration: number;
	};
	dataPoints: number;
	overallPerformance: {
		currentScore: number;
		previousScore: number;
		change: number;
		changePercent: number;
	};
	keyMetrics: {
		bestPerforming: string[];
		worstPerforming: string[];
		mostImproved: string[];
		mostDegraded: string[];
	};
	significantEvents: HistoricalEvent[];
}

export interface HistoricalAnomaly {
	id: string;
	timestamp: Date;
	metric: string;
	type: 'spike' | 'drop' | 'trend_change' | 'pattern_break';
	magnitude: number;
	duration: number;
	context: AnomalyContext;
	resolution?: string;
	impactAssessment: AnomalyImpact;
}

export interface AnomalyContext {
	precedingConditions: Record<string, number>;
	concurrentEvents: HistoricalEvent[];
	followingBehavior: Record<string, number>;
	historicalFrequency: number;
}

export interface AnomalyImpact {
	performanceScore: number;
	userExperience: number;
	businessMetrics: number;
	duration: number;
	affectedUsers: number;
}

export interface ComparisonAnalysis {
	period: ComparisonPeriod;
	baselineMetrics: Record<string, number>;
	currentMetrics: Record<string, number>;
	comparisons: MetricComparison[];
	summary: ComparisonSummary;
}

export interface MetricComparison {
	metric: string;
	baselineValue: number;
	currentValue: number;
	change: number;
	changePercent: number;
	significance: 'significant' | 'moderate' | 'minimal';
	factors: string[];
}

export interface ComparisonSummary {
	overallImprovement: number;
	significantImprovements: string[];
	significantRegressions: string[];
	unchangedMetrics: string[];
	primaryDrivers: string[];
}

export interface HistoricalRecommendation {
	id: string;
	priority: 'critical' | 'high' | 'medium' | 'low';
	category: 'performance' | 'reliability' | 'user_experience' | 'business';
	title: string;
	description: string;
	rationale: string;
	evidence: EvidencePoint[];
	implementation: ImplementationPlan;
	expectedOutcome: ExpectedOutcome;
}

export interface EvidencePoint {
	type: 'trend' | 'anomaly' | 'comparison' | 'pattern';
	description: string;
	data: any;
	weight: number; // 0-1
}

export interface ImplementationPlan {
	difficulty: 'easy' | 'moderate' | 'complex';
	timeframe: string;
	resources: string[];
	prerequisites: string[];
	steps: string[];
}

export interface ExpectedOutcome {
	performanceImpact: number;
	businessImpact: string;
	successMetrics: string[];
	measurementPeriod: string;
}

export class HistoricalPerformanceAnalyzer {
	private static instance: HistoricalPerformanceAnalyzer;
	private config: HistoricalAnalysisConfig;
	private historicalData: HistoricalDataPoint[] = [];
	private events: HistoricalEvent[] = [];
	private analysisCache: Map<string, HistoricalInsights> = new Map();
	private patterns: PerformancePattern[] = [];
	private isAnalyzing: boolean = false;
	private analysisCallbacks: Set<(insights: HistoricalInsights) => void> = new Set();

	private constructor() {
		this.config = this.getDefaultConfig();
		this.initializeDefaultPatterns();
		this.startPeriodicAnalysis();
	}

	public static getInstance(): HistoricalPerformanceAnalyzer {
		if (!HistoricalPerformanceAnalyzer.instance) {
			HistoricalPerformanceAnalyzer.instance = new HistoricalPerformanceAnalyzer();
		}
		return HistoricalPerformanceAnalyzer.instance;
	}

	// Get default configuration
	private getDefaultConfig(): HistoricalAnalysisConfig {
		return {
			retentionPeriod: 365, // 1 year
			maxDataPoints: 10000,
			trendAnalysisWindow: 30, // 30 data points
			seasonalityDetection: true,
			anomalyDetection: true,
			enableForecasting: true,
			forecastHorizon: 30, // 30 days
			confidenceLevel: 0.95,
			enablePatternRecognition: true,
			minPatternLength: 5,
			patternSimilarityThreshold: 0.8,
			comparisonPeriods: [
				{
					id: 'last_week',
					name: 'Last Week',
					startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					endDate: new Date(),
					description: 'Previous 7 days',
					type: 'custom',
				},
				{
					id: 'last_month',
					name: 'Last Month',
					startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					endDate: new Date(),
					description: 'Previous 30 days',
					type: 'custom',
				},
			],
		};
	}

	// Initialize default patterns
	private initializeDefaultPatterns(): void {
		this.patterns = [
			{
				id: 'slow_morning_performance',
				name: 'Slow Morning Performance',
				description: 'Performance degradation during morning hours',
				conditions: [
					{ metric: 'lcp', operator: 'gt', value: 3000, duration: 60 },
					{ metric: 'task_completion_time', operator: 'gt', value: 6000, duration: 60 },
				],
				expectedBehavior: 'Higher response times between 8-10 AM',
				severity: 'warning',
			},
			{
				id: 'weekend_performance_boost',
				name: 'Weekend Performance Boost',
				description: 'Improved performance during weekends',
				conditions: [
					{ metric: 'lcp', operator: 'lt', value: 2000, duration: 480 },
					{ metric: 'task_success_rate', operator: 'gt', value: 0.97, duration: 480 },
				],
				expectedBehavior: 'Better performance on weekends due to lower load',
				severity: 'info',
			},
			{
				id: 'high_traffic_slowdown',
				name: 'High Traffic Slowdown',
				description: 'Performance degradation during high traffic periods',
				conditions: [
					{ metric: 'active_sessions', operator: 'gt', value: 1000, duration: 30 },
					{ metric: 'average_response_time', operator: 'gt', value: 3000, duration: 30 },
				],
				expectedBehavior: 'Slower response times under high load',
				severity: 'warning',
			},
		];
	}

	// Start periodic analysis
	private startPeriodicAnalysis(): void {
		// Run analysis every hour
		setInterval(() => {
			if (!this.isAnalyzing) {
				this.performAnalysis().catch(console.error);
			}
		}, 60 * 60 * 1000);

		// Initial analysis
		this.performAnalysis().catch(console.error);
	}

	// Collect historical data
	public async collectDataPoint(): Promise<void> {
		try {
			const timestamp = new Date();
			const sessionId = `historical_${timestamp.getTime()}`;

			// Get current metrics from all sources
			const metrics = performanceObserver.getMetrics();
			const taskHistory = performanceObserver.getTaskHistory();
			const realtimeState = realtimePerformanceMonitor.getState();
			const benchmarks = this.getCurrentBenchmarks();

			// Create historical data point
			const dataPoint: HistoricalDataPoint = {
				timestamp,
				sessionId,
				metrics,
				benchmarks,
				realtimeMetrics: realtimeState.currentMetrics || this.getDefaultRealtimeMetrics(),
				events: this.getRecentEvents(timestamp),
			};

			// Add to historical data
			this.historicalData.push(dataPoint);

			// Enforce retention policies
			this.enforceRetentionPolicies();

			// Check for patterns
			if (this.config.enablePatternRecognition) {
				this.checkForPatterns(dataPoint);
			}
		} catch (error) {
			console.error('Failed to collect historical data point:', error);
		}
	}

	// Get current benchmarks
	private getCurrentBenchmarks(): Record<string, BenchmarkResult> {
		const benchmarks: Record<string, BenchmarkResult> = {};
		const frameworkBenchmarks = performanceBenchmarkingFramework.getBenchmarks();

		for (const [categoryId, data] of frameworkBenchmarks) {
			benchmarks[categoryId] = data.current;
		}

		return benchmarks;
	}

	// Get default realtime metrics
	private getDefaultRealtimeMetrics(): RealtimeMetrics {
		return {
			timestamp: new Date(),
			sessionId: 'default',
			coreWebVitals: {
				lcp: 0,
				fid: 0,
				cls: 0,
				fcp: 0,
				ttfb: 0,
			},
			runtime: {
				memoryUsage: 0,
				cpuUsage: 0,
				taskCompletionTime: 0,
				taskSuccessRate: 0,
				activeTasks: 0,
			},
			network: {
				requestCount: 0,
				totalTransferSize: 0,
				averageResponseTime: 0,
				errorRate: 0,
			},
			interactions: {
				totalInteractions: 0,
				averageResponseTime: 0,
				bounceRate: 0,
				satisfactionScore: 0,
			},
			platform: {
				toolPerformance: 0,
				conversionRate: 0,
				featureUsage: {},
			},
		};
	}

	// Get recent events
	private getRecentEvents(timestamp: Date): HistoricalEvent[] {
		const recentTime = timestamp.getTime() - (24 * 60 * 60 * 1000); // Last 24 hours
		return this.events.filter(event => event.timestamp.getTime() > recentTime);
	}

	// Enforce retention policies
	private enforceRetentionPolicies(): void {
		// Sort by timestamp
		this.historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		// Remove old data points
		const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
		this.historicalData = this.historicalData.filter(point => point.timestamp > cutoffDate);

		// Limit total data points
		if (this.historicalData.length > this.config.maxDataPoints) {
			this.historicalData = this.historicalData.slice(-this.config.maxDataPoints);
		}

		// Clean old events
		this.events = this.events.filter(event => event.timestamp > cutoffDate);
	}

	// Check for patterns
	private checkForPatterns(dataPoint: HistoricalDataPoint): void {
		for (const pattern of this.patterns) {
			if (this.matchesPattern(dataPoint, pattern)) {
				// Record pattern occurrence
				this.recordPatternOccurrence(pattern, dataPoint);
			}
		}
	}

	// Check if data point matches pattern
	private matchesPattern(dataPoint: HistoricalDataPoint, pattern: PerformancePattern): boolean {
		for (const condition of pattern.conditions) {
			const value = this.getMetricValue(dataPoint, condition.metric);
			if (value === null) continue;

			let matches = false;
			switch (condition.operator) {
				case 'gt': matches = value > condition.value; break;
				case 'gte': matches = value >= condition.value; break;
				case 'lt': matches = value < condition.value; break;
				case 'lte': matches = value <= condition.value; break;
				case 'eq': matches = Math.abs(value - condition.value) < 0.001; break;
			}

			if (!matches) return false;
		}

		return true;
	}

	// Get metric value from data point
	private getMetricValue(dataPoint: HistoricalDataPoint, metricName: string): number | null {
		// Map metric names to actual values
		switch (metricName) {
			case 'lcp':
				return dataPoint.metrics.largestContentfulPaint;
			case 'task_completion_time':
				return dataPoint.metrics.taskCompletionTime;
			case 'task_success_rate':
				return dataPoint.metrics.taskSuccessRate;
			case 'active_sessions':
				return dataPoint.realtimeMetrics.interactions.totalInteractions;
			case 'average_response_time':
				return dataPoint.metrics.averageResponseTime;
			default:
				return null;
		}
	}

	// Record pattern occurrence
	private recordPatternOccurrence(pattern: PerformancePattern, dataPoint: HistoricalDataPoint): void {
		// This would update pattern statistics and potentially trigger alerts
		console.log(`Pattern detected: ${pattern.name} at ${dataPoint.timestamp.toISOString()}`);
	}

	// Perform comprehensive analysis
	public async performAnalysis(): Promise<HistoricalInsights> {
		if (this.isAnalyzing || this.historicalData.length < 10) {
			return this.getEmptyInsights();
		}

		this.isAnalyzing = true;

		try {
			const cacheKey = this.generateCacheKey();

			// Check cache
			if (this.analysisCache.has(cacheKey)) {
				return this.analysisCache.get(cacheKey)!;
			}

			// Generate analysis
			const insights: HistoricalInsights = {
				summary: this.generateAnalysisSummary(),
				trends: await this.analyzeTrends(),
				patterns: await this.recognizePatterns(),
				forecasts: this.config.enableForecasting ? await this.generateForecasts() : [],
				anomalies: this.config.anomalyDetection ? await this.detectAnomalies() : [],
				comparisons: await this.performComparisons(),
				recommendations: await this.generateRecommendations(),
			};

			// Cache results
			this.analysisCache.set(cacheKey, insights);

			// Notify callbacks
			this.analysisCallbacks.forEach(callback => callback(insights));

			return insights;
		} finally {
			this.isAnalyzing = false;
		}
	}

	// Generate analysis summary
	private generateAnalysisSummary(): AnalysisSummary {
		if (this.historicalData.length === 0) {
			return this.getDefaultSummary();
		}

		const sortedData = [...this.historicalData].sort((a, b) =>
			a.timestamp.getTime() - b.timestamp.getTime()
		);

		const latestData = sortedData[sortedData.length - 1];
		const previousData = sortedData[Math.max(0, sortedData.length - 2)];

		const currentScore = this.calculateOverallScore(latestData);
		const previousScore = this.calculateOverallScore(previousData);
		const change = currentScore - previousScore;
		const changePercent = previousScore !== 0 ? (change / previousScore) * 100 : 0;

		return {
			timeframe: {
				start: sortedData[0].timestamp,
				end: sortedData[sortedData.length - 1].timestamp,
				duration: sortedData[sortedData.length - 1].timestamp.getTime() - sortedData[0].timestamp.getTime(),
			},
			dataPoints: sortedData.length,
			overallPerformance: {
				currentScore,
				previousScore,
				change,
				changePercent,
			},
			keyMetrics: this.identifyKeyMetrics(sortedData),
			significantEvents: this.getSignificantEvents(),
		};
	}

	// Get default summary
	private getDefaultSummary(): AnalysisSummary {
		const now = new Date();
		return {
			timeframe: {
				start: now,
				end: now,
				duration: 0,
			},
			dataPoints: 0,
			overallPerformance: {
				currentScore: 0,
				previousScore: 0,
				change: 0,
				changePercent: 0,
			},
			keyMetrics: {
				bestPerforming: [],
				worstPerforming: [],
				mostImproved: [],
				mostDegraded: [],
			},
			significantEvents: [],
		};
	}

	// Calculate overall performance score
	private calculateOverallScore(dataPoint: HistoricalDataPoint): number {
		const metrics = dataPoint.metrics;

		// Weight different metrics
		const weights = {
			taskSuccessRate: 0.3,
			pageLoadTime: 0.2,
			taskCompletionTime: 0.2,
			errorRate: 0.15,
			largestContentfulPaint: 0.1,
			firstInputDelay: 0.05,
		};

		let score = 0;
		let totalWeight = 0;

		// Success rate (higher is better)
		if (metrics.taskSuccessRate > 0) {
			score += metrics.taskSuccessRate * weights.taskSuccessRate * 100;
			totalWeight += weights.taskSuccessRate;
		}

		// Response times (lower is better)
		const responseTimeScore = Math.max(0, 1 - (metrics.pageLoadTime / 5000)) * 100;
		score += responseTimeScore * weights.pageLoadTime;
		totalWeight += weights.pageLoadTime;

		const taskTimeScore = Math.max(0, 1 - (metrics.taskCompletionTime / 10000)) * 100;
		score += taskTimeScore * weights.taskCompletionTime;
		totalWeight += weights.taskCompletionTime;

		// Error rate (lower is better)
		const errorScore = Math.max(0, 1 - (metrics.errorRate / 0.2)) * 100;
		score += errorScore * weights.errorRate;
		totalWeight += weights.errorRate;

		return totalWeight > 0 ? score / totalWeight : 0;
	}

	// Identify key metrics
	private identifyKeyMetrics(sortedData: HistoricalDataPoint[]): AnalysisSummary['keyMetrics'] {
		if (sortedData.length < 2) {
			return {
				bestPerforming: [],
				worstPerforming: [],
				mostImproved: [],
				mostDegraded: [],
			};
		}

		const metricAnalysis = this.analyzeAllMetrics(sortedData);

		return {
			bestPerforming: metricAnalysis
				.filter(m => m.currentPerformance > 80)
				.sort((a, b) => b.currentPerformance - a.currentPerformance)
				.slice(0, 3)
				.map(m => m.name),

			worstPerforming: metricAnalysis
				.filter(m => m.currentPerformance < 60)
				.sort((a, b) => a.currentPerformance - b.currentPerformance)
				.slice(0, 3)
				.map(m => m.name),

			mostImproved: metricAnalysis
				.filter(m => m.changePercent > 10)
				.sort((a, b) => b.changePercent - a.changePercent)
				.slice(0, 3)
				.map(m => m.name),

			mostDegraded: metricAnalysis
				.filter(m => m.changePercent < -10)
				.sort((a, b) => a.changePercent - b.changePercent)
				.slice(0, 3)
				.map(m => m.name),
		};
	}

	// Analyze all metrics
	private analyzeAllMetrics(sortedData: HistoricalDataPoint[]): Array<{
		name: string;
		currentPerformance: number;
		changePercent: number;
	}> {
		const latest = sortedData[sortedData.length - 1];
		const previous = sortedData[0];

		return [
			{
				name: 'Task Success Rate',
				currentPerformance: latest.metrics.taskSuccessRate * 100,
				changePercent: ((latest.metrics.taskSuccessRate - previous.metrics.taskSuccessRate) / previous.metrics.taskSuccessRate) * 100,
			},
			{
				name: 'Page Load Time',
				currentPerformance: Math.max(0, 100 - (latest.metrics.pageLoadTime / 50)),
				changePercent: ((previous.metrics.pageLoadTime - latest.metrics.pageLoadTime) / previous.metrics.pageLoadTime) * 100,
			},
			{
				name: 'Task Completion Time',
				currentPerformance: Math.max(0, 100 - (latest.metrics.taskCompletionTime / 100)),
				changePercent: ((previous.metrics.taskCompletionTime - latest.metrics.taskCompletionTime) / previous.metrics.taskCompletionTime) * 100,
			},
			{
				name: 'Error Rate',
				currentPerformance: Math.max(0, 100 - (latest.metrics.errorRate * 1000)),
				changePercent: ((previous.metrics.errorRate - latest.metrics.errorRate) / previous.metrics.errorRate) * 100,
			},
		];
	}

	// Get significant events
	private getSignificantEvents(): HistoricalEvent[] {
		return this.events.filter(event =>
			event.impact.severity === 'high' || event.impact.severity === 'critical'
		);
	}

	// Analyze trends
	private async analyzeTrends(): Promise<TrendAnalysis[]> {
		const trends: TrendAnalysis[] = [];

		// Key metrics to analyze
		const metrics = [
			'lcp', 'fid', 'cls', 'task_completion_time',
			'task_success_rate', 'error_rate', 'page_load_time'
		];

		for (const metric of metrics) {
			const trend = await this.analyzeMetricTrend(metric);
			if (trend) {
				trends.push(trend);
			}
		}

		return trends;
	}

	// Analyze specific metric trend
	private async analyzeMetricTrend(metricName: string): Promise<TrendAnalysis | null> {
		const values = this.extractMetricValues(metricName);
		if (values.length < this.config.trendAnalysisWindow) {
			return null;
		}

		const trend = this.calculateTrend(values);
		const seasonality = this.config.seasonalityDetection
			? this.detectSeasonality(values)
			: null;
		const prediction = await this.generateTrendPrediction(metricName, values, trend, seasonality);

		return {
			metric: metricName,
			trend: this.classifyTrend(trend),
			direction: trend.direction,
			confidence: trend.confidence,
			changeRate: trend.changeRate,
			significance: this.assessSignificance(trend),
			seasonality,
			prediction,
		};
	}

	// Extract metric values from historical data
	private extractMetricValues(metricName: string): number[] {
		return this.historicalData.map(point => {
			switch (metricName) {
				case 'lcp': return point.metrics.largestContentfulPaint;
				case 'fid': return point.metrics.firstInputDelay;
				case 'cls': return point.metrics.cumulativeLayoutShift;
				case 'task_completion_time': return point.metrics.taskCompletionTime;
				case 'task_success_rate': return point.metrics.taskSuccessRate;
				case 'error_rate': return point.metrics.errorRate;
				case 'page_load_time': return point.metrics.pageLoadTime;
				default: return 0;
			}
		}).filter(value => value !== null && !isNaN(value));
	}

	// Calculate trend from values
	private calculateTrend(values: number[]): {
		direction: number;
		confidence: number;
		changeRate: number;
	} {
		if (values.length < 2) {
			return { direction: 0, confidence: 0, changeRate: 0 };
		}

		// Linear regression to calculate trend
		const n = values.length;
		const x = Array.from({ length: n }, (_, i) => i);
		const y = values;

		const sumX = x.reduce((sum, val) => sum + val, 0);
		const sumY = y.reduce((sum, val) => sum + val, 0);
		const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
		const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;

		// Calculate confidence (R-squared)
		const yMean = sumY / n;
		const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
		const residualSumSquares = y.reduce((sum, val, i) => {
			const predicted = slope * i + intercept;
			return sum + Math.pow(val - predicted, 2);
		}, 0);

		const rSquared = 1 - (residualSumSquares / totalSumSquares);
		const confidence = Math.max(0, Math.min(1, rSquared));

		// Normalize direction (-1 to 1)
		const avgValue = sumY / n;
		const normalizedSlope = slope / (avgValue || 1);
		const direction = Math.max(-1, Math.min(1, -normalizedSlope));

		return {
			direction,
			confidence,
			changeRate: slope,
		};
	}

	// Classify trend
	private classifyTrend(trend: { direction: number; confidence: number }): TrendAnalysis['trend'] {
		const { direction, confidence } = trend;

		if (confidence < 0.3) {
			return 'stable';
		}

		if (direction > 0.3) {
			return direction > 0.7 ? 'strongly_declining' : 'declining';
		} else if (direction < -0.3) {
			return direction < -0.7 ? 'strongly_improving' : 'improving';
		} else {
			return 'stable';
		}
	}

	// Assess trend significance
	private assessSignificance(trend: { direction: number; confidence: number }): 'significant' | 'moderate' | 'minimal' {
		const { direction, confidence } = trend;

		const impact = Math.abs(direction) * confidence;

		if (impact > 0.5) return 'significant';
		if (impact > 0.2) return 'moderate';
		return 'minimal';
	}

	// Detect seasonality
	private detectSeasonality(values: number[]): SeasonalityPattern | null {
		// Simplified seasonality detection
		// In production, this would use more sophisticated time series analysis

		const weeklyPattern = this.detectWeeklyPattern(values);
		if (weeklyPattern.strength > 0.3) {
			return weeklyPattern;
		}

		const dailyPattern = this.detectDailyPattern(values);
		if (dailyPattern.strength > 0.3) {
			return dailyPattern;
		}

		return null;
	}

	// Detect weekly pattern
	private detectWeeklyPattern(values: number[]): SeasonalityPattern {
		// Group by day of week
		const dayOfWeekSums = Array(7).fill(0);
		const dayOfWeekCounts = Array(7).fill(0);

		// Assuming data points are collected hourly
		values.forEach((value, index) => {
			const dayOfWeek = index % 7;
			dayOfWeekSums[dayOfWeek] += value;
			dayOfWeekCounts[dayOfWeek]++;
		});

		const dayOfWeekAverages = dayOfWeekSums.map((sum, i) =>
			dayOfWeekCounts[i] > 0 ? sum / dayOfWeekCounts[i] : 0
		);

		const overallAverage = values.reduce((sum, val) => sum + val, 0) / values.length;
		const variance = dayOfWeekAverages.reduce((sum, avg) =>
			sum + Math.pow(avg - overallAverage, 2), 0
		) / 7;

		const strength = Math.min(1, variance / (overallAverage || 1));

		const maxDay = dayOfWeekAverages.indexOf(Math.max(...dayOfWeekAverages));
		const minDay = dayOfWeekAverages.indexOf(Math.min(...dayOfWeekAverages));

		return {
			type: 'weekly',
			strength,
			peakTimes: [new Date()], // Would be actual dates
			valleyTimes: [new Date()], // Would be actual dates
			amplitude: (Math.max(...dayOfWeekAverages) - Math.min(...dayOfWeekAverages)) / overallAverage,
		};
	}

	// Detect daily pattern
	private detectDailyPattern(values: number[]): SeasonalityPattern {
		// Similar to weekly but for daily patterns
		// This is a simplified implementation
		return {
			type: 'daily',
			strength: 0.2,
			peakTimes: [],
			valleyTimes: [],
			amplitude: 0.1,
		};
	}

	// Generate trend prediction
	private async generateTrendPrediction(
		metricName: string,
		values: number[],
		trend: any,
		seasonality: SeasonalityPattern | null
	): Promise<TrendPrediction> {
		const lastValue = values[values.length - 1];
		const predictedValue = lastValue + (trend.changeRate * this.config.forecastHorizon);

		const confidence = this.calculatePredictionConfidence(trend, values.length);

		return {
			predictedValue,
			confidenceInterval: {
				lower: predictedValue * (1 - confidence * 0.2),
				upper: predictedValue * (1 + confidence * 0.2),
			},
			accuracy: confidence,
			timeframe: `${this.config.forecastHorizon} days`,
			method: seasonality ? 'seasonal' : 'linear',
		};
	}

	// Calculate prediction confidence
	private calculatePredictionConfidence(trend: any, dataPoints: number): number {
		// Base confidence from trend confidence
		let confidence = trend.confidence;

		// Adjust based on data volume
		if (dataPoints < 20) {
			confidence *= 0.7;
		} else if (dataPoints < 50) {
			confidence *= 0.85;
		}

		// Adjust based on trend strength
		if (Math.abs(trend.direction) < 0.1) {
			confidence *= 0.8;
		}

		return Math.min(1, Math.max(0, confidence));
	}

	// Recognize patterns
	private async recognizePatterns(): Promise<PatternRecognition[]> {
		if (!this.config.enablePatternRecognition) {
			return [];
		}

		const recognizedPatterns: PatternRecognition[] = [];

		for (const pattern of this.patterns) {
			const occurrences = this.findPatternOccurrences(pattern);

			if (occurrences.length >= this.config.minPatternLength) {
				recognizedPatterns.push({
					pattern,
					frequency: occurrences.length,
					lastSeen: occurrences[occurrences.length - 1].timestamp,
					duration: this.calculatePatternDuration(occurrences),
					impact: this.assessPatternImpact(pattern, occurrences),
				});
			}
		}

		return recognizedPatterns;
	}

	// Find pattern occurrences
	private findPatternOccurrences(pattern: PerformancePattern): Array<{ timestamp: Date; dataPoint: HistoricalDataPoint }> {
		const occurrences: Array<{ timestamp: Date; dataPoint: HistoricalDataPoint }> = [];

		for (const dataPoint of this.historicalData) {
			if (this.matchesPattern(dataPoint, pattern)) {
				occurrences.push({
					timestamp: dataPoint.timestamp,
					dataPoint,
				});
			}
		}

		return occurrences;
	}

	// Calculate pattern duration
	private calculatePatternDuration(occurrences: Array<{ timestamp: Date }>): number {
		if (occurrences.length === 0) return 0;

		const first = occurrences[0].timestamp;
		const last = occurrences[occurrences.length - 1].timestamp;

		return (last.getTime() - first.getTime()) / (1000 * 60); // minutes
	}

	// Assess pattern impact
	private assessPatternImpact(pattern: PerformancePattern, occurrences: Array<{ dataPoint: HistoricalDataPoint }>): PatternImpact {
		if (occurrences.length === 0) {
			return {
				metricsAffected: [],
				performanceImpact: 0,
				userExperienceImpact: 0,
				businessImpact: 0,
			};
		}

		const affectedMetrics = pattern.conditions.map(c => c.metric);
		const severityImpact = pattern.severity === 'critical' ? -1 :
							  pattern.severity === 'warning' ? -0.5 : -0.2;

		return {
			metricsAffected: affectedMetrics,
			performanceImpact: severityImpact,
			userExperienceImpact: severityImpact * 0.8,
			businessImpact: severityImpact * 0.6,
		};
	}

	// Generate forecasts
	private async generateForecasts(): Promise<PerformanceForecast[]> {
		const forecasts: PerformanceForecast[] = [];

		const metrics = ['lcp', 'fid', 'cls', 'task_completion_time', 'error_rate'];

		for (const metric of metrics) {
			const forecast = await this.generateMetricForecast(metric);
			if (forecast) {
				forecasts.push(forecast);
			}
		}

		return forecasts;
	}

	// Generate forecast for specific metric
	private async generateMetricForecast(metricName: string): Promise<PerformanceForecast | null> {
		const values = this.extractMetricValues(metricName);
		if (values.length < 20) {
			return null;
		}

		const trend = this.calculateTrend(values);
		const predictionPoints = this.generateForecastPoints(values, trend);

		return {
			metric: metricName,
			timeframe: `${this.config.forecastHorizon} days`,
			predictions: predictionPoints,
			confidence: trend.confidence,
			accuracy: this.calculatePredictionConfidence(trend, values.length),
			methodology: 'linear_regression',
			assumptions: [
				'Historical trends will continue',
				'No major external factors will change',
				'Seasonal patterns remain consistent',
			],
		};
	}

	// Generate forecast points
	private generateForecastPoints(values: number[], trend: any): ForecastPoint[] {
		const points: ForecastPoint[] = [];
		const lastValue = values[values.length - 1];
		const now = new Date();

		for (let i = 1; i <= this.config.forecastHorizon; i++) {
			const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
			const predictedValue = lastValue + (trend.changeRate * i);
			const confidence = this.calculatePredictionConfidence(trend, values.length) * (1 - i / this.config.forecastHorizon);

			points.push({
				timestamp: futureDate,
				predictedValue,
				confidenceInterval: {
					lower: predictedValue * (1 - confidence * 0.2),
					upper: predictedValue * (1 + confidence * 0.2),
				},
				probability: confidence,
			});
		}

		return points;
	}

	// Detect anomalies
	private async detectAnomalies(): Promise<HistoricalAnomaly[]> {
		const anomalies: HistoricalAnomaly[] = [];

		const metrics = ['lcp', 'fid', 'cls', 'task_completion_time', 'error_rate'];

		for (const metric of metrics) {
			const metricAnomalies = await this.detectMetricAnomalies(metric);
			anomalies.push(...metricAnomalies);
		}

		return anomalies;
	}

	// Detect anomalies for specific metric
	private async detectMetricAnomalies(metricName: string): Promise<HistoricalAnomaly[]> {
		const values = this.extractMetricValues(metricName);
		const anomalies: HistoricalAnomaly[] = [];

		if (values.length < 10) {
			return anomalies;
		}

		// Use statistical approach for anomaly detection
		const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
		const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
		const standardDeviation = Math.sqrt(variance);
		const threshold = 2 * standardDeviation;

		values.forEach((value, index) => {
			const deviation = Math.abs(value - mean);
			if (deviation > threshold) {
				const dataPoint = this.historicalData[index];
				const anomalyType = value > mean + threshold ? 'spike' : 'drop';

				anomalies.push({
					id: `anomaly_${metricName}_${index}`,
					timestamp: dataPoint.timestamp,
					metric: metricName,
					type: anomalyType,
					magnitude: deviation / standardDeviation,
					duration: 1, // Could be calculated from consecutive anomalies
					context: this.getAnomalyContext(dataPoint, index, metricName),
					impactAssessment: this.assessAnomalyImpact(metricName, deviation, dataPoint),
				});
			}
		});

		return anomalies;
	}

	// Get anomaly context
	private getAnomalyContext(dataPoint: HistoricalDataPoint, index: number, metricName: string): AnomalyContext {
		const precedingCount = Math.min(5, index);
		const followingCount = Math.min(5, this.historicalData.length - index - 1);

		const precedingConditions: Record<string, number> = {};
		const followingBehavior: Record<string, number> = {};

		// Extract preceding and following metrics for context
		for (let i = index - precedingCount; i < index; i++) {
			if (i >= 0) {
				const point = this.historicalData[i];
				precedingConditions['lcp'] = point.metrics.largestContentfulPaint;
				precedingConditions['task_completion_time'] = point.metrics.taskCompletionTime;
				break; // Simplified - would collect from multiple points
			}
		}

		for (let i = index + 1; i <= index + followingCount; i++) {
			if (i < this.historicalData.length) {
				const point = this.historicalData[i];
				followingBehavior['lcp'] = point.metrics.largestContentfulPaint;
				followingBehavior['task_completion_time'] = point.metrics.taskCompletionTime;
				break; // Simplified - would collect from multiple points
			}
		}

		return {
			precedingConditions,
			concurrentEvents: dataPoint.events,
			followingBehavior,
			historicalFrequency: this.calculateHistoricalFrequency(metricName),
		};
	}

	// Calculate historical frequency
	private calculateHistoricalFrequency(metricName: string): number {
		// Count how many times this metric has been anomalous
		const totalAnomalies = this.events.filter(event =>
			event.type === 'anomaly' && event.description.includes(metricName)
		).length;

		return totalAnomalies / Math.max(1, this.historicalData.length);
	}

	// Assess anomaly impact
	private assessAnomalyImpact(metricName: string, magnitude: number, dataPoint: HistoricalDataPoint): AnomalyImpact {
		const severity = magnitude > 3 ? 'critical' : magnitude > 2 ? 'high' : 'medium';

		// Estimate impact based on metric type and severity
		const performanceScore = Math.max(0, 100 - (magnitude * 20));
		const userExperience = Math.max(0, 100 - (magnitude * 15));
		const businessImpact = Math.max(0, 100 - (magnitude * 10));

		return {
			performanceScore,
			userExperience,
			businessMetrics: businessImpact,
			duration: 60, // Estimated 1 hour impact
			affectedUsers: Math.round(1000 * (magnitude / 3)), // Estimate
		};
	}

	// Perform comparisons
	private async performComparisons(): Promise<ComparisonAnalysis[]> {
		const comparisons: ComparisonAnalysis[] = [];

		for (const period of this.config.comparisonPeriods) {
			const comparison = await this.performPeriodComparison(period);
			if (comparison) {
				comparisons.push(comparison);
			}
		}

		return comparisons;
	}

	// Perform comparison for specific period
	private async performPeriodComparison(period: ComparisonPeriod): Promise<ComparisonAnalysis | null> {
		const periodData = this.historicalData.filter(point =>
			point.timestamp >= period.startDate && point.timestamp <= period.endDate
		);

		const recentData = this.historicalData.slice(-10); // Last 10 data points

		if (periodData.length === 0 || recentData.length === 0) {
			return null;
		}

		const baselineMetrics = this.calculateAverageMetrics(periodData);
		const currentMetrics = this.calculateAverageMetrics(recentData);

		const comparisons = this.compareMetrics(baselineMetrics, currentMetrics);
		const summary = this.generateComparisonSummary(comparisons);

		return {
			period,
			baselineMetrics,
			currentMetrics,
			comparisons,
			summary,
		};
	}

	// Calculate average metrics for data points
	private calculateAverageMetrics(dataPoints: HistoricalDataPoint[]): Record<string, number> {
		const metrics: Record<string, number> = {};

		if (dataPoints.length === 0) return metrics;

		// Calculate averages for key metrics
		metrics.lcp = dataPoints.reduce((sum, point) => sum + point.metrics.largestContentfulPaint, 0) / dataPoints.length;
		metrics.fid = dataPoints.reduce((sum, point) => sum + point.metrics.firstInputDelay, 0) / dataPoints.length;
		metrics.cls = dataPoints.reduce((sum, point) => sum + point.metrics.cumulativeLayoutShift, 0) / dataPoints.length;
		metrics.taskCompletionTime = dataPoints.reduce((sum, point) => sum + point.metrics.taskCompletionTime, 0) / dataPoints.length;
		metrics.taskSuccessRate = dataPoints.reduce((sum, point) => sum + point.metrics.taskSuccessRate, 0) / dataPoints.length;
		metrics.errorRate = dataPoints.reduce((sum, point) => sum + point.metrics.errorRate, 0) / dataPoints.length;
		metrics.pageLoadTime = dataPoints.reduce((sum, point) => sum + point.metrics.pageLoadTime, 0) / dataPoints.length;

		return metrics;
	}

	// Compare metrics
	private compareMetrics(baseline: Record<string, number>, current: Record<string, number>): MetricComparison[] {
		const comparisons: MetricComparison[] = [];

		for (const [metric, baselineValue] of Object.entries(baseline)) {
			const currentValue = current[metric] || 0;
			const change = currentValue - baselineValue;
			const changePercent = baselineValue !== 0 ? (change / baselineValue) * 100 : 0;

			comparisons.push({
				metric,
				baselineValue,
				currentValue,
				change,
				changePercent,
				significance: Math.abs(changePercent) > 20 ? 'significant' :
							 Math.abs(changePercent) > 10 ? 'moderate' : 'minimal',
				factors: this.identifyChangeFactors(metric, change),
			});
		}

		return comparisons;
	}

	// Identify factors causing metric changes
	private identifyChangeFactors(metricName: string, change: number): string[] {
		const factors: string[] = [];

		if (metricName.includes('time') || metricName.includes('lcp') || metricName.includes('fid')) {
			if (change > 0) {
				factors.push('Increased resource load times', 'Higher server response times', 'Client-side processing delays');
			} else {
				factors.push('Optimized resources', 'Improved caching', 'Enhanced algorithms');
			}
		}

		if (metricName.includes('error') || metricName.includes('success')) {
			if (change > 0) {
				factors.push('System instability', 'API issues', 'Network problems');
			} else {
				factors.push('Improved error handling', 'Enhanced reliability', 'Better monitoring');
			}
		}

		return factors;
	}

	// Generate comparison summary
	private generateComparisonSummary(comparisons: MetricComparison[]): ComparisonSummary {
		const improvements = comparisons.filter(c => c.changePercent < -5);
		const regressions = comparisons.filter(c => c.changePercent > 5);
		const unchanged = comparisons.filter(c => Math.abs(c.changePercent) <= 5);

		const overallImprovement = comparisons.reduce((sum, c) => sum + c.changePercent, 0) / comparisons.length;

		return {
			overallImprovement,
			significantImprovements: improvements.filter(c => c.significance === 'significant').map(c => c.metric),
			significantRegressions: regressions.filter(c => c.significance === 'significant').map(c => c.metric),
			unchangedMetrics: unchanged.map(c => c.metric),
			primaryDrivers: comparisons
				.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
				.slice(0, 3)
				.map(c => c.metric),
		};
	}

	// Generate recommendations
	private async generateRecommendations(): Promise<HistoricalRecommendation[]> {
		const recommendations: HistoricalRecommendation[] = [];

		// Generate recommendations based on trends
		const trends = await this.analyzeTrends();
		for (const trend of trends) {
			if (trend.trend === 'declining' || trend.trend === 'strongly_declining') {
				recommendations.push(this.generateTrendBasedRecommendation(trend));
			}
		}

		// Generate recommendations based on anomalies
		const anomalies = await this.detectAnomalies();
		for (const anomaly of anomalies.slice(0, 5)) { // Top 5 anomalies
			recommendations.push(this.generateAnomalyBasedRecommendation(anomaly));
		}

		// Generate recommendations based on comparisons
		const comparisons = await this.performComparisons();
		for (const comparison of comparisons) {
			if (comparison.summary.overallImprovement < -10) {
				recommendations.push(this.generateComparisonBasedRecommendation(comparison));
			}
		}

		// Sort by priority and limit to top 10
		return recommendations
			.sort((a, b) => {
				const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			})
			.slice(0, 10);
	}

	// Generate trend-based recommendation
	private generateTrendBasedRecommendation(trend: TrendAnalysis): HistoricalRecommendation {
		return {
			id: `trend_rec_${trend.metric}`,
			priority: trend.trend === 'strongly_declining' ? 'critical' : 'high',
			category: 'performance',
			title: `Address declining ${trend.metric}`,
			description: `${trend.metric} has shown a declining trend with ${trend.changeRate.toFixed(2)} units per period change`,
			rationale: `The ${trend.metric} metric has been consistently declining over the analysis period with ${(trend.confidence * 100).toFixed(0)}% confidence`,
			evidence: [
				{
					type: 'trend',
					description: `${trend.trend} trend detected in ${trend.metric}`,
					data: trend,
					weight: trend.confidence,
				},
			],
			implementation: {
				difficulty: 'moderate',
				timeframe: '2-4 weeks',
				resources: ['performance-engineer', 'frontend-developer'],
				prerequisites: ['Performance audit', 'Root cause analysis'],
				steps: [
					'Conduct detailed performance analysis',
					'Identify root causes of degradation',
					'Implement optimization strategies',
					'Monitor improvements',
					'Validate fixes',
				],
			},
			expectedOutcome: {
				performanceImpact: Math.abs(trend.changeRate) * 10,
				businessImpact: 'Improved user experience and reduced bounce rates',
				successMetrics: [`${trend.metric} improvement trend`, 'User satisfaction scores'],
				measurementPeriod: '4 weeks',
			},
		};
	}

	// Generate anomaly-based recommendation
	private generateAnomalyBasedRecommendation(anomaly: HistoricalAnomaly): HistoricalRecommendation {
		return {
			id: `anomaly_rec_${anomaly.id}`,
			priority: anomaly.magnitude > 3 ? 'critical' : anomaly.magnitude > 2 ? 'high' : 'medium',
			category: 'reliability',
			title: `Investigate ${anomaly.metric} anomaly`,
			description: `Significant ${anomaly.type} detected in ${anomaly.metric} with ${anomaly.magnitude.toFixed(1)}x deviation`,
			rationale: `Anomaly could indicate underlying system issues that need investigation and resolution`,
			evidence: [
				{
					type: 'anomaly',
					description: `${anomaly.type} anomaly in ${anomaly.metric}`,
					data: anomaly,
					weight: 0.8,
				},
			],
			implementation: {
				difficulty: 'moderate',
				timeframe: '1-2 weeks',
				resources: ['devops-engineer', 'monitoring-specialist'],
				prerequisites: ['Anomaly investigation', 'System health check'],
				steps: [
					'Investigate root cause of anomaly',
					'Review system logs and metrics',
					'Implement preventive measures',
					'Enhance monitoring coverage',
					'Document findings',
				],
			},
			expectedOutcome: {
				performanceImpact: 50,
				businessImpact: 'Reduced system anomalies and improved reliability',
				successMetrics: ['Reduced anomaly frequency', 'System stability metrics'],
				measurementPeriod: '2 weeks',
			},
		};
	}

	// Generate comparison-based recommendation
	private generateComparisonBasedRecommendation(comparison: ComparisonAnalysis): HistoricalRecommendation {
		return {
			id: `comparison_rec_${comparison.period.id}`,
			priority: comparison.summary.overallImprovement < -20 ? 'critical' : 'high',
			category: 'user_experience',
			title: `Address performance regression from ${comparison.period.name}`,
			description: `Performance has degraded by ${Math.abs(comparison.summary.overallImprovement).toFixed(1)}% compared to ${comparison.period.name}`,
			rationale: `Significant regression detected when comparing current performance to ${comparison.period.name} baseline`,
			evidence: [
				{
					type: 'comparison',
					description: `Performance regression vs ${comparison.period.name}`,
					data: comparison,
					weight: 0.9,
				},
			],
			implementation: {
				difficulty: 'complex',
				timeframe: '3-6 weeks',
				resources: ['performance-team', 'devops-engineer', 'frontend-team'],
				prerequisites: ['Performance audit', 'Root cause analysis'],
				steps: [
					'Analyze regression factors',
					'Review changes since baseline period',
					'Implement performance improvements',
					'Regress to previous performance levels',
					'Implement monitoring for future regressions',
				],
			},
			expectedOutcome: {
				performanceImpact: Math.abs(comparison.summary.overallImprovement),
				businessImpact: 'Restored performance levels and user experience',
				successMetrics: ['Performance score restoration', 'User satisfaction'],
				measurementPeriod: '6 weeks',
			},
		};
	}

	// Generate cache key
	private generateCacheKey(): string {
		const latestDataPoint = this.historicalData[this.historicalData.length - 1];
		return `analysis_${latestDataPoint?.timestamp.getTime() || Date.now()}`;
	}

	// Get empty insights
	private getEmptyInsights(): HistoricalInsights {
		return {
			summary: this.getDefaultSummary(),
			trends: [],
			patterns: [],
			forecasts: [],
			anomalies: [],
			comparisons: [],
			recommendations: [],
		};
	}

	// Public API methods

	// Subscribe to analysis updates
	public subscribe(callback: (insights: HistoricalInsights) => void): () => void {
		this.analysisCallbacks.add(callback);
		return () => this.analysisCallbacks.delete(callback);
	}

	// Get current insights
	public async getCurrentInsights(): Promise<HistoricalInsights> {
		return await this.performAnalysis();
	}

	// Add historical event
	public addEvent(event: Omit<HistoricalEvent, 'id'>): void {
		const historicalEvent: HistoricalEvent = {
			...event,
			id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};

		this.events.push(historicalEvent);
		this.enforceRetentionPolicies();
	}

	// Get historical data
	public getHistoricalData(options: {
		startDate?: Date;
		endDate?: Date;
		metrics?: string[];
	} = {}): HistoricalDataPoint[] {
		let filteredData = [...this.historicalData];

		// Filter by date range
		if (options.startDate) {
			filteredData = filteredData.filter(point => point.timestamp >= options.startDate!);
		}

		if (options.endDate) {
			filteredData = filteredData.filter(point => point.timestamp <= options.endDate!);
		}

		return filteredData;
	}

	// Update configuration
	public updateConfig(updates: Partial<HistoricalAnalysisConfig>): void {
		this.config = { ...this.config, ...updates };
		this.analysisCache.clear(); // Clear cache when config changes
	}

	// Export data
	public exportData(): string {
		const exportData = {
			timestamp: new Date().toISOString(),
			config: this.config,
			historicalData: this.historicalData,
			events: this.events,
			patterns: this.patterns,
		};

		return JSON.stringify(exportData, null, 2);
	}

	// Cleanup
	public cleanup(): void {
		this.historicalData = [];
		this.events = [];
		this.analysisCache.clear();
		this.analysisCallbacks.clear();
	}
}

// Export singleton instance
export const historicalPerformanceAnalyzer = HistoricalPerformanceAnalyzer.getInstance();
