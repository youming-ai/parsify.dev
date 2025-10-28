import { z } from 'zod'
import type { QueueMetrics } from './job-queue'

// Monitoring metrics schema
export const QueueMonitoringMetricsSchema = z.object({
  timestamp: z.number(),
  queueName: z.string(),
  totalJobs: z.number().default(0),
  pendingJobs: z.number().default(0),
  runningJobs: z.number().default(0),
  completedJobs: z.number().default(0),
  failedJobs: z.number().default(0),
  deadLetterJobs: z.number().default(0),
  avgProcessingTimeMs: z.number().default(0),
  throughputPerMinute: z.number().default(0),
  successRate: z.number().default(0),
  errorRate: z.number().default(0),
  retryRate: z.number().default(0),
  queueDepth: z.number().default(0),
  maxWaitTimeMs: z.number().default(0),
  avgWaitTimeMs: z.number().default(0),
})

export type QueueMonitoringMetrics = z.infer<typeof QueueMonitoringMetricsSchema>

// Alert configuration schema
export const QueueAlertConfigSchema = z.object({
  enabled: z.boolean().default(true),
  queueDepthThreshold: z.number().default(1000),
  errorRateThreshold: z.number().default(10), // percentage
  processingTimeThreshold: z.number().default(300000), // 5 minutes
  deadLetterThreshold: z.number().default(100),
  noProcessingAlertThreshold: z.number().default(300000), // 5 minutes
  webhookUrl: z.string().optional(),
  emailRecipients: z.array(z.string()).optional(),
})

export type QueueAlertConfig = z.infer<typeof QueueAlertConfigSchema>

// Queue alert schema
export const QueueAlertSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['queue_depth', 'error_rate', 'processing_time', 'dead_letter', 'no_processing']),
  queueName: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  value: z.number(),
  threshold: z.number(),
  timestamp: z.number(),
  resolved: z.boolean().default(false),
  resolvedAt: z.number().nullable().default(null),
})

export type QueueAlert = z.infer<typeof QueueAlertSchema>

/**
 * Queue Monitoring System
 *
 * Provides real-time monitoring, alerting, and analytics for queue systems
 */
export class QueueMonitoringSystem {
  private env: Record<string, any>
  private config: QueueAlertConfig
  private metrics: Map<string, QueueMonitoringMetrics[]> = new Map()
  private alerts: Map<string, QueueAlert> = new Map()
  private retentionHours: number = 24

  constructor(env: Record<string, any>, config?: Partial<QueueAlertConfig>) {
    this.env = env
    this.config = QueueAlertConfig.parse({
      enabled: true,
      queueDepthThreshold: 1000,
      errorRateThreshold: 10,
      processingTimeThreshold: 300000,
      deadLetterThreshold: 100,
      noProcessingAlertThreshold: 300000,
      ...config,
    })
  }

  /**
   * Record metrics for a queue
   */
  async recordMetrics(
    queueName: string,
    queueMetrics: QueueMetrics,
    queueSize: number,
    _deadLetterSize: number,
    waitTimes: number[] = []
  ): Promise<void> {
    const timestamp = Date.now()

    // Calculate additional metrics
    const totalJobs = queueMetrics.completedJobs + queueMetrics.failedJobs
    const successRate = totalJobs > 0 ? (queueMetrics.completedJobs / totalJobs) * 100 : 0
    const errorRate = totalJobs > 0 ? (queueMetrics.failedJobs / totalJobs) * 100 : 0
    const retryRate =
      totalJobs > 0
        ? ((queueMetrics.failedJobs * queueMetrics.avgProcessingTimeMs) / totalJobs) * 100
        : 0

    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0
    const avgWaitTime =
      waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0

    const metrics: QueueMonitoringMetrics = {
      timestamp,
      queueName,
      totalJobs: queueMetrics.totalJobs,
      pendingJobs: queueMetrics.pendingJobs,
      runningJobs: queueMetrics.runningJobs,
      completedJobs: queueMetrics.completedJobs,
      failedJobs: queueMetrics.failedJobs,
      deadLetterJobs: queueMetrics.deadLetterJobs,
      avgProcessingTimeMs: queueMetrics.avgProcessingTimeMs,
      throughputPerMinute: queueMetrics.throughputPerMinute,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      retryRate: Math.round(retryRate * 100) / 100,
      queueDepth: queueSize,
      maxWaitTimeMs: maxWaitTime,
      avgWaitTimeMs: Math.round(avgWaitTime),
    }

    // Store metrics
    if (!this.metrics.has(queueName)) {
      this.metrics.set(queueName, [])
    }

    const queueMetricsList = this.metrics.get(queueName)!
    queueMetricsList.push(metrics)

    // Retention cleanup
    this.cleanupOldMetrics(queueName)

    // Store in KV for persistence
    await this.persistMetrics(queueName, metrics)

    // Check for alerts
    if (this.config.enabled) {
      await this.checkAlerts(queueName, metrics)
    }
  }

