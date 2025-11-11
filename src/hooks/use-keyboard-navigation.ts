/**
 * Keyboard Navigation Hooks
 * React hooks for enhanced keyboard navigation
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardShortcut, KeyboardNavigationOptions } from '@/lib/keyboard-navigation/utils';
import {
	matchesShortcut,
	getFocusableElements,
	focusNextElement,
	focusFirstElement,
	focusLastElement,
	trapFocus,
	announceToScreenReader,
	normalizeKeyName,
} from '@/lib/keyboard-navigation/utils';

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(
	shortcuts: KeyboardShortcut[],
	options: {
		enabled?: boolean;
		ignoreWhenFocusedIn?: string[];
	} = {}
) {
	const { enabled = true, ignoreWhenFocusedIn = [] } = options;
	const [isListening, setIsListening] = useState(false);

	useEffect(() => {
		if (!enabled) {
			setIsListening(false);
			return;
		}

		const handleKeyDown = async (event: KeyboardEvent) => {
			// Check if we should ignore shortcuts when focused in certain elements
			const activeElement = event.target as HTMLElement;
			if (ignoreWhenFocusedIn.length > 0 && activeElement) {
				const shouldIgnore = ignoreWhenFocusedIn.some(selector =>
					activeElement.closest(selector)
				);
				if (shouldIgnore) return;
			}

			// Find matching shortcuts
			for (const shortcut of shortcuts) {
				// Skip disabled shortcuts
				if (shortcut.enabled === false) continue;

				// Check condition
				if (shortcut.condition && !shortcut.condition()) continue;

				// Check if shortcut matches
				if (matchesShortcut(event, shortcut)) {
					// Prevent default and stop propagation if configured
					if (shortcut.preventDefault !== false) {
						event.preventDefault();
					}
					if (shortcut.stopPropagation) {
						event.stopPropagation();
					}

					try {
						await shortcut.action(event);
					} catch (error) {
						console.error(`Error executing keyboard shortcut ${shortcut.id}:`, error);
					}
					break;
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		setIsListening(true);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			setIsListening(false);
		};
	}, [enabled, shortcuts, ignoreWhenFocusedIn]);

	return {
		isListening,
		addShortcut: useCallback((shortcut: KeyboardShortcut) => {
			// This would typically be handled by state management
			// For now, rely on the component to update the shortcuts array
		}, []),
		removeShortcut: useCallback((shortcutId: string) => {
			// This would typically be handled by state management
		}, []),
	};
}

/**
 * Hook for managing focus within a container
 */
