/**
 * Memory monitoring and profiling for WASM modules
 */

import { IWasmModule } from '../modules/interfaces/wasm-module.interface'

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /**
   * Total memory allocated to WASM module (bytes)
   */
  allocated: number

  /**
   * Memory currently used by WASM module (bytes)
   */
  used: number

  /**
   * Memory available for allocation (bytes)
   */
  available: number

  /**
   * Peak memory usage during execution (bytes)
   */
  peakUsage: number

  /**
   * Number of memory allocations
   */
  allocationCount: number

  /**
   * Number of memory deallocations
   */
  deallocationCount: number

  /**
   * Memory fragmentation ratio (0-1)
   */
  fragmentationRatio: number

  /**
   * Number of garbage collections
   */
  gcCount: number

  /**
   * Time spent in garbage collection (ms)
   */
  gcTime: number

  /**
   * Memory growth rate (bytes/second)
   */
  growthRate: number

  /**
   * Memory leak probability (0-1)
   */
  leakProbability: number
}

/**
 * Memory profile data
 */
export interface MemoryProfile {
  /**
   * Module identifier
   */
  moduleId: string

  /**
   * Profile timestamp
   */
  timestamp: Date

  /**
   * Current memory statistics
   */
  currentStats: MemoryStats

  /**
   * Memory statistics at start of profiling
   */
  baselineStats: MemoryStats

  /**
   * Memory usage timeline
   */
  timeline: Array<{
    timestamp: number
    memory: number
    operation: string
  }>

  /**
   * Largest memory allocations
   */
  largestAllocations: Array<{
    size: number
    timestamp: number
    operation: string
  }>

  /**
   * Memory hotspots (frequent allocations)
   */
  hotspots: Array<{
    operation: string
    count: number
    totalSize: number
    averageSize: number
  }>

  /**
   * Memory efficiency score (0-100)
   */
  efficiencyScore: number
}

/**
 * Memory warning levels
 */
export type MemoryWarningLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Memory warning event
 */
export interface MemoryWarning {
  level: MemoryWarningLevel
  message: string
  moduleId: string
  memoryUsage: number
  limit: number
  timestamp: Date
  suggestions: string[]
}

/**
 * Memory monitor configuration
 */
export interface MemoryMonitorConfig {
  /**
   * Memory monitoring interval in milliseconds
   */
  intervalMs: number

  /**
   * Memory warning thresholds (percentage of limit)
   */
  thresholds: {
    low: number
    medium: number
    high: number
    critical: number
  }

  /**
   * Maximum memory usage history to keep
   */
  maxHistorySize: number

  /**
   * Enable memory leak detection
   */
  leakDetection: boolean

  /**
   * Enable automatic garbage collection
   */
  autoGC: boolean

  /**
   * GC trigger threshold (percentage of limit)
   */
  gcThreshold: number

  /**
   * Enable memory profiling
   */
  profiling: boolean

  /**
   * Maximum profiling duration (ms)
   */
  maxProfilingDuration: number
}

/**
 * WASM Memory Monitor
 */
export class WasmMemoryMonitor {
  private monitors: Map<string, MemoryMonitorInstance> = new Map()
  private config: MemoryMonitorConfig
  private warningCallbacks: ((warning: MemoryWarning) => void)[] = []
  private profileCallbacks: ((profile: MemoryProfile) => void)[] = []

  constructor(config?: Partial<MemoryMonitorConfig>) {
    this.config = {
      intervalMs: 1000,
      thresholds: {
        low: 60,
        medium: 75,
        high: 85,
        critical: 95
      },
      maxHistorySize: 1000,
      leakDetection: true,
      autoGC: true,
      gcThreshold: 80,
      profiling: true,
      maxProfilingDuration: 60000,
      ...config
    }
  }

  /**
   * Start monitoring a WASM module
   */
  startMonitoring(module: IWasmModule, memoryLimit?: number): void {
    if (this.monitors.has(module.id)) {
      this.stopMonitoring(module.id)
    }

    const monitor = new MemoryMonitorInstance(
      module,
      this.config,
      memoryLimit,
      (warning) => this.handleWarning(warning),
      (profile) => this.handleProfile(profile)
    )

    this.monitors.set(module.id, monitor)
    monitor.start()
  }

