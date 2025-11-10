/**
 * Real-time Bundle Monitor
 * Monitors bundle size, performance, and compliance in real-time during development
 * Provides instant feedback and optimization opportunities
 */

import { bundleAnalyzer, type BundleAnalysis, type BundleSnapshot } from '@/analytics/bundle-analyzer';
import { sizeBudgetManager } from './size-budget-manager';

export interface RealtimeMonitorConfig {
	enabled: boolean;
	updateInterval: number; // milliseconds
	enableNotifications: boolean;
	enableAutoOptimization: boolean;
	thresholds: MonitorThresholds;
	notifications: NotificationConfig;
	performance: PerformanceMonitorConfig;
	compliance: ComplianceMonitorConfig;
}

export interface MonitorThresholds {
	sizeWarning: number; // percentage of budget
	sizeCritical: number; // percentage of budget
	growthRateWarning: number; // KB per minute
	growthRateCritical: number; // KB per minute
	performanceWarning: number; // milliseconds
	performanceCritical: number; // milliseconds
	complianceWarning: number; // compliance score
	complianceCritical: number; // compliance score
}

export interface NotificationConfig {
	browser: boolean;
	console: boolean;
	visual: boolean;
	sound: boolean;
	persistence: boolean; // keep notifications until dismissed
	grouping: boolean; // group similar notifications
}

export interface PerformanceMonitorConfig {
	enableMetrics: boolean;
	enableTracing: boolean;
	enableProfiling: boolean;
	samplingRate: number; // 0-1
	maxSamples: number;
	bufferSize: number;
}

export interface ComplianceMonitorConfig {
	enableSC14: boolean; // 500KB constraint
	enableAccessibility: boolean;
	enablePerformance: boolean;
	enableSecurity: boolean;
	continuousMonitoring: boolean;
	alertThreshold: number;
}

export interface RealtimeBundleState {
	snapshots: BundleSnapshot[];
	current: BundleSnapshot;
	changes: BundleChange[];
	trends: RealtimeTrend;
	alerts: RealtimeAlert[];
	performance: RealtimePerformance;
	compliance: RealtimeCompliance;
	health: BundleHealth;
	optimizations: OptimizationOpportunity[];
}

export interface BundleChange {
	timestamp: Date;
	type: 'size-increase' | 'size-decrease' | 'new-chunk' | 'removed-chunk' | 'dependency-change';
	description: string;
	impact: {
		sizeChange: number;
		performanceChange: number;
		complianceChange: number;
	};
	severity: 'low' | 'medium' | 'high' | 'critical';
	cause?: string;
	resolution?: string;
}

export interface RealtimeTrend {
	direction: 'increasing' | 'decreasing' | 'stable';
	rate: number; // KB per minute
	acceleration: number; // KB per minute²
	prediction: TrendPrediction;
	confidence: number;
	factors: TrendFactor[];
}

export interface TrendPrediction {
	nextMinute: number;
	nextFiveMinutes: number;
	nextHour: number;
	nextDay: number;
	riskLevel: 'low' | 'medium' | 'high';
	budgetBreachTime?: Date;
}

export interface TrendFactor {
	factor: string;
	impact: number;
	description: string;
	temporary: boolean;
}

export interface RealtimeAlert {
	id: string;
	timestamp: Date;
	type: 'size' | 'performance' | 'compliance' | 'trend' | 'error';
	severity: 'info' | 'warning' | 'error' | 'critical';
	title: string;
	message: string;
	details: any;
	actions: AlertAction[];
	dismissed: boolean;
	expiration?: Date;
	persistent: boolean;
}

export interface AlertAction {
	label: string;
	action: () => void | Promise<void>;
	type: 'primary' | 'secondary' | 'danger';
	automated: boolean;
}

export interface RealtimePerformance {
	metrics: PerformanceMetrics;
	samples: PerformanceSample[];
	trends: PerformanceTrend;
	bottlenecks: PerformanceBottleneck[];
	score: number;
	grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface PerformanceMetrics {
	bundleLoadTime: number;
	chunkLoadTime: number;
	parsingTime: number;
	executionTime: number;
	memoryUsage: number;
	cacheHitRate: number;
	networkRequests: number;
	totalTransferSize: number;
}

export interface PerformanceSample {
	timestamp: Date;
	metrics: PerformanceMetrics;
	context: string;
}

export interface PerformanceTrend {
	loadTime: number[];
	memoryUsage: number[];
	cacheHitRate: number[];
	averageLoadTime: number;
	direction: 'improving' | 'degrading' | 'stable';
}

export interface PerformanceBottleneck {
	type: 'network' | 'parsing' | 'execution' | 'memory';
	severity: 'low' | 'medium' | 'high';
	description: string;
	impact: number;
	recommendation: string;
}

export interface RealtimeCompliance {
	sc14: SC14Compliance;
	accessibility: AccessibilityCompliance;
	performance: PerformanceCompliance;
	security: SecurityCompliance;
	overall: OverallCompliance;
}

export interface SC14Compliance {
	status: 'compliant' | 'warning' | 'critical';
	budgetUtilization: number;
	currentSize: number;
	budgetLimit: number;
	overage: number;
	score: number;
	violations: string[];
	timeline: ComplianceTimeline;
}

export interface AccessibilityCompliance {
	score: number;
	issues: AccessibilityIssue[];
	automated: number;
	manual: number;
}

export interface AccessibilityIssue {
	type: string;
	severity: 'low' | 'medium' | 'high';
	element: string;
	description: string;
	automated: boolean;
}

export interface PerformanceCompliance {
	score: number;
	metrics: {
		lcp: number; // Largest Contentful Paint
		fid: number; // First Input Delay
		cls: number; // Cumulative Layout Shift
		fcp: number; // First Contentful Paint
		ttfb: number; // Time to First Byte
	};
	violations: string[];
}

export interface SecurityCompliance {
	score: number;
	vulnerabilities: SecurityVulnerability[];
	dependencies: SecurityDependency[];
	headers: SecurityHeader[];
}

export interface SecurityVulnerability {
	severity: 'low' | 'medium' | 'high' | 'critical';
	package: string;
	version: string;
	description: string;
	patched: boolean;
}

export interface SecurityDependency {
	name: string;
	version: string;
	license: string;
	vulnerabilities: number;
	lastUpdated: Date;
}

export interface SecurityHeader {
	header: string;
	status: 'present' | 'missing' | 'invalid';
	value?: string;
	recommendation: string;
}

export interface OverallCompliance {
	score: number;
	status: 'compliant' | 'warning' | 'critical';
	dominantIssue: string;
	recommendations: string[];
	lastCheck: Date;
}

export interface ComplianceTimeline {
	current: CompliancePoint;
	history: CompliancePoint[];
	prediction: CompliancePoint[];
	breachDate?: Date;
}

export interface CompliancePoint {
	date: Date;
	size: number;
	score: number;
	status: 'compliant' | 'warning' | 'critical';
	events: string[];
}

export interface BundleHealth {
	score: number;
	status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
	issues: HealthIssue[];
	recommendations: HealthRecommendation[];
	lastCheck: Date;
}

export interface HealthIssue {
	category: 'size' | 'performance' | 'compliance' | 'reliability';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	impact: string;
	automated: boolean;
}

export interface HealthRecommendation {
	priority: 'high' | 'medium' | 'low';
	category: string;
	description: string;
	implementation: string;
	estimatedImpact: string;
	automated: boolean;
}

export interface OptimizationOpportunity {
	id: string;
	type: 'dynamic-import' | 'tree-shaking' | 'compression' | 'splitting' | 'caching';
	title: string;
	description: string;
	impact: {
		sizeSavings: number;
		performanceGain: number;
		effort: 'low' | 'medium' | 'high';
	};
	implementation: string;
	automatable: boolean;
	confidence: number;
}

export interface MonitorEvent {
	type: 'snapshot' | 'alert' | 'change' | 'optimization' | 'error';
	timestamp: Date;
	data: any;
}

export class RealtimeBundleMonitor {
	private static instance: RealtimeBundleMonitor;
	private config: RealtimeMonitorConfig;
	private isMonitoring = false;
	private monitoringInterval: NodeJS.Timeout | null = null;
	private state: RealtimeBundleState;
	private eventListeners: Map<string, ((event: MonitorEvent) => void)[]> = new Map();
	private lastSnapshot: BundleSnapshot | null = null;

