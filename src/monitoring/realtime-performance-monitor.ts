/**
 * Real-time Performance Monitor - T167 Implementation
 * Advanced real-time performance monitoring with streaming analytics and alerting
 * Provides immediate feedback on performance changes and potential issues
 */

import { performanceObserver } from './performance-observer';
import { performanceBenchmarkingFramework } from './performance-benchmarking-framework';
import type { PerformanceMetrics, TaskPerformance } from './performance-observer';
import type { BenchmarkResult, PerformanceBenchmark } from './performance-benchmarking-framework';

// Real-time monitoring interfaces
export interface RealtimeConfig {
	// Monitoring settings
	updateInterval: number;
	batchSize: number;
	maxBufferSize: number;

	// Alert thresholds
	alertThresholds: RealtimeAlertThresholds;

	// Streaming settings
	enableStreaming: boolean;
	streamEndpoint?: string;

	// Performance budgets
	budgets: PerformanceBudgets;

	// Anomaly detection
	anomalyDetection: AnomalyDetectionConfig;
}

export interface RealtimeAlertThresholds {
	// Immediate alerts (critical)
	immediate: {
		lcp: number; // ms
		fid: number; // ms
		cls: number;
		errorRate: number; // 0-1
		memoryUsage: number; // MB
	};

	// Warning alerts (performance degradation)
	warning: {
		lcp: number; // ms
		fid: number; // ms
		cls: number;
		taskCompletionTime: number; // ms
	};

	// Rate of change alerts
	rateOfChange: {
		lcpIncrease: number; // % increase
		errorRateIncrease: number; // % increase
		taskCompletionIncrease: number; // % increase
	};
}

export interface PerformanceBudgets {
	// Resource budgets
	bundleSize: number;
	imageSize: number;
	fontSize: number;
	cssSize: number;
	jsSize: number;

	// Timing budgets
	timeToInteractive: number;
	firstMeaningfulPaint: number;
	maxTaskTime: number;

	// User experience budgets
	maxRedirects: number;
	maxRequests: number;
	totalDownloadSize: number;
}

export interface AnomalyDetectionConfig {
	enabled: boolean;
	sensitivity: 'low' | 'medium' | 'high';
	windowSize: number;
	minDataPoints: number;
	threshold: number; // Standard deviations
}

export interface RealtimeMetrics {
	timestamp: Date;
	sessionId: string;

	// Core metrics
	coreWebVitals: {
		lcp: number;
		fid: number;
		cls: number;
		fcp: number;
		ttfb: number;
	};

	// Runtime metrics
	runtime: {
		memoryUsage: number;
		cpuUsage: number;
		taskCompletionTime: number;
		taskSuccessRate: number;
		activeTasks: number;
	};

	// Network metrics
	network: {
		requestCount: number;
		totalTransferSize: number;
		averageResponseTime: number;
		errorRate: number;
	};

	// User interaction metrics
	interactions: {
		totalInteractions: number;
		averageResponseTime: number;
		bounceRate: number;
		satisfactionScore: number;
	};

	// Platform-specific metrics
	platform: {
		toolPerformance: number;
		conversionRate: number;
		featureUsage: Record<string, number>;
	};
}

export interface RealtimeAlert {
	id: string;
	timestamp: Date;
	type: 'critical' | 'warning' | 'info';
	category: 'performance' | 'user-experience' | 'platform' | 'network';
	metric: string;
	currentValue: number;
	thresholdValue: number;
	deviation: number;
	description: string;
	impact: string;
	recommendations: string[];
	resolved: boolean;
	resolvedAt?: Date;
	resolution?: string;
}

export interface PerformanceAnomaly {
	id: string;
	timestamp: Date;
	metric: string;
	expectedValue: number;
	actualValue: number;
	deviation: number;
	severity: 'low' | 'medium' | 'high';
	description: string;
	potentialCauses: string[];
	investigationSteps: string[];
}

export interface StreamingDataPoint {
	timestamp: Date;
	metrics: Partial<RealtimeMetrics>;
	events: PerformanceEvent[];
}

