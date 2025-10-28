/**
 * Performance metrics collection and reporting utilities
 */

export interface PerformanceMetricsCollection {
  timestamp: string
  testSuite: string
  environment: string
  systemInfo: SystemInfo
  testResults: TestResultMetrics[]
  summary: PerformanceSummary
}

export interface SystemInfo {
  nodeVersion: string
  platform: string
  arch: string
  totalMemory: number
  freeMemory: number
  cpuCount: number
  loadAverage?: number[]
}

export interface TestResultMetrics {
  endpoint: string
  method: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p50: number
  p90: number
  p95: number
  p99: number
  requestsPerSecond: number
  throughputBytesPerSecond?: number
  errors: Array<{ error: string; count: number }>
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  meetsRequirements: boolean
}

export interface PerformanceSummary {
  totalEndpoints: number
  overallSuccessRate: number
  averageP95ResponseTime: number
  totalRequestsProcessed: number
  totalThroughput: number
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendations: string[]
  criticalIssues: string[]
}

export interface PerformanceThresholds {
  excellent: { p95: number; successRate: number }
  good: { p95: number; successRate: number }
  acceptable: { p95: number; successRate: number }
  poor: { p95: number; successRate: number }
}

export class PerformanceMetricsCollector {
  private collection: PerformanceMetricsCollection | null = null
  private startTime: number = 0

  // Performance thresholds for different grades
  private static readonly THRESHOLDS: PerformanceThresholds = {
    excellent: { p95: 50, successRate: 0.99 },
    good: { p95: 100, successRate: 0.95 },
    acceptable: { p95: 200, successRate: 0.9 },
    poor: { p95: 500, successRate: 0.8 },
  }

  constructor(private testSuite: string) {
    this.startTime = Date.now()
  }

  /**
   * Start collecting metrics for a test run
   */
  startCollection(): void {
    this.collection = {
      timestamp: new Date().toISOString(),
      testSuite: this.testSuite,
      environment: process.env.NODE_ENV || 'test',
      systemInfo: this.getSystemInfo(),
      testResults: [],
      summary: {
        totalEndpoints: 0,
        overallSuccessRate: 0,
        averageP95ResponseTime: 0,
        totalRequestsProcessed: 0,
        totalThroughput: 0,
        performanceGrade: 'A',
        recommendations: [],
        criticalIssues: [],
      },
    }
  }

  /**
   * Add test result metrics to the collection
   */
  addTestResult(result: any, endpoint: string, method: string): void {
    if (!this.collection) {
      throw new Error('Collection not started. Call startCollection() first.')
    }

    const metrics: TestResultMetrics = {
      endpoint,
      method,
      totalRequests: result.totalRequests,
      successfulRequests: result.successfulRequests,
      failedRequests: result.failedRequests,
      averageResponseTime: result.averageResponseTime,
      p50: result.p50,
      p90: result.p90,
      p95: result.p95,
      p99: result.p99,
      requestsPerSecond: result.requestsPerSecond,
      throughputBytesPerSecond: result.throughputBytesPerSecond,
      errors: result.errors || [],
      performanceGrade: this.calculateGrade(
        result.p95,
        result.successfulRequests / result.totalRequests
      ),
      meetsRequirements:
        result.p95 < 200 && result.successfulRequests / result.totalRequests > 0.95,
    }

    this.collection.testResults.push(metrics)
    this.updateSummary()
  }

