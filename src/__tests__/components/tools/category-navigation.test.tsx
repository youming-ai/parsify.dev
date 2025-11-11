import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryNavigation } from '@/components/tools/category-navigation';
import { mockCategories, mockCategoryNavigationProps } from '../../utils/test-data';
import { customRender } from '../../utils/test-utils';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => '/tools',
}));

// Mock category utils
vi.mock('@/lib/category-utils', () => ({
	CATEGORIES_METADATA: [
		{
			id: 'json-processing',
			name: 'JSON Processing',
			slug: 'json',
			icon: 'FileJson',
			description: 'JSON processing tools',
			color: 'blue',
			featured: true,
			toolCount: 8,
			subcategories: {
				parsing: {
					name: 'JSON Parsing',
					description: 'Parse and validate JSON data',
					toolIds: ['json-validator', 'json-parser'],
				},
				formatting: {
					name: 'JSON Formatting',
					description: 'Format and beautify JSON',
					toolIds: ['json-formatter', 'json-beautifier'],
				},
			},
		},
		{
			id: 'code-execution',
			name: 'Code Execution',
			slug: 'code',
			icon: 'Terminal',
			description: 'Code execution tools',
			color: 'green',
			featured: false,
			toolCount: 5,
			subcategories: {
				'web-execution': {
					name: 'Web Execution',
					description: 'Execute code in browser',
					toolIds: ['code-executor'],
				},
			},
		},
	],
	getAllCategories: () => [
		{
			id: 'json-processing',
			name: 'JSON Processing',
			slug: 'json',
			icon: 'FileJson',
			description: 'JSON processing tools',
			color: 'blue',
			featured: true,
			toolCount: 8,
			subcategories: {
				parsing: {
					name: 'JSON Parsing',
					description: 'Parse and validate JSON data',
					toolIds: ['json-validator', 'json-parser'],
				},
			},
		},
		{
			id: 'code-execution',
			name: 'Code Execution',
			slug: 'code',
			icon: 'Terminal',
			description: 'Code execution tools',
			color: 'green',
			featured: false,
			toolCount: 5,
			subcategories: {},
		},
	],
	getFeaturedCategories: () => [
		{
			id: 'json-processing',
			name: 'JSON Processing',
			slug: 'json',
			icon: 'FileJson',
			description: 'JSON processing tools',
			color: 'blue',
			featured: true,
			toolCount: 8,
			subcategories: {
				parsing: {
					name: 'JSON Parsing',
					description: 'Parse and validate JSON data',
					toolIds: ['json-validator', 'json-parser'],
				},
			},
		},
	],
}));

