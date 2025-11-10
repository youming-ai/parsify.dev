'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/material-symbols';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CategoryInfo {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	count: number;
	trending?: boolean;
	new?: boolean;
	featured?: boolean;
}

interface CategoryFilterProps {
	categories: CategoryInfo[];
	selectedCategory: string;
	onCategoryChange: (category: string) => void;
	className?: string;
	variant?: 'buttons' | 'cards' | 'tabs';
	showCounts?: boolean;
	showDescriptions?: boolean;
	groupBy?: string;
}

const CategoryFilter = React.forwardRef<HTMLDivElement, CategoryFilterProps>(
	(
		{
			categories,
			selectedCategory,
			onCategoryChange,
			className,
			variant = 'buttons',
			showCounts = true,
			showDescriptions = false,
			groupBy,
		},
		ref,
	) => {
		// Group categories if groupBy is provided
		const groupedCategories = React.useMemo(() => {
			if (!groupBy) return { all: categories };

			return categories.reduce(
				(groups, category) => {
					const group = (category[groupBy as keyof CategoryInfo] as string) || 'other';
					if (!groups[group]) groups[group] = [];
					groups[group].push(category);
					return groups;
				},
				{} as Record<string, CategoryInfo[]>,
			);
		}, [categories, groupBy]);

		// Get color classes for categories
		const getCategoryColorClass = (color: string, isSelected: boolean) => {
			const colorMap = {
				green: isSelected
					? 'bg-green-500 text-white border-green-500'
					: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50 dark:hover:bg-green-900/30',
				blue: isSelected
					? 'bg-blue-500 text-white border-blue-500'
					: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/50 dark:hover:bg-blue-900/30',
				orange: isSelected
					? 'bg-orange-500 text-white border-orange-500'
					: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/50 dark:hover:bg-orange-900/30',
				purple: isSelected
					? 'bg-purple-500 text-white border-purple-500'
					: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/50 dark:hover:bg-purple-900/30',
				gray: isSelected
					? 'bg-gray-500 text-white border-gray-500'
					: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700/50 dark:hover:bg-gray-900/30',
				cyan: isSelected
					? 'bg-cyan-500 text-white border-cyan-500'
					: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700/50 dark:hover:bg-cyan-900/30',
				indigo: isSelected
					? 'bg-indigo-500 text-white border-indigo-500'
					: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700/50 dark:hover:bg-indigo-900/30',
				red: isSelected
					? 'bg-red-500 text-white border-red-500'
					: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/50 dark:hover:bg-red-900/30',
			};

			return colorMap[color as keyof typeof colorMap] || colorMap.blue;
		};

		// Render button variant
		const renderButtons = () => (
			<div ref={ref} className={cn('flex flex-wrap gap-2', className)}>
				<Button
					variant={selectedCategory === 'all' ? 'default' : 'outline'}
					size="sm"
					onClick={() => onCategoryChange('all')}
					className="rounded-full transition-all duration-200"
				>
					All Tools
					<Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
						{categories.reduce((sum, cat) => sum + cat.count, 0)}
					</Badge>
				</Button>

				{categories.map((category) => {
					const isSelected = selectedCategory === category.id;
					return (
						<TooltipProvider key={category.id}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant={isSelected ? 'default' : 'outline'}
										size="sm"
										onClick={() => onCategoryChange(category.id)}
										className={cn(
											'rounded-full transition-all duration-200 relative group',
											isSelected ? 'shadow-md' : 'hover:shadow-sm border-2',
										)}
									>
										<Icon name={category.icon as keyof typeof ICONS} className="h-4 w-4 mr-1" />
										{category.name}

										{showCounts && (
											<Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
												{category.count}
											</Badge>
										)}

										{/* Indicators */}
										<div className="absolute -top-1 -right-1 flex gap-1">
											{category.trending && (
												<Badge className="px-1 py-0 text-xs bg-green-500 text-white">
													<Icon name="TRENDING_UP" className="h-3 w-3" />
												</Badge>
											)}
											{category.new && <Badge className="px-1 py-0 text-xs bg-blue-500 text-white">NEW</Badge>}
											{category.featured && <Icon name="STAR" className="h-3 w-3 text-yellow-500" />}
										</div>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<div className="max-w-xs">
										<p className="font-medium">{category.name}</p>
										<p className="text-sm text-gray-600 dark:text-gray-300">{category.description}</p>
										<p className="text-xs text-gray-500 mt-1">{category.count} tools</p>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					);
				})}
			</div>
		);

		// Render cards variant
		const renderCards = () => (
			<div ref={ref} className={cn('grid gap-4', className)}>
				{/* All tools card */}
				<Card
					className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
						selectedCategory === 'all' ? 'ring-2 ring-primary shadow-md' : ''
					}`}
					onClick={() => onCategoryChange('all')}
				>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
									<Icon name="APPS" className="h-5 w-5" />
								</div>
								<div>
									<h3 className="font-semibold">All Tools</h3>
									<p className="text-sm text-gray-600 dark:text-gray-300">Browse all available tools</p>
								</div>
							</div>
							<Badge variant="outline" className="ml-auto">
								{categories.reduce((sum, cat) => sum + cat.count, 0)} tools
							</Badge>
						</div>
					</CardContent>
				</Card>

				{categories.map((category) => {
					const isSelected = selectedCategory === category.id;
					return (
						<Card
							key={category.id}
							className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
								isSelected ? 'ring-2 ring-primary shadow-md' : ''
							}`}
							onClick={() => onCategoryChange(category.id)}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3 flex-1">
										<div
											className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getCategoryColorClass(category.color, true)}`}
										>
											<Icon name={category.icon as keyof typeof ICONS} className="h-5 w-5" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="font-semibold">{category.name}</h3>
												{category.trending && (
													<Badge className="px-1.5 py-0 text-xs bg-green-500 text-white">
														<Icon name="TRENDING_UP" className="h-3 w-3 mr-1" />
														Trending
													</Badge>
												)}
												{category.new && <Badge className="px-1.5 py-0 text-xs bg-blue-500 text-white">New</Badge>}
											</div>
											{showDescriptions && (
												<p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{category.description}</p>
											)}
											<div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
												<span>{category.count} tools</span>
												{category.featured && (
													<span className="flex items-center gap-1">
														<Icon name="STAR" className="h-3 w-3 text-yellow-500" />
														Featured
													</span>
												)}
											</div>
										</div>
									</div>
									<Icon name="ARROW_RIGHT" className="h-5 w-5 text-gray-400 mt-1" />
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		);

		// Render tabs variant
		const renderTabs = () => (
			<div ref={ref} className={cn('flex flex-col gap-4', className)}>
				<div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
					<button
						className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
							selectedCategory === 'all'
								? 'border-primary text-primary'
								: 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
						}`}
						onClick={() => onCategoryChange('all')}
					>
						All Tools
					</button>

					{categories.map((category) => (
						<button
							key={category.id}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
								selectedCategory === category.id
									? 'border-primary text-primary'
									: 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
							}`}
							onClick={() => onCategoryChange(category.id)}
						>
							<Icon name={category.icon as keyof typeof ICONS} className="h-4 w-4" />
							{category.name}
							{category.trending && <Icon name="TRENDING_UP" className="h-3 w-3 text-green-500" />}
						</button>
					))}
				</div>
			</div>
		);

		// Render grouped categories
		const renderGrouped = () => (
			<div ref={ref} className={cn('space-y-6', className)}>
				{Object.entries(groupedCategories).map(([groupName, groupCategories]) => (
					<div key={groupName}>
						<h3 className="text-lg font-semibold mb-3 capitalize">{groupName}</h3>
						{renderButtons()}
					</div>
				))}
			</div>
		);

		// Render based on variant
		if (groupBy && Object.keys(groupedCategories).length > 1) {
			return renderGrouped();
		}

		switch (variant) {
			case 'cards':
				return renderCards();
			case 'tabs':
				return renderTabs();
			default:
				return renderButtons();
		}
	},
);
CategoryFilter.displayName = 'CategoryFilter';

export { CategoryFilter };
export type { CategoryInfo };