  /**
   * Get current metrics collection
   */
  getCollection(): PerformanceMetricsCollection | null {
    return this.collection
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): string {
    if (!this.collection) {
      return 'No performance data available. Run tests first.'
    }

    const { collection } = this
    const duration = Date.now() - this.startTime

    let report = `
╔══════════════════════════════════════════════════════════════╗
║                    PERFORMANCE TEST REPORT                   ║
╚══════════════════════════════════════════════════════════════╝

Test Suite: ${collection.testSuite}
Timestamp: ${collection.timestamp}
Environment: ${collection.environment}
Duration: ${(duration / 1000).toFixed(2)}s

System Information:
- Platform: ${collection.systemInfo.platform} (${collection.systemInfo.arch})
- Node.js: ${collection.systemInfo.nodeVersion}
- CPU Cores: ${collection.systemInfo.cpuCount}
- Memory: ${(collection.systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB total, ${(collection.systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB free
${collection.systemInfo.loadAverage ? `- Load Average: ${collection.systemInfo.loadAverage.map(l => l.toFixed(2)).join(', ')}` : ''}

Executive Summary:
- Overall Performance Grade: ${collection.summary.performanceGrade}
- Total Endpoints Tested: ${collection.summary.totalEndpoints}
- Overall Success Rate: ${(collection.summary.overallSuccessRate * 100).toFixed(1)}%
- Average P95 Response Time: ${collection.summary.averageP95ResponseTime.toFixed(2)}ms
- Total Requests Processed: ${collection.summary.totalRequestsProcessed}
- Total Throughput: ${(collection.summary.totalThroughput / 1024).toFixed(2)} KB/s

`

    // Add detailed endpoint results
    report += `📊 DETAILED ENDPOINT RESULTS
${'─'.repeat(65)}

`

    const sortedResults = [...collection.testResults].sort((a, b) => b.p95 - a.p95)

    sortedResults.forEach((result, index) => {
      const status = result.meetsRequirements ? '✅' : '❌'
      const grade = result.performanceGrade
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)

      report += `${index + 1}. ${result.method} ${result.endpoint} ${status} [Grade: ${grade}]
   P95: ${result.p95.toFixed(2)}ms | Success Rate: ${successRate}% | RPS: ${result.requestsPerSecond.toFixed(1)}
   Range: ${result.p50.toFixed(2)}ms (P50) → ${result.p99.toFixed(2)}ms (P99)
   Requests: ${result.successfulRequests}/${result.totalRequests}
   ${result.throughputBytesPerSecond ? `Throughput: ${(result.throughputBytesPerSecond / 1024).toFixed(2)} KB/s` : ''}
   ${result.errors.length > 0 ? `Errors: ${result.errors.map(e => `${e.error} (${e.count})`).join(', ')}` : ''}

`
    })

    // Add performance analysis
    report += `🎯 PERFORMANCE ANALYSIS
${'─'.repeat(65)}

`

    const gradeDistribution = this.getGradeDistribution(collection.testResults)
    report += `Grade Distribution:
- A (Excellent): ${gradeDistribution.A} endpoints
- B (Good): ${gradeDistribution.B} endpoints
- C (Acceptable): ${gradeDistribution.C} endpoints
- D (Poor): ${gradeDistribution.D} endpoints
- F (Failing): ${gradeDistribution.F} endpoints

`

