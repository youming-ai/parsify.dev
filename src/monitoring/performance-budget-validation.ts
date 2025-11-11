/**
 * Performance Budget Validation and Enforcement - T167 Implementation
 * Comprehensive performance budget management with validation, enforcement, and governance
 * Ensures performance standards are met through automated checks and controls
 */

import { performanceObserver } from './performance-observer';
import { performanceBenchmarkingFramework } from './performance-benchmarking-framework';
import { realtimePerformanceMonitor } from './realtime-performance-monitor';
import { historicalPerformanceAnalyzer } from './historical-performance-analyzer';
import { performanceOptimizationRecommendationEngine } from './performance-optimization-recommendation-engine';
import { monitoringSystemsIntegration } from './monitoring-systems-integration';

import type { PerformanceMetrics } from './performance-observer';
import type { BenchmarkResult } from './performance-benchmarking-framework';
import type { RealtimeMetrics } from './realtime-performance-monitor';
import type { OptimizationRecommendationExtended } from './performance-optimization-recommendation-engine';

// Performance Budget interfaces
export interface PerformanceBudgetConfig {
	// Budget definitions
	budgets: PerformanceBudget[];

	// Validation settings
	validation: ValidationConfig;

	// Enforcement settings
	enforcement: EnforcementConfig;

	// Governance settings
	governance: GovernanceConfig;

	// Integration settings
	notifications: NotificationConfig;
}

export interface PerformanceBudget {
	id: string;
	name: string;
	description: string;
	category: 'bundle_size' | 'load_time' | 'runtime' | 'user_experience' | 'resource';

	// Budget limits
	limits: BudgetLimit[];

	// Scoping
	scope: BudgetScope;

	// Lifecycle
	status: 'active' | 'inactive' | 'deprecated';
	createdAt: Date;
	updatedAt: Date;

	// Ownership
	owner: string;
	stakeholders: string[];

	// Metadata
	tags: string[];
	priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface BudgetLimit {
	metric: string;
	limit: number;
	unit: string;

	// Thresholds
	warningThreshold: number; // % of limit
	criticalThreshold: number; // % of limit

	// Conditions
	conditions: BudgetCondition[];

	// Grace period
	gracePeriod: number; // seconds

	// Exemptions
	exemptions: BudgetExemption[];
}

export interface BudgetCondition {
	type: 'environment' | 'route' | 'user_segment' | 'device_type' | 'time_window';
	operator: 'eq' | 'ne' | 'in' | 'not_in';
	value: string | string[];
}

export interface BudgetExemption {
	id: string;
	reason: string;
	expiresAt?: Date;
	conditions: BudgetCondition[];
	approvedBy: string;
	createdAt: Date;
}

export interface BudgetScope {
	environments: string[];
	routes: string[];
	pageTypes: string[];
	userSegments: string[];
	deviceTypes: string[];
}

export interface ValidationConfig {
	// Validation frequency
	frequency: number; // seconds

	// Batch processing
	batchSize: number;

	// Retry settings
	maxRetries: number;
	retryDelay: number; // seconds

	// Validation depth
	validationDepth: 'basic' | 'comprehensive' | 'thorough';

	// Historical comparison
	historicalComparison: boolean;
	lookbackPeriod: number; // days
}

export interface EnforcementConfig {
	// Enforcement levels
	levels: EnforcementLevel[];

	// Default actions
	defaultActions: EnforcementAction[];

	// Escalation rules
	escalationRules: EscalationRule[];

	// Rollback settings
	rollback: RollbackConfig;
}

export interface EnforcementLevel {
	level: number;
	name: string;
	threshold: number; // % over budget
	actions: EnforcementAction[];
	enabled: boolean;
}

export interface EnforcementAction {
	type: 'warn' | 'block' | 'rollback' | 'notify' | 'escalate' | 'degrade';
	config: Record<string, any>;
	delay?: number; // seconds
	conditions?: BudgetCondition[];
}

export interface EscalationRule {
	id: string;
	name: string;
	conditions: BudgetCondition[];
	actions: EnforcementAction[];
	delay: number; // seconds
	enabled: boolean;
}

export interface RollbackConfig {
	enabled: boolean;
	triggers: RollbackTrigger[];
	timeout: number; // seconds
	confirmationRequired: boolean;
	safeMode: boolean;
}

export interface RollbackTrigger {
	type: 'budget_exceeded' | 'critical_alert' | 'user_complaint' | 'manual';
	threshold: number;
}

export interface GovernanceConfig {
	// Approval workflow
	approval: ApprovalConfig;

	// Audit trail
	audit: AuditConfig;

	// Compliance requirements
	compliance: ComplianceConfig;

