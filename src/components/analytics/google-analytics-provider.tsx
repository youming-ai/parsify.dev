"use client";

import { getGoogleAnalyticsService } from "@/lib/analytics/google-analytics";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

interface GoogleAnalyticsProviderProps {
  children: React.ReactNode;
  measurementId?: string;
  enabled?: boolean;
  debug?: boolean;
  anonymizeIp?: boolean;
}

interface GoogleAnalyticsProviderInnerProps {
  measurementId?: string;
  enabled?: boolean;
  debug?: boolean;
  anonymizeIp?: boolean;
}

/**
 * Google Analytics Provider Inner Component
 * Handles Google Analytics initialization and page view tracking
 */
function GoogleAnalyticsProviderInner({
  measurementId,
  enabled,
  debug,
  anonymizeIp,
}: GoogleAnalyticsProviderInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window === "undefined") return;

    // Initialize Google Analytics
    const initializeGoogleAnalytics = async () => {
      try {
        const gaService = getGoogleAnalyticsService();

        // Update configuration if provided
        if (measurementId || enabled !== undefined || debug !== undefined || anonymizeIp !== undefined) {
          gaService.updateConfig({
            measurementId: measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
            enabled: enabled ?? process.env.NODE_ENV !== "development",
            debug: debug ?? process.env.NODE_ENV === "development",
            anonymizeIp: anonymizeIp ?? true,
          });
        }

        // Initialize the service
        await gaService.initialize();
      } catch (error) {
        console.error("Failed to initialize Google Analytics:", error);
      }
    };

    initializeGoogleAnalytics();
  }, [measurementId, enabled, debug, anonymizeIp]);

  // Track page views when pathname or search params change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const trackPageView = () => {
      try {
        const gaService = getGoogleAnalyticsService();

        if (gaService.isReady()) {
          const fullPath = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

          gaService.trackPageView(fullPath);
        }
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    // Small delay to ensure the page title is updated
    const timeoutId = setTimeout(trackPageView, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Google Analytics Provider
 * Wraps the provider in Suspense boundary for Next.js 16 compatibility
 */
export function GoogleAnalyticsProvider({
  children,
  measurementId,
  enabled,
  debug,
  anonymizeIp,
}: GoogleAnalyticsProviderProps) {
  return (
    <>
      <Suspense fallback={null}>
        <GoogleAnalyticsProviderInner
          measurementId={measurementId}
          enabled={enabled}
          debug={debug}
          anonymizeIp={anonymizeIp}
        />
      </Suspense>
      {children}
    </>
  );
}
