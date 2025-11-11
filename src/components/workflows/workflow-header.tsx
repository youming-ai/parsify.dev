/**
 * Workflow Header Component
 * Header for workflow container with title and controls
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
	X,
	Minimize2,
	Maximize2,
	Settings,
	HelpCircle,
	Trophy,
	Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Workflow, WorkflowStep, WorkflowProgress } from '@/types/workflows';

interface WorkflowHeaderProps {
	workflow: Workflow;
	currentStep: WorkflowStep | null;
	progress: WorkflowProgress;
	onMinimize?: () => void;
	onClose?: () => void;
	onSettings?: () => void;
	className?: string;
}

export function WorkflowHeader({
	workflow,
	currentStep,
	progress,
	onMinimize,
	onClose,
	onSettings,
	className,
}: WorkflowHeaderProps) {
	const [showTooltip, setShowTooltip] = React.useState(false);

	const estimatedTimeRemaining = React.useMemo(() => {
		if (!currentStep || progress.completedSteps.length === 0) return workflow.estimatedDuration;

		const avgTimePerStep = workflow.estimatedDuration / workflow.steps.length;
		const remainingSteps = workflow.steps.length - progress.completedSteps.length - 1;

		return Math.ceil(remainingSteps * avgTimePerStep);
	}, [workflow, currentStep, progress]);

	const getDifficultyColor = () => {
		switch (workflow.difficulty) {
			case 'beginner': return 'bg-green-100 text-green-700 border-green-200';
			case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
			case 'advanced': return 'bg-red-100 text-red-700 border-red-200';
			default: return 'bg-gray-100 text-gray-700 border-gray-200';
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"flex items-center justify-between p-4 border-b bg-gradient-to-r from-background to-muted/20",
				className
			)}
		>
			{/* Left side - Title and info */}
			<div className="flex items-center space-x-3">
				{/* Progress indicator */}
				<div className="flex items-center space-x-2">
					<div className="relative">
						<div className="h-8 w-8 rounded-full bg-muted border-2 border-muted-foreground/20">
							<div
								className="absolute inset-0 rounded-full bg-primary"
								style={{
									clipPath: `polygon(0 0, ${(progress.completedSteps.length / workflow.steps.length) * 100}% 0, ${(progress.completedSteps.length / workflow.steps.length) * 100}% 100%, 0 100%)`
								}}
							/>
						</div>
						{progress.completedSteps.length === workflow.steps.length && (
							<motion.div
								initial={{ scale: 0, rotate: 0 }}
								animate={{ scale: 1, rotate: 360 }}
								transition={{ duration: 0.5, ease: "easeOut" }}
								className="absolute inset-0 flex items-center justify-center"
							>
								<Trophy className="h-4 w-4 text-yellow-500" />
							</motion.div>
						)}
					</div>
					<div className="text-sm">
						<span className="font-medium">{progress.completedSteps.length}</span>
						<span className="text-muted-foreground">/{workflow.steps.length}</span>
					</div>
				</div>

				{/* Title */}
				<div>
					<h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
						<span>{workflow.name}</span>
						<Badge variant="outline" className={getDifficultyColor()}>
							{workflow.difficulty}
						</Badge>
					</h2>
					{currentStep && (
						<p className="text-sm text-muted-foreground">{currentStep.title}</p>
					)}
				</div>
			</div>

			{/* Center - Time estimate */}
			<div className="hidden sm:flex items-center space-x-4">
				<div className="flex items-center space-x-1 text-sm text-muted-foreground">
					<Clock className="h-4 w-4" />
					<span>~{estimatedTimeRemaining} min</span>
				</div>

				{workflow.isRecommended && (
					<Badge variant="secondary" className="text-xs">
						Recommended
					</Badge>
				)}
			</div>

			{/* Right side - Controls */}
			<div className="flex items-center space-x-1">
				{/* Help button */}
				<motion.div
					onMouseEnter={() => setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
					className="relative"
				>
					<Button
						variant="ghost"
						size="sm"
						onClick={onSettings}
						className="h-8 w-8 p-0"
					>
						<HelpCircle className="h-4 w-4" />
					</Button>

					{showTooltip && (
						<motion.div
							initial={{ opacity: 0, scale: 0.8, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.8, y: 10 }}
							className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md p-2 text-sm shadow-md min-w-[150px]"
						>
							<p>Need help with this workflow?</p>
						</motion.div>
					)}
				</motion.div>

				{/* Settings button */}
				<Button
					variant="ghost"
					size="sm"
					onClick={onSettings}
					className="h-8 w-8 p-0"
				>
					<Settings className="h-4 w-4" />
				</Button>

				{/* Minimize button */}
				{onMinimize && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onMinimize}
						className="h-8 w-8 p-0"
					>
						<Minimize2 className="h-4 w-4" />
					</Button>
				)}

				{/* Close button */}
				{onClose && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>
		</motion.div>
	);
}
