"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToolSearch } from "@/components/tools/tool-search";
import { ToolFilters, ActiveFilters } from "@/components/tools/tool-filters";
import { CategoryNavigation } from "@/components/tools/category-navigation";
import { CategoryOverview } from "@/components/tools/category-overview";
import { BreadcrumbNavigation } from "@/components/tools/breadcrumb-navigation";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { toolsData } from "@/data/tools-data";
import { searchAndFilterTools, initialSearchState } from "@/lib/search-utils";
import { cn } from "@/lib/utils";
import type { Tool, SearchState } from "@/types/tools";
import {
  getCategoryBySlug,
  getToolsBySubcategory,
  generateBreadcrumb,
  initializeNavigationState,
  isValidSubcategory,
} from "@/lib/category-utils";

export default function SubcategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string;
  const subcategorySlug = params.subcategory as string;

  const [darkMode, setDarkMode] = useState(false);
  const [searchState, setSearchState] =
    useState<SearchState>(initialSearchState);
  const [showFilters, setShowFilters] = useState(false);
  const [navigationState, setNavigationState] = useState(
    initializeNavigationState(categorySlug, subcategorySlug.replace(/-/g, " ")),
  );

  // Get category and subcategory data
  const category = getCategoryBySlug(categorySlug);
  const subcategoryName = subcategorySlug.replace(/-/g, " ");
  const isSubcategoryValid =
    category && isValidSubcategory(category.name, subcategoryName);
  const subcategoryData = isSubcategoryValid
    ? category.subcategories?.[subcategoryName]
    : null;
  const subcategoryTools = subcategoryData
    ? toolsData.filter((tool) => subcategoryData.toolIds.includes(tool.id))
    : [];
  const breadcrumb =
    category && isSubcategoryValid
      ? generateBreadcrumb(category.name, subcategoryName)
      : [];

  // Filter and search tools
  const filteredTools = searchAndFilterTools(subcategoryTools, searchState);

  // Redirect if category or subcategory not found
  useEffect(() => {
    if (!category || !isSubcategoryValid) {
      router.replace("/tools");
    }
  }, [category, isSubcategoryValid, router]);

  // Check system dark mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode =
        localStorage.getItem("darkMode") === "true" ||
        (!localStorage.getItem("darkMode") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setDarkMode(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("darkMode", newDarkMode.toString());
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Navigate to tool
  const navigateToTool = (href: string) => {
    router.push(href);
  };

  // Handle tool selection from search
  const handleToolSelect = (tool: Tool) => {
    navigateToTool(tool.href);
  };

  // Handle search query change
  const handleSearch = (query: string) => {
    setSearchState((prev) => ({ ...prev, query }));
  };

  // Handle filter changes
  const handleFiltersChange = (filters: Partial<SearchState>) => {
    setSearchState((prev) => ({ ...prev, ...filters }));
  };

  // Handle filter removal
  const handleRemoveFilter = (
    filterType: keyof SearchState,
    value?: string,
  ) => {
    setSearchState((prev) => {
      const newState = { ...prev };

      if (value && Array.isArray(newState[filterType])) {
        newState[filterType] = (newState[filterType] as string[]).filter(
          (item) => item !== value,
        ) as any;
      } else {
        (newState as any)[filterType] =
          filterType === "isNew" || filterType === "isPopular" ? null : [];
      }

      return newState;
    });
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchState((prev) => ({ ...prev, ...initialSearchState }));
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(searchState).some((key) => {
      const value = searchState[key as keyof SearchState];
      if (key === "query") return value !== "";
      if (key === "isNew" || key === "isPopular") return value !== null;
      return Array.isArray(value) && value.length > 0;
    });
  }, [searchState]);

  // If category or subcategory not found, show loading or redirect
  if (!category || !isSubcategoryValid || !subcategoryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-transparent border-b-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading subcategory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="mb-4">
              <BreadcrumbNavigation items={breadcrumb} />
            </div>

            <div className="flex items-center justify-between">
              {/* Back Button and Subcategory Info */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2"
                >
                  <Icon name="ARROW_BACK" className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                      category.color === "blue"
                        ? "bg-blue-500"
                        : category.color === "green"
                          ? "bg-green-500"
                          : category.color === "purple"
                            ? "bg-purple-500"
                            : category.color === "cyan"
                              ? "bg-cyan-500"
                              : category.color === "orange"
                                ? "bg-orange-500"
                                : category.color === "red"
                                  ? "bg-red-500"
                                  : "bg-gray-500",
                    )}
                  >
                    <Icon
                      name={category.icon as keyof typeof ICONS}
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {subcategoryData.name}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {subcategoryData.description} • {subcategoryTools.length}{" "}
                      tools
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-8">
                <ToolSearch
                  tools={subcategoryTools}
                  onSearch={handleSearch}
                  onToolSelect={handleToolSelect}
                  placeholder={`Search ${subcategoryData.name.toLowerCase()}...`}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {/* Filter Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700",
                    hasActiveFilters && "text-blue-600 dark:text-blue-400",
                  )}
                  aria-label="Toggle filters"
                >
                  <Icon name="FILTER_LIST" className="text-xl" />
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {
                        Object.keys(searchState).filter((key) => {
                          const value = searchState[key as keyof SearchState];
                          if (key === "query") return value !== "";
                          if (key === "isNew" || key === "isPopular")
                            return value !== null;
                          return Array.isArray(value) && value.length > 0;
                        }).length
                      }
                    </Badge>
                  )}
                </Button>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle dark mode"
                >
                  <Icon
                    name={darkMode ? "LIGHT_MODE" : "DARK_MODE"}
                    className="text-xl"
                  />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Subcategory Description */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {subcategoryData.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {subcategoryData.description}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {subcategoryTools.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tools
                </div>
              </div>
            </div>

            {/* Navigation to parent category */}
            <Button
              variant="outline"
              onClick={() => router.push(`/tools/${category.slug}`)}
              className="mb-4"
            >
              <Icon name="ARROW_BACK" className="mr-2 h-4 w-4" />
              Back to {category.name}
            </Button>
          </div>

          {/* Active Filters */}
          <ActiveFilters
            filters={searchState}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            className="mb-6"
          />

          {/* Search Results or Tools Grid */}
          {searchState.query || hasActiveFilters ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {searchState.query && `Results for "${searchState.query}"`}
                  {hasActiveFilters && !searchState.query && "Filtered Results"}
                  {searchState.query && hasActiveFilters && " (Filtered)"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredTools.length} of {subcategoryTools.length} tools
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                    onClick={() => navigateToTool(tool.href)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon
                            name={tool.icon as keyof typeof ICONS}
                            className="text-white text-lg"
                          />
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {tool.isNew && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              New
                            </Badge>
                          )}
                          {tool.isPopular && (
                            <Badge
                              variant="default"
                              className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardTitle className="text-lg line-clamp-1">
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tool.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tool.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={cn(
                              tool.difficulty === "beginner"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : tool.difficulty === "intermediate"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            )}
                          >
                            {tool.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tool.processingType}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Default Tools Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subcategoryTools.map((tool) => (
                <Card
                  key={tool.id}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                  onClick={() => navigateToTool(tool.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon
                          name={tool.icon as keyof typeof ICONS}
                          className="text-white text-lg"
                        />
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {tool.isNew && (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            New
                          </Badge>
                        )}
                        {tool.isPopular && (
                          <Badge
                            variant="default"
                            className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          >
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardTitle className="text-lg line-clamp-1">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tool.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {tool.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tool.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={cn(
                            tool.difficulty === "beginner"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : tool.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                          )}
                        >
                          {tool.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tool.processingType}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
