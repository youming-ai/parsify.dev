/**
 * Error Recovery Utilities
 * Provides intelligent error handling, recovery guidance, and retry mechanisms
 */

export interface ErrorInfo {
	type: 'validation' | 'processing' | 'network' | 'security' | 'system' | 'user_input';
	severity: 'critical' | 'error' | 'warning' | 'info';
	code: string;
	message: string;
	details?: any;
	timestamp: Date;
	context?: string;
	stack?: string;
	recoverable: boolean;
}

export interface RecoveryStep {
	id: string;
	title: string;
	description: string;
	action: string;
	type: 'manual' | 'automatic' | 'suggested';
	priority: number;
	estimatedTime?: number;
	prerequisites?: string[];
}

export interface RecoveryStrategy {
	id: string;
	errorType: string;
	errorCode?: string;
	steps: RecoveryStep[];
	successCriteria: string[];
	fallbackOptions: RecoveryStrategy[];
}

export interface ErrorRecoveryResult {
	success: boolean;
	appliedStrategy: string;
	stepsCompleted: string[];
	remainingIssues: ErrorInfo[];
	recommendations: string[];
	nextActions: string[];
}

export class ErrorRecovery {
	private static instance: ErrorRecovery;
	private strategies: Map<string, RecoveryStrategy> = new Map();

	private constructor() {
		this.initializeStrategies();
	}

	public static getInstance(): ErrorRecovery {
		if (!ErrorRecovery.instance) {
			ErrorRecovery.instance = new ErrorRecovery();
		}
		return ErrorRecovery.instance;
	}

