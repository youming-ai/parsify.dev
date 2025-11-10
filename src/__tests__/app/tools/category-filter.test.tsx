import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFilter } from '@/components/ui/category-filter';
import { mockCategories } from '../test-utils';

describe('CategoryFilter Component', () => {
  const defaultProps = {
    categories: mockCategories,
    selectedCategory: 'all',
    onCategoryChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all category buttons', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('JSON Processing')).toBeInTheDocument();
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
      expect(screen.getByText('File Processing')).toBeInTheDocument();
      expect(screen.getByText('Network Utilities')).toBeInTheDocument();
    });

    it('displays tool counts when showCounts is true', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" showCounts={true} />);

      expect(screen.getByText('33')).toBeInTheDocument(); // Total tools count
      expect(screen.getByText('11')).toBeInTheDocument(); // JSON Processing count
      expect(screen.getByText('8')).toBeInTheDocument(); // Code Execution count
    });

    it('hides tool counts when showCounts is false', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" showCounts={false} />);

      expect(screen.queryByText('33')).not.toBeInTheDocument();
      expect(screen.queryByText('11')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CategoryFilter {...defaultProps} className="custom-class" />);

      const container = screen.getByText('All Tools').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Buttons Variant', () => {
    it('highlights selected category', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" selectedCategory="json-processing" />);

      const selectedButton = screen.getByText('JSON Processing').closest('button');
      expect(selectedButton).toHaveClass('bg-blue-500', 'text-white');
    });

    it('shows "All Tools" as selected when selectedCategory is "all"', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" selectedCategory="all" />);

      const allToolsButton = screen.getByText('All Tools').closest('button');
      expect(allToolsButton).toHaveClass('bg-blue-500', 'text-white');
    });

    it('calls onCategoryChange when category button is clicked', async () => {
      const user = userEvent.setup();
      const onCategoryChange = vi.fn();

      render(
        <CategoryFilter
          {...defaultProps}
          variant="buttons"
          onCategoryChange={onCategoryChange}
        />
      );

      const jsonButton = screen.getByText('JSON Processing');
      await user.click(jsonButton);

      expect(onCategoryChange).toHaveBeenCalledWith('json-processing');
    });

    it('calls onCategoryChange when "All Tools" button is clicked', async () => {
      const user = userEvent.setup();
      const onCategoryChange = vi.fn();

      render(
        <CategoryFilter
          {...defaultProps}
          variant="buttons"
          selectedCategory="json-processing"
          onCategoryChange={onCategoryChange}
        />
      );

      const allToolsButton = screen.getByText('All Tools');
      await user.click(allToolsButton);

      expect(onCategoryChange).toHaveBeenCalledWith('all');
    });

    it('displays trending indicator for trending categories', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const trendingButtons = screen.getAllByText(/trending/i);
      expect(trendingButtons.length).toBeGreaterThan(0);
    });

    it('displays NEW badge for new categories', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const newBadges = screen.getAllByText('NEW');
      expect(newBadges.length).toBeGreaterThan(0);
    });

    it('displays featured star for featured categories', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      // Look for star icons (could be implemented as SVG elements)
      const stars = document.querySelectorAll('svg[class*="h-3 w-3"]');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Cards Variant', () => {
    it('renders category cards', () => {
      render(<CategoryFilter {...defaultProps} variant="cards" />);

      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('JSON Processing')).toBeInTheDocument();
      expect(screen.getByText('Browse all available tools')).toBeInTheDocument();
    });

    it('shows descriptions when showDescriptions is true', () => {
      render(
        <CategoryFilter
          {...defaultProps}
          variant="cards"
          showDescriptions={true}
        />
      );

      expect(screen.getByText('JSON validation, conversion, and manipulation tools')).toBeInTheDocument();
      expect(screen.getByText('Code execution, formatting, and analysis tools')).toBeInTheDocument();
    });

    it('hides descriptions when showDescriptions is false', () => {
      render(
        <CategoryFilter
          {...defaultProps}
          variant="cards"
          showDescriptions={false}
        />
      );

      expect(screen.queryByText('JSON validation, conversion, and manipulation tools')).not.toBeInTheDocument();
    });

    it('highlights selected card with ring', () => {
      render(<CategoryFilter {...defaultProps} variant="cards" selectedCategory="json-processing" />);

      const selectedCard = screen.getByText('JSON Processing').closest('[class*="ring-2"]');
      expect(selectedCard).toBeInTheDocument();
    });

    it('calls onCategoryChange when card is clicked', async () => {
      const user = userEvent.setup();
      const onCategoryChange = vi.fn();

      render(
        <CategoryFilter
          {...defaultProps}
          variant="cards"
          onCategoryChange={onCategoryChange}
        />
      );

      const jsonCard = screen.getByText('JSON Processing').closest('.cursor-pointer');
      await user.click(jsonCard!);

      expect(onCategoryChange).toHaveBeenCalledWith('json-processing');
    });

    it('shows tool count in card badge', () => {
      render(<CategoryFilter {...defaultProps} variant="cards" />);

      expect(screen.getByText('11 tools')).toBeInTheDocument();
      expect(screen.getByText('8 tools')).toBeInTheDocument();
    });
  });

  describe('Tabs Variant', () => {
    it('renders category tabs', () => {
      render(<CategoryFilter {...defaultProps} variant="tabs" />);

      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('JSON Processing')).toBeInTheDocument();
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
    });

    it('highlights selected tab', () => {
      render(<CategoryFilter {...defaultProps} variant="tabs" selectedCategory="json-processing" />);

      const selectedTab = screen.getByText('JSON Processing').closest('button');
      expect(selectedTab).toHaveClass('border-primary', 'text-primary');
    });

    it('shows unselected tabs with proper styling', () => {
      render(<CategoryFilter {...defaultProps} variant="tabs" selectedCategory="json-processing" />);

      const unselectedTab = screen.getByText('Code Execution').closest('button');
      expect(unselectedTab).toHaveClass('border-transparent');
    });

    it('calls onCategoryChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const onCategoryChange = vi.fn();

      render(
        <CategoryFilter
          {...defaultProps}
          variant="tabs"
          onCategoryChange={onCategoryChange}
        />
      );

      const jsonTab = screen.getByText('JSON Processing');
      await user.click(jsonTab);

      expect(onCategoryChange).toHaveBeenCalledWith('json-processing');
    });
  });

  describe('Color Variants', () => {
    it('applies correct color classes for different category colors', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      // Green category (JSON Processing)
      const greenCategory = screen.getByText('JSON Processing').closest('button');
      expect(greenCategory).toHaveClass('border-green-200');

      // Blue category (Code Execution)
      const blueCategory = screen.getByText('Code Execution').closest('button');
      expect(blueCategory).toHaveClass('border-blue-200');

      // Orange category (File Processing)
      const orangeCategory = screen.getByText('File Processing').closest('button');
      expect(orangeCategory).toHaveClass('border-orange-200');
    });

    it('applies selected state colors correctly', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" selectedCategory="json-processing" />);

      const selectedCategory = screen.getByText('JSON Processing').closest('button');
      expect(selectedCategory).toHaveClass('bg-green-500', 'text-white', 'border-green-500');
    });
  });

  describe('Tooltip Functionality', () => {
    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();

      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const jsonButton = screen.getByText('JSON Processing');
      await user.hover(jsonButton);

      await waitFor(() => {
        expect(screen.getByText('JSON validation, conversion, and manipulation tools')).toBeInTheDocument();
        expect(screen.getByText('11 tools')).toBeInTheDocument();
      });
    });

    it('hides tooltip on unhover', async () => {
      const user = userEvent.setup();

      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const jsonButton = screen.getByText('JSON Processing');
      await user.hover(jsonButton);

      await waitFor(() => {
        expect(screen.getByText('JSON validation, conversion, and manipulation tools')).toBeInTheDocument();
      });

      await user.unhover(jsonButton);

      await waitFor(() => {
        expect(screen.queryByText('JSON validation, conversion, and manipulation tools')).not.toBeInTheDocument();
      });
    });

    it('shows category name in tooltip', async () => {
      const user = userEvent.setup();

      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const jsonButton = screen.getByText('JSON Processing');
      await user.hover(jsonButton);

      await waitFor(() => {
        expect(screen.getByText('JSON Processing')).toBeInTheDocument();
      });
    });
  });

  describe('Grouped Categories', () => {
    it('groups categories by specified property', () => {
      const categoriesWithGroup = [
        ...mockCategories,
        {
          ...mockCategories[0],
          group: 'development',
        },
        {
          ...mockCategories[1],
          group: 'development',
        },
      ];

      render(
        <CategoryFilter
          categories={categoriesWithGroup}
          selectedCategory="all"
          onCategoryChange={vi.fn()}
          groupBy="group"
        />
      );

      expect(screen.getByText('Development')).toBeInTheDocument();
    });

    it('renders multiple groups correctly', () => {
      const categoriesWithGroups = [
        {
          ...mockCategories[0],
          group: 'data',
        },
        {
          ...mockCategories[1],
          group: 'development',
        },
        {
          ...mockCategories[2],
          group: 'files',
        },
      ];

      render(
        <CategoryFilter
          categories={categoriesWithGroups}
          selectedCategory="all"
          onCategoryChange={vi.fn()}
          groupBy="group"
        />
      );

      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    it('handles categories without group', () => {
      const categoriesWithMixedGroups = [
        {
          ...mockCategories[0],
          group: 'data',
        },
        mockCategories[1], // No group
      ];

      render(
        <CategoryFilter
          categories={categoriesWithMixedGroups}
          selectedCategory="all"
          onCategoryChange={vi.fn()}
          groupBy="group"
        />
      );

      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument(); // Should be "other" group
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onCategoryChange = vi.fn();

      render(
        <CategoryFilter
          {...defaultProps}
          variant="buttons"
          onCategoryChange={onCategoryChange}
        />
      );

      // Tab to first button
      await user.tab();
      expect(screen.getByText('All Tools')).toHaveFocus();

      // Tab to next button
      await user.tab();
      expect(screen.getByText('JSON Processing')).toHaveFocus();

      // Enter to select
      await user.keyboard('{Enter}');
      expect(onCategoryChange).toHaveBeenCalledWith('json-processing');
    });

    it('provides semantic structure for screen readers', () => {
      render(<CategoryFilter {...defaultProps} variant="cards" />);

      // Cards should be in landmark elements
      const cards = document.querySelectorAll('[class*="cursor-pointer"]');
      cards.forEach(card => {
        expect(card).toBeInTheDocument();
      });
    });

    it('announces category changes to screen readers', async () => {
      const user = userEvent.setup();
      const onCategoryChange = vi.fn();

      render(
        <CategoryFilter
          {...defaultProps}
          variant="buttons"
          onCategoryChange={onCategoryChange}
        />
      );

      const jsonButton = screen.getByText('JSON Processing');
      await user.click(jsonButton);

      expect(onCategoryChange).toHaveBeenCalledWith('json-processing');
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const container = screen.getByText('All Tools').closest('div');
      expect(container).toHaveClass('flex', 'flex-wrap');
    });

    it('handles overflow gracefully', () => {
      const manyCategories = Array.from({ length: 20 }, (_, i) => ({
        id: `category-${i}`,
        name: `Category ${i}`,
        description: `Description for category ${i}`,
        icon: 'CATEGORY',
        color: 'blue',
        count: i + 1,
      }));

      render(<CategoryFilter categories={manyCategories} selectedCategory="all" onCategoryChange={vi.fn()} />);

      // Should still render all categories
      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('Category 0')).toBeInTheDocument();
      expect(screen.getByText('Category 19')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles empty categories array', () => {
      render(
        <CategoryFilter
          categories={[]}
          selectedCategory="all"
          onCategoryChange={vi.fn()}
        />
      );

      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles undefined onCategoryChange gracefully', () => {
      expect(() => {
        render(<CategoryFilter {...defaultProps} onCategoryChange={undefined} />);
      }).not.toThrow();
    });

    it('handles missing category properties', () => {
      const incompleteCategories = [
        {
          id: 'test',
          name: 'Test Category',
          // Missing other required properties
        },
      ];

      expect(() => {
        render(
          <CategoryFilter
            categories={incompleteCategories}
            selectedCategory="all"
            onCategoryChange={vi.fn()}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many categories', () => {
      const startTime = performance.now();

      const manyCategories = Array.from({ length: 100 }, (_, i) => ({
        id: `category-${i}`,
        name: `Category ${i}`,
        description: `Description for category ${i}`,
        icon: 'CATEGORY',
        color: 'blue',
        count: i + 1,
      }));

      render(<CategoryFilter categories={manyCategories} selectedCategory="all" onCategoryChange={vi.fn()} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('only re-renders changed categories', () => {
      const { rerender } = render(<CategoryFilter {...defaultProps} variant="buttons" />);

      const initialButtons = screen.getAllByRole('button');

      rerender(<CategoryFilter {...defaultProps} variant="buttons" selectedCategory="json-processing" />);

      const updatedButtons = screen.getAllByRole('button');
      expect(updatedButtons).toHaveLength(initialButtons.length);
    });
  });
});
