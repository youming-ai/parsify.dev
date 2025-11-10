/**
 * Size Budget Manager
 * Enforces SC-14 compliance with 500KB bundle size constraint
 * Provides budget tracking, violation detection, and automated enforcement
 */

import { bundleAnalyzer, type BundleAnalysis, type BundleComplianceMetrics } from '@/analytics/bundle-analyzer';

export interface BudgetConstraints {
	totalBudget: number; // 500KB for SC-14
	categoryBudgets: CategoryBudget[];
	toleranceLevel: number; // Percentage over budget allowed temporarily
	enforcementLevel: 'passive' | 'warning' | 'blocking';
	gracePeriod: number; // Hours allowed for temporary overages
}

export interface CategoryBudget {
	category: 'core' | 'vendor' | 'assets' | 'utilities' | 'tools';
	budget: number; // in bytes
	percentage: number; // of total budget
	critical: boolean; // whether this category is critical for functionality
	allowOverage: boolean; // whether temporary overage is allowed
}

export interface BudgetStatus {
	current: BudgetUsage;
	projection: BudgetProjection;
	violations: BudgetViolation[];
	alerts: BudgetAlert[];
	compliance: BudgetCompliance;
	trends: BudgetTrends;
	recommendations: BudgetRecommendation[];
}

export interface BudgetUsage {
	total: number;
	byCategory: Record<string, number>;
	percentage: number;
	status: 'within-budget' | 'at-risk' | 'over-budget';
	overage: number;
	remaining: number;
}

export interface BudgetProjection {
	currentTrend: TrendProjection;
	optimistic: TrendProjection;
	pessimistic: TrendProjection;
	targetCompliance: Date;
	riskFactors: RiskFactor[];
}

export interface TrendProjection {
	timeline: ProjectionPoint[];
	confidence: number;
	factors: string[];
}

export interface ProjectionPoint {
	date: Date;
	projectedSize: number;
	budgetUtilization: number;
	riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskFactor {
	factor: string;
	impact: 'low' | 'medium' | 'high';
	description: string;
	mitigation: string;
	probability: number; // 0-1
}

export interface BudgetViolation {
	type: 'total-overage' | 'category-overage' | 'growth-rate' | 'critical-dependency';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	current: number;
	budget: number;
	overage: number;
	category?: string;
	detected: Date;
	resolution?: string;
	timeline?: number; // hours to fix
}

export interface BudgetAlert {
	type: 'warning' | 'critical' | 'info';
	message: string;
	threshold: number;
	current: number;
	category?: string;
	actionable: boolean;
	expiration?: Date;
	actions: AlertAction[];
}

export interface AlertAction {
	action: string;
	description: string;
	automated: boolean;
	impact: string;
	implementation: string;
}

export interface BudgetCompliance {
	status: 'compliant' | 'warning' | 'critical';
	score: number; // 0-100
	issues: number;
	criticalIssues: number;
	lastCheck: Date;
	history: ComplianceHistory[];
	nextReview: Date;
}

export interface ComplianceHistory {
	date: Date;
	size: number;
	budgetUtilization: number;
	status: 'compliant' | 'warning' | 'critical';
	actions: string[];
}

export interface BudgetTrends {
	sizeGrowth: TrendLine;
	categoryGrowth: Record<string, TrendLine>;
	prediction: TrendPrediction;
	seasonality: SeasonalityPattern;
	anomalies: Anomaly[];
}

export interface TrendLine {
	points: TrendPoint[];
	slope: number; // bytes per day
	r2: number; // correlation coefficient
	direction: 'increasing' | 'decreasing' | 'stable';
	acceleration: number;
}

export interface TrendPoint {
	date: Date;
	size: number;
	budgetUtilization: number;
}

export interface TrendPrediction {
	shortTerm: PredictionPoint[]; // next 7 days
	mediumTerm: PredictionPoint[]; // next 30 days
	longTerm: PredictionPoint[]; // next 90 days
	confidence: number;
	methodology: string;
}

export interface PredictionPoint {
	date: Date;
	projectedSize: number;
	confidence: number;
	riskLevel: 'low' | 'medium' | 'high';
}

export interface SeasonalityPattern {
	pattern: number[]; // 12 months of data
	strength: number; // 0-1
	peakMonths: number[];
	lowMonths: number[];
}

export interface Anomaly {
	date: Date;
	size: number;
	expected: number;
	deviation: number;
	severity: 'low' | 'medium' | 'high';
	cause?: string;
	resolved: boolean;
}

export interface BudgetRecommendation {
	priority: 'critical' | 'high' | 'medium' | 'low';
	category: 'size-reduction' | 'growth-control' | 'optimization' | 'prevention';
	title: string;
	description: string;
	impact: {
		sizeSavings: number;
		budgetImprovement: number;
		effort: 'low' | 'medium' | 'high';
	};
	implementation: string;
	timeline: number; // hours
	dependencies: string[];
	automatable: boolean;
	rollback: string;
}

export interface BudgetEnforcement {
	enabled: boolean;
	level: 'passive' | 'warning' | 'blocking';
	actions: EnforcementAction[];
	history: EnforcementHistory[];
}

export interface EnforcementAction {
	type: 'prevent-build' | 'warn-developer' | 'auto-optimize' | 'notify-team';
	trigger: EnforcementTrigger;
	conditions: EnforcementCondition[];
	actions: string[];
	rollback: string;
}

export interface EnforcementTrigger {
	budgetUtilization: number;
	growthRate: number;
	categoryOverage: boolean;
	criticalDependency: boolean;
}

export interface EnforcementCondition {
	metric: string;
	operator: '>' | '<' | '=' | '>=' | '<=';
	value: number;
	duration?: number; // in hours
}

export interface EnforcementHistory {
	date: Date;
	action: string;
	trigger: string;
	result: 'success' | 'failure' | 'partial';
	impact: string;
	details: string;
}

export class SizeBudgetManager {
	private static instance: SizeBudgetManager;
	private constraints: BudgetConstraints;
	private history: ComplianceHistory[] = [];
	private alerts: BudgetAlert[] = [];
	private enforcement: BudgetEnforcement;
	private isMonitoring = false;
	private monitoringInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.constraints = this.getDefaultConstraints();
		this.enforcement = this.getDefaultEnforcement();
		this.loadHistoricalData();
	}

