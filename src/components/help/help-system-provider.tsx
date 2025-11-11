'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import ContextAwareTooltip from './context-aware-tooltip';
import HelpModal from './help-modal';
import HelpSidebar from './help-sidebar';
import HelpOverlay from './help-overlay';
import { HelpSystemCore } from '@/lib/help-system';
import type {
	HelpContent,
	HelpContext,
	UserHelpProfile,
	HelpInteraction
} from '@/types/help-system';

interface HelpSystemState {
	isEnabled: boolean;
	currentContext: HelpContext | null;
	userProfile: UserHelpProfile | null;
	availableContent: HelpContent[];
	activeModal: HelpContent | null;
	activeSidebar: boolean;
	activeOverlay: HelpContent | null;
	loading: boolean;
	error?: Error;
}

interface HelpSystemContextType extends HelpSystemState {
	// Core functionality
	initialize: (userId?: string) => Promise<void>;
	showHelp: (contentId: string, context?: Partial<HelpContext>) => void;
	hideHelp: () => void;
	showSidebar: () => void;
	hideSidebar: () => void;

	// Context management
	updateContext: (context: Partial<HelpContext>) => void;
	detectContext: () => void;

	// User interactions
	trackInteraction: (interaction: Omit<HelpInteraction, 'id' | 'timestamp' | 'sessionId'>) => void;
	giveFeedback: (helpId: string, rating: number, comment?: string) => void;
	bookmarkContent: (helpId: string) => void;
	skipContent: (helpId: string) => void;

	// Search and discovery
	searchHelp: (query: string) => Promise<HelpContent[]>;
	getRecommendations: (context?: HelpContext) => Promise<HelpContent[]>;

	// Customization
	updatePreferences: (preferences: Partial<UserHelpProfile['preferences']>) => void;
	configureAccessibility: (config: any) => void;
}

const HelpSystemContext = createContext<HelpSystemContextType | null>(null);

export const useHelpSystem = () => {
	const context = useContext(HelpSystemContext);
	if (!context) {
		throw new Error('useHelpSystem must be used within HelpSystemProvider');
	}
	return context;
};

interface HelpSystemProviderProps {
	children: React.ReactNode;
	userId?: string;
	enabled?: boolean;
	config?: any;
	analytics?: boolean;
	accessibility?: any;
}

/**
 * Main help system provider that integrates all help components
 * Provides centralized access to help functionality throughout the app
 */
