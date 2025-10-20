import { EnhancedTransaction, TransactionManager, TransactionMetrics, TransactionStatus, IsolationLevel } from './transaction'

export interface TransactionMonitoringConfig {
  enabled?: boolean
  slowTransactionThreshold?: number
  maxQueryHistory?: number
  enableAlerts?: boolean
  enableMetricsExport?: boolean
  metricsRetentionPeriod?: number
  alertingThresholds?: {
    maxDuration?: number
    maxQueryCount?: number
    maxFailureRate?: number
    maxDeadlockRate?: number
  }
  exportFormats?: Array<'json' | 'prometheus' | 'csv'>
}

export interface TransactionAlert {
  id: string
  transactionId: string
  type: 'slow' | 'failed' | 'deadlock' | 'timeout' | 'high_query_count'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  metrics: Partial<TransactionMetrics>
  resolved: boolean
  resolvedAt?: number
}

export interface TransactionSnapshot {
  timestamp: number
  activeTransactions: number
  completedTransactions: number
  failedTransactions: number
  averageDuration: number
  totalQueries: number
  isolationLevels: Record<IsolationLevel, number>
  alerts: TransactionAlert[]
}

export interface TransactionReport {
  timeRange: { start: number; end: number }
  summary: {
    totalTransactions: number
    successRate: number
    averageDuration: number
    averageQueryCount: number
    deadlockRate: number
    timeoutRate: number
  }
  performance: {
    slowestTransactions: TransactionMetrics[]
    fastestTransactions: TransactionMetrics[]
    queryHeavyTransactions: TransactionMetrics[]
  }
  alerts: TransactionAlert[]
  trends: {
    transactionRate: Array<{ timestamp: number; count: number }>
    successRate: Array<{ timestamp: number; rate: number }>
    averageDuration: Array<{ timestamp: number; duration: number }>
  }
  recommendations: string[]
}

/**
 * Transaction monitoring system with alerting and performance analysis
 */
export class TransactionMonitor {
  private config: Required<TransactionMonitoringConfig>
  private transactionHistory: TransactionMetrics[] = []
  private alerts: Map<string, TransactionAlert> = new Map()
  private snapshots: TransactionSnapshot[] = []
  private alertCallbacks: Array<(alert: TransactionAlert) => void> = []
  private isMonitoring: boolean = false
  private monitoringInterval?: ReturnType<typeof setInterval>
  private snapshotInterval?: ReturnType<typeof setInterval>