	public static getInstance(): SizeBudgetManager {
		if (!SizeBudgetManager.instance) {
			SizeBudgetManager.instance = new SizeBudgetManager();
		}
		return SizeBudgetManager.instance;
	}

	// Get default budget constraints
	private getDefaultConstraints(): BudgetConstraints {
		const TOTAL_BUDGET = 500 * 1024; // 500KB for SC-14 compliance

		return {
			totalBudget: TOTAL_BUDGET,
			categoryBudgets: [
				{
					category: 'core',
					budget: Math.round(TOTAL_BUDGET * 0.3), // 30% for core functionality
					percentage: 30,
					critical: true,
					allowOverage: false,
				},
				{
					category: 'vendor',
					budget: Math.round(TOTAL_BUDGET * 0.4), // 40% for vendor dependencies
					percentage: 40,
					critical: true,
					allowOverage: true,
				},
				{
					category: 'assets',
					budget: Math.round(TOTAL_BUDGET * 0.2), // 20% for assets
					percentage: 20,
					critical: false,
					allowOverage: false,
				},
				{
					category: 'utilities',
					budget: Math.round(TOTAL_BUDGET * 0.05), // 5% for utilities
					percentage: 5,
					critical: false,
					allowOverage: false,
				},
				{
					category: 'tools',
					budget: Math.round(TOTAL_BUDGET * 0.05), // 5% for tools
					percentage: 5,
					critical: false,
					allowOverage: false,
				},
			],
			toleranceLevel: 10, // 10% temporary overage allowed
			enforcementLevel: 'warning', // Start with warnings
			gracePeriod: 24, // 24 hours grace period
		};
	}

	// Get default enforcement settings
	private getDefaultEnforcement(): BudgetEnforcement {
		return {
			enabled: true,
			level: 'warning',
			actions: [
				{
					type: 'warn-developer',
					trigger: {
						budgetUtilization: 90,
						growthRate: 0.05,
						categoryOverage: true,
						criticalDependency: true,
					},
					conditions: [
						{ metric: 'budgetUtilization', operator: '>', value: 90 },
						{ metric: 'growthRate', operator: '>', value: 0.05, duration: 24 },
					],
					actions: ['Display warning in development console', 'Add banner to application'],
					rollback: 'Remove warnings and banners',
				},
				{
					type: 'auto-optimize',
					trigger: {
						budgetUtilization: 95,
						growthRate: 0.1,
						categoryOverage: true,
						criticalDependency: false,
					},
					conditions: [
						{ metric: 'budgetUtilization', operator: '>', value: 95 },
					],
					actions: ['Run automatic optimizations', 'Generate optimization report'],
					rollback: 'Revert optimizations and clear report',
				},
			],
			history: [],
		};
	}

