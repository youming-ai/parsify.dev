/**
 * Microsoft Clarity Analytics Integration
 * Provides a wrapper around Microsoft Clarity for user behavior analytics
 */

import clarity from '@microsoft/clarity';
import { MICROSOFT_CLARITY_CONFIG } from './config';

export interface ClarityConfig {
	projectId: string;
	enabled?: boolean;
	debug?: boolean;
	upload?: {
		enabled?: boolean;
		maxContentLength?: number;
		throttleTime?: number;
	};
	privacy?: {
		obscureInputElements?: boolean;
		obscureNumbers?: boolean;
		captureAllInput?: boolean;
	};
	sessionRecording?: {
		enabled?: boolean;
		maxDuration?: number;
		captureConsoleLog?: boolean;
	};
	heatmap?: {
		enabled?: boolean;
		trackClicks?: boolean;
		trackScrolling?: boolean;
		trackMovement?: boolean;
	};
}

export interface ClarityEvent {
	type: string;
	data: Record<string, any>;
	timestamp?: number;
}

/**
 * Microsoft Clarity Analytics Service
 * Handles initialization, configuration, and event tracking for Microsoft Clarity
 */
export class MicrosoftClarityService {
	private isInitialized = false;
	private config: ClarityConfig;
	private eventQueue: ClarityEvent[] = [];
	private debugMode: boolean;

	constructor(config?: Partial<ClarityConfig>) {
		this.config = {
			...MICROSOFT_CLARITY_CONFIG,
			...config,
		};
		this.debugMode = this.config.debug || false;
	}

	/**
	 * Initialize Microsoft Clarity with the provided configuration
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			this.debug('Clarity already initialized');
			return;
		}

		if (!this.config.enabled) {
			this.debug('Clarity is disabled');
			return;
		}

		if (typeof window === 'undefined') {
			this.debug('Clarity can only be initialized in browser environment');
			return;
		}

		try {
			// Initialize Microsoft Clarity
			clarity.init(this.config.projectId);

			// Configure consent
			if (this.config.privacy) {
				clarity.consent(true); // Grant consent for data collection
			}

			// Process any queued events
			this.processEventQueue();

			this.isInitialized = true;
			this.debug('Microsoft Clarity initialized successfully', {
				projectId: this.config.projectId,
			});

			// Track initialization event
			this.trackEvent('clarity_initialized', {
				projectId: this.config.projectId,
				timestamp: Date.now(),
			});
		} catch (error) {
			this.debug('Failed to initialize Microsoft Clarity', error);
			throw error;
		}
	}

	/**
	 * Track a custom event in Microsoft Clarity
	 */
	trackEvent(eventName: string, data?: Record<string, any>): void {
		if (!this.isInitialized) {
			this.queueEvent(eventName, data);
			return;
		}

		try {
			clarity.event(eventName);
			this.debug('Event tracked in Clarity', { eventName, data });
		} catch (error) {
			this.debug('Failed to track event in Clarity', {
				eventName,
				data,
				error,
			});
		}
	}

	/**
	 * Identify a user with Microsoft Clarity
	 */
	identifyUser(userId: string, sessionId?: string, userAttributes?: Record<string, any>): void {
		if (!this.isInitialized) {
			this.debug('Cannot identify user - Clarity not initialized');
			return;
		}

		try {
			clarity.identify(userId, sessionId, undefined, userAttributes?.friendlyName);
			this.debug('User identified in Clarity', {
				userId,
				sessionId,
				userAttributes,
			});
		} catch (error) {
			this.debug('Failed to identify user in Clarity', { userId, error });
		}
	}

	/**
	 * Set custom user attributes
	 */
	setUserAttributes(attributes: Record<string, any>): void {
		if (!this.isInitialized) {
			this.debug('Cannot set user attributes - Clarity not initialized');
			return;
		}

		try {
			// Microsoft Clarity uses setTag for key-value attributes
			Object.entries(attributes).forEach(([key, value]) => {
				clarity.setTag(key, String(value));
			});
			this.debug('User attributes set in Clarity', attributes);
		} catch (error) {
			this.debug('Failed to set user attributes in Clarity', {
				attributes,
				error,
			});
		}
	}

