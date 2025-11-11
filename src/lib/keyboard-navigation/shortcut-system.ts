/**
 * Custom Keyboard Shortcut System
 * Centralized management of keyboard shortcuts for the platform
 */

'use client';

import type { KeyboardShortcut } from './utils';
import { matchesShortcut, shortcutToString, normalizeKeyName, isMac } from './utils';

export interface ShortcutRegistry {
	shortcuts: Map<string, KeyboardShortcut>;
	enabledCategories: Set<string>;
	conflicts: Map<string, string[]>; // shortcut -> conflicting shortcut IDs
	history: ShortcutHistoryEntry[];
}

export interface ShortcutHistoryEntry {
	id: string;
	shortcutId: string;
	executed: boolean;
	timestamp: Date;
	context?: string;
}

export interface ShortcutEvent {
	shortcutId: string;
	shortcut: KeyboardShortcut;
	event: KeyboardEvent;
	prevented: boolean;
}

export type ShortcutEventHandler = (event: ShortcutEvent) => void;
export type ShortcutCondition = () => boolean;

/**
 * Global Keyboard Shortcut Manager
 */
export class KeyboardShortcutManager {
	private static instance: KeyboardShortcutManager;
	private registry: ShortcutRegistry;
	private eventListeners: Map<string, Set<ShortcutEventHandler>> = new Map();
	private isListening = false;
	private keydownHandler: (event: KeyboardEvent) => void;

	private constructor() {
		this.registry = {
			shortcuts: new Map(),
			enabledCategories: new Set(['global', 'navigation', 'editing', 'tool', 'accessibility']),
			conflicts: new Map(),
			history: [],
		};

		this.keydownHandler = this.handleKeydown.bind(this);
		this.startListening();
	}

	public static getInstance(): KeyboardShortcutManager {
		if (!KeyboardShortcutManager.instance) {
			KeyboardShortcutManager.instance = new KeyboardShortcutManager();
		}
		return KeyboardShortcutManager.instance;
	}

	/**
	 * Register a new keyboard shortcut
	 */
	public register(shortcut: KeyboardShortcut): boolean {
		const { id } = shortcut;

		// Check for conflicts
		if (this.hasConflict(shortcut)) {
			console.warn(`Keyboard shortcut conflict detected for ${id}: ${shortcutToString(shortcut)}`);
			this.recordConflict(id, shortcut);
			return false;
		}

		// Register the shortcut
		this.registry.shortcuts.set(id, shortcut);

		// Re-check for conflicts
		this.detectConflicts();

		return true;
	}

	/**
	 * Unregister a keyboard shortcut
	 */
	public unregister(id: string): boolean {
		const removed = this.registry.shortcuts.delete(id);
		if (removed) {
			this.clearConflicts(id);
			this.detectConflicts();
		}
		return removed;
	}

	/**
	 * Get a registered shortcut
	 */
	public get(id: string): KeyboardShortcut | undefined {
		return this.registry.shortcuts.get(id);
	}

	/**
	 * Get all registered shortcuts
	 */
	public getAll(): KeyboardShortcut[] {
		return Array.from(this.registry.shortcuts.values());
	}