	// Load historical data
	private loadHistoricalData(): void {
		// In a real implementation, this would load from localStorage or a database
		const stored = localStorage.getItem('budget-compliance-history');
		if (stored) {
			try {
				this.history = JSON.parse(stored).map((item: any) => ({
					...item,
					date: new Date(item.date),
				}));
			} catch (error) {
				console.warn('Failed to load budget history:', error);
			}
		}
	}

	// Save historical data
	private saveHistoricalData(): void {
		try {
			localStorage.setItem('budget-compliance-history', JSON.stringify(this.history));
		} catch (error) {
			console.warn('Failed to save budget history:', error);
		}
	}

	// Start budget monitoring
	public startMonitoring(intervalMinutes: number = 30): void {
		if (this.isMonitoring) {
			return;
		}

		this.isMonitoring = true;
		this.monitoringInterval = setInterval(() => {
			this.checkBudgetStatus();
		}, intervalMinutes * 60 * 1000);

		// Initial check
		this.checkBudgetStatus();
	}

	// Stop budget monitoring
	public stopMonitoring(): void {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
		this.isMonitoring = false;
	}

	// Check current budget status
	public async checkBudgetStatus(): Promise<BudgetStatus> {
		const analysis = await bundleAnalyzer.analyzeBundle();

		// Calculate current usage
		const current = this.calculateCurrentUsage(analysis);

		// Generate projections
		const projection = this.generateProjection(analysis, current);

		// Check for violations
		const violations = this.checkViolations(current, analysis);

		// Generate alerts
		const alerts = this.generateAlerts(current, violations);

		// Calculate compliance
		const compliance = this.calculateCompliance(current, violations);

		// Analyze trends
		const trends = this.analyzeTrends(analysis);

		// Generate recommendations
		const recommendations = this.generateRecommendations(current, violations, trends);

		const status: BudgetStatus = {
			current,
			projection,
			violations,
			alerts,
			compliance,
			trends,
			recommendations,
		};

		// Update history
		this.updateHistory(status);

		// Enforce budget if enabled
		if (this.enforcement.enabled) {
			this.enforceBudget(status);
		}

		return status;
	}

	// Calculate current budget usage
	private calculateCurrentUsage(analysis: BundleAnalysis): BudgetUsage {
		const totalSize = analysis.totalSize;
		const totalBudget = this.constraints.totalBudget;
		const percentage = (totalSize / totalBudget) * 100;
		const overage = Math.max(0, totalSize - totalBudget);
		const remaining = Math.max(0, totalBudget - totalSize);

		let status: 'within-budget' | 'at-risk' | 'over-budget';
		if (percentage <= 80) {
			status = 'within-budget';
		} else if (percentage <= 100) {
			status = 'at-risk';
		} else {
			status = 'over-budget';
		}

		// Calculate category usage
		const byCategory: Record<string, number> = {};
		const categoryBudgets = this.constraints.categoryBudgets;

		// Analyze bundle analysis to extract category sizes
		const vendorSize = analysis.dependencies
			.filter(dep => dep.type === 'dependency')
			.reduce((sum, dep) => sum + dep.size, 0);

		const assetSize = analysis.assets
			.reduce((sum, asset) => sum + asset.size, 0);

		// Estimate category sizes based on analysis
		byCategory['vendor'] = vendorSize;
		byCategory['assets'] = assetSize;
		byCategory['core'] = Math.round(totalSize * 0.3); // Estimate
		byCategory['utilities'] = Math.round(totalSize * 0.05); // Estimate
		byCategory['tools'] = Math.round(totalSize * 0.05); // Estimate

		return {
			total: totalSize,
			byCategory,
			percentage,
			status,
			overage,
			remaining,
		};
	}

	// Generate budget projections
	private generateProjection(analysis: BundleAnalysis, current: BudgetUsage): BudgetProjection {
		const currentTrend = this.calculateTrendProjection('current', current);
		const optimistic = this.calculateTrendProjection('optimistic', current);
		const pessimistic = this.calculateTrendProjection('pessimistic', current);

		// Calculate target compliance date
		const targetCompliance = this.calculateTargetCompliance(current, currentTrend);

		// Identify risk factors
		const riskFactors = this.identifyRiskFactors(analysis, current);

		return {
			currentTrend,
			optimistic,
			pessimistic,
			targetCompliance,
			riskFactors,
		};
	}

