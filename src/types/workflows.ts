/**
 * Guided Workflow System Types
 * Interactive tutorials and step-by-step guidance for complex tools
 */

import type { Tool, ToolCategory } from './tools';

// Core workflow types
export interface WorkflowStep {
	id: string;
	title: string;
	description: string;
	content: WorkflowContent;
	validation?: StepValidation;
	actions?: WorkflowAction[];
	hints?: WorkflowHint[];
	duration?: number; // estimated time in seconds
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	required?: boolean;
	dependencies?: string[]; // other step IDs that must be completed first
}

export interface WorkflowContent {
	type: 'instruction' | 'interactive' | 'code' | 'input' | 'demonstration';
	text: string;
	code?: string;
	examples?: WorkflowExample[];
	interactiveElements?: InteractiveElement[];
	visualAids?: VisualAid[];
}

export interface WorkflowExample {
	title: string;
	description: string;
	input?: any;
	output?: any;
	code?: string;
	explanation?: string;
}

export interface InteractiveElement {
	type: 'button' | 'input' | 'select' | 'slider' | 'toggle';
	id: string;
	label: string;
	placeholder?: string;
	options?: string[];
	value?: any;
	onChange?: (value: any) => void;
	onComplete?: () => void;
	validation?: (value: any) => boolean | string;
}

export interface VisualAid {
	type: 'image' | 'diagram' | 'animation' | 'screenshot';
	src: string;
	alt: string;
	caption?: string;
	position?: 'inline' | 'modal' | 'tooltip';
}

export interface StepValidation {
	type: 'manual' | 'automatic';
	validate: (context: WorkflowContext) => boolean | Promise<boolean>;
	errorMessage?: string;
	successMessage?: string;
}

export interface WorkflowAction {
	id: string;
	label: string;
	type: 'primary' | 'secondary' | 'tertiary';
	action: () => void | Promise<void>;
	enabled?: boolean;
	visible?: boolean;
}

export interface WorkflowHint {
	type: 'tip' | 'warning' | 'info' | 'example';
	title: string;
	content: string;
	trigger?: 'auto' | 'manual' | 'error' | 'delay';
	delay?: number;
}

// Workflow definition and management
export interface Workflow {
	id: string;
	name: string;
	description: string;
	toolId: string;
	category: ToolCategory;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedDuration: number; // in minutes
	steps: WorkflowStep[];
	prerequisites?: string[];
	tags: string[];
	isRecommended?: boolean;
	progress?: WorkflowProgress;
}

export interface WorkflowContext {
	toolId: string;
	stepId: string;
	stepIndex: number;
	userData: Record<string, any>;
	sessionData: Record<string, any>;
	environment: 'development' | 'production';
	deviceInfo: DeviceInfo;
}

export interface WorkflowProgress {
	completedSteps: string[];
	currentStep: string;
	startTime: Date;
	lastActivity: Date;
	totalTime: number; // in seconds
	errors: WorkflowError[];
	hintsShown: string[];
	skippedSteps: string[];
}

export interface WorkflowError {
	stepId: string;
	error: string;
	timestamp: Date;
	userAction?: string;
	resolved: boolean;
}

export interface DeviceInfo {
	type: 'desktop' | 'tablet' | 'mobile';
	browser: string;
	screenSize: { width: number; height: number };
	permissions: string[];
}

// Template system for different categories
export interface WorkflowTemplate {
	id: string;
	name: string;
	description: string;
	category: ToolCategory;
	pattern: 'sequential' | 'branching' | 'guided' | 'interactive';
	baseSteps: Partial<WorkflowStep>[];
	variants: WorkflowVariant[];
}

export interface WorkflowVariant {
	conditions: WorkflowCondition[];
	modifications: WorkflowModification[];
}

export interface WorkflowCondition {
	field: string;
	operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
	value: any;
}

export interface WorkflowModification {
	type: 'add' | 'remove' | 'modify' | 'replace';
	target: string | string[];
	changes: Partial<WorkflowStep>;
}

// Tutorial and onboarding system
export interface Tutorial {
	id: string;
	name: string;
	description: string;
	type: 'tool-specific' | 'category-intro' | 'general';
	duration: number;
	workflows: string[];
	isRequired: boolean;
	completionReward?: TutorialReward;
}

export interface TutorialReward {
	type: 'badge' | 'certificate' | 'unlock' | 'points';
	value: string;
	description: string;
}

// Analytics and tracking
export interface WorkflowAnalytics {
	workflowId: string;
	userId?: string;
	sessionId: string;
	startTime: Date;
	endTime?: Date;
	completed: boolean;
	stepsCompleted: number;
	totalSteps: number;
	timePerStep: Record<string, number>;
	errors: number;
	hintsUsed: number;
	skips: number;
	deviceInfo: DeviceInfo;
	satisfaction: number; // 1-5 rating
	feedback?: string;
}

export interface WorkflowStats {
	totalCompletions: number;
	averageCompletionTime: number;
	averageSatisfaction: number;
	stepCompletionRates: Record<string, number>;
	errorRates: Record<string, number>;
	skipRates: Record<string, number>;
}

// State management
export interface WorkflowState {
	// Current workflow session
	activeWorkflow: Workflow | null;
	currentStepIndex: number;
	context: WorkflowContext;
	progress: WorkflowProgress;

	// UI state
	isVisible: boolean;
	isMinimized: boolean;
	position: { x: number; y: number };
	zoomLevel: number;

	// History and navigation
	history: string[]; // step history
	canGoBack: boolean;
	canGoForward: boolean;
	canSkip: boolean;

	// Tutorial state
	tutorialMode: boolean;
	highlightsEnabled: boolean;
	tooltipsEnabled: boolean;
}

// User preferences for workflows
export interface WorkflowPreferences {
	enabled: boolean;
	autoStart: boolean;
	showProgress: boolean;
	showHints: boolean;
	allowSkipping: boolean;
	theme: 'light' | 'dark' | 'auto';
	animations: boolean;
	sounds: boolean;
	position: 'bottom-right' | 'top-right' | 'floating';
	dismissedWorkflows: string[];
	completedWorkflows: string[];
	favoriteWorkflows: string[];
}

// Integration with existing systems
export interface ErrorHandlingIntegration {
	errorTypes: string[];
	recoveryStrategies: Record<string, string>;
	contextualHelp: Record<string, Workflow>;
	workflowTriggers: Record<string, string>;
}

export interface HelpSystemIntegration {
	tooltips: Record<string, WorkflowHint>;
	contextualWorkflows: Record<string, string>;
	progressIndicators: Record<string, WorkflowProgress>;
	onboardingPaths: string[];
}

// Type guards
export function isWorkflow(obj: any): obj is Workflow {
	return obj && typeof obj === 'object' &&
		'id' in obj &&
		'name' in obj &&
		'steps' in obj &&
		Array.isArray(obj.steps);
}

export function isWorkflowStep(obj: any): obj is WorkflowStep {
	return obj && typeof obj === 'object' &&
		'id' in obj &&
		'title' in obj &&
		'content' in obj;
}

export function isInteractiveStep(step: WorkflowStep): boolean {
	return step.content.type === 'interactive' &&
		step.content.interactiveElements &&
		step.content.interactiveElements.length > 0;
}