	/**
	 * Get shortcuts by category
	 */
	public getByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
		return this.getAll().filter(shortcut =>
			shortcut.category === category && shortcut.enabled !== false
		);
	}

	/**
	 * Update a shortcut
	 */
	public update(id: string, updates: Partial<KeyboardShortcut>): boolean {
		const existing = this.registry.shortcuts.get(id);
		if (!existing) {
			return false;
		}

		const updated = { ...existing, ...updates };
		this.registry.shortcuts.set(id, updated);

		// Re-check for conflicts
		this.detectConflicts();

		return true;
	}

	/**
	 * Enable/disable a shortcut
	 */
	public setEnabled(id: string, enabled: boolean): void {
		const shortcut = this.registry.shortcuts.get(id);
		if (shortcut) {
			shortcut.enabled = enabled;
		}
	}

	/**
	 * Enable/disable shortcuts by category
	 */
	public setCategoryEnabled(category: KeyboardShortcut['category'], enabled: boolean): void {
		if (enabled) {
			this.registry.enabledCategories.add(category);
		} else {
			this.registry.enabledCategories.delete(category);
		}
	}

	/**
	 * Check if a category is enabled
	 */
	public isCategoryEnabled(category: KeyboardShortcut['category']): boolean {
		return this.registry.enabledCategories.has(category);
	}

	/**
	 * Check for shortcut conflicts
	 */
	public hasConflict(shortcut: KeyboardShortcut): boolean {
		const shortcutStr = this.getShortcutSignature(shortcut);
		return Array.from(this.registry.shortcuts.values()).some(existing =>
			existing.id !== shortcut.id &&
			this.getShortcutSignature(existing) === shortcutStr
		);
	}

	/**
	 * Get conflicting shortcuts
	 */
	public getConflicts(): Map<string, string[]> {
		return new Map(this.registry.conflicts);
	}

	/**
	 * Add event listener for shortcut events
	 */
	public addEventListener(event: 'shortcut:executed', handler: ShortcutEventHandler): void;
	public addEventListener(event: 'shortcut:prevented', handler: ShortcutEventHandler): void;
	public addEventListener(event: 'shortcut:conflict', handler: ShortcutEventHandler): void;
	public addEventListener(event: string, handler: ShortcutEventHandler): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)!.add(handler);
	}

	/**
	 * Remove event listener
	 */
	public removeEventListener(event: string, handler: ShortcutEventHandler): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.delete(handler);
			if (listeners.size === 0) {
				this.eventListeners.delete(event);
			}
		}
	}

	/**
	 * Execute a shortcut programmatically
	 */
	public async execute(id: string, context?: string): Promise<boolean> {
		const shortcut = this.registry.shortcuts.get(id);
		if (!shortcut || shortcut.enabled === false) {
			return false;
		}

		try {
			// Check condition
			if (shortcut.condition && !shortcut.condition()) {
				return false;
			}

			// Create synthetic event
			const syntheticEvent = new KeyboardEvent('keydown', {
				key: shortcut.key,
				ctrlKey: shortcut.modifiers.ctrl || false,
				shiftKey: shortcut.modifiers.shift || false,
				altKey: shortcut.modifiers.alt || false,
				metaKey: shortcut.modifiers.meta || false,
			});

			// Execute action
			await shortcut.action(syntheticEvent);

			// Record history
			this.recordExecution(id, true, context);

			// Emit event
			this.emitEvent('shortcut:executed', {
				shortcutId: id,
				shortcut,
				event: syntheticEvent,
				prevented: false,
			});

			return true;
		} catch (error) {
			console.error(`Error executing shortcut ${id}:`, error);
			this.recordExecution(id, false, context);
			return false;
		}
	}

	/**
	 * Get shortcut execution history
	 */
	public getHistory(limit?: number): ShortcutHistoryEntry[] {
		const history = [...this.registry.history].reverse();
		return limit ? history.slice(0, limit) : history;
	}

	/**
	 * Clear history
	 */
	public clearHistory(): void {
		this.registry.history = [];
	}

	/**
	 * Get usage statistics
	 */
	public getStatistics(): {
		total: number;
		enabled: number;
		byCategory: Record<string, number>;
		mostUsed: Array<{ id: string; count: number }>;
		recentlyUsed: Array<{ id: string; lastUsed: Date }>;
	} {
		const shortcuts = this.getAll();
		const enabled = shortcuts.filter(s => s.enabled !== false);
		const byCategory: Record<string, number> = {};

		shortcuts.forEach(shortcut => {
			byCategory[shortcut.category] = (byCategory[shortcut.category] || 0) + 1;
		});

		// Calculate usage statistics
		const usageCounts = new Map<string, number>();
		const lastUsed = new Map<string, Date>();

		this.registry.history.forEach(entry => {
			if (entry.executed) {
				usageCounts.set(entry.shortcutId, (usageCounts.get(entry.shortcutId) || 0) + 1);
				const existing = lastUsed.get(entry.shortcutId);
				if (!existing || entry.timestamp > existing) {
					lastUsed.set(entry.shortcutId, entry.timestamp);
				}
			}
		});

		const mostUsed = Array.from(usageCounts.entries())
			.map(([id, count]) => ({ id, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const recentlyUsed = Array.from(lastUsed.entries())
			.map(([id, lastUsed]) => ({ id, lastUsed }))
			.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
			.slice(0, 10);

		return {
			total: shortcuts.length,
			enabled: enabled.length,
			byCategory,
			mostUsed,
			recentlyUsed,
		};
	}

	/**
	 * Export shortcuts configuration
	 */
	public export(): {
		shortcuts: Array<{ id: string; shortcut: KeyboardShortcut }>;
		enabledCategories: string[];
	} {
		return {
			shortcuts: Array.from(this.registry.shortcuts.entries()).map(([id, shortcut]) => ({
				id,
				shortcut: { ...shortcut },
			})),
			enabledCategories: Array.from(this.registry.enabledCategories),
		};
	}

	/**
	 * Import shortcuts configuration
	 */
	public import(config: {
		shortcuts: Array<{ id: string; shortcut: KeyboardShortcut }>;
		enabledCategories?: string[];
	}): void {
		// Clear existing shortcuts
		this.registry.shortcuts.clear();
		this.registry.conflicts.clear();

		// Import shortcuts
		config.shortcuts.forEach(({ id, shortcut }) => {
			this.registry.shortcuts.set(id, shortcut);
		});

		// Import enabled categories
		if (config.enabledCategories) {
			this.registry.enabledCategories = new Set(config.enabledCategories);
		}

		// Detect conflicts
		this.detectConflicts();
	}

	/**
	 * Start listening for keyboard events
	 */
	private startListening(): void {
		if (!this.isListening) {
			document.addEventListener('keydown', this.keydownHandler, true);
			this.isListening = true;
		}
	}

	/**
	 * Stop listening for keyboard events
	 */
	public stopListening(): void {
		if (this.isListening) {
			document.removeEventListener('keydown', this.keydownHandler, true);
			this.isListening = false;
		}
	}

	/**
	 * Handle keyboard events
	 */
	private async handleKeydown(event: KeyboardEvent): Promise<void> {
		// Find matching shortcuts
		const matchingShortcuts = this.findMatchingShortcuts(event);

		if (matchingShortcuts.length === 0) {
			return;
		}

		// Sort by priority (global shortcuts last, more specific first)
		matchingShortcuts.sort((a, b) => {
			const categoryPriority = {
				global: 0,
				navigation: 1,
				editing: 2,
				tool: 3,
				accessibility: 4,
			};

			const aPriority = categoryPriority[a.category] || 999;
			const bPriority = categoryPriority[b.category] || 999;

			return bPriority - aPriority; // Higher priority first
		});

		// Execute the first matching shortcut
		const shortcut = matchingShortcuts[0];

		// Check if enabled
		if (shortcut.enabled === false) {
			return;
		}

		// Check category
		if (!this.isCategoryEnabled(shortcut.category)) {
			return;
		}

		// Check condition
		if (shortcut.condition && !shortcut.condition()) {
			return;
		}

		// Prevent default and stop propagation if configured
		if (shortcut.preventDefault !== false) {
			event.preventDefault();
		}
		if (shortcut.stopPropagation) {
			event.stopPropagation();
		}

		try {
			// Execute the action
			await shortcut.action(event);

			// Record execution
			this.recordExecution(shortcut.id, true);

			// Emit event
			this.emitEvent('shortcut:executed', {
				shortcutId: shortcut.id,
				shortcut,
				event,
				prevented: false,
			});
		} catch (error) {
			console.error(`Error executing keyboard shortcut ${shortcut.id}:`, error);
			this.recordExecution(shortcut.id, false);
		}
	}

	/**
	 * Find shortcuts that match the keyboard event
	 */
	private findMatchingShortcuts(event: KeyboardEvent): KeyboardShortcut[] {
		return Array.from(this.registry.shortcuts.values()).filter(shortcut =>
			matchesShortcut(event, shortcut)
		);
	}

	/**
	 * Get a unique signature for a shortcut
	 */
	private getShortcutSignature(shortcut: KeyboardShortcut): string {
		const { key, modifiers } = shortcut;
		return [
			modifiers.ctrl ? 'ctrl' : '',
			modifiers.shift ? 'shift' : '',
			modifiers.alt ? 'alt' : '',
			modifiers.meta ? 'meta' : '',
			normalizeKeyName(key).toLowerCase(),
		].filter(Boolean).join('-');
	}

	/**
	 * Detect all shortcut conflicts
	 */
	private detectConflicts(): void {
		this.registry.conflicts.clear();
		const signatures = new Map<string, string[]>();

		Array.from(this.registry.shortcuts.entries()).forEach(([id, shortcut]) => {
			const signature = this.getShortcutSignature(shortcut);

			if (!signatures.has(signature)) {
				signatures.set(signature, []);
			}

			signatures.get(signature)!.push(id);
		});

		signatures.forEach((ids, signature) => {
			if (ids.length > 1) {
				this.registry.conflicts.set(signature, ids);
			}
		});
	}

	/**
	 * Record a conflict
	 */
	private recordConflict(id: string, shortcut: KeyboardShortcut): void {
		const signature = this.getShortcutSignature(shortcut);

		if (!this.registry.conflicts.has(signature)) {
			this.registry.conflicts.set(signature, []);
		}

		const conflicts = this.registry.conflicts.get(signature)!;
		if (!conflicts.includes(id)) {
			conflicts.push(id);
		}

		this.emitEvent('shortcut:conflict', {
			shortcutId: id,
			shortcut,
			event: new KeyboardEvent('keydown'),
			prevented: true,
		});
	}

	/**
	 * Clear conflicts for a shortcut
	 */
	private clearConflicts(id: string): void {
		const toRemove: string[] = [];

		this.registry.conflicts.forEach((ids, signature) => {
			const index = ids.indexOf(id);
			if (index !== -1) {
				ids.splice(index, 1);
				if (ids.length <= 1) {
					toRemove.push(signature);
				}
			}
		});

		toRemove.forEach(signature => {
			this.registry.conflicts.delete(signature);
		});
	}

	/**
	 * Record shortcut execution
	 */
	private recordExecution(shortcutId: string, executed: boolean, context?: string): void {
		const entry: ShortcutHistoryEntry = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			shortcutId,
			executed,
			timestamp: new Date(),
			context,
		};

		this.registry.history.push(entry);

		// Limit history size
		if (this.registry.history.length > 1000) {
			this.registry.history = this.registry.history.slice(-500);
		}
	}

	/**
	 * Emit an event to listeners
	 */
	private emitEvent(event: string, data: ShortcutEvent): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach(handler => {
				try {
					handler(data);
				} catch (error) {
					console.error(`Error in shortcut event handler for ${event}:`, error);
				}
			});
		}
	}
}

