/**
 * Web Worker for JSON processing operations
 * Handles heavy JSON operations in background thread
 */

import { ConversionJob, ConversionStatus, ConversionOptions, ProcessingError } from '../../types/tools';

interface JSONWorkerMessage {
	id: string;
	type: 'process' | 'convert' | 'validate' | 'format';
	data: any;
	options?: ConversionOptions;
}

interface JSONWorkerResponse {
	id: string;
	success: boolean;
	result?: any;
	error?: ProcessingError;
	metrics: {
		duration: number;
		inputSize: number;
		outputSize: number;
	};
}

// JSON processing functions
function processJSON(data: string, operation: string, options: any = {}) {
	try {
		let result: any;
		const startTime = Date.now();

		switch (operation) {
			case 'parse':
				result = JSON.parse(data);
				break;
			case 'stringify':
				result = JSON.stringify(data, null, options.indentation || 2);
				break;
			case 'validate':
				JSON.parse(data);
				result = { valid: true };
				break;
			case 'sort':
				const parsed = JSON.parse(data);
				result = sortObjectKeys(parsed, options.sortKeys !== false);
				break;
			case 'minify':
				const minified = JSON.parse(data);
				result = JSON.stringify(minified);
				break;
			default:
				throw new Error(`Unknown operation: ${operation}`);
		}

		const duration = Date.now() - startTime;

		return {
			success: true,
			result,
			metrics: {
				duration,
				inputSize: data.length,
				outputSize: JSON.stringify(result).length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: {
				type: 'processing',
				message: error instanceof Error ? error.message : 'Unknown error',
				code: 'JSON_PROCESSING_ERROR',
				details: error,
				recoverable: true,
				suggestions: ['Check JSON syntax', 'Ensure proper escaping'],
			},
			metrics: { duration: 0, inputSize: data.length, outputSize: 0 },
		};
	}
}

function sortObjectKeys(obj: any, sortKeys: boolean = true): any {
	if (Array.isArray(obj)) {
		return obj.map((item) => sortObjectKeys(item, sortKeys));
	}

	if (obj !== null && typeof obj === 'object' && sortKeys) {
		const sortedKeys = Object.keys(obj).sort();
		const sortedObj: any = {};

		for (const key of sortedKeys) {
			sortedObj[key] = sortObjectKeys(obj[key], sortKeys);
		}

		return sortedObj;
	}

	return obj;
}

// Message handler
self.onmessage = (event: MessageEvent<JSONWorkerMessage>) => {
	const { id, type, data, options } = event.data;

	try {
		let response: JSONWorkerResponse;

		switch (type) {
			case 'process':
				response = processJSON(data, options?.operation || 'parse', options) as JSONWorkerResponse;
				break;
			case 'convert':
				response = processJSON(data, 'convert', options) as JSONWorkerResponse;
				break;
			case 'validate':
				response = processJSON(data, 'validate', options) as JSONWorkerResponse;
				break;
			case 'format':
				response = processJSON(data, 'format', options) as JSONWorkerResponse;
				break;
			default:
				response = {
					id,
					success: false,
					error: {
						type: 'processing',
						message: `Unknown worker message type: ${type}`,
						code: 'UNKNOWN_TYPE',
						recoverable: false,
					},
					metrics: { duration: 0, inputSize: 0, outputSize: 0 },
				};
		}

		response.id = id;
		self.postMessage(response);
	} catch (error) {
		const errorResponse: JSONWorkerResponse = {
			id,
			success: false,
			error: {
				type: 'processing',
				message: error instanceof Error ? error.message : 'Worker error',
				code: 'WORKER_ERROR',
				details: error,
				recoverable: false,
			},
			metrics: { duration: 0, inputSize: 0, outputSize: 0 },
		};

		self.postMessage(errorResponse);
	}
};

export {};