  /**
   * Stop monitoring a WASM module
   */
  stopMonitoring(moduleId: string): void {
    const monitor = this.monitors.get(moduleId)
    if (monitor) {
      monitor.stop()
      this.monitors.delete(moduleId)
    }
  }

  /**
   * Get current memory statistics for a module
   */
  getMemoryStats(moduleId: string): MemoryStats | null {
    const monitor = this.monitors.get(moduleId)
    return monitor ? monitor.getCurrentStats() : null
  }

  /**
   * Get memory profile for a module
   */
  getMemoryProfile(moduleId: string): MemoryProfile | null {
    const monitor = this.monitors.get(moduleId)
    return monitor ? monitor.getProfile() : null
  }

  /**
   * Get all active monitors
   */
  getActiveMonitors(): string[] {
    return Array.from(this.monitors.keys())
  }

  /**
   * Get aggregated statistics for all monitored modules
   */
  getAggregatedStats(): {
    totalModules: number
    totalMemoryUsage: number
    totalAllocations: number
    averageEfficiency: number
    activeWarnings: MemoryWarning[]
  } {
    let totalMemoryUsage = 0
    let totalAllocations = 0
    let totalEfficiency = 0
    const activeWarnings: MemoryWarning[] = []

    for (const monitor of this.monitors.values()) {
      const stats = monitor.getCurrentStats()
      const warnings = monitor.getActiveWarnings()

      totalMemoryUsage += stats.used
      totalAllocations += stats.allocationCount
      totalEfficiency += monitor.getEfficiencyScore()
      activeWarnings.push(...warnings)
    }

    return {
      totalModules: this.monitors.size,
      totalMemoryUsage,
      totalAllocations,
      averageEfficiency: this.monitors.size > 0 ? totalEfficiency / this.monitors.size : 0,
      activeWarnings
    }
  }

  /**
   * Add warning callback
   */
  onWarning(callback: (warning: MemoryWarning) => void): void {
    this.warningCallbacks.push(callback)
  }

  /**
   * Add profile callback
   */
  onProfile(callback: (profile: MemoryProfile) => void): void {
    this.profileCallbacks.push(callback)
  }

  /**
   * Force garbage collection for all modules
   */
  forceGarbageCollection(): void {
    for (const monitor of this.monitors.values()) {
      monitor.forceGarbageCollection()
    }
  }

  /**
   * Set memory limit for a module
   */
  setMemoryLimit(moduleId: string, limit: number): void {
    const monitor = this.monitors.get(moduleId)
    if (monitor) {
      monitor.setMemoryLimit(limit)
    }
  }

  /**
   * Handle memory warning
   */
  private handleWarning(warning: MemoryWarning): void {
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning)
      } catch (error) {
        console.error('Error in memory warning callback:', error)
      }
    })
  }

  /**
   * Handle memory profile
   */
  private handleProfile(profile: MemoryProfile): void {
    this.profileCallbacks.forEach(callback => {
      try {
        callback(profile)
      } catch (error) {
        console.error('Error in memory profile callback:', error)
      }
    })
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    for (const moduleId of this.monitors.keys()) {
      this.stopMonitoring(moduleId)
    }
  }

  /**
   * Get configuration
   */
  getConfig(): MemoryMonitorConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MemoryMonitorConfig>): void {
    this.config = { ...this.config, ...config }

    // Update all active monitors with new config
    for (const monitor of this.monitors.values()) {
      monitor.updateConfig(this.config)
    }
  }
}

/**
 * Individual memory monitor instance for a WASM module
 */
class MemoryMonitorInstance {
  private module: IWasmModule
  private config: MemoryMonitorConfig
  private memoryLimit: number
  private intervalId: NodeJS.Timeout | null = null
  private isProfiling = false
  private profilingStartTime: number | null = null
  private profilingTimeout: NodeJS.Timeout | null = null

