/**
 * Lazy Loading Provider - T152 Implementation
 * Comprehensive lazy loading system for heavy components with monitoring
 * Provides utilities, HOCs, and integration with existing monitoring systems
 */

'use client';

import React, { Suspense, createContext, useContext, ReactNode, ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { bundleMonitoringSystem } from '@/monitoring';
import { performanceObserver } from '@/monitoring/performance-observer';

// Types for lazy loading
export interface LazyLoadingConfig {
  enabled: boolean;
  preloadThreshold: number; // pixels before element comes into view
  loadingTimeout: number; // ms before showing timeout state
  retryAttempts: number;
  retryDelay: number; // ms between retries
  enablePreloading: boolean;
  enableMonitoring: boolean;
  fallbackStrategy: 'skeleton' | 'spinner' | 'placeholder' | 'custom';
  errorStrategy: 'retry' | 'fallback' | 'boundary';
}

export interface LazyLoadOptions {
  preload?: boolean;
  rootMargin?: string;
  threshold?: number;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
  analytics?: {
    componentName?: string;
    trackLoadTime?: boolean;
    trackSuccess?: boolean;
    trackErrors?: boolean;
  };
}

export interface LazyLoadingState {
  loadedComponents: Set<string>;
  loadingComponents: Set<string>;
  failedComponents: Set<string>;
  totalLoadTime: number;
  totalSavings: number; // bytes saved by lazy loading
  metrics: {
    componentsLoaded: number;
    componentsFailed: number;
    averageLoadTime: number;
    totalPreloads: number;
  };
}

export interface LazyLoadingContext {
  config: LazyLoadingConfig;
  state: LazyLoadingState;
  updateConfig: (config: Partial<LazyLoadingConfig>) => void;
  preloadComponent: (componentId: string, importFn: () => Promise<any>) => void;
  markComponentLoaded: (componentId: string, loadTime: number, bundleSize: number) => void;
  markComponentFailed: (componentId: string, error: Error) => void;
  getMetrics: () => LazyLoadingState['metrics'];
}

// Default configuration
const DEFAULT_CONFIG: LazyLoadingConfig = {
  enabled: true,
  preloadThreshold: 200,
  loadingTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enablePreloading: true,
  enableMonitoring: true,
  fallbackStrategy: 'skeleton',
  errorStrategy: 'retry',
};

// Context for lazy loading state
const LazyLoadingContext = createContext<LazyLoadingContext | null>(null);

// Provider component
export function LazyLoadingProvider({
  children,
  config = {}
}: {
  children: ReactNode;
  config?: Partial<LazyLoadingConfig>;
}) {
  const [currentConfig, setCurrentConfig] = useState<LazyLoadingConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }));

  const [state, setState] = useState<LazyLoadingState>(() => ({
    loadedComponents: new Set(),
    loadingComponents: new Set(),
    failedComponents: new Set(),
    totalLoadTime: 0,
    totalSavings: 0,
    metrics: {
      componentsLoaded: 0,
      componentsFailed: 0,
      averageLoadTime: 0,
      totalPreloads: 0,
    },
  }));

  const preloadedComponents = useRef<Map<string, Promise<any>>>(new Map());

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<LazyLoadingConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Preload a component
  const preloadComponent = useCallback(async (componentId: string, importFn: () => Promise<any>) => {
    if (!currentConfig.enablePreloading) return;
    if (preloadedComponents.current.has(componentId)) return;

    const startTime = performance.now();

    try {
      const promise = importFn();
      preloadedComponents.current.set(componentId, promise);

      const module = await promise;
      const loadTime = performance.now() - startTime;

      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          totalPreloads: prev.metrics.totalPreloads + 1,
        },
      }));

      // Track with monitoring system
      if (currentConfig.enableMonitoring) {
        performanceObserver.recordTaskCompletion({
          taskId: componentId,
          taskName: `preload-${componentId}`,
          startTime,
          endTime: performance.now(),
          duration: loadTime,
          success: true,
        });
      }

      return module;
    } catch (error) {
      preloadedComponents.current.delete(componentId);
      console.error(`Failed to preload component ${componentId}:`, error);

      if (currentConfig.enableMonitoring) {
        performanceObserver.recordTaskCompletion({
          taskId: componentId,
          taskName: `preload-${componentId}`,
          startTime,
          endTime: performance.now(),
          duration: performance.now() - startTime,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw error;
    }
  }, [currentConfig.enablePreloading, currentConfig.enableMonitoring]);

  // Mark component as loaded
  const markComponentLoaded = useCallback((componentId: string, loadTime: number, bundleSize: number) => {
    setState(prev => {
      const newLoadedComponents = new Set(prev.loadedComponents);
      const newLoadingComponents = new Set(prev.loadingComponents);

      newLoadedComponents.add(componentId);
      newLoadingComponents.delete(componentId);

      const componentsLoaded = newLoadedComponents.size;
      const totalLoadTime = prev.totalLoadTime + loadTime;
      const averageLoadTime = totalLoadTime / componentsLoaded;

      return {
        ...prev,
        loadedComponents: newLoadedComponents,
        loadingComponents: newLoadingComponents,
        totalLoadTime,
        totalSavings: prev.totalSavings + bundleSize,
        metrics: {
          ...prev.metrics,
          componentsLoaded,
          averageLoadTime,
        },
      };
    });

    // Update bundle monitoring
    if (currentConfig.enableMonitoring) {
      bundleMonitoringSystem.getHealthReport().then(report => {
        // Track component loading impact on bundle size
        console.debug(`Component ${componentId} loaded:`, {
          loadTime: `${loadTime.toFixed(2)}ms`,
          bundleSize: `${(bundleSize / 1024).toFixed(2)}KB`,
        });
      });
    }
  }, [currentConfig.enableMonitoring]);

  // Mark component as failed
  const markComponentFailed = useCallback((componentId: string, error: Error) => {
    setState(prev => {
      const newFailedComponents = new Set(prev.failedComponents);
      const newLoadingComponents = new Set(prev.loadingComponents);

      newFailedComponents.add(componentId);
      newLoadingComponents.delete(componentId);

      return {
        ...prev,
        failedComponents: newFailedComponents,
        loadingComponents: newLoadingComponents,
        metrics: {
          ...prev.metrics,
          componentsFailed: newFailedComponents.size,
        },
      };
    });

    console.error(`Component ${componentId} failed to load:`, error);
  }, []);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...state.metrics };
  }, [state.metrics]);

  // Context value
  const contextValue = useMemo(() => ({
    config: currentConfig,
    state,
    updateConfig,
    preloadComponent,
    markComponentLoaded,
    markComponentFailed,
    getMetrics,
  }), [currentConfig, state, updateConfig, preloadComponent, markComponentLoaded, markComponentFailed, getMetrics]);

  return (
    <LazyLoadingContext.Provider value={contextValue}>
      {children}
    </LazyLoadingContext.Provider>
  );
}

