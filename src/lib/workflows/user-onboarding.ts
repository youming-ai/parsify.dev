/**
 * User Onboarding System
 * Manages new user onboarding and workflow discovery
 */

import type {
	Workflow,
	Tutorial,
	WorkflowPreferences,
	WorkflowAnalytics,
	Tool
} from '@/types/workflows';
import type { ToolCategory } from '@/types/tools';
import { workflowManager } from './workflow-manager';
import { workflowAnalytics } from './workflow-analytics';

export interface UserOnboardingState {
	isNewUser: boolean;
	onboardingProgress: {
		completedSteps: string[];
		currentStep: string;
		startTime: Date;
		lastActivity: Date;
	};
	preferences: Partial<WorkflowPreferences>;
	skillLevel: 'beginner' | 'intermediate' | 'advanced';
	interests: ToolCategory[];
	toolHistory: string[];
	achievementLevel: number;
}

export interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	content: {
		type: 'video' | 'interactive' | 'text' | 'tour';
		content: string;
		duration?: number;
	};
	actions: Array<{
		label: string;
		action: string;
		type: 'primary' | 'secondary';
	}>;
	prerequisites?: string[];
	skipable: boolean;
	completed: boolean;
}

export class UserOnboardingManager {
	private static instance: UserOnboardingManager;
	private onboardingSteps: OnboardingStep[] = [];
	private tutorials: Map<string, Tutorial> = new Map();
	private userState: UserOnboardingState | null = null;

	private constructor() {
		this.initializeOnboardingSteps();
		this.initializeTutorials();
	}

	static getInstance(): UserOnboardingManager {
		if (!UserOnboardingManager.instance) {
			UserOnboardingManager.instance = new UserOnboardingManager();
		}
		return UserOnboardingManager.instance;
	}

	// Initialize onboarding steps
	private initializeOnboardingSteps() {
		this.onboardingSteps = [
			{
				id: 'welcome',
				title: 'Welcome to Parsify.dev',
				description: 'Learn the basics of our developer tools platform',
				content: {
					type: 'interactive',
					content: 'Welcome! Parsify.dev provides 58+ developer tools across 6 categories. Let\'s take a quick tour to get you started.',
					duration: 120,
				},
				actions: [
					{ label: 'Start Tour', action: 'start_tour', type: 'primary' },
					{ label: 'Skip for Now', action: 'skip', type: 'secondary' },
				],
				skipable: true,
				completed: false,
			},
			{
				id: 'category-overview',
				title: 'Explore Tool Categories',
				description: 'Discover the different categories of tools available',
				content: {
					type: 'tour',
					content: 'Navigate through our 6 main categories: JSON Processing, Code Processing, File Processing, Security, Network Utilities, and Text Processing.',
					duration: 180,
				},
				actions: [
					{ label: 'Browse Categories', action: 'browse_categories', type: 'primary' },
					{ label: 'Learn More', action: 'show_details', type: 'secondary' },
				],
				skipable: true,
				completed: false,
			},
			{
				id: 'first-tool',
				title: 'Try Your First Tool',
				description: 'Experience guided workflows with a simple tool',
				content: {
					type: 'interactive',
					content: 'Let\'s start with the JSON Formatter. This tool will help you format and validate JSON data with step-by-step guidance.',
					duration: 300,
				},
				actions: [
					{ label: 'Try JSON Formatter', action: 'launch_tool', type: 'primary' },
					{ label: 'Watch Demo', action: 'watch_demo', type: 'secondary' },
				],
				skipable: false,
				completed: false,
			},
			{
				id: 'workflow-discovery',
				title: 'Discover Guided Workflows',
				description: 'Learn how guided workflows can help you master complex tools',
				content: {
					type: 'interactive',
					content: 'Guided workflows provide step-by-step tutorials for complex tools. They include interactive exercises, examples, and progress tracking.',
					duration: 240,
				},
				actions: [
					{ label: 'Explore Workflows', action: 'browse_workflows', type: 'primary' },
					{ label: 'Learn More', action: 'show_workflow_info', type: 'secondary' },
				],
				skipable: true,
				completed: false,
			},
			{
				id: 'personalization',
				title: 'Personalize Your Experience',
				description: 'Set your preferences and interests for personalized recommendations',
				content: {
					type: 'interactive',
					content: 'Tell us about your skill level and interests so we can recommend the most relevant tools and workflows for you.',
					duration: 180,
				},
				actions: [
					{ label: 'Set Preferences', action: 'set_preferences', type: 'primary' },
					{ label: 'Skip', action: 'skip', type: 'secondary' },
				],
				skipable: true,
				completed: false,
			},
		];
	}

