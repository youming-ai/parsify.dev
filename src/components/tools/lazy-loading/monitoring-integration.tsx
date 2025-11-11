/**
 * Monitoring Integration - T152 Implementation
 * Integrates lazy loading system with existing monitoring and analytics
 * Provides comprehensive performance tracking and optimization insights
 */

'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useLazyLoading } from './lazy-loading-provider';
import { bundleMonitoringSystem } from '@/monitoring';
import { performanceObserver } from '@/monitoring/performance-observer';

// Types for monitoring integration
export interface LazyLoadingMetrics {
  componentLoads: {
    [componentId: string]: {
      loadTime: number;
      success: boolean;
      retryCount: number;
      bundleSize: number;
      timestamp: Date;
      error?: string;
    };
  };
  preloads: {
    successful: number;
    failed: number;
    totalBytes: number;
    averageTime: number;
  };
  userExperience: {
    totalWaitTime: number;
    averageLoadTime: number;
    errorRate: number;
    satisfactionScore: number;
  };
  performance: {
    bundleSize: number;
    gzippedSize: number;
    compressionRatio: number;
    cacheHitRate: number;
  };
  insights: {
    slowComponents: string[];
    largeComponents: string[];
    errorProneComponents: string[];
    optimizationOpportunities: string[];
  };
}

export interface PerformanceThresholds {
  componentLoadTime: number; // ms
  bundleSize: number; // bytes
  errorRate: number; // percentage
  compressionRatio: number; // percentage
  userSatisfaction: number; // score 0-100
}

