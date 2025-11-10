/**
 * Input validation utilities for all tool types
 * Provides comprehensive validation with detailed error messages
 */

import { ValidationRule, ValidationError, ToolValidation } from '@/types/tools';

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	sanitizedData?: any;
	warnings: ValidationError[];
}

export interface ValidationSchema {
	[field: string]: ValidationRule[];
}

export class Validator {
	/**
	 * Validate data against a schema
	 */
	static validate(data: any, schema: ValidationSchema): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];
		let sanitizedData = { ...data };

		for (const [field, rules] of Object.entries(schema)) {
			const value = data[field];
			const fieldErrors = this.validateField(field, value, rules);

			errors.push(...fieldErrors.filter((e) => e.severity === 'error'));
			warnings.push(...fieldErrors.filter((e) => e.severity === 'warning' || e.severity === 'info'));

			// Apply sanitization if valid
			if (fieldErrors.filter((e) => e.severity === 'error').length === 0) {
				const sanitizationRule = rules.find((rule) => rule.sanitize);
				if (sanitizationRule) {
					sanitizedData[field] = sanitizationRule.sanitize(value);
				}
			}
		}

		// Apply transformation if all validations pass
		if (errors.length === 0) {
			for (const [field, rules] of Object.entries(schema)) {
				const transformRule = rules.find((rule) => rule.transform);
				if (transformRule) {
					sanitizedData[field] = transformRule.transform(sanitizedData[field]);
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			sanitizedData,
			warnings,
		};
	}

	/**
	 * Validate a single field against rules
	 */
	static validateField(field: string, value: any, rules: ValidationRule[]): ValidationError[] {
		const errors: ValidationError[] = [];

		for (const rule of rules) {
			const error = this.applyRule(field, value, rule);
			if (error) {
				errors.push(error);
			}
		}

		return errors;
	}

	/**
	 * Apply a single validation rule
	 */
	private static applyRule(field: string, value: any, rule: ValidationRule): ValidationError | null {
		// Check required fields
		if (rule.required && (value === undefined || value === null || value === '')) {
			return {
				field,
				message: `${field} is required`,
				code: 'REQUIRED_FIELD',
				severity: 'error',
			};
		}

		// Skip further validation if field is optional and empty
		if (!rule.required && (value === undefined || value === null || value === '')) {
			return null;
		}

		// Type validation
		if (rule.type && !this.validateType(value, rule.type)) {
			return {
				field,
				message: `${field} must be of type ${rule.type}`,
				code: 'INVALID_TYPE',
				severity: 'error',
			};
		}

		// String validations
		if (typeof value === 'string') {
			if (rule.minLength !== undefined && value.length < rule.minLength) {
				return {
					field,
					message: `${field} must be at least ${rule.minLength} characters long`,
					code: 'MIN_LENGTH',
					severity: 'error',
				};
			}

			if (rule.maxLength !== undefined && value.length > rule.maxLength) {
				return {
					field,
					message: `${field} must be no more than ${rule.maxLength} characters long`,
					code: 'MAX_LENGTH',
					severity: 'error',
				};
			}

			if (rule.pattern && !rule.pattern.test(value)) {
				return {
					field,
					message: `${field} format is invalid`,
					code: 'INVALID_FORMAT',
					severity: 'error',
				};
			}
		}

		// Custom validation
		if (rule.custom) {
			const customResult = rule.custom(value);
			if (customResult !== true) {
				return {
					field,
					message: typeof customResult === 'string' ? customResult : `${field} is invalid`,
					code: 'CUSTOM_VALIDATION',
					severity: 'error',
				};
			}
		}

		return null;
	}

	/**
	 * Validate value type
	 */
	private static validateType(value: any, expectedType: string): boolean {
		switch (expectedType) {
			case 'string':
				return typeof value === 'string';
			case 'number':
				return typeof value === 'number' && !isNaN(value);
			case 'boolean':
				return typeof value === 'boolean';
			case 'array':
				return Array.isArray(value);
			case 'object':
				return typeof value === 'object' && value !== null && !Array.isArray(value);
			default:
				return true;
		}
	}
}

