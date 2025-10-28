/**
 * React hooks for Analytics (Cloudflare + Microsoft Clarity)
 * Provides easy-to-use hooks for React components
 */

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AnalyticsConfig,
  type AnalyticsConsent,
  type AnalyticsSession,
  type CloudflareAnalyticsClient,
  createAnalyticsClient,
} from './client'
import { getMicrosoftClarityService, type MicrosoftClarityService } from './clarity'

/**
 * Hook to initialize and access the analytics client
 */
export function useAnalytics(config?: Partial<AnalyticsConfig>) {
  const [client, setClient] = useState<CloudflareAnalyticsClient | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const analyticsClient = createAnalyticsClient(config)

    analyticsClient.initialize().then(() => {
      setClient(analyticsClient)
      setIsInitialized(true)
    })

    return () => {
      // Cleanup on unmount
      analyticsClient.flush()
    }
  }, [config])

  // Track page views on route changes
  useEffect(() => {
    if (!client || !isInitialized) return

    const handleRouteChange = () => {
      client.trackPageView()
    }

    // Subscribe to Next.js route changes
    router.events?.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange)
    }
  }, [client, isInitialized, router])

  return {
    client,
    isInitialized,
    trackPageView: useCallback(() => client?.trackPageView(), [client]),
    trackToolUsage: useCallback(
      (params: Parameters<CloudflareAnalyticsClient['trackToolUsage']>[0]) =>
        client?.trackToolUsage(params),
      [client]
    ),
    trackPerformance: useCallback(
      (params: Parameters<CloudflareAnalyticsClient['trackPerformance']>[0]) =>
        client?.trackPerformance(params),
      [client]
    ),
    trackInteraction: useCallback(
      (params: Parameters<CloudflareAnalyticsClient['trackInteraction']>[0]) =>
        client?.trackInteraction(params),
      [client]
    ),
    trackAPIUsage: useCallback(
      (params: Parameters<CloudflareAnalyticsClient['trackAPIUsage']>[0]) =>
        client?.trackAPIUsage(params),
      [client]
    ),
    trackCustomEvent: useCallback(
      (
        eventName: string,
        data: Record<string, any>,
        properties?: Record<string, string | number | boolean>
      ) => client?.trackCustomEvent(eventName, data, properties),
      [client]
    ),
    updateConsent: useCallback(
      (consent: Partial<AnalyticsConsent>) => client?.updateConsent(consent),
      [client]
    ),
    getSession: useCallback(() => client?.getSession(), [client]),
    getConsent: useCallback(() => client?.getConsent(), [client]),
    flush: useCallback(() => client?.flush(), [client]),
    reset: useCallback(() => client?.reset(), [client]),
  }
}

/**
 * Hook to track page views automatically
 */
export function usePageViewTracking(enabled: boolean = true) {
  const { trackPageView } = useAnalytics()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!enabled || hasTracked.current) return

    trackPageView()
    hasTracked.current = true
  }, [enabled, trackPageView])
}

/**
 * Hook to track tool usage
 */
