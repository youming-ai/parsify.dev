/**
 * Workflow Container Component
 * Main container for guided workflows and tutorials
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Minimize2,
	Maximize2,
	ChevronLeft,
	ChevronRight,
	SkipForward,
	CheckCircle,
	Play,
	Pause,
	RotateCcw,
	HelpCircle,
	Settings,
	Trophy,
	BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
	useWorkflowStore,
	useCurrentWorkflow,
	useCurrentStep,
	useWorkflowProgress,
	useWorkflowPreferences
} from '@/lib/workflows/workflow-store';
import { WorkflowStep } from '@/lib/workflows/workflow-step';
import { WorkflowControls } from './workflow-controls';
import { WorkflowProgressBar } from './workflow-progress-bar';
import { WorkflowHeader } from './workflow-header';
import type { Workflow, WorkflowState } from '@/types/workflows';

interface WorkflowContainerProps {
	className?: string;
	position?: 'bottom-right' | 'top-right' | 'floating';
	draggable?: boolean;
	resizable?: boolean;
	showMinimizeButton?: boolean;
	showCloseButton?: boolean;
	autoHideOnComplete?: boolean;
	onComplete?: (workflow: Workflow) => void;
	onClose?: () => void;
}

export function WorkflowContainer({
	className,
	position = 'bottom-right',
	draggable = true,
	resizable = false,
	showMinimizeButton = true,
	showCloseButton = true,
	autoHideOnComplete = true,
	onComplete,
	onClose,
}: WorkflowContainerProps) {
	const {
		isVisible,
		isMinimized,
		setVisibility,
		setMinimized,
		goToNextStep,
		goToPreviousStep,
		skipStep,
		completeStep,
		resetWorkflow,
		pauseWorkflow,
		resumeWorkflow,
		completeWorkflow,
	} = useWorkflowStore();

	const workflow = useCurrentWorkflow();
	const currentStep = useCurrentStep();
	const progress = useWorkflowProgress();
	const preferences = useWorkflowPreferences();

	const [isDragging, setIsDragging] = React.useState(false);
	const [isPaused, setIsPaused] = React.useState(false);
	const [showSettings, setShowSettings] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Calculate progress percentage
	const progressPercentage = React.useMemo(() => {
		if (!workflow) return 0;
		return (progress.completedSteps.length / workflow.steps.length) * 100;
	}, [workflow, progress.completedSteps.length]);

	// Auto-hide on completion
	React.useEffect(() => {
		if (autoHideOnComplete && progress.completedSteps.length === workflow?.steps.length) {
			const timer = setTimeout(() => {
				setVisibility(false);
				onComplete?.(workflow!);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [progress.completedSteps.length, workflow, autoHideOnComplete, setVisibility, onComplete]);

	// Keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isVisible || isMinimized) return;

			switch (e.key) {
				case 'ArrowRight':
					e.preventDefault();
					goToNextStep();
					break;
				case 'ArrowLeft':
					e.preventDefault();
					goToPreviousStep();
					break;
				case 'Escape':
					e.preventDefault();
					setVisibility(false);
					break;
				case ' ':
					e.preventDefault();
					if (isPaused) {
						resumeWorkflow();
						setIsPaused(false);
					} else {
						pauseWorkflow();
						setIsPaused(true);
					}
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isVisible, isMinimized, isPaused, goToNextStep, goToPreviousStep, setVisibility, pauseWorkflow, resumeWorkflow]);

	if (!workflow || !isVisible) return null;

	const handleCompleteStep = () => {
		if (currentStep) {
			completeStep(currentStep.id);
		}
	};

	const handleSkipStep = () => {
		if (currentStep && !currentStep.required) {
			skipStep();
		}
	};

	const handleClose = () => {
		setVisibility(false);
		onClose?.();
	};

	const toggleMinimize = () => {
		setMinimized(!isMinimized);
	};

	const toggleSettings = () => {
		setShowSettings(!showSettings);
	};

	const getPositionClasses = () => {
		switch (position) {
			case 'bottom-right':
				return 'bottom-4 right-4';
			case 'top-right':
				return 'top-4 right-4';
			case 'floating':
				return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
			default:
				return 'bottom-4 right-4';
		}
	};

	return (
		<AnimatePresence>
			<motion.div
				ref={containerRef}
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
				className={cn(
					"fixed z-50 w-full max-w-md",
					getPositionClasses(),
					draggable && "cursor-move",
					isDragging && "cursor-grabbing",
					className
				)}
			>
				<Card className="shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
					{/* Header */}
					<WorkflowHeader
						workflow={workflow}
						currentStep={currentStep}
						progress={progress}
						onMinimize={showMinimizeButton ? toggleMinimize : undefined}
						onClose={showCloseButton ? handleClose : undefined}
						onSettings={toggleSettings}
					/>

					{/* Content */}
					<AnimatePresence mode="wait">
						{!isMinimized && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.2 }}
							>
								<CardContent className="p-0">
									{/* Progress Bar */}
									<WorkflowProgressBar
										current={progress.completedSteps.length + 1}
										total={workflow.steps.length}
										percentage={progressPercentage}
										showLabels={preferences.showProgress}
									/>

									<Separator />

									{/* Current Step Content */}
									<div className="p-6 max-h-96 overflow-y-auto">
										{currentStep && (
											<WorkflowStep
												step={currentStep}
												onComplete={handleCompleteStep}
												isPaused={isPaused}
											/>
										)}
									</div>

									{/* Controls */}
									<Separator />

									<WorkflowControls
										workflow={workflow}
										currentStep={currentStep}
										progress={progress}
										onNext={goToNextStep}
										onPrevious={goToPreviousStep}
										onSkip={currentStep && !currentStep.required ? handleSkipStep : undefined}
										onComplete={handleCompleteStep}
												onReset={resetWorkflow}
												onPause={() => {
													pauseWorkflow();
													setIsPaused(true);
												}}
												onResume={() => {
													resumeWorkflow();
													setIsPaused(false);
												}}
												isPaused={isPaused}
												canGoBack={progress.completedSteps.length > 0}
												canGoForward={progress.completedSteps.length < workflow.steps.length - 1}
												canSkip={currentStep && !currentStep.required}
												isLastStep={progress.completedSteps.length === workflow.steps.length - 1}
											/>

											{/* Completion Celebration */}
											{progress.completedSteps.length === workflow.steps.length && (
												<motion.div
													initial={{ opacity: 0, scale: 0.8 }}
													animate={{ opacity: 1, scale: 1 }}
													className="p-6 text-center"
												>
													<div className="flex flex-col items-center space-y-4">
														<motion.div
															initial={{ rotate: 0 }}
															animate={{ rotate: 360 }}
															transition={{ duration: 0.6 }}
														>
															<Trophy className="h-12 w-12 text-yellow-500" />
														</motion.div>
														<div>
															<h3 className="text-lg font-semibold text-foreground">
																Workflow Completed! 🎉
															</h3>
															<p className="text-sm text-muted-foreground mt-1">
																Great job! You've completed the {workflow.name} workflow.
															</p>
														</div>
														<div className="flex space-x-2">
															<Button
																variant="outline"
																size="sm"
																onClick={resetWorkflow}
															>
																<RotateCcw className="h-4 w-4 mr-2" />
																Review
															</Button>
															<Button
																variant="default"
																size="sm"
																onClick={handleClose}
															>
																Done
															</Button>
														</div>
													</div>
												</motion.div>
											)}
										</CardContent>
									</motion.div>
								)}
							</AnimatePresence>
						</Card>
					</motion.div>
				</Animate.div>
			</AnimatePresence>
		);
}
