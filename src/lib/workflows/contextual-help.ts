/**
 * Contextual Help System
 * Smart tooltips and contextual assistance for workflows
 */

import type {
	WorkflowHint,
	Workflow,
	WorkflowContext,
	Tool
} from '@/types/workflows';
import type { ToolCategory } from '@/types/tools';

export class ContextualHelpSystem {
	private static instance: ContextualHelpSystem;
	private contextDatabase: Map<string, WorkflowHint[]> = new Map();
	private ruleEngine: HelpRuleEngine;
	private toolMappings: Map<string, string[]> = new Map();

	private constructor() {
		this.ruleEngine = new HelpRuleEngine();
		this.initializeContextDatabase();
		this.initializeToolMappings();
	}

	static getInstance(): ContextualHelpSystem {
		if (!ContextualHelpSystem.instance) {
			ContextualHelpSystem.instance = new ContextualHelpSystem();
		}
		return ContextualHelpSystem.instance;
	}

	// Initialize context database with predefined help content
	private initializeContextDatabase() {
		// General UI contexts
		this.contextDatabase.set('json-input', [
			{
				type: 'tip',
				title: 'JSON Input',
				content: 'Paste your JSON data here. The editor will automatically validate and format it.',
				trigger: 'auto',
			},
			{
				type: 'example',
				title: 'Sample JSON',
				content: 'Here\'s a sample JSON structure:\n{\n  "name": "John",\n  "age": 30\n}',
				trigger: 'manual',
			},
		]);

		this.contextDatabase.set('code-editor', [
			{
				type: 'tip',
				title: 'Code Editor',
				content: 'Write your code here. The editor supports syntax highlighting and auto-completion.',
				trigger: 'auto',
			},
		]);

		this.contextDatabase.set('file-upload', [
			{
				type: 'info',
				title: 'File Upload',
				content: 'Click to browse or drag and drop files here. Supported formats depend on the tool.',
				trigger: 'auto',
			},
		]);

		// Tool-specific contexts
		this.contextDatabase.set('json-path-expression', [
			{
				type: 'tip',
				title: 'JSONPath Expression',
				content: 'Enter a JSONPath expression to extract data. Use $ for root, . for properties, [] for arrays.',
				trigger: 'auto',
			},
			{
				type: 'example',
				title: 'Common Expressions',
				content: '$.store.book[*].title - Get all book titles\n$.users[?(@.age > 18)] - Filter users by age',
				trigger: 'delay',
				delay: 3000,
			},
		]);

		this.contextDatabase.set('regex-pattern', [
			{
				type: 'tip',
				title: 'Regex Pattern',
				content: 'Enter a regular expression pattern. Use test text to see matches in real-time.',
				trigger: 'auto',
			},
			{
				type: 'example',
				title: 'Common Patterns',
				content: '\\d+ - Match digits\n[A-Za-z]+ - Match letters\n\\w+@\\w+\\.\\w+ - Basic email pattern',
				trigger: 'delay',
				delay: 2000,
			},
		]);

		// Error-specific help
		this.contextDatabase.set('validation-error', [
			{
				type: 'warning',
				title: 'Validation Error',
				content: 'Check your input format and try again. Common issues include missing quotes or extra commas.',
				trigger: 'error',
			},
		]);

		this.contextDatabase.set('execution-error', [
			{
				type: 'warning',
				title: 'Execution Error',
				content: 'Review your code for syntax errors. Check the error message for specific line numbers.',
				trigger: 'error',
			},
		]);
	}

	// Initialize tool-to-workflow mappings
	private initializeToolMappings() {
		this.toolMappings.set('json-formatter', ['json-formatting-basics']);
		this.toolMappings.set('json-path-queries', ['json-path-intro', 'json-path-basic-expressions']);
		this.toolMappings.set('code-executor', ['execution-basics', 'language-selection']);
		this.toolMappings.set('regex-tester', ['regex-basics', 'regex-patterns']);
		this.toolMappings.set('hash-generator', ['hash-basics', 'hash-algorithms']);
	}

	// Get contextual help based on current context
	public getContextualHelp(
		contextKey: string,
		userContext: WorkflowContext,
		trigger?: string
	): WorkflowHint[] {
		const hints = this.contextDatabase.get(contextKey) || [];

		// Filter hints based on trigger type
		let filteredHints = hints;
		if (trigger) {
			filteredHints = hints.filter(hint =>
				!hint.trigger || hint.trigger === trigger || hint.trigger === 'auto'
			);
		}

		// Apply rule engine to further refine hints
		return this.ruleEngine.filterHints(filteredHints, userContext);
	}

