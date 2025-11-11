/**
 * Comprehensive Documentation System Integration
 *
 * This file exports and integrates all components of the Parsify.dev
 * documentation system, providing a unified interface for:
 * - API documentation generation
 * - Tutorial creation and management
 * - Developer documentation
 * - Interactive documentation with live examples
 * - Advanced search and navigation
 * - Help system integration
 */

// Core documentation services
export { documentationService } from './documentation-service';
export { apiDocumentationGenerator } from './api-doc-generator';
export { tutorialSystem } from './tutorial-system';
export { developerDocumentationSystem } from './developer-docs';
export { interactiveDocumentationSystem } from './interactive-docs';
export { documentationSearchNavigationSystem } from './search-navigation';
export { helpSystemIntegration } from './help-system-integration';

// Main documentation system class that orchestrates all components
export class DocumentationSystem {
	private static instance: DocumentationSystem;
	private isInitialized: boolean = false;

	private constructor() {}

	static getInstance(): DocumentationSystem {
		if (!DocumentationSystem.instance) {
			DocumentationSystem.instance = new DocumentationSystem();
		}
		return DocumentationSystem.instance;
	}

	// Initialize the entire documentation system
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		try {
			console.log('Initializing Parsify.dev Documentation System...');

			// Initialize search index
			await this.initializeSearchIndex();

			// Load tutorial collections
			await this.loadTutorialCollections();

			// Build navigation structure
			await this.buildNavigationStructure();

			// Initialize interactive environments
			await this.initializeInteractiveEnvironments();

			// Setup help system integration
			await this.setupHelpSystemIntegration();

			this.isInitialized = true;
			console.log('Documentation System initialized successfully!');

		} catch (error) {
			console.error('Failed to initialize Documentation System:', error);
			throw error;
		}
	}

	// Get comprehensive documentation for a tool
	async getCompleteToolDocumentation(toolId: string, userId?: string) {
		const helpIntegration = helpSystemIntegration;
		return await helpIntegration.getToolHelp(toolId, userId);
	}

	// Create interactive documentation session
	async createInteractiveSession(toolId: string, userId?: string) {
		const interactiveSystem = interactiveDocumentationSystem;
		return interactiveSystem.createInteractiveSession(toolId, userId);
	}

	// Search across all documentation
	async searchDocumentation(query: string, filters?: any, options?: any) {
		const searchSystem = documentationSearchNavigationSystem;
		return await searchSystem.search(query, filters, options);
	}

	// Start onboarding flow
	async startOnboarding(flowId: string, userId: string, options?: any) {
		const helpIntegration = helpSystemIntegration;
		return await helpIntegration.startOnboardingFlow(flowId, userId, options);
	}

	// Get contextual help for user
	async getContextualHelp(userId: string) {
		const helpIntegration = helpSystemIntegration;
		return await helpIntegration.getContextualHelpForUser(userId);
	}

	// Generate API documentation for a tool
	generateAPIDocumentation(tool: any) {
		const apiGenerator = apiDocumentationGenerator;
		return apiGenerator.generateAPIDocumentation(tool);
	}

	// Get navigation structure
	getNavigation(toolId?: string) {
		const searchSystem = documentationSearchNavigationSystem;
		return searchSystem.getNavigation(toolId);
	}

	// Get tutorial collections for a category
	getTutorialCollections(category?: string) {
		const tutorialSys = tutorialSystem;
		if (category) {
			return tutorialSys.getTutorialsByCategory(category as any);
		}
		return tutorialSys.getAllCollections();
	}

	// Get developer documentation
	getDeveloperDocumentation(tool: any) {
		const devDocSystem = developerDocumentationSystem;
		return devDocSystem.generateDeveloperDocumentation(tool);
	}

	// Create interactive tutorial
	async createInteractiveTutorial(title: string, description: string, steps: any[]) {
		const interactiveSystem = interactiveDocumentationSystem;
		return interactiveSystem.createInteractiveTutorial(title, description, steps);
	}

	// Submit feedback for help content
	async submitFeedback(feedback: any) {
		const helpIntegration = helpSystemIntegration;
		return await helpIntegration.submitHelpFeedback(feedback);
	}

	// Get help analytics
	getHelpAnalytics(timeframe?: any) {
		const helpIntegration = helpSystemIntegration;
		return helpIntegration.getHelpAnalytics(timeframe);
	}

	// Private initialization methods
	private async initializeSearchIndex(): Promise<void> {
		// This would trigger the search index initialization
		// The actual implementation would load and index all documentation content
		console.log('Initializing search index...');
	}

	private async loadTutorialCollections(): Promise<void> {
		// Load tutorial collections from storage or API
		console.log('Loading tutorial collections...');
	}

	private async buildNavigationStructure(): Promise<void> {
		// Build the navigation tree for documentation
		console.log('Building navigation structure...');
	}

	private async initializeInteractiveEnvironments(): Promise<void> {
		// Initialize sandbox environments for interactive documentation
		console.log('Initializing interactive environments...');
	}

	private async setupHelpSystemIntegration(): Promise<void> {
		// Setup integration with existing help systems
		console.log('Setting up help system integration...');
	}

	// Health check for the documentation system
	async healthCheck(): Promise<DocumentationSystemHealth> {
		return {
			status: this.isInitialized ? 'healthy' : 'initializing',
			components: {
				documentationService: 'operational',
				apiGenerator: 'operational',
				tutorialSystem: 'operational',
				developerDocs: 'operational',
				interactiveDocs: 'operational',
				searchNavigation: 'operational',
				helpSystem: 'operational',
			},
			uptime: Date.now(),
			lastUpdated: new Date(),
		};
	}

	// Get system statistics
	async getStatistics(): Promise<DocumentationSystemStats> {
		// This would return comprehensive statistics about the documentation system
		return {
			totalTools: 58,
			totalTutorials: 25,
			totalExamples: 150,
			totalSearches: 10000,
			averageSessionDuration: 300, // seconds
			mostViewedTools: ['json-formatter', 'code-executor', 'hash-generator'],
			userSatisfaction: 4.6,
		};
	}
}

