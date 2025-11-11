/**
 * Help Content Management System
 * Manages help content with versioning, caching, and updates
 */

import type {
	HelpContent,
	HelpCategory,
	HelpContextType,
	UserExpertiseLevel,
	HelpPriority,
	HelpContentMetadata,
	HelpLink
} from '@/types/help-system';

export interface HelpContentVersion {
	version: string;
	content: HelpContent;
	createdAt: Date;
	createdBy: string;
	changelog: string;
	deprecated: boolean;
	migrationNotes?: string;
}

export interface HelpContentTemplate {
	id: string;
	name: string;
	description: string;
	structure: ContentStructure;
	defaultMetadata: Partial<HelpContentMetadata>;
	variables: TemplateVariable[];
}

export interface ContentStructure {
	sections: ContentSection[];
	order: string[];
}

export interface ContentSection {
	id: string;
	type: 'text' | 'code' | 'list' | 'image' | 'video' | 'interactive';
	title: string;
	content: string;
	variables?: string[];
	metadata?: Record<string, any>;
}

export interface TemplateVariable {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	default?: any;
	required: boolean;
	description: string;
	options?: any[];
}

export class HelpContentManager {
	private static instance: HelpContentManager;
	private content: Map<string, HelpContent> = new Map();
	private versions: Map<string, HelpContentVersion[]> = new Map();
	private templates: Map<string, HelpContentTemplate> = new Map();
	private cache: Map<string, CachedContent> = new Map();
	private lastUpdated: Date = new Date();

	private constructor() {
		this.initializeDefaultContent();
		this.initializeDefaultTemplates();
	}

	static getInstance(): HelpContentManager {
		if (!HelpContentManager.instance) {
			HelpContentManager.instance = new HelpContentManager();
		}
		return HelpContentManager.instance;
	}

	/**
	 * Get help content by ID
	 */
	getContent(id: string, version?: string): HelpContent | null {
		const cached = this.cache.get(id);
		if (cached && !this.isCacheExpired(cached)) {
			return cached.content;
		}

		const content = this.content.get(id);
		if (content) {
			this.cache.set(id, {
				content,
				timestamp: Date.now(),
			});
			return content;
		}

		return null;
	}

	/**
	 * Get all help content, optionally filtered
	 */
	getAllContent(filters?: ContentFilters): HelpContent[] {
		let content = Array.from(this.content.values());

		if (filters) {
			if (filters.categories?.length) {
				content = content.filter(item =>
					filters.categories!.some(cat => item.categories.includes(cat))
				);
			}
			if (filters.contexts?.length) {
				content = content.filter(item =>
					filters.contexts!.some(ctx => item.contexts.includes(ctx))
				);
			}
			if (filters.audience?.length) {
				content = content.filter(item =>
					filters.audience!.some(level => item.targetAudience.includes(level))
				);
			}
			if (filters.priority?.length) {
				content = content.filter(item =>
					filters.priority!.includes(item.priority)
				);
			}
			if (filters.search) {
				const query = filters.search.toLowerCase();
				content = content.filter(item =>
					item.title.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query) ||
					item.metadata.keywords.some(keyword => keyword.toLowerCase().includes(query))
				);
			}
		}

