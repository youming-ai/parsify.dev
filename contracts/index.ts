// File processing contracts for API requests and responses

export interface FileParseRequest {
	fileId: string;
	content?: string;
	options?: {
		encoding?: string;
		stripWhitespace?: boolean;
		trimStrings?: boolean;
		parseNumbers?: boolean;
		parseBooleans?: boolean;
	};
}

export interface FileParseResponse {
	success: boolean;
	data?: any;
	metadata?: {
		size: number;
		type: string;
		encoding: string;
		lastModified: string;
	};
	error?: string;
	parsedAt: string;
}

export interface FileValidationRequest {
	fileId: string;
	content?: string;
	type: string;
	options?: {
		strictMode?: boolean;
		checkSyntax?: boolean;
		checkSemantics?: boolean;
		validateAgainstSchema?: boolean;
		schema?: object;
	};
}

export interface FileValidationResponse {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
	metadata?: {
		size: number;
		type: string;
		checkedAt: string;
	};
}

export interface ValidationError {
	line?: number;
	column?: number;
	position?: number;
	message: string;
	severity: 'error' | 'warning' | 'info';
	code?: string;
	path?: string;
}

export interface ProcessingOptions {
	// JSON specific options
	indent?: number;
	sortKeys?: boolean;
	compact?: boolean;
	trailingComma?: boolean;

	// General processing options
	validate?: boolean;
	strictMode?: boolean;
	encoding?: string;
	stripWhitespace?: boolean;
	trimStrings?: boolean;
	parseNumbers?: boolean;
	parseBooleans?: boolean;
}

export interface FileUploadResponse {
	fileId: string;
	name: string;
	size: number;
	type: string;
	url?: string;
	uploadedAt: string;
	metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code: string;
		details?: any;
	};
	timestamp: string;
}

// JSON specific contracts
export interface JsonFormatRequest {
	content: string;
	options?: {
		indent?: number;
		sortKeys?: boolean;
		compact?: boolean;
		trailingComma?: boolean;
	};
}

export interface JsonFormatResponse {
	formatted: string;
	size: {
		before: number;
		after: number;
		compression: number;
	};
}

export interface JsonValidationRequest {
	content: string;
	options?: {
		strictMode?: boolean;
		allowComments?: boolean;
		allowTrailingCommas?: boolean;
		maxDepth?: number;
	};
}

export interface JsonValidationResponse {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
	metadata?: {
		size: number;
		checkedAt: string;
		depth: number;
	};
}

export interface JsonConvertRequest {
	content: string;
	targetFormat: 'xml' | 'yaml' | 'csv' | 'toml' | 'properties';
	options?: {
		rootElement?: string;
		arrayItemName?: string;
		flatten?: boolean;
		csvDelimiter?: string;
		includeHeader?: boolean;
	};
}

export interface JsonConvertResponse {
	converted: string;
	format: string;
	size: {
		before: number;
		after: number;
	};
}

// Tool execution contracts
export interface ToolExecutionRequest {
	tool: string;
	action: string;
	input: any;
	options?: {
		timeout?: number;
		memory?: number;
		environment?: Record<string, string>;
	};
}

export interface ToolExecutionResponse {
	success: boolean;
	output?: any;
	error?: string;
	executionTime: number;
	memoryUsed?: number;
	timestamp: string;
}

// WebSocket contracts
export interface WebSocketMessage {
	type: string;
	data: any;
	timestamp: string;
	id: string;
}

export interface CollaborationEvent {
	type: 'join' | 'leave' | 'edit' | 'cursor' | 'selection';
	userId: string;
	data: any;
	timestamp: string;
}

// Health check contracts
export interface HealthCheckResponse {
	status: 'healthy' | 'unhealthy' | 'degraded';
	timestamp: string;
	version: string;
	uptime: number;
	services: Record<
		string,
		{
			status: 'healthy' | 'unhealthy' | 'degraded';
			responseTime?: number;
			error?: string;
		}
	>;
	metrics?: {
		memory: number;
		cpu: number;
		disk: number;
		network: number;
	};
}