// Common validation schemas
export const CommonSchemas = {
	// JSON validation
	jsonInput: {
		data: [
			{
				field: 'data',
				type: 'string' as const,
				required: true,
				minLength: 1,
				custom: (value: string) => {
					try {
						JSON.parse(value);
						return true;
					} catch (error) {
						return 'Invalid JSON format';
					}
				},
			},
		] as ValidationRule[],
	},

	// Code validation
	codeInput: {
		code: [
			{
				field: 'code',
				type: 'string' as const,
				required: true,
				minLength: 1,
			},
		] as ValidationRule[],
		language: [
			{
				field: 'language',
				type: 'string' as const,
				required: true,
				custom: (value: string) => {
					const supportedLanguages = [
						'javascript',
						'python',
						'java',
						'csharp',
						'cpp',
						'go',
						'rust',
						'php',
						'ruby',
						'sql',
						'html',
						'css',
					];
					return supportedLanguages.includes(value.toLowerCase()) || 'Unsupported language';
				},
			},
		] as ValidationRule[],
	},

	// File validation
	fileUpload: {
		file: [
			{
				field: 'file',
				type: 'object' as const,
				required: true,
				custom: (value: File) => {
					if (!(value instanceof File)) {
						return 'Invalid file object';
					}

					// Check file size (50MB limit)
					const maxSize = 50 * 1024 * 1024;
					if (value.size > maxSize) {
						return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
					}

					return true;
				},
			},
		] as ValidationRule[],
	},

	// Text encoding validation
	textEncoding: {
		text: [
			{
				field: 'text',
				type: 'string' as const,
				required: true,
				minLength: 1,
			},
		] as ValidationRule[],
		encoding: [
			{
				field: 'encoding',
				type: 'string' as const,
				required: true,
				custom: (value: string) => {
					const supportedEncodings = ['base64', 'url', 'html', 'unicode', 'hex', 'binary'];
					return supportedEncodings.includes(value.toLowerCase()) || 'Unsupported encoding type';
				},
			},
		] as ValidationRule[],
	},

	// Hash generation validation
	hashGeneration: {
		data: [
			{
				field: 'data',
				type: 'string' as const,
				required: true,
				minLength: 1,
			},
		] as ValidationRule[],
		algorithm: [
			{
				field: 'algorithm',
				type: 'string' as const,
				required: true,
				custom: (value: string) => {
					const supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha3'];
					return supportedAlgorithms.includes(value.toLowerCase()) || 'Unsupported hash algorithm';
				},
			},
		] as ValidationRule[],
	},

	// Password generation validation
	passwordGeneration: {
		length: [
			{
				field: 'length',
				type: 'number' as const,
				required: true,
				custom: (value: number) => {
					if (value < 4) return 'Password must be at least 4 characters long';
					if (value > 128) return 'Password cannot exceed 128 characters';
					return true;
				},
			},
		] as ValidationRule[],
	},

	// HTTP request validation
	httpRequest: {
		url: [
			{
				field: 'url',
				type: 'string' as const,
				required: true,
				pattern: /^https?:\/\/.+/,
			},
		] as ValidationRule[],
		method: [
			{
				field: 'method',
				type: 'string' as const,
				required: true,
				custom: (value: string) => {
					const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
					return methods.includes(value.toUpperCase()) || 'Unsupported HTTP method';
				},
			},
		] as ValidationRule[],
	},

	// IP address validation
	ipAddress: {
		ip: [
			{
				field: 'ip',
				type: 'string' as const,
				required: true,
				pattern:
					/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
			},
		] as ValidationRule[],
	},
};

