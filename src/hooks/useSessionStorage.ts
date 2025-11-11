/**
 * React Hook for Session Storage - T161 Implementation
 * Provides easy integration with session storage system for React components
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
	sessionStorageSystem,
	userPreferencesManager,
	toolSessionPersistence,
	privacyControls,
	type UserPreferences,
	type ToolSession,
	type ConsentRecord,
	type PrivacySettings
} from '@/lib/session-storage';

export interface UseSessionStorageOptions {
	autoInitialize?: boolean;
	autoSave?: boolean;
	syncAcrossTabs?: boolean;
	enablePrivacy?: boolean;
	persistenceKey?: string;
}

export interface SessionStorageState {
	initialized: boolean;
	loading: boolean;
	error: string | null;
	sessionId: string | null;
	userId: string | null;
	hasConsent: boolean;
	privacySettings: PrivacySettings | null;
}

export interface UseSessionStorageReturn {
	// State
	state: SessionStorageState;

	// Preferences
	preferences: UserPreferences | null;
	updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
	resetPreferences: () => Promise<void>;

	// Tool sessions
	createToolSession: (toolId: string, options?: any) => Promise<string>;
	getToolSession: (sessionId: string) => Promise<ToolSession | null>;
	saveToolSession: (sessionId: string, data: any) => Promise<void>;
	deleteToolSession: (sessionId: string) => Promise<void>;

	// Privacy
	consents: ConsentRecord[];
	grantConsent: (consentId: string) => Promise<void>;
	withdrawConsent: (consentId: string) => Promise<void>;
	updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;

	// Data management
	exportData: (options?: any) => Promise<Blob>;
	deleteData: (reason?: string) => Promise<void>;

	// Utilities
	refresh: () => Promise<void>;
	clearError: () => void;
}

export function useSessionStorage(options: UseSessionStorageOptions = {}): UseSessionStorageReturn {
	const {
		autoInitialize = true,
		autoSave = true,
		syncAcrossTabs = true,
		enablePrivacy = true,
		persistenceKey
	} = options;

	// State management
	const [state, setState] = useState<SessionStorageState>({
		initialized: false,
		loading: false,
		error: null,
		sessionId: null,
		userId: null,
		hasConsent: false,
		privacySettings: null,
	});

	const [preferences, setPreferences] = useState<UserPreferences | null>(null);
	const [consents, setConsents] = useState<ConsentRecord[]>([]);

	// Refs for cleanup and tracking
	const initializationRef = useRef<boolean>(false);
	const cleanupRef = useRef<(() => void) | null>(null);

	// Initialize session storage
	const initialize = useCallback(async () => {
		if (initializationRef.current || state.initialized) return;

		setState(prev => ({ ...prev, loading: true, error: null }));

		try {
			console.log('🚀 Initializing session storage for component...');

			// Initialize the session storage system
			await sessionStorageSystem.initialize({
				sync: {
					enabled: syncAcrossTabs,
					conflictResolution: 'timestamp',
					askForResolution: false,
				},
				privacy: {
					requireConsent: enablePrivacy,
					anonymousMode: false,
				},
			});

			// Get or create user session
			const sessionResult = await sessionStorageSystem.createUserSession({
				autoStart: true,
			});

			// Load user preferences
			const userPrefs = await userPreferencesManager.getPreferences();
			setPreferences(userPrefs);

			// Load consents
			const userConsents = await privacyControls.getAllConsents();
			setConsents(userConsents);

			// Load privacy settings
			const privacySettings = await privacyControls.getPrivacySettings();

			// Check if consent is required and given
			const hasConsent = await privacyControls.hasConsent('storage');

			setState(prev => ({
				...prev,
				initialized: true,
				loading: false,
				sessionId: sessionResult.sessionId,
				userId: sessionResult.sessionId, // Would be actual user ID
				hasConsent,
				privacySettings,
			}));

			initializationRef.current = true;
			console.log('✓ Session storage initialized for component');

		} catch (error) {
			console.error('❌ Failed to initialize session storage:', error);
			setState(prev => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Initialization failed',
			}));
		}
	}, [syncAcrossTabs, enablePrivacy, state.initialized]);

	// Update preferences
	const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await userPreferencesManager.updateCategory('ui', updates.ui || {});
			await userPreferencesManager.updateCategory('tools', updates.tools || {});
			await userPreferencesManager.updateCategory('privacy', updates.privacy || {});
			await userPreferencesManager.updateCategory('features', updates.features || {});
			await userPreferencesManager.updateCategory('performance', updates.performance || {});

			// Refresh local state
			const updatedPrefs = await userPreferencesManager.getPreferences();
			setPreferences(updatedPrefs);

		} catch (error) {
			console.error('Failed to update preferences:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to update preferences',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Reset preferences
	const resetPreferences = useCallback(async () => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await userPreferencesManager.resetAllPreferences();

			// Refresh local state
			const resetPrefs = await userPreferencesManager.getPreferences();
			setPreferences(resetPrefs);

		} catch (error) {
			console.error('Failed to reset preferences:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to reset preferences',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Create tool session
	const createToolSession = useCallback(async (toolId: string, options?: any) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		if (!state.hasConsent) {
			throw new Error('User consent required for tool sessions');
		}

		try {
			const sessionId = await toolSessionPersistence.createSession(toolId, options);
			return sessionId;

		} catch (error) {
			console.error('Failed to create tool session:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to create tool session',
			}));
			throw error;
		}
	}, [state.initialized, state.hasConsent]);

	// Get tool session
	const getToolSession = useCallback(async (sessionId: string) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			return await toolSessionPersistence.getSession(sessionId);

		} catch (error) {
			console.error('Failed to get tool session:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to get tool session',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Save tool session
	const saveToolSession = useCallback(async (sessionId: string, data: any) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			const session = await getToolSession(sessionId);
			if (session) {
				await toolSessionPersistence.saveSession({
					...session,
					...data,
				});
			}

		} catch (error) {
			console.error('Failed to save tool session:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to save tool session',
			}));
			throw error;
		}
	}, [state.initialized, getToolSession]);

	// Delete tool session
	const deleteToolSession = useCallback(async (sessionId: string) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await toolSessionPersistence.deleteSession(sessionId);

		} catch (error) {
			console.error('Failed to delete tool session:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to delete tool session',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Grant consent
	const grantConsent = useCallback(async (consentId: string) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await privacyControls.grantConsent(consentId);

			// Refresh consents
			const updatedConsents = await privacyControls.getAllConsents();
			setConsents(updatedConsents);

			// Update consent status
			const hasStorageConsent = await privacyControls.hasConsent('storage');
			setState(prev => ({ ...prev, hasConsent: hasStorageConsent }));

		} catch (error) {
			console.error('Failed to grant consent:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to grant consent',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Withdraw consent
	const withdrawConsent = useCallback(async (consentId: string) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await privacyControls.withdrawConsent(consentId);

			// Refresh consents
			const updatedConsents = await privacyControls.getAllConsents();
			setConsents(updatedConsents);

			// Update consent status
			const hasStorageConsent = await privacyControls.hasConsent('storage');
			setState(prev => ({ ...prev, hasConsent: hasStorageConsent }));

		} catch (error) {
			console.error('Failed to withdraw consent:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to withdraw consent',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Update privacy settings
	const updatePrivacySettings = useCallback(async (settings: Partial<PrivacySettings>) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await privacyControls.updatePrivacySettings(settings);

			// Refresh privacy settings
			const updatedSettings = await privacyControls.getPrivacySettings();
			setState(prev => ({ ...prev, privacySettings: updatedSettings }));

		} catch (error) {
			console.error('Failed to update privacy settings:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to update privacy settings',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Export data
	const exportData = useCallback(async (options?: any) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			return await sessionStorageSystem.exportAllUserData(options);

		} catch (error) {
			console.error('Failed to export data:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to export data',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Delete data
	const deleteData = useCallback(async (reason?: string) => {
		if (!state.initialized) {
			throw new Error('Session storage not initialized');
		}

		try {
			await sessionStorageSystem.deleteAllUserData(reason);

			// Reset state
			setState(prev => ({
				...prev,
				sessionId: null,
				userId: null,
				hasConsent: false,
			}));

			setPreferences(null);
			setConsents([]);

		} catch (error) {
			console.error('Failed to delete data:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to delete data',
			}));
			throw error;
		}
	}, [state.initialized]);

	// Refresh all data
	const refresh = useCallback(async () => {
		if (!state.initialized) return;

		try {
			// Refresh preferences
			const updatedPrefs = await userPreferencesManager.getPreferences();
			setPreferences(updatedPrefs);

			// Refresh consents
			const updatedConsents = await privacyControls.getAllConsents();
			setConsents(updatedConsents);

			// Refresh privacy settings
			const updatedPrivacySettings = await privacyControls.getPrivacySettings();
			setState(prev => ({
				...prev,
				privacySettings: updatedPrivacySettings
			}));

			// Check consent status
			const hasStorageConsent = await privacyControls.hasConsent('storage');
			setState(prev => ({ ...prev, hasConsent: hasStorageConsent }));

		} catch (error) {
			console.error('Failed to refresh data:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to refresh data',
			}));
		}
	}, [state.initialized]);

	// Clear error
	const clearError = useCallback(() => {
		setState(prev => ({ ...prev, error: null }));
	}, []);

	// Auto-initialize on mount
	useEffect(() => {
		if (autoInitialize && !initializationRef.current) {
			initialize();
		}

		return () => {
			// Cleanup on unmount
			if (cleanupRef.current) {
				cleanupRef.current();
			}
		};
	}, [autoInitialize, initialize]);

	// Setup auto-save for preferences
	useEffect(() => {
		if (!autoSave || !preferences) return;

		const saveInterval = setInterval(() => {
			if (preferences) {
				userPreferencesManager.updateCategory('ui', preferences.ui);
				userPreferencesManager.updateCategory('tools', preferences.tools);
			}
		}, 30000); // Save every 30 seconds

		cleanupRef.current = () => {
			clearInterval(saveInterval);
		};

		return () => {
			clearInterval(saveInterval);
		};
	}, [autoSave, preferences]);

	return {
		state,
		preferences,
		updatePreferences,
		resetPreferences,
		createToolSession,
		getToolSession,
		saveToolSession,
		deleteToolSession,
		consents,
		grantConsent,
		withdrawConsent,
		updatePrivacySettings,
		exportData,
		deleteData,
		refresh,
		clearError,
	};
}

// Convenience hooks for specific functionality
export function useSessionPreferences() {
	const { preferences, updatePreferences, resetPreferences, state } = useSessionStorage({
		autoInitialize: true,
	});

	return {
		preferences,
		updatePreferences,
		resetPreferences,
		loading: state.loading,
		error: state.error,
	};
}

export function useToolSession(toolId?: string) {
	const {
		createToolSession,
		getToolSession,
		saveToolSession,
		deleteToolSession,
		state
	} = useSessionStorage({ autoInitialize: true });

	const [currentSession, setCurrentSession] = useState<ToolSession | null>(null);
	const [loading, setLoading] = useState(false);

	const createSession = useCallback(async (options?: any) => {
		if (!toolId) {
			throw new Error('Tool ID is required');
		}

		setLoading(true);
		try {
			const sessionId = await createToolSession(toolId, options);
			const session = await getToolSession(sessionId);
			setCurrentSession(session);
			return sessionId;
		} finally {
			setLoading(false);
		}
	}, [toolId, createToolSession, getToolSession]);

	const saveSession = useCallback(async (data: any) => {
		if (!currentSession) return;

		setLoading(true);
		try {
			await saveToolSession(currentSession.id, data);
			const updatedSession = await getToolSession(currentSession.id);
			setCurrentSession(updatedSession);
		} finally {
			setLoading(false);
		}
	}, [currentSession, saveToolSession, getToolSession]);

	const deleteSession = useCallback(async () => {
		if (!currentSession) return;

		setLoading(true);
		try {
			await deleteToolSession(currentSession.id);
			setCurrentSession(null);
		} finally {
			setLoading(false);
		}
	}, [currentSession, deleteToolSession]);

	return {
		session: currentSession,
		loading: loading || state.loading,
		error: state.error,
		createSession,
		saveSession,
		deleteSession,
	};
}

export function usePrivacyConsent() {
	const {
		consents,
		grantConsent,
		withdrawConsent,
		updatePrivacySettings,
		state
	} = useSessionStorage({ autoInitialize: true });

	const hasConsent = useCallback((type: ConsentRecord['type']) => {
		return consents.some(consent =>
			consent.type === type && consent.given && !consent.withdrawn
		);
	}, [consents]);

	const consentRequired = useCallback(() => {
		return !state.hasConsent && state.privacySettings?.consent.essentialOnly;
	}, [state.hasConsent, state.privacySettings]);

	return {
		consents,
		hasConsent,
		consentRequired,
		grantConsent,
		withdrawConsent,
		updatePrivacySettings,
		loading: state.loading,
		error: state.error,
	};
}
