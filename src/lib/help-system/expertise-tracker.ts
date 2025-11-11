/**
 * User Expertise Tracking and Progressive Disclosure System
 * Tracks user behavior, calculates expertise levels, and manages progressive help disclosure
 */

import type {
	UserHelpProfile,
	ToolUsageStats,
	HelpInteraction,
	UserExpertiseLevel,
	UserPreferences,
	HelpContent
} from '@/types/help-system';

export interface ExpertiseMetrics {
	overallLevel: UserExpertiseLevel;
	toolExpertise: Record<string, UserExpertiseLevel>;
	categoryExpertise: Record<string, UserExpertiseLevel>;
	confidenceScore: number;
	learningCurve: LearningCurvePoint[];
	predictedNextLevel: UserExpertiseLevel;
	timeToNextLevel: number; // in days
}

export interface LearningCurvePoint {
	date: Date;
	overallScore: number;
	specificTools: Record<string, number>;
	milestones: string[];
}

export interface ProgressionRule {
	id: string;
	name: string;
	description: string;
	condition: ProgressionCondition;
	action: ProgressionAction;
	priority: number;
}

export interface ProgressionCondition {
	type: 'usage' | 'success-rate' | 'time-spent' | 'feature-discovery' | 'error-recovery' | 'combination';
	operator: 'equals' | 'greater-than' | 'less-than' | 'average' | 'minimum';
	threshold: number;
	timeframe?: number; // in days
	toolIds?: string[];
	categories?: string[];
	features?: string[];
}

export interface ProgressionAction {
	type: 'promote' | 'reveal-content' | 'hide-content' | 'suggest-feature' | 'unlock-tour' | 'update-preferences';
	target: string;
	parameters?: Record<string, any>;
}

export interface ProgressiveDisclosureConfig {
	enabled: boolean;
	rules: ProgressionRule[];
	contentFilters: ContentFilter[];
	timing: TimingConfig;
	personalization: PersonalizationConfig;
}

export interface ContentFilter {
	audience: UserExpertiseLevel[];
	categories: string[];
	priorityThreshold: number;
	maxContentPerSession: number;
	cooldownPeriod: number; // in hours
}

export interface TimingConfig {
	minimumTimeBetweenHelp: number; // in minutes
	maximumHelpPerSession: number;
	sessionHelpLimit: number;
	quietHours: { start: number; end: number }; // 24-hour format
}

export interface PersonalizationConfig {
	adaptToUserSpeed: boolean;
	considerUserPreferences: boolean;
	favoriteToolBoost: boolean;
	recentActivityWeight: number;
	historicalWeight: number;
}

export class ExpertiseTracker {
	private static instance: ExpertiseTracker;
	private profiles: Map<string, UserHelpProfile> = new Map();
	private progressionRules: ProgressionRule[] = [];
	private disclosureConfig: ProgressiveDisclosureConfig;
	private expertiseCache: Map<string, ExpertiseMetrics> = new Map();
	private updateQueue: ProfileUpdate[] = [];

	private constructor() {
		this.disclosureConfig = this.initializeDefaultConfig();
		this.progressionRules = this.initializeDefaultRules();
	}

	static getInstance(): ExpertiseTracker {
		if (!ExpertiseTracker.instance) {
			ExpertiseTracker.instance = new ExpertiseTracker();
		}
		return ExpertiseTracker.instance;
	}

	/**
	 * Get or create user profile
	 */
	getProfile(userId: string): UserHelpProfile {
		let profile = this.profiles.get(userId);
		if (!profile) {
			profile = this.createDefaultProfile(userId);
			this.profiles.set(userId, profile);
		}
		return profile;
	}

	/**
	 * Update user profile with new interaction
	 */
	async updateProfile(
		userId: string,
		interaction: HelpInteraction,
		toolInfo?: ToolInfo
	): Promise<void> {
		const profile = this.getProfile(userId);

		// Add interaction to history
		profile.helpInteractions.push(interaction);

		// Update tool usage stats
		if (toolInfo && interaction.contextId.includes('tool-page')) {
			this.updateToolUsage(profile, toolInfo, interaction);
		}

		// Update session info
		profile.lastActive = new Date();

		// Queue for batch processing
		this.updateQueue.push({
			userId,
			type: 'interaction',
			data: { interaction, toolInfo },
		});

		// Process updates
		await this.processUpdates();
	}