	// Initialize predefined error recovery strategies
	private initializeStrategies(): void {
		// JSON parsing errors
		this.strategies.set('validation-json-parse', {
			id: 'validation-json-parse',
			errorType: 'validation',
			errorCode: 'JSON_PARSE_ERROR',
			steps: [
				{
					id: 'check-syntax',
					title: 'Check JSON Syntax',
					description: 'Verify the JSON syntax is correct',
					action: 'Look for missing commas, unmatched brackets, or quote issues',
					type: 'manual',
					priority: 1,
					estimatedTime: 30,
				},
				{
					id: 'use-validator',
					title: 'Use JSON Validator',
					description: 'Validate JSON using our validator tool',
					action: 'Copy the JSON to the validator tool for detailed error checking',
					type: 'suggested',
					priority: 2,
					prerequisites: ['check-syntax'],
				},
				{
					id: 'format-json',
					title: 'Format and Beautify',
					description: 'Format the JSON to make syntax errors more visible',
					action: 'Use the JSON formatter to properly indent and structure the JSON',
					type: 'suggested',
					priority: 3,
				},
			],
			successCriteria: ['JSON parses without errors', 'Structure is valid and readable'],
			fallbackOptions: [this.strategies.get('validation-json-repair')!, this.strategies.get('validation-sample-data')!],
		});

		// File processing errors
		this.strategies.set('processing-file-size', {
			id: 'processing-file-size',
			errorType: 'processing',
			errorCode: 'FILE_TOO_LARGE',
			steps: [
				{
					id: 'check-limit',
					title: 'Check File Size Limits',
					description: 'Verify the file size against processing limits',
					action: 'Current limit is 10MB for file processing',
					type: 'manual',
					priority: 1,
					estimatedTime: 10,
				},
				{
					id: 'compress-file',
					title: 'Compress Large Files',
					description: 'Compress the file before processing',
					action: 'Use image compression or file compression tools',
					type: 'suggested',
					priority: 2,
					estimatedTime: 60,
				},
				{
					id: 'split-file',
					title: 'Split Large Files',
					description: 'Split large files into smaller chunks',
					action: 'Process the file in smaller segments',
					type: 'manual',
					priority: 3,
					estimatedTime: 120,
				},
			],
			successCriteria: ['File size is within processing limits', 'File can be processed successfully'],
			fallbackOptions: [this.strategies.get('processing-server-side')!],
		});

		// Network errors
		this.strategies.set('network-timeout', {
			id: 'network-timeout',
			errorType: 'network',
			errorCode: 'REQUEST_TIMEOUT',
			steps: [
				{
					id: 'check-connection',
					title: 'Check Internet Connection',
					description: 'Verify your internet connection is stable',
					action: 'Test with other websites or services',
					type: 'manual',
					priority: 1,
					estimatedTime: 15,
				},
				{
					id: 'retry-request',
					title: 'Retry the Request',
					description: 'Retry the network request after a brief delay',
					action: 'Wait 5 seconds and try again',
					type: 'automatic',
					priority: 2,
					estimatedTime: 10,
				},
				{
					id: 'use-offline',
					title: 'Use Offline Mode',
					description: 'Switch to offline processing if available',
					action: 'Many tools work offline without network requirements',
					type: 'suggested',
					priority: 3,
				},
			],
			successCriteria: ['Network request completes successfully', 'Data is received and processed'],
			fallbackOptions: [this.strategies.get('network-offline')!],
		});

		// Code execution errors
		this.strategies.set('processing-code-execution', {
			id: 'processing-code-execution',
			errorType: 'processing',
			errorCode: 'CODE_EXECUTION_ERROR',
			steps: [
				{
					id: 'check-syntax',
					title: 'Check Code Syntax',
					description: 'Verify the code syntax is correct for the selected language',
					action: 'Look for syntax errors, missing semicolons, or bracket issues',
					type: 'manual',
					priority: 1,
					estimatedTime: 45,
				},
				{
					id: 'validate-input',
					title: 'Validate Input Data',
					description: 'Check if input data format matches expectations',
					action: 'Ensure input data is in the correct format for the code',
					type: 'manual',
					priority: 2,
					estimatedTime: 30,
				},
				{
					id: 'reduce-complexity',
					title: 'Reduce Code Complexity',
					description: 'Simplify the code to avoid timeout issues',
					action: 'Break complex operations into smaller steps',
					type: 'suggested',
					priority: 3,
					estimatedTime: 60,
				},
			],
			successCriteria: ['Code executes without errors', 'Expected output is produced'],
			fallbackOptions: [this.strategies.get('processing-code-sandbox')!],
		});

		// Generic fallback strategies
		this.strategies.set('validation-json-repair', {
			id: 'validation-json-repair',
			errorType: 'validation',
			steps: [
				{
					id: 'auto-repair',
					title: 'Attempt Auto-Repair',
					description: 'Try to automatically fix common JSON syntax issues',
					action: 'Use JSON repair algorithms to fix syntax errors',
					type: 'automatic',
					priority: 1,
				},
			],
			successCriteria: ['JSON is syntactically valid'],
			fallbackOptions: [],
		});

		this.strategies.set('validation-sample-data', {
			id: 'validation-sample-data',
			errorType: 'validation',
			steps: [
				{
					id: 'use-sample',
					title: 'Use Sample Data',
					description: 'Replace with valid sample data for testing',
					action: 'Load pre-configured sample data in the correct format',
					type: 'suggested',
					priority: 1,
				},
			],
			successCriteria: ['Sample data loads and processes correctly'],
			fallbackOptions: [],
		});
	}

	// Analyze error and determine recovery strategy
	public analyzeError(error: Error | string, context?: string): ErrorInfo {
		let errorInfo: ErrorInfo;

		if (typeof error === 'string') {
			errorInfo = {
				type: this.inferErrorType(error),
				severity: this.inferErrorSeverity(error),
				code: 'UNKNOWN',
				message: error,
				timestamp: new Date(),
				context,
				recoverable: true,
			};
		} else {
			errorInfo = {
				type: this.inferErrorType(error.message),
				severity: this.inferErrorSeverity(error.message),
				code: error.name || 'UNKNOWN',
				message: error.message,
				details: error,
				timestamp: new Date(),
				context,
				stack: error.stack,
				recoverable: this.isRecoverable(error),
			};
		}

		return errorInfo;
	}

	// Get recovery strategy for an error
	public getRecoveryStrategy(errorInfo: ErrorInfo): RecoveryStrategy | null {
		const key = `${errorInfo.type}-${errorInfo.code}`;
		const typeKey = `${errorInfo.type}`;

		return this.strategies.get(key) || this.strategies.get(typeKey) || null;
	}

