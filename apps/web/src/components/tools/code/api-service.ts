import type {
	CodeExecutionRequest,
	CodeExecutionResult,
	CodeFormatOptions,
	CodeLanguage,
} from './code-types';

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface ExecutionApiResponse extends ApiResponse {
	data?: CodeExecutionResult;
}

export interface FormatApiResponse extends ApiResponse {
	data?: {
		formattedCode: string;
		originalCode: string;
		language: string;
		options: CodeFormatOptions;
	};
}

class CodeApiService {
	private baseUrl: string;

	constructor(baseUrl = '/api/code') {
		this.baseUrl = baseUrl;
	}

	// Execute code
	async executeCode(
		request: CodeExecutionRequest
	): Promise<CodeExecutionResult> {
		try {
			const response = await fetch(`${this.baseUrl}/execute`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ExecutionApiResponse = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Execution failed');
			}

			return result.data;
		} catch (error) {
			console.error('Code execution error:', error);
			throw error;
		}
	}

	// Format code
	async formatCode(
		code: string,
		language: CodeLanguage,
		options: CodeFormatOptions
	): Promise<string> {
		try {
			const response = await fetch(`${this.baseUrl}/format`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					code,
					language,
					options,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: FormatApiResponse = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Formatting failed');
			}

			return result.data.formattedCode;
		} catch (error) {
			console.error('Code formatting error:', error);
			throw error;
		}
	}

	// Validate code syntax
	async validateCode(
		code: string,
		language: CodeLanguage
	): Promise<{
		isValid: boolean;
		errors: Array<{
			line: number;
			column: number;
			message: string;
			severity: 'error' | 'warning';
		}>;
	}> {
		try {
			const response = await fetch(`${this.baseUrl}/validate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					code,
					language,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse<{
				isValid: boolean;
				errors: Array<{
					line: number;
					column: number;
					message: string;
					severity: 'error' | 'warning';
				}>;
			}> = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Validation failed');
			}

			return result.data;
		} catch (error) {
			console.error('Code validation error:', error);
			throw error;
		}
	}

	// Get supported languages
	async getSupportedLanguages(): Promise<CodeLanguage[]> {
		try {
			const response = await fetch(`${this.baseUrl}/languages`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse<CodeLanguage[]> = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to get languages');
			}

			return result.data;
		} catch (error) {
			console.error('Get languages error:', error);
			throw error;
		}
	}

	// Get language information
	async getLanguageInfo(language: CodeLanguage): Promise<{
		name: string;
		version: string;
		extensions: string[];
		supportsCompilation: boolean;
		supportsStdin: boolean;
		maxExecutionTime: number;
		maxMemoryUsage: number;
	}> {
		try {
			const response = await fetch(`${this.baseUrl}/languages/${language}`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to get language info');
			}

			return result.data;
		} catch (error) {
			console.error('Get language info error:', error);
			throw error;
		}
	}

	// Cancel execution
	async cancelExecution(executionId: string): Promise<void> {
		try {
			const response = await fetch(
				`${this.baseUrl}/execute/${executionId}/cancel`,
				{
					method: 'POST',
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to cancel execution');
			}
		} catch (error) {
			console.error('Cancel execution error:', error);
			throw error;
		}
	}

	// Get execution status
	async getExecutionStatus(executionId: string): Promise<{
		status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
		progress: number;
		startTime?: number;
		endTime?: number;
	}> {
		try {
			const response = await fetch(
				`${this.baseUrl}/execute/${executionId}/status`,
				{
					method: 'GET',
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to get execution status');
			}

			return result.data;
		} catch (error) {
			console.error('Get execution status error:', error);
			throw error;
		}
	}

	// Upload file for execution
	async uploadFile(
		file: File,
		language: CodeLanguage
	): Promise<{
		fileId: string;
		fileName: string;
		size: number;
		type: string;
	}> {
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('language', language);

			const response = await fetch(`${this.baseUrl}/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'File upload failed');
			}

			return result.data;
		} catch (error) {
			console.error('File upload error:', error);
			throw error;
		}
	}

	// Download execution result
	async downloadResult(
		executionId: string,
		format: 'txt' | 'json' = 'txt'
	): Promise<Blob> {
		try {
			const response = await fetch(
				`${this.baseUrl}/execute/${executionId}/download?format=${format}`,
				{
					method: 'GET',
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return response.blob();
		} catch (error) {
			console.error('Download result error:', error);
			throw error;
		}
	}

	// Get execution history
	async getExecutionHistory(
		limit = 10,
		offset = 0
	): Promise<{
		executions: Array<{
			id: string;
			language: CodeLanguage;
			code: string;
			input?: string;
			result: CodeExecutionResult;
			timestamp: number;
		}>;
		total: number;
		hasMore: boolean;
	}> {
		try {
			const response = await fetch(
				`${this.baseUrl}/history?limit=${limit}&offset=${offset}`,
				{
					method: 'GET',
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to get execution history');
			}

			return result.data;
		} catch (error) {
			console.error('Get execution history error:', error);
			throw error;
		}
	}

	// Delete execution from history
	async deleteExecution(executionId: string): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/history/${executionId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to delete execution');
			}
		} catch (error) {
			console.error('Delete execution error:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const codeApiService = new CodeApiService();

// Export utilities
export const createExecutionRequest = (
	language: CodeLanguage,
	code: string,
	input?: string,
	version?: string,
	compilerOptions?: Record<string, any>
): CodeExecutionRequest => ({
	language,
	code,
	input,
	version,
	compilerOptions,
});

export const formatExecutionTime = (ms: number): string => {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
	return `${(ms / 60000).toFixed(2)}m`;
};

export const formatMemoryUsage = (kb: number): string => {
	if (kb < 1024) return `${kb}KB`;
	if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)}MB`;
	return `${(kb / (1024 * 1024)).toFixed(2)}GB`;
};

export const validateExecutionRequest = (
	request: CodeExecutionRequest
): {
	isValid: boolean;
	errors: string[];
} => {
	const errors: string[] = [];

	if (!request.language) {
		errors.push('Language is required');
	}

	if (!request.code || request.code.trim().length === 0) {
		errors.push('Code is required');
	}

	if (request.code && request.code.length > 100000) {
		errors.push('Code is too long (max 100KB)');
	}

	if (request.input && request.input.length > 10000) {
		errors.push('Input is too long (max 10KB)');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};