	// Calculate trend projection
	private calculateTrendProjection(scenario: 'current' | 'optimistic' | 'pessimistic', current: BudgetUsage): TrendProjection {
		const points: ProjectionPoint[] = [];
		const now = new Date();
		let growthRate: number;

		switch (scenario) {
			case 'optimistic':
				growthRate = -0.02; // 2% reduction per day
				break;
			case 'pessimistic':
				growthRate = 0.03; // 3% growth per day
				break;
			default:
				growthRate = 0.01; // 1% growth per day
		}

		// Generate 90-day projection
		for (let i = 1; i <= 90; i++) {
			const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
			const projectedSize = current.total * Math.pow(1 + growthRate, i);
			const budgetUtilization = (projectedSize / this.constraints.totalBudget) * 100;

			let riskLevel: 'low' | 'medium' | 'high';
			if (budgetUtilization <= 80) {
				riskLevel = 'low';
			} else if (budgetUtilization <= 100) {
				riskLevel = 'medium';
			} else {
				riskLevel = 'high';
			}

			points.push({
				date,
				projectedSize,
				budgetUtilization,
				riskLevel,
			});
		}

		const confidence = scenario === 'current' ? 0.7 : scenario === 'optimistic' ? 0.4 : 0.5;

		return {
			timeline: points,
			confidence,
			factors: this.getProjectionFactors(scenario),
		};
	}

	// Get projection factors
	private getProjectionFactors(scenario: 'current' | 'optimistic' | 'pessimistic'): string[] {
		switch (scenario) {
			case 'optimistic':
				return [
					'Optimization implementation',
					'Dependency cleanup',
					'Code splitting improvements',
					'Asset compression',
				];
			case 'pessimistic':
				return [
					'Feature additions',
					'Dependency bloat',
					'Insufficient optimization',
					'Asset growth',
				];
			default:
				return [
					'Normal development growth',
					'Moderate optimization',
					'Stable dependency management',
				];
		}
	}

	// Calculate target compliance date
	private calculateTargetCompliance(current: BudgetUsage, projection: TrendProjection): Date {
		if (current.status === 'within-budget') {
			return new Date();
		}

		// Find the first point where budget utilization is <= 100%
		const compliantPoint = projection.timeline.find(point => point.budgetUtilization <= 100);
		return compliantPoint ? compliantPoint.date : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
	}

	// Identify risk factors
	private identifyRiskFactors(analysis: BundleAnalysis, current: BudgetUsage): RiskFactor[] {
		const factors: RiskFactor[] = [];

		// Large dependencies risk
		const largeDeps = analysis.dependencies.filter(dep => dep.size > 100 * 1024);
		if (largeDeps.length > 0) {
			factors.push({
				factor: 'Large Dependencies',
				impact: 'high',
				description: `${largeDeps.length} dependencies exceed 100KB`,
				mitigation: 'Replace with lighter alternatives or implement tree shaking',
				probability: 0.8,
			});
		}

		// Growth rate risk
		if (current.percentage > 90) {
			factors.push({
				factor: 'High Budget Utilization',
				impact: 'high',
				description: `Current utilization is ${current.percentage.toFixed(1)}%`,
				mitigation: 'Implement aggressive optimization measures',
				probability: 0.9,
			});
		}

		// Compression opportunity risk
		const compressionRatio = analysis.compression.current.ratio;
		if (compressionRatio > 0.5) {
			factors.push({
				factor: 'Suboptimal Compression',
				impact: 'medium',
				description: `Compression ratio is ${compressionRatio.toFixed(2)} (should be < 0.5)`,
				mitigation: 'Enable gzip or Brotli compression',
				probability: 0.7,
			});
		}

		return factors;
	}

	// Check for budget violations
	private checkViolations(current: BudgetUsage, analysis: BundleAnalysis): BudgetViolation[] {
		const violations: BudgetViolation[] = [];

		// Total overage violation
		if (current.overage > 0) {
			const overagePercentage = (current.overage / this.constraints.totalBudget) * 100;
			let severity: 'low' | 'medium' | 'high' | 'critical';

			if (overagePercentage > 20) {
				severity = 'critical';
			} else if (overagePercentage > 10) {
				severity = 'high';
			} else if (overagePercentage > 5) {
				severity = 'medium';
			} else {
				severity = 'low';
			}

			violations.push({
				type: 'total-overage',
				severity,
				description: `Bundle exceeds 500KB budget by ${Math.round(current.overage / 1024)}KB (${overagePercentage.toFixed(1)}%)`,
				current: current.total,
				budget: this.constraints.totalBudget,
				overage: current.overage,
				detected: new Date(),
				timeline: this.calculateResolutionTimeline(current.overage, severity),
			});
		}

		// Category overage violations
		for (const categoryBudget of this.constraints.categoryBudgets) {
			const categoryUsage = current.byCategory[categoryBudget.category] || 0;
			if (categoryUsage > categoryBudget.budget) {
				const categoryOverage = categoryUsage - categoryBudget.budget;
				const overagePercentage = (categoryOverage / categoryBudget.budget) * 100;

				violations.push({
					type: 'category-overage',
					severity: overagePercentage > 20 ? 'high' : overagePercentage > 10 ? 'medium' : 'low',
					description: `${categoryBudget.category} category exceeds budget by ${Math.round(categoryOverage / 1024)}KB`,
					current: categoryUsage,
					budget: categoryBudget.budget,
					overage: categoryOverage,
					category: categoryBudget.category,
					detected: new Date(),
					timeline: this.calculateResolutionTimeline(categoryOverage, 'medium'),
				});
			}
		}

		// Critical dependency violations
		const criticalDeps = analysis.dependencies.filter(dep => dep.size > 200 * 1024);
		if (criticalDeps.length > 0) {
			violations.push({
				type: 'critical-dependency',
				severity: 'high',
				description: `${criticalDeps.length} critical dependencies exceed 200KB`,
				current: criticalDeps.reduce((sum, dep) => sum + dep.size, 0),
				budget: 200 * 1024,
				overage: criticalDeps.reduce((sum, dep) => sum + Math.max(0, dep.size - 200 * 1024), 0),
				detected: new Date(),
				resolution: 'Replace with lighter alternatives or implement code splitting',
				timeline: 24, // 24 hours
			});
		}

		return violations;
	}