export function useFocusManagement(
	containerRef: React.RefObject<HTMLElement>,
	options: KeyboardNavigationOptions = {}
) {
	const {
		loop = true,
		orientation = 'vertical',
		wrap = true,
		activateOnEnter = true,
		activateOnSpace = true,
		ignoreDisabled = true,
		skipInvisible = true,
	} = options;

	const [activeIndex, setActiveIndex] = useState(-1);
	const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
	const cleanupRef = useRef<(() => void) | null>(null);

	// Update focusable elements when container changes
	const updateFocusableElements = useCallback(() => {
		if (!containerRef.current) return;

		const elements = getFocusableElements(containerRef.current)
			.filter(item => {
				if (ignoreDisabled && item.disabled) return false;
				if (skipInvisible && item.hidden) return false;
				return true;
			})
			.map(item => item.element);

		setFocusableElements(elements);
	}, [containerRef, ignoreDisabled, skipInvisible]);

	useEffect(() => {
		updateFocusableElements();
	}, [updateFocusableElements]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		if (focusableElements.length === 0) return;

		const { key, shiftKey } = event;

		switch (key) {
			case 'ArrowDown':
				if (orientation === 'vertical' || orientation === 'both') {
					event.preventDefault();
					focusNextElement(containerRef.current!, 'next', { loop, wrap, ignoreDisabled, skipInvisible });
				}
				break;

			case 'ArrowUp':
				if (orientation === 'vertical' || orientation === 'both') {
					event.preventDefault();
					focusNextElement(containerRef.current!, 'previous', { loop, wrap, ignoreDisabled, skipInvisible });
				}
				break;

			case 'ArrowRight':
				if (orientation === 'horizontal' || orientation === 'both') {
					event.preventDefault();
					focusNextElement(containerRef.current!, 'next', { loop, wrap, ignoreDisabled, skipInvisible });
				}
				break;

			case 'ArrowLeft':
				if (orientation === 'horizontal' || orientation === 'both') {
					event.preventDefault();
					focusNextElement(containerRef.current!, 'previous', { loop, wrap, ignoreDisabled, skipInvisible });
				}
				break;

			case 'Home':
				event.preventDefault();
				focusFirstElement(containerRef.current!);
				break;

			case 'End':
				event.preventDefault();
				focusLastElement(containerRef.current!);
				break;

			case 'Tab':
				// Let browser handle tab navigation, but enforce boundaries if needed
				if (!wrap && !loop) {
					const isLast = activeIndex === focusableElements.length - 1;
					const isFirst = activeIndex === 0;

					if ((!shiftKey && isLast) || (shiftKey && isFirst)) {
						event.preventDefault();
						// Focus the appropriate boundary element
						if (shiftKey) {
							focusLastElement(containerRef.current!);
						} else {
							focusFirstElement(containerRef.current!);
						}
					}
				}
				break;

			case 'Enter':
				if (activateOnEnter) {
					const target = event.target as HTMLElement;
					if (target && target.click) {
						event.preventDefault();
						target.click();
					}
				}
				break;

			case ' ':
				if (activateOnSpace) {
					const target = event.target as HTMLElement;
					if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
						event.preventDefault();
						if (target.click) {
							target.click();
						}
					}
				}
				break;
		}
	}, [focusableElements, orientation, loop, wrap, activateOnEnter, activateOnSpace, ignoreDisabled, skipInvisible, activeIndex]);

	// Set up keyboard navigation
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener('keydown', handleKeyDown);

		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [containerRef, handleKeyDown]);

	// Track active index
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleFocus = () => {
			const activeElement = document.activeElement;
			if (activeElement && container.contains(activeElement)) {
				const index = focusableElements.indexOf(activeElement as HTMLElement);
				setActiveIndex(index);
			}
		};

		const handleBlur = () => {
			setActiveIndex(-1);
		};

		container.addEventListener('focusin', handleFocus);
		container.addEventListener('focusout', handleBlur);

		return () => {
			container.removeEventListener('focusin', handleFocus);
			container.removeEventListener('focusout', handleBlur);
		};
	}, [containerRef, focusableElements]);

	return {
		activeIndex,
		focusableElements,
		focusFirst: () => containerRef.current && focusFirstElement(containerRef.current),
		focusLast: () => containerRef.current && focusLastElement(containerRef.current),
		focusNext: () => containerRef.current && focusNextElement(containerRef.current, 'next', { loop, wrap }),
		focusPrevious: () => containerRef.current && focusNextElement(containerRef.current, 'previous', { loop, wrap }),
		updateFocusableElements,
	};
}

/**
 * Hook for managing focus traps (modals, dialogs, etc.)
 */
export function useFocusTrap(
	containerRef: React.RefObject<HTMLElement>,
	enabled: boolean = true
) {
	const [isTrapped, setIsTrapped] = useState(false);

	useEffect(() => {
		if (!enabled || !containerRef.current) {
			setIsTrapped(false);
			return;
		}

		const container = containerRef.current;
		const cleanup = trapFocus(container);
		setIsTrapped(true);

		return () => {
			cleanup();
			setIsTrapped(false);
		};
	}, [enabled, containerRef]);

	return {
		isTrapped,
	};
}

/**
 * Hook for roving tabindex pattern
 */
