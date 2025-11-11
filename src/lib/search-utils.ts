import { useMemo, useCallback, useState } from 'react';
import { debounce } from 'lodash';
import type {
	Tool,
	ToolCategory,
	ToolDifficulty,
	ProcessingType,
	SecurityType,
	SearchState,
	FilterOptions,
} from '@/types/tools';

// Initial search state
export const initialSearchState: SearchState = {
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
};

// Debounced search function
export const createDebouncedSearch = (callback: (query: string) => void, delay: number = 300) => {
	return debounce(callback, delay);
};

// Search tool by query
export const searchTool = (tool: Tool, query: string): boolean => {
	if (!query.trim()) return true;

	const lowercaseQuery = query.toLowerCase();
	const searchableText = [tool.name, tool.description, tool.category, ...tool.tags, ...tool.features]
		.join(' ')
		.toLowerCase();

	return searchableText.includes(lowercaseQuery);
};

// Filter tool by criteria
export const filterTool = (tool: Tool, filters: Partial<SearchState>): boolean => {
	// Category filter
	if (filters.categories && filters.categories.length > 0) {
		if (!filters.categories.includes(tool.category)) return false;
	}

	// Difficulty filter
	if (filters.difficulties && filters.difficulties.length > 0) {
		if (!filters.difficulties.includes(tool.difficulty)) return false;
	}

	// Processing type filter
	if (filters.processingTypes && filters.processingTypes.length > 0) {
		if (!filters.processingTypes.includes(tool.processingType)) return false;
	}

	// Security type filter
	if (filters.securityTypes && filters.securityTypes.length > 0) {
		if (!filters.securityTypes.includes(tool.security)) return false;
	}

	// Features filter
	if (filters.features && filters.features.length > 0) {
		const hasFeature = filters.features.some((feature) =>
			tool.features.some((toolFeature) => toolFeature.toLowerCase().includes(feature.toLowerCase())),
		);
		if (!hasFeature) return false;
	}

	// Tags filter
	if (filters.tags && filters.tags.length > 0) {
		const hasTag = filters.tags.some((tag) =>
			tool.tags.some((toolTag) => toolTag.toLowerCase().includes(tag.toLowerCase())),
		);
		if (!hasTag) return false;
	}

	// Status filter
	if (filters.status && filters.status.length > 0) {
		if (!filters.status.includes(tool.status)) return false;
	}

	// New tools filter
	if (filters.isNew !== null) {
		if (filters.isNew && !tool.isNew) return false;
		if (!filters.isNew && tool.isNew) return false;
	}

	// Popular tools filter
	if (filters.isPopular !== null) {
		if (filters.isPopular && !tool.isPopular) return false;
		if (!filters.isPopular && tool.isPopular) return false;
	}

	return true;
};

// Combined search and filter
export const searchAndFilterTools = (tools: Tool[], searchState: SearchState): Tool[] => {
	return tools.filter((tool) => {
		const matchesSearch = searchTool(tool, searchState.query);
		const matchesFilters = filterTool(tool, searchState);
		return matchesSearch && matchesFilters;
	});
};

// Get available filter options from tools
export const getFilterOptions = (tools: Tool[]): FilterOptions => {
	const categories = Array.from(new Set(tools.map((tool) => tool.category))) as ToolCategory[];
	const difficulties = Array.from(new Set(tools.map((tool) => tool.difficulty))) as ToolDifficulty[];
	const processingTypes = Array.from(new Set(tools.map((tool) => tool.processingType))) as ProcessingType[];
	const securityTypes = Array.from(new Set(tools.map((tool) => tool.security))) as SecurityType[];
	const features = Array.from(new Set(tools.flatMap((tool) => tool.features)));
	const tags = Array.from(new Set(tools.flatMap((tool) => tool.tags)));
	const status = Array.from(new Set(tools.map((tool) => tool.status)));

	return {
		categories: categories.sort(),
		difficulties: difficulties.sort(),
		processingTypes: processingTypes.sort(),
		securityTypes: securityTypes.sort(),
		features: features.sort(),
		tags: tags.sort(),
		status: status.sort(),
	};
};