	// Budget lifecycle
	lifecycle: LifecycleConfig;
}

export interface ApprovalConfig {
	enabled: boolean;
	approvers: string[];
	requiredApprovals: number;
	timeout: number; // hours
	escalationApprovers: string[];
}

export interface AuditConfig {
	enabled: boolean;
	retention: number; // days
	detailLevel: 'basic' | 'detailed' | 'comprehensive';
	includeContext: boolean;
}

export interface ComplianceConfig {
	standards: ComplianceStandard[];
	requirements: ComplianceRequirement[];
	reportingFrequency: number; // days
}

export interface ComplianceStandard {
	id: string;
	name: string;
	description: string;
	organization: string;
	version: string;
}

export interface ComplianceRequirement {
	id: string;
	standardId: string;
	requirement: string;
	budgetMapping: string[];
	mandatory: boolean;
}

export interface LifecycleConfig {
	creationApproval: boolean;
	modificationApproval: boolean;
	deprecationPolicy: DeprecationPolicy;
	reviewFrequency: number; // days
}

export interface DeprecationPolicy {
	warningPeriod: number; // days
	transitionPlan: string;
	notificationChannels: string[];
}

export interface NotificationConfig {
	// Channels
	channels: NotificationChannel[];

	// Routing rules
	routing: NotificationRouting[];

	// Suppression rules
	suppression: NotificationSuppression[];

	// Rate limiting
	rateLimiting: RateLimitingConfig;
}

export interface NotificationChannel {
	id: string;
	name: string;
	type: 'email' | 'slack' | 'teams' | 'pagerduty' | 'webhook';
	enabled: boolean;
	config: Record<string, any>;
}

export interface NotificationRouting {
	ruleId: string;
	name: string;
	conditions: BudgetCondition[];
	actions: NotificationAction[];
	enabled: boolean;
	priority: number;
}

export interface NotificationAction {
	channelId: string;
	message: string;
	template?: string;
	context?: Record<string, any>;
}

export interface NotificationSuppression {
	id: string;
	name: string;
	conditions: BudgetCondition[];
	duration: number; // seconds
	reason: string;
	enabled: boolean;
}

export interface RateLimitingConfig {
	enabled: boolean;
	maxNotificationsPerHour: number;
	maxNotificationsPerBudget: number;
	criticalBypass: boolean;
}

// Validation results
export interface BudgetValidationResult {
	budgetId: string;
	budgetName: string;
	timestamp: Date;

	// Overall result
	status: 'passed' | 'warning' | 'failed' | 'exempted';
	score: number; // 0-100

	// Limit results
	limitResults: LimitValidationResult[];

	// Context
	context: ValidationContext;

	// Actions taken
	actions: ValidationAction[];

	// Recommendations
	recommendations: string[];
}

export interface LimitValidationResult {
	metric: string;
	currentValue: number;
	limit: number;
	percentageUsed: number;
	status: 'passed' | 'warning' | 'failed' | 'exempted';

	// Violation details
	violation: BudgetViolation | null;

	// Historical context
	historicalTrend: HistoricalTrend;

	// Exemptions
	activeExemptions: BudgetExemption[];
}

export interface BudgetViolation {
	metric: string;
	severity: 'warning' | 'critical';
	amount: number;
	percentage: number;
	duration?: number;
	firstDetected: Date;
	lastDetected: Date;
}

export interface HistoricalTrend {
	current: number;
	previous: number;
	average: number;
	min: number;
	max: number;
	trend: 'improving' | 'stable' | 'degrading';
	period: number; // days
}

export interface ValidationContext {
	environment: string;
	route: string;
	userSegment: string;
	deviceType: string;
	timeWindow: string;

	// Build information
	buildNumber: string;
	commitHash: string;
	deployedAt: Date;

	// Load conditions
	concurrentUsers: number;
	serverLoad: number;
	networkConditions: string;
}

export interface ValidationAction {
	type: string;
	description: string;
	executedAt: Date;
	success: boolean;
	details?: any;
}

export class PerformanceBudgetValidator {
	private static instance: PerformanceBudgetValidator;
	private config: PerformanceBudgetConfig;
	private budgets: Map<string, PerformanceBudget> = new Map();
	private validationHistory: BudgetValidationResult[] = [];
	private activeViolations: Map<string, BudgetViolation> = new Map();
	private validationInterval: NodeJS.Timeout | null = null;
	private subscribers: Set<(result: BudgetValidationResult) => void> = new Set();

	private constructor() {
		this.config = this.getDefaultConfig();
		this.initializeBudgets();
		this.startValidation();
	}

	public static getInstance(): PerformanceBudgetValidator {
		if (!PerformanceBudgetValidator.instance) {
			PerformanceBudgetValidator.instance = new PerformanceBudgetValidator();
		}
		return PerformanceBudgetValidator.instance;
	}

