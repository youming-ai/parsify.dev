#!/usr/bin/env node

/**
 * Performance Test Runner
 *
 * This script provides a command-line interface for running performance tests
 * and can be integrated into CI/CD pipelines.
 */

import { program } from 'commander'
import { runLoadTest, runConcurrencyTest, generatePerformanceReport, savePerformanceResults } from './utils/performance-utils.js'
import { API_BASE_URL, PERFORMANCE_TEST_SCENARIOS, ALL_ENDPOINTS, TestDataGenerator } from './utils/endpoint-configs.js'
import { performanceMonitor, PerformanceAnalyzer } from './metrics/performance-collector.js'
import { promises as fs } from 'fs'
import path from 'path'

interface TestRunConfig {
  baseUrl: string
  outputDir: string
  format: 'json' | 'csv' | 'html' | 'all'
  verbose: boolean
  failOnThreshold: boolean
  thresholds: {
    maxP95ResponseTime: number
    minSuccessRate: number
    minRequestsPerSecond: number
  }
  concurrency: number
  requests: number
  duration?: number
  scenarios: string[]
}

class PerformanceTestRunner {
  private config: TestRunConfig
  private results: any[] = []
  private startTime: number = 0

  constructor(config: TestRunConfig) {
    this.config = config
  }

  async run(): Promise<void> {
    this.startTime = Date.now()

    console.log(`🚀 Starting Performance Test Runner`)
    console.log(`📍 Base URL: ${this.config.baseUrl}`)
    console.log(`📁 Output Directory: ${this.config.outputDir}`)
    console.log(`📊 Format: ${this.config.format}`)

    if (this.config.verbose) {
      console.log(`⚙️  Configuration:`, JSON.stringify(this.config, null, 2))
    }

    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true })

      // Check if API server is available
      await this.checkServerHealth()

      // Run tests based on scenarios
      if (this.config.scenarios.length === 0) {
        // Run all scenarios if none specified
        await this.runAllScenarios()
      } else {
        await this.runSpecificScenarios()
      }

      // Generate reports
      await this.generateReports()

      const duration = Date.now() - this.startTime
      console.log(`✅ Performance tests completed in ${(duration / 1000).toFixed(1)}s`)

    } catch (error) {
      console.error(`❌ Performance test run failed:`, error)
      process.exit(1)
    }
  }

  private async checkServerHealth(): Promise<void> {
    console.log(`\n🏥 Checking API server health...`)

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        timeout: 5000
      })

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`)
      }

      console.log(`✅ API server is healthy`)
    } catch (error) {
      console.error(`❌ API server health check failed:`, error)
      throw new Error(`API server at ${this.config.baseUrl} is not available`)
    }
  }

  private async runAllScenarios(): Promise<void> {
    console.log(`\n🎭 Running all performance test scenarios...`)

    for (const scenario of PERFORMANCE_TEST_SCENARIOS) {
      await this.runScenario(scenario)
    }
  }

  private async runSpecificScenarios(): Promise<void> {
    console.log(`\n🎯 Running specific scenarios: ${this.config.scenarios.join(', ')}`)

    for (const scenarioName of this.config.scenarios) {
      const scenario = PERFORMANCE_TEST_SCENARIOS.find(s => s.name === scenarioName)
      if (!scenario) {
        console.warn(`⚠️  Scenario '${scenarioName}' not found, skipping...`)
        continue
      }

      await this.runScenario(scenario)
    }
  }

  private async runScenario(scenario: any): Promise<void> {
    console.log(`\n📋 Running scenario: ${scenario.name}`)
    console.log(`   ${scenario.description}`)

    const scenarioResults = {
      scenario: scenario.name,
      description: scenario.description,
      timestamp: new Date().toISOString(),
      endpoints: [],
      summary: {
        totalRequests: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        averageP95: 0,
        averageSuccessRate: 0,
        totalThroughput: 0
      }
    }

    for (const endpoint of scenario.endpoints) {
      console.log(`   • Testing ${endpoint.description}...`)

      const endpointResult = await this.testEndpoint(endpoint, scenario)
      scenarioResults.endpoints.push(endpointResult)

      // Update scenario summary
      scenarioResults.summary.totalRequests += endpointResult.totalRequests
      scenarioResults.summary.totalSuccessful += endpointResult.successfulRequests
      scenarioResults.summary.totalFailed += endpointResult.failedRequests
      scenarioResults.summary.averageP95 += endpointResult.p95
      scenarioResults.summary.totalThroughput += endpointResult.requestsPerSecond

      // Record metrics for monitoring
      await performanceMonitor.recordPerformance(
        `${scenario.name}_${endpoint.description.replace(/\s+/g, '_')}`,
        endpointResult
      )

      // Check thresholds
      if (this.config.failOnThreshold) {
        this.checkThresholds(endpointResult, endpoint.description)
      }

      if (this.config.verbose) {
        console.log(`     P95: ${endpointResult.p95.toFixed(2)}ms, Success: ${((endpointResult.successfulRequests / endpointResult.totalRequests) * 100).toFixed(1)}%`)
      }
    }

    // Calculate scenario averages
    const endpointCount = scenarioResults.endpoints.length
    if (endpointCount > 0) {
      scenarioResults.summary.averageP95 /= endpointCount
      scenarioResults.summary.averageSuccessRate = scenarioResults.summary.totalSuccessful / scenarioResults.summary.totalRequests
    }

    this.results.push(scenarioResults)

    console.log(`   ✅ Scenario completed - P95 avg: ${scenarioResults.summary.averageP95.toFixed(2)}ms, Success: ${(scenarioResults.summary.averageSuccessRate * 100).toFixed(1)}%`)
  }

  private async testEndpoint(endpoint: any, scenario: any): Promise<any> {
    const config = {
      url: `${this.config.baseUrl}${endpoint.path}`,
      method: endpoint.method || 'GET',
      headers: endpoint.headers,
      body: this.generateRequestBody(endpoint),
      concurrentRequests: this.config.concurrency || scenario.concurrentRequests,
      totalRequests: this.config.requests || scenario.totalRequests,
      timeout: this.config.duration || 30000
    }

    return await runLoadTest(config)
  }

  private generateRequestBody(endpoint: any): any {
    if (!endpoint.body) return undefined

    // Generate dynamic test data based on endpoint type
    if (endpoint.path.includes('/tools/json/format')) {
      return {
        ...endpoint.body,
        json: TestDataGenerator.generateJsonData('medium')
      }
    } else if (endpoint.path.includes('/tools/code/format')) {
      return {
        ...endpoint.body,
        code: TestDataGenerator.generateCodeSamples('javascript')
      }
    } else if (endpoint.path.includes('/upload/sign')) {
      return TestDataGenerator.generateUploadData(`test-${Date.now()}.json`, 1024)
    } else if (endpoint.path.includes('/jobs')) {
      return TestDataGenerator.generateJobData('json-format', 'small')
    }

    return endpoint.body
  }

  private checkThresholds(result: any, endpointDescription: string): void {
    const { thresholds } = this.config
    const failures: string[] = []

    if (result.p95 > thresholds.maxP95ResponseTime) {
      failures.push(`P95 response time ${result.p95.toFixed(2)}ms exceeds threshold ${thresholds.maxP95ResponseTime}ms`)
    }

    const successRate = result.successfulRequests / result.totalRequests
    if (successRate < thresholds.minSuccessRate) {
      failures.push(`Success rate ${(successRate * 100).toFixed(1)}% below threshold ${(thresholds.minSuccessRate * 100).toFixed(1)}%`)
    }

    if (result.requestsPerSecond < thresholds.minRequestsPerSecond) {
      failures.push(`Throughput ${result.requestsPerSecond.toFixed(2)} req/s below threshold ${thresholds.minRequestsPerSecond} req/s`)
    }

    if (failures.length > 0) {
      console.error(`❌ ${endpointDescription} failed thresholds:`)
      failures.forEach(failure => console.error(`   • ${failure}`))

      if (this.config.failOnThreshold) {
        throw new Error(`Performance thresholds not met for ${endpointDescription}`)
      }
    }
  }

  private async generateReports(): Promise<void> {
    console.log(`\n📊 Generating performance reports...`)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseFilename = `performance-report-${timestamp}`

    // Generate different format reports
    if (this.config.format === 'json' || this.config.format === 'all') {
      await this.saveJSONReport(`${baseFilename}.json`)
    }

    if (this.config.format === 'csv' || this.config.format === 'all') {
      await this.saveCSVReport(`${baseFilename}.csv`)
    }

    if (this.config.format === 'html' || this.config.format === 'all') {
      await this.saveHTMLReport(`${baseFilename}.html`)
    }

    // Generate summary report
    await this.generateSummaryReport(`${baseFilename}-summary.txt`)

    console.log(`📁 Reports saved to: ${this.config.outputDir}`)
  }

  private async saveJSONReport(filename: string): Promise<void> {
    const reportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        config: this.config,
        baseUrl: this.config.baseUrl
      },
      results: this.results,
      summary: this.calculateOverallSummary()
    }

    const filepath = path.join(this.config.outputDir, filename)
    await fs.writeFile(filepath, JSON.stringify(reportData, null, 2))
    console.log(`   • JSON report: ${filename}`)
  }

  private async saveCSVReport(filename: string): Promise<void> {
    let csv = 'Scenario,Endpoint,Method,Total Requests,Successful Requests,Failed Requests,P95 (ms),P90 (ms),P50 (ms),Success Rate,Throughput (req/s)\n'

    for (const scenarioResult of this.results) {
      for (const endpointResult of scenarioResult.endpoints) {
        const successRate = (endpointResult.successfulRequests / endpointResult.totalRequests * 100).toFixed(2)

        csv += `"${scenarioResult.scenario}","${endpointResult.url}","${endpointResult.method}",`
        csv += `${endpointResult.totalRequests},${endpointResult.successfulRequests},${endpointResult.failedRequests},`
        csv += `${endpointResult.p95?.toFixed(2) || 'N/A'},${endpointResult.p90?.toFixed(2) || 'N/A'},${endpointResult.p50?.toFixed(2) || 'N/A'},`
        csv += `${successRate},${endpointResult.requestsPerSecond?.toFixed(2) || 'N/A'}\n`
      }
    }

    const filepath = path.join(this.config.outputDir, filename)
    await fs.writeFile(filepath, csv)
    console.log(`   • CSV report: ${filename}`)
  }

  private async saveHTMLReport(filename: string): Promise<void> {
    const summary = this.calculateOverallSummary()

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric .unit { font-size: 0.8em; color: #6c757d; }
        .scenario { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }
        .scenario-header { background: #007bff; color: white; padding: 15px 20px; font-weight: bold; }
        .scenario-content { padding: 20px; }
        .endpoint { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .endpoint-name { font-weight: bold; margin-bottom: 8px; }
        .endpoint-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .stat { text-align: center; }
        .stat .value { font-weight: bold; color: #007bff; }
        .stat .label { font-size: 0.8em; color: #6c757d; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .footer { text-align: center; margin-top: 40px; color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Performance Test Report</h1>
            <p>Generated: ${new Date().toISOString()}</p>
            <p>Base URL: ${this.config.baseUrl}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Requests</h3>
                <div class="value">${summary.totalRequests.toLocaleString()}</div>
                <div class="unit">requests</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${(summary.averageSuccessRate * 100).toFixed(1)}%</div>
                <div class="unit">average</div>
            </div>
            <div class="metric">
                <h3>P95 Response Time</h3>
                <div class="value">${summary.averageP95.toFixed(0)}</div>
                <div class="unit">milliseconds</div>
            </div>
            <div class="metric">
                <h3>Total Throughput</h3>
                <div class="value">${summary.totalThroughput.toFixed(1)}</div>
                <div class="unit">req/s</div>
            </div>
        </div>

        ${this.results.map(scenario => `
        <div class="scenario">
            <div class="scenario-header">
                📋 ${scenario.scenario}: ${scenario.description}
            </div>
            <div class="scenario-content">
                ${scenario.endpoints.map((endpoint: any) => `
                <div class="endpoint">
                    <div class="endpoint-name">${endpoint.url} (${endpoint.method})</div>
                    <div class="endpoint-stats">
                        <div class="stat">
                            <div class="value">${endpoint.totalRequests}</div>
                            <div class="label">Total</div>
                        </div>
                        <div class="stat">
                            <div class="value ${endpoint.successfulRequests / endpoint.totalRequests > 0.95 ? 'pass' : 'fail'}">
                                ${((endpoint.successfulRequests / endpoint.totalRequests) * 100).toFixed(1)}%
                            </div>
                            <div class="label">Success</div>
                        </div>
                        <div class="stat">
                            <div class="value">${endpoint.p95?.toFixed(0) || 'N/A'}</div>
                            <div class="label">P95 (ms)</div>
                        </div>
                        <div class="stat">
                            <div class="value">${endpoint.requestsPerSecond?.toFixed(1) || 'N/A'}</div>
                            <div class="label">Req/s</div>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <p>Report generated by Performance Test Runner</p>
            <p>Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s</p>
        </div>
    </div>
</body>
</html>
    `

    const filepath = path.join(this.config.outputDir, filename)
    await fs.writeFile(filepath, html)
    console.log(`   • HTML report: ${filename}`)
  }

  private async generateSummaryReport(filename: string): Promise<void> {
    const summary = this.calculateOverallSummary()

    let report = `# Performance Test Summary\n\n`
    report += `Generated: ${new Date().toISOString()}\n`
    report += `Base URL: ${this.config.baseUrl}\n`
    report += `Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s\n\n`

    report += `## Overall Summary\n\n`
    report += `- **Total Requests**: ${summary.totalRequests.toLocaleString()}\n`
    report += `- **Success Rate**: ${(summary.averageSuccessRate * 100).toFixed(1)}%\n`
    report += `- **Average P95**: ${summary.averageP95.toFixed(2)}ms\n`
    report += `- **Total Throughput**: ${summary.totalThroughput.toFixed(2)} req/s\n\n`

    report += `## Scenario Results\n\n`
    for (const scenarioResult of this.results) {
      report += `### ${scenarioResult.scenario}\n`
      report += `${scenarioResult.description}\n\n`

      for (const endpointResult of scenarioResult.endpoints) {
        const successRate = (endpointResult.successfulRequests / endpointResult.totalRequests * 100).toFixed(1)
        const status = endpointResult.successfulRequests / endpointResult.totalRequests > 0.95 ? '✅' : '❌'

        report += `- ${status} **${endpointResult.url}** (${endpointResult.method})\n`
        report += `  - Requests: ${endpointResult.totalRequests}\n`
        report += `  - Success: ${successRate}%\n`
        report += `  - P95: ${endpointResult.p95?.toFixed(2) || 'N/A'}ms\n`
        report += `  - Throughput: ${endpointResult.requestsPerSecond?.toFixed(2) || 'N/A'} req/s\n\n`
      }
    }

    const filepath = path.join(this.config.outputDir, filename)
    await fs.writeFile(filepath, report)
    console.log(`   • Summary report: ${filename}`)
  }

  private calculateOverallSummary(): any {
    const summary = {
      totalRequests: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      averageP95: 0,
      averageSuccessRate: 0,
      totalThroughput: 0
    }

    let totalEndpoints = 0
    let totalP95 = 0

    for (const scenarioResult of this.results) {
      for (const endpointResult of scenarioResult.endpoints) {
        summary.totalRequests += endpointResult.totalRequests
        summary.totalSuccessful += endpointResult.successfulRequests
        summary.totalFailed += endpointResult.failedRequests
        summary.totalThroughput += endpointResult.requestsPerSecond || 0

        if (endpointResult.p95) {
          totalP95 += endpointResult.p95
          totalEndpoints++
        }
      }
    }

    summary.averageSuccessRate = summary.totalRequests > 0 ?
      summary.totalSuccessful / summary.totalRequests : 0
    summary.averageP95 = totalEndpoints > 0 ? totalP95 / totalEndpoints : 0

    return summary
  }
}

