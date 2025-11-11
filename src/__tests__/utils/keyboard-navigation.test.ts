/**
 * Keyboard Navigation Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	isFocusable,
	getFocusableElements,
	focusNextElement,
	focusFirstElement,
	focusLastElement,
	trapFocus,
	matchesShortcut,
	shortcutToString,
	isMac,
	normalizeKeyName,
	createRovingTabIndex,
	announceToScreenReader,
} from '@/lib/keyboard-navigation/utils';

describe('Keyboard Navigation Utilities', () => {
	beforeEach(() => {
		// Setup test DOM
		document.body.innerHTML = '';
	});

	afterEach(() => {
		// Clean up test DOM
		document.body.innerHTML = '';
	});

	describe('isFocusable', () => {
		it('should return true for focusable elements', () => {
			const button = document.createElement('button');
			expect(isFocusable(button)).toBe(true);

			const input = document.createElement('input');
			expect(isFocusable(input)).toBe(true);

			const link = document.createElement('a');
			link.href = '#';
			expect(isFocusable(link)).toBe(true);
		});

		it('should return false for non-focusable elements', () => {
			const div = document.createElement('div');
			expect(isFocusable(div)).toBe(false);

			const span = document.createElement('span');
			expect(isFocusable(span)).toBe(false);

			const linkWithoutHref = document.createElement('a');
			expect(isFocusable(linkWithoutHref)).toBe(false);
		});

		it('should return false for disabled elements', () => {
			const button = document.createElement('button');
			button.disabled = true;
			expect(isFocusable(button)).toBe(false);

			const input = document.createElement('input');
			input.disabled = true;
			expect(isFocusable(input)).toBe(false);
		});

		it('should return true for elements with tabindex', () => {
			const div = document.createElement('div');
			div.tabIndex = 0;
			expect(isFocusable(div)).toBe(true);
		});

		it('should return false for elements with negative tabindex', () => {
			const button = document.createElement('button');
			button.tabIndex = -1;
			expect(isFocusable(button)).toBe(false);
		});
	});

	describe('getFocusableElements', () => {
		it('should return all focusable elements in container', () => {
			const container = document.createElement('div');
			container.innerHTML = `
				<button>Button 1</button>
				<input type="text" />
				<a href="#">Link</a>
				<div>Not focusable</div>
				<button disabled>Disabled</button>
			`;
			document.body.appendChild(container);

			const focusable = getFocusableElements(container);
			expect(focusable).toHaveLength(3); // 2 buttons + 1 input + 1 link (disabled button excluded)
		});

		it('should exclude elements with tabindex="-1"', () => {
			const container = document.createElement('div');
			container.innerHTML = `
				<button>Button 1</button>
				<button tabindex="-1">Button 2</button>
				<input type="text" />
			`;
			document.body.appendChild(container);

			const focusable = getFocusableElements(container);
			expect(focusable).toHaveLength(2);
		});

		it('should include elements with tabindex="0"', () => {
			const container = document.createElement('div');
			container.innerHTML = `
				<div tabindex="0">Focusable div</div>
				<button>Button</button>
			`;
			document.body.appendChild(container);

			const focusable = getFocusableElements(container);
			expect(focusable).toHaveLength(2);
		});
	});

	describe('focusNextElement', () => {
		beforeEach(() => {
			const container = document.createElement('div');
			container.innerHTML = `
				<button>Button 1</button>
				<button>Button 2</button>
				<button>Button 3</button>
			`;
			document.body.appendChild(container);
		});

		it('should focus the next element', () => {
			const container = document.body.querySelector('div')!;
			const buttons = container.querySelectorAll('button');

			buttons[0].focus();
			expect(document.activeElement).toBe(buttons[0]);

			focusNextElement(container);
			expect(document.activeElement).toBe(buttons[1]);
		});

		it('should wrap to first element when at end', () => {
			const container = document.body.querySelector('div')!;
			const buttons = container.querySelectorAll('button');

			buttons[2].focus();
			expect(document.activeElement).toBe(buttons[2]);

			focusNextElement(container);
			expect(document.activeElement).toBe(buttons[0]);
		});

		it('should not wrap when wrap is false', () => {
			const container = document.body.querySelector('div')!;
			const buttons = container.querySelectorAll('button');

			buttons[2].focus();
			expect(document.activeElement).toBe(buttons[2]);

			focusNextElement(container, 'next', { wrap: false });
			expect(document.activeElement).toBe(buttons[2]); // Should stay on last element
		});
	});

	describe('focusFirstElement and focusLastElement', () => {
		beforeEach(() => {
			const container = document.createElement('div');
			container.innerHTML = `
				<button>Button 1</button>
				<button>Button 2</button>
				<button>Button 3</button>
			`;
			document.body.appendChild(container);
		});

		it('should focus first element', () => {
			const container = document.body.querySelector('div')!;
			const buttons = container.querySelectorAll('button');

			focusFirstElement(container);
			expect(document.activeElement).toBe(buttons[0]);
		});

		it('should focus last element', () => {
			const container = document.body.querySelector('div')!;
			const buttons = container.querySelectorAll('button');

			focusLastElement(container);
			expect(document.activeElement).toBe(buttons[2]);
		});
	});

	describe('trapFocus', () => {
		it('should trap focus within container', () => {
			const container = document.createElement('div');
			container.innerHTML = `
				<button>Button 1</button>
				<button>Button 2</button>
				<button>Button 3</button>
			`;
			document.body.appendChild(container);

			const buttons = container.querySelectorAll('button');
			const cleanup = trapFocus(container);

			// Focus should be on first element initially
			expect(document.activeElement).toBe(buttons[0]);

			// Tab should cycle through elements
			const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
			buttons[0].dispatchEvent(tabEvent);
			expect(document.activeElement).toBe(buttons[1]);

			// Shift+Tab should go backwards
			const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
			buttons[1].dispatchEvent(shiftTabEvent);
			expect(document.activeElement).toBe(buttons[0]);

			cleanup();
		});

		it('should return cleanup function', () => {
			const container = document.createElement('div');
			container.innerHTML = '<button>Button</button>';
			document.body.appendChild(container);

			const cleanup = trapFocus(container);
			expect(typeof cleanup).toBe('function');

			// Should not throw when called
			expect(() => cleanup()).not.toThrow();
		});
	});

	describe('matchesShortcut', () => {
		it('should match simple shortcuts', () => {
			const event = new KeyboardEvent('keydown', { key: 'Enter' });
			const shortcut = { key: 'Enter', modifiers: {} };

			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('should match shortcuts with modifiers', () => {
			const event = new KeyboardEvent('keydown', {
				key: 's',
				ctrlKey: true,
				shiftKey: false
			});
			const shortcut = {
				key: 's',
				modifiers: { ctrl: true, shift: false }
			};

			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('should not match when modifiers differ', () => {
			const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
			const shortcut = { key: 's', modifiers: { ctrl: false } };

			expect(matchesShortcut(event, shortcut)).toBe(false);
		});

		it('should not match when keys differ', () => {
			const event = new KeyboardEvent('keydown', { key: 'Enter' });
			const shortcut = { key: 'Escape', modifiers: {} };

			expect(matchesShortcut(event, shortcut)).toBe(false);
		});
	});

	describe('shortcutToString', () => {
		it('should convert simple shortcut to string', () => {
			const shortcut = { key: 'Enter', modifiers: {} };
			expect(shortcutToString(shortcut)).toBe('Enter');
		});

		it('should convert shortcut with modifiers to string', () => {
			const shortcut = {
				key: 's',
				modifiers: { ctrl: true, shift: true }
			};
			expect(shortcutToString(shortcut)).toBe('Ctrl + Shift + s');
		});

		it('should handle meta key correctly', () => {
			const shortcut = {
				key: 'c',
				modifiers: { meta: true }
			};

			// Mock isMac to return true
			vi.spyOn(require('@/lib/keyboard-navigation/utils'), 'isMac').mockReturnValue(true);

			expect(shortcutToString(shortcut)).toBe('Cmd + c');
		});
	});

	describe('normalizeKeyName', () => {
		it('should normalize key names', () => {
			expect(normalizeKeyName('escape')).toBe('Escape');
			expect(normalizeKeyName(' ')).toBe('Space');
			expect(normalizeKeyName('arrowup')).toBe('ArrowUp');
			expect(normalizeKeyName('Enter')).toBe('Enter');
		});
	});

	describe('createRovingTabIndex', () => {
		it('should create roving tabindex for elements', () => {
			const container = document.createElement('div');
			container.innerHTML = `
				<button>Button 1</button>
				<button>Button 2</button>
				<button>Button 3</button>
			`;
			document.body.appendChild(container);

			const elements = Array.from(container.querySelectorAll('button'));
			const { destroy } = createRovingTabIndex(elements);

			// First element should have tabindex="0"
			expect(elements[0].getAttribute('tabindex')).toBe('0');
			expect(elements[1].getAttribute('tabindex')).toBe('-1');
			expect(elements[2].getAttribute('tabindex')).toBe('-1');

			// Test keyboard navigation
			const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
			elements[0].dispatchEvent(arrowDownEvent);

			// Focus should move to next element
			expect(document.activeElement).toBe(elements[1]);

			destroy();

			// Tabindex should be cleaned up
			expect(elements[0].hasAttribute('tabindex')).toBe(false);
		});
	});

	describe('announceToScreenReader', () => {
		it('should create live region and announce message', () => {
			const createSpy = vi.spyOn(document, 'createElement');
			const appendSpy = vi.spyOn(document.body, 'appendChild');

			announceToScreenReader('Test message');

			expect(createSpy).toHaveBeenCalledWith('div');
			expect(appendSpy).toHaveBeenCalled();

			const liveRegion = document.getElementById('keyboard-navigation-live-region');
			expect(liveRegion).toBeTruthy();
			expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
			expect(liveRegion?.textContent).toBe('Test message');

			createSpy.mockRestore();
			appendSpy.mockRestore();
		});

		it('should reuse existing live region', () => {
			// Create initial live region
			announceToScreenReader('First message');
			const liveRegion = document.getElementById('keyboard-navigation-live-region');
			const createSpy = vi.spyOn(document, 'createElement');

			announceToScreenReader('Second message');

			// Should not create another element
			expect(createSpy).not.toHaveBeenCalled();
			expect(liveRegion?.textContent).toBe('Second message');

			createSpy.mockRestore();
		});
	});

	describe('edge cases', () => {
		it('should handle empty containers gracefully', () => {
			const container = document.createElement('div');

			expect(getFocusableElements(container)).toHaveLength(0);
			expect(focusFirstElement(container)).toBe(false);
			expect(focusLastElement(container)).toBe(false);
			expect(focusNextElement(container)).toBe(false);
		});

		it('should handle non-existent elements', () => {
			const nonExistent = document.createElement('div');
			expect(isFocusable(nonExistent)).toBe(false);
		});

		it('should handle complex keyboard events', () => {
			const complexEvent = new KeyboardEvent('keydown', {
				key: 'a',
				ctrlKey: true,
				shiftKey: true,
				altKey: false,
				metaKey: false,
			});

			const shortcut = {
				key: 'a',
				modifiers: { ctrl: true, shift: true, alt: false }
			};

			expect(matchesShortcut(complexEvent, shortcut)).toBe(true);
		});
	});
});
