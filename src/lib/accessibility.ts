/**
 * Accessibility Utilities
 * Provides helper functions for accessibility compliance and screen reader support
 */

import { useEffect, useRef, useState } from 'react';

// Accessibility utility functions
export const accessibilityUtils = {
	/**
	 * Check if user prefers reduced motion
	 */
	prefersReducedMotion(): boolean {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	},

	/**
	 * Check if user prefers high contrast
	 */
	prefersHighContrast(): boolean {
		if (typeof window === 'undefined') return false;
		return (
			window.matchMedia('(prefers-contrast: high)').matches || window.matchMedia('(forced-colors: active)').matches
		);
	},

	/**
	 * Check if screen reader is being used
	 */
	detectScreenReader(): boolean {
		if (typeof window === 'undefined') return false;

		// Check for screen reader indicators
		const hasScreenReaderStyles =
			window.getComputedStyle(document.body).getPropertyValue('--screen-reader-detected') === 'true';
		const hasAriaLiveElements = document.querySelectorAll('[aria-live]').length > 0;

		return hasScreenReaderStyles || hasAriaLiveElements;
	},

	/**
	 * Check if user is navigating with keyboard
	 */
	isKeyboardNavigation(): boolean {
		if (typeof document === 'undefined') return false;
		return (
			document.body.classList.contains('keyboard-navigation') || document.body.classList.contains('using-keyboard')
		);
	},

	/**
	 * Announce message to screen readers
	 */
	announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
		if (typeof document === 'undefined') return;

		// Remove existing announcements
		const existing = document.querySelectorAll('.sr-announcement');
		existing.forEach((el) => el.remove());

		// Create announcement element
		const announcement = document.createElement('div');
		announcement.setAttribute('aria-live', priority);
		announcement.setAttribute('aria-atomic', 'true');
		announcement.className = 'sr-announcement';
		announcement.style.position = 'absolute';
		announcement.style.left = '-10000px';
		announcement.style.width = '1px';
		announcement.style.height = '1px';
		announcement.style.overflow = 'hidden';

		document.body.appendChild(announcement);
		announcement.textContent = message;

		// Remove after announcement
		setTimeout(() => {
			if (announcement.parentNode) {
				announcement.parentNode.removeChild(announcement);
			}
		}, 1000);
	},

	/**
	 * Set focus to element with proper scrolling
	 */
	setFocus(element: HTMLElement, scrollIntoView = true): void {
		if (!element) return;

		// Add focus indicator class
		element.classList.add('keyboard-focused');

		// Set focus
		element.focus();

		// Scroll into view if requested
		if (scrollIntoView) {
			element.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest',
			});
		}

		// Remove focus indicator after blur
		const removeFocus = () => {
			element.classList.remove('keyboard-focused');
			element.removeEventListener('blur', removeFocus);
		};
		element.addEventListener('blur', removeFocus);
	},

	/**
	 * Generate unique ID for accessibility attributes
	 */
	generateId(prefix = 'acc'): string {
		return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
	},

	/**
	 * Get accessible description for an element
	 */
	getAccessibleDescription(element: HTMLElement): string {
		const describedBy = element.getAttribute('aria-describedby');
		if (describedBy) {
			const describedElement = document.getElementById(describedBy);
			if (describedElement) {
				return describedElement.textContent || '';
			}
		}

		// Fallback to title or placeholder
		return (
			element.getAttribute('title') || element.getAttribute('placeholder') || element.getAttribute('aria-label') || ''
		);
	},

	/**
	 * Check if element has proper color contrast
	 */
	checkColorContrast(element: HTMLElement): { ratio: number; passes: boolean; wcagLevel: 'AA' | 'AAA' | 'fail' } {
		const styles = window.getComputedStyle(element);
		const color = styles.color;
		const backgroundColor = styles.backgroundColor;

		// Parse colors to RGB
		const colorRgb = this.parseColor(color);
		const bgRgb = this.parseColor(backgroundColor);

		// Calculate contrast ratio
		const contrastRatio = this.calculateContrastRatio(colorRgb, bgRgb);

		// Check WCAG compliance
		const passesAA = contrastRatio >= 4.5;
		const passesAAA = contrastRatio >= 7.0;

		return {
			ratio: contrastRatio,
			passes: passesAA || passesAAA,
			wcagLevel: passesAAA ? 'AAA' : passesAA ? 'AA' : 'fail',
		};
	},

	/**
	 * Parse color string to RGB
	 */
	parseColor(color: string): { r: number; g: number; b: number } {
		const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		if (match) {
			return {
				r: parseInt(match[1]),
				g: parseInt(match[2]),
				b: parseInt(match[3]),
			};
		}

		// Handle hex colors
		const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
		if (hexMatch) {
			const hex = hexMatch[1];
			return {
				r: parseInt(hex.substr(0, 2), 16),
				g: parseInt(hex.substr(2, 2), 16),
				b: parseInt(hex.substr(4, 2), 16),
			};
		}

		return { r: 0, g: 0, b: 0 };
	},

	/**
	 * Calculate contrast ratio between two colors
	 */
	calculateContrastRatio(
		color1: { r: number; g: number; b: number },
		color2: { r: number; g: number; b: number },
	): number {
		const [l1, l2] = [color1, color2].map((color) => {
			const [rs, gs, bs] = [color.r, color.g, color.b].map((c) => {
				c = c / 255;
				return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
		});

		const lighter = Math.max(l1, l2);
		const darker = Math.min(l1, l2);

		return (lighter + 0.05) / (darker + 0.05);
	},

	/**
	 * Trap focus within a container
	 */
	trapFocus(container: HTMLElement): () => void {
		const focusableElements = container.querySelectorAll(
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		) as NodeListOf<HTMLElement>;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		const handleTabKey = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					lastElement.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === lastElement) {
					firstElement.focus();
					e.preventDefault();
				}
			}
		};

		container.addEventListener('keydown', handleTabKey);

		// Return cleanup function
		return () => {
			container.removeEventListener('keydown', handleTabKey);
		};
	},

	/**
	 * Add keyboard navigation styles
	 */
	addKeyboardNavigationStyles(): void {
		if (typeof document === 'undefined') return;

		// Add keyboard navigation detection
		const handleMouseDown = () => {
			document.body.classList.remove('keyboard-navigation');
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Tab') {
				document.body.classList.add('keyboard-navigation');
			}
		};

		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('keydown', handleKeyDown);

		// Add focus styles if they don't exist
		if (!document.getElementById('accessibility-focus-styles')) {
			const style = document.createElement('style');
			style.id = 'accessibility-focus-styles';
			style.textContent = `
        .keyboard-navigation *:focus {
          outline: 2px solid var(--primary, #135bec) !important;
          outline-offset: 2px !important;
        }

        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        .skip-link {
          position: absolute !important;
          top: -40px !important;
          left: 6px !important;
          background: var(--primary, #135bec) !important;
          color: white !important;
          padding: 8px !important;
          text-decoration: none !important;
          z-index: 1000 !important;
          border-radius: 4px !important;
        }

        .skip-link:focus {
          top: 6px !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `;
			document.head.appendChild(style);
		}
	},

	/**
	 * Remove keyboard navigation styles
	 */
	removeKeyboardNavigationStyles(): void {
		document.body.classList.remove('keyboard-navigation');
	},
};