// Generate search suggestions
export const generateSearchSuggestions = (tools: Tool[], query: string, maxSuggestions: number = 5): string[] => {
	if (!query.trim()) return [];

	const lowercaseQuery = query.toLowerCase();
	const suggestions = new Set<string>();

	tools.forEach((tool) => {
		// Add tool name matches
		if (tool.name.toLowerCase().includes(lowercaseQuery)) {
			suggestions.add(tool.name);
		}

		// Add tag matches
		tool.tags.forEach((tag) => {
			if (tag.toLowerCase().includes(lowercaseQuery)) {
				suggestions.add(tag);
			}
		});

		// Add feature matches
		tool.features.forEach((feature) => {
			if (feature.toLowerCase().includes(lowercaseQuery)) {
				suggestions.add(feature);
			}
		});

		// Add category matches
		if (tool.category.toLowerCase().includes(lowercaseQuery)) {
			suggestions.add(tool.category);
		}
	});

	return Array.from(suggestions).slice(0, maxSuggestions).sort();
};

// Highlight search text in content
export const highlightSearchText = (
	text: string,
	query: string,
	className: string = 'bg-yellow-200 dark:bg-yellow-800',
): string => {
	if (!query.trim()) return text;

	const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
	return text.replace(regex, `<span class="${className}">$1</span>`);
};

// Calculate search result relevance score
export const calculateRelevanceScore = (tool: Tool, query: string): number => {
	if (!query.trim()) return 0;

	const lowercaseQuery = query.toLowerCase();
	let score = 0;

	// Exact name match gets highest score
	if (tool.name.toLowerCase() === lowercaseQuery) {
		score += 100;
	} else if (tool.name.toLowerCase().startsWith(lowercaseQuery)) {
		score += 80;
	} else if (tool.name.toLowerCase().includes(lowercaseQuery)) {
		score += 60;
	}

	// Description matches
	if (tool.description.toLowerCase().includes(lowercaseQuery)) {
		score += 20;
	}

	// Tag matches
	tool.tags.forEach((tag) => {
		if (tag.toLowerCase() === lowercaseQuery) {
			score += 40;
		} else if (tag.toLowerCase().includes(lowercaseQuery)) {
			score += 15;
		}
	});

	// Feature matches
	tool.features.forEach((feature) => {
		if (feature.toLowerCase().includes(lowercaseQuery)) {
			score += 10;
		}
	});

	// Category match
	if (tool.category.toLowerCase().includes(lowercaseQuery)) {
		score += 5;
	}

	// Bonus for popular tools
	if (tool.isPopular) {
		score += 10;
	}

	return score;
};

// Sort search results by relevance
export const sortSearchResults = (tools: Tool[], query: string): Tool[] => {
	if (!query.trim()) return tools;

	return [...tools].sort((a, b) => {
		const scoreA = calculateRelevanceScore(a, query);
		const scoreB = calculateRelevanceScore(b, query);

		if (scoreA !== scoreB) {
			return scoreB - scoreA; // Higher score first
		}

		// If scores are equal, sort by popularity
		if (a.isPopular && !b.isPopular) return -1;
		if (!a.isPopular && b.isPopular) return 1;

		// Then by name
		return a.name.localeCompare(b.name);
	});
};

// Custom hook for search functionality
export const useSearch = (tools: Tool[], initialQuery: string = '') => {
	const [searchState, setSearchState] = useState<SearchState>(initialSearchState);
	const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

	// Create debounced function
	const debouncedSetQuery = useMemo(() => createDebouncedSearch(setDebouncedQuery), []);

	// Handle query change with debouncing
	const handleQueryChange = useCallback(
		(query: string) => {
			setSearchState((prev) => ({ ...prev, query }));
			debouncedSetQuery(query);
		},
		[debouncedSetQuery],
	);

	// Update search filters
	const updateFilters = useCallback((filters: Partial<SearchState>) => {
		setSearchState((prev) => ({ ...prev, ...filters }));
	}, []);

	// Clear all filters
	const clearFilters = useCallback(() => {
		setSearchState(initialSearchState);
		setDebouncedQuery('');
	}, []);

	// Filter and search tools
	const filteredTools = useMemo(() => {
		let results = searchAndFilterTools(tools, searchState);
		results = sortSearchResults(results, debouncedQuery);
		return results;
	}, [tools, searchState, debouncedQuery]);

	// Get available filter options
	const filterOptions = useMemo(() => {
		return getFilterOptions(tools);
	}, [tools]);

	// Generate search suggestions
	const suggestions = useMemo(() => {
		return generateSearchSuggestions(tools, debouncedQuery);
	}, [tools, debouncedQuery]);

	return {
		searchState,
		filteredTools,
		filterOptions,
		suggestions,
		handleQueryChange,
		updateFilters,
		clearFilters,
	};
};
