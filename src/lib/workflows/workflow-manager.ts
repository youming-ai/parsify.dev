/**
 * Workflow Manager
 * Core business logic for managing guided workflows and tutorials
 */

import type {
	Workflow,
	WorkflowStep,
	WorkflowContext,
	WorkflowTemplate,
	WorkflowAnalytics,
	Tool
} from '@/types/workflows';
import type { ToolCategory } from '@/types/tools';
import { useWorkflowStore } from './workflow-store';

export class WorkflowManager {
	private static instance: WorkflowManager;
	private workflows: Map<string, Workflow> = new Map();
	private templates: Map<string, WorkflowTemplate> = new Map();
	private analytics: Map<string, WorkflowAnalytics[]> = new Map();

	private constructor() {
		this.initializeWorkflows();
		this.initializeTemplates();
	}

	static getInstance(): WorkflowManager {
		if (!WorkflowManager.instance) {
			WorkflowManager.instance = new WorkflowManager();
		}
		return WorkflowManager.instance;
	}

	// Workflow initialization
	private async initializeWorkflows() {
		// Load built-in workflows for each category
		const jsonWorkflows = this.createJSONWorkflows();
		const codeWorkflows = this.createCodeWorkflows();
		const fileWorkflows = this.createFileWorkflows();
		const securityWorkflows = this.createSecurityWorkflows();
		const networkWorkflows = this.createNetworkWorkflows();
		const textWorkflows = this.createTextWorkflows();

		[...jsonWorkflows, ...codeWorkflows, ...fileWorkflows,
		 ...securityWorkflows, ...networkWorkflows, ...textWorkflows].forEach(workflow => {
			this.workflows.set(workflow.id, workflow);
		});
	}

	private async initializeTemplates() {
		const templates: WorkflowTemplate[] = [
			this.createSequentialTemplate(),
			this.createBranchingTemplate(),
			this.createInteractiveTemplate(),
		];

		templates.forEach(template => {
			this.templates.set(template.id, template);
		});
	}

