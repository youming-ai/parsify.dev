/**
 * Task Completion Tracker - SC-011 Compliance Monitoring
 * Comprehensive system for monitoring task completion rates, success/failure patterns,
 * processing times, and user drop-off points to ensure 90% completion rate compliance
 */

import { performanceObserver } from './performance-observer';
import { userAnalytics } from './user-analytics';

export interface TaskDefinition {
	id: string;
	name: string;
	category: string;
	description: string;
	successCriteria: string[];
	failurePoints: string[];
	benchmarkTime: number; // Expected completion time in ms
	complexity: 'simple' | 'medium' | 'complex';
}

export interface TaskCompletionEvent {
	taskId: string;
	sessionId: string;
	userId?: string;
	timestamp: Date;
	status: 'started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
	duration?: number;
	inputSize?: number;
	outputSize?: number;
	errorType?: string;
	errorMessage?: string;
	stepsCompleted: number;
	totalSteps: number;
	dropOffPoint?: string;
	userSatisfaction?: number; // 1-5 rating
	toolCategory: string;
	toolName: string;
	processingTime: number;
	uiResponseTime: number;
	memoryUsage?: number;
	networkRequests?: number;
}

export interface TaskMetrics {
	// Real-time completion metrics
	completionRate: number; // Target: 90%
	successRate: number;
	failureRate: number;
	abandonmentRate: number;

	// Performance metrics
	averageCompletionTime: number;
	medianCompletionTime: number;
	p95CompletionTime: number; // 95th percentile
	processingTimeDistribution: {
		fast: number; // < benchmark
		normal: number; // within 2x benchmark
		slow: number; // > 2x benchmark
	};

	// Error analysis
	errorTypes: Record<string, number>;
	commonFailurePoints: Array<{
		point: string;
		count: number;
		percentage: number;
	}>;

	// User experience metrics
	userSatisfactionScore: number;
	retryRate: number;
	recoveryRate: number;

	// Tool-specific metrics
	toolPerformance: Record<
		string,
		{
			taskCount: number;
			completionRate: number;
			averageTime: number;
			errorRate: number;
			satisfactionScore: number;
		}
	>;

	// Compliance metrics
	sc011ComplianceScore: number; // 0-100
	completionRateTrend: Array<{
		timestamp: Date;
		rate: number;
		target: number;
	}>;

	// Timestamps
	lastUpdated: Date;
	timeWindow: string; // '1h', '24h', '7d', '30d'
}

export interface TaskAlert {
	id: string;
	type: 'completion_rate' | 'performance' | 'error_spike' | 'abandonment';
	severity: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	threshold: number;
	currentValue: number;
	affectedTools: string[];
	recommendations: string[];
	timestamp: Date;
	resolved: boolean;
}

export interface ComplianceReport {
	reportId: string;
	generatedAt: Date;
	timeWindow: string;
	overallComplianceScore: number;
	targetCompletionRate: number;
	actualCompletionRate: number;

	// Detailed metrics
	taskMetrics: TaskMetrics;
	toolBreakdown: Array<{
		toolName: string;
		completionRate: number;
		successRate: number;
		averageTime: number;
		userSatisfaction: number;
		complianceStatus: 'compliant' | 'warning' | 'non-compliant';
	}>;

	// Issues and recommendations
	issues: Array<{
		type: string;
		description: string;
		impact: 'low' | 'medium' | 'high';
		affectedTools: string[];
		recommendation: string;
	}>;

	// Improvement plan
	actionItems: Array<{
		priority: 'high' | 'medium' | 'low';
		action: string;
		owner: string;
		dueDate: Date;
		expectedImpact: string;
	}>;

	// Historical comparison
	previousPeriodComparison?: {
		completionRateChange: number;
		performanceChange: number;
		satisfactionChange: number;
	};
}

export class TaskCompletionTracker {
	private static instance: TaskCompletionTracker;
	private taskEvents: TaskCompletionEvent[] = [];
	private taskDefinitions: Map<string, TaskDefinition> = new Map();
	private activeTasks: Map<string, TaskCompletionEvent> = new Map();
	private alerts: TaskAlert[] = [];
	private metricsCache: Map<string, TaskMetrics> = new Map();
	private readonly COMPLETION_RATE_TARGET = 0.9; // 90% target
	private readonly ALERT_THRESHOLDS = {
		completionRate: 0.85, // Alert if below 85%
		failureRate: 0.15, // Alert if above 15%
		abandonmentRate: 0.1, // Alert if above 10%
		performanceSlowdown: 2.0, // Alert if 2x slower than benchmark
	};

	private constructor() {
		this.initializeTaskDefinitions();
		this.setupPeriodicAnalysis();
		this.loadPersistedData();
	}

	public static getInstance(): TaskCompletionTracker {
		if (!TaskCompletionTracker.instance) {
			TaskCompletionTracker.instance = new TaskCompletionTracker();
		}
		return TaskCompletionTracker.instance;
	}