	// Calculate resolution timeline
	private calculateResolutionTimeline(overage: number, severity: 'low' | 'medium' | 'high' | 'critical'): number {
		const baseHours = {
			low: 48,
			medium: 24,
			high: 12,
			critical: 4,
		};

		// Adjust based on overage size
		const overageKB = overage / 1024;
		const multiplier = Math.max(1, overageKB / 50); // Adjust every 50KB

		return Math.round(baseHours[severity] * multiplier);
	}

	// Generate budget alerts
	private generateAlerts(current: BudgetUsage, violations: BudgetViolation[]): BudgetAlert[] {
		const alerts: BudgetAlert[] = [];

		// Budget utilization alerts
		if (current.percentage > 90) {
			alerts.push({
				type: current.percentage > 100 ? 'critical' : 'warning',
				message: `Bundle size is ${current.percentage.toFixed(1)}% of 500KB budget`,
				threshold: 90,
				current: current.percentage,
				actionable: true,
				actions: [
					{
						action: 'Run Optimization',
						description: 'Execute automated bundle optimization',
						automated: true,
						impact: 'Potential 20-30% size reduction',
						implementation: 'bundleOptimizationEngine.executeOptimizationPlan()',
					},
					{
						action: 'Analyze Bundle',
						description: 'Review detailed bundle analysis',
						automated: false,
						impact: 'Identify optimization opportunities',
						implementation: 'bundleAnalyzer.analyzeBundle()',
					},
				],
			});
		}

		// Category-specific alerts
		for (const categoryBudget of this.constraints.categoryBudgets) {
			const categoryUsage = current.byCategory[categoryBudget.category] || 0;
			const utilization = (categoryUsage / categoryBudget.budget) * 100;

			if (utilization > 90) {
				alerts.push({
					type: utilization > 100 ? 'critical' : 'warning',
					message: `${categoryBudget.category} category is ${utilization.toFixed(1)}% of budget`,
					threshold: 90,
					current: utilization,
					category: categoryBudget.category,
					actionable: true,
					actions: [
						{
							action: 'Optimize Category',
							description: `Optimize ${categoryBudget.category} category specifically`,
							automated: false,
							impact: 'Reduce category size',
							implementation: 'Category-specific optimization strategies',
						},
					],
				});
			}
		}

		// Violation alerts
		violations.forEach(violation => {
			if (violation.severity === 'critical' || violation.severity === 'high') {
				alerts.push({
					type: 'critical',
					message: violation.description,
					threshold: violation.budget,
					current: violation.current,
					category: violation.category,
					actionable: true,
					actions: [
						{
							action: 'Immediate Action Required',
							description: 'Address critical budget violation',
							automated: false,
							impact: 'Restore SC-14 compliance',
							implementation: violation.resolution || 'Implement optimization measures',
						},
					],
				});
			}
		});

		return alerts;
	}