	// Initialize tutorials
	private initializeTutorials() {
		// Quick start tutorial
		this.tutorials.set('quick-start', {
			id: 'quick-start',
			name: 'Quick Start Guide',
			description: 'Get started with the most essential tools and workflows',
			type: 'general',
			duration: 15,
			workflows: ['json-formatter-workflow', 'code-executor-workflow'],
			isRequired: true,
			completionReward: {
				type: 'badge',
				value: 'quick-starter',
				description: 'Completed the quick start guide',
			},
		});

		// Category-specific tutorials
		this.tutorials.set('json-mastery', {
			id: 'json-mastery',
			name: 'JSON Processing Mastery',
			description: 'Master all JSON processing tools and techniques',
			type: 'category-intro',
			duration: 45,
			workflows: [
				'json-formatter-workflow',
				'json-validator-workflow',
				'json-path-queries-workflow',
				'json-schema-generator-workflow',
			],
			isRequired: false,
			completionReward: {
				type: 'badge',
				value: 'json-expert',
				description: 'JSON Processing Expert',
			},
		});

		// Advanced tutorials
		this.tutorials.set('advanced-workflows', {
			id: 'advanced-workflows',
			name: 'Advanced Workflow Techniques',
			description: 'Learn advanced workflow features and automation',
			type: 'general',
			duration: 30,
			workflows: ['workflow-automation', 'custom-workflows'],
			isRequired: false,
			completionReward: {
				type: 'badge',
				value: 'workflow-master',
				description: 'Advanced Workflow User',
			},
		});
	}

	// Initialize user onboarding state
	public initializeUserOnboarding(userId?: string): UserOnboardingState {
		const savedState = this.loadUserState(userId);

		if (savedState) {
			this.userState = savedState;
			return savedState;
		}

		// Create new user state
		const newState: UserOnboardingState = {
			isNewUser: true,
			onboardingProgress: {
				completedSteps: [],
				currentStep: 'welcome',
				startTime: new Date(),
				lastActivity: new Date(),
			},
			preferences: {
				enabled: true,
				autoStart: true,
				showProgress: true,
				showHints: true,
				animations: true,
			},
			skillLevel: 'beginner',
			interests: [],
			toolHistory: [],
			achievementLevel: 1,
		};

		this.userState = newState;
		this.saveUserState(userId, newState);
		return newState;
	}

	// Get current onboarding step
	public getCurrentOnboardingStep(): OnboardingStep | null {
		if (!this.userState) return null;

		const currentStepId = this.userState.onboardingProgress.currentStep;
		return this.onboardingSteps.find(step => step.id === currentStepId) || null;
	}

	// Complete current onboarding step
	public completeOnboardingStep(stepId: string, userId?: string): boolean {
		if (!this.userState) return false;

		const step = this.onboardingSteps.find(s => s.id === stepId);
		if (!step) return false;

		step.completed = true;

		if (!this.userState.onboardingProgress.completedSteps.includes(stepId)) {
			this.userState.onboardingProgress.completedSteps.push(stepId);
		}

		// Move to next step
		const currentIndex = this.onboardingSteps.findIndex(s => s.id === stepId);
		if (currentIndex < this.onboardingSteps.length - 1) {
			this.userState.onboardingProgress.currentStep = this.onboardingSteps[currentIndex + 1].id;
		} else {
			// Onboarding complete
			this.userState.onboardingProgress.currentStep = 'completed';
			this.userState.isNewUser = false;
			this.onboardingComplete();
		}

		this.userState.onboardingProgress.lastActivity = new Date();
		this.saveUserState(userId, this.userState);
		return true;
	}

