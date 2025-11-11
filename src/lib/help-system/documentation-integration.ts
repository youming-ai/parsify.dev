/**
 * Documentation Integration System
 * Integrates help system with existing documentation and provides guided workflows
 */

import type {
	HelpContent,
	HelpContext,
	UserHelpProfile,
	UserExpertiseLevel
} from '@/types/help-system';

export interface DocumentationSource {
	id: string;
	name: string;
	url: string;
	type: 'markdown' | 'api-docs' | 'tutorial' | 'video' | 'external';
	priority: number;
	authRequired?: boolean;
	cacheable: boolean;
	lastUpdated: Date;
}

export interface GuidedWorkflow {
	id: string;
	name: string;
	description: string;
	category: string;
	targetAudience: UserExpertiseLevel[];
	steps: WorkflowStep[];
	prerequisites: string[];
	outcomes: string[];
	estimatedTime: number;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	tags: string[];
	relatedTools: string[];
	relatedHelp: string[];
}

export interface WorkflowStep {
	id: string;
	title: string;
	description: string;
	type: 'action' | 'navigation' | 'learning' | 'interaction' | 'validation';
	target?: string;
	content?: string;
	expectedOutcome?: string;
	hint?: string;
	timeLimit?: number;
	optional: boolean;
	skipConditions?: string[];
	completionConditions?: string[];
	helpContent?: string;
}

export interface DocumentationLink {
	url: string;
	title: string;
	description: string;
	type: 'external' | 'internal';
	section?: string;
	anchor?: string;
	relevanceScore: number;
}

export interface WorkflowSession {
	id: string;
	workflowId: string;
	userId: string;
	startTime: Date;
	currentStep: number;
	status: 'active' | 'paused' | 'completed' | 'abandoned';
	progress: number;
	completedSteps: string[];
	skippedSteps: string[];
	timeSpent: number;
	context: Record<string, any>;
}

export class DocumentationIntegration {
	private static instance: DocumentationIntegration;
	private documentationSources: Map<string, DocumentationSource> = new Map();
	private guidedWorkflows: Map<string, GuidedWorkflow> = new Map();
	private workflowSessions: Map<string, WorkflowSession> = new Map();
	private documentationCache: Map<string, CachedDocumentation> = new Map();
	private contentIndex: Map<string, string[]> = new Map(); // keyword -> content URLs

	private constructor() {
		this.initializeDocumentationSources();
		this.initializeGuidedWorkflows();
		this.buildContentIndex();
	}

	static getInstance(): DocumentationIntegration {
		if (!DocumentationIntegration.instance) {
			DocumentationIntegration.instance = new DocumentationIntegration();
		}
		return DocumentationIntegration.instance;
	}

	/**
	 * Get relevant documentation links for current context
	 */
	getRelevantDocumentation(
		context: HelpContext,
		userProfile: UserHelpProfile,
		maxResults: number = 5
	): DocumentationLink[] {
		const keywords = this.extractKeywords(context);
		const relevantLinks: DocumentationLink[] = [];

		// Search cached documentation
		for (const keyword of keywords) {
			const urls = this.contentIndex.get(keyword.toLowerCase()) || [];
			for (const url of urls) {
				const doc = this.getDocumentationFromCache(url);
				if (doc && this.isRelevantToUser(doc, userProfile, context)) {
					relevantLinks.push({
						url: doc.url,
						title: doc.title,
						description: doc.description || '',
						type: doc.sourceId.startsWith('external-') ? 'external' : 'internal',
						relevanceScore: this.calculateRelevance(doc, keywords, context),
					});
				}
			}
		}

		// Sort by relevance and remove duplicates
		const uniqueLinks = relevantLinks.filter((link, index, self) =>
			index === self.findIndex(l => l.url === link.url)
		);

		return uniqueLinks
			.sort((a, b) => b.relevanceScore - a.relevanceScore)
			.slice(0, maxResults);
	}

	/**
	 * Get available guided workflows
	 */
	getAvailableWorkflows(
		userProfile: UserHelpProfile,
		context?: HelpContext
	): GuidedWorkflow[] {
		const workflows = Array.from(this.guidedWorkflows.values());

		return workflows.filter(workflow => {
			// Check audience match
			if (!workflow.targetAudience.includes(userProfile.expertiseLevel)) {
				return false;
			}

			// Check prerequisites
			if (!this.hasCompletedPrerequisites(workflow.prerequisites, userProfile)) {
				return false;
			}

			// Check if already completed
			if (userProfile.completedTours.includes(workflow.id)) {
				return false;
			}

			// Contextual filtering
			if (context && workflow.category) {
				return this.isWorkflowRelevantToContext(workflow, context);
			}

			return true;
		});
	}

