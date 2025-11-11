import type {
	DocumentationSearchResult,
	DocumentationNavigation,
	ToolDocumentation,
	TutorialCollection,
	WorkflowDocumentation,
	Tool,
	ToolCategory,
	DocumentationCategory,
	SearchFilter,
	RelatedContent,
	BreadcrumbItem,
} from '@/types/documentation';
import type { ToolDifficulty, ProcessingType, SecurityType } from '@/types/tools';

export class DocumentationSearchNavigationSystem {
	private static instance: DocumentationSearchNavigationSystem;
	private searchIndex: Map<string, SearchIndexEntry[]> = new Map();
	private navigationTree: NavigationTree | null = null;
	private searchHistory: Map<string, SearchHistoryEntry[]> = new Map();
	private popularSearches: PopularSearch[] = [];
	private searchSuggestions: Map<string, string[]> = new Map();
	private contentIndex: ContentIndex = new Map();

	private constructor() {
		this.initializeSearchIndex();
		this.buildNavigationTree();
		this.initializeSearchSuggestions();
	}

	static getInstance(): DocumentationSearchNavigationSystem {
		if (!DocumentationSearchNavigationSystem.instance) {
			DocumentationSearchNavigationSystem.instance = new DocumentationSearchNavigationSystem();
		}
		return DocumentationSearchNavigationSystem.instance;
	}

	// Comprehensive search across all documentation
	public async search(
		query: string,
		filters?: SearchFilters,
		options?: SearchOptions
	): Promise<SearchResults> {
		const startTime = Date.now();

		// Process query
		const processedQuery = this.processQuery(query);

		// Get search results from different sources
		const results = await this.performSearch(processedQuery, filters, options);

		// Rank and sort results
		const rankedResults = this.rankResults(results, processedQuery);

		// Apply pagination
		const paginatedResults = this.applyPagination(rankedResults, options);

		const searchTime = Date.now() - startTime;

		// Record search
		this.recordSearch(query, results.length, searchTime);

		// Update popular searches
		this.updatePopularSearches(query);

		return {
			query: processedQuery.original,
			results: paginatedResults.results,
			totalResults: paginatedResults.total,
			facets: this.generateFacets(results),
			suggestions: this.generateSuggestions(processedQuery),
			searchTime,
			filters: filters || {},
			pagination: paginatedResults.pagination,
		};
	}

	// Get navigation structure
	public getNavigation(toolId?: string): DocumentationNavigation {
		if (!this.navigationTree) {
			this.buildNavigationTree();
		}

		const rootCategories = this.getRootCategories();
		const currentPath = this.getCurrentPath(toolId);
		const breadcrumbs = this.generateBreadcrumbs(toolId);
		const relatedContent = this.getRelatedContent(toolId);
		const filters = this.getAvailableFilters();

		return {
			rootCategories,
			currentPath,
			breadcrumbs,
			relatedContent,
			filters,
		};
	}

	// Advanced search with natural language processing
	public async advancedSearch(
		request: AdvancedSearchRequest
	): Promise<AdvancedSearchResults> {
		const results = await this.performAdvancedSearch(request);

		return {
			query: request.query,
			results: results.items,
			totalResults: results.total,
			facets: results.facets,
			filters: results.filters,
			sorting: results.sorting,
			pagination: results.pagination,
			searchTime: results.searchTime,
			recommendations: results.recommendations,
		};
	}

	// Get search suggestions as user types
	public getSearchSuggestions(
		partialQuery: string,
		limit: number = 10
	): string[] {
		const suggestions = this.searchSuggestions.get(partialQuery.toLowerCase()) || [];
		return suggestions.slice(0, limit);
	}

	// Get popular searches
	public getPopularSearches(limit: number = 10): PopularSearch[] {
		return this.popularSearches
			.sort((a, b) => b.frequency - a.frequency)
			.slice(0, limit);
	}

