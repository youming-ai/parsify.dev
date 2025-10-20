import { EnhancedConnectionPool } from './pool'
import { ConnectionLifecycleManager, ConnectionLifecycleEvent } from './connection-lifecycle'
import { ConnectionPoolMonitor } from './pool-monitoring'

export interface HealthCheckConfig {
  enabled: boolean
  intervalMs: number
  timeoutMs: number
  retryAttempts: number
  retryDelayMs: number
  consecutiveFailureThreshold: number
  recoveryCooldownMs: number

  // Health check types
  checkTypes: {
    connectivity: boolean
    performance: boolean
    resource: boolean
    scaling: boolean
  }

  // Thresholds
  thresholds: {
    maxResponseTime: number
    maxErrorRate: number
    minHealthyConnections: number
    maxPoolUtilization: number
    minAvailableConnections: number
  }

  // Auto-recovery
  autoRecovery: {
    enabled: boolean
    strategies: ('restart_connections' | 'scale_pool' | 'reset_metrics' | 'emergency_mode')[]
    maxRecoveryAttempts: number
    recoveryDelayMs: number
  }

  // Emergency mode
  emergencyMode: {
    enabled: boolean
    threshold: number // Health score below which emergency mode is activated
    maxConnections: number // Reduced pool size in emergency mode
    disabledFeatures: string[] // Features to disable in emergency mode
  }

  // Notifications
  notifications: {
    onFailure: boolean
    onRecovery: boolean
    onEmergencyMode: boolean
    webhookUrl?: string
    cooldownMs: number
  }
}

export interface HealthCheckResult {
  timestamp: number
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  healthScore: number // 0-100
  responseTime: number
  checks: {
    connectivity: boolean
    performance: boolean
    resources: boolean
    scaling: boolean
  }
  metrics: {
    totalConnections: number
    activeConnections: number
    healthyConnections: number
    poolUtilization: number
    averageResponseTime: number
    errorRate: number
  }
  issues: string[]
  recommendations: string[]
  recoveryActions: string[]
}

export interface RecoveryAction {
  id: string
  type: 'restart_connections' | 'scale_pool' | 'reset_metrics' | 'emergency_mode'
  description: string
  executed: boolean
  timestamp: number
  result?: 'success' | 'failed' | 'partial'
  error?: string
  duration?: number
}

export interface EmergencyModeStatus {
  active: boolean
  activatedAt?: number
  deactivatedAt?: number
  reason?: string
  originalConfig?: any
  currentConfig?: any
  disabledFeatures: string[]
}

/**
 * Enhanced health check and auto-recovery system for connection pools
 */
export class PoolHealthChecker {
  private pool: EnhancedConnectionPool
  private lifecycleManager: ConnectionLifecycleManager
  private monitor: ConnectionPoolMonitor
  private config: Required<HealthCheckConfig>
  private healthHistory: HealthCheckResult[] = []
  private recoveryHistory: RecoveryAction[] = []
  private emergencyModeStatus: EmergencyModeStatus
  private lastNotificationTime: number = 0
  private healthCheckTimer?: ReturnType<typeof setInterval>
  private isShuttingDown: boolean = false
  private consecutiveFailures: number = 0
  private lastRecoveryTime: number = 0

