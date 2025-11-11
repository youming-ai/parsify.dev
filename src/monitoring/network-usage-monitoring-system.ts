/**
 * Advanced Network Usage Monitoring and Optimization System
 * Comprehensive network performance analysis with intelligent optimization
 */

import { resourceUsageOptimizer, type ResourceMetrics } from './resource-usage-optimizer';

// Network monitoring types
export interface NetworkMetrics {
	// Basic network metrics
	bandwidth: {
		current: number; // bytes per second
		available: number; // bytes per second
		utilization: number; // 0-1 percentage
		efficiency: number; // 0-1
	};

	// Request/response metrics
	requests: {
		total: number;
		successful: number;
		failed: number;
		pending: number;
		timeout: number;
		retries: number;
		cacheHits: number;
		cacheMisses: number;
	};

	// Performance metrics
	latency: {
		average: number; // milliseconds
		p50: number;
		p90: number;
		p95: number;
		p99: number;
		min: number;
		max: number;
	};

	throughput: {
		current: number; // requests per second
		peak: number;
		average: number;
		trend: 'increasing' | 'decreasing' | 'stable';
	};

	// Data transfer metrics
	dataTransfer: {
		totalBytes: number;
		compressedBytes: number;
		savedBytes: number;
		compressionRatio: number; // 0-1
		efficiency: number; // 0-1
	};

	// Connection metrics
	connections: {
		active: number;
		pending: number;
		total: number;
		reused: number;
		new: number;
		concurrent: number;
		maxConcurrent: number;
	};

	// Error analysis
	errors: {
		rate: number; // 0-1
		types: Record<string, number>;
		severity: Record<string, number>;
		resolution: Record<string, number>;
	};

	// Resource usage by type
	resourcesByType: Record<string, {
		count: number;
		size: number;
		averageTime: number;
		successRate: number;
		errorRate: number;
	}>;

	// Network quality
	networkQuality: {
		rtt: number; // round trip time
		packetLoss: number; // 0-1
		jitter: number;
		bandwidth: number;
		effectiveType: NetworkEffectiveType;
	};

	// Optimization opportunities
	optimizationTargets: NetworkOptimizationTarget[];
	efficiencyScore: number; // 0-1

	// Timestamps
	timestamp: Date;
	samplingInterval: number; // milliseconds
}

export interface NetworkRequest {
	id: string;
	url: string;
	method: string;
	status: number;
	startTime: number;
	duration: number; // milliseconds
	size: number; // bytes
	compressedSize: number; // bytes
	cached: boolean;
	priority: RequestPriority;
	type: ResourceType;
 initiator: string;
	retries: number;
	timeout: boolean;
	error?: NetworkError;
	optimization?: RequestOptimization;
}

export interface NetworkError {
	type: ErrorType;
	code: string;
	message: string;
	recoverable: boolean;
	severity: 'low' | 'medium' | 'high' | 'critical';
	timestamp: number;
}

export type ErrorType =
	| 'network-error'
	| 'timeout'
	| 'server-error'
	| 'client-error'
	| 'dns-error'
	| 'ssl-error'
	| 'connection-error'
	| 'parse-error'
	| 'authorization-error';

export type RequestPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

export type ResourceType =
	| 'document'
	| 'stylesheet'
	| 'script'
	| 'image'
	| 'font'
	| 'media'
	| 'object'
	| 'xhr'
	| 'fetch'
	| 'websocket'
	| 'other';

export interface RequestOptimization {
	saved: number; // bytes
	techniques: OptimizationTechnique[];
	impact: 'low' | 'medium' | 'high' | 'critical';
	applied: boolean;
}

export type OptimizationTechnique =
	| 'compression'
	| 'caching'
	| 'bundling'
	| 'minification'
	| 'lazy-loading'
	| 'prefetching'
	| 'cdn'
	| 'http2'
	| 'webp'
	| 'response-format-optimization';

export type NetworkEffectiveType =
	| 'slow-2g'
	| '2g'
	| '3g'
	| '4g'
	| '5g'
	| 'wifi'
	| 'ethernet';

export interface NetworkOptimizationTarget {
	id: string;
	name: string;
	type: OptimizationType;
	priority: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	currentMetrics: NetworkTargetMetrics;
	targetMetrics: NetworkTargetMetrics;
	strategies: NetworkOptimizationStrategy[];
	estimatedBenefit: number; // percentage
	implementationEffort: 'low' | 'medium' | 'high';
	affectedResources: string[];
}

export type OptimizationType =
	| 'compression'
	| 'caching'
	| 'cdn'
	| 'bundling'
	| 'lazy-loading'
	| 'prefetching'
	| 'protocol-optimization'
	| 'response-format'
	| 'connection-pooling'
	| 'request-batching';

export interface NetworkTargetMetrics {
	bandwidthUsage: number; // 0-1
	latency: number; // milliseconds
	errorRate: number; // 0-1
	cacheHitRate: number; // 0-1
	compressionRatio: number; // 0-1
}

export interface NetworkOptimizationStrategy {
	id: string;
	name: string;
	description: string;
	implementation: string;
	expectedImprovement: ExpectedNetworkImprovement;
	effort: EffortLevel;
	risk: RiskLevel;
	prerequisites: string[];
	technologies: string[];
}

export interface ExpectedNetworkImprovement {
	metric: string;
	improvement: number; // percentage
	confidence: number; // 0-1
	timeToImplement: number; // hours
}

export type EffortLevel = 'low' | 'medium' | 'high';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface NetworkAnalysisReport {
	summary: {
		totalRequests: number;
		successRate: number; // 0-1
		averageLatency: number; // milliseconds
		totalBandwidth: number; // bytes
		efficiencyScore: number; // 0-1
		totalOptimizations: number;
		estimatedSavings: number; // bytes
		analysisDuration: number; // milliseconds
	};

	metrics: NetworkMetrics;
	optimizationTargets: NetworkOptimizationTarget[];
	requestAnalysis: RequestAnalysis;
	performanceIssues: NetworkPerformanceIssue[];

	recommendations: NetworkRecommendation[];
	implementationPlan: NetworkImplementationPlan;

	generatedAt: Date;
	dataQuality: {
		sampleCount: number;
		coverage: number; // 0-1
		accuracy: number; // 0-1
	};
}

export interface RequestAnalysis {
	byType: Record<ResourceType, RequestTypeAnalysis>;
	byStatus: Record<number, number>;
	byDomain: Record<string, DomainAnalysis>;
	patterns: RequestPattern[];
	trends: RequestTrend[];
	bottlenecks: RequestBottleneck[];
}

export interface RequestTypeAnalysis {
	count: number;
	size: number;
	averageTime: number;
	successRate: number;
	cacheHitRate: number;
	optimizationPotential: number; // percentage
}

export interface DomainAnalysis {
	domain: string;
	requestCount: number;
	totalSize: number;
	averageLatency: number;
	errorRate: number;
	sslEnabled: boolean;
	httpVersion: string;
	optimizations: string[];
}

export interface RequestPattern {
	type: 'sequential' | 'parallel' | 'batched' | 'waterfall' | 'cascading';
	detection: string;
	description: string;
	impact: 'low' | 'medium' | 'high' | 'critical';
	optimization: string;
}

export interface RequestTrend {
	metric: string;
	direction: 'improving' | 'degrading' | 'stable';
	change: number; // percentage
	confidence: number; // 0-1
	prediction: number; // next value prediction
}

export interface RequestBottleneck {
	id: string;
	type: BottleneckType;
	location: string;
	impact: number; // 0-1
	duration: number; // milliseconds
	description: string;
	solutions: string[];
}

export type BottleneckType =
	| 'slow-response'
	| 'large-payload'
	| 'network-congestion'
	| 'connection-limit'
	| 'ssl-handshake'
	| 'dns-resolution'
	| 'compression-missing'
	| 'cache-miss'
	| 'protocol-inefficiency';

export interface NetworkPerformanceIssue {
	id: string;
	type: IssueType;
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	impact: IssueImpact;
	affectedRequests: string[];
	solutions: IssueSolution[];
	frequency: number; // occurrences per minute
}

export type IssueType =
	| 'high-latency'
	| 'bandwidth-waste'
	| 'connection-throttling'
	| 'missing-caching'
	| 'poor-compression'
	| 'ssl-issues'
	| 'dns-problems'
	| 'protocol-limitations';

export interface IssueImpact {
	performance: number; // 0-1
	userExperience: number; // 0-1
	cost: number; // 0-1
	availability: number; // 0-1
}

export interface IssueSolution {
	strategy: string;
	description: string;
	implementation: string;
	expectedBenefit: string;
	confidence: number; // 0-1
	effort: EffortLevel;
	risk: RiskLevel;
}

export interface NetworkRecommendation {
	id: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	category: RecommendationCategory;
	title: string;
	description: string;
	problem: string;
	solution: string;
	expectedBenefit: string;
	implementation: NetworkImplementationDetails;
	relatedIssues: string[];
	confidence: number; // 0-1
	roi: number; // return on investment
}

export type RecommendationCategory =
	| 'performance'
	| 'cost'
	| 'reliability'
	| 'security'
	| 'scalability';

