'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Star,
	TrendingUp,
	Zap,
	Target,
	Clock,
	Users,
	ChevronRight,
	Bookmark,
	ExternalLink,
	Info,
	Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ToolRecommendation } from '@/types/onboarding';
import { toolsData, getToolById } from '@/data/tools-data';

interface ToolRecommendationListProps {
	recommendations: ToolRecommendation[];
	maxItems?: number;
	onTryTool?: (toolId: string) => void;
	onBookmarkTool?: (toolId: string) => void;
}

export function ToolRecommendationList({
	recommendations,
	maxItems = 6,
	onTryTool,
	onBookmarkTool
}: ToolRecommendationListProps) {
	const [bookmarkedTools, setBookmarkedTools] = useState<Set<string>>(new Set());
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

	const filteredRecommendations = recommendations
		.filter(rec => filterPriority === 'all' || rec.priority === filterPriority)
		.slice(0, maxItems);

	useEffect(() => {
		// Load bookmarked tools from localStorage
		const saved = localStorage.getItem('bookmarked-tools');
		if (saved) {
			setBookmarkedTools(new Set(JSON.parse(saved)));
		}
	}, []);

	const handleBookmarkToggle = (toolId: string) => {
		const newBookmarks = new Set(bookmarkedTools);
		if (newBookmarks.has(toolId)) {
			newBookmarks.delete(toolId);
		} else {
			newBookmarks.add(toolId);
		}
		setBookmarkedTools(newBookmarks);
		localStorage.setItem('bookmarked-tools', JSON.stringify(Array.from(newBookmarks)));
		onBookmarkTool?.(toolId);
	};

	const getRecommendationIcon = (reasonType: string) => {
		switch (reasonType) {
			case 'role_match':
				return <Target className=\"w-4 h-4 text-blue-500\" />;
			case 'interest_match':
				return <Star className=\"w-4 h-4 text-purple-500\" />;
			case 'popularity':
				return <TrendingUp className=\"w-4 h-4 text-green-500\" />;
			case 'workflow_fit':
				return <Zap className=\"w-4 h-4 text-orange-500\" />;
			case 'recent_trend':
				return <Sparkles className=\"w-4 h-4 text-pink-500\" />;
			default:
				return <Info className=\"w-4 h-4 text-gray-500\" />;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high':
				return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
			case 'low':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
		}
	};

	const getConfidenceLabel = (confidence: number) => {
		if (confidence >= 0.8) return 'Excellent Match';
		if (confidence >= 0.6) return 'Good Match';
		if (confidence >= 0.4) return 'Fair Match';
		return 'Possible Match';
	};

	return (
		<TooltipProvider>
			<div className=\"space-y-6\">
				{/* Header */}
				<div className=\"flex items-center justify-between\">
					<div>
						<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">
							Recommended for You
						</h3>
						<p className=\"text-sm text-gray-600 dark:text-gray-400\">
							{filteredRecommendations.length} tools personalized based on your profile
						</p>
					</div>

					<div className=\"flex items-center gap-2\">
						{/* Priority Filter */}
						<select
							value={filterPriority}
							onChange={(e) => setFilterPriority(e.target.value as any)}
							className=\"px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800\"
						>
							<option value=\"all\">All Priority</option>
							<option value=\"high\">High Priority</option>
							<option value=\"medium\">Medium Priority</option>
							<option value=\"low\">Low Priority</option>
						</select>

						{/* View Mode Toggle */}
						<div className=\"flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden\">
							<button
								onClick={() => setViewMode('grid')}
								className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
							>
								Grid
							</button>
							<button
								onClick={() => setViewMode('list')}
								className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
							>
								List
							</button>
						</div>
					</div>
				</div>

				{filteredRecommendations.length === 0 ? (
					<div className=\"text-center py-12\">
						<div className=\"w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4\">
							<Sparkles className=\"w-8 h-8 text-gray-400\" />
						</div>
						<h3 className=\"text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2\">
							No Recommendations Yet
						</h3>
						<p className=\"text-gray-600 dark:text-gray-400 max-w-md mx-auto\">
							Complete your profile to get personalized tool recommendations based on your role, interests, and workflow preferences.
						</p>
					</div>
				) : (
					<AnimatePresence mode=\"wait\">
						<motion.div
							key={viewMode + filterPriority}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className={
								viewMode === 'grid'
									? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
									: 'space-y-4'
							}
						>
							{filteredRecommendations.map((recommendation, index) => {
								const tool = getToolById(recommendation.toolId);
								if (!tool) return null;

								return (
									<motion.div
										key={recommendation.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<Card className={`h-full hover:shadow-lg transition-shadow ${
											recommendation.isPersonalized ? 'border-blue-200 dark:border-blue-800' : ''
										}`}>
											<CardHeader className=\"pb-3\">
												<div className=\"flex items-start justify-between mb-2\">
													<div className=\"flex items-center gap-2\">
														<span className=\"text-2xl\">{tool.icon}</span>
														<div>
															<CardTitle className=\"text-lg\">{tool.name}</CardTitle>
															<p className=\"text-sm text-gray-600 dark:text-gray-400\">{tool.category}</p>
														</div>
													</div>
													<div className=\"flex flex-col items-end gap-1\">
														{recommendation.isPersonalized && (
															<Badge variant=\"secondary\" className=\"text-xs\">
																<Sparkles className=\"w-3 h-3 mr-1\" />
																Personalized
															</Badge>
														)}
														<Badge className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
															{recommendation.priority} priority
														</Badge>
													</div>
												</div>
											</CardHeader>

											<CardContent className=\"space-y-3\">
												<p className=\"text-sm text-gray-600 dark:text-gray-400 leading-relaxed\">
													{tool.description}
												</p>

												{/* Recommendation Reason */}
												<div className=\"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3\">
													<div className=\"flex items-center gap-2 mb-1\">
														{getRecommendationIcon(recommendation.reason.type)}
														<span className=\"text-sm font-medium text-blue-700 dark:text-blue-300\">
															{getConfidenceLabel(recommendation.reason.confidence)}
														</span>
														<span className=\"text-xs text-blue-600 dark:text-blue-400\">
															({Math.round(recommendation.reason.confidence * 100)}% match)
														</span>
													</div>
													<p className=\"text-xs text-blue-700 dark:text-blue-300\">
														{recommendation.reason.description}
													</p>
												</div>

												{/* Tool Features */}
												<div className=\"space-y-2\">
													<div className=\"text-xs font-medium text-gray-700 dark:text-gray-300\">Key Features:</div>
													<div className=\"flex flex-wrap gap-1\">
														{tool.features.slice(0, 3).map((feature) => (
															<Badge key={feature} variant=\"outline\" className=\"text-xs\">
																{feature}
															</Badge>
														))}
													</div>
												</div>

												{/* Tool Metadata */}
												<div className=\"flex items-center justify-between text-xs text-gray-500 dark:text-gray-400\">
													<div className=\"flex items-center gap-3\">
														<div className=\"flex items-center gap-1\">
															<Zap className=\"w-3 h-3\" />
															{tool.difficulty}
														</div>
														<div className=\"flex items-center gap-1\">
															<Clock className=\"w-3 h-3\" />
															{tool.processingType.replace('-', ' ')}
														</div>
													</div>
													{tool.isPopular && (
														<div className=\"flex items-center gap-1 text-green-600 dark:text-green-400\">
															<Star className=\"w-3 h-3\" />
															Popular
														</div>
													)}
												</div>

												{/* Actions */}
												<div className=\"flex gap-2 pt-2\">
													<Button
														variant=\"default\"
														size=\"sm\"
														className=\"flex-1\"
														onClick={() => onTryTool?.(tool.id)}
													>
														Try Tool
														<ChevronRight className=\"w-4 h-4 ml-1\" />
													</Button>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant=\"outline\"
																size=\"sm\"
																onClick={() => handleBookmarkToggle(tool.id)}
																className={bookmarkedTools.has(tool.id) ? 'text-blue-600 border-blue-600' : ''}
															>
																<Bookmark
																	className={`w-4 h-4 ${bookmarkedTools.has(tool.id) ? 'fill-current' : ''}`}
																/>
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>{bookmarkedTools.has(tool.id) ? 'Remove bookmark' : 'Bookmark tool'}</p>
														</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant=\"outline\"
																size=\"sm\"
																onClick={() => window.open(tool.href, '_blank')}
															>
																<ExternalLink className=\"w-4 h-4\" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Open in new tab</p>
														</TooltipContent>
													</Tooltip>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								);
							})}
						</motion.div>
					</AnimatePresence>
				)}

				{/* Footer */}
				{filteredRecommendations.length > 0 && (
					<div className=\"text-center pt-4 border-t border-gray-200 dark:border-gray-700\">
						<p className=\"text-sm text-gray-600 dark:text-gray-400 mb-2\">
							These recommendations are based on your role, experience level, and interests.
						</p>
						<Button
							variant=\"outline\"
							size=\"sm\"
							onClick={() => {
								// Refresh recommendations or show more
								window.location.reload();
							}}
						>
							Refresh Recommendations
						</Button>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
