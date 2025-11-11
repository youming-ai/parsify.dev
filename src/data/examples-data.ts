import type {
	ToolExample,
	Tutorial,
	WorkflowExample,
	IntegrationExample,
	CodeExample,
	ExampleCategory
} from '@/types/tools';

// Comprehensive examples library for all 58 tools
export const examplesLibrary = {
	// JSON Processing Examples
	'json-formatter': [
		{
			id: 'json-formatter-basic',
			title: 'Basic JSON Formatting',
			description: 'Format a simple JSON object with proper indentation',
			input: '{"name":"John","age":30,"city":"New York"}',
			expectedOutput: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
			category: 'basic' as const,
			tags: ['formatting', 'indentation', 'basic'],
			steps: ['Paste your JSON data', 'Choose indentation preference', 'Click format'],
			interactive: true,
			useCase: 'Cleaning up API responses or configuration files',
			benefits: ['Improved readability', 'Better code organization', 'Easier debugging'],
		},
		{
			id: 'json-formatter-nested',
			title: 'Nested Object Formatting',
			description: 'Format complex nested JSON structures with arrays and objects',
			input: '{"user":{"id":1,"name":"John","roles":["admin","user"],"address":{"street":"123 Main St","city":"New York"}}}',
			expectedOutput: '{\n  "user": {\n    "id": 1,\n    "name": "John",\n    "roles": ["admin", "user"],\n    "address": {\n      "street": "123 Main St",\n      "city": "New York"\n    }\n  }\n}',
			category: 'intermediate' as const,
			tags: ['nested', 'arrays', 'complex'],
			interactive: true,
			useCase: 'Formatting API responses with nested data structures',
			benefits: ['Clear hierarchy visualization', 'Easier navigation', 'Better understanding'],
		},
		{
			id: 'json-formatter-sort-keys',
			title: 'Sorted Key Formatting',
			description: 'Format JSON with alphabetically sorted keys',
			input: '{"z":1,"a":2,"m":3}',
			expectedOutput: '{\n  "a": 2,\n  "m": 3,\n  "z": 1\n}',
			category: 'basic' as const,
			tags: ['sorting', 'alphabetical', 'organization'],
			interactive: true,
			useCase: 'Organizing configuration files for better readability',
			benefits: ['Consistent ordering', 'Easier key finding', 'Better comparison'],
		}
	] as ToolExample[],

	'json-validator': [
		{
			id: 'json-validator-syntax',
			title: 'Syntax Validation',
			description: 'Check JSON syntax and find common errors',
			input: '{"name": "John", "age": 30, "city": "New York}',
			expectedOutput: 'Error: Missing closing brace at position 42',
			category: 'basic' as const,
			tags: ['syntax', 'error-detection', 'validation'],
			steps: ['Paste JSON content', 'Click validate', 'Review error messages'],
			interactive: true,
			liveExecution: true,
			useCase: 'Validating API responses before processing',
			benefits: ['Error prevention', 'Better debugging', 'Data integrity'],
		},
		{
			id: 'json-validator-complex',
			title: 'Complex Structure Validation',
			description: 'Validate complex JSON with arrays and nested objects',
			input: '{"users":[{"id":1,"name":"John","emails":["john@example.com"]}],"total":1}',
			expectedOutput: 'Valid JSON structure',
			category: 'intermediate' as const,
			tags: ['arrays', 'nested', 'complex-validation'],
			interactive: true,
			useCase: 'Validating complex API responses',
			benefits: ['Structure verification', 'Type checking', 'Data consistency'],
		}
	] as ToolExample[],

	// Code Execution Examples
	'code-executor': [
		{
			id: 'code-executor-js-basic',
			title: 'JavaScript Hello World',
			description: 'Execute basic JavaScript code',
			input: 'console.log("Hello, World!");\nconsole.log(Math.sqrt(16));',
			expectedOutput: 'Hello, World!\n4',
			category: 'basic' as const,
			tags: ['javascript', 'hello-world', 'console'],
			codeExamples: [
				{
					id: 'js-hello',
					language: 'javascript',
					code: 'console.log("Hello, World!");',
					explanation: 'Simple console output in JavaScript',
					output: 'Hello, World!',
					runnable: true
				}
			],
			interactive: true,
			liveExecution: true,
			useCase: 'Quick JavaScript testing and prototyping',
			benefits: ['Instant results', 'No setup required', 'Safe sandbox'],
		},
		{
			id: 'code-executor-python-calculator',
			title: 'Python Calculator',
			description: 'Create a simple calculator in Python',
			input: 'def add(a, b):\n    return a + b\n\ndef multiply(a, b):\n    return a * b\n\nprint(add(5, 3))\nprint(multiply(4, 7))',
			expectedOutput: '8\n28',
			category: 'intermediate' as const,
			tags: ['python', 'functions', 'math'],
			codeExamples: [
				{
					id: 'python-calc',
					language: 'python',
					code: 'def add(a, b):\n    return a + b\n\nresult = add(10, 20)\nprint(f"Result: {result}")',
					explanation: 'Python function with formatted output',
					output: 'Result: 30',
					runnable: true
				}
			],
			interactive: true,
			liveExecution: true,
			useCase: 'Learning Python programming concepts',
			benefits: ['Interactive learning', 'Immediate feedback', 'Safe environment'],
		}
	] as ToolExample[],

	// Security Examples
	'hash-generator': [
		{
			id: 'hash-sha256-text',
			title: 'SHA-256 Text Hashing',
			description: 'Generate SHA-256 hash for text input',
			input: 'Hello World',
			expectedOutput: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
			category: 'basic' as const,
			tags: ['sha256', 'text', 'checksum'],
			interactive: true,
			liveExecution: true,
			useCase: 'Generating secure checksums for data verification',
			benefits: ['Data integrity', 'Security', 'Verification'],
		},
		{
			id: 'hash-md5-file',
			title: 'MD5 File Hashing',
			description: 'Generate MD5 hash for file verification',
			input: 'file.pdf',
			expectedOutput: 'd41d8cd98f00b204e9800998ecf8427e',
			category: 'intermediate' as const,
			tags: ['md5', 'file', 'verification'],
			interactive: true,
			useCase: 'Verifying file integrity after download',
			benefits: ['File verification', 'Corruption detection', 'Security'],
		}
	] as ToolExample[],
};

