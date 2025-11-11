import type {
	Tool,
	ToolCategory,
	EnhancedTool,
	PerformanceSpec,
	Limitations,
	ToolExample,
} from '@/types/tools';
import type {
	ToolDocumentation,
	CodeExample,
	BestPractice,
	FAQItem,
	TutorialReference,
	DocumentationSection,
	DocumentationSubsection,
} from '@/types/documentation';

export class APIDocumentationGenerator {
	private static instance: APIDocumentationGenerator;
	private toolExamples: Map<string, ToolExample[]> = new Map();
	private codeTemplates: Map<string, CodeTemplate> = new Map();

	private constructor() {
		this.initializeCodeTemplates();
		this.initializeToolExamples();
	}

	static getInstance(): APIDocumentationGenerator {
		if (!APIDocumentationGenerator.instance) {
			APIDocumentationGenerator.instance = new APIDocumentationGenerator();
		}
		return APIDocumentationGenerator.instance;
	}

	// Generate comprehensive API documentation for a tool
	public generateAPIDocumentation(tool: Tool | EnhancedTool): ToolDocumentation {
		const toolId = tool.id;
		const isEnhanced = this.isEnhancedTool(tool);

		return {
			toolId,
			toolName: tool.name,
			toolCategory: tool.category,
			version: isEnhanced ? tool.version : '1.0.0',
			lastUpdated: new Date(),
			sections: this.generateDocumentationSections(tool),
			examples: this.getToolExamples(toolId),
			tutorials: this.generateTutorialReferences(toolId),
			bestPractices: this.generateBestPractices(toolId),
			faq: this.generateFAQ(toolId),
			relatedTools: isEnhanced ? tool.relatedTools : this.getRelatedTools(toolId),
			tags: tool.tags,
			difficulty: tool.difficulty,
			estimatedReadTime: this.calculateReadTime(tool),
			author: 'Parsify.dev Documentation Team',
			reviewers: ['Technical Review Board'],
		};
	}

	// Generate documentation sections based on tool type
	private generateDocumentationSections(tool: Tool | EnhancedTool): DocumentationSection[] {
		const baseSections: DocumentationSection[] = [
			{
				id: 'overview',
				title: 'Overview',
				content: this.generateOverview(tool),
				order: 1,
				isRequired: true,
			},
			{
				id: 'api-reference',
				title: 'API Reference',
				content: this.generateAPIReference(tool),
				order: 2,
				isRequired: true,
				subsections: this.generateAPISubsections(tool),
			},
			{
				id: 'quick-start',
				title: 'Quick Start',
				content: this.generateQuickStart(tool),
				order: 3,
				isRequired: true,
			},
			{
				id: 'examples',
				title: 'Code Examples',
				content: this.generateExamplesIntro(tool),
				order: 4,
				isRequired: true,
				subsections: this.generateExampleSubsections(tool),
			},
		];

		// Add tool-specific sections
		const toolSpecificSections = this.getToolSpecificSections(tool);

		// Add advanced sections for enhanced tools
		const advancedSections = this.isEnhancedTool(tool)
			? this.generateAdvancedSections(tool as EnhancedTool)
			: [];

		return [...baseSections, ...toolSpecificSections, ...advancedSections];
	}

	// Generate overview section
	private generateOverview(tool: Tool | EnhancedTool): string {
		const features = tool.features.map(f => `- ${f}`).join('\n');
		const tags = tool.tags.map(t => `\`${t}\``).join(', ');

		return `# ${tool.name}

${tool.description}

## Category
${tool.category}

## Difficulty Level
**${tool.difficulty.charAt(0).toUpperCase() + tool.difficulty.slice(1)}**

## Key Features
${features}

## Tags
${tags}

## Processing Type
**${tool.processingType}** - All processing happens ${tool.processingType === 'client-side' ? 'in your browser' : 'on our servers'}

## Security
**${tool.security}** - ${this.getSecurityDescription(tool.security)}

## Quick Access
- **Tool URL**: [\`${tool.href}\`](${tool.href})
- **Direct API**: \`/api/v1/tools/${tool.id}\`
- **Status**: ${tool.status}`;
	}

