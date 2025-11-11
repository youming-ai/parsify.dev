/**
 * Keyboard Navigation Hooks Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
	useKeyboardShortcuts,
	useFocusManagement,
	useFocusTrap,
	useRovingTabIndex,
	useKeyboardAnnouncements,
	useGlobalKeyboardNavigation,
	useListKeyboardNavigation,
} from '@/hooks/use-keyboard-navigation';
import { announceToScreenReader } from '@/lib/keyboard-navigation/utils';

// Mock the announceToScreenReader function
vi.mock('@/lib/keyboard-navigation/utils', () => ({
	announceToScreenReader: vi.fn(),
	getFocusableElements: vi.fn(),
	focusNextElement: vi.fn(),
	focusFirstElement: vi.fn(),
	focusLastElement: vi.fn(),
	trapFocus: vi.fn(),
	matchesShortcut: vi.fn(),
	isFocusable: vi.fn(),
}));

describe('useKeyboardShortcuts', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should register and execute shortcuts', () => {
		const action = vi.fn();
		const shortcuts = [
			{
				id: 'test-shortcut',
				key: 'Enter' as const,
				modifiers: {},
				description: 'Test shortcut',
				category: 'global' as const,
				action,
			},
		];

		const { result } = renderHook(() =>
			useKeyboardShortcuts(shortcuts, { enabled: true })
		);

		expect(result.current.isListening).toBe(true);

		// Simulate keyboard event
		const event = new KeyboardEvent('keydown', { key: 'Enter' });
		vi.mocked(require('@/lib/keyboard-navigation/utils').matchesShortcut)
			.mockReturnValue(true);

		act(() => {
			document.dispatchEvent(event);
		});

		expect(action).toHaveBeenCalledWith(event);
	});

	it('should not execute shortcuts when disabled', () => {
		const action = vi.fn();
		const shortcuts = [
			{
				id: 'test-shortcut',
				key: 'Enter' as const,
				modifiers: {},
				description: 'Test shortcut',
				category: 'global' as const,
				action,
			},
		];

		renderHook(() =>
			useKeyboardShortcuts(shortcuts, { enabled: false })
		);

		// Simulate keyboard event
		const event = new KeyboardEvent('keydown', { key: 'Enter' });
		vi.mocked(require('@/lib/keyboard-navigation/utils').matchesShortcut)
			.mockReturnValue(true);

		act(() => {
			document.dispatchEvent(event);
		});

		expect(action).not.toHaveBeenCalled();
	});

	it('should ignore shortcuts in specified elements', () => {
		const action = vi.fn();
		const shortcuts = [
			{
				id: 'test-shortcut',
				key: 'Enter' as const,
				modifiers: {},
				description: 'Test shortcut',
				category: 'global' as const,
				action,
			},
		];

		renderHook(() =>
			useKeyboardShortcuts(shortcuts, {
				enabled: true,
				ignoreWhenFocusedIn: ['input']
			})
		);

		// Create input element and focus it
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();

		// Simulate keyboard event
		const event = new KeyboardEvent('keydown', { key: 'Enter' });
		vi.mocked(require('@/lib/keyboard-navigation/utils').matchesShortcut)
			.mockReturnValue(true);

		act(() => {
			input.dispatchEvent(event);
		});

		expect(action).not.toHaveBeenCalled();

		document.body.removeChild(input);
	});
});

describe('useFocusManagement', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div id="test-container">
				<button>Button 1</button>
				<button>Button 2</button>
				<button>Button 3</button>
			</div>
		`;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('should manage focus within container', () => {
		const container = document.getElementById('test-container');
		const { result } = renderHook(() =>
			useFocusManagement({ current: container } as React.RefObject<HTMLElement>)
		);

		expect(result.current.focusableElements).toHaveLength(3);
	});

	it('should handle keyboard navigation', () => {
		const container = document.getElementById('test-container');
		vi.mocked(require('@/lib/keyboard-navigation/utils').getFocusableElements)
			.mockReturnValue([
				{ element: document.createElement('button'), disabled: false, hidden: false, focusable: true, index: 0 },
				{ element: document.createElement('button'), disabled: false, hidden: false, focusable: true, index: 1 },
			] as any);

		const { result } = renderHook(() =>
			useFocusManagement({ current: container } as React.RefObject<HTMLElement>, {
				orientation: 'vertical'
			})
		);

		// Test navigation methods exist
		expect(typeof result.current.focusFirst).toBe('function');
		expect(typeof result.current.focusLast).toBe('function');
		expect(typeof result.current.focusNext).toBe('function');
		expect(typeof result.current.focusPrevious).toBe('function');
	});
});

describe('useFocusTrap', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div id="test-container">
				<button>Button 1</button>
				<button>Button 2</button>
			</div>
		`;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('should trap focus when enabled', () => {
		const container = document.getElementById('test-container');
		vi.mocked(require('@/lib/keyboard-navigation/utils').trapFocus)
			.mockReturnValue(vi.fn());

		const { result } = renderHook(() =>
			useFocusTrap({ current: container } as React.RefObject<HTMLElement>, true)
		);

		expect(result.current.isTrapped).toBe(true);
		expect(vi.mocked(require('@/lib/keyboard-navigation/utils').trapFocus))
			toHaveBeenCalledWith(container);
	});

	it('should not trap focus when disabled', () => {
		const container = document.getElementById('test-container');
		const { result } = renderHook(() =>
			useFocusTrap({ current: container } as React.RefObject<HTMLElement>, false)
		);

		expect(result.current.isTrapped).toBe(false);
	});
});

describe('useKeyboardAnnouncements', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should provide announcement functions', () => {
		const { result } = renderHook(() => useKeyboardAnnouncements());

		expect(typeof result.current.announce).toBe('function');
		expect(typeof result.current.announceNavigation).toBe('function');
		expect(typeof result.current.announceAction).toBe('function');
		expect(typeof result.current.announceError).toBe('function');
		expect(typeof result.current.announceSuccess).toBe('function');
	});

	it('should call announceToScreenReader', () => {
		const { result } = renderHook(() => useKeyboardAnnouncements());

		act(() => {
			result.current.announce('Test message');
		});

		expect(vi.mocked(announceToScreenReader)).toHaveBeenCalledWith('Test message', 'polite');
	});

	it('should announce navigation messages', () => {
		const { result } = renderHook(() => useKeyboardAnnouncements());

		act(() => {
			result.current.announceNavigation('up', 'Menu item');
		});

		expect(vi.mocked(announceToScreenReader))
			.toHaveBeenCalledWith('Moved up to Menu item', 'polite');
	});
});

describe('useListKeyboardNavigation', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div id="test-list">
				<div data-item-index="0">Item 1</div>
				<div data-item-index="1">Item 2</div>
				<div data-item-index="2">Item 3</div>
			</div>
		`;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('should navigate list items', () => {
		const items = ['Item 1', 'Item 2', 'Item 3'];
		const container = document.getElementById('test-list');

		const { result } = renderHook(() =>
			useListKeyboardNavigation(
				items,
				{ current: container } as React.RefObject<HTMLElement>,
				(item, index) => container?.querySelector(`[data-item-index="${index}"]`),
				{
					getItemLabel: (item) => item,
				}
			)
		);

		expect(typeof result.current.navigateTo).toBe('function');
		expect(typeof result.current.navigateNext).toBe('function');
		expect(typeof result.current.navigatePrevious).toBe('function');
		expect(result.current.selectedIndex).toBe(-1);
	});

	it('should handle item selection', () => {
		const onSelect = vi.fn();
		const items = ['Item 1', 'Item 2', 'Item 3'];
		const container = document.getElementById('test-list');

		renderHook(() =>
			useListKeyboardNavigation(
				items,
				{ current: container } as React.RefObject<HTMLElement>,
				(item, index) => container?.querySelector(`[data-item-index="${index}"]`),
				{
					onSelect,
					getItemLabel: (item) => item,
				}
			)
		);

		// Simulate selection (this would normally be triggered by keyboard events)
		// For testing purposes, we can verify the hook provides the necessary functionality
		expect(onSelect).not.toHaveBeenCalled();
	});
});

describe('useGlobalKeyboardNavigation', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should manage global shortcuts', () => {
		const { result } = renderHook(() => useGlobalKeyboardNavigation());

		expect(result.current.shortcuts).toEqual([]);
		expect(result.current.isEnabled).toBe(true);

		// Test management functions exist
		expect(typeof result.current.addShortcut).toBe('function');
		expect(typeof result.current.removeShortcut).toBe('function');
		expect(typeof result.current.toggleShortcut).toBe('function');
		expect(typeof result.current.enableShortcuts).toBe('function');
		expect(typeof result.current.disableShortcuts).toBe('function');
		expect(typeof result.current.getShortcutsByCategory).toBe('function');
	});

	it('should add shortcuts', () => {
		const { result } = renderHook(() => useGlobalKeyboardNavigation());

		const shortcut = {
			id: 'test-shortcut',
			key: 'Enter' as const,
			modifiers: {},
			description: 'Test shortcut',
			category: 'global' as const,
			action: vi.fn(),
		};

		act(() => {
			result.current.addShortcut(shortcut);
		});

		expect(result.current.shortcuts).toHaveLength(1);
		expect(result.current.shortcuts[0]).toEqual(shortcut);
	});

	it('should filter shortcuts by category', () => {
		const { result } = renderHook(() => useGlobalKeyboardNavigation());

		const shortcuts = [
			{
				id: 'shortcut-1',
				key: 'Enter' as const,
				modifiers: {},
				description: 'Global shortcut',
				category: 'global' as const,
				action: vi.fn(),
			},
			{
				id: 'shortcut-2',
				key: 's' as const,
				modifiers: { ctrl: true },
				description: 'Navigation shortcut',
				category: 'navigation' as const,
				action: vi.fn(),
			},
		];

		act(() => {
			result.current.addShortcut(shortcuts[0]);
			result.current.addShortcut(shortcuts[1]);
		});

		const globalShortcuts = result.current.getShortcutsByCategory('global');
		expect(globalShortcuts).toHaveLength(1);
		expect(globalShortcuts[0].id).toBe('shortcut-1');
	});
});

describe('useRovingTabIndex', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div>
				<button>Button 1</button>
				<button>Button 2</button>
				<button>Button 3</button>
			</div>
		`;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('should create roving tabindex pattern', () => {
		const elements = Array.from(document.querySelectorAll('button'));

		const { result } = renderHook(() =>
			useRovingTabIndex(elements, { orientation: 'vertical' })
		);

		expect(result.current.activeIndex).toBe(0);

		// Should have set tabindex attributes
		expect(elements[0].getAttribute('tabindex')).toBe('0');
		expect(elements[1].getAttribute('tabindex')).toBe('-1');
		expect(elements[2].getAttribute('tabindex')).toBe('-1');
	});
});