// Comprehensive tutorials covering common workflows
export const tutorials: Tutorial[] = [
	{
		id: 'getting-started-json',
		title: 'Getting Started with JSON Processing',
		description: 'Learn the fundamentals of JSON processing with our suite of tools',
		category: 'Getting Started',
		difficulty: 'beginner',
		estimatedTime: 15,
		prerequisites: ['Basic understanding of data structures'],
		tools: ['json-formatter', 'json-validator', 'json-converter'],
		tags: ['json', 'beginner', 'fundamentals'],
		publishedAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-15'),
		steps: [
			{
				id: 'step1',
				title: 'Understanding JSON Basics',
				description: 'Learn what JSON is and why it\'s important',
				content: 'JSON (JavaScript Object Notation) is a lightweight data interchange format that is easy for humans to read and write and easy for machines to parse and generate.',
				tips: [
					'JSON uses key-value pairs',
					'Strings must be in double quotes',
					'JSON supports strings, numbers, booleans, arrays, and objects'
				],
				completionCriteria: 'Understand JSON structure and syntax'
			},
			{
				id: 'step2',
				title: 'Formatting JSON for Readability',
				description: 'Use the JSON formatter to make your data readable',
				content: 'Well-formatted JSON is easier to read and debug. The formatter adds proper indentation and spacing.',
				toolId: 'json-formatter',
				toolConfig: { indentation: 2, sortKeys: false },
				expectedOutput: 'Properly indented JSON with clear structure',
				tips: [
					'Choose 2 or 4 spaces for indentation',
					'Consider sorting keys for consistency',
					'Always validate after formatting'
				],
				completionCriteria: 'Successfully format JSON data'
			},
			{
				id: 'step3',
				title: 'Validating JSON Structure',
				description: 'Ensure your JSON is valid before using it',
				content: 'JSON validation checks for syntax errors and structural issues that could cause problems in your applications.',
				toolId: 'json-validator',
				expectedOutput: 'Valid JSON confirmation or error details',
				warnings: [
					'Always validate JSON from external sources',
					'Check for trailing commas',
					'Ensure all strings are properly quoted'
				],
				completionCriteria: 'Validate JSON without errors'
			},
			{
				id: 'step4',
				title: 'Converting JSON to Other Formats',
				description: 'Convert JSON to CSV, XML, or other formats',
				content: 'Sometimes you need to convert JSON to other formats for different applications or data analysis.',
				toolId: 'json-converter',
				toolConfig: { targetFormat: 'csv' },
				expectedOutput: 'Converted data in the target format',
				tips: [
					'Choose the right format for your use case',
					'Preview the conversion before downloading',
					'Check for data type preservation'
				],
				completionCriteria: 'Successfully convert JSON to another format'
			}
		]
	},
	{
		id: 'api-testing-workflow',
		title: 'API Testing and Response Processing',
		description: 'Learn how to test APIs and process responses effectively',
		category: 'API Integration',
		difficulty: 'intermediate',
		estimatedTime: 25,
		prerequisites: ['Basic understanding of HTTP', 'JSON knowledge'],
		tools: ['http-client', 'json-formatter', 'json-validator', 'json-path-queries'],
		tags: ['api', 'testing', 'http', 'json'],
		publishedAt: new Date('2024-01-10'),
		updatedAt: new Date('2024-01-20'),
		steps: [
			{
				id: 'step1',
				title: 'Setting Up HTTP Requests',
				description: 'Configure and send HTTP requests to test APIs',
				content: 'The HTTP client allows you to test REST APIs with custom headers, methods, and body content.',
				toolId: 'http-client',
				toolConfig: {
					method: 'GET',
					url: 'https://jsonplaceholder.typicode.com/users/1',
					headers: { 'Accept': 'application/json' }
				},
				expectedOutput: 'JSON response with user data',
				tips: [
					'Set appropriate headers for content type',
					'Use proper HTTP methods (GET, POST, PUT, DELETE)',
					'Check response status codes'
				],
				completionCriteria: 'Successfully receive API response'
			},
			{
				id: 'step2',
				title: 'Validating API Responses',
				description: 'Ensure API responses are valid JSON',
				content: 'API responses should always be validated to ensure they contain properly formatted JSON.',
				toolId: 'json-validator',
				expectedOutput: 'Validation confirmation for API response',
				warnings: [
					'APIs may return error responses',
					'Check response content type',
					'Handle empty responses gracefully'
				],
				completionCriteria: 'Validate API response as JSON'
			},
			{
				id: 'step3',
				title: 'Formatting Response Data',
				description: 'Make API responses readable and organized',
				content: 'Format the JSON response for better readability and easier data extraction.',
				toolId: 'json-formatter',
				toolConfig: { indentation: 2, sortKeys: true },
				expectedOutput: 'Well-formatted JSON response',
				tips: [
					'Sort keys for consistent ordering',
					'Use appropriate indentation',
					'Consider your team\'s preferences'
				],
				completionCriteria: 'Format API response for readability'
			},
			{
				id: 'step4',
				title: 'Extracting Data with JSONPath',
				description: 'Use JSONPath to extract specific data from responses',
				content: 'JSONPath allows you to query and extract specific data points from complex JSON responses.',
				toolId: 'json-path-queries',
				toolConfig: { query: '$.users[*].name' },
				expectedOutput: 'Array of user names extracted from response',
				tips: [
					'Learn JSONPath syntax basics',
					'Test queries on sample data',
					'Save commonly used queries'
				],
				completionCriteria: 'Extract specific data using JSONPath'
			}
		]
	},
	{
		id: 'web-performance-optimization',
		title: 'Web Asset Optimization',
		description: 'Optimize images, code, and assets for better web performance',
		category: 'Performance Optimization',
		difficulty: 'intermediate',
		estimatedTime: 30,
		prerequisites: ['Basic web development knowledge'],
		tools: ['image-optimizer', 'code-minifier', 'asset-compressor', 'bundle-analyzer'],
		tags: ['performance', 'optimization', 'web', 'assets'],
		publishedAt: new Date('2024-01-15'),
		updatedAt: new Date('2024-01-25'),
		steps: [
			{
				id: 'step1',
				title: 'Image Optimization',
				description: 'Compress and convert images for web use',
				content: 'Modern image formats like WebP and AVIF can significantly reduce file sizes while maintaining quality.',
				toolId: 'image-optimizer',
				toolConfig: {
					outputFormat: 'webp',
					quality: 80,
					responsive: true
				},
				expectedOutput: 'Optimized images in WebP format',
				tips: [
					'Test different quality settings',
					'Generate multiple sizes for responsive design',
					'Consider lazy loading for images'
				],
				completionCriteria: 'Successfully optimize images for web'
			},
			{
				id: 'step2',
				title: 'Code Minification',
				description: 'Minify JavaScript and CSS for faster loading',
				content: 'Code minification removes unnecessary characters from source code without changing functionality.',
				toolId: 'code-minifier',
				toolConfig: {
					removeComments: true,
					removeWhitespace: true,
					mangleVariables: true
				},
				expectedOutput: 'Minified JavaScript/CSS files',
				tips: [
					'Keep source maps for debugging',
					'Test minified code thoroughly',
					'Consider build automation'
				],
				completionCriteria: 'Minify code files successfully'
			},
			{
				id: 'step3',
				title: 'Asset Compression',
				description: 'Compress text-based assets with gzip/brotli',
				content: 'Text compression can dramatically reduce file sizes and improve loading times.',
				toolId: 'asset-compressor',
				toolConfig: {
					compressionType: 'brotli',
					level: 6
				},
				expectedOutput: 'Compressed assets ready for deployment',
				tips: [
					'Use Brotli for better compression',
					'Serve compressed files when possible',
					'Monitor compression ratios'
				],
				completionCriteria: 'Compress assets with optimal settings'
			},
			{
				id: 'step4',
				title: 'Bundle Analysis',
				description: 'Analyze bundle sizes and identify optimization opportunities',
				content: 'Bundle analysis helps identify large dependencies and optimization opportunities.',
				toolId: 'bundle-analyzer',
				expectedOutput: 'Bundle size analysis and recommendations',
				tips: [
					'Look for duplicate dependencies',
					'Consider code splitting',
					'Remove unused libraries'
				],
				completionCriteria: 'Analyze bundle and find optimization opportunities'
			}
		]
	}
];