	// Generate API reference section
	private generateAPIReference(tool: Tool | EnhancedTool): string {
		const apiSpec = this.generateAPISpec(tool);
		return `# API Reference

## Endpoint
\`\`\`http
POST /api/v1/tools/${tool.id}
\`\`\`

## Request Format

### Headers
\`\`\`json
{
  "Content-Type": "application/json",
  "X-API-Version": "v1"
}
\`\`\`

### Body
${apiSpec.requestBody}

## Response Format

### Success Response (200 OK)
\`\`\`json
${apiSpec.successResponse}
\`\`\`

### Error Response
\`\`\`json
${apiSpec.errorResponse}
\`\`\`

## Rate Limiting
- **Requests per minute**: 60
- **Requests per hour**: 1000
- **Concurrent requests**: 5

## Authentication
This tool uses ${tool.security === 'local-only' ? 'no authentication' : 'API key authentication'}.`;
	}

	// Generate API subsections
	private generateAPISubsections(tool: Tool | EnhancedTool): DocumentationSubsection[] {
		return [
			{
				id: 'parameters',
				title: 'Parameters',
				content: this.generateParametersDoc(tool),
				order: 1,
			},
			{
				id: 'response-codes',
				title: 'Response Codes',
				content: this.generateResponseCodesDoc(),
				order: 2,
			},
			{
				id: 'examples',
				title: 'API Usage Examples',
				content: this.generateAPIExamples(tool),
				order: 3,
				codeExamples: this.generateAPICodeExamples(tool),
			},
		];
	}

	// Generate quick start section
	private generateQuickStart(tool: Tool | EnhancedTool): string {
		return `# Quick Start

## 1. Using the Web Interface
1. Navigate to [${tool.name}](${tool.href})
2. Input your data in the provided field
3. Configure options as needed
4. Click the process button
5. Copy or download your results

## 2. Using the API

### JavaScript/Node.js
\`\`\`javascript
const response = await fetch('/api/v1/tools/${tool.id}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // Your input data here
  })
});

const result = await response.json();
console.log(result);
\`\`\`

### Python
\`\`\`python
import requests

response = requests.post('/api/v1/tools/${tool.id}', json={
    # Your input data here
})

result = response.json()
print(result)
\`\`\`

### cURL
\`\`\`bash
curl -X POST /api/v1/tools/${tool.id} \\
  -H "Content-Type: application/json" \\
  -d '{"input": "your data here"}'
\`\`\`

## 3. Common Use Cases
${this.generateUseCases(tool)}`;
	}

	// Generate code examples intro
	private generateExamplesIntro(tool: Tool | EnhancedTool): string {
		return `# Code Examples

This section provides practical examples of using the ${tool.name} tool in various programming languages and scenarios.

## Example Categories
- **Basic Examples**: Simple use cases to get started
- **Advanced Examples**: Complex scenarios and edge cases
- **Integration Examples**: How to integrate with other tools and services
- **Performance Examples**: Optimization techniques and best practices

## Running Examples
All examples are interactive. You can copy and paste the code directly into your development environment or use the tool's web interface to test them.

## Contributing Examples
Have a useful example? [Contribute to our documentation](https://github.com/parsify-dev/parsify.dev)`;
	}

	// Generate example subsections
	private generateExampleSubsections(tool: Tool | EnhancedTool): DocumentationSubsection[] {
		const toolId = tool.id;
		const examples = this.getToolExamples(toolId);

		return examples.map((example, index) => ({
			id: `example-${index + 1}`,
			title: example.title,
			content: example.description,
			order: index + 1,
			codeExamples: [
				{
					id: `${toolId}-${example.category}-${index}`,
					title: example.title,
					description: example.description,
					language: this.getExampleLanguage(example),
					code: this.formatCodeExample(example),
					output: typeof example.expectedOutput === 'string'
						? example.expectedOutput
						: JSON.stringify(example.expectedOutput, null, 2),
					isInteractive: true,
					explanation: this.generateExampleExplanation(example),
					difficulty: example.category as 'basic' | 'intermediate' | 'advanced',
				},
			],
		}));
	}

