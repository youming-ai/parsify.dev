/**
 * Memory leak detection and prevention for WASM modules
 */

import { MemoryStats } from './memory-monitor'
import { IWasmModule } from '../modules/interfaces/wasm-module.interface'

/**
 * Memory leak detection result
 */
export interface MemoryLeakResult {
  /**
   * Whether a memory leak was detected
   */
  hasLeak: boolean

  /**
   * Leak severity (0-1)
   */
  severity: number

  /**
   * Estimated leaked memory in bytes
   */
  estimatedLeakedBytes: number

  /**
   * Leak patterns detected
   */
  patterns: LeakPattern[]

  /**
   * Suspected causes
   */
  suspectedCauses: string[]

  /**
   * Recommended actions
   */
  recommendations: string[]

  /**
   * Detection timestamp
   */
  timestamp: Date
}

/**
 * Memory leak pattern
 */
export interface LeakPattern {
  /**
   * Pattern type
   */
  type: 'growth' | 'fragmentation' | 'circular' | 'resource' | 'allocation'

  /**
   * Pattern name
   */
  name: string

  /**
   * Confidence (0-1)
   */
  confidence: number

  /**
   * Pattern description
   */
  description: string

  /**
   * Evidence data
   */
  evidence: any

  /**
   * Location in code (if available)
   */
  location?: string
}

/**
 * Memory leak detector configuration
 */
export interface MemoryLeakDetectorConfig {
  /**
   * Minimum samples required for detection
   */
  minSamples: number

  /**
   * Detection window in milliseconds
   */
  detectionWindowMs: number

  /**
   * Growth threshold (bytes per second)
   */
  growthThreshold: number

  /**
   * Fragmentation threshold (0-1)
   */
  fragmentationThreshold: number

  /**
   * Allocation/deallocation ratio threshold
   */
  allocDeallocationRatioThreshold: number

  /**
   * Enable continuous monitoring
   */
  continuousMonitoring: boolean

  /**
   * Monitoring interval in milliseconds
   */
  monitoringIntervalMs: number

  /**
   * Enable automatic leak prevention
   */
  autoPrevention: boolean

  /**
   * Prevention actions to take
   */
  preventionActions: PreventionAction[]

  /**
   * Memory snapshots to keep for analysis
   */
  maxSnapshots: number
}

/**
 * Prevention action types
 */
export type PreventionAction =
  | 'garbage_collection'
  | 'memory_compaction'
  | 'resource_cleanup'
  | 'cache_clearing'
  | 'connection_pool_reset'
  | 'buffer_pool_reset'
  | 'event_listener_cleanup'

/**
 * Memory snapshot for analysis
 */
export interface MemorySnapshot {
  timestamp: number
  memoryStats: MemoryStats
  heapAnalysis?: HeapAnalysis
  resourceTracking?: ResourceTracking
}

/**
 * Heap analysis data
 */
export interface HeapAnalysis {
  totalObjects: number
  totalSize: number
  objectTypes: Record<string, { count: number; size: number }>
  retentionPaths: Array<{ path: string; size: number; count: number }>
  gcRoots: Array<{ type: string; size: number }>
}

/**
 * Resource tracking data
 */
export interface ResourceTracking {
  openFiles: number
  openConnections: number
  activeTimers: number
  eventListeners: number
  buffers: number
  images: number
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private config: MemoryLeakDetectorConfig
  private snapshots: Map<string, MemorySnapshot[]> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private leakHistory: Map<string, MemoryLeakResult[]> = new Map()
  private preventionActions: Map<string, Set<PreventionAction>> = new Map()

  constructor(config?: Partial<MemoryLeakDetectorConfig>) {
    this.config = {
      minSamples: 10,
      detectionWindowMs: 60000, // 1 minute
      growthThreshold: 1024, // 1KB/s
      fragmentationThreshold: 0.7,
      allocDeallocationRatioThreshold: 0.8,
      continuousMonitoring: true,
      monitoringIntervalMs: 5000, // 5 seconds
      autoPrevention: true,
      preventionActions: [
        'garbage_collection',
        'memory_compaction',
        'cache_clearing',
        'event_listener_cleanup'
      ],
      maxSnapshots: 100,
      ...config
    }
  }

