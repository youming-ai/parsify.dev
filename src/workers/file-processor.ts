/**
 * Web Worker for file processing operations
 * Handles heavy file operations in background thread
 */

import { ConversionJob, ConversionStatus, ProcessingError } from '../../types/tools';

interface FileWorkerMessage {
	id: string;
	type: 'convert' | 'compress' | 'extract' | 'process';
	data: ArrayBuffer | string;
	sourceFormat: string;
	targetFormat: string;
	options?: any;
}

interface FileWorkerResponse {
	id: string;
	success: boolean;
	result?: any;
	error?: ProcessingError;
	metrics: {
		duration: number;
		inputSize: number;
		outputSize: number;
		compressionRatio?: number;
	};
	progress?: number;
}

// File processing functions
async function processFile(data: ArrayBuffer | string, sourceFormat: string, targetFormat: string, options: any = {}) {
	try {
		const startTime = Date.now();
		let result: any;

		// Handle different file conversions
		switch (sourceFormat.toLowerCase()) {
			case 'json':
				result = await processJSONFile(data, targetFormat, options);
				break;
			case 'csv':
				result = await processCSVFile(data, targetFormat, options);
				break;
			case 'xml':
				result = await processXMLFile(data, targetFormat, options);
				break;
			case 'yaml':
			case 'yml':
				result = await processYAMLFile(data, targetFormat, options);
				break;
			case 'txt':
				result = await processTextFile(data, targetFormat, options);
				break;
			default:
				throw new Error(`Unsupported source format: ${sourceFormat}`);
		}

		const duration = Date.now() - startTime;
		const inputSize = data instanceof ArrayBuffer ? data.byteLength : data.length;
		const outputSize = typeof result === 'string' ? result.length : JSON.stringify(result).length;

		return {
			success: true,
			result,
			metrics: {
				duration,
				inputSize,
				outputSize,
				compressionRatio: inputSize > 0 ? outputSize / inputSize : 1,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: {
				type: 'processing',
				message: error instanceof Error ? error.message : 'File processing error',
				code: 'FILE_PROCESSING_ERROR',
				details: error,
				recoverable: true,
				suggestions: ['Check file format', 'Ensure file is not corrupted'],
			},
			metrics: { duration: 0, inputSize: 0, outputSize: 0 },
		};
	}
}

async function processJSONFile(data: ArrayBuffer | string, targetFormat: string, options: any) {
	const content = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;
	const parsed = JSON.parse(content);

	switch (targetFormat.toLowerCase()) {
		case 'yaml':
			// Import yaml processor dynamically to avoid bundling issues
			const { default: yaml } = await import('js-yaml');
			return yaml.dump(parsed, { indent: options.indentation || 2 });
		case 'csv':
			return convertToCSV(parsed, options);
		case 'xml':
			return convertToXML(parsed, options);
		case 'toml':
			const { default: toml } = await import('toml');
			return toml.stringify(parsed);
		default:
			throw new Error(`Unsupported target format: ${targetFormat}`);
	}
}

async function processCSVFile(data: ArrayBuffer | string, targetFormat: string, options: any) {
	const content = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;
	const { parse } = await import('csv-parse/sync');

	const records = parse(content, {
		columns: options.includeHeaders !== false,
		skip_empty_lines: true,
	});

	switch (targetFormat.toLowerCase()) {
		case 'json':
			return JSON.stringify(records, null, options.indentation || 2);
		case 'yaml':
			const { default: yaml } = await import('js-yaml');
			return yaml.dump(records, { indent: options.indentation || 2 });
		default:
			throw new Error(`Unsupported target format for CSV: ${targetFormat}`);
	}
}

async function processXMLFile(data: ArrayBuffer | string, targetFormat: string, options: any) {
	const content = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;
	const { parseString } = await import('xml2js');

	return new Promise((resolve, reject) => {
		parseString(
			content,
			{
				explicitArray: false,
				ignoreAttrs: false,
			},
			(err, result) => {
				if (err) {
					reject(err);
				} else {
					switch (targetFormat.toLowerCase()) {
						case 'json':
							resolve(JSON.stringify(result, null, options.indentation || 2));
							break;
						case 'yaml':
							import('js-yaml')
								.then(({ default: yaml }) => {
									resolve(yaml.dump(result, { indent: options.indentation || 2 }));
								})
								.catch(reject);
							break;
						default:
							reject(new Error(`Unsupported target format for XML: ${targetFormat}`));
					}
				}
			},
		);
	});
}

async function processYAMLFile(data: ArrayBuffer | string, targetFormat: string, options: any) {
	const content = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;
	const { default: yaml } = await import('js-yaml');
	const parsed = yaml.load(content);

	switch (targetFormat.toLowerCase()) {
		case 'json':
			return JSON.stringify(parsed, null, options.indentation || 2);
		case 'xml':
			return convertToXML(parsed, options);
		default:
			throw new Error(`Unsupported target format for YAML: ${targetFormat}`);
	}
}

async function processTextFile(data: ArrayBuffer | string, targetFormat: string, options: any) {
	const content = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;

	switch (targetFormat.toLowerCase()) {
		case 'base64':
			return btoa(content);
		case 'hex':
			return Array.from(new TextEncoder().encode(content))
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('');
		case 'binary':
			return Array.from(new TextEncoder().encode(content))
				.map((byte) => byte.toString(2).padStart(8, '0'))
				.join(' ');
		default:
			throw new Error(`Unsupported target format for text: ${targetFormat}`);
	}
}

function convertToCSV(data: any, options: any): string {
	if (!Array.isArray(data)) {
		throw new Error('Data must be an array for CSV conversion');
	}

	if (data.length === 0) return '';

	const headers = Object.keys(data[0]);
	const csvRows = [];

	// Add headers if requested
	if (options.includeHeaders !== false) {
		csvRows.push(headers.join(','));
	}

	// Add data rows
	for (const row of data) {
		const values = headers.map((header) => {
			const value = row[header];
			// Escape commas and quotes in values
			if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
				return `"${value.replace(/"/g, '""')}"`;
			}
			return value ?? '';
		});
		csvRows.push(values.join(','));
	}

	return csvRows.join('\n');
}