// Workflow examples showing tool combinations
export const workflows: WorkflowExample[] = [
	{
		id: 'api-data-processing',
		title: 'API Data Processing Workflow',
		description: 'Process API data from request to analysis',
		category: 'Data Processing',
		difficulty: 'intermediate',
		tools: [
			{
				id: 'step1',
				toolId: 'http-client',
				toolName: 'HTTP Client',
				description: 'Fetch data from API endpoint',
				input: { url: 'https://api.example.com/data', method: 'GET' },
				expectedOutput: 'Raw JSON response from API',
				notes: 'Ensure proper authentication headers are set'
			},
			{
				id: 'step2',
				toolId: 'json-validator',
				toolName: 'JSON Validator',
				description: 'Validate API response format',
				input: 'Raw API response data',
				expectedOutput: 'Validated JSON structure',
				notes: 'Check for required fields and data types'
			},
			{
				id: 'step3',
				toolId: 'json-formatter',
				toolName: 'JSON Formatter',
				description: 'Format data for readability',
				input: 'Valid JSON data',
				expectedOutput: 'Well-formatted JSON',
				notes: 'Sort keys for consistency'
			},
			{
				id: 'step4',
				toolId: 'csv-processor',
				toolName: 'CSV Processor',
				description: 'Convert to CSV for analysis',
				input: 'Formatted JSON data',
				expectedOutput: 'CSV file ready for analysis',
				notes: 'Map JSON fields to CSV columns'
			}
		],
		tags: ['api', 'data-processing', 'validation', 'conversion'],
		estimatedTime: 10,
		steps: [], // This will be populated by the tools array
		useCases: [
			'Data migration projects',
			'API integration testing',
			'Data analysis workflows',
			'Report generation'
		]
	},
	{
		id: 'file-security-audit',
		title: 'File Security Audit Workflow',
		description: 'Comprehensive security analysis of files and data',
		category: 'Security Audit',
		difficulty: 'advanced',
		tools: [
			{
				id: 'step1',
				toolId: 'hash-generator',
				toolName: 'Hash Generator',
				description: 'Generate checksums for integrity verification',
				input: 'Files to be audited',
				expectedOutput: 'SHA-256 and MD5 hashes',
				notes: 'Store hashes securely for future verification'
			},
			{
				id: 'step2',
				toolId: 'file-encryptor',
				toolName: 'File Encryptor',
				description: 'Encrypt sensitive files if needed',
				input: 'Sensitive files and encryption key',
				expectedOutput: 'Encrypted files',
				notes: 'Use strong passwords and store them securely'
			},
			{
				id: 'step3',
				toolId: 'json-validator',
				toolName: 'JSON Validator',
				description: 'Validate configuration files',
				input: 'JSON configuration files',
				expectedOutput: 'Validation results',
				notes: 'Check for potential security misconfigurations'
			}
		],
		tags: ['security', 'audit', 'encryption', 'validation'],
		estimatedTime: 15,
		steps: [],
		useCases: [
			'Security compliance audits',
			'File integrity verification',
			'Data protection workflows',
			'Configuration security reviews'
		]
	}
];

