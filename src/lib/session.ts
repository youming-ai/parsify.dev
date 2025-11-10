/**
 * Session management utilities for tool usage
 * Handles browser session storage with automatic cleanup
 */

import { ToolSession, ProcessingHistory, UserPreferences } from '@/types/tools';

export interface SessionManager {
	// Session operations
	createSession(toolId: string, inputs: Record<string, any>): ToolSession;
	getSession(sessionId: string): ToolSession | null;
	updateSession(sessionId: string, updates: Partial<ToolSession>): void;
	deleteSession(sessionId: string): void;
	listActiveSessions(): ToolSession[];
	cleanupExpiredSessions(maxAge: number): void;

	// History operations
	addToHistory(sessionId: string, operation: string, success: boolean): void;
	getHistory(limit?: number): ProcessingHistory[];
	clearHistory(): void;

	// User preferences
	getPreferences(): UserPreferences | null;
	savePreferences(preferences: Partial<UserPreferences>): void;

	// Storage management
	getStorageUsage(): { used: number; available: number; percentage: number };
	clearAllData(): void;
}

class BrowserSessionManager implements SessionManager {
	private readonly SESSION_PREFIX = 'tool_session_';
	private readonly HISTORY_KEY = 'processing_history';
	private readonly PREFERENCES_KEY = 'user_preferences';
	private readonly MAX_HISTORY_ITEMS = 50;
	private readonly DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

	createSession(toolId: string, inputs: Record<string, any>): ToolSession {
		const sessionId = crypto.randomUUID();
		const now = new Date();

		const session: ToolSession = {
			id: sessionId,
			toolId,
			createdAt: now,
			lastActivity: now,
			inputs,
			results: null,
			config: {},
			status: 'active',
			metadata: {
				browser: this.getBrowserInfo(),
				platform: navigator.platform,
				version: '1.0.0',
			},
		};

		this.saveSession(session);
		return session;
	}

	getSession(sessionId: string): ToolSession | null {
		try {
			const stored = sessionStorage.getItem(this.SESSION_PREFIX + sessionId);
			if (!stored) return null;

			const session = JSON.parse(stored) as ToolSession;

			// Convert date strings back to Date objects
			session.createdAt = new Date(session.createdAt);
			session.lastActivity = new Date(session.lastActivity);

			return session;
		} catch (error) {
			console.warn('Failed to parse session:', error);
			this.deleteSession(sessionId);
			return null;
		}
	}

	updateSession(sessionId: string, updates: Partial<ToolSession>): void {
		const session = this.getSession(sessionId);
		if (!session) return;

		const updatedSession = {
			...session,
			...updates,
			lastActivity: new Date(),
			id: session.id, // Preserve original ID
		};

		this.saveSession(updatedSession);
	}

	deleteSession(sessionId: string): void {
		sessionStorage.removeItem(this.SESSION_PREFIX + sessionId);
	}