	// Workflow creation for different categories
	private createJSONWorkflows(): Workflow[] {
		return [
			{
				id: 'json-path-queries-workflow',
				name: 'Learn JSONPath Queries',
				description: 'Master JSONPath expressions to extract data from JSON structures',
				toolId: 'json-path-queries',
				category: 'JSON Processing Suite',
				difficulty: 'intermediate',
				estimatedDuration: 15,
				tags: ['json', 'query', 'data-extraction'],
				steps: [
					{
						id: 'json-path-intro',
						title: 'Introduction to JSONPath',
						description: 'Understanding the basics of JSONPath syntax',
						content: {
							type: 'instruction',
							text: 'JSONPath is a powerful query language for JSON data. It uses path expressions to navigate and extract values from JSON structures.',
							examples: [
								{
									title: 'Basic Expression',
									description: 'Access root object',
									code: '$',
									explanation: 'The $ symbol represents the root of the JSON document',
								},
								{
									title: 'Dot Notation',
									description: 'Access nested properties',
									code: '$.user.name',
									explanation: 'Use dots to navigate through object properties',
								},
							],
						},
						hints: [
							{
								type: 'tip',
								title: 'JSONPath vs XPath',
								content: 'JSONPath is inspired by XPath but simplified for JSON structures. Think of $ as the JSON equivalent of / in XPath.',
							},
						],
						difficulty: 'beginner',
					},
					{
						id: 'json-path-basic-expressions',
						title: 'Basic Expressions',
						description: 'Learn fundamental JSONPath expressions',
						content: {
							type: 'interactive',
							text: 'Try these basic expressions on the sample JSON data:',
							code: `{
  "store": {
    "book": [
      { "title": "Book 1", "price": 10.99 },
      { "title": "Book 2", "price": 12.99 }
    ],
    "bicycle": { "color": "red", "price": 199.99 }
  }
}`,
							interactiveElements: [
								{
									type: 'input',
									id: 'expression-input',
									label: 'Enter JSONPath expression:',
									placeholder: '$.store.book[*].title',
								},
								{
									type: 'button',
									id: 'test-expression',
									label: 'Test Expression',
								},
							],
							examples: [
								{
									title: 'Get all book titles',
									input: '$.store.book[*].title',
									output: ['Book 1', 'Book 2'],
								},
								{
									title: 'Get bicycle price',
									input: '$.store.bicycle.price',
									output: 199.99,
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => {
								// Validate that user successfully tested at least one expression
								return context.sessionData['tested_expressions'] > 0;
							},
							successMessage: 'Great! You\'ve mastered basic JSONPath expressions.',
						},
						hints: [
							{
								type: 'info',
								title: 'Wildcards',
								content: 'Use [*] to select all items in an array or all properties of an object.',
							},
						],
						difficulty: 'beginner',
					},
					{
						id: 'json-path-advanced-filters',
						title: 'Advanced Filters',
						description: 'Use filters and conditions in JSONPath',
						content: {
							type: 'instruction',
							text: 'Learn to use filters for more complex queries:',
							examples: [
								{
									title: 'Filter by condition',
									description: 'Find books under $11',
									code: '$.store.book[?(@.price < 11)].title',
									explanation: 'The ?() syntax creates filters, @ refers to the current item',
								},
								{
									title: 'Multiple conditions',
									description: 'Complex filtering with AND/OR',
									code: '$.store.book[?(@.price > 10 && @.price < 15)]',
									explanation: 'Combine multiple conditions using logical operators',
								},
							],
						},
						interactiveElements: [
							{
								type: 'select',
								id: 'filter-type',
								label: 'Choose a filter type:',
								options: ['Price comparison', 'String matching', 'Array operations'],
							},
						],
						validation: {
							type: 'automatic',
							validate: (context) => {
								return context.sessionData['filter_used'] === true;
							},
						},
						hints: [
							{
								type: 'tip',
								title: 'Filter Syntax',
								content: 'Filters use JavaScript expression syntax inside ?() parentheses. The @ symbol represents the current item being filtered.',
							},
						],
						difficulty: 'intermediate',
					},
				],
				isRecommended: true,
			},
			{
				id: 'json-schema-generator-workflow',
				name: 'Generate JSON Schemas',
				description: 'Learn to create JSON schemas for validation and documentation',
				toolId: 'json-schema-generator',
				category: 'JSON Processing Suite',
				difficulty: 'advanced',
				estimatedDuration: 20,
				tags: ['json', 'schema', 'validation'],
				steps: [
					{
						id: 'schema-basics',
						title: 'Schema Fundamentals',
						description: 'Understanding JSON schema structure',
						content: {
							type: 'instruction',
							text: 'JSON Schema defines the structure, constraints, and validation rules for JSON data.',
							examples: [
								{
									title: 'Simple Object Schema',
									code: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number", "minimum": 0 }
  },
  "required": ["name"]
}`,
								},
							],
						},
						difficulty: 'intermediate',
					},
					{
						id: 'schema-advanced-types',
						title: 'Advanced Schema Types',
						description: 'Working with complex data structures',
						content: {
							type: 'interactive',
							text: 'Create schemas for arrays, nested objects, and complex validations',
							interactiveElements: [
								{
									type: 'input',
									id: 'sample-json',
									label: 'Paste your JSON to generate schema:',
									placeholder: '{"example": "data"}',
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => context.sessionData['schema_generated'] === true,
						},
						difficulty: 'advanced',
					},
				],
			},
		];
	}

	private createCodeWorkflows(): Workflow[] {
		return [
			{
				id: 'code-executor-workflow',
				name: 'Code Execution Fundamentals',
				description: 'Learn to use the secure code execution environment',
				toolId: 'code-executor',
				category: 'Code Processing Suite',
				difficulty: 'beginner',
				estimatedDuration: 10,
				tags: ['code', 'execution', 'security'],
				steps: [
					{
						id: 'execution-basics',
						title: 'Understanding the Sandbox',
						description: 'Learn about the secure execution environment',
						content: {
							type: 'instruction',
							text: 'The code executor runs in a WebAssembly (WASM) sandbox for security. This isolates code execution from your main browser environment.',
							examples: [
								{
									title: 'Simple Hello World',
									code: 'console.log("Hello, World!");',
									description: 'Your first code execution',
								},
							],
						},
						hints: [
							{
								type: 'warning',
								title: 'Security Note',
								content: 'All code execution is sandboxed and isolated. No file system or network access is available.',
							},
						],
						difficulty: 'beginner',
					},
					{
						id: 'language-selection',
						title: 'Choose Your Language',
						description: 'Select a programming language and write your code',
						content: {
							type: 'interactive',
							text: 'Select a language from the dropdown and write your first program:',
							interactiveElements: [
								{
									type: 'select',
									id: 'language-select',
									label: 'Programming Language:',
									options: ['JavaScript', 'Python', 'Java', 'C++'],
								},
								{
									type: 'input',
									id: 'code-input',
									label: 'Write your code:',
									placeholder: 'console.log("Hello World");',
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => context.sessionData['code_executed'] === true,
						},
						difficulty: 'beginner',
					},
				],
				isRecommended: true,
			},
			{
				id: 'code-obfuscator-workflow',
				name: 'Code Obfuscation Techniques',
				description: 'Learn to protect your JavaScript code with obfuscation',
				toolId: 'code-obfuscator',
				category: 'Code Processing Suite',
				difficulty: 'advanced',
				estimatedDuration: 25,
				tags: ['code', 'security', 'obfuscation'],
				steps: [
					{
						id: 'obfuscation-intro',
						title: 'What is Code Obfuscation?',
						description: 'Understanding the purpose and techniques',
						content: {
							type: 'instruction',
							text: 'Code obfuscation transforms readable code into a version that\'s difficult for humans to understand while maintaining functionality.',
							examples: [
								{
									title: 'Before Obfuscation',
									code: 'function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}',
								},
								{
									title: 'After Obfuscation',
									code: 'function _0x1a2b(_0x3c4d, _0x5e6f) {\n  return _0x3c4d[_0x7g8h]((_0x9i0j, _0x1k2l) => _0x9i0j + _0x1k2l[_0x3m4n], 0);\n}',
								},
							],
						},
						difficulty: 'intermediate',
					},
					{
						id: 'obfuscation-techniques',
						title: 'Obfuscation Techniques',
						description: 'Explore different obfuscation methods',
						content: {
							type: 'interactive',
							text: 'Try different obfuscation techniques:',
							interactiveElements: [
								{
									type: 'select',
									id: 'obfuscation-level',
									label: 'Obfuscation Level:',
									options: ['Basic', 'Medium', 'Advanced'],
								},
								{
									type: 'toggle',
									id: 'string-encryption',
									label: 'Encrypt Strings',
								},
								{
									type: 'toggle',
									id: 'control-flow',
									label: 'Control Flow Flattening',
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => context.sessionData['obfuscation_applied'] === true,
						},
						hints: [
							{
								type: 'tip',
								title: 'Balance Security and Performance',
								content: 'Higher obfuscation levels provide better security but may impact performance. Choose based on your needs.',
							},
						],
						difficulty: 'advanced',
					},
				],
			},
		];
	}

	private createFileWorkflows(): Workflow[] {
		return [
			{
				id: 'file-converter-workflow',
				name: 'File Conversion Guide',
				description: 'Learn to convert between different file formats',
				toolId: 'file-converter',
				category: 'File Processing Suite',
				difficulty: 'beginner',
				estimatedDuration: 12,
				tags: ['file', 'conversion', 'format'],
				steps: [
					{
						id: 'supported-formats',
						title: 'Supported File Formats',
						description: 'Discover what formats you can convert between',
						content: {
							type: 'instruction',
							text: 'The file converter supports various formats including images, documents, and data files.',
							examples: [
								{
									title: 'Image Formats',
									description: 'PNG, JPEG, WebP, GIF, BMP',
								},
								{
									title: 'Document Formats',
									description: 'PDF, DOCX, TXT, MD',
								},
							],
						},
						difficulty: 'beginner',
					},
					{
						id: 'conversion-process',
						title: 'Converting Files',
						description: 'Step-by-step file conversion',
						content: {
							type: 'interactive',
							text: 'Upload a file and select your target format:',
							interactiveElements: [
								{
									type: 'input',
									id: 'file-upload',
									label: 'Choose file to convert:',
								},
								{
									type: 'select',
									id: 'target-format',
									label: 'Convert to:',
									options: ['PNG', 'JPEG', 'PDF', 'TXT'],
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => context.sessionData['file_converted'] === true,
						},
						difficulty: 'beginner',
					},
				],
			},
		];
	}

	private createSecurityWorkflows(): Workflow[] {
		return [
			{
				id: 'hash-generator-workflow',
				name: 'Understanding Hash Functions',
				description: 'Learn about cryptographic hash functions and when to use them',
				toolId: 'hash-generator',
				category: 'Security & Encryption Suite',
				difficulty: 'intermediate',
				estimatedDuration: 15,
				tags: ['hash', 'security', 'cryptography'],
				steps: [
					{
						id: 'hash-basics',
						title: 'What are Hash Functions?',
						description: 'Understanding the fundamentals of cryptographic hashes',
						content: {
							type: 'instruction',
							text: 'Hash functions are one-way cryptographic functions that generate fixed-size outputs from variable-size inputs.',
							examples: [
								{
									title: 'Properties of Hash Functions',
									description: '• Deterministic: Same input always produces same output\n• One-way: Cannot reverse engineer input from output\n• Fixed output size: Regardless of input size\n• Avalanche effect: Small input changes create big output changes',
								},
							],
						},
						difficulty: 'beginner',
					},
					{
						id: 'hash-algorithms',
						title: 'Common Hash Algorithms',
						description: 'Compare different hash functions',
						content: {
							type: 'interactive',
							text: 'Generate hashes using different algorithms:',
							interactiveElements: [
								{
									type: 'input',
									id: 'hash-input',
									label: 'Enter text to hash:',
									placeholder: 'Hello, World!',
								},
								{
									type: 'select',
									id: 'algorithm-select',
									label: 'Hash Algorithm:',
									options: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'],
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => context.sessionData['hash_generated'] === true,
						},
						hints: [
							{
								type: 'warning',
								title: 'Security Note',
								content: 'MD5 and SHA-1 are considered cryptographically weak. Use SHA-256 or stronger for security applications.',
							},
						],
						difficulty: 'intermediate',
					},
				],
			},
		];
	}

	private createNetworkWorkflows(): Workflow[] {
		return [
			{
				id: 'http-client-workflow',
				name: 'HTTP API Testing',
				description: 'Learn to test and debug APIs with the HTTP client',
				toolId: 'http-client',
				category: 'Network Utilities',
				difficulty: 'intermediate',
				estimatedDuration: 18,
				tags: ['http', 'api', 'testing'],
				steps: [
					{
						id: 'http-basics',
						title: 'HTTP Fundamentals',
						description: 'Understanding HTTP methods and status codes',
						content: {
							type: 'instruction',
							text: 'HTTP (Hypertext Transfer Protocol) is the foundation of web communication.',
							examples: [
								{
									title: 'Common HTTP Methods',
									description: 'GET: Retrieve data\nPOST: Create new data\nPUT: Update existing data\nDELETE: Remove data',
								},
							],
						},
						difficulty: 'beginner',
					},
					{
						id: 'making-requests',
						title: 'Making API Requests',
						description: 'Send your first HTTP request',
						content: {
							type: 'interactive',
							text: 'Configure and send an HTTP request:',
							interactiveElements: [
								{
									type: 'select',
									id: 'method-select',
									label: 'HTTP Method:',
									options: ['GET', 'POST', 'PUT', 'DELETE'],
								},
								{
									type: 'input',
									id: 'url-input',
									label: 'URL:',
									placeholder: 'https://api.example.com/data',
								},
							],
						},
						validation: {
							type: 'automatic',
							validate: (context) => context.sessionData['request_sent'] === true,
						},
						difficulty: 'intermediate',
					},
				],
			},
		];
	}

	private createTextWorkflows(): Workflow[] {
		return [
			{
				id: 'text-encoding-workflow',
				name: 'Text Encoding Explained',
				description: 'Understand different text encoding formats',
				toolId: 'text-encoder',
				category: 'Text Processing Suite',
				difficulty: 'beginner',
				estimatedDuration: 10,
				tags: ['text', 'encoding', 'unicode'],
				steps: [
					{
						id: 'encoding-basics',
						title: 'What is Text Encoding?',
						description: 'Understanding character encoding',
						content: {
							type: 'instruction',
							text: 'Text encoding determines how characters are represented as bytes.',
							examples: [
								{
									title: 'Common Encodings',
									description: 'UTF-8: Universal encoding supporting all characters\nASCII: Basic English characters only\nBase64: Binary-to-text encoding',
								},
							],
						},
						difficulty: 'beginner',
					},
				],
			},
		];
	}

	// Template creation
	private createSequentialTemplate(): WorkflowTemplate {
		return {
			id: 'sequential-template',
			name: 'Sequential Workflow',
			description: 'Step-by-step linear progression',
			category: 'Text Processing Suite' as ToolCategory,
			pattern: 'sequential',
			baseSteps: [
				{
					id: 'introduction',
					title: 'Getting Started',
					description: 'Introduction to the tool',
					content: { type: 'instruction', text: 'Welcome to this guided workflow!' },
					difficulty: 'beginner',
				},
			],
			variants: [],
		};
	}

	private createBranchingTemplate(): WorkflowTemplate {
		return {
			id: 'branching-template',
			name: 'Branching Workflow',
			description: 'Choose your learning path',
			category: 'Text Processing Suite' as ToolCategory,
			pattern: 'branching',
			baseSteps: [
				{
					id: 'choice-point',
					title: 'Choose Your Path',
					description: 'Select what you want to learn',
					content: { type: 'instruction', text: 'Choose your learning path:' },
					difficulty: 'beginner',
				},
			],
			variants: [],
		};
	}

	private createInteractiveTemplate(): WorkflowTemplate {
		return {
			id: 'interactive-template',
			name: 'Interactive Workflow',
			description: 'Hands-on learning with exercises',
			category: 'Text Processing Suite' as ToolCategory,
			pattern: 'interactive',
			baseSteps: [
				{
					id: 'hands-on',
					title: 'Try It Yourself',
					description: 'Interactive exercise',
					content: { type: 'interactive', text: 'Complete this interactive exercise:' },
					difficulty: 'intermediate',
				},
			],
			variants: [],
		};
	}

	// Public API methods
	public getWorkflow(id: string): Workflow | undefined {
		return this.workflows.get(id);
	}

	public getWorkflowsForTool(toolId: string): Workflow[] {
		return Array.from(this.workflows.values()).filter(workflow => workflow.toolId === toolId);
	}

	public getWorkflowsForCategory(category: ToolCategory): Workflow[] {
		return Array.from(this.workflows.values()).filter(workflow => workflow.category === category);
	}

	public getRecommendedWorkflows(): Workflow[] {
		return Array.from(this.workflows.values()).filter(workflow => workflow.isRecommended);
	}

	public getWorkflowById(id: string): Workflow | undefined {
		return this.workflows.get(id);
	}

	public startWorkflow(workflowId: string): boolean {
		const workflow = this.getWorkflowById(workflowId);
		if (!workflow) return false;

		const store = useWorkflowStore.getState();
		store.startWorkflow(workflow);
		return true;
	}

	public completeWorkflow(workflowId: string): boolean {
		const workflow = this.getWorkflowById(workflowId);
		if (!workflow) return false;

		const store = useWorkflowStore.getState();
		if (store.activeWorkflow?.id === workflowId) {
			store.completeWorkflow();
		}
		return true;
	}

	public getAnalytics(workflowId: string): WorkflowAnalytics[] {
		return this.analytics.get(workflowId) || [];
	}

	public trackAnalytics(analytics: WorkflowAnalytics): void {
		const existing = this.analytics.get(analytics.workflowId) || [];
		existing.push(analytics);
		this.analytics.set(analytics.workflowId, existing);
	}

	public generateWorkflowFromTemplate(templateId: string, tool: Tool, customizations?: Partial<Workflow>): Workflow | null {
		const template = this.templates.get(templateId);
		if (!template) return null;

		const workflow: Workflow = {
			id: `${tool.id}-workflow-${Date.now()}`,
			name: `Learn ${tool.name}`,
			description: `Guided workflow for ${tool.name}`,
			toolId: tool.id,
			category: tool.category as ToolCategory,
			difficulty: tool.difficulty === 'advanced' ? 'advanced' :
						tool.difficulty === 'intermediate' ? 'intermediate' : 'beginner',
			estimatedDuration: 10,
			steps: template.baseSteps as WorkflowStep[],
			tags: tool.tags,
			...customizations,
		};

		return workflow;
	}
}

// Export singleton instance
export const workflowManager = WorkflowManager.getInstance();
