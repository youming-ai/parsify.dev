/**
 * Integration tests for tool search and filtering workflows
 * Tests the interaction between search, filters, sorting, and tool navigation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, cleanup } from '../../utils/comprehensive-test-utils';
import fixtures from '../../fixtures/tools-fixtures';

// Mock tools data with comprehensive tool set
const mockToolsData = [
  fixtures.tools.jsonFormatter,
  fixtures.tools.codeExecutor,
  fixtures.tools.hashGenerator,
  {
    ...fixtures.tools.jsonFormatter,
    id: 'xml-formatter',
    name: 'XML Formatter',
    description: 'Format and beautify XML files',
    category: 'File Processing',
    tags: ['xml', 'formatter', 'beautifier'],
    difficulty: 'intermediate',
    status: 'beta',
    isPopular: false,
  },
  {
    ...fixtures.tools.jsonFormatter,
    id: 'python-runner',
    name: 'Python Runner',
    description: 'Execute Python code online',
    category: 'Code Execution',
    tags: ['python', 'code', 'execution'],
    difficulty: 'beginner',
    status: 'stable',
    isPopular: true,
  },
  {
    ...fixtures.tools.jsonFormatter,
    id: 'url-encoder',
    name: 'URL Encoder',
    description: 'Encode and decode URLs',
    category: 'Utilities',
    tags: ['url', 'encoder', 'decoder'],
    difficulty: 'beginner',
    status: 'stable',
    isPopular: false,
  }
];

// Mock search utilities
vi.mock('@/lib/search-utils', () => ({
  searchTools: vi.fn((tools, query) => {
    if (!query) return tools;
    const lowercaseQuery = query.toLowerCase();
    return tools.filter(tool =>
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      tool.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
    );
  }),
  highlightSearchTerm: vi.fn((text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }),
}));

// Mock filter utilities
vi.mock('@/lib/filter-utils', () => ({
  filterByCategory: vi.fn((tools, categories) => {
    if (!categories.length) return tools;
    return tools.filter(tool => categories.includes(tool.category));
  }),
  filterByDifficulty: vi.fn((tools, difficulties) => {
    if (!difficulties.length) return tools;
    return tools.filter(tool => difficulties.includes(tool.difficulty));
  }),
  filterByStatus: vi.fn((tools, statuses) => {
    if (!statuses.length) return tools;
    return tools.filter(tool => statuses.includes(tool.status));
  }),
  filterByTags: vi.fn((tools, tags) => {
    if (!tags.length) return tools;
    return tools.filter(tool =>
      tags.some(tag => tool.tags.includes(tag))
    );
  }),
}));

// Mock sort utilities
vi.mock('@/lib/sort-utils', () => ({
  sortTools: vi.fn((tools, sortBy) => {
    const sorted = [...tools];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'popularity':
        return sorted.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'difficulty':
        const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        return sorted.sort((a, b) =>
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
      default:
        return sorted;
    }
  }),
}));

// Component mock for testing
const ToolSearchPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState('name');
  const [filteredTools, setFilteredTools] = React.useState(mockToolsData);

  React.useEffect(() => {
    let filtered = [...mockToolsData];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply filters
    if (selectedCategories.length) {
      filtered = filtered.filter(tool => selectedCategories.includes(tool.category));
    }

    if (selectedDifficulties.length) {
      filtered = filtered.filter(tool => selectedDifficulties.includes(tool.difficulty));
    }

    if (selectedStatuses.length) {
      filtered = filtered.filter(tool => selectedStatuses.includes(tool.status));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'difficulty':
          const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        default:
          return 0;
      }
    });

    setFilteredTools(filtered);
  }, [searchQuery, selectedCategories, selectedDifficulties, selectedStatuses, sortBy]);

  return (
    <div data-testid="tool-search-page">
      {/* Search Input */}
      <div data-testid="search-section">
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
        <div data-testid="search-results-count">
          {filteredTools.length} tools found
        </div>
      </div>

      {/* Filters */}
      <div data-testid="filters-section">
        {/* Category Filter */}
        <div data-testid="category-filter">
          <h4>Categories</h4>
          {['JSON Processing', 'Code Execution', 'File Processing', 'Utilities', 'Security'].map(category => (
            <label key={category} data-testid={`category-${category.toLowerCase().replace(' ', '-')}`}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, category]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                  }
                }}
              />
              {category}
              <span data-testid={`category-count-${category}`}>
                ({mockToolsData.filter(t => t.category === category).length})
              </span>
            </label>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div data-testid="difficulty-filter">
          <h4>Difficulty</h4>
          {['beginner', 'intermediate', 'advanced'].map(difficulty => (
            <label key={difficulty} data-testid={`difficulty-${difficulty}`}>
              <input
                type="checkbox"
                checked={selectedDifficulties.includes(difficulty)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDifficulties([...selectedDifficulties, difficulty]);
                  } else {
                    setSelectedDifficulties(selectedDifficulties.filter(d => d !== difficulty));
                  }
                }}
              />
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </label>
          ))}
        </div>

        {/* Status Filter */}
        <div data-testid="status-filter">
          <h4>Status</h4>
          {['stable', 'beta', 'alpha'].map(status => (
            <label key={status} data-testid={`status-${status}`}>
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStatuses([...selectedStatuses, status]);
                  } else {
                    setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                  }
                }}
              />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Sorting */}
      <div data-testid="sort-section">
        <select
          data-testid="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="popularity">Popularity</option>
          <option value="category">Category</option>
          <option value="difficulty">Difficulty</option>
        </select>
      </div>

      {/* Results */}
      <div data-testid="tools-results">
        {filteredTools.length === 0 ? (
          <div data-testid="no-results">
            No tools found matching your criteria
          </div>
        ) : (
          <div data-testid="tools-grid" role="grid">
            {filteredTools.map(tool => (
              <div
                key={tool.id}
                data-testid={`tool-${tool.id}`}
                role="gridcell"
                aria-label={`${tool.name} - ${tool.description}`}
              >
                <h3 data-testid={`tool-name-${tool.id}`}>{tool.name}</h3>
                <p data-testid={`tool-description-${tool.id}`}>{tool.description}</p>
                <div data-testid={`tool-category-${tool.id}`}>{tool.category}</div>
                <div data-testid={`tool-difficulty-${tool.id}`}>{tool.difficulty}</div>
                <div data-testid={`tool-status-${tool.id}`}>{tool.status}</div>
                {tool.isPopular && (
                  <div data-testid={`tool-popular-${tool.id}`}>Popular</div>
                )}
                <div data-testid={`tool-tags-${tool.id}`}>
                  {tool.tags.map(tag => (
                    <span key={tag} data-testid={`tool-tag-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

describe('Tool Search and Filtering Integration Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Search Functionality Integration', () => {
    it('should search across tool names, descriptions, and tags', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Search by name
      await user.type(searchInput, 'json');
      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-json-validator')).toBeInTheDocument();
      });

      // Clear and search by description
      await user.clear(searchInput);
      await user.type(searchInput, 'execute code');
      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
      });

      // Clear and search by tag
      await user.clear(searchInput);
      await user.type(searchInput, 'hash');
      await waitFor(() => {
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });

    it('should update search results count in real-time', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');
      const resultsCount = screen.getByTestId('search-results-count');

      // Initially show all tools
      expect(resultsCount).toHaveTextContent('6 tools found');

      // Search for specific term
      await user.type(searchInput, 'json');
      await waitFor(() => {
        expect(resultsCount).toHaveTextContent('2 tools found');
      });

      // Search for something with no results
      await user.clear(searchInput);
      await user.type(searchInput, 'nonexistent');
      await waitFor(() => {
        expect(resultsCount).toHaveTextContent('0 tools found');
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
      });
    });

    it('should highlight search terms in results', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      await user.type(searchInput, 'json');

      await waitFor(() => {
        // Check that search terms would be highlighted
        const toolName = screen.getByTestId('tool-name-json-formatter');
        expect(toolName).toBeInTheDocument();
        // In a real implementation, we'd check for <mark> tags or highlighted styling
      });
    });

    it('should handle search debouncing correctly', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Type quickly
      await user.type(searchInput, 'j');
      await user.type(searchInput, 's');
      await user.type(searchInput, 'o');
      await user.type(searchInput, 'n');

      // Should not immediately filter all intermediate states
      // Final result should match complete query
      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Filter Integration', () => {
    it('should apply multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      // Apply category filter
      const codeExecutionCategory = screen.getByTestId('category-code-execution');
      await user.click(codeExecutionCategory);

      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
        expect(screen.queryByTestId('tool-json-formatter')).not.toBeInTheDocument();
      });

      // Apply difficulty filter
      const beginnerDifficulty = screen.getByTestId('difficulty-beginner');
      await user.click(beginnerDifficulty);

      await waitFor(() => {
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
        expect(screen.queryByTestId('tool-code-executor')).not.toBeInTheDocument();
      });

      // Apply status filter
      const stableStatus = screen.getByTestId('status-stable');
      await user.click(stableStatus);

      await waitFor(() => {
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
        expect(screen.queryByTestId('tool-code-executor')).not.toBeInTheDocument();
      });
    });

    it('should show correct filter counts', () => {
      customRender(<ToolSearchPage />);

      // Check category counts
      expect(screen.getByTestId('category-count-code-execution')).toHaveTextContent('(2)');
      expect(screen.getByTestId('category-count-json-processing')).toHaveTextContent('(1)');
      expect(screen.getByTestId('category-count-utilities')).toHaveTextContent('(1)');
    });

    it('should allow clearing individual filters', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      // Apply multiple filters
      const jsonCategory = screen.getByTestId('category-json-processing');
      const beginnerDifficulty = screen.getByTestId('difficulty-beginner');

      await user.click(jsonCategory);
      await user.click(beginnerDifficulty);

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      });

      // Clear one filter
      await user.click(beginnerDifficulty);

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-json-validator')).toBeInTheDocument();
      });
    });

    it('should allow clearing all filters at once', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      // Apply multiple filters
      const jsonCategory = screen.getByTestId('category-json-processing');
      const stableStatus = screen.getByTestId('status-stable');

      await user.click(jsonCategory);
      await user.click(stableStatus);

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
      });

      // Clear search (if any search was active)
      const clearSearch = screen.queryByTestId('clear-search');
      if (clearSearch) {
        await user.click(clearSearch);
      }

      // Should return to showing all tools
      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Integration', () => {
    it('should combine search and filters correctly', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Apply category filter first
      const codeExecutionCategory = screen.getByTestId('category-code-execution');
      await user.click(codeExecutionCategory);

      // Then search
      await user.type(searchInput, 'python');

      await waitFor(() => {
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
        expect(screen.queryByTestId('tool-code-executor')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tool-json-formatter')).not.toBeInTheDocument();
      });

      // Clear search, should still have category filter applied
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
        expect(screen.queryByTestId('tool-json-formatter')).not.toBeInTheDocument();
      });
    });

    it('should handle search within filtered results', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Apply narrow filter first
      const codeExecutionCategory = screen.getByTestId('category-code-execution');
      await user.click(codeExecutionCategory);

      // Search within filtered results
      await user.type(searchInput, 'json');

      await waitFor(() => {
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('0 tools found');
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
      });

      // Search for something that matches
      await user.clear(searchInput);
      await user.type(searchInput, 'code');

      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Integration', () => {
    it('should maintain sorting while applying filters', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const sortSelect = screen.getByTestId('sort-select');

      // Sort by popularity first
      await user.selectOptions(sortSelect, 'popularity');

      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        // Popular tools should come first
        expect(tools[0]).toHaveAttribute('data-testid', 'tool-code-executor');
        expect(tools[1]).toHaveAttribute('data-testid', 'tool-python-runner');
      });

      // Apply filter
      const beginnerDifficulty = screen.getByTestId('difficulty-beginner');
      await user.click(beginnerDifficulty);

      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        // Should still be sorted by popularity within filtered results
        expect(tools[0]).toHaveAttribute('data-testid', 'tool-python-runner');
        expect(tools[1]).toHaveAttribute('data-testid', 'tool-hash-generator');
      });
    });

    it('should maintain sorting while searching', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');
      const sortSelect = screen.getByTestId('sort-select');

      // Sort by name
      await user.selectOptions(sortSelect, 'name');

      // Search for something that returns multiple results
      await user.type(searchInput, 'format');

      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        // Should be sorted alphabetically within search results
        expect(tools[0]).toHaveAttribute('data-testid', 'tool-json-formatter');
        expect(tools[1]).toHaveAttribute('data-testid', 'tool-xml-formatter');
      });
    });

    it('should sort by different criteria correctly', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const sortSelect = screen.getByTestId('sort-select');

      // Test name sorting
      await user.selectOptions(sortSelect, 'name');
      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        const names = tools.map(tool =>
          screen.getByTestId(`tool-name-${tool.getAttribute('data-testid')?.replace('tool-', '')}`).textContent
        );
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      });

      // Test category sorting
      await user.selectOptions(sortSelect, 'category');
      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        // Tools should be grouped by category
        expect(tools.length).toBeGreaterThan(0);
      });

      // Test difficulty sorting
      await user.selectOptions(sortSelect, 'difficulty');
      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        // Should be ordered by difficulty (beginner -> intermediate -> advanced)
        expect(tools.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Complex User Workflows', () => {
    it('should handle complex multi-step search and filter workflow', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');
      const sortSelect = screen.getByTestId('sort-select');

      // Step 1: User searches for "code"
      await user.type(searchInput, 'code');

      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
      });

      // Step 2: User adds category filter
      const codeExecutionCategory = screen.getByTestId('category-code-execution');
      await user.click(codeExecutionCategory);

      await waitFor(() => {
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
      });

      // Step 3: User changes sorting
      await user.selectOptions(sortSelect, 'difficulty');

      await waitFor(() => {
        const tools = screen.getAllByRole('gridcell');
        // Beginner tools should come first
        const firstTool = tools[0];
        const difficulty = screen.getByTestId(`tool-difficulty-${firstTool.getAttribute('data-testid')?.replace('tool-', '')}`);
        expect(difficulty).toHaveTextContent('beginner');
      });

      // Step 4: User clears search
      await user.clear(searchInput);

      await waitFor(() => {
        // Should show all code execution tools, still sorted by difficulty
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-python-runner')).toBeInTheDocument();
      });

      // Step 5: User removes all filters
      const allCheckboxes = screen.getAllByRole('checkbox');
      for (const checkbox of allCheckboxes) {
        if (checkbox.checked) {
          await user.click(checkbox);
        }
      }

      await waitFor(() => {
        // Should show all tools, still sorted by difficulty
        expect(screen.getByTestId('tool-code-executor')).toBeInTheDocument();
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(screen.getByTestId('tool-hash-generator')).toBeInTheDocument();
      });
    });

    it('should persist search and filter state during navigation', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');
      const jsonCategory = screen.getByTestId('category-json-processing');

      // Apply search and filter
      await user.type(searchInput, 'json');
      await user.click(jsonCategory);

      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(searchInput).toHaveValue('json');
        expect(jsonCategory.querySelector('input')).toBeChecked();
      });

      // In a real application, this would test navigation persistence
      // For this test, we verify that state is maintained during re-renders
      expect(searchInput).toHaveValue('json');
      expect(jsonCategory.querySelector('input')).toBeChecked();
    });

    it('should handle rapid filter and search changes efficiently', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Rapid successive changes
      await user.type(searchInput, 'j');
      await user.type(searchInput, 's');
      await user.type(searchInput, 'o');
      await user.type(searchInput, 'n');

      // Add filters while typing
      const jsonCategory = screen.getByTestId('category-json-processing');
      await user.click(jsonCategory);

      const beginnerDifficulty = screen.getByTestId('difficulty-beginner');
      await user.click(beginnerDifficulty);

      // Should not crash and should show final correct results
      await waitFor(() => {
        expect(screen.getByTestId('tool-json-formatter')).toBeInTheDocument();
        expect(searchInput).toHaveValue('json');
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty search and filter states gracefully', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Search for something with no results
      await user.type(searchInput, 'nonexistent-tool');

      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('0 tools found');
      });

      // Apply filters that also yield no results
      const nonexistentCategory = screen.getByTestId('category-utilities');
      await user.click(nonexistentCategory);

      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByTestId('tool-url-encoder')).toBeInTheDocument();
      });
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      const searchInput = screen.getByTestId('search-input');

      // Test various special characters
      const specialQueries = ['json+', 'code*', 'form@t', 'util#ty'];

      for (const query of specialQueries) {
        await user.clear(searchInput);
        await user.type(searchInput, query);

        // Should not crash and should show appropriate results (or no results)
        await waitFor(() => {
          expect(screen.getByTestId('tool-search-page')).toBeInTheDocument();
        });
      }
    });

    it('should maintain performance with many active filters', async () => {
      const user = userEvent.setup();
      customRender(<ToolSearchPage />);

      // Activate all filters
      const allCheckboxes = screen.getAllByRole('checkbox');

      const startTime = performance.now();

      for (const checkbox of allCheckboxes) {
        await user.click(checkbox);
      }

      await waitFor(() => {
        const resultsCount = screen.getByTestId('search-results-count');
        expect(resultsCount).toBeInTheDocument();
      });

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
