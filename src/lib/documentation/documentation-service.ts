import type {
	ToolDocumentation,
	DocumentationSection,
	TutorialCollection,
	WorkflowDocumentation,
	DocumentationSearchResult,
	DocumentationNavigation,
	CodeExample,
	BestPractice,
	FAQItem,
	Tool
} from '@/types/documentation';
import type { ToolCategory, SupportedLanguage } from '@/types/tools';

export class DocumentationService {
	private static instance: DocumentationService;
	private documentationCache: Map<string, ToolDocumentation> = new Map();
	private tutorialCache: Map<string, TutorialCollection> = new Map();
	private workflowCache: Map<string, WorkflowDocumentation> = new Map();
	private searchIndex: Map<string, string[]> = new Map();

	private constructor() {
		this.initializeSearchIndex();
	}

	static getInstance(): DocumentationService {
		if (!DocumentationService.instance) {
			DocumentationService.instance = new DocumentationService();
		}
		return DocumentationService.instance;
	}

	// Initialize search index for fast documentation search
	private initializeSearchIndex() {
		// This would be populated with actual documentation data
		// For now, we'll set up the structure
		this.searchIndex.set('json', ['json-formatter', 'json-validator', 'json-converter']);
		this.searchIndex.set('format', ['json-formatter', 'code-formatter', 'text-formatter']);
		this.searchIndex.set('convert', ['json-converter', 'file-converter', 'base64-converter']);
		this.searchIndex.set('validate', ['json-validator', 'data-validator']);
		this.searchIndex.set('execute', ['code-executor']);
		this.searchIndex.set('regex', ['regex-tester']);
		this.searchIndex.set('hash', ['hash-generator']);
		this.searchIndex.set('encrypt', ['file-encryptor']);
		this.searchIndex.set('password', ['password-generator']);
	}

	// Get tool documentation
	public getToolDocumentation(toolId: string): ToolDocumentation | null {
		if (this.documentationCache.has(toolId)) {
			return this.documentationCache.get(toolId)!;
		}

		// Generate documentation dynamically based on tool
		const documentation = this.generateToolDocumentation(toolId);
		if (documentation) {
			this.documentationCache.set(toolId, documentation);
			return documentation;
		}

		return null;
	}

