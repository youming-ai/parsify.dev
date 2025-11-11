import type {
	TutorialCollection,
	TutorialReference,
	TutorialStep,
	ToolCategory,
	Tool,
	TutorialCategory,
	DocumentationSection,
	CodeExample
} from '@/types/documentation';
import type { ToolDifficulty, SupportedLanguage } from '@/types/tools';

export class TutorialSystem {
	private static instance: TutorialSystem;
	private tutorialCollections: Map<string, TutorialCollection> = new Map();
	private userProgress: Map<string, UserTutorialProgress> = new Map();
	private interactiveSessions: Map<string, InteractiveSession> = new Map();

	private constructor() {
		this.initializeTutorialCollections();
	}

	static getInstance(): TutorialSystem {
		if (!TutorialSystem.instance) {
			TutorialSystem.instance = new TutorialSystem();
		}
		return TutorialSystem.instance;
	}

	// Get all tutorial collections
	public getAllCollections(): TutorialCollection[] {
		return Array.from(this.tutorialCollections.values());
	}

	// Get tutorial collection by ID
	public getCollection(id: string): TutorialCollection | null {
		return this.tutorialCollections.get(id) || null;
	}

	// Get tutorials by category
	public getTutorialsByCategory(category: TutorialCategory): TutorialCollection[] {
		return Array.from(this.tutorialCollections.values())
			.filter(collection => collection.category === category);
	}

	// Get tutorials for specific tool
	public getTutorialsForTool(toolId: string): TutorialReference[] {
		const allTutorials: TutorialReference[] = [];

		for (const collection of this.tutorialCollections.values()) {
			const toolTutorials = collection.tutorials.filter(tutorial =>
				tutorial.tools.includes(toolId)
			);
			allTutorials.push(...toolTutorials);
		}

		return allTutorials.sort((a, b) => a.duration - b.duration);
	}

	// Generate custom tutorial collection
	public generateCustomCollection(
		title: string,
		description: string,
		tools: string[],
		difficulty: ToolDifficulty = 'beginner'
	): TutorialCollection {
		const tutorials = this.createTutorialsForTools(tools, difficulty);

		const collection: TutorialCollection = {
			id: `custom-${Date.now()}`,
			title,
			description,
			category: 'integration-patterns',
			difficulty,
			duration: tutorials.reduce((sum, t) => sum + t.duration, 0),
			tutorials,
			outcomes: this.generateOutcomesForTools(tools),
			popularity: 0,
			rating: 0,
			lastUpdated: new Date(),
		};

		return collection;
	}

	// Create interactive tutorial session
	public createInteractiveSession(
		collectionId: string,
		userId?: string
	): InteractiveSession {
		const collection = this.getCollection(collectionId);
		if (!collection) {
			throw new Error(`Tutorial collection ${collectionId} not found`);
		}

		const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const session: InteractiveSession = {
			id: sessionId,
			collectionId,
			userId,
			startTime: new Date(),
			currentStep: 0,
			completedSteps: [],
			sessionData: {},
			interactions: [],
			status: 'active',
		};

		this.interactiveSessions.set(sessionId, session);
		return session;
	}

	// Advance tutorial session
	public advanceSession(sessionId: string, stepData: any): SessionResult {
		const session = this.interactiveSessions.get(sessionId);
		if (!session) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const collection = this.getCollection(session.collectionId);
		if (!collection) {
			throw new Error(`Collection not found for session ${sessionId}`);
		}

		const currentTutorial = collection.tutorials[session.currentStep];
		if (!currentTutorial) {
			return {
				success: false,
				message: 'Tutorial already completed',
				sessionData: session,
			};
		}

		// Validate step completion
		const validationResult = this.validateStepCompletion(currentTutorial, stepData);

		if (validationResult.success) {
			session.completedSteps.push(session.currentStep);
			session.currentStep++;
			session.sessionData[`${session.currentStep - 1}`] = stepData;
			session.interactions.push({
				step: session.currentStep - 1,
				action: 'complete',
				timestamp: new Date(),
				data: stepData,
			});

			// Check if tutorial is completed
			if (session.currentStep >= collection.tutorials.length) {
				session.status = 'completed';
				session.endTime = new Date();
			}

			return {
				success: true,
				message: 'Step completed successfully',
				nextStep: session.currentStep < collection.tutorials.length
					? collection.tutorials[session.currentStep]
					: null,
				sessionData: session,
			};
		}

		return {
			success: false,
			message: validationResult.message || 'Step validation failed',
			errors: validationResult.errors,
			sessionData: session,
		};
	}

