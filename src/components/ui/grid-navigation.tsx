/**
 * Grid Navigation Component
 * Implements 2D keyboard navigation for grid layouts
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FocusableItem } from './focusable-item';
import { useKeyboardAnnouncements } from '@/hooks/use-keyboard-navigation';

interface GridNavigationProps<T = any> {
	items: T[];
	columns: number;
	children: (item: T, index: number, isSelected: boolean, isFocused: boolean) => React.ReactNode;
	getItemId?: (item: T, index: number) => string;
	getItemLabel?: (item: T) => string;
	onSelectionChange?: (item: T | null, index: number) => void;
	onItemActivate?: (item: T, index: number) => void;
	selectedIndex?: number;
	orientation?: 'horizontal' | 'vertical' | 'both';
	wrap?: boolean;
	loop?: boolean;
	className?: string;
	role?: 'grid' | 'treegrid';
	ariaLabel?: string;
}

export function GridNavigation<T = any>({
	items,
	columns,
	children,
	getItemId,
	getItemLabel,
	onSelectionChange,
	onItemActivate,
	selectedIndex: propSelectedIndex,
	orientation = 'both',
	wrap = true,
	loop = true,
	className,
	role = 'grid',
	ariaLabel,
}: GridNavigationProps<T>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(propSelectedIndex ?? -1);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const { announce } = useKeyboardAnnouncements();

	const rows = Math.ceil(items.length / columns);

	const getItemIdInternal = useCallback((item: T, index: number): string => {
		return getItemId?.(item, index) || `${index}`;
	}, [getItemId]);

	// Get grid position from index
	const getGridPosition = useCallback((index: number) => {
		if (index < 0 || index >= items.length) {
			return { row: -1, col: -1 };
		}
		return {
			row: Math.floor(index / columns),
			col: index % columns,
		};
	}, [items.length, columns]);

	// Get index from grid position
	const getIndexFromPosition = useCallback((row: number, col: number) => {
		const index = row * columns + col;
		return index < items.length ? index : -1;
	}, [items.length, columns]);

	// Navigate to a specific position
	const navigateTo = useCallback((index: number) => {
		if (index < 0 || index >= items.length) return false;

		const element = containerRef.current?.querySelector(`[data-item-index="${index}"]`) as HTMLElement;
		if (element) {
			element.focus();
			setFocusedIndex(index);

			const itemLabel = getItemLabel?.(items[index]) || `Row ${Math.floor(index / columns) + 1}, Column ${(index % columns) + 1}`;
			announce(`Focused ${itemLabel}`);
			return true;
		}
		return false;
	}, [items, columns, getItemLabel, announce]);

	// Navigate to next cell
	const navigateNext = useCallback((direction: 'horizontal' | 'vertical') => {
		if (focusedIndex < 0) {
			return navigateTo(0);
		}

		const { row, col } = getGridPosition(focusedIndex);
		let newIndex = -1;

		switch (direction) {
			case 'horizontal':
				if (col < columns - 1) {
					newIndex = getIndexFromPosition(row, col + 1);
				} else if (wrap && row < rows - 1) {
					// Wrap to next row
					newIndex = getIndexFromPosition(row + 1, 0);
				} else if (loop) {
					// Loop to beginning
					newIndex = 0;
				}
				break;

			case 'vertical':
				if (row < rows - 1) {
					newIndex = getIndexFromPosition(row + 1, col);
				} else if (wrap && col < columns - 1) {
					// Wrap to next column
					newIndex = getIndexFromPosition(0, col + 1);
				} else if (loop) {
					// Loop to beginning
					newIndex = 0;
				}
				break;
		}

		if (newIndex >= 0 && newIndex < items.length) {
			navigateTo(newIndex);
		}
	}, [focusedIndex, getGridPosition, columns, rows, wrap, loop, items.length, getIndexFromPosition, navigateTo]);

	// Navigate to previous cell
	const navigatePrevious = useCallback((direction: 'horizontal' | 'vertical') => {
		if (focusedIndex < 0) {
			return navigateTo(items.length - 1);
		}

		const { row, col } = getGridPosition(focusedIndex);
		let newIndex = -1;

		switch (direction) {
			case 'horizontal':
				if (col > 0) {
					newIndex = getIndexFromPosition(row, col - 1);
				} else if (wrap && row > 0) {
					// Wrap to previous row
					newIndex = getIndexFromPosition(row - 1, columns - 1);
				} else if (loop) {
					// Loop to end
					newIndex = items.length - 1;
				}
				break;

			case 'vertical':
				if (row > 0) {
					newIndex = getIndexFromPosition(row - 1, col);
				} else if (wrap && col > 0) {
					// Wrap to previous column
					newIndex = getIndexFromPosition(rows - 1, col - 1);
				} else if (loop) {
					// Loop to end
					newIndex = items.length - 1;
				}
				break;
		}

		if (newIndex >= 0 && newIndex < items.length) {
			navigateTo(newIndex);
		}
	}, [focusedIndex, getGridPosition, columns, rows, wrap, loop, items.length, getIndexFromPosition, navigateTo]);

	// Navigate to row boundaries
	const navigateToRowStart = useCallback(() => {
		if (focusedIndex >= 0) {
			const { row } = getGridPosition(focusedIndex);
			const newIndex = getIndexFromPosition(row, 0);
			navigateTo(newIndex);
		}
	}, [focusedIndex, getGridPosition, getIndexFromPosition, navigateTo]);

	const navigateToRowEnd = useCallback(() => {
		if (focusedIndex >= 0) {
			const { row } = getGridPosition(focusedIndex);
			const lastCol = Math.min(columns - 1, items.length - row * columns - 1);
			const newIndex = getIndexFromPosition(row, lastCol);
			navigateTo(newIndex);
		}
	}, [focusedIndex, getGridPosition, columns, items.length, getIndexFromPosition, navigateTo]);

	// Handle keyboard events
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			let handled = false;

			switch (event.key) {
				case 'ArrowRight':
					if (orientation === 'horizontal' || orientation === 'both') {
						event.preventDefault();
						navigateNext('horizontal');
						handled = true;
					}
					break;

				case 'ArrowLeft':
					if (orientation === 'horizontal' || orientation === 'both') {
						event.preventDefault();
						navigatePrevious('horizontal');
						handled = true;
					}
					break;

				case 'ArrowDown':
					if (orientation === 'vertical' || orientation === 'both') {
						event.preventDefault();
						navigateNext('vertical');
						handled = true;
					}
					break;

				case 'ArrowUp':
					if (orientation === 'vertical' || orientation === 'both') {
						event.preventDefault();
						navigatePrevious('vertical');
						handled = true;
					}
					break;

				case 'Home':
					if (event.ctrlKey) {
						// Ctrl+Home - first cell
						event.preventDefault();
						navigateTo(0);
						handled = true;
					} else {
						// Home - row start
						event.preventDefault();
						navigateToRowStart();
						handled = true;
					}
					break;

				case 'End':
					if (event.ctrlKey) {
						// Ctrl+End - last cell
						event.preventDefault();
						navigateTo(items.length - 1);
						handled = true;
					} else {
						// End - row end
						event.preventDefault();
						navigateToRowEnd();
						handled = true;
					}
					break;

				case 'PageDown':
					event.preventDefault();
					if (focusedIndex >= 0) {
						const { row, col } = getGridPosition(focusedIndex);
						const targetRow = Math.min(row + 5, rows - 1);
						const newIndex = getIndexFromPosition(targetRow, col);
						if (newIndex >= 0) {
							navigateTo(newIndex);
						}
					}
					handled = true;
					break;

				case 'PageUp':
					event.preventDefault();
					if (focusedIndex >= 0) {
						const { row, col } = getGridPosition(focusedIndex);
						const targetRow = Math.max(row - 5, 0);
						const newIndex = getIndexFromPosition(targetRow, col);
						if (newIndex >= 0) {
							navigateTo(newIndex);
						}
					}
					handled = true;
					break;

				case 'Enter':
				case ' ':
					if (focusedIndex >= 0) {
						event.preventDefault();
						const item = items[focusedIndex];
						onItemActivate?.(item, focusedIndex);
					}
					handled = true;
					break;
			}

			if (handled) {
				event.stopPropagation();
			}
		};

		container.addEventListener('keydown', handleKeyDown);

		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [orientation, navigateNext, navigatePrevious, navigateToRowStart, navigateToRowEnd, navigateTo, items, focusedIndex, getGridPosition, rows, getIndexFromPosition, onItemActivate]);

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

	// Sync with external selection
	useEffect(() => {
		if (propSelectedIndex !== undefined) {
			setSelectedIndex(propSelectedIndex);
		}
	}, [propSelectedIndex]);

	return (
		<div
			ref={containerRef}
			className={className}
			role={role}
			aria-label={ariaLabel}
			aria-rowcount={rows}
			aria-colcount={columns}
			aria-multiselectable="false"
			tabIndex={0}
		>
			{items.map((item, index) => {
				const { row, col } = getGridPosition(index);
				const itemId = getItemIdInternal(item, index);
				const isSelected = selectedIndex === index;
				const isFocused = focusedIndex === index;

				return (
					<div
						key={itemId}
						data-item-index={index}
						role="gridcell"
						aria-rowindex={row + 1}
						aria-colindex={col + 1}
						aria-selected={isSelected}
						style={{
							gridRow: row + 1,
							gridColumn: col + 1,
						}}
					>
						{children(item, index, isSelected, isFocused)}
					</div>
				);
			})}
		</div>
	);
}