	// Generate tool-specific sections
	private getToolSpecificSections(tool: Tool | EnhancedTool): DocumentationSection[] {
		const categorySections: Record<string, DocumentationSection[]> = {
			'JSON Processing': [
				{
					id: 'json-features',
					title: 'JSON-Specific Features',
					content: this.generateJSONFeaturesDoc(tool),
					order: 5,
					isRequired: false,
				},
			],
			'Code Execution': [
				{
					id: 'language-support',
					title: 'Language Support',
					content: this.generateLanguageSupportDoc(tool),
					order: 5,
					isRequired: true,
				},
				{
					id: 'security',
					title: 'Security & Sandboxing',
					content: this.generateSecurityDoc(tool),
					order: 6,
					isRequired: true,
				},
			],
			'File Processing': [
				{
					id: 'file-formats',
					title: 'Supported File Formats',
					content: this.generateFileFormatsDoc(tool),
					order: 5,
					isRequired: true,
				},
			],
			'Security & Encryption': [
				{
					id: 'encryption-details',
					title: 'Encryption Details',
					content: this.generateEncryptionDoc(tool),
					order: 5,
					isRequired: true,
				},
			],
		};

		return categorySections[tool.category] || [];
	}

	// Generate advanced sections for enhanced tools
	private generateAdvancedSections(tool: EnhancedTool): DocumentationSection[] {
		return [
			{
				id: 'performance-specs',
				title: 'Performance Specifications',
				content: this.generatePerformanceSpecs(tool.performance),
				order: 10,
				isRequired: true,
			},
			{
				id: 'limitations',
				title: 'Limitations and Constraints',
				content: this.generateLimitationsDoc(tool.limitations),
				order: 11,
				isRequired: true,
			},
			{
				id: 'dependencies',
				title: 'Dependencies & Requirements',
				content: this.generateDependenciesDoc(tool.dependencies),
				order: 12,
				isRequired: false,
			},
		];
	}

	// Helper methods for generating content
	private generateAPISpec(tool: Tool | EnhancedTool) {
		// Generate API spec based on tool type
		return {
			requestBody: `{
  "input": "your input data here",
  "options": {
    // Tool-specific options
  }
}`,
			successResponse: `{
  "success": true,
  "result": {
    // Processed data
  },
  "metadata": {
    "processingTime": 150,
    "inputSize": 1024,
    "outputSize": 2048
  }
}`,
			errorResponse: `{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input format",
    "details": {
      "field": "input",
      "issue": "Expected valid JSON string"
    }
  }
}`,
		};
	}

	private generateParametersDoc(tool: Tool | EnhancedTool): string {
		return `## Required Parameters

### input
- **Type**: String
- **Required**: Yes
- **Description**: The input data to process
- **Example**: \`"{"name": "John"}"\`

## Optional Parameters

### options
- **Type**: Object
- **Required**: No
- **Description**: Tool-specific configuration options
- **Properties**: ${this.generateToolOptions(tool)}

### format
- **Type**: String
- **Required**: No
- **Description**: Output format preference
- **Options**: \`"json"\`, \`"text"\`, \`"binary"\`
- **Default**: \`"json"\``;
	}

	private generateToolOptions(tool: Tool | EnhancedTool): string {
		// Generate tool-specific options based on tool type
		const options: Record<string, Record<string, any>> = {
			'json-formatter': {
				indentation: { type: 'number', default: 2, description: 'Number of spaces for indentation' },
				sortKeys: { type: 'boolean', default: false, description: 'Alphabetically sort object keys' },
			},
			'code-executor': {
				language: { type: 'string', default: 'javascript', description: 'Programming language' },
				timeout: { type: 'number', default: 5000, description: 'Execution timeout in milliseconds' },
			},
			'hash-generator': {
				algorithm: { type: 'string', default: 'sha256', description: 'Hash algorithm to use' },
				inputFormat: { type: 'string', default: 'text', description: 'Input format (text or hex)' },
			},
		};

		const toolOptions = options[tool.id];
		if (!toolOptions) {
			return 'No additional options available for this tool.';
		}

		return Object.entries(toolOptions)
			.map(([key, spec]) => `- **${key}**: ${spec.description} (Type: ${spec.type}, Default: ${spec.default})`)
			.join('\n');
	}

	private generateResponseCodesDoc(): string {
		return `## Response Codes

### Success Codes
- **200 OK**: Request processed successfully
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing

### Error Codes
- **400 Bad Request**: Invalid input data or parameters
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error occurred
- **503 Service Unavailable**: Service temporarily unavailable

## Error Response Format
All error responses include a structured error object with:
- \`code\`: Machine-readable error code
- \`message\`: Human-readable error description
- \`details\`: Additional error context when available`;
	}

