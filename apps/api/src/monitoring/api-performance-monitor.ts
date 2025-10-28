/**
 * API 性能监控系统
 * 提供全面的性能指标收集、分析和报告功能
 */

import { logger } from '@shared/utils'

export interface PerformanceMetrics {
  // 请求指标
  requestCount: number
  averageResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  statusCodes: Record<number, number>

  // 系统指标
  memoryUsage: {
    current: number
    peak: number
    average: number
  }
  cpuUsage: {
    current: number
    peak: number
    average: number
  }

  // 业务指标
  activeConnections: number
  databaseConnections: number
  cacheHitRate: number
  wasmExecutionTime: number

  // 时间信息
  timestamp: number
  window: number // 时间窗口（毫秒）
}

export interface RequestTrace {
  id: string
  method: string
  path: string
  statusCode: number
  responseTime: number
  timestamp: number
  userAgent?: string
  ip?: string
  userId?: string
  error?: string
  tags: string[]
}

export interface AlertRule {
  name: string
  metric: keyof PerformanceMetrics
  threshold: number
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
  cooldown: number // 冷却时间（毫秒）
  lastTriggered?: number
}

export interface PerformanceAlert {
  id: string
  ruleName: string
  metric: string
  value: number
  threshold: number
  severity: string
  timestamp: number
  resolved: boolean
  resolvedAt?: number
}

export class APIPerformanceMonitor {
  private requestTraces: RequestTrace[] = []
  private performanceData: PerformanceMetrics[] = []
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, PerformanceAlert> = new Map()
  private metricsBuffer: Map<string, number[]> = new Map()

  // 性能计算相关
  private windowSize = 60000 // 1分钟窗口
  private maxTraces = 10000 // 最大追踪数量
  private maxMetricsHistory = 1440 // 24小时的分钟数据

  constructor() {
    this.initializeDefaultAlerts()
    // 定期清理过期数据
    setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
    // 定期计算性能指标
    setInterval(() => this.calculateMetrics(), 10000) // 每10秒计算一次
  }

  // 记录请求追踪
  recordRequest(trace: Omit<RequestTrace, 'id' | 'timestamp'>): void {
    const requestTrace: RequestTrace = {
      ...trace,
      id: this.generateTraceId(),
      timestamp: Date.now(),
      tags: trace.tags || [],
    }

    this.requestTraces.push(requestTrace)

    // 限制追踪数量
    if (this.requestTraces.length > this.maxTraces) {
      this.requestTraces = this.requestTraces.slice(-this.maxTraces)
    }

    // 实时检查性能问题
    this.checkRealTimePerformance(requestTrace)
  }