  /**
   * Get metrics for a specific queue
   */
  getMetrics(queueName: string, hours = 1): QueueMonitoringMetrics[] {
    const queueMetrics = this.metrics.get(queueName) || []
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000

    return queueMetrics
      .filter(m => m.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get aggregated metrics for all queues
   */
  getAllMetrics(hours = 1): Record<string, QueueMonitoringMetrics[]> {
    const result: Record<string, QueueMonitoringMetrics[]> = {}

    for (const queueName of this.metrics.keys()) {
      result[queueName] = this.getMetrics(queueName, hours)
    }

    return result
  }

  /**
   * Get analytics summary for a queue
   */
  async getAnalyticsSummary(
    queueName: string,
    hours = 24
  ): Promise<{
    period: { start: number; end: number }
    summary: {
      totalJobs: number
      successRate: number
      errorRate: number
      avgProcessingTime: number
      avgWaitTime: number
      throughputPerMinute: number
      peakQueueDepth: number
      avgQueueDepth: number
    }
    trends: {
      processingTime: 'improving' | 'degrading' | 'stable'
      throughput: 'increasing' | 'decreasing' | 'stable'
      errorRate: 'improving' | 'degrading' | 'stable'
    }
  }> {
    const metrics = this.getMetrics(queueName, hours)

    if (metrics.length === 0) {
      return {
        period: {
          start: Date.now() - hours * 60 * 60 * 1000,
          end: Date.now(),
        },
        summary: {
          totalJobs: 0,
          successRate: 0,
          errorRate: 0,
          avgProcessingTime: 0,
          avgWaitTime: 0,
          throughputPerMinute: 0,
          peakQueueDepth: 0,
          avgQueueDepth: 0,
        },
        trends: {
          processingTime: 'stable',
          throughput: 'stable',
          errorRate: 'stable',
        },
      }
    }

    const start = metrics[metrics.length - 1].timestamp
    const end = metrics[0].timestamp

    // Calculate summary
    const totalJobs = metrics.reduce((sum, m) => sum + m.totalJobs, 0)
    const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length
    const avgProcessingTime =
      metrics.reduce((sum, m) => sum + m.avgProcessingTimeMs, 0) / metrics.length
    const avgWaitTime = metrics.reduce((sum, m) => sum + m.avgWaitTimeMs, 0) / metrics.length
    const avgThroughput =
      metrics.reduce((sum, m) => sum + m.throughputPerMinute, 0) / metrics.length
    const peakQueueDepth = Math.max(...metrics.map(m => m.queueDepth))
    const avgQueueDepth = metrics.reduce((sum, m) => sum + m.queueDepth, 0) / metrics.length

    // Calculate trends (compare first half with second half)
    const midPoint = Math.floor(metrics.length / 2)
    const firstHalf = metrics.slice(midPoint)
    const secondHalf = metrics.slice(0, midPoint)

    const processingTimeTrend = this.calculateTrend(
      firstHalf.map(m => m.avgProcessingTimeMs),
      secondHalf.map(m => m.avgProcessingTimeMs),
      'lower'
    )

    const throughputTrend = this.calculateTrend(
      firstHalf.map(m => m.throughputPerMinute),
      secondHalf.map(m => m.throughputPerMinute),
      'higher'
    )

    const errorRateTrend = this.calculateTrend(
      firstHalf.map(m => m.errorRate),
      secondHalf.map(m => m.errorRate),
      'lower'
    )

    return {
      period: { start, end },
      summary: {
        totalJobs,
        successRate: Math.round(avgSuccessRate * 100) / 100,
        errorRate: Math.round(avgErrorRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        avgWaitTime: Math.round(avgWaitTime),
        throughputPerMinute: Math.round(avgThroughput * 100) / 100,
        peakQueueDepth,
        avgQueueDepth: Math.round(avgQueueDepth),
      },
      trends: {
        processingTime: processingTimeTrend,
        throughput: throughputTrend,
        errorRate: errorRateTrend,
      },
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): QueueAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * Get alerts for a specific queue
   */
  getQueueAlerts(queueName: string): QueueAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.queueName === queueName)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      await this.persistAlert(alert)
    }
  }

  /**
   * Get health status based on metrics and alerts
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'critical'
    queues: Record<
      string,
      {
        status: 'healthy' | 'warning' | 'critical'
        issues: string[]
        metrics: QueueMonitoringMetrics | null
      }
    >
    activeAlerts: number
  }> {
    const queues: Record<string, any> = {}
    let hasCritical = false
    let hasWarning = false

    for (const queueName of this.metrics.keys()) {
      const latestMetrics = this.getMetrics(queueName, 1)[0] || null
      const queueAlerts = this.getQueueAlerts(queueName).filter(a => !a.resolved)
      const issues: string[] = []

      let status: 'healthy' | 'warning' | 'critical' = 'healthy'

      if (latestMetrics) {
        if (latestMetrics.queueDepth > this.config.queueDepthThreshold) {
          status = status === 'critical' ? 'critical' : 'warning'
          issues.push(`High queue depth: ${latestMetrics.queueDepth}`)
        }

        if (latestMetrics.errorRate > this.config.errorRateThreshold) {
          status = 'critical'
          issues.push(`High error rate: ${latestMetrics.errorRate}%`)
        }

        if (latestMetrics.avgProcessingTimeMs > this.config.processingTimeThreshold) {
          status = status === 'critical' ? 'critical' : 'warning'
          issues.push(`High processing time: ${latestMetrics.avgProcessingTimeMs}ms`)
        }

        if (latestMetrics.deadLetterJobs > this.config.deadLetterThreshold) {
          status = 'critical'
          issues.push(`High dead letter count: ${latestMetrics.deadLetterJobs}`)
        }
      }

      if (queueAlerts.some(a => a.severity === 'critical')) {
        status = 'critical'
      } else if (queueAlerts.some(a => a.severity === 'warning')) {
        status = status === 'critical' ? 'critical' : 'warning'
      }

      if (status === 'critical') hasCritical = true
      else if (status === 'warning') hasWarning = true

      queues[queueName] = {
        status,
        issues,
        metrics: latestMetrics,
      }
    }

    const overall = hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy'
    const activeAlerts = this.getActiveAlerts().length

    return {
      overall,
      queues,
      activeAlerts,
    }
  }

  // Private methods

  private cleanupOldMetrics(queueName: string): void {
    const cutoffTime = Date.now() - this.retentionHours * 60 * 60 * 1000
    const queueMetrics = this.metrics.get(queueName) || []

    const filteredMetrics = queueMetrics.filter(m => m.timestamp >= cutoffTime)
    this.metrics.set(queueName, filteredMetrics)
  }

  private async persistMetrics(queueName: string, metrics: QueueMonitoringMetrics): Promise<void> {
    try {
      const key = `queue_metrics:${queueName}:${metrics.timestamp}`
      await this.env.MONITORING_KV.put(key, JSON.stringify(metrics), {
        expirationTtl: this.retentionHours * 3600, // Convert to seconds
      })
    } catch (error) {
      console.error('Failed to persist metrics:', error)
    }
  }

  private async persistAlert(alert: QueueAlert): Promise<void> {
    try {
      const key = `queue_alert:${alert.id}`
      await this.env.MONITORING_KV.put(key, JSON.stringify(alert), {
        expirationTtl: 7 * 24 * 3600, // 7 days
      })
    } catch (error) {
      console.error('Failed to persist alert:', error)
    }
  }

  private async checkAlerts(queueName: string, metrics: QueueMonitoringMetrics): Promise<void> {
    const alerts: QueueAlert[] = []

    // Queue depth alert
    if (metrics.queueDepth > this.config.queueDepthThreshold) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'queue_depth',
        queueName,
        severity: metrics.queueDepth > this.config.queueDepthThreshold * 2 ? 'critical' : 'warning',
        message: `Queue depth exceeded threshold: ${metrics.queueDepth} > ${this.config.queueDepthThreshold}`,
        value: metrics.queueDepth,
        threshold: this.config.queueDepthThreshold,
        timestamp: Date.now(),
      })
    }

    // Error rate alert
    if (metrics.errorRate > this.config.errorRateThreshold) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'error_rate',
        queueName,
        severity: metrics.errorRate > this.config.errorRateThreshold * 2 ? 'critical' : 'warning',
        message: `Error rate exceeded threshold: ${metrics.errorRate}% > ${this.config.errorRateThreshold}%`,
        value: metrics.errorRate,
        threshold: this.config.errorRateThreshold,
        timestamp: Date.now(),
      })
    }

    // Processing time alert
    if (metrics.avgProcessingTimeMs > this.config.processingTimeThreshold) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'processing_time',
        queueName,
        severity:
          metrics.avgProcessingTimeMs > this.config.processingTimeThreshold * 2
            ? 'critical'
            : 'warning',
        message: `Processing time exceeded threshold: ${metrics.avgProcessingTimeMs}ms > ${this.config.processingTimeThreshold}ms`,
        value: metrics.avgProcessingTimeMs,
        threshold: this.config.processingTimeThreshold,
        timestamp: Date.now(),
      })
    }

    // Dead letter queue alert
    if (metrics.deadLetterJobs > this.config.deadLetterThreshold) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'dead_letter',
        queueName,
        severity:
          metrics.deadLetterJobs > this.config.deadLetterThreshold * 2 ? 'critical' : 'warning',
        message: `Dead letter queue exceeded threshold: ${metrics.deadLetterJobs} > ${this.config.deadLetterThreshold}`,
        value: metrics.deadLetterJobs,
        threshold: this.config.deadLetterThreshold,
        timestamp: Date.now(),
      })
    }

    // No processing alert (check if last processed was too long ago)
    const lastProcessed = await this.getLastProcessedTime(queueName)
    if (lastProcessed && Date.now() - lastProcessed > this.config.noProcessingAlertThreshold) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'no_processing',
        queueName,
        severity: 'warning',
        message: `No jobs processed recently: last processed ${new Date(lastProcessed).toISOString()}`,
        value: Date.now() - lastProcessed,
        threshold: this.config.noProcessingAlertThreshold,
        timestamp: Date.now(),
      })
    }

    // Process new alerts
    for (const alert of alerts) {
      const existingAlert = Array.from(this.alerts.values()).find(
        a => a.type === alert.type && a.queueName === queueName && !a.resolved
      )

      if (!existingAlert) {
        this.alerts.set(alert.id, alert)
        await this.persistAlert(alert)
        await this.sendAlert(alert)
      }
    }
  }

  private async getLastProcessedTime(queueName: string): Promise<number | null> {
    const metrics = this.getMetrics(queueName, 1)
    return metrics.length > 0 ? metrics[0].timestamp : null
  }

  private async sendAlert(alert: QueueAlert): Promise<void> {
    try {
      // Send webhook notification if configured
      if (this.config.webhookUrl) {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            alert,
            timestamp: Date.now(),
            service: 'queue-monitoring',
          }),
        })
      }

      // Log alert
      console.log(`Queue Alert [${alert.severity.toUpperCase()}]: ${alert.message}`)
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  private calculateTrend(
    firstHalf: number[],
    secondHalf: number[],
    direction: 'higher' | 'lower' = 'higher'
  ): 'improving' | 'degrading' | 'stable' {
    if (firstHalf.length === 0 || secondHalf.length === 0) {
      return 'stable'
    }

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const threshold = 0.05 // 5% change threshold
    const change = (secondAvg - firstAvg) / firstAvg

    if (Math.abs(change) < threshold) {
      return 'stable'
    }

    if (direction === 'higher') {
      return change > 0 ? 'improving' : 'degrading'
    } else {
      return change < 0 ? 'improving' : 'degrading'
    }
  }
}
