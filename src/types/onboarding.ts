import type { Tool, ToolCategory } from './tools';

// User onboarding state and progress
export interface OnboardingState {
	id: string;
	userId?: string;
	isFirstTimeUser: boolean;
	currentStep: OnboardingStep;
	completedSteps: string[];
	progress: OnboardingProgress;
	preferences: UserPreferences;
	recommendations: ToolRecommendation[];
	startedAt?: Date;
	lastActivity: Date;
	completedAt?: Date;
	skipReasons?: string[];
}

export interface OnboardingProgress {
	percentage: number;
	stepsCompleted: number;
	totalSteps: number;
	timeSpent: number; // in minutes
	categoryExploration: Record<string, boolean>;
	toolsTried: string[];
	featuresDiscovered: string[];
}

export interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	type: StepType;
	status: StepStatus;
	content?: StepContent;
	actions?: StepAction[];
	prerequisites?: string[];
	estimatedTime: number; // in minutes
	isSkippable: boolean;
	completionCriteria?: CompletionCriteria;
}

export type StepType =
	| 'welcome'
	| 'tutorial'
	| 'exploration'
	| 'interaction'
	| 'quiz'
	| 'achievement'
	| 'recommendation';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'locked';

export interface StepContent {
	headline?: string;
	description: string;
	highlightedElements?: string[];
	media?: {
		type: 'image' | 'video' | 'interactive';
		src: string;
		alt: string;
	};
	examples?: string[];
	tips?: string[];
}

export interface StepAction {
	id: string;
	label: string;
	type: 'primary' | 'secondary' | 'tertiary';
	action: ActionType;
	target?: string;
	data?: any;
}

export type ActionType =
	| 'next_step'
	| 'skip_step'
	| 'open_tool'
	| 'explore_category'
	| 'watch_tutorial'
	| 'start_quiz'
	| 'complete_onboarding';

export interface CompletionCriteria {
	type: 'time_spent' | 'action_completed' | 'tool_used' | 'category_explored' | 'quiz_passed';
	value: any;
	optional?: boolean;
}

// User preferences collected during onboarding
export interface UserPreferences {
	role: UserRole;
	experienceLevel: ExperienceLevel;
	interests: string[];
	preferredCategories: ToolCategory[];
	workflowPreference: WorkflowPreference;
	notificationSettings: NotificationSettings;
	themePreference: 'light' | 'dark' | 'system';
}

export type UserRole =
	| 'frontend-developer'
	| 'backend-developer'
	| 'fullstack-developer'
	| 'devops-engineer'
	| 'qa-engineer'
	| 'data-scientist'
	| 'student'
	| 'hobbyist'
	| 'other';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type WorkflowPreference =
	| 'quick-tasks'
	| 'detailed-analysis'
	| 'batch-processing'
	| 'learning-exploration';

export interface NotificationSettings {
	tips: boolean;
	newFeatures: boolean;
	productivity: boolean;
	achievements: boolean;
}

// Tool recommendation system
export interface ToolRecommendation {
	id: string;
	toolId: string;
	score: number; // 0-100
	reason: RecommendationReason;
	category: ToolCategory;
	priority: 'high' | 'medium' | 'low;
	isPersonalized: boolean;
	context?: RecommendationContext;
}

export interface RecommendationReason {
	type: ReasonType;
	description: string;
	confidence: number; // 0-1
	factors: string[];
}

export type ReasonType =
	| 'role_match'
	| 'interest_match'
	| 'experience_level'
	| 'workflow_fit'
	| 'popularity'
	| 'complementary'
	| 'recent_trend';

export interface RecommendationContext {
	currentTask?: string;
	recentTools?: string[];
	timeOfDay?: string;
	deviceType?: string;
	projectContext?: string;
}

// Achievement and gamification system
export interface Achievement {
	id: string;
	name: string;
	description: string;
	category: AchievementCategory;
	type: AchievementType;
	rarity: AchievementRarity;
	points: number;
	icon: string;
	unlockedAt?: Date;
	progress?: AchievementProgress;
	prerequisites?: string[];
}

export type AchievementCategory =
	| 'exploration'
	| 'usage'
	| 'expertise'
	| 'social'
	| 'learning'
	| 'productivity';

export type AchievementType =
	| 'milestone'
	| 'streak'
	| 'collection'
	| 'challenge'
	| 'discovery';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementProgress {
	current: number;
	target: number;
	percentage: number;
}

// Interactive tutorial system
export interface Tutorial {
	id: string;
	name: string;
	description: string;
	steps: TutorialStep[];
	category: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	duration: number; // in minutes
	isInteractive: boolean;
	prerequisites?: string[];
}