export interface PerformanceEvent {
	id: string;
	timestamp: Date;
	type: 'metric_update' | 'alert' | 'anomaly' | 'user_action' | 'system_event';
	category: string;
	data: any;
	severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealtimeMonitoringState {
	isActive: boolean;
	currentMetrics: RealtimeMetrics | null;
	historicalMetrics: RealtimeMetrics[];
	alerts: RealtimeAlert[];
	anomalies: PerformanceAnomaly[];
	lastUpdate: Date;
	sessionStats: {
		duration: number;
		metricsCollected: number;
		alertsTriggered: number;
		anomaliesDetected: number;
	};
}

export class RealtimePerformanceMonitor {
	private static instance: RealtimePerformanceMonitor;
	private config: RealtimeConfig;
	private state: RealtimeMonitoringState;
	private updateInterval: NodeJS.Timeout | null = null;
	private observers: Set<(state: RealtimeMonitoringState) => void> = new Set();
	private metricHistory: RealtimeMetrics[] = [];
	private anomalyDetector: AnomalyDetector;
	private eventBuffer: PerformanceEvent[] = [];

	private constructor() {
		this.config = this.getDefaultConfig();
		this.state = this.getInitialState();
		this.anomalyDetector = new AnomalyDetector(this.config.anomalyDetection);
		this.initialize();
	}

	public static getInstance(): RealtimePerformanceMonitor {
		if (!RealtimePerformanceMonitor.instance) {
			RealtimePerformanceMonitor.instance = new RealtimePerformanceMonitor();
		}
		return RealtimePerformanceMonitor.instance;
	}

	// Initialize the monitor
	private initialize(): void {
		if (typeof window !== 'undefined') {
			this.setupPerformanceObservers();
			this.startRealtimeMonitoring();
		}
	}

	// Get default configuration
	private getDefaultConfig(): RealtimeConfig {
		return {
			updateInterval: 5000, // 5 seconds
			batchSize: 100,
			maxBufferSize: 1000,
			alertThresholds: {
				immediate: {
					lcp: 4000,
					fid: 300,
					cls: 0.25,
					errorRate: 0.15,
					memoryUsage: 100, // MB
				},
				warning: {
					lcp: 3000,
					fid: 200,
					cls: 0.15,
					taskCompletionTime: 8000,
				},
				rateOfChange: {
					lcpIncrease: 50, // 50% increase
					errorRateIncrease: 100, // 100% increase
					taskCompletionIncrease: 75, // 75% increase
				},
			},
			enableStreaming: true,
			budgets: {
				bundleSize: 250000,
				imageSize: 500000,
				fontSize: 100000,
				cssSize: 50000,
				jsSize: 200000,
				timeToInteractive: 5000,
				firstMeaningfulPaint: 2000,
				maxTaskTime: 50,
				maxRedirects: 3,
				maxRequests: 50,
				totalDownloadSize: 1000000,
			},
			anomalyDetection: {
				enabled: true,
				sensitivity: 'medium',
				windowSize: 20,
				minDataPoints: 10,
				threshold: 2.0,
			},
		};
	}

	// Get initial state
	private getInitialState(): RealtimeMonitoringState {
		return {
			isActive: false,
			currentMetrics: null,
			historicalMetrics: [],
			alerts: [],
			anomalies: [],
			lastUpdate: new Date(),
			sessionStats: {
				duration: 0,
				metricsCollected: 0,
				alertsTriggered: 0,
				anomaliesDetected: 0,
			},
		};
	}

	// Setup performance observers
	private setupPerformanceObservers(): void {
		// Enhanced performance observer setup
		if ('PerformanceObserver' in window) {
			// Observe long tasks
			this.observeLongTasks();

			// Observe resource timing
			this.observeResourceTiming();

			// Observe paint timing
			this.observePaintTiming();

			// Observe layout shift
			this.observeLayoutShift();
		}
	}

	// Observe long tasks
	private observeLongTasks(): void {
		try {
			const longTaskObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this.recordPerformanceEvent({
						id: `long_task_${Date.now()}`,
						timestamp: new Date(),
						type: 'system_event',
						category: 'performance',
						data: {
							type: 'long_task',
							duration: entry.duration,
							startTime: entry.startTime,
						},
						severity: entry.duration > 100 ? 'high' : 'medium',
					});
				}
			});