	// Skip onboarding step
	public skipOnboardingStep(stepId: string, userId?: string): boolean {
		if (!this.userState) return false;

		const step = this.onboardingSteps.find(s => s.id === stepId);
		if (!step || !step.skipable) return false;

		return this.completeOnboardingStep(stepId, userId);
	}

	// Get personalized workflow recommendations
	public getWorkflowRecommendations(userId?: string): {
		recommended: Workflow[];
		trending: Workflow[];
		basedOnHistory: Workflow[];
		skillBased: Workflow[];
	} {
		if (!this.userState) {
			return {
				recommended: [],
				trending: [],
				basedOnHistory: [],
				skillBased: [],
			};
		}

		// Get recommended workflows for user's skill level and interests
		const skillBased = this.getSkillBasedWorkflows();
		const basedOnHistory = this.getHistoryBasedWorkflows();
		const trending = this.getTrendingWorkflows();

		// Combine and prioritize
		const recommended = [
			...skillBased.slice(0, 2),
			...basedOnHistory.slice(0, 2),
			...trending.slice(0, 1),
		];

		return {
			recommended: this.removeDuplicates(recommended),
			trending,
			basedOnHistory,
			skillBased,
		};
	}

	// Get skill-based workflow recommendations
	private getSkillBasedWorkflows(): Workflow[] {
		const allWorkflows = workflowManager.getRecommendedWorkflows();

		return allWorkflows.filter(workflow => {
			switch (this.userState!.skillLevel) {
				case 'beginner':
					return workflow.difficulty === 'beginner' || workflow.difficulty === 'intermediate';
				case 'intermediate':
					return workflow.difficulty !== 'advanced';
				case 'advanced':
					return true;
				default:
					return workflow.difficulty === 'beginner';
			}
		});
	}

	// Get history-based workflow recommendations
	private getHistoryBasedWorkflows(): Workflow[] {
		const history = this.userState!.toolHistory;
		if (history.length === 0) return [];

		// Find workflows for recently used tools
		const recommendations: Workflow[] = [];
		history.forEach(toolId => {
			const toolWorkflows = workflowManager.getWorkflowsForTool(toolId);
			recommendations.push(...toolWorkflows);
		});

		return this.removeDuplicates(recommendations);
	}

	// Get trending workflows
	private getTrendingWorkflows(): Workflow[] {
		// This would normally use analytics data to determine trending
		// For now, return popular workflows
		const trendingIds = ['json-path-queries-workflow', 'code-executor-workflow', 'regex-tester-workflow'];

		return trendingIds
			.map(id => workflowManager.getWorkflowById(id))
			.filter(Boolean) as Workflow[];
	}

	// Remove duplicate workflows
	private removeDuplicates(workflows: Workflow[]): Workflow[] {
		const seen = new Set<string>();
		return workflows.filter(workflow => {
			if (seen.has(workflow.id)) return false;
			seen.add(workflow.id);
			return true;
		});
	}

	// Update user preferences
	public updateUserPreferences(preferences: Partial<WorkflowPreferences>, userId?: string): void {
		if (!this.userState) return;

		this.userState.preferences = { ...this.userState.preferences, ...preferences };
		this.saveUserState(userId, this.userState);
	}

	// Update user skill level
	public updateUserSkillLevel(skillLevel: 'beginner' | 'intermediate' | 'advanced', userId?: string): void {
		if (!this.userState) return;

		this.userState.skillLevel = skillLevel;
		this.saveUserState(userId, this.userState);
	}

	// Add tool to user history
	public addToToolHistory(toolId: string, userId?: string): void {
		if (!this.userState) return;

		// Remove from history if already present
		this.userState.toolHistory = this.userState.toolHistory.filter(id => id !== toolId);

		// Add to beginning of history
		this.userState.toolHistory.unshift(toolId);

		// Keep only last 20 tools
		this.userState.toolHistory = this.userState.toolHistory.slice(0, 20);

		this.saveUserState(userId, this.userState);
	}