	/**
	 * Calculate user expertise metrics
	 */
	calculateExpertise(userId: string): ExpertiseMetrics {
		const cached = this.expertiseCache.get(userId);
		if (cached && !this.isCacheExpired(cached)) {
			return cached;
		}

		const profile = this.getProfile(userId);
		const metrics = this.computeExpertiseMetrics(profile);

		this.expertiseCache.set(userId, metrics);
		return metrics;
	}

	/**
	 * Get progressive disclosure recommendations
	 */
	getProgressiveRecommendations(
		userId: string,
		availableHelp: HelpContent[],
		currentContext: any
	): ProgressiveRecommendation[] {
		const profile = this.getProfile(userId);
		const metrics = this.calculateExpertise(userId);
		const recommendations: ProgressiveRecommendation[] = [];

		// Apply content filters based on expertise
		const filteredHelp = this.applyContentFilters(availableHelp, metrics, profile);

		// Check progression rules
		const triggeredRules = this.evaluateProgressionRules(profile, metrics);

		// Generate recommendations
		for (const rule of triggeredRules) {
			const recommendation = this.createRecommendation(rule, filteredHelp, currentContext);
			if (recommendation) {
				recommendations.push(recommendation);
			}
		}

		// Sort by priority and relevance
		return recommendations.sort((a, b) => {
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			}
			return b.relevanceScore - a.relevanceScore;
		});
	}

	/**
	 * Check if user should see specific help content
	 */
	shouldShowContent(
		userId: string,
		content: HelpContent,
		context: any
	): boolean {
		const profile = this.getProfile(userId);
		const metrics = this.calculateExpertise(userId);

		// Check if user meets audience requirements
		if (!this.matchesAudience(content.targetAudience, metrics.overallLevel)) {
			// Allow some overlap for progressive learning
			if (!this.isProgressiveAppropriate(content, metrics)) {
				return false;
			}
		}

		// Check if content has been recently viewed
		if (this.isRecentlyViewed(content.id, profile)) {
			return false;
		}

		// Check if user has dismissed this content
		if (profile.skippedHelp.has(content.id)) {
			return this.shouldShowAgain(content, profile);
		}

		// Check timing constraints
		if (!this.checkTimingConstraints(profile)) {
			return false;
		}

		// Check session limits
		if (!this.checkSessionLimits(profile)) {
			return false;
		}

		return true;
	}

	/**
	 * Update user preferences
	 */
	updatePreferences(userId: string, preferences: Partial<UserPreferences>): void {
		const profile = this.getProfile(userId);
		profile.preferences = { ...profile.preferences, ...preferences };
		this.profiles.set(userId, profile);
	}

	/**
	 * Get user learning insights
	 */
	getLearningInsights(userId: string): LearningInsights {
		const profile = this.getProfile(userId);
		const metrics = this.calculateExpertise(userId);

		return {
			currentLevel: metrics.overallLevel,
			strengths: this.identifyStrengths(profile),
			areasForImprovement: this.identifyImprovements(profile),
			suggestedNextSteps: this.suggestNextSteps(metrics),
			progressMilestones: this.getMilestones(profile),
			usagePatterns: this.analyzeUsagePatterns(profile),
			preferredLearningStyle: this.inferLearningStyle(profile),
		};
	}

	// Private methods

	private createDefaultProfile(userId: string): UserHelpProfile {
		return {
			id: userId,
			expertiseLevel: 'beginner',
			toolUsage: {},
			helpInteractions: [],
			preferences: {
				enableTooltips: true,
				enableModals: true,
				enableGuidedTours: true,
				enableAutoTrigger: true,
				expertiseLevel: 'beginner',
				preferredDeliveryMethod: 'tooltip',
				theme: 'system',
				language: 'en',
				showAdvancedHelp: false,
				notificationFrequency: 'weekly',
			},
			lastActive: new Date(),
			sessionCount: 1,
			totalTimeSpent: 0,
			completedTours: [],
			skippedHelp: new Set(),
			bookmarkedHelp: new Set(),
		};
	}

	private updateToolUsage(profile: UserHelpProfile, toolInfo: ToolInfo, interaction: HelpInteraction): void {
		const toolId = toolInfo.id;
		const existing = profile.toolUsage[toolId] || this.createDefaultToolStats(toolId);

		// Update usage count
		existing.usageCount += 1;

		// Update time spent
		if (interaction.duration) {
			existing.totalTimeSpent += interaction.duration;
		}

		// Update success rate (based on interaction action)
		const isSuccess = interaction.action === 'completed';
		const totalInteractions = existing.usageCount;
		const successCount = Math.round(existing.successRate * (totalInteractions - 1) / 100) + (isSuccess ? 1 : 0);
		existing.successRate = Math.round((successCount / totalInteractions) * 100);

		// Update features used
		if (toolInfo.features) {
			toolInfo.features.forEach(feature => {
				if (!existing.featuresUsed.includes(feature)) {
					existing.featuresUsed.push(feature);
				}
			});
		}

		// Update timestamps
		existing.lastUsed = new Date();
		if (!existing.firstUsed) {
			existing.firstUsed = new Date();
		}

		profile.toolUsage[toolId] = existing;
	}

	private computeExpertiseMetrics(profile: UserHelpProfile): ExpertiseMetrics {
		const toolStats = Object.values(profile.toolUsage);

		// Calculate overall expertise score
		const overallScore = this.calculateOverallScore(profile, toolStats);
		const overallLevel = this.scoreToLevel(overallScore);

		// Calculate tool-specific expertise
		const toolExpertise: Record<string, UserExpertiseLevel> = {};
		Object.entries(profile.toolUsage).forEach(([toolId, stats]) => {
			const score = this.calculateToolScore(stats);
			toolExpertise[toolId] = this.scoreToLevel(score);
		});

		// Calculate category expertise
		const categoryExpertise = this.calculateCategoryExpertise(profile);

		// Calculate confidence score
		const confidenceScore = this.calculateConfidenceScore(profile, overallScore);

		// Generate learning curve
		const learningCurve = this.generateLearningCurve(profile);

		// Predict next level
		const predictedNextLevel = this.predictNextLevel(overallLevel, overallScore);
		const timeToNextLevel = this.estimateTimeToNextLevel(overallScore, this.scoreToThreshold(predictedNextLevel));

		return {
			overallLevel,
			toolExpertise,
			categoryExpertise,
			confidenceScore,
			learningCurve,
			predictedNextLevel,
			timeToNextLevel,
		};
	}

	private calculateOverallScore(profile: UserHelpProfile, toolStats: ToolUsageStats[]): number {
		if (toolStats.length === 0) return 0;

		const totalUsage = toolStats.reduce((sum, stats) => sum + stats.usageCount, 0);
		const avgSuccessRate = toolStats.reduce((sum, stats) => sum + stats.successRate, 0) / toolStats.length;
		const totalTime = toolStats.reduce((sum, stats) => sum + stats.totalTimeSpent, 0);
		const uniqueTools = toolStats.filter(stats => stats.usageCount > 0).length;
		const featuresPerTool = toolStats.reduce((sum, stats) => sum + stats.featuresUsed.length, 0) / Math.max(uniqueTools, 1);

		// Weighted scoring
		let score = 0;
		score += Math.min(totalUsage / 100, 30); // Max 30 points for usage
		score += (avgSuccessRate / 100) * 25; // Max 25 points for success rate
		score += Math.min(totalTime / (60 * 60 * 1000), 20); // Max 20 points for time spent (1 hour = 20 points)
		score += Math.min(uniqueTools / 20, 15); // Max 15 points for tool diversity
		score += Math.min(featuresPerTool / 5, 10); // Max 10 points for feature discovery

		return Math.round(score);
	}

	private calculateToolScore(stats: ToolUsageStats): number {
		let score = 0;
		score += Math.min(stats.usageCount / 20, 40); // Max 40 points for usage
		score += (stats.successRate / 100) * 30; // Max 30 points for success rate
		score += Math.min(stats.totalTimeSpent / (30 * 60 * 1000), 20); // Max 20 points for time (30 min = 20 points)
		score += Math.min(stats.featuresUsed.length / 3, 10); // Max 10 points for features
		return Math.round(score);
	}

	private scoreToLevel(score: number): UserExpertiseLevel {
		if (score >= 80) return 'expert';
		if (score >= 60) return 'advanced';
		if (score >= 35) return 'intermediate';
		return 'beginner';
	}

	private scoreToThreshold(level: UserExpertiseLevel): number {
		switch (level) {
			case 'expert': return 80;
			case 'advanced': return 60;
			case 'intermediate': return 35;
			case 'beginner': return 0;
		}
	}

	private createDefaultToolStats(toolId: string): ToolUsageStats {
		return {
			toolId,
			usageCount: 0,
			totalTimeSpent: 0,
			successRate: 0,
			errorCount: 0,
			featuresUsed: [],
			lastUsed: new Date(),
			firstUsed: new Date(),
		};
	}

	private applyContentFilters(
		availableHelp: HelpContent[],
		metrics: ExpertiseMetrics,
		profile: UserHelpProfile
	): HelpContent[] {
		const filters = this.disclosureConfig.contentFilters.filter(filter =>
			filter.audience.includes(metrics.overallLevel)
		);

		return availableHelp.filter(content => {
			// Check audience match
			if (!this.matchesAudience(content.targetAudience, metrics.overallLevel)) {
				return false;
			}

			// Check priority threshold
			const priorityScore = this.priorityToScore(content.priority);
			const meetsPriority = priorityScore >= Math.min(...filters.map(f => f.priorityThreshold));

			// Check if recently shown
			const recentlyViewed = profile.helpInteractions.some(
				interaction =>
					interaction.helpId === content.id &&
					Date.now() - interaction.timestamp.getTime() < filters[0]?.cooldownPeriod * 60 * 60 * 1000
			);

			return meetsPriority && !recentlyViewed;
		});
	}

	private evaluateProgressionRules(
		profile: UserHelpProfile,
		metrics: ExpertiseMetrics
	): ProgressionRule[] {
		return this.progressionRules.filter(rule =>
			this.evaluateRuleCondition(rule.condition, profile, metrics)
		);
	}

	private evaluateRuleCondition(
		condition: ProgressionCondition,
		profile: UserHelpProfile,
		metrics: ExpertiseMetrics
	): boolean {
		switch (condition.type) {
			case 'usage':
				return this.evaluateUsageCondition(condition, profile);
			case 'success-rate':
				return this.evaluateSuccessRateCondition(condition, profile);
			case 'time-spent':
				return this.evaluateTimeSpentCondition(condition, profile);
			case 'feature-discovery':
				return this.evaluateFeatureDiscoveryCondition(condition, profile);
			case 'combination':
				return this.evaluateCombinationCondition(condition, profile, metrics);
			default:
				return false;
		}
	}

	private createRecommendation(
		rule: ProgressionRule,
		filteredHelp: HelpContent[],
		context: any
	): ProgressiveRecommendation | null {
		const relevantHelp = filteredHelp.filter(help =>
			this.isHelpRelevantToRule(help, rule)
		);

		if (relevantHelp.length === 0) return null;

		return {
			type: rule.action.type,
			priority: rule.priority,
			content: relevantHelp[0], // Take most relevant
			relevanceScore: this.calculateRecommendationScore(rule, relevantHelp[0], context),
			parameters: rule.action.parameters,
		};
	}

	private async processUpdates(): Promise<void> {
		// Batch process updates to improve performance
		if (this.updateQueue.length === 0) return;

		const updates = [...this.updateQueue];
		this.updateQueue = [];

		for (const update of updates) {
			await this.processUpdate(update);
		}

		// Clear cache after updates
		this.expertiseCache.clear();
	}

	private async processUpdate(update: ProfileUpdate): Promise<void> {
		switch (update.type) {
			case 'interaction':
				// Already handled in updateProfile
				break;
			// Handle other update types
		}
	}

	private isCacheExpired(metrics: ExpertiseMetrics): boolean {
		const cacheTimeout = 5 * 60 * 1000; // 5 minutes
		return Date.now() - metrics.learningCurve[metrics.learningCurve.length - 1]?.date?.getTime() > cacheTimeout;
	}

	// Default configurations
	private initializeDefaultConfig(): ProgressiveDisclosureConfig {
		return {
			enabled: true,
			rules: [],
			contentFilters: [
				{
					audience: ['beginner'],
					categories: ['getting-started', 'feature-explanation'],
					priorityThreshold: 50,
					maxContentPerSession: 5,
					cooldownPeriod: 24, // hours
				},
				{
					audience: ['intermediate'],
					categories: ['feature-explanation', 'troubleshooting', 'tips'],
					priorityThreshold: 30,
					maxContentPerSession: 3,
					cooldownPeriod: 48, // hours
				},
				{
					audience: ['advanced', 'expert'],
					categories: ['advanced-topics', 'best-practices', 'tips'],
					priorityThreshold: 20,
					maxContentPerSession: 2,
					cooldownPeriod: 72, // hours
				},
			],
			timing: {
				minimumTimeBetweenHelp: 5, // minutes
				maximumHelpPerSession: 10,
				sessionHelpLimit: 5,
				quietHours: { start: 22, end: 8 }, // 10 PM to 8 AM
			},
			personalization: {
				adaptToUserSpeed: true,
				considerUserPreferences: true,
				favoriteToolBoost: true,
				recentActivityWeight: 0.7,
				historicalWeight: 0.3,
			},
		};
	}

	private initializeDefaultRules(): ProgressionRule[] {
		return [
			{
				id: 'beginner-to-intermediate',
				name: 'Beginner to Intermediate Progression',
				description: 'Promote user to intermediate level when they show proficiency',
				condition: {
					type: 'combination',
					operator: 'minimum',
					threshold: 50, // 50 points overall
					timeframe: 7, // days
				},
				action: {
					type: 'promote',
					target: 'intermediate',
				},
				priority: 100,
			},
			{
				id: 'reveal-advanced-features',
				name: 'Reveal Advanced Features',
				description: 'Show advanced help when user becomes intermediate',
				condition: {
					type: 'success-rate',
					operator: 'greater-than',
					threshold: 75,
					timeframe: 3, // days
				},
				action: {
					type: 'reveal-content',
					target: 'advanced-features',
				},
				priority: 80,
			},
		];
	}
}

