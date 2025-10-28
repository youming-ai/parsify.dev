import type { DatabaseHealthMonitor } from './health'
import type { DatabaseService, DatabaseServiceMetrics } from './service'

export interface MonitoringMetrics {
  timestamp: number
  database: DatabaseServiceMetrics
  system: {
    memoryUsage?: number
    cpuUsage?: number
    diskUsage?: number
    networkIO?: number
  }
  application: {
    activeConnections?: number
    requestRate?: number
    errorRate?: number
    responseTime?: number
  }
}

export interface MonitoringDashboard {
  addSystemMetrics(metrics: Partial<MonitoringMetrics['system']>): void
  addApplicationMetrics(metrics: Partial<MonitoringMetrics['application']>): void
  getMetricsHistory(timeRange?: number): MonitoringMetrics[]
  generateReport(timeRange?: number): MonitoringReport
  exportMetrics(format: 'json' | 'csv' | 'prometheus'): string
}

export interface MonitoringReport {
  timeRange: number
  summary: {
    avgResponseTime: number
    totalQueries: number
    errorRate: number
    uptime: number
    alertCount: number
  }
  trends: {
    responseTime: Array<{ timestamp: number; value: number }>
    queryRate: Array<{ timestamp: number; value: number }>
    errorRate: Array<{ timestamp: number; value: number }>
  }
  topSlowQueries: Array<{
    sql: string
    avgTime: number
    count: number
  }>
  alerts: Array<{
    type: string
    severity: string
    message: string
    timestamp: number
  }>
  recommendations: string[]
}

/**
 * Database monitoring dashboard
 */
export class DatabaseMonitoringDashboard implements MonitoringDashboard {
  private databaseService: DatabaseService
  private healthMonitor: DatabaseHealthMonitor
  private metricsHistory: MonitoringMetrics[] = []
  private maxHistorySize: number = 1000 // Keep last 1000 data points

  constructor(databaseService: DatabaseService, healthMonitor: DatabaseHealthMonitor) {
    this.databaseService = databaseService
    this.healthMonitor = healthMonitor

    // Start collecting metrics periodically
    this.startMetricsCollection()
  }

  /**
   * Add system metrics to monitoring data
   */
  addSystemMetrics(metrics: Partial<MonitoringMetrics['system']>): void {
    this.addMetricsEntry({ system: metrics })
  }

