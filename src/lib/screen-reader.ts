/**
 * Screen Reader Utilities
 * Comprehensive screen reader support and enhancement utilities
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Screen reader detection and management
export class ScreenReaderManager {
	private static instance: ScreenReaderManager;
	private liveRegions: Map<string, HTMLElement> = new Map();
	private announcementQueue: Array<{ message: string; priority: 'polite' | 'assertive'; delay?: number }> = [];
	private isAnnouncing = false;
	private screenReaderDetected = false;
	private preferences: ScreenReaderPreferences = {
		announceErrors: true,
		announceSuccess: true,
		announceProgress: true,
		verbosity: 'normal',
		 announcementsEnabled: true,
	};

	private constructor() {
		this.detectScreenReader();
		this.setupLiveRegions();
		this.setupKeyboardDetection();
	}

	public static getInstance(): ScreenReaderManager {
		if (!ScreenReaderManager.instance) {
			ScreenReaderManager.instance = new ScreenReaderManager();
		}
		return ScreenReaderManager.instance;
	}

	// Detect if screen reader is being used
	private detectScreenReader(): void {
		if (typeof window === 'undefined') return;

		// Method 1: Check for screen reader specific elements
		const checkForScreenReaderElements = () => {
			const srStyles = window.getComputedStyle(document.body);
			const hasScreenReaderStyles = srStyles.getPropertyValue('--screen-reader') === 'true';

			// Check for common screen reader browser indicators
			const hasScreenReaderBrowser =
				navigator.userAgent.includes('NVDA') ||
				navigator.userAgent.includes('JAWS') ||
				navigator.userAgent.includes('VoiceOver') ||
				navigator.userAgent.includes('TalkBack');

			this.screenReaderDetected = hasScreenReaderStyles || hasScreenReaderBrowser;
		};

		// Method 2: Monitor for screen reader specific behaviors
		const setupBehaviorDetection = () => {
			let tabKeyPresses = 0;
			let arrowKeyPresses = 0;

			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Tab') {
					tabKeyPresses++;
					// Screen reader users often use Tab navigation extensively
					if (tabKeyPresses > 5 && arrowKeyPresses === 0) {
						this.screenReaderDetected = true;
					}
				}

				if (e.key.includes('Arrow')) {
					arrowKeyPresses++;
				}

				// Check for screen reader shortcuts
				if (e.ctrlKey && e.altKey) {
					// Common screen reader shortcuts
					if (['a', 'b', 'h', 'l', 'r'].includes(e.key.toLowerCase())) {
						this.screenReaderDetected = true;
					}
				}
			};

			document.addEventListener('keydown', handleKeyDown);
		};

		// Initial detection
		checkForScreenReaderElements();
		setupBehaviorDetection();

		// Recheck periodically
		setInterval(checkForScreenReaderElements, 5000);
	}

	// Setup default live regions
	private setupLiveRegions(): void {
		if (typeof document === 'undefined') return;

		// Create polite live region
		this.createLiveRegion('polite', 'polite');

		// Create assertive live region
		this.createLiveRegion('assertive', 'assertive');

		// Create status region for general updates
		this.createLiveRegion('status', 'polite');

		// Create progress region for progress updates
		this.createLiveRegion('progress', 'polite');
	}

	// Create a live region
	private createLiveRegion(id: string, politeness: 'polite' | 'assertive'): void {
		let region = document.getElementById(`sr-live-${id}`);

		if (!region) {
			region = document.createElement('div');
			region.id = `sr-live-${id}`;
			region.setAttribute('aria-live', politeness);
			region.setAttribute('aria-atomic', 'true');
			region.className = 'sr-live-region';

			// Style for screen reader only
			region.style.cssText = `
				position: absolute;
				left: -10000px;
				width: 1px;
				height: 1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
			`;

			document.body.appendChild(region);
		}

		this.liveRegions.set(id, region);
	}

	// Setup keyboard detection for screen reader patterns
	private setupKeyboardDetection(): void {
		if (typeof document === 'undefined') return;

		let isUsingScreenReaderNavigation = false;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Detect screen reader navigation patterns
			if (e.key === 'Tab' && e.shiftKey) {
				isUsingScreenReaderNavigation = true;
			}

			// Detect screen reader specific key combinations
			if (e.ctrlKey && e.altKey) {
				const key = e.key.toLowerCase();
				switch (key) {
					case 'r': // Read document
					case 'h': // Headings
					case 'l': // Links
					case 'f': // Forms
					case 't': // Tables
						isUsingScreenReaderNavigation = true;
						break;
				}
			}

			// Detect virtual cursor navigation
			if (e.altKey && e.key.includes('Arrow')) {
				isUsingScreenReaderNavigation = true;
			}
		};

		const handleMouseMove = () => {
			// Reset when mouse is used (screen reader users typically don't use mouse for navigation)
			isUsingScreenReaderNavigation = false;
		};

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('mousemove', handleMouseMove);
	}

	// Announce message to screen readers
	public announce(
		message: string,
		options: {
			priority?: 'polite' | 'assertive';
			delay?: number;
			clearPrevious?: boolean;
			timeout?: number;
		} = {}
	): void {
		if (!this.preferences.announcementsEnabled || !this.screenReaderDetected) return;

		const {
			priority = 'polite',
			delay = 0,
			clearPrevious = false,
			timeout = 1000
		} = options;

		const announcement = {
			message: this.processMessage(message),
			priority,
			delay,
			timeout
		};

		if (delay === 0) {
			this.makeAnnouncement(announcement, clearPrevious);
		} else {
			setTimeout(() => {
				this.makeAnnouncement(announcement, clearPrevious);
			}, delay);
		}
	}

	// Process and format message for screen readers
	private processMessage(message: string): string {
		// Clean up message
		let processed = message.trim();

		// Remove HTML tags if any
		processed = processed.replace(/<[^>]*>/g, '');

		// Convert common symbols to words
		processed = processed.replace(/&/g, ' and ');
		processed = processed.replace(/%/g, ' percent ');
		processed = processed.replace(/\$/g, ' dollars ');
		processed = processed.replace(/@/g, ' at ');

		// Expand abbreviations
		processed = processed.replace(/\bJSON\b/gi, 'J S O N');
		processed = processed.replace(/\bAPI\b/gi, 'A P I');
		processed = processed.replace(/\bHTML\b/gi, 'H T M L');
		processed = processed.replace(/\bCSS\b/gi, 'C S S');
		processed = processed.replace(/\bURL\b/gi, 'U R L');
		processed = processed.replace(/\bXML\b/gi, 'X M L');
		processed = processed.replace(/\bCSV\b/gi, 'C S V');

		// Add punctuation if missing
		if (!processed.match(/[.!?]$/)) {
			processed += '.';
		}

		return processed;
	}

	// Make the actual announcement
	private makeAnnouncement(
		announcement: { message: string; priority: 'polite' | 'assertive'; timeout: number },
		clearPrevious: boolean
	): void {
		const region = this.liveRegions.get(announcement.priority);
		if (!region) return;

		if (clearPrevious) {
			region.textContent = '';
		}

		// Add the message
		region.textContent = announcement.message;

		// Clear the message after timeout
		setTimeout(() => {
			if (region.textContent === announcement.message) {
				region.textContent = '';
			}
		}, announcement.timeout);
	}

	// Announce error
	public announceError(error: string | Error, context?: string): void {
		if (!this.preferences.announceErrors) return;

		const errorMessage = error instanceof Error ? error.message : error;
		const fullMessage = context ? `Error in ${context}: ${errorMessage}` : `Error: ${errorMessage}`;

		this.announce(fullMessage, {
			priority: 'assertive',
			clearPrevious: true,
			timeout: 3000
		});
	}

	// Announce success
	public announceSuccess(message: string, context?: string): void {
		if (!this.preferences.announceSuccess) return;

		const fullMessage = context ? `Success in ${context}: ${message}` : `Success: ${message}`;

		this.announce(fullMessage, {
			priority: 'polite',
			timeout: 2000
		});
	}

	// Announce progress
	public announceProgress(message: string, current?: number, total?: number): void {
		if (!this.preferences.announceProgress) return;

		let progressMessage = message;
		if (current !== undefined && total !== undefined) {
			const percentage = Math.round((current / total) * 100);
			progressMessage = `${message}: ${percentage} percent complete (${current} of ${total})`;
		}

		this.announce(progressMessage, {
			priority: 'polite',
			timeout: 1000
		});
	}

	// Announce page changes
	public announcePageChange(pageTitle: string, pageDescription?: string): void {
		let message = `Page: ${pageTitle}`;
		if (pageDescription) {
			message += `. ${pageDescription}`;
		}

		this.announce(message, {
			priority: 'assertive',
			clearPrevious: true,
			timeout: 2000
		});
	}

	// Announce form validation results
	public announceFormValidation(results: FormValidationResult): void {
		if (results.isValid) {
			this.announceSuccess('Form is valid');
		} else {
			const errorCount = results.errors.length;
			const message = `Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}`;

			// Announce the first few errors
			const errorDetails = results.errors.slice(0, 3).map(e => e.message).join('; ');
			const fullMessage = errorDetails ? `${message}: ${errorDetails}` : message;

			this.announce(fullMessage, {
				priority: 'assertive',
				clearPrevious: true,
				timeout: 4000
			});
		}
	}

	// Announce table information
	public announceTableInfo(tableInfo: TableInfo): void {
		const { title, rowCount, columnCount, description } = tableInfo;

		let message = `Table: ${title || 'Untitled table'}`;
		message += `. ${rowCount} rows and ${columnCount} columns`;

		if (description) {
			message += `. ${description}`;
		}

		this.announce(message, {
			priority: 'polite',
			timeout: 3000
		});
	}

	// Announce navigation changes
	public announceNavigationChange(action: string, destination: string): void {
		const message = `Navigation: ${action} to ${destination}`;

		this.announce(message, {
			priority: 'polite',
			timeout: 2000
		});
	}

	// Check if screen reader is detected
	public isScreenReaderDetected(): boolean {
		return this.screenReaderDetected;
	}

	// Get screen reader preferences
	public getPreferences(): ScreenReaderPreferences {
		return { ...this.preferences };
	}

	// Update screen reader preferences
	public updatePreferences(updates: Partial<ScreenReaderPreferences>): void {
		this.preferences = { ...this.preferences, ...updates };
	}

	// Enable/disable announcements
	public setAnnouncementsEnabled(enabled: boolean): void {
		this.preferences.announcementsEnabled = enabled;
	}

	// Test screen reader announcements
	public testAnnouncement(): void {
		this.announce('Screen reader announcement test successful. You can hear this message.');
	}

	// Create custom live region
	public createCustomLiveRegion(id: string, politeness: 'polite' | 'assertive'): HTMLElement {
		const region = document.createElement('div');
		region.id = `sr-live-custom-${id}`;
		region.setAttribute('aria-live', politeness);
		region.setAttribute('aria-atomic', 'true');
		region.className = 'sr-live-region';

		region.style.cssText = `
			position: absolute;
			left: -10000px;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
		`;

		document.body.appendChild(region);
		this.liveRegions.set(`custom-${id}`, region);

		return region;
	}

	// Remove custom live region
	public removeCustomLiveRegion(id: string): void {
		const region = this.liveRegions.get(`custom-${id}`);
		if (region) {
			region.remove();
			this.liveRegions.delete(`custom-${id}`);
		}
	}

	// Get live region statistics
	public getLiveRegionStats(): LiveRegionStats {
		const regions: Record<string, boolean> = {};
		this.liveRegions.forEach((region, key) => {
			regions[key] = document.body.contains(region);
		});

		return {
			totalRegions: this.liveRegions.size,
			activeRegions: Object.values(regions).filter(Boolean).length,
			regionDetails: regions,
			screenReaderDetected: this.screenReaderDetected,
			announcementsEnabled: this.preferences.announcementsEnabled,
		};
	}
}

// Type definitions
export interface ScreenReaderPreferences {
	announceErrors: boolean;
	announceSuccess: boolean;
	announceProgress: boolean;
	verbosity: 'minimal' | 'normal' | 'verbose';
	announcementsEnabled: boolean;
}

export interface FormValidationResult {
	isValid: boolean;
	errors: Array<{
		field: string;
		message: string;
		severity: 'error' | 'warning';
	}>;
}

export interface TableInfo {
	title?: string;
	description?: string;
	rowCount: number;
	columnCount: number;
	sortColumn?: string;
	sortDirection?: 'asc' | 'desc';
}

export interface LiveRegionStats {
	totalRegions: number;
	activeRegions: number;
	regionDetails: Record<string, boolean>;
	screenReaderDetected: boolean;
	announcementsEnabled: boolean;
}

// React hooks for screen reader functionality
export function useScreenReader() {
	const [isDetected, setIsDetected] = useState(false);
	const [preferences, setPreferences] = useState<ScreenReaderPreferences>({
		announceErrors: true,
		announceSuccess: true,
		announceProgress: true,
		verbosity: 'normal',
		announcementsEnabled: true,
	});

	useEffect(() => {
		const manager = ScreenReaderManager.getInstance();

		// Update detection status
		const updateDetection = () => {
			setIsDetected(manager.isScreenReaderDetected());
		};

		// Update preferences
		const updatePreferences = () => {
			setPreferences(manager.getPreferences());
		};

		// Initial update
		updateDetection();
		updatePreferences();

		// Set up polling for updates
		const interval = setInterval(() => {
			updateDetection();
			updatePreferences();
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const announce = useCallback((
		message: string,
		options?: {
			priority?: 'polite' | 'assertive';
			delay?: number;
			clearPrevious?: boolean;
		}
	) => {
		const manager = ScreenReaderManager.getInstance();
		manager.announce(message, options);
	}, []);

	const announceError = useCallback((error: string | Error, context?: string) => {
		const manager = ScreenReaderManager.getInstance();
		manager.announceError(error, context);
	}, []);

	const announceSuccess = useCallback((message: string, context?: string) => {
		const manager = ScreenReaderManager.getInstance();
		manager.announceSuccess(message, context);
	}, []);

	const announceProgress = useCallback((message: string, current?: number, total?: number) => {
		const manager = ScreenReaderManager.getInstance();
		manager.announceProgress(message, current, total);
	}, []);

	const announcePageChange = useCallback((pageTitle: string, pageDescription?: string) => {
		const manager = ScreenReaderManager.getInstance();
		manager.announcePageChange(pageTitle, pageDescription);
	}, []);

	const updatePreferences = useCallback((updates: Partial<ScreenReaderPreferences>) => {
		const manager = ScreenReaderManager.getInstance();
		manager.updatePreferences(updates);
	}, []);

	return {
		isDetected,
		preferences,
		announce,
		announceError,
		announceSuccess,
		announceProgress,
		announcePageChange,
		updatePreferences,
	};
}

// Hook for live region management
export function useLiveRegion(id: string, politeness: 'polite' | 'assertive' = 'polite') {
	const manager = ScreenReaderManager.getInstance();
	const regionRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		// Create custom live region if it doesn't exist
		if (!regionRef.current) {
			regionRef.current = manager.createCustomLiveRegion(id, politeness);
		}

		return () => {
			if (regionRef.current) {
				manager.removeCustomLiveRegion(id);
				regionRef.current = null;
			}
		};
	}, [id, politeness, manager]);

	const announce = useCallback((message: string, clearPrevious = false) => {
		if (!regionRef.current) return;

		if (clearPrevious) {
			regionRef.current.textContent = '';
		}

		const processedMessage = (manager as any).processMessage(message);
		regionRef.current.textContent = processedMessage;

		setTimeout(() => {
			if (regionRef.current?.textContent === processedMessage) {
				regionRef.current.textContent = '';
			}
		}, 1000);
	}, [manager]);

	return { announce };
}

// Hook for accessible forms
export function useAccessibleForm(initialValues?: Record<string, any>) {
	const [values, setValues] = useState(initialValues || {});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const { announceError, announceSuccess } = useScreenReader();

	const setFieldValue = useCallback((name: string, value: any) => {
		setValues(prev => ({ ...prev, [name]: value }));
		setTouched(prev => ({ ...prev, [name]: true }));

		// Clear error for this field
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: '' }));
		}
	}, [errors]);

	const setFieldError = useCallback((name: string, error: string) => {
		setErrors(prev => ({ ...prev, [name]: error }));
		setTouched(prev => ({ ...prev, [name]: true }));

		// Announce error immediately
		if (error) {
			announceError(error, `${name} field`);
		}
	}, [announceError]);

	const validateField = useCallback((name: string, validator: (value: any) => string | null) => {
		const error = validator(values[name]);
		if (error) {
			setFieldError(name, error);
		} else {
			setErrors(prev => ({ ...prev, [name]: '' }));
		}
		return !error;
	}, [values, setFieldError]);

	const validateForm = useCallback((validators: Record<string, (value: any) => string | null>) => {
		const newErrors: Record<string, string> = {};
		let isValid = true;

		Object.keys(validators).forEach(name => {
			const error = validators[name](values[name]);
			if (error) {
				newErrors[name] = error;
				isValid = false;
			}
		});

		setErrors(newErrors);
		setTouched(Object.keys(validators).reduce((acc, name) => ({ ...acc, [name]: true }), {}));

		const manager = ScreenReaderManager.getInstance();
		manager.announceFormValidation({
			isValid,
			errors: Object.entries(newErrors).map(([field, message]) => ({
				field,
				message,
				severity: 'error' as const
			}))
		});

		return isValid;
	}, [values]);

	const resetForm = useCallback(() => {
		setValues(initialValues || {});
		setErrors({});
		setTouched({});
		announceSuccess('Form has been reset');
	}, [initialValues, announceSuccess]);

	const getFieldProps = useCallback((name: string) => ({
		value: values[name] || '',
		onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
			setFieldValue(name, e.target.value);
		},
		onBlur: () => {
			setTouched(prev => ({ ...prev, [name]: true }));
		},
		error: touched[name] ? errors[name] : undefined,
		'aria-invalid': touched[name] && errors[name] ? 'true' : 'false',
		'aria-describedby': errors[name] ? `${name}-error` : undefined,
	}), [values, errors, touched, setFieldValue]);

	return {
		values,
		errors,
		touched,
		setFieldValue,
		setFieldError,
		validateField,
		validateForm,
		resetForm,
		getFieldProps,
	};
}

export default ScreenReaderManager;
