import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  runLoadTest,
  runConcurrencyTest,
  assertPerformanceRequirements,
  generatePerformanceReport,
} from '../utils/performance-utils'
import {
  UPLOAD_ENDPOINTS,
  API_BASE_URL,
  TestDataGenerator,
} from '../utils/endpoint-configs'

describe('Upload API Performance Tests', () => {
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

  describe('POST /upload/sign - Get upload presigned URL', () => {
    it('should generate presigned URLs efficiently under load', async () => {
      const endpoint = UPLOAD_ENDPOINTS.find(e => e.path === '/upload/sign')
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        headers: endpoint.headers,
        body: TestDataGenerator.generateUploadData('test.json', 1024),
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Upload sign performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      const performanceCheck = assertPerformanceRequirements(result, {
        maxP95ResponseTime: endpoint.maxP95ResponseTime,
        minSuccessRate: endpoint.minSuccessRate,
      })

      expect(
        performanceCheck.passed,
        `Upload sign failed: ${performanceCheck.failures.join(', ')}`
      ).toBe(true)
      expect(result.successfulRequests).toBeGreaterThan(0)
    })

    it('should handle different file sizes efficiently', async () => {
      const fileSizes = [
        { size: 1024, name: '1KB', description: 'small file' },
        { size: 10240, name: '10KB', description: 'medium file' },
        { size: 102400, name: '100KB', description: 'large file' },
        { size: 1048576, name: '1MB', description: 'very large file' },
      ]

      for (const fileInfo of fileSizes) {
        console.log(
          `Testing upload signing for ${fileInfo.description} (${fileInfo.name})...`
        )

        const result = await runLoadTest({
          url: `${API_BASE_URL}/upload/sign`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: TestDataGenerator.generateUploadData(
            `test-${fileInfo.name}.json`,
            fileInfo.size
          ),
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        // File size shouldn't significantly impact presigned URL generation time
        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests).toBeGreaterThan(0)

        console.log(
          `${fileInfo.name}: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        )
      }
    })

    it('should handle different file types efficiently', async () => {
      const fileTypes = [
        { filename: 'test.json', content_type: 'application/json' },
        { filename: 'data.csv', content_type: 'text/csv' },
        { filename: 'config.xml', content_type: 'application/xml' },
        { filename: 'readme.txt', content_type: 'text/plain' },
      ]

      for (const fileType of fileTypes) {
        console.log(`Testing upload signing for ${fileType.content_type}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/upload/sign`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: TestDataGenerator.generateUploadData(fileType.filename, 1024),
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        // All file types should be handled efficiently
        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests).toBeGreaterThan(0)
      }
    })

    it('should handle invalid upload requests gracefully', async () => {
      const invalidRequests = [
        {
          name: 'missing filename',
          data: { content_type: 'application/json', size: 1024 },
        },
        {
          name: 'missing content_type',
          data: { filename: 'test.json', size: 1024 },
        },
        {
          name: 'missing size',
          data: { filename: 'test.json', content_type: 'application/json' },
        },
        {
          name: 'invalid size',
          data: {
            filename: 'test.json',
            content_type: 'application/json',
            size: -1,
          },
        },
        {
          name: 'size too large',
          data: {
            filename: 'test.json',
            content_type: 'application/json',
            size: 100 * 1024 * 1024,
          },
        },
        {
          name: 'invalid content type',
          data: {
            filename: 'test.exe',
            content_type: 'application/x-executable',
            size: 1024,
          },
        },
        {
          name: 'filename too long',
          data: {
            filename: 'a'.repeat(300),
            content_type: 'application/json',
            size: 1024,
          },
        },
      ]

      for (const invalidRequest of invalidRequests) {
        console.log(`Testing invalid upload request: ${invalidRequest.name}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/upload/sign`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: invalidRequest.data,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 3000,
        })

        // Should respond quickly even to invalid requests
        expect(result.p95).toBeLessThan(100)

        // Should handle all requests (even error responses)
        expect(result.successfulRequests + result.failedRequests).toBe(
          result.totalRequests
        )

        // Should get appropriate error status codes
        const errorResponses = result.metrics.filter(m => m.statusCode >= 400)
        expect(errorResponses.length).toBeGreaterThan(0)
      }
    })
  })

  describe('GET /upload/status/:fileId - Get upload status', () => {
    it('should handle upload status requests efficiently', async () => {
      const endpoint = UPLOAD_ENDPOINTS.find(
        e => e.path === '/upload/status/test-file-id'
      )
      if (!endpoint) throw new Error('Endpoint configuration not found')

      const result = await runLoadTest({
        url: `${API_BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        concurrentRequests: 20,
        totalRequests: 100,
        timeout: 3000,
      })

      console.log(
        `Upload status performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Expect consistent 404 responses for non-existent file ID
      expect(result.p95).toBeLessThan(endpoint.maxP95ResponseTime!)

      const statusCode404Count = result.metrics.filter(
        m => m.statusCode === 404
      ).length
      expect(statusCode404Count).toBeGreaterThan(0)

      // Response times should be very consistent
      expect(result.maxResponseTime - result.minResponseTime).toBeLessThan(100)
    })

    it('should handle different file ID formats efficiently', async () => {
      const fileIdFormats = [
        { id: 'test-file-id', description: 'simple ID' },
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          description: 'UUID format',
        },
        { id: 'upload_12345', description: 'prefixed ID' },
        { id: '', description: 'empty ID' },
      ]

      for (const fileFormat of fileIdFormats) {
        console.log(`Testing upload status for ${fileFormat.description}...`)

        const result = await runLoadTest({
          url: `${API_BASE_URL}/upload/status/${fileFormat.id}`,
          method: 'GET',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 3000,
        })

        // Should respond quickly regardless of file ID format
        expect(result.p95).toBeLessThan(100)

        // Should handle all requests
        expect(result.successfulRequests + result.failedRequests).toBe(
          result.totalRequests
        )
      }
    })

    it('should maintain performance under high concurrency for status checks', async () => {
      const concurrencyResults = await runConcurrencyTest(
        `${API_BASE_URL}/upload/status/test-file-id`,
        {
          method: 'GET',
          totalRequests: 60,
        },
        [1, 10, 25, 50, 100]
      )

      console.log('\nConcurrency test results for upload status:')
      console.log(generatePerformanceReport(concurrencyResults))

      // Check that all concurrency levels meet requirements
      Object.entries(concurrencyResults).forEach(([concurrency, result]) => {
        const maxAllowedTime =
          parseInt(concurrency) > 50 ? 75 : endpoint.maxP95ResponseTime!

        expect(result.p95).toBeLessThan(maxAllowedTime)
        expect(result.successfulRequests + result.failedRequests).toBe(
          result.totalRequests
        )
      })
    })
  })

  describe('POST /upload/confirm/:fileId - Confirm upload completion', () => {
    it('should handle upload confirmation requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/upload/confirm/test-file-id`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          checksum: 'test-checksum-123',
        },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Upload confirm performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly even for non-existent file
      expect(result.p95).toBeLessThan(150)

      // Should handle all requests (even 404 responses)
      expect(result.successfulRequests + result.failedRequests).toBe(
        result.totalRequests
      )
    })

    it('should handle confirmation requests with different payload sizes', async () => {
      const payloadSizes = [
        { name: 'minimal', data: {} },
        { name: 'with checksum', data: { checksum: 'test-checksum-123' } },
        {
          name: 'with metadata',
          data: {
            checksum: 'test-checksum-123',
            metadata: {
              original_name: 'test.json',
              uploaded_by: 'test-user',
              upload_time: Date.now(),
            },
          },
        },
      ]

      for (const payload of payloadSizes) {
        console.log(
          `Testing upload confirmation with ${payload.name} payload...`
        )

        const result = await runLoadTest({
          url: `${API_BASE_URL}/upload/confirm/test-file-id`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload.data,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        // Payload size shouldn't significantly impact confirmation time
        expect(result.p95).toBeLessThan(150)
        expect(result.successfulRequests + result.failedRequests).toBe(
          result.totalRequests
        )
      }
    })
  })

  describe('GET /upload/download/:fileId - Get download URL', () => {
    it('should handle download URL requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/upload/download/test-file-id`,
        method: 'GET',
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Download URL performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly even for non-existent file
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests (even 404 responses)
      expect(result.successfulRequests + result.failedRequests).toBe(
        result.totalRequests
      )
    })
  })

  describe('DELETE /upload/:fileId - Delete upload', () => {
    it('should handle upload deletion requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/upload/test-file-id`,
        method: 'DELETE',
        concurrentRequests: 5,
        totalRequests: 25,
        timeout: 5000,
      })

      console.log(
        `Upload deletion performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly even for non-existent file
      expect(result.p95).toBeLessThan(150)

      // Should handle all requests (even 404 responses)
      expect(result.successfulRequests + result.failedRequests).toBe(
        result.totalRequests
      )
    })
  })

  describe('GET /upload/ - List uploads', () => {
    it('should handle upload listing requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/upload/`,
        method: 'GET',
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 5000,
      })

      console.log(
        `Upload listing performance: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly
      expect(result.p95).toBeLessThan(200)

      // Should handle all requests
      expect(result.successfulRequests + result.failedRequests).toBe(
        result.totalRequests
      )
    })

    it('should handle filtered upload listings efficiently', async () => {
      const filters = [
        '?status=completed',
        '?status=uploading',
        '?limit=10',
        '?limit=5&offset=10',
      ]

      for (const filter of filters) {
        const result = await runLoadTest({
          url: `${API_BASE_URL}/upload/${filter}`,
          method: 'GET',
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests + result.failedRequests).toBe(
          result.totalRequests
        )
      }
    })
  })

  describe('Upload API Error Handling Performance', () => {
    it('should handle malformed requests efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/upload/sign`,
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
        `Upload error handling: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly even to malformed requests
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests (even error responses)
      expect(result.successfulRequests + result.failedRequests).toBe(
        result.totalRequests
      )
    })

    it('should handle requests with invalid HTTP methods efficiently', async () => {
      const result = await runLoadTest({
        url: `${API_BASE_URL}/upload/`,
        method: 'PATCH', // Invalid method for /upload/ endpoint
        headers: {
          'Content-Type': 'application/json',
        },
        body: { test: 'data' },
        concurrentRequests: 10,
        totalRequests: 50,
        timeout: 3000,
      })

      console.log(
        `Upload invalid method: P95=${result.p95.toFixed(2)}ms, Success Rate=${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      )

      // Should respond quickly to invalid methods
      expect(result.p95).toBeLessThan(100)

      // Should handle all requests
      expect(result.successfulRequests + result.failedRequests).toBe(
        result.totalRequests
      )
    })
  })

  describe('Comprehensive Upload Performance Test', () => {
    it('should handle mixed upload operations efficiently', async () => {
      const uploadEndpoints = [
        {
          path: '/upload/sign',
          method: 'POST' as const,
          description: 'Sign upload',
          body: TestDataGenerator.generateUploadData('test.json', 1024),
        },
        {
          path: '/upload/status/test-file-id',
          method: 'GET' as const,
          description: 'Check status',
        },
        {
          path: '/upload/download/test-file-id',
          method: 'GET' as const,
          description: 'Get download URL',
        },
        {
          path: '/upload/',
          method: 'GET' as const,
          description: 'List uploads',
        },
      ]

      const results = []

      for (const endpoint of uploadEndpoints) {
        console.log(
          `Testing comprehensive performance for ${endpoint.description}...`
        )

        const result = await runLoadTest({
          url: `${API_BASE_URL}${endpoint.path}`,
          method: endpoint.method,
          headers:
            endpoint.method === 'POST'
              ? { 'Content-Type': 'application/json' }
              : {},
          body: endpoint.body,
          concurrentRequests: 5,
          totalRequests: 25,
          timeout: 5000,
        })

        results.push({ endpoint: endpoint.description, result })

        // Upload operations should be fast
        expect(result.p95).toBeLessThan(200)
        expect(result.successfulRequests + result.failedRequests).toBe(
          result.totalRequests
        )
      }

      // Log comprehensive results
      console.log('\n=== Comprehensive Upload Performance Summary ===')
      results.forEach(({ endpoint, result }) => {
        const successRate = (
          (result.successfulRequests / result.totalRequests) *
          100
        ).toFixed(1)
        console.log(
          `${endpoint}: P95=${result.p95.toFixed(2)}ms, Success Rate=${successRate}%`
        )
      })

      // Calculate overall statistics
      const totalRequests = results.reduce(
        (sum, { result }) => sum + result.totalRequests,
        0
      )
      const totalHandled = results.reduce(
        (sum, { result }) =>
          sum + result.successfulRequests + result.failedRequests,
        0
      )
      const avgP95 =
        results.reduce((sum, { result }) => sum + result.p95, 0) /
        results.length

      console.log(
        `\nOverall: P95 avg=${avgP95.toFixed(2)}ms, Handled Rate=${((totalHandled / totalRequests) * 100).toFixed(1)}%`
      )

      // Overall upload performance should be excellent
      expect(avgP95).toBeLessThan(150)
      expect(totalHandled / totalRequests).toBe(1.0) // All requests should be handled
    })
  })
})