	// Initialize predefined task definitions
	private initializeTaskDefinitions(): void {
		const defaultTasks: TaskDefinition[] = [
			// JSON Processing Tasks
			{
				id: 'json-format',
				name: 'JSON Formatter',
				category: 'json',
				description: 'Format and prettify JSON data',
				successCriteria: ['Valid JSON input', 'Successful formatting', 'Output displayed'],
				failurePoints: ['Invalid JSON syntax', 'Large file processing', 'Memory limits'],
				benchmarkTime: 500,
				complexity: 'simple',
			},
			{
				id: 'json-validate',
				name: 'JSON Validator',
				category: 'json',
				description: 'Validate JSON syntax and structure',
				successCriteria: ['JSON parsed successfully', 'Validation result shown'],
				failurePoints: ['Invalid JSON syntax', 'Schema validation errors'],
				benchmarkTime: 300,
				complexity: 'simple',
			},
			{
				id: 'json-convert',
				name: 'JSON Converter',
				category: 'json',
				description: 'Convert JSON to other formats',
				successCriteria: ['Input parsed', 'Format conversion completed', 'Download available'],
				failurePoints: ['Invalid input', 'Conversion errors', 'Large files'],
				benchmarkTime: 1000,
				complexity: 'medium',
			},

			// Code Processing Tasks
			{
				id: 'code-format',
				name: 'Code Formatter',
				category: 'code',
				description: 'Format and beautify code',
				successCriteria: ['Code parsed', 'Formatting applied', 'Formatted code displayed'],
				failurePoints: ['Syntax errors', 'Unsupported language', 'Large files'],
				benchmarkTime: 800,
				complexity: 'medium',
			},
			{
				id: 'code-minify',
				name: 'Code Minifier',
				category: 'code',
				description: 'Minify code for production',
				successCriteria: ['Code processed', 'Minification complete', 'Size reduction shown'],
				failurePoints: ['Syntax errors', 'Minification conflicts'],
				benchmarkTime: 600,
				complexity: 'simple',
			},
			{
				id: 'code-execute',
				name: 'Code Executor',
				category: 'code',
				description: 'Execute code in sandboxed environment',
				successCriteria: ['Code execution started', 'Output generated', 'Results displayed'],
				failurePoints: ['Runtime errors', 'Timeout', 'Security violations'],
				benchmarkTime: 5000,
				complexity: 'complex',
			},

			// File Processing Tasks
			{
				id: 'file-convert',
				name: 'File Converter',
				category: 'file',
				description: 'Convert between different file formats',
				successCriteria: ['File uploaded', 'Conversion completed', 'Download ready'],
				failurePoints: ['Unsupported format', 'Corrupted files', 'Size limits'],
				benchmarkTime: 2000,
				complexity: 'medium',
			},
			{
				id: 'image-compress',
				name: 'Image Compressor',
				category: 'file',
				description: 'Compress and optimize images',
				successCriteria: ['Image uploaded', 'Compression applied', 'Size reduction shown'],
				failurePoints: ['Unsupported format', 'Compression errors', 'Quality issues'],
				benchmarkTime: 3000,
				complexity: 'medium',
			},
			{
				id: 'ocr-process',
				name: 'OCR Processing',
				category: 'file',
				description: 'Extract text from images',
				successCriteria: ['Image uploaded', 'Text extracted', 'Results displayed'],
				failurePoints: ['Poor image quality', 'Unsupported languages', 'Processing errors'],
				benchmarkTime: 10000,
				complexity: 'complex',
			},

			// Network Tasks
			{
				id: 'http-request',
				name: 'HTTP Client',
				category: 'network',
				description: 'Make HTTP requests and test APIs',
				successCriteria: ['Request sent', 'Response received', 'Results displayed'],
				failurePoints: ['Network errors', 'Invalid URLs', 'Timeout'],
				benchmarkTime: 5000,
				complexity: 'medium',
			},
			{
				id: 'ip-lookup',
				name: 'IP Lookup',
				category: 'network',
				description: 'Lookup IP address information',
				successCriteria: ['IP submitted', 'Data retrieved', 'Results shown'],
				failurePoints: ['Invalid IP', 'API errors', 'Rate limits'],
				benchmarkTime: 2000,
				complexity: 'simple',
			},
		];

		defaultTasks.forEach((task) => {
			this.taskDefinitions.set(task.id, task);
		});
	}

	// Setup periodic analysis and alerting
	private setupPeriodicAnalysis(): void {
		// Analyze metrics every 5 minutes
		setInterval(
			() => {
				this.analyzeMetrics();
				this.checkAlerts();
				this.persistData();
			},
			5 * 60 * 1000,
		);

		// Generate compliance report every hour
		setInterval(
			() => {
				this.generateComplianceReport();
			},
			60 * 60 * 1000,
		);
	}

	// Register a new task definition
	public registerTaskDefinition(task: TaskDefinition): void {
		this.taskDefinitions.set(task.id, task);
	}

