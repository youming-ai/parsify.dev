/**
 * React hooks for Cloudflare Analytics
 * Provides easy integration with React components
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	type CloudflareAnalyticsClient,
	createAnalyticsClient,
	getAnalyticsClient,
} from './client';
import type { AnalyticsConsent, AnalyticsSession } from './types';

/**
 * Hook for accessing the analytics client
 */
export function useAnalytics() {
	const [client, setClient] = useState<CloudflareAnalyticsClient | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [session, setSession] = useState<AnalyticsSession | null>(null);
	const [consent, setConsent] = useState<AnalyticsConsent | null>(null);

	useEffect(() => {
		const analyticsClient = getAnalyticsClient() || createAnalyticsClient();
		setClient(analyticsClient);

		// Initialize the client
		analyticsClient.initialize().then(() => {
			setIsInitialized(true);
			setSession(analyticsClient.getSession());
			setConsent(analyticsClient.getConsent());
		});

		// Set up interval to update session info
		const interval = setInterval(() => {
			setSession(analyticsClient.getSession());
			setConsent(analyticsClient.getConsent());
		}, 5000);

		return () => {
			clearInterval(interval);
			analyticsClient.flush();
		};
	}, []);

	const trackPageView = useCallback(
		(path?: string, title?: string) => {
			if (client) {
				client.trackPageView(path, title);
			}
		},
		[client]
	);

	const trackToolUsage = useCallback(
		(params: {
			toolId: string;
			toolName: string;
			action: 'execute' | 'validate' | 'format' | 'convert' | 'error';
			processingTime?: number;
			inputSize?: number;
			outputSize?: number;
			error?: string;
			metrics?: Record<string, number>;
		}) => {
			if (client) {
				client.trackToolUsage(params);
			}
		},
		[client]
	);

	const trackPerformance = useCallback(
		(metrics: Record<string, number>) => {
			if (client) {
				client.trackPerformance(metrics);
			}
		},
		[client]
	);

	const trackInteraction = useCallback(
		(params: {
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
		}) => {
			if (client) {
				client.trackInteraction(params);
			}
		},
		[client]
	);

	const trackAPIUsage = useCallback(
		(params: {
			endpoint: string;
			method: string;
			statusCode: number;
			responseTime: number;
			requestSize?: number;
			responseSize?: number;
			error?: string;
		}) => {
			if (client) {
				client.trackAPIUsage(params);
			}
		},
		[client]
	);

	const trackCustomEvent = useCallback(
		(
			eventName: string,
			data: Record<string, any>,
			properties?: Record<string, string | number | boolean>
		) => {
			if (client) {
				client.trackCustomEvent(eventName, data, properties);
			}
		},
		[client]
	);

	const updateConsent = useCallback(
		(consent: Partial<AnalyticsConsent>) => {
			if (client) {
				client.updateConsent(consent);
				setConsent(client.getConsent());
			}
		},
		[client]
	);

	const flush = useCallback(() => {
		if (client) {
			client.flush();
		}
	}, [client]);

	return {
		isInitialized,
		session,
		consent,
		trackPageView,
		trackToolUsage,
		trackPerformance,
		trackInteraction,
		trackAPIUsage,
		trackCustomEvent,
		updateConsent,
		flush,
	};
}

/**
 * Hook for tracking page views automatically
 */
export function usePageViewTracking(path?: string, title?: string) {
	const { trackPageView } = useAnalytics();
	const previousPath = useRef(path);

	useEffect(() => {
		// Track initial page view
		trackPageView(path, title);

		// Track subsequent page view changes
		if (previousPath.current !== path) {
			trackPageView(path, title);
			previousPath.current = path;
		}
	}, [path, title, trackPageView]);
}

/**
 * Hook for tracking tool usage with performance metrics
 */