			if ('longtask' in PerformanceObserver.supportedEntryTypes) {
				longTaskObserver.observe({ entryTypes: ['longtask'] });
			}
		} catch (error) {
			console.warn('Long task observation not supported:', error);
		}
	}

	// Observe resource timing
	private observeResourceTiming(): void {
		const checkResources = () => {
			const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

			// Check for slow resources
			resources.forEach((resource) => {
				const loadTime = resource.responseEnd - resource.requestStart;
				if (loadTime > 5000) { // 5 seconds
					this.recordPerformanceEvent({
						id: `slow_resource_${Date.now()}`,
						timestamp: new Date(),
						type: 'alert',
						category: 'network',
						data: {
							resource: resource.name,
							loadTime,
							size: resource.transferSize,
							type: resource.initiatorType,
						},
						severity: 'warning',
					});
				}
			});
		};

		// Check every 30 seconds
		setInterval(checkResources, 30000);
	}

	// Observe paint timing
	private observePaintTiming(): void {
		if ('PerformanceObserver' in window && 'paint' in PerformanceObserver.supportedEntryTypes) {
			const paintObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this.recordPerformanceEvent({
						id: `paint_${entry.name}_${Date.now()}`,
						timestamp: new Date(),
						type: 'metric_update',
						category: 'performance',
						data: {
							metric: entry.name,
							value: entry.startTime,
						},
					});
				}
			});

			paintObserver.observe({ entryTypes: ['paint'] });
		}
	}

	// Observe layout shift
	private observeLayoutShift(): void {
		if ('PerformanceObserver' in window && 'layout-shift' in PerformanceObserver.supportedEntryTypes) {
			let clsValue = 0;
			const clsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (!(entry as any).hadRecentInput) {
						clsValue += (entry as any).value;

						// Check for high CLS
						if (clsValue > this.config.alertThresholds.warning.cls) {
							this.recordPerformanceEvent({
								id: `high_cls_${Date.now()}`,
								timestamp: new Date(),
								type: 'alert',
								category: 'performance',
								data: {
									metric: 'cls',
									value: clsValue,
									threshold: this.config.alertThresholds.warning.cls,
								},
								severity: 'warning',
							});
						}
					}
				}
			});

			clsObserver.observe({ entryTypes: ['layout-shift'] });
		}
	}

	// Start real-time monitoring
	public startRealtimeMonitoring(): void {
		if (this.state.isActive) return;

		this.state.isActive = true;
		this.state.sessionStats.duration = Date.now();

		// Start regular updates
		this.updateInterval = setInterval(() => {
			this.collectRealtimeMetrics();
		}, this.config.updateInterval);

		// Initial collection
		this.collectRealtimeMetrics();

		this.notifyObservers();
	}

	// Stop real-time monitoring
	public stopRealtimeMonitoring(): void {
		if (!this.state.isActive) return;

		this.state.isActive = false;

		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}

		// Update session duration
		this.state.sessionStats.duration = Date.now() - this.state.sessionStats.duration;

		this.notifyObservers();
	}

	// Collect real-time metrics
	private async collectRealtimeMetrics(): Promise<void> {
		try {
			const timestamp = new Date();
			const sessionId = this.getSessionId();

			// Get base metrics from performance observer
			const baseMetrics = performanceObserver.getMetrics();
			const taskHistory = performanceObserver.getTaskHistory();

			// Collect enhanced metrics
			const metrics: RealtimeMetrics = {
				timestamp,
				sessionId,

				coreWebVitals: {
					lcp: this.getLargestContentfulPaint(),
					fid: this.getFirstInputDelay(),
					cls: this.getCumulativeLayoutShift(),
					fcp: baseMetrics.firstContentfulPaint,
					ttfb: this.getTimeToFirstByte(),
				},

				runtime: {
					memoryUsage: this.getMemoryUsage(),
					cpuUsage: this.getCPUUsage(),
					taskCompletionTime: baseMetrics.taskCompletionTime,
					taskSuccessRate: baseMetrics.taskSuccessRate,
					activeTasks: this.getActiveTaskCount(),
				},

				network: {
					requestCount: this.getRequestCount(),
					totalTransferSize: this.getTotalTransferSize(),
					averageResponseTime: this.getAverageResponseTime(),
					errorRate: baseMetrics.errorRate,
				},

				interactions: {
					totalInteractions: this.getTotalInteractions(),
					averageResponseTime: baseMetrics.averageResponseTime,
					bounceRate: this.getBounceRate(),
					satisfactionScore: baseMetrics.userSatisfactionScore,
				},

				platform: {
					toolPerformance: this.calculateToolPerformance(taskHistory),
					conversionRate: this.getConversionRate(),
					featureUsage: this.getFeatureUsage(),
				},
			};

			// Update state
			this.state.currentMetrics = metrics;
			this.state.historicalMetrics.push(metrics);
			this.state.lastUpdate = timestamp;

			// Limit history size
			if (this.state.historicalMetrics.length > this.config.maxBufferSize) {
				this.state.historicalMetrics.shift();
			}

			// Update statistics
			this.state.sessionStats.metricsCollected++;

			// Check for alerts
			await this.checkForAlerts(metrics);

			// Check for anomalies
			if (this.config.anomalyDetection.enabled) {
				await this.checkForAnomalies(metrics);
			}

			// Stream data if enabled
			if (this.config.enableStreaming) {
				await this.streamMetrics(metrics);
			}

			this.notifyObservers();
		} catch (error) {
			console.error('Failed to collect real-time metrics:', error);
		}
	}

	// Get Largest Contentful Paint
	private getLargestContentfulPaint(): number {
		const entries = performance.getEntriesByType('largest-contentful-paint');
		return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
	}

	// Get First Input Delay
	private getFirstInputDelay(): number {
		const entries = performance.getEntriesByType('first-input');
		return entries.length > 0 ? entries[0].processingStart - entries[0].startTime : 0;
	}

	// Get Cumulative Layout Shift
	private getCumulativeLayoutShift(): number {
		const entries = performance.getEntriesByType('layout-shift');
		return entries.reduce((sum, entry) => {
			return sum + ((entry as any).hadRecentInput ? 0 : (entry as any).value);
		}, 0);
	}

	// Get Time to First Byte
	private getTimeToFirstByte(): number {
		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		return navigation ? navigation.responseStart - navigation.requestStart : 0;
	}

	// Get memory usage (MB)
	private getMemoryUsage(): number {
		if (typeof window !== 'undefined' && 'memory' in performance) {
			const memory = (performance as any).memory;
			return memory.usedJSHeapSize / 1024 / 1024;
		}
		return 0;
	}

	// Get CPU usage (simplified)
	private getCPUUsage(): number {
		const start = performance.now();
		const operations = 500000;
		for (let i = 0; i < operations; i++) {
			Math.random();
		}
		const end = performance.now();
		return Math.min(100, (end - start) / 10); // Normalize and cap at 100
	}

	// Get active task count
	private getActiveTaskCount(): number {
		// This would need to be integrated with task management system
		return Math.floor(Math.random() * 5); // Placeholder
	}

	// Get request count
	private getRequestCount(): number {
		return performance.getEntriesByType('resource').length;
	}

	// Get total transfer size
	private getTotalTransferSize(): number {
		const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		return resources.reduce((total, resource) => total + (resource.transferSize || 0), 0);
	}

	// Get average response time
	private getAverageResponseTime(): number {
		const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		if (resources.length === 0) return 0;

		const totalTime = resources.reduce((sum, resource) => {
			return sum + (resource.responseEnd - resource.requestStart);
		}, 0);

		return totalTime / resources.length;
	}

	// Get total interactions
	private getTotalInteractions(): number {
		// This would need to be integrated with user interaction tracking
		return this.eventBuffer.filter(e => e.type === 'user_action').length;
	}

	// Get bounce rate
	private getBounceRate(): number {
		// Simplified bounce rate calculation
		const interactions = this.getTotalInteractions();
		const timeOnPage = Date.now() - this.state.sessionStats.duration;
		return interactions === 0 && timeOnPage < 30000 ? 1 : 0; // Bounce if no interactions in 30s
	}

	// Calculate tool performance
	private calculateToolPerformance(taskHistory: TaskPerformance[]): number {
		if (taskHistory.length === 0) return 0;

		const recentTasks = taskHistory.slice(-20);
		const successRate = recentTasks.filter(t => t.success).length / recentTasks.length;
		const avgDuration = recentTasks.reduce((sum, t) => sum + t.duration, 0) / recentTasks.length;

		// Combine success rate and speed
		const speedScore = Math.max(0, 1 - (avgDuration / 10000));
		return (successRate * 0.6 + speedScore * 0.4) * 100;
	}

	// Get conversion rate
	private getConversionRate(): number {
		// This would need to be integrated with conversion tracking
		return 0.05; // 5% placeholder
	}

	// Get feature usage
	private getFeatureUsage(): Record<string, number> {
		// This would need to be integrated with feature usage tracking
		return {
			'json-formatter': 0.35,
			'base64-converter': 0.25,
			'url-encoder': 0.20,
			'hash-generator': 0.15,
			'other': 0.05,
		};
	}

	// Get session ID
	private getSessionId(): string {
		return `realtime_session_${Date.now()}`;
	}

	// Check for alerts
	private async checkForAlerts(metrics: RealtimeMetrics): Promise<void> {
		const alerts: RealtimeAlert[] = [];

		// Check immediate thresholds
		if (metrics.coreWebVitals.lcp > this.config.alertThresholds.immediate.lcp) {
			alerts.push(this.createAlert(
				'critical',
				'performance',
				'lcp',
				metrics.coreWebVitals.lcp,
				this.config.alertThresholds.immediate.lcp,
				'Largest Contentful Paint is critically slow',
				'Poor user experience and high bounce rates',
				[
					'Optimize server response time',
					'Compress and optimize images',
					'Remove render-blocking resources',
					'Use efficient caching strategies',
				]
			));
		}

		if (metrics.runtime.memoryUsage > this.config.alertThresholds.immediate.memoryUsage) {
			alerts.push(this.createAlert(
				'critical',
				'performance',
				'memory',
				metrics.runtime.memoryUsage,
				this.config.alertThresholds.immediate.memoryUsage,
				'Memory usage is critically high',
				'Risk of browser crashes and poor performance',
				[
					'Optimize JavaScript execution',
					'Reduce memory allocations',
					'Implement object pooling',
					'Profile memory usage patterns',
				]
			));
		}

		if (metrics.network.errorRate > this.config.alertThresholds.immediate.errorRate) {
			alerts.push(this.createAlert(
				'critical',
				'network',
				'errorRate',
				metrics.network.errorRate,
				this.config.alertThresholds.immediate.errorRate,
				'Error rate is critically high',
				'Users are experiencing failures',
				[
					'Check API endpoints',
					'Implement better error handling',
					'Review recent deployments',
					'Monitor server health',
				]
			));
		}

		// Check warning thresholds
		if (metrics.coreWebVitals.lcp > this.config.alertThresholds.warning.lcp) {
			alerts.push(this.createAlert(
				'warning',
				'performance',
				'lcp',
				metrics.coreWebVitals.lcp,
				this.config.alertThresholds.warning.lcp,
				'Largest Contentful Paint is slow',
				'Degraded user experience',
				[
					'Review resource loading order',
					'Optimize critical resources',
					'Consider lazy loading',
				]
			));
		}

		if (metrics.runtime.taskCompletionTime > this.config.alertThresholds.warning.taskCompletionTime) {
			alerts.push(this.createAlert(
				'warning',
				'platform',
				'taskCompletion',
				metrics.runtime.taskCompletionTime,
				this.config.alertThresholds.warning.taskCompletionTime,
				'Task completion time is slow',
				'Users waiting too long for results',
				[
					'Optimize algorithms',
					'Reduce computational complexity',
					'Implement progress indicators',
					'Consider web workers for heavy tasks',
				]
			));
		}

		// Add alerts to state
		this.state.alerts.push(...alerts);
		this.state.sessionStats.alertsTriggered += alerts.length;

		// Limit alerts history
		if (this.state.alerts.length > 100) {
			this.state.alerts.splice(0, this.state.alerts.length - 100);
		}
	}

	// Create alert
	private createAlert(
		type: 'critical' | 'warning' | 'info',
		category: 'performance' | 'user-experience' | 'platform' | 'network',
		metric: string,
		currentValue: number,
		thresholdValue: number,
		description: string,
		impact: string,
		recommendations: string[]
	): RealtimeAlert {
		const deviation = ((currentValue - thresholdValue) / thresholdValue) * 100;

		return {
			id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type,
			category,
			metric,
			currentValue,
			thresholdValue,
			deviation,
			description,
			impact,
			recommendations,
			resolved: false,
		};
	}

	// Check for anomalies
	private async checkForAnomalies(metrics: RealtimeMetrics): Promise<void> {
		const anomalies = await this.anomalyDetector.detectAnomalies(metrics);

		this.state.anomalies.push(...anomalies);
		this.state.sessionStats.anomaliesDetected += anomalies.length;

		// Limit anomalies history
		if (this.state.anomalies.length > 50) {
			this.state.anomalies.splice(0, this.state.anomalies.length - 50);
		}
	}

	// Stream metrics
	private async streamMetrics(metrics: RealtimeMetrics): Promise<void> {
		if (!this.config.streamEndpoint) return;

		try {
			const response = await fetch(this.config.streamEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					timestamp: metrics.timestamp,
					sessionId: metrics.sessionId,
					metrics,
				}),
			});

			if (!response.ok) {
				console.warn('Failed to stream metrics:', response.statusText);
			}
		} catch (error) {
			console.warn('Metrics streaming failed:', error);
		}
	}

	// Record performance event
	public recordPerformanceEvent(event: PerformanceEvent): void {
		this.eventBuffer.push(event);

		// Limit buffer size
		if (this.eventBuffer.length > this.config.maxBufferSize) {
			this.eventBuffer.shift();
		}
	}

	// Subscribe to state updates
	public subscribe(callback: (state: RealtimeMonitoringState) => void): () => void {
		this.observers.add(callback);
		return () => this.observers.delete(callback);
	}

	// Notify observers
	private notifyObservers(): void {
		this.observers.forEach(callback => callback(this.state));
	}

	// Get current state
	public getState(): RealtimeMonitoringState {
		return { ...this.state };
	}

	// Get current metrics
	public getCurrentMetrics(): RealtimeMetrics | null {
		return this.state.currentMetrics;
	}

	// Get active alerts
	public getActiveAlerts(): RealtimeAlert[] {
		return this.state.alerts.filter(alert => !alert.resolved);
	}

	// Get recent anomalies
	public getRecentAnomalies(limit: number = 10): PerformanceAnomaly[] {
		return this.state.anomalies.slice(-limit);
	}

	// Resolve alert
	public resolveAlert(alertId: string, resolution: string): void {
		const alert = this.state.alerts.find(a => a.id === alertId);
		if (alert) {
			alert.resolved = true;
			alert.resolvedAt = new Date();
			alert.resolution = resolution;
			this.notifyObservers();
		}
	}

	// Update configuration
	public updateConfig(updates: Partial<RealtimeConfig>): void {
		this.config = { ...this.config, ...updates };

		// Update anomaly detector config
		if (updates.anomalyDetection) {
			this.anomalyDetector.updateConfig(this.config.anomalyDetection);
		}

		// Restart monitoring if interval changed
		if (updates.updateInterval && this.state.isActive) {
			this.stopRealtimeMonitoring();
			this.startRealtimeMonitoring();
		}
	}

	// Export monitoring data
	public exportData(): string {
		const exportData = {
			timestamp: new Date().toISOString(),
			state: this.state,
			config: this.config,
			events: this.eventBuffer.slice(-100), // Last 100 events
		};

		return JSON.stringify(exportData, null, 2);
	}

	// Cleanup
	public cleanup(): void {
		this.stopRealtimeMonitoring();
		this.observers.clear();
		this.eventBuffer = [];
		this.metricHistory = [];
	}
}