	private generateAPIExamples(tool: Tool | EnhancedTool): string {
		return `## API Usage Examples

### Basic Request
\`\`\`javascript
const response = await fetch('/api/v1/tools/${tool.id}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: 'example input',
    options: {
      // Tool-specific options
    }
  })
});
\`\`\`

### With Custom Options
\`\`\`javascript
const response = await fetch('/api/v1/tools/${tool.id}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: 'example input',
    options: {
      // Custom configuration
      customOption: true
    },
    format: 'json'
  })
});
\`\`\`

### Error Handling
\`\`\`javascript
try {
  const response = await fetch('/api/v1/tools/${tool.id}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: 'example input'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error.message);
    return;
  }

  const result = await response.json();
  console.log('Success:', result.result);
} catch (error) {
  console.error('Network error:', error);
}
\`\`\``;
	}

	private generateAPICodeExamples(tool: Tool | EnhancedTool): CodeExample[] {
		return [
			{
				id: `${tool.id}-js-fetch`,
				title: 'JavaScript (Fetch API)',
				description: `Using the ${tool.name} API with native JavaScript fetch`,
				language: 'javascript',
				code: `async function processWith${tool.name.replace(/\s+/g, '')}(input, options = {}) {
  try {
    const response = await fetch('/api/v1/tools/${tool.id}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
      },
      body: JSON.stringify({ input, options })
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// Example usage
const result = await processWith${tool.name.replace(/\s+/g, '')}('your input here');
console.log(result.result);`,
				isInteractive: true,
				explanation: 'This example shows how to call the API using the native fetch API with proper error handling.',
				difficulty: 'basic',
			},
			{
				id: `${tool.id}-python-requests`,
				title: 'Python (Requests)',
				description: `Using the ${tool.name} API with Python requests library`,
				language: 'python',
				code: `import requests
import json

def process_with_${tool.id.replace('-', '_')}(input_data, options=None):
    """Process data using ${tool.name} API"""
    url = '/api/v1/tools/${tool.id}'

    payload = {
        'input': input_data,
        'options': options or {}
    }

    headers = {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()
        return result['result']

    except requests.exceptions.RequestException as error:
        print(f"API Error: {error}")
        raise

# Example usage
result = process_with_${tool.id.replace('-', '_')}('your input here')
print(result)`,
				isInteractive: true,
				explanation: 'Python implementation using the popular requests library with comprehensive error handling.',
				difficulty: 'basic',
			},
		];
	}

	private generateUseCases(tool: Tool | EnhancedTool): string {
		const useCases: Record<string, string[]> = {
			'json-formatter': [
				'Format API responses for better readability',
				'Clean up configuration files',
				'Validate JSON syntax before processing',
				'Prepare data for documentation or display',
			],
			'code-executor': [
				'Test code snippets quickly',
				'Debug algorithms and functions',
				'Prototype solutions without setup',
				'Learn new programming languages',
			],
			'hash-generator': [
				'Verify file integrity',
				'Generate secure password hashes',
				'Create checksums for data validation',
				'Generate unique identifiers',
			],
		};

		const toolUseCases = useCases[tool.id] || [
			'Process data efficiently',
			'Automate repetitive tasks',
			'Integrate into workflows',
			'Validate and transform data',
		];

		return toolUseCases.map(useCase => `- ${useCase}`).join('\n');
	}

	// Initialize code templates
	private initializeCodeTemplates() {
		this.codeTemplates.set('json-formatter', {
			name: 'JSON Formatter Template',
			description: 'Template for JSON formatting API calls',
			languages: ['javascript', 'python', 'curl'],
		});
		// Add more templates as needed
	}

	// Initialize tool examples
	private initializeToolExamples() {
		// Examples would be populated from actual tool data
		// This is a placeholder for the structure
	}

	// Utility methods
	private isEnhancedTool(tool: Tool | EnhancedTool): tool is EnhancedTool {
		return 'version' in tool && 'performance' in tool;
	}

	private getSecurityDescription(security: string): string {
		const descriptions: Record<string, string> = {
			'local-only': 'All processing happens in your browser. No data is sent to external servers.',
			'secure-sandbox': 'Code execution happens in a secure sandboxed environment with restricted access.',
			'network-required': 'This tool requires network access to function properly.',
		};
		return descriptions[security] || 'Standard security measures apply.';
	}

