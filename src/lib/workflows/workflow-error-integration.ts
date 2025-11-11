/**
 * Workflow Error Integration
 * Integrates guided workflows with existing error handling and recovery systems
 */

import type {
	Workflow,
	WorkflowStep,
	WorkflowContext,
	WorkflowError,
	ProcessingError
} from '@/types/workflows';
import type { ErrorContext, RecoveryStrategy } from '@/monitoring/error-handling';
import { contextualHelp } from './contextual-help';
import { useWorkflowStore } from './workflow-store';
import { workflowAnalytics } from './workflow-analytics';
import { workflowManager } from './workflow-manager';

export class WorkflowErrorHandler {
	private static instance: WorkflowErrorHandler;
	private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
	private errorWorkflows: Map<string, string> = new Map();

	private constructor() {
		this.initializeRecoveryStrategies();
		this.initializeErrorWorkflows();
	}

	static getInstance(): WorkflowErrorHandler {
		if (!WorkflowErrorHandler.instance) {
			WorkflowErrorHandler.instance = new WorkflowErrorHandler();
		}
		return WorkflowErrorHandler.instance;
	}

	// Initialize recovery strategies for common workflow errors
	private initializeRecoveryStrategies() {
		// JSON validation errors
		this.recoveryStrategies.set('JSON_SYNTAX_ERROR', {
			name: 'Fix JSON Syntax',
			description: 'Common JSON syntax issues and their solutions',
			steps: [
				'Check for missing commas between elements',
				'Ensure all strings are properly quoted',
				'Verify brackets and braces are balanced',
				'Remove trailing commas',
			],
			automated: true,
			workflowId: 'json-validation-recovery',
		});

		// Code execution errors
		this.recoveryStrategies.set('CODE_EXECUTION_ERROR', {
			name: 'Debug Code Execution',
			description: 'Steps to debug and fix code execution issues',
			steps: [
				'Check for syntax errors in your code',
				'Verify all variables are declared',
				'Ensure functions are called correctly',
				'Check for infinite loops',
			],
			automated: false,
			workflowId: 'code-debugging-workflow',
		});

		// Regular expression errors
		this.recoveryStrategies.set('REGEX_SYNTAX_ERROR', {
			name: 'Fix Regex Pattern',
			description: 'Common regex pattern errors and solutions',
			steps: [
				'Escape special characters properly',
				'Check for balanced parentheses and brackets',
				'Validate character classes',
				'Test pattern with simpler input first',
			],
			automated: true,
			workflowId: 'regex-debugging-workflow',
		});

		// File processing errors
		this.recoveryStrategies.set('FILE_PROCESSING_ERROR', {
			name: 'Resolve File Issues',
			description: 'Common file processing problems and fixes',
			steps: [
				'Check file format compatibility',
				'Verify file size limits',
				'Ensure file is not corrupted',
				'Try with a smaller test file',
			],
			automated: false,
			workflowId: 'file-processing-recovery',
		});

		// Network errors
		this.recoveryStrategies.set('NETWORK_ERROR', {
			name: 'Handle Network Issues',
			description: 'Steps to resolve network-related problems',
			steps: [
				'Check internet connection',
				'Verify API endpoint is accessible',
				'Try again after a short delay',
				'Check for firewall or CORS issues',
			],
			automated: false,
			workflowId: 'network-troubleshooting',
		});
	}

	// Initialize error-to-workflow mappings
	private initializeErrorWorkflows() {
		this.errorWorkflows.set('validation_error', 'json-validation-recovery');
		this.errorWorkflows.set('syntax_error', 'syntax-correction-workflow');
		this.errorWorkflows.set('execution_error', 'code-debugging-workflow');
		this.errorWorkflows.set('timeout_error', 'performance-optimization');
		this.errorWorkflows.set('permission_error', 'security-troubleshooting');
	}