// Monitoring integration hook
export function useLazyLoadingMonitoring() {
  const { state, config } = useLazyLoading();
  const metricsRef = useRef<LazyLoadingMetrics>({
    componentLoads: {},
    preloads: {
      successful: 0,
      failed: 0,
      totalBytes: 0,
      averageTime: 0,
    },
    userExperience: {
      totalWaitTime: 0,
      averageLoadTime: 0,
      errorRate: 0,
      satisfactionScore: 100,
    },
    performance: {
      bundleSize: 0,
      gzippedSize: 0,
      compressionRatio: 0,
      cacheHitRate: 0,
    },
    insights: {
      slowComponents: [],
      largeComponents: [],
      errorProneComponents: [],
      optimizationOpportunities: [],
    },
  });

  const thresholds: PerformanceThresholds = {
    componentLoadTime: 1000, // 1 second
    bundleSize: 500000, // 500KB
    errorRate: 5, // 5%
    compressionRatio: 70, // 70%
    userSatisfaction: 80, // 80/100
  };

  // Track component load
  const trackComponentLoad = useCallback((
    componentId: string,
    loadTime: number,
    success: boolean,
    bundleSize: number,
    error?: string,
    retryCount = 0
  ) => {
    const metrics = metricsRef.current;

    // Update component load metrics
    metrics.componentLoads[componentId] = {
      loadTime,
      success,
      retryCount,
      bundleSize,
      timestamp: new Date(),
      error,
    };

    // Update user experience metrics
    if (success) {
      metrics.userExperience.totalWaitTime += loadTime;
    }

    const componentCount = Object.keys(metrics.componentLoads).length;
    metrics.userExperience.averageLoadTime = metrics.userExperience.totalWaitTime / componentCount;

    // Calculate error rate
    const failures = Object.values(metrics.componentLoads).filter(load => !load.success).length;
    metrics.userExperience.errorRate = (failures / componentCount) * 100;

    // Update satisfaction score
    metrics.userExperience.satisfactionScore = Math.max(0, 100 - (
      (metrics.userExperience.errorRate * 2) + // Penalty for errors
      (metrics.userExperience.averageLoadTime / 100) + // Penalty for slow loads
      (retryCount * 5) // Penalty for retries
    ));

    // Track with existing monitoring systems
    if (config.enableMonitoring) {
      performanceObserver.recordTaskCompletion({
        taskId: componentId,
        taskName: `lazy-load-${componentId}`,
        startTime: Date.now() - loadTime,
        endTime: Date.now(),
        duration: loadTime,
        success,
        errorMessage: error,
        inputSize: bundleSize,
      });

      // Track with bundle monitoring system
      bundleMonitoringSystem.getHealthReport().then(report => {
        console.debug(`Component ${componentId} load tracked:`, {
          loadTime: `${loadTime}ms`,
          success,
          bundleSize: `${(bundleSize / 1024).toFixed(2)}KB`,
          satisfactionScore: metrics.userExperience.satisfactionScore,
        });
      });
    }

    // Check for performance issues
    checkPerformanceIssues(componentId, loadTime, success, bundleSize);
  }, [config.enableMonitoring]);

  // Track preload success/failure
  const trackPreload = useCallback((
    componentId: string,
    success: boolean,
    loadTime: number,
    bundleSize: number
  ) => {
    const metrics = metricsRef.current;

    if (success) {
      metrics.preloads.successful++;
      metrics.preloads.totalBytes += bundleSize;

      // Update average preload time
      const totalPreloads = metrics.preloads.successful;
      metrics.preloads.averageTime =
        (metrics.preloads.averageTime * (totalPreloads - 1) + loadTime) / totalPreloads;
    } else {
      metrics.preloads.failed++;
    }

    if (config.enableMonitoring) {
      console.debug(`Preload tracking for ${componentId}:`, {
        success,
        loadTime: `${loadTime}ms`,
        bundleSize: `${(bundleSize / 1024).toFixed(2)}KB`,
        totalPreloads: metrics.preloads.successful,
        totalFailures: metrics.preloads.failed,
      });
    }
  }, [config.enableMonitoring]);

  // Check for performance issues and generate insights
  const checkPerformanceIssues = useCallback((
    componentId: string,
    loadTime: number,
    success: boolean,
    bundleSize: number
  ) => {
    const metrics = metricsRef.current;
    const insights = metrics.insights;

    // Check for slow components
    if (loadTime > thresholds.componentLoadTime) {
      if (!insights.slowComponents.includes(componentId)) {
        insights.slowComponents.push(componentId);
      }
    }

    // Check for large components
    if (bundleSize > thresholds.bundleSize) {
      if (!insights.largeComponents.includes(componentId)) {
        insights.largeComponents.push(componentId);
      }
    }

    // Check for error-prone components
    const componentLoads = Object.values(metrics.componentLoads).filter(
      load => load.timestamp > new Date(Date.now() - 3600000) // Last hour
    );

    const errorCount = componentLoads.filter(load => !load.success).length;
    const errorRate = (errorCount / componentLoads.length) * 100;

    if (errorRate > thresholds.errorRate) {
      if (!insights.errorProneComponents.includes(componentId)) {
        insights.errorProneComponents.push(componentId);
      }
    }

    // Generate optimization opportunities
    generateOptimizationOpportunities(componentId, loadTime, success, bundleSize);
  }, [thresholds]);

  // Generate optimization opportunities
  const generateOptimizationOpportunities = useCallback((
    componentId: string,
    loadTime: number,
    success: boolean,
    bundleSize: number
  ) => {
    const metrics = metricsRef.current;
    const opportunities = metrics.insights.optimizationOpportunities;

    // Large bundle opportunity
    if (bundleSize > thresholds.bundleSize * 0.8) {
      const opportunity = `${componentId}: Consider code splitting or tree shaking to reduce bundle size`;
      if (!opportunities.includes(opportunity)) {
        opportunities.push(opportunity);
      }
    }

    // Slow load opportunity
    if (loadTime > thresholds.componentLoadTime * 0.8) {
      const opportunity = `${componentId}: Consider preloading or optimizing loading strategy`;
      if (!opportunities.includes(opportunity)) {
        opportunities.push(opportunity);
      }
    }

    // Retry opportunity
    const componentData = metrics.componentLoads[componentId];
    if (componentData && componentData.retryCount > 2) {
      const opportunity = `${componentId}: High retry count indicates reliability issues`;
      if (!opportunities.includes(opportunity)) {
        opportunities.push(opportunity);
      }
    }
  }, [thresholds]);

  // Get comprehensive metrics
  const getMetrics = useCallback((): LazyLoadingMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const metrics = metricsRef.current;
    const componentLoads = Object.values(metrics.componentLoads);

    return {
      totalComponents: componentLoads.length,
      successfulLoads: componentLoads.filter(load => load.success).length,
      failedLoads: componentLoads.filter(load => !load.success).length,
      averageLoadTime: metrics.userExperience.averageLoadTime,
      errorRate: metrics.userExperience.errorRate,
      satisfactionScore: metrics.userExperience.satisfactionScore,
      totalBundleSize: metrics.preloads.totalBytes,
      optimizationOpportunities: metrics.insights.optimizationOpportunities.length,
    };
  }, []);

  // Export metrics for external analysis
  const exportMetrics = useCallback(() => {
    const metrics = metricsRef.current;
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: getPerformanceSummary(),
      details: metrics,
      thresholds,
    };

    // Store in localStorage for debugging
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lazy-loading-metrics', JSON.stringify(exportData));
    }

    return exportData;
  }, [getPerformanceSummary, thresholds]);

  return {
    trackComponentLoad,
    trackPreload,
    getMetrics,
    getPerformanceSummary,
    exportMetrics,
    thresholds,
  };
}

