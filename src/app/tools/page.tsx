"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { ToolSearch } from "@/components/tools/tool-search";
import { ToolFilters, ActiveFilters } from "@/components/tools/tool-filters";
import { CategoryNavigation } from "@/components/tools/category-navigation";
import { BreadcrumbNavigation } from "@/components/tools/breadcrumb-navigation";
import { toolsData } from "@/data/tools-data";
import { searchAndFilterTools, initialSearchState } from "@/lib/search-utils";
import { cn } from "@/lib/utils";
import type { Tool, SearchState } from "@/types/tools";
import {
  getAllCategories,
  getFeaturedCategories,
  getToolsByCategory,
  generateBreadcrumb,
  sortTools,
} from "@/lib/category-utils";

export default function ToolsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [searchState, setSearchState] =
    useState<SearchState>(initialSearchState);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "popularity" | "newest">(
    "name",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  // Get categories
  const allCategories = getAllCategories();
  const featuredCategories = getFeaturedCategories();
  const breadcrumb = generateBreadcrumb();

  // Filter and search tools
  const filteredTools = sortTools(
    searchAndFilterTools(toolsData, searchState),
    sortBy,
  );

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

  // Get category tools for display
  const getCategoryTools = (categoryName: string) => {
    return sortTools(getToolsByCategory(categoryName), sortBy);
  };

  // Tool card component
  const ToolCard = ({ tool }: { tool: Tool }) => {
    const getDifficultyColor = (difficulty: string) => {
      const colorMap: Record<string, string> = {
        beginner:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        intermediate:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      };
      return (
        colorMap[difficulty] ||
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      );
    };

    return (
      <Card
        className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group touch-manipulation active:scale-95"
        onClick={() => navigateToTool(tool.href)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon
                name={tool.icon as keyof typeof ICONS}
                className="text-white text-lg sm:text-xl"
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

          <CardTitle className="text-base sm:text-lg line-clamp-1">
            {tool.name}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm line-clamp-2">
            {tool.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-3">
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={getDifficultyColor(tool.difficulty)}>
                {tool.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {tool.processingType}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Category overview component
  const CategoryOverview = ({
    category,
    isFeatured = false,
  }: {
    category: any;
    isFeatured?: boolean;
  }) => {
    const categoryTools = getCategoryTools(category.name);
    const displayedTools = isFeatured
      ? categoryTools.slice(0, 4)
      : categoryTools.slice(0, 8);

    const getCategoryColor = (color: string) => {
      const colorMap: Record<string, string> = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        purple: "bg-purple-500",
        cyan: "bg-cyan-500",
        orange: "bg-orange-500",
        red: "bg-red-500",
      };
      return colorMap[color] || "bg-gray-500";
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Category Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white",
                getCategoryColor(category.color),
              )}
            >
              <Icon
                name={category.icon as keyof typeof ICONS}
                className="text-lg sm:text-xl"
              />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                {category.name}
                {category.featured && (
                  <Icon
                    name="STAR"
                    className="ml-2 text-yellow-500 text-base sm:text-lg"
                  />
                )}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {categoryTools.length} tools
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/tools/${category.slug}`)}
              className="touch-manipulation"
            >
              View All
              <Icon name="CHEVRON_RIGHT" className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {displayedTools.map((tool: Tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* Show More Link */}
        {categoryTools.length > displayedTools.length && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push(`/tools/${category.slug}`)}
              className="text-primary hover:text-primary/80 touch-manipulation"
              size="sm"
            >
              View all {categoryTools.length} tools in {category.name}
              <Icon name="ARROW_FORWARD" className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              {/* Logo and Site Name */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Icon
                    name="CODE"
                    className="text-white text-lg sm:text-2xl"
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Parsify.dev
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Developer Tools
                  </p>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Mobile Sort */}
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileSort(!showMobileSort)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Sort options"
                  >
                    <Icon name="SORT" className="text-xl" />
                  </Button>
                </div>

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

            {/* Mobile Sort Dropdown */}
            {showMobileSort && (
              <div className="md:hidden mb-3">
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {[
                    { key: "name", label: "Name" },
                    { key: "popularity", label: "Popular" },
                    { key: "newest", label: "New" },
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={sortBy === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSortBy(key as typeof sortBy);
                        setShowMobileSort(false);
                      }}
                      className="text-xs px-3 flex-1"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-3 sm:mb-4">
              <ToolSearch
                tools={toolsData}
                onSearch={handleSearch}
                onToolSelect={handleToolSelect}
                placeholder="Search tools..."
              />
            </div>

            {/* Breadcrumb */}
            <div className="hidden sm:block">
              <BreadcrumbNavigation items={breadcrumb} />
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center justify-between">
              {/* Sort Options */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { key: "name", label: "Name" },
                  { key: "popularity", label: "Popular" },
                  { key: "newest", label: "New" },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={sortBy === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(key as typeof sortBy)}
                    className="text-xs px-3"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Professional Developer Tools
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl sm:max-w-3xl mx-auto px-4">
              Comprehensive suite of browser-based developer tools for JSON
              processing, code execution, file conversion, and more. All tools
              run securely in your browser with complete privacy.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mt-4 sm:mt-6">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
                {toolsData.length}+ Tools
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
                100% Client-side
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
                No Data Tracking
              </Badge>
            </div>
          </div>

          {/* Active Filters */}
          <ActiveFilters
            filters={searchState}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            className="mb-6"
          />

          {/* Search and Filters Layout */}
          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
            {/* Mobile Filters Overlay */}
            {showFilters && (
              <div
                className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowFilters(false)}
              >
                <div
                  className="bg-white dark:bg-gray-800 w-80 h-full overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Filters</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(false)}
                      >
                        <Icon name="CLOSE" className="text-xl" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <ToolFilters
                      tools={toolsData}
                      filters={searchState}
                      onFiltersChange={handleFiltersChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar */}
            <div className="w-full xl:w-80 flex-shrink-0">
              <div className="sticky top-20 sm:top-24 space-y-6">
                {/* Mobile Category Navigation */}
                <div className="xl:hidden">
                  <CategoryNavigation showMobileMenu={true} />
                </div>

                {/* Desktop Filters */}
                <div className="hidden xl:block">
                  <ToolFilters
                    tools={toolsData}
                    filters={searchState}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>

                {/* Desktop Category Navigation */}
                <div className="hidden xl:block">
                  <CategoryNavigation />
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Search Results */}
              {searchState.query || hasActiveFilters ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      {searchState.query &&
                        `Results for "${searchState.query}"`}
                      {hasActiveFilters &&
                        !searchState.query &&
                        "Filtered Results"}
                      {searchState.query && hasActiveFilters && " (Filtered)"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredTools.length} of {toolsData.length} tools
                    </p>
                  </div>
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                        : "space-y-3",
                    )}
                  >
                    {filteredTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              ) : (
                /* Default Category View */
                <div className="space-y-8 sm:space-y-12">
                  {/* Featured Categories */}
                  {featuredCategories.length > 0 && (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                        <Icon
                          name="STAR"
                          className="mr-2 text-yellow-500 text-lg sm:text-xl"
                        />
                        Featured Categories
                      </h2>
                      <div className="space-y-6 sm:space-y-8">
                        {featuredCategories.map((category) => (
                          <CategoryOverview
                            key={category.id}
                            category={category}
                            isFeatured={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Categories */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      All Categories
                    </h2>
                    <div className="space-y-6 sm:space-y-8">
                      {allCategories.map((category) => (
                        <CategoryOverview
                          key={category.id}
                          category={category}
                          isFeatured={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-16">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Icon name="CODE" className="text-white text-sm" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Parsify.dev
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional developer tools that respect your privacy.
                </p>
              </div>

              {/* Tools */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Tools
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/tools"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      All Tools
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tools/json"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      JSON Tools
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tools/code"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Code Tools
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tools/file"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      File Tools
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Resources
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/docs"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="/api"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a
                      href="/examples"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Examples
                    </a>
                  </li>
                  <li>
                    <a
                      href="/blog"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Company
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/about"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                © 2024 Parsify.dev. All rights reserved. Built with ❤️ for
                developers.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