	// Handle workflow errors with context-aware recovery
	public async handleWorkflowError(
		error: ProcessingError,
		workflowId: string,
		stepId: string,
		context: WorkflowContext
	): Promise<{
		handled: boolean;
		recoveryStrategy?: RecoveryStrategy;
		suggestedWorkflow?: string;
		contextualHelp?: any[];
	}> {
		// Track the error
		workflowAnalytics.trackError(workflowId, context.sessionId || 'default', stepId, error.message);

		// Get recovery strategy
		const recoveryStrategy = this.getRecoveryStrategy(error.type, error.code);

		// Get contextual help
		const contextualHelps = contextualHelp.getErrorHelp(error.type, error.message);

		// Suggest workflow if available
		const suggestedWorkflow = this.getSuggestedWorkflow(error.type, error.code);

		// Determine if error can be automatically recovered
		const canAutoRecover = await this.canAutoRecover(error, context);

		if (canAutoRecover) {
			const recovered = await this.attemptAutoRecovery(error, context);
			return {
				handled: recovered,
				recoveryStrategy,
				suggestedWorkflow,
				contextualHelp: contextualHelps,
			};
		}

		return {
			handled: false,
			recoveryStrategy,
			suggestedWorkflow,
			contextualHelp: contextualHelps,
		};
	}

	// Get recovery strategy for error
	private getRecoveryStrategy(errorType: string, errorCode: string): RecoveryStrategy | undefined {
		// Try specific error code first
		const strategy = this.recoveryStrategies.get(errorCode);
		if (strategy) return strategy;

		// Try error type
		const typeStrategy = this.recoveryStrategies.get(errorType);
		if (typeStrategy) return typeStrategy;

		// Return generic strategy
		return {
			name: 'General Error Recovery',
			description: 'General steps to resolve common errors',
			steps: [
				'Review the error message for details',
				'Check your input for format issues',
				'Try with simpler input',
				'Refresh and try again',
			],
			automated: false,
		};
	}

	// Get suggested workflow for error recovery
	private getSuggestedWorkflow(errorType: string, errorCode: string): string | undefined {
		const workflowId = this.errorWorkflows.get(errorType.toLowerCase());
		if (workflowId) return workflowId;

		// Check for specific error codes
		if (errorCode.includes('JSON')) return 'json-troubleshooting';
		if (errorCode.includes('REGEX')) return 'regex-pattern-builder';
		if (errorCode.includes('CODE')) return 'code-debugging';

		return undefined;
	}

	// Check if error can be automatically recovered
	private async canAutoRecover(error: ProcessingError, context: WorkflowContext): Promise<boolean> {
		// Auto-recover recoverable errors
		if (!error.recoverable) return false;

		// Don't auto-recover if user has disabled it
		if (context.userData.autoRecovery === false) return false;

		// Auto-recover specific error types
		switch (error.type) {
			case 'validation':
				return this.canAutoFixValidationError(error);
			case 'network':
				return await this.canAutoFixNetworkError(error);
			case 'security':
				return this.canAutoFixSecurityError(error);
			default:
				return false;
		}
	}

	// Attempt automatic recovery
	private async attemptAutoRecovery(error: ProcessingError, context: WorkflowContext): Promise<boolean> {
		try {
			switch (error.type) {
				case 'validation':
					return await this.autoFixValidationError(error, context);
				case 'network':
					return await this.autoRetryNetworkError(error, context);
				case 'security':
					return await this.autoFixSecurityError(error, context);
				default:
					return false;
			}
		} catch (recoveryError) {
			console.error('Auto-recovery failed:', recoveryError);
			return false;
		}
	}

	// Auto-fix validation errors
	private canAutoFixValidationError(error: ProcessingError): boolean {
		const autoFixablePatterns = [
			/trailing comma/i,
			/missing comma/i,
			/unmatched bracket/i,
			/unmatched brace/i,
			/extra comma/i,
		];

		return autoFixablePatterns.some(pattern => pattern.test(error.message));
	}

	private async autoFixValidationError(error: ProcessingError, context: WorkflowContext): Promise<boolean> {
		// Implementation would depend on the specific validation error
		// This is a placeholder for auto-fixing logic

		// For JSON errors, we could try to auto-format the input
		if (error.message.includes('JSON')) {
			// Try to parse and re-stringify with proper formatting
			try {
				const input = context.userData.currentInput;
				if (typeof input === 'string') {
					const parsed = JSON.parse(input);
					const fixed = JSON.stringify(parsed, null, 2);
					context.userData.currentInput = fixed;
					return true;
				}
			} catch {
				// Auto-fix failed
			}
		}

		return false;
	}