// Export singleton instance
export const shortcutManager = KeyboardShortcutManager.getInstance();

/**
 * Helper function to create platform-agnostic shortcuts
 */
export function createPlatformShortcut(config: {
	id: string;
	key: string;
	macModifiers?: {
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		meta?: boolean;
	};
	winModifiers?: {
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		meta?: boolean;
	};
	description: string;
	category: KeyboardShortcut['category'];
	action: KeyboardShortcut['action'];
}): KeyboardShortcut {
	const isMacPlatform = isMac();
	const modifiers = isMacPlatform ? config.macModifiers : config.winModifiers;

	return {
		id: config.id,
		key: normalizeKeyName(config.key) as any,
		modifiers: modifiers || {},
		description: config.description,
		category: config.category,
		action: config.action,
		preventDefault: true,
		stopPropagation: true,
	};
}

/**
 * Predefined shortcuts for common actions
 */
export const commonShortcuts = {
	help: {
		id: 'help',
		key: '?',
		modifiers: { shift: true },
		description: 'Show keyboard shortcuts help',
		category: 'global' as const,
		action: () => {
			// This would be implemented by the help system
			console.log('Show keyboard shortcuts help');
		},
	},

	search: {
		id: 'search',
		key: 'f',
		modifiers: { ctrl: true },
		description: 'Focus search input',
		category: 'navigation' as const,
		action: () => {
			const searchInput = document.querySelector('input[type="search"], [data-search-input]') as HTMLInputElement;
			if (searchInput) {
				searchInput.focus();
				searchInput.select();
			}
		},
	},

	navigationHome: {
		id: 'navigation-home',
		key: 'g',
		modifiers: { shift: true },
		description: 'Go to home page',
		category: 'navigation' as const,
		action: () => {
			window.location.href = '/';
		},
	},

	focusMainContent: {
		id: 'focus-main-content',
		key: 'm',
		modifiers: { alt: true },
		description: 'Skip to main content',
		category: 'accessibility' as const,
		action: () => {
			const mainContent = document.querySelector('main, [role="main"], #main-content');
			if (mainContent) {
				(mainContent as HTMLElement).focus();
			}
		},
	},
} as const;