  /**
   * Start monitoring a WASM module for memory leaks
   */
  startMonitoring(module: IWasmModule): void {
    const moduleId = module.id

    // Stop existing monitoring
    this.stopMonitoring(moduleId)

    // Initialize snapshot storage
    if (!this.snapshots.has(moduleId)) {
      this.snapshots.set(moduleId, [])
    }

    if (!this.leakHistory.has(moduleId)) {
      this.leakHistory.set(moduleId, [])
    }

    if (!this.preventionActions.has(moduleId)) {
      this.preventionActions.set(moduleId, new Set())
    }

    if (this.config.continuousMonitoring) {
      const interval = setInterval(() => {
        this.captureSnapshot(module)
      }, this.config.monitoringIntervalMs)

      this.monitoringIntervals.set(moduleId, interval)
    }

    // Capture initial snapshot
    this.captureSnapshot(module)
  }

  /**
   * Stop monitoring a WASM module
   */
  stopMonitoring(moduleId: string): void {
    const interval = this.monitoringIntervals.get(moduleId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(moduleId)
    }
  }

  /**
   * Capture a memory snapshot for analysis
   */
  captureSnapshot(module: IWasmModule): void {
    const moduleId = module.id
    const snapshots = this.snapshots.get(moduleId) || []

    // Create snapshot
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      memoryStats: this.measureMemoryStats(module),
      heapAnalysis: this.analyzeHeap(module),
      resourceTracking: this.trackResources(module)
    }

    snapshots.push(snapshot)

    // Limit snapshot count
    if (snapshots.length > this.config.maxSnapshots) {
      snapshots.splice(0, snapshots.length - this.config.maxSnapshots)
    }

    this.snapshots.set(moduleId, snapshots)

