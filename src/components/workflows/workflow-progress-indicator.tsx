/**
 * Workflow Progress Indicator
 * Visual progress tracking for workflows
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertTriangle, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Workflow, WorkflowProgress } from '@/types/workflows';

interface WorkflowProgressIndicatorProps {
	workflow: Workflow;
	progress: WorkflowProgress;
	variant?: 'compact' | 'detailed' | 'steps';
	showTime?: boolean;
	showErrors?: boolean;
	className?: string;
}

export function WorkflowProgressIndicator({
	workflow,
	progress,
	variant = 'compact',
	showTime = true,
	showErrors = true,
	className
}: WorkflowProgressIndicatorProps) {
	const { completedSteps, skippedSteps, errors, startTime, totalTime } = progress;
	const totalSteps = workflow.steps.length;
	const completionPercentage = (completedSteps.length / totalSteps) * 100;

	// Calculate time tracking
	const elapsedTime = totalTime || Math.floor((Date.now() - startTime.getTime()) / 1000);
	const formatTime = (seconds: number) => {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	};

	// Get step status
	const getStepStatus = (stepId: string) => {
		if (completedSteps.includes(stepId)) return 'completed';
		if (skippedSteps.includes(stepId)) return 'skipped';
		if (errors.some(error => error.stepId === stepId)) return 'error';
		return 'pending';
	};

	const getStepIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'skipped':
				return <Circle className="h-4 w-4 text-muted-foreground" />;
			case 'error':
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			default:
				return <Circle className="h-4 w-4 text-muted-foreground opacity-50" />;
		}
	};

	// Compact variant - just progress bar
	if (variant === 'compact') {
		return (
			<div className={cn('space-y-2', className)}>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						{completedSteps.length} of {totalSteps} completed
					</span>
					{showTime && (
						<span className="text-xs text-muted-foreground">
							<Clock className="h-3 w-3 inline mr-1" />
							{formatTime(elapsedTime)}
						</span>
					)}
				</div>
				<Progress value={completionPercentage} className="h-2" />
			</div>
		);
	}

	// Steps variant - visual step indicators
	if (variant === 'steps') {
		return (
			<div className={cn('space-y-3', className)}>
				{/* Step indicators */}
				<div className="flex items-center justify-between">
					{workflow.steps.map((step, index) => {
						const status = getStepStatus(step.id);
						const isCurrentStep = index === workflow.steps.findIndex(s => s.id === progress.currentStep);

						return (
							<Tooltip key={step.id}>
								<TooltipTrigger asChild>
									<div className="relative flex flex-col items-center">
										<motion.div
											initial={{ scale: 0.8, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											transition={{ delay: index * 0.1 }}
											className={cn(
												'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors',
												status === 'completed' && 'border-green-500 bg-green-50',
												status === 'skipped' && 'border-muted-foreground bg-muted',
												status === 'error' && 'border-red-500 bg-red-50',
												status === 'pending' && 'border-muted-foreground',
												isCurrentStep && 'ring-2 ring-primary ring-offset-2'
											)}
										>
											{getStepIcon(status)}
										</motion.div>

										{/* Connector line */}
										{index < workflow.steps.length - 1 && (
											<div className={cn(
												'absolute top-5 left-10 w-8 h-0.5 -z-10',
												status === 'completed' ? 'bg-green-500' : 'bg-muted'
											)} />
										)}

										{/* Step number */}
										{status === 'pending' && (
											<span className="absolute text-xs font-medium text-muted-foreground">
												{index + 1}
											</span>
										)}
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="text-center">
										<p className="font-medium">{step.title}</p>
										<p className="text-xs text-muted-foreground capitalize">{status}</p>
									</div>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>

				{/* Summary stats */}
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							{completedSteps.length}/{totalSteps} completed
						</Badge>
						{skippedSteps.length > 0 && (
							<Badge variant="outline" className="text-xs">
								{skippedSteps.length} skipped
							</Badge>
						)}
					</div>

					{showTime && (
						<span className="text-xs text-muted-foreground">
							<Clock className="h-3 w-3 inline mr-1" />
							{formatTime(elapsedTime)}
						</span>
					)}
				</div>
			</div>
		);
	}

	// Detailed variant - comprehensive progress view
	return (
		<div className={cn('space-y-4', className)}>
			{/* Progress overview */}
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">Progress Overview</h4>
				{completionPercentage === 100 && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className="flex items-center gap-1 text-green-600"
					>
						<Trophy className="h-4 w-4" />
						<span className="text-sm font-medium">Completed!</span>
					</motion.div>
				)}
			</div>

			<Progress value={completionPercentage} className="h-3" />

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="p-3 bg-green-50 rounded-lg border border-green-200"
				>
					<div className="flex items-center justify-center gap-1 text-green-600">
						<CheckCircle className="h-4 w-4" />
						<span className="font-medium">{completedSteps.length}</span>
					</div>
					<p className="text-xs text-green-600">Completed</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="p-3 bg-blue-50 rounded-lg border border-blue-200"
				>
					<div className="flex items-center justify-center gap-1 text-blue-600">
						<Circle className="h-4 w-4" />
						<span className="font-medium">
							{totalSteps - completedSteps.length - skippedSteps.length}
						</span>
					</div>
					<p className="text-xs text-blue-600">Remaining</p>
				</motion.div>

				{skippedSteps.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="p-3 bg-gray-50 rounded-lg border border-gray-200"
					>
						<div className="flex items-center justify-center gap-1 text-gray-600">
							<Circle className="h-4 w-4" />
							<span className="font-medium">{skippedSteps.length}</span>
						</div>
						<p className="text-xs text-gray-600">Skipped</p>
					</motion.div>
				)}

				{showTime && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="p-3 bg-purple-50 rounded-lg border border-purple-200"
					>
						<div className="flex items-center justify-center gap-1 text-purple-600">
							<Clock className="h-4 w-4" />
							<span className="font-medium text-xs">{formatTime(elapsedTime)}</span>
						</div>
						<p className="text-xs text-purple-600">Time Spent</p>
					</motion.div>
				)}
			</div>

			{/* Individual step status */}
			<div className="space-y-2">
				<h4 className="text-sm font-medium">Step Details</h4>
				<div className="space-y-1">
					{workflow.steps.map((step, index) => {
						const status = getStepStatus(step.id);
						const stepErrors = errors.filter(error => error.stepId === step.id);

						return (
							<motion.div
								key={step.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
							>
								{getStepIcon(status)}
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{step.title}</p>
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground capitalize">
											{status}
										</span>
										{step.difficulty && (
											<Badge variant="outline" className="text-xs h-4">
												{step.difficulty}
											</Badge>
										)}
										{stepErrors.length > 0 && (
											<span className="text-xs text-red-500">
												{stepErrors.length} error(s)
											</span>
										)}
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* Errors section */}
			{showErrors && errors.length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium text-red-600">Errors</h4>
					<div className="space-y-1">
						{errors.slice(0, 3).map((error, index) => (
							<div key={index} className="text-xs p-2 bg-red-50 rounded-md border border-red-200">
								<div className="flex items-center justify-between">
									<span className="font-medium text-red-700">
										{workflow.steps.find(s => s.id === error.stepId)?.title || error.stepId}
									</span>
									<span className="text-red-500">
										{new Date(error.timestamp).toLocaleTimeString()}
									</span>
								</div>
								<p className="text-red-600 mt-1">{error.error}</p>
							</div>
						))}
						{errors.length > 3 && (
							<p className="text-xs text-muted-foreground">
								...and {errors.length - 3} more errors
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default WorkflowProgressIndicator;
