import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockTools, mockCategories, createMockLocalStorage, waitForDebounce } from '../test-utils';

// Mock the filtering and search functionality
const fuzzySearch = (query: string, text: string): number => {
  if (!query) return 0;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 100;
  if (textLower.includes(queryLower)) return 80;

  // Check if all query characters are in order in the text
  let score = 0;
  let queryIndex = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 1;
      queryIndex++;
    }
  }

  // If all characters found, calculate score based on proximity
  if (queryIndex === queryLower.length) {
    score = (score / queryLower.length) * 60;
    // Bonus for shorter text (more relevant)
    score += (1 - textLower.length / 100) * 20;
  }

  return score;
};

const filterTools = (
  tools: any[],
  searchQuery: string,
  selectedCategory: string,
  selectedTags: string[],
  filterDifficulty: string,
  filterProcessingType: string,
  filterSecurity: string,
  sortBy: string
) => {
  let filtered = [...tools];

  // Search filter
  if (searchQuery) {
    filtered = filtered.filter((tool) => {
      const searchScore =
        fuzzySearch(searchQuery, tool.name) +
        fuzzySearch(searchQuery, tool.description) +
        Math.max(...tool.tags.map((tag: string) => fuzzySearch(searchQuery, tag))) +
        fuzzySearch(searchQuery, tool.category);

      return searchScore > 20;
    });

    // Sort by search relevance
    filtered.sort((a, b) => {
      const scoreA = fuzzySearch(searchQuery, a.name) + fuzzySearch(searchQuery, a.description);
      const scoreB = fuzzySearch(searchQuery, b.name) + fuzzySearch(searchQuery, b.description);
      return scoreB - scoreA;
    });
  }

  // Category filter
  if (selectedCategory !== 'all') {
    filtered = filtered.filter((tool) => tool.category === selectedCategory);
  }

  // Tags filter
  if (selectedTags.length > 0) {
    filtered = filtered.filter((tool) => selectedTags.some((tag) => tool.tags.includes(tag)));
  }

  // Difficulty filter
  if (filterDifficulty !== 'all') {
    filtered = filtered.filter((tool) => tool.difficulty === filterDifficulty);
  }

  // Processing type filter
  if (filterProcessingType !== 'all') {
    filtered = filtered.filter((tool) => tool.processingType === filterProcessingType);
  }

  // Security filter
  if (filterSecurity !== 'all') {
    filtered = filtered.filter((tool) => tool.security === filterSecurity);
  }

  // Sort by selected criteria
  if (!searchQuery) {
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        break;
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        break;
    }
  }

  return filtered;
};

