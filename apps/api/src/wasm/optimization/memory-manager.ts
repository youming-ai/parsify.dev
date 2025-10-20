/**
 * Memory usage limits and garbage collection for WASM modules
 */

import { IWasmModule } from '../modules/interfaces/wasm-module.interface'
import { MemoryStats } from './memory-monitor'

/**
 * Memory limit configuration
 */
export interface MemoryLimitConfig {
  /**
   * Hard memory limit in bytes
   */
  hardLimit: number

  /**
   * Soft memory limit in bytes (triggers warnings)
   */
  softLimit: number

  /**
   * Critical memory limit in bytes (triggers aggressive cleanup)
   */
  criticalLimit: number

  /**
   * Memory growth rate limit in bytes per second
   */
  growthRateLimit: number

  /**
   * Maximum allocation size in bytes
   */
  maxAllocationSize: number

  /**
   * Memory quota reset interval in milliseconds
   */
  quotaResetInterval: number

  /**
   * Enable memory quotas
   */
  enableQuotas: boolean
}

/**
 * Garbage collection configuration
 */
export interface GarbageCollectionConfig {
  /**
   * Enable automatic garbage collection
   */
  autoGC: boolean

  /**
   * GC trigger threshold (percentage of soft limit)
   */
  gcThreshold: number

  /**
   * Aggressive GC trigger threshold (percentage of critical limit)
   */
  aggressiveGCThreshold: number

  /**
   * Minimum interval between GC cycles in milliseconds
   */
  minGCInterval: number

  /**
   * Maximum GC duration in milliseconds
   */
  maxGCDuration: number

  /**
   * Enable incremental GC
   */
  incrementalGC: boolean

  /**
   * GC strategy
   */
  strategy: 'conservative' | 'balanced' | 'aggressive'

  /**
   * Enable memory compaction
   */
  enableCompaction: boolean

  /**
   * Compaction threshold (percentage of fragmentation)
   */
  compactionThreshold: number
}

/**
 * Memory manager configuration
 */
export interface MemoryManagerConfig {
  /**
   * Memory limits configuration
   */
  limits: MemoryLimitConfig

  /**
   * Garbage collection configuration
   */
  gc: GarbageCollectionConfig

  /**
   * Monitoring interval in milliseconds
   */
  monitoringInterval: number

  /**
   * Enable memory pressure handling
   */
  enablePressureHandling: boolean

  /**
   * Memory pressure handlers
   */
  pressureHandlers: PressureHandler[]

  /**
   * Enable memory budget tracking
   */
  enableBudgetTracking: boolean

  /**
   * Memory budget in bytes per time window
   */
  memoryBudget: number

  /**
   * Budget time window in milliseconds
   */
  budgetWindow: number
}

/**
 * Memory pressure level
 */
export type MemoryPressureLevel = 'normal' | 'moderate' | 'high' | 'critical'

/**
 * Memory pressure handler
 */
export interface PressureHandler {
  level: MemoryPressureLevel
  handler: (context: MemoryPressureContext) => void
  priority: number
}

/**
 * Memory pressure context
 */
export interface MemoryPressureContext {
  moduleId: string
  currentUsage: number
  softLimit: number
  hardLimit: number
  pressureLevel: MemoryPressureLevel
  growthRate: number
  fragmentation: number
  availableActions: string[]
}

/**
 * Memory quota information
 */
export interface MemoryQuota {
  allocated: number
  used: number
  remaining: number
  resetTime: number
  windowStart: number
  windowEnd: number
}

/**
 * GC statistics
 */
export interface GCStats {
  totalGCs: number
  totalGCTime: number
  averageGCTime: number
  lastGCTime: number
  lastGCType: 'minor' | 'major' | 'incremental' | 'compaction'
  memoryReclaimed: number
  gcEfficiency: number
}

/**
 * Memory manager for WASM modules
 */
