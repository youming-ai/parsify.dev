/**
 * Performance Monitoring Hook
 *
 * Tracks Web Vitals and reports to analytics
 */

'use client';

import { type WebVitals, collectWebVitals, reportWebVitals } from '@/lib/performance';
import { useEffect, useState } from 'react';

export function usePerformanceMonitoring() {
  const [vitals, setVitals] = useState<WebVitals>({});
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsTracking(true);

    // Collect Web Vitals after page load
    const collectVitals = async () => {
      const webVitals = await collectWebVitals();
      setVitals(webVitals);
      reportWebVitals(webVitals);
    };

    // Collect on load
    window.addEventListener('load', collectVitals);

    return () => {
      window.removeEventListener('load', collectVitals);
      setIsTracking(false);
    };
  }, []);

  return {
    vitals,
    isTracking,
    hasVitals: Object.keys(vitals).length > 0,
  };
}
