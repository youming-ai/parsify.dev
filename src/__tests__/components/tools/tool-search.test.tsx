import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolSearch, SearchResults } from '@/components/tools/tool-search';
import { mockTools, mockToolSearchProps, mockKeyboardEvents } from '../../utils/test-data';
import { customRender, testPatterns, mockUserInteraction } from '../../utils/test-utils';

describe('ToolSearch', () => {
	const mockOnSearch = vi.fn();
	const mockOnToolSelect = vi.fn();

	const defaultProps = {
		tools: mockTools,
		onSearch: mockOnSearch,
		onToolSelect: mockOnToolSelect,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Rendering', () => {
		it('should render search input with placeholder', () => {
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			expect(searchInput).toBeInTheDocument();
			expect(searchInput).toHaveAttribute('type', 'text');
		});

		it('should render search icon', () => {
			customRender(<ToolSearch {...defaultProps} />);

			const searchIcon = document.querySelector('.icon-search');
			expect(searchIcon).toBeInTheDocument();
		});

		it('should render custom placeholder', () => {
			customRender(
				<ToolSearch {...defaultProps} placeholder="Custom placeholder" />
			);

			expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
		});

		it('should apply custom className', () => {
			customRender(<ToolSearch {...defaultProps} className="custom-class" />);

			const container = document.querySelector('.custom-class');
			expect(container).toBeInTheDocument();
		});

		it('should not show clear button when query is empty', () => {
			customRender(<ToolSearch {...defaultProps} />);

			const clearButton = screen.queryByLabelText('Clear search');
			expect(clearButton).not.toBeInTheDocument();
		});
	});

	describe('Search Functionality', () => {
		it('should call onSearch when typing', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');

			await user.type(searchInput, 'json');

			// Wait for debounce
			act(() => {
				vi.advanceTimersByTime(300);
			});

			expect(mockOnSearch).toHaveBeenCalledWith('json');
		});

		it('should use custom debounce time', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} debounceMs={500} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');

			await user.type(searchInput, 'json');

			act(() => {
				vi.advanceTimersByTime(300);
			});

			// Should not have been called yet
			expect(mockOnSearch).not.toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(200);
			});

			// Now it should be called
			expect(mockOnSearch).toHaveBeenCalledWith('json');
		});

		it('should show clear button when query is entered', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			const clearButton = screen.getByLabelText('Clear search');
			expect(clearButton).toBeInTheDocument();
		});

		it('should clear search when clear button is clicked', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			const clearButton = screen.getByLabelText('Clear search');
			await user.click(clearButton);

			expect(searchInput).toHaveValue('');
			expect(mockOnSearch).toHaveBeenCalledWith('');
		});

		it('should open suggestions dropdown on focus', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			// Should show suggestions
			await waitFor(() => {
				const suggestions = document.querySelector('[role="listbox"]');
				expect(suggestions).toBeInTheDocument();
			});
		});

		it('should close suggestions on blur', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			// Wait for suggestions to appear
			await waitFor(() => {
				const suggestions = document.querySelector('[role="listbox"]');
				expect(suggestions).toBeInTheDocument();
			});

			// Blur the input
			await user.tab();

			// Wait for blur delay
			act(() => {
				vi.advanceTimersByTime(150);
			});

			// Suggestions should be closed
			expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
		});
	});

	describe('Search Suggestions', () => {
		it('should show tool suggestions', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
			});
		});

		it('should show tag suggestions', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'validator');

			await waitFor(() => {
				expect(screen.getByText('validator')).toBeInTheDocument();
			});
		});

		it('should show category suggestions', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json processing');

			await waitFor(() => {
				expect(screen.getByText('JSON Processing')).toBeInTheDocument();
			});
		});

		it('should limit number of suggestions', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'j');

			await waitFor(() => {
				const suggestions = document.querySelectorAll('[role="option"]');
				expect(suggestions.length).toBeLessThanOrEqual(8);
			});
		});

		it('should highlight matching text in suggestions', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				const highlightedText = document.querySelector('.bg-yellow-200');
				expect(highlightedText).toBeInTheDocument();
			});
		});

		it('should show star icon for popular tools', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				const starIcon = document.querySelector('.text-yellow-500');
				expect(starIcon).toBeInTheDocument();
			});
		});
	});

	describe('Keyboard Navigation', () => {
		it('should navigate suggestions with arrow keys', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
			});

			// Navigate down
			await user.keyboard('{ArrowDown}');
			await user.keyboard('{ArrowDown}');

			// Check if first suggestion is selected
			act(() => {
				const firstSuggestion = document.querySelector('[role="option"]');
				expect(firstSuggestion).toHaveClass(/bg-gray-100/);
			});
		});

		it('should navigate up with arrow keys', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
			});

			// Navigate down then up
			await user.keyboard('{ArrowDown}');
			await user.keyboard('{ArrowDown}');
			await user.keyboard('{ArrowUp}');

			// Should move selection back
			act(() => {
				const suggestions = document.querySelectorAll('[role="option"]');
				expect(suggestions[0]).not.toHaveClass(/bg-gray-100/);
			});
		});

		it('should select suggestion on Enter', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
			});

			// Navigate to first suggestion and select it
			await user.keyboard('{ArrowDown}');
			await user.keyboard('{Enter}');

			expect(mockOnSearch).toHaveBeenCalled();
		});

		it('should close suggestions on Escape', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
			});

			await user.keyboard('{Escape}');

			expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
		});

		it('should not navigate when no suggestions are shown', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');

			// Arrow keys should not crash when no suggestions
			await user.keyboard('{ArrowDown}');
			await user.keyboard('{ArrowUp}');
			await user.keyboard('{Enter}');

			expect(mockOnSearch).not.toHaveBeenCalled();
		});
	});

	describe('Tool Selection', () => {
		it('should call onToolSelect when tool suggestion is clicked', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				const toolSuggestion = screen.getByText('JSON Formatter');
				expect(toolSuggestion).toBeInTheDocument();
			});

			const toolSuggestion = screen.getByText('JSON Formatter');
			await user.click(toolSuggestion);

			expect(mockOnToolSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'json-formatter',
					name: 'JSON Formatter',
				})
			);
		});

		it('should search when non-tool suggestion is clicked', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'validator');

			await waitFor(() => {
				const tagSuggestion = screen.getByText('validator');
				expect(tagSuggestion).toBeInTheDocument();
			});

			const tagSuggestion = screen.getByText('validator');
			await user.click(tagSuggestion);

			expect(mockOnSearch).toHaveBeenCalledWith('validator');
		});

		it('should close suggestions after tool selection', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
			});

			const toolSuggestion = screen.getByText('JSON Formatter');
			await user.click(toolSuggestion);

			expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes', () => {
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			expect(searchInput).toHaveAttribute('role', 'search');
		});

		it('should provide keyboard navigation hint', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				const hint = screen.getByText(/Use ↑↓ to navigate/);
				expect(hint).toBeInTheDocument();
			});
		});

		it('should announce suggestions to screen readers', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json');

			await waitFor(() => {
				const listbox = document.querySelector('[role="listbox"]');
				expect(listbox).toBeInTheDocument();
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle empty tools array', () => {
			expect(() => {
				customRender(<ToolSearch {...defaultProps} tools={[]} />);
			}).not.toThrow();
		});

		it('should handle missing onToolSelect', () => {
			expect(() => {
				customRender(
					<ToolSearch
						tools={mockTools}
						onSearch={mockOnSearch}
					/>
				);
			}).not.toThrow();
		});

		it('should handle special characters in search', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'json!@#$%^&*()');

			expect(mockOnSearch).toHaveBeenCalledWith('json!@#$%^&*()');
		});
	});

	describe('Performance', () => {
		it('should debounce search input', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');

			// Type multiple characters quickly
			await user.type(searchInput, 'json-formatter');

			// Should not have been called yet
			expect(mockOnSearch).not.toHaveBeenCalled();

			// Wait for debounce
			act(() => {
				vi.advanceTimersByTime(300);
			});

			// Should be called only once with final value
			expect(mockOnSearch).toHaveBeenCalledTimes(1);
			expect(mockOnSearch).toHaveBeenCalledWith('json-formatter');
		});

		it('should limit suggestions generation', async () => {
			const user = userEvent.setup();
			customRender(<ToolSearch {...defaultProps} />);

			const searchInput = screen.getByPlaceholderText('Search tools...');
			await user.type(searchInput, 'j');

			await waitFor(() => {
				const suggestions = document.querySelectorAll('[role="option"]');
				expect(suggestions.length).toBeLessThanOrEqual(8);
			});
		});
	});
});

