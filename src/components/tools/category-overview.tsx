'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon, ICONS } from '@/components/ui/material-symbols';
import { cn } from '@/lib/utils';
import type { Tool, CategoryMetadata } from '@/types/tools';
import { getToolsByCategory, getToolsBySubcategory, sortTools } from '@/lib/category-utils';

interface CategoryOverviewProps {
	category: CategoryMetadata;
	activeSubcategory?: string;
	tools: Tool[];
	className?: string;
}

interface ToolCardProps {
	tool: Tool;
	onSelect: (tool: Tool) => void;
	viewMode: 'grid' | 'list';
}

const ToolCard = ({ tool, onSelect, viewMode }: ToolCardProps) => {
	const handleClick = () => {
		onSelect(tool);
	};

	const getDifficultyColor = (difficulty: string) => {
		const colorMap: Record<string, string> = {
			beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		};
		return colorMap[difficulty] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
	};

	const getStatusColor = (status: string) => {
		const colorMap: Record<string, string> = {
			stable: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			beta: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			experimental: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
		};
		return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
	};

	if (viewMode === 'list') {
		return (
			<Card
				className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:translate-x-1"
				onClick={handleClick}
			>
				<CardContent className="p-4">
					<div className="flex items-center space-x-4">
						{/* Tool Icon */}
						<div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
							<Icon name={tool.icon as keyof typeof ICONS} className="text-white text-xl" />
						</div>

						{/* Tool Info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center space-x-2 mb-1">
								<h3 className="font-semibold text-gray-900 dark:text-white truncate">{tool.name}</h3>
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

							<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{tool.description}</p>

							{/* Tags */}
							<div className="flex flex-wrap gap-1 mb-2">
								{tool.tags.slice(0, 4).map((tag) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag}
									</Badge>
								))}
								{tool.tags.length > 4 && (
									<Badge variant="outline" className="text-xs">
										+{tool.tags.length - 4}
									</Badge>
								)}
							</div>

							{/* Metadata */}
							<div className="flex items-center space-x-3 text-xs">
								<Badge className={getDifficultyColor(tool.difficulty)}>{tool.difficulty}</Badge>
								<Badge className={getStatusColor(tool.status)}>{tool.status}</Badge>
								<Badge variant="outline" className="text-xs">
									{tool.processingType}
								</Badge>
							</div>
						</div>

						{/* Arrow */}
						<div className="flex-shrink-0">
							<Icon name="CHEVRON_RIGHT" className="text-gray-400" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
			onClick={handleClick}
		>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between mb-2">
					<div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
						<Icon name={tool.icon as keyof typeof ICONS} className="text-white text-lg" />
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

				<CardTitle className="text-lg line-clamp-1">{tool.name}</CardTitle>
				<CardDescription className="text-sm line-clamp-2">{tool.description}</CardDescription>
			</CardHeader>

			<CardContent className="pt-0">
				{/* Tags */}
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

				{/* Metadata */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Badge className={getDifficultyColor(tool.difficulty)}>{tool.difficulty}</Badge>
						<Badge className={getStatusColor(tool.status)}>{tool.status}</Badge>
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400">{tool.processingType}</div>
				</div>
			</CardContent>
		</Card>
	);
};

