/**
 * Memory Manager for NLP Operations
 * Manages memory usage, cleanup, and optimization for ML models and processing
 */

import { NLPEvent, type NLPEventListener } from '../types';
import {
  type AlertSeverity,
  ResourceAlert,
  ResourceType,
  type SystemPerformanceMetrics,
} from '../types/infrastructure';

export interface MemoryConfig {
  maxMemoryUsage: number; // Maximum memory usage in MB
  warningThreshold: number; // Warning threshold as percentage (0-1)
  criticalThreshold: number; // Critical threshold as percentage (0-1)
  cleanupInterval: number; // Cleanup interval in ms
  enableMonitoring: boolean; // Enable memory monitoring
  enableAutoCleanup: boolean; // Enable automatic cleanup
  modelUnloadThreshold: number; // Threshold for unloading models (percentage)
}

export interface MemoryUsage {
  heap: {
    used: number;
    total: number;
    limit: number;
  };
  models: {
    loaded: number;
    cached: number;
    total: number;
  };
  buffers: {
    active: number;
    total: number;
  };
  temporary: {
    active: number;
    total: number;
  };
}

export interface MemoryCleanupTarget {
  type: 'model' | 'cache' | 'buffer' | 'temporary';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: () => Promise<number>; // Returns amount of memory freed in MB
  condition?: () => boolean; // Condition to trigger cleanup
}

export interface MemoryAlert {
  type: MemoryAlertType;
  severity: AlertSeverity;
  message: string;
  currentUsage: number;
  threshold: number;
  suggestions: string[];
  timestamp: Date;
}

export type MemoryAlertType =
  | 'high_usage'
  | 'critical_usage'
  | 'memory_leak'
  | 'model_overload'
  | 'buffer_overflow'
  | 'cleanup_failure';

