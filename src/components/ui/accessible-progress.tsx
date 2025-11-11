/**
 * Accessible Progress Components
 * Comprehensive progress and status announcement system for screen readers
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScreenReader } from '@/lib/screen-reader';

// Progress Bar Component
interface AccessibleProgressBarProps {
	value: number;
	max: number;
	min?: number;
	label?: string;
	showPercentage?: boolean;
	showValue?: boolean;
	busy?: boolean;
	indeterminate?: boolean;
	size?: 'sm' | 'md' | 'lg';
	color?: 'primary' | 'success' | 'warning' | 'error';
	className?: string;
	onComplete?: () => void;
}

export function AccessibleProgressBar({
	value,
	max,
	min = 0,
	label,
	showPercentage = true,
	showValue = false,
	busy = false,
	indeterminate = false,
	size = 'md',
	color = 'primary',
	className = '',
	onComplete,
}: AccessibleProgressBarProps) {
	const [lastValue, setLastValue] = useState(min);
	const [isComplete, setIsComplete] = useState(false);
	const { announceProgress } = useScreenReader();
	const progressId = React.useId();

	const percentage = Math.round(((value - min) / (max - min)) * 100);
	const isAtMin = value <= min;
	const isAtMax = value >= max;

	const sizeClasses = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3',
	};

	const colorClasses = {
		primary: 'bg-blue-500',
		success: 'bg-green-500',
		warning: 'bg-yellow-500',
		error: 'bg-red-500',
	};

	useEffect(() => {
		// Announce significant progress changes
		const percentageChange = Math.abs(percentage - Math.round(((lastValue - min) / (max - min)) * 100));

		if (indeterminate) {
			// Don't announce for indeterminate progress
			return;
		}

		if (isAtMax && !isComplete) {
			const message = label || 'Progress';
			announceProgress(`${message} completed! 100%`, max, max);
			setIsComplete(true);
			onComplete?.();
		} else if (percentageChange >= 10 || isAtMax || isAtMin) {
			const message = label || 'Progress';
			announceProgress(message, value, max);
		}

		setLastValue(value);
	}, [value, min, max, label, lastValue, isComplete, isAtMax, isAtMin, announceProgress, onComplete, indeterminate]);

	return (
		<div className={`accessible-progress-bar ${className}`}>
			{label && (
				<div className="flex justify-between items-center mb-2">
					<label
						id={`progress-label-${progressId}`}
						className="text-sm font-medium text-gray-700"
					>
						{label}
					</label>
					{(showPercentage || showValue) && (
						<span className="text-sm text-gray-600" aria-live="polite">
							{showPercentage && `${percentage}%`}
							{showPercentage && showValue && ' '}
							{showValue && `${value} of ${max}`}
						</span>
					)}
				</div>
			)}

			<div
				role="progressbar"
				aria-labelledby={label ? `progress-label-${progressId}` : undefined}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={indeterminate ? undefined : value}
				aria-valuetext={indeterminate ? 'Loading...' : undefined}
				aria-busy={busy}
				className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}
			>
				{!indeterminate ? (
					<div
						className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
						style={{ width: `${percentage}%` }}
						aria-hidden="true"
					/>
				) : (
					<div
						className={`w-1/4 ${colorClasses[color]} ${sizeClasses[size]} rounded-full animate-pulse`}
						aria-hidden="true"
					/>
				)}
			</div>

			{/* Screen reader-only detailed progress */}
			<span className="sr-only" aria-live="polite" aria-atomic="true">
				{indeterminate
					? 'Loading, please wait'
					: `${percentage}% complete (${value} of ${max})`
				}
			</span>
		</div>
	);
}

// Progress Steps Component
interface ProgressStep {
	id: string;
	label: string;
	description?: string;
	status: 'pending' | 'current' | 'completed' | 'error';
	optional?: boolean;
}

interface AccessibleProgressStepsProps {
	steps: ProgressStep[];
	currentStep: number;
	orientation?: 'horizontal' | 'vertical';
	showLabels?: boolean;
	showDescriptions?: boolean;
	className?: string;
	onStepClick?: (stepIndex: number) => void;
}