	/**
	 * Start a guided workflow session
	 */
	startWorkflow(
		workflowId: string,
		userId: string,
		context: Record<string, any> = {}
	): WorkflowSession | null {
		const workflow = this.guidedWorkflows.get(workflowId);
		if (!workflow) return null;

		const sessionId = this.generateSessionId();
		const session: WorkflowSession = {
			id: sessionId,
			workflowId,
			userId,
			startTime: new Date(),
			currentStep: 0,
			status: 'active',
			progress: 0,
			completedSteps: [],
			skippedSteps: [],
			timeSpent: 0,
			context,
		};

		this.workflowSessions.set(sessionId, session);
		return session;
	}

	/**
	 * Get current workflow step
	 */
	getCurrentWorkflowStep(sessionId: string): WorkflowStep | null {
		const session = this.workflowSessions.get(sessionId);
		if (!session || session.status !== 'active') return null;

		const workflow = this.guidedWorkflows.get(session.workflowId);
		if (!workflow) return null;

		return workflow.steps[session.currentStep] || null;
	}

	/**
	 * Complete current workflow step
	 */
	completeWorkflowStep(
		sessionId: string,
		data: Record<string, any> = {}
	): { success: boolean; nextStep?: WorkflowStep; completed?: boolean } {
		const session = this.workflowSessions.get(sessionId);
		if (!session || session.status !== 'active') {
			return { success: false };
		}

		const workflow = this.guidedWorkflows.get(session.workflowId);
		if (!workflow) return { success: false };

		const currentStep = workflow.steps[session.currentStep];
		if (!currentStep) return { success: false };

		// Mark step as completed
		session.completedSteps.push(currentStep.id);
		session.currentStep++;

		// Update progress
		session.progress = (session.completedSteps.length / workflow.steps.length) * 100;

		// Check if workflow is complete
		if (session.currentStep >= workflow.steps.length) {
			session.status = 'completed';
			session.endTime = new Date();
			session.timeSpent = session.endTime.getTime() - session.startTime.getTime();
			return { success: true, completed: true };
		}

		// Get next step
		const nextStep = workflow.steps[session.currentStep];
		return { success: true, nextStep };
	}

	/**
	 * Skip current workflow step
	 */
	skipWorkflowStep(sessionId: string, reason: string = ''): boolean {
		const session = this.workflowSessions.get(sessionId);
		if (!session || session.status !== 'active') return false;

		const workflow = this.guidedWorkflows.get(session.workflowId);
		if (!workflow) return false;

		const currentStep = workflow.steps[session.currentStep];
		if (!currentStep || !currentStep.optional) return false;

		// Mark step as skipped
		session.skippedSteps.push(currentStep.id);
		session.currentStep++;

		// Update progress (skipped steps don't count toward completion)
		const requiredSteps = workflow.steps.filter(step => !step.optional).length;
		const completedRequiredSteps = session.completedSteps.filter(stepId =>
			workflow.steps.find(step => step.id === stepId && !step.optional)
		).length;
		session.progress = (completedRequiredSteps / requiredSteps) * 100;

		return true;
	}

	/**
	 * Get workflow recommendations based on context and user profile
	 */
	getWorkflowRecommendations(
		userId: string,
		context: HelpContext,
		userProfile: UserHelpProfile
	): WorkflowRecommendation[] {
		const availableWorkflows = this.getAvailableWorkflows(userProfile, context);
		const recommendations: WorkflowRecommendation[] = [];

		for (const workflow of availableWorkflows) {
			const relevanceScore = this.calculateWorkflowRelevance(workflow, context, userProfile);
			if (relevanceScore > 0.3) { // Minimum relevance threshold
				recommendations.push({
					workflow,
					relevanceScore,
					reason: this.getRecommendationReason(workflow, context, userProfile),
					priority: this.getRecommendationPriority(workflow, relevanceScore),
				});
			}
		}

		return recommendations.sort((a, b) => b.priority - a.priority);
	}

