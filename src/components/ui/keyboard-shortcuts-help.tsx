/**
 * Keyboard Shortcuts Help Component
 * Displays all available keyboard shortcuts with search and filtering
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { shortcutManager, type KeyboardShortcut } from '@/lib/keyboard-navigation/shortcut-system';
import { shortcutToString } from '@/lib/keyboard-navigation/utils';
import { FocusTrap } from './focus-trap';
import { Input } from './input';
import { Badge } from './badge';
import { Card } from './card';
import { Button } from './button';

interface KeyboardShortcutsHelpProps {
	isOpen: boolean;
	onClose: () => void;
	searchPlaceholder?: string;
	title?: string;
	categories?: KeyboardShortcut['category'][];
}

export function KeyboardShortcutsHelp({
	isOpen,
	onClose,
	searchPlaceholder = "Search shortcuts...",
	title = "Keyboard Shortcuts",
	categories,
}: KeyboardShortcutsHelpProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<KeyboardShortcut['category'] | 'all'>('all');

	// Get all shortcuts
	const allShortcuts = useMemo(() => {
		const shortcuts = shortcutManager.getAll();

		return shortcuts.filter(shortcut =>
			shortcut.enabled !== false &&
			(!categories || categories.includes(shortcut.category))
		);
	}, [categories]);

	// Filter shortcuts by category and search
	const filteredShortcuts = useMemo(() => {
		return allShortcuts.filter(shortcut => {
			const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
			const matchesSearch = searchQuery === '' ||
				shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				shortcutToString(shortcut).toLowerCase().includes(searchQuery.toLowerCase()) ||
				shortcut.id.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesCategory && matchesSearch;
		});
	}, [allShortcuts, selectedCategory, searchQuery]);

	// Group shortcuts by category
	const shortcutsByCategory = useMemo(() => {
		const groups: Record<KeyboardShortcut['category'], KeyboardShortcut[]> = {} as any;

		filteredShortcuts.forEach(shortcut => {
			if (!groups[shortcut.category]) {
				groups[shortcut.category] = [];
			}
			groups[shortcut.category].push(shortcut);
		});

		return groups;
	}, [filteredShortcuts]);

	// Get available categories
	const availableCategories = useMemo(() => {
		const categorySet = new Set(allShortcuts.map(shortcut => shortcut.category));
		return Array.from(categorySet).sort();
	}, [allShortcuts]);

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setSearchQuery('');
			setSelectedCategory('all');
		}
	}, [isOpen]);

	// Close on escape
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	const getCategoryDisplayName = (category: KeyboardShortcut['category']) => {
		const names: Record<KeyboardShortcut['category'], string> = {
			global: 'Global',
			navigation: 'Navigation',
			editing: 'Editing',
			tool: 'Tool Specific',
			accessibility: 'Accessibility',
		};
		return names[category] || category;
	};

	const getCategoryDescription = (category: KeyboardShortcut['category']) => {
		const descriptions: Record<KeyboardShortcut['category'], string> = {
			global: 'Shortcuts that work everywhere',
			navigation: 'Navigate through the interface',
			editing: 'Edit text and content',
			tool: 'Specific tool shortcuts',
			accessibility: 'Accessibility and screen reader shortcuts',
		};
		return descriptions[category] || '';
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<FocusTrap>
				<Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b">
						<h2 className="text-2xl font-semibold">{title}</h2>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close shortcuts help"
						>
							×
						</Button>
					</div>

					{/* Search and Filters */}
					<div className="p-6 border-b space-y-4">
						<div className="relative">
							<Input
								type="search"
								placeholder={searchPlaceholder}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
								aria-label="Search keyboard shortcuts"
							/>
							<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
								🔍
							</div>
						</div>

						{/* Category Filter */}
						<div className="flex flex-wrap gap-2">
							<Badge
								variant={selectedCategory === 'all' ? 'default' : 'outline'}
								className="cursor-pointer"
								onClick={() => setSelectedCategory('all')}
							>
								All ({allShortcuts.length})
							</Badge>
							{availableCategories.map(category => (
								<Badge
									key={category}
									variant={selectedCategory === category ? 'default' : 'outline'}
									className="cursor-pointer"
									onClick={() => setSelectedCategory(category)}
								>
									{getCategoryDisplayName(category)} ({
										allShortcuts.filter(s => s.category === category).length
									})
								</Badge>
							))}
						</div>
					</div>

					{/* Shortcuts List */}
					<div className="flex-1 overflow-y-auto p-6">
						{Object.entries(shortcutsByCategory).length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								No shortcuts found matching your search.
							</div>
						) : (
							<div className="space-y-8">
								{Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
									<div key={category}>
										<h3 className="text-lg font-medium mb-2 flex items-center gap-2">
											{getCategoryDisplayName(category)}
											<span className="text-sm text-gray-500">
												- {getCategoryDescription(category as KeyboardShortcut['category'])}
											</span>
										</h3>
										<div className="space-y-2">
											{shortcuts.map(shortcut => (
												<div
													key={shortcut.id}
													className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 focus-within:bg-gray-50 focus-within:outline focus-within:outline-2 focus-within:outline-blue-500"
													tabIndex={0}
												>
													<div className="flex-1 min-w-0">
														<div className="font-medium">{shortcut.description}</div>
														<div className="text-sm text-gray-500">{shortcut.id}</div>
													</div>
													<div className="flex items-center gap-2 ml-4">
														{shortcut.key && (
															<div className="flex items-center gap-1 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
																{shortcutToString(shortcut)}
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="p-6 border-t bg-gray-50">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-600">
								{filteredShortcuts.length} of {allShortcuts.length} shortcuts shown
							</div>
							<div className="flex gap-2">
								<Button variant="outline" onClick={() => window.print()}>
									Print
								</Button>
								<Button onClick={onClose}>Close</Button>
							</div>
						</div>
					</div>
				</Card>
			</FocusTrap>
		</div>
	);
}
