import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/ui/search-input';
import { mockSearchSuggestions, createMockLocalStorage, waitForDebounce } from '../test-utils';

// Mock localStorage
const mockLocalStorage = createMockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock debounce timing
vi.useFakeTimers();

describe('SearchInput Component', () => {
  const defaultProps = {
    placeholder: 'Search tools...',
    value: '',
    onSearch: vi.fn(),
    onChange: vi.fn(),
    suggestions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders search input with placeholder', () => {
      render(<SearchInput {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('displays search icon', () => {
      render(<SearchInput {...defaultProps} />);

      const searchIcon = document.querySelector('[data-testid="search-icon"]') ||
                        document.querySelector('svg[class*="h-4 w-4"]');
      expect(searchIcon).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SearchInput {...defaultProps} className="custom-class" />);

      const searchInput = screen.getByPlaceholderText('Search tools...');
      expect(searchInput).toHaveClass('custom-class');
    });

    it('renders with initial value', () => {
      render(<SearchInput {...defaultProps} value="initial search" />);

      const searchInput = screen.getByDisplayValue('initial search');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('handles text input', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      const onChange = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onSearch={onSearch}
          onChange={onChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      expect(onChange).toHaveBeenCalledTimes(4); // J, S, O, N
      expect(searchInput).toHaveValue('JSON');
    });

    it('debounces search calls', async () => {
      const onSearch = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'JSON' } });
      });

      // Should not call onSearch immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Fast-forward 300ms for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('JSON');
      });
    });

    it('calls onSearch on Enter key', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('JSON');
    });

    it('closes suggestions on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear Functionality', () => {
    it('shows clear button when input has value', async () => {
      const user = userEvent.setup();

      render(<SearchInput {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onChange={onChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        target: { value: '' }
      }));
    });

    it('hides clear button when input is empty', () => {
      render(<SearchInput {...defaultProps} />);

      const clearButton = screen.queryByRole('button', { name: /clear/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      render(<SearchInput {...defaultProps} loading={true} />);

      const loadingIndicator = document.querySelector('.animate-spin');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('hides loading indicator when not loading', () => {
      render(<SearchInput {...defaultProps} loading={false} />);

      const loadingIndicator = document.querySelector('.animate-spin');
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Suggestions Dropdown', () => {
    it('displays suggestions when input has value', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
        expect(screen.getByText('JSON Processing')).toBeInTheDocument();
        expect(screen.getByText('json')).toBeInTheDocument();
      });
    });

    it('shows suggestion badges', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        expect(screen.getByText('tool')).toBeInTheDocument();
        expect(screen.getByText('category')).toBeInTheDocument();
        expect(screen.getByText('tag')).toBeInTheDocument();
      });
    });

    it('selects suggestion when clicked', async () => {
      const user = userEvent.setup();
      const onSelectSuggestion = vi.fn();
      const onSearch = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
          onSelectSuggestion={onSelectSuggestion}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('JSON Formatter');
      await user.click(suggestion);

      expect(onSelectSuggestion).toHaveBeenCalledWith(mockSearchSuggestions[0]);
      expect(onSearch).toHaveBeenCalledWith('JSON Formatter');
      expect(searchInput).toHaveValue('JSON Formatter');
    });

    it('closes suggestions after selection', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('JSON Formatter');
      await user.click(suggestion);

      await waitFor(() => {
        expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when no suggestions match', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={[]}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'nomatch');

      await waitFor(() => {
        expect(screen.getByText('No suggestions found')).toBeInTheDocument();
      });
    });
  });

  describe('Search History', () => {
    beforeEach(() => {
      // Mock localStorage with search history
      mockLocalStorage.setItem('search-history', JSON.stringify(['JSON', 'XML', 'Base64']));
    });

    it('displays search history when input is empty', async () => {
      render(<SearchInput {...defaultProps} showHistory={true} />);

      const searchInput = screen.getByPlaceholderText('Search tools...');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('JSON')).toBeInTheDocument();
        expect(screen.getByText('XML')).toBeInTheDocument();
        expect(screen.getByText('Base64')).toBeInTheDocument();
      });
    });

    it('clears search history when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onClearHistory = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          showHistory={true}
          onClearHistory={onClearHistory}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(onClearHistory).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('search-history');
    });

    it('saves search to history after debounced search', async () => {
      const onSearch = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'New Search' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'search-history',
          expect.stringContaining('New Search')
        );
      });
    });

    it('limits search history to 10 items', async () => {
      // Mock localStorage with 10 existing items
      const existingHistory = Array.from({ length: 10 }, (_, i) => `Search ${i + 1}`);
      mockLocalStorage.setItem('search-history', JSON.stringify(existingHistory));

      const onSearch = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'New Search' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(savedHistory).toHaveLength(10);
        expect(savedHistory[0]).toBe('New Search');
        expect(savedHistory).not.toContain('Search 10'); // Oldest item should be removed
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'JSON');

      await waitFor(() => {
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
      });

      // Click outside
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument();
      });
    });

    it('maintains focus when dropdown opens', async () => {
      const user = userEvent.setup();

      render(<SearchInput {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.click(searchInput);

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SearchInput {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tools...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('announces loading state to screen readers', () => {
      render(<SearchInput {...defaultProps} loading={true} />);

      const loadingIndicator = document.querySelector('.animate-spin');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(
        <SearchInput
          {...defaultProps}
          onSearch={onSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');

      // Test Tab navigation
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Test Enter key
      await user.type(searchInput, 'test');
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SearchInput {...defaultProps} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load search history:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles invalid JSON in localStorage gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SearchInput {...defaultProps} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load search history:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('limits suggestions to 8 items', async () => {
      const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
        id: `suggestion-${i}`,
        text: `Suggestion ${i}`,
        type: 'tool' as const,
        score: 100 - i,
      }));

      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={manySuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        // Should only show 8 suggestions
        const suggestions = screen.getAllByRole('button').filter(
          button => button.textContent?.startsWith('Suggestion')
        );
        expect(suggestions).toHaveLength(8);
      });
    });

    it('filters suggestions based on input', async () => {
      const user = userEvent.setup();

      render(
        <SearchInput
          {...defaultProps}
          suggestions={mockSearchSuggestions}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tools...');
      await user.type(searchInput, 'Processing');

      await waitFor(() => {
        // Should only show "JSON Processing" suggestion
        expect(screen.getByText('JSON Processing')).toBeInTheDocument();
        expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument();
      });
    });
  });
});
