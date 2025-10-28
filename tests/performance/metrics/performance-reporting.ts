/**
 * Performance metrics collection and reporting utilities
 */

export interface PerformanceMetrics {
  timestamp: number
  testType: string
  endpoint?: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p50: number
  p90: number
  p95: number
  p99: number
  maxResponseTime: number
  minResponseTime: number
  requestsPerSecond: number
  errors: Array<{ error: string; count: number }>
  cpuUsage?: number
  memoryUsage?: number
}

export interface BenchmarkResult {
  testSuite: string
  timestamp: string
  environment: {
    nodeVersion: string
    platform: string
    arch: string
    cpuCores: number
    totalMemory: number
  }
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    overallSuccessRate: number
    averageP95: number
    totalRequests: number
    totalDuration: number
  }
  results: PerformanceMetrics[]
  benchmarks: {
    [testName: string]: {
      baseline?: PerformanceMetrics
      current: PerformanceMetrics
      regression?: {
        p95Increase: number
        successRateDecrease: number
        significance: 'minor' | 'moderate' | 'major'
      }
    }
  }
}

export class MetricsCollector {
  private metrics: PerformanceMetrics[] = []
  private startTime: number = 0

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * Add performance metrics to the collection
   */
  addMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now(),
    })
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get metrics filtered by test type
   */
  getMetricsByType(testType: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.testType === testType)
  }

  /**
   * Get metrics filtered by endpoint
   */
  getMetricsByEndpoint(endpoint: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.endpoint === endpoint)
  }

  /**
   * Calculate overall statistics
   */
  getOverallStats(): {
    totalRequests: number
    totalSuccessful: number
    totalFailed: number
    averageP95: number
    averageRPS: number
    totalDuration: number
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        averageP95: 0,
        averageRPS: 0,
        totalDuration: 0,
      }
    }

    const totalRequests = this.metrics.reduce((sum, m) => sum + m.totalRequests, 0)
    const totalSuccessful = this.metrics.reduce((sum, m) => sum + m.successfulRequests, 0)
    const totalFailed = this.metrics.reduce((sum, m) => sum + m.failedRequests, 0)
    const averageP95 = this.metrics.reduce((sum, m) => sum + m.p95, 0) / this.metrics.length
    const averageRPS =
      this.metrics.reduce((sum, m) => sum + m.requestsPerSecond, 0) / this.metrics.length
    const totalDuration = Date.now() - this.startTime

    return {
      totalRequests,
      totalSuccessful,
      totalFailed,
      averageP95,
      averageRPS,
      totalDuration,
    }
  }

  /**
   * Identify performance regressions compared to baseline
   */
  detectRegressions(baseline: PerformanceMetrics[]): Array<{
    testName: string
    current: PerformanceMetrics
    baseline: PerformanceMetrics
    regression: {
      p95Increase: number
      successRateDecrease: number
      significance: 'minor' | 'moderate' | 'major'
    }
  }> {
    const regressions = []

    for (const current of this.metrics) {
      const baselineMetric = baseline.find(
        b => b.testType === current.testType && b.endpoint === current.endpoint
      )

      if (baselineMetric) {
        const p95Increase = ((current.p95 - baselineMetric.p95) / baselineMetric.p95) * 100
        const currentSuccessRate = current.successfulRequests / current.totalRequests
        const baselineSuccessRate = baselineMetric.successfulRequests / baselineMetric.totalRequests
        const successRateDecrease =
          ((baselineSuccessRate - currentSuccessRate) / baselineSuccessRate) * 100

        let significance: 'minor' | 'moderate' | 'major' = 'minor'

        if (p95Increase > 50 || successRateDecrease > 10) {
          significance = 'major'
        } else if (p95Increase > 25 || successRateDecrease > 5) {
          significance = 'moderate'
        }

        if (p95Increase > 10 || successRateDecrease > 2) {
          regressions.push({
            testName: `${current.testType}${current.endpoint ? ` - ${current.endpoint}` : ''}`,
            current,
            baseline: baselineMetric,
            regression: {
              p95Increase,
              successRateDecrease,
              significance,
            },
          })
        }
      }
    }

    return regressions
  }

  /**
   * Clear all collected metrics
   */
  clear(): void {
    this.metrics = []
    this.startTime = Date.now()
  }
}

