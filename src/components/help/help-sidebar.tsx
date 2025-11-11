'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, X, Minus, Plus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type {
	HelpContent,
	HelpContext,
	UserHelpProfile,
	HelpCategory,
	HelpInteraction
} from '@/types/help-system';

interface HelpSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	content: HelpContent[];
	context: HelpContext;
	userProfile: UserHelpProfile;
	onInteraction?: (interaction: Omit<HelpInteraction, 'id' | 'timestamp' | 'sessionId'>) => void;
	onContentSelect?: (content: HelpContent) => void;
	width?: number;
	className?: string;
}

/**
 * Sidebar component for browsing help content
 * Features search, categorization, and filtering based on user context
 */
export function HelpSidebar({
	isOpen,
	onClose,
	content,
	context,
	userProfile,
	onInteraction,
	onContentSelect,
	width = 400,
	className,
}: HelpSidebarProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<HelpCategory | 'all'>('all');
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
	const [filteredContent, setFilteredContent] = useState<HelpContent[]>([]);
	const sidebarRef = useRef<HTMLDivElement>(null);
	const openStartTime = useRef<number>();

	// Group content by category
	const contentByCategory = content.reduce((acc, item) => {
		item.categories.forEach(category => {
			if (!acc[category]) acc[category] = [];
			acc[category].push(item);
		});
		return acc;
	}, {} as Record<HelpCategory, HelpContent[]>);

	// Get all available categories
	const categories = Object.keys(contentByCategory) as HelpCategory[];

	// Filter and search content
	useEffect(() => {
		let filtered = content;

		// Filter by selected category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(item => item.categories.includes(selectedCategory));
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(item =>
				item.title.toLowerCase().includes(query) ||
				item.description.toLowerCase().includes(query) ||
				item.metadata.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
				item.metadata.searchableText.toLowerCase().includes(query)
			);
		}

		// Sort by relevance and priority
		filtered.sort((a, b) => {
			// Priority sorting
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
			if (priorityDiff !== 0) return priorityDiff;

			// Context relevance
			const aRelevant = a.contexts.includes(context.type);
			const bRelevant = b.contexts.includes(context.type);
			if (aRelevant && !bRelevant) return -1;
			if (!aRelevant && bRelevant) return 1;

			// Alphabetical
			return a.title.localeCompare(b.title);
		});

		setFilteredContent(filtered);
	}, [content, selectedCategory, searchQuery, context.type]);

	// Track sidebar interaction duration
	const handleClose = () => {
		if (openStartTime.current) {
			const duration = Date.now() - openStartTime.current;
			onInteraction?.({
				helpId: 'sidebar-navigation',
				contextId: context.id,
				deliveryMethod: 'sidebar',
				action: 'viewed',
				duration,
			});
		}
		onClose();
	};

	// Handle content selection
	const handleContentSelect = (selectedContent: HelpContent) => {
		onContentSelect?.(selectedContent);
		onInteraction?.({
			helpId: selectedContent.id,
			contextId: context.id,
			deliveryMethod: 'sidebar',
			action: 'viewed',
			duration: openStartTime.current ? Date.now() - openStartTime.current : 0,
		});
	};

	// Toggle category expansion
	const toggleCategory = (category: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(category)) {
			newExpanded.delete(category);
		} else {
			newExpanded.add(category);
		}
		setExpandedCategories(newExpanded);
	};

	// Initialize with expanded categories based on context
	useEffect(() => {
		if (content.length > 0 && expandedCategories.size === 0) {
			const initialExpanded = new Set<string>();

			// Expand categories relevant to current context
			content.forEach(item => {
				if (item.contexts.includes(context.type)) {
					item.categories.forEach(category => {
						initialExpanded.add(category);
					});
				}
			});

			// If no context-specific categories, expand the most popular ones
			if (initialExpanded.size === 0) {
				const categoryCounts = categories.map(category => ({
					category,
					count: contentByCategory[category].length,
				}));
				categoryCounts.sort((a, b) => b.count - a.count);

				// Expand top 3 categories
				categoryCounts.slice(0, 3).forEach(({ category }) => {
					initialExpanded.add(category);
				});
			}

			setExpandedCategories(initialExpanded);
		}
	}, [content, context.type, categories, contentByCategory, expandedCategories.size]);

	// Track open time
	useEffect(() => {
		if (isOpen) {
			openStartTime.current = Date.now();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div
			ref={sidebarRef}
			className={cn(
				'fixed right-0 top-0 h-full bg-background border-l shadow-lg z-40 flex flex-col',
				'transition-all duration-300 ease-in-out',
				isOpen ? 'translate-x-0' : 'translate-x-full',
				className
			)}
			style={{ width }}
		>
			{/* Header */}
			<div className="p-4 border-b space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Help & Documentation</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClose}
						className="h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search help content..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Category Filter */}
				<div className="flex items-center gap-2 flex-wrap">
					<Button
						variant={selectedCategory === 'all' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setSelectedCategory('all')}
						className="text-xs"
					>
						All ({content.length})
					</Button>
					{categories.map(category => (
						<Button
							key={category}
							variant={selectedCategory === category ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSelectedCategory(category)}
							className="text-xs"
						>
							{formatCategory(category)} ({contentByCategory[category].length})
						</Button>
					))}
				</div>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-4">
					{/* Contextual suggestions */}
					{context.toolId && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground">
								For {getToolName(context.toolId)}
							</h3>
							{filteredContent
								.filter(item => item.metadata.searchableText.includes(`tool:${context.toolId}`))
								.slice(0, 3)
								.map(item => (
									<HelpItem
										key={item.id}
										content={item}
										context={context}
										userProfile={userProfile}
										onSelect={() => handleContentSelect(item)}
									/>
								))}
							<Separator />
						</div>
					)}

					{/* Categorized content */}
					{categories.map(category => {
						const categoryContent = contentByCategory[category].filter(item =>
							filteredContent.some(filtered => filtered.id === item.id)
						);

						if (categoryContent.length === 0) return null;

						const isExpanded = expandedCategories.has(category);

						return (
							<div key={category} className="space-y-2">
								<Button
									variant="ghost"
									className="w-full justify-between p-2 h-auto"
									onClick={() => toggleCategory(category)}
								>
									<span className="font-medium">
										{formatCategory(category)} ({categoryContent.length})
									</span>
									{isExpanded ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
								</Button>

								{isExpanded && (
									<div className="ml-4 space-y-1">
										{categoryContent.map(item => (
											<HelpItem
												key={item.id}
												content={item}
												context={context}
												userProfile={userProfile}
												onSelect={() => handleContentSelect(item)}
											/>
										))}
									</div>
								)}
							</div>
						);
					})}

					{/* No results */}
					{filteredContent.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							<p className="text-sm">No help content found</p>
							<p className="text-xs mt-1">
								Try adjusting your search or filter criteria
							</p>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Footer */}
			<div className="p-4 border-t space-y-2">
				<div className="text-xs text-muted-foreground">
					{filteredContent.length} of {content.length} items shown
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1">
						<span className="text-xs text-muted-foreground">Your level:</span>
						<Badge variant="secondary" className="text-xs">
							{userProfile.expertiseLevel}
						</Badge>
					</div>

					<Button
						variant="ghost"
						size="sm"
						className="text-xs"
						onClick={() => window.open('/docs', '_blank')}
					>
						Full Documentation
						<ExternalLink className="h-3 w-3 ml-1" />
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * Individual help item component
 */
function HelpItem({
	content,
	context,
	userProfile,
	onSelect,
}: {
	content: HelpContent;
	context: HelpContext;
	userProfile: UserHelpProfile;
	onSelect: () => void;
}) {
	const [isBookmarked, setIsBookmarked] = useState(
		userProfile.bookmarkedHelp.has(content.id)
	);

	const isRelevant = content.contexts.includes(context.type);
	const hasBeenViewed = userProfile.helpInteractions.some(
		interaction => interaction.helpId === content.id
	);

	return (
		<div
			className={cn(
				'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent',
				isRelevant && 'bg-accent/50 border-primary/20'
			)}
			onClick={onSelect}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 space-y-1">
					<div className="flex items-center gap-2">
						<h4 className="text-sm font-medium leading-tight">
							{content.title}
						</h4>
						{content.priority === 'critical' && (
							<Badge variant="destructive" className="text-xs">
								Important
							</Badge>
						)}
						{hasBeenViewed && (
							<div className="w-2 h-2 rounded-full bg-green-500" />
						)}
					</div>

					<p className="text-xs text-muted-foreground line-clamp-2">
						{content.description}
					</p>

					<div className="flex items-center gap-2">
						{content.categories.slice(0, 2).map(category => (
							<Badge key={category} variant="outline" className="text-xs">
								{formatCategory(category)}
							</Badge>
						))}

						{content.targetAudience.includes(userProfile.expertiseLevel) && (
							<Badge variant="secondary" className="text-xs">
								For you
							</Badge>
						)}
					</div>
				</div>

				{isBookmarked && (
					<div className="w-4 h-4 rounded-full bg-primary" />
				)}
			</div>
		</div>
	);
}

/**
 * Format category names for display
 */
function formatCategory(category: string): string {
	return category
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Get tool name from tool ID
 */
function getToolName(toolId: string): string {
	return toolId
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export default HelpSidebar;