// Performance dashboard component
export function LazyLoadingPerformanceDashboard() {
  const { getMetrics, getPerformanceSummary, exportMetrics } = useLazyLoadingMonitoring();
  const [metrics, setMetrics] = React.useState<LazyLoadingMetrics | null>(null);
  const [summary, setSummary] = React.useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
      setSummary(getPerformanceSummary());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getMetrics, getPerformanceSummary]);

  const handleExport = () => {
    const exportData = exportMetrics();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lazy-loading-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!metrics || !summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Components</h3>
          <p className="text-2xl font-bold text-blue-600">{summary.totalComponents}</p>
          <p className="text-sm text-gray-600">Tracked components</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Success Rate</h3>
          <p className="text-2xl font-bold text-green-600">
            {summary.totalComponents > 0 ?
              ((summary.successfulLoads / summary.totalComponents) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-600">
            {summary.successfulLoads} of {summary.totalComponents} successful
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Average Load Time</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {summary.averageLoadTime.toFixed(0)}ms
          </p>
          <p className="text-sm text-gray-600">Component load time</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">User Satisfaction</h3>
          <p className="text-2xl font-bold text-purple-600">
            {summary.satisfactionScore.toFixed(0)}/100
          </p>
          <p className="text-sm text-gray-600">Experience score</p>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h2>

        {metrics.insights.slowComponents.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Slow Components</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {metrics.insights.slowComponents.map(component => (
                <li key={component}>{component}</li>
              ))}
            </ul>
          </div>
        )}

        {metrics.insights.largeComponents.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Large Components</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {metrics.insights.largeComponents.map(component => (
                <li key={component}>{component}</li>
              ))}
            </ul>
          </div>
        )}

        {metrics.insights.errorProneComponents.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error-Prone Components</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {metrics.insights.errorProneComponents.map(component => (
                <li key={component}>{component}</li>
              ))}
            </ul>
          </div>
        )}

        {metrics.insights.optimizationOpportunities.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Optimization Opportunities</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {metrics.insights.optimizationOpportunities.map((opportunity, index) => (
                <li key={index}>{opportunity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Metrics
        </button>
      </div>
    </div>
  );
}

// Real-time performance monitor
export function LazyLoadingRealTimeMonitor() {
  const { getMetrics } = useLazyLoadingMonitoring();
  const [currentMetrics, setCurrentMetrics] = React.useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const metrics = getMetrics();
      setCurrentMetrics({
        loadTime: metrics.userExperience.averageLoadTime,
        errorRate: metrics.userExperience.errorRate,
        satisfaction: metrics.userExperience.satisfactionScore,
        componentsLoaded: metrics.componentLoads,
        preloadsSuccessful: metrics.preloads.successful,
        preloadsFailed: metrics.preloads.failed,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000); // Update every second

    return () => clearInterval(interval);
  }, [getMetrics]);

  if (!currentMetrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Real-time Performance</h3>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={currentMetrics.loadTime > 1000 ? 'text-red-600' : 'text-green-600'}>
            {currentMetrics.loadTime.toFixed(0)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>Error Rate:</span>
          <span className={currentMetrics.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
            {currentMetrics.errorRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Satisfaction:</span>
          <span className={currentMetrics.satisfaction > 80 ? 'text-green-600' : 'text-yellow-600'}>
            {currentMetrics.satisfaction.toFixed(0)}/100
          </span>
        </div>
        <div className="flex justify-between">
          <span>Components:</span>
          <span>{Object.keys(currentMetrics.componentsLoaded).length}</span>
        </div>
      </div>
    </div>
  );
}

export default useLazyLoadingMonitoring;
