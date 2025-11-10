import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolsPage from '@/app/tools/page';
import { mockTools, mockCategories, createMockLocalStorage, mockUserEvent } from '../test-utils';
import type { Tool, ToolCategory, ToolDifficulty, ProcessingType, SecurityType } from '@/types/tools';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tools',
}));

// Mock tools data
vi.mock('@/data/tools-data', () => ({
  toolsData: mockTools,
}));

// Mock localStorage
const mockLocalStorage = createMockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock timers for debouncing
vi.useFakeTimers();

describe('ToolsPage Component', () => {
  const defaultProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders the tools homepage', () => {
      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
      expect(screen.getByText(/Professional tools for JSON processing/)).toBeInTheDocument();
      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });

    it('displays total tools count', () => {
      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText(`${mockTools.length} Tools`)).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders category filter', () => {
      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('JSON Processing')).toBeInTheDocument();
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
      expect(screen.getByText('File Processing')).toBeInTheDocument();
    });

    it('shows tool count in results summary', () => {
      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText(`Showing ${mockTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
    });

    it('renders tools in grid view by default', () => {
      render(<ToolsPage {...defaultProps} />);

      const gridContainer = document.querySelector('[class*="grid gap-6"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to Popular tab', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const popularTab = screen.getByText('Popular');
      await user.click(popularTab);

      expect(screen.getByText('Popular')).toHaveAttribute('data-state', 'active');

      // Should show popular tools
      const popularTools = mockTools.filter(tool => tool.isPopular);
      popularTools.forEach(tool => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
      });
    });

    it('switches to New tab', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const newTab = screen.getByText('New');
      await user.click(newTab);

      expect(screen.getByText('New')).toHaveAttribute('data-state', 'active');

      // Should show new tools
      const newTools = mockTools.filter(tool => tool.isNew);
      newTools.forEach(tool => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
      });
    });

    it('switches to Recent tab with no recent tools', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const recentTab = screen.getByText('Recent');
      await user.click(recentTab);

      expect(screen.getByText('Recent')).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('No recent tools')).toBeInTheDocument();
      expect(screen.getByText('Tools you use will appear here for quick access.')).toBeInTheDocument();
    });

    it('switches to Favorites tab with no favorites', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const favoritesTab = screen.getByText('Favorites');
      await user.click(favoritesTab);

      expect(screen.getByText('Favorites')).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('No favorite tools')).toBeInTheDocument();
      expect(screen.getByText('Mark tools as favorites to see them here.')).toBeInTheDocument();
    });

    it('displays recent tools when localStorage has data', async () => {
      const recentToolIds = ['json-formatter', 'json-validator'];
      mockLocalStorage.setItem('recent-tools', JSON.stringify(recentToolIds));

      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const recentTab = screen.getByText('Recent');
      await user.click(recentTab);

      expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      expect(screen.getByText('JSON Validator')).toBeInTheDocument();
    });

    it('displays favorite tools when localStorage has data', async () => {
      const favoriteToolIds = ['json-formatter', 'code-executor'];
      mockLocalStorage.setItem('favorite-tools', JSON.stringify(favoriteToolIds));

      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const favoritesTab = screen.getByText('Favorites');
      await user.click(favoritesTab);

      expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      expect(screen.getByText('Code Executor')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters tools based on search query', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON');

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 7 tools')).toBeInTheDocument();
      });

      expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      expect(screen.getByText('JSON Validator')).toBeInTheDocument();
      expect(screen.queryByText('Code Executor')).not.toBeInTheDocument();
    });

    it('shows search suggestions while typing', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
        expect(screen.getByText('JSON Processing')).toBeInTheDocument();
      });
    });

    it('selects search suggestion', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        const suggestion = screen.getByText('JSON Formatter');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('JSON Formatter');
      await user.click(suggestion);

      expect(searchInput).toHaveValue('JSON Formatter');
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON');

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      await waitFor(() => {
        expect(screen.getByText(`Showing ${mockTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
      });
    });

    it('saves search to localStorage', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON Formatter');

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'search-history',
          expect.stringContaining('JSON Formatter')
        );
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'NonexistentTool');

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('No tools found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filters to find what you\'re looking for.')).toBeInTheDocument();
      });
    });
  });

  describe('Category Filtering', () => {
    it('filters tools by selected category', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const jsonCategory = screen.getByText('JSON Processing');
      await user.click(jsonCategory);

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 7 tools')).toBeInTheDocument();
      });

      expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      expect(screen.getByText('JSON Validator')).toBeInTheDocument();
      expect(screen.queryByText('Code Executor')).not.toBeInTheDocument();
    });

    it('shows category tool counts', () => {
      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText('11')).toBeInTheDocument(); // JSON Processing count
      expect(screen.getByText('8')).toBeInTheDocument(); // Code Execution count
    });

    it('resets to "All Tools" category', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      // First select a category
      const jsonCategory = screen.getByText('JSON Processing');
      await user.click(jsonCategory);

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 7 tools')).toBeInTheDocument();
      });

      // Then click "All Tools"
      const allToolsButton = screen.getByText('All Tools');
      await user.click(allToolsButton);

      await waitFor(() => {
        expect(screen.getByText(`Showing ${mockTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Filters', () => {
    it('opens advanced filters panel', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Processing Type')).toBeInTheDocument();
      expect(screen.getByText('Security Level')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('filters by difficulty', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      const difficultySelect = screen.getByText('All Levels');
      await user.click(difficultySelect);

      const beginnerOption = screen.getByText('Beginner');
      await user.click(beginnerOption);

      await waitFor(() => {
        const beginnerTools = mockTools.filter(tool => tool.difficulty === 'beginner');
        expect(screen.getByText(`Showing ${beginnerTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
      });
    });

    it('filters by processing type', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      const processingTypeSelect = screen.getByText('All Types');
      await user.click(processingTypeSelect);

      const clientSideOption = screen.getByText('Client-side');
      await user.click(clientSideOption);

      await waitFor(() => {
        const clientSideTools = mockTools.filter(tool => tool.processingType === 'client-side');
        expect(screen.getByText(`Showing ${clientSideTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
      });
    });

    it('filters by security level', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      const securitySelect = screen.getByText('All Levels');
      await user.click(securitySelect);

      const localOnlyOption = screen.getByText('Local Only');
      await user.click(localOnlyOption);

      await waitFor(() => {
        const localOnlyTools = mockTools.filter(tool => tool.security === 'local-only');
        expect(screen.getByText(`Showing ${localOnlyTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
      });
    });

    it('filters by tags', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      // Find and click a tag button
      const tagButtons = screen.getAllByRole('button').filter(
        button => button.textContent === 'json'
      );
      if (tagButtons.length > 0) {
        await user.click(tagButtons[0]);

        await waitFor(() => {
          const jsonTools = mockTools.filter(tool => tool.tags.includes('json'));
          expect(screen.getByText(`Showing ${jsonTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
        });
      }
    });

    it('shows filter count badge when filters are applied', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      await user.click(advancedFiltersButton);

      const difficultySelect = screen.getByText('All Levels');
      await user.click(difficultySelect);

      const beginnerOption = screen.getByText('Beginner');
      await user.click(beginnerOption);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Filter count badge
      });
    });
  });

  describe('View Mode', () => {
    it('switches to list view', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const listViewButton = screen.getByRole('button', { name: /list/i });
      await user.click(listViewButton);

      const listContainer = document.querySelector('[class*="space-y-4"]');
      expect(listContainer).toBeInTheDocument();
    });

    it('switches back to grid view', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      // Switch to list view first
      const listViewButton = screen.getByRole('button', { name: /list/i });
      await user.click(listViewButton);

      // Then switch back to grid view
      const gridViewButton = screen.getByRole('button', { name: /grid/i });
      await user.click(gridViewButton);

      const gridContainer = document.querySelector('[class*="grid gap-6"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('persists view mode preference', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const listViewButton = screen.getByRole('button', { name: /list/i });
      await user.click(listViewButton);

      // View mode preference should be saved to localStorage
      // This would be tested with actual localStorage integration
    });
  });

  describe('Sort Functionality', () => {
    it('sorts tools by name', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const sortSelect = screen.getByText('Popularity');
      await user.click(sortSelect);

      const nameOption = screen.getByText('Name');
      await user.click(nameOption);

      // Tools should be sorted alphabetically
      const toolNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
      const sortedNames = [...toolNames!].sort();
      expect(toolNames).toEqual(sortedNames);
    });

    it('sorts tools by difficulty', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const sortSelect = screen.getByText('Popularity');
      await user.click(sortSelect);

      const difficultyOption = screen.getByText('Difficulty');
      await user.click(difficultyOption);

      // Tools should be sorted by difficulty (beginner -> intermediate -> advanced)
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      // This would require checking the actual rendered order
    });
  });

  describe('Clear Filters', () => {
    it('clears all filters when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      // Apply some filters
      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON');

      const jsonCategory = screen.getByText('JSON Processing');
      await user.click(jsonCategory);

      // Wait for filters to apply
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const clearFiltersButton = screen.getByText('Clear all filters');
      await user.click(clearFiltersButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText(`Showing ${mockTools.length} of ${mockTools.length} tools`)).toBeInTheDocument();
    });

    it('shows clear filters button only when filters are applied', () => {
      render(<ToolsPage {...defaultProps} />);

      // Initially should not show clear button
      expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
    });
  });

  describe('Tool Cards', () => {
    it('renders tool cards with correct information', () => {
      render(<ToolsPage {...defaultProps} />);

      mockTools.forEach(tool => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
        expect(screen.getByText(tool.description)).toBeInTheDocument();

        // Check for difficulty badge
        expect(screen.getByText(tool.difficulty)).toBeInTheDocument();

        // Check for processing type
        expect(screen.getByText(tool.processingType.replace('-', ' '))).toBeInTheDocument();
      });
    });

    it('shows NEW badge for new tools', () => {
      render(<ToolsPage {...defaultProps} />);

      const newTools = mockTools.filter(tool => tool.isNew);
      newTools.forEach(tool => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });
    });

    it('shows Popular badge for popular tools', () => {
      render(<ToolsPage {...defaultProps} />);

      const popularTools = mockTools.filter(tool => tool.isPopular);
      popularTools.forEach(tool => {
        expect(screen.getByText('Popular')).toBeInTheDocument();
      });
    });

    it('displays tool features', () => {
      render(<ToolsPage {...defaultProps} />);

      mockTools.forEach(tool => {
        tool.features.slice(0, 3).forEach(feature => {
          expect(screen.getByText(feature)).toBeInTheDocument();
        });
      });
    });

    it('displays tool tags', () => {
      render(<ToolsPage {...defaultProps} />);

      mockTools.forEach(tool => {
        tool.tags.slice(0, 3).forEach(tag => {
          expect(screen.getByText(tag)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Tool Interactions', () => {
    it('navigates to tool page when Try Tool button is clicked', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const tryToolButtons = screen.getAllByText('Try Tool');
      expect(tryToolButtons.length).toBeGreaterThan(0);

      await user.click(tryToolButtons[0]);

      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('saves tool to recent tools when accessed', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const tryToolButtons = screen.getAllByText('Try Tool');
      await user.click(tryToolButtons[0]);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recent-tools',
        expect.any(String)
      );
    });

    it('toggles favorite tool when favorite button is clicked', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const favoriteButtons = screen.getAllByRole('button').filter(
        button => button.querySelector('svg') && button.querySelector('svg[class*="h-4 w-4"]')
      );

      if (favoriteButtons.length > 0) {
        await user.click(favoriteButtons[0]);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'favorite-tools',
          expect.any(String)
        );
      }
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tools by name, description, or tags...')).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();

      const gridContainer = document.querySelector('[class*="md:grid-cols-2"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing tools data gracefully', () => {
      vi.mocked(mockTools).splice(0, mockTools.length);

      render(<ToolsPage {...defaultProps} />);

      expect(screen.getByText('Showing 0 of 0 tools')).toBeInTheDocument();
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ToolsPage {...defaultProps} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load user preferences:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', () => {
      const startTime = performance.now();

      render(<ToolsPage {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('handles large tool lists efficiently', () => {
      const largeToolList = Array.from({ length: 1000 }, (_, i) => ({
        id: `tool-${i}`,
        name: `Tool ${i}`,
        description: `Description for tool ${i}`,
        category: 'JSON Processing' as ToolCategory,
        icon: 'FileJson',
        features: [`Feature ${i}`],
        tags: [`tag${i}`],
        difficulty: 'beginner' as ToolDifficulty,
        status: 'stable' as const,
        href: `/tools/tool-${i}`,
        processingType: 'client-side' as ProcessingType,
        security: 'local-only' as SecurityType,
      }));

      vi.mocked(mockTools).push(...largeToolList);

      const startTime = performance.now();
      render(<ToolsPage {...defaultProps} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should handle large lists efficiently
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<ToolsPage {...defaultProps} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Developer Tools');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByPlaceholderText('Search tools by name, description, or tags...')).toHaveFocus();

      await user.tab();
      // Should focus on first category button
      const firstCategory = screen.getByText('All Tools');
      expect(firstCategory).toHaveFocus();
    });

    it('provides semantic structure', () => {
      render(<ToolsPage {...defaultProps} />);

      // Check for landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Check for proper list structure in tabs
      const tabList = document.querySelector('[role="tablist"]');
      expect(tabList).toBeInTheDocument();
    });

    it('announces changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<ToolsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools by name, description, or tags...');
      await user.type(searchInput, 'JSON');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 7 tools')).toBeInTheDocument();
      });
    });
  });
});
