'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/material-symbols';

interface SearchSuggestion {
	id: string;
	text: string;
	type: 'tool' | 'category' | 'tag' | 'recent';
	icon?: string;
	description?: string;
}

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	onSearch?: (value: string) => void;
	placeholder?: string;
	suggestions?: SearchSuggestion[];
	showSuggestions?: boolean;
	showHistory?: boolean;
	onClearHistory?: () => void;
	onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
	loading?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			className,
			type,
			onSearch,
			placeholder = 'Search tools, categories, or tags...',
			value,
			onChange,
			suggestions = [],
			showSuggestions = true,
			showHistory = true,
			onClearHistory,
			onSelectSuggestion,
			loading = false,
			...props
		},
		ref,
	) => {
		const [inputValue, setInputValue] = React.useState(value || '');
		const [isOpen, setIsOpen] = React.useState(false);
		const [debouncedValue, setDebouncedValue] = React.useState('');
		const [searchHistory, setSearchHistory] = React.useState<string[]>([]);

		// Load search history from localStorage
		React.useEffect(() => {
			if (typeof window !== 'undefined') {
				try {
					const history = localStorage.getItem('search-history') || '[]';
					setSearchHistory(JSON.parse(history));
				} catch (error) {
					console.error('Failed to load search history:', error);
				}
			}
		}, []);

		// Save search history
		const saveToHistory = (query: string) => {
			if (!query.trim()) return;

			const newHistory = [query, ...searchHistory.filter((item) => item !== query)].slice(0, 10);
			setSearchHistory(newHistory);

			if (typeof window !== 'undefined') {
				try {
					localStorage.setItem('search-history', JSON.stringify(newHistory));
				} catch (error) {
					console.error('Failed to save search history:', error);
				}
			}
		};

		// Debounce search input
		React.useEffect(() => {
			const timer = setTimeout(() => {
				setDebouncedValue(inputValue);
				if (inputValue.trim()) {
					onSearch?.(inputValue);
					saveToHistory(inputValue);
				}
			}, 300);

			return () => clearTimeout(timer);
		}, [inputValue, onSearch]);

		// Handle input change
		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setInputValue(newValue);
			onChange?.(e);
			setIsOpen(newValue.length > 0);
		};

		// Handle suggestion selection
		const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
			setInputValue(suggestion.text);
			setIsOpen(false);
			onSelectSuggestion?.(suggestion);
			onSearch?.(suggestion.text);
		};

		// Handle keyboard navigation
		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false);
			} else if (e.key === 'Enter' && inputValue.trim()) {
				setIsOpen(false);
				onSearch?.(inputValue);
				saveToHistory(inputValue);
			}
		};

		// Clear input
		const handleClear = () => {
			setInputValue('');
			setIsOpen(false);
			onChange?.({
				target: { value: '' },
			} as React.ChangeEvent<HTMLInputElement>);
		};

		// Get filtered suggestions
		const filteredSuggestions = React.useMemo(() => {
			if (!inputValue.trim()) return [];

			const lowerInput = inputValue.toLowerCase();
			return suggestions
				.filter(
					(suggestion) =>
						suggestion.text.toLowerCase().includes(lowerInput) ||
						suggestion.description?.toLowerCase().includes(lowerInput),
				)
				.slice(0, 8);
		}, [inputValue, suggestions]);

		// Get recent searches
		const recentSearches = React.useMemo(() => {
			if (!inputValue.trim() && showHistory) {
				return searchHistory.slice(0, 5).map((text) => ({
					id: `recent-${text}`,
					text,
					type: 'recent' as const,
					icon: 'HISTORY',
				}));
			}
			return [];
		}, [inputValue, searchHistory, showHistory]);

		return (
			<div className="relative">
				<div className="relative">
					<Icon name="SEARCH" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<Input
						type={type}
						className={cn('pl-10 pr-20', className)}
						placeholder={placeholder}
						ref={ref}
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={() => setIsOpen(true)}
						{...props}
					/>

					{/* Clear button */}
					{inputValue && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleClear}
							className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
						>
							<Icon name="CLOSE" className="h-4 w-4" />
						</Button>
					)}

					{/* Loading indicator */}
					{loading && (
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
						</div>
					)}
				</div>

				{/* Suggestions dropdown */}
				{showSuggestions && isOpen && (filteredSuggestions.length > 0 || recentSearches.length > 0) && (
					<div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
						<div className="max-h-80 overflow-y-auto">
							<div className="p-2">
								{/* Recent searches */}
								{recentSearches.length > 0 && (
									<div className="mb-2">
										<div className="flex items-center justify-between px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
											<span>Recent Searches</span>
											{onClearHistory && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={onClearHistory}
													className="h-auto p-0 text-xs hover:text-gray-700 dark:hover:text-gray-300"
												>
													Clear
												</Button>
											)}
										</div>
										{recentSearches.map((suggestion) => (
											<button
												key={suggestion.id}
												type="button"
												onClick={() => handleSelectSuggestion(suggestion)}
												className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
											>
												<Icon name="HISTORY" className="h-3 w-3 text-gray-400" />
												<span className="text-gray-700 dark:text-gray-300">{suggestion.text}</span>
											</button>
										))}
									</div>
								)}

								{/* Suggestions */}
								{filteredSuggestions.length > 0 && (
									<div>
										{recentSearches.length > 0 && (
											<div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
												Suggestions
											</div>
										)}
										{filteredSuggestions.map((suggestion) => (
											<button
												key={suggestion.id}
												type="button"
												onClick={() => handleSelectSuggestion(suggestion)}
												className="w-full flex items-center gap-3 px-2 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
											>
												<div className="flex items-center gap-2 flex-1">
													{suggestion.icon && (
														<Icon name={suggestion.icon as keyof typeof ICONS} className="h-4 w-4 text-gray-400" />
													)}
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
																{suggestion.text}
															</span>
															<Badge variant="outline" className="text-xs">
																{suggestion.type}
															</Badge>
														</div>
														{suggestion.description && (
															<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
																{suggestion.description}
															</p>
														)}
													</div>
												</div>
											</button>
										))}
									</div>
								)}

								{/* No results */}
								{inputValue && filteredSuggestions.length === 0 && recentSearches.length === 0 && (
									<div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
										No suggestions found
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Click outside to close */}
				{isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
			</div>
		);
	},
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
export type { SearchSuggestion };
