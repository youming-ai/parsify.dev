/**
 * Cloudflare Analytics Client
 * Core analytics functionality for web application
 */

import {
	ANALYTICS_EVENTS,
	CLOUDFLARE_ANALYTICS_CONFIG,
	DEFAULT_ANALYTICS_CONFIG,
	RATE_LIMITS,
} from './config';
import type {
	APIUsageEvent,
	AnalyticsBatch,
	AnalyticsConfig,
	AnalyticsConsent,
	AnalyticsEvent,
	AnalyticsSession,
	PageViewEvent,
	PerformanceEvent,
	ToolUsageEvent,
	UserInteractionEvent,
} from './types';

export class CloudflareAnalyticsClient {
	private config: AnalyticsConfig;
	private session: AnalyticsSession | null = null;
	private consent: AnalyticsConsent | null = null;
	private eventQueue: AnalyticsEvent[] = [];
	private performanceObserver: PerformanceObserver | null = null;
	private isInitialized = false;
	private eventCounters = new Map<string, number>();
	private batchTimer: NodeJS.Timeout | null = null;

	constructor(config?: Partial<AnalyticsConfig>) {
		this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
		this.initializeCounters();
	}

	/**
	 * Initialize the analytics client
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		try {
			// Check for Do Not Track header
			if (this.config.privacy.respectDNT && this.hasDNT()) {
				this.config.enabled = false;
				return;
			}

			// Load or create session
			await this.initializeSession();

			// Load or request consent
			await this.initializeConsent();

			// Initialize performance monitoring
			if (this.config.enablePerformanceMonitoring) {
				this.initializePerformanceMonitoring();
			}

			// Initialize interaction tracking
			if (this.config.enableInteractionTracking) {
				this.initializeInteractionTracking();
			}

			// Set up Cloudflare Web Analytics
			this.setupCloudflareWebAnalytics();

			// Start batch processing
			this.startBatchProcessor();

			this.isInitialized = true;
			this.log('Analytics client initialized');
		} catch (error) {
			this.logError('Failed to initialize analytics client', error);
		}
	}

	/**
	 * Track a page view
	 */
	trackPageView(path?: string, title?: string): void {
		if (!this.canTrack(ANALYTICS_EVENTS.PAGE_VIEW)) return;

		const event: PageViewEvent = {
			id: this.generateEventId(),
			name: ANALYTICS_EVENTS.PAGE_VIEW,
			timestamp: Date.now(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.session?.userId,
			sessionId: this.session?.id || '',
			data: {
				title: title || document.title,
				path: path || window.location.pathname,
				referrer: document.referrer || undefined,
				timeOnPage: this.calculateTimeOnPage(),
			},
		};

		this.trackEvent(event);
		this.updateSessionPageView();

		// Track page view with Cloudflare Web Analytics
		this.trackPageViewWithCloudflare();
	}

	/**
	 * Track tool usage
	 */
	trackToolUsage(params: {
		toolId: string;
		toolName: string;
		action: 'execute' | 'validate' | 'format' | 'convert' | 'error';
		processingTime?: number;
		inputSize?: number;
		outputSize?: number;
		error?: string;
		metrics?: Record<string, number>;
	}): void {
		if (!this.canTrack(ANALYTICS_EVENTS.TOOL_USAGE)) return;

		const event: ToolUsageEvent = {
			id: this.generateEventId(),
			name: ANALYTICS_EVENTS.TOOL_USAGE,
			timestamp: Date.now(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.session?.userId,
			sessionId: this.session?.id || '',
			data: params,
		};

		this.trackEvent(event);
		this.updateSessionToolUsage();
	}

	/**
	 * Track performance metrics
	 */
	trackPerformance(metrics: Partial<PerformanceEvent['data']>): void {
		if (!this.canTrack(ANALYTICS_EVENTS.PERFORMANCE)) return;

		const event: PerformanceEvent = {
			id: this.generateEventId(),
			name: ANALYTICS_EVENTS.PERFORMANCE,
			timestamp: Date.now(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.session?.userId,
			sessionId: this.session?.id || '',
			data: {
				...metrics,
				connectionType: this.getConnectionType(),
				effectiveType: this.getEffectiveConnectionType(),
			},
		};

		this.trackEvent(event);
	}

	/**
	 * Track user interactions
	 */
	trackInteraction(params: {
		interactionType:
			| 'click'
			| 'scroll'
			| 'focus'
			| 'blur'
			| 'submit'
			| 'navigation';
		elementId?: string;
		elementTag?: string;
		elementText?: string;
		targetUrl?: string;
		scrollDepth?: number;
	}): void {
		if (!this.canTrack(ANALYTICS_EVENTS.USER_INTERACTION)) return;

		const event: UserInteractionEvent = {
			id: this.generateEventId(),
			name: ANALYTICS_EVENTS.USER_INTERACTION,
			timestamp: Date.now(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.session?.userId,
			sessionId: this.session?.id || '',
			data: params,
		};

		this.trackEvent(event);
	}

	/**
	 * Track API usage
	 */
	trackAPIUsage(params: {
		endpoint: string;
		method: string;
		statusCode: number;
		responseTime: number;
		requestSize?: number;
		responseSize?: number;
		error?: string;
	}): void {
		if (!this.canTrack(ANALYTICS_EVENTS.API_USAGE)) return;

		const event: APIUsageEvent = {
			id: this.generateEventId(),
			name: ANALYTICS_EVENTS.API_USAGE,
			timestamp: Date.now(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.session?.userId,
			sessionId: this.session?.id || '',
			data: params,
		};

		this.trackEvent(event);
	}

	/**
	 * Track custom events
	 */
	trackCustomEvent(
		eventName: string,
		data: Record<string, any>,
		properties?: Record<string, string | number | boolean>
	): void {
		if (!this.config.customEvents.enabled) return;
		if (!this.config.customEvents.allowedEvents.includes(eventName)) return;

		const event: AnalyticsEvent = {
			id: this.generateEventId(),
			name: eventName,
			timestamp: Date.now(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			userId: this.session?.userId,
			sessionId: this.session?.id || '',
			data,
			properties,
		};

		this.trackEvent(event);
	}

	/**
	 * Update user consent
	 */
	updateConsent(consent: Partial<AnalyticsConsent>): void {
		this.consent = {
			analytics: consent.analytics ?? false,
			performance: consent.performance ?? false,
			interactions: consent.interactions ?? false,
			timestamp: Date.now(),
			version: '1.0',
			...consent,
		};

		this.saveConsent();
		this.trackCustomEvent('consent_update', {
			analytics: this.consent.analytics,
			performance: this.consent.performance,
			interactions: this.consent.interactions,
		});
	}

	/**
	 * Get current session information
	 */
	getSession(): AnalyticsSession | null {
		return this.session;
	}

	/**
	 * Get current consent status
	 */
	getConsent(): AnalyticsConsent | null {
		return this.consent;
	}

	/**
	 * Force send pending events
	 */
	async flush(): Promise<void> {
		if (this.eventQueue.length === 0) return;

		const batch = this.createBatch();
		await this.sendBatch(batch);
	}

	/**
	 * Reset analytics data
	 */
	reset(): void {
		this.eventQueue = [];
		this.session = null;
		this.consent = null;
		this.clearStorage();
		this.initializeCounters();
	}

	/**
	 * Private methods
	 */

	private async initializeSession(): Promise<void> {
		const existingSessionId = this.getStorageItem('sessionId');

		if (existingSessionId) {
			// Resume existing session
			this.session = {
				id: existingSessionId,
				userId: this.getStorageItem('userId') || undefined,
				startTime: Date.now(),
				lastActivity: Date.now(),
				pageViews: 0,
				toolUsage: 0,
				duration: 0,
				userAgent: navigator.userAgent,
				referrer: document.referrer,
				landingPage: window.location.pathname,
			};
		} else {
			// Create new session
			this.session = {
				id: this.generateSessionId(),
				userId: this.getStorageItem('userId') || undefined,
				startTime: Date.now(),
				lastActivity: Date.now(),
				pageViews: 0,
				toolUsage: 0,
				duration: 0,
				userAgent: navigator.userAgent,
				referrer: document.referrer,
				landingPage: window.location.pathname,
			};
			this.setStorageItem('sessionId', this.session.id);
		}
	}

	private async initializeConsent(): Promise<void> {
		if (!this.config.privacy.requireConsent) {
			this.consent = {
				analytics: true,
				performance: true,
				interactions: true,
				timestamp: Date.now(),
				version: '1.0',
			};
			return;
		}

		const savedConsent = this.getStorageItem('consent');
		if (savedConsent) {
			try {
				this.consent = JSON.parse(savedConsent);
			} catch (error) {
				this.logError('Failed to parse saved consent', error);
			}
		}
	}

	private initializePerformanceMonitoring(): void {
		if (!window.PerformanceObserver) return;

		// Monitor Core Web Vitals
		this.performanceObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();

			entries.forEach((entry) => {
				switch (entry.entryType) {
					case 'largest-contentful-paint':
						this.trackPerformance({
							lcp: entry.startTime,
						});
						break;

					case 'first-input':
						this.trackPerformance({
							fid: (entry as any).processingStart - entry.startTime,
						});
						break;

					case 'layout-shift':
						if (!(entry as any).hadRecentInput) {
							this.trackPerformance({
								cls: (entry as any).value,
							});
						}
						break;

					case 'navigation': {
						const navEntry = entry as PerformanceNavigationTiming;
						this.trackPerformance({
							fcp: navEntry.responseStart - navEntry.requestStart,
							ttfb: navEntry.responseStart - navEntry.requestStart,
							domContentLoaded:
								navEntry.domContentLoadedEventEnd - (navEntry.startTime || 0),
							load: navEntry.loadEventEnd - (navEntry.startTime || 0),
						});
						break;
					}
				}
			});
		});

		// Observe performance entries
		this.performanceObserver.observe({
			entryTypes: [
				'largest-contentful-paint',
				'first-input',
				'layout-shift',
				'navigation',
			],
		});
	}

	private initializeInteractionTracking(): void {
		// Click tracking
		document.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;
			this.trackInteraction({
				interactionType: 'click',
				elementId: target.id,
				elementTag: target.tagName,
				elementText: target.textContent?.slice(0, 100),
			});
		});

		// Scroll tracking (throttled)
		let scrollTimeout: NodeJS.Timeout;
		document.addEventListener('scroll', () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				const scrollDepth = this.calculateScrollDepth();
				this.trackInteraction({
					interactionType: 'scroll',
					scrollDepth,
				});
			}, 1000);
		});
	}

	private setupCloudflareWebAnalytics(): void {
		if (!this.config.trackingId) return;

		// Create Cloudflare Web Analytics script
		const script = document.createElement('script');
		script.src = `${CLOUDFLARE_ANALYTICS_CONFIG.endpoint}?id=${this.config.trackingId}`;
		script.async = true;
		script.defer = true;

		// Add data attributes for additional tracking
		script.setAttribute(
			'data-cf-beacon',
			JSON.stringify({
				token: this.config.trackingId,
				spa: true,
			})
		);

		document.head.appendChild(script);
	}

	private trackPageViewWithCloudflare(): void {
		if (!this.config.trackingId) return;

		// Trigger Cloudflare page view tracking
		if (window._cfBeacon) {
			window._cfBeacon('pageview');
		}
	}

	private trackEvent(event: AnalyticsEvent): void {
		if (!this.shouldSampleEvent()) return;
		if (!this.checkRateLimit(event.name)) return;

		this.eventQueue.push(event);
		this.logEvent(event);

		// Check if we should send the batch immediately
		if (this.eventQueue.length >= this.config.batching.maxSize) {
			this.flush();
		}
	}

	private startBatchProcessor(): void {
		if (!this.config.batching.enabled) return;

		this.batchTimer = setInterval(() => {
			if (this.eventQueue.length > 0) {
				this.flush();
			}
		}, this.config.batching.maxWaitTime);
	}

	private createBatch(): AnalyticsBatch {
		return {
			id: this.generateBatchId(),
			events: [...this.eventQueue],
			timestamp: Date.now(),
			status: 'pending',
			retryCount: 0,
		};
	}

	private async sendBatch(batch: AnalyticsBatch): Promise<void> {
		if (this.eventQueue.length === 0) return;

		try {
			batch.status = 'sending';

			const response = await fetch(
				CLOUDFLARE_ANALYTICS_CONFIG.customDataEndpoint,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Request-ID': this.generateEventId(),
					},
					body: JSON.stringify({
						batchId: batch.id,
						events: batch.events,
						sessionId: this.session?.id,
						userId: this.session?.userId,
						timestamp: batch.timestamp,
					}),
				}
			);

			if (response.ok) {
				batch.status = 'sent';
				this.eventQueue = [];
				this.log(`Batch ${batch.id} sent successfully`);
			} else {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (error) {
			batch.status = 'failed';
			batch.error = error instanceof Error ? error.message : 'Unknown error';

			if (batch.retryCount < RATE_LIMITS.batchRetries) {
				batch.retryCount++;
				setTimeout(
					() => this.sendBatch(batch),
					RATE_LIMITS.retryDelay * batch.retryCount
				);
			} else {
				this.logError(`Failed to send batch ${batch.id}`, error);
				// Remove failed events from queue to prevent memory issues
				this.eventQueue = this.eventQueue.filter(
					(event) => !batch.events.includes(event)
				);
			}
		}
	}

	private canTrack(eventType: string): boolean {
		if (!this.config.enabled) return false;
		if (!this.isInitialized) return false;
		if (!this.consent) return false;

		switch (eventType) {
			case ANALYTICS_EVENTS.PAGE_VIEW:
				return this.consent.analytics;
			case ANALYTICS_EVENTS.TOOL_USAGE:
				return this.consent.analytics;
			case ANALYTICS_EVENTS.PERFORMANCE:
				return this.consent.performance;
			case ANALYTICS_EVENTS.USER_INTERACTION:
				return this.consent.interactions;
			case ANALYTICS_EVENTS.API_USAGE:
				return this.consent.analytics;
			default:
				return this.consent.analytics;
		}
	}

	private shouldSampleEvent(): boolean {
		return Math.random() < this.config.sampleRate;
	}

	private checkRateLimit(eventType: string): boolean {
		const currentCount = this.eventCounters.get(eventType) || 0;
		if (currentCount >= RATE_LIMITS.eventsPerMinute) {
			return false;
		}
		this.eventCounters.set(eventType, currentCount + 1);
		return true;
	}

	private updateSessionPageView(): void {
		if (this.session) {
			this.session.pageViews++;
			this.session.lastActivity = Date.now();
			this.saveSession();
		}
	}

	private updateSessionToolUsage(): void {
		if (this.session) {
			this.session.toolUsage++;
			this.session.lastActivity = Date.now();
			this.saveSession();
		}
	}

	private calculateTimeOnPage(): number {
		if (!this.session) return 0;
		return Date.now() - this.session.lastActivity;
	}

	private calculateScrollDepth(): number {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const documentHeight =
			document.documentElement.scrollHeight - window.innerHeight;
		return Math.round((scrollTop / documentHeight) * 100);
	}

	private getConnectionType(): string {
		return (navigator as any).connection?.effectiveType || 'unknown';
	}

	private getEffectiveConnectionType(): string {
		return (navigator as any).connection?.effectiveType || 'unknown';
	}

	private hasDNT(): boolean {
		return (
			navigator.doNotTrack === '1' ||
			(window as any).doNotTrack === '1' ||
			(navigator as any).msDoNotTrack === '1'
		);
	}

	private initializeCounters(): void {
		// Reset counters every minute
		setInterval(() => {
			this.eventCounters.clear();
		}, 60000);
	}

	// Storage helpers
	private getStorageItem(key: string): string | null {
		try {
			return localStorage.getItem(
				CLOUDFLARE_ANALYTICS_CONFIG.storage[
					key as keyof typeof CLOUDFLARE_ANALYTICS_CONFIG.storage
				]
			);
		} catch {
			return null;
		}
	}

	private setStorageItem(key: string, value: string): void {
		try {
			localStorage.setItem(
				CLOUDFLARE_ANALYTICS_CONFIG.storage[
					key as keyof typeof CLOUDFLARE_ANALYTICS_CONFIG.storage
				],
				value
			);
		} catch (error) {
			this.logError(`Failed to save ${key} to localStorage`, error);
		}
	}

	private clearStorage(): void {
		try {
			Object.values(CLOUDFLARE_ANALYTICS_CONFIG.storage).forEach((key) => {
				localStorage.removeItem(key);
			});
		} catch (error) {
			this.logError('Failed to clear localStorage', error);
		}
	}

	private saveSession(): void {
		if (this.session) {
			this.setStorageItem('sessionId', this.session.id);
			if (this.session.userId) {
				this.setStorageItem('userId', this.session.userId);
			}
		}
	}

	private saveConsent(): void {
		if (this.consent) {
			this.setStorageItem('consent', JSON.stringify(this.consent));
		}
	}

	// ID generators
	private generateEventId(): string {
		return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateSessionId(): string {
		return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateBatchId(): string {
		return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Logging helpers
	private log(message: string): void {
		if (this.config.debug) {
			console.log(`[Cloudflare Analytics] ${message}`);
		}
	}

	private logEvent(event: AnalyticsEvent): void {
		if (this.config.debug) {
			console.log(`[Cloudflare Analytics Event] ${event.name}:`, event.data);
		}
	}

	private logError(message: string, error: any): void {
		console.error(`[Cloudflare Analytics Error] ${message}:`, error);
	}
}

// Global Cloudflare Web Analytics interface
declare global {
	interface Window {
		_cfBeacon?: (command: string) => void;
	}
}

// Singleton instance
let analyticsClient: CloudflareAnalyticsClient | null = null;

export function createAnalyticsClient(
	config?: Partial<AnalyticsConfig>
): CloudflareAnalyticsClient {
	if (!analyticsClient) {
		analyticsClient = new CloudflareAnalyticsClient(config);
	}
	return analyticsClient;
}

export function getAnalyticsClient(): CloudflareAnalyticsClient | null {
	return analyticsClient;
}
