/**
 * File Upload/Download Load Testing
 * Tests system behavior under concurrent file operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLoadTest } from '../../performance/utils/performance-utils'
import { TestDataGenerator } from '../../performance/utils/endpoint-configs'
import { CONCURRENT_USER_SCENARIOS } from '../config/load-test-config'
import { SystemResourceMonitor } from '../utils/resource-monitor'
import { LoadTestReporter } from '../utils/load-test-reporter'
import { LoadTestReport } from '../config/load-test-config'

describe('File Upload/Download Load Tests', () => {
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
    await reporter.generateConsolidatedReport(testReports, 'file-operations-tests')

    console.log(`\n=== File Operations Load Test Summary ===`)
    console.log(`Total scenarios executed: ${testReports.length}`)
    console.log(`All reports saved to: ${reporter.getOutputDirectory()}`)
  })

  describe('Concurrent File Upload Tests', () => {
    it('should handle concurrent file uploads (small files)', async () => {
      console.log('\n📤 Testing concurrent small file uploads...')

      const concurrentUsers = 25
      const filesPerUser = 5
      const totalRequests = concurrentUsers * filesPerUser

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        const fileSize = 1024 + Math.floor(Math.random() * 9216) // 1KB - 10KB
        const fileName = `test-file-${i}.json`
        const uploadData = TestDataGenerator.generateUploadData(fileName, fileSize)

        requests.push({
          url: `${baseUrl}/upload/sign`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadData)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateFileOperationsReport('small-file-uploads', result, {
        maxP95ResponseTime: 1000,
        minSuccessRate: 0.95,
        minThroughput: 50,
        maxErrorRate: 0.05
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.95)
      expect(report.summary.p95ResponseTime).toBeLessThan(1000)

      console.log('✅ Small file uploads test completed successfully')
    })

    it('should handle concurrent file uploads (medium files)', async () => {
      console.log('\n📤 Testing concurrent medium file uploads...')

      const concurrentUsers = 15
      const filesPerUser = 3
      const totalRequests = concurrentUsers * filesPerUser

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        const fileSize = 10240 + Math.floor(Math.random() * 1047552) // 10KB - 1MB
        const fileName = `test-file-${i}.json`
        const uploadData = TestDataGenerator.generateUploadData(fileName, fileSize)

        requests.push({
          url: `${baseUrl}/upload/sign`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadData)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateFileOperationsReport('medium-file-uploads', result, {
        maxP95ResponseTime: 2000,
        minSuccessRate: 0.90,
        minThroughput: 30,
        maxErrorRate: 0.10
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.90)
      expect(report.summary.p95ResponseTime).toBeLessThan(2000)

      console.log('✅ Medium file uploads test completed successfully')
    })

    it('should handle concurrent file uploads (large files)', async () => {
      console.log('\n📤 Testing concurrent large file uploads...')

      const concurrentUsers = 5 // Reduced for large files
      const filesPerUser = 2
      const totalRequests = concurrentUsers * filesPerUser

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        const fileSize = 1048576 + Math.floor(Math.random() * 4194304) // 1MB - 5MB
        const fileName = `test-file-${i}.json`
        const uploadData = TestDataGenerator.generateUploadData(fileName, fileSize)

        requests.push({
          url: `${baseUrl}/upload/sign`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadData)
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateFileOperationsReport('large-file-uploads', result, {
        maxP95ResponseTime: 5000,
        minSuccessRate: 0.85,
        minThroughput: 10,
        maxErrorRate: 0.15
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.85)
      expect(report.summary.p95ResponseTime).toBeLessThan(5000)

      console.log('✅ Large file uploads test completed successfully')
    })
  })

  describe('Concurrent File Download Tests', () => {
    it('should handle concurrent file downloads', async () => {
      console.log('\n📥 Testing concurrent file downloads...')

      // First, upload some files to download
      const uploadRequests = []
      const uploadedFileIds = []

      for (let i = 0; i < 10; i++) {
        const fileName = `download-test-${i}.json`
        const uploadData = TestDataGenerator.generateUploadData(fileName, 10240)

        uploadRequests.push({
          url: `${baseUrl}/upload/sign`,
          method: 'POST' as const,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadData)
        })
      }

      // Upload files
      const uploadResults = await runConcurrentRequests(uploadRequests, 5)

      // Simulate successful uploads and get file IDs
      for (let i = 0; i < 10; i++) {
        uploadedFileIds.push(`file-${i}-${Date.now()}`)
      }

      // Test concurrent downloads
      const concurrentUsers = 20
      const downloadsPerUser = 3
      const totalDownloadRequests = concurrentUsers * downloadsPerUser

      const downloadRequests = []

      for (let i = 0; i < totalDownloadRequests; i++) {
        const fileId = uploadedFileIds[i % uploadedFileIds.length]
        downloadRequests.push({
          url: `${baseUrl}/download/${fileId}`,
          method: 'GET' as const,
          headers: {}
        })
      }

      const downloadResult = await runConcurrentRequests(downloadRequests, concurrentUsers)

      const report = await generateFileOperationsReport('file-downloads', downloadResult, {
        maxP95ResponseTime: 1500,
        minSuccessRate: 0.95,
        minThroughput: 40,
        maxErrorRate: 0.05
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.95)
      expect(report.summary.p95ResponseTime).toBeLessThan(1500)

      console.log('✅ File downloads test completed successfully')
    })

    it('should handle concurrent file status checks', async () => {
      console.log('\n📊 Testing concurrent file status checks...')

      const concurrentUsers = 50
      const checksPerUser = 10
      const totalRequests = concurrentUsers * checksPerUser

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        const fileId = `status-check-${i % 20}` // Cycle through 20 different file IDs
        requests.push({
          url: `${baseUrl}/upload/status/${fileId}`,
          method: 'GET' as const,
          headers: {}
        })
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateFileOperationsReport('file-status-checks', result, {
        maxP95ResponseTime: 300,
        minSuccessRate: 0.98,
        minThroughput: 100,
        maxErrorRate: 0.02
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.98)
      expect(report.summary.p95ResponseTime).toBeLessThan(300)

      console.log('✅ File status checks test completed successfully')
    })
  })

  describe('Mixed File Operations Load Tests', () => {
    it('should handle mixed concurrent file operations', async () => {
      console.log('\n🔄 Testing mixed concurrent file operations...')

      const concurrentUsers = 30
      const operationsPerUser = 8
      const totalRequests = concurrentUsers * operationsPerUser

      const requests = []
      const operationTypes = [
        { type: 'upload', weight: 0.4 },
        { type: 'download', weight: 0.3 },
        { type: 'status', weight: 0.2 },
        { type: 'delete', weight: 0.1 }
      ]

      for (let i = 0; i < totalRequests; i++) {
        const operation = selectWeightedOperation(operationTypes)
        let request

        switch (operation.type) {
          case 'upload':
            const uploadData = TestDataGenerator.generateUploadData(
              `mixed-file-${i}.json`,
              10240 + Math.floor(Math.random() * 51200)
            )
            request = {
              url: `${baseUrl}/upload/sign`,
              method: 'POST' as const,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uploadData)
            }
            break

          case 'download':
            request = {
              url: `${baseUrl}/download/file-${i % 10}`,
              method: 'GET' as const,
              headers: {}
            }
            break

          case 'status':
            request = {
              url: `${baseUrl}/upload/status/file-${i % 10}`,
              method: 'GET' as const,
              headers: {}
            }
            break

          case 'delete':
            request = {
              url: `${baseUrl}/upload/file-${i % 10}`,
              method: 'DELETE' as const,
              headers: {}
            }
            break
        }

        requests.push(request)
      }

      const result = await runConcurrentRequests(requests, concurrentUsers)

      const report = await generateFileOperationsReport('mixed-file-operations', result, {
        maxP95ResponseTime: 1200,
        minSuccessRate: 0.92,
        minThroughput: 60,
        maxErrorRate: 0.08
      })

      testReports.push(report)

      expect(report.summary.successRate).toBeGreaterThan(0.92)
      expect(report.summary.p95ResponseTime).toBeLessThan(1200)

      console.log('✅ Mixed file operations test completed successfully')
    })
  })

  describe('File Operations Stress Tests', () => {
    it('should handle sustained file operations load', async () => {
      console.log('\n⏱️ Testing sustained file operations load...')

      const duration = 60000 // 1 minute
      const concurrentUsers = 20
      const startTime = Date.now()
      const results = []

      while (Date.now() - startTime < duration) {
        const batchRequests = []

        for (let i = 0; i < concurrentUsers; i++) {
          const operationType = Math.random()
          let request

          if (operationType < 0.6) { // 60% uploads
            const uploadData = TestDataGenerator.generateUploadData(
              `sustained-${Date.now()}-${i}.json`,
              5120
            )
            request = {
              url: `${baseUrl}/upload/sign`,
              method: 'POST' as const,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uploadData)
            }
          } else if (operationType < 0.9) { // 30% status checks
            request = {
              url: `${baseUrl}/upload/status/sustained-${i}`,
              method: 'GET' as const,
              headers: {}
            }
          } else { // 10% downloads
            request = {
              url: `${baseUrl}/download/sustained-${i}`,
              method: 'GET' as const,
              headers: {}
            }
          }

          batchRequests.push(request)
        }

        const batchResult = await runConcurrentRequests(batchRequests, concurrentUsers)
        results.push({
          timestamp: Date.now(),
          p95: batchResult.p95,
          successRate: batchResult.successfulRequests / batchResult.totalRequests,
          throughput: batchResult.requestsPerSecond
        })

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Analyze sustained performance
      const p95Values = results.map(r => r.p95)
      const successRates = results.map(r => r.successRate)
      const throughputs = results.map(r => r.throughput)

      const avgP95 = p95Values.reduce((sum, p95) => sum + p95, 0) / p95Values.length
      const minSuccessRate = Math.min(...successRates)
      const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length

      console.log(`Sustained File Operations Results (${results.length} batches):`)
      console.log(`  Average P95: ${avgP95.toFixed(2)}ms`)
      console.log(`  Minimum Success Rate: ${(minSuccessRate * 100).toFixed(1)}%`)
      console.log(`  Average Throughput: ${avgThroughput.toFixed(0)} req/s`)

      // Performance should remain stable
      const maxP95 = Math.max(...p95Values)
      const minP95 = Math.min(...p95Values)
      const variance = (maxP95 - minP95) / avgP95

      expect(variance).toBeLessThan(0.6, 'Performance variance too high over sustained load')
      expect(minSuccessRate).toBeGreaterThan(0.85)

      // Generate endurance test report
      const enduranceReport = await generateFileOperationsReport('file-operations-endurance', {
        totalRequests: results.reduce((sum, r) => sum + concurrentUsers, 0),
        successfulRequests: results.reduce((sum, r) => sum + (r.successRate * concurrentUsers), 0),
        failedRequests: 0,
        averageResponseTime: avgP95,
        p95: avgP95,
        requestsPerSecond: avgThroughput
      }, {
        maxP95ResponseTime: 1500,
        minSuccessRate: 0.85,
        minThroughput: 40,
        maxErrorRate: 0.15
      })

      testReports.push(enduranceReport)

      console.log('✅ Sustained file operations load test completed successfully')
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
   * Select operation based on weights
   */
  function selectWeightedOperation(operations: Array<{ type: string; weight: number }>) {
    const total = operations.reduce((sum, op) => sum + op.weight, 0)
    let random = Math.random() * total

    for (const operation of operations) {
      random -= operation.weight
      if (random <= 0) {
        return operation
      }
    }

    return operations[0]
  }

  /**
   * Generate file operations report
   */
  async function generateFileOperationsReport(scenario: string, result: any, requirements: any): Promise<LoadTestReport> {
    const resourceMetrics = resourceMonitor.getMetrics()

    return {
      scenario,
      timestamp: new Date().toISOString(),
      duration: 0,
      users: 0,
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
        'file-operations': {
          requests: result.totalRequests,
          averageResponseTime: result.averageResponseTime,
          p95ResponseTime: result.p95,
          successRate: result.successfulRequests / result.totalRequests,
          errors: Object.entries(result.errors).map(([type, count]) => ({ type, count: count as number }))
        }
      },
      userBehavior: {},
      resources: resourceMetrics,
      bottlenecks: identifyFileBottlenecks(result, requirements),
      recommendations: generateFileRecommendations(result, requirements)
    }
  }

  /**
   * Identify file operations bottlenecks
   */
  function identifyFileBottlenecks(result: any, requirements: any) {
    const bottlenecks = []

    if (result.p95 > requirements.maxP95ResponseTime) {
      bottlenecks.push({
        type: 'endpoint' as const,
        target: 'file-operations',
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
        target: 'file-operations',
        metric: 'success_rate',
        value: successRate,
        threshold: requirements.minSuccessRate,
        severity: successRate < requirements.minSuccessRate * 0.8 ? 'critical' as const : 'high' as const
      })
    }

    return bottlenecks
  }

  /**
   * Generate file operations recommendations
   */
  function generateFileRecommendations(result: any, requirements: any) {
    const recommendations = []

    if (result.p95 > requirements.maxP95ResponseTime) {
      recommendations.push('Consider optimizing file processing algorithms or implementing file streaming')
    }

    if (result.averageResponseTime > 1000) {
      recommendations.push('Consider implementing asynchronous file processing for large files')
    }

    const errorCount = Object.values(result.errors).reduce((sum: number, count: any) => sum + count, 0)
    if (errorCount > result.totalRequests * 0.05) {
      recommendations.push('Review file validation and error handling mechanisms')
    }

    if (result.requestsPerSecond < requirements.minThroughput) {
      recommendations.push('Consider scaling file storage infrastructure or implementing CDN')
    }

    return recommendations
  }
})