export function CategoryOverview({ category, activeSubcategory, tools, className }: CategoryOverviewProps) {
	const router = useRouter();
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'newest'>('name');
	const [activeTab, setActiveTab] = useState(activeSubcategory || 'all');

	// Filter and sort tools
	const filteredTools = useMemo(() => {
		let filtered = tools;

		if (activeTab !== 'all' && category.subcategories?.[activeTab]) {
			const subcategoryToolIds = category.subcategories[activeTab].toolIds;
			filtered = tools.filter((tool) => subcategoryToolIds.includes(tool.id));
		}

		return sortTools(filtered, sortBy);
	}, [tools, activeTab, sortBy]);

	const handleToolSelect = (tool: Tool) => {
		router.push(tool.href);
	};

	const handleSubcategoryChange = (subcategory: string) => {
		setActiveTab(subcategory);
		if (subcategory !== 'all') {
			const subcategorySlug = subcategory.toLowerCase().replace(/\s+/g, '-');
			router.push(`/tools/${category.slug}/${subcategorySlug}`);
		} else {
			router.push(`/tools/${category.slug}`);
		}
	};

	const getCategoryColor = (color: string) => {
		const colorMap: Record<string, string> = {
			blue: 'bg-blue-500',
			green: 'bg-green-500',
			purple: 'bg-purple-500',
			cyan: 'bg-cyan-500',
			orange: 'bg-orange-500',
			red: 'bg-red-500',
		};
		return colorMap[color] || 'bg-gray-500';
	};

	const getToolStats = () => {
		const stats = {
			total: tools.length,
			popular: tools.filter((t) => t.isPopular).length,
			new: tools.filter((t) => t.isNew).length,
			beginner: tools.filter((t) => t.difficulty === 'beginner').length,
			intermediate: tools.filter((t) => t.difficulty === 'intermediate').length,
			advanced: tools.filter((t) => t.difficulty === 'advanced').length,
		};
		return stats;
	};

	const stats = getToolStats();

	return (
		<div className={cn('space-y-6', className)}>
			{/* Category Header */}
			<div className="text-center space-y-4">
				<div className="flex items-center justify-center space-x-4">
					<div
						className={cn(
							'w-16 h-16 rounded-2xl flex items-center justify-center text-white',
							getCategoryColor(category.color),
						)}
					>
						<Icon name={category.icon as keyof typeof ICONS} className="text-3xl" />
					</div>
					<div className="text-left">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400">{category.description}</p>
					</div>
				</div>

				{/* Stats */}
				<div className="flex flex-wrap justify-center gap-4">
					<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2">
						<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
						<div className="text-sm text-blue-600 dark:text-blue-400">Total Tools</div>
					</div>
					{stats.popular > 0 && (
						<div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-4 py-2">
							<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.popular}</div>
							<div className="text-sm text-orange-600 dark:text-orange-400">Popular</div>
						</div>
					)}
					{stats.new > 0 && (
						<div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.new}</div>
							<div className="text-sm text-green-600 dark:text-green-400">New</div>
						</div>
					)}
				</div>
			</div>

			{/* Controls */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center space-x-4">
					<span className="text-sm text-gray-600 dark:text-gray-400">{filteredTools.length} tools</span>

					{/* Sort Options */}
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
						<div className="flex space-x-1">
							{[
								{ key: 'name', label: 'Name' },
								{ key: 'popularity', label: 'Popular' },
								{ key: 'newest', label: 'New' },
							].map(({ key, label }) => (
								<Button
									key={key}
									variant={sortBy === key ? 'default' : 'outline'}
									size="sm"
									onClick={() => setSortBy(key as typeof sortBy)}
									className="text-xs"
								>
									{label}
								</Button>
							))}
						</div>
					</div>
				</div>

				{/* View Mode Toggle */}
				<div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
					<Button
						variant={viewMode === 'grid' ? 'default' : 'ghost'}
						size="sm"
						onClick={() => setViewMode('grid')}
						className="text-xs px-3"
					>
						<Icon name="GRID_VIEW" className="mr-1 h-3 w-3" />
						Grid
					</Button>
					<Button
						variant={viewMode === 'list' ? 'default' : 'ghost'}
						size="sm"
						onClick={() => setViewMode('list')}
						className="text-xs px-3"
					>
						<Icon name="VIEW_LIST" className="mr-1 h-3 w-3" />
						List
					</Button>
				</div>
			</div>

			{/* Subcategories */}
			{category.subcategories && Object.keys(category.subcategories).length > 0 && (
				<Tabs value={activeTab} onValueChange={handleSubcategoryChange}>
					<TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
						<TabsTrigger value="all" className="text-xs">
							All Tools ({stats.total})
						</TabsTrigger>
						{Object.entries(category.subcategories).map(([key, subcategory]) => (
							<TabsTrigger key={key} value={key} className="text-xs">
								{subcategory.name} ({subcategory.toolIds.length})
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value={activeTab} className="mt-6">
						{/* Tools Grid/List */}
						{filteredTools.length > 0 ? (
							<div
								className={cn(
									viewMode === 'grid'
										? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
										: 'space-y-3',
								)}
							>
								{filteredTools.map((tool) => (
									<ToolCard key={tool.id} tool={tool} onSelect={handleToolSelect} viewMode={viewMode} />
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<Icon name="SEARCH_OFF" className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tools found</h3>
								<p className="text-gray-600 dark:text-gray-400">
									Try adjusting your filters or browse other categories.
								</p>
							</div>
						)}
					</TabsContent>
				</Tabs>
			)}

			{/* Tools List (when no subcategories) */}
			{!category.subcategories && (
				<div
					className={cn(
						viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3',
					)}
				>
					{filteredTools.map((tool) => (
						<ToolCard key={tool.id} tool={tool} onSelect={handleToolSelect} viewMode={viewMode} />
					))}
				</div>
			)}
		</div>
	);
}
