import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	getAllCategories,
	getToolsByCategory,
	getCategoryStats,
	getPopularCategories,
	getCategoryIcon,
	getCategoryDescription,
	getCategoryColor,
	sortCategories,
	filterCategoriesByToolCount,
	calculateCategoryDistribution,
	getCategoryPath,
	getBreadcrumbsForCategory,
	getRelatedCategories,
	validateCategoryData,
	transformCategoryData,
	exportCategoryData,
	importCategoryData,
} from '@/lib/category-utils';
import { mockTools, mockCategories } from '../utils/test-data';

describe('category-utils', () => {
	beforeEach(() => {
		// Setup any necessary test data
	});

	afterEach(() => {
		// Cleanup after each test
	});

	describe('getAllCategories', () => {
		it('should return all unique categories from tools', () => {
			const categories = getAllCategories(mockTools);
			expect(categories).toContain('JSON Processing');
			expect(categories).toContain('Code Execution');
			expect(categories).toContain('Security & Encryption');
			expect(categories).toContain('Network Utilities');
			expect(categories).toContain('Text Processing');
		});

		it('should return empty array for empty tools array', () => {
			expect(getAllCategories([])).toEqual([]);
		});

		it('should return categories in alphabetical order', () => {
			const categories = getAllCategories(mockTools);
			const sortedCategories = [...categories].sort();
			expect(categories).toEqual(sortedCategories);
		});

		it('should handle duplicate categories', () => {
			const toolsWithDuplicates = [
				...mockTools,
				{ ...mockTools[0], id: 'duplicate-tool' },
			];
			const categories = getAllCategories(toolsWithDuplicates);
			const uniqueCategories = [...new Set(categories)];
			expect(categories).toEqual(uniqueCategories);
		});
	});

	describe('getToolsByCategory', () => {
		it('should return tools for specific category', () => {
			const jsonTools = getToolsByCategory(mockTools, 'JSON Processing');
			expect(jsonTools.length).toBeGreaterThan(0);
			jsonTools.forEach(tool => {
				expect(tool.category).toBe('JSON Processing');
			});
		});

		it('should return empty array for non-existent category', () => {
			const tools = getToolsByCategory(mockTools, 'Non-existent Category');
			expect(tools).toEqual([]);
		});

		it('should handle empty tools array', () => {
			const tools = getToolsByCategory([], 'JSON Processing');
			expect(tools).toEqual([]);
		});

		it('should be case sensitive', () => {
			const tools1 = getToolsByCategory(mockTools, 'JSON Processing');
			const tools2 = getToolsByCategory(mockTools, 'json processing');
			expect(tools1).not.toEqual(tools2);
		});
	});

	describe('getCategoryStats', () => {
		it('should return statistics for a category', () => {
			const stats = getCategoryStats(mockTools, 'JSON Processing');
			expect(stats).toHaveProperty('totalTools');
			expect(stats).toHaveProperty('popularTools');
			expect(stats).toHaveProperty('newTools');
			expect(stats).toHaveProperty('averageDifficulty');
			expect(stats.totalTools).toBeGreaterThan(0);
		});

		it('should calculate popular tools correctly', () => {
			const stats = getCategoryStats(mockTools, 'JSON Processing');
			stats.popularTools.forEach(tool => {
				expect(tool.isPopular).toBe(true);
				expect(tool.category).toBe('JSON Processing');
			});
		});

		it('should calculate new tools correctly', () => {
			const stats = getCategoryStats(mockTools, 'Network Utilities');
			stats.newTools.forEach(tool => {
				expect(tool.isNew).toBe(true);
				expect(tool.category).toBe('Network Utilities');
			});
		});

		it('should calculate average difficulty', () => {
			const stats = getCategoryStats(mockTools, 'JSON Processing');
			expect(stats.averageDifficulty).toBeDefined();
			expect(['beginner', 'intermediate', 'advanced']).toContain(stats.averageDifficulty);
		});

		it('should return empty stats for non-existent category', () => {
			const stats = getCategoryStats(mockTools, 'Non-existent Category');
			expect(stats.totalTools).toBe(0);
			expect(stats.popularTools).toEqual([]);
			expect(stats.newTools).toEqual([]);
		});
	});

	describe('getPopularCategories', () => {
		it('should return categories sorted by tool count', () => {
			const popularCategories = getPopularCategories(mockTools, 3);
			expect(popularCategories.length).toBeLessThanOrEqual(3);

			// Verify they are sorted by tool count (descending)
			for (let i = 1; i < popularCategories.length; i++) {
				const prevCount = getToolsByCategory(mockTools, popularCategories[i-1]).length;
				const currCount = getToolsByCategory(mockTools, popularCategories[i]).length;
				expect(prevCount).toBeGreaterThanOrEqual(currCount);
			}
		});

		it('should limit results by maxCategories', () => {
			const popularCategories = getPopularCategories(mockTools, 2);
			expect(popularCategories.length).toBeLessThanOrEqual(2);
		});

		it('should use default limit when not specified', () => {
			const popularCategories = getPopularCategories(mockTools);
			expect(popularCategories.length).toBeLessThanOrEqual(5); // Default limit
		});

		it('should handle empty tools array', () => {
			expect(getPopularCategories([])).toEqual([]);
		});
	});

	describe('getCategoryIcon', () => {
		it('should return appropriate icon for category', () => {
			expect(getCategoryIcon('JSON Processing')).toBe('FileJson');
			expect(getCategoryIcon('Code Execution')).toBe('Terminal');
			expect(getCategoryIcon('Security & Encryption')).toBe('Shield');
		});

		it('should return default icon for unknown category', () => {
			expect(getCategoryIcon('Unknown Category')).toBe('Folder');
		});

		it('should be case insensitive', () => {
			const icon1 = getCategoryIcon('JSON Processing');
			const icon2 = getCategoryIcon('json processing');
			expect(icon1).toBe(icon2);
		});
	});

	describe('getCategoryDescription', () => {
		it('should return description for known category', () => {
			const description = getCategoryDescription('JSON Processing');
			expect(description).toContain('JSON');
			expect(description.length).toBeGreaterThan(10);
		});

		it('should return generic description for unknown category', () => {
			const description = getCategoryDescription('Unknown Category');
			expect(description).toContain('tools');
		});

		it('should handle different categories appropriately', () => {
			const jsonDesc = getCategoryDescription('JSON Processing');
			const codeDesc = getCategoryDescription('Code Execution');
			expect(jsonDesc).not.toBe(codeDesc);
		});
	});

	describe('getCategoryColor', () => {
		it('should return consistent color for category', () => {
			const color1 = getCategoryColor('JSON Processing');
			const color2 = getCategoryColor('JSON Processing');
			expect(color1).toBe(color2);
		});

		it('should return different colors for different categories', () => {
			const color1 = getCategoryColor('JSON Processing');
			const color2 = getCategoryColor('Code Execution');
			expect(color1).not.toBe(color2);
		});

		it('should return valid CSS color', () => {
			const color = getCategoryColor('JSON Processing');
			expect(color).toMatch(/^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\(|hsl\()/);
		});
	});

	describe('sortCategories', () => {
		it('should sort categories alphabetically by default', () => {
			const unsorted = ['Code Execution', 'JSON Processing', 'Security & Encryption'];
			const sorted = sortCategories(unsorted);
			expect(sorted).toEqual(['Code Execution', 'JSON Processing', 'Security & Encryption']);
		});

		it('should sort categories by tool count when specified', () => {
			const categories = ['JSON Processing', 'Code Execution'];
			const sorted = sortCategories(categories, mockTools, 'toolCount');
			const jsonCount = getToolsByCategory(mockTools, 'JSON Processing').length;
			const codeCount = getToolsByCategory(mockTools, 'Code Execution').length;

			if (jsonCount >= codeCount) {
				expect(sorted[0]).toBe('JSON Processing');
			} else {
				expect(sorted[0]).toBe('Code Execution');
			}
		});

		it('should sort categories by popularity when specified', () => {
			const categories = ['JSON Processing', 'Code Execution'];
			const sorted = sortCategories(categories, mockTools, 'popularity');
			expect(Array.isArray(sorted)).toBe(true);
			expect(sorted.length).toBe(2);
		});

		it('should handle empty categories array', () => {
			expect(sortCategories([])).toEqual([]);
		});
	});

	describe('filterCategoriesByToolCount', () => {
		it('should filter categories by minimum tool count', () => {
			const categories = getAllCategories(mockTools);
			const filtered = filterCategoriesByToolCount(categories, mockTools, 1);

			filtered.forEach(category => {
				const toolCount = getToolsByCategory(mockTools, category).length;
				expect(toolCount).toBeGreaterThanOrEqual(1);
			});
		});

		it('should return empty array for high minimum count', () => {
			const categories = getAllCategories(mockTools);
			const filtered = filterCategoriesByToolCount(categories, mockTools, 100);
			expect(filtered).toEqual([]);
		});

		it('should handle zero minimum count', () => {
			const categories = getAllCategories(mockTools);
			const filtered = filterCategoriesByToolCount(categories, mockTools, 0);
			expect(filtered).toEqual(categories);
		});
	});

	describe('calculateCategoryDistribution', () => {
		it('should calculate distribution percentages', () => {
			const distribution = calculateCategoryDistribution(mockTools);
			const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
			expect(total).toBe(mockTools.length);
		});

		it('should include all categories', () => {
			const distribution = calculateCategoryDistribution(mockTools);
			const categories = getAllCategories(mockTools);

			categories.forEach(category => {
				expect(distribution).toHaveProperty(category);
				expect(distribution[category]).toBeGreaterThan(0);
			});
		});

		it('should handle empty tools array', () => {
			const distribution = calculateCategoryDistribution([]);
			expect(Object.keys(distribution)).toEqual([]);
		});
	});

	describe('getCategoryPath', () => {
		it('should generate path for category', () => {
			const path = getCategoryPath('JSON Processing');
			expect(path).toBe('/tools/json');
		});

		it('should handle special characters in category name', () => {
			const path = getCategoryPath('Security & Encryption');
			expect(path).toBe('/tools/security');
		});

		it('should handle spaces in category name', () => {
			const path = getCategoryPath('Code Execution');
			expect(path).toBe('/tools/code');
		});
	});

	describe('getBreadcrumbsForCategory', () => {
		it('should generate breadcrumbs for category', () => {
			const breadcrumbs = getBreadcrumbsForCategory('JSON Processing');
			expect(breadcrumbs).toHaveLength(3); // Home, Tools, Category
			expect(breadcrumbs[0].label).toBe('Home');
			expect(breadcrumbs[1].label).toBe('Tools');
			expect(breadcrumbs[2].label).toBe('JSON Processing');
		});

		it('should include correct paths', () => {
			const breadcrumbs = getBreadcrumbsForCategory('JSON Processing');
			expect(breadcrumbs[0].href).toBe('/');
			expect(breadcrumbs[1].href).toBe('/tools');
			expect(breadcrumbs[2].href).toBe('/tools/json');
		});
	});

	describe('getRelatedCategories', () => {
		it('should find related categories based on tags', () => {
			const related = getRelatedCategories(mockTools, 'JSON Processing', 2);
			expect(related.length).toBeLessThanOrEqual(2);
			expect(related).not.toContain('JSON Processing');
		});

		it('should limit results by maxCategories', () => {
			const related = getRelatedCategories(mockTools, 'JSON Processing', 1);
			expect(related.length).toBeLessThanOrEqual(1);
		});

		it('should return empty array for unknown category', () => {
			const related = getRelatedCategories(mockTools, 'Unknown Category');
			expect(related).toEqual([]);
		});
	});

	describe('validateCategoryData', () => {
		it('should validate correct category data', () => {
			const categoryData = {
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
				color: '#3B82F6',
			};
			expect(validateCategoryData(categoryData)).toBe(true);
		});

		it('should reject invalid category data', () => {
			const invalidData = {
				name: '',
				icon: '',
				description: '',
				color: 'invalid-color',
			};
			expect(validateCategoryData(invalidData)).toBe(false);
		});

		it('should handle missing required fields', () => {
			const incompleteData = {
				name: 'Test Category',
			};
			expect(validateCategoryData(incompleteData)).toBe(false);
		});
	});

	describe('transformCategoryData', () => {
		it('should transform category data for API', () => {
			const categoryData = {
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
				tools: getToolsByCategory(mockTools, 'JSON Processing'),
			};

			const transformed = transformCategoryData(categoryData, 'api');
			expect(transformed).toHaveProperty('name');
			expect(transformed).toHaveProperty('toolCount');
			expect(transformed).not.toHaveProperty('tools'); // Tools should be summarized
		});

		it('should transform category data for UI', () => {
			const categoryData = {
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
				tools: getToolsByCategory(mockTools, 'JSON Processing'),
			};

			const transformed = transformCategoryData(categoryData, 'ui');
			expect(transformed).toHaveProperty('name');
			expect(transformed).toHaveProperty('tools');
			expect(transformed.tools).toHaveLength(categoryData.tools.length);
		});
	});

	describe('exportCategoryData', () => {
		it('should export category data as JSON', () => {
		 const categoryData = {
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
				tools: getToolsByCategory(mockTools, 'JSON Processing'),
			};

			const exported = exportCategoryData(categoryData, 'json');
			expect(typeof exported).toBe('string');
			expect(() => JSON.parse(exported)).not.toThrow();
		});

		it('should export category data as CSV', () => {
			const categoryData = {
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
				tools: getToolsByCategory(mockTools, 'JSON Processing'),
			};

			const exported = exportCategoryData(categoryData, 'csv');
			expect(typeof exported).toBe('string');
			expect(exported).toContain('name,icon,description');
		});

		it('should throw error for unsupported format', () => {
			const categoryData = {
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
				tools: getToolsByCategory(mockTools, 'JSON Processing'),
			};

			expect(() => exportCategoryData(categoryData, 'xml')).toThrow();
		});
	});

	describe('importCategoryData', () => {
		it('should import category data from JSON', () => {
			const jsonData = JSON.stringify({
				name: 'JSON Processing',
				icon: 'FileJson',
				description: 'JSON processing tools',
			});

			const imported = importCategoryData(jsonData, 'json');
			expect(imported.name).toBe('JSON Processing');
			expect(imported.icon).toBe('FileJson');
		});

		it('should throw error for invalid JSON', () => {
			const invalidJson = '{ invalid json }';
			expect(() => importCategoryData(invalidJson, 'json')).toThrow();
		});

		it('should throw error for unsupported format', () => {
			expect(() => importCategoryData('data', 'xml')).toThrow();
		});
	});

	describe('Integration Tests', () => {
		it('should handle complete category workflow', () => {
			// Get all categories
			const categories = getAllCategories(mockTools);
			expect(categories.length).toBeGreaterThan(0);

			// Get tools for a category
			const jsonCategory = categories.find(c => c === 'JSON Processing');
			const jsonTools = getToolsByCategory(mockTools, jsonCategory!);
			expect(jsonTools.length).toBeGreaterThan(0);

			// Get stats for the category
			const stats = getCategoryStats(mockTools, jsonCategory!);
			expect(stats.totalTools).toBe(jsonTools.length);

			// Get category metadata
			const icon = getCategoryIcon(jsonCategory!);
			const description = getCategoryDescription(jsonCategory!);
			const color = getCategoryColor(jsonCategory!);

			expect(icon).toBeDefined();
			expect(description).toBeDefined();
			expect(color).toBeDefined();
		});

		it('should handle edge cases gracefully', () => {
			// Empty tools array
			expect(getAllCategories([])).toEqual([]);
			expect(getPopularCategories([])).toEqual([]);
			expect(calculateCategoryDistribution([])).toEqual({});

			// Invalid category names
			expect(getToolsByCategory(mockTools, '')).toEqual([]);
			expect(getCategoryStats(mockTools, '')).toEqual({
				totalTools: 0,
				popularTools: [],
				newTools: [],
				averageDifficulty: 'beginner',
			});

			// Null/undefined inputs
			expect(() => getAllCategories(null as any)).not.toThrow();
			expect(() => getToolsByCategory(null as any, 'test')).not.toThrow();
		});
	});
});