// Anomaly Detection System
class AnomalyDetector {
	private config: AnomalyDetectionConfig;
	private metricHistory: Map<string, number[]> = new Map();

	constructor(config: AnomalyDetectionConfig) {
		this.config = config;
	}

	// Detect anomalies in metrics
	async detectAnomalies(metrics: RealtimeMetrics): Promise<PerformanceAnomaly[]> {
		if (!this.config.enabled) return [];

		const anomalies: PerformanceAnomaly[] = [];

		// Check each metric for anomalies
		const metricChecks = [
			{ name: 'lcp', value: metrics.coreWebVitals.lcp, category: 'Core Web Vitals' },
			{ name: 'fid', value: metrics.coreWebVitals.fid, category: 'Core Web Vitals' },
			{ name: 'cls', value: metrics.coreWebVitals.cls, category: 'Core Web Vitals' },
			{ name: 'memoryUsage', value: metrics.runtime.memoryUsage, category: 'Runtime' },
			{ name: 'taskCompletionTime', value: metrics.runtime.taskCompletionTime, category: 'Platform' },
			{ name: 'errorRate', value: metrics.network.errorRate, category: 'Network' },
		];

		for (const check of metricChecks) {
			const anomaly = await this.checkMetricForAnomaly(check.name, check.value, check.category);
			if (anomaly) {
				anomalies.push(anomaly);
			}
		}

		return anomalies;
	}

