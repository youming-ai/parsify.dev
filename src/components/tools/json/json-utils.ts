import type { JsonFormatOptions, JsonValidationError, JsonValidationResult, TreeNode } from './json-types';

export function validateJson(content: string): JsonValidationResult {
	const errors: JsonValidationError[] = [];
	let isValid = true;

	if (!content.trim()) {
		return {
			isValid: false,
			errors: [{ line: 1, column: 1, message: 'Empty input', severity: 'error' }],
		};
	}

	try {
		JSON.parse(content);
	} catch (error) {
		isValid = false;
		const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';

		// Parse error message to extract line and column numbers
		const lineMatch = errorMessage.match(/line (\d+)/i);
		const columnMatch = errorMessage.match(/column (\d+)/i);
		const positionMatch = errorMessage.match(/position (\d+)/i);

		let line = 1;
		let column = 1;

		if (lineMatch) {
			line = Number.parseInt(lineMatch[1], 10);
		} else if (positionMatch) {
			// Calculate line and column from character position
			const position = Number.parseInt(positionMatch[1], 10);
			const lines = content.substring(0, position).split('\n');
			line = lines.length;
			column = lines[lines.length - 1].length + 1;
		}

		if (columnMatch) {
			column = Number.parseInt(columnMatch[1], 10);
		}

		errors.push({
			line,
			column,
			message: errorMessage,
			severity: 'error',
		});
	}

	return {
		isValid,
		errors,
		lineNumbers: errors.map((e) => e.line),
	};
}

export function formatJson(content: string, options: JsonFormatOptions): string {
	try {
		const parsed = JSON.parse(content);
		let formatted = JSON.stringify(parsed, null, options.indent);

		if (options.compact) {
			formatted = JSON.stringify(parsed);
		}

		if (options.sortKeys) {
			const sorted = sortJsonKeys(parsed);
			formatted = JSON.stringify(sorted, null, options.indent);
		}

		if (options.trailingComma && !options.compact) {
			formatted = formatted.replace(/([}\]])/g, '$1,').replace(/,(\s*[}\]])/g, '$1');
		}

		return formatted;
	} catch (error) {
		throw new Error(`Failed to format JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

export function sortJsonKeys(obj: unknown): unknown {
	if (Array.isArray(obj)) {
		return obj.map(sortJsonKeys);
	}

	if (obj !== null && typeof obj === 'object') {
		const sortedObj: Record<string, unknown> = {};
		const keys = Object.keys(obj).sort();

		for (const key of keys) {
			sortedObj[key] = sortJsonKeys((obj as Record<string, unknown>)[key]);
		}

		return sortedObj;
	}

	return obj;
}

export function parseJsonToTree(data: unknown, path = 'root', level = 0): TreeNode[] {
	if (data === null || typeof data !== 'object') {
		return [
			{
				key: path,
				value: data,
				type: getValueType(data),
				path,
				level,
			},
		];
	}

	if (Array.isArray(data)) {
		return data.map((item, index) => ({
			key: `${path}[${index}]`,
			value: item,
			type: 'array',
			path: `${path}[${index}]`,
			children: parseJsonToTree(item, `${path}[${index}]`, level + 1),
			level,
		}));
	}

	return Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
		key,
		value,
		type: getValueType(value),
		path: `${path}.${key}`,
		children:
			typeof value === 'object' && value !== null ? parseJsonToTree(value, `${path}.${key}`, level + 1) : undefined,
		level,
	}));
}

function getValueType(value: unknown): TreeNode['type'] {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'object') return 'object';
	if (typeof value === 'string') return 'string';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'string';
}

export function convertJson(
	content: string,
	targetFormat: 'xml' | 'yaml' | 'csv',
	options: Record<string, unknown> = {},
): string {
	try {
		const parsed = JSON.parse(content);

		switch (targetFormat) {
			case 'xml':
				return jsonToXml(
					parsed,
					(options.rootElement as string) || 'root',
					(options.arrayItemName as string) || 'item',
				);
			case 'yaml':
				return jsonToYaml(parsed);
			case 'csv':
				return jsonToCsv(parsed, (options.delimiter as string) || ',');
			default:
				throw new Error(`Unsupported format: ${targetFormat}`);
		}
	} catch (error) {
		throw new Error(`Failed to convert JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

function jsonToXml(obj: unknown, rootName: string, itemName: string): string {
	const convertValue = (value: unknown, tagName: string): string => {
		if (value === null) return `<${tagName}/>`;

		if (typeof value === 'object' && !Array.isArray(value)) {
			const entries = Object.entries(value as Record<string, unknown>)
				.map(([key, val]) => convertValue(val, key))
				.join('');
			return `<${tagName}>${entries}</${tagName}>`;
		}

		if (Array.isArray(value)) {
			const items = value.map((item) => convertValue(item, itemName)).join('');
			return `<${tagName}>${items}</${tagName}>`;
		}

		const escaped = String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		return `<${tagName}>${escaped}</${tagName}>`;
	};

	return `<?xml version="1.0" encoding="UTF-8"?>\n${convertValue(obj, rootName)}`;
}

function jsonToYaml(obj: unknown): string {
	const convertValue = (value: unknown, indent = 0): string => {
		const spaces = '  '.repeat(indent);

		if (value === null) return 'null';
		if (typeof value === 'boolean') return value.toString();
		if (typeof value === 'number') return value.toString();
		if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;

		if (Array.isArray(value)) {
			if (value.length === 0) return '[]';
			return value.map((item) => `\n${spaces}- ${convertValue(item, indent + 1).trim()}`).join('');
		}

		if (typeof value === 'object') {
			const entries = Object.entries(value as Record<string, unknown>);
			if (entries.length === 0) return '{}';

			return entries
				.map(([key, val]) => {
					const yamlValue = convertValue(val, indent + 1);
					if (typeof val === 'object' && val !== null) {
						return `\n${spaces}${key}:${yamlValue}`;
					}
					return `\n${spaces}${key}: ${yamlValue.trim()}`;
				})
				.join('');
		}

		return '';
	};

	return convertValue(obj).trim();
}

function jsonToCsv(obj: unknown, delimiter: string): string {
	if (!Array.isArray(obj)) {
		throw new Error('CSV conversion requires an array of objects');
	}

	if (obj.length === 0) {
		return '';
	}

	const headers = Object.keys(obj[0] as Record<string, unknown>);
	const csvRows = [headers.join(delimiter)];

	for (const row of obj) {
		const values = headers.map((header) => {
			const value = (row as Record<string, unknown>)[header];
			if (value === null || value === undefined) return '';
			if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
				return `"${value.replace(/"/g, '""')}"`;
			}
			return String(value);
		});
		csvRows.push(values.join(delimiter));
	}

	return csvRows.join('\n');
}

export function copyToClipboard(text: string): Promise<void> {
	if (navigator.clipboard && window.isSecureContext) {
		return navigator.clipboard.writeText(text);
	}
	// Fallback for older browsers
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.style.position = 'fixed';
	textArea.style.left = '-999999px';
	textArea.style.top = '-999999px';
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	return new Promise((resolve, reject) => {
		if (document.execCommand('copy')) {
			resolve();
		} else {
			reject(new Error('Failed to copy to clipboard'));
		}
		document.body.removeChild(textArea);
	});
}

export function downloadFile(content: string, filename: string, contentType = 'text/plain'): void {
	const blob = new Blob([content], { type: contentType });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}