  constructor(config: TransactionMonitoringConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      slowTransactionThreshold: config.slowTransactionThreshold ?? 5000, // 5 seconds
      maxQueryHistory: config.maxQueryHistory ?? 10000,
      enableAlerts: config.enableAlerts ?? true,
      enableMetricsExport: config.enableMetricsExport ?? true,
      metricsRetentionPeriod: config.metricsRetentionPeriod ?? 24 * 60 * 60 * 1000, // 24 hours
      alertingThresholds: {
        maxDuration: config.alertingThresholds?.maxDuration ?? 30000, // 30 seconds
        maxQueryCount: config.alertingThresholds?.maxQueryCount ?? 100,
        maxFailureRate: config.alertingThresholds?.maxFailureRate ?? 5, // 5%
        maxDeadlockRate: config.alertingThresholds?.maxDeadlockRate ?? 1, // 1%
      },
      exportFormats: config.exportFormats ?? ['json', 'prometheus']
    }
  }

  /**
   * Start transaction monitoring
   */
  startMonitoring(transactionManager: TransactionManager): void {
    if (!this.config.enabled || this.isMonitoring) {
      return
    }

    this.isMonitoring = true

    // Monitor active transactions every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.monitorActiveTransactions(transactionManager)
    }, 5000)

    // Create snapshots every minute
    this.snapshotInterval = setInterval(() => {
      this.createSnapshot(transactionManager)
    }, 60000)

    console.log('Transaction monitoring started')
  }

  /**
   * Stop transaction monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval)
      this.snapshotInterval = undefined
    }

    console.log('Transaction monitoring stopped')
  }

  /**
   * Record completed transaction metrics
   */
  recordTransaction(transaction: EnhancedTransaction): void {
    if (!this.config.enabled) {
      return
    }

    const metrics = transaction.getMetrics()
    this.transactionHistory.push(metrics)

    // Maintain history size
    if (this.transactionHistory.length > this.config.maxQueryHistory) {
      this.transactionHistory = this.transactionHistory.slice(-this.config.maxQueryHistory)
    }

    // Check for alerts
    this.checkTransactionAlerts(metrics)

    // Clean up old data
    this.cleanupOldData()
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: TransactionAlert) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): TransactionAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): TransactionAlert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      return true
    }
    return false
  }

  /**
   * Generate transaction report
   */
  generateReport(timeRangeMs = 3600000): TransactionReport { // Default 1 hour
    const now = Date.now()
    const start = now - timeRangeMs
    const transactions = this.getTransactionsInRange(start, now)
    const alerts = this.getAlertsInRange(start, now)
    const snapshots = this.getSnapshotsInRange(start, now)

    const summary = this.calculateSummary(transactions)
    const performance = this.analyzePerformance(transactions)
    const trends = this.calculateTrends(snapshots)
    const recommendations = this.generateRecommendations(summary, performance, alerts)

    return {
      timeRange: { start, end: now },
      summary,
      performance,
      alerts,
      trends,
      recommendations
    }
  }

  /**
   * Export metrics in specified format
   */
  exportMetrics(format: 'json' | 'prometheus' | 'csv' = 'json'): string {
    switch (format) {
      case 'json':
        return this.exportAsJSON()
      case 'prometheus':
        return this.exportAsPrometheus()
      case 'csv':
        return this.exportAsCSV()
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Get real-time monitoring dashboard data
   */
  getDashboardData(transactionManager: TransactionManager) {
    const activeTransactions = transactionManager.getActiveTransactions()
    const activeAlerts = this.getActiveAlerts()
    const recentTransactions = this.transactionHistory.slice(-20)

    return {
      timestamp: Date.now(),
      active: {
        count: activeTransactions.length,
        transactions: activeTransactions.map(tx => tx.getMetrics())
      },
      alerts: {
        count: activeAlerts.length,
        recent: activeAlerts.slice(0, 10)
      },
      performance: {
        recentTransactions: recentTransactions,
        averageDuration: this.calculateAverageDuration(recentTransactions),
        successRate: this.calculateSuccessRate(recentTransactions)
      },
      health: {
        status: this.getHealthStatus(activeAlerts),
        recommendations: this.getRealtimeRecommendations(activeTransactions, activeAlerts)
      }
    }
  }

  // Private methods

  private monitorActiveTransactions(transactionManager: TransactionManager): void {
    const activeTransactions = transactionManager.getActiveTransactions()

    for (const transaction of activeTransactions) {
      const metrics = transaction.getMetrics()

      // Check for long-running transactions
      if (metrics.duration && metrics.duration > this.config.slowTransactionThreshold) {
        this.checkSlowTransactionAlert(metrics, transaction)
      }

      // Check for high query count
      if (metrics.queryCount > this.config.alertingThresholds.maxQueryCount) {
        this.checkHighQueryCountAlert(metrics, transaction)
      }
    }
  }

  private createSnapshot(transactionManager: TransactionManager): void {
    const activeTransactions = transactionManager.getActiveTransactions()
    const completedTransactions = this.transactionHistory.filter(
      tx => tx.endTime && tx.endTime > Date.now() - 600000 // Last 10 minutes
    )

    const snapshot: TransactionSnapshot = {
      timestamp: Date.now(),
      activeTransactions: activeTransactions.length,
      completedTransactions: completedTransactions.length,
      failedTransactions: completedTransactions.filter(tx =>
        tx.status === TransactionStatus.FAILED ||
        tx.status === TransactionStatus.ROLLED_BACK ||
        tx.status === TransactionStatus.DEADLOCKED ||
        tx.status === TransactionStatus.TIMEOUT
      ).length,
      averageDuration: this.calculateAverageDuration(completedTransactions),
      totalQueries: completedTransactions.reduce((sum, tx) => sum + tx.queryCount, 0),
      isolationLevels: this.getIsolationLevelDistribution(completedTransactions),
      alerts: this.getActiveAlerts()
    }

    this.snapshots.push(snapshot)

    // Keep only recent snapshots
    if (this.snapshots.length > 1440) { // 24 hours at 1-minute intervals
      this.snapshots = this.snapshots.slice(-1440)
    }
  }

  private checkTransactionAlerts(metrics: TransactionMetrics): void {
    if (!this.config.enableAlerts) {
      return
    }

    // Check for slow transaction
    if (metrics.duration && metrics.duration > this.config.alertingThresholds.maxDuration) {
      this.createAlert({
        transactionId: metrics.transactionId,
        type: 'slow',
        severity: metrics.duration > this.config.alertingThresholds.maxDuration * 2 ? 'high' : 'medium',
        message: `Transaction took ${metrics.duration}ms (threshold: ${this.config.alertingThresholds.maxDuration}ms)`,
        metrics
      })
    }

    // Check for failed transaction
    if (metrics.status === TransactionStatus.FAILED || metrics.status === TransactionStatus.ROLLED_BACK) {
      this.createAlert({
        transactionId: metrics.transactionId,
        type: 'failed',
        severity: 'medium',
        message: `Transaction failed: ${metrics.rollbackReason || 'Unknown reason'}`,
        metrics
      })
    }

    // Check for deadlock
    if (metrics.status === TransactionStatus.DEADLOCKED) {
      this.createAlert({
        transactionId: metrics.transactionId,
        type: 'deadlock',
        severity: 'high',
        message: 'Transaction was rolled back due to deadlock',
        metrics
      })
    }

    // Check for timeout
    if (metrics.status === TransactionStatus.TIMEOUT) {
      this.createAlert({
        transactionId: metrics.transactionId,
        type: 'timeout',
        severity: 'high',
        message: `Transaction timed out after ${metrics.duration}ms`,
        metrics
      })
    }
  }

  private checkSlowTransactionAlert(metrics: TransactionMetrics, transaction: EnhancedTransaction): void {
    if (!this.config.enableAlerts) return

    const existingAlert = Array.from(this.alerts.values()).find(
      alert => alert.transactionId === metrics.transactionId &&
               alert.type === 'slow' &&
               !alert.resolved
    )

    if (!existingAlert) {
      this.createAlert({
        transactionId: metrics.transactionId,
        type: 'slow',
        severity: 'medium',
        message: `Transaction has been running for ${metrics.duration}ms`,
        metrics: {
          ...metrics,
          queryCount: transaction.getQueryHistory().length
        }
      })
    }
  }

  private checkHighQueryCountAlert(metrics: TransactionMetrics, transaction: EnhancedTransaction): void {
    if (!this.config.enableAlerts) return

    const existingAlert = Array.from(this.alerts.values()).find(
      alert => alert.transactionId === metrics.transactionId &&
               alert.type === 'high_query_count' &&
               !alert.resolved
    )

    if (!existingAlert) {
      this.createAlert({
        transactionId: metrics.transactionId,
        type: 'high_query_count',
        severity: 'low',
        message: `Transaction has executed ${metrics.queryCount} queries`,
        metrics
      })
    }
  }

  private createAlert(alertData: Omit<TransactionAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: TransactionAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false
    }

    this.alerts.set(alert.id, alert)

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Alert callback error:', error)
      }
    })
  }

  private getTransactionsInRange(start: number, end: number): TransactionMetrics[] {
    return this.transactionHistory.filter(tx =>
      tx.endTime && tx.endTime >= start && tx.endTime <= end
    )
  }

  private getAlertsInRange(start: number, end: number): TransactionAlert[] {
    return Array.from(this.alerts.values()).filter(alert =>
      alert.timestamp >= start && alert.timestamp <= end
    )
  }

  private getSnapshotsInRange(start: number, end: number): TransactionSnapshot[] {
    return this.snapshots.filter(snapshot =>
      snapshot.timestamp >= start && snapshot.timestamp <= end
    )
  }

  private calculateSummary(transactions: TransactionMetrics[]) {
    const total = transactions.length
    const successful = transactions.filter(tx => tx.status === TransactionStatus.COMMITTED).length
    const deadlocked = transactions.filter(tx => tx.status === TransactionStatus.DEADLOCKED).length
    const timedOut = transactions.filter(tx => tx.status === TransactionStatus.TIMEOUT).length

    const durations = transactions.map(tx => tx.duration).filter(d => d !== undefined) as number[]
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0

    return {
      totalTransactions: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageDuration,
      averageQueryCount: total > 0 ? transactions.reduce((sum, tx) => sum + tx.queryCount, 0) / total : 0,
      deadlockRate: total > 0 ? (deadlocked / total) * 100 : 0,
      timeoutRate: total > 0 ? (timedOut / total) * 100 : 0
    }
  }

  private analyzePerformance(transactions: TransactionMetrics[]) {
    const sortedByDuration = [...transactions].sort((a, b) => (b.duration || 0) - (a.duration || 0))
    const sortedBySpeed = [...transactions].sort((a, b) => (a.duration || 0) - (b.duration || 0))
    const sortedByQueryCount = [...transactions].sort((a, b) => b.queryCount - a.queryCount)

    return {
      slowestTransactions: sortedByDuration.slice(0, 10),
      fastestTransactions: sortedBySpeed.slice(0, 10),
      queryHeavyTransactions: sortedByQueryCount.slice(0, 10)
    }
  }

  private calculateTrends(snapshots: TransactionSnapshot[]) {
    return {
      transactionRate: snapshots.map(s => ({ timestamp: s.timestamp, count: s.completedTransactions })),
      successRate: snapshots.map(s => ({
        timestamp: s.timestamp,
        rate: s.completedTransactions > 0 ? ((s.completedTransactions - s.failedTransactions) / s.completedTransactions) * 100 : 0
      })),
      averageDuration: snapshots.map(s => ({ timestamp: s.timestamp, duration: s.averageDuration }))
    }
  }

  private generateRecommendations(summary: any, performance: any, alerts: TransactionAlert[]): string[] {
    const recommendations: string[] = []

    if (summary.successRate < 95) {
      recommendations.push('Transaction success rate is below 95%. Investigate failure causes.')
    }

    if (summary.averageDuration > 5000) {
      recommendations.push('Average transaction duration is high. Consider optimizing queries or breaking up large transactions.')
    }

    if (summary.deadlockRate > 1) {
      recommendations.push('High deadlock rate detected. Consider reducing transaction isolation level or optimizing query order.')
    }

    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    if (criticalAlerts.length > 0) {
      recommendations.push(`${criticalAlerts.length} critical alerts require immediate attention.`)
    }

    if (performance.slowestTransactions.length > 0 && performance.slowestTransactions[0].duration && performance.slowestTransactions[0].duration > 30000) {
      recommendations.push('Some transactions are taking longer than 30 seconds. Review and optimize these transactions.')
    }

    return recommendations
  }

  private calculateAverageDuration(transactions: TransactionMetrics[]): number {
    const durations = transactions.map(tx => tx.duration).filter(d => d !== undefined) as number[]
    return durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0
  }

  private calculateSuccessRate(transactions: TransactionMetrics[]): number {
    if (transactions.length === 0) return 100
    const successful = transactions.filter(tx => tx.status === TransactionStatus.COMMITTED).length
    return (successful / transactions.length) * 100
  }

  private getIsolationLevelDistribution(transactions: TransactionMetrics[]): Record<IsolationLevel, number> {
    return transactions.reduce((acc, tx) => {
      acc[tx.isolationLevel] = (acc[tx.isolationLevel] || 0) + 1
      return acc
    }, {} as Record<IsolationLevel, number>)
  }

  private getHealthStatus(alerts: TransactionAlert[]): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved)
    const highAlerts = alerts.filter(a => a.severity === 'high' && !a.resolved)

    if (criticalAlerts.length > 0) return 'critical'
    if (highAlerts.length > 0 || alerts.length > 10) return 'warning'
    return 'healthy'
  }

  private getRealtimeRecommendations(activeTransactions: EnhancedTransaction[], activeAlerts: TransactionAlert[]): string[] {
    const recommendations: string[] = []

    if (activeTransactions.length > 50) {
      recommendations.push('High number of concurrent transactions. Consider implementing connection pooling.')
    }

    const longRunningTransactions = activeTransactions.filter(tx => tx.getDuration() > 10000)
    if (longRunningTransactions.length > 0) {
      recommendations.push(`${longRunningTransactions.length} transactions have been running for more than 10 seconds.`)
    }

    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
    if (criticalAlerts.length > 0) {
      recommendations.push(`${criticalAlerts.length} critical alerts need immediate attention.`)
    }

    return recommendations
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.metricsRetentionPeriod

    // Clean up transaction history
    this.transactionHistory = this.transactionHistory.filter(tx =>
      (tx.endTime || tx.startTime) > cutoff
    )

    // Clean up resolved alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.alerts.delete(id)
      }
    }

    // Clean up old snapshots
    this.snapshots = this.snapshots.filter(snapshot => snapshot.timestamp > cutoff)
  }

  private exportAsJSON(): string {
    return JSON.stringify({
      transactions: this.transactionHistory,
      alerts: Array.from(this.alerts.values()),
      snapshots: this.snapshots,
      timestamp: Date.now()
    }, null, 2)
  }

  private exportAsPrometheus(): string {
    const transactions = this.transactionHistory.slice(-100) // Last 100 transactions
    const now = Date.now()
    const recentTransactions = transactions.filter(tx =>
      tx.endTime && (now - tx.endTime) < 300000 // Last 5 minutes
    )

    const totalTransactions = transactions.length
    const successfulTransactions = transactions.filter(tx => tx.status === TransactionStatus.COMMITTED).length
    const failedTransactions = transactions.filter(tx =>
      tx.status === TransactionStatus.FAILED ||
      tx.status === TransactionStatus.ROLLED_BACK
    ).length
    const deadlockedTransactions = transactions.filter(tx => tx.status === TransactionStatus.DEADLOCKED).length

    const averageDuration = this.calculateAverageDuration(recentTransactions)
    const activeAlerts = this.getActiveAlerts().length

    return [
      `# HELP database_transactions_total Total number of database transactions`,
      `# TYPE database_transactions_total counter`,
      `database_transactions_total ${totalTransactions}`,
      '',
      `# HELP database_transactions_successful Total number of successful database transactions`,
      `# TYPE database_transactions_successful counter`,
      `database_transactions_successful ${successfulTransactions}`,
      '',
      `# HELP database_transactions_failed Total number of failed database transactions`,
      `# TYPE database_transactions_failed counter`,
      `database_transactions_failed ${failedTransactions}`,
      '',
      `# HELP database_transactions_deadlocked Total number of deadlocked database transactions`,
      `# TYPE database_transactions_deadlocked counter`,
      `database_transactions_deadlocked ${deadlockedTransactions}`,
      '',
      `# HELP database_transaction_duration_seconds Average transaction duration in seconds`,
      `# TYPE database_transaction_duration_seconds gauge`,
      `database_transaction_duration_seconds ${averageDuration / 1000}`,
      '',
      `# HELP database_active_alerts Number of active transaction alerts`,
      `# TYPE database_active_alerts gauge`,
      `database_active_alerts ${activeAlerts}`,
      '',
      `# HELP database_active_transactions Number of currently active transactions`,
      `# TYPE database_active_transactions gauge`,
      `database_active_transactions ${recentTransactions.length}`
    ].join('\n')
  }

  private exportAsCSV(): string {
    if (this.transactionHistory.length === 0) return ''

    const headers = [
      'transactionId',
      'startTime',
      'endTime',
      'duration',
      'status',
      'isolationLevel',
      'queryCount',
      'retryCount',
      'rollbackReason'
    ]

    const rows = this.transactionHistory.map(tx => [
      tx.transactionId,
      tx.startTime,
      tx.endTime || '',
      tx.duration || '',
      tx.status,
      tx.isolationLevel,
      tx.queryCount,
      tx.retryCount,
      tx.rollbackReason || ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

/**
 * Global transaction monitor instance
 */
export const globalTransactionMonitor = new TransactionMonitor()