	// Check specific metric for anomaly
	private async checkMetricForAnomaly(
		metricName: string,
		currentValue: number,
		category: string
	): Promise<PerformanceAnomaly | null> {
		// Update history
		if (!this.metricHistory.has(metricName)) {
			this.metricHistory.set(metricName, []);
		}

		const history = this.metricHistory.get(metricName)!;
		history.push(currentValue);

		// Limit history size
		if (history.length > this.config.windowSize) {
			history.shift();
		}

		// Need minimum data points
		if (history.length < this.config.minDataPoints) {
			return null;
		}

		// Calculate statistics
		const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
		const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
		const standardDeviation = Math.sqrt(variance);

		// Check for anomaly (threshold standard deviations from mean)
		const deviation = Math.abs(currentValue - mean);
		const threshold = this.config.threshold * standardDeviation;

		if (deviation > threshold) {
			const severity = this.calculateSeverity(deviation, threshold);

			return {
				id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				metric: metricName,
				expectedValue: mean,
				actualValue: currentValue,
				deviation: (deviation / mean) * 100, // Percentage deviation
				severity,
				description: `${metricName} is ${deviation.toFixed(2)} away from expected value`,
				potentialCauses: this.identifyPotentialCauses(metricName, currentValue, mean),
				investigationSteps: this.getInvestigationSteps(metricName),
			};
		}

		return null;
	}