		return content.sort((a, b) => {
			// Sort by priority first
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
			if (priorityDiff !== 0) return priorityDiff;

			// Then by last updated
			return b.lastUpdated.getTime() - a.lastUpdated.getTime();
		});
	}

	/**
	 * Add or update help content
	 */
	async saveContent(
		content: HelpContent,
		version?: string,
		changelog?: string,
		createdBy?: string
	): Promise<void> {
		// Validate content
		this.validateContent(content);

		// Create version entry
		if (changelog || version) {
			const versions = this.versions.get(content.id) || [];
			const newVersion: HelpContentVersion = {
				version: version || this.generateVersionNumber(content.id),
				content: { ...content },
				createdAt: new Date(),
				createdBy: createdBy || 'system',
				changelog: changelog || 'Content updated',
				deprecated: false,
			};

			versions.push(newVersion);
			this.versions.set(content.id, versions);
		}

		// Update content
		this.content.set(content.id, {
			...content,
			lastUpdated: new Date(),
		});

		// Clear cache
		this.cache.delete(content.id);
		this.lastUpdated = new Date();

		// Persist changes (in production, this would save to a database)
		await this.persistContent();
	}

	/**
	 * Create help content from template
	 */
	createFromTemplate(
		templateId: string,
		variables: Record<string, any>,
		overrides: Partial<HelpContent> = {}
	): HelpContent {
		const template = this.templates.get(templateId);
		if (!template) {
			throw new Error(`Template not found: ${templateId}`);
		}

		// Validate required variables
		for (const variable of template.variables) {
			if (variable.required && !(variable.name in variables)) {
				throw new Error(`Required variable missing: ${variable.name}`);
			}
		}

		// Process content sections
		const processedSections = template.structure.sections.map(section => ({
			...section,
			content: this.processTemplateVariables(section.content, variables),
		}));

		// Generate content from processed sections
		const contentText = processedSections
			.sort((a, b) => template.structure.order.indexOf(a.id) - template.structure.order.indexOf(b.id))
			.map(section => this.formatSection(section))
			.filter(Boolean);

		// Create help content
		const content: HelpContent = {
			id: this.generateContentId(template.name, variables),
			title: this.processTemplateVariables(template.name, variables),
			description: this.processTemplateVariables(template.description, variables),
			content: contentText,
			categories: overrides.categories || (this.inferCategoriesFromTemplate(template) as HelpCategory[]),
			targetAudience: overrides.targetAudience || ['beginner'],
			priority: overrides.priority || 'medium',
			deliveryMethods: overrides.deliveryMethods || ['tooltip', 'modal'],
			contexts: overrides.contexts || this.inferContextsFromTemplate(template),
			relatedHelpIds: overrides.relatedHelpIds || [],
			version: '1.0.0',
			lastUpdated: new Date(),
			deprecated: false,
			locale: overrides.locale || 'en',
			metadata: {
				estimatedReadTime: this.calculateReadTime(contentText),
				keywords: this.extractKeywords(contentText),
				author: overrides.metadata?.author || 'system',
				tags: overrides.metadata?.tags || [],
				searchableText: this.generateSearchableText(contentText, template, variables),
				...template.defaultMetadata,
				...overrides.metadata,
			},
		};

		return content;
	}

	/**
	 * Get version history for content
	 */
	getVersionHistory(contentId: string): HelpContentVersion[] {
		return this.versions.get(contentId) || [];
	}

	/**
	 * Restore content to a specific version
	 */
	restoreToVersion(contentId: string, version: string): boolean {
		const versions = this.versions.get(contentId);
		if (!versions) return false;

		const targetVersion = versions.find(v => v.version === version);
		if (!targetVersion || targetVersion.deprecated) return false;

		this.content.set(contentId, {
			...targetVersion.content,
			lastUpdated: new Date(),
		});

		this.cache.delete(contentId);
		this.lastUpdated = new Date();

		return true;
	}

	/**
	 * Search help content
	 */
	searchContent(
		query: string,
		filters?: ContentFilters,
		options?: SearchOptions
	): SearchResult[] {
		const content = this.getAllContent(filters);
		const results: SearchResult[] = [];

		for (const item of content) {
			const relevanceScore = this.calculateRelevance(item, query);
			if (relevanceScore > 0) {
				results.push({
					content: item,
					relevanceScore,
					snippets: this.generateSnippets(item, query, options?.snippetLength || 150),
					matchContext: this.getMatchContext(item, query),
				});
			}
		}

		// Sort by relevance score
		results.sort((a, b) => b.relevanceScore - a.relevanceScore);

		// Apply pagination
		if (options) {
			const start = options.offset || 0;
			const end = start + (options.limit || 20);
			return results.slice(start, end);
		}

		return results;
	}

	/**
	 * Get content statistics
	 */
	getStatistics(): ContentStatistics {
		const content = Array.from(this.content.values());

		return {
			totalContent: content.length,
			contentByCategory: this.groupByField(content, 'categories'),
			contentByContext: this.groupByField(content, 'contexts'),
			contentByAudience: this.groupByField(content, 'targetAudience'),
			contentByPriority: this.groupByField(content, 'priority'),
			averageReadTime: this.calculateAverage(content, 'metadata.estimatedReadTime'),
			lastUpdated: this.lastUpdated,
			versionedContent: this.versions.size,
		};
	}

	/**
	 * Validate help content
	 */
	validateContent(content: HelpContent): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required fields
		if (!content.id) errors.push('Content ID is required');
		if (!content.title) errors.push('Title is required');
		if (!content.description) errors.push('Description is required');
		if (!content.content.length) errors.push('Content sections are required');

		// Field validation
		if (content.title.length > 100) {
			warnings.push('Title is too long (> 100 characters)');
		}
		if (content.description.length > 500) {
			warnings.push('Description is too long (> 500 characters)');
		}
		if (content.categories.length === 0) {
			warnings.push('No categories specified');
		}
		if (content.contexts.length === 0) {
			warnings.push('No contexts specified');
		}

		// Metadata validation
		if (content.metadata.estimatedReadTime < 0) {
			errors.push('Estimated read time cannot be negative');
		}
		if (content.metadata.keywords.length > 20) {
			warnings.push('Too many keywords (> 20)');
		}

		// Version format validation
		if (!this.isValidVersionFormat(content.version)) {
			warnings.push('Version should follow semantic versioning (x.y.z)');
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Process template variables in text
	 */
	private processTemplateVariables(text: string, variables: Record<string, any>): string {
		return text.replace(/\\{\\{(\\w+)\\}\\}/g, (match, variableName) => {
			return variables[variableName] !== undefined ? String(variables[variableName]) : match;
		});
	}

	/**
	 * Format content section
	 */
	private formatSection(section: ContentSection): string | null {
		switch (section.type) {
			case 'text':
				return section.content;
			case 'list':
				return section.content.split('\\n').map(line => `- ${line}`).join('\\n');
			case 'code':
				return `\\`\\`\\`\\n${section.content}\\n\\`\\`\\``;
			case 'image':
				return `[Image: ${section.title}](${section.content})`;
			case 'video':
				return `[Video: ${section.title}](${section.content})`;
			default:
				return null;
		}
	}

	/**
	 * Initialize default help content
	 */
	private initializeDefaultContent(): void {
		const defaultContent: HelpContent[] = [
			{
				id: 'getting-started-basics',
				title: 'Getting Started with Parsify.dev',
				description: 'Learn the basics of using Parsify.dev developer tools platform',
				content: [
					'Welcome to Parsify.dev! This platform provides over 58 developer tools across 6 categories.',
					'You can browse tools by category, search for specific functionality, or use the quick access menu.',
					'Tools are organized into JSON Processing, Code Processing, File Processing, Network Utilities, Text Processing, and Security & Encryption.',
				],
				categories: ['getting-started'],
				targetAudience: ['beginner'],
				priority: 'high',
				deliveryMethods: ['modal', 'sidebar'],
				contexts: ['first-visit', 'feature-discovery'],
				relatedHelpIds: ['tool-navigation', 'keyboard-shortcuts'],
				version: '1.0.0',
				lastUpdated: new Date(),
				deprecated: false,
				locale: 'en',
				metadata: {
					estimatedReadTime: 2,
					keywords: ['getting started', 'introduction', 'basics', 'overview'],
					author: 'system',
					tags: ['tutorial', 'beginner'],
					searchableText: 'getting started basics tutorial introduction overview platform',
				},
			},
			{
				id: 'json-formatter-basics',
				title: 'JSON Formatter Usage',
				description: 'How to use the JSON formatter tool effectively',
				content: [
					'The JSON Formatter helps you format and beautify JSON data with customizable options.',
					'Simply paste your JSON data in the input area and it will be automatically formatted.',
					'You can customize indentation, sort keys, and validate syntax.',
				],
				categories: ['feature-explanation'],
				targetAudience: ['beginner', 'intermediate'],
				priority: 'medium',
				deliveryMethods: ['tooltip', 'modal', 'sidebar'],
				contexts: ['tool-page', 'component-hover'],
				relatedHelpIds: ['json-validator', 'json-converter'],
				version: '1.2.0',
				lastUpdated: new Date(),
				deprecated: false,
				locale: 'en',
				metadata: {
					estimatedReadTime: 3,
					keywords: ['json', 'format', 'beautify', 'indentation'],
					author: 'system',
					tags: ['tool', 'json', 'formatting'],
					searchableText: 'tool:json-formatter json format beautify indent sort validate syntax',
				},
			},
		];

		defaultContent.forEach(content => {
			this.content.set(content.id, content);
		});
	}

	/**
	 * Initialize default templates
	 */
	private initializeDefaultTemplates(): void {
		const toolHelpTemplate: HelpContentTemplate = {
			id: 'tool-help',
			name: '{{toolName}} Help',
			description: 'Comprehensive help for the {{toolName}} tool',
			structure: {
				sections: [
					{
						id: 'overview',
						type: 'text',
						title: 'Overview',
						content: '{{toolDescription}}',
					},
					{
						id: 'usage',
						type: 'text',
						title: 'How to Use',
						content: '{{usageInstructions}}',
					},
					{
						id: 'examples',
						type: 'code',
						title: 'Examples',
						content: '{{codeExamples}}',
					},
				],
				order: ['overview', 'usage', 'examples'],
			},
			defaultMetadata: {
				estimatedReadTime: 3,
				author: 'system',
				tags: ['tool', 'help'],
			},
			variables: [
				{
					name: 'toolName',
					type: 'string',
					required: true,
					description: 'Name of the tool',
				},
				{
					name: 'toolDescription',
					type: 'string',
					required: true,
					description: 'Description of what the tool does',
				},
				{
					name: 'usageInstructions',
					type: 'string',
					required: true,
					description: 'Step-by-step usage instructions',
				},
				{
					name: 'codeExamples',
					type: 'string',
					required: false,
					description: 'Code examples for the tool',
				},
			],
		};

		this.templates.set('tool-help', toolHelpTemplate);
	}

	// Helper methods
	private generateContentId(templateName: string, variables: Record<string, any>): string {
		const key = Object.keys(variables).sort().map(k => `${k}:${variables[k]}`).join('|');
		return btoa(`${templateName}:${key}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
	}

	private generateVersionNumber(contentId: string): string {
		const versions = this.versions.get(contentId) || [];
		const latestVersion = versions[versions.length - 1];
		if (!latestVersion) return '1.0.0';

		const parts = latestVersion.version.split('.').map(Number);
		parts[2]++; // Increment patch version
		return parts.join('.');
	}

	private inferCategoriesFromTemplate(template: HelpContentTemplate): string[] {
		// Simple inference based on template name and structure
		if (template.name.includes('tool')) return ['feature-explanation'];
		if (template.name.includes('error')) return ['troubleshooting'];
		return ['getting-started'];
	}

	private inferContextsFromTemplate(template: HelpContentTemplate): string[] {
		if (template.name.includes('tool')) return ['tool-page'];
		return ['feature-discovery'];
	}

	private calculateReadTime(content: string[]): number {
		const wordsPerMinute = 200;
		const totalWords = content.join(' ').split(' ').length;
		return Math.ceil(totalWords / wordsPerMinute);
	}

	private extractKeywords(content: string[]): string[] {
		const text = content.join(' ').toLowerCase();
		const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
		return text.split(/\\W+/)
			.filter(word => word.length > 3 && !commonWords.has(word))
			.slice(0, 10);
	}

	private generateSearchableText(content: string[], template?: HelpContentTemplate, variables?: Record<string, any>): string {
		const text = content.join(' ').toLowerCase();
		const vars = variables ? Object.values(variables).join(' ').toLowerCase() : '';
		return `${text} ${vars} ${template?.name.toLowerCase() || ''}`;
	}

	private calculateRelevance(content: HelpContent, query: string): number {
		const queryLower = query.toLowerCase();
		let score = 0;

		// Title match
		if (content.title.toLowerCase().includes(queryLower)) {
			score += 100;
		}

		// Description match
		if (content.description.toLowerCase().includes(queryLower)) {
			score += 50;
		}

		// Keyword matches
		content.metadata.keywords.forEach(keyword => {
			if (keyword.toLowerCase().includes(queryLower)) {
				score += 30;
			}
		});

		// Content matches
		content.content.forEach(section => {
			if (section.toLowerCase().includes(queryLower)) {
				score += 20;
			}
		});

		return score;
	}

	private generateSnippets(content: HelpContent, query: string, maxLength: number): string[] {
		const queryLower = query.toLowerCase();
		const snippets: string[] = [];

		content.content.forEach(section => {
			const index = section.toLowerCase().indexOf(queryLower);
			if (index !== -1) {
				const start = Math.max(0, index - 50);
				const end = Math.min(section.length, index + query.length + 50);
				let snippet = section.substring(start, end);
				if (start > 0) snippet = '...' + snippet;
				if (end < section.length) snippet = snippet + '...';
				snippets.push(snippet);
			}
		});

		return snippets.slice(0, 3); // Max 3 snippets
	}

	private getMatchContext(content: HelpContent, query: string): string[] {
		const contexts: string[] = [];
		const queryLower = query.toLowerCase();

		if (content.title.toLowerCase().includes(queryLower)) contexts.push('title');
		if (content.description.toLowerCase().includes(queryLower)) contexts.push('description');
		if (content.metadata.keywords.some(k => k.toLowerCase().includes(queryLower))) contexts.push('keywords');
		if (content.content.some(s => s.toLowerCase().includes(queryLower))) contexts.push('content');

		return contexts;
	}

	private groupByField(content: HelpContent[], fieldPath: string): Record<string, number> {
		return content.reduce((acc, item) => {
			const value = this.getNestedValue(item, fieldPath);
			if (Array.isArray(value)) {
				value.forEach(v => {
					acc[v] = (acc[v] || 0) + 1;
				});
			} else {
				acc[value] = (acc[value] || 0) + 1;
			}
			return acc;
		}, {} as Record<string, number>);
	}

	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}

	private calculateAverage(content: HelpContent[], path: string): number {
		const values = content.map(item => this.getNestedValue(item, path)).filter(v => typeof v === 'number');
		return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
	}

	private isValidVersionFormat(version: string): boolean {
		return /^\\d+\\.\\d+\\.\\d+/.test(version);
	}

	private isCacheExpired(cached: CachedContent): boolean {
		const cacheTimeout = 5 * 60 * 1000; // 5 minutes
		return Date.now() - cached.timestamp > cacheTimeout;
	}

	private async persistContent(): Promise<void> {
		// In production, this would save to a database or file system
		// For now, just log that content was updated
		console.log('Help content updated:', this.lastUpdated);
	}
}

// Supporting types
export interface ContentFilters {
	categories?: HelpCategory[];
	contexts?: HelpContextType[];
	audience?: UserExpertiseLevel[];
	priority?: HelpPriority[];
	search?: string;
}

export interface SearchOptions {
	limit?: number;
	offset?: number;
	snippetLength?: number;
}

export interface SearchResult {
	content: HelpContent;
	relevanceScore: number;
	snippets: string[];
	matchContext: string[];
}

export interface ContentStatistics {
	totalContent: number;
	contentByCategory: Record<string, number>;
	contentByContext: Record<string, number>;
	contentByAudience: Record<string, number>;
	contentByPriority: Record<string, number>;
	averageReadTime: number;
	lastUpdated: Date;
	versionedContent: number;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

interface CachedContent {
	content: HelpContent;
	timestamp: number;
}

export default HelpContentManager;
