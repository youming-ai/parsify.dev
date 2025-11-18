/**
 * React hooks for Analytics (Cloudflare)
 * Provides easy-to-use hooks for React components
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AnalyticsConfig,
  type AnalyticsConsent,
  type AnalyticsSession,
  type CloudflareAnalyticsClient,
  createAnalyticsClient,
} from "./client";

/**
 * Hook to initialize and access the analytics client
 */
export function useAnalytics(config?: Partial<AnalyticsConfig>) {
  const [client, setClient] = useState<CloudflareAnalyticsClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const analyticsClient = createAnalyticsClient(config);

    analyticsClient.initialize().then(() => {
      setClient(analyticsClient);
      setIsInitialized(true);
    });

    return () => {
      // Cleanup on unmount
      analyticsClient.flush();
    };
  }, [config]);

  // Track page views on route changes
  // Note: Next.js App Router doesn't have router.events
  // Page view tracking should be done manually or via pathname change detection
  useEffect(() => {
    if (!client || !isInitialized) return;

    // Track initial page view
    client.trackPageView();
  }, [client, isInitialized]);

  return {
    client,
    isInitialized,
    trackPageView: useCallback(
      (path?: string, title?: string) => client?.trackPageView(path, title),
      [client],
    ),
    trackToolUsage: useCallback(
      (params: Parameters<CloudflareAnalyticsClient["trackToolUsage"]>[0]) =>
        client?.trackToolUsage(params),
      [client],
    ),
    trackPerformance: useCallback(
      (params: Parameters<CloudflareAnalyticsClient["trackPerformance"]>[0]) =>
        client?.trackPerformance(params),
      [client],
    ),
    trackInteraction: useCallback(
      (params: Parameters<CloudflareAnalyticsClient["trackInteraction"]>[0]) =>
        client?.trackInteraction(params),
      [client],
    ),
    trackAPIUsage: useCallback(
      (params: Parameters<CloudflareAnalyticsClient["trackAPIUsage"]>[0]) =>
        client?.trackAPIUsage(params),
      [client],
    ),
    trackCustomEvent: useCallback(
      (
        eventName: string,
        data: Record<string, unknown>,
        properties?: Record<string, string | number | boolean>,
      ) => client?.trackCustomEvent(eventName, data, properties),
      [client],
    ),
    updateConsent: useCallback(
      (consent: Partial<AnalyticsConsent>) => client?.updateConsent(consent),
      [client],
    ),
    getSession: useCallback(() => client?.getSession(), [client]),
    getConsent: useCallback(() => client?.getConsent(), [client]),
    flush: useCallback(() => client?.flush(), [client]),
    reset: useCallback(() => client?.reset(), [client]),
  };
}

/**
 * Hook to track page views automatically
 */
export function usePageViewTracking(enabled = true) {
  const { trackPageView } = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || hasTracked.current) return;

    trackPageView();
    hasTracked.current = true;
  }, [enabled, trackPageView]);
}

/**
 * Hook to track tool usage
 */
export function useToolTracking(toolId: string, toolName: string) {
  const { trackToolUsage } = useAnalytics();

  const trackExecute = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: "execute",
        processingTime,
        inputSize,
        outputSize,
      });
    },
    [toolId, toolName, trackToolUsage],
  );

  const trackValidate = useCallback(
    (processingTime?: number, inputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: "validate",
        processingTime,
        inputSize,
      });
    },
    [toolId, toolName, trackToolUsage],
  );

  const trackFormat = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: "format",
        processingTime,
        inputSize,
        outputSize,
      });
    },
    [toolId, toolName, trackToolUsage],
  );

  const trackConvert = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: "convert",
        processingTime,
        inputSize,
        outputSize,
      });
    },
    [toolId, toolName, trackToolUsage],
  );

  const trackError = useCallback(
    (error: string, processingTime?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: "error",
        error,
        processingTime,
      });
    },
    [toolId, toolName, trackToolUsage],
  );

  return {
    trackExecute,
    trackValidate,
    trackFormat,
    trackConvert,
    trackError,
  };
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking() {
  const { trackPerformance } = useAnalytics();

  useEffect(() => {
    if (!window.performance || !window.PerformanceObserver) return;

    // Track initial page load performance
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        trackPerformance({
          fcp: navigation.responseStart - navigation.requestStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.fetchStart,
          load: navigation.loadEventEnd - navigation.fetchStart,
        });
      }
    };

    if (document.readyState === "complete") {
      trackPageLoad();
    } else {
      window.addEventListener("load", trackPageLoad);
      return () => window.removeEventListener("load", trackPageLoad);
    }
  }, [trackPerformance]);

  const trackCustomPerformance = useCallback(
    (metrics: Parameters<CloudflareAnalyticsClient["trackPerformance"]>[0]) => {
      trackPerformance(metrics);
    },
    [trackPerformance],
  );

  return {
    trackCustomPerformance,
  };
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const { trackInteraction } = useAnalytics();

  const trackClick = useCallback(
    (elementId?: string, elementTag?: string, elementText?: string) => {
      trackInteraction({
        interactionType: "click",
        elementId,
        elementTag,
        elementText,
      });
    },
    [trackInteraction],
  );

  const trackScroll = useCallback(
    (scrollDepth: number) => {
      trackInteraction({
        interactionType: "scroll",
        scrollDepth,
      });
    },
    [trackInteraction],
  );

  const trackFocus = useCallback(
    (elementId?: string, elementTag?: string) => {
      trackInteraction({
        interactionType: "focus",
        elementId,
        elementTag,
      });
    },
    [trackInteraction],
  );

  const trackNavigation = useCallback(
    (targetUrl: string) => {
      trackInteraction({
        interactionType: "navigation",
        targetUrl,
      });
    },
    [trackInteraction],
  );

  return {
    trackClick,
    trackScroll,
    trackFocus,
    trackNavigation,
  };
}