// Supporting types and interfaces
export interface ToolInfo {
	id: string;
	features?: string[];
	category?: string;
}

export interface ProfileUpdate {
	userId: string;
	type: 'interaction' | 'tool-usage' | 'preference-change';
	data: any;
}

export interface ProgressiveRecommendation {
	type: string;
	priority: number;
	content: HelpContent;
	relevanceScore: number;
	parameters?: Record<string, any>;
}

export interface LearningInsights {
	currentLevel: UserExpertiseLevel;
	strengths: string[];
	areasForImprovement: string[];
	suggestedNextSteps: string[];
	progressMilestones: string[];
	usagePatterns: UsagePattern[];
	preferredLearningStyle: 'visual' | 'textual' | 'interactive' | 'mixed';
}

export interface UsagePattern {
	toolId: string;
	frequency: number;
	preferredTime: string;
	successRate: number;
	commonErrors: string[];
}

// Helper methods (simplified for brevity)
function matchesAudience(targetAudience: UserExpertiseLevel[], userLevel: UserExpertiseLevel): boolean {
	return targetAudience.includes(userLevel);
}

function isProgressiveAppropriate(content: HelpContent, metrics: ExpertiseMetrics): boolean {
	// Allow one level up for progressive learning
	const allowedLevels = [metrics.overallLevel];
	if (metrics.overallLevel === 'beginner') allowedLevels.push('intermediate');
	else if (metrics.overallLevel === 'intermediate') allowedLevels.push('advanced');
	else if (metrics.overallLevel === 'advanced') allowedLevels.push('expert');

	return content.targetAudience.some(level => allowedLevels.includes(level));
}