// Integration examples showing tool combinations
export const integrations: IntegrationExample[] = [
	{
		id: 'json-api-integration',
		title: 'JSON API Response Processing',
		description: 'Complete workflow for processing API responses',
		tools: ['http-client', 'json-validator', 'json-formatter', 'json-path-queries'],
		scenario: 'Processing user data from a REST API endpoint',
		steps: [
			{
				id: 'step1',
				toolId: 'http-client',
				description: 'Fetch user data from API',
				input: { url: 'https://api.example.com/users', method: 'GET' },
				output: { status: 200, data: '[{"id":1,"name":"John","email":"john@example.com"}]' },
				explanation: 'HTTP request to fetch user data from REST API'
			},
			{
				id: 'step2',
				toolId: 'json-validator',
				description: 'Validate response format',
				input: '[{"id":1,"name":"John","email":"john@example.com"}]',
				output: { valid: true, errors: [] },
				explanation: 'Ensures response is valid JSON format'
			},
			{
				id: 'step3',
				toolId: 'json-formatter',
				description: 'Format for readability',
				input: '[{"id":1,"name":"John","email":"john@example.com"}]',
				output: '[\n  {\n    "id": 1,\n    "name": "John",\n    "email": "john@example.com"\n  }\n]',
				explanation: 'Makes data easier to read and debug'
			},
			{
				id: 'step4',
				toolId: 'json-path-queries',
				description: 'Extract email addresses',
				input: { json: '[{"id":1,"name":"John","email":"john@example.com"}]', query: '$[*].email' },
				output: ['john@example.com'],
				explanation: 'Extracts specific data fields using JSONPath'
			}
		],
		benefits: [
			'Data validation ensures reliability',
			'Consistent formatting improves readability',
			'Efficient data extraction for processing'
		],
		tags: ['api', 'json', 'data-processing', 'validation'],
		complexity: 'simple',
		codeExamples: [
			{
				id: 'api-response-handler',
				language: 'javascript',
				code: 'async function processApiResponse() {\n  const response = await fetch(\'/api/users\');\n  const data = await response.json();\n  \n  // Validate and format\n  const isValid = validateJson(data);\n  const formatted = formatJson(data);\n  const emails = extractEmails(formatted);\n  \n  return { users: formatted, emails };\n}',
				explanation: 'Complete API response processing workflow',
				runnable: true
			}
		]
	},
	{
		id: 'development-workflow',
		title: 'Development Workflow Optimization',
		description: 'Streamline development tasks with tool integration',
		tools: ['code-formatter', 'code-minifier', 'hash-generator', 'json-validator'],
		scenario: 'Prepare code and configuration files for production deployment',
		steps: [
			{
				id: 'step1',
				toolId: 'code-formatter',
				description: 'Format source code for consistency',
				input: 'Unformatted JavaScript code',
				output: 'Properly formatted code with consistent style',
				explanation: 'Ensures code readability and team consistency'
			},
			{
				id: 'step2',
				toolId: 'code-minifier',
				description: 'Minify code for production',
				input: 'Formatted source code',
				output: 'Minified production code',
				explanation: 'Reduces file size for faster loading'
			},
			{
				id: 'step3',
				toolId: 'hash-generator',
				description: 'Generate checksums for integrity',
				input: 'Production files',
				output: 'SHA-256 hashes for all files',
				explanation: 'Enables integrity verification in production'
			},
			{
				id: 'step4',
				toolId: 'json-validator',
				description: 'Validate configuration files',
				input: 'JSON configuration files',
				output: 'Validation results',
				explanation: 'Ensures production configurations are valid'
			}
		],
		benefits: [
			'Consistent code formatting across team',
			'Optimized production assets',
			'Deployment integrity verification',
			'Configuration validation prevents errors'
		],
		tags: ['development', 'production', 'optimization', 'deployment'],
		complexity: 'moderate'
	}
];

