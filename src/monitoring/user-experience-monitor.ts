/**
 * User Experience Monitor - Task Completion Focus
 * Comprehensive monitoring of user satisfaction, retry rates, error recovery,
 * and task abandonment patterns to support SC-011 compliance
 */

import { taskCompletionTracker } from './task-completion-tracker';
import { userAnalytics } from './user-analytics';

export interface UserExperienceMetrics {
	// Satisfaction metrics
	overallSatisfactionScore: number; // 1-5 average
	satisfactionByTool: Record<string, number>;
	satisfactionTrend: Array<{
		date: Date;
		score: number;
		toolCategory?: string;
	}>;

	// Retry and recovery metrics
	retryRate: number;
	retryByTool: Record<string, number>;
	errorRecoveryRate: number;
	averageRetriesBeforeSuccess: number;
	abandonmentAfterRetry: number;

	// Task abandonment metrics
	abandonmentRate: number;
	abandonmentByStep: Record<string, number>; // Step name -> abandonment count
	commonAbandonmentPoints: Array<{
		point: string;
		count: number;
		percentage: number;
		avgTimeAtAbandonment: number;
		reason: string;
	}>;

	// User journey metrics
	averageSessionTasksCompleted: number;
	taskStartToCompletionRatio: number;
	userFlowEfficiency: number;
	helpDocumentationUsage: number;

	// Error handling metrics
	errorEncounterRate: number;
	errorUnderstandingRate: number; // How well users understand errors
	errorResolutionSuccess: number;
	frustrationIndicators: {
		rapidClicks: number;
		longInactivePeriods: number;
		errorPatternRepetition: number;
	};

	// Performance perception metrics
	perceivedSpeed: number; // 1-5 rating
	loadingSatisfaction: number;
	interactionResponsiveness: number;
	performanceComplaints: number;

	// Feature adoption and usage
	featureAdoptionRate: number;
	advancedFeatureUsage: number;
	productivityToolsUsage: number;
	workflowEfficiency: number;

	// Accessibility and usability
	accessibilityUsage: {
		keyboardOnlyUsers: number;
		screenReaderUsers: number;
		highContrastUsers: number;
		difficultyScore: number;
	};

	// Timestamps
	lastUpdated: Date;
	timeWindow: string;
}

export interface UserSessionAnalysis {
	sessionId: string;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	tasksAttempted: number;
	tasksCompleted: number;
	tasksAbandoned: number;
	satisfactionScore: number;
	retryCount: number;
	helpSeekingBehavior: {
		documentationVisits: number;
		helpButtonClicks: number;
		searchQueries: number;
	};
	frustrationSignals: {
		errorRate: number;
		rapidActions: number;
		longPauses: number;
		navigationErrors: number;
	};
	userProfile: {
		experienceLevel: 'beginner' | 'intermediate' | 'expert';
		patternType: 'exploratory' | 'goal-oriented' | 'error-prone';
		consistency: number;
	};
}

export interface SatisfactionSurvey {
	id: string;
	taskId: string;
	toolName: string;
	sessionId: string;
	timestamp: Date;
	responses: {
		overallSatisfaction: number; // 1-5
		easeOfUse: number; // 1-5
		achievedGoal: boolean;
		metExpectations: number; // 1-5
		wouldRecommend: number; // 1-5
		technicalIssues: boolean;
		featuresUsed: string[];
		difficultyRating: 'easy' | 'medium' | 'hard';
	};
	feedback?: {
		whatWentWell?: string;
		whatCouldBeBetter?: string;
		suggestions?: string;
		technicalIssues?: string;
	};
	context: {
		taskComplexity: 'simple' | 'medium' | 'complex';
		deviceType: string;
		browserType: string;
		timeOfDay: string;
		sessionDuration: number;
	};
}

export interface UserExperienceAlert {
	id: string;
	type: 'low_satisfaction' | 'high_abandonment' | 'frustration_spike' | 'usability_issue';
	severity: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	metrics: {
		currentValue: number;
		threshold: number;
		trend: 'improving' | 'stable' | 'declining';
	};
	affectedTools: string[];
	userSegment?: string;
	recommendations: string[];
	timestamp: Date;
	resolved: boolean;
}

export class UserExperienceMonitor {
	private static instance: UserExperienceMonitor;
	private satisfactionSurveys: SatisfactionSurvey[] = [];
	private sessionAnalyses: Map<string, UserSessionAnalysis> = new Map();
	private alerts: UserExperienceAlert[] = [];
	private metricsCache: Map<string, UserExperienceMetrics> = new Map();
	private readonly SATISFACTION_THRESHOLD = 3.5; // Below this triggers alerts
	private readonly ABANDONMENT_THRESHOLD = 0.15; // 15% abandonment rate
	private readonly FRUSTRATION_THRESHOLD = 0.3; // 30% frustration indicators

