/**
 * Workflow Overlay Component
 * Main UI component for displaying guided workflows
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Minimize2,
	Maximize2,
	ChevronLeft,
	ChevronRight,
	SkipForward,
	RotateCcw,
	Play,
	Pause,
	HelpCircle,
	Lightbulb,
	CheckCircle,
	BookOpen,
	Settings,
	Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkflowStore, useCurrentWorkflow, useCurrentStep, useWorkflowProgress, useWorkflowPreferences } from '@/lib/workflows/workflow-store';
import { WorkflowStepRenderer } from './workflow-step-renderer';
import { WorkflowControls } from './workflow-controls';
import { WorkflowProgressIndicator } from './workflow-progress-indicator';
import type { Workflow, WorkflowStep, WorkflowPreferences } from '@/types/workflows';

interface WorkflowOverlayProps {
	className?: string;
	position?: 'bottom-right' | 'top-right' | 'floating';
	allowMinimize?: boolean;
	allowResize?: boolean;
	showProgress?: boolean;
	animated?: boolean;
}

export function WorkflowOverlay({
	className,
	position = 'bottom-right',
	allowMinimize = true,
	allowResize = true,
	showProgress = true,
	animated = true
}: WorkflowOverlayProps) {
	const {
		isVisible,
		isMinimized,
		activeWorkflow,
		currentStepIndex,
		progress,
		preferences,
		setVisibility,
		setMinimized,
		setPosition,
		setZoomLevel,
		goToNextStep,
		goToPreviousStep,
		goToStep,
		skipStep,
		resetWorkflow,
		completeWorkflow,
		pauseWorkflow,
		resumeWorkflow,
		updatePreferences,
	} = useWorkflowStore();

	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [isExpanded, setIsExpanded] = useState(false);
	const [currentHint, setCurrentHint] = useState<string | null>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	// Calculate position based on preference or prop
	const getPosition = () => {
		if (position === 'floating') {
			return {
				bottom: preferences.position === 'bottom-right' ? '20px' : 'auto',
				top: preferences.position === 'top-right' ? '20px' : 'auto',
				right: '20px',
				left: 'auto'
			};
		}

		const positions = {
			'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' },
			'top-right': { top: '20px', right: '20px', bottom: 'auto', left: 'auto' }
		};
		return positions[position] || positions['bottom-right'];
	};

	// Calculate progress percentage
	const calculateProgress = () => {
		if (!activeWorkflow) return 0;
		const completed = progress.completedSteps.length;
		const total = activeWorkflow.steps.length;
		return (completed / total) * 100;
	};

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isVisible || isMinimized) return;

			switch (e.key) {
				case 'ArrowRight':
					if (e.ctrlKey || e.metaKey) goToNextStep();
					break;
				case 'ArrowLeft':
					if (e.ctrlKey || e.metaKey) goToPreviousStep();
					break;
				case 'Escape':
					if (e.shiftKey) setVisibility(false);
					break;
				case ' ':
					if (e.target === document.body) {
						e.preventDefault();
						isExpanded ? pauseWorkflow() : resumeWorkflow();
					}
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isVisible, isMinimized, isExpanded]);

	// Handle drag functionality
	const handleDragStart = (e: React.MouseEvent) => {
		if (!allowResize) return;

		const rect = overlayRef.current?.getBoundingClientRect();
		if (rect) {
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			setIsDragging(true);
		}
	};

	const handleDragMove = (e: React.MouseEvent) => {
		if (!isDragging || !allowResize) return;

		const newX = e.clientX - dragOffset.x;
		const newY = e.clientY - dragOffset.y;

		// Keep within viewport bounds
		const maxX = window.innerWidth - 400; // Minimum width
		const maxY = window.innerHeight - 300; // Minimum height

		const clampedX = Math.max(0, Math.min(newX, maxX));
		const clampedY = Math.max(0, Math.min(newY, maxY));

		setPosition({ x: clampedX, y: clampedY });
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	if (!isVisible || !activeWorkflow) return null;

	const currentStep = activeWorkflow.steps[currentStepIndex];
	const progressPercentage = calculateProgress();
	const isCompleted = progressPercentage === 100;

	return (
		<AnimatePresence mode="wait">
			<motion.div
				ref={overlayRef}
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ duration: animated ? 0.3 : 0 }}
				className={cn(
					'fixed z-50 max-w-md w-full shadow-2xl border border-border rounded-lg overflow-hidden',
					'bg-background/95 backdrop-blur-sm',
					isMinimized && 'h-auto',
					!isMinimized && 'max-h-[80vh]',
					isDragging && 'cursor-grabbing',
					className
				)}
				style={{
					...getPosition(),
					...(allowResize && position === 'floating' && {
						transform: `translate(${position.x}px, ${position.y}px)`,
					}),
				}}
				onMouseDown={handleDragStart}
				onMouseMove={handleDragMove}
				onMouseUp={handleDragEnd}
				onMouseLeave={handleDragEnd}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							<BookOpen className="h-4 w-4 text-primary" />
							<span className="text-sm font-medium">Workflow Guide</span>
						</div>
						{isCompleted && (
							<Badge variant="secondary" className="text-xs">
								<Trophy className="h-3 w-3 mr-1" />
								Completed
							</Badge>
						)}
					</div>

					<div className="flex items-center gap-1">
						{allowMinimize && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => setMinimized(!isMinimized)}
									>
										{isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
									</Button>
								</TooltipTrigger>
								<TooltipContent>{isMinimized ? 'Expand' : 'Minimize'}</TooltipContent>
							</Tooltip>
						)}

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => setVisibility(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Close</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{!isMinimized && (
					<>
						{/* Progress Bar */}
						{showProgress && (
							<div className="px-4 py-2 border-b border-border">
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs text-muted-foreground">
										Step {currentStepIndex + 1} of {activeWorkflow.steps.length}
									</span>
									<span className="text-xs text-muted-foreground">
										{Math.round(progressPercentage)}% Complete
									</span>
								</div>
								<Progress value={progressPercentage} className="h-2" />
							</div>
						)}

						{/* Content */}
						<div className="overflow-y-auto max-h-[60vh]">
							<Card className="border-0 shadow-none">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between gap-2">
										<div>
											<CardTitle className="text-lg leading-tight">
												{currentStep?.title}
											</CardTitle>
											<p className="text-sm text-muted-foreground mt-1">
												{currentStep?.description}
											</p>
										</div>
										{currentStep?.difficulty && (
											<Badge
												variant={currentStep.difficulty === 'advanced' ? 'destructive' :
														currentStep.difficulty === 'intermediate' ? 'default' : 'secondary'}
												className="text-xs shrink-0"
											>
												{currentStep.difficulty}
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									{currentStep && (
										<WorkflowStepRenderer
											step={currentStep}
											workflow={activeWorkflow}
											stepIndex={currentStepIndex}
										/>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Controls */}
						<div className="p-4 border-t border-border bg-muted/30">
							<WorkflowControls
								workflow={activeWorkflow}
								stepIndex={currentStepIndex}
								onNext={goToNextStep}
								onPrevious={goToPreviousStep}
								onSkip={skipStep}
								onReset={resetWorkflow}
								onComplete={completeWorkflow}
								isCompleted={isCompleted}
							/>
						</div>
					</>
				)}

				{isMinimized && (
					<div className="p-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setMinimized(false)}
									className="h-8"
								>
									<Play className="h-3 w-3 mr-1" />
									Resume
								</Button>
								{showProgress && (
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground">
											{Math.round(progressPercentage)}%
										</span>
										<Progress value={progressPercentage} className="w-16 h-2" />
									</div>
								)}
							</div>
							<div className="flex items-center gap-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => setMinimized(false)}
										>
											<BookOpen className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Show Guide</TooltipContent>
								</Tooltip>
								{progress.errors.length > 0 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive"
												onClick={() => setMinimized(false)}
											>
												<HelpCircle className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>{progress.errors.length} error(s) need attention</TooltipContent>
									</Tooltip>
								)}
							</div>
						</div>
					</div>
				)}
			</motion.div>
		</AnimatePresence>
	);
}

export default WorkflowOverlay;