export interface NetworkImplementationDetails {
	description: string;
	steps: string[];
	estimatedTime: string;
	resources: string[];
	technologies: string[];
	risks: RiskLevel[];
	cost: {
		initial: number;
		ongoing: number;
		savings: number;
	};
}

export interface NetworkImplementationPlan {
	phase: NetworkImplementationPhase[];
	estimatedTotalEffort: number; // hours
	estimatedTotalSavings: number; // bytes
	estimatedCostSavings: number; // currency
	risks: Risk[];
	successMetrics: string[];
}

export interface NetworkImplementationPhase {
	name: string;
	duration: number; // hours
	tasks: NetworkImplementationTask[];
	dependencies: string[];
	expectedOutcome: string;
	savings: number; // bytes
}

export interface NetworkImplementationTask {
	name: string;
	description: string;
	effort: number; // hours
	risk: RiskLevel;
	expectedSavings: number; // bytes
	technologies: string[];
}

export interface Risk {
	description: string;
	probability: number; // 0-1
	impact: number; // 0-1
	mitigation: string;
}

export interface NetworkMonitoringConfig {
	// Monitoring settings
	monitoring: {
		samplingInterval: number; // milliseconds
		maxRequests: number;
		enableDetailedTracking: boolean;
		enablePayloadAnalysis: boolean;
		enableStackTraceCapture: boolean;
		deepInspection: boolean;
	};

	// Analysis settings
	analysis: {
		bottleneckThreshold: number; // milliseconds
		optimizationThreshold: number; // percentage
		errorRateThreshold: number; // 0-1
		latencyThreshold: number; // milliseconds
		bandwidthThreshold: number; // MB
		confidenceThreshold: number; // 0-1
	};

	// Optimization settings
	optimization: {
		enableAutoOptimization: boolean;
		aggressiveMode: boolean;
		compressionEnabled: boolean;
		cachingEnabled: boolean;
		cdnenabled: boolean;
		lazyLoadingEnabled: boolean;
		prefetchingEnabled: boolean;
		batchingEnabled: boolean;
	};

	// Alert settings
	alerts: {
		latencyThreshold: number; // milliseconds
		errorRateThreshold: number; // 0-1
		bandwidthThreshold: number; // MB
		timeoutThreshold: number; // milliseconds
		enableRealTimeAlerts: boolean;
	};

	// Network quality settings
	networkQuality: {
		enableNetworkQualityAPI: boolean;
		enableConnectionMonitoring: boolean;
		enableBandwidthEstimation: boolean;
		rttThreshold: number; // milliseconds
	};

	// Performance settings
	performance: {
		enablePerformanceTiming: boolean;
		enableResourceTiming: boolean;
		enableNavigationTiming: boolean;
		enableServerTiming: boolean;
		enablePaintTiming: boolean;
	};
}

export class AdvancedNetworkMonitor {
	private static instance: AdvancedNetworkMonitor;
	private config: NetworkMonitoringConfig;
	private isMonitoring = false;
	private monitoringInterval?: NodeJS.Timeout;
	private requests: NetworkRequest[] = [];
	private networkObserver?: PerformanceObserver;
	private navigationObserver?: PerformanceObserver;
	private resourceObserver?: PerformanceObserver;
	private optimizationHistory: NetworkOptimizationHistory[] = [];
	private highLatencyCallback?: () => void;
	private errorDetectedCallbacks: Array<(error: NetworkError, request: NetworkRequest) => void> = [];
	private slowRequestCallbacks: Array<(request: NetworkRequest) => void> = [];

	private constructor() {
		this.config = this.getDefaultConfig();
	}

	public static getInstance(): AdvancedNetworkMonitor {
		if (!AdvancedNetworkMonitor.instance) {
			AdvancedNetworkMonitor.instance = new AdvancedNetworkMonitor();
		}
		return AdvancedNetworkMonitor.instance;
	}

	// Initialize network monitoring
	public async initialize(config?: Partial<NetworkMonitoringConfig>): Promise<void> {
		if (this.isMonitoring) {
			console.warn('Network monitor already initialized');
			return;
		}

		// Merge configuration
		if (config) {
			this.config = { ...this.config, ...config };
		}

		try {
			// Setup performance observers
			await this.setupPerformanceObservers();

			// Initialize network quality monitoring
			this.initializeNetworkQualityMonitoring();

			// Setup request interceptors
			this.setupRequestInterceptors();

			console.log('Advanced network monitor initialized');
		} catch (error) {
			console.error('Failed to initialize network monitor:', error);
			throw error;
		}
	}

	// Start network monitoring
	public startMonitoring(): void {
		if (this.isMonitoring) {
			console.warn('Network monitoring already started');
			return;
		}

		console.log('Starting network monitoring');

		// Start performance observers
		this.startPerformanceObservers();

		// Start periodic analysis
		this.startPeriodicAnalysis();

		this.isMonitoring = true;
	}

	// Stop network monitoring
	public stopMonitoring(): void {
		if (!this.isMonitoring) return;

		// Stop periodic analysis
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
		}

		// Stop performance observers
		this.disconnectObservers();

