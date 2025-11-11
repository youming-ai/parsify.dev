/**
 * Workflow Components Index
 * Exports all workflow-related components for easy importing
 */

// Core components
export { WorkflowProvider, withWorkflows, useWorkflows } from './workflow-provider';
export { WorkflowContainer } from './workflow-container';
export { WorkflowStep } from './workflow-step';
export { WorkflowControls } from './workflow-controls';
export { WorkflowProgressBar } from './workflow-progress-bar';
export { WorkflowHeader } from './workflow-header';

// Interactive components
export { ContextualTooltip } from './contextual-tooltip';
export { ErrorRecoveryWorkflow } from './error-recovery-workflow';
export { UserOnboardingWizard } from './user-onboarding-wizard';
export { WorkflowTriggerButton } from './workflow-trigger-button';

// Types and utilities
export * from '../../types/workflows';
export { workflowManager } from '../../lib/workflows/workflow-manager';
export { workflowAnalytics } from '../../lib/workflows/workflow-analytics';
export { contextualHelp } from '../../lib/workflows/contextual-help';
export { userOnboarding } from '../../lib/workflows/user-onboarding';
export { workflowErrorHandler } from '../../lib/workflows/workflow-error-integration';

// Store hooks
export { useWorkflowStore, useCurrentWorkflow, useCurrentStep, useWorkflowProgress, useWorkflowPreferences } from '../../lib/workflows/workflow-store';