export function useRovingTabIndex(
	elements: HTMLElement[],
	options: KeyboardNavigationOptions = {}
) {
	const { orientation = 'vertical', activateOnEnter = true, activateOnSpace = true } = options;
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		if (elements.length === 0) return;

		// Set initial tabindex values
		const updateTabindex = (currentIndex: number) => {
			elements.forEach((element, index) => {
				element.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
			});
		};

		updateTabindex(activeIndex);

		// Handle keyboard navigation
		const handleKeyDown = (event: KeyboardEvent) => {
			const { key } = event;

			switch (key) {
				case 'ArrowDown':
				case 'ArrowRight':
					if (orientation === 'both' ||
						(orientation === 'vertical' && key === 'ArrowDown') ||
						(orientation === 'horizontal' && key === 'ArrowRight')) {
						event.preventDefault();
						const nextIndex = (activeIndex + 1) % elements.length;
						setActiveIndex(nextIndex);
						updateTabindex(nextIndex);
						elements[nextIndex].focus();
					}
					break;

				case 'ArrowUp':
				case 'ArrowLeft':
					if (orientation === 'both' ||
						(orientation === 'vertical' && key === 'ArrowUp') ||
						(orientation === 'horizontal' && key === 'ArrowLeft')) {
						event.preventDefault();
						const prevIndex = activeIndex === 0 ? elements.length - 1 : activeIndex - 1;
						setActiveIndex(prevIndex);
						updateTabindex(prevIndex);
						elements[prevIndex].focus();
					}
					break;

				case 'Home':
					event.preventDefault();
					setActiveIndex(0);
					updateTabindex(0);
					elements[0].focus();
					break;

				case 'End':
					event.preventDefault();
					setActiveIndex(elements.length - 1);
					updateTabindex(elements.length - 1);
					elements[elements.length - 1].focus();
					break;

				case 'Enter':
					if (activateOnEnter) {
						const target = event.target as HTMLElement;
						if (target.click) {
							event.preventDefault();
							target.click();
						}
					}
					break;

				case ' ':
					if (activateOnSpace) {
						const target = event.target as HTMLElement;
						if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
							event.preventDefault();
							if (target.click) {
								target.click();
							}
						}
					}
					break;
			}
		};

		// Handle focus changes to update current index
		const handleFocus = (event: FocusEvent) => {
			const target = event.target as HTMLElement;
			const index = elements.indexOf(target);
			if (index !== -1 && index !== activeIndex) {
				setActiveIndex(index);
				updateTabindex(index);
			}
		};

		// Add event listeners
		elements.forEach(element => {
			element.addEventListener('keydown', handleKeyDown);
			element.addEventListener('focus', handleFocus);
		});

		// Cleanup
		return () => {
			elements.forEach(element => {
				element.removeEventListener('keydown', handleKeyDown);
				element.removeEventListener('focus', handleFocus);
				element.removeAttribute('tabindex');
			});
		};
	}, [elements, activeIndex, orientation, activateOnEnter, activateOnSpace]);

	return {
		activeIndex,
		setActiveIndex,
	};
}

/**
 * Hook for managing keyboard navigation announcements
 */
export function useKeyboardAnnouncements() {
	const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
		announceToScreenReader(message, priority);
	}, []);

	const announceNavigation = useCallback((direction: string, itemName?: string) => {
		const message = itemName ? `Moved ${direction} to ${itemName}` : `Moved ${direction}`;
		announce(message);
	}, [announce]);

	const announceAction = useCallback((action: string, target?: string) => {
		const message = target ? `${action} ${target}` : action;
		announce(message, 'assertive');
	}, [announce]);

	const announceError = useCallback((error: string) => {
		announce(`Error: ${error}`, 'assertive');
	}, [announce]);

	const announceSuccess = useCallback((message: string) => {
		announce(message, 'polite');
	}, [announce]);

	return {
		announce,
		announceNavigation,
		announceAction,
		announceError,
		announceSuccess,
	};
}

/**
 * Hook for managing global keyboard navigation state
 */
export function useGlobalKeyboardNavigation() {
	const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
	const [isEnabled, setIsEnabled] = useState(true);

	const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
		setShortcuts(prev => [...prev.filter(s => s.id !== shortcut.id), shortcut]);
	}, []);

	const removeShortcut = useCallback((id: string) => {
		setShortcuts(prev => prev.filter(s => s.id !== id));
	}, []);

	const toggleShortcut = useCallback((id: string, enabled: boolean) => {
		setShortcuts(prev => prev.map(s =>
			s.id === id ? { ...s, enabled } : s
		));
	}, []);

	const enableShortcuts = useCallback(() => {
		setIsEnabled(true);
	}, []);

	const disableShortcuts = useCallback(() => {
		setIsEnabled(false);
	}, []);

	const getShortcutsByCategory = useCallback((category: KeyboardShortcut['category']) => {
		return shortcuts.filter(s => s.category === category && s.enabled !== false);
	}, [shortcuts]);

	return {
		shortcuts,
		isEnabled,
		addShortcut,
		removeShortcut,
		toggleShortcut,
		enableShortcuts,
		disableShortcuts,
		getShortcutsByCategory,
	};
}

/**
 * Hook for handling keyboard navigation in lists/grids
 */
