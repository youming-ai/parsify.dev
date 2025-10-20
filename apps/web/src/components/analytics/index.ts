/**
 * Analytics Components Index
 * Exports all analytics-related components
 */

// Core analytics components
export { AnalyticsProvider, useAnalyticsContext, withAnalytics, useComponentAnalytics, useFeatureTracking } from './analytics-provider'
export { useAnalytics, usePageViewTracking, useToolUsageTracking, useInteractionTracking, usePerformanceTracking, useFormTracking, useSearchTracking, useEngagementTracking, useErrorTracking, useAnalyticsConsent } from './hooks'

// Consent management
export { AnalyticsConsentBanner, ConsentWidget, ConsentModal } from './consent-banner'
export { PrivacySettings } from './privacy-settings'

// Dashboard components
export { AnalyticsDashboard } from './dashboard'
export { ToolAnalytics } from './tool-analytics'

// Performance monitoring
export { PerformanceMonitor } from './performance-monitor'

// Re-export types for convenience
export type {
  AnalyticsEvent,
  AnalyticsConfig,
  AnalyticsSession,
  AnalyticsConsent,
  PageViewEvent,
  ToolUsageEvent,
  PerformanceEvent,
  UserInteractionEvent,
  APIUsageEvent,
  AnalyticsMetrics,
  AnalyticsBatch,
} from '../lib/analytics/types'