	/**
	 * Search documentation
	 */
	async searchDocumentation(
		query: string,
		filters: DocumentationSearchFilters = {}
	): Promise<DocumentationSearchResult[]> {
		const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
		const results: DocumentationSearchResult[] = [];

		// Search through indexed content
		for (const keyword of keywords) {
			const urls = this.contentIndex.get(keyword) || [];
			for (const url of urls) {
				const doc = this.getDocumentationFromCache(url);
				if (doc && this.matchesFilters(doc, filters)) {
					const relevanceScore = this.calculateSearchRelevance(doc, keywords);
					const snippet = this.generateSnippet(doc, keywords);

					results.push({
						url: doc.url,
						title: doc.title,
						description: doc.description || '',
						type: doc.sourceId.startsWith('external-') ? 'external' : 'internal',
						relevanceScore,
						snippet,
						lastUpdated: doc.lastUpdated,
						source: doc.sourceId,
					});
				}
			}
		}

		// Remove duplicates and sort
		const uniqueResults = results.filter((result, index, self) =>
			index === self.findIndex(r => r.url === result.url)
		);

		return uniqueResults
			.sort((a, b) => b.relevanceScore - a.relevanceScore)
			.slice(0, filters.limit || 20);
	}

	/**
	 * Generate contextual help content from documentation
	 */
	async generateContextualHelp(
		context: HelpContext,
		maxLength: number = 300
	): Promise<string | null> {
		const relevantDocs = this.getRelevantDocumentation(context, {} as UserHelpProfile, 3);

		if (relevantDocs.length === 0) return null;

		// Try to fetch and synthesize content from top result
		const topDoc = relevantDocs[0];
		const content = await this.fetchDocumentationContent(topDoc.url);

		if (!content) return null;

		// Extract relevant section based on context
		const relevantSection = this.extractRelevantSection(content, context);

		// Truncate to max length and add attribution
		const truncated = this.truncateContent(relevantSection, maxLength);
		return `${truncated}\\n\\n*From: ${topDoc.title}*`;
	}

	// Private methods

	private async initializeDocumentationSources(): Promise<void> {
		// Internal documentation sources
		const internalSources: DocumentationSource[] = [
			{
				id: 'internal-docs',
				name: 'Parsify.dev Documentation',
				url: '/docs',
				type: 'markdown',
				priority: 100,
				cacheable: true,
				lastUpdated: new Date(),
			},
			{
				id: 'api-docs',
				name: 'API Documentation',
				url: '/docs/api',
				type: 'api-docs',
				priority: 90,
				cacheable: true,
				lastUpdated: new Date(),
			},
			{
				id: 'tutorials',
				name: 'Tutorials',
				url: '/docs/tutorials',
				type: 'tutorial',
				priority: 80,
				cacheable: true,
				lastUpdated: new Date(),
			},
		];

		// External documentation sources
		const externalSources: DocumentationSource[] = [
			{
				id: 'external-mdn',
				name: 'MDN Web Docs',
				url: 'https://developer.mozilla.org',
				type: 'external',
				priority: 70,
				cacheable: true,
				lastUpdated: new Date(),
			},
		];

		[...internalSources, ...externalSources].forEach(source => {
			this.documentationSources.set(source.id, source);
		});
	}

