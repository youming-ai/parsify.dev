/**
 * Intelligent Error Handling System for Parsify.dev
 * Comprehensive error management for all 58 developer tools across 6 categories
 */

import { ToolCategory, SupportedLanguage } from '@/types/tools';
import { errorRecovery } from './error-recovery';

// Enhanced error types with tool-specific context
export interface EnhancedErrorInfo {
	id: string;
	type: ErrorType;
	severity: ErrorSeverity;
	category: ToolCategory;
	subcategory?: string;
	toolId?: string;
	operation?: string;
	code: string;
	message: string;
	userMessage: string;
	technicalDetails?: any;
	timestamp: Date;
	context: ErrorContext;
	recoverable: boolean;
	recoverySuggestions: RecoverySuggestion[];
	relatedTools?: string[];
	alternativeSolutions?: string[];
}

export type ErrorType =
	| 'validation'
	| 'syntax'
	| 'parsing'
	| 'processing'
	| 'network'
	| 'security'
	| 'performance'
	| 'compatibility'
	| 'resource'
	| 'user_input'
	| 'system'
	| 'timeout'
	| 'configuration'
	| 'unknown';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorContext {
	browser?: string;
	platform?: string;
	inputSize?: number;
	inputType?: string;
	operationType?: string;
	previousErrors?: string[];
	userActions?: string[];
	sessionData?: any;
}

export interface RecoverySuggestion {
	id: string;
	title: string;
	description: string;
	action: string;
	type: 'automatic' | 'manual' | 'suggested';
	priority: number;
	successRate?: number;
	estimatedTime?: number;
	difficulty: 'easy' | 'medium' | 'hard';
	prerequisites?: string[];
	relatedExamples?: string[];
}

export interface ToolSpecificError {
	toolId: string;
	category: ToolCategory;
	commonErrors: ErrorPattern[];
	specificStrategies: RecoveryStrategy[];
}

export interface ErrorPattern {
	pattern: RegExp | string;
	type: ErrorType;
	severity: ErrorSeverity;
	message: string;
	recoverable: boolean;
	strategy?: string;
}

export interface RecoveryStrategy {
	id: string;
	name: string;
	description: string;
	conditions: (error: EnhancedErrorInfo) => boolean;
	steps: RecoveryStep[];
	successCriteria: string[];
	fallbackOptions: string[];
}

export interface RecoveryStep {
	id: string;
	title: string;
	description: string;
	action: string;
	type: 'automatic' | 'manual' | 'suggested';
	priority: number;
	estimatedTime?: number;
	difficulty: 'easy' | 'medium' | 'hard';
}

export interface ErrorMetrics {
	totalErrors: number;
	errorsByType: Record<ErrorType, number>;
	errorsByCategory: Record<ToolCategory, number>;
	errorsBySeverity: Record<ErrorSeverity, number>;
	recoverySuccessRate: number;
	mostCommonErrors: Array<{ error: string; count: number }>;
}

/**
 * Main Error Handler Class
 */
export class IntelligentErrorHandler {
	private static instance: IntelligentErrorHandler;
	private toolSpecificErrors: Map<string, ToolSpecificError> = new Map();
	private errorHistory: EnhancedErrorInfo[] = [];
	private errorMetrics: ErrorMetrics = {
		totalErrors: 0,
		errorsByType: {} as Record<ErrorType, number>,
		errorsByCategory: {} as Record<ToolCategory, number>,
		errorsBySeverity: {} as Record<ErrorSeverity, number>,
		recoverySuccessRate: 0,
		mostCommonErrors: [],
	};

	private constructor() {
		this.initializeToolSpecificErrors();
		this.initializeMetrics();
	}

	public static getInstance(): IntelligentErrorHandler {
		if (!IntelligentErrorHandler.instance) {
			IntelligentErrorHandler.instance = new IntelligentErrorHandler();
		}
		return IntelligentErrorHandler.instance;
	}

