'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { categories, toolsData } from '@/data/tools-data';
import type { Tool } from '@/types/tools';
import {
	ChevronRight,
	Clock,
	Code,
	Cpu,
	Database,
	FileJson,
	FileText,
	Filter,
	Globe,
	Hash,
	Lock,
	Play,
	Search,
	Settings,
	Shield,
	Star,
	Terminal,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { useMemo, useState } from 'react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	FileJson,
	Terminal,
	Code,
	FileText,
	Hash,
	Zap,
	Settings,
	Shield,
	Play,
	Cpu,
	Database,
	Lock,
	Globe,
	Clock,
	Star,
	ChevronRight,
	Search,
	Filter,
};

export default function ToolsPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(false);

	// Filter tools based on search, category, and tags
	const filteredTools = useMemo(() => {
		return toolsData.filter((tool) => {
			// Search filter
			const matchesSearch =
				searchQuery === '' ||
				tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

			// Category filter
			const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;

			// Tags filter
			const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => tool.tags.includes(tag));

			return matchesSearch && matchesCategory && matchesTags;
		});
	}, [searchQuery, selectedCategory, selectedTags]);

	// Get all unique tags
	const allTags = useMemo(() => {
		return Array.from(new Set(toolsData.flatMap((tool) => tool.tags))).sort();
	}, []);

	// Toggle tag selection
	const toggleTag = (tag: string) => {
		setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
	};

	const getDifficultyColor = (difficulty: Tool['difficulty']) => {
		switch (difficulty) {
			case 'beginner':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'advanced':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
		}
	};

	const getStatusColor = (status: Tool['status']) => {
		switch (status) {
			case 'stable':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'beta':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
			case 'experimental':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
		}
	};

	const getStatusIcon = (processingType?: Tool['processingType']) => {
		switch (processingType) {
			case 'client-side':
				return <Clock className="h-3 w-3" />;
			case 'server-side':
				return <Zap className="h-3 w-3" />;
			case 'hybrid':
				return <Settings className="h-3 w-3" />;
			default:
				return <Clock className="h-3 w-3" />;
		}
	};

	return (
		<MainLayout>
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="mb-4 font-bold text-4xl text-gray-900 dark:text-white">Developer Tools</h1>
					<p className="max-w-3xl text-gray-600 text-lg dark:text-gray-300">
						Professional tools for JSON processing, code execution, file transformation, and more. All tools run
						securely in your browser with no data sent to servers.
					</p>
				</div>

				{/* Search and Filters */}
				<div className="mb-8 space-y-4">
					{/* Search Bar */}
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 transform text-gray-400" />
						<Input
							type="text"
							placeholder="Search tools by name, description, or tags..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="py-3 pr-4 pl-10 text-lg"
						/>
					</div>

					{/* Filter Controls */}
					<div className="flex flex-wrap items-center gap-4">
						{/* Category Filter */}
						<div className="flex flex-wrap gap-2">
							<Button
								variant={selectedCategory === 'all' ? 'default' : 'outline'}
								size="sm"
								onClick={() => setSelectedCategory('all')}
							>
								All Categories
							</Button>
							{categories.map((category) => (
								<Button
									key={category}
									variant={selectedCategory === category ? 'default' : 'outline'}
									size="sm"
									onClick={() => setSelectedCategory(category)}
								>
									{category}
								</Button>
							))}
						</div>

						{/* Toggle Filters */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilters(!showFilters)}
							className="flex items-center gap-2"
						>
							<Filter className="h-4 w-4" />
							Filters
							{selectedTags.length > 0 && (
								<Badge variant="secondary" className="ml-1">
									{selectedTags.length}
								</Badge>
							)}
						</Button>
					</div>

					{/* Tag Filters */}
					{showFilters && (
						<div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
							<h3 className="mb-3 font-medium text-gray-700 text-sm dark:text-gray-300">Filter by Tags</h3>
							<div className="flex flex-wrap gap-2">
								{allTags.map((tag) => (
									<Button
										key={tag}
										variant={selectedTags.includes(tag) ? 'default' : 'outline'}
										size="sm"
										onClick={() => toggleTag(tag)}
										className="text-xs"
									>
										{tag}
									</Button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Results Summary */}
				<div className="mb-6 flex items-center justify-between">
					<p className="text-gray-600 dark:text-gray-300">
						Showing {filteredTools.length} of {toolsData.length} tools
					</p>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSearchQuery('');
								setSelectedCategory('all');
								setSelectedTags([]);
							}}
						>
							Clear all filters
						</Button>
					)}
				</div>

				{/* Tools Grid */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredTools.map((tool) => (
						<Card
							key={tool.id}
							className="group border-gray-200 transition-all duration-300 hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:hover:border-blue-600"
						>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center space-x-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
											{iconMap[tool.icon] &&
												React.createElement(iconMap[tool.icon], {
													className: 'w-5 h-5 text-blue-600 dark:text-blue-300',
												})}
										</div>
										<div className="flex-1">
											<CardTitle className="flex items-center gap-2 text-lg transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
												{tool.name}
												{tool.isNew && (
													<Badge variant="secondary" className="text-xs">
														New
													</Badge>
												)}
												{tool.isPopular && (
													<Badge
														variant="default"
														className="bg-yellow-100 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
													>
														<Star className="mr-1 h-3 w-3" />
														Popular
													</Badge>
												)}
											</CardTitle>
											<div className="mt-1 flex items-center gap-2">
												<Badge className={`text-xs ${getStatusColor(tool.status)}`}>{tool.status}</Badge>
												<div className="flex items-center text-gray-500 text-xs dark:text-gray-400">
													{getStatusIcon(tool.processingType)}
													<span className="ml-1">{tool.processingType?.replace('-', ' ')}</span>
												</div>
												{tool.security === 'secure-sandbox' && (
													<div className="group relative">
														<Shield className="h-3 w-3 text-green-500" />
														<div className="-translate-x-1/2 absolute bottom-full left-1/2 mb-2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
															Secure Sandbox
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
								<CardDescription className="mt-3 text-sm">{tool.description}</CardDescription>
							</CardHeader>
							<CardContent>
								{/* Features */}
								<div className="mb-4">
									<h4 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">Features</h4>
									<div className="flex flex-wrap gap-1">
										{tool.features.slice(0, 3).map((feature) => (
											<Badge key={feature} variant="outline" className="text-xs">
												{feature}
											</Badge>
										))}
										{tool.features.length > 3 && (
											<Badge variant="outline" className="text-xs">
												+{tool.features.length - 3} more
											</Badge>
										)}
									</div>
								</div>

								{/* Tags */}
								<div className="mb-4">
									<div className="flex flex-wrap gap-1">
										{tool.tags.slice(0, 4).map((tag) => (
											<span
												key={tag}
												className="rounded bg-gray-100 px-2 py-1 text-gray-500 text-xs dark:bg-gray-700 dark:text-gray-400"
											>
												{tag}
											</span>
										))}
									</div>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-between">
									<Badge className={`text-xs ${getDifficultyColor(tool.difficulty)}`}>{tool.difficulty}</Badge>
									<Link href={tool.href}>
										<Button size="sm" className="group">
											Try Tool
											<ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* No Results */}
				{filteredTools.length === 0 && (
					<div className="py-12 text-center">
						<div className="mb-4 text-gray-400">
							<Search className="mx-auto h-12 w-12" />
						</div>
						<h3 className="mb-2 font-medium text-gray-900 text-lg dark:text-white">No tools found</h3>
						<p className="mb-4 text-gray-600 dark:text-gray-300">
							Try adjusting your search or filters to find what you're looking for.
						</p>
						<Button
							variant="outline"
							onClick={() => {
								setSearchQuery('');
								setSelectedCategory('all');
								setSelectedTags([]);
							}}
						>
							Clear all filters
						</Button>
					</div>
				)}
			</div>
		</MainLayout>
	);
}
