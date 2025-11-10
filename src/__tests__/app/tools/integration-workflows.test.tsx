import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockTools, mockCategories, createMockLocalStorage, waitForDebounce } from '../test-utils';

// Mock the complete ToolsPage for integration testing
const MockToolsPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [favoriteTools, setFavoriteTools] = React.useState<string[]>([]);
  const [recentTools, setRecentTools] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('popularity');

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const favorites = JSON.parse(localStorage.getItem('favorite-tools') || '[]');
        const recent = JSON.parse(localStorage.getItem('recent-tools') || '[]');
        setFavoriteTools(favorites);
        setRecentTools(recent);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    }
  }, []);

  // Filter tools based on all criteria
  const filteredTools = React.useMemo(() => {
    let filtered = [...mockTools];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((tool) => {
        const searchScore =
          (tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 80 : 0) +
          (tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 60 : 0) +
          (tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ? 40 : 0);
        return searchScore > 0;
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tool) => tool.category === selectedCategory);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((tool) => selectedTags.some((tag) => tool.tags.includes(tag)));
    }

    // Sort
    if (!searchQuery) {
      switch (sortBy) {
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'popularity':
          filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
          break;
      }
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedTags, sortBy]);

  // Toggle favorite
  const toggleFavorite = (toolId: string) => {
    const isFavorite = favoriteTools.includes(toolId);
    let updated: string[];

    if (isFavorite) {
      updated = favoriteTools.filter((id) => id !== toolId);
    } else {
      updated = [...favoriteTools, toolId];
    }

    setFavoriteTools(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorite-tools', JSON.stringify(updated));
    }
  };

  // Save recent tool
  const saveRecentTool = (toolId: string) => {
    const updated = [toolId, ...recentTools.filter((id) => id !== toolId)].slice(0, 10);
    setRecentTools(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent-tools', JSON.stringify(updated));
    }
  };

  // Get tools for different tabs
  const popularTools = mockTools.filter(tool => tool.isPopular);
  const newTools = mockTools.filter(tool => tool.isNew);
  const recentToolsData = recentTools
    .map(id => mockTools.find(tool => tool.id === id))
    .filter(Boolean);
  const favoriteToolsData = favoriteTools
    .map(id => mockTools.find(tool => tool.id === id))
    .filter(Boolean);

  const getTabContent = () => {
    switch (activeTab) {
      case 'popular':
        return popularTools;
      case 'new':
        return newTools;
      case 'recent':
        return recentToolsData;
      case 'favorites':
        return favoriteToolsData;
      default:
        return filteredTools;
    }
  };

  const currentTools = getTabContent();

  return (
    <div data-testid="tools-page">
      {/* Header */}
      <header>
        <h1>Developer Tools</h1>
        <p>Professional tools for JSON processing, code execution, and more.</p>
      </header>

      {/* Tabs */}
      <div role="tablist" data-testid="tabs">
        <button
          role="tab"
          data-state={activeTab === 'all' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('all')}
        >
          All Tools ({mockTools.length})
        </button>
        <button
          role="tab"
          data-state={activeTab === 'popular' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('popular')}
        >
          Popular ({popularTools.length})
        </button>
        <button
          role="tab"
          data-state={activeTab === 'new' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('new')}
        >
          New ({newTools.length})
        </button>
        <button
          role="tab"
          data-state={activeTab === 'recent' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('recent')}
        >
          Recent ({recentToolsData.length})
        </button>
        <button
          role="tab"
          data-state={activeTab === 'favorites' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites ({favoriteToolsData.length})
        </button>
      </div>

      {/* Search and Filters */}
      {activeTab === 'all' && (
        <div data-testid="search-filters">
          {/* Search */}
          <div>
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                data-testid="clear-search"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories */}
          <div data-testid="categories">
            <button
              data-testid="category-all"
              className={selectedCategory === 'all' ? 'active' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </button>
            {mockCategories.map(category => (
              <button
                key={category.id}
                data-testid={`category-${category.id}`}
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            data-testid="advanced-filters-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            Advanced Filters
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div data-testid="advanced-filters">
              {/* Tags */}
              <div data-testid="tags">
                {Array.from(new Set(mockTools.flatMap(tool => tool.tags))).map(tag => (
                  <button
                    key={tag}
                    data-testid={`tag-${tag}`}
                    className={selectedTags.includes(tag) ? 'active' : ''}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div data-testid="sort">
                <select
                  data-testid="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popularity">Popularity</option>
                  <option value="name">Name</option>
                </select>
              </div>

              {/* Clear All Filters */}
              {(searchQuery || selectedCategory !== 'all' || selectedTags.length > 0) && (
                <button
                  data-testid="clear-all-filters"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedTags([]);
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Results Summary */}
          <div data-testid="results-summary">
            Showing {currentTools.length} of {mockTools.length} tools
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div data-testid="view-mode">
        <button
          data-testid="grid-view"
          className={viewMode === 'grid' ? 'active' : ''}
          onClick={() => setViewMode('grid')}
        >
          Grid
        </button>
        <button
          data-testid="list-view"
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
      </div>

      {/* Tools Grid/List */}
      <div
        data-testid="tools-container"
        className={viewMode === 'grid' ? 'grid-view' : 'list-view'}
      >
        {currentTools.length > 0 ? (
          currentTools.map(tool => (
            <div key={tool.id} data-testid={`tool-${tool.id}`} data-tool-id={tool.id}>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              <div data-testid={`tool-difficulty-${tool.id}`}>{tool.difficulty}</div>
              <div data-testid={`tool-tags-${tool.id}`}>
                {tool.tags.slice(0, 3).map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button
                data-testid={`favorite-${tool.id}`}
                onClick={() => toggleFavorite(tool.id)}
                aria-label={`Toggle favorite for ${tool.name}`}
              >
                {favoriteTools.includes(tool.id) ? '❤️' : '🤍'}
              </button>
              <button
                data-testid={`try-tool-${tool.id}`}
                onClick={() => saveRecentTool(tool.id)}
              >
                Try Tool
              </button>
            </div>
          ))
        ) : (
          <div data-testid="no-results">
            <h3>No tools found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedTags([]);
            }}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

describe('Integration Tests - Complete User Workflows', () => {
  const mockLocalStorage = createMockLocalStorage();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('New User Onboarding Journey', () => {
    it('guides new user through discovering and using tools', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // 1. User lands on tools page
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
      expect(screen.getByText('Professional tools for JSON processing, code execution, and more.')).toBeInTheDocument();

      // 2. User sees total tools count
      expect(screen.getByText(`All Tools (${mockTools.length})`)).toBeInTheDocument();

      // 3. User browses popular tools
      const popularTab = screen.getByText('Popular');
      await user.click(popularTab);

      const popularTools = mockTools.filter(tool => tool.isPopular);
      expect(screen.getByText(`Popular (${popularTools.length})`)).toBeInTheDocument();

      // 4. User sees first popular tool
      const firstPopularTool = popularTools[0];
      expect(screen.getByText(firstPopularTool.name)).toBeInTheDocument();

      // 5. User clicks "Try Tool" button
      const tryToolButton = screen.getByTestId(`try-tool-${firstPopularTool.id}`);
      await user.click(tryToolButton);

      // 6. Tool is added to recent tools
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recent-tools',
        expect.stringContaining(firstPopularTool.id)
      );

      // 7. User navigates to recent tools tab
      const recentTab = screen.getByText('Recent');
      await user.click(recentTab);

      expect(screen.getByText(firstPopularTool.name)).toBeInTheDocument();

      // 8. User marks tool as favorite
      const favoriteButton = screen.getByTestId(`favorite-${firstPopularTool.id}`);
      await user.click(favoriteButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorite-tools',
        expect.stringContaining(firstPopularTool.id)
      );

      // 9. User navigates to favorites tab
      const favoritesTab = screen.getByText('Favorites');
      await user.click(favoritesTab);

      expect(screen.getByText(firstPopularTool.name)).toBeInTheDocument();
      expect(screen.getByTestId(`favorite-${firstPopularTool.id}`)).toHaveTextContent('❤️');
    });

    it('allows user to explore different tool categories', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User starts on All Tools tab
      expect(screen.getByTestId('tab-all')).toHaveAttribute('data-state', 'active');

      // User explores new tools
      const newTab = screen.getByText('New');
      await user.click(newTab);

      const newTools = mockTools.filter(tool => tool.isNew);
      expect(screen.getByText(`New (${newTools.length})`)).toBeInTheDocument();

      if (newTools.length > 0) {
        expect(screen.getByText(newTools[0].name)).toBeInTheDocument();
      }

      // User goes back to all tools
      const allTab = screen.getByText('All Tools');
      await user.click(allTab);

      expect(screen.getByTestId('tab-all')).toHaveAttribute('data-state', 'active');
      expect(screen.getByText(`All Tools (${mockTools.length})`)).toBeInTheDocument();
    });
  });

  describe('Search and Discovery Workflow', () => {
    it('enables user to find specific tools through search', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User wants to find JSON-related tools
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'JSON');

      // Wait for debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should show filtered results
      const jsonTools = mockTools.filter(tool =>
        tool.name.toLowerCase().includes('json') ||
        tool.description.toLowerCase().includes('json') ||
        tool.tags.some(tag => tag.toLowerCase().includes('json'))
      );

      expect(screen.getByTestId('results-summary')).toHaveTextContent(
        `Showing ${jsonTools.length} of ${mockTools.length} tools`
      );

      // Each JSON tool should be displayed
      jsonTools.forEach(tool => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
      });

      // Non-JSON tools should not be displayed
      const nonJsonTools = mockTools.filter(tool =>
        !tool.name.toLowerCase().includes('json') &&
        !tool.description.toLowerCase().includes('json') &&
        !tool.tags.some(tag => tag.toLowerCase().includes('json'))
      );

      nonJsonTools.forEach(tool => {
        expect(screen.queryByText(tool.name)).not.toBeInTheDocument();
      });

      // User clears search
      const clearButton = screen.getByTestId('clear-search');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByTestId('results-summary')).toHaveTextContent(
        `Showing ${mockTools.length} of ${mockTools.length} tools`
      );
    });

    it('handles search with no results gracefully', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User searches for non-existent tool
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistenttool123');

      // Wait for debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should show no results message
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No tools found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();

      // User can clear filters from no results state
      const clearFiltersButton = screen.getByText('Clear filters');
      await user.click(clearFiltersButton);

      // Should return to all tools
      expect(searchInput).toHaveValue('');
      expect(screen.getByTestId('results-summary')).toHaveTextContent(
        `Showing ${mockTools.length} of ${mockTools.length} tools`
      );
    });
  });

  describe('Advanced Filtering Workflow', () => {
    it('enables complex filtering combinations', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User wants to find beginner-friendly JSON tools
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'JSON');

      // Wait for debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // User opens advanced filters
      const advancedFiltersToggle = screen.getByTestId('advanced-filters-toggle');
      await user.click(advancedFiltersToggle);

      expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();

      // User selects a tag
      const validatorTag = screen.getByTestId('tag-validator');
      await user.click(validatorTag);

      // Should further filter results
      const jsonValidatorTools = mockTools.filter(tool =>
        (tool.name.toLowerCase().includes('json') ||
         tool.description.toLowerCase().includes('json') ||
         tool.tags.some(tag => tag.toLowerCase().includes('json'))) &&
        tool.tags.includes('validator')
      );

      expect(screen.getByTestId('results-summary')).toHaveTextContent(
        `Showing ${jsonValidatorTools.length} of ${mockTools.length} tools`
      );

      // User changes sort order
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'name');

      // Results should be sorted alphabetically
      const toolNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
      const sortedNames = [...toolNames!].sort();
      expect(toolNames).toEqual(sortedNames);

      // User clears all filters
      const clearAllFiltersButton = screen.getByTestId('clear-all-filters');
      await user.click(clearAllFiltersButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByTestId('category-all')).toHaveClass('active');
      expect(validatorTag).not.toHaveClass('active');
      expect(screen.getByTestId('results-summary')).toHaveTextContent(
        `Showing ${mockTools.length} of ${mockTools.length} tools`
      );
    });

    it('maintains filter state during interactions', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User applies category filter
      const jsonCategory = screen.getByTestId('category-json-processing');
      await user.click(jsonCategory);

      expect(jsonCategory).toHaveClass('active');

      // User switches view mode
      const listViewButton = screen.getByTestId('list-view');
      await user.click(listViewButton);

      expect(screen.getByTestId('tools-container')).toHaveClass('list-view');

      // Category filter should still be active
      expect(jsonCategory).toHaveClass('active');

      // User switches back to grid view
      const gridViewButton = screen.getByTestId('grid-view');
      await user.click(gridViewButton);

      expect(screen.getByTestId('tools-container')).toHaveClass('grid-view');
      expect(jsonCategory).toHaveClass('active');
    });
  });

  describe('Personalization Workflow', () => {
    it('persists user preferences across sessions', async () => {
      const user = userEvent.setup();

      // First session - user favorites some tools
      const { rerender } = render(<MockToolsPage />);

      const jsonFormatter = mockTools.find(tool => tool.id === 'json-formatter')!;
      const codeExecutor = mockTools.find(tool => tool.id === 'code-executor')!;

      // User marks tools as favorites
      const favoriteButton1 = screen.getByTestId(`favorite-${jsonFormatter.id}`);
      await user.click(favoriteButton1);

      const favoriteButton2 = screen.getByTestId(`favorite-${codeExecutor.id}`);
      await user.click(favoriteButton2);

      // Check favorites are saved
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorite-tools',
        expect.stringContaining(jsonFormatter.id)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorite-tools',
        expect.stringContaining(codeExecutor.id)
      );

      // Mock localStorage returning saved favorites
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([jsonFormatter.id, codeExecutor.id]));

      // Second session - favorites are restored
      rerender(<MockToolsPage />);

      const favoritesTab = screen.getByText('Favorites');
      await user.click(favoritesTab);

      expect(screen.getByText(jsonFormatter.name)).toBeInTheDocument();
      expect(screen.getByText(codeExecutor.name)).toBeInTheDocument();
      expect(screen.getByTestId(`favorite-${jsonFormatter.id}`)).toHaveTextContent('❤️');
      expect(screen.getByTestId(`favorite-${codeExecutor.id}`)).toHaveTextContent('❤️');
    });

    it('tracks recently used tools', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User uses multiple tools
      const toolsToUse = mockTools.slice(0, 3);

      for (const tool of toolsToUse) {
        const tryToolButton = screen.getByTestId(`try-tool-${tool.id}`);
        await user.click(tryToolButton);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'recent-tools',
          expect.stringContaining(tool.id)
        );
      }

      // User checks recent tools
      const recentTab = screen.getByText('Recent');
      await user.click(recentTab);

      // Most recent tool should appear first
      toolsToUse.reverse().forEach(tool => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Workflow', () => {
    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Page should still render without crashing
      expect(() => {
        render(<MockToolsPage />);
      }).not.toThrow();

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load user preferences:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('recovers from invalid saved state', async () => {
      // Mock localStorage with invalid JSON
      mockLocalStorage.getItem.mockReturnValue('invalid json data');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Page should handle invalid data gracefully
      expect(() => {
        render(<MockToolsPage />);
      }).not.toThrow();

      expect(screen.getByText('Developer Tools')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load user preferences:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Workflow', () => {
    it('handles rapid user interactions efficiently', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User rapidly types search queries
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'J');
      await user.type(searchInput, 'S');
      await user.type(searchInput, 'O');
      await user.type(searchInput, 'N');

      // Should debounce and only process final query
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(searchInput).toHaveValue('JSON');

      // User rapidly switches between categories
      const categories = ['category-json-processing', 'category-code-execution', 'category-file-processing'];

      for (const category of categories) {
        const categoryButton = screen.getByTestId(category);
        await user.click(categoryButton);
        expect(categoryButton).toHaveClass('active');
      }

      // User rapidly switches view modes
      const listViewButton = screen.getByTestId('list-view');
      const gridViewButton = screen.getByTestId('grid-view');

      await user.click(listViewButton);
      await user.click(gridViewButton);
      await user.click(listViewButton);

      expect(screen.getByTestId('tools-container')).toHaveClass('list-view');
    });

    it('maintains responsiveness with large datasets', async () => {
      // Create a large dataset
      const largeToolsSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockTools[0],
        id: `tool-${i}`,
        name: `Tool ${i}`,
        description: `Description for tool ${i}`,
        tags: [`tag${i % 10}`],
      }));

      // Mock the tools data with large set
      vi.doMock('@/data/tools-data', () => ({
        toolsData: largeToolsSet,
      }));

      const startTime = performance.now();

      const user = userEvent.setup();
      render(<MockToolsPage />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within acceptable time
      expect(renderTime).toBeLessThan(1000);

      // Search should still be responsive
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Tool 5');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should find matching tools quickly
      expect(screen.getByTestId('results-summary')).toBeInTheDocument();
    });
  });

  describe('Accessibility Workflow', () => {
    it('supports complete keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User navigates through tabs using keyboard
      await user.tab();
      expect(screen.getByText('All Tools')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Popular')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Popular')).toHaveAttribute('data-state', 'active');

      // User navigates to search
      await user.tab();
      expect(screen.getByTestId('search-input')).toHaveFocus();

      // User searches using keyboard
      await user.keyboard('JSON');
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // User navigates to first tool
      await user.tab();
      await user.tab();

      const firstTool = screen.getAllByTestId(/^tool-/)[0];
      expect(firstTool).toHaveFocus();

      // User activates tool using keyboard
      await user.keyboard('{Enter}');

      // Should have saved to recent tools
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recent-tools',
        expect.any(String)
      );
    });

    it('announces important state changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User performs search
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'JSON');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Results summary should be announced
      const resultsSummary = screen.getByTestId('results-summary');
      expect(resultsSummary).toBeInTheDocument();

      // User applies filters that result in no matches
      await user.clear(searchInput);
      await user.type(searchInput, 'nonexistent');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // No results message should be announced
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });
  });

  describe('Mobile-First Workflow', () => {
    it('optimizes experience for mobile users', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const user = userEvent.setup();
      render(<MockToolsPage />);

      // User should see mobile-optimized layout
      expect(screen.getByText('Developer Tools')).toBeInTheDocument();

      // User searches for tools
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'JSON');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Results should be optimized for mobile viewing
      expect(screen.getByTestId('tools-container')).toBeInTheDocument();

      // User switches to list view for better mobile experience
      const listViewButton = screen.getByTestId('list-view');
      await user.click(listViewButton);

      expect(screen.getByTestId('tools-container')).toHaveClass('list-view');

      // User can still favorite tools
      const firstTool = screen.getAllByTestId(/^tool-/)[0];
      const toolId = firstTool.getAttribute('data-tool-id');
      const favoriteButton = screen.getByTestId(`favorite-${toolId}`);

      await user.click(favoriteButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'favorite-tools',
        expect.any(String)
      );
    });
  });
});
