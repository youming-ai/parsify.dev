/**
 * React Hook for Session Storage System - T161 Implementation
 * Provides easy integration with the session storage system for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
	sessionStorageSystem,
	userPreferencesManager,
	toolSessionPersistence,
	privacyControls,
	sessionManager,
	type UserPreferences,
	type ToolSession,
	type PrivacySettings,
	type SessionMetrics,
} from '@/lib/session-storage';

export interface UseSessionStorageOptions {
	autoInitialize?: boolean;
	enableAutoSave?: boolean;
	autoSaveInterval?: number;
	syncAcrossTabs?: boolean;
	enablePrivacyControls?: boolean;
}

export interface UseSessionStorageReturn {
	// Initialization
	isInitialized: boolean;
	isLoading: boolean;
	error: string | null;

	// User preferences
	preferences: UserPreferences | null;
	updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
	resetPreferences: () => Promise<void>;

	// Tool sessions
	toolSession: ToolSession | null;
	saveToolSession: (updates: Partial<ToolSession>) => Promise<void>;
	createToolSession: (toolId: string, options?: any) => Promise<string>;

	// Privacy
	privacySettings: PrivacySettings | null;
	updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<void>;
	hasConsent: (type: 'analytics' | 'storage' | 'sync' | 'marketing' | 'personalization') => Promise<boolean>;

	// Session management
	sessionId: string | null;
	sessionMetrics: SessionMetrics | null;

	// Utilities
	exportData: (options?: any) => Promise<Blob>;
	deleteData: (reason?: string) => Promise<void>;
	runPrivacyAudit: () => Promise<any>;

	// Actions
	refresh: () => Promise<void>;
}

export function useSessionStorage(
	options: UseSessionStorageOptions = {}
): UseSessionStorageReturn {
	const {
		autoInitialize = true,
		enableAutoSave = true,
		autoSaveInterval = 30000,
		syncAcrossTabs = true,
		enablePrivacyControls = true,
	} = options;

	// State management
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [preferences, setPreferences] = useState<UserPreferences | null>(null);
	const [toolSession, setToolSession] = useState<ToolSession | null>(null);
	const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);

	// Refs for cleanup
	const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
	const syncListenersRef = useRef<Map<string, Function>>(new Map());

	// Initialize session storage
	const initialize = useCallback(async () => {
		if (isInitialized || isLoading) return;

		setIsLoading(true);
		setError(null);

		try {
			await sessionStorageSystem.initialize({
				sync: {
					enabled: syncAcrossTabs,
				},
				toolSession: {
					enabled: enableAutoSave,
					interval: autoSaveInterval,
				},
			});

			// Create or get user session
			const sessionResult = await sessionStorageSystem.createUserSession({
				autoStart: true,
			});

			setSessionId(sessionResult.sessionId);

			// Load initial data
			await refresh();

			setIsInitialized(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to initialize session storage');
			console.error('Session storage initialization failed:', err);
		} finally {
			setIsLoading(false);
		}
	}, [isInitialized, isLoading, syncAcrossTabs, enableAutoSave, autoSaveInterval]);

	// Refresh all data
	const refresh = useCallback(async () => {
		try {
			// Load preferences
			const prefs = await userPreferencesManager.getPreferences();
			setPreferences(prefs);

			// Load privacy settings
			if (enablePrivacyControls) {
				const privacy = await privacyControls.getPrivacySettings();
				setPrivacySettings(privacy);
			}

			// Load session metrics
			const metrics = sessionManager.getSessionMetrics();
			setSessionMetrics(metrics);

		} catch (err) {
			console.error('Failed to refresh session data:', err);
			setError(err instanceof Error ? err.message : 'Failed to refresh data');
		}
	}, [enablePrivacyControls]);

	// Update user preferences
	const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
		try {
			await userPreferencesManager.updateCategory('ui', updates.ui || {});
			await userPreferencesManager.updateCategory('tools', updates.tools || {});
			await userPreferencesManager.updateCategory('privacy', updates.privacy || {});
			await userPreferencesManager.updateCategory('features', updates.features || {});
			await userPreferencesManager.updateCategory('performance', updates.performance || {});

			// Refresh preferences
			const updatedPrefs = await userPreferencesManager.getPreferences();
			setPreferences(updatedPrefs);

		} catch (err) {
			console.error('Failed to update preferences:', err);
			setError(err instanceof Error ? err.message : 'Failed to update preferences');
		}
	}, []);

	// Reset preferences
	const resetPreferences = useCallback(async () => {
		try {
			await userPreferencesManager.resetAllPreferences();
			await refresh();
		} catch (err) {
			console.error('Failed to reset preferences:', err);
			setError(err instanceof Error ? err.message : 'Failed to reset preferences');
		}
	}, [refresh]);

	// Save tool session
	const saveToolSession = useCallback(async (updates: Partial<ToolSession>) => {
		if (!toolSession) return;

		try {
			const updatedSession = { ...toolSession, ...updates };
			await toolSessionPersistence.saveSession(updatedSession);
			setToolSession(updatedSession);
		} catch (err) {
			console.error('Failed to save tool session:', err);
			setError(err instanceof Error ? err.message : 'Failed to save tool session');
		}
	}, [toolSession]);

	// Create tool session
	const createToolSession = useCallback(async (toolId: string, options?: any) => {
		try {
			const newSessionId = await toolSessionPersistence.createSession(toolId, options);
			const session = await toolSessionPersistence.getSession(newSessionId);
			setToolSession(session);
			return newSessionId;
		} catch (err) {
			console.error('Failed to create tool session:', err);
			setError(err instanceof Error ? err.message : 'Failed to create tool session');
			throw err;
		}
	}, []);

	// Update privacy settings
	const updatePrivacySettings = useCallback(async (updates: Partial<PrivacySettings>) => {
		if (!enablePrivacyControls) return;

		try {
			await privacyControls.updatePrivacySettings(updates);
			const updated = await privacyControls.getPrivacySettings();
			setPrivacySettings(updated);
		} catch (err) {
			console.error('Failed to update privacy settings:', err);
			setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
		}
	}, [enablePrivacyControls]);

	// Check consent
	const hasConsent = useCallback(async (type: 'analytics' | 'storage' | 'sync' | 'marketing' | 'personalization') => {
		if (!enablePrivacyControls) return false;
		return await privacyControls.hasConsent(type);
	}, [enablePrivacyControls]);

	// Export data
	const exportData = useCallback(async (options?: any) => {
		try {
			return await sessionStorageSystem.exportAllUserData(options);
		} catch (err) {
			console.error('Failed to export data:', err);
			setError(err instanceof Error ? err.message : 'Failed to export data');
			throw err;
		}
	}, []);

	// Delete data
	const deleteData = useCallback(async (reason?: string) => {
		try {
			await sessionStorageSystem.deleteAllUserData(reason);
			// Reset local state
			setPreferences(null);
			setToolSession(null);
			setPrivacySettings(null);
			setSessionMetrics(null);
		} catch (err) {
			console.error('Failed to delete data:', err);
			setError(err instanceof Error ? err.message : 'Failed to delete data');
			throw err;
		}
	}, []);

	// Run privacy audit
	const runPrivacyAudit = useCallback(async () => {
		if (!enablePrivacyControls) return null;

		try {
			return await sessionStorageSystem.runPrivacyAudit();
		} catch (err) {
			console.error('Failed to run privacy audit:', err);
			setError(err instanceof Error ? err.message : 'Failed to run privacy audit');
			throw err;
		}
	}, [enablePrivacyControls]);

	// Setup auto-save
	useEffect(() => {
		if (!enableAutoSave || !toolSession) return;

		autoSaveIntervalRef.current = setInterval(async () => {
			if (toolSession) {
				try {
					await toolSessionPersistence.saveSession(toolSession);
				} catch (error) {
					console.error('Auto-save failed:', error);
				}
			}
		}, autoSaveInterval);

		return () => {
			if (autoSaveIntervalRef.current) {
				clearInterval(autoSaveIntervalRef.current);
			}
		};
	}, [enableAutoSave, autoSaveInterval, toolSession]);

	// Setup cross-tab sync listeners
	useEffect(() => {
		if (!syncAcrossTabs) return;

		// Listen for preference changes
		const prefListenerId = 'preferences_sync';
		crossTabSync.addListener('preferences', async (message) => {
			if (message.type === 'update') {
				await refresh();
			}
		});
		syncListenersRef.current.set(prefListenerId, () => {
			crossTabSync.removeListener('preferences', prefListenerId);
		});

		// Listen for tool session changes
		const toolListenerId = 'tool_session_sync';
		crossTabSync.addListener('tool_session', async (message) => {
			if (message.type === 'update' && toolSession && message.payload.key === toolSession.id) {
				const updatedSession = await toolSessionPersistence.getSession(toolSession.id);
				setToolSession(updatedSession);
			}
		});
		syncListenersRef.current.set(toolListenerId, () => {
			crossTabSync.removeListener('tool_session', toolListenerId);
		});

		return () => {
			// Cleanup listeners
			syncListenersRef.current.forEach(cleanup => cleanup());
			syncListenersRef.current.clear();
		};
	}, [syncAcrossTabs, toolSession, refresh]);

	// Auto-initialize
	useEffect(() => {
		if (autoInitialize && !isInitialized && !isLoading) {
			initialize();
		}
	}, [autoInitialize, isInitialized, isLoading, initialize]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (autoSaveIntervalRef.current) {
				clearInterval(autoSaveIntervalRef.current);
			}
			syncListenersRef.current.forEach(cleanup => cleanup());
			syncListenersRef.current.clear();
		};
	}, []);

	return {
		// Initialization
		isInitialized,
		isLoading,
		error,

		// User preferences
		preferences,
		updatePreferences,
		resetPreferences,

		// Tool sessions
		toolSession,
		saveToolSession,
		createToolSession,

		// Privacy
		privacySettings,
		updatePrivacySettings,
		hasConsent,

		// Session management
		sessionId,
		sessionMetrics,

		// Utilities
		exportData,
		deleteData,
		runPrivacyAudit,

		// Actions
		refresh,
	};
}

// Specialized hooks for specific use cases

export function useUserPreferences() {
	const { preferences, updatePreferences, resetPreferences, isLoading, error } = useSessionStorage({
		autoInitialize: true,
	});

	return {
		preferences,
		updatePreferences,
		resetPreferences,
		isLoading,
		error,
	};
}

export function useToolSession(toolId?: string, options?: { autoCreate?: boolean }) {
	const {
		toolSession,
		saveToolSession,
		createToolSession,
		isLoading,
		error
	} = useSessionStorage({
		autoInitialize: true,
	});

	// Auto-create session if toolId is provided and session doesn't exist
	useEffect(() => {
		if (toolId && !toolSession && options?.autoCreate && !isLoading) {
			createToolSession(toolId);
		}
	}, [toolId, toolSession, options?.autoCreate, isLoading, createToolSession]);

	return {
		toolSession,
		saveToolSession,
		createToolSession,
		isLoading,
		error,
	};
}

export function usePrivacyControls() {
	const {
		privacySettings,
		updatePrivacySettings,
		hasConsent,
		runPrivacyAudit,
		exportData,
		deleteData,
		isLoading,
		error
	} = useSessionStorage({
		autoInitialize: true,
		enablePrivacyControls: true,
	});

	return {
		privacySettings,
		updatePrivacySettings,
		hasConsent,
		runPrivacyAudit,
		exportData,
		deleteData,
		isLoading,
		error,
	};
}

export function useSessionMetrics() {
	const { sessionMetrics, refresh, isLoading, error } = useSessionStorage({
		autoInitialize: true,
	});

	// Auto-refresh metrics every 30 seconds
	useEffect(() => {
		const interval = setInterval(refresh, 30000);
		return () => clearInterval(interval);
	}, [refresh]);

	return {
		sessionMetrics,
		refresh,
		isLoading,
		error,
	};
}

// Hook for tool-specific session management
export function useToolSessionPersistence(toolId: string, options?: {
	autoSave?: boolean;
	autoSaveInterval?: number;
	persistConfig?: boolean;
	persistOutput?: boolean;
}) {
	const [session, setSession] = useState<ToolSession | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load or create session
	useEffect(() => {
		const loadOrCreateSession = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Try to load existing session
				let existingSession = await toolSessionPersistence.getSession(toolId);

				if (!existingSession) {
					// Create new session
					const sessionId = await toolSessionPersistence.createSession(toolId, {
						autoSave: options?.autoSave,
						autoSaveInterval: options?.autoSaveInterval,
						persistConfig: options?.persistConfig,
						persistOutput: options?.persistOutput,
					});
					existingSession = await toolSessionPersistence.getSession(toolId);
				}

				setSession(existingSession);

				// Add session change listener
				toolSessionPersistence.addSessionListener(existingSession.id, (updatedSession) => {
					setSession(updatedSession);
				});

			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load tool session');
			} finally {
				setIsLoading(false);
			}
		};

		loadOrCreateSession();
	}, [toolId, options]);

	// Update session data
	const updateSession = useCallback(async (updates: Partial<ToolSession>) => {
		if (!session) return;

		try {
			const updatedSession = { ...session, ...updates };
			await toolSessionPersistence.saveSession(updatedSession);
			setSession(updatedSession);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update tool session');
		}
	}, [session]);

	// Record interaction
	const recordInteraction = useCallback(async (interaction: any) => {
		if (!session) return;

		try {
			await toolSessionPersistence.recordInteraction(session.id, interaction);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to record interaction');
		}
	}, [session]);

	// Record error
	const recordError = useCallback(async (error: any) => {
		if (!session) return;

		try {
			await toolSessionPersistence.recordError(session.id, error);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to record error');
		}
	}, [session]);

	// Export session
	const exportSession = useCallback(async (exportOptions?: any) => {
		if (!session) return null;

		try {
			return await toolSessionPersistence.exportSession(session.id, exportOptions);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to export session');
			return null;
		}
	}, [session]);

	return {
		session,
		updateSession,
		recordInteraction,
		recordError,
		exportSession,
		isLoading,
		error,
	};
}

export default useSessionStorage;
