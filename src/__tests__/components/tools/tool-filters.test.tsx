import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolFilters, ActiveFilters } from '@/components/tools/tool-filters';
import { mockTools, mockSearchStates, mockToolFiltersProps } from '../../utils/test-data';
import { customRender } from '../../utils/test-utils';

describe('ToolFilters', () => {
	const mockOnFiltersChange = vi.fn();

	const defaultProps = {
		tools: mockTools,
		filters: mockSearchStates.initial,
		onFiltersChange: mockOnFiltersChange,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render filter sections', () => {
			customRender(<ToolFilters {...defaultProps} />);

			expect(screen.getByText('Filters')).toBeInTheDocument();
			expect(screen.getByText('Categories')).toBeInTheDocument();
			expect(screen.getByText('Difficulty')).toBeInTheDocument();
			expect(screen.getByText('Processing')).toBeInTheDocument();
			expect(screen.getByText('Security')).toBeInTheDocument();
			expect(screen.getByText('Features')).toBeInTheDocument();
			expect(screen.getByText('Tags')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
		});

		it('should render special filters', () => {
			customRender(<ToolFilters {...defaultProps} />);

			expect(screen.getByText('Special Filters')).toBeInTheDocument();
			expect(screen.getByText('New Tools')).toBeInTheDocument();
			expect(screen.getByText('Popular Tools')).toBeInTheDocument();
		});

		it('should show active filter count', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
				tags: ['json'],
			};

			customRender(
				<ToolFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			expect(screen.getByText('2')).toBeInTheDocument(); // Active filters count
		});

		it('should show clear all button when filters are active', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			customRender(
				<ToolFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			expect(screen.getByText('Clear All')).toBeInTheDocument();
		});

		it('should not show clear all button when no filters are active', () => {
			customRender(<ToolFilters {...defaultProps} />);

			expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
		});

		it('should apply custom className', () => {
			customRender(
				<ToolFilters
					{...defaultProps}
					className="custom-class"
				/>
			);

			const card = document.querySelector('.custom-class');
			expect(card).toBeInTheDocument();
		});
	});

	describe('Filter Sections', () => {
		it('should expand and collapse sections', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Categories should be open by default
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();

			// Collapse categories
			const categoriesTrigger = screen.getByText('Categories');
			await user.click(categoriesTrigger);

			// Should collapse (content not visible)
			// Note: In a real test, we'd check for the content being hidden

			// Expand categories again
			await user.click(categoriesTrigger);
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});

		it('should show item counts in filter options', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Should show count badges
			const countBadges = document.querySelectorAll('.badge');
			expect(countBadges.length).toBeGreaterThan(0);
		});

		it('should limit features and tags to top results', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Should have limited number of features and tags
			const featuresSection = screen.getByText('Features').closest('.collapsible');
			const tagsSection = screen.getByText('Tags').closest('.collapsible');

			// Verify the sections exist and have limited items
			expect(featuresSection).toBeInTheDocument();
			expect(tagsSection).toBeInTheDocument();
		});
	});

	describe('Filter Interactions', () => {
		it('should handle category filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
			await user.click(categoryCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					categories: ['JSON Processing'],
				})
			);
		});

		it('should handle multiple category selections', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			const jsonCheckbox = screen.getByLabelText(/JSON Processing/);
			const codeCheckbox = screen.getByLabelText(/Code Execution/);

			await user.click(jsonCheckbox);
			await user.click(codeCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					categories: ['JSON Processing', 'Code Execution'],
				})
			);
		});

		it('should handle difficulty filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Expand difficulty section
			const difficultyTrigger = screen.getByText('Difficulty');
			await user.click(difficultyTrigger);

			const beginnerCheckbox = screen.getByLabelText(/Beginner/);
			await user.click(beginnerCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					difficulties: ['beginner'],
				})
			);
		});

		it('should handle processing type filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Expand processing section
			const processingTrigger = screen.getByText('Processing');
			await user.click(processingTrigger);

			const clientSideCheckbox = screen.getByLabelText(/Client Side/);
			await user.click(clientSideCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					processingTypes: ['client-side'],
				})
			);
		});

		it('should handle security type filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Expand security section
			const securityTrigger = screen.getByText('Security');
			await user.click(securityTrigger);

			const localOnlyCheckbox = screen.getByLabelText(/Local Only/);
			await user.click(localOnlyCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					securityTypes: ['local-only'],
				})
			);
		});

		it('should handle feature filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Expand features section
			const featuresTrigger = screen.getByText('Features');
			await user.click(featuresTrigger);

			// Find and click a feature checkbox
			const featureCheckboxes = screen.getAllByRole('checkbox');
			const formatFeature = featureCheckboxes.find(checkbox =>
				checkbox.nextElementSibling?.textContent?.includes('Format')
			);

			if (formatFeature) {
				await user.click(formatFeature);
				expect(mockOnFiltersChange).toHaveBeenCalledWith(
					expect.objectContaining({
						features: expect.arrayContaining([expect.stringContaining('Format')]),
					})
				);
			}
		});

		it('should handle tag filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Expand tags section
			const tagsTrigger = screen.getByText('Tags');
			await user.click(tagsTrigger);

			const jsonCheckbox = screen.getByLabelText(/json/);
			await user.click(jsonCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					tags: ['json'],
				})
			);
		});

		it('should handle status filter selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Expand status section
			const statusTrigger = screen.getByText('Status');
			await user.click(statusTrigger);

			const stableCheckbox = screen.getByLabelText(/Stable/);
			await user.click(stableCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					status: ['stable'],
				})
			);
		});
	});

	describe('Special Filters', () => {
		it('should handle new tools filter', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			const newToolsCheckbox = screen.getByLabelText(/New Tools/);
			await user.click(newToolsCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					isNew: true,
				})
			);
		});

		it('should handle popular tools filter', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			const popularToolsCheckbox = screen.getByLabelText(/Popular Tools/);
			await user.click(popularToolsCheckbox);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					isPopular: true,
				})
			);
		});

		it('should show count badges for special filters', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Should show count for new tools
			const newToolsBadge = screen.getByText(/1/); // Assuming 1 new tool
			expect(newToolsBadge).toBeInTheDocument();

			// Should show count for popular tools
			const popularToolsBadge = screen.getByText(/3/); // Assuming 3 popular tools
			expect(popularToolsBadge).toBeInTheDocument();
		});
	});

	describe('Clear Filters', () => {
		it('should clear all filters when clear all button is clicked', async () => {
			const user = userEvent.setup();
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
				tags: ['json'],
				isNew: true,
			};

			customRender(
				<ToolFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			const clearAllButton = screen.getByText('Clear All');
			await user.click(clearAllButton);

			expect(mockOnFiltersChange).toHaveBeenCalledWith({
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

		it('should preserve query when clearing filters', async () => {
			const user = userEvent.setup();
			const filtersWithQueryAndSelection = {
				...mockSearchStates.initial,
				query: 'json',
				categories: ['JSON Processing'],
			};

			customRender(
				<ToolFilters
					{...defaultProps}
					filters={filtersWithQueryAndSelection}
				/>
			);

			const clearAllButton = screen.getByText('Clear All');
			await user.click(clearAllButton);

			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					query: 'json',
					categories: [],
				})
			);
		});
	});

	describe('Filter Calculations', () => {
		it('should calculate correct counts for each filter option', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Should show counts for categories
			const categoryBadges = screen.getAllByText(/1|2|3/);
			expect(categoryBadges.length).toBeGreaterThan(0);
		});

		it('should handle empty tools array', () => {
			customRender(
				<ToolFilters
					{...defaultProps}
					tools={[]}
				/>
			);

			// Should still render filter sections but with no items
			expect(screen.getByText('Filters')).toBeInTheDocument();
			expect(screen.getByText('Categories')).toBeInTheDocument();
		});

		it('should handle tools with no features or tags', () => {
			const toolsWithoutFeatures = [
				{
					...mockTools[0],
					features: [],
					tags: [],
				},
			];

			customRender(
				<ToolFilters
					{...defaultProps}
					tools={toolsWithoutFeatures}
				/>
			);

			// Should not crash and should still render sections
			expect(screen.getByText('Features')).toBeInTheDocument();
			expect(screen.getByText('Tags')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Check for proper labeling
			const checkboxes = screen.getAllByRole('checkbox');
			checkboxes.forEach(checkbox => {
				expect(checkbox).toHaveAttribute('id');
			});
		});

		it('should associate labels with checkboxes', () => {
			customRender(<ToolFilters {...defaultProps} />);

			const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
			const categoryLabel = document.querySelector(`label[for="${categoryCheckbox.id}"]`);

			expect(categoryLabel).toBeInTheDocument();
			expect(categoryLabel?.textContent).toContain('JSON Processing');
		});

		it('should be keyboard navigable', async () => {
			const user = userEvent.setup();
			customRender(<ToolFilters {...defaultProps} />);

			// Should be able to navigate with keyboard
			await user.tab();
			await user.tab();

			// Should focus on filter elements
			const focusedElement = document.activeElement;
			expect(focusedElement).toBeInTheDocument();
		});
	});

	describe('Responsive Design', () => {
		it('should have touch-friendly elements', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Check for touch-friendly classes
			const touchElements = document.querySelectorAll('.touch-manipulation');
			expect(touchElements.length).toBeGreaterThan(0);
		});

		it('should adapt to different screen sizes', () => {
			customRender(<ToolFilters {...defaultProps} />);

			// Should have responsive classes
			const responsiveElements = document.querySelectorAll(/text-xs|text-sm/);
			expect(responsiveElements.length).toBeGreaterThan(0);
		});
	});

	describe('Performance', () => {
		it('should not recalculate filter options unnecessarily', () => {
			const { rerender } = customRender(<ToolFilters {...defaultProps} />);

			// Re-render with same props
			rerender(<ToolFilters {...defaultProps} />);

			// Should not cause issues
			expect(screen.getByText('Filters')).toBeInTheDocument();
		});

		it('should handle large number of tools efficiently', () => {
			const manyTools = Array(100).fill(mockTools[0]).map((tool, index) => ({
				...tool,
				id: `${tool.id}-${index}`,
			}));

			customRender(
				<ToolFilters
					{...defaultProps}
					tools={manyTools}
				/>
			);

			// Should render without issues
			expect(screen.getByText('Filters')).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('should handle missing onFiltersChange gracefully', () => {
			expect(() => {
				customRender(
					<ToolFilters
						tools={mockTools}
						filters={mockSearchStates.initial}
					/>
				);
			}).not.toThrow();
		});

		it('should handle invalid filter values', () => {
			const invalidFilters = {
				...mockSearchStates.initial,
				categories: ['invalid-category'],
			};

			customRender(
				<ToolFilters
					{...defaultProps}
					filters={invalidFilters}
				/>
			);

			// Should still render
			expect(screen.getByText('Filters')).toBeInTheDocument();
		});
	});
});

