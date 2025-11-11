/**
 * User Onboarding Wizard Component
 * Interactive onboarding experience for new users
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Play,
	SkipForward,
	ChevronRight,
	ChevronLeft,
	CheckCircle,
	Sparkles,
	Target,
	Zap,
	BookOpen,
	Settings,
	Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { userOnboarding } from '@/lib/workflows/user-onboarding';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';
import { workflowManager } from '@/lib/workflows/workflow-manager';
import type { OnboardingStep, UserOnboardingState } from '@/lib/workflows/user-onboarding';

interface UserOnboardingWizardProps {
	onComplete?: () => void;
	onSkip?: () => void;
	className?: string;
}

export function UserOnboardingWizard({
	onComplete,
	onSkip,
	className,
}: UserOnboardingWizardProps) {
	const [userState, setUserState] = React.useState<UserOnboardingState | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
	const [isCompleting, setIsCompleting] = React.useState(false);
	const { preferences, updatePreferences } = useWorkflowStore();

	// Initialize onboarding
	React.useEffect(() => {
		const state = userOnboarding.initializeUserOnboarding();
		setUserState(state);

		// Find current step index
		const steps = getOnboardingSteps();
		const currentIndex = steps.findIndex(step => step.id === state.onboardingProgress.currentStep);
		if (currentIndex !== -1) {
			setCurrentStepIndex(currentIndex);
		}
	}, []);

	// Get onboarding steps
	const getOnboardingSteps = (): OnboardingStep[] => {
		// This would get from the onboarding manager
		return [
			{
				id: 'welcome',
				title: 'Welcome to Parsify.dev!',
				description: 'Your journey to becoming a more efficient developer starts here',
				content: {
					type: 'interactive',
					content: 'Parsify.dev provides 58+ developer tools with guided workflows to help you master complex tasks.',
				},
				actions: [
					{ label: 'Get Started', action: 'start', type: 'primary' },
					{ label: 'Skip Tour', action: 'skip', type: 'secondary' },
				],
				skipable: true,
				completed: false,
			},
			{
				id: 'categories',
				title: 'Explore Tool Categories',
				description: 'Discover tools organized by category',
				content: {
					type: 'interactive',
					content: 'Browse through our 6 main categories to find tools that match your needs.',
				},
				actions: [
					{ label: 'Browse Categories', action: 'browse', type: 'primary' },
					{ label: 'Next', action: 'next', type: 'secondary' },
				],
				skipable: true,
				completed: false,
			},
			{
				id: 'workflows',
				title: 'Guided Workflows',
				description: 'Learn complex tools with step-by-step guidance',
				content: {
					type: 'interactive',
					content: 'Our guided workflows provide interactive tutorials to help you master any tool.',
				},
				actions: [
					{ label: 'Try a Workflow', action: 'try', type: 'primary' },
					{ label: 'Learn More', action: 'learn', type: 'secondary' },
				],
				skipable: false,
				completed: false,
			},
		];
	};

	const steps = getOnboardingSteps();
	const currentStep = steps[currentStepIndex];

	// Handle step action
	const handleStepAction = async (action: string) => {
		switch (action) {
			case 'start':
				// Start onboarding
				break;
			case 'skip':
				// Skip onboarding
				onSkip?.();
				return;
			case 'browse':
				// Launch category browser
				break;
			case 'try':
				// Launch a sample workflow
				const workflow = workflowManager.getWorkflowById('json-formatter-workflow');
				if (workflow) {
					// This would integrate with workflow store to start the workflow
				}
				break;
			case 'next':
				// Move to next step
				await handleNext();
				break;
		}
	};

	// Move to next step
	const handleNext = async () => {
		if (currentStep) {
			const completed = userOnboarding.completeOnboardingStep(currentStep.id);
			if (completed) {
				if (currentStepIndex < steps.length - 1) {
					setCurrentStepIndex(currentStepIndex + 1);
				} else {
					// Onboarding complete
					await handleComplete();
				}
			}
		}
	};

	// Handle onboarding completion
	const handleComplete = async () => {
		setIsCompleting(true);

		// Show completion animation
		await new Promise(resolve => setTimeout(resolve, 2000));

		setIsCompleting(false);
		onComplete?.();
	};

	// Skip current step
	const handleSkip = () => {
		if (currentStep && currentStep.skipable) {
			userOnboarding.skipOnboardingStep(currentStep.id);
			if (currentStepIndex < steps.length - 1) {
				setCurrentStepIndex(currentStepIndex + 1);
			}
		}
	};

	// Update user preferences
	const handlePreferenceUpdate = (key: string, value: any) => {
		updatePreferences({ [key]: value });
		userOnboarding.updateUserPreferences({ [key]: value });
	};

	if (!userState || !currentStep) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	const progress = ((currentStepIndex + 1) / steps.length) * 100;

	return (
		<Card className={cn("w-full max-w-2xl mx-auto", className)}>
			<CardHeader className="space-y-4">
				{/* Progress indicator */}
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Onboarding Progress</span>
						<span>{currentStepIndex + 1} of {steps.length}</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				{/* Step title */}
				<CardTitle className="text-center">
					{currentStep.title}
				</CardTitle>
				<p className="text-center text-muted-foreground">
					{currentStep.description}
				</p>
			</CardHeader>

			<CardContent className="space-y-6">
				<AnimatePresence mode="wait">
					<motion.div
						key={currentStep.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
						className="space-y-6"
					>
						{/* Step content based on type */}
						{currentStep.id === 'welcome' && (
							<div className="text-center space-y-4">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: "spring", stiffness: 200 }}
									className="flex justify-center"
								>
									<div className="relative">
										<Sparkles className="h-16 w-16 text-primary" />
										<motion.div
											animate={{ rotate: 360 }}
											transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
											className="absolute -top-1 -right-1"
										>
											<Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
										</motion.div>
									</div>
								</motion.div>

								<div className="space-y-2">
									<h3 className="text-2xl font-bold">Welcome to Your Developer Toolkit!</h3>
									<p className="text-muted-foreground">
										{currentStep.content.content}
									</p>
								</div>

								{/* Feature highlights */}
								<div className="grid grid-cols-2 gap-4 mt-6">
									<div className="text-center p-4 bg-muted/50 rounded-lg">
										<Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
										<p className="text-sm font-medium">58+ Tools</p>
									</div>
									<div className="text-center p-4 bg-muted/50 rounded-lg">
										<BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
										<p className="text-sm font-medium">Guided Workflows</p>
									</div>
									<div className="text-center p-4 bg-muted/50 rounded-lg">
										<Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
										<p className="text-sm font-medium">Lightning Fast</p>
									</div>
									<div className="text-center p-4 bg-muted/50 rounded-lg">
										<Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
										<p className="text-sm font-medium">Customizable</p>
									</div>
								</div>
							</div>
						)}

						{currentStep.id === 'categories' && (
							<div className="space-y-4">
								<h4 className="text-lg font-medium">Explore Our Tool Categories</h4>

								<div className="grid grid-cols-2 gap-4">
									{[
										{ name: 'JSON Processing', icon: '📄', color: 'bg-blue-100 text-blue-700' },
										{ name: 'Code Processing', icon: '💻', color: 'bg-green-100 text-green-700' },
										{ name: 'File Processing', icon: '📁', color: 'bg-purple-100 text-purple-700' },
										{ name: 'Security', icon: '🔒', color: 'bg-red-100 text-red-700' },
										{ name: 'Network', icon: '🌐', color: 'bg-yellow-100 text-yellow-700' },
										{ name: 'Text Processing', icon: '📝', color: 'bg-indigo-100 text-indigo-700' },
									].map((category, index) => (
										<motion.div
											key={category.name}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className={cn(
												"p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:shadow-md",
												category.color
											)}
										>
											<div className="text-center">
												<div className="text-2xl mb-2">{category.icon}</div>
												<p className="font-medium">{category.name}</p>
											</div>
										</motion.div>
									))}
								</div>
							</div>
						)}

						{currentStep.id === 'workflows' && (
							<div className="space-y-4">
								<h4 className="text-lg font-medium">Experience Guided Learning</h4>

								<div className="space-y-4">
									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
									>
										<div className="flex items-start space-x-3">
											<Play className="h-5 w-5 text-blue-600 mt-0.5" />
											<div>
												<h5 className="font-medium">Step-by-Step Guidance</h5>
												<p className="text-sm text-muted-foreground mt-1">
													Interactive tutorials guide you through complex tools with real-world examples.
												</p>
											</div>
										</div>
									</motion.div>

									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.1 }}
										className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
									>
										<div className="flex items-start space-x-3">
											<CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
											<div>
												<h5 className="font-medium">Progress Tracking</h5>
												<p className="text-sm text-muted-foreground mt-1">
													Track your learning progress and earn achievements as you master new tools.
												</p>
											</div>
										</div>
									</motion.div>

									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.2 }}
										className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
									>
										<div className="flex items-start space-x-3">
											<Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
											<div>
												<h5 className="font-medium">Smart Suggestions</h5>
												<p className="text-sm text-muted-foreground mt-1">
													Get personalized workflow recommendations based on your skill level and interests.
												</p>
											</div>
										</div>
									</motion.div>
								</div>
							</div>
						)}
					</motion.div>
				</AnimatePresence>

				{/* Action buttons */}
				<div className="flex justify-between pt-4">
					{currentStepIndex > 0 && (
						<Button
							variant="outline"
							onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
						>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Previous
						</Button>
					)}

					<div className="flex space-x-2 ml-auto">
						{currentStep.skipable && (
							<Button
								variant="ghost"
								onClick={handleSkip}
							>
								<SkipForward className="h-4 w-4 mr-2" />
								Skip
							</Button>
						)}

						{currentStep.actions.map((action) => (
							<Button
								key={action.label}
								variant={action.type === 'primary' ? 'default' : 'outline'}
								onClick={() => handleStepAction(action.action)}
								disabled={isCompleting}
							>
								{action.label}
								{action.action === 'next' && <ChevronRight className="h-4 w-4 ml-2" />}
							</Button>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