/**
 * Hook to track API usage
 */
export function useAPITracking() {
  const { trackAPIUsage } = useAnalytics();

  const trackAPICall = useCallback(
    (params: {
      endpoint: string;
      method: string;
      statusCode: number;
      responseTime: number;
      requestSize?: number;
      responseSize?: number;
      error?: string;
    }) => {
      trackAPIUsage(params);
    },
    [trackAPIUsage],
  );

  return {
    trackAPICall,
  };
}

/**
 * Hook to manage analytics consent
 */
export function useAnalyticsConsent() {
  const { client, updateConsent, getConsent } = useAnalytics();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    const currentConsent = getConsent();
    if (currentConsent !== undefined) {
      setConsent(currentConsent);
    }
  }, [getConsent]);

  const grantConsent = useCallback(
    (level: "minimal" | "full" | "custom" = "full") => {
      const newConsent: Partial<AnalyticsConsent> = {
        analytics: true,
        performance: level !== "minimal",
        interactions: level === "full",
        timestamp: Date.now(),
      };

      updateConsent(newConsent);
      setConsent({ ...consent, ...newConsent } as AnalyticsConsent);
    },
    [consent, updateConsent],
  );

  const revokeConsent = useCallback(() => {
    const newConsent: Partial<AnalyticsConsent> = {
      analytics: false,
      performance: false,
      interactions: false,
      timestamp: Date.now(),
    };

    updateConsent(newConsent);
    setConsent({ ...consent, ...newConsent } as AnalyticsConsent);
  }, [consent, updateConsent]);

  const updateCustomConsent = useCallback(
    (customConsent: Partial<AnalyticsConsent>) => {
      updateConsent({
        ...customConsent,
        timestamp: Date.now(),
      });
      setConsent({ ...consent, ...customConsent } as AnalyticsConsent);
    },
    [consent, updateConsent],
  );

  return {
    consent,
    hasConsent: consent?.analytics || false,
    grantConsent,
    revokeConsent,
    updateCustomConsent,
  };
}

/**
 * Hook to access analytics session information
 */
export function useAnalyticsSession() {
  const { getSession } = useAnalytics();
  const [session, setSession] = useState<AnalyticsSession | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (currentSession !== undefined) {
      setSession(currentSession);
    }
  }, [getSession]);

  return {
    session,
    sessionId: session?.id,
    userId: session?.userId,
    sessionDuration: session ? Date.now() - session.startTime : 0,
    pageViews: session?.pageViews || 0,
    toolUsage: session?.toolUsage || 0,
  };
}

/**
 * Hook to create event tracking props for components
 */
export function useEventTracking() {
  const { trackCustomEvent } = useAnalytics();

  const createEventProps = useCallback(
    (eventName: string) => {
      return {
        "data-track-event": eventName,
        onClick: (event: React.MouseEvent) => {
          const target = event.currentTarget;
          trackCustomEvent(eventName, {
            elementId: target.id,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100),
          });
        },
      };
    },
    [trackCustomEvent],
  );

  return {
    createEventProps,
  };
}

/**
 * Higher-order component for automatic page view tracking
 */
export function withPageViewTracking<P extends object>(
  Component: React.ComponentType<P>,
  trackProps?: {
    path?: string;
    title?: string;
  },
) {
  return function TrackedComponent(props: P) {
    const { trackPageView } = useAnalytics();

    useEffect(() => {
      trackPageView(trackProps?.path, trackProps?.title);
    }, [trackPageView, trackProps?.path, trackProps?.title]);

    return <Component {...props} />;
  };
}

export default useAnalytics;
