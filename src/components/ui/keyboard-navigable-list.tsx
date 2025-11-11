/**
 * Keyboard Navigable List Component
 * Enhanced list component with comprehensive keyboard navigation
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FocusableItem } from './focusable-item';
import { useListKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { announceToScreenReader } from '@/lib/keyboard-navigation/utils';

interface KeyboardNavigableListProps<T = any> {
	items: T[];
	children: (item: T, index: number, isSelected: boolean, isFocused: boolean) => React.ReactNode;
	getItemId?: (item: T, index: number) => string;
	getItemLabel?: (item: T) => string;
	onSelectionChange?: (item: T | null, index: number) => void;
	onItemActivate?: (item: T, index: number) => void;
	multiSelect?: boolean;
	selectedItems?: Set<string> | string[];
	defaultSelectedIndex?: number;
	orientation?: 'vertical' | 'horizontal';
	role?: 'listbox' | 'menu' | 'grid' | 'list';
	ariaLabel?: string;
	ariaLabelledby?: string;
	className?: string;
	virtualized?: boolean;
	itemHeight?: number;
	containerHeight?: number;
}

export function KeyboardNavigableList<T = any>({
	items,
	children,
	getItemId,
	getItemLabel,
	onSelectionChange,
	onItemActivate,
	multiSelect = false,
	selectedItems,
	defaultSelectedIndex = -1,
	orientation = 'vertical',
	role = 'listbox',
	ariaLabel,
	ariaLabelledby,
	className,
	virtualized = false,
	itemHeight = 40,
	containerHeight = 300,
}: KeyboardNavigableListProps<T>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const [selectedSet, setSelectedSet] = useState<Set<string>>(() => {
		if (!selectedItems) return new Set();
		return new Set(Array.isArray(selectedItems) ? selectedItems : [selectedItems]);
	});

	const getItemIdInternal = useCallback((item: T, index: number): string => {
		return getItemId?.(item, index) || `${index}`;
	}, [getItemId]);

	// Handle keyboard navigation
	const {
		selectedIndex: navSelectedIndex,
		navigateTo,
		navigateNext,
		navigatePrevious,
		selectFirst,
		selectLast,
	} = useListKeyboardNavigation(
		items,
		containerRef,
		(item, index) => containerRef.current?.querySelector(`[data-item-index="${index}"]`) as HTMLElement,
		{
			orientation,
			loop: true,
			onSelect: (item, index) => {
				handleSelectionChange(item, index);
			},
			onActivate: (item, index) => {
				onItemActivate?.(item, index);
			},
			getItemLabel,
		}
	);

	// Handle selection changes
	const handleSelectionChange = useCallback((item: T, index: number) => {
		const itemId = getItemIdInternal(item, index);
		const newSelectedSet = new Set(selectedSet);

		if (multiSelect) {
			if (newSelectedSet.has(itemId)) {
				newSelectedSet.delete(itemId);
			} else {
				newSelectedSet.add(itemId);
			}
		} else {
			newSelectedSet.clear();
			newSelectedSet.add(itemId);
		}

		setSelectedSet(newSelectedSet);
		setSelectedIndex(index);

		// Announce selection to screen readers
		const itemLabel = getItemLabel?.(item) || `Item ${index + 1}`;
		const action = newSelectedSet.has(itemId) ? 'Selected' : 'Deselected';
		announceToScreenReader(`${action} ${itemLabel}`);

		onSelectionChange?.(newSelectedSet.has(itemId) ? item : null, index);
	}, [selectedSet, multiSelect, getItemIdInternal, getItemLabel, onSelectionChange]);

	// Handle item click
	const handleItemClick = useCallback((item: T, index: number, event: React.MouseEvent) => {
		event.preventDefault();
		navigateTo(index);
		handleSelectionChange(item, index);
	}, [navigateTo, handleSelectionChange]);

	// Sync with external selected items
	useEffect(() => {
		if (selectedItems) {
			const externalSet = new Set(Array.isArray(selectedItems) ? selectedItems : [selectedItems]);
			setSelectedSet(externalSet);
		}
	}, [selectedItems]);

	// Sync navigation state
	useEffect(() => {
		setSelectedIndex(navSelectedIndex);
	}, [navSelectedIndex]);

	// Handle focus changes
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleFocusIn = (event: FocusEvent) => {
			const target = event.target as HTMLElement;
			const itemElement = target.closest('[data-item-index]');
			if (itemElement) {
				const index = parseInt(itemElement.getAttribute('data-item-index') || '-1');
				setFocusedIndex(index);
			}
		};

		const handleFocusOut = () => {
			setFocusedIndex(-1);
		};

		container.addEventListener('focusin', handleFocusIn);
		container.addEventListener('focusout', handleFocusOut);

		return () => {
			container.removeEventListener('focusin', handleFocusIn);
			container.removeEventListener('focusout', handleFocusOut);
		};
	}, []);

	// Virtual scrolling implementation
	const renderVirtualizedItems = useCallback(() => {
		if (!virtualized) return null;

		const visibleCount = Math.ceil(containerHeight / itemHeight);
		const startIndex = Math.max(0, focusedIndex - Math.floor(visibleCount / 2));
		const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

		return items.slice(startIndex, endIndex + 1).map((item, index) => {
			const actualIndex = startIndex + index;
			const itemId = getItemIdInternal(item, actualIndex);
			const isSelected = selectedSet.has(itemId);
			const isFocused = focusedIndex === actualIndex;

			return (
				<div
					key={itemId}
					data-item-index={actualIndex}
					style={{
						position: 'absolute',
						top: index * itemHeight,
						height: itemHeight,
						width: '100%',
					}}
				>
					{children(item, actualIndex, isSelected, isFocused)}
				</div>
			);
		});
	}, [virtualized, containerHeight, itemHeight, focusedIndex, items, getItemIdInternal, selectedSet, children]);

	// Render non-virtualized items
	const renderRegularItems = useCallback(() => {
		return items.map((item, index) => {
			const itemId = getItemIdInternal(item, index);
			const isSelected = selectedSet.has(itemId);
			const isFocused = focusedIndex === index;

			return (
				<div
					key={itemId}
					data-item-index={index}
					onClick={(event) => handleItemClick(item, index, event)}
				>
					{children(item, index, isSelected, isFocused)}
				</div>
			);
		});
	}, [items, getItemIdInternal, selectedSet, focusedIndex, children, handleItemClick]);

	return (
		<div
			ref={containerRef}
			className={className}
			role={role}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
			aria-multiselectable={multiSelect ? 'true' : 'false'}
			aria-orientation={orientation}
			tabIndex={0}
			style={{
				position: 'relative',
				height: virtualized ? containerHeight : undefined,
				overflow: virtualized ? 'auto' : undefined,
			}}
		>
			{virtualized ? renderVirtualizedItems() : renderRegularItems()}
		</div>
	);
}
