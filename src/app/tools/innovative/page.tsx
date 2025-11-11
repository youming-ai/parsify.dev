'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon, ICONS } from '@/components/ui/material-symbols';
import { ToolSearch, SearchResults } from '@/components/tools/tool-search';
import { ToolFilters, ActiveFilters } from '@/components/tools/tool-filters';
import { toolsData } from '@/data/tools-data';
import { searchAndFilterTools, initialSearchState } from '@/lib/search-utils';
import { cn } from '@/lib/utils';
import type { Tool, SearchState } from '@/types/tools';
import { CategoryNavigation, CategoryOverview } from '@/components/tools/category-navigation';
import { BreadcrumbNavigation } from '@/components/tools/breadcrumb-navigation';
import {
	CATEGORIES_METADATA,
	getAllCategories,
	getFeaturedCategories,
	getCategoryBySlug,
	generateBreadcrumb,
} from '@/lib/category-utils';

export default function InnovativeToolsPage() {
	const router = useRouter();
	const [darkMode, setDarkMode] = useState(false);
	const [searchState, setSearchState] = useState<SearchState>(initialSearchState);
	const [showFilters, setShowFilters] = useState(false);

	// Get categories
	const allCategories = getAllCategories();
	const featuredCategories = getFeaturedCategories();
	const breadcrumb = generateBreadcrumb();

	// Check system dark mode preference
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isDarkMode =
				localStorage.getItem('darkMode') === 'true' ||
				(!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
			setDarkMode(isDarkMode);
			if (isDarkMode) {
				document.documentElement.classList.add('dark');
			}
		}
	}, []);

	// Toggle dark mode
	const toggleDarkMode = () => {
		const newDarkMode = !darkMode;
		setDarkMode(newDarkMode);
		if (typeof window !== 'undefined') {
			localStorage.setItem('darkMode', newDarkMode.toString());
			if (newDarkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	};

	// Filter and search tools
	const filteredTools = useMemo(() => {
		return searchAndFilterTools(toolsData, searchState);
	}, [searchState]);

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
	const handleRemoveFilter = (filterType: keyof SearchState, value?: string) => {
		setSearchState((prev) => {
			const newState = { ...prev };

			if (value && Array.isArray(newState[filterType])) {
				newState[filterType] = (newState[filterType] as string[]).filter((item) => item !== value) as any;
			} else {
				(newState as any)[filterType] = filterType === 'isNew' || filterType === 'isPopular' ? null : [];
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
			if (key === 'query') return value !== '';
			if (key === 'isNew' || key === 'isPopular') return value !== null;
			return Array.isArray(value) && value.length > 0;
		});
	}, [searchState]);

	return (
		<div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
			<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							{/* Logo and Site Name */}
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
									<Icon name="CODE" className="text-white text-2xl" />
								</div>
								<div>
									<h1 className="text-xl font-bold text-gray-900 dark:text-white">Parsify.dev</h1>
									<p className="text-xs text-gray-500 dark:text-gray-400">Developer Tools</p>
								</div>
							</div>

							{/* Search Bar */}
							<div className="flex-1 max-w-md mx-8">
								<ToolSearch
									tools={toolsData}
									onSearch={handleSearch}
									onToolSelect={handleToolSelect}
									placeholder="Search tools..."
								/>
							</div>

							{/* Filter Toggle */}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className={cn(
									'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-2',
									hasActiveFilters && 'text-blue-600 dark:text-blue-400',
								)}
								aria-label="Toggle filters"
							>
								<Icon name="FILTER_LIST" className="text-xl" />
								{hasActiveFilters && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{
											Object.keys(searchState).filter((key) => {
												const value = searchState[key as keyof SearchState];
												if (key === 'query') return value !== '';
												if (key === 'isNew' || key === 'isPopular') return value !== null;
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
								<Icon name={darkMode ? 'LIGHT_MODE' : 'DARK_MODE'} className="text-xl" />
							</Button>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="container mx-auto px-4 py-8">
					{/* Title and Description */}
					<div className="text-center mb-12">
						<h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Professional Developer Tools</h2>
						<p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
							Comprehensive suite of browser-based developer tools for JSON processing, code execution, file conversion,
							and more. All tools run securely in your browser with complete privacy.
						</p>
						<div className="flex justify-center items-center space-x-4 mt-6">
							<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
								{toolsData.length}+ Tools
							</Badge>
							<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
								100% Client-side
							</Badge>
							<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
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
					<div className="flex flex-col lg:flex-row gap-8">
						{/* Filters Sidebar */}
						{showFilters && (
							<div className="lg:w-80 flex-shrink-0">
								<div className="sticky top-4">
									<ToolFilters tools={toolsData} filters={searchState} onFiltersChange={handleFiltersChange} />
								</div>
							</div>
						)}

						{/* Main Content Area */}
						<div className="flex-1">
							{/* Search Results */}
							{searchState.query || hasActiveFilters ? (
								<div>
									<div className="flex items-center justify-between mb-6">
										<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
											{searchState.query && `Results for "${searchState.query}"`}
											{hasActiveFilters && !searchState.query && 'Filtered Results'}
											{searchState.query && hasActiveFilters && ' (Filtered)'}
										</h3>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{filteredTools.length} of {toolsData.length} tools
										</p>
									</div>
									<SearchResults tools={filteredTools} query={searchState.query} onToolSelect={handleToolSelect} />
								</div>
							) : (
								/* Default Category View */
								<div className="space-y-12">
									{Object.entries(toolCategories).map(([categoryName, categoryData]) => (
										<div key={categoryName}>
											{/* Category Header */}
											<div className="flex items-center space-x-3 mb-6">
												<div
													className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryData.color === 'blue' ? 'bg-blue-500' : categoryData.color === 'green' ? 'bg-green-500' : categoryData.color === 'purple' ? 'bg-purple-500' : categoryData.color === 'cyan' ? 'bg-cyan-500' : categoryData.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`}
												>
													<Icon name={categoryData.icon as keyof typeof ICONS} className="text-white text-xl" />
												</div>
												<div>
													<h3 className="text-2xl font-bold text-gray-900 dark:text-white">{categoryName}</h3>
													<p className="text-gray-600 dark:text-gray-300">{categoryData.description}</p>
												</div>
											</div>

											{/* Tools Grid */}
											{'tools' in categoryData ? (
												// Regular category with tools
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
													{getToolsByIds(categoryData.tools as string[]).map((tool) => (
														<Card
															key={tool.id}
															className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
															onClick={() => navigateToTool(tool.href)}
														>
															<CardHeader className="pb-3">
																<div className="flex items-center space-x-3">
																	<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
																		<Icon name={tool.icon as keyof typeof ICONS} className="text-white text-sm" />
																	</div>
																	<CardTitle className="text-sm">{tool.name}</CardTitle>
																</div>
															</CardHeader>
															<CardContent className="pt-0">
																<CardDescription className="text-xs">{tool.description}</CardDescription>
																<div className="flex flex-wrap gap-1 mt-2">
																	{tool.tags.slice(0, 2).map((tag) => (
																		<Badge key={tag} variant="secondary" className="text-xs">
																			{tag}
																		</Badge>
																	))}
																</div>
															</CardContent>
														</Card>
													))}
												</div>
											) : (
												// Category with subcategories
												<div className="space-y-8">
													{Object.entries(categoryData.subcategories).map(([subcatName, subcatTools]) => (
														<div key={subcatName}>
															<h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
																{subcatName}
															</h4>
															<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
																{getToolsByIds(subcatTools as string[]).map((tool) => (
																	<Card
																		key={tool.id}
																		className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
																		onClick={() => navigateToTool(tool.href)}
																	>
																		<CardHeader className="pb-3">
																			<div className="flex items-center space-x-3">
																				<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
																					<Icon name={tool.icon as keyof typeof ICONS} className="text-white text-sm" />
																				</div>
																				<CardTitle className="text-sm">{tool.name}</CardTitle>
																			</div>
																		</CardHeader>
																		<CardContent className="pt-0">
																			<CardDescription className="text-xs">{tool.description}</CardDescription>
																			<div className="flex flex-wrap gap-1 mt-2">
																				{tool.tags.slice(0, 2).map((tag) => (
																					<Badge key={tag} variant="secondary" className="text-xs">
																						{tag}
																					</Badge>
																				))}
																			</div>
																		</CardContent>
																	</Card>
																))}
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</main>

				{/* Footer */}
				<footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
					<div className="container mx-auto px-4 py-8">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
							{/* Brand */}
							<div>
								<div className="flex items-center space-x-2 mb-4">
									<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
										<Icon name="CODE" className="text-white text-sm" />
									</div>
									<span className="font-bold text-gray-900 dark:text-white">Parsify.dev</span>
								</div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Professional developer tools that respect your privacy.
								</p>
							</div>

							{/* Tools */}
							<div>
								<h4 className="font-semibold text-gray-900 dark:text-white mb-4">Tools</h4>
								<ul className="space-y-2">
									<li>
										<a href="/tools" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											All Tools
										</a>
									</li>
									<li>
										<a
											href="/tools/json/formatter"
											className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
										>
											JSON Tools
										</a>
									</li>
									<li>
										<a
											href="/tools/code/executor"
											className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
										>
											Code Tools
										</a>
									</li>
									<li>
										<a
											href="/tools/file/converter"
											className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
										>
											File Tools
										</a>
									</li>
								</ul>
							</div>

							{/* Resources */}
							<div>
								<h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h4>
								<ul className="space-y-2">
									<li>
										<a href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											Documentation
										</a>
									</li>
									<li>
										<a href="/api" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											API Reference
										</a>
									</li>
									<li>
										<a href="/examples" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											Examples
										</a>
									</li>
									<li>
										<a href="/blog" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											Blog
										</a>
									</li>
								</ul>
							</div>

							{/* Company */}
							<div>
								<h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
								<ul className="space-y-2">
									<li>
										<a href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											About
										</a>
									</li>
									<li>
										<a href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											Privacy
										</a>
									</li>
									<li>
										<a href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											Terms
										</a>
									</li>
									<li>
										<a href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500">
											Contact
										</a>
									</li>
								</ul>
							</div>
						</div>

						<div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
							<p className="text-sm text-gray-600 dark:text-gray-400">
								© 2024 Parsify.dev. All rights reserved. Built with ❤️ for developers.
							</p>
						</div>
					</div>
				</footer>
			</div>
		</div>
	);
}