export function useToolUsageTracking(toolId: string, toolName: string) {
	const { trackToolUsage } = useAnalytics();
	const startTime = useRef<number>(0);

	const startTracking = useCallback(() => {
		startTime.current = Date.now();
	}, []);

	const endTracking = useCallback(
		(
			action: 'execute' | 'validate' | 'format' | 'convert' | 'error',
			params?: {
				inputSize?: number;
				outputSize?: number;
				error?: string;
				metrics?: Record<string, number>;
			}
		) => {
			const processingTime = startTime.current
				? Date.now() - startTime.current
				: undefined;
			trackToolUsage({
				toolId,
				toolName,
				action,
				processingTime,
				...params,
			});
		},
		[toolId, toolName, trackToolUsage]
	);

	return { startTracking, endTracking };
}

/**
 * Hook for tracking component interactions
 */
export function useInteractionTracking(
	elementId?: string,
	elementTag?: string
) {
	const { trackInteraction } = useAnalytics();

	const trackClick = useCallback(
		(elementText?: string) => {
			trackInteraction({
				interactionType: 'click',
				elementId,
				elementTag,
				elementText,
			});
		},
		[elementId, elementTag, trackInteraction]
	);

	const trackFocus = useCallback(() => {
		trackInteraction({
			interactionType: 'focus',
			elementId,
			elementTag,
		});
	}, [elementId, elementTag, trackInteraction]);

	const trackBlur = useCallback(() => {
		trackInteraction({
			interactionType: 'blur',
			elementId,
			elementTag,
		});
	}, [elementId, elementTag, trackInteraction]);

	const trackSubmit = useCallback(
		(elementText?: string) => {
			trackInteraction({
				interactionType: 'submit',
				elementId,
				elementTag,
				elementText,
			});
		},
		[elementId, elementTag, trackInteraction]
	);

	return { trackClick, trackFocus, trackBlur, trackSubmit };
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTracking() {
	const { trackPerformance } = useAnalytics();
	const performanceMetrics = useRef<Record<string, number>>({});

	const recordMetric = useCallback(
		(name: string, value: number) => {
			performanceMetrics.current[name] = value;
			trackPerformance({ [name]: value });
		},
		[trackPerformance]
	);

	const getMetrics = useCallback(() => {
		return { ...performanceMetrics.current };
	}, []);

	return { recordMetric, getMetrics };
}

/**
 * Hook for tracking form submissions
 */
export function useFormTracking(formId: string) {
	const { trackInteraction, trackCustomEvent } = useAnalytics();

	const trackFormStart = useCallback(() => {
		trackCustomEvent('form_start', {
			formId,
			timestamp: Date.now(),
		});
	}, [formId, trackCustomEvent]);

	const trackFormSubmit = useCallback(
		(success: boolean, error?: string, formData?: Record<string, any>) => {
			trackCustomEvent('form_submit', {
				formId,
				success,
				error,
				fieldCount: formData ? Object.keys(formData).length : 0,
				timestamp: Date.now(),
			});

			trackInteraction({
				interactionType: 'submit',
				elementId: formId,
				elementTag: 'form',
			});
		},
		[formId, trackCustomEvent, trackInteraction]
	);

	const trackFormFieldError = useCallback(
		(fieldName: string, error: string) => {
			trackCustomEvent('form_field_error', {
				formId,
				fieldName,
				error,
				timestamp: Date.now(),
			});
		},
		[formId, trackCustomEvent]
	);

	return { trackFormStart, trackFormSubmit, trackFormFieldError };
}

/**
 * Hook for tracking search queries
 */
export function useSearchTracking(searchType: string) {
	const { trackCustomEvent } = useAnalytics();

	const trackSearch = useCallback(
		(query: string, resultsCount?: number, searchTime?: number) => {
			trackCustomEvent('search', {
				searchType,
				query: query.trim(),
				queryLength: query.trim().length,
				resultsCount,
				searchTime,
				timestamp: Date.now(),
			});
		},
		[searchType, trackCustomEvent]
	);

	const trackSearchFilter = useCallback(
		(filterName: string, filterValue: string) => {
			trackCustomEvent('search_filter', {
				searchType,
				filterName,
				filterValue,
				timestamp: Date.now(),
			});
		},
		[searchType, trackCustomEvent]
	);

	const trackSearchResultClick = useCallback(
		(resultPosition: number, resultId?: string) => {
			trackCustomEvent('search_result_click', {
				searchType,
				resultPosition,
				resultId,
				timestamp: Date.now(),
			});
		},
		[searchType, trackCustomEvent]
	);

	return { trackSearch, trackSearchFilter, trackSearchResultClick };
}

/**
 * Hook for tracking user engagement
 */
export function useEngagementTracking() {
	const { trackInteraction, trackCustomEvent } = useAnalytics();
	const engagementStartTime = useRef(Date.now());
	const lastActivityTime = useRef(Date.now());

	const trackEngagement = useCallback(
		(action: string, data?: Record<string, any>) => {
			const totalEngagementTime = Date.now() - engagementStartTime.current;
			const timeSinceLastActivity = Date.now() - lastActivityTime.current;

			trackCustomEvent('engagement', {
				action,
				totalEngagementTime,
				timeSinceLastActivity,
				...data,
			});

			lastActivityTime.current = Date.now();
		},
		[trackCustomEvent]
	);

	const trackScrollDepth = useCallback(
		(depth: number) => {
			trackInteraction({
				interactionType: 'scroll',
				scrollDepth: depth,
			});
			trackEngagement('scroll', { depth });
		},
		[trackInteraction, trackEngagement]
	);

	const trackDwellTime = useCallback(() => {
		const dwellTime = Date.now() - engagementStartTime.current;
		trackCustomEvent('dwell_time', {
			dwellTime,
			pagePath: window.location.pathname,
		});
	}, [trackCustomEvent]);

	return { trackEngagement, trackScrollDepth, trackDwellTime };
}

/**
 * Hook for tracking errors
 */
export function useErrorTracking() {
	const { trackCustomEvent } = useAnalytics();

	const trackError = useCallback(
		(error: Error | string, context?: Record<string, any>) => {
			const errorMessage = error instanceof Error ? error.message : error;
			const errorStack = error instanceof Error ? error.stack : undefined;

			trackCustomEvent('error', {
				message: errorMessage,
				stack: errorStack,
				url: window.location.href,
				userAgent: navigator.userAgent,
				timestamp: Date.now(),
				...context,
			});
		},
		[trackCustomEvent]
	);

	const trackAPIError = useCallback(
		(
			endpoint: string,
			statusCode: number,
			error: string,
			context?: Record<string, any>
		) => {
			trackCustomEvent('api_error', {
				endpoint,
				statusCode,
				error,
				url: window.location.href,
				timestamp: Date.now(),
				...context,
			});
		},
		[trackCustomEvent]
	);

	return { trackError, trackAPIError };
}

/**
 * Hook for managing analytics consent
 */
export function useAnalyticsConsent() {
	const { consent, updateConsent } = useAnalytics();

	const grantAllConsent = useCallback(() => {
		updateConsent({
			analytics: true,
			performance: true,
			interactions: true,
		});
	}, [updateConsent]);

	const revokeAllConsent = useCallback(() => {
		updateConsent({
			analytics: false,
			performance: false,
			interactions: false,
		});
	}, [updateConsent]);

	const updateAnalyticsConsent = useCallback(
		(granted: boolean) => {
			updateConsent({ analytics: granted });
		},
		[updateConsent]
	);

	const updatePerformanceConsent = useCallback(
		(granted: boolean) => {
			updateConsent({ performance: granted });
		},
		[updateConsent]
	);

	const updateInteractionConsent = useCallback(
		(granted: boolean) => {
			updateConsent({ interactions: granted });
		},
		[updateConsent]
	);

	return {
		consent,
		grantAllConsent,
		revokeAllConsent,
		updateAnalyticsConsent,
		updatePerformanceConsent,
		updateInteractionConsent,
	};
}
