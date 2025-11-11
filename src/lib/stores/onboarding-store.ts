import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type {
	OnboardingState,
	OnboardingStep,
	UserPreferences,
	ToolRecommendation,
	Achievement,
	OnboardingEvent,
	DiscoverySession,
	Tutorial
} from '@/types/onboarding';
import type { Tool, ToolCategory } from '@/types/tools';
import { toolsData } from '@/data/tools-data';

// Default onboarding steps
const defaultOnboardingSteps: OnboardingStep[] = [
	{
		id: 'welcome',
		title: 'Welcome to Parsify.dev',
		description: 'Discover powerful developer tools designed to make your work easier and more productive.',
		type: 'welcome',
		status: 'pending',
		estimatedTime: 2,
		isSkippable: false,
		content: {
			headline: 'Welcome to Your Developer Toolkit',
			description: 'Parsify.dev offers 58+ developer tools across 6 categories, all running securely in your browser.',
			tips: [
				'This quick tour will help you discover tools most relevant to your needs',
				'You can skip any step and come back later',
				'Your progress is automatically saved'
			]
		},
		actions: [
			{
				id: 'get-started',
				label: 'Get Started',
				type: 'primary',
				action: 'next_step'
			}
		]
	},
	{
		id: 'role-selection',
		title: 'Tell Us About Yourself',
		description: 'Help us personalize your experience by selecting your role and experience level.',
		type: 'tutorial',
		status: 'pending',
		estimatedTime: 3,
		isSkippable: true,
		content: {
			description: 'This information helps us recommend the most relevant tools for your specific needs.',
		},
		completionCriteria: {
			type: 'action_completed',
			value: 'preferences_selected'
		}
	},
	{
		id: 'category-exploration',
		title: 'Explore Tool Categories',
		description: 'Discover our 6 main tool categories and see what each one offers.',
		type: 'exploration',
		status: 'pending',
		estimatedTime: 5,
		isSkippable: true,
		content: {
			description: 'Take a moment to explore different categories. Click on any category to see its tools.',
		},
		completionCriteria: {
			type: 'category_explored',
			value: 3 // Explore at least 3 categories
		}
	},
	{
		id: 'first-tool',
		title: 'Try Your First Tool',
		description: 'Select a tool that interests you and try it out with our guidance.',
		type: 'interaction',
		status: 'pending',
		estimatedTime: 7,
		isSkippable: true,
		content: {
			description: 'We\'ll guide you through using a tool with step-by-step instructions.',
		},
		completionCriteria: {
			type: 'tool_used',
			value: 1 // Use at least 1 tool
		}
	},
	{
		id: 'recommendations',
		title: 'Your Personalized Recommendations',
		description: 'Based on your profile, here are tools we think you\'ll love.',
		type: 'recommendation',
		status: 'pending',
		estimatedTime: 4,
		isSkippable: true,
		content: {
			description: 'We\'ve selected tools that match your role, interests, and workflow preferences.',
		}
	},
	{
		id: 'completion',
		title: 'You\'re All Set!',
		description: 'Congratulations! You\'ve completed the onboarding and are ready to be productive.',
		type: 'achievement',
		status: 'pending',
		estimatedTime: 2,
		isSkippable: false,
		content: {
			headline: 'Welcome to the Parsify.dev Community!',
			description: 'You now have access to 58+ developer tools. Start exploring and make your development workflow more efficient.',
			tips: [
				'Check your achievements page for badges you\'ve earned',
				'Use the search bar to quickly find tools',
				'Bookmark your favorite tools for easy access'
			]
		},
		completionCriteria: {
			type: 'action_completed',
			value: 'onboarding_completed'
		}
	}
];

