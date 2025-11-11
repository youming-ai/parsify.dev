/**
 * User Experience Tracker
 * Tracks user interactions, behavior patterns, and experience quality metrics
 */

import type {
	SatisfactionSurvey,
	SatisfactionContext,
	TaskComplexity,
	UserType,
	DeviceType,
	SatisfactionUpdate,
	SatisfactionEvent
} from '@/types/satisfaction';

export interface UserSession {
	id: string;
	userId?: string;
	startTime: Date;
	endTime?: Date;
	toolId?: string;
	toolCategory?: string;

	// Session metrics
	duration: number;
	pageViews: number;
	interactions: number;
	errors: number;

	// User experience indicators
	frustrationIndicators: FrustrationIndicator[];
	engagementLevel: 'low' | 'medium' | 'high';
	taskCompletion: TaskCompletionData;

	// Behavioral patterns
	behavioralMetrics: BehavioralMetrics;
	context: SatisfactionContext;
}

export interface FrustrationIndicator {
	id: string;
	type: 'error_repetition' | 'rage_click' | 'long_idle_time' | 'navigation_confusion' | 'feature_discovery';
	severity: 'low' | 'medium' | 'high';
	timestamp: Date;
	description: string;
	context: any;
	resolved?: boolean;
	resolutionTime?: number;
}

export interface TaskCompletionData {
	taskId?: string;
	startTime: Date;
	endTime?: Date;
	completed: boolean;
	abandoned: boolean;
	steps: TaskStep[];
	completionTime?: number;
	abandonmentPoint?: string;
	abandonmentReason?: string;
}

export interface TaskStep {
	id: string;
	name: string;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	completed: boolean;
	errors: number;
	helpRequested: boolean;
}

export interface BehavioralMetrics {
	clickFrequency: number;
	scrollDepth: number;
	mouseMovementPattern: MousePattern;
	keyboardUsage: KeyboardUsage;
	timeToFirstAction: number;
	helpSeekingBehavior: HelpSeekingData;
	featureAdoption: FeatureAdoptionData;
	navigationPatterns: NavigationPattern[];
}

export interface MousePattern {
	velocity: number;
	acceleration: number;
	jerkiness: number;
	hesitationCount: number;
	rageClicks: number;
}

export interface KeyboardUsage {
	keystrokesPerMinute: number;
	backspaceUsage: number;
	shortcutsUsed: number;
	typingErrors: number;
}

export interface HelpSeekingData {
	documentationViews: number;
	tutorialViews: number;
	helpButton clicks: number;
	faqAccess: number;
	supportRequests: number;
}

export interface FeatureAdoptionData {
	totalFeatures: number;
	usedFeatures: string[];
	featureDiscoveryTime: Record<string, number>;
	featureUsageFrequency: Record<string, number>;
	advancedFeatureUsage: number;
}

export interface NavigationPattern {
	pattern: string;
	frequency: number;
	successRate: number;
	timeSpent: number;
	exitPoints: string[];
}

export interface ExperienceScore {
	overall: number;
	usability: number;
	performance: number;
	learnability: number;
	effectiveness: number;
	satisfaction: number;
	confidence: number;
	factors: ScoreFactor[];
}

export interface ScoreFactor {
	factor: string;
	weight: number;
	score: number;
	description: string;
}

export class UserExperienceTracker {
	private static instance: UserExperienceTracker;
	private sessions: Map<string, UserSession> = new Map();
	private currentSession: UserSession | null = null;
	private eventBuffer: UserExperienceEvent[] = [];
	private configuration: TrackerConfiguration;
	private observers: MutationObserver[] = [];
	private timers: Map<string, NodeJS.Timeout> = new Map();

	private constructor() {
		this.configuration = this.getDefaultConfiguration();
		this.initializeTracking();
		this.setupEventListeners();
	}

	static getInstance(): UserExperienceTracker {
		if (!UserExperienceTracker.instance) {
			UserExperienceTracker.instance = new UserExperienceTracker();
		}
		return UserExperienceTracker.instance;
	}