/**
 * Generate HTML performance report
 */
export function generateHTMLReport(benchmarkResult: BenchmarkResult): string {
  const { testSuite, timestamp, environment, summary, results, benchmarks } = benchmarkResult

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - ${testSuite}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .header .timestamp {
            color: #7f8c8d;
            font-size: 14px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 5px 0;
            color: #7f8c8d;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .value {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
        }
        .summary-card.success .value {
            color: #27ae60;
        }
        .summary-card.warning .value {
            color: #f39c12;
        }
        .summary-card.error .value {
            color: #e74c3c;
        }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header {
            background: #34495e;
            color: white;
            padding: 15px 20px;
            font-weight: bold;
        }
        .section-content {
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }
        .status-success {
            color: #27ae60;
            font-weight: bold;
        }
        .status-warning {
            color: #f39c12;
            font-weight: bold;
        }
        .status-error {
            color: #e74c3c;
            font-weight: bold;
        }
        .regression-major {
            background: #ffe5e5;
            border-left: 4px solid #e74c3c;
        }
        .regression-moderate {
            background: #fff3cd;
            border-left: 4px solid #f39c12;
        }
        .regression-minor {
            background: #e8f5e8;
            border-left: 4px solid #27ae60;
        }
        .environment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .environment-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        .environment-label {
            font-weight: 600;
            color: #7f8c8d;
        }
        .progress-bar {
            background: #ecf0f1;
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
            margin-top: 5px;
        }
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        .progress-success {
            background: #27ae60;
        }
        .progress-warning {
            background: #f39c12;
        }
        .progress-error {
            background: #e74c3c;
        }
        .chart-placeholder {
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-style: italic;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <div class="timestamp">Test Suite: ${testSuite} | Generated: ${new Date(timestamp).toLocaleString()}</div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">${summary.totalTests}</div>
        </div>
        <div class="summary-card ${summary.failedTests === 0 ? 'success' : 'error'}">
            <h3>Success Rate</h3>
            <div class="value">${(summary.overallSuccessRate * 100).toFixed(1)}%</div>
        </div>
        <div class="summary-card ${summary.averageP95 < 200 ? 'success' : summary.averageP95 < 500 ? 'warning' : 'error'}">
            <h3>Average P95</h3>
            <div class="value">${summary.averageP95.toFixed(0)}ms</div>
        </div>
        <div class="summary-card">
            <h3>Total Requests</h3>
            <div class="value">${summary.totalRequests.toLocaleString()}</div>
        </div>
        <div class="summary-card">
            <h3>Duration</h3>
            <div class="value">${(summary.totalDuration / 1000).toFixed(1)}s</div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">Environment Information</div>
        <div class="section-content">
            <div class="environment-grid">
                <div class="environment-item">
                    <span class="environment-label">Node Version:</span>
                    <span>${environment.nodeVersion}</span>
                </div>
                <div class="environment-item">
                    <span class="environment-label">Platform:</span>
                    <span>${environment.platform} (${environment.arch})</span>
                </div>
                <div class="environment-item">
                    <span class="environment-label">CPU Cores:</span>
                    <span>${environment.cpuCores}</span>
                </div>
                <div class="environment-item">
                    <span class="environment-label">Total Memory:</span>
                    <span>${(environment.totalMemory / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">Test Results</div>
        <div class="section-content">
            <table>
                <thead>
                    <tr>
                        <th>Test Type</th>
                        <th>Endpoint</th>
                        <th>Requests</th>
                        <th>Success Rate</th>
                        <th>P95 Response Time</th>
                        <th>P90 Response Time</th>
                        <th>Requests/sec</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${results
                      .map(
                        result => `
                        <tr>
                            <td>${result.testType}</td>
                            <td>${result.endpoint || '-'}</td>
                            <td>${result.totalRequests}</td>
                            <td>
                                <div>${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%</div>
                                <div class="progress-bar">
                                    <div class="progress-fill ${
                                      (result.successfulRequests / result.totalRequests) >= 0.95
                                        ? 'progress-success'
                                        : result.successfulRequests / result.totalRequests >= 0.9
                                          ? 'progress-warning'
                                          : 'progress-error'
                                    }" style="width: ${(result.successfulRequests / result.totalRequests) * 100}%"></div>
                                </div>
                            </td>
                            <td>${result.p95.toFixed(0)}ms</td>
                            <td>${result.p90.toFixed(0)}ms</td>
                            <td>${result.requestsPerSecond.toFixed(1)}</td>
                            <td>
                                <span class="${
                                  result.p95 < 200 &&
                                  result.successfulRequests / result.totalRequests >= 0.95
                                    ? 'status-success'
                                    : result.p95 < 500 &&
                                        result.successfulRequests / result.totalRequests >= 0.9
                                      ? 'status-warning'
                                      : 'status-error'
                                }">
                                    ${
                                      result.p95 < 200 &&
                                      result.successfulRequests / result.totalRequests >= 0.95
                                        ? 'PASS'
                                        : result.p95 < 500 &&
                                            result.successfulRequests / result.totalRequests >= 0.9
                                          ? 'WARN'
                                          : 'FAIL'
                                    }
                                </span>
                            </td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
    </div>

    ${
      Object.keys(benchmarks).length > 0
        ? `
    <div class="section">
        <div class="section-header">Performance Benchmarks & Regressions</div>
        <div class="section-content">
            ${Object.entries(benchmarks)
              .map(
                ([testName, benchmark]) => `
                ${
                  benchmark.regression
                    ? `
                <div class="regression-${benchmark.regression.significance}">
                    <h4>${testName}</h4>
                    <p><strong>Regression Detected:</strong></p>
                    <ul>
                        <li>P95 increased by ${benchmark.regression.p95Increase.toFixed(1)}%</li>
                        <li>Success rate decreased by ${benchmark.regression.successRateDecrease.toFixed(1)}%</li>
                        <li>Significance: ${benchmark.regression.significance}</li>
                    </ul>
                    <table style="margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Baseline</th>
                                <th>Current</th>
                                <th>Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>P95 Response Time</td>
                                <td>${benchmark.baseline?.p95.toFixed(0) || 'N/A'}ms</td>
                                <td>${benchmark.current.p95.toFixed(0)}ms</td>
                                <td>${benchmark.regression.p95Increase > 0 ? '+' : ''}${benchmark.regression.p95Increase.toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td>Success Rate</td>
                                <td>${benchmark.baseline ? ((benchmark.baseline.successfulRequests / benchmark.baseline.totalRequests) * 100).toFixed(1) : 'N/A'}%</td>
                                <td>${((benchmark.current.successfulRequests / benchmark.current.totalRequests) * 100).toFixed(1)}%</td>
                                <td>${benchmark.regression.successRateDecrease > 0 ? '-' : '+'}${Math.abs(benchmark.regression.successRateDecrease).toFixed(1)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                `
                    : ''
                }
            `
              )
              .join('')}
        </div>
    </div>
    `
        : ''
    }

    <div class="section">
        <div class="section-header">Performance Charts</div>
        <div class="section-content">
            <div class="chart-placeholder">
                Response time distribution chart would be rendered here
            </div>
            <div class="chart-placeholder">
                Success rate by endpoint chart would be rendered here
            </div>
            <div class="chart-placeholder">
            </div>
        </div>
    </div>

    <script>
        // Add interactive features
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Performance report loaded');
        });
    </script>
</body>
</html>
  `.trim()
}

/**
 * Generate JSON performance report for CI/CD integration
 */
export function generateJSONReport(benchmarkResult: BenchmarkResult): string {
  return JSON.stringify(benchmarkResult, null, 2)
}

/**
 * Generate JUnit XML report for CI integration
 */
export function generateJUnitXML(benchmarkResult: BenchmarkResult): string {
  const { testSuite, timestamp, summary, results } = benchmarkResult

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Performance Tests" tests="${summary.totalTests}" failures="${summary.failedTests}" time="${(summary.totalDuration / 1000).toFixed(3)}">
  <testsuite name="${testSuite}" tests="${summary.totalTests}" failures="${summary.failedTests}" time="${(summary.totalDuration / 1000).toFixed(3)}" timestamp="${new Date(timestamp).toISOString()}">
`

  results.forEach((result, _index) => {
    const testName = `${result.testType}${result.endpoint ? `_${result.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}` : ''}`
    const passed = result.p95 < 200 && result.successfulRequests / result.totalRequests >= 0.95
    const time = result.totalRequests / result.requestsPerSecond

    if (passed) {
      xml += `    <testcase name="${testName}" classname="performance" time="${time.toFixed(3)}" />
`
    } else {
      const failures = []
      if (result.p95 >= 200) {
        failures.push(`P95 response time ${result.p95.toFixed(0)}ms exceeds 200ms threshold`)
      }
      if (result.successfulRequests / result.totalRequests < 0.95) {
        failures.push(
          `Success rate ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}% below 95% threshold`
        )
      }

      xml += `    <testcase name="${testName}" classname="performance" time="${time.toFixed(3)}">
      <failure message="Performance requirements not met">
        ${failures.join('; ')}
      </failure>
    </testcase>
`
    }
  })

  xml += `  </testsuite>
</testsuites>`

  return xml
}

/**
 * Save performance report to file (mock implementation)
 */
export async function savePerformanceReport(
  benchmarkResult: BenchmarkResult,
  format: 'html' | 'json' | 'junit' = 'html',
  filename?: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const defaultFilename = `performance-report-${benchmarkResult.testSuite}-${timestamp}`
  const finalFilename = filename || `${defaultFilename}.${format}`

  let content: string
  switch (format) {
    case 'html':
      content = generateHTMLReport(benchmarkResult)
      break
    case 'json':
      content = generateJSONReport(benchmarkResult)
      break
    case 'junit':
      content = generateJUnitXML(benchmarkResult)
      break
    default:
      throw new Error(`Unsupported format: ${format}`)
  }

  // In a real implementation, this would save to the file system
  console.log(`📄 Performance report saved to: ${finalFilename}`)
  console.log(`📊 Report size: ${(content.length / 1024).toFixed(1)} KB`)

  return finalFilename
}

/**
 * Generate performance summary for console output
 */
export function generateConsoleSummary(benchmarkResult: BenchmarkResult): string {
  const { testSuite, summary, results } = benchmarkResult

  let summaryText = `
╔══════════════════════════════════════════════════════════════╗
║                    PERFORMANCE TEST SUMMARY                  ║
╚══════════════════════════════════════════════════════════════╝

Test Suite: ${testSuite}
Timestamp: ${new Date(benchmarkResult.timestamp).toLocaleString()}

Overall Results:
  Total Tests: ${summary.totalTests}
  Passed: ${summary.passedTests}
  Failed: ${summary.failedTests}
  Success Rate: ${(summary.overallSuccessRate * 100).toFixed(1)}%
  Average P95: ${summary.averageP95.toFixed(0)}ms
  Total Requests: ${summary.totalRequests.toLocaleString()}
  Duration: ${(summary.totalDuration / 1000).toFixed(1)}s

Test Details:
`

  results.forEach((result, index) => {
    const status =
      result.p95 < 200 && result.successfulRequests / result.totalRequests >= 0.95
        ? '✅ PASS'
        : result.p95 < 500 && result.successfulRequests / result.totalRequests >= 0.9
          ? '⚠️  WARN'
          : '❌ FAIL'

    summaryText += `  ${index + 1}. ${result.testType}${result.endpoint ? ` - ${result.endpoint}` : ''}
       ${status} | P95: ${result.p95.toFixed(0)}ms | Success: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}% | RPS: ${result.requestsPerSecond.toFixed(1)}
`
  })

  summaryText += `
Performance Targets:
  ✅ P95 < 200ms: ${results.filter(r => r.p95 < 200).length}/${results.length} tests
  ✅ Success Rate ≥ 95%: ${results.filter(r => r.successfulRequests / r.totalRequests >= 0.95).length}/${results.length} tests
`

  return summaryText
}