	// Get tutorial by ID
	public getTutorial(tutorialId: string): Tutorial | undefined {
		return this.tutorials.get(tutorialId);
	}

	// Get all available tutorials
	public getAllTutorials(): Tutorial[] {
		return Array.from(this.tutorials.values());
	}

	// Get recommended tutorials for user
	public getRecommendedTutorials(): Tutorial[] {
		if (!this.userState) return [];

		const tutorials = Array.from(this.tutorials.values());

		return tutorials.filter(tutorial => {
			// Always include required tutorials
			if (tutorial.isRequired) return true;

			// Recommend based on skill level
			if (this.userState!.skillLevel === 'beginner' && tutorial.type === 'general') return true;

			// Recommend category tutorials based on user interests
			if (tutorial.type === 'category-intro' &&
				this.userState!.interests.length === 0) return true;

			return false;
		});
	}

	// Handle onboarding completion
	private onboardingComplete(): void {
		// Award completion badge
		this.userState!.achievementLevel = 2;

		// Show completion celebration
		this.showOnboardingCompletion();
	}

	// Show onboarding completion celebration
	private showOnboardingCompletion(): void {
		// This would integrate with UI to show celebration
		console.log('Onboarding completed! Achievement level:', this.userState?.achievementLevel);
	}

	// Save user state to localStorage
	private saveUserState(userId: string | undefined, state: UserOnboardingState): void {
		if (typeof window === 'undefined') return;

		try {
			const key = userId ? `user-onboarding-${userId}` : 'user-onboarding-guest';
			localStorage.setItem(key, JSON.stringify({
				...state,
				onboardingProgress: {
					...state.onboardingProgress,
					startTime: state.onboardingProgress.startTime.toISOString(),
					lastActivity: state.onboardingProgress.lastActivity.toISOString(),
				},
			}));
		} catch (error) {
			console.error('Failed to save user onboarding state:', error);
		}
	}

	// Load user state from localStorage
	private loadUserState(userId?: string): UserOnboardingState | null {
		if (typeof window === 'undefined') return null;

		try {
			const key = userId ? `user-onboarding-${userId}` : 'user-onboarding-guest';
			const stored = localStorage.getItem(key);

			if (stored) {
				const parsed = JSON.parse(stored);
				return {
					...parsed,
					onboardingProgress: {
						...parsed.onboardingProgress,
						startTime: new Date(parsed.onboardingProgress.startTime),
						lastActivity: new Date(parsed.onboardingProgress.lastActivity),
					},
				};
			}
		} catch (error) {
			console.error('Failed to load user onboarding state:', error);
		}

		return null;
	}

	// Get user analytics
	public getUserAnalytics(userId?: string): {
		onboardingCompleted: boolean;
		onboardingTime: number;
		tutorialsCompleted: number;
		workflowsCompleted: number;
		achievementLevel: number;
	} {
		if (!this.userState) {
			return {
				onboardingCompleted: false,
				onboardingTime: 0,
				tutorialsCompleted: 0,
				workflowsCompleted: 0,
				achievementLevel: 1,
			};
		}

		const onboardingCompleted = !this.userState.isNewUser &&
			this.userState.onboardingProgress.currentStep === 'completed';

		const onboardingTime = onboardingCompleted
			? (this.userState.onboardingProgress.lastActivity.getTime() -
			   this.userState.onboardingProgress.startTime.getTime()) / 1000
			: 0;

		// Get completed workflows from analytics
		let workflowsCompleted = 0;
		this.userState.toolHistory.forEach(toolId => {
			const analytics = workflowAnalytics.getWorkflowAnalytics(toolId);
			workflowsCompleted += analytics.filter(a => a.completed).length;
		});

		return {
			onboardingCompleted,
			onboardingTime,
			tutorialsCompleted: 0, // Would track tutorial completions
			workflowsCompleted,
			achievementLevel: this.userState.achievementLevel,
		};
	}
}

// Export singleton instance
export const userOnboarding = UserOnboardingManager.getInstance();
