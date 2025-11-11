/**
 * Workflow Analytics System
 * Tracks user progress, behavior, and workflow effectiveness
 */

import type {
	Workflow,
	WorkflowAnalytics as Analytics,
	WorkflowStats,
	WorkflowProgress,
	DeviceInfo
} from '@/types/workflows';
import { useWorkflowStore } from './workflow-store';

export class WorkflowAnalyticsManager {
	private static instance: WorkflowAnalyticsManager;
	private analyticsData: Map<string, Analytics[]> = new Map();
	private statsCache: Map<string, WorkflowStats> = new Map();
	private flushInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.initializeFlushInterval();
		this.loadPersistedData();
	}

	static getInstance(): WorkflowAnalyticsManager {
		if (!WorkflowAnalyticsManager.instance) {
			WorkflowAnalyticsManager.instance = new WorkflowAnalyticsManager();
		}
		return WorkflowAnalyticsManager.instance;
	}

	// Initialize periodic data flushing
	private initializeFlushInterval() {
		this.flushInterval = setInterval(() => {
			this.flushData();
		}, 30000); // Flush every 30 seconds
	}

	// Load persisted analytics data from localStorage
	private loadPersistedData() {
		if (typeof window === 'undefined') return;

		try {
			const stored = localStorage.getItem('workflow-analytics');
			if (stored) {
				const data = JSON.parse(stored);
				this.analyticsData = new Map(data.analytics || []);
				this.statsCache = new Map(data.stats || []);
			}
		} catch (error) {
			console.error('Failed to load analytics data:', error);
		}
	}

	// Save analytics data to localStorage
	private savePersistedData() {
		if (typeof window === 'undefined') return;

		try {
			const data = {
				analytics: Array.from(this.analyticsData.entries()),
				stats: Array.from(this.statsCache.entries()),
				timestamp: new Date().toISOString(),
			};
			localStorage.setItem('workflow-analytics', JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save analytics data:', error);
		}
	}

	// Periodic data flush to storage
	private flushData() {
		this.savePersistedData();
		this.cleanupOldData();
	}

	// Clean up old analytics data (older than 90 days)
	private cleanupOldData() {
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

		for (const [workflowId, analytics] of this.analyticsData.entries()) {
			const filtered = analytics.filter(a =>
				a.startTime && new Date(a.startTime) > ninetyDaysAgo
			);

			if (filtered.length !== analytics.length) {
				this.analyticsData.set(workflowId, filtered);
			}
		}

		// Invalidate stats cache when data changes
		this.statsCache.clear();
	}

	// Track workflow start
	public trackWorkflowStart(
		workflowId: string,
		workflow: Workflow,
		deviceInfo: DeviceInfo
	): string {
		const sessionId = this.generateSessionId();

		const analytics: Analytics = {
			workflowId,
			sessionId,
			startTime: new Date(),
			completed: false,
			stepsCompleted: 0,
			totalSteps: workflow.steps.length,
			timePerStep: {},
			errors: 0,
			hintsUsed: 0,
			skips: 0,
			deviceInfo,
			satisfaction: 0,
		};

		this.addAnalytics(workflowId, analytics);
		return sessionId;
	}

	// Track workflow completion
	public trackWorkflowComplete(
		workflowId: string,
		sessionId: string,
		progress: WorkflowProgress,
		satisfaction?: number,
		feedback?: string
	) {
		const analytics = this.getAnalytics(workflowId, sessionId);
		if (!analytics) return;

		analytics.endTime = new Date();
		analytics.completed = true;
		analytics.stepsCompleted = progress.completedSteps.length;
		analytics.timePerStep = progress.timePerStep || {};
		analytics.errors = progress.errors.length;
		analytics.hintsUsed = progress.hintsShown.length;
		analytics.skips = progress.skippedSteps.length;
		analytics.satisfaction = satisfaction || 0;
		analytics.feedback = feedback;

		this.updateAnalytics(workflowId, sessionId, analytics);
		this.invalidateStatsCache(workflowId);
	}

	// Track individual step completion
	public trackStepComplete(
		workflowId: string,
		sessionId: string,
		stepId: string,
		duration: number
	) {
		const analytics = this.getAnalytics(workflowId, sessionId);
		if (!analytics) return;

		analytics.timePerStep[stepId] = duration;
		this.updateAnalytics(workflowId, sessionId, analytics);
	}

	// Track errors
	public trackError(
		workflowId: string,
		sessionId: string,
		stepId: string,
		error: string
	) {
		const analytics = this.getAnalytics(workflowId, sessionId);
		if (!analytics) return;

		analytics.errors++;
		this.updateAnalytics(workflowId, sessionId, analytics);
	}

	// Track hint usage
	public trackHintUsed(
		workflowId: string,
		sessionId: string,
		hintId: string
	) {
		const analytics = this.getAnalytics(workflowId, sessionId);
		if (!analytics) return;

		analytics.hintsUsed++;
		this.updateAnalytics(workflowId, sessionId, analytics);
	}

	// Track step skips
	public trackStepSkip(
		workflowId: string,
		sessionId: string,
		stepId: string
	) {
		const analytics = this.getAnalytics(workflowId, sessionId);
		if (!analytics) return;

		analytics.skips++;
		this.updateAnalytics(workflowId, sessionId, analytics);
	}

	// Get analytics for a specific session
	public getAnalytics(workflowId: string, sessionId: string): Analytics | null {
		const workflowAnalytics = this.analyticsData.get(workflowId);
		return workflowAnalytics?.find(a => a.sessionId === sessionId) || null;
	}

	// Get all analytics for a workflow
	public getWorkflowAnalytics(workflowId: string): Analytics[] {
		return this.analyticsData.get(workflowId) || [];
	}

	// Calculate workflow statistics
	public getWorkflowStats(workflowId: string): WorkflowStats {
		// Check cache first
		if (this.statsCache.has(workflowId)) {
			return this.statsCache.get(workflowId)!;
		}

		const analytics = this.getWorkflowAnalytics(workflowId);
		if (analytics.length === 0) {
			return {
				totalCompletions: 0,
				averageCompletionTime: 0,
				averageSatisfaction: 0,
				stepCompletionRates: {},
				errorRates: {},
				skipRates: {},
			};
		}

		const stats: WorkflowStats = this.calculateStats(analytics);
		this.statsCache.set(workflowId, stats);
		return stats;
	}

	// Calculate statistics from analytics data
	private calculateStats(analytics: Analytics[]): WorkflowStats {
		const completed = analytics.filter(a => a.completed);
		const totalCompletions = completed.length;

		// Average completion time
		const completionTimes = completed.map(a => {
			if (a.startTime && a.endTime) {
				return (a.endTime.getTime() - a.startTime.getTime()) / 1000;
			}
			return 0;
		}).filter(time => time > 0);

		const averageCompletionTime = completionTimes.length > 0
			? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
			: 0;

		// Average satisfaction
		const satisfactionScores = completed
			.map(a => a.satisfaction)
			.filter(s => s > 0);

		const averageSatisfaction = satisfactionScores.length > 0
			? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
			: 0;

		// Step-specific metrics
		const stepMetrics = this.calculateStepMetrics(analytics);

		return {
			totalCompletions,
			averageCompletionTime,
			averageSatisfaction,
			stepCompletionRates: stepMetrics.completionRates,
			errorRates: stepMetrics.errorRates,
			skipRates: stepMetrics.skipRates,
		};
	}

	// Calculate step-specific metrics
	private calculateStepMetrics(analytics: Analytics[]) {
		const completionRates: Record<string, number> = {};
		const errorRates: Record<string, number> = {};
		const skipRates: Record<string, number> = {};

		// Collect all step IDs
		const allStepIds = new Set<string>();
		analytics.forEach(a => {
			Object.keys(a.timePerStep).forEach(stepId => allStepIds.add(stepId));
		});

		// Calculate metrics for each step
		allStepIds.forEach(stepId => {
			const stepAnalytics = analytics.filter(a => a.timePerStep[stepId] !== undefined);

			if (stepAnalytics.length > 0) {
				// Completion rate (percentage of sessions where this step was completed)
				completionRates[stepId] = (stepAnalytics.length / analytics.length) * 100;

				// Error rate (average errors per session for this step)
				const totalErrors = stepAnalytics.reduce((sum, a) => sum + a.errors, 0);
				errorRates[stepId] = totalErrors / stepAnalytics.length;

				// Skip rate (estimated based on completion patterns)
				const skippedCount = analytics.length - stepAnalytics.length;
				skipRates[stepId] = (skippedCount / analytics.length) * 100;
			}
		});

		return {
			completionRates,
			errorRates,
			skipRates,
		};
	}

	// Get user's workflow history
	public getUserWorkflowHistory(): Array<{
		workflowId: string;
		sessionId: string;
		startTime: Date;
		endTime?: Date;
		completed: boolean;
		duration?: number;
	}> {
		const history: Array<any> = [];

		for (const [workflowId, analytics] of this.analyticsData.entries()) {
			analytics.forEach(a => {
				history.push({
					workflowId,
					sessionId: a.sessionId,
					startTime: a.startTime,
					endTime: a.endTime,
					completed: a.completed,
					duration: a.startTime && a.endTime
						? (a.endTime.getTime() - a.startTime.getTime()) / 1000
						: undefined,
				});
			});
		}

		// Sort by start time (most recent first)
		return history.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
	}

	// Get workflow recommendations based on user behavior
	public getWorkflowRecommendations(userHistory: string[]): string[] {
		// Analyze user's completed workflows to suggest related ones
		const recommendations: string[] = [];
		const categories = new Set<string>();

		// Extract categories from completed workflows
		userHistory.forEach(workflowId => {
			const analytics = this.getWorkflowAnalytics(workflowId);
			if (analytics.length > 0) {
				// This would need access to workflow data - for now, just recommend based on patterns
				if (analytics.some(a => a.completed)) {
					categories.add('related'); // Placeholder
				}
			}
		});

		// Return recommendations (placeholder logic)
		if (categories.size > 0) {
			recommendations.push('json-path-queries-workflow', 'code-executor-workflow');
		}

		return recommendations;
	}

	// Export analytics data for external analysis
	public exportAnalytics(): string {
		const data = {
			version: '1.0.0',
			exportDate: new Date().toISOString(),
			analytics: Array.from(this.analyticsData.entries()),
			stats: Array.from(this.statsCache.entries()),
		};

		return JSON.stringify(data, null, 2);
	}

	// Import analytics data
	public importAnalytics(data: string): boolean {
		try {
			const parsed = JSON.parse(data);

			if (parsed.analytics) {
				this.analyticsData = new Map(parsed.analytics);
			}

			if (parsed.stats) {
				this.statsCache = new Map(parsed.stats);
			}

			this.savePersistedData();
			return true;
		} catch (error) {
			console.error('Failed to import analytics:', error);
			return false;
		}
	}

	// Clear all analytics data
	public clearAnalytics(): void {
		this.analyticsData.clear();
		this.statsCache.clear();
		this.savePersistedData();
	}

	// Private helper methods
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private addAnalytics(workflowId: string, analytics: Analytics): void {
		const existing = this.analyticsData.get(workflowId) || [];
		existing.push(analytics);
		this.analyticsData.set(workflowId, existing);
	}

	private updateAnalytics(workflowId: string, sessionId: string, analytics: Analytics): void {
		const workflowAnalytics = this.analyticsData.get(workflowId) || [];
		const index = workflowAnalytics.findIndex(a => a.sessionId === sessionId);

		if (index !== -1) {
			workflowAnalytics[index] = analytics;
		} else {
			workflowAnalytics.push(analytics);
		}

		this.analyticsData.set(workflowId, workflowAnalytics);
	}

	private invalidateStatsCache(workflowId: string): void {
		this.statsCache.delete(workflowId);
	}

	// Cleanup on unmount
	public destroy(): void {
		if (this.flushInterval) {
			clearInterval(this.flushInterval);
		}
		this.flushData();
	}
}

// Export singleton instance
export const workflowAnalytics = WorkflowAnalyticsManager.getInstance();