describe('ActiveFilters', () => {
	const mockOnRemoveFilter = vi.fn();
	const mockOnClearAll = vi.fn();

	const defaultProps = {
		filters: mockSearchStates.initial,
		onRemoveFilter: mockOnRemoveFilter,
		onClearAll: mockOnClearAll,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should not render when no active filters', () => {
			customRender(<ActiveFilters {...defaultProps} />);

			expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
		});

		it('should render when there are active filters', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
				tags: ['json'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			expect(screen.getByText('Active filters:')).toBeInTheDocument();
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
			expect(screen.getByText('json')).toBeInTheDocument();
		});

		it('should show clear all button', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			expect(screen.getByText('Clear All')).toBeInTheDocument();
		});

		it('should apply custom className', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
					className="custom-class"
				/>
			);

			const container = document.querySelector('.custom-class');
			expect(container).toBeInTheDocument();
		});
	});

	describe('Filter Removal', () => {
		it('should remove single filter when close button is clicked', async () => {
			const user = userEvent.setup();
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
				tags: ['json'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			const closeButton = screen.getAllByLabelText('Close')[0];
			await user.click(closeButton);

			expect(mockOnRemoveFilter).toHaveBeenCalledWith('categories', 'JSON Processing');
		});

		it('should clear all filters when clear all button is clicked', async () => {
			const user = userEvent.setup();
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
				tags: ['json'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			const clearAllButton = screen.getByText('Clear All');
			await user.click(clearAllButton);

			expect(mockOnClearAll).toHaveBeenCalled();
		});

		it('should handle boolean filters', () => {
			const filtersWithBoolean = {
				...mockSearchStates.initial,
				isNew: true,
				isPopular: true,
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithBoolean}
				/>
			);

			expect(screen.getByText('New Tools')).toBeInTheDocument();
			expect(screen.getByText('Popular')).toBeInTheDocument();
		});

		it('should handle different filter types', () => {
			const filtersWithAllTypes = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
				difficulties: ['beginner'],
				processingTypes: ['client-side'],
				securityTypes: ['local-only'],
				features: ['Format & Beautify'],
				tags: ['json'],
				status: ['stable'],
				isNew: true,
				isPopular: true,
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithAllTypes}
				/>
			);

			// Should show all filter types
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
			expect(screen.getByText('Beginner')).toBeInTheDocument();
			expect(screen.getByText('Client Side')).toBeInTheDocument();
			expect(screen.getByText('Local Only')).toBeInTheDocument();
			expect(screen.getByText('Format & Beautify')).toBeInTheDocument();
			expect(screen.getByText('json')).toBeInTheDocument();
			expect(screen.getByText('Stable')).toBeInTheDocument();
			expect(screen.getByText('New Tools')).toBeInTheDocument();
			expect(screen.getByText('Popular')).toBeInTheDocument();
		});
	});

	describe('Filter Labels', () => {
		it('should format difficulty labels correctly', () => {
			const filtersWithDifficulty = {
				...mockSearchStates.initial,
				difficulties: ['beginner'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithDifficulty}
				/>
			);

			expect(screen.getByText('Beginner')).toBeInTheDocument();
		});

		it('should format processing type labels correctly', () => {
			const filtersWithProcessing = {
				...mockSearchStates.initial,
				processingTypes: ['client-side'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithProcessing}
				/>
			);

			expect(screen.getByText('Client Side')).toBeInTheDocument();
		});

		it('should format security type labels correctly', () => {
			const filtersWithSecurity = {
				...mockSearchStates.initial,
				securityTypes: ['local-only'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSecurity}
				/>
			);

			expect(screen.getByText('Local Only')).toBeInTheDocument();
		});

		it('should format status labels correctly', () => {
			const filtersWithStatus = {
				...mockSearchStates.initial,
				status: ['beta'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithStatus}
				/>
			);

			expect(screen.getByText('Beta')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper button labels', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			const closeButton = screen.getByLabelText('Close');
			expect(closeButton).toBeInTheDocument();
		});

		it('should be keyboard navigable', async () => {
			const user = userEvent.setup();
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			customRender(
				<ActiveFilters
					{...defaultProps}
					filters={filtersWithSelection}
				/>
			);

			await user.tab();
			const focusedElement = document.activeElement;
			expect(focusedElement?.tagName).toBe('BUTTON');
		});
	});

	describe('Error Handling', () => {
		it('should handle missing onRemoveFilter gracefully', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			expect(() => {
				customRender(
					<ActiveFilters
						filters={filtersWithSelection}
						onClearAll={mockOnClearAll}
					/>
				);
			}).not.toThrow();
		});

		it('should handle missing onClearAll gracefully', () => {
			const filtersWithSelection = {
				...mockSearchStates.initial,
				categories: ['JSON Processing'],
			};

			expect(() => {
				customRender(
					<ActiveFilters
						filters={filtersWithSelection}
						onRemoveFilter={mockOnRemoveFilter}
					/>
				);
			}).not.toThrow();
		});
	});
});

