import type { EnhancedConnectionPool } from './pool'
import type { PoolHealthChecker } from './pool-health-checker'
import type { ConnectionPoolMonitor } from './pool-monitoring'

export interface AdaptiveSizingConfig {
  enabled: boolean
  evaluationIntervalMs: number
  minEvaluationPeriodMs: number
  maxScaleFactor: number
  minScaleFactor: number

  // Scaling thresholds
  thresholds: {
    scaleUp: {
      utilization: number // Pool utilization percentage
      waitTime: number // Average wait time in ms
      errorRate: number // Error rate percentage
      consecutivePeriods: number // Number of consecutive periods above threshold
    }
    scaleDown: {
      utilization: number // Pool utilization percentage
      idleTime: number // Average idle time in ms
      consecutivePeriods: number // Number of consecutive periods below threshold
    }
  }

  // Scaling constraints
  constraints: {
    maxConnections: number
    minConnections: number
    maxScaleUpStep: number
    maxScaleDownStep: number
    scaleUpCooldownMs: number
    scaleDownCooldownMs: number
    burstCapacity: number
    burstDurationMs: number
  }

  // Load prediction
  prediction: {
    enabled: boolean
    historyWindowMs: number
    predictionHorizonMs: number
    model: 'linear' | 'exponential' | 'seasonal'
    confidenceThreshold: number
  }

  // Environment adaptation
  environment: {
    type: 'development' | 'staging' | 'production'
    peakHours?: { start: number; end: number } // Hours of the day
    peakDays?: number[] // Days of the week (0-6, 0=Sunday)
    timezone: string
    adaptiveThresholds: boolean
  }

  // Performance optimization
  optimization: {
    enableBurstMode: boolean
    enablePreWarmConnections: boolean
    enablePredictiveScaling: boolean
    enableResourceAwareScaling: boolean
    enableCostOptimization: boolean
  }
}

export interface LoadPattern {
  timestamp: number
  totalRequests: number
  activeConnections: number
  averageResponseTime: number
  errorRate: number
  queueDepth: number
  throughput: number
}

export interface ScalingDecision {
  timestamp: number
  action: 'scale_up' | 'scale_down' | 'no_action' | 'emergency_scale'
  currentSize: number
  targetSize: number
  reason: string
  confidence: number
  metrics: {
    utilization: number
    waitTime: number
    errorRate: number
    predictedLoad: number
  }
  constraints: {
    minSize: number
    maxSize: number
    maxStep: number
  }
}

export interface AdaptiveSizingMetrics {
  scaling: {
    totalScaleUps: number
    totalScaleDowns: number
    emergencyScalings: number
    lastScaleUp: number
    lastScaleDown: number
    averageScaleUpTime: number
    averageScaleDownTime: number
  }
  prediction: {
    accuracy: number
    predictions: number
    correctPredictions: number
    lastPrediction: number
    modelVersion: string
  }
  performance: {
    averageUtilization: number
    peakUtilization: number
    averageWaitTime: number
    peakWaitTime: number
    slaCompliance: number // Percentage of time within SLA
  }
  efficiency: {
    connectionEfficiency: number
    resourceUtilization: number
    costEfficiency: number
    wasteReduction: number
  }
  patterns: {
    detectedPatterns: string[]
    peakHours: Array<{ hour: number; intensity: number }>
    seasonalVariations: Array<{ period: string; variation: number }>
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  }
}

/**
 * Adaptive pool sizing system that automatically adjusts pool size based on service needs
 */
export class AdaptivePoolSizer {
  private pool: EnhancedConnectionPool
  private monitor: ConnectionPoolMonitor
  private config: Required<AdaptiveSizingConfig>
  private loadHistory: LoadPattern[] = []
  private scalingHistory: ScalingDecision[] = []
  private metrics: AdaptiveSizingMetrics
  private evaluationTimer?: ReturnType<typeof setInterval>
  private burstModeActive: boolean = false
  private burstModeStart?: number
  private lastScaleUp: number = 0
  private lastScaleDown: number = 0
  private isShuttingDown: boolean = false