	// Start tracking a task
	public startTask(
		taskId: string,
		userId?: string,
		metadata?: {
			inputSize?: number;
			totalSteps?: number;
		},
	): string {
		const taskDef = this.taskDefinitions.get(taskId);
		if (!taskDef) {
			console.warn(`Task definition not found for ID: ${taskId}`);
			return '';
		}

		const eventId = this.generateEventId();
		const event: TaskCompletionEvent = {
			taskId,
			sessionId: this.getSessionId(),
			userId,
			timestamp: new Date(),
			status: 'started',
			stepsCompleted: 0,
			totalSteps: metadata?.totalSteps || 1,
			inputSize: metadata?.inputSize,
			toolCategory: taskDef.category,
			toolName: taskDef.name,
			processingTime: 0,
			uiResponseTime: 0,
		};

		this.activeTasks.set(eventId, event);
		this.taskEvents.push(event);

		// Integrate with existing monitoring systems
		const perfTaskId = performanceObserver.startTask(eventId, `${taskDef.category}: ${taskDef.name}`);
		userAnalytics.startToolUsage(taskId, taskDef.name);

		return eventId;
	}

	// Update task progress
	public updateTaskProgress(eventId: string, stepsCompleted: number, dropOffPoint?: string): void {
		const event = this.activeTasks.get(eventId);
		if (!event) return;

		event.stepsCompleted = stepsCompleted;
		event.status = 'in_progress';
		if (dropOffPoint) {
			event.dropOffPoint = dropOffPoint;
		}

		// Update timestamp
		event.timestamp = new Date();
	}

	// Complete a task successfully
	public completeTask(
		eventId: string,
		metadata?: {
			outputSize?: number;
			userSatisfaction?: number;
			processingTime?: number;
			uiResponseTime?: number;
			networkRequests?: number;
		},
	): void {
		const event = this.activeTasks.get(eventId);
		if (!event) return;

		const now = new Date();
		const duration = now.getTime() - event.timestamp.getTime();

		event.status = 'completed';
		event.duration = duration;
		event.outputSize = metadata?.outputSize;
		event.userSatisfaction = metadata?.userSatisfaction;
		event.processingTime = metadata?.processingTime || duration;
		event.uiResponseTime = metadata?.uiResponseTime || 0;
		event.networkRequests = metadata?.networkRequests || 0;

		// Move from active to completed
		this.activeTasks.delete(eventId);

		// Integrate with existing monitoring systems
		performanceObserver.completeTask(eventId, metadata?.outputSize);
		userAnalytics.completeToolUsage(
			event.taskId,
			true,
			[this.getTaskDefinition(event.taskId)?.category || 'unknown'],
			[],
		);

		// Update metrics cache
		this.invalidateMetricsCache();
	}

	// Fail a task
	public failTask(
		eventId: string,
		errorType: string,
		errorMessage: string,
		metadata?: {
			outputSize?: number;
			processingTime?: number;
		},
	): void {
		const event = this.activeTasks.get(eventId);
		if (!event) return;

		const now = new Date();
		const duration = now.getTime() - event.timestamp.getTime();

		event.status = 'failed';
		event.duration = duration;
		event.errorType = errorType;
		event.errorMessage = errorMessage;
		event.outputSize = metadata?.outputSize;
		event.processingTime = metadata?.processingTime || duration;

		// Move from active to failed
		this.activeTasks.delete(eventId);

		// Integrate with existing monitoring systems
		performanceObserver.failTask(eventId, errorMessage);
		userAnalytics.completeToolUsage(
			event.taskId,
			false,
			[this.getTaskDefinition(event.taskId)?.category || 'unknown'],
			[errorMessage],
		);

		// Update metrics cache
		this.invalidateMetricsCache();
	}

	// Abandon a task (user left without completion)
	public abandonTask(eventId: string, dropOffPoint?: string): void {
		const event = this.activeTasks.get(eventId);
		if (!event) return;

		const now = new Date();
		const duration = now.getTime() - event.timestamp.getTime();

		event.status = 'abandoned';
		event.duration = duration;
		if (dropOffPoint) {
			event.dropOffPoint = dropOffPoint;
		}

		// Move from active to abandoned
		this.activeTasks.delete(eventId);

		// Integrate with existing monitoring systems
		performanceObserver.failTask(eventId, 'Task abandoned by user');
		userAnalytics.completeToolUsage(
			event.taskId,
			false,
			[this.getTaskDefinition(event.taskId)?.category || 'unknown'],
			['Task abandoned'],
		);

		// Update metrics cache
		this.invalidateMetricsCache();
	}