// Default achievements
const defaultAchievements: Achievement[] = [
	{
		id: 'first_steps',
		name: 'First Steps',
		description: 'Complete the onboarding tutorial',
		category: 'exploration',
		type: 'milestone',
		rarity: 'common',
		points: 10,
		icon: '🚀'
	},
	{
		id: 'category_explorer',
		name: 'Category Explorer',
		description: 'Explore all 6 tool categories',
		category: 'exploration',
		type: 'collection',
		rarity: 'common',
		points: 15,
		icon: '🗺️'
	},
	{
		id: 'tool_pioneer',
		name: 'Tool Pioneer',
		description: 'Try your first 5 tools',
		category: 'usage',
		type: 'milestone',
		rarity: 'common',
		points: 20,
		icon: '🔧'
	},
	{
		id: 'json_master',
		name: 'JSON Master',
		description: 'Use all JSON processing tools',
		category: 'expertise',
		type: 'collection',
		rarity: 'rare',
		points: 50,
		icon: '📄'
	},
	{
		id: 'security_expert',
		name: 'Security Expert',
		description: 'Use all security and encryption tools',
		category: 'expertise',
		type: 'collection',
		rarity: 'epic',
		points: 75,
		icon: '🔒'
	},
	{
		id: 'daily_user',
		name: 'Daily User',
		description: 'Use Parsify.dev for 7 consecutive days',
		category: 'usage',
		type: 'streak',
		rarity: 'rare',
		points: 30,
		icon: '📅'
	},
	{
		id: 'power_user',
		name: 'Power User',
		description: 'Use 25 different tools',
		category: 'expertise',
		type: 'collection',
		rarity: 'epic',
		points: 100,
		icon: '⚡'
	},
	{
		id: 'tool_virtuoso',
		name: 'Tool Virtuoso',
		description: 'Use all 58 available tools',
		category: 'expertise',
		type: 'collection',
		rarity: 'legendary',
		points: 200,
		icon: '👑'
	}
];

interface OnboardingStore {
	// State
	state: OnboardingState | null;
	steps: OnboardingStep[];
	achievements: Achievement[];
	currentTutorial: Tutorial | null;
	discoverySession: DiscoverySession | null;
	events: OnboardingEvent[];

	// Actions
	initializeOnboarding: () => void;
	startOnboarding: () => void;
	skipOnboarding: () => void;
	completeStep: (stepId: string) => void;
	skipStep: (stepId: string, reason?: string) => void;
	goToStep: (stepId: string) => void;
	updatePreferences: (preferences: Partial<UserPreferences>) => void;
	updateProgress: (progress: Partial<OnboardingState['progress']>) => void;
	trackEvent: (event: Omit<OnboardingEvent, 'timestamp' | 'sessionId'>) => void;
	unlockAchievement: (achievementId: string) => void;
	generateRecommendations: (preferences: UserPreferences) => void;
	markToolUsed: (toolId: string) => void;
	exploreCategory: (category: ToolCategory) => void;
	startDiscoverySession: (type: DiscoverySession['type']) => void;
	completeDiscoverySession: (successful: boolean) => void;
	resetOnboarding: () => void;
	getStepById: (stepId: string) => OnboardingStep | undefined;
	getCurrentStep: () => OnboardingStep | undefined;
	getNextStep: () => OnboardingStep | undefined;
	getPreviousStep: () => OnboardingStep | undefined;
	isStepCompleted: (stepId: string) => boolean;
	getProgressPercentage: () => number;
}

