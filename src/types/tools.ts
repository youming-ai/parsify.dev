// Basic tool types - Updated to match the 6 main categories
export type ToolCategory =
	| 'JSON Processing Suite'
	| 'Code Processing Suite'
	| 'File Processing Suite'
	| 'Network Utilities'
	| 'Text Processing Suite'
	| 'Security & Encryption Suite';

// Subcategory types for more granular organization
export type JSONSubcategory = 'JSON Tools' | 'Schema Tools' | 'Security Tools' | 'Visualization';

export type CodeSubcategory = 'Code Execution' | 'Code Optimization' | 'Code Security' | 'Code Analysis';

export type FileSubcategory = 'File Conversion' | 'Image Processing' | 'Document Processing';

export type NetworkSubcategory = 'API Testing' | 'Network Analysis' | 'SEO Tools';

export type TextSubcategory = 'Encoding Tools' | 'Formatting Tools' | 'Comparison Tools' | 'Generation Tools';

export type SecuritySubcategory = 'Hashing' | 'Authentication' | 'Encryption' | 'Identifiers';

// Category metadata interface
export interface CategoryMetadata {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	slug: string;
	toolCount: number;
	featured?: boolean;
	subcategories?: Record<
		string,
		{
			name: string;
			description: string;
			toolIds: string[];
		}
	>;
}

// Breadcrumb navigation item
export interface BreadcrumbItem {
	label: string;
	href?: string;
	isActive?: boolean;
}

// Navigation state
export interface CategoryNavigationState {
	activeCategory?: ToolCategory;
	activeSubcategory?: string;
	breadcrumb: BreadcrumbItem[];
	viewMode: 'grid' | 'list';
	sortBy: 'name' | 'popularity' | 'newest';
	filtersExpanded: boolean;
}

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

// Enhanced tool examples system
export interface ToolExample {
	id: string;
	title: string;
	description: string;
	input: any;
	expectedOutput: any;
	category: 'basic' | 'intermediate' | 'advanced';
	tags: string[];
	steps?: string[];
	codeExamples?: CodeExample[];
	interactive?: boolean;
	liveExecution?: boolean;
	useCase?: string;
	benefits?: string[];
	relatedExamples?: string[];
}

export interface CodeExample {
	id: string;
	language: string;
	code: string;
	explanation: string;
	output?: string;
	highlightedLines?: number[];
	runnable?: boolean;
}

export interface Tutorial {
	id: string;
	title: string;
	description: string;
	category: TutorialCategory;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedTime: number;
	prerequisites: string[];
	tools: string[];
	steps: TutorialStep[];
	tags: string[];
	author?: string;
	publishedAt: Date;
	updatedAt: Date;
	relatedTutorials?: string[];
}

export type TutorialCategory =
	| 'Getting Started'
	| 'JSON Processing'
	| 'Code Development'
	| 'File Management'
	| 'Web Development'
	| 'Security & Privacy'
	| 'Data Analysis'
	| 'API Integration'
	| 'Performance Optimization';

export interface TutorialStep {
	id: string;
	title: string;
	description: string;
	content: string;
	code?: CodeExample[];
	toolId?: string;
	toolConfig?: Record<string, any>;
	expectedOutput?: string;
	tips?: string[];
	warnings?: string[];
	completionCriteria?: string;
}

export interface WorkflowExample {
	id: string;
	title: string;
	description: string;
	category: WorkflowCategory;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	tools: WorkflowStep[];
	tags: string[];
	estimatedTime: number;
	steps: WorkflowStep[];
	previewImage?: string;
	useCases: string[];
}

export type WorkflowCategory =
	| 'Data Processing'
	| 'Web Development'
	| 'API Testing'
	| 'File Conversion'
	| 'Security Audit'
	| 'Content Creation'
	| 'Code Optimization';

export interface WorkflowStep {
	id: string;
	toolId: string;
	toolName: string;
	description: string;
	input: any;
	config?: Record<string, any>;
	expectedOutput: any;
	notes?: string;
	alternatives?: string[];
}

export interface IntegrationExample {
	id: string;
	title: string;
	description: string;
	tools: string[];
	scenario: string;
	steps: IntegrationStep[];
	benefits: string[];
	tags: string[];
	codeExamples?: CodeExample[];
	complexity: 'simple' | 'moderate' | 'complex';
}

export interface IntegrationStep {
	id: string;
	toolId: string;
	description: string;
	input: any;
	output: any;
	explanation: string;
	transitionToNext?: string;
}

// Example library and search interfaces
export interface ExampleLibrary {
	examples: Record<string, ToolExample[]>;
	tutorials: Tutorial[];
	workflows: WorkflowExample[];
	integrations: IntegrationExample[];
	categories: ExampleCategory[];
	searchIndex: ExampleSearchIndex;
}

export interface ExampleCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	exampleCount: number;
	tutorialCount: number;
	workflowCount: number;
}

export interface ExampleSearchIndex {
	examples: ExampleSearchItem[];
	tutorials: ExampleSearchItem[];
	workflows: ExampleSearchItem[];
	integrations: ExampleSearchItem[];
}

export interface ExampleSearchItem {
	id: string;
	title: string;
	description: string;
	type: 'example' | 'tutorial' | 'workflow' | 'integration';
	category: string;
	tags: string[];
	difficulty: string;
	popularity: number;
	relevanceScore?: number;
}

export interface ExampleFilterState {
	query: string;
	categories: string[];
	difficulties: string[];
	tags: string[];
	toolIds: string[];
	types: Array<'example' | 'tutorial' | 'workflow' | 'integration'>;
	interactiveOnly: boolean;
	sortBy: 'relevance' | 'popularity' | 'newest' | 'difficulty';
}

export interface ExampleAnalytics {
	viewCount: number;
	completionRate: number;
	averageTimeSpent: number;
	popularityScore: number;
	userRating: number;
	feedback: ExampleFeedback[];
}

export interface ExampleFeedback {
	id: string;
	userId: string;
	rating: number;
	comment: string;
	helpful: boolean;
	suggestedImprovements: string[];
	createdAt: Date;
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

// Search and filter related types
export interface SearchState {
	query: string;
	categories: ToolCategory[];
	difficulties: ToolDifficulty[];
	processingTypes: ProcessingType[];
	securityTypes: SecurityType[];
	features: string[];
	tags: string[];
	status: string[];
	isNew: boolean | null;
	isPopular: boolean | null;
}

export interface FilterOptions {
	categories: ToolCategory[];
	difficulties: ToolDifficulty[];
	processingTypes: ProcessingType[];
	securityTypes: SecurityType[];
	features: string[];
	tags: string[];
	status: string[];
}

export interface SearchSortOption {
	key: 'relevance' | 'name' | 'category' | 'difficulty' | 'popularity';
	direction: 'asc' | 'desc';
}

export interface SearchAnalytics {
	totalResults: number;
	filteredResults: number;
	searchTime: number;
	activeFilters: string[];
}

export interface SearchResult extends Tool {
	relevanceScore: number;
	matchedFields: string[];
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