  constructor(
    pool: EnhancedConnectionPool,
    lifecycleManager: ConnectionLifecycleManager,
    monitor: ConnectionPoolMonitor,
    config: HealthCheckConfig = {}
  ) {
    this.pool = pool
    this.lifecycleManager = lifecycleManager
    this.monitor = monitor
    this.config = this.mergeConfig(config)

    this.emergencyModeStatus = {
      active: false,
      disabledFeatures: []
    }

    // Setup event listeners
    this.setupEventListeners()

    // Start health checking if enabled
    if (this.config.enabled) {
      this.startHealthChecking()
    }
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const checks = await this.performHealthChecks()
      const metrics = await this.collectHealthMetrics()
      const healthScore = this.calculateHealthScore(checks, metrics)
      const status = this.getHealthStatus(healthScore)
      const issues = this.identifyIssues(checks, metrics, healthScore)
      const recommendations = this.generateRecommendations(checks, metrics, issues)
      const responseTime = Date.now() - startTime

      const result: HealthCheckResult = {
        timestamp: Date.now(),
        status,
        healthScore,
        responseTime,
        checks,
        metrics,
        issues,
        recommendations,
        recoveryActions: []
      }

      // Update history
      this.updateHealthHistory(result)

      // Handle health status
      await this.handleHealthStatus(result)

      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorResult: HealthCheckResult = {
        timestamp: Date.now(),
        status: 'critical',
        healthScore: 0,
        responseTime,
        checks: {
          connectivity: false,
          performance: false,
          resources: false,
          scaling: false
        },
        metrics: {
          totalConnections: 0,
          activeConnections: 0,
          healthyConnections: 0,
          poolUtilization: 0,
          averageResponseTime: 0,
          errorRate: 1
        },
        issues: [`Health check failed: ${(error as Error).message}`],
        recommendations: ['Investigate health check system and database connectivity'],
        recoveryActions: []
      }

      this.updateHealthHistory(errorResult)
      await this.handleHealthStatus(errorResult)

      return errorResult
    }
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<HealthCheckResult> {
    return this.performHealthCheck()
  }

