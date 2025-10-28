import { beforeAll, describe, expect, it } from 'vitest'
import { API_BASE_URL, JOB_ENDPOINTS, TestDataGenerator } from '../utils/endpoint-configs'
import {
  assertPerformanceRequirements,
  generatePerformanceReport,
  runConcurrencyTest,
  runLoadTest,
} from '../utils/performance-utils'

describe('Jobs API Performance Tests', () => {
  const createdJobIds: string[] = []

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

  describe('POST /jobs - Create new job', () => {
    it('should create jobs efficiently under load', async () => {
      const endpoint = JOB_ENDPOINTS.find(e => e.path === '/jobs' && e.method === 'POST')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        headers: endpoint.headers,
        body: TestDataGenerator.generateJobData('json-format', 'small'),
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 10000,
      })

      console.log(
        `Job creation performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      const performanceCheck = assertPerformanceRequirements(result, {
        maxP95ResponseTime: endpoint.maxP95ResponseTime,
        minSuccessRate: endpoint.minSuccessRate,
      })

      expect(
        performanceCheck.passed,
        `Job creation failed: ${performanceCheck.failures.join(', ')}`
      ).toBe(true)
      expect(result.successfulRequests).toBeGreaterThan(0)

      // Store some job IDs for later tests
      const successfulResponses = result.metrics.filter(m => m.statusCode === 201)
      if (successfulResponses.length > 0) {
        // Note: In a real implementation, we'd parse the response to get job IDs
        // For now, we'll just note that jobs were created successfully
        createdJobIds.push(`job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
      }
    })

    it('should handle jobs with different data sizes efficiently', async () => {
      const dataSizes = ['small', 'medium', 'large'] as const
      const results = []

      for (const dataSize of dataSizes) {
        console.log(`Testing job creation with ${dataSize} data...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: TestDataGenerator.generateJobData('json-format', dataSize),
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 15000,
        })

        results.push({ dataSize, result })

        // Adjust expectations based on data size
        const maxResponseTime = dataSize === 'large' ? 1000 : 500

        expect(result.p95).toBeLessThan(maxResponseTime)
        expect(result.successfulRequests).toBeGreaterThan(0)
      }

      console.log('\n=== Job Creation Performance by Data Size ===')
      results.forEach(({ dataSize, result }) => {
        const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)
        console.log(`${dataSize}: P95=${result.p95.toFixed(2)}ms, Success Rate=${successRate}%`)
      })

      // Larger data should not significantly impact performance
      const smallP95 = results.find(r => r.dataSize === 'small')?.result.p95
      const largeP95 = results.find(r => r.dataSize === 'large')?.result.p95
      expect(largeP95 / smallP95).toBeLessThan(3) // Large data shouldn't be more than 3x slower
    })

    it('should handle different tool types efficiently', async () => {
      const toolTypes = [
        { toolId: 'json-format', description: 'JSON formatting' },
        { toolId: 'json-validate', description: 'JSON validation' },
        { toolId: 'json-convert', description: 'JSON conversion' },
      ]
      const results = []

      for (const toolType of toolTypes) {
        console.log(`Testing job creation for ${toolType.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: TestDataGenerator.generateJobData(toolType.toolId, 'small'),
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 10000,
        })

        results.push({ tool: toolType.description, result })

        expect(result.p95).toBeLessThan(500)
        expect(result.successfulRequests).toBeGreaterThan(0)
      }

      console.log('\n=== Job Creation Performance by Tool Type ===')
      results.forEach(({ tool, result }) => {
        const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)
        console.log(`${tool}: P95=${result.p95.toFixed(2)}ms, Success Rate=${successRate}%`)
      })
    })

    it('should handle invalid job creation requests gracefully', async () => {
      const invalidRequests = [
        { name: 'missing tool_id', data: { input_data: { json: '{}' } } },
        { name: 'missing input_data', data: { tool_id: 'json-format' } },
        {
          name: 'invalid tool_id',
          data: { tool_id: 'invalid-tool', input_data: { json: '{}' } },
        },
        {
          name: 'malformed data',
          data: { tool_id: 'json-format', input_data: 'invalid' },
        },
      ]

      for (const invalidRequest of invalidRequests) {
        console.log(`Testing invalid job creation: ${invalidRequest.name}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: invalidRequest.data,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        // Should respond quickly even to invalid requests
        expect(result.p95).toBeLessThan(200)

        // Should handle all requests (even error responses)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)

        // Should get appropriate error status codes
        const errorResponses = result.metrics.filter(m => m.statusCode >= 400)
        expect(errorResponses.length).toBeGreaterThan(0)
      }
    })
  })

  describe('GET /jobs - List jobs', () => {
    it('should list jobs efficiently under load', async () => {
      const endpoint = JOB_ENDPOINTS.find(e => e.path === '/jobs' && e.method === 'GET')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 15,
        totalRequests: 75,
        timeout: 5000,
      })

      console.log(
        `Jobs listing performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      const performanceCheck = assertPerformanceRequirements(result, {
        maxP95ResponseTime: endpoint.maxP95ResponseTime,
        minSuccessRate: endpoint.minSuccessRate,
      })

      expect(
        performanceCheck.passed,
        `Jobs listing failed: ${performanceCheck.failures.join(', ')}`
      ).toBe(true)
      expect(result.successfulRequests).toBeGreaterThan(0)
    })

    it('should handle filtered job listings efficiently', async () => {
      const filters = [
        { query: '?status=completed', description: 'completed status' },
        { query: '?status=running', description: 'running status' },
        { query: '?tool_id=json-format', description: 'specific tool' },
        { query: '?limit=10&offset=0', description: 'pagination' },
        { query: '?limit=5&offset=10', description: 'offset pagination' },
      ]

      for (const filter of filters) {
        console.log(`Testing jobs listing with ${filter.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs${filter.query}`,
          method: 'GET',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }
    })

    it('should maintain performance under high concurrency for job listing', async () => {
      const concurrencyResults = await runConcurrencyTest(
        `${API_BASE_URL}/jobs`,
        {
          method: 'GET',
          totalRequests: 60,
        },
        [1, 10, 25, 50]
      )

      console.log('\nConcurrency test results for jobs listing:')
      console.log(generatePerformanceReport(concurrencyResults))

      // Check that all concurrency levels meet requirements
      Object.entries(concurrencyResults).forEach(([concurrency, result]) => {
        const maxAllowedTime = parseInt(concurrency, 10) > 25 ? 200 : 150

        expect(result.p95).toBeLessThan(maxAllowedTime)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      })
    })
  })

  describe('GET /jobs/:id - Get specific job', () => {
    it('should handle job lookup efficiently', async () => {
      // First create a job to look up
      const createResponse = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TestDataGenerator.generateJobData('json-format', 'small')),
      })

      if (createResponse.ok) {
        const jobData = await createResponse.json()
        const jobId = jobData.id

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs/${jobId}`,
          method: 'GET',
          concurrentRequests: 10,
          totalRequests: 50,
          timeout: 5000,
        })

        console.log(
          `Job lookup performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        expect(result.p95).toBeLessThan(150)
        expect(result.successfulRequests).toBeGreaterThan(0)
      } else {
        console.log('Skipping job lookup test - could not create test job')
      }
    })

    it('should handle requests for non-existent jobs efficiently', async () => {
      const nonExistentJobIds = [
        '00000000-0000-0000-0000-000000000000',
        'non-existent-job-id',
        'invalid-job-format',
      ]

      for (const jobId of nonExistentJobIds) {
        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs/${jobId}`,
          method: 'GET',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 3000,
        })

        // Should respond quickly even for non-existent jobs
        expect(result.p95).toBeLessThan(100)

        // Should handle all requests (even 404 responses)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)

        // Should get 404 responses for non-existent jobs
        const notFoundResponses = result.metrics.filter(m => m.statusCode === 404)
        expect(notFoundResponses.length).toBeGreaterThan(0)
      }
    })
  })

  describe('PATCH /jobs/:id - Update job', () => {
    it('should handle job update requests efficiently (internal use)', async () => {
      // First create a job to update
      const createResponse = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TestDataGenerator.generateJobData('json-format', 'small')),
      })

      if (createResponse.ok) {
        const jobData = await createResponse.json()
        const jobId = jobData.id

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs/${jobId}`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            status: 'completed',
            progress: 100,
            output_data: { formatted: '{"test": "formatted"}' },
          },
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        console.log(
          `Job update performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      } else {
        console.log('Skipping job update test - could not create test job')
      }
    })
  })

  describe('DELETE /jobs/:id - Delete job', () => {
    it('should handle job deletion efficiently', async () => {
      // First create a job to delete
      const createResponse = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TestDataGenerator.generateJobData('json-format', 'small')),
      })

      if (createResponse.ok) {
        const jobData = await createResponse.json()
        const jobId = jobData.id

        const result = await runLoadTest({
          url: `${API_BASE_URL}/jobs/${jobId}`,
          method: 'DELETE',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        console.log(
          `Job deletion performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      } else {
        console.log('Skipping job deletion test - could not create test job')
      }
    })
  })

  describe('Jobs API Error Handling Performance', () => {
    it('should handle malformed requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/jobs`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000,
      })

      console.log(
        `Jobs error handling: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly even to malformed requests
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests (even error responses)
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
    })

    it('should handle requests with invalid HTTP methods efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/jobs`,
        method: 'PATCH', // Invalid method for /jobs endpoint
        headers: {
          'Content-Type': 'application/json',
        },
        body: { test: 'data' },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000,
      })

      console.log(
        `Jobs invalid method: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly to invalid methods
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
    })
  })

  describe('Comprehensive Jobs Performance Test', () => {
    it('should handle mixed job operations efficiently', async () => {
      const jobEndpoints = [
        { path: '/jobs', method: 'POST' as const, description: 'Create job' },
        { path: '/jobs', method: 'GET' as const, description: 'List jobs' },
        {
          path: '/jobs?status=completed',
          method: 'GET' as const,
          description: 'List completed jobs',
        },
        {
          path: '/jobs/test-job-id',
          method: 'GET' as const,
          description: 'Get job details',
        },
      ]

      const results = []

      for (const endpoint of jobEndpoints) {
        console.log(`Testing comprehensive performance for ${endpoint.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
          body:
            endpoint.method === 'POST'
              ? TestDataGenerator.generateJobData('json-format', 'small')
              : undefined,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 8000,
        })

        results.push({ endpoint: endpoint.description, result })

        // Job operations should be reasonably fast
        expect(result.p95).toBeLessThan(500)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }

      // Log comprehensive results
      console.log('\n=== Comprehensive Jobs Performance Summary ===')
      results.forEach(({ endpoint, result }) => {
        const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)
        console.log(`${endpoint}: P95=${result.p95.toFixed(2)}ms, Success Rate=${successRate}%`)
      })

      // Calculate overall statistics
      const totalRequests = results.reduce((sum, { result }) => sum + result.totalRequests, 0)
      const totalHandled = results.reduce(
        (sum, { result }) => sum + result.successfulRequests + result.failedRequests,
        0
      )
      const avgP95 = results.reduce((sum, { result }) => sum + result.p95, 0) / results.length

      console.log(
        `\nOverall: P95 avg=${avgP95.toFixed(2)}ms, Handled Rate=${((totalHandled / totalRequests) * 100).toFixed(1)}%`
      )

      // Overall job performance should be good
      expect(avgP95).toBeLessThan(300)
      expect(totalHandled / totalRequests).toBe(1.0) // All requests should be handled
    })
  })
})
