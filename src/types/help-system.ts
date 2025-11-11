// Context-aware help system types for Parsify.dev

// Base help context types
export type HelpContextType =
	| 'tool-page'
	| 'component-hover'
	| 'error-state'
	| 'first-visit'
	| 'feature-discovery'
	| 'keyboard-shortcut'
	| 'advanced-feature'
	| 'workflow-step'
	| 'validation-error'
	| 'empty-state';

// Help delivery methods
export type HelpDeliveryMethod =
	| 'tooltip'
	| 'modal'
	| 'sidebar'
	| 'overlay'
	| 'inline'
	| 'banner'
	| 'spotlight'
	| 'guided-tour';

// User expertise levels
export type UserExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Help content priority
export type HelpPriority = 'critical' | 'high' | 'medium' | 'low';

// Help content categories
export type HelpCategory =
	| 'getting-started'
	| 'feature-explanation'
	| 'troubleshooting'
	| 'best-practices'
	| 'shortcuts'
	| 'tips'
	| 'advanced-topics';

// Core help context interface
export interface HelpContext {
	id: string;
	type: HelpContextType;
	toolId?: string;
	componentId?: string;
	errorCode?: string;
	userAction?: string;
	pageSection?: string;
	elementSelector?: string;
	triggerEvents: string[];
	metadata: Record<string, any>;
	requires: ContextRequirement[];
}

// Context requirements for help triggering
export interface ContextRequirement {
	type: 'time-spent' | 'click-count' | 'error-count' | 'feature-used' | 'never-used' | 'user-level';
	operator: 'equals' | 'greater-than' | 'less-than' | 'contains' | 'not-contains';
	value: any;
	threshold?: number;
}

// Help content interface
export interface HelpContent {
	id: string;
	title: string;
	description: string;
	content: string[];
	categories: HelpCategory[];
	targetAudience: UserExpertiseLevel[];
	priority: HelpPriority;
	deliveryMethods: HelpDeliveryMethod[];
	contexts: string[];
	relatedHelpIds: string[];
	version: string;
	lastUpdated: Date;
	deprecated: boolean;
	locale: string;
	metadata: HelpContentMetadata;
}

// Help content metadata
export interface HelpContentMetadata {
	estimatedReadTime: number;
	videoUrl?: string;
	codeExamples?: string[];
	links?: HelpLink[];
	keywords: string[];
	author: string;
	tags: string[];
	searchableText: string;
}

// Help links for related resources
export interface HelpLink {
	url: string;
	title: string;
	type: 'documentation' | 'tutorial' | 'video' | 'blog' | 'example' | 'api';
	external: boolean;
}

// User expertise tracking
export interface UserHelpProfile {
	id: string;
	expertiseLevel: UserExpertiseLevel;
	toolUsage: Record<string, ToolUsageStats>;
	helpInteractions: HelpInteraction[];
	preferences: HelpPreferences;
	lastActive: Date;
	sessionCount: number;
	totalTimeSpent: number;
	completedTours: string[];
	skippedHelp: Set<string>;
	bookmarkedHelp: Set<string>;
}

// Tool usage statistics for expertise calculation
export interface ToolUsageStats {
	toolId: string;
	usageCount: number;
	totalTimeSpent: number;
	successRate: number;
	errorCount: number;
	featuresUsed: string[];
	lastUsed: Date;
	firstUsed: Date;
}

// Help interaction tracking
export interface HelpInteraction {
	id: string;
	helpId: string;
	contextId: string;
	deliveryMethod: HelpDeliveryMethod;
	action: 'viewed' | 'dismissed' | 'completed' | 'bookmarked' | 'shared';
	duration: number;
	rating?: number;
	feedback?: string;
	timestamp: Date;
	sessionId: string;
}

// User preferences for help system
export interface HelpPreferences {
	enableTooltips: boolean;
	enableModals: boolean;
	enableGuidedTours: boolean;
	enableAutoTrigger: boolean;
	expertiseLevel: UserExpertiseLevel;
	preferredDeliveryMethod: HelpDeliveryMethod;
	theme: 'light' | 'dark' | 'auto';
	language: string;
	showAdvancedHelp: boolean;
	notificationFrequency: 'never' | 'daily' | 'weekly';
}

// Help session for tracking user journey
export interface HelpSession {
	id: string;
	startTime: Date;
	endTime?: Date;
	contexts: HelpContext[];
	interactions: HelpInteraction[];
	path: string[];
	goal?: string;
	completed: boolean;
	duration?: number;
}

// Help delivery component configuration
export interface HelpDeliveryConfig {
	method: HelpDeliveryMethod;
	component: string;
	props: Record<string, any>;
	conditions: DeliveryCondition[];
	triggers: TriggerConfig[];
	animations: AnimationConfig[];
	accessibility: AccessibilityConfig;
}