// React hook for accessibility features
export function useAccessibility() {
	const [preferences, setPreferences] = useState({
		reducedMotion: false,
		highContrast: false,
		screenReader: false,
		keyboardNavigation: false,
	});

	useEffect(() => {
		// Check initial preferences
		const updatePreferences = () => {
			setPreferences({
				reducedMotion: accessibilityUtils.prefersReducedMotion(),
				highContrast: accessibilityUtils.prefersHighContrast(),
				screenReader: accessibilityUtils.detectScreenReader(),
				keyboardNavigation: accessibilityUtils.isKeyboardNavigation(),
			});
		};

		updatePreferences();
		accessibilityUtils.addKeyboardNavigationStyles();

		// Listen for changes
		const mediaQueries = [
			window.matchMedia('(prefers-reduced-motion: reduce)'),
			window.matchMedia('(prefers-contrast: high)'),
			window.matchMedia('(forced-colors: active)'),
		];

		mediaQueries.forEach((mq) => {
			if (mq.addEventListener) {
				mq.addEventListener('change', updatePreferences);
			} else {
				// Fallback for older browsers
				mq.addListener(updatePreferences);
			}
		});

		return () => {
			mediaQueries.forEach((mq) => {
				if (mq.removeEventListener) {
					mq.removeEventListener('change', updatePreferences);
				} else {
					mq.removeListener(updatePreferences);
				}
			});
			accessibilityUtils.removeKeyboardNavigationStyles();
		};
	}, []);

	return {
		preferences,
		announce: accessibilityUtils.announceToScreenReader,
		setFocus: accessibilityUtils.setFocus,
		generateId: accessibilityUtils.generateId,
		trapFocus: accessibilityUtils.trapFocus,
		checkColorContrast: accessibilityUtils.checkColorContrast,
	};
}