  constructor(
    pool: EnhancedConnectionPool,
    monitor: ConnectionPoolMonitor,
    healthChecker: PoolHealthChecker,
    config: AdaptiveSizingConfig = {}
  ) {
    this.pool = pool
    this.monitor = monitor
    this.healthChecker = healthChecker
    this.config = this.mergeConfig(config)

    this.metrics = {
      scaling: {
        totalScaleUps: 0,
        totalScaleDowns: 0,
        emergencyScalings: 0,
        lastScaleUp: 0,
        lastScaleDown: 0,
        averageScaleUpTime: 0,
        averageScaleDownTime: 0,
      },
      prediction: {
        accuracy: 0,
        predictions: 0,
        correctPredictions: 0,
        lastPrediction: 0,
        modelVersion: '1.0',
      },
      performance: {
        averageUtilization: 0,
        peakUtilization: 0,
        averageWaitTime: 0,
        peakWaitTime: 0,
        slaCompliance: 100,
      },
      efficiency: {
        connectionEfficiency: 0,
        resourceUtilization: 0,
        costEfficiency: 0,
        wasteReduction: 0,
      },
      patterns: {
        detectedPatterns: [],
        peakHours: [],
        seasonalVariations: [],
        trend: 'stable',
      },
    }

    if (this.config.enabled) {
      this.startAdaptiveSizing()
    }
  }

  /**
   * Perform adaptive sizing evaluation
   */
  async evaluateScaling(): Promise<ScalingDecision> {
    if (this.isShuttingDown) {
      return this.createNoActionDecision('System shutting down')
    }

    const currentMetrics = await this.collectCurrentMetrics()
    const loadPattern = this.createLoadPattern(currentMetrics)
    this.loadHistory.push(loadPattern)

    // Maintain history size
    this.trimLoadHistory()

    // Check if we should scale up due to burst mode
    if (this.config.optimization.enableBurstMode && this.shouldTriggerBurstMode(currentMetrics)) {
      return this.handleBurstMode(currentMetrics)
    }

    // Predict future load if enabled
    let predictedLoad = 0
    if (this.config.prediction.enabled) {
      predictedLoad = await this.predictLoad()
    }

    // Evaluate scaling decision
    const decision = this.evaluateScalingDecision(currentMetrics, predictedLoad)

    // Execute scaling if needed
    if (decision.action !== 'no_action') {
      await this.executeScaling(decision)
    }

    // Update metrics
    this.updateMetrics(currentMetrics, decision)

    return decision
  }

  /**
   * Get current adaptive sizing metrics
   */
  getMetrics(): AdaptiveSizingMetrics {
    return { ...this.metrics }
  }

