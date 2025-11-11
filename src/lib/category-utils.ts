import type { Tool, ToolCategory, CategoryMetadata, BreadcrumbItem, CategoryNavigationState } from '@/types/tools';
import { toolsData } from '@/data/tools-data';

// Define the 6 main categories with their metadata
export const CATEGORIES_METADATA: Record<string, CategoryMetadata> = {
	'JSON Processing Suite': {
		id: 'json-processing',
		name: 'JSON Processing Suite',
		description: 'Comprehensive JSON tools for formatting, validation, conversion, and advanced data manipulation',
		icon: 'FileJson',
		color: 'blue',
		slug: 'json',
		toolCount: 11,
		featured: true,
		subcategories: {
			'JSON Tools': {
				name: 'JSON Tools',
				description: 'Basic JSON processing and manipulation',
				toolIds: ['json-formatter', 'json-validator', 'json-converter', 'json-editor', 'json-sorter', 'json-minifier'],
			},
			'Schema Tools': {
				name: 'Schema Tools',
				description: 'JSON schema generation and validation',
				toolIds: ['json-schema-generator'],
			},
			'Security Tools': {
				name: 'Security Tools',
				description: 'Security-related JSON utilities',
				toolIds: ['jwt-decoder'],
			},
			Visualization: {
				name: 'Visualization',
				description: 'JSON data visualization and exploration',
				toolIds: ['json-hero-visualizer', 'json-path-queries'],
			},
		},
	},
	'Code Processing Suite': {
		id: 'code-processing',
		name: 'Code Processing Suite',
		description: 'Code execution, formatting, optimization, and analysis tools for multiple programming languages',
		icon: 'Code',
		color: 'green',
		slug: 'code',
		toolCount: 8,
		featured: true,
		subcategories: {
			'Code Execution': {
				name: 'Code Execution',
				description: 'Run and test code in multiple languages',
				toolIds: ['code-executor', 'regex-tester'],
			},
			'Code Optimization': {
				name: 'Code Optimization',
				description: 'Improve code performance and size',
				toolIds: ['code-formatter', 'code-minifier'],
			},
			'Code Security': {
				name: 'Code Security',
				description: 'Protect and secure your code',
				toolIds: ['code-obfuscator'],
			},
			'Code Analysis': {
				name: 'Code Analysis',
				description: 'Analyze and compare code',
				toolIds: ['code-comparator'],
			},
		},
	},
	'File Processing Suite': {
		id: 'file-processing',
		name: 'File Processing Suite',
		description: 'File conversion, processing, and manipulation tools for various formats',
		icon: 'FileText',
		color: 'purple',
		slug: 'file',
		toolCount: 8,
		featured: true,
		subcategories: {
			'File Conversion': {
				name: 'File Conversion',
				description: 'Convert between different file formats',
				toolIds: ['file-converter'],
			},
			'Image Processing': {
				name: 'Image Processing',
				description: 'Process and manipulate images',
				toolIds: ['image-compressor', 'qr-generator', 'ocr-tool'],
			},
			'Document Processing': {
				name: 'Document Processing',
				description: 'Process text and document files',
				toolIds: ['text-processor', 'csv-processor'],
			},
		},
	},
	'Network Utilities': {
		id: 'network-utilities',
		name: 'Network Utilities',
		description: 'Network testing, API debugging, and web development utilities',
		icon: 'Public',
		color: 'cyan',
		slug: 'network',
		toolCount: 6,
		featured: false,
		subcategories: {
			'API Testing': {
				name: 'API Testing',
				description: 'Test and debug APIs',
				toolIds: ['http-client'],
			},
			'Network Analysis': {
				name: 'Network Analysis',
				description: 'Analyze network information',
				toolIds: ['ip-lookup', 'network-check'],
			},
			'SEO Tools': {
				name: 'SEO Tools',
				description: 'Search engine optimization tools',
				toolIds: ['meta-tag-generator'],
			},
		},
	},
	'Text Processing Suite': {
		id: 'text-processing',
		name: 'Text Processing Suite',
		description: 'Text manipulation, encoding, formatting, and generation utilities',
		icon: 'TextFields',
		color: 'orange',
		slug: 'text',
		toolCount: 9,
		featured: false,
		subcategories: {
			'Encoding Tools': {
				name: 'Encoding Tools',
				description: 'Encode and decode text in various formats',
				toolIds: ['text-encoder', 'base64-converter', 'url-encoder'],
			},
			'Formatting Tools': {
				name: 'Formatting Tools',
				description: 'Format and clean up text',
				toolIds: ['text-formatter'],
			},
			'Comparison Tools': {
				name: 'Comparison Tools',
				description: 'Compare and analyze text differences',
				toolIds: ['text-comparator'],
			},
			'Generation Tools': {
				name: 'Generation Tools',
				description: 'Generate text and test data',
				toolIds: ['text-generator'],
			},
		},
	},
	'Security & Encryption Suite': {
		id: 'security-encryption',
		name: 'Security & Encryption Suite',
		description: 'Security tools for encryption, hashing, password generation, and data protection',
		icon: 'Security',
		color: 'red',
		slug: 'security',
		toolCount: 8,
		featured: true,
		subcategories: {
			Hashing: {
				name: 'Hashing',
				description: 'Generate and verify hashes',
				toolIds: ['hash-generator'],
			},
			Authentication: {
				name: 'Authentication',
				description: 'Authentication and security tools',
				toolIds: ['password-generator'],
			},
			Encryption: {
				name: 'Encryption',
				description: 'Encrypt and decrypt data',
				toolIds: ['file-encryptor'],
			},
			Identifiers: {
				name: 'Identifiers',
				description: 'Generate unique identifiers',
				toolIds: ['uuid-generator'],
			},
		},
	},
};