	/**
	 * Track page view
	 */
	trackPageView(path?: string): void {
		if (!this.isInitialized) {
			this.queueEvent('page_view', { path });
			return;
		}

		try {
			const pagePath = path || window.location.pathname;
			this.trackEvent('page_view', {
				path: pagePath,
				url: window.location.href,
				title: document.title,
				referrer: document.referrer,
			});
		} catch (error) {
			this.debug('Failed to track page view in Clarity', { path, error });
		}
	}

	/**
	 * Track tool usage
	 */
	trackToolUsage(toolId: string, toolName: string, action: string, metadata?: Record<string, any>): void {
		this.trackEvent('tool_usage', {
			toolId,
			toolName,
			action,
			timestamp: Date.now(),
			...metadata,
		});
	}

	/**
	 * Track user interaction
	 */
	trackInteraction(interactionType: string, elementId?: string, metadata?: Record<string, any>): void {
		this.trackEvent('user_interaction', {
			interactionType,
			elementId,
			timestamp: Date.now(),
			...metadata,
		});
	}

	/**
	 * Track error
	 */
	trackError(error: Error | string, context?: Record<string, any>): void {
		const errorMessage = error instanceof Error ? error.message : error;
		const errorStack = error instanceof Error ? error.stack : undefined;

		this.trackEvent('error', {
			message: errorMessage,
			stack: errorStack,
			timestamp: Date.now(),
			...context,
		});
	}

	/**
	 * Update user consent
	 */
	updateConsent(consented: boolean): void {
		if (!this.isInitialized) {
			this.debug('Cannot update consent - Clarity not initialized');
			return;
		}

		try {
			clarity.consent(consented);
			this.debug('Consent updated in Clarity', { consented });
		} catch (error) {
			this.debug('Failed to update consent in Clarity', { consented, error });
		}
	}

	/**
	 * Queue an event to be processed once Clarity is initialized
	 */
	private queueEvent(eventName: string, data?: Record<string, any>): void {
		this.eventQueue.push({
			type: eventName,
			data: data || {},
			timestamp: Date.now(),
		});
		this.debug('Event queued for Clarity', { eventName, data });
	}

	/**
	 * Process all queued events
	 */
	private processEventQueue(): void {
		if (this.eventQueue.length === 0) return;

		this.debug('Processing queued events', { count: this.eventQueue.length });

		this.eventQueue.forEach((event) => {
			this.trackEvent(event.type, event.data);
		});

		// Clear the queue
		this.eventQueue = [];
	}

	/**
	 * Get initialization status
	 */
	isReady(): boolean {
		return this.isInitialized;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): ClarityConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration (only works before initialization)
	 */
	updateConfig(newConfig: Partial<ClarityConfig>): void {
		if (this.isInitialized) {
			this.debug('Cannot update config - Clarity already initialized');
			return;
		}

		this.config = { ...this.config, ...newConfig };
		this.debug('Clarity configuration updated', { config: this.config });
	}

	/**
	 * Debug logging utility
	 */
	private debug(message: string, data?: any): void {
		if (this.debugMode) {
			if (data) {
				console.log(`[Microsoft Clarity] ${message}`, data);
			} else {
				console.log(`[Microsoft Clarity] ${message}`);
			}
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		if (this.isInitialized) {
			try {
				// Microsoft Clarity doesn't provide a destroy method in the current version
				// This would be for cleanup if needed in future versions
				this.debug('Microsoft Clarity service destroyed');
			} catch (error) {
				this.debug('Error during Clarity cleanup', error);
			}
		}

		this.isInitialized = false;
		this.eventQueue = [];
	}
}

/**
 * Create and initialize a Microsoft Clarity service instance
 */
export function createMicrosoftClarityService(config?: Partial<ClarityConfig>): MicrosoftClarityService {
	const service = new MicrosoftClarityService(config);

	// Auto-initialize if we're in a browser environment
	if (typeof window !== 'undefined') {
		service.initialize().catch((error) => {
			console.error('Failed to initialize Microsoft Clarity:', error);
		});
	}

	return service;
}

/**
 * Singleton instance for easy access
 */
let clarityServiceInstance: MicrosoftClarityService | null = null;

export function getMicrosoftClarityService(): MicrosoftClarityService {
	if (!clarityServiceInstance) {
		clarityServiceInstance = createMicrosoftClarityService();
	}
	return clarityServiceInstance;
}
