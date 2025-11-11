'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Info, Sparkles, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Tutorial, TutorialStep } from '@/types/onboarding';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

interface TutorialOverlayProps {
	tutorial: Tutorial;
	isOpen: boolean;
	onClose: () => void;
	onComplete?: () => void;
	onStepChange?: (stepIndex: number) => void;
}

interface StepAction {
	label: string;
	action: () => void;
	variant?: 'default' | 'outline' | 'secondary';
}

export function TutorialOverlay({
	tutorial,
	isOpen,
	onClose,
	onComplete,
	onStepChange
}: TutorialOverlayProps) {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
	const [isActionCompleted, setIsActionCompleted] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);

	const { trackEvent } = useOnboardingStore();

	const currentStep = tutorial.steps[currentStepIndex];
	const progress = ((currentStepIndex + 1) / tutorial.steps.length) * 100;

	// Handle element highlighting
	useEffect(() => {
		if (currentStep.elementSelector) {
			const element = document.querySelector(currentStep.elementSelector) as HTMLElement;
			setHighlightedElement(element);

			if (element) {
				// Scroll element into view
				element.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'center'
				});

				// Add highlight styles
				element.style.position = 'relative';
				element.style.zIndex = '9999';
				element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.3)';
				element.style.transition = 'all 0.3s ease';

				return () => {
					// Cleanup styles
					element.style.position = '';
					element.style.zIndex = '';
					element.style.boxShadow = '';
					element.style.transition = '';
				};
			}
		}
	}, [currentStep.elementSelector, currentStepIndex]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			switch (e.key) {
				case 'Escape':
					onClose();
					break;
				case 'ArrowRight':
					handleNext();
					break;
				case 'ArrowLeft':
					handlePrevious();
					break;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, currentStepIndex]);

	const handleNext = () => {
		if (currentStepIndex < tutorial.steps.length - 1) {
			const nextIndex = currentStepIndex + 1;
			setCurrentStepIndex(nextIndex);
			setIsActionCompleted(false);
			onStepChange?.(nextIndex);
			trackEvent({
				type: 'step_completed',
				stepId: `tutorial_${tutorial.id}_${currentStepIndex}`,
				data: { tutorialId: tutorial.id, stepIndex: currentStepIndex }
			});
		} else {
			handleComplete();
		}
	};

	const handlePrevious = () => {
		if (currentStepIndex > 0) {
			const prevIndex = currentStepIndex - 1;
			setCurrentStepIndex(prevIndex);
			setIsActionCompleted(false);
			onStepChange?.(prevIndex);
		}
	};

	const handleComplete = () => {
		trackEvent({
			type: 'onboarding_completed',
			data: { tutorialId: tutorial.id, completedAt: new Date() }
		});
		onComplete?.();
		onClose();
	};

	const handleStepAction = () => {
		if (currentStep.interactionType && currentStep.elementSelector) {
			const element = document.querySelector(currentStep.elementSelector) as HTMLElement;
			if (element) {
				switch (currentStep.interactionType) {
					case 'click':
						element.click();
						break;
					case 'focus':
						element.focus();
						break;
					case 'scroll':
						element.scrollIntoView({ behavior: 'smooth' });
						break;
				}
				setIsActionCompleted(true);
			}
		}
	};

	const getStepActions = (): StepAction[] => {
		const actions: StepAction[] = [];

		if (currentStep.type === 'interaction' && !isActionCompleted) {
			actions.push({
				label: `Try ${currentStep.expectedAction || 'this action'}`,
				action: handleStepAction,
				variant: 'default'
			});
		}

		if (currentStepIndex < tutorial.steps.length - 1) {
			actions.push({
				label: 'Next',
				action: handleNext,
				variant: 'default'
			});
		} else {
			actions.push({
				label: 'Complete Tutorial',
				action: handleComplete,
				variant: 'default'
			});
		}

		if (currentStepIndex > 0) {
			actions.unshift({
				label: 'Previous',
				action: handlePrevious,
				variant: 'outline'
			});
		}

		if (tutorial.isRepeatable || currentStepIndex > 0) {
			actions.push({
				label: 'Skip Tutorial',
				action: onClose,
				variant: 'secondary'
			});
		}

		return actions;
	};

	const getStepIcon = () => {
		switch (currentStep.type) {
			case 'instruction':
				return <Info className=\"w-5 h-5 text-blue-500\" />;
			case 'interaction':
				return <Target className=\"w-5 h-5 text-green-500\" />;
			case 'quiz':
				return <Sparkles className=\"w-5 h-5 text-purple-500\" />;
			case 'demonstration':
				return <Zap className=\"w-5 h-5 text-yellow-500\" />;
			default:
				return <Info className=\"w-5 h-5 text-gray-500\" />;
		}
	};

	const getTooltipPosition = () => {
		if (!currentStep.elementSelector || !highlightedElement) {
			return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
		}

		const rect = highlightedElement.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		// Default to bottom center
		let top = rect.bottom + 20;
		let left = rect.left + rect.width / 2;
		let transform = 'translateX(-50%)';

		// Adjust if tooltip would go off screen
		if (top + 300 > viewportHeight) {
			// Place above the element
			top = rect.top - 20;
			transform = 'translateX(-50%) translateY(-100%)';
		}

		if (left - 150 < 0) {
			// Align to left
			left = rect.left + 20;
			transform = 'translateY(-100%)';
		} else if (left + 150 > viewportWidth) {
			// Align to right
			left = rect.right - 20;
			transform = 'translateY(-100%) translateX(-100%)';
		}

		return { top: `${top}px`, left: `${left}px`, transform };
	};

	if (!isOpen) return null;

	return createPortal(
		<AnimatePresence>
			<motion.div
				ref={overlayRef}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className=\"fixed inset-0 z-[9998] pointer-events-none\"
			>
				{/* Backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.7 }}
					exit={{ opacity: 0 }}
					className=\"absolute inset-0 bg-black pointer-events-auto\"
					onClick={onClose}
				/>

				{/* Tooltip */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: 20 }}
					style={getTooltipPosition()}
					className=\"absolute z-[9999] pointer-events-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-6\"
				>
					{/* Header */}
					<div className=\"flex items-start justify-between mb-4\">
						<div className=\"flex items-center gap-2\">
							{getStepIcon()}
							<div>
								<h3 className=\"font-semibold text-gray-900 dark:text-white text-lg\">
									{currentStep.title}
								</h3>
								<div className=\"flex items-center gap-2 mt-1\">
									<Badge variant=\"secondary\" className=\"text-xs\">
										Step {currentStepIndex + 1} of {tutorial.steps.length}
									</Badge>
									{currentStep.timeLimit && (
										<Badge variant=\"outline\" className=\"text-xs\">
											⏱️ {currentStep.timeLimit}s
										</Badge>
									)}
								</div>
							</div>
						</div>
						<Button
							variant=\"ghost\"
							size=\"sm\"
							onClick={onClose}
							className=\"h-8 w-8 p-0\"
						>
							<X className=\"w-4 h-4\" />
						</Button>
					</div>

					{/* Progress Bar */}
					<div className=\"mb-4\">
						<Progress value={progress} className=\"h-2\" />
					</div>

					{/* Content */}
					<div className=\"space-y-3 mb-6\">
						<p className=\"text-gray-700 dark:text-gray-300 leading-relaxed\">
							{currentStep.content}
						</p>

						{currentStep.interactionType && !isActionCompleted && (
							<div className=\"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3\">
								<p className=\"text-sm text-blue-700 dark:text-blue-300 font-medium\">
									💡 {currentStep.expectedAction || 'Follow the highlighted element'}
								</p>
							</div>
						)}

						{isActionCompleted && (
							<div className=\"bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3\">
								<p className=\"text-sm text-green-700 dark:text-green-300 font-medium\">
									✅ Great! You completed this step.
								</p>
							</div>
						)}

						{currentStep.hint && !isActionCompleted && (
							<details className=\"text-sm\">
								<summary className=\"cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200\">
									💡 Need a hint?
								</summary>
								<p className=\"mt-2 text-gray-600 dark:text-gray-300 italic\">
									{currentStep.hint}
								</p>
							</details>
						)}
					</div>

					{/* Actions */}
					<div className=\"flex gap-2 justify-end\">
						{getStepActions().map((action, index) => (
							<Button
								key={index}
								variant={action.variant === 'default' ? 'default' : 'outline'}
								size=\"sm\"
								onClick={action.action}
								disabled={action.variant === 'default' && currentStep.type === 'interaction' && !isActionCompleted}
							>
								{action.label}
							</Button>
						))}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body
	);
}