	private calculateReadTime(tool: Tool | EnhancedTool): number {
		// Estimate read time based on tool complexity
		const baseTime = 3; // Base 3 minutes
		const complexityMultiplier = {
			beginner: 1,
			intermediate: 1.5,
			advanced: 2,
		};
		return Math.round(baseTime * complexityMultiplier[tool.difficulty]);
	}

	private getToolExamples(toolId: string): ToolExample[] {
		// Return examples from the tool examples map
		return this.toolExamples.get(toolId) || [];
	}

	private generateTutorialReferences(toolId: string): TutorialReference[] {
		// Generate tutorial references based on tool
		return [
			{
				id: `${toolId}-getting-started`,
				title: `Getting Started with ${toolId}`,
				description: 'Learn the basics of using this tool',
				duration: 5,
				difficulty: 'beginner',
				tags: ['basics', 'tutorial'],
				tools: [toolId],
				steps: [],
			},
		];
	}

	private generateBestPractices(toolId: string): BestPractice[] {
		// Generate best practices based on tool type
		return [
			{
				id: `${toolId}-input-validation`,
				title: 'Validate Input Data',
				description: 'Always validate your input data before processing',
				rationale: 'Proper validation prevents errors and ensures reliable results',
				category: 'maintainability',
				applicableTo: [toolId],
			},
		];
	}

	private generateFAQ(toolId: string): FAQItem[] {
		// Generate common FAQ items
		return [
			{
				id: `${toolId}-limits`,
				question: 'What are the limits for this tool?',
				answer: 'Each tool has specific limits for input size, processing time, and frequency. Check the performance specifications section for detailed information.',
				category: 'limits',
				tags: ['limits', 'performance'],
				helpfulCount: 25,
				notHelpfulCount: 2,
			},
		];
	}

	private getRelatedTools(toolId: string): string[] {
		// Return related tools based on category or functionality
		const relatedMap: Record<string, string[]> = {
			'json-formatter': ['json-validator', 'json-converter'],
			'code-executor': ['code-formatter', 'regex-tester'],
			// Add more mappings
		};
		return relatedMap[toolId] || [];
	}

	private getExampleLanguage(example: ToolExample): SupportedLanguage {
		// Determine language based on example category or input
		return 'javascript'; // Default, can be made smarter
	}

	private formatCodeExample(example: ToolExample): string {
		// Format the input for code display
		return typeof example.input === 'string'
			? example.input
			: JSON.stringify(example.input, null, 2);
	}

	private generateExampleExplanation(example: ToolExample): string {
		return `This example demonstrates ${example.description}. The expected output is ${typeof example.expectedOutput === 'string' ? example.expectedOutput : 'a formatted result'}.`;
	}

	// Performance and limitations docs for enhanced tools
	private generatePerformanceSpecs(performance: PerformanceSpec): string {
		return `# Performance Specifications

## Input Limits
- **Maximum Input Size**: ${this.formatBytes(performance.maxInputSize)}
- **Expected Processing Time**: ${performance.expectedTime}ms
- **Memory Requirement**: ${this.formatBytes(performance.memoryRequirement)}
- **Concurrency Level**: ${performance.concurrencyLevel} concurrent operations

## Performance Metrics
The tool is optimized for the following performance characteristics:
- **Latency**: Target processing time under normal conditions
- **Throughput**: Maximum number of operations per minute
- **Memory Efficiency**: Optimal memory usage patterns
- **Scalability**: Performance under increased load

## Optimization Tips
- For best performance, ensure input data is properly formatted
- Consider batch processing for multiple items
- Monitor memory usage with large datasets
- Use appropriate tool settings for your use case`;
	}

	private generateLimitationsDoc(limitations: Limitations): string {
		const sections: string[] = [];

		if (limitations.fileSizeLimit) {
			sections.push(`- **File Size Limit**: ${this.formatBytes(limitations.fileSizeLimit)}`);
		}

		if (limitations.processingTimeLimit) {
			sections.push(`- **Processing Time Limit**: ${limitations.processingTimeLimit} seconds`);
		}

		if (limitations.supportedFormats?.length) {
			sections.push(`- **Supported Formats**: ${limitations.supportedFormats.join(', ')}`);
		}

		if (limitations.browserRequirements?.length) {
			sections.push(`- **Browser Requirements**: ${limitations.browserRequirements.join(', ')}`);
		}

		return `# Limitations and Constraints

## Current Limitations
${sections.length ? sections.join('\n') : 'No specific limitations documented.'}

## Recommended Usage Guidelines
- Stay within the documented limits for optimal performance
- Use appropriate input formats to avoid processing errors
- Consider browser compatibility for client-side tools
- Monitor resource usage with large datasets

## Future Improvements
We are continuously working to improve performance and expand capabilities. Check the changelog for updates.`;
	}