	/**
	 * Initialize tool-specific error patterns and strategies
	 */
	private initializeToolSpecificErrors(): void {
		// JSON Processing Tools
		this.registerToolSpecificErrors({
			toolId: 'json-validator',
			category: 'JSON Processing Suite',
			commonErrors: [
				{
					pattern: /Unexpected token/i,
					type: 'syntax',
					severity: 'error',
					message: 'Invalid JSON syntax detected',
					recoverable: true,
					strategy: 'json-syntax-repair',
				},
				{
					pattern: /Expecting property name/i,
					type: 'validation',
					severity: 'error',
					message: 'JSON property name expected but not found',
					recoverable: true,
					strategy: 'json-format-correct',
				},
			],
			specificStrategies: [
				{
					id: 'json-syntax-repair',
					name: 'JSON Syntax Repair',
					description: 'Automatically fix common JSON syntax errors',
					conditions: (error) => error.type === 'syntax' && error.category === 'JSON Processing Suite',
					steps: [
						{
							id: 'fix-trailing-commas',
							title: 'Fix Trailing Commas',
							description: 'Remove trailing commas in JSON objects and arrays',
							action: 'Remove any commas before closing brackets or braces',
							type: 'automatic',
							priority: 1,
							difficulty: 'easy',
						},
						{
							id: 'quote-property-names',
							title: 'Quote Property Names',
							description: 'Add quotes to unquoted property names',
							action: 'Ensure all property names are enclosed in double quotes',
							type: 'automatic',
							priority: 2,
							difficulty: 'easy',
						},
					],
					successCriteria: ['JSON parses successfully', 'All properties are properly quoted'],
					fallbackOptions: ['manual-json-edit', 'sample-data-replacement'],
				},
			],
		});

		// Code Processing Tools
		this.registerToolSpecificErrors({
			toolId: 'code-executor',
			category: 'Code Processing Suite',
			commonErrors: [
				{
					pattern: /Unexpected identifier/i,
					type: 'syntax',
					severity: 'error',
					message: 'Syntax error in code execution',
					recoverable: true,
					strategy: 'code-syntax-fix',
				},
				{
					pattern: /Maximum execution time/i,
					type: 'timeout',
					severity: 'error',
					message: 'Code execution exceeded time limit',
					recoverable: true,
					strategy: 'code-optimization',
				},
			],
			specificStrategies: [
				{
					id: 'code-syntax-fix',
					name: 'Code Syntax Correction',
					description: 'Fix common syntax errors in code',
					conditions: (error) => error.type === 'syntax' && error.category === 'Code Processing Suite',
					steps: [
						{
							id: 'check-brackets',
							title: 'Check Bracket Matching',
							description: 'Ensure all brackets, braces, and parentheses are properly matched',
							action: 'Verify opening and closing brackets match',
							type: 'manual',
							priority: 1,
							difficulty: 'easy',
						},
						{
							id: 'check-semicolon',
							title: 'Check Semicolons',
							description: 'Add missing semicolons where required',
							action: 'Review language-specific semicolon requirements',
							type: 'suggested',
							priority: 2,
							difficulty: 'easy',
						},
					],
					successCriteria: ['Code syntax is valid', 'No syntax errors detected'],
					fallbackOptions: ['code-validator-tool', 'language-specific-help'],
				},
			],
		});

		// File Processing Tools
		this.registerToolSpecificErrors({
			toolId: 'file-converter',
			category: 'File Processing Suite',
			commonErrors: [
				{
					pattern: /File too large/i,
					type: 'resource',
					severity: 'error',
					message: 'File size exceeds processing limit',
					recoverable: true,
					strategy: 'file-size-reduction',
				},
				{
					pattern: /Unsupported format/i,
					type: 'validation',
					severity: 'error',
					message: 'File format is not supported',
					recoverable: true,
					strategy: 'format-conversion',
				},
			],
			specificStrategies: [
				{
					id: 'file-size-reduction',
					name: 'File Size Optimization',
					description: 'Reduce file size to meet processing limits',
					conditions: (error) => error.type === 'resource' && error.category === 'File Processing Suite',
					steps: [
						{
							id: 'compress-image',
							title: 'Compress Image Files',
							description: 'Reduce image quality or dimensions',
							action: 'Use image compression to reduce file size',
							type: 'automatic',
							priority: 1,
							difficulty: 'medium',
						},
						{
							id: 'split-file',
							title: 'Split Large Files',
							description: 'Process file in smaller chunks',
							action: 'Divide large files into manageable sections',
							type: 'manual',
							priority: 2,
							difficulty: 'medium',
						},
					],
					successCriteria: ['File size is within limits', 'File can be processed'],
					fallbackOptions: ['alternative-tool', 'server-side-processing'],
				},
			],
		});

		// Network Utilities
		this.registerToolSpecificErrors({
			toolId: 'api-tester',
			category: 'Network Utilities',
			commonErrors: [
				{
					pattern: /Network error/i,
					type: 'network',
					severity: 'error',
					message: 'Network connection failed',
					recoverable: true,
					strategy: 'network-recovery',
				},
				{
					pattern: /CORS policy/i,
					type: 'security',
					severity: 'error',
					message: 'CORS policy violation',
					recoverable: false,
					strategy: 'cors-workaround',
				},
			],
			specificStrategies: [
				{
					id: 'network-recovery',
					name: 'Network Connection Recovery',
					description: 'Restore network connectivity',
					conditions: (error) => error.type === 'network' && error.category === 'Network Utilities',
					steps: [
						{
							id: 'check-connection',
							title: 'Check Internet Connection',
							description: 'Verify network connectivity',
							action: 'Test connection with other services',
							type: 'manual',
							priority: 1,
							difficulty: 'easy',
						},
						{
							id: 'retry-request',
							title: 'Retry Network Request',
							description: 'Retry the failed request',
							action: 'Wait and retry the network operation',
							type: 'automatic',
							priority: 2,
							difficulty: 'easy',
						},
					],
					successCriteria: ['Network request succeeds', 'Data is received'],
					fallbackOptions: ['offline-mode', 'cached-data'],
				},
			],
		});

		// Text Processing Tools
		this.registerToolSpecificErrors({
			toolId: 'text-encoder',
			category: 'Text Processing Suite',
			commonErrors: [
				{
					pattern: /Invalid encoding/i,
					type: 'validation',
					severity: 'error',
					message: 'Text encoding is not valid',
					recoverable: true,
					strategy: 'encoding-correction',
				},
				{
					pattern: /Unsupported characters/i,
					type: 'validation',
					severity: 'warning',
					message: 'Some characters may not be supported',
					recoverable: true,
					strategy: 'character-replacement',
				},
			],
			specificStrategies: [
				{
					id: 'encoding-correction',
					name: 'Text Encoding Correction',
					description: 'Fix text encoding issues',
					conditions: (error) => error.type === 'validation' && error.category === 'Text Processing Suite',
					steps: [
						{
							id: 'detect-encoding',
							title: 'Detect Character Encoding',
							description: 'Automatically detect the correct text encoding',
							action: 'Use encoding detection algorithms',
							type: 'automatic',
							priority: 1,
							difficulty: 'medium',
						},
						{
							id: 'convert-encoding',
							title: 'Convert to UTF-8',
							description: 'Convert text to standard UTF-8 encoding',
							action: 'Apply UTF-8 conversion',
							type: 'automatic',
							priority: 2,
							difficulty: 'easy',
						},
					],
					successCriteria: ['Text displays correctly', 'No encoding errors'],
					fallbackOptions: ['manual-encoding-selection', 'character-cleanup'],
				},
			],
		});

		// Security & Encryption Tools
		this.registerToolSpecificErrors({
			toolId: 'hash-generator',
			category: 'Security & Encryption Suite',
			commonErrors: [
				{
					pattern: /Invalid input format/i,
					type: 'validation',
					severity: 'error',
					message: 'Input format is not compatible with hash algorithm',
					recoverable: true,
					strategy: 'input-format-correction',
				},
				{
					pattern: /Algorithm not supported/i,
					type: 'configuration',
					severity: 'error',
					message: 'Selected hash algorithm is not supported',
					recoverable: true,
					strategy: 'algorithm-alternative',
				},
			],
			specificStrategies: [
				{
					id: 'input-format-correction',
					name: 'Input Format Correction',
					description: 'Adjust input format for hash generation',
					conditions: (error) => error.type === 'validation' && error.category === 'Security & Encryption Suite',
					steps: [
						{
							id: 'normalize-input',
							title: 'Normalize Input Data',
							description: 'Convert input to compatible format',
							action: 'Apply standard text normalization',
							type: 'automatic',
							priority: 1,
							difficulty: 'easy',
						},
						{
							id: 'validate-input',
							title: 'Validate Input Data',
							description: 'Ensure input meets algorithm requirements',
							action: 'Check input against algorithm specifications',
							type: 'automatic',
							priority: 2,
							difficulty: 'easy',
						},
					],
					successCriteria: ['Input is valid for selected algorithm', 'Hash generation succeeds'],
					fallbackOptions: ['alternative-algorithm', 'input-modification'],
				},
			],
		});
	}

