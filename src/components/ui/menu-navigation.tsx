/**
 * Menu Navigation Component
 * Implements keyboard navigation for dropdown and context menus
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FocusTrap } from './focus-trap';
import { useFocusManagement } from '@/hooks/use-keyboard-navigation';

export interface MenuItem {
	id: string;
	label: string;
	disabled?: boolean;
	checked?: boolean;
	type?: 'normal' | 'checkbox' | 'radio' | 'separator' | 'submenu';
	submenu?: MenuItem[];
	value?: string;
	shortcut?: string;
	icon?: React.ReactNode;
	description?: string;
	role?: string;
}

interface MenuNavigationProps {
	items: MenuItem[];
	onSelect?: (item: MenuItem, index: number) => void;
	onClose?: () => void;
	initialFocusIndex?: number;
	parentMenuRef?: React.RefObject<HTMLElement>;
	className?: string;
	ariaLabel?: string;
	orientation?: 'vertical' | 'horizontal';
}

export function MenuNavigation({
	items,
	onSelect,
	onClose,
	initialFocusIndex = 0,
	parentMenuRef,
	className,
	ariaLabel,
	orientation = 'vertical',
}: MenuNavigationProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [focusedIndex, setFocusedIndex] = useState(initialFocusIndex);
	const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
	const [submenuFocusIndex, setSubmenuFocusIndex] = useState(0);

	const { focusableElements } = useFocusManagement(containerRef, {
		orientation,
		loop: true,
		wrap: true,
	});

	// Get focusable menu items (excluding separators and disabled items)
	const getNavigableItems = useCallback(() => {
		return items.filter(item =>
			item.type !== 'separator' && !item.disabled
		);
	}, [items]);

	// Navigate to specific index
	const navigateTo = useCallback((index: number) => {
		const navigableItems = getNavigableItems();
		const actualIndex = items.indexOf(navigableItems[index]);

		if (actualIndex >= 0 && actualIndex < items.length) {
			const element = containerRef.current?.querySelector(`[data-menu-item-id="${items[actualIndex].id}"]`) as HTMLElement;
			if (element) {
				element.focus();
				setFocusedIndex(index);
			}
		}
	}, [items, getNavigableItems]);

	// Navigate to next item
	const navigateNext = useCallback(() => {
		const navigableItems = getNavigableItems();
		if (navigableItems.length === 0) return;

		let nextIndex = focusedIndex + 1;
		if (nextIndex >= navigableItems.length) {
			nextIndex = 0; // Loop
		}

		navigateTo(nextIndex);
	}, [focusedIndex, getNavigableItems, navigateTo]);

	// Navigate to previous item
	const navigatePrevious = useCallback(() => {
		const navigableItems = getNavigableItems();
		if (navigableItems.length === 0) return;

		let prevIndex = focusedIndex - 1;
		if (prevIndex < 0) {
			prevIndex = navigableItems.length - 1; // Loop
		}

		navigateTo(prevIndex);
	}, [focusedIndex, getNavigableItems, navigateTo]);

	// Select current item
	const selectCurrentItem = useCallback(() => {
		const navigableItems = getNavigableItems();
		if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
			const item = navigableItems[focusedIndex];

			if (item.type === 'submenu') {
				// Open submenu
				setIsSubmenuOpen(true);
				setSubmenuFocusIndex(0);
			} else if (item.type === 'checkbox') {
				// Toggle checkbox
				item.checked = !item.checked;
				onSelect?.(item, items.indexOf(item));
			} else {
				// Select item
				onSelect?.(item, items.indexOf(item));
				onClose?.();
			}
		}
	}, [focusedIndex, getNavigableItems, items, onSelect, onClose]);

	// Handle keyboard events
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			let handled = false;

			switch (event.key) {
				case 'ArrowDown':
					if (orientation === 'vertical') {
						event.preventDefault();
						navigateNext();
						handled = true;
					}
					break;

				case 'ArrowUp':
					if (orientation === 'vertical') {
						event.preventDefault();
						navigatePrevious();
						handled = true;
					}
					break;

				case 'ArrowRight':
					if (orientation === 'horizontal') {
						event.preventDefault();
						navigateNext();
						handled = true;
					} else {
						// Open submenu if available
						const navigableItems = getNavigableItems();
						if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
							const item = navigableItems[focusedIndex];
							if (item.type === 'submenu') {
								event.preventDefault();
								selectCurrentItem();
								handled = true;
							}
						}
					}
					break;

				case 'ArrowLeft':
					if (orientation === 'horizontal') {
						event.preventDefault();
						navigatePrevious();
						handled = true;
					} else if (isSubmenuOpen) {
						// Close submenu and return to parent
						event.preventDefault();
						setIsSubmenuOpen(false);
						handled = true;
					} else if (parentMenuRef?.current) {
						// Return to parent menu
						event.preventDefault();
						parentMenuRef.current.focus();
						onClose?.();
						handled = true;
					}
					break;

				case 'Enter':
				case ' ':
					event.preventDefault();
					selectCurrentItem();
					handled = true;
					break;

				case 'Escape':
					event.preventDefault();
					if (isSubmenuOpen) {
						setIsSubmenuOpen(false);
					} else {
						onClose?.();
					}
					handled = true;
					break;

				case 'Home':
					event.preventDefault();
					navigateTo(0);
					handled = true;
					break;

				case 'End':
					event.preventDefault();
					const navigableItems = getNavigableItems();
					navigateTo(navigableItems.length - 1);
					handled = true;
					break;

				case 'Tab':
					// Allow tab navigation to close the menu
					onClose?.();
					break;

				case 'FirstChar':
					// Type-ahead functionality
					const char = event.key.toLowerCase();
					const navigableItems = getNavigableItems();

					// Find next item starting with this character
					const startIndex = focusedIndex + 1;
					for (let i = 0; i < navigableItems.length; i++) {
						const index = (startIndex + i) % navigableItems.length;
						const item = navigableItems[index];
						if (item.label.toLowerCase().startsWith(char)) {
							event.preventDefault();
							navigateTo(index);
							handled = true;
							break;
						}
					}
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
	}, [orientation, focusedIndex, isSubmenuOpen, parentMenuRef, navigateNext, navigatePrevious, navigateTo, selectCurrentItem, getNavigableItems, onClose]);

	// Handle focus changes
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleFocusIn = (event: FocusEvent) => {
			const target = event.target as HTMLElement;
			const itemElement = target.closest('[data-menu-item-id]');
			if (itemElement) {
				const itemId = itemElement.getAttribute('data-menu-item-id');
				const navigableItems = getNavigableItems();
				const index = navigableItems.findIndex(item => item.id === itemId);
				if (index !== -1) {
					setFocusedIndex(index);
				}
			}
		};

		const handleFocusOut = () => {
			// Don't reset focus index on blur within the menu
		};

		container.addEventListener('focusin', handleFocusIn);
		container.addEventListener('focusout', handleFocusOut);

		return () => {
			container.removeEventListener('focusin', handleFocusIn);
			container.removeEventListener('focusout', handleFocusOut);
		};
	}, [getNavigableItems]);

	// Set initial focus
	useEffect(() => {
		if (containerRef.current && initialFocusIndex >= 0) {
			navigateTo(initialFocusIndex);
		}
	}, [initialFocusIndex, navigateTo]);

	// Render menu item
	const renderMenuItem = useCallback((item: MenuItem, index: number, actualIndex: number) => {
		if (item.type === 'separator') {
			return (
				<div
					key={item.id}
					role="separator"
					className="border-t border-gray-200 my-1"
				/>
			);
		}

		const navigableItems = getNavigableItems();
		const isInNavigableList = navigableItems.includes(item);
		const itemIndex = isInNavigableList ? navigableItems.indexOf(item) : -1;

		return (
			<div
				key={item.id}
				data-menu-item-id={item.id}
				role={item.role || 'menuitem' + (item.type === 'checkbox' ? 'checkbox' : item.type === 'radio' ? 'radio' : '')}
				aria-checked={item.checked}
				aria-disabled={item.disabled}
				aria-haspopup={item.type === 'submenu' ? 'menu' : undefined}
				aria-expanded={item.type === 'submenu' ? isSubmenuOpen && itemIndex === focusedIndex : undefined}
				tabIndex={item.disabled || !isInNavigableList ? -1 : itemIndex === focusedIndex ? 0 : -1}
				className={`
					relative flex items-center px-3 py-2 text-sm cursor-default
					${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 focus:bg-gray-100'}
					${itemIndex === focusedIndex ? 'bg-gray-100 outline-none' : ''}
				`}
			>
				{item.type === 'checkbox' && (
					<div className="w-4 h-4 border border-gray-300 rounded mr-3 flex items-center justify-center">
						{item.checked && (
							<div className="w-2 h-2 bg-blue-600 rounded-sm" />
						)}
					</div>
				)}

				{item.type === 'radio' && (
					<div className="w-4 h-4 border border-gray-300 rounded-full mr-3 flex items-center justify-center">
						{item.checked && (
							<div className="w-2 h-2 bg-blue-600 rounded-full" />
						)}
					</div>
				)}

				{item.icon && (
					<div className="mr-3 flex-shrink-0">
						{item.icon}
					</div>
				)}

				<div className="flex-1 min-w-0">
					<div className="truncate">{item.label}</div>
					{item.description && (
						<div className="text-xs text-gray-500 truncate">{item.description}</div>
					)}
				</div>

				{item.shortcut && (
					<div className="ml-auto pl-4 text-xs text-gray-500">
						{item.shortcut}
					</div>
				)}

				{item.type === 'submenu' && (
					<div className="ml-auto pl-4 text-gray-400">
						▶
					</div>
				)}
			</div>
		);
	}, [focusedIndex, isSubmenuOpen, getNavigableItems]);

	return (
		<FocusTrap enabled={true}>
			<div
				ref={containerRef}
				className={className}
				role="menu"
				aria-label={ariaLabel}
				aria-orientation={orientation}
			>
				{items.map((item, index) => renderMenuItem(item, index, items.indexOf(item)))}

				{/* Render submenu if open */}
				{isSubmenuOpen && focusedIndex >= 0 && (
					<MenuNavigation
						items={getNavigableItems()[focusedIndex]?.submenu || []}
						onSelect={(submenuItem, submenuIndex) => {
							onSelect?.(submenuItem, submenuIndex);
							onClose?.();
						}}
						onClose={() => setIsSubmenuOpen(false)}
						initialFocusIndex={submenuFocusIndex}
						parentMenuRef={containerRef}
						ariaLabel={`${getNavigableItems()[focusedIndex]?.label} submenu`}
					/>
				)}
			</div>
		</FocusTrap>
	);
}
