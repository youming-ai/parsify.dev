import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ALL_ENDPOINTS,
  API_BASE_URL,
  PERFORMANCE_TEST_SCENARIOS,
  TestDataGenerator,
} from '../utils/endpoint-configs'
import {
  assertPerformanceRequirements,
  generatePerformanceReport,
  runConcurrencyTest,
  runLoadTest,
  savePerformanceResults,
} from '../utils/performance-utils'

describe('Comprehensive Load Testing Scenarios', () => {
  const testResults: Array<{ name: string; timestamp: string; results: any }> = []

  beforeAll(async () => {
    // Ensure the API server is running before tests
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      if (!response.ok) {
        throw new Error('API server is not responding correctly')
      }
      console.log('✅ API server is running and healthy')
    } catch (error) {
      console.error(
        '❌ API server is not available. Please start the server before running performance tests.'
      )
      throw error
    }
  })

  afterAll(async () => {
    // Save all test results to a summary file
    console.log('\n=== Saving Performance Test Results ===')
    for (const testResult of testResults) {
      await savePerformanceResults(
        testResult.results,
        `performance-${testResult.name}-${testResult.timestamp}.json`
      )
    }
    console.log(`Saved ${testResults.length} performance test result files`)
  })

  describe('Scenario: Smoke Test', () => {
    it('should pass basic smoke test for critical endpoints', async () => {
      const scenario = PERFORMANCE_TEST_SCENARIOS.find(s => s.name === 'smoke-test')
      if (!scenario) throw new Error('Smoke test scenario not found')

      console.log(`\n🚀 Running smoke test: ${scenario.description}`)

      const results = []

      for (const endpoint of scenario.endpoints) {
        console.log(`  Testing ${endpoint.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method || 'GET',
          headers: endpoint.headers,
          body: endpoint.body,
          concurrentRequests: scenario.concurrentRequests,
          totalRequests: scenario.totalRequests,
          timeout: 5000,
        })

        results.push({ endpoint: endpoint.description, result })

        // Assert requirements
        const performanceCheck = assertPerformanceRequirements(result, scenario.requirements)
        expect(
          performanceCheck.passed,
          `${endpoint.description} failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
      }

      // Store results
      testResults.push({
        name: 'smoke-test',
        timestamp: new Date().toISOString(),
        results: results.map(r => ({ ...r.result, endpoint: r.endpoint })),
      })

      console.log('✅ Smoke test completed successfully')
    })
  })

  describe('Scenario: Tools Basic Load Test', () => {
    it('should handle basic tools API load efficiently', async () => {
      const scenario = PERFORMANCE_TEST_SCENARIOS.find(s => s.name === 'tools-basic')
      if (!scenario) throw new Error('Tools basic scenario not found')

      console.log(`\n🔧 Running tools basic load test: ${scenario.description}`)

      const results = []

      for (const endpoint of scenario.endpoints) {
        console.log(`  Testing ${endpoint.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method || 'GET',
          concurrentRequests: scenario.concurrentRequests,
          totalRequests: scenario.totalRequests,
          timeout: 8000,
        })

        results.push({ endpoint: endpoint.description, result })

        // Assert requirements
        const performanceCheck = assertPerformanceRequirements(result, scenario.requirements)
        expect(
          performanceCheck.passed,
          `${endpoint.description} failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
      }

      // Store results
      testResults.push({
        name: 'tools-basic',
        timestamp: new Date().toISOString(),
        results: results.map(r => ({ ...r.result, endpoint: r.endpoint })),
      })

      console.log('✅ Tools basic load test completed successfully')
    })
  })

  describe('Scenario: Tools Intensive Load Test', () => {
    it('should handle intensive tools API operations under load', async () => {
      const scenario = PERFORMANCE_TEST_SCENARIOS.find(s => s.name === 'tools-intensive')
      if (!scenario) throw new Error('Tools intensive scenario not found')

      console.log(`\n⚡ Running tools intensive load test: ${scenario.description}`)

      const results = []

      for (const endpoint of scenario.endpoints) {
        console.log(`  Testing ${endpoint.description}...`)

        // Generate different data for each request to test variability
        const generateRequestBody = () => {
          if (endpoint.path === '/tools/json/format') {
            return {
              json: TestDataGenerator.generateJsonData('medium'),
              indent: 2,
              sort_keys: Math.random() > 0.5,
            }
          } else if (endpoint.path === '/tools/json/validate') {
            return {
              json: TestDataGenerator.generateJsonData('small'),
            }
          } else if (endpoint.path === '/tools/json/convert') {
            return {
              json: TestDataGenerator.generateJsonData('small'),
              target_format: Math.random() > 0.5 ? 'csv' : 'xml',
            }
          } else if (endpoint.path === '/tools/code/format') {
            return {
              code: TestDataGenerator.generateCodeSamples('javascript'),
              language: 'javascript',
            }
          }
          return endpoint.body
        }

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method || 'GET',
          headers: endpoint.headers,
          body: generateRequestBody(),
          concurrentRequests: scenario.concurrentRequests,
          totalRequests: scenario.totalRequests,
          timeout: 15000,
        })

        results.push({ endpoint: endpoint.description, result })

        // Assert requirements
        const performanceCheck = assertPerformanceRequirements(result, scenario.requirements)
        expect(
          performanceCheck.passed,
          `${endpoint.description} failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
      }

      // Store results
      testResults.push({
        name: 'tools-intensive',
        timestamp: new Date().toISOString(),
        results: results.map(r => ({ ...r.result, endpoint: r.endpoint })),
      })

      console.log('✅ Tools intensive load test completed successfully')
    })
  })

  describe('Scenario: Concurrency Stress Test', () => {
    it('should maintain performance under increasing concurrency levels', async () => {
      const scenario = PERFORMANCE_TEST_SCENARIOS.find(s => s.name === 'concurrency-test')
      if (!scenario) throw new Error('Concurrency test scenario not found')

      console.log(`\n🔄 Running concurrency stress test: ${scenario.description}`)

      // Test health endpoint at different concurrency levels
      const endpoint = scenario.endpoints[0]
      const concurrencyLevels = [1, 5, 10, 25, 50, 100, 200]

      const concurrencyResults = await runConcurrencyTest(
        `${API_BASE_URL}${endpoint.path}`,
        {
          method: endpoint.method || 'GET',
          totalRequests: scenario.totalRequests,
          timeout: 10000,
        },
        concurrencyLevels
      )

      console.log('\nConcurrency stress test results:')
      console.log(generatePerformanceReport(concurrencyResults))

      // Analyze performance degradation
      let previousP95 = 0
      for (const concurrency of concurrencyLevels) {
        const result = concurrencyResults[concurrency]

        // Performance should not degrade excessively
        const maxAllowedP95 =
          scenario.requirements?.maxP95ResponseTime! * (1 + Math.log10(concurrency) * 0.5)

        expect(result.p95).toBeLessThan(
          maxAllowedP95,
          `P95 at concurrency ${concurrency} (${result.p95.toFixed(2)}ms) exceeds allowed threshold (${maxAllowedP95.toFixed(2)}ms)`
        )

        // Check that response time degradation is reasonable
        if (previousP95 > 0) {
          const degradationRatio = result.p95 / previousP95
          expect(degradationRatio).toBeLessThan(
            3,
            `Response time degradation too high between concurrency levels: ${degradationRatio.toFixed(2)}x`
          )
        }

        previousP95 = result.p95

        // Success rate should remain high
        const successRate = result.successfulRequests / result.totalRequests
        expect(successRate).toBeGreaterThan(
          0.95,
          `Success rate too low at concurrency ${concurrency}: ${(successRate * 100).toFixed(1)}%`
        )
      }

      // Store results
      testResults.push({
        name: 'concurrency-test',
        timestamp: new Date().toISOString(),
        results: concurrencyResults,
      })

      console.log('✅ Concurrency stress test completed successfully')
    })
  })

  describe('Scenario: Full System Load Test', () => {
    it('should handle mixed load across all API endpoints', async () => {
      const scenario = PERFORMANCE_TEST_SCENARIOS.find(s => s.name === 'load-test')
      if (!scenario) throw new Error('Load test scenario not found')

      console.log(`\n🌊 Running full system load test: ${scenario.description}`)

      const results = []
      const endpointResults = new Map<string, any[]>()

      // Test each endpoint with mixed load patterns
      for (const endpoint of ALL_ENDPOINTS) {
        console.log(`  Testing ${endpoint.description}...`)

        // Generate dynamic request body for POST endpoints
        const generateRequestBody = () => {
          if (endpoint.body) {
            if (endpoint.path.includes('json/format')) {
              return {
                ...endpoint.body,
                json: TestDataGenerator.generateJsonData('medium'),
              }
            } else if (endpoint.path.includes('upload/sign')) {
              return TestDataGenerator.generateUploadData(`test-${Date.now()}.json`, 1024)
            } else if (endpoint.path.includes('jobs')) {
              return TestDataGenerator.generateJobData('json-format', 'small')
            }
            return endpoint.body
          }
          return undefined
        }

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method || 'GET',
          headers: endpoint.headers,
          body: generateRequestBody(),
          concurrentRequests: Math.min(scenario.concurrentRequests, 10), // Limit per endpoint
          totalRequests: Math.min(scenario.totalRequests / ALL_ENDPOINTS.length, 20),
          timeout: endpoint.expectedStatus === 401 ? 3000 : 15000,
        })

        results.push({ endpoint: endpoint.description, result })

        // Group results by endpoint category
        const category = endpoint.path.split('/')[1] || 'health'
        if (!endpointResults.has(category)) {
          endpointResults.set(category, [])
        }
        endpointResults.get(category)?.push({
          endpoint: endpoint.description,
          result,
          path: endpoint.path,
        })

        // Basic requirements for all endpoints
        const maxP95 =
          endpoint.expectedStatus === 401 ? 100 : scenario.requirements?.maxP95ResponseTime!
        const minSuccessRate =
          endpoint.expectedStatus === 401 ? 0.95 : scenario.requirements?.minSuccessRate!

        const performanceCheck = assertPerformanceRequirements(result, {
          maxP95ResponseTime: maxP95,
          minSuccessRate: minSuccessRate,
        })

        if (!performanceCheck.passed) {
          console.warn(
            `  ⚠️  ${endpoint.description} did not meet all requirements: ${performanceCheck.failures.join(', ')}`
          )
        }
      }

      // Analyze results by category
      console.log('\n📊 Load Test Results by Category:')
      for (const [category, categoryResults] of endpointResults.entries()) {
        const totalRequests = categoryResults.reduce((sum, r) => sum + r.result.totalRequests, 0)
        const totalSuccessful = categoryResults.reduce(
          (sum, r) => sum + r.result.successfulRequests,
          0
        )
        const avgP95 =
          categoryResults.reduce((sum, r) => sum + r.result.p95, 0) / categoryResults.length

        console.log(`  ${category.toUpperCase()}:`)
        console.log(`    Total requests: ${totalRequests}`)
        console.log(`    Success rate: ${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`)
        console.log(`    Average P95: ${avgP95.toFixed(2)}ms`)

        categoryResults.forEach(r => {
          const successRate = (
            (r.result.successfulRequests / r.result.totalRequests) *
            100
          ).toFixed(1)
          console.log(
            `      ${r.endpoint}: P95=${r.result.p95.toFixed(2)}ms, Success=${successRate}%`
          )
        })
      }

      // Overall system statistics
      const systemTotalRequests = results.reduce((sum, r) => sum + r.result.totalRequests, 0)
      const systemTotalSuccessful = results.reduce((sum, r) => sum + r.result.successfulRequests, 0)
      const systemAvgP95 = results.reduce((sum, r) => sum + r.result.p95, 0) / results.length
      const systemRPS = results.reduce((sum, r) => sum + r.result.requestsPerSecond, 0)

      console.log('\n🎯 Overall System Performance:')
      console.log(`  Total requests processed: ${systemTotalRequests}`)
      console.log(
        `  System success rate: ${((systemTotalSuccessful / systemTotalRequests) * 100).toFixed(1)}%`
      )
      console.log(`  System average P95: ${systemAvgP95.toFixed(2)}ms`)
      console.log(`  Total system throughput: ${systemRPS.toFixed(2)} req/s`)

      // Store results
      testResults.push({
        name: 'full-load-test',
        timestamp: new Date().toISOString(),
        results: {
          summary: {
            totalRequests: systemTotalRequests,
            totalSuccessful: systemTotalSuccessful,
            successRate: (systemTotalSuccessful / systemTotalRequests) * 100,
            avgP95: systemAvgP95,
            totalRPS: systemRPS,
          },
          byCategory: Object.fromEntries(
            Array.from(endpointResults.entries()).map(([category, results]) => [
              category,
              results.map(r => ({
                endpoint: r.endpoint,
                path: r.path,
                ...r.result,
              })),
            ])
          ),
        },
      })

      // Overall system should meet basic requirements
      expect(systemAvgP95).toBeLessThan(scenario.requirements?.maxP95ResponseTime! * 1.5)
      expect(systemTotalSuccessful / systemTotalRequests).toBeGreaterThan(0.9)

      console.log('✅ Full system load test completed successfully')
    })
  })

  describe('Scenario: Sustained Load Test', () => {
    it('should maintain performance over sustained duration', async () => {
      console.log('\n⏱️  Running sustained load test...')

      const duration = 30000 // 30 seconds
      const endpoint = '/health'
      const concurrency = 10

      const startTime = Date.now()
      const results = []
      let iteration = 0

      while (Date.now() - startTime < duration) {
        iteration++
        console.log(`  Iteration ${iteration}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint}`,
          method: 'GET',
          concurrentRequests: concurrency,
          totalRequests: 20,
          timeout: 5000,
        })

        results.push({
          iteration,
          timestamp: Date.now(),
          p95: result.p95,
          successRate: result.successfulRequests / result.totalRequests,
          rps: result.requestsPerSecond,
        })

        // Performance should remain stable
        expect(result.p95).toBeLessThan(100)
        expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.95)

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Analyze performance stability over time
      const p95Values = results.map(r => r.p95)
      const maxP95 = Math.max(...p95Values)
      const minP95 = Math.min(...p95Values)
      const avgP95 = p95Values.reduce((sum, p95) => sum + p95, 0) / p95Values.length

      const successRates = results.map(r => r.successRate)
      const minSuccessRate = Math.min(...successRates)

      console.log(
        `\n📈 Sustained Load Test Results (${iteration} iterations over ${(duration / 1000).toFixed(1)}s):`
      )
      console.log(
        `  P95 range: ${minP95.toFixed(2)}ms - ${maxP95.toFixed(2)}ms (avg: ${avgP95.toFixed(2)}ms)`
      )
      console.log(`  Success rate range: ${(minSuccessRate * 100).toFixed(1)}% - 100%`)
      console.log(`  Performance variance: ${(((maxP95 - minP95) / avgP95) * 100).toFixed(1)}%`)

      // Performance should be stable (low variance)
      const variance = (maxP95 - minP95) / avgP95
      expect(variance).toBeLessThan(0.5, 'Performance variance too high over sustained load')

      // Store results
      testResults.push({
        name: 'sustained-load-test',
        timestamp: new Date().toISOString(),
        results: {
          duration,
          iterations: iteration,
          p95Stats: { min: minP95, max: maxP95, avg: avgP95 },
          minSuccessRate,
          variance,
          samples: results,
        },
      })

      console.log('✅ Sustained load test completed successfully')
    })
  })
})