export function useToolTracking(toolId: string, toolName: string) {
  const { trackToolUsage } = useAnalytics()

  const trackExecute = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: 'execute',
        processingTime,
        inputSize,
        outputSize,
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackValidate = useCallback(
    (processingTime?: number, inputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: 'validate',
        processingTime,
        inputSize,
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackFormat = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: 'format',
        processingTime,
        inputSize,
        outputSize,
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackConvert = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: 'convert',
        processingTime,
        inputSize,
        outputSize,
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackError = useCallback(
    (error: string, processingTime?: number) => {
      trackToolUsage({
        toolId,
        toolName,
        action: 'error',
        error,
        processingTime,
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  return {
    trackExecute,
    trackValidate,
    trackFormat,
    trackConvert,
    trackError,
  }
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking() {
  const { trackPerformance } = useAnalytics()

  useEffect(() => {
    if (!window.performance || !window.PerformanceObserver) return

    // Track initial page load performance
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      if (navigation) {
        trackPerformance({
          fcp: navigation.responseStart - navigation.requestStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          load: navigation.loadEventEnd - navigation.navigationStart,
        })
      }
    }

    if (document.readyState === 'complete') {
      trackPageLoad()
    } else {
      window.addEventListener('load', trackPageLoad)
      return () => window.removeEventListener('load', trackPageLoad)
    }
  }, [trackPerformance])

  const trackCustomPerformance = useCallback(
    (metrics: Parameters<CloudflareAnalyticsClient['trackPerformance']>[0]) => {
      trackPerformance(metrics)
    },
    [trackPerformance]
  )

  return {
    trackCustomPerformance,
  }
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const { trackInteraction } = useAnalytics()

  const trackClick = useCallback(
    (elementId?: string, elementTag?: string, elementText?: string) => {
      trackInteraction({
        interactionType: 'click',
        elementId,
        elementTag,
        elementText,
      })
    },
    [trackInteraction]
  )

  const trackScroll = useCallback(
    (scrollDepth: number) => {
      trackInteraction({
        interactionType: 'scroll',
        scrollDepth,
      })
    },
    [trackInteraction]
  )

  const trackFocus = useCallback(
    (elementId?: string, elementTag?: string) => {
      trackInteraction({
        interactionType: 'focus',
        elementId,
        elementTag,
      })
    },
    [trackInteraction]
  )

  const trackNavigation = useCallback(
    (targetUrl: string) => {
      trackInteraction({
        interactionType: 'navigation',
        targetUrl,
      })
    },
    [trackInteraction]
  )

  return {
    trackClick,
    trackScroll,
    trackFocus,
    trackNavigation,
  }
}

/**
 * Hook to track API usage
 */
export function useAPITracking() {
  const { trackAPIUsage } = useAnalytics()

  const trackAPICall = useCallback(
    (params: {
      endpoint: string
      method: string
      statusCode: number
      responseTime: number
      requestSize?: number
      responseSize?: number
      error?: string
    }) => {
      trackAPIUsage(params)
    },
    [trackAPIUsage]
  )

  return {
    trackAPICall,
  }
}

/**
 * Hook to manage analytics consent
 */
export function useAnalyticsConsent() {
  const { client, updateConsent, getConsent } = useAnalytics()
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null)

  useEffect(() => {
    const currentConsent = getConsent()
    setConsent(currentConsent)
  }, [getConsent])

  const grantConsent = useCallback(
    (level: 'minimal' | 'full' | 'custom' = 'full') => {
      const newConsent: Partial<AnalyticsConsent> = {
        analytics: true,
        performance: level !== 'minimal',
        interactions: level === 'full',
        timestamp: Date.now(),
      }

      updateConsent(newConsent)
      setConsent({ ...consent, ...newConsent } as AnalyticsConsent)
    },
    [consent, updateConsent]
  )

  const revokeConsent = useCallback(() => {
    const newConsent: Partial<AnalyticsConsent> = {
      analytics: false,
      performance: false,
      interactions: false,
      timestamp: Date.now(),
    }

    updateConsent(newConsent)
    setConsent({ ...consent, ...newConsent } as AnalyticsConsent)
  }, [consent, updateConsent])

  const updateCustomConsent = useCallback(
    (customConsent: Partial<AnalyticsConsent>) => {
      updateConsent({
        ...customConsent,
        timestamp: Date.now(),
      })
      setConsent({ ...consent, ...customConsent } as AnalyticsConsent)
    },
    [consent, updateConsent]
  )

  return {
    consent,
    hasConsent: consent?.analytics || false,
    grantConsent,
    revokeConsent,
    updateCustomConsent,
  }
}

/**
 * Hook to access analytics session information
 */
export function useAnalyticsSession() {
  const { getSession } = useAnalytics()
  const [session, setSession] = useState<AnalyticsSession | null>(null)

  useEffect(() => {
    const currentSession = getSession()
    setSession(currentSession)
  }, [getSession])

  return {
    session,
    sessionId: session?.id,
    userId: session?.userId,
    sessionDuration: session ? Date.now() - session.startTime : 0,
    pageViews: session?.pageViews || 0,
    toolUsage: session?.toolUsage || 0,
  }
}

/**
 * Hook to create event tracking props for components
 */
export function useEventTracking() {
  const { trackCustomEvent } = useAnalytics()

  const createEventProps = useCallback(
    (eventName: string) => {
      return {
        'data-track-event': eventName,
        onClick: (event: React.MouseEvent) => {
          const target = event.currentTarget
          trackCustomEvent(eventName, {
            elementId: target.id,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100),
          })
        },
      }
    },
    [trackCustomEvent]
  )

  return {
    createEventProps,
  }
}

/**
 * Higher-order component for automatic page view tracking
 */
export function withPageViewTracking<P extends object>(
  Component: React.ComponentType<P>,
  trackProps?: {
    path?: string
    title?: string
  }
) {
  return function TrackedComponent(props: P) {
    const { trackPageView } = useAnalytics()

    useEffect(() => {
      trackPageView(trackProps?.path, trackProps?.title)
    }, [trackPageView, trackProps?.path, trackProps?.title])

    return <Component {...props} />
  }
}

// Microsoft Clarity specific hooks

/**
 * Hook to access Microsoft Clarity service
 */
export function useMicrosoftClarity() {
  const [clarityService, setClarityService] = useState<MicrosoftClarityService | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const service = getMicrosoftClarityService()
    setClarityService(service)

    // Check if service is ready
    const checkReady = () => {
      setIsReady(service.isReady())
    }

    // Initial check
    checkReady()

    // Set up interval to check if service becomes ready
    const interval = setInterval(checkReady, 100)

    // Clean up interval after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  const trackEvent = useCallback(
    (eventName: string, data?: Record<string, any>) => {
      if (clarityService?.isReady()) {
        clarityService.trackEvent(eventName, data)
      }
    },
    [clarityService]
  )

  const identifyUser = useCallback(
    (userId: string, sessionId?: string, userAttributes?: Record<string, any>) => {
      if (clarityService?.isReady()) {
        clarityService.identifyUser(userId, sessionId, userAttributes)
      }
    },
    [clarityService]
  )

  const setUserAttributes = useCallback(
    (attributes: Record<string, any>) => {
      if (clarityService?.isReady()) {
        clarityService.setUserAttributes(attributes)
      }
    },
    [clarityService]
  )

  const trackPageView = useCallback(
    (path?: string) => {
      if (clarityService?.isReady()) {
        clarityService.trackPageView(path)
      }
    },
    [clarityService]
  )

  const trackToolUsage = useCallback(
    (toolId: string, toolName: string, action: string, metadata?: Record<string, any>) => {
      if (clarityService?.isReady()) {
        clarityService.trackToolUsage(toolId, toolName, action, metadata)
      }
    },
    [clarityService]
  )

  const trackInteraction = useCallback(
    (interactionType: string, elementId?: string, metadata?: Record<string, any>) => {
      if (clarityService?.isReady()) {
        clarityService.trackInteraction(interactionType, elementId, metadata)
      }
    },
    [clarityService]
  )

  const trackError = useCallback(
    (error: Error | string, context?: Record<string, any>) => {
      if (clarityService?.isReady()) {
        clarityService.trackError(error, context)
      }
    },
    [clarityService]
  )

  const updateConsent = useCallback(
    (consented: boolean) => {
      if (clarityService?.isReady()) {
        clarityService.updateConsent(consented)
      }
    },
    [clarityService]
  )

  return {
    clarityService,
    isReady,
    trackEvent,
    identifyUser,
    setUserAttributes,
    trackPageView,
    trackToolUsage,
    trackInteraction,
    trackError,
    updateConsent,
  }
}

/**
 * Hook to track tool usage with Microsoft Clarity
 */
export function useClarityToolTracking(toolId: string, toolName: string) {
  const { trackToolUsage } = useMicrosoftClarity()

  const trackExecute = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage(toolId, toolName, 'execute', {
        processingTime,
        inputSize,
        outputSize,
        timestamp: Date.now(),
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackValidate = useCallback(
    (processingTime?: number, inputSize?: number, isValid?: boolean) => {
      trackToolUsage(toolId, toolName, 'validate', {
        processingTime,
        inputSize,
        isValid,
        timestamp: Date.now(),
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackFormat = useCallback(
    (processingTime?: number, inputSize?: number, outputSize?: number) => {
      trackToolUsage(toolId, toolName, 'format', {
        processingTime,
        inputSize,
        outputSize,
        timestamp: Date.now(),
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackConvert = useCallback(
    (fromFormat: string, toFormat: string, processingTime?: number) => {
      trackToolUsage(toolId, toolName, 'convert', {
        fromFormat,
        toFormat,
        processingTime,
        timestamp: Date.now(),
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  const trackError = useCallback(
    (error: string, processingTime?: number) => {
      trackToolUsage(toolId, toolName, 'error', {
        error,
        processingTime,
        timestamp: Date.now(),
      })
    },
    [toolId, toolName, trackToolUsage]
  )

  return {
    trackExecute,
    trackValidate,
    trackFormat,
    trackConvert,
    trackError,
  }
}

/**
 * Hook to track user interactions with Microsoft Clarity
 */
export function useClarityInteractionTracking() {
  const { trackInteraction } = useMicrosoftClarity()

  const trackClick = useCallback(
    (elementId?: string, elementText?: string, metadata?: Record<string, any>) => {
      trackInteraction('click', elementId, {
        elementText,
        ...metadata,
      })
    },
    [trackInteraction]
  )

  const trackScroll = useCallback(
    (scrollDepth: number, maxScroll?: number) => {
      trackInteraction('scroll', undefined, {
        scrollDepth,
        maxScroll,
        percentage: maxScroll ? (scrollDepth / maxScroll) * 100 : scrollDepth,
      })
    },
    [trackInteraction]
  )

  const trackFormSubmit = useCallback(
    (formId?: string, formData?: Record<string, any>) => {
      trackInteraction('form_submit', formId, {
        fieldCount: Object.keys(formData || {}).length,
        ...formData,
      })
    },
    [trackInteraction]
  )

  const trackDownload = useCallback(
    (fileName: string, fileType: string, fileSize?: number) => {
      trackInteraction('download', undefined, {
        fileName,
        fileType,
        fileSize,
      })
    },
    [trackInteraction]
  )

  const trackShare = useCallback(
    (platform: string, contentUrl?: string, contentType?: string) => {
      trackInteraction('share', undefined, {
        platform,
        contentUrl,
        contentType,
      })
    },
    [trackInteraction]
  )

  return {
    trackClick,
    trackScroll,
    trackFormSubmit,
    trackDownload,
    trackShare,
  }
}

/**
 * Hook to track errors with Microsoft Clarity
 */
export function useClarityErrorTracking() {
  const { trackError } = useMicrosoftClarity()

  const trackJavaScriptError = useCallback(
    (error: Error, errorInfo?: React.ErrorInfo) => {
      trackError(error, {
        type: 'javascript',
        componentStack: errorInfo?.componentStack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    },
    [trackError]
  )

  const trackNetworkError = useCallback(
    (url: string, method: string, status: number, message?: string) => {
      trackError(`Network Error: ${method} ${url} - ${status}`, {
        type: 'network',
        url,
        method,
        status,
        message,
        timestamp: Date.now(),
      })
    },
    [trackError]
  )

  const trackValidationError = useCallback(
    (fieldName: string, value: any, constraint: string) => {
      trackError(`Validation Error: ${fieldName}`, {
        type: 'validation',
        fieldName,
        value,
        constraint,
        timestamp: Date.now(),
      })
    },
    [trackError]
  )

  return {
    trackJavaScriptError,
    trackNetworkError,
    trackValidationError,
  }
}

/**
 * Hook to manage Microsoft Clarity user identification
 */
export function useClarityUserTracking() {
  const { identifyUser, setUserAttributes } = useMicrosoftClarity()

  const identify = useCallback(
    (userId: string, userAttributes?: Record<string, any>) => {
      identifyUser(userId, undefined, userAttributes)
    },
    [identifyUser]
  )

  const updateAttributes = useCallback(
    (attributes: Record<string, any>) => {
      setUserAttributes(attributes)
    },
    [setUserAttributes]
  )

  const trackUserPreferences = useCallback(
    (preferences: Record<string, any>) => {
      setUserAttributes({
        userPreferences: preferences,
        lastUpdated: Date.now(),
      })
    },
    [setUserAttributes]
  )

  const trackUserSubscription = useCallback(
    (subscriptionLevel: string, features: string[]) => {
      setUserAttributes({
        subscriptionLevel,
        features,
        subscriptionUpdated: Date.now(),
      })
    },
    [setUserAttributes]
  )

  return {
    identify,
    updateAttributes,
    trackUserPreferences,
    trackUserSubscription,
  }
}

/**
 * Hook to combine both Cloudflare Analytics and Microsoft Clarity tracking
 */
export function useDualAnalytics() {
  const cloudflareAnalytics = useAnalytics()
  const clarityAnalytics = useMicrosoftClarity()

  const trackPageView = useCallback(
    (path?: string, title?: string) => {
      cloudflareAnalytics.trackPageView()
      clarityAnalytics.trackPageView(path)
    },
    [cloudflareAnalytics, clarityAnalytics]
  )

  const trackToolUsage = useCallback(
    (params: {
      toolId: string
      toolName: string
      action: string
      processingTime?: number
      inputSize?: number
      outputSize?: number
      error?: string
    }) => {
      // Track in Cloudflare Analytics
      cloudflareAnalytics.trackToolUsage(params)

      // Track in Microsoft Clarity
      clarityAnalytics.trackToolUsage(
        params.toolId,
        params.toolName,
        params.action,
        {
          processingTime: params.processingTime,
          inputSize: params.inputSize,
          outputSize: params.outputSize,
          error: params.error,
        }
      )
    },
    [cloudflareAnalytics, clarityAnalytics]
  )

  const trackError = useCallback(
    (error: Error | string, context?: Record<string, any>) => {
      cloudflareAnalytics.trackCustomEvent('error', {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        ...context,
      })

      clarityAnalytics.trackError(error, context)
    },
    [cloudflareAnalytics, clarityAnalytics]
  )

  const trackUserInteraction = useCallback(
    (interactionType: string, elementId?: string, metadata?: Record<string, any>) => {
      cloudflareAnalytics.trackInteraction({
        interactionType,
        elementId,
        ...metadata,
      })

      clarityAnalytics.trackInteraction(interactionType, elementId, metadata)
    },
    [cloudflareAnalytics, clarityAnalytics]
  )

  return {
    trackPageView,
    trackToolUsage,
    trackError,
    trackUserInteraction,
    cloudflare: cloudflareAnalytics,
    clarity: clarityAnalytics,
  }
}