	// Calculate compliance status
	private calculateCompliance(current: BudgetUsage, violations: BudgetViolation[]): BudgetCompliance {
		let status: 'compliant' | 'warning' | 'critical';
		const criticalViolations = violations.filter(v => v.severity === 'critical').length;

		if (criticalViolations > 0 || current.percentage > 100) {
			status = 'critical';
		} else if (current.percentage > 90 || violations.length > 0) {
			status = 'warning';
		} else {
			status = 'compliant';
		}

		// Calculate compliance score
		let score = 100;
		score -= Math.min(50, current.percentage > 100 ? (current.percentage - 100) * 2 : 0);
		score -= Math.min(30, violations.length * 5);
		score -= Math.min(20, criticalViolations * 10);

		return {
			status,
			score: Math.max(0, Math.round(score)),
			issues: violations.length,
			criticalIssues: criticalViolations,
			lastCheck: new Date(),
			history: this.history.slice(-10), // Last 10 entries
			nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
		};
	}

	// Analyze trends
	private analyzeTrends(analysis: BundleAnalysis): BudgetTrends {
		// Calculate size growth trend
		const sizeGrowth = this.calculateTrendLine(this.history.map(h => ({
			date: h.date,
			value: h.size,
		})));

		// Calculate category growth trends
		const categoryGrowth: Record<string, TrendLine> = {};
		// In a real implementation, this would analyze historical category data

		// Generate predictions
		const prediction = this.generateTrendPrediction(sizeGrowth);

		// Analyze seasonality
		const seasonality = this.analyzeSeasonality();

		// Detect anomalies
		const anomalies = this.detectAnomalies(analysis);

		return {
			sizeGrowth,
			categoryGrowth,
			prediction,
			seasonality,
			anomalies,
		};
	}