	// Get user progress
	public getUserProgress(userId: string): UserTutorialProgress | null {
		return this.userProgress.get(userId) || null;
	}

	// Update user progress
	public updateUserProgress(
		userId: string,
		collectionId: string,
		stepIndex: number
	): void {
		let progress = this.userProgress.get(userId);
		if (!progress) {
			progress = {
				userId,
				completedTutorials: [],
				currentTutorials: [],
				achievements: [],
				totalTimeSpent: 0,
				lastActivity: new Date(),
			};
			this.userProgress.set(userId, progress);
		}

		// Update progress tracking
		const currentTutorial = progress.currentTutorials.find(
			t => t.collectionId === collectionId
		);

		if (currentTutorial) {
			currentTutorial.currentStep = Math.max(currentTutorial.currentStep, stepIndex);
			currentTutorial.lastActivity = new Date();
		} else {
			progress.currentTutorials.push({
				collectionId,
				currentStep: stepIndex,
				startTime: new Date(),
				lastActivity: new Date(),
			});
		}

		progress.lastActivity = new Date();
	}

	// Initialize tutorial collections
	private initializeTutorialCollections(): void {
		// Getting Started Collection
		this.tutorialCollections.set('getting-started', {
			id: 'getting-started',
			title: 'Getting Started with Parsify.dev',
			description: 'Learn the basics of using our developer tools platform',
			category: 'getting-started',
			difficulty: 'beginner',
			duration: 25,
			tutorials: [
				{
					id: 'platform-overview',
					title: 'Platform Overview',
					description: 'Introduction to Parsify.dev and its features',
					duration: 5,
					difficulty: 'beginner',
					tags: ['basics', 'introduction', 'platform'],
					tools: [],
					steps: [
						{
							id: 'overview-intro',
							title: 'Welcome to Parsify.dev',
							description: 'Learn about our developer tools platform',
							content: this.generateContent('overview-intro'),
							expectedOutcome: 'Understand the platform capabilities',
						},
						{
							id: 'navigation-basics',
							title: 'Navigation Basics',
							description: 'How to find and use tools',
							content: this.generateContent('navigation-basics'),
							expectedOutcome: 'Navigate the platform efficiently',
						},
					],
				},
				{
					id: 'first-tool',
					title: 'Your First Tool',
					description: 'Learn how to use the JSON Formatter',
					duration: 10,
					difficulty: 'beginner',
					tags: ['json', 'formatter', 'hands-on'],
					tools: ['json-formatter'],
					steps: [
						{
							id: 'access-tool',
							title: 'Accessing the Tool',
							description: 'Find and open the JSON Formatter',
							content: this.generateContent('access-tool'),
							expectedOutcome: 'Successfully open the JSON Formatter',
						},
						{
							id: 'input-data',
							title: 'Inputting Data',
							description: 'Add your JSON data to format',
							content: this.generateContent('input-data'),
							expectedOutcome: 'Input JSON data correctly',
						},
						{
							id: 'format-options',
							title: 'Format Options',
							description: 'Configure formatting preferences',
							content: this.generateContent('format-options'),
							expectedOutcome: 'Set up desired formatting options',
						},
					],
				},
				{
					id: 'saving-work',
					title: 'Saving and Sharing',
					description: 'How to save and share your work',
					duration: 10,
					difficulty: 'beginner',
					tags: ['save', 'share', 'export'],
					tools: [],
					steps: [
						{
							id: 'export-results',
							title: 'Export Results',
							description: 'Different ways to export your formatted data',
							content: this.generateContent('export-results'),
							expectedOutcome: 'Export results in preferred format',
						},
						{
							id: 'share-work',
							title: 'Sharing Your Work',
							description: 'Share results with team members',
							content: this.generateContent('share-work'),
							expectedOutcome: 'Share work effectively',
						},
					],
				},
			],
			outcomes: [
				'Navigate the Parsify.dev platform',
				'Use basic formatting tools',
				'Export and share results',
				'Understand tool capabilities',
			],
			popularity: 95,
			rating: 4.8,
			lastUpdated: new Date(),
		});

		// JSON Processing Collection
		this.tutorialCollections.set('json-processing-basics', {
			id: 'json-processing-basics',
			title: 'JSON Processing Fundamentals',
			description: 'Master JSON formatting, validation, and transformation',
			category: 'json-processing',
			difficulty: 'beginner',
			duration: 45,
			tutorials: [
				{
					id: 'json-basics',
					title: 'JSON Basics',
					description: 'Understanding JSON structure and syntax',
					duration: 15,
					difficulty: 'beginner',
					tags: ['json', 'basics', 'syntax'],
					tools: ['json-formatter', 'json-validator'],
					steps: [
						{
							id: 'json-structure',
							title: 'JSON Structure',
							description: 'Understanding objects, arrays, and values',
							content: this.generateContent('json-structure'),
							expectedOutcome: 'Understand JSON data structures',
						},
						{
							id: 'json-syntax',
							title: 'JSON Syntax Rules',
							description: 'Learn proper JSON syntax',
							content: this.generateContent('json-syntax'),
							expectedOutcome: 'Write valid JSON syntax',
						},
					],
				},
				{
					id: 'json-formatting',
					title: 'JSON Formatting',
					description: 'Format and beautify JSON data',
					duration: 15,
					difficulty: 'beginner',
					tags: ['json', 'formatting', 'beautify'],
					tools: ['json-formatter'],
					steps: [
						{
							id: 'basic-formatting',
							title: 'Basic Formatting',
							description: 'Format simple JSON objects',
							content: this.generateContent('basic-formatting'),
							expectedOutcome: 'Format basic JSON structures',
						},
						{
							id: 'advanced-formatting',
							title: 'Advanced Formatting',
							description: 'Custom formatting options',
							content: this.generateContent('advanced-formatting'),
							expectedOutcome: 'Apply custom formatting rules',
						},
					],
				},
				{
					id: 'json-validation',
					title: 'JSON Validation',
					description: 'Validate JSON against schemas and rules',
					duration: 15,
					difficulty: 'intermediate',
					tags: ['json', 'validation', 'schemas'],
					tools: ['json-validator', 'json-schema-generator'],
					steps: [
						{
							id: 'syntax-validation',
							title: 'Syntax Validation',
							description: 'Check JSON syntax errors',
							content: this.generateContent('syntax-validation'),
							expectedOutcome: 'Identify and fix JSON syntax errors',
						},
						{
							id: 'schema-validation',
							title: 'Schema Validation',
							description: 'Validate against JSON schemas',
							content: this.generateContent('schema-validation'),
							expectedOutcome: 'Use JSON schemas for validation',
						},
					],
				},
			],
			outcomes: [
				'Understand JSON structure and syntax',
				'Format JSON data effectively',
				'Validate JSON against schemas',
				'Troubleshoot JSON issues',
			],
			popularity: 87,
			rating: 4.6,
			lastUpdated: new Date(),
		});

		// Code Execution Collection
		this.tutorialCollections.set('code-execution-workshop', {
			id: 'code-execution-workshop',
			title: 'Code Execution Workshop',
			description: 'Learn to execute and debug code in multiple languages',
			category: 'code-execution',
			difficulty: 'intermediate',
			duration: 60,
			tutorials: [
				{
					id: 'sandbox-basics',
					title: 'Understanding the Sandbox',
					description: 'Learn about our secure code execution environment',
					duration: 15,
					difficulty: 'intermediate',
					tags: ['sandbox', 'security', 'environment'],
					tools: ['code-executor'],
					steps: [
						{
							id: 'sandbox-overview',
							title: 'Sandbox Environment',
							description: 'How our code execution sandbox works',
							content: this.generateContent('sandbox-overview'),
							expectedOutcome: 'Understand sandbox limitations and capabilities',
						},
						{
							id: 'security-features',
							title: 'Security Features',
							description: 'Built-in security protections',
							content: this.generateContent('security-features'),
							expectedOutcome: 'Understand security restrictions',
						},
					],
				},
				{
					id: 'javascript-execution',
					title: 'JavaScript Execution',
					description: 'Execute and debug JavaScript code',
					duration: 20,
					difficulty: 'intermediate',
					tags: ['javascript', 'execution', 'debugging'],
					tools: ['code-executor'],
					steps: [
						{
							id: 'js-basics',
							title: 'Basic JavaScript Execution',
							description: 'Run simple JavaScript programs',
							content: this.generateContent('js-basics'),
							expectedOutcome: 'Execute basic JavaScript code',
						},
						{
							id: 'js-debugging',
							title: 'Debugging JavaScript',
							description: 'Find and fix JavaScript errors',
							content: this.generateContent('js-debugging'),
							expectedOutcome: 'Debug JavaScript effectively',
						},
					],
				},
				{
					id: 'python-execution',
					title: 'Python Execution',
					description: 'Execute Python code in the sandbox',
					duration: 25,
					difficulty: 'intermediate',
					tags: ['python', 'execution', 'libraries'],
					tools: ['code-executor'],
					steps: [
						{
							id: 'python-basics',
							title: 'Basic Python Execution',
							description: 'Run Python programs',
							content: this.generateContent('python-basics'),
							expectedOutcome: 'Execute basic Python code',
						},
						{
							id: 'python-libraries',
							title: 'Using Python Libraries',
							description: 'Work with Python standard library',
							content: this.generateContent('python-libraries'),
							expectedOutcome: 'Use Python standard library functions',
						},
					],
				},
			],
			outcomes: [
				'Understand sandbox execution environment',
				'Execute code in multiple languages',
				'Debug code effectively',
				'Work within security constraints',
			],
			popularity: 72,
			rating: 4.5,
			lastUpdated: new Date(),
		});

		// Add more tutorial collections as needed
	}

