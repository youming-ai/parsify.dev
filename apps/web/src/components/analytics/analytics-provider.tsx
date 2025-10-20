/**
 * Analytics Provider Component
 * Integrates Cloudflare Analytics with Next.js application
 */

'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createAnalyticsClient, getAnalyticsClient } from '@/lib/analytics/client'
import { useAnalytics, usePageViewTracking } from '@/lib/analytics/hooks'
import { DEFAULT_ANALYTICS_CONFIG } from '@/lib/analytics/config'

interface AnalyticsContextType {
  isInitialized: boolean
  trackPageView: (path?: string, title?: string) => void
  trackToolUsage: (params: {
    toolId: string
    toolName: string
    action: 'execute' | 'validate' | 'format' | 'convert' | 'error'
    processingTime?: number
    inputSize?: number
    outputSize?: number
    error?: string
    metrics?: Record<string, number>
  }) => void
  trackCustomEvent: (
    eventName: string,
    data: Record<string, any>,
    properties?: Record<string, string | number | boolean>
  ) => void
  updateConsent: (consent: {
    analytics: boolean
    performance: boolean
    interactions: boolean
  }) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}

interface AnalyticsProviderProps {
  children: React.ReactNode
  config?: Partial<typeof DEFAULT_ANALYTICS_CONFIG>
}

export function AnalyticsProvider({ children, config }: AnalyticsProviderProps) {
  const analytics = useAnalytics()
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  // Initialize analytics client with custom config
  useEffect(() => {
    if (config) {
      const client = getAnalyticsClient() || createAnalyticsClient(config)
      if (!getAnalyticsClient()) {
        client.initialize()
      }
    }
  }, [config])

  // Track page views when pathname changes
  useEffect(() => {
    if (analytics.isInitialized && previousPathname.current !== pathname) {
      analytics.trackPageView(pathname)
      previousPathname.current = pathname
    }
  }, [pathname, analytics.isInitialized, analytics.trackPageView])

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && analytics.isInitialized) {
        analytics.trackPageView(pathname)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pathname, analytics.isInitialized, analytics.trackPageView])

  // Track performance metrics
  useEffect(() => {
    if (!analytics.isInitialized) return

    // Track initial page load performance
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
      const firstByte = timing.responseStart - timing.navigationStart

      analytics.trackPerformance({
        load: loadTime,
        domContentLoaded: domContentLoaded,
        ttfb: firstByte,
      })
    }

    // Track navigation timing API
    if (window.performance && window.performance.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation')
      navigationEntries.forEach((entry) => {
        const navEntry = entry as PerformanceNavigationTiming
        analytics.trackPerformance({
          fcp: navEntry.responseStart - navEntry.requestStart,
          lcp: navEntry.loadEventStart - navEntry.navigationStart,
          ttfb: navEntry.responseStart - navEntry.requestStart,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
          load: navEntry.loadEventEnd - navEntry.navigationStart,
        })
      })
    }
  }, [analytics.isInitialized, analytics.trackPerformance])

  // Track errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (analytics.isInitialized) {
        analytics.trackCustomEvent('error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          url: window.location.href,
        })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (analytics.isInitialized) {
        analytics.trackCustomEvent('unhandled_promise_rejection', {
          reason: event.reason,
          url: window.location.href,
        })
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [analytics.isInitialized, analytics.trackCustomEvent])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (analytics.isInitialized) {
        analytics.trackCustomEvent('network_status', {
          status: 'online',
          timestamp: Date.now(),
        })
      }
    }

    const handleOffline = () => {
      if (analytics.isInitialized) {
        analytics.trackCustomEvent('network_status', {
          status: 'offline',
          timestamp: Date.now(),
        })
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [analytics.isInitialized, analytics.trackCustomEvent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analytics.isInitialized) {
        analytics.flush()
      }
    }
  }, [analytics.isInitialized, analytics.flush])

  const contextValue: AnalyticsContextType = {
    isInitialized: analytics.isInitialized,
    trackPageView: analytics.trackPageView,
    trackToolUsage: analytics.trackToolUsage,
    trackCustomEvent: analytics.trackCustomEvent,
    updateConsent: analytics.updateConsent,
  }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

/**
 * HOC to add analytics tracking to components
 */
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    trackPageView?: boolean
    trackMount?: boolean
    trackUnmount?: boolean
    customEventData?: Record<string, any>
  }
) {
  return function WithAnalyticsComponent(props: P) {
    const analytics = useAnalyticsContext()

    useEffect(() => {
      if (options?.trackMount) {
        analytics.trackCustomEvent('component_mount', {
          component: Component.name,
          ...options?.customEventData,
        })
      }

      return () => {
        if (options?.trackUnmount) {
          analytics.trackCustomEvent('component_unmount', {
            component: Component.name,
            ...options?.customEventData,
          })
        }
      }
    }, [])

    return <Component {...props} />
  }
}

/**
 * Hook to track component lifecycle
 */
export function useComponentAnalytics(componentName: string, data?: Record<string, any>) {
  const analytics = useAnalyticsContext()

  useEffect(() => {
    analytics.trackCustomEvent('component_mount', {
      component: componentName,
      ...data,
    })

    return () => {
      analytics.trackCustomEvent('component_unmount', {
        component: componentName,
        duration: Date.now(),
        ...data,
      })
    }
  }, [componentName, analytics.trackCustomEvent])
}

/**
 * Hook to track feature usage
 */
export function useFeatureTracking(featureName: string) {
  const analytics = useAnalyticsContext()
  const startTime = useRef<number>()

  const startFeature = useCallback(() => {
    startTime.current = Date.now()
    analytics.trackCustomEvent('feature_start', {
      feature: featureName,
      timestamp: startTime.current,
    })
  }, [featureName, analytics.trackCustomEvent])

  const endFeature = useCallback((
    success: boolean,
    result?: any,
    error?: string
  ) => {
    const duration = startTime.current ? Date.now() - startTime.current : undefined

    analytics.trackCustomEvent('feature_end', {
      feature: featureName,
      success,
      duration,
      result,
      error,
      timestamp: Date.now(),
    })
  }, [featureName, analytics.trackCustomEvent])

  const trackFeatureStep = useCallback((
    step: string,
    data?: Record<string, any>
  ) => {
    analytics.trackCustomEvent('feature_step', {
      feature: featureName,
      step,
      ...data,
    })
  }, [featureName, analytics.trackCustomEvent])

  return { startFeature, endFeature, trackFeatureStep }
}
