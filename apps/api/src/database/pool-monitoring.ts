import { EnhancedConnectionPool, PoolMetrics, PoolStatistics, ConnectionMetrics } from './pool'

export interface PoolMonitoringConfig {
  enabled: boolean
  metricsIntervalMs: number
  alertThresholds: {
    connectionUtilization: number
    acquisitionWaitTime: number
    errorRate: number
    healthFailureRate: number
    scalingFrequency: number
  }
  historyRetention: {
    metricsHistoryMs: number
    alertHistoryMs: number
    maxHistoryEntries: number
  }
  notifications: {
    enableConsoleLogging: boolean
    enableWebhook: boolean
    webhookUrl?: string
    webhookTimeoutMs: number
  }
}

export interface DetailedPoolMetrics extends PoolMetrics {
  timestamp: number
  connections: Array<{
    id: string
    age: number
    usageCount: number
    lastUsed: number
    healthStatus: string
    isActive: boolean
  }>
  efficiency: {
    connectionUtilization: number
    averageConnectionLifetime: number
    poolEfficiency: number
    scalingEfficiency: number
  }
  performance: {
    acquisitionWaitTimeHistory: Array<{ timestamp: number; value: number }>
    queryTimeHistory: Array<{ timestamp: number; value: number }>
    connectionCreationRate: number
    connectionDestructionRate: number
  }
}

export interface PoolAlert {
  id: string
  type: 'connection_exhaustion' | 'high_wait_time' | 'health_check_failure' |
       'scaling_issue' | 'performance_degradation' | 'configuration_error'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  details: any
  timestamp: number
  resolved: boolean
  resolvedAt?: number
  acknowledged: boolean
  acknowledgedBy?: string
}

export interface PoolHealthReport {
  timestamp: number
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  overallHealth: number // 0-100 score
  issues: string[]
  recommendations: string[]
  alerts: PoolAlert[]
  metrics: DetailedPoolMetrics
  trends: {
    connectionUtilization: Array<{ timestamp: number; value: number }>
    performanceMetrics: Array<{ timestamp: number; acquisitionTime: number; queryTime: number }>
    healthScore: Array<{ timestamp: number; score: number }>
  }
}

/**
 * Enhanced connection pool monitoring system
 */
export class ConnectionPoolMonitor {
  private pool: EnhancedConnectionPool
  private config: Required<PoolMonitoringConfig>
  private metricsHistory: DetailedPoolMetrics[] = []
  private alerts: Map<string, PoolAlert> = new Map()
  private metricsTimer?: ReturnType<typeof setInterval>
  private lastHealthScore: number = 100
  private healthScoreHistory: Array<{ timestamp: number; score: number }> = []

  constructor(pool: EnhancedConnectionPool, config: PoolMonitoringConfig = {}) {
    this.pool = pool
    this.config = this.mergeConfig(config)

    if (this.config.enabled) {
      this.startMonitoring()
    }
  }