	listActiveSessions(): ToolSession[] {
		const sessions: ToolSession[] = [];

		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key?.startsWith(this.SESSION_PREFIX)) {
				const sessionId = key.replace(this.SESSION_PREFIX, '');
				const session = this.getSession(sessionId);
				if (session) {
					sessions.push(session);
				}
			}
		}

		return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
	}

	cleanupExpiredSessions(maxAge: number = this.DEFAULT_MAX_AGE): void {
		const sessions = this.listActiveSessions();
		const now = new Date();

		for (const session of sessions) {
			const age = now.getTime() - session.lastActivity.getTime();
			if (age > maxAge) {
				this.deleteSession(session.id);
			}
		}
	}

	addToHistory(sessionId: string, operation: string, success: boolean): void {
		const session = this.getSession(sessionId);
		if (!session) return;

		const historyItem: ProcessingHistory = {
			sessionId,
			toolId: session.toolId,
			operation,
			timestamp: new Date(),
			inputsSummary: this.createInputsSummary(session.inputs),
			resultsSummary: session.results ? this.createResultsSummary(session.results) : undefined,
			duration: session.lastActivity.getTime() - session.createdAt.getTime(),
			success,
			starred: false,
		};

		try {
			const history = this.getHistory();
			history.unshift(historyItem);

			// Keep only the most recent items
			if (history.length > this.MAX_HISTORY_ITEMS) {
				history.splice(this.MAX_HISTORY_ITEMS);
			}

			sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
		} catch (error) {
			console.warn('Failed to save history item:', error);
		}
	}

	getHistory(limit?: number): ProcessingHistory[] {
		try {
			const stored = sessionStorage.getItem(this.HISTORY_KEY);
			if (!stored) return [];

			const history = JSON.parse(stored) as ProcessingHistory[];

			// Convert date strings back to Date objects
			history.forEach((item) => {
				item.timestamp = new Date(item.timestamp);
			});

			const sorted = history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
			return limit ? sorted.slice(0, limit) : sorted;
		} catch (error) {
			console.warn('Failed to parse history:', error);
			return [];
		}
	}

	clearHistory(): void {
		sessionStorage.removeItem(this.HISTORY_KEY);
	}

	getPreferences(): UserPreferences | null {
		try {
			const stored = localStorage.getItem(this.PREFERENCES_KEY);
			if (!stored) return null;

			const prefs = JSON.parse(stored) as UserPreferences;
			prefs.lastUpdated = new Date(prefs.lastUpdated);

			return prefs;
		} catch (error) {
			console.warn('Failed to parse preferences:', error);
			return null;
		}
	}

	savePreferences(preferences: Partial<UserPreferences>): void {
		const existing = this.getPreferences() || this.getDefaultPreferences();
		const updated = {
			...existing,
			...preferences,
			lastUpdated: new Date(),
		};

		try {
			localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated));
		} catch (error) {
			console.warn('Failed to save preferences:', error);
		}
	}

	getStorageUsage(): { used: number; available: number; percentage: number } {
		let used = 0;

		// Calculate sessionStorage usage
		for (let key in sessionStorage) {
			if (sessionStorage.hasOwnProperty(key)) {
				used += sessionStorage[key].length;
			}
		}

		// Estimate available space (sessionStorage typically has 5-10MB limit)
		const estimated = 5 * 1024 * 1024; // 5MB
		const available = Math.max(0, estimated - used);
		const percentage = Math.round((used / estimated) * 100);

		return { used, available, percentage };
	}

	clearAllData(): void {
		// Clear all sessions
		const sessions = this.listActiveSessions();
		for (const session of sessions) {
			this.deleteSession(session.id);
		}

		// Clear history
		this.clearHistory();

		// Don't clear preferences by default, but provide option
		// localStorage.removeItem(this.PREFERENCES_KEY);
	}

	// Private helper methods
	private saveSession(session: ToolSession): void {
		try {
			sessionStorage.setItem(this.SESSION_PREFIX + session.id, JSON.stringify(session));
		} catch (error) {
			console.warn('Failed to save session:', error);
			// If storage is full, try to cleanup old sessions
			if (error instanceof Error && error.name === 'QuotaExceededError') {
				this.cleanupExpiredSessions(this.DEFAULT_MAX_AGE / 2); // Cleanup sessions older than 12 hours
				// Retry saving
				try {
					sessionStorage.setItem(this.SESSION_PREFIX + session.id, JSON.stringify(session));
				} catch (retryError) {
					console.error('Failed to save session after cleanup:', retryError);
				}
			}
		}
	}

	private getBrowserInfo(): string {
		const ua = navigator.userAgent;
		if (ua.includes('Chrome')) return 'Chrome';
		if (ua.includes('Firefox')) return 'Firefox';
		if (ua.includes('Safari')) return 'Safari';
		if (ua.includes('Edge')) return 'Edge';
		return 'Unknown';
	}

	private createInputsSummary(inputs: Record<string, any>): string {
		try {
			const serialized = JSON.stringify(inputs);
			return serialized.length > 100 ? serialized.substring(0, 97) + '...' : serialized;
		} catch {
			return '[Complex inputs]';
		}
	}

	private createResultsSummary(results: any): string {
		try {
			const serialized = JSON.stringify(results);
			return serialized.length > 100 ? serialized.substring(0, 97) + '...' : serialized;
		} catch {
			return '[Complex results]';
		}
	}

	private getDefaultPreferences(): UserPreferences {
		return {
			theme: 'system',
			defaultSettings: {},
			favoriteTools: [],
			recentTools: [],
			shortcuts: {
				format: 'Ctrl+F',
				execute: 'Ctrl+Enter',
				clear: 'Ctrl+L',
				save: 'Ctrl+S',
			},
			uiPreferences: {
				fontSize: 'medium',
				showLineNumbers: true,
				wordWrap: true,
				autoSave: false,
				compactMode: false,
			},
			lastUpdated: new Date(),
		};
	}
}

// Create singleton instance
export const sessionManager: SessionManager = new BrowserSessionManager();

// Export convenience functions
export const createSession = (toolId: string, inputs: Record<string, any>) =>
	sessionManager.createSession(toolId, inputs);

export const getSession = (sessionId: string) => sessionManager.getSession(sessionId);

export const updateSession = (sessionId: string, updates: Partial<ToolSession>) =>
	sessionManager.updateSession(sessionId, updates);

export const addToHistory = (sessionId: string, operation: string, success: boolean) =>
	sessionManager.addToHistory(sessionId, operation, success);

// Auto-cleanup expired sessions on page load
if (typeof window !== 'undefined') {
	window.addEventListener('load', () => {
		sessionManager.cleanupExpiredSessions();
	});
}