describe('SearchResults', () => {
	const mockOnToolSelect = vi.fn();

	const defaultProps = {
		tools: mockTools,
		query: 'json',
		onToolSelect: mockOnToolSelect,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render search results', () => {
			customRender(<SearchResults {...defaultProps} />);

			expect(screen.getByText(/Search Results/)).toBeInTheDocument();
			expect(screen.getByText(/JSON Formatter/)).toBeInTheDocument();
		});

		it('should show loading state', () => {
			customRender(
				<SearchResults {...defaultProps} isLoading={true} />
			);

			expect(screen.getByText('Searching...')).toBeInTheDocument();
		});

		it('should show empty state for no query', () => {
			customRender(
				<SearchResults {...defaultProps} query="" />
			);

			expect(screen.getByText('Enter a search term to find tools')).toBeInTheDocument();
		});

		it('should show no results state', () => {
			customRender(
				<SearchResults
					{...defaultProps}
					query="nonexistent"
					tools={[]}
				/>
			);

			expect(screen.getByText(/No tools found for "nonexistent"/)).toBeInTheDocument();
		});

		it('should limit number of results', () => {
			const manyTools = Array(50).fill(mockTools[0]);
			customRender(
				<SearchResults
					{...defaultProps}
					tools={manyTools}
					maxResults={10}
				/>
			);

			expect(screen.getByText('Showing first 10 results')).toBeInTheDocument();
		});
	});

	describe('Tool Cards', () => {
		it('should render tool information correctly', () => {
			customRender(<SearchResults {...defaultProps} />);

			expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
			expect(screen.getByText('Format, beautify, and validate JSON data')).toBeInTheDocument();
		});

		it('should show tool badges', () => {
			customRender(<SearchResults {...defaultProps} />);

			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});

		it('should show popular indicator', () => {
			customRender(<SearchResults {...defaultProps} />);

			const starIcon = document.querySelector('.text-yellow-500');
			expect(starIcon).toBeInTheDocument();
		});

		it('should show new indicator', () => {
			const newTool = { ...mockTools[0], isNew: true };
			customRender(
				<SearchResults
					{...defaultProps}
					tools={[newTool]}
				/>
			);

			expect(screen.getByText('New')).toBeInTheDocument();
		});

		it('should show tool tags', () => {
			customRender(<SearchResults {...defaultProps} />);

			expect(screen.getByText('json')).toBeInTheDocument();
			expect(screen.getByText('formatter')).toBeInTheDocument();
		});

		it('should limit displayed tags', () => {
			const toolWithManyTags = {
				...mockTools[0],
				tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
			};
			customRender(
				<SearchResults
					{...defaultProps}
					tools={[toolWithManyTags]}
				/>
			);

			expect(screen.getByText('+2')).toBeInTheDocument();
		});
	});

	describe('Interactions', () => {
		it('should call onToolSelect when tool card is clicked', async () => {
			const user = userEvent.setup();
			customRender(<SearchResults {...defaultProps} />);

			const toolCard = screen.getByText('JSON Formatter').closest('[role="button"]');
			await user.click(toolCard!);

			expect(mockOnToolSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'json-formatter',
				})
			);
		});

		it('should show load more button when there are more results', () => {
			const manyTools = Array(50).fill(mockTools[0]);
			customRender(
				<SearchResults
					{...defaultProps}
					tools={manyTools}
					maxResults={10}
				/>
			);

			expect(screen.getByText(/Load More Results/)).toBeInTheDocument();
		});
	});

	describe('Text Highlighting', () => {
		it('should highlight search terms in tool names', () => {
			customRender(<SearchResults {...defaultProps} />);

			const highlightedText = document.querySelector('.bg-yellow-200');
			expect(highlightedText).toBeInTheDocument();
		});

		it('should highlight search terms in descriptions', () => {
			customRender(<SearchResults {...defaultProps} />);

			const highlightedText = document.querySelector('.bg-yellow-200');
			expect(highlightedText).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper heading structure', () => {
			customRender(<SearchResults {...defaultProps} />);

			const heading = screen.getByRole('heading', { level: 3 });
			expect(heading).toBeInTheDocument();
		});

		it('should have proper list structure', () => {
			customRender(<SearchResults {...defaultProps} />);

			const grid = document.querySelector('.grid');
			expect(grid).toBeInTheDocument();
		});

		it('should announce result count', () => {
			customRender(<SearchResults {...defaultProps} />);

			expect(screen.getByText(/Search Results/)).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('should handle empty tools array', () => {
			customRender(
				<SearchResults
					{...defaultProps}
					tools={[]}
					query="test"
				/>
			);

			expect(screen.getByText(/No tools found for "test"/)).toBeInTheDocument();
		});

		it('should handle undefined onToolSelect', () => {
			expect(() => {
				customRender(
					<SearchResults
						tools={mockTools}
						query="test"
					/>
				);
			}).not.toThrow();
		});
	});
});