export interface TutorialStep {
	id: string;
	title: string;
	content: string;
	type: 'instruction' | 'interaction' | 'quiz' | 'demonstration';
	elementSelector?: string; // CSS selector for highlighting
	interactionType?: 'click' | 'type' | 'select' | 'drag';
	expectedAction?: any;
	hint?: string;
	timeLimit?: number;
}

// Onboarding analytics and tracking
export interface OnboardingAnalytics {
	sessionId: string;
	events: OnboardingEvent[];
	funnelData: FunnelData;
	engagementMetrics: EngagementMetrics;
	completionRate: number;
	timeToComplete: number;
	dropOffPoints: string[];
}

export interface OnboardingEvent {
	type: EventType;
	timestamp: Date;
	stepId?: string;
	data?: any;
	sessionId: string;
	userId?: string;
}

export type EventType =
	| 'step_started'
	| 'step_completed'
	| 'step_skipped'
	| 'tool_opened'
	| 'category_explored'
	| 'quiz_answered'
	| 'preference_selected'
	| 'onboarding_completed'
	| 'onboarding_abandoned';

export interface FunnelData {
	totalStarted: number;
	stepCompletions: Record<string, number>;
	completionRate: number;
	averageTimePerStep: Record<string, number>;
	dropOffReasons: Record<string, number>;
}

export interface EngagementMetrics {
	interactionsPerMinute: number;
	featureDiscoveryRate: number;
	toolAdoptionRate: number;
	userSatisfactionScore?: number;
	retentionRate?: number;
}

// Tour and walkthrough system
export interface Tour {
	id: string;
	name: string;
	description: string;
	steps: TourStep[];
	targetPage?: string;
	triggerConditions: TriggerCondition[];
	isRepeatable: boolean;
	priority: number;
}

export interface TourStep {
	id: string;
	title: string;
	content: string;
	target: string; // CSS selector or element ID
	position: 'top' | 'bottom' | 'left' | 'right' | 'center';
	showBackdrop?: boolean;
	allowSkip?: boolean;
	actions?: TourAction[];
}

export interface TourAction {
	label: string;
	action: 'next' | 'prev' | 'skip' | 'finish';
	callback?: string;
}

export interface TriggerCondition {
	type: 'page_visit' | 'user_action' | 'time_delay' | 'feature_discovery';
	value: any;
}

// Quick start and help system
export interface QuickStartGuide {
	id: string;
	title: string;
	description: string;
	category: string;
	steps: QuickStartStep[];
	estimatedTime: number;
	difficulty: 'beginner' | 'intermediate' | 'advanced;
	tags: string[];
	isPopular?: boolean;
}

export interface QuickStartStep {
	id: string;
	title: string;
	description: string;
	action: string;
	expectedResult: string;
	tip?: string;
	toolId?: string;
}

// Tool discovery and exploration
export interface DiscoverySession {
	id: string;
	type: DiscoveryType;
	categories: ToolCategory[];
	recommendations: ToolRecommendation[];
	userInteractions: DiscoveryInteraction[];
	startedAt: Date;
	completedAt?: Date;
	successful: boolean;
}

export type DiscoveryType =
	| 'guided'
	| 'self_exploration'
	| 'category_focused'
	| 'use_case_driven';

export interface DiscoveryInteraction {
	type: 'tool_click' | 'category_view' | 'search_query' | 'filter_apply';
	timestamp: Date;
	data: any;
	duration?: number;
}

// Contextual help system
export interface ContextualHelp {
	id: string;
	trigger: HelpTrigger;
	content: HelpContent;
	position?: 'tooltip' | 'sidebar' | 'modal' | 'inline';
	priority: number;
	isContextual: boolean;
}

export interface HelpTrigger {
	type: 'element_hover' | 'element_focus' | 'page_load' | 'user_action' | 'error_occurred';
	selector?: string;
	event?: string;
	condition?: string;
}

export interface HelpContent {
	title: string;
	description: string;
	actions?: HelpAction[];
	relatedTopics?: string[];
	media?: {
		type: 'image' | 'video';
		src: string;
		alt: string;
	};
}

export interface HelpAction {
	label: string;
	action: 'learn_more' | 'watch_tutorial' | 'open_tool' | 'schedule_demo';
	target?: string;
}

// Type guards
export function isActiveStep(step: OnboardingStep): boolean {
	return step.status === 'in_progress';
}

export function isCompletedStep(step: OnboardingStep): boolean {
	return step.status === 'completed';
}

export function isAchievementUnlocked(achievement: Achievement): boolean {
	return achievement.unlockedAt !== undefined;
}

export function isRecommendationPersonalized(recommendation: ToolRecommendation): boolean {
	return recommendation.isPersonalized;
}

export function isValidUserRole(role: string): role is UserRole {
	return [
		'frontend-developer',
		'backend-developer',
		'fullstack-developer',
		'devops-engineer',
		'qa-engineer',
		'data-scientist',
		'student',
		'hobbyist',
		'other'
	].includes(role);
}
