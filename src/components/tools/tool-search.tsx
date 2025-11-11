"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { cn } from "@/lib/utils";
import {
  generateSearchSuggestions,
  highlightSearchText,
} from "@/lib/search-utils";
import type { Tool } from "@/types/tools";

interface ToolSearchProps {
  tools: Tool[];
  onSearch: (query: string) => void;
  onToolSelect?: (tool: Tool) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

interface SearchSuggestion {
  type: "tool" | "tag" | "feature" | "category";
  value: string;
  tool?: Tool;
}

export function ToolSearch({
  tools,
  onSearch,
  onToolSelect,
  placeholder = "Search tools...",
  className,
  debounceMs = 300,
}: ToolSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchRef = useRef<NodeJS.Timeout>();

  // Generate suggestions based on query
  const generateSuggestions = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      const lowercaseQuery = searchQuery.toLowerCase();
      const newSuggestions: SearchSuggestion[] = [];
      const maxSuggestions = 8;

      // Tool suggestions
      const toolMatches = tools
        .filter((tool) => tool.name.toLowerCase().includes(lowercaseQuery))
        .slice(0, 3);

      toolMatches.forEach((tool) => {
        newSuggestions.push({
          type: "tool",
          value: tool.name,
          tool,
        });
      });

      // Tag suggestions
      const tagMatches = Array.from(new Set(tools.flatMap((tool) => tool.tags)))
        .filter((tag) => tag.toLowerCase().includes(lowercaseQuery))
        .slice(0, 2);

      tagMatches.forEach((tag) => {
        newSuggestions.push({
          type: "tag",
          value: tag,
        });
      });

      // Feature suggestions
      const featureMatches = Array.from(
        new Set(tools.flatMap((tool) => tool.features)),
      )
        .filter((feature) => feature.toLowerCase().includes(lowercaseQuery))
        .slice(0, 2);

      featureMatches.forEach((feature) => {
        newSuggestions.push({
          type: "feature",
          value: feature,
        });
      });

      // Category suggestions
      const categoryMatches = Array.from(
        new Set(tools.map((tool) => tool.category)),
      )
        .filter((category) => category.toLowerCase().includes(lowercaseQuery))
        .slice(0, 1);

      categoryMatches.forEach((category) => {
        newSuggestions.push({
          type: "category",
          value: category,
        });
      });

      setSuggestions(newSuggestions.slice(0, maxSuggestions));
    },
    [tools],
  );

  // Handle debounced search
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      // Clear existing timeout
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }

      // Set new timeout for debounced search
      debouncedSearchRef.current = setTimeout(() => {
        onSearch(searchQuery);
        generateSuggestions(searchQuery);
      }, debounceMs);
    },
    [onSearch, generateSuggestions, debounceMs],
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearch(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "tool" && suggestion.tool && onToolSelect) {
      onToolSelect(suggestion.tool);
      setIsOpen(false);
      return;
    }

    const newQuery = suggestion.value;
    setQuery(newQuery);
    onSearch(newQuery);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    onSearch("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle focus
  const handleFocus = () => {
    if (query.trim()) {
      generateSuggestions(query);
      setIsOpen(true);
    }
  };

  // Handle blur
  const handleBlur = () => {
    // Delay closing to allow suggestion clicks
    setTimeout(() => setIsOpen(false), 150);
  };

  // Get suggestion icon
  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "tool":
        return "TOOLS";
      case "tag":
        return "TAG";
      case "feature":
        return "STAR";
      case "category":
        return "CATEGORY";
      default:
        return "SEARCH";
    }
  };

  // Get suggestion badge color
  const getSuggestionBadgeColor = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "tool":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "tag":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "feature":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "category":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      {/* Search Input */}
      <div className="relative">
        <Icon
          name="SEARCH"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-10 h-9 sm:h-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 touch-manipulation"
            aria-label="Clear search"
          >
            <Icon name="CLOSE" className="text-gray-400 text-sm sm:text-base" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-h-60 sm:max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`${suggestion.type}-${suggestion.value}`}
                      value={suggestion.value}
                      onSelect={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 cursor-pointer touch-manipulation min-h-0",
                        index === selectedIndex &&
                          "bg-gray-100 dark:bg-gray-700",
                      )}
                    >
                      <Icon
                        name={getSuggestionIcon(suggestion.type)}
                        className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm sm:text-base"
                      />
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span
                          className="text-sm sm:text-base truncate"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchText(
                              suggestion.value,
                              query,
                              "bg-yellow-200 dark:bg-yellow-800",
                            ),
                          }}
                        />
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs flex-shrink-0",
                            getSuggestionBadgeColor(suggestion.type),
                          )}
                        >
                          {suggestion.type}
                        </Badge>
                      </div>
                      {suggestion.tool?.isPopular && (
                        <Icon
                          name="STAR"
                          className="text-yellow-500 text-xs sm:text-sm flex-shrink-0"
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </CardContent>
        </Card>
      )}

      {/* Keyboard Navigation Hint */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      )}
    </div>
  );
}

// Search Results Component
interface SearchResultsProps {
  tools: Tool[];
  query: string;
  onToolSelect: (tool: Tool) => void;
  isLoading?: boolean;
  maxResults?: number;
}

export function SearchResults({
  tools,
  query,
  onToolSelect,
  isLoading = false,
  maxResults = 20,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-transparent border-b-transparent"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Searching...
        </span>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Icon
          name="SEARCH"
          className="text-4xl mb-4 mx-auto text-gray-300 dark:text-gray-600"
        />
        <p>Enter a search term to find tools</p>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Icon
          name="SEARCH_OFF"
          className="text-4xl mb-4 mx-auto text-gray-300 dark:text-gray-600"
        />
        <p>No tools found for "{query}"</p>
        <p className="text-sm mt-2">
          Try different keywords or browse categories
        </p>
      </div>
    );
  }

  const displayTools = tools.slice(0, maxResults);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Search Results ({tools.length})
        </h3>
        {tools.length > maxResults && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing first {maxResults} results
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayTools.map((tool) => (
          <Card
            key={tool.id}
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
            onClick={() => onToolSelect(tool)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Icon
                    name={tool.icon as keyof typeof ICONS}
                    className="text-white text-sm"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm">{tool.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {tool.category}
                    </Badge>
                    {tool.isPopular && (
                      <Icon name="STAR" className="text-yellow-500 text-xs" />
                    )}
                    {tool.isNew && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchText(
                      tool.description,
                      query,
                      "bg-yellow-200 dark:bg-yellow-800",
                    ),
                  }}
                />
              </CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                {tool.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tool.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tool.tags.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tools.length > maxResults && (
        <div className="text-center mt-6">
          <Button variant="outline">
            Load More Results ({tools.length - maxResults} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
