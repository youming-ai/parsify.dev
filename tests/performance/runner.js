#!/usr/bin/env node

/**
 * Performance Test Runner (JavaScript version)
 *
 * Simple command-line interface for running performance tests
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { program } from 'commander'

// Simple performance test implementation for the runner
async function runSimpleLoadTest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    concurrentRequests = 10,
    totalRequests = 50,
    timeout = 30000,
  } = options

  const metrics = []
  const _startTime = Date.now()

  console.log(`  Running ${totalRequests} requests with ${concurrentRequests} concurrency...`)

  for (let i = 0; i < totalRequests; i += concurrentRequests) {
    const batch = Math.min(concurrentRequests, totalRequests - i)
    const promises = []

    for (let j = 0; j < batch; j++) {
      promises.push(measureRequest(url, { method, headers, body, timeout }))
    }

    const batchResults = await Promise.all(promises)
    metrics.push(...batchResults)

    if (i + batch < totalRequests) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  return calculateMetrics(metrics)
}

async function measureRequest(url, options = {}) {
  const startTime = performance.now()
  const timestamp = Date.now()

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      signal: AbortSignal.timeout(options.timeout || 30000),
    })

    const endTime = performance.now()
    const responseTime = endTime - startTime

    return {
      url,
      method: options.method || 'GET',
      responseTime,
      statusCode: response.status,
      success: response.status >= 200 && response.status < 400,
      timestamp,
    }
  } catch (error) {
    const endTime = performance.now()
    const responseTime = endTime - startTime

    return {
      url,
      method: options.method || 'GET',
      responseTime,
      statusCode: 0,
      success: false,
      timestamp,
      error: error.message,
    }
  }
}

function calculateMetrics(metrics) {
  const successful = metrics.filter(m => m.success)
  const failed = metrics.filter(m => !m.success)

  const responseTimes = successful.map(m => m.responseTime).sort((a, b) => a - b)

  const totalTestTime =
    Math.max(...metrics.map(m => m.timestamp)) - Math.min(...metrics.map(m => m.timestamp)) || 1

  return {
    url: metrics[0]?.url || 'unknown',
    method: metrics[0]?.method || 'GET',
    totalRequests: metrics.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    averageResponseTime:
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0,
    minResponseTime: responseTimes.length > 0 ? responseTimes[0] : 0,
    maxResponseTime: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
    p50: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
    p90: responseTimes[Math.floor(responseTimes.length * 0.9)] || 0,
    p95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
    p99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
    requestsPerSecond: metrics.length / (totalTestTime / 1000),
    metrics,
  }
}

class PerformanceTestRunner {
  constructor(config) {
    this.config = config
    this.results = []
    this.startTime = Date.now()
  }

  async run() {
    console.log(`🚀 Starting Performance Test Runner`)
    console.log(`📍 Base URL: ${this.config.baseUrl}`)
    console.log(`📁 Output Directory: ${this.config.outputDir}`)

    try {
      await fs.mkdir(this.config.outputDir, { recursive: true })
      await this.checkServerHealth()
      await this.runBasicTests()
      await this.generateReports()

      const duration = Date.now() - this.startTime
      console.log(`✅ Performance tests completed in ${(duration / 1000).toFixed(1)}s`)
    } catch (error) {
      console.error(`❌ Performance test run failed:`, error)
      process.exit(1)
    }
  }

  async checkServerHealth() {
    console.log(`\n🏥 Checking API server health...`)

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        timeout: 5000,
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

  async runBasicTests() {
    console.log(`\n🧪 Running basic performance tests...`)

    const endpoints = [
      { path: '/health', method: 'GET', description: 'Health Check' },
      { path: '/tools', method: 'GET', description: 'Tools List' },
      { path: '/auth/validate', method: 'GET', description: 'Auth Validation' },
      { path: '/users/profile', method: 'GET', description: 'User Profile' },
      { path: '/jobs', method: 'GET', description: 'Jobs List' },
      { path: '/upload/', method: 'GET', description: 'Upload List' },
    ]

    for (const endpoint of endpoints) {
      console.log(`   • Testing ${endpoint.description}...`)

      const result = await runSimpleLoadTest(`${this.config.baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        concurrentRequests: this.config.concurrency,
        totalRequests: this.config.requests,
        timeout: this.config.duration,
      })

      const endpointResult = {
        endpoint: endpoint.description,
        path: endpoint.path,
        method: endpoint.method,
        ...result,
      }

      this.results.push(endpointResult)

      const successRate = result.successfulRequests / result.totalRequests
      const status = successRate > 0.95 ? '✅' : successRate > 0.8 ? '⚠️' : '❌'

      console.log(
        `     ${status} P95: ${result.p95.toFixed(2)}ms, Success: ${(successRate * 100).toFixed(1)}%`
      )

      if (this.config.failOnThreshold) {
        this.checkThresholds(result, endpoint.description)
      }
    }
  }

  checkThresholds(result, endpointDescription) {
    const failures = []

    if (result.p95 > this.config.thresholds.maxP95ResponseTime) {
      failures.push(
        `P95 response time ${result.p95.toFixed(2)}ms exceeds threshold ${this.config.thresholds.maxP95ResponseTime}ms`
      )
    }

    const successRate = result.successfulRequests / result.totalRequests
    if (successRate < this.config.thresholds.minSuccessRate) {
      failures.push(
        `Success rate ${(successRate * 100).toFixed(1)}% below threshold ${(this.config.thresholds.minSuccessRate * 100).toFixed(1)}%`
      )
    }

    if (result.requestsPerSecond < this.config.thresholds.minRequestsPerSecond) {
      failures.push(
        `Throughput ${result.requestsPerSecond.toFixed(2)} req/s below threshold ${this.config.thresholds.minRequestsPerSecond} req/s`
      )
    }

    if (failures.length > 0) {
      console.error(`❌ ${endpointDescription} failed thresholds:`)
      failures.forEach(failure => console.error(`   • ${failure}`))
      throw new Error(`Performance thresholds not met for ${endpointDescription}`)
    }
  }

  async generateReports() {
    console.log(`\n📊 Generating performance reports...`)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseFilename = `performance-report-${timestamp}`

    await this.saveJSONReport(`${baseFilename}.json`)
    await this.saveSummaryReport(`${baseFilename}-summary.txt`)

    console.log(`📁 Reports saved to: ${this.config.outputDir}`)
  }

  async saveJSONReport(filename) {
    const summary = this.calculateOverallSummary()

    const reportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        config: this.config,
        baseUrl: this.config.baseUrl,
      },
      results: this.results,
      summary,
    }

    const filepath = path.join(this.config.outputDir, filename)
    await fs.writeFile(filepath, JSON.stringify(reportData, null, 2))
    console.log(`   • JSON report: ${filename}`)
  }

  async saveSummaryReport(filename) {
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

    report += `## Endpoint Results\n\n`
    for (const result of this.results) {
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)
      const status = result.successfulRequests / result.totalRequests > 0.95 ? '✅' : '❌'

      report += `- ${status} **${result.endpoint}** (${result.method})\n`
      report += `  - Requests: ${result.totalRequests}\n`
      report += `  - Success: ${successRate}%\n`
      report += `  - P95: ${result.p95.toFixed(2)}ms\n`
      report += `  - Throughput: ${result.requestsPerSecond.toFixed(2)} req/s\n\n`
    }

    const filepath = path.join(this.config.outputDir, filename)
    await fs.writeFile(filepath, report)
    console.log(`   • Summary report: ${filename}`)
  }

  calculateOverallSummary() {
    const summary = {
      totalRequests: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      averageP95: 0,
      averageSuccessRate: 0,
      totalThroughput: 0,
    }

    let totalP95 = 0

    for (const result of this.results) {
      summary.totalRequests += result.totalRequests
      summary.totalSuccessful += result.successfulRequests
      summary.totalFailed += result.failedRequests
      summary.totalThroughput += result.requestsPerSecond || 0
      totalP95 += result.p95
    }

    summary.averageSuccessRate =
      summary.totalRequests > 0 ? summary.totalSuccessful / summary.totalRequests : 0
    summary.averageP95 = this.results.length > 0 ? totalP95 / this.results.length : 0

    return summary
  }
}

// CLI setup
program
  .name('performance-runner')
  .description('Run performance tests for API endpoints')
  .version('1.0.0')

program
  .requiredOption('-u, --url <url>', 'Base URL for API testing', 'http://localhost:8787')
  .option('-o, --output <dir>', 'Output directory for reports', './performance-reports')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--fail-on-threshold', 'Fail if performance thresholds are not met', false)
  .option('--max-p95 <ms>', 'Maximum acceptable P95 response time', '200')
  .option('--min-success-rate <rate>', 'Minimum acceptable success rate (0-1)', '0.95')
  .option('--min-rps <rps>', 'Minimum acceptable requests per second', '10')
  .option('-c, --concurrency <number>', 'Concurrent requests per test', '10')
  .option('-r, --requests <number>', 'Total requests per test', '50')
  .option('-d, --duration <ms>', 'Test duration in milliseconds', '30000')
  .action(async options => {
    const config = {
      baseUrl: options.url,
      outputDir: options.output,
      verbose: options.verbose,
      failOnThreshold: options.failOnThreshold,
      thresholds: {
        maxP95ResponseTime: parseInt(options.maxP95, 10),
        minSuccessRate: parseFloat(options.minSuccessRate),
        minRequestsPerSecond: parseFloat(options.minRps),
      },
      concurrency: parseInt(options.concurrency, 10),
      requests: parseInt(options.requests, 10),
      duration: parseInt(options.duration, 10),
    }

    const runner = new PerformanceTestRunner(config)
    await runner.run()
  })

program.parse()