// Get category by slug
export const getCategoryBySlug = (slug: string): CategoryMetadata | undefined => {
	return Object.values(CATEGORIES_METADATA).find((category) => category.slug === slug);
};

// Get category by name
export const getCategoryByName = (name: string): CategoryMetadata | undefined => {
	return CATEGORIES_METADATA[name];
};

// Get all categories
export const getAllCategories = (): CategoryMetadata[] => {
	return Object.values(CATEGORIES_METADATA);
};

// Get featured categories
export const getFeaturedCategories = (): CategoryMetadata[] => {
	return Object.values(CATEGORIES_METADATA).filter((category) => category.featured);
};

// Get tools by category
export const getToolsByCategory = (categoryName: string): Tool[] => {
	return toolsData.filter((tool) => tool.category === categoryName);
};

// Get tools by subcategory
export const getToolsBySubcategory = (categoryName: string, subcategoryName: string): Tool[] => {
	const category = CATEGORIES_METADATA[categoryName];
	if (!category?.subcategories?.[subcategoryName]) {
		return [];
	}

	const toolIds = category.subcategories[subcategoryName].toolIds;
	return toolsData.filter((tool) => toolIds.includes(tool.id));
};

// Get category tool count
export const getCategoryToolCount = (categoryName: string): number => {
	return getToolsByCategory(categoryName).length;
};

// Get subcategory tool count
export const getSubcategoryToolCount = (categoryName: string, subcategoryName: string): number => {
	return getToolsBySubcategory(categoryName, subcategoryName).length;
};

// Generate breadcrumb navigation
export const generateBreadcrumb = (categoryName?: string, subcategoryName?: string): BreadcrumbItem[] => {
	const breadcrumb: BreadcrumbItem[] = [
		{ label: 'Home', href: '/tools' },
		{ label: 'Tools', href: '/tools' },
	];

	if (categoryName) {
		const category = CATEGORIES_METADATA[categoryName];
		if (category) {
			breadcrumb.push({
				label: category.name,
				href: `/tools/${category.slug}`,
			});
		}
	}

	if (subcategoryName && categoryName) {
		const category = CATEGORIES_METADATA[categoryName];
		const subcategory = category?.subcategories?.[subcategoryName];
		if (subcategory) {
			breadcrumb.push({
				label: subcategory.name,
				isActive: true,
			});
		}
	}

	return breadcrumb;
};

// Initialize navigation state
export const initializeNavigationState = (categorySlug?: string, subcategoryName?: string): CategoryNavigationState => {
	let activeCategory: ToolCategory | undefined;
	let activeSubcategory: string | undefined;
	let breadcrumb: BreadcrumbItem[];

	if (categorySlug) {
		const category = getCategoryBySlug(categorySlug);
		if (category) {
			activeCategory = category.name as ToolCategory;
			breadcrumb = generateBreadcrumb(category.name, subcategoryName);

			if (subcategoryName && category.subcategories?.[subcategoryName]) {
				activeSubcategory = subcategoryName;
			}
		} else {
			breadcrumb = generateBreadcrumb();
		}
	} else {
		breadcrumb = generateBreadcrumb();
	}

	return {
		activeCategory,
		activeSubcategory,
		breadcrumb,
		viewMode: 'grid',
		sortBy: 'name',
		filtersExpanded: false,
	};
};

// Sort tools by different criteria
export const sortTools = (tools: Tool[], sortBy: 'name' | 'popularity' | 'newest'): Tool[] => {
	const sorted = [...tools];

	switch (sortBy) {
		case 'name':
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		case 'popularity':
			return sorted.sort((a, b) => {
				const aPopular = a.isPopular ? 1 : 0;
				const bPopular = b.isPopular ? 1 : 0;
				return bPopular - aPopular;
			});
		case 'newest':
			return sorted.sort((a, b) => {
				const aNew = a.isNew ? 1 : 0;
				const bNew = b.isNew ? 1 : 0;
				return bNew - aNew;
			});
		default:
			return sorted;
	}
};

// Filter tools by category and subcategory
export const filterToolsByCategory = (tools: Tool[], categoryName?: string, subcategoryName?: string): Tool[] => {
	if (!categoryName) return tools;

	if (subcategoryName) {
		return getToolsBySubcategory(categoryName, subcategoryName);
	}

	return getToolsByCategory(categoryName);
};

// Get category statistics
export const getCategoryStats = () => {
	const stats = Object.values(CATEGORIES_METADATA).map((category) => ({
		...category,
		actualToolCount: getCategoryToolCount(category.name),
		popularTools: getToolsByCategory(category.name).filter((tool) => tool.isPopular),
		newTools: getToolsByCategory(category.name).filter((tool) => tool.isNew),
	}));

	return stats;
};

// Validate category exists
export const isValidCategory = (categoryName: string): boolean => {
	return Object.keys(CATEGORIES_METADATA).includes(categoryName);
};

// Validate subcategory exists
export const isValidSubcategory = (categoryName: string, subcategoryName: string): boolean => {
	const category = CATEGORIES_METADATA[categoryName];
	return category ? Object.keys(category.subcategories || {}).includes(subcategoryName) : false;
};
