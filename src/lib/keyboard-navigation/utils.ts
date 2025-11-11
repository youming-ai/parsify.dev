/**
 * Keyboard Navigation Utilities
 * Core utilities for enhanced keyboard navigation across the platform
 */

export type KeyboardKey =
	| 'Enter'
	| 'Space'
	| 'Escape'
	| 'Tab'
	| 'ArrowUp'
	| 'ArrowDown'
	| 'ArrowLeft'
	| 'ArrowRight'
	| 'Home'
	| 'End'
	| 'PageUp'
	| 'PageDown'
	| 'Delete'
	| 'Backspace'
	| 'a'
	| 'c'
	| 'v'
	| 'x'
	| 'z'
	| 'y'
	| 'f'
	| 'g'
	| 'h'
	| 'j'
	| 'k'
	| 'l'
	| 's'
	| 'r'
	| 'n'
	| 'p'
	| 'b'
	| 't';

export interface KeyboardShortcut {
	id: string;
	key: KeyboardKey;
	modifiers: {
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		meta?: boolean; // Cmd on Mac, Ctrl on Windows
	};
	description: string;
	category: 'global' | 'navigation' | 'editing' | 'tool' | 'accessibility';
	action: (event: KeyboardEvent) => void | Promise<void>;
	enabled?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
	condition?: () => boolean;
}

export interface KeyboardNavigationOptions {
	loop?: boolean;
	orientation?: 'horizontal' | 'vertical' | 'both';
	wrap?: boolean;
	activateOnEnter?: boolean;
	activateOnSpace?: boolean;
	ignoreDisabled?: boolean;
	 skipInvisible?: boolean;
}

export interface FocusableElement {
	element: HTMLElement;
	index: number;
	disabled?: boolean;
	hidden?: boolean;
	focusable: boolean;
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
	if (!element || element.disabled) {
		return false;
	}

	// Check visibility
	const style = window.getComputedStyle(element);
	if (style.display === 'none' || style.visibility === 'hidden') {
		return false;
	}

	// Check tabindex
	const tabindex = element.getAttribute('tabindex');
	if (tabindex && parseInt(tabindex, 10) < 0) {
		return false;
	}

	// Check if element is focusable by nature or has tabindex
	const focusableTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
	const isNativelyFocusable = focusableTags.includes(element.tagName.toLowerCase());
	const hasTabindex = element.hasAttribute('tabindex');

	return isNativelyFocusable || hasTabindex;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): FocusableElement[] {
	const focusableSelectors = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'details summary',
		'[tabindex]:not([tabindex="-1"])',
		'[contenteditable="true"]',
	];

	const elements: FocusableElement[] = [];
	const nodeList = container.querySelectorAll(focusableSelectors.join(', '));

	nodeList.forEach((element, index) => {
		const htmlElement = element as HTMLElement;
		const style = window.getComputedStyle(htmlElement);
		const disabled = htmlElement.hasAttribute('disabled');
		const hidden = style.display === 'none' || style.visibility === 'hidden';

		elements.push({
			element: htmlElement,
			index,
			disabled,
			hidden,
			focusable: !disabled && !hidden && isFocusable(htmlElement),
		});
	});

	return elements.filter(item => item.focusable);
}

/**
 * Get the current focus index within a container
 */
export function getCurrentFocusIndex(container: HTMLElement): number {
	const focusableElements = getFocusableElements(container);
	const activeElement = document.activeElement;

	if (!activeElement || !container.contains(activeElement)) {
		return -1;
	}

	return focusableElements.findIndex(item => item.element === activeElement);
}

/**
 * Focus the next or previous focusable element
 */
