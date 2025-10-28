import type {
	FileParseRequest,
	FileParseResponse,
	FileValidationRequest,
	FileValidationResponse,
	ValidationError,
} from '@/contracts/index';
import type { JsonValidationError, JsonValidationResult } from './json-types';

export class JsonApiService {
	private baseUrl: string;

	constructor(baseUrl = '/api/json') {
		this.baseUrl = baseUrl;
	}

	/**
	 * Validate a JSON file using the backend API
	 */
	async validateFile(
		request: FileValidationRequest
	): Promise<FileValidationResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/validate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			throw new Error(
				`Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Parse JSON content from file using the backend API
	 */
	async parseFile(request: FileParseRequest): Promise<FileParseResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/parse`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			throw new Error(
				`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Format JSON using the backend API
	 */
	async formatJson(
		content: string,
		options: {
			indent?: number;
			sortKeys?: boolean;
			compact?: boolean;
			trailingComma?: boolean;
		} = {}
	): Promise<string> {
		try {
			const response = await fetch(`${this.baseUrl}/format`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content,
					options,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			return result.formatted;
		} catch (error) {
			throw new Error(
				`Failed to format JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate JSON using the backend API
	 */
	async validateJson(content: string): Promise<JsonValidationResult> {
		try {
			const response = await fetch(`${this.baseUrl}/validate-json`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			return this.convertValidationResponse(result);
		} catch (error) {
			throw new Error(
				`Failed to validate JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Convert JSON to another format using the backend API
	 */
	async convertJson(
		content: string,
		targetFormat: 'xml' | 'yaml' | 'csv',
		options: {
			rootElement?: string;
			arrayItemName?: string;
			flatten?: boolean;
			csvDelimiter?: string;
		} = {}
	): Promise<string> {
		try {
			const response = await fetch(`${this.baseUrl}/convert`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content,
					targetFormat,
					options,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			return result.converted;
		} catch (error) {
			throw new Error(
				`Failed to convert JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Minify JSON using the backend API
	 */
	async minifyJson(content: string): Promise<string> {
		try {
			const response = await fetch(`${this.baseUrl}/minify`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			return result.minified;
		} catch (error) {
			throw new Error(
				`Failed to minify JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Convert API validation response to internal format
	 */
	private convertValidationResponse(response: any): JsonValidationResult {
		const errors: JsonValidationError[] = (response.errors || []).map(
			(error: ValidationError) => ({
				line: error.line || 1,
				column: error.column || 1,
				message: error.message,
				severity: error.severity === 'error' ? 'error' : ('warning' as const),
			})
		);

		return {
			isValid: response.isValid,
			errors,
			lineNumbers: errors.map((e) => e.line),
		};
	}

	/**
	 * Upload and process a JSON file
	 */
	async uploadFile(file: File): Promise<{
		content: string;
		size: number;
		name: string;
		type: string;
		validation: JsonValidationResult;
	}> {
		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${this.baseUrl}/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			return {
				content: result.content,
				size: result.size,
				name: result.name,
				type: result.type,
				validation: this.convertValidationResponse(result.validation),
			};
		} catch (error) {
			throw new Error(
				`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Download formatted JSON as a file
	 */
	async downloadAsFile(
		content: string,
		filename: string,
		format: 'json' | 'xml' | 'yaml' | 'csv' = 'json'
	): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/download`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content,
					filename,
					format,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Create a blob from the response
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			throw new Error(
				`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get JSON schema information
	 */
	async getSchemaInfo(schemaUrl?: string): Promise<{
		title?: string;
		description?: string;
		type?: string;
		properties?: Record<string, any>;
		required?: string[];
	}> {
		try {
			const response = await fetch(
				`${this.baseUrl}/schema${schemaUrl ? `?url=${encodeURIComponent(schemaUrl)}` : ''}`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			throw new Error(
				`Failed to get schema info: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate JSON against a schema
	 */
	async validateAgainstSchema(
		content: string,
		schema: object
	): Promise<{
		isValid: boolean;
		errors: Array<{
			path: string;
			message: string;
			severity: 'error' | 'warning';
		}>;
	}> {
		try {
			const response = await fetch(`${this.baseUrl}/validate-schema`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content,
					schema,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			throw new Error(
				`Failed to validate against schema: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}

// Create a default instance
export const jsonApiService = new JsonApiService();