	/**
	 * Start tracking a new user session
	 */
	startSession(
		sessionId: string,
		userId?: string,
		toolId?: string,
		toolCategory?: string
	): void {
		// End previous session if exists
		if (this.currentSession) {
			this.endSession();
		}

		// Create new session
		this.currentSession = {
			id: sessionId,
			userId,
			startTime: new Date(),
			toolId,
			toolCategory,
			duration: 0,
			pageViews: 0,
			interactions: 0,
			errors: 0,
			frustrationIndicators: [],
			engagementLevel: 'medium',
			taskCompletion: {
				startTime: new Date(),
				steps: []
			},
			behavioralMetrics: {
				clickFrequency: 0,
				scrollDepth: 0,
				mouseMovementPattern: {
					velocity: 0,
					acceleration: 0,
					jerkiness: 0,
					hesitationCount: 0,
					rageClicks: 0
				},
				keyboardUsage: {
					keystrokesPerMinute: 0,
					backspaceUsage: 0,
					shortcutsUsed: 0,
					typingErrors: 0
				},
				timeToFirstAction: 0,
				helpSeekingBehavior: {
					documentationViews: 0,
					tutorialViews: 0,
					helpButtonClicks: 0,
					faqAccess: 0,
					supportRequests: 0
				},
				featureAdoption: {
					totalFeatures: 0,
					usedFeatures: [],
					featureDiscoveryTime: {},
					featureUsageFrequency: {},
					advancedFeatureUsage: 0
				},
				navigationPatterns: []
			},
			context: this.inferContext()
		};

		this.sessions.set(sessionId, this.currentSession);

		// Start session timers
		this.startSessionTimers(sessionId);

		// Emit session start event
		this.emitEvent({
			type: 'session_started',
			data: { sessionId, userId, toolId }
		});
	}

	/**
	 * End current tracking session
	 */
	endSession(sessionId?: string): UserSession | null {
		const session = sessionId ?
			this.sessions.get(sessionId) :
			this.currentSession;

		if (!session) return null;

		// Calculate final metrics
		session.endTime = new Date();
		session.duration = session.endTime.getTime() - session.startTime.getTime();
		session.engagementLevel = this.calculateEngagementLevel(session);
		session.behavioralMetrics = this.calculateBehavioralMetrics(session);

		// Calculate experience score
		const experienceScore = this.calculateExperienceScore(session);

		// Update satisfaction tracking if session is complete
		if (session.taskCompletion.completed && session.toolId) {
			this.updateSatisfactionFromSession(session, experienceScore);
		}

		// Clear timers
		this.clearSessionTimers(session.id);

		// Emit session end event
		this.emitEvent({
			type: 'session_ended',
			data: {
				sessionId: session.id,
				duration: session.duration,
				experienceScore: experienceScore.overall
			}
		});

		// Clear current session
		if (this.currentSession?.id === session.id) {
			this.currentSession = null;
		}

		return session;
	}

	/**
	 * Track user interaction
	 */
	trackInteraction(type: string, data: any): void {
		if (!this.currentSession) return;

		const interaction: UserInteraction = {
			type,
			timestamp: new Date(),
			data,
			sessionId: this.currentSession.id
		};

		this.currentSession.interactions++;

		// Process specific interaction types
		switch (type) {
			case 'click':
				this.processClick(interaction);
				break;
			case 'error':
				this.processError(interaction);
				break;
			case 'help_request':
				this.processHelpRequest(interaction);
				break;
			case 'feature_use':
				this.processFeatureUse(interaction);
				break;
			case 'navigation':
				this.processNavigation(interaction);
				break;
		}

		// Add to event buffer
		this.eventBuffer.push(interaction);

		// Limit buffer size
		if (this.eventBuffer.length > 1000) {
			this.eventBuffer = this.eventBuffer.slice(-500);
		}
	}

	/**
	 * Track task progress
	 */
	trackTaskProgress(stepName: string, completed: boolean = false): void {
		if (!this.currentSession) return;

		const step: TaskStep = {
			id: `step_${Date.now()}`,
			name: stepName,
			startTime: new Date(),
			completed
		};

		this.currentSession.taskCompletion.steps.push(step);

		if (completed) {
			step.endTime = new Date();
			step.duration = step.endTime.getTime() - step.startTime.getTime();
		}
	}

