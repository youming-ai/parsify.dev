/**
 * Lazy Loading System - T152 Implementation
 * Comprehensive lazy loading system for optimizing component performance
 * Integration guide and exports for easy adoption
 */

// Core Components
export { LazyLoadingProvider, useLazyLoading, withLazyLoading, useIntersectionObserver } from './lazy-loading-provider';

// UI Components
export * from './loading-skeletons';
export { LazyErrorBoundary, useLazyErrorBoundary, withLazyErrorBoundary } from './lazy-error-boundary';

// Preloading Strategies
export {
  PreloadingManager,
  useIntersectionPrediction,
  useNetworkAwarePreloading,
  useUserBehaviorAnalysis,
  defaultPreloadStrategies,
  type PreloadStrategy,
  type PreloadCondition,
  type PreloadTrigger,
  type PreloadQueue,
  type PreloadMetrics
} from './preloading-strategies';

// Bundle Analysis
export {
  BundleAnalyzer,
  BundleOptimizationUtils,
  type BundleMetrics,
  type ChunkAnalysis,
  type OptimizationSuggestion,
  type BundleBudget
} from './bundle-analyzer';

// Monitoring Integration
export {
  useLazyLoadingMonitoring,
  LazyLoadingPerformanceDashboard,
  LazyLoadingRealTimeMonitor,
  type LazyLoadingMetrics,
  type PerformanceThresholds
} from './monitoring-integration';

// Enhanced Components
export {
  LazyMonacoEditor,
  OptimizedCodeEditor,
  HighPriorityCodeEditor,
  LowPriorityCodeEditor,
  useMonacoPreload,
  createLazyEditor,
  LazyJavaScriptEditor,
  LazyTypeScriptEditor,
  LazyJSONEditor,
  LazyPythonEditor,
  LazyHTMLEditor,
  LazyCSSEditor,
  LazySQLEditor,
  LazyMarkdownEditor
} from '../code/lazy-monaco-editor';

export {
  LazyOCRTool,
  useOCRPreload,
  withLazyOCR
} from '../file/lazy-ocr-tool';

// Integration utilities
export class LazyLoadingIntegration {
  private static instance: LazyLoadingIntegration;
  private initialized = false;

  private constructor() {}

  public static getInstance(): LazyLoadingIntegration {
    if (!LazyLoadingIntegration.instance) {
      LazyLoadingIntegration.instance = new LazyLoadingIntegration();
    }
    return LazyLoadingIntegration.instance;
  }

  // Initialize the lazy loading system
  public initialize(config?: {
    enablePreloading?: boolean;
    enableMonitoring?: boolean;
    preloadThreshold?: number;
    bundleBudget?: number;
    networkAwarePreloading?: boolean;
  }): void {
    if (this.initialized) {
      console.warn('Lazy loading system already initialized');
      return;
    }

    console.log('🚀 Initializing Lazy Loading System...');

    // Set up default configuration
    const defaultConfig = {
      enablePreloading: true,
      enableMonitoring: true,
      preloadThreshold: 200,
      bundleBudget: 500 * 1024, // 500KB
      networkAwarePreloading: true,
      ...config,
    };

    // Initialize monitoring if enabled
    if (defaultConfig.enableMonitoring) {
      this.initializeMonitoring();
    }

    // Initialize preloading if enabled
    if (defaultConfig.enablePreloading) {
      this.initializePreloading(defaultConfig);
    }

    this.initialized = true;
    console.log('✅ Lazy Loading System initialized successfully');
  }