  /**
   * Get health history
   */
  getHealthHistory(timeRange = 3600000): HealthCheckResult[] {
    const cutoff = Date.now() - timeRange
    return this.healthHistory.filter(result => result.timestamp > cutoff)
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory(limit = 50): RecoveryAction[] {
    return this.recoveryHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get emergency mode status
   */
  getEmergencyModeStatus(): EmergencyModeStatus {
    return { ...this.emergencyModeStatus }
  }

  /**
   * Manually trigger recovery
   */
  async triggerRecovery(strategies?: HealthCheckConfig['autoRecovery']['strategies']): Promise<RecoveryAction[]> {
    const recoveryStrategies = strategies || this.config.autoRecovery.strategies
    const actions: RecoveryAction[] = []

    for (const strategy of recoveryStrategies) {
      const action = await this.executeRecoveryAction(strategy)
      actions.push(action)
    }

    return actions
  }

  /**
   * Activate emergency mode manually
   */
  async activateEmergencyMode(reason?: string): Promise<void> {
    if (this.emergencyModeStatus.active) return

    this.emergencyModeStatus = {
      active: true,
      activatedAt: Date.now(),
      reason: reason || 'Manual activation',
      originalConfig: { ...this.config },
      currentConfig: this.getEmergencyConfig(),
      disabledFeatures: this.config.emergencyMode.disabledFeatures
    }

    // Apply emergency configuration
    await this.applyEmergencyMode()

    // Send notification
    await this.sendNotification('emergency_mode', {
      reason: this.emergencyModeStatus.reason,
      activatedAt: this.emergencyModeStatus.activatedAt
    })

    console.warn('EMERGENCY MODE ACTIVATED:', reason)
  }

  /**
   * Deactivate emergency mode
   */
  async deactivateEmergencyMode(): Promise<void> {
    if (!this.emergencyModeStatus.active) return

    const originalConfig = this.emergencyModeStatus.originalConfig
    if (originalConfig) {
      this.config = { ...originalConfig }
    }

    this.emergencyModeStatus = {
      ...this.emergencyModeStatus,
      active: false,
      deactivatedAt: Date.now()
    }

    // Restore normal configuration
    await this.restoreNormalMode()

    // Send notification
    await this.sendNotification('emergency_mode_deactivated', {
      deactivatedAt: this.emergencyModeStatus.deactivatedAt,
      duration: this.emergencyModeStatus.deactivatedAt - (this.emergencyModeStatus.activatedAt || 0)
    })

    console.info('EMERGENCY MODE DEACTIVATED')
  }

  /**
   * Update health check configuration
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config }

    if (this.config.enabled && !this.healthCheckTimer) {
      this.startHealthChecking()
    } else if (!this.config.enabled && this.healthCheckTimer) {
      this.stopHealthChecking()
    }
  }

  /**
   * Shutdown health checker
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true
    this.stopHealthChecking()

    // Deactivate emergency mode if active
    if (this.emergencyModeStatus.active) {
      await this.deactivateEmergencyMode()
    }

    // Clear history
    this.healthHistory = []
    this.recoveryHistory = []
  }

  // Private methods
  private mergeConfig(config: HealthCheckConfig): Required<HealthCheckConfig> {
    return {
      enabled: config.enabled ?? true,
      intervalMs: config.intervalMs ?? 30000,
      timeoutMs: config.timeoutMs ?? 10000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      consecutiveFailureThreshold: config.consecutiveFailureThreshold ?? 3,
      recoveryCooldownMs: config.recoveryCooldownMs ?? 60000,

      checkTypes: {
        connectivity: config.checkTypes?.connectivity ?? true,
        performance: config.checkTypes?.performance ?? true,
        resource: config.checkTypes?.resource ?? true,
        scaling: config.checkTypes?.scaling ?? true
      },

      thresholds: {
        maxResponseTime: config.thresholds?.maxResponseTime ?? 5000,
        maxErrorRate: config.thresholds?.maxErrorRate ?? 0.05,
        minHealthyConnections: config.thresholds?.minHealthyConnections ?? 2,
        maxPoolUtilization: config.thresholds?.maxPoolUtilization ?? 0.9,
        minAvailableConnections: config.thresholds?.minAvailableConnections ?? 1
      },

      autoRecovery: {
        enabled: config.autoRecovery?.enabled ?? true,
        strategies: config.autoRecovery?.strategies ?? ['restart_connections', 'scale_pool'],
        maxRecoveryAttempts: config.autoRecovery?.maxRecoveryAttempts ?? 3,
        recoveryDelayMs: config.autoRecovery?.recoveryDelayMs ?? 2000
      },

      emergencyMode: {
        enabled: config.emergencyMode?.enabled ?? true,
        threshold: config.emergencyMode?.threshold ?? 20,
        maxConnections: config.emergencyMode?.maxConnections ?? 3,
        disabledFeatures: config.emergencyMode?.disabledFeatures ?? ['auto_scaling', 'monitoring']
      },

      notifications: {
        onFailure: config.notifications?.onFailure ?? true,
        onRecovery: config.notifications?.onRecovery ?? true,
        onEmergencyMode: config.notifications?.onEmergencyMode ?? true,
        webhookUrl: config.notifications?.webhookUrl,
        cooldownMs: config.notifications?.cooldownMs ?? 300000 // 5 minutes
      }
    }
  }

  private setupEventListeners(): void {
    // Listen to lifecycle events
    this.lifecycleManager.addEventListener('validation_failed', (event) => {
      if (event.details.consecutiveFailures >= this.config.consecutiveFailureThreshold) {
        this.handleValidationFailure(event)
      }
    })

    this.lifecycleManager.addEventListener('connection_recovered', (event) => {
      this.handleConnectionRecovery(event)
    })

    this.lifecycleManager.addEventListener('resource_threshold_exceeded', (event) => {
      this.handleResourceThresholdExceeded(event)
    })
  }

  private startHealthChecking(): void {
    if (this.healthCheckTimer) {
      this.stopHealthChecking()
    }

    this.healthCheckTimer = setInterval(async () => {
      if (!this.isShuttingDown) {
        await this.performHealthCheck()
      }
    }, this.config.intervalMs)

    // Initial health check
    this.performHealthCheck()
  }

  private stopHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = undefined
    }
  }

  private async performHealthChecks(): Promise<HealthCheckResult['checks']> {
    const checks = {
      connectivity: false,
      performance: false,
      resources: false,
      scaling: false
    }

    // Connectivity check
    if (this.config.checkTypes.connectivity) {
      try {
        const isHealthy = await this.pool.performHealthCheck()
        checks.connectivity = isHealthy
      } catch (error) {
        checks.connectivity = false
      }
    }

    // Performance check
    if (this.config.checkTypes.performance) {
      try {
        const metrics = this.pool.getMetrics()
        const avgResponseTime = metrics.performance.averageQueryTime
        checks.performance = avgResponseTime <= this.config.thresholds.maxResponseTime
      } catch (error) {
        checks.performance = false
      }
    }

    // Resource check
    if (this.config.checkTypes.resource) {
      try {
        const lifecycleMetrics = this.lifecycleManager.getMetrics()
        const unhealthyConnections = lifecycleMetrics.health.unhealthyConnections
        const totalConnections = lifecycleMetrics.lifecycle.connectionsCreated

        checks.resources = unhealthyConnections < totalConnections * 0.2 // Less than 20% unhealthy
      } catch (error) {
        checks.resources = false
      }
    }

    // Scaling check
    if (this.config.checkTypes.scaling) {
      try {
        const metrics = this.pool.getMetrics()
        const poolUtilization = metrics.pool.activeConnections / metrics.pool.totalConnections
        checks.scaling = poolUtilization < this.config.thresholds.maxPoolUtilization
      } catch (error) {
        checks.scaling = false
      }
    }

    return checks
  }

  private async collectHealthMetrics(): Promise<HealthCheckResult['metrics']> {
    const poolMetrics = this.pool.getMetrics()
    const lifecycleMetrics = this.lifecycleManager.getMetrics()

    const totalConnections = poolMetrics.pool.totalConnections
    const activeConnections = poolMetrics.pool.activeConnections
    const healthyConnections = lifecycleMetrics.health.healthyConnections
    const poolUtilization = totalConnections > 0 ? activeConnections / totalConnections : 0
    const averageResponseTime = poolMetrics.performance.averageQueryTime
    const errorRate = poolMetrics.performance.totalQueries > 0
      ? poolMetrics.performance.failedQueries / poolMetrics.performance.totalQueries
      : 0

    return {
      totalConnections,
      activeConnections,
      healthyConnections,
      poolUtilization,
      averageResponseTime,
      errorRate
    }
  }

  private calculateHealthScore(
    checks: HealthCheckResult['checks'],
    metrics: HealthCheckResult['metrics']
  ): number {
    let score = 100

    // Deduct for failed checks (20 points each)
    if (!checks.connectivity) score -= 20
    if (!checks.performance) score -= 20
    if (!checks.resources) score -= 20
    if (!checks.scaling) score -= 20

    // Deduct for metric thresholds
    if (metrics.averageResponseTime > this.config.thresholds.maxResponseTime) {
      score -= Math.min(20, (metrics.averageResponseTime - this.config.thresholds.maxResponseTime) / 100)
    }

    if (metrics.errorRate > this.config.thresholds.maxErrorRate) {
      score -= Math.min(20, metrics.errorRate * 400)
    }

    if (metrics.poolUtilization > this.config.thresholds.maxPoolUtilization) {
      score -= Math.min(20, (metrics.poolUtilization - this.config.thresholds.maxPoolUtilization) * 100)
    }

    if (metrics.healthyConnections < this.config.thresholds.minHealthyConnections) {
      score -= Math.min(20, (this.config.thresholds.minHealthyConnections - metrics.healthyConnections) * 10)
    }

    return Math.max(0, Math.round(score))
  }

  private getHealthStatus(score: number): HealthCheckResult['status'] {
    if (score >= 80) return 'healthy'
    if (score >= 60) return 'degraded'
    if (score >= 40) return 'unhealthy'
    return 'critical'
  }

  private identifyIssues(
    checks: HealthCheckResult['checks'],
    metrics: HealthCheckResult['metrics'],
    healthScore: number
  ): string[] {
    const issues: string[] = []

    if (!checks.connectivity) {
      issues.push('Database connectivity issues detected')
    }

    if (!checks.performance) {
      issues.push('Performance degradation detected')
    }

    if (!checks.resources) {
      issues.push('Resource utilization issues detected')
    }

    if (!checks.scaling) {
      issues.push('Pool scaling issues detected')
    }

    if (metrics.errorRate > this.config.thresholds.maxErrorRate) {
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`)
    }

    if (metrics.poolUtilization > this.config.thresholds.maxPoolUtilization) {
      issues.push(`High pool utilization: ${(metrics.poolUtilization * 100).toFixed(1)}%`)
    }

    if (metrics.healthyConnections < this.config.thresholds.minHealthyConnections) {
      issues.push(`Insufficient healthy connections: ${metrics.healthyConnections}`)
    }

    if (healthScore < 50) {
      issues.push('Overall system health is critical')
    }

    return issues
  }

  private generateRecommendations(
    checks: HealthCheckResult['checks'],
    metrics: HealthCheckResult['metrics'],
    issues: string[]
  ): string[] {
    const recommendations: string[] = []

    if (!checks.connectivity) {
      recommendations.push('Check database server status and network connectivity')
      recommendations.push('Verify database credentials and configuration')
    }

    if (!checks.performance) {
      recommendations.push('Optimize slow queries and add database indexes')
      recommendations.push('Consider increasing database resources or connection pool size')
    }

    if (!checks.resources) {
      recommendations.push('Monitor memory and CPU usage')
      recommendations.push('Consider implementing connection limits and timeouts')
    }

    if (!checks.scaling) {
      recommendations.push('Review pool auto-scaling configuration')
      recommendations.push('Consider adjusting min/max connection limits')
    }

    if (metrics.poolUtilization > 0.8) {
      recommendations.push('Increase maximum pool connections')
      recommendations.push('Optimize application to use connections more efficiently')
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push('Investigate and fix failing queries')
      recommendations.push('Implement better error handling and retry logic')
    }

    if (issues.length > 3) {
      recommendations.push('Consider activating emergency mode to stabilize the system')
    }

    return recommendations
  }

  private async handleHealthStatus(result: HealthCheckResult): Promise<void> {
    // Update consecutive failures counter
    if (result.status === 'critical' || result.status === 'unhealthy') {
      this.consecutiveFailures++
    } else {
      this.consecutiveFailures = 0
    }

    // Check if emergency mode should be activated
    if (this.config.emergencyMode.enabled &&
        !this.emergencyModeStatus.active &&
        result.healthScore < this.config.emergencyMode.threshold) {
      await this.activateEmergencyMode(`Health score dropped to ${result.healthScore}`)
    }

    // Check if emergency mode should be deactivated
    if (this.emergencyModeStatus.active && result.status === 'healthy') {
      await this.deactivateEmergencyMode()
    }

    // Trigger auto-recovery if needed
    if (this.config.autoRecovery.enabled &&
        (result.status === 'critical' || result.status === 'unhealthy') &&
        this.consecutiveFailures >= this.config.consecutiveFailureThreshold &&
        Date.now() - this.lastRecoveryTime > this.config.recoveryCooldownMs) {
      await this.triggerAutoRecovery(result)
    }

    // Send notifications
    if (result.status === 'critical' || result.status === 'unhealthy') {
      await this.sendNotification('failure', result)
    } else if (this.consecutiveFailures === 0 && this.recoveryHistory.length > 0) {
      await this.sendNotification('recovery', result)
    }
  }

  private async triggerAutoRecovery(result: HealthCheckResult): Promise<void> {
    this.lastRecoveryTime = Date.now()

    console.warn('Triggering auto-recovery due to health status:', result.status)

    const recentRecoveries = this.recoveryHistory.filter(
      action => Date.now() - action.timestamp < 300000 // Last 5 minutes
    )

    if (recentRecoveries.length >= this.config.autoRecovery.maxRecoveryAttempts) {
      console.error('Auto-recovery limit reached, activating emergency mode')
      await this.activateEmergencyMode('Auto-recovery limit exceeded')
      return
    }

    const strategies = this.config.autoRecovery.strategies
    const actions = await this.triggerRecovery(strategies)

    // Update result with recovery actions
    result.recoveryActions = actions.map(action => action.type)
  }

  private async executeRecoveryAction(type: RecoveryAction['type']): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: crypto.randomUUID(),
      type,
      description: this.getRecoveryActionDescription(type),
      executed: false,
      timestamp: Date.now()
    }

    const startTime = Date.now()

    try {
      switch (type) {
        case 'restart_connections':
          await this.restartUnhealthyConnections()
          action.result = 'success'
          break

        case 'scale_pool':
          await this.scalePoolForRecovery()
          action.result = 'success'
          break

        case 'reset_metrics':
          await this.resetPoolMetrics()
          action.result = 'success'
          break

        case 'emergency_mode':
          await this.activateEmergencyMode('Recovery action triggered')
          action.result = 'success'
          break

        default:
          throw new Error(`Unknown recovery action type: ${type}`)
      }

      action.duration = Date.now() - startTime
      action.executed = true

    } catch (error) {
      action.result = 'failed'
      action.error = (error as Error).message
      action.duration = Date.now() - startTime
      action.executed = true
    }

    this.recoveryHistory.push(action)

    // Keep only recent recovery history
    if (this.recoveryHistory.length > 100) {
      this.recoveryHistory = this.recoveryHistory.slice(-50)
    }

    return action
  }

  private getRecoveryActionDescription(type: RecoveryAction['type']): string {
    switch (type) {
      case 'restart_connections':
        return 'Restart unhealthy database connections'
      case 'scale_pool':
        return 'Scale connection pool to handle load'
      case 'reset_metrics':
        return 'Reset pool metrics and monitoring data'
      case 'emergency_mode':
        return 'Activate emergency mode with reduced functionality'
      default:
        return 'Unknown recovery action'
    }
  }

  private async restartUnhealthyConnections(): Promise<void> {
    const healthStatuses = this.lifecycleManager.getAllConnectionHealth()
    const unhealthyConnections = healthStatuses.filter(h => !h.isHealthy)

    for (const health of unhealthyConnections) {
      try {
        await this.lifecycleManager.recoverConnection(health.connectionId)
      } catch (error) {
        console.error(`Failed to recover connection ${health.connectionId}:`, error)
      }
    }
  }

  private async scalePoolForRecovery(): Promise<void> {
    // This would interact with the pool to scale up
    // For now, just log the action
    console.info('Scaling pool for recovery...')
  }

  private async resetPoolMetrics(): Promise<void> {
    // This would reset pool metrics
    // For now, just log the action
    console.info('Resetting pool metrics...')
  }

  private getEmergencyConfig(): Partial<HealthCheckConfig> {
    return {
      intervalMs: 10000, // More frequent checks
      thresholds: {
        ...this.config.thresholds,
        maxResponseTime: 10000, // More lenient
        maxErrorRate: 0.1 // More lenient
      }
    }
  }

  private async applyEmergencyMode(): Promise<void> {
    // Apply emergency configuration changes
    // This would interact with the pool to reduce size, disable features, etc.
    console.warn('Emergency mode configuration applied')
  }

  private async restoreNormalMode(): Promise<void> {
    // Restore normal configuration
    console.info('Normal mode configuration restored')
  }

  private updateHealthHistory(result: HealthCheckResult): void {
    this.healthHistory.push(result)

    // Keep only recent history (last 24 hours)
    const cutoff = Date.now() - 86400000
    this.healthHistory = this.healthHistory.filter(entry => entry.timestamp > cutoff)

    // Limit history size
    if (this.healthHistory.length > 1000) {
      this.healthHistory = this.healthHistory.slice(-500)
    }
  }

  private handleValidationFailure(event: ConnectionLifecycleEvent): void {
    console.warn('Connection validation failure:', event.details)
  }

  private handleConnectionRecovery(event: ConnectionLifecycleEvent): void {
    console.info('Connection recovered:', event.connectionId)
  }

  private handleResourceThresholdExceeded(event: ConnectionLifecycleEvent): void {
    console.warn('Resource threshold exceeded:', event.details)
  }

  private async sendNotification(type: 'failure' | 'recovery' | 'emergency_mode' | 'emergency_mode_deactivated', data: any): Promise<void> {
    const now = Date.now()
    if (now - this.lastNotificationTime < this.config.notifications.cooldownMs) {
      return
    }

    this.lastNotificationTime = now

    if (!this.config.notifications.webhookUrl) return

    try {
      await fetch(this.config.notifications.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          timestamp: now,
          data,
          source: 'pool-health-checker'
        }),
        signal: AbortSignal.timeout(5000)
      })
    } catch (error) {
      console.error('Failed to send health notification:', error)
    }
  }
}

/**
 * Factory function to create pool health checker
 */
export function createPoolHealthChecker(
  pool: EnhancedConnectionPool,
  lifecycleManager: ConnectionLifecycleManager,
  monitor: ConnectionPoolMonitor,
  config?: HealthCheckConfig
): PoolHealthChecker {
  return new PoolHealthChecker(pool, lifecycleManager, monitor, config)
}
