import type {
	OnboardingAnalytics,
	OnboardingEvent,
	FunnelData,
	EngagementMetrics,
	EventType
} from '@/types/onboarding';

export class OnboardingAnalyticsManager {
	private static instance: OnboardingAnalyticsManager;
	private events: OnboardingEvent[] = [];
	private sessionId: string;
	private userId?: string;
	private startTime: Date;

	private constructor() {
		this.sessionId = this.generateSessionId();
		this.startTime = new Date();
		this.loadPersistedEvents();
	}

	public static getInstance(): OnboardingAnalyticsManager {
		if (!OnboardingAnalyticsManager.instance) {
			OnboardingAnalyticsManager.instance = new OnboardingAnalyticsManager();
		}
		return OnboardingAnalyticsManager.instance;
	}

	// Session Management
	public setUserId(userId: string): void {
		this.userId = userId;
	}

	public startNewSession(): void {
		this.sessionId = this.generateSessionId();
		this.startTime = new Date();
		this.events = [];
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Event Tracking
	public trackEvent(eventType: EventType, data?: any, stepId?: string): void {
		const event: OnboardingEvent = {
			type: eventType,
			timestamp: new Date(),
			sessionId: this.sessionId,
			userId: this.userId,
			stepId,
			data
		};

		this.events.push(event);
		this.persistEvents();

		// Send to analytics service (in production)
		this.sendToAnalyticsService(event);
	}

	// Analytics Calculation
	public calculateAnalytics(): OnboardingAnalytics {
		const funnelData = this.calculateFunnelData();
		const engagementMetrics = this.calculateEngagementMetrics();
		const completionRate = this.calculateCompletionRate();
		const timeToComplete = this.calculateAverageTimeToComplete();
		const dropOffPoints = this.calculateDropOffPoints();

		return {
			sessionId: this.sessionId,
			events: [...this.events],
			funnelData,
			engagementMetrics,
			completionRate,
			timeToComplete,
			dropOffPoints
		};
	}

	private calculateFunnelData(): FunnelData {
		const stepEvents = this.events.filter(event =>
			event.type === 'step_started' || event.type === 'step_completed' || event.type === 'step_skipped'
		);

		const uniqueSteps = new Set(stepEvents.map(e => e.stepId));
		const totalStarted = uniqueSteps.size;

		const stepCompletions: Record<string, number> = {};
		const averageTimePerStep: Record<string, number> = {};
		const dropOffReasons: Record<string, number> = {};

		// Calculate completions per step
		uniqueSteps.forEach(stepId => {
			const completions = stepEvents.filter(e =>
				e.stepId === stepId && e.type === 'step_completed'
			).length;

			stepCompletions[stepId] = completions;

			// Calculate average time per step
			const stepStartEvents = stepEvents.filter(e =>
				e.stepId === stepId && e.type === 'step_started'
			);
			const stepCompleteEvents = stepEvents.filter(e =>
				e.stepId === stepId && e.type === 'step_completed'
			);

			if (stepStartEvents.length > 0 && stepCompleteEvents.length > 0) {
				const totalTime = stepCompleteEvents.reduce((sum, complete) => {
					const start = stepStartEvents.find(s =>
						s.timestamp < complete.timestamp &&
						(!stepStartEvents.find(other =>
							other.timestamp > s.timestamp && other.timestamp < complete.timestamp
						))
					);
					return start ? sum + (complete.timestamp.getTime() - start.timestamp.getTime()) : sum;
				}, 0);

				averageTimePerStep[stepId] = totalTime / stepCompleteEvents.length;
			}
		});

		// Calculate drop-off reasons
		const skipEvents = this.events.filter(e => e.type === 'step_skipped');
		skipEvents.forEach(event => {
			const reason = event.data?.reason || 'unknown';
			dropOffReasons[reason] = (dropOffReasons[reason] || 0) + 1;
		});

		const completedSteps = Object.values(stepCompletions).reduce((sum, count) => sum + count, 0);
		const completionRate = totalStarted > 0 ? (completedSteps / totalStarted) * 100 : 0;

		return {
			totalStarted,
			stepCompletions,
			completionRate,
			averageTimePerStep,
			dropOffReasons
		};
	}

	private calculateEngagementMetrics(): EngagementMetrics {
		const totalDuration = Date.now() - this.startTime.getTime();
		const totalMinutes = totalDuration / (1000 * 60);

		// Calculate interactions per minute
		const interactionEvents = this.events.filter(event =>
			event.type === 'tool_opened' ||
			event.type === 'category_explored' ||
			event.type === 'preference_selected'
		);
		const interactionsPerMinute = totalMinutes > 0 ? interactionEvents.length / totalMinutes : 0;

		// Calculate feature discovery rate
		const uniqueFeatures = new Set();
		this.events.forEach(event => {
			if (event.data?.feature) {
				uniqueFeatures.add(event.data.feature);
			}
		});
		const totalFeatures = 10; // This should be dynamically calculated
		const featureDiscoveryRate = (uniqueFeatures.size / totalFeatures) * 100;

		// Calculate tool adoption rate
		const toolEvents = this.events.filter(event => event.type === 'tool_opened');
		const uniqueTools = new Set(toolEvents.map(e => e.data?.toolId));
		const totalTools = 58; // Total number of tools available
		const toolAdoptionRate = (uniqueTools.size / totalTools) * 100;

		// User satisfaction (placeholder - would need explicit feedback)
		const userSatisfactionScore = this.calculateSatisfactionScore();

		// Retention rate (placeholder - would need return visits)
		const retentionRate = 85; // Example value

		return {
			interactionsPerMinute,
			featureDiscoveryRate,
			toolAdoptionRate,
			userSatisfactionScore,
			retentionRate
		};
	}

	private calculateCompletionRate(): number {
		const completionEvents = this.events.filter(e => e.type === 'onboarding_completed');
		const startEvents = this.events.filter(e => e.type === 'step_started' && e.stepId === 'welcome');

		return startEvents.length > 0 ? (completionEvents.length / startEvents.length) * 100 : 0;
	}

	private calculateAverageTimeToComplete(): number {
		const completionEvents = this.events.filter(e => e.type === 'onboarding_completed');
		const startEvents = this.events.filter(e => e.type === 'step_started' && e.stepId === 'welcome');

		if (completionEvents.length === 0 || startEvents.length === 0) return 0;

		const totalTimes = completionEvents.map(completion => {
			const start = startEvents.find(s => s.sessionId === completion.sessionId);
			return start ? completion.timestamp.getTime() - start.timestamp.getTime() : 0;
		});

		return totalTimes.reduce((sum, time) => sum + time, 0) / completionEvents.length;
	}

	private calculateDropOffPoints(): string[] {
		const stepSequence = this.events
			.filter(e => e.type === 'step_started' || e.type === 'step_completed')
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		const dropOffPoints: string[] = [];

		for (let i = 0; i < stepSequence.length - 1; i++) {
			const current = stepSequence[i];
			const next = stepSequence[i + 1];

			if (current.type === 'step_started' && next.type === 'step_started' && current.stepId !== next.stepId) {
				// User started a new step without completing the previous one
				dropOffPoints.push(current.stepId!);
			}
		}

		// Check for abandonment at the end
		const lastEvent = stepSequence[stepSequence.length - 1];
		if (lastEvent && lastEvent.type === 'step_started') {
			dropOffPoints.push(lastEvent.stepId!);
		}

		return [...new Set(dropOffPoints)];
	}

	private calculateSatisfactionScore(): number | undefined {
		// This would typically come from explicit user feedback
		// For now, we can infer satisfaction from behavior patterns

		const completionRate = this.calculateCompletionRate();
		const timeSpent = Date.now() - this.startTime.getTime();
		const skippedSteps = this.events.filter(e => e.type === 'step_skipped').length;

		// Simple heuristic-based satisfaction score
		let score = 50; // Base score

		// Reward completion
		score += (completionRate / 100) * 30;

		// Reward reasonable time spent (not too fast, not too slow)
		const timeInMinutes = timeSpent / (1000 * 60);
		if (timeInMinutes >= 5 && timeInMinutes <= 20) {
			score += 10;
		}

		// Penalize excessive skipping
		score -= Math.min(skippedSteps * 5, 20);

		return Math.max(0, Math.min(100, score));
	}

	// Reporting
	public generateReport(): string {
		const analytics = this.calculateAnalytics();

		const report = `
=== Onboarding Analytics Report ===
Session ID: ${analytics.sessionId}
Generated: ${new Date().toISOString()}

=== Summary ===
Completion Rate: ${analytics.completionRate.toFixed(1)}%
Average Time to Complete: ${(analytics.timeToComplete / 1000 / 60).toFixed(1)} minutes
Total Events Tracked: ${analytics.events.length}

=== Funnel Analysis ===
Total Steps Started: ${analytics.funnelData.totalStarted}
Step Completion Rate: ${analytics.funnelData.completionRate.toFixed(1)}%

Drop-off Reasons:
${Object.entries(analytics.funnelData.dropOffReasons)
  .map(([reason, count]) => `- ${reason}: ${count}`)
  .join('\\n')}

=== Engagement Metrics ===
Interactions per Minute: ${analytics.engagementMetrics.interactionsPerMinute.toFixed(2)}
Feature Discovery Rate: ${analytics.engagementMetrics.featureDiscoveryRate.toFixed(1)}%
Tool Adoption Rate: ${analytics.engagementMetrics.toolAdoptionRate.toFixed(1)}%
User Satisfaction Score: ${analytics.engagementMetrics.userSatisfactionScore?.toFixed(1) || 'N/A'}

=== Key Drop-off Points ===
${analytics.dropOffPoints.length > 0
  ? analytics.dropOffPoints.map(point => `- ${point}`).join('\\n')
  : 'No significant drop-off points detected'}

=== Recommendations ===
${this.generateRecommendations(analytics)}
		`;

		return report.trim();
	}

	private generateRecommendations(analytics: OnboardingAnalytics): string {
		const recommendations: string[] = [];

		// Completion rate recommendations
		if (analytics.completionRate < 70) {
			recommendations.push('• Consider simplifying onboarding steps to improve completion rate');
		}

		// Time to complete recommendations
		const avgMinutes = analytics.timeToComplete / 1000 / 60;
		if (avgMinutes > 15) {
			recommendations.push('• Onboarding may be too long. Consider breaking it into smaller sessions');
		} else if (avgMinutes < 5) {
			recommendations.push('• Users are completing very quickly. Ensure they understand all features');
		}

		// Engagement recommendations
		if (analytics.engagementMetrics.interactionsPerMinute < 1) {
			recommendations.push('• Low interaction rate. Consider adding more engaging elements');
		}

		if (analytics.engagementMetrics.featureDiscoveryRate < 50) {
			recommendations.push('• Many features are being missed. Improve feature highlighting');
		}

		// Drop-off recommendations
		if (analytics.dropOffPoints.length > 2) {
			recommendations.push('• Multiple drop-off points detected. Review problematic steps');
		}

		// Satisfaction recommendations
		if (analytics.engagementMetrics.userSatisfactionScore && analytics.engagementMetrics.userSatisfactionScore < 70) {
			recommendations.push('• Low satisfaction score. Collect more feedback for improvement');
		}

		return recommendations.length > 0 ? recommendations.join('\\n') : '• Onboarding is performing well. Continue monitoring metrics.';
	}

	// Data Persistence
	private persistEvents(): void {
		try {
			const data = {
				sessionId: this.sessionId,
				events: this.events.slice(-100), // Keep last 100 events
				timestamp: new Date().toISOString()
			};
			localStorage.setItem('onboarding_analytics', JSON.stringify(data));
		} catch (error) {
			console.warn('Failed to persist analytics data:', error);
		}
	}

	private loadPersistedEvents(): void {
		try {
			const data = localStorage.getItem('onboarding_analytics');
			if (data) {
				const parsed = JSON.parse(data);
				if (parsed.events && Array.isArray(parsed.events)) {
					this.events = parsed.events;
				}
			}
		} catch (error) {
			console.warn('Failed to load analytics data:', error);
		}
	}

	// External Analytics Service Integration
	private sendToAnalyticsService(event: OnboardingEvent): void {
		// In production, this would send to your analytics service
		// For now, we'll just log to console in development
		if (process.env.NODE_ENV === 'development') {
			console.log('Onboarding Analytics Event:', event);
		}

		// Example of how to send to an external service:
		// fetch('/api/analytics/onboarding', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(event)
		// }).catch(err => console.warn('Failed to send analytics:', err));
	}

	// Export Data
	public exportData(): string {
		const analytics = this.calculateAnalytics();
		return JSON.stringify(analytics, null, 2);
	}

	public reset(): void {
		this.events = [];
		this.sessionId = this.generateSessionId();
		this.startTime = new Date();
		localStorage.removeItem('onboarding_analytics');
	}
}

// Convenience hooks and utilities
export function useOnboardingAnalytics() {
	const analyticsManager = OnboardingAnalyticsManager.getInstance();

	return {
		trackEvent: analyticsManager.trackEvent.bind(analyticsManager),
		getAnalytics: analyticsManager.calculateAnalytics.bind(analyticsManager),
		generateReport: analyticsManager.generateReport.bind(analyticsManager),
		exportData: analyticsManager.exportData.bind(analyticsManager),
		setUserId: analyticsManager.setUserId.bind(analyticsManager),
		startNewSession: analyticsManager.startNewSession.bind(analyticsManager),
		reset: analyticsManager.reset.bind(analyticsManager)
	};
}

// Higher-order component for automatic event tracking
export function withOnboardingTracking<P extends object>(
	WrappedComponent: React.ComponentType<P>,
	componentName: string
) {
	return function TrackedComponent(props: P) {
		const analytics = useOnboardingAnalytics();

		React.useEffect(() => {
			analytics.trackEvent('component_viewed', { component: componentName });
		}, []);

		return <WrappedComponent {...props} />;
	};
}

export default OnboardingAnalyticsManager;