	// Get workflow suggestion based on tool and user behavior
	public getWorkflowSuggestion(
		toolId: string,
		userContext: WorkflowContext
	): Workflow | null {
		const workflowIds = this.toolMappings.get(toolId);
		if (!workflowIds) return null;

		// Analyze user context to determine best workflow
		const completedWorkflows = userContext.userData.completedWorkflows || [];
		const errorCount = userContext.userData.errorCount || 0;
		const timeSpent = userContext.userData.timeSpent || 0;

		// Simple logic: suggest next workflow if user is doing well
		if (errorCount < 3 && timeSpent < 300000) { // 5 minutes
			// Return the first uncompleted workflow
			for (const workflowId of workflowIds) {
				if (!completedWorkflows.includes(workflowId)) {
					return this.getWorkflowById(workflowId);
				}
			}
		}

		return null;
	}

	// Get error-specific help
	public getErrorHelp(errorType: string, errorMessage: string): WorkflowHint[] {
		const errorKey = this.mapErrorToContext(errorType);
		const baseHints = this.contextDatabase.get(errorKey) || [];

		// Add specific error message help
		const specificHints = this.generateSpecificErrorHelp(errorMessage);

		return [...baseHints, ...specificHints];
	}

	// Map error types to context keys
	private mapErrorToContext(errorType: string): string {
		const errorMappings: Record<string, string> = {
			'validation': 'validation-error',
			'syntax': 'syntax-error',
			'execution': 'execution-error',
			'network': 'network-error',
			'permission': 'permission-error',
		};

		return errorMappings[errorType] || 'general-error';
	}

	// Generate specific error help based on error message
	private generateSpecificErrorHelp(errorMessage: string): WorkflowHint[] {
		const hints: WorkflowHint[] = [];

		// JSON-specific errors
		if (errorMessage.includes('Unexpected token') || errorMessage.includes('JSON')) {
			hints.push({
				type: 'tip',
				title: 'JSON Format Error',
				content: 'Check for missing commas, extra commas, or unmatched brackets/braces.',
				trigger: 'error',
			});
		}

		// Regex-specific errors
		if (errorMessage.includes('regex') || errorMessage.includes('pattern')) {
			hints.push({
				type: 'tip',
				title: 'Regex Pattern Error',
				content: 'Ensure your regex pattern is properly escaped. Use online regex testers to validate.',
				trigger: 'error',
			});
		}

		// Code execution errors
		if (errorMessage.includes('undefined') || errorMessage.includes('ReferenceError')) {
			hints.push({
				type: 'tip',
				title: 'Undefined Variable',
				content: 'Check variable names and ensure they are defined before use.',
				trigger: 'error',
			});
		}

		return hints;
	}

	// Get smart tooltip content based on element and context
	public getSmartTooltip(
		elementId: string,
		userContext: WorkflowContext,
		elementContent?: string
	): WorkflowHint | null {
		// Base tooltips from context database
		const hints = this.contextDatabase.get(elementId);
		if (hints && hints.length > 0) {
			return hints[0]; // Return the most relevant hint
		}

		// Generate dynamic tooltips based on content
		if (elementContent) {
			return this.generateContentTooltip(elementContent, userContext);
		}

		// Generate tooltip based on element ID patterns
		return this.generateIdBasedTooltip(elementId, userContext);
	}

	// Generate tooltips based on element content
	private generateContentTooltip(
		content: string,
		userContext: WorkflowContext
	): WorkflowHint | null {
		// Detect JSON in content
		if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
			return {
				type: 'info',
				title: 'JSON Data Detected',
				content: 'This appears to be JSON data. Use JSON tools to validate and format it.',
				trigger: 'manual',
			};
		}

		// Detect code in content
		if (content.includes('function') || content.includes('var ') || content.includes('const ')) {
			return {
				type: 'info',
				title: 'Code Detected',
				content: 'This appears to be code. Use the code executor to run it or the formatter to beautify it.',
				trigger: 'manual',
			};
		}