	// Calculate anomaly severity
	private calculateSeverity(deviation: number, threshold: number): 'low' | 'medium' | 'high' {
		const ratio = deviation / threshold;

		if (this.config.sensitivity === 'high') {
			if (ratio > 3) return 'high';
			if (ratio > 2) return 'medium';
			return 'low';
		} else if (this.config.sensitivity === 'medium') {
			if (ratio > 4) return 'high';
			if (ratio > 2.5) return 'medium';
			return 'low';
		} else { // low sensitivity
			if (ratio > 5) return 'high';
			if (ratio > 3) return 'medium';
			return 'low';
		}
	}

	// Identify potential causes for anomaly
	private identifyPotentialCauses(metricName: string, currentValue: number, expectedValue: number): string[] {
		const causes: string[] = [];

		switch (metricName) {
			case 'lcp':
				if (currentValue > expectedValue) {
					causes.push(
						'Large images or unoptimized media',
						'Slow server response time',
						'Render-blocking JavaScript/CSS',
						'Client-side rendering delays',
						'Network congestion'
					);
				}
				break;

			case 'fid':
				if (currentValue > expectedValue) {
					causes.push(
						'Heavy JavaScript execution',
						'Long-running tasks blocking main thread',
						'Complex event handlers',
						'Third-party script interference'
					);
				}
				break;

			case 'memoryUsage':
				if (currentValue > expectedValue) {
					causes.push(
						'Memory leaks in JavaScript',
						'Large data structures not cleaned up',
						'Excessive DOM nodes',
						'Inefficient object pooling'
					);
				}
				break;

			case 'errorRate':
				if (currentValue > expectedValue) {
					causes.push(
						'API endpoint failures',
						'Network connectivity issues',
						'Invalid user input handling',
						'Recent code deployment issues'
					);
				}
				break;
		}

		return causes;
	}

	// Get investigation steps for anomaly
	private getInvestigationSteps(metricName: string): string[] {
		switch (metricName) {
			case 'lcp':
				return [
					'Analyze Lighthouse performance report',
					'Check server response times',
					'Review image optimization',
					'Examine resource loading order',
					'Monitor CDN performance',
				];

			case 'fid':
				return [
					'Profile JavaScript execution time',
					'Identify long tasks',
					'Review event handler efficiency',
					'Check for main thread blocking',
					'Analyze third-party script impact',
				];

			case 'memoryUsage':
				return [
					'Use browser memory profiling tools',
					'Check for memory leaks',
					'Review object lifecycle management',
					'Analyze heap snapshots',
					'Monitor garbage collection patterns',
				];

			default:
				return [
					'Review recent code changes',
					'Check system resource utilization',
					'Analyze performance logs',
					'Correlate with user reports',
					'Review error logs',
				];
		}
	}

	// Update configuration
	public updateConfig(config: AnomalyDetectionConfig): void {
		this.config = config;
	}
}

// Export singleton instance
export const realtimePerformanceMonitor = RealtimePerformanceMonitor.getInstance();