// Hook to use lazy loading context
export function useLazyLoading() {
  const context = useContext(LazyLoadingContext);
  if (!context) {
    throw new Error('useLazyLoading must be used within a LazyLoadingProvider');
  }
  return context;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: LazyLoadOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { config } = useLazyLoading();

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || `${config.preloadThreshold}px`,
        threshold: options.threshold || 0.1,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, hasLoaded, config.preloadThreshold, options.rootMargin, options.threshold]);

  return { isIntersecting, hasLoaded };
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = React.lazy(importFn);

  return function LazyLoadedComponent(props: P) {
    const { config, preloadComponent, markComponentLoaded, markComponentFailed } = useLazyLoading();
    const elementRef = useRef<HTMLDivElement>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const { isIntersecting, hasLoaded } = useIntersectionObserver(elementRef, options);

    // Preload if requested
    React.useEffect(() => {
      if (options.preload && config.enablePreloading) {
        const componentId = options.analytics?.componentName || 'unknown';
        preloadComponent(componentId, importFn);
      }
    }, [options.preload, config.enablePreloading, options.analytics?.componentName, preloadComponent]);

    // Handle component loading
    const handleLoad = useCallback(() => {
      if (!options.analytics?.trackLoadTime) return;

      const startTime = performance.now();
      setIsLoading(true);

      return importFn()
        .then((module) => {
          const loadTime = performance.now() - startTime;
          const componentId = options.analytics?.componentName || 'unknown';

          // Approximate bundle size (in a real implementation, you'd get this from build tools)
          const bundleSize = 50000; // 50KB estimate

          markComponentLoaded(componentId, loadTime, bundleSize);
          setIsLoading(false);
          return module;
        })
        .catch((error) => {
          const componentId = options.analytics?.componentName || 'unknown';
          markComponentFailed(componentId, error);
          setIsLoading(false);
          throw error;
        });
    }, [options.analytics, markComponentLoaded, markComponentFailed]);

    // Retry logic
    const handleRetry = useCallback(() => {
      if (retryCount >= config.retryAttempts) {
        return;
      }
      setRetryCount(prev => prev + 1);

      setTimeout(() => {
        handleLoad();
      }, config.retryDelay * retryCount);
    }, [retryCount, config.retryAttempts, config.retryDelay, handleLoad]);

    // Error boundary fallback
    const ErrorFallback = options.errorFallback || (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-500 mb-2">Failed to load component</div>
        {config.errorStrategy === 'retry' && retryCount < config.retryAttempts && (
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry ({retryCount + 1}/{config.retryAttempts})
          </button>
        )}
      </div>
    );

    // Loading fallback
    const LoadingFallback = options.fallback || (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );

    if (!isIntersecting && !options.preload) {
      return (
        <div ref={elementRef} className="lazy-loading-placeholder">
          {LoadingFallback}
        </div>
      );
    }

    return (
      <Suspense fallback={LoadingFallback}>
        <ErrorBoundary fallback={ErrorFallback}>
          <LazyComponent {...(props as P)} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

// Error Boundary for lazy loaded components
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loaded component error:', error, errorInfo);

    // Track error with monitoring system
    const lazyLoadingContext = window as any;
    if (lazyLoadingContext.lazyLoadingContext?.config.enableMonitoring) {
      performanceObserver.recordTaskCompletion({
        taskId: error.name || 'unknown',
        taskName: 'component-error',
        startTime: 0,
        endTime: 0,
        duration: 0,
        success: false,
        errorMessage: error.message,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default LazyLoadingProvider;
