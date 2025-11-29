/**
 * Performance Monitor for NLP Operations
 * Provides comprehensive monitoring and analytics for ML-based text processing
 */

import { type NLPEvent, type NLPEventListener, type NLPEventType, TaskStatus } from '../types';
import {
  type AlertSeverity,
  AlertType,
  type MemoryMetrics,
  type ModelPerformanceMetrics,
  type NetworkMetrics,
  type PerformanceAlert,
  type SystemPerformanceMetrics,
} from '../types/infrastructure';

export interface PerformanceConfig {
  enableProfiling: boolean;
  enableMemoryTracking: boolean;
  enableNetworkTracking: boolean;
  enableModelMetrics: boolean;
  alertThresholds: AlertThresholds;
  samplingRate: number;
  retentionPeriod: number;
  batchSize: number;
}

export interface AlertThresholds {
  maxResponseTime: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  maxErrorRate: number;
  minCacheHitRate: number;
  maxModelLoadTime: number;
  minAccuracy: number;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  operation: string;
  tool: string;
  metrics: SystemPerformanceMetrics;
  context: Record<string, any>;
}

export interface PerformanceAggregation {
  operation: string;
  tool: string;
  period: TimeWindow;
  metrics: {
    count: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalMemoryUsage: number;
    avgMemoryUsage: number;
    peakMemoryUsage: number;
    errorRate: number;
    throughput: number;
    accuracy?: number;
  };
}