		// Detect URLs in content
		if (content.includes('http://') || content.includes('https://')) {
			return {
				type: 'info',
				title: 'URL Detected',
				content: 'URL found. Use URL tools to encode/decode or test with HTTP client.',
				trigger: 'manual',
			};
		}

		return null;
	}

	// Generate tooltips based on element ID patterns
	private generateIdBasedTooltip(
		elementId: string,
		userContext: WorkflowContext
	): WorkflowHint | null {
		// Button patterns
		if (elementId.includes('button')) {
			if (elementId.includes('submit')) {
				return {
					type: 'tip',
					title: 'Submit',
					content: 'Click to process your input and see the results.',
					trigger: 'manual',
				};
			}
			if (elementId.includes('clear')) {
				return {
					type: 'tip',
					title: 'Clear',
					content: 'Remove all current input and start fresh.',
					trigger: 'manual',
				};
			}
		}

		// Input patterns
		if (elementId.includes('input')) {
			if (elementId.includes('search')) {
				return {
					type: 'tip',
					title: 'Search',
					content: 'Type to search and filter results in real-time.',
					trigger: 'auto',
				};
			}
		}

		// Tab patterns
		if (elementId.includes('tab')) {
			return {
				type: 'info',
				title: 'Tab Navigation',
				content: 'Switch between different tool features or views.',
				trigger: 'manual',
			};
		}

		return null;
	}

	// Register new contextual help
	public registerContextHelp(contextKey: string, hints: WorkflowHint[]): void {
		this.contextDatabase.set(contextKey, hints);
	}

	// Register tool workflow mapping
	public registerToolMapping(toolId: string, workflowIds: string[]): void {
		this.toolMappings.set(toolId, workflowIds);
	}

	// Get contextual help suggestions for a tool
	public getToolHelpSuggestions(toolId: string, userContext: WorkflowContext): {
		hints: WorkflowHint[];
		workflows: string[];
		quickTips: string[];
	} {
		const hints = this.getContextualHelp(toolId, userContext);
		const workflows = this.toolMappings.get(toolId) || [];
		const quickTips = this.generateQuickTips(toolId, userContext);

		return { hints, workflows, quickTips };
	}

	// Generate quick tips for a tool
	private generateQuickTips(toolId: string, userContext: WorkflowContext): string[] {
		const tips: string[] = [];
		const completedWorkflows = userContext.userData.completedWorkflows || [];

		// Tool-specific tips
		switch (toolId) {
			case 'json-formatter':
				if (!completedWorkflows.includes('json-formatting-basics')) {
					tips.push('Try the JSON formatting workflow to learn advanced features.');
				}
				tips.push('Use keyboard shortcuts: Ctrl+Shift+F to format quickly.');
				break;

			case 'code-executor':
				if (!completedWorkflows.includes('execution-basics')) {
					tips.push('New to code execution? Try our guided tutorial.');
				}
				tips.push('The code runs in a secure sandbox environment.');
				break;

			case 'regex-tester':
				tips.push('Build complex patterns step by step for better results.');
				if (!completedWorkflows.includes('regex-basics')) {
					tips.push('Learn regex fundamentals with our interactive workflow.');
				}
				break;
		}

		return tips;
	}

	// Helper method to get workflow by ID (would integrate with workflow manager)
	private getWorkflowById(workflowId: string): Workflow | null {
		// This would integrate with the workflow manager
		return null;
	}
}

// Help Rule Engine for filtering hints based on user context
class HelpRuleEngine {
	filterHints(hints: WorkflowHint[], userContext: WorkflowContext): WorkflowHint[] {
		return hints.filter(hint => this.shouldShowHint(hint, userContext));
	}

	private shouldShowHint(hint: WorkflowHint, userContext: WorkflowContext): boolean {
		// Don't show advanced hints to beginners
		if (userContext.userData.skillLevel === 'beginner' && hint.type === 'advanced') {
			return false;
		}

		// Don't show hints user has already seen
		const seenHints = userContext.userData.seenHints || [];
		if (seenHints.includes(hint.title)) {
			return false;
		}

		// Show error hints only when there are errors
		if (hint.trigger === 'error' && userContext.userData.errorCount === 0) {
			return false;
		}

		// Respect user preferences
		if (userContext.userData.showHints === false) {
			return false;
		}

		return true;
	}
}

// Export singleton instance
export const contextualHelp = ContextualHelpSystem.getInstance();