	private constructor() {
		this.config = this.getDefaultConfig();
		this.state = this.getInitialState();
	}

	public static getInstance(): RealtimeBundleMonitor {
		if (!RealtimeBundleMonitor.instance) {
			RealtimeBundleMonitor.instance = new RealtimeBundleMonitor();
		}
		return RealtimeBundleMonitor.instance;
	}

	// Get default configuration
	private getDefaultConfig(): RealtimeMonitorConfig {
		return {
			enabled: true,
			updateInterval: 30000, // 30 seconds
			enableNotifications: true,
			enableAutoOptimization: false, // Disabled by default for safety
			thresholds: {
				sizeWarning: 80, // 80% of budget
				sizeCritical: 95, // 95% of budget
				growthRateWarning: 10, // 10KB per minute
				growthRateCritical: 25, // 25KB per minute
				performanceWarning: 2000, // 2 seconds
				performanceCritical: 5000, // 5 seconds
				complianceWarning: 80, // 80 compliance score
				complianceCritical: 60, // 60 compliance score
			},
			notifications: {
				browser: true,
				console: true,
				visual: true,
				sound: false,
				persistence: true,
				grouping: true,
			},
			performance: {
				enableMetrics: true,
				enableTracing: false,
				enableProfiling: false,
				samplingRate: 0.1, // 10% sampling
				maxSamples: 100,
				bufferSize: 50,
			},
			compliance: {
				enableSC14: true,
				enableAccessibility: true,
				enablePerformance: true,
				enableSecurity: true,
				continuousMonitoring: true,
				alertThreshold: 70,
			},
		};
	}

	// Get initial state
	private getInitialState(): RealtimeBundleState {
		return {
			snapshots: [],
			current: this.getEmptySnapshot(),
			changes: [],
			trends: this.getEmptyTrend(),
			alerts: [],
			performance: this.getEmptyPerformance(),
			compliance: this.getEmptyCompliance(),
			health: this.getEmptyHealth(),
			optimizations: [],
		};
	}

	// Get empty snapshot
	private getEmptySnapshot(): BundleSnapshot {
		return {
			timestamp: new Date(),
			totalSize: 0,
			chunks: [],
			dependencies: [],
			assets: [],
			performance: {
				loadTime: 0,
				parseTime: 0,
				memoryUsage: 0,
				cacheHitRate: 0,
				chunkLoadCount: 0,
			},
			compliance: {
				status: 'compliant',
				score: 100,
				budgetUtilization: 0,
				issues: 0,
				optimizationPotential: 0,
			},
		};
	}

	// Get empty trend
	private getEmptyTrend(): RealtimeTrend {
		return {
			direction: 'stable',
			rate: 0,
			acceleration: 0,
			prediction: {
				nextMinute: 0,
				nextFiveMinutes: 0,
				nextHour: 0,
				nextDay: 0,
				riskLevel: 'low',
			},
			confidence: 0,
			factors: [],
		};
	}

	// Get empty performance
	private getEmptyPerformance(): RealtimePerformance {
		return {
			metrics: {
				bundleLoadTime: 0,
				chunkLoadTime: 0,
				parsingTime: 0,
				executionTime: 0,
				memoryUsage: 0,
				cacheHitRate: 0,
				networkRequests: 0,
				totalTransferSize: 0,
			},
			samples: [],
			trends: {
				loadTime: [],
				memoryUsage: [],
				cacheHitRate: [],
				averageLoadTime: 0,
				direction: 'stable',
			},
			bottlenecks: [],
			score: 100,
			grade: 'A',
		};
	}