export function AccessibleProgressSteps({
	steps,
	currentStep,
	orientation = 'horizontal',
	showLabels = true,
	showDescriptions = false,
	className = '',
	onStepClick,
}: AccessibleProgressStepsProps) {
	const { announce } = useScreenReader();
	const stepsId = React.useId();

	useEffect(() => {
		const current = steps[currentStep];
		if (current) {
			let message = `Step ${currentStep + 1} of ${steps.length}: ${current.label}`;
			if (current.description && showDescriptions) {
				message += `. ${current.description}`;
			}
			if (current.status === 'completed') {
				message += ' - completed';
			} else if (current.status === 'error') {
				message += ' - error occurred';
			}
			announce(message, { priority: 'polite' });
		}
	}, [currentStep, steps, showDescriptions, announce]);

	const getStepStatus = (index: number): ProgressStep['status'] => {
		if (index < currentStep) return 'completed';
		if (index === currentStep) return steps[index].status;
		return 'pending';
	};

	const isStepClickable = (index: number) => {
		return onStepClick && (index <= currentStep || steps[index].optional);
	};

	return (
		<div className={`accessible-progress-steps ${className}`}>
			{/* Progress Overview for Screen Readers */}
			<div className="sr-only" role="status" aria-live="polite">
				Current step: {currentStep + 1} of {steps.length}
			</div>

			<ol
				aria-label="Progress steps"
				className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row items-center'}`}
			>
				{steps.map((step, index) => {
					const status = getStepStatus(index);
					const isClickable = isStepClickable(index);
					const stepId = `${stepsId}-${index}`;

					return (
						<li
							key={step.id}
							className={`
								${orientation === 'horizontal' ? 'flex-1' : 'mb-4'}
								${index > 0 && orientation === 'horizontal' ? 'ml-4' : ''}
							`}
						>
							<div className="flex items-center">
								{/* Connector Line */}
								{index > 0 && orientation === 'horizontal' && (
									<div
										className={`flex-1 h-0.5 mr-4 ${
											status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
										}`}
										aria-hidden="true"
									/>
								)}

								{/* Step Button/Indicator */}
								{isClickable ? (
									<button
										id={stepId}
										type="button"
										onClick={() => onStepClick(index)}
										className={`
											flex items-center justify-center w-10 h-10 rounded-full font-medium
											${status === 'completed' ? 'bg-green-500 text-white' : ''}
											${status === 'current' ? 'bg-blue-500 text-white' : ''}
											${status === 'error' ? 'bg-red-500 text-white' : ''}
											${status === 'pending' ? 'bg-gray-300 text-gray-600' : ''}
											${isClickable ? 'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500' : ''}
										`}
										aria-current={status === 'current' ? 'step' : undefined}
										aria-describedby={showLabels && showDescriptions ? `${stepId}-desc` : undefined}
									>
										{status === 'completed' ? '✓' : index + 1}
									</button>
								) : (
									<div
										id={stepId}
										className={`
											flex items-center justify-center w-10 h-10 rounded-full font-medium
											${status === 'completed' ? 'bg-green-500 text-white' : ''}
											${status === 'current' ? 'bg-blue-500 text-white' : ''}
											${status === 'error' ? 'bg-red-500 text-white' : ''}
											${status === 'pending' ? 'bg-gray-300 text-gray-600' : ''}
										`}
										role="img"
										aria-label={`Step ${index + 1}: ${step.label}`}
									>
										{status === 'completed' ? '✓' : index + 1}
									</div>
								)}

								{/* Step Label */}
								{showLabels && (
									<div className="ml-3">
										<div
											className={`font-medium ${
												status === 'current' ? 'text-blue-600' : 'text-gray-900'
											}`}
										>
											{step.label}
											{step.optional && (
												<span className="text-gray-500 text-sm ml-1">(optional)</span>
											)}
										</div>
										{showDescriptions && step.description && (
											<div id={`${stepId}-desc`} className="text-sm text-gray-600">
												{step.description}
											</div>
										)}
									</div>
								)}
							</div>

							{/* Vertical Connector */}
							{orientation === 'vertical' && index < steps.length - 1 && (
								<div
									className={`ml-5 w-0.5 h-8 mt-2 ${
										status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
									}`}
									aria-hidden="true"
								/>
							)}
						</li>
					);
				})}
			</ol>
		</div>
	);
}

// Loading Spinner Component
interface AccessibleLoadingSpinnerProps {
	label?: string;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	busy?: boolean;
}