	/**
	 * Initialize error metrics tracking
	 */
	private initializeMetrics(): void {
		// Initialize all counters to zero
		const errorTypes: ErrorType[] = [
			'validation',
			'syntax',
			'parsing',
			'processing',
			'network',
			'security',
			'performance',
			'compatibility',
			'resource',
			'user_input',
			'system',
			'timeout',
			'configuration',
			'unknown',
		];

		const severities: ErrorSeverity[] = ['critical', 'error', 'warning', 'info', 'debug'];

		errorTypes.forEach((type) => {
			this.errorMetrics.errorsByType[type] = 0;
		});

		severities.forEach((severity) => {
			this.errorMetrics.errorsBySeverity[severity] = 0;
		});
	}

	/**
	 * Register tool-specific error handling
	 */
	public registerToolSpecificErrors(toolError: ToolSpecificError): void {
		this.toolSpecificErrors.set(toolError.toolId, toolError);
	}

	/**
	 * Handle and analyze errors with intelligent classification
	 */
	public handleError(
		error: Error | string,
		context: {
			toolId?: string;
			category?: ToolCategory;
			subcategory?: string;
			operation?: string;
			userContext?: any;
		},
	): EnhancedErrorInfo {
		const errorId = this.generateErrorId();
		const timestamp = new Date();

		// Parse error information
		let errorInfo: Partial<EnhancedErrorInfo>;

		if (typeof error === 'string') {
			errorInfo = {
				code: 'CUSTOM_ERROR',
				message: error,
				technicalDetails: { originalError: error },
			};
		} else {
			errorInfo = {
				code: error.name || 'UNKNOWN_ERROR',
				message: error.message,
				technicalDetails: {
					stack: error.stack,
					name: error.name,
					originalError: error,
				},
			};
		}

		// Classify error
		const errorType = this.classifyError(errorInfo.message!, errorInfo.code!, context);
		const severity = this.determineSeverity(errorInfo.message!, errorType, context);
		const recoverable = this.isRecoverable(errorType, errorInfo.message!);

		// Create enhanced error info
		const enhancedError: EnhancedErrorInfo = {
			id: errorId,
			type: errorType,
			severity,
			category: context.category || 'JSON Processing Suite',
			subcategory: context.subcategory,
			toolId: context.toolId,
			operation: context.operation,
			...errorInfo,
			userMessage: this.generateUserFriendlyMessage(errorType, errorInfo.message!, context),
			timestamp,
			context: {
				browser: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
				platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
				...context.userContext,
			},
			recoverable,
			recoverySuggestions: this.generateRecoverySuggestions(errorType, context),
			relatedTools: this.findRelatedTools(context.toolId, context.category),
			alternativeSolutions: this.generateAlternativeSolutions(errorType, context),
		} as EnhancedErrorInfo;

		// Update metrics and history
		this.updateErrorMetrics(enhancedError);
		this.errorHistory.push(enhancedError);

		return enhancedError;
	}