	// Get comprehensive task metrics
	public getTaskMetrics(timeWindow: string = '24h'): TaskMetrics {
		const cacheKey = `metrics_${timeWindow}`;
		const cached = this.metricsCache.get(cacheKey);
		if (cached && Date.now() - cached.lastUpdated.getTime() < 5 * 60 * 1000) {
			return cached;
		}

		const now = new Date();
		const windowStart = this.getTimeWindowStart(now, timeWindow);
		const eventsInWindow = this.taskEvents.filter((event) => event.timestamp >= windowStart);

		const metrics = this.calculateMetrics(eventsInWindow, timeWindow);
		this.metricsCache.set(cacheKey, metrics);

		return metrics;
	}

	// Calculate metrics from events
	private calculateMetrics(events: TaskCompletionEvent[], timeWindow: string): TaskMetrics {
		const totalEvents = events.length;
		if (totalEvents === 0) {
			return this.getEmptyMetrics(timeWindow);
		}

		const completed = events.filter((e) => e.status === 'completed');
		const failed = events.filter((e) => e.status === 'failed');
		const abandoned = events.filter((e) => e.status === 'abandoned');

		// Basic rates
		const completionRate = completed.length / totalEvents;
		const successRate = completed.length / (completed.length + failed.length);
		const failureRate = failed.length / totalEvents;
		const abandonmentRate = abandoned.length / totalEvents;

		// Performance metrics
		const completionTimes = completed.map((e) => e.duration || 0).filter((t) => t > 0);
		const averageCompletionTime =
			completionTimes.length > 0 ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;

		const sortedTimes = completionTimes.sort((a, b) => a - b);
		const medianCompletionTime = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;

		const p95CompletionTime = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0;

		// Processing time distribution
		const processingTimeDistribution = this.calculateProcessingTimeDistribution(events);

		// Error analysis
		const errorTypes = this.calculateErrorTypes(failed);
		const commonFailurePoints = this.calculateCommonFailurePoints(events);

		// User experience metrics
		const userSatisfactionScore = this.calculateSatisfactionScore(completed);
		const retryRate = this.calculateRetryRate(events);
		const recoveryRate = this.calculateRecoveryRate(events);

		// Tool-specific performance
		const toolPerformance = this.calculateToolPerformance(events);

		// Compliance metrics
		const sc011ComplianceScore = this.calculateComplianceScore(completionRate, successRate, userSatisfactionScore);
		const completionRateTrend = this.calculateCompletionRateTrend(timeWindow);

		return {
			completionRate,
			successRate,
			failureRate,
			abandonmentRate,
			averageCompletionTime,
			medianCompletionTime,
			p95CompletionTime,
			processingTimeDistribution,
			errorTypes,
			commonFailurePoints,
			userSatisfactionScore,
			retryRate,
			recoveryRate,
			toolPerformance,
			sc011ComplianceScore,
			completionRateTrend,
			lastUpdated: new Date(),
			timeWindow,
		};
	}

	// Get empty metrics structure
	private getEmptyMetrics(timeWindow: string): TaskMetrics {
		return {
			completionRate: 0,
			successRate: 0,
			failureRate: 0,
			abandonmentRate: 0,
			averageCompletionTime: 0,
			medianCompletionTime: 0,
			p95CompletionTime: 0,
			processingTimeDistribution: { fast: 0, normal: 0, slow: 0 },
			errorTypes: {},
			commonFailurePoints: [],
			userSatisfactionScore: 0,
			retryRate: 0,
			recoveryRate: 0,
			toolPerformance: {},
			sc011ComplianceScore: 0,
			completionRateTrend: [],
			lastUpdated: new Date(),
			timeWindow,
		};
	}

	// Calculate processing time distribution
	private calculateProcessingTimeDistribution(events: TaskCompletionEvent[]): {
		fast: number;
		normal: number;
		slow: number;
	} {
		const completed = events.filter((e) => e.status === 'completed' && e.duration);
		if (completed.length === 0) return { fast: 0, normal: 0, slow: 0 };

		let fast = 0,
			normal = 0,
			slow = 0;

		completed.forEach((event) => {
			const taskDef = this.getTaskDefinition(event.taskId);
			const benchmark = taskDef?.benchmarkTime || 1000;
			const ratio = (event.duration || 0) / benchmark;

			if (ratio <= 1.0) fast++;
			else if (ratio <= 2.0) normal++;
			else slow++;
		});

		const total = completed.length;
		return {
			fast: fast / total,
			normal: normal / total,
			slow: slow / total,
		};
	}

	// Calculate error types distribution
	private calculateErrorTypes(failed: TaskCompletionEvent[]): Record<string, number> {
		const errorTypes: Record<string, number> = {};

		failed.forEach((event) => {
			const errorType = event.errorType || 'Unknown';
			errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
		});

		return errorTypes;
	}