// Categories for organizing examples
export const exampleCategories: ExampleCategory[] = [
	{
		id: 'getting-started',
		name: 'Getting Started',
		description: 'Basic tutorials and examples for beginners',
		icon: 'rocket_launch',
		color: 'blue',
		exampleCount: 15,
		tutorialCount: 3,
		workflowCount: 2
	},
	{
		id: 'json-processing',
		name: 'JSON Processing',
		description: 'JSON formatting, validation, and conversion examples',
		icon: 'data_object',
		color: 'green',
		exampleCount: 24,
		tutorialCount: 4,
		workflowCount: 5
	},
	{
		id: 'code-development',
		name: 'Code Development',
		description: 'Code formatting, execution, and optimization',
		icon: 'code',
		color: 'purple',
		exampleCount: 18,
		tutorialCount: 3,
		workflowCount: 4
	},
	{
		id: 'security-tools',
		name: 'Security & Privacy',
		description: 'Hashing, encryption, and security validation',
		icon: 'security',
		color: 'red',
		exampleCount: 12,
		tutorialCount: 2,
		workflowCount: 3
	},
	{
		id: 'api-integration',
		name: 'API Integration',
		description: 'HTTP client and API testing workflows',
		icon: 'api',
		color: 'orange',
		exampleCount: 16,
		tutorialCount: 3,
		workflowCount: 4
	},
	{
		id: 'performance-optimization',
		name: 'Performance',
		description: 'Asset optimization and bundle analysis',
		icon: 'speed',
		color: 'yellow',
		exampleCount: 10,
		tutorialCount: 2,
		workflowCount: 2
	}
];