	/**
	 * Generate unique error ID
	 */
	private generateErrorId(): string {
		return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Classify error type based on message and context
	 */
	private classifyError(message: string, code: string, context: any): ErrorType {
		const lowerMessage = message.toLowerCase();
		const lowerCode = code.toLowerCase();

		// JSON errors
		if (
			lowerMessage.includes('json') ||
			lowerMessage.includes('parse') ||
			lowerMessage.includes('unexpected token') ||
			lowerMessage.includes('expecting property')
		) {
			return 'parsing';
		}

		// Syntax errors
		if (
			lowerMessage.includes('syntax') ||
			lowerMessage.includes('unexpected identifier') ||
			lowerMessage.includes('invalid token') ||
			lowerCode.includes('syntaxerror')
		) {
			return 'syntax';
		}

		// Network errors
		if (
			lowerMessage.includes('network') ||
			lowerMessage.includes('fetch') ||
			lowerMessage.includes('connection') ||
			lowerMessage.includes('cors') ||
			lowerMessage.includes('timeout')
		) {
			return 'network';
		}

		// Security errors
		if (
			lowerMessage.includes('security') ||
			lowerMessage.includes('permission') ||
			lowerMessage.includes('unauthorized') ||
			lowerMessage.includes('access denied') ||
			lowerMessage.includes('cors')
		) {
			return 'security';
		}

		// Validation errors
		if (
			lowerMessage.includes('invalid') ||
			lowerMessage.includes('validation') ||
			lowerMessage.includes('required') ||
			lowerMessage.includes('format') ||
			lowerMessage.includes('encoding')
		) {
			return 'validation';
		}

		// Resource errors
		if (
			lowerMessage.includes('memory') ||
			lowerMessage.includes('disk') ||
			lowerMessage.includes('file too large') ||
			lowerMessage.includes('quota')
		) {
			return 'resource';
		}

		// Performance errors
		if (
			lowerMessage.includes('performance') ||
			lowerMessage.includes('slow') ||
			lowerMessage.includes('heavy') ||
			lowerMessage.includes('optimization')
		) {
			return 'performance';
		}

		// Timeout errors
		if (
			lowerMessage.includes('timeout') ||
			lowerMessage.includes('time out') ||
			lowerMessage.includes('execution time')
		) {
			return 'timeout';
		}

		// Configuration errors
		if (
			lowerMessage.includes('config') ||
			lowerMessage.includes('setting') ||
			lowerMessage.includes('option') ||
			lowerMessage.includes('parameter')
		) {
			return 'configuration';
		}

		// Compatibility errors
		if (
			lowerMessage.includes('compatibility') ||
			lowerMessage.includes('browser') ||
			lowerMessage.includes('version') ||
			lowerMessage.includes('support')
		) {
			return 'compatibility';
		}

		// Processing errors
		if (
			lowerMessage.includes('process') ||
			lowerMessage.includes('execution') ||
			lowerMessage.includes('convert') ||
			lowerMessage.includes('transform')
		) {
			return 'processing';
		}

		// User input errors
		if (
			lowerMessage.includes('input') ||
			lowerMessage.includes('user') ||
			lowerMessage.includes('data') ||
			lowerMessage.includes('argument')
		) {
			return 'user_input';
		}

		// System errors
		if (
			lowerMessage.includes('system') ||
			lowerMessage.includes('internal') ||
			lowerMessage.includes('platform')
		) {
			return 'system';
		}

		return 'unknown';
	}

	/**
	 * Determine error severity
	 */
	private determineSeverity(message: string, errorType: ErrorType, context: any): ErrorSeverity {
		const lowerMessage = message.toLowerCase();

		// Critical errors
		if (
			lowerMessage.includes('critical') ||
			lowerMessage.includes('fatal') ||
			lowerMessage.includes('security breach') ||
			errorType === 'security'
		) {
			return 'critical';
		}

		// Error level
		if (
			lowerMessage.includes('error') ||
			lowerMessage.includes('failed') ||
			lowerMessage.includes('exception') ||
			['syntax', 'parsing', 'network', 'security', 'timeout'].includes(errorType)
		) {
			return 'error';
		}

		// Warning level
		if (
			lowerMessage.includes('warning') ||
			lowerMessage.includes('deprecated') ||
			['validation', 'performance', 'compatibility'].includes(errorType)
		) {
			return 'warning';
		}

		// Info level
		if (
			['resource', 'configuration', 'user_input'].includes(errorType) ||
			lowerMessage.includes('note') ||
			lowerMessage.includes('info')
		) {
			return 'info';
		}

		return 'debug';
	}

	/**
	 * Check if error is recoverable
	 */
	private isRecoverable(errorType: ErrorType, message: string): boolean {
		// Non-recoverable error types
		const nonRecoverableTypes = ['security', 'system'];

		if (nonRecoverableTypes.includes(errorType)) {
			return false;
		}

		// Non-recoverable message patterns
		const nonRecoverablePatterns = [
			/security breach/i,
			/unauthorized access/i,
			/system failure/i,
			/critical system error/i,
		];

		return !nonRecoverablePatterns.some((pattern) => pattern.test(message));
	}

	/**
	 * Generate user-friendly error messages
	 */
	private generateUserFriendlyMessage(errorType: ErrorType, message: string, context: any): string {
		const categoryMessages = {
			'JSON Processing Suite': {
				parsing: 'The JSON data appears to be malformed. Please check for syntax errors.',
				validation: 'The JSON structure doesn\'t match the expected format.',
				syntax: 'There\'s a syntax error in your JSON data.',
			},
			'Code Processing Suite': {
				syntax: 'Your code contains syntax errors that need to be fixed.',
				timeout: 'The code execution took too long and was stopped.',
				processing: 'An error occurred while executing your code.',
			},
			'File Processing Suite': {
				resource: 'The file is too large or uses too many resources.',
				validation: 'The file format is not supported or is corrupted.',
				processing: 'An error occurred while processing the file.',
			},
			'Network Utilities': {
				network: 'There\'s a problem with the network connection.',
				timeout: 'The network request timed out.',
				security: 'A security restriction prevented this operation.',
			},
			'Text Processing Suite': {
				validation: 'The text format is not compatible with this operation.',
				encoding: 'There\'s an issue with the text encoding.',
				processing: 'An error occurred while processing the text.',
			},
			'Security & Encryption Suite': {
				validation: 'The input format is not compatible with the selected algorithm.',
				security: 'A security constraint was violated.',
				processing: 'An error occurred during the security operation.',
			},
		};

		const category = context.category as keyof typeof categoryMessages;
		if (category && categoryMessages[category] && categoryMessages[category][errorType]) {
			return categoryMessages[category][errorType];
		}

		// Generic messages by error type
		const genericMessages: Record<ErrorType, string> = {
			syntax: 'A syntax error occurred. Please check your input for syntax issues.',
			parsing: 'Failed to parse the input data. Please check the format.',
			validation: 'The input data is not valid. Please check the requirements.',
			processing: 'An error occurred during processing. Please try again.',
			network: 'A network error occurred. Please check your connection.',
			security: 'A security error occurred. This operation may not be allowed.',
			performance: 'A performance issue was detected. The operation may be too resource-intensive.',
			compatibility: 'A compatibility issue was detected. This may not work in your current environment.',
			resource: 'Resource limits were exceeded. Please reduce the input size or complexity.',
			user_input: 'There\'s an issue with the input provided. Please check and try again.',
			system: 'A system error occurred. Please try again later.',
			timeout: 'The operation timed out. Please try again or reduce the complexity.',
			configuration: 'A configuration error occurred. Please check your settings.',
			unknown: 'An unknown error occurred. Please try again or contact support.',
		};

		return genericMessages[errorType] || message;
	}

	/**
	 * Generate recovery suggestions based on error type and context
	 */
	private generateRecoverySuggestions(errorType: ErrorType, context: any): RecoverySuggestion[] {
		const suggestions: RecoverySuggestion[] = [];

		// Common suggestions by error type
		const commonSuggestions: Record<ErrorType, RecoverySuggestion[]> = {
			syntax: [
				{
					id: 'check-syntax',
					title: 'Check Syntax',
					description: 'Review the input for syntax errors',
					action: 'Look for missing brackets, quotes, or commas',
					type: 'manual',
					priority: 1,
					difficulty: 'easy',
					successRate: 0.8,
				},
			],
			parsing: [
				{
					id: 'validate-format',
					title: 'Validate Format',
					description: 'Ensure the data format is correct',
					action: 'Use a validator tool to check the format',
					type: 'suggested',
					priority: 1,
					difficulty: 'easy',
					successRate: 0.9,
				},
			],
			network: [
				{
					id: 'check-connection',
					title: 'Check Connection',
					description: 'Verify your internet connection',
					action: 'Test with other websites or services',
					type: 'manual',
					priority: 1,
					difficulty: 'easy',
					successRate: 0.7,
				},
				{
					id: 'retry-operation',
					title: 'Retry Operation',
					description: 'Try the operation again',
					action: 'Wait a moment and retry',
					type: 'automatic',
					priority: 2,
					difficulty: 'easy',
					successRate: 0.6,
				},
			],
			validation: [
				{
					id: 'check-input',
					title: 'Check Input Requirements',
					description: 'Review the input format requirements',
					action: 'Consult the tool documentation for proper format',
					type: 'suggested',
					priority: 1,
					difficulty: 'easy',
					successRate: 0.8,
				},
			],
			timeout: [
				{
					id: 'reduce-complexity',
					title: 'Reduce Input Complexity',
					description: 'Use smaller or simpler input data',
					action: 'Break down large inputs into smaller pieces',
					type: 'manual',
					priority: 1,
					difficulty: 'medium',
					successRate: 0.7,
				},
			],
			resource: [
				{
					id: 'optimize-input',
					title: 'Optimize Input Size',
					description: 'Reduce the input file size or complexity',
					action: 'Compress files or reduce data size',
					type: 'manual',
					priority: 1,
					difficulty: 'medium',
					successRate: 0.8,
				},
			],
		};

		// Add common suggestions
		if (commonSuggestions[errorType]) {
			suggestions.push(...commonSuggestions[errorType]);
		}

		// Add category-specific suggestions
		if (context.category) {
			const categorySuggestions = this.getCategorySpecificSuggestions(errorType, context.category);
			suggestions.push(...categorySuggestions);
		}

		// Sort by priority
		return suggestions.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Get category-specific recovery suggestions
	 */
	private getCategorySpecificSuggestions(errorType: ErrorType, category: ToolCategory): RecoverySuggestion[] {
		const categoryMap: Record<ToolCategory, Record<ErrorType, RecoverySuggestion[]>> = {
			'JSON Processing Suite': {
				parsing: [
					{
						id: 'json-format',
						title: 'Format JSON',
						description: 'Use the JSON formatter to fix structure',
						action: 'Apply proper indentation and structure',
						type: 'suggested',
						priority: 1,
						difficulty: 'easy',
					},
				],
			},
			'Code Processing Suite': {
				syntax: [
					{
						id: 'code-validator',
						title: 'Use Code Validator',
						description: 'Validate code syntax with specialized tools',
						action: 'Run through language-specific validators',
						type: 'suggested',
						priority: 1,
						difficulty: 'easy',
					},
				],
				timeout: [
					{
						id: 'optimize-code',
						title: 'Optimize Code',
						description: 'Improve code efficiency to reduce execution time',
						action: 'Remove unnecessary operations or loops',
						type: 'manual',
						priority: 1,
						difficulty: 'medium',
					},
				],
			},
			'File Processing Suite': {
				resource: [
					{
						id: 'compress-file',
						title: 'Compress File',
						description: 'Reduce file size through compression',
						action: 'Use file compression tools or techniques',
						type: 'suggested',
						priority: 1,
						difficulty: 'easy',
					},
				],
			},
		};

		return categoryMap[category]?.[errorType] || [];
	}

	/**
	 * Find related tools that might help with the error
	 */
	private findRelatedTools(toolId?: string, category?: ToolCategory): string[] {
		// Tool relationships mapping
		const toolRelationships: Record<string, string[]> = {
			'json-validator': ['json-formatter', 'json-converter'],
			'json-formatter': ['json-validator', 'json-minifier'],
			'code-executor': ['code-formatter', 'code-validator'],
			'file-converter': ['file-compressor', 'file-validator'],
			'text-encoder': ['text-decoder', 'text-validator'],
			'hash-generator': ['text-encoder', 'file-hash'],
		};

		if (toolId && toolRelationships[toolId]) {
			return toolRelationships[toolId];
		}

		// Return category-wide tools if no specific tool
		const categoryTools: Record<ToolCategory, string[]> = {
			'JSON Processing Suite': ['json-validator', 'json-formatter', 'json-converter'],
			'Code Processing Suite': ['code-formatter', 'code-validator'],
			'File Processing Suite': ['file-converter', 'file-compressor'],
			'Network Utilities': ['api-tester', 'url-encoder'],
			'Text Processing Suite': ['text-encoder', 'text-decoder', 'text-formatter'],
			'Security & Encryption Suite': ['hash-generator', 'password-generator'],
		};

		return category?.[category] || [];
	}

	/**
	 * Generate alternative solutions for the error
	 */
	private generateAlternativeSolutions(errorType: ErrorType, context: any): string[] {
		const solutions: string[] = [];

		switch (errorType) {
			case 'parsing':
				solutions.push('Try using a different parser or format', 'Split the input into smaller sections');
				break;
			case 'network':
				solutions.push('Try offline mode if available', 'Use cached data if accessible');
				break;
			case 'resource':
				solutions.push('Use a more powerful tool', 'Process data in smaller batches');
				break;
			case 'timeout':
				solutions.push('Reduce input size', 'Increase timeout settings if possible');
				break;
			default:
				solutions.push('Try a different tool or approach', 'Contact support for assistance');
		}

		return solutions;
	}

	/**
	 * Update error metrics
	 */
	private updateErrorMetrics(error: EnhancedErrorInfo): void {
		this.errorMetrics.totalErrors++;
		this.errorMetrics.errorsByType[error.type]++;
		this.errorMetrics.errorsByCategory[error.category]++;
		this.errorMetrics.errorsBySeverity[error.severity]++;

		// Update most common errors
		const errorKey = `${error.type}:${error.message.substring(0, 50)}`;
		const existingError = this.errorMetrics.mostCommonErrors.find((e) => e.error === errorKey);

		if (existingError) {
			existingError.count++;
		} else {
			this.errorMetrics.mostCommonErrors.push({ error: errorKey, count: 1 });
		}

		// Keep only top 10 most common errors
		this.errorMetrics.mostCommonErrors.sort((a, b) => b.count - a.count);
		this.errorMetrics.mostCommonErrors = this.errorMetrics.mostCommonErrors.slice(0, 10);
	}

	/**
	 * Get error metrics
	 */
	public getErrorMetrics(): ErrorMetrics {
		return { ...this.errorMetrics };
	}

	/**
	 * Get error history
	 */
	public getErrorHistory(limit?: number): EnhancedErrorInfo[] {
		return limit ? this.errorHistory.slice(-limit) : [...this.errorHistory];
	}

	/**
	 * Clear error history
	 */
	public clearErrorHistory(): void {
		this.errorHistory = [];
		this.errorMetrics = {
			totalErrors: 0,
			errorsByType: {} as Record<ErrorType, number>,
			errorsByCategory: {} as Record<ToolCategory, number>,
			errorsBySeverity: {} as Record<ErrorSeverity, number>,
			recoverySuccessRate: 0,
			mostCommonErrors: [],
		};
		this.initializeMetrics();
	}

	/**
	 * Execute intelligent error recovery
	 */
	public async executeRecovery(
		error: EnhancedErrorInfo,
		onProgress?: (step: RecoveryStep, result: any) => void,
	): Promise<{
		success: boolean;
		appliedStrategy: string;
		stepsCompleted: string[];
		recommendations: string[];
		nextActions: string[];
	}> {
		try {
			// First try the existing error recovery system
			const recoveryResult = await errorRecovery.executeRecovery(
				{
					type: error.type,
					severity: error.severity,
					code: error.code,
					message: error.message,
					timestamp: error.timestamp,
					context: error.operation,
					recoverable: error.recoverable,
				},
				error.context,
				onProgress,
			);

			// Enhance the result with tool-specific suggestions
			const enhancedResult = {
				...recoveryResult,
				recommendations: [
					...recoveryResult.recommendations,
					...error.recoverySuggestions.map((s) => s.title),
				],
				nextActions: [
					...recoveryResult.nextActions,
					...error.alternativeSolutions,
				],
			};

			return enhancedResult;
		} catch (recoveryError) {
			return {
				success: false,
				appliedStrategy: 'none',
				stepsCompleted: [],
				recommendations: ['Manual intervention required', 'Check tool documentation'],
				nextActions: ['Try alternative tools', 'Contact support'],
			};
		}
	}
}

// Export singleton instance
export const intelligentErrorHandler = IntelligentErrorHandler.getInstance();

// Convenience functions for common error handling
export function handleError(
	error: Error | string,
	context: {
		toolId?: string;
		category?: ToolCategory;
		subcategory?: string;
		operation?: string;
		userContext?: any;
	},
): EnhancedErrorInfo {
	return intelligentErrorHandler.handleError(error, context);
}

export function handleToolError(
	error: Error | string,
	toolId: string,
	category: ToolCategory,
	operation?: string,
): EnhancedErrorInfo {
	return intelligentErrorHandler.handleError(error, {
		toolId,
		category,
		operation,
	});
}

export async function recoverFromError(
	error: EnhancedErrorInfo,
	onProgress?: (step: RecoveryStep, result: any) => void,
) {
	return intelligentErrorHandler.executeRecovery(error, onProgress);
}