	/**
	 * Track frustration indicator
	 */
	trackFrustrationIndicator(
		type: FrustrationIndicator['type'],
		severity: FrustrationIndicator['severity'],
		description: string,
		context?: any
	): void {
		if (!this.currentSession) return;

		const indicator: FrustrationIndicator = {
			id: `frustration_${Date.now()}`,
			type,
			severity,
			timestamp: new Date(),
			description,
			context
		};

		this.currentSession.frustrationIndicators.push(indicator);

		// Check if this indicates a satisfaction problem
		if (severity === 'high') {
			this.handleHighSeverityFrustration(indicator);
		}
	}

	/**
	 * Get current session analysis
	 */
	getCurrentSessionAnalysis(): UserSession | null {
		if (!this.currentSession) return null;

		// Update real-time metrics
		this.currentSession.duration = new Date().getTime() - this.currentSession.startTime.getTime();
		this.currentSession.behavioralMetrics = this.calculateBehavioralMetrics(this.currentSession);
		this.currentSession.engagementLevel = this.calculateEngagementLevel(this.currentSession);

		return this.currentSession;
	}

	/**
	 * Get session history
	 */
	getSessionHistory(
		userId?: string,
		toolId?: string,
		limit: number = 50
	): UserSession[] {
		let sessions = Array.from(this.sessions.values());

		if (userId) {
			sessions = sessions.filter(s => s.userId === userId);
		}

		if (toolId) {
			sessions = sessions.filter(s => s.toolId === toolId);
		}

		// Sort by start time (most recent first)
		sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

		return sessions.slice(0, limit);
	}

	/**
	 * Get user experience insights
	 */
	getExperienceInsights(
		userId?: string,
		toolId?: string
	): {
		averageExperienceScore: number;
		satisfactionTrend: 'improving' | 'stable' | 'declining';
		commonFrustrations: FrustrationIndicator[];
		adoptionBarriers: string[];
		recommendations: string[];
	} {
		const sessions = this.getSessionHistory(userId, toolId, 100);

		if (sessions.length === 0) {
			return {
				averageExperienceScore: 0,
				satisfactionTrend: 'stable',
				commonFrustrations: [],
				adoptionBarriers: [],
				recommendations: []
			};
		}

		// Calculate average experience score
		const experienceScores = sessions.map(s => this.calculateExperienceScore(s));
		const averageExperienceScore = experienceScores.reduce((sum, score) => sum + score.overall, 0) / experienceScores.length;

		// Analyze satisfaction trend
		const satisfactionTrend = this.analyzeSatisfactionTrend(experienceScores);

		// Identify common frustrations
		const commonFrustrations = this.identifyCommonFrustrations(sessions);

		// Identify adoption barriers
		const adoptionBarriers = this.identifyAdoptionBarriers(sessions);

		// Generate recommendations
		const recommendations = this.generateExperienceRecommendations(
			sessions,
			commonFrustrations,
			adoptionBarriers
		);

		return {
			averageExperienceScore,
			satisfactionTrend,
			commonFrustrations,
			adoptionBarriers,
			recommendations
		};
	}

	// Private helper methods

	private getDefaultConfiguration(): TrackerConfiguration {
		return {
			trackMouseMovements: true,
			trackKeyboardUsage: true,
			trackScrolling: true,
			trackClicks: true,
			trackErrors: true,
			trackHelpSeeking: true,
			frustrationDetection: true,
			sessionTimeout: 30 * 60 * 1000, // 30 minutes
			idleTimeout: 5 * 60 * 1000, // 5 minutes
			maxEventBuffer: 1000,
			samplingRate: 1.0
		};
	}

	private initializeTracking(): void {
		// Initialize mouse tracking
		if (this.configuration.trackMouseMovements) {
			this.initializeMouseTracking();
		}

		// Initialize keyboard tracking
		if (this.configuration.trackKeyboardUsage) {
			this.initializeKeyboardTracking();
		}

		// Initialize scroll tracking
		if (this.configuration.trackScrolling) {
			this.initializeScrollTracking();
		}

		// Initialize error tracking
		if (this.configuration.trackErrors) {
			this.initializeErrorTracking();
		}
	}

