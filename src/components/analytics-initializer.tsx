/**
 * Analytics Initializer Component
 * Initializes analytics services with proper error handling
 */

"use client";

import { useEffect } from "react";
import { getGoogleAnalyticsService } from "@/lib/analytics/google-analytics";
import { useSimplifiedAnalytics } from "@/lib/analytics/simplified";

interface AnalyticsInitializerProps {
  children: React.ReactNode;
}

export function AnalyticsInitializer({ children }: AnalyticsInitializerProps) {
  const { isReady, trackPageView } = useSimplifiedAnalytics({
    enableClarity: !!process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID,
    enableCloudflare: true,
    debugMode: process.env.NODE_ENV === "development",
  });

  useEffect(() => {
    // Initialize Google Analytics
    const initializeGoogleAnalytics = async () => {
      try {
        const gaService = getGoogleAnalyticsService();

        // Only initialize if measurement ID is provided
        if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
          await gaService.initialize();
          console.log("Google Analytics initialized successfully");
        }
      } catch (error) {
        console.error("Failed to initialize Google Analytics:", error);
      }
    };

    initializeGoogleAnalytics();

    if (isReady) {
      // Track initial page view
      trackPageView();
    }
  }, [isReady, trackPageView]);

  // Render children immediately - analytics loads in background
  return <>{children}</>;
}
