import { beforeAll, describe, expect, it } from 'vitest'
import { API_BASE_URL, USER_ENDPOINTS } from '../utils/endpoint-configs'
import {
  assertPerformanceRequirements,
  generatePerformanceReport,
  runConcurrencyTest,
  runLoadTest,
} from '../utils/performance-utils'

describe('Users API Performance Tests', () => {
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

  describe('GET /users/profile - Get user profile', () => {
    it('should handle unauthenticated profile requests efficiently', async () => {
      const endpoint = USER_ENDPOINTS.find(e => e.path === '/users/profile')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 15,
        totalRequests: 75,
        timeout: 3000,
      })

      console.log(
        `User profile performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Expect consistent 401 responses (unauthenticated)
      expect(result.p95).toBeLessThan(endpoint.maxP95ResponseTime!)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBe(result.totalRequests)

      // Response times should be very consistent
      expect(result.maxResponseTime - result.minResponseTime).toBeLessThan(100)
    })

    it('should maintain performance under high concurrency for profile requests', async () => {
      const endpoint = USER_ENDPOINTS.find(e => e.path === '/users/profile')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const concurrencyResults = await runConcurrencyTest(
        `${API_BASE_URL}${endpoint.path}`,
        {
          method: endpoint.method,
          totalRequests: 60,
        },
        [1, 10, 25, 50, 75]
      )

      console.log('\nConcurrency test results for user profile:')
      console.log(generatePerformanceReport(concurrencyResults))

      // Check that all concurrency levels meet requirements
      Object.entries(concurrencyResults).forEach(([concurrency, result]) => {
        const maxAllowedTime = parseInt(concurrency, 10) > 50 ? 75 : endpoint.maxP95ResponseTime!

        expect(result.p95).toBeLessThan(maxAllowedTime)

        // All should return consistent 401 responses
        const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
        expect(statusCode401Count).toBe(result.totalRequests)

        // Even under high load, response times should be reasonable
        expect(result.maxResponseTime).toBeLessThan(150)
      })
    })
  })

  describe('PUT /users/profile - Update user profile', () => {
    it('should handle profile update requests efficiently (should fail gracefully without auth)', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/users/profile`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: 'Test User',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Profile update performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should return 401 consistently without authentication
      expect(result.p95).toBeLessThan(100)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBeGreaterThan(0)
    })

    it('should handle different profile update payload sizes efficiently', async () => {
      const payloadSizes = [
        { name: 'small', data: { name: 'Test User' } },
        {
          name: 'medium',
          data: {
            name: 'Test User',
            preferences: { theme: 'dark', language: 'en', timezone: 'UTC' },
          },
        },
        {
          name: 'large',
          data: {
            name: 'Test User',
            preferences: {
              theme: 'dark',
              language: 'en',
              timezone: 'UTC',
              notifications: {
                email: true,
                push: false,
                sms: true,
                frequency: 'daily',
                categories: ['updates', 'security', 'marketing'],
              },
              ui: {
                sidebarCollapsed: false,
                compactMode: true,
                fontSize: 'medium',
                colorScheme: 'blue',
                customLayouts: ['dashboard', 'analytics'],
              },
              api: {
                defaultTimeout: 30000,
                retryAttempts: 3,
                paginationSize: 50,
                exportFormat: 'json',
              },
            },
            metadata: {
              lastSeen: Date.now(),
              loginCount: 42,
              features: ['beta-testing', 'advanced-analytics'],
              subscription: {
                tier: 'pro',
                since: '2023-01-01',
                autoRenew: true,
              },
            },
          },
        },
      ]

      for (const payloadSize of payloadSizes) {
        console.log(`Testing ${payloadSize.name} profile update payload...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/users/profile`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payloadSize.data,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        console.log(
          `${payloadSize.name} payload: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )

        // Response time should remain reasonable even for larger payloads
        expect(result.p95).toBeLessThan(150)

        // Should handle all requests (even error responses)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }
    })
  })

  describe('GET /users/stats - Get user statistics', () => {
    it('should handle stats requests efficiently (should fail gracefully without auth)', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/users/stats`,
        method: 'GET',
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `User stats performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should return 401 consistently without authentication
      expect(result.p95).toBeLessThan(100)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBeGreaterThan(0)
    })
  })

  describe('POST /users/subscription - Update subscription', () => {
    it('should handle subscription update requests efficiently (should fail gracefully without auth)', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/users/subscription`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          tier: 'pro',
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Subscription update performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should return 401 consistently without authentication
      expect(result.p95).toBeLessThan(100)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBeGreaterThan(0)
    })
  })

  describe('GET /users/:id - Get public user information', () => {
    it('should handle public user info requests efficiently', async () => {
      const endpoint = USER_ENDPOINTS.find(e => e.path === '/users/test-user-id')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 20,
        totalRequests: 100,
        timeout: 3000,
      })

      console.log(
        `Public user info performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      const performanceCheck = assertPerformanceRequirements(result, {
        maxP95ResponseTime: endpoint.maxP95ResponseTime,
        minSuccessRate: endpoint.minSuccessRate,
      })

      expect(
        performanceCheck.passed,
        `Public user info failed: ${performanceCheck.failures.join(', ')}`
      ).toBe(true)
      expect(result.successfulRequests).toBeGreaterThan(0)
    })

    it('should handle requests for different user IDs efficiently', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'test-user-id', 'admin-user']
      const results = []

      for (const userId of userIds) {
        const result = await runLoadTest({
          url: `${API_BASE_URL}/users/${userId}`,
          method: 'GET',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 3000,
        })

        results.push({ userId, result })

        // All user ID requests should be fast
        expect(result.p95).toBeLessThan(150)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }

      console.log('\n=== User ID Lookup Performance Summary ===')
      results.forEach(({ userId, result }) => {
        const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1)
        console.log(`User ${userId}: P95=${result.p95.toFixed(2)}ms, Success Rate=${successRate}%`)
      })

      // Average performance across all user IDs should be good
      const avgP95 = results.reduce((sum, { result }) => sum + result.p95, 0) / results.length
      expect(avgP95).toBeLessThan(120)
    })

    it('should handle invalid user ID formats gracefully', async () => {
      const invalidUserIds = [
        '',
        'invalid',
        'user-with-special-chars!',
        'user/with/slashes',
        'user@with@symbols',
      ]

      for (const invalidUserId of invalidUserIds) {
        const result = await runLoadTest({
          url: `${API_BASE_URL}/users/${invalidUserId}`,
          method: 'GET',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 3000,
        })

        // Should handle invalid user IDs quickly
        expect(result.p95).toBeLessThan(100)

        // Should handle all requests (even error responses)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }
    })
  })

  describe('GET /users/admin/dashboard - Admin dashboard', () => {
    it('should handle admin dashboard requests efficiently (should fail gracefully without auth)', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/users/admin/dashboard`,
        method: 'GET',
        concurrentRequests: 5,
        totalRequests: 25,
        timeout: 5000,
      })

      console.log(
        `Admin dashboard performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should return 401 consistently without authentication
      expect(result.p95).toBeLessThan(100)

      const statusCode401Count = result.metrics.filter(m => m.statusCode === 401).length
      expect(statusCode401Count).toBeGreaterThan(0)
    })
  })

  describe('Users API Error Handling Performance', () => {
    it('should handle malformed requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/users/profile`,
        method: 'POST', // Wrong method
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          invalid: 'data',
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000,
      })

      console.log(
        `Users error handling: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly even to malformed requests
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests (even error responses)
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
    })

    it('should handle requests with invalid JSON efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/users/profile`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000,
      })

      console.log(
        `Users invalid JSON: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly to invalid JSON
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
    })
  })

  describe('Comprehensive Users Performance Test', () => {
    it('should handle mixed user operations efficiently', async () => {
      const userEndpoints = [
        {
          path: '/users/profile',
          method: 'GET' as const,
          description: 'Get profile',
          auth: true,
        },
        {
          path: '/users/profile',
          method: 'PUT' as const,
          description: 'Update profile',
          auth: true,
        },
        {
          path: '/users/stats',
          method: 'GET' as const,
          description: 'Get stats',
          auth: true,
        },
        {
          path: '/users/subscription',
          method: 'POST' as const,
          description: 'Update subscription',
          auth: true,
        },
        {
          path: '/users/test-user-id',
          method: 'GET' as const,
          description: 'Public user info',
          auth: false,
        },
        {
          path: '/users/admin/dashboard',
          method: 'GET' as const,
          description: 'Admin dashboard',
          auth: true,
        },
      ]

      const results = []

      for (const endpoint of userEndpoints) {
        console.log(`Testing comprehensive performance for ${endpoint.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers: endpoint.method !== 'GET' ? { 'Content-Type': 'application/json' } : {},
          body: endpoint.method !== 'GET' ? { test: 'data' } : undefined,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        results.push({ endpoint: endpoint.description, result })

        // User endpoints should be very fast
        expect(result.p95).toBeLessThan(150)
        expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests)
      }

      // Log comprehensive results
      console.log('\n=== Comprehensive Users Performance Summary ===')
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

      // Overall user performance should be excellent
      expect(avgP95).toBeLessThan(100)
      expect(totalHandled / totalRequests).toBe(1.0) // All requests should be handled
    })
  })
})