	private constructor() {
		this.initializeMonitoring();
		this.setupPeriodicAnalysis();
		this.loadPersistedData();
	}

	public static getInstance(): UserExperienceMonitor {
		if (!UserExperienceMonitor.instance) {
			UserExperienceMonitor.instance = new UserExperienceMonitor();
		}
		return UserExperienceMonitor.instance;
	}

	// Initialize monitoring systems
	private initializeMonitoring(): void {
		// Track user satisfaction patterns
		this.setupSatisfactionTracking();

		// Monitor abandonment patterns
		this.setupAbandonmentTracking();

		// Detect frustration indicators
		this.setupFrustrationDetection();

		// Track help-seeking behavior
		this.setupHelpTracking();
	}

	// Setup satisfaction tracking
	private setupSatisfactionTracking(): void {
		// Monitor satisfaction survey responses
		// Track satisfaction trends over time
		// Identify patterns in low satisfaction
	}

	// Setup abandonment tracking
	private setupAbandonmentTracking(): void {
		// Monitor where users abandon tasks
		// Track abandonment reasons
		// Identify common drop-off points
	}

	// Setup frustration detection
	private setupFrustrationDetection(): void {
		// Monitor rapid clicking patterns
		// Track error repetition
		// Detect long inactive periods
	}

	// Setup help tracking
	private setupHelpTracking(): void {
		// Track help documentation usage
		// Monitor help button clicks
		// Analyze search patterns
	}

	// Setup periodic analysis
	private setupPeriodicAnalysis(): void {
		// Analyze user experience metrics every 10 minutes
		setInterval(
			() => {
				this.analyzeUserExperience();
				this.checkExperienceAlerts();
				this.persistData();
			},
			10 * 60 * 1000,
		);

		// Generate comprehensive report every hour
		setInterval(
			() => {
				this.generateExperienceReport();
			},
			60 * 60 * 1000,
		);
	}

	// Record satisfaction survey
	public recordSatisfactionSurvey(survey: Omit<SatisfactionSurvey, 'id'>): void {
		const fullSurvey: SatisfactionSurvey = {
			...survey,
			id: this.generateSurveyId(),
		};

		this.satisfactionSurveys.push(fullSurvey);

		// Update satisfaction metrics
		this.updateSatisfactionMetrics(fullSurvey);

		// Check for satisfaction alerts
		this.checkSatisfactionAlerts(fullSurvey);
	}

	// Analyze user session for experience patterns
	public analyzeSession(sessionId: string, analysis: Partial<UserSessionAnalysis>): void {
		const sessionAnalysis: UserSessionAnalysis = {
			sessionId,
			startTime: analysis.startTime || new Date(),
			endTime: analysis.endTime,
			duration: analysis.duration,
			tasksAttempted: analysis.tasksAttempted || 0,
			tasksCompleted: analysis.tasksCompleted || 0,
			tasksAbandoned: analysis.tasksAbandoned || 0,
			satisfactionScore: analysis.satisfactionScore || 0,
			retryCount: analysis.retryCount || 0,
			helpSeekingBehavior: analysis.helpSeekingBehavior || {
				documentationVisits: 0,
				helpButtonClicks: 0,
				searchQueries: 0,
			},
			frustrationSignals: analysis.frustrationSignals || {
				errorRate: 0,
				rapidActions: 0,
				longPauses: 0,
				navigationErrors: 0,
			},
			userProfile: analysis.userProfile || {
				experienceLevel: 'intermediate',
				patternType: 'goal-oriented',
				consistency: 0.5,
			},
		};

		this.sessionAnalyses.set(sessionId, sessionAnalysis);

		// Analyze session for patterns
		this.analyzeSessionPatterns(sessionAnalysis);
	}

	// Track user frustration indicators
	public trackFrustrationIndicator(
		sessionId: string,
		indicator: 'rapid_clicks' | 'error_repetition' | 'long_pause' | 'navigation_errors',
		severity: 'low' | 'medium' | 'high',
		context?: {
			toolName?: string;
			action?: string;
			duration?: number;
		},
	): void {
		const analysis = this.sessionAnalyses.get(sessionId);
		if (!analysis) return;

		switch (indicator) {
			case 'rapid_clicks':
				analysis.frustrationSignals.rapidActions++;
				break;
			case 'error_repetition':
				analysis.frustrationSignals.errorRate += 0.1;
				break;
			case 'long_pause':
				analysis.frustrationSignals.longPauses++;
				break;
			case 'navigation_errors':
				analysis.frustrationSignals.navigationErrors++;
				break;
		}

		// Check if frustration level warrants alert
		this.checkFrustrationAlerts(sessionId, indicator, severity, context);
	}