// CLI setup
program
  .name('performance-runner')
  .description('Run performance tests for API endpoints')
  .version('1.0.0')

program
  .requiredOption('-u, --url <url>', 'Base URL for API testing', API_BASE_URL)
  .option('-o, --output <dir>', 'Output directory for reports', './performance-reports')
  .option('-f, --format <format>', 'Report format (json, csv, html, all)', 'all')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--fail-on-threshold', 'Fail if performance thresholds are not met', false)
  .option('--max-p95 <ms>', 'Maximum acceptable P95 response time', '200')
  .option('--min-success-rate <rate>', 'Minimum acceptable success rate (0-1)', '0.95')
  .option('--min-rps <rps>', 'Minimum acceptable requests per second', '10')
  .option('-c, --concurrency <number>', 'Concurrent requests per test', '10')
  .option('-r, --requests <number>', 'Total requests per test', '50')
  .option('-d, --duration <ms>', 'Test duration in milliseconds', '30000')
  .option('-s, --scenarios <scenarios>', 'Comma-separated list of scenarios to run', '')
  .action(async (options) => {
    const config: TestRunConfig = {
      baseUrl: options.url,
      outputDir: options.output,
      format: options.format,
      verbose: options.verbose,
      failOnThreshold: options.failOnThreshold,
      thresholds: {
        maxP95ResponseTime: parseInt(options.maxP95),
        minSuccessRate: parseFloat(options.minSuccessRate),
        minRequestsPerSecond: parseFloat(options.minRps)
      },
      concurrency: parseInt(options.concurrency),
      requests: parseInt(options.requests),
      duration: options.duration ? parseInt(options.duration) : undefined,
      scenarios: options.scenarios ? options.scenarios.split(',').map((s: string) => s.trim()) : []
    }

    const runner = new PerformanceTestRunner(config)
    await runner.run()
  })

// Parse command line arguments
program.parse()