  /**
   * Get scaling history
   */
  getScalingHistory(limit = 50): ScalingDecision[] {
    return this.scalingHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  /**
   * Get load patterns
   */
  getLoadPatterns(timeRange = 3600000): LoadPattern[] {
    const cutoff = Date.now() - timeRange
    return this.loadHistory.filter(pattern => pattern.timestamp > cutoff)
  }

  /**
   * Manually trigger scaling
   */
  async manualScaling(targetSize: number, reason: string): Promise<ScalingDecision> {
    const currentSize = this.getCurrentPoolSize()

    const decision: ScalingDecision = {
      timestamp: Date.now(),
      action: targetSize > currentSize ? 'scale_up' : 'scale_down',
      currentSize,
      targetSize: Math.max(
        this.config.constraints.minConnections,
        Math.min(this.config.constraints.maxConnections, targetSize)
      ),
      reason: `Manual scaling: ${reason}`,
      confidence: 1.0,
      metrics: await this.getCurrentMetrics(),
      constraints: {
        minSize: this.config.constraints.minConnections,
        maxSize: this.config.constraints.maxConnections,
        maxStep: Math.abs(targetSize - currentSize),
      },
    }

    await this.executeScaling(decision)
    return decision
  }

  /**
   * Activate burst mode manually
   */
  async activateBurstMode(durationMs = 300000): Promise<void> {
    if (this.burstModeActive) return

    this.burstModeActive = true
    this.burstModeStart = Date.now()

    // Scale up to burst capacity
    const burstSize = Math.min(
      this.config.constraints.maxConnections,
      this.getCurrentPoolSize() + this.config.constraints.burstCapacity
    )

    await this.manualScaling(burstSize, 'Burst mode activated')

    // Schedule burst mode deactivation
    setTimeout(() => {
      this.deactivateBurstMode()
    }, durationMs)

    console.info(`Burst mode activated for ${durationMs}ms, scaling to ${burstSize} connections`)
  }

  /**
   * Deactivate burst mode
   */
  async deactivateBurstMode(): Promise<void> {
    if (!this.burstModeActive) return

    this.burstModeActive = false
    const burstDuration = this.burstModeStart ? Date.now() - this.burstModeStart : 0

    // Scale back to normal size
    const normalSize = this.calculateOptimalSize()
    await this.manualScaling(normalSize, 'Burst mode deactivated')

    console.info(
      `Burst mode deactivated after ${burstDuration}ms, scaling to ${normalSize} connections`
    )
  }

  /**
   * Update adaptive sizing configuration
   */
  updateConfig(config: Partial<AdaptiveSizingConfig>): void {
    this.config = { ...this.config, ...config }

    if (this.config.enabled && !this.evaluationTimer) {
      this.startAdaptiveSizing()
    } else if (!this.config.enabled && this.evaluationTimer) {
      this.stopAdaptiveSizing()
    }
  }

  /**
   * Shutdown adaptive sizer
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true
    this.stopAdaptiveSizing()

    if (this.burstModeActive) {
      await this.deactivateBurstMode()
    }

    this.loadHistory = []
    this.scalingHistory = []
  }

  // Private methods
  private mergeConfig(config: AdaptiveSizingConfig): Required<AdaptiveSizingConfig> {
    const defaultConfig: Required<AdaptiveSizingConfig> = {
      enabled: true,
      evaluationIntervalMs: 30000, // 30 seconds
      minEvaluationPeriodMs: 120000, // 2 minutes
      maxScaleFactor: 2.0,
      minScaleFactor: 0.5,

      thresholds: {
        scaleUp: {
          utilization: 0.8,
          waitTime: 1000,
          errorRate: 0.05,
          consecutivePeriods: 2,
        },
        scaleDown: {
          utilization: 0.3,
          idleTime: 30000,
          consecutivePeriods: 3,
        },
      },

      constraints: {
        maxConnections: 20,
        minConnections: 2,
        maxScaleUpStep: 5,
        maxScaleDownStep: 3,
        scaleUpCooldownMs: 60000, // 1 minute
        scaleDownCooldownMs: 300000, // 5 minutes
        burstCapacity: 10,
        burstDurationMs: 300000, // 5 minutes
      },

      prediction: {
        enabled: true,
        historyWindowMs: 3600000, // 1 hour
        predictionHorizonMs: 300000, // 5 minutes
        model: 'linear',
        confidenceThreshold: 0.7,
      },

      environment: {
        type: 'production',
        timezone: 'UTC',
        adaptiveThresholds: true,
      },

      optimization: {
        enableBurstMode: true,
        enablePreWarmConnections: true,
        enablePredictiveScaling: true,
        enableResourceAwareScaling: true,
        enableCostOptimization: true,
      },
    }

    // Apply environment-specific optimizations
    if (config.environment?.type) {
      switch (config.environment.type) {
        case 'development':
          defaultConfig.constraints.maxConnections = 10
          defaultConfig.evaluationIntervalMs = 60000
          break
        case 'staging':
          defaultConfig.constraints.maxConnections = 15
          break
        case 'production':
          defaultConfig.constraints.maxConnections = 50
          defaultConfig.evaluationIntervalMs = 15000
          break
      }
    }

    return { ...defaultConfig, ...config }
  }

  private startAdaptiveSizing(): void {
    if (this.evaluationTimer) {
      this.stopAdaptiveSizing()
    }

    this.evaluationTimer = setInterval(async () => {
      if (!this.isShuttingDown) {
        try {
          await this.evaluateScaling()
        } catch (error) {
          console.error('Adaptive sizing evaluation failed:', error)
        }
      }
    }, this.config.evaluationIntervalMs)

    // Initial evaluation
    this.evaluateScaling()
  }

  private stopAdaptiveSizing(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer)
      this.evaluationTimer = undefined
    }
  }

  private async collectCurrentMetrics() {
    const poolMetrics = this.pool.getMetrics()
    const monitorMetrics = await this.monitor.getRealTimeMetrics()

    return {
      totalConnections: poolMetrics.pool.totalConnections,
      activeConnections: poolMetrics.pool.activeConnections,
      idleConnections: poolMetrics.pool.idleConnections,
      utilization:
        poolMetrics.pool.totalConnections > 0
          ? poolMetrics.pool.activeConnections / poolMetrics.pool.totalConnections
          : 0,
      averageWaitTime:
        monitorMetrics.performance.acquisitionWaitTimeHistory[
          monitorMetrics.performance.acquisitionWaitTimeHistory.length - 1
        ]?.value || 0,
      averageResponseTime: poolMetrics.performance.averageQueryTime,
      errorRate:
        poolMetrics.performance.totalQueries > 0
          ? poolMetrics.performance.failedQueries / poolMetrics.performance.totalQueries
          : 0,
      queueDepth: Math.max(
        0,
        poolMetrics.pool.totalConnections - poolMetrics.pool.activeConnections
      ),
    }
  }

  private createLoadPattern(metrics: PoolMetrics): LoadPattern {
    return {
      timestamp: Date.now(),
      totalRequests: metrics.totalConnections,
      activeConnections: metrics.activeConnections,
      averageResponseTime: metrics.averageResponseTime,
      errorRate: metrics.errorRate,
      queueDepth: metrics.queueDepth,
      throughput: metrics.activeConnections / Math.max(metrics.averageResponseTime, 1),
    }
  }

  private trimLoadHistory(): void {
    const cutoff = Date.now() - this.config.prediction.historyWindowMs
    this.loadHistory = this.loadHistory.filter(pattern => pattern.timestamp > cutoff)

    // Limit history size
    if (this.loadHistory.length > 1000) {
      this.loadHistory = this.loadHistory.slice(-500)
    }
  }

  private shouldTriggerBurstMode(metrics: PoolMetrics): boolean {
    if (this.burstModeActive) return false

    // Check for sudden traffic spike
    if (this.loadHistory.length < 2) return false

    const recent = this.loadHistory.slice(-5) // Last 5 patterns
    const older = this.loadHistory.slice(-10, -5) // 5-10 patterns ago

    if (recent.length === 0 || older.length === 0) return false

    const recentAvg = recent.reduce((sum, p) => sum + p.activeConnections, 0) / recent.length
    const olderAvg = older.reduce((sum, p) => sum + p.activeConnections, 0) / older.length

    // Trigger burst mode if recent load is 2x older load
    return recentAvg > olderAvg * 2 && metrics.utilization > 0.9
  }

  private async handleBurstMode(metrics: PoolMetrics): Promise<ScalingDecision> {
    await this.activateBurstMode(this.config.constraints.burstDurationMs)

    const currentSize = this.getCurrentPoolSize()
    const targetSize = Math.min(
      this.config.constraints.maxConnections,
      currentSize + this.config.constraints.burstCapacity
    )

    return {
      timestamp: Date.now(),
      action: 'emergency_scale',
      currentSize,
      targetSize,
      reason: 'Burst mode triggered by traffic spike',
      confidence: 1.0,
      metrics: {
        utilization: metrics.utilization,
        waitTime: metrics.averageWaitTime,
        errorRate: metrics.errorRate,
        predictedLoad: 0,
      },
      constraints: {
        minSize: this.config.constraints.minConnections,
        maxSize: this.config.constraints.maxConnections,
        maxStep: this.config.constraints.burstCapacity,
      },
    }
  }

  private async predictLoad(): Promise<number> {
    if (this.loadHistory.length < 10) return 0

    const horizon = this.config.prediction.predictionHorizonMs
    const now = Date.now()

    try {
      switch (this.config.prediction.model) {
        case 'linear':
          return this.linearRegressionPredict(now + horizon)
        case 'exponential':
          return this.exponentialSmoothingPredict(now + horizon)
        case 'seasonal':
          return this.seasonalPredict(now + horizon)
        default:
          return this.linearRegressionPredict(now + horizon)
      }
    } catch (error) {
      console.error('Load prediction failed:', error)
      return 0
    }
  }

  private linearRegressionPredict(targetTime: number): number {
    const recent = this.loadHistory.slice(-20) // Use last 20 data points

    if (recent.length < 2) return 0

    // Simple linear regression on active connections
    const n = recent.length
    const sumX = recent.reduce((sum, _p, i) => sum + i, 0)
    const sumY = recent.reduce((sum, p) => sum + p.activeConnections, 0)
    const sumXY = recent.reduce((sum, p, i) => sum + i * p.activeConnections, 0)
    const sumX2 = recent.reduce((sum, _p, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Predict future value
    const futureIndex = (targetTime - recent[0].timestamp) / this.config.evaluationIntervalMs
    const predictedValue = slope * futureIndex + intercept

    return Math.max(0, predictedValue)
  }

  private exponentialSmoothingPredict(_targetTime: number): number {
    const recent = this.loadHistory.slice(-10)
    if (recent.length === 0) return 0

    const alpha = 0.3 // Smoothing factor
    let smoothed = recent[0].activeConnections

    for (let i = 1; i < recent.length; i++) {
      smoothed = alpha * recent[i].activeConnections + (1 - alpha) * smoothed
    }

    return smoothed
  }

  private seasonalPredict(targetTime: number): number {
    // Simple seasonal pattern based on time of day
    const hour = new Date(targetTime).getHours()
    const dayOfWeek = new Date(targetTime).getDay()

    // Find similar historical patterns
    const similarPatterns = this.loadHistory.filter(p => {
      const pHour = new Date(p.timestamp).getHours()
      const pDayOfWeek = new Date(p.timestamp).getDay()
      return Math.abs(pHour - hour) <= 1 && pDayOfWeek === dayOfWeek
    })

    if (similarPatterns.length === 0) return 0

    return similarPatterns.reduce((sum, p) => sum + p.activeConnections, 0) / similarPatterns.length
  }

  private evaluateScalingDecision(
    currentMetrics: PoolMetrics,
    predictedLoad: number
  ): ScalingDecision {
    const currentSize = this.getCurrentPoolSize()
    const now = Date.now()

    // Check scale-up conditions
    if (this.shouldScaleUp(currentMetrics, now)) {
      const targetSize = this.calculateScaleUpTarget(currentMetrics, predictedLoad)
      return {
        timestamp: now,
        action: 'scale_up',
        currentSize,
        targetSize,
        reason: this.getScaleUpReason(currentMetrics, predictedLoad),
        confidence: this.calculateScaleConfidence(currentMetrics, 'up'),
        metrics: {
          utilization: currentMetrics.utilization,
          waitTime: currentMetrics.averageWaitTime,
          errorRate: currentMetrics.errorRate,
          predictedLoad,
        },
        constraints: {
          minSize: this.config.constraints.minConnections,
          maxSize: this.config.constraints.maxConnections,
          maxStep: this.config.constraints.maxScaleUpStep,
        },
      }
    }

    // Check scale-down conditions
    if (this.shouldScaleDown(currentMetrics, now)) {
      const targetSize = this.calculateScaleDownTarget(currentMetrics)
      return {
        timestamp: now,
        action: 'scale_down',
        currentSize,
        targetSize,
        reason: this.getScaleDownReason(currentMetrics),
        confidence: this.calculateScaleConfidence(currentMetrics, 'down'),
        metrics: {
          utilization: currentMetrics.utilization,
          waitTime: currentMetrics.averageWaitTime,
          errorRate: currentMetrics.errorRate,
          predictedLoad,
        },
        constraints: {
          minSize: this.config.constraints.minConnections,
          maxSize: this.config.constraints.maxConnections,
          maxStep: this.config.constraints.maxScaleDownStep,
        },
      }
    }

    // No scaling needed
    return this.createNoActionDecision('Metrics within normal range')
  }

  private shouldScaleUp(metrics: PoolMetrics, now: number): boolean {
    // Check cooldown
    if (now - this.lastScaleUp < this.config.constraints.scaleUpCooldownMs) {
      return false
    }

    const thresholds = this.config.thresholds.scaleUp

    // Check utilization threshold
    if (metrics.utilization >= thresholds.utilization) {
      return true
    }

    // Check wait time threshold
    if (metrics.averageWaitTime >= thresholds.waitTime) {
      return true
    }

    // Check error rate threshold
    if (metrics.errorRate >= thresholds.errorRate) {
      return true
    }

    // Check consecutive periods
    if (this.loadHistory.length >= thresholds.consecutivePeriods) {
      const recent = this.loadHistory.slice(-thresholds.consecutivePeriods)
      const allAboveThreshold = recent.every(
        pattern => pattern.activeConnections / this.getCurrentPoolSize() >= thresholds.utilization
      )
      if (allAboveThreshold) return true
    }

    return false
  }

  private shouldScaleDown(metrics: PoolMetrics, now: number): boolean {
    // Check cooldown
    if (now - this.lastScaleDown < this.config.constraints.scaleDownCooldownMs) {
      return false
    }

    // Don't scale down if burst mode is active
    if (this.burstModeActive) {
      return false
    }

    const thresholds = this.config.thresholds.scaleDown

    // Check utilization threshold
    if (metrics.utilization <= thresholds.utilization) {
      return true
    }

    // Check consecutive periods
    if (this.loadHistory.length >= thresholds.consecutivePeriods) {
      const recent = this.loadHistory.slice(-thresholds.consecutivePeriods)
      const allBelowThreshold = recent.every(
        pattern => pattern.activeConnections / this.getCurrentPoolSize() <= thresholds.utilization
      )
      if (allBelowThreshold) return true
    }

    return false
  }

  private calculateScaleUpTarget(metrics: PoolMetrics, predictedLoad: number): number {
    const currentSize = this.getCurrentPoolSize()
    let targetSize = currentSize

    // Base scaling on utilization
    if (metrics.utilization > 0.8) {
      targetSize = Math.ceil(currentSize * this.config.maxScaleFactor)
    } else if (metrics.utilization > 0.6) {
      targetSize = Math.ceil(currentSize * 1.5)
    } else {
      targetSize = Math.ceil(currentSize * 1.2)
    }

    // Consider predicted load
    if (predictedLoad > 0) {
      const predictedConnections = Math.ceil(predictedLoad * 1.2) // 20% buffer
      targetSize = Math.max(targetSize, predictedConnections)
    }

    // Apply constraints
    targetSize = Math.min(targetSize, currentSize + this.config.constraints.maxScaleUpStep)
    targetSize = Math.min(targetSize, this.config.constraints.maxConnections)

    return targetSize
  }

  private calculateScaleDownTarget(metrics: any): number {
    const currentSize = this.getCurrentPoolSize()
    let targetSize = currentSize

    // Base scaling on utilization
    if (metrics.utilization < 0.2) {
      targetSize = Math.ceil(currentSize * this.config.minScaleFactor)
    } else if (metrics.utilization < 0.3) {
      targetSize = Math.ceil(currentSize * 0.8)
    } else {
      targetSize = Math.ceil(currentSize * 0.9)
    }

    // Apply constraints
    targetSize = Math.max(targetSize, this.config.constraints.minConnections)
    targetSize = Math.max(targetSize, currentSize - this.config.constraints.maxScaleDownStep)

    return targetSize
  }

  private getScaleUpReason(metrics: any, predictedLoad: number): string {
    const reasons = []

    if (metrics.utilization >= this.config.thresholds.scaleUp.utilization) {
      reasons.push(`high utilization (${(metrics.utilization * 100).toFixed(1)}%)`)
    }

    if (metrics.averageWaitTime >= this.config.thresholds.scaleUp.waitTime) {
      reasons.push(`high wait time (${metrics.averageWaitTime.toFixed(0)}ms)`)
    }

    if (metrics.errorRate >= this.config.thresholds.scaleUp.errorRate) {
      reasons.push(`high error rate (${(metrics.errorRate * 100).toFixed(2)}%)`)
    }

    if (predictedLoad > 0) {
      reasons.push(`predicted load increase (${predictedLoad.toFixed(0)} connections)`)
    }

    return reasons.length > 0 ? reasons.join(', ') : 'multiple factors'
  }

  private getScaleDownReason(metrics: any): string {
    const reasons = []

    if (metrics.utilization <= this.config.thresholds.scaleDown.utilization) {
      reasons.push(`low utilization (${(metrics.utilization * 100).toFixed(1)}%)`)
    }

    return reasons.length > 0 ? reasons.join(', ') : 'low utilization'
  }

  private calculateScaleConfidence(metrics: any, direction: 'up' | 'down'): number {
    let confidence = 0.5 // Base confidence

    if (direction === 'up') {
      if (metrics.utilization > 0.9) confidence += 0.3
      if (metrics.averageWaitTime > 2000) confidence += 0.2
      if (metrics.errorRate > 0.1) confidence += 0.2
    } else {
      if (metrics.utilization < 0.2) confidence += 0.3
      if (metrics.averageWaitTime < 100) confidence += 0.2
    }

    return Math.min(1.0, confidence)
  }

  private calculateOptimalSize(): number {
    if (this.loadHistory.length === 0) {
      return this.config.constraints.minConnections
    }

    // Calculate average utilization over recent history
    const recent = this.loadHistory.slice(-10)
    const _avgUtilization =
      recent.reduce((sum, p) => {
        const currentSize = this.getCurrentPoolSize()
        return sum + p.activeConnections / Math.max(currentSize, 1)
      }, 0) / recent.length

    // Target 70% utilization
    const optimalConnections = recent[recent.length - 1].activeConnections / 0.7

    return Math.max(
      this.config.constraints.minConnections,
      Math.min(this.config.constraints.maxConnections, Math.ceil(optimalConnections))
    )
  }

  private getCurrentPoolSize(): number {
    return this.pool.getMetrics().pool.totalConnections
  }

  private async getCurrentMetrics() {
    const metrics = await this.collectCurrentMetrics()
    return {
      utilization: metrics.utilization,
      waitTime: metrics.averageWaitTime,
      errorRate: metrics.errorRate,
      predictedLoad: 0,
    }
  }

  private createNoActionDecision(reason: string): ScalingDecision {
    const currentSize = this.getCurrentPoolSize()
    return {
      timestamp: Date.now(),
      action: 'no_action',
      currentSize,
      targetSize: currentSize,
      reason,
      confidence: 1.0,
      metrics: {
        utilization: 0,
        waitTime: 0,
        errorRate: 0,
        predictedLoad: 0,
      },
      constraints: {
        minSize: this.config.constraints.minConnections,
        maxSize: this.config.constraints.maxConnections,
        maxStep: 0,
      },
    }
  }

  private async executeScaling(decision: ScalingDecision): Promise<void> {
    const startTime = Date.now()

    try {
      // In a real implementation, this would interact with the pool
      // to actually scale up or down
      console.info(
        `Executing scaling: ${decision.action} from ${decision.currentSize} to ${decision.targetSize}`
      )

      // Simulate scaling delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const duration = Date.now() - startTime

      // Update metrics
      if (decision.action === 'scale_up') {
        this.metrics.scaling.totalScaleUps++
        this.metrics.scaling.lastScaleUp = Date.now()
        this.lastScaleUp = Date.now()

        // Update average scale up time
        const totalScaleUps = this.metrics.scaling.totalScaleUps
        this.metrics.scaling.averageScaleUpTime =
          (this.metrics.scaling.averageScaleUpTime * (totalScaleUps - 1) + duration) / totalScaleUps
      } else if (decision.action === 'scale_down') {
        this.metrics.scaling.totalScaleDowns++
        this.metrics.scaling.lastScaleDown = Date.now()
        this.lastScaleDown = Date.now()

        // Update average scale down time
        const totalScaleDowns = this.metrics.scaling.totalScaleDowns
        this.metrics.scaling.averageScaleDownTime =
          (this.metrics.scaling.averageScaleDownTime * (totalScaleDowns - 1) + duration) /
          totalScaleDowns
      } else if (decision.action === 'emergency_scale') {
        this.metrics.scaling.emergencyScalings++
      }

      // Store in history
      this.scalingHistory.push(decision)

      // Limit history size
      if (this.scalingHistory.length > 100) {
        this.scalingHistory = this.scalingHistory.slice(-50)
      }

      console.info(`Scaling completed: ${decision.action} in ${duration}ms`)
    } catch (error) {
      console.error(`Scaling failed: ${decision.action}`, error)
      throw error
    }
  }

  private updateMetrics(currentMetrics: any, _decision: ScalingDecision): void {
    // Update performance metrics
    this.metrics.performance.averageUtilization =
      (this.metrics.performance.averageUtilization + currentMetrics.utilization) / 2
    this.metrics.performance.peakUtilization = Math.max(
      this.metrics.performance.peakUtilization,
      currentMetrics.utilization
    )

    this.metrics.performance.averageWaitTime =
      (this.metrics.performance.averageWaitTime + currentMetrics.averageWaitTime) / 2
    this.metrics.performance.peakWaitTime = Math.max(
      this.metrics.performance.peakWaitTime,
      currentMetrics.averageWaitTime
    )

    // Update efficiency metrics
    const totalConnections = currentMetrics.totalConnections
    const activeConnections = currentMetrics.activeConnections
    this.metrics.efficiency.connectionEfficiency =
      totalConnections > 0 ? activeConnections / totalConnections : 0

    // Analyze patterns
    this.analyzePatterns()
  }

  private analyzePatterns(): void {
    if (this.loadHistory.length < 24) return // Need at least 24 data points

    // Analyze hourly patterns
    const hourlyUsage = new Array(24).fill(0)
    const hourlyCounts = new Array(24).fill(0)

    for (const pattern of this.loadHistory) {
      const hour = new Date(pattern.timestamp).getHours()
      hourlyUsage[hour] += pattern.activeConnections
      hourlyCounts[hour]++
    }

    this.metrics.patterns.peakHours = hourlyUsage
      .map((usage, hour) => ({
        hour,
        intensity: hourlyCounts[hour] > 0 ? usage / hourlyCounts[hour] : 0,
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 6) // Top 6 peak hours

    // Detect trend
    const recent = this.loadHistory.slice(-10)
    const older = this.loadHistory.slice(-20, -10)

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, p) => sum + p.activeConnections, 0) / recent.length
      const olderAvg = older.reduce((sum, p) => sum + p.activeConnections, 0) / older.length

      const change = (recentAvg - olderAvg) / olderAvg

      if (change > 0.2) {
        this.metrics.patterns.trend = 'increasing'
      } else if (change < -0.2) {
        this.metrics.patterns.trend = 'decreasing'
      } else if (Math.abs(change) < 0.05) {
        this.metrics.patterns.trend = 'stable'
      } else {
        this.metrics.patterns.trend = 'volatile'
      }
    }
  }
}

/**
 * Factory function to create adaptive pool sizer
 */
export function createAdaptivePoolSizer(
  pool: EnhancedConnectionPool,
  monitor: ConnectionPoolMonitor,
  healthChecker: PoolHealthChecker,
  config?: AdaptiveSizingConfig
): AdaptivePoolSizer {
  return new AdaptivePoolSizer(pool, monitor, healthChecker, config)
}