  // 记录自定义指标
  recordMetric(name: string, value: number): void {
    if (!this.metricsBuffer.has(name)) {
      this.metricsBuffer.set(name, [])
    }

    const buffer = this.metricsBuffer.get(name)!
    buffer.push(value)

    // 限制缓冲区大小
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000)
    }
  }

  // 获取当前性能指标
  getCurrentMetrics(): PerformanceMetrics {
    const now = Date.now()
    const windowStart = now - this.windowSize

    // 筛选时间窗口内的请求
    const recentTraces = this.requestTraces.filter(trace => trace.timestamp >= windowStart)

    if (recentTraces.length === 0) {
      return this.getEmptyMetrics(now)
    }

    // 计算响应时间分布
    const responseTimes = recentTraces.map(trace => trace.responseTime).sort((a, b) => a - b)
    const statusCounts = recentTraces.reduce(
      (acc, trace) => {
        acc[trace.statusCode] = (acc[trace.statusCode] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    const errorCount = recentTraces.filter(trace => trace.statusCode >= 400).length

    return {
      requestCount: recentTraces.length,
      averageResponseTime: this.average(responseTimes),
      p50ResponseTime: this.percentile(responseTimes, 0.5),
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      p99ResponseTime: this.percentile(responseTimes, 0.99),
      errorRate: errorCount / recentTraces.length,
      statusCodes: statusCounts,

      memoryUsage: this.getMemoryMetrics(),
      cpuUsage: this.getCPUMetrics(),

      activeConnections: this.getMetric('active_connections') || 0,
      databaseConnections: this.getMetric('db_connections') || 0,
      cacheHitRate: this.getMetric('cache_hit_rate') || 0,
      wasmExecutionTime: this.getMetric('wasm_execution_time') || 0,

      timestamp: now,
      window: this.windowSize,
    }
  }

  // 获取性能历史数据
  getMetricsHistory(hours = 24): PerformanceMetrics[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return this.performanceData.filter(metrics => metrics.timestamp >= cutoff)
  }

  // 获取慢请求
  getSlowRequests(limit = 50, threshold = 1000): RequestTrace[] {
    return this.requestTraces
      .filter(trace => trace.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit)
  }

  // 获取错误请求
  getErrorRequests(limit = 50): RequestTrace[] {
    return this.requestTraces
      .filter(trace => trace.statusCode >= 400)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  // 添加告警规则
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.name, rule)
    logger.info('Alert rule added', { rule: rule.name })
  }

  // 删除告警规则
  removeAlertRule(name: string): void {
    this.alertRules.delete(name)
    this.activeAlerts.delete(name)
    logger.info('Alert rule removed', { rule: name })
  }

  // 获取活跃告警
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // 解决告警
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      logger.info('Alert resolved', { alertId, ruleName: alert.ruleName })
    }
  }

  // 生成性能报告
  generateReport(timeRange = '1h'): {
    summary: PerformanceMetrics
    trends: {
      improving: string[]
      degrading: string[]
      stable: string[]
    }
    recommendations: string[]
    topSlowRequests: RequestTrace[]
    topErrors: RequestTrace[]
    alerts: PerformanceAlert[]
  } {
    const currentMetrics = this.getCurrentMetrics()
    const historicalData = this.getMetricsHistory(this.parseTimeRange(timeRange))

    // 分析趋势
    const trends = this.analyzeTrends(historicalData)

    // 生成建议
    const recommendations = this.generateRecommendations(currentMetrics, trends)

    return {
      summary: currentMetrics,
      trends,
      recommendations,
      topSlowRequests: this.getSlowRequests(10),
      topErrors: this.getErrorRequests(10),
      alerts: this.getActiveAlerts(),
    }
  }

  // 导出性能数据
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = this.getMetricsHistory(24)

    if (format === 'csv') {
      return this.convertToCSV(data)
    }

    return JSON.stringify(data, null, 2)
  }

  // 私有方法
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private checkRealTimePerformance(trace: RequestTrace): void {
    // 检查响应时间异常
    if (trace.responseTime > 5000) {
      this.triggerAlert(
        {
          name: 'slow_request',
          metric: 'averageResponseTime' as keyof PerformanceMetrics,
          threshold: 5000,
          operator: 'gt',
          severity: 'warning',
          enabled: true,
          cooldown: 300000, // 5分钟
        },
        trace.responseTime
      )
    }

    // 检查错误率异常
    if (trace.statusCode >= 500) {
      this.triggerAlert(
        {
          name: 'server_error',
          metric: 'errorRate' as keyof PerformanceMetrics,
          threshold: 0.05,
          operator: 'gt',
          severity: 'error',
          enabled: true,
          cooldown: 600000, // 10分钟
        },
        1
      )
    }
  }

  private calculateMetrics(): void {
    const metrics = this.getCurrentMetrics()
    this.performanceData.push(metrics)

    // 限制历史数据大小
    if (this.performanceData.length > this.maxMetricsHistory) {
      this.performanceData = this.performanceData.slice(-this.maxMetricsHistory)
    }

    // 检查告警规则
    this.checkAlertRules(metrics)
  }

  private checkAlertRules(metrics: PerformanceMetrics): void {
    for (const [_name, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue

      const now = Date.now()
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        continue
      }

      const value = metrics[rule.metric] as number
      let triggered = false

      switch (rule.operator) {
        case 'gt':
          triggered = value > rule.threshold
          break
        case 'gte':
          triggered = value >= rule.threshold
          break
        case 'lt':
          triggered = value < rule.threshold
          break
        case 'lte':
          triggered = value <= rule.threshold
          break
        case 'eq':
          triggered = value === rule.threshold
          break
      }

      if (triggered) {
        this.triggerAlert(rule, value)
      }
    }
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleName: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: Date.now(),
      resolved: false,
    }

    this.activeAlerts.set(alert.id, alert)
    rule.lastTriggered = Date.now()

    logger.warn('Performance alert triggered', {
      rule: rule.name,
      metric: rule.metric,
      value,
      threshold,
      severity: rule.severity,
    })
  }

  private getEmptyMetrics(timestamp: number): PerformanceMetrics {
    return {
      requestCount: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      statusCodes: {},
      memoryUsage: { current: 0, peak: 0, average: 0 },
      cpuUsage: { current: 0, peak: 0, average: 0 },
      activeConnections: 0,
      databaseConnections: 0,
      cacheHitRate: 0,
      wasmExecutionTime: 0,
      timestamp,
      window: this.windowSize,
    }
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0
  }

  private percentile(sortedNumbers: number[], p: number): number {
    if (sortedNumbers.length === 0) return 0
    const index = Math.ceil(sortedNumbers.length * p) - 1
    return sortedNumbers[Math.max(0, index)]
  }

  private getMemoryMetrics(): PerformanceMetrics['memoryUsage'] {
    // 简化版本，实际应该从系统获取真实内存数据
    return {
      current: 0,
      peak: 0,
      average: 0,
    }
  }

  private getCPUMetrics(): PerformanceMetrics['cpuUsage'] {
    // 简化版本，实际应该从系统获取真实 CPU 数据
    return {
      current: 0,
      peak: 0,
      average: 0,
    }
  }

  private getMetric(name: string): number | undefined {
    const buffer = this.metricsBuffer.get(name)
    return buffer && buffer.length > 0 ? this.average(buffer) : undefined
  }

  private cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 24小时前

    // 清理过期追踪
    this.requestTraces = this.requestTraces.filter(trace => trace.timestamp > cutoff)

    // 清理过期告警
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.activeAlerts.delete(id)
      }
    }
  }

  private initializeDefaultAlerts(): void {
    const defaultRules: AlertRule[] = [
      {
        name: 'high_response_time',
        metric: 'averageResponseTime' as keyof PerformanceMetrics,
        threshold: 2000,
        operator: 'gt',
        severity: 'warning',
        enabled: true,
        cooldown: 300000,
      },
      {
        name: 'high_error_rate',
        metric: 'errorRate' as keyof PerformanceMetrics,
        threshold: 0.05,
        operator: 'gt',
        severity: 'error',
        enabled: true,
        cooldown: 600000,
      },
      {
        name: 'low_cache_hit_rate',
        metric: 'cacheHitRate' as keyof PerformanceMetrics,
        threshold: 0.7,
        operator: 'lt',
        severity: 'warning',
        enabled: true,
        cooldown: 600000,
      },
    ]

    for (const rule of defaultRules) {
      this.alertRules.set(rule.name, rule)
    }
  }

  private analyzeTrends(data: PerformanceMetrics[]): {
    improving: string[]
    degrading: string[]
    stable: string[]
  } {
    if (data.length < 2) {
      return { improving: [], degrading: [], stable: [] }
    }

    const metrics: (keyof PerformanceMetrics)[] = [
      'averageResponseTime',
      'errorRate',
      'cacheHitRate',
    ]

    const result = {
      improving: [] as string[],
      degrading: [] as string[],
      stable: [] as string[],
    }

    for (const metric of metrics) {
      const values = data.map(d => d[metric] as number).filter(v => v !== undefined)
      if (values.length < 2) continue

      const trend = this.calculateTrend(values)
      const metricName = this.formatMetricName(metric)

      if (trend > 0.1) {
        result.improving.push(metricName)
      } else if (trend < -0.1) {
        result.degrading.push(metricName)
      } else {
        result.stable.push(metricName)
      }
    }

    return result
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope / (sumY / n) // 归一化趋势
  }

  private formatMetricName(metric: keyof PerformanceMetrics): string {
    const nameMap: Record<string, string> = {
      averageResponseTime: 'Response Time',
      errorRate: 'Error Rate',
      cacheHitRate: 'Cache Hit Rate',
    }
    return nameMap[metric] || metric
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    trends: { improving: string[]; degrading: string[]; stable: string[] }
  ): string[] {
    const recommendations: string[] = []

    if (metrics.averageResponseTime > 1000) {
      recommendations.push('Consider optimizing database queries or implementing caching')
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push('High error rate detected - review error logs and fix bugs')
    }

    if (metrics.cacheHitRate < 0.7) {
      recommendations.push('Cache hit rate is low - review caching strategy')
    }

    if (trends.degrading.includes('Response Time')) {
      recommendations.push('Response time is degrading - investigate performance bottlenecks')
    }

    if (trends.degrading.includes('Error Rate')) {
      recommendations.push('Error rate is increasing - review recent deployments')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges')
    }

    return recommendations
  }

  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/^(\d+)([hdwmy])$/)
    if (!match) return 1

    const value = parseInt(match[1], 10)
    const unit = match[2]

    const unitToHours: Record<string, number> = {
      h: 1,
      d: 24,
      w: 24 * 7,
      m: 24 * 30,
      y: 24 * 365,
    }

    return value * unitToHours[unit] || 1
  }

  private convertToCSV(data: PerformanceMetrics[]): string {
    if (data.length === 0) return ''

    const headers = [
      'timestamp',
      'requestCount',
      'averageResponseTime',
      'p95ResponseTime',
      'errorRate',
      'cacheHitRate',
    ]

    const rows = data.map(metrics => [
      new Date(metrics.timestamp).toISOString(),
      metrics.requestCount,
      metrics.averageResponseTime.toFixed(2),
      metrics.p95ResponseTime.toFixed(2),
      (metrics.errorRate * 100).toFixed(2),
      (metrics.cacheHitRate * 100).toFixed(2),
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// 工厂函数
export function createAPIPerformanceMonitor(): APIPerformanceMonitor {
  return new APIPerformanceMonitor()
}
