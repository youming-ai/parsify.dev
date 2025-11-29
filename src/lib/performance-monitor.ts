/**
 * Performance Monitoring System
 *
 * A comprehensive performance monitoring solution for tracking application health,
 * tool performance metrics, and user experience indicators. This system provides
 * real-time insights into:
 *
 * - Bundle sizes and loading performance
 * - Individual tool execution metrics
 * - System resource utilization
 * - Core Web Vitals tracking
 * - Automated performance recommendations
 *
 * @example
 * ```typescript
 * const monitor = PerformanceMonitor.getInstance();
 * monitor.startMonitoring();
 *
 * // Track tool execution
 * monitor.trackToolExecution('json-formatter', 1500, true);
 *
 * // Get performance insights
 * const report = monitor.generateReport();
 * ```
 *
 * @since 1.0.0
 */

import type { BundleAnalysis } from './bundle-analyzer';

export interface PerformanceReport {
  timestamp: number;
  bundleMetrics: BundleAnalysis;
  toolMetrics: ToolPerformanceMetrics[];
  systemMetrics: SystemMetrics;
  webVitals: WebVitalsMetrics;
  recommendations: PerformanceRecommendation[];
}

export interface ToolPerformanceMetrics {
  toolId: string;
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryFootprint: number;
  bundleSize: number;
  executionTime?: number;
  errorCount: number;
  usageCount: number;
  lastUsed: number;
  status: 'idle' | 'loading' | 'ready' | 'processing' | 'error';
}

export interface SystemMetrics {
  totalMemoryUsage: number;
  availableMemory: number;
  cpuUsage: number;
  activeTools: number;
  loadedTools: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface WebVitalsMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export interface PerformanceThreshold {
  maxBundleSize: number; // bytes
  maxLoadTime: number; // ms
  maxRenderTime: number; // ms
  maxMemoryUsage: number; // bytes
  maxExecutionTime: number; // ms
  maxErrorRate: number; // percentage
}

export interface PerformanceRecommendation {
  type: 'bundle' | 'memory' | 'performance' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  metrics?: string[];
}

export interface PerformanceAlert {
  id: string;
  type: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  toolId?: string;
  metrics?: Record<string, number | string>;
  acknowledged: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private thresholds: PerformanceThreshold;
  private toolMetrics: Map<string, ToolPerformanceMetrics>;
  private alerts: PerformanceAlert[];
  private observers: PerformanceObserver[];
  private isMonitoring: boolean;
  private monitoringInterval: NodeJS.Timeout | null;
  private bundleAnalyzer: any;
  private eventListeners: Map<string, Function[]>;

  private constructor(thresholds?: Partial<PerformanceThreshold>) {
    this.thresholds = {
      maxBundleSize: 200 * 1024, // 200KB per tool
      maxLoadTime: 3000, // 3 seconds
      maxRenderTime: 1000, // 1 second
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxExecutionTime: 5000, // 5 seconds
      maxErrorRate: 5, // 5%
      ...thresholds,
    };

    this.toolMetrics = new Map();
    this.alerts = [];
    this.observers = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.bundleAnalyzer = null;
    this.eventListeners = new Map();

    // Initialize bundle analyzer
    this.initializeBundleAnalyzer();
  }

  private initializeBundleAnalyzer(): void {
    try {
      this.bundleAnalyzer = this.bundleAnalyzer || {};
    } catch (_error) {
      this.bundleAnalyzer = null;
    }
  }