  /**
   * Start monitoring the connection pool
   */
  startMonitoring(): void {
    if (this.metricsTimer) {
      this.stopMonitoring()
    }

    this.metricsTimer = setInterval(async () => {
      await this.collectMetrics()
    }, this.config.metricsIntervalMs)

    // Initial collection
    this.collectMetrics()
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = undefined
    }
  }

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport(): Promise<PoolHealthReport> {
    const currentMetrics = await this.collectDetailedMetrics()
    const healthScore = this.calculateHealthScore(currentMetrics)
    const status = this.getHealthStatus(healthScore)
    const issues = this.identifyIssues(currentMetrics, healthScore)
    const recommendations = this.generateRecommendations(currentMetrics, issues)
    const trends = this.calculateTrends()
    const activeAlerts = this.getActiveAlerts()

    this.lastHealthScore = healthScore
    this.healthScoreHistory.push({ timestamp: Date.now(), score: healthScore })

    // Keep health score history within retention period
    const cutoff = Date.now() - this.config.historyRetention.metricsHistoryMs
    this.healthScoreHistory = this.healthScoreHistory.filter(entry => entry.timestamp > cutoff)

    return {
      timestamp: Date.now(),
      status,
      overallHealth: healthScore,
      issues,
      recommendations,
      alerts: activeAlerts,
      metrics: currentMetrics,
      trends
    }
  }

  /**
   * Get current real-time metrics
   */
  async getRealTimeMetrics(): Promise<DetailedPoolMetrics> {
    return this.collectDetailedMetrics()
  }

  /**
   * Get metrics history for analysis
   */
  getMetricsHistory(timeRange = 3600000): DetailedPoolMetrics[] {
    const cutoff = Date.now() - timeRange
    return this.metricsHistory.filter(entry => entry.timestamp > cutoff)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PoolAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(limit = 100): PoolAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedBy = acknowledgedBy
      this.logInfo(`Alert acknowledged: ${alertId} by ${acknowledgedBy || 'unknown'}`)
      return true
    }
    return false
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      this.logInfo(`Alert resolved: ${alertId}`)
      return true
    }
    return false
  }

  /**
   * Create custom alert
   */
  createAlert(
    type: PoolAlert['type'],
    severity: PoolAlert['severity'],
    message: string,
    details: any = {}
  ): string {
    const alertId = crypto.randomUUID()
    const alert: PoolAlert = {
      id: alertId,
      type,
      severity,
      message,
      details,
      timestamp: Date.now(),
      resolved: false,
      acknowledged: false
    }

    this.alerts.set(alertId, alert)
    this.logAlert(alert)
    this.sendNotification(alert)

    // Cleanup old alerts
    this.cleanupOldAlerts()

    return alertId
  }

  /**
   * Get performance insights and recommendations
   */
  async getPerformanceInsights(): Promise<{
    summary: string
    insights: string[]
    recommendations: string[]
    potentialIssues: string[]
  }> {
    const metrics = await this.collectDetailedMetrics()
    const recentHistory = this.getMetricsHistory(3600000) // Last hour

    const insights: string[] = []
    const recommendations: string[] = []
    const potentialIssues: string[] = []

    // Analyze connection utilization
    const utilization = metrics.efficiency.connectionUtilization
    if (utilization > 0.9) {
      insights.push('Connection pool is under high pressure')
      recommendations.push('Consider increasing max connections or optimizing query performance')
      potentialIssues.push('Risk of connection exhaustion')
    } else if (utilization < 0.3) {
      insights.push('Connection pool is underutilized')
      recommendations.push('Consider reducing pool size to conserve resources')
    }

    // Analyze acquisition wait times
    const avgWaitTime = metrics.performance.acquisitionWaitTimeHistory.reduce(
      (sum, entry) => sum + entry.value, 0
    ) / metrics.performance.acquisitionWaitTimeHistory.length

    if (avgWaitTime > 1000) {
      insights.push('High connection acquisition wait times detected')
      recommendations.push('Increase pool size or optimize connection lifecycle management')
      potentialIssues.push('Application performance may be impacted')
    }

    // Analyze scaling efficiency
    const recentScaling = recentHistory.filter(
      entry => entry.metrics.scaling.totalScaleUps > 0 || entry.metrics.scaling.totalScaleDowns > 0
    ).length

    if (recentScaling > 5) {
      insights.push('Frequent pool scaling detected')
      recommendations.push('Review pool sizing configuration and usage patterns')
      potentialIssues.push('Pool instability due to frequent scaling')
    }

    // Analyze error rates
    const errorRate = metrics.performance.failedQueries / metrics.performance.totalQueries
    if (errorRate > 0.05) {
      insights.push('High query error rate detected')
      recommendations.push('Investigate failing queries and database connectivity')
      potentialIssues.push('Database or application issues may exist')
    }

    const summary = `Pool health score: ${this.lastHealthScore}/100, ` +
                   `Utilization: ${(utilization * 100).toFixed(1)}%, ` +
                   `Average wait time: ${avgWaitTime.toFixed(0)}ms`

    return {
      summary,
      insights,
      recommendations,
      potentialIssues
    }
  }

  /**
   * Export monitoring data
   */
  exportData(format: 'json' | 'csv' | 'prometheus', timeRange = 3600000): string {
    const history = this.getMetricsHistory(timeRange)

    switch (format) {
      case 'json':
        return JSON.stringify({
          metrics: history,
          alerts: this.getAllAlerts(),
          healthScore: this.healthScoreHistory
        }, null, 2)

      case 'csv':
        return this.convertToCSV(history)

      case 'prometheus':
        return this.convertToPrometheus(history)

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<PoolMonitoringConfig>): void {
    this.config = { ...this.config, ...config }

    if (this.config.enabled && !this.metricsTimer) {
      this.startMonitoring()
    } else if (!this.config.enabled && this.metricsTimer) {
      this.stopMonitoring()
    }
  }

  /**
   * Cleanup monitoring resources
   */
  destroy(): void {
    this.stopMonitoring()
    this.metricsHistory = []
    this.alerts.clear()
    this.healthScoreHistory = []
  }

  // Private methods
  private mergeConfig(config: PoolMonitoringConfig): Required<PoolMonitoringConfig> {
    return {
      enabled: config.enabled ?? true,
      metricsIntervalMs: config.metricsIntervalMs ?? 30000,
      alertThresholds: {
        connectionUtilization: config.alertThresholds?.connectionUtilization ?? 0.9,
        acquisitionWaitTime: config.alertThresholds?.acquisitionWaitTime ?? 5000,
        errorRate: config.alertThresholds?.errorRate ?? 0.05,
        healthFailureRate: config.alertThresholds?.healthFailureRate ?? 0.2,
        scalingFrequency: config.alertThresholds?.scalingFrequency ?? 5
      },
      historyRetention: {
        metricsHistoryMs: config.historyRetention?.metricsHistoryMs ?? 3600000,
        alertHistoryMs: config.historyRetention?.alertHistoryMs ?? 86400000,
        maxHistoryEntries: config.historyRetention?.maxHistoryEntries ?? 1000
      },
      notifications: {
        enableConsoleLogging: config.notifications?.enableConsoleLogging ?? true,
        enableWebhook: config.notifications?.enableWebhook ?? false,
        webhookUrl: config.notifications?.webhookUrl,
        webhookTimeoutMs: config.notifications?.webhookTimeoutMs ?? 5000
      }
    }
  }

  private async collectMetrics(): Promise<DetailedPoolMetrics> {
    const metrics = await this.collectDetailedMetrics()

    // Store in history
    this.metricsHistory.push(metrics)

    // Cleanup old entries
    const cutoff = Date.now() - this.config.historyRetention.metricsHistoryMs
    this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp > cutoff)

    // Limit history size
    if (this.metricsHistory.length > this.config.historyRetention.maxHistoryEntries) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.historyRetention.maxHistoryEntries)
    }

    // Check for alerts
    await this.checkForAlerts(metrics)

    return metrics
  }

  private async collectDetailedMetrics(): Promise<DetailedPoolMetrics> {
    const baseMetrics = this.pool.getMetrics()
    const statistics = this.pool.getStatistics()
    const timestamp = Date.now()

    // Get connection details (simplified)
    const connections = []
    const poolMetrics = baseMetrics.pool

    // Add efficiency metrics
    const efficiency = {
      connectionUtilization: poolMetrics.activeConnections / poolMetrics.totalConnections,
      averageConnectionLifetime: statistics.uptime / Math.max(statistics.totalAcquisitions, 1),
      poolEfficiency: poolMetrics.idleConnections / poolMetrics.totalConnections,
      scalingEfficiency: Math.min(1, statistics.averageConnections / poolMetrics.totalConnections)
    }

    // Add performance history
    const recentHistory = this.getMetricsHistory(300000) // Last 5 minutes
    const acquisitionWaitTimeHistory = recentHistory.map(entry => ({
      timestamp: entry.timestamp,
      value: entry.performance.acquisitionWaitTime
    }))

    const queryTimeHistory = recentHistory.map(entry => ({
      timestamp: entry.timestamp,
      value: entry.performance.averageQueryTime
    }))

    const performance = {
      acquisitionWaitTimeHistory,
      queryTimeHistory,
      connectionCreationRate: baseMetrics.lifecycle.connectionsCreated / (statistics.uptime / 1000),
      connectionDestructionRate: baseMetrics.lifecycle.connectionsDestroyed / (statistics.uptime / 1000)
    }

    return {
      timestamp,
      ...baseMetrics,
      connections,
      efficiency,
      performance
    }
  }

  private async checkForAlerts(metrics: DetailedPoolMetrics): Promise<void> {
    const utilization = metrics.efficiency.connectionUtilization
    const waitTime = metrics.performance.acquisitionWaitTimeHistory[metrics.performance.acquisitionWaitTimeHistory.length - 1]?.value || 0
    const errorRate = metrics.performance.failedQueries / Math.max(metrics.performance.totalQueries, 1)
    const healthFailureRate = metrics.health.healthCheckFailures / Math.max(metrics.health.consecutiveHealthChecks + metrics.health.healthCheckFailures, 1)

    // Check connection utilization
    if (utilization > this.config.alertThresholds.connectionUtilization) {
      this.createAlert(
        'connection_exhaustion',
        'warning',
        `High connection utilization: ${(utilization * 100).toFixed(1)}%`,
        { utilization, activeConnections: metrics.pool.activeConnections, totalConnections: metrics.pool.totalConnections }
      )
    }

    // Check acquisition wait time
    if (waitTime > this.config.alertThresholds.acquisitionWaitTime) {
      this.createAlert(
        'high_wait_time',
        'warning',
        `High connection acquisition wait time: ${waitTime.toFixed(0)}ms`,
        { waitTime, threshold: this.config.alertThresholds.acquisitionWaitTime }
      )
    }

    // Check error rate
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert(
        'performance_degradation',
        'error',
        `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        { errorRate, totalQueries: metrics.performance.totalQueries, failedQueries: metrics.performance.failedQueries }
      )
    }

    // Check health check failures
    if (healthFailureRate > this.config.alertThresholds.healthFailureRate) {
      this.createAlert(
        'health_check_failure',
        'error',
        `High health check failure rate: ${(healthFailureRate * 100).toFixed(2)}%`,
        { healthFailureRate, failures: metrics.health.healthCheckFailures, totalChecks: metrics.health.consecutiveHealthChecks + metrics.health.healthCheckFailures }
      )
    }

    // Check scaling frequency
    const recentScaling = metrics.scaling.totalScaleUps + metrics.scaling.totalScaleDowns
    if (recentScaling > this.config.alertThresholds.scalingFrequency) {
      this.createAlert(
        'scaling_issue',
        'warning',
        `Frequent scaling detected: ${recentScaling} operations`,
        { recentScaling, scaleUps: metrics.scaling.totalScaleUps, scaleDowns: metrics.scaling.totalScaleDowns }
      )
    }
  }

  private calculateHealthScore(metrics: DetailedPoolMetrics): number {
    let score = 100

    // Deduct for high utilization
    const utilization = metrics.efficiency.connectionUtilization
    if (utilization > 0.8) {
      score -= (utilization - 0.8) * 200 // Up to 40 points
    }

    // Deduct for high wait times
    const avgWaitTime = metrics.performance.acquisitionWaitTimeHistory.reduce(
      (sum, entry) => sum + entry.value, 0
    ) / Math.max(metrics.performance.acquisitionWaitTimeHistory.length, 1)
    if (avgWaitTime > 1000) {
      score -= Math.min(30, (avgWaitTime - 1000) / 100) // Up to 30 points
    }

    // Deduct for errors
    const errorRate = metrics.performance.failedQueries / Math.max(metrics.performance.totalQueries, 1)
    if (errorRate > 0) {
      score -= Math.min(30, errorRate * 600) // Up to 30 points
    }

    // Deduct for health issues
    if (metrics.health.overallHealth === 'unhealthy') {
      score -= 40
    } else if (metrics.health.overallHealth === 'degraded') {
      score -= 20
    }

    return Math.max(0, Math.round(score))
  }

  private getHealthStatus(score: number): PoolHealthReport['status'] {
    if (score >= 90) return 'healthy'
    if (score >= 70) return 'degraded'
    if (score >= 50) return 'unhealthy'
    return 'critical'
  }

  private identifyIssues(metrics: DetailedPoolMetrics, healthScore: number): string[] {
    const issues: string[] = []

    if (metrics.efficiency.connectionUtilization > 0.9) {
      issues.push('Connection pool is under high pressure')
    }

    if (metrics.performance.acquisitionWaitTimeHistory.some(entry => entry.value > 5000)) {
      issues.push('High connection acquisition wait times detected')
    }

    if (metrics.performance.failedQueries / metrics.performance.totalQueries > 0.05) {
      issues.push('High query error rate detected')
    }

    if (metrics.health.overallHealth !== 'healthy') {
      issues.push(`Pool health status is ${metrics.health.overallHealth}`)
    }

    if (metrics.scaling.totalScaleUps + metrics.scaling.totalScaleDowns > 5) {
      issues.push('Frequent pool scaling detected')
    }

    if (healthScore < 70) {
      issues.push('Overall pool health is degraded')
    }

    return issues
  }

  private generateRecommendations(metrics: DetailedPoolMetrics, issues: string[]): string[] {
    const recommendations: string[] = []

    if (issues.some(issue => issue.includes('high pressure'))) {
      recommendations.push('Consider increasing max connections in the pool configuration')
      recommendations.push('Optimize query performance to reduce connection holding time')
    }

    if (issues.some(issue => issue.includes('wait times'))) {
      recommendations.push('Increase pool size or reduce connection timeout')
      recommendations.push('Review connection lifecycle management')
    }

    if (issues.some(issue => issue.includes('error rate'))) {
      recommendations.push('Investigate failing queries and database connectivity')
      recommendations.push('Check database logs for detailed error information')
    }

    if (issues.some(issue => issue.includes('health'))) {
      recommendations.push('Review database connectivity and configuration')
      recommendations.push('Check for network issues or database performance problems')
    }

    if (issues.some(issue => issue.includes('scaling'))) {
      recommendations.push('Review pool sizing configuration')
      recommendations.push('Consider increasing min connections to reduce scaling frequency')
    }

    if (metrics.efficiency.connectionUtilization < 0.3) {
      recommendations.push('Consider reducing pool size to conserve resources')
    }

    return recommendations
  }

  private calculateTrends(): PoolHealthReport['trends'] {
    const history = this.getMetricsHistory(3600000) // Last hour

    return {
      connectionUtilization: history.map(entry => ({
        timestamp: entry.timestamp,
        value: entry.efficiency.connectionUtilization
      })),
      performanceMetrics: history.map(entry => ({
        timestamp: entry.timestamp,
        acquisitionTime: entry.performance.acquisitionWaitTimeHistory[entry.performance.acquisitionWaitTimeHistory.length - 1]?.value || 0,
        queryTime: entry.performance.averageQueryTime
      })),
      healthScore: this.healthScoreHistory
    }
  }

  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - this.config.historyRetention.alertHistoryMs
    const toDelete: string[] = []

    for (const [id, alert] of this.alerts) {
      if (alert.timestamp < cutoff && alert.resolved) {
        toDelete.push(id)
      }
    }

    toDelete.forEach(id => this.alerts.delete(id))
  }

  private logAlert(alert: PoolAlert): void {
    if (!this.config.notifications.enableConsoleLogging) return

    const level = alert.severity === 'critical' ? 'error' :
                  alert.severity === 'error' ? 'error' :
                  alert.severity === 'warning' ? 'warn' : 'info'

    console[level](`[POOL ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.details)
  }

  private logInfo(message: string): void {
    if (this.config.notifications.enableConsoleLogging) {
      console.info(`[POOL MONITOR] ${message}`)
    }
  }

  private async sendNotification(alert: PoolAlert): Promise<void> {
    if (!this.config.notifications.enableWebhook || !this.config.notifications.webhookUrl) {
      return
    }

    try {
      const response = await fetch(this.config.notifications.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert,
          timestamp: Date.now(),
          source: 'connection-pool-monitor'
        }),
        signal: AbortSignal.timeout(this.config.notifications.webhookTimeoutMs)
      })

      if (!response.ok) {
        console.warn('Failed to send webhook notification:', response.statusText)
      }
    } catch (error) {
      console.warn('Webhook notification failed:', error)
    }
  }

  private convertToCSV(history: DetailedPoolMetrics[]): string {
    if (history.length === 0) return ''

    const headers = [
      'timestamp',
      'totalConnections',
      'activeConnections',
      'idleConnections',
      'connectionUtilization',
      'acquisitionWaitTime',
      'averageQueryTime',
      'totalQueries',
      'successfulQueries',
      'failedQueries',
      'healthScore'
    ]

    const rows = history.map(entry => [
      entry.timestamp,
      entry.pool.totalConnections,
      entry.pool.activeConnections,
      entry.pool.idleConnections,
      entry.efficiency.connectionUtilization,
      entry.performance.acquisitionWaitTimeHistory[entry.performance.acquisitionWaitTimeHistory.length - 1]?.value || 0,
      entry.performance.averageQueryTime,
      entry.performance.totalQueries,
      entry.performance.successfulQueries,
      entry.performance.failedQueries,
      this.lastHealthScore
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private convertToPrometheus(history: DetailedPoolMetrics[]): string {
    if (history.length === 0) return ''

    const latest = history[history.length - 1]
    const metrics = latest

    return [
      `# HELP pool_connections_total Total number of connections in the pool`,
      `# TYPE pool_connections_total gauge`,
      `pool_connections_total ${metrics.pool.totalConnections}`,
      '',
      `# HELP pool_connections_active Number of active connections`,
      `# TYPE pool_connections_active gauge`,
      `pool_connections_active ${metrics.pool.activeConnections}`,
      '',
      `# HELP pool_connections_idle Number of idle connections`,
      `# TYPE pool_connections_idle gauge`,
      `pool_connections_idle ${metrics.pool.idleConnections}`,
      '',
      `# HELP pool_utilization_ratio Connection pool utilization ratio`,
      `# TYPE pool_utilization_ratio gauge`,
      `pool_utilization_ratio ${metrics.efficiency.connectionUtilization}`,
      '',
      `# HELP pool_acquisition_wait_time_ms Connection acquisition wait time in milliseconds`,
      `# TYPE pool_acquisition_wait_time_ms gauge`,
      `pool_acquisition_wait_time_ms ${metrics.performance.acquisitionWaitTimeHistory[metrics.performance.acquisitionWaitTimeHistory.length - 1]?.value || 0}`,
      '',
      `# HELP pool_queries_total Total number of queries executed`,
      `# TYPE pool_queries_total counter`,
      `pool_queries_total ${metrics.performance.totalQueries}`,
      '',
      `# HELP pool_query_duration_seconds Average query duration in seconds`,
      `# TYPE pool_query_duration_seconds gauge`,
      `pool_query_duration_seconds ${metrics.performance.averageQueryTime / 1000}`,
      '',
      `# HELP pool_health_score Overall pool health score (0-100)`,
      `# TYPE pool_health_score gauge`,
      `pool_health_score ${this.lastHealthScore}`
    ].join('\n')
  }
}

/**
 * Factory function to create connection pool monitor
 */
export function createConnectionPoolMonitor(
  pool: EnhancedConnectionPool,
  config?: PoolMonitoringConfig
): ConnectionPoolMonitor {
  return new ConnectionPoolMonitor(pool, config)
}
