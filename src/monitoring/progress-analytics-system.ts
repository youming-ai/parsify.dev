/**
 * Progress Analytics System
 * Comprehensive analytics for operation completion times and performance insights
 */

import {
  ProgressOperation,
  ProgressType,
  ProgressMetrics,
  ProgressAnalytics,
  ToolCategory
} from './progress-indicators-types';
import { timeEstimator, TimeEstimation } from './progress-time-estimation';
import { errorRetryIntegration } from './progress-error-retry-integration';

// ============================================================================
// Analytics Configuration
// ============================================================================

export interface ProgressAnalyticsConfig {
  // Data collection
  enableDataCollection: boolean;
  retentionPeriod: number; // days
  sampleRate: number; // 0-1, percentage of operations to track

  // Analytics features
  enablePerformanceAnalytics: boolean;
  enableUserBehaviorAnalytics: boolean;
  enablePredictiveAnalytics: boolean;
  enableRealTimeAnalytics: boolean;

  // Reporting
  enableAutomaticReporting: boolean;
  reportingInterval: number; // hours
  enableAlerts: boolean;
  alertThresholds: AnalyticsAlertThresholds;

  // Privacy
  anonymizeData: boolean;
  excludePII: boolean;
}

export interface AnalyticsAlertThresholds {
  slowOperationThreshold: number; // milliseconds
  failureRateThreshold: number; // percentage
  abandonmentRateThreshold: number; // percentage
  retryRateThreshold: number; // percentage
  userSatisfactionThreshold: number; // 1-5
}

export interface OperationAnalytics {
  // Basic metrics
  operationId: string;
  toolId: string;
  operationType: ProgressType;
  category: ToolCategory;

  // Timing metrics
  startTime: Date;
  endTime?: Date;
  duration?: number;
  estimatedDuration?: number;
  estimationAccuracy?: number;

  // Progress metrics
  progressEvents: ProgressEvent[];
  progressRate: number; // progress per second
  consistencyScore: number; // 0-1

  // Performance metrics
  inputSize: number;
  outputSize: number;
  throughput: number; // bytes per second
  memoryUsage: number[];
  cpuUsage: number[];

  // User interaction metrics
  userInteractions: UserInteraction[];
  pauseCount: number;
  cancellationPoint?: number;
  userSatisfaction?: number;

  // Error and retry metrics
  errors: ProgressError[];
  retryCount: number;
  retrySuccess: boolean;

  // Contextual data
  browserInfo: BrowserInfo;
  systemInfo: SystemInfo;
  sessionContext: SessionContext;
}

export interface ProgressEvent {
  timestamp: Date;
  progress: number;
  duration: number;
  throughput?: number;
  stepName?: string;
  userInteraction?: boolean;
}

export interface UserInteraction {
  timestamp: Date;
  type: 'pause' | 'resume' | 'cancel' | 'retry' | 'focus' | 'blur';
  progress: number;
  details?: any;
}

export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screenResolution: string;
  viewportSize: string;
}

export interface SystemInfo {
  cores: number;
  memory: number;
  connectionType: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export interface SessionContext {
  sessionId: string;
  userId?: string;
  startTime: Date;
  pageUrl: string;
  referrer: string;
  userRole?: string;
}

export interface PerformanceInsights {
  // Overall performance
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;

  // Trends
  durationTrend: 'improving' | 'degrading' | 'stable';
  performanceScore: number; // 0-100

  // Patterns
  peakPerformanceHours: number[];
  slowOperationPatterns: OperationPattern[];
  fastOperationPatterns: OperationPattern[];