	// Auto-retry network errors
	private async canAutoFixNetworkError(error: ProcessingError): Promise<boolean> {
		const retryableErrors = [
			'NETWORK_ERROR',
			'TIMEOUT',
			'CONNECTION_REFUSED',
		];

		return retryableErrors.includes(error.code) &&
			   (context.userData.retryCount || 0) < 3;
	}

	private async autoRetryNetworkError(error: ProcessingError, context: WorkflowContext): Promise<boolean> {
		const retryCount = context.userData.retryCount || 0;
		if (retryCount >= 3) return false;

		// Exponential backoff
		const delay = Math.pow(2, retryCount) * 1000;
		await new Promise(resolve => setTimeout(resolve, delay));

		context.userData.retryCount = retryCount + 1;

		// The actual retry would be handled by the calling code
		return true;
	}

	// Auto-fix security errors
	private canAutoFixSecurityError(error: ProcessingError): boolean {
		const autoFixableSecurityErrors = [
			'PERMISSION_DENIED',
			'ACCESS_DENIED',
		];

		return autoFixableSecurityErrors.includes(error.code);
	}

	private async autoFixSecurityError(error: ProcessingError, context: WorkflowContext): Promise<boolean> {
		// For security errors, we might need to adjust permissions or settings
		// This would depend on the specific security context

		if (error.code === 'PERMISSION_DENIED') {
			// Request necessary permissions
			try {
				// This would integrate with browser permissions API
				if ('permissions' in navigator) {
					// Request permission logic here
					return true;
				}
			} catch {
				// Permission request failed
			}
		}

		return false;
	}

	// Create error recovery workflow
	public createErrorRecoveryWorkflow(
		error: ProcessingError,
		context: WorkflowContext
	): Workflow | null {
		const baseWorkflow: Workflow = {
			id: `error-recovery-${Date.now()}`,
			name: `Fix ${error.type} Error`,
			description: `Step-by-step guide to resolve: ${error.message}`,
			toolId: context.toolId,
			category: context.toolId.includes('json') ? 'JSON Processing Suite' as any :
					 context.toolId.includes('code') ? 'Code Processing Suite' as any :
					 'Text Processing Suite' as any,
			difficulty: 'intermediate',
			estimatedDuration: 10,
			tags: ['error-recovery', 'troubleshooting'],
			steps: [
				{
					id: 'error-understanding',
					title: 'Understand the Error',
					description: 'Learn about this type of error and common causes',
					content: {
						type: 'instruction',
						text: `Error: ${error.message}\n\nType: ${error.type}\n\n${error.details ? 'Details: ' + error.details : ''}`,
					},
					difficulty: 'beginner',
				},
				{
					id: 'error-troubleshooting',
					title: 'Troubleshooting Steps',
					description: 'Follow these steps to fix the error',
					content: {
						type: 'interactive',
						text: 'Complete the following troubleshooting steps:',
						examples: error.suggestions ? [
							{
								title: 'Suggested Solutions',
								description: error.suggestions.join('\n'),
							},
						] : [],
					},
					difficulty: 'intermediate',
				},
			],
		};

		return baseWorkflow;
	}

	// Get error analytics for workflow optimization
	public getErrorAnalytics(workflowId: string): {
		commonErrors: Array<{
			type: string;
			count: number;
			description: string;
		}>;
		recoverySuccessRate: number;
		averageRecoveryTime: number;
	} {
		const analytics = workflowAnalytics.getWorkflowAnalytics(workflowId);

		// Aggregate error data
		const errorCounts: Record<string, { count: number; descriptions: Set<string> }> = {};
		let totalErrors = 0;
		let recoveredErrors = 0;
		let totalRecoveryTime = 0;

		analytics.forEach(session => {
			if (session.errors > 0) {
				totalErrors += session.errors;
				// This would need more detailed error tracking in the analytics
				// For now, we'll use placeholder data
			}
		});

		// Convert to array format
		const commonErrors = Object.entries(errorCounts).map(([type, data]) => ({
			type,
			count: data.count,
			description: Array.from(data.descriptions).join(', '),
		})).sort((a, b) => b.count - a.count);

		return {
			commonErrors,
			recoverySuccessRate: totalErrors > 0 ? recoveredErrors / totalErrors : 0,
			averageRecoveryTime: recoveredErrors > 0 ? totalRecoveryTime / recoveredErrors : 0,
		};
	}
}

// Export singleton instance
export const workflowErrorHandler = WorkflowErrorHandler.getInstance();
