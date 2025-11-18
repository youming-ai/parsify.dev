/**
 * Performance Monitor Component
 * Monitors Core Web Vitals and performance metrics
 */

"use client";

import { useSimplifiedAnalytics } from "@/lib/analytics/simplified";
import { useEffect } from "react";

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

export function PerformanceMonitor({ children }: PerformanceMonitorProps) {
  const { trackPerformance } = useSimplifiedAnalytics();

  useEffect(() => {
    // Only run in browser and when performance API is available
    if (typeof window === "undefined" || !window.performance) return;

    const measurePerformance = () => {
      try {
        // Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            switch (entry.entryType) {
              case "navigation":
                const navEntry = entry as PerformanceNavigationTiming;
                // Track key navigation metrics
                trackPerformance(
                  "dom_content_loaded",
                  navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                );
                trackPerformance("page_load", navEntry.loadEventEnd - navEntry.fetchStart);
                trackPerformance(
                  "time_to_first_byte",
                  navEntry.responseStart - navEntry.requestStart,
                );
                break;

              case "paint":
                const paintEntry = entry as PerformancePaintTiming;
                if (paintEntry.name === "first-contentful-paint") {
                  trackPerformance("first_contentful_paint", paintEntry.startTime);
                }
                break;

              case "largest-contentful-paint":
                const lcpEntry = entry as LargestContentfulPaint;
                trackPerformance("largest_contentful_paint", lcpEntry.startTime);
                break;

              case "first-input":
                const fidEntry = entry as PerformanceEventTiming;
                trackPerformance(
                  "first_input_delay",
                  fidEntry.processingStart - fidEntry.startTime,
                );
                break;

              case "layout-shift":
                const clsEntry = entry as LayoutShift;
                if (!clsEntry.hadRecentInput) {
                  // Cumulative Layout Shift needs to be accumulated
                  trackPerformance("cumulative_layout_shift", clsEntry.value);
                }
                break;
            }
          }
        });

        // Observe different performance entry types
        observer.observe({
          entryTypes: [
            "navigation",
            "paint",
            "largest-contentful-paint",
            "first-input",
            "layout-shift",
          ],
        });

        // Cleanup
        return () => observer.disconnect();
      } catch (error) {
        console.warn("Performance monitoring failed:", error);
      }
    };

    // Start measuring after page loads
    if (document.readyState === "complete") {
      measurePerformance();
    } else {
      window.addEventListener("load", measurePerformance);
      return () => window.removeEventListener("load", measurePerformance);
    }
  }, [trackPerformance]);

  // Monitor memory usage (Chrome-specific)
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).performance?.memory) return;

    const measureMemory = () => {
      try {
        const memory = (window as any).performance.memory;
        if (memory) {
          trackPerformance("memory_used", memory.usedJSHeapSize);
          trackPerformance("memory_limit", memory.jsHeapSizeLimit);
          trackPerformance("memory_total", memory.totalJSHeapSize);
        }
      } catch (error) {
        // Memory measurement might not be available in all browsers
      }
    };

    // Measure memory every 30 seconds
    const interval = setInterval(measureMemory, 30000);

    return () => clearInterval(interval);
  }, [trackPerformance]);

  return <>{children}</>;
}

// Type declarations for Performance Observer
declare global {
  interface PerformanceObserverEntryList {
    getEntries(): PerformanceEntry[];
  }

  interface LargestContentfulPaint extends PerformanceEntry {
    startTime: number;
  }

  interface LayoutShift extends PerformanceEntry {
    value: number;
    hadRecentInput: boolean;
  }
}
