import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	initialSearchState,
	createDebouncedSearch,
	searchTool,
	filterTool,
	searchAndFilterTools,
	getFilterOptions,
	generateSearchSuggestions,
	highlightSearchText,
	calculateRelevanceScore,
	sortSearchResults,
	useSearch,
} from '@/lib/search-utils';
import { mockTools, mockSearchStates, mockSearchQueries } from '../utils/test-data';

describe('search-utils', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe('initialSearchState', () => {
		it('should have correct initial state', () => {
			expect(initialSearchState).toEqual({
				query: '',
				categories: [],
				difficulties: [],
				processingTypes: [],
				securityTypes: [],
				features: [],
				tags: [],
				status: [],
				isNew: null,
				isPopular: null,
			});
		});
	});

	describe('createDebouncedSearch', () => {
		it('should create a debounced function', () => {
			const mockCallback = vi.fn();
			const debouncedFn = createDebouncedSearch(mockCallback, 100);

			debouncedFn('test');
			debouncedFn('test2');
			debouncedFn('test3');

			expect(mockCallback).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(mockCallback).toHaveBeenCalledTimes(1);
			expect(mockCallback).toHaveBeenCalledWith('test3');
		});

		it('should use default delay when not specified', () => {
			const mockCallback = vi.fn();
			const debouncedFn = createDebouncedSearch(mockCallback);

			debouncedFn('test');
			vi.advanceTimersByTime(300);
			expect(mockCallback).toHaveBeenCalledWith('test');
		});

		it('should not call callback if cleared before delay', () => {
			const mockCallback = vi.fn();
			const debouncedFn = createDebouncedSearch(mockCallback, 100);

			debouncedFn('test');
			debouncedFn.cancel?.();
			vi.advanceTimersByTime(100);

			expect(mockCallback).not.toHaveBeenCalled();
		});
	});

	describe('searchTool', () => {
		it('should return true for empty query', () => {
			expect(searchTool(mockTools[0], '')).toBe(true);
			expect(searchTool(mockTools[0], '   ')).toBe(true);
		});

		it('should search by tool name', () => {
			const tool = mockTools[0]; // JSON Formatter
			expect(searchTool(tool, 'json')).toBe(true);
			expect(searchTool(tool, 'formatter')).toBe(true);
			expect(searchTool(tool, 'JSON FORMATTER')).toBe(true);
		});

		it('should search by description', () => {
			const tool = mockTools[0]; // JSON Formatter
			expect(searchTool(tool, 'format')).toBe(true);
			expect(searchTool(tool, 'validate')).toBe(true);
		});

		it('should search by category', () => {
			const tool = mockTools[0]; // JSON Processing
			expect(searchTool(tool, 'json processing')).toBe(true);
			expect(searchTool(tool, 'processing')).toBe(true);
		});

		it('should search by tags', () => {
			const tool = mockTools[0]; // tags: ['json', 'formatter', 'validator', 'beautifier']
			expect(searchTool(tool, 'json')).toBe(true);
			expect(searchTool(tool, 'validator')).toBe(true);
			expect(searchTool(tool, 'beautifier')).toBe(true);
		});

		it('should search by features', () => {
			const tool = mockTools[0]; // features include 'Format & Beautify'
			expect(searchTool(tool, 'format & beautify')).toBe(true);
			expect(searchTool(tool, 'validation')).toBe(true);
		});

		it('should be case insensitive', () => {
			const tool = mockTools[0];
			expect(searchTool(tool, 'JSON')).toBe(true);
			expect(searchTool(tool, 'Json')).toBe(true);
			expect(searchTool(tool, 'json')).toBe(true);
		});

		it('should return false for non-matching queries', () => {
			const tool = mockTools[0];
			expect(searchTool(tool, 'nonexistent')).toBe(false);
			expect(searchTool(tool, 'xyz123')).toBe(false);
		});
	});

	describe('filterTool', () => {
		const tool = mockTools[0]; // JSON Formatter

		it('should return true for empty filters', () => {
			expect(filterTool(tool, {})).toBe(true);
			expect(filterTool(tool, { categories: [] })).toBe(true);
		});

		it('should filter by category', () => {
			expect(filterTool(tool, { categories: ['JSON Processing'] })).toBe(true);
			expect(filterTool(tool, { categories: ['Code Execution'] })).toBe(false);
			expect(filterTool(tool, { categories: ['JSON Processing', 'Code Execution'] })).toBe(true);
		});

		it('should filter by difficulty', () => {
			expect(filterTool(tool, { difficulties: ['beginner'] })).toBe(true);
			expect(filterTool(tool, { difficulties: ['advanced'] })).toBe(false);
		});

		it('should filter by processing type', () => {
			expect(filterTool(tool, { processingTypes: ['client-side'] })).toBe(true);
			expect(filterTool(tool, { processingTypes: ['server-side'] })).toBe(false);
		});

		it('should filter by security type', () => {
			expect(filterTool(tool, { securityTypes: ['local-only'] })).toBe(true);
			expect(filterTool(tool, { securityTypes: ['network-required'] })).toBe(false);
		});

		it('should filter by features', () => {
			expect(filterTool(tool, { features: ['Format & Beautify'] })).toBe(true);
			expect(filterTool(tool, { features: ['Nonexistent Feature'] })).toBe(false);
			expect(filterTool(tool, { features: ['Format & Beautify', 'Syntax Validation'] })).toBe(true);
		});

		it('should filter by tags', () => {
			expect(filterTool(tool, { tags: ['json'] })).toBe(true);
			expect(filterTool(tool, { tags: ['formatter'] })).toBe(true);
			expect(filterTool(tool, { tags: ['nonexistent'] })).toBe(false);
		});

		it('should filter by status', () => {
			expect(filterTool(tool, { status: ['stable'] })).toBe(true);
			expect(filterTool(tool, { status: ['beta'] })).toBe(false);
		});

		it('should filter by isNew flag', () => {
			const newTool = { ...tool, isNew: true };
			expect(filterTool(newTool, { isNew: true })).toBe(true);
			expect(filterTool(newTool, { isNew: false })).toBe(false);
			expect(filterTool(tool, { isNew: false })).toBe(true);
			expect(filterTool(tool, { isNew: true })).toBe(false);
		});

		it('should filter by isPopular flag', () => {
			const popularTool = { ...tool, isPopular: true };
			expect(filterTool(popularTool, { isPopular: true })).toBe(true);
			expect(filterTool(popularTool, { isPopular: false })).toBe(false);
		});

		it('should handle multiple filters combined', () => {
			const filters = {
				categories: ['JSON Processing'],
				difficulties: ['beginner'],
				processingTypes: ['client-side'],
				securityTypes: ['local-only'],
				tags: ['json'],
				status: ['stable'],
				isNew: false,
				isPopular: true,
			};
			expect(filterTool({ ...tool, isPopular: true }, filters)).toBe(true);
		});
	});

	describe('searchAndFilterTools', () => {
		it('should combine search and filter functionality', () => {
			const searchState = {
				...mockSearchStates.withMultipleFilters,
				query: 'json',
			};
			const results = searchAndFilterTools(mockTools, searchState);

			expect(results.length).toBeGreaterThan(0);
			results.forEach(tool => {
				expect(searchTool(tool, searchState.query)).toBe(true);
				expect(filterTool(tool, searchState)).toBe(true);
			});
		});

		it('should return all tools for empty state', () => {
			const results = searchAndFilterTools(mockTools, initialSearchState);
			expect(results).toEqual(mockTools);
		});
	});

	describe('getFilterOptions', () => {
		it('should extract unique filter options from tools', () => {
			const options = getFilterOptions(mockTools);

			expect(options.categories).toContain('JSON Processing');
			expect(options.categories).toContain('Code Execution');
			expect(options.difficulties).toContain('beginner');
			expect(options.difficulties).toContain('intermediate');
			expect(options.processingTypes).toContain('client-side');
			expect(options.securityTypes).toContain('local-only');
			expect(options.features.length).toBeGreaterThan(0);
			expect(options.tags.length).toBeGreaterThan(0);
			expect(options.status).toContain('stable');
			expect(options.status).toContain('beta');
		});

		it('should sort filter options alphabetically', () => {
			const options = getFilterOptions(mockTools);

			expect(options.categories).toEqual([...options.categories].sort());
			expect(options.difficulties).toEqual([...options.difficulties].sort());
			expect(options.tags).toEqual([...options.tags].sort());
		});

		it('should handle empty tools array', () => {
			const options = getFilterOptions([]);
			expect(options.categories).toEqual([]);
			expect(options.difficulties).toEqual([]);
			expect(options.processingTypes).toEqual([]);
			expect(options.securityTypes).toEqual([]);
			expect(options.features).toEqual([]);
			expect(options.tags).toEqual([]);
			expect(options.status).toEqual([]);
		});
	});

	describe('generateSearchSuggestions', () => {
		it('should generate suggestions for query', () => {
			const suggestions = generateSearchSuggestions(mockTools, 'json', 5);
			expect(suggestions.length).toBeGreaterThan(0);
			expect(suggestions).toContain('json');
			expect(suggestions).toContain('JSON Processing');
		});

		it('should limit suggestions by maxSuggestions', () => {
			const suggestions = generateSearchSuggestions(mockTools, 'f', 3);
			expect(suggestions.length).toBeLessThanOrEqual(3);
		});

		it('should return empty array for empty query', () => {
			expect(generateSearchSuggestions(mockTools, '')).toEqual([]);
			expect(generateSearchSuggestions(mockTools, '   ')).toEqual([]);
		});

		it('should use default maxSuggestions when not specified', () => {
			const suggestions = generateSearchSuggestions(mockTools, 'json');
			expect(suggestions.length).toBeLessThanOrEqual(5);
		});

		it('should generate unique suggestions', () => {
			const suggestions = generateSearchSuggestions(mockTools, 'format', 10);
			const uniqueSuggestions = [...new Set(suggestions)];
			expect(suggestions).toEqual(uniqueSuggestions);
		});
	});

	describe('highlightSearchText', () => {
		it('should highlight matching text', () => {
			const result = highlightSearchText('JSON Formatter', 'JSON');
			expect(result).toContain('<span class="bg-yellow-200 dark:bg-yellow-800">JSON</span>');
		});

		it('should use custom highlight class', () => {
			const result = highlightSearchText('JSON Formatter', 'JSON', 'highlight-class');
			expect(result).toContain('<span class="highlight-class">JSON</span>');
		});

		it('should return original text for empty query', () => {
			expect(highlightSearchText('JSON Formatter', '')).toBe('JSON Formatter');
			expect(highlightSearchText('JSON Formatter', '   ')).toBe('JSON Formatter');
		});

		it('should handle special regex characters', () => {
			const result = highlightSearchText('Test (Tool)', '(Tool)');
			expect(result).toContain('<span class="bg-yellow-200 dark:bg-yellow-800">(Tool)</span>');
		});

		it('should be case insensitive', () => {
			const result1 = highlightSearchText('JSON Formatter', 'json');
			const result2 = highlightSearchText('JSON Formatter', 'JSON');
			expect(result1).toBe(result2);
		});

		it('should highlight multiple occurrences', () => {
			const result = highlightSearchText('JSON JSON Formatter', 'JSON');
			const matches = result.match(/<span/g);
			expect(matches?.length).toBe(2);
		});
	});

	describe('calculateRelevanceScore', () => {
		const tool = mockTools[0]; // JSON Formatter

		it('should return 0 for empty query', () => {
			expect(calculateRelevanceScore(tool, '')).toBe(0);
			expect(calculateRelevanceScore(tool, '   ')).toBe(0);
		});

		it('should give highest score for exact name match', () => {
			expect(calculateRelevanceScore(tool, 'JSON Formatter')).toBe(100);
		});

		it('should give high score for name start match', () => {
			expect(calculateRelevanceScore(tool, 'JSON')).toBe(80);
		});

		it('should give moderate score for name inclusion', () => {
			expect(calculateRelevanceScore(tool, 'Format')).toBe(60);
		});

		it('should add points for description match', () => {
			const score = calculateRelevanceScore(tool, 'format');
			expect(score).toBeGreaterThan(60); // Should include description match bonus
		});

		it('should add points for exact tag match', () => {
			const score = calculateRelevanceScore(tool, 'json');
			expect(score).toBeGreaterThan(40); // Should include tag match bonus
		});

		it('should add points for feature match', () => {
			const score = calculateRelevanceScore(tool, 'validation');
			expect(score).toBeGreaterThan(10); // Should include feature match bonus
		});

		it('should add points for category match', () => {
			const score = calculateRelevanceScore(tool, 'processing');
			expect(score).toBeGreaterThan(5); // Should include category match bonus
		});

		it('should add bonus for popular tools', () => {
			const popularTool = { ...tool, isPopular: true };
			const regularScore = calculateRelevanceScore(tool, 'json');
			const popularScore = calculateRelevanceScore(popularTool, 'json');
			expect(popularScore).toBe(regularScore + 10);
		});
	});

	describe('sortSearchResults', () => {
		it('should return original order for empty query', () => {
			const results = sortSearchResults(mockTools, '');
			expect(results).toEqual(mockTools);
		});

		it('should sort by relevance score', () => {
			const results = sortSearchResults(mockTools, 'json');
			const scores = results.map(tool => calculateRelevanceScore(tool, 'json'));

			// Verify scores are in descending order
			for (let i = 1; i < scores.length; i++) {
				expect(scores[i-1]).toBeGreaterThanOrEqual(scores[i]);
			}
		});

		it('should prioritize popular tools for equal scores', () => {
			const toolsWithSameScore = [
				mockTools[0], // Popular JSON tool
				{ ...mockTools[1], isPopular: false }, // Non-popular JSON tool
			];
			const results = sortSearchResults(toolsWithSameScore, 'json');
			expect(results[0].isPopular).toBe(true);
		});

		it('should sort alphabetically for equal scores and popularity', () => {
			const toolsWithSameScore = [
				{ ...mockTools[0], name: 'B Tool', isPopular: false },
				{ ...mockTools[1], name: 'A Tool', isPopular: false },
			];
			const results = sortSearchResults(toolsWithSameScore, 'tool');
			expect(results[0].name).toBe('A Tool');
			expect(results[1].name).toBe('B Tool');
		});
	});

	describe('useSearch', () => {
		it('should initialize with provided query', () => {
			const mockHook = require('@/lib/search-utils').useSearch;
			// This would need React Testing Library for full testing
			// For now, we'll test the function exists and has expected structure
			expect(typeof mockHook).toBe('function');
		});
	});

	describe('Integration Tests', () => {
		it('should handle complete search workflow', () => {
			// Search with query
			const query = 'json';
			let results = mockTools.filter(tool => searchTool(tool, query));
			expect(results.length).toBeGreaterThan(0);

			// Apply filters
			const filters = {
				categories: ['JSON Processing'],
				difficulties: ['beginner'],
			};
			results = results.filter(tool => filterTool(tool, filters));
			expect(results.length).toBeGreaterThan(0);

			// Sort by relevance
			results = sortSearchResults(results, query);
			expect(results[0].name).toContain('JSON');
		});

		it('should handle edge cases gracefully', () => {
			// Empty tools array
			expect(searchAndFilterTools([], mockSearchStates.withQuery)).toEqual([]);

			// Invalid search state
			const invalidState = { query: null, categories: null } as any;
			expect(() => searchAndFilterTools(mockTools, invalidState)).not.toThrow();

			// Special characters in query
			const specialQuery = 'json!@#$%^&*()';
			const results = searchAndFilterTools(mockTools, { ...initialSearchState, query: specialQuery });
			expect(Array.isArray(results)).toBe(true);
		});
	});
});