function isRecentlyViewed(contentId: string, profile: UserHelpProfile): boolean {
	const recentView = profile.helpInteractions.find(
		interaction =>
			interaction.helpId === contentId &&
			interaction.action === 'viewed' &&
			Date.now() - interaction.timestamp.getTime() < 24 * 60 * 60 * 1000 // 24 hours
	);
	return !!recentView;
}

function shouldShowAgain(content: HelpContent, profile: UserHelpProfile): boolean {
	const lastDismissal = Array.from(profile.helpInteractions)
		.filter(interaction => interaction.helpId === content.id && interaction.action === 'dismissed')
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

	if (!lastDismissal) return true;

	const daysSinceDismissal = (Date.now() - lastDismissal.timestamp.getTime()) / (24 * 60 * 60 * 1000);

	switch (content.priority) {
		case 'critical': return daysSinceDismissal >= 1;
		case 'high': return daysSinceDismissal >= 3;
		case 'medium': return daysSinceDismissal >= 7;
		case 'low': return daysSinceDismissal >= 14;
		default: return daysSinceDismissal >= 7;
	}
}

function checkTimingConstraints(profile: UserHelpProfile): boolean {
	// Implementation would check quiet hours and timing constraints
	return true;
}

function checkSessionLimits(profile: UserHelpProfile): boolean {
	// Implementation would check session limits
	return true;
}

function priorityToScore(priority: string): number {
	switch (priority) {
		case 'critical': return 100;
		case 'high': return 75;
		case 'medium': return 50;
		case 'low': return 25;
		default: return 0;
	}
}

function isHelpRelevantToRule(help: HelpContent, rule: ProgressionRule): boolean {
	// Implementation would check if help content is relevant to the rule
	return true;
}

function calculateRecommendationScore(rule: ProgressionRule, help: HelpContent, context: any): number {
	// Implementation would calculate relevance score
	return rule.priority + (help.priority === 'critical' ? 20 : 0);
}

export default ExpertiseTracker;