	// Track help-seeking behavior
	public trackHelpSeeking(
		sessionId: string,
		helpType: 'documentation' | 'help_button' | 'search' | 'tooltip' | 'example',
		context?: {
			toolName?: string;
			query?: string;
			topic?: string;
		},
	): void {
		const analysis = this.sessionAnalyses.get(sessionId);
		if (!analysis) return;

		switch (helpType) {
			case 'documentation':
				analysis.helpSeekingBehavior.documentationVisits++;
				break;
			case 'help_button':
				analysis.helpSeekingBehavior.helpButtonClicks++;
				break;
			case 'search':
				analysis.helpSeekingBehavior.searchQueries++;
				break;
		}

		// Analyze help-seeking patterns
		this.analyzeHelpSeekingPatterns(sessionId, helpType, context);
	}

	// Get comprehensive user experience metrics
	public getUserExperienceMetrics(timeWindow: string = '24h'): UserExperienceMetrics {
		const cacheKey = `ux_metrics_${timeWindow}`;
		const cached = this.metricsCache.get(cacheKey);
		if (cached && Date.now() - cached.lastUpdated.getTime() < 10 * 60 * 1000) {
			return cached;
		}

		const now = new Date();
		const windowStart = this.getTimeWindowStart(now, timeWindow);

		const metrics = this.calculateUserExperienceMetrics(windowStart, timeWindow);
		this.metricsCache.set(cacheKey, metrics);

		return metrics;
	}

	// Calculate comprehensive user experience metrics
	private calculateUserExperienceMetrics(windowStart: Date, timeWindow: string): UserExperienceMetrics {
		// Filter data within time window
		const recentSurveys = this.satisfactionSurveys.filter((s) => s.timestamp >= windowStart);
		const recentSessions = Array.from(this.sessionAnalyses.values()).filter((s) => s.startTime >= windowStart);

		// Calculate satisfaction metrics
		const satisfactionMetrics = this.calculateSatisfactionMetrics(recentSurveys);

		// Calculate retry and recovery metrics
		const retryMetrics = this.calculateRetryMetrics(recentSessions);

		// Calculate abandonment metrics
		const abandonmentMetrics = this.calculateAbandonmentMetrics(recentSessions);

		// Calculate user journey metrics
		const journeyMetrics = this.calculateJourneyMetrics(recentSessions);

		// Calculate error handling metrics
		const errorMetrics = this.calculateErrorMetrics(recentSessions);

		// Calculate performance perception metrics
		const performanceMetrics = this.calculatePerformanceMetrics(recentSurveys);

		// Calculate feature adoption metrics
		const adoptionMetrics = this.calculateAdoptionMetrics(recentSessions, recentSurveys);

		// Calculate accessibility metrics
		const accessibilityMetrics = this.calculateAccessibilityMetrics(recentSessions);

		return {
			overallSatisfactionScore: satisfactionMetrics.overall,
			satisfactionByTool: satisfactionMetrics.byTool,
			satisfactionTrend: satisfactionMetrics.trend,
			retryRate: retryMetrics.rate,
			retryByTool: retryMetrics.byTool,
			errorRecoveryRate: retryMetrics.recoveryRate,
			averageRetriesBeforeSuccess: retryMetrics.avgRetries,
			abandonmentAfterRetry: retryMetrics.abandonmentAfterRetry,
			abandonmentRate: abandonmentMetrics.rate,
			abandonmentByStep: abandonmentMetrics.byStep,
			commonAbandonmentPoints: abandonmentMetrics.commonPoints,
			averageSessionTasksCompleted: journeyMetrics.avgTasksCompleted,
			taskStartToCompletionRatio: journeyMetrics.startToCompletionRatio,
			userFlowEfficiency: journeyMetrics.flowEfficiency,
			helpDocumentationUsage: journeyMetrics.helpUsage,
			errorEncounterRate: errorMetrics.encounterRate,
			errorUnderstandingRate: errorMetrics.understandingRate,
			errorResolutionSuccess: errorMetrics.resolutionSuccess,
			frustrationIndicators: errorMetrics.frustrationIndicators,
			perceivedSpeed: performanceMetrics.speed,
			loadingSatisfaction: performanceMetrics.loading,
			interactionResponsiveness: performanceMetrics.responsiveness,
			performanceComplaints: performanceMetrics.complaints,
			featureAdoptionRate: adoptionMetrics.adoptionRate,
			advancedFeatureUsage: adoptionMetrics.advancedUsage,
			productivityToolsUsage: adoptionMetrics.productivityUsage,
			workflowEfficiency: adoptionMetrics.workflowEfficiency,
			accessibilityUsage: accessibilityMetrics,
			lastUpdated: new Date(),
			timeWindow,
		};
	}