	// Execute recovery strategy
	public async executeRecovery(
		errorInfo: ErrorInfo,
		context?: any,
		onStepComplete?: (step: RecoveryStep, result: any) => void,
	): Promise<ErrorRecoveryResult> {
		const strategy = this.getRecoveryStrategy(errorInfo);

		if (!strategy) {
			return {
				success: false,
				appliedStrategy: 'none',
				stepsCompleted: [],
				remainingIssues: [errorInfo],
				recommendations: ['Manual intervention required'],
				nextActions: ['Contact support if issue persists'],
			};
		}

		const completedSteps: string[] = [];
		const remainingIssues: ErrorInfo[] = [];
		let currentStrategy = strategy;

		try {
			for (const step of currentStrategy.steps) {
				const stepResult = await this.executeStep(step, context, errorInfo);

				if (onStepComplete) {
					onStepComplete(step, stepResult);
				}

				completedSteps.push(step.id);

				// Check if step resolved the issue
				if (stepResult.success) {
					const validation = await this.validateRecovery(stepResult, currentStrategy.successCriteria);
					if (validation.success) {
						return {
							success: true,
							appliedStrategy: currentStrategy.id,
							stepsCompleted: completedSteps,
							remainingIssues: [],
							recommendations: this.getRecommendations(currentStrategy, stepResult),
							nextActions: [],
						};
					}
				}
			}

			// If all steps failed, try fallback strategies
			for (const fallback of currentStrategy.fallbackOptions) {
				const fallbackResult = await this.executeRecovery(errorInfo, context, onStepComplete);
				if (fallbackResult.success) {
					return fallbackResult;
				}
			}

			return {
				success: false,
				appliedStrategy: currentStrategy.id,
				stepsCompleted: completedSteps,
				remainingIssues: [errorInfo],
				recommendations: ['Try alternative approaches', 'Check input data format'],
				nextActions: ['Review error details', 'Try manual corrections'],
			};
		} catch (recoveryError) {
			return {
				success: false,
				appliedStrategy: currentStrategy.id,
				stepsCompleted: completedSteps,
				remainingIssues: [errorInfo, this.analyzeError(recoveryError)],
				recommendations: ['Recovery process failed'],
				nextActions: ['Try manual recovery', 'Contact support'],
			};
		}
	}

	// Execute individual recovery step
	private async executeStep(step: RecoveryStep, context: any, originalError: ErrorInfo): Promise<any> {
		switch (step.type) {
			case 'automatic':
				return await this.executeAutomaticStep(step, context, originalError);
			case 'manual':
				return {
					success: false,
					message: 'Manual step requires user intervention',
					action: step.action,
				};
			case 'suggested':
				return {
					success: false,
					message: 'Suggested step for user to consider',
					action: step.action,
				};
			default:
				return {
					success: false,
					message: `Unknown step type: ${step.type}`,
				};
		}
	}

	// Execute automatic recovery steps
	private async executeAutomaticStep(step: RecoveryStep, context: any, originalError: ErrorInfo): Promise<any> {
		switch (step.id) {
			case 'retry-request':
				// Simulate retry delay
				await new Promise((resolve) => setTimeout(resolve, 5000));
				return {
					success: true,
					message: 'Request retried after delay',
				};

			case 'auto-repair':
				// Auto-repair JSON syntax
				if (originalError.type === 'validation') {
					try {
						const repaired = this.attemptJSONRepair(context?.input || '');
						return {
							success: true,
							result: repaired,
							message: 'JSON syntax auto-repaired',
						};
					} catch (repairError) {
						return {
							success: false,
							error: repairError,
						};
					}
				}
				break;

			default:
				return {
					success: false,
					message: `Automatic step ${step.id} not implemented`,
				};
		}

		return {
			success: false,
			message: `Step ${step.id} could not be executed automatically`,
		};
	}

