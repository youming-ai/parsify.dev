/**
 * Accessibility Provider Component
 * Provides enhanced accessibility context to the entire application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { EnhancedAccessibilityManager } from '@/lib/accessibility-integration';
import { useScreenReader } from '@/lib/screen-reader';

// Accessibility Context
interface AccessibilityContextValue {
	isInitialized: boolean;
	screenReaderDetected: boolean;
	preferences: {
		announcementsEnabled: boolean;
		reducedMotion: boolean;
		highContrast: boolean;
		keyboardNavigation: boolean;
	};
	announcements: Array<{
		id: string;
		message: string;
		timestamp: Date;
		type: 'info' | 'success' | 'warning' | 'error';
	}>;
	announce: (message: string, options?: { priority?: 'polite' | 'assertive', type?: 'info' | 'success' | 'warning' | 'error' }) => void;
	runAccessibilityTest: () => Promise<void>;
	toggleAccessibilityMode: () => void;
	updatePreferences: (preferences: Partial<AccessibilityContextValue['preferences']>) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

// Provider Props
interface AccessibilityProviderProps {
	children: ReactNode;
	config?: {
		enableAutoTesting?: boolean;
		enablePerformanceMonitoring?: boolean;
		enableChangeDetection?: boolean;
		runTestsOnLoad?: boolean;
		testIntervalMinutes?: number;
		debugMode?: boolean;
	};
}

export function AccessibilityProvider({ children, config = {} }: AccessibilityProviderProps) {
	const [isInitialized, setIsInitialized] = useState(false);
	const [screenReaderDetected, setScreenReaderDetected] = useState(false);
	const [preferences, setPreferences] = useState({
		announcementsEnabled: true,
		reducedMotion: false,
		highContrast: false,
		keyboardNavigation: false,
	});
	const [announcements, setAnnouncements] = useState<Array<{
		id: string;
		message: string;
		timestamp: Date;
		type: 'info' | 'success' | 'warning' | 'error';
	}>>([]);

	const { announce: screenReaderAnnounce } = useScreenReader();
	const managerRef = React.useRef<EnhancedAccessibilityManager | null>(null);

	// Initialize accessibility manager
	useEffect(() => {
		const initializeAccessibility = async () => {
			try {
				const manager = EnhancedAccessibilityManager.getInstance();
				managerRef.current = manager;

				// Initialize with config
				await manager.initialize(config);

				// Get status
				const status = manager.getIntegrationStatus();
				setIsInitialized(status.initialized);
				setScreenReaderDetected(status.screenReaderDetected);

				console.log('Accessibility provider initialized successfully');
			} catch (error) {
				console.error('Failed to initialize accessibility provider:', error);
			}
		};

		initializeAccessibility();
	}, [config]);

	// Set up user preference monitoring
	useEffect(() => {
		const updatePreferences = () => {
			const newPreferences = {
				announcementsEnabled: screenReaderDetected || preferences.keyboardNavigation,
				reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
				highContrast: window.matchMedia('(prefers-contrast: high)').matches,
				keyboardNavigation: document.body.classList.contains('keyboard-navigation'),
			};

			setPreferences(prev => ({ ...prev, ...newPreferences }));
		};

		// Initial check
		updatePreferences();

		// Set up listeners
	 const mediaQueries = [
			window.matchMedia('(prefers-reduced-motion: reduce)'),
			window.matchMedia('(prefers-contrast: high)'),
		];

		mediaQueries.forEach((mq) => {
			if (mq.addEventListener) {
				mq.addEventListener('change', updatePreferences);
			} else {
				mq.addListener(updatePreferences);
			}
		});

		// Monitor keyboard navigation
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Tab') {
				document.body.classList.add('keyboard-navigation');
				updatePreferences();
			}
		};

		const handleMouseDown = () => {
			document.body.classList.remove('keyboard-navigation');
			updatePreferences();
		};

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('mousedown', handleMouseDown);

		return () => {
			mediaQueries.forEach((mq) => {
				if (mq.removeEventListener) {
					mq.removeEventListener('change', updatePreferences);
				} else {
					mq.removeListener(updatePreferences);
				}
			});

			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('mousedown', handleMouseDown);
		};
	}, [screenReaderDetected, preferences.keyboardNavigation]);

	// Enhanced announce function
	const announce = (
		message: string,
		options?: {
			priority?: 'polite' | 'assertive';
			type?: 'info' | 'success' | 'warning' | 'error';
		}
	) => {
		const { priority = 'polite', type = 'info' } = options || {};

		// Add to announcements history
		const announcement = {
			id: Date.now().toString(),
			message,
			timestamp: new Date(),
			type,
		};

		setAnnouncements(prev => [...prev.slice(-9), announcement]); // Keep last 10

		// Announce to screen reader
		if (preferences.announcementsEnabled) {
			screenReaderAnnounce(message, { priority });
		}

		// Log in debug mode
		if (config.debugMode) {
			console.log(`[Accessibility] ${type.toUpperCase()}: ${message}`);
		}
	};

	// Run accessibility test
	const runAccessibilityTest = async () => {
		if (managerRef.current) {
			try {
				announce('Running accessibility test...', { type: 'info' });
				await managerRef.current.runAccessibilityTest();
			} catch (error) {
				announce('Accessibility test failed to complete', { type: 'error', priority: 'assertive' });
			}
		}
	};

	// Toggle accessibility mode
	const toggleAccessibilityMode = () => {
		if (managerRef.current) {
			managerRef.current.toggleAccessibilityMode();
		}
	};

	// Update preferences
	const updatePreferences = (newPreferences: Partial<AccessibilityContextValue['preferences']>) => {
		setPreferences(prev => ({ ...prev, ...newPreferences }));

		// Apply preferences to document
		if (newPreferences.highContrast !== undefined) {
			document.body.classList.toggle('high-contrast', newPreferences.highContrast);
		}

		if (newPreferences.reducedMotion !== undefined) {
			document.body.classList.toggle('reduced-motion', newPreferences.reducedMotion);
		}

		if (newPreferences.announcementsEnabled !== undefined && managerRef.current) {
			const manager = managerRef.current as any;
			if (manager.screenReaderManager) {
				manager.screenReaderManager.setAnnouncementsEnabled(newPreferences.announcementsEnabled);
			}
		}
	};

	const contextValue: AccessibilityContextValue = {
		isInitialized,
		screenReaderDetected,
		preferences,
		announcements,
		announce,
		runAccessibilityTest,
		toggleAccessibilityMode,
		updatePreferences,
	};

	return (
		<AccessibilityContext.Provider value={contextValue}>
			{children}
		</AccessibilityContext.Provider>
	);
}

// Hook to use accessibility context
export function useAccessibility() {
	const context = useContext(AccessibilityContext);
	if (!context) {
		throw new Error('useAccessibility must be used within an AccessibilityProvider');
	}
	return context;
}

// Hook to use accessible announcements
export function useAccessibleAnnouncements() {
	const { announce, announcements, preferences } = useAccessibility();

	return {
		announce,
		announcements,
		enabled: preferences.announcementsEnabled,
		clearAnnouncements: () => {
			// announcements are managed by the provider state
		},
	};
}

// Hook to use accessibility preferences
export function useAccessibilityPreferences() {
	const { preferences, updatePreferences } = useAccessibility();

	return {
		preferences,
		updatePreferences,
		toggleReducedMotion: () => updatePreferences({ reducedMotion: !preferences.reducedMotion }),
		toggleHighContrast: () => updatePreferences({ highContrast: !preferences.highContrast }),
		toggleAnnouncements: () => updatePreferences({ announcementsEnabled: !preferences.announcementsEnabled }),
	};
}

export default AccessibilityProvider;