	private setupEventListeners(): void {
		// Listen for page visibility changes
		document.addEventListener('visibilitychange', () => {
			if (document.hidden && this.currentSession) {
				this.handleSessionPause();
			} else if (!document.hidden && this.currentSession) {
				this.handleSessionResume();
			}
		});

		// Listen for page unload
		window.addEventListener('beforeunload', () => {
			if (this.currentSession) {
				this.endSession();
			}
		});

		// Listen for focus/blur
		window.addEventListener('focus', () => {
			if (this.currentSession) {
				this.handleSessionResume();
			}
		});

		window.addEventListener('blur', () => {
			if (this.currentSession) {
				this.handleSessionPause();
			}
		});
	}

	private initializeMouseTracking(): void {
		let lastMoveTime = 0;
		let moveCount = 0;
		let clickCount = 0;
		let lastClickTime = 0;
		let rapidClicks = 0;

		document.addEventListener('mousemove', (event) => {
			if (!this.currentSession) return;

			const now = Date.now();
			if (now - lastMoveTime < 16) return; // Throttle to ~60fps

			lastMoveTime = now;
			moveCount++;

			// Track mouse velocity and patterns
			this.trackMouseMovement(event);
		});

		document.addEventListener('click', (event) => {
			if (!this.currentSession) return;

			const now = Date.now();

			// Check for rage clicks (multiple rapid clicks)
			if (now - lastClickTime < 500) {
				rapidClicks++;
				if (rapidClicks >= 3) {
					this.trackFrustrationIndicator(
						'rage_click',
						'medium',
						'Multiple rapid clicks detected',
						{ target: event.target, clickCount: rapidClicks }
					);
					rapidClicks = 0;
				}
			} else {
				rapidClicks = 1;
			}

			lastClickTime = now;
			clickCount++;

			this.trackInteraction('click', {
				target: event.target,
				position: { x: event.clientX, y: event.clientY },
				timestamp: now
			});
		});
	}

	private initializeKeyboardTracking(): void {
		let keystrokeCount = 0;
		let backspaceCount = 0;
		let lastKeyTime = 0;
		const keystrokeTimes: number[] = [];

		document.addEventListener('keydown', (event) => {
			if (!this.currentSession) return;

			const now = Date.now();
			keystrokeCount++;

			// Track backspace usage (indicator of correction/frustration)
			if (event.key === 'Backspace') {
				backspaceCount++;
			}

			// Track typing speed
			keystrokeTimes.push(now);
			if (keystrokeTimes.length > 60) {
				keystrokeTimes.shift();
			}

			// Check for keyboard shortcuts
			if (event.ctrlKey || event.metaKey) {
				this.currentSession.behavioralMetrics.keyboardUsage.shortcutsUsed++;
			}
		});

		// Calculate typing metrics periodically
		setInterval(() => {
			if (!this.currentSession) return;

			const recentKeystrokes = keystrokeTimes.filter(t => now - t < 60000);
			const keystrokesPerMinute = recentKeystrokes.length;

			this.currentSession.behavioralMetrics.keyboardUsage.keystrokesPerMinute = keystrokesPerMinute;
			this.currentSession.behavioralMetrics.keyboardUsage.backspaceUsage = backspaceCount;
		}, 10000);
	}

