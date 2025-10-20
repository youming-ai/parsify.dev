/**
 * Simultaneous Tool Execution Load Testing
 * Tests system behavior under concurrent tool usage scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLoadTest } from '../../performance/utils/performance-utils'
import { TestDataGenerator } from '../../performance/utils/endpoint-configs'
import { CONCURRENT_USER_SCENARIOS } from '../config/load-test-config'
import { SystemResourceMonitor } from '../utils/resource-monitor'
import { LoadTestReporter } from '../utils/load-test-reporter'
import { LoadTestReport } from '../config/load-test-config'

describe('Simultaneous Tool Execution Load Tests', () => {
  const resourceMonitor = new SystemResourceMonitor()
  const reporter = new LoadTestReporter()
  const testReports: LoadTestReport[] = []
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8787'

  beforeAll(async () => {
    // Ensure API server is running
    try {
      const response = await fetch(`${baseUrl}/health`)
      if (!response.ok) {
        throw new Error('API server is not responding correctly')
      }
      console.log('✅ API server is running and healthy')
    } catch (error) {
      console.error('❌ API server is not available. Please start the server before running load tests.')
      throw error
    }

    // Start resource monitoring
    await resourceMonitor.start()
  })

  afterAll(async () => {
    // Stop resource monitoring
    await resourceMonitor.stop()

    // Generate consolidated report
    await reporter.generateConsolidatedReport(testReports, 'simultaneous-tools-tests')

    console.log(`\n=== Load Test Summary ===`)
    console.log(`Total scenarios executed: ${testReports.length}`)
    console.log(`All reports saved to: ${reporter.getOutputDirectory()}`)
  })

  describe('JSON Tools Concurrent Load Tests', () => {
    it('should handle concurrent JSON formatting operations', async () => {
      console.log('\n🔧 Testing concurrent JSON formatting operations...')

      const concurrentUsers = 50
      const requestsPerUser = 20
      const totalRequests = concurrentUsers * requestsPerUser

      // Generate different JSON data sizes for realistic load
      const jsonSizes = ['small', 'medium', 'large'] as const
      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        const size = jsonSizes[i % jsonSizes.length]
        const requestBody = {
          json: TestDataGenerator.generateJsonData(size),
          indent: Math.floor(Math.random() * 4) + 1,
          sort_keys: Math.random() > 0.5
        }

        requests.push({
          url: `${baseUrl}/tools/json/format`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      // Generate report
      const report = await generateToolExecutionReport('json-format-concurrent', result, {
        maxP95ResponseTime: 500,
        minSuccessRate: 0.95,
        minThroughput: 100,
        maxErrorRate: 0.05
      })

      testReports.push(report)

      // Assert performance requirements
      expect(report.summary.successRate).toBeGreaterThan(0.95)
      expect(report.summary.p95ResponseTime).toBeLessThan(500)
      expect(report.summary.throughput).toBeGreaterThan(100)

      console.log('✅ Concurrent JSON formatting test completed successfully')
      console.log(`  P95 Response Time: ${report.summary.p95ResponseTime.toFixed(2)}ms`)
      console.log(`  Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%`)
      console.log(`  Throughput: ${report.summary.throughput.toFixed(0)} req/s`)
    })

    it('should handle concurrent JSON validation operations', async () => {
      console.log('\n✅ Testing concurrent JSON validation operations...')

      const concurrentUsers = 75
      const requestsPerUser = 15
      const totalRequests = concurrentUsers * requestsPerUser

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        // Mix valid and invalid JSON for realistic testing
        const isValid = Math.random() > 0.2 // 80% valid JSON
        const json = isValid
          ? TestDataGenerator.generateJsonData('small')
          : TestDataGenerator.generateInvalidJson()

        const requestBody = { json }

        requests.push({
          url: `${baseUrl}/tools/json/validate`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateToolExecutionReport('json-validate-concurrent', result, {
        maxP95ResponseTime: 300,
        minSuccessRate: 0.90, // Allow for some invalid JSON requests
        minThroughput: 150,
        maxErrorRate: 0.10
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.90)
      expect(report.summary.p95ResponseTime).toBeLessThan(300)

      console.log('✅ Concurrent JSON validation test completed successfully')
    })

    it('should handle concurrent JSON conversion operations', async () => {
      console.log('\n🔄 Testing concurrent JSON conversion operations...')

      const concurrentUsers = 30
      const requestsPerUser = 25
      const totalRequests = concurrentUsers * requestsPerUser

      const requests = []
      const targetFormats = ['csv', 'xml', 'yaml']

      for (let i = 0; i < totalRequests; i++) {
        const targetFormat = targetFormats[i % targetFormats.length]
        const requestBody = {
          json: TestDataGenerator.generateJsonData('medium'),
          target_format: targetFormat
        }

        requests.push({
          url: `${baseUrl}/tools/json/convert`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateToolExecutionReport('json-convert-concurrent', result, {
        maxP95ResponseTime: 1000,
        minSuccessRate: 0.95,
        minThroughput: 50,
        maxErrorRate: 0.05
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.95)
      expect(report.summary.p95ResponseTime).toBeLessThan(1000)

      console.log('✅ Concurrent JSON conversion test completed successfully')
    })
  })

  describe('Code Tools Concurrent Load Tests', () => {
    it('should handle concurrent code formatting operations', async () => {
      console.log('\n🎨 Testing concurrent code formatting operations...')

      const concurrentUsers = 40
      const requestsPerUser = 20
      const totalRequests = concurrentUsers * requestsPerUser

      const requests = []
      const languages = ['javascript', 'python', 'typescript', 'java', 'go']

      for (let i = 0; i < totalRequests; i++) {
        const language = languages[i % languages.length]
        const requestBody = {
          code: TestDataGenerator.generateCodeSamples(language),
          language: language,
          indent_size: Math.floor(Math.random() * 4) + 2
        }

        requests.push({
          url: `${baseUrl}/tools/code/format`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateToolExecutionReport('code-format-concurrent', result, {
        maxP95ResponseTime: 600,
        minSuccessRate: 0.95,
        minThroughput: 80,
        maxErrorRate: 0.05
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.95)
      expect(report.summary.p95ResponseTime).toBeLessThan(600)

      console.log('✅ Concurrent code formatting test completed successfully')
    })

    it('should handle concurrent code execution operations', async () => {
      console.log('\n⚡ Testing concurrent code execution operations...')

      const concurrentUsers = 25 // Limited for safety
      const requestsPerUser = 10
      const totalRequests = concurrentUsers * requestsPerUser

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        // Generate simple, safe code snippets
        const codeSnippets = [
          'console.log("Hello, World!");',
          'Math.random() * 100;',
          '[1,2,3].map(x => x * 2);',
          'Date.now();',
          'Array.from({length: 5}, (_, i) => i);'
        ]

        const requestBody = {
          code: codeSnippets[i % codeSnippets.length],
          language: 'javascript',
          timeout: 5000
        }

        requests.push({
          url: `${baseUrl}/tools/code/execute`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateToolExecutionReport('code-execute-concurrent', result, {
        maxP95ResponseTime: 2000,
        minSuccessRate: 0.90,
        minThroughput: 20,
        maxErrorRate: 0.10
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.90)
      expect(report.summary.p95ResponseTime).toBeLessThan(2000)

      console.log('✅ Concurrent code execution test completed successfully')
    })
  })

  describe('Mixed Tools Concurrent Load Tests', () => {
    it('should handle mixed concurrent tool operations', async () => {
      console.log('\n🌊 Testing mixed concurrent tool operations...')

      const concurrentUsers = 100
      const requestsPerUser = 30
      const totalRequests = concurrentUsers * requestsPerUser

      const requests = []
      const toolEndpoints = [
        { url: '/tools/json/format', weight: 0.3 },
        { url: '/tools/json/validate', weight: 0.25 },
        { url: '/tools/json/convert', weight: 0.2 },
        { url: '/tools/code/format', weight: 0.2 },
        { url: '/tools/code/execute', weight: 0.05 }
      ]

      for (let i = 0; i < totalRequests; i++) {
        const tool = selectWeightedTool(toolEndpoints)
        let requestBody

        switch (tool.url) {
          case '/tools/json/format':
            requestBody = {
              json: TestDataGenerator.generateJsonData('medium'),
              indent: 2
            }
            break
          case '/tools/json/validate':
            requestBody = {
              json: TestDataGenerator.generateJsonData('small')
            }
            break
          case '/tools/json/convert':
            requestBody = {
              json: TestDataGenerator.generateJsonData('small'),
              target_format: Math.random() > 0.5 ? 'csv' : 'xml'
            }
            break
          case '/tools/code/format':
            requestBody = {
              code: TestDataGenerator.generateCodeSamples('javascript'),
              language: 'javascript'
            }
            break
          case '/tools/code/execute':
            requestBody = {
              code: 'console.log("test");',
              language: 'javascript'
            }
            break
        }

        requests.push({
          url: `${baseUrl}${tool.url}`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateToolExecutionReport('mixed-tools-concurrent', result, {
        maxP95ResponseTime: 800,
        minSuccessRate: 0.92,
        minThroughput: 150,
        maxErrorRate: 0.08
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.92)
      expect(report.summary.p95ResponseTime).toBeLessThan(800)

      console.log('✅ Mixed concurrent tools test completed successfully')
      console.log(`  Tools processed: ${totalRequests}`)
      console.log(`  Average response time: ${report.summary.averageResponseTime.toFixed(2)}ms`)
    })
  })

  describe('Tools Stress and Endurance Tests', () => {
    it('should handle sustained tool execution load', async () => {
      console.log('\n⏱️ Testing sustained tool execution load...')

      const duration = 120000 // 2 minutes
      const concurrentUsers = 50
      const startTime = Date.now()
      const results = []

      while (Date.now() - startTime < duration) {
        const batchRequests = []

        for (let i = 0; i < concurrentUsers; i++) {
          const toolType = ['json-format', 'json-validate', 'code-format'][Math.floor(Math.random() * 3)]
          let requestBody

          switch (toolType) {
            case 'json-format':
              requestBody = {
                json: TestDataGenerator.generateJsonData('small'),
                indent: 2
              }
              break
            case 'json-validate':
              requestBody = {
                json: TestDataGenerator.generateJsonData('small')
              }
              break
            case 'code-format':
              requestBody = {
                code: TestDataGenerator.generateCodeSamples('javascript'),
                language: 'javascript'
              }
              break
          }

          batchRequests.push({
            url: `${baseUrl}/tools/${toolType.replace('-', '/')}`,
            method: 'POST' as const,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          })
        }

        const batchResult = await runConcurrentRequests(batchRequests, concurrentUsers)
        results.push({
          timestamp: Date.now(),
          p95: batchResult.p95,
          successRate: batchResult.successfulRequests / batchResult.totalRequests,
          throughput: batchResult.requestsPerSecond
        })

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Analyze sustained performance
      const p95Values = results.map(r => r.p95)
      const successRates = results.map(r => r.successRate)
      const throughputs = results.map(r => r.throughput)

      const avgP95 = p95Values.reduce((sum, p95) => sum + p95, 0) / p95Values.length
      const minSuccessRate = Math.min(...successRates)
      const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length

      console.log(`Sustained Load Test Results (${results.length} batches):`)
      console.log(`  Average P95: ${avgP95.toFixed(2)}ms`)
      console.log(`  Minimum Success Rate: ${(minSuccessRate * 100).toFixed(1)}%`)
      console.log(`  Average Throughput: ${avgThroughput.toFixed(0)} req/s`)

      // Performance should remain stable
      const maxP95 = Math.max(...p95Values)
      const minP95 = Math.min(...p95Values)
      const variance = (maxP95 - minP95) / avgP95

      expect(variance).toBeLessThan(0.5, 'Performance variance too high over sustained load')
      expect(minSuccessRate).toBeGreaterThan(0.90)

      // Generate endurance test report
      const enduranceReport = await generateToolExecutionReport('tools-endurance', {
        totalRequests: results.reduce((sum, r) => sum + concurrentUsers, 0),
        successfulRequests: results.reduce((sum, r) => sum + (r.successRate * concurrentUsers), 0),
        failedRequests: 0,
        averageResponseTime: avgP95,
        p95: avgP95,
        requestsPerSecond: avgThroughput
      }, {
        maxP95ResponseTime: 600,
        minSuccessRate: 0.90,
        minThroughput: 100,
        maxErrorRate: 0.10
      })

      testReports.push(enduranceReport)

      console.log('✅ Sustained tool execution load test completed successfully')
    })

    it('should handle tool execution with varying data sizes', async () => {
      console.log('\n📊 Testing tool execution with varying data sizes...')

      const dataSizes = [
        { name: 'tiny', size: 1024, multiplier: 1 },
        { name: 'small', size: 10240, multiplier: 2 },
        { name: 'medium', size: 102400, multiplier: 5 },
        { name: 'large', size: 1024000, multiplier: 10 },
        { name: 'huge', size: 5120000, multiplier: 20 }
      ]

      const sizeResults = []

      for (const dataSize of dataSizes) {
        console.log(`  Testing ${dataSize.name} data (${dataSize.size} bytes)...`)

        const concurrentUsers = Math.max(5, Math.floor(100 / dataSize.multiplier))
        const requests = []

        for (let i = 0; i < concurrentUsers * 5; i++) {
          const json = TestDataGenerator.generateJsonDataOfSize(dataSize.size)
          const requestBody = {
            json: json,
            indent: 2,
            sort_keys: false
          }

          requests.push({
            url: `${baseUrl}/tools/json/format`,
            method: 'POST' as const,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          })
        }

        const result = await runConcurrentRequests(requests, concurrentUsers)

        sizeResults.push({
          size: dataSize.name,
          bytes: dataSize.size,
          p95: result.p95,
          successRate: result.successfulRequests / result.totalRequests,
          throughput: result.requestsPerSecond,
          avgResponseTime: result.averageResponseTime
        })
      }

      // Analyze how data size affects performance
      console.log('\nData Size Performance Analysis:')
      sizeResults.forEach(result => {
        console.log(`  ${result.size}: P95=${result.p95.toFixed(2)}ms, Success=${(result.successRate * 100).toFixed(1)}%, Throughput=${result.throughput.toFixed(1)} req/s`)
      })

      // Performance should scale reasonably with data size
      const tinyP95 = sizeResults.find(r => r.size === 'tiny')!.p95
      const hugeP95 = sizeResults.find(r => r.size === 'huge')!.p95
      const performanceRatio = hugeP95 / tinyP95

      expect(performanceRatio).toBeLessThan(50, 'Performance degradation too extreme for large data sizes')

      // All sizes should maintain reasonable success rates
      sizeResults.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.85)
      })

      console.log('✅ Tool execution with varying data sizes test completed successfully')
    })
  })

  /**
   * Run concurrent requests with specified concurrency
   */
  async function runConcurrentRequests(requests: any[], concurrency: number) {
    const startTime = Date.now()
    const results = []

    // Process requests in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency)

      const batchPromises = batch.map(async (request) => {
        const startTime = performance.now()

        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            signal: AbortSignal.timeout(30000)
          })

          const endTime = performance.now()
          const responseTime = endTime - startTime

          return {
            success: response.ok,
            statusCode: response.status,
            responseTime,
            error: response.ok ? undefined : `HTTP ${response.status}`
          }
        } catch (error) {
          const endTime = performance.now()
          const responseTime = endTime - startTime

          return {
            success: false,
            statusCode: 0,
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Small delay between batches to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Calculate metrics
    const totalTime = Date.now() - startTime
    const successfulRequests = results.filter(r => r.success).length
    const responseTimes = results.filter(r => r.success).map(r => r.responseTime).sort((a, b) => a - b)

    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests: results.length - successfulRequests,
      averageResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0,
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
      p90: responseTimes[Math.floor(responseTimes.length * 0.9)] || 0,
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      requestsPerSecond: results.length / (totalTime / 1000),
      errors: results.filter(r => !r.success).reduce((acc, r) => {
        const error = r.error || 'Unknown error'
        acc[error] = (acc[error] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  /**
   * Select tool based on weights
   */
  function selectWeightedTool(tools: Array<{ url: string; weight: number }>) {
    const total = tools.reduce((sum, tool) => sum + tool.weight, 0)
    let random = Math.random() * total

    for (const tool of tools) {
      random -= tool.weight
      if (random <= 0) {
        return tool
      }
    }

    return tools[0]
  }

  /**
   * Generate tool execution report
   */
  async function generateToolExecutionReport(scenario: string, result: any, requirements: any): Promise<LoadTestReport> {
    const resourceMetrics = resourceMonitor.getMetrics()

    return {
      scenario,
      timestamp: new Date().toISOString(),
      duration: 0, // Not tracking duration for individual tests
      users: 0, // Not tracking users for these tests
      summary: {
        totalRequests: result.totalRequests,
        successfulRequests: result.successfulRequests,
        failedRequests: result.failedRequests,
        averageResponseTime: result.averageResponseTime,
        p95ResponseTime: result.p95,
        p99ResponseTime: result.p99,
        throughput: result.requestsPerSecond,
        errorRate: result.failedRequests / result.totalRequests
      },
      endpoints: {
        'tools-endpoint': {
          requests: result.totalRequests,
          averageResponseTime: result.averageResponseTime,
          p95ResponseTime: result.p95,
          successRate: result.successfulRequests / result.totalRequests,
          errors: Object.entries(result.errors).map(([type, count]) => ({ type, count: count as number }))
        }
      },
      userBehavior: {},
      resources: resourceMetrics,
      bottlenecks: identifyToolBottlenecks(result, requirements),
      recommendations: generateToolRecommendations(result, requirements)
    }
  }

  /**
   * Identify tool execution bottlenecks
   */
  function identifyToolBottlenecks(result: any, requirements: any) {
    const bottlenecks = []

    if (result.p95 > requirements.maxP95ResponseTime) {
      bottlenecks.push({
        type: 'endpoint' as const,
        target: 'tools-execution',
        metric: 'p95_response_time',
        value: result.p95,
        threshold: requirements.maxP95ResponseTime,
        severity: result.p95 > requirements.maxP95ResponseTime * 2 ? 'critical' as const : 'high' as const
      })
    }

    const successRate = result.successfulRequests / result.totalRequests
    if (successRate < requirements.minSuccessRate) {
      bottlenecks.push({
        type: 'endpoint' as const,
        target: 'tools-execution',
        metric: 'success_rate',
        value: successRate,
        threshold: requirements.minSuccessRate,
        severity: successRate < requirements.minSuccessRate * 0.8 ? 'critical' as const : 'high' as const
      })
    }

    return bottlenecks
  }

  /**
   * Generate tool execution recommendations
   */
  function generateToolRecommendations(result: any, requirements: any) {
    const recommendations = []

    if (result.p95 > requirements.maxP95ResponseTime) {
      recommendations.push('Consider optimizing tool execution algorithms or implementing result caching')
    }

    if (result.averageResponseTime > 500) {
      recommendations.push('Consider implementing asynchronous processing for long-running tool operations')
    }

    const errorCount = Object.values(result.errors).reduce((sum: number, count: any) => sum + count, 0)
    if (errorCount > result.totalRequests * 0.05) {
      recommendations.push('Review tool error handling and implement better input validation')
    }

    if (result.requestsPerSecond < requirements.minThroughput) {
      recommendations.push('Consider scaling up compute resources or implementing tool execution pools')
    }

    return recommendations
  }
})