	// Generate tool documentation dynamically
	private generateToolDocumentation(toolId: string): ToolDocumentation | null {
		const docTemplates: Record<string, Partial<ToolDocumentation>> = {
			'json-formatter': {
				sections: [
					{
						id: 'overview',
						title: 'Overview',
						content: this.generateOverviewSection('JSON Formatter', 'Format and beautify JSON data with customizable options'),
						order: 1,
						isRequired: true,
					},
					{
						id: 'getting-started',
						title: 'Getting Started',
						content: this.generateGettingStartedSection('json-formatter'),
						order: 2,
						isRequired: true,
					},
					{
						id: 'features',
						title: 'Features',
						content: this.generateFeaturesSection('json-formatter'),
						order: 3,
						isRequired: true,
					},
					{
						id: 'examples',
						title: 'Examples',
						content: '',
						order: 4,
						isRequired: true,
						subsections: [
							{
								id: 'basic-formatting',
								title: 'Basic JSON Formatting',
								content: 'Learn how to format basic JSON objects',
								order: 1,
								codeExamples: [
									{
										id: 'basic-format',
										title: 'Format a simple JSON object',
										description: 'Take a compact JSON string and format it with proper indentation',
										language: 'json',
										code: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
										output: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
										isInteractive: true,
										explanation: 'The JSON formatter will add proper indentation and line breaks to make the JSON more readable',
										difficulty: 'basic'
									}
								]
							}
						]
					},
					{
						id: 'best-practices',
						title: 'Best Practices',
						content: this.generateBestPracticesSection('json-formatter'),
						order: 5,
						isRequired: true,
					},
					{
						id: 'troubleshooting',
						title: 'Troubleshooting',
						content: this.generateTroubleshootingSection('json-formatter'),
						order: 6,
						isRequired: false,
					}
				],
				examples: [
					{
						title: 'Format nested JSON',
						description: 'Format complex nested JSON structures',
						input: '{"user":{"name":"John","details":{"age":30,"address":{"street":"123 Main St","city":"NYC"}}}}',
						expectedOutput: 'Formatted JSON with proper indentation',
						category: 'basic'
					}
				],
				bestPractices: [
					{
						id: 'consistent-indentation',
						title: 'Use Consistent Indentation',
						description: 'Always use the same indentation size throughout your JSON files',
						rationale: 'Consistent indentation makes JSON files more readable and easier to maintain',
						category: 'maintainability',
						applicableTo: ['json-formatter']
					}
				],
				faq: [
					{
						id: 'what-is-json',
						question: 'What is JSON?',
						answer: 'JSON (JavaScript Object Notation) is a lightweight data-interchange format that is easy for humans to read and write and easy for machines to parse and generate.',
						category: 'general',
						tags: ['json', 'basics'],
						helpfulCount: 45,
						notHelpfulCount: 2
					}
				]
			},
			'code-executor': {
				sections: [
					{
						id: 'overview',
						title: 'Overview',
						content: this.generateOverviewSection('Code Executor', 'Execute code in a secure sandbox with multiple language support'),
						order: 1,
						isRequired: true,
					},
					{
						id: 'supported-languages',
						title: 'Supported Languages',
						content: this.generateSupportedLanguagesSection(),
						order: 2,
						isRequired: true,
					},
					{
						id: 'security',
						title: 'Security & Sandboxing',
						content: this.generateSecuritySection(),
						order: 3,
						isRequired: true,
					},
					{
						id: 'examples',
						title: 'Code Examples',
						content: '',
						order: 4,
						isRequired: true,
						subsections: [
							{
								id: 'javascript-examples',
								title: 'JavaScript Examples',
								content: 'Common JavaScript patterns and examples',
								order: 1,
								codeExamples: [
									{
										id: 'hello-world-js',
										title: 'Hello World in JavaScript',
										description: 'A simple "Hello, World!" example in JavaScript',
										language: 'javascript',
										code: 'console.log("Hello, World!");',
										output: 'Hello, World!',
										isInteractive: true,
										explanation: 'This example demonstrates basic output in JavaScript',
										difficulty: 'basic'
									}
								]
							},
							{
								id: 'python-examples',
								title: 'Python Examples',
								content: 'Common Python patterns and examples',
								order: 2,
								codeExamples: [
									{
										id: 'hello-world-python',
										title: 'Hello World in Python',
										description: 'A simple "Hello, World!" example in Python',
										language: 'python',
										code: 'print("Hello, World!")',
										output: 'Hello, World!',
										isInteractive: true,
										explanation: 'This example demonstrates the print function in Python',
										difficulty: 'basic'
									}
								]
							}
						]
					}
				],
				examples: [
					{
						title: 'Execute JavaScript function',
						description: 'Define and call a JavaScript function',
						input: 'function greet(name) { return `Hello, ${name}!`; } console.log(greet("World"));',
						expectedOutput: 'Hello, World!',
						category: 'basic'
					}
				],
				bestPractices: [
					{
						id: 'efficient-code',
						title: 'Write Efficient Code',
						description: 'Consider performance and resource usage when writing code',
						rationale: 'Efficient code runs faster and uses fewer resources',
						category: 'performance',
						applicableTo: ['code-executor']
					}
				],
				faq: [
					{
						id: 'execution-limits',
						question: 'Are there execution time limits?',
						answer: 'Yes, code execution is limited to prevent infinite loops and resource abuse. Typical limits include 5-10 seconds of execution time.',
						category: 'limits',
						tags: ['execution', 'limits', 'security'],
						helpfulCount: 23,
						notHelpfulCount: 1
					}
				]
			}
		};

		const template = docTemplates[toolId];
		if (!template) {
			return this.generateDefaultDocumentation(toolId);
		}

		return {
			toolId,
			toolName: this.getToolName(toolId),
			toolCategory: this.getToolCategory(toolId),
			version: '1.0.0',
			lastUpdated: new Date(),
			sections: template.sections || [],
			examples: template.examples || [],
			tutorials: this.getRelatedTutorials(toolId),
			bestPractices: template.bestPractices || [],
			faq: template.faq || [],
			relatedTools: this.getRelatedTools(toolId),
			tags: this.getToolTags(toolId),
			difficulty: this.getToolDifficulty(toolId),
			estimatedReadTime: 5,
		};
	}