// Conditions for when help should be delivered
export interface DeliveryCondition {
	type: 'context-match' | 'user-level' | 'time-triggered' | 'event-triggered' | 'location-based';
	requirements: ContextRequirement[];
	priority: number;
	maxFrequency?: number;
	cooldownPeriod?: number;
}

// Trigger configuration for help delivery
export interface TriggerConfig {
	event: string;
	selector?: string;
	debounce?: number;
	throttle?: number;
	once: boolean;
	priority: number;
}

// Animation configuration for help delivery
export interface AnimationConfig {
	entrance: string;
	exit: string;
	duration: number;
	easing: string;
	delay: number;
}

// Accessibility configuration
export interface AccessibilityConfig {
	screenReader: boolean;
	keyboardNavigation: boolean;
	highContrast: boolean;
	reducedMotion: boolean;
	focusManagement: boolean;
	announcements: AnnouncementConfig[];
}

// Screen reader announcements
export interface AnnouncementConfig {
	trigger: string;
	message: string;
	priority: 'polite' | 'assertive' | 'off';
	delay: number;
}

// Help search and filtering
export interface HelpSearchQuery {
	query: string;
	categories: HelpCategory[];
	audience: UserExpertiseLevel[];
	priority: HelpPriority[];
	context: HelpContextType[];
	limit?: number;
	offset?: number;
	sortBy: 'relevance' | 'popularity' | 'recent' | 'priority';
}

export interface HelpSearchResult {
	help: HelpContent;
	relevanceScore: number;
	matchContext: string[];
	snippets: string[];
}

// Analytics and metrics
export interface HelpAnalytics {
	totalViews: number;
	uniqueViewers: number;
	averageDuration: number;
	completionRate: number;
	rating: number;
	feedbackCount: number;
	effectivenessScore: number;
	mostHelpful: string[];
	leastHelpful: string[];
	searchTerms: Record<string, number>;
	deviceBreakdown: Record<string, number>;
	expertiseBreakdown: Record<UserExpertiseLevel, number>;
}

// Help system configuration
export interface HelpSystemConfig {
	enabled: boolean;
	debugMode: boolean;
	apiEndpoint: string;
	cacheEnabled: boolean;
	cacheTimeout: number;
	analyticsEnabled: boolean;
	defaultPreferences: HelpPreferences;
	deliveryConfigs: HelpDeliveryConfig[];
}

// Help state management
export interface HelpState {
	profile: UserHelpProfile;
	currentSession: HelpSession;
	activeHelp: Map<string, HelpContent>;
	availableHelp: Map<string, HelpContent>;
	searchResults: HelpSearchResult[];
	loading: boolean;
	error?: Error;
	config: HelpSystemConfig;
}

// Export utility functions
export function isBeginner(profile: UserHelpProfile): boolean {
	return profile.expertiseLevel === 'beginner' || profile.sessionCount < 5;
}

export function isAdvancedUser(profile: UserHelpProfile): boolean {
	return profile.expertiseLevel === 'advanced' ||
		   profile.expertiseLevel === 'expert' ||
		   profile.sessionCount > 50;
}

export function shouldShowHelp(
	help: HelpContent,
	profile: UserHelpProfile,
	context: HelpContext
): boolean {
	// Check if help is deprecated
	if (help.deprecated) return false;

	// Check audience match
	if (!help.targetAudience.includes(profile.expertiseLevel)) {
		return help.targetAudience.includes('beginner') && isBeginner(profile);
	}

	// Check if user has skipped this help
	if (profile.skippedHelp.has(help.id)) return false;

	// Check context relevance
	return help.contexts.includes(context.type);
}

export function calculateExpertiseLevel(usageStats: ToolUsageStats[]): UserExpertiseLevel {
	if (usageStats.length === 0) return 'beginner';

	const totalUsage = usageStats.reduce((sum, stat) => sum + stat.usageCount, 0);
	const avgSuccessRate = usageStats.reduce((sum, stat) => sum + stat.successRate, 0) / usageStats.length;
	const toolsUsed = usageStats.filter(stat => stat.usageCount > 0).length;

	// Advanced user criteria
	if (totalUsage > 100 && avgSuccessRate > 0.9 && toolsUsed > 10) {
		return 'expert';
	}

	// Advanced user criteria
	if (totalUsage > 50 && avgSuccessRate > 0.8 && toolsUsed > 5) {
		return 'advanced';
	}

	// Intermediate user criteria
	if (totalUsage > 10 && avgSuccessRate > 0.7 && toolsUsed > 2) {
		return 'intermediate';
	}

	return 'beginner';
}