export function focusNextElement(
	container: HTMLElement,
	direction: 'next' | 'previous' = 'next',
	options: KeyboardNavigationOptions = {}
): boolean {
	const {
		loop = true,
		wrap = true,
		ignoreDisabled = true,
		skipInvisible = true,
	} = options;

	const focusableElements = getFocusableElements(container).filter(item => {
		if (ignoreDisabled && item.disabled) return false;
		if (skipInvisible && item.hidden) return false;
		return true;
	});

	if (focusableElements.length === 0) {
		return false;
	}

	const currentIndex = getCurrentFocusIndex(container);
	let nextIndex = currentIndex;

	if (direction === 'next') {
		nextIndex = currentIndex + 1;
		if (nextIndex >= focusableElements.length) {
			nextIndex = wrap ? 0 : focusableElements.length - 1;
		}
	} else {
		nextIndex = currentIndex - 1;
		if (nextIndex < 0) {
			nextIndex = wrap ? focusableElements.length - 1 : 0;
		}
	}

	// If we're back to the same element and loop is enabled, continue searching
	if (nextIndex === currentIndex && loop) {
		return false; // No valid focus target found
	}

	const targetElement = focusableElements[nextIndex];
	if (targetElement) {
		targetElement.element.focus();
		return true;
	}

	return false;
}

/**
 * Focus first focusable element in container
 */
export function focusFirstElement(container: HTMLElement): boolean {
	const focusableElements = getFocusableElements(container);
	if (focusableElements.length === 0) {
		return false;
	}

	focusableElements[0].element.focus();
	return true;
}

/**
 * Focus last focusable element in container
 */
export function focusLastElement(container: HTMLElement): boolean {
	const focusableElements = getFocusableElements(container);
	if (focusableElements.length === 0) {
		return false;
	}

	focusableElements[focusableElements.length - 1].element.focus();
	return true;
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement): () => void {
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Tab') {
			const focusableElements = getFocusableElements(container);
			if (focusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			const currentIndex = getCurrentFocusIndex(container);
			const isFirst = currentIndex === 0;
			const isLast = currentIndex === focusableElements.length - 1;

			if (event.shiftKey) {
				// Shift + Tab (previous)
				if (isFirst) {
					event.preventDefault();
					focusableElements[focusableElements.length - 1].element.focus();
				}
			} else {
				// Tab (next)
				if (isLast) {
					event.preventDefault();
					focusableElements[0].element.focus();
				}
			}
		}
	};

	container.addEventListener('keydown', handleKeyDown);

	// Focus the first element
	focusFirstElement(container);

	// Return cleanup function
	return () => {
		container.removeEventListener('keydown', handleKeyDown);
	};
}

/**
 * Check if keyboard event matches a shortcut
 */
export function matchesShortcut(
	event: KeyboardEvent,
	shortcut: Pick<KeyboardShortcut, 'key' | 'modifiers'>
): boolean {
	const { key, modifiers } = shortcut;

	// Check key
	if (event.key.toLowerCase() !== key.toLowerCase()) {
		return false;
	}

	// Check modifiers
	if (modifiers.ctrl && !event.ctrlKey) return false;
	if (modifiers.shift && !event.shiftKey) return false;
	if (modifiers.alt && !event.altKey) return false;
	if (modifiers.meta && !event.metaKey) return false;

	// Check that extra modifiers aren't pressed
	if (!modifiers.ctrl && event.ctrlKey) return false;
	if (!modifiers.shift && event.shiftKey) return false;
	if (!modifiers.alt && event.altKey) return false;
	if (!modifiers.meta && event.metaKey) return false;

	return true;
}

/**
 * Convert keyboard shortcut to display string
 */
export function shortcutToString(shortcut: Pick<KeyboardShortcut, 'key' | 'modifiers'>): string {
	const parts: string[] = [];
	const { key, modifiers } = shortcut;

	if (modifiers.ctrl) parts.push('Ctrl');
	if (modifiers.shift) parts.push('Shift');
	if (modifiers.alt) parts.push('Alt');
	if (modifiers.meta) parts.push(isMac() ? 'Cmd' : 'Win');

	parts.push(key);

	return parts.join(' + ');
}

/**
 * Check if running on Mac
 */
