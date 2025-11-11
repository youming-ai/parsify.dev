import type {
	CodeExample,
	Tool,
	ToolExample,
	DocumentationSection,
	DocumentationSubsection,
	SupportedLanguage,
} from '@/types/documentation';
import type { ToolDifficulty } from '@/types/tools';

export class InteractiveDocumentationSystem {
	private static instance: InteractiveDocumentationSystem;
	private liveExamples: Map<string, LiveExample[]> = new Map();
	private interactiveSessions: Map<string, InteractiveSession> = new Map();
	private sandboxEnvironments: Map<string, SandboxEnvironment> = new Map();
	private executionHistory: Map<string, ExecutionRecord[]> = new Map();

	private constructor() {
		this.initializeSandboxEnvironments();
		this.initializeLiveExamples();
	}

	static getInstance(): InteractiveDocumentationSystem {
		if (!InteractiveDocumentationSystem.instance) {
			InteractiveDocumentationSystem.instance = new InteractiveDocumentationSystem();
		}
		return InteractiveDocumentationSystem.instance;
	}

	// Create interactive documentation session
	public createInteractiveSession(
		toolId: string,
		userId?: string
	): InteractiveSession {
		const sessionId = this.generateSessionId();
		const session: InteractiveSession = {
			id: sessionId,
			toolId,
			userId,
			createdAt: new Date(),
			currentState: 'active',
			examples: [],
			executions: [],
			notes: [],
			bookmarks: [],
			progress: {
				completedSteps: 0,
				totalSteps: 0,
				currentStep: 0,
			},
		};

		this.interactiveSessions.set(sessionId, session);
		return session;
	}

	// Add live example to session
	public addLiveExample(
		sessionId: string,
		example: LiveExample
	): Promise<ExecutionResult> {
		const session = this.interactiveSessions.get(sessionId);
		if (!session) {
			throw new Error(`Session ${sessionId} not found`);
		}

		session.examples.push(example);

		// Auto-execute if it's a runnable example
		if (example.isRunnable) {
			return this.executeExample(sessionId, example.id);
		}

		return Promise.resolve({
			success: true,
			output: 'Example added to session',
			executionTime: 0,
		});
	}

	// Execute example in sandbox
	public async executeExample(
		sessionId: string,
		exampleId: string,
		input?: any
	): Promise<ExecutionResult> {
		const session = this.interactiveSessions.get(sessionId);
		if (!session) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const example = session.examples.find(ex => ex.id === exampleId);
		if (!example) {
			throw new Error(`Example ${exampleId} not found in session`);
		}

		const sandbox = this.getSandboxEnvironment(example.language);
		if (!sandbox) {
			throw new Error(`No sandbox available for ${example.language}`);
		}

		try {
			const startTime = Date.now();
			const result = await this.executeInSandbox(sandbox, example, input);
			const executionTime = Date.now() - startTime;

			// Record execution
			const execution: ExecutionRecord = {
				id: this.generateExecutionId(),
				exampleId,
				input,
				output: result.output,
				success: result.success,
				error: result.error,
				executionTime,
				timestamp: new Date(),
				language: example.language,
			};

			session.executions.push(execution);
			this.recordExecution(session.toolId, execution);

			return result;
		} catch (error) {
			return {
				success: false,
				error: error.message,
				executionTime: 0,
			};
		}
	}

	// Create interactive tutorial
	public createInteractiveTutorial(
		title: string,
		description: string,
		steps: TutorialStep[]
	): InteractiveTutorial {
		return {
			id: this.generateTutorialId(),
			title,
			description,
			steps,
			currentStep: 0,
			completedSteps: [],
			sessionId: null,
			createdAt: new Date(),
		};
	}

	// Start tutorial with live examples
	public async startTutorial(
		tutorial: InteractiveTutorial,
		toolId: string,
		userId?: string
	): Promise<string> {
		const session = this.createInteractiveSession(toolId, userId);
		tutorial.sessionId = session.id;

		// Add examples from tutorial steps
		for (const step of tutorial.steps) {
			if (step.liveExample) {
				await this.addLiveExample(session.id, step.liveExample);
			}
		}

		return session.id;
	}

	// Advance tutorial step
	public async advanceTutorialStep(
		tutorialId: string,
		stepIndex: number,
		userInput?: any
	): Promise<TutorialStepResult> {
		// Implementation would find tutorial and execute step
		return {
			success: true,
			nextStep: stepIndex + 1,
			feedback: 'Step completed successfully',
			suggestions: [],
		};
	}