	private generateDependenciesDoc(dependencies: string[]): string {
		if (!dependencies.length) {
			return '# Dependencies\n\nThis tool has no external dependencies and runs completely standalone.';
		}

		return `# Dependencies and Requirements

## External Dependencies
${dependencies.map(dep => `- \`${dep}\``).join('\n')}

## Runtime Requirements
- Modern web browser with JavaScript ES6+ support
- Stable internet connection (if applicable)
- Sufficient memory for processing large datasets

## Integration Requirements
- No additional setup required
- Compatible with standard web APIs
- Works with popular development frameworks`;
	}

	// Category-specific documentation generators
	private generateJSONFeaturesDoc(tool: Tool | EnhancedTool): string {
		return `# JSON-Specific Features

## JSON Schema Support
- Validation against JSON Schema drafts
- Custom schema definition
- Real-time schema validation
- Error highlighting and suggestions

## Advanced JSON Features
- Comments and trailing commas support (JSON5)
- Custom formatting options
- Key sorting and filtering
- Nested object manipulation

## Performance Features
- Streaming JSON parser for large files
- Memory-efficient processing
- Incremental parsing and formatting`;
	}

	private generateLanguageSupportDoc(tool: Tool | EnhancedTool): string {
		return `# Language Support

## Supported Languages
- **JavaScript**: Full ES2020+ support
- **Python**: 3.8+ with standard library
- **TypeScript**: Full TypeScript support
- **Java**: Limited support (basic features)
- **C++**: Experimental support
- **Go**: Basic language features

## Language-Specific Features
### JavaScript/TypeScript
- Access to browser APIs (limited)
- ES6+ syntax support
- Async/await patterns
- Module imports (restricted)

### Python
- Standard library available
- No external package support
- Basic data structures
- String and number operations

## Security Restrictions
All code execution is sandboxed with the following restrictions:
- No network access
- No file system access
- Limited memory usage
- Execution time limits`;
	}

	private generateSecurityDoc(tool: Tool | EnhancedTool): string {
		return `# Security & Sandboxing

## Execution Environment
Code execution occurs in a secure WebAssembly (WASM) sandbox with comprehensive security measures.

## Security Features
- **Memory Isolation**: Complete memory separation from host
- **Network Restrictions**: No outbound network access
- **Resource Limits**: CPU and memory usage caps
- **Timeout Protection**: Automatic termination of long-running code
- **Access Control**: No access to system resources or files

## Data Privacy
- All processing happens in your browser
- No data transmitted to external servers
- Temporary data cleared on session end
- Secure by default architecture

## Best Practices
- Never execute untrusted code
- Validate all inputs before processing
- Use appropriate error handling
- Follow principle of least privilege`;
	}

	private generateFileFormatsDoc(tool: Tool | EnhancedTool): string {
		return `# Supported File Formats

## Input Formats
- **JSON**: Standard JSON format
- **XML**: XML documents with proper validation
- **CSV**: Comma-separated values with configurable delimiters
- **Plain Text**: Various text encodings supported
- **Binary**: Base64 encoded binary data

## Output Formats
- **JSON**: Structured data output
- **XML**: XML document generation
- **CSV**: Tabular data export
- **Plain Text**: Human-readable format
- **Binary**: Processed binary data

## Format Conversion
- Automatic format detection
- Custom format mappings
- Batch format conversion
- Preserved metadata when possible`;
	}

	private generateEncryptionDoc(tool: Tool | EnhancedTool): string {
		return `# Encryption Details

## Supported Algorithms
- **AES-256**: Advanced Encryption Standard
- **SHA-256**: Secure Hash Algorithm
- **MD5**: Message Digest (legacy support)
- **Base64**: Encoding for data transmission

## Security Features
- Client-side encryption only
- No server-side key storage
- Secure random number generation
- Industry-standard implementations

## Key Management
- Keys are generated client-side
- No key persistence or storage
- Session-based encryption only
- Secure key derivation functions`;
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

interface CodeTemplate {
	name: string;
	description: string;
	languages: string[];
}

export const apiDocumentationGenerator = APIDocumentationGenerator.getInstance();