export type TimeWindow = '1m' | '5m' | '15m' | '1h' | '6h' | '1d' | '1w';

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private snapshots: PerformanceSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private eventListeners: Map<NLPEventType, NLPEventListener[]> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private operations: Map<string, OperationTimer> = new Map();
  private modelMetrics: Map<string, ModelPerformanceMetrics> = new Map();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableProfiling: true,
      enableMemoryTracking: true,
      enableNetworkTracking: true,
      enableModelMetrics: true,
      alertThresholds: {
        maxResponseTime: 5000,
        maxMemoryUsage: 0.8,
        maxCpuUsage: 0.9,
        maxErrorRate: 0.05,
        minCacheHitRate: 0.7,
        maxModelLoadTime: 10000,
        minAccuracy: 0.8,
      },
      samplingRate: 1.0,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 100,
      ...config,
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
      this.cleanupOldData();
      this.aggregateMetrics();
    }, 60000); // Check every minute

    this.emitEvent({
      type: 'analysis_started',
      timestamp: new Date(),
      data: { message: 'Performance monitoring started' },
    });

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emitEvent({
      type: 'analysis_completed',
      timestamp: new Date(),
      data: { message: 'Performance monitoring stopped' },
    });

    console.log('Performance monitoring stopped');
  }

  /**
   * Start timing an operation
   */
  startOperation(
    operationId: string,
    operation: string,
    tool: string,
    context: Record<string, any> = {}
  ): void {
    if (!this.config.enableProfiling) return;

    this.operations.set(operationId, {
      id: operationId,
      operation,
      tool,
      startTime: performance.now(),
      context,
      memoryStart: this.getMemoryUsage(),
    });
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(
    operationId: string,
    success = true,
    modelMetrics?: Partial<ModelPerformanceMetrics>,
    networkMetrics?: Partial<NetworkMetrics>,
    error?: Error
  ): void {
    if (!this.config.enableProfiling) return;

    const timer = this.operations.get(operationId);
    if (!timer) return;

    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    const memoryEnd = this.getMemoryUsage();

    const metrics: SystemPerformanceMetrics = {
      timestamp: new Date(),
      operation: timer.operation,
      tool: timer.tool,
      duration,
      memoryUsage: memoryEnd,
      cpuUsage: this.getCpuUsage(),
      modelMetrics: modelMetrics
        ? {
            ...modelMetrics,
            loadTime: modelMetrics.loadTime || 0,
            inferenceTime: duration,
            batchSize: modelMetrics.batchSize ?? 0,
            throughput: modelMetrics.throughput || 0,
            cacheHitRate: modelMetrics.cacheHitRate || 0,
            accuracy: modelMetrics.accuracy,
          }
        : undefined,
      networkMetrics: networkMetrics
        ? {
            ...networkMetrics,
            requestsCount: networkMetrics.requestsCount || 0,
            bytesTransferred: networkMetrics.bytesTransferred || 0,
            errorsCount: networkMetrics.errorsCount || 0,
            averageLatency: networkMetrics.averageLatency || duration,
            bandwidth: networkMetrics.bandwidth || 0,
          }
        : undefined,
    };

    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      operation: timer.operation,
      tool: timer.tool,
      metrics,
      context: {
        ...timer.context,
        success,
        error: error?.message,
        memoryDelta: memoryEnd.used - timer.memoryStart.used,
      },
    };

    this.addSnapshot(snapshot);
    this.operations.delete(operationId);
    this.checkForAlerts(snapshot);

    // Emit performance event
    this.emitEvent({
      type: success ? 'analysis_completed' : 'analysis_failed',
      timestamp: new Date(),
      data: {
        operation: timer.operation,
        tool: timer.tool,
        duration,
        success,
        memoryUsage: memoryEnd.used,
      },
    });
  }

  /**
   * Record model loading metrics
   */
  recordModelLoad(modelId: string, loadTime: number, _modelSize: number, _success: boolean): void {
    if (!this.config.enableModelMetrics) return;

    const existing = this.modelMetrics.get(modelId) || {
      loadTime: 0,
      inferenceTime: 0,
      batchSize: 0,
      throughput: 0,
      cacheHitRate: 0,
      accuracy: undefined,
    };

    existing.loadTime = loadTime;

    this.modelMetrics.set(modelId, existing);

    // Check for performance alerts
    if (loadTime > this.config.alertThresholds.maxModelLoadTime) {
      this.addAlert({
        type: 'model_load_failure',
        severity:
          loadTime > this.config.alertThresholds.maxModelLoadTime * 2 ? 'critical' : 'error',
        message: `Model ${modelId} loading took ${loadTime}ms (threshold: ${this.config.alertThresholds.maxModelLoadTime}ms)`,
        timestamp: new Date(),
        metrics: {
          timestamp: new Date(),
          operation: 'model_load',
          tool: modelId,
          duration: loadTime,
          memoryUsage: this.getMemoryUsage(),
          cpuUsage: this.getCpuUsage(),
        },
        threshold: this.config.alertThresholds.maxModelLoadTime,
        suggestion: 'Consider using model quantization or lazy loading',
      });
    }
  }

  /**
   * Record cache hit/miss metrics
   */
  recordCacheAccess(cacheId: string, hit: boolean): void {
    // This would integrate with the cache system
    // For now, we'll emit a performance event
    this.emitEvent({
      type: hit ? 'cache_hit' : 'cache_miss',
      timestamp: new Date(),
      data: { cacheId },
    });
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): SystemPerformanceMetrics {
    return {
      timestamp: new Date(),
      operation: 'system_check',
      tool: 'performance_monitor',
      duration: 0,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
    };
  }

  /**
   * Get aggregated performance data
   */
  getAggregatedMetrics(
    operation?: string,
    tool?: string,
    window: TimeWindow = '1h'
  ): PerformanceAggregation[] {
    const now = Date.now();
    const windowMs = this.getWindowMs(window);
    const startTime = new Date(now - windowMs);

    const filteredSnapshots = this.snapshots.filter((snapshot) => {
      if (snapshot.timestamp < startTime) return false;
      if (operation && snapshot.operation !== operation) return false;
      if (tool && snapshot.tool !== tool) return false;
      return true;
    });

    // Group by operation and tool
    const groups = new Map<string, PerformanceSnapshot[]>();
    filteredSnapshots.forEach((snapshot) => {
      const key = `${snapshot.operation}:${snapshot.tool}`;
      const group = groups.get(key) || [];
      group.push(snapshot);
      groups.set(key, group);
    });

    // Calculate aggregates for each group
    return Array.from(groups.entries()).map(([key, snapshots]) => {
      const [op, tl] = key.split(':');
      const durations = snapshots.map((s) => s.metrics.duration);
      const memoryUsages = snapshots.map((s) => s.metrics.memoryUsage.used);
      const errorCount = snapshots.filter((s) => !s.context.success).length;

      const sortedDurations = durations.sort((a, b) => a - b);

      return {
        operation: op,
        tool: tl,
        period: window,
        metrics: {
          count: snapshots.length,
          avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
          minResponseTime: Math.min(...durations),
          maxResponseTime: Math.max(...durations),
          p95ResponseTime: this.percentile(sortedDurations, 0.95),
          p99ResponseTime: this.percentile(sortedDurations, 0.99),
          totalMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0),
          avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
          peakMemoryUsage: Math.max(...memoryUsages),
          errorRate: errorCount / snapshots.length,
          throughput: snapshots.length / (windowMs / 1000), // per second
          accuracy: this.calculateAverageAccuracy(snapshots),
        },
      };
    });
  }

  /**
   * Get recent alerts
   */
  getAlerts(severity?: AlertSeverity, limit = 50): PerformanceAlert[] {
    let filtered = this.alerts;

    if (severity) {
      filtered = filtered.filter((alert) => alert.severity === severity);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const recentMetrics = this.getAggregatedMetrics(undefined, undefined, '1h');

    // Analyze response times
    const slowOperations = recentMetrics.filter(
      (agg) => agg.metrics.avgResponseTime > this.config.alertThresholds.maxResponseTime
    );
    if (slowOperations.length > 0) {
      recommendations.push(
        `Consider optimizing ${slowOperations.map((o) => o.operation).join(', ')} - average response time is above threshold`
      );
    }

    // Analyze memory usage
    const highMemoryOperations = recentMetrics.filter(
      (agg) => agg.metrics.peakMemoryUsage > this.config.alertThresholds.maxMemoryUsage * 1000
    ); // Convert to MB
    if (highMemoryOperations.length > 0) {
      recommendations.push(
        `High memory usage detected in ${highMemoryOperations.map((o) => o.tool).join(', ')} - consider implementing memory optimization`
      );
    }

    // Analyze error rates
    const highErrorOperations = recentMetrics.filter(
      (agg) => agg.metrics.errorRate > this.config.alertThresholds.maxErrorRate
    );
    if (highErrorOperations.length > 0) {
      recommendations.push(
        `High error rate in ${highErrorOperations.map((o) => o.operation).join(', ')} - review error handling and input validation`
      );
    }

    // Analyze accuracy if available
    const lowAccuracyOperations = recentMetrics.filter(
      (agg) =>
        agg.metrics.accuracy && agg.metrics.accuracy < this.config.alertThresholds.minAccuracy
    );
    if (lowAccuracyOperations.length > 0) {
      recommendations.push(
        `Low accuracy in ${lowAccuracyOperations.map((o) => o.tool).join(', ')} - consider model retraining or parameter tuning`
      );
    }

    return recommendations;
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      snapshots: this.snapshots,
      alerts: this.alerts,
      aggregations: this.getAggregatedMetrics(),
      modelMetrics: Object.fromEntries(this.modelMetrics),
      recommendations: this.getRecommendations(),
      exportedAt: new Date(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format implementation would go here
    throw new Error('CSV export not implemented yet');
  }

  /**
   * Event handling
   */
  on(event: NLPEventType, listener: NLPEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  off(event: NLPEventType, listener: NLPEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Private helper methods
   */
  private addSnapshot(snapshot: PerformanceSnapshot): void {
    this.snapshots.push(snapshot);

    // Maintain retention period
    if (this.snapshots.length > this.config.batchSize * 10) {
      this.cleanupOldData();
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.snapshots = this.snapshots.filter((snapshot) => snapshot.timestamp.getTime() > cutoffTime);
    this.alerts = this.alerts.filter((alert) => alert.timestamp.getTime() > cutoffTime);
  }

  private checkForAlerts(snapshot: PerformanceSnapshot): void {
    const { metrics } = snapshot;

    // Check response time
    if (metrics.duration > this.config.alertThresholds.maxResponseTime) {
      this.addAlert({
        type: 'response_time',
        severity:
          metrics.duration > this.config.alertThresholds.maxResponseTime * 2
            ? 'critical'
            : 'warning',
        message: `${snapshot.operation} on ${snapshot.tool} took ${metrics.duration}ms`,
        timestamp: new Date(),
        metrics,
        threshold: this.config.alertThresholds.maxResponseTime,
      });
    }

    // Check memory usage
    const memoryUsagePercent = metrics.memoryUsage.percentage;
    if (memoryUsagePercent > this.config.alertThresholds.maxMemoryUsage * 100) {
      this.addAlert({
        type: 'memory_usage',
        severity: memoryUsagePercent > 95 ? 'critical' : 'warning',
        message: `Memory usage is ${memoryUsagePercent.toFixed(1)}% during ${snapshot.operation}`,
        timestamp: new Date(),
        metrics,
        threshold: this.config.alertThresholds.maxMemoryUsage * 100,
      });
    }

    // Check CPU usage
    if (metrics.cpuUsage > this.config.alertThresholds.maxCpuUsage * 100) {
      this.addAlert({
        type: 'cpu_usage',
        severity: metrics.cpuUsage > 95 ? 'critical' : 'warning',
        message: `CPU usage is ${metrics.cpuUsage.toFixed(1)}% during ${snapshot.operation}`,
        timestamp: new Date(),
        metrics,
        threshold: this.config.alertThresholds.maxCpuUsage * 100,
      });
    }
  }

  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Emit alert event
    this.emitEvent({
      type: 'performance_warning',
      timestamp: new Date(),
      data: alert,
    });

    console.warn('Performance Alert:', alert.message);
  }

  private performHealthCheck(): void {
    const metrics = this.getCurrentMetrics();

    // Basic health check - could be expanded
    if (metrics.memoryUsage.percentage > 90) {
      this.emitEvent({
        type: 'memory_warning',
        timestamp: new Date(),
        data: { usage: metrics.memoryUsage.percentage },
      });
    }
  }

  private aggregateMetrics(): void {
    // Periodic aggregation for performance optimization
    // This would maintain pre-calculated aggregates for common queries
  }

  private emitEvent(event: NLPEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in performance event listener:', error);
      }
    });
  }

  private getMemoryUsage(): MemoryMetrics {
    // Browser-based memory estimation
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        heapUsed: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        heapTotal: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        external: Math.round((memory as any).external / 1024 / 1024),
        modelCache: 0, // Would be tracked separately
      };
    }

    // Fallback for environments without memory API
    return {
      used: 0,
      total: 0,
      percentage: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      modelCache: 0,
    };
  }

  private getCpuUsage(): number {
    // Browser-based CPU estimation is limited
    // This would need to be implemented using performance observers or other mechanisms
    return 0;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateAverageAccuracy(snapshots: PerformanceSnapshot[]): number | undefined {
    const accuracies = snapshots
      .map((s) => s.metrics.modelMetrics?.accuracy)
      .filter((acc): acc is number => acc !== undefined);

    if (accuracies.length === 0) return undefined;
    return accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  }

  private getWindowMs(window: TimeWindow): number {
    const multipliers: Record<TimeWindow, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return multipliers[window];
  }
}

// Helper interfaces
interface OperationTimer {
  id: string;
  operation: string;
  tool: string;
  startTime: number;
  context: Record<string, any>;
  memoryStart: MemoryMetrics;
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
