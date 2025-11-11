import type { Tool, EnhancedTool, ToolCategory } from '@/types/tools';

// Mock tool data for testing
export const mockTools: Tool[] = [
	{
		id: 'json-formatter',
		name: 'JSON Formatter',
		description: 'Format, beautify, and validate JSON data with customizable indentation and sorting options',
		category: 'JSON Processing',
		icon: 'FileJson',
		features: ['Format & Beautify', 'Syntax Validation', 'Custom Indentation', 'Key Sorting', 'Error Detection'],
		tags: ['json', 'formatter', 'validator', 'beautifier'],
		difficulty: 'beginner',
		status: 'stable',
		href: '/tools/json/formatter',
		isPopular: true,
		processingType: 'client-side',
		security: 'local-only',
	},
	{
		id: 'json-validator',
		name: 'JSON Validator',
		description: 'Comprehensive JSON validation with detailed error messages and schema support',
		category: 'JSON Processing',
		icon: 'FileJson',
		features: ['Syntax Validation', 'Schema Validation', 'Detailed Errors', 'Real-time Validation'],
		tags: ['json', 'validator', 'schema', 'error-detection'],
		difficulty: 'beginner',
		status: 'stable',
		href: '/tools/json/validator',
		processingType: 'client-side',
		security: 'local-only',
	},
	{
		id: 'code-executor',
		name: 'Code Executor',
		description: 'Execute code in a secure WASM sandbox with multiple language support',
		category: 'Code Execution',
		icon: 'Terminal',
		features: ['Multi-language Support', 'Secure Sandboxing', 'Real-time Output', 'Debug Mode'],
		tags: ['code', 'executor', 'wasm', 'sandbox', 'javascript', 'python'],
		difficulty: 'intermediate',
		status: 'stable',
		href: '/tools/code/executor',
		isPopular: true,
		processingType: 'client-side',
		security: 'secure-sandbox',
	},
	{
		id: 'hash-generator',
		name: 'Hash Generator',
		description: 'Generate various hash types for data integrity and security',
		category: 'Security & Encryption',
		icon: 'Fingerprint',
		features: ['Multiple Algorithms', 'File & Text Hashing', 'Batch Processing', 'Compare Hashes'],
		tags: ['hash', 'checksum', 'md5', 'sha256', 'security'],
		difficulty: 'beginner',
		status: 'stable',
		href: '/tools/security/hash-generator',
		isPopular: true,
		processingType: 'client-side',
		security: 'local-only',
	},
	{
		id: 'http-client',
		name: 'HTTP Client',
		description: 'Test HTTP requests with custom headers, methods, and body content',
		category: 'Network Utilities',
		icon: 'Public',
		features: ['Custom Methods', 'Headers Editor', 'Body Builder', 'Response Analysis', 'Request History'],
		tags: ['http', 'client', 'api', 'testing', 'rest'],
		difficulty: 'intermediate',
		status: 'beta',
		href: '/tools/network/http-client',
		isNew: true,
		processingType: 'client-side',
		security: 'network-required',
	},
	{
		id: 'text-processor',
		name: 'Text Processor',
		description: 'Advanced text processing with search, replace, and transformation capabilities',
		category: 'Text Processing',
		icon: 'FileText',
		features: ['Search & Replace', 'Text Transformation', 'Encoding Conversion', 'Case Tools'],
		tags: ['text', 'processing', 'search', 'replace', 'encoding'],
		difficulty: 'beginner',
		status: 'stable',
		href: '/tools/text/processor',
		processingType: 'client-side',
		security: 'local-only',
	},
];

// Mock enhanced tool with additional properties
export const mockEnhancedTool: EnhancedTool = {
	...mockTools[0],
	subcategory: 'JSON Tools',
	version: '1.0.0',
	dependencies: ['monaco-editor', 'json5'],
	performance: {
		maxInputSize: 10485760, // 10MB
		expectedTime: 1000,
		memoryRequirement: 52428800, // 50MB
		concurrencyLevel: 1,
	},
	limitations: {
		fileSizeLimit: 10485760,
		processingTimeLimit: 30,
		supportedFormats: ['json', 'json5'],
		browserRequirements: ['Web Workers'],
	},
	examples: [
		{
			title: 'Basic JSON Editing',
			description: 'Edit a simple JSON object with validation',
			input: '{"name": "John", "age": 30}',
			expectedOutput: 'Valid JSON with proper formatting',
			category: 'basic',
		},
	],
	relatedTools: ['json-validator', 'json-converter'],
};

// Mock categories for testing
export const mockCategories: ToolCategory[] = [
	'JSON Processing',
	'Code Execution',
	'Security & Encryption',
	'Network Utilities',
	'Text Processing',
	'File Processing',
];

// Mock search queries
export const mockSearchQueries = {
	json: 'json',
	formatter: 'formatter',
	validation: 'validation',
	empty: '',
	nonexistent: 'nonexistent tool',
	partial: 'format',
	caseInsensitive: 'JSON FORMATTER',
};