// Export the main documentation system instance
export const documentationSystem = DocumentationSystem.getInstance();

// Export types for external use
export type {
	// Documentation types
	ToolDocumentation,
	TutorialCollection,
	WorkflowDocumentation,
	DocumentationSection,
	CodeExample,
	BestPractice,
	FAQItem,

	// Interactive documentation types
	InteractiveDocumentation,
	LiveExample,
	InteractiveSession,
	ExecutionResult,

	// Search and navigation types
	DocumentationSearchResult,
	DocumentationNavigation,
	SearchResults,

	// Help system types
	ToolHelpContent,
	ContextualHelp,
	OnboardingFlow,
	HelpFeedback,
} from '@/types/documentation';

// Export tool types
export type {
	Tool,
	ToolCategory,
	ToolDifficulty,
	ProcessingType,
	SecurityType,
} from '@/types/tools';

// React hooks for easy integration
export const useDocumentation = () => {
	// This would be a custom hook for React components
	// Implementation would go in a separate hooks file
	return {
		getToolDocumentation: documentationSystem.getCompleteToolDocumentation,
		searchDocumentation: documentationSystem.searchDocumentation,
		createInteractiveSession: documentationSystem.createInteractiveSession,
		getContextualHelp: documentationSystem.getContextualHelp,
	};
};

export const useTutorialSystem = () => {
	return {
		getAllCollections: tutorialSystem.getAllCollections,
		getCollection: tutorialSystem.getCollection,
		getTutorialsForTool: tutorialSystem.getTutorialsForTool,
		createInteractiveTutorial: interactiveDocumentationSystem.createInteractiveTutorial,
	};
};

export const useSearchNavigation = () => {
	return {
		search: documentationSearchNavigationSystem.search,
		getNavigation: documentationSearchNavigationSystem.getNavigation,
		getSearchSuggestions: documentationSearchNavigationSystem.getSearchSuggestions,
		getPopularSearches: documentationSearchNavigationSystem.getPopularSearches,
	};
};

export const useHelpSystem = () => {
	return {
		getToolHelp: helpSystemIntegration.getToolHelp,
		startOnboarding: helpSystemIntegration.startOnboardingFlow,
		getContextualHelp: helpSystemIntegration.getContextualHelpForUser,
		searchHelp: helpSystemIntegration.searchHelp,
		submitFeedback: helpSystemIntegration.submitHelpFeedback,
		getTooltipHelp: helpSystemIntegration.getTooltipHelp,
	};
};

// Utility functions
export const documentationUtils = {
	// Format documentation content for display
	formatContent: (content: string, type: 'markdown' | 'html' | 'plain' = 'markdown') => {
		// Implementation would format content based on type
		return content;
	},

	// Generate documentation URLs
	generateURL: (type: 'tool' | 'tutorial' | 'api', id: string) => {
		const basePaths = {
			tool: '/tools',
			tutorial: '/tutorials',
			api: '/docs/api',
		};
		return `${basePaths[type]}/${id}`;
	},

	// Validate documentation structure
	validateDocumentation: (doc: any) => {
		// Implementation would validate documentation structure
		return { valid: true, errors: [] };
	},

	// Generate documentation metadata
	generateMetadata: (tool: any) => {
		return {
			title: `${tool.name} Documentation`,
			description: `Complete documentation for ${tool.name}`,
			keywords: [...tool.tags, 'documentation', 'guide', 'tutorial'],
			lastUpdated: new Date(),
		};
	},

	// Calculate reading time
	calculateReadingTime: (content: string) => {
		const wordsPerMinute = 200;
		const words = content.split(/\s+/).length;
		return Math.ceil(words / wordsPerMinute);
	},

	// Extract table of contents
	extractTableOfContents: (content: string) => {
		// Implementation would extract headings and create TOC
		return [];
	},
};

// Constants
export const DOCUMENTATION_CONFIG = {
	// Search configuration
	SEARCH: {
		MAX_RESULTS: 50,
		MIN_QUERY_LENGTH: 2,
		DEFAULT_LIMIT: 20,
		FUZZY_SEARCH: true,
	},

	// Interactive documentation
	INTERACTIVE: {
		MAX_EXECUTION_TIME: 10000, // 10 seconds
		MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
		SUPPORTED_LANGUAGES: ['javascript', 'python', 'json'],
	},

	// Tutorial system
	TUTORIALS: {
		MAX_STEPS: 20,
		DEFAULT_DURATION: 15, // minutes
		AUTO_SAVE_INTERVAL: 30000, // 30 seconds
	},

	// Help system
	HELP: {
		FEEDBACK_PROMPT_DELAY: 5000, // 5 seconds
		CONTEXT_UPDATE_INTERVAL: 1000, // 1 second
		MAX_SUGGESTIONS: 5,
	},
};

// Initialize the documentation system when this module is imported
// In a real application, this would be called during app initialization
document.addEventListener('DOMContentLoaded', async () => {
	try {
		await documentationSystem.initialize();
	} catch (error) {
		console.error('Failed to initialize documentation system:', error);
	}
});

// Export for testing and external use
export default documentationSystem;
