/**
 * Performance Benchmarking Framework - T167 Implementation
 * Comprehensive performance metrics collection, analysis, and benchmarking system
 * Provides actionable insights for optimization and performance monitoring
 */

import { performanceObserver } from './performance-observer';
import type { PerformanceMetrics, TaskPerformance } from './performance-observer';

// Core benchmarking interfaces
export interface BenchmarkConfig {
	// Performance thresholds and targets
	targets: PerformanceTargets;

	// Benchmark categories to track
	categories: BenchmarkCategory[];

	// Collection settings
	collectionInterval: number;
	maxHistorySize: number;
	enableRealTimeMonitoring: boolean;

	// Alert thresholds
	alertThresholds: AlertThresholds;

	// Comparison baselines
	baselines: PerformanceBaselines;
}

export interface PerformanceTargets {
	// Web Vitals targets
	largestContentfulPaint: number; // ms
	firstInputDelay: number; // ms
	cumulativeLayoutShift: number;
	firstContentfulPaint: number; // ms

	// Custom platform targets
	taskCompletionTime: number; // ms
	taskSuccessRate: number; // 0-1
	pageLoadTime: number; // ms
	bundleSize: number; // bytes
	memoryUsage: number; // MB

	// API and network targets
	apiResponseTime: number; // ms
	resourceLoadTime: number; // ms
	errorRate: number; // 0-1
}

export interface BenchmarkCategory {
	id: string;
	name: string;
	description: string;
	metrics: string[];
	weight: number; // Importance weight for scoring
	targets?: Partial<PerformanceTargets>;
}

export interface AlertThresholds {
	critical: Partial<PerformanceTargets>;
	warning: Partial<PerformanceTargets>;
	info: Partial<PerformanceTargets>;
}

export interface PerformanceBaselines {
	industry: PerformanceTargets;
	previous: PerformanceTargets;
	competitors?: PerformanceTargets;
	historical: PerformanceTargets[];
}

export interface BenchmarkResult {
	id: string;
	timestamp: Date;
	category: string;
	score: number; // 0-100
	grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
	metrics: Record<string, number>;
	targets: PerformanceTargets;
	passed: boolean;
	improvements: string[];
	regressions: string[];
	analysis: PerformanceAnalysis;
}

export interface PerformanceAnalysis {
	summary: string;
	keyFindings: string[];
	trends: TrendAnalysis[];
	bottlenecks: BottleneckAnalysis[];
	opportunities: OptimizationOpportunity[];
	recommendations: OptimizationRecommendation[];
}

export interface TrendAnalysis {
	metric: string;
	trend: 'improving' | 'declining' | 'stable';
	changePercent: number;
	confidence: number; // 0-1
	timeframe: string;
}

export interface BottleneckAnalysis {
	component: string;
	impact: 'high' | 'medium' | 'low';
	description: string;
	metrics: string[];
	potentialGain: number; // % improvement
	effort: 'low' | 'medium' | 'high';
}

export interface OptimizationOpportunity {
	area: string;
	potentialImprovement: number; // % improvement
	priority: 'high' | 'medium' | 'low';
	description: string;
	estimatedEffort: string;
	dependencies: string[];
}

export interface OptimizationRecommendation {
	title: string;
	description: string;
	priority: 'critical' | 'high' | 'medium' | 'low';
	category: 'performance' | 'accessibility' | 'seo' | 'user-experience';
	impact: {
		score: number; // 0-100
		metrics: string[];
		description: string;
	};
	implementation: {
		difficulty: 'easy' | 'moderate' | 'complex';
		timeEstimate: string;
		resources: string[];
	};
	validation: {
		successCriteria: string[];
		testMethods: string[];
		expectedOutcome: string;
	};
}

export interface BenchmarkComparison {
	current: BenchmarkResult;
	baseline: BenchmarkResult;
	improvements: ComparisonMetric[];
	regressions: ComparisonMetric[];
	unchanged: string[];
	summary: {
		scoreChange: number;
		gradeChange: string;
		overallImprovement: number;
	};
}

export interface ComparisonMetric {
	name: string;
	current: number;
	baseline: number;
	change: number;
	changePercent: number;
	improvement: boolean;
}

export interface PerformanceBenchmark {
	// Real-time monitoring data
	current: BenchmarkResult;

	// Historical data
	history: BenchmarkResult[];

	// Comparisons
	comparisons: {
		previous: BenchmarkComparison;
		baseline: BenchmarkComparison;
		goal: BenchmarkComparison;
	};