		this.isMonitoring = false;
		console.log('Stopped network monitoring');
	}

	// Analyze network performance
	public async analyzeNetworkPerformance(): Promise<NetworkAnalysisReport> {
		const startTime = Date.now();
		console.log('Starting comprehensive network performance analysis');

		try {
			// Collect current metrics
			const currentMetrics = this.collectNetworkMetrics();

			// Analyze requests
			const requestAnalysis = this.analyzeRequests();

			// Identify performance issues
			const performanceIssues = this.identifyPerformanceIssues(currentMetrics, requestAnalysis);

			// Identify optimization targets
			const optimizationTargets = this.identifyOptimizationTargets(currentMetrics, performanceIssues);

			// Generate recommendations
			const recommendations = this.generateRecommendations(performanceIssues, optimizationTargets);

			// Create implementation plan
			const implementationPlan = this.createImplementationPlan(recommendations);

			// Calculate summary
			const summary = {
				totalRequests: currentMetrics.requests.total,
				successRate: currentMetrics.requests.successful / currentMetrics.requests.total,
				averageLatency: currentMetrics.latency.average,
				totalBandwidth: currentMetrics.dataTransfer.totalBytes,
				efficiencyScore: currentMetrics.efficiencyScore,
				totalOptimizations: optimizationTargets.length,
				estimatedSavings: this.calculateEstimatedSavings(optimizationTargets),
				analysisDuration: Date.now() - startTime,
			};

			const report: NetworkAnalysisReport = {
				summary,
				metrics: currentMetrics,
				optimizationTargets,
				requestAnalysis,
				performanceIssues,
				recommendations,
				implementationPlan,
				generatedAt: new Date(),
				dataQuality: {
					sampleCount: this.requests.length,
					coverage: Math.min(this.requests.length / 100, 1),
					accuracy: this.calculateDataAccuracy(),
				},
			};

			console.log(`Network performance analysis completed in ${summary.analysisDuration}ms`);
			console.log(`Analyzed ${summary.totalRequests} requests with ${(summary.successRate * 100).toFixed(1)}% success rate`);
			console.log(`Estimated savings: ${(summary.estimatedSavings / 1024 / 1024).toFixed(1)} MB`);

			return report;

		} catch (error) {
			console.error('Network performance analysis failed:', error);
			throw error;
		}
	}

	// Perform network optimization
	public async performOptimization(targetIds?: string[]): Promise<NetworkOptimizationReport> {
		const startTime = Date.now();
		const optimizationReport: NetworkOptimizationReport = {
			totalOptimizations: 0,
			successfulOptimizations: 0,
			failedOptimizations: 0,
			bytesSaved: 0,
			latencyReduction: 0,
			errorReduction: 0,
			timeSpent: 0,
			actions: [],
		};

		try {
			console.log('Starting network optimization');

			// Get current metrics
			const beforeMetrics = this.collectNetworkMetrics();

			// Get optimization targets
			const targets = this.identifyOptimizationTargets(beforeMetrics, []);
			const targetsToOptimize = targetIds
				? targets.filter(t => targetIds.includes(t.id))
				: targets.filter(t => t.priority === 'critical' || t.priority === 'high');

			// Apply optimizations
			for (const target of targetsToOptimize) {
				optimizationReport.totalOptimizations++;

				const actionStartTime = Date.now();
				try {
					const improvement = await this.applyOptimization(target);

					optimizationReport.successfulOptimizations++;
					optimizationReport.bytesSaved += improvement.bytesSaved;
					optimizationReport.latencyReduction += improvement.latencyReduction;
					optimizationReport.errorReduction += improvement.errorReduction;
					optimizationReport.actions.push({
						targetId: target.id,
						targetName: target.name,
						strategy: improvement.strategy,
						success: true,
						bytesSaved: improvement.bytesSaved,
						latencyReduction: improvement.latencyReduction,
						errorReduction: improvement.errorReduction,
						duration: Date.now() - actionStartTime,
					});

				} catch (error) {
					optimizationReport.failedOptimizations++;
					optimizationReport.actions.push({
						targetId: target.id,
						targetName: target.name,
						strategy: 'unknown',
						success: false,
						bytesSaved: 0,
						latencyReduction: 0,
						errorReduction: 0,
						duration: Date.now() - actionStartTime,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			// Wait for optimizations to take effect
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Calculate final metrics
			const afterMetrics = this.collectNetworkMetrics();
			optimizationReport.bytesSaved = Math.max(0, beforeMetrics.dataTransfer.totalBytes - afterMetrics.dataTransfer.totalBytes);
			optimizationReport.latencyReduction = Math.max(0, (beforeMetrics.latency.average - afterMetrics.latency.average) / beforeMetrics.latency.average) * 100;
			optimizationReport.errorReduction = Math.max(0, (beforeMetrics.errors.rate - afterMetrics.errors.rate) / beforeMetrics.errors.rate) * 100;
			optimizationReport.timeSpent = Date.now() - startTime;

			// Store optimization history
			this.optimizationHistory.push({
				timestamp: new Date(),
				report: optimizationReport,
				beforeMetrics,
				afterMetrics,
			});

			// Limit history size
			if (this.optimizationHistory.length > 100) {
				this.optimizationHistory.shift();
			}

			console.log(`Network optimization completed: ${optimizationReport.bytesSaved} bytes saved`);
			return optimizationReport;

		} catch (error) {
			console.error('Network optimization failed:', error);
			optimizationReport.timeSpent = Date.now() - startTime;
			return optimizationReport;
		}
	}

	// Get current network metrics
	public getCurrentMetrics(): NetworkMetrics {
		return this.collectNetworkMetrics();
	}

	// Get optimization history
	public getOptimizationHistory(): NetworkOptimizationHistory[] {
		return [...this.optimizationHistory];
	}

	// Get recent requests
	public getRecentRequests(count: number = 100): NetworkRequest[] {
		return this.requests.slice(-count);
	}

	// Register high latency callback
	public onHighLatency(callback: () => void): void {
		this.highLatencyCallback = callback;
	}

	// Register error detection callback
	public onErrorDetected(callback: (error: NetworkError, request: NetworkRequest) => void): void {
		this.errorDetectedCallbacks.push(callback);
	}

	// Register slow request callback
	public onSlowRequest(callback: (request: NetworkRequest) => void): void {
		this.slowRequestCallbacks.push(callback);
	}

	// Private methods

	private getDefaultConfig(): NetworkMonitoringConfig {
		return {
			monitoring: {
				samplingInterval: 5000, // 5 seconds
				maxRequests: 1000,
				enableDetailedTracking: true,
				enablePayloadAnalysis: true,
				enableStackTraceCapture: false,
				deepInspection: false,
			},

			analysis: {
				bottleneckThreshold: 1000, // 1 second
				optimizationThreshold: 10, // 10% improvement
				errorRateThreshold: 0.05, // 5%
				latencyThreshold: 2000, // 2 seconds
				bandwidthThreshold: 10, // 10 MB
				confidenceThreshold: 0.7, // 70%
			},

			optimization: {
				enableAutoOptimization: true,
				aggressiveMode: false,
				compressionEnabled: true,
				cachingEnabled: true,
				cdnenabled: true,
				lazyLoadingEnabled: true,
				prefetchingEnabled: true,
				batchingEnabled: true,
			},

			alerts: {
				latencyThreshold: 3000, // 3 seconds
				errorRateThreshold: 0.1, // 10%
				bandwidthThreshold: 50, // 50 MB
				timeoutThreshold: 10000, // 10 seconds
				enableRealTimeAlerts: true,
			},

			networkQuality: {
				enableNetworkQualityAPI: true,
				enableConnectionMonitoring: true,
				enableBandwidthEstimation: true,
				rttThreshold: 1000, // 1 second
			},

			performance: {
				enablePerformanceTiming: true,
				enableResourceTiming: true,
				enableNavigationTiming: true,
				enableServerTiming: true,
				enablePaintTiming: true,
			},
		};
	}

	private async setupPerformanceObservers(): Promise<void> {
		if ('PerformanceObserver' in window) {
			// Setup resource observer
			this.resourceObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				for (const entry of entries) {
					if (entry.entryType === 'resource') {
						this.handleResourceEntry(entry as PerformanceResourceTiming);
					}
				}
			});

			// Setup navigation observer
			this.navigationObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				for (const entry of entries) {
					if (entry.entryType === 'navigation') {
						this.handleNavigationEntry(entry as PerformanceNavigationTiming);
					}
				}
			});

			// Setup network observer for additional timing
			this.networkObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				for (const entry of entries) {
					this.handlePerformanceEntry(entry as PerformanceEntry);
				}
			});
		}
	}

	private startPerformanceObservers(): void {
		try {
			if (this.resourceObserver) {
				this.resourceObserver.observe({ entryTypes: ['resource'] });
			}

			if (this.navigationObserver) {
				this.navigationObserver.observe({ entryTypes: ['navigation'] });
			}

			if (this.networkObserver && this.config.performance.enableServerTiming) {
				this.networkObserver.observe({ entryTypes: ['measure', 'navigation'] });
			}
		} catch (error) {
			console.warn('Failed to start performance observers:', error);
		}
	}

	private disconnectObservers(): void {
		if (this.resourceObserver) {
			this.resourceObserver.disconnect();
		}
		if (this.navigationObserver) {
			this.navigationObserver.disconnect();
		}
		if (this.networkObserver) {
			this.networkObserver.disconnect();
		}
	}

	private initializeNetworkQualityMonitoring(): void {
		if (this.config.networkQuality.enableNetworkQualityAPI && 'connection' in navigator) {
			const connection = (navigator as any).connection;

			// Monitor network quality changes
			connection.addEventListener('change', () => {
				console.log('Network quality changed:', {
					effectiveType: connection.effectiveType,
					downlink: connection.downlink,
					rtt: connection.rtt,
					saveData: connection.saveData,
				});
			});
		}
	}

	private setupRequestInterceptors(): void {
		// Intercept fetch requests
		const originalFetch = window.fetch;
		window.fetch = async (...args) => {
			const startTime = performance.now();
			const requestId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			try {
				const response = await originalFetch(...args);
				const duration = performance.now() - startTime;

				this.recordRequest({
					id: requestId,
					url: args[0] as string,
					method: 'GET', // Default, would need parsing for more complex cases
					status: response.status,
					startTime,
					duration,
					size: 0, // Would need to read response body
					compressedSize: 0,
					cached: false,
					priority: 'medium',
					type: 'fetch',
					initiator: 'fetch',
					retries: 0,
					timeout: false,
				});

				return response;
			} catch (error) {
				const duration = performance.now() - startTime;

				this.recordRequest({
					id: requestId,
					url: args[0] as string,
					method: 'GET',
					status: 0,
					startTime,
					duration,
					size: 0,
					compressedSize: 0,
					cached: false,
					priority: 'medium',
					type: 'fetch',
					initiator: 'fetch',
					retries: 0,
					timeout: duration > this.config.alerts.timeoutThreshold,
					error: {
						type: 'network-error',
						code: 'NETWORK_ERROR',
						message: error instanceof Error ? error.message : String(error),
						recoverable: true,
						severity: 'medium',
						timestamp: Date.now(),
					},
				});

				throw error;
			}
		};
	}

	private startPeriodicAnalysis(): void {
		this.monitoringInterval = setInterval(() => {
			const metrics = this.collectNetworkMetrics();
			this.checkAlerts(metrics);
			this.cleanupOldRequests();
		}, this.config.monitoring.samplingInterval);
	}

	private handleResourceEntry(entry: PerformanceResourceTiming): void {
		const request: NetworkRequest = {
			id: `resource_${entry.name}_${Date.now()}`,
			url: entry.name,
			method: 'GET', // Resources are typically GET requests
			status: 200, // Assume success for resources
			startTime: entry.startTime,
			duration: entry.responseEnd - entry.startTime,
			size: entry.transferSize || 0,
			compressedSize: entry.encodedBodySize || 0,
			cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
			priority: this.getRequestPriority(entry),
			type: this.getResourceType(entry),
			initiator: entry.initiatorType || 'unknown',
			retries: 0,
			timeout: entry.responseEnd - entry.startTime > this.config.alerts.timeoutThreshold,
		};

		this.recordRequest(request);
	}

	private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
		// Handle navigation timing entries
		const navigationRequest: NetworkRequest = {
			id: `navigation_${entry.name}_${Date.now()}`,
			url: entry.name,
			method: 'GET',
			status: 200,
			startTime: entry.startTime,
			duration: entry.responseEnd - entry.startTime,
			size: entry.transferSize || 0,
			compressedSize: entry.encodedBodySize || 0,
			cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
			priority: 'highest',
			type: 'document',
			initiator: 'navigation',
			retries: 0,
			timeout: false,
		};

		this.recordRequest(navigationRequest);
	}

	private handlePerformanceEntry(entry: PerformanceEntry): void {
		// Handle general performance entries
	}

	private getRequestPriority(entry: PerformanceResourceTiming): RequestPriority {
		// Convert priority string to RequestPriority enum
		switch (entry.priority) {
			case 'highest': return 'highest';
			case 'high': return 'high';
			case 'medium': return 'medium';
			case 'low': return 'low';
			case 'lowest': return 'lowest';
			default: return 'medium';
		}
	}

	private getResourceType(entry: PerformanceResourceTiming): ResourceType {
		const url = entry.name.toLowerCase();

		if (url.includes('.js')) return 'script';
		if (url.includes('.css')) return 'stylesheet';
		if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) return 'image';
		if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) return 'font';
		if (url.match(/\.(mp4|webm|ogg|mp3|wav)$/)) return 'media';
		if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/)) return 'object';

		// Use initiator type as fallback
		switch (entry.initiatorType) {
			case 'xmlhttprequest': return 'xhr';
			case 'fetch': return 'fetch';
			case 'img': return 'image';
			case 'script': return 'script';
			case 'link': return 'stylesheet';
			case 'css': return 'stylesheet';
			default: return 'other';
		}
	}

	private recordRequest(request: NetworkRequest): void {
		this.requests.push(request);

		// Limit request retention
		if (this.requests.length > this.config.monitoring.maxRequests) {
			this.requests.shift();
		}

		// Check for immediate alerts
		this.checkRequestAlerts(request);
	}

	private checkRequestAlerts(request: NetworkRequest): void {
		// Check for high latency
		if (request.duration > this.config.alerts.latencyThreshold) {
			console.warn(`High latency request detected: ${request.duration.toFixed(2)}ms for ${request.url}`);

			this.slowRequestCallbacks.forEach(callback => callback(request));

			if (this.config.alerts.enableRealTimeAlerts && this.highLatencyCallback) {
				this.highLatencyCallback();
			}
		}

		// Check for errors
		if (request.error) {
			console.error(`Network error detected: ${request.error.message} for ${request.url}`);

			this.errorDetectedCallbacks.forEach(callback => callback(request.error!, request));
		}

		// Check for timeouts
		if (request.timeout) {
			console.warn(`Request timeout: ${request.url}`);
		}
	}

	private collectNetworkMetrics(): NetworkMetrics {
		const timestamp = new Date();
		const now = performance.now();

		// Calculate basic metrics
		const totalRequests = this.requests.length;
		const successfulRequests = this.requests.filter(r => r.status >= 200 && r.status < 400).length;
		const failedRequests = this.requests.filter(r => r.status >= 400 || r.error).length;

		// Calculate latency metrics
		const latencies = this.requests
			.filter(r => r.duration > 0)
			.map(r => r.duration)
			.sort((a, b) => a - b);

		const latency = this.calculateLatencyMetrics(latencies);

		// Calculate bandwidth metrics
		const bandwidth = this.calculateBandwidthMetrics();

		// Calculate throughput metrics
		const throughput = this.calculateThroughputMetrics();

		// Calculate connection metrics
		const connections = this.calculateConnectionMetrics();

		// Calculate error metrics
		const errors = this.calculateErrorMetrics();

		// Calculate resource metrics by type
		const resourcesByType = this.calculateResourceMetricsByType();

		// Calculate network quality
		const networkQuality = this.calculateNetworkQuality();

		// Calculate optimization targets
		const optimizationTargets = this.identifyOptimizationTargets({}, []);

		const metrics: NetworkMetrics = {
			bandwidth,
			requests: {
				total: totalRequests,
				successful: successfulRequests,
				failed: failedRequests,
				pending: 0, // Not tracked in browser
				timeout: this.requests.filter(r => r.timeout).length,
				retries: this.requests.reduce((sum, r) => sum + r.retries, 0),
				cacheHits: this.requests.filter(r => r.cached).length,
				cacheMisses: this.requests.filter(r => !r.cached).length,
			},
			latency,
			throughput,
			dataTransfer: {
				totalBytes: this.requests.reduce((sum, r) => sum + r.size, 0),
				compressedBytes: this.requests.reduce((sum, r) => sum + r.compressedSize, 0),
				savedBytes: this.requests.reduce((sum, r) => sum + (r.size - r.compressedSize), 0),
				compressionRatio: this.calculateCompressionRatio(),
				efficiency: this.calculateDataTransferEfficiency(),
			},
			connections,
			errors,
			resourcesByType,
			networkQuality,
			optimizationTargets: [],
			efficiencyScore: this.calculateNetworkEfficiency(),
			timestamp,
			samplingInterval: this.config.monitoring.samplingInterval,
		};

		return metrics;
	}

	private calculateLatencyMetrics(latencies: number[]): NetworkMetrics['latency'] {
		if (latencies.length === 0) {
			return {
				average: 0,
				p50: 0,
				p90: 0,
				p95: 0,
				p99: 0,
				min: 0,
				max: 0,
			};
		}

		const sum = latencies.reduce((a, b) => a + b, 0);
		const average = sum / latencies.length;

		const p50Index = Math.floor(latencies.length * 0.5);
		const p90Index = Math.floor(latencies.length * 0.9);
		const p95Index = Math.floor(latencies.length * 0.95);
		const p99Index = Math.floor(latencies.length * 0.99);

		return {
			average,
			p50: latencies[p50Index],
			p90: latencies[p90Index],
			p95: latencies[p95Index],
			p99: latencies[p99Index],
			min: latencies[0],
			max: latencies[latencies.length - 1],
		};
	}

	private calculateBandwidthMetrics(): NetworkMetrics['bandwidth'] {
		const totalBytes = this.requests.reduce((sum, r) => sum + r.size, 0);
		const timeWindow = this.config.monitoring.samplingInterval / 1000; // seconds
		const currentBandwidth = totalBytes / timeWindow;

		// Get available bandwidth from network API if available
		const availableBandwidth = this.getAvailableBandwidth();

		return {
			current: currentBandwidth,
			available: availableBandwidth,
			utilization: availableBandwidth > 0 ? currentBandwidth / availableBandwidth : 0,
			efficiency: this.calculateBandwidthEfficiency(currentBandwidth, availableBandwidth),
		};
	}

	private getAvailableBandwidth(): number {
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;
			return (connection.downlink || 10) * 1024 * 1024 / 8; // Convert Mbps to bytes/sec
		}
		return 10 * 1024 * 1024 / 8; // Default 10 Mbps
	}

	private calculateBandwidthEfficiency(current: number, available: number): number {
		if (available === 0) return 0;
		return Math.min(current / available, 1);
	}

	private calculateThroughputMetrics(): NetworkMetrics['throughput'] {
		const totalRequests = this.requests.length;
		const timeWindow = this.config.monitoring.samplingInterval / 1000; // seconds
		const current = totalRequests / timeWindow;

		// Calculate trend (simplified)
		const recentRequests = this.requests.slice(-10);
		const olderRequests = this.requests.slice(-20, -10);

		const recentRate = recentRequests.length / (timeWindow / 2);
		const olderRate = olderRequests.length / (timeWindow / 2);

		let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
		if (recentRate > olderRate * 1.1) trend = 'increasing';
		else if (recentRate < olderRate * 0.9) trend = 'decreasing';

		return {
			current,
			peak: current, // Simplified - would need tracking over time
			average: totalRequests / (this.requests.length * timeWindow / this.requests.length),
			trend,
		};
	}

	private calculateConnectionMetrics(): NetworkMetrics['connections'] {
		// Simplified connection metrics for browser environment
		return {
			active: 1, // Single active connection in browser
			pending: 0,
			total: 1,
			reused: this.requests.filter(r => r.cached).length,
			new: this.requests.filter(r => !r.cached).length,
			concurrent: 6, // Browser typically uses 6 concurrent connections per domain
			maxConcurrent: 6,
		};
	}

	private calculateErrorMetrics(): NetworkMetrics['errors'] {
		const failedRequests = this.requests.filter(r => r.status >= 400 || r.error);
		const totalRequests = this.requests.length;

		const errorsByType: Record<string, number> = {};
		const errorsBySeverity: Record<string, number> = {};

		failedRequests.forEach(request => {
			const errorType = request.error?.type || 'http-error';
			const severity = request.error?.severity || this.classifyErrorSeverity(request.status);

			errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
			errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
		});

		return {
			rate: totalRequests > 0 ? failedRequests.length / totalRequests : 0,
			types: errorsByType,
			severity: errorsBySeverity,
			resolution: {}, // Would need tracking of resolved errors
		};
	}

	private classifyErrorSeverity(status: number): string {
		if (status >= 500) return 'high';
		if (status >= 400) return 'medium';
		return 'low';
	}

	private calculateResourceMetricsByType(): NetworkMetrics['resourcesByType'] {
		const resourcesByType: NetworkMetrics['resourcesByType'] = {};

		// Group requests by type
		const requestsByType: Record<ResourceType, NetworkRequest[]> = {} as any;

		this.requests.forEach(request => {
			if (!requestsByType[request.type]) {
				requestsByType[request.type] = [];
			}
			requestsByType[request.type].push(request);
		});

		// Calculate metrics for each type
		Object.entries(requestsByType).forEach(([type, typeRequests]) => {
			const totalRequests = typeRequests.length;
			const totalSize = typeRequests.reduce((sum, r) => sum + r.size, 0);
			const averageTime = typeRequests.reduce((sum, r) => sum + r.duration, 0) / totalRequests;
			const successRequests = typeRequests.filter(r => r.status >= 200 && r.status < 400).length;
			const errorRequests = typeRequests.filter(r => r.status >= 400 || r.error).length;

			resourcesByType[type] = {
				count: totalRequests,
				size: totalSize,
				averageTime,
				successRate: successRequests / totalRequests,
				errorRate: errorRequests / totalRequests,
			};
		});

		return resourcesByType;
	}

	private calculateNetworkQuality(): NetworkMetrics['networkQuality'] {
		const quality: NetworkMetrics['networkQuality'] = {
			rtt: 100, // Default 100ms
			packetLoss: 0,
			jitter: 0,
			bandwidth: this.getAvailableBandwidth(),
			effectiveType: '4g',
		};

		// Get actual network quality if available
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;
			quality.rtt = connection.rtt || 100;
			quality.effectiveType = connection.effectiveType || '4g';
		}

		// Calculate RTT from actual requests
		if (this.requests.length > 0) {
			const rtts = this.requests
				.filter(r => r.duration > 0 && r.duration < 10000) // Filter out unrealistic values
				.map(r => r.duration);

			if (rtts.length > 0) {
				quality.rtt = rtts.reduce((sum, rtt) => sum + rtt, 0) / rtts.length;
			}
		}

		return quality;
	}

	private calculateCompressionRatio(): number {
		const totalUncompressed = this.requests.reduce((sum, r) => sum + r.size, 0);
		const totalCompressed = this.requests.reduce((sum, r) => sum + r.compressedSize, 0);

		return totalUncompressed > 0 ? totalCompressed / totalUncompressed : 1;
	}

	private calculateDataTransferEfficiency(): number {
		const cachedRequests = this.requests.filter(r => r.cached).length;
		const totalRequests = this.requests.length;

		const cacheEfficiency = totalRequests > 0 ? cachedRequests / totalRequests : 0;
		const compressionEfficiency = this.calculateCompressionRatio();

		return (cacheEfficiency + compressionEfficiency) / 2;
	}

	private calculateNetworkEfficiency(): number {
		const latencyScore = this.calculateLatencyScore();
		const throughputScore = this.calculateThroughputScore();
		const errorScore = this.calculateErrorScore();
		const dataScore = this.calculateDataTransferEfficiency();

		return (latencyScore + throughputScore + errorScore + dataScore) / 4;
	}

	private calculateLatencyScore(): number {
		const avgLatency = this.requests.length > 0
			? this.requests.reduce((sum, r) => sum + r.duration, 0) / this.requests.length
			: 0;

		// Score: lower latency = higher score
		return Math.max(0, 1 - (avgLatency / 5000)); // 5s = 0 score
	}

	private calculateThroughputScore(): number {
		const requestRate = this.requests.length / (this.config.monitoring.samplingInterval / 1000);
		// Score: higher throughput = higher score (capped at reasonable maximum)
		return Math.min(requestRate / 10, 1); // 10 req/sec = full score
	}

	private calculateErrorScore(): number {
		const failedRequests = this.requests.filter(r => r.status >= 400 || r.error).length;
		const totalRequests = this.requests.length;
		const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

		return Math.max(0, 1 - errorRate * 10); // 10% error rate = 0 score
	}

	private analyzeRequests(): RequestAnalysis {
		const analysis: RequestAnalysis = {
			byType: {} as Record<ResourceType, RequestTypeAnalysis>,
			byStatus: {},
			byDomain: {},
			patterns: [],
			trends: [],
			bottlenecks: [],
		};

		// Analyze by type (already calculated in metrics)
		analysis.byType = this.analyzeRequestsByType();

		// Analyze by status
		analysis.byStatus = this.analyzeRequestsByStatus();

		// Analyze by domain
		analysis.byDomain = this.analyzeRequestsByDomain();

		// Identify patterns
		analysis.patterns = this.identifyRequestPatterns();

		// Identify trends
		analysis.trends = this.identifyRequestTrends();

		// Identify bottlenecks
		analysis.bottlenecks = this.identifyRequestBottlenecks();

		return analysis;
	}

	private analyzeRequestsByType(): Record<ResourceType, RequestTypeAnalysis> {
		const byType: Record<ResourceType, RequestTypeAnalysis> = {} as any;
		const requestsByType: Record<ResourceType, NetworkRequest[]> = {} as any;

		// Group requests by type
		this.requests.forEach(request => {
			if (!requestsByType[request.type]) {
				requestsByType[request.type] = [];
			}
			requestsByType[request.type].push(request);
		});

		// Calculate metrics for each type
		Object.entries(requestsByType).forEach(([type, typeRequests]) => {
			const count = typeRequests.length;
			const size = typeRequests.reduce((sum, r) => sum + r.size, 0);
			const averageTime = typeRequests.reduce((sum, r) => sum + r.duration, 0) / count;
			const successRequests = typeRequests.filter(r => r.status >= 200 && r.status < 400).length;
			const cachedRequests = typeRequests.filter(r => r.cached).length;

			byType[type] = {
				count,
				size,
				averageTime,
				successRate: successRequests / count,
				cacheHitRate: cachedRequests / count,
				optimizationPotential: this.calculateOptimizationPotential(typeRequests),
			};
		});

		return byType;
	}

	private calculateOptimizationPotential(requests: NetworkRequest[]): number {
		// Calculate optimization potential based on various factors
		const uncachedRequests = requests.filter(r => !r.cached).length;
		const largeRequests = requests.filter(r => r.size > 100 * 1024).length; // > 100KB
		const slowRequests = requests.filter(r => r.duration > 2000).length; // > 2s

		const totalRequests = requests.length;
		const cachePotential = (uncachedRequests / totalRequests) * 30; // Up to 30% from caching
		const sizePotential = (largeRequests / totalRequests) * 25; // Up to 25% from compression
		const speedPotential = (slowRequests / totalRequests) * 20; // Up to 20% from optimization

		return Math.min(cachePotential + sizePotential + speedPotential, 50); // Max 50%
	}

	private analyzeRequestsByStatus(): Record<number, number> {
		const byStatus: Record<number, number> = {};

		this.requests.forEach(request => {
			byStatus[request.status] = (byStatus[request.status] || 0) + 1;
		});

		return byStatus;
	}

	private analyzeRequestsByDomain(): Record<string, DomainAnalysis> {
		const byDomain: Record<string, DomainAnalysis> = {};

		this.requests.forEach(request => {
			try {
				const url = new URL(request.url);
				const domain = url.hostname;

				if (!byDomain[domain]) {
					byDomain[domain] = {
						domain,
						requestCount: 0,
						totalSize: 0,
						averageLatency: 0,
						errorRate: 0,
						sslEnabled: url.protocol === 'https:',
						httpVersion: '1.1', // Default
						optimizations: [],
					};
				}

				const domainAnalysis = byDomain[domain];
				domainAnalysis.requestCount++;
				domainAnalysis.totalSize += request.size;
			} catch (error) {
				// Invalid URL, skip
			}
		});

		// Calculate averages for each domain
		Object.values(byDomain).forEach(analysis => {
			const domainRequests = this.requests.filter(r => {
				try {
					return new URL(r.url).hostname === analysis.domain;
				} catch {
					return false;
				}
			});

			if (domainRequests.length > 0) {
				analysis.averageLatency = domainRequests.reduce((sum, r) => sum + r.duration, 0) / domainRequests.length;
				const errorRequests = domainRequests.filter(r => r.status >= 400 || r.error).length;
				analysis.errorRate = errorRequests / domainRequests.length;

				// Identify optimizations
				if (analysis.errorRate > 0.1) {
					analysis.optimizations.push('improve-error-handling');
				}
				if (analysis.averageLatency > 1000) {
					analysis.optimizations.push('reduce-latency');
				}
				if (!analysis.sslEnabled) {
					analysis.optimizations.push('enable-ssl');
				}
			}
		});

		return byDomain;
	}

	private identifyRequestPatterns(): RequestPattern[] {
		const patterns: RequestPattern[] = [];

		// Identify waterfall pattern (sequential requests)
		const sequentialRequests = this.findSequentialRequests();
		if (sequentialRequests.length > 3) {
			patterns.push({
				type: 'waterfall',
				detection: 'sequential-chain',
				description: `Sequential chain of ${sequentialRequests.length} requests detected`,
				impact: 'high',
				optimization: 'implement parallel loading or bundling',
			});
		}

		// Identify batching opportunities
		const batchableRequests = this.findBatchableRequests();
		if (batchableRequests.length > 2) {
			patterns.push({
				type: 'batching',
				detection: 'similar-timing',
				description: `${batchableRequests.length} requests could be batched together`,
				impact: 'medium',
				optimization: 'implement request batching',
			});
		}

		return patterns;
	}

	private findSequentialRequests(): NetworkRequest[] {
		// Simplified sequential request detection
		const threshold = 100; // 100ms between requests
		const sequential: NetworkRequest[] = [];
		const sortedRequests = [...this.requests].sort((a, b) => a.startTime - b.startTime);

		for (let i = 0; i < sortedRequests.length - 1; i++) {
			const current = sortedRequests[i];
			const next = sortedRequests[i + 1];

			if (next.startTime - current.startTime < threshold) {
				if (sequential.length === 0) sequential.push(current);
				sequential.push(next);
			} else {
				if (sequential.length > 3) break;
				sequential.length = 0;
			}
		}

		return sequential.length > 3 ? sequential : [];
	}

	private findBatchableRequests(): NetworkRequest[] {
		// Simplified batching detection - requests to same domain with similar timing
		const threshold = 50; // 50ms window
		const batchable: NetworkRequest[] = [];
		const sortedRequests = [...this.requests].sort((a, b) => a.startTime - b.startTime);

		for (let i = 0; i < sortedRequests.length - 1; i++) {
			const current = sortedRequests[i];
			const next = sortedRequests[i + 1];

			try {
				const currentUrl = new URL(current.url);
				const nextUrl = new URL(next.url);

				if (currentUrl.hostname === nextUrl.hostname &&
					next.startTime - current.startTime < threshold) {
					if (!batchable.includes(current)) batchable.push(current);
					if (!batchable.includes(next)) batchable.push(next);
				}
			} catch {
				// Invalid URLs, skip
			}
		}

		return batchable;
	}

	private identifyRequestTrends(): RequestTrend[] {
		const trends: RequestTrend[] = [];

		// Analyze latency trend
		const latencyTrend = this.analyzeLatencyTrend();
		if (latencyTrend) {
			trends.push(latencyTrend);
		}

		// Analyze error rate trend
		const errorTrend = this.analyzeErrorRateTrend();
		if (errorTrend) {
			trends.push(errorTrend);
		}

		return trends;
	}

	private analyzeLatencyTrend(): RequestTrend | null {
		if (this.requests.length < 20) return null;

		const recentRequests = this.requests.slice(-10);
		const olderRequests = this.requests.slice(-20, -10);

		const recentAvgLatency = recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length;
		const olderAvgLatency = olderRequests.reduce((sum, r) => sum + r.duration, 0) / olderRequests.length;

		const change = ((recentAvgLatency - olderAvgLatency) / olderAvgLatency) * 100;

		let direction: 'improving' | 'degrading' | 'stable' = 'stable';
		if (change > 10) direction = 'degrading';
		else if (change < -10) direction = 'improving';

		return {
			metric: 'latency',
			direction,
			change: Math.abs(change),
			confidence: 0.7,
			prediction: recentAvgLatency + (change > 0 ? 100 : -50), // Simple prediction
		};
	}

	private analyzeErrorRateTrend(): RequestTrend | null {
		if (this.requests.length < 20) return null;

		const recentRequests = this.requests.slice(-10);
		const olderRequests = this.requests.slice(-20, -10);

		const recentErrorRate = recentRequests.filter(r => r.status >= 400 || r.error).length / recentRequests.length;
		const olderErrorRate = olderRequests.filter(r => r.status >= 400 || r.error).length / olderRequests.length;

		const change = ((recentErrorRate - olderErrorRate) / Math.max(olderErrorRate, 0.01)) * 100;

		let direction: 'improving' | 'degrading' | 'stable' = 'stable';
		if (change > 20) direction = 'degrading';
		else if (change < -20) direction = 'improving';

		return {
			metric: 'errorRate',
			direction,
			change: Math.abs(change),
			confidence: 0.6,
			prediction: recentErrorRate + (change > 0 ? 0.05 : -0.02),
		};
	}

	private identifyRequestBottlenecks(): RequestBottleneck[] {
		const bottlenecks: RequestBottleneck[] = [];

		// Find slow responses
		const slowRequests = this.requests.filter(r => r.duration > this.config.analysis.bottleneckThreshold);
		if (slowRequests.length > 0) {
			bottlenecks.push({
				id: 'slow-responses',
				type: 'slow-response',
				location: 'server',
				impact: Math.min(slowRequests.length / this.requests.length, 1),
				duration: slowRequests.reduce((sum, r) => sum + r.duration, 0) / slowRequests.length,
				description: `${slowRequests.length} requests with response times > ${this.config.analysis.bottleneckThreshold}ms`,
				solutions: [
					'Implement server-side caching',
					'Optimize database queries',
					'Use CDN for static content',
					'Enable HTTP/2 or HTTP/3',
				],
			});
		}

		// Find large payloads
		const largeRequests = this.requests.filter(r => r.size > 1024 * 1024); // > 1MB
		if (largeRequests.length > 0) {
			bottlenecks.push({
				id: 'large-payloads',
				type: 'large-payload',
				location: 'transfer',
				impact: Math.min(largeRequests.length / this.requests.length, 1),
				duration: largeRequests.reduce((sum, r) => sum + r.duration, 0) / largeRequests.length,
				description: `${largeRequests.length} requests with payloads > 1MB`,
				solutions: [
					'Implement response compression',
					'Use binary formats instead of JSON',
					'Implement pagination',
					'Use image optimization',
				],
			});
		}

		return bottlenecks;
	}

	private identifyPerformanceIssues(
		metrics: NetworkMetrics,
		analysis: RequestAnalysis
	): NetworkPerformanceIssue[] {
		const issues: NetworkPerformanceIssue[] = [];

		// High latency issue
		if (metrics.latency.average > this.config.analysis.latencyThreshold) {
			issues.push({
				id: 'high-latency',
				type: 'high-latency',
				severity: metrics.latency.average > 5000 ? 'critical' : 'high',
				description: `Average response time of ${metrics.latency.average.toFixed(0)}ms exceeds threshold`,
				impact: {
					performance: 0.8,
					userExperience: 0.9,
					cost: 0.3,
					availability: 0.2,
				},
				affectedRequests: this.requests.filter(r => r.duration > this.config.analysis.latencyThreshold).map(r => r.id),
				solutions: [
					{
						strategy: 'cdn-implementation',
						description: 'Deploy content delivery network',
						implementation: 'Configure CDN for static and dynamic content',
						expectedBenefit: '40-60% latency reduction',
						confidence: 0.9,
						effort: 'medium',
						risk: 'low',
					},
					{
						strategy: 'server-optimization',
						description: 'Optimize server response times',
						implementation: 'Profile and optimize slow endpoints',
						expectedBenefit: '30-50% latency reduction',
						confidence: 0.8,
						effort: 'high',
						risk: 'medium',
					},
				],
				frequency: this.requests.filter(r => r.duration > this.config.analysis.latencyThreshold).length / (this.config.monitoring.samplingInterval / 60000), // per minute
			});
		}

		// High error rate issue
		if (metrics.errors.rate > this.config.analysis.errorRateThreshold) {
			issues.push({
				id: 'high-error-rate',
				type: 'high-latency',
				severity: metrics.errors.rate > 0.2 ? 'critical' : 'high',
				description: `Error rate of ${(metrics.errors.rate * 100).toFixed(1)}% exceeds threshold`,
				impact: {
					performance: 0.7,
					userExperience: 0.8,
					cost: 0.4,
					availability: 0.9,
				},
				affectedRequests: this.requests.filter(r => r.status >= 400 || r.error).map(r => r.id),
				solutions: [
					{
						strategy: 'error-handling-improvement',
						description: 'Implement robust error handling',
						implementation: 'Add retry logic, circuit breakers, and graceful degradation',
						expectedBenefit: '50-70% error rate reduction',
						confidence: 0.85,
						effort: 'medium',
						risk: 'low',
					},
				],
				frequency: this.requests.filter(r => r.status >= 400 || r.error).length / (this.config.monitoring.samplingInterval / 60000),
			});
		}

		// Missing caching issue
		if (metrics.requests.cacheHits < metrics.requests.total * 0.3) { // Less than 30% cache hit rate
			issues.push({
				id: 'missing-caching',
				type: 'missing-caching',
				severity: 'medium',
				description: `Cache hit rate of ${((metrics.requests.cacheHits / metrics.requests.total) * 100).toFixed(1)}% is below optimal`,
				impact: {
					performance: 0.6,
					userExperience: 0.5,
					cost: 0.7,
					availability: 0.3,
				},
				affectedRequests: this.requests.filter(r => !r.cached).map(r => r.id),
				solutions: [
					{
						strategy: 'caching-strategy',
						description: 'Implement comprehensive caching strategy',
						implementation: 'Add browser, CDN, and application-level caching',
						expectedBenefit: '60-80% reduction in bandwidth usage',
						confidence: 0.9,
						effort: 'medium',
						risk: 'low',
					},
				],
				frequency: this.requests.filter(r => !r.cached).length / (this.config.monitoring.samplingInterval / 60000),
			});
		}

		return issues;
	}

	private identifyOptimizationTargets(
		metrics: NetworkMetrics,
		issues: NetworkPerformanceIssue[]
	): NetworkOptimizationTarget[] {
		const targets: NetworkOptimizationTarget[] = [];

		// Compression optimization target
		if (metrics.dataTransfer.compressionRatio < 0.7) {
			targets.push({
				id: 'compression-optimization',
				name: 'Response Compression',
				type: 'compression',
				priority: 'high',
				description: 'Enable compression for text-based responses',
				currentMetrics: {
					bandwidthUsage: metrics.bandwidth.utilization,
					latency: metrics.latency.average,
					errorRate: metrics.errors.rate,
					cacheHitRate: metrics.requests.cacheHits / metrics.requests.total,
					compressionRatio: metrics.dataTransfer.compressionRatio,
				},
				targetMetrics: {
					bandwidthUsage: metrics.bandwidth.utilization * 0.6,
					latency: metrics.latency.average * 0.8,
					errorRate: metrics.errors.rate,
					cacheHitRate: metrics.requests.cacheHits / metrics.requests.total,
					compressionRatio: 0.3,
				},
				strategies: [
					{
						id: 'gzip-compression',
						name: 'GZIP Compression',
						description: 'Enable GZIP compression for text responses',
						implementation: 'Configure server to compress JSON, HTML, CSS, and JavaScript',
						expectedImprovement: {
							metric: 'bandwidth',
							improvement: 70,
							confidence: 0.95,
							timeToImplement: 2,
						},
						effort: 'low',
						risk: 'low',
						prerequisites: ['server-access'],
						technologies: ['GZIP', 'Brotli'],
					},
				],
				estimatedBenefit: 40,
				implementationEffort: 'low',
				affectedResources: this.requests.filter(r => r.type === 'script' || r.type === 'stylesheet' || r.type === 'fetch').map(r => r.url),
			});
		}

		// Caching optimization target
		if (metrics.requests.cacheHits / metrics.requests.total < 0.5) {
			targets.push({
				id: 'caching-optimization',
				name: 'Request Caching',
				type: 'caching',
				priority: 'high',
				description: 'Implement aggressive caching for static and dynamic content',
				currentMetrics: {
					bandwidthUsage: metrics.bandwidth.utilization,
					latency: metrics.latency.average,
					errorRate: metrics.errors.rate,
					cacheHitRate: metrics.requests.cacheHits / metrics.requests.total,
					compressionRatio: metrics.dataTransfer.compressionRatio,
				},
				targetMetrics: {
					bandwidthUsage: metrics.bandwidth.utilization * 0.4,
					latency: metrics.latency.average * 0.3,
					errorRate: metrics.errors.rate,
					cacheHitRate: 0.8,
					compressionRatio: metrics.dataTransfer.compressionRatio,
				},
				strategies: [
					{
						id: 'browser-caching',
						name: 'Browser Caching',
						description: 'Implement proper cache headers for static assets',
						implementation: 'Set Cache-Control, ETag, and Last-Modified headers',
						expectedImprovement: {
							metric: 'latency',
							improvement: 80,
							confidence: 0.9,
							timeToImplement: 4,
						},
						effort: 'low',
						risk: 'low',
						prerequisites: ['server-access'],
						technologies: ['HTTP Caching', 'Cache-Control Headers'],
					},
					{
						id: 'cdn-caching',
						name: 'CDN Caching',
						description: 'Deploy CDN for global content delivery',
						implementation: 'Configure CDN with appropriate caching rules',
						expectedImprovement: {
							metric: 'latency',
							improvement: 60,
							confidence: 0.85,
							timeToImplement: 8,
						},
						effort: 'medium',
						risk: 'low',
						prerequisites: ['cdn-provider'],
						technologies: ['CDN', 'Edge Caching'],
					},
				],
				estimatedBenefit: 70,
				implementationEffort: 'medium',
				affectedResources: this.requests.filter(r => r.type === 'image' || r.type === 'font' || r.type === 'stylesheet' || r.type === 'script').map(r => r.url),
			});
		}

		// Request batching optimization target
		const batchableRequests = this.findBatchableRequests();
		if (batchableRequests.length > 3) {
			targets.push({
				id: 'batch-requests',
				name: 'Request Batching',
				type: 'request-batching',
				priority: 'medium',
				description: `Batch ${batchableRequests.length} similar requests together`,
				currentMetrics: {
					bandwidthUsage: metrics.bandwidth.utilization,
					latency: metrics.latency.average,
					errorRate: metrics.errors.rate,
					cacheHitRate: metrics.requests.cacheHits / metrics.requests.total,
					compressionRatio: metrics.dataTransfer.compressionRatio,
				},
				targetMetrics: {
					bandwidthUsage: metrics.bandwidth.utilization * 0.8,
					latency: metrics.latency.average * 0.7,
					errorRate: metrics.errors.rate,
					cacheHitRate: metrics.requests.cacheHits / metrics.requests.total,
					compressionRatio: metrics.dataTransfer.compressionRatio,
				},
				strategies: [
					{
						id: 'api-batching',
						name: 'API Request Batching',
						description: 'Implement API endpoints that accept multiple requests',
						implementation: 'Create batch API endpoints and client-side batching logic',
						expectedImprovement: {
							metric: 'latency',
							improvement: 30,
							confidence: 0.8,
							timeToImplement: 16,
						},
						effort: 'medium',
						risk: 'medium',
						prerequisites: ['api-control'],
						technologies: ['GraphQL', 'REST Batching'],
					},
				],
				estimatedBenefit: 25,
				implementationEffort: 'medium',
				affectedResources: batchableRequests.map(r => r.url),
			});
		}

		return targets;
	}

	private generateRecommendations(
		issues: NetworkPerformanceIssue[],
		targets: NetworkOptimizationTarget[]
	): NetworkRecommendation[] {
		const recommendations: NetworkRecommendation[] = [];

		// Generate recommendations from performance issues
		issues.forEach(issue => {
			issue.solutions.forEach(solution => {
				recommendations.push({
					id: `rec_${issue.id}_${solution.strategy}`,
					priority: issue.severity as 'low' | 'medium' | 'high' | 'critical',
					category: 'performance',
					title: solution.description,
					description: issue.description,
					problem: issue.description,
					solution: solution.implementation,
					expectedBenefit: solution.expectedBenefit,
					implementation: {
						description: solution.implementation,
						steps: [solution.implementation],
						estimatedTime: solution.effort === 'low' ? '2-4 hours' :
										solution.effort === 'medium' ? '8-16 hours' : '20-40 hours',
						resources: ['development-team'],
						technologies: solution.technologies || [],
						risks: [solution.risk],
						cost: {
							initial: solution.effort === 'low' ? 500 : solution.effort === 'medium' ? 2000 : 5000,
							ongoing: 100,
							savings: solution.confidence * 1000,
						},
					},
					relatedIssues: [issue.id],
					confidence: solution.confidence,
					roi: solution.confidence * 2, // Simplified ROI calculation
				});
			});
		});

		// Generate recommendations from optimization targets
		targets.forEach(target => {
			target.strategies.forEach(strategy => {
				recommendations.push({
					id: `rec_${target.id}_${strategy.id}`,
					priority: target.priority,
					category: 'performance',
					title: strategy.name,
					description: target.description,
					problem: target.description,
					solution: strategy.implementation,
					expectedBenefit: `${strategy.expectedImprovement.improvement}% ${strategy.expectedImprovement.metric} improvement`,
					implementation: {
						description: strategy.implementation,
						steps: [strategy.implementation],
						estimatedTime: `${strategy.expectedImprovement.timeToImplement} hours`,
						resources: ['development-team'],
						technologies: strategy.technologies,
						risks: [strategy.risk],
						cost: {
							initial: strategy.effort === 'low' ? 300 : strategy.effort === 'medium' ? 1000 : 3000,
							ongoing: 50,
							savings: strategy.confidence * 800,
						},
					},
					relatedIssues: [],
					confidence: strategy.expectedImprovement.confidence,
					roi: strategy.expectedImprovement.confidence * 1.5,
				});
			});
		});

		// Sort by priority and ROI
		return recommendations.sort((a, b) => {
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
			if (priorityDiff !== 0) return priorityDiff;

			return b.roi - a.roi;
		});
	}

	private createImplementationPlan(recommendations: NetworkRecommendation[]): NetworkImplementationPlan {
		const phases: NetworkImplementationPhase[] = [];

		// Group recommendations by priority
		const criticalRecs = recommendations.filter(r => r.priority === 'critical');
		const highRecs = recommendations.filter(r => r.priority === 'high');
		const mediumRecs = recommendations.filter(r => r.priority === 'medium');
		const lowRecs = recommendations.filter(r => r.priority === 'low');

		// Create phases
		if (criticalRecs.length > 0) {
			phases.push({
				name: 'Critical Performance Issues',
				duration: this.estimatePhaseDuration(criticalRecs),
				tasks: this.createNetworkTasksFromRecommendations(criticalRecs),
				dependencies: [],
				expectedOutcome: 'Resolve critical network performance issues',
				savings: this.calculatePhaseSavings(criticalRecs),
			});
		}

		if (highRecs.length > 0) {
			phases.push({
				name: 'High Priority Optimizations',
				duration: this.estimatePhaseDuration(highRecs),
				tasks: this.createNetworkTasksFromRecommendations(highRecs),
				dependencies: criticalRecs.length > 0 ? ['Critical Performance Issues'] : [],
				expectedOutcome: 'Implement high impact network optimizations',
				savings: this.calculatePhaseSavings(highRecs),
			});
		}

		if (mediumRecs.length > 0) {
			phases.push({
				name: 'Medium Priority Improvements',
				duration: this.estimatePhaseDuration(mediumRecs),
				tasks: this.createNetworkTasksFromRecommendations(mediumRecs),
				dependencies: highRecs.length > 0 ? ['High Priority Optimizations'] : [],
				expectedOutcome: 'Apply medium impact network improvements',
				savings: this.calculatePhaseSavings(mediumRecs),
			});
		}

		if (lowRecs.length > 0) {
			phases.push({
				name: 'Low Priority Enhancements',
				duration: this.estimatePhaseDuration(lowRecs),
				tasks: this.createNetworkTasksFromRecommendations(lowRecs),
				dependencies: mediumRecs.length > 0 ? ['Medium Priority Improvements'] : [],
				expectedOutcome: 'Complete network optimization enhancements',
				savings: this.calculatePhaseSavings(lowRecs),
			});
		}

		const totalEffort = phases.reduce((sum, phase) => sum + phase.duration, 0);
		const totalSavings = phases.reduce((sum, phase) => sum + phase.savings, 0);
		const totalCostSavings = recommendations.reduce((sum, rec) => sum + rec.implementation.cost.savings, 0);

		return {
			phases,
			estimatedTotalEffort: totalEffort,
			estimatedTotalSavings: totalSavings,
			estimatedCostSavings: totalCostSavings,
			risks: this.identifyNetworkRisks(recommendations),
			successMetrics: [
				'Reduce average latency to below 500ms',
				'Achieve 80%+ cache hit rate',
				'Maintain error rate below 2%',
				'Reduce bandwidth usage by 40%',
				'Improve page load time by 30%',
			],
		};
	}

	private estimatePhaseDuration(recommendations: NetworkRecommendation[]): number {
		return recommendations.reduce((sum, rec) => {
			const hours = parseFloat(rec.implementation.estimatedTime.split(' ')[0]);
			return sum + hours;
		}, 0);
	}

	private createNetworkTasksFromRecommendations(recommendations: NetworkRecommendation[]): NetworkImplementationTask[] {
		return recommendations.map(rec => ({
			name: rec.title,
			description: rec.description,
			effort: parseFloat(rec.implementation.estimatedTime.split(' ')[0]),
			risk: rec.implementation.risks[0] as RiskLevel,
			expectedSavings: parseFloat(rec.expectedBenefit.replace(/[^\d.]/g, '')) * 1024, // Convert to bytes
			technologies: rec.implementation.technologies,
		}));
	}

	private calculatePhaseSavings(recommendations: NetworkRecommendation[]): number {
		return recommendations.reduce((sum, rec) => {
			const savings = parseFloat(rec.expectedBenefit.replace(/[^\d.]/g, ''));
			return sum + (savings * 1024); // Convert to bytes
		}, 0);
	}

	private identifyNetworkRisks(recommendations: NetworkRecommendation[]): Risk[] {
		const risks: Risk[] = [];

		const highRisks = recommendations.filter(r => r.implementation.risks.includes('high'));
		if (highRisks.length > 0) {
			risks.push({
				description: 'High-risk implementations may affect service availability',
				probability: 0.3,
				impact: 0.8,
				mitigation: 'Implement gradual rollout and monitoring',
			});
		}

		if (recommendations.some(r => r.technologies.includes('CDN'))) {
			risks.push({
				description: 'CDN configuration errors may affect content delivery',
				probability: 0.2,
				impact: 0.6,
				mitigation: 'Thorough testing and fallback mechanisms',
			});
		}

		return risks;
	}

	private calculateEstimatedSavings(targets: NetworkOptimizationTarget[]): number {
		return targets.reduce((sum, target) => sum + target.estimatedBenefit, 0) * 1024 * 1024; // Convert to bytes
	}

	private calculateDataAccuracy(): number {
		if (this.requests.length === 0) return 0;

		// Calculate accuracy based on request count and data completeness
		const sampleSizeScore = Math.min(this.requests.length / 50, 1); // 50 requests = full accuracy

		// Calculate completeness based on available timing data
		const completeRequests = this.requests.filter(r =>
			r.duration > 0 && r.size > 0 && r.status > 0
		).length;
		const completenessScore = this.requests.length > 0 ? completeRequests / this.requests.length : 0;

		return (sampleSizeScore + completenessScore) / 2;
	}

	private checkAlerts(metrics: NetworkMetrics): void {
		if (!this.config.alerts.enableRealTimeAlerts) return;

		// Check latency threshold
		if (metrics.latency.average > this.config.alerts.latencyThreshold) {
			console.warn(`High network latency detected: ${metrics.latency.average.toFixed(0)}ms`);
			if (this.highLatencyCallback) {
				this.highLatencyCallback();
			}
		}

		// Check error rate threshold
		if (metrics.errors.rate > this.config.alerts.errorRateThreshold) {
			console.warn(`High network error rate detected: ${(metrics.errors.rate * 100).toFixed(1)}%`);
		}

		// Check bandwidth threshold
		const bandwidthMB = metrics.bandwidth.current / 1024 / 1024;
		if (bandwidthMB > this.config.alerts.bandwidthThreshold) {
			console.warn(`High bandwidth usage detected: ${bandwidthMB.toFixed(1)} MB/s`);
		}
	}

	private cleanupOldRequests(): void {
		const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
		this.requests = this.requests.filter(request =>
			request.startTime > cutoff.getTime()
		);
	}

	private async applyOptimization(target: NetworkOptimizationTarget): Promise<NetworkOptimizationAction> {
		const action: NetworkOptimizationAction = {
			targetId: target.id,
			targetName: target.name,
			strategy: 'unknown',
			success: true,
			bytesSaved: 0,
			latencyReduction: 0,
			errorReduction: 0,
			duration: 0,
		};

		const startTime = Date.now();

		try {
			// Apply optimization based on target type
			switch (target.type) {
				case 'compression':
					action.strategy = 'compression';
					action.bytesSaved = await this.applyCompressionOptimization(target);
					break;

				case 'caching':
					action.strategy = 'caching';
					action.bytesSaved = await this.applyCachingOptimization(target);
					action.latencyReduction = 50; // Estimate 50ms reduction
					break;

				case 'request-batching':
					action.strategy = 'batching';
					action.latencyReduction = await this.applyBatchingOptimization(target);
					break;

				default:
					action.strategy = 'general-optimization';
					action.bytesSaved = await this.applyGeneralNetworkOptimization(target);
			}

			action.duration = Date.now() - startTime;

		} catch (error) {
			action.success = false;
			action.error = error instanceof Error ? error.message : String(error);
			action.duration = Date.now() - startTime;
		}

		return action;
	}

	private async applyCompressionOptimization(target: NetworkOptimizationTarget): Promise<number> {
		// Simulate compression optimization
		await new Promise(resolve => setTimeout(resolve, 200));

		// Estimate bytes saved based on affected resources
		const affectedRequests = this.requests.filter(r => target.affectedResources.includes(r.url));
		const totalBytes = affectedRequests.reduce((sum, r) => sum + r.size, 0);

		return totalBytes * 0.6; // 60% compression ratio
	}

	private async applyCachingOptimization(target: NetworkOptimizationTarget): Promise<number> {
		// Simulate caching optimization
		await new Promise(resolve => setTimeout(resolve, 150));

		// Estimate bytes saved from caching
		const affectedRequests = this.requests.filter(r => target.affectedResources.includes(r.url));
		const totalBytes = affectedRequests.reduce((sum, r) => sum + r.size, 0);

		return totalBytes * 0.8; // 80% cache hit rate
	}

	private async applyBatchingOptimization(target: NetworkOptimizationTarget): Promise<number> {
		// Simulate batching optimization
		await new Promise(resolve => setTimeout(resolve, 300));

		// Estimate latency reduction from batching
		return 75; // 75ms reduction
	}

	private async applyGeneralNetworkOptimization(target: NetworkOptimizationTarget): Promise<number> {
		// Simulate general optimization
		await new Promise(resolve => setTimeout(resolve, 400));

		// Estimate general improvement
		return 1024 * 100; // 100KB saved
	}
}

// Supporting interfaces
interface NetworkOptimizationHistory {
	timestamp: Date;
	report: NetworkOptimizationReport;
	beforeMetrics: NetworkMetrics;
	afterMetrics: NetworkMetrics;
}

interface NetworkOptimizationReport {
	totalOptimizations: number;
	successfulOptimizations: number;
	failedOptimizations: number;
	bytesSaved: number;
	latencyReduction: number;
	errorReduction: number;
	timeSpent: number;
	actions: NetworkOptimizationAction[];
}

interface NetworkOptimizationAction {
	targetId: string;
	targetName: string;
	strategy: string;
	success: boolean;
	bytesSaved: number;
	latencyReduction: number;
	errorReduction: number;
	duration: number;
	error?: string;
}

// Singleton instance
export const advancedNetworkMonitor = AdvancedNetworkMonitor.getInstance();