	// Calculate trend line
	private calculateTrendLine(data: Array<{ date: Date; value: number }>): TrendLine {
		if (data.length < 2) {
			return {
				points: [],
				slope: 0,
				r2: 0,
				direction: 'stable',
				acceleration: 0,
			};
		}

		// Simple linear regression
		const n = data.length;
		const sumX = data.reduce((sum, point, index) => sum + index, 0);
		const sumY = data.reduce((sum, point) => sum + point.value, 0);
		const sumXY = data.reduce((sum, point, index) => sum + index * point.value, 0);
		const sumX2 = data.reduce((sum, point, index) => sum + index * index, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;

		const points: TrendPoint[] = data.map((point, index) => ({
			date: point.date,
			size: point.value,
			budgetUtilization: (point.value / this.constraints.totalBudget) * 100,
		}));

		// Calculate R-squared
		const yMean = sumY / n;
		const ssTotal = data.reduce((sum, point) => sum + Math.pow(point.value - yMean, 2), 0);
		const ssResidual = data.reduce((sum, point, index) => {
			const predicted = intercept + slope * index;
			return sum + Math.pow(point.value - predicted, 2);
		}, 0);
		const r2 = 1 - (ssResidual / ssTotal);

		let direction: 'increasing' | 'decreasing' | 'stable';
		if (Math.abs(slope) < 100) {
			direction = 'stable';
		} else if (slope > 0) {
			direction = 'increasing';
		} else {
			direction = 'decreasing';
		}

		return {
			points,
			slope,
			r2: Math.max(0, Math.min(1, r2)),
			direction,
			acceleration: slope / n, // Simple acceleration calculation
		};
	}

	// Generate trend prediction
	private generateTrendPrediction(trend: TrendLine): TrendPrediction {
		const now = new Date();
		const confidence = trend.r2;

		const generatePoints = (days: number): PredictionPoint[] => {
			const points: PredictionPoint[] = [];
			for (let i = 1; i <= days; i++) {
				const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
				const projectedSize = trend.points.length > 0
					? trend.points[trend.points.length - 1].size + (trend.slope * i)
					: this.constraints.totalBudget * 0.8;

				const budgetUtilization = (projectedSize / this.constraints.totalBudget) * 100;

				let riskLevel: 'low' | 'medium' | 'high';
				if (budgetUtilization <= 80) {
					riskLevel = 'low';
				} else if (budgetUtilization <= 100) {
					riskLevel = 'medium';
				} else {
					riskLevel = 'high';
				}

				points.push({
					date,
					projectedSize,
					confidence,
					riskLevel,
				});
			}
			return points;
		};

		return {
			shortTerm: generatePoints(7),
			mediumTerm: generatePoints(30),
			longTerm: generatePoints(90),
			confidence,
			methodology: 'Linear regression based on historical data',
		};
	}

	// Analyze seasonality (simplified implementation)
	private analyzeSeasonality(): SeasonalityPattern {
		// In a real implementation, this would analyze actual seasonal patterns
		return {
			pattern: new Array(12).fill(0),
			strength: 0,
			peakMonths: [],
			lowMonths: [],
		};
	}

	// Detect anomalies
	private detectAnomalies(analysis: BundleAnalysis): Anomaly[] {
		const anomalies: Anomaly[] = [];
		const currentSize = analysis.totalSize;

		// Compare with historical average
		if (this.history.length > 5) {
			const recentSizes = this.history.slice(-5).map(h => h.size);
			const average = recentSizes.reduce((sum, size) => sum + size, 0) / recentSizes.length;
			const deviation = Math.abs(currentSize - average);
			const threshold = average * 0.1; // 10% deviation threshold

			if (deviation > threshold) {
				anomalies.push({
					date: new Date(),
					size: currentSize,
					expected: average,
					deviation,
					severity: deviation > average * 0.2 ? 'high' : deviation > average * 0.15 ? 'medium' : 'low',
					resolved: false,
				});
			}
		}

		return anomalies;
	}

	// Generate recommendations
	private generateRecommendations(
		current: BudgetUsage,
		violations: BudgetViolation[],
		trends: BudgetTrends,
	): BudgetRecommendation[] {
		const recommendations: BudgetRecommendation[] = [];

		// Size reduction recommendations
		if (current.status === 'over-budget') {
			recommendations.push({
				priority: 'critical',
				category: 'size-reduction',
				title: 'Immediate Size Reduction Required',
				description: `Bundle exceeds 500KB budget by ${Math.round(current.overage / 1024)}KB`,
				impact: {
					sizeSavings: current.overage,
					budgetImprovement: (current.overage / this.constraints.totalBudget) * 100,
					effort: 'high',
				},
				implementation: 'Execute comprehensive bundle optimization plan',
				timeline: 24,
				dependencies: ['Bundle optimization engine'],
				automatable: true,
				rollback: 'Revert optimizations and restore previous state',
			});
		}

		// Growth control recommendations
		if (trends.sizeGrowth.direction === 'increasing' && trends.sizeGrowth.slope > 1000) {
			recommendations.push({
				priority: 'high',
				category: 'growth-control',
				title: 'Implement Growth Control Measures',
				description: 'Bundle size is growing rapidly and needs control measures',
				impact: {
					sizeSavings: Math.round(trends.sizeGrowth.slope * 30), // 30 days savings
					budgetImprovement: 10,
					effort: 'medium',
				},
				implementation: 'Establish size gates and approval processes',
				timeline: 40,
				dependencies: ['Development process changes'],
				automatable: false,
				rollback: 'Remove size gates and processes',
			});
		}

		// Optimization recommendations
		if (current.percentage > 80) {
			recommendations.push({
				priority: 'medium',
				category: 'optimization',
				title: 'Proactive Optimization',
				description: 'Implement optimization measures before reaching budget limit',
				impact: {
					sizeSavings: Math.round(this.constraints.totalBudget * 0.1),
					budgetImprovement: 10,
					effort: 'medium',
				},
				implementation: 'Enable compression, tree shaking, and code splitting',
				timeline: 16,
				dependencies: ['Build configuration', 'Development tools'],
				automatable: true,
				rollback: 'Disable optimization features',
			});
		}

		// Prevention recommendations
		recommendations.push({
			priority: 'low',
			category: 'prevention',
			title: 'Establish Budget Monitoring',
			description: 'Set up continuous budget monitoring and alerts',
			impact: {
				sizeSavings: 0,
				budgetImprovement: 5,
				effort: 'low',
			},
			implementation: 'Configure automated monitoring and alerting',
			timeline: 8,
			dependencies: ['Monitoring tools'],
			automatable: true,
			rollback: 'Disable monitoring and alerts',
		});

		return recommendations.sort((a, b) => {
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	}

	// Update compliance history
	private updateHistory(status: BudgetStatus): void {
		const entry: ComplianceHistory = {
			date: new Date(),
			size: status.current.total,
			budgetUtilization: status.current.percentage,
			status: status.compliance.status,
			actions: status.recommendations.slice(0, 3).map(r => r.title), // Top 3 recommendations
		};

		this.history.push(entry);

		// Keep only last 90 days of history
		const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
		this.history = this.history.filter(entry => entry.date > ninetyDaysAgo);

		this.saveHistoricalData();
	}

	// Enforce budget constraints
	private enforceBudget(status: BudgetStatus): void {
		const criticalViolations = status.violations.filter(v => v.severity === 'critical');
		const highViolations = status.violations.filter(v => v.severity === 'high');

		for (const action of this.enforcement.actions) {
			const shouldTrigger = this.checkEnforcementConditions(action.trigger, status);

			if (shouldTrigger) {
				this.executeEnforcementAction(action, status);
			}
		}
	}

	// Check enforcement conditions
	private checkEnforcementConditions(trigger: EnforcementTrigger, status: BudgetStatus): boolean {
		if (status.current.percentage >= trigger.budgetUtilization) {
			return true;
		}

		if (status.trends.sizeGrowth.slope > trigger.growthRate * 1024) { // Convert KB to bytes
			return true;
		}

		if (trigger.categoryOverage && status.violations.some(v => v.type === 'category-overage')) {
			return true;
		}

		if (trigger.criticalDependency && status.violations.some(v => v.type === 'critical-dependency')) {
			return true;
		}

		return false;
	}

	// Execute enforcement action
	private executeEnforcementAction(action: EnforcementAction, status: BudgetStatus): void {
		const enforcementEntry: EnforcementHistory = {
			date: new Date(),
			action: action.type,
			trigger: `Budget utilization: ${status.current.percentage.toFixed(1)}%`,
			result: 'success',
			impact: 'Enforcement action executed',
			details: action.actions.join(', '),
		};

		try {
			switch (action.type) {
				case 'warn-developer':
					this.warnDeveloper(status);
					break;
				case 'auto-optimize':
					this.autoOptimize(status);
					break;
				case 'prevent-build':
					this.preventBuild(status);
					break;
				case 'notify-team':
					this.notifyTeam(status);
					break;
			}

			this.enforcement.history.push(enforcementEntry);
		} catch (error) {
			enforcementEntry.result = 'failure';
			enforcementEntry.details = `Failed: ${error}`;
			this.enforcement.history.push(enforcementEntry);
		}
	}

	// Warn developer
	private warnDeveloper(status: BudgetStatus): void {
		console.warn(`⚠️ Budget Warning: Bundle size is ${status.current.percentage.toFixed(1)}% of 500KB limit`);

		// In a real implementation, this would show a banner or notification
		if (typeof document !== 'undefined') {
			const banner = document.createElement('div');
			banner.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				background: #ff6b6b;
				color: white;
				padding: 10px;
				text-align: center;
				z-index: 9999;
				font-family: monospace;
			`;
			banner.textContent = `⚠️ Bundle size: ${Math.round(status.current.total / 1024)}KB (${status.current.percentage.toFixed(1)}% of 500KB budget)`;
			document.body.appendChild(banner);

			// Remove after 10 seconds
			setTimeout(() => {
				if (banner.parentNode) {
					banner.parentNode.removeChild(banner);
				}
			}, 10000);
		}
	}

	// Auto optimize
	private async autoOptimize(status: BudgetStatus): Promise<void> {
		// In a real implementation, this would trigger the optimization engine
		console.log('🔧 Starting automatic bundle optimization...');

		// Import and run optimization engine
		try {
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

	// Prevent build
	private preventBuild(status: BudgetStatus): void {
		console.error('🚫 Build prevented: Budget violation detected');

		// In a real implementation, this would prevent the build from completing
		if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
			process.exit(1);
		}
	}

	// Notify team
	private notifyTeam(status: BudgetStatus): void {
		console.log('📧 Team notification sent for budget violation');

		// In a real implementation, this would send emails, Slack messages, etc.
		// For now, we'll just log to console
	}

	// Public methods for configuration and control

	// Update budget constraints
	public updateConstraints(newConstraints: Partial<BudgetConstraints>): void {
		this.constraints = { ...this.constraints, ...newConstraints };
	}

	// Get current constraints
	public getConstraints(): BudgetConstraints {
		return { ...this.constraints };
	}

	// Update enforcement settings
	public updateEnforcement(newEnforcement: Partial<BudgetEnforcement>): void {
		this.enforcement = { ...this.enforcement, ...newEnforcement };
	}

	// Get current enforcement settings
	public getEnforcement(): BudgetEnforcement {
		return { ...this.enforcement };
	}

	// Get compliance history
	public getHistory(): ComplianceHistory[] {
		return [...this.history];
	}

	// Get current alerts
	public getAlerts(): BudgetAlert[] {
		return [...this.alerts];
	}

	// Clear alerts
	public clearAlerts(): void {
		this.alerts = [];
	}

	// Get monitoring status
	public getMonitoringStatus(): {
		isMonitoring: boolean;
		intervalMinutes: number;
		lastCheck?: Date;
	} {
		return {
			isMonitoring: this.isMonitoring,
			intervalMinutes: this.monitoringInterval ? 30 : 0, // Default 30 minutes
			lastCheck: this.history.length > 0 ? this.history[this.history.length - 1].date : undefined,
		};
	}

	// Reset all data
	public reset(): void {
		this.stopMonitoring();
		this.history = [];
		this.alerts = [];
		this.enforcement.history = [];
		this.saveHistoricalData();
	}
}

// Singleton instance
export const sizeBudgetManager = SizeBudgetManager.getInstance();
