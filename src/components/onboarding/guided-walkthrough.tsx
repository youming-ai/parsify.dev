'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ArrowRight,
	ArrowLeft,
	CheckCircle,
	Circle,
	Play,
	Pause,
	RotateCcw,
	BookOpen,
	Target,
	Zap,
	Info,
	Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Tour, TourStep } from '@/types/onboarding';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

interface GuidedWalkthroughProps {
	tour: Tour;
	isActive: boolean;
	onComplete: () => void;
	onSkip: () => void;
	onStepChange: (stepIndex: number) => void;
}

interface WalkthroughStep {
	id: string;
	title: string;
	description: string;
	content: {
		headline?: string;
		description: string;
		keyPoints: string[];
		examples?: Array<{
			title: string;
			description: string;
			code?: string;
		}>;
		interaction?: {
			type: 'click' | 'type' | 'select' | 'drag';
			selector: string;
			instruction: string;
		};
	};
	validation?: {
		type: 'element_clicked' | 'value_entered' | 'option_selected';
		selector: string;
		expectedValue?: any;
	};
	tips?: string[];
	duration: number;
}

export function GuidedWalkthrough({
	tour,
	isActive,
	onComplete,
	onSkip,
	onStepChange
}: GuidedWalkthroughProps) {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [isCompleted, setIsCompleted] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [startTime, setStartTime] = useState<number>(Date.now());
	const [elapsedTime, setElapsedTime] = useState(0);
	const [validationStatus, setValidationStatus] = useState<'pending' | 'success' | 'error'>('pending');
	const highlightedElement = useRef<HTMLElement | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const { trackEvent, markToolUsed, exploreCategory } = useOnboardingStore();

	const currentStep = tour.steps[currentStepIndex];
	const progress = ((currentStepIndex + 1) / tour.steps.length) * 100;

	// Timer for tracking elapsed time
	useEffect(() => {
		if (isActive && !isPaused && !isCompleted) {
			intervalRef.current = setInterval(() => {
				setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isActive, isPaused, isCompleted, startTime]);

	// Handle element highlighting and validation
	useEffect(() => {
		if (isActive && currentStep.target) {
			const element = document.querySelector(currentStep.target) as HTMLElement;
			highlightedElement.current = element;

			if (element) {
				// Scroll element into view
				element.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'center'
				});

				// Add highlight styles
				const originalStyles = {
					boxShadow: element.style.boxShadow,
					border: element.style.border,
					zIndex: element.style.zIndex,
					position: element.style.position
				};

				element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.3)';
				element.style.border = '2px solid rgb(59, 130, 246)';
				element.style.zIndex = '9999';
				element.style.position = 'relative';

				// Add validation listener if needed
				if (currentStep.actions?.some(action => action.action === 'next')) {
					const handleValidation = () => {
						// Custom validation logic based on step requirements
						setValidationStatus('success');
					};

					element.addEventListener('click', handleValidation);

					return () => {
						element.removeEventListener('click', handleValidation);
						// Restore original styles
						Object.assign(element.style, originalStyles);
					};
				}

				return () => {
					// Restore original styles
					Object.assign(element.style, originalStyles);
				};
			}
		}
	}, [currentStep, currentStepIndex, isActive]);

	const handleNext = () => {
		if (currentStepIndex < tour.steps.length - 1) {
			const nextIndex = currentStepIndex + 1;
			setCurrentStepIndex(nextIndex);
			setValidationStatus('pending');
			onStepChange(nextIndex);
			trackEvent({
				type: 'step_completed',
				stepId: `walkthrough_${tour.id}_${currentStepIndex}`,
				data: {
					tourId: tour.id,
					stepIndex: currentStepIndex,
					elapsedTime: elapsedTime
				}
			});
		} else {
			handleComplete();
		}
	};

	const handlePrevious = () => {
		if (currentStepIndex > 0) {
			const prevIndex = currentStepIndex - 1;
			setCurrentStepIndex(prevIndex);
			setValidationStatus('pending');
			onStepChange(prevIndex);
		}
	};

	const handleComplete = () => {
		setIsCompleted(true);
		trackEvent({
			type: 'onboarding_completed',
			data: {
				tourId: tour.id,
				completedAt: new Date(),
				totalTime: elapsedTime
			}
		});
		onComplete();
	};

	const handleSkip = () => {
		trackEvent({
			type: 'onboarding_abandoned',
			data: { tourId: tour.id, stepIndex: currentStepIndex, reason: 'user_skipped' }
		});
		onSkip();
	};

	const togglePause = () => {
		setIsPaused(!isPaused);
		if (!isPaused) {
			setStartTime(Date.now() - elapsedTime * 1000);
		}
	};

	const resetWalkthrough = () => {
		setCurrentStepIndex(0);
		setIsCompleted(false);
		setIsPaused(false);
		setStartTime(Date.now());
		setElapsedTime(0);
		setValidationStatus('pending');
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const getStepIcon = (stepType: string) => {
		switch (stepType) {
			case 'overview':
				return <Info className=\"w-5 h-5 text-blue-500\" />;
			case 'interaction':
				return <Target className=\"w-5 h-5 text-green-500\" />;
			case 'tip':
				return <Sparkles className=\"w-5 h-5 text-yellow-500\" />;
			case 'action':
				return <Zap className=\"w-5 h-5 text-purple-500\" />;
			default:
				return <Circle className=\"w-5 h-5 text-gray-400\" />;
		}
	};

	if (!isActive) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className=\"fixed inset-0 z-[9998] flex items-center justify-center p-4\"
		>
			{/* Backdrop */}
			<div
				className=\"absolute inset-0 bg-black/50 backdrop-blur-sm\"
				onClick={handleSkip}
			/>

			{/* Main Content */}
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className=\"relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[80vh] overflow-hidden\"
			>
				{/* Header */}
				<div className=\"border-b border-gray-200 dark:border-gray-700 p-6 pb-4\">
					<div className=\"flex items-center justify-between mb-4\">
						<div className=\"flex items-center gap-3\">
							{getStepIcon(currentStep.id.split('-')[0] || 'overview')}
							<div>
								<h2 className=\"text-xl font-bold text-gray-900 dark:text-white\">
									{currentStep.title}
								</h2>
								<p className=\"text-sm text-gray-600 dark:text-gray-400\">
									Step {currentStepIndex + 1} of {tour.steps.length} • {tour.name}
								</p>
							</div>
						</div>

						<div className=\"flex items-center gap-2\">
							{/* Timer */}
							<div className=\"flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md\">
								<span className=\"text-sm font-mono text-gray-600 dark:text-gray-400\">
									{formatTime(elapsedTime)}
								</span>
							</div>

							{/* Pause/Play Button */}
							<Button
								variant=\"outline\"
								size=\"sm\"
								onClick={togglePause}
								disabled={isCompleted}
							>
								{isPaused ? <Play className=\"w-4 h-4\" /> : <Pause className=\"w-4 h-4\" />}
							</Button>

							{/* Reset Button */}
							<Button
								variant=\"outline\"
								size=\"sm\"
								onClick={resetWalkthrough}
							>
								<RotateCcw className=\"w-4 h-4\" />
							</Button>

							{/* Close Button */}
							<Button
								variant=\"ghost\"
								size=\"sm\"
								onClick={handleSkip}
							>
								Skip Tour
							</Button>
						</div>
					</div>

					{/* Progress Bar */}
					<div className=\"space-y-2\">
						<div className=\"flex justify-between text-xs text-gray-500 dark:text-gray-400\">
							<span>Progress</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className=\"h-2\" />
					</div>
				</div>

				{/* Content */}
				<ScrollArea className=\"flex-1 p-6 max-h-[50vh]\">
					<div className=\"space-y-6\">
						{/* Main Content */}
						<div className=\"prose prose-gray dark:prose-invert max-w-none\">
							<p className=\"text-gray-700 dark:text-gray-300 leading-relaxed text-lg\">
								{currentStep.content}
							</p>
						</div>

						{/* Key Points */}
						{currentStep.actions && (
							<Card>
								<CardHeader>
									<CardTitle className=\"flex items-center gap-2\">
										<Target className=\"w-5 h-5\" />
										What You'll Do
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className=\"space-y-2\">
										{currentStep.actions.map((action, index) => (
											<li key={index} className=\"flex items-start gap-2\">
												<span className=\"text-blue-500 mt-0.5\">•</span>
												<span className=\"text-gray-700 dark:text-gray-300\">
													{action.label}
												</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)}

						{/* Tips */}
						{currentStep.allowSkip !== false && (
							<Card>
								<CardHeader>
									<CardTitle className=\"flex items-center gap-2\">
										<Sparkles className=\"w-5 h-5 text-yellow-500\" />
										Pro Tips
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className=\"space-y-3\">
										<div className=\"flex items-start gap-2\">
											<span className=\"text-yellow-500 mt-1\">💡</span>
											<p className=\"text-gray-700 dark:text-gray-300\">
												Take your time to understand each feature before moving to the next step.
											</p>
										</div>
										<div className=\"flex items-start gap-2\">
											<span className=\"text-yellow-500 mt-1\">🎯</span>
											<p className=\"text-gray-700 dark:text-gray-300\">
												Click on the highlighted elements to interact with them.
											</p>
										</div>
										<div className=\"flex items-start gap-2\">
											<span className=\"text-yellow-500 mt-1\">⚡</span>
											<p className=\"text-gray-700 dark:text-gray-300\">
												You can pause the tour at any time and resume later.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Validation Status */}
						{validationStatus !== 'pending' && (
							<div className={`p-4 rounded-md border ${
								validationStatus === 'success'
									? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
									: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
							}`}>
								<div className=\"flex items-center gap-2\">
									{validationStatus === 'success' ? (
										<CheckCircle className=\"w-5 h-5\" />
									) : (
										<Circle className=\"w-5 h-5\" />
									)}
									<span className=\"font-medium\">
										{validationStatus === 'success'
											? 'Great! You completed this step correctly.'
											: 'Please try again or click Next to continue.'
										}
									</span>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Footer */}
				<div className=\"border-t border-gray-200 dark:border-gray-700 p-6 pt-4\">
					<div className=\"flex items-center justify-between\">
						<div className=\"flex items-center gap-2\">
							{/* Step Indicators */}
							{tour.steps.map((step, index) => (
								<button
									key={step.id}
									onClick={() => setCurrentStepIndex(index)}
									className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
										index === currentStepIndex
											? 'bg-blue-500 text-white'
											: index < currentStepIndex
												? 'bg-green-500 text-white'
												: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
									}`}
								>
									{index < currentStepIndex ? (
										<CheckCircle className=\"w-4 h-4\" />
									) : (
										<span className=\"text-sm font-medium\">{index + 1}</span>
									)}
								</button>
							))}
						</div>

						{/* Navigation Buttons */}
						<div className=\"flex items-center gap-2\">
							<Button
								variant=\"outline\"
								onClick={handlePrevious}
								disabled={currentStepIndex === 0}
							>
								<ArrowLeft className=\"w-4 h-4 mr-2\" />
								Previous
							</Button>

							{currentStepIndex < tour.steps.length - 1 ? (
								<Button onClick={handleNext}>
									Next
									<ArrowRight className=\"w-4 h-4 ml-2\" />
								</Button>
							) : (
								<Button onClick={handleComplete} className=\"bg-green-600 hover:bg-green-700\">
									Complete Tour
									<CheckCircle className=\"w-4 h-4 ml-2\" />
								</Button>
							)}
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

// Hook for managing walkthrough state
export function useWalkthrough(tourId: string) {
	const [tour, setTour] = useState<Tour | null>(null);
	const [isActive, setIsActive] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);

	const { trackEvent } = useOnboardingStore();

	// Load tour data (in a real app, this would come from an API)
	useEffect(() => {
		// Mock tour data for platform overview
		const mockTour: Tour = {
			id: tourId,
			name: 'Platform Overview Tour',
			description: 'Get familiar with the Parsify.dev platform and its key features',
			steps: [
				{
					id: 'overview-welcome',
					title: 'Welcome to Parsify.dev',
					content: 'This tour will guide you through the main features of our developer tools platform.',
					target: '[data-testid=\"tools-grid\"]',
					position: 'center',
					showBackdrop: true,
					allowSkip: true,
					actions: [
						{
							label: 'Learn about tool categories',
							action: 'next'
						}
					]
				},
				{
					id: 'overview-categories',
					title: 'Tool Categories',
					content: 'Discover tools organized by category: JSON Processing, Code Execution, File Processing, Network Utilities, Text Processing, and Security.',
					target: '[data-testid=\"category-tabs\"]',
					position: 'bottom',
					showBackdrop: false,
					allowSkip: true,
					actions: [
						{
							label: 'Click on a category to explore',
							action: 'next'
						}
					]
				},
				{
					id: 'overview-search',
					title: 'Smart Search',
					content: 'Use our intelligent search to find tools by name, functionality, or use case.',
					target: '[data-testid=\"search-input\"]',
					position: 'bottom',
					showBackdrop: false,
					allowSkip: true,
					actions: [
						{
							label: 'Try searching for a tool',
							action: 'next'
						}
					]
				},
				{
					id: 'overview-personalization',
					title: 'Personalization',
					content: 'Get personalized tool recommendations based on your role and preferences.',
					target: '[data-testid=\"recommendations-section\"]',
					position: 'left',
					showBackdrop: false,
					allowSkip: true,
					actions: [
						{
							label: 'Set up your preferences',
							action: 'next'
						}
					]
				},
				{
					id: 'overview-achievements',
					title: 'Achievements & Progress',
					content: 'Track your learning progress and unlock achievements as you explore tools.',
					target: '[data-testid=\"achievements-panel\"]',
					position: 'right',
					showBackdrop: false,
					allowSkip: true,
					actions: [
						{
							label: 'View your achievements',
							action: 'next'
						}
					]
				}
			],
			triggerConditions: [
				{
					type: 'page_visit',
					value: '/tools'
				}
			],
			isRepeatable: true,
			priority: 1
		};

		setTour(mockTour);
	}, [tourId]);

	const startWalkthrough = () => {
		if (tour) {
			setIsActive(true);
			setCurrentStep(0);
			trackEvent({
				type: 'step_started',
				stepId: `walkthrough_${tour.id}_start`,
				data: { tourId: tour.id }
			});
		}
	};

	const completeWalkthrough = () => {
		setIsActive(false);
		trackEvent({
			type: 'onboarding_completed',
			data: { tourId: tourId, completedAt: new Date() }
		});
	};

	const skipWalkthrough = () => {
		setIsActive(false);
		trackEvent({
			type: 'onboarding_abandoned',
			data: { tourId: tourId, stepIndex: currentStep, reason: 'user_skipped' }
		});
	};

	const handleStepChange = (stepIndex: number) => {
		setCurrentStep(stepIndex);
	};

	return {
		tour,
		isActive,
		currentStep,
		startWalkthrough,
		completeWalkthrough,
		skipWalkthrough,
		handleStepChange
	};
}