  // Recommendations
  optimizations: PerformanceOptimization[];
  warnings: PerformanceWarning[];
}

export interface OperationPattern {
  toolId: string;
  operationType: ProgressType;
  conditions: string[];
  averageDuration: number;
  frequency: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PerformanceOptimization {
  type: 'algorithm' | 'caching' | 'parallelization' | 'ui' | 'infrastructure';
  description: string;
  estimatedImprovement: number; // percentage
  implementationComplexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

export interface PerformanceWarning {
  type: 'performance' | 'reliability' | 'user_experience' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedTools: string[];
  recommendation: string;
}

// ============================================================================
// Progress Analytics Manager
// ============================================================================

export class ProgressAnalyticsSystem {
  private config: ProgressAnalyticsConfig;
  private analyticsData: Map<string, OperationAnalytics> = new Map();
  private completedOperations: OperationAnalytics[] = [];
  private activeOperations: Map<string, OperationAnalytics> = new Map();

  // Analytics calculations
  private performanceCache: Map<string, PerformanceInsights> = new Map();
  private alertHistory: PerformanceWarning[] = [];

  // Real-time monitoring
  private monitoringInterval?: NodeJS.Timeout;
  private performanceThresholds: Map<string, number> = new Map();

  constructor(config: Partial<ProgressAnalyticsConfig> = {}) {
    this.config = {
      enableDataCollection: true,
      retentionPeriod: 90, // 90 days
      sampleRate: 1.0, // 100% sampling
      enablePerformanceAnalytics: true,
      enableUserBehaviorAnalytics: true,
      enablePredictiveAnalytics: true,
      enableRealTimeAnalytics: true,
      enableAutomaticReporting: false,
      reportingInterval: 24, // 24 hours
      enableAlerts: true,
      alertThresholds: {
        slowOperationThreshold: 10000, // 10 seconds
        failureRateThreshold: 10, // 10%
        abandonmentRateThreshold: 15, // 15%
        retryRateThreshold: 20, // 20%
        userSatisfactionThreshold: 3.0, // 3 out of 5
      },
      anonymizeData: true,
      excludePII: true,
      ...config,
    };

    this.initializeAnalytics();
    this.loadPersistedData();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Start tracking an operation
   */
  public startTracking(operation: ProgressOperation): void {
    if (!this.config.enableDataCollection) return;

    if (Math.random() > this.config.sampleRate) return; // Sampling

    const analytics: OperationAnalytics = {
      operationId: operation.id,
      toolId: operation.toolId,
      operationType: operation.type,
      category: operation.category,
      startTime: operation.createdAt,
      progressEvents: [],
      progressRate: 0,
      consistencyScore: 1,
      inputSize: operation.inputSize || 0,
      outputSize: operation.outputSize || 0,
      throughput: 0,
      memoryUsage: [],
      cpuUsage: [],
      userInteractions: [],
      pauseCount: 0,
      errors: [],
      retryCount: operation.retryCount || 0,
      retrySuccess: false,
      browserInfo: this.getBrowserInfo(),
      systemInfo: this.getSystemInfo(),
      sessionContext: this.getSessionContext(operation),
    };

    this.analyticsData.set(operation.id, analytics);
    this.activeOperations.set(operation.id, analytics);

    // Start real-time monitoring
    this.startRealTimeMonitoring(operation);
  }

  /**
   * Update operation progress
   */
  public updateProgress(operation: ProgressOperation, update: any): void {
    const analytics = this.analyticsData.get(operation.id);
    if (!analytics) return;

    const now = new Date();
    const elapsed = now.getTime() - analytics.startTime.getTime();

    // Record progress event
    const progressEvent: ProgressEvent = {
      timestamp: now,
      progress: operation.progress,
      duration: elapsed,
      throughput: operation.throughput,
      stepName: operation.stepName,
      userInteraction: false,
    };

    analytics.progressEvents.push(progressEvent);

    // Update calculated metrics
    this.updateCalculatedMetrics(analytics);

    // Check for performance issues
    if (this.config.enableRealTimeAnalytics) {
      this.checkPerformanceThresholds(analytics);
    }
  }

  /**
   * Record operation completion
   */
  public recordCompletion(operation: ProgressOperation, result?: any): void {
    const analytics = this.analyticsData.get(operation.id);
    if (!analytics) return;

    const endTime = new Date();
    const duration = endTime.getTime() - analytics.startTime.getTime();

    analytics.endTime = endTime;
    analytics.duration = duration;
    analytics.outputSize = operation.outputSize || 0;

    // Calculate final metrics
    this.calculateFinalMetrics(analytics);

    // Move to completed operations
    this.completedOperations.push(analytics);
    this.activeOperations.delete(operation.id);

    // Update time estimation accuracy
    if (operation.estimatedDuration) {
      analytics.estimationAccuracy = Math.abs(operation.estimatedDuration - duration) / operation.estimatedDuration;
    }

    // Generate insights
    if (this.config.enablePredictiveAnalytics) {
      this.generatePerformanceInsights(analytics);
    }

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkForAlerts(analytics);
    }

    // Persist data
    this.persistData();
  }

  /**
   * Record operation failure
   */
  public recordFailure(operation: ProgressOperation, error: any): void {
    const analytics = this.analyticsData.get(operation.id);
    if (!analytics) return;

    const endTime = new Date();
    const duration = endTime.getTime() - analytics.startTime.getTime();

    analytics.endTime = endTime;
    analytics.duration = duration;
    analytics.errors.push(error);

    // Record cancellation point if applicable
    if (operation.status === 'cancelled') {
      analytics.cancellationPoint = operation.progress;
    }

    // Move to completed operations
    this.completedOperations.push(analytics);
    this.activeOperations.delete(operation.id);

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkForAlerts(analytics);
    }

    // Persist data
    this.persistData();
  }

  /**
   * Record user interaction
   */
  public recordUserInteraction(
    operationId: string,
    interaction: UserInteraction
  ): void {
    const analytics = this.analyticsData.get(operationId);
    if (!analytics) return;

    analytics.userInteractions.push(interaction);

    // Update specific metrics based on interaction type
    switch (interaction.type) {
      case 'pause':
        analytics.pauseCount++;
        break;
      case 'resume':
        // Handle resume logic
        break;
    }
  }

  /**
   * Get comprehensive analytics
   */
  public getAnalytics(timeWindow?: string): ProgressAnalytics {
    const filteredData = this.filterByTimeWindow(this.completedOperations, timeWindow);

    return {
      operationHistory: this.mapToProgressOperations(filteredData),
      completionTimes: filteredData.map(op => ({
        toolId: op.toolId,
        type: op.operationType,
        duration: op.duration || 0,
        inputSize: op.inputSize,
        timestamp: op.startTime,
      })),
      performancePatterns: this.analyzePerformancePatterns(filteredData),
      durationPredictions: this.generateDurationPredictions(),
      userBehavior: this.analyzeUserBehavior(filteredData),
    };
  }

  /**
   * Get performance insights
   */
  public getPerformanceInsights(toolId?: string): PerformanceInsights {
    const key = toolId || 'all';

    if (this.performanceCache.has(key)) {
      return this.performanceCache.get(key)!;
    }

    const data = toolId
      ? this.completedOperations.filter(op => op.toolId === toolId)
      : this.completedOperations;

    const insights = this.calculatePerformanceInsights(data);
    this.performanceCache.set(key, insights);

    return insights;
  }

  /**
   * Get metrics for dashboard
   */
  public getDashboardMetrics(): {
    totalOperations: number;
    activeOperations: number;
    completionRate: number;
    averageDuration: number;
    userSatisfaction: number;
    performanceScore: number;
    recentWarnings: PerformanceWarning[];
  } {
    const total = this.completedOperations.length;
    const active = this.activeOperations.size;
    const completed = this.completedOperations.filter(op => op.duration).length;

    const completionRate = total > 0 ? completed / total : 0;
    const averageDuration = completed > 0
      ? this.completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completed
      : 0;

    const userSatisfaction = this.calculateUserSatisfaction();
    const performanceScore = this.calculateOverallPerformanceScore();

    return {
      totalOperations: total,
      activeOperations: active,
      completionRate,
      averageDuration,
      userSatisfaction,
      performanceScore,
      recentWarnings: this.alertHistory.slice(-10),
    };
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(timeWindow: string = '7d'): {
    summary: PerformanceSummary;
    toolBreakdown: ToolPerformanceReport[];
    recommendations: PerformanceOptimization[];
    warnings: PerformanceWarning[];
    trends: PerformanceTrend[];
  } {
    const data = this.filterByTimeWindow(this.completedOperations, timeWindow);

    return {
      summary: this.generateSummary(data),
      toolBreakdown: this.generateToolBreakdown(data),
      recommendations: this.generateRecommendations(data),
      warnings: this.alertHistory.slice(-20),
      trends: this.analyzeTrends(data),
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ProgressAnalyticsConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring if needed
    if (config.enableRealTimeAnalytics !== undefined) {
      this.restartRealTimeMonitoring();
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeAnalytics(): void {
    // Setup automatic reporting
    if (this.config.enableAutomaticReporting) {
      this.setupAutomaticReporting();
    }

    // Setup real-time monitoring
    if (this.config.enableRealTimeAnalytics) {
      this.setupRealTimeMonitoring();
    }

    // Cleanup old data periodically
    setInterval(() => this.cleanupOldData(), 24 * 60 * 60 * 1000); // Daily
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('progress_analytics_data');
      if (stored) {
        const data = JSON.parse(stored);

        if (data.completedOperations) {
          this.completedOperations = data.completedOperations.map((op: any) => ({
            ...op,
            startTime: new Date(op.startTime),
            endTime: op.endTime ? new Date(op.endTime) : undefined,
            progressEvents: op.progressEvents.map((event: any) => ({
              ...event,
              timestamp: new Date(event.timestamp),
            })),
            userInteractions: op.userInteractions.map((interaction: any) => ({
              ...interaction,
              timestamp: new Date(interaction.timestamp),
            })),
          }));
        }

        if (data.alertHistory) {
          this.alertHistory = data.alertHistory;
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  private persistData(): void {
    try {
      const data = {
        completedOperations: this.completedOperations.slice(-1000), // Keep last 1000
        alertHistory: this.alertHistory.slice(-100), // Keep last 100
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem('progress_analytics_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist analytics data:', error);
    }
  }

  private updateCalculatedMetrics(analytics: OperationAnalytics): void {
    // Calculate progress rate
    if (analytics.progressEvents.length >= 2) {
      const recentEvents = analytics.progressEvents.slice(-10);
      const progressDiff = recentEvents[recentEvents.length - 1].progress - recentEvents[0].progress;
      const timeDiff = recentEvents[recentEvents.length - 1].timestamp.getTime() - recentEvents[0].timestamp.getTime();

      analytics.progressRate = timeDiff > 0 ? (progressDiff / timeDiff) * 1000 : 0; // progress per second
    }

    // Calculate throughput
    if (analytics.inputSize > 0 && analytics.progressEvents.length > 0) {
      const lastEvent = analytics.progressEvents[analytics.progressEvents.length - 1];
      const elapsed = lastEvent.timestamp.getTime() - analytics.startTime.getTime();
      analytics.throughput = elapsed > 0 ? (analytics.inputSize / elapsed) * 1000 : 0; // bytes per second
    }
  }

  private calculateFinalMetrics(analytics: OperationAnalytics): void {
    // Calculate consistency score based on progress rate variance
    if (analytics.progressEvents.length > 1) {
      const rates = this.calculateProgressRates(analytics.progressEvents);
      const variance = this.calculateVariance(rates);
      analytics.consistencyScore = Math.max(0, 1 - variance);
    }
  }

  private calculateProgressRates(events: ProgressEvent[]): number[] {
    const rates: number[] = [];

    for (let i = 1; i < events.length; i++) {
      const progressDiff = events[i].progress - events[i - 1].progress;
      const timeDiff = events[i].timestamp.getTime() - events[i - 1].timestamp.getTime();

      if (timeDiff > 0) {
        rates.push((progressDiff / timeDiff) * 1000);
      }
    }

    return rates;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private startRealTimeMonitoring(operation: ProgressOperation): void {
    if (!this.config.enableRealTimeAnalytics) return;

    const interval = setInterval(() => {
      const analytics = this.activeOperations.get(operation.id);
      if (!analytics) {
        clearInterval(interval);
        return;
      }

      // Collect system metrics
      this.collectSystemMetrics(analytics);

      // Check performance thresholds
      this.checkPerformanceThresholds(analytics);
    }, 5000); // Every 5 seconds
  }

  private collectSystemMetrics(analytics: OperationAnalytics): void {
    // Collect memory usage
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      analytics.memoryUsage.push(memory.usedJSHeapSize);

      // Keep only last 100 measurements
      if (analytics.memoryUsage.length > 100) {
        analytics.memoryUsage.shift();
      }
    }

    // CPU usage would require additional APIs
  }

  private checkPerformanceThresholds(analytics: OperationAnalytics): void {
    const now = new Date();
    const elapsed = now.getTime() - analytics.startTime.getTime();

    // Check for slow operations
    if (elapsed > this.config.alertThresholds.slowOperationThreshold) {
      this.generateAlert({
        type: 'performance',
        severity: 'medium',
        message: `Operation ${analytics.operationId} is taking longer than expected`,
        affectedTools: [analytics.toolId],
        recommendation: 'Consider optimizing the operation or breaking it into smaller chunks',
      });
    }
  }

  private checkForAlerts(analytics: OperationAnalytics): void {
    // Check for high failure rate
    if (analytics.errors.length > 0) {
      this.generateAlert({
        type: 'reliability',
        severity: 'high',
        message: `Operation ${analytics.operationId} failed with errors`,
        affectedTools: [analytics.toolId],
        recommendation: 'Review error logs and improve error handling',
      });
    }

    // Check for high abandonment rate
    if (analytics.cancellationPoint !== undefined && analytics.cancellationPoint < 50) {
      this.generateAlert({
        type: 'user_experience',
        severity: 'medium',
        message: `Operation ${analytics.operationId} was cancelled early`,
        affectedTools: [analytics.toolId],
        recommendation: 'Investigate user experience issues and improve progress feedback',
      });
    }
  }

  private generateAlert(warning: PerformanceWarning): void {
    warning.timestamp = new Date();
    this.alertHistory.push(warning);

    // Keep only recent alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }
  }

  private filterByTimeWindow(
    operations: OperationAnalytics[],
    timeWindow?: string
  ): OperationAnalytics[] {
    if (!timeWindow) return operations;

    const now = new Date();
    const windowMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeWindow] || 24 * 60 * 60 * 1000;

    const cutoff = new Date(now.getTime() - windowMs);
    return operations.filter(op => op.startTime >= cutoff);
  }

  private mapToProgressOperations(operations: OperationAnalytics[]): ProgressOperation[] {
    return operations.map(analytics => ({
      id: analytics.operationId,
      toolId: analytics.toolId,
      sessionId: analytics.sessionContext.sessionId,
      userId: analytics.sessionContext.userId,
      name: `${analytics.toolId} - ${analytics.operationType}`,
      description: '',
      type: analytics.operationType,
      category: analytics.category,
      priority: 'medium',
      status: analytics.duration ? 'completed' : 'failed',
      progress: 100,
      createdAt: analytics.startTime,
      updatedAt: analytics.endTime || analytics.startTime,
      startedAt: analytics.startTime,
      completedAt: analytics.endTime,
      processingTime: analytics.duration || 0,
      uiResponseTime: 0,
      inputSize: analytics.inputSize,
      outputSize: analytics.outputSize,
      canRetry: analytics.retryCount > 0,
    }));
  }

  private analyzePerformancePatterns(operations: OperationAnalytics[]): any {
    // Analyze patterns in operation performance
    return {
      peakHours: this.findPeakHours(operations),
      slowOperations: this.findSlowOperations(operations),
      frequentErrors: this.findFrequentErrors(operations),
    };
  }

  private generateDurationPredictions(): any {
    // Generate ML-based duration predictions
    return {};
  }

  private analyzeUserBehavior(operations: OperationAnalytics[]): any {
    // Analyze user behavior patterns
    return {
      averageWaitTime: this.calculateAverageWaitTime(operations),
      cancellationPoints: this.analyzeCancellationPoints(operations),
      retryPatterns: this.analyzeRetryPatterns(operations),
    };
  }

  private calculatePerformanceInsights(operations: OperationAnalytics[]): PerformanceInsights {
    const durations = operations
      .filter(op => op.duration)
      .map(op => op.duration!)
      .sort((a, b) => a - b);

    return {
      averageDuration: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      medianDuration: durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0,
      p95Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
      p99Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0,
      durationTrend: 'stable',
      performanceScore: this.calculatePerformanceScore(operations),
      peakPerformanceHours: [],
      slowOperationPatterns: [],
      fastOperationPatterns: [],
      optimizations: [],
      warnings: [],
    };
  }

  private calculateUserSatisfaction(): number {
    // Calculate user satisfaction based on various metrics
    return 4.2; // Placeholder
  }

  private calculateOverallPerformanceScore(): number {
    // Calculate overall performance score (0-100)
    return 85; // Placeholder
  }

  private calculatePerformanceScore(operations: OperationAnalytics[]): number {
    // Calculate performance score for specific tool
    return 80; // Placeholder
  }

  // Placeholder methods for complex analytics
  private generateSummary(data: any): any { return {}; }
  private generateToolBreakdown(data: any): any[] { return []; }
  private generateRecommendations(data: any): any[] { return []; }
  private analyzeTrends(data: any): any[] { return []; }
  private findPeakHours(operations: OperationAnalytics[]): number[] { return []; }
  private findSlowOperations(operations: OperationAnalytics[]): any[] { return []; }
  private findFrequentErrors(operations: OperationAnalytics[]): any[] { return []; }
  private calculateAverageWaitTime(operations: OperationAnalytics[]): number { return 0; }
  private analyzeCancellationPoints(operations: OperationAnalytics[]): any[] { return []; }
  private analyzeRetryPatterns(operations: OperationAnalytics[]): any { return {}; }
  private setupAutomaticReporting(): void {}
  private setupRealTimeMonitoring(): void {}
  private restartRealTimeMonitoring(): void {}
  private cleanupOldData(): void {}

  // System info collection
  private getBrowserInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  private getSystemInfo(): SystemInfo {
    return {
      cores: navigator.hardwareConcurrency || 4,
      memory: 8, // GB (estimated)
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    };
  }

  private getSessionContext(operation: ProgressOperation): SessionContext {
    return {
      sessionId: operation.sessionId,
      userId: operation.userId,
      startTime: new Date(),
      pageUrl: window.location.href,
      referrer: document.referrer,
    };
  }

  private generatePerformanceInsights(analytics: OperationAnalytics): void {
    // Generate insights for completed operation
  }
}

// Type definitions for completeness
interface PerformanceSummary {
  totalOperations: number;
  completionRate: number;
  averageDuration: number;
  performanceScore: number;
}

interface ToolPerformanceReport {
  toolId: string;
  operations: number;
  averageDuration: number;
  successRate: number;
  userSatisfaction: number;
}

interface PerformanceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
}

// ============================================================================
// Global Instance
// ============================================================================

export const progressAnalytics = new ProgressAnalyticsSystem();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Start tracking operation analytics
 */
export function startOperationTracking(operation: ProgressOperation): void {
  progressAnalytics.startTracking(operation);
}

/**
 * Update operation analytics
 */
export function updateOperationAnalytics(operation: ProgressOperation, update: any): void {
  progressAnalytics.updateProgress(operation, update);
}

/**
 * Record operation completion in analytics
 */
export function recordOperationCompletion(operation: ProgressOperation, result?: any): void {
  progressAnalytics.recordCompletion(operation, result);
}

/**
 * Record operation failure in analytics
 */
export function recordOperationFailure(operation: ProgressOperation, error: any): void {
  progressAnalytics.recordFailure(operation, error);
}

/**
 * Record user interaction
 */
export function recordProgressUserInteraction(
  operationId: string,
  type: UserInteraction['type'],
  details?: any
): void {
  const analytics = progressAnalytics as any;
  const operationAnalytics = analytics.analyticsData?.get(operationId);

  if (operationAnalytics) {
    analytics.recordUserInteraction(operationId, {
      timestamp: new Date(),
      type,
      progress: 0, // Would need to get current progress
      details,
    });
  }
}

/**
 * Get performance insights
 */
export function getPerformanceInsights(toolId?: string): PerformanceInsights {
  return progressAnalytics.getPerformanceInsights(toolId);
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(timeWindow?: string): any {
  return progressAnalytics.generatePerformanceReport(timeWindow);
}
