import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLoadTest, runConcurrencyTest, assertPerformanceRequirements, generatePerformanceReport } from '../utils/performance-utils'
import { AUTH_ENDPOINTS, API_BASE_URL, TestDataGenerator } from '../utils/endpoint-configs'

describe('Auth API Performance Tests', () => {
  beforeAll(async () => {
    // Ensure the API server is running before tests
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      if (!response.ok) {
        throw new Error('API server is not responding correctly')
      }
      console.log('✅ API server is running and healthy')
    } catch (error) {
      console.error('❌ API server is not available. Please start the server before running performance tests.')
      throw error
    }
  })

  describe('GET /auth/validate - Session validation', () => {
    it('should handle unauthenticated session validation efficiently', async () => {
      const endpoint = AUTH_ENDPOINTS.find(e => e.path === '/auth/validate')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 20,
        totalRequests: 100,
        timeout: 3000
      })

      console.log(`Auth validation performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`)

      // For auth validation, we expect consistent 401 responses (which are "successful" from a performance perspective)
      expect(result.p95).toBeLessThan(endpoint.maxP95ResponseTime!)

      // All requests should return 401 (unauthenticated) consistently
      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBe(result.totalRequests)

      // Response times should be very consistent for session validation
      expect(result.maxResponseTime - result.minResponseTime).toBeLessThan(100)
    })

    it('should maintain performance under high concurrency for session validation', async () => {
      const endpoint = AUTH_ENDPOINTS.find(e => e.path === '/auth/validate')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const concurrencyResults = await runConcurrencyTest(
        `${API_BASE_URL}${endpoint.path}`,
        {
          method: endpoint.method,
          totalRequests: 60
        },
        [1, 10, 25, 50, 100]
      )

      console.log('\nConcurrency test results for auth validation:')
      console.log(generatePerformanceReport(concurrencyResults))

      // Check that all concurrency levels meet requirements
      Object.entries(concurrencyResults).forEach(([concurrency, result]) => {
        // Allow slightly higher response times under very high concurrency
        const maxAllowedTime = parseInt(concurrency) > 50 ? 100 : endpoint.maxP95ResponseTime!

        expect(result.p95).toBeLessThan(maxAllowedTime)

        // All should return consistent 401 responses
        const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
        expect(statusCode401Count).toBe(result.totalRequests)

        // Even under high load, response times should be reasonable
        expect(result.maxResponseTime).toBeLessThan(200)
      })
    })
  })

  describe('POST /auth/refresh - Token refresh', () => {
    it('should handle token refresh requests efficiently (should fail gracefully without auth)', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/auth/refresh`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000
      })

      console.log(`Auth refresh performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`)

      // Should return 401 consistently without authentication
      expect(result.p95).toBeLessThan(100)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBeGreaterThan(0) // Should get 401 for missing auth
    })
  })

  describe('POST /auth/logout - Logout', () => {
    it('should handle logout requests efficiently (should fail gracefully without auth)', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/auth/logout`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000
      })

      console.log(`Auth logout performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`)

      // Should return 401 consistently without authentication
      expect(result.p95).toBeLessThan(100)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBeGreaterThan(0) // Should get 401 for missing auth
    })
  })

  describe('Auth API Rate Limiting', () => {
    it('should handle burst requests without performance degradation', async () => {
      const endpoint = AUTH_ENDPOINTS.find(e => e.path === '/auth/validate')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      // Test burst of requests in quick succession
      const burstResults = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 50,
        totalRequests: 50,
        timeout: 5000
      })

      console.log(`Auth burst test: P95=${burstResults.p95.toFixed(2)}ms, Success Rate=${((burstResults.successfulRequests / burstResults.totalRequests) * 100).toFixed(1)}%`)

      // Even under burst load, should respond quickly
      expect(burstResults.p95).toBeLessThan(150)

      // Should handle all requests (either 401 or rate limited responses)
      expect(burstResults.successfulRequests + burstResults.failedRequests).toBe(burstResults.totalRequests)
    })

    it('should maintain consistent response times under sustained load', async () => {
      const endpoint = AUTH_ENDPOINTS.find(e => e.path === '/auth/validate')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      // Test sustained load over multiple batches
      const batchResults = []
      const numberOfBatches = 5

      for (let i = 0; i < numberOfBatches; i++) {
        const batchResult = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          concurrentRequests: 10,
          totalRequests: 20,
          timeout: 3000
        })

        batchResults.push(batchResult)

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`Sustained load test: ${numberOfBatches} batches completed`)

      // Response times should remain consistent across batches
      const p95Values = batchResults.map(r => r.p95)
      const maxP95 = Math.max(...p95Values)
      const minP95 = Math.min(...p95Values)

      // Performance shouldn't degrade significantly between batches
      expect(maxP95 - minP95).toBeLessThan(50)
      expect(maxP95).toBeLessThan(endpoint.maxP95ResponseTime!)

      // All batches should have high success rate (consistent 401 responses)
      batchResults.forEach((result, index) => {
        const successRate = result.successfulRequests / result.totalRequests
        expect(successRate).toBeGreaterThan(0.95)
        console.log(`Batch ${index + 1}: P95=${result.p95.toFixed(2)}ms, Success Rate=${(successRate * 100).toFixed(1)}%`)
      })
    })
  })

  describe('Auth Error Handling Performance', () => {
    it('should handle malformed requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/auth/validate`,
        method: 'POST', // Wrong method for this endpoint
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          invalid: 'data'
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000
      })

      console.log(`Auth error handling: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`)

      // Should respond quickly even to malformed requests
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests (even error responses)
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
    })

    it('should handle requests with invalid headers efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/auth/validate`,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'invalid/content-type'
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000
      })

      console.log(`Auth invalid headers: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`)

      // Should respond quickly to invalid headers
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
    })
  })

  describe('Comprehensive Auth Performance Test', () => {
    it('should handle mixed auth operations efficiently', async () => {
      const authEndpoints = [
        { path: '/auth/validate', method: 'GET' as const, description: 'Session validation' },
        { path: '/auth/refresh', method: 'POST' as const, description: 'Token refresh' },
        { path: '/auth/logout', method: 'POST' as const, description: 'Logout' }
      ]

      const results = []

      for (const endpoint of authEndpoints) {
        console.log(`Testing comprehensive performance for ${endpoint.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
          body: endpoint.method === 'POST' ? {} : undefined,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000
        })

        results.push({ endpoint: endpoint.description, result })

        // Auth endpoints should be very fast
        expect(result.p95).toBeLessThan(150)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }

      // Log comprehensive results
      console.log('\n=== Comprehensive Auth Performance Summary ===')
      results.forEach(({ endpoint, result }) => {
        const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)
        console.log(`${endpoint}: P95=${result.p95.toFixed(2)}ms, Success Rate=${successRate}%`)
      })

      // Calculate overall statistics
      const totalRequests = results.reduce((sum, { result }) => sum + result.totalRequests, 0)
      const totalHandled = results.reduce((sum, { result }) => sum + result.successfulRequests + result.failedRequests, 0)
      const avgP95 = results.reduce((sum, { result }) => sum + result.p95, 0) / results.length

      console.log(`\nOverall: P95 avg=${avgP95.toFixed(2)}ms, Handled Rate=${((totalHandled / totalRequests) * 100).toFixed(1)}%`)

      // Overall auth performance should be excellent
      expect(avgP95).toBeLessThan(100)
      expect(totalHandled / totalRequests).toBe(1.0) // All requests should be handled
    })
  })
})
