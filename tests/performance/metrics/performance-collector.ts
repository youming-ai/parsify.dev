/**
 * Performance metrics collection and reporting utilities
 */

export interface PerformanceMetricsCollector {
  collect(testName: string, results: any): void
  generateReport(): Promise<string>
  exportData(format: 'json' | 'csv' | 'html'): Promise<string>
  getTrends(testName: string, timeRange: TimeRange): Promise<TrendData[]>
  getSummary(): Promise<PerformanceSummary>
}

export interface TimeRange {
  start: Date
  end: Date
}

export interface TrendData {
  timestamp: Date
  metric: string
  value: number
  testName: string
  endpoint?: string
}

export interface PerformanceSummary {
  totalTests: number
  totalRequests: number
  averageSuccessRate: number
  averageP95ResponseTime: number
  slowestEndpoint: string
  fastestEndpoint: string
  testRunDuration: number
  lastUpdated: Date
}

export interface PerformanceAlert {
  level: 'warning' | 'error' | 'critical'
  message: string
  metric: string
  threshold: number
  actualValue: number
  testName: string
  timestamp: Date
}

export class InMemoryMetricsCollector implements PerformanceMetricsCollector {
  private metrics: Map<string, any[]> = new Map()
  private alerts: PerformanceAlert[] = []

  collect(testName: string, results: any): void {
    if (!this.metrics.has(testName)) {
      this.metrics.set(testName, [])
    }

    const timestamp = new Date()
    const enrichedResults = {
      ...results,
      timestamp,
      testName,
    }

    this.metrics.get(testName)?.push(enrichedResults)

    // Check for performance alerts
    this.checkAlerts(testName, enrichedResults)
  }

  private checkAlerts(testName: string, results: any): void {
    const alerts = this.generateAlerts(testName, results)
    this.alerts.push(...alerts)
  }

  private generateAlerts(testName: string, results: any): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = []
    const timestamp = new Date()

    // Check P95 response time
    if (results.p95 > 500) {
      alerts.push({
        level: results.p95 > 1000 ? 'critical' : results.p95 > 750 ? 'error' : 'warning',
        message: `P95 response time is ${results.p95.toFixed(2)}ms`,
        metric: 'p95_response_time',
        threshold: 500,
        actualValue: results.p95,
        testName,
        timestamp,
      })
    }

    // Check success rate
    const successRate = results.successfulRequests / results.totalRequests
    if (successRate < 0.95) {
      alerts.push({
        level: successRate < 0.9 ? 'critical' : successRate < 0.93 ? 'error' : 'warning',
        message: `Success rate is ${(successRate * 100).toFixed(1)}%`,
        metric: 'success_rate',
        threshold: 0.95,
        actualValue: successRate,
        testName,
        timestamp,
      })
    }

    // Check throughput
    if (results.requestsPerSecond < 10) {
      alerts.push({
        level: results.requestsPerSecond < 5 ? 'error' : 'warning',
        message: `Throughput is only ${results.requestsPerSecond.toFixed(2)} req/s`,
        metric: 'throughput',
        threshold: 10,
        actualValue: results.requestsPerSecond,
        testName,
        timestamp,
      })
    }