  public static getInstance(thresholds?: Partial<PerformanceThreshold>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(thresholds);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.startMetricsCollection();
    this.emit('monitoring:started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.cleanupPerformanceObservers();

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring:stopped');
  }

  /**
   * Track tool load start
   */
  public trackToolLoad(toolId: string): void {
    const metrics: ToolPerformanceMetrics = {
      toolId,
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryFootprint: 0,
      bundleSize: 0,
      errorCount: 0,
      usageCount: 0,
      lastUsed: Date.now(),
      status: 'loading',
    };

    this.toolMetrics.set(toolId, metrics);

    // Start load time measurement
    (metrics as any).loadStartTime = performance.now();

    this.emit('tool:load:started', { toolId });
  }

  /**
   * Track tool load completion
   */
  public trackToolLoadComplete(toolId: string, bundleSize?: number): void {
    const metrics = this.toolMetrics.get(toolId);
    if (!metrics) return;

    if ((metrics as any).loadStartTime) {
      metrics.loadTime = performance.now() - (metrics as any).loadStartTime;
      (metrics as any).loadStartTime = undefined;
    }

    if (bundleSize) {
      metrics.bundleSize = bundleSize;
    }

    metrics.status = 'ready';
    metrics.lastUsed = Date.now();

    this.checkThresholds(metrics);
    this.emit('tool:load:completed', { toolId, metrics });
  }

  /**
   * Track tool render performance
   */
  public trackToolRender(toolId: string, renderTime?: number): void {
    const metrics = this.toolMetrics.get(toolId);
    if (!metrics) return;

    if (renderTime) {
      metrics.renderTime = renderTime;
    } else if ((metrics as any).renderStartTime) {
      metrics.renderTime = performance.now() - (metrics as any).renderStartTime;
      (metrics as any).renderStartTime = undefined;
    }

    metrics.status = 'ready';
    this.checkThresholds(metrics);
    this.emit('tool:render:completed', { toolId, metrics });
  }

  /**
   * Track tool execution
   */
  public trackToolExecution(toolId: string, executionTime: number, success = true): void {
    const metrics = this.toolMetrics.get(toolId);
    if (!metrics) return;

    metrics.executionTime = executionTime;
    metrics.usageCount++;
    metrics.lastUsed = Date.now();
    metrics.status = success ? 'ready' : 'error';

    if (!success) {
      metrics.errorCount++;
    }

    this.checkThresholds(metrics);
    this.emit('tool:execution:completed', { toolId, executionTime, success });
  }

  /**
   * Track tool interaction
   */
  public trackToolInteraction(toolId: string, interactionTime: number): void {
    const metrics = this.toolMetrics.get(toolId);
    if (!metrics) return;

    metrics.interactionTime = Math.max(metrics.interactionTime, interactionTime);
    metrics.lastUsed = Date.now();
    metrics.status = 'processing';

    setTimeout(() => {
      if (this.toolMetrics.has(toolId)) {
        this.toolMetrics.get(toolId)!.status = 'ready';
      }
    }, 100);

    this.emit('tool:interaction', { toolId, interactionTime });
  }

  /**
   * Get tool metrics
   */
  public getToolMetrics(toolId?: string): ToolPerformanceMetrics[] | ToolPerformanceMetrics | null {
    if (toolId) {
      return this.toolMetrics.get(toolId) || null;
    }
    return Array.from(this.toolMetrics.values());
  }

  /**
   * Get system metrics
   */
  public getSystemMetrics(): SystemMetrics {
    const tools = Array.from(this.toolMetrics.values());
    const totalMemoryUsage = this.getCurrentMemoryUsage();
    const availableMemory = this.getAvailableMemory();

    return {
      totalMemoryUsage,
      availableMemory,
      cpuUsage: this.getCPUUsage(),
      activeTools: tools.filter((t) => t.status !== 'idle').length,
      loadedTools: tools.filter((t) => t.status !== 'loading').length,
      errorRate: this.calculateErrorRate(tools),
      averageResponseTime: this.calculateAverageResponseTime(tools),
    };
  }

  /**
   * Get Web Vitals
   */
  public getWebVitals(): WebVitalsMetrics {
    return {
      fcp: this.getMetric('first-contentful-paint'),
      lcp: this.getMetric('largest-contentful-paint'),
      fid: this.getMetric('first-input'),
      cls: this.getMetric('cumulative-layout-shift'),
      ttfb: this.getMetric('time-to-first-byte'),
    };
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    return {
      timestamp: Date.now(),
      bundleMetrics: this.bundleAnalyzer?.getBundleMetrics?.() || {
        totalSize: 0,
        gzippedSize: 0,
        chunks: [],
        dependencies: [],
        unusedImports: [],
        optimizationSuggestions: [],
        lastAnalyzed: new Date(),
      },
      toolMetrics: this.getToolMetrics() as ToolPerformanceMetrics[],
      systemMetrics: this.getSystemMetrics(),
      webVitals: this.getWebVitals(),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Get alerts
   */
  public getAlerts(severity?: 'warning' | 'error' | 'critical'): PerformanceAlert[] {
    let alerts = this.alerts;
    if (severity) {
      alerts = alerts.filter((alert) => alert.severity === severity);
    }
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', { alertId });
      return true;
    }
    return false;
  }

  /**
   * Clear alerts
   */
  public clearAlerts(olderThan?: number): number {
    const cutoff = olderThan || Date.now();
    const initialCount = this.alerts.length;

    this.alerts = this.alerts.filter((alert) => alert.timestamp > cutoff && !alert.acknowledged);

    const clearedCount = initialCount - this.alerts.length;
    this.emit('alerts:cleared', { clearedCount });
    return clearedCount;
  }

  /**
   * Update thresholds
   */
  public updateThresholds(newThresholds: Partial<PerformanceThreshold>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };

    // Re-check existing metrics against new thresholds
    this.toolMetrics.forEach((metrics) => {
      this.checkThresholds(metrics);
    });

    this.emit('thresholds:updated', { thresholds: this.thresholds });
  }

  /**
   * Get performance trends
   */
  public getTrends(_timeRange = 3600000): {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    errorRate: number;
    responseTime: number;
  } {
    // This would require historical data storage
    // For now, return current values as trends
    const tools = Array.from(this.toolMetrics.values());

    return {
      loadTime: this.calculateAverage(tools.map((t) => t.loadTime)),
      renderTime: this.calculateAverage(tools.map((t) => t.renderTime)),
      memoryUsage: this.getCurrentMemoryUsage(),
      errorRate: this.calculateErrorRate(tools),
      responseTime: this.calculateAverageResponseTime(tools),
    };
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.emit('navigation', {
            type: 'navigation',
            timestamp: navEntry.fetchStart,
            metrics: {
              domContentLoaded:
                navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              ttfb: navEntry.responseStart - navEntry.requestStart,
            },
          });
        }
      });
    });

    // Observe paint timing
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'paint') {
          this.emit('paint', {
            type: 'paint',
            name: entry.name,
            timestamp: entry.startTime,
          });
        }
      });
    });

    // Observe largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.emit('lcp', {
        type: 'lcp',
        timestamp: lastEntry.startTime,
        element: (lastEntry as any).element,
      });
    });

    // Observe first input
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          this.emit('fid', {
            type: 'fid',
            timestamp: fidEntry.startTime,
            delay: fidEntry.processingStart - fidEntry.startTime,
          });
        }
      });
    });

    // Observe layout shift
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const layoutEntry = entry as any;
        if (!layoutEntry.hadRecentInput) {
          this.emit('layout-shift', {
            type: 'layout-shift',
            timestamp: entry.startTime,
            value: layoutEntry.value,
          });
        }
      });
    });

    // Start observers
    try {
      navigationObserver.observe({ entryTypes: ['navigation'] });
      paintObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      this.observers.push(navigationObserver, paintObserver, lcpObserver, fidObserver, clsObserver);
    } catch (error) {
      console.warn('Failed to setup performance observers:', error);
    }
  }

  private cleanupPerformanceObservers(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 5 seconds
    this.monitoringInterval = setInterval(() => {
      const systemMetrics = this.getSystemMetrics();
      this.emit('system:metrics', systemMetrics);

      // Check for memory issues
      if (systemMetrics.totalMemoryUsage > this.thresholds.maxMemoryUsage) {
        this.createAlert(
          'memory',
          'critical',
          `Memory usage (${this.formatBytes(systemMetrics.totalMemoryUsage)}) exceeds threshold (${this.formatBytes(this.thresholds.maxMemoryUsage)})`,
          { memoryUsage: systemMetrics.totalMemoryUsage }
        );
      }

      // Check error rate
      if (systemMetrics.errorRate > this.thresholds.maxErrorRate) {
        this.createAlert(
          'error_rate',
          'error',
          `Error rate (${systemMetrics.errorRate}%) exceeds threshold (${this.thresholds.maxErrorRate}%)`,
          { errorRate: systemMetrics.errorRate }
        );
      }
    }, 5000);
  }

  private checkThresholds(metrics: ToolPerformanceMetrics): void {
    // Check bundle size
    if (metrics.bundleSize > this.thresholds.maxBundleSize) {
      this.createAlert(
        'bundle_size',
        'warning',
        `Tool ${metrics.toolId} bundle size (${this.formatBytes(metrics.bundleSize)}) exceeds threshold (${this.formatBytes(this.thresholds.maxBundleSize)})`,
        { toolId: metrics.toolId, bundleSize: metrics.bundleSize }
      );
    }

    // Check load time
    if (metrics.loadTime > this.thresholds.maxLoadTime) {
      this.createAlert(
        'load_time',
        'warning',
        `Tool ${metrics.toolId} load time (${metrics.loadTime}ms) exceeds threshold (${this.thresholds.maxLoadTime}ms)`,
        { toolId: metrics.toolId, loadTime: metrics.loadTime }
      );
    }

    // Check render time
    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      this.createAlert(
        'render_time',
        'warning',
        `Tool ${metrics.toolId} render time (${metrics.renderTime}ms) exceeds threshold (${this.thresholds.maxRenderTime}ms)`,
        { toolId: metrics.toolId, renderTime: metrics.renderTime }
      );
    }

    // Check execution time
    if (metrics.executionTime && metrics.executionTime > this.thresholds.maxExecutionTime) {
      this.createAlert(
        'execution_time',
        'error',
        `Tool ${metrics.toolId} execution time (${metrics.executionTime}ms) exceeds threshold (${this.thresholds.maxExecutionTime}ms)`,
        { toolId: metrics.toolId, executionTime: metrics.executionTime }
      );
    }
  }

  private createAlert(
    type: string,
    severity: PerformanceAlert['severity'],
    message: string,
    metrics?: Record<string, number | string>
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      metrics,
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    this.emit('alert:created', alert);
  }

  private generateRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    const tools = Array.from(this.toolMetrics.values());
    const systemMetrics = this.getSystemMetrics();

    // Bundle size recommendations
    const largeBundles = tools.filter((t) => t.bundleSize > this.thresholds.maxBundleSize);
    if (largeBundles.length > 0) {
      recommendations.push({
        type: 'bundle',
        severity: 'medium',
        title: 'Large Tool Bundles Detected',
        description: `${largeBundles.length} tools exceed the ${this.formatBytes(this.thresholds.maxBundleSize)} bundle size limit`,
        action: 'Consider code splitting, tree shaking, or lazy loading for these tools',
        metrics: largeBundles.map((t) => `${t.toolId}: ${this.formatBytes(t.bundleSize)}`),
      });
    }

    // Memory usage recommendations
    if (systemMetrics.totalMemoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        title: 'High Memory Usage',
        description: `Memory usage (${this.formatBytes(systemMetrics.totalMemoryUsage)}) is approaching the limit`,
        action: 'Implement memory cleanup, optimize data structures, or unload unused tools',
      });
    }

    // Performance recommendations
    const slowTools = tools.filter((t) => t.loadTime > this.thresholds.maxLoadTime);
    if (slowTools.length > 0) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        title: 'Slow Loading Tools',
        description: `${slowTools.length} tools have load times exceeding ${this.thresholds.maxLoadTime}ms`,
        action: 'Optimize initialization, implement progressive loading, or reduce dependencies',
        metrics: slowTools.map((t) => `${t.toolId}: ${t.loadTime}ms`),
      });
    }

    // Error rate recommendations
    if (systemMetrics.errorRate > this.thresholds.maxErrorRate) {
      recommendations.push({
        type: 'error',
        severity: 'high',
        title: 'High Error Rate',
        description: `Error rate (${systemMetrics.errorRate}%) exceeds the ${this.thresholds.maxErrorRate}% threshold`,
        action: 'Review error logs, improve error handling, and add input validation',
      });
    }

    return recommendations;
  }

  // Utility methods
  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private getAvailableMemory(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.totalJSHeapSize - memory.usedJSHeapSize;
    }
    return 0;
  }

  private getCPUUsage(): number {
    // Simplified CPU usage calculation
    return 0; // Would need more complex implementation
  }

  private calculateErrorRate(tools: ToolPerformanceMetrics[]): number {
    if (tools.length === 0) return 0;

    const totalExecutions = tools.reduce((sum, tool) => sum + tool.usageCount, 0);
    const totalErrors = tools.reduce((sum, tool) => sum + tool.errorCount, 0);

    return totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0;
  }

  private calculateAverageResponseTime(tools: ToolPerformanceMetrics[]): number {
    const responseTimes = tools.filter((t) => t.interactionTime > 0).map((t) => t.interactionTime);

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private getMetric(name: string): number | undefined {
    const entries = performance.getEntriesByName(name);
    return entries.length > 0 ? entries[entries.length - 1].startTime : undefined;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Event handling
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in performance monitor event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.stopMonitoring();
    this.toolMetrics.clear();
    this.alerts = [];
    this.eventListeners.clear();
    this.emit('monitoring:disposed');
  }
}

export default PerformanceMonitor;