// React hook for focus management
export function useFocusManagement(initialRef?: React.RefObject<HTMLElement>) {
	const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
	const focusRef = useRef<HTMLElement>(null);

	const setFocus = (element: HTMLElement | null) => {
		if (element) {
			accessibilityUtils.setFocus(element);
			setFocusedElement(element);
			focusRef.current = element;
		}
	};

	const trapFocus = (container: HTMLElement | null) => {
		if (!container) return () => {};
		return accessibilityUtils.trapFocus(container);
	};

	const restoreFocus = () => {
		if (focusRef.current && focusRef.current.focus) {
			focusRef.current.focus();
		}
	};

	useEffect(() => {
		if (initialRef?.current) {
			focusRef.current = initialRef.current;
		}
	}, [initialRef]);

	return {
		focusedElement,
		setFocus,
		trapFocus,
		restoreFocus,
		focusRef,
	};
}

// React hook for screen reader announcements
export function useScreenReader() {
	const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
		accessibilityUtils.announceToScreenReader(message, priority);
	};

	const announceError = (message: string) => {
		announce(`Error: ${message}`, 'assertive');
	};

	const announceSuccess = (message: string) => {
		announce(`Success: ${message}`, 'polite');
	};

	const announceProgress = (message: string) => {
		announce(message, 'polite');
	};

	return {
		announce,
		announceError,
		announceSuccess,
		announceProgress,
	};
}

// React hook for ARIA attributes
export function useAria() {
	const generateId = (prefix = 'aria') => {
		return accessibilityUtils.generateId(prefix);
	};

	const createDescribedBy = (...ids: (string | undefined)[]) => {
		return ids.filter(Boolean).join(' ') || undefined;
	};

	const createLabelledBy = (...ids: (string | undefined)[]) => {
		return ids.filter(Boolean).join(' ') || undefined;
	};

	const getAriaProps = (
		label?: string,
		description?: string,
		required?: boolean,
		invalid?: boolean,
		expanded?: boolean,
		selected?: boolean,
		disabled?: boolean,
	) => {
		const id = generateId();
		const labelId = label ? `${id}-label` : undefined;
		const descriptionId = description ? `${id}-description` : undefined;

		return {
			id,
			'aria-label': label,
			'aria-labelledby': labelId,
			'aria-describedby': descriptionId,
			'aria-required': required,
			'aria-invalid': invalid,
			'aria-expanded': expanded,
			'aria-selected': selected,
			'aria-disabled': disabled,
		};
	};

	return {
		generateId,
		createDescribedBy,
		createLabelledBy,
		getAriaProps,
	};
}

// React hook for keyboard shortcuts
export function useKeyboardShortcuts(
	shortcuts: Record<string, (event: KeyboardEvent) => void>,
	options: {
		preventDefault?: boolean;
		stopPropagation?: boolean;
		target?: HTMLElement | Document;
	} = {},
) {
	const { preventDefault = true, stopPropagation = true, target = document } = options;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const key = [
				event.ctrlKey && 'ctrl',
				event.altKey && 'alt',
				event.shiftKey && 'shift',
				event.metaKey && 'meta',
				event.key.toLowerCase(),
			]
				.filter(Boolean)
				.join('+');

			const handler = shortcuts[key];
			if (handler) {
				if (preventDefault) event.preventDefault();
				if (stopPropagation) event.stopPropagation();
				handler(event);
			}
		};

		target.addEventListener('keydown', handleKeyDown);

		return () => {
			target.removeEventListener('keydown', handleKeyDown);
		};
	}, [shortcuts, preventDefault, stopPropagation, target]);
}

export default accessibilityUtils;
