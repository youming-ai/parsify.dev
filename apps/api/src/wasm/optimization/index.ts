/**
 * WASM Memory Optimization Module
 *
 * Comprehensive memory optimization solution for WASM modules including:
 * - Memory monitoring and profiling
 * - Memory leak detection and prevention
 * - Optimized data structures
 * - Memory usage limits and garbage collection
 * - Memory performance testing
 */

// Memory leak detection
export {
  detectMemoryLeaks,
  getLeakHistory,
  type HeapAnalysis,
  type LeakPattern,
  MemoryLeakDetector,
  type MemoryLeakDetectorConfig,
  type MemoryLeakResult,
  type MemorySnapshot,
  memoryLeakDetector,
  type PreventionAction,
  type ResourceTracking,
  startLeakMonitoring,
  stopLeakMonitoring,
} from './memory-leak-detector'
// Memory management and garbage collection
export {
  type AggregateMemoryStats,
  canAllocate,
  createMemoryManager,
  type GarbageCollectionConfig,
  type GCResult,
  GCScheduler,
  type GCStats,
  getAggregateStats,
  getMemoryUsage,
  ManagedModule,
  MemoryBudgetTracker,
  type MemoryLimitConfig,
  type MemoryManagerConfig,
  type MemoryPressureContext,
  type MemoryPressureLevel,
  type MemoryQuota,
  type MemoryUsage,
  type PressureHandler,
  recordAllocation,
  recordDeallocation,
  registerModule,
  triggerGC,
  unregisterModule,
  WasmMemoryManager,
  wasmMemoryManager,
} from './memory-manager'
// Core monitoring and profiling
export {
  createMemoryMonitor,
  getMemoryProfile,
  getMemoryStats,
  MemoryMonitor,
  type MemoryMonitorConfig,
  type MemoryProfile,
  type MemoryStats,
  type MemoryWarning,
  type MemoryWarningLevel,
  startMonitoring,
  stopMonitoring,
  WasmMemoryMonitor,
  wasmMemoryMonitor,
} from './memory-monitor'
// Optimized data structures
export {
  BufferPool,
  CompactArray,
  CompactJsonParser,
  CompactMap,
  CompactObject,
  CompactSet,
  CompactString,
  createBufferPool,
  createCache,
  createCompactArray,
  createCompactMap,
  createCompactObject,
  createMemoryPool,
  createMemoryTracker,
  createStringBuilder,
  MemoryEfficientCache,
  MemoryPool,
  MemoryTracker,
  StringBuilder,
} from './memory-optimized-structures'

// Memory performance testing
export {
  addTestToSuite,
  BuiltInMemoryTests,
  createMemoryPerformanceTester,
  createTestSuite,
  getBuiltInTests,
  type MemoryPerformanceMetrics,
  type MemoryPerformanceTest,
  type MemoryPerformanceTestConfig,
  MemoryPerformanceTester,
  type MemoryPerformanceTestSuite,
  memoryPerformanceTester,
  runMemoryPerformanceTest,
  runMemoryPerformanceTestSuite,
  type TestExecutionContext,
  type TestScenario,
  type TestSuiteSummary,
} from './memory-performance-tester'

// Re-export for convenience
import type { IWasmModule } from '../modules/interfaces/wasm-module.interface'

/**
 * Initialize memory optimization for a WASM module
 */
export function initializeMemoryOptimization(
  module: IWasmModule,
  options?: {
    enableMonitoring?: boolean
    enableLeakDetection?: boolean
    enableMemoryManagement?: boolean
    memoryLimit?: number
    customConfig?: Partial<any>
  }
): void {
  const {
    enableMonitoring = true,
    enableLeakDetection = true,
    enableMemoryManagement = true,
    memoryLimit = 64 * 1024 * 1024, // 64MB default
    customConfig = {},
  } = options || {}

  // Initialize memory monitoring
  if (enableMonitoring) {
    const { wasmMemoryMonitor } = require('./memory-monitor')
    wasmMemoryMonitor.startMonitoring(module, memoryLimit)
  }

  // Initialize leak detection
  if (enableLeakDetection) {
    const { memoryLeakDetector } = require('./memory-leak-detector')
    memoryLeakDetector.startMonitoring(module)
  }

  // Initialize memory management
  if (enableMemoryManagement) {
    const { wasmMemoryManager } = require('./memory-manager')
    wasmMemoryManager.registerModule(module, {
      hardLimit: memoryLimit,
      softLimit: Math.floor(memoryLimit * 0.75),
      criticalLimit: Math.floor(memoryLimit * 0.9),
      ...customConfig,
    })
  }
}

/**
 * Cleanup memory optimization for a WASM module
 */
export function cleanupMemoryOptimization(moduleId: string): void {
  // Stop monitoring
  const { wasmMemoryMonitor } = require('./memory-monitor')
  wasmMemoryMonitor.stopMonitoring(moduleId)

  // Stop leak detection
  const { memoryLeakDetector } = require('./memory-leak-detector')
  memoryLeakDetector.stopMonitoring(moduleId)

  // Unregister from memory manager
  const { wasmMemoryManager } = require('./memory-manager')
  wasmMemoryManager.unregisterModule(moduleId)
}

/**
 * Get comprehensive memory report for a module
 */