export function isMac(): boolean {
	return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Get platform-specific modifier key name
 */
export function getPlatformModifierKey(): string {
	return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Normalize key name for cross-platform compatibility
 */
export function normalizeKeyName(key: string): KeyboardKey {
	const keyMap: Record<string, KeyboardKey> = {
		' ': 'Space',
		'escape': 'Escape',
		'tab': 'Tab',
		'arrowup': 'ArrowUp',
		'arrowdown': 'ArrowDown',
		'arrowleft': 'ArrowLeft',
		'arrowright': 'ArrowRight',
		'home': 'Home',
		'end': 'End',
		'pageup': 'PageUp',
		'pagedown': 'PageDown',
		'delete': 'Delete',
		'backspace': 'Backspace',
		'enter': 'Enter',
		'return': 'Enter',
	};

	const lowerKey = key.toLowerCase();
	return keyMap[lowerKey] || (lowerKey as KeyboardKey);
}

/**
 * Check if element is within a focus trap
 */
export function isInFocusTrap(element: HTMLElement): boolean {
	let current = element.parentElement;

	while (current && current !== document.body) {
		if (current.hasAttribute('data-focus-trap')) {
			return true;
		}
		current = current.parentElement;
	}

	return false;
}

/**
 * Get all focus trap containers
 */
export function getFocusTrapContainers(): HTMLElement[] {
	return Array.from(document.querySelectorAll('[data-focus-trap]')) as HTMLElement[];
}

/**
 * Create roving tabindex for keyboard navigation
 */
export function createRovingTabIndex(
	elements: HTMLElement[],
	options: KeyboardNavigationOptions = {}
): { destroy: () => void } {
	const { orientation = 'vertical', activateOnEnter = true, activateOnSpace = true } = options;
	let currentIndex = 0;

	// Set initial tabindex values
	function updateTabindex() {
		elements.forEach((element, index) => {
			element.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
		});
	}

	// Handle keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		const { key } = event;

		switch (key) {
			case 'ArrowDown':
			case 'ArrowRight':
				if (orientation === 'both' ||
					(orientation === 'vertical' && key === 'ArrowDown') ||
					(orientation === 'horizontal' && key === 'ArrowRight')) {
					event.preventDefault();
					currentIndex = (currentIndex + 1) % elements.length;
					updateTabindex();
					elements[currentIndex].focus();
				}
				break;

			case 'ArrowUp':
			case 'ArrowLeft':
				if (orientation === 'both' ||
					(orientation === 'vertical' && key === 'ArrowUp') ||
					(orientation === 'horizontal' && key === 'ArrowLeft')) {
					event.preventDefault();
					currentIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
					updateTabindex();
					elements[currentIndex].focus();
				}
				break;

			case 'Home':
				event.preventDefault();
				currentIndex = 0;
				updateTabindex();
				elements[currentIndex].focus();
				break;

			case 'End':
				event.preventDefault();
				currentIndex = elements.length - 1;
				updateTabindex();
				elements[currentIndex].focus();
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
	}

	// Handle focus changes to update current index
	function handleFocus(event: FocusEvent) {
		const target = event.target as HTMLElement;
		const index = elements.indexOf(target);
		if (index !== -1 && index !== currentIndex) {
			currentIndex = index;
			updateTabindex();
		}
	}

	// Initialize
	updateTabindex();

	// Add event listeners
	elements.forEach(element => {
		element.addEventListener('keydown', handleKeyDown);
		element.addEventListener('focus', handleFocus);
	});

	// Return cleanup function
	return {
		destroy() {
			elements.forEach(element => {
				element.removeEventListener('keydown', handleKeyDown);
				element.removeEventListener('focus', handleFocus);
				element.removeAttribute('tabindex');
			});
		}
	};
}

/**
 * Announce messages to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
	// Create or get the live region
	let liveRegion = document.getElementById('keyboard-navigation-live-region');
	if (!liveRegion) {
		liveRegion = document.createElement('div');
		liveRegion.id = 'keyboard-navigation-live-region';
		liveRegion.setAttribute('aria-live', priority);
		liveRegion.setAttribute('aria-atomic', 'true');
		liveRegion.className = 'sr-only';
		document.body.appendChild(liveRegion);
	}

	// Update the aria-live politeness level
	liveRegion.setAttribute('aria-live', priority);

	// Clear and announce
	liveRegion.textContent = '';

	// Use a small delay to ensure screen readers register the change
	setTimeout(() => {
		if (liveRegion) {
			liveRegion.textContent = message;
		}
	}, 100);
}

/**
 * Debounce function for keyboard events
 */
export function debounceKeyboard<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>) => {
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			func(...args);
		}, wait);
	};
}

/**
 * Throttle function for keyboard events
 */
export function throttleKeyboard<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle = false;

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}