	// Generate default documentation for tools without specific templates
	private generateDefaultDocumentation(toolId: string): ToolDocumentation {
		return {
			toolId,
			toolName: this.getToolName(toolId),
			toolCategory: this.getToolCategory(toolId),
			version: '1.0.0',
			lastUpdated: new Date(),
			sections: [
				{
					id: 'overview',
					title: 'Overview',
					content: this.generateOverviewSection(this.getToolName(toolId), 'Tool description'),
					order: 1,
					isRequired: true,
				},
				{
					id: 'getting-started',
					title: 'Getting Started',
					content: this.generateGettingStartedSection(toolId),
					order: 2,
					isRequired: true,
				}
			],
			examples: [],
			tutorials: [],
			bestPractices: [],
			faq: [],
			relatedTools: [],
			tags: [],
			difficulty: 'beginner',
			estimatedReadTime: 3,
		};
	}

	// Helper methods for generating documentation content
	private generateOverviewSection(toolName: string, description: string): string {
		return `# ${toolName}

${description}

## Key Features
- Easy to use interface
- Real-time processing
- Secure and reliable
- No server-side processing required

## Use Cases
- Data validation and formatting
- Quick data transformations
- Development and testing
- Educational purposes`;
	}

	private generateGettingStartedSection(toolId: string): string {
		return `# Getting Started

## Quick Start
1. Navigate to the ${this.getToolName(toolId)} tool
2. Input your data in the provided field
3. Configure any options as needed
4. Click the process button
5. View and copy your results

## Basic Usage
The interface is designed to be intuitive and user-friendly. Simply paste your data and let the tool handle the rest.`;
	}

	private generateFeaturesSection(toolId: string): string {
		const commonFeatures = `
## Core Features
- **Real-time Processing**: See results as you type
- **Multiple Formats**: Support for various data formats
- **Error Handling**: Clear error messages and suggestions
- **Export Options**: Download results in multiple formats

## Advanced Features
- **Batch Processing**: Handle multiple items at once
- **Custom Settings**: Configure the tool to your needs
- **Keyboard Shortcuts**: Speed up your workflow
- **Dark Mode**: Easy on the eyes during late-night sessions`;

		if (toolId === 'json-formatter') {
			return `# JSON Formatter Features

## Formatting Options
- **Indentation**: Choose from 2, 4, or 8 spaces
- **Sort Keys**: Alphabetically sort object keys
- **Array Formatting**: Configure array line breaks
- **Quote Style**: Single or double quotes

## Validation
- **Syntax Checking**: Real-time JSON validation
- **Error Highlighting**: Clear error indication
- **Auto-fix**: Common error corrections
- **Schema Validation**: Validate against JSON schemas

${commonFeatures}`;
		}

		return commonFeatures;
	}

	private generateBestPracticesSection(toolId: string): string {
		return `# Best Practices

## Data Quality
- Always validate your input data
- Use consistent formatting throughout your project
- Test with various data sizes and edge cases

## Performance
- For large datasets, consider processing in chunks
- Use appropriate data structures for your use case
- Monitor memory usage with large files

## Security
- Never process sensitive data on public computers
- Validate user input before processing
- Use HTTPS for data transmission`;
	}

	private generateTroubleshootingSection(toolId: string): string {
		return `# Troubleshooting

## Common Issues

### "Invalid Format" Error
**Cause**: The input data doesn't match the expected format
**Solution**:
- Check for syntax errors
- Ensure proper escaping of special characters
- Use the validation tool to identify issues

### "Processing Failed" Error
**Cause**: An error occurred during processing
**Solution**:
- Try with a smaller dataset
- Check your internet connection
- Clear your browser cache and retry

### Performance Issues
**Cause**: Large datasets or complex operations
**Solution**:
- Break down large files into smaller chunks
- Close unnecessary browser tabs
- Consider using a more powerful device`;
	}