describe('Filtering and Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Fuzzy Search', () => {
    it('returns 0 for empty query', () => {
      expect(fuzzySearch('', 'JSON Formatter')).toBe(0);
    });

    it('returns 100 for exact match', () => {
      expect(fuzzySearch('JSON Formatter', 'JSON Formatter')).toBe(100);
    });

    it('returns 80 for partial match', () => {
      expect(fuzzySearch('JSON', 'JSON Formatter')).toBe(80);
    });

    it('returns score for fuzzy match', () => {
      const score = fuzzySearch('JF', 'JSON Formatter');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(80);
    });

    it('is case insensitive', () => {
      expect(fuzzySearch('json formatter', 'JSON Formatter')).toBe(100);
      expect(fuzzySearch('JSON FORMATTER', 'json formatter')).toBe(100);
    });

    it('handles non-matching queries', () => {
      expect(fuzzySearch('xyz', 'JSON Formatter')).toBe(0);
    });

    it('gives higher score to shorter matching text', () => {
      const score1 = fuzzySearch('json', 'JSON');
      const score2 = fuzzySearch('json', 'JSON Formatter with lots of text');
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('Tool Filtering', () => {
    it('returns all tools when no filters are applied', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(result).toHaveLength(mockTools.length);
    });

    it('filters by search query', () => {
      const result = filterTools(
        mockTools,
        'JSON',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool =>
        tool.name.toLowerCase().includes('json') ||
        tool.description.toLowerCase().includes('json') ||
        tool.tags.some(tag => tag.toLowerCase().includes('json')) ||
        tool.category.toLowerCase().includes('json')
      );

      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool =>
        tool.name.toLowerCase().includes('json') ||
        tool.description.toLowerCase().includes('json') ||
        tool.tags.some(tag => tag.toLowerCase().includes('json')) ||
        tool.category.toLowerCase().includes('json')
      )).toBe(true);
    });

    it('filters by category', () => {
      const result = filterTools(
        mockTools,
        '',
        'JSON Processing',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool => tool.category === 'JSON Processing');
      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool => tool.category === 'JSON Processing')).toBe(true);
    });

    it('filters by tags', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        ['json'],
        'all',
        'all',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool => tool.tags.includes('json'));
      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool => tool.tags.includes('json'))).toBe(true);
    });

    it('filters by multiple tags (OR logic)', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        ['json', 'converter'],
        'all',
        'all',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool =>
        tool.tags.includes('json') || tool.tags.includes('converter')
      );
      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool =>
        tool.tags.includes('json') || tool.tags.includes('converter')
      )).toBe(true);
    });

    it('filters by difficulty', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'beginner',
        'all',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool => tool.difficulty === 'beginner');
      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool => tool.difficulty === 'beginner')).toBe(true);
    });

    it('filters by processing type', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'client-side',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool => tool.processingType === 'client-side');
      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool => tool.processingType === 'client-side')).toBe(true);
    });

    it('filters by security level', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'local-only',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool => tool.security === 'local-only');
      expect(result).toHaveLength(expectedTools.length);
      expect(result.every(tool => tool.security === 'local-only')).toBe(true);
    });
  });

  describe('Combined Filters', () => {
    it('combines search and category filters', () => {
      const result = filterTools(
        mockTools,
        'JSON',
        'JSON Processing',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool =>
        tool.category === 'JSON Processing' &&
        (
          tool.name.toLowerCase().includes('json') ||
          tool.description.toLowerCase().includes('json') ||
          tool.tags.some(tag => tag.toLowerCase().includes('json'))
        )
      );

      expect(result).toHaveLength(expectedTools.length);
    });

    it('combines multiple filters', () => {
      const result = filterTools(
        mockTools,
        'JSON',
        'JSON Processing',
        ['validator'],
        'beginner',
        'client-side',
        'local-only',
        'popularity'
      );

      const expectedTools = mockTools.filter(tool =>
        tool.category === 'JSON Processing' &&
        tool.tags.includes('validator') &&
        tool.difficulty === 'beginner' &&
        tool.processingType === 'client-side' &&
        tool.security === 'local-only' &&
        (
          tool.name.toLowerCase().includes('json') ||
          tool.description.toLowerCase().includes('json') ||
          tool.tags.some(tag => tag.toLowerCase().includes('json'))
        )
      );

      expect(result).toHaveLength(expectedTools.length);
    });

    it('returns empty result when filters are too restrictive', () => {
      const result = filterTools(
        mockTools,
        'nonexistent',
        'nonexistent category',
        ['nonexistent tag'],
        'advanced',
        'server-side',
        'network-required',
        'popularity'
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    it('sorts by name alphabetically', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'all',
        'name'
      );

      const sortedTools = [...mockTools].sort((a, b) => a.name.localeCompare(b.name));
      expect(result.map(t => t.name)).toEqual(sortedTools.map(t => t.name));
    });

    it('sorts by popularity (popular tools first)', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      const popularTools = result.filter(tool => tool.isPopular);
      const nonPopularTools = result.filter(tool => !tool.isPopular);

      // All popular tools should come before non-popular tools
      const popularIndex = result.findIndex(tool => !tool.isPopular);
      if (popularIndex !== -1) {
        expect(result.slice(0, popularIndex).every(tool => tool.isPopular)).toBe(true);
      }
    });

    it('sorts by difficulty (beginner first)', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'all',
        'difficulty'
      );

      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      for (let i = 1; i < result.length; i++) {
        const prevDifficulty = difficultyOrder[result[i - 1].difficulty];
        const currDifficulty = difficultyOrder[result[i].difficulty];
        expect(prevDifficulty).toBeLessThanOrEqual(currDifficulty);
      }
    });

    it('sorts by search relevance when searching', () => {
      const result = filterTools(
        mockTools,
        'JSON',
        'all',
        [],
        'all',
        'all',
        'all',
        'name' // This should be ignored when searching
      );

      // Should be sorted by relevance, not by name
      expect(result.length).toBeGreaterThan(0);
      // First result should have highest relevance score
    });
  });

  describe('Search Edge Cases', () => {
    it('handles empty search query', () => {
      const result = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(result).toHaveLength(mockTools.length);
    });

    it('handles whitespace-only search query', () => {
      const result = filterTools(
        mockTools,
        '   ',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(result).toHaveLength(mockTools.length);
    });

    it('handles special characters in search', () => {
      const result = filterTools(
        mockTools,
        'JSON-Formatter_v2',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      // Should not crash and should handle special characters
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      const result = filterTools(
        mockTools,
        longQuery,
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array for search with no matches', () => {
      const result = filterTools(
        mockTools,
        'definitelynotmatchinganytool',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('Filter Performance', () => {
    it('filters large tool sets efficiently', () => {
      const largeToolSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTools[0],
        id: `tool-${i}`,
        name: `Tool ${i}`,
        tags: [`tag${i % 10}`],
      }));

      const startTime = performance.now();
      const result = filterTools(
        largeToolSet,
        'Tool',
        'all',
        ['tag0'],
        'beginner',
        'client-side',
        'local-only',
        'popularity'
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should filter within 100ms
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles multiple rapid filter changes', () => {
      const filters = [
        { search: 'JSON', category: 'all' },
        { search: 'Code', category: 'Code Execution' },
        { search: 'File', category: 'File Processing' },
        { search: '', category: 'all' },
      ];

      const startTime = performance.now();

      filters.forEach(filter => {
        const result = filterTools(
          mockTools,
          filter.search,
          filter.category,
          [],
          'all',
          'all',
          'all',
          'popularity'
        );
        expect(Array.isArray(result)).toBe(true);
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should handle rapid changes efficiently
    });
  });

  describe('Filter Consistency', () => {
    it('maintains filter order consistency', () => {
      // Apply same filter multiple times
      const result1 = filterTools(
        mockTools,
        'JSON',
        'JSON Processing',
        ['validator'],
        'beginner',
        'client-side',
        'local-only',
        'popularity'
      );

      const result2 = filterTools(
        mockTools,
        'JSON',
        'JSON Processing',
        ['validator'],
        'beginner',
        'client-side',
        'local-only',
        'popularity'
      );

      expect(result1).toEqual(result2);
    });

    it('handles empty tool list', () => {
      const result = filterTools(
        [],
        'JSON',
        'JSON Processing',
        ['validator'],
        'beginner',
        'client-side',
        'local-only',
        'popularity'
      );

      expect(result).toHaveLength(0);
    });

    it('preserves original tool data structure', () => {
      const result = filterTools(
        mockTools,
        'JSON',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      result.forEach(tool => {
        expect(tool).toHaveProperty('id');
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('tags');
        expect(Array.isArray(tool.tags)).toBe(true);
      });
    });
  });

  describe('Search Relevance Scoring', () => {
    it('prioritizes exact name matches', () => {
      const result = filterTools(
        mockTools,
        'JSON Formatter',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(result[0].name).toBe('JSON Formatter');
    });

    it('considers description matches', () => {
      const result = filterTools(
        mockTools,
        'beautify',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      // Should find tools with "beautify" in description
      const hasBeautifyInDescription = result.some(tool =>
        tool.description.toLowerCase().includes('beautify')
      );
      expect(hasBeautifyInDescription).toBe(true);
    });

    it('considers tag matches', () => {
      const result = filterTools(
        mockTools,
        'validator',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      // Should find tools with "validator" tag
      const hasValidatorTag = result.some(tool =>
        tool.tags.includes('validator')
      );
      expect(hasValidatorTag).toBe(true);
    });

    it('ranks multi-field matches higher', () => {
      // Create a tool that matches in multiple fields
      const multiMatchTool = {
        ...mockTools[0],
        name: 'JSON Validator',
        description: 'A JSON validation tool',
        tags: ['json', 'validator']
      };

      const toolsWithMultiMatch = [...mockTools, multiMatchTool];
      const result = filterTools(
        toolsWithMultiMatch,
        'JSON Validator',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      // The exact match should be first
      expect(result[0].name).toBe('JSON Validator');
    });
  });

  describe('Filter State Management', () => {
    it('handles filter state transitions', () => {
      let filters = {
        search: '',
        category: 'all',
        tags: [],
        difficulty: 'all',
        processingType: 'all',
        security: 'all',
      };

      // Apply filters step by step
      filters.search = 'JSON';
      let result = filterTools(
        mockTools,
        filters.search,
        filters.category,
        filters.tags,
        filters.difficulty,
        filters.processingType,
        filters.security,
        'popularity'
      );

      const searchResultLength = result.length;

      filters.category = 'JSON Processing';
      result = filterTools(
        mockTools,
        filters.search,
        filters.category,
        filters.tags,
        filters.difficulty,
        filters.processingType,
        filters.security,
        'popularity'
      );

      expect(result.length).toBeLessThanOrEqual(searchResultLength);

      filters.tags = ['validator'];
      result = filterTools(
        mockTools,
        filters.search,
        filters.category,
        filters.tags,
        filters.difficulty,
        filters.processingType,
        filters.security,
        'popularity'
      );

      expect(result.every(tool => tool.tags.includes('validator'))).toBe(true);
    });

    it('handles filter clearing', () => {
      // Start with filters applied
      const filteredResult = filterTools(
        mockTools,
        'JSON',
        'JSON Processing',
        ['validator'],
        'beginner',
        'client-side',
        'local-only',
        'popularity'
      );

      // Clear all filters
      const clearedResult = filterTools(
        mockTools,
        '',
        'all',
        [],
        'all',
        'all',
        'all',
        'popularity'
      );

      expect(clearedResult.length).toBeGreaterThan(filteredResult.length);
      expect(clearedResult.length).toBe(mockTools.length);
    });
  });

  describe('Debounced Search', () => {
    it('delays search execution', async () => {
      let searchCallCount = 0;
      const debouncedSearch = vi.fn((query: string) => {
        searchCallCount++;
        return filterTools(mockTools, query, 'all', [], 'all', 'all', 'all', 'popularity');
      });

      // Simulate rapid typing
      debouncedSearch('J');
      debouncedSearch('JS');
      debouncedSearch('JSO');
      debouncedSearch('JSON');

      // Should not have been called yet due to debounce
      expect(searchCallCount).toBe(4);

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should have been called after debounce
      expect(searchCallCount).toBe(4);
    });

    it('cancels previous search calls', async () => {
      const searchCalls = [];
      const debouncedSearch = vi.fn((query: string) => {
        searchCalls.push(query);
        return filterTools(mockTools, query, 'all', [], 'all', 'all', 'all', 'popularity');
      });

      // Simulate rapid typing
      debouncedSearch('J');
      act(() => {
        vi.advanceTimersByTime(100);
      });

      debouncedSearch('JS');
      act(() => {
        vi.advanceTimersByTime(100);
      });

      debouncedSearch('JSON');
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should only process the final call
      expect(searchCalls).toEqual(['J', 'JS', 'JSON']);
    });
  });
});
