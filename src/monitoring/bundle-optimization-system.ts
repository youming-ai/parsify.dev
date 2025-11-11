/**
 * Bundle Optimization System Integration
 * Integrates all bundle monitoring and optimization components
 * Provides automated SC-14 compliance enforcement and optimization
 */

import { bundleAnalyzer, type BundleAnalysis } from '@/analytics/bundle-analyzer';
import { bundleOptimizationEngine, type OptimizationPlan, type OptimizationResult } from './bundle-optimization-engine';
import { sizeBudgetManager, type BudgetStatus } from './size-budget-manager';
import { realtimeBundleMonitor, type RealtimeBundleState } from './realtime-bundle-monitor';
import { performanceObserver } from '../performance-observer';

export interface BundleOptimizationSystem {
	enabled: boolean;
	autoMode: boolean;
	schedule: OptimizationSchedule;
	thresholds: SystemThresholds;
	integrations: SystemIntegrations;
	automation: AutomationConfig;
}

export interface OptimizationSchedule {
	enabled: boolean;
	frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
	timeWindow?: { start: string; end: string }; // HH:MM format
	lastRun?: Date;
	nextRun?: Date;
}

export interface SystemThresholds {
	budgetThreshold: number; // percentage
	performanceThreshold: number; // milliseconds
	complianceThreshold: number; // score
	growthRateThreshold: number; // KB per hour
	riskThreshold: number; // 0-1
}

export interface SystemIntegrations {
	ciCd: boolean;
	analytics: boolean;
	notifications: boolean;
	monitoring: boolean;
	logging: boolean;
	versionControl: boolean;
}

export interface AutomationConfig {
	autoOptimize: boolean;
	autoDeploy: boolean;
	autoRollback: boolean;
	safeMode: boolean;
	manualApproval: boolean;
	maxRiskLevel: 'low' | 'medium' | 'high';
}

export interface SystemStatus {
	enabled: boolean;
	monitoring: {
		realtime: boolean;
		budget: boolean;
		performance: boolean;
		compliance: boolean;
	};
	optimization: {
		automated: boolean;
		pending: number;
		inProgress: boolean;
		lastResult?: OptimizationResult;
	};
	health: {
		score: number;
		status: 'healthy' | 'warning' | 'critical';
		issues: string[];
	};
	metrics: SystemMetrics;
}

export interface SystemMetrics {
	totalSavings: number;
	optimizationCount: number;
	successRate: number;
	averageReduction: number;
	complianceScore: number;
	performanceScore: number;
	lastAnalysis: Date;
}

export interface OptimizationReport {
	id: string;
	timestamp: Date;
	analysis: BundleAnalysis;
	status: BudgetStatus;
	monitoring: RealtimeBundleState;
	recommendations: SystemRecommendation[];
	actions: Action[];
	results: ActionResult[];
	summary: ReportSummary;
}

export interface SystemRecommendation {
	id: string;
	type: 'optimization' | 'configuration' | 'process' | 'monitoring';
	priority: 'critical' | 'high' | 'medium' | 'low';
	title: string;
	description: string;
	impact: {
		sizeSavings: number;
		performanceGain: number;
		complianceImprovement: number;
	};
	implementation: string;
	automatable: boolean;
	dependencies: string[];
	risks: string[];
	estimatedEffort: number; // hours
}

export interface Action {
	id: string;
	type: 'analyze' | 'optimize' | 'configure' | 'monitor' | 'notify';
	description: string;
	status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
	automated: boolean;
	startTime?: Date;
	endTime?: Date;
	duration?: number;
	result?: any;
	error?: string;
}

export interface ActionResult {
	action: string;
	success: boolean;
	impact: {
		sizeBefore: number;
		sizeAfter: number;
		savings: number;
		performanceBefore: number;
		performanceAfter: number;
		improvement: number;
	};
	metadata: Record<string, any>;
	timestamp: Date;
}

export interface ReportSummary {
	totalOptimizations: number;
	successfulOptimizations: number;
	totalSavings: number;
	averageSavings: number;
	complianceScore: number;
	performanceScore: number;
	healthScore: number;
	recommendations: number;
	automatedActions: number;
	manualActions: number;
}

export interface BundleOptimizationEvent {
	type:
		| 'analysis-started'
		| 'analysis-completed'
		| 'optimization-started'
		| 'optimization-completed'
		| 'violation-detected'
		| 'compliance-achieved';
	timestamp: Date;
	data: any;
	source: string;
}