	// Get default configuration
	private getDefaultConfig(): PerformanceBudgetConfig {
		return {
			budgets: [
				{
					id: 'core-web-vitals',
					name: 'Core Web Vitals Budget',
					description: 'Budget for Core Web Vitals metrics to ensure good user experience',
					category: 'load_time',
					limits: [
						{
							metric: 'largestContentfulPaint',
							limit: 2500,
							unit: 'ms',
							warningThreshold: 80,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
						{
							metric: 'firstInputDelay',
							limit: 100,
							unit: 'ms',
							warningThreshold: 80,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
						{
							metric: 'cumulativeLayoutShift',
							limit: 0.1,
							unit: 'score',
							warningThreshold: 80,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
					],
					scope: {
						environments: ['production', 'staging'],
						routes: ['*'],
						pageTypes: ['*'],
						userSegments: ['*'],
						deviceTypes: ['*'],
					},
					status: 'active',
					createdAt: new Date(),
					updatedAt: new Date(),
					owner: 'performance-team',
					stakeholders: ['frontend-team', 'backend-team', 'product-team'],
					tags: ['core', 'user-experience', 'critical'],
					priority: 'critical',
				},
				{
					id: 'bundle-size',
					name: 'JavaScript Bundle Size Budget',
					description: 'Budget for JavaScript bundle sizes to ensure fast loading',
					category: 'bundle_size',
					limits: [
						{
							metric: 'mainBundleSize',
							limit: 250000,
							unit: 'bytes',
							warningThreshold: 85,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 600,
							exemptions: [],
						},
						{
							metric: 'vendorBundleSize',
							limit: 150000,
							unit: 'bytes',
							warningThreshold: 85,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 600,
							exemptions: [],
						},
						{
							metric: 'totalBundleSize',
							limit: 500000,
							unit: 'bytes',
							warningThreshold: 85,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 600,
							exemptions: [],
						},
					],
					scope: {
						environments: ['production', 'staging'],
						routes: ['*'],
						pageTypes: ['*'],
						userSegments: ['*'],
						deviceTypes: ['*'],
					},
					status: 'active',
					createdAt: new Date(),
					updatedAt: new Date(),
					owner: 'frontend-team',
					stakeholders: ['performance-team', 'devops-team'],
					tags: ['bundle', 'frontend', 'critical'],
					priority: 'critical',
				},
				{
					id: 'task-performance',
					name: 'Task Performance Budget',
					description: 'Budget for task completion times and success rates',
					category: 'runtime',
					limits: [
						{
							metric: 'taskCompletionTime',
							limit: 5000,
							unit: 'ms',
							warningThreshold: 80,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
								{ type: 'user_segment', operator: 'ne', value: ['internal'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
						{
							metric: 'taskSuccessRate',
							limit: 0.95,
							unit: 'percentage',
							warningThreshold: 0.9,
							criticalThreshold: 0.8,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
						{
							metric: 'errorRate',
							limit: 0.05,
							unit: 'percentage',
							warningThreshold: 0.08,
							criticalThreshold: 0.15,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
					],
					scope: {
						environments: ['production', 'staging'],
						routes: ['*'],
						pageTypes: ['*'],
						userSegments: ['*'],
						deviceTypes: ['*'],
					},
					status: 'active',
					createdAt: new Date(),
					updatedAt: new Date(),
					owner: 'backend-team',
					stakeholders: ['performance-team', 'frontend-team'],
					tags: ['runtime', 'api', 'critical'],
					priority: 'high',
				},
				{
					id: 'resource-loading',
					name: 'Resource Loading Budget',
					description: 'Budget for resource loading performance',
					category: 'resource',
					limits: [
						{
							metric: 'totalResources',
							limit: 50,
							unit: 'count',
							warningThreshold: 0.9,
							criticalThreshold: 1.2,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
						{
							metric: 'resourceLoadTime',
							limit: 3000,
							unit: 'ms',
							warningThreshold: 80,
							criticalThreshold: 120,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 300,
							exemptions: [],
						},
						{
							metric: 'imageOptimizationScore',
							limit: 0.85,
							unit: 'score',
							warningThreshold: 0.7,
							criticalThreshold: 0.5,
							conditions: [
								{ type: 'environment', operator: 'in', value: ['production', 'staging'] },
							],
							gracePeriod: 600,
							exemptions: [],
						},
					],
					scope: {
						environments: ['production', 'staging'],
						routes: ['*'],
						pageTypes: ['*'],
						userSegments: ['*'],
						deviceTypes: ['*'],
					},
					status: 'active',
					createdAt: new Date(),
					updatedAt: new Date(),
					owner: 'frontend-team',
					stakeholders: ['performance-team', 'design-team'],
					tags: ['resources', 'optimization', 'medium'],
					priority: 'medium',
				},
			],
			validation: {
				frequency: 60,
				batchSize: 10,
				maxRetries: 3,
				retryDelay: 30,
				validationDepth: 'comprehensive',
				historicalComparison: true,
				lookbackPeriod: 7,
			},
			enforcement: {
				levels: [
					{
						level: 1,
						name: 'Warning',
						threshold: 100,
						actions: [
							{ type: 'warn', config: { message: 'Performance budget exceeded' } },
							{ type: 'notify', config: { channels: ['slack', 'email'] } },
						],
						enabled: true,
					},
					{
						level: 2,
						name: 'Critical',
						threshold: 120,
						actions: [
							{ type: 'warn', config: { message: 'Critical performance budget exceeded' } },
							{ type: 'notify', config: { channels: ['slack', 'email', 'pagerduty'] } },
							{ type: 'escalate', config: { level: 'performance_team' } },
						],
						enabled: true,
					},
					{
						level: 3,
						name: 'Emergency',
						threshold: 150,
						actions: [
							{ type: 'warn', config: { message: 'Emergency performance budget exceeded' } },
							{ type: 'block', config: { message: 'Deployment blocked due to budget violation' } },
							{ type: 'rollback', config: { reason: 'Performance budget emergency' } },
							{ type: 'notify', config: { channels: ['slack', 'email', 'pagerduty'] } },
						],
						enabled: true,
					},
				],
				defaultActions: [
					{ type: 'warn', config: { message: 'Performance budget exceeded' } },
					{ type: 'notify', config: { channels: ['slack'] } },
				],
				escalationRules: [
					{
						id: 'critical_escalation',
						name: 'Critical Budget Escalation',
						conditions: [
							{ type: 'environment', operator: 'eq', value: 'production' },
						],
						actions: [
							{ type: 'escalate', config: { level: 'performance_team' } },
							{ type: 'notify', config: { channels: ['pagerduty'] } },
						],
						delay: 300,
						enabled: true,
					},
				],
				rollback: {
					enabled: true,
					triggers: [
						{ type: 'budget_exceeded', threshold: 150 },
						{ type: 'critical_alert', threshold: 3 },
					],
					timeout: 1800,
					confirmationRequired: true,
					safeMode: true,
				},
			},
			governance: {
				approval: {
					enabled: true,
					approvers: ['performance-team', 'tech-lead'],
					requiredApprovals: 2,
					timeout: 24,
					escalationApprovers: ['engineering-manager'],
				},
				audit: {
					enabled: true,
					retention: 365,
					detailLevel: 'detailed',
					includeContext: true,
				},
				compliance: {
					standards: [
						{
							id: 'web-vitals',
							name: 'Core Web Vitals',
							description: 'Google Core Web Vitals standards',
							organization: 'Google',
							version: '2021',
						},
					],
					requirements: [
						{
							id: 'lcp_requirement',
							standardId: 'web-vitals',
							requirement: 'LCP should be less than 2.5 seconds',
							budgetMapping: ['core-web-vitals.largestContentfulPaint'],
							mandatory: true,
						},
					],
					reportingFrequency: 30,
				},
				lifecycle: {
					creationApproval: true,
					modificationApproval: true,
					deprecationPolicy: {
						warningPeriod: 30,
						transitionPlan: 'gradual deprecation with alternatives',
						notificationChannels: ['email', 'slack'],
					},
					reviewFrequency: 90,
				},
			},
			notifications: {
				channels: [
					{
						id: 'slack',
						name: 'Slack Notifications',
						type: 'slack',
						enabled: true,
						config: {
							webhookUrl: process.env.SLACK_WEBHOOK_URL,
							channel: '#performance-budgets',
						},
					},
					{
						id: 'email',
						name: 'Email Notifications',
						type: 'email',
						enabled: true,
						config: {
							recipients: ['performance-team@company.com'],
						},
					},
					{
						id: 'pagerduty',
						name: 'PagerDuty Alerts',
						type: 'pagerduty',
						enabled: true,
						config: {
							serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
						},
					},
				],
				routing: [
					{
						ruleId: 'critical_routing',
						name: 'Critical Budget Violations',
						conditions: [
							{ type: 'environment', operator: 'eq', value: 'production' },
						],
						actions: [
							{
								channelId: 'slack',
								message: 'Critical performance budget violation detected',
							},
							{
								channelId: 'pagerduty',
								message: 'Critical performance budget violation',
							},
						],
						enabled: true,
						priority: 1,
					},
				],
				suppression: [
					{
						id: 'maintenance_suppression',
						name: 'Maintenance Window Suppression',
						conditions: [
							{ type: 'time_window', operator: 'in', value: ['maintenance'] },
						],
						duration: 7200,
						reason: 'System maintenance in progress',
						enabled: true,
					},
				],
				rateLimiting: {
					enabled: true,
					maxNotificationsPerHour: 10,
					maxNotificationsPerBudget: 5,
					criticalBypass: true,
				},
			},
		};
	}

	// Initialize budgets
	private initializeBudgets(): void {
		this.config.budgets.forEach(budget => {
			this.budgets.set(budget.id, budget);
		});
	}

	// Start validation
	private startValidation(): void {
		this.validationInterval = setInterval(() => {
			this.validateAllBudgets().catch(console.error);
		}, this.config.validation.frequency * 1000);

		// Initial validation
		this.validateAllBudgets().catch(console.error);
	}

	// Validate all budgets
	public async validateAllBudgets(): Promise<BudgetValidationResult[]> {
		const results: BudgetValidationResult[] = [];

		// Get current performance data
		const currentMetrics = await this.getCurrentMetrics();
		const context = await this.getValidationContext();

		for (const budget of this.budgets.values()) {
			if (budget.status !== 'active') continue;

			try {
				const result = await this.validateBudget(budget, currentMetrics, context);
				results.push(result);
				this.validationHistory.push(result);

				// Notify subscribers
				this.subscribers.forEach(callback => callback(result));

				// Handle violations
				await this.handleViolations(result);

				// Send notifications
				await this.sendNotifications(result);

			} catch (error) {
				console.error(`Failed to validate budget ${budget.id}:`, error);
			}
		}

		// Limit history size
		if (this.validationHistory.length > 1000) {
			this.validationHistory = this.validationHistory.slice(-1000);
		}

		return results;
	}

	// Get current metrics
	private async getCurrentMetrics(): Promise<any> {
		const metrics = performanceObserver.getMetrics();
		const realtimeMetrics = realtimePerformanceMonitor.getCurrentMetrics();

		return {
			// Core Web Vitals
			largestContentfulPaint: metrics.largestContentfulPaint,
			firstInputDelay: metrics.firstInputDelay,
			cumulativeLayoutShift: metrics.cumulativeLayoutShift,
			firstContentfulPaint: metrics.firstContentfulPaint,

			// Bundle sizes
			mainBundleSize: metrics.bundleSize,
			vendorBundleSize: metrics.bundleSize * 0.6, // Estimate
			totalBundleSize: metrics.totalResourcesSize,

			// Task performance
			taskCompletionTime: metrics.taskCompletionTime,
			taskSuccessRate: metrics.taskSuccessRate,
			errorRate: metrics.errorRate,

			// Resource loading
			totalResources: performance.getEntriesByType('resource').length,
			resourceLoadTime: metrics.resourceLoadTimes.length > 0
				? metrics.resourceLoadTimes.reduce((sum, time) => sum + time, 0) / metrics.resourceLoadTimes.length
				: 0,
			imageOptimizationScore: 0.9, // Estimate - would be calculated from actual image analysis

			// Runtime metrics
			memoryUsage: realtimeMetrics?.runtime.memoryUsage || 0,
			cpuUsage: realtimeMetrics?.runtime.cpuUsage || 0,
		};
	}

	// Get validation context
	private async getValidationContext(): Promise<ValidationContext> {
		return {
			environment: process.env.NODE_ENV || 'development',
			route: window.location.pathname,
			userSegment: 'external', // Would be determined from user data
			deviceType: 'desktop', // Would be determined from user agent
			timeWindow: 'business_hours', // Would be determined from time

			buildNumber: process.env.BUILD_NUMBER || 'local',
			commitHash: process.env.COMMIT_HASH || 'unknown',
			deployedAt: new Date(),

			concurrentUsers: 100, // Estimate - would come from analytics
			serverLoad: 0.5, // Estimate - would come from monitoring
			networkConditions: 'good', // Estimate - would be determined from network metrics
		};
	}

	// Validate individual budget
	private async validateBudget(
		budget: PerformanceBudget,
		metrics: any,
		context: ValidationContext
	): Promise<BudgetValidationResult> {
		const limitResults: LimitValidationResult[] = [];
		let overallScore = 0;
		let passedCount = 0;

		for (const limit of budget.limits) {
			const result = await this.validateLimit(budget, limit, metrics, context);
			limitResults.push(result);

			if (result.status === 'passed') {
				passedCount++;
			}

			overallScore += result.status === 'passed' ? 100 :
							result.status === 'warning' ? 70 :
							result.status === 'exempted' ? 100 : 0;
		}

		const overallStatus = passedCount === budget.limits.length ? 'passed' :
							 passedCount > 0 ? 'warning' : 'failed';

		const finalScore = Math.round(overallScore / budget.limits.length);

		return {
			budgetId: budget.id,
			budgetName: budget.name,
			timestamp: new Date(),
			status: overallStatus,
			score: finalScore,
			limitResults,
			context,
			actions: [], // Would be populated during enforcement
			recommendations: this.generateRecommendations(budget, limitResults),
		};
	}

	// Validate individual limit
	private async validateLimit(
		budget: PerformanceBudget,
		limit: BudgetLimit,
		metrics: any,
		context: ValidationContext
	): Promise<LimitValidationResult> {
		const currentValue = metrics[limit.metric] || 0;
		const percentageUsed = (currentValue / limit.limit) * 100;

		// Check conditions
		const conditionsMet = this.evaluateConditions(limit.conditions, context);
		if (!conditionsMet) {
			return {
				metric: limit.metric,
				currentValue,
				limit: limit.limit,
				percentageUsed,
				status: 'exempted',
				violation: null,
				historicalTrend: await this.getHistoricalTrend(limit.metric),
				activeExemptions: this.getActiveExemptions(limit, context),
			};
		}

		// Check exemptions
		const activeExemptions = this.getActiveExemptions(limit, context);
		if (activeExemptions.length > 0) {
			return {
				metric: limit.metric,
				currentValue,
				limit: limit.limit,
				percentageUsed,
				status: 'exempted',
				violation: null,
				historicalTrend: await this.getHistoricalTrend(limit.metric),
				activeExemptions,
			};
		}

		// Determine status
		let status: 'passed' | 'warning' | 'failed' = 'passed';
		let violation: BudgetViolation | null = null;

		if (percentageUsed >= limit.criticalThreshold) {
			status = 'failed';
			violation = {
				metric: limit.metric,
				severity: 'critical',
				amount: currentValue - limit.limit,
				percentage: percentageUsed - 100,
				firstDetected: new Date(),
				lastDetected: new Date(),
			};
		} else if (percentageUsed >= limit.warningThreshold) {
			status = 'warning';
			violation = {
				metric: limit.metric,
				severity: 'warning',
				amount: currentValue - limit.limit,
				percentage: percentageUsed - 100,
				firstDetected: new Date(),
				lastDetected: new Date(),
			};
		}

		return {
			metric: limit.metric,
			currentValue,
			limit: limit.limit,
			percentageUsed,
			status,
			violation,
			historicalTrend: await this.getHistoricalTrend(limit.metric),
			activeExemptions,
		};
	}

	// Evaluate conditions
	private evaluateConditions(conditions: BudgetCondition[], context: ValidationContext): boolean {
		if (conditions.length === 0) return true;

		return conditions.every(condition => {
			const contextValue = (context as any)[this.getContextField(condition.type)];

			switch (condition.operator) {
				case 'eq': return contextValue === condition.value;
				case 'ne': return contextValue !== condition.value;
				case 'in': return Array.isArray(condition.value) && condition.value.includes(contextValue);
				case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(contextValue);
				default: return true;
			}
		});
	}

	// Get context field name
	private getContextField(conditionType: string): string {
		switch (conditionType) {
			case 'environment': return 'environment';
			case 'route': return 'route';
			case 'user_segment': return 'userSegment';
			case 'device_type': return 'deviceType';
			case 'time_window': return 'timeWindow';
			default: return conditionType;
		}
	}

	// Get active exemptions
	private getActiveExemptions(limit: BudgetLimit, context: ValidationContext): BudgetExemption[] {
		return limit.exemptions.filter(exemption => {
			// Check expiration
			if (exemption.expiresAt && exemption.expiresAt < new Date()) {
				return false;
			}

			// Check conditions
			return this.evaluateConditions(exemption.conditions, context);
		});
	}

	// Get historical trend
	private async getHistoricalTrend(metric: string): Promise<HistoricalTrend> {
		// This would fetch historical data from the historical analyzer
		// For now, return mock data
		const current = Math.random() * 100;
		const previous = Math.random() * 100;
		const average = (current + previous) / 2;
		const min = Math.min(current, previous) * 0.8;
		const max = Math.max(current, previous) * 1.2;

		const trend = current < previous ? 'improving' : current > previous * 1.1 ? 'degrading' : 'stable';

		return {
			current,
			previous,
			average,
			min,
			max,
			trend,
			period: 7,
		};
	}

	// Generate recommendations
	private generateRecommendations(budget: PerformanceBudget, limitResults: LimitValidationResult[]): string[] {
		const recommendations: string[] = [];

		for (const result of limitResults) {
			if (result.status === 'failed' || result.status === 'warning') {
				switch (result.metric) {
					case 'largestContentfulPaint':
						recommendations.push('Optimize image loading and compression');
						recommendations.push('Reduce server response time');
						recommendations.push('Eliminate render-blocking resources');
						break;
					case 'firstInputDelay':
						recommendations.push('Reduce JavaScript execution time');
						recommendations.push('Minimize main thread work');
						recommendations.push('Break up long tasks');
						break;
					case 'cumulativeLayoutShift':
						recommendations.push('Reserve space for dynamic content');
						recommendations.push('Avoid inserting content above existing content');
						recommendations.push('Ensure font loading is optimized');
						break;
					case 'mainBundleSize':
					case 'vendorBundleSize':
					case 'totalBundleSize':
						recommendations.push('Remove unused dependencies');
						recommendations.push('Implement code splitting');
						recommendations.push('Enable tree shaking');
						break;
					case 'taskCompletionTime':
						recommendations.push('Optimize algorithms and data processing');
						recommendations.push('Implement caching strategies');
						recommendations.push('Use web workers for heavy tasks');
						break;
					case 'taskSuccessRate':
					case 'errorRate':
						recommendations.push('Improve error handling and validation');
						recommendations.push('Implement retry mechanisms');
						recommendations.push('Add comprehensive logging');
						break;
				}
			}
		}

		return [...new Set(recommendations)]; // Remove duplicates
	}

	// Handle violations
	private async handleViolations(result: BudgetValidationResult): Promise<void> {
		for (const limitResult of result.limitResults) {
			if (limitResult.violation) {
				const violationKey = `${result.budgetId}_${limitResult.metric}`;

				// Check if this is a new or ongoing violation
				const existingViolation = this.activeViolations.get(violationKey);

				if (!existingViolation) {
					// New violation
					console.warn(`New budget violation detected: ${violationKey}`);
				}

				// Update violation
				const updatedViolation = {
					...limitResult.violation,
					firstDetected: existingViolation?.firstDetected || limitResult.violation.firstDetected,
					lastDetected: new Date(),
				};

				this.activeViolations.set(violationKey, updatedViolation);

				// Apply enforcement
				await this.applyEnforcement(result, limitResult);
			} else {
				// Check if violation was resolved
				const violationKey = `${result.budgetId}_${limitResult.metric}`;
				if (this.activeViolations.has(violationKey)) {
					console.info(`Budget violation resolved: ${violationKey}`);
					this.activeViolations.delete(violationKey);
				}
			}
		}
	}

	// Apply enforcement
	private async applyEnforcement(result: BudgetValidationResult, limitResult: LimitValidationResult): Promise<void> {
		if (!limitResult.violation) return;

		const percentageUsed = limitResult.percentageUsed;
		const budget = this.budgets.get(result.budgetId);
		if (!budget) return;

		// Find appropriate enforcement level
		const enforcementLevel = this.config.enforcement.levels.find(level =>
			level.enabled && percentageUsed >= level.threshold
		);

		if (!enforcementLevel) return;

		// Execute enforcement actions
		for (const action of enforcementLevel.actions) {
			await this.executeEnforcementAction(action, result, limitResult);
		}

		// Record action in result
		result.actions.push({
			type: enforcementLevel.name,
			description: `Enforcement level ${enforcementLevel.name} applied for ${percentageUsed.toFixed(1)}% budget usage`,
			executedAt: new Date(),
			success: true,
		});
	}

	// Execute enforcement action
	private async executeEnforcementAction(
		action: EnforcementAction,
		result: BudgetValidationResult,
		limitResult: LimitValidationResult
	): Promise<void> {
		switch (action.type) {
			case 'warn':
				console.warn(`Performance budget warning: ${result.budgetName} - ${limitResult.metric} is ${limitResult.percentageUsed.toFixed(1)}% of limit`);
				break;
			case 'notify':
				await this.sendEnforcementNotification(action, result, limitResult);
				break;
			case 'escalate':
				await this.escalateViolation(action, result, limitResult);
				break;
			case 'block':
				await this.blockDeployment(action, result, limitResult);
				break;
			case 'rollback':
				await this.rollbackDeployment(action, result, limitResult);
				break;
			default:
				console.warn(`Unknown enforcement action: ${action.type}`);
		}
	}

	// Send enforcement notification
	private async sendEnforcementNotification(
		action: EnforcementAction,
		result: BudgetValidationResult,
		limitResult: LimitValidationResult
	): Promise<void> {
		const channels = action.config.channels as string[];
		const message = `Performance budget violation: ${result.budgetName} - ${limitResult.metric} is ${limitResult.percentageUsed.toFixed(1)}% of limit (${limitResult.currentValue}/${limitResult.limit} ${limitResult.limitResults[0]?.unit || ''})`;

		// This would send notifications through the configured channels
		console.info(`Sending enforcement notification: ${message}`);
	}

	// Escalate violation
	private async escalateViolation(
		action: EnforcementAction,
		result: BudgetValidationResult,
		limitResult: LimitValidationResult
	): Promise<void> {
		const level = action.config.level as string;
		console.info(`Escalating violation to ${level}: ${result.budgetName} - ${limitResult.metric}`);
	}

	// Block deployment
	private async blockDeployment(
		action: EnforcementAction,
		result: BudgetValidationResult,
		limitResult: LimitValidationResult
	): Promise<void> {
		console.error(`Blocking deployment due to budget violation: ${result.budgetName} - ${limitResult.metric}`);
		// This would integrate with CI/CD systems to block deployment
	}

	// Rollback deployment
	private async rollbackDeployment(
		action: EnforcementAction,
		result: BudgetValidationResult,
		limitResult: LimitValidationResult
	): Promise<void> {
		const reason = action.config.reason as string;
		console.error(`Rolling back deployment: ${reason} - ${result.budgetName} - ${limitResult.metric}`);
		// This would integrate with deployment systems to trigger rollback
	}

	// Send notifications
	private async sendNotifications(result: BudgetValidationResult): Promise<void> {
		// Check suppression rules
		if (this.isNotificationSuppressed(result)) {
			return;
		}

		// Find matching routing rules
		const matchingRules = this.config.notifications.routing.filter(rule =>
			rule.enabled && this.evaluateNotificationConditions(rule, result)
		);

		// Sort by priority
		matchingRules.sort((a, b) => a.priority - b.priority);

		// Execute actions
		for (const rule of matchingRules) {
			for (const action of rule.actions) {
				await this.executeNotificationAction(action, result);
			}
		}
	}

	// Check if notification is suppressed
	private isNotificationSuppressed(result: BudgetValidationResult): boolean {
		return this.config.notifications.suppression.some(rule =>
			rule.enabled && this.evaluateNotificationSuppression(rule, result)
		);
	}

	// Evaluate notification conditions
	private evaluateNotificationConditions(rule: any, result: BudgetValidationResult): boolean {
		// This would evaluate the conditions based on the result
		return true; // Simplified
	}

	// Evaluate notification suppression
	private evaluateNotificationSuppression(rule: any, result: BudgetValidationResult): boolean {
		// This would evaluate the suppression conditions
		return false; // Simplified
	}

	// Execute notification action
	private async executeNotificationAction(action: NotificationAction, result: BudgetValidationResult): Promise<void> {
		const channel = this.config.notifications.channels.find(c => c.id === action.channelId);
		if (!channel || !channel.enabled) return;

		const message = this.formatNotificationMessage(action.message, action.template, result);

		switch (channel.type) {
			case 'slack':
				await this.sendSlackNotification(channel, message);
				break;
			case 'email':
				await this.sendEmailNotification(channel, message);
				break;
			case 'pagerduty':
				await this.sendPagerDutyNotification(channel, message);
				break;
		}
	}

	// Format notification message
	private formatNotificationMessage(template: string, messageTemplate: string, result: BudgetValidationResult): string {
		let message = messageTemplate || template;

		// Replace placeholders
		message = message.replace('{budgetName}', result.budgetName);
		message = message.replace('{score}', result.score.toString());
		message = message.replace('{status}', result.status);
		message = message.replace('{timestamp}', result.timestamp.toISOString());

		return message;
	}

	// Send Slack notification
	private async sendSlackNotification(channel: NotificationChannel, message: string): Promise<void> {
		const webhookUrl = channel.config.webhookUrl;
		if (!webhookUrl) return;

		const payload = {
			text: message,
			channel: channel.config.channel,
		};

		try {
			const response = await fetch(webhookUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				console.warn('Failed to send Slack notification:', response.statusText);
			}
		} catch (error) {
			console.error('Error sending Slack notification:', error);
		}
	}

	// Send email notification
	private async sendEmailNotification(channel: NotificationChannel, message: string): Promise<void> {
		console.info(`Would send email notification to ${channel.config.recipients}: ${message}`);
		// This would integrate with an email service
	}

	// Send PagerDuty notification
	private async sendPagerDutyNotification(channel: NotificationChannel, message: string): Promise<void> {
		console.info(`Would send PagerDuty notification: ${message}`);
		// This would integrate with PagerDuty API
	}

	// Public API methods

	// Subscribe to validation results
	public subscribe(callback: (result: BudgetValidationResult) => void): () => void {
		this.subscribers.add(callback);
		return () => this.subscribers.delete(callback);
	}

	// Get all budgets
	public getBudgets(): PerformanceBudget[] {
		return Array.from(this.budgets.values());
	}

	// Get budget by ID
	public getBudget(id: string): PerformanceBudget | undefined {
		return this.budgets.get(id);
	}

	// Add budget
	public addBudget(budget: PerformanceBudget): void {
		this.budgets.set(budget.id, budget);
		this.config.budgets.push(budget);
	}

	// Update budget
	public updateBudget(id: string, updates: Partial<PerformanceBudget>): void {
		const budget = this.budgets.get(id);
		if (budget) {
			const updatedBudget = { ...budget, ...updates, updatedAt: new Date() };
			this.budgets.set(id, updatedBudget);

			const index = this.config.budgets.findIndex(b => b.id === id);
			if (index !== -1) {
				this.config.budgets[index] = updatedBudget;
			}
		}
	}

	// Remove budget
	public removeBudget(id: string): void {
		this.budgets.delete(id);
		this.config.budgets = this.config.budgets.filter(b => b.id !== id);
	}

	// Get validation history
	public getValidationHistory(limit?: number): BudgetValidationResult[] {
		if (limit) {
			return this.validationHistory.slice(-limit);
		}
		return [...this.validationHistory];
	}

	// Get active violations
	public getActiveViolations(): Map<string, BudgetViolation> {
		return new Map(this.activeViolations);
	}

	// Get compliance report
	public async getComplianceReport(): Promise<ComplianceReport> {
		const budgets = Array.from(this.budgets.values());
		const complianceResults = [];

		for (const budget of budgets) {
			const latestResult = this.validationHistory
				.filter(r => r.budgetId === budget.id)
				.slice(-1)[0];

			if (latestResult) {
				complianceResults.push({
					budgetId: budget.id,
					budgetName: budget.name,
					compliant: latestResult.status === 'passed',
					score: latestResult.score,
					lastValidated: latestResult.timestamp,
					violations: latestResult.limitResults.filter(r => r.violation !== null),
				});
			}
		}

		const overallCompliance = complianceResults.filter(r => r.compliant).length / Math.max(1, complianceResults.length);
		const averageScore = complianceResults.reduce((sum, r) => sum + r.score, 0) / Math.max(1, complianceResults.length);

		return {
			generatedAt: new Date(),
			overallCompliance,
			averageScore,
			totalBudgets: budgets.length,
			compliantBudgets: complianceResults.filter(r => r.compliant).length,
			nonCompliantBudgets: complianceResults.filter(r => !r.compliant).length,
			results: complianceResults,
			standards: this.config.governance.compliance.standards,
		};
	}

	// Update configuration
	public updateConfig(updates: Partial<PerformanceBudgetConfig>): void {
		this.config = { ...this.config, ...updates };

		// Restart validation if frequency changed
		if (updates.validation?.frequency) {
			if (this.validationInterval) {
				clearInterval(this.validationInterval);
			}
			this.startValidation();
		}
	}

	// Export data
	public exportData(): string {
		const exportData = {
			timestamp: new Date().toISOString(),
			config: this.config,
			budgets: Array.from(this.budgets.values()),
			validationHistory: this.validationHistory.slice(-100), // Last 100 results
			activeViolations: Array.from(this.activeViolations.entries()),
		};

		return JSON.stringify(exportData, null, 2);
	}

	// Cleanup
	public cleanup(): void {
		if (this.validationInterval) {
			clearInterval(this.validationInterval);
			this.validationInterval = null;
		}

		this.budgets.clear();
		this.validationHistory = [];
		this.activeViolations.clear();
		this.subscribers.clear();
	}
}

// Additional type definitions
interface ComplianceReport {
	generatedAt: Date;
	overallCompliance: number;
	averageScore: number;
	totalBudgets: number;
	compliantBudgets: number;
	nonCompliantBudgets: number;
	results: ComplianceResult[];
	standards: ComplianceStandard[];
}

interface ComplianceResult {
	budgetId: string;
	budgetName: string;
	compliant: boolean;
	score: number;
	lastValidated: Date;
	violations: LimitValidationResult[];
}

// Export singleton instance
export const performanceBudgetValidator = PerformanceBudgetValidator.getInstance();