// Tool-specific validation functions
export const ToolValidators = {
	/**
	 * Validate JSON input
	 */
	validateJSON(input: string): ValidationResult {
		return Validator.validate({ data: input }, CommonSchemas.jsonInput);
	},

	/**
	 * Validate code input
	 */
	validateCode(code: string, language: string): ValidationResult {
		return Validator.validate({ code, language }, CommonSchemas.codeInput);
	},

	/**
	 * Validate file upload
	 */
	validateFile(file: File): ValidationResult {
		return Validator.validate({ file }, CommonSchemas.fileUpload);
	},

	/**
	 * Validate text encoding request
	 */
	validateTextEncoding(text: string, encoding: string): ValidationResult {
		return Validator.validate({ text, encoding }, CommonSchemas.textEncoding);
	},

	/**
	 * Validate hash generation request
	 */
	validateHashGeneration(data: string, algorithm: string): ValidationResult {
		return Validator.validate({ data, algorithm }, CommonSchemas.hashGeneration);
	},

	/**
	 * Validate password generation request
	 */
	validatePasswordGeneration(length: number, options: any = {}): ValidationResult {
		const schema = {
			...CommonSchemas.passwordGeneration,
			...Object.fromEntries(
				Object.entries(options).map(([key, value]) => [
					key,
					[
						{
							field: key,
							type: typeof value === 'boolean' ? 'boolean' : 'string',
							required: false,
						},
					],
				]),
			),
		};

		return Validator.validate({ length, ...options }, schema);
	},

	/**
	 * Validate HTTP request
	 */
	validateHttpRequest(url: string, method: string): ValidationResult {
		return Validator.validate({ url, method }, CommonSchemas.httpRequest);
	},

	/**
	 * Validate IP address
	 */
	validateIPAddress(ip: string): ValidationResult {
		return Validator.validate({ ip }, CommonSchemas.ipAddress);
	},
};

// Sanitization functions
export const Sanitizers = {
	/**
	 * Sanitize JSON input by removing potentially dangerous content
	 */
	sanitizeJSON(input: string): string {
		return input
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
			.replace(/javascript:/gi, '') // Remove javascript: protocol
			.replace(/on\w+\s*=/gi, ''); // Remove event handlers
	},

	/**
	 * Sanitize code input
	 */
	sanitizeCode(code: string): string {
		// Basic sanitization - remove obvious malicious patterns
		return code
			.replace(/eval\s*\(/gi, 'blockedEval(') // Block eval
			.replace(/import\s+.*\s+from/gi, '// blocked import'); // Block imports in sandboxed code
	},

	/**
	 * Sanitize text for HTML output
	 */
	sanitizeHTML(input: string): string {
		const div = document.createElement('div');
		div.textContent = input;
		return div.innerHTML;
	},

	/**
	 * Sanitize URL
	 */
	sanitizeURL(url: string): string {
		try {
			const parsed = new URL(url);
			// Only allow http and https protocols
			if (!['http:', 'https:'].includes(parsed.protocol)) {
				throw new Error('Invalid protocol');
			}
			return parsed.toString();
		} catch {
			throw new Error('Invalid URL format');
		}
	},
};

// Export main validation function
export const validateInput = (toolId: string, data: any): ValidationResult => {
	switch (toolId) {
		case 'json-formatter':
		case 'json-validator':
		case 'json-editor':
			return ToolValidators.validateJSON(data);

		case 'code-executor':
		case 'code-formatter':
			return ToolValidators.validateCode(data.code, data.language);

		case 'file-converter':
		case 'file-upload':
			return ToolValidators.validateFile(data);

		case 'text-encoder':
		case 'base64-converter':
		case 'url-encoder':
			return ToolValidators.validateTextEncoding(data.text, data.encoding);

		case 'hash-generator':
			return ToolValidators.validateHashGeneration(data.data, data.algorithm);

		case 'password-generator':
			return ToolValidators.validatePasswordGeneration(data.length, data.options);

		case 'http-client':
			return ToolValidators.validateHttpRequest(data.url, data.method);

		case 'ip-lookup':
			return ToolValidators.validateIPAddress(data.ip);

		default:
			return {
				isValid: true,
				errors: [],
				sanitizedData: data,
				warnings: [],
			};
	}
};
