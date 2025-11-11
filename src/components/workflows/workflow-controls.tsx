/**
 * Workflow Controls Component
 * Navigation and control buttons for workflows
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
	ChevronLeft,
	ChevronRight,
	SkipForward,
	CheckCircle,
	Play,
	Pause,
	RotateCcw,
	X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workflow, WorkflowStep, WorkflowProgress } from '@/types/workflows';

interface WorkflowControlsProps {
	workflow: Workflow;
	currentStep: WorkflowStep | null;
	progress: WorkflowProgress;
	onNext: () => void;
	onPrevious: () => void;
	onSkip?: () => void;
	onComplete: () => void;
	onReset: () => void;
	onPause: () => void;
	onResume: () => void;
	isPaused: boolean;
	canGoBack: boolean;
	canGoForward: boolean;
	canSkip: boolean;
	isLastStep: boolean;
	className?: string;
}

export function WorkflowControls({
	workflow,
	currentStep,
	progress,
	onNext,
	onPrevious,
	onSkip,
	onComplete,
	onReset,
	onPause,
	onResume,
	isPaused,
	canGoBack,
	canGoForward,
	canSkip,
	isLastStep,
	className,
}: WorkflowControlsProps) {
	const [showResetConfirm, setShowResetConfirm] = React.useState(false);

	const handleReset = () => {
		if (showResetConfirm) {
			onReset();
			setShowResetConfirm(false);
		} else {
			setShowResetConfirm(true);
		}
	};

	const handleSkip = () => {
		if (onSkip) {
			onSkip();
		}
	};

	const handleComplete = () => {
		onComplete();
	};

	return (
		<div className={cn("flex items-center justify-between p-4 space-x-2", className)}>
			{/* Left Controls */}
			<div className="flex items-center space-x-2">
				{/* Previous Button */}
				<Button
					variant="outline"
					size="sm"
					onClick={onPrevious}
					disabled={!canGoBack}
				>
					<ChevronLeft className="h-4 w-4 mr-1" />
					Previous
				</Button>

				{/* Skip Button */}
				{canSkip && onSkip && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleSkip}
					>
						<SkipForward className="h-4 w-4 mr-1" />
						Skip
					</Button>
				)}

				{/* Reset Button */}
				<Button
					variant="ghost"
					size="sm"
					onClick={handleReset}
					className={showResetConfirm ? "bg-destructive/10 text-destructive" : ""}
				>
					{showResetConfirm ? (
						<>
							<X className="h-4 w-4 mr-1" />
							Cancel Reset
						</>
					) : (
						<>
							<RotateCcw className="h-4 w-4 mr-1" />
							Reset
						</>
					)}
				</Button>
			</div>

			{/* Center Controls - Pause/Resume */}
			<div className="flex items-center space-x-2">
				{isPaused ? (
					<Button
						variant="outline"
						size="sm"
						onClick={onResume}
						className="text-green-600 border-green-600 hover:bg-green-50"
					>
						<Play className="h-4 w-4 mr-1" />
						Resume
					</Button>
				) : (
					<Button
						variant="outline"
						size="sm"
						onClick={onPause}
						className="text-orange-600 border-orange-600 hover:bg-orange-50"
					>
						<Pause className="h-4 w-4 mr-1" />
						Pause
					</Button>
				)}
			</div>

			{/* Right Controls */}
			<div className="flex items-center space-x-2">
				{/* Next/Complete Button */}
				{isLastStep ? (
					<motion.div
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<Button
							onClick={handleComplete}
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							<CheckCircle className="h-4 w-4 mr-1" />
							Complete
						</Button>
					</motion.div>
				) : (
					<motion.div
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<Button
							onClick={onNext}
							disabled={!canGoForward}
						>
							Next
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</motion.div>
				)}
			</div>

			{/* Step Counter */}
			<div className="hidden sm:block text-xs text-muted-foreground">
				Step {progress.completedSteps.length + 1} of {workflow.steps.length}
			</div>
		</div>
	);
}
