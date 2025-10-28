import { beforeAll, describe, expect, it } from 'vitest'
import { API_BASE_URL, TestDataGenerator, TOOL_ENDPOINTS } from '../utils/endpoint-configs'
import {
  assertPerformanceRequirements,
  generatePerformanceReport,
  runConcurrencyTest,
  runLoadTest,
} from '../utils/performance-utils'

describe('Tools API Performance Tests', () => {
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

  describe('GET /tools - List available tools', () => {
    it('should handle concurrent requests within performance targets', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Tools list performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Assert performance requirements
      const performanceCheck = assertPerformanceRequirements(result, {
        maxP95ResponseTime: endpoint.maxP95ResponseTime,
        minSuccessRate: endpoint.minSuccessRate,
      })

      expect(
        performanceCheck.passed,
        `Performance requirements not met: ${performanceCheck.failures.join(', ')}`
      ).toBe(true)
      expect(result.successfulRequests).toBeGreaterThan(0)
    })

    it('should maintain performance under varying concurrency levels', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const concurrencyResults = await runConcurrencyTest(
        `${API_BASE_URL}${endpoint.path}`,
        {
          method: endpoint.method,
          totalRequests: 40,
        },
        [1, 5, 10, 20]
      )

      console.log('\nConcurrency test results for /tools:')
      console.log(generatePerformanceReport(concurrencyResults))

      // Check that all concurrency levels meet basic requirements
      Object.entries(concurrencyResults).forEach(([concurrency, result]) => {
        const performanceCheck = assertPerformanceRequirements(result, {
          maxP95ResponseTime: endpoint.maxP95ResponseTime! * 1.5, // Allow 50% slower under high concurrency
          minSuccessRate: 0.95,
        })

        expect(
          performanceCheck.passed,
          `Concurrency ${concurrency} failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
      })
    })
  })

  describe('POST /tools/json/format - JSON formatting', () => {
    it('should format JSON efficiently under load', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools/json/format')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      // Test with different JSON sizes
      const testCases = [
        {
          name: 'small JSON',
          data: TestDataGenerator.generateJsonData('small'),
        },
        {
          name: 'medium JSON',
          data: TestDataGenerator.generateJsonData('medium'),
        },
        {
          name: 'large JSON',
          data: TestDataGenerator.generateJsonData('large'),
        },
      ]

      for (const testCase of testCases) {
        console.log(`Testing ${testCase.name} formatting...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.headers,
          body: {
            ...endpoint.body,
            json: testCase.data,
          },
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 10000,
        })

        console.log(
          `${testCase.name} formatting: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        // Adjust expectations based on data size
        const maxResponseTime = testCase.name === 'large' ? 500 : endpoint.maxP95ResponseTime!

        const performanceCheck = assertPerformanceRequirements(result, {
          maxP95ResponseTime: maxResponseTime,
          minSuccessRate: endpoint.minSuccessRate,
        })

        expect(
          performanceCheck.passed,
          `${testCase.name} formatting failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
        expect(result.successfulRequests).toBeGreaterThan(0)
      }
    })
  })

  describe('POST /tools/json/validate - JSON validation', () => {
    it('should validate JSON quickly under load', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools/json/validate')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body,
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `JSON validation performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      const performanceCheck = assertPerformanceRequirements(result, {
        maxP95ResponseTime: endpoint.maxP95ResponseTime,
        minSuccessRate: endpoint.minSuccessRate,
      })

      expect(
        performanceCheck.passed,
        `JSON validation failed: ${performanceCheck.failures.join(', ')}`
      ).toBe(true)
      expect(result.successfulRequests).toBeGreaterThan(0)
    })

    it('should handle invalid JSON gracefully', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools/json/validate')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        headers: endpoint.headers,
        body: {
          json: '{"invalid": json}', // Invalid JSON
        },
        concurrentRequests: 5,
        totalRequests: 25,
        timeout: 5000,
      })

      // Should still be fast even for invalid JSON
      expect(result.p95).toBeLessThan(200)
      expect(result.successfulRequests).toBeGreaterThan(0)

      // Check that we're getting proper error responses
      const successfulValidations = result.metrics.filter(
        m => m.statusCode >= 200 && m.statusCode < 400
      )
      expect(successfulValidations.length).toBeGreaterThan(0)
    })
  })

  describe('POST /tools/json/convert - JSON conversion', () => {
    it('should convert JSON to different formats efficiently', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools/json/convert')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const conversionTargets = ['csv', 'xml']

      for (const targetFormat of conversionTargets) {
        console.log(`Testing JSON to ${targetFormat} conversion...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.headers,
          body: {
            ...endpoint.body,
            target_format: targetFormat,
          },
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 8000,
        })

        console.log(
          `JSON to ${targetFormat}: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        const performanceCheck = assertPerformanceRequirements(result, {
          maxP95ResponseTime: endpoint.maxP95ResponseTime,
          minSuccessRate: endpoint.minSuccessRate,
        })

        expect(
          performanceCheck.passed,
          `JSON to ${targetFormat} conversion failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
        expect(result.successfulRequests).toBeGreaterThan(0)
      }
    })
  })

  describe('POST /tools/code/format - Code formatting', () => {
    it('should format code efficiently', async () => {
      const endpoint = TOOL_ENDPOINTS.find(e => e.path === '/tools/code/format')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const languages = ['javascript', 'python']

      for (const language of languages) {
        console.log(`Testing ${language} code formatting...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.headers,
          body: {
            code: TestDataGenerator.generateCodeSamples(language as 'javascript' | 'python'),
            language,
          },
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 8000,
        })

        console.log(
          `${language} formatting: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        const performanceCheck = assertPerformanceRequirements(result, {
          maxP95ResponseTime: endpoint.maxP95ResponseTime,
          minSuccessRate: endpoint.minSuccessRate,
        })

        expect(
          performanceCheck.passed,
          `${language} formatting failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
        expect(result.successfulRequests).toBeGreaterThan(0)
      }
    })
  })

  describe('Comprehensive Tools Performance Test', () => {
    it('should handle mixed tool operations efficiently', async () => {
      const postEndpoints = TOOL_ENDPOINTS.filter(e => e.method === 'POST')
      const results = []

      for (const endpoint of postEndpoints) {
        console.log(`Testing comprehensive performance for ${endpoint.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.headers,
          body: endpoint.body,
          concurrentRequests: 3,
          totalRequests: 15,
          timeout: 10000,
        })

        results.push({ endpoint: endpoint.description, result })

        const performanceCheck = assertPerformanceRequirements(result, {
          maxP95ResponseTime: endpoint.maxP95ResponseTime,
          minSuccessRate: endpoint.minSuccessRate,
        })

        expect(
          performanceCheck.passed,
          `${endpoint.description} failed: ${performanceCheck.failures.join(', ')}`
        ).toBe(true)
      }

      // Log comprehensive results
      console.log('\n=== Comprehensive Tools Performance Summary ===')
      results.forEach(({ endpoint, result }) => {
        console.log(
          `${endpoint}: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )
      })

      // Calculate overall statistics
      const totalRequests = results.reduce((sum, { result }) => sum + result.totalRequests, 0)
      const totalSuccessful = results.reduce(
        (sum, { result }) => sum + result.successfulRequests,
        0
      )
      const avgP95 = results.reduce((sum, { result }) => sum + result.p95, 0) / results.length

      console.log(
        `\nOverall: P95 avg=${avgP95.toFixed(2)}ms, Success Rate=${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`
      )

      // Overall performance should meet basic requirements
      expect(avgP95).toBeLessThan(300)
      expect(totalSuccessful / totalRequests).toBeGreaterThan(0.9)
    })
  })
})