export function HelpSystemProvider({
	children,
	userId: externalUserId,
	enabled = true,
	config = {},
	analytics = true,
	accessibility = {},
}: HelpSystemProviderProps) {
	const [state, setState] = useState<HelpSystemState>({
		isEnabled: enabled,
		currentContext: null,
		userProfile: null,
		availableContent: [],
		activeModal: null,
		activeSidebar: false,
		activeOverlay: null,
		loading: true,
		error: undefined,
	});

	const [helpSystem, setHelpSystem] = useState<HelpSystemCore | null>(null);

	// Initialize help system
	useEffect(() => {
		if (enabled) {
			initializeHelpSystem(externalUserId);
		}
	}, [enabled, externalUserId]);

	const initializeHelpSystem = useCallback(async (userId?: string) => {
		try {
			setState(prev => ({ ...prev, loading: true, error: undefined }));

			// Initialize help system core
			const system = new HelpSystemCore({
				analytics,
				accessibility,
				...config,
			});

			await system.initialize(userId || 'anonymous-user');

			// Get initial data
			const profile = await system.getUserProfile();
			const content = await system.getAvailableContent();

			setHelpSystem(system);
			setState(prev => ({
				...prev,
				userProfile: profile,
				availableContent: content,
				loading: false,
			}));

			// Start context detection
			if (config.autoDetect !== false) {
				detectContext();
			}
		} catch (error) {
			console.error('Failed to initialize help system:', error);
			setState(prev => ({
				...prev,
				loading: false,
				error: error as Error,
			}));
		}
	}, [analytics, accessibility, config]);

	// Context management
	const updateContext = useCallback((contextUpdate: Partial<HelpContext>) => {
		setState(prev => ({
			...prev,
			currentContext: prev.currentContext
				? { ...prev.currentContext, ...contextUpdate }
				: contextUpdate as HelpContext,
		}));

		// Trigger help recommendations
		if (contextUpdate && helpSystem) {
			helpSystem.processContextChange(contextUpdate);
		}
	}, [helpSystem]);

	const detectContext = useCallback(() => {
		if (!helpSystem || !state.userProfile) return;

		const detectedContext = helpSystem.detectCurrentContext();
		setState(prev => ({ ...prev, currentContext: detectedContext }));
	}, [helpSystem, state.userProfile]);

	// Help content display
	const showHelp = useCallback(async (contentId: string, context?: Partial<HelpContext>) => {
		if (!helpSystem || !state.userProfile) return;

		try {
			const content = await helpSystem.getHelpContent(contentId);
			if (!content) {
				console.warn(`Help content not found: ${contentId}`);
				return;
			}

			// Update context if provided
			if (context) {
				updateContext(context);
			}

			// Determine delivery method
			const deliveryMethod = helpSystem.getOptimalDeliveryMethod(content, state.currentContext);

			switch (deliveryMethod) {
				case 'modal':
					setState(prev => ({ ...prev, activeModal: content }));
					break;
				case 'sidebar':
					setState(prev => ({ ...prev, activeSidebar: true }));
					break;
				case 'overlay':
					setState(prev => ({ ...prev, activeOverlay: content }));
					break;
				default:
					// Default to modal
					setState(prev => ({ ...prev, activeModal: content }));
			}

			// Track view
			trackInteraction({
				helpId: contentId,
				contextId: state.currentContext?.id || 'unknown',
				deliveryMethod,
				action: 'viewed',
				duration: 0,
			});
		} catch (error) {
			console.error('Failed to show help:', error);
		}
	}, [helpSystem, state.userProfile, state.currentContext, updateContext]);

	const hideHelp = useCallback(() => {
		setState(prev => ({
			...prev,
			activeModal: null,
			activeOverlay: null,
		}));
	}, []);

	// Sidebar management
	const showSidebar = useCallback(() => {
		setState(prev => ({ ...prev, activeSidebar: true }));
	}, []);

	const hideSidebar = useCallback(() => {
		setState(prev => ({ ...prev, activeSidebar: false }));
	}, []);

	// User interactions
	const trackInteraction = useCallback((interaction: Omit<HelpInteraction, 'id' | 'timestamp' | 'sessionId'>) => {
		if (!helpSystem || !state.userProfile) return;

		const fullInteraction: HelpInteraction = {
			...interaction,
			id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			sessionId: state.userProfile.id,
		};

		helpSystem.trackInteraction(fullInteraction);
	}, [helpSystem, state.userProfile]);

	const giveFeedback = useCallback((helpId: string, rating: number, comment?: string) => {
		if (!helpSystem) return;

		helpSystem.recordFeedback(helpId, rating, comment);
	}, [helpSystem]);

	const bookmarkContent = useCallback((helpId: string) => {
		if (!helpSystem || !state.userProfile) return;

		helpSystem.bookmarkContent(helpId, state.userProfile.id);

		// Update local state
		setState(prev => ({
			...prev,
			userProfile: prev.userProfile ? {
				...prev.userProfile,
				bookmarkedHelp: new Set([...prev.userProfile.bookmarkedHelp, helpId]),
			} : null,
		}));
	}, [helpSystem, state.userProfile]);

	const skipContent = useCallback((helpId: string) => {
		if (!helpSystem || !state.userProfile) return;

		helpSystem.skipContent(helpId, state.userProfile.id);

		// Update local state
		setState(prev => ({
			...prev,
			userProfile: prev.userProfile ? {
				...prev.userProfile,
				skippedHelp: new Set([...prev.userProfile.skippedHelp, helpId]),
			} : null,
		}));
	}, [helpSystem, state.userProfile]);

	// Search and discovery
	const searchHelp = useCallback(async (query: string): Promise<HelpContent[]> => {
		if (!helpSystem) return [];

		return helpSystem.searchHelp(query);
	}, [helpSystem]);

	const getRecommendations = useCallback(async (context?: HelpContext): Promise<HelpContent[]> => {
		if (!helpSystem || !state.userProfile) return [];

		return helpSystem.getRecommendations(context || state.currentContext);
	}, [helpSystem, state.userProfile, state.currentContext]);

	// Preferences and accessibility
	const updatePreferences = useCallback((preferences: Partial<UserHelpProfile['preferences']>) => {
		if (!helpSystem || !state.userProfile) return;

		helpSystem.updateUserPreferences(state.userProfile.id, preferences);

		// Update local state
		setState(prev => ({
			...prev,
			userProfile: prev.userProfile ? {
				...prev.userProfile,
				preferences: { ...prev.userProfile.preferences, ...preferences },
			} : null,
		}));
	}, [helpSystem, state.userProfile]);

	const configureAccessibility = useCallback((config: any) => {
		if (!helpSystem) return;

		helpSystem.configureAccessibility(config);
	}, [helpSystem]);

	// Auto-detect context on route changes
	useEffect(() => {
		const handleRouteChange = () => {
			detectContext();
		};

		// Listen for route changes
		window.addEventListener('popstate', handleRouteChange);

		// Also check for hash changes
		window.addEventListener('hashchange', handleRouteChange);

		return () => {
			window.removeEventListener('popstate', handleRouteChange);
			window.removeEventListener('hashchange', handleRouteChange);
		};
	}, [detectContext]);

	// Setup keyboard shortcuts
	useEffect(() => {
		if (!helpSystem) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Help shortcut: Shift + ?
			if (event.shiftKey && event.key === '?') {
				event.preventDefault();
				showSidebar();
			}

			// Close help: Escape
			if (event.key === 'Escape') {
				if (state.activeModal || state.activeOverlay) {
					hideHelp();
				} else if (state.activeSidebar) {
					hideSidebar();
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [helpSystem, state.activeModal, state.activeOverlay, state.activeSidebar, showSidebar, hideHelp, hideHelp]);

	const contextValue: HelpSystemContextType = {
		...state,
		initialize: initializeHelpSystem,
		showHelp,
		hideHelp,
		showSidebar,
		hideSidebar,
		updateContext,
		detectContext,
		trackInteraction,
		giveFeedback,
		bookmarkContent,
		skipContent,
		searchHelp,
		getRecommendations,
		updatePreferences,
		configureAccessibility,
	};

	// Render nothing if disabled or loading
	if (!enabled) {
		return <>{children}</>;
	}

	if (state.loading) {
		return (
			<div className="help-system-loading">
				{children}
			</div>
		);
	}

	if (state.error) {
		console.error('Help system error:', state.error);
		return <>{children}</>;
	}

	return (
		<HelpSystemContext.Provider value={contextValue}>
			{children}

			{/* Help Modal */}
			{state.activeModal && state.userProfile && state.currentContext && (
				<HelpModal
					content={state.activeModal}
					context={state.currentContext}
					userProfile={state.userProfile}
					onClose={hideHelp}
					onInteraction={trackInteraction}
				/>
			)}

			{/* Help Sidebar */}
			{state.activeSidebar && state.userProfile && state.currentContext && (
				<HelpSidebar
					isOpen={state.activeSidebar}
					onClose={hideSidebar}
					content={state.availableContent}
					context={state.currentContext}
					userProfile={state.userProfile}
					onInteraction={trackInteraction}
					onContentSelect={(content) => showHelp(content.id)}
				/>
			)}

			{/* Help Overlay */}
			{state.activeOverlay && state.userProfile && state.currentContext && (
				<HelpOverlay
					isActive={!!state.activeOverlay}
					content={state.activeOverlay}
					targetSelector="[data-help-target]"
					context={state.currentContext}
					userProfile={state.userProfile}
					onComplete={hideHelp}
					onSkip={() => skipContent(state.activeOverlay!.id)}
					onInteraction={trackInteraction}
				/>
			)}

			{/* Floating Help Button */}
			{state.userProfile?.preferences.enableAutoTrigger && (
				<HelpButton
					onClick={() => showSidebar()}
					hasNewContent={helpSystem?.hasNewContent(state.userProfile?.id || '')}
				/>
			)}
		</HelpSystemContext.Provider>
	);
}

/**
 * Floating help button component
 */
function HelpButton({
	onClick,
	hasNewContent = false
}: {
	onClick: () => void;
	hasNewContent?: boolean;
}) {
	return (
		<button
			onClick={onClick}
			className="fixed bottom-6 right-6 z-30 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
			aria-label="Open help"
		>
			<svg
				className="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			{hasNewContent && (
				<span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
			)}
		</button>
	);
}

export default HelpSystemProvider;
