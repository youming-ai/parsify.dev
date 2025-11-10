// JSON Processing Web Worker
self.addEventListener('message', function (e) {
	const { id, operation, data } = e.data;

	try {
		let result;

		switch (operation) {
			case 'format':
				result = formatJSON(data);
				break;
			case 'validate':
				result = validateJSON(data);
				break;
			case 'minify':
				result = minifyJSON(data);
				break;
			case 'sort':
				result = sortJSON(data);
				break;
			case 'convert':
				result = convertJSON(data.targetFormat, data.jsonData, data.options);
				break;
			default:
				throw new Error(`Unknown operation: ${operation}`);
		}

		self.postMessage({
			id,
			success: true,
			result,
		});
	} catch (error) {
		self.postMessage({
			id,
			success: false,
			error: {
				message: error.message,
				stack: error.stack,
			},
		});
	}
});

function formatJSON(data, indent = 2) {
	if (typeof data === 'string') {
		data = JSON.parse(data);
	}
	return JSON.stringify(data, null, indent);
}

function validateJSON(data) {
	try {
		if (typeof data === 'string') {
			JSON.parse(data);
		} else {
			JSON.stringify(data);
		}
		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error: error.message,
			line: extractLineNumber(error.message),
		};
	}
}

function minifyJSON(data) {
	if (typeof data === 'string') {
		data = JSON.parse(data);
	}
	return JSON.stringify(data);
}

function sortJSON(data) {
	if (typeof data === 'string') {
		data = JSON.parse(data);
	}

	if (Array.isArray(data)) {
		return data.map((item) => sortObject(item));
	} else if (typeof data === 'object' && data !== null) {
		return sortObject(data);
	}

	return data;
}

function sortObject(obj) {
	if (Array.isArray(obj)) {
		return obj.map((item) => sortObject(item));
	} else if (typeof obj === 'object' && obj !== null) {
		const sorted = {};
		const keys = Object.keys(obj).sort();
		for (const key of keys) {
			sorted[key] = sortObject(obj[key]);
		}
		return sorted;
	}
	return obj;
}

function convertJSON(targetFormat, jsonData, options = {}) {
	let data;
	if (typeof jsonData === 'string') {
		data = JSON.parse(jsonData);
	} else {
		data = jsonData;
	}

	switch (targetFormat) {
		case 'csv':
			return jsonToCSV(data, options);
		case 'xml':
			return jsonToXML(data, options);
		case 'yaml':
			return jsonToYAML(data, options);
		case 'toml':
			return jsonToTOML(data, options);
		case 'properties':
			return jsonToProperties(data, options);
		default:
			throw new Error(`Unsupported conversion format: ${targetFormat}`);
	}
}

function jsonToCSV(data, options) {
	if (!Array.isArray(data)) {
		throw new Error('CSV conversion requires JSON array');
	}

	if (data.length === 0) return '';

	const headers = Object.keys(data[0]);
	const csvRows = [];

	if (options.includeHeaders !== false) {
		csvRows.push(headers.join(','));
	}

	for (const row of data) {
		const values = headers.map((header) => {
			const value = row[header];
			return typeof value === 'string' && value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
		});
		csvRows.push(values.join(','));
	}

	return csvRows.join('\n');
}

function jsonToXML(data, options) {
	const indent = options.indent || 2;
	const rootName = options.rootName || 'root';

	function objectToXML(obj, indentLevel = 0) {
		const spaces = ' '.repeat(indentLevel * indent);
		let xml = '';

		if (Array.isArray(obj)) {
			for (const item of obj) {
				xml += `${spaces}<item>\n`;
				xml += objectToXML(item, indentLevel + 1);
				xml += `${spaces}</item>\n`;
			}
		} else if (typeof obj === 'object' && obj !== null) {
			for (const [key, value] of Object.entries(obj)) {
				xml += `${spaces}<${key}>\n`;
				if (typeof value === 'object') {
					xml += objectToXML(value, indentLevel + 1);
				} else {
					xml += `${spaces}  ${value}\n`;
				}
				xml += `${spaces}</${key}>\n`;
			}
		} else {
			xml += `${spaces}${obj}\n`;
		}

		return xml;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${objectToXML(data, 1)}</${rootName}>`;
}

function jsonToYAML(data, options) {
	// Basic YAML conversion - in production, use a proper library
	return `# YAML output\n${JSON.stringify(data, null, 2)}`;
}

function jsonToTOML(data, options) {
	// Basic TOML conversion - in production, use a proper library
	return `# TOML output\n${JSON.stringify(data, null, 2)}`;
}

function jsonToProperties(data, options) {
	if (typeof data !== 'object' || data === null) {
		throw new Error('Properties conversion requires JSON object');
	}

	let props = '';
	for (const [key, value] of Object.entries(data)) {
		props += `${key}=${value}\n`;
	}
	return props;
}

function extractLineNumber(errorMessage) {
	const match = errorMessage.match(/line (\d+)/i);
	return match ? parseInt(match[1]) : null;
}