	private initializeScrollTracking(): void {
		let maxScrollDepth = 0;
		let scrollStartTime = 0;

		const handleScroll = () => {
			if (!this.currentSession) return;

			const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
			const scrollPosition = window.scrollY;
			const scrollDepth = scrollPosition / scrollHeight;

			maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
			this.currentSession.behavioralMetrics.scrollDepth = maxScrollDepth;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
	}

	private initializeErrorTracking(): void {
		// Track JavaScript errors
		window.addEventListener('error', (event) => {
			if (!this.currentSession) return;

			this.currentSession.errors++;
			this.trackFrustrationIndicator(
				'error_repetition',
				'high',
				`JavaScript error: ${event.message}`,
				{
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					error: event.error
				}
			);

			this.trackInteraction('error', {
				type: 'javascript',
				message: event.message,
				filename: event.filename,
				line: event.lineno
			});
		});

		// Track unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			if (!this.currentSession) return;

			this.currentSession.errors++;
			this.trackFrustrationIndicator(
				'error_repetition',
				'high',
				`Unhandled promise rejection: ${event.reason}`,
				{ reason: event.reason }
			});
		});
	}

	private trackMouseMovement(event: MouseEvent): void {
		if (!this.currentSession) return;

		// Implementation would track velocity, acceleration, hesitation
		// This is simplified for brevity
	}

	private processClick(interaction: UserInteraction): void {
		// Process click interaction
		// Check for hesitation, target accuracy, etc.
	}

	private processError(interaction: UserInteraction): void {
		// Process error interaction
		// Check for error patterns, repetition, etc.
	}

	private processHelpRequest(interaction: UserInteraction): void {
		if (!this.currentSession) return;

		this.currentSession.behavioralMetrics.helpSeekingBehavior.helpButtonClicks++;
	}

	private processFeatureUse(interaction: UserInteraction): void {
		if (!this.currentSession) return;

		const featureName = interaction.data.featureName;
		if (featureName) {
			if (!this.currentSession.behavioralMetrics.featureAdoption.usedFeatures.includes(featureName)) {
				this.currentSession.behavioralMetrics.featureAdoption.usedFeatures.push(featureName);
				this.currentSession.behavioralMetrics.featureAdoption.featureDiscoveryTime[featureName] =
					Date.now() - this.currentSession.startTime.getTime();
			}

			this.currentSession.behavioralMetrics.featureAdoption.featureUsageFrequency[featureName] =
				(this.currentSession.behavioralMetrics.featureAdoption.featureUsageFrequency[featureName] || 0) + 1;
		}
	}

	private processNavigation(interaction: UserInteraction): void {
		// Process navigation interaction
		// Track navigation patterns, efficiency, etc.
	}

	private startSessionTimers(sessionId: string): void {
		// Check for idle timeout
		const idleTimer = setInterval(() => {
			const session = this.sessions.get(sessionId);
			if (session) {
				const timeSinceLastInteraction = Date.now() - (session.endTime?.getTime() || session.startTime.getTime());
				if (timeSinceLastInteraction > this.configuration.idleTimeout) {
					this.trackFrustrationIndicator(
						'long_idle_time',
						'medium',
						'Long period of inactivity detected',
						{ idleDuration: timeSinceLastInteraction }
					);
				}
			}
		}, 60000); // Check every minute

		this.timers.set(`idle_${sessionId}`, idleTimer);
	}

	private clearSessionTimers(sessionId: string): void {
		const timers = Array.from(this.timers.keys()).filter(key => key.includes(sessionId));
		timers.forEach(timerId => {
			const timer = this.timers.get(timerId);
			if (timer) {
				clearInterval(timer);
				this.timers.delete(timerId);
			}
		});
	}

	private handleSessionPause(): void {
		if (this.currentSession) {
			// Track session pause
			this.emitEvent({
				type: 'session_paused',
				data: { sessionId: this.currentSession.id }
			});
		}
	}

	private handleSessionResume(): void {
		if (this.currentSession) {
			// Track session resume
			this.emitEvent({
				type: 'session_resumed',
				data: { sessionId: this.currentSession.id }
			});
		}
	}

	private inferContext(): SatisfactionContext {
		return {
			taskComplexity: 'medium',
			deviceType: this.detectDeviceType(),
			browserType: this.detectBrowserType(),
			timeOfDay: new Date().toLocaleTimeString(),
			sessionDuration: 0,
			previousUsageCount: 0,
			isFirstTimeUser: false,
			userType: 'intermediate',
			toolVersion: '1.0.0',
			interfaceLanguage: navigator.language || 'en'
		};
	}

	private detectDeviceType(): DeviceType {
		const width = window.innerWidth;
		if (width < 768) return 'mobile';
		if (width < 1024) return 'tablet';
		return 'desktop';
	}

	private detectBrowserType(): string {
		const ua = navigator.userAgent;
		if (ua.includes('Chrome')) return 'chrome';
		if (ua.includes('Firefox')) return 'firefox';
		if (ua.includes('Safari')) return 'safari';
		if (ua.includes('Edge')) return 'edge';
		return 'other';
	}

	private calculateEngagementLevel(session: UserSession): 'low' | 'medium' | 'high' {
		const interactionRate = session.interactions / (session.duration / 60000); // interactions per minute
		const frustrationScore = session.frustrationIndicators.reduce((sum, indicator) => {
			return sum + (indicator.severity === 'high' ? 3 : indicator.severity === 'medium' ? 2 : 1);
		}, 0);

		if (interactionRate > 10 && frustrationScore < 3) return 'high';
		if (interactionRate > 3 && frustrationScore < 6) return 'medium';
		return 'low';
	}

	private calculateBehavioralMetrics(session: UserSession): BehavioralMetrics {
		// Calculate comprehensive behavioral metrics
		// This is simplified - full implementation would analyze all interaction data
		return session.behavioralMetrics;
	}

	private calculateExperienceScore(session: UserSession): ExperienceScore {
		// Calculate overall experience score based on various factors
		const factors: ScoreFactor[] = [];

		// Task completion factor
		const completionScore = session.taskCompletion.completed ? 1.0 : 0.3;
		factors.push({
			factor: 'task_completion',
			weight: 0.3,
			score: completionScore,
			description: 'Task completion success rate'
		});

		// Frustration factor
		const frustrationScore = Math.max(0, 1.0 - (session.frustrationIndicators.length * 0.1));
		factors.push({
			factor: 'frustration_level',
			weight: 0.2,
			score: frustrationScore,
			description: 'Absence of frustration indicators'
		});

		// Engagement factor
		const engagementScore = session.engagementLevel === 'high' ? 1.0 :
								session.engagementLevel === 'medium' ? 0.7 : 0.4;
		factors.push({
			factor: 'engagement_level',
			weight: 0.2,
			score: engagementScore,
			description: 'User engagement during session'
		});

		// Error factor
		const errorScore = Math.max(0, 1.0 - (session.errors * 0.2));
		factors.push({
			factor: 'error_rate',
			weight: 0.15,
			score: errorScore,
			description: 'Low error rate during session'
		});

		// Help seeking factor
		const helpScore = Math.max(0, 1.0 - (session.behavioralMetrics.helpSeekingBehavior.helpButtonClicks * 0.1));
		factors.push({
			factor: 'help_seeking',
			weight: 0.15,
			score: helpScore,
			description: 'Minimal help seeking indicates intuitiveness'
		});

		// Calculate weighted scores
		const overall = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
		const usability = (completionScore + frustrationScore + helpScore) / 3;
		const performance = errorScore;
		const learnability = 1.0 - (session.behavioralMetrics.helpSeekingBehavior.helpButtonClicks * 0.1);
		const effectiveness = completionScore;
		const satisfaction = (completionScore + frustrationScore + engagementScore) / 3;
		const confidence = Math.min(1.0, session.duration / 60000); // Confidence increases with session duration

		return {
			overall,
			usability,
			performance,
			learnability,
			effectiveness,
			satisfaction,
			confidence,
			factors
		};
	}

	private updateSatisfactionFromSession(session: UserSession, experienceScore: ExperienceScore): void {
		// Convert experience score to satisfaction update
		const satisfactionScore = Math.round(experienceScore.satisfaction * 5) as 1 | 2 | 3 | 4 | 5;

		const update: SatisfactionUpdate = {
			overallSatisfaction: satisfactionScore,
			easeOfUse: Math.round(experienceScore.usability * 5) as 1 | 2 | 3 | 4 | 5,
			performance: Math.round(experienceScore.performance * 5) as 1 | 2 | 3 | 4 | 5,
			achievedGoal: session.taskCompletion.completed,
			timestamp: new Date(),
			source: 'behavior'
		};

		// Update satisfaction tracking system
		this.emitEvent({
			type: 'satisfaction_updated',
			data: { toolId: session.toolId || '', update }
		});
	}

	private handleHighSeverityFrustration(indicator: FrustrationIndicator): void {
		// Handle high severity frustration indicators
		// Could trigger intervention, help offers, etc.
	}

	private analyzeSatisfactionTrend(scores: ExperienceScore[]): 'improving' | 'stable' | 'declining' {
		if (scores.length < 3) return 'stable';

		const recent = scores.slice(-5);
		const older = scores.slice(-10, -5);

		const recentAvg = recent.reduce((sum, score) => sum + score.overall, 0) / recent.length;
		const olderAvg = older.length > 0 ? older.reduce((sum, score) => sum + score.overall, 0) / older.length : recentAvg;

		const change = recentAvg - olderAvg;
		if (change > 0.1) return 'improving';
		if (change < -0.1) return 'declining';
		return 'stable';
	}

	private identifyCommonFrustrations(sessions: UserSession[]): FrustrationIndicator[] {
		const frustrationMap = new Map<string, { count: number; totalSeverity: number; examples: FrustrationIndicator[] }>();

		sessions.forEach(session => {
			session.frustrationIndicators.forEach(indicator => {
				const key = indicator.type;
				if (!frustrationMap.has(key)) {
					frustrationMap.set(key, { count: 0, totalSeverity: 0, examples: [] });
				}
				const data = frustrationMap.get(key)!;
				data.count++;
				data.totalSeverity += indicator.severity === 'high' ? 3 : indicator.severity === 'medium' ? 2 : 1;
				if (data.examples.length < 3) {
					data.examples.push(indicator);
				}
			});
		});

		// Convert to array and sort by frequency
		const commonFrustrations = Array.from(frustrationMap.entries())
			.map(([type, data]) => ({
				id: `common_${type}`,
				type: type as FrustrationIndicator['type'],
				severity: (data.totalSeverity / data.count > 2) ? 'high' :
						  (data.totalSeverity / data.count > 1) ? 'medium' : 'low',
				timestamp: new Date(),
				description: `Occurs in ${data.count} sessions with average severity ${(data.totalSeverity / data.count).toFixed(1)}`,
				context: { frequency: data.count, examples: data.examples }
			}))
			.sort((a, b) => b.context.frequency - a.context.frequency)
			.slice(0, 5);

		return commonFrustrations;
	}

	private identifyAdoptionBarriers(sessions: UserSession[]): string[] {
		const barriers: string[] = [];

		// Analyze abandonment points
		const abandonmentPoints = sessions
			.filter(s => !s.taskCompletion.completed)
			.map(s => s.taskCompletion.abandonmentPoint)
			.filter(Boolean);

		if (abandonmentPoints.length > 0) {
			barriers.push(`High abandonment at: ${abandonmentPoints[0]}`);
		}

		// Analyze help seeking patterns
		const highHelpSeeking = sessions.filter(s =>
			s.behavioralMetrics.helpSeekingBehavior.helpButtonClicks > 3
		);

		if (highHelpSeeking.length > sessions.length * 0.3) {
			barriers.push('Users frequently need help - interface may not be intuitive');
		}

		// Analyze error patterns
		const highErrorSessions = sessions.filter(s => s.errors > 2);
		if (highErrorSessions.length > sessions.length * 0.2) {
			barriers.push('Technical errors are preventing task completion');
		}

		return barriers;
	}

	private generateExperienceRecommendations(
		sessions: UserSession[],
		frustrations: FrustrationIndicator[],
		barriers: string[]
	): string[] {
		const recommendations: string[] = [];

		frustrations.forEach(frustration => {
			switch (frustration.type) {
				case 'error_repetition':
					recommendations.push('Improve error handling and provide clearer error messages');
					break;
				case 'rage_click':
					recommendations.push('Review UI responsiveness and click targets');
					break;
				case 'long_idle_time':
					recommendations.push('Add progress indicators and improve task flow clarity');
					break;
				case 'navigation_confusion':
					recommendations.push('Simplify navigation and improve information architecture');
					break;
				case 'feature_discovery':
					recommendations.push('Improve feature discoverability through better UI design and onboarding');
					break;
			}
		});

		barriers.forEach(barrier => {
			recommendations.push(`Address barrier: ${barrier}`);
		});

		return Array.from(new Set(recommendations)).slice(0, 5); // Remove duplicates and limit to 5
	}

	private emitEvent(event: SatisfactionEvent): void {
		// Emit event to satisfaction tracking system
		// Implementation would integrate with feedback collection system
	}
}

// Type definitions
interface TrackerConfiguration {
	trackMouseMovements: boolean;
	trackKeyboardUsage: boolean;
	trackScrolling: boolean;
	trackClicks: boolean;
	trackErrors: boolean;
	trackHelpSeeking: boolean;
	frustrationDetection: boolean;
	sessionTimeout: number;
	idleTimeout: number;
	maxEventBuffer: number;
	samplingRate: number;
}

interface UserExperienceEvent {
	type: string;
	timestamp: Date;
	data: any;
}

interface UserInteraction {
	type: string;
	timestamp: Date;
	data: any;
	sessionId: string;
}

// Export singleton instance
export const userExperienceTracker = UserExperienceTracker.getInstance();