	// Analytics
	trends: TrendAnalysis[];
	opportunities: OptimizationOpportunity[];

	// Configuration
	config: BenchmarkConfig;
}

export class PerformanceBenchmarkingFramework {
	private static instance: PerformanceBenchmarkingFramework;
	private config: BenchmarkConfig;
	private benchmarks: Map<string, PerformanceBenchmark> = new Map();
	private collectionInterval: NodeJS.Timeout | null = null;
	private observers: Set<() => void> = new Set();

	private constructor() {
		this.config = this.getDefaultConfig();
		this.initializeFramework();
	}

	public static getInstance(): PerformanceBenchmarkingFramework {
		if (!PerformanceBenchmarkingFramework.instance) {
			PerformanceBenchmarkingFramework.instance = new PerformanceBenchmarkingFramework();
		}
		return PerformanceBenchmarkingFramework.instance;
	}

	// Initialize the framework
	private initializeFramework(): void {
		if (typeof window !== 'undefined') {
			this.setupPerformanceObservers();
			this.startDataCollection();
		}
	}

	// Get default configuration
	private getDefaultConfig(): BenchmarkConfig {
		return {
			targets: {
				largestContentfulPaint: 2500,
				firstInputDelay: 100,
				cumulativeLayoutShift: 0.1,
				firstContentfulPaint: 1800,
				taskCompletionTime: 5000,
				taskSuccessRate: 0.95,
				pageLoadTime: 3000,
				bundleSize: 250000, // 250KB
				memoryUsage: 50, // 50MB
				apiResponseTime: 1000,
				resourceLoadTime: 2000,
				errorRate: 0.05,
			},
			categories: [
				{
					id: 'core-web-vitals',
					name: 'Core Web Vitals',
					description: 'Essential user experience metrics',
					metrics: ['lcp', 'fid', 'cls'],
					weight: 0.3,
				},
				{
					id: 'loading-performance',
					name: 'Loading Performance',
					description: 'Page and resource loading metrics',
					metrics: ['fcp', 'ttfb', 'resource-load-time'],
					weight: 0.25,
				},
				{
					id: 'runtime-performance',
					name: 'Runtime Performance',
					description: 'Application runtime and interaction metrics',
					metrics: ['task-completion', 'memory-usage', 'cpu-usage'],
					weight: 0.25,
				},
				{
					id: 'platform-specific',
					name: 'Platform Specific',
					description: 'Parsify.dev platform-specific metrics',
					metrics: ['tool-performance', 'error-rate', 'user-satisfaction'],
					weight: 0.2,
				},
			],
			collectionInterval: 30000, // 30 seconds
			maxHistorySize: 1000,
			enableRealTimeMonitoring: true,
			alertThresholds: {
				critical: {
					largestContentfulPaint: 4000,
					firstInputDelay: 300,
					cumulativeLayoutShift: 0.25,
					taskSuccessRate: 0.8,
					errorRate: 0.15,
				},
				warning: {
					largestContentfulPaint: 3000,
					firstInputDelay: 200,
					cumulativeLayoutShift: 0.15,
					taskSuccessRate: 0.9,
					errorRate: 0.1,
				},
				info: {
					largestContentfulPaint: 2500,
					firstInputDelay: 150,
					cumulativeLayoutShift: 0.1,
					taskSuccessRate: 0.95,
					errorRate: 0.05,
				},
			},
			baselines: {
				industry: {
					largestContentfulPaint: 2500,
					firstInputDelay: 100,
					cumulativeLayoutShift: 0.1,
					firstContentfulPaint: 1800,
					taskCompletionTime: 5000,
					taskSuccessRate: 0.95,
					pageLoadTime: 3000,
					bundleSize: 250000,
					memoryUsage: 50,
					apiResponseTime: 1000,
					resourceLoadTime: 2000,
					errorRate: 0.05,
				},
				previous: {
					largestContentfulPaint: 2800,
					firstInputDelay: 120,
					cumulativeLayoutShift: 0.12,
					firstContentfulPaint: 2000,
					taskCompletionTime: 5500,
					taskSuccessRate: 0.93,
					pageLoadTime: 3200,
					bundleSize: 275000,
					memoryUsage: 55,
					apiResponseTime: 1100,
					resourceLoadTime: 2200,
					errorRate: 0.06,
				},
				historical: [],
			},
		};
	}

	// Setup performance observers
	private setupPerformanceObservers(): void {
		// Use existing performance observer
		const observer = performanceObserver;

		// Subscribe to performance updates
		this.observePerformance();
	}