	private initializeGuidedWorkflows(): void {
		const workflows: GuidedWorkflow[] = [
			{
				id: 'getting-started-tour',
				name: 'Getting Started Tour',
				description: 'Learn the basics of Parsify.dev platform',
				category: 'onboarding',
				targetAudience: ['beginner'],
				steps: [
					{
						id: 'welcome',
						title: 'Welcome to Parsify.dev',
						description: 'Let\'s explore the developer tools platform',
						type: 'learning',
						content: 'Parsify.dev offers 58+ developer tools across 6 categories.',
					},
					{
						id: 'explore-categories',
						title: 'Explore Tool Categories',
						description: 'Discover different categories of developer tools',
						type: 'navigation',
						target: '.category-navigation',
					},
					{
						id: 'try-json-tool',
						title: 'Try a JSON Tool',
						description: 'Let\'s format some JSON data',
						type: 'action',
						target: '/tools/json/formatter',
					},
				],
				prerequisites: [],
				outcomes: ['Understand platform layout', 'Know how to find tools'],
				estimatedTime: 5,
				difficulty: 'beginner',
				tags: ['onboarding', 'beginner', 'tour'],
				relatedTools: ['json-formatter'],
				relatedHelp: ['getting-started-basics'],
			},
			{
				id: 'json-workflow-advanced',
				name: 'Advanced JSON Processing Workflow',
				description: 'Learn advanced JSON processing techniques',
				category: 'json-processing',
				targetAudience: ['intermediate', 'advanced'],
				steps: [
					{
						id: 'json-schema',
						title: 'Understanding JSON Schema',
						description: 'Learn how to create and use JSON schemas',
						type: 'learning',
						content: 'JSON Schema provides a way to validate JSON data.',
					},
					{
						id: 'create-schema',
						title: 'Create a JSON Schema',
						description: 'Generate a schema from sample JSON data',
						type: 'action',
						target: '/tools/json/schema-generator',
					},
					{
						id: 'validate-data',
						title: 'Validate JSON Data',
						description: 'Use the schema to validate JSON data',
						type: 'action',
						target: '/tools/json/validator',
					},
				],
				prerequisites: ['basic-json-knowledge'],
				outcomes: ['Can create JSON schemas', 'Can validate JSON data'],
				estimatedTime: 15,
				difficulty: 'intermediate',
				tags: ['json', 'schema', 'validation', 'advanced'],
				relatedTools: ['json-schema-generator', 'json-validator'],
				relatedHelp: ['json-schema-basics', 'json-validation'],
			},
		];

		workflows.forEach(workflow => {
			this.guidedWorkflows.set(workflow.id, workflow);
		});
	}

	private async buildContentIndex(): Promise<void> {
		// Build keyword index for documentation search
		// This would typically crawl documentation sources
		const mockIndex = new Map<string, string[]>();

		// Mock index for demonstration
		mockIndex.set('json', ['/docs/json-guide', '/tools/json/formatter']);
		mockIndex.set('format', ['/docs/json-guide', '/tools/json/formatter']);
		mockIndex.set('validate', ['/docs/validation', '/tools/json/validator']);
		mockIndex.set('schema', ['/docs/json-schema', '/tools/json/schema-generator']);

		this.contentIndex = mockIndex;
	}

	private extractKeywords(context: HelpContext): string[] {
		const keywords: string[] = [];

		// Extract from tool ID
		if (context.toolId) {
			keywords.push(...context.toolId.split('-'));
		}

		// Extract from context type
		keywords.push(context.type);

		// Extract from user action
		if (context.userAction) {
			keywords.push(...context.userAction.split(' '));
		}

		// Extract from metadata
		if (context.metadata) {
			Object.values(context.metadata).forEach(value => {
				if (typeof value === 'string') {
					keywords.push(...value.split(' '));
				}
			});
		}

		return keywords.filter(keyword => keyword.length > 2);
	}

	private isRelevantToUser(
		doc: CachedDocumentation,
		userProfile: UserHelpProfile,
		context: HelpContext
	): boolean {
		// Check if document is appropriate for user level
		// This would typically use document metadata
		return true;
	}

	private calculateRelevance(
		doc: CachedDocumentation,
		keywords: string[],
		context: HelpContext
	): number {
		let score = 0;

		// Keyword matching in title
		keywords.forEach(keyword => {
			if (doc.title.toLowerCase().includes(keyword)) {
				score += 10;
			}
		});

		// Keyword matching in content
		keywords.forEach(keyword => {
			if (doc.content?.toLowerCase().includes(keyword)) {
				score += 5;
			}
		});

		// Context matching
		if (context.toolId && doc.url.includes(context.toolId)) {
			score += 15;
		}

		return score;
	}

	private hasCompletedPrerequisites(prerequisites: string[], userProfile: UserHelpProfile): boolean {
		// Check if user has completed prerequisite workflows
		return prerequisites.every(prereq => userProfile.completedTours.includes(prereq));
	}

	private isWorkflowRelevantToContext(workflow: GuidedWorkflow, context: HelpContext): boolean {
		// Check if workflow is relevant to current context
		if (workflow.category === 'onboarding' && context.type === 'first-visit') {
			return true;
		}

		if (workflow.relatedTools.includes(context.toolId || '')) {
			return true;
		}

		return false;
	}