describe('Integration Tests', () => {
	it('should integrate search with results', async () => {
		const user = userEvent.setup();
		const mockOnSearch = vi.fn();
		const mockOnToolSelect = vi.fn();

		customRender(
			<div>
				<ToolSearch
					tools={mockTools}
					onSearch={mockOnSearch}
					onToolSelect={mockOnToolSelect}
				/>
				<SearchResults
					tools={mockTools}
					query="json"
					onToolSelect={mockOnToolSelect}
				/>
			</div>
		);

		// Search for a tool
		const searchInput = screen.getByPlaceholderText('Search tools...');
		await user.type(searchInput, 'json');

		// Wait for debounce
		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(mockOnSearch).toHaveBeenCalledWith('json');

		// Click on a result
		const toolCard = screen.getByText('JSON Formatter').closest('[role="button"]');
		await user.click(toolCard!);

		expect(mockOnToolSelect).toHaveBeenCalled();
	});

	it('should handle complex search workflow', async () => {
		const user = userEvent.setup();
		const mockOnSearch = vi.fn();
		const mockOnToolSelect = vi.fn();

		customRender(
			<ToolSearch
				tools={mockTools}
				onSearch={mockOnSearch}
				onToolSelect={mockOnToolSelect}
			/>
		);

		const searchInput = screen.getByPlaceholderText('Search tools...');

		// Type search query
		await user.type(searchInput, 'json');

		// Wait for suggestions
		await waitFor(() => {
			expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
		});

		// Navigate with keyboard
		await user.keyboard('{ArrowDown}');
		await user.keyboard('{Enter}');

		// Should have searched and selected
		expect(mockOnSearch).toHaveBeenCalledWith('json');
	});
});