	// Observe performance changes
	private observePerformance(): void {
		const checkInterval = setInterval(() => {
			if (this.config.enableRealTimeMonitoring) {
				this.collectBenchmarkData();
			}
		}, this.config.collectionInterval);

		// Cleanup on page unload
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => {
				clearInterval(checkInterval);
			});
		}
	}

	// Start data collection
	private startDataCollection(): void {
		if (this.collectionInterval) {
			clearInterval(this.collectionInterval);
		}

		this.collectionInterval = setInterval(() => {
			this.collectBenchmarkData();
		}, this.config.collectionInterval);

		// Initial collection
		this.collectBenchmarkData();
	}

	// Collect benchmark data
	public async collectBenchmarkData(): Promise<void> {
		try {
			const metrics = performanceObserver.getMetrics();
			const taskHistory = performanceObserver.getTaskHistory();

			// Generate benchmarks for each category
			for (const category of this.config.categories) {
				const benchmark = await this.generateBenchmark(category, metrics, taskHistory);

				// Store benchmark
				if (!this.benchmarks.has(category.id)) {
					this.benchmarks.set(category.id, {
						current: benchmark,
						history: [],
						comparisons: {
							previous: this.generateEmptyComparison(),
							baseline: this.generateEmptyComparison(),
							goal: this.generateEmptyComparison(),
						},
						trends: [],
						opportunities: [],
						config: this.config,
					});
				}

				const existing = this.benchmarks.get(category.id)!;

				// Update history
				existing.history.push(benchmark);
				if (existing.history.length > this.config.maxHistorySize) {
					existing.history.shift();
				}

				// Update current
				existing.current = benchmark;

				// Generate trends and opportunities
				existing.trends = this.analyzeTrends(category.id, existing.history);
				existing.opportunities = this.identifyOpportunities(category.id, benchmark);

				// Update comparisons
				if (existing.history.length > 1) {
					const previous = existing.history[existing.history.length - 2];
					existing.comparisons.previous = this.compareBenchmarks(benchmark, previous);
				}
				existing.comparisons.baseline = this.compareToBaseline(category.id, benchmark);
				existing.comparisons.goal = this.compareToGoal(category.id, benchmark);
			}

			// Notify observers
			this.notifyObservers();
		} catch (error) {
			console.error('Failed to collect benchmark data:', error);
		}
	}

	// Generate benchmark for a category
	private async generateBenchmark(
		category: BenchmarkCategory,
		metrics: PerformanceMetrics,
		taskHistory: TaskPerformance[]
	): Promise<BenchmarkResult> {
		const categoryMetrics = this.extractCategoryMetrics(category, metrics, taskHistory);
		const categoryTargets = { ...this.config.targets, ...category.targets };

		const score = this.calculateScore(categoryMetrics, categoryTargets, category.weight);
		const grade = this.calculateGrade(score);
		const analysis = await this.analyzePerformance(category, categoryMetrics, categoryTargets);

		return {
			id: `${category.id}_${Date.now()}`,
			timestamp: new Date(),
			category: category.id,
			score,
			grade,
			metrics: categoryMetrics,
			targets: categoryTargets,
			passed: score >= 80,
			improvements: this.identifyImprovements(categoryMetrics, categoryTargets),
			regressions: this.identifyRegressions(categoryMetrics, categoryTargets),
			analysis,
		};
	}

	// Extract metrics for a specific category
	private extractCategoryMetrics(
		category: BenchmarkCategory,
		metrics: PerformanceMetrics,
		taskHistory: TaskPerformance[]
	): Record<string, number> {
		const categoryMetrics: Record<string, number> = {};

		switch (category.id) {
			case 'core-web-vitals':
				categoryMetrics['lcp'] = metrics.largestContentfulPaint;
				categoryMetrics['fid'] = metrics.firstInputDelay;
				categoryMetrics['cls'] = metrics.cumulativeLayoutShift;
				break;

			case 'loading-performance':
				categoryMetrics['fcp'] = metrics.firstContentfulPaint;
				categoryMetrics['ttfb'] = metrics.pageLoadTime;
				categoryMetrics['resource-load-time'] = metrics.resourceLoadTimes.length > 0
					? metrics.resourceLoadTimes.reduce((a, b) => a + b, 0) / metrics.resourceLoadTimes.length
					: 0;
				break;

			case 'runtime-performance':
				categoryMetrics['task-completion'] = metrics.taskCompletionTime;
				categoryMetrics['memory-usage'] = this.getMemoryUsage();
				categoryMetrics['cpu-usage'] = this.getCPUUsage();
				break;

			case 'platform-specific':
				categoryMetrics['tool-performance'] = this.calculateToolPerformance(taskHistory);
				categoryMetrics['error-rate'] = metrics.errorRate;
				categoryMetrics['user-satisfaction'] = metrics.userSatisfactionScore;
				break;
		}

		return categoryMetrics;
	}

	// Get memory usage (MB)
	private getMemoryUsage(): number {
		if (typeof window !== 'undefined' && 'memory' in performance) {
			const memory = (performance as any).memory;
			return memory.usedJSHeapSize / 1024 / 1024;
		}
		return 0;
	}

	// Get CPU usage (simplified estimation)
	private getCPUUsage(): number {
		// This is a simplified estimation - in production you'd want more sophisticated CPU monitoring
		const start = performance.now();
		const operations = 1000000;
		for (let i = 0; i < operations; i++) {
			Math.random();
		}
		const end = performance.now();
		return (end - start) / 10; // Normalize to a 0-100 scale
	}

	// Calculate tool performance score
	private calculateToolPerformance(taskHistory: TaskPerformance[]): number {
		if (taskHistory.length === 0) return 0;

		const recentTasks = taskHistory.slice(-50); // Last 50 tasks
		const successRate = recentTasks.filter(t => t.success).length / recentTasks.length;
		const avgDuration = recentTasks.reduce((sum, t) => sum + t.duration, 0) / recentTasks.length;

		// Combine success rate (60% weight) and speed (40% weight)
		const speedScore = Math.max(0, 1 - (avgDuration / 10000)); // Normalize against 10s
		return (successRate * 0.6 + speedScore * 0.4) * 100;
	}

	// Calculate performance score
	private calculateScore(
		metrics: Record<string, number>,
		targets: PerformanceTargets,
		weight: number
	): number {
		let totalScore = 0;
		let metricCount = 0;

		// Core Web Vitals
		if (metrics.lcp !== undefined) {
			const lcpScore = Math.max(0, 1 - (metrics.lcp / targets.largestContentfulPaint)) * 100;
			totalScore += lcpScore;
			metricCount++;
		}

		if (metrics.fid !== undefined) {
			const fidScore = Math.max(0, 1 - (metrics.fid / targets.firstInputDelay)) * 100;
			totalScore += fidScore;
			metricCount++;
		}

		if (metrics.cls !== undefined) {
			const clsScore = Math.max(0, 1 - (metrics.cls / targets.cumulativeLayoutShift)) * 100;
			totalScore += clsScore;
			metricCount++;
		}

		// Loading Performance
		if (metrics.fcp !== undefined) {
			const fcpScore = Math.max(0, 1 - (metrics.fcp / targets.firstContentfulPaint)) * 100;
			totalScore += fcpScore;
			metricCount++;
		}

		// Runtime Performance
		if (metrics['task-completion'] !== undefined) {
			const taskScore = Math.max(0, 1 - (metrics['task-completion'] / targets.taskCompletionTime)) * 100;
			totalScore += taskScore;
			metricCount++;
		}

		if (metrics['error-rate'] !== undefined) {
			const errorScore = Math.max(0, 1 - (metrics['error-rate'] / targets.errorRate)) * 100;
			totalScore += errorScore;
			metricCount++;
		}

		// Calculate weighted average
		const averageScore = metricCount > 0 ? totalScore / metricCount : 0;
		return averageScore * weight;
	}

	// Calculate performance grade
	private calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
		if (score >= 95) return 'A+';
		if (score >= 90) return 'A';
		if (score >= 80) return 'B';
		if (score >= 70) return 'C';
		if (score >= 60) return 'D';
		return 'F';
	}

	// Analyze performance and generate insights
	private async analyzePerformance(
		category: BenchmarkCategory,
		metrics: Record<string, number>,
		targets: PerformanceTargets
	): Promise<PerformanceAnalysis> {
		const keyFindings: string[] = [];
		const bottlenecks: BottleneckAnalysis[] = [];
		const opportunities: OptimizationOpportunity[] = [];
		const recommendations: OptimizationRecommendation[] = [];

		// Analyze each metric
		for (const [metricName, value] of Object.entries(metrics)) {
			const target = this.getTargetForMetric(metricName, targets);
			const performance = value / target;

			if (performance > 1.2) {
				// Poor performance
				keyFindings.push(`${metricName} is ${(performance * 100 - 100).toFixed(0)}% above target`);

				bottlenecks.push({
					component: metricName,
					impact: performance > 2 ? 'high' : performance > 1.5 ? 'medium' : 'low',
					description: `${metricName} is ${performance.toFixed(2)}x higher than target`,
					metrics: [metricName],
					potentialGain: Math.round((performance - 1) * 100),
					effort: this.estimateEffort(metricName, performance),
				});

				opportunities.push({
					area: metricName,
					potentialImprovement: Math.round((performance - 1) * 100),
					priority: performance > 2 ? 'high' : performance > 1.5 ? 'medium' : 'low',
					description: `Optimize ${metricName} to meet performance targets`,
					estimatedEffort: this.estimateEffort(metricName, performance),
					dependencies: this.getDependencies(metricName),
				});
			} else if (performance < 0.8) {
				// Excellent performance
				keyFindings.push(`${metricName} is performing ${(1 - performance) * 100}% better than target`);
			}
		}

		// Generate specific recommendations
		recommendations.push(...this.generateRecommendations(category, metrics, targets));

		return {
			summary: this.generateSummary(category, metrics, targets),
			keyFindings,
			trends: [], // Will be populated separately
			bottlenecks,
			opportunities,
			recommendations,
		};
	}

	// Get target value for a specific metric
	private getTargetForMetric(metricName: string, targets: PerformanceTargets): number {
		switch (metricName) {
			case 'lcp': return targets.largestContentfulPaint;
			case 'fid': return targets.firstInputDelay;
			case 'cls': return targets.cumulativeLayoutShift;
			case 'fcp': return targets.firstContentfulPaint;
			case 'task-completion': return targets.taskCompletionTime;
			case 'error-rate': return targets.errorRate;
			default: return 1000; // Default fallback
		}
	}

	// Estimate implementation effort
	private estimateEffort(metricName: string, performance: number): 'low' | 'medium' | 'high' {
		// Simplified effort estimation based on metric type and performance gap
		const lowEffortMetrics = ['fcp', 'lcp', 'cls'];
		const mediumEffortMetrics = ['fid', 'task-completion'];

		if (lowEffortMetrics.includes(metricName)) {
			return performance > 1.5 ? 'medium' : 'low';
		} else if (mediumEffortMetrics.includes(metricName)) {
			return performance > 2 ? 'high' : 'medium';
		}

		return 'high';
	}

	// Get dependencies for a metric
	private getDependencies(metricName: string): string[] {
		switch (metricName) {
			case 'lcp':
				return ['image-optimization', 'server-response-time', 'resource-loading'];
			case 'fid':
				return ['javascript-execution', 'main-thread-work', 'third-party-scripts'];
			case 'cls':
				return ['layout-stability', 'dynamic-content', 'ad-integration'];
			case 'fcp':
				return ['server-rendering', 'resource-prioritization', 'dns-lookup'];
			case 'task-completion':
				return ['algorithm-optimization', 'ui-responsiveness', 'data-processing'];
			default:
				return [];
		}
	}

	// Generate specific recommendations
	private generateRecommendations(
		category: BenchmarkCategory,
		metrics: Record<string, number>,
		targets: PerformanceTargets
	): OptimizationRecommendation[] {
		const recommendations: OptimizationRecommendation[] = [];

		// Core Web Vitals recommendations
		if (metrics.lcp && metrics.lcp > targets.largestContentfulPaint) {
			recommendations.push({
				title: 'Optimize Largest Contentful Paint',
				description: `LCP is ${metrics.lcp.toFixed(0)}ms, exceeding the ${targets.largestContentfulPaint}ms target`,
				priority: metrics.lcp > targets.largestContentfulPaint * 1.5 ? 'critical' : 'high',
				category: 'performance',
				impact: {
					score: 85,
					metrics: ['lcp', 'user-experience'],
					description: 'Improves loading performance and user perception',
				},
				implementation: {
					difficulty: 'moderate',
					timeEstimate: '2-4 weeks',
					resources: ['frontend-developer', 'performance-analyst', 'cdn-configuration'],
				},
				validation: {
					successCriteria: ['LCP <= 2.5s', 'No regressions in other metrics'],
					testMethods: ['Lighthouse audit', 'Real User Monitoring', 'Lab testing'],
					expectedOutcome: '20-30% improvement in LCP scores',
				},
			});
		}

		if (metrics.fid && metrics.fid > targets.firstInputDelay) {
			recommendations.push({
				title: 'Reduce First Input Delay',
				description: `FID is ${metrics.fid.toFixed(0)}ms, exceeding the ${targets.firstInputDelay}ms target`,
			priority: 'high',
				category: 'user-experience',
				impact: {
					score: 80,
					metrics: ['fid', 'interactivity'],
					description: 'Enhances user interaction responsiveness',
				},
				implementation: {
					difficulty: 'moderate',
					timeEstimate: '1-3 weeks',
					resources: ['javascript-optimizer', 'performance-engineer'],
				},
				validation: {
					successCriteria: ['FID <= 100ms', 'Maintain low CLS'],
					testMethods: ['Field data monitoring', 'Lab performance testing'],
					expectedOutcome: '15-25% improvement in FID scores',
				},
			});
		}

		// Task completion recommendations
		if (metrics['task-completion'] && metrics['task-completion'] > targets.taskCompletionTime) {
			recommendations.push({
				title: 'Improve Task Completion Performance',
				description: `Task completion time is ${metrics['task-completion'].toFixed(0)}ms, exceeding the ${targets.taskCompletionTime}ms target`,
				priority: 'high',
				category: 'user-experience',
				impact: {
					score: 90,
					metrics: ['task-completion', 'user-satisfaction'],
					description: 'Directly impacts user productivity and satisfaction',
				},
				implementation: {
					difficulty: 'moderate',
					timeEstimate: '3-6 weeks',
					resources: ['backend-developer', 'algorithm-specialist', 'performance-engineer'],
				},
				validation: {
					successCriteria: ['Task completion <= 5s', '95% success rate'],
					testMethods: ['Load testing', 'User acceptance testing'],
					expectedOutcome: '25-40% improvement in task completion time',
				},
			});
		}

		return recommendations;
	}

	// Generate performance summary
	private generateSummary(
		category: BenchmarkCategory,
		metrics: Record<string, number>,
		targets: PerformanceTargets
	): string {
		const totalMetrics = Object.keys(metrics).length;
		const passingMetrics = Object.entries(metrics).filter(([name, value]) => {
			const target = this.getTargetForMetric(name, targets);
			return value <= target;
		}).length;

		const performancePercent = Math.round((passingMetrics / totalMetrics) * 100);

		if (performancePercent >= 90) {
			return `Excellent performance in ${category.name}. ${passingMetrics}/${totalMetrics} metrics are within targets.`;
		} else if (performancePercent >= 70) {
			return `Good performance in ${category.name} with room for improvement. ${passingMetrics}/${totalMetrics} metrics meet targets.`;
		} else if (performancePercent >= 50) {
			return `Moderate performance in ${category.name}. Several metrics need attention (${totalMetrics - passingMetrics} below target).`;
		} else {
			return `Poor performance in ${category.name}. Significant optimization needed (${totalMetrics - passingMetrics} metrics below target).`;
		}
	}

	// Identify improvements
	private identifyImprovements(
		metrics: Record<string, number>,
		targets: PerformanceTargets
	): string[] {
		const improvements: string[] = [];

		for (const [name, value] of Object.entries(metrics)) {
			const target = this.getTargetForMetric(name, targets);
			if (value <= target * 0.8) {
				improvements.push(`${name} is ${(1 - value/target) * 100}% better than target`);
			}
		}

		return improvements;
	}

	// Identify regressions
	private identifyRegressions(
		metrics: Record<string, number>,
		targets: PerformanceTargets
	): string[] {
		const regressions: string[] = [];

		for (const [name, value] of Object.entries(metrics)) {
			const target = this.getTargetForMetric(name, targets);
			if (value > target) {
				regressions.push(`${name} is ${((value/target) - 1) * 100}% above target`);
			}
		}

		return regressions;
	}

	// Analyze trends from historical data
	private analyzeTrends(categoryId: string, history: BenchmarkResult[]): TrendAnalysis[] {
		if (history.length < 2) return [];

		const trends: TrendAnalysis[] = [];
		const recentData = history.slice(-10); // Last 10 benchmarks
		const olderData = history.slice(-20, -10); // Previous 10 benchmarks

		if (olderData.length === 0) return [];

		for (const metric of ['lcp', 'fid', 'cls', 'fcp', 'task-completion']) {
			const recentAvg = this.calculateAverageForMetric(recentData, metric);
			const olderAvg = this.calculateAverageForMetric(olderData, metric);

			if (recentAvg === 0 || olderAvg === 0) continue;

			const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
			const trend = Math.abs(changePercent) < 5 ? 'stable' :
						  changePercent < 0 ? 'improving' : 'declining';

			const confidence = Math.min(1, recentData.length / 10); // Confidence based on data points

			trends.push({
				metric,
				trend,
				changePercent,
				confidence,
				timeframe: 'recent',
			});
		}

		return trends;
	}

	// Calculate average for a specific metric
	private calculateAverageForMetric(benchmarks: BenchmarkResult[], metricName: string): number {
		const values = benchmarks.map(b => b.metrics[metricName]).filter(v => v !== undefined);
		return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
	}

	// Identify optimization opportunities
	private identifyOpportunities(categoryId: string, benchmark: BenchmarkResult): OptimizationOpportunity[] {
		return benchmark.analysis.opportunities;
	}

	// Compare two benchmarks
	private compareBenchmarks(current: BenchmarkResult, previous: BenchmarkResult): BenchmarkComparison {
		const improvements: ComparisonMetric[] = [];
		const regressions: ComparisonMetric[] = [];
		const unchanged: string[] = [];

		// Compare metrics
		const allMetrics = new Set([...Object.keys(current.metrics), ...Object.keys(previous.metrics)]);

		for (const metric of allMetrics) {
			const currentVal = current.metrics[metric] || 0;
			const previousVal = previous.metrics[metric] || 0;

			const change = currentVal - previousVal;
			const changePercent = previousVal !== 0 ? (change / previousVal) * 100 : 0;
			const improvement = this.isImprovement(metric, change);

			const comparison: ComparisonMetric = {
				name: metric,
				current: currentVal,
				baseline: previousVal,
				change,
				changePercent,
				improvement,
			};

			if (Math.abs(changePercent) < 5) {
				unchanged.push(metric);
			} else if (improvement) {
				improvements.push(comparison);
			} else {
				regressions.push(comparison);
			}
		}

		return {
			current,
			baseline: previous,
			improvements,
			regressions,
			unchanged,
			summary: {
				scoreChange: current.score - previous.score,
				gradeChange: `${previous.grade} → ${current.grade}`,
				overallImprovement: improvements.length - regressions.length,
			},
		};
	}

	// Check if a change is an improvement
	private isImprovement(metric: string, change: number): boolean {
		// Lower is better for these metrics
		const lowerIsBetter = ['lcp', 'fid', 'cls', 'fcp', 'task-completion', 'error-rate'];
		return lowerIsBetter.includes(metric) ? change < 0 : change > 0;
	}

	// Compare to baseline
	private compareToBaseline(categoryId: string, current: BenchmarkResult): BenchmarkComparison {
		const baseline = this.generateBaselineBenchmark(categoryId);
		return this.compareBenchmarks(current, baseline);
	}

	// Compare to goal
	private compareToGoal(categoryId: string, current: BenchmarkResult): BenchmarkComparison {
		const goal = this.generateGoalBenchmark(categoryId);
		return this.compareBenchmarks(current, goal);
	}

	// Generate baseline benchmark
	private generateBaselineBenchmark(categoryId: string): BenchmarkResult {
		const category = this.config.categories.find(c => c.id === categoryId);
		if (!category) throw new Error(`Category ${categoryId} not found`);

		const baselineMetrics = this.config.baselines.previous;
		const metrics = this.extractCategoryMetrics(category, this.mapBaselineToMetrics(baselineMetrics), []);

		return {
			id: `baseline_${categoryId}`,
			timestamp: new Date(),
			category: categoryId,
			score: this.calculateScore(metrics, baselineMetrics, category.weight),
			grade: this.calculateGrade(this.calculateScore(metrics, baselineMetrics, category.weight)),
			metrics,
			targets: baselineMetrics,
			passed: true,
			improvements: [],
			regressions: [],
			analysis: {
				summary: 'Baseline performance',
				keyFindings: [],
				trends: [],
				bottlenecks: [],
				opportunities: [],
				recommendations: [],
			},
		};
	}

	// Generate goal benchmark
	private generateGoalBenchmark(categoryId: string): BenchmarkResult {
		const category = this.config.categories.find(c => c.id === categoryId);
		if (!category) throw new Error(`Category ${categoryId} not found`);

		const goalMetrics = this.config.targets;
		const metrics = this.extractCategoryMetrics(category, this.mapBaselineToMetrics(goalMetrics), []);

		return {
			id: `goal_${categoryId}`,
			timestamp: new Date(),
			category: categoryId,
			score: 100, // Goals are always 100
			grade: 'A+',
			metrics,
			targets: goalMetrics,
			passed: true,
			improvements: [],
			regressions: [],
			analysis: {
				summary: 'Target performance goals',
				keyFindings: [],
				trends: [],
				bottlenecks: [],
				opportunities: [],
				recommendations: [],
			},
		};
	}

	// Map baseline metrics to PerformanceMetrics
	private mapBaselineToMetrics(baseline: PerformanceTargets): PerformanceMetrics {
		return {
			taskCompletionTime: baseline.taskCompletionTime,
			taskSuccessRate: baseline.taskSuccessRate,
			totalTasksCompleted: 0,
			totalTasksAttempted: 0,
			pageLoadTime: baseline.pageLoadTime,
			firstContentfulPaint: baseline.firstContentfulPaint,
			largestContentfulPaint: baseline.largestContentfulPaint,
			cumulativeLayoutShift: baseline.cumulativeLayoutShift,
			firstInputDelay: baseline.firstInputDelay,
			bundleSize: baseline.bundleSize,
			totalResourcesSize: baseline.bundleSize * 2, // Estimate
			resourceLoadTimes: [baseline.resourceLoadTime],
			averageResponseTime: baseline.apiResponseTime,
			errorRate: baseline.errorRate,
			userSatisfactionScore: 0.9, // Estimate
			timestamp: new Date(),
			sessionId: 'baseline',
		};
	}

	// Generate empty comparison
	private generateEmptyComparison(): BenchmarkComparison {
		const emptyBenchmark: BenchmarkResult = {
			id: 'empty',
			timestamp: new Date(),
			category: 'empty',
			score: 0,
			grade: 'F',
			metrics: {},
			targets: this.config.targets,
			passed: false,
			improvements: [],
			regressions: [],
			analysis: {
				summary: 'No data available',
				keyFindings: [],
				trends: [],
				bottlenecks: [],
				opportunities: [],
				recommendations: [],
			},
		};

		return {
			current: emptyBenchmark,
			baseline: emptyBenchmark,
			improvements: [],
			regressions: [],
			unchanged: [],
			summary: {
				scoreChange: 0,
				gradeChange: 'N/A',
				overallImprovement: 0,
			},
		};
	}

	// Subscribe to benchmark updates
	public subscribe(callback: () => void): () => void {
		this.observers.add(callback);
		return () => this.observers.delete(callback);
	}

	// Notify observers of changes
	private notifyObservers(): void {
		this.observers.forEach(callback => callback());
	}

	// Get all benchmarks
	public getBenchmarks(): Map<string, PerformanceBenchmark> {
		return new Map(this.benchmarks);
	}

	// Get benchmark for specific category
	public getBenchmark(categoryId: string): PerformanceBenchmark | undefined {
		return this.benchmarks.get(categoryId);
	}

	// Get current performance score
	public getCurrentScore(categoryId?: string): number {
		if (categoryId) {
			const benchmark = this.benchmarks.get(categoryId);
			return benchmark?.current.score || 0;
		}

		// Return weighted average of all categories
		let totalScore = 0;
		let totalWeight = 0;

		for (const [id, benchmark] of this.benchmarks) {
			const category = this.config.categories.find(c => c.id === id);
			const weight = category?.weight || 1;
			totalScore += benchmark.current.score * weight;
			totalWeight += weight;
		}

		return totalWeight > 0 ? totalScore / totalWeight : 0;
	}

	// Update configuration
	public updateConfig(updates: Partial<BenchmarkConfig>): void {
		this.config = { ...this.config, ...updates };

		// Restart collection if interval changed
		if (updates.collectionInterval) {
			this.startDataCollection();
		}
	}

	// Export benchmark data
	public exportData(): string {
		const exportData = {
			timestamp: new Date().toISOString(),
			benchmarks: Array.from(this.benchmarks.entries()).map(([id, data]) => ({
				categoryId: id,
				...data,
			})),
			config: this.config,
		};

		return JSON.stringify(exportData, null, 2);
	}

	// Cleanup
	public cleanup(): void {
		if (this.collectionInterval) {
			clearInterval(this.collectionInterval);
			this.collectionInterval = null;
		}
		this.observers.clear();
		this.benchmarks.clear();
	}
}

// Export singleton instance
export const performanceBenchmarkingFramework = PerformanceBenchmarkingFramework.getInstance();