export function AccessibleLoadingSpinner({
	label = 'Loading',
	size = 'md',
	className = '',
	busy = true,
}: AccessibleLoadingSpinnerProps) {
	const { announce } = useScreenReader();
	const spinnerId = React.useId();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
	};

	useEffect(() => {
		if (busy) {
			announce(`${label}...`, { priority: 'polite' });
		}
	}, [busy, label, announce]);

	if (!busy) return null;

	return (
		<div className={`accessible-loading-spinner flex items-center ${className}`}>
			<div
				className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${sizeClasses[size]}`}
				role="status"
				aria-label={label}
				aria-busy={busy}
			>
				<span className="sr-only">{label}</span>
			</div>
			{label && (
				<span className="ml-2 text-sm text-gray-600" aria-hidden="true">
					{label}...
				</span>
			)}
		</div>
	);
}

// Status Indicator Component
interface AccessibleStatusIndicatorProps {
	status: 'success' | 'warning' | 'error' | 'info' | 'loading';
	message: string;
	detailedMessage?: string;
	showIcon?: boolean;
	dismissible?: boolean;
	onDismiss?: () => void;
	autoDismiss?: boolean;
	autoDismissDelay?: number;
	className?: string;
}

export function AccessibleStatusIndicator({
	status,
	message,
	detailedMessage,
	showIcon = true,
	dismissible = false,
	onDismiss,
	autoDismiss = false,
	autoDismissDelay = 5000,
	className = '',
}: AccessibleStatusIndicatorProps) {
	const [isVisible, setIsVisible] = useState(true);
	const { announce, announceError, announceSuccess } = useScreenReader();
	const statusId = React.useId();

	const statusConfig = {
		success: {
			role: 'status' as const,
			ariaLive: 'polite' as const,
			icon: '✓',
			bgClass: 'bg-green-50 border-green-200 text-green-800',
			iconClass: 'text-green-500',
		},
		warning: {
			role: 'alert' as const,
			ariaLive: 'polite' as const,
			icon: '⚠️',
			bgClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
			iconClass: 'text-yellow-500',
		},
		error: {
			role: 'alert' as const,
			ariaLive: 'assertive' as const,
			icon: '❌',
			bgClass: 'bg-red-50 border-red-200 text-red-800',
			iconClass: 'text-red-500',
		},
		info: {
			role: 'status' as const,
			ariaLive: 'polite' as const,
			icon: 'ℹ️',
			bgClass: 'bg-blue-50 border-blue-200 text-blue-800',
			iconClass: 'text-blue-500',
		},
		loading: {
			role: 'status' as const,
			ariaLive: 'polite' as const,
			icon: '⏳',
			bgClass: 'bg-gray-50 border-gray-200 text-gray-800',
			iconClass: 'text-gray-500',
		},
	};

	const config = statusConfig[status];

	useEffect(() => {
		if (isVisible) {
			let fullMessage = message;
			if (detailedMessage) {
				fullMessage += `. ${detailedMessage}`;
			}

			switch (status) {
				case 'error':
					announceError(fullMessage);
					break;
				case 'success':
					announceSuccess(fullMessage);
					break;
				default:
					announce(fullMessage, { priority: status === 'warning' ? 'assertive' : 'polite' });
			}
		}
	}, [message, detailedMessage, status, isVisible, announce, announceError, announceSuccess]);

	useEffect(() => {
		if (autoDismiss && status !== 'error') {
			const timer = setTimeout(() => {
				handleDismiss();
			}, autoDismissDelay);
			return () => clearTimeout(timer);
		}
	}, [autoDismiss, autoDismissDelay, status]);

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
		announce('Status message dismissed', { priority: 'polite' });
	};

	if (!isVisible) return null;

	return (
		<div
			id={`status-${statusId}`}
			role={config.role}
			aria-live={config.ariaLive}
			aria-atomic="true"
			className={`border rounded-lg p-4 ${config.bgClass} ${className}`}
		>
			<div className="flex items-start">
				{showIcon && (
					<span className={`text-lg ${config.iconClass} mr-3 flex-shrink-0`} aria-hidden="true">
						{config.icon}
					</span>
				)}
				<div className="flex-1">
					<div className="font-medium">{message}</div>
					{detailedMessage && (
						<div className="text-sm mt-1 opacity-90">{detailedMessage}</div>
					)}
				</div>
				{dismissible && (
					<button
						onClick={handleDismiss}
						className="ml-3 p-1 rounded hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current"
						aria-label="Dismiss status message"
					>
						<span aria-hidden="true">×</span>
					</button>
				)}
			</div>
		</div>
	);
}

// Task Progress Component
interface TaskProgress {
	id: string;
	name: string;
	status: 'pending' | 'running' | 'completed' | 'error';
	progress?: number;
	message?: string;
}

interface AccessibleTaskProgressProps {
	tasks: TaskProgress[];
	onTaskClick?: (taskId: string) => void;
	className?: string;
}

export function AccessibleTaskProgress({
	tasks,
	onTaskClick,
	className = '',
}: AccessibleTaskProgressProps) {
	const { announce } = useScreenReader();
	const taskListId = React.useId();

	const completedTasks = tasks.filter(task => task.status === 'completed').length;
	const totalTasks = tasks.length;
	const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

	useEffect(() => {
		const runningTasks = tasks.filter(task => task.status === 'running');
		const errorTasks = tasks.filter(task => task.status === 'error');

		let message = `Progress: ${completedTasks} of ${totalTasks} tasks completed`;

		if (runningTasks.length > 0) {
			message += `. ${runningTasks.length} task${runningTasks.length !== 1 ? 's' : ''} in progress`;
		}

		if (errorTasks.length > 0) {
			message += `. ${errorTasks.length} task${errorTasks.length !== 1 ? 's' : ''} failed`;
		}

		announce(message, { priority: errorTasks.length > 0 ? 'assertive' : 'polite' });
	}, [tasks, completedTasks, totalTasks, announce]);

	const getTaskIcon = (status: TaskProgress['status']) => {
		switch (status) {
			case 'completed': return '✓';
			case 'running': return '⏳';
			case 'error': return '❌';
			case 'pending': return '○';
			default: return '○';
		}
	};

	const getTaskColor = (status: TaskProgress['status']) => {
		switch (status) {
			case 'completed': return 'text-green-500';
			case 'running': return 'text-blue-500';
			case 'error': return 'text-red-500';
			case 'pending': return 'text-gray-400';
			default: return 'text-gray-400';
		}
	};

	return (
		<div className={`accessible-task-progress ${className}`}>
			{/* Overall Progress */}
			<div className="mb-4">
				<div className="flex justify-between items-center mb-2">
					<h3 className="text-sm font-medium text-gray-700">Overall Progress</h3>
					<span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-blue-500 h-2 rounded-full transition-all duration-300"
						style={{ width: `${overallProgress}%` }}
						aria-hidden="true"
					/>
				</div>
			</div>

			{/* Task List */}
			<ul
				id={`task-list-${taskListId}`}
				role="list"
				aria-label="Task progress"
				className="space-y-2"
			>
				{tasks.map((task) => {
					const isClickable = onTaskClick && task.status !== 'pending';

					return (
						<li key={task.id} role="listitem">
							{isClickable ? (
								<button
									onClick={() => onTaskClick(task.id)}
									className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<div className="flex items-center">
										<span className={`text-lg mr-3 ${getTaskColor(task.status)}`} aria-hidden="true">
											{getTaskIcon(task.status)}
										</span>
										<span className="text-sm font-medium text-left">{task.name}</span>
									</div>
									{task.progress !== undefined && (
										<span className="text-sm text-gray-600">{Math.round(task.progress)}%</span>
									)}
								</button>
							) : (
								<div className="flex items-center justify-between p-2">
									<div className="flex items-center">
										<span className={`text-lg mr-3 ${getTaskColor(task.status)}`} aria-hidden="true">
											{getTaskIcon(task.status)}
										</span>
										<span className="text-sm font-medium">{task.name}</span>
									</div>
									{task.progress !== undefined && (
										<span className="text-sm text-gray-600">{Math.round(task.progress)}%</span>
									)}
								</div>
							)}

							{task.message && (
								<div className="ml-8 text-sm text-gray-600">{task.message}</div>
							)}

							{task.progress !== undefined && task.status === 'running' && (
								<div className="ml-8 mt-1">
									<div className="w-full bg-gray-200 rounded-full h-1">
										<div
											className="bg-blue-500 h-1 rounded-full transition-all duration-300"
											style={{ width: `${task.progress}%` }}
											aria-hidden="true"
										/>
									</div>
								</div>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}

// Multi-Stage Progress Component
interface Stage {
	id: string;
	title: string;
	description?: string;
	steps: Array<{
		id: string;
		name: string;
		description?: string;
		status: 'pending' | 'running' | 'completed' | 'error';
		progress?: number;
	}>;
}

interface AccessibleMultiStageProgressProps {
	stages: Stage[];
	currentStage: number;
	onStageChange?: (stageIndex: number) => void;
	className?: string;
}

export function AccessibleMultiStageProgress({
	stages,
	currentStage,
	onStageChange,
	className = '',
}: AccessibleMultiStageProgressProps) {
	const { announce } = useScreenReader();
	const progressId = React.useId();

	useEffect(() => {
		const stage = stages[currentStage];
		const completedSteps = stage.steps.filter(step => step.status === 'completed').length;
		const totalSteps = stage.steps.length;

		let message = `Stage ${currentStage + 1} of ${stages.length}: ${stage.title}`;
		message += `. ${completedSteps} of ${totalSteps} steps completed`;

		announce(message, { priority: 'polite' });
	}, [currentStage, stages, announce]);

	return (
		<div className={`accessible-multi-stage-progress ${className}`}>
			{/* Stage Navigation */}
			<nav aria-label="Progress stages" className="mb-6">
				<ol className="flex items-center justify-between">
					{stages.map((stage, index) => {
						const isActive = index === currentStage;
						const isCompleted = index < currentStage;
						const hasError = stage.steps.some(step => step.status === 'error');

						return (
							<li key={stage.id} className="flex-1">
								<button
									onClick={() => onStageChange?.(index)}
									disabled={!onStageChange || (index > currentStage && !isCompleted)}
									className={`
										w-full p-3 text-left rounded-lg border
										${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
										${isCompleted ? 'border-green-500 bg-green-50' : ''}
										${hasError ? 'border-red-500 bg-red-50' : ''}
										${onStageChange && (isCompleted || isActive) ? 'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500' : ''}
										${!onStageChange || (index > currentStage && !isCompleted) ? 'opacity-50 cursor-not-allowed' : ''}
									`}
									aria-current={isActive ? 'step' : undefined}
								>
									<div className="font-medium text-sm">{stage.title}</div>
									<div className="text-xs text-gray-600 mt-1">
										{stage.steps.filter(s => s.status === 'completed').length} of {stage.steps.length} complete
									</div>
								</button>
							</li>
						);
					})}
				</ol>
			</nav>

			{/* Current Stage Details */}
			<div className="border rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-2">{stages[currentStage].title}</h3>
				{stages[currentStage].description && (
					<p className="text-gray-600 mb-4">{stages[currentStage].description}</p>
				)}

				{/* Steps in Current Stage */}
				<ul role="list" aria-label="Steps in current stage" className="space-y-3">
					{stages[currentStage].steps.map((step) => {
						const getStepIcon = () => {
							switch (step.status) {
								case 'completed': return '✓';
								case 'running': return '⏳';
								case 'error': return '❌';
								case 'pending': return '○';
								default: return '○';
							}
						};

						const getStepColor = () => {
							switch (step.status) {
								case 'completed': return 'text-green-500';
								case 'running': return 'text-blue-500';
								case 'error': return 'text-red-500';
								case 'pending': return 'text-gray-400';
								default: return 'text-gray-400';
							}
						};

						return (
							<li key={step.id} role="listitem" className="flex items-start">
								<span className={`text-lg mr-3 mt-0.5 ${getStepColor()}`} aria-hidden="true">
									{getStepIcon()}
								</span>
								<div className="flex-1">
									<div className="font-medium text-sm">{step.name}</div>
									{step.description && (
										<div className="text-xs text-gray-600 mt-1">{step.description}</div>
									)}
									{step.progress !== undefined && step.status === 'running' && (
										<div className="mt-2">
											<div className="w-full bg-gray-200 rounded-full h-1">
												<div
													className="bg-blue-500 h-1 rounded-full transition-all duration-300"
													style={{ width: `${step.progress}%` }}
													aria-hidden="true"
												/>
											</div>
											<div className="text-xs text-gray-600 mt-1">
												{Math.round(step.progress)}% complete
											</div>
										</div>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}

export default {
	AccessibleProgressBar,
	AccessibleProgressSteps,
	AccessibleLoadingSpinner,
	AccessibleStatusIndicator,
	AccessibleTaskProgress,
	AccessibleMultiStageProgress,
};