// Hook for managing tutorial state
export function useTutorial(tutorialId: string) {
	const [tutorial, setTutorial] = useState<Tutorial | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);

	const { trackEvent } = useOnboardingStore();

	// Load tutorial data (in a real app, this would come from an API)
	useEffect(() => {
		// Mock tutorial data
		const mockTutorial: Tutorial = {
			id: tutorialId,
			name: 'Platform Overview',
			description: 'Learn the basics of Parsify.dev',
			steps: [
				{
					id: 'welcome',
					title: 'Welcome to Parsify.dev',
					content: 'Let\'s explore the powerful developer tools available on this platform.',
					type: 'instruction',
					elementSelector: '[data-testid=\"tools-grid\"]'
				},
				{
					id: 'search',
					title: 'Search for Tools',
					content: 'Use the search bar to quickly find tools by name, category, or functionality.',
					type: 'instruction',
					elementSelector: '[data-testid=\"search-input\"]',
					interactionType: 'click',
					expectedAction: 'Click the search input'
				},
				{
					id: 'categories',
					title: 'Browse Categories',
					content: 'Explore tools by category to discover new functionality.',
					type: 'interaction',
					elementSelector: '[data-testid=\"category-tabs\"]',
					interactionType: 'click',
					expectedAction: 'Click on a category tab'
				}
			],
			category: 'general',
			difficulty: 'beginner',
			duration: 5,
			isInteractive: true
		};

		setTutorial(mockTutorial);
	}, [tutorialId]);

	const startTutorial = () => {
		if (tutorial) {
			setIsOpen(true);
			setCurrentStep(0);
			trackEvent({
				type: 'step_started',
				stepId: `tutorial_${tutorial.id}_start`,
				data: { tutorialId: tutorial.id }
			});
		}
	};

	const closeTutorial = () => {
		setIsOpen(false);
		trackEvent({
			type: 'onboarding_abandoned',
			data: { tutorialId: tutorialId, stepIndex: currentStep }
		});
	};

	const completeTutorial = () => {
		setIsOpen(false);
		trackEvent({
			type: 'onboarding_completed',
			data: { tutorialId: tutorialId, completedAt: new Date() }
		});
	};

	const handleStepChange = (stepIndex: number) => {
		setCurrentStep(stepIndex);
	};

	return {
		tutorial,
		isOpen,
		currentStep,
		startTutorial,
		closeTutorial,
		completeTutorial,
		handleStepChange
	};
}