export class WasmMemoryManager {
  private config: MemoryManagerConfig
  private modules: Map<string, ManagedModule> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null
  private gcScheduler: GCScheduler
  private budgetTracker: MemoryBudgetTracker
  private pressureHandlers: PressureHandler[] = []

  constructor(config?: Partial<MemoryManagerConfig>) {
    this.config = {
      limits: {
        hardLimit: 64 * 1024 * 1024, // 64MB
        softLimit: 48 * 1024 * 1024, // 48MB
        criticalLimit: 56 * 1024 * 1024, // 56MB
        growthRateLimit: 1024 * 1024, // 1MB/s
        maxAllocationSize: 10 * 1024 * 1024, // 10MB
        quotaResetInterval: 60000, // 1 minute
        enableQuotas: true
      },
      gc: {
        autoGC: true,
        gcThreshold: 75, // 75% of soft limit
        aggressiveGCThreshold: 90, // 90% of critical limit
        minGCInterval: 5000, // 5 seconds
        maxGCDuration: 100, // 100ms
        incrementalGC: true,
        strategy: 'balanced',
        enableCompaction: true,
        compactionThreshold: 70 // 70% fragmentation
      },
      monitoringInterval: 1000, // 1 second
      enablePressureHandling: true,
      pressureHandlers: [],
      enableBudgetTracking: true,
      memoryBudget: 100 * 1024 * 1024, // 100MB per minute
      budgetWindow: 60000 // 1 minute
    }

    if (config) {
      this.config = this.mergeConfig(this.config, config)
    }

    this.gcScheduler = new GCScheduler(this.config.gc)
    this.budgetTracker = new MemoryBudgetTracker(this.config)
    this.setupDefaultPressureHandlers()

    if (this.config.enablePressureHandling) {
      this.startMonitoring()
    }
  }

  /**
   * Register a WASM module for memory management
   */
  registerModule(module: IWasmModule, customLimits?: Partial<MemoryLimitConfig>): void {
    const moduleId = module.id
    const limits = { ...this.config.limits, ...customLimits }

    const managedModule = new ManagedModule(
      module,
      limits,
      this.config.gc,
      this.budgetTracker
    )

    this.modules.set(moduleId, managedModule)
    console.log(`Registered module ${moduleId} with memory limits`)
  }

  /**
   * Unregister a WASM module
   */
  unregisterModule(moduleId: string): void {
    const module = this.modules.get(moduleId)
    if (module) {
      module.dispose()
      this.modules.delete(moduleId)
      console.log(`Unregistered module ${moduleId}`)
    }
  }

  /**
   * Check if a memory allocation is allowed
   */
  canAllocate(moduleId: string, size: number): boolean {
    const module = this.modules.get(moduleId)
    if (!module) return false

    return module.canAllocate(size)
  }

  /**
   * Record a memory allocation
   */
  recordAllocation(moduleId: string, size: number): boolean {
    const module = this.modules.get(moduleId)
    if (!module) return false

    return module.recordAllocation(size)
  }

  /**
   * Record a memory deallocation
   */
  recordDeallocation(moduleId: string, size: number): void {
    const module = this.modules.get(moduleId)
    if (module) {
      module.recordDeallocation(size)
    }
  }

  /**
   * Get current memory usage for a module
   */
  getMemoryUsage(moduleId: string): MemoryUsage | null {
    const module = this.modules.get(moduleId)
    return module ? module.getMemoryUsage() : null
  }