  /**
   * Add application metrics to monitoring data
   */
  addApplicationMetrics(metrics: Partial<MonitoringMetrics['application']>): void {
    this.addMetricsEntry({ application: metrics })
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(timeRange = 3600000): MonitoringMetrics[] {
    // Default 1 hour
    const cutoff = Date.now() - timeRange
    return this.metricsHistory.filter(entry => entry.timestamp >= cutoff)
  }

  /**
   * Generate monitoring report
   */
  generateReport(timeRange = 3600000): MonitoringReport {
    const history = this.getMetricsHistory(timeRange)

    if (history.length === 0) {
      return this.createEmptyReport(timeRange)
    }

    const summary = this.calculateSummary(history)
    const trends = this.calculateTrends(history)
    const topSlowQueries = this.getTopSlowQueries()
    const healthReport = this.healthMonitor.getHealthReport()

    return {
      timeRange,
      summary,
      trends,
      topSlowQueries,
      alerts: healthReport.alerts.slice(0, 10),
      recommendations: healthReport.recommendations,
    }
  }

  /**
   * Export metrics in different formats
   */
  exportMetrics(format: 'json' | 'csv' | 'prometheus'): string {
    const history = this.getMetricsHistory()

    switch (format) {
      case 'json':
        return JSON.stringify(history, null, 2)

      case 'csv':
        return this.convertToCSV(history)

      case 'prometheus':
        return this.convertToPrometheus(history)

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData() {
    const [currentMetrics, healthStatus, healthReport] = await Promise.all([
      this.databaseService.getMetrics(),
      this.healthMonitor.getHealthStatus(),
      this.healthMonitor.getHealthReport(),
    ])

    return {
      timestamp: Date.now(),
      health: {
        status: healthStatus.healthy ? 'healthy' : 'unhealthy',
        uptime: healthStatus.uptime,
        lastCheck: healthStatus.lastCheck,
        responseTime: healthStatus.responseTime,
        consecutiveFailures: healthStatus.consecutiveFailures,
      },
      metrics: currentMetrics,
      alerts: healthReport.alerts.slice(0, 5),
      recommendations: healthReport.recommendations,
      trends: this.calculateTrends(this.getMetricsHistory()),
    }
  }

  /**
   * Setup webhook for alerts
   */
  setupAlertWebhook(
    url: string,
    filters?: {
      severity?: ('warning' | 'error' | 'critical')[]
      types?: string[]
    }
  ): void {
    // This would integrate with the health monitor to send alerts to webhooks
    // Implementation would depend on the specific webhook service
    console.log(`Alert webhook setup for ${url} with filters:`, filters)
  }

  // Private methods
  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        const metrics = this.databaseService.getMetrics()
        this.addMetricsEntry({
          database: metrics,
        })
      } catch (error) {
        console.error('Failed to collect metrics:', error)
      }
    }, 30000)
  }

  private addMetricsEntry(data: Partial<MonitoringMetrics>): void {
    const entry: MonitoringMetrics = {
      timestamp: Date.now(),
      database: this.databaseService.getMetrics(),
      system: {},
      application: {},
      ...data,
    }

    this.metricsHistory.push(entry)

    // Keep only recent history
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize)
    }
  }

  private createEmptyReport(timeRange: number): MonitoringReport {
    return {
      timeRange,
      summary: {
        avgResponseTime: 0,
        totalQueries: 0,
        errorRate: 0,
        uptime: 0,
        alertCount: 0,
      },
      trends: {
        responseTime: [],
        queryRate: [],
        errorRate: [],
      },
      topSlowQueries: [],
      alerts: [],
      recommendations: ['No data available for the specified time range'],
    }
  }

  private calculateSummary(history: MonitoringMetrics[]): MonitoringReport['summary'] {
    const totalQueries = history.reduce(
      (sum, entry) => sum + entry.database.queries.totalQueries,
      0
    )
    const totalFailed = history.reduce(
      (sum, entry) => sum + entry.database.queries.failedQueries,
      0
    )
    const avgResponseTime =
      history.reduce((sum, entry) => sum + entry.database.queries.averageQueryTime, 0) /
      history.length

    const errorRate = totalQueries > 0 ? totalFailed / totalQueries : 0
    const uptime = history.length > 0 ? history[history.length - 1].database.service.uptime : 0
    const alertCount = this.healthMonitor.getAlerts().length

    return {
      avgResponseTime,
      totalQueries,
      errorRate,
      uptime,
      alertCount,
    }
  }

  private calculateTrends(history: MonitoringMetrics[]): MonitoringReport['trends'] {
    return {
      responseTime: history.map(entry => ({
        timestamp: entry.timestamp,
        value: entry.database.queries.averageQueryTime,
      })),
      queryRate: history.map(entry => ({
        timestamp: entry.timestamp,
        value: entry.database.queries.totalQueries,
      })),
      errorRate: history.map(entry => ({
        timestamp: entry.timestamp,
        value:
          entry.database.queries.totalQueries > 0
            ? entry.database.queries.failedQueries / entry.database.queries.totalQueries
            : 0,
      })),
    }
  }

  private getTopSlowQueries(): MonitoringReport['topSlowQueries'] {
    // This would integrate with the database service to get slow query data
    // For now, return empty array
    return []
  }

  private convertToCSV(history: MonitoringMetrics[]): string {
    if (history.length === 0) return ''

    const headers = [
      'timestamp',
      'totalQueries',
      'successfulQueries',
      'failedQueries',
      'averageQueryTime',
      'activeConnections',
      'totalConnections',
      'healthyConnections',
    ]

    const rows = history.map(entry => [
      entry.timestamp,
      entry.database.queries.totalQueries,
      entry.database.queries.successfulQueries,
      entry.database.queries.failedQueries,
      entry.database.queries.averageQueryTime,
      entry.database.connections.activeConnections,
      entry.database.connections.totalConnections,
      entry.database.service.healthyConnections,
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private convertToPrometheus(history: MonitoringMetrics[]): string {
    if (history.length === 0) return ''

    const latest = history[history.length - 1]
    const metrics = latest.database

    return [
      `# HELP database_queries_total Total number of database queries`,
      `# TYPE database_queries_total counter`,
      `database_queries_total ${metrics.queries.totalQueries}`,
      '',
      `# HELP database_queries_successful Total number of successful database queries`,
      `# TYPE database_queries_successful counter`,
      `database_queries_successful ${metrics.queries.successfulQueries}`,
      '',
      `# HELP database_queries_failed Total number of failed database queries`,
      `# TYPE database_queries_failed counter`,
      `database_queries_failed ${metrics.queries.failedQueries}`,
      '',
      `# HELP database_query_duration_seconds Average query duration in seconds`,
      `# TYPE database_query_duration_seconds gauge`,
      `database_query_duration_seconds ${metrics.queries.averageQueryTime / 1000}`,
      '',
      `# HELP database_connections_active Number of active database connections`,
      `# TYPE database_connections_active gauge`,
      `database_connections_active ${metrics.connections.activeConnections}`,
      '',
      `# HELP database_connections_total Total number of database connections`,
      `# TYPE database_connections_total gauge`,
      `database_connections_total ${metrics.connections.totalConnections}`,
    ].join('\n')
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.metricsHistory = []
  }
}

/**
 * Factory function to create monitoring dashboard
 */
export function createDatabaseMonitoringDashboard(
  databaseService: DatabaseService,
  healthMonitor: DatabaseHealthMonitor
): DatabaseMonitoringDashboard {
  return new DatabaseMonitoringDashboard(databaseService, healthMonitor)
}
