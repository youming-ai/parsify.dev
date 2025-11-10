/**
 * Simple fuzzy search implementation for tool search functionality
 */

export interface SearchableItem {
	id: string;
	name: string;
	description?: string;
	tags?: string[];
	category?: string;
}

export interface SearchResult<T extends SearchableItem> {
	item: T;
	score: number;
	matches: {
		name?: number[];
		description?: number[];
		tags?: string[];
		category?: boolean;
	};
}

/**
 * Calculate fuzzy search score between query and text
 */
export function fuzzySearch(query: string, text: string): number {
	if (!query) return 0;
	if (!text) return 0;

	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();

	// Exact match gets highest score
	if (textLower === queryLower) return 100;
	if (textLower.includes(queryLower)) return 80;

	// Check if all query characters are in order in the text
	let score = 0;
	let queryIndex = 0;
	let lastMatchIndex = -1;
	const consecutiveBonus = 10;

	for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
		if (textLower[i] === queryLower[queryIndex]) {
			// Base score for finding character
			score += 1;

			// Bonus for consecutive matches
			if (lastMatchIndex === i - 1) {
				score += consecutiveBonus;
			}

			// Bonus for matching at word boundaries
			if (i === 0 || textLower[i - 1] === ' ' || textLower[i - 1 === '_' || textLower[i - 1] === '-']) {
				score += 5;
			}

			lastMatchIndex = i;
			queryIndex++;
		}
	}

	// If all characters found, calculate final score
	if (queryIndex === queryLower.length) {
		// Percentage of query characters found
		const completeness = score / (queryLower.length * (1 + consecutiveBonus));

		// Penalty for longer text (less relevant)
		const lengthPenalty = Math.min(textLower.length / 100, 0.3);

		// Bonus for exact prefix
		const prefixBonus = textLower.startsWith(queryLower) ? 20 : 0;

		score = completeness * 60 + prefixBonus - lengthPenalty * 20;
	}

	return Math.max(0, Math.round(score));
}

/**
 * Search through an array of items using fuzzy search
 */
export function fuzzySearchItems<T extends SearchableItem>(
	items: T[],
	query: string,
	options: {
		threshold?: number;
		fields?: (keyof T)[];
		weights?: {
			name?: number;
			description?: number;
			tags?: number;
			category?: number;
		};
	} = {},
): SearchResult<T>[] {
	const {
		threshold = 20,
		fields = ['name', 'description', 'tags', 'category'],
		weights = { name: 1, description: 0.7, tags: 0.5, category: 0.3 },
	} = options;

	if (!query.trim()) return [];

	const results: SearchResult<T>[] = [];

	for (const item of items) {
		let totalScore = 0;
		const matches: SearchResult<T>['matches'] = {};

		// Search in name
		if (fields.includes('name' as any) && item.name) {
			const nameScore = fuzzySearch(query, item.name);
			if (nameScore > 0) {
				matches.name = Array.from({ length: item.name.length }, (_, i) => i);
				totalScore += nameScore * (weights.name || 1);
			}
		}

		// Search in description
		if (fields.includes('description' as any) && item.description) {
			const descScore = fuzzySearch(query, item.description);
			if (descScore > 0) {
				matches.description = Array.from({ length: item.description.length }, (_, i) => i);
				totalScore += descScore * (weights.description || 0.7);
			}
		}

		// Search in tags
		if (fields.includes('tags' as any) && item.tags) {
			const matchingTags = item.tags.filter((tag) => fuzzySearch(query, tag) > threshold);
			if (matchingTags.length > 0) {
				matches.tags = matchingTags;
				const tagScore = matchingTags.reduce((sum, tag) => sum + fuzzySearch(query, tag), 0) / matchingTags.length;
				totalScore += tagScore * (weights.tags || 0.5);
			}
		}

		// Search in category
		if (fields.includes('category' as any) && item.category) {
			const categoryScore = fuzzySearch(query, item.category);
			if (categoryScore > 0) {
				matches.category = true;
				totalScore += categoryScore * (weights.category || 0.3);
			}
		}

		// Add to results if score meets threshold
		if (totalScore >= threshold) {
			results.push({
				item,
				score: totalScore,
				matches,
			});
		}
	}

	// Sort by score (highest first)
	return results.sort((a, b) => b.score - a.score);
}

/**
 * Get search suggestions from items
 */
export function getSearchSuggestions<T extends SearchableItem>(
	items: T[],
	query: string,
	maxSuggestions: number = 8,
): Array<{
	text: string;
	type: 'name' | 'tag' | 'category';
	item?: T;
	score: number;
}> {
	const suggestions: Array<{
		text: string;
		type: 'name' | 'tag' | 'category';
		item?: T;
		score: number;
	}> = [];

	if (!query.trim()) return suggestions;

	// Add matching tool names
	items.forEach((item) => {
		const score = fuzzySearch(query, item.name);
		if (score > 40) {
			suggestions.push({
				text: item.name,
				type: 'name',
				item,
				score,
			});
		}
	});

	// Add matching tags
	const tagSet = new Set<string>();
	items.forEach((item) => {
		item.tags?.forEach((tag) => {
			const score = fuzzySearch(query, tag);
			if (score > 50 && !tagSet.has(tag)) {
				tagSet.add(tag);
				suggestions.push({
					text: tag,
					type: 'tag',
					score,
				});
			}
		});
	});

	// Add matching categories
	const categorySet = new Set<string>();
	items.forEach((item) => {
		if (item.category) {
			const score = fuzzySearch(query, item.category);
			if (score > 60 && !categorySet.has(item.category)) {
				categorySet.add(item.category);
				suggestions.push({
					text: item.category,
					type: 'category',
					score,
				});
			}
		}
	});

	// Sort by score and limit
	return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
}

/**
 * Highlight matched parts of text
 */
export function highlightMatches(text: string, query: string): string {
	if (!query.trim()) return text;

	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();
	const highlights: Array<{ start: number; end: number }> = [];

	// Find all matches
	let queryIndex = 0;
	for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
		if (textLower[i] === queryLower[queryIndex]) {
			if (queryIndex === 0) {
				highlights.push({ start: i, end: i + 1 });
			} else {
				const lastHighlight = highlights[highlights.length - 1];
				if (lastHighlight && lastHighlight.end === i) {
					lastHighlight.end = i + 1;
				} else {
					highlights.push({ start: i, end: i + 1 });
				}
			}
			queryIndex++;
		}
	}

	// If no fuzzy match, try substring match
	if (queryIndex === 0) {
		const substringIndex = textLower.indexOf(queryLower);
		if (substringIndex !== -1) {
			highlights.push({
				start: substringIndex,
				end: substringIndex + queryLower.length,
			});
		}
	}

	// Build highlighted text
	if (highlights.length === 0) return text;

	let result = '';
	let lastIndex = 0;

	highlights.forEach(({ start, end }) => {
		result += text.slice(lastIndex, start);
		result += `<mark class="bg-yellow-200 dark:bg-yellow-800">${text.slice(start, end)}</mark>`;
		lastIndex = end;
	});

	result += text.slice(lastIndex);
	return result;
}