	// Create tutorials for specific tools
	private createTutorialsForTools(
		toolIds: string[],
		difficulty: ToolDifficulty
	): TutorialReference[] {
		return toolIds.map((toolId, index) => ({
			id: `tutorial-${toolId}-${index}`,
			title: `Using ${toolId}`,
			description: `Learn how to use the ${toolId} tool effectively`,
			duration: 10,
			difficulty,
			tags: [toolId, 'tutorial', 'how-to'],
			tools: [toolId],
			steps: [
				{
					id: `${toolId}-intro`,
					title: `Introduction to ${toolId}`,
					description: `Getting started with ${toolId}`,
					content: this.generateContent(`${toolId}-intro`),
					expectedOutcome: `Understand ${toolId} basics`,
				},
				{
					id: `${toolId}-usage`,
					title: `Using ${toolId}`,
					description: `Practical usage of ${toolId}`,
					content: this.generateContent(`${toolId}-usage`),
					expectedOutcome: `Use ${toolId} effectively`,
				},
			],
		}));
	}

	// Generate outcomes for tools
	private generateOutcomesForTools(toolIds: string[]): string[] {
		const baseOutcomes = [
			'Use selected tools effectively',
			'Integrate tools into workflows',
			'Troubleshoot common issues',
		];

		const toolSpecificOutcomes = toolIds.map(toolId =>
			`Master the ${toolId} tool`
		);

		return [...baseOutcomes, ...toolSpecificOutcomes];
	}