	private calculateWorkflowRelevance(
		workflow: GuidedWorkflow,
		context: HelpContext,
		userProfile: UserHelpProfile
	): number {
		let score = 0.5; // Base score

		// Category relevance
		if (workflow.category === 'onboarding' && context.type === 'first-visit') {
			score += 0.4;
		}

		// Tool relevance
		if (workflow.relatedTools.includes(context.toolId || '')) {
			score += 0.3;
		}

		// Help relevance
		if (workflow.relatedHelp.some(helpId => context.metadata.helpId === helpId)) {
			score += 0.2;
		}

		// User level match
		if (workflow.targetAudience.includes(userProfile.expertiseLevel)) {
			score += 0.1;
		}

		return Math.min(1.0, score);
	}

	private getRecommendationReason(
		workflow: GuidedWorkflow,
		context: HelpContext,
		userProfile: UserHelpProfile
	): string {
		if (workflow.category === 'onboarding' && userProfile.sessionCount <= 3) {
			return 'Perfect for getting started with the platform';
		}

		if (workflow.relatedTools.includes(context.toolId || '')) {
			return `Learn more about ${context.toolId} related features`;
		}

		return 'Recommended based on your current activity';
	}

	private getRecommendationPriority(workflow: GuidedWorkflow, relevanceScore: number): number {
		let priority = workflow.difficulty === 'beginner' ? 80 : 60;
		priority += Math.round(relevanceScore * 20);
		return priority;
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private matchesFilters(doc: CachedDocumentation, filters: DocumentationSearchFilters): boolean {
		if (filters.type && !doc.url.includes(filters.type)) {
			return false;
		}
		if (filters.source && !doc.sourceId.includes(filters.source)) {
			return false;
		}
		return true;
	}

	private calculateSearchRelevance(doc: CachedDocumentation, keywords: string[]): number {
		let score = 0;
		const content = (doc.title + ' ' + (doc.content || '')).toLowerCase();

		keywords.forEach(keyword => {
			const titleMatches = (doc.title.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
			const contentMatches = (content.match(new RegExp(keyword, 'g')) || []).length;

			score += titleMatches * 10 + contentMatches * 2;
		});

		return score;
	}

	private generateSnippet(doc: CachedDocumentation, keywords: string[]): string {
		if (!doc.content) return doc.description || '';

		const content = doc.content.toLowerCase();
		let bestSnippet = '';
		let bestScore = 0;

		keywords.forEach(keyword => {
			const index = content.indexOf(keyword);
			if (index !== -1) {
				const start = Math.max(0, index - 50);
				const end = Math.min(content.length, index + keyword.length + 50);
				const snippet = doc.content!.substring(start, end);
				const score = this.calculateSearchRelevance(doc, [keyword]);

				if (score > bestScore) {
					bestScore = score;
					bestSnippet = snippet;
				}
			}
		});

		return bestSnippet || (doc.description || '').substring(0, 200) + '...';
	}

	private async fetchDocumentationContent(url: string): Promise<string | null> {
		// In production, this would fetch the actual documentation content
		// For now, return mock content
		return null;
	}

	private extractRelevantSection(content: string, context: HelpContext): string {
		// Extract content relevant to the current context
		// This would use more sophisticated content analysis
		return content.substring(0, 500);
	}

	private truncateContent(content: string, maxLength: number): string {
		if (content.length <= maxLength) return content;

		const truncated = content.substring(0, maxLength - 3);
		const lastSpace = truncated.lastIndexOf(' ');
		return truncated.substring(0, lastSpace) + '...';
	}

	private getDocumentationFromCache(url: string): CachedDocumentation | null {
		return this.documentationCache.get(url) || null;
	}
}

// Supporting types
export interface DocumentationSearchFilters {
	type?: string;
	source?: string;
	dateFrom?: Date;
	dateTo?: Date;
	limit?: number;
}

export interface DocumentationSearchResult {
	url: string;
	title: string;
	description: string;
	type: 'internal' | 'external';
	relevanceScore: number;
	snippet: string;
	lastUpdated: Date;
	source: string;
}

export interface WorkflowRecommendation {
	workflow: GuidedWorkflow;
	relevanceScore: number;
	reason: string;
	priority: number;
}

interface CachedDocumentation {
	url: string;
	title: string;
	description?: string;
	content?: string;
	sourceId: string;
	lastUpdated: Date;
}

export default DocumentationIntegration;