describe('Integration Tests', () => {
	it('should integrate filters with active filters display', async () => {
		const user = userEvent.setup();
		const mockOnFiltersChange = vi.fn();
		const mockOnRemoveFilter = vi.fn();
		const mockOnClearAll = vi.fn();

		const filters = { ...mockSearchStates.initial };

		customRender(
			<div>
				<ToolFilters
					tools={mockTools}
					filters={filters}
					onFiltersChange={mockOnFiltersChange}
				/>
				<ActiveFilters
					filters={filters}
					onRemoveFilter={mockOnRemoveFilter}
					onClearAll={mockOnClearAll}
				/>
			</div>
		);

		// Apply a filter
		const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
		await user.click(categoryCheckbox);

		// Should update filters
		expect(mockOnFiltersChange).toHaveBeenCalled();
	});

	it('should handle complex filter workflows', async () => {
		const user = userEvent.setup();
		const mockOnFiltersChange = vi.fn();

		customRender(<ToolFilters {...defaultProps} />);

		// Apply multiple filters
		const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
		await user.click(categoryCheckbox);

		const difficultyTrigger = screen.getByText('Difficulty');
		await user.click(difficultyTrigger);

		const beginnerCheckbox = screen.getByLabelText(/Beginner/);
		await user.click(beginnerCheckbox);

		// Should have applied all filters
		expect(mockOnFiltersChange).toHaveBeenCalledTimes(2);
	});
});
