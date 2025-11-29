/**
 * Bundle Analyzer
 * Monitors and analyzes bundle sizes, loading performance, and tool metrics
 */

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  toolSizes: Record<string, number>;
  loadingTimes: Record<string, number>;
  memoryUsage: number;
}

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface ToolPerformanceMetrics {
  toolId: string;
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryFootprint: number;
  bundleSize: number;
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private metrics: BundleMetrics;
  private performanceMetrics: PerformanceMetrics;
  private toolMetrics: Map<string, ToolPerformanceMetrics>;
  private observer: PerformanceObserver | null;

  private constructor() {
    this.metrics = {
      totalSize: 0,
      gzippedSize: 0,
      toolSizes: {},
      loadingTimes: {},
      memoryUsage: 0,
    };

    this.performanceMetrics = {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
    };

    this.toolMetrics = new Map();
    this.observer = null;
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              this.performanceMetrics.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              this.performanceMetrics.lcp = entry.startTime;
            }
          }
          if (entry.entryType === 'navigation') {
            this.performanceMetrics.ttfb = entry.startTime;
          }
        });
      });

      this.observer.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'navigation'] as any,
      });
    } catch (_error) {
      this.observer = null;
    }
  }

  public static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  /**
   * Track tool bundle size
   */
  public trackToolBundleSize(toolId: string, size: number): void {
    this.metrics.toolSizes[toolId] = size;
    this.metrics.totalSize += size;
  }

  /**
   * Track tool loading time
   */
  public trackToolLoadTime(toolId: string, loadTime: number): void {
    this.metrics.loadingTimes[toolId] = loadTime;
  }

  /**
   * Track tool performance metrics
   */
  public trackToolPerformance(metrics: ToolPerformanceMetrics): void {
    this.toolMetrics.set(metrics.toolId, metrics);
  }

  /**
   * Measure memory usage
   */
  public measureMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get current bundle metrics
   */
  public getBundleMetrics(): BundleMetrics {
    this.measureMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Get core web vitals
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get tool-specific metrics
   */
  public getToolMetrics(toolId?: string): ToolPerformanceMetrics[] | ToolPerformanceMetrics | null {
    if (toolId) {
      return this.toolMetrics.get(toolId) || null;
    }
    return Array.from(this.toolMetrics.values());
  }

  /**
   * Analyze bundle and return recommendations
   */
  public analyzeBundle(): {
    recommendations: string[];
    criticalIssues: string[];
    warnings: string[];
  } {
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    // Check total bundle size
    if (this.metrics.totalSize > 2 * 1024 * 1024) {
      // > 2MB
      criticalIssues.push(
        `Total bundle size (${this.formatBytes(this.metrics.totalSize)}) exceeds 2MB limit`
      );
    } else if (this.metrics.totalSize > 1024 * 1024) {
      // > 1MB
      warnings.push(`Total bundle size (${this.formatBytes(this.metrics.totalSize)}) is large`);
    }

    // Check individual tool sizes
    Object.entries(this.metrics.toolSizes).forEach(([toolId, size]) => {
      if (size > 200 * 1024) {
        // > 200KB
        criticalIssues.push(
          `Tool ${toolId} bundle size (${this.formatBytes(size)}) exceeds 200KB limit`
        );
      } else if (size > 100 * 1024) {
        // > 100KB
        warnings.push(`Tool ${toolId} bundle size (${this.formatBytes(size)}) is large`);
      }
    });

    // Check loading times
    Object.entries(this.metrics.loadingTimes).forEach(([toolId, loadTime]) => {
      if (loadTime > 3000) {
        // > 3 seconds
        criticalIssues.push(`Tool ${toolId} load time (${loadTime}ms) exceeds 3 seconds`);
      } else if (loadTime > 1000) {
        // > 1 second
        warnings.push(`Tool ${toolId} load time (${loadTime}ms) is slow`);
      }
    });

    // Check performance metrics
    if (this.performanceMetrics.fcp > 2000) {
      warnings.push(`First Contentful Paint (${this.performanceMetrics.fcp}ms) is slow`);
    }

    if (this.performanceMetrics.lcp > 2500) {
      warnings.push(`Largest Contentful Paint (${this.performanceMetrics.lcp}ms) is slow`);
    }

    if (this.performanceMetrics.fid > 100) {
      warnings.push(`First Input Delay (${this.performanceMetrics.fid}ms) is high`);
    }

    if (this.performanceMetrics.cls > 0.1) {
      criticalIssues.push(`Cumulative Layout Shift (${this.performanceMetrics.cls}) is high`);
    }

    // Generate recommendations
    if (criticalIssues.length > 0 || warnings.length > 0) {
      recommendations.push('Consider implementing code splitting for large tools');
      recommendations.push('Optimize images and assets to reduce bundle size');
      recommendations.push('Implement lazy loading for non-critical tools');
      recommendations.push('Use compression and minification for production builds');
    }

    return {
      recommendations,
      criticalIssues,
      warnings,
    };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): {
    bundle: BundleMetrics;
    performance: PerformanceMetrics;
    tools: ToolPerformanceMetrics[];
    analysis: ReturnType<BundleAnalyzer['analyzeBundle']>;
  } {
    return {
      bundle: this.getBundleMetrics(),
      performance: this.getPerformanceMetrics(),
      tools: this.getToolMetrics() as ToolPerformanceMetrics[],
      analysis: this.analyzeBundle(),
    };
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.metrics = {
      totalSize: 0,
      gzippedSize: 0,
      toolSizes: {},
      loadingTimes: {},
      memoryUsage: 0,
    };

    this.performanceMetrics = {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
    };

    this.toolMetrics.clear();
  }

  /**
   * Cleanup performance observer
   */
  public dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