function convertToXML(data: any, options: any): string {
	const rootName = options.rootName || 'root';
	const indent = options.indentation || 2;

	function objectToXML(obj: any, indentLevel: number = 0): string {
		const spaces = ' '.repeat(indentLevel * indent);
		let xml = '';

		if (Array.isArray(obj)) {
			for (const item of obj) {
				xml += `${spaces}<item>\n`;
				xml += objectToXML(item, indentLevel + 1);
				xml += `${spaces}</item>\n`;
			}
		} else if (obj !== null && typeof obj === 'object') {
			for (const [key, value] of Object.entries(obj)) {
				if (value === null || value === undefined) continue;

				xml += `${spaces}<${key}>\n`;
				if (typeof value === 'object') {
					xml += objectToXML(value, indentLevel + 1);
				} else {
					xml += `${spaces}  ${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
				}
				xml += `${spaces}</${key}>\n`;
			}
		} else {
			xml += `${spaces}${String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
		}

		return xml;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${objectToXML(data, 1)}</${rootName}>`;
}

// Message handler
self.onmessage = async (event: MessageEvent<FileWorkerMessage>) => {
	const { id, type, data, sourceFormat, targetFormat, options } = event.data;

	try {
		let response: FileWorkerResponse;

		switch (type) {
			case 'convert':
				response = (await processFile(data, sourceFormat, targetFormat, options)) as FileWorkerResponse;
				break;
			case 'compress':
				response = (await processFile(data, sourceFormat, targetFormat, {
					...options,
					compress: true,
				})) as FileWorkerResponse;
				break;
			case 'extract':
				response = (await processFile(data, sourceFormat, targetFormat, options)) as FileWorkerResponse;
				break;
			case 'process':
				response = (await processFile(data, sourceFormat, targetFormat, options)) as FileWorkerResponse;
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
		const errorResponse: FileWorkerResponse = {
			id,
			success: false,
			error: {
				type: 'processing',
				message: error instanceof Error ? error.message : 'File worker error',
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