  /**
   * Get memory statistics for all modules
   */
  getAggregateStats(): AggregateMemoryStats {
    const stats: AggregateMemoryStats = {
      totalModules: this.modules.size,
      totalAllocated: 0,
      totalUsed: 0,
      totalAvailable: 0,
      averageUsage: 0,
      peakUsage: 0,
      fragmentationRatio: 0,
      gcStats: this.gcScheduler.getStats(),
      quotaUtilization: this.budgetTracker.getUtilization(),
      pressureDistribution: this.calculatePressureDistribution()
    }

    let totalUsage = 0
    let maxUsage = 0
    let totalFragmentation = 0

    for (const module of this.modules.values()) {
      const usage = module.getMemoryUsage()
      stats.totalAllocated += usage.allocated
      stats.totalUsed += usage.used
      stats.totalAvailable += usage.available
      totalUsage += usage.used
      maxUsage = Math.max(maxUsage, usage.used)
      totalFragmentation += usage.fragmentationRatio
    }

    stats.averageUsage = this.modules.size > 0 ? totalUsage / this.modules.size : 0
    stats.peakUsage = maxUsage
    stats.fragmentationRatio = this.modules.size > 0 ? totalFragmentation / this.modules.size : 0

    return stats
  }

  /**
   * Trigger garbage collection for a module
   */
  triggerGC(moduleId: string, aggressive = false): Promise<GCResult> {
    const module = this.modules.get(moduleId)
    if (!module) {
      return Promise.resolve({
        success: false,
        memoryReclaimed: 0,
        duration: 0,
        type: aggressive ? 'major' : 'minor',
        error: 'Module not found'
      })
    }

    return this.gcScheduler.triggerGC(module, aggressive)
  }

  /**
   * Trigger garbage collection for all modules
   */
  triggerGlobalGC(aggressive = false): Promise<GCResult[]> {
    const promises = Array.from(this.modules.keys()).map(moduleId =>
      this.triggerGC(moduleId, aggressive)
    )

    return Promise.all(promises)
  }

  /**
   * Set memory limits for a module
   */
  setMemoryLimits(moduleId: string, limits: Partial<MemoryLimitConfig>): void {
    const module = this.modules.get(moduleId)
    if (module) {
      module.updateLimits(limits)
    }
  }

  /**
   * Get memory quota information
   */
  getMemoryQuota(moduleId: string): MemoryQuota | null {
    const module = this.modules.get(moduleId)
    return module ? module.getQuota() : null
  }