	private generateSupportedLanguagesSection(): string {
		return `# Supported Languages

## Web Technologies
- **JavaScript** (ES6+)
- **TypeScript**
- **HTML**
- **CSS**

## Backend Languages
- **Python** (3.x)
- **Node.js**
- **PHP**
- **Ruby**

## Systems Programming
- **C** (limited support)
- **C++** (limited support)
- **Go** (basic support)

## Other
- **SQL** (basic queries)
- **Bash** (limited commands)

## Language-Specific Notes
### JavaScript/TypeScript
- Full ES6+ support
- Access to browser APIs (limited)
- No DOM manipulation in sandbox

### Python
- Standard library available
- No network access
- No file system access

### SQL
- Basic SELECT, INSERT, UPDATE, DELETE
- No DDL statements (CREATE, DROP)
- Mock database for testing`;
	}

	private generateSecuritySection(): string {
		return `# Security & Sandboxing

## Execution Environment
Code execution occurs in a secure WebAssembly (WASM) sandbox with the following restrictions:

### Network Access
- ❌ No outgoing network requests
- ❌ No API calls
- ❌ No external resource access

### File System
- ❌ No file system access
- ❌ No file reading/writing
- ✅ In-memory data processing only

### System Resources
- Limited memory usage
- CPU time limits
- No direct hardware access

## Data Privacy
- All processing happens in your browser
- No data sent to external servers
- Temporary data cleared after session
- Secure by default architecture

## Best Practices
- Never execute untrusted code
- Validate all inputs
- Use appropriate error handling
- Follow the principle of least privilege`;
	}

	// Helper methods for tool metadata
	private getToolName(toolId: string): string {
		const nameMap: Record<string, string> = {
			'json-formatter': 'JSON Formatter',
			'json-validator': 'JSON Validator',
			'json-converter': 'JSON Converter',
			'code-executor': 'Code Executor',
			'code-formatter': 'Code Formatter',
			'regex-tester': 'Regex Tester',
			'hash-generator': 'Hash Generator',
			'file-converter': 'File Converter',
			'url-encoder': 'URL Encoder/Decoder',
			'base64-converter': 'Base64 Converter',
		};
		return nameMap[toolId] || toolId;
	}

	private getToolCategory(toolId: string): ToolCategory {
		const categoryMap: Record<string, ToolCategory> = {
			'json-formatter': 'JSON Processing',
			'json-validator': 'JSON Processing',
			'json-converter': 'JSON Processing',
			'code-executor': 'Code Execution',
			'code-formatter': 'Code Execution',
			'regex-tester': 'Code Execution',
			'hash-generator': 'Data Validation',
			'file-converter': 'File Processing',
			'url-encoder': 'Utilities',
			'base64-converter': 'Utilities',
		};
		return categoryMap[toolId] || 'Utilities';
	}

	private getToolTags(toolId: string): string[] {
		const tagMap: Record<string, string[]> = {
			'json-formatter': ['json', 'format', 'beautify', 'validation'],
			'json-validator': ['json', 'validation', 'schema', 'error-checking'],
			'json-converter': ['json', 'convert', 'transform', 'data-format'],
			'code-executor': ['code', 'execute', 'run', 'sandbox', 'wasm'],
			'code-formatter': ['code', 'format', 'beautify', 'prettier'],
			'regex-tester': ['regex', 'pattern', 'test', 'validate'],
			'hash-generator': ['hash', 'checksum', 'security', 'md5', 'sha256'],
			'file-converter': ['file', 'convert', 'transform', 'batch'],
			'url-encoder': ['url', 'encode', 'decode', 'encoding'],
			'base64-converter': ['base64', 'encode', 'decode', 'encoding'],
		};
		return tagMap[toolId] || [];
	}