  private currentStats: MemoryStats
  private baselineStats: MemoryStats
  private memoryHistory: Array<{ timestamp: number; memory: number; operation: string }> = []
  private allocations: Array<{ size: number; timestamp: number; operation: string }> = []
  private operations: Map<string, { count: number; totalSize: number }> = new Map()
  private activeWarnings: MemoryWarning[] = []
  private lastGC = 0

  private warningCallback: (warning: MemoryWarning) => void
  private profileCallback: (profile: MemoryProfile) => void

  constructor(
    module: IWasmModule,
    config: MemoryMonitorConfig,
    memoryLimit: number = 64 * 1024 * 1024, // 64MB default
    warningCallback: (warning: MemoryWarning) => void,
    profileCallback: (profile: MemoryProfile) => void
  ) {
    this.module = module
    this.config = config
    this.memoryLimit = memoryLimit
    this.warningCallback = warningCallback
    this.profileCallback = profileCallback

    this.currentStats = this.createEmptyStats()
    this.baselineStats = this.createEmptyStats()
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.intervalId) {
      return
    }

    // Initialize baseline stats
    this.baselineStats = this.measureMemory()
    this.currentStats = { ...this.baselineStats }

    // Start periodic monitoring
    this.intervalId = setInterval(() => {
      this.tick()
    }, this.config.intervalMs)

    // Start profiling if enabled
    if (this.config.profiling) {
      this.startProfiling()
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.profilingTimeout) {
      clearTimeout(this.profilingTimeout)
      this.profilingTimeout = null
    }

    this.isProfiling = false

