/**
 * Workflow Provider Component
 * Main integration component that provides workflow functionality to the entire app
 */

'use client';

import * as React from 'react';
import { WorkflowContainer } from './workflow-container';
import { ContextualTooltip } from './contextual-tooltip';
import { ErrorRecoveryWorkflow } from './error-recovery-workflow';
import { UserOnboardingWizard } from './user-onboarding-wizard';
import { WorkflowTriggerButton } from './workflow-trigger-button';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';
import { userOnboarding } from '@/lib/workflows/user-onboarding';
import { workflowManager } from '@/lib/workflows/workflow-manager';
import { workflowErrorHandler } from '@/lib/workflows/workflow-error-integration';
import { contextualHelp } from '@/lib/workflows/contextual-help';
import type { ProcessingError, Workflow } from '@/types/workflows';

interface WorkflowProviderProps {
	children: React.ReactNode;
	toolId?: string;
	autoStartOnboarding?: boolean;
	enableErrorRecovery?: boolean;
	enableContextualHelp?: boolean;
	position?: 'bottom-right' | 'top-right' | 'floating';
}

export function WorkflowProvider({
	children,
	toolId,
	autoStartOnboarding = true,
	enableErrorRecovery = true,
	enableContextualHelp = true,
	position = 'bottom-right',
}: WorkflowProviderProps) {
	const {
		isVisible,
		setVisibility,
		activeWorkflow,
		context,
	} = useWorkflowStore();

	const [showOnboarding, setShowOnboarding] = React.useState(false);
	const [errorRecovery, setErrorRecovery] = React.useState<{
		error: ProcessingError | null;
		workflowId: string;
		stepId: string;
	} | null>(null);

	const [userState, setUserState] = React.useState<any>(null);

	// Initialize user onboarding
	React.useEffect(() => {
		if (autoStartOnboarding) {
			const state = userOnboarding.initializeUserOnboarding();
			setUserState(state);

			// Show onboarding for new users
			if (state.isNewUser && state.onboardingProgress.currentStep !== 'completed') {
				setShowOnboarding(true);
			}
		}
	}, [autoStartOnboarding]);

	// Auto-start workflow for tool if available
	React.useEffect(() => {
		if (toolId && !activeWorkflow) {
			// Check if there's a recommended workflow for this tool
		 const workflows = workflowManager.getWorkflowsForTool(toolId);
			const recommendedWorkflow = workflows.find(w => w.isRecommended);

			// Don't auto-start for all tools, just specific ones
			const autoStartTools = ['json-path-queries', 'code-executor', 'regex-tester'];
			if (recommendedWorkflow && autoStartTools.includes(toolId)) {
				// You could add logic to auto-start workflows here if desired
				// For now, we'll keep it manual
			}
		}
	}, [toolId, activeWorkflow]);

	// Handle error recovery
	const handleError = React.useCallback(async (
		error: ProcessingError,
		workflowId: string = 'unknown',
		stepId: string = 'unknown'
	) => {
		if (!enableErrorRecovery) return;

		try {
			const result = await workflowErrorHandler.handleWorkflowError(
				error,
				workflowId,
				stepId,
				context
			);

			if (!result.handled && result.suggestedWorkflow) {
				// Show error recovery workflow
				setErrorRecovery({
					error,
					workflowId,
					stepId,
				});
			}
		} catch (handlerError) {
			console.error('Error handler failed:', handlerError);
		}
	}, [context, enableErrorRecovery]);

	// Handle workflow completion
	const handleWorkflowComplete = (workflow: Workflow) => {
		// Update user history
		if (toolId) {
			userOnboarding.addToToolHistory(toolId);
		}

		// Trigger celebration if this is a significant achievement
		const workflows = workflowManager.getWorkflowsForTool(toolId || '');
		if (workflows.length > 0) {
			// This would trigger achievement logic
		}
	};

	// Handle onboarding completion
	const handleOnboardingComplete = () => {
		setShowOnboarding(false);
		userOnboarding.completeOnboardingStep('completed');
	};

	// Handle error recovery completion
	const handleErrorRecoveryComplete = (success: boolean) => {
		setErrorRecovery(null);

		if (success) {
			// Resume the workflow that was interrupted
			setVisibility(true);
		}
	};

	// Wrap children with contextual help functionality
	const wrapWithContextualHelp = (element: React.ReactElement): React.ReactElement => {
		if (!enableContextualHelp || !element.props.id) {
			return element;
		}

		return (
			<ContextualTooltip
				key={element.key}
				contextKey={element.props.id}
				elementId={element.props.id}
			>
				{element}
			</ContextualTooltip>
		);
	};

	// Provide global error handling
	React.useEffect(() => {
		const handleGlobalError = (event: ErrorEvent) => {
			const error: ProcessingError = {
				type: 'processing',
				message: event.message,
				code: 'GLOBAL_ERROR',
				details: event.error?.stack,
				recoverable: true,
				suggestions: ['Try refreshing the page', 'Check your input format'],
			};

			handleError(error);
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const error: ProcessingError = {
				type: 'network',
				message: event.reason?.message || 'Unhandled promise rejection',
				code: 'PROMISE_REJECTION',
				details: String(event.reason),
				recoverable: true,
				suggestions: ['Check your internet connection', 'Try again later'],
			};

			handleError(error);
		};

		window.addEventListener('error', handleGlobalError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleGlobalError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	}, [handleError]);

	return (
		<>
			{/* Error boundary and global error handling */}
			{children}

			{/* Workflow Trigger Button (for tools that have workflows) */}
			{toolId && workflowManager.getWorkflowsForTool(toolId).length > 0 && (
				<WorkflowTriggerButton
					toolId={toolId}
					onClick={() => {
						const workflows = workflowManager.getWorkflowsForTool(toolId);
						if (workflows.length > 0) {
							workflowManager.startWorkflow(workflows[0].id);
						}
					}}
				/>
			)}

			{/* Main Workflow Container */}
			<WorkflowContainer
				position={position}
				onComplete={handleWorkflowComplete}
			/>

			{/* Error Recovery Workflow */}
			{errorRecovery && enableErrorRecovery && (
				<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
					<ErrorRecoveryWorkflow
						error={errorRecovery.error}
						workflowId={errorRecovery.workflowId}
						stepId={errorRecovery.stepId}
						onRecoveryComplete={handleErrorRecoveryComplete}
						onCancel={() => setErrorRecovery(null)}
						className="w-full max-w-2xl"
					/>
				</div>
			)}

			{/* User Onboarding Wizard */}
			{showOnboarding && autoStartOnboarding && (
				<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
					<UserOnboardingWizard
						onComplete={handleOnboardingComplete}
						onSkip={() => setShowOnboarding(false)}
						className="w-full max-w-2xl"
					/>
				</div>
			)}
		</>
	);
}

// HOC to add workflow functionality to any component
export function withWorkflows<P extends object>(
	Component: React.ComponentType<P>,
	options: {
		toolId?: string;
		enableErrorRecovery?: boolean;
		enableContextualHelp?: boolean;
	} = {}
) {
	return function WrappedComponent(props: P) {
		return (
			<WorkflowProvider
				toolId={options.toolId}
				enableErrorRecovery={options.enableErrorRecovery}
				enableContextualHelp={options.enableContextualHelp}
			>
				<Component {...props} />
			</WorkflowProvider>
		);
	};
}

// Hook for components to interact with workflows
export function useWorkflows(toolId?: string) {
	const {
		activeWorkflow,
		currentStepIndex,
		context,
		setActiveWorkflow,
		goToNextStep,
		goToPreviousStep,
		completeStep,
	} = useWorkflowStore();

	const startWorkflow = React.useCallback((workflowId: string) => {
		const workflow = workflowManager.getWorkflowById(workflowId);
		if (workflow) {
			setActiveWorkflow(workflow);
		}
	}, [setActiveWorkflow]);

	const handleError = React.useCallback((error: ProcessingError) => {
		if (toolId) {
			workflowErrorHandler.handleWorkflowError(error, toolId, '', context);
		}
	}, [toolId, context]);

	const getContextualHelp = React.useCallback((contextKey: string) => {
		return contextualHelp.getContextualHelp(contextKey, context);
	}, [context]);

	return {
		// Workflow state
		activeWorkflow,
		currentStep: activeWorkflow?.steps[currentStepIndex],
		currentStepIndex,
		isWorkflowActive: !!activeWorkflow,

		// Workflow actions
		startWorkflow,
		goToNextStep,
		goToPreviousStep,
		completeStep,

		// Helper functions
		handleError,
		getContextualHelp,

		// Workflow info
		availableWorkflows: toolId ? workflowManager.getWorkflowsForTool(toolId) : [],
		recommendedWorkflows: workflowManager.getRecommendedWorkflows(),
	};
}
