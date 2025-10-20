/**
 * Cloudflare Analytics configuration
 * Centralized configuration for analytics settings
 */

import type { AnalyticsConfig } from './types'

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  trackingId: process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_ID || '',
  enabled: process.env.NODE_ENV !== 'development',
  debug: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  enableInteractionTracking: true,
  sampleRate: 1.0,
  batching: {
    enabled: true,
    maxSize: 50,
    maxWaitTime: 5000, // 5 seconds
  },
  privacy: {
    respectDNT: true,
    anonymizeIP: true,
    requireConsent: true,
    cookieConsent: 'analytics',
    dataRetentionDays: 365,
  },
  customEvents: {
    enabled: true,
    allowedEvents: [
      'tool_usage',
      'performance',
      'user_interaction',
      'api_usage',
      'feature_usage',
      'error',
    ],
    maxProperties: 20,
  },
}

export const ANALYTICS_EVENTS = {
  // Standard events
  PAGE_VIEW: 'page_view',
  TOOL_USAGE: 'tool_usage',
  PERFORMANCE: 'performance',
  USER_INTERACTION: 'user_interaction',
  API_USAGE: 'api_usage',

  // Custom events
  FEATURE_USAGE: 'feature_usage',
  ERROR: 'error',
  CONSENT_UPDATE: 'consent_update',

  // Tool-specific events
  JSON_VALIDATE: 'json_validate',
  JSON_FORMAT: 'json_format',
  JSON_CONVERT: 'json_convert',
  CODE_EXECUTE: 'code_execute',
  CODE_FORMAT: 'code_format',
} as const

export const PERFORMANCE_METRICS = {
  LCP: 'largest_contentful_paint',
  FID: 'first_input_delay',
  CLS: 'cumulative_layout_shift',
  FCP: 'first_contentful_paint',
  TTFB: 'time_to_first_byte',
  DOM_CONTENT_LOADED: 'dom_content_loaded',
  LOAD: 'load',
} as const

export const INTERACTION_TYPES = {
  CLICK: 'click',
  SCROLL: 'scroll',
  FOCUS: 'focus',
  BLUR: 'blur',
  SUBMIT: 'submit',
  NAVIGATION: 'navigation',
} as const

export const TOOL_ACTIONS = {
  EXECUTE: 'execute',
  VALIDATE: 'validate',
  FORMAT: 'format',
  CONVERT: 'convert',
  ERROR: 'error',
} as const

export const CONSENT_LEVELS = {
  NONE: 'none',
  NECESSARY: 'necessary',
  FUNCTIONAL: 'functional',
  ANALYTICS: 'analytics',
  ALL: 'all',
} as const

// Cloudflare Analytics specific configuration
export const CLOUDFLARE_ANALYTICS_CONFIG = {
  // Cloudflare Web Analytics endpoint
  endpoint: 'https://cloudflareinsights.com/cdn-cgi/rum',

  // Custom data endpoint
  customDataEndpoint: '/api/v1/analytics/events',

  // Real-time analytics endpoint
  realtimeEndpoint: '/api/v1/analytics/realtime',

  // Dashboard data endpoint
  dashboardEndpoint: '/api/v1/analytics/dashboard',

  // Cookie configuration
  cookies: {
    session: 'cf_session_id',
    consent: 'cf_analytics_consent',
    userId: 'cf_user_id',
  },

  // Local storage keys
  storage: {
    consent: 'cf_analytics_consent',
    sessionId: 'cf_session_id',
    userId: 'cf_user_id',
    config: 'cf_analytics_config',
  },

  // Request headers
  headers: {
    traceId: 'CF-Trace-ID',
    requestId: 'CF-Request-ID',
    rayId: 'CF-Ray',
  },
} as const

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP_GOOD: 2500,
  LCP_NEEDS_IMPROVEMENT: 4000,
  FID_GOOD: 100,
  FID_NEEDS_IMPROVEMENT: 300,
  CLS_GOOD: 0.1,
  CLS_NEEDS_IMPROVEMENT: 0.25,
  FCP_GOOD: 1800,
  FCP_NEEDS_IMPROVEMENT: 3000,
  TTFB_GOOD: 800,
  TTFB_NEEDS_IMPROVEMENT: 1800,
} as const

// Analytics event priorities
export const EVENT_PRIORITIES = {
  CRITICAL: 1,    // Page views, errors
  HIGH: 2,        // Tool usage, performance
  MEDIUM: 3,      // User interactions
  LOW: 4,         // Optional analytics
} as const

// Rate limiting configuration
export const RATE_LIMITS = {
  eventsPerMinute: 100,
  eventsPerHour: 1000,
  eventsPerDay: 10000,
  batchRetries: 3,
  retryDelay: 1000, // 1 second
} as const

// Feature flags for analytics
export const ANALYTICS_FEATURES = {
  ENABLE_REAL_TIME: true,
  ENABLE_HEATMAPS: false,
  ENABLE_SESSION_REPLAY: false,
  ENABLE_FUNNEL_ANALYSIS: true,
  ENABLE_COHORT_ANALYSIS: true,
  ENABLE_CUSTOM_DASHBOARDS: true,
  ENABLE_EXPORT: true,
  ENABLE_ALERTS: true,
} as const
