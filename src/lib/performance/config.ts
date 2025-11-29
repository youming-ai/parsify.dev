/**
 * Performance Configuration
 * Defines performance thresholds and limits for the platform
 */

export interface PerformanceThresholds {
  // Bundle size limits (in bytes)
  maxToolBundleSize: number; // 200KB per tool
  maxTotalBundleSize: number; // 2MB total platform
  maxWasmModuleSize: number; // 30MB per WASM module

  // Loading performance thresholds (in milliseconds)
  maxToolLoadTime: number; // 3 seconds max tool load time
  maxInitialLoadTime: number; // 2 seconds initial page load
  maxInteractionTime: number; // 100ms max interaction response

  // Memory limits (in bytes)
  maxMemoryUsage: number; // 100MB total memory limit
  maxToolMemoryUsage: number; // 50MB per tool max
  memoryWarningThreshold: number; // 80MB warning threshold

  // Execution limits
  maxExecutionTime: number; // 5 seconds code execution timeout
  maxImageProcessingTime: number; // 3 seconds for 10MB images

  // Web Vitals thresholds
  webVitals: {
    fcp: number; // First Contentful Paint: 1.8s
    lcp: number; // Largest Contentful Paint: 2.5s
    fid: number; // First Input Delay: 100ms
    cls: number; // Cumulative Layout Shift: 0.1
    ttfb: number; // Time to First Byte: 800ms
  };

  // Network performance
  networkTimeout: number; // 10 seconds network timeout
  maxConcurrentRequests: number; // 6 concurrent requests max

  // Performance monitoring frequency
  monitoringInterval: number; // 30 seconds between checks
  metricsRetentionDays: number; // 7 days retention for metrics
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  // Bundle size limits (200KB = 200 * 1024 = 204800 bytes)
  maxToolBundleSize: 204800, // 200KB per tool (constitutional requirement)
  maxTotalBundleSize: 2097152, // 2MB total platform (constitutional requirement)
  maxWasmModuleSize: 31457280, // 30MB per WASM module

  // Loading performance thresholds
  maxToolLoadTime: 3000, // 3 seconds max tool load time
  maxInitialLoadTime: 2000, // 2 seconds initial page load
  maxInteractionTime: 100, // 100ms max interaction response

  // Memory limits (100MB = 100 * 1024 * 1024 = 104857600 bytes)
  maxMemoryUsage: 104857600, // 100MB total memory limit
  maxToolMemoryUsage: 52428800, // 50MB per tool max
  memoryWarningThreshold: 83886080, // 80MB warning threshold

  // Execution limits
  maxExecutionTime: 5000, // 5 seconds code execution timeout
  maxImageProcessingTime: 3000, // 3 seconds for 10MB images

  // Web Vitals thresholds (Google Core Web Vitals thresholds)
  webVitals: {
    fcp: 1800, // First Contentful Paint: 1.8s (good threshold)
    lcp: 2500, // Largest Contentful Paint: 2.5s (good threshold)
    fid: 100, // First Input Delay: 100ms (good threshold)
    cls: 0.1, // Cumulative Layout Shift: 0.1 (good threshold)
    ttfb: 800, // Time to First Byte: 800ms (good threshold)
  },

  // Network performance
  networkTimeout: 10000, // 10 seconds network timeout
  maxConcurrentRequests: 6, // 6 concurrent requests max

  // Performance monitoring frequency
  monitoringInterval: 30000, // 30 seconds between checks
  metricsRetentionDays: 7, // 7 days retention for metrics
};

export interface PerformanceAlert {
  type: 'bundle_size' | 'load_time' | 'memory' | 'web_vitals' | 'execution_time';
  severity: 'warning' | 'error' | 'critical';
  toolId?: string;
  metric: string;
  actual: number;
  threshold: number;
  message: string;
  recommendation?: string;
}

export function checkBundleSize(toolId: string, bundleSize: number): PerformanceAlert | null {
  if (bundleSize > PERFORMANCE_THRESHOLDS.maxToolBundleSize) {
    return {
      type: 'bundle_size',
      severity: 'error',
      toolId,
      metric: 'bundleSize',
      actual: bundleSize,
      threshold: PERFORMANCE_THRESHOLDS.maxToolBundleSize,
      message: `Tool ${toolId} bundle size (${formatBytes(bundleSize)}) exceeds 200KB limit`,
      recommendation: 'Consider code splitting, tree shaking, or lazy loading',
    };
  }

  return null;
}

export function checkLoadTime(toolId: string, loadTime: number): PerformanceAlert | null {
  if (loadTime > PERFORMANCE_THRESHOLDS.maxToolLoadTime) {
    return {
      type: 'load_time',
      severity: 'warning',
      toolId,
      metric: 'loadTime',
      actual: loadTime,
      threshold: PERFORMANCE_THRESHOLDS.maxToolLoadTime,
      message: `Tool ${toolId} load time (${loadTime}ms) exceeds 3 second threshold`,
      recommendation: 'Optimize initialization or implement progressive loading',
    };
  }

  return null;
}

export function checkMemoryUsage(toolId: string, memoryUsage: number): PerformanceAlert | null {
  if (memoryUsage > PERFORMANCE_THRESHOLDS.maxToolMemoryUsage) {
    return {
      type: 'memory',
      severity: 'critical',
      toolId,
      metric: 'memoryUsage',
      actual: memoryUsage,
      threshold: PERFORMANCE_THRESHOLDS.maxToolMemoryUsage,
      message: `Tool ${toolId} memory usage (${formatBytes(memoryUsage)}) exceeds 50MB limit`,
      recommendation: 'Implement memory cleanup and reduce retained objects',
    };
  }

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function formatPerformanceAlert(alert: PerformanceAlert): string {
  const severityIcon =
    alert.severity === 'critical' ? '🔴' : alert.severity === 'error' ? '🟠' : '🟡';
  const toolInfo = alert.toolId ? ` (${alert.toolId})` : '';
  return `${severityIcon} ${alert.type.replace('_', ' ').toUpperCase()}${toolInfo}: ${alert.message}`;
}

// Performance optimization recommendations
export const OPTIMIZATION_RECOMMENDATIONS = {
  bundleSize: [
    'Implement dynamic imports for code splitting',
    'Use tree shaking to eliminate unused code',
    'Optimize images and assets',
    'Remove duplicate dependencies',
    'Use lazy loading for non-critical features',
  ],
  loadTime: [
    'Implement progressive loading',
    'Cache static resources',
    'Use CDN for static assets',
    'Implement service worker caching',
    'Optimize critical rendering path',
  ],
  memory: [
    'Implement proper cleanup in useEffect',
    'Avoid memory leaks in event listeners',
    'Use object pooling for frequently created objects',
    'Implement lazy loading for large datasets',
    'Clear unused references and caches',
  ],
  webVitals: [
    'Optimize Largest Contentful Paint by loading critical resources first',
    'Minimize Cumulative Layout Shift by reserving space for dynamic content',
    'Reduce First Input Delay by optimizing JavaScript execution',
    'Improve Time to First Byte with server optimizations',
  ],
};