// Helper functions for accessing examples
export const getExamplesForTool = (toolId: string): ToolExample[] => {
	return examplesLibrary[toolId as keyof typeof examplesLibrary] || [];
};

export const getTutorialsByCategory = (category: string): Tutorial[] => {
	return tutorials.filter(tutorial => tutorial.category === category);
};

export const getWorkflowsByCategory = (category: string): WorkflowExample[] => {
	return workflows.filter(workflow => workflow.category === category);
};

export const getIntegrationsByComplexity = (complexity: string): IntegrationExample[] => {
	return integrations.filter(integration => integration.complexity === complexity);
};

export const searchExamples = (query: string): any[] => {
	const results = [];
	const lowercaseQuery = query.toLowerCase();

	// Search tool examples
	Object.entries(examplesLibrary).forEach(([toolId, examples]) => {
		examples.forEach(example => {
			if (
				example.title.toLowerCase().includes(lowercaseQuery) ||
				example.description.toLowerCase().includes(lowercaseQuery) ||
				example.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
			) {
				results.push({ type: 'example', toolId, ...example });
			}
		});
	});

	// Search tutorials
	tutorials.forEach(tutorial => {
		if (
			tutorial.title.toLowerCase().includes(lowercaseQuery) ||
			tutorial.description.toLowerCase().includes(lowercaseQuery) ||
			tutorial.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
		) {
			results.push({ type: 'tutorial', ...tutorial });
		}
	});

	return results;
};