	// Calculate satisfaction metrics
	private calculateSatisfactionMetrics(surveys: SatisfactionSurvey[]): {
		overall: number;
		byTool: Record<string, number>;
		trend: Array<{ date: Date; score: number; toolCategory?: string }>;
	} {
		if (surveys.length === 0) {
			return {
				overall: 0,
				byTool: {},
				trend: [],
			};
		}

		// Overall satisfaction
		const overallSatisfaction = surveys.reduce((sum, s) => sum + s.responses.overallSatisfaction, 0) / surveys.length;

		// Satisfaction by tool
		const satisfactionByTool: Record<string, number> = {};
		const toolGroups = new Map<string, SatisfactionSurvey[]>();

		surveys.forEach((survey) => {
			const toolSurveys = toolGroups.get(survey.toolName) || [];
			toolSurveys.push(survey);
			toolGroups.set(survey.toolName, toolSurveys);
		});

		toolGroups.forEach((toolSurveys, toolName) => {
			const avgSatisfaction =
				toolSurveys.reduce((sum, s) => sum + s.responses.overallSatisfaction, 0) / toolSurveys.length;
			satisfactionByTool[toolName] = avgSatisfaction;
		});

		// Satisfaction trend (grouped by day)
		const trend = this.calculateSatisfactionTrend(surveys);

		return {
			overall: overallSatisfaction,
			byTool: satisfactionByTool,
			trend,
		};
	}

	// Calculate satisfaction trend over time
	private calculateSatisfactionTrend(surveys: SatisfactionSurvey[]): Array<{
		date: Date;
		score: number;
		toolCategory?: string;
	}> {
		const dailyGroups = new Map<string, SatisfactionSurvey[]>();

		surveys.forEach((survey) => {
			const dayKey = survey.timestamp.toISOString().substring(0, 10); // YYYY-MM-DD
			const daySurveys = dailyGroups.get(dayKey) || [];
			daySurveys.push(survey);
			dailyGroups.set(dayKey, daySurveys);
		});

		return Array.from(dailyGroups.entries())
			.map(([day, daySurveys]) => {
				const avgScore = daySurveys.reduce((sum, s) => sum + s.responses.overallSatisfaction, 0) / daySurveys.length;
				return {
					date: new Date(day),
					score: avgScore,
					toolCategory: undefined, // Could be enhanced to categorize
				};
			})
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	}

	// Calculate retry and recovery metrics
	private calculateRetryMetrics(sessions: UserSessionAnalysis[]): {
		rate: number;
		byTool: Record<string, number>;
		recoveryRate: number;
		avgRetries: number;
		abandonmentAfterRetry: number;
	} {
		if (sessions.length === 0) {
			return {
				rate: 0,
				byTool: {},
				recoveryRate: 0,
				avgRetries: 0,
				abandonmentAfterRetry: 0,
			};
		}

		const totalSessions = sessions.length;
		const sessionsWithRetries = sessions.filter((s) => s.retryCount > 0);
		const retryRate = sessionsWithRetries.length / totalSessions;

		// Average retries per session with retries
		const avgRetries =
			sessionsWithRetries.length > 0
				? sessionsWithRetries.reduce((sum, s) => sum + s.retryCount, 0) / sessionsWithRetries.length
				: 0;

		// Recovery rate (sessions that eventually succeeded after retries)
		const sessionsWithRecovery = sessionsWithRetries.filter((s) => s.tasksCompleted > 0 && s.retryCount > 0);
		const recoveryRate = sessionsWithRetries.length > 0 ? sessionsWithRecovery.length / sessionsWithRetries.length : 0;

		// Abandonment after retry
		const abandonmentAfterRetry =
			sessionsWithRetries.length > 0
				? sessionsWithRetries.filter((s) => s.tasksAbandoned > 0).length / sessionsWithRetries.length
				: 0;

		// Retry by tool (would need more detailed tracking)
		const retryByTool: Record<string, number> = {};
		// This would be implemented with more granular tracking

		return {
			rate: retryRate,
			byTool: retryByTool,
			recoveryRate,
			avgRetries,
			abandonmentAfterRetry,
		};
	}