  private initializeMonitoring(): void {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      // Set up performance observers
      this.setupPerformanceObservers();

      // Initialize bundle monitoring
      bundleMonitoringSystem.initialize().catch(console.error);
    }
  }

  private initializePreloading(config: any): void {
    // Initialize preloading strategies
    if (config.networkAwarePreloading) {
      this.setupNetworkAwarePreloading();
    }

    // Start preloading critical components
    this.preloadCriticalComponents();
  }

  private setupPerformanceObservers(): void {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            console.debug('Resource loaded:', {
              name: entry.name,
              duration: entry.duration,
              size: (entry as any).transferSize,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private setupNetworkAwarePreloading(): void {
    // Set up network condition monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection as NetworkInformation;

      connection.addEventListener('change', () => {
        console.debug('Network condition changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      });
    }
  }

  private preloadCriticalComponents(): void {
    // Preload components based on user behavior patterns
    console.debug('Preloading critical components...');

    // This would be implemented based on your specific components
    // For example:
    // - Preload Monaco Editor if user has previously used code tools
    // - Preload OCR components if user has uploaded images
    // - Preload chart libraries if dashboard is frequently accessed
  }

  // Get system status
  public getStatus(): {
    initialized: boolean;
    monitoring: boolean;
    preloading: boolean;
    metrics: any;
  } {
    return {
      initialized: this.initialized,
      monitoring: true, // This would be tracked dynamically
      preloading: true, // This would be tracked dynamically
      metrics: {}, // This would contain current metrics
    };
  }

  // Get optimization suggestions
  public getOptimizationSuggestions(): Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    implementation: string[];
  }> {
    return [
      {
        type: 'component-splitting',
        priority: 'high',
        description: 'Split large components into smaller, focused chunks',
        implementation: [
          'Use dynamic imports for component separation',
          'Implement route-based code splitting',
          'Create shared component libraries',
        ],
      },
      {
        type: 'preloading-strategy',
        priority: 'medium',
        description: 'Implement intelligent preloading based on user behavior',
        implementation: [
          'Set up intersection observers for viewport prediction',
          'Monitor user interaction patterns',
          'Configure network-aware preloading',
        ],
      },
      {
        type: 'monitoring-setup',
        priority: 'high',
        description: 'Set up comprehensive monitoring and alerting',
        implementation: [
          'Configure performance monitoring',
          'Set up bundle size alerts',
          'Implement user experience tracking',
        ],
      },
    ];
  }
}

// Export singleton instance
export const lazyLoadingIntegration = LazyLoadingIntegration.getInstance();

// Convenience function for initialization
export const initializeLazyLoading = (config?: any): void => {
  lazyLoadingIntegration.initialize(config);
};

// Component wrapper for easy migration
export function makeLazy<T extends React.ComponentType<any>>(
  component: T,
  options?: {
    fallback?: React.ReactNode;
    preload?: boolean;
    priority?: 'high' | 'normal' | 'low';
    errorBoundary?: boolean;
  }
): T {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: component }));

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    if (options?.errorBoundary !== false) {
      return (
        <LazyErrorBoundary
          componentId={component.displayName || component.name || 'unknown'}
          maxRetries={3}
          showStackTrace={process.env.NODE_ENV === 'development'}
        >
          <React.Suspense fallback={options?.fallback || <div>Loading...</div>}>
            <LazyComponent {...props} ref={ref} />
          </React.Suspense>
        </LazyErrorBoundary>
      );
    }

    return (
      <React.Suspense fallback={options?.fallback || <div>Loading...</div>}>
        <LazyComponent {...props} ref={ref} />
      </React.Suspense>
    );
  }) as T;
}

// Hook for migrating existing components
export function useLazyMigration() {
  const { state, updateConfig } = useLazyLoading();

  const migrateComponent = useCallback((
    componentId: string,
    loadFn: () => Promise<any>,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      preload?: boolean;
      fallback?: React.ReactNode;
    }
  ) => {
    console.log(`🔄 Migrating component ${componentId} to lazy loading...`);

    // This would handle the migration logic
    // For example:
    // - Track the original component size
    // - Set up lazy loading with the specified options
    // - Monitor performance improvements
    // - Generate migration report
  }, []);

  const generateMigrationReport = useCallback(() => {
    return {
      migratedComponents: state.loadedComponents.size,
      totalSavings: state.totalSavings,
      averageLoadTime: state.metrics.averageLoadTime,
      optimizationOpportunities: lazyLoadingIntegration.getOptimizationSuggestions(),
    };
  }, [state]);

  return {
    migrateComponent,
    generateMigrationReport,
    updateConfig,
  };
}

// Export all types for external use
export type {
  LazyLoadingConfig,
  LazyLoadOptions,
  LazyLoadingState,
  ErrorSeverity,
  ErrorDetails,
} from './lazy-loading-provider';

export type {
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState,
} from './lazy-error-boundary';

// Default export
export default {
  // Core
  LazyLoadingProvider,
  useLazyLoading,
  withLazyLoading,

  // Enhanced Components
  LazyMonacoEditor,
  LazyOCRTool,

  // Preloading
  PreloadingManager,
  defaultPreloadStrategies,

  // Analysis & Monitoring
  BundleAnalyzer,
  LazyLoadingPerformanceDashboard,

  // Integration
  LazyLoadingIntegration,
  initializeLazyLoading,
  makeLazy,
  useLazyMigration,
};
