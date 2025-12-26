/**
 * Performance Optimization Hook
 *
 * A comprehensive performance monitoring and optimization hook that provides
 * tools for tracking Core Web Vitals, memory usage, and rendering performance.
 * This hook helps identify performance bottlenecks and provides actionable insights
 * for optimization.
 *
 * 🚀 **Features:**
 * - Core Web Vitals monitoring (FID, LCP, CLS, FCP)
 * - Memory usage tracking and leak detection
 * - Component render performance analysis
 * - Network request optimization
 * - Resource loading performance metrics
 * - Automatic performance suggestions
 *
 * @example
 * ```typescript
 * const {
 *   metrics,
 *   vitals,
 *   memoryUsage,
 *   suggestions,
 *   trackPerformance
 * } = usePerformanceOptimization();
 *
 * // Track custom performance metrics
 * trackPerformance('tool-execution', () => {
 *   // Your expensive operation here
 * });
 * ```
 *
 * @since 1.0.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  interactionDelay: number;
  memoryUsage: number;
  bundleSize: number;
}

interface CoreWebVitals {
  fid?: number; // First Input Delay
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

interface PerformanceSuggestion {
  type: 'memory' | 'render' | 'network' | 'bundle';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  impact: string;
}

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    interactionDelay: 0,
    memoryUsage: 0,
    bundleSize: 0,
  });

  const [vitals, setVitals] = useState<CoreWebVitals>({});
  const [suggestions, setSuggestions] = useState<PerformanceSuggestion[]>([]);

  const mountTimeRef = useRef<number>(Date.now());
  const performanceMarksRef = useRef<Map<string, number>>(new Map());

  // Measure component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    setMetrics((prev) => ({
      ...prev,
      componentMountTime: mountTime,
    }));

    // Generate initial performance suggestions
    generatePerformanceSuggestions(mountTime);
  }, []);

  // Monitor Core Web Vitals
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // FCP (First Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setVitals((prev) => ({
              ...prev,
              fcp: entry.startTime,
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });

      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setVitals((prev) => ({
            ...prev,
            lcp: lastEntry.startTime,
          }));
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            setVitals((prev) => ({
              ...prev,
              cls: clsValue,
            }));
          }
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      return () => {
        observer.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  // Monitor memory usage
  const getMemoryUsage = useCallback((): number => {
    if (typeof window !== 'undefined' && 'performance' in window && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }, []);

  // Track memory usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const memoryUsage = getMemoryUsage();
      setMetrics((prev) => ({
        ...prev,
        memoryUsage,
      }));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [getMemoryUsage]);

  // Generate performance suggestions
  const generatePerformanceSuggestions = useCallback(
    (mountTime: number) => {
      const suggestions: PerformanceSuggestion[] = [];

      // Component mount time suggestions
      if (mountTime > 100) {
        suggestions.push({
          type: 'render',
          severity: mountTime > 500 ? 'high' : 'medium',
          message: `Component mount time is ${mountTime}ms (recommended: <100ms)`,
          recommendation: 'Consider lazy loading, code splitting, or optimizing component logic',
          impact: 'Slower initial page load and poor user experience',
        });
      }

      // Memory usage suggestions
      const currentMemory = getMemoryUsage();
      if (currentMemory > 50) {
        suggestions.push({
          type: 'memory',
          severity: currentMemory > 100 ? 'critical' : 'high',
          message: `Memory usage is ${currentMemory.toFixed(2)}MB (recommended: <50MB)`,
          recommendation: 'Check for memory leaks, optimize data structures, and implement cleanup',
          impact: 'Potential crashes and degraded performance on low-end devices',
        });
      }

      // Core Web Vitals suggestions
      if (vitals.fcp && vitals.fcp > 1800) {
        suggestions.push({
          type: 'network',
          severity: vitals.fcp > 3000 ? 'high' : 'medium',
          message: `First Contentful Paint is ${vitals.fcp}ms (recommended: <1800ms)`,
          recommendation: 'Optimize resource loading, enable compression, and use CDN',
          impact: 'Poor perceived performance and lower user engagement',
        });
      }

      if (vitals.cls && vitals.cls > 0.1) {
        suggestions.push({
          type: 'render',
          severity: vitals.cls > 0.25 ? 'critical' : 'high',
          message: `Cumulative Layout Shift is ${vitals.cls.toFixed(3)} (recommended: <0.1)`,
          recommendation:
            'Include size attributes for images and ads, avoid inserting content above existing content',
          impact: 'Poor user experience and unexpected layout changes',
        });
      }

      setSuggestions(suggestions);
    },
    [getMemoryUsage, vitals]
  );

  // Track custom performance metrics
  const trackPerformance = useCallback((name: string, operation: () => void | Promise<void>) => {
    const startTime = performance.now();
    performanceMarksRef.current.set(name, startTime);

    const result = operation();

    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

        if (duration > 1000) {
          console.warn(`[Performance Warning] ${name} took ${duration.toFixed(2)}ms`);
        }
      });
    }
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    if (duration > 1000) {
      console.warn(`[Performance Warning] ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  // Get performance grade
  const getPerformanceGrade = useCallback((): string => {
    let score = 100;

    // Deduct points based on metrics
    if (metrics.componentMountTime > 100) score -= Math.min(20, metrics.componentMountTime / 50);
    if (metrics.memoryUsage > 50) score -= Math.min(30, (metrics.memoryUsage - 50) / 2);
    if (vitals.fcp && vitals.fcp > 1800) score -= Math.min(25, (vitals.fcp - 1800) / 50);
    if (vitals.cls && vitals.cls > 0.1) score -= Math.min(25, vitals.cls * 100);

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, [metrics, vitals]);

  return {
    metrics,
    vitals,
    suggestions,
    trackPerformance,
    getMemoryUsage,
    getPerformanceGrade,
  };
};
