/**
 * Monitoring System Integration for Feedback Collection
 * Integrates feedback data with existing monitoring and analytics systems
 */

import { FeedbackSubmission, FeedbackAnalytics, FeedbackConfig } from '@/types/feedback';
import { feedbackAnalyticsEngine } from '../analytics/feedback-analytics';

export interface MonitoringConfig {
  enabled: boolean;
  analyticsProvider: 'google_analytics' | 'custom' | 'none';
  errorTracking: boolean;
  performanceMonitoring: boolean;
  userBehaviorTracking: boolean;
  realTimeAlerts: boolean;
  dataRetention: number; // days
  batchProcessing: boolean;
  batchSize: number;
  flushInterval: number; // minutes
  endpoints: {
    analytics?: string;
    events?: string;
    errors?: string;
    performance?: string;
  };
  headers?: Record<string, string>;
  retryConfig: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export interface MonitoringEvent {
  type: 'feedback_submitted' | 'feedback_viewed' | 'feedback_dismissed' | 'error_occurred' | 'performance_issue';
  timestamp: Date;
  data: any;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

export interface PerformanceData {
  timestamp: Date;
  metrics: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
  };
  userAgent: string;
  url: string;
  sessionId: string;
}

export class FeedbackMonitoringSystem {
  private config: MonitoringConfig;
  private eventQueue: MonitoringEvent[] = [];
  private metricQueue: MonitoringMetric[] = [];
  private performanceData: PerformanceData[] = [];
  private isProcessing: boolean = false;
  private lastFlushTime: number = 0;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      analyticsProvider: 'custom',
      errorTracking: true,
      performanceMonitoring: true,
      userBehaviorTracking: true,
      realTimeAlerts: false,
      dataRetention: 30,
      batchProcessing: true,
      batchSize: 50,
      flushInterval: 5,
      endpoints: {},
      headers: {
        'Content-Type': 'application/json',
      },
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
      },
      ...config,
    };

    if (this.config.enabled) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring(): void {
    // Set up periodic flush
    if (this.config.batchProcessing) {
      setInterval(() => {
        this.flushQueues();
      }, this.config.flushInterval * 60 * 1000);
    }

    // Set up performance monitoring
    if (this.config.performanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    // Set up error tracking
    if (this.config.errorTracking) {
      this.initializeErrorTracking();
    }

    // Set up user behavior tracking
    if (this.config.userBehaviorTracking) {
      this.initializeUserBehaviorTracking();
    }
  }

  private initializePerformanceMonitoring(): void {
    if (!('performance' in window)) return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectPerformanceData();
      }, 1000);
    });

    // Monitor navigation performance
    if ('navigation' in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.collectNavigationPerformance(entry as PerformanceNavigationTiming);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    }

    // Monitor largest contentful paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackMetric('largest_contentful_paint', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Monitor first input delay
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            this.trackMetric('first_input_delay', (entry as any).processingStart - entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  private initializeErrorTracking(): void {
    // Monitor JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent('error_occurred', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error_occurred', {
        type: 'unhandled_rejection',
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  private initializeUserBehaviorTracking(): void {
    // Track page views
    let pageViewTracked = false;
    const trackPageView = () => {
      if (!pageViewTracked) {
        this.trackEvent('page_view', {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
        });
        pageViewTracked = true;
      }
    };

    trackPageView();

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('click', {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 50),
        x: event.clientX,
        y: event.clientY,
      });
    });

    // Track scroll events (throttled)
    let scrollTimeout: NodeJS.Timeout;
    let maxScrollDepth = 0;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollDepth = this.calculateScrollDepth();
        maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);

        this.trackEvent('scroll', {
          depth: scrollDepth,
          maxDepth: maxScrollDepth,
          url: window.location.href,
        });
      }, 1000);
    });
  }

  private collectPerformanceData(): void {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = {
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      firstInputDelay: this.getFirstInputDelay(),
      timeToInteractive: this.calculateTimeToInteractive(navigation),
    };

    const performanceData: PerformanceData = {
      timestamp: new Date(),
      metrics,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
    };

    this.performanceData.push(performanceData);
    this.trackEvent('performance_collected', metrics);
  }

  private collectNavigationPerformance(navigation: PerformanceNavigationTiming): void {
    const metrics = {
      domainLookupTime: navigation.domainLookupEnd - navigation.domainLookupStart,
      connectTime: navigation.connectEnd - navigation.connectStart,
      requestTime: navigation.responseStart - navigation.requestStart,
      responseTime: navigation.responseEnd - navigation.responseStart,
      domProcessingTime: navigation.domContentLoadedEventStart - navigation.responseEnd,
      loadEventTime: navigation.loadEventEnd - navigation.loadEventStart,
    };

    this.trackEvent('navigation_performance', metrics);
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    // This would need to be tracked during page load
    return 0;
  }

  private getCumulativeLayoutShift(): number {
    // This would need to be tracked during page load
    return 0;
  }

  private getFirstInputDelay(): number {
    // This would need to be tracked during user interaction
    return 0;
  }

  private calculateTimeToInteractive(navigation: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    return navigation.domContentLoadedEventEnd - navigation.fetchStart;
  }

  private calculateScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
  }

  private getSessionId(): string {
    // Get session ID from feedback store or generate one
    try {
      const feedbackStore = require('@/lib/feedback/feedback-store').useFeedbackStore.getState();
      return feedbackStore.sessionId || this.generateSessionId();
    } catch {
      return this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for tracking
  public trackFeedbackSubmission(feedback: FeedbackSubmission): void {
    this.trackEvent('feedback_submitted', {
      type: feedback.type,
      source: feedback.source,
      rating: feedback.content?.rating?.score,
      sentiment: feedback.sentiment?.label,
      tool: feedback.context?.tool?.id,
      category: feedback.context?.category,
      priority: feedback.priority,
    });

    // Track feedback-specific metrics
    this.trackMetric('feedback_submissions_total', 1, {
      type: feedback.type,
      source: feedback.source,
    });

    if (feedback.content?.rating?.score) {
      this.trackMetric('feedback_rating', feedback.content.rating.score, {
        type: feedback.type,
      });
    }

    if (feedback.sentiment?.score) {
      this.trackMetric('feedback_sentiment', feedback.sentiment.score, {
        type: feedback.type,
        sentiment: feedback.sentiment.label,
      });
    }
  }

  public trackFeedbackView(templateId: string, source: string): void {
    this.trackEvent('feedback_viewed', {
      templateId,
      source,
    });
  }

  public trackFeedbackDismissal(templateId: string, reason?: string): void {
    this.trackEvent('feedback_dismissed', {
      templateId,
      reason,
    });
  }

  public trackPerformanceIssue(issue: string, severity: string, details?: any): void {
    this.trackEvent('performance_issue', {
      issue,
      severity,
      details,
    });
  }

  public trackUserInteraction(action: string, details?: any): void {
    this.trackEvent('user_interaction', {
      action,
      details,
    });
  }

  public trackEvent(type: string, data: any): void {
    if (!this.config.enabled) return;

    const event: MonitoringEvent = {
      type,
      timestamp: new Date(),
      data,
      sessionId: this.getSessionId(),
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    if (this.config.batchProcessing) {
      this.eventQueue.push(event);

      if (this.eventQueue.length >= this.config.batchSize) {
        this.flushEvents();
      }
    } else {
      this.sendEvent(event);
    }
  }

  public trackMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    if (!this.config.enabled) return;

    const metric: MonitoringMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
      unit,
    };

    if (this.config.batchProcessing) {
      this.metricQueue.push(metric);

      if (this.metricQueue.length >= this.config.batchSize) {
        this.flushMetrics();
      }
    } else {
      this.sendMetric(metric);
    }
  }

  private async sendEvent(event: MonitoringEvent): Promise<void> {
    try {
      if (this.config.analyticsProvider === 'google_analytics') {
        this.sendToGoogleAnalytics(event);
      } else if (this.config.analyticsProvider === 'custom' && this.config.endpoints.events) {
        await this.sendToCustomEndpoint(this.config.endpoints.events, event);
      }
    } catch (error) {
      console.error('Failed to send monitoring event:', error);
    }
  }

  private async sendMetric(metric: MonitoringMetric): Promise<void> {
    try {
      if (this.config.analyticsProvider === 'custom' && this.config.endpoints.analytics) {
        await this.sendToCustomEndpoint(this.config.endpoints.analytics, metric);
      }
    } catch (error) {
      console.error('Failed to send monitoring metric:', error);
    }
  }

  private sendToGoogleAnalytics(event: MonitoringEvent): void {
    if (!('gtag' in window)) return;

    gtag('event', event.type, {
      custom_parameter_1: JSON.stringify(event.data),
      session_id: event.sessionId,
    });
  }

  private async sendToCustomEndpoint(endpoint: string, data: any): Promise<void> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.config.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (this.config.endpoints.events) {
        await this.sendToCustomEndpoint(this.config.endpoints.events, {
          type: 'batch_events',
          timestamp: new Date(),
          events,
        });
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricQueue.length === 0) return;

    const metrics = [...this.metricQueue];
    this.metricQueue = [];

    try {
      if (this.config.endpoints.analytics) {
        await this.sendToCustomEndpoint(this.config.endpoints.analytics, {
          type: 'batch_metrics',
          timestamp: new Date(),
          metrics,
        });
      }
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add metrics to queue for retry
      this.metricQueue.unshift(...metrics);
    }
  }

  private async flushQueues(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const now = Date.now();

    try {
      await Promise.all([
        this.flushEvents(),
        this.flushMetrics(),
      ]);

      this.lastFlushTime = now;
    } catch (error) {
      console.error('Failed to flush monitoring queues:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Integration with feedback analytics
  public async processFeedbackAnalytics(feedback: FeedbackSubmission[]): Promise<FeedbackAnalytics> {
    const analytics = await feedbackAnalyticsEngine.processFeedback(feedback);

    // Track analytics metrics
    this.trackMetric('feedback_total_submissions', analytics.summary.totalSubmissions);
    this.trackMetric('feedback_average_rating', analytics.summary.averageRating);
    this.trackMetric('feedback_satisfaction_score', analytics.summary.satisfactionScore);
    this.trackMetric('feedback_nps_score', analytics.summary.npsScore);
    this.trackMetric('feedback_completion_rate', analytics.summary.completionRate);

    // Track insights count
    this.trackMetric('feedback_insights_generated', analytics.insights.length);
    this.trackMetric('feedback_recommendations_generated', analytics.recommendations.length);
    this.trackMetric('feedback_alerts_generated', analytics.alerts.length);

    return analytics;
  }

  // Public methods for configuration and data access
  public updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getQueuedEvents(): MonitoringEvent[] {
    return [...this.eventQueue];
  }

  public getQueuedMetrics(): MonitoringMetric[] {
    return [...this.metricQueue];
  }

  public getPerformanceData(): PerformanceData[] {
    return [...this.performanceData];
  }

  public clearQueues(): void {
    this.eventQueue = [];
    this.metricQueue = [];
  }

  public clearPerformanceData(): void {
    this.performanceData = [];
  }

  public forceFlush(): Promise<void> {
    return this.flushQueues();
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public enable(): void {
    this.config.enabled = true;
  }

  public disable(): void {
    this.config.enabled = false;
  }

  // Export data for analysis
  public exportData(): {
    events: MonitoringEvent[];
    metrics: MonitoringMetric[];
    performanceData: PerformanceData[];
  } {
    return {
      events: this.getQueuedEvents(),
      metrics: this.getQueuedMetrics(),
      performanceData: this.getPerformanceData(),
    };
  }
}

// Export singleton instance
export const feedbackMonitoringSystem = new FeedbackMonitoringSystem();

// Export convenience functions
export const trackFeedbackSubmission = (feedback: FeedbackSubmission) =>
  feedbackMonitoringSystem.trackFeedbackSubmission(feedback);

export const trackFeedbackView = (templateId: string, source: string) =>
  feedbackMonitoringSystem.trackFeedbackView(templateId, source);

export const trackFeedbackDismissal = (templateId: string, reason?: string) =>
  feedbackMonitoringSystem.trackFeedbackDismissal(templateId, reason);

export const trackPerformanceIssue = (issue: string, severity: string, details?: any) =>
  feedbackMonitoringSystem.trackPerformanceIssue(issue, severity, details);

export const trackUserInteraction = (action: string, details?: any) =>
  feedbackMonitoringSystem.trackUserInteraction(action, details);

export default feedbackMonitoringSystem;