    return alerts
  }

  async generateReport(): Promise<string> {
    const summary = await this.getSummary()
    const recentAlerts = this.alerts.slice(-10)

    let report = `
# Performance Test Report
Generated: ${new Date().toISOString()}

## Executive Summary
- Total Tests Run: ${summary.totalTests}
- Total Requests: ${summary.totalRequests.toLocaleString()}
- Average Success Rate: ${(summary.averageSuccessRate * 100).toFixed(1)}%
- Average P95 Response Time: ${summary.averageP95ResponseTime.toFixed(2)}ms
- Test Duration: ${(summary.testRunDuration / 1000).toFixed(1)}s

## Performance Highlights
- Fastest Endpoint: ${summary.fastestEndpoint}
- Slowest Endpoint: ${summary.slowestEndpoint}

`

    if (recentAlerts.length > 0) {
      report += `
## Recent Alerts
${recentAlerts
  .map(
    alert => `
- **${alert.level.toUpperCase()}**: ${alert.message}
  - Test: ${alert.testName}
  - Metric: ${alert.metric}
  - Threshold: ${alert.threshold}
  - Actual: ${alert.actualValue}
  - Time: ${alert.timestamp.toISOString()}
`
  )
  .join('')}
`
    }

    // Add test-by-test breakdown
    for (const [testName, testResults] of this.metrics.entries()) {
      if (testResults.length === 0) continue

      const latestResult = testResults[testResults.length - 1]
      report += `
## ${testName}
- Latest P95: ${latestResult.p95?.toFixed(2) || 'N/A'}ms
- Latest Success Rate: ${
        latestResult.successfulRequests && latestResult.totalRequests
          ? `${((latestResult.successfulRequests / latestResult.totalRequests) * 100).toFixed(1)}%`
          : 'N/A'
      }
- Latest Throughput: ${latestResult.requestsPerSecond?.toFixed(2) || 'N/A'} req/s
- Test Runs: ${testResults.length}
`
    }

    return report.trim()
  }

  async exportData(format: 'json' | 'csv' | 'html'): Promise<string> {
    switch (format) {
      case 'json':
        return this.exportJSON()
      case 'csv':
        return this.exportCSV()
      case 'html':
        return this.exportHTML()
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private exportJSON(): string {
    const data = {
      timestamp: new Date().toISOString(),
      summary: Object.fromEntries(this.metrics.entries()),
      alerts: this.alerts,
    }
    return JSON.stringify(data, null, 2)
  }

  private exportCSV(): string {
    let csv =
      'Test Name,Timestamp,P95 Response Time,Success Rate,Throughput,Total Requests,Successful Requests\n'

    for (const [testName, testResults] of this.metrics.entries()) {
      for (const result of testResults) {
        const successRate =
          result.successfulRequests && result.totalRequests
            ? ((result.successfulRequests / result.totalRequests) * 100).toFixed(2)
            : 'N/A'

        csv += `"${testName}","${result.timestamp}",${result.p95 || 'N/A'},${successRate},${result.requestsPerSecond || 'N/A'},${result.totalRequests || 'N/A'},${result.successfulRequests || 'N/A'}\n`
      }
    }

    return csv
  }

  private exportHTML(): string {
    const summary = Object.fromEntries(this.metrics.entries())

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 3px; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 3px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; }
        .critical { background: #f8d7da; border: 2px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <h3>Total Tests</h3>
            <p>${Object.keys(summary).length}</p>
        </div>
        <div class="metric">
            <h3>Total Requests</h3>
            <p>${Object.values(summary)
              .reduce(
                (sum: number, results: any) =>
                  sum + results.reduce((s: number, r: any) => s + (r.totalRequests || 0), 0),
                0
              )
              .toLocaleString()}</p>
        </div>
    </div>

    ${
      this.alerts.length > 0
        ? `
    <h2>Recent Alerts</h2>
    ${this.alerts
      .slice(-10)
      .map(
        alert => `
        <div class="alert ${alert.level}">
            <strong>${alert.level.toUpperCase()}</strong>: ${alert.message}
            <br><small>Test: ${alert.testName} | ${alert.timestamp.toISOString()}</small>
        </div>
    `
      )
      .join('')}
    `
        : ''
    }

    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Name</th>
            <th>Latest P95 (ms)</th>
            <th>Success Rate</th>
            <th>Throughput (req/s)</th>
            <th>Runs</th>
        </tr>
        ${Object.entries(summary)
          .map(([testName, results]: [string, any]) => {
            const latest = results[results.length - 1]
            const successRate =
              latest.successfulRequests && latest.totalRequests
                ? `${((latest.successfulRequests / latest.totalRequests) * 100).toFixed(1)}%`
                : 'N/A'

            return `
            <tr>
                <td>${testName}</td>
                <td>${latest.p95?.toFixed(2) || 'N/A'}</td>
                <td>${successRate}</td>
                <td>${latest.requestsPerSecond?.toFixed(2) || 'N/A'}</td>
                <td>${results.length}</td>
            </tr>
          `
          })
          .join('')}
    </table>
</body>
</html>
    `
  }

  async getTrends(testName: string, timeRange: TimeRange): Promise<TrendData[]> {
    const results = this.metrics.get(testName) || []
    const filteredResults = results.filter(
      r => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
    )

    return filteredResults.flatMap(result => [
      {
        timestamp: result.timestamp,
        metric: 'p95_response_time',
        value: result.p95 || 0,
        testName,
      },
      {
        timestamp: result.timestamp,
        metric: 'success_rate',
        value:
          result.successfulRequests && result.totalRequests
            ? (result.successfulRequests / result.totalRequests) * 100
            : 0,
        testName,
      },
      {
        timestamp: result.timestamp,
        metric: 'throughput',
        value: result.requestsPerSecond || 0,
        testName,
      },
    ])
  }

  async getSummary(): Promise<PerformanceSummary> {
    const allResults = Array.from(this.metrics.values()).flat()

    if (allResults.length === 0) {
      return {
        totalTests: 0,
        totalRequests: 0,
        averageSuccessRate: 0,
        averageP95ResponseTime: 0,
        slowestEndpoint: 'N/A',
        fastestEndpoint: 'N/A',
        testRunDuration: 0,
        lastUpdated: new Date(),
      }
    }

    const totalRequests = allResults.reduce((sum, r) => sum + (r.totalRequests || 0), 0)
    const successfulRequests = allResults.reduce((sum, r) => sum + (r.successfulRequests || 0), 0)
    const averageSuccessRate = successfulRequests / totalRequests

    const p95Values = allResults.filter(r => r.p95).map(r => r.p95)
    const averageP95ResponseTime =
      p95Values.length > 0 ? p95Values.reduce((sum, p95) => sum + p95, 0) / p95Values.length : 0

    // Find endpoints
    const endpointPerformance = new Map<string, { avgP95: number; count: number }>()

    allResults.forEach(result => {
      const endpoint = result.endpoint || result.url || 'unknown'
      if (!endpointPerformance.has(endpoint)) {
        endpointPerformance.set(endpoint, { avgP95: 0, count: 0 })
      }
      const perf = endpointPerformance.get(endpoint)!
      if (result.p95) {
        perf.avgP95 = (perf.avgP95 * perf.count + result.p95) / (perf.count + 1)
        perf.count++
      }
    })

    const sortedEndpoints = Array.from(endpointPerformance.entries()).sort(
      ([, a], [, b]) => a.avgP95 - b.avgP95
    )

    const fastestEndpoint = sortedEndpoints[0]?.[0] || 'N/A'
    const slowestEndpoint = sortedEndpoints[sortedEndpoints.length - 1]?.[0] || 'N/A'

    const timestamps = allResults.map(r => new Date(r.timestamp).getTime())
    const testRunDuration =
      timestamps.length > 0 ? Math.max(...timestamps) - Math.min(...timestamps) : 0

    return {
      totalTests: this.metrics.size,
      totalRequests,
      averageSuccessRate,
      averageP95ResponseTime,
      slowestEndpoint,
      fastestEndpoint,
      testRunDuration,
      lastUpdated: new Date(),
    }
  }

  getAlerts(): PerformanceAlert[] {
    return this.alerts
  }

  clearMetrics(): void {
    this.metrics.clear()
    this.alerts = []
  }
}

/**
 * Performance monitoring and alerting system
 */
export class PerformanceMonitor {
  private collector: PerformanceMetricsCollector
  private thresholds: Map<string, number> = new Map()
  private monitoringEnabled: boolean = true

  constructor(collector: PerformanceMetricsCollector = new InMemoryMetricsCollector()) {
    this.collector = collector
    this.setupDefaultThresholds()
  }

  private setupDefaultThresholds(): void {
    this.thresholds.set('p95_response_time', 200) // 200ms
    this.thresholds.set('success_rate', 0.95) // 95%
    this.thresholds.set('throughput', 10) // 10 req/s
    this.thresholds.set('max_response_time', 1000) // 1000ms
  }

  setThreshold(metric: string, value: number): void {
    this.thresholds.set(metric, value)
  }

  getThreshold(metric: string): number | undefined {
    return this.thresholds.get(metric)
  }

  enableMonitoring(): void {
    this.monitoringEnabled = true
  }

  disableMonitoring(): void {
    this.monitoringEnabled = false
  }

  async recordPerformance(testName: string, results: any): Promise<void> {
    if (!this.monitoringEnabled) return

    this.collector.collect(testName, results)

    // Check if we need to trigger any alerts
    const alerts =
      this.collector instanceof InMemoryMetricsCollector ? this.collector.getAlerts() : []

    const recentAlerts = alerts.filter(
      alert => Date.now() - alert.timestamp.getTime() < 60000 // Last minute
    )

    if (recentAlerts.length > 0) {
      console.warn(`🚨 Performance alerts detected for ${testName}:`)
      recentAlerts.forEach(alert => {
        console.warn(`  ${alert.level.toUpperCase()}: ${alert.message}`)
      })
    }
  }

  async generateReport(): Promise<string> {
    return this.collector.generateReport()
  }

  async exportMetrics(format: 'json' | 'csv' | 'html' = 'json'): Promise<string> {
    return this.collector.exportData(format)
  }

  async getPerformanceSummary(): Promise<PerformanceSummary> {
    return this.collector.getSummary()
  }

  async getPerformanceTrends(testName: string, days: number = 7): Promise<TrendData[]> {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    return this.collector.getTrends(testName, { start, end })
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Utility functions for performance analysis
 */
export class PerformanceAnalyzer {
  static analyzeTrends(trendData: TrendData[]): {
    metric: string
    trend: 'improving' | 'degrading' | 'stable'
    changePercent: number
    confidence: number
  }[] {
    const metrics = [...new Set(trendData.map(d => d.metric))]
    const analysis = []

    for (const metric of metrics) {
      const metricData = trendData
        .filter(d => d.metric === metric)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      if (metricData.length < 2) continue

      const values = metricData.map(d => d.value)
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))

      const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

      const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100
      const trend = changePercent > 5 ? 'improving' : changePercent < -5 ? 'degrading' : 'stable'

      // Simple confidence calculation based on consistency
      const variance = PerformanceAnalyzer.calculateVariance(values)
      const confidence = Math.max(0, 1 - variance / (firstAvg * firstAvg))

      analysis.push({
        metric,
        trend,
        changePercent,
        confidence,
      })
    }

    return analysis
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    return variance
  }

  static detectAnomalies(results: any[]): {
    timestamp: Date
    metric: string
    value: number
    expectedValue: number
    deviationPercent: number
  }[] {
    const anomalies = []

    // Group by test name and metric
    const grouped = new Map<string, any[]>()

    results.forEach(result => {
      const key = `${result.testName}_${result.url || result.endpoint}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)?.push(result)
    })

    for (const [_key, keyResults] of grouped.entries()) {
      if (keyResults.length < 3) continue // Need at least 3 data points

      const p95Values = keyResults.map(r => r.p95).filter(v => v != null)
      const mean = p95Values.reduce((sum, v) => sum + v, 0) / p95Values.length
      const stdDev = Math.sqrt(
        p95Values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / p95Values.length
      )

      // Look for values that deviate significantly from the mean
      keyResults.forEach(result => {
        if (result.p95 == null) return

        const deviation = Math.abs(result.p95 - mean)
        const deviationPercent = (deviation / mean) * 100

        // Flag values that are more than 2 standard deviations away
        if (deviation > 2 * stdDev) {
          anomalies.push({
            timestamp: new Date(result.timestamp),
            metric: 'p95_response_time',
            value: result.p95,
            expectedValue: mean,
            deviationPercent,
          })
        }
      })
    }

    return anomalies
  }

  static comparePerformance(
    baseline: any[],
    current: any[]
  ): {
    metric: string
    baselineValue: number
    currentValue: number
    changePercent: number
    improvement: boolean
  }[] {
    const comparison = []

    // Calculate baseline averages
    const baselineAvg = PerformanceAnalyzer.calculateAverages(baseline)
    const currentAvg = PerformanceAnalyzer.calculateAverages(current)

    const allMetrics = new Set([...Object.keys(baselineAvg), ...Object.keys(currentAvg)])

    for (const metric of allMetrics) {
      const baselineValue = baselineAvg[metric] || 0
      const currentValue = currentAvg[metric] || 0

      if (baselineValue === 0) continue

      const changePercent = ((currentValue - baselineValue) / baselineValue) * 100

      // For response times, lower is better (improvement)
      // For success rates and throughput, higher is better (improvement)
      const isResponseTime = metric.includes('time') || metric.includes('latency')
      const improvement = isResponseTime ? changePercent < 0 : changePercent > 0

      comparison.push({
        metric,
        baselineValue,
        currentValue,
        changePercent,
        improvement,
      })
    }

    return comparison
  }

  private static calculateAverages(results: any[]): Record<string, number> {
    const totals: Record<string, number> = {}
    const counts: Record<string, number> = {}

    results.forEach(result => {
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'number') {
          if (!totals[key]) totals[key] = 0
          if (!counts[key]) counts[key] = 0
          totals[key] += result[key]
          counts[key]++
        }
      })
    })

    const averages: Record<string, number> = {}
    Object.keys(totals).forEach(key => {
      averages[key] = totals[key] / counts[key]
    })

    return averages
  }
}