export class MemoryManager {
  private config: MemoryConfig;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupTargets: MemoryCleanupTarget[] = [];
  private eventListeners: Map<string, NLPEventListener[]> = new Map();
  private memoryHistory: SystemPerformanceMetrics[] = [];
  private alertHistory: MemoryAlert[] = [];
  private lastCleanup = 0;
  private memoryBaseline = 0;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemoryUsage: 100, // 100MB
      warningThreshold: 0.7, // 70%
      criticalThreshold: 0.9, // 90%
      cleanupInterval: 30000, // 30 seconds
      enableMonitoring: true,
      enableAutoCleanup: true,
      modelUnloadThreshold: 0.8, // 80%
      ...config,
    };

    this.setupDefaultCleanupTargets();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.memoryBaseline = this.getCurrentMemoryUsage().heap.used;

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.performAutoCleanup();
      this.updateMemoryHistory();
    }, this.config.cleanupInterval);

    this.emitEvent('memory_monitoring_started', {
      maxMemory: this.config.maxMemoryUsage,
      warningThreshold: this.config.warningThreshold,
    });

    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emitEvent('memory_monitoring_stopped', {});
    console.log('Memory monitoring stopped');
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemoryUsage {
    const memory = this.getBrowserMemory();

    return {
      heap: {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      },
      models: {
        loaded: this.getLoadedModelCount(),
        cached: this.getCachedModelCount(),
        total: this.getTotalModelMemory(),
      },
      buffers: {
        active: this.getActiveBufferCount(),
        total: this.getTotalBufferMemory(),
      },
      temporary: {
        active: this.getTemporaryObjectCount(),
        total: this.getTemporaryObjectMemory(),
      },
    };
  }

  /**
   * Get memory usage as a percentage of the limit
   */
  getMemoryUsagePercentage(): number {
    const usage = this.getCurrentMemoryUsage();
    return (usage.heap.used / this.config.maxMemoryUsage) * 100;
  }

  /**
   * Check if memory usage is within limits
   */
  isMemoryUsageHealthy(): boolean {
    const percentage = this.getMemoryUsagePercentage();
    return percentage < this.config.warningThreshold * 100;
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    try {
      // Use the GC API if available (Chrome with --expose-gc)
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
        return true;
      }

      // Try to trigger GC through other means
      if (window && (window as any).gc) {
        (window as any).gc();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to force garbage collection:', error);
      return false;
    }
  }

  /**
   * Perform memory cleanup
   */
  async performCleanup(priority?: 'low' | 'medium' | 'high' | 'critical'): Promise<number> {
    const targets = this.cleanupTargets.filter(
      (target) =>
        !priority ||
        target.priority === priority ||
        (priority === 'high' && ['high', 'critical'].includes(target.priority)) ||
        (priority === 'medium' && ['medium', 'high', 'critical'].includes(target.priority))
    );

    let totalFreed = 0;

    for (const target of targets) {
      // Check if cleanup condition is met
      if (target.condition && !target.condition()) {
        continue;
      }

      try {
        const freed = await target.action();
        totalFreed += freed;

        console.log(`Memory cleanup freed ${freed}MB from ${target.description}`);
      } catch (error) {
        console.warn(`Failed to cleanup ${target.description}:`, error);
      }
    }

    this.lastCleanup = Date.now();

    // Force garbage collection after cleanup
    this.forceGarbageCollection();

    this.emitEvent('memory_cleanup_completed', {
      totalFreed,
      targetsExecuted: targets.length,
    });

    return totalFreed;
  }

  /**
   * Register a custom cleanup target
   */
  registerCleanupTarget(target: MemoryCleanupTarget): void {
    this.cleanupTargets.push(target);
  }

  /**
   * Remove a cleanup target
   */
  removeCleanupTarget(description: string): void {
    this.cleanupTargets = this.cleanupTargets.filter(
      (target) => target.description !== description
    );
  }

  /**
   * Get memory statistics
   */
  getMemoryStatistics(): {
    current: MemoryUsage;
    baseline: number;
    peak: number;
    average: number;
    alerts: MemoryAlert[];
    history: SystemPerformanceMetrics[];
    recommendations: string[];
  } {
    const current = this.getCurrentMemoryUsage();
    const peak = this.getPeakMemoryUsage();
    const average = this.getAverageMemoryUsage();

    return {
      current,
      baseline: this.memoryBaseline,
      peak,
      average,
      alerts: this.alertHistory.slice(-10), // Last 10 alerts
      history: this.memoryHistory.slice(-100), // Last 100 measurements
      recommendations: this.getMemoryRecommendations(current),
    };
  }

  /**
   * Get recent memory alerts
   */
  getMemoryAlerts(severity?: AlertSeverity, limit = 20): MemoryAlert[] {
    let filtered = this.alertHistory;

    if (severity) {
      filtered = filtered.filter((alert) => alert.severity === severity);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemoryUsage(): Promise<OptimizationResult> {
    const beforeUsage = this.getCurrentMemoryUsage();
    const startTime = Date.now();

    // Perform aggressive cleanup
    const _freedMemory = await this.performCleanup('medium');

    // Additional optimizations
    await this.optimizeBuffers();
    await this.optimizeTemporaryObjects();

    const afterUsage = this.getCurrentMemoryUsage();
    const actualFreed = beforeUsage.heap.used - afterUsage.heap.used;

    const result: OptimizationResult = {
      beforeUsage,
      afterUsage,
      freedMemory: actualFreed,
      timeSpent: Date.now() - startTime,
      success: actualFreed > 0,
      recommendations: this.getMemoryRecommendations(afterUsage),
    };

    this.emitEvent('memory_optimization_completed', result);

    return result;
  }

  /**
   * Set memory limits
   */
  setMemoryLimits(maxMemory: number, warningThreshold?: number, criticalThreshold?: number): void {
    this.config.maxMemoryUsage = maxMemory;
    if (warningThreshold !== undefined) {
      this.config.warningThreshold = warningThreshold;
    }
    if (criticalThreshold !== undefined) {
      this.config.criticalThreshold = criticalThreshold;
    }

    this.emitEvent('memory_limits_updated', {
      maxMemory,
      warningThreshold,
      criticalThreshold,
    });
  }

  /**
   * Estimate memory requirements for an operation
   */
  estimateMemoryRequirement(operation: string, inputSize: number): MemoryEstimate {
    const estimates: Record<
      string,
      {
        baseMemory: number;
        perCharacter: number;
        modelMemory: number;
        bufferMemory: number;
      }
    > = {
      sentiment_analysis: {
        baseMemory: 20,
        perCharacter: 0.001,
        modelMemory: 15,
        bufferMemory: 5,
      },
      entity_extraction: {
        baseMemory: 25,
        perCharacter: 0.002,
        modelMemory: 20,
        bufferMemory: 8,
      },
      text_summarization: {
        baseMemory: 30,
        perCharacter: 0.003,
        modelMemory: 25,
        bufferMemory: 10,
      },
      translation: {
        baseMemory: 40,
        perCharacter: 0.004,
        modelMemory: 35,
        bufferMemory: 15,
      },
      text_generation: {
        baseMemory: 35,
        perCharacter: 0.005,
        modelMemory: 30,
        bufferMemory: 12,
      },
    };

    const estimate = estimates[operation] || estimates.sentiment_analysis;

    return {
      totalMemory:
        estimate.baseMemory +
        inputSize * estimate.perCharacter +
        estimate.modelMemory +
        estimate.bufferMemory,
      breakdown: estimate,
      confidence: 0.8,
    };
  }

  /**
   * Check if there's enough memory for an operation
   */
  hasEnoughMemory(operation: string, inputSize: number): boolean {
    const estimate = this.estimateMemoryRequirement(operation, inputSize);
    const currentUsage = this.getCurrentMemoryUsage();
    const projectedUsage = currentUsage.heap.used + estimate.totalMemory;

    return projectedUsage <= this.config.maxMemoryUsage;
  }

  /**
   * Event handling
   */
  on(event: string, listener: NLPEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  off(event: string, listener: NLPEventListener): void {
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
  private setupDefaultCleanupTargets(): void {
    // Model cleanup
    this.cleanupTargets.push({
      type: 'model',
      priority: 'medium',
      description: 'Unload least recently used models',
      condition: () => this.getMemoryUsagePercentage() > this.config.modelUnloadThreshold * 100,
      action: async () => {
        return this.unloadLeastRecentlyUsedModels();
      },
    });

    // Cache cleanup
    this.cleanupTargets.push({
      type: 'cache',
      priority: 'low',
      description: 'Clear expired cache entries',
      action: async () => {
        return this.clearExpiredCache();
      },
    });

    // Buffer cleanup
    this.cleanupTargets.push({
      type: 'buffer',
      priority: 'medium',
      description: 'Release unused buffers',
      action: async () => {
        return this.releaseUnusedBuffers();
      },
    });

    // Temporary object cleanup
    this.cleanupTargets.push({
      type: 'temporary',
      priority: 'high',
      description: 'Clear temporary objects',
      action: async () => {
        return this.clearTemporaryObjects();
      },
    });
  }

  private checkMemoryUsage(): void {
    const usage = this.getCurrentMemoryUsage();
    const percentage = this.getMemoryUsagePercentage();

    // Check for critical threshold
    if (percentage >= this.config.criticalThreshold * 100) {
      this.createMemoryAlert('critical_usage', 'critical', percentage);
    }
    // Check for warning threshold
    else if (percentage >= this.config.warningThreshold * 100) {
      this.createMemoryAlert('high_usage', 'warning', percentage);
    }

    // Check for memory leaks (steadily increasing usage)
    this.checkForMemoryLeaks(usage);
  }

  private createMemoryAlert(
    type: MemoryAlertType,
    severity: AlertSeverity,
    percentage: number
  ): void {
    const alert: MemoryAlert = {
      type,
      severity,
      message: `Memory usage at ${percentage.toFixed(1)}% (${this.getCurrentMemoryUsage().heap.used}MB)`,
      currentUsage: percentage,
      threshold:
        severity === 'critical'
          ? this.config.criticalThreshold * 100
          : this.config.warningThreshold * 100,
      suggestions: this.getAlertSuggestions(type),
      timestamp: new Date(),
    };

    this.alertHistory.push(alert);
    this.emitEvent('memory_alert', alert);

    // Trigger auto-cleanup for critical alerts
    if (severity === 'critical') {
      this.performAutoCleanup();
    }
  }

  private getAlertSuggestions(type: MemoryAlertType): string[] {
    const suggestions: Record<MemoryAlertType, string[]> = {
      high_usage: [
        'Consider unloading unused models',
        'Clear temporary cache data',
        'Reduce input text size',
        'Enable memory optimization',
      ],
      critical_usage: [
        'Immediate cleanup required',
        'Unload all non-essential models',
        'Clear all caches',
        'Reduce processing load',
      ],
      memory_leak: [
        'Check for unreleased resources',
        'Review object lifecycle',
        'Profile memory usage patterns',
        'Consider application restart',
      ],
      model_overload: [
        'Unload least recently used models',
        'Implement model caching limits',
        'Use model quantization',
        'Consider smaller model alternatives',
      ],
      buffer_overflow: [
        'Release unused buffers',
        'Implement buffer pooling',
        'Reduce buffer sizes',
        'Use streaming for large data',
      ],
      cleanup_failure: [
        'Check cleanup target conditions',
        'Verify cleanup permissions',
        'Review cleanup logic',
        'Consider manual cleanup',
      ],
    };

    return suggestions[type] || suggestions.high_usage;
  }

  private checkForMemoryLeaks(_currentUsage: MemoryUsage): void {
    if (this.memoryHistory.length < 10) return;

    const recent = this.memoryHistory.slice(-10);
    const trending = recent.every((metric, index) => {
      if (index === 0) return true;
      return metric.memoryUsage.used > recent[index - 1].memoryUsage.used;
    });

    if (trending && recent[recent.length - 1].memoryUsage.used > recent[0].memoryUsage.used * 1.5) {
      this.createMemoryAlert('memory_leak', 'warning', this.getMemoryUsagePercentage());
    }
  }

  private performAutoCleanup(): void {
    if (!this.config.enableAutoCleanup) return;

    const percentage = this.getMemoryUsagePercentage();

    if (percentage >= this.config.criticalThreshold * 100) {
      this.performCleanup('critical');
    } else if (percentage >= this.config.warningThreshold * 100) {
      this.performCleanup('high');
    }
  }

  private updateMemoryHistory(): void {
    const currentUsage = this.getCurrentMemoryUsage();
    const metrics: SystemPerformanceMetrics = {
      timestamp: new Date(),
      operation: 'memory_monitoring',
      tool: 'memory_manager',
      duration: 0,
      memoryUsage: {
        used: currentUsage.heap.used,
        total: currentUsage.heap.total,
        percentage: this.getMemoryUsagePercentage(),
        heapUsed: currentUsage.heap.used,
        heapTotal: currentUsage.heap.total,
        external: currentUsage.buffers.total + currentUsage.temporary.total,
        modelCache: currentUsage.models.cached,
      },
      cpuUsage: 0,
    };

    this.memoryHistory.push(metrics);

    // Keep only last 1000 entries
    if (this.memoryHistory.length > 1000) {
      this.memoryHistory = this.memoryHistory.slice(-1000);
    }
  }

  private getMemoryRecommendations(usage: MemoryUsage): string[] {
    const recommendations: string[] = [];
    const percentage = this.getMemoryUsagePercentage();

    if (percentage > 80) {
      recommendations.push('High memory usage detected - consider immediate cleanup');
    }

    if (usage.models.loaded > 5) {
      recommendations.push('Many models loaded - consider unloading unused models');
    }

    if (usage.buffers.total > 20) {
      recommendations.push('Large buffer usage - consider buffer pooling');
    }

    if (usage.temporary.active > 100) {
      recommendations.push('Many temporary objects - consider object pooling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage is within normal limits');
    }

    return recommendations;
  }

  private async optimizeBuffers(): Promise<number> {
    // Implementation for buffer optimization
    return 0;
  }

  private async optimizeTemporaryObjects(): Promise<number> {
    // Implementation for temporary object optimization
    return 0;
  }

  private getPeakMemoryUsage(): number {
    return Math.max(...this.memoryHistory.map((h) => h.memoryUsage.used), 0);
  }

  private getAverageMemoryUsage(): number {
    if (this.memoryHistory.length === 0) return 0;
    const sum = this.memoryHistory.reduce((acc, h) => acc + h.memoryUsage.used, 0);
    return sum / this.memoryHistory.length;
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener({
          type: event as any,
          timestamp: new Date(),
          data,
        });
      } catch (error) {
        console.error(`Error in memory event listener for ${event}:`, error);
      }
    });
  }

  // Browser-specific memory utilities
  private getBrowserMemory() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory;
    }

    // Fallback values for environments without memory API
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  // Placeholder methods for actual implementation
  private getLoadedModelCount(): number {
    return 0;
  }
  private getCachedModelCount(): number {
    return 0;
  }
  private getTotalModelMemory(): number {
    return 0;
  }
  private getActiveBufferCount(): number {
    return 0;
  }
  private getTotalBufferMemory(): number {
    return 0;
  }
  private getTemporaryObjectCount(): number {
    return 0;
  }
  private getTemporaryObjectMemory(): number {
    return 0;
  }

  private async unloadLeastRecentlyUsedModels(): Promise<number> {
    // Implementation for unloading models
    return 0;
  }

  private async clearExpiredCache(): Promise<number> {
    // Implementation for cache cleanup
    return 0;
  }

  private async releaseUnusedBuffers(): Promise<number> {
    // Implementation for buffer cleanup
    return 0;
  }

  private async clearTemporaryObjects(): Promise<number> {
    // Implementation for temporary object cleanup
    return 0;
  }
}

// Supporting interfaces
export interface MemoryEstimate {
  totalMemory: number;
  breakdown: {
    baseMemory: number;
    perCharacter: number;
    modelMemory: number;
    bufferMemory: number;
  };
  confidence: number;
}

export interface OptimizationResult {
  beforeUsage: MemoryUsage;
  afterUsage: MemoryUsage;
  freedMemory: number;
  timeSpent: number;
  success: boolean;
  recommendations: string[];
}

// Singleton instance
export const memoryManager = new MemoryManager();