    // Generate final profile
    if (this.memoryHistory.length > 0) {
      this.generateProfile()
    }
  }

  /**
   * Start memory profiling
   */
  startProfiling(): void {
    if (this.isProfiling) {
      return
    }

    this.isProfiling = true
    this.profilingStartTime = Date.now()
    this.memoryHistory = []
    this.allocations = []
    this.operations.clear()

    // Set profiling timeout
    this.profilingTimeout = setTimeout(() => {
      this.stopProfiling()
    }, this.config.maxProfilingDuration)
  }

  /**
   * Stop memory profiling
   */
  stopProfiling(): void {
    if (!this.isProfiling) {
      return
    }

    this.isProfiling = false

    if (this.profilingTimeout) {
      clearTimeout(this.profilingTimeout)
      this.profilingTimeout = null
    }

    this.generateProfile()
  }

  /**
   * Monitor tick - called periodically
   */
  private tick(): void {
    try {
      const newStats = this.measureMemory()
      const previousStats = this.currentStats
      this.currentStats = newStats

      // Record memory history
      this.memoryHistory.push({
        timestamp: Date.now(),
        memory: newStats.used,
        operation: 'monitor_tick'
      })

      // Limit history size
      if (this.memoryHistory.length > this.config.maxHistorySize) {
        this.memoryHistory.splice(0, this.memoryHistory.length - this.config.maxHistorySize)
      }

      // Check for memory warnings
      this.checkMemoryWarnings(newStats)

      // Detect memory leaks
      if (this.config.leakDetection) {
        this.detectMemoryLeaks(newStats, previousStats)
      }

      // Auto garbage collection
      if (this.config.autoGC) {
        this.checkAutoGC(newStats)
      }

      // Update operation tracking
      this.updateOperationTracking(newStats, previousStats)
    } catch (error) {
      console.error(`Memory monitoring error for module ${this.module.id}:`, error)
    }
  }

  /**
   * Measure current memory usage
   */
  private measureMemory(): MemoryStats {
    // In a real implementation, this would interact with the WASM module
    // to get actual memory statistics. For now, we'll simulate it.

    const metadata = this.module.getMetadata()
    const allocated = metadata.memoryUsage || 0
    const used = Math.min(allocated, Math.floor(allocated * (0.6 + Math.random() * 0.3)))
    const available = allocated - used

    // Calculate derived metrics
    const allocationCount = metadata.executionCount || 0
    const deallocationCount = Math.floor(allocationCount * 0.9)
    const fragmentationRatio = allocated > 0 ? 1 - (used / allocated) : 0
    const gcCount = Math.floor(Math.random() * 10)
    const gcTime = gcCount * (10 + Math.random() * 50)

    // Calculate growth rate based on recent history
    let growthRate = 0
    if (this.memoryHistory.length > 10) {
      const recent = this.memoryHistory.slice(-10)
      const oldest = recent[0].memory
      const newest = recent[recent.length - 1].memory
      const timeDiff = (newest - oldest) / 1000 // seconds
      if (timeDiff > 0) {
        growthRate = (newest.memory - oldest.memory) / timeDiff
      }
    }

    // Calculate leak probability
    const leakProbability = this.calculateLeakProbability()

    return {
      allocated,
      used,
      available,
      peakUsage: Math.max(used, this.currentStats.peakUsage),
      allocationCount,
      deallocationCount,
      fragmentationRatio,
      gcCount,
      gcTime,
      growthRate,
      leakProbability
    }
  }

  /**
   * Check for memory warnings
   */
  private checkMemoryWarnings(stats: MemoryStats): void {
    const usagePercentage = this.memoryLimit > 0 ? (stats.used / this.memoryLimit) * 100 : 0

    // Clear old warnings
    this.activeWarnings = this.activeWarnings.filter(w =>
      Date.now() - w.timestamp.getTime() < 60000 // Keep warnings for 1 minute
    )

    let level: MemoryWarningLevel | null = null
    let message = ''

    if (usagePercentage >= this.config.thresholds.critical) {
      level = 'critical'
      message = `Critical memory usage: ${usagePercentage.toFixed(1)}% of limit`
    } else if (usagePercentage >= this.config.thresholds.high) {
      level = 'high'
      message = `High memory usage: ${usagePercentage.toFixed(1)}% of limit`
    } else if (usagePercentage >= this.config.thresholds.medium) {
      level = 'medium'
      message = `Medium memory usage: ${usagePercentage.toFixed(1)}% of limit`
    } else if (usagePercentage >= this.config.thresholds.low) {
      level = 'low'
      message = `Memory usage rising: ${usagePercentage.toFixed(1)}% of limit`
    }

    if (level) {
      const warning: MemoryWarning = {
        level,
        message,
        moduleId: this.module.id,
        memoryUsage: stats.used,
        limit: this.memoryLimit,
        timestamp: new Date(),
        suggestions: this.getSuggestions(level, usagePercentage)
      }

      // Check if we already have a similar recent warning
      const hasSimilarWarning = this.activeWarnings.some(w =>
        w.level === level &&
        Math.abs(w.memoryUsage - warning.memoryUsage) < (this.memoryLimit * 0.05)
      )

      if (!hasSimilarWarning) {
        this.activeWarnings.push(warning)
        this.warningCallback(warning)
      }
    }
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(currentStats: MemoryStats, previousStats: MemoryStats): void {
    const growthRate = currentStats.growthRate
    const fragmentation = currentStats.fragmentationRatio
    const leakProbability = currentStats.leakProbability

    // Update leak probability based on patterns
    if (growthRate > 1024) { // Growing faster than 1KB/s
      currentStats.leakProbability = Math.min(1, leakProbability + 0.1)
    }

    if (fragmentation > 0.8) { // High fragmentation
      currentStats.leakProbability = Math.min(1, leakProbability + 0.05)
    }

    // Trigger warning if leak probability is high
    if (leakProbability > 0.7) {
      const warning: MemoryWarning = {
        level: 'high',
        message: `Memory leak detected with ${(leakProbability * 100).toFixed(1)}% probability`,
        moduleId: this.module.id,
        memoryUsage: currentStats.used,
        limit: this.memoryLimit,
        timestamp: new Date(),
        suggestions: [
          'Check for circular references in data structures',
          'Ensure proper cleanup of event listeners and callbacks',
          'Review large object allocations',
          'Consider implementing object pooling',
          'Check for unclosed database connections or file handles'
        ]
      }

      const hasLeakWarning = this.activeWarnings.some(w =>
        w.message.includes('Memory leak detected')
      )

      if (!hasLeakWarning) {
        this.activeWarnings.push(warning)
        this.warningCallback(warning)
      }
    }
  }

  /**
   * Check if automatic garbage collection should be triggered
   */
  private checkAutoGC(stats: MemoryStats): void {
    const usagePercentage = this.memoryLimit > 0 ? (stats.used / this.memoryLimit) * 100 : 0
    const now = Date.now()

    if (usagePercentage >= this.config.gcThreshold &&
        (now - this.lastGC) > 5000) { // At least 5 seconds between GCs
      this.forceGarbageCollection()
      this.lastGC = now
    }
  }

  /**
   * Update operation tracking
   */
  private updateOperationTracking(currentStats: MemoryStats, previousStats: MemoryStats): void {
    const memoryDiff = currentStats.used - previousStats.used

    if (Math.abs(memoryDiff) > 1024) { // Only track changes > 1KB
      const operation = memoryDiff > 0 ? 'allocation' : 'deallocation'
      const size = Math.abs(memoryDiff)

      // Track allocations
      if (memoryDiff > 0) {
        this.allocations.push({
          size,
          timestamp: Date.now(),
          operation
        })

        // Keep only largest allocations
        this.allocations.sort((a, b) => b.size - a.size)
        if (this.allocations.length > 50) {
          this.allocations = this.allocations.slice(0, 50)
        }
      }

      // Update operation statistics
      const existing = this.operations.get(operation) || { count: 0, totalSize: 0 }
      existing.count++
      existing.totalSize += size
      this.operations.set(operation, existing)
    }
  }

  /**
   * Calculate memory leak probability
   */
  private calculateLeakProbability(): number {
    let probability = 0

    // Factor 1: Memory growth trend
    if (this.memoryHistory.length > 20) {
      const recent = this.memoryHistory.slice(-20)
      const slope = this.calculateSlope(recent.map(h => h.memory))
      if (slope > 100) { // Growing faster than 100B per tick
        probability += 0.3
      }
    }

    // Factor 2: Fragmentation ratio
    if (this.currentStats.fragmentationRatio > 0.7) {
      probability += 0.2
    }

    // Factor 3: Allocation/deallocation imbalance
    const allocRatio = this.currentStats.allocationCount > 0 ?
      this.currentStats.deallocationCount / this.currentStats.allocationCount : 1
    if (allocRatio < 0.8) { // Significantly more allocations than deallocations
      probability += 0.3
    }

    // Factor 4: Peak usage pattern
    if (this.currentStats.peakUsage > this.currentStats.used * 1.5) {
      probability += 0.1
    }

    return Math.min(1, probability)
  }

  /**
   * Calculate slope of memory usage trend
   */
  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += values[i]
      sumXY += i * values[i]
      sumX2 += i * i
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope || 0
  }

  /**
   * Generate memory profile
   */
  private generateProfile(): void {
    if (!this.profilingStartTime) {
      return
    }

    const hotspots = Array.from(this.operations.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        totalSize: stats.totalSize,
        averageSize: stats.totalSize / stats.count
      }))
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 10)

    const efficiencyScore = this.calculateEfficiencyScore()

    const profile: MemoryProfile = {
      moduleId: this.module.id,
      timestamp: new Date(),
      currentStats: this.currentStats,
      baselineStats: this.baselineStats,
      timeline: this.memoryHistory,
      largestAllocations: this.allocations,
      hotspots,
      efficiencyScore
    }

    this.profileCallback(profile)
  }

  /**
   * Calculate memory efficiency score (0-100)
   */
  private calculateEfficiencyScore(): number {
    let score = 100

    // Penalize high fragmentation
    score -= this.currentStats.fragmentationRatio * 30

    // Penalize high leak probability
    score -= this.currentStats.leakProbability * 40

    // Penalize excessive GC
    if (this.currentStats.gcCount > 10) {
      score -= 20
    }

    // Reward good allocation/deallocation ratio
    const allocRatio = this.currentStats.allocationCount > 0 ?
      this.currentStats.deallocationCount / this.currentStats.allocationCount : 1
    if (allocRatio > 0.95) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get suggestions for memory warnings
   */
  private getSuggestions(level: MemoryWarningLevel, usagePercentage: number): string[] {
    const suggestions: string[] = []

    switch (level) {
      case 'critical':
        suggestions.push(
          'Immediately free unused memory',
          'Consider restarting the module',
          'Reduce memory limits or process in smaller chunks',
          'Check for memory leaks in the code'
        )
        break
      case 'high':
        suggestions.push(
          'Optimize data structures',
          'Implement memory pooling',
          'Process data in smaller batches',
          'Review large object allocations'
        )
        break
      case 'medium':
        suggestions.push(
          'Monitor memory usage trends',
          'Consider garbage collection',
          'Optimize algorithms for lower memory footprint'
        )
        break
      case 'low':
        suggestions.push(
          'Keep monitoring memory usage',
          'Consider pre-allocating memory buffers'
        )
        break
    }

    return suggestions
  }

  /**
   * Create empty memory stats
   */
  private createEmptyStats(): MemoryStats {
    return {
      allocated: 0,
      used: 0,
      available: 0,
      peakUsage: 0,
      allocationCount: 0,
      deallocationCount: 0,
      fragmentationRatio: 0,
      gcCount: 0,
      gcTime: 0,
      growthRate: 0,
      leakProbability: 0
    }
  }

  /**
   * Get current memory statistics
   */
  getCurrentStats(): MemoryStats {
    return { ...this.currentStats }
  }

  /**
   * Get memory profile
   */
  getProfile(): MemoryProfile | null {
    if (!this.isProfiling) {
      return null
    }

    return {
      moduleId: this.module.id,
      timestamp: new Date(),
      currentStats: this.currentStats,
      baselineStats: this.baselineStats,
      timeline: [...this.memoryHistory],
      largestAllocations: [...this.allocations],
      hotspots: Array.from(this.operations.entries())
        .map(([operation, stats]) => ({
          operation,
          count: stats.count,
          totalSize: stats.totalSize,
          averageSize: stats.totalSize / stats.count
        }))
        .sort((a, b) => b.totalSize - a.totalSize)
        .slice(0, 10),
      efficiencyScore: this.calculateEfficiencyScore()
    }
  }

  /**
   * Get active warnings
   */
  getActiveWarnings(): MemoryWarning[] {
    return [...this.activeWarnings]
  }

  /**
   * Get efficiency score
   */
  getEfficiencyScore(): number {
    return this.calculateEfficiencyScore()
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): void {
    // In a real implementation, this would trigger GC in the WASM module
    // For now, we'll simulate it
    this.currentStats.gcCount++
    this.currentStats.gcTime += 20 + Math.random() * 50

    // Simulate memory reduction
    const reduction = this.currentStats.used * (0.1 + Math.random() * 0.2)
    this.currentStats.used = Math.max(0, this.currentStats.used - reduction)
    this.currentStats.available = this.currentStats.allocated - this.currentStats.used
  }

  /**
   * Set memory limit
   */
  setMemoryLimit(limit: number): void {
    this.memoryLimit = limit
  }

  /**
   * Update configuration
   */
  updateConfig(config: MemoryMonitorConfig): void {
    this.config = config

    // Restart monitoring with new interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = setInterval(() => {
        this.tick()
      }, this.config.intervalMs)
    }
  }
}

// Export singleton instance
export const wasmMemoryMonitor = new WasmMemoryMonitor()

// Export utility functions
export function createMemoryMonitor(config?: Partial<MemoryMonitorConfig>): WasmMemoryMonitor {
  return new WasmMemoryMonitor(config)
}

export function startMonitoring(module: IWasmModule, memoryLimit?: number): void {
  wasmMemoryMonitor.startMonitoring(module, memoryLimit)
}

export function stopMonitoring(moduleId: string): void {
  wasmMemoryMonitor.stopMonitoring(moduleId)
}

export function getMemoryStats(moduleId: string): MemoryStats | null {
  return wasmMemoryMonitor.getMemoryStats(moduleId)
}

export function getMemoryProfile(moduleId: string): MemoryProfile | null {
  return wasmMemoryMonitor.getMemoryProfile(moduleId)
}