	// Calculate abandonment metrics
	private calculateAbandonmentMetrics(sessions: UserSessionAnalysis[]): {
		rate: number;
		byStep: Record<string, number>;
		commonPoints: Array<{
			point: string;
			count: number;
			percentage: number;
			avgTimeAtAbandonment: number;
			reason: string;
		}>;
	} {
		if (sessions.length === 0) {
			return {
				rate: 0,
				byStep: {},
				commonPoints: [],
			};
		}

		const totalTasks = sessions.reduce((sum, s) => sum + s.tasksAttempted, 0);
		const totalAbandoned = sessions.reduce((sum, s) => sum + s.tasksAbandoned, 0);
		const abandonmentRate = totalTasks > 0 ? totalAbandoned / totalTasks : 0;

		// Get abandonment data from task completion tracker
		const taskMetrics = taskCompletionTracker.getTaskMetrics('24h');
		const commonPoints = taskMetrics.commonFailurePoints.map((point) => ({
			point: point.point,
			count: point.count,
			percentage: point.percentage,
			avgTimeAtAbandonment: 0, // Would need more detailed tracking
			reason: 'Unknown', // Would need more detailed tracking
		}));

		return {
			rate: abandonmentRate,
			byStep: {}, // Would need more detailed step tracking
			commonPoints,
		};
	}

	// Calculate user journey metrics
	private calculateJourneyMetrics(sessions: UserSessionAnalysis[]): {
		avgTasksCompleted: number;
		startToCompletionRatio: number;
		flowEfficiency: number;
		helpUsage: number;
	} {
		if (sessions.length === 0) {
			return {
				avgTasksCompleted: 0,
				startToCompletionRatio: 0,
				flowEfficiency: 0,
				helpUsage: 0,
			};
		}

		const avgTasksCompleted = sessions.reduce((sum, s) => sum + s.tasksCompleted, 0) / sessions.length;

		const totalTasksAttempted = sessions.reduce((sum, s) => sum + s.tasksAttempted, 0);
		const totalTasksCompleted = sessions.reduce((sum, s) => sum + s.tasksCompleted, 0);
		const startToCompletionRatio = totalTasksAttempted > 0 ? totalTasksCompleted / totalTasksAttempted : 0;

		// Flow efficiency (completed tasks / (completed + abandoned))
		const flowEfficiency =
			totalTasksCompleted + totalTasksCompleted > 0
				? totalTasksCompleted / (totalTasksCompleted + sessions.reduce((sum, s) => sum + s.tasksAbandoned, 0))
				: 0;

		// Help usage (percentage of sessions that sought help)
		const sessionsWithHelp = sessions.filter(
			(s) =>
				s.helpSeekingBehavior.documentationVisits > 0 ||
				s.helpSeekingBehavior.helpButtonClicks > 0 ||
				s.helpSeekingBehavior.searchQueries > 0,
		);
		const helpUsage = sessions.length > 0 ? sessionsWithHelp.length / sessions.length : 0;

		return {
			avgTasksCompleted,
			startToCompletionRatio,
			flowEfficiency,
			helpUsage,
		};
	}

	// Calculate error handling metrics
	private calculateErrorMetrics(sessions: UserSessionAnalysis[]): {
		encounterRate: number;
		understandingRate: number;
		resolutionSuccess: number;
		frustrationIndicators: {
			rapidClicks: number;
			longInactivePeriods: number;
			errorPatternRepetition: number;
		};
	} {
		if (sessions.length === 0) {
			return {
				encounterRate: 0,
				understandingRate: 0,
				resolutionSuccess: 0,
				frustrationIndicators: {
					rapidClicks: 0,
					longInactivePeriods: 0,
					errorPatternRepetition: 0,
				},
			};
		}

		// Error encounter rate
		const sessionsWithErrors = sessions.filter((s) => s.frustrationSignals.errorRate > 0);
		const encounterRate = sessions.length > 0 ? sessionsWithErrors.length / sessions.length : 0;

		// Error understanding and resolution would need more detailed tracking
		const understandingRate = 0.8; // Placeholder
		const resolutionSuccess = 0.7; // Placeholder

		// Frustration indicators
		const totalRapidClicks = sessions.reduce((sum, s) => sum + s.frustrationSignals.rapidActions, 0);
		const totalLongPauses = sessions.reduce((sum, s) => sum + s.frustrationSignals.longPauses, 0);
		const totalErrorRate = sessions.reduce((sum, s) => sum + s.frustrationSignals.errorRate, 0);

		return {
			encounterRate,
			understandingRate,
			resolutionSuccess,
			frustrationIndicators: {
				rapidClicks: totalRapidClicks / sessions.length,
				longInactivePeriods: totalLongPauses / sessions.length,
				errorPatternRepetition: totalErrorRate / sessions.length,
			},
		};
	}