	// Generate interactive documentation for a tool
	public generateInteractiveDocumentation(tool: Tool): InteractiveDocumentation {
		const liveExamples = this.getLiveExamples(tool.id);
		const interactiveSections = this.createInteractiveSections(tool);
		const sandboxInfo = this.getSandboxInfo(tool.id);

		return {
			toolId: tool.id,
			toolName: tool.name,
			liveExamples,
			interactiveSections,
			sandboxEnvironments: sandboxInfo,
			tutorials: this.generateInteractiveTutorials(tool.id),
			quickStart: this.createQuickStartExperience(tool.id),
			playground: this.createPlayground(tool.id),
		};
	}

	// Create live code editor
	public createLiveEditor(
		language: SupportedLanguage,
		initialCode?: string,
		options?: EditorOptions
	): LiveEditor {
		const editorId = this.generateEditorId();
		return {
			id: editorId,
			language,
			code: initialCode || this.getDefaultCode(language),
			options: {
				theme: 'dark',
				fontSize: 14,
				wordWrap: true,
				lineNumbers: true,
				autocomplete: true,
				...options,
			},
			tools: this.getEditorTools(language),
			isInteractive: true,
		};
	}

	// Get live execution history
	public getExecutionHistory(toolId: string, userId?: string): ExecutionRecord[] {
		const history = this.executionHistory.get(toolId) || [];

		if (userId) {
			return history.filter(record =>
				this.getExecutionSession(record.id)?.userId === userId
			);
		}

		return history.slice(-50); // Return last 50 executions
	}

	// Get suggested examples based on context
	public getSuggestedExamples(
		toolId: string,
		userContext: UserContext
	): LiveExample[] {
		const allExamples = this.getLiveExamples(toolId);

		// Filter based on user skill level and interests
		return allExamples.filter(example =>
			this.isExampleSuitable(example, userContext)
		).slice(0, 5);
	}

	// Initialize sandbox environments
	private initializeSandboxEnvironments(): void {
		// JavaScript Sandbox
		this.sandboxEnvironments.set('javascript', {
			id: 'js-sandbox',
			language: 'javascript',
			runtime: 'webassembly',
			securityLevel: 'high',
			features: [
				'ES2020 support',
				'Console output capture',
				'Error handling',
				'Timeout protection',
			],
			limitations: [
				'No network access',
				'No file system access',
				'Limited memory usage',
				'5 second execution limit',
			],
			libraries: ['lodash', 'moment', 'axios'],
		});

		// Python Sandbox
		this.sandboxEnvironments.set('python', {
			id: 'python-sandbox',
			language: 'python',
			runtime: 'pyodide',
			securityLevel: 'high',
			features: [
				'Python 3.9+',
				'Standard library',
				'NumPy support',
				'Print output capture',
			],
			limitations: [
				'No network access',
				'Limited package support',
				'Memory constraints',
				'10 second execution limit',
			],
			libraries: ['numpy', 'pandas', 'requests', 'json'],
		});

		// Add more sandboxes as needed
	}

	// Initialize live examples
	private initializeLiveExamples(): void {
		// JSON Formatter Examples
		this.liveExamples.set('json-formatter', [
			{
				id: 'json-basic-format',
				title: 'Basic JSON Formatting',
				description: 'Format a simple JSON object with proper indentation',
				language: 'json',
				code: '{"name":"John","age":30,"city":"New York"}',
				expectedOutput: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
				isRunnable: true,
				difficulty: 'basic',
				tags: ['formatting', 'basics'],
				interactions: [
					{
						type: 'input-modification',
						description: 'Try changing the values and see how the formatting changes',
					},
					{
						type: 'option-exploration',
						description: 'Experiment with different indentation levels',
					},
				],
			},
			{
				id: 'json-nested-format',
				title: 'Nested JSON Formatting',
				description: 'Format complex nested JSON structures',
				language: 'json',
				code: '{"user":{"profile":{"name":"John","details":{"age":30,"address":{"street":"123 Main St","city":"NYC"}}}}}',
				expectedOutput: 'Formatted nested JSON with proper indentation',
				isRunnable: true,
				difficulty: 'intermediate',
				tags: ['formatting', 'nested'],
				interactions: [
					{
						type: 'depth-exploration',
						description: 'Add more nesting levels to see how it handles complexity',
					},
				],
			},
		]);

		// Code Executor Examples
		this.liveExamples.set('code-executor', [
			{
				id: 'js-hello-world',
				title: 'Hello World in JavaScript',
				description: 'A simple "Hello, World!" example in JavaScript',
				language: 'javascript',
				code: 'console.log("Hello, World!");',
				expectedOutput: 'Hello, World!',
				isRunnable: true,
				difficulty: 'basic',
				tags: ['javascript', 'basics'],
				interactions: [
					{
						type: 'code-modification',
						description: 'Change the message to output different text',
					},
				],
			},
			{
				id: 'js-function-example',
				title: 'JavaScript Functions',
				description: 'Define and call a JavaScript function',
				language: 'javascript',
				code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("World"));',
				expectedOutput: 'Hello, World!',
				isRunnable: true,
				difficulty: 'intermediate',
				tags: ['javascript', 'functions'],
				interactions: [
					{
						type: 'parameter-exploration',
						description: 'Try different names as parameters',
					},
					{
						type: 'function-modification',
						description: 'Modify the function to add more behavior',
					},
				],
			},
			{
				id: 'python-hello-world',
				title: 'Hello World in Python',
				description: 'A simple "Hello, World!" example in Python',
				language: 'python',
				code: 'print("Hello, World!")',
				expectedOutput: 'Hello, World!',
				isRunnable: true,
				difficulty: 'basic',
				tags: ['python', 'basics'],
				interactions: [
					{
						type: 'code-experimentation',
						description: 'Try different print statements',
					},
				],
			},
		]);