export class BundleOptimizationSystemIntegration {
	private static instance: BundleOptimizationSystemIntegration;
	private config: BundleOptimizationSystem;
	private status: SystemStatus;
	private reports: OptimizationReport[] = [];
	private eventListeners: Map<string, ((event: BundleOptimizationEvent) => void)[]> = new Map();
	private isRunning = false;
	private scheduleInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.config = this.getDefaultConfig();
		this.status = this.getInitialStatus();
	}

	public static getInstance(): BundleOptimizationSystemIntegration {
		if (!BundleOptimizationSystemIntegration.instance) {
			BundleOptimizationSystemIntegration.instance = new BundleOptimizationSystemIntegration();
		}
		return BundleOptimizationSystemIntegration.instance;
	}

	// Get default configuration
	private getDefaultConfig(): BundleOptimizationSystem {
		return {
			enabled: true,
			autoMode: false, // Start with manual mode for safety
			schedule: {
				enabled: true,
				frequency: 'hourly',
				timeWindow: { start: '02:00', end: '04:00' }, // Run during off-peak hours
			},
			thresholds: {
				budgetThreshold: 90, // 90% of 500KB budget
				performanceThreshold: 3000, // 3 seconds
				complianceThreshold: 80, // 80 compliance score
				growthRateThreshold: 50, // 50KB per hour
				riskThreshold: 0.7, // 70% confidence threshold
			},
			integrations: {
				ciCd: false, // Disabled by default
				analytics: true,
				notifications: true,
				monitoring: true,
				logging: true,
				versionControl: false,
			},
			automation: {
				autoOptimize: false, // Disabled by default
				autoDeploy: false,
				autoRollback: true,
				safeMode: true,
				manualApproval: true,
				maxRiskLevel: 'medium',
			},
		};
	}

	// Get initial status
	private getInitialStatus(): SystemStatus {
		return {
			enabled: false,
			monitoring: {
				realtime: false,
				budget: false,
				performance: false,
				compliance: false,
			},
			optimization: {
				automated: false,
				pending: 0,
				inProgress: false,
			},
			health: {
				score: 100,
				status: 'healthy',
				issues: [],
			},
			metrics: {
				totalSavings: 0,
				optimizationCount: 0,
				successRate: 100,
				averageReduction: 0,
				complianceScore: 100,
				performanceScore: 100,
				lastAnalysis: new Date(),
			},
		};
	}

	// Start the bundle optimization system
	public async start(): Promise<void> {
		if (this.isRunning) {
			console.warn('Bundle optimization system is already running');
			return;
		}

		if (!this.config.enabled) {
			console.warn('Bundle optimization system is disabled');
			return;
		}

		try {
			this.isRunning = true;
			this.status.enabled = true;

			// Initialize monitoring components
			await this.initializeMonitoring();

			// Start scheduled optimizations
			this.startScheduledOptimizations();

			// Setup event listeners
			this.setupEventListeners();

			// Run initial analysis
			await this.runAnalysis();

			console.log('🚀 Bundle optimization system started successfully');
			this.emitEvent('system-started', { config: this.config });
		} catch (error) {
			console.error('Failed to start bundle optimization system:', error);
			this.isRunning = false;
			this.status.enabled = false;
			throw error;
		}
	}

	// Stop the bundle optimization system
	public stop(): void {
		if (!this.isRunning) {
			return;
		}

		this.isRunning = false;
		this.status.enabled = false;

		// Stop monitoring
		realtimeBundleMonitor.stopMonitoring();
		sizeBudgetManager.stopMonitoring();

		// Clear schedule
		if (this.scheduleInterval) {
			clearInterval(this.scheduleInterval);
			this.scheduleInterval = null;
		}

		console.log('⏹️ Bundle optimization system stopped');
		this.emitEvent('system-stopped', { timestamp: new Date() });
	}

	// Initialize monitoring components
	private async initializeMonitoring(): Promise<void> {
		if (this.config.integrations.monitoring) {
			// Start real-time monitoring
			if (this.config.integrations.notifications) {
				await realtimeBundleMonitor.requestNotificationPermission();
			}
			realtimeBundleMonitor.startMonitoring();
			this.status.monitoring.realtime = true;

			// Start budget monitoring
			sizeBudgetManager.startMonitoring(30); // Check every 30 minutes
			this.status.monitoring.budget = true;

			// Performance monitoring is handled by performanceObserver
			this.status.monitoring.performance = true;

			// Compliance monitoring
			this.status.monitoring.compliance = true;
		}
	}

	// Setup event listeners
	private setupEventListeners(): void {
		// Listen to real-time monitor events
		realtimeBundleMonitor.addEventListener('alert', (event) => {
			this.handleRealtimeAlert(event.data);
		});

		realtimeBundleMonitor.addEventListener('change', (event) => {
			this.handleBundleChange(event.data);
		});

		// Listen to budget manager events
		// (Note: In a real implementation, sizeBudgetManager would emit events)
	}

	// Handle real-time alerts
	private handleRealtimeAlert(alert: any): void {
		console.log('🚨 Real-time alert:', alert);

		// Check if automated action should be taken
		if (this.config.automation.autoOptimize && alert.severity === 'critical') {
			this.runEmergencyOptimization(alert);
		}

		// Log the alert
		if (this.config.integrations.logging) {
			this.logEvent('alert', alert);
		}

		this.emitEvent('alert-received', { alert });
	}

	// Handle bundle changes
	private handleBundleChange(change: any): void {
		console.log('📊 Bundle change detected:', change);

		// Check if change exceeds thresholds
		if (Math.abs(change.impact.sizeChange) > this.config.thresholds.growthRateThreshold * 1024) {
			this.handleLargeChange(change);
		}

		this.emitEvent('change-detected', { change });
	}

	// Handle large bundle changes
	private handleLargeChange(change: any): void {
		console.warn('⚠️ Large bundle change detected:', change);

		// Run analysis to understand the impact
		this.runAnalysis().then(() => {
			// Check if optimization is needed
			const currentStatus = sizeBudgetManager.getMonitoringStatus();
			if (currentStatus.lastCheck) {
				const timeSinceLastCheck = Date.now() - currentStatus.lastCheck.getTime();
				if (timeSinceLastCheck > 5 * 60 * 1000) {
					// 5 minutes
					this.runOptimizationIfNeeded();
				}
			}
		});
	}

	// Run emergency optimization
	private async runEmergencyOptimization(alert: any): Promise<void> {
		console.log('🚨 Running emergency optimization due to:', alert);

		try {
			const result = await this.executeSafeOptimizations();

			if (result.success) {
				console.log('✅ Emergency optimization completed successfully');
				this.emitEvent('emergency-optimization-completed', { alert, result });
			} else {
				console.error('❌ Emergency optimization failed:', result);
				this.emitEvent('emergency-optimization-failed', { alert, result });
			}
		} catch (error) {
			console.error('Emergency optimization error:', error);
		}
	}

	// Start scheduled optimizations
	private startScheduledOptimizations(): void {
		if (!this.config.schedule.enabled) {
			return;
		}

		const frequencyMs = this.getFrequencyInMilliseconds();

		this.scheduleInterval = setInterval(async () => {
			if (this.isInTimeWindow() && this.config.autoMode) {
				await this.runScheduledOptimization();
			}
		}, frequencyMs);

		// Update next run time
		this.updateNextRunTime();
	}

	// Get frequency in milliseconds
	private getFrequencyInMilliseconds(): number {
		switch (this.config.schedule.frequency) {
			case 'realtime':
				return 5 * 60 * 1000; // 5 minutes
			case 'hourly':
				return 60 * 60 * 1000; // 1 hour
			case 'daily':
				return 24 * 60 * 60 * 1000; // 24 hours
			case 'weekly':
				return 7 * 24 * 60 * 60 * 1000; // 7 days
			default:
				return 60 * 60 * 1000; // Default to hourly
		}
	}

	// Check if current time is within scheduled window
	private isInTimeWindow(): boolean {
		if (!this.config.schedule.timeWindow) {
			return true;
		}

		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes();
		const [startHour, startMin] = this.config.schedule.timeWindow.start.split(':').map(Number);
		const [endHour, endMin] = this.config.schedule.timeWindow.end.split(':').map(Number);
		const startTime = startHour * 60 + startMin;
		const endTime = endHour * 60 + endMin;

		return currentTime >= startTime && currentTime <= endTime;
	}

	// Update next run time
	private updateNextRunTime(): void {
		const frequencyMs = this.getFrequencyInMilliseconds();
		this.config.schedule.nextRun = new Date(Date.now() + frequencyMs);
	}

	// Run scheduled optimization
	private async runScheduledOptimization(): Promise<void> {
		console.log('⏰ Running scheduled optimization');

		try {
			const report = await this.generateOptimizationReport();

			if (report.recommendations.length > 0) {
				await this.executeRecommendations(report.recommendations);
			}

			this.config.schedule.lastRun = new Date();
			this.updateNextRunTime();
		} catch (error) {
			console.error('Scheduled optimization failed:', error);
		}
	}

	// Run comprehensive analysis
	public async runAnalysis(): Promise<BundleAnalysis> {
		this.emitEvent('analysis-started', { timestamp: new Date() });

		try {
			const analysis = await bundleAnalyzer.analyzeBundle();

			// Update metrics
			this.status.metrics.lastAnalysis = new Date();
			this.status.metrics.complianceScore = analysis.compliance.complianceScore;
			this.status.metrics.performanceScore =
				analysis.performance.loadTime > 0 ? Math.max(0, 100 - analysis.performance.loadTime / 100) : 100;

			// Update health
			this.updateHealthStatus(analysis);

			this.emitEvent('analysis-completed', { analysis, timestamp: new Date() });

			return analysis;
		} catch (error) {
			console.error('Analysis failed:', error);
			throw error;
		}
	}

	// Generate optimization report
	public async generateOptimizationReport(): Promise<OptimizationReport> {
		const analysis = await this.runAnalysis();
		const budgetStatus = await sizeBudgetManager.checkBudgetStatus();
		const monitoringState = realtimeBundleMonitor.getState();

		// Generate recommendations
		const recommendations = this.generateSystemRecommendations(analysis, budgetStatus, monitoringState);

		// Create actions
		const actions = this.createActions(recommendations);

		const report: OptimizationReport = {
			id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			analysis,
			status: budgetStatus,
			monitoring: monitoringState,
			recommendations,
			actions,
			results: [],
			summary: this.calculateSummary(recommendations),
		};

		this.reports.push(report);

		// Keep only last 50 reports
		if (this.reports.length > 50) {
			this.reports = this.reports.slice(-50);
		}

		return report;
	}

	// Generate system recommendations
	private generateSystemRecommendations(
		analysis: BundleAnalysis,
		budgetStatus: BudgetStatus,
		monitoringState: RealtimeBundleState,
	): SystemRecommendation[] {
		const recommendations: SystemRecommendation[] = [];

		// SC-14 compliance recommendations
		if (analysis.compliance.complianceStatus !== 'compliant') {
			recommendations.push({
				id: 'sc14-compliance',
				type: 'optimization',
				priority: 'critical',
				title: 'Achieve SC-14 500KB Compliance',
				description: `Bundle exceeds 500KB limit by ${Math.round(analysis.compliance.overageAmount / 1024)}KB`,
				impact: {
					sizeSavings: analysis.compliance.overageAmount,
					performanceGain: Math.round(analysis.compliance.overageAmount / 100),
					complianceImprovement: 100 - analysis.compliance.complianceScore,
				},
				implementation: 'Execute comprehensive bundle optimization plan',
				automatable: true,
				dependencies: ['Bundle optimization engine'],
				risks: ['Potential breaking changes', 'Increased build time'],
				estimatedEffort: 8,
			});
		}

		// Performance recommendations
		if (analysis.performance.loadTime > this.config.thresholds.performanceThreshold) {
			recommendations.push({
				id: 'performance-optimization',
				type: 'optimization',
				priority: 'high',
				title: 'Improve Bundle Load Performance',
				description: `Bundle load time is ${analysis.performance.loadTime}ms (threshold: ${this.config.thresholds.performanceThreshold}ms)`,
				impact: {
					sizeSavings: Math.round(analysis.totalSize * 0.2),
					performanceGain: Math.round(analysis.performance.loadTime * 0.3),
					complianceImprovement: 10,
				},
				implementation: 'Implement code splitting, compression, and caching',
				automatable: true,
				dependencies: ['Build configuration', 'Server configuration'],
				risks: ['Increased complexity'],
				estimatedEffort: 6,
			});
		}

		// Growth rate recommendations
		if (monitoringState.trends.rate > this.config.thresholds.growthRateThreshold) {
			recommendations.push({
				id: 'growth-control',
				type: 'process',
				priority: 'medium',
				title: 'Implement Growth Control Measures',
				description: `Bundle growing at ${monitoringState.trends.rate.toFixed(1)}KB/min (threshold: ${this.config.thresholds.growthRateThreshold}KB/min)`,
				impact: {
					sizeSavings: 0,
					performanceGain: 0,
					complianceImprovement: 20,
				},
				implementation: 'Establish size gates and approval processes',
				automatable: false,
				dependencies: ['Development process changes'],
				risks: ['Development friction'],
				estimatedEffort: 16,
			});
		}

		// Add optimization opportunities from monitoring
		monitoringState.optimizations.forEach((opp) => {
			if (opp.confidence > this.config.thresholds.riskThreshold) {
				recommendations.push({
					id: opp.id,
					type: 'optimization',
					priority: opp.impact.effort === 'low' ? 'high' : 'medium',
					title: opp.title,
					description: opp.description,
					impact: {
						sizeSavings: opp.impact.sizeSavings,
						performanceGain: opp.impact.performanceGain,
						complianceImprovement: Math.round((opp.impact.sizeSavings / (500 * 1024)) * 100),
					},
					implementation: opp.implementation,
					automatable: opp.automatable,
					dependencies: [],
					risks: [],
					estimatedEffort: opp.impact.effort === 'low' ? 2 : opp.impact.effort === 'medium' ? 6 : 16,
				});
			}
		});

		// Sort by priority and impact
		return recommendations.sort((a, b) => {
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			const aPriority = priorityOrder[a.priority];
			const bPriority = priorityOrder[b.priority];

			if (aPriority !== bPriority) {
				return bPriority - aPriority;
			}

			return b.impact.sizeSavings - a.impact.sizeSavings;
		});
	}

	// Create actions from recommendations
	private createActions(recommendations: SystemRecommendation[]): Action[] {
		return recommendations.map((rec) => ({
			id: `action_${rec.id}`,
			type: rec.type === 'process' ? 'configure' : 'optimize',
			description: rec.title,
			status: 'pending',
			automated: rec.automatable && this.config.automation.autoOptimize,
		}));
	}

	// Calculate report summary
	private calculateSummary(recommendations: SystemRecommendation[]): ReportSummary {
		const totalOptimizations = recommendations.filter((r) => r.type === 'optimization').length;
		const automatedActions = recommendations.filter((r) => r.automatable).length;
		const manualActions = recommendations.length - automatedActions;

		const totalSavings = recommendations.reduce((sum, r) => sum + r.impact.sizeSavings, 0);
		const averageSavings = totalOptimizations > 0 ? totalSavings / totalOptimizations : 0;

		return {
			totalOptimizations,
			successfulOptimizations: 0, // Will be updated after execution
			totalSavings,
			averageSavings,
			complianceScore: this.status.metrics.complianceScore,
			performanceScore: this.status.metrics.performanceScore,
			healthScore: this.status.health.score,
			recommendations: recommendations.length,
			automatedActions,
			manualActions,
		};
	}

	// Execute recommendations
	public async executeRecommendations(recommendations: SystemRecommendation[]): Promise<ActionResult[]> {
		const results: ActionResult[] = [];
		const analysisBefore = await bundleAnalyzer.analyzeBundle();

		// Filter recommendations based on automation settings
		const executableRecommendations = recommendations.filter((rec) => {
			if (!rec.automatable) return false;
			if (this.config.automation.manualApproval) return false;
			if (this.config.automation.safeMode && rec.priority === 'critical') return false;

			const riskLevel = rec.estimatedEffort > 12 ? 'high' : rec.estimatedEffort > 6 ? 'medium' : 'low';
			return this.isRiskLevelAllowed(riskLevel);
		});

		console.log(`Executing ${executableRecommendations.length} automated recommendations`);

		for (const recommendation of executableRecommendations) {
			try {
				const result = await this.executeRecommendation(recommendation, analysisBefore);
				results.push(result);
			} catch (error) {
				console.error(`Failed to execute recommendation ${recommendation.id}:`, error);
				results.push({
					action: recommendation.title,
					success: false,
					impact: {
						sizeBefore: analysisBefore.totalSize,
						sizeAfter: analysisBefore.totalSize,
						savings: 0,
						performanceBefore: analysisBefore.performance.loadTime,
						performanceAfter: analysisBefore.performance.loadTime,
						improvement: 0,
					},
					metadata: { error: error.toString() },
					timestamp: new Date(),
				});
			}
		}

		// Update metrics
		this.updateMetrics(results);

		return results;
	}

	// Execute individual recommendation
	private async executeRecommendation(
		recommendation: SystemRecommendation,
		analysisBefore: BundleAnalysis,
	): Promise<ActionResult> {
		console.log(`Executing recommendation: ${recommendation.title}`);

		// Execute optimization based on type
		const plans = await bundleOptimizationEngine.generateOptimizationPlan(analysisBefore);
		const relevantPlans = plans.filter(
			(plan) => plan.automatable && plan.estimatedSavings >= recommendation.impact.sizeSavings * 0.5,
		);

		if (relevantPlans.length === 0) {
			throw new Error('No suitable optimization plans found');
		}

		// Execute the best plan
		const bestPlan = relevantPlans[0];
		const result = await bundleOptimizationEngine.executeOptimizationPlan(bestPlan);

		return {
			action: recommendation.title,
			success: result.success,
			impact: {
				sizeBefore: analysisBefore.totalSize,
				sizeAfter: result.savings.after,
				savings: result.savings.savings,
				performanceBefore: analysisBefore.performance.loadTime,
				performanceAfter: result.performance.after,
				improvement: result.performance.improvement,
			},
			metadata: {
				plan: bestPlan.id,
				recommendation: recommendation.id,
				duration: result.execution.duration,
			},
			timestamp: new Date(),
		};
	}

	// Execute safe optimizations only
	private async executeSafeOptimizations(): Promise<any> {
		const analysis = await bundleAnalyzer.analyzeBundle();
		const plans = await bundleOptimizationEngine.generateOptimizationPlan(analysis);

		// Filter for safe, low-risk optimizations
		const safePlans = plans.filter(
			(plan) => plan.automatable && plan.risk.every((r) => r.severity !== 'high') && plan.effort === 'low',
		);

		if (safePlans.length === 0) {
			return { success: false, message: 'No safe optimizations available' };
		}

		// Execute the safest plan with highest impact
		const bestSafePlan = safePlans.sort((a, b) => b.estimatedSavings - a.estimatedSavings)[0];
		return await bundleOptimizationEngine.executeOptimizationPlan(bestSafePlan);
	}

	// Check if risk level is allowed
	private isRiskLevelAllowed(riskLevel: string): boolean {
		const allowedLevels = {
			low: ['low'],
			medium: ['low', 'medium'],
			high: ['low', 'medium', 'high'],
		};

		return allowedLevels[this.config.automation.maxRiskLevel].includes(riskLevel);
	}

	// Run optimization if needed
	public async runOptimizationIfNeeded(): Promise<boolean> {
		const analysis = await this.runAnalysis();

		// Check if optimization is needed based on thresholds
		const needsOptimization =
			analysis.compliance.complianceStatus !== 'compliant' ||
			analysis.performance.loadTime > this.config.thresholds.performanceThreshold ||
			analysis.compliance.budgetUtilization > this.config.thresholds.budgetThreshold;

		if (!needsOptimization) {
			return false;
		}

		if (!this.config.autoMode) {
			console.log('⚠️ Optimization needed but auto-mode is disabled');
			return false;
		}

		console.log('🔧 Running automated optimization');

		try {
			const result = await this.executeSafeOptimizations();
			return result.success;
		} catch (error) {
			console.error('Automated optimization failed:', error);
			return false;
		}
	}

	// Update health status
	private updateHealthStatus(analysis: BundleAnalysis): void {
		let score = 100;
		const issues: string[] = [];

		// SC-14 compliance health
		if (analysis.compliance.complianceStatus === 'critical') {
			score -= 40;
			issues.push('SC-14 compliance critical: Bundle exceeds 500KB limit');
		} else if (analysis.compliance.complianceStatus === 'warning') {
			score -= 20;
			issues.push('SC-14 compliance warning: Bundle approaching 500KB limit');
		}

		// Performance health
		if (analysis.performance.loadTime > 5000) {
			score -= 30;
			issues.push('Poor performance: Bundle load time exceeds 5 seconds');
		} else if (analysis.performance.loadTime > 3000) {
			score -= 15;
			issues.push('Moderate performance: Bundle load time exceeds 3 seconds');
		}

		// Optimization score health
		if (analysis.optimization.score < 50) {
			score -= 20;
			issues.push('Low optimization score: Significant optimization opportunities missed');
		}

		// Determine status
		let status: 'healthy' | 'warning' | 'critical';
		if (score >= 80) {
			status = 'healthy';
		} else if (score >= 60) {
			status = 'warning';
		} else {
			status = 'critical';
		}

		this.status.health = {
			score: Math.max(0, score),
			status,
			issues,
		};
	}

	// Update system metrics
	private updateMetrics(results: ActionResult[]): void {
		const successfulResults = results.filter((r) => r.success);
		const totalSavings = successfulResults.reduce((sum, r) => sum + r.impact.savings, 0);

		this.status.metrics.totalSavings += totalSavings;
		this.status.metrics.optimizationCount += results.length;
		this.status.metrics.successRate =
			results.length > 0 ? (successfulResults.length / results.length) * 100 : this.status.metrics.successRate;
		this.status.metrics.averageReduction =
			this.status.metrics.optimizationCount > 0
				? this.status.metrics.totalSavings / this.status.metrics.optimizationCount
				: this.status.metrics.averageReduction;

		this.status.optimization.lastResult = {
			plan: {} as OptimizationPlan,
			execution: {} as any,
			savings: {
				before: 0,
				after: 0,
				savings: totalSavings,
				percentage: 0,
			},
			performance: {
				before: 0,
				after: 0,
				improvement: 0,
			},
			issues: [],
			success: successfulResults.length === results.length,
			timestamp: new Date(),
		};
	}

	// Log event
	private logEvent(type: string, data: any): void {
		if (this.config.integrations.logging) {
			console.log(`[${type.toUpperCase()}]`, new Date().toISOString(), data);
		}
	}

	// Emit system event
	private emitEvent(type: string, data: any): void {
		const event: BundleOptimizationEvent = {
			type: type as BundleOptimizationEvent['type'],
			timestamp: new Date(),
			data,
			source: 'bundle-optimization-system',
		};

		const listeners = this.eventListeners.get(type);
		if (listeners) {
			listeners.forEach((listener) => {
				try {
					listener(event);
				} catch (error) {
					console.error('Error in system event listener:', error);
				}
			});
		}
	}

	// Public API methods

	// Update configuration
	public updateConfig(newConfig: Partial<BundleOptimizationSystem>): void {
		this.config = { ...this.config, ...newConfig };

		// Restart if needed
		if (this.isRunning) {
			this.stop();
			this.start().catch(console.error);
		}
	}

	// Get current configuration
	public getConfig(): BundleOptimizationSystem {
		return { ...this.config };
	}

	// Get system status
	public getStatus(): SystemStatus {
		return { ...this.status };
	}

	// Get optimization reports
	public getReports(limit?: number): OptimizationReport[] {
		return limit ? this.reports.slice(-limit) : [...this.reports];
	}

	// Add event listener
	public addEventListener(event: string, listener: (event: BundleOptimizationEvent) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(listener);
	}

	// Remove event listener
	public removeEventListener(event: string, listener: (event: BundleOptimizationEvent) => void): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	// Enable/disable auto mode
	public setAutoMode(enabled: boolean): void {
		this.config.autoMode = enabled;
		console.log(`Auto mode ${enabled ? 'enabled' : 'disabled'}`);
	}

	// Get SC-14 compliance status
	public async getSC14Status(): Promise<{
		compliant: boolean;
		currentSize: number;
		budgetLimit: number;
		utilization: number;
		score: number;
		issues: string[];
		optimizations: number;
	}> {
		const analysis = await bundleAnalyzer.analyzeBundle();

		return {
			compliant: analysis.compliance.complianceStatus === 'compliant',
			currentSize: analysis.totalSize,
			budgetLimit: 500 * 1024,
			utilization: analysis.compliance.budgetUtilization,
			score: analysis.compliance.complianceScore,
			issues: analysis.compliance.criticalIssues.map((issue) => issue.description),
			optimizations: analysis.optimization.recommendations.length,
		};
	}

	// Reset system
	public reset(): void {
		this.stop();
		this.status = this.getInitialStatus();
		this.reports = [];
		this.config = this.getDefaultConfig();
		console.log('🔄 Bundle optimization system reset');
	}
}

// Singleton instance
export const bundleOptimizationSystem = BundleOptimizationSystemIntegration.getInstance();
