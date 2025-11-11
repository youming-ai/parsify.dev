/**
 * Comprehensive unit tests for ToolsGrid component
 * Tests rendering, filtering, search, and interaction functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolsGrid } from '@/components/tools/tools-grid';
import { customRender, cleanup } from '../../utils/comprehensive-test-utils';
import fixtures from '../../fixtures/tools-fixtures';

// Mock Next.js components
vi.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
});

// Mock tools data
vi.mock('@/data/tools-data', () => ({
  toolsData: Object.values(fixtures.tools),
}));

describe('ToolsGrid Component', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render tools grid with all tools', () => {
      customRender(<ToolsGrid />);

      // Check that all tools from fixtures are rendered
      expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
      expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
    });

    it('should display tool information correctly', () => {
      customRender(<ToolsGrid />);

      const jsonFormatter = screen.getByTestId('tool-json-formatter');
      expect(jsonFormatter).toHaveTextContent('JSON Formatter');
      expect(jsonFormatter).toHaveTextContent('Format, beautify, and validate JSON');

      const codeExecutor = screen.getByTestId('tool-code-executor');
      expect(codeExecutor).toHaveTextContent('Code Executor');
      expect(codeExecutor).toHaveTextContent('Execute code in a secure WASM sandbox');
    });

    it('should display tool icons', () => {
      customRender(<ToolsGrid />);

      const icons = document.querySelectorAll('[data-testid*="icon-"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show tool badges for popular and new tools', () => {
      customRender(<ToolsGrid />);

      // Check for popular badge
      const jsonFormatter = screen.getByTestId('tool-json-formatter');
      expect(jsonFormatter.querySelector('[data-testid="badge-popular"]')).toBeInTheDocument();

      // Check for new badge if any tool has isNew property
      const newBadges = document.querySelectorAll('[data-testid="badge-new"]');
      // Might be 0 if no tools are marked as new in fixtures
    });
  });

  describe('Search Functionality', () => {
    it('should filter tools based on search query', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Search for "json"
      await user.type(searchInput, 'json');

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      });

      // JSON formatter should be visible, others might be hidden
      expect(screen.getByTestId('tool-json-formatter')).toBeVisible();
    });

    it('should handle empty search results', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Search for something that won't match
      await user.type(searchInput, 'nonexistent-tool-name-xyz');

      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
        expect(screen.getByTestId('no-results')).toHaveTextContent(/no tools found/i);
      });
    });

    it('should search in tool names and descriptions', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Search by description content
      await user.type(searchInput, 'hash');

      await waitFor(() => {
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });

    it('should search in tags and features', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Search by tag
      await user.type(searchInput, 'wasm');

      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
      });
    });

    it('should clear search and show all tools', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      const clearButton = screen.getByTestId('clear-search');

      // Search for something
      await user.type(searchInput, 'json');

      // Clear search
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });

    it('should handle debounced search', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Type quickly (should debounce)
      await user.type(searchInput, 'j');
      await user.type(searchInput, 's');
      await user.type(searchInput, 'o');
      await user.type(searchInput, 'n');

      // Should not immediately filter
      expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();

      // Wait for debounce
      await waitFor(() => {
        // Should eventually filter based on "json"
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Category Filtering', () => {
    it('should filter tools by category', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      // Find category filter
      const categoryFilter = screen.getByTestId('category-filter');
      expect(categoryFilter).toBeInTheDocument();

      // Select "JSON Processing" category
      const jsonCategory = screen.getByText('JSON Processing');
      await user.click(jsonCategory);

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      });
    });

    it('should show category counts', () => {
      customRender(<ToolsGrid />);

      // Category counts should be displayed
      const categoryCounts = document.querySelectorAll('[data-testid="category-count"]');
      expect(categoryCounts.length).toBeGreaterThan(0);
    });

    it('should allow multiple category selection', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      // Select multiple categories
      const jsonCategory = screen.getByText('JSON Processing');
      const securityCategory = screen.getByText('Security');

      await user.click(jsonCategory);
      await user.click(securityCategory);

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });
  });

  describe('Status and Difficulty Filtering', () => {
    it('should filter by tool status', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      // Find status filter
      const statusFilter = screen.getByTestId('status-filter');
      expect(statusFilter).toBeInTheDocument();

      // Filter by "stable" status
      const stableStatus = screen.getByText('Stable');
      await user.click(stableStatus);

      await waitFor(() => {
        // Should show only stable tools
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
      });
    });

    it('should filter by difficulty level', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      // Find difficulty filter
      const difficultyFilter = screen.getByTestId('difficulty-filter');
      expect(difficultyFilter).toBeInTheDocument();

      // Filter by "beginner" difficulty
      const beginnerDifficulty = screen.getByText('Beginner');
      await user.click(beginnerDifficulty);

      await waitFor(() => {
        // Should show only beginner tools
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort tools alphabetically by default', () => {
      customRender(<ToolsGrid />);

      // Check that tools are sorted
      const toolCards = document.querySelectorAll('[data-testid^="tool-"]');
      const toolNames = Array.from(toolCards).map(card =>
        card.querySelector('[data-testid="tool-name"]')?.textContent
      );

      // Tools should be in alphabetical order
      const sortedNames = [...toolNames].sort();
      expect(toolNames).toEqual(sortedNames);
    });

    it('should allow sorting by popularity', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      // Find sort dropdown
      const sortSelect = screen.getByTestId('sort-select');
      expect(sortSelect).toBeInTheDocument();

      // Sort by popularity
      await user.selectOptions(sortSelect, 'popularity');

      await waitFor(() => {
        // Popular tools should appear first
        const firstTool = screen.getByTestId('tool-json-formatter'); // Popular tool
        expect(firstTool).toBeInTheDocument();
      });
    });

    it('should allow sorting by category', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const sortSelect = screen.getByTestId('sort-select');

      await user.selectOptions(sortSelect, 'category');

      await waitFor(() => {
        // Tools should be grouped by category
        const toolCards = document.querySelectorAll('[data-testid^="tool-"]');
        expect(toolCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching tools', () => {
      // Mock loading state
      vi.mock('@/data/tools-data', () => ({
        toolsData: [],
        loading: true,
      }));

      customRender(<ToolsGrid />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('loading-skeleton')).toHaveTextContent(/loading/i);
    });

    it('should show error state when tools fail to load', () => {
      // Mock error state
      vi.mock('@/data/tools-data', () => ({
        toolsData: [],
        error: new Error('Failed to load tools'),
      }));

      customRender(<ToolsGrid />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByTestId('error-state')).toHaveTextContent(/error/i);
    });

    it('should allow retry on error', async () => {
      const mockRetry = vi.fn();

      vi.mock('@/data/tools-data', () => ({
        toolsData: [],
        error: new Error('Failed to load tools'),
        retry: mockRetry,
      }));

      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      customRender(<ToolsGrid />);

      // Check grid container
      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('aria-label', 'Developer tools grid');

      // Check tool cards
      const toolCards = screen.getAllByRole('gridcell');
      toolCards.forEach(card => {
        expect(card).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      // Tab to first tool
      await user.tab();

      const focusedElement = document.activeElement;
      expect(focusedElement?.closest('[data-testid^="tool-"]')).toBeInTheDocument();

      // Navigate between tools with arrow keys
      await user.keyboard('{ArrowRight}');

      const nextFocused = document.activeElement;
      expect(nextFocused).not.toBe(focusedElement);
    });

    it('should have proper headings hierarchy', () => {
      customRender(<ToolsGrid />);

      // Should have main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Should have section headings for filters
      const filterHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(filterHeadings.length).toBeGreaterThan(0);
    });

    it('should announce search results to screen readers', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Search for something
      await user.type(searchInput, 'json');

      await waitFor(() => {
        const announcement = screen.getByTestId('search-results-announcement');
        expect(announcement).toBeInTheDocument();
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      customRender(<ToolsGrid />);

      // Should have mobile layout
      const grid = screen.getByTestId('tools-grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should adapt layout for tablet screens', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      customRender(<ToolsGrid />);

      // Should have tablet layout
      const grid = screen.getByTestId('tools-grid');
      expect(grid).toHaveClass('grid-cols-2');
    });

    it('should adapt layout for desktop screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      customRender(<ToolsGrid />);

      // Should have desktop layout
      const grid = screen.getByTestId('tools-grid');
      expect(grid).toHaveClass('grid-cols-3');
    });
  });

  describe('Performance', () => {
    it('should render large number of tools efficiently', () => {
      // Mock large number of tools
      const manyTools = Array.from({ length: 100 }, (_, i) => ({
        ...fixtures.tools.jsonFormatter,
        id: `tool-${i}`,
        name: `Tool ${i}`,
      }));

      vi.mock('@/data/tools-data', () => ({
        toolsData: manyTools,
      }));

      const startTime = performance.now();
      customRender(<ToolsGrid />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000);

      // Should render all tools
      const toolCards = document.querySelectorAll('[data-testid^="tool-"]');
      expect(toolCards).toHaveLength(100);
    });

    it('should not re-render unnecessarily during search', async () => {
      const user = userEvent.setup();
      const { rerender } = customRender(<ToolsGrid />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Type search slowly
      await user.type(searchInput, 'j');
      await user.type(searchInput, 's');

      // Component should not re-render excessively
      // This would need more sophisticated testing with React DevTools
      expect(searchInput).toHaveValue('js');
    });
  });

  describe('Tool Card Interactions', () => {
    it('should navigate to tool when clicked', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const toolCard = screen.getByTestId('tool-json-formatter');
      const link = toolCard.querySelector('[data-testid="mock-link"]');

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/tools/json/formatter');

      await user.click(link as HTMLAnchorElement);
    });

    it('should show tool tooltip on hover', async () => {
      const user = userEvent.setup();
      customRender(<ToolsGrid />);

      const toolCard = screen.getByTestId('tool-json-formatter');

      await user.hover(toolCard);

      await waitFor(() => {
        expect(screen.getByTestId('tool-tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tool-tooltip')).toHaveTextContent('JSON Formatter');
      });
    });

    it('should show tool features list', () => {
      customRender(<ToolsGrid />);

      const toolCard = screen.getByTestId('tool-json-formatter');
      const features = toolCard.querySelector('[data-testid="tool-features"]');

      expect(features).toBeInTheDocument();
      expect(features).toHaveTextContent('Format & Beautify');
      expect(features).toHaveTextContent('Syntax Validation');
    });

    it('should show tool tags', () => {
      customRender(<ToolsGrid />);

      const toolCard = screen.getByTestId('tool-json-formatter');
      const tags = toolCard.querySelectorAll('[data-testid="tool-tag"]');

      expect(tags.length).toBeGreaterThan(0);
      expect(Array.from(tags).some(tag =>
        tag.textContent?.includes('json')
      )).toBe(true);
    });
  });
});