		// Add more examples for other tools
	}

	// Execute code in sandbox
	private async executeInSandbox(
		sandbox: SandboxEnvironment,
		example: LiveExample,
		input?: any
	): Promise<ExecutionResult> {
		// This would integrate with actual sandbox execution
		// For now, return a mock result

		try {
			// Mock execution - in real implementation, this would:
			// 1. Send code to sandbox environment
			// 2. Capture output and errors
			// 3. Handle timeouts
			// 4. Manage memory limits

			const mockOutput = example.expectedOutput || 'Execution completed successfully';

			return {
				success: true,
				output: mockOutput,
				executionTime: Math.random() * 1000, // Mock execution time
				metadata: {
					sandbox: sandbox.id,
					memoryUsage: Math.random() * 1024 * 1024, // Mock memory usage
					timeLimit: sandbox.securityLevel === 'high' ? 5000 : 10000,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				executionTime: 0,
			};
		}
	}

	// Helper methods
	private generateSessionId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateExecutionId(): string {
		return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateTutorialId(): string {
		return `tutorial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateEditorId(): string {
		return `editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private getSandboxEnvironment(language: SupportedLanguage): SandboxEnvironment | null {
		return this.sandboxEnvironments.get(language) || null;
	}

	private getLiveExamples(toolId: string): LiveExample[] {
		return this.liveExamples.get(toolId) || [];
	}

	private createInteractiveSections(tool: Tool): InteractiveSection[] {
		const sections: InteractiveSection[] = [
			{
				id: 'try-it-now',
				title: 'Try It Now',
				description: 'Interactive examples you can run right now',
				type: 'playground',
				examples: this.getLiveExamples(tool.id).filter(ex => ex.difficulty === 'basic'),
			},
			{
				id: 'advanced-examples',
				title: 'Advanced Examples',
				description: 'Complex scenarios and edge cases',
				type: 'examples',
				examples: this.getLiveExamples(tool.id).filter(ex => ex.difficulty !== 'basic'),
			},
		];

		return sections;
	}

	private getSandboxInfo(toolId: string): SandboxEnvironment[] {
		// Return relevant sandbox environments for the tool
		return Array.from(this.sandboxEnvironments.values())
			.filter(sandbox => this.isSandboxRelevant(sandbox, toolId));
	}

	private generateInteractiveTutorials(toolId: string): InteractiveTutorial[] {
		// Generate interactive tutorials for the tool
		return [
			{
				id: `${toolId}-basic-tutorial`,
				title: `Getting Started with ${toolId}`,
				description: 'Learn the basics with interactive examples',
				steps: this.createBasicTutorialSteps(toolId),
				currentStep: 0,
				completedSteps: [],
				sessionId: null,
				createdAt: new Date(),
			},
		];
	}

	private createBasicTutorialSteps(toolId: string): TutorialStep[] {
		const examples = this.getLiveExamples(toolId);

		return examples.slice(0, 3).map((example, index) => ({
			id: `step-${index + 1}`,
			title: `Step ${index + 1}: ${example.title}`,
			description: example.description,
			liveExample: example,
			expectedOutcome: example.expectedOutput,
			hints: example.interactions.map(interaction => interaction.description),
		}));
	}

	private createQuickStartExperience(toolId: string): QuickStartExperience {
		const basicExample = this.getLiveExamples(toolId)
			.find(ex => ex.difficulty === 'basic');

		return {
			title: 'Quick Start',
			description: 'Get up and running in 30 seconds',
			steps: [
				'Copy the example code below',
				'Click "Run" to execute it',
				'Modify the code and run again',
			],
			example: basicExample || null,
			timeEstimate: 30, // seconds
		};
	}

	private createPlayground(toolId: string): Playground {
		return {
			id: `${toolId}-playground`,
			title: `${toolId} Playground`,
			description: 'Experiment with ${toolId} in a safe environment',
			tools: this.getPlaygroundTools(toolId),
			templates: this.getPlaygroundTemplates(toolId),
			preferences: {
				autoRun: false,
				showOutput: true,
				theme: 'dark',
			},
		};
	}

	private recordExecution(toolId: string, execution: ExecutionRecord): void {
		if (!this.executionHistory.has(toolId)) {
			this.executionHistory.set(toolId, []);
		}

		const history = this.executionHistory.get(toolId)!;
		history.push(execution);

		// Keep only last 1000 executions
		if (history.length > 1000) {
			history.splice(0, history.length - 1000);
		}
	}

	private getExecutionSession(executionId: string): InteractiveSession | null {
		for (const session of this.interactiveSessions.values()) {
			if (session.executions.some(exec => exec.id === executionId)) {
				return session;
			}
		}
		return null;
	}

	private isExampleSuitable(example: LiveExample, userContext: UserContext): boolean {
		// Logic to determine if example is suitable for user
		return example.difficulty === userContext.skillLevel;
	}

	private isSandboxRelevant(sandbox: SandboxEnvironment, toolId: string): boolean {
		// Logic to determine if sandbox is relevant for tool
		return true; // Simplified
	}

	private getDefaultCode(language: SupportedLanguage): string {
		const defaults: Record<SupportedLanguage, string> = {
			javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
			typescript: '// Write your TypeScript code here\nconsole.log("Hello, World!");',
			python: '# Write your Python code here\nprint("Hello, World!")',
			java: '// Write your Java code here\nSystem.out.println("Hello, World!");',
			csharp: '// Write your C# code here\nConsole.WriteLine("Hello, World!");',
			cpp: '// Write your C++ code here\n#include <iostream>\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}',
			go: '// Write your Go code here\npackage main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, World!")\n}',
			rust: '// Write your Rust code here\nfn main() {\n  println!("Hello, World!");\n}',
			php: '<?php\n// Write your PHP code here\necho "Hello, World!";\n?>',
			ruby: '# Write your Ruby code here\nputs "Hello, World!"',
			sql: '-- Write your SQL query here\nSELECT "Hello, World!";',
			html: '<!-- Write your HTML here -->\n<h1>Hello, World!</h1>',
			css: '/* Write your CSS here */\nh1 { color: blue; }',
			json: '{\n  "message": "Hello, World!"\n}',
			xml: '<message>Hello, World!</message>',
			yaml: 'message: "Hello, World!"',
			markdown: '# Hello, World!',
			bash: '#!/bin/bash\necho "Hello, World!"',
			powershell: '# Write your PowerShell script here\nWrite-Host "Hello, World!"',
			dockerfile: 'FROM alpine\nCMD echo "Hello, World!"',
			plaintext: 'Hello, World!',
		};

		return defaults[language] || '// Write your code here';
	}

	private getEditorTools(language: SupportedLanguage): EditorTool[] {
		// Return relevant tools for the language
		return [
			{
				id: 'format',
				name: 'Format',
				description: 'Format the code',
			},
			{
				id: 'run',
				name: 'Run',
				description: 'Execute the code',
			},
			{
				id: 'share',
				name: 'Share',
				description: 'Share the code',
			},
		];
	}

	private getPlaygroundTools(toolId: string): string[] {
		// Return available playground tools for the specific tool
		return ['editor', 'executor', 'formatter', 'validator'];
	}

	private getPlaygroundTemplates(toolId: string): PlaygroundTemplate[] {
		const examples = this.getLiveExamples(toolId);

		return examples.map(example => ({
			id: example.id,
			name: example.title,
			description: example.description,
			code: example.code,
			language: example.language,
			category: example.difficulty,
		}));
	}
}

// Type definitions
interface InteractiveDocumentation {
	toolId: string;
	toolName: string;
	liveExamples: LiveExample[];
	interactiveSections: InteractiveSection[];
	sandboxEnvironments: SandboxEnvironment[];
	tutorials: InteractiveTutorial[];
	quickStart: QuickStartExperience;
	playground: Playground;
}

interface LiveExample {
	id: string;
	title: string;
	description: string;
	language: SupportedLanguage;
	code: string;
	expectedOutput: string;
	isRunnable: boolean;
	difficulty: ToolDifficulty;
	tags: string[];
	interactions: ExampleInteraction[];
	hints?: string[];
	variations?: ExampleVariation[];
}

interface ExampleInteraction {
	type: 'input-modification' | 'option-exploration' | 'depth-exploration' | 'code-modification' | 'parameter-exploration' | 'code-experimentation';
	description: string;
	expectedOutcome?: string;
}

interface ExampleVariation {
	id: string;
	title: string;
	description: string;
	modification: string;
	expectedResult: string;
}

interface InteractiveSession {
	id: string;
	toolId: string;
	userId?: string;
	createdAt: Date;
	currentState: 'active' | 'completed' | 'paused';
	examples: LiveExample[];
	executions: ExecutionRecord[];
	notes: SessionNote[];
	bookmarks: SessionBookmark[];
	progress: SessionProgress;
}

interface ExecutionRecord {
	id: string;
	exampleId: string;
	input?: any;
	output: any;
	success: boolean;
	error?: string;
	executionTime: number;
	timestamp: Date;
	language: SupportedLanguage;
}

interface ExecutionResult {
	success: boolean;
	output?: any;
	error?: string;
	executionTime: number;
	metadata?: {
		sandbox: string;
		memoryUsage: number;
		timeLimit: number;
	};
}

interface InteractiveTutorial {
	id: string;
	title: string;
	description: string;
	steps: TutorialStep[];
	currentStep: number;
	completedSteps: number[];
	sessionId: string | null;
	createdAt: Date;
}

interface TutorialStep {
	id: string;
	title: string;
	description: string;
	liveExample?: LiveExample;
	expectedOutcome: string;
	hints?: string[];
}

interface TutorialStepResult {
	success: boolean;
	nextStep: number;
	feedback: string;
	suggestions: string[];
	earnedAchievements?: string[];
}

interface InteractiveSection {
	id: string;
	title: string;
	description: string;
	type: 'playground' | 'examples' | 'tutorial' | 'quiz';
	examples: LiveExample[];
}

interface SandboxEnvironment {
	id: string;
	language: SupportedLanguage;
	runtime: string;
	securityLevel: 'low' | 'medium' | 'high';
	features: string[];
	limitations: string[];
	libraries: string[];
}

interface LiveEditor {
	id: string;
	language: SupportedLanguage;
	code: string;
	options: EditorOptions;
	tools: EditorTool[];
	isInteractive: boolean;
}

interface EditorOptions {
	theme: 'light' | 'dark' | 'auto';
	fontSize: number;
	wordWrap: boolean;
	lineNumbers: boolean;
	autocomplete: boolean;
	minimap?: boolean;
}

interface EditorTool {
	id: string;
	name: string;
	description: string;
	icon?: string;
}

interface UserContext {
	skillLevel: ToolDifficulty;
	interests: string[];
	previousExamples: string[];
	preferredLanguage?: SupportedLanguage;
}

interface QuickStartExperience {
	title: string;
	description: string;
	steps: string[];
	example: LiveExample | null;
	timeEstimate: number; // in seconds
}

interface Playground {
	id: string;
	title: string;
	description: string;
	tools: string[];
	templates: PlaygroundTemplate[];
	preferences: PlaygroundPreferences;
}

interface PlaygroundTemplate {
	id: string;
	name: string;
	description: string;
	code: string;
	language: SupportedLanguage;
	category: string;
}

interface PlaygroundPreferences {
	autoRun: boolean;
	showOutput: boolean;
	theme: 'light' | 'dark';
}

interface SessionNote {
	id: string;
	content: string;
	timestamp: Date;
	relatedExampleId?: string;
}

interface SessionBookmark {
	id: string;
	exampleId: string;
	timestamp: Date;
	note?: string;
}

interface SessionProgress {
	completedSteps: number;
	totalSteps: number;
	currentStep: number;
}

export const interactiveDocumentationSystem = InteractiveDocumentationSystem.getInstance();