export function useListKeyboardNavigation<T = any>(
	items: T[],
	containerRef: React.RefObject<HTMLElement>,
	getItemElement: (item: T, index: number) => HTMLElement | null,
	options: {
		orientation?: 'vertical' | 'horizontal' | 'grid';
		loop?: boolean;
		onSelect?: (item: T, index: number) => void;
		onActivate?: (item: T, index: number) => void;
		getItemLabel?: (item: T) => string;
	} = {}
) {
	const {
		orientation = 'vertical',
		loop = true,
		onSelect,
		onActivate,
		getItemLabel,
	} = options;

	const [selectedIndex, setSelectedIndex] = useState(-1);
	const { announce } = useKeyboardAnnouncements();

	// Get navigable elements
	const getNavigableElements = useCallback(() => {
		return items
			.map((item, index) => getItemElement(item, index))
			.filter((element): element is HTMLElement => element !== null);
	}, [items, getItemElement]);

	// Navigate to specific index
	const navigateTo = useCallback((index: number) => {
		const elements = getNavigableElements();
		if (index >= 0 && index < elements.length) {
			elements[index].focus();
			setSelectedIndex(index);

			if (getItemLabel) {
				const item = items[index];
				announce(`Selected ${getItemLabel(item)}`);
			}
		}
	}, [getNavigableElements, items, getItemLabel, announce]);

	// Navigate to next item
	const navigateNext = useCallback(() => {
		const elements = getNavigableElements();
		if (elements.length === 0) return;

		let nextIndex = selectedIndex + 1;
		if (nextIndex >= elements.length) {
			nextIndex = loop ? 0 : elements.length - 1;
		}

		navigateTo(nextIndex);
	}, [selectedIndex, getNavigableElements, loop, navigateTo]);

	// Navigate to previous item
	const navigatePrevious = useCallback(() => {
		const elements = getNavigableElements();
		if (elements.length === 0) return;

		let prevIndex = selectedIndex - 1;
		if (prevIndex < 0) {
			prevIndex = loop ? elements.length - 1 : 0;
		}

		navigateTo(prevIndex);
	}, [selectedIndex, getNavigableElements, loop, navigateTo]);

	// Handle keyboard events
	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		const elements = getNavigableElements();
		if (elements.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				if (orientation === 'vertical' || orientation === 'grid') {
					event.preventDefault();
					navigateNext();
				}
				break;

			case 'ArrowUp':
				if (orientation === 'vertical' || orientation === 'grid') {
					event.preventDefault();
					navigatePrevious();
				}
				break;

			case 'ArrowRight':
				if (orientation === 'horizontal' || orientation === 'grid') {
					event.preventDefault();
					navigateNext();
				}
				break;

			case 'ArrowLeft':
				if (orientation === 'horizontal' || orientation === 'grid') {
					event.preventDefault();
					navigatePrevious();
				}
				break;

			case 'Home':
				event.preventDefault();
				navigateTo(0);
				break;

			case 'End':
				event.preventDefault();
				navigateTo(elements.length - 1);
				break;

			case 'Enter':
			case ' ':
				if (selectedIndex >= 0 && selectedIndex < items.length) {
					event.preventDefault();
					const item = items[selectedIndex];

					if (onActivate) {
						onActivate(item, selectedIndex);
					}

					if (onSelect) {
						onSelect(item, selectedIndex);
					}
				}
				break;
		}
	}, [orientation, selectedIndex, items, navigateNext, navigatePrevious, navigateTo, onActivate, onSelect]);

	// Set up keyboard navigation
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener('keydown', handleKeyDown);
		return () => container.removeEventListener('keydown', handleKeyDown);
	}, [containerRef, handleKeyDown]);

	// Update selected index when focus changes
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleFocusIn = (event: FocusEvent) => {
			const target = event.target as HTMLElement;
			const elements = getNavigableElements();
			const index = elements.indexOf(target);
			if (index !== -1) {
				setSelectedIndex(index);
			}
		};

		const handleFocusOut = () => {
			setSelectedIndex(-1);
		};

		container.addEventListener('focusin', handleFocusIn);
		container.addEventListener('focusout', handleFocusOut);

		return () => {
			container.removeEventListener('focusin', handleFocusIn);
			container.removeEventListener('focusout', handleFocusOut);
		};
	}, [containerRef, getNavigableElements]);

	return {
		selectedIndex,
		navigateTo,
		navigateNext,
		navigatePrevious,
		selectFirst: () => navigateTo(0),
		selectLast: () => navigateTo(items.length - 1),
	};
}