	private getToolDifficulty(toolId: string): 'beginner' | 'intermediate' | 'advanced' {
		const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
			'json-formatter': 'beginner',
			'json-validator': 'beginner',
			'json-converter': 'intermediate',
			'code-executor': 'intermediate',
			'code-formatter': 'beginner',
			'regex-tester': 'intermediate',
			'hash-generator': 'beginner',
			'file-converter': 'beginner',
			'url-encoder': 'beginner',
			'base64-converter': 'beginner',
		};
		return difficultyMap[toolId] || 'beginner';
	}

	private getRelatedTools(toolId: string): string[] {
		const relatedMap: Record<string, string[]> = {
			'json-formatter': ['json-validator', 'json-converter'],
			'json-validator': ['json-formatter', 'json-converter'],
			'json-converter': ['json-formatter', 'json-validator'],
			'code-executor': ['code-formatter', 'regex-tester'],
			'code-formatter': ['code-executor', 'regex-tester'],
			'regex-tester': ['code-executor', 'code-formatter'],
			'hash-generator': ['password-generator', 'file-encryptor'],
			'file-converter': ['text-processor', 'csv-processor'],
		};
		return relatedMap[toolId] || [];
	}

	private getRelatedTutorials(toolId: string): any[] {
		// This would return tutorial references
		return [
			{
				id: 'getting-started',
				title: 'Getting Started with Parsify.dev',
				description: 'Learn the basics of using our developer tools',
				duration: 5,
				difficulty: 'beginner',
				tags: ['basics', 'introduction'],
				tools: [toolId],
				steps: []
			}
		];
	}

	// Search functionality
	public searchDocumentation(query: string): DocumentationSearchResult[] {
		const results: DocumentationSearchResult[] = [];
		const normalizedQuery = query.toLowerCase();

		// Search through all cached documentation
		for (const [toolId, documentation] of this.documentationCache) {
			const relevanceScore = this.calculateRelevanceScore(documentation, normalizedQuery);
			if (relevanceScore > 0) {
				results.push({
					id: toolId,
					type: 'tool',
					title: documentation.toolName,
					description: documentation.sections[0]?.content.substring(0, 150) || '',
					content: documentation.sections.map(s => s.content).join(' ').substring(0, 200),
					relevanceScore,
					highlights: this.extractHighlights(documentation, normalizedQuery),
					breadcrumbs: ['Tools', documentation.toolCategory, documentation.toolName],
					url: `/tools/${toolId}/docs`,
					lastUpdated: documentation.lastUpdated
				});
			}
		}

		// Sort by relevance score
		return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
	}

	private calculateRelevanceScore(documentation: ToolDocumentation, query: string): number {
		let score = 0;
		const queryWords = query.split(' ').filter(w => w.length > 2);

		// Title match (highest weight)
		if (documentation.toolName.toLowerCase().includes(query)) {
			score += 100;
		}

		// Exact word matches in title
		for (const word of queryWords) {
			if (documentation.toolName.toLowerCase().includes(word)) {
				score += 50;
			}
		}

		// Tag matches
		for (const tag of documentation.tags) {
			if (tag.toLowerCase().includes(query)) {
				score += 30;
			}
			for (const word of queryWords) {
				if (tag.toLowerCase().includes(word)) {
					score += 15;
				}
			}
		}

		// Content matches
		const allContent = documentation.sections.map(s => s.content).join(' ').toLowerCase();
		if (allContent.includes(query)) {
			score += 20;
		}

		return score;
	}

	private extractHighlights(documentation: ToolDocumentation, query: string): string[] {
		const highlights: string[] = [];
		const allContent = documentation.sections.map(s => s.content).join(' ');

		// Simple highlight extraction
		const sentences = allContent.split('. ');
		for (const sentence of sentences) {
			if (sentence.toLowerCase().includes(query.toLowerCase())) {
				highlights.push(sentence.trim());
				if (highlights.length >= 3) break;
			}
		}

		return highlights;
	}

	// Navigation
	public getDocumentationNavigation(toolId?: string): DocumentationNavigation {
		return {
			rootCategories: [
				{
					id: 'json-processing',
					name: 'JSON Processing',
					description: 'Tools for working with JSON data',
					icon: 'FileJson',
					order: 1,
					toolCount: 8,
					tutorialCount: 5
				},
				{
					id: 'code-execution',
					name: 'Code Execution',
					description: 'Execute and format code',
					icon: 'Terminal',
					order: 2,
					toolCount: 6,
					tutorialCount: 4
				},
				{
					id: 'file-processing',
					name: 'File Processing',
					description: 'Convert and process files',
					icon: 'FileText',
					order: 3,
					toolCount: 6,
					tutorialCount: 3
				},
				{
					id: 'network-utilities',
					name: 'Network Utilities',
					description: 'Network and API tools',
					icon: 'Public',
					order: 4,
					toolCount: 3,
					tutorialCount: 2
				},
				{
					id: 'text-processing',
					name: 'Text Processing',
					description: 'Text manipulation and analysis',
					icon: 'TextFields',
					order: 5,
					toolCount: 4,
					tutorialCount: 3
				},
				{
					id: 'security-encryption',
					name: 'Security & Encryption',
					description: 'Security and cryptographic tools',
					icon: 'Shield',
					order: 6,
					toolCount: 4,
					tutorialCount: 4
				}
			],
			currentPath: toolId ? ['Tools', this.getToolCategory(toolId), this.getToolName(toolId)] : ['Tools'],
			breadcrumbs: toolId ? [
				{ label: 'Tools', href: '/tools' },
				{ label: this.getToolCategory(toolId), href: `/tools/${this.getToolCategory(toolId).toLowerCase()}` },
				{ label: this.getToolName(toolId), isActive: true }
			] : [
				{ label: 'Tools', isActive: true }
			],
			relatedContent: toolId ? this.getRelatedContent(toolId) : [],
			filters: [
				{ id: 'difficulty', label: 'Difficulty', options: ['beginner', 'intermediate', 'advanced'] },
				{ id: 'category', label: 'Category', options: Object.values(this.getToolCategories()) },
				{ id: 'tags', label: 'Tags', options: ['json', 'code', 'security', 'conversion'] }
			]
		};
	}

	private getRelatedContent(toolId: string): any[] {
		const relatedTools = this.getRelatedTools(toolId);
		return relatedTools.map(relatedId => ({
			id: relatedId,
			type: 'tool' as const,
			title: this.getToolName(relatedId),
			description: '',
			relevanceScore: 0.8,
			url: `/tools/${relatedId}`
		}));
	}

	private getToolCategories(): ToolCategory[] {
		return [
			'JSON Processing',
			'Code Execution',
			'File Processing',
			'Network Utilities',
			'Text Processing',
			'Security & Encryption'
		];
	}

	// Tutorial management
	public getTutorialCollection(category: string): TutorialCollection[] {
		// Return mock tutorial collections
		return [
			{
				id: 'json-basics',
				title: 'JSON Processing Basics',
				description: 'Learn the fundamentals of working with JSON data',
				category: 'json-processing',
				difficulty: 'beginner',
				duration: 15,
				tutorials: [],
				outcomes: ['Understand JSON structure', 'Format and validate JSON', 'Convert JSON to other formats'],
				popularity: 85,
				rating: 4.7,
				lastUpdated: new Date()
			},
			{
				id: 'code-execution',
				title: 'Code Execution Workshop',
				description: 'Master code execution in our secure sandbox',
				category: 'code-execution',
				difficulty: 'intermediate',
				duration: 30,
				tutorials: [],
				outcomes: ['Execute multiple languages', 'Debug code issues', 'Optimize performance'],
				popularity: 72,
				rating: 4.5,
				lastUpdated: new Date()
			}
		];
	}

	// Clear cache (useful for development)
	public clearCache(): void {
		this.documentationCache.clear();
		this.tutorialCache.clear();
		this.workflowCache.clear();
	}
}

export const documentationService = DocumentationService.getInstance();