	// Generate tutorial content
	private generateContent(contentId: string): string {
		const contentMap: Record<string, string> = {
			'overview-intro': `# Welcome to Parsify.dev

Parsify.dev is a comprehensive platform for developers that provides 58+ tools for data processing, code execution, file conversion, and more.

## What You'll Learn
- Platform overview and navigation
- Available tools and their uses
- How to get started quickly
- Best practices for using the tools

## Why Use Parsify.dev?
- **Privacy-focused**: All processing happens in your browser
- **No registration required**: Start using tools immediately
- **Comprehensive**: Tools for all your development needs
- **Secure**: Your data never leaves your device`,

			'navigation-basics': `# Navigation Basics

## Finding Tools
1. **Browse by Category**: Tools are organized into logical categories
2. **Search Function**: Use the search bar to find specific tools
3. **Quick Access**: Popular tools are highlighted on the homepage

## Tool Interface
Each tool has a consistent interface with:
- Input area for your data
- Configuration options
- Process/Execute buttons
- Results display
- Export options

## Tips for Efficient Navigation
- Use keyboard shortcuts (Ctrl+K for search)
- Bookmark frequently used tools
- Check the "Recently Used" section`,

			'access-tool': `# Accessing the JSON Formatter

## Method 1: Browse Categories
1. Click on "JSON Processing" in the main menu
2. Select "JSON Formatter" from the list

## Method 2: Search
1. Press Ctrl+K or click the search bar
2. Type "JSON Formatter"
3. Click on the tool in the results

## Method 3: Direct URL
Navigate directly to: \`/tools/json/formatter\`

Once you've accessed the tool, you'll see the input area where you can paste your JSON data.`,

			'input-data': `# Inputting JSON Data

## Supported Input Formats
- **JSON String**: Paste raw JSON text
- **File Upload**: Upload .json files
- **URL Input**: Fetch JSON from a URL

## Best Practices for Input
- Ensure your JSON is valid syntax
- Remove any trailing commas
- Use proper quoting for strings
- Check for balanced brackets and braces

## Troubleshooting Input Issues
- **Syntax Errors**: Use the JSON Validator first
- **Large Files**: Consider splitting large JSON files
- **Encoding Issues**: Ensure UTF-8 encoding`,

			// Add more content as needed
		};

		return contentMap[contentId] || `# Tutorial Content\n\nContent for ${contentId} will be displayed here.`;
	}

