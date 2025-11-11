/**
 * JSON Processing Suite Fallback Strategies
 * Provides alternative processing methods when primary JSON tools fail
 */

import { BaseFallbackStrategy, FallbackContext, FallbackResult } from '../fallback-processing-system';
import { FallbackQuality, DataLossRisk, AnalyticsError } from '../fallback-processing-system';

// ============================================================================
// JSON Simplified Fallback Strategy
// ============================================================================

export class JSONSimplifiedFallback extends BaseFallbackStrategy {
	public id = 'json-simplified';
	public name = 'Simplified JSON Processing';
	public description = 'Basic JSON parsing and formatting with reduced features';
	public priority = 8;
	public qualityLevel: FallbackQuality = 'medium';
	public processingTime = 100; // ms
	public dataLossRisk: DataLossRisk = 'low';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return typeof JSON !== 'undefined' && typeof JSON.parse === 'function';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			if (!this.validateInput(context)) {
				return this.createBaseResult(
					false,
					'minimal',
					['Input data is invalid or missing'],
					['Cannot process without valid input']
				);
			}

			const { result, processingTime, memoryUsage } = await this.measurePerformance(async () => {
				return this.processJSONSimplified(context.inputData, context.operation);
			});

			const fallbackResult = this.createBaseResult(
				true,
				'medium',
				['Using simplified JSON processing'],
				['Advanced JSON features disabled', 'Complex formatting options unavailable'],
				{
					inputPreserved: true,
					outputComplete: true,
				}
			);

			fallbackResult.result = result;
			fallbackResult.processingTime = processingTime;
			fallbackResult.metrics.memoryUsage = memoryUsage;
			fallbackResult.metrics.inputSize = this.getDataSize(context.inputData);
			fallbackResult.metrics.outputSize = this.getDataSize(result);

			return fallbackResult;

		} catch (error) {
			return this.createBaseResult(
				false,
				'low',
				[`Simplified JSON processing failed: ${error.message}`],
				['Unable to process JSON with simplified method'],
				{
					inputPreserved: false,
					outputComplete: false,
				}
			);
		}
	}

	private async processJSONSimplified(data: any, operation: string): Promise<any> {
		switch (operation) {
			case 'parse':
				if (typeof data === 'string') {
					return JSON.parse(data);
				}
				return data;

			case 'stringify':
				return JSON.stringify(data, null, 2);

			case 'validate':
				if (typeof data === 'string') {
					JSON.parse(data); // Will throw if invalid
					return { valid: true, message: 'JSON is valid' };
				}
				return { valid: true, message: 'Data is already parsed JSON' };

			case 'minify':
				return JSON.stringify(data);

			case 'format':
				return JSON.stringify(data, null, 2);

			case 'extract-keys':
				const obj = typeof data === 'string' ? JSON.parse(data) : data;
				return this.extractKeys(obj);

			default:
				throw new Error(`Unsupported operation: ${operation}`);
		}
	}

	private extractKeys(obj: any, prefix = ''): string[] {
		const keys: string[] = [];

		if (obj && typeof obj === 'object') {
			Object.keys(obj).forEach(key => {
				const fullKey = prefix ? `${prefix}.${key}` : key;
				keys.push(fullKey);

				if (typeof obj[key] === 'object' && obj[key] !== null) {
					keys.push(...this.extractKeys(obj[key], fullKey));
				}
			});
		}

		return keys;
	}

	private getDataSize(data: any): number {
		return JSON.stringify(data).length;
	}
}

// ============================================================================
// JSON Validation Fallback Strategy
// ============================================================================

export class JSONValidationFallback extends BaseFallbackStrategy {
	public id = 'json-validation';
	public name = 'JSON Validation Only';
	public description = 'Validate JSON structure without processing';
	public priority = 5;
	public qualityLevel: FallbackQuality = 'low';
	public processingTime = 50; // ms
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return typeof JSON !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			if (!this.validateInput(context)) {
				return this.createBaseResult(
					false,
					'minimal',
					['Input data is invalid or missing'],
					['Cannot validate without input']
				);
			}

