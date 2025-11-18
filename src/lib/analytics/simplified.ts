/**
 * Simplified Analytics System
 * Lightweight, performant analytics with essential tracking only
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Types for simplified analytics
export interface SimplifiedAnalyticsEvent {
  event: string;
  data?: Record<string, any>;
  timestamp: number;
}

export interface AnalyticsConfig {
  enableClarity: boolean;
  enableCloudflare: boolean;
  debugMode: boolean;
}

class SimplifiedAnalytics {
  private events: SimplifiedAnalyticsEvent[] = [];
  private config: AnalyticsConfig;
  private isInitialized = false;
  private clarityReady = false;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enableClarity: true,
      enableCloudflare: true,
      debugMode: process.env.NODE_ENV === "development",
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Microsoft Clarity if enabled
      if (this.config.enableClarity) {
        await this.initializeClarity();
      }

      // Initialize Cloudflare Analytics if enabled
      if (this.config.enableCloudflare) {
        this.initializeCloudflare();
      }

      // Set up periodic flush
      this.setupFlushTimer();

      this.isInitialized = true;

      if (this.config.debugMode) {
        console.log("🔍 Analytics initialized");
      }
    } catch (error) {
      console.warn("Analytics initialization failed:", error);
    }
  }

  private async initializeClarity(): Promise<void> {
    try {
      // Check if Clarity script is already loaded
      if (window.clarity) {
        this.clarityReady = true;
        return;
      }

      // Load Clarity script dynamically
      const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;
      if (!clarityId) {
        if (this.config.debugMode) {
          console.warn("⚠️ Microsoft Clarity ID not found");
        }
        return;
      }

      await new Promise<void>((resolve, reject) => {
        // Create Clarity initialization function safely
        const initClarity = () => {
          // Create the clarity global function
          (window as any).clarity =
            (window as any).clarity ||
            (() => {
              ((window as any).clarity.q = (window as any).clarity.q || []).push(arguments);
            });

          // Create and append the Clarity script
          const script = document.createElement("script");
          script.async = true;
          script.src = `https://www.clarity.ms/tag/${clarityId}`;

          script.onload = () => {
            this.clarityReady = true;
            resolve();
          };

          script.onerror = () => reject(new Error("Failed to load Clarity"));

          // Insert script as first script element for better loading
          const firstScript = document.getElementsByTagName("script")[0];
          if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
          } else {
            document.head.appendChild(script);
          }
        };

        // Initialize Clarity
        initClarity();
      });

      if (this.config.debugMode) {
        console.log("✅ Microsoft Clarity initialized");
      }
    } catch (error) {
      console.warn("Microsoft Clarity initialization failed:", error);
    }
  }

  private initializeCloudflare(): void {
    // Cloudflare Web Analytics is automatically configured
    // via the dashboard, no additional setup needed
    if (this.config.debugMode) {
      console.log("✅ Cloudflare Analytics ready");
    }
  }

  private setupFlushTimer(): void {
    // Flush events every 30 seconds
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 30000);
  }

  track(event: string, data?: Record<string, any>): void {
    const analyticsEvent: SimplifiedAnalyticsEvent = {
      event,
      data,
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Track in external services
    this.trackInServices(analyticsEvent);

    if (this.config.debugMode) {
      console.log("📊 Analytics Event:", analyticsEvent);
    }
  }

  private trackInServices(event: SimplifiedAnalyticsEvent): void {
    // Track in Microsoft Clarity
    if (this.clarityReady && window.clarity) {
      try {
        window.clarity("event", event.event, event.data);
      } catch (error) {
        console.warn("Clarity tracking failed:", error);
      }
    }

    // Cloudflare Web Analytics tracks page views automatically
    // Custom events can be sent via Cloudflare API if needed
  }

  trackPageView(path?: string): void {
    this.track("page_view", { path: path || window.location.pathname });
  }

  trackToolUsage(toolId: string, action: string, metadata?: Record<string, any>): void {
    this.track("tool_usage", {
      toolId,
      action,
      ...metadata,
    });
  }

  trackError(error: Error | string, context?: Record<string, any>): void {
    this.track("error", {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number): void {
    this.track("performance", {
      metric,
      value,
    });
  }

  flush(): void {
    if (this.events.length === 0) return;

    // In a real implementation, you would send events to your analytics backend
    // For now, we just clear the queue
    const flushedEvents = this.events.splice(0);

    if (this.config.debugMode) {
      console.log(`🔄 Flushed ${flushedEvents.length} analytics events`);
    }
  }

  updateConsent(consented: boolean): void {
    if (this.clarityReady && window.clarity) {
      try {
        window.clarity("consent", consented);
      } catch (error) {
        console.warn("Failed to update Clarity consent:", error);
      }
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.flush();
    this.events = [];
    this.isInitialized = false;
  }
}

// Global analytics instance
let analyticsInstance: SimplifiedAnalytics | null = null;

export function getSimplifiedAnalytics(config?: Partial<AnalyticsConfig>): SimplifiedAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new SimplifiedAnalytics(config);
  }
  return analyticsInstance;
}

// React hooks for simplified analytics

export function useSimplifiedAnalytics(config?: Partial<AnalyticsConfig>) {
  const [isReady, setIsReady] = useState(false);
  const analyticsRef = useRef<SimplifiedAnalytics | null>(null);

  useEffect(() => {
    const analytics = getSimplifiedAnalytics(config);
    analyticsRef.current = analytics;

    analytics.initialize().then(() => {
      setIsReady(true);
    });

    return () => {
      analytics.destroy();
    };
  }, [config]);

  const track = useCallback((event: string, data?: Record<string, any>) => {
    analyticsRef.current?.track(event, data);
  }, []);

  const trackPageView = useCallback((path?: string) => {
    analyticsRef.current?.trackPageView(path);
  }, []);

  const trackToolUsage = useCallback(
    (toolId: string, action: string, metadata?: Record<string, any>) => {
      analyticsRef.current?.trackToolUsage(toolId, action, metadata);
    },
    [],
  );

  const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
    analyticsRef.current?.trackError(error, context);
  }, []);

  const trackPerformance = useCallback((metric: string, value: number) => {
    analyticsRef.current?.trackPerformance(metric, value);
  }, []);

  return {
    isReady,
    track,
    trackPageView,
    trackToolUsage,
    trackError,
    trackPerformance,
  };
}

export function useToolTracking(toolId: string) {
  const { trackToolUsage, trackError: trackErrorBase } = useSimplifiedAnalytics();

  const trackExecute = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage(toolId, "execute", {
        processingTime,
        inputSize,
        outputSize,
      });
    },
    [trackToolUsage, toolId],
  );

  const trackFormat = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage(toolId, "format", {
        processingTime,
        inputSize,
        outputSize,
      });
    },
    [trackToolUsage, toolId],
  );

  const trackValidate = useCallback(
    (isValid: boolean, processingTime?: number, inputSize?: number) => {
      trackToolUsage(toolId, "validate", {
        isValid,
        processingTime,
        inputSize,
      });
    },
    [trackToolUsage, toolId],
  );

  const trackError = useCallback(
    (error: Error | string, processingTime?: number) => {
      trackToolUsage(toolId, "error", {
        processingTime,
      });
      trackErrorBase(error, { toolId });
    },
    [trackToolUsage, trackErrorBase, toolId],
  );

  return {
    trackExecute,
    trackFormat,
    trackValidate,
    trackError,
  };
}

// Type declarations for global clarity
declare global {
  interface Window {
    clarity?: (command: string, ...args: any[]) => void;
  }
}

export default useSimplifiedAnalytics;