	// Validate step completion
	private validateStepCompletion(
		tutorial: TutorialReference,
		stepData: any
	): ValidationResult {
		// This would contain actual validation logic
		// For now, return a basic success validation
		return {
			success: true,
			message: 'Step completed successfully',
		};
	}
}

// Type definitions for the tutorial system
interface UserTutorialProgress {
	userId: string;
	completedTutorials: CompletedTutorial[];
	currentTutorials: CurrentTutorial[];
	achievements: Achievement[];
	totalTimeSpent: number; // in minutes
	lastActivity: Date;
}

interface CompletedTutorial {
	collectionId: string;
	completedAt: Date;
	timeSpent: number;
	rating?: number;
	feedback?: string;
}

interface CurrentTutorial {
	collectionId: string;
	currentStep: number;
	startTime: Date;
	lastActivity: Date;
	sessionData?: any;
}

interface Achievement {
	id: string;
	title: string;
	description: string;
	earnedAt: Date;
	badge?: string;
}

interface InteractiveSession {
	id: string;
	collectionId: string;
	userId?: string;
	startTime: Date;
	endTime?: Date;
	currentStep: number;
	completedSteps: number[];
	sessionData: Record<string, any>;
	interactions: SessionInteraction[];
	status: 'active' | 'completed' | 'abandoned';
}

interface SessionInteraction {
	step: number;
	action: 'start' | 'complete' | 'skip' | 'error';
	timestamp: Date;
	data?: any;
}

interface SessionResult {
	success: boolean;
	message: string;
	nextStep?: TutorialReference | null;
	errors?: string[];
	sessionData: InteractiveSession;
}

interface ValidationResult {
	success: boolean;
	message?: string;
	errors?: string[];
}

export const tutorialSystem = TutorialSystem.getInstance();