			const { result, processingTime, memoryUsage } = await this.measurePerformance(async () => {
				return this.validateJSONOnly(context.inputData);
			});

			const fallbackResult = this.createBaseResult(
				true,
				'low',
				['JSON validation performed'],
				['No processing capabilities', 'Read-only validation'],
				{
					inputPreserved: true,
					outputComplete: true,
				}
			);

			fallbackResult.result = result;
			fallbackResult.processingTime = processingTime;
			fallbackResult.metrics.memoryUsage = memoryUsage;

			return fallbackResult;

		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				[`JSON validation failed: ${error.message}`],
				['Unable to validate JSON structure'],
				{
					inputPreserved: false,
					outputComplete: false,
				}
			);
		}
	}

	private async validateJSONOnly(data: any): Promise<any> {
		const validation = {
			isString: typeof data === 'string',
			isValid: false,
			error: null as string | null,
			preview: null as string | null,
			size: 0,
		};

		try {
			if (typeof data === 'string') {
				const parsed = JSON.parse(data);
				validation.isValid = true;
				validation.preview = JSON.stringify(parsed).substring(0, 200) + '...';
			} else {
				JSON.stringify(data); // Verify it's serializable
				validation.isValid = true;
				validation.preview = JSON.stringify(data).substring(0, 200) + '...';
			}
		} catch (error) {
			validation.error = error instanceof Error ? error.message : 'Unknown validation error';
		}

		validation.size = JSON.stringify(data).length;

		return validation;
	}
}

// ============================================================================
// JSON Formatting Fallback Strategy
// ============================================================================

export class JSONFormattingFallback extends BaseFallbackStrategy {
	public id = 'json-formatting';
	public name = 'Basic JSON Formatting';
	public description = 'Simple JSON formatting with minimal options';
	public priority = 7;
	public qualityLevel: FallbackQuality = 'high';
	public processingTime = 75; // ms
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return typeof JSON !== 'undefined' && typeof JSON.stringify === 'function';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			if (!this.validateInput(context)) {
				return this.createBaseResult(
					false,
					'minimal',
					['Input data is invalid or missing'],
					['Cannot format without valid input']
				);
			}

			const { result, processingTime, memoryUsage } = await this.measurePerformance(async () => {
				return this.formatJSONBasic(context.inputData);
			});

			const fallbackResult = this.createBaseResult(
				true,
				'high',
				['Basic JSON formatting applied'],
				['Limited formatting options', 'No advanced beautification'],
				{
					inputPreserved: true,
					outputComplete: true,
				}
			);

			fallbackResult.result = result;
			fallbackResult.processingTime = processingTime;
			fallbackResult.metrics.memoryUsage = memoryUsage;
			fallbackResult.metrics.inputSize = this.getDataSize(context.inputData);
			fallbackResult.metrics.outputSize = this.getDataSize(result);

			return fallbackResult;

		} catch (error) {
			return this.createBaseResult(
				false,
				'low',
				[`JSON formatting failed: ${error.message}`],
				['Unable to format JSON with basic method'],
				{
					inputPreserved: true,
					outputComplete: false,
				}
			);
		}
	}

	private async formatJSONBasic(data: any): Promise<any> {
		let parsedData = data;

		// Parse if it's a string
		if (typeof data === 'string') {
			try {
				parsedData = JSON.parse(data);
			} catch (parseError) {
				throw new Error('Invalid JSON string cannot be formatted');
			}
		}

		// Try to format with indentation
		try {
			const formatted = JSON.stringify(parsedData, null, 2);
			return {
				formatted,
				original: data,
				size: formatted.length,
				lines: formatted.split('\n').length,
			};
		} catch (formatError) {
			throw new Error('Failed to format JSON data');
		}
	}

	private getDataSize(data: any): number {
		return JSON.stringify(data).length;
	}
}

// ============================================================================
// JSON Schema Validation Fallback Strategy
// ============================================================================

