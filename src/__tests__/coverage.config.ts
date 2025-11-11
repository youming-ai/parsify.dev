import type { CoverageOptions } from 'vitest/config';

export const coverageConfig: Partial<CoverageOptions> = {
	provider: 'v8',
	reporter: ['text', 'json', 'html', 'lcov'],

	// Thresholds for code coverage
	thresholds: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},

	// Files and directories to exclude from coverage
	exclude: [
		'node_modules/',
		'src/__tests__/',
		'src/**/*.d.ts',
		'src/**/*.config.*',
		'src/**/*.stories.*',
		'src/**/*.spec.*',
		'coverage/**',
		'dist/**',
		'.next/**',
		'.output/**',
		'*.config.*',
		'vitest.config.*',
	],

	// Include only source files
	include: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/*.stories.*',
		'!src/**/*.test.*',
		'!src/**/*.spec.*',
	],

	// Watermarks for coverage visualization
	watermarks: {
		statements: [80, 95],
		functions: [80, 95],
		branches: [80, 95],
		lines: [80, 95],
	},

	// All files should have at least some coverage
	all: true,

	// Clean coverage report directories before running
	clean: true,

	// Clean on Rerun
	cleanOnRerun: true,

	// Additional reporting options
	reportOnFailure: true,

	// Per-file coverage thresholds (can be extended)
	perFile: false,

	// Skip full coverage for files with less than threshold lines
	skipFull: false,

	// Show only files with coverage less than threshold
	thresholdAutoUpdate: false,

	// Ignore uncovered lines that match these patterns
	ignoreUncoveredLines: [
		// TypeScript interfaces and type definitions
		'interface ',
		'type ',
		// React propTypes and displayName
		'.propTypes = ',
		'.displayName = ',
		// Next.js specific patterns
		'export default function',
		'export const metadata',
		// Error boundaries and fallbacks
		'catch ',
		'catch(',
		// Development and debug code
		'console.',
		'debugger',
		// Test utilities and mocks
		'vi.',
		'mock(',
		'jest.',
	],

	// Report files location
	reportsDirectory: 'coverage',

	// Additional coverage collection settings
	extension: ['.js', '.jsx', '.ts', '.tsx'],

	// Process coverage for all files in the project
	processedThreads: undefined,
};

// Per-component specific coverage requirements
export const componentCoverageThresholds = {
	// Homepage components
	'**/app/tools/page.tsx': {
		branches: 85,
		functions: 85,
		lines: 85,
		statements: 85,
	},

	// Search components
	'**/components/tools/tool-search.tsx': {
		branches: 90,
		functions: 90,
		lines: 90,
		statements: 90,
	},

	// Filter components
	'**/components/tools/tool-filters.tsx': {
		branches: 85,
		functions: 85,
		lines: 85,
		statements: 85,
	},

	// Navigation components
	'**/components/tools/category-navigation.tsx': {
		branches: 85,
		functions: 85,
		lines: 85,
		statements: 85,
	},

	// Utility functions (should have high coverage)
	'**/lib/search-utils.ts': {
		branches: 95,
		functions: 95,
		lines: 95,
		statements: 95,
	},

	'**/lib/category-utils.ts': {
		branches: 90,
		functions: 90,
		lines: 90,
		statements: 90,
	},

	'**/lib/mobile-utils.ts': {
		branches: 85,
		functions: 85,
		lines: 85,
		statements: 85,
	},

	// Hooks
	'**/hooks/use-responsive-layout.ts': {
		branches: 90,
		functions: 90,
		lines: 90,
		statements: 90,
	},
};

// Coverage reporting utilities
export const coverageUtils = {
	// Generate coverage summary for reporting
	generateSummary: (coverageResults: any) => {
		return {
			totalFiles: coverageResults.length,
			coveredFiles: coverageResults.filter((file: any) => file.coverage > 80).length,
			averageCoverage: coverageResults.reduce((sum: number, file: any) => sum + file.coverage, 0) / coverageResults.length,
			lowCoverageFiles: coverageResults.filter((file: any) => file.coverage < 80),
		};
	},

	// Check if coverage meets requirements
	checkCoverageRequirements: (coverageResults: any, requirements: any) => {
		const results = {
			passed: true,
			failedFiles: [] as string[],
			summary: {},
		};

		for (const [pattern, threshold] of Object.entries(requirements)) {
			const matchingFiles = coverageResults.filter((file: any) =>
				file.path.includes(pattern as string)
			);

			for (const file of matchingFiles) {
				if (file.coverage < (threshold as any).statements) {
					results.passed = false;
					results.failedFiles.push(file.path);
				}
			}
		}

		return results;
	},

	// Format coverage for different output formats
	formatCoverage: (coverageResults: any, format: 'markdown' | 'json' | 'text' = 'text') => {
		switch (format) {
			case 'markdown':
				return formatCoverageMarkdown(coverageResults);
			case 'json':
				return JSON.stringify(coverageResults, null, 2);
			case 'text':
			default:
				return formatCoverageText(coverageResults);
		}
	},
};

// Formatters for different output types
function formatCoverageText(coverageResults: any): string {
	let output = '\n📊 Coverage Report\n';
	output += '================\n\n';

	for (const file of coverageResults) {
		output += `📁 ${file.path}\n`;
		output += `   Lines: ${file.lines.pct}% (${file.lines.covered}/${file.lines.total})\n`;
		output += `   Functions: ${file.functions.pct}% (${file.functions.covered}/${file.functions.total})\n`;
		output += `   Branches: ${file.branches.pct}% (${file.branches.covered}/${file.branches.total})\n`;
		output += `   Statements: ${file.statements.pct}% (${file.statements.covered}/${file.statements.total})\n\n`;
	}

	return output;
}

function formatCoverageMarkdown(coverageResults: any): string {
	let output = '# 📊 Coverage Report\n\n';
	output += '| File | Lines | Functions | Branches | Statements |\n';
	output += '|------|-------|-----------|----------|------------|\n';

	for (const file of coverageResults) {
		const path = file.path.replace('src/', '').replace('.tsx', '').replace('.ts', '');
		output += `| \`${path}\` | ${file.lines.pct}% | ${file.functions.pct}% | ${file.branches.pct}% | ${file.statements.pct}% |\n`;
	}

	return output;
}

export default coverageConfig;
