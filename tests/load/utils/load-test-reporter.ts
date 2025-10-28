/**
 * Load Testing Report Generator
 * Generates comprehensive reports from load test results
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LoadTestReport, SystemResourceMetrics } from '../config/load-test-config'

export class LoadTestReporter {
  private outputDirectory: string

  constructor(outputDirectory: string = './tests/load/reports') {
    this.outputDirectory = outputDirectory
    this.ensureOutputDirectory()
  }

  /**
   * Generate a comprehensive load test report
   */
  async generateReport(data: LoadTestReport): Promise<LoadTestReport> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportName = `load-test-${data.scenario}-${timestamp}`

    // Save JSON report
    await this.saveJsonReport(data, reportName)

    // Save HTML report
    await this.saveHtmlReport(data, reportName)

    // Save CSV report
    await this.saveCsvReport(data, reportName)

    // Save summary report
    await this.saveSummaryReport(data, reportName)

    console.log(`📊 Load test report generated: ${reportName}`)
    console.log(`   Location: ${this.outputDirectory}`)

    return data
  }

  /**
   * Generate consolidated report from multiple test runs
   */
  async generateConsolidatedReport(reports: LoadTestReport[], testName: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportName = `consolidated-${testName}-${timestamp}`

    const consolidatedReport = this.consolidateReports(reports)

    // Save consolidated reports
    await this.saveJsonReport(consolidatedReport, reportName)
    await this.saveHtmlReport(consolidatedReport, reportName)
    await this.saveSummaryReport(consolidatedReport, reportName)

    console.log(`📊 Consolidated load test report generated: ${reportName}`)
  }

  /**
   * Get output directory
   */
  getOutputDirectory(): string {
    return this.outputDirectory
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    try {
      mkdirSync(this.outputDirectory, { recursive: true })
    } catch (error) {
      console.error(`Failed to create output directory: ${this.outputDirectory}`, error)
    }
  }

  /**
   * Save report as JSON
   */
  private async saveJsonReport(report: LoadTestReport, reportName: string): Promise<void> {
    const filePath = join(this.outputDirectory, `${reportName}.json`)
    const jsonData = JSON.stringify(report, null, 2)

    try {
      writeFileSync(filePath, jsonData, 'utf8')
    } catch (error) {
      console.error(`Failed to save JSON report: ${filePath}`, error)
    }
  }

  /**
   * Save report as HTML
   */
  private async saveHtmlReport(report: LoadTestReport, reportName: string): Promise<void> {
    const filePath = join(this.outputDirectory, `${reportName}.html`)
    const htmlContent = this.generateHtmlReport(report)

    try {
      writeFileSync(filePath, htmlContent, 'utf8')
    } catch (error) {
      console.error(`Failed to save HTML report: ${filePath}`, error)
    }
  }

  /**
   * Save report as CSV
   */
  private async saveCsvReport(report: LoadTestReport, reportName: string): Promise<void> {
    const filePath = join(this.outputDirectory, `${reportName}.csv`)
    const csvContent = this.generateCsvReport(report)

    try {
      writeFileSync(filePath, csvContent, 'utf8')
    } catch (error) {
      console.error(`Failed to save CSV report: ${filePath}`, error)
    }
  }

  /**
   * Save summary report as Markdown
   */
  private async saveSummaryReport(report: LoadTestReport, reportName: string): Promise<void> {
    const filePath = join(this.outputDirectory, `${reportName}.md`)
    const markdownContent = this.generateMarkdownReport(report)

    try {
      writeFileSync(filePath, markdownContent, 'utf8')
    } catch (error) {
      console.error(`Failed to save summary report: ${filePath}`, error)
    }
  }

  /**
   * Generate HTML report content
   */
  private generateHtmlReport(report: LoadTestReport): string {
    const grade = this.calculatePerformanceGrade(report)
    const bottlenecksHtml = this.generateBottlenecksHtml(report.bottlenecks)
    const recommendationsHtml = this.generateRecommendationsHtml(report.recommendations)
    const endpointsHtml = this.generateEndpointsHtml(report.endpoints)
    const behaviorHtml = this.generateBehaviorHtml(report.userBehavior)
    const resourcesHtml = this.generateResourcesHtml(report.resources)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Report - ${report.scenario}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .grade {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 15px;
            font-size: 1.2em;
        }
        .grade.excellent { background: #28a745; }
        .grade.good { background: #17a2b8; }
        .grade.fair { background: #ffc107; color: #333; }
        .grade.poor { background: #dc3545; }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .bottlenecks {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
        }
        .bottleneck {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
        .severity {
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.8em;
            margin-right: 10px;
            min-width: 60px;
            text-align: center;
        }
        .severity.critical { background: #dc3545; }
        .severity.high { background: #fd7e14; }
        .severity.medium { background: #ffc107; color: #333; }
        .severity.low { background: #28a745; }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .recommendations {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
        }
        .recommendation {
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
        .chart {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Load Test Report</h1>
            <p>${report.scenario} - ${new Date(report.timestamp).toLocaleString()}</p>
            <div class="grade ${grade.class}">Performance Grade: ${grade.letter}</div>
        </div>

        <div class="content">
            <div class="section">
                <h2>Test Summary</h2>
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">${report.users}</div>
                        <div class="metric-label">Concurrent Users</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.totalRequests.toLocaleString()}</div>
                        <div class="metric-label">Total Requests</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${(report.summary.successRate * 100).toFixed(1)}%</div>
                        <div class="metric-label">Success Rate</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.p95ResponseTime.toFixed(0)}ms</div>
                        <div class="metric-label">P95 Response Time</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${report.summary.throughput.toFixed(0)}</div>
                        <div class="metric-label">Requests/Second</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${(report.duration / 1000).toFixed(1)}s</div>
                        <div class="metric-label">Test Duration</div>
                    </div>
                </div>
            </div>

            ${bottlenecksHtml}

            <div class="section">
                <h2>Endpoint Performance</h2>
                ${endpointsHtml}
            </div>

            <div class="section">
                <h2>User Behavior Analysis</h2>
                ${behaviorHtml}
            </div>

            <div class="section">
                <h2>Resource Utilization</h2>
                ${resourcesHtml}
            </div>

            ${recommendationsHtml}
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate CSV report content
   */
  private generateCsvReport(report: LoadTestReport): string {
    const headers = [
      'Scenario',
      'Timestamp',
      'Users',
      'Duration',
      'Total Requests',
      'Successful Requests',
      'Failed Requests',
      'Success Rate',
      'Average Response Time',
      'P50 Response Time',
      'P90 Response Time',
      'P95 Response Time',
      'P99 Response Time',
      'Throughput',
      'Error Rate',
    ]

    const row = [
      report.scenario,
      report.timestamp,
      report.users,
      report.duration,
      report.summary.totalRequests,
      report.summary.successfulRequests,
      report.summary.failedRequests,
      report.summary.successRate,
      report.summary.averageResponseTime,
      report.summary.p50ResponseTime || '',
      report.summary.p90ResponseTime || '',
      report.summary.p95ResponseTime,
      report.summary.p99ResponseTime,
      report.summary.throughput,
      report.summary.errorRate,
    ]

    return [headers.join(','), row.join(',')].join('\n')
  }

  /**
   * Generate Markdown report content
   */
  private generateMarkdownReport(report: LoadTestReport): string {
    const grade = this.calculatePerformanceGrade(report)
    const bottlenecksMd = this.generateBottlenecksMarkdown(report.bottlenecks)
    const recommendationsMd = this.generateRecommendationsMarkdown(report.recommendations)

    return `
# Load Test Report: ${report.scenario}

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Duration:** ${(report.duration / 1000).toFixed(1)} seconds
**Concurrent Users:** ${report.users}

## Performance Grade: ${grade.letter} ${grade.emoji}

## Test Summary

| Metric | Value |
|--------|-------|
| Total Requests | ${report.summary.totalRequests.toLocaleString()} |
| Successful Requests | ${report.summary.successfulRequests.toLocaleString()} |
| Failed Requests | ${report.summary.failedRequests.toLocaleString()} |
| Success Rate | ${(report.summary.successRate * 100).toFixed(1)}% |
| Average Response Time | ${report.summary.averageResponseTime.toFixed(2)}ms |
| P95 Response Time | ${report.summary.p95ResponseTime.toFixed(2)}ms |
| P99 Response Time | ${report.summary.p99ResponseTime.toFixed(2)}ms |
| Throughput | ${report.summary.throughput.toFixed(2)} req/s |
| Error Rate | ${(report.summary.errorRate * 100).toFixed(1)}% |

## Endpoint Performance

${Object.entries(report.endpoints)
  .map(
    ([endpoint, stats]) => `
### ${endpoint}
- **Requests:** ${stats.requests}
- **Success Rate:** ${(stats.successRate * 100).toFixed(1)}%
- **Average Response Time:** ${stats.averageResponseTime.toFixed(2)}ms
- **P95 Response Time:** ${stats.p95ResponseTime.toFixed(2)}ms
- **Errors:** ${stats.errors.length} types
${
  stats.errors.length > 0
    ? `
**Errors:**
${stats.errors.map(error => `- ${error.type}: ${error.count} occurrences`).join('\n')}
`
    : ''
}
`
  )
  .join('\n')}

## User Behavior Analysis

${Object.entries(report.userBehavior)
  .map(
    ([action, stats]) => `
### ${action}
- **Frequency:** ${(stats.frequency * 100).toFixed(1)}%
- **Average Response Time:** ${stats.averageResponseTime.toFixed(2)}ms
- **Success Rate:** ${(stats.successRate * 100).toFixed(1)}%
`
  )
  .join('\n')}

## Resource Utilization

${this.generateResourcesMarkdown(report.resources)}

${bottlenecksMd}

${recommendationsMd}

## Recommendations

${report.recommendations.length > 0 ? report.recommendations.map(rec => `- ${rec}`).join('\n') : 'No specific recommendations at this time.'}

---

*Report generated by Load Testing Framework*
    `.trim()
  }

  /**
   * Calculate performance grade
   */
  private calculatePerformanceGrade(report: LoadTestReport): {
    letter: string
    class: string
    emoji: string
  } {
    const successRate = report.summary.successRate
    const p95ResponseTime = report.summary.p95ResponseTime
    const errorRate = report.summary.errorRate

    let score = 0

    // Success rate scoring (40 points)
    if (successRate >= 0.99) score += 40
    else if (successRate >= 0.95) score += 30
    else if (successRate >= 0.9) score += 20
    else if (successRate >= 0.8) score += 10

    // Response time scoring (35 points)
    if (p95ResponseTime <= 100) score += 35
    else if (p95ResponseTime <= 200) score += 30
    else if (p95ResponseTime <= 500) score += 20
    else if (p95ResponseTime <= 1000) score += 10

    // Error rate scoring (25 points)
    if (errorRate <= 0.01) score += 25
    else if (errorRate <= 0.05) score += 20
    else if (errorRate <= 0.1) score += 15
    else if (errorRate <= 0.2) score += 10

    if (score >= 90) return { letter: 'A', class: 'excellent', emoji: '🟢' }
    if (score >= 80) return { letter: 'B', class: 'good', emoji: '🔵' }
    if (score >= 70) return { letter: 'C', class: 'fair', emoji: '🟡' }
    if (score >= 60) return { letter: 'D', class: 'poor', emoji: '🟠' }
    return { letter: 'F', class: 'poor', emoji: '🔴' }
  }

  /**
   * Generate bottlenecks HTML
   */
  private generateBottlenecksHtml(bottlenecks: any[]): string {
    if (bottlenecks.length === 0) {
      return `
      <div class="section">
        <h2>Performance Bottlenecks</h2>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
          <p style="margin: 0; color: #155724;">✅ No performance bottlenecks detected!</p>
        </div>
      </div>
      `
    }

    return `
    <div class="section">
      <h2>Performance Bottlenecks</h2>
      <div class="bottlenecks">
        <h3>⚠️ ${bottlenecks.length} Bottleneck(s) Identified</h3>
        ${bottlenecks
          .map(
            bottleneck => `
          <div class="bottleneck">
            <div class="severity ${bottleneck.severity}">${bottleneck.severity.toUpperCase()}</div>
            <div>
              <strong>${bottleneck.target} - ${bottleneck.metric}</strong><br>
              Value: ${bottleneck.value} (Threshold: ${bottleneck.threshold})<br>
              <small>${bottleneck.recommendation}</small>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
  }

  /**
   * Generate recommendations HTML
   */
  private generateRecommendationsHtml(recommendations: string[]): string {
    if (recommendations.length === 0) return ''

    return `
    <div class="section">
      <h2>Recommendations</h2>
      <div class="recommendations">
        <h3>💡 Performance Improvement Suggestions</h3>
        ${recommendations
          .map(
            rec => `
          <div class="recommendation">
            • ${rec}
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
  }

  /**
   * Generate endpoints HTML
   */
  private generateEndpointsHtml(endpoints: any): string {
    return `
    <table class="table">
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Requests</th>
          <th>Success Rate</th>
          <th>Avg Response Time</th>
          <th>P95 Response Time</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(endpoints)
          .map(
            ([endpoint, stats]: [string, any]) => `
          <tr>
            <td><code>${endpoint}</code></td>
            <td>${stats.requests.toLocaleString()}</td>
            <td>${(stats.successRate * 100).toFixed(1)}%</td>
            <td>${stats.averageResponseTime.toFixed(2)}ms</td>
            <td>${stats.p95ResponseTime.toFixed(2)}ms</td>
            <td>${stats.errors.length}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    `
  }

  /**
   * Generate behavior HTML
   */
  private generateBehaviorHtml(behavior: any): string {
    if (Object.keys(behavior).length === 0) {
      return '<p>No user behavior data available for this test.</p>'
    }

    return `
    <table class="table">
      <thead>
        <tr>
          <th>Action</th>
          <th>Frequency</th>
          <th>Avg Response Time</th>
          <th>Success Rate</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(behavior)
          .map(
            ([action, stats]: [string, any]) => `
          <tr>
            <td>${action}</td>
            <td>${(stats.frequency * 100).toFixed(1)}%</td>
            <td>${stats.averageResponseTime.toFixed(2)}ms</td>
            <td>${(stats.successRate * 100).toFixed(1)}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    `
  }

  /**
   * Generate resources HTML
   */
  private generateResourcesHtml(resources: SystemResourceMetrics[]): string {
    if (resources.length === 0) {
      return '<p>No resource monitoring data available for this test.</p>'
    }

    const latest = resources[resources.length - 1]

    return `
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${latest.cpu.usage.toFixed(1)}%</div>
        <div class="metric-label">CPU Usage</div>
      </div>
      <div class="metric">
        <div class="metric-value">${latest.memory.percentage.toFixed(1)}%</div>
        <div class="metric-label">Memory Usage</div>
      </div>
      <div class="metric">
        <div class="metric-value">${latest.database.connections}</div>
        <div class="metric-label">DB Connections</div>
      </div>
      <div class="metric">
        <div class="metric-value">${latest.database.queryTime.toFixed(2)}ms</div>
        <div class="metric-label">Avg Query Time</div>
      </div>
    </div>
    <p><em>Showing latest resource metrics. Detailed resource data available in JSON report.</em></p>
    `
  }

  /**
   * Generate bottlenecks Markdown
   */
  private generateBottlenecksMarkdown(bottlenecks: any[]): string {
    if (bottlenecks.length === 0) {
      return '## Performance Bottlenecks\n\n✅ No performance bottlenecks detected!\n'
    }

    return `
## Performance Bottlenecks

⚠️ ${bottlenecks.length} Bottleneck(s) Identified

${bottlenecks
  .map(
    bottleneck => `
### ${bottleneck.severity.toUpperCase()}: ${bottleneck.target}
- **Metric:** ${bottleneck.metric}
- **Value:** ${bottleneck.value}
- **Threshold:** ${bottleneck.threshold}
- **Recommendation:** ${bottleneck.recommendation}
`
  )
  .join('\n')}
    `
  }

  /**
   * Generate recommendations Markdown
   */
  private generateRecommendationsMarkdown(recommendations: string[]): string {
    if (recommendations.length === 0) return ''

    return `
## Performance Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}
    `
  }

  /**
   * Generate resources Markdown
   */
  private generateResourcesMarkdown(resources: SystemResourceMetrics[]): string {
    if (resources.length === 0) {
      return 'No resource monitoring data available for this test.\n'
    }

    const latest = resources[resources.length - 1]

    return `
| Resource | Current Value |
|----------|---------------|
| CPU Usage | ${latest.cpu.usage.toFixed(1)}% |
| Memory Usage | ${latest.memory.percentage.toFixed(1)}% |
| Database Connections | ${latest.database.connections} |
| Average Query Time | ${latest.database.queryTime.toFixed(2)}ms |
| Network Connections | ${latest.network.connections} |

*Showing latest resource metrics. Detailed resource data available in JSON report.*
    `
  }

  /**
   * Consolidate multiple reports into one
   */
  private consolidateReports(reports: LoadTestReport[]): LoadTestReport {
    if (reports.length === 0) {
      throw new Error('No reports to consolidate')
    }

    const firstReport = reports[0]

    // Calculate aggregate metrics
    const totalRequests = reports.reduce((sum, r) => sum + r.summary.totalRequests, 0)
    const totalSuccessful = reports.reduce((sum, r) => sum + r.summary.successfulRequests, 0)
    const totalFailed = reports.reduce((sum, r) => sum + r.summary.failedRequests, 0)

    const avgResponseTime =
      reports.reduce((sum, r) => sum + r.summary.averageResponseTime, 0) / reports.length
    const avgP95 = reports.reduce((sum, r) => sum + r.summary.p95ResponseTime, 0) / reports.length
    const avgThroughput = reports.reduce((sum, r) => sum + r.summary.throughput, 0) / reports.length

    // Aggregate endpoints
    const aggregatedEndpoints: any = {}
    reports.forEach(report => {
      Object.entries(report.endpoints).forEach(([endpoint, stats]) => {
        if (!aggregatedEndpoints[endpoint]) {
          aggregatedEndpoints[endpoint] = {
            requests: 0,
            responseTimes: [],
            successes: 0,
            errors: [],
          }
        }

        const agg = aggregatedEndpoints[endpoint]
        agg.requests += stats.requests
        agg.responseTimes.push(stats.averageResponseTime)
        agg.successes += Math.floor(stats.requests * stats.successRate)
        agg.errors.push(...stats.errors)
      })
    })

    // Calculate final endpoint stats
    Object.keys(aggregatedEndpoints).forEach(endpoint => {
      const agg = aggregatedEndpoints[endpoint]
      agg.averageResponseTime =
        agg.responseTimes.reduce((sum: number, time: number) => sum + time, 0) /
        agg.responseTimes.length
      agg.successRate = agg.successes / agg.requests
      agg.p95ResponseTime = Math.max(...agg.responseTimes) // Simplified
    })

    // Aggregate bottlenecks (most frequent)
    const bottleneckCounts = new Map<string, number>()
    reports.forEach(report => {
      report.bottlenecks.forEach(bottleneck => {
        const key = `${bottleneck.type}-${bottleneck.target}-${bottleneck.metric}`
        bottleneckCounts.set(key, (bottleneckCounts.get(key) || 0) + 1)
      })
    })

    const topBottlenecks = Array.from(bottleneckCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => {
        const [type, target, metric] = key.split('-')
        return {
          type,
          target,
          metric,
          severity: 'high',
          value: 0,
          threshold: 0,
          recommendation: 'Frequent bottleneck',
        }
      })

    return {
      scenario: `consolidated-${firstReport.scenario}`,
      timestamp: new Date().toISOString(),
      duration: Math.max(...reports.map(r => r.duration)),
      users: Math.max(...reports.map(r => r.users)),
      summary: {
        totalRequests,
        successfulRequests: totalSuccessful,
        failedRequests: totalFailed,
        averageResponseTime: avgResponseTime,
        p95ResponseTime: avgP95,
        p99ResponseTime: avgP95 * 1.2, // Approximation
        throughput: avgThroughput,
        errorRate: totalFailed / totalRequests,
      },
      endpoints: aggregatedEndpoints,
      userBehavior: {}, // Would need more complex aggregation
      resources: [], // Would need more complex aggregation
      bottlenecks: topBottlenecks,
      recommendations: [
        'Review consolidated report for patterns across multiple test runs',
        'Focus optimization efforts on frequently identified bottlenecks',
        'Monitor resource usage trends over time',
      ],
    }
  }
}