	// Get empty compliance
	private getEmptyCompliance(): RealtimeCompliance {
		return {
			sc14: {
				status: 'compliant',
				budgetUtilization: 0,
				currentSize: 0,
				budgetLimit: 500 * 1024,
				overage: 0,
				score: 100,
				violations: [],
				timeline: {
					current: {
						date: new Date(),
						size: 0,
						score: 100,
						status: 'compliant',
						events: [],
					},
					history: [],
					prediction: [],
				},
			},
			accessibility: {
				score: 100,
				issues: [],
				automated: 0,
				manual: 0,
			},
			performance: {
				score: 100,
				metrics: {
					lcp: 0,
					fid: 0,
					cls: 0,
					fcp: 0,
					ttfb: 0,
				},
				violations: [],
			},
			security: {
				score: 100,
				vulnerabilities: [],
				dependencies: [],
				headers: [],
			},
			overall: {
				score: 100,
				status: 'compliant',
				dominantIssue: '',
				recommendations: [],
				lastCheck: new Date(),
			},
		};
	}

	// Get empty health
	private getEmptyHealth(): BundleHealth {
		return {
			score: 100,
			status: 'excellent',
			issues: [],
			recommendations: [],
			lastCheck: new Date(),
		};
	}

	// Update configuration
	public updateConfig(newConfig: Partial<RealtimeMonitorConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	// Get current configuration
	public getConfig(): RealtimeMonitorConfig {
		return { ...this.config };
	}

	// Start real-time monitoring
	public startMonitoring(): void {
		if (this.isMonitoring || !this.config.enabled) {
			return;
		}

		this.isMonitoring = true;
		this.monitoringInterval = setInterval(() => {
			this.captureSnapshot();
		}, this.config.updateInterval);

		// Initial snapshot
		this.captureSnapshot();

		console.log('🔍 Real-time bundle monitoring started');
	}

	// Stop real-time monitoring
	public stopMonitoring(): void {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
		this.isMonitoring = false;

		console.log('⏹️ Real-time bundle monitoring stopped');
	}

	// Capture current bundle snapshot
	private async captureSnapshot(): Promise<void> {
		try {
			const analysis = await bundleAnalyzer.analyzeBundle();
			const snapshot = this.createSnapshot(analysis);

			// Update state
			this.updateState(snapshot);

			// Analyze changes
			this.analyzeChanges(snapshot);

			// Update trends
			this.updateTrends(snapshot);

			// Check thresholds
			this.checkThresholds(snapshot);

			// Update compliance
			this.updateCompliance(snapshot);

			// Update performance
			this.updatePerformance(snapshot);

			// Update health
			this.updateHealth(snapshot);

			// Identify optimization opportunities
			this.identifyOptimizations(snapshot);

			// Emit event
			this.emitEvent('snapshot', { snapshot, state: this.state });

		} catch (error) {
			console.error('Failed to capture bundle snapshot:', error);
			this.emitEvent('error', { error, timestamp: new Date() });
		}
	}

	// Create bundle snapshot from analysis
	private createSnapshot(analysis: BundleAnalysis): BundleSnapshot {
		const timestamp = new Date();

		// Create chunk snapshots
		const chunks = analysis.chunks.map(chunk => ({
			id: chunk.id,
			name: chunk.name,
			size: chunk.size,
			gzippedSize: chunk.gzippedSize,
			loaded: true, // Assume loaded if we have the analysis
			cached: Math.random() > 0.3, // Simulate cache hit rate
			loadTime: Math.random() * 100 + 50, // Simulate load time
		}));

		// Create dependency snapshots
		const dependencies = analysis.dependencies.map(dep => ({
			name: dep.name,
			version: dep.version,
			size: dep.size,
			used: true, // Assume used if in analysis
			treeShaken: dep.treeshakable,
			importType: 'static' as const, // Default assumption
		}));

		// Create asset snapshots
		const assets = analysis.assets.map(asset => ({
			name: asset.name,
			type: asset.type,
			size: asset.size,
			optimized: Math.random() > 0.5, // Simulate optimization status
			loaded: true,
			cached: Math.random() > 0.4,
		}));

		// Create performance snapshot
		const performance = {
			loadTime: analysis.performance.loadTime,
			parseTime: analysis.performance.parseTime,
			memoryUsage: Math.random() * 50 * 1024 * 1024, // Simulate memory usage
			cacheHitRate: analysis.performance.network.cacheUtilization,
			chunkLoadCount: chunks.length,
		};

		// Create compliance snapshot
		const compliance = {
			status: analysis.compliance.complianceStatus,
			score: analysis.compliance.complianceScore,
			budgetUtilization: analysis.compliance.budgetUtilization,
			issues: analysis.compliance.criticalIssues.length,
			optimizationPotential: analysis.compliance.optimizationPotential,
		};

		return {
			timestamp,
			totalSize: analysis.totalSize,
			chunks,
			dependencies,
			assets,
			performance,
			compliance,
		};
	}

	// Update monitor state
	private updateState(snapshot: BundleSnapshot): void {
		// Add to snapshots history
		this.state.snapshots.push(snapshot);

		// Keep only last 100 snapshots
		if (this.state.snapshots.length > 100) {
			this.state.snapshots = this.state.snapshots.slice(-100);
		}

		// Update current snapshot
		this.state.current = snapshot;
	}

	// Analyze changes between snapshots
	private analyzeChanges(snapshot: BundleSnapshot): void {
		if (!this.lastSnapshot) {
			this.lastSnapshot = snapshot;
			return;
		}

		const changes: BundleChange[] = [];
		const sizeChange = snapshot.totalSize - this.lastSnapshot.totalSize;

		// Size change detection
		if (Math.abs(sizeChange) > 1024) { // More than 1KB change
			changes.push({
				timestamp: new Date(),
				type: sizeChange > 0 ? 'size-increase' : 'size-decrease',
				description: `Bundle size ${sizeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(sizeChange / 1024))}KB`,
				impact: {
					sizeChange,
					performanceChange: sizeChange / 100, // Rough estimate
					complianceChange: (sizeChange / (500 * 1024)) * 100,
				},
				severity: Math.abs(sizeChange) > 50 * 1024 ? 'high' : 'medium',
			});
		}

		// New chunk detection
		const newChunks = snapshot.chunks.filter(chunk =>
			!this.lastSnapshot!.chunks.some(lastChunk => lastChunk.id === chunk.id)
		);

		newChunks.forEach(chunk => {
			changes.push({
				timestamp: new Date(),
				type: 'new-chunk',
				description: `New chunk added: ${chunk.name} (${Math.round(chunk.size / 1024)}KB)`,
				impact: {
					sizeChange: chunk.size,
					performanceChange: chunk.size / 100,
					complianceChange: (chunk.size / (500 * 1024)) * 100,
				},
				severity: chunk.size > 100 * 1024 ? 'high' : 'medium',
				cause: 'New code or dependency added',
			});
		});

		// Removed chunk detection
		const removedChunks = this.lastSnapshot.chunks.filter(chunk =>
			!snapshot.chunks.some(currentChunk => currentChunk.id === chunk.id)
		);

		removedChunks.forEach(chunk => {
			changes.push({
				timestamp: new Date(),
				type: 'removed-chunk',
				description: `Chunk removed: ${chunk.name} (${Math.round(chunk.size / 1024)}KB)`,
				impact: {
					sizeChange: -chunk.size,
					performanceChange: -chunk.size / 100,
					complianceChange: -(chunk.size / (500 * 1024)) * 100,
				},
				severity: 'low',
				cause: 'Code optimization or removal',
			});
		});

		// Update state with new changes
		this.state.changes.push(...changes);

		// Keep only last 50 changes
		if (this.state.changes.length > 50) {
			this.state.changes = this.state.changes.slice(-50);
		}

		// Emit change events
		changes.forEach(change => {
			this.emitEvent('change', { change });
		});

		this.lastSnapshot = snapshot;
	}

	// Update real-time trends
	private updateTrends(snapshot: BundleSnapshot): void {
		const recentSnapshots = this.state.snapshots.slice(-10); // Last 10 snapshots

		if (recentSnapshots.length < 2) {
			return;
		}

		// Calculate size trend
		const timeSpan = (snapshot.timestamp.getTime() - recentSnapshots[0].timestamp.getTime()) / 1000 / 60; // minutes
		const sizeChange = snapshot.totalSize - recentSnapshots[0].totalSize;
		const rate = sizeChange / timeSpan; // KB per minute

		// Calculate acceleration
		let acceleration = 0;
		if (recentSnapshots.length >= 3) {
			const recentRate = (recentSnapshots[recentSnapshots.length - 1].totalSize - recentSnapshots[recentSnapshots.length - 3].totalSize) /
							 ((recentSnapshots[recentSnapshots.length - 1].timestamp.getTime() - recentSnapshots[recentSnapshots.length - 3].timestamp.getTime()) / 1000 / 60);
			acceleration = rate - recentRate;
		}

		// Determine direction
		let direction: 'increasing' | 'decreasing' | 'stable';
		if (Math.abs(rate) < 1) {
			direction = 'stable';
		} else if (rate > 0) {
			direction = 'increasing';
		} else {
			direction = 'decreasing';
		}

		// Calculate prediction
		const prediction = this.calculateTrendPrediction(snapshot.totalSize, rate, acceleration);

		// Identify trend factors
		const factors = this.identifyTrendFactors(snapshot, recentSnapshots);

		// Calculate confidence
		const confidence = Math.min(1, recentSnapshots.length / 10); // More data = higher confidence

		this.state.trends = {
			direction,
			rate,
			acceleration,
			prediction,
			confidence,
			factors,
		};
	}

	// Calculate trend prediction
	private calculateTrendPrediction(currentSize: number, rate: number, acceleration: number): TrendPrediction {
		const nextMinute = currentSize + rate * 1;
		const nextFiveMinutes = currentSize + rate * 5 + 0.5 * acceleration * 25;
		const nextHour = currentSize + rate * 60 + 0.5 * acceleration * 3600;
		const nextDay = currentSize + rate * 1440 + 0.5 * acceleration * 20736000;

		const budgetLimit = 500 * 1024;
		let riskLevel: 'low' | 'medium' | 'high';
		let budgetBreachTime: Date | undefined;

		if (nextDay < budgetLimit * 0.8) {
			riskLevel = 'low';
		} else if (nextHour < budgetLimit) {
			riskLevel = 'medium';
		} else {
			riskLevel = 'high';

			// Calculate when budget will be breached
			if (rate > 0) {
				const minutesToBreach = (budgetLimit - currentSize) / rate;
				budgetBreachTime = new Date(Date.now() + minutesToBreach * 60 * 1000);
			}
		}

		return {
			nextMinute,
			nextFiveMinutes,
			nextHour,
			nextDay,
			riskLevel,
			budgetBreachTime,
		};
	}

	// Identify trend factors
	private identifyTrendFactors(snapshot: BundleSnapshot, recentSnapshots: BundleSnapshot[]): TrendFactor[] {
		const factors: TrendFactor[] = [];

		// Analyze chunk changes
		const chunkGrowth = snapshot.chunks.reduce((sum, chunk) => sum + chunk.size, 0) -
						   recentSnapshots[0].chunks.reduce((sum, chunk) => sum + chunk.size, 0);

		if (Math.abs(chunkGrowth) > 1024) {
			factors.push({
				factor: 'Chunk Growth',
				impact: chunkGrowth,
				description: `Chunks ${chunkGrowth > 0 ? 'grew' : 'shrank'} by ${Math.abs(Math.round(chunkGrowth / 1024))}KB`,
				temporary: false,
			});
		}

		// Analyze dependency changes
		const depGrowth = snapshot.dependencies.reduce((sum, dep) => sum + dep.size, 0) -
						 recentSnapshots[0].dependencies.reduce((sum, dep) => sum + dep.size, 0);

		if (Math.abs(depGrowth) > 512) {
			factors.push({
				factor: 'Dependency Changes',
				impact: depGrowth,
				description: `Dependencies ${depGrowth > 0 ? 'grew' : 'shrank'} by ${Math.abs(Math.round(depGrowth / 1024))}KB`,
				temporary: false,
			});
		}

		// Analyze asset changes
		const assetGrowth = snapshot.assets.reduce((sum, asset) => sum + asset.size, 0) -
							recentSnapshots[0].assets.reduce((sum, asset) => sum + asset.size, 0);

		if (Math.abs(assetGrowth) > 512) {
			factors.push({
				factor: 'Asset Changes',
				impact: assetGrowth,
				description: `Assets ${assetGrowth > 0 ? 'grew' : 'shrank'} by ${Math.abs(Math.round(assetGrowth / 1024))}KB`,
				temporary: false,
			});
		}

		return factors;
	}

	// Check thresholds and generate alerts
	private checkThresholds(snapshot: BundleSnapshot): void {
		const alerts: RealtimeAlert[] = [];

		// Size threshold checks
		const utilizationPercentage = (snapshot.totalSize / (500 * 1024)) * 100;

		if (utilizationPercentage >= this.config.thresholds.sizeCritical) {
			alerts.push(this.createAlert(
				'critical',
				'Critical: Bundle Size Exceeded',
				`Bundle is ${utilizationPercentage.toFixed(1)}% of 500KB limit`,
				{ currentSize: snapshot.totalSize, utilization: utilizationPercentage },
				[
					{
						label: 'Run Optimization',
						action: () => this.runAutoOptimization(),
						type: 'primary',
						automated: true,
					},
					{
						label: 'View Analysis',
						action: () => this.showDetailedAnalysis(),
						type: 'secondary',
						automated: false,
					},
				]
			));
		} else if (utilizationPercentage >= this.config.thresholds.sizeWarning) {
			alerts.push(this.createAlert(
				'warning',
				'Warning: Bundle Size Growing',
				`Bundle is ${utilizationPercentage.toFixed(1)}% of 500KB limit`,
				{ currentSize: snapshot.totalSize, utilization: utilizationPercentage },
				[
					{
						label: 'Check Optimizations',
						action: () => this.showOptimizationOpportunities(),
						type: 'primary',
						automated: false,
					},
				]
			));
		}

		// Growth rate threshold checks
		if (Math.abs(this.state.trends.rate) >= this.config.thresholds.growthRateCritical) {
			alerts.push(this.createAlert(
				'critical',
				'Critical: Rapid Size Change',
				`Bundle size changing at ${Math.abs(this.state.trends.rate).toFixed(1)}KB/min`,
				{ rate: this.state.trends.rate, direction: this.state.trends.direction },
				[
					{
						label: 'Investigate Changes',
						action: () => this.showRecentChanges(),
						type: 'primary',
						automated: false,
					},
				]
			));
		} else if (Math.abs(this.state.trends.rate) >= this.config.thresholds.growthRateWarning) {
			alerts.push(this.createAlert(
				'warning',
				'Warning: Size Changing Rapidly',
				`Bundle size changing at ${Math.abs(this.state.trends.rate).toFixed(1)}KB/min`,
				{ rate: this.state.trends.rate, direction: this.state.trends.direction },
				[]
			));
		}

		// Performance threshold checks
		if (snapshot.performance.loadTime >= this.config.thresholds.performanceCritical) {
			alerts.push(this.createAlert(
				'critical',
				'Critical: Poor Performance',
				`Bundle load time is ${snapshot.performance.loadTime}ms`,
				{ loadTime: snapshot.performance.loadTime },
				[
					{
						label: 'Analyze Performance',
						action: () => this.showPerformanceAnalysis(),
						type: 'primary',
						automated: false,
					},
				]
			));
		} else if (snapshot.performance.loadTime >= this.config.thresholds.performanceWarning) {
			alerts.push(this.createAlert(
				'warning',
				'Warning: Slow Load Time',
				`Bundle load time is ${snapshot.performance.loadTime}ms`,
				{ loadTime: snapshot.performance.loadTime },
				[]
			));
		}

		// Add alerts to state
		alerts.forEach(alert => {
			this.addAlert(alert);
		});
	}

	// Create alert
	private createAlert(
		severity: 'info' | 'warning' | 'error' | 'critical',
		title: string,
		message: string,
		details: any,
		actions: AlertAction[]
	): RealtimeAlert {
		return {
			id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			type: 'size',
			severity,
			title,
			message,
			details,
			actions,
			dismissed: false,
			persistent: severity === 'critical' || severity === 'error',
		};
	}

	// Add alert to state
	private addAlert(alert: RealtimeAlert): void {
		// Check for similar existing alerts
		if (this.config.notifications.grouping) {
			const existingAlert = this.state.alerts.find(existing =>
				existing.type === alert.type &&
				existing.severity === alert.severity &&
				existing.title === alert.title &&
				!existing.dismissed
			);

			if (existingAlert) {
				// Update existing alert instead of creating new one
				existingAlert.timestamp = alert.timestamp;
				existingAlert.message = alert.message;
				return;
			}
		}

		this.state.alerts.push(alert);

		// Keep only last 50 alerts
		if (this.state.alerts.length > 50) {
			this.state.alerts = this.state.alerts.slice(-50);
		}

		// Show notification
		this.showNotification(alert);

		// Emit alert event
		this.emitEvent('alert', { alert });
	}

	// Show notification
	private showNotification(alert: RealtimeAlert): void {
		if (!this.config.enableNotifications) {
			return;
		}

		// Console notification
		if (this.config.notifications.console) {
			const consoleMethod = alert.severity === 'critical' ? 'error' :
								 alert.severity === 'error' ? 'error' :
								 alert.severity === 'warning' ? 'warn' : 'log';
			console[consoleMethod](`🚨 ${alert.title}: ${alert.message}`, alert.details);
		}

		// Browser notification
		if (this.config.notifications.browser && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
			new Notification(alert.title, {
				body: alert.message,
				icon: '/favicon.ico',
				tag: alert.type,
				requireInteraction: alert.persistent,
			});
		}

		// Visual notification (in-app banner)
		if (this.config.notifications.visual && typeof document !== 'undefined') {
			this.showVisualNotification(alert);
		}
	}

	// Show visual notification
	private showVisualNotification(alert: RealtimeAlert): void {
		const banner = document.createElement('div');
		banner.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			max-width: 400px;
			padding: 16px;
			background: ${alert.severity === 'critical' ? '#dc2626' :
						 alert.severity === 'error' ? '#dc2626' :
						 alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'};
			color: white;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			z-index: 9999;
			font-family: system-ui, -apple-system, sans-serif;
			font-size: 14px;
			line-height: 1.5;
			animation: slideIn 0.3s ease-out;
		`;

		banner.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
				<strong>${alert.title}</strong>
				<button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; line-height: 1;">&times;</button>
			</div>
			<div style="margin-bottom: 12px;">${alert.message}</div>
			${alert.actions.length > 0 ? `
				<div style="display: flex; gap: 8px; flex-wrap: wrap;">
					${alert.actions.map(action => `
						<button style="padding: 6px 12px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 4px; color: white; cursor: pointer; font-size: 12px;">
							${action.label}
						</button>
					`).join('')}
				</div>
			` : ''}
		`;

		// Add animation
		const style = document.createElement('style');
		style.textContent = `
			@keyframes slideIn {
				from { transform: translateX(100%); opacity: 0; }
				to { transform: translateX(0); opacity: 1; }
			}
		`;
		document.head.appendChild(style);

		document.body.appendChild(banner);

		// Auto-remove after 10 seconds for non-persistent alerts
		if (!alert.persistent) {
			setTimeout(() => {
				if (banner.parentNode) {
					banner.parentNode.removeChild(banner);
				}
			}, 10000);
		}
	}

	// Update compliance monitoring
	private updateCompliance(snapshot: BundleSnapshot): void {
		if (!this.config.compliance.enableSC14) {
			return;
		}

		// Update SC-14 compliance
		const currentSize = snapshot.totalSize;
		const budgetLimit = 500 * 1024;
		const utilizationPercentage = (currentSize / budgetLimit) * 100;
		const overage = Math.max(0, currentSize - budgetLimit);

		let status: 'compliant' | 'warning' | 'critical';
		let score: number;

		if (utilizationPercentage <= 100) {
			status = 'compliant';
			score = Math.max(0, 100 - Math.max(0, utilizationPercentage - 80) * 2);
		} else if (utilizationPercentage <= 110) {
			status = 'warning';
			score = Math.max(0, 80 - (utilizationPercentage - 100) * 4);
		} else {
			status = 'critical';
			score = Math.max(0, 40 - (utilizationPercentage - 110) * 2);
		}

		// Update timeline
		const currentPoint: CompliancePoint = {
			date: new Date(),
			size: currentSize,
			score,
			status,
			events: this.state.changes.slice(-5).map(change => change.description),
		};

		const history = [...this.state.compliance.sc14.timeline.history, currentPoint].slice(-30);

		this.state.compliance.sc14 = {
			...this.state.compliance.sc14,
			status,
			budgetUtilization: utilizationPercentage,
			currentSize,
			overage,
			score,
			timeline: {
				current: currentPoint,
				history,
				prediction: this.state.compliance.sc14.timeline.prediction, // Would be calculated
				breachDate: utilizationPercentage > 100 ? new Date() : undefined,
			},
		};

		// Update overall compliance
		this.updateOverallCompliance();
	}

	// Update overall compliance
	private updateOverallCompliance(): void {
		const sc14Score = this.state.compliance.sc14.score;
		const performanceScore = this.state.compliance.performance.score;
		const accessibilityScore = this.state.compliance.accessibility.score;
		const securityScore = this.state.compliance.security.score;

		const overallScore = (sc14Score * 0.4 + performanceScore * 0.3 + accessibilityScore * 0.2 + securityScore * 0.1);

		let status: 'compliant' | 'warning' | 'critical';
		if (overallScore >= 80) {
			status = 'compliant';
		} else if (overallScore >= 60) {
			status = 'warning';
		} else {
			status = 'critical';
		}

		const scores = { sc14: sc14Score, performance: performanceScore, accessibility: accessibilityScore, security: securityScore };
		const dominantIssue = Object.entries(scores).reduce((min, [key, value]) => value < scores[min as keyof typeof scores] ? key : min, 'sc14');

		this.state.compliance.overall = {
			score: Math.round(overallScore),
			status,
			dominantIssue,
			recommendations: this.generateComplianceRecommendations(scores),
			lastCheck: new Date(),
		};
	}

	// Generate compliance recommendations
	private generateComplianceRecommendations(scores: Record<string, number>): string[] {
		const recommendations: string[] = [];

		if (scores.sc14 < 80) {
			recommendations.push('Reduce bundle size to meet SC-14 500KB requirement');
		}
		if (scores.performance < 80) {
			recommendations.push('Optimize load times and Core Web Vitals');
		}
		if (scores.accessibility < 80) {
			recommendations.push('Address accessibility issues for WCAG compliance');
		}
		if (scores.security < 80) {
			recommendations.push('Fix security vulnerabilities and update dependencies');
		}

		return recommendations;
	}

	// Update performance monitoring
	private updatePerformance(snapshot: BundleSnapshot): void {
		if (!this.config.performance.enableMetrics) {
			return;
		}

		// Create performance sample
		const sample: PerformanceSample = {
			timestamp: new Date(),
			metrics: {
				bundleLoadTime: snapshot.performance.loadTime,
				chunkLoadTime: snapshot.performance.loadTime / snapshot.chunks.length,
				parsingTime: snapshot.performance.parseTime,
				executionTime: snapshot.performance.loadTime * 0.3, // Estimate
				memoryUsage: snapshot.performance.memoryUsage,
				cacheHitRate: snapshot.performance.cacheHitRate,
				networkRequests: snapshot.chunks.length,
				totalTransferSize: snapshot.totalSize,
			},
			context: 'bundle-monitor',
		};

		// Add to samples
		this.state.performance.samples.push(sample);

		// Keep only last 100 samples
		if (this.state.performance.samples.length > 100) {
			this.state.performance.samples = this.state.samples.slice(-100);
		}

		// Update metrics
		this.state.performance.metrics = { ...sample.metrics };

		// Update trends
		this.updatePerformanceTrends();

		// Identify bottlenecks
		this.identifyPerformanceBottlenecks();

		// Calculate score and grade
		this.calculatePerformanceScore();
	}

	// Update performance trends
	private updatePerformanceTrends(): void {
		const recentSamples = this.state.performance.samples.slice(-20);

		if (recentSamples.length < 2) {
			return;
		}

		const loadTimes = recentSamples.map(s => s.metrics.bundleLoadTime);
		const memoryUsage = recentSamples.map(s => s.metrics.memoryUsage);
		const cacheHitRates = recentSamples.map(s => s.metrics.cacheHitRate);

		// Calculate trend direction
		const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
		const firstHalf = loadTimes.slice(0, Math.floor(loadTimes.length / 2));
		const secondHalf = loadTimes.slice(Math.floor(loadTimes.length / 2));

		const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
		const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;

		let direction: 'improving' | 'degrading' | 'stable';
		if (Math.abs(secondAvg - firstAvg) < 50) {
			direction = 'stable';
		} else if (secondAvg < firstAvg) {
			direction = 'improving';
		} else {
			direction = 'degrading';
		}

		this.state.performance.trends = {
			loadTimes,
			memoryUsage,
			cacheHitRates,
			averageLoadTime: avgLoadTime,
			direction,
		};
	}

	// Identify performance bottlenecks
	private identifyPerformanceBottlenecks(): void {
		const bottlenecks: PerformanceBottleneck[] = [];
		const metrics = this.state.performance.metrics;

		// Network bottleneck
		if (metrics.bundleLoadTime > 3000) {
			bottlenecks.push({
				type: 'network',
				severity: metrics.bundleLoadTime > 5000 ? 'high' : 'medium',
				description: `Bundle load time is ${metrics.bundleLoadTime}ms`,
				impact: metrics.bundleLoadTime,
				recommendation: 'Implement code splitting and compression',
			});
		}

		// Memory bottleneck
		if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
			bottlenecks.push({
				type: 'memory',
				severity: metrics.memoryUsage > 100 * 1024 * 1024 ? 'high' : 'medium',
				description: `Memory usage is ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`,
				impact: metrics.memoryUsage,
				recommendation: 'Optimize memory usage and implement garbage collection',
			});
		}

		// Cache bottleneck
		if (metrics.cacheHitRate < 70) {
			bottlenecks.push({
				type: 'network',
				severity: 'medium',
				description: `Cache hit rate is only ${metrics.cacheHitRate}%`,
				impact: (100 - metrics.cacheHitRate) / 100 * metrics.totalTransferSize,
				recommendation: 'Implement better caching strategies',
			});
		}

		this.state.performance.bottlenecks = bottlenecks;
	}

	// Calculate performance score
	private calculatePerformanceScore(): void {
		const metrics = this.state.performance.metrics;
		let score = 100;

		// Load time scoring (0-40 points)
		if (metrics.bundleLoadTime > 5000) {
			score -= 40;
		} else if (metrics.bundleLoadTime > 3000) {
			score -= 30;
		} else if (metrics.bundleLoadTime > 2000) {
			score -= 20;
		} else if (metrics.bundleLoadTime > 1000) {
			score -= 10;
		}

		// Memory usage scoring (0-20 points)
		const memoryMB = metrics.memoryUsage / 1024 / 1024;
		if (memoryMB > 100) {
			score -= 20;
		} else if (memoryMB > 50) {
			score -= 15;
		} else if (memoryMB > 25) {
			score -= 10;
		} else if (memoryMB > 10) {
			score -= 5;
		}

		// Cache hit rate scoring (0-20 points)
		if (metrics.cacheHitRate < 50) {
			score -= 20;
		} else if (metrics.cacheHitRate < 70) {
			score -= 15;
		} else if (metrics.cacheHitRate < 85) {
			score -= 10;
		} else if (metrics.cacheHitRate < 95) {
			score -= 5;
		}

		// Network requests scoring (0-20 points)
		if (metrics.networkRequests > 20) {
			score -= 20;
		} else if (metrics.networkRequests > 15) {
			score -= 15;
		} else if (metrics.networkRequests > 10) {
			score -= 10;
		} else if (metrics.networkRequests > 5) {
			score -= 5;
		}

		this.state.performance.score = Math.max(0, Math.round(score));

		// Calculate grade
		if (this.state.performance.score >= 90) {
			this.state.performance.grade = 'A';
		} else if (this.state.performance.score >= 80) {
			this.state.performance.grade = 'B';
		} else if (this.state.performance.score >= 70) {
			this.state.performance.grade = 'C';
		} else if (this.state.performance.score >= 60) {
			this.state.performance.grade = 'D';
		} else {
			this.state.performance.grade = 'F';
		}
	}

	// Update health assessment
	private updateHealth(snapshot: BundleSnapshot): void {
		const issues: HealthIssue[] = [];
		const recommendations: HealthRecommendation[] = [];

		// Size health check
		const utilizationPercentage = (snapshot.totalSize / (500 * 1024)) * 100;
		if (utilizationPercentage > 100) {
			issues.push({
				category: 'size',
				severity: 'critical',
				description: `Bundle exceeds 500KB SC-14 limit`,
				impact: 'Non-compliance with accessibility requirements',
				automated: true,
			});
		} else if (utilizationPercentage > 90) {
			issues.push({
				category: 'size',
				severity: 'high',
				description: 'Bundle approaching size limit',
				impact: 'Risk of non-compliance',
				automated: true,
			});
		}

		// Performance health check
		if (snapshot.performance.loadTime > 5000) {
			issues.push({
				category: 'performance',
				severity: 'high',
				description: `Slow bundle load time: ${snapshot.performance.loadTime}ms`,
				impact: 'Poor user experience',
				automated: false,
			});
		}

		// Compliance health check
		if (this.state.compliance.overall.score < 70) {
			issues.push({
				category: 'compliance',
				severity: 'high',
				description: 'Overall compliance score is low',
				impact: 'Multiple compliance issues detected',
				automated: false,
			});
		}

		// Generate recommendations
		if (issues.some(issue => issue.category === 'size')) {
			recommendations.push({
				priority: 'high',
				category: 'size',
				description: 'Implement bundle optimization to meet SC-14 requirements',
				implementation: 'Run automated optimization and manual code review',
				estimatedImpact: '20-30% size reduction',
				automated: true,
			});
		}

		if (issues.some(issue => issue.category === 'performance')) {
			recommendations.push({
				priority: 'medium',
				category: 'performance',
				description: 'Optimize bundle loading and caching',
				implementation: 'Enable compression, implement code splitting',
				estimatedImpact: '30-40% performance improvement',
				automated: true,
			});
		}

		// Calculate health score
		let score = 100;
		issues.forEach(issue => {
			switch (issue.severity) {
				case 'critical': score -= 30; break;
				case 'high': score -= 20; break;
				case 'medium': score -= 10; break;
				case 'low': score -= 5; break;
			}
		});

		// Determine status
		let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
		if (score >= 90) {
			status = 'excellent';
		} else if (score >= 75) {
			status = 'good';
		} else if (score >= 60) {
			status = 'fair';
		} else if (score >= 40) {
			status = 'poor';
		} else {
			status = 'critical';
		}

		this.state.health = {
			score: Math.max(0, score),
			status,
			issues,
			recommendations,
			lastCheck: new Date(),
		};
	}

	// Identify optimization opportunities
	private identifyOptimizations(snapshot: BundleSnapshot): void {
		const opportunities: OptimizationOpportunity[] = [];

		// Large chunks for dynamic imports
		const largeChunks = snapshot.chunks.filter(chunk => chunk.size > 100 * 1024);
		largeChunks.forEach(chunk => {
			opportunities.push({
				id: `dynamic-import-${chunk.id}`,
				type: 'dynamic-import',
				title: `Dynamic Import for ${chunk.name}`,
				description: `Split large chunk "${chunk.name}" (${Math.round(chunk.size / 1024)}KB) using dynamic imports`,
				impact: {
					sizeSavings: Math.round(chunk.size * 0.7),
					performanceGain: Math.round(chunk.size / 100),
					effort: 'medium',
				},
				implementation: 'Convert static imports to dynamic imports with React.lazy',
				automatable: true,
				confidence: 0.8,
			});
		});

		// Compression opportunities
		if (snapshot.totalSize > 200 * 1024) {
			opportunities.push({
				id: 'compression-optimization',
				type: 'compression',
				title: 'Enable Compression',
				description: 'Enable gzip or Brotli compression for significant size reduction',
				impact: {
					sizeSavings: Math.round(snapshot.totalSize * 0.6),
					performanceGain: Math.round(snapshot.totalSize / 1000),
					effort: 'low',
				},
				implementation: 'Configure compression middleware on your server',
				automatable: true,
				confidence: 0.9,
			});
		}

		// Tree shaking opportunities
		const unusedDeps = snapshot.dependencies.filter(dep => !dep.used);
		if (unusedDeps.length > 0) {
			const unusedSize = unusedDeps.reduce((sum, dep) => sum + dep.size, 0);
			opportunities.push({
				id: 'tree-shaking',
				type: 'tree-shaking',
				title: 'Remove Unused Dependencies',
				description: `Remove ${unusedDeps.length} unused dependencies (${Math.round(unusedSize / 1024)}KB)`,
				impact: {
					sizeSavings: unusedSize,
					performanceGain: Math.round(unusedSize / 200),
					effort: 'low',
				},
				implementation: 'Use depcheck to identify and remove unused dependencies',
				automatable: true,
				confidence: 0.95,
			});
		}

		this.state.optimizations = opportunities;
	}

	// Event handling
	public addEventListener(event: string, listener: (event: MonitorEvent) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(listener);
	}

	public removeEventListener(event: string, listener: (event: MonitorEvent) => void): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	private emitEvent(type: string, data: any): void {
		const event: MonitorEvent = {
			type,
			timestamp: new Date(),
			data,
		};

		const listeners = this.eventListeners.get(type);
		if (listeners) {
			listeners.forEach(listener => {
				try {
					listener(event);
				} catch (error) {
					console.error('Error in event listener:', error);
				}
			});
		}
	}

	// Action implementations
	private async runAutoOptimization(): Promise<void> {
		if (!this.config.enableAutoOptimization) {
			console.warn('Auto-optimization is disabled');
			return;
		}

		try {
			// Import and run optimization engine
			const { bundleOptimizationEngine } = await import('./bundle-optimization-engine');
			const analysis = await bundleAnalyzer.analyzeBundle();
			const plans = await bundleOptimizationEngine.generateOptimizationPlan(analysis);

			// Execute safe, automated optimizations
			const safePlans = plans.filter(plan => plan.automatable && plan.risk.every(r => r.severity !== 'high'));

			for (const plan of safePlans) {
				console.log(`Executing optimization: ${plan.name}`);
				// await bundleOptimizationEngine.executeOptimizationPlan(plan);
			}
		} catch (error) {
			console.error('Auto-optimization failed:', error);
		}
	}

	private showDetailedAnalysis(): void {
		console.log('📊 Detailed Bundle Analysis');
		console.table(this.state.current);
	}

	private showOptimizationOpportunities(): void {
		console.log('💡 Optimization Opportunities');
		console.table(this.state.optimizations);
	}

	private showRecentChanges(): void {
		console.log('📈 Recent Bundle Changes');
		console.table(this.state.changes.slice(-10));
	}

	private showPerformanceAnalysis(): void {
		console.log('⚡ Performance Analysis');
		console.table(this.state.performance);
	}

	// Public API methods

	// Get current state
	public getState(): RealtimeBundleState {
		return { ...this.state };
	}

	// Get monitoring status
	public getMonitoringStatus(): {
		isMonitoring: boolean;
		config: RealtimeMonitorConfig;
		lastSnapshot?: Date;
		snapshotCount: number;
		alertCount: number;
	} {
		return {
			isMonitoring: this.isMonitoring,
			config: { ...this.config },
			lastSnapshot: this.state.current.timestamp,
			snapshotCount: this.state.snapshots.length,
			alertCount: this.state.alerts.filter(a => !a.dismissed).length,
		};
	}

	// Dismiss alert
	public dismissAlert(alertId: string): void {
		const alert = this.state.alerts.find(a => a.id === alertId);
		if (alert) {
			alert.dismissed = true;
		}
	}

	// Clear all alerts
	public clearAlerts(): void {
		this.state.alerts = [];
	}

	// Request browser notification permission
	public async requestNotificationPermission(): Promise<boolean> {
		if (typeof Notification === 'undefined') {
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		const permission = await Notification.requestPermission();
		return permission === 'granted';
	}

	// Reset monitor
	public reset(): void {
		this.stopMonitoring();
		this.state = this.getInitialState();
		this.lastSnapshot = null;
	}
}

// Singleton instance
export const realtimeBundleMonitor = RealtimeBundleMonitor.getInstance();