export class JSONSchemaFallback extends BaseFallbackStrategy {
	public id = 'json-schema-simple';
	public name = 'Simple JSON Schema Validation';
	public description = 'Basic JSON schema validation without complex rules';
	public priority = 4;
	public qualityLevel: FallbackQuality = 'low';
	public processingTime = 150; // ms
	public dataLossRisk: DataLossRisk = 'none';
	public compatibility = ['JSON Processing Suite'];

	public isAvailable(): boolean {
		return typeof JSON !== 'undefined';
	}

	public async execute(context: FallbackContext): Promise<FallbackResult> {
		try {
			const { data, schema } = this.extractDataAndSchema(context.inputData);

			if (!data) {
				return this.createBaseResult(
					false,
					'minimal',
					['No data provided for validation'],
					['Cannot validate without data']
				);
			}

			const { result, processingTime, memoryUsage } = await this.measurePerformance(async () => {
				return this.validateWithSimpleSchema(data, schema);
			});

			const fallbackResult = this.createBaseResult(
				true,
				'low',
				['Simple schema validation performed'],
				['Limited schema validation', 'No complex rule support'],
				{
					inputPreserved: true,
					outputComplete: true,
				}
			);

			fallbackResult.result = result;
			fallbackResult.processingTime = processingTime;
			fallbackResult.metrics.memoryUsage = memoryUsage;

			return fallbackResult;

		} catch (error) {
			return this.createBaseResult(
				false,
				'minimal',
				[`Schema validation failed: ${error.message}`],
				['Unable to perform simple schema validation'],
				{
					inputPreserved: true,
					outputComplete: false,
				}
			);
		}
	}

	private extractDataAndSchema(inputData: any): { data: any; schema?: any } {
		if (inputData && typeof inputData === 'object') {
			return {
				data: inputData.data,
				schema: inputData.schema,
			};
		}

		return { data: inputData };
	}

	private async validateWithSimpleSchema(data: any, schema?: any): Promise<any> {
		const validation = {
			valid: true,
			errors: [] as string[],
			warnings: [] as string[],
			dataTypes: this.analyzeDataTypes(data),
		};

		// Basic structure validation
		if (data === null || data === undefined) {
			validation.valid = false;
			validation.errors.push('Data cannot be null or undefined');
			return validation;
		}

		// Simple schema validation if provided
		if (schema && typeof schema === 'object') {
			if (schema.type && !this.validateType(data, schema.type)) {
				validation.valid = false;
				validation.errors.push(`Expected type ${schema.type}, got ${typeof data}`);
			}

			if (schema.required && typeof data === 'object' && data !== null) {
				schema.required.forEach((field: string) => {
					if (!(field in data)) {
						validation.valid = false;
						validation.errors.push(`Required field '${field}' is missing`);
					}
				});
			}

			if (schema.properties && typeof data === 'object' && data !== null) {
				Object.keys(schema.properties).forEach(field => {
					const fieldSchema = schema.properties[field];
					if (field in data && !this.validateType(data[field], fieldSchema.type)) {
						validation.warnings.push(`Field '${field}' has incorrect type`);
					}
				});
			}
		}

		return validation;
	}

	private validateType(value: any, expectedType: string): boolean {
		switch (expectedType) {
			case 'string':
				return typeof value === 'string';
			case 'number':
				return typeof value === 'number' && !isNaN(value);
			case 'boolean':
				return typeof value === 'boolean';
			case 'object':
				return typeof value === 'object' && value !== null && !Array.isArray(value);
			case 'array':
				return Array.isArray(value);
			case 'null':
				return value === null;
			default:
				return true; // Unknown types pass by default
		}
	}

	private analyzeDataTypes(data: any): any {
		if (Array.isArray(data)) {
			return {
				type: 'array',
				length: data.length,
				itemTypes: [...new Set(data.map(item => typeof item))],
			};
		}

		if (typeof data === 'object' && data !== null) {
			return {
				type: 'object',
				keys: Object.keys(data),
				keyTypes: Object.keys(data).reduce((acc, key) => {
					acc[key] = typeof data[key];
					return acc;
				}, {} as Record<string, string>),
			};
		}

		return {
			type: typeof data,
			value: data,
		};
	}
}