// Mock filter options
export const mockFilterOptions = {
	categories: mockCategories,
	difficulties: ['beginner', 'intermediate', 'advanced'],
	processingTypes: ['client-side', 'hybrid', 'server-side'],
	securityTypes: ['local-only', 'secure-sandbox', 'network-required'],
	features: ['Format & Beautify', 'Syntax Validation', 'Multi-language Support'],
	tags: ['json', 'formatter', 'validator', 'code', 'security'],
	status: ['stable', 'beta', 'experimental'],
};

// Mock search states
export const mockSearchStates = {
	initial: {
		query: '',
		categories: [],
		difficulties: [],
		processingTypes: [],
		securityTypes: [],
		features: [],
		tags: [],
		status: [],
		isNew: null,
		isPopular: null,
	},
	withQuery: {
		query: 'json',
		categories: [],
		difficulties: [],
		processingTypes: [],
		securityTypes: [],
		features: [],
		tags: [],
		status: [],
		isNew: null,
		isPopular: null,
	},
	withCategoryFilter: {
		query: '',
		categories: ['JSON Processing'],
		difficulties: [],
		processingTypes: [],
		securityTypes: [],
		features: [],
		tags: [],
		status: [],
		isNew: null,
		isPopular: null,
	},
	withMultipleFilters: {
		query: 'json',
		categories: ['JSON Processing'],
		difficulties: ['beginner'],
		processingTypes: ['client-side'],
		securityTypes: ['local-only'],
		features: ['Format & Beautify'],
		tags: ['formatter'],
		status: ['stable'],
		isNew: false,
		isPopular: true,
	},
};

// Mock component props
export const mockToolSearchProps = {
	tools: mockTools,
	onSearch: vi.fn(),
	onToolSelect: vi.fn(),
	placeholder: 'Search tools...',
	className: 'test-class',
	debounceMs: 300,
};

export const mockToolFiltersProps = {
	tools: mockTools,
	filters: mockSearchStates.initial,
	onFiltersChange: vi.fn(),
	className: 'test-class',
};

export const mockCategoryNavigationProps = {
	categories: mockCategories,
	activeCategory: 'JSON Processing',
	onCategoryChange: vi.fn(),
	className: 'test-class',
};

export const mockBreadcrumbNavigationProps = {
	items: [
		{ label: 'Home', href: '/' },
		{ label: 'Tools', href: '/tools' },
		{ label: 'JSON Processing', href: '/tools/json' },
	],
	className: 'test-class',
};

// Mock responsive breakpoints
export const mockBreakpoints = {
	mobile: 480,
	tablet: 768,
	desktop: 1024,
	wide: 1280,
};

// Mock user agents for testing
export const mockUserAgents = {
	mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
	tablet: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
	desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

// Mock performance metrics
export const mockPerformanceMetrics = {
	searchTime: 150,
	filterTime: 50,
	renderTime: 200,
	memoryUsage: 1024 * 1024, // 1MB
	bundleSize: 512 * 1024, // 512KB
};

// Mock error scenarios
export const mockErrorScenarios = {
	emptyToolsArray: [],
	invalidQuery: '   ',
	nullTools: null as any,
	undefinedTools: undefined as any,
	invalidFilters: {
		...mockSearchStates.initial,
		categories: ['invalid-category'] as any,
	},
};

// Mock accessibility properties
export const mockAccessibilityProps = {
	'aria-label': 'Tool search',
	'aria-describedby': 'tool-search-description',
	role: 'search',
	tabIndex: 0,
};

// Mock keyboard events
export const mockKeyboardEvents = {
	enter: new KeyboardEvent('keydown', { key: 'Enter' }),
	escape: new KeyboardEvent('keydown', { key: 'Escape' }),
	arrowDown: new KeyboardEvent('keydown', { key: 'ArrowDown' }),
	arrowUp: new KeyboardEvent('keydown', { key: 'ArrowUp' }),
	ctrlA: new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }),
};

// Mock file data for testing
export const mockFileData = {
	json: '{"name": "test", "value": 123}',
	text: 'This is sample text content',
	csv: 'name,age,city\nJohn,30,New York\nJane,25,London',
	xml: '<?xml version="1.0"?><root><item>test</item></root>',
};

// Export all mocks as a single object for convenience
export const mockData = {
	tools: mockTools,
	enhancedTool: mockEnhancedTool,
	categories: mockCategories,
	searchQueries: mockSearchQueries,
	filterOptions: mockFilterOptions,
	searchStates: mockSearchStates,
	componentProps: {
		toolSearch: mockToolSearchProps,
		toolFilters: mockToolFiltersProps,
		categoryNavigation: mockCategoryNavigationProps,
		breadcrumbNavigation: mockBreadcrumbNavigationProps,
	},
	breakpoints: mockBreakpoints,
	userAgents: mockUserAgents,
	performanceMetrics: mockPerformanceMetrics,
	errorScenarios: mockErrorScenarios,
	accessibilityProps: mockAccessibilityProps,
	keyboardEvents: mockKeyboardEvents,
	fileData: mockFileData,
};