export const useOnboardingStore = create<OnboardingStore>()(
	subscribeWithSelector(
		persist(
			(set, get) => ({
				// Initial state
				state: null,
				steps: defaultOnboardingSteps,
				achievements: defaultAchievements,
				currentTutorial: null,
				discoverySession: null,
				events: [],

				// Actions
				initializeOnboarding: () => {
					const existingState = get().state;

					if (!existingState) {
						const initialState: OnboardingState = {
							id: `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							isFirstTimeUser: true,
							currentStep: defaultOnboardingSteps[0],
							completedSteps: [],
							progress: {
								percentage: 0,
								stepsCompleted: 0,
								totalSteps: defaultOnboardingSteps.length,
								timeSpent: 0,
								categoryExploration: {},
								toolsTried: [],
								featuresDiscovered: []
							},
							preferences: {
								role: 'other',
								experienceLevel: 'intermediate',
								interests: [],
								preferredCategories: [],
								workflowPreference: 'quick-tasks',
								notificationSettings: {
									tips: true,
									newFeatures: true,
									productivity: false,
									achievements: true
								},
								themePreference: 'system'
							},
							recommendations: [],
							startedAt: new Date(),
							lastActivity: new Date()
						};

						set({ state: initialState });
					}
				},

				startOnboarding: () => {
					const state = get().state;
					if (!state) {
						get().initializeOnboarding();
					}

					set((prevState) => ({
						steps: prevState.steps.map(step =>
							step.id === 'welcome'
								? { ...step, status: 'in_progress' as const }
								: step.status === 'locked' ? step : { ...step, status: 'pending' as const }
						)
					}));

					get().trackEvent({
						type: 'step_started',
						stepId: 'welcome',
						data: { timestamp: new Date() }
					});
				},

				skipOnboarding: () => {
					set((prevState) => ({
						state: prevState.state ? {
							...prevState.state,
							completedAt: new Date(),
							skipReasons: ['user_skipped']
						} : null,
						steps: prevState.steps.map(step => ({ ...step, status: 'skipped' as const }))
					}));

					get().trackEvent({
						type: 'onboarding_abandoned',
						data: { reason: 'user_skipped' }
					});
				},

				completeStep: (stepId: string) => {
					const currentSteps = get().steps;
					const stepIndex = currentSteps.findIndex(s => s.id === stepId);
					const nextStep = currentSteps[stepIndex + 1];

					set((prevState) => {
						const updatedSteps = prevState.steps.map(step =>
							step.id === stepId
								? { ...step, status: 'completed' as const }
								: step.id === nextStep?.id && step.status === 'pending'
									? { ...step, status: 'in_progress' as const }
									: step
						);

						const completedSteps = [...prevState.state?.completedSteps || [], stepId];
						const stepsCompleted = completedSteps.length;
						const totalSteps = updatedSteps.length;
						const percentage = Math.round((stepsCompleted / totalSteps) * 100);

						const newState = prevState.state ? {
							...prevState.state,
							currentStep: nextStep || prevState.state.currentStep,
							completedSteps,
							progress: {
								...prevState.state.progress,
								percentage,
								stepsCompleted,
								lastActivity: new Date()
							}
						} : null;

						return {
							steps: updatedSteps,
							state: newState
						};
					});

					get().trackEvent({
						type: 'step_completed',
						stepId,
						data: { stepIndex }
					});

					// Check if onboarding is complete
					if (nextStep?.id === 'completion') {
						get().unlockAchievement('first_steps');
					}
				},

				skipStep: (stepId: string, reason?: string) => {
					const currentSteps = get().steps;
					const stepIndex = currentSteps.findIndex(s => s.id === stepId);
					const nextStep = currentSteps[stepIndex + 1];

					set((prevState) => {
						const updatedSteps = prevState.steps.map(step =>
							step.id === stepId
								? { ...step, status: 'skipped' as const }
								: step.id === nextStep?.id && step.status === 'pending'
									? { ...step, status: 'in_progress' as const }
									: step
						);

						const newState = prevState.state ? {
							...prevState.state,
							currentStep: nextStep || prevState.state.currentStep,
							skipReasons: [...(prevState.state.skipReasons || []), reason || 'user_skipped'],
							lastActivity: new Date()
						} : null;

						return {
							steps: updatedSteps,
							state: newState
						};
					});

					get().trackEvent({
						type: 'step_skipped',
						stepId,
						data: { reason }
					});
				},

				goToStep: (stepId: string) => {
					const targetStep = get().steps.find(s => s.id === stepId);
					if (targetStep) {
						set((prevState) => ({
							state: prevState.state ? {
								...prevState.state,
								currentStep: targetStep,
								lastActivity: new Date()
							} : null
						}));

						get().trackEvent({
							type: 'step_started',
							stepId,
							data: { navigated: true }
						});
					}
				},

				updatePreferences: (preferences: Partial<UserPreferences>) => {
					set((prevState) => ({
						state: prevState.state ? {
							...prevState.state,
							preferences: {
								...prevState.state.preferences,
								...preferences
							},
							lastActivity: new Date()
						} : null
					}));

					get().trackEvent({
						type: 'preference_selected',
						data: { preferences }
					});
				},

				updateProgress: (progress: Partial<OnboardingState['progress']>) => {
					set((prevState) => ({
						state: prevState.state ? {
							...prevState.state,
							progress: {
								...prevState.state.progress,
								...progress
							},
							lastActivity: new Date()
						} : null
					}));
				},

				trackEvent: (event) => {
					const sessionId = get().state?.id || 'unknown';
					const userId = get().state?.userId;

					const fullEvent: OnboardingEvent = {
						...event,
						timestamp: new Date(),
						sessionId,
						userId
					};

					set((prevState) => ({
						events: [...prevState.events, fullEvent]
					}));
				},

				unlockAchievement: (achievementId: string) => {
					set((prevState) => ({
						achievements: prevState.achievements.map(achievement =>
							achievement.id === achievementId
								? { ...achievement, unlockedAt: new Date() }
								: achievement
						)
					}));

					get().trackEvent({
						type: 'onboarding_completed',
						data: { achievementId }
					});
				},

				generateRecommendations: (preferences: UserPreferences) => {
					const recommendations = generateToolRecommendations(preferences);

					set((prevState) => ({
						state: prevState.state ? {
							...prevState.state,
							recommendations,
							lastActivity: new Date()
						} : null
					}));
				},

				markToolUsed: (toolId: string) => {
					set((prevState) => {
						const toolsTried = prevState.state?.progress.toolsTried || [];
						if (!toolsTried.includes(toolId)) {
							const updatedToolsTried = [...toolsTried, toolId];

							return {
								state: prevState.state ? {
									...prevState.state,
									progress: {
										...prevState.state.progress,
										toolsTried: updatedToolsTried
									},
									lastActivity: new Date()
								} : null
							};
						}
						return prevState;
					});

					get().trackEvent({
						type: 'tool_opened',
						data: { toolId }
					});

					// Check for achievement unlocks
					const toolsTried = get().state?.progress.toolsTried || [];
					if (toolsTried.length === 1) {
						get().unlockAchievement('tool_pioneer');
					} else if (toolsTried.length === 5) {
						get().unlockAchievement('category_explorer');
					} else if (toolsTried.length === 25) {
						get().unlockAchievement('power_user');
					} else if (toolsTried.length === 58) {
						get().unlockAchievement('tool_virtuoso');
					}
				},

				exploreCategory: (category: ToolCategory) => {
					set((prevState) => {
						const categoryExploration = prevState.state?.progress.categoryExploration || {};
						const updatedCategoryExploration = {
							...categoryExploration,
							[category]: true
						};

						const exploredCategories = Object.values(updatedCategoryExploration).filter(Boolean).length;

						return {
							state: prevState.state ? {
								...prevState.state,
								progress: {
									...prevState.state.progress,
									categoryExploration: updatedCategoryExploration,
									featuresDiscovered: [...(prevState.state.progress.featuresDiscovered || []), `explored_${category}`]
								},
								lastActivity: new Date()
							} : null
						};
					});

					get().trackEvent({
						type: 'category_explored',
						data: { category }
					});

					// Check for category explorer achievement
					const categoryExploration = get().state?.progress.categoryExploration || {};
					const exploredCount = Object.values(categoryExploration).filter(Boolean).length;
					if (exploredCount === 6) {
						get().unlockAchievement('category_explorer');
					}
				},

				startDiscoverySession: (type: DiscoverySession['type']) => {
					const session: DiscoverySession = {
						id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						type,
						categories: [],
						recommendations: [],
						userInteractions: [],
						startedAt: new Date(),
						successful: false
					};

					set({ discoverySession: session });
				},

				completeDiscoverySession: (successful: boolean) => {
					set((prevState) => ({
						discoverySession: prevState.discoverySession ? {
							...prevState.discoverySession,
							completedAt: new Date(),
							successful
						} : null
					}));
				},

				resetOnboarding: () => {
					set({
						state: null,
						steps: defaultOnboardingSteps,
						achievements: defaultAchievements,
						currentTutorial: null,
						discoverySession: null,
						events: []
					});
				},

				// Helper methods
				getStepById: (stepId: string) => {
					return get().steps.find(step => step.id === stepId);
				},

				getCurrentStep: () => {
					return get().state?.currentStep;
				},

				getNextStep: () => {
					const currentSteps = get().steps;
					const currentStepId = get().state?.currentStep?.id;
					const currentIndex = currentSteps.findIndex(s => s.id === currentStepId);
					return currentSteps[currentIndex + 1];
				},

				getPreviousStep: () => {
					const currentSteps = get().steps;
					const currentStepId = get().state?.currentStep?.id;
					const currentIndex = currentSteps.findIndex(s => s.id === currentStepId);
					return currentSteps[currentIndex - 1];
				},

				isStepCompleted: (stepId: string) => {
					const step = get().steps.find(s => s.id === stepId);
					return step?.status === 'completed';
				},

				getProgressPercentage: () => {
					return get().state?.progress.percentage || 0;
				}
			}),
			{
				name: 'parsify-onboarding-storage',
				partialize: (state) => ({
					state: state.state,
					achievements: state.achievements,
					events: state.events.slice(-100) // Keep only last 100 events
				})
			}
		)
	)
);

// Helper function to generate tool recommendations based on user preferences
function generateToolRecommendations(preferences: UserPreferences): ToolRecommendation[] {
	const recommendations: ToolRecommendation[] = [];

	toolsData.forEach((tool) => {
		let score = 0;
		const reasons: string[] = [];

		// Role-based scoring
		if (preferences.role === 'frontend-developer') {
			if (tool.tags.includes('json') || tool.tags.includes('format')) {
				score += 30;
				reasons.push('Essential for frontend development');
			}
			if (tool.tags.includes('validator')) {
				score += 20;
				reasons.push('Helps catch errors early');
			}
		} else if (preferences.role === 'backend-developer') {
			if (tool.tags.includes('hash') || tool.tags.includes('security')) {
				score += 25;
				reasons.push('Important for backend security');
			}
			if (tool.tags.includes('api') || tool.tags.includes('http')) {
				score += 30;
				reasons.push('Essential for API development');
			}
		} else if (preferences.role === 'devops-engineer') {
			if (tool.tags.includes('security') || tool.tags.includes('encryption')) {
				score += 35;
				reasons.push('Critical for DevOps workflows');
			}
			if (tool.tags.includes('automation') || tool.tags.includes('batch')) {
				score += 25;
				reasons.push('Useful for automation tasks');
			}
		}

		// Experience level scoring
		if (preferences.experienceLevel === 'beginner') {
			if (tool.difficulty === 'beginner') {
				score += 20;
				reasons.push('Perfect for beginners');
			}
			if (tool.isPopular) {
				score += 15;
				reasons.push('Popular and well-documented');
			}
		} else if (preferences.experienceLevel === 'advanced' || preferences.experienceLevel === 'expert') {
			if (tool.difficulty === 'advanced' || tool.difficulty === 'intermediate') {
				score += 15;
				reasons.push('Matches your skill level');
			}
			if (tool.isNew) {
				score += 10;
				reasons.push('Cutting-edge functionality');
			}
		}

		// Interest-based scoring
		preferences.interests.forEach(interest => {
			if (tool.tags.includes(interest.toLowerCase())) {
				score += 20;
				reasons.push(`Matches your interest in ${interest}`);
			}
		});

		// Category preference scoring
		if (preferences.preferredCategories.includes(tool.category as ToolCategory)) {
			score += 25;
			reasons.push(`In your preferred category`);
		}

		// Popularity bonus
		if (tool.isPopular) {
			score += 10;
			reasons.push('Highly rated by users');
		}

		// Add recommendation if score is above threshold
		if (score >= 20) {
			recommendations.push({
				id: `rec_${tool.id}_${Math.random().toString(36).substr(2, 9)}`,
				toolId: tool.id,
				score: Math.min(score, 100),
				reason: {
					type: 'role_match',
					description: reasons[0] || 'Recommended based on your profile',
					confidence: score / 100,
					factors: reasons
				},
				category: tool.category as ToolCategory,
				priority: score >= 50 ? 'high' : score >= 35 ? 'medium' : 'low',
				isPersonalized: true
			});
		}
	});

	// Sort by score and return top 10
	return recommendations
		.sort((a, b) => b.score - a.score)
		.slice(0, 10);
}

export default useOnboardingStore;