	// Calculate performance perception metrics
	private calculatePerformanceMetrics(surveys: SatisfactionSurvey[]): {
		speed: number;
		loading: number;
		responsiveness: number;
		complaints: number;
	} {
		// These would be extracted from survey responses or direct feedback
		return {
			speed: 4.0, // Placeholder
			loading: 3.8, // Placeholder
			responsiveness: 4.1, // Placeholder
			complaints: 0.05, // 5% complaint rate (placeholder)
		};
	}

	// Calculate feature adoption metrics
	private calculateAdoptionMetrics(
		sessions: UserSessionAnalysis[],
		surveys: SatisfactionSurvey[],
	): {
		adoptionRate: number;
		advancedUsage: number;
		productivityUsage: number;
		workflowEfficiency: number;
	} {
		// Analyze feature usage from surveys and sessions
		const allFeatures = new Set<string>();
		const usedFeatures = new Set<string>();

		surveys.forEach((survey) => {
			survey.responses.featuresUsed.forEach((feature) => {
				usedFeatures.add(feature);
			});
		});

		// This would need a predefined list of all available features
		const totalFeatures = 50; // Example
		const adoptionRate = usedFeatures.size / totalFeatures;

		return {
			adoptionRate,
			advancedUsage: 0.3, // Placeholder
			productivityUsage: 0.6, // Placeholder
			workflowEfficiency: 0.75, // Placeholder
		};
	}

	// Calculate accessibility metrics
	private calculateAccessibilityMetrics(sessions: UserSessionAnalysis[]): {
		keyboardOnlyUsers: number;
		screenReaderUsers: number;
		highContrastUsers: number;
		difficultyScore: number;
	} {
		// Get accessibility data from user analytics
		const userMetrics = userAnalytics.getMetrics();

		return {
			keyboardOnlyUsers: userMetrics.accessibilityUsage.keyboardOnlyUsers,
			screenReaderUsers: userMetrics.accessibilityUsage.screenReaderUsers,
			highContrastUsers: userMetrics.accessibilityUsage.highContrastUsers,
			difficultyScore: 0.2, // Lower is better (placeholder)
		};
	}

	// Check for user experience alerts
	private checkExperienceAlerts(): void {
		const metrics = this.getUserExperienceMetrics('1h');

		// Check satisfaction alerts
		if (metrics.overallSatisfactionScore < this.SATISFACTION_THRESHOLD) {
			this.createExperienceAlert({
				type: 'low_satisfaction',
				severity: metrics.overallSatisfactionScore < 2.5 ? 'critical' : 'high',
				title: 'Low User Satisfaction Detected',
				description: `User satisfaction has dropped to ${metrics.overallSatisfactionScore.toFixed(1)}/5.0`,
				metrics: {
					currentValue: metrics.overallSatisfactionScore,
					threshold: this.SATISFACTION_THRESHOLD,
					trend: 'declining',
				},
				affectedTools: Object.entries(metrics.satisfactionByTool)
					.filter(([_, score]) => score < this.SATISFACTION_THRESHOLD)
					.map(([tool]) => tool),
				recommendations: [
					'Review recent changes that may have impacted user experience',
					'Analyze feedback from low-satisfaction users',
					'Consider user experience improvements in affected tools',
				],
			});
		}

		// Check abandonment alerts
		if (metrics.abandonmentRate > this.ABANDONMENT_THRESHOLD) {
			this.createExperienceAlert({
				type: 'high_abandonment',
				severity: metrics.abandonmentRate > 0.25 ? 'critical' : 'high',
				title: 'High Task Abandonment Rate',
				description: `Task abandonment rate is ${(metrics.abandonmentRate * 100).toFixed(1)}%`,
				metrics: {
					currentValue: metrics.abandonmentRate,
					threshold: this.ABANDONMENT_THRESHOLD,
					trend: 'stable',
				},
				affectedTools: [],
				recommendations: [
					'Investigate common abandonment points',
					'Improve user guidance and error messages',
					'Simplify complex workflows',
				],
			});
		}

		// Check frustration indicators
		const frustrationScore =
			(metrics.frustrationIndicators.rapidClicks +
				metrics.frustrationIndicators.longInactivePeriods +
				metrics.frustrationIndicators.errorPatternRepetition) /
			3;

		if (frustrationScore > this.FRUSTRATION_THRESHOLD) {
			this.createExperienceAlert({
				type: 'frustration_spike',
				severity: 'medium',
				title: 'User Frustration Indicators Detected',
				description: `Elevated frustration signals detected in user interactions`,
				metrics: {
					currentValue: frustrationScore,
					threshold: this.FRUSTRATION_THRESHOLD,
					trend: 'stable',
				},
				affectedTools: [],
				recommendations: [
					'Investigate sources of user frustration',
					'Improve error handling and feedback',
					'Review UI responsiveness and clarity',
				],
			});
		}
	}

