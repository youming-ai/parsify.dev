/**
 * Example Tool with Full Keyboard Navigation Integration
 * Demonstrates how to integrate all keyboard navigation features into a developer tool
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FocusGroup } from '@/components/ui/focus-group';
import { FocusTrap } from '@/components/ui/focus-trap';
import { KeyboardNavigableList } from '@/components/ui/keyboard-navigable-list';
import { ShortcutBadge } from '@/components/ui/shortcut-badge';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-navigation';
import { useFocusManagement } from '@/hooks/use-keyboard-navigation';
import { useKeyboardAnnouncements } from '@/hooks/use-keyboard-navigation';
import { shortcutManager } from '@/lib/keyboard-navigation/shortcut-system';
import type { KeyboardShortcut } from '@/lib/keyboard-navigation/shortcut-system';

interface ExampleItem {
	id: string;
	name: string;
	description: string;
	category: string;
}

export function ExampleKeyboardEnabledTool() {
	const [items, setItems] = useState<ExampleItem[]>([
		{ id: '1', name: 'Item One', description: 'First example item', category: 'Basics' },
		{ id: '2', name: 'Item Two', description: 'Second example item', category: 'Basics' },
		{ id: '3', name: 'Item Three', description: 'Third example item', category: 'Advanced' },
		{ id: '4', name: 'Item Four', description: 'Fourth example item', category: 'Advanced' },
	]);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [showHelp, setShowHelp] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const mainContentRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listContainerRef = useRef<HTMLDivElement>(null);

	const { announce, announceNavigation, announceAction, announceSuccess, announceError } = useKeyboardAnnouncements();

	// Custom shortcuts for this tool
	const toolShortcuts: KeyboardShortcut[] = [
		{
			id: 'tool-search',
			key: 'f',
			modifiers: { ctrl: true },
			description: 'Focus search input',
			category: 'tool',
			action: () => {
				searchInputRef.current?.focus();
				announceAction('Focused', 'search input');
			},
		},
		{
			id: 'tool-process',
			key: 'Enter',
			modifiers: {},
			description: 'Process selected item',
			category: 'tool',
			action: () => {
				if (selectedIndex !== null) {
					processItem(selectedIndex);
				}
			},
			condition: () => selectedIndex !== null,
		},
		{
			id: 'tool-refresh',
			key: 'r',
			modifiers: { ctrl: true },
			description: 'Refresh items',
			category: 'tool',
			action: () => {
				refreshItems();
			},
		},
		{
			id: 'tool-help',
			key: 'h',
			modifiers: { ctrl: true },
			description: 'Show tool help',
			category: 'tool',
			action: () => {
				setShowHelp(true);
			},
		},
		{
			id: 'tool-clear',
			key: 'Delete',
			modifiers: {},
			description: 'Clear selection',
			category: 'tool',
			action: () => {
				setSelectedIndex(null);
				announceAction('Cleared', 'selection');
			},
		},
	];

	// Register shortcuts
	useKeyboardShortcuts(toolShortcuts);

	// Focus management for main content
	const { activeIndex, focusFirst, focusLast } = useFocusManagement(mainContentRef, {
		orientation: 'vertical',
		loop: true,
	});

	// Initialize shortcuts on mount
	useEffect(() => {
		// Register tool-specific shortcuts
		toolShortcuts.forEach(shortcut => {
			shortcutManager.register(shortcut);
		});

		// Announce tool is ready
		announce('Example tool loaded. Use Tab to navigate or press Ctrl+H for help');

		return () => {
			// Cleanup shortcuts on unmount
			toolShortcuts.forEach(shortcut => {
				shortcutManager.unregister(shortcut.id);
			});
		};
	}, []);

	// Filter items based on search
	const filteredItems = items.filter(item =>
		item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
		item.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const processItem = async (index: number) => {
		if (index < 0 || index >= filteredItems.length) return;

		const item = filteredItems[index];
		setIsProcessing(true);

		announceAction('Processing', item.name);

		// Simulate processing
		await new Promise(resolve => setTimeout(resolve, 1000));

		setIsProcessing(false);
		announceSuccess(`Successfully processed ${item.name}`);
	};

	const refreshItems = () => {
		announceAction('Refreshing', 'items');
		// Simulate refresh
		setTimeout(() => {
			announceSuccess('Items refreshed successfully');
		}, 500);
	};

	const handleItemSelection = (item: ExampleItem | null, index: number) => {
		if (item) {
			setSelectedIndex(index);
			announceNavigation('Selected', item.name);
		} else {
			setSelectedIndex(null);
		}
	};

	const handleItemActivation = (item: ExampleItem, index: number) => {
		processItem(index);
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			{/* Header */}
			<header className="space-y-4">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Example Tool with Keyboard Navigation</h1>
					<div className="flex items-center gap-2">
						<ShortcutBadge
							shortcut={{ key: '?', modifiers: { shift: true } }}
							variant="outline"
						/>
						<Button
							variant="outline"
							onClick={() => setShowHelp(true)}
							aria-label="Show keyboard shortcuts help"
						>
							Shortcuts Help
						</Button>
					</div>
				</div>

				{/* Search */}
				<div className="relative">
					<Input
						ref={searchInputRef}
						type="search"
						placeholder="Search items..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						aria-label="Search items"
						className="pl-10"
					/>
					<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
						🔍
					</div>
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
						<ShortcutBadge
							shortcut={{ key: 'f', modifiers: { ctrl: true } }}
							size="sm"
							variant="ghost"
						/>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main ref={mainContentRef} className="space-y-6">
				{/* Quick Actions */}
				<section aria-labelledby="quick-actions-heading">
					<h2 id="quick-actions-heading" className="text-lg font-semibold mb-3">
						Quick Actions
					</h2>
					<FocusGroup
						orientation="horizontal"
						className="flex gap-2"
					>
						<Button
							onClick={() => refreshItems()}
							disabled={isProcessing}
							aria-label="Refresh items"
						>
							Refresh
							<ShortcutBadge
								shortcut={{ key: 'r', modifiers: { ctrl: true } }}
								size="sm"
								className="ml-2"
							/>
						</Button>
						<Button
							onClick={() => setSelectedIndex(null)}
							disabled={selectedIndex === null}
							aria-label="Clear selection"
						>
							Clear Selection
							<ShortcutBadge
								shortcut={{ key: 'Delete' }}
								size="sm"
								className="ml-2"
							/>
						</Button>
						<Button
							onClick={() => processItem(selectedIndex || 0)}
							disabled={selectedIndex === null || isProcessing}
							aria-label="Process selected item"
						>
							{isProcessing ? 'Processing...' : 'Process Selected'}
							<ShortcutBadge
								shortcut={{ key: 'Enter' }}
								size="sm"
								className="ml-2"
							/>
						</Button>
					</FocusGroup>
				</section>

				{/* Items List */}
				<section aria-labelledby="items-heading">
					<h2 id="items-heading" className="text-lg font-semibold mb-3">
						Items ({filteredItems.length})
					</h2>
					<KeyboardNavigableList
						ref={listContainerRef}
						items={filteredItems}
						onSelectionChange={handleItemSelection}
						onItemActivate={handleItemActivation}
						ariaLabelledby="items-heading"
						className="space-y-2"
					>
						{(item, index, isSelected, isFocused) => (
							<Card
								data-item-index={index}
								className={`
									p-4 cursor-pointer transition-all
									${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
									${isFocused ? 'outline-none ring-2 ring-blue-500' : ''}
								`}
								tabIndex={-1}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<h3 className="font-medium truncate">{item.name}</h3>
										<p className="text-sm text-gray-600 truncate">{item.description}</p>
									</div>
									<div className="flex items-center gap-2 ml-4 flex-shrink-0">
										<Badge variant="outline">{item.category}</Badge>
										{isSelected && (
											<Badge variant="default">Selected</Badge>
										)}
									</div>
								</div>
							</Card>
						)}
					</KeyboardNavigableList>

					{filteredItems.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							No items found matching your search.
						</div>
					)}
				</section>

				{/* Status */}
				{isProcessing && (
					<section aria-live="polite" aria-label="Processing status">
						<Card className="p-4 bg-blue-50 border-blue-200">
							<div className="flex items-center gap-2">
								<div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
								<span>Processing item...</span>
							</div>
						</Card>
					</section>
				)}

				{selectedIndex !== null && !isProcessing && (
					<section aria-live="polite" aria-label="Selected item details">
						<Card className="p-4 bg-green-50 border-green-200">
							<h3 className="font-medium text-green-800">Selected Item</h3>
							<p className="text-green-700">
								{filteredItems[selectedIndex]?.name} - {filteredItems[selectedIndex]?.description}
							</p>
							<p className="text-sm text-green-600 mt-1">
								Press Enter to process, or Tab to navigate away.
							</p>
						</Card>
					</section>
				)}
			</main>

			{/* Keyboard Shortcuts Help */}
			{showHelp && (
				<FocusTrap enabled={true}>
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
						<Card className="w-full max-w-md max-h-[80vh] overflow-auto">
							<div className="p-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setShowHelp(false)}
										aria-label="Close shortcuts help"
									>
										×
									</Button>
								</div>

								<div className="space-y-3">
									{toolShortcuts.map(shortcut => (
										<div key={shortcut.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
											<span className="text-sm">{shortcut.description}</span>
											<ShortcutBadge shortcut={shortcut} size="sm" />
										</div>
									))}
								</div>

								<div className="mt-6 pt-4 border-t">
									<p className="text-sm text-gray-600">
										Use Tab to navigate, Enter to activate, Escape to close this dialog.
									</p>
								</div>
							</div>
						</Card>
					</div>
				</FocusTrap>
			)}
		</div>
	);
}