export function getMemoryReport(moduleId: string): {
  monitoring: any
  leakDetection: any
  management: any
  recommendations: string[]
} | null {
  try {
    const { wasmMemoryMonitor } = require('./memory-monitor')
    const { memoryLeakDetector } = require('./memory-leak-detector')
    const { wasmMemoryManager } = require('./memory-manager')

    const monitoring = wasmMemoryMonitor.getMemoryStats(moduleId)
    const leakDetection = memoryLeakDetector.detectLeaks(moduleId)
    const management = wasmMemoryManager.getMemoryUsage(moduleId)

    if (!monitoring && !leakDetection && !management) {
      return null
    }

    const recommendations = generateRecommendations({
      monitoring,
      leakDetection,
      management,
    })

    return {
      monitoring,
      leakDetection,
      management,
      recommendations,
    }
  } catch (error) {
    console.error('Error generating memory report:', error)
    return null
  }
}

/**
 * Generate memory optimization recommendations
 */
function generateRecommendations(data: {
  monitoring?: any
  leakDetection?: any
  management?: any
}): string[] {
  const recommendations: string[] = []

  // Monitoring-based recommendations
  if (data.monitoring) {
    if (data.monitoring.efficiencyScore < 70) {
      recommendations.push('Memory efficiency is low. Consider optimizing data structures.')
    }

    if (data.monitoring.leakProbability > 0.5) {
      recommendations.push('High leak probability detected. Review memory management.')
    }

    if (data.monitoring.fragmentationRatio > 0.7) {
      recommendations.push('High memory fragmentation. Consider memory compaction.')
    }
  }

  // Leak detection-based recommendations
  if (data.leakDetection) {
    if (data.leakDetection.hasLeak) {
      recommendations.push(...data.leakDetection.recommendations)
    }

    if (data.leakDetection.severity > 0.7) {
      recommendations.push('Critical memory leak detected. Immediate attention required.')
    }
  }

  // Management-based recommendations
  if (data.management) {
    const usageRatio = data.management.used / data.management.limit
    if (usageRatio > 0.9) {
      recommendations.push(
        'Memory usage is near limit. Consider increasing limits or optimizing usage.'
      )
    }

    if (data.management.gcStats && data.management.gcStats.averageGCTime > 50) {
      recommendations.push('High GC overhead. Consider reducing allocation frequency.')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Memory usage is optimal.')
  }

  return recommendations
}

/**
 * Default memory optimization configuration
 */
export const DEFAULT_CONFIG = {
  monitoring: {
    intervalMs: 1000,
    thresholds: {
      low: 60,
      medium: 75,
      high: 85,
      critical: 95,
    },
    maxHistorySize: 1000,
    leakDetection: true,
    autoGC: true,
    gcThreshold: 80,
    profiling: true,
    maxProfilingDuration: 60000,
  },
  leakDetection: {
    minSamples: 10,
    detectionWindowMs: 60000,
    growthThreshold: 1024,
    fragmentationThreshold: 0.7,
    allocDeallocationRatioThreshold: 0.8,
    continuousMonitoring: true,
    monitoringIntervalMs: 5000,
    autoPrevention: true,
    preventionActions: ['garbage_collection', 'memory_compaction', 'cache_clearing'],
    maxSnapshots: 100,
  },
  memoryManagement: {
    limits: {
      hardLimit: 64 * 1024 * 1024,
      softLimit: 48 * 1024 * 1024,
      criticalLimit: 56 * 1024 * 1024,
      growthRateLimit: 1024 * 1024,
      maxAllocationSize: 10 * 1024 * 1024,
      quotaResetInterval: 60000,
      enableQuotas: true,
    },
    gc: {
      autoGC: true,
      gcThreshold: 75,
      aggressiveGCThreshold: 90,
      minGCInterval: 5000,
      maxGCDuration: 100,
      incrementalGC: true,
      strategy: 'balanced',
      enableCompaction: true,
      compactionThreshold: 70,
    },
    monitoringInterval: 1000,
    enablePressureHandling: true,
    enableBudgetTracking: true,
    memoryBudget: 100 * 1024 * 1024,
    budgetWindow: 60000,
  },
  performanceTesting: {
    testDuration: 10000,
    iterations: 1000,
    warmupIterations: 10,
    loadPattern: 'constant' as const,
    maxMemoryLoad: 10 * 1024 * 1024,
    allocationSizes: [1024, 4096, 8192],
    allocationIntervals: [10, 50, 100],
    deallocationProbability: 0.8,
    enableConcurrency: false,
    concurrency: 1,
    enableStressTest: false,
    stressMultiplier: 1,
    enableLeakSimulation: false,
    leakProbability: 0,
    scenarios: [],
    timeout: 30000,
    enableDetailedMetrics: true,
    metricsInterval: 100,
  },
}

/**
 * Memory optimization utilities
 */
export const MemoryOptimizationUtils = {
  /**
   * Convert bytes to human readable format
   */
  formatBytes: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  },

  /**
   * Calculate memory efficiency score
   */
  calculateEfficiency: (allocated: number, used: number, leaked: number): number => {
    if (allocated === 0) return 100

    const utilizationRatio = used / allocated
    const leakRatio = leaked / allocated

    return Math.max(0, Math.min(100, utilizationRatio * 100 - leakRatio * 50))
  },

  /**
   * Get memory health status
   */
  getHealthStatus: (usage: number, limit: number): 'healthy' | 'warning' | 'critical' => {
    const ratio = usage / limit

    if (ratio >= 0.9) return 'critical'
    if (ratio >= 0.75) return 'warning'
    return 'healthy'
  },

  /**
   * Estimate memory overhead
   */
  estimateOverhead: (objectCount: number, averageSize: number): number => {
    // Rough estimation: 50% overhead for object metadata, alignment, etc.
    return objectCount * averageSize * 0.5
  },
}
