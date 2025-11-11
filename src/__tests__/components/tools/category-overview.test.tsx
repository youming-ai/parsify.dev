import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryOverview } from '@/components/tools/category-overview';
import { mockTools } from '../../utils/test-data';
import { customRender } from '../../utils/test-utils';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

// Mock category utils
vi.mock('@/lib/category-utils', () => ({
	getToolsByCategory: (category: string) => {
		return mockTools.filter(tool => tool.category === category);
	},
	sortTools: (tools: any[], sortBy: string) => {
		return [...tools].sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.name.localeCompare(b.name);
				case 'popularity':
					return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
				case 'newest':
					return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
				default:
					return 0;
			}
		});
	},
}));

describe('CategoryOverview', () => {
	const mockCategory = {
		id: 'json-processing',
		name: 'JSON Processing',
		slug: 'json',
		icon: 'FileJson',
		description: 'JSON processing tools for formatting, validation, and conversion',
		color: 'blue',
		featured: true,
		toolCount: 3,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render category header', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
			expect(screen.getByText('JSON processing tools for formatting, validation, and conversion')).toBeInTheDocument();
		});

		it('should render category icon', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const icon = document.querySelector('.icon-filejson');
			expect(icon).toBeInTheDocument();
		});

		it('should render tool count badge', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			expect(screen.getByText('3 tools')).toBeInTheDocument();
		});

		it('should render view all button', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			expect(screen.getByText('View All')).toBeInTheDocument();
		});

		it('should show featured star for featured categories', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const featuredStar = document.querySelector('.text-yellow-500');
			expect(featuredStar).toBeInTheDocument();
		});

		it('should render tools grid', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBe(categoryTools.length);
		});
	});

	describe('Tool Cards', () => {
		it('should render tool information', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
			expect(screen.getByText('JSON Validator')).toBeInTheDocument();
		});

		it('should render tool descriptions', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			expect(screen.getByText('Format, beautify, and validate JSON data')).toBeInTheDocument();
			expect(screen.getByText('Comprehensive JSON validation with detailed error messages')).toBeInTheDocument();
		});

		it('should render tool badges', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			// Should show difficulty badges
			expect(screen.getAllByText('beginner')).toHaveLength(2);

			// Should show processing type badges
			expect(screen.getAllByText('client-side')).toHaveLength(2);
		});

		it('should render tool tags', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			expect(screen.getByText('json')).toBeInTheDocument();
			expect(screen.getByText('formatter')).toBeInTheDocument();
			expect(screen.getByText('validator')).toBeInTheDocument();
		});

		it('should limit displayed tools for featured categories', () => {
			const manyTools = Array(10).fill(mockTools[0]).map((tool, index) => ({
				...tool,
				id: `${tool.id}-${index}`,
				name: `${tool.name} ${index}`,
			}));

			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={manyTools}
					isFeatured={true}
				/>
			);

			// Featured categories should show only 4 tools
			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBe(4);
		});

		it('should limit displayed tools for regular categories', () => {
			const manyTools = Array(10).fill(mockTools[0]).map((tool, index) => ({
				...tool,
				id: `${tool.id}-${index}`,
				name: `${tool.name} ${index}`,
			}));

			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={manyTools}
					isFeatured={false}
				/>
			);

			// Regular categories should show only 8 tools
			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBe(8);
		});
	});

	describe('Navigation', () => {
		it('should navigate to category when view all is clicked', async () => {
			const user = userEvent.setup();
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const viewAllButton = screen.getByText('View All');
			await user.click(viewAllButton);

			expect(mockPush).toHaveBeenCalledWith('/tools/json');
		});

		it('should navigate to tool when tool card is clicked', async () => {
			const user = userEvent.setup();
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const toolCard = screen.getByText('JSON Formatter').closest('.cursor-pointer');
			await user.click(toolCard!);

			expect(mockPush).toHaveBeenCalledWith('/tools/json/formatter');
		});

		it('should show view all link when there are more tools', () => {
			const manyTools = Array(10).fill(mockTools[0]).map((tool, index) => ({
				...tool,
				id: `${tool.id}-${index}`,
				name: `${tool.name} ${index}`,
			}));

			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={manyTools}
				/>
			);

			expect(screen.getByText(/View all .* tools in JSON Processing/)).toBeInTheDocument();
		});

		it('should not show view all link when all tools are displayed', () => {
			const fewTools = mockTools.slice(0, 2);
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={fewTools}
					isFeatured={true}
				/>
			);

			expect(screen.queryByText(/View all .* tools in/)).not.toBeInTheDocument();
		});
	});

	describe('Styling and Layout', () => {
		it('should apply category color to icon', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const iconContainer = document.querySelector('.bg-blue-500');
			expect(iconContainer).toBeInTheDocument();
		});

		it('should have proper responsive grid layout', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			const grid = document.querySelector('.grid.grid-cols-1');
			expect(grid).toBeInTheDocument();
		});

		it('should have proper spacing between elements', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const container = document.querySelector('.space-y-4');
			expect(container).toBeInTheDocument();
		});

		it('should show chevron icon in view all button', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const chevronIcon = document.querySelector('.icon-chevron-right');
			expect(chevronIcon).toBeInTheDocument();
		});
	});

	describe('Interactive Elements', () => {
		it('should have hover effects on tool cards', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBeGreaterThan(0);
		});

		it('should have hover effects on view all button', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const viewAllButton = screen.getByText('View All');
			expect(viewAllButton).toHaveClass(/hover:/);
		});

		it('should have touch-friendly interactions', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			const touchElements = document.querySelectorAll('.touch-manipulation');
			expect(touchElements.length).toBeGreaterThan(0);
		});
	});

	describe('Accessibility', () => {
		it('should have proper heading hierarchy', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const heading = screen.getByRole('heading', { level: 3 });
			expect(heading).toHaveTextContent('JSON Processing');
		});

		it('should have proper button labels', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const viewAllButton = screen.getByRole('button', { name: /View All/ });
			expect(viewAllButton).toBeInTheDocument();
		});

		it('should have semantic HTML structure', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			// Should have proper sections
			const section = document.querySelector('section');
			expect(section).toBeInTheDocument();

			// Should have proper headings
			const headings = screen.getAllByRole('heading');
			expect(headings.length).toBeGreaterThan(0);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty tools array', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={[]}
				/>
			);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
			expect(screen.getByText('0 tools')).toBeInTheDocument();

			// Should not show tools grid
			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBe(0);
		});

		it('should handle single tool', () => {
			const singleTool = [mockTools[0]];
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={singleTool}
				/>
			);

			expect(screen.getByText('1 tools')).toBeInTheDocument();

			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBe(1);
		});

		it('should handle category without description', () => {
			const categoryWithoutDesc = {
				...mockCategory,
				description: '',
			};

			customRender(
				<CategoryOverview
					category={categoryWithoutDesc}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});

		it('should handle category without icon', () => {
			const categoryWithoutIcon = {
				...mockCategory,
				icon: '',
			};

			customRender(
				<CategoryOverview
					category={categoryWithoutIcon}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});
	});

	describe('Performance', () => {
		it('should handle many tools efficiently', () => {
			const manyTools = Array(50).fill(mockTools[0]).map((tool, index) => ({
				...tool,
				id: `${tool.id}-${index}`,
				name: `${tool.name} ${index}`,
			}));

			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={manyTools}
				/>
			);

			// Should still render efficiently
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();

			// Should limit displayed tools
			const toolCards = document.querySelectorAll('.hover\\:shadow-lg');
			expect(toolCards.length).toBeLessThanOrEqual(8); // Regular limit
		});

		it('should not re-render unnecessarily', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			const { rerender } = customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			rerender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});
	});

	describe('Visual Design', () => {
		it('should show category icon with proper styling', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const iconContainer = document.querySelector('.w-10.h-10');
			expect(iconContainer).toBeInTheDocument();
			expect(iconContainer).toHaveClass(/rounded-xl/);
		});

		it('should have proper text hierarchy', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const categoryName = screen.getByText('JSON Processing');
			expect(categoryName).toHaveClass(/font-bold/);
		});

		it('should have consistent spacing', () => {
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const container = document.querySelector('.space-y-6');
			expect(container).toBeInTheDocument();
		});
	});

	describe('Integration', () => {
		it('should work with routing system', async () => {
			const user = userEvent.setup();
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={mockTools.filter(tool => tool.category === 'JSON Processing')}
				/>
			);

			const viewAllButton = screen.getByText('View All');
			await user.click(viewAllButton);

			expect(mockPush).toHaveBeenCalled();
		});

		it('should integrate with tool data structure', () => {
			const categoryTools = mockTools.filter(tool => tool.category === 'JSON Processing');
			customRender(
				<CategoryOverview
					category={mockCategory}
					tools={categoryTools}
				/>
			);

			// Should display all tool properties correctly
			expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
			expect(screen.getByText('beginner')).toBeInTheDocument();
			expect(screen.getByText('client-side')).toBeInTheDocument();
		});
	});
});
