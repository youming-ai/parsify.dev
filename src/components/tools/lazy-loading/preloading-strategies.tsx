/**
 * Preloading Strategies - T152 Implementation
 * Advanced preloading system for optimizing component load times and user experience
 * Supports multiple strategies: idle time, intersection prediction, user behavior, and network-aware preloading
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLazyLoading } from './lazy-loading-provider';
import { performanceObserver } from '@/monitoring/performance-observer';

// Types for preloading strategies
export interface PreloadStrategy {
  id: string;
  name: string;
  description: string;
  priority: number; // 1-10, higher is more important
  estimatedSize: number; // bytes
  dependencies?: string[]; // component IDs that must be loaded first
  conditions?: PreloadCondition[];
  trigger: PreloadTrigger;
  cooldown?: number; // ms between preloads
  maxRetries?: number;
}

export interface PreloadCondition {
  type: 'idle' | 'intersection' | 'network' | 'user-behavior' | 'time' | 'viewport';
  value: any;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'includes' | 'contains';
}

export interface PreloadTrigger {
  type: 'immediate' | 'idle' | 'intersection' | 'hover' | 'focus' | 'scroll' | 'custom';
  threshold?: number; // distance, time, or percentage
  selector?: string; // CSS selector for DOM elements
  custom?: () => boolean; // custom condition function
}

export interface PreloadQueue {
  pending: PreloadStrategy[];
  loading: Set<string>;
  completed: Set<string>;
  failed: Set<string>;
  paused: boolean;
  priority: PreloadStrategy[];
}

export interface PreloadMetrics {
  totalStrategies: number;
  completedPreloads: number;
  failedPreloads: number;
  totalBytesPreloaded: number;
  averageLoadTime: number;
  cacheHitRate: number;
  networkSavings: number;
  userExperienceScore: number;
  strategies: {
    [strategyId: string]: {
      loadTime: number;
      success: boolean;
      retryCount: number;
      lastLoaded: Date;
    };
  };
}

// Hook-based intersection prediction
export function useIntersectionPrediction(
  threshold: number = 0.5,
  lookAheadDistance: number = 200
) {
  const [predictedElements, setPredictedElements] = useState<Set<Element>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible, add to predicted set
            setPredictedElements(prev => new Set(prev).add(entry.target));

            // Predict nearby elements based on scroll direction
            const scrollDirection = getScrollDirection();
            predictNearbyElements(entry.target, scrollDirection);
          }
        });
      },
      {
        threshold,
        rootMargin: `${lookAheadDistance}px`,
      }
    );

    observerRef.current = observer;

    return () => observer.disconnect();
  }, [threshold, lookAheadDistance]);

  const getScrollDirection = (): 'up' | 'down' | 'none' => {
    if (!window.scrollY) return 'none';
    const lastScrollY = useRef(window.scrollY);
    const direction = window.scrollY > lastScrollY.current ? 'down' : 'up';
    lastScrollY.current = window.scrollY;
    return direction;
  };

  const predictNearbyElements = (element: Element, direction: 'up' | 'down' | 'none') => {
    const siblings = Array.from(element.parentElement?.children || []);
    const currentIndex = siblings.indexOf(element);

    let predictedIndices: number[] = [];

    if (direction === 'down') {
      predictedIndices = [currentIndex + 1, currentIndex + 2];
    } else if (direction === 'up') {
      predictedIndices = [currentIndex - 1, currentIndex - 2];
    } else {
      // No clear direction, predict both
      predictedIndices = [currentIndex - 1, currentIndex + 1];
    }

    const predictedSiblings = predictedIndices
      .filter(index => index >= 0 && index < siblings.length)
      .map(index => siblings[index]);

    setPredictedElements(prev => {
      const newSet = new Set(prev);
      predictedSiblings.forEach(sibling => newSet.add(sibling));
      return newSet;
    });
  };

  return { predictedElements };
}

// Network-aware preloading
export function useNetworkAwarePreloading() {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g' as NetworkInformation['effectiveType'],
    downlink: 10 as number,
    rtt: 100 as number,
    saveData: false as boolean,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) return;

    const connection = (navigator as any).connection as NetworkInformation;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    };

    updateNetworkInfo();

    connection.addEventListener('change', updateNetworkInfo);
    return () => connection.removeEventListener('change', updateNetworkInfo);
  }, []);

  const shouldPreload = useCallback((strategy: PreloadStrategy): boolean => {
    const { effectiveType, downlink, saveData } = networkInfo;

    // Don't preload on slow connections or when data saving is enabled
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return false;
    }

    // Adjust priority based on connection speed
    const sizeInMB = strategy.estimatedSize / (1024 * 1024);

    if (effectiveType === '3g' && sizeInMB > 1) {
      return strategy.priority >= 8; // Only high priority on 3G
    }

    if (effectiveType === '4g' && sizeInMB > 3) {
      return strategy.priority >= 6; // Medium to high priority on 4G
    }

    return true;
  }, [networkInfo]);

  const getPreloadDelay = useCallback((strategy: PreloadStrategy): number => {
    const { effectiveType, downlink, rtt } = networkInfo;

    // Base delay on network quality
    let baseDelay = rtt;

    if (effectiveType === '3g') {
      baseDelay *= 2;
    } else if (effectiveType === '2g') {
      baseDelay *= 4;
    }

    // Adjust based on component size
    const sizeInMB = strategy.estimatedSize / (1024 * 1024);
    if (sizeInMB > 2) {
      baseDelay += 1000; // Extra delay for large components
    }

    return baseDelay;
  }, [networkInfo]);

  return { networkInfo, shouldPreload, getPreloadDelay };
}

// User behavior analysis for intelligent preloading
export function useUserBehaviorAnalysis() {
  const [userPatterns, setUserPatterns] = useState({
    scrollSpeed: 0,
    hoverElements: new Set<string>(),
    clickPattern: new Map<string, number>(),
    timeOnPage: 0,
    sessionStart: Date.now(),
  });

  const [interactionHistory, setInteractionHistory] = useState<Array<{
    type: 'scroll' | 'hover' | 'click' | 'focus';
    target: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let lastScrollY = 0;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      const currentTime = Date.now();
      const currentScrollY = window.scrollY;
      const timeDiff = currentTime - lastScrollTime;
      const scrollDiff = Math.abs(currentScrollY - lastScrollY);

      if (timeDiff > 0) {
        const scrollSpeed = scrollDiff / timeDiff;
        setUserPatterns(prev => ({
          ...prev,
          scrollSpeed: Math.max(prev.scrollSpeed * 0.9, scrollSpeed), // Smooth average
        }));
      }

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setInteractionHistory(prev => [...prev.slice(-99), {
          type: 'scroll',
          target: 'window',
          timestamp: Date.now(),
        }]);
      }, 100);
    };

    const handleHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const componentName = target.dataset.component || target.closest('[data-component]')?.dataset.component;

      if (componentName) {
        setUserPatterns(prev => ({
          ...prev,
          hoverElements: new Set(prev.hoverElements).add(componentName),
        }));

        setInteractionHistory(prev => [...prev.slice(-99), {
          type: 'hover',
          target: componentName,
          timestamp: Date.now(),
        }]);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const componentName = target.dataset.component || target.closest('[data-component]')?.dataset.component;

      if (componentName) {
        setUserPatterns(prev => ({
          ...prev,
          clickPattern: new Map(prev.clickPattern).set(componentName,
            (prev.clickPattern.get(componentName) || 0) + 1),
        }));

        setInteractionHistory(prev => [...prev.slice(-99), {
          type: 'click',
          target: componentName,
          timestamp: Date.now(),
        }]);
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const componentName = target.dataset.component || target.closest('[data-component]')?.dataset.component;

      if (componentName) {
        setInteractionHistory(prev => [...prev.slice(-99), {
          type: 'focus',
          target: componentName,
          timestamp: Date.now(),
        }]);
      }
    };

    // Update time on page every second
    const timeInterval = setInterval(() => {
      setUserPatterns(prev => ({
        ...prev,
        timeOnPage: Date.now() - prev.sessionStart,
      }));
    }, 1000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseover', handleHover, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('focusin', handleFocus, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseover', handleHover);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('focusin', handleFocus);
      clearInterval(timeInterval);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const predictNextComponent = useCallback((): string | null => {
    const recentInteractions = interactionHistory.slice(-10);
    const componentCounts = new Map<string, number>();

    recentInteractions.forEach(interaction => {
      if (interaction.type === 'hover' || interaction.type === 'click') {
        componentCounts.set(interaction.target,
          (componentCounts.get(interaction.target) || 0) + 1);
      }
    });

    // Return the most interacted with component
    let maxCount = 0;
    let predictedComponent = null;

    componentCounts.forEach((count, component) => {
      if (count > maxCount) {
        maxCount = count;
        predictedComponent = component;
      }
    });

    return predictedComponent;
  }, [interactionHistory]);

  return { userPatterns, predictNextComponent, interactionHistory };
}

// Main preloading manager
export function PreloadingManager({
  strategies,
  onProgress,
  onComplete,
  onError,
}: {
  strategies: PreloadStrategy[];
  onProgress?: (strategy: PreloadStrategy, progress: number) => void;
  onComplete?: (strategy: PreloadStrategy) => void;
  onError?: (strategy: PreloadStrategy, error: Error) => void;
}) {
  const { preloadComponent } = useLazyLoading();
  const { shouldPreload, getPreloadDelay } = useNetworkAwarePreloading();
  const { predictNextComponent } = useUserBehaviorAnalysis();

  const [queue, setQueue] = useState<PreloadQueue>({
    pending: strategies.sort((a, b) => b.priority - a.priority),
    loading: new Set(),
    completed: new Set(),
    failed: new Set(),
    paused: false,
    priority: strategies.sort((a, b) => b.priority - a.priority),
  });

  const [metrics, setMetrics] = useState<PreloadMetrics>({
    totalStrategies: strategies.length,
    completedPreloads: 0,
    failedPreloads: 0,
    totalBytesPreloaded: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    networkSavings: 0,
    userExperienceScore: 100,
    strategies: {},
  });

  const preloadTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Execute a single preload strategy
  const executeStrategy = useCallback(async (strategy: PreloadStrategy) => {
    const startTime = performance.now();

    try {
      setQueue(prev => ({
        ...prev,
        loading: new Set(prev.loading).add(strategy.id),
        pending: prev.pending.filter(s => s.id !== strategy.id),
      }));

      // Check network conditions
      if (!shouldPreload(strategy)) {
        console.debug(`Skipping preload for ${strategy.name} due to network conditions`);
        setQueue(prev => ({
          ...prev,
          loading: new Set(prev.loading).delete(strategy.id) && prev.loading,
          pending: [...prev.pending, strategy],
        }));
        return;
      }

      // Check dependencies
      if (strategy.dependencies) {
        const dependenciesMet = strategy.dependencies.every(dep =>
          queue.completed.has(dep)
        );

        if (!dependenciesMet) {
          console.debug(`Dependencies not met for ${strategy.name}, rescheduling`);
          setQueue(prev => ({
            ...prev,
            loading: new Set(prev.loading).delete(strategy.id) && prev.loading,
            pending: [...prev.pending, strategy],
          }));
          return;
        }
      }

      // Track load time
      const loadTime = performance.now() - startTime;

      // Execute preload
      await preloadComponent(strategy.id, () => {
        // This should be replaced with actual import function for the component
        console.debug(`Preloading ${strategy.name}...`);
        return Promise.resolve();
      });

      // Update metrics
      setMetrics(prev => {
        const newCompletedPreloads = prev.completedPreloads + 1;
        const newTotalBytesPreloaded = prev.totalBytesPreloaded + strategy.estimatedSize;
        const newAverageLoadTime = (prev.averageLoadTime * prev.completedPreloads + loadTime) / newCompletedPreloads;

        return {
          ...prev,
          completedPreloads: newCompletedPreloads,
          totalBytesPreloaded: newTotalBytesPreloaded,
          averageLoadTime: newAverageLoadTime,
          strategies: {
            ...prev.strategies,
            [strategy.id]: {
              loadTime,
              success: true,
              retryCount: 0,
              lastLoaded: new Date(),
            },
          },
        };
      });

      setQueue(prev => ({
        ...prev,
        loading: new Set(prev.loading).delete(strategy.id) && prev.loading,
        completed: new Set(prev.completed).add(strategy.id),
      }));

      onComplete?.(strategy);

      console.debug(`Successfully preloaded ${strategy.name} in ${loadTime.toFixed(2)}ms`);

    } catch (error) {
      const loadError = error instanceof Error ? error : new Error('Unknown preload error');

      console.error(`Failed to preload ${strategy.name}:`, loadError);

      // Update metrics for failed preload
      setMetrics(prev => ({
        ...prev,
        failedPreloads: prev.failedPreloads + 1,
        userExperienceScore: Math.max(0, prev.userExperienceScore - 5),
        strategies: {
          ...prev.strategies,
          [strategy.id]: {
            loadTime: performance.now() - startTime,
            success: false,
            retryCount: 0,
            lastLoaded: new Date(),
          },
        },
      }));

      setQueue(prev => ({
        ...prev,
        loading: new Set(prev.loading).delete(strategy.id) && prev.loading,
        failed: new Set(prev.failed).add(strategy.id),
      }));

      onError?.(strategy, loadError);
    }
  }, [shouldPreload, preloadComponent, queue.completed, onComplete, onError]);

  // Process the preload queue
  useEffect(() => {
    if (queue.paused || queue.loading.size >= 3) return; // Max 3 concurrent preloads

    const nextStrategy = queue.pending.find(strategy => {
      // Check if strategy conditions are met
      return evaluateConditions(strategy.conditions);
    });

    if (nextStrategy) {
      const delay = getPreloadDelay(nextStrategy);

      const timeout = setTimeout(() => {
        executeStrategy(nextStrategy);
      }, delay);

      preloadTimeouts.current.set(nextStrategy.id, timeout);

      return () => {
        clearTimeout(timeout);
        preloadTimeouts.current.delete(nextStrategy.id);
      };
    }
  }, [queue, executeStrategy, getPreloadDelay]);

  // Evaluate strategy conditions
  const evaluateConditions = (conditions?: PreloadCondition[]): boolean => {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      switch (condition.type) {
        case 'idle':
          return checkIdleCondition(condition.value);
        case 'intersection':
          return checkIntersectionCondition(condition.value);
        case 'network':
          return checkNetworkCondition(condition.value);
        case 'user-behavior':
          return checkUserBehaviorCondition(condition.value);
        case 'time':
          return checkTimeCondition(condition.value);
        case 'viewport':
          return checkViewportCondition(condition.value);
        default:
          return true;
      }
    });
  };

  // Condition check functions
  const checkIdleCondition = (value: number): boolean => {
    // Check if user has been idle for specified milliseconds
    return performance.now() - getLastUserInteraction() > value;
  };

  const checkIntersectionCondition = (selector: string): boolean => {
    const element = document.querySelector(selector);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  const checkNetworkCondition = (expectedType: string): boolean => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) return true;

    const connection = (navigator as any).connection as NetworkInformation;
    return connection.effectiveType === expectedType;
  };

  const checkUserBehaviorCondition = (expectedComponent: string): boolean => {
    const predictedComponent = predictNextComponent();
    return predictedComponent === expectedComponent;
  };

  const checkTimeCondition = (expectedTime: number): boolean => {
    return Date.now() >= expectedTime;
  };

  const checkViewportCondition = (threshold: number): boolean => {
    return window.scrollY > threshold;
  };

  const getLastUserInteraction = (): number => {
    // This should track the last user interaction time
    return performance.now() - 1000; // Placeholder
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      preloadTimeouts.current.forEach(timeout => clearTimeout(timeout));
      preloadTimeouts.current.clear();
    };
  }, []);

  return {
    queue,
    metrics,
    pausePreloading: () => setQueue(prev => ({ ...prev, paused: true })),
    resumePreloading: () => setQueue(prev => ({ ...prev, paused: false })),
    addStrategy: (strategy: PreloadStrategy) => setQueue(prev => ({
      ...prev,
      pending: [...prev.pending, strategy].sort((a, b) => b.priority - a.priority),
      totalStrategies: prev.totalStrategies + 1,
    })),
  };
}

// Default preload strategies for common components
export const defaultPreloadStrategies: PreloadStrategy[] = [
  {
    id: 'monaco-editor-javascript',
    name: 'Monaco Editor (JavaScript)',
    description: 'Code editor for JavaScript/TypeScript',
    priority: 9,
    estimatedSize: 250000, // ~250KB
    trigger: {
      type: 'hover',
      selector: '[data-component*="code-editor"], [data-component*="javascript"]',
    },
    conditions: [
      { type: 'network', value: '4g' },
    ],
  },
  {
    id: 'tesseract-ocr',
    name: 'Tesseract OCR Engine',
    description: 'Optical character recognition library',
    priority: 7,
    estimatedSize: 1500000, // ~1.5MB
    trigger: {
      type: 'intersection',
      selector: '[data-component*="ocr"], [data-component*="image-processing"]',
      threshold: 0.5,
    },
    conditions: [
      { type: 'network', value: '4g' },
    ],
    cooldown: 5000, // 5 seconds between retries
  },
  {
    id: 'chart-library',
    name: 'Chart Visualization Library',
    description: 'Data visualization components',
    priority: 6,
    estimatedSize: 500000, // ~500KB
    trigger: {
      type: 'idle',
      value: 2000, // 2 seconds of idle time
    },
  },
  {
    id: 'json-processor',
    name: 'JSON Processing Tools',
    description: 'JSON validation, formatting, and conversion',
    priority: 8,
    estimatedSize: 100000, // ~100KB
    trigger: {
      type: 'intersection',
      selector: '[data-category="json"]',
      threshold: 0.3,
    },
  },
  {
    id: 'file-processor',
    name: 'File Processing Components',
    description: 'File conversion and processing tools',
    priority: 5,
    estimatedSize: 200000, // ~200KB
    trigger: {
      type: 'user-behavior',
      value: 'file-upload',
    },
  },
];

export default PreloadingManager;