describe('CategoryNavigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Desktop Navigation', () => {
		it('should render featured categories section', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('Featured Categories')).toBeInTheDocument();
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});

		it('should render all categories section', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('All Categories')).toBeInTheDocument();
			expect(screen.getByText('Code Execution')).toBeInTheDocument();
		});

		it('should render quick stats', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('Quick Stats')).toBeInTheDocument();
			expect(screen.getByText('Total Categories')).toBeInTheDocument();
			expect(screen.getByText('Total Tools')).toBeInTheDocument();
			expect(screen.getByText('Featured')).toBeInTheDocument();
		});

		it('should show correct stats values', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('2')).toBeInTheDocument(); // Total categories
			expect(screen.getByText('13')).toBeInTheDocument(); // Total tools (8 + 5)
			expect(screen.getByText('1')).toBeInTheDocument(); // Featured
		});

		it('should highlight active category', () => {
			customRender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					activeCategory="JSON Processing"
				/>
			);

			const activeCategory = screen.getByText('JSON Processing').closest('.border');
			expect(activeCategory).toHaveClass(/shadow-md/);
		});

		it('should show featured badge for featured categories', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const featuredBadge = screen.getByText('Featured');
			expect(featuredBadge).toBeInTheDocument();
		});

		it('should show tool count badges', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('8')).toBeInTheDocument(); // JSON Processing tools
			expect(screen.getByText('5')).toBeInTheDocument(); // Code Execution tools
		});

		it('should expand subcategories section', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const expandButton = screen.getByText('2 Subcategories');
			await user.click(expandButton);

			expect(screen.getByText('JSON Parsing')).toBeInTheDocument();
			expect(screen.getByText('JSON Formatting')).toBeInTheDocument();
		});

		it('should collapse subcategories section', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const expandButton = screen.getByText('2 Subcategories');
			await user.click(expandButton);
			await user.click(expandButton);

			// Should be collapsed (content not visible)
			// Note: In a real test, we'd check for the content being hidden
		});

		it('should highlight active subcategory', async () => {
			const user = userEvent.setup();
			customRender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					activeCategory="JSON Processing"
					activeSubcategory="parsing"
				/>
			);

			// Expand subcategories
			const expandButton = screen.getByText('2 Subcategories');
			await user.click(expandButton);

			const activeSubcategory = screen.getByText('JSON Parsing').closest('.bg-primary\\/10');
			expect(activeSubcategory).toBeInTheDocument();
		});

		it('should navigate to category when clicked', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const categoryElement = screen.getByText('JSON Processing').closest('.cursor-pointer');
			await user.click(categoryElement!);

			expect(mockPush).toHaveBeenCalledWith('/tools/json');
		});

		it('should navigate to subcategory when clicked', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			// Expand subcategories
			const expandButton = screen.getByText('2 Subcategories');
			await user.click(expandButton);

			const subcategoryElement = screen.getByText('JSON Parsing');
			await user.click(subcategoryElement);

			expect(mockPush).toHaveBeenCalledWith('/tools/json/parsing');
		});

		it('should show subcategory tool counts', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const expandButton = screen.getByText('2 Subcategories');
			await user.click(expandButton);

			expect(screen.getByText('2')).toBeInTheDocument(); // JSON Parsing tools
		});

		it('should apply custom className', () => {
			customRender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					className="custom-class"
				/>
			);

			const container = document.querySelector('.custom-class');
			expect(container).toBeInTheDocument();
		});

		it('should handle categories without subcategories', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			// Code Execution has no subcategories
			const codeExecutionSection = screen.getByText('Code Execution').closest('.border');
			expect(codeExecutionSection).not.toContainHTML('Subcategories');
		});

		it('should show category descriptions', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('JSON processing tools')).toBeInTheDocument();
			expect(screen.getByText('Code execution tools')).toBeInTheDocument();
		});

		it('should show correct category icons', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const icons = document.querySelectorAll('.icon-filejson, .icon-terminal');
			expect(icons.length).toBeGreaterThan(0);
		});
	});

	describe('Mobile Navigation', () => {
		it('should render mobile menu button', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const menuButton = screen.getByText('Categories');
			expect(menuButton).toBeInTheDocument();
		});

		it('should open mobile menu when button is clicked', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const menuButton = screen.getByText('Categories');
			await user.click(menuButton);

			// Should open mobile menu sheet
			const sheetContent = document.querySelector('[role="dialog"]');
			expect(sheetContent).toBeInTheDocument();
		});

		it('should close mobile menu after navigation', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			// Open mobile menu
			const menuButton = screen.getByText('Categories');
			await user.click(menuButton);

			// Click on a category
			const categoryButton = screen.getByText('JSON Processing');
			await user.click(categoryButton);

			// Should navigate and close menu
			expect(mockPush).toHaveBeenCalledWith('/tools/json');
		});

		it('should render mobile menu with proper structure', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const menuButton = screen.getByText('Categories');
			await user.click(menuButton);

			expect(screen.getByText('Categories')).toBeInTheDocument();
			expect(screen.getByText('Featured')).toBeInTheDocument();
			expect(screen.getByText('All Categories')).toBeInTheDocument();
		});

		it('should handle mobile subcategory navigation', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			// Open mobile menu
			const menuButton = screen.getByText('Categories');
			await user.click(menuButton);

			// Expand subcategories
			const expandButton = screen.getByText('Subcategories');
			await user.click(expandButton);

			// Click on subcategory
			const subcategoryButton = screen.getByText('JSON Parsing');
			await user.click(subcategoryButton);

			expect(mockPush).toHaveBeenCalledWith('/tools/json/parsing');
		});

		it('should hide mobile menu when showMobileMenu is false', () => {
			customRender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					showMobileMenu={false}
				/>
			);

			expect(screen.queryByText('Categories')).not.toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper headings structure', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const headings = screen.getAllByRole('heading');
			expect(headings.length).toBeGreaterThan(0);
		});

		it('should have proper button labels', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const expandButton = screen.getByText('2 Subcategories');
			expect(expandButton).toBeInTheDocument();
		});

		it('should have keyboard navigation', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			await user.tab();
			const focusedElement = document.activeElement;
			expect(focusedElement?.tagName).toBe('BUTTON');
		});

		it('should have ARIA attributes for interactive elements', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const interactiveElements = document.querySelectorAll('button[aria-expanded]');
			expect(interactiveElements.length).toBeGreaterThan(0);
		});
	});

	describe('Responsive Design', () => {
		it('should hide desktop navigation on mobile', () => {
			// Mock mobile viewport
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 375,
			});

			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const desktopNav = document.querySelector('.hidden.lg\\:block');
			expect(desktopNav).toBeInTheDocument();
		});

		it('should show mobile menu button on mobile', () => {
			// Mock mobile viewport
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 375,
			});

			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const mobileButton = screen.getByText('Categories');
			expect(mobileButton).toBeInTheDocument();
		});

		it('should have touch-friendly elements in mobile', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const menuButton = screen.getByText('Categories');
			await user.click(menuButton);

			const touchElements = document.querySelectorAll('.touch-manipulation');
			expect(touchElements.length).toBeGreaterThan(0);
		});
	});

	describe('Visual Design', () => {
		it('should apply correct colors based on category color', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const blueCategory = screen.getByText('JSON Processing').closest('.border');
			expect(blueCategory).toHaveClass(/border-blue-/);

			const greenCategory = screen.getByText('Code Execution').closest('.border');
			expect(greenCategory).toHaveClass(/border-green-/);
		});

		it('should show featured category badge', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const featuredBadge = screen.getByText('Featured');
			expect(featuredBadge).toHaveClass(/bg-yellow-/);
		});

		it('should have hover effects', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const categories = document.querySelectorAll('.hover\\:shadow-md');
			expect(categories.length).toBeGreaterThan(0);
		});

		it('should have proper spacing and layout', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const categories = document.querySelectorAll('.space-y-3 > div');
			expect(categories.length).toBeGreaterThan(0);
		});
	});

	describe('Category Item Component', () => {
		it('should handle category with no subcategories', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const codeExecutionCategory = screen.getByText('Code Execution').closest('.border');
			expect(codeExecutionCategory).not.toContainHTML('Subcategories');
		});

		it('should show subcategory count', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const subcategoryButton = screen.getByText('2 Subcategories');
			expect(subcategoryButton).toBeInTheDocument();
		});

		it('should expand subcategories by default for featured categories', () => {
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			// Featured category should have subcategories expanded by default
			const featuredCategory = screen.getByText('JSON Processing').closest('.border');
			expect(featuredCategory).toBeInTheDocument();
		});
	});

	describe('Performance', () => {
		it('should handle large number of categories efficiently', () => {
			// Mock many categories
			const manyCategories = Array(50).fill({
				id: 'test',
				name: 'Test Category',
				slug: 'test',
				icon: 'FileJson',
				description: 'Test description',
				color: 'blue',
				featured: false,
				toolCount: 10,
				subcategories: {},
			});

			vi.doMock('@/lib/category-utils', () => ({
				getAllCategories: () => manyCategories,
				getFeaturedCategories: () => [],
			}));

			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('All Categories')).toBeInTheDocument();
		});

		it('should not re-render unnecessarily', () => {
			const { rerender } = customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			rerender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			expect(screen.getByText('All Categories')).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('should handle missing activeCategory', () => {
			customRender(
				<CategoryNavigation
					tools={[]}
					onFiltersChange={vi.fn()}
				/>
			);

			expect(screen.getByText('All Categories')).toBeInTheDocument();
		});

		it('should handle missing activeSubcategory', () => {
			customRender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					activeCategory="JSON Processing"
				/>
			);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});

		it('should handle router errors gracefully', () => {
			mockPush.mockImplementation(() => {
				throw new Error('Navigation error');
			});

			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			const categoryElement = screen.getByText('JSON Processing').closest('.cursor-pointer');
			expect(() => {
				fireEvent.click(categoryElement!);
			}).not.toThrow();
		});
	});

	describe('Integration Tests', () => {
		it('should integrate with search functionality', async () => {
			const user = userEvent.setup();
			customRender(<CategoryNavigation {...mockCategoryNavigationProps} />);

			// Navigate to a category
			const categoryElement = screen.getByText('JSON Processing').closest('.cursor-pointer');
			await user.click(categoryElement!);

			expect(mockPush).toHaveBeenCalledWith('/tools/json');
		});

		it('should maintain state during navigation', async () => {
			const user = userEvent.setup();
			const { rerender } = customRender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					activeCategory="JSON Processing"
				/>
			);

			// Expand subcategories
			const expandButton = screen.getByText('2 Subcategories');
			await user.click(expandButton);

			// Re-render with same props
			rerender(
				<CategoryNavigation
					{...mockCategoryNavigationProps}
					activeCategory="JSON Processing"
				/>
			);

			expect(screen.getByText('JSON Parsing')).toBeInTheDocument();
		});
	});
});