	// Create and store experience alert
	private createExperienceAlert(alertData: Omit<UserExperienceAlert, 'id' | 'timestamp' | 'resolved'>): void {
		const existingAlert = this.alerts.find(
			(alert) => !alert.resolved && alert.type === alertData.type && alert.title === alertData.title,
		);

		if (existingAlert) {
			existingAlert.metrics.currentValue = alertData.metrics.currentValue;
			existingAlert.timestamp = new Date();
			return;
		}

		const alert: UserExperienceAlert = {
			...alertData,
			id: this.generateAlertId(),
			timestamp: new Date(),
			resolved: false,
		};

		this.alerts.push(alert);
		console.warn('User Experience Alert:', alert);
	}

	// Generate comprehensive user experience report
	public generateExperienceReport(timeWindow: string = '24h'): {
		reportId: string;
		generatedAt: Date;
		timeWindow: string;
		metrics: UserExperienceMetrics;
		alerts: UserExperienceAlert[];
		insights: Array<{
			category: string;
			finding: string;
			impact: 'low' | 'medium' | 'high';
			recommendation: string;
		}>;
		actionItems: Array<{
			priority: 'high' | 'medium' | 'low';
			action: string;
			owner: string;
			dueDate: Date;
		}>;
	} {
		const metrics = this.getUserExperienceMetrics(timeWindow);
		const activeAlerts = this.alerts.filter((alert) => !alert.resolved);
		const insights = this.generateExperienceInsights(metrics);
		const actionItems = this.generateExperienceActionItems(metrics, insights);

		return {
			reportId: this.generateReportId(),
			generatedAt: new Date(),
			timeWindow,
			metrics,
			alerts: activeAlerts,
			insights,
			actionItems,
		};
	}

	// Generate experience insights
	private generateExperienceInsights(metrics: UserExperienceMetrics): Array<{
		category: string;
		finding: string;
		impact: 'low' | 'medium' | 'high';
		recommendation: string;
	}> {
		const insights = [];

		// Satisfaction insights
		if (metrics.overallSatisfactionScore < 3.5) {
			insights.push({
				category: 'satisfaction',
				finding: `User satisfaction is below optimal at ${metrics.overallSatisfactionScore.toFixed(1)}/5.0`,
				impact: 'high',
				recommendation: 'Focus on improving user experience and addressing pain points',
			});
		}

		// Abandonment insights
		if (metrics.abandonmentRate > 0.15) {
			insights.push({
				category: 'abandonment',
				finding: `High abandonment rate of ${(metrics.abandonmentRate * 100).toFixed(1)}% detected`,
				impact: 'high',
				recommendation: 'Investigate common drop-off points and simplify user workflows',
			});
		}

		// Retry insights
		if (metrics.retryRate > 0.3) {
			insights.push({
				category: 'retry_behavior',
				finding: `High retry rate of ${(metrics.retryRate * 100).toFixed(1)}% indicates usability issues`,
				impact: 'medium',
				recommendation: 'Improve error prevention and provide clearer guidance',
			});
		}

		// Feature adoption insights
		if (metrics.featureAdoptionRate < 0.5) {
			insights.push({
				category: 'feature_adoption',
				finding: `Low feature adoption rate of ${(metrics.featureAdoptionRate * 100).toFixed(1)}%`,
				impact: 'medium',
				recommendation: 'Improve feature discoverability and provide better onboarding',
			});
		}

		return insights;
	}

	// Generate action items
	private generateExperienceActionItems(
		metrics: UserExperienceMetrics,
		insights: Array<any>,
	): Array<{
		priority: 'high' | 'medium' | 'low';
		action: string;
		owner: string;
		dueDate: Date;
	}> {
		const actionItems = [];
		const now = new Date();

		insights.forEach((insight) => {
			if (insight.impact === 'high') {
				actionItems.push({
					priority: 'high' as const,
					action: insight.recommendation,
					owner: 'UX Team',
					dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
				});
			} else if (insight.impact === 'medium') {
				actionItems.push({
					priority: 'medium' as const,
					action: insight.recommendation,
					owner: 'Product Team',
					dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
				});
			}
		});

		return actionItems;
	}