	// Calculate common failure points
	private calculateCommonFailurePoints(events: TaskCompletionEvent[]): Array<{
		point: string;
		count: number;
		percentage: number;
	}> {
		const failurePoints: Record<string, number> = {};
		const totalEvents = events.length;

		events.forEach((event) => {
			if (event.dropOffPoint) {
				failurePoints[event.dropOffPoint] = (failurePoints[event.dropOffPoint] || 0) + 1;
			}
		});

		return Object.entries(failurePoints)
			.map(([point, count]) => ({
				point,
				count,
				percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10); // Top 10 failure points
	}

	// Calculate user satisfaction score
	private calculateSatisfactionScore(completed: TaskCompletionEvent[]): number {
		const withRating = completed.filter((e) => e.userSatisfaction !== undefined);
		if (withRating.length === 0) return 0;

		const totalScore = withRating.reduce((sum, event) => sum + (event.userSatisfaction || 0), 0);
		return totalScore / withRating.length;
	}

	// Calculate retry rate
	private calculateRetryRate(events: TaskCompletionEvent[]): number {
		const sessionGroups = new Map<string, TaskCompletionEvent[]>();

		events.forEach((event) => {
			const sessionEvents = sessionGroups.get(event.sessionId) || [];
			sessionEvents.push(event);
			sessionGroups.set(event.sessionId, sessionEvents);
		});

		let sessionsWithRetries = 0;
		let totalSessions = sessionGroups.size;

		sessionGroups.forEach((sessionEvents) => {
			const taskGroups = new Map<string, TaskCompletionEvent[]>();

			sessionEvents.forEach((event) => {
				const taskEvents = taskGroups.get(event.taskId) || [];
				taskEvents.push(event);
				taskGroups.set(event.taskId, taskEvents);
			});

			const hasRetries = Array.from(taskGroups.values()).some((taskEvents) => taskEvents.length > 1);
			if (hasRetries) sessionsWithRetries++;
		});

		return totalSessions > 0 ? sessionsWithRetries / totalSessions : 0;
	}

	// Calculate recovery rate (failed tasks that eventually succeeded)
	private calculateRecoveryRate(events: TaskCompletionEvent[]): number {
		const sessionTaskGroups = new Map<string, Map<string, TaskCompletionEvent[]>>();

		events.forEach((event) => {
			if (!sessionTaskGroups.has(event.sessionId)) {
				sessionTaskGroups.set(event.sessionId, new Map());
			}

			const sessionTasks = sessionTaskGroups.get(event.sessionId)!;
			const taskEvents = sessionTasks.get(event.taskId) || [];
			taskEvents.push(event);
			sessionTasks.set(event.taskId, taskEvents);
		});

		let recoveredTasks = 0;
		let totalFailedTasks = 0;

		sessionTaskGroups.forEach((sessionTasks) => {
			sessionTasks.forEach((taskEvents) => {
				const sortedEvents = taskEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
				const hasFailure = sortedEvents.some((e) => e.status === 'failed');
				const hasSuccess = sortedEvents.some((e) => e.status === 'completed');

				if (hasFailure) {
					totalFailedTasks++;
					if (hasSuccess) {
						recoveredTasks++;
					}
				}
			});
		});

		return totalFailedTasks > 0 ? recoveredTasks / totalFailedTasks : 0;
	}

	// Calculate tool-specific performance
	private calculateToolPerformance(events: TaskCompletionEvent[]): Record<
		string,
		{
			taskCount: number;
			completionRate: number;
			averageTime: number;
			errorRate: number;
			satisfactionScore: number;
		}
	> {
		const toolGroups = new Map<string, TaskCompletionEvent[]>();

		events.forEach((event) => {
			const toolEvents = toolGroups.get(event.toolName) || [];
			toolEvents.push(event);
			toolGroups.set(event.toolName, toolEvents);
		});

		const performance: Record<string, any> = {};

		toolGroups.forEach((toolEvents, toolName) => {
			const completed = toolEvents.filter((e) => e.status === 'completed');
			const failed = toolEvents.filter((e) => e.status === 'failed');
			const completionTimes = completed.map((e) => e.duration || 0).filter((t) => t > 0);

			const satisfactionScores = completed
				.filter((e) => e.userSatisfaction !== undefined)
				.map((e) => e.userSatisfaction || 0);

			performance[toolName] = {
				taskCount: toolEvents.length,
				completionRate: completed.length / toolEvents.length,
				averageTime:
					completionTimes.length > 0
						? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
						: 0,
				errorRate: failed.length / toolEvents.length,
				satisfactionScore:
					satisfactionScores.length > 0
						? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
						: 0,
			};
		});

		return performance;
	}

	// Calculate SC-011 compliance score
	private calculateComplianceScore(completionRate: number, successRate: number, satisfactionScore: number): number {
		// Weighted scoring: 60% completion rate, 30% success rate, 10% satisfaction
		const completionScore = Math.min(completionRate / this.COMPLETION_RATE_TARGET, 1.0) * 60;
		const successScore = successRate * 30;
		const satisfactionScoreNorm = (satisfactionScore / 5.0) * 10; // Normalize to 0-10

		return Math.round(completionScore + successScore + satisfactionScoreNorm);
	}

	// Calculate completion rate trend
	private calculateCompletionRateTrend(timeWindow: string): Array<{
		timestamp: Date;
		rate: number;
		target: number;
	}> {
		const now = new Date();
		const windowStart = this.getTimeWindowStart(now, timeWindow);
		const eventsInWindow = this.taskEvents.filter((event) => event.timestamp >= windowStart);

		// Group by hour for trend analysis
		const hourlyGroups = new Map<string, TaskCompletionEvent[]>();

		eventsInWindow.forEach((event) => {
			const hourKey = new Date(event.timestamp).toISOString().substring(0, 13); // YYYY-MM-DDTHH
			const hourEvents = hourlyGroups.get(hourKey) || [];
			hourEvents.push(event);
			hourlyGroups.set(hourKey, hourEvents);
		});

		const trend = Array.from(hourlyGroups.entries())
			.map(([hourKey, events]) => {
				const completed = events.filter((e) => e.status === 'completed').length;
				const total = events.length;
				const rate = total > 0 ? completed / total : 0;

				return {
					timestamp: new Date(hourKey + ':00:00Z'),
					rate,
					target: this.COMPLETION_RATE_TARGET,
				};
			})
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		return trend;
	}

	// Check for alerts based on thresholds
	private checkAlerts(): void {
		const metrics = this.getTaskMetrics('1h'); // Check last hour for immediate alerts

		// Check completion rate
		if (metrics.completionRate < this.ALERT_THRESHOLDS.completionRate) {
			this.createAlert({
				type: 'completion_rate',
				severity: metrics.completionRate < 0.75 ? 'critical' : 'high',
				title: 'Low Task Completion Rate',
				description: `Task completion rate is ${(metrics.completionRate * 100).toFixed(1)}%, below target of 90%`,
				threshold: this.COMPLETION_RATE_TARGET,
				currentValue: metrics.completionRate,
				affectedTools: Object.keys(metrics.toolPerformance).filter(
					(tool) => metrics.toolPerformance[tool].completionRate < this.COMPLETION_RATE_TARGET,
				),
				recommendations: [
					'Investigate error patterns and common failure points',
					'Improve user guidance and error messages',
					'Optimize performance for slow tasks',
					'Review UI/UX for potential abandonment points',
				],
			});
		}

		// Check failure rate
		if (metrics.failureRate > this.ALERT_THRESHOLDS.failureRate) {
			this.createAlert({
				type: 'error_spike',
				severity: metrics.failureRate > 0.25 ? 'critical' : 'high',
				title: 'High Task Failure Rate',
				description: `Task failure rate is ${(metrics.failureRate * 100).toFixed(1)}%, exceeding threshold of 15%`,
				threshold: this.ALERT_THRESHOLDS.failureRate,
				currentValue: metrics.failureRate,
				affectedTools: Object.keys(metrics.toolPerformance).filter(
					(tool) => metrics.toolPerformance[tool].errorRate > this.ALERT_THRESHOLDS.failureRate,
				),
				recommendations: [
					'Analyze error types and fix common issues',
					'Improve input validation and error handling',
					'Provide better error messages and recovery options',
				],
			});
		}

		// Check abandonment rate
		if (metrics.abandonmentRate > this.ALERT_THRESHOLDS.abandonmentRate) {
			this.createAlert({
				type: 'abandonment',
				severity: 'medium',
				title: 'High Task Abandonment Rate',
				description: `Task abandonment rate is ${(metrics.abandonmentRate * 100).toFixed(1)}%, indicating UX issues`,
				threshold: this.ALERT_THRESHOLDS.abandonmentRate,
				currentValue: metrics.abandonmentRate,
				affectedTools: [],
				recommendations: [
					'Review user journey and identify drop-off points',
					'Improve loading states and progress indicators',
					'Simplify complex workflows',
				],
			});
		}
	}

	// Create and store alert
	private createAlert(alertData: Omit<TaskAlert, 'id' | 'timestamp' | 'resolved'>): void {
		// Check if similar alert already exists
		const existingAlert = this.alerts.find(
			(alert) => !alert.resolved && alert.type === alertData.type && alert.title === alertData.title,
		);

		if (existingAlert) {
			// Update existing alert
			existingAlert.currentValue = alertData.currentValue;
			existingAlert.timestamp = new Date();
			return;
		}

		const alert: TaskAlert = {
			...alertData,
			id: this.generateAlertId(),
			timestamp: new Date(),
			resolved: false,
		};

		this.alerts.push(alert);
		console.warn('Task Completion Alert:', alert);
	}

	// Generate SC-011 compliance report
	public generateComplianceReport(timeWindow: string = '24h'): ComplianceReport {
		const metrics = this.getTaskMetrics(timeWindow);
		const previousMetrics = this.getPreviousPeriodMetrics(timeWindow);

		const report: ComplianceReport = {
			reportId: this.generateReportId(),
			generatedAt: new Date(),
			timeWindow,
			overallComplianceScore: metrics.sc011ComplianceScore,
			targetCompletionRate: this.COMPLETION_RATE_TARGET,
			actualCompletionRate: metrics.completionRate,
			taskMetrics: metrics,
			toolBreakdown: this.generateToolBreakdown(metrics),
			issues: this.identifyIssues(metrics),
			actionItems: this.generateActionItems(metrics),
			previousPeriodComparison: previousMetrics
				? {
						completionRateChange: metrics.completionRate - previousMetrics.completionRate,
						performanceChange: metrics.averageCompletionTime - previousMetrics.averageCompletionTime,
						satisfactionChange: metrics.userSatisfactionScore - previousMetrics.userSatisfactionScore,
					}
				: undefined,
		};

		// Store report for historical tracking
		this.storeComplianceReport(report);

		return report;
	}

	// Generate tool breakdown for compliance report
	private generateToolBreakdown(metrics: TaskMetrics): Array<{
		toolName: string;
		completionRate: number;
		successRate: number;
		averageTime: number;
		userSatisfaction: number;
		complianceStatus: 'compliant' | 'warning' | 'non-compliant';
	}> {
		return Object.entries(metrics.toolPerformance)
			.map(([toolName, performance]) => {
				const complianceStatus =
					performance.completionRate >= this.COMPLETION_RATE_TARGET
						? 'compliant'
						: performance.completionRate >= 0.8
							? 'warning'
							: 'non-compliant';

				return {
					toolName,
					completionRate: performance.completionRate,
					successRate: 1 - performance.errorRate,
					averageTime: performance.averageTime,
					userSatisfaction: performance.satisfactionScore,
					complianceStatus,
				};
			})
			.sort((a, b) => a.completionRate - b.completionRate);
	}

	// Identify issues from metrics
	private identifyIssues(metrics: TaskMetrics): Array<{
		type: string;
		description: string;
		impact: 'low' | 'medium' | 'high';
		affectedTools: string[];
		recommendation: string;
	}> {
		const issues = [];

		// Completion rate issues
		if (metrics.completionRate < this.COMPLETION_RATE_TARGET) {
			issues.push({
				type: 'completion_rate',
				description: `Overall completion rate of ${(metrics.completionRate * 100).toFixed(1)}% is below the 90% target`,
				impact: metrics.completionRate < 0.8 ? 'high' : 'medium',
				affectedTools: Object.keys(metrics.toolPerformance).filter(
					(tool) => metrics.toolPerformance[tool].completionRate < this.COMPLETION_RATE_TARGET,
				),
				recommendation: 'Focus on improving tool reliability and user experience',
			});
		}

		// Performance issues
		const slowTools = Object.entries(metrics.toolPerformance).filter(([_, perf]) => {
			const taskDef = Array.from(this.taskDefinitions.values()).find((td) => td.name === _);
			const benchmark = taskDef?.benchmarkTime || 1000;
			return perf.averageTime > benchmark * 2;
		});

		if (slowTools.length > 0) {
			issues.push({
				type: 'performance',
				description: `${slowTools.length} tools are performing slower than expected benchmarks`,
				impact: 'medium',
				affectedTools: slowTools.map(([name]) => name),
				recommendation: 'Optimize algorithms and consider performance improvements',
			});
		}

		// User satisfaction issues
		if (metrics.userSatisfactionScore < 3.5) {
			issues.push({
				type: 'user_satisfaction',
				description: `User satisfaction score of ${metrics.userSatisfactionScore.toFixed(1)}/5.0 is below acceptable levels`,
				impact: 'high',
				affectedTools: Object.keys(metrics.toolPerformance).filter(
					(tool) => metrics.toolPerformance[tool].satisfactionScore < 3.5,
				),
				recommendation: 'Improve user interface, error messages, and overall user experience',
			});
		}

		return issues;
	}

	// Generate action items for improvement
	private generateActionItems(metrics: TaskMetrics): Array<{
		priority: 'high' | 'medium' | 'low';
		action: string;
		owner: string;
		dueDate: Date;
		expectedImpact: string;
	}> {
		const actionItems = [];
		const now = new Date();

		// High priority actions
		if (metrics.completionRate < this.COMPLETION_RATE_TARGET) {
			actionItems.push({
				priority: 'high' as const,
				action: 'Investigate and fix top 3 error types causing task failures',
				owner: 'Development Team',
				dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
				expectedImpact: 'Improve completion rate by 5-10%',
			});
		}

		// Medium priority actions
		if (metrics.processingTimeDistribution.slow > 0.3) {
			actionItems.push({
				priority: 'medium' as const,
				action: 'Optimize performance for tasks with slow processing times',
				owner: 'Performance Team',
				dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
				expectedImpact: 'Reduce average processing time by 30%',
			});
		}

		// Low priority actions
		if (metrics.retryRate > 0.2) {
			actionItems.push({
				priority: 'low' as const,
				action: 'Improve error prevention and user guidance to reduce retry rates',
				owner: 'UX Team',
				dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
				expectedImpact: 'Reduce retry rate by 15%',
			});
		}

		return actionItems;
	}

	// Helper methods
	private generateEventId(): string {
		return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateAlertId(): string {
		return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateReportId(): string {
		return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private getSessionId(): string {
		return userAnalytics.getSessionId();
	}

	private getTimeWindowStart(now: Date, timeWindow: string): Date {
		const windowMs =
			{
				'1h': 60 * 60 * 1000,
				'24h': 24 * 60 * 60 * 1000,
				'7d': 7 * 24 * 60 * 60 * 1000,
				'30d': 30 * 24 * 60 * 60 * 1000,
			}[timeWindow] || 24 * 60 * 60 * 1000;

		return new Date(now.getTime() - windowMs);
	}

	private getTaskDefinition(taskId: string): TaskDefinition | undefined {
		return this.taskDefinitions.get(taskId);
	}

	private invalidateMetricsCache(): void {
		this.metricsCache.clear();
	}

	private getPreviousPeriodMetrics(timeWindow: string): TaskMetrics | null {
		// This would fetch metrics from the previous time window for comparison
		// For now, return null - would need persistent storage implementation
		return null;
	}

	private storeComplianceReport(report: ComplianceReport): void {
		// Store report for historical tracking
		try {
			const existingReports = this.getStoredReports();
			existingReports.push(report);

			// Keep only last 30 reports
			const recentReports = existingReports.slice(-30);

			localStorage.setItem('task_completion_reports', JSON.stringify(recentReports));
		} catch (error) {
			console.warn('Failed to store compliance report:', error);
		}
	}

	private getStoredReports(): ComplianceReport[] {
		try {
			const stored = localStorage.getItem('task_completion_reports');
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.warn('Failed to load stored reports:', error);
			return [];
		}
	}

	private analyzeMetrics(): void {
		// Perform comprehensive metrics analysis
		const currentMetrics = this.getTaskMetrics('1h');

		// Log key metrics for monitoring
		console.log('Task Completion Metrics:', {
			completionRate: `${(currentMetrics.completionRate * 100).toFixed(1)}%`,
			successRate: `${(currentMetrics.successRate * 100).toFixed(1)}%`,
			averageTime: `${currentMetrics.averageCompletionTime.toFixed(0)}ms`,
			complianceScore: currentMetrics.sc011ComplianceScore,
			timestamp: currentMetrics.lastUpdated,
		});
	}

	private persistData(): void {
		try {
			const data = {
				taskEvents: this.taskEvents.slice(-1000), // Keep last 1000 events
				taskDefinitions: Array.from(this.taskDefinitions.entries()),
				alerts: this.alerts.filter(
					(alert) => !alert.resolved || Date.now() - alert.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000,
				), // Keep unresolved or recent alerts
			};

			localStorage.setItem('task_completion_tracker_data', JSON.stringify(data));
		} catch (error) {
			console.warn('Failed to persist task completion data:', error);
		}
	}

	private loadPersistedData(): void {
		try {
			const stored = localStorage.getItem('task_completion_tracker_data');
			if (stored) {
				const data = JSON.parse(stored);

				if (data.taskEvents) {
					this.taskEvents = data.taskEvents.map((e: any) => ({
						...e,
						timestamp: new Date(e.timestamp),
					}));
				}

				if (data.taskDefinitions) {
					this.taskDefinitions = new Map(data.taskDefinitions);
				}

				if (data.alerts) {
					this.alerts = data.alerts.map((a: any) => ({
						...a,
						timestamp: new Date(a.timestamp),
					}));
				}
			}
		} catch (error) {
			console.warn('Failed to load persisted task completion data:', error);
		}
	}

	// Public API methods
	public getActiveTasks(): TaskCompletionEvent[] {
		return Array.from(this.activeTasks.values());
	}

	public getAlerts(): TaskAlert[] {
		return this.alerts.filter((alert) => !alert.resolved);
	}

	public resolveAlert(alertId: string): void {
		const alert = this.alerts.find((a) => a.id === alertId);
		if (alert) {
			alert.resolved = true;
		}
	}

	public getTaskDefinitions(): TaskDefinition[] {
		return Array.from(this.taskDefinitions.values());
	}

	public exportData(): string {
		const metrics = this.getTaskMetrics('7d');
		const alerts = this.getAlerts();
		const reports = this.getStoredReports().slice(-10); // Last 10 reports

		return JSON.stringify(
			{
				metrics,
				alerts,
				reports,
				exportedAt: new Date().toISOString(),
				version: '1.0.0',
			},
			null,
			2,
		);
	}

	public reset(): void {
		this.taskEvents = [];
		this.activeTasks.clear();
		this.alerts = [];
		this.metricsCache.clear();

		try {
			localStorage.removeItem('task_completion_tracker_data');
			localStorage.removeItem('task_completion_reports');
		} catch (error) {
			console.warn('Failed to clear stored data:', error);
		}
	}
}

// Singleton instance
export const taskCompletionTracker = TaskCompletionTracker.getInstance();