	// Get search history for user
	public getSearchHistory(userId: string, limit: number = 20): SearchHistoryEntry[] {
		const history = this.searchHistory.get(userId) || [];
		return history
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, limit);
	}

	// Clear search history for user
	public clearSearchHistory(userId: string): void {
		this.searchHistory.delete(userId);
	}

	// Build contextual search for specific tool
	public buildContextualSearch(toolId: string): ContextualSearch {
		const toolDocumentation = this.getToolDocumentation(toolId);
		const relatedTools = this.getRelatedTools(toolId);
		const context = this.buildSearchContext(toolId);

		return {
			toolId,
			context,
			preferredResults: this.getPreferredResults(toolId),
			excludedFilters: this.getExcludedFilters(toolId),
			boostedContent: this.getBoostedContent(toolId),
		};
	}

	// Initialize search index
	private initializeSearchIndex(): void {
		// This would be called with actual documentation data
		// For now, set up the structure
		console.log('Initializing search index...');

		// Index tools
		this.indexTools();

		// Index tutorials
		this.indexTutorials();

		// Index workflows
		this.indexWorkflows();

		// Index examples
		this.indexExamples();
	}

	// Index tools documentation
	private indexTools(): void {
		// Implementation would iterate through all tools and index their content
		const tools = this.getAllTools(); // This would get actual tools

		tools.forEach(tool => {
			const entry: SearchIndexEntry = {
				id: tool.id,
				type: 'tool',
				title: tool.name,
				description: tool.description,
				content: this.extractToolContent(tool),
				tags: tool.tags,
				category: tool.category,
				url: `/tools/${tool.id}/docs`,
				lastUpdated: new Date(),
				weight: this.calculateToolWeight(tool),
			};

			this.addToIndex(entry);
		});
	}

	// Index tutorials
	private indexTutorials(): void {
		const tutorials = this.getAllTutorials();

		tutorials.forEach(tutorial => {
			const entry: SearchIndexEntry = {
				id: tutorial.id,
				type: 'tutorial',
				title: tutorial.title,
				description: tutorial.description,
				content: this.extractTutorialContent(tutorial),
				tags: tutorial.tags || [],
				category: tutorial.category,
				url: `/tutorials/${tutorial.id}`,
				lastUpdated: tutorial.lastUpdated,
				weight: this.calculateTutorialWeight(tutorial),
			};

			this.addToIndex(entry);
		});
	}

	// Add entry to search index
	private addToIndex(entry: SearchIndexEntry): void {
		// Add to main index
		if (!this.searchIndex.has('main')) {
			this.searchIndex.set('main', []);
		}
		this.searchIndex.get('main')!.push(entry);

		// Add to category-specific indexes
		const categoryIndex = `category:${entry.category}`;
		if (!this.searchIndex.has(categoryIndex)) {
			this.searchIndex.set(categoryIndex, []);
		}
		this.searchIndex.get(categoryIndex)!.push(entry);

		// Add to type-specific indexes
		const typeIndex = `type:${entry.type}`;
		if (!this.searchIndex.has(typeIndex)) {
			this.searchIndex.set(typeIndex, []);
		}
		this.searchIndex.get(typeIndex)!.push(entry);
	}

	// Perform actual search
	private async performSearch(
		query: ProcessedQuery,
		filters?: SearchFilters,
		options?: SearchOptions
	): Promise<DocumentationSearchResult[]> {
		let results: DocumentationSearchResult[] = [];

		// Search main index
		const mainResults = this.searchIndex.get('main') || [];
		results.push(...this.searchInEntries(mainResults, query));

		// Apply filters
		if (filters) {
			results = this.applyFilters(results, filters);
		}

		// Apply boosters
		results = this.applyBoosters(results, query, options);

		return results;
	}

	// Search in index entries
	private searchInEntries(
		entries: SearchIndexEntry[],
		query: ProcessedQuery
	): DocumentationSearchResult[] {
		return entries.map(entry => {
			const score = this.calculateRelevanceScore(entry, query);

			if (score > 0) {
				return {
					id: entry.id,
					type: entry.type,
					title: entry.title,
					description: entry.description,
					content: entry.content,
					relevanceScore: score,
					highlights: this.extractHighlights(entry, query),
					breadcrumbs: this.generateBreadcrumbsForEntry(entry),
					url: entry.url,
					lastUpdated: entry.lastUpdated,
				};
			}

			return null;
		}).filter((result): result is DocumentationSearchResult => result !== null);
	}

	// Calculate relevance score
	private calculateRelevanceScore(
		entry: SearchIndexEntry,
		query: ProcessedQuery
	): number {
		let score = 0;

		// Title matches (highest weight)
		const titleMatch = this.textMatch(entry.title, query);
		if (titleMatch.exact) {
			score += 100;
		} else if (titleMatch.partial) {
			score += 50;
		}

		// Description matches
		const descriptionMatch = this.textMatch(entry.description, query);
		if (descriptionMatch.exact) {
			score += 30;
		} else if (descriptionMatch.partial) {
			score += 15;
		}

		// Content matches
		const contentMatch = this.textMatch(entry.content, query);
		if (contentMatch.exact) {
			score += 20;
		} else if (contentMatch.partial) {
			score += 10;
		}

		// Tag matches
		const tagMatches = entry.tags.filter(tag =>
			query.terms.some(term =>
				tag.toLowerCase().includes(term.toLowerCase())
			)
		).length;
		score += tagMatches * 5;

		// Apply weight
		score *= entry.weight;

		// Apply recency boost
		const daysSinceUpdate = (Date.now() - entry.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
		const recencyBoost = Math.max(0, 1 - daysSinceUpdate / 365);
		score *= (1 + recencyBoost * 0.1);

		return score;
	}

	// Text matching utility
	private textMatch(text: string, query: ProcessedQuery): { exact: boolean; partial: boolean } {
		const lowerText = text.toLowerCase();

		// Check for exact phrase match
		if (query.original && lowerText.includes(query.original.toLowerCase())) {
			return { exact: true, partial: true };
		}

		// Check for partial matches
		const partialMatches = query.terms.filter(term =>
			lowerText.includes(term.toLowerCase())
		);

		return {
			exact: false,
			partial: partialMatches.length > 0,
		};
	}

	// Extract highlights from content
	private extractHighlights(
		entry: SearchIndexEntry,
		query: ProcessedQuery
	): string[] {
		const highlights: string[] = [];
		const sentences = this.splitIntoSentences(entry.content);

		// Find sentences containing query terms
		for (const sentence of sentences) {
			const hasMatch = query.terms.some(term =>
				sentence.toLowerCase().includes(term.toLowerCase())
			);

			if (hasMatch) {
				highlights.push(sentence.trim());
				if (highlights.length >= 3) break;
			}
		}

		return highlights;
	}

	// Build navigation tree
	private buildNavigationTree(): void {
		this.navigationTree = {
			root: {
				id: 'root',
				name: 'Documentation',
				type: 'root',
				children: [],
				url: '/docs',
			},
			categories: this.buildCategories(),
			tools: this.buildToolNodes(),
			tutorials: this.buildTutorialNodes(),
			workflows: this.buildWorkflowNodes(),
		};
	}

	// Generate facets for search results
	private generateFacets(results: DocumentationSearchResult[]): SearchFacet[] {
		const facets: SearchFacet[] = [];

		// Type facet
		const typeCounts = this.countByField(results, 'type');
		facets.push({
			id: 'type',
			name: 'Content Type',
			options: Object.entries(typeCounts).map(([value, count]) => ({
				value,
				label: this.formatLabel(value),
				count,
			})),
		});

		// Category facet
		const categoryCounts = this.countByField(results, 'category');
		facets.push({
			id: 'category',
			name: 'Category',
			options: Object.entries(categoryCounts).map(([value, count]) => ({
				value,
				label: this.formatLabel(value),
				count,
			})),
		});

		return facets;
	}

	// Generate search suggestions
	private generateSuggestions(query: ProcessedQuery): string[] {
		const suggestions: string[] = [];

		// Add suggestions from search suggestions map
		const baseSuggestions = this.searchSuggestions.get(query.terms[0]?.toLowerCase()) || [];
		suggestions.push(...baseSuggestions);

		// Add auto-complete suggestions
		const autoSuggestions = this.generateAutoComplete(query);
		suggestions.push(...autoSuggestions);

		// Remove duplicates and limit
		return [...new Set(suggestions)].slice(0, 10);
	}

	// Record search for analytics
	private recordSearch(query: string, resultCount: number, searchTime: number): void {
		const entry: SearchHistoryEntry = {
			query,
			resultCount,
			searchTime,
			timestamp: new Date(),
		};

		// Add to global history (for analytics)
		if (!this.searchHistory.has('global')) {
			this.searchHistory.set('global', []);
		}
		this.searchHistory.get('global')!.push(entry);

		// Limit history size
		const globalHistory = this.searchHistory.get('global')!;
		if (globalHistory.length > 10000) {
			globalHistory.splice(0, globalHistory.length - 10000);
		}
	}

	// Update popular searches
	private updatePopularSearches(query: string): void {
		const existingSearch = this.popularSearches.find(s => s.query === query);

		if (existingSearch) {
			existingSearch.frequency++;
			existingSearch.lastSearched = new Date();
		} else {
			this.popularSearches.push({
				query,
				frequency: 1,
				lastSearched: new Date(),
			});
		}

		// Keep only top 100 popular searches
		this.popularSearches.sort((a, b) => b.frequency - a.frequency);
		if (this.popularSearches.length > 100) {
			this.popularSearches = this.popularSearches.slice(0, 100);
		}
	}

	// Utility methods
	private processQuery(query: string): ProcessedQuery {
		// Clean and normalize query
		const cleaned = query.trim().toLowerCase();
		const terms = cleaned.split(/\s+/).filter(term => term.length > 2);

		return {
			original: query,
			normalized: cleaned,
			terms,
		};
	}

	private rankResults(results: DocumentationSearchResult[], query: ProcessedQuery): DocumentationSearchResult[] {
		return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
	}

	private applyPagination(
		results: DocumentationSearchResult[],
		options?: SearchOptions
	): PaginatedResults {
		const page = options?.page || 1;
		const limit = options?.limit || 20;
		const offset = (page - 1) * limit;

		return {
			results: results.slice(offset, offset + limit),
			total: results.length,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(results.length / limit),
				hasNext: offset + limit < results.length,
				hasPrev: page > 1,
			},
		};
	}

	private applyFilters(
		results: DocumentationSearchResult[],
		filters: SearchFilters
	): DocumentationSearchResult[] {
		return results.filter(result => {
			if (filters.type && !filters.type.includes(result.type)) {
				return false;
			}

			if (filters.category && result.category && !filters.category.includes(result.category)) {
				return false;
			}

			if (filters.tags && !filters.tags.some(tag =>
				result.tags?.includes(tag)
			)) {
				return false;
			}

			return true;
		});
	}

	private applyBoosters(
		results: DocumentationSearchResult[],
		query: ProcessedQuery,
		options?: SearchOptions
	): DocumentationSearchResult[] {
		// Apply boosters based on user preferences, recency, etc.
		return results.map(result => {
			let boostedScore = result.relevanceScore;

			// Boost popular content
			if (options?.boostPopular) {
				boostedScore *= 1.1;
			}

			// Boost recent content
			const daysSinceUpdate = (Date.now() - result.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
			if (daysSinceUpdate < 30) {
				boostedScore *= 1.05;
			}

			return {
				...result,
				relevanceScore: boostedScore,
			};
		});
	}

	// Placeholder methods that would be implemented with actual data
	private getAllTools(): Tool[] {
		return []; // Would return actual tools
	}

	private getAllTutorials(): TutorialCollection[] {
		return []; // Would return actual tutorials
	}

	private extractToolContent(tool: Tool): string {
		return `${tool.name} ${tool.description} ${tool.tags.join(' ')}`;
	}

	private extractTutorialContent(tutorial: TutorialCollection): string {
		return `${tutorial.title} ${tutorial.description} ${tutorial.tags.join(' ')}`;
	}

	private calculateToolWeight(tool: Tool): number {
		// Calculate weight based on popularity, recency, etc.
		return tool.isPopular ? 1.2 : 1.0;
	}

	private calculateTutorialWeight(tutorial: TutorialCollection): number {
		// Calculate weight based on rating, popularity, etc.
		return (tutorial.rating / 5) * tutorial.popularity / 100;
	}

	private getRootCategories(): DocumentationCategory[] {
		return [
			{
				id: 'json-processing',
				name: 'JSON Processing',
				description: 'Tools for working with JSON data',
				icon: 'FileJson',
				order: 1,
				toolCount: 8,
				tutorialCount: 5,
			},
			{
				id: 'code-execution',
				name: 'Code Execution',
				description: 'Execute and format code',
				icon: 'Terminal',
				order: 2,
				toolCount: 6,
				tutorialCount: 4,
			},
			// Add more categories...
		];
	}

	private getCurrentPath(toolId?: string): string[] {
		if (!toolId) return ['Documentation'];
		return ['Documentation', 'Tools', toolId];
	}

	private generateBreadcrumbs(toolId?: string): BreadcrumbItem[] {
		const breadcrumbs: BreadcrumbItem[] = [
			{ label: 'Documentation', href: '/docs' },
		];

		if (toolId) {
			breadcrumbs.push(
				{ label: 'Tools', href: '/docs/tools' },
				{ label: toolId, isActive: true }
			);
		}

		return breadcrumbs;
	}

	private getRelatedContent(toolId?: string): RelatedContent[] {
		// Implementation would return related content
		return [];
	}

	private getAvailableFilters(): SearchFilter[] {
		return [
			{
				id: 'type',
				label: 'Content Type',
				options: ['tool', 'tutorial', 'workflow', 'example'],
			},
			{
				id: 'category',
				label: 'Category',
				options: ['JSON Processing', 'Code Execution', 'File Processing'],
			},
		];
	}

	private splitIntoSentences(text: string): string[] {
		return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
	}

	private countByField(results: DocumentationSearchResult[], field: keyof DocumentationSearchResult): Record<string, number> {
		const counts: Record<string, number> = {};

		results.forEach(result => {
			const value = result[field] as string;
			if (value) {
				counts[value] = (counts[value] || 0) + 1;
			}
		});

		return counts;
	}

	private formatLabel(value: string): string {
		return value.split(/[-_]/).map(word =>
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}

	private generateAutoComplete(query: ProcessedQuery): string[] {
		// Implementation would generate auto-complete suggestions
		return [];
	}

	private buildCategories(): NavigationNode[] {
		// Build navigation category nodes
		return [];
	}

	private buildToolNodes(): NavigationNode[] {
		// Build tool navigation nodes
		return [];
	}

	private buildTutorialNodes(): NavigationNode[] {
		// Build tutorial navigation nodes
		return [];
	}

	private buildWorkflowNodes(): NavigationNode[] {
		// Build workflow navigation nodes
		return [];
	}

	private async performAdvancedSearch(request: AdvancedSearchRequest): Promise<any> {
		// Implementation for advanced search
		return {
			items: [],
			total: 0,
			facets: [],
			filters: [],
			sorting: [],
			pagination: {},
			searchTime: 0,
			recommendations: [],
		};
	}

	private initializeSearchSuggestions(): void {
		// Initialize search suggestions
		this.searchSuggestions.set('json', ['json format', 'json validator', 'json parser']);
		this.searchSuggestions.set('code', ['code execution', 'code formatter', 'code examples']);
		// Add more suggestions...
	}
}

// Type definitions
interface SearchResults {
	query: string;
	results: DocumentationSearchResult[];
	totalResults: number;
	facets: SearchFacet[];
	suggestions: string[];
	searchTime: number;
	filters: SearchFilters;
	pagination: PaginationInfo;
}

interface AdvancedSearchResults {
	query: string;
	results: any[];
	totalResults: number;
	facets: SearchFacet[];
	filters: SearchFilter[];
	sorting: SortOption[];
	pagination: PaginationInfo;
	searchTime: number;
	recommendations: any[];
}

interface ProcessedQuery {
	original: string;
	normalized: string;
	terms: string[];
}

interface SearchIndexEntry {
	id: string;
	type: 'tool' | 'tutorial' | 'workflow' | 'example' | 'faq';
	title: string;
	description: string;
	content: string;
	tags: string[];
	category: string;
	url: string;
	lastUpdated: Date;
	weight: number;
}

interface NavigationTree {
	root: NavigationNode;
	categories: NavigationNode[];
	tools: NavigationNode[];
	tutorials: NavigationNode[];
	workflows: NavigationNode[];
}

interface NavigationNode {
	id: string;
	name: string;
	type: string;
	children: NavigationNode[];
	url: string;
}

interface SearchFilters {
	type?: string[];
	category?: string[];
	tags?: string[];
	difficulty?: ToolDifficulty[];
	processingType?: ProcessingType[];
	securityType?: SecurityType[];
}

interface SearchOptions {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	boostPopular?: boolean;
	boostRecent?: boolean;
}

interface SearchFacet {
	id: string;
	name: string;
	options: FacetOption[];
}

interface FacetOption {
	value: string;
	label: string;
	count: number;
}

interface SearchFilter {
	id: string;
	label: string;
	options: string[];
}

interface PaginationInfo {
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface PaginatedResults {
	results: DocumentationSearchResult[];
	total: number;
	pagination: PaginationInfo;
}

interface PopularSearch {
	query: string;
	frequency: number;
	lastSearched: Date;
}

interface SearchHistoryEntry {
	query: string;
	resultCount: number;
	searchTime: number;
	timestamp: Date;
}

interface ContextualSearch {
	toolId: string;
	context: SearchContext;
	preferredResults: string[];
	excludedFilters: string[];
	boostedContent: string[];
}

interface SearchContext {
	relatedTools: string[];
	relatedCategories: string[];
	userPreferences: any;
	currentWorkflow?: string;
}

interface AdvancedSearchRequest {
	query: string;
	filters?: SearchFilters;
	sorting?: SortOption[];
	facets?: string[];
	options?: SearchOptions;
}

interface SortOption {
	field: string;
	direction: 'asc' | 'desc';
}

// Content index type
type ContentIndex = Map<string, any>;

export const documentationSearchNavigationSystem = DocumentationSearchNavigationSystem.getInstance();