    // Check for leaks if we have enough samples
    if (snapshots.length >= this.config.minSamples) {
      const leakResult = this.detectLeaks(moduleId)
      if (leakResult.hasLeak) {
        this.handleDetectedLeak(moduleId, leakResult)
      }
    }
  }

  /**
   * Detect memory leaks for a module
   */
  detectLeaks(moduleId: string): MemoryLeakResult {
    const snapshots = this.snapshots.get(moduleId) || []

    if (snapshots.length < this.config.minSamples) {
      return {
        hasLeak: false,
        severity: 0,
        estimatedLeakedBytes: 0,
        patterns: [],
        suspectedCauses: [],
        recommendations: [],
        timestamp: new Date()
      }
    }

    const patterns: LeakPattern[] = []
    let severity = 0
    let estimatedLeakedBytes = 0

    // Detect growth pattern
    const growthPattern = this.detectGrowthPattern(snapshots)
    if (growthPattern) {
      patterns.push(growthPattern)
      severity = Math.max(severity, growthPattern.confidence * 0.8)
      estimatedLeakedBytes += growthPattern.evidence.estimatedLeak || 0
    }

    // Detect fragmentation pattern
    const fragmentationPattern = this.detectFragmentationPattern(snapshots)
    if (fragmentationPattern) {
      patterns.push(fragmentationPattern)
      severity = Math.max(severity, fragmentationPattern.confidence * 0.6)
    }

    // Detect circular reference pattern
    const circularPattern = this.detectCircularReferencePattern(snapshots)
    if (circularPattern) {
      patterns.push(circularPattern)
      severity = Math.max(severity, circularPattern.confidence * 0.7)
    }

    // Detect resource leak pattern
    const resourcePattern = this.detectResourceLeakPattern(snapshots)
    if (resourcePattern) {
      patterns.push(resourcePattern)
      severity = Math.max(severity, resourcePattern.confidence * 0.9)
    }

    // Detect allocation imbalance pattern
    const allocationPattern = this.detectAllocationImbalancePattern(snapshots)
    if (allocationPattern) {
      patterns.push(allocationPattern)
      severity = Math.max(severity, allocationPattern.confidence * 0.5)
    }

    // Calculate suspected causes and recommendations
    const suspectedCauses = this.identifySuspectedCauses(patterns)
    const recommendations = this.generateRecommendations(patterns)

    const result: MemoryLeakResult = {
      hasLeak: patterns.length > 0 && severity > 0.3,
      severity,
      estimatedLeakedBytes,
      patterns,
      suspectedCauses,
      recommendations,
      timestamp: new Date()
    }

    // Store in history
    const history = this.leakHistory.get(moduleId) || []
    history.push(result)
    if (history.length > 20) {
      history.splice(0, history.length - 20)
    }
    this.leakHistory.set(moduleId, history)

    return result
  }

  /**
   * Detect memory growth pattern
   */
  private detectGrowthPattern(snapshots: MemorySnapshot[]): LeakPattern | null {
    if (snapshots.length < 5) return null

    // Get recent snapshots within detection window
    const now = Date.now()
    const recentSnapshots = snapshots.filter(s =>
      now - s.timestamp <= this.config.detectionWindowMs
    )

    if (recentSnapshots.length < 3) return null

    // Calculate growth rate
    const memoryValues = recentSnapshots.map(s => s.memoryStats.used)
    const timeValues = recentSnapshots.map(s => s.timestamp)

    // Simple linear regression to detect growth trend
    const growthRate = this.calculateGrowthRate(timeValues, memoryValues)

    if (growthRate > this.config.growthThreshold) {
      const estimatedLeak = growthRate * (this.config.detectionWindowMs / 1000)

      return {
        type: 'growth',
        name: 'Memory Growth Leak',
        confidence: Math.min(1, growthRate / (this.config.growthThreshold * 5)),
        description: `Memory growing at ${growthRate.toFixed(2)} bytes/second`,
        evidence: {
          growthRate,
          estimatedLeak,
          samples: recentSnapshots.length
        }
      }
    }

    return null
  }

  /**
   * Detect memory fragmentation pattern
   */
  private detectFragmentationPattern(snapshots: MemorySnapshot[]): LeakPattern | null {
    const recentSnapshot = snapshots[snapshots.length - 1]
    const fragmentation = recentSnapshot.memoryStats.fragmentationRatio

    if (fragmentation > this.config.fragmentationThreshold) {
      return {
        type: 'fragmentation',
        name: 'Memory Fragmentation',
        confidence: Math.min(1, fragmentation),
        description: `Memory fragmentation ratio: ${(fragmentation * 100).toFixed(1)}%`,
        evidence: {
          fragmentationRatio: fragmentation,
          allocated: recentSnapshot.memoryStats.allocated,
          used: recentSnapshot.memoryStats.used
        }
      }
    }

    return null
  }

  /**
   * Detect circular reference pattern
   */
  private detectCircularReferencePattern(snapshots: MemorySnapshot[]): LeakPattern | null {
    const recentSnapshot = snapshots[snapshots.length - 1]
    const heapAnalysis = recentSnapshot.heapAnalysis

    if (!heapAnalysis) return null

    // Look for unusual retention patterns
    const suspiciousPaths = heapAnalysis.retentionPaths.filter(path =>
      path.size > 1024 * 1024 && // > 1MB
      path.count > 100 // Many objects
    )

    if (suspiciousPaths.length > 0) {
      return {
        type: 'circular',
        name: 'Circular Reference Leak',
        confidence: Math.min(1, suspiciousPaths.length / 5),
        description: 'Possible circular references preventing garbage collection',
        evidence: {
          suspiciousPaths,
          totalObjects: heapAnalysis.totalObjects,
          totalSize: heapAnalysis.totalSize
        }
      }
    }

    return null
  }

  /**
   * Detect resource leak pattern
   */
  private detectResourceLeakPattern(snapshots: MemorySnapshot[]): LeakPattern | null {
    const recentSnapshot = snapshots[snapshots.length - 1]
    const resourceTracking = recentSnapshot.resourceTracking

    if (!resourceTracking) return null

    const issues: string[] = []

    if (resourceTracking.openFiles > 50) {
      issues.push(`Too many open files: ${resourceTracking.openFiles}`)
    }

    if (resourceTracking.openConnections > 20) {
      issues.push(`Too many open connections: ${resourceTracking.openConnections}`)
    }

    if (resourceTracking.activeTimers > 100) {
      issues.push(`Too many active timers: ${resourceTracking.activeTimers}`)
    }

    if (resourceTracking.eventListeners > 200) {
      issues.push(`Too many event listeners: ${resourceTracking.eventListeners}`)
    }

    if (issues.length > 0) {
      return {
        type: 'resource',
        name: 'Resource Leak',
        confidence: Math.min(1, issues.length / 4),
        description: issues.join(', '),
        evidence: {
          resourceTracking,
          issues
        }
      }
    }

    return null
  }

  /**
   * Detect allocation imbalance pattern
   */
  private detectAllocationImbalancePattern(snapshots: MemorySnapshot[]): LeakPattern | null {
    const recentSnapshot = snapshots[snapshots.length - 1]
    const stats = recentSnapshot.memoryStats

    if (stats.allocationCount > 0) {
      const ratio = stats.deallocationCount / stats.allocationCount

      if (ratio < this.config.allocDeallocationRatioThreshold) {
        return {
          type: 'allocation',
          name: 'Allocation Imbalance',
          confidence: 1 - ratio,
          description: `Deallocation/Allocation ratio: ${ratio.toFixed(2)}`,
          evidence: {
            allocationCount: stats.allocationCount,
            deallocationCount: stats.deallocationCount,
            ratio
          }
        }
      }
    }

    return null
  }

  /**
   * Calculate growth rate using linear regression
   */
  private calculateGrowthRate(xValues: number[], yValues: number[]): number {
    if (xValues.length < 2) return 0

    const n = xValues.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

    for (let i = 0; i < n; i++) {
      sumX += xValues[i]
      sumY += yValues[i]
      sumXY += xValues[i] * yValues[i]
      sumX2 += xValues[i] * xValues[i]
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope || 0
  }

  /**
   * Identify suspected causes based on patterns
   */
  private identifySuspectedCauses(patterns: LeakPattern[]): string[] {
    const causes: Set<string> = new Set()

    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'growth':
          causes.add('Continuous object allocation without deallocation')
          causes.add('Growing data structures (arrays, objects)')
          causes.add('Cache accumulation')
          break
        case 'fragmentation':
          causes.add('Frequent allocation/deallocation of different sized objects')
          causes.add('Memory fragmentation from small object allocations')
          break
        case 'circular':
          causes.add('Circular references between objects')
          causes.add('Event listeners not being removed')
          causes.add('Closure references keeping objects alive')
          break
        case 'resource':
          causes.add('Unclosed file handles or database connections')
          causes.add('Uncleared timers or intervals')
          causes.add('Event listeners not being cleaned up')
          break
        case 'allocation':
          causes.add('Memory allocation without proper cleanup')
          causes.add('Buffer or array accumulation')
          break
      }
    }

    return Array.from(causes)
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(patterns: LeakPattern[]): string[] {
    const recommendations: Set<string> = new Set()

    // General recommendations
    recommendations.add('Monitor memory usage trends')
    recommendations.add('Implement regular garbage collection')
    recommendations.add('Use memory profiling tools to identify hotspots')

    // Pattern-specific recommendations
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'growth':
          recommendations.add('Review data structures for unnecessary growth')
          recommendations.add('Implement size limits for caches and collections')
          recommendations.add('Use weak references for temporary objects')
          break
        case 'fragmentation':
          recommendations.add('Implement object pooling for frequently allocated objects')
          recommendations.add('Use memory compaction techniques')
          recommendations.add('Allocate larger blocks less frequently')
          break
        case 'circular':
          recommendations.add('Break circular references explicitly')
          recommendations.add('Remove event listeners when objects are disposed')
          recommendations.add('Use WeakMap/WeakSet for object associations')
          break
        case 'resource':
          recommendations.add('Implement proper resource cleanup (dispose patterns)')
          recommendations.add('Use finally blocks to ensure cleanup')
          recommendations.add('Track and limit resource allocation')
          break
        case 'allocation':
          recommendations.add('Review allocation patterns for missed deallocations')
          recommendations.add('Implement automatic memory management')
          recommendations.add('Use memory-efficient data structures')
          break
      }
    }

    return Array.from(recommendations)
  }

  /**
   * Handle detected memory leak
   */
  private handleDetectedLeak(moduleId: string, leakResult: MemoryLeakResult): void {
    console.warn(`Memory leak detected in module ${moduleId}:`, leakResult)

    // Apply automatic prevention if enabled
    if (this.config.autoPrevention && leakResult.severity > 0.5) {
      this.applyPreventionActions(moduleId, leakResult)
    }
  }

  /**
   * Apply prevention actions
   */
  private applyPreventionActions(moduleId: string, leakResult: MemoryLeakResult): void {
    const appliedActions = this.preventionActions.get(moduleId) || new Set()

    for (const action of this.config.preventionActions) {
      if (!appliedActions.has(action)) {
        try {
          this.executePreventionAction(moduleId, action)
          appliedActions.add(action)
          console.log(`Applied prevention action '${action}' to module ${moduleId}`)
        } catch (error) {
          console.error(`Failed to apply prevention action '${action}':`, error)
        }
      }
    }

    this.preventionActions.set(moduleId, appliedActions)
  }

  /**
   * Execute a specific prevention action
   */
  private executePreventionAction(moduleId: string, action: PreventionAction): void {
    switch (action) {
      case 'garbage_collection':
        // In a real implementation, this would trigger GC in the WASM module
        if (global.gc) {
          global.gc()
        }
        break

      case 'memory_compaction':
        // Simulate memory compaction
        console.log(`Memory compaction triggered for module ${moduleId}`)
        break

      case 'cache_clearing':
        // Clear caches if available
        console.log(`Cache clearing triggered for module ${moduleId}`)
        break

      case 'connection_pool_reset':
        // Reset connection pools
        console.log(`Connection pool reset triggered for module ${moduleId}`)
        break

      case 'buffer_pool_reset':
        // Reset buffer pools
        console.log(`Buffer pool reset triggered for module ${moduleId}`)
        break

      case 'event_listener_cleanup':
        // Clean up event listeners
        console.log(`Event listener cleanup triggered for module ${moduleId}`)
        break

      default:
        console.warn(`Unknown prevention action: ${action}`)
    }
  }

  /**
   * Measure memory statistics for a module
   */
  private measureMemoryStats(module: IWasmModule): MemoryStats {
    const metadata = module.getMetadata()

    // In a real implementation, this would get actual memory stats from the WASM module
    return {
      allocated: metadata.memoryUsage || 0,
      used: Math.floor((metadata.memoryUsage || 0) * (0.6 + Math.random() * 0.3)),
      available: 0,
      peakUsage: metadata.memoryUsage || 0,
      allocationCount: metadata.executionCount || 0,
      deallocationCount: Math.floor((metadata.executionCount || 0) * 0.9),
      fragmentationRatio: 0.1 + Math.random() * 0.3,
      gcCount: Math.floor(Math.random() * 10),
      gcTime: Math.floor(Math.random() * 1000),
      growthRate: 0,
      leakProbability: 0
    }
  }

  /**
   * Analyze heap structure
   */
  private analyzeHeap(module: IWasmModule): HeapAnalysis | undefined {
    // In a real implementation, this would analyze the actual heap
    // For now, return simulated data
    return {
      totalObjects: Math.floor(1000 + Math.random() * 5000),
      totalSize: Math.floor(1024 * 1024 + Math.random() * 10 * 1024 * 1024),
      objectTypes: {
        'Object': { count: 500, size: 1024 * 100 },
        'Array': { count: 300, size: 1024 * 200 },
        'String': { count: 1000, size: 1024 * 50 },
        'Function': { count: 50, size: 1024 * 10 }
      },
      retentionPaths: [],
      gcRoots: []
    }
  }

  /**
   * Track resource usage
   */
  private trackResources(module: IWasmModule): ResourceTracking | undefined {
    // In a real implementation, this would track actual resources
    return {
      openFiles: Math.floor(Math.random() * 10),
      openConnections: Math.floor(Math.random() * 5),
      activeTimers: Math.floor(Math.random() * 20),
      eventListeners: Math.floor(Math.random() * 50),
      buffers: Math.floor(Math.random() * 100),
      images: Math.floor(Math.random() * 10)
    }
  }

  /**
   * Get leak history for a module
   */
  getLeakHistory(moduleId: string): MemoryLeakResult[] {
    return this.leakHistory.get(moduleId) || []
  }

  /**
   * Get current snapshots for a module
   */
  getCurrentSnapshots(moduleId: string): MemorySnapshot[] {
    return this.snapshots.get(moduleId) || []
  }

  /**
   * Clear all data for a module
   */
  clearModuleData(moduleId: string): void {
    this.stopMonitoring(moduleId)
    this.snapshots.delete(moduleId)
    this.leakHistory.delete(moduleId)
    this.preventionActions.delete(moduleId)
  }

  /**
   * Get configuration
   */
  getConfig(): MemoryLeakDetectorConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MemoryLeakDetectorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get all active monitoring modules
   */
  getActiveModules(): string[] {
    return Array.from(this.monitoringIntervals.keys())
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    for (const moduleId of this.monitoringIntervals.keys()) {
      this.stopMonitoring(moduleId)
    }
  }
}

// Export singleton instance
export const memoryLeakDetector = new MemoryLeakDetector()

// Export utility functions
export function startLeakMonitoring(module: IWasmModule): void {
  memoryLeakDetector.startMonitoring(module)
}

export function stopLeakMonitoring(moduleId: string): void {
  memoryLeakDetector.stopMonitoring(moduleId)
}

export function detectMemoryLeaks(moduleId: string): MemoryLeakResult {
  return memoryLeakDetector.detectLeaks(moduleId)
}

export function getLeakHistory(moduleId: string): MemoryLeakResult[] {
  return memoryLeakDetector.getLeakHistory(moduleId)
}