  /**
   * Add custom pressure handler
   */
  addPressureHandler(handler: PressureHandler): void {
    this.pressureHandlers.push(handler)
    this.pressureHandlers.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove pressure handler
   */
  removePressureHandler(handler: PressureHandler): void {
    const index = this.pressureHandlers.indexOf(handler)
    if (index > -1) {
      this.pressureHandlers.splice(index, 1)
    }
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      return
    }

    this.monitoringInterval = setInterval(() => {
      this.monitorMemoryPressure()
    }, this.config.monitoringInterval)
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Monitor memory pressure across all modules
   */
  private monitorMemoryPressure(): void {
    for (const [moduleId, module] of this.modules) {
      const pressure = module.assessMemoryPressure()

      if (pressure.level !== 'normal') {
        this.handleMemoryPressure(moduleId, pressure)
      }
    }
  }

  /**
   * Handle memory pressure for a module
   */
  private handleMemoryPressure(moduleId: string, pressure: MemoryPressureContext): void {
    console.warn(`Memory pressure detected for module ${moduleId}: ${pressure.level}`)

    // Find applicable handlers
    const applicableHandlers = this.pressureHandlers.filter(
      handler => this.isPressureLevelMatch(handler.level, pressure.level)
    )

    // Execute handlers in priority order
    for (const handler of applicableHandlers) {
      try {
        handler.handler(pressure)
      } catch (error) {
        console.error(`Error in pressure handler for module ${moduleId}:`, error)
      }
    }

    // Trigger appropriate GC based on pressure level
    if (pressure.level === 'critical') {
      this.triggerGC(moduleId, true)
    } else if (pressure.level === 'high') {
      this.triggerGC(moduleId, false)
    }
  }

  /**
   * Check if pressure level matches handler level
   */
  private isPressureLevelMatch(handlerLevel: MemoryPressureLevel, currentLevel: MemoryPressureLevel): boolean {
    const levels: MemoryPressureLevel[] = ['normal', 'moderate', 'high', 'critical']
    const handlerIndex = levels.indexOf(handlerLevel)
    const currentIndex = levels.indexOf(currentLevel)

    return currentIndex >= handlerIndex
  }

  /**
   * Setup default pressure handlers
   */
  private setupDefaultPressureHandlers(): void {
    // Moderate pressure handler
    this.addPressureHandler({
      level: 'moderate',
      priority: 1,
      handler: (context) => {
        console.log(`Moderate pressure for ${context.moduleId}, initiating cleanup`)
        // Trigger cleanup actions
      }
    })

    // High pressure handler
    this.addPressureHandler({
      level: 'high',
      priority: 2,
      handler: (context) => {
        console.log(`High pressure for ${context.moduleId}, clearing caches`)
        // Clear caches and non-essential data
      }
    })

    // Critical pressure handler
    this.addPressureHandler({
      level: 'critical',
      priority: 3,
      handler: (context) => {
        console.log(`Critical pressure for ${context.moduleId}, emergency cleanup`)
        // Emergency cleanup actions
      }
    })
  }

  /**
   * Calculate pressure distribution across modules
   */
  private calculatePressureDistribution(): Record<MemoryPressureLevel, number> {
    const distribution: Record<MemoryPressureLevel, number> = {
      normal: 0,
      moderate: 0,
      high: 0,
      critical: 0
    }

    for (const module of this.modules.values()) {
      const pressure = module.assessMemoryPressure()
      distribution[pressure.level]++
    }

    return distribution
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(base: MemoryManagerConfig, override: Partial<MemoryManagerConfig>): MemoryManagerConfig {
    return {
      ...base,
      limits: { ...base.limits, ...override.limits },
      gc: { ...base.gc, ...override.gc },
      monitoringInterval: override.monitoringInterval ?? base.monitoringInterval,
      enablePressureHandling: override.enablePressureHandling ?? base.enablePressureHandling,
      pressureHandlers: override.pressureHandlers ?? base.pressureHandlers,
      enableBudgetTracking: override.enableBudgetTracking ?? base.enableBudgetTracking,
      memoryBudget: override.memoryBudget ?? base.memoryBudget,
      budgetWindow: override.budgetWindow ?? base.budgetWindow
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stopMonitoring()

    for (const [moduleId, module] of this.modules) {
      module.dispose()
    }

    this.modules.clear()
    this.gcScheduler.dispose()
    this.budgetTracker.dispose()
  }
}

/**
 * Managed module wrapper
 */
class ManagedModule {
  private module: IWasmModule
  private limits: MemoryLimitConfig
  private gcConfig: GarbageCollectionConfig
  private budgetTracker: MemoryBudgetTracker
  private currentUsage: MemoryUsage
  private lastGC = 0
  private gcStats: GCStats = {
    totalGCs: 0,
    totalGCTime: 0,
    averageGCTime: 0,
    lastGCTime: 0,
    lastGCType: 'minor',
    memoryReclaimed: 0,
    gcEfficiency: 0
  }

  constructor(
    module: IWasmModule,
    limits: MemoryLimitConfig,
    gcConfig: GarbageCollectionConfig,
    budgetTracker: MemoryBudgetTracker
  ) {
    this.module = module
    this.limits = limits
    this.gcConfig = gcConfig
    this.budgetTracker = budgetTracker
    this.currentUsage = this.initializeMemoryUsage()
  }

  /**
   * Check if allocation is allowed
   */
  canAllocate(size: number): boolean {
    // Check allocation size limit
    if (size > this.limits.maxAllocationSize) {
      return false
    }

    // Check hard limit
    if (this.currentUsage.used + size > this.limits.hardLimit) {
      return false
    }

    // Check quota
    if (this.limits.enableQuotas && !this.budgetTracker.canConsume(this.module.id, size)) {
      return false
    }

    return true
  }

  /**
   * Record a memory allocation
   */
  recordAllocation(size: number): boolean {
    if (!this.canAllocate(size)) {
      return false
    }

    this.currentUsage.used += size
    this.currentUsage.allocated += size

    if (this.currentUsage.used > this.currentUsage.peakUsage) {
      this.currentUsage.peakUsage = this.currentUsage.used
    }

    if (this.limits.enableQuotas) {
      this.budgetTracker.consume(this.module.id, size)
    }

    return true
  }

  /**
   * Record a memory deallocation
   */
  recordDeallocation(size: number): void {
    this.currentUsage.used = Math.max(0, this.currentUsage.used - size)
    this.currentUsage.deallocated += size
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    return { ...this.currentUsage }
  }

  /**
   * Get memory quota information
   */
  getQuota(): MemoryQuota {
    return this.budgetTracker.getQuota(this.module.id)
  }

  /**
   * Assess memory pressure
   */
  assessMemoryPressure(): MemoryPressureContext {
    const usageRatio = this.currentUsage.used / this.limits.softLimit
    let level: MemoryPressureLevel = 'normal'

    if (this.currentUsage.used >= this.limits.criticalLimit) {
      level = 'critical'
    } else if (this.currentUsage.used >= this.limits.hardLimit) {
      level = 'critical'
    } else if (usageRatio >= 0.9) {
      level = 'high'
    } else if (usageRatio >= 0.75) {
      level = 'moderate'
    }

    const growthRate = this.calculateGrowthRate()
    const fragmentation = this.calculateFragmentation()

    return {
      moduleId: this.module.id,
      currentUsage: this.currentUsage.used,
      softLimit: this.limits.softLimit,
      hardLimit: this.limits.hardLimit,
      pressureLevel: level,
      growthRate,
      fragmentation,
      availableActions: this.getAvailableActions(level)
    }
  }

  /**
   * Update memory limits
   */
  updateLimits(newLimits: Partial<MemoryLimitConfig>): void {
    this.limits = { ...this.limits, ...newLimits }
  }

  /**
   * Update GC statistics
   */
  updateGCStats(result: GCResult): void {
    this.gcStats.totalGCs++
    this.gcStats.totalGCTime += result.duration
    this.gcStats.averageGCTime = this.gcStats.totalGCTime / this.gcStats.totalGCs
    this.gcStats.lastGCTime = result.duration
    this.gcStats.lastGCType = result.type
    this.gcStats.memoryReclaimed += result.memoryReclaimed
    this.gcStats.gcEfficiency = result.duration > 0 ? result.memoryReclaimed / result.duration : 0
    this.lastGC = Date.now()

    // Update memory usage after GC
    if (result.memoryReclaimed > 0) {
      this.currentUsage.used = Math.max(0, this.currentUsage.used - result.memoryReclaimed)
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Module cleanup would be handled by the module itself
  }

  /**
   * Initialize memory usage
   */
  private initializeMemoryUsage(): MemoryUsage {
    const metadata = this.module.getMetadata()
    return {
      allocated: metadata.memoryUsage || 0,
      used: metadata.memoryUsage || 0,
      available: this.limits.hardLimit - (metadata.memoryUsage || 0),
      peakUsage: metadata.memoryUsage || 0,
      deallocated: 0,
      fragmentationRatio: 0
    }
  }

  /**
   * Calculate memory growth rate
   */
  private calculateGrowthRate(): number {
    // In a real implementation, this would track memory over time
    return Math.random() * 1024 // Random growth rate for simulation
  }

  /**
   * Calculate memory fragmentation ratio
   */
  private calculateFragmentation(): number {
    const allocated = this.currentUsage.allocated
    const used = this.currentUsage.used

    return allocated > 0 ? 1 - (used / allocated) : 0
  }

  /**
   * Get available actions for pressure level
   */
  private getAvailableActions(level: MemoryPressureLevel): string[] {
    const actions: string[] = ['monitor']

    switch (level) {
      case 'moderate':
        actions.push('cleanup', 'cache_clear')
        break
      case 'high':
        actions.push('aggressive_cleanup', 'gc_trigger', 'resource_release')
        break
      case 'critical':
        actions.push('emergency_cleanup', 'force_gc', 'memory_compaction')
        break
    }

    return actions
  }
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
  allocated: number
  used: number
  available: number
  peakUsage: number
  deallocated: number
  fragmentationRatio: number
}

/**
 * Aggregate memory statistics
 */
export interface AggregateMemoryStats {
  totalModules: number
  totalAllocated: number
  totalUsed: number
  totalAvailable: number
  averageUsage: number
  peakUsage: number
  fragmentationRatio: number
  gcStats: GCStats
  quotaUtilization: number
  pressureDistribution: Record<MemoryPressureLevel, number>
}

/**
 * GC operation result
 */
export interface GCResult {
  success: boolean
  memoryReclaimed: number
  duration: number
  type: 'minor' | 'major' | 'incremental' | 'compaction'
  error?: string
}

/**
 * Garbage collection scheduler
 */
class GCScheduler {
  private config: GarbageCollectionConfig
  private stats: GCStats
  private isRunning = false

  constructor(config: GarbageCollectionConfig) {
    this.config = config
    this.stats = {
      totalGCs: 0,
      totalGCTime: 0,
      averageGCTime: 0,
      lastGCTime: 0,
      lastGCType: 'minor',
      memoryReclaimed: 0,
      gcEfficiency: 0
    }
  }

  /**
   * Trigger garbage collection for a module
   */
  async triggerGC(module: ManagedModule, aggressive = false): Promise<GCResult> {
    if (this.isRunning && !this.config.incrementalGC) {
      return {
        success: false,
        memoryReclaimed: 0,
        duration: 0,
        type: aggressive ? 'major' : 'minor',
        error: 'GC already in progress'
      }
    }

    const startTime = Date.now()
    const type = aggressive ? 'major' : 'minor'

    try {
      this.isRunning = true

      // Simulate GC process
      const memoryBefore = module.getMemoryUsage().used
      const memoryReclaimed = this.simulateGC(aggressive)
      const duration = Date.now() - startTime

      const result: GCResult = {
        success: true,
        memoryReclaimed,
        duration,
        type
      }

      // Update statistics
      module.updateGCStats(result)
      this.updateStats(result)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        success: false,
        memoryReclaimed: 0,
        duration,
        type,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Simulate garbage collection
   */
  private simulateGC(aggressive: boolean): number {
    // In a real implementation, this would trigger actual GC in the WASM module
    const baseReclaim = aggressive ? 0.3 : 0.1 // 30% or 10% of current usage
    return Math.floor(Math.random() * 1024 * 1024 * baseReclaim)
  }

  /**
   * Update GC statistics
   */
  private updateStats(result: GCResult): void {
    this.stats.totalGCs++
    this.stats.totalGCTime += result.duration
    this.stats.averageGCTime = this.stats.totalGCTime / this.stats.totalGCs
    this.stats.lastGCTime = result.duration
    this.stats.lastGCType = result.type
    this.stats.memoryReclaimed += result.memoryReclaimed
    this.stats.gcEfficiency = result.duration > 0 ? result.memoryReclaimed / result.duration : 0
  }

  /**
   * Get GC statistics
   */
  getStats(): GCStats {
    return { ...this.stats }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.isRunning = false
  }
}

/**
 * Memory budget tracker
 */
class MemoryBudgetTracker {
  private config: Pick<MemoryManagerConfig, 'memoryBudget' | 'budgetWindow'>
  private quotas: Map<string, MemoryQuota> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: Pick<MemoryManagerConfig, 'memoryBudget' | 'budgetWindow'>) {
    this.config = config
  }

  /**
   * Check if module can consume memory from quota
   */
  canConsume(moduleId: string, size: number): boolean {
    const quota = this.getOrCreateQuota(moduleId)
    return quota.remaining >= size
  }

  /**
   * Consume memory from quota
   */
  consume(moduleId: string, size: number): void {
    const quota = this.getOrCreateQuota(moduleId)
    quota.used += size
    quota.remaining = Math.max(0, quota.remaining - size)
  }

  /**
   * Get quota for module
   */
  getQuota(moduleId: string): MemoryQuota {
    return this.getOrCreateQuota(moduleId)
  }

  /**
   * Get overall quota utilization
   */
  getUtilization(): number {
    let totalUsed = 0
    let totalAllocated = 0

    for (const quota of this.quotas.values()) {
      totalUsed += quota.used
      totalAllocated += quota.allocated
    }

    return totalAllocated > 0 ? totalUsed / totalAllocated : 0
  }

  /**
   * Get or create quota for module
   */
  private getOrCreateQuota(moduleId: string): MemoryQuota {
    if (!this.quotas.has(moduleId)) {
      const now = Date.now()
      const quota: MemoryQuota = {
        allocated: this.config.memoryBudget,
        used: 0,
        remaining: this.config.memoryBudget,
        resetTime: now + this.config.budgetWindow,
        windowStart: now,
        windowEnd: now + this.config.budgetWindow
      }

      this.quotas.set(moduleId, quota)

      // Setup quota reset timer
      const timer = setTimeout(() => {
        this.resetQuota(moduleId)
      }, this.config.budgetWindow)

      this.intervals.set(moduleId, timer)
    }

    return this.quotas.get(moduleId)!
  }

  /**
   * Reset quota for module
   */
  private resetQuota(moduleId: string): void {
    const now = Date.now()
    const quota = this.quotas.get(moduleId)

    if (quota) {
      quota.used = 0
      quota.remaining = quota.allocated
      quota.windowStart = now
      quota.windowEnd = now + this.config.budgetWindow
      quota.resetTime = now + this.config.budgetWindow

      // Setup next reset
      const timer = setTimeout(() => {
        this.resetQuota(moduleId)
      }, this.config.budgetWindow)

      this.intervals.set(moduleId, timer)
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    for (const timer of this.intervals.values()) {
      clearTimeout(timer)
    }
    this.intervals.clear()
    this.quotas.clear()
  }
}

// Export singleton instance
export const wasmMemoryManager = new WasmMemoryManager()

// Export utility functions
export function createMemoryManager(config?: Partial<MemoryManagerConfig>): WasmMemoryManager {
  return new WasmMemoryManager(config)
}

export function registerModule(module: IWasmModule, customLimits?: Partial<MemoryLimitConfig>): void {
  wasmMemoryManager.registerModule(module, customLimits)
}

export function unregisterModule(moduleId: string): void {
  wasmMemoryManager.unregisterModule(moduleId)
}

export function canAllocate(moduleId: string, size: number): boolean {
  return wasmMemoryManager.canAllocate(moduleId, size)
}

export function recordAllocation(moduleId: string, size: number): boolean {
  return wasmMemoryManager.recordAllocation(moduleId, size)
}

export function recordDeallocation(moduleId: string, size: number): void {
  wasmMemoryManager.recordDeallocation(moduleId, size)
}

export function triggerGC(moduleId: string, aggressive = false): Promise<GCResult> {
  return wasmMemoryManager.triggerGC(moduleId, aggressive)
}

export function getMemoryUsage(moduleId: string): MemoryUsage | null {
  return wasmMemoryManager.getMemoryUsage(moduleId)
}

export function getAggregateStats(): AggregateMemoryStats {
  return wasmMemoryManager.getAggregateStats()
}
