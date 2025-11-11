'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	FileJson,
	Code,
	FileText,
	Public,
	Type,
	Shield,
	ChevronRight,
	Star,
	TrendingUp,
	Zap,
	CheckCircle,
	Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ToolCategory } from '@/types/tools';
import { toolsData, getToolsByCategory } from '@/data/tools-data';

interface CategoryExplorerProps {
	onCategoryExplore: (category: string) => void;
	exploredCategories: string[];
	targetCount?: number;
}

interface Category {
	name: string;
	description: string;
	icon: React.ReactNode;
	toolCount: number;
	color: string;
	highlightedTools: string[];
	slug: ToolCategory;
}

const categories: Category[] = [
	{
		name: 'JSON Processing Suite',
		description: 'Format, validate, convert, and analyze JSON data with powerful tools',
		icon: <FileJson className=\"w-6 h-6\" />,
		toolCount: 8,
		color: 'from-blue-500 to-blue-600',
		highlightedTools: ['JSON Formatter', 'JSON Validator', 'JSON Path Queries'],
		slug: 'JSON Processing'
	},
	{
		name: 'Code Processing Suite',
		description: 'Execute, format, minify, and analyze code in multiple languages',
		icon: <Code className=\"w-6 h-6\" />,
		toolCount: 6,
		color: 'from-green-500 to-green-600',
		highlightedTools: ['Code Executor', 'Code Formatter', 'Regex Tester'],
		slug: 'Code Execution'
	},
	{
		name: 'File Processing Suite',
		description: 'Convert, compress, and process various file formats efficiently',
		icon: <FileText className=\"w-6 h-6\" />,
		toolCount: 6,
		color: 'from-purple-500 to-purple-600',
		highlightedTools: ['File Converter', 'Text Processor', 'CSV Processor'],
		slug: 'File Processing'
	},
	{
		name: 'Network Utilities',
		description: 'Test APIs, analyze network data, and optimize web performance',
		icon: <Public className=\"w-6 h-6\" />,
		toolCount: 3,
		color: 'from-orange-500 to-orange-600',
		highlightedTools: ['HTTP Client', 'IP Lookup', 'Meta Tag Generator'],
		slug: 'Network Utilities'
	},
	{
		name: 'Text Processing Suite',
		description: 'Encode, format, compare, and generate text for various purposes',
		icon: <Type className=\"w-6 h-6\" />,
		toolCount: 4,
		color: 'from-pink-500 to-pink-600',
		highlightedTools: ['Text Encoder', 'Text Formatter', 'Text Comparator'],
		slug: 'Text Processing'
	},
	{
		name: 'Security & Encryption Suite',
		description: 'Generate hashes, create secure passwords, and encrypt sensitive data',
		icon: <Shield className=\"w-6 h-6\" />,
		toolCount: 4,
		color: 'from-red-500 to-red-600',
		highlightedTools: ['Hash Generator', 'Password Generator', 'File Encryptor'],
		slug: 'Security & Encryption'
	}
];