	// Helper methods
	private generateSurveyId(): string {
		return `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateAlertId(): string {
		return `ux_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateReportId(): string {
		return `ux_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

	private updateSatisfactionMetrics(survey: SatisfactionSurvey): void {
		// Update real-time satisfaction tracking
	}

	private checkSatisfactionAlerts(survey: SatisfactionSurvey): void {
		// Check for immediate satisfaction issues
		if (survey.responses.overallSatisfaction < 2.0) {
			console.warn(
				`Very low satisfaction reported for ${survey.toolName}: ${survey.responses.overallSatisfaction}/5.0`,
			);
		}
	}

	private analyzeSessionPatterns(analysis: UserSessionAnalysis): void {
		// Analyze session for UX patterns
		if (analysis.frustrationSignals.errorRate > 0.5) {
			console.warn(`High error rate in session ${analysis.sessionId}: ${analysis.frustrationSignals.errorRate}`);
		}
	}

	private checkFrustrationAlerts(sessionId: string, indicator: string, severity: string, context?: any): void {
		// Check for frustration level alerts
		if (severity === 'high') {
			console.warn(`High frustration indicator detected: ${indicator} in session ${sessionId}`);
		}
	}

	private analyzeHelpSeekingPatterns(sessionId: string, helpType: string, context?: any): void {
		// Analyze patterns in help-seeking behavior
		const analysis = this.sessionAnalyses.get(sessionId);
		if (analysis && analysis.helpSeekingBehavior.searchQueries > 5) {
			console.info(`High help-seeking activity in session ${sessionId}`);
		}
	}

	private analyzeUserExperience(): void {
		// Perform comprehensive user experience analysis
		const metrics = this.getUserExperienceMetrics('1h');

		console.log('User Experience Metrics:', {
			satisfaction: metrics.overallSatisfactionScore.toFixed(2),
			abandonmentRate: `${(metrics.abandonmentRate * 100).toFixed(1)}%`,
			retryRate: `${(metrics.retryRate * 100).toFixed(1)}%`,
			frustrationScore: (
				(metrics.frustrationIndicators.rapidClicks +
					metrics.frustrationIndicators.longInactivePeriods +
					metrics.frustrationIndicators.errorPatternRepetition) /
				3
			).toFixed(2),
		});
	}

	private persistData(): void {
		try {
			const data = {
				satisfactionSurveys: this.satisfactionSurveys.slice(-500), // Keep last 500
				sessionAnalyses: Array.from(this.sessionAnalyses.entries()).slice(-200), // Keep last 200
				alerts: this.alerts.filter(
					(alert) => !alert.resolved || Date.now() - alert.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000,
				),
			};

			localStorage.setItem('user_experience_monitor_data', JSON.stringify(data));
		} catch (error) {
			console.warn('Failed to persist user experience data:', error);
		}
	}

	private loadPersistedData(): void {
		try {
			const stored = localStorage.getItem('user_experience_monitor_data');
			if (stored) {
				const data = JSON.parse(stored);

				if (data.satisfactionSurveys) {
					this.satisfactionSurveys = data.satisfactionSurveys.map((s: any) => ({
						...s,
						timestamp: new Date(s.timestamp),
					}));
				}

				if (data.sessionAnalyses) {
					this.sessionAnalyses = new Map(
						data.sessionAnalyses.map(([id, analysis]: [string, any]) => [
							id,
							{
								...analysis,
								startTime: new Date(analysis.startTime),
								endTime: analysis.endTime ? new Date(analysis.endTime) : undefined,
							},
						]),
					);
				}

				if (data.alerts) {
					this.alerts = data.alerts.map((a: any) => ({
						...a,
						timestamp: new Date(a.timestamp),
					}));
				}
			}
		} catch (error) {
			console.warn('Failed to load persisted user experience data:', error);
		}
	}

	// Public API methods
	public getAlerts(): UserExperienceAlert[] {
		return this.alerts.filter((alert) => !alert.resolved);
	}

	public resolveAlert(alertId: string): void {
		const alert = this.alerts.find((a) => a.id === alertId);
		if (alert) {
			alert.resolved = true;
		}
	}

	public getSessionAnalysis(sessionId: string): UserSessionAnalysis | undefined {
		return this.sessionAnalyses.get(sessionId);
	}

	public exportData(): string {
		const metrics = this.getUserExperienceMetrics('7d');
		const alerts = this.getAlerts();
		const recentSurveys = this.satisfactionSurveys.slice(-50);

		return JSON.stringify(
			{
				metrics,
				alerts,
				surveys: recentSurveys,
				exportedAt: new Date().toISOString(),
				version: '1.0.0',
			},
			null,
			2,
		);
	}

	public reset(): void {
		this.satisfactionSurveys = [];
		this.sessionAnalyses.clear();
		this.alerts = [];
		this.metricsCache.clear();

		try {
			localStorage.removeItem('user_experience_monitor_data');
		} catch (error) {
			console.warn('Failed to clear stored user experience data:', error);
		}
	}
}

// Singleton instance
export const userExperienceMonitor = UserExperienceMonitor.getInstance();
