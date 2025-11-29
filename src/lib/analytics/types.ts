/**
 * Cloudflare Analytics type definitions
 * Provides comprehensive type safety for analytics data collection
 */

export interface AnalyticsEvent {
  /** Unique identifier for the event */
  id: string;
  /** Event name/type */
  name: string;
  /** Timestamp when the event occurred */
  timestamp: number;
  /** URL where the event occurred */
  url: string;
  /** User agent string */
  userAgent: string;
  /** User ID if authenticated */
  userId?: string;
  /** Session identifier */
  sessionId: string;
  /** Event-specific data */
  data: Record<string, any>;
  /** Custom event properties */
  properties?: Record<string, string | number | boolean>;
}

export interface PageViewEvent extends AnalyticsEvent {
  name: 'page_view';
  data: {
    /** Page title */
    title: string;
    /** Page path */
    path: string;
    /** Referrer if available */
    referrer?: string;
    /** Time spent on previous page */
    timeOnPage?: number;
  };
}

export interface ToolUsageEvent extends AnalyticsEvent {
  name: 'tool_usage';
  data: {
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
    /** Action performed */
    action: 'execute' | 'validate' | 'format' | 'convert' | 'error';
    /** Processing time in milliseconds */
    processingTime?: number;
    /** Input size in bytes */
    inputSize?: number;
    /** Output size in bytes */
    outputSize?: number;
    /** Error message if action failed */
    error?: string;
    /** Additional tool-specific metrics */
    metrics?: Record<string, number>;
  };
}

export interface PerformanceEvent extends AnalyticsEvent {
  name: 'performance';
  data: {
    /** Core Web Vitals */
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte

    /** Resource timing */
    domContentLoaded?: number;
    load?: number;

    /** Network information */
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

export interface UserInteractionEvent extends AnalyticsEvent {
  name: 'user_interaction';
  data: {
    /** Type of interaction */
    interactionType: 'click' | 'scroll' | 'focus' | 'blur' | 'submit' | 'navigation';
    /** Element identifier */
    elementId?: string;
    /** Element tag name */
    elementTag?: string;
    /** Element text content (truncated) */
    elementText?: string;
    /** Target URL if navigation */
    targetUrl?: string;
    /** Scroll depth if scroll event */
    scrollDepth?: number;
  };
}

export interface APIUsageEvent extends AnalyticsEvent {
  name: 'api_usage';
  data: {
    /** API endpoint */
    endpoint: string;
    /** HTTP method */
    method: string;
    /** Response status code */
    statusCode: number;
    /** Response time in milliseconds */
    responseTime: number;
    /** Request size in bytes */
    requestSize?: number;
    /** Response size in bytes */
    responseSize?: number;
    /** Error message if failed */
    error?: string;
  };
}

export type AnalyticsEventData =
  | PageViewEvent
  | ToolUsageEvent
  | PerformanceEvent
  | UserInteractionEvent
  | APIUsageEvent;

export interface AnalyticsConfig {
  /** Cloudflare Analytics tracking ID */
  trackingId: string;
  /** Enable analytics collection */
  enabled: boolean;
  /** Enable debug logging */
  debug: boolean;
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Enable user interaction tracking */
  enableInteractionTracking: boolean;
  /** Sample rate for events (0-1) */
  sampleRate: number;
  /** Batch configuration */
  batching: {
    /** Enable batch sending */
    enabled: boolean;
    /** Maximum batch size */
    maxSize: number;
    /** Maximum wait time in milliseconds */
    maxWaitTime: number;
  };
  /** Privacy configuration */
  privacy: {
    /** Respect Do Not Track header */
    respectDNT: boolean;
    /** Anonymize IP addresses */
    anonymizeIP: boolean;
    /** Require user consent */
    requireConsent: boolean;
    /** Cookie consent level */
    cookieConsent: 'none' | 'necessary' | 'functional' | 'analytics' | 'all';
    /** Data retention period in days */
    dataRetentionDays: number;
  };
  /** Custom event configuration */
  customEvents: {
    /** Enable custom event tracking */
    enabled: boolean;
    /** Whitelist of allowed custom events */
    allowedEvents: string[];
    /** Maximum number of custom properties */
    maxProperties: number;
  };
}

export interface AnalyticsConsent {
  /** User has given consent for analytics */
  analytics: boolean;
  /** User has given consent for performance monitoring */
  performance: boolean;
  /** User has given consent for interaction tracking */
  interactions: boolean;
  /** Consent timestamp */
  timestamp: number;
  /** Consent version */
  version: string;
}

export interface AnalyticsSession {
  /** Session identifier */
  id: string;
  /** User ID if authenticated */
  userId?: string;
  /** Session start timestamp */
  startTime: number;
  /** Session last activity timestamp */
  lastActivity: number;
  /** Page views in this session */
  pageViews: number;
  /** Tool usage count in this session */
  toolUsage: number;
  /** Session duration in milliseconds */
  duration: number;
  /** User agent */
  userAgent: string;
  /** Initial referrer */
  referrer?: string;
  /** Landing page */
  landingPage: string;
  /** Exit page */
  exitPage?: string;
}

export interface AnalyticsMetrics {
  /** Total page views */
  totalPageViews: number;
  /** Unique sessions */
  uniqueSessions: number;
  /** Active users */
  activeUsers: number;
  /** Tool usage count */
  toolUsage: Record<string, number>;
  /** Performance metrics */
  performance: {
    averageLCP: number;
    averageFID: number;
    averageCLS: number;
    averageFCP: number;
  };
  /** API usage metrics */
  apiUsage: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    endpointBreakdown: Record<string, number>;
  };
  /** User engagement metrics */
  engagement: {
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
}

export interface AnalyticsBatch {
  /** Batch identifier */
  id: string;
  /** Events in this batch */
  events: AnalyticsEvent[];
  /** Batch creation timestamp */
  timestamp: number;
  /** Delivery status */
  status: 'pending' | 'sending' | 'sent' | 'failed';
  /** Number of retry attempts */
  retryCount: number;
  /** Error message if failed */
  error?: string;
}
