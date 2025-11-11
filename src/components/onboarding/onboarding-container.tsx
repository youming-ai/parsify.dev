'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { OnboardingFlow } from './onboarding-flow';
import { AchievementNotification, AchievementToast } from './achievement-notification';
import { GuidedWorkflows } from './guided-workflows';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { useOnboardingAnalytics } from '@/lib/onboarding-analytics';
import type { Achievement, UserPreferences } from '@/types/onboarding';

// Context for managing onboarding state across the app
interface OnboardingContextType {
	isOnboarding: boolean;
	startOnboarding: () => void;
	skipOnboarding: () => void;
	showTutorial: (tutorialId: string) => void;
	showAchievement: (achievement: Achievement) => void;
	trackProgress: (action: string, data?: any) => void;
	updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error('useOnboarding must be used within an OnboardingProvider');
	}
	return context;
}

interface OnboardingContainerProps {
	children: React.ReactNode;
	autoStart?: boolean;
	showFirstTimeUserPrompt?: boolean;
}

export function OnboardingProvider({
	children,
	autoStart = true,
	showFirstTimeUserPrompt = true
}: OnboardingContainerProps) {
	const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
	const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
	const [showAchievementNotification, setShowAchievementNotification] = useState(false);
	const [showWorkflows, setShowWorkflows] = useState(false);

	const {
		state,
		initializeOnboarding,
		startOnboarding: startStoreOnboarding,
		skipOnboarding: skipStoreOnboarding,
		unlockAchievement,
		trackEvent,
		markToolUsed,
		exploreCategory,
		updatePreferences
	} = useOnboardingStore();

	const analytics = useOnboardingAnalytics();

	// Initialize onboarding on mount
	useEffect(() => {
		initializeOnboarding();

		// Set user ID for analytics
		const userId = localStorage.getItem('user-id') || generateUserId();
		localStorage.setItem('user-id', userId);
		analytics.setUserId(userId);

		// Auto-start for first-time users
		if (autoStart && state?.isFirstTimeUser && showFirstTimeUserPrompt) {
			const timer = setTimeout(() => {
				setIsOnboardingOpen(true);
				startStoreOnboarding();
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, [autoStart, state?.isFirstTimeUser, showFirstTimeUserPrompt]);

	// Track page views and tool interactions
	useEffect(() => {
		const handleToolOpen = (event: CustomEvent) => {
			const { toolId } = event.detail;
			markToolUsed(toolId);
			analytics.trackEvent('tool_opened', { toolId });
		};

		const handleCategoryExplore = (event: CustomEvent) => {
			const { category } = event.detail;
			exploreCategory(category);
			analytics.trackEvent('category_explored', { category });
		};

		window.addEventListener('tool:opened', handleToolOpen as EventListener);
		window.addEventListener('category:explored', handleCategoryExplore as EventListener);

		return () => {
			window.removeEventListener('tool:opened', handleToolOpen as EventListener);
			window.removeEventListener('category:explored', handleCategoryExplore as EventListener);
		};
	}, [markToolUsed, exploreCategory]);

	// Listen for achievement unlocks
	useEffect(() => {
		const handleAchievementUnlock = (event: CustomEvent) => {
			const achievement = event.detail as Achievement;
			showAchievement(achievement);
		};

		window.addEventListener('achievement:unlocked', handleAchievementUnlock as EventListener);

		return () => {
			window.removeEventListener('achievement:unlocked', handleAchievementUnlock as EventListener);
		};
	}, []);

	// Check for achievements to unlock
	useEffect(() => {
		checkAndUnlockAchievements();
	}, [state?.progress]);

	const startOnboarding = () => {
		setIsOnboardingOpen(true);
		startStoreOnboarding();
		analytics.trackEvent('onboarding_started', { trigger: 'manual' });
	};

	const skipOnboarding = () => {
		setIsOnboardingOpen(false);
		skipStoreOnboarding();
		analytics.trackEvent('onboarding_skipped', { reason: 'user_skip' });
	};

	const completeOnboarding = () => {
		setIsOnboardingOpen(false);
		analytics.trackEvent('onboarding_completed', {
			completedAt: new Date(),
			duration: Date.now() - (state?.startedAt?.getTime() || Date.now())
		});
	};

	const showTutorial = (tutorialId: string) => {
		// Implementation for showing specific tutorials
		analytics.trackEvent('tutorial_started', { tutorialId });
	};

	const showAchievement = (achievement: Achievement) => {
		setCurrentAchievement(achievement);
		setShowAchievementNotification(true);

		// Auto-hide after 5 seconds
		setTimeout(() => {
			setShowAchievementNotification(false);
		}, 5000);

		analytics.trackEvent('achievement_unlocked', {
			achievementId: achievement.id,
			points: achievement.points
		});
	};

	const trackProgress = (action: string, data?: any) => {
		trackEvent(action, data);
		analytics.trackEvent(action as any, data);
	};

	const updateUserPreferences = (preferences: Partial<UserPreferences>) => {
		updatePreferences(preferences);
		analytics.trackEvent('preferences_updated', { preferences });
	};

	const checkAndUnlockAchievements = () => {
		if (!state?.progress) return;

		const { toolsTried, categoryExploration, stepsCompleted } = state.progress;

		// Check for tool usage achievements
		if (toolsTried.length === 1) {
			const achievement: Achievement = {
				id: 'first_tool',
				name: 'First Tool Used',
				description: 'You used your first tool!',
				category: 'usage',
				type: 'milestone',
				rarity: 'common',
				points: 10,
				icon: '🔧'
			};
			unlockAchievement('first_tool');
			showAchievement(achievement);
		}

		if (toolsTried.length === 5) {
			const achievement: Achievement = {
				id: 'tool_explorer',
				name: 'Tool Explorer',
				description: 'You\'ve tried 5 different tools!',
				category: 'exploration',
				type: 'milestone',
				rarity: 'common',
				points: 25,
				icon: '🔍'
			};
			unlockAchievement('tool_explorer');
			showAchievement(achievement);
		}

		// Check for category exploration achievements
		const exploredCount = Object.values(categoryExploration).filter(Boolean).length;
		if (exploredCount === 3) {
			const achievement: Achievement = {
				id: 'category_explorer_basic',
				name: 'Category Explorer',
				description: 'You\'ve explored 3 different categories!',
				category: 'exploration',
				type: 'milestone',
				rarity: 'common',
				points: 20,
				icon: '🗺️'
			};
			unlockAchievement('category_explorer_basic');
			showAchievement(achievement);
		}

		// Dispatch achievement unlock event for global listeners
		if (toolsTried.length === 1 || exploredCount === 3) {
			window.dispatchEvent(new CustomEvent('achievement:unlocked', {
				detail: {
					id: toolsTried.length === 1 ? 'first_tool' : 'category_explorer_basic',
					unlockedAt: new Date()
				}
			}));
		}
	};

	const contextValue: OnboardingContextType = {
		isOnboarding: isOnboardingOpen,
		startOnboarding,
		skipOnboarding,
		showTutorial,
		showAchievement,
		trackProgress,
		updateUserPreferences
	};

	return (
		<OnboardingContext.Provider value={contextValue}>
			{children}

			{/* Main Onboarding Flow */}
			<OnboardingFlow
				isOpen={isOnboardingOpen}
				onComplete={completeOnboarding}
				onSkip={skipOnboarding}
			/>

			{/* Achievement Notifications */}
			{currentAchievement && (
				<AchievementNotification
					achievement={currentAchievement}
					isVisible={showAchievementNotification}
					onClose={() => setShowAchievementNotification(false)}
					onViewAchievements={() => setShowWorkflows(true)}
				/>
			)}

			{/* Guided Workflows Modal */}
			{showWorkflows && (
				<div className=\"fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9998]\">
					<div className=\"bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden\">
						<div className=\"p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between\">
							<h2 className=\"text-2xl font-bold text-gray-900 dark:text-white\">
								Learning Center
							</h2>
							<button
								onClick={() => setShowWorkflows(false)}
								className=\"text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200\"
							>
								×
							</button>
						</div>
						<div className=\"p-6 overflow-y-auto max-h-[calc(90vh-100px)]\">
							<GuidedWorkflows />
						</div>
					</div>
				</div>
			)}

			{/* First-time User Prompt */}
			{state?.isFirstTimeUser && showFirstTimeUserPrompt && !isOnboardingOpen && (
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					className=\"fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9997]\"
				>
					<div className=\"bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4\">
						<div className=\"flex items-start gap-3\">
							<div className=\"w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0\">
								<span className=\"text-lg\">👋</span>
							</div>
							<div className=\"flex-1 min-w-0\">
								<h3 className=\"font-semibold text-gray-900 dark:text-white mb-1\">
									Welcome to Parsify.dev!
								</h3>
								<p className=\"text-sm text-gray-600 dark:text-gray-400 mb-3\">
									New here? Take a quick tour to discover 58+ developer tools personalized for you.
								</p>
								<div className=\"flex gap-2\">
									<button
										onClick={startOnboarding}
										className=\"px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors\"
									>
										Start Tour
									</button>
									<button
										onClick={skipOnboarding}
										className=\"px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors\"
									>
										Later
									</button>
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</OnboardingContext.Provider>
	);
}

// Utility component for triggering onboarding actions
interface OnboardingTriggerProps {
	children: React.ReactNode;
	onComplete?: () => void;
}

export function OnboardingTrigger({ children, onComplete }: OnboardingTriggerProps) {
	const { startOnboarding } = useOnboarding();

	const handleClick = () => {
		startOnboarding();
		onComplete?.();
	};

	return (
		<button onClick={handleClick} className=\"w-full h-full\">
			{children}
		</button>
	);
}

// Floating action button for onboarding help
export function OnboardingHelpButton() {
	const { startOnboarding, showWorkflows } = useOnboarding();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className=\"fixed bottom-4 right-4 z-[9996]\">
			<div className=\"relative\">
				{/* Help Button */}
				<button
					onClick={() => setIsOpen(!isOpen)}
					className=\"w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center\"
				>
					<HelpCircle className=\"w-6 h-6\" />
				</button>

				{/* Menu */}
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						className=\"absolute bottom-14 right-0 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden\"
					>
						<button
							onClick={() => {
								startOnboarding();
								setIsOpen(false);
							}}
							className=\"w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700\"
						>
							<div className=\"font-medium text-gray-900 dark:text-white\">🎯 Start Tour</div>
							<div className=\"text-sm text-gray-600 dark:text-gray-400\">Guided onboarding</div>
						</button>
						<button
							onClick={() => {
								showWorkflows();
								setIsOpen(false);
							}}
							className=\"w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors\"
						>
							<div className=\"font-medium text-gray-900 dark:text-white\">📚 Learning Center</div>
							<div className=\"text-sm text-gray-600 dark:text-gray-400\">Tutorials & guides</div>
						</button>
					</motion.div>
				)}
			</div>
		</div>
	);
}

// Hook for checking if user should see onboarding
export function useShouldShowOnboarding() {
	const { state } = useOnboardingStore();

	const isFirstTimeUser = state?.isFirstTimeUser ?? true;
	const hasCompletedOnboarding = state?.completedAt !== undefined;
	const completionRate = state?.progress.percentage ?? 0;

	return {
		shouldShow: isFirstTimeUser && !hasCompletedOnboarding,
		canRestart: hasCompletedOnboarding,
		completionRate,
		isFirstTimeUser,
		hasCompletedOnboarding
	};
}

// Utility function to generate user ID
function generateUserId(): string {
	return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// HelpCircle component import
import { HelpCircle } from 'lucide-react';
