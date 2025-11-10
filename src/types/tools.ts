// Basic tool types
export type ToolCategory =
	| 'JSON Processing'
	| 'Code Execution'
	| 'File Processing'
	| 'Network Utilities'
	| 'Text Processing'
	| 'Security & Encryption';

export type ToolTag = string;
export type ToolDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProcessingType = 'client-side' | 'server-side' | 'hybrid';
export type SecurityType = 'local-only' | 'secure-sandbox' | 'network-required';

// Core tool interface (matching existing implementation)
export interface Tool {
	id: string;
	name: string;
	description: string;
	category: ToolCategory;
	icon: string;
	features: string[];
	tags: string[];
	difficulty: ToolDifficulty;
	status: 'stable' | 'beta' | 'experimental';
	href: string;
	isNew?: boolean;
	isPopular?: boolean;
	processingType: ProcessingType;
	security: SecurityType;
}

// Enhanced tool interface for new tools
export interface EnhancedTool extends Tool {
	subcategory?: string;
	version: string;
	dependencies: string[];
	performance: PerformanceSpec;
	limitations: Limitations;
	examples: ToolExample[];
	relatedTools: string[];
}

// Performance specifications
export interface PerformanceSpec {
	maxInputSize: number;
	expectedTime: number;
	memoryRequirement: number;
	concurrencyLevel: number;
}

// Tool limitations
export interface Limitations {
	fileSizeLimit?: number;
	processingTimeLimit?: number;
	supportedFormats?: string[];
	browserRequirements?: string[];
}

// Tool examples
export interface ToolExample {
	title: string;
	description: string;
	input: any;
	expectedOutput: any;
	category: 'basic' | 'intermediate' | 'advanced';
}

// Tool session management
export interface ToolSession {
	id: string;
	toolId: string;
	createdAt: Date;
	lastActivity: Date;
	inputs: Record<string, any>;
	results: any;
	config: ToolConfig;
	status: 'active' | 'completed' | 'error';
	metadata: SessionMetadata;
}

export interface ToolConfig {
	[key: string]: any;
}

export interface SessionMetadata {
	browser?: string;
	version?: string;
	platform?: string;
}

// Conversion job for file/data processing
export interface ConversionJob {
	id: string;
	sessionId: string;
	sourceFormat: string;
	targetFormat: string;
	sourceData: any;
	targetData?: any;
	progress: number;
	status: ConversionStatus;
	options: ConversionOptions;
	error?: ConversionError;
	startedAt?: Date;
	completedAt?: Date;
}

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ConversionOptions {
	[key: string]: any;
	includeHeaders?: boolean;
	indentation?: number;
	dateFormat?: string;
	encoding?: string;
}

export interface ConversionError {
	type: string;
	message: string;
	details?: any;
	recoverable: boolean;
	suggestions?: string[];
}

// Code execution interfaces
export interface CodeExecution {
	id: string;
	sessionId: string;
	language: SupportedLanguage;
	code: string;
	input?: string;
	output?: string;
	error?: ExecutionError;
	status: ExecutionStatus;
	metrics: ExecutionMetrics;
	environment: ExecutionEnvironment;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
}

export type SupportedLanguage =
	| 'javascript'
	| 'python'
	| 'java'
	| 'csharp'
	| 'cpp'
	| 'go'
	| 'rust'
	| 'php'
	| 'ruby'
	| 'sql'
	| 'html'
	| 'css';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface ExecutionError {
	type: string;
	message: string;
	line?: number;
	column?: number;
	stack?: string;
}

export interface ExecutionMetrics {
	executionTime: number;
	memoryUsage: number;
	cpuTime: number;
	outputSize: number;
}

export interface ExecutionEnvironment {
	version: string;
	timeout: number;
	memoryLimit: number;
	allowedImports: string[];
}

// User preferences
export interface UserPreferences {
	theme: 'light' | 'dark' | 'system';
	defaultSettings: ToolDefaultSettings;
	favoriteTools: string[];
	recentTools: string[];
	shortcuts: KeyboardShortcuts;
	uiPreferences: UIPreferences;
	lastUpdated: Date;
}

export interface ToolDefaultSettings {
	[toolId: string]: any;
}

export interface KeyboardShortcuts {
	[action: string]: string;
}

export interface UIPreferences {
	fontSize: 'small' | 'medium' | 'large';
	showLineNumbers: boolean;
	wordWrap: boolean;
	autoSave: boolean;
	compactMode: boolean;
}

// Processing history
export interface ProcessingHistory {
	sessionId: string;
	toolId: string;
	operation: string;
	timestamp: Date;
	inputsSummary: string;
	resultsSummary?: string;
	duration: number;
	success: boolean;
	starred: boolean;
}

export interface HistoryEntry {
	id: string;
	session: ProcessingHistory;
	restorable: boolean;
	tags: string[];
	notes?: string;
}

// Validation interfaces
export interface ValidationRule {
	field: string;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	required: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	custom?: (value: any) => boolean | string;
}

export interface ToolValidation {
	toolId: string;
	rules: ValidationRule[];
	sanitize: (inputs: any) => any;
	transform?: (inputs: any) => any;
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
	severity: 'error' | 'warning' | 'info';
}

export interface ProcessingError {
	type: 'validation' | 'processing' | 'network' | 'security';
	message: string;
	code: string;
	details?: any;
	recoverable: boolean;
	suggestions?: string[];
}

// Tool operation requests
export interface ToolRequest {
	toolId: string;
	operation: string;
	data: any;
	options?: any;
	sessionId?: string;
}

export interface ToolResult {
	success: boolean;
	result: any;
	error?: ProcessingError;
	sessionId: string;
	timestamp: Date;
	metrics: ToolMetrics;
}

export interface ToolMetrics {
	duration: number;
	memoryUsed: number;
	outputSize: number;
	timestamp: Date;
}

// Type guards
export function isEnhancedTool(tool: Tool): tool is EnhancedTool {
	return 'version' in tool && 'performance' in tool;
}

export function isValidToolCategory(category: string): category is ToolCategory {
	return [
		'JSON Processing',
		'Code Execution',
		'File Processing',
		'Network Utilities',
		'Text Processing',
		'Security & Encryption',
	].includes(category);
}
