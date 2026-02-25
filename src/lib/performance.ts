/**
 * Performance monitoring utilities
 * Track and report Web Vitals
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
}

export interface WebVitals {
  // Largest Contentful Paint
  lcp?: PerformanceMetric;
  // First Input Delay
  fid?: PerformanceMetric;
  // Cumulative Layout Shift
  cls?: PerformanceMetric;
  // First Contentful Paint
  fcp?: PerformanceMetric;
  // Time to Interactive
  tti?: PerformanceMetric;
}

// Web Vitals thresholds (based on Core Web Vitals)
const VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // in ms
  FID: { good: 100, poor: 300 }, // in ms
  CLS: { good: 0.1, poor: 0.25 }, // unitless
  FCP: { good: 1800, poor: 3000 }, // in ms
  TTI: { good: 3800, poor: 7300 }, // in ms
} as const;

/**
 * Get rating for a metric value
 */
function getRating(
  name: keyof typeof VITAL_THRESHOLDS,
  value: number
): PerformanceMetric['rating'] {
  const thresholds = VITAL_THRESHOLDS[name];
  if (!thresholds) {
    return 'needs-improvement';
  }

  if (value <= thresholds.good) {
    return 'good';
  }
  if (value <= thresholds.poor) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Create a performance metric
 */
function createMetric(
  name: string,
  value: number,
  type: keyof typeof VITAL_THRESHOLDS
): PerformanceMetric {
  return {
    name,
    value,
    rating: getRating(type, value),
    timestamp: new Date(),
  };
}

/**
 * Measure LCP (Largest Contentful Paint)
 */
export function measureLCP(): Promise<PerformanceMetric | null> {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let lcpValue = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        lcpValue = lastEntry.startTime;
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // Resolve after page load
    setTimeout(() => {
      observer.disconnect();
      if (lcpValue > 0) {
        resolve(createMetric('LCP', lcpValue, 'LCP'));
      } else {
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Measure FCP (First Contentful Paint)
 */
export function measureFCP(): PerformanceMetric | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const entries = window.performance.getEntriesByType('paint');
  const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');

  if (fcpEntry) {
    return createMetric('FCP', fcpEntry.startTime, 'FCP');
  }

  return null;
}

/**
 * Measure CLS (Cumulative Layout Shift)
 */
export function measureCLS(): Promise<PerformanceMetric | null> {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return Promise.resolve(null);
  }

  let clsValue = 0;

  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!shift.hadRecentInput) {
          clsValue += shift.value ?? 0;
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    // Resolve after a short delay
    setTimeout(() => {
      observer.disconnect();
      resolve(createMetric('CLS', clsValue, 'CLS'));
    }, 100);
  });
}

/**
 * Collect all Web Vitals
 */
export async function collectWebVitals(): Promise<WebVitals> {
  const lcp = await measureLCP();
  const fcp = measureFCP();
  const cls = await measureCLS();

  return {
    lcp: lcp ?? undefined,
    fcp: fcp ?? undefined,
    cls: cls ?? undefined,
  };
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(vitals: WebVitals): void {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Cloudflare Web Analytics
    // window._cfBeacon?.('web-vitals', vitals);
    // Example: Send to Google Analytics
    // window.gtag?.('event', 'web_vitals', vitals);
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.group('📊 Web Vitals');
    Object.entries(vitals).forEach(([name, metric]) => {
      if (metric) {
        const emoji =
          metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(`${emoji} ${name}: ${metric.value.toFixed(2)} (${metric.rating})`);
      }
    });
    console.groupEnd();
  }
}

/**
 * Custom performance measurement
 */
export function measurePerformance<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
  if (typeof performance === 'undefined') {
    return fn();
  }

  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`⏱️ [Performance] ${name}: ${duration.toFixed(2)}ms`);
    });
  }

  const duration = performance.now() - start;
  console.log(`⏱️ [Performance] ${name}: ${duration.toFixed(2)}ms`);

  return result;
}