export function CategoryExplorer({
	onCategoryExplore,
	exploredCategories,
	targetCount = 3
}: CategoryExplorerProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
	const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
	const [explored, setExplored] = useState<Set<string>>(new Set(exploredCategories));

	const progress = (explored.size / targetCount) * 100;
	const filteredCategories = categories.filter(category =>
		category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		category.description.toLowerCase().includes(searchQuery.toLowerCase())
	);

	useEffect(() => {
		setExplored(new Set(exploredCategories));
	}, [exploredCategories]);

	const handleCategoryClick = (category: Category) => {
		if (!explored.has(category.slug)) {
			const newExplored = new Set(explored).add(category.slug);
			setExplored(newExplored);
			onCategoryExplore(category.slug);
		}
		setSelectedCategory(category);
	};

	const handleExploreCategory = (category: Category) => {
		if (!explored.has(category.slug)) {
			handleCategoryClick(category);
		}
	};

	const getToolsInCategory = (categorySlug: string) => {
		return getToolsByCategory(categorySlug);
	};

	return (
		<div className=\"space-y-6 max-w-6xl mx-auto\">
			{/* Header */}
			<div className=\"text-center space-y-4\">
				<h2 className=\"text-2xl font-bold text-gray-900 dark:text-white\">
					Explore Tool Categories
				</h2>
				<p className=\"text-gray-600 dark:text-gray-400 max-w-2xl mx-auto\">
					Discover our 6 main tool categories. Click on any category to explore its tools and features.
				</p>

				{/* Progress Indicator */}
				<div className=\"bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-md mx-auto\">
					<div className=\"flex items-center justify-between mb-2\">
						<span className=\"text-sm font-medium text-gray-700 dark:text-gray-300\">
							Categories Explored
						</span>
						<span className=\"text-sm font-bold text-gray-900 dark:text-white\">
							{explored.size} / {targetCount}
						</span>
					</div>
					<div className=\"w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2\">
						<motion.div
							className=\"bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full\"
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.5 }}
						/>
					</div>
					<p className=\"text-xs text-gray-500 dark:text-gray-400\">
						{progress < 100
							? `Explore ${targetCount - explored.size} more ${targetCount - explored.size === 1 ? 'category' : 'categories'} to continue`
							: 'Great! You can continue to the next step.'
						}
					</p>
				</div>
			</div>

			{/* Search */}
			<div className=\"max-w-md mx-auto\">
				<div className=\"relative\">
					<Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4\" />
					<Input
						type=\"text\"
						placeholder=\"Search categories...\"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className=\"pl-10\"
					/>
				</div>
			</div>

			{/* Categories Grid */}
			<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
				{filteredCategories.map((category, index) => {
					const isExplored = explored.has(category.slug);
					const isHovered = hoveredCategory === category.slug;

					return (
						<motion.div
							key={category.slug}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							onMouseEnter={() => setHoveredCategory(category.slug)}
							onMouseLeave={() => setHoveredCategory(null)}
						>
							<Card
								className={`cursor-pointer transition-all duration-300 h-full ${
									isExplored
										? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
										: 'hover:shadow-lg hover:scale-105'
								}`}
								onClick={() => handleCategoryClick(category)}
							>
								<CardHeader className=\"pb-3\">
									<div className=\"flex items-start justify-between\">
										<div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
											{category.icon}
										</div>
										{isExplored ? (
											<CheckCircle className=\"w-5 h-5 text-green-600\" />
										) : (
											<Eye className=\"w-5 h-5 text-gray-400\" />
										)}
									</div>
									<CardTitle className=\"text-lg leading-tight\">{category.name}</CardTitle>
								</CardHeader>
								<CardContent className=\"space-y-3\">
									<p className=\"text-sm text-gray-600 dark:text-gray-400 leading-relaxed\">
										{category.description}
									</p>

									<div className=\"flex items-center justify-between text-xs text-gray-500 dark:text-gray-400\">
										<span>{category.toolCount} tools</span>
										{category.highlightedTools.length > 0 && (
											<span>Popular: {category.highlightedTools[0]}</span>
										)}
									</div>

									{!isExplored && (
										<Button
											variant=\"outline\"
											size=\"sm\"
											className=\"w-full mt-3\"
											onClick={(e) => {
												e.stopPropagation();
												handleExploreCategory(category);
											}}
										>
											Explore Category
											<ChevronRight className=\"w-4 h-4 ml-1\" />
										</Button>
									)}

									{isExplored && (
										<div className=\"flex items-center justify-center text-green-600 text-sm font-medium mt-3\">
											<CheckCircle className=\"w-4 h-4 mr-1\" />
											Explored
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					);
				})}
			</div>

			{/* Category Detail Modal */}
			<AnimatePresence>
				{selectedCategory && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className=\"fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50\"
						onClick={() => setSelectedCategory(null)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className=\"bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden\"
							onClick={(e) => e.stopPropagation()}
						>
							<div className=\"p-6 border-b border-gray-200 dark:border-gray-700\">
								<div className=\"flex items-center justify-between\">
									<div className=\"flex items-center gap-3\">
										<div className={`p-3 rounded-lg bg-gradient-to-br ${selectedCategory.color} text-white`}>
											{selectedCategory.icon}
										</div>
										<div>
											<h3 className=\"text-xl font-bold text-gray-900 dark:text-white\">
												{selectedCategory.name}
											</h3>
											<p className=\"text-gray-600 dark:text-gray-400 mt-1\">
												{selectedCategory.description}
											</p>
										</div>
									</div>
									<Button
										variant=\"ghost\"
										size=\"sm\"
										onClick={() => setSelectedCategory(null)}
									>
										×
									</Button>
								</div>
							</div>

							<div className=\"p-6 overflow-y-auto max-h-[50vh]\">
								<h4 className=\"font-semibold text-gray-900 dark:text-white mb-4\">
									Tools in this category ({selectedCategory.toolCount})
								</h4>
								<div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
									{getToolsInCategory(selectedCategory.slug).map((tool) => (
										<Card key={tool.id} className=\"p-4\">
											<div className=\"flex items-start justify-between mb-2\">
												<h5 className=\"font-medium text-gray-900 dark:text-white\">
													{tool.name}
												</h5>
												<div className=\"flex gap-1\">
													{tool.isPopular && (
														<Badge variant=\"secondary\" className=\"text-xs\">
															<Star className=\"w-3 h-3 mr-1\" />
															Popular
														</Badge>
													)}
													{tool.isNew && (
														<Badge variant=\"outline\" className=\"text-xs\">
															<TrendingUp className=\"w-3 h-3 mr-1\" />
															New
														</Badge>
													)}
												</div>
											</div>
											<p className=\"text-sm text-gray-600 dark:text-gray-400 mb-2\">
												{tool.description}
											</p>
											<div className=\"flex flex-wrap gap-1\">
												{tool.tags.slice(0, 3).map((tag) => (
													<Badge key={tag} variant=\"outline\" className=\"text-xs\">
														{tag}
													</Badge>
												))}
											</div>
										</Card>
									))}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Completion Message */}
			{progress >= 100 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className=\"text-center py-6\"
				>
					<div className=\"w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4\">
						<CheckCircle className=\"w-8 h-8 text-green-600\" />
					</div>
					<h3 className=\"text-xl font-semibold text-green-700 dark:text-green-300 mb-2\">
						Excellent Exploration!
					</h3>
					<p className=\"text-gray-600 dark:text-gray-400\">
						You've explored {targetCount} categories. Click Next to continue your onboarding journey.
					</p>
				</motion.div>
			)}
		</div>
	);
}