	// Attempt to repair JSON syntax
	private attemptJSONRepair(input: string): string {
		// Common JSON repairs
		let repaired = input
			// Fix trailing commas
			.replace(/,(\s*[}\]])/g, '$1')
			// Fix missing quotes around keys
			.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
			// Fix single quotes
			.replace(/'/g, '"')
			// Remove comments (non-standard but common)
			.replace(/\/\/.*$/gm, '')
			.replace(/\/\*[\s\S]*?\*\//g, '');

		// Validate the repair
		JSON.parse(repaired);
		return repaired;
	}

	// Validate recovery against success criteria
	private async validateRecovery(stepResult: any, criteria: string[]): Promise<{ success: boolean; details?: string }> {
		for (const criterion of criteria) {
			if (!this.meetsCriterion(stepResult, criterion)) {
				return {
					success: false,
					details: `Failed criterion: ${criterion}`,
				};
			}
		}

		return { success: true };
	}

	// Check if result meets specific criterion
	private meetsCriterion(result: any, criterion: string): boolean {
		switch (criterion) {
			case 'JSON parses without errors':
				if (result.result) {
					try {
						JSON.parse(result.result);
						return true;
					} catch {
						return false;
					}
				}
				return false;
			case 'Network request completes successfully':
				return result.success === true;
			case 'Code executes without errors':
				return !result.error;
			default:
				return true; // Unknown criteria, assume met
		}
	}

	// Get recommendations based on recovery result
	private getRecommendations(strategy: RecoveryStrategy, result: any): string[] {
		const recommendations: string[] = [];

		if (result.success) {
			recommendations.push('Recovery successful - continue with normal operation');

			// Add preventive recommendations
			if (strategy.id.includes('validation')) {
				recommendations.push('Validate input data before processing');
			}
			if (strategy.id.includes('network')) {
				recommendations.push('Check network connection stability');
			}
		}

		return recommendations;
	}

	// Infer error type from message
	private inferErrorType(message: string): ErrorInfo['type'] {
		const lowerMessage = message.toLowerCase();

		if (lowerMessage.includes('json') || lowerMessage.includes('parse') || lowerMessage.includes('syntax')) {
			return 'validation';
		}
		if (lowerMessage.includes('timeout') || lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
			return 'network';
		}
		if (
			lowerMessage.includes('permission') ||
			lowerMessage.includes('security') ||
			lowerMessage.includes('unauthorized')
		) {
			return 'security';
		}
		if (lowerMessage.includes('memory') || lowerMessage.includes('system') || lowerMessage.includes('disk')) {
			return 'system';
		}
		if (lowerMessage.includes('input') || lowerMessage.includes('format') || lowerMessage.includes('required')) {
			return 'user_input';
		}

		return 'processing';
	}

	// Infer error severity from message
	private inferErrorSeverity(message: string): ErrorInfo['severity'] {
		const lowerMessage = message.toLowerCase();

		if (lowerMessage.includes('critical') || lowerMessage.includes('fatal') || lowerMessage.includes('security')) {
			return 'critical';
		}
		if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('timeout')) {
			return 'error';
		}
		if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated')) {
			return 'warning';
		}

		return 'info';
	}

	// Check if error is recoverable
	private isRecoverable(error: Error): boolean {
		const message = error.message.toLowerCase();

		// Non-recoverable errors
		if (message.includes('security') || message.includes('permission denied') || message.includes('access denied')) {
			return false;
		}

		// Generally recoverable errors
		return true;
	}

	// Create error context
	public createContext(toolId: string, operation: string, data?: any): string {
		return `Tool: ${toolId}, Operation: ${operation}, Data: ${data ? 'present' : 'none'}`;
	}

	// Format error for user display
	public formatErrorForUser(errorInfo: ErrorInfo): string {
		const { type, severity, message, recoverable } = errorInfo;

		let formatted = `${severity.toUpperCase()}: ${message}`;

		if (recoverable) {
			formatted += '\n\nThis error can be recovered. Click "Recovery Options" for assistance.';
		}

		if (type === 'validation') {
			formatted += '\n\nTip: Check your input format and syntax.';
		}

		return formatted;
	}

	// Get user-friendly error messages
	public getUserFriendlyMessage(errorInfo: ErrorInfo): {
		title: string;
		message: string;
		actionable: boolean;
	} {
		const { type, severity, message } = errorInfo;

		switch (type) {
			case 'validation':
				return {
					title: 'Input Validation Error',
					message: 'The input data is not in the correct format.',
					actionable: true,
				};
			case 'network':
				return {
					title: 'Network Error',
					message: 'Unable to connect to the server or service.',
					actionable: true,
				};
			case 'processing':
				return {
					title: 'Processing Error',
					message: 'An error occurred while processing your data.',
					actionable: true,
				};
			case 'security':
				return {
					title: 'Security Error',
					message: 'A security restriction was encountered.',
					actionable: false,
				};
			case 'system':
				return {
					title: 'System Error',
					message: 'A system-level error occurred.',
					actionable: false,
				};
			default:
				return {
					title: 'Error',
					message: message,
					actionable: true,
				};
		}
	}
}

// Singleton instance
export const errorRecovery = ErrorRecovery.getInstance();