    // Add recommendations
    if (collection.summary.recommendations.length > 0) {
      report += `💡 RECOMMENDATIONS
${'─'.repeat(65)}

`
      collection.summary.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`
      })
      report += '\n'
    }

    // Add critical issues
    if (collection.summary.criticalIssues.length > 0) {
      report += `🚨 CRITICAL ISSUES
${'─'.repeat(65)}

`
      collection.summary.criticalIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue}\n`
      })
      report += '\n'
    }

    // Add performance benchmarks
    report += `📈 PERFORMANCE BENCHMARKS
${'─'.repeat(65)}

`

    const slowestEndpoints = sortedResults.slice(0, 3)
    const fastestEndpoints = sortedResults.slice(-3).reverse()

    report += `Slowest Endpoints (by P95):
`
    slowestEndpoints.forEach((result, index) => {
      report += `${index + 1}. ${result.endpoint}: ${result.p95.toFixed(2)}ms\n`
    })

    report += `
Fastest Endpoints (by P95):
`
    fastestEndpoints.forEach((result, index) => {
      report += `${index + 1}. ${result.endpoint}: ${result.p95.toFixed(2)}ms\n`
    })

    report += `
Highest Throughput:
`
    const topThroughput = [...collection.testResults]
      .filter(r => r.throughputBytesPerSecond)
      .sort((a, b) => (b.throughputBytesPerSecond || 0) - (a.throughputBytesPerSecond || 0))
      .slice(0, 3)

    topThroughput.forEach((result, index) => {
      const throughput = (result.throughputBytesPerSecond || 0) / 1024
      report += `${index + 1}. ${result.endpoint}: ${throughput.toFixed(2)} KB/s\n`
    })

    report += `
╔══════════════════════════════════════════════════════════════╗
║                      END OF REPORT                           ║
╚══════════════════════════════════════════════════════════════╝
`

    return report.trim()
  }

  /**
   * Export metrics to JSON format
   */
  exportToJson(): string {
    if (!this.collection) {
      return JSON.stringify({ error: 'No performance data available' }, null, 2)
    }

    return JSON.stringify(this.collection, null, 2)
  }

  /**
   * Export metrics to CSV format
   */
  exportToCsv(): string {
    if (!this.collection || this.collection.testResults.length === 0) {
      return 'No performance data available'
    }

    const headers = [
      'Endpoint',
      'Method',
      'Total Requests',
      'Successful',
      'Failed',
      'Avg Response Time',
      'P50',
      'P90',
      'P95',
      'P99',
      'Requests/sec',
      'Throughput (KB/s)',
      'Grade',
      'Meets Requirements',
    ]

    const rows = this.collection.testResults.map(result => [
      result.endpoint,
      result.method,
      result.totalRequests,
      result.successfulRequests,
      result.failedRequests,
      result.averageResponseTime.toFixed(2),
      result.p50.toFixed(2),
      result.p90.toFixed(2),
      result.p95.toFixed(2),
      result.p99.toFixed(2),
      result.requestsPerSecond.toFixed(2),
      ((result.throughputBytesPerSecond || 0) / 1024).toFixed(2),
      result.performanceGrade,
      result.meetsRequirements ? 'Yes' : 'No',
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  /**
   * Get system information
   */
  private getSystemInfo(): SystemInfo {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      totalMemory: 0, // Would need system-specific implementation
      freeMemory: 0, // Would need system-specific implementation
      cpuCount: 1, // Would need system-specific implementation
      loadAverage: undefined, // Would need system-specific implementation
    }
  }

  /**
   * Calculate performance grade based on metrics
   */
  private calculateGrade(p95: number, successRate: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    const thresholds = PerformanceMetricsCollector.THRESHOLDS

    if (p95 <= thresholds.excellent.p95 && successRate >= thresholds.excellent.successRate) {
      return 'A'
    } else if (p95 <= thresholds.good.p95 && successRate >= thresholds.good.successRate) {
      return 'B'
    } else if (
      p95 <= thresholds.acceptable.p95 &&
      successRate >= thresholds.acceptable.successRate
    ) {
      return 'C'
    } else if (p95 <= thresholds.poor.p95 && successRate >= thresholds.poor.successRate) {
      return 'D'
    } else {
      return 'F'
    }
  }

  /**
   * Get grade distribution across all test results
   */
  private getGradeDistribution(results: TestResultMetrics[]): Record<string, number> {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }

    results.forEach(result => {
      distribution[result.performanceGrade]++
    })

    return distribution
  }

  /**
   * Update summary statistics
   */
  private updateSummary(): void {
    if (!this.collection || this.collection.testResults.length === 0) return

    const results = this.collection.testResults
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0)
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0)
    const avgP95 = results.reduce((sum, r) => sum + r.p95, 0) / results.length
    const totalThroughput = results.reduce((sum, r) => sum + (r.throughputBytesPerSecond || 0), 0)

    // Calculate overall grade
    const gradeCounts = this.getGradeDistribution(results)
    let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A'

    if (gradeCounts.F > 0) {
      overallGrade = 'F'
    } else if (gradeCounts.D > 0) {
      overallGrade = 'D'
    } else if (gradeCounts.C > 0) {
      overallGrade = 'C'
    } else if (gradeCounts.B > 0) {
      overallGrade = 'B'
    }

    // Generate recommendations and critical issues
    const { recommendations, criticalIssues } = this.generateInsights(results)

    this.collection.summary = {
      totalEndpoints: results.length,
      overallSuccessRate: totalSuccessful / totalRequests,
      averageP95ResponseTime: avgP95,
      totalRequestsProcessed: totalRequests,
      totalThroughput,
      performanceGrade: overallGrade,
      recommendations,
      criticalIssues,
    }
  }

  /**
   * Generate insights and recommendations based on test results
   */
  private generateInsights(results: TestResultMetrics[]): {
    recommendations: string[]
    criticalIssues: string[]
  } {
    const recommendations: string[] = []
    const criticalIssues: string[] = []

    const slowEndpoints = results.filter(r => r.p95 > 200)
    const unreliableEndpoints = results.filter(r => r.successfulRequests / r.totalRequests < 0.95)
    const failingEndpoints = results.filter(r => r.performanceGrade === 'F')

    // Critical issues
    if (failingEndpoints.length > 0) {
      criticalIssues.push(`${failingEndpoints.length} endpoints are failing performance tests`)
      failingEndpoints.forEach(endpoint => {
        criticalIssues.push(
          `${endpoint.method} ${endpoint.endpoint}: P95=${endpoint.p95.toFixed(2)}ms, Success Rate=${((endpoint.successfulRequests / endpoint.totalRequests) * 100).toFixed(1)}%`
        )
      })
    }

    if (unreliableEndpoints.length > 2) {
      criticalIssues.push(
        'Multiple endpoints have low success rates - investigate stability issues'
      )
    }

    // Recommendations
    if (slowEndpoints.length > 0) {
      recommendations.push(`Optimize ${slowEndpoints.length} slow endpoints (P95 > 200ms)`)
      slowEndpoints.forEach(endpoint => {
        recommendations.push(
          `Consider caching or optimization for ${endpoint.method} ${endpoint.endpoint}`
        )
      })
    }

    const avgP95 = results.reduce((sum, r) => sum + r.p95, 0) / results.length
    if (avgP95 > 150) {
      recommendations.push(
        'Overall response times could be improved - consider performance optimization'
      )
    }

    const errorEndpoints = results.filter(r => r.errors.length > 0)
    if (errorEndpoints.length > 0) {
      recommendations.push('Investigate and fix recurring errors in API endpoints')
    }

    const lowThroughputEndpoints = results.filter(
      r => r.throughputBytesPerSecond && r.throughputBytesPerSecond < 1024 // Less than 1KB/s
    )
    if (lowThroughputEndpoints.length > 0) {
      recommendations.push(
        'Consider response compression or payload optimization for low-throughput endpoints'
      )
    }

    if (recommendations.length === 0 && criticalIssues.length === 0) {
      recommendations.push(
        'Performance is excellent! Consider setting up continuous monitoring to maintain standards.'
      )
    }

    return { recommendations, criticalIssues }
  }
}

/**
 * Performance monitoring utilities for ongoing monitoring
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 1000 values to prevent memory leaks
    if (values.length > 1000) {
      values.shift()
    }
  }

  getMetricStats(name: string): { min: number; max: number; avg: number; count: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    return { min, max, avg, count: values.length }
  }

  getAllMetrics(): Record<string, { min: number; max: number; avg: number; count: number }> {
    const result: Record<string, { min: number; max: number; avg: number; count: number }> = {}

    for (const [name] of this.metrics.entries()) {
      const stats = this.getMetricStats(name)
      if (stats) {
        result[name] = stats
      }
    }

    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}
